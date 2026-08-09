<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Delete, Pointer, Connection } from '@element-plus/icons-vue'
import type { Node } from '@vue-flow/core'
import AdvancedCronDialog from './AdvancedCronDialog.vue'
import {
  SYSTEM_NODE_REGISTRY,
  type SystemNodeCapability,
  type NodeInputField
} from '@/views/workflow/editor/config/nodeRegistry'
import { getMessagePushList, type MessagePushConfig } from '@/api/messagePush'

const props = defineProps<{
  node: Node | null
  workflowId?: string
}>()

const emit = defineEmits<{
  (e: 'update', node: Node): void
  (e: 'delete', nodeId: string): void
}>()

const form = ref({ label: '', config: {} as any })
const advancedCronVisible = ref(false)

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
const currentCapability = computed<SystemNodeCapability | undefined>(() => {
  if (!props.node) return undefined
  const capType = props.node.data?.capabilityType || props.node.type
  return SYSTEM_NODE_REGISTRY.find((item) => item.type === capType)
})

// 是否是消息推送类节点
const isNotifyNode = computed(() => currentCapability.value?.category === 'notify')

// 动态注入渠道 options 进 inputSchema
const resolvedInputSchema = computed<NodeInputField[]>(() => {
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
    // 当选中的是消息推送节点时自动加载渠道列表
    if (isNotifyNode.value) {
      loadMessagePushChannels()
    }
  },
  { immediate: true }
)

const handleDataChange = () => {
  if (!props.node) return
  emit('update', {
    ...props.node,
    data: {
      ...props.node.data,
      label: form.value.label,
      config: { ...form.value.config }
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
</script>

<template>
  <div class="config-panel">
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
          <el-icon><Delete /></el-icon>
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
                <el-option label="定时 Cron 调度" value="cron" />
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
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                <el-button size="small" type="primary" plain style="width: 100%; margin-top: 4px;" @click="addInputParam">
                  + 添加输入变量
                </el-button>
              </div>
            </el-form-item>
          </template>

          <!-- 2. 基于 Schema 动态渲染输入表单 -->
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
                    @change="handleDataChange"
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
                  <el-input
                    v-model="form.config[field.field]"
                    type="textarea"
                    :rows="3"
                    :placeholder="field.placeholder || '支持 {{ node_id.variable }}'"
                    @input="handleDataChange"
                  />
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
                  />
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
              >
                <el-icon><Connection /></el-icon>
                <span class="config-panel__output-name">{{ node.id }}.{{ out.field }}</span>
                <span class="config-panel__output-label">({{ out.label }})</span>
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

    <template v-else>
      <div class="config-panel__empty">
        <el-icon class="config-panel__empty-icon"><Pointer /></el-icon>

        <p>点击画布中的节点进行配置</p>
      </div>
    </template>

    <AdvancedCronDialog v-model="advancedCronVisible" :workflow-id="workflowId || ''" />
  </div>
</template>

<style scoped lang="scss">
.config-panel {
  width: 250px;
  height: 100%;
  background: var(--app-content-surface-color, #141518);
  border-left: 1px solid var(--app-content-border-color, rgba(255, 255, 255, 0.08));
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  user-select: none;
}

.config-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--app-content-border-color, rgba(255, 255, 255, 0.06));
}

.config-panel__title-badge {
  display: flex;
  align-items: center;
  gap: 6px;
}

.config-panel__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
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
    font-size: 11px;
    padding-bottom: 2px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }
}

.config-panel__section-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 14px 0 8px;
  padding-bottom: 4px;
  border-bottom: 1px dashed var(--app-content-border-color, rgba(255, 255, 255, 0.1));
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
  font-size: 10px;
  padding: 4px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, transparent);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  gap: 4px;
  word-break: break-all;
}

.config-panel__output-name {
  font-family: monospace;
  font-weight: 600;
}

.config-panel__output-label {
  opacity: 0.7;
  font-size: 9px;
}

.config-panel__meta-box {
  margin-top: 16px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid var(--app-content-border-color, rgba(255, 255, 255, 0.04));
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-panel__meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
}

.config-panel__meta-label {
  color: var(--el-text-color-placeholder);
}

.config-panel__meta-val {
  color: var(--el-text-color-secondary);
  font-family: monospace;
}

.config-panel__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.config-panel__empty-icon {
  font-size: 28px;
  opacity: 0.4;
}

.config-panel__field-desc {
  margin-top: 4px;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  line-height: 1.5;
}
</style>
