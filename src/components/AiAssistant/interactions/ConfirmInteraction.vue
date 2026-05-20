<template>
  <section class="interaction-panel">
    <div class="interaction-main">
      <span class="interaction-badge">{{ tag }}</span>
      <div>
        <div class="interaction-title">{{ payload.label || "需要确认" }}</div>
        <div class="interaction-tip">{{ hint }}</div>
        <pre class="interaction-question">{{ payload.question }}</pre>
      </div>
    </div>

    <!-- impact_preview: 预览表格 -->
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
      placeholder="可选：补充备注"
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

const tag = computed(() => hasPreview.value ? "操作预览" : "需要确认");

const hint = computed(() => {
  if (preview.value.riskLevel === "high") return "此操作风险较高，请仔细确认后继续。";
  if (preview.value.riskLevel === "medium") return "请确认以下操作内容。";
  return "确认后继续执行，取消会终止这一步。";
});

const riskLabel = computed(() => {
  const map: Record<string, string> = { low: "低风险", medium: "中风险", high: "高风险" };
  return map[preview.value.riskLevel || "low"] || "";
});
</script>

<style scoped>
.impact-preview {
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  padding: 10px 12px;
}

.impact-summary {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
  line-height: 1.5;
}

.impact-risk {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
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
  padding: 4px 0;
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

.interaction-question {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.55;
  color: var(--el-text-color-regular);
}
</style>
