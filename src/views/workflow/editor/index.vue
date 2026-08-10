<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { ArrowLeft, EditPen, Loading, Check, Warning } from '@element-plus/icons-vue'
import {
  VueFlow,
  useVueFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeMouseEvent,
  type EdgeMouseEvent
} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useAppStore } from '@/store/modules/app'
import { getWorkflowDetailApi, updateWorkflowApi, runWorkflowApi } from '@/api/workflow'
import { useWorkflowHistory } from '@/composables/useWorkflowHistory'
import { useSmartSave } from '@/composables/useSmartSave'

// 自定义节点
import StartNode from '@/components/workflow/nodes/StartNode.vue'
import DefaultNode from '@/components/workflow/nodes/DefaultNode.vue'
import EndNode from '@/components/workflow/nodes/EndNode.vue'
import ConditionNode from '@/components/workflow/nodes/ConditionNode.vue'
import LLMNode from '@/components/workflow/nodes/LLMNode.vue'
import HttpNode from '@/components/workflow/nodes/HttpNode.vue'
import CodeNode from '@/components/workflow/nodes/CodeNode.vue'
import MessagePushNode from '@/components/workflow/nodes/MessagePushNode.vue'
import HotsearchWeiboNode from '@/components/workflow/nodes/HotsearchWeiboNode.vue'

import NodePanel from '@/components/workflow/NodePanel.vue'
import ConfigPanel from '@/components/workflow/ConfigPanel.vue'
import NodePickerDialog from '@/components/workflow/NodePickerDialog.vue'
import TriggerConfigDialog from '@/components/workflow/TriggerConfigDialog.vue'
import type { SystemNodeCapability } from './config/nodeRegistry'

const appStore = useAppStore()
const route = useRoute()
const router = useRouter()
const workflowId = computed(() => route.params.id as string)

const patternColor = computed(() =>
  appStore.getIsDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(148, 163, 184, 0.4)'
)

// VueFlow 实例
const {
  nodes,
  edges,
  addNodes,
  addEdges,
  removeNodes,
  removeEdges,
  setNodes,
  setEdges,
  setViewport,
  getViewport,
  onConnect,
  project,
  findNode,
  updateNodeData,
  getSelectedNodes,
  getSelectedEdges
} = useVueFlow()

// 状态
const workflow = ref<any>(null)
const loading = ref(true)
const selectedNode = ref<Node | null>(null)
const selectedEdge = ref<Edge | null>(null)
const canvasRef = ref<HTMLDivElement | null>(null)

const triggerDialogVisible = ref(false)
const nodePickerVisible = ref(false)

const handleOpenNodePicker = () => {
  nodePickerVisible.value = true
}
const runningWorkflow = ref(false)

const handleRunWorkflow = async () => {
  if (!workflowId.value) return
  runningWorkflow.value = true
  try {
    const res: any = await runWorkflowApi(workflowId.value)
    ElNotification({
      title: '工作流触发成功',
      message: `运行记录ID: ${res?.executionId || 'OK'}, 耗时: ${res?.durationMs || 0}ms`,
      type: 'success',
      duration: 3000,
    })
  } catch (err: any) {
    ElMessage.error(err.message || '触发失败')
  } finally {
    runningWorkflow.value = false
  }
}

// 连线类型与配置
const edgeType = ref<'default' | 'smoothstep' | 'straight'>('smoothstep')

// 自定义节点类型映射 (使用 markRaw 避免 Vue 响应式代理警告)
const nodeTypes = {
  start: markRaw(StartNode),
  default: markRaw(DefaultNode),
  end: markRaw(EndNode),
  condition: markRaw(ConditionNode),
  llm: markRaw(LLMNode),
  http: markRaw(HttpNode),
  code: markRaw(CodeNode),
  message_push: markRaw(MessagePushNode),
  hotsearch_weibo: markRaw(HotsearchWeiboNode),
}

// ─── 撤销/重做历史 ─────────────────────────────────────────────
const {
  undo,
  redo,
  pushHistory,
  clearHistory,
  canUndo,
  canRedo
} = useWorkflowHistory(nodes, edges, setNodes, setEdges)

// ─── 智能保存 ─────────────────────────────────────────────────
const saveCanvasFn = async (canvas: { nodes: any[]; edges: any[]; viewport: any }) => {
  await updateWorkflowApi({
    id: workflowId.value,
    canvas
  })
}

const { saveStatus, saveNow: smartSaveNow, triggerSave, cancelSave } = useSmartSave(
  nodes,
  edges,
  getViewport,
  saveCanvasFn,
  { debounceMs: 2000, maxRetries: 3 }
)

