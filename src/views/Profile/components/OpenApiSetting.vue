<template>
  <section class="settings-panel settings-panel--main">
    <div class="settings-panel__title">Open API</div>

    <div class="open-api-head">
      <div>
        <div class="open-api-head__label">X-Open-Api-Key</div>
        <div class="open-api-head__desc">
          传入该请求头时，接口将按当前用户身份执行，原有 JWT 登录和后台功能不受影响。
        </div>
      </div>
      <el-switch
        v-model="enabled"
        active-text="已启用"
        inactive-text="已禁用"
        :loading="toggleLoading"
        @change="handleToggle"
      />
    </div>

    <el-form label-position="top">
      <el-form-item label="当前 Key">
        <el-input v-model="keyValue" readonly placeholder="尚未生成">
          <template #append>
            <el-button :disabled="!keyValue" @click="copyKey">复制</el-button>
          </template>
        </el-input>
      </el-form-item>

      <div class="open-api-meta">
        <span>更新时间：{{ updatedAtText }}</span>
        <span>状态：{{ enabled ? '启用中' : '已禁用' }}</span>
      </div>

      <div class="open-api-actions">
        <el-button type="primary" :loading="generateLoading" @click="handleGenerate">
          {{ keyValue ? '重置并生成新 Key' : '生成 Key' }}
        </el-button>
      </div>
    </el-form>
  </section>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { generateOpenApiKey, getOpenApiSetting, updateOpenApiSetting } from '@/api/user'

defineOptions({ name: 'OpenApiSetting' })

type OpenApiConfig = {
  enabled?: boolean
  key?: string
  updatedAt?: string
}

const message = useMessage()
const enabled = ref(false)
const keyValue = ref('')
const updatedAt = ref('')
const generateLoading = ref(false)
const toggleLoading = ref(false)

const updatedAtText = computed(() => {
  return updatedAt.value ? dayjs(updatedAt.value).format('YYYY-MM-DD HH:mm:ss') : '未生成'
})

const applyConfig = (config?: OpenApiConfig) => {
  enabled.value = !!config?.enabled
  keyValue.value = config?.key || ''
  updatedAt.value = config?.updatedAt || ''
}

const loadConfig = async () => {
  const res = await getOpenApiSetting()
  applyConfig(res || {})
}

const handleGenerate = async () => {
  generateLoading.value = true
  try {
    const res = await generateOpenApiKey()
    applyConfig(res || {})
    message.success('Open API Key 已生成')
  } finally {
    generateLoading.value = false
  }
}

const handleToggle = async (value: boolean) => {
  toggleLoading.value = true
  try {
    const res = await updateOpenApiSetting({ enabled: value })
    applyConfig(res || {})
    message.success(value ? 'Open API 已启用' : 'Open API 已禁用')
  } catch (error) {
    enabled.value = !value
    throw error
  } finally {
    toggleLoading.value = false
  }
}

const copyKey = async () => {
  if (!keyValue.value) return
  await navigator.clipboard.writeText(keyValue.value)
  message.success('Key 已复制')
}

onMounted(loadConfig)
</script>

<style scoped lang="scss">
.settings-panel {
  border-radius: 12px;
  background: var(--el-bg-color);
  box-shadow: var(--app-content-shadow);
}

.settings-panel--main {
  padding: 24px;
}

.settings-panel__title {
  padding-bottom: 14px;
  margin-bottom: 22px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--app-content-border-color);
}

.open-api-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.open-api-head__label {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.open-api-head__desc {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.open-api-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.open-api-actions {
  margin-top: 16px;
}

@media (max-width: 900px) {
  .open-api-head {
    flex-direction: column;
  }
}
</style>
