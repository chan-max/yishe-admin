<template>
  <Dialog v-model="dialogVisible" title="默认通知渠道" width="680px">
    <div
      class="mb-14px rounded-12px bg-[var(--el-fill-color-light)] px-14px py-10px text-[12px] leading-[1.7] text-[var(--el-text-color-secondary)]"
    >
      已登录用户调用开放发送接口时，如果没有显式传入 <code>channelId</code>，系统会优先使用这里绑定的默认通知渠道。
    </div>

    <el-alert
      :title="currentSummaryText"
      type="info"
      :closable="false"
      class="mb-14px"
    />

    <el-form v-loading="loading || saving" label-position="top">
      <el-form-item label="默认通知渠道">
        <el-select
          v-model="formData.defaultMessagePushId"
          class="w-full"
          clearable
          filterable
          placeholder="不绑定则每次都需要显式传入 channelId"
        >
          <el-option
            v-for="item in channelOptions"
            :key="item.id"
            :label="formatChannelOptionLabel(item)"
            :value="item.id!"
            :disabled="item.enabled === false"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { MessagePushConfig, MessagePushPlatform } from '@/api/messagePush'
import {
  getMessagePushSetting,
  updateMessagePushSetting,
  type UserMessagePushSetting
} from '@/api/user'

const props = defineProps<{
  channels: MessagePushConfig[]
}>()

const emit = defineEmits<{
  (event: 'saved', payload: UserMessagePushSetting): void
}>()

const dialogVisible = ref(false)
const loading = ref(false)
const saving = ref(false)
const currentSetting = ref<UserMessagePushSetting>({
  defaultMessagePushId: null,
  defaultMessagePush: null
})

const formData = reactive({
  defaultMessagePushId: null as number | null
})

const platformLabelMap: Record<MessagePushPlatform, string> = {
  feishu: '飞书',
  wecom: '企业微信'
}

const channelOptions = computed(() => {
  return [...(props.channels || [])].sort(
    (left, right) => Number(right.id || 0) - Number(left.id || 0)
  )
})

const currentSummaryText = computed(() => {
  const current = currentSetting.value?.defaultMessagePush
  if (!current || !currentSetting.value?.defaultMessagePushId) {
    return '当前未绑定默认通知渠道'
  }
  const suffix = current.enabled === false ? '，该渠道已停用，请尽快调整' : ''
  return `当前默认通知：${current.name}（ID: ${current.id} / ${formatPlatform(
    current.platform as MessagePushPlatform
  )}）${suffix}`
})

const formatPlatform = (platform?: MessagePushPlatform | string) => {
  const normalized = String(platform || '').trim().toLowerCase() as MessagePushPlatform
  return platformLabelMap[normalized] || normalized || '-'
}

const formatChannelOptionLabel = (item: MessagePushConfig) => {
  const platform = formatPlatform(item.platform)
  const status = item.enabled === false ? '已停用' : '启用'
  return `${item.name}（ID: ${item.id} / ${platform} / ${status}）`
}

const loadSetting = async () => {
  loading.value = true
  try {
    const data = await getMessagePushSetting()
    currentSetting.value = data || {
      defaultMessagePushId: null,
      defaultMessagePush: null
    }
    formData.defaultMessagePushId = currentSetting.value.defaultMessagePushId || null
  } finally {
    loading.value = false
  }
}

const open = async () => {
  dialogVisible.value = true
  await loadSetting()
}

const submitForm = async () => {
  const selectedChannel =
    channelOptions.value.find((item) => Number(item.id) === Number(formData.defaultMessagePushId)) || null

  if (selectedChannel && selectedChannel.enabled === false) {
    ElMessage.error('所选通知渠道已停用，请重新选择')
    return
  }

  saving.value = true
  try {
    const data = await updateMessagePushSetting(formData.defaultMessagePushId)
    currentSetting.value = data || {
      defaultMessagePushId: null,
      defaultMessagePush: null
    }
    formData.defaultMessagePushId = currentSetting.value.defaultMessagePushId || null
    ElMessage.success('默认通知渠道已保存')
    emit('saved', currentSetting.value)
    dialogVisible.value = false
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>
