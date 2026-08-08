<script setup lang="ts">
import { ref, watch } from 'vue'
import { Delete, Pointer } from '@element-plus/icons-vue'
import type { Node } from '@vue-flow/core'

const props = defineProps<{
  node: Node | null
}>()

const emit = defineEmits<{
  (e: 'update', node: Node): void
  (e: 'delete', nodeId: string): void
}>()

const form = ref({ label: '', config: {} as any })

watch(
  () => props.node,
  (n) => {
    if (n) {
      form.value.label = n.data?.label || ''
      form.value.config = { ...(n.data?.config || {}) }
      if (n.data?.config?.cronExpression) {
        const parts = String(n.data.config.cronExpression).trim().split(/\s+/)
        if (parts.length === 5 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
          const m = parseInt(parts[0], 10)
          const h = parseInt(parts[1], 10)
          timePickerValue.value = new Date(2026, 0, 1, h, m)
        }
      }
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

const timePickerValue = ref<Date | null>(new Date(2026, 0, 1, 8, 0))

const cronTemplates = [
  { label: '每 5 分钟', expr: '*/5 * * * *' },
  { label: '每 10 分钟', expr: '*/10 * * * *' },
  { label: '每 30 分钟', expr: '*/30 * * * *' },
  { label: '每小时整点', expr: '0 * * * *' },
  { label: '每天 09:00', expr: '0 9 * * *' },
  { label: '每天 12:00', expr: '0 12 * * *' },
  { label: '每天 18:00', expr: '0 18 * * *' },
  { label: '每天 00:30', expr: '30 0 * * *' },
  { label: '工作日 09:00', expr: '0 9 * * 1-5' },
  { label: '工作日 18:00', expr: '0 18 * * 1-5' },
  { label: '每周一 09:00', expr: '0 9 * * 1' },
  { label: '每周日 23:00', expr: '0 23 * * 0' },
  { label: '每月 1 日 09:00', expr: '0 9 1 * *' },
  { label: '每月最后一天 23:00', expr: '0 23 28-31 * *' },
]

const handleTimePickerChange = (val: Date | null) => {
  if (val) {
    const d = new Date(val)
    const h = d.getHours()
    const m = d.getMinutes()
    form.value.config.cronExpression = `${m} ${h} * * *`
    handleDataChange()
  }
}

const applyCronTemplate = (expr: string) => {
  form.value.config.cronExpression = expr
  const parts = expr.trim().split(/\s+/)
  if (parts.length === 5 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
    const m = parseInt(parts[0], 10)
    const h = parseInt(parts[1], 10)
    timePickerValue.value = new Date(2026, 0, 1, h, m)
  }
  handleDataChange()
}

const NODE_TYPE_LABELS: Record<string, string> = {
  start: '开始节点',
  end: '结束节点',
  default: '普通节点',
  condition: '条件判断',
  llm: 'AI 大模型',
  http: 'HTTP 请求',
  code: '代码脚本'
}
</script>

<template>
  <div class="config-panel">
    <template v-if="node">
      <div class="config-panel__header">
        <span class="config-panel__type-badge">{{ NODE_TYPE_LABELS[node.type || 'default'] || node.type }}</span>
        <el-button type="danger" text size="small" @click="handleDelete">
          <el-icon><Delete /></el-icon>
          删除
        </el-button>
      </div>

      <div class="config-panel__body">
        <el-form label-position="top" size="small">
          <el-form-item label="节点名称">
            <el-input
              v-model="form.label"
              placeholder="输入节点名称"
              @input="handleDataChange"
            />
          </el-form-item>

          <!-- 开始节点专用配置 -->
          <template v-if="node.type === 'start'">
            <el-form-item label="触发类型">
              <el-select v-model="form.config.triggerType" placeholder="选择类型" @change="handleDataChange">
                <el-option label="手动触发" value="manual" />
                <el-option label="定时调度" value="cron" />
              </el-select>
            </el-form-item>

            <template v-if="form.config.triggerType === 'cron'">
              <el-form-item label="Cron 表达式">
                <el-input
                  v-model="form.config.cronExpression"
                  placeholder="0 8 * * *"
                  size="small"
                  @input="handleDataChange"
                />
              </el-form-item>
              <el-form-item label="时间选择器">
                <el-time-picker
                  v-model="timePickerValue"
                  format="HH:mm"
                  size="small"
                  placeholder="选择时间点"
                  style="width: 100%"
                  @change="handleTimePickerChange"
                />
              </el-form-item>
              <el-form-item label="Cron 快捷模板">
                <el-select
                  placeholder="选择预设模板"
                  size="small"
                  style="width: 100%"
                  @change="applyCronTemplate"
                >
                  <el-option
                    v-for="item in cronTemplates"
                    :key="item.expr"
                    :label="`${item.label} (${item.expr})`"
                    :value="item.expr"
                  />
                </el-select>
              </el-form-item>
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

          <!-- AI 大模型专用配置 -->
          <template v-if="node.type === 'llm'">
            <el-form-item label="模型类型">
              <el-select v-model="form.config.model" placeholder="选择模型" @change="handleDataChange">
                <el-option label="DeepSeek-R1" value="DeepSeek-R1" />
                <el-option label="GPT-4o" value="GPT-4o" />
                <el-option label="Claude-3.5-Sonnet" value="Claude-3.5-Sonnet" />
              </el-select>
            </el-form-item>
            <el-form-item label="System Prompt">
              <el-input
                v-model="form.config.systemPrompt"
                type="textarea"
                :rows="3"
                placeholder="设置 AI 提示词..."
                @input="handleDataChange"
              />
            </el-form-item>
          </template>

          <!-- 条件判断专用配置 -->
          <template v-if="node.type === 'condition'">
            <el-form-item label="判断表达式">
              <el-input
                v-model="form.config.expression"
                placeholder="例如：score > 80"
                @input="handleDataChange"
              />
            </el-form-item>
          </template>

          <!-- HTTP 请求专用配置 -->
          <template v-if="node.type === 'http'">
            <el-form-item label="请求方式">
              <el-select v-model="form.config.method" placeholder="Method" @change="handleDataChange">
                <el-option label="POST" value="POST" />
                <el-option label="GET" value="GET" />
                <el-option label="PUT" value="PUT" />
                <el-option label="DELETE" value="DELETE" />
              </el-select>
            </el-form-item>
            <el-form-item label="请求 URL">
              <el-input
                v-model="form.config.url"
                placeholder="https://api.example.com"
                @input="handleDataChange"
              />
            </el-form-item>
          </template>

          <!-- 代码脚本专用配置 -->
          <template v-if="node.type === 'code'">
            <el-form-item label="脚本语言">
              <el-select v-model="form.config.language" placeholder="选择语言" @change="handleDataChange">
                <el-option label="JavaScript" value="JavaScript" />
                <el-option label="Python" value="Python" />
              </el-select>
            </el-form-item>
          </template>

          <el-form-item label="节点 ID">
            <el-input :value="node.id" disabled />
          </el-form-item>

          <el-form-item label="坐标位置">
            <div style="display:flex;gap:8px;">
              <el-input :value="`x: ${Math.round(node.position.x)}`" disabled />
              <el-input :value="`y: ${Math.round(node.position.y)}`" disabled />
            </div>
          </el-form-item>
        </el-form>
      </div>
    </template>

    <template v-else>
      <div class="config-panel__empty">
        <el-icon class="config-panel__empty-icon"><Pointer /></el-icon>
        <p>点击节点查看配置</p>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.config-panel {
  width: 210px;
  height: 100%;
  background: var(--app-content-surface-color);
  border-left: 1px solid var(--app-content-border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.config-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--app-content-border-color);
}

.config-panel__type-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.config-panel__body {
  padding: 10px 12px;
  flex: 1;
  overflow-y: auto;

  :deep(.el-form-item) {
    margin-bottom: 10px;
  }

  :deep(.el-form-item__label) {
    font-size: 11px;
    padding-bottom: 2px;
    color: var(--el-text-color-secondary);
  }
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
  font-size: 24px;
  opacity: 0.4;
}
</style>
