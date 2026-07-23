<script setup lang="ts">
import { t } from "@/lang/i18n";
import { getExpirationInfo } from "@/services/apis";
import { onMounted, ref } from "vue";

const props = defineProps<{
  daemonId: string;
  instanceUuid: string;
}>();

const { execute: fetchInfo } = getExpirationInfo();
const expirationInfo = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await fetchInfo({
      params: { daemonId: props.daemonId, uuid: props.instanceUuid }
    });
    expirationInfo.value = res.value;
  } catch {
    // Not all instances have expiration info
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-if="loading" class="expiration-info">
    <a-skeleton :paragraph="{ rows: 1 }" active />
  </div>
  <div v-else-if="expirationInfo" class="expiration-info">
    <template v-if="expirationInfo.isExpired">
      <a-tag color="red">
        {{ t("TXT_CODE_expiration.expired") }}
      </a-tag>
      <span v-if="expirationInfo.isInGracePeriod" class="grace-period-text">
        {{ t("TXT_CODE_expiration.gracePeriod") }}
        ({{ Math.ceil((expirationInfo.gracePeriodEnd - Date.now()) / (24 * 60 * 60 * 1000)) }} {{ t("TXT_CODE_redeem.days") }})
      </span>
    </template>
    <template v-else>
      <a-tag :color="expirationInfo.daysUntilExpiry <= 3 ? 'orange' : 'green'">
        {{ expirationInfo.daysUntilExpiry }} {{ t("TXT_CODE_redeem.days") }}
      </a-tag>
      <span v-if="expirationInfo.daysUntilExpiry <= 3" class="warning-text">
        {{ t("TXT_CODE_expiration.expiringSoon") }}
      </span>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.expiration-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.warning-text {
  color: var(--color-orange-6);
  font-size: 12px;
}

.grace-period-text {
  color: var(--color-red-6);
  font-size: 12px;
}
</style>