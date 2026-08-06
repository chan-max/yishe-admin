<template>
  <section class="interaction-panel">
    <div v-if="payload.question" class="interaction-question">
      {{ payload.question }}
    </div>

    <div v-if="hasPreview" class="impact-preview">
      <div v-if="preview.summary" class="impact-summary">{{ preview.summary }}</div>
      <div v-if="preview.riskLevel" class="impact-risk" :class="`risk-${preview.riskLevel}`">
        {{ riskLabel }}
      </div>
      <table v-if="preview.rows?.length" class="impact-table">
        <tr v-for="(row, i) in preview.rows" :key="i">
          <td class="impact-label">{{ row.label }}</td>
          <td class="impact-value" :class="row.tone ? `tone-${row.tone}` : ''">
            {{ row.value }}
          </td>
        </tr>
      </table>
    </div>

    <el-input
      v-model="reason"
      size="small"
      placeholder="补充说明（可选）"
    />

    <div class="interaction-actions">
      <button class="action-btn action-btn--ghost" @click="$emit('reject', { confirmed: false, input: {}, reason })">
        取消
      </button>
      <button
        class="action-btn action-btn--primary"
        :disabled="loading"
        @click="$emit('submit', { confirmed: true, input: { action: 'confirm' }, reason })"
      >
        {{ loading ? "处理中" : "确认" }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { InteractionPayload } from "./types";

const props = defineProps<{
  payload: InteractionPayload;
  loading?: boolean;
}>();

defineEmits<{
  submit: [result: { confirmed: boolean; input: Record<string, any>; reason?: string }];
  reject: [result: { confirmed: boolean; input: Record<string, any>; reason?: string }];
}>();

const reason = ref("");

const preview = computed(() => props.payload.preview || {});
const hasPreview = computed(() => {
  const p = preview.value;
  return p.summary || p.rows?.length || p.riskLevel;
});

const riskLabel = computed(() => {
  const map: Record<string, string> = { low: "低风险", medium: "中风险", high: "高风险" };
  return map[preview.value.riskLevel || "low"] || "";
});
</script>

<style scoped>
.interaction-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}

.interaction-question {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.impact-preview {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 6px;
  padding: 8px 10px;
}

.impact-summary {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-bottom: 4px;
  line-height: 1.4;
}

.impact-risk {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 4px;
}

.risk-low { background: var(--el-color-success-light-9); color: var(--el-color-success); }
.risk-medium { background: var(--el-color-warning-light-9); color: var(--el-color-warning); }
.risk-high { background: var(--el-color-danger-light-9); color: var(--el-color-danger); }

.impact-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.impact-table td {
  padding: 2px 0;
  vertical-align: top;
}

.impact-label {
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  padding-right: 10px !important;
  width: 1%;
}

.impact-value {
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.tone-positive { color: var(--el-color-success); }
.tone-negative { color: var(--el-color-danger); }
.tone-neutral { color: var(--el-text-color-regular); }

.interaction-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.action-btn {
  height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all .12s;
}

.action-btn--ghost {
  background: transparent;
  color: var(--el-text-color-secondary);
}

.action-btn--ghost:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color);
}

.action-btn--primary {
  background: var(--el-color-primary);
  color: #fff;
}

.action-btn--primary:hover:not(:disabled) { opacity: .85; }
.action-btn--primary:disabled { opacity: .4; cursor: not-allowed; }
</style>
