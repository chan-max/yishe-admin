<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Pointer, Plus } from '@element-plus/icons-vue'
import type { Node } from '@vue-flow/core'
import AdvancedCronDialog from './AdvancedCronDialog.vue'
import VariableSelector from './VariableSelector.vue'
import {
  SYSTEM_NODE_REGISTRY,
  type NodeManifest,
  type NodeIOSchemaField
} from '@/views/workflow/editor/config/node-manifest'
import { getMessagePushList, type MessagePushConfig } from '@/api/messagePush'

const props = defineProps<{
  node: Node | null
  workflowId?: string
  allNodes?: Node[]
  allEdges?: any[]
  selectedEdge?: any | null
}>()

const emit = defineEmits<{
  (e: 'update', node: Node): void
  (e: 'delete', nodeId: string): void
  (e: 'updateEdge', edge: any): void
}>()

const form = ref({ label: '', config: {} as any })
const advancedCronVisible = ref(false)
const edgeCondition = ref('')

// 变量选择器
const variableSelectorVisible = ref(false)
const activeFieldForVariable = ref('')

const openVariableSelector = (fieldName: string) => {
  activeFieldForVariable.value = fieldName
  variableSelectorVisible.value = true
}

const handleVariableSelect = (variablePath: string, _label: string) => {
  if (!props.node) return
  const fieldName = activeFieldForVariable.value
  if (!fieldName) return
  const currentVal = form.value.config[fieldName] || ''
  form.value.config[fieldName] = currentVal + `{{ ${variablePath} }}`
  handleDataChange()
  variableSelectorVisible.value = false
}

// 输出变量点击复制
const copiedField = ref('')
const copyVariable = async (nodeId: string, fieldName: string) => {
  const text = `{{ ${nodeId}.${fieldName} }}`
  try {
    await navigator.clipboard.writeText(text)
    copiedField.value = fieldName
    setTimeout(() => { copiedField.value = '' }, 1500)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copiedField.value = fieldName
    setTimeout(() => { copiedField.value = '' }, 1500)
  }
}

// 监听选中 edge，同步 condition
watch(
  () => props.selectedEdge,
  (edge) => {
    edgeCondition.value = edge?.data?.condition || edge?.condition || ''
  },
  { immediate: true }
)

const handleUpdateEdgeCondition = () => {
  if (!props.selectedEdge) return
  const edge = { ...props.selectedEdge }
  if (!edge.data) edge.data = {}
  edge.data.condition = edgeCondition.value
  edge.condition = edgeCondition.value
  emit('updateEdge', edge)
}

// 消息推送渠道列表（动态从 API 加载）
const messagePushChannels = ref<MessagePushConfig[]>([])
const channelsLoaded = ref(false)

const loadMessagePushChannels = async () => {
  if (channelsLoaded.value) return
  try {
    const list = await getMessagePushList()
    messagePushChannels.value = Array.isArray(list) ? list.filter((c) => c.enabled) : []
    channelsLoaded.value = true
  } catch (e) {
    messagePushChannels.value = []
  }
}

// 当前节点对应的能力库元数据
const currentCapability = computed<NodeManifest | undefined>(() => {
  if (!props.node) return undefined
  const capType = props.node.data?.capabilityType || props.node.type
  return SYSTEM_NODE_REGISTRY.find((item) => item.type === capType)
})

// 是否是消息推送类节点
const isNotifyNode = computed(() => currentCapability.value?.category === 'notify')

// 动态注入渠道 options 进 inputSchema
const resolvedInputSchema = computed<NodeIOSchemaField[]>(() => {
  const schema = currentCapability.value?.inputSchema || []
  if (!isNotifyNode.value) return schema

  return schema.map((field) => {
    if (field.field === 'channelId') {
      return {
        ...field,
        options: messagePushChannels.value.map((ch) => ({
          label: `${ch.name} (${ch.platform === 'feishu' ? '飞书' : '企业微信'})`,
          value: ch.id,
        })),
      }
    }
    return field
  })
})

watch(
  () => props.node,
  (n) => {
    if (n) {
      form.value.label = n.data?.label || ''
      form.value.config = { ...(n.data?.config || {}) }
    }
    if (isNotifyNode.value) {
      loadMessagePushChannels()
    }
  },
  { immediate: true }
)

