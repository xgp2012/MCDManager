import Router from "@koa/router";
import Koa from "koa";
import { ROLE } from "../entity/user";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import { getUserUuid } from "../service/passport_service";
import { isHaveInstanceByUuid } from "../service/permission_service";
import instanceExpirationService from "../service/instance_expiration_service";

const router = new Router({ prefix: "/expiration" });

// Get expiration info for an instance (user-facing)
router.get(
  "/info",
  permission({ level: ROLE.USER }),
  validator({ query: { daemonId: String, uuid: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    const daemonId = String(ctx.query.daemonId);
    const instanceUuid = String(ctx.query.uuid);

    // Check if user owns this instance
    if (!isHaveInstanceByUuid(getUserUuid(ctx), daemonId, instanceUuid)) {
      ctx.status = 403;
      ctx.body = { error: "Forbidden" };
      return;
    }

    const info = await instanceExpirationService.getExpirationInfo(daemonId, instanceUuid);
    ctx.body = info || { error: "No expiration info" };
  }
);

export default router;