// ─── 复制/粘贴节点 ───────────────────────────────────────────
const copiedNode = ref<Node | null>(null)

// ─── 快捷点击添加能力节点 ──────────────────────────────────────
const handleAddNodeFromLibrary = (capability: SystemNodeCapability) => {
  pushHistory()
  const mappedType = nodeTypes[capability.type as keyof typeof nodeTypes] ? capability.type : 'default'

  // 计算当前视口中心点，使节点出现在用户可见区域
  const canvasEl = canvasRef.value
  let centerPos = { x: 280, y: 160 }
  if (canvasEl) {
    const rect = canvasEl.getBoundingClientRect()
    const vp = getViewport()
    centerPos = {
      x: (rect.width / 2 - vp.x) / vp.zoom,
      y: (rect.height / 2 - vp.y) / vp.zoom
    }
  }

  const newNode: Node = {
    id: `${capability.type}_${Date.now().toString(36)}`,
    type: mappedType,
    position: centerPos,
    data: {
      label: capability.name,
      capabilityType: capability.type,
      config: { ...(capability.defaultData || {}) }
    }
  }

  addNodes([newNode])
  selectedNode.value = newNode
}

// ─── 拖拽放置节点 ─────────────────────────────────────────────
const onDrop = (event: DragEvent) => {
  event.preventDefault()
  const type = event.dataTransfer?.getData('application/vueflow-node-type')
  const label = event.dataTransfer?.getData('application/vueflow-node-label')
  const rawData = event.dataTransfer?.getData('application/vueflow-node-data')
  if (!type || !canvasRef.value) return

  let defaultData = {}
  if (rawData) {
    try {
      defaultData = JSON.parse(rawData)
    } catch (e) {}
  }

  const bounds = canvasRef.value.getBoundingClientRect()
  const position = project({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top
  })

  const mappedType = nodeTypes[type as keyof typeof nodeTypes] ? type : 'default'

  pushHistory()
  const newNode: Node = {
    id: `${type}_${Date.now().toString(36)}`,
    type: mappedType,
    position,
    data: {
      label: label || type,
      capabilityType: type,
      config: { ...defaultData }
    }
  }

  addNodes([newNode])
  selectedNode.value = newNode
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}

// ─── 键盘事件处理 ─────────────────────────────────────────────
const handleKeydown = (e: KeyboardEvent) => {
  const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea') return

  // 撤销 Ctrl+Z
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    e.preventDefault()
    if (canUndo()) {
      undo()
      ElMessage.info('已撤销')
    }
    return
  }

  // 重做 Ctrl+Shift+Z 或 Ctrl+Y
  if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
    e.preventDefault()
    if (canRedo()) {
      redo()
      ElMessage.info('已重做')
    }
    return
  }

  // 复制节点
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
    if (selectedNode.value) {
      copiedNode.value = JSON.parse(JSON.stringify(selectedNode.value))
      ElMessage.success('已复制节点')
    }
    return
  }

  // 粘贴节点
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
    if (copiedNode.value) {
      pushHistory()
      const newNode: Node = {
        ...JSON.parse(JSON.stringify(copiedNode.value)),
        id: `node_${Date.now()}`,
        position: {
          x: copiedNode.value.position.x + 30,
          y: copiedNode.value.position.y + 30
        }
      }
      addNodes([newNode])
      selectedNode.value = newNode
      ElMessage.success('已粘贴节点')
    }
    return
  }

  // 删除选中节点或连线
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedEdge.value) {
      e.preventDefault()
      handleDeleteEdge(selectedEdge.value.id)
    } else if (selectedNode.value) {
      e.preventDefault()
      onNodeDelete(selectedNode.value.id)
    }
  }
}

