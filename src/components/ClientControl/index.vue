<template>
  <div class="client-control">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的客户端</span>
          <el-button type="primary" size="small" @click="refreshClients" :loading="loading">
            <Icon icon="ep:refresh" class="mr-5px" />
            刷新
          </el-button>
        </div>
      </template>

      <el-empty v-if="!loading && clients.length === 0" description="暂无客户端连接" />

      <div v-else class="client-list">
        <div v-for="client in clients" :key="client.id" class="client-item">
          <div class="client-info">
            <div class="client-id">
              <Icon icon="ep:connection" class="mr-4px" />
              <span class="label">连接 ID：</span>
              <span class="value">{{ client.id }}</span>
            </div>
            <div class="client-meta">
              <el-tag v-if="client.clientSource" size="small" type="info">
                {{ client.clientSource }}
              </el-tag>
              <span class="meta-item" v-if="client.ip">
                <Icon icon="ep:location" class="mr-4px" />
                {{ client.ip }}
              </span>
              <span class="meta-item" v-if="client.connectedAt">
                <Icon icon="ep:clock" class="mr-4px" />
                {{ formatPast(new Date(client.connectedAt)) }}
              </span>
            </div>
          </div>
          <div class="client-actions">
            <el-button type="primary" size="small" @click="handleSendMessage(client)">
              <Icon icon="ep:message" class="mr-4px" />
              发送消息
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 发送消息对话框 -->
    <el-dialog
      v-model="sendMessageDialogVisible"
      title="发送消息"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
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
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { formatPast } from '@/utils/formatTime'
import { ClientControlService } from '@/services/clientControl'
import type { WebsocketConnectionVO } from '@/api/system/websocket'

defineOptions({ name: 'ClientControl' })

const clients = ref<WebsocketConnectionVO[]>([])
const loading = ref(false)
const sendMessageDialogVisible = ref(false)
const currentClient = ref<WebsocketConnectionVO | null>(null)
const messageContent = ref('')
const sending = ref(false)

const refreshClients = async () => {
  loading.value = true
  try {
    clients.value = await ClientControlService.getMyClients()
    if (clients.value.length === 0) {
      ElMessage.info('当前没有已连接的客户端')
    }
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
  if (!currentClient.value) {
    return
  }

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

onMounted(() => {
  refreshClients()
})
</script>

<style lang="scss" scoped>
.client-control {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .client-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .client-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    transition: all 0.3s;

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  .client-info {
    flex: 1;
  }

  .client-id {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-weight: 500;

    .label {
      color: var(--el-text-color-secondary);
      margin-right: 4px;
    }

    .value {
      font-family: monospace;
      color: var(--el-color-primary);
    }
  }

  .client-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    .meta-item {
      display: flex;
      align-items: center;
    }
  }

  .client-actions {
    margin-left: 16px;
  }
}
</style>

