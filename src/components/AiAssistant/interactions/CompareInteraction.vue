<template>
  <section class="interaction-panel">
    <div class="interaction-main">
      <span class="interaction-badge">方案对比</span>
      <div>
        <div class="interaction-title">{{ payload.label || "选择一个方案" }}</div>
        <div class="interaction-tip">
          {{ multiSelect ? "可多选，选择后提交。" : "请选择一个方案后继续。" }}
        </div>
      </div>
    </div>

    <div class="compare-list">
      <button
        v-for="opt in options"
        :key="opt.id"
        class="compare-card"
        :class="{ active: isSelected(opt.id) }"
        type="button"
        @click="toggleSelect(opt.id)"
      >
        <div class="compare-header">
          <span class="compare-radio" :class="{ checked: isSelected(opt.id) }" />
          <strong class="compare-title">{{ opt.title }}</strong>
        </div>
        <p v-if="opt.description" class="compare-desc">{{ opt.description }}</p>
        <div v-if="opt.preview" class="compare-preview">
          <pre>{{ opt.preview }}</pre>
        </div>
        <div v-if="opt.tags?.length" class="compare-tags">
          <span v-for="tag in opt.tags" :key="tag" class="compare-tag">{{ tag }}</span>
        </div>
      </button>
    </div>

    <div class="interaction-actions">
      <el-button size="small" text @click="$emit('reject', { confirmed: false, input: {}, reason: '' })">
        跳过
      </el-button>
      <el-button
        size="small"
        type="primary"
        :disabled="!hasSelection"
        :loading="loading"
        @click="handleSubmit"
      >
        {{ multiSelect ? "提交选择" : "确认选择" }}
      </el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { InteractionPayload, CompareOption } from "./types";

const props = defineProps<{
  payload: InteractionPayload;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [result: { confirmed: boolean; input: Record<string, any>; reason?: string }];
  reject: [result: { confirmed: boolean; input: Record<string, any>; reason?: string }];
}>();

const options = computed<CompareOption[]>(() => props.payload.compare?.options || []);
const multiSelect = computed(() => props.payload.compare?.multiSelect === true);

const selected = ref<string[]>([]);

function isSelected(id: string) {
  return selected.value.includes(id);
}

function toggleSelect(id: string) {
  if (multiSelect.value) {
    selected.value = isSelected(id)
      ? selected.value.filter((s) => s !== id)
      : [...selected.value, id];
  } else {
    selected.value = [id];
  }
}

const hasSelection = computed(() => selected.value.length > 0);

function handleSubmit() {
  if (!hasSelection.value) return;
  emit("submit", {
    confirmed: true,
    input: {
      action: "answer",
      selected: multiSelect.value ? [...selected.value] : selected.value[0],
      value: multiSelect.value ? [...selected.value] : selected.value[0],
    },
  });
}
</script>

<style scoped>
.compare-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compare-card {
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition: border-color 0.2s, background 0.2s;
}

.compare-card:hover {
  border-color: var(--el-color-primary-light-5);
}

.compare-card.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.compare-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.compare-radio {
  width: 14px;
  height: 14px;
  border: 2px solid var(--el-border-color);
  border-radius: 50%;
  transition: border-color 0.2s, background 0.2s;
  flex-shrink: 0;
}

.compare-radio.checked {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.compare-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.compare-desc {
  margin: 6px 0 0 22px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.compare-preview {
  max-height: 120px;
  padding: 8px 10px;
  margin: 8px 0 0 22px;
  overflow: auto;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.compare-preview pre {
  margin: 0;
  font-family: Monaco, Menlo, Consolas, monospace;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  word-break: break-word;
  white-space: pre-wrap;
}

.compare-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 6px 0 0 22px;
}

.compare-tag {
  padding: 1px 6px;
  font-size: 10px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border-radius: 4px;
}
</style>
