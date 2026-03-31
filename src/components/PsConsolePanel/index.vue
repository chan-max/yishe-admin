<template>
  <div class="ps-console" v-loading="loading">
    <div class="ops-header">
      <div>
        <div class="ops-header__title">PS 自动化控制台</div>
      </div>
      <div class="ops-header__actions">
        <div class="inline-status-group">
          <div class="inline-status" :class="`is-${localDebugServiceStatus.level}`">
            <span class="inline-status__dot" />
            <span class="inline-status__label">本地 PS</span>
            <span class="inline-status__text">{{ localDebugServiceStatus.text }}</span>
          </div>
          <div class="inline-status" :class="`is-${bridgeServiceStatus.level}`">
            <span class="inline-status__dot" />
            <span class="inline-status__label">客户端节点</span>
            <span class="inline-status__text">{{ bridgeServiceStatus.text }}</span>
          </div>
        </div>
        <el-button @click="refreshLocalDebug">刷新本机直连</el-button>
        <el-button type="primary" @click="refreshClients">刷新节点</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="ops-tabs">
      <el-tab-pane label="本地 PS" name="local">
        <div class="tab-layout tab-layout--single">
          <section class="ops-panel">
            <div class="ops-panel__head">
              <div>
                <div class="ops-panel__title">本机直连调试通道</div>
                <div class="ops-panel__sub ops-panel__sub--mono">localhost:1595</div>
              </div>
              <div class="ops-panel__actions">
                <el-button @click="refreshLocalDebug">健康检测</el-button>
              </div>
            </div>

            <div class="compact-info">
              <div class="compact-info__item">
                <span class="compact-info__label">状态</span>
                <span class="compact-info__value">
                  <span class="status-chip" :class="`is-${localDebugServiceStatus.level}`">
                    <span class="status-chip__dot" />
                    <span>{{ localDebugServiceStatus.text }}</span>
                  </span>
                </span>
              </div>
              <div class="compact-info__item">
                <span class="compact-info__label">版本</span>
                <span class="compact-info__value">{{ localDebugRuntime.version || '-' }}</span>
              </div>
              <div class="compact-info__item">
                <span class="compact-info__label">说明</span>
                <span class="compact-info__value">{{ localDebugRuntime.message || localDebugRuntime.lastError || '-' }}</span>
              </div>
              <div class="compact-info__item">
                <span class="compact-info__label">最近检测</span>
                <span class="compact-info__value">{{ formatDateSafe(localDebugRuntime.lastCheckedAt) }}</span>
              </div>
              <div class="compact-info__item">
                <span class="compact-info__label">诊断信息</span>
                <span class="compact-info__value">{{ localDebugRuntime.diagnostics || '-' }}</span>
              </div>
            </div>
          </section>
        </div>
      </el-tab-pane>

      <el-tab-pane label="客户端节点" name="bridge">
        <div class="tab-layout">
          <ExternalClientSidebar
            class="ops-sidebar"
            :items="clientNodeItems"
            :loading="loading"
            :selected-client-id="selectedClientId"
            section-title="客户端节点"
            empty-text="暂无可用客户端"
            @select="selectedClientId = $event"
          />

          <section class="ops-main">
            <div class="ops-panel">
              <div class="ops-panel__head">
              <div>
                  <div class="ops-panel__title">客户端状态</div>
                </div>
                <div class="ops-panel__actions" v-if="selectedClient">
                  <el-button @click="handleBridgeCommand(selectedClient.id, 'refreshRuntime')">刷新状态</el-button>
                  <el-button @click="handleBridgeCommand(selectedClient.id, 'health', {}, 'maintenance')">检测服务</el-button>
                </div>
              </div>

              <template v-if="selectedClient">
                <div class="compact-info">
                  <div class="compact-info__item">
                    <span class="compact-info__label">客户端</span>
                    <span class="compact-info__value">{{ selectedClient.clientInfo?.machine?.code || selectedClient.id }}</span>
                  </div>
                  <div class="compact-info__item">
                    <span class="compact-info__label">状态</span>
                    <span class="compact-info__value">
                      <span class="status-chip" :class="`is-${bridgeServiceStatus.level}`">
                        <span class="status-chip__dot" />
                        <span>{{ bridgeServiceStatus.text }}</span>
                      </span>
                    </span>
                  </div>
                  <div class="compact-info__item">
                    <span class="compact-info__label">说明</span>
                    <span class="compact-info__value">{{ selectedPsBridgeService?.message || '-' }}</span>
                  </div>
                </div>

                <div class="ops-form-block">
                  <div class="automation-toolbar">
                    <div class="automation-toolbar__main">
                      <div>
                        <div class="ops-form-block__title">自动制作</div>
                      </div>
                      <span class="status-chip" :class="selectedPsAutomationEnabled ? 'is-success' : 'is-info'">
                        <span class="status-chip__dot" />
                        <span>{{ selectedPsAutomationEnabled ? '已开启' : '已关闭' }}</span>
                      </span>
                    </div>
                    <div class="automation-toolbar__actions">
                      <el-button
                        type="success"
                        plain
                        :disabled="selectedPsAutomation?.enabled === true"
                        @click="handlePsAutomationToggle(true)"
                      >
                        开启
                      </el-button>
                      <el-button
                        type="danger"
                        plain
                        :disabled="selectedPsAutomation?.enabled === false"
                        @click="handlePsAutomationToggle(false)"
                      >
                        关闭
                      </el-button>
                    </div>
                  </div>

                  <div class="compact-info compact-info--grid">
                    <div class="compact-info__item">
                      <span class="compact-info__label">运行状态</span>
                      <span class="compact-info__value">
                        <span class="status-chip" :class="selectedPsAutomation?.running ? 'is-warning' : 'is-info'">
                          <span class="status-chip__dot" />
                          <span>{{ selectedPsAutomation?.running ? '执行中' : '空闲' }}</span>
                        </span>
                      </span>
                    </div>
                    <div class="compact-info__item">
                      <span class="compact-info__label">待处理数</span>
                      <span class="compact-info__value">{{ selectedPsAutomation?.queueCount ?? 0 }}</span>
                    </div>
                    <div class="compact-info__item">
                      <span class="compact-info__label">当前套图 ID</span>
                      <span class="compact-info__value">{{ selectedPsAutomation?.currentPsSetId || '-' }}</span>
                    </div>
                    <div class="compact-info__item">
                      <span class="compact-info__label">当前套图</span>
                      <span class="compact-info__value">{{ selectedPsAutomation?.currentPsSetName || '-' }}</span>
                    </div>
                    <div class="compact-info__item">
                      <span class="compact-info__label">进度</span>
                      <span class="compact-info__value">
                        {{ typeof selectedPsAutomation?.progress === 'number' ? `${selectedPsAutomation.progress}%` : '-' }}
                      </span>
                    </div>
                    <div class="compact-info__item">
                      <span class="compact-info__label">最近心跳</span>
                      <span class="compact-info__value">{{ formatDateSafe(selectedPsAutomation?.lastHeartbeatAt || undefined) }}</span>
                    </div>
                    <div class="compact-info__item">
                      <span class="compact-info__label">最后更新</span>
                      <span class="compact-info__value">{{ formatDateSafe(selectedPsAutomation?.updatedAt || undefined) }}</span>
                    </div>
                    <div class="compact-info__item compact-info__item--full">
                      <span class="compact-info__label">错误信息</span>
                      <span class="compact-info__value">{{ selectedPsAutomation?.lastError || '-' }}</span>
                    </div>
                  </div>
                </div>
              </template>

              <el-empty v-else description="请选择客户端节点" />
            </div>
          </section>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { formatDate, formatPast } from '@/utils/formatTime'
