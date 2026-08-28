<template>
  <div class="oauth">
    <div class="oauth__box">
      <!-- 顶部品牌 -->
      <div class="oauth__brand">
        <img src="/src/assets/imgs/logo.png" alt="1s" class="oauth__logo" />
        <span class="oauth__brand-name">一设设计</span>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="oauth__state">
        <el-icon class="oauth__spinner"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <!-- 错误 -->
      <div v-else-if="error" class="oauth__state">
        <el-icon class="oauth__error-icon"><CircleClose /></el-icon>
        <span>{{ error }}</span>
        <el-button class="oauth__btn oauth__btn--ghost" @click="handleGoBack">返回</el-button>
      </div>

      <!-- 授权内容 -->
      <div v-else class="oauth__body">
        <!-- 标题 -->
        <h1 class="oauth__title">使用一设账号登录</h1>
        <p class="oauth__subtitle">{{ clientName }}</p>

        <!-- 权限列表 -->
        <div class="oauth__scopes">
          <div v-for="scope in scopeList" :key="scope" class="oauth__scope">
            <el-icon class="oauth__scope-check"><Check /></el-icon>
            <span>{{ formatScope(scope) }}</span>
          </div>
        </div>

        <!-- 用户 -->
        <div class="oauth__user">
          <div class="oauth__user-avatar">{{ userAccount?.charAt(0)?.toUpperCase() || 'U' }}</div>
          <span class="oauth__user-name">{{ userAccount }}</span>
        </div>

        <!-- 按钮 -->
        <div class="oauth__actions">
          <el-button
            type="primary"
            :loading="submitting"
            class="oauth__btn oauth__btn--primary"
            @click="handleConfirm"
          >
            同意并继续
          </el-button>
          <el-button class="oauth__btn oauth__btn--ghost" @click="handleReject">
            取消
          </el-button>
        </div>
      </div>
    </div>

    <!-- 底部 -->
    <p class="oauth__footer">授权后将自动跳转回应用</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loading, Check, CircleClose } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getAuthorizeInfo, confirmAuthorize } from '@/api/oauth'

defineOptions({ name: 'OAuthAuthorize' })

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const clientName = ref('')
const scopeList = ref<string[]>([])
const redirectUri = ref('')
const stateVal = ref('')

const userAccount = computed(() => {
  const userStr = localStorage.getItem('userInfo')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      return user.account || user.name || '用户'
    } catch {
      return '用户'
    }
  }
  return '用户'
})

const formatScope = (scope: string): string => {
  const map: Record<string, string> = {
    'user:read': '读取你的基本信息',
    'user:write': '修改你的基本信息',
    'user:profile': '访问你的个人资料',
    'file:read': '读取你的文件',
    'file:write': '上传和修改你的文件'
  }
  return map[scope] || scope
}

const init = async () => {
  loading.value = true
  error.value = ''

  const clientId = route.query.client_id as string
  const redirect = route.query.redirect_uri as string
  const scope = route.query.scope as string | undefined
  const state = route.query.state as string | undefined

  if (!clientId || !redirect) {
    error.value = '缺少必要参数'
    loading.value = false
    return
  }

  redirectUri.value = redirect
  stateVal.value = state || ''

  try {
    const res = await getAuthorizeInfo({
      client_id: clientId,
      redirect_uri: redirect,
      scope,
      state
    })
    clientName.value = res?.client?.name || clientId
    scopeList.value = res?.scope?.split(' ') || res?.client?.scopes || ['user:read']
    loading.value = false
  } catch (err: any) {
    error.value = err?.message || '获取授权信息失败'
    loading.value = false
  }
}

const handleConfirm = async () => {
  submitting.value = true
  try {
    const res = await confirmAuthorize({
      client_id: route.query.client_id as string,
      redirect_uri: redirectUri.value,
      scope: scopeList.value.join(' '),
      state: stateVal.value
    })

    const code = res.code
    const separator = redirectUri.value.includes('?') ? '&' : '?'
    let callbackUrl = `${redirectUri.value}${separator}code=${encodeURIComponent(code)}`
    if (stateVal.value) {
      callbackUrl += `&state=${encodeURIComponent(stateVal.value)}`
    }
    window.location.href = callbackUrl
  } catch (err: any) {
    ElMessage.error(err?.message || '授权失败，请重试')
  } finally {
    submitting.value = false
  }
}

const handleReject = () => {
  if (redirectUri.value) {
    const separator = redirectUri.value.includes('?') ? '&' : '?'
    window.location.href = `${redirectUri.value}${separator}error=access_denied`
  } else {
    router.push('/login')
  }
}

const handleGoBack = () => {
  if (redirectUri.value) {
    const separator = redirectUri.value.includes('?') ? '&' : '?'
    window.location.href = `${redirectUri.value}${separator}error=access_denied`
  } else {
    router.push('/login')
  }
}

onMounted(() => {
  init()
})
</script>

<style lang="scss" scoped>
.oauth {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #fafafa;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  &__box {
    width: 100%;
    max-width: 380px;
    background: #fff;
    border: 1px solid #eaeaea;
    border-radius: 8px;
    padding: 36px 32px;
  }

  &__brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 32px;
  }

  &__logo {
    height: 24px;
  }

  &__brand-name {
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }

  &__state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px 0;
    color: #666;
    font-size: 14px;
  }

  &__spinner {
    font-size: 24px;
    animation: spin 1s linear infinite;
  }

  &__error-icon {
    font-size: 24px;
    color: #f56c6c;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    text-align: center;
    margin: 0;
  }

  &__subtitle {
    font-size: 13px;
    color: #888;
    text-align: center;
    margin: 0;
  }

  &__scopes {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: #f8f8f8;
    border-radius: 6px;
  }

  &__scope {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #555;
  }

  &__scope-check {
    color: #52c41a;
    font-size: 14px;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: #f0f7ff;
    border-radius: 6px;
  }

  &__user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #409eff;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__user-name {
    font-size: 13px;
    color: #333;
    font-weight: 500;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__btn {
    width: 100%;
    height: 40px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;

    &--primary {
      background: #1a1a1a;
      border-color: #1a1a1a;
    }

    &--primary:hover {
      background: #333;
      border-color: #333;
    }

    &--ghost {
      background: transparent;
      border-color: #d9d9d9;
      color: #666;
    }

    &--ghost:hover {
      border-color: #999;
      color: #333;
    }
  }

  &__footer {
    margin-top: 20px;
    font-size: 12px;
    color: #bbb;
    text-align: center;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
