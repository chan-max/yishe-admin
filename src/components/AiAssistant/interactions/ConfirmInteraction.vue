<template>
  <section class="interaction-panel">
    <!-- 问题/提示问句 -->
    <div v-if="payload.question" class="interaction-question">
      {{ payload.question }}
    </div>

    <!-- impact_preview: 预览表格（仅在有 preview 时显示） -->
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

    <!-- 可选备注 -->
    <el-input
      v-model="reason"
      size="small"
      placeholder="补充说明（可选）"
    />

    <div class="interaction-actions">
      <el-button size="small" text @click="$emit('reject', { confirmed: false, input: {}, reason })">
        取消
      </el-button>
      <el-button
        size="small"
        type="primary"
        :loading="loading"
        @click="$emit('submit', { confirmed: true, input: { action: 'confirm' }, reason })"
      >
        确认继续
      </el-button>
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
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--el-bg-color-overlay, var(--el-bg-color, #ffffff));
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  max-width: min(680px, 94%);
}

:global(html.dark) .interaction-panel {
  background: var(--el-bg-color-overlay, #1d1e1f);
  border-color: var(--el-border-color-darker, #363637);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.interaction-question {
  font-size: 13px;
  line-height: 1.55;
  color: var(--el-text-color-primary, #303133);
  white-space: pre-wrap;
  word-break: break-word;
}

:global(html.dark) .interaction-question {
  color: var(--el-text-color-primary, #e5eaf3);
}

.impact-preview {
  background: var(--el-fill-color-lighter, #fafafa);
  border: 1px solid var(--el-border-color-extra-light, #f0f0f0);
  border-radius: 6px;
  padding: 8px 10px;
  margin-top: 4px;
}

:global(html.dark) .impact-preview {
  background: var(--el-fill-color-dark, #262727);
  border-color: var(--el-border-color-darker, #363637);
}

.impact-summary {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-bottom: 6px;
  line-height: 1.45;
}

.impact-risk {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 6px;
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
  padding: 3px 0;
  vertical-align: top;
}

.impact-label {
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  padding-right: 12px !important;
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
  gap: 8px;
  margin-top: 2px;
  padding-top: 6px;
  border-top: 1px solid var(--el-border-color-extra-light, #f2f6fc);
}

:global(html.dark) .interaction-actions {
  border-top-color: var(--el-border-color-darker, #363637);
}
</style>
