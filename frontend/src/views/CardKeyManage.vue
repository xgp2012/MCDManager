<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { t } from "@/lang/i18n";
import { createCardKey, deleteCardKey, getCardKeys } from "@/services/apis";
import { reportErrorMsg } from "@/tools/validator";
import { DeleteOutlined, KeyOutlined, PlusOutlined } from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";
import { onMounted, reactive, ref } from "vue";

const { execute: fetchKeys } = getCardKeys();
const { execute: createKey } = createCardKey();
const { execute: deleteKeys } = deleteCardKey();

const cardKeys = ref<any[]>([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  maxPage: 1
});

const showCreateModal = ref(false);
const createForm = reactive({
  name: "",
  duration: 30,
  config: {
    processType: "general" as string,
    instanceType: "universal",
    dockerImage: "",
    dockerMemory: 1024,
    dockerCpuUsage: 100,
    dockerMaxSpace: 10,
    dockerPorts: [] as Array<{ containerPort: number; protocol: string }>,
    uploadSpeedLimit: 0,
    downloadSpeedLimit: 0,
    startCommand: "",
    memoryLimit: 0,
    diskLimit: 0,
    cpuLimit: 0,
    instanceName: "My Server"
  },
  expiredAt: undefined as any,
  remarks: ""
});

const loadCardKeys = async () => {
  try {
    loading.value = true;
    const res = await fetchKeys({
      params: { page: pagination.page, page_size: pagination.pageSize }
    });
    if (res.value) {
      cardKeys.value = res.value.data || [];
      pagination.total = res.value.total || 0;
      pagination.maxPage = Math.ceil((res.value.total || 0) / pagination.pageSize) || 1;
    }
  } catch (error: any) {
    reportErrorMsg(error);
  } finally {
    loading.value = false;
  }
};

const handleDelete = (uuid: string) => {
  Modal.confirm({
    title: t("TXT_CODE_cardKey.confirmDelete"),
    content: t("TXT_CODE_cardKey.confirmDeleteContent"),
    onOk: async () => {
      try {
        await deleteKeys({ data: { uuid } });
        message.success(t("TXT_CODE_cardKey.deleteSuccess"));
        await loadCardKeys();
      } catch (error: any) {
        reportErrorMsg(error);
      }
    }
  });
};

const handleCreate = async () => {
  if (!createForm.name.trim()) {
    return message.error(t("TXT_CODE_cardKey.enterName"));
  }
  try {
    const data: any = {
      name: createForm.name,
      config: createForm.config,
      duration: createForm.duration,
      remarks: createForm.remarks
    };
    // Only send expiredAt if it's set (optional)
    if (createForm.expiredAt) {
      data.expiredAt = typeof createForm.expiredAt === "object"
        ? (createForm.expiredAt as any).format("YYYY-MM-DD")
        : String(createForm.expiredAt);
    }
    await createKey({ data });
    message.success(t("TXT_CODE_cardKey.createSuccess"));
    showCreateModal.value = false;
    await loadCardKeys();
  } catch (error: any) {
    reportErrorMsg(error);
  }
};

const columns = [
  { title: t("TXT_CODE_cardKey.code"), dataIndex: "code", key: "code" },
  { title: t("TXT_CODE_cardKey.name"), dataIndex: "name", key: "name" },
  { title: t("TXT_CODE_cardKey.duration"), dataIndex: "duration", key: "duration" },
  { title: t("TXT_CODE_cardKey.usage"), key: "usage" },
  { title: t("TXT_CODE_cardKey.status"), dataIndex: "isActive", key: "isActive" },
  { title: t("TXT_CODE_cardKey.createdAt"), dataIndex: "createdAt", key: "createdAt" },
  { title: t("TXT_CODE_cardKey.actions"), key: "actions" }
];

onMounted(() => {
  loadCardKeys();
});
</script>

