<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, Clock } from '@element-plus/icons-vue'
import { Icon } from '@/components/Icon'
import { getManifestByType } from '@/views/workflow/editor/config/node-manifest'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store/modules/user'
import ContentWrap from '@/components/ContentWrap/src/ContentWrap.vue'
import ExecutionHistory from '@/components/workflow/ExecutionHistory.vue'
import {
  getWorkflowPageApi,
  createWorkflowApi,
  deleteWorkflowApi,
  toggleEnabledApi,
  runWorkflowApi,
  getWorkflowExecutionsApi,
  deleteWorkflowExecutionApi,
  clearWorkflowExecutionsApi,
  publishWorkflowToLibraryApi,
  resetWorkflowApi,
  type WorkflowItem
} from '@/api/workflow'

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()
const isAdmin = computed(() => userStore.user?.isAdmin === true)

const loading = ref(false)
const list = ref<WorkflowItem[]>([])
const total = ref(0)
const params = reactive({ currentPage: 1, pageSize: 20, name: '' })

const createVisible = ref(false)
const creating = ref(false)
const createForm = reactive({ name: '', description: '' })

const listRefreshing = ref(false)

const fetchList = async (options: { silent?: boolean } = {}) => {
  if (listRefreshing.value) return
  listRefreshing.value = true
  if (!options.silent) loading.value = true
  try {
    const res: any = await getWorkflowPageApi({ ...params })
    list.value = res.list || []
    total.value = res.total || 0
  } finally {
    listRefreshing.value = false
    if (!options.silent) loading.value = false
  }
}

const goToLibrary = () => {
  router.push('/workflow/library')
}

let runningRefreshTimer: ReturnType<typeof setInterval> | null = null

const refreshRunningWorkflows = async () => {
  if (loading.value || !list.value.some((item) => item.isRunning)) return
  await fetchList({ silent: true })
}

onMounted(async () => {
  await fetchList()
  runningRefreshTimer = setInterval(refreshRunningWorkflows, 2500)
})

onBeforeUnmount(() => {
  if (runningRefreshTimer) {
    clearInterval(runningRefreshTimer)
    runningRefreshTimer = null
  }
})

const handleSearch = () => { params.currentPage = 1; fetchList() }

const handleCreate = async () => {
  if (!createForm.name.trim()) { ElMessage.warning(t('workflow.nameRequired')); return }
  creating.value = true
  try {
    const res: any = await createWorkflowApi({ name: createForm.name.trim(), description: createForm.description.trim() })
    ElMessage.success(t('workflow.createSuccess'))
    createVisible.value = false
    createForm.name = ''
    createForm.description = ''
    router.push(`/workflow/editor/${res.id}`)
  } finally { creating.value = false }
}

const openEditor = (row: WorkflowItem) => { router.push(`/workflow/editor/${row.id}`) }

const handlePublishToLibrary = async (row: WorkflowItem) => {
  if (!isAdmin.value) return
  try {
    const category = await ElMessageBox.prompt('请输入工作流库分类', '发布到工作流库', {
      inputValue: '其他',
      confirmButtonText: '发布',
      cancelButtonText: '取消'
    })
    await publishWorkflowToLibraryApi(row.id, { category: category.value || '其他' })
    ElMessage.success('已发布到工作流库')
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(error?.message || '发布到工作流库失败')
  }
}

const handleDelete = async (row: WorkflowItem) => {
  await ElMessageBox.confirm(`${t('workflow.deleteConfirm', { name: row.name })}`, t('common.tip'), { confirmButtonText: t('workflow.delete'), cancelButtonText: t('common.cancel'), type: 'warning', confirmButtonClass: 'el-button--danger' })
  await deleteWorkflowApi(row.id)
  ElMessage.success(t('workflow.deleted'))
  fetchList()
}