import { ClientControlService } from '@/services/clientControl'
import localPhotoshopApi from '@/api/client/photoshop'
import ExternalClientSidebar, {
  type ClientNodeBadge,
  type ClientNodeItem
} from '@/views/external/components/ExternalClientSidebar.vue'
import {
  websocketClient,
  type PsAutomationStatusEvent,
  type ServiceRuntimeEvent
} from '@/services/websocketClient'
import type { WebsocketConnectionVO } from '@/api/system/websocket'

defineOptions({ name: 'PsConsolePanel' })

const clients = ref<WebsocketConnectionVO[]>([])
const loading = ref(false)
const activeTab = ref('local')
const selectedClientId = ref('')

const localDebugRuntime = reactive({
  connected: false,
  isAvailable: false,
  version: '',
  message: '',
  diagnostics: '',
  lastCheckedAt: '',
  lastError: ''
})

const psClients = computed(() =>
  clients.value.filter((client) => !!client.clientInfo?.services?.photoshop)
)

const selectedClient = computed(() => {
  if (!psClients.value.length) {
    return null
  }
  return psClients.value.find((client) => client.id === selectedClientId.value) || psClients.value[0]
})

const getPsBridgeService = (client: WebsocketConnectionVO) => {
  const service = client.clientInfo?.services?.photoshop
  if (!service) {
    return null
  }

  const available = !!service.available
  const connected = !!service.connected
  const status = service.status || 'unknown'

  let tagType: 'success' | 'warning' | 'danger' | 'info' = 'info'
  let text = '未就绪'
  if (available) {
    tagType = 'success'
    text = '可用'
  } else if (status === 'error') {
    tagType = 'danger'
    text = '异常'
  } else if (connected) {
    tagType = 'warning'
    text = '在线待命'
  }

  return {
    ...service,
    tagType,
    text
  }
}

