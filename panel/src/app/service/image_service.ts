import { v4 } from "uuid";
import Storage from "../common/storage/sys_storage";
import { ImageTemplate, IImageTemplate } from "../entity/image_template";
import { $t } from "../i18n";
import { logger } from "./log";

class ImageSubsystem {
  public readonly objects: Map<string, ImageTemplate> = new Map();

  async initialize() {
    for (const uuid of await Storage.getStorage().list("ImageTemplate")) {
      const template = (await Storage.getStorage().load(
        "ImageTemplate",
        ImageTemplate,
        uuid
      )) as ImageTemplate;
      this.objects.set(uuid, template);
    }
    logger.info($t("TXT_CODE_image.loaded", { n: this.objects.size }));
  }

  async create(config: {
    name: string;
    description: string;
    type: "docker" | "preset";
    imageUrl: string;
    icon: string;
    category: string;
    defaultConfig: any;
    createdBy: string;
  }): Promise<ImageTemplate> {
    const newUuid = v4().replace(/-/gim, "");
    const template = new ImageTemplate();
    template.uuid = newUuid;
    template.name = config.name;
    template.description = config.description;
    template.type = config.type;
    template.imageUrl = config.imageUrl;
    template.icon = config.icon;
    template.category = config.category;
    template.defaultConfig = config.defaultConfig;
    template.isActive = true;
    template.sortOrder = 0;
    template.createdAt = new Date().toISOString();
    template.createdBy = config.createdBy;

    this.objects.set(newUuid, template);
    await Storage.getStorage().store("ImageTemplate", newUuid, template);
    return template;
  }

  async update(
    uuid: string,
    config: Partial<IImageTemplate>
  ): Promise<ImageTemplate | null> {
    const template = this.objects.get(uuid);
    if (!template) return null;
    if (config.name) template.name = config.name;
    if (config.description !== undefined) template.description = config.description;
    if (config.type) template.type = config.type;
    if (config.imageUrl) template.imageUrl = config.imageUrl;
    if (config.icon !== undefined) template.icon = config.icon;
    if (config.category) template.category = config.category;
    if (config.defaultConfig)
      template.defaultConfig = { ...template.defaultConfig, ...config.defaultConfig };
    if (config.isActive !== undefined) template.isActive = config.isActive;
    if (config.sortOrder !== undefined) template.sortOrder = config.sortOrder;

    await Storage.getStorage().store("ImageTemplate", uuid, template);
    return template;
  }

  async delete(uuid: string): Promise<boolean> {
    if (this.objects.has(uuid)) {
      this.objects.delete(uuid);
      await Storage.getStorage().delete("ImageTemplate", uuid);
      return true;
    }
    return false;
  }

  getImage(uuid: string): ImageTemplate | null {
    return this.objects.get(uuid) || null;
  }

  getAll(): ImageTemplate[] {
    return Array.from(this.objects.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
  }

  getActiveImages(): ImageTemplate[] {
    return this.getAll().filter((img) => img.isActive);
  }

  getByType(type: "docker" | "preset"): ImageTemplate[] {
    return this.getActiveImages().filter((img) => img.type === type);
  }

  getByCategory(category: string): ImageTemplate[] {
    return this.getActiveImages().filter((img) => img.category === category);
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    for (const [, img] of this.objects) {
      if (img.isActive) categories.add(img.category);
    }
    return Array.from(categories);
  }
}

export default new ImageSubsystem();