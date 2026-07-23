<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { router } from "@/config/router";
import { t } from "@/lang/i18n";
import { redeemCardKey, remoteNodeList, validateCardKey } from "@/services/apis";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { reportErrorMsg } from "@/tools/validator";
import { CheckCircleOutlined, CloudOutlined, KeyOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { onMounted, reactive, ref } from "vue";

const { execute: fetchNodes } = remoteNodeList();
const { execute: validate } = validateCardKey();
const { execute: redeem } = redeemCardKey();
const { state: appConfig } = useAppStateStore();

const nodes = ref<any[]>([]);
const loading = ref(false);
const step = ref(0); // 0=enter code, 1=validated, 2=redeemed
const cardKeyInfo = ref<any>(null);
const selectedNodeId = ref("");

const formData = reactive({
  code: ""
});

onMounted(async () => {
  try {
    const res = await fetchNodes();
    if (res.value) {
      nodes.value = res.value.filter((n: any) => n.available);
      if (nodes.value.length > 0) {
        selectedNodeId.value = nodes.value[0].uuid;
      }
    }
  } catch (err) {
    console.error("Failed to load nodes", err);
  }
});

const handleValidate = async () => {
  if (!formData.code.trim()) {
    return message.error(t("TXT_CODE_redeem.enterCode"));
  }
  try {
    loading.value = true;
    const res = await validate({
      params: { code: formData.code.trim() }
    });
    if (res.value?.valid && res.value?.cardKey) {
      cardKeyInfo.value = res.value.cardKey;
      step.value = 1;
    } else {
      message.error(res.value?.message || t("TXT_CODE_redeem.invalidCode"));
    }
  } catch (error: any) {
    reportErrorMsg(error);
  } finally {
    loading.value = false;
  }
};

const handleRedeem = async () => {
  if (!selectedNodeId.value) {
    return message.error(t("TXT_CODE_redeem.selectNode"));
  }
  try {
    loading.value = true;
    const res = await redeem({
      data: {
        code: formData.code.trim(),
        daemonId: selectedNodeId.value
      }
    });
    if (res.value?.success) {
      step.value = 2;
      message.success(t("TXT_CODE_redeem.success"));
    } else {
      message.error(res.value?.message || t("TXT_CODE_redeem.failed"));
    }
  } catch (error: any) {
    reportErrorMsg(error);
  } finally {
    loading.value = false;
  }
};

const goToInstances = () => {
  router.push("/customer");
};
</script>

<template>
  <div class="redeem-page">
    <div class="redeem-page-body">
      <CardPanel class="redeem-panel">
        <template #body>
          <div class="redeem-panel-body">
            <!-- Step 0: Enter Code -->
            <div v-if="step === 0">
              <a-typography-title :level="3" class="mb-20">
                {{ t("TXT_CODE_redeem.title") }}
              </a-typography-title>
              <a-typography-paragraph class="mb-20">
                {{ t("TXT_CODE_redeem.description") }}
              </a-typography-paragraph>

              <a-input
                v-model:value="formData.code"
                size="large"
                class="code-input"
                :placeholder="t('TXT_CODE_redeem.codePlaceholder')"
                @press-enter="handleValidate"
              >
                <template #prefix>
                  <KeyOutlined />
                </template>
              </a-input>

              <div class="mt-24 flex-end">
                <a-button
                  size="large"
                  type="primary"
                  :loading="loading"
                  @click="handleValidate"
                >
                  {{ t("TXT_CODE_redeem.validate") }}
                </a-button>
              </div>
            </div>

            <!-- Step 1: Confirm Redemption -->
            <div v-else-if="step === 1 && cardKeyInfo">
              <a-typography-title :level="3" class="mb-20">
                {{ t("TXT_CODE_redeem.confirmTitle") }}
              </a-typography-title>

              <a-descriptions :column="1" bordered class="mb-20">
                <a-descriptions-item :label="t('TXT_CODE_redeem.code')">
                  {{ cardKeyInfo.code }}
                </a-descriptions-item>
                <a-descriptions-item :label="t('TXT_CODE_redeem.name')">
                  {{ cardKeyInfo.name }}
                </a-descriptions-item>
                <a-descriptions-item :label="t('TXT_CODE_redeem.duration')">
                  {{ cardKeyInfo.duration }} {{ t("TXT_CODE_redeem.days") }}
                </a-descriptions-item>
                <a-descriptions-item :label="t('TXT_CODE_redeem.instanceType')">
                  {{ cardKeyInfo.config.processType }}
                </a-descriptions-item>
                <a-descriptions-item v-if="cardKeyInfo.config.dockerImage" :label="t('TXT_CODE_redeem.image')">
                  {{ cardKeyInfo.config.dockerImage }}
                </a-descriptions-item>
                <a-descriptions-item v-if="cardKeyInfo.config.dockerMemory" :label="t('TXT_CODE_redeem.memory')">
                  {{ cardKeyInfo.config.dockerMemory }}MB
                </a-descriptions-item>
                <a-descriptions-item v-if="cardKeyInfo.config.dockerCpuUsage" :label="t('TXT_CODE_redeem.cpu')">
                  {{ cardKeyInfo.config.dockerCpuUsage }}%
                </a-descriptions-item>
              </a-descriptions>

              <a-typography-title :level="5" class="mb-10">
                {{ t("TXT_CODE_redeem.selectNode") }}
              </a-typography-title>
              <a-select
                v-model:value="selectedNodeId"
                style="width: 100%"
                size="large"
                class="mb-20"
              >
                <a-select-option
                  v-for="node in nodes"
                  :key="node.uuid"
                  :value="node.uuid"
                >
                  <CloudOutlined /> {{ node.config?.remarks || node.uuid }}
                </a-select-option>
              </a-select>

              <div class="flex-between">
                <a-button size="large" @click="step = 0">
                  {{ t("TXT_CODE_redeem.back") }}
                </a-button>
                <a-button
                  size="large"
                  type="primary"
                  :loading="loading"
                  @click="handleRedeem"
                >
                  {{ t("TXT_CODE_redeem.redeem") }}
                </a-button>
              </div>
            </div>

            <!-- Step 2: Success -->
            <div v-else-if="step === 2">
              <div class="success-container">
                <CheckCircleOutlined class="success-icon" />
                <a-typography-title :level="3" class="mt-20">
                  {{ t("TXT_CODE_redeem.successTitle") }}
                </a-typography-title>
                <a-typography-paragraph>
                  {{ t("TXT_CODE_redeem.successDescription") }}
                </a-typography-paragraph>
                <a-button size="large" type="primary" @click="goToInstances">
                  {{ t("TXT_CODE_redeem.viewInstances") }}
                </a-button>
              </div>
            </div>
          </div>
        </template>
      </CardPanel>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.redeem-page {
  padding: 24px;
  max-width: 640px;
  margin: 0 auto;

  .redeem-panel-body {
    padding: 28px 24px;
  }

  .code-input {
    font-family: monospace;
    font-size: 18px;
    letter-spacing: 2px;
  }

  .success-container {
    text-align: center;
    padding: 40px 0;

    .success-icon {
      font-size: 72px;
      color: var(--color-green-6);
    }
  }
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-end {
  display: flex;
  justify-content: flex-end;
}

.mb-10 { margin-bottom: 10px; }
.mb-20 { margin-bottom: 20px; }
.mt-20 { margin-top: 20px; }
.mt-24 { margin-top: 24px; }
</style>