<template>
  <div class="client-control">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="card-header__title">
            <span>我的客户端</span>
            <span v-if="clients.length" class="card-header__summary">
              在线 {{ onlineClientCount }} / 断线 {{ offlineClientCount }}
            </span>
          </div>
          <el-button type="primary" @click="refreshClients" :loading="loading">
            <Icon icon="ep:refresh" class="mr-5px" />
            刷新
          </el-button>
        </div>
      </template>

      <el-empty v-if="!loading && clients.length === 0" description="暂无客户端连接" />

      <div v-else class="client-list">
        <div
          v-for="client in clients"
          :key="client.id"
          :class="['client-item', isClientOnline(client) ? 'client-item--online' : 'client-item--offline']"
        >
          <div class="client-item__top">
            <div class="client-info">
              <div class="client-title-row">
                <div class="client-title">{{ getClientTitle(client) }}</div>
                <el-tag :type="getClientStatusTagType(client)" size="small">
                  {{ getClientStatusText(client) }}
                </el-tag>
                <el-tag v-if="client.clientSource" type="info">
                  {{ client.clientSource }}
                </el-tag>
              </div>
              <div class="client-status-banner">
                <span
                  :class="[
                    'client-status-banner__dot',
                    isClientOnline(client) ? 'client-status-banner__dot--online' : 'client-status-banner__dot--offline'
                  ]"
                />
                <span class="client-status-banner__label">{{ getClientStatusText(client) }}</span>
                <span class="client-status-banner__meta">{{ getClientStatusMeta(client) }}</span>
              </div>
              <div class="client-id">
                <Icon icon="ep:connection" class="mr-4px" />
                <span class="label">连接 ID：</span>
                <span class="value">{{ client.id }}</span>
              </div>
              <div class="client-meta">
                <span class="meta-item" v-if="client.namespace">
                  <Icon icon="ep:folder-opened" class="mr-4px" />
                  {{ client.namespace }}
                </span>
                <span class="meta-item" v-if="client.ip">
                  <Icon icon="ep:location" class="mr-4px" />
                  {{ client.ip }}
                </span>
                <span class="meta-item" v-if="client.connectedAt">
                  <Icon icon="ep:clock" class="mr-4px" />
                  {{ formatPast(new Date(client.connectedAt)) }}
                </span>
                <span class="meta-item" v-if="client.isOnline && client.lastOnlineAt">
                  <Icon icon="ep:success-filled" class="mr-4px" />
                  最近在线 {{ formatDateSafe(client.lastOnlineAt) }}
                </span>
                <span class="meta-item" v-else-if="client.lastOfflineAt">
                  <Icon icon="ep:warning-filled" class="mr-4px" />
                  断线于 {{ formatDateSafe(client.lastOfflineAt) }}
                </span>
              </div>
            </div>
            <div class="client-actions">
              <el-button text @click="toggleExpand(client.id)">
                {{ expandedIds.includes(client.id) ? '收起详情' : '查看详情' }}
              </el-button>
              <el-button type="primary" :disabled="!client.isOnline" @click="handleSendMessage(client)">
                <Icon icon="ep:message" class="mr-4px" />
                发送消息
              </el-button>
            </div>
          </div>

          <div v-if="expandedIds.includes(client.id)" class="client-details">
            <div class="detail-grid">
              <div class="detail-card">
                <div class="detail-card__title">连接概览</div>
                <div class="detail-row"><span class="detail-key">当前状态</span><span class="detail-value">{{ getClientStatusText(client) }}</span></div>
                <div class="detail-row"><span class="detail-key">连接 ID</span><span class="detail-value detail-value--mono">{{ client.id }}</span></div>
                <div class="detail-row"><span class="detail-key">命名空间</span><span class="detail-value">{{ client.namespace || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">连接来源</span><span class="detail-value">{{ client.clientSource || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">连接时间</span><span class="detail-value">{{ formatDateSafe(client.connectedAt) }}</span></div>
                <div class="detail-row"><span class="detail-key">持续时长</span><span class="detail-value">{{ client.connectedAt ? formatPast(new Date(client.connectedAt)) : '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">最近在线</span><span class="detail-value">{{ formatDateSafe(client.lastOnlineAt) }}</span></div>
                <div class="detail-row"><span class="detail-key">断线时间</span><span class="detail-value">{{ formatDateSafe(client.lastOfflineAt) }}</span></div>
                <div class="detail-row"><span class="detail-key">节点状态</span><span class="detail-value">{{ client.nodeStatus || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">IP</span><span class="detail-value">{{ client.ip || client.clientInfo?.location?.ip || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">User-Agent</span><span class="detail-value detail-value--break">{{ client.userAgent || client.clientInfo?.userAgent || '-' }}</span></div>
              </div>

              <div class="detail-card">
                <div class="detail-card__title">设备环境</div>
                <div class="detail-row"><span class="detail-key">机器码</span><span class="detail-value">{{ client.clientInfo?.machine?.code || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">平台</span><span class="detail-value">{{ client.clientInfo?.platform?.os || client.clientInfo?.platform || client.clientInfo?.machine?.platform || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">浏览器</span><span class="detail-value">{{ formatBrowser(client) }}</span></div>
                <div class="detail-row"><span class="detail-key">操作系统</span><span class="detail-value">{{ formatOs(client) }}</span></div>
                <div class="detail-row"><span class="detail-key">语言</span><span class="detail-value">{{ client.clientInfo?.language || client.clientInfo?.uiLanguage || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">时区</span><span class="detail-value">{{ client.clientInfo?.timeZone || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">硬件</span><span class="detail-value">{{ formatDevice(client) }}</span></div>
              </div>

              <div class="detail-card">
                <div class="detail-card__title">应用信息</div>
                <div class="detail-row"><span class="detail-key">客户端 ID</span><span class="detail-value detail-value--mono">{{ client.clientInfo?.clientId || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">来源标识</span><span class="detail-value">{{ client.clientInfo?.source || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">工作目录</span><span class="detail-value detail-value--break">{{ client.clientInfo?.workspaceDirectory || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">扩展名称</span><span class="detail-value">{{ client.clientInfo?.extension?.name || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">扩展版本</span><span class="detail-value">{{ client.clientInfo?.extension?.version || client.clientInfo?.appVersion || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">Manifest</span><span class="detail-value">{{ client.clientInfo?.extension?.manifestVersion || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">上报时间</span><span class="detail-value">{{ formatDateSafe(client.clientInfo?.timestamp) }}</span></div>
              </div>

              <div class="detail-card">
                <div class="detail-card__title">账号信息</div>
                <div class="detail-row"><span class="detail-key">姓名</span><span class="detail-value">{{ currentUserName(client) }}</span></div>
                <div class="detail-row"><span class="detail-key">账号</span><span class="detail-value">{{ currentUserAccount(client) }}</span></div>
                <div class="detail-row"><span class="detail-key">邮箱</span><span class="detail-value">{{ currentUserEmail(client) }}</span></div>
                <div class="detail-row"><span class="detail-key">手机号</span><span class="detail-value">{{ currentUserPhone(client) }}</span></div>
                <div class="detail-row"><span class="detail-key">公司</span><span class="detail-value">{{ currentUserCompany(client) }}</span></div>
                <div class="detail-row"><span class="detail-key">用户 ID</span><span class="detail-value">{{ currentUserId(client) }}</span></div>
              </div>

              <div class="detail-card detail-card--full">
                <div class="detail-card__title">地理与网络</div>
                <div class="detail-row"><span class="detail-key">地区</span><span class="detail-value">{{ formatLocation(client) }}</span></div>
                <div class="detail-row"><span class="detail-key">网络组织</span><span class="detail-value">{{ client.clientInfo?.location?.org || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">定位时区</span><span class="detail-value">{{ client.clientInfo?.location?.timeZone || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">定位来源</span><span class="detail-value">{{ client.clientInfo?.location?.source || '-' }}</span></div>
                <div class="detail-row"><span class="detail-key">定位时间</span><span class="detail-value">{{ formatDateSafe(client.clientInfo?.location?.fetchedAt) }}</span></div>
              </div>

              <div class="detail-card detail-card--full">
                <div class="detail-card__title">服务状态</div>
                <pre class="detail-json">{{ stringifyPretty(client.clientInfo?.services) }}</pre>
              </div>

              <div class="detail-card detail-card--full">
                <div class="detail-card__title">握手参数</div>
                <pre class="detail-json">{{ stringifyPretty(client.query) }}</pre>
              </div>

              <div class="detail-card detail-card--full">
                <div class="detail-card__title">客户端原始上报</div>
                <pre class="detail-json">{{ stringifyPretty(client.clientInfo) }}</pre>
              </div>
            </div>
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
import { computed, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { formatDate, formatPast } from '@/utils/formatTime'
import { ClientControlService } from '@/services/clientControl'
import type { TokenUserInfo, WebsocketConnectionVO } from '@/api/system/websocket'

defineOptions({ name: 'ClientControl' })

const clients = ref<WebsocketConnectionVO[]>([])
const loading = ref(false)
const expandedIds = ref<string[]>([])
const sendMessageDialogVisible = ref(false)
const currentClient = ref<WebsocketConnectionVO | null>(null)
const messageContent = ref('')
const sending = ref(false)
const onlineClientCount = computed(() => clients.value.filter((client) => client.isOnline).length)
const offlineClientCount = computed(() => clients.value.filter((client) => !client.isOnline).length)

const isClientOnline = (client: WebsocketConnectionVO) => !!client.isOnline

const formatDateSafe = (value?: string) => {
  if (!value) return '-'
  try {
    return formatDate(new Date(value))
  } catch {
    return value
  }
}

const stringifyPretty = (value: unknown) => {
  if (!value) return '-'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const getTokenUser = (client: WebsocketConnectionVO): TokenUserInfo | null | undefined => {
  return client.tokenUser || client.clientInfo?.user
}

const currentUserName = (client: WebsocketConnectionVO) =>
  getTokenUser(client)?.name || getTokenUser(client)?.nickname || client.nickname || '-'

const currentUserAccount = (client: WebsocketConnectionVO) =>
  getTokenUser(client)?.account || client.username || '-'

const currentUserEmail = (client: WebsocketConnectionVO) =>
  getTokenUser(client)?.email || client.email || '-'

const currentUserPhone = (client: WebsocketConnectionVO) =>
  getTokenUser(client)?.phone || '-'

const currentUserCompany = (client: WebsocketConnectionVO) =>
  getTokenUser(client)?.company?.name || '-'

const currentUserId = (client: WebsocketConnectionVO) =>
  String(getTokenUser(client)?.id || client.userId || '-')

const getClientTitle = (client: WebsocketConnectionVO) =>
  client.clientInfo?.machine?.code ||
  client.clientInfo?.clientId ||
  client.clientInfo?.extension?.name ||
  client.id

const getClientStatusText = (client: WebsocketConnectionVO) =>
  isClientOnline(client) ? '在线' : '断线'

const getClientStatusTagType = (client: WebsocketConnectionVO) =>
  isClientOnline(client) ? 'success' : 'danger'

const getClientStatusMeta = (client: WebsocketConnectionVO) => {
  if (isClientOnline(client)) {
    return client.lastOnlineAt
      ? `最近在线 ${formatDateSafe(client.lastOnlineAt)}`
      : '当前连接正常'
  }

  return client.lastOfflineAt
    ? `最近断线 ${formatDateSafe(client.lastOfflineAt)}`
    : '当前未连接'
}

const sortClients = (items: WebsocketConnectionVO[]) => {
  return [...items].sort((a, b) => {
    const aOnline = isClientOnline(a)
    const bOnline = isClientOnline(b)
    if (aOnline !== bOnline) {
      return aOnline ? -1 : 1
    }

    const aTime = a.lastOnlineAt || a.lastOfflineAt || a.connectedAt || ''
    const bTime = b.lastOnlineAt || b.lastOfflineAt || b.connectedAt || ''
    return aTime > bTime ? -1 : 1
  })
}

const formatBrowser = (client: WebsocketConnectionVO) => {
  const browser = client.clientInfo?.browser
  if (!browser?.name) return '-'
  return `${browser.name}${browser.version ? ` ${browser.version}` : ''}`
}

const formatOs = (client: WebsocketConnectionVO) => {
  const os = client.clientInfo?.os
  if (!os?.name) return '-'
  return `${os.name}${os.version ? ` ${os.version}` : ''}`
}

const formatDevice = (client: WebsocketConnectionVO) => {
  const parts: string[] = []
  if (client.clientInfo?.device?.hardwareConcurrency) {
    parts.push(`${client.clientInfo.device.hardwareConcurrency} 核`)
  }
  if (client.clientInfo?.device?.memory) {
    parts.push(`${client.clientInfo.device.memory} GB`)
  }
  if (client.clientInfo?.platform?.arch) {
    parts.push(client.clientInfo.platform.arch)
  }
  return parts.length ? parts.join(' / ') : '-'
}

const formatLocation = (client: WebsocketConnectionVO) => {
  const fields = [
    client.clientInfo?.location?.city,
    client.clientInfo?.location?.region,
    client.clientInfo?.location?.country
  ].filter(Boolean)
  return fields.length ? fields.join(' / ') : '-'
}

const toggleExpand = (id: string) => {
  if (expandedIds.value.includes(id)) {
    expandedIds.value = expandedIds.value.filter((item) => item !== id)
    return
  }
  expandedIds.value = [...expandedIds.value, id]
}

const refreshClients = async () => {
  loading.value = true
  try {
    clients.value = sortClients(await ClientControlService.getMyClients())
    expandedIds.value = expandedIds.value.filter((id) => clients.value.some((client) => client.id === id))
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
  if (!client.isOnline) {
    ElMessage.warning('断线客户端暂时无法发送消息')
    return
  }
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

  .card-header__title {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .card-header__summary {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .client-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .client-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    border: 1px solid var(--el-border-color);
    border-left-width: 4px;
    border-radius: 8px;
    transition: all 0.3s;

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  .client-item--online {
    border-left-color: var(--el-color-success);
    background: color-mix(in srgb, var(--el-color-success) 6%, var(--el-bg-color) 94%);
  }

  .client-item--offline {
    border-left-color: var(--el-color-danger);
    background: color-mix(in srgb, var(--el-color-danger) 5%, var(--el-bg-color) 95%);
  }

  .client-item__top {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
  }

  .client-info {
    flex: 1;
    min-width: 0;
  }

  .client-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .client-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .client-status-banner {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--el-fill-color-light) 88%, transparent 12%);
    font-size: 12px;
  }

  .client-status-banner__dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .client-status-banner__dot--online {
    background: var(--el-color-success);
    box-shadow: 0 0 8px color-mix(in srgb, var(--el-color-success) 40%, transparent 60%);
  }

  .client-status-banner__dot--offline {
    background: var(--el-color-danger);
    box-shadow: 0 0 8px color-mix(in srgb, var(--el-color-danger) 40%, transparent 60%);
  }

  .client-status-banner__label {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .client-status-banner__meta {
    color: var(--el-text-color-secondary);
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
      word-break: break-all;
    }
  }

  .client-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    .meta-item {
      display: flex;
      align-items: center;
    }
  }

  .client-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .client-details {
    width: 100%;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .detail-card {
    padding: 12px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }

  .detail-card--full {
    grid-column: 1 / -1;
  }

  .detail-card__title {
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .detail-row {
    display: flex;
    gap: 12px;
    padding: 6px 0;
    border-bottom: 1px dashed var(--el-border-color-lighter);
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-key {
    width: 88px;
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .detail-value {
    flex: 1;
    font-size: 12px;
    color: var(--el-text-color-primary);
    word-break: break-word;
  }

  .detail-value--mono {
    font-family: Monaco, Menlo, monospace;
  }

  .detail-value--break {
    word-break: break-all;
  }

  .detail-json {
    margin: 0;
    padding: 10px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    white-space: pre-wrap;
    word-break: break-all;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-regular);
  }

  @media (max-width: 960px) {
    .client-item__top {
      flex-direction: column;
    }

    .detail-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
