<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { ArrowLeft, EditPen, Reading } from '@element-plus/icons-vue'
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
import { useI18n } from 'vue-i18n'
import { getWorkflowDetailApi, updateWorkflowApi, runWorkflowApi } from '@/api/workflow'
import { useWorkflowHistory } from '@/composables/useWorkflowHistory'
import { useSmartSave } from '@/composables/useSmartSave'

// 自定义节点
import StartNode from '@/components/workflow/nodes/StartNode.vue'
import WebhookTriggerNode from '@/components/workflow/nodes/WebhookTriggerNode.vue'
import DefaultNode from '@/components/workflow/nodes/DefaultNode.vue'
import EndNode from '@/components/workflow/nodes/EndNode.vue'
import ConditionNode from '@/components/workflow/nodes/ConditionNode.vue'
import SwitchNode from '@/components/workflow/nodes/SwitchNode.vue'
import LoopNode from '@/components/workflow/nodes/LoopNode.vue'
import WhileNode from '@/components/workflow/nodes/WhileNode.vue'
import JsCodeNode from '@/components/workflow/nodes/JsCodeNode.vue'
import AiCallNode from '@/components/workflow/nodes/AiCallNode.vue'
import LLMNode from '@/components/workflow/nodes/LLMNode.vue'
import HttpNode from '@/components/workflow/nodes/HttpNode.vue'
import CodeNode from '@/components/workflow/nodes/CodeNode.vue'
import MessagePushNode from '@/components/workflow/nodes/MessagePushNode.vue'
import HotsearchNode from '@/components/workflow/nodes/HotsearchNode.vue'
import FeishuNode from '@/components/workflow/nodes/FeishuNode.vue'
import WecomNode from '@/components/workflow/nodes/WecomNode.vue'
import GoogleArtsCultureNode from '@/components/workflow/nodes/GoogleArtsCultureNode.vue'
import PinterestNode from '@/components/workflow/nodes/PinterestNode.vue'
import WikimediaNode from '@/components/workflow/nodes/WikimediaNode.vue'
import PexelsNode from '@/components/workflow/nodes/PexelsNode.vue'
import PixabayNode from '@/components/workflow/nodes/PixabayNode.vue'
import RawpixelNode from '@/components/workflow/nodes/RawpixelNode.vue'
import StockSnapNode from '@/components/workflow/nodes/StockSnapNode.vue'
import OpenverseNode from '@/components/workflow/nodes/OpenverseNode.vue'
import OpenClipartNode from '@/components/workflow/nodes/OpenClipartNode.vue'
import UndrawNode from '@/components/workflow/nodes/UndrawNode.vue'
import IconifyNode from '@/components/workflow/nodes/IconifyNode.vue'
import NounProjectNode from '@/components/workflow/nodes/NounProjectNode.vue'
import VecteezyNode from '@/components/workflow/nodes/VecteezyNode.vue'
import OpenmeteoNode from '@/components/workflow/nodes/OpenmeteoNode.vue'
import WttrNode from '@/components/workflow/nodes/WttrNode.vue'
import CoingeckoNode from '@/components/workflow/nodes/CoingeckoNode.vue'
import FrankfurterNode from '@/components/workflow/nodes/FrankfurterNode.vue'
import DictionaryNode from '@/components/workflow/nodes/DictionaryNode.vue'
import JokeNode from '@/components/workflow/nodes/JokeNode.vue'
import IpifyNode from '@/components/workflow/nodes/IpifyNode.vue'
import SunrisesunsetNode from '@/components/workflow/nodes/SunrisesunsetNode.vue'
import TimeapiNode from '@/components/workflow/nodes/TimeapiNode.vue'
import ZippopotamNode from '@/components/workflow/nodes/ZippopotamNode.vue'
import CountryisNode from '@/components/workflow/nodes/CountryisNode.vue'
import ErapiNode from '@/components/workflow/nodes/ErapiNode.vue'
import FawazahmedNode from '@/components/workflow/nodes/FawazahmedNode.vue'
import ColorapiNode from '@/components/workflow/nodes/ColorapiNode.vue'
import ShopifyNode from '@/components/workflow/nodes/ShopifyNode.vue'
import OpenMojiNode from '@/components/workflow/nodes/OpenMojiNode.vue'
import GoogleIconsNode from '@/components/workflow/nodes/GoogleIconsNode.vue'
import EmojipediaNode from '@/components/workflow/nodes/EmojipediaNode.vue'
import HackernewsNode from '@/components/workflow/nodes/HackernewsNode.vue'
import ArxivNode from '@/components/workflow/nodes/ArxivNode.vue'
import GithubNode from '@/components/workflow/nodes/GithubNode.vue'
import GdeltNode from '@/components/workflow/nodes/GdeltNode.vue'
import GooglenewsNode from '@/components/workflow/nodes/GooglenewsNode.vue'
import RedditNode from '@/components/workflow/nodes/RedditNode.vue'
import ProducthuntNode from '@/components/workflow/nodes/ProducthuntNode.vue'
import TheguardianNode from '@/components/workflow/nodes/TheguardianNode.vue'
import BbcnewsNode from '@/components/workflow/nodes/BbcnewsNode.vue'
import NprNode from '@/components/workflow/nodes/NprNode.vue'
import TechcrunchNode from '@/components/workflow/nodes/TechcrunchNode.vue'
import ThevergeNode from '@/components/workflow/nodes/ThevergeNode.vue'
import ArstechnicaNode from '@/components/workflow/nodes/ArstechnicaNode.vue'
import MittechreviewNode from '@/components/workflow/nodes/MittechreviewNode.vue'
import ReutersNode from '@/components/workflow/nodes/ReutersNode.vue'
import ChinadailyNode from '@/components/workflow/nodes/ChinadailyNode.vue'
import GovcnNode from '@/components/workflow/nodes/GovcnNode.vue'
import XinhuanetNode from '@/components/workflow/nodes/XinhuanetNode.vue'
import ThepaperNode from '@/components/workflow/nodes/ThepaperNode.vue'
import ThirtySixKrNewsNode from '@/components/workflow/nodes/ThirtySixKrNewsNode.vue'
import HuxiuNode from '@/components/workflow/nodes/HuxiuNode.vue'
import SvgrepoNode from '@/components/workflow/nodes/SvgrepoNode.vue'
import KaboompicsNode from '@/components/workflow/nodes/KaboompicsNode.vue'


