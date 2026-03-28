<template>
  <div class="ps-console" v-loading="loading">
    <div class="ops-header">
      <div>
        <div class="ops-header__title">PS 控制台</div>
        <div class="ops-header__desc">本机直连用于调试，客户端桥接用于正式执行与自动轮询。</div>
      </div>
      <div class="ops-header__actions">
        <el-button @click="refreshLocalDebug">刷新本机直连</el-button>
        <el-button type="primary" @click="refreshClients">刷新桥接节点</el-button>
      </div>
    </div>

    <div class="ops-strip">
      <div class="ops-metric">
        <span class="ops-metric__label">本机直连</span>
        <span class="ops-metric__value">{{ localDebugStatusText }}</span>
      </div>
      <div class="ops-metric">
        <span class="ops-metric__label">桥接节点数</span>
        <span class="ops-metric__value">{{ psClients.length }}</span>
      </div>
      <div class="ops-metric">
        <span class="ops-metric__label">当前节点</span>
        <span class="ops-metric__value">{{ selectedClient?.clientInfo?.machine?.code || '-' }}</span>
      </div>
      <div class="ops-metric">
        <span class="ops-metric__label">当前桥接状态</span>
        <span class="ops-metric__value">{{ selectedPsBridgeService?.text || '-' }}</span>
      </div>
    </div>

    <div class="ops-layout">
      <aside class="ops-sidebar">
        <div class="ops-panel ops-panel--sidebar">
          <div class="ops-panel__title">桥接节点</div>
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
              <div class="node-item__name">{{ client.clientInfo?.machine?.code || client.id }}</div>
              <div class="node-item__meta">{{ getPsBridgeService(client)?.text || '未上报' }}</div>
              <div class="node-item__meta">{{ client.clientInfo?.appVersion || '未知版本' }}</div>
              <div class="node-item__meta">{{ client.connectedAt ? formatPast(new Date(client.connectedAt)) : '-' }}</div>
            </button>
          </div>
        </div>
      </aside>

      <section class="ops-main">
        <div class="ops-columns">
          <div class="ops-panel">
            <div class="ops-panel__head">
              <div>
                <div class="ops-panel__title">本机直连调试通道</div>
                <div class="ops-panel__sub"><code>localhost:1595</code>，仅用于当前电脑调试</div>
              </div>
              <div class="ops-panel__actions">
                <el-button @click="openLocalPsUi">打开页面</el-button>
                <el-button @click="refreshLocalDebug">健康检测</el-button>
              </div>
            </div>

            <div class="kv-table">
              <div class="kv-row">
                <div class="kv-key">访问地址</div>
                <div class="kv-value">http://localhost:1595</div>
              </div>
              <div class="kv-row">
                <div class="kv-key">通道状态</div>
                <div class="kv-value">{{ localDebugStatusText }}</div>
              </div>
              <div class="kv-row">
                <div class="kv-key">版本</div>
                <div class="kv-value">{{ localDebugRuntime.version || '-' }}</div>
              </div>
              <div class="kv-row">
                <div class="kv-key">Photoshop 可用</div>
                <div class="kv-value">{{ localDebugRuntime.isAvailable ? '可用' : '不可用' }}</div>
              </div>
              <div class="kv-row kv-row--block">
                <div class="kv-key">说明</div>
                <div class="kv-value">{{ localDebugRuntime.message || '-' }}</div>
              </div>
              <div class="kv-row kv-row--block">
                <div class="kv-key">诊断信息</div>
                <div class="kv-value">{{ localDebugRuntime.diagnostics || '-' }}</div>
              </div>
            </div>

            <div class="ops-form-block">
              <div class="ops-form-block__title">PSD 分析</div>
              <el-form label-position="top" class="ops-form">
                <el-form-item label="PSD 路径">
                  <el-input v-model="localAnalyzePsdPath" placeholder="例如 D:\\demo\\a.psd" />
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    :disabled="!localAnalyzePsdPath.trim()"
                    @click="handleLocalAnalyzePsd"
                  >
                    执行分析
                  </el-button>
                </el-form-item>
              </el-form>
            </div>

            <div class="ops-form-block">
              <div class="ops-form-block__title">单次调试请求</div>
              <el-form label-position="top" class="ops-form">
                <el-form-item label="请求 JSON">
                  <el-input
                    v-model="localDebugProcessRequest"
                    type="textarea"
                    :rows="8"
                    placeholder='{"psd_path":"D:\\demo\\a.psd","smart_objects":[],"export_dir":"D:\\demo\\out"}'
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleLocalDebugProcess">执行调试</el-button>
                </el-form-item>
              </el-form>
            </div>

            <div class="ops-form-block">
              <div class="ops-form-block__title">最近结果</div>
              <el-input :model-value="localResultText" type="textarea" :rows="12" readonly />
            </div>
          </div>

          <div class="ops-panel">
            <div class="ops-panel__head">
              <div>
                <div class="ops-panel__title">客户端桥接执行通道</div>
                <div class="ops-panel__sub">用于正式任务、接口数据处理、自动轮询</div>
              </div>
              <div class="ops-panel__actions" v-if="selectedClient">
                <el-button @click="handleBridgeCommand(selectedClient.id, 'refreshRuntime')">刷新状态</el-button>
                <el-button @click="handleBridgeCommand(selectedClient.id, 'health', {}, 'maintenance')">检测服务</el-button>
              </div>
            </div>

            <template v-if="selectedClient">
              <div class="kv-table">
                <div class="kv-row">
                  <div class="kv-key">客户端</div>
                  <div class="kv-value">{{ selectedClient.clientInfo?.machine?.code || selectedClient.id }}</div>
                </div>
                <div class="kv-row">
                  <div class="kv-key">桥接状态</div>
                  <div class="kv-value">{{ selectedPsBridgeService?.text || '-' }}</div>
                </div>
                <div class="kv-row">
                  <div class="kv-key">运行态</div>
                  <div class="kv-value">{{ selectedPsBridgeService?.state || '-' }}</div>
                </div>
                <div class="kv-row">
                  <div class="kv-key">当前任务</div>
                  <div class="kv-value">{{ selectedPsBridgeService?.currentTaskId || '-' }}</div>
                </div>
                <div class="kv-row kv-row--block">
                  <div class="kv-key">状态说明</div>
                  <div class="kv-value">{{ selectedPsBridgeService?.message || '-' }}</div>
                </div>
                <div class="kv-row kv-row--block">
                  <div class="kv-key">支持命令</div>
                  <div class="kv-value">
                    <span v-for="command in selectedPsBridgeService?.supportedCommands || []" :key="command" class="inline-chip">
                      {{ command }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="ops-form-block">
                <div class="ops-form-block__title">套图执行</div>
                <el-form label-position="top" class="ops-form">
                  <el-form-item label="套图 ID">
                    <el-input v-model="bridgePsdSetId" placeholder="输入 psdSetId" />
                  </el-form-item>
                  <el-form-item>
                    <el-button
                      type="primary"
                      :disabled="!bridgePsdSetId.trim()"
                      @click="handleBridgeProcessPsdSet"
                    >
                      通过桥接节点执行
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>

              <div class="ops-form-block">
                <div class="ops-form-block__title">运行规则</div>
                <div class="rule-list">
                  <div>本机直连可用，不代表桥接节点在线。</div>
                  <div>桥接节点在线，不代表当前电脑能访问 `localhost:1595`。</div>
                  <div>正式任务与自动轮询，应以桥接执行通道为准。</div>
                </div>
              </div>

              <div class="ops-form-block">
                <div class="ops-form-block__title">最近结果</div>
                <div class="result-meta" v-if="lastBridgeCommandResult">
                  <span>命令：{{ lastBridgeCommandResult.action }}</span>
                  <span>结果：{{ lastBridgeCommandResult.success ? '成功' : '失败' }}</span>
                  <span>时间：{{ lastBridgeCommandResult.finishedAt ? formatPast(new Date(lastBridgeCommandResult.finishedAt)) : '-' }}</span>
                </div>
                <el-input :model-value="bridgeResultText" type="textarea" :rows="12" readonly />
              </div>
            </template>

            <el-empty v-else description="请选择一个桥接节点" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { formatPast } from '@/utils/formatTime'
import { ClientControlService } from '@/services/clientControl'
import localPhotoshopApi from '@/api/client/photoshop'
import { websocketClient, type ServiceCommandResultEvent, type ServiceRuntimeEvent } from '@/services/websocketClient'
import type { WebsocketConnectionVO } from '@/api/system/websocket'

defineOptions({ name: 'PsConsolePanel' })

const clients = ref<WebsocketConnectionVO[]>([])
const loading = ref(false)
const selectedClientId = ref('')
const bridgePsdSetId = ref('')
const localAnalyzePsdPath = ref('')
const localDebugProcessRequest = ref('')
const lastBridgeCommandResult = ref<ServiceCommandResultEvent | null>(null)
const lastLocalResult = ref<any>(null)

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

const localDebugStatusText = computed(() => {
  if (localDebugRuntime.connected && localDebugRuntime.isAvailable) {
    return '可调试'
  }
  if (localDebugRuntime.connected) {
    return '已连通，但 Photoshop 不可执行'
  }
  return localDebugRuntime.lastError || '不可用'
})

const localResultText = computed(() => {
  if (!lastLocalResult.value) {
    return '暂无结果'
  }
  return JSON.stringify(lastLocalResult.value, null, 2)
})

const bridgeResultText = computed(() => {
  if (!lastBridgeCommandResult.value) {
    return '暂无结果'
  }
  return JSON.stringify(lastBridgeCommandResult.value, null, 2)
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

const handleServiceCommandResult = (event: ServiceCommandResultEvent) => {
  if (event.service !== 'photoshop') {
    return
  }
  lastBridgeCommandResult.value = event
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

const handleBridgeProcessPsdSet = async () => {
  if (!selectedClient.value || !bridgePsdSetId.value.trim()) {
    ElMessage.warning('请选择客户端并输入套图 ID')
    return
  }

  await handleBridgeCommand(selectedClient.value.id, 'processPsdSet', {
    psdSetId: bridgePsdSetId.value.trim()
  })
}

const handleLocalAnalyzePsd = async () => {
  if (!localAnalyzePsdPath.value.trim()) {
    ElMessage.warning('请输入 PSD 路径')
    return
  }

  try {
    const result = await localPhotoshopApi.analyzePsd(localAnalyzePsdPath.value.trim())
    lastLocalResult.value = {
      action: 'analyzePsd',
      success: true,
      finishedAt: new Date().toISOString(),
      data: result
    }
    await refreshLocalDebug()
  } catch (error: any) {
    lastLocalResult.value = {
      action: 'analyzePsd',
      success: false,
      finishedAt: new Date().toISOString(),
      error: error?.message || 'PSD 分析失败'
    }
    ElMessage.error(error?.message || 'PSD 分析失败')
    await refreshLocalDebug()
  }
}

const handleLocalDebugProcess = async () => {
  if (!localDebugProcessRequest.value.trim()) {
    ElMessage.warning('请输入调试请求 JSON')
    return
  }

  try {
    const parsed = JSON.parse(localDebugProcessRequest.value)
    const result = await localPhotoshopApi.processPsd(parsed)
    lastLocalResult.value = {
      action: 'processPsd',
      success: !!result.success,
      finishedAt: new Date().toISOString(),
      data: result
    }
    if (!result.success) {
      ElMessage.error(result.message || '本机调试执行失败')
    }
    await refreshLocalDebug()
  } catch (error: any) {
    lastLocalResult.value = {
      action: 'processPsd',
      success: false,
      finishedAt: new Date().toISOString(),
      error: error?.message || '调试请求执行失败'
    }
    ElMessage.error(error?.message || '调试请求执行失败')
    await refreshLocalDebug()
  }
}

const openLocalPsUi = () => {
  window.open('http://localhost:1595/ui', '_blank')
}

onMounted(() => {
  websocketClient.events.on('serviceRuntime', handleServiceRuntime)
  websocketClient.events.on('serviceCommandResult', handleServiceCommandResult)
  void Promise.all([refreshClients(), refreshLocalDebug()])
})

onUnmounted(() => {
  websocketClient.events.off('serviceRuntime', handleServiceRuntime)
  websocketClient.events.off('serviceCommandResult', handleServiceCommandResult)
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

.ops-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid var(--el-border-color);
}

.ops-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-right: 1px solid var(--el-border-color-lighter);
  min-width: 0;
}

.ops-metric:last-child {
  border-right: 0;
}

.ops-metric__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ops-metric__value {
  font-size: 14px;
  font-weight: 600;
  word-break: break-word;
}

.ops-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
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

.node-item__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.kv-table {
  border-top: 1px solid var(--el-border-color-lighter);
  border-left: 1px solid var(--el-border-color-lighter);
}

.kv-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
}

.kv-row--block {
  align-items: start;
}

.kv-key,
.kv-value {
  padding: 10px 12px;
  border-right: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
  line-height: 1.6;
}

.kv-key {
  color: var(--el-text-color-regular);
}

.kv-value {
  word-break: break-word;
  white-space: pre-wrap;
}

.ops-form-block {
  margin-top: 14px;
}

.ops-form-block__title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
}

.ops-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.inline-chip {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  margin: 0 6px 6px 0;
  border: 1px solid var(--el-border-color);
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 1280px) {
  .ops-strip,
  .ops-columns {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 1024px) {
  .ops-layout,
  .ops-columns,
  .ops-strip {
    grid-template-columns: 1fr;
  }

  .ops-metric {
    border-right: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .ops-metric:last-child {
    border-bottom: 0;
  }

  .ops-panel--sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .ops-header,
  .ops-panel__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .kv-row {
    grid-template-columns: 1fr;
  }
}
</style>
