<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { t } from "@/lang/i18n";
import { getAdminImages, createImage, updateImage, deleteImage } from "@/services/apis";
import { reportErrorMsg } from "@/tools/validator";
import { PlusOutlined, DeleteOutlined, EditOutlined, AppstoreOutlined } from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";
import { onMounted, reactive, ref } from "vue";

const { execute: fetchImages } = getAdminImages();
const { execute: createImg } = createImage();
const { execute: updateImg } = updateImage();
const { execute: deleteImgs } = deleteImage();

const images = ref<any[]>([]);
const loading = ref(false);
const showModal = ref(false);
const editingUuid = ref("");

const form = reactive({
  name: "",
  description: "",
  type: "docker" as string,
  imageUrl: "",
  icon: "",
  category: "通用",
  defaultConfig: {
    processType: "docker",
    instanceType: "universal",
    startCommand: "",
    docker: {
      image: "",
      memory: 1024,
      cpuUsage: 100,
      maxSpace: 10,
      ports: [],
      env: []
    }
  }
});

const loadImages = async () => {
  try {
    loading.value = true;
    const res = await fetchImages();
    if (res.value) images.value = res.value;
  } catch (error: any) {
    reportErrorMsg(error);
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingUuid.value = "";
  form.name = "";
  form.description = "";
  form.type = "docker";
  form.imageUrl = "";
  form.icon = "";
  form.category = "通用";
  form.defaultConfig = {
    processType: "docker",
    instanceType: "universal",
    startCommand: "",
    docker: { image: "", memory: 1024, cpuUsage: 100, maxSpace: 10, ports: [], env: [] }
  };
  showModal.value = true;
};

const openEdit = (record: any) => {
  editingUuid.value = record.uuid;
  Object.assign(form, {
    name: record.name,
    description: record.description,
    type: record.type,
    imageUrl: record.imageUrl,
    icon: record.icon,
    category: record.category,
    defaultConfig: record.defaultConfig
  });
  showModal.value = true;
};

const handleSave = async () => {
  if (!form.name.trim()) {
    return message.error(t("TXT_CODE_image.enterName"));
  }
  try {
    if (editingUuid.value) {
      await updateImg({ data: { uuid: editingUuid.value, ...form } });
      message.success(t("TXT_CODE_image.updateSuccess"));
    } else {
      await createImg({ data: { ...form } });
      message.success(t("TXT_CODE_image.createSuccess"));
    }
    showModal.value = false;
    await loadImages();
  } catch (error: any) {
    reportErrorMsg(error);
  }
};

const handleDelete = (uuid: string) => {
  Modal.confirm({
    title: t("TXT_CODE_image.confirmDelete"),
    onOk: async () => {
      try {
        await deleteImgs({ params: { uuid } });
        message.success(t("TXT_CODE_image.deleteSuccess"));
        await loadImages();
      } catch (error: any) {
        reportErrorMsg(error);
      }
    }
  });
};

onMounted(loadImages);
</script>

<template>
  <div class="image-manage">
    <div class="page-header">
      <a-typography-title :level="4">
        <AppstoreOutlined /> {{ t("TXT_CODE_image.manage") }}
      </a-typography-title>
      <a-button type="primary" @click="openCreate">
        <PlusOutlined /> {{ t("TXT_CODE_image.add") }}
      </a-button>
    </div>

    <div class="image-grid">
      <a-card
        v-for="img in images"
        :key="img.uuid"
        class="image-card"
        :title="img.name"
      >
        <template #extra>
          <a-button type="link" size="small" @click="openEdit(img)">
            <EditOutlined />
          </a-button>
          <a-button type="link" danger size="small" @click="handleDelete(img.uuid)">
            <DeleteOutlined />
          </a-button>
        </template>
        <p>{{ img.description }}</p>
        <a-tag :color="img.type === 'docker' ? 'blue' : 'green'">
          {{ img.type }}
        </a-tag>
        <a-tag>{{ img.category }}</a-tag>
        <p class="mt-10">
          <small>{{ img.imageUrl }}</small>
        </p>
      </a-card>
    </div>

    <!-- Create/Edit Modal -->
    <a-modal
      v-model:open="showModal"
      :title="editingUuid ? t('TXT_CODE_image.edit') : t('TXT_CODE_image.add')"
      @ok="handleSave"
      :width="600"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('TXT_CODE_image.name')" required>
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item :label="t('TXT_CODE_image.description')">
          <a-textarea v-model:value="form.description" :rows="2" />
        </a-form-item>
        <a-form-item :label="t('TXT_CODE_image.type')">
          <a-select v-model:value="form.type">
            <a-select-option value="docker">Docker</a-select-option>
            <a-select-option value="preset">Preset</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('TXT_CODE_image.imageUrl')">
          <a-input v-model:value="form.imageUrl" />
        </a-form-item>
        <a-form-item :label="t('TXT_CODE_image.category')">
          <a-input v-model:value="form.category" />
        </a-form-item>
        <a-form-item :label="t('TXT_CODE_image.icon')">
          <a-input v-model:value="form.icon" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
.image-manage {
  padding: 24px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }
}

.mt-10 { margin-top: 10px; }
</style>