import NodePanel from '@/components/workflow/NodePanel.vue'
import ConfigPanel from '@/components/workflow/ConfigPanel.vue'
import NodePickerDialog from '@/components/workflow/NodePickerDialog.vue'
import TriggerConfigDialog from '@/components/workflow/TriggerConfigDialog.vue'
import ShortcutGuide from '@/components/workflow/ShortcutGuide.vue'
import { useWorkflowAiContext } from '@/composables/useWorkflowAiContext'
import { websocketClient } from '@/services/websocketClient'
import AssistantChat from '@/components/AiAssistant/AssistantChat.vue'
import { useAiAssistantStore } from '@/store/modules/aiAssistant'
import type { NodeManifest } from './config/node-manifest'

const appStore = useAppStore()
const { t } = useI18n()
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
  onEdgeUpdate,
  project,
  findNode,
  updateNodeData,
  updateEdge
} = useVueFlow()

// 状态
const workflow = ref<any>(null)
const loading = ref(true)
const selectedNode = ref<Node | null>(null)
const selectedEdge = ref<Edge | null>(null)
const canvasRef = ref<HTMLDivElement | null>(null)

const triggerDialogVisible = ref(false)
const shortcutGuideVisible = ref(false)
const nodePickerVisible = ref(false)

const handleOpenNodePicker = () => {
  nodePickerVisible.value = true
}

const runningWorkflow = ref(false)
const { setWorkflowContext } = useWorkflowAiContext()
const aiStore = useAiAssistantStore()
const aiPanelVisible = ref(true)

const handleToggleAiPanel = async () => {
  // 只有在没有当前会话时才创建新会话
  if (!aiPanelVisible.value && !aiStore.currentConversationId) {
    await aiStore.createConversation()
  }
  aiPanelVisible.value = !aiPanelVisible.value
}

