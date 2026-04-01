<template>
  <ContentWrap :plain="true">
    <div class="page">
      <div class="topbar">
        <div class="title">浏览器自动化控制台</div>
        <div class="actions">
          <el-button @click="loadClients">刷新节点</el-button>
          <el-button type="primary" :disabled="!selectedClientId" :loading="loadingMap.checkStatus" @click="sendSimple('checkStatus')">刷新状态</el-button>
        </div>
      </div>

      <div class="layout" v-loading="loading">
        <ExternalClientSidebar
          :items="clientNodeItems"
          :loading="loading"
          :selected-client-id="selectedClientId"
          section-title="客户端节点"
          empty-text="暂无可用客户端"
          @select="selectedClientId = $event"
        />

        <section v-if="selectedClient" class="main">
          <div class="summary">
            <div class="card item"><div class="label">自动化服务</div><div class="value">{{ serviceText(selectedService) }}</div></div>
            <div class="card item"><div class="label">浏览器实例</div><div class="value">{{ browserText(selectedService) }}</div></div>
            <div class="card item"><div class="label">页面数</div><div class="value">{{ selectedDetails.pageCount ?? 0 }}</div></div>
            <div class="card item"><div class="label">最近检测</div><div class="value">{{ dateText(selectedService?.lastCheckedAt) }}</div></div>
          </div>

          <div class="card panel console-entry">
            <div class="console-entry__content">
              <div class="section-title">集中操作台</div>
              <div class="muted">将连接控制、链接调试和任务中心统一收口到全屏面板中，方便集中管理当前节点。</div>
            </div>
            <el-button type="primary" :disabled="!selectedClientId" @click="operationDialogVisible = true">打开操作面板</el-button>
          </div>
        </section>

        <section v-else class="main-empty card"><el-empty description="请选择客户端节点" /></section>
      </div>

      <el-dialog
        v-model="operationDialogVisible"
        fullscreen
        append-to-body
        :destroy-on-close="false"
        class="browser-automation-dialog"
        :title="operationDialogTitle"
      >
        <div class="operation-shell">
          <el-tabs v-model="activeTab" class="operation-tabs">
            <el-tab-pane label="连接" name="browser">
              <div class="grid">
                <div class="card panel">
                  <div class="section-title">浏览器控制</div>
                  <div class="row">
                    <el-input-number v-model="browserForm.port" :min="1" :max="65535" controls-position="right" :disabled="!serviceEnabled" />
                    <el-switch v-model="browserForm.headless" active-text="无头" inactive-text="普通" :disabled="!serviceEnabled" />
                  </div>
                  <div class="row wrap">
                    <el-button type="primary" :disabled="!serviceEnabled" :loading="loadingMap.connect" @click="sendConnect">连接</el-button>
                    <el-button :disabled="!serviceEnabled" :loading="loadingMap.close" @click="sendSimple('close')">关闭</el-button>
                    <el-button type="danger" :disabled="!serviceEnabled" :loading="loadingMap.forceClose" @click="sendForceClose">强制关闭</el-button>
                    <el-button :disabled="!serviceEnabled" :loading="loadingMap.pages" @click="sendSimple('pages')">获取页面</el-button>
                  </div>
                  <div v-if="!serviceEnabled" class="muted">自动化服务未启动，当前节点不可执行相关操作。</div>
                </div>
                <div class="card panel">
                  <div class="section-title">快速打开</div>
                  <div class="row">
                    <el-select v-model="openForm.platform" placeholder="选择平台" clearable :disabled="!serviceEnabled">
                      <el-option v-for="item in platforms" :key="item" :label="item" :value="item" />
                    </el-select>
                    <el-button :disabled="!serviceEnabled" :loading="loadingMap.openPlatform" @click="sendOpenPlatform">打开平台页</el-button>
                  </div>
                  <div class="row">
                    <el-input v-model="openForm.url" placeholder="https://..." :disabled="!serviceEnabled" />
                    <el-button :disabled="!serviceEnabled" :loading="loadingMap.openLink" @click="sendOpenLink">打开链接</el-button>
                  </div>
                </div>
              </div>
              <div class="card panel">
                <div class="section-title">页面列表</div>
                <el-table :data="pageList" border stripe>
                  <el-table-column prop="index" label="#" width="60" />
                  <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
                  <el-table-column prop="url" label="链接" min-width="320" show-overflow-tooltip />
                </el-table>
              </div>
            </el-tab-pane>

            <el-tab-pane label="调试" name="debug">
              <div class="grid">
                <div class="card panel">
                  <div class="section-title">快速操作</div>
                  <div class="stack">
                    <el-input-number v-model="debugForm.pageIndex" :min="0" controls-position="right" :disabled="!serviceEnabled" />
                    <el-input v-model="debugForm.url" placeholder="URL" :disabled="!serviceEnabled" />
                    <el-input v-model="debugForm.selector" placeholder="Selector" :disabled="!serviceEnabled" />
                    <el-input v-model="debugForm.text" placeholder="Text" :disabled="!serviceEnabled" />
                    <el-input v-model="debugForm.key" placeholder="Key" :disabled="!serviceEnabled" />
                    <el-input-number v-model="debugForm.ms" :min="1" controls-position="right" :disabled="!serviceEnabled" />
                    <el-input-number v-model="debugForm.timeout" :min="1000" controls-position="right" :disabled="!serviceEnabled" />
                  </div>
                  <div class="action-grid">
                    <el-button v-for="item in debugActions" :key="item" :disabled="!serviceEnabled" :loading="loadingMap.debug" @click="sendDebug(item)">{{ item }}</el-button>
                  </div>
                </div>
                <div class="card panel">
                  <div class="section-title">脚本</div>
                  <el-input v-model="debugForm.expression" type="textarea" :rows="14" placeholder="页面内 JS 或 Playwright 脚本" :disabled="!serviceEnabled" />
                  <div class="row">
                    <el-button :disabled="!serviceEnabled" :loading="loadingMap.debug" @click="sendDebug('eval')">执行页面内 JS</el-button>
                    <el-button :disabled="!serviceEnabled" :loading="loadingMap.debug" @click="sendDebug('playwright')">执行 Playwright</el-button>
                  </div>
                </div>
              </div>
              <div class="card panel">
                <div class="section-title">结果</div>
                <pre class="result">{{ debugResult || '暂无结果' }}</pre>
              </div>
            </el-tab-pane>

            <el-tab-pane label="任务中心" name="tasks">
              <div class="card panel">
                <div class="row wrap">
                  <el-select v-model="taskFilters.status" clearable placeholder="状态" :disabled="!serviceEnabled"><el-option label="queued" value="queued" /><el-option label="running" value="running" /><el-option label="success" value="success" /><el-option label="failed" value="failed" /></el-select>
                  <el-input v-model="taskFilters.kind" placeholder="任务类型" :disabled="!serviceEnabled" />
                  <el-input v-model="taskFilters.platform" placeholder="平台" :disabled="!serviceEnabled" />
                  <el-input v-model="taskFilters.sourceId" placeholder="来源 ID" :disabled="!serviceEnabled" />
                  <el-button type="primary" :disabled="!serviceEnabled" :loading="loadingMap.tasks" @click="sendTasks">查询任务</el-button>
                </div>
                <el-table :data="taskList" border stripe>
                  <el-table-column prop="status" label="状态" width="100" />
                  <el-table-column prop="kind" label="类型" width="120" />
                  <el-table-column prop="action" label="动作" width="120" />
                  <el-table-column label="平台" min-width="140"><template #default="{ row }">{{ row.platform || (row.platforms || []).join(', ') || '-' }}</template></el-table-column>
                  <el-table-column prop="step" label="步骤" min-width="140" />
                  <el-table-column prop="id" label="任务 ID" min-width="240" show-overflow-tooltip />
                  <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                      <el-button link type="primary" :disabled="!serviceEnabled" @click="sendTaskDetail(row.id)">详情</el-button>
                      <el-button link type="primary" :disabled="!serviceEnabled" @click="sendTaskLogs(row.id)">日志</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-dialog>

      <el-dialog v-model="detailVisible" title="任务详情" width="900px"><pre class="result">{{ detailText }}</pre></el-dialog>
      <el-dialog v-model="logsVisible" title="任务日志" width="900px"><pre class="result">{{ logsText }}</pre></el-dialog>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  checkBrowserAutomationStatus,
  closeBrowserAutomation,
  connectBrowserAutomation,
  executeBrowserAutomationDebug,
  fetchBrowserAutomationPages,
  forceCloseBrowserAutomation,
  getBrowserAutomationClients,
  getBrowserAutomationTaskDetail,
  getBrowserAutomationTaskLogs,
  openBrowserAutomationLink,
  openBrowserAutomationPlatform,
  queryBrowserAutomationTasks,
  type BrowserAutomationClientVO,
  type BrowserAutomationCommandResponse,
  type BrowserAutomationServiceStatus
} from '@/api/external/browserAutomation'
import { websocketClient, type ClientConnectionChangedEvent, type ServiceCommandResultEvent, type ServiceRuntimeEvent } from '@/services/websocketClient'
import { formatDate } from '@/utils/formatTime'
import ExternalClientSidebar, { type ClientNodeBadge, type ClientNodeItem } from '../components/ExternalClientSidebar.vue'

