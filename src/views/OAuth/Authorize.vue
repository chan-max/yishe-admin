<template>
  <div class="oauth">
    <div class="oauth__card">
      <!-- 加载中 -->
      <div v-if="loading" class="oauth__loading">
        <el-icon class="oauth__spinner"><Loading /></el-icon>
      </div>

      <!-- 错误 -->
      <div v-else-if="error" class="oauth__error">
        <el-icon><CircleClose /></el-icon>
        <p>{{ error }}</p>
        <button class="oauth__link" @click="handleGoBack">返回</button>
      </div>

      <!-- 授权内容 -->
      <template v-else>
        <img src="/src/assets/imgs/logo.png" alt="衣设" class="oauth__logo" />

        <p class="oauth__desc">{{ authorizeText }}</p>

        <button class="oauth__btn oauth__btn--primary" :loading="submitting" @click="handleConfirm">
          同意授权
        </button>
        <button class="oauth__btn oauth__btn--text" @click="handleReject">拒绝</button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loading, CircleClose } from '@element-plus/icons-vue'
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

/** 授权文案 */
const authorizeText = computed(() => `正在授权${clientName.value}`)

const init = async () => {
  loading.value = true
  const clientId = route.query.client_id as string
  const redirect = route.query.redirect_uri as string

  if (!clientId || !redirect) {
    error.value = '参数错误'
    loading.value = false
    return
  }

  redirectUri.value = redirect
  stateVal.value = (route.query.state as string) || ''

  try {
    const res = await getAuthorizeInfo({
      client_id: clientId,
      redirect_uri: redirect,
      scope: route.query.scope as string,
      state: stateVal.value
    })
    clientName.value = res?.client?.name || clientId
    scopeList.value = res?.scope?.split(' ') || res?.client?.scopes || ['user:read']
  } catch (err: any) {
    error.value = err?.message || '加载失败'
  } finally {
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
    const sep = redirectUri.value.includes('?') ? '&' : '?'
    let url = `${redirectUri.value}${sep}code=${encodeURIComponent(res.code)}`
    if (stateVal.value) url += `&state=${encodeURIComponent(stateVal.value)}`
    window.location.href = url
  } catch (err: any) {
    ElMessage.error(err?.message || '授权失败')
  } finally {
    submitting.value = false
  }
}

const handleReject = () => {
  if (redirectUri.value) {
    const sep = redirectUri.value.includes('?') ? '&' : '?'
    window.location.href = `${redirectUri.value}${sep}error=access_denied`
  } else {
    router.push('/login')
  }
}

const handleGoBack = handleReject

onMounted(init)
</script>

<style lang="scss" scoped>
.oauth {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #fff;

  &__card {
    width: 280px;
    text-align: center;
  }

  &__loading {
    padding: 60px 0;
  }

  &__spinner {
    font-size: 24px;
    color: #ccc;
    animation: spin 1s linear infinite;
  }

  &__error {
    padding: 40px 0;

    .el-icon {
      font-size: 32px;
      color: #ff4d4f;
      margin-bottom: 12px;
    }

    p {
      color: #666;
      font-size: 14px;
      margin: 0 0 16px;
    }
  }

  &__logo {
    width: 32px;
    height: 32px;
    margin: 0 auto 16px;
    border-radius: 8px;
    object-fit: cover;
  }

  &__desc {
    font-size: 13px;
    color: #666;
    margin: 0 0 24px;
  }

  &__btn {
    width: 100%;
    height: 32px;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s;

    &--primary {
      background: #1a1a1a;
      color: #fff;
      margin-bottom: 8px;
    }

    &--primary:hover {
      opacity: 0.85;
    }

    &--text {
      background: transparent;
      color: #999;
      font-size: 12px;
    }

    &--text:hover {
      color: #333;
    }
  }

  &__link {
    background: none;
    border: none;
    color: #666;
    font-size: 14px;
    cursor: pointer;
    padding: 0;

    &:hover {
      color: #333;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
