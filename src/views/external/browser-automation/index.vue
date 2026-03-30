<template>
  <ContentWrap :plain="true">
    <div class="browser-automation-page">
      <div class="browser-automation-toolbar">
        <div>
          <div class="browser-automation-toolbar__title">浏览器自动化</div>
        </div>
        <div class="browser-automation-toolbar__actions">
          <el-button @click="loadClients">刷新节点</el-button>
          <el-button
            type="primary"
            :disabled="!selectedClientId"
            :loading="actionLoading.checkStatus"
            @click="handleCheckStatus"
          >
            刷新状态
          </el-button>
        </div>
      </div>

      <div class="browser-automation-layout" v-loading="loading">
        <aside class="browser-automation-sidebar">
          <div class="browser-panel">
            <div class="browser-panel__title">在线节点</div>

            <el-empty v-if="!clients.length && !loading" description="暂无可用客户端" />

            <div v-else class="node-list">
              <button
                v-for="client in clients"
                :key="client.clientId"
                type="button"
                class="node-item"
                :class="{ 'is-active': client.clientId === selectedClientId }"
                @click="selectedClientId = client.clientId"
              >
                <div class="node-item__top">
                  <div class="node-item__name-wrap">
                    <span class="status-pill" :class="`is-${resolveStatusLevel(client.uploader)}`">
                      <span class="status-pill__dot" />
                      <span>{{ resolveStatusText(client.uploader) }}</span>
                    </span>
                    <span class="node-item__name">{{ client.machine?.code || client.clientId }}</span>
                  </div>
                  <span class="node-item__time">{{ formatDateSafe(client.connectedAt) }}</span>
                </div>
                <div class="node-item__meta-row">
                  <span class="node-item__meta">{{ client.appVersion || '未知版本' }}</span>
                  <span class="node-item__meta">{{ client.location?.ip || client.location?.city || '未知位置' }}</span>
                </div>
              </button>
            </div>
          </div>
        </aside>

        <section class="browser-automation-main">
          <div class="browser-panel" v-if="selectedClient">
            <div class="status-overview status-overview--compact">
              <div class="status-card status-card--compact status-card--emphasis" :class="`is-${resolveStatusLevel(selectedService)}`">
                <span class="status-card__label">服务</span>
                <span class="status-card__value status-card__value--status">
                  <span class="status-breath" :class="`is-${resolveStatusLevel(selectedService)}`" />
                  {{ resolveStatusText(selectedService) }}
                </span>
                <span class="status-card__hint">{{ selectedService?.message || '-' }}</span>
              </div>
              <div class="status-card status-card--compact">
                <span class="status-card__label">浏览器</span>
                <span class="status-card__value">
                  {{ selectedDetails.browserConnected ? '已连接' : (selectedDetails.hasInstance ? '实例未就绪' : '未启动') }}
                </span>
                <span class="status-card__hint">页面数 {{ selectedDetails.pageCount ?? 0 }}</span>
              </div>
              <div class="status-card status-card--compact">
                <span class="status-card__label">节点</span>
                <span class="status-card__value">{{ selectedClient.machine?.code || selectedClient.clientId }}</span>
                <span class="status-card__hint">{{ selectedClient.location?.ip || selectedClient.location?.city || '未知位置' }}</span>
              </div>
              <div class="status-card status-card--compact">
                <span class="status-card__label">检测</span>
                <span class="status-card__value">{{ formatDateSafe(selectedService?.lastCheckedAt) }}</span>
                <span class="status-card__hint">{{ selectedService?.version || '未知版本' }}</span>
              </div>
              <div class="status-card status-card--compact">
                <span class="status-card__label">端点</span>
                <span class="status-card__value status-card__value--mono">{{ selectedService?.endpoint || '-' }}</span>
                <span class="status-card__hint">{{ selectedDetails.connection?.mode || '默认模式' }}</span>
              </div>
              <div class="status-card status-card--compact">
                <span class="status-card__label">活动</span>
                <span class="status-card__value">{{ formatDateSafe(selectedDetails.lastActivity) }}</span>
                <span class="status-card__hint">{{ selectedDetails.connection?.profileDir || '未上报 profile 信息' }}</span>
              </div>
            </div>

            <div class="browser-panel__section">
              <div class="browser-panel__section-title">操作</div>
              <div class="action-row">
                <el-button type="primary" :loading="actionLoading.connect" @click="handleConnect">
                  连接浏览器
                </el-button>
                <el-button :loading="actionLoading.close" @click="handleClose">关闭浏览器</el-button>
                <el-button type="danger" plain :loading="actionLoading.forceClose" @click="handleForceClose">
                  强制关闭
                </el-button>
                <el-button :loading="actionLoading.pages" @click="handleFetchPages">获取页面列表</el-button>
              </div>
            </div>

            <div class="browser-panel__section">
              <div class="browser-panel__section-head">
                <div class="browser-panel__section-title">页面列表</div>
              </div>
              <div class="common-table">
                <vxe-grid v-bind="gridOptions" :data="pageList" :loading="actionLoading.pages" />
              </div>
            </div>
          </div>

          <div v-else class="browser-panel browser-panel--empty">
            <el-empty description="请选择一个在线客户端" />
          </div>
        </section>
      </div>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  checkBrowserAutomationStatus,
  type BrowserAutomationCommandResponse,
  closeBrowserAutomation,
  connectBrowserAutomation,
  fetchBrowserAutomationPages,
  forceCloseBrowserAutomation,
  getBrowserAutomationClients,
  getBrowserAutomationStatus,
  type BrowserAutomationClientVO,
  type BrowserAutomationServiceStatus
} from '@/api/external/browserAutomation'
import { buildTimeColumn, commonGridOptions } from '@/common/table'
import { websocketClient, type ServiceCommandResultEvent, type ServiceRuntimeEvent } from '@/services/websocketClient'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'ExternalBrowserAutomation' })