defineOptions({ name: 'ExternalBrowserAutomation' })

const loading = ref(false)
const clients = ref<BrowserAutomationClientVO[]>([])
const selectedClientId = ref('')
const activeTab = ref('browser')
const pageList = ref<Record<string, any>[]>([])
const taskList = ref<Record<string, any>[]>([])
const platforms = ref(['douyin', 'kuaishou', 'xiaohongshu', 'weibo'])
const debugResult = ref('')
const detailText = ref('')
const logsText = ref('')
const detailVisible = ref(false)
const logsVisible = ref(false)
const operationDialogVisible = ref(false)
let timer: ReturnType<typeof window.setInterval> | null = null

const loadingMap = reactive<Record<string, boolean>>({
  checkStatus: false, connect: false, close: false, forceClose: false, pages: false,
  debug: false, tasks: false, taskDetail: false, taskLogs: false, openPlatform: false, openLink: false
})
const pending = reactive<Record<string, string>>({})

const browserForm = reactive({ port: 9222, headless: false })
const openForm = reactive({ platform: '', url: '' })
const debugForm = reactive({ pageIndex: 0, url: '', selector: '', text: '', key: '', expression: '', ms: 1000, timeout: 30000 })
const taskFilters = reactive({ status: '', kind: '', platform: '', sourceId: '' })
const debugActions = ['newPage', 'goto', 'bringToFront', 'reload', 'closePage', 'click', 'fill', 'type', 'press', 'text', 'html', 'count', 'wait', 'screenshot']

