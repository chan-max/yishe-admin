<template>
  <div v-show="getShow" class="ds-form">
    <!-- Header -->
    <div class="ds-form__header">
      <p class="ds-form__welcome">欢迎加入</p>
      <h1 class="ds-form__title">创建账号</h1>
    </div>

    <!-- Form fields -->
    <el-form
      ref="formRegister"
      :model="registerData.registerForm"
      :rules="registerRules"
      class="ds-form__form"
    >
      <!-- Username -->
      <div class="ds-form__field">
        <label class="ds-form__label">账号 <span class="required">*</span></label>
        <el-input
          v-model="registerData.registerForm.username"
          placeholder="请输入账号（3-30位）"
          size="large"
          class="ds-form__input"
        />
      </div>

      <!-- Nickname -->
      <div class="ds-form__field">
        <label class="ds-form__label">昵称</label>
        <el-input
          v-model="registerData.registerForm.nickname"
          placeholder="请输入昵称"
          size="large"
          class="ds-form__input"
        />
      </div>

      <!-- Email -->
      <div class="ds-form__field">
        <label class="ds-form__label">邮箱 <span class="required">*</span></label>
        <el-input
          v-model="registerData.registerForm.email"
          placeholder="请输入邮箱"
          size="large"
          class="ds-form__input"
        />
      </div>

      <!-- Phone -->
      <div class="ds-form__field">
        <label class="ds-form__label">手机号 <span class="required">*</span></label>
        <el-input
          v-model="registerData.registerForm.phone"
          placeholder="请输入手机号"
          size="large"
          class="ds-form__input"
        />
      </div>

      <!-- Password -->
      <div class="ds-form__field">
        <label class="ds-form__label">密码 <span class="required">*</span></label>
        <el-input
          v-model="registerData.registerForm.password"
          type="password"
          placeholder="请输入密码（8-20位）"
          size="large"
          class="ds-form__input"
          show-password
        />
      </div>

      <!-- Confirm Password -->
      <div class="ds-form__field">
        <label class="ds-form__label">确认密码 <span class="required">*</span></label>
        <el-input
          v-model="registerData.registerForm.confirmPassword"
          type="password"
          placeholder="请再次输入密码"
          size="large"
          class="ds-form__input"
          show-password
          @keyup.enter="handleRegister()"
        />
      </div>

      <!-- Submit -->
      <el-button
        type="primary"
        size="large"
        class="ds-form__submit"
        :loading="loginLoading"
        @click="handleRegister()"
      >
        注 册
      </el-button>

      <!-- Back to Login -->
      <div class="ds-form__get-account">
        <button type="button" class="ds-form__link" @click="handleBackLogin()">
          已有账号？返回登录
        </button>
      </div>
    </el-form>
  </div>

  <!-- Human Verify Modal -->
  <HumanVerify
    :visible="verifyVisible"
    @success="onVerifySuccess"
    @close="verifyVisible = false"
  />
</template>

<script lang="ts" setup>
import { ElLoading } from 'element-plus'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import * as authUtil from '@/utils/auth'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import { resolveFirstAccessibleMenuPath } from '@/router/menu-path'
import * as LoginApi from '@/api/login'
import { LoginStateEnum, useLoginState } from './useLogin'
import { useUserStoreWithOut } from '@/store/modules/user'
import { removeToken, setAccessToken } from '@/utils/auth'
import HumanVerify from '@/components/HumanVerify/index.vue'

defineOptions({ name: 'DsRegisterForm' })

const message = useMessage()
const formRegister = ref()
const verifyToken = ref('')
const verifyVisible = ref(false)
const { handleBackLogin, getLoginState } = useLoginState()
const { currentRoute, push } = useRouter()
const redirect = ref<string>('')
const loginLoading = ref(false)
const loading = ref()

const getShow = computed(() => unref(getLoginState) === LoginStateEnum.REGISTER)

const equalToPassword = (rule: any, value: string, callback: any) => {
  if (registerData.registerForm.password !== value) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const emailValidator = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入邮箱'))
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    callback(new Error('请输入有效的邮箱地址'))
  } else {
    callback()
  }
}

const phoneValidator = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入有效的手机号'))
  } else {
    callback()
  }
}

// 点击注册 -> 先验证表单 -> 弹出验证弹窗
const handleRegister = async () => {
  try {
    await formRegister.value?.validate()
  } catch {
    return
  }
  verifyVisible.value = true
}

// 验证成功 -> 执行注册
function onVerifySuccess(token: string) {
  verifyToken.value = token
  verifyVisible.value = false
  doRegister()
}