<template>
  <div class="card-key-manage">
    <div class="page-header">
      <a-typography-title :level="4">
        <KeyOutlined /> {{ t("TXT_CODE_cardKey.manage") }}
      </a-typography-title>
      <a-button type="primary" @click="showCreateModal = true">
        <PlusOutlined /> {{ t("TXT_CODE_cardKey.create") }}
      </a-button>
    </div>

    <CardPanel>
      <template #body>
        <a-table
          :dataSource="cardKeys"
          :columns="columns"
          :loading="loading"
          :pagination="{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total
          }"
          rowKey="uuid"
          @change="(pag: any) => { pagination.page = pag.current; loadCardKeys(); }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'usage'">
              {{ record.usedCount }} / {{ record.maxUsage }}
            </template>
            <template v-if="column.key === 'status'">
              <a-tag :color="record.isActive ? 'green' : 'red'">
                {{ record.isActive ? t("TXT_CODE_cardKey.active") : t("TXT_CODE_cardKey.inactive") }}
              </a-tag>
            </template>
            <template v-if="column.key === 'actions'">
              <a-button danger size="small" @click="handleDelete(record.uuid)">
                <DeleteOutlined />
              </a-button>
            </template>
          </template>
        </a-table>
      </template>
    </CardPanel>

    <!-- Create Modal -->
    <a-modal
      v-model:open="showCreateModal"
      :title="t('TXT_CODE_cardKey.create')"
      @ok="handleCreate"
      :width="640"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('TXT_CODE_cardKey.name')" required>
          <a-input v-model:value="createForm.name" />
        </a-form-item>
        <a-form-item :label="t('TXT_CODE_cardKey.duration')">
          <a-input-number v-model:value="createForm.duration" :min="1" :max="3650" />
          <span class="ml-8">{{ t("TXT_CODE_cardKey.days") }}</span>
          <span class="ml-8" style="color: #888;">({{ t("TXT_CODE_cardKey.instanceDuration") }})</span>
        </a-form-item>
        <a-form-item :label="t('TXT_CODE_cardKey.expiredAt')">
          <a-date-picker v-model:value="createForm.expiredAt" style="width: 100%" />
          <span class="ml-8" style="color: #888;">({{ t("TXT_CODE_cardKey.optionalExpiry") }})</span>
        </a-form-item>
        <a-form-item :label="t('TXT_CODE_cardKey.processType')">
          <a-select v-model:value="createForm.config.processType">
            <a-select-option value="general">General</a-select-option>
            <a-select-option value="docker">Docker</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item v-if="createForm.config.processType === 'docker'" :label="t('TXT_CODE_cardKey.dockerImage')">
          <a-input v-model:value="createForm.config.dockerImage" placeholder="e.g. itzg/minecraft-server" />
        </a-form-item>
        <a-form-item :label="t('TXT_CODE_cardKey.memory')">
          <a-input-number v-model:value="createForm.config.dockerMemory" :min="64" :step="64" />
          <span class="ml-8">MB</span>
        </a-form-item>
        <a-form-item :label="t('TXT_CODE_cardKey.cpu')">
          <a-input-number v-model:value="createForm.config.dockerCpuUsage" :min="10" :max="10000" />
          <span class="ml-8">%</span>
        </a-form-item>
        <a-form-item :label="t('TXT_CODE_cardKey.disk')">
          <a-input-number v-model:value="createForm.config.dockerMaxSpace" :min="1" :max="99999" />
          <span class="ml-8">GB</span>
        </a-form-item>
        <a-form-item :label="t('TXT_CODE_cardKey.uploadSpeed')">
          <a-input-number v-model:value="createForm.config.uploadSpeedLimit" :min="0" :max="1000000" />
          <span class="ml-8">KB/s (0 = unlimited)</span>
        </a-form-item>
        <a-form-item :label="t('TXT_CODE_cardKey.downloadSpeed')">
          <a-input-number v-model:value="createForm.config.downloadSpeedLimit" :min="0" :max="1000000" />
          <span class="ml-8">KB/s (0 = unlimited)</span>
        </a-form-item>
        <a-form-item :label="t('TXT_CODE_cardKey.remarks')">
          <a-textarea v-model:value="createForm.remarks" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
.card-key-manage {
  padding: 24px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
}

.ml-8 { margin-left: 8px; }
</style>