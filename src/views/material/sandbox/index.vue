<template>
  <ContentWrap :plain="true">
    <div class="sandbox-page">
      <!-- 顶部标题与状态 -->
      <div class="sandbox-header">
        <div class="sandbox-header__title">
          <h2>沙箱服务</h2>
          <span class="sandbox-header__subtitle">安全代码执行环境</span>
        </div>
        <div class="sandbox-header__status">
          <div class="sandbox-status-badge" :class="healthStatus">
            <span class="sandbox-status-badge__dot" />
            {{ healthLabel }}
          </div>
          <el-button size="small" :icon="Refresh" @click="fetchHealth" :loading="healthLoading">
            刷新
          </el-button>
        </div>
      </div>

      <!-- Tab 切换 -->
      <el-tabs v-model="activeTab" class="sandbox-tabs">
        <!-- 控制台 -->
        <el-tab-pane label="在线控制台" name="console">
          <div class="sandbox-console">
            <div class="sandbox-console__editor">
              <div class="sandbox-console__label">
                <span>代码编辑器</span>
                <span class="sandbox-console__hint">异步函数形式，返回结果将展示在右侧</span>
              </div>
              <textarea
                v-model="codeContent"
                class="sandbox-console__textarea"
                spellcheck="false"
                placeholder="module.exports = async (params) => {&#10;  return { message: 'Hello Sandbox', params };&#10;};"
              />
            </div>
            <div class="sandbox-console__params">
              <div class="sandbox-console__label">
                <span>参数 (JSON)</span>
              </div>
              <textarea
                v-model="paramsContent"
                class="sandbox-console__textarea sandbox-console__textarea--small"
                spellcheck="false"
                placeholder='{ "key": "value" }'
              />
            </div>
            <div class="sandbox-console__actions">
              <el-input-number
                v-model="timeoutMs"
                :min="100"
                :max="1800000"
                :step="1000"
                size="small"
                style="width: 140px"
              />
              <span class="sandbox-console__unit">ms 超时</span>
              <el-button
                type="primary"
                :loading="executing"
                :disabled="!codeContent.trim()"
                @click="handleExecute"
              >
                执行
              </el-button>
              <el-button @click="handleClear">清空</el-button>
            </div>
          </div>

          <!-- 执行结果 -->
          <div v-if="executeResult" class="sandbox-result">
            <div class="sandbox-result__header">
              <span>执行结果</span>
              <el-tag :type="executeResult.success ? 'success' : 'danger'" size="small">
                {{ executeResult.success ? '成功' : '失败' }}
              </el-tag>
              <span v-if="executeResult.durationMs" class="sandbox-result__duration">
                耗时 {{ executeResult.durationMs }}ms
              </span>
            </div>
            <pre class="sandbox-result__content">{{ executeResult.output }}</pre>
          </div>
        </el-tab-pane>

        <!-- 运行历史 -->
        <el-tab-pane label="运行历史" name="history">
          <div class="sandbox-history">
            <div class="sandbox-history__toolbar">
              <el-button
                size="small"
                type="danger"
                plain
                :disabled="!selectedIds.length"
                @click="handleBatchDelete"
              >
                删除选中 ({{ selectedIds.length }})
              </el-button>
              <el-button size="small" :icon="Refresh" @click="fetchRunList">刷新</el-button>
            </div>

            <vxe-grid
              v-bind="runGridOptions"
              :data="runList"
              :loading="runLoading"
              @checkbox-change="runCheckboxChange"
              @checkbox-all="runCheckboxAllChange"
            >
              <template #statusSlot="{ row }">
                <el-tag :type="runStatusType(row.status)" size="small">
                  {{ runStatusLabel(row.status) }}
                </el-tag>
              </template>
              <template #durationSlot="{ row }">
                <span>{{ row.durationMs ? `${row.durationMs}ms` : '-' }}</span>
              </template>
              <template #actionsSlot="{ row }">
                <el-button size="small" link type="primary" @click="viewRunDetail(row)">
                  详情
                </el-button>
                <el-button
                  v-if="['queued', 'running'].includes(row.status)"
                  size="small"
                  link
                  type="warning"
                  @click="handleCancel(row)"
                >
                  取消
                </el-button>
                <el-button size="small" link type="danger" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </vxe-grid>

            <!-- 分页 -->
            <div class="sandbox-pagination">
              <Pagination
                :total="total"
                v-model:page="currentPage"
                v-model:limit="pageSize"
                @pagination="fetchRunList"
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 运行详情弹窗 -->
      <el-dialog
        v-model="detailVisible"
        title="运行详情"
        width="700px"
        destroy-on-close
      >
        <div v-if="runDetail" class="sandbox-detail">
          <div class="sandbox-detail__meta">
            <div class="sandbox-detail__item">
              <span class="sandbox-detail__label">状态</span>
              <el-tag :type="runStatusType(runDetail.status)" size="small">
                {{ runStatusLabel(runDetail.status) }}
              </el-tag>
            </div>
            <div class="sandbox-detail__item">
              <span class="sandbox-detail__label">耗时</span>
              <span>{{ runDetail.durationMs ? `${runDetail.durationMs}ms` : '-' }}</span>
            </div>
            <div class="sandbox-detail__item">
              <span class="sandbox-detail__label">脚本</span>
              <span>{{ runDetail.scriptName || '-' }}</span>
            </div>
            <div class="sandbox-detail__item">
              <span class="sandbox-detail__label">执行时间</span>
              <span>{{ runDetail.createdAt || '-' }}</span>
            </div>
          </div>

          <div v-if="runDetail.params" class="sandbox-detail__section">
            <div class="sandbox-detail__section-title">参数</div>
            <pre class="sandbox-detail__code">{{ formatJson(runDetail.params) }}</pre>
          </div>

          <div v-if="runDetail.runResult !== null && runDetail.runResult !== undefined" class="sandbox-detail__section">
            <div class="sandbox-detail__section-title">返回结果</div>
            <pre class="sandbox-detail__code">{{ formatJson(runDetail.runResult) }}</pre>
          </div>

          <div v-if="runDetail.logs && runDetail.logs.length" class="sandbox-detail__section">
            <div class="sandbox-detail__section-title">日志 ({{ runDetail.logs.length }})</div>
            <div class="sandbox-detail__logs">
              <div
                v-for="(log, idx) in runDetail.logs"
                :key="idx"
                class="sandbox-detail__log-item"
                :class="`sandbox-detail__log-item--${log.level || 'info'}`"
              >
                <span class="sandbox-detail__log-time">{{ log.ts }}</span>
                <span class="sandbox-detail__log-level">{{ log.level }}</span>
                <span class="sandbox-detail__log-msg">{{ log.message }}</span>
              </div>
            </div>
          </div>

          <div v-if="runDetail.errorText" class="sandbox-detail__section">
            <div class="sandbox-detail__section-title">错误</div>
            <pre class="sandbox-detail__code sandbox-detail__code--error">{{ runDetail.errorText }}</pre>
          </div>
        </div>
      </el-dialog>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import Pagination from '@/components/Pagination/index.vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getSandboxHealth,
  consoleExecute,
  getSandboxRunList,
  getSandboxRun,
  cancelSandboxRun,
  deleteSandboxRun,
} from '@/api/sandbox'

