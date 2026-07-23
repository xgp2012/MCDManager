import Router from "@koa/router";
import { ROLE } from "../entity/user";
import { $t } from "../i18n";
import { speedLimit } from "../middleware/limit";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import imageService from "../service/image_service";
import { getUserUuid } from "../service/passport_service";

const router = new Router({ prefix: "/image" });

// [Admin] Create an image template
router.post(
  "/",
  permission({ level: ROLE.ADMIN }),
  validator({
    body: {
      name: String,
      type: String,
      imageUrl: String
    }
  }),
  async (ctx) => {
    try {
      const { name, description, type, imageUrl, icon, category, defaultConfig } =
        ctx.request.body;
      if (type !== "docker" && type !== "preset") {
        ctx.status = 400;
        ctx.body = new Error("Type must be 'docker' or 'preset'");
        return;
      }
      const createdBy = getUserUuid(ctx);
      const result = await imageService.create({
        name,
        description: description || "",
        type,
        imageUrl,
        icon: icon || "",
        category: category || "通用",
        defaultConfig: defaultConfig || {},
        createdBy
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Admin] Update an image template
router.put(
  "/",
  permission({ level: ROLE.ADMIN }),
  validator({
    body: {
      uuid: String
    }
  }),
  async (ctx) => {
    try {
      const { uuid, ...config } = ctx.request.body;
      const result = await imageService.update(uuid, config);
      if (!result) {
        ctx.status = 404;
        ctx.body = new Error($t("TXT_CODE_image.notFound"));
        return;
      }
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Admin] Delete an image template
router.delete(
  "/",
  permission({ level: ROLE.ADMIN }),
  validator({
    query: { uuid: String }
  }),
  async (ctx) => {
    try {
      const uuid = String(ctx.query.uuid);
      const success = await imageService.delete(uuid);
      if (!success) {
        ctx.status = 404;
        ctx.body = new Error($t("TXT_CODE_image.notFound"));
        return;
      }
      ctx.body = { status: 200, message: "OK" };
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Admin] Get all image templates
router.get(
  "/",
  permission({ level: ROLE.ADMIN }),
  async (ctx) => {
    try {
      ctx.body = imageService.getAll();
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [User] Get active image templates (public)
router.get("/public", permission({ level: ROLE.USER }), speedLimit(0.5), async (ctx) => {
  try {
    const type = ctx.query.type as string | undefined;
    const category = ctx.query.category as string | undefined;

    let results = imageService.getActiveImages();
    if (type && (type === "docker" || type === "preset")) {
      results = results.filter((img) => img.type === type);
    }
    if (category) {
      results = results.filter((img) => img.category === category);
    }
    ctx.body = results;
  } catch (err) {
    ctx.body = err;
  }
});

// [User] Get categories (public)
router.get(
  "/categories",
  permission({ level: ROLE.USER }),
  speedLimit(0.5),
  async (ctx) => {
    try {
      ctx.body = imageService.getCategories();
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;