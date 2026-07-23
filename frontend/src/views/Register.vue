<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { router } from "@/config/router";
import { t } from "@/lang/i18n";
import { registerUser } from "@/services/apis";
import { reportErrorMsg } from "@/tools/validator";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { UserOutlined, LockOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { reactive, ref } from "vue";

const { state: appConfig } = useAppStateStore();
const { execute: doRegister } = registerUser();

const formData = reactive({
  username: "",
  password: "",
  confirmPassword: ""
});

const loading = ref(false);

const handleRegister = async () => {
  if (!formData.username.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
    return message.error(t("TXT_CODE_c846074d"));
  }
  if (formData.username.trim().length < 3 || formData.username.trim().length > 20) {
    return message.error(t("TXT_CODE_register.usernameLength"));
  }
  if (formData.password !== formData.confirmPassword) {
    return message.error(t("TXT_CODE_register.passwordMismatch"));
  }
  try {
    loading.value = true;
    await doRegister({
      data: {
        username: formData.username.trim(),
        password: formData.password
      }
    });
    message.success(t("TXT_CODE_register.success"));
    router.push("/login");
  } catch (error: any) {
    reportErrorMsg(error);
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  router.push("/login");
};
</script>

<template>
  <div class="register-page">
    <div class="register-page-body">
      <CardPanel class="register-panel">
        <template #body>
          <div class="register-panel-body">
            <a-typography-title :level="3" class="mb-20">
              {{ t("TXT_CODE_register.title") }}
            </a-typography-title>
            <a-typography-paragraph class="mb-20">
              {{ t("TXT_CODE_register.description") }}
            </a-typography-paragraph>
            <div class="register-form">
              <a-input
                v-model:value="formData.username"
                class="account"
                size="large"
                :placeholder="t('TXT_CODE_register.username')"
              >
                <template #suffix>
                  <UserOutlined style="color: rgba(0, 0, 0, 0.45)" />
                </template>
              </a-input>
              <a-input-password
                v-model:value="formData.password"
                class="mt-20 account"
                size="large"
                :placeholder="t('TXT_CODE_register.password')"
              >
                <template #suffix>
                  <LockOutlined style="color: rgba(0, 0, 0, 0.45)" />
                </template>
              </a-input-password>
              <a-input-password
                v-model:value="formData.confirmPassword"
                class="mt-20 account"
                size="large"
                :placeholder="t('TXT_CODE_register.confirmPassword')"
                @press-enter="handleRegister"
              >
                <template #suffix>
                  <LockOutlined style="color: rgba(0, 0, 0, 0.45)" />
                </template>
              </a-input-password>
              <div class="mt-24 flex-between align-center">
                <a-button size="large" @click="goToLogin">
                  {{ t("TXT_CODE_register.backToLogin") }}
                </a-button>
                <a-button
                  size="large"
                  type="primary"
                  :loading="loading"
                  @click="handleRegister"
                >
                  {{ t("TXT_CODE_register.register") }}
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
.register-page {
  position: fixed;
  left: 0px;
  right: 0px;
  bottom: 0px;
  top: 0px;
  background-color: #29292957;
  backdrop-filter: saturate(120%) blur(10px);
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  justify-content: center;
  align-items: center;

  .register-page-body {
    padding: 12px;
    max-width: 480px;
    width: 100%;
    margin: 0 auto;
  }

  .register-panel {
    width: 100%;

    .register-panel-body {
      padding: 28px 24px;
    }
  }

  .account {
    width: 100%;
  }
}
</style>