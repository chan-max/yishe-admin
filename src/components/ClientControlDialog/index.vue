<template>
  <el-dialog
    v-model="visible"
    title="客户端操作"
    width="600px"
    align-center
    :close-on-click-modal="false"
  >
    <div v-loading="loading">
      <el-empty v-if="!loading && clients.length === 0" description="暂无客户端连接" />

      <el-form v-else label-width="100px">
        <div
          v-for="(client, index) in clients"
          :key="client.id"
          class="mb-6 last:mb-0"
        >
          <div class="rounded-lg border p-4" :class="isClientAvailable(client) ? 'border-green-400' : 'border-gray-300'">
            <div class="mb-4 flex items-center gap-2 border-b pb-3">
              <div
                class="h-2.5 w-2.5 rounded-full"
                :class="isClientAvailable(client) ? 'bg-green-500' : 'bg-gray-400'"
              ></div>
              <span class="text-base font-semibold">客户端 {{ index + 1 }}</span>
              <el-tag v-if="client.clientSource" size="small" type="info" class="ml-2">
                {{ client.clientSource }}
              </el-tag>
            </div>

            <el-form label-width="100px">
              <el-form-item label="连接 ID">
                <span class="font-mono text-sm text-gray-700">{{ client.id }}</span>
              </el-form-item>
              <el-form-item v-if="client.ip" label="IP 地址">
                <span class="text-sm text-gray-700">{{ client.ip }}</span>
              </el-form-item>
              <el-form-item v-if="client.connectedAt" label="连接时间">
                <span class="text-sm text-gray-700">{{ formatPast(new Date(client.connectedAt)) }}</span>
              </el-form-item>
              <el-form-item label="操作">
                <el-button
                  type="primary"
                  size="default"
                  @click="handleSendMessage(client)"
                  :disabled="!isClientAvailable(client)"
                >
                  <Icon icon="ep:message" class="mr-1" />
                  发送消息
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-form>
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
const isClientAvailable = (client: WebsocketConnectionVO): boolean => {
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