// 同步工作流上下文给 AI 助手
watch(
  () => ({
    workflowId: workflowId.value,
    name: workflow.value?.name,
    nodes: nodes.value,
    edges: edges.value,
  }),
  (val) => {
    if (val.workflowId) {
      setWorkflowContext({
        workflowId: val.workflowId,
        workflowName: val.name,
        canvas: { nodes: val.nodes, edges: val.edges },
      })
    }
  },
  { deep: true }
)
const handleRunWorkflow = async () => {
  if (!workflowId.value) return
  runningWorkflow.value = true
  try {
    const res: any = await runWorkflowApi(workflowId.value)
    ElNotification({
      title: t('workflow.triggerSuccess'),
      message: `${t('workflow.runRecordId', { id: res?.executionId || 'OK', duration: res?.durationMs || 0 })}`,
      type: 'success',
      duration: 3000,
    })
  } catch (err: any) {
    ElMessage.error(err.message || t('workflow.triggerFailed'))
  } finally {
    runningWorkflow.value = false
  }
}

// 连线类型与配置
const edgeType = ref<'default' | 'smoothstep' | 'straight'>('default')

// 自定义节点类型映射 (使用 markRaw 避免 Vue 响应式代理警告)
const nodeTypes = {
  start: markRaw(StartNode),
  webhook_trigger: markRaw(WebhookTriggerNode),
  default: markRaw(DefaultNode),
  end: markRaw(EndNode),
  condition: markRaw(ConditionNode),
  switch: markRaw(SwitchNode),
  loop: markRaw(LoopNode),
  while_loop: markRaw(WhileNode),
  js_code: markRaw(JsCodeNode),
  ai_call: markRaw(AiCallNode),
  llm: markRaw(LLMNode),
  http: markRaw(HttpNode),
  code: markRaw(CodeNode),
  message_push: markRaw(MessagePushNode),
  // 所有国内热搜平台使用通用 HotsearchNode
  hotsearch_weibo: markRaw(HotsearchNode),
  hotsearch_douyin: markRaw(HotsearchNode),
  hotsearch_bilibili: markRaw(HotsearchNode),
  hotsearch_zhihu: markRaw(HotsearchNode),
  hotsearch_toutiao: markRaw(HotsearchNode),
  hotsearch_douban: markRaw(HotsearchNode),
  hotsearch_kuaishou: markRaw(HotsearchNode),
  hotsearch_v2ex: markRaw(HotsearchNode),
  hotsearch_36kr: markRaw(HotsearchNode),
  hotsearch_ithome: markRaw(HotsearchNode),
  message_push_feishu: markRaw(FeishuNode),
  message_push_wecom: markRaw(WecomNode),
  google_arts_culture: markRaw(GoogleArtsCultureNode),
  pinterest_culture: markRaw(PinterestNode),
  wikimedia_culture: markRaw(WikimediaNode),
  pexels_search: markRaw(PexelsNode),
  pixabay_search: markRaw(PixabayNode),
  rawpixel_search: markRaw(RawpixelNode),
  stocksnap_search: markRaw(StockSnapNode),
  openverse_search: markRaw(OpenverseNode),
  openclipart_search: markRaw(OpenClipartNode),
  undraw_search: markRaw(UndrawNode),
  iconify_search: markRaw(IconifyNode),
  nounproject_search: markRaw(NounProjectNode),
  vecteezy_search: markRaw(VecteezyNode),
  openmeteo_search: markRaw(OpenmeteoNode),
  wttr_search: markRaw(WttrNode),
  coingecko_search: markRaw(CoingeckoNode),
  frankfurter_search: markRaw(FrankfurterNode),
  dictionary_search: markRaw(DictionaryNode),
  joke_search: markRaw(JokeNode),
  ipify_search: markRaw(IpifyNode),
  sunrisesunset_search: markRaw(SunrisesunsetNode),
  timeapi_search: markRaw(TimeapiNode),
  zippopotam_search: markRaw(ZippopotamNode),
  countryis_search: markRaw(CountryisNode),
  erapi_search: markRaw(ErapiNode),
  fawazahmed_search: markRaw(FawazahmedNode),
  colorapi_search: markRaw(ColorapiNode),
  shopify_search: markRaw(ShopifyNode),
  openmoji_search: markRaw(OpenMojiNode),
  googleicons_search: markRaw(GoogleIconsNode),
  emojipedia_search: markRaw(EmojipediaNode),
  hackernews_search: markRaw(HackernewsNode),
  arxiv_search: markRaw(ArxivNode),
  github_search: markRaw(GithubNode),
  gdelt_search: markRaw(GdeltNode),
  googlenews_search: markRaw(GooglenewsNode),
  reddit_search: markRaw(RedditNode),
  producthunt_search: markRaw(ProducthuntNode),
  theguardian_search: markRaw(TheguardianNode),
  bbcnews_search: markRaw(BbcnewsNode),
  npr_search: markRaw(NprNode),
  techcrunch_search: markRaw(TechcrunchNode),
  theverge_search: markRaw(ThevergeNode),
  arstechnica_search: markRaw(ArstechnicaNode),
  mittechreview_search: markRaw(MittechreviewNode),
  reuters_search: markRaw(ReutersNode),
  chinadaily_search: markRaw(ChinadailyNode),
  govcn_search: markRaw(GovcnNode),
  xinhuanet_search: markRaw(XinhuanetNode),
  thepaper_search: markRaw(ThepaperNode),
  '36kr_search': markRaw(ThirtySixKrNewsNode),
  huxiu_search: markRaw(HuxiuNode),
  svgrepo_search: markRaw(SvgrepoNode),
  kaboompics_search: markRaw(KaboompicsNode),

}

