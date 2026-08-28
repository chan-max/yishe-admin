<template>
  <div class="oauth-authorize">
    <div class="oauth-authorize__card">
      <!-- Logo -->
      <div class="oauth-authorize__logo">
        <img src="/src/assets/imgs/logo.png" alt="一设设计" />
      </div>

      <h2 class="oauth-authorize__title">授权登录</h2>

      <!-- 加载中 -->
      <div v-if="loading" class="oauth-authorize__loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="error" class="oauth-authorize__error">
        <el-alert :title="error" type="error" show-icon :closable="false" />
        <el-button class="oauth-authorize__back" @click="handleGoBack">
          返回
        </el-button>
      </div>

      <!-- 授权内容 -->
      <div v-else class="oauth-authorize__content">
        <!-- 应用信息 -->
        <div class="oauth-authorize__client">
          <el-icon class="oauth-authorize__client-icon"><Connection /></el-icon>
          <span class="oauth-authorize__client-name">{{ clientName }}</span>
          <span class="oauth-authorize__client-tip">请求使用一设账号登录</span>
        </div>

        <!-- 用户信息 -->
        <div class="oauth-authorize__user">
          <el-avatar :size="32" class="oauth-authorize__avatar">
            {{ userAccount?.charAt(0)?.toUpperCase() || 'U' }}
          </el-avatar>
          <span class="oauth-authorize__user-name">{{ userAccount }}</span>
        </div>

        <!-- 权限说明 -->
        <div class="oauth-authorize__scopes">
          <span class="oauth-authorize__scopes-title">该应用将获得以下权限：</span>
          <ul class="oauth-authorize__scopes-list">
            <li v-for="scope in scopeList" :key="scope" class="oauth-authorize__scope-item">
              <el-icon class="oauth-authorize__scope-icon"><Check /></el-icon>
              <span>{{ formatScope(scope) }}</span>
            </li>
          </ul>
        </div>

        <!-- 操作按钮 -->
        <div class="oauth-authorize__actions">
          <el-button
            type="primary"
            :loading="submitting"
            class="oauth-authorize__btn"
            @click="handleConfirm"
          >
            同意授权
          </el-button>
          <el-button class="oauth-authorize__btn" @click="handleReject">
            拒绝
          </el-button>
        </div>

        <!-- 环境提示 -->
        <div v-if="isDevEnvironment" class="oauth-authorize__env-tip">
          <el-tag size="small" type="info">开发环境</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loading, Connection, Check } from '@element-plus/icons-vue'
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
  // 从 store 获取当前登录用户
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

/** 判断是否为开发环境 */
const isDevEnvironment = computed(() => {
  const uri = redirectUri.value
  return uri.includes('localhost') || uri.includes('127.0.0.1') || uri.includes('1521')
})

/** 格式化 scope 文本 */
const formatScope = (scope: string): string => {
  const scopeMap: Record<string, string> = {
    'user:read': '读取你的基本信息',
    'user:write': '修改你的基本信息',
    'user:profile': '访问你的个人资料',
    'file:read': '读取你的文件',
    'file:write': '上传和修改你的文件'
  }
  return scopeMap[scope] || scope
}

/** 初始化授权信息 */
const init = async () => {
  loading.value = true
  error.value = ''

  const clientId = route.query.client_id as string
  const redirect = route.query.redirect_uri as string
  const scope = route.query.scope as string | undefined
  const state = route.query.state as string | undefined

  if (!clientId || !redirect) {
    error.value = '缺少必要参数（client_id 或 redirect_uri）'
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

/** 确认授权 */
const handleConfirm = async () => {
  submitting.value = true
  try {
    const res = await confirmAuthorize({
      client_id: route.query.client_id as string,
      redirect_uri: redirectUri.value,
      scope: scopeList.value.join(' '),
      state: stateVal.value
    })

    // 拼接授权码到回调地址
    const code = res.code
    const separator = redirectUri.value.includes('?') ? '&' : '?'
    let callbackUrl = `${redirectUri.value}${separator}code=${encodeURIComponent(code)}`
    if (stateVal.value) {
      callbackUrl += `&state=${encodeURIComponent(stateVal.value)}`
    }

    // 跳转到客户端回调地址
    window.location.href = callbackUrl
  } catch (err: any) {
    ElMessage.error(err?.message || '授权失败，请重试')
  } finally {
    submitting.value = false
  }
}

/** 拒绝授权 */
const handleReject = () => {
  // 如果 redirect_uri 有效，返回错误信息
  if (redirectUri.value) {
    const separator = redirectUri.value.includes('?') ? '&' : '?'
    const callbackUrl = `${redirectUri.value}${separator}error=access_denied&error_description=用户拒绝授权`
    window.location.href = callbackUrl
  } else {
    router.push('/login')
  }
}

/** 返回 */
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
.oauth-authorize {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;

  &__card {
    width: 100%;
    max-width: 420px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgb(0 0 0 / 10%);
    padding: 32px;
  }

  &__logo {
    text-align: center;
    margin-bottom: 16px;

    img {
      height: 40px;
    }
  }

  &__title {
    text-align: center;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 24px;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px 0;
    color: #909399;
  }

  &__error {
    :deep(.el-alert) {
      margin-bottom: 16px;
    }
  }

  &__back {
    width: 100%;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__client {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
  }

  &__client-icon {
    font-size: 28px;
    color: #409eff;
  }

  &__client-name {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  &__client-tip {
    font-size: 13px;
    color: #909399;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
  }

  &__avatar {
    background: #409eff;
    color: #fff;
  }

  &__user-name {
    font-size: 14px;
    color: #606266;
  }

  &__scopes {
    padding: 12px 0;
  }

  &__scopes-title {
    font-size: 13px;
    color: #606266;
    margin-bottom: 8px;
    display: block;
  }

  &__scopes-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__scope-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #606266;
  }

  &__scope-icon {
    color: #67c23a;
    font-size: 14px;
  }

  &__actions {
    display: flex;
    gap: 12px;
  }

  &__btn {
    flex: 1;
  }

  &__env-tip {
    text-align: center;
  }
}
</style>
