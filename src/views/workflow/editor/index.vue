<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, EditPen, Loading, Check, Warning } from '@element-plus/icons-vue'
import {
  VueFlow,
  useVueFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeMouseEvent
} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { getWorkflowDetailApi, updateWorkflowApi } from '@/api/workflow'

// 自定义节点
import StartNode from '@/components/workflow/nodes/StartNode.vue'
import DefaultNode from '@/components/workflow/nodes/DefaultNode.vue'
import EndNode from '@/components/workflow/nodes/EndNode.vue'
import NodePanel from '@/components/workflow/NodePanel.vue'
import ConfigPanel from '@/components/workflow/ConfigPanel.vue'

const route = useRoute()
const router = useRouter()
const workflowId = computed(() => route.params.id as string)

// VueFlow 实例
const {
  nodes,
  edges,
  addNodes,
  addEdges,
  removeNodes,
  setNodes,
  setEdges,
  setViewport,
  getViewport,
  onConnect,
  project,
  findNode
} = useVueFlow()

// 状态
const workflow = ref<any>(null)
const loading = ref(true)
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
const selectedNode = ref<Node | null>(null)
const canvasRef = ref<HTMLDivElement | null>(null)

// 自定义节点类型映射
const nodeTypes = {
  start: StartNode,
  default: DefaultNode,
  end: EndNode
}

// ─── 加载工作流 ───────────────────────────────────────────────
onMounted(async () => {
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
  } catch (e) {
    ElMessage.error('工作流加载失败')
  } finally {
    loading.value = false
  }
})

// ─── 自动保存：debounce 2s ────────────────────────────────────
let saveTimer: ReturnType<typeof setTimeout> | null = null

const triggerAutoSave = () => {
  saveStatus.value = 'unsaved'
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(saveCanvas, 2000)
}

const saveCanvas = async () => {
  if (!workflowId.value) return
  saveStatus.value = 'saving'
  try {
    await updateWorkflowApi({
      id: workflowId.value,
      canvas: {
        nodes: nodes.value,
        edges: edges.value,
        viewport: getViewport()
      }
    })
    saveStatus.value = 'saved'
  } catch {
    saveStatus.value = 'unsaved'
    ElMessage.error('保存失败，请检查网络')
  }
}

// 监听 nodes/edges 变化触发保存
watch(nodes, triggerAutoSave, { deep: true })
watch(edges, triggerAutoSave, { deep: true })

// ─── 节点连接 ─────────────────────────────────────────────────
onConnect((params: Connection) => {
  addEdges([{
    id: `e-${params.source}-${params.target}-${Date.now()}`,
    source: params.source,
    target: params.target,
    animated: false,
    style: { stroke: '#6b7280', strokeWidth: 2 }
  }])
})

// ─── 节点点击（选中→配置面板）────────────────────────────────
const onNodeClick = ({ node }: NodeMouseEvent) => {
  selectedNode.value = node
}

const onPaneClick = () => {
  selectedNode.value = null
}

// ─── 拖拽放置节点 ─────────────────────────────────────────────
const onDrop = (event: DragEvent) => {
  event.preventDefault()
  const type = event.dataTransfer?.getData('application/vueflow-node-type')
  const label = event.dataTransfer?.getData('application/vueflow-node-label')
  if (!type || !canvasRef.value) return

  const bounds = canvasRef.value.getBoundingClientRect()
  const position = project({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top
  })

  addNodes([{
    id: `node_${Date.now()}`,
    type,
    position,
    data: { label: label || type, config: {} }
  }])
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}

// ─── 节点配置更新 ─────────────────────────────────────────────
const onNodeUpdate = (updated: Node) => {
  const node = findNode(updated.id)
  if (node) node.data = { ...updated.data }
  selectedNode.value = { ...updated }
}

// ─── 节点删除 ─────────────────────────────────────────────────
const onNodeDelete = (nodeId: string) => {
  removeNodes([nodeId])
  selectedNode.value = null
}

// ─── 标题编辑 ─────────────────────────────────────────────────
const editingTitle = ref(false)
const titleInput = ref('')

const startEditTitle = () => {
  titleInput.value = workflow.value?.name || ''
  editingTitle.value = true
}

const saveTitle = async () => {
  if (!titleInput.value.trim()) return
  editingTitle.value = false
  workflow.value.name = titleInput.value.trim()
  await updateWorkflowApi({ id: workflowId.value, name: workflow.value.name })
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
          <template v-if="editingTitle">
            <el-input
              v-model="titleInput"
              size="small"
              style="width: 220px"
              autofocus
              @blur="saveTitle"
              @keyup.enter="saveTitle"
            />
          </template>
          <template v-else>
            <span class="wf-title" @click="startEditTitle">{{ workflow?.name || '...' }}</span>
            <el-icon class="wf-title-edit-icon" @click="startEditTitle"><EditPen /></el-icon>
          </template>
        </div>
      </div>

      <div class="wf-editor-toolbar__right">
        <!-- 保存状态 -->
        <span :class="['wf-save-status', `wf-save-status--${saveStatus}`]">
          <el-icon v-if="saveStatus === 'saving'"><Loading /></el-icon>
          <el-icon v-else-if="saveStatus === 'saved'"><Check /></el-icon>
          <el-icon v-else><Warning /></el-icon>
          {{ statusText }}
        </span>
        <el-button size="small" type="primary" @click="saveCanvas">立即保存</el-button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="wf-editor-body">
      <!-- 左侧节点面板 -->
      <NodePanel />

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
          :default-edge-options="{ animated: false, style: { stroke: '#6b7280', strokeWidth: 2 } }"
          @node-click="onNodeClick"
          @pane-click="onPaneClick"
        >
          <Background pattern-color="#d1d5db" :gap="20" />
          <Controls />
        </VueFlow>
      </div>

      <!-- 右侧配置面板 -->
      <ConfigPanel
        :node="selectedNode"
        @update="onNodeUpdate"
        @delete="onNodeDelete"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';

.workflow-editor {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--top-tool-height) - var(--tags-view-height));
  background: var(--app-content-bg-color);
  overflow: hidden;
}

.wf-editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  background: var(--app-content-surface-color);
  border-bottom: 1px solid var(--app-content-border-color);
  flex-shrink: 0;
  gap: 12px;
}

.wf-editor-toolbar__left,
.wf-editor-toolbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wf-back-btn {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.wf-divider {
  width: 1px;
  height: 20px;
  background: var(--app-content-border-color);
}

.wf-title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.wf-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  &:hover { background: var(--app-content-border-color); }
}

.wf-title-edit-icon {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  &:hover { color: var(--el-color-primary); }
}

.wf-save-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;

  &--saved { color: var(--el-color-success); }
  &--saving { color: var(--el-text-color-secondary); }
  &--unsaved { color: var(--el-color-warning); }
}

.wf-editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.wf-canvas {
  flex: 1;
  height: 100%;
  background: #f8fafc;
  position: relative;
}
</style>