const loading = ref(false)
const clients = ref<BrowserAutomationClientVO[]>([])
const selectedClientId = ref('')
const pageList = ref<Record<string, any>[]>([])

const actionLoading = reactive({
  connect: false,
  close: false,
  forceClose: false,
  checkStatus: false,
  pages: false
})

const pendingCommandIds = reactive<Record<string, string>>({})

const gridOptions = {
  ...commonGridOptions,
  columns: [
    { title: '标题', field: 'title', minWidth: 220, showOverflow: 'tooltip' },
    { title: '链接', field: 'url', minWidth: 360, showOverflow: 'tooltip' },
    { title: '类型', field: 'type', width: 120 },
    {
      title: '当前页',
      field: 'isActive',
      width: 90,
      formatter: ({ cellValue }: { cellValue: boolean }) => (cellValue ? '是' : '否')
    },
    buildTimeColumn('采集时间', 'fetchedAt')
  ]
}

const selectedClient = computed(() => clients.value.find((item) => item.clientId === selectedClientId.value) || null)
const selectedService = computed<BrowserAutomationServiceStatus | null>(() => selectedClient.value?.uploader || null)
const selectedDetails = computed<Record<string, any>>(() => selectedService.value?.details || {})

const resolveStatusText = (service?: BrowserAutomationServiceStatus | null) => {
  if (!service) return '未知'
  if (service.available) return '可用'
  if (service.connected) return '在线'
  if (service.status === 'error') return '异常'
  return '离线'
}

const resolveTagType = (service?: BrowserAutomationServiceStatus | null) => {
  if (!service) return 'info'
  if (service.available) return 'success'
  if (service.connected) return 'warning'
  if (service.status === 'error') return 'danger'
  return 'info'
}

const resolveStatusLevel = (service?: BrowserAutomationServiceStatus | null) => {
  if (!service) return 'info'
  if (service.available) return 'success'
  if (service.connected) return 'warning'
  if (service.status === 'error') return 'danger'
  return 'info'
}

const formatDateSafe = (value?: string | null) => {
  if (!value) return '-'
  return formatDate(value, 'YYYY-MM-DD HH:mm:ss')
}

const syncClientStatus = async (clientId: string) => {
  const response = await getBrowserAutomationStatus(clientId)
  const snapshot = response?.data
  if (!snapshot) return
  const index = clients.value.findIndex((item) => item.clientId === clientId)
  if (index >= 0) {
    clients.value.splice(index, 1, snapshot)
  } else {
    clients.value.unshift(snapshot)
  }
}

const loadClients = async () => {
  loading.value = true
  try {
    const data = await getBrowserAutomationClients()
    clients.value = Array.isArray(data) ? data : []
    if (!selectedClientId.value || !clients.value.some((item) => item.clientId === selectedClientId.value)) {
      selectedClientId.value = clients.value[0]?.clientId || ''
    }
  } finally {
    loading.value = false
  }
}

const notifyCommandSent = (message: string) => {
  ElMessage.success(message)
}