const activeTab = ref('console')

// ─── 健康状态 ──────────────────────────────────────────────
const healthLoading = ref(false)
const healthData = ref<any>(null)

const healthStatus = computed(() => {
  if (!healthData.value) return 'unknown'
  return healthData.value.status === 'ok' ? 'online' : 'offline'
})

const healthLabel = computed(() => {
  if (!healthData.value) return '未检测'
  return healthData.value.status === 'ok' ? '服务正常' : '服务异常'
})

async function fetchHealth() {
  healthLoading.value = true
  try {
    const res: any = await getSandboxHealth()
    healthData.value = res?.data || res
  } catch {
    healthData.value = { status: 'error', message: '连接失败' }
  } finally {
    healthLoading.value = false
  }
}

// ─── 控制台 ────────────────────────────────────────────────
const codeContent = ref('module.exports = async (params) => {\n  return { message: \'Hello Sandbox\', params };\n};')
const paramsContent = ref('{ "key": "value" }')
const timeoutMs = ref(30000)
const executing = ref(false)
const executeResult = ref<any>(null)

async function handleExecute() {
  executing.value = true
  executeResult.value = null
  try {
    let params = {}
    try {
      params = paramsContent.value.trim() ? JSON.parse(paramsContent.value) : {}
    } catch {
      ElMessage.error('参数 JSON 格式错误')
      return
    }

    const startTime = Date.now()
    const res: any = await consoleExecute({
      code: codeContent.value,
      params,
      timeoutMs: timeoutMs.value,
    })
    const duration = Date.now() - startTime
    const data = res?.data || res

    executeResult.value = {
      success: true,
      durationMs: data.durationMs || duration,
      output: data.runResult ? JSON.stringify(data.runResult, null, 2) : JSON.stringify(data, null, 2),
    }
  } catch (err: any) {
    executeResult.value = {
      success: false,
      durationMs: 0,
      output: err?.message || '执行失败',
    }
  } finally {
    executing.value = false
  }
}

