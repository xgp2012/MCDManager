import { v4 } from "uuid";
import Storage from "../common/storage/sys_storage";
import { CardKey, ICardKey, ICardKeyConfig } from "../entity/card_key";
import { $t } from "../i18n";
import { logger } from "./log";

class CardKeySubsystem {
  public readonly objects: Map<string, CardKey> = new Map();

  async initialize() {
    for (const uuid of await Storage.getStorage().list("CardKey")) {
      const cardKey = (await Storage.getStorage().load("CardKey", CardKey, uuid)) as CardKey;
      this.objects.set(uuid, cardKey);
    }
    logger.info($t("TXT_CODE_cardKey.loaded", { n: this.objects.size }));
  }

  // Generate a unique card key code
  generateCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "MCDM-";
    for (let i = 0; i < 8; i++) {
      if (i === 4) code += "-";
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure uniqueness
    for (const [, key] of this.objects) {
      if (key.code === code) return this.generateCode();
    }
    return code;
  }

  async create(config: {
    name: string;
    config: ICardKeyConfig;
    duration: number;
    maxUsage: number;
    createdBy: string;
    expiredAt: string;
    remarks: string;
  }): Promise<CardKey> {
    const newUuid = v4().replace(/-/gim, "");
    const cardKey = new CardKey();
    cardKey.uuid = newUuid;
    cardKey.code = this.generateCode();
    cardKey.name = config.name;
    cardKey.config = config.config;
    cardKey.duration = config.duration;
    cardKey.maxUsage = config.maxUsage || 1;
    cardKey.usedCount = 0;
    cardKey.createdBy = config.createdBy;
    cardKey.createdAt = new Date().toISOString();
    cardKey.isActive = true;
    cardKey.expiredAt = config.expiredAt;
    cardKey.remarks = config.remarks || "";

    this.objects.set(newUuid, cardKey);
    await Storage.getStorage().store("CardKey", newUuid, cardKey);
    return cardKey;
  }

  async update(uuid: string, config: Partial<ICardKey>): Promise<CardKey | null> {
    const cardKey = this.objects.get(uuid);
    if (!cardKey) return null;
    if (config.name) cardKey.name = config.name;
    if (config.config) cardKey.config = { ...cardKey.config, ...config.config };
    if (config.duration) cardKey.duration = config.duration;
    if (config.maxUsage) cardKey.maxUsage = config.maxUsage;
    if (config.isActive !== undefined) cardKey.isActive = config.isActive;
    if (config.expiredAt) cardKey.expiredAt = config.expiredAt;
    if (config.remarks !== undefined) cardKey.remarks = config.remarks;

    await Storage.getStorage().store("CardKey", uuid, cardKey);
    return cardKey;
  }

  async delete(uuid: string): Promise<boolean> {
    if (this.objects.has(uuid)) {
      this.objects.delete(uuid);
      await Storage.getStorage().delete("CardKey", uuid);
      return true;
    }
    return false;
  }

  // Validate a card key code
  validateCode(code: string): { valid: boolean; message: string; cardKey?: CardKey } {
    const codeUpper = code.toUpperCase().trim();
    for (const [, cardKey] of this.objects) {
      if (cardKey.code === codeUpper) {
        if (!cardKey.isActive) {
          return { valid: false, message: $t("TXT_CODE_cardKey.inactive") };
        }
        if (cardKey.expiredAt && new Date(cardKey.expiredAt) < new Date()) {
          return { valid: false, message: $t("TXT_CODE_cardKey.expired") };
        }
        if (cardKey.usedCount >= cardKey.maxUsage) {
          return { valid: false, message: $t("TXT_CODE_cardKey.maxUsage") };
        }
        return { valid: true, message: "", cardKey };
      }
    }
    return { valid: false, message: $t("TXT_CODE_cardKey.notFound") };
  }

  // Redeem a card key (increment usage count)
  async redeemCode(code: string): Promise<CardKey | null> {
    const result = this.validateCode(code);
    if (!result.valid || !result.cardKey) return null;

    result.cardKey.usedCount++;
    if (result.cardKey.usedCount >= result.cardKey.maxUsage) {
      result.cardKey.isActive = false;
    }

    await Storage.getStorage().store("CardKey", result.cardKey.uuid, result.cardKey);
    return result.cardKey;
  }

  getCardKey(uuid: string): CardKey | null {
    return this.objects.get(uuid) || null;
  }

  getCardKeyByCode(code: string): CardKey | null {
    for (const [, cardKey] of this.objects) {
      if (cardKey.code === code.toUpperCase().trim()) return cardKey;
    }
    return null;
  }

  getAll(): CardKey[] {
    return Array.from(this.objects.values());
  }
}

export default new CardKeySubsystem();