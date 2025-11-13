<template>
  <div class="websocket-page">
    <ContentWrap class="mb-16px">
      <div class="ws-test-card">
        <div class="ws-test-card__header">
          <div class="ws-test-card__status">
            <span>当前状态：</span>
            <el-tag :type="statusTag.type">
              {{ statusTag.text }}
            </el-tag>
          </div>
          <div class="ws-test-card__actions">
            <el-button text type="primary" @click="clearLogs" :disabled="logList.length === 0">
              清空日志
            </el-button>
            <el-button text type="primary" @click="testCardCollapsed = !testCardCollapsed">
              <Icon :icon="testCardCollapsed ? 'ep:arrow-down' : 'ep:arrow-up'" class="mr-5px" />
              {{ testCardCollapsed ? '展开' : '折叠' }}
            </el-button>
          </div>
        </div>

        <el-collapse-transition>
          <div v-show="!testCardCollapsed" class="ws-test-card__content">
            <el-form class="ws-test-form" label-position="top">
          <el-form-item label="测试地址">
            <el-input v-model="wsUrl" placeholder="例如：wss://your-host/ws" :disabled="isConnected" />
          </el-form-item>
          <div class="ws-test-form__buttons">
            <el-button type="primary" @click="connectWebsocket" :loading="isConnecting" :disabled="isConnected">
              <Icon icon="ep:connection" class="mr-5px" /> 测试连接
            </el-button>
            <el-button @click="disconnectWebsocket" :disabled="!canDisconnect">
              <Icon icon="ep:close-bold" class="mr-5px" /> 断开连接
            </el-button>
            <el-button type="warning" @click="sendPing" :disabled="!isConnected">
              <Icon icon="ep:notification" class="mr-5px" /> 测试 Ping
            </el-button>
          </div>

          <el-form-item label="测试消息">
            <el-input
              v-model="testPayload"
              type="textarea"
              :rows="3"
              placeholder='请输入要发送的消息，如 {"type":"ping"}'
            />
          </el-form-item>
          <div class="ws-test-form__buttons">
            <el-button type="success" @click="handleSendTestMessage" :disabled="!isConnected">
              <Icon icon="ep:position" class="mr-5px" /> 发送测试消息
            </el-button>
          </div>
        </el-form>

        <div class="ws-test-card__log">
          <div class="ws-test-card__log-title">
            <span>实时日志</span>
            <span class="ws-test-card__log-subtitle">用于确认 WebSocket 是否收发正常</span>
          </div>
          <el-scrollbar class="ws-test-card__log-list">
            <div v-if="logList.length === 0" class="ws-test-card__log-empty">暂无日志</div>
            <div v-else>
              <div v-for="(item, index) in logList" :key="index" class="ws-test-card__log-item">
                {{ item }}
              </div>
            </div>
          </el-scrollbar>
        </div>
          </div>
        </el-collapse-transition>
      </div>
    </ContentWrap>

    <ContentWrap>
      <div class="websocket-toolbar">
        <el-button type="primary" @click="fetchConnections" :loading="loading">
          <Icon icon="ep:refresh" class="mr-5px" /> 刷新
        </el-button>
        <el-switch v-model="autoRefresh" active-text="自动刷新" />
        <span class="websocket-toolbar__hint">当前展示为 WebSocket 网关 `/ws` 的实时连接</span>
      </div>

      <el-empty v-if="!loading && connections.length === 0" description="暂无连接" />

      <div v-else class="common-table">
        <vxe-grid
          v-bind="gridOptions"
          :data="connections"
          :loading="loading"
          ref="gridRef"
        >
          <template #duration_default="{ row }">
            {{ formatPast(row.connectedAt) }}
          </template>
          <template #clientSource_default="{ row }">
            <el-tag v-if="row.clientSource === 'yishe-extension'" type="success" size="small">
              浏览器插件
            </el-tag>
            <el-tag v-else-if="row.clientSource" type="info" size="small">
              {{ row.clientSource }}
            </el-tag>
            <span v-else>-</span>
          </template>
          <template #ip_default="{ row }">
            {{ row.ip || '-' }}
          </template>
          <template #ua_default="{ row }">
            {{ row.userAgent || '-' }}
          </template>
          <template #clientInfo_default="{ row }">
            {{ formatClientInfo(row.clientInfo) }}
          </template>
          <template #query_default="{ row }">
            {{ formatQuery(row.query) }}
          </template>
          <template #operation_default="{ row }">
            <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)">
              <el-button type="primary" link size="small">
                操作
                <Icon icon="ep:arrow-down" class="ml-5px" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="send-message">
                    <Icon icon="ep:message" class="mr-5px" />
                    发送消息
                  </el-dropdown-item>
                  <el-dropdown-item command="control" divided>
                    <Icon icon="ep:setting" class="mr-5px" />
                    操控
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </vxe-grid>
      </div>
    </ContentWrap>

    <!-- 操控全屏弹窗 -->
    <el-dialog
      v-model="controlDialogVisible"
      title="连接操控"
      fullscreen
      :close-on-click-modal="false"
      class="control-dialog"
    >
      <div class="control-dialog-content">
        <div class="control-dialog-header">
          <div class="control-connection-info">
            <el-descriptions :column="3" border>
              <el-descriptions-item label="连接 ID">
                {{ currentConnection?.id }}
              </el-descriptions-item>
              <el-descriptions-item label="连接类型">
                <el-tag v-if="currentConnection?.clientSource === 'yishe-extension'" type="success" size="small">
                  浏览器插件
                </el-tag>
                <span v-else>{{ currentConnection?.clientSource || '未知' }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="IP 地址">
                {{ currentConnection?.ip || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="连接时间">
                {{ currentConnection?.connectedAt ? formatDate(new Date(currentConnection.connectedAt)) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="持续时长">
                {{ currentConnection?.connectedAt ? formatPast(currentConnection.connectedAt) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="命名空间">
                {{ currentConnection?.namespace || '-' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>

        <div class="control-dialog-body">
          <el-card class="control-card">
            <template #header>
              <div class="card-header">
                <span>操控功能</span>
                <el-tag type="info" size="small">功能开发中</el-tag>
              </div>
            </template>
            <div class="control-functions">
              <el-empty description="暂无可用功能，功能开发中..." :image-size="100" />
              <!-- 后续可以在这里添加各种操控功能 -->
            </div>
          </el-card>
        </div>
      </div>
      <template #footer>
        <el-button @click="controlDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 发送消息对话框 -->
    <el-dialog
      v-model="sendMessageDialogVisible"
      title="发送消息"
      width="500px"
      align-center
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="连接 ID">
          <el-input :value="currentConnection?.id" disabled />
        </el-form-item>
        <el-form-item label="连接类型">
          <el-tag v-if="currentConnection?.clientSource === 'yishe-extension'" type="success" size="small">
            浏览器插件
          </el-tag>
          <span v-else>{{ currentConnection?.clientSource || '未知' }}</span>
        </el-form-item>
        <el-form-item label="事件名称">
          <el-input v-model="messageEvent" placeholder="默认为 admin-message" />
        </el-form-item>
        <el-form-item label="消息内容">
          <el-input
            v-model="messageContent"
            type="textarea"
            :rows="6"
            placeholder='请输入消息内容，支持 JSON 格式，如 {"type":"test","message":"Hello"}'
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendMessageDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="sendMessageDialogLoading" @click="handleConfirmSendMessage">
          发送
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, watchEffect } from 'vue'
import type { VxeGridInstance, VxeGridProps } from 'vxe-table'
import { io, Socket } from 'socket.io-client'
import { useMessage } from '@/hooks/web/useMessage'
import { formatDate, formatPast } from '@/utils/formatTime'
import { useWindowSize } from '@vueuse/core'
import { commonGridOptions } from '@/common/table'
import * as WebsocketApi from '@/api/system/websocket'
import type { WebsocketConnectionVO, WebsocketClientInfo } from '@/api/system/websocket'

defineOptions({ name: 'SystemWebsocketConnections' })

const message = useMessage()

const connections = ref<WebsocketConnectionVO[]>([])
const loading = ref(false)
const autoRefresh = ref(false)
const refreshTimer = ref<number | null>(null)
const refreshInterval = 10_000
const testCardCollapsed = ref(false)

// 发送消息对话框
const sendMessageDialogVisible = ref(false)
const sendMessageDialogLoading = ref(false)
const currentConnection = ref<WebsocketConnectionVO | null>(null)
const messageContent = ref('')
const messageEvent = ref('admin-message')

// 操控对话框
const controlDialogVisible = ref(false)

const gridRef = ref<VxeGridInstance>()
const { height } = useWindowSize()

const gridOptions = ref<VxeGridProps<WebsocketConnectionVO>>({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: 'id'
  },
  columns: [
    { type: 'seq', width: 60, title: '序号', align: 'center' },
    {
      field: 'id',
      title: '连接 ID',
      minWidth: 240,
      showOverflow: 'tooltip'
    },
    {
      field: 'namespace',
      title: '命名空间',
      minWidth: 120,
      showOverflow: 'tooltip'
    },
    {
      field: 'clientSource',
      title: '连接类型',
      width: 120,
      align: 'center',
      slots: { default: 'clientSource_default' }
    },
    {
      field: 'connectedAt',
      title: '连接时间',
      minWidth: 200,
      ellipsis: true,
      formatter: ({ cellValue }) => (cellValue ? formatDate(new Date(cellValue)) : '')
    },
    {
      field: 'duration',
      title: '持续时长',
      minWidth: 140,
      slots: { default: 'duration_default' }
    },
    {
      field: 'ip',
      title: 'IP 地址',
      minWidth: 160,
      showOverflow: 'tooltip',
      slots: { default: 'ip_default' }
    },
    {
      field: 'userAgent',
      title: 'User-Agent',
      minWidth: 260,
      showOverflow: 'tooltip',
      slots: { default: 'ua_default' }
    },
    {
      field: 'clientInfo',
      title: '客户端信息',
      minWidth: 320,
      showOverflow: 'tooltip',
      slots: { default: 'clientInfo_default' }
    },
    {
      field: 'query',
      title: 'Query 参数',
      minWidth: 260,
      showOverflow: 'tooltip',
      slots: { default: 'query_default' }
    },
    {
      title: '操作',
      fixed: 'right' as const,
      width: 120,
      align: 'center',
      slots: { default: 'operation_default' }
    }
  ]
})

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 200
})

const formatQuery = (query?: Record<string, string | string[]>) => {
  if (!query) {
    return '-'
  }

  const entries = Object.entries(query).filter(([key]) => key !== 'clientInfo')

  if (entries.length === 0) {
    return '-'
  }

  return entries
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=${value.join(',')}`
      }
      return `${key}=${value}`
    })
    .join('；')
}

const formatClientInfo = (info?: WebsocketClientInfo) => {
  if (!info) {
    return '-'
  }

  const segments: string[] = []

  if (info.clientId) {
    segments.push(`ID: ${info.clientId}`)
  }

  if (info.browser?.name) {
    segments.push(`浏览器: ${info.browser.name}${info.browser.version ? ` ${info.browser.version}` : ''}`)
  }

  if (info.os?.name) {
    segments.push(`系统: ${info.os.name}${info.os.version ? ` ${info.os.version}` : ''}`)
  }

  if (info.platform?.arch) {
    segments.push(`架构: ${info.platform.arch}${info.platform.nacl_arch ? ` / ${info.platform.nacl_arch}` : ''}`)
  }

  if (info.language) {
    segments.push(`语言: ${info.language}`)
  }

  if (info.timeZone) {
    segments.push(`时区: ${info.timeZone}`)
  }

  const locationFields = [info.location?.city, info.location?.region, info.location?.country].filter(Boolean)
  if (locationFields.length > 0) {
    segments.push(`位置: ${locationFields.join(' · ')}`)
  }

  if (info.location?.ip) {
    segments.push(`IP: ${info.location.ip}`)
  }

  if (segments.length === 0) {
    return '-'
  }

  return segments.join(' | ')
}

const getDefaultWsUrl = () => {
  const explicitUrl = import.meta.env.VITE_WS_URL as string | undefined
  if (explicitUrl) {
    return explicitUrl
  }

  const baseUrl = (import.meta.env.VITE_BASE_URL as string | undefined) ?? ''
  if (baseUrl) {
    const normalizedBase = baseUrl.replace(/\/$/, '')
    const sanitizedBase = normalizedBase.replace(/\/api$/i, '')
    return `${sanitizedBase.replace(/^http/i, 'ws')}/ws`
  }

  if (typeof window === 'undefined') {
    return ''
  }

  const { protocol, host } = window.location
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:'
  return `${wsProtocol}//${host}/ws`
}

const wsUrl = ref(getDefaultWsUrl())
const testPayload = ref('{"type":"ping"}')
const logList = ref<string[]>([])
const maxLogLength = 100

type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
const wsStatus = ref<WsStatus>('disconnected')
let socketClient: Socket | null = null

const isConnected = computed(() => wsStatus.value === 'connected')
const isConnecting = computed(() => wsStatus.value === 'connecting')
const canDisconnect = computed(() => wsStatus.value === 'connected' || wsStatus.value === 'connecting')

const statusTag = computed(() => {
  switch (wsStatus.value) {
    case 'connected':
      return { text: '已连接', type: 'success' as const }
    case 'connecting':
      return { text: '连接中', type: 'warning' as const }
    case 'error':
      return { text: '连接异常', type: 'danger' as const }
    default:
      return { text: '未连接', type: 'info' as const }
  }
})

const pushLog = (label: string, detail: string) => {
  const timestamp = formatDate(new Date(), 'HH:mm:ss')
  logList.value.unshift(`[${timestamp}] [${label}] ${detail}`)
  if (logList.value.length > maxLogLength) {
    logList.value.length = maxLogLength
  }
}

const clearLogs = () => {
  logList.value = []
}

const registerSocketListeners = (client: Socket) => {
  client.on('connect', () => {
    wsStatus.value = 'connected'
    pushLog('CONNECT', `连接已建立 (id: ${client.id})`)
    message.success('WebSocket 已连接')
    fetchConnections()
  })

  client.on('disconnect', (reason) => {
    pushLog('DISCONNECT', `连接关闭，原因：${reason}`)
    if (wsStatus.value !== 'error') {
      wsStatus.value = 'disconnected'
    }
    fetchConnections()
  })

  client.on('connect_error', (error) => {
    wsStatus.value = 'error'
    pushLog('CONNECT_ERROR', error.message ?? '连接失败')
    message.error(error.message ?? 'WebSocket 连接失败')
  })

  client.on('pong', (data) => {
    pushLog('PONG', stringifyData(data))
  })

  client.on('test-message-ack', (data) => {
    pushLog('ACK', stringifyData(data))
  })

  client.onAny((event, ...args) => {
    if (event === 'pong' || event === 'test-message-ack') {
      return
    }
    pushLog(`EVENT:${event}`, stringifyData(args.length > 1 ? args : args[0]))
  })
}

const connectWebsocket = () => {
  if (!wsUrl.value) {
    message.warning('请先填写 WebSocket 地址')
    return
  }

  if (socketClient) {
    socketClient.removeAllListeners()
    socketClient.disconnect()
    socketClient = null
  }

  try {
    wsStatus.value = 'connecting'
    const client = io(wsUrl.value, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 10_000,
      withCredentials: true
    })
    socketClient = client
    registerSocketListeners(client)
  } catch (error: any) {
    wsStatus.value = 'error'
    pushLog('ERROR', error?.message ?? '创建 WebSocket 失败')
    message.error(error?.message ?? '创建 WebSocket 失败')
  }
}

const disconnectWebsocket = () => {
  if (socketClient) {
    pushLog('INFO', '手动关闭连接')
    socketClient.disconnect()
    socketClient.removeAllListeners()
    socketClient = null
    wsStatus.value = 'disconnected'
  }
}

const safeSend = (payload: string, silent = false) => {
  if (!socketClient || wsStatus.value !== 'connected') {
    message.warning('请先建立 WebSocket 连接')
    return false
  }
  try {
    let data: any = payload
    try {
      data = JSON.parse(payload)
    } catch {
      data = payload
    }
    socketClient.emit('test-message', data)
    pushLog('EMIT', stringifyData(data))
    if (!silent) {
      message.success('消息已发送')
    }
    return true
  } catch (error: any) {
    pushLog('ERROR', error?.message ?? '发送消息失败')
    message.error(error?.message ?? '发送消息失败')
    return false
  }
}

const handleSendTestMessage = () => {
  const payload = testPayload.value.trim()
  if (!payload) {
    message.warning('请输入要发送的消息')
    return
  }
  safeSend(payload)
}

const sendPing = () => {
  if (!socketClient || wsStatus.value !== 'connected') {
    message.warning('请先建立 WebSocket 连接')
    return
  }
  socketClient.emit('ping')
  pushLog('PING', '已发送 Ping')
  message.success('已发送 Ping 消息')
}

const clearTimer = () => {
  if (refreshTimer.value !== null) {
    window.clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

const fetchConnections = async () => {
  loading.value = true
  try {
    connections.value = await WebsocketApi.getWebsocketConnections()
  } catch (error: any) {
    message.error(error?.message ?? '获取 WebSocket 连接失败')
  } finally {
    loading.value = false
  }
}

const handleOperationCommand = (command: string, row: WebsocketConnectionVO) => {
  if (command === 'send-message') {
    handleSendMessage(row)
  } else if (command === 'control') {
    handleControl(row)
  }
}

const handleControl = (row: WebsocketConnectionVO) => {
  currentConnection.value = row
  controlDialogVisible.value = true
}

const handleSendMessage = (row: WebsocketConnectionVO) => {
  currentConnection.value = row
  messageContent.value = ''
  messageEvent.value = 'admin-message'
  sendMessageDialogVisible.value = true
}

const handleConfirmSendMessage = async () => {
  if (!currentConnection.value) {
    return
  }

  if (!messageContent.value.trim()) {
    message.warning('请输入消息内容')
    return
  }

  sendMessageDialogLoading.value = true
  try {
    let data: any = messageContent.value
    try {
      data = JSON.parse(messageContent.value)
    } catch {
      // 如果不是 JSON，就作为普通字符串发送
    }

    const response = await WebsocketApi.sendMessageToConnection(
      currentConnection.value.id,
      data,
      messageEvent.value || undefined
    )
    
    // 检查返回的 success 字段
    const result = response as any
    if (result?.success === false || result?.data?.success === false) {
      const errorMsg = result?.message || result?.data?.message || '消息发送失败'
      message.error(errorMsg)
      return
    }
    
    message.success('消息发送成功')
    sendMessageDialogVisible.value = false
    messageContent.value = ''
  } catch (error: any) {
    // 处理网络错误或其他异常
    const errorMsg = error?.response?.data?.message || error?.message || '消息发送失败'
    message.error(errorMsg)
  } finally {
    sendMessageDialogLoading.value = false
  }
}

watch(autoRefresh, (value) => {
  clearTimer()
  if (value) {
    refreshTimer.value = window.setInterval(fetchConnections, refreshInterval)
  }
})

onMounted(() => {
  fetchConnections()
})

onBeforeUnmount(() => {
  clearTimer()
  disconnectWebsocket()
})

const stringifyData = (value: unknown) => {
  if (value === undefined) {
    return 'undefined'
  }
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
</script>

<style scoped>
.websocket-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mb-16px {
  margin-bottom: 16px;
}

.ws-test-card {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ws-test-card__header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

.ws-test-card__content {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.ws-test-card__status span:first-child {
  margin-right: 8px;
  color: var(--el-text-color-regular);
}

.ws-test-form {
  flex: 1 1 360px;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ws-test-form__buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.ws-test-card__log {
  flex: 1 1 320px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ws-test-card__log-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ws-test-card__log-subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ws-test-card__log-list {
  height: 220px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
}

.ws-test-card__log-empty {
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.ws-test-card__log-item {
  font-family: ui-monospace, SFMono-Regular, SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 12px;
  line-height: 18px;
  padding: 2px 0;
  border-bottom: 1px dashed var(--el-border-color-extra-light);
}

.ws-test-card__log-item:last-child {
  border-bottom: none;
}

.websocket-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.websocket-toolbar__hint {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.common-table {
  border-radius: 8px;
  overflow: hidden;
}

@media screen and (max-width: 960px) {
  .ws-test-card {
    flex-direction: column;
  }

  .ws-test-card__log-list {
    height: 180px;
  }
}

/* 操控弹窗样式 */
.control-dialog {
  .el-dialog__body {
    padding: 0;
    height: calc(100vh - 120px);
    overflow: hidden;
  }
}

.control-dialog-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.control-dialog-header {
  padding: 20px;
  background: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.control-connection-info {
  .el-descriptions {
    margin: 0;
  }
}

.control-dialog-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: var(--el-bg-color);
}

.control-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .el-card__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  span {
    font-weight: 600;
    font-size: 16px;
  }
}

.control-functions {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}
</style>