const selectedPsBridgeService = computed(() => (selectedClient.value ? getPsBridgeService(selectedClient.value) : null))
const selectedPsAutomation = computed(() => selectedClient.value?.clientInfo?.psAutomation || null)
const selectedPsAutomationEnabled = computed(() => !!selectedPsAutomation.value?.enabled)
const clientNodeItems = computed<ClientNodeItem[]>(() =>
  psClients.value.map((client) => {
    const service = getPsBridgeService(client)
    const badges: ClientNodeBadge[] = [
      { text: client.isOnline ? '在线' : '离线', tone: client.isOnline ? 'success' : 'muted' }
    ]

    if (service?.available) {
      badges.push({ text: '可用', tone: 'success' })
    } else if (service?.connected) {
      badges.push({ text: '在线待命', tone: 'warning' })
    } else if (service?.status === 'error') {
      badges.push({ text: '异常', tone: 'warning' })
    } else {
      badges.push({ text: '未就绪', tone: 'muted' })
    }

    if (client.clientInfo?.psAutomation?.enabled) {
      badges.push({
        text: client.clientInfo.psAutomation.running ? '自动制作执行中' : '自动制作已开启',
        tone: client.clientInfo.psAutomation.running ? 'warning' : 'success'
      })
    }

    return {
      connectionId: client.id,
      name: client.clientInfo?.machine?.code || client.id,
      time: formatDateSafe(client.connectedAt || undefined),
      metaLeft: client.clientInfo?.appVersion || '未知版本',
      metaRight: client.clientInfo?.machine?.platform || '未知平台',
      badges
    }
  })
)

const formatDateSafe = (value?: string) => {
  if (!value) return '-'
  try {
    return formatDate(new Date(value))
  } catch {
    return value
  }
}

const localDebugServiceStatus = computed(() => {
  if (localDebugRuntime.connected && localDebugRuntime.isAvailable) {
    return {
      level: 'success',
      tagType: 'success' as const,
      text: '可用',
      summary: '本地 yishe-ps 服务和 Photoshop 都已就绪，可以直接做调试分析和执行。'
    }
  }

  if (localDebugRuntime.connected) {
    return {
      level: 'warning',
      tagType: 'warning' as const,
      text: '服务在线，PS 不可用',
      summary: localDebugRuntime.message || '本地调试服务已连通，但 Photoshop 当前未处于可执行状态。'
    }
  }

  return {
    level: 'danger',
    tagType: 'danger' as const,
    text: '不可用',
    summary: localDebugRuntime.lastError || '无法访问本地调试服务，请检查 yishe-ps 是否启动。'
  }
})

const bridgeServiceStatus = computed(() => {
  if (!psClients.value.length) {
    return {
      level: 'danger',
      tagType: 'danger' as const,
      text: '无可用节点',
      summary: '当前账号下没有识别到带 Photoshop 服务上报的客户端节点。'
    }
  }

  if (selectedPsBridgeService.value?.available) {
    return {
      level: 'success',
      tagType: 'success' as const,
      text: '可用',
      summary: '当前选中的客户端节点可直接执行 Photoshop 任务。'
    }
  }

  if (selectedPsBridgeService.value?.connected) {
    return {
      level: 'warning',
      tagType: 'warning' as const,
      text: '在线待命',
      summary: selectedPsBridgeService.value?.message || '客户端节点已在线，但 Photoshop 服务尚未达到可执行状态。'
    }
  }

  return {
    level: 'danger',
    tagType: 'danger' as const,
    text: '不可用',
    summary: selectedPsBridgeService.value?.message || '已选客户端未上报可用的 Photoshop 服务。'
  }
})