// ─── 一键整理对齐布局 ─────────────────────────────────────────
const autoLayout = () => {
  if (nodes.value.length === 0) return
  pushHistory()

  const nodeMap = new Map(nodes.value.map((n) => [n.id, n]))
  const startNodes = nodes.value.filter(
    (n) => n.type === 'start' || !edges.value.some((e) => e.target === n.id)
  )

  const levels = new Map<string, number>()
  const queue = startNodes.map((n) => ({ id: n.id, level: 0 }))

  while (queue.length > 0) {
    const curr = queue.shift()!
    if (levels.has(curr.id) && levels.get(curr.id)! >= curr.level) continue
    levels.set(curr.id, curr.level)
    const outgoing = edges.value.filter((e) => e.source === curr.id)
    for (const edge of outgoing) {
      queue.push({ id: edge.target, level: curr.level + 1 })
    }
  }

  const levelGroups: Record<number, string[]> = {}
  nodes.value.forEach((n) => {
    const lvl = levels.get(n.id) || 0;
    if (!levelGroups[lvl]) levelGroups[lvl] = []
    levelGroups[lvl].push(n.id)
  })

  Object.entries(levelGroups).forEach(([lvlStr, nodeIds]) => {
    const lvl = Number(lvlStr)
    const y = 80 + lvl * 140
    const totalWidth = nodeIds.length * 200
    const startX = 200 - totalWidth / 2

    nodeIds.forEach((id, idx) => {
      const node = nodeMap.get(id)
      if (node) {
        node.position = { x: startX + idx * 200, y }
      }
    })
  })
  ElMessage.success('画布已一键整理对齐')
}

// ─── 导出 / 导入 JSON ────────────────────────────────────────
const exportJson = () => {
  const data = JSON.stringify(
    {
      name: workflow.value?.name,
      canvas: {
        nodes: nodes.value,
        edges: edges.value,
        viewport: getViewport()
      }
    },
    null,
    2
  )
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workflow_${workflowId.value}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('已导出 JSON 文件')
}

const fileInputRef = ref<HTMLInputElement | null>(null)
const triggerImportJson = () => {
  fileInputRef.value?.click()
}

const handleImportJson = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target?.result as string)
      if (json.canvas) {
        pushHistory()
        setNodes(json.canvas.nodes || [])
        setEdges(json.canvas.edges || [])
        if (json.canvas.viewport) setViewport(json.canvas.viewport)
        ElMessage.success('导入 JSON 成功')
      }
    } catch {
      ElMessage.error('JSON 解析失败，请检查文件格式')
    }
  }
  reader.readAsText(file)
}

// ─── 清空画布 ────────────────────────────────────────────────
const clearCanvas = async () => {
  await ElMessageBox.confirm('确定要清空画布中的所有节点和连线吗？', '提示', {
    confirmButtonText: '清空',
    cancelButtonText: '取消',
    type: 'warning'
  })
  pushHistory()
  setNodes([])
  setEdges([])
  selectedNode.value = null
  selectedEdge.value = null
  ElMessage.success('已清空画布')
}

// ─── 连线删除 ─────────────────────────────────────────────────
const handleDeleteEdge = (edgeId: string) => {
  pushHistory()
  removeEdges([edgeId])
  selectedEdge.value = null
  ElMessage.success('连线已删除')
}

// ─── 加载工作流与注册键盘事件 ──────────────────────────────
onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  try {
    const res: any = await getWorkflowDetailApi(workflowId.value)
    workflow.value = res
    if (res.canvas) {
      setNodes(res.canvas.nodes || [])
      setEdges(res.canvas.edges || [])
      if (res.canvas.viewport) {
        setViewport(res.canvas.viewport)
      }
    }
    setTimeout(() => smartSaveNow(), 100)
  } catch (e) {
    ElMessage.error('工作流加载失败')
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  cancelSave()
})

// ─── 自动保存 ─────────────────────────────────────────────────
watch(nodes, triggerSave, { deep: true })
watch(edges, triggerSave, { deep: true })

// ─── 节点连接 ─────────────────────────────────────────────────
onConnect((params: Connection) => {
  pushHistory()
  addEdges([{
    id: `e-${params.source}-${params.target}-${Date.now()}`,
    source: params.source,
    target: params.target,
    sourceHandle: params.sourceHandle,
    targetHandle: params.targetHandle,
    type: edgeType.value,
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 2 }
  }])
})

// ─── 节点点击（选中→配置面板）────────────────────────────────
const onNodeClick = ({ node }: NodeMouseEvent) => {
  selectedNode.value = node
  selectedEdge.value = null
}

// ─── 连线点击（选中→可删除）─────────────────────────────────
const onEdgeClick = ({ edge }: EdgeMouseEvent) => {
  selectedEdge.value = edge
  selectedNode.value = null
}

const onPaneClick = () => {
  selectedNode.value = null
  selectedEdge.value = null
}

// ─── 节点配置更新 ─────────────────────────────────────────────
const onNodeUpdate = (updated: Node) => {
  updateNodeData(updated.id, { ...updated.data })
  const node = findNode(updated.id)
  if (node) selectedNode.value = { ...node }
}