const selectedClient = computed(() => clients.value.find((item) => item.clientId === selectedClientId.value) || null)
const selectedClientName = computed(() => selectedClient.value?.machine?.code || selectedClient.value?.clientId || '未选择节点')
const operationDialogTitle = computed(() => `浏览器自动化操作 · ${selectedClientName.value}`)
const selectedService = computed<BrowserAutomationServiceStatus | null>(() => selectedClient.value?.uploader || null)
const selectedDetails = computed(() => selectedService.value?.details || {})
const serviceEnabled = computed(() => Boolean(selectedClient.value?.isOnline && selectedService.value?.connected))
const toneFromLevelClass = (value: string): ClientNodeBadge['tone'] =>
  value === 'is-success' ? 'success' : value === 'is-warning' ? 'warning' : 'muted'
const clientNodeItems = computed<ClientNodeItem[]>(() =>
  clients.value.map((client) => ({
    connectionId: client.clientId,
    name: client.machine?.code || client.clientId,
    time: dateText(client.connectedAt),
    metaLeft: client.appVersion || '未知版本',
    metaRight: client.location?.ip || client.location?.city || '未知位置',
    badges: [
      { text: client.isOnline ? '在线' : '离线', tone: client.isOnline ? 'success' : 'muted' },
      { text: serviceText(client.uploader), tone: toneFromLevelClass(selectedServiceTone(client.uploader)) },
      { text: browserText(client.uploader), tone: toneFromLevelClass(browserTone(client.uploader)) }
    ]
  }))
)