const handleResetWorkflow = async (row: WorkflowItem) => {
  try {
    await ElMessageBox.confirm(`确定强制终止工作流「${row.name}」的所有运行中任务并重置状态吗？`, t('common.tip'), {
      confirmButtonText: '强制重置',
      cancelButtonText: t('common.cancel'),
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    })
    const res: any = await resetWorkflowApi(row.id)
    ElMessage.success(res?.message || '工作流状态已重置')
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(error?.message || '重置失败')
  }
}

const hasCronTrigger = (item: WorkflowItem) => item.triggers?.some((t) => t.type === 'cron' && t.enabled)

const getNodeManifests = (item: WorkflowItem) =>
  (item.nodeTypes || []).map((type) => getManifestByType(type)).filter(Boolean).slice(0, 8)

const getCronText = (item: WorkflowItem) => {
  const trigger = item.triggers?.find((t) => t.type === 'cron' && t.enabled)
  const expr = trigger?.config?.expression || ''
  if (!expr) return t('workflow.cron')
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return t('workflow.cron')
  const [min, hour, dom, month, dow] = parts

  // 每N分钟
  if (min.startsWith('*/') && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return t('workflow.everyNMinutes', { n: min.slice(2) })
  }
  // 每小时
  if (min === '0' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return t('workflow.everyHour')
  }
  // 每天
  if (min === '0' && hour !== '*' && dom === '*' && month === '*' && dow === '*') {
    return t('workflow.everyDay', { hour })
  }
  // 每周
  if (min === '0' && hour !== '*' && dom === '*' && month === '*' && dow !== '*') {
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const days = dow.split(',').map(d => weekDays[parseInt(d)] || d).join('、')
    return t('workflow.everyWeek', { days, hour })
  }
  // 每月
  if (min === '0' && hour !== '*' && dom !== '*' && month === '*' && dow === '*') {
    return t('workflow.everyMonth', { dom, hour })
  }
  return t('workflow.cron')
}

const handleToggleEnabled = async (row: WorkflowItem) => {
  if (row.isRunning) { ElMessage.warning(t('workflow.runningCannotDisable')); return }
  try {
    const res: any = await toggleEnabledApi(row.id)
    row.isEnabled = res.isEnabled
    ElMessage.success(row.isEnabled ? t('workflow.enabled') : t('workflow.disabled'))
  } catch (err: any) { ElMessage.error(err.message || t('common.operationFailed')) }
}

const historyDialogVisible = ref(false)
const historyWorkflow = ref<WorkflowItem | null>(null)
const executions = ref<any[]>([])
const loadingHistory = ref(false)

const terminalExecutionStatuses = new Set(['success', 'failed', 'cancelled', 'paused'])
const monitoredExecutionIds = new Set<string>()

/** 手动执行后精确轮询该条执行记录，终态落库后立即同步卡片。 */
const monitorExecutionCompletion = async (workflowId: string, executionId: string) => {
  if (!executionId || monitoredExecutionIds.has(executionId)) return
  monitoredExecutionIds.add(executionId)
  try {
    for (let attempt = 0; attempt < 450; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const res: any = await getWorkflowExecutionsApi(workflowId, { currentPage: 1, pageSize: 20 })
      const records = res?.list ?? res?.data?.list ?? []
      const execution = records.find((item: any) => item.id === executionId)
      if (execution && terminalExecutionStatuses.has(execution.status)) {
        await fetchList()
        return
      }
    }
  } catch (error) {
    // 网络短暂异常由列表兜底轮询继续同步。
    console.warn('工作流执行状态同步失败', error)
  } finally {
    monitoredExecutionIds.delete(executionId)
  }
}

const handleRunWorkflow = async (row: WorkflowItem) => {
  if (!row.isEnabled || row.isRunning) return
  try {
    const res: any = await runWorkflowApi(row.id)
    const executionId = String(res?.executionId || '')
    row.isRunning = true
    ElMessage.success(`${t('workflow.triggeredWithId', { id: executionId || 'OK' })}`)
    void monitorExecutionCompletion(row.id, executionId)
    await fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || t('workflow.executeFailed'))
    await fetchList()
  }
}

