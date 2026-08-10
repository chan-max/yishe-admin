<template>
  <section class="interaction-panel">
    <div class="interaction-main">
      <span class="interaction-badge">执行计划</span>
      <div>
        <div class="interaction-title">{{ payload.label || "确认执行计划" }}</div>
        <div class="interaction-tip">
          {{ isEditable ? "可以调整步骤顺序或跳过某些步骤，确认后执行。" : "请确认以下执行计划。" }}
        </div>
      </div>
    </div>

    <div class="plan-steps">
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="plan-step"
        :class="[`status-${step.status || 'pending'}`, { 'is-disabled': step._skipped }]"
        draggable="false"
      >
        <div class="step-index">
          <span v-if="step.status === 'done'" class="step-check">✓</span>
          <span v-else-if="step.status === 'running'" class="step-spinner" />
          <span v-else-if="step._skipped" class="step-skip">⊘</span>
          <span v-else>{{ index + 1 }}</span>
        </div>

        <div class="step-body">
          <div class="step-label">{{ step.label }}</div>
          <div v-if="step.description" class="step-desc">{{ step.description }}</div>
        </div>

        <div v-if="isEditable && step.editable !== false" class="step-actions">
          <el-tooltip content="上移" :disabled="index === 0">
            <button class="step-btn" :disabled="index === 0" @click="moveStep(index, -1)">↑</button>
          </el-tooltip>
          <el-tooltip content="下移" :disabled="index === steps.length - 1">
            <button class="step-btn" :disabled="index === steps.length - 1" @click="moveStep(index, 1)">↓</button>
          </el-tooltip>
          <el-tooltip :content="step._skipped ? '恢复' : '跳过'">
            <button class="step-btn" @click="toggleSkip(index)">
              {{ step._skipped ? '↩' : '⊘' }}
            </button>
          </el-tooltip>
        </div>
      </div>
    </div>

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
        @click="handleSubmit"
      >
        确认执行
      </el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { InteractionPayload, PlanStep } from "./types";

interface InternalStep extends PlanStep {
  _skipped?: boolean;
}

const props = defineProps<{
  payload: InteractionPayload;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [result: { confirmed: boolean; input: Record<string, any>; reason?: string }];
  reject: [result: { confirmed: boolean; input: Record<string, any>; reason?: string }];
}>();

const reason = ref("");

const isEditable = computed(() => props.payload.plan?.editable !== false);

const steps = ref<InternalStep[]>(
  (props.payload.plan?.steps || []).map((s) => ({ ...s, _skipped: false })),
);

function moveStep(index: number, direction: number) {
  const target = index + direction;
  if (target < 0 || target >= steps.value.length) return;
  const arr = [...steps.value];
  [arr[index], arr[target]] = [arr[target], arr[index]];
  steps.value = arr;
}

function toggleSkip(index: number) {
  steps.value[index]._skipped = !steps.value[index]._skipped;
}

function handleSubmit() {
  const planResult = steps.value.map((s, i) => ({
    id: s.id,
    label: s.label,
    order: i,
    skipped: !!s._skipped,
  }));
  emit("submit", {
    confirmed: true,
    input: { action: "confirm", plan: planResult },
    reason: reason.value || undefined,
  });
}
</script>

<style scoped>
.plan-steps {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plan-step {
  display: flex;
  padding: 8px 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  transition: opacity 0.2s;
  align-items: flex-start;
  gap: 10px;
}

.plan-step.is-disabled {
  opacity: 0.45;
}

.step-index {
  display: flex;
  width: 22px;
  height: 22px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-done .step-index {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.status-running .step-index {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.step-check { font-size: 12px; }

.step-spinner {
  width: 10px;
  height: 10px;
  border: 2px solid var(--el-color-primary-light-5);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.step-skip { font-size: 12px; }

.step-body {
  flex: 1;
  min-width: 0;
}

.step-label {
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  color: var(--el-text-color-primary);
}

.step-desc {
  margin-top: 2px;
  font-size: 11px;
  line-height: 16px;
  color: var(--el-text-color-secondary);
}

.step-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.step-btn {
  display: flex;
  width: 22px;
  height: 22px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;
  align-items: center;
  justify-content: center;
}

.step-btn:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color);
}

.step-btn:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}
</style>
