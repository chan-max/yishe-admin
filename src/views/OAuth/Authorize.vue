<template>
  <div class="oauth">
    <!-- 加载中 -->
    <div v-if="loading" class="oauth__inner">
      <span class="oauth__dots"><span /><span /><span /></span>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="oauth__inner">
      <div class="oauth__error-icon">✕</div>
      <p class="oauth__error-text">{{ error }}</p>
      <button class="oauth__link" @click="handleGoBack">返回</button>
    </div>

    <!-- 授权内容 -->
    <div v-else class="oauth__inner">
      <img src="/src/assets/imgs/logo.png" alt="衣设" class="oauth__logo" />
      <p class="oauth__desc">{{ authorizeText }}</p>
      <button class="oauth__btn" :disabled="submitting" @click="handleConfirm">
        <span v-if="submitting" class="oauth__btn-dots"><span /><span /><span /></span>
        <span v-else>同意授权</span>
      </button>
      <button class="oauth__cancel" @click="handleReject">拒绝</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAuthorizeInfo, confirmAuthorizeWithToken } from '@/api/oauth'

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
    const res = await confirmAuthorizeWithToken({
      client_id: route.query.client_id as string,
      redirect_uri: redirectUri.value,
      scope: scopeList.value.join(' '),
      state: stateVal.value
    })
    const sep = redirectUri.value.includes('?') ? '&' : '?'
    let url = `${redirectUri.value}${sep}token=${encodeURIComponent(res.accessToken)}`
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
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  &__inner {
    text-align: center;
  }

  &__logo {
    width: 28px;
    height: 28px;
    margin: 0 auto 14px;
    border-radius: 6px;
    object-fit: cover;
    display: block;
  }

  &__desc {
    font-size: 13px;
    color: #555;
    margin: 0 0 18px;
    font-weight: 500;
  }

  &__btn {
    width: 200px;
    height: 34px;
    border: none;
    border-radius: 6px;
    background: #1a1a1a;
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
      opacity: 0.85;
    }

    &:disabled {
      opacity: 0.6;
      cursor: default;
    }
  }

  &__btn-dots {
    display: inline-flex;
    gap: 3px;

    span {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: #fff;
      animation: dot-fade 1.2s ease-in-out infinite;
    }

    span:nth-child(2) { animation-delay: 0.15s; }
    span:nth-child(3) { animation-delay: 0.3s; }
  }

  &__cancel {
    display: block;
    margin: 12px auto 0;
    background: none;
    border: none;
    color: #999;
    font-size: 12px;
    cursor: pointer;
    padding: 4px 8px;

    &:hover {
      color: #333;
    }
  }

  &__link {
    background: none;
    border: none;
    color: #999;
    font-size: 12px;
    cursor: pointer;
    padding: 0;

    &:hover {
      color: #333;
    }
  }

  &__error-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #fff;
    color: #ff4d4f;
    font-size: 14px;
    line-height: 32px;
    text-align: center;
    margin: 0 auto 10px;
  }

  &__error-text {
    font-size: 12px;
    color: #888;
    margin: 0 0 12px;
  }

  &__dots {
    display: inline-flex;
    gap: 4px;

    span {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #bbb;
      animation: dot-fade 1.2s ease-in-out infinite;
    }

    span:nth-child(2) { animation-delay: 0.15s; }
    span:nth-child(3) { animation-delay: 0.3s; }
  }
}

@keyframes dot-fade {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
</style>