// ─── 节点删除 ─────────────────────────────────────────────────
const onNodeDelete = (nodeId: string) => {
  pushHistory()
  removeNodes([nodeId])
  selectedNode.value = null
}

// ─── 标题编辑 ─────────────────────────────────────────────────
const editingTitle = ref(false)
const popoverVisible = ref(false)
const titleInput = ref('')

const startEditTitle = () => {
  titleInput.value = workflow.value?.name || ''
  editingTitle.value = true
  popoverVisible.value = true
}

const saveTitle = async () => {
  if (!titleInput.value.trim()) return
  editingTitle.value = false
  popoverVisible.value = false
  workflow.value.name = titleInput.value.trim()
  await updateWorkflowApi({ id: workflowId.value, name: workflow.value.name })
}

const cancelEditTitle = () => {
  popoverVisible.value = false
  editingTitle.value = false
}

const statusText = computed(() => {
  if (saveStatus.value === 'saving') return '保存中...'
  if (saveStatus.value === 'unsaved') return '未保存'
  return '已保存'
})
</script>

<template>
  <div class="workflow-editor" v-loading="loading">
    <!-- 顶部工具栏 -->
    <div class="wf-editor-toolbar">
      <div class="wf-editor-toolbar__left">
        <el-button text @click="router.push('/workflow')" class="wf-back-btn">
          <el-icon><ArrowLeft /></el-icon>
          工作流
        </el-button>
        <div class="wf-divider" />
        <!-- 可编辑标题 -->
        <div class="wf-title-wrap">
          <el-popover
            v-model:visible="popoverVisible"
            placement="bottom-start"
            :width="240"
            :show-arrow="false"
            trigger="manual"
          >
            <template #reference>
              <span class="wf-title" @click="startEditTitle">
                <span class="wf-title__text">{{ workflow?.name || '...' }}</span>
                <el-icon class="wf-title__icon"><EditPen /></el-icon>
              </span>
            </template>
            <div class="wf-title-edit">
              <el-input
                v-model="titleInput"
                type="textarea"
                :rows="3"
                placeholder="工作流名称"
              />
              <div class="wf-title-edit__actions">
                <el-button size="small" text @click="cancelEditTitle">取消</el-button>
                <el-button size="small" type="primary" @click="saveTitle">确定</el-button>
              </div>
            </div>
          </el-popover>
        </div>
      </div>

      <div class="wf-editor-toolbar__right">
        <!-- 连线类型 -->
        <el-select v-model="edgeType" size="small" style="width: 72px" placeholder="连线">
          <el-option label="折线" value="smoothstep" />
          <el-option label="曲线" value="default" />
          <el-option label="直线" value="straight" />
        </el-select>

        <!-- 撤销/重做 -->
        <el-button size="small" :disabled="!canUndo()" @click="undo" title="撤销 (Ctrl+Z)">撤销</el-button>
        <el-button size="small" :disabled="!canRedo()" @click="redo" title="重做 (Ctrl+Shift+Z)">重做</el-button>

        <!-- 整理与工具按纽 -->
        <el-button size="small" @click="autoLayout">对齐</el-button>
        <el-button size="small" type="primary" plain @click="nodePickerVisible = true">功能节点</el-button>
        <el-button size="small" @click="triggerDialogVisible = true">设置</el-button>
        <el-button size="small" type="success" :loading="runningWorkflow" @click="handleRunWorkflow">运行</el-button>
        <el-button size="small" @click="exportJson">导出</el-button>
        <el-button size="small" @click="triggerImportJson">导入</el-button>
        <input ref="fileInputRef" type="file" accept=".json" style="display: none" @change="handleImportJson" />
        <el-button size="small" type="danger" text @click="clearCanvas">清空</el-button>

        <div class="wf-divider" />

        <!-- 保存按钮（状态内置，固定宽度） -->
        <el-button
          size="small"
          :class="['wf-save-btn', `wf-save-btn--${saveStatus}`]"
          :loading="saveStatus === 'saving'"
          @click="smartSaveNow"
        >
          {{ statusText }}
        </el-button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="wf-editor-body">
      <!-- 左侧基础节点面板 -->
      <NodePanel @openNodePicker="handleOpenNodePicker" />

      <!-- 画布区 -->
      <div
        ref="canvasRef"
        class="wf-canvas"
        @drop="onDrop"
        @dragover="onDragOver"
      >
        <VueFlow
          :node-types="nodeTypes"
          fit-view-on-init
          :min-zoom="0.1"
          :max-zoom="4"
          :default-edge-options="{ animated: false, style: { stroke: '#94a3b8', strokeWidth: 2 } }"
          @node-click="onNodeClick"
          @edge-click="onEdgeClick"
          @pane-click="onPaneClick"
        >
          <Background :pattern-color="patternColor" :gap="20" />
          <Controls />
          <MiniMap class="wf-minimap" />
        </VueFlow>
      </div>

      <!-- 右侧配置面板 -->
      <ConfigPanel
        :node="selectedNode"
        :workflow-id="workflowId"
        @update="onNodeUpdate"
        @delete="onNodeDelete"
      />
    </div>

    <!-- 触发器与设置对话框 -->
    <TriggerConfigDialog v-model="triggerDialogVisible" :workflow-id="workflowId" />


    <!-- 功能节点选择弹窗 -->
    <NodePickerDialog
      v-model="nodePickerVisible"
      @select="handleAddNodeFromLibrary"
    />
  </div>