const handleDataChange = (fieldName?: string, selectedLabel?: string) => {
  if (!props.node) return

  const config = { ...form.value.config }
  if (fieldName && selectedLabel) {
    const nameKey = fieldName === 'channelId' ? 'channelName' : `${fieldName}Name`
    config[nameKey] = selectedLabel
  }

  emit('update', {
    ...props.node,
    data: {
      ...props.node.data,
      label: form.value.label,
      config
    }
  })
}

const handleDelete = () => {
  if (props.node) emit('delete', props.node.id)
}

const addInputParam = () => {
  if (!form.value.config.inputParams) {
    form.value.config.inputParams = []
  }
  form.value.config.inputParams.push({ key: '', type: 'string' })
  handleDataChange()
}

const removeInputParam = (index: number) => {
  if (Array.isArray(form.value.config.inputParams)) {
    form.value.config.inputParams.splice(index, 1)
    handleDataChange()
  }
}

// 快捷键提示
const getShortcutLabel = (win: string, mac: string) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  return isMac ? mac : win
}
</script>

<template>
  <div class="config-panel">
    <!-- Edge 条件编辑器 -->
    <template v-if="selectedEdge && !node">
      <div class="config-panel__header">
        <div class="config-panel__title-badge">
          <span class="config-panel__type-name">连线条件</span>
        </div>
      </div>
      <div class="config-panel__body">
        <el-form label-position="top" size="small">
          <el-form-item label="条件表达式">
            <el-input
              v-model="edgeCondition"
              type="textarea"
              :rows="3"
              placeholder="例如：branch === 'sufficient'"
              @input="handleUpdateEdgeCondition"
            />
            <div class="config-panel__field-desc">
              支持运算符：===, !==, &gt;, &lt;, &gt;=, &lt;=, contains
            </div>
          </el-form-item>
          <div class="config-panel__meta-box">
            <div class="config-panel__meta-row">
              <span class="config-panel__meta-label">来源节点:</span>
              <span class="config-panel__meta-val">{{ selectedEdge.source }}</span>
            </div>
            <div class="config-panel__meta-row">
              <span class="config-panel__meta-label">目标节点:</span>
              <span class="config-panel__meta-val">{{ selectedEdge.target }}</span>
            </div>
          </div>
        </el-form>
      </div>
    </template>

    <template v-if="node">
      <div class="config-panel__header">
        <div class="config-panel__title-badge">
          <span
            v-if="currentCapability"
            class="config-panel__dot"
            :style="{ background: currentCapability.color }"
          />
          <span class="config-panel__type-name">
            {{ currentCapability?.name || node.data?.label || node.type }}
          </span>
        </div>
        <el-button type="danger" text size="small" @click="handleDelete">
          <svg class="config-panel__delete-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </el-button>
      </div>

      <div class="config-panel__body">
        <el-form label-position="top" size="small">
          <!-- 基础信息 -->
          <el-form-item label="节点显示名称">
            <el-input
              v-model="form.label"
              placeholder="输入节点名称"
              @input="handleDataChange"
            />
          </el-form-item>

          <!-- 1. 开始节点专属配置 -->
          <template v-if="node.type === 'start'">
            <el-form-item label="触发类型">
              <el-select v-model="form.config.triggerType" placeholder="选择类型" @change="handleDataChange">
                <el-option label="手动触发 / API" value="manual" />
                <el-option label="定时触发" value="cron" />
              </el-select>
            </el-form-item>

            <template v-if="form.config.triggerType === 'cron'">
              <el-button
                size="small"
                type="primary"
                plain
                style="width: 100%; margin-bottom: 12px;"
                @click="advancedCronVisible = true"
              >
                设置定时与预设模板
              </el-button>
            </template>

            <el-form-item label="输入变量定义">
              <div class="wf-param-list">
                <div
                  v-for="(param, idx) in (form.config.inputParams || [])"
                  :key="idx"
                  class="wf-param-item"
                >
                  <el-input
                    v-model="param.key"
                    placeholder="变量名"
                    size="small"
                    style="width: 80px"
                    @input="handleDataChange"
                  />
                  <el-select
                    v-model="param.type"
                    size="small"
                    style="width: 70px"
                    @change="handleDataChange"
                  >
                    <el-option label="string" value="string" />
                    <el-option label="number" value="number" />
                    <el-option label="boolean" value="boolean" />
                    <el-option label="json" value="json" />
                  </el-select>
                  <el-button type="danger" text circle size="small" @click="removeInputParam(idx)">
                    <svg class="config-panel__delete-icon config-panel__delete-icon--sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </el-button>
                </div>
                <el-button size="small" type="primary" plain style="width: 100%; margin-top: 4px;" @click="addInputParam">
                  + 添加输入变量
                </el-button>
              </div>
            </el-form-item>
          </template>

          <!-- 2. 基于 Schema 动态渲染输入表单 -->
          <template v-if="resolvedInputSchema.length">
            <div class="config-panel__section-title">节点入参配置</div>
            <div
              v-for="field in resolvedInputSchema"
              :key="field.field"
              class="config-panel__schema-field"
            >
              <el-form-item :label="field.label">
                <template v-if="field.type === 'select'">
                  <el-select
                    v-model="form.config[field.field]"
                    :placeholder="field.placeholder || '请选择'"
                    style="width: 100%"
                    @change="(val) => {
                      const opt = field.options?.find(o => String(o.value) === String(val))
                      handleDataChange(field.field, opt?.label)
                    }"
                  >
                    <el-option
                      v-for="opt in field.options || []"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </template>

                <template v-else-if="field.type === 'textarea'">
                  <div class="config-panel__textarea-wrapper">
                    <el-input
                      v-model="form.config[field.field]"
                      type="textarea"
                      :rows="3"
                      :placeholder="field.placeholder || '支持 {{ node_id.variable }}'"
                      @input="handleDataChange"
                    />
                    <button class="config-panel__insert-var-icon--textarea" @click="openVariableSelector(field.field)" title="插入变量">
                      <el-icon :size="14"><Plus /></el-icon>
                    </button>
                  </div>
                </template>

                <template v-else-if="field.type === 'number'">
                  <el-input-number
                    v-model="form.config[field.field]"
                    size="small"
                    style="width: 100%"
                    @change="handleDataChange"
                  />
                </template>

                <template v-else-if="field.type === 'boolean'">
                  <el-switch
                    v-model="form.config[field.field]"
                    @change="handleDataChange"
                  />
                </template>

                <template v-else>
                  <el-input
                    v-model="form.config[field.field]"
                    :placeholder="field.placeholder || '输入内容或 {{ 变量 }}'"
                    @input="handleDataChange"
                  >
                    <template #suffix>
                      <button class="config-panel__insert-var-icon" @click="openVariableSelector(field.field)" title="插入变量">
                        <el-icon :size="14"><Plus /></el-icon>
                      </button>
                    </template>
                  </el-input>
                </template>

                <!-- 字段说明提示 -->
                <div v-if="field.description" class="config-panel__field-desc">
                  {{ field.description }}
                </div>
              </el-form-item>
            </div>
          </template>

          <!-- 3. 输出变量 Schema 预览 -->
          <template v-if="currentCapability?.outputSchema?.length">
            <div class="config-panel__section-title">输出变量 (供下游引用)</div>
            <div class="config-panel__output-variables">
              <div
                v-for="out in currentCapability.outputSchema"
                :key="out.field"
                class="config-panel__output-tag"
                @click="copyVariable(node.id, out.field)"
                :title="`点击复制 {{ ${node.id}.${out.field} }}`"
              >
                <span class="config-panel__output-name">{{ out.field }}</span>
                <span class="config-panel__output-type">{{ out.type }}</span>
                <span class="config-panel__output-label">{{ out.label }}</span>
                <span v-if="copiedField === out.field" class="config-panel__output-copied">已复制</span>
              </div>
            </div>
          </template>

          <!-- 元数据信息 -->
          <div class="config-panel__meta-box">
            <div class="config-panel__meta-row">
              <span class="config-panel__meta-label">节点 ID:</span>
              <span class="config-panel__meta-val">{{ node.id }}</span>
            </div>
            <div class="config-panel__meta-row">
              <span class="config-panel__meta-label">坐标:</span>
              <span class="config-panel__meta-val">({{ Math.round(node.position.x) }}, {{ Math.round(node.position.y) }})</span>
            </div>
          </div>
        </el-form>
      </div>
    </template>

    <template v-else-if="!selectedEdge">
      <div class="config-panel__empty">
        <div class="config-panel__empty-illustration">
          <el-icon class="config-panel__empty-icon"><Pointer /></el-icon>
        </div>
        <div class="config-panel__empty-content">
          <p class="config-panel__empty-title">未选择节点</p>
          <p class="config-panel__empty-desc">点击画布中的节点进行配置</p>
        </div>
      </div>
    </template>

    <VariableSelector
      v-if="node"
      v-model:visible="variableSelectorVisible"
      :current-node-id="node.id"
      :all-nodes="allNodes || []"
      :all-edges="allEdges || []"
      @select="handleVariableSelect"
    />
    <AdvancedCronDialog v-model="advancedCronVisible" :workflow-id="workflowId || ''" />
  </div>