const handleShowHistory = async (row: WorkflowItem) => {
  historyWorkflow.value = row
  historyDialogVisible.value = true
  await loadExecutions(row.id)
}

const loadExecutions = async (workflowId: string) => {
  loadingHistory.value = true
  try {
    const res: any = await getWorkflowExecutionsApi(workflowId, { currentPage: 1, pageSize: 100 })
    executions.value = res?.list ?? res?.data?.list ?? []
  } catch (err) {
    console.error(t('workflow.fetchHistoryFailed'), err)
  } finally {
    loadingHistory.value = false
  }
}

const handleDeleteExecution = async (executionId: string) => {
  await ElMessageBox.confirm(t('workflow.deleteExecutionConfirm'), t('common.tip'), { type: 'warning' })
  try {
    await deleteWorkflowExecutionApi(executionId)
    ElMessage.success(t('workflow.deleted'))
    if (historyWorkflow.value) {
      await loadExecutions(historyWorkflow.value.id)
    }
  } catch (err: any) {
    ElMessage.error(err.message || t('common.deleteFailed'))
  }
}

const handleClearHistory = async () => {
  if (!historyWorkflow.value) return
  await ElMessageBox.confirm(t('workflow.clearHistoryConfirm'), t('common.tip'), { type: 'warning' })
  try {
    await clearWorkflowExecutionsApi(historyWorkflow.value.id)
    ElMessage.success(t('workflow.historyCleared'))
    executions.value = []
  } catch (err: any) {
    ElMessage.error(err.message || t('common.clearFailed'))
  }
}
</script>