const finishActionLoading = (action: string) => {
  if (action === 'connect') actionLoading.connect = false
  if (action === 'close') actionLoading.close = false
  if (action === 'forceClose') actionLoading.forceClose = false
  if (action === 'checkStatus') actionLoading.checkStatus = false
  if (action === 'getPages') actionLoading.pages = false
}

const sendCommand = async (
  action: string,
  requestor: () => Promise<BrowserAutomationCommandResponse>,
  options?: { sentMessage?: string }
) => {
  const response = await requestor()
  if (!response?.success) {
    finishActionLoading(action)
    ElMessage.error(response?.message || '命令发送失败')
    return
  }
  const commandId = response?.data?.commandId
  if (commandId) {
    pendingCommandIds[commandId] = action
  } else {
    finishActionLoading(action)
  }
  if (options?.sentMessage) {
    notifyCommandSent(options.sentMessage)
  }
}

const handleCheckStatus = async () => {
  if (!selectedClientId.value) return
  actionLoading.checkStatus = true
  await sendCommand('checkStatus', () => checkBrowserAutomationStatus(selectedClientId.value), {
    sentMessage: '状态刷新命令已发送'
  })
}

const handleConnect = async () => {
  if (!selectedClientId.value) return
  actionLoading.connect = true
  await sendCommand('connect', () => connectBrowserAutomation(selectedClientId.value), {
    sentMessage: '浏览器连接命令已发送'
  })
}

const handleClose = async () => {
  if (!selectedClientId.value) return
  actionLoading.close = true
  await sendCommand('close', () => closeBrowserAutomation(selectedClientId.value), {
    sentMessage: '浏览器关闭命令已发送'
  })
}

const handleForceClose = async () => {
  if (!selectedClientId.value) return
  actionLoading.forceClose = true
  await sendCommand('forceClose', () => forceCloseBrowserAutomation(selectedClientId.value), {
    sentMessage: '强制关闭命令已发送'
  })
}

const handleFetchPages = async () => {
  if (!selectedClientId.value) return
  actionLoading.pages = true
  await sendCommand('getPages', () => fetchBrowserAutomationPages(selectedClientId.value), {
    sentMessage: '页面列表获取命令已发送'
  })
}

const handleServiceRuntime = (event: ServiceRuntimeEvent) => {
  if (event.service !== 'uploader') return
  const index = clients.value.findIndex((item) => item.clientId === event.clientId)
  if (index < 0) return
  clients.value.splice(index, 1, {
    ...clients.value[index],
    uploader: {
      ...(clients.value[index].uploader || {}),
      ...(event.runtime || {})
    }
  })
  if (event.clientId === selectedClientId.value) {
    pageList.value = Array.isArray(event.runtime?.details?.pages)
      ? event.runtime.details.pages.map((item: Record<string, any>) => ({
          ...item,
          fetchedAt: new Date().toISOString()
        }))
      : pageList.value
  }
}

const handleServiceCommandResult = async (event: ServiceCommandResultEvent) => {
  if (event.service !== 'uploader') return
  const pendingAction = pendingCommandIds[event.commandId]
  if (pendingAction) {
    finishActionLoading(pendingAction)
    delete pendingCommandIds[event.commandId]
  }

  if (event.clientId) {
    await syncClientStatus(event.clientId)
  }

  if (event.success) {
    if (event.message) {
      ElMessage.success(event.message)
    }
  } else {
    ElMessage.error(event.message || '浏览器自动化命令执行失败')
  }

  if (event.action === 'getPages' && event.success) {
    const pages = Array.isArray(event.data?.pages) ? event.data.pages : []
    pageList.value = pages.map((item: Record<string, any>) => ({
      ...item,
      fetchedAt: new Date().toISOString()
    }))
  }
}

watch(selectedClientId, async (value) => {
  pageList.value = []
  if (!value) return
  await syncClientStatus(value)
  pageList.value = Array.isArray(selectedDetails.value.pages)
    ? selectedDetails.value.pages.map((item: Record<string, any>) => ({
        ...item,
        fetchedAt: new Date().toISOString()
      }))
    : []
})

onMounted(async () => {
  await loadClients()
  websocketClient.events.on('serviceRuntime', handleServiceRuntime)
  websocketClient.events.on('serviceCommandResult', handleServiceCommandResult)
})

onUnmounted(() => {
  websocketClient.events.off('serviceRuntime', handleServiceRuntime)
  websocketClient.events.off('serviceCommandResult', handleServiceCommandResult)
})
</script>

<style scoped lang="scss">
.browser-automation-page {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.browser-automation-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.browser-automation-toolbar__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.browser-automation-toolbar__actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  margin-left: auto;
}