watch(
  psClients,
  (list) => {
    if (!list.length) {
      selectedClientId.value = ''
      return
    }
    if (!selectedClientId.value || !list.some((item) => item.id === selectedClientId.value)) {
      selectedClientId.value = list[0].id
    }
    if (list.length > 0 && activeTab.value !== 'bridge') {
      activeTab.value = 'bridge'
    }
  },
  { immediate: true }
)

const refreshClients = async () => {
  loading.value = true
  try {
    clients.value = await ClientControlService.getMyClients()
  } finally {
    loading.value = false
  }
}

const refreshLocalDebug = async () => {
  try {
    const status = await localPhotoshopApi.checkPhotoshopStatus(false)

    localDebugRuntime.connected = true
    localDebugRuntime.isAvailable = !!(status.is_available && status.is_running)
    localDebugRuntime.version = status.connection_test?.version || ''
    localDebugRuntime.message = localDebugRuntime.isAvailable
      ? 'photoshopStatus 检测通过，Photoshop 可用于本机调试'
      : 'photoshopStatus 已返回，但 Photoshop 当前不可执行'
    localDebugRuntime.diagnostics = status.diagnostics || ''
    localDebugRuntime.lastCheckedAt = new Date().toISOString()
    localDebugRuntime.lastError = ''
  } catch (error: any) {
    localDebugRuntime.connected = false
    localDebugRuntime.isAvailable = false
    localDebugRuntime.version = ''
    localDebugRuntime.message = ''
    localDebugRuntime.diagnostics = ''
    localDebugRuntime.lastCheckedAt = new Date().toISOString()
    localDebugRuntime.lastError = error?.message || '无法连接 localhost:1595'
  }
}

const handleServiceRuntime = (_event: ServiceRuntimeEvent) => {
  void refreshClients()
}

const handlePsAutomationStatus = (_event: PsAutomationStatusEvent) => {
  void refreshClients()
}

const handleBridgeCommand = async (
  clientId: string,
  action: string,
  payload: Record<string, any> = {},
  mode: 'production' | 'debug' | 'maintenance' = 'production'
) => {
  await ClientControlService.sendServiceCommand(clientId, 'photoshop', action, payload, mode)
}

const handlePsAutomationToggle = async (enabled: boolean) => {
  if (!selectedClient.value) {
    return
  }

  const success = await ClientControlService.setPsAutomationEnabled(selectedClient.value.id, enabled)
  if (success) {
    await refreshClients()
  }
}

onMounted(() => {
  websocketClient.events.on('serviceRuntime', handleServiceRuntime)
  websocketClient.events.on('psAutomationStatus', handlePsAutomationStatus)
  void Promise.all([refreshClients(), refreshLocalDebug()])
})

onUnmounted(() => {
  websocketClient.events.off('serviceRuntime', handleServiceRuntime)
  websocketClient.events.off('psAutomationStatus', handlePsAutomationStatus)
})
</script>

<style scoped lang="scss">
.ps-console {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ops-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.ops-header__title {
  font-size: 16px;
  font-weight: 600;
}

.ops-header__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.ops-tabs :deep(.el-tabs__header) {
  margin: 0 0 12px;
}

.ops-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: var(--el-border-color-lighter);
}

.ops-tabs :deep(.el-tabs__nav) {
  gap: 0;
}

.ops-tabs :deep(.el-tabs__item) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 128px;
  height: 34px;
  padding: 0 14px;
  text-align: center;
  color: var(--el-text-color-secondary);
  background: transparent;
}

.ops-tabs :deep(.el-tabs__item.is-active) {
  color: var(--el-text-color-primary);
  background: transparent;
}

.ops-tabs :deep(.el-tabs__active-bar) {
  height: 2px;
  border-radius: 999px;
}

.tab-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.tab-layout--single {
  grid-template-columns: minmax(0, 1fr);
}

.inline-status-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.inline-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  background: var(--el-bg-color);
  font-size: 11px;
  min-width: 0;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
}

.inline-status.is-success {
  border-color: rgb(103 194 58 / 28%);
  color: #67c23a;
}

.inline-status.is-warning {
  border-color: rgb(230 162 60 / 28%);
  color: #e6a23c;
}

.inline-status.is-danger {
  border-color: rgb(245 108 108 / 28%);
  color: #f56c6c;
}