<template>
  <ContentWrap :plain="true">
    <div class="wf-page">
      <!-- 页头：搜索与操作保持同一行，并分列到两侧 -->
      <div class="wf-page__header">
        <div class="wf-page__header-left">
          <el-input v-model="params.name" class="wf-page__search-input" :placeholder="t('workflow.search')" size="small"
            clearable @keyup.enter="handleSearch" @clear="handleSearch" />
        </div>
        <div class="wf-page__header-actions">
          <el-button size="small" @click="goToLibrary">工作流库</el-button>
          <el-button type="primary" size="small" @click="createVisible = true">{{ t('workflow.create') }}</el-button>
        </div>
      </div>

      <!-- 卡片网格 -->
      <div v-loading="loading" class="wf-grid">
        <!-- 新建 -->
        <div class="wf-card wf-card--add" @click="createVisible = true">
          <span class="wf-card--add__icon">+</span>
          <span class="wf-card--add__text">{{ t('workflow.create') }}</span>
        </div>

        <!-- 工作流卡片 -->
        <div v-for="item in list" :key="item.id" :class="[
          'wf-card',
          { 'wf-card--scheduled': hasCronTrigger(item) && item.isEnabled },
          { 'wf-card--running': item.isRunning },
          { 'wf-card--disabled': !item.isEnabled }
        ]" @click="openEditor(item)">
          <!-- 动态边框只表达实时执行状态；定时配置由“定时中”标签表达。 -->
          <div v-if="item.isRunning" class="wf-card__blob wf-card__blob--running"></div>
          <div class="wf-card__bg"></div>
          <div class="wf-card__hero">
            <header class="wf-card__hero-header">
              <span :class="[
                'wf-card__badge',
                item.isRunning
                  ? 'wf-card__badge--running'
                  : hasCronTrigger(item) && item.isEnabled
                    ? 'wf-card__badge--scheduled'
                    : item.isEnabled
                      ? 'wf-card__badge--on'
                      : 'wf-card__badge--off'
              ]">
                <span class="wf-card__badge-dot"></span>{{ item.isRunning
                  ? t('workflow.running')
                  : hasCronTrigger(item) && item.isEnabled
                    ? '定时中'
                    : item.isEnabled
                      ? t('workflow.enabled')
                      : t('workflow.disabled') }}
              </span>
            </header>
            <h3 class="wf-card__title">{{ item.name }}</h3>
            <div v-if="getNodeManifests(item).length" class="wf-card__node-icons" title="工作流节点">
              <span v-for="manifest in getNodeManifests(item)" :key="manifest!.type" class="wf-card__node-icon"
                :style="{ color: manifest!.color }" :title="manifest!.name">
                <img v-if="manifest!.iconImage" :src="manifest!.iconImage" :alt="manifest!.name" />
                <Icon v-else-if="manifest!.icon" :icon="manifest!.icon" :size="18" />
                <span v-else>{{ manifest!.name.slice(0, 1) }}</span>
              </span>
            </div>
            <p v-if="hasCronTrigger(item)" class="wf-card__cron">
              <el-icon>
                <Clock />
              </el-icon>{{ getCronText(item) }}
            </p>
          </div>
          <footer class="wf-card__footer">
            <div class="wf-card__info">
              <p v-if="item.description" class="wf-card__desc">{{ item.description }}</p>
              <span class="wf-card__date">{{ t('workflow.updatedAt', {
                date: new
                  Date(item.updateTime).toLocaleDateString('zh-CN')
              }) }}</span>
            </div>
            <el-dropdown trigger="click" placement="bottom-end" @click.stop>
              <button class="wf-card__more" @click.stop><el-icon>
                  <MoreFilled />
                </el-icon></button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleRunWorkflow(item)" :disabled="!item.isEnabled || item.isRunning">
                    {{ item.isRunning ? t('workflow.executing') : t('workflow.execute') }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="item.isRunning" type="warning" @click="handleResetWorkflow(item)">
                    强制终止与重置
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleShowHistory(item)">{{ t('workflow.executionHistory')
                    }}</el-dropdown-item>
                  <el-dropdown-item divided @click="openEditor(item)">{{ t('workflow.edit') }}</el-dropdown-item>
                  <el-dropdown-item v-if="isAdmin" @click="handlePublishToLibrary(item)">发布到工作流库</el-dropdown-item>
                  <el-dropdown-item :disabled="item.isRunning" @click="handleToggleEnabled(item)">{{ item.isEnabled ?
                    t('workflow.disable') : t('workflow.enable') }}</el-dropdown-item>
                  <el-dropdown-item type="danger" divided @click="handleDelete(item)">{{ t('workflow.delete')
                    }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </footer>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > params.pageSize" class="wf-page__pagination">
        <el-pagination v-model:current-page="params.currentPage" v-model:page-size="params.pageSize" :total="total"
          layout="total, prev, pager, next" @change="fetchList" />
      </div>

      <!-- 执行记录 - 全屏弹窗 -->
      <el-dialog v-model="historyDialogVisible"
        :title="`${historyWorkflow?.name || ''} - ${t('workflow.executionHistory')}`" fullscreen
        class="wf-history-dialog">
        <ExecutionHistory :executions="executions" :loading="loadingHistory" :show-delete="true"
          @refresh="historyWorkflow && loadExecutions(historyWorkflow.id)" @delete="handleDeleteExecution"
          @clear="handleClearHistory" />
      </el-dialog>

      <!-- 创建 -->
      <el-dialog v-model="createVisible" :title="t('workflow.create')" width="440px" align-center>
        <el-form label-position="top" @submit.prevent="handleCreate">
          <el-form-item :label="t('workflow.name')" required>
            <el-input v-model="createForm.name" :placeholder="t('workflow.namePlaceholder')" autofocus maxlength="100"
              show-word-limit />
          </el-form-item>
          <el-form-item :label="t('workflow.description')">
            <el-input v-model="createForm.description" type="textarea"
              :placeholder="t('workflow.descriptionPlaceholder')" :rows="3" maxlength="500" show-word-limit />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="createVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="creating" @click="handleCreate">{{ t('workflow.createAndOpen')
            }}</el-button>
        </template>
      </el-dialog>
    </div>
  </ContentWrap>