.browser-automation-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 10px;
}

.browser-automation-page :deep(.el-loading-mask) {
  background-color: rgba(18, 22, 30, 0.18);
  backdrop-filter: blur(2px);
}

.browser-automation-page :deep(.el-loading-spinner .circular) {
  width: 30px;
  height: 30px;
}

.browser-automation-page :deep(.el-loading-spinner .path) {
  stroke-width: 3px;
}

.browser-panel {
  border: 1px solid var(--app-card-border, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  background: var(--app-card-bg, var(--el-bg-color));
  padding: 10px;
}

.browser-panel--empty {
  min-height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.browser-panel__title {
  font-size: 13px;
  font-weight: 600;
}

.browser-panel__section + .browser-panel__section {
  margin-top: 10px;
}

.browser-panel__section-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}

.browser-panel__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.node-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.node-item {
  width: 100%;
  border: 1px solid var(--app-card-border, rgba(255, 255, 255, 0.08));
  border-radius: 10px;
  padding: 8px 10px;
  background: transparent;
  text-align: left;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.node-item:hover,
.node-item.is-active {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
}

.node-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.node-item__name-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.node-item__name {
  font-size: 12px;
  font-weight: 600;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-item__time {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.node-item__meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.node-item__meta {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.status-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 18px;
}

.status-overview--compact {
  gap: 6px;
}

.status-card {
  border: 1px solid var(--app-card-border, rgba(255, 255, 255, 0.08));
  border-radius: 10px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  min-height: 48px;
}

.status-card--emphasis.is-success {
  border-color: rgb(103 194 58 / 32%);
}

.status-card--emphasis.is-warning {
  border-color: rgb(230 162 60 / 32%);
}

.status-card--emphasis.is-danger {
  border-color: rgb(245 108 108 / 32%);
}

.status-card__label {
  font-size: 10px;
  line-height: 1.2;
  color: var(--el-text-color-secondary);
}

.status-card__value {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-card__value--status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.status-card__value--mono {
  font-family: Monaco, Menlo, Consolas, monospace;
  font-size: 11px;
}

.status-card__hint {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  line-height: 1.2;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--el-border-color);
  max-width: 100%;
  min-width: 0;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
}

.status-pill > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-pill__dot,
.status-breath {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #909399;
}

.status-pill.is-success,
.status-breath.is-success {
  color: #67c23a;
}

.status-pill.is-warning,
.status-breath.is-warning {
  color: #e6a23c;
}

.status-pill.is-danger,
.status-breath.is-danger {
  color: #f56c6c;
}

.status-pill.is-success .status-pill__dot,
.status-breath.is-success {
  background: #67c23a;
  box-shadow: 0 0 0 0 rgb(103 194 58 / 42%);
  animation: breath-success 1.8s infinite ease-in-out;
}

.status-pill.is-warning .status-pill__dot,
.status-breath.is-warning {
  background: #e6a23c;
  box-shadow: 0 0 0 0 rgb(230 162 60 / 42%);
  animation: breath-warning 1.8s infinite ease-in-out;
}

.status-pill.is-danger .status-pill__dot,
.status-breath.is-danger {
  background: #f56c6c;
  box-shadow: 0 0 0 0 rgb(245 108 108 / 42%);
  animation: breath-danger 1.8s infinite ease-in-out;
}

@keyframes breath-success {
  0%, 100% { box-shadow: 0 0 0 0 rgb(103 194 58 / 16%); transform: scale(1); }
  50% { box-shadow: 0 0 0 6px rgb(103 194 58 / 0%); transform: scale(1.04); }
}

@keyframes breath-warning {
  0%, 100% { box-shadow: 0 0 0 0 rgb(230 162 60 / 16%); transform: scale(1); }
  50% { box-shadow: 0 0 0 6px rgb(230 162 60 / 0%); transform: scale(1.04); }
}

@keyframes breath-danger {
  0%, 100% { box-shadow: 0 0 0 0 rgb(245 108 108 / 16%); transform: scale(1); }
  50% { box-shadow: 0 0 0 6px rgb(245 108 108 / 0%); transform: scale(1.04); }
}

@media (max-width: 1200px) {
  .browser-automation-layout {
    grid-template-columns: 1fr;
  }
  .status-overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .status-overview {
    grid-template-columns: 1fr;
  }

  .browser-automation-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .browser-automation-toolbar__actions {
    width: 100%;
    margin-left: 0;
    justify-content: flex-start;
  }
}
</style>