</template>

<style scoped lang="scss">
.config-panel {
  display: flex;
  width: 250px;
  height: 100%;
  background: var(--app-content-surface-color, #141518);
  border-left: 1px solid var(--app-content-border-color, rgb(255 255 255 / 8%));
  user-select: none;
  flex-direction: column;
  flex-shrink: 0;
}

.config-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--app-content-border-color, rgb(255 255 255 / 6%));
}

.config-panel__title-badge {
  display: flex;
  align-items: center;
  gap: 6px;
}

.config-panel__dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.config-panel__type-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.config-panel__body {
  padding: 12px;
  flex: 1;
  overflow-y: auto;

  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  :deep(.el-form-item__label) {
    padding-bottom: 2px;
    font-size: 11px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }
}

.config-panel__section-title {
  padding-bottom: 4px;
  margin: 14px 0 8px;
  font-size: 11px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  border-bottom: 1px dashed var(--app-content-border-color, rgb(255 255 255 / 10%));
}

.wf-param-list {
  width: 100%;
}

.wf-param-item {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}

.config-panel__output-variables {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-panel__output-tag {
  display: flex;
  padding: 4px 6px;
  overflow: hidden;
  font-size: 10px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, transparent);
  border-radius: 4px;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 15%, transparent);
  }
}