// 实际注册请求
const doRegister = async () => {
  loginLoading.value = true
  try {
    const res = await LoginApi.register({
      account: registerData.registerForm.username,
      name: registerData.registerForm.nickname,
      email: registerData.registerForm.email,
      phone: registerData.registerForm.phone,
      password: registerData.registerForm.password,
      verifyToken: verifyToken.value
    })

    if (!res) return

    loading.value = ElLoading.service({
      lock: true,
      text: '注册成功，正在自动登录...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    removeToken()
    setAccessToken(res.token)

    const userStore = useUserStoreWithOut()
    const permissionStore = usePermissionStoreWithOut()
    try {
      await userStore.setUserInfoAction()
      await permissionStore.generateRoutes()
      await push({ path: '/' })
    } catch (error) {
      console.error('获取用户信息或生成路由失败:', error)
      message.error('系统初始化失败，请刷新页面重试')
    }
  } catch (error: any) {
    message.error(error?.message || '注册失败，请稍后重试')
  } finally {
    loginLoading.value = false
    loading.value?.close()
  }
}

const registerRules = {
  username: [
    { required: true, trigger: 'blur', message: '请输入您的账号' },
    { min: 3, max: 30, message: '用户账号长度必须介于 3 和 30 之间', trigger: 'blur' }
  ],
  nickname: [
    { required: true, trigger: 'blur', message: '请输入您的昵称' },
    { min: 1, max: 30, message: '昵称长度必须介于 1 和 30 之间', trigger: 'blur' }
  ],
  email: [
    { required: true, trigger: 'blur', message: '请输入邮箱' },
    { validator: emailValidator, trigger: 'blur' }
  ],
  phone: [
    { required: true, trigger: 'blur', message: '请输入手机号' },
    { validator: phoneValidator, trigger: 'blur' }
  ],
  password: [
    { required: true, trigger: 'blur', message: '请输入您的密码' },
    { min: 8, max: 20, message: '用户密码长度必须介于 8 和 20 之间', trigger: 'blur' },
    { pattern: /^[^<>"'|\\]+$/, message: '不能包含非法字符：< > " \' \\\ |', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, trigger: 'blur', message: '请再次输入您的密码' },
    { required: true, validator: equalToPassword, trigger: 'blur' }
  ]
}

const registerData = reactive({
  registerForm: {
    username: '',
    nickname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  }
})

const resolveFirstAccessiblePath = () => {
  const permissionStore = usePermissionStoreWithOut()
  return resolveFirstAccessibleMenuPath(permissionStore.getAddRouters) || '/403'
}

watch(
  () => currentRoute.value,
  (route: RouteLocationNormalizedLoaded) => {
    redirect.value = route?.query?.redirect as string
  },
  {
    immediate: true
  }
)
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
    color: var(--el-text-color-secondary);
    font-weight: 400;
  }

  &__title {
    margin: 4px 0 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--el-color-primary);
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
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.03em;

    .required {
      color: var(--el-color-danger);
      margin-left: 2px;
    }
  }

  &__input {
    :deep(.el-input__wrapper) {
      padding: 0 12px;
      background: var(--el-fill-color-light);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 6px;
      box-shadow: none !important;
      transition: border-color 0.2s;
    }

    :deep(.el-input__wrapper:hover) {
      border-color: var(--el-border-color);
    }

    :deep(.el-input__wrapper.is-focus) {
      border-color: var(--el-color-primary);
    }

    :deep(.el-input__inner) {
      height: 32px;
      font-size: 12px;
      color: var(--el-text-color-primary);
    }
  }

  // 手机号国际区号前缀
  &__phone-code {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-regular);
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  // 错误提示
  &__error-tip {
    font-size: 11px;
    color: var(--el-color-danger);
    line-height: 1.2;
    margin-top: 2px;
  }

  // 错误提示淡入淡出
  &__error-fade-enter-active,
  &__error-fade-leave-active {
    transition: opacity 0.2s ease;
  }

  &__error-fade-enter-from,
  &__error-fade-leave-to {
    opacity: 0;
  }

  &__submit {
    width: 100%;
    height: 32px;
    margin-top: 0;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    background: var(--el-color-primary);
    border: none;
    border-radius: 6px;

    &:hover {
      background: var(--el-color-primary-light-3);
    }
  }

  &__get-account {
    display: flex;
    justify-content: center;
    margin-top: 8px;
  }

  &__link {
    padding: 0;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-color-primary);
    cursor: pointer;
    background: transparent;
    border: none;
    transition: color 0.15s ease;

    &:hover {
      color: var(--el-color-primary-light-3);
    }
  }
}

// Tablet
@media (width <= 1200px) {
  .ds-form {
    padding: 16px;
  }
}

// Mobile
@media (width <= 768px) {
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
