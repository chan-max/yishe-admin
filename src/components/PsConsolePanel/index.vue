<template>
  <div class="ps-console" v-loading="loading">
    <div class="ops-header">
      <div>
        <div class="ops-header__title">PS 控制台</div>
        <div class="ops-header__desc">统一查看本地 PS 与客户端连接状态，并执行基础检测。</div>
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
            <span class="inline-status__label">客户端连接</span>
            <span class="inline-status__text">{{ bridgeServiceStatus.text }}</span>
          </div>
        </div>
        <el-button @click="refreshLocalDebug">刷新本机直连</el-button>
        <el-button type="primary" @click="refreshClients">刷新桥接节点</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="ops-tabs">
      <el-tab-pane label="本地 PS" name="local">
        <div class="tab-layout tab-layout--single">
          <section class="ops-panel">
            <div class="ops-panel__head">
              <div>
                <div class="ops-panel__title">本机直连调试通道</div>
                <div class="ops-panel__sub"><code>localhost:1595</code></div>
              </div>
              <div class="ops-panel__actions">
                <el-button @click="refreshLocalDebug">健康检测</el-button>
              </div>
            </div>

            <div class="compact-info">
              <div class="compact-info__item">
                <span class="compact-info__label">状态</span>
                <span class="compact-info__value">
                  <el-tag :type="localDebugServiceStatus.tagType" effect="dark">{{ localDebugServiceStatus.text }}</el-tag>
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

      <el-tab-pane label="客户端连接" name="bridge">
        <div class="tab-layout">
          <aside class="ops-sidebar">
            <div class="ops-panel ops-panel--sidebar">
              <div class="ops-panel__title">连接节点</div>
              <div class="ops-panel__sub">当前账号下可用于正式任务的客户端</div>

              <el-empty
                v-if="!loading && psClients.length === 0"
                description="暂无可识别的 PS 桥接节点"
              />

              <div v-else class="node-list">
                <button
                  v-for="client in psClients"
                  :key="client.id"
                  type="button"
                  class="node-item"
                  :class="{ 'is-active': selectedClientId === client.id }"
                  @click="selectedClientId = client.id"
                >
                  <div class="node-item__name-row">
                    <div class="node-item__name">{{ client.clientInfo?.machine?.code || client.id }}</div>
                    <el-tag
                      v-if="getPsBridgeService(client)"
                      size="small"
                      :type="getPsBridgeService(client)?.tagType || 'info'"
                    >
                      {{ getPsBridgeService(client)?.text }}
                    </el-tag>
                  </div>
                  <div class="node-item__meta">{{ getPsBridgeService(client)?.message || '未上报 Photoshop 服务详情' }}</div>
                  <div class="node-item__meta">{{ client.clientInfo?.appVersion || '未知版本' }}</div>
                  <div class="node-item__meta">{{ client.connectedAt ? formatPast(new Date(client.connectedAt)) : '-' }}</div>
                </button>
              </div>
            </div>
          </aside>

          <section class="ops-main">
            <div class="ops-panel">
              <div class="ops-panel__head">
              <div>
                  <div class="ops-panel__title">客户端连接状态</div>
                  <div class="ops-panel__sub">查看节点可用性、服务状态与自动制作运行情况。</div>
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
                      <el-tag :type="bridgeServiceStatus.tagType" effect="dark">{{ bridgeServiceStatus.text }}</el-tag>
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
                        <div class="ops-panel__sub">控制客户端套图自动制作开关，并查看当前处理状态。</div>
                      </div>
                      <el-tag :type="selectedPsAutomationEnabled ? 'success' : 'info'" effect="dark">
                        {{ selectedPsAutomationEnabled ? '已开启' : '已关闭' }}
                      </el-tag>
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
                        <el-tag :type="selectedPsAutomation?.running ? 'warning' : 'info'" effect="plain">
                          {{ selectedPsAutomation?.running ? '执行中' : '空闲' }}
                        </el-tag>
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

              <el-empty v-else description="请选择一个桥接节点" />
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
    text = '桥接可执行'
  } else if (status === 'error') {
    tagType = 'danger'
    text = '桥接异常'
  } else if (connected) {
    tagType = 'warning'
    text = '桥接在线'
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

const formatDateSafe = (value?: string) => {
  if (!value) return '-'
  try {
    return formatDate(new Date(value))
  } catch {
    return value
  }
}

const localDebugStatusText = computed(() => {
  if (localDebugRuntime.connected && localDebugRuntime.isAvailable) {
    return '可调试'
  }
  if (localDebugRuntime.connected) {
    return '已连通，但 Photoshop 不可执行'
  }
  return localDebugRuntime.lastError || '不可用'
})

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
      summary: '当前账号下没有识别到带 Photoshop 服务上报的客户端桥接节点。'
    }
  }

  if (selectedPsBridgeService.value?.available) {
    return {
      level: 'success',
      tagType: 'success' as const,
      text: '可用',
      summary: '当前选中的客户端桥接节点可直接执行 Photoshop 任务。'
    }
  }

  if (selectedPsBridgeService.value?.connected) {
    return {
      level: 'warning',
      tagType: 'warning' as const,
      text: '在线待命',
      summary: selectedPsBridgeService.value?.message || '桥接节点已在线，但 Photoshop 服务尚未达到可执行状态。'
    }
  }

  return {
    level: 'danger',
    tagType: 'danger' as const,
    text: '不可用',
    summary: selectedPsBridgeService.value?.message || '已选客户端未上报可用的 Photoshop 桥接服务。'
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
    const [health, status] = await Promise.all([
      localPhotoshopApi.checkHealth(),
      localPhotoshopApi.checkPhotoshopStatus(false)
    ])

    localDebugRuntime.connected = true
    localDebugRuntime.isAvailable = !!(status.is_available && status.is_running)
    localDebugRuntime.version = health.version || status.connection_test?.version || ''
    localDebugRuntime.message = localDebugRuntime.isAvailable
      ? 'yishe-ps 与 Photoshop 可用于本机调试'
      : 'yishe-ps 已连通，但 Photoshop 当前不可执行'
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
}