const dateText = (value?: string | null) => (value ? formatDate(value, 'YYYY-MM-DD HH:mm:ss') : '-')
const serviceText = (service?: BrowserAutomationServiceStatus | null) => !service ? '未知' : service.connected ? '已启动' : service.status === 'error' ? '异常' : '未启动'
const browserText = (service?: BrowserAutomationServiceStatus | null) => {
  const details = service?.details || {}
  if (details.browserConnected) return '已连接'
  if (details.hasInstance) return '实例未就绪'
  if (service?.connected) return '未连接'
  return service?.status === 'error' ? '异常' : '未启动'
}
const selectedServiceTone = (service?: BrowserAutomationServiceStatus | null) => service?.available ? 'is-success' : service?.connected ? 'is-warning' : 'is-muted'
const browserTone = (service?: BrowserAutomationServiceStatus | null) => {
  const details = service?.details || {}
  if (details.browserConnected) return 'is-success'
  if (details.hasInstance || service?.connected) return 'is-warning'
  return 'is-muted'
}
const jsonText = (value: any) => { try { return JSON.stringify(value ?? null, null, 2) } catch { return String(value) } }

const applyClient = (snapshot: BrowserAutomationClientVO) => {
  const index = clients.value.findIndex((item) => item.clientId === snapshot.clientId)
  if (index >= 0) clients.value.splice(index, 1, { ...clients.value[index], ...snapshot })
  else clients.value.unshift(snapshot)
  if (!selectedClientId.value) selectedClientId.value = snapshot.clientId
}

const finish = (action?: string) => { if (action && action in loadingMap) loadingMap[action] = false }

const dispatch = async (action: string, requestor: () => Promise<BrowserAutomationCommandResponse>, okText: string) => {
  loadingMap[action] = true
  const response = await requestor()
  if (!response?.success) {
    finish(action)
    ElMessage.error(response?.message || '命令发送失败')
    return
  }
  const commandId = response.data?.commandId
  if (!commandId) {
    finish(action)
    return
  }
  pending[commandId] = action
  ElMessage.success(okText)
}

const loadClients = async (silent = false) => {
  if (!silent) loading.value = true
  try {
    const data = await getBrowserAutomationClients()
    clients.value = Array.isArray(data) ? data : []
    if (!selectedClientId.value || !clients.value.some((item) => item.clientId === selectedClientId.value)) selectedClientId.value = clients.value[0]?.clientId || ''
  } finally {
    if (!silent) loading.value = false
  }
}

const sendSimple = async (kind: 'checkStatus' | 'close' | 'pages') => {
  if (!selectedClientId.value) return
  if (kind === 'checkStatus') return dispatch('checkStatus', () => checkBrowserAutomationStatus(selectedClientId.value), '状态刷新命令已发送')
  if (kind === 'close') return dispatch('close', () => closeBrowserAutomation(selectedClientId.value), '关闭命令已发送')
  return dispatch('pages', () => fetchBrowserAutomationPages(selectedClientId.value), '获取页面命令已发送')
}

const sendConnect = async () => selectedClientId.value && dispatch('connect', () => connectBrowserAutomation(selectedClientId.value, browserForm), '连接命令已发送')
const sendForceClose = async () => selectedClientId.value && dispatch('forceClose', () => forceCloseBrowserAutomation(selectedClientId.value, { port: browserForm.port }), '强制关闭命令已发送')
const sendOpenPlatform = async () => selectedClientId.value && openForm.platform && dispatch('openPlatform', () => openBrowserAutomationPlatform(selectedClientId.value, { platform: openForm.platform }), '打开平台页命令已发送')
const sendOpenLink = async () => selectedClientId.value && openForm.url.trim() && dispatch('openLink', () => openBrowserAutomationLink(selectedClientId.value, { url: openForm.url.trim() }), '打开链接命令已发送')
const sendDebug = async (action: string) => selectedClientId.value && dispatch('debug', () => executeBrowserAutomationDebug(selectedClientId.value, { action, ...debugForm }), '调试命令已发送')
const sendTasks = async () => selectedClientId.value && dispatch('tasks', () => queryBrowserAutomationTasks(selectedClientId.value, taskFilters), '任务查询命令已发送')
const sendTaskDetail = async (taskId: string) => selectedClientId.value && dispatch('taskDetail', () => getBrowserAutomationTaskDetail(selectedClientId.value, taskId), '任务详情命令已发送')
const sendTaskLogs = async (taskId: string) => selectedClientId.value && dispatch('taskLogs', () => getBrowserAutomationTaskLogs(selectedClientId.value, taskId), '任务日志命令已发送')

