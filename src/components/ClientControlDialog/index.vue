<template>
  <el-dialog
    v-model="visible"
    width="800px"
    align-center
    :close-on-click-modal="false"
  >
    <template #header>
      <span>客户端操作 ({{ clients.length }})</span>
    </template>
    <div v-loading="loading">
      <el-empty v-if="!loading && clients.length === 0" description="暂无客户端连接" />

      <div v-else class="client-list">
        <div
          v-for="(client, index) in clients"
          :key="client.id"
          class="client-card"
        >
          <div class="client-header">
            <div class="flex items-center gap-2">
              <div
                class="status-dot"
                :class="isClientAvailable(client) ? 'bg-green-500' : 'bg-gray-400'"
              ></div>
              <span class="client-title">客户端 {{ index + 1 }}</span>
              <el-tag v-if="client.clientSource" size="small" type="info" class="ml-2">
                {{ client.clientSource }}
              </el-tag>
            </div>
          </div>

          <div class="client-content">
            <div class="client-info">
              <div class="client-field">
                <span class="field-label">连接 ID</span>
                <span class="field-value font-mono">{{ client.id }}</span>
              </div>
              <div v-if="client.ip" class="client-field">
                <span class="field-label">IP 地址</span>
                <span class="field-value">{{ client.ip }}</span>
              </div>
              <div v-if="client.connectedAt" class="client-field">
                <span class="field-label">连接时间</span>
                <span class="field-value">{{ formatPast(new Date(client.connectedAt)) }}</span>
              </div>
            </div>
            <div class="client-actions">
              <el-button
                type="primary"
                size="small"
                @click="handleSendMessage(client)"
                :disabled="!isClientAvailable(client)"
              >
                <Icon icon="ep:message" class="mr-1" />
                发送消息
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 发送消息对话框 -->
    <el-dialog
      v-model="sendMessageDialogVisible"
      title="发送消息"
      width="500px"
      append-to-body
    >
      <el-form label-width="80px">
        <el-form-item label="连接 ID">
          <el-input :value="currentClient?.id" disabled />
        </el-form-item>
        <el-form-item label="消息内容">
          <el-input
            v-model="messageContent"
            type="textarea"
            :rows="4"
            placeholder="请输入要发送的消息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendMessageDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmSendMessage" :loading="sending">
          发送
        </el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { formatPast } from '@/utils/formatTime'
import { ClientControlService } from '@/services/clientControl'
import { isLocalConnected } from '@/stores/connectionStatus'
import type { WebsocketConnectionVO } from '@/api/system/websocket'

defineOptions({ name: 'ClientControlDialog' })

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const clients = ref<WebsocketConnectionVO[]>([])
const loading = ref(false)
const sendMessageDialogVisible = ref(false)
const currentClient = ref<WebsocketConnectionVO | null>(null)
const messageContent = ref('')
const sending = ref(false)

// 判断客户端是否可用（参考 header 中的状态检测方式）
const isClientAvailable = (_client: WebsocketConnectionVO): boolean => {
  // 直接使用 header 中的连接状态
  return isLocalConnected.value
}

// 监听弹窗打开，自动刷新列表
watch(visible, (newVal) => {
  if (newVal) {
    refreshClients()
  }
})

const refreshClients = async () => {
  loading.value = true
  try {
    clients.value = await ClientControlService.getMyClients()
  } catch (error) {
    console.error('刷新客户端列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSendMessage = (client: WebsocketConnectionVO) => {
  currentClient.value = client
  messageContent.value = ''
  sendMessageDialogVisible.value = true
}

const handleConfirmSendMessage = async () => {
  if (!currentClient.value) return

  if (!messageContent.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }

  sending.value = true
  try {
    const success = await ClientControlService.sendTextMessage(
      currentClient.value.id,
      messageContent.value.trim()
    )
    
    if (success) {
      sendMessageDialogVisible.value = false
      messageContent.value = ''
    }
  } catch (error) {
    console.error('发送消息失败:', error)
  } finally {
    sending.value = false
  }
}
</script>

<style scoped lang="scss">
.client-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.client-card {
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.client-header {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.client-title {
  font-size: 14px;
  font-weight: 600;
}

.client-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.client-info {
  flex: 1;
  display: flex;
  gap: 24px;
  align-items: center;
}

.client-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
}

.field-value {
  font-size: 13px;
  word-break: break-all;
}

.client-actions {
  flex-shrink: 0;
}

.mr-1 {
  margin-right: 4px;
}

.ml-2 {
  margin-left: 8px;
}
</style>