.config-panel__output-name {
  min-width: 0;
  overflow: hidden;
  font-family: monospace;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
}

.config-panel__output-type {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--el-text-color-secondary) 12%, transparent);
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.config-panel__output-label {
  font-size: 9px;
  white-space: nowrap;
  opacity: 0.7;
  flex-shrink: 0;
}

.config-panel__output-copied {
  font-size: 9px;
  color: var(--el-color-success);
  flex-shrink: 0;
}

.config-panel__meta-box {
  display: flex;
  padding: 8px 10px;
  margin-top: 16px;
  background: color-mix(in srgb, var(--el-text-color-secondary) 6%, transparent);
  border: 1px solid var(--app-content-border-color, rgb(255 255 255 / 4%));
  border-radius: 6px;
  flex-direction: column;
  gap: 4px;
}

.config-panel__meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
}

.config-panel__meta-label {
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}

.config-panel__meta-val {
  min-width: 0;
  margin-left: 8px;
  overflow: hidden;
  font-family: monospace;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
}

.config-panel__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  text-align: center;
}

.config-panel__empty-illustration {
  display: flex;
  width: 56px;
  height: 56px;
  background: color-mix(in srgb, var(--el-text-color-secondary) 8%, transparent);
  border-radius: 14px;
  align-items: center;
  justify-content: center;
}

.config-panel__empty-icon {
  font-size: 24px;
  color: var(--el-text-color-secondary);
  opacity: 0.5;
}

.config-panel__empty-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-panel__empty-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.config-panel__empty-desc {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--el-text-color-placeholder);
}

.config-panel__field-desc {
  margin-top: 4px;
  font-size: 10px;
  line-height: 1.5;
  color: var(--el-text-color-placeholder);
}

.config-panel__delete-icon {
  width: 16px;
  height: 16px;

  &--sm {
    width: 13px;
    height: 13px;
  }
}

/* 变量插入按钮 - Input 后缀图标样式 */
.config-panel__insert-var-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--el-text-color-placeholder);
  background: transparent;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  }
}

.config-panel__textarea-wrapper {
  position: relative;
  width: 100%;
}

.config-panel__insert-var-icon--textarea {
  position: absolute;
  right: 6px;
  bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: var(--el-text-color-placeholder);
  background: color-mix(in srgb, var(--app-content-surface-color, #141518) 85%, transparent);
  border: 1px solid var(--app-content-border-color, rgb(255 255 255 / 8%));
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  }
}

.config-panel__input-with-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
}
</style>