</template>

<style scoped lang="scss">
@keyframes wf-pulse {

  0%,
  100% {
    opacity: 0.7;
    transform: scale(1);
  }

  50% {
    opacity: 0.5;
    transform: scale(0.85);
  }
}

@keyframes wf-glow-pulse {

  0%,
  100% {
    box-shadow: 0 0 12px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  }

  50% {
    box-shadow: 0 0 24px color-mix(in srgb, var(--el-color-primary) 60%, transparent);
  }
}

@keyframes wf-blob-bounce {
  0% {
    transform: translate(-100%, -100%) translate3d(0, 0, 0);
  }

  25% {
    transform: translate(-100%, -100%) translate3d(100%, 0, 0);
  }

  50% {
    transform: translate(-100%, -100%) translate3d(100%, 100%, 0);
  }

  75% {
    transform: translate(-100%, -100%) translate3d(0, 100%, 0);
  }

  100% {
    transform: translate(-100%, -100%) translate3d(0, 0, 0);
  }
}


.wf-page {
  min-height: calc(100vh - 120px);
  padding: 10px 0 0;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 32px;
    margin-bottom: 16px;
  }

  &__header-left,
  &__header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__header-left {
    min-width: 0;
    flex: 1;
  }

  &__header-actions {
    flex-shrink: 0;
  }

  &__search-input {
    width: 240px;
  }

  &__pagination {
    display: flex;
    justify-content: center;
  }
}