.inline-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--el-text-color-secondary);
}

.inline-status.is-success .inline-status__dot {
  background: #67c23a;
  box-shadow: 0 0 0 0 rgb(103 194 58 / 34%);
  animation: status-breath-success 1.8s infinite ease-in-out;
}

.inline-status.is-warning .inline-status__dot {
  background: #e6a23c;
  box-shadow: 0 0 0 0 rgb(230 162 60 / 34%);
  animation: status-breath-warning 1.8s infinite ease-in-out;
}

.inline-status.is-danger .inline-status__dot {
  background: #f56c6c;
  box-shadow: 0 0 0 0 rgb(245 108 108 / 34%);
  animation: status-breath-danger 1.8s infinite ease-in-out;
}

.inline-status__label {
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex-shrink: 0;
}

.inline-status__text {
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-light);
}

.compact-info--grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.compact-info__item {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.compact-info__item--full {
  grid-column: 1 / -1;
}

.compact-info__label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.compact-info__value {
  font-size: 12px;
  color: var(--el-text-color-primary);
  line-height: 1.45;
  word-break: break-word;
}

.ops-sidebar,
.ops-main {
  min-width: 0;
}

.ops-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ops-panel {
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.ops-panel,
.ops-sidebar:deep(.external-sidebar) {
  padding: 12px;
}

.ops-sidebar:deep(.external-sidebar) {
  position: sticky;
  top: 0;
}

.ops-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 12px;
}

.ops-panel__title {
  font-size: 14px;
  font-weight: 600;
}

.ops-panel__sub {
  margin-top: 2px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.ops-panel__sub--mono {
  font-family: Monaco, Menlo, Consolas, monospace;
}

.ops-panel__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.automation-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-light);
}

.automation-toolbar__main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.automation-toolbar__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
  justify-content: flex-start;
}

.ops-panel__head--minor {
  padding-bottom: 0;
  border-bottom: 0;
  margin-bottom: 10px;
}

.ops-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ops-form-block {
  margin-top: 12px;
}

.ops-form-block__title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  max-width: 100%;
  min-width: 0;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
}

.status-chip > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-chip__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #909399;
}

.status-chip.is-success {
  color: #67c23a;
}

.status-chip.is-warning {
  color: #e6a23c;
}

.status-chip.is-danger {
  color: #f56c6c;
}

.status-chip.is-info {
  color: #909399;
}

.status-chip.is-success .status-chip__dot {
  background: #67c23a;
  box-shadow: 0 0 0 0 rgb(103 194 58 / 34%);
  animation: status-breath-success 1.8s infinite ease-in-out;
}

.status-chip.is-warning .status-chip__dot {
  background: #e6a23c;
  box-shadow: 0 0 0 0 rgb(230 162 60 / 34%);
  animation: status-breath-warning 1.8s infinite ease-in-out;
}

.status-chip.is-danger .status-chip__dot {
  background: #f56c6c;
  box-shadow: 0 0 0 0 rgb(245 108 108 / 34%);
  animation: status-breath-danger 1.8s infinite ease-in-out;
}

@keyframes status-breath-success {
  0%, 100% { box-shadow: 0 0 0 0 rgb(103 194 58 / 16%); transform: scale(1); }
  50% { box-shadow: 0 0 0 6px rgb(103 194 58 / 0%); transform: scale(1.04); }
}

@keyframes status-breath-warning {
  0%, 100% { box-shadow: 0 0 0 0 rgb(230 162 60 / 16%); transform: scale(1); }
  50% { box-shadow: 0 0 0 6px rgb(230 162 60 / 0%); transform: scale(1.04); }
}

@keyframes status-breath-danger {
  0%, 100% { box-shadow: 0 0 0 0 rgb(245 108 108 / 16%); transform: scale(1); }
  50% { box-shadow: 0 0 0 6px rgb(245 108 108 / 0%); transform: scale(1.04); }
}

@media (max-width: 1280px) {
  .ops-columns {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 1024px) {
  .tab-layout,
  .ops-columns,
  .compact-info--grid {
    grid-template-columns: 1fr;
  }

  .ops-sidebar:deep(.external-sidebar) {
    position: static;
  }
}

@media (max-width: 768px) {
  .ops-header,
  .ops-panel__head,
  .automation-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .ops-header__actions {
    width: 100%;
  }

  .automation-toolbar__main {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