function handleClear() {
  codeContent.value = ''
  paramsContent.value = '{ "key": "value" }'
  executeResult.value = null
}

// ─── 运行历史 ──────────────────────────────────────────────
const runList = ref<any[]>([])
const runLoading = ref(false)
const selectedIds = ref<number[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const runGridOptions = reactive({
  border: true,
  stripe: true,
  size: 'small',
  height: 650,
  rowConfig: { isHover: true },
  checkboxConfig: { range: true },
  pagerConfig: { enabled: false },
  columns: [
    { type: 'checkbox', width: 50 },
    { field: 'id', title: 'ID', width: 70 },
    { field: 'scriptName', title: '脚本名称', minWidth: 140 },
    { field: 'status', title: '状态', width: 90, slots: { default: 'statusSlot' } },
    { field: 'durationMs', title: '耗时', width: 90, slots: { default: 'durationSlot' } },
    { field: 'createdAt', title: '执行时间', width: 170 },
    { title: '操作', width: 160, fixed: 'right', slots: { default: 'actionsSlot' } },
  ],
})

function runStatusType(status: string) {
  const map: Record<string, string> = {
    queued: 'info',
    running: 'warning',
    completed: 'success',
    failed: 'danger',
    timed_out: 'danger',
    cancelled: 'info',
  }
  return map[status] || 'info'
}

function runStatusLabel(status: string) {
  const map: Record<string, string> = {
    queued: '排队中',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    timed_out: '超时',
    cancelled: '已取消',
  }
  return map[status] || status
}

async function fetchRunList() {
  runLoading.value = true
  try {
    const res: any = await getSandboxRunList({
      currentPage: currentPage.value,
      pageSize: pageSize.value,
    })
    runList.value = res?.data?.list || res?.list || []
    total.value = res?.data?.total || res?.total || 0
  } catch {
    runList.value = []
    total.value = 0
  } finally {
    runLoading.value = false
  }
}

function runCheckboxChange({ records }: any) {
  selectedIds.value = records.map((r: any) => r.id)
}

function runCheckboxAllChange({ records }: any) {
  selectedIds.value = records.map((r: any) => r.id)
}

// ─── 运行详情 ──────────────────────────────────────────────
const detailVisible = ref(false)
const runDetail = ref<any>(null)

async function viewRunDetail(row: any) {
  try {
    const res: any = await getSandboxRun(row.id)
    runDetail.value = res?.data || res
    detailVisible.value = true
  } catch {
    ElMessage.error('获取详情失败')
  }
}

// ─── 取消 / 删除 ──────────────────────────────────────────
async function handleCancel(row: any) {
  try {
    await cancelSandboxRun({ id: row.id })
    ElMessage.success('已取消')
    fetchRunList()
  } catch (err: any) {
    ElMessage.error(err?.message || '取消失败')
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确认删除该运行记录？', '提示', { type: 'warning' })
    await deleteSandboxRun({ ids: [row.id] })
    ElMessage.success('已删除')
    fetchRunList()
  } catch {
    // cancelled
  }
}

async function handleBatchDelete() {
  if (!selectedIds.value.length) return
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selectedIds.value.length} 条记录？`, '提示', { type: 'warning' })
    await deleteSandboxRun({ ids: selectedIds.value })
    ElMessage.success('已删除')
    selectedIds.value = []
    fetchRunList()
  } catch {
    // cancelled
  }
}

// ─── 工具函数 ──────────────────────────────────────────────
function formatJson(val: any) {
  try {
    if (typeof val === 'string') return val
    return JSON.stringify(val, null, 2)
  } catch {
    return String(val)
  }
}

// ─── 初始化 ────────────────────────────────────────────────
onMounted(() => {
  fetchHealth()
  fetchRunList()
})
</script>

<style scoped>
.sandbox-page {
  padding: 0;
}

.sandbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sandbox-header__title {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.sandbox-header__title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sandbox-header__subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.sandbox-header__status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sandbox-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 12px;
}

.sandbox-status-badge.online {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.sandbox-status-badge.offline {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.sandbox-status-badge.unknown {
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.1);
}

.sandbox-status-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.sandbox-tabs {
  margin-top: 8px;
}

.sandbox-console {
  padding: 16px 0;
}

.sandbox-console__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.sandbox-console__hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.sandbox-console__textarea {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  background: var(--app-content-surface-color, #1e1e1e);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
}

.sandbox-console__textarea:focus {
  border-color: var(--el-color-primary);
}

.sandbox-console__textarea--small {
  min-height: 80px;
}

.sandbox-console__params {
  margin-top: 16px;
}

.sandbox-console__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.sandbox-console__unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.sandbox-result {
  margin-top: 20px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
}

.sandbox-result__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--app-content-surface-color, #f8fafc);
  border-bottom: 1px solid var(--el-border-color);
  font-size: 13px;
  font-weight: 500;
}

.sandbox-result__duration {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.sandbox-result__content {
  margin: 0;
  padding: 16px;
  max-height: 300px;
  overflow: auto;
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.sandbox-history {
  padding: 16px 0;
}

.sandbox-history__toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.sandbox-detail__meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 12px;
  margin-bottom: 16px;
  background: var(--app-content-surface-color, #f8fafc);
  border-radius: 6px;
}

.sandbox-detail__item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sandbox-detail__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.sandbox-detail__section {
  margin-bottom: 16px;
}

.sandbox-detail__section-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.sandbox-detail__code {
  margin: 0;
  padding: 12px;
  max-height: 200px;
  overflow: auto;
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  background: var(--app-content-surface-color, #1e1e1e);
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
}

.sandbox-detail__code--error {
  color: #ef4444;
}

.sandbox-detail__logs {
  max-height: 200px;
  overflow: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.sandbox-detail__log-item {
  display: flex;
  gap: 8px;
  padding: 4px 12px;
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1.6;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.sandbox-detail__log-item:last-child {
  border-bottom: none;
}

.sandbox-detail__log-time {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.sandbox-detail__log-level {
  width: 40px;
  flex-shrink: 0;
  font-weight: 600;
  text-transform: uppercase;
}

.sandbox-detail__log-item--info .sandbox-detail__log-level { color: #3b82f6; }
.sandbox-detail__log-item--warn .sandbox-detail__log-level { color: #f59e0b; }
.sandbox-detail__log-item--error .sandbox-detail__log-level { color: #ef4444; }

.sandbox-detail__log-msg {
  flex: 1;
  word-break: break-all;
}
.sandbox-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0;
}

</style>