// ─── 撤销/重做历史 ─────────────────────────────────────────────
const {
  undo,
  redo,
  pushHistory,
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
const handleAddNodeFromLibrary = (capability: NodeManifest) => {
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

  // 热搜平台节点：从类型中提取 platform 字段传递给 UI 组件
  const isHotsearch = capability.type.startsWith('hotsearch_')
  const platformKey = isHotsearch ? capability.type.replace('hotsearch_', '') : undefined

  const newNode: Node = {
    id: `${capability.type}_${Date.now().toString(36)}`,
    type: mappedType,
    position: centerPos,
    data: {
      label: capability.name,
      capabilityType: capability.type,
      config: { ...(capability.defaultData || {}) },
      ...(isHotsearch ? { platform: platformKey } : {})
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

  // 热搜平台节点：从类型中提取 platform 字段
  const isHotsearchDrop = type.startsWith('hotsearch_')
  const platformKeyDrop = isHotsearchDrop ? type.replace('hotsearch_', '') : undefined

  pushHistory()
  const newNode: Node = {
    id: `${type}_${Date.now().toString(36)}`,
    type: mappedType,
    position,
    data: {
      label: label || type,
      capabilityType: type,
      config: { ...defaultData },
      ...(isHotsearchDrop ? { platform: platformKeyDrop } : {})
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
      ElMessage.info(t('common.undone'))
    }
    return
  }

  // 重做 Ctrl+Shift+Z 或 Ctrl+Y
  if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
    e.preventDefault()
    if (canRedo()) {
      redo()
      ElMessage.info(t('common.redone'))
    }
    return
  }

  // 复制节点
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
    if (selectedNode.value) {
      copiedNode.value = JSON.parse(JSON.stringify(selectedNode.value))
      ElMessage.success(t('workflow.nodeCopied'))
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
      ElMessage.success(t('workflow.nodePasted'))
    }
    return
  }

  // 快捷键帮助
  if (e.key === '?' || (e.shiftKey && e.key === '/')) {
    e.preventDefault()
    shortcutGuideVisible.value = true
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
  ElMessage.success(t('workflow.canvasAligned'))
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
  ElMessage.success(t('workflow.jsonExported'))
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
        ElMessage.success(t('workflow.jsonImported'))
      }
    } catch {
      ElMessage.error(t('workflow.jsonParseError'))
    }
  }
  reader.readAsText(file)
}

// ─── 清空画布 ────────────────────────────────────────────────
const clearCanvas = async () => {
  await ElMessageBox.confirm(t('workflow.clearCanvasConfirm'), t('common.tip'), {
    confirmButtonText: t('common.clear'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  })
  pushHistory()
  setNodes([])
  setEdges([])
  selectedNode.value = null
  selectedEdge.value = null
  ElMessage.success(t('workflow.canvasCleared'))
}

// ─── 连线删除 ─────────────────────────────────────────────────
const handleDeleteEdge = (edgeId: string) => {
  pushHistory()
  removeEdges([edgeId])
  selectedEdge.value = null
  ElMessage.success(t('workflow.edgeDeleted'))
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
    ElMessage.error(t('workflow.loadFailed'))
  } finally {
    loading.value = false
  }

  // 监听工作流实时变更（AI 操作同步）
  websocketClient.events.on('workflow:updated', handleWorkflowUpdate)
})