const onRuntime = (event: ServiceRuntimeEvent) => {
  if (event.service !== 'uploader') return
  const index = clients.value.findIndex((item) => item.clientId === event.clientId)
  if (index >= 0) clients.value.splice(index, 1, { ...clients.value[index], uploader: { ...(clients.value[index].uploader || {}), ...(event.runtime || {}) } })
}

const onClientChanged = (event: ClientConnectionChangedEvent) => {
  const snapshot = event.client as BrowserAutomationClientVO | undefined
  if (!snapshot?.clientId) return
  if (event.action === 'removed') {
    clients.value = clients.value.filter((item) => item.clientId !== snapshot.clientId)
    if (selectedClientId.value === snapshot.clientId) selectedClientId.value = clients.value[0]?.clientId || ''
    return
  }
  applyClient(snapshot)
}

const onCommand = async (event: ServiceCommandResultEvent) => {
  if (event.service !== 'uploader') return
  const action = pending[event.commandId]
  delete pending[event.commandId]
  finish(action)
  const data = event.data || {}
  if (event.clientId === selectedClientId.value) {
    if (Array.isArray(data.pages)) pageList.value = data.pages
    if (action === 'debug') debugResult.value = jsonText(data)
    if (action === 'tasks') taskList.value = Array.isArray(data.items) ? data.items : []
    if (action === 'taskDetail') { detailText.value = jsonText(data.task || null); detailVisible.value = true }
    if (action === 'taskLogs') { logsText.value = jsonText(data.logs || []); logsVisible.value = true }
  }
  ;(event.success ? ElMessage.success : ElMessage.error)(event.message || event.error || (event.success ? '执行成功' : '执行失败'))
  await loadClients(true)
}

watch(selectedClientId, (value) => {
  pageList.value = Array.isArray(selectedDetails.value.pages) ? selectedDetails.value.pages : []
  if (!value) operationDialogVisible.value = false
})

onMounted(async () => {
  await loadClients()
  websocketClient.events.on('serviceRuntime', onRuntime)
  websocketClient.events.on('serviceCommandResult', onCommand)
  websocketClient.events.on('clientConnectionChanged', onClientChanged)
  timer = window.setInterval(() => void loadClients(true), 10000)
})

onUnmounted(() => {
  websocketClient.events.off('serviceRuntime', onRuntime)
  websocketClient.events.off('serviceCommandResult', onCommand)
  websocketClient.events.off('clientConnectionChanged', onClientChanged)
  if (timer) window.clearInterval(timer)
})
</script>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
}

.actions,
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wrap {
  flex-wrap: wrap;
}

.layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 12px;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.console-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.console-entry__content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card {
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.panel,
.item,
.main-empty {
  padding: 12px;
}

.panel,
.stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 560px;
}

.summary,
.grid,
.action-grid {
  display: grid;
  gap: 12px;
}

.summary {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.action-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.label,
.muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.value,
.section-title {
  font-weight: 600;
}

.value {
  margin-top: 4px;
  font-size: 15px;
  line-height: 1.4;
}

.section-title {
  font-size: 13px;
  line-height: 1.2;
}

.row :deep(.el-input),
.row :deep(.el-select),
.row :deep(.el-input-number) {
  flex: 1;
  min-width: 0;
}

.stack :deep(.el-input),
.stack :deep(.el-input-number),
.stack :deep(.el-date-editor) {
  width: 100%;
}

.result {
  margin: 0;
  padding: 12px;
  min-height: 180px;
  max-height: 420px;
  overflow: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.operation-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.browser-automation-dialog :deep(.el-dialog__body) {
  padding-top: 12px;
}

@media (max-width: 1200px) {
  .layout,
  .summary,
  .grid,
  .action-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .console-entry {
    flex-direction: column;
    align-items: stretch;
  }

  .actions {
    flex-wrap: wrap;
  }
}
</style>
