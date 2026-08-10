<template>
  <section class="interaction-panel">
    <div class="interaction-main">
      <span class="interaction-badge">{{ stepTag }}</span>
      <div>
        <div class="interaction-title">{{ currentStep.title || "填写信息" }}</div>
        <div v-if="currentStep.description" class="interaction-tip">{{ currentStep.description }}</div>
      </div>
    </div>

    <!-- 步骤指示器 -->
    <div class="step-indicator">
      <span
        v-for="(_, i) in allSteps"
        :key="i"
        class="step-dot"
        :class="{ active: i === current, done: i < current }"
        @click="goToStep(i)"
      />
    </div>

    <!-- 当前步骤表单 -->
    <el-form label-position="top" class="step-form">
      <el-form-item
        v-for="field in currentFields"
        :key="field.name"
        :label="field.label"
        :required="field.required"
      >
        <el-switch
          v-if="field.type === 'boolean'"
          v-model="formData[field.name]"
        />
        <el-select
          v-else-if="field.type === 'select'"
          v-model="formData[field.name]"
          :placeholder="field.placeholder || '请选择'"
          filterable
        >
          <el-option
            v-for="opt in normalizeOptions(field.options)"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-date-picker
          v-else-if="field.type === 'date' || field.type === 'datetime'"
          v-model="formData[field.name]"
          :type="field.type === 'datetime' ? 'datetime' : 'date'"
          :placeholder="field.placeholder || '请选择时间'"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
        <el-input-number
          v-else-if="field.type === 'number'"
          v-model="formData[field.name]"
          controls-position="right"
        />
        <el-input
          v-else
          v-model="formData[field.name]"
          :type="field.type === 'textarea' ? 'textarea' : 'text'"
          :rows="field.type === 'textarea' ? 3 : undefined"
          :placeholder="field.placeholder || '请输入'"
        />
      </el-form-item>
    </el-form>

    <div class="interaction-actions">
      <el-button
        v-if="current > 0"
        size="small"
        text
        @click="goToStep(current - 1)"
      >
        上一步
      </el-button>
      <el-button size="small" text @click="$emit('reject', { confirmed: false, input: {}, reason: '' })">
        跳过
      </el-button>
      <el-button
        size="small"
        type="primary"
        :disabled="!canProceed"
        :loading="loading"
        @click="handleNext"
      >
        {{ isLast ? "提交" : "下一步" }}
      </el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import type { InteractionPayload, InteractionField } from "./types";

const props = defineProps<{
  payload: InteractionPayload;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [result: { confirmed: boolean; input: Record<string, any>; reason?: string }];
  reject: [result: { confirmed: boolean; input: Record<string, any>; reason?: string }];
}>();

const current = ref(0);
const formData = ref<Record<string, any>>({});

// 初始化表单数据
function initFormData() {
  const data: Record<string, any> = {};
  for (const step of allSteps.value) {
    for (const field of step.fields) {
      const norm = normalizeField(field);
      if (norm) {
        data[norm.name] = norm.defaultValue !== undefined
          ? norm.defaultValue
          : norm.type === "boolean" ? false : undefined;
      }
    }
  }
  formData.value = data;
}

const allSteps = computed(() => {
  if (props.payload.steps?.length) return props.payload.steps;
  // fallback: 单步 form
  return [{
    title: props.payload.label || "填写信息",
    description: undefined,
    fields: (props.payload.fields || []).map((f) => normalizeField(f) as any).filter(Boolean),
  }];
});

const currentStep = computed(() => allSteps.value[current.value] || allSteps.value[0]);
const currentFields = computed(() => {
  const step = currentStep.value;
  return (step.fields || []).map((f) => normalizeField(f)).filter(Boolean) as InteractionField[];
});

const isLast = computed(() => current.value >= allSteps.value.length - 1);
const stepTag = computed(() => `步骤 ${current.value + 1}/${allSteps.value.length}`);

const canProceed = computed(() => {
  return currentFields.value.every((field) => {
    if (!field.required) return true;
    const value = formData.value[field.name];
    return value !== undefined && value !== null && String(value).trim() !== "";
  });
});

function goToStep(index: number) {
  if (index >= 0 && index < allSteps.value.length) {
    current.value = index;
  }
}

function handleNext() {
  if (!canProceed.value) {
    ElMessage.warning("请填写必填项");
    return;
  }
  if (isLast.value) {
    emit("submit", {
      confirmed: true,
      input: { action: "answer", fields: { ...formData.value }, ...formData.value },
    });
  } else {
    current.value++;
  }
}

function normalizeField(field: any): InteractionField | null {
  if (!field || typeof field !== "object") return null;
  const name = String(field.name || field.key || "").trim();
  if (!name) return null;
  return {
    name,
    label: String(field.label || field.title || name).trim(),
    type: normalizeFieldType(field.type),
    required: field.required === true,
    placeholder: String(field.placeholder || "").trim(),
    defaultValue: field.defaultValue,
    options: Array.isArray(field.options) ? field.options : [],
  };
}

function normalizeFieldType(type: unknown): string {
  const t = String(type || "").trim().toLowerCase();
  return ["text", "textarea", "number", "boolean", "select", "date", "datetime"].includes(t) ? t : "text";
}

function normalizeOptions(raw?: Array<string | Record<string, any>>): Array<{ label: string; value: string }> {
  return (raw || []).map((opt) => {
    if (typeof opt === "string") return { label: opt, value: opt };
    const label = String(opt.label || opt.title || opt.value || "");
    const value = String(opt.value ?? opt.id ?? opt.key ?? label);
    return { label, value };
  }).filter((o) => o.value);
}

// 初始化
initFormData();
</script>

<style scoped>
.step-indicator {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 4px 0;
}

.step-dot {
  width: 8px;
  height: 8px;
  cursor: pointer;
  background: var(--el-border-color);
  border-radius: 50%;
  transition: background 0.2s, transform 0.2s;
}

.step-dot.active {
  background: var(--el-color-primary);
  transform: scale(1.3);
}

.step-dot.done {
  background: var(--el-color-primary-light-5);
}

.step-form {
  margin-top: 4px;
}

.step-form :deep(.el-form-item) {
  margin-bottom: 10px;
}

.step-form :deep(.el-form-item__label) {
  margin-bottom: 3px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.step-form :deep(.el-select),
.step-form :deep(.el-date-editor),
.step-form :deep(.el-input-number) {
  width: 100%;
}
</style>
