<template>
  <div v-show="getShow" class="ds-form">
    <!-- Header -->
    <div class="ds-form__header">
      <p class="ds-form__welcome">欢迎使用</p>
      <h1 class="ds-form__title">衣设系统</h1>
    </div>

    <!-- Form fields -->
    <el-form ref="formLogin" :model="loginData.loginForm" :rules="LoginRules" class="ds-form__form">
      <!-- Account -->
      <div class="ds-form__field">
        <label class="ds-form__label">账号</label>
        <el-input
          v-model="loginData.loginForm.account"
          placeholder="请输入账号"
          size="large"
          class="ds-form__input"
        />
      </div>

      <!-- Password -->
      <div class="ds-form__field">
        <label class="ds-form__label">密码</label>
        <el-input
          v-model="loginData.loginForm.password"
          type="password"
          placeholder="请输入密码"
          size="large"
          class="ds-form__input"
          show-password
          @keyup.enter="handleLogin()"
        />
      </div>

      <!-- Remember & Forgot -->
      <div class="ds-form__actions">
        <el-checkbox v-model="loginData.loginForm.rememberMe" class="ds-form__checkbox">
          记住我
        </el-checkbox>
        <button type="button" class="ds-form__link" @click="handleForgetPassword">
          忘记密码?
        </button>
      </div>

      <!-- Submit -->
      <el-button
        type="primary"
        size="large"
        class="ds-form__submit"
        :loading="loginLoading"
        @click="handleLogin()"
      >
        登 录
      </el-button>

      <!-- Get Account Link -->
      <div class="ds-form__get-account">
        <button type="button" class="ds-form__link" @click="handleGetAccount">
          获取账号
        </button>
      </div>
    </el-form>
  </div>

  <!-- Contact Admin Dialog -->
  <el-dialog
    v-model="showContactDialog"
    width="370px"
    align-center
    :show-close="true"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
  >
    <template #header>
      <div style="display: flex; align-items: center; gap: 10px">
        <el-icon size="22"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></el-icon>
        <span style="font-size: 19px; font-weight: bold; letter-spacing: 1px">获取账号</span>
      </div>
    </template>
    <div style="padding: 18px 0 10px; text-align: center">
      <div style="margin-bottom: 8px; font-size: 17px; font-weight: 500">请联系系统管理员获取账号</div>
      <div style="margin-bottom: 6px; font-size: 12px; font-weight: bold; letter-spacing: 1px">
        <span>TEL</span> & <span>WECHAT</span>：18742539196
      </div>
      <el-tag type="success" effect="plain" style="margin-top: 4px">24小时在线</el-tag>
    </div>
    <template #footer>
      <el-button type="primary" style="width: 100%; font-size: 12px" @click="showContactDialog = false">
        我知道了
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ElLoading } from "element-plus"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import * as authUtil from "@/utils/auth"
import { usePermissionStoreWithOut } from "@/store/modules/permission"
import { resolveFirstAccessibleMenuPath } from "@/router/menu-path"
import * as LoginApi from "@/api/login"
import { LoginStateEnum, useFormValid, useLoginState } from "./useLogin"
import { useUserStoreWithOut } from "@/store/modules/user"
import { removeToken, setAccessToken } from "@/utils/auth"
import { getDeviceInfo } from "@/utils/device"

defineOptions({ name: "DsLoginForm" })

const message = useMessage()
const formLogin = ref()
const { validForm } = useFormValid(formLogin)
const { getLoginState } = useLoginState()
const { currentRoute, push } = useRouter()
const redirect = ref<string>("")
const loginLoading = ref(false)
const loading = ref()
const showContactDialog = ref(false)

const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN)

const LoginRules = {
  account: [required],
  password: [required],
}

const resolveFirstAccessiblePath = () => {
  const permissionStore = usePermissionStoreWithOut()
  return resolveFirstAccessibleMenuPath(permissionStore.getAddRouters) || "/403"
}

const loginData = reactive({
  loginForm: {
    account: import.meta.env.VITE_APP_DEFAULT_LOGIN_USERNAME || "",
    password: import.meta.env.VITE_APP_DEFAULT_LOGIN_PASSWORD || "",
    rememberMe: true,
  },
})

const getLoginFormCache = () => {
  const loginForm = authUtil.getLoginForm()
  if (loginForm) {
    loginData.loginForm = {
      ...loginData.loginForm,
      account: loginForm.username ? loginForm.username : loginData.loginForm.account,
      password: loginForm.password ? loginForm.password : loginData.loginForm.password,
      rememberMe: loginForm.rememberMe,
    }
  }
}