.ops-header__title {
  font-size: 18px;
  font-weight: 600;
}

.ops-header__desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ops-header__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
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
  gap: 10px;
}

.inline-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  background: var(--el-bg-color);
  font-size: 12px;
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
  box-shadow: 0 0 6px rgb(103 194 58 / 40%);
}

.inline-status.is-warning .inline-status__dot {
  background: #e6a23c;
  box-shadow: 0 0 6px rgb(230 162 60 / 40%);
}

.inline-status.is-danger .inline-status__dot {
  background: #f56c6c;
  box-shadow: 0 0 6px rgb(245 108 108 / 40%);
}

.inline-status__label {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.inline-status__text {
  font-weight: 600;
}

.compact-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.compact-info--grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.compact-info__item {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.compact-info__item--full {
  grid-column: 1 / -1;
}

.compact-info__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.compact-info__value {
  font-size: 13px;
  color: var(--el-text-color-primary);
  line-height: 1.6;
  word-break: break-word;
}

.ops-sidebar,
.ops-main {
  min-width: 0;
}

.ops-panel {
  border: 1px solid var(--el-border-color);
}

.ops-panel--sidebar {
  position: sticky;
  top: 0;
}

.ops-panel,
.ops-panel--sidebar {
  padding: 14px;
}

.ops-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 12px;
}

.ops-panel__title {
  font-size: 14px;
  font-weight: 600;
}

.ops-panel__sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ops-panel__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.automation-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
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

.node-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.node-item {
  text-align: left;
  border: 1px solid var(--el-border-color);
  padding: 10px 12px;
  cursor: pointer;
}

.node-item.is-active {
  outline: 1px solid var(--el-border-color-dark);
  outline-offset: 0;
}

.node-item__name {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  word-break: break-all;
}

.node-item__name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.node-item__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.ops-form-block {
  margin-top: 14px;
}

.ops-form-block__title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
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

  .ops-panel--sidebar {
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

  .automation-toolbar__main {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