.wf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.wf-card {
  position: relative;
  border: none;
  border-radius: 8px;
  z-index: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  min-height: 200px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  cursor: pointer;
  box-shadow:
    8px 8px 24px color-mix(in srgb, var(--el-text-color-primary) 10%, transparent),
    -4px -4px 16px rgba(255, 255, 255, 0.8);

  &:hover {
    transform: translateY(-3px);
    box-shadow:
      12px 12px 32px color-mix(in srgb, var(--el-text-color-primary) 14%, transparent),
      -6px -6px 20px rgba(255, 255, 255, 0.9);
  }

  html.dark & {
    box-shadow:
      4px 4px 16px rgba(0, 0, 0, 0.3),
      0 1px 4px rgba(0, 0, 0, 0.1) !important;

    &:hover {
      box-shadow:
        6px 6px 24px rgba(0, 0, 0, 0.6),
        0 2px 8px rgba(0, 0, 0, 0.4) !important;
    }
  }

  /* Blob: dynamic border effect (visible in the 5px gap around bg) */
  &__blob {
    position: absolute;
    z-index: 1;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 160%;
    border-radius: 50%;
    background-color: color-mix(in srgb, var(--el-color-primary) 60%, transparent);
    opacity: 0.7;
    filter: blur(10px);
    animation: wf-blob-bounce 4s infinite ease;
    pointer-events: none;
  }

  .wf-card__blob--running {
    background-color: color-mix(in srgb, #22c55e 68%, transparent);
  }

  /* Inner bg layer: covers center, leaves 5px border gap */
  &__bg {
    position: absolute;
    top: 5px;
    left: 5px;
    right: 5px;
    bottom: 5px;
    z-index: 2;
    background: var(--app-content-surface-color);
    border-radius: 10px;
    overflow: hidden;
    outline: 2px solid var(--app-content-surface-color);
    pointer-events: none;
  }



  /* Hero section */
  &__hero {
    position: relative;
    z-index: 3;
    background: transparent;
    border-radius: 8px 8px 0 0;
    padding: 16px 16px 14px;
    flex: 1;
  }

  &__hero-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 12px;
    font-weight: 700;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 14px;
    white-space: nowrap;

    &-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentcolor;
    }

    &--on {
      color: #15803d;
      background: color-mix(in srgb, #22c55e 14%, transparent);
    }

    &--off {
      color: var(--el-text-color-secondary);
      background: var(--app-content-surface-muted-color);
    }

    &--scheduled {
      color: #b45309;
      background: color-mix(in srgb, #f59e0b 14%, transparent);
    }

    &--running {
      color: #15803d;
      background: color-mix(in srgb, #22c55e 14%, transparent);

      .wf-card__badge-dot {
        animation: wf-pulse 1.4s ease-in-out infinite;
      }
    }
  }

  &__icon {
    width: 20px;
    height: 20px;
    color: var(--el-color-primary);
    opacity: 0.8;
  }

  &__node-icons {
    display: flex;
    align-items: center;
    min-width: 0;
    padding: 9px 0 2px;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__node-icon {
    display: inline-flex;
    width: 22px;
    height: 22px;
    align-items: center;
    justify-content: center;
    color: var(--el-color-primary);
  }

  &__node-icon img {
    width: 22px;
    height: 22px;
    object-fit: contain;
  }

  &__title {
    margin: 14px 0 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    padding-right: 12px;
  }

  &__cron {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 6px 0 0;
    font-size: 11px;
    color: #b45309;
    font-weight: 500;
  }

  /* Footer section */
  &__footer {
    position: relative;
    z-index: 3;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
    flex-wrap: nowrap;
    padding: 12px 16px;
    gap: 12px;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__desc {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__date {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }

  &__more {
    display: flex;
    width: 28px;
    height: 28px;
    padding: 0;
    color: var(--el-text-color-secondary);
    background: none;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s ease;
    flex-shrink: 0;

    &:hover {
      background: var(--app-content-surface-muted-color);
    }

    :deep(.el-icon) {
      font-size: 16px;
    }
  }
}

/* Status variants */
.wf-card--running {
  box-shadow:
    0 0 15px color-mix(in srgb, #22c55e 30%, transparent),
    8px 8px 24px color-mix(in srgb, var(--el-text-color-primary) 10%, transparent),
    -4px -4px 16px color-mix(in srgb, #ffffff, transparent);
}

.wf-card--disabled {
  opacity: 0.5;
  filter: grayscale(1);

  &:hover {
    opacity: 0.65;
    filter: grayscale(0.7);
    transform: none;
  }

  .wf-card__blob {
    display: none;
  }
}



.wf-card--add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 180px;
  background: transparent;
  border: 1px dashed var(--app-content-border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--el-color-primary);
  }

  &__icon {
    display: flex;
    width: 36px;
    height: 36px;
    font-size: 18px;
    color: var(--el-text-color-placeholder);
    border-radius: 8px;
    align-items: center;
    justify-content: center;
  }

  &__text {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

.wf-history-dialog {
  :deep(.el-dialog__body) {
    padding: 20px 32px;
    height: calc(100vh - 60px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}

:global(html.dark) {
  .wf-card--scheduled {
    border-color: color-mix(in srgb, #fbbf24 25%, var(--app-content-border-color));

    &:hover {
      border-color: color-mix(in srgb, #fbbf24 45%, var(--app-content-border-color));
    }
  }

  .wf-card--running {
    border-color: color-mix(in srgb, #22c55e 30%, var(--app-content-border-color));

    &:hover {
      border-color: color-mix(in srgb, #22c55e 50%, var(--app-content-border-color));
    }
  }

  .wf-tag {
    &--cron {
      color: #fcd34d;
      background: color-mix(in srgb, #fbbf24 12%, transparent);
    }

    &--running {
      color: #86efac;
      background: color-mix(in srgb, #4ade80 12%, transparent);
    }

    &--on {
      color: #86efac;
      background: color-mix(in srgb, #4ade80 12%, transparent);
    }
  }
}
</style>
