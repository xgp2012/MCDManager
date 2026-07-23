import Router from "@koa/router";
import Koa from "koa";
import { ROLE } from "../entity/user";
import { $t } from "../i18n";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import cardKeySystem from "../service/card_key_service";
import { logger } from "../service/log";
import { operationLogger } from "../service/operation_logger";
import { getUserUuid } from "../service/passport_service";
import RemoteRequest from "../service/remote_command";
import RemoteServiceSubsystem from "../service/remote_service";
import userSystem from "../service/user_service";

const router = new Router({ prefix: "/card_key" });

// Admin creates a new card key
router.post(
  "/",
  permission({ level: ROLE.ADMIN }),
  validator({
    body: {
      name: String,
      duration: Number,
      maxUsage: Number,
      expiredAt: String,
      config: Object
    }
  }),
  async (ctx: Koa.ParameterizedContext) => {
    const { name, duration, maxUsage, expiredAt, config, remarks } = ctx.request.body as any;
    const createdBy = ctx.session?.["uuid"] || "";

    operationLogger.log("card_key_create", {
      operator_ip: ctx.ip,
      operator_name: ctx.session?.["userName"],
      card_key_name: name
    });

    ctx.body = await cardKeySystem.create({
      name,
      config,
      duration,
      maxUsage: maxUsage || 1,
      createdBy,
      expiredAt,
      remarks: remarks || ""
    });
  }
);

// Admin lists all card keys
router.get(
  "/",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { page: Number, page_size: Number } }),
  async (ctx: Koa.ParameterizedContext) => {
    const page = Math.max(1, Number(ctx.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(ctx.query.page_size) || 10));

    const allKeys = cardKeySystem.getAll();
    const total = allKeys.length;
    const start = (page - 1) * pageSize;
    const data = allKeys.slice(start, start + pageSize);

    ctx.body = {
      total,
      page,
      pageSize,
      data
    };
  }
);

// Admin deletes a card key
router.del(
  "/",
  permission({ level: ROLE.ADMIN }),
  validator({ body: { uuid: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    const { uuid } = ctx.request.body as any;
    const cardKey = cardKeySystem.getCardKey(uuid);

    if (!cardKey) {
      ctx.throw(404, $t("TXT_CODE_cardKey.notFound") as string);
      return;
    }

    operationLogger.log("card_key_delete", {
      operator_ip: ctx.ip,
      operator_name: ctx.session?.["userName"],
      card_key_name: cardKey.name,
      card_key_code: cardKey.code
    });

    await cardKeySystem.delete(uuid);
    ctx.body = true;
  }
);

// User redeems a card key
router.post(
  "/redeem",
  permission({ level: ROLE.USER }),
  validator({ body: { code: String, daemonId: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    const code = String(ctx.request.body.code).toUpperCase().trim();
    const daemonId = String(ctx.request.body.daemonId);

    // Validate the card key
    const result = cardKeySystem.validateCode(code);
    if (!result.valid || !result.cardKey) {
      ctx.throw(400, result.message as string);
      return;
    }

    const cardKey = result.cardKey;
    const config = cardKey.config;
    const userUuid = getUserUuid(ctx);

    // Build instance payload for the daemon
    const endTime = Date.now() + cardKey.duration * 24 * 60 * 60 * 1000;
    const instanceName = config.instanceName || `Card-${cardKey.code}`;

    const payload: any = {
      processType: config.processType,
      instanceType: config.instanceType,
      nickname: instanceName,
      startCommand: config.startCommand || "",
      endTime
    };

    // Add docker-specific config if applicable
    if (config.processType === "docker") {
      payload.docker = {
        image: config.dockerImage || "",
        memory: config.dockerMemory || 1024,
        cpuUsage: config.dockerCpuUsage || 100,
        maxSpace: config.dockerMaxSpace || 10,
        ports: config.dockerPorts || [],
        env: [] as string[]
      };
    }

    // Create the instance on the daemon
    let remoteService;
    try {
      remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      if (!remoteService || !remoteService.available) {
        ctx.throw(400, $t("TXT_CODE_cardKey.daemonUnavailable") as string);
        return;
      }
    } catch {
      ctx.throw(400, $t("TXT_CODE_cardKey.daemonUnavailable") as string);
      return;
    }

    let newInstanceId: string;
    try {
      const daemonResult = await new RemoteRequest(remoteService).request("instance/new", payload);
      if (!daemonResult || !daemonResult.instanceUuid) {
        ctx.throw(500, $t("TXT_CODE_cardKey.createFailed") as string);
        return;
      }
      newInstanceId = daemonResult.instanceUuid;
    } catch (err: any) {
      ctx.throw(500, (err.message || $t("TXT_CODE_cardKey.createFailed")) as string);
      return;
    }

    // Mark the card key as used
    await cardKeySystem.redeemCode(code);

    // Assign the instance to the user
    try {
      const user = userSystem.getUserByUuid(userUuid);
      if (user) {
        const instances = user.instances || [];
        instances.push({
          instanceUuid: newInstanceId,
          daemonId
        });
        await userSystem.edit(userUuid, { instances });
      }
    } catch (err) {
      // Instance was created but couldn't assign to user - log and return partial success
      logger.warn($t("TXT_CODE_cardKey.assignFailed", { uuid: newInstanceId }));
    }

    operationLogger.log("card_key_redeem", {
      operator_ip: ctx.ip,
      operator_name: ctx.session?.["userName"],
      card_key_name: cardKey.name,
      card_key_code: cardKey.code,
      instance_uuid: newInstanceId
    });

    ctx.body = {
      success: true,
      instanceUuid: newInstanceId
    };
  }
);

// Validate a card key code (public, used before redemption)
router.get(
  "/validate",
  permission({ token: false, level: null }),
  validator({ query: { code: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    const code = String(ctx.query.code).toUpperCase().trim();

    const result = cardKeySystem.validateCode(code);
    ctx.body = {
      valid: result.valid,
      message: result.message,
      cardKey: result.valid
        ? {
            name: result.cardKey?.name,
            config: result.cardKey?.config,
            duration: result.cardKey?.duration
          }
        : null
    };
  }
);

export default router;