// 处理工作流实时更新
const handleWorkflowUpdate = (data: { workflowId: string; name: string; canvas: any }) => {
  if (data.workflowId !== workflowId.value) return
  // 更新画布
  if (data.canvas) {
    setNodes(data.canvas.nodes || [])
    setEdges(data.canvas.edges || [])
    if (data.canvas.viewport) {
      setViewport(data.canvas.viewport)
    }
  }
  // 更新工作流信息
  if (data.name && workflow.value) {
    workflow.value.name = data.name
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  cancelSave()
  // 移除工作流更新监听
  websocketClient.events.off('workflow:updated', handleWorkflowUpdate)
})

// ─── 自动保存 ─────────────────────────────────────────────────
watch(nodes, triggerSave, { deep: true })
watch(edges, triggerSave, { deep: true })

// ─── 连线类型切换：同步更新已有连线 ─────────────────────────
watch(edgeType, (newType) => {
  const currentEdges = edges.value
  if (currentEdges.length === 0) return
  setEdges(
    currentEdges.map((e) => ({
      ...e,
      type: newType,
    }))
  )
})


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

// ─── 连线更新（重新连接）────────────────────────────────────
onEdgeUpdate(({ edge, connection }) => {
  pushHistory()
  updateEdge(edge, {
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
  })
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
  if (saveStatus.value === 'saving') return t('workflow.saving')
  if (saveStatus.value === 'unsaved') return t('workflow.unsaved')
  return t('workflow.saved')
})
</script>

<template>
  <div class="workflow-editor" v-loading="loading">
    <!-- 顶部工具栏 -->
    <div class="wf-editor-toolbar">
      <div class="wf-editor-toolbar__left">
        <el-button text @click="router.push('/workflow')" class="wf-back-btn">
          <el-icon><ArrowLeft /></el-icon>
          {{ t('workflow.title') }}
        </el-button>
        <div class="wf-divider" />
        <!-- 可编辑标题 -->
        <div class="wf-title-wrap">
          <el-popover
            v-model:visible="popoverVisible"
            placement="bottom-start"
            :width="240"
            :show-arrow="false"
            trigger="click"
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
                :placeholder="t('workflow.name')"
              />
              <div class="wf-title-edit__actions">
                <el-button size="small" text @click="cancelEditTitle">{{ t('common.cancel') }}</el-button>
                <el-button size="small" type="primary" @click="saveTitle">{{ t('common.confirm') }}</el-button>
              </div>
            </div>
          </el-popover>
        </div>
      </div>

      <div class="wf-editor-toolbar__right">
        <!-- 连线类型 -->
        <el-select v-model="edgeType" size="small" style="width: 72px" :placeholder="t('workflow.edge')">
          <el-option :label="t('workflow.polyline')" value="smoothstep" />
          <el-option :label="t('workflow.curve')" value="default" />
          <el-option :label="t('workflow.straight')" value="straight" />
        </el-select>

        <!-- 撤销/重做 -->
        <el-button size="small" :disabled="!canUndo()" @click="undo" :title="t('common.undo') + ' (Ctrl+Z)'">{{ t('common.undo') }}</el-button>
        <el-button size="small" :disabled="!canRedo()" @click="redo" :title="t('common.redo') + ' (Ctrl+Shift+Z)'">{{ t('common.redo') }}</el-button>

        <!-- 整理与工具按纽 -->
        <el-button size="small" @click="autoLayout">{{ t('workflow.align') }}</el-button>
        <el-button size="small" type="primary" plain @click="nodePickerVisible = true">{{ t('workflow.featureNode') }}</el-button>
        <el-button size="small" @click="triggerDialogVisible = true">{{ t('common.settings') }}</el-button>
        <el-button size="small" type="success" :loading="runningWorkflow" @click="handleRunWorkflow">{{ t('workflow.run') }}</el-button>
        <el-button size="small" @click="exportJson">{{ t('common.export') }}</el-button>
        <el-button size="small" @click="triggerImportJson">{{ t('common.import') }}</el-button>
        <input ref="fileInputRef" type="file" accept=".json" style="display: none" @change="handleImportJson" />
        <el-button size="small" type="danger" text @click="clearCanvas">{{ t('common.clear') }}</el-button>

        <!-- 快捷键帮助 -->
        <el-button size="small" circle @click="shortcutGuideVisible = true" title="键盘快捷键 (?)">
          <el-icon><Reading /></el-icon>
        </el-button>

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
      <NodePanel
        :ai-panel-visible="aiPanelVisible"
        @open-node-picker="handleOpenNodePicker"
        @toggle-ai-panel="handleToggleAiPanel"
      />

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

      <!-- AI 助手侧边面板 -->
      <div v-if="aiPanelVisible" class="wf-editor-ai-panel">
        <div class="wf-editor-ai-panel__header">
          <div class="wf-editor-ai-panel__actions">
            <button class="wf-editor-ai-panel__toggle" @click="aiStore.createConversation" title="新对话">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <button class="wf-editor-ai-panel__toggle" @click="aiStore.clearMessages" title="清空">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
          <button class="wf-editor-ai-panel__toggle" @click="aiPanelVisible = false" title="收起">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
        <AssistantChat
          :messages="aiStore.messages"
          :loading="aiStore.loading"
          :pending-interaction="aiStore.pendingInteraction"
          :thinking-text="aiStore.thinkingText"
          :can-send="true"
          input-placeholder="描述你想要的工作流..."
          @send="aiStore.sendMessage"
          @interaction-submit="(r) => aiStore.resumeInteraction(r.confirmed, r.input, r.reason || '')"
          @interaction-reject="(r) => aiStore.resumeInteraction(false, { ...(aiStore.pendingInteraction?.input || {}), action: 'reject' }, r.reason || '')"
          @new-conversation="aiStore.createConversation"
          @clear-conversation="aiStore.clearMessages"
        />
      </div>
      <button v-else class="wf-editor-ai-toggle" @click="aiPanelVisible = true" title="展开 AI 面板">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>

      <!-- 右侧配置面板 -->
      <ConfigPanel
        :node="selectedNode"
        :workflow-id="workflowId"
        :all-nodes="nodes"
        :all-edges="edges"
        :selected-edge="selectedEdge"
        @update="onNodeUpdate"
        @delete="onNodeDelete"
        
      />
    </div>

    <!-- 触发器与设置对话框 -->
    <ShortcutGuide v-model:visible="shortcutGuideVisible" />
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


