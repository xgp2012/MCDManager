import Koa from "koa";
import Router from "@koa/router";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import cardKeySystem from "../service/card_key_service";
import { $t } from "../i18n";
import { ROLE } from "../entity/user";
import { operationLogger } from "../service/operation_logger";

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
  validator({ body: { code: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    const code = String(ctx.request.body.code).toUpperCase().trim();

    const result = cardKeySystem.validateCode(code);
    if (!result.valid) {
      ctx.throw(400, result.message as string);
      return;
    }

    const cardKey = await cardKeySystem.redeemCode(code);
    if (!cardKey) {
      ctx.throw(400, $t("TXT_CODE_cardKey.redeemFailed") as string);
      return;
    }

    operationLogger.log("card_key_redeem", {
      operator_ip: ctx.ip,
      operator_name: ctx.session?.["userName"],
      card_key_name: cardKey.name,
      card_key_code: cardKey.code
    });

    ctx.body = {
      name: cardKey.name,
      config: cardKey.config,
      duration: cardKey.duration,
      code: cardKey.code
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