const handleLogin = async () => {
  loginLoading.value = true
  try {
    const data = await validForm()
    if (!data) return

    const loginDataLoginForm = {
      username: loginData.loginForm.account,
      password: loginData.loginForm.password,
      terminalType: "admin" as const,
      deviceInfo: getDeviceInfo(),
    }
    removeToken()
    const res = await LoginApi.login(loginDataLoginForm)
    if (!res) return

    loading.value = ElLoading.service({
      lock: true,
      text: "正在加载系统中...",
      background: "rgba(0, 0, 0, 0.7)",
    })
    if (loginData.loginForm.rememberMe) {
      authUtil.setLoginForm({
        tenantName: "",
        username: loginData.loginForm.account,
        password: loginData.loginForm.password,
        rememberMe: true,
      })
    } else {
      authUtil.removeLoginForm()
    }
    setAccessToken(res.token)

    const userStore = useUserStoreWithOut()
    const permissionStore = usePermissionStoreWithOut()
    try {
      await userStore.setUserInfoAction()
      await permissionStore.generateRoutes()
      await push({ path: "/" })
    } catch (error) {
      console.error("获取用户信息或生成路由失败:", error)
      message.error("系统初始化失败，请刷新页面重试")
    }
  } finally {
    loginLoading.value = false
    loading.value?.close()
  }
}

const handleForgetPassword = () => {
  showContactDialog.value = true
}

const handleGetAccount = () => {
  showContactDialog.value = true
}

watch(
  () => currentRoute.value,
  (route: RouteLocationNormalizedLoaded) => {
    redirect.value = route?.query?.redirect as string
  },
  { immediate: true },
)

onMounted(() => {
  getLoginFormCache()
})
</script>

<style lang="scss" scoped>
.ds-form {
  display: flex;
  flex-direction: column;
  padding: 16px;
  width: 100%;
  gap: 0;

  &__header {
    margin-bottom: 12px;
  }

  &__welcome {
    margin: 0;
    font-size: 12px;
    color: #666;
    font-weight: 400;
  }

  &__title {
    margin: 4px 0 0;
    font-size: 16px;
    font-weight: 700;
    color: #635BFF;
    letter-spacing: -0.02em;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }

  &__label {
    font-size: 11px;
    font-weight: 600;
    color: #777;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  &__input {
    :deep(.el-input__wrapper) {
      background: #F5F5FA;
      border: none;
      border-radius: 6px;
      box-shadow: none !important;
      padding: 0 12px;
    }

    :deep(.el-input__inner) {
      height: 32px;
      font-size: 12px;
      color: #1a1a2e;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 2px;
    margin-bottom: 8px;
  }

  &__checkbox {
    :deep(.el-checkbox__label) {
      font-size: 12px;
      color: #555;
    }
  }

  &__link {
    padding: 0;
    font-size: 12px;
    font-weight: 500;
    color: #635BFF;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.15s ease;

    &:hover {
      color: #5146E5;
    }
  }

  &__submit {
    width: 100%;
    height: 32px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    background: #635BFF;
    border: none;
    border-radius: 6px;
    margin-top: 0;

    &:hover {
      background: #5146E5;
    }
  }

  &__get-account {
    display: flex;
    justify-content: center;
    margin-top: 8px;
  }
}

// Dark mode
:global(html.dark) {
  .ds-form {
    &__welcome {
      color: #9ca3af;
    }

    &__title {
      color: #a5b4fc;
    }

    &__label {
      color: #9ca3af;
    }

    &__input {
      :deep(.el-input__wrapper) {
        background: #2a2a3e;
      }

      :deep(.el-input__inner) {
        color: #f0f0f5;
      }
    }

    &__checkbox {
      :deep(.el-checkbox__label) {
        color: #9ca3af;
      }
    }

    &__submit {
      background: #635BFF;

      &:hover {
        background: #5146E5;
      }
    }
  }
}

// Tablet
@media (max-width: 1200px) {
  .ds-form {
    padding: 16px;
  }
}

// Mobile
@media (max-width: 768px) {
  .ds-form {
    padding: 18px;

    &__welcome {
      font-size: 12px;
    }

    &__title {
      font-size: 16px;
    }

    &__header {
      margin-bottom: 12px;
    }

    &__input {
      :deep(.el-input__inner) {
        height: 38px;
      }
    }

    &__submit {
      height: 38px;
    }
  }
}
</style>