/* AI 助手侧边面板 */
.wf-editor-ai-panel {
  display: flex;
  width: 400px;
  height: 100%;
  background: var(--app-content-surface-color);
  border-left: 1px solid var(--app-content-border-color);
  flex-direction: column;
  flex-shrink: 0;
}

.wf-editor-ai-panel__header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 4px 8px;
  border-bottom: 1px solid var(--app-content-border-color);
  flex-shrink: 0;
}



.wf-editor-ai-panel__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
}

.wf-editor-ai-panel__toggle:hover {
  background: var(--app-content-surface-muted-color);
  color: var(--el-text-color-primary);
}

.wf-editor-ai-toggle {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 48px;
  color: var(--el-text-color-secondary);
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-right: none;
  border-radius: 4px 0 0 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.wf-editor-ai-toggle:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

:deep(.wf-editor-ai-panel .assistant-chat) {
  height: 100%;
  border: none;
  border-radius: 0;
}
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
  max-width: 480px;

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

/* AI 助手侧边面板 */
.wf-editor-ai-panel {
  display: flex;
  width: 400px;
  height: 100%;
  background: var(--app-content-surface-color);
  border-left: 1px solid var(--app-content-border-color);
  flex-direction: column;
  flex-shrink: 0;
}

.wf-editor-ai-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--app-content-border-color);
  flex-shrink: 0;
}



.wf-editor-ai-panel__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
}

.wf-editor-ai-panel__toggle:hover {
  background: var(--app-content-surface-muted-color);
  color: var(--el-text-color-primary);
}

.wf-editor-ai-toggle {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 48px;
  color: var(--el-text-color-secondary);
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-right: none;
  border-radius: 4px 0 0 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.wf-editor-ai-toggle:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

:deep(.wf-editor-ai-panel .assistant-chat) {
  height: 100%;
  border: none;
  border-radius: 0;
}
</style>
