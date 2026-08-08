<script setup lang="ts">
import { ref, watch } from 'vue'
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
    }
  },
  { immediate: true }
)

const handleLabelChange = () => {
  if (!props.node) return
  emit('update', {
    ...props.node,
    data: { ...props.node.data, label: form.value.label }
  })
}

const handleDelete = () => {
  if (props.node) emit('delete', props.node.id)
}

const NODE_TYPE_LABELS: Record<string, string> = {
  start: '开始节点',
  end: '结束节点',
  default: '普通节点'
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
              @input="handleLabelChange"
            />
          </el-form-item>

          <el-form-item label="节点 ID">
            <el-input :value="node.id" disabled />
          </el-form-item>

          <el-form-item label="位置">
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
  width: 260px;
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
  padding: 14px 16px;
  border-bottom: 1px solid var(--app-content-border-color);
}

.config-panel__type-badge {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.config-panel__body {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.config-panel__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.config-panel__empty-icon {
  font-size: 32px;
  opacity: 0.4;
}
</style>