</template>

<style>
@import url('@vue-flow/core/dist/style.css');
@import url('@vue-flow/core/dist/theme-default.css');
@import url('@vue-flow/controls/dist/style.css');
@import url('@vue-flow/minimap/dist/style.css');
</style>

<style scoped lang="scss">
.workflow-editor {
  display: flex;
  height: calc(100vh - var(--top-tool-height) - var(--tags-view-height));
  margin: calc(0px - var(--app-content-padding));
  overflow: hidden;
  background: var(--app-content-bg-color);
  flex-direction: column;
}

.wf-editor-toolbar {
  display: flex;
  height: 36px;
  padding: 0 12px;
  background: var(--app-content-surface-color);
  border-bottom: 1px solid var(--app-content-border-color);
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 8px;
}

.wf-editor-toolbar__left,
.wf-editor-toolbar__right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.wf-editor-toolbar__right {
  :deep(.el-button--small) {
    height: 24px;
    padding: 2px 7px;
    font-size: 11px;
    border-radius: 4px;
  }

  :deep(.el-select--small) {
    .el-select__wrapper {
      height: 24px;
      min-height: 24px;
      padding: 0 6px;
      font-size: 11px;
      border-radius: 4px;
    }
  }
}

.wf-back-btn {
  height: 24px;
  padding: 2px 4px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.wf-divider {
  width: 1px;
  height: 12px;
  margin: 0 2px;
  background: var(--app-content-border-color);
}

.wf-title-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.wf-title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.15s ease;
  max-width: 320px;

  &:hover {
    background: var(--app-content-surface-muted-color);
  }

  &__text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    min-width: 0;
  }

  &__icon {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    flex-shrink: 0;
  }
}

.wf-title-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wf-title-edit__actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;

  :deep(.el-button) {
    height: 20px;
    padding: 0 8px;
    font-size: 11px;
    border-radius: 3px;
  }
}



.wf-save-btn {
  display: inline-flex !important;
  min-width: 100px !important;
  text-align: center !important;
  transition: all 0.25s ease;
  align-items: center !important;
  justify-content: center !important;

  &--saved {
    color: var(--el-color-success) !important;
    background-color: color-mix(in srgb, var(--el-color-success) 10%, transparent) !important;
    border-color: color-mix(in srgb, var(--el-color-success) 30%, transparent) !important;
  }

  &--saving {
    color: var(--el-color-primary) !important;
    background-color: color-mix(in srgb, var(--el-color-primary) 10%, transparent) !important;
    border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent) !important;
  }

  &--unsaved {
    color: var(--el-color-warning) !important;
    background-color: color-mix(in srgb, var(--el-color-warning) 10%, transparent) !important;
    border-color: color-mix(in srgb, var(--el-color-warning) 30%, transparent) !important;
  }
}

.wf-editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.wf-canvas {
  position: relative;
  height: 100%;
  background: var(--app-content-bg-color);
  flex: 1;
}

/* VueFlow 控件适配深色/浅色模式 */
:deep(.vue-flow__controls) {
  overflow: hidden;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-radius: 8px;
  box-shadow: var(--app-content-shadow);
}

:deep(.vue-flow__controls-button) {
  color: var(--el-text-color-primary);
  background: var(--app-content-surface-color);
  border-bottom: 1px solid var(--app-content-border-color);
  fill: var(--el-text-color-primary);

  &:hover {
    background: var(--app-content-surface-muted-color);
  }
}

:deep(.vue-flow__edge-path) {
  stroke: var(--el-border-color-darker, #94a3b8);
}

:deep(.wf-minimap) {
  overflow: hidden;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-radius: 8px;
}
</style>
