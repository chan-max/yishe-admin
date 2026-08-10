<template>
  <section class="interaction-panel">
    <!-- 问题描述/问题引导 -->
    <div v-if="payload.question" class="interaction-question">
      {{ payload.question }}
    </div>

    <!-- choice 选项 -->
    <template v-if="payload.type === 'choice'">
      <div class="choice-list">
        <button
          v-for="option in normalizedOptions"
          :key="option.value"
          class="choice-option"
          :class="{ active: isOptionSelected(option.value) }"
          type="button"
          @click="toggleChoice(option.value)"
        >
          <span class="choice-indicator" />
          <span class="choice-copy">
            <span>{{ option.label }}</span>
            <small v-if="option.description">{{ option.description }}</small>
          </span>
        </button>
      </div>
    </template>

    <!-- form 表单 -->
    <template v-else-if="payload.type === 'form'">
      <el-form label-position="top" class="interaction-form">
        <el-form-item
          v-for="field in normalizedFields"
          :key="field.name"
          :label="field.label"
          :required="field.required"
        >
          <el-switch v-if="field.type === 'boolean'" v-model="formData[field.name]" />
          <el-select
            v-else-if="field.type === 'select'"
            v-model="formData[field.name]"
            :placeholder="field.placeholder || '请选择'"
            filterable
          >
            <el-option
              v-for="opt in normalizeOpts(field.options)"
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
          <el-input-number v-else-if="field.type === 'number'" v-model="formData[field.name]" controls-position="right" />
          <el-input
            v-else
            v-model="formData[field.name]"
            :type="field.type === 'textarea' ? 'textarea' : 'text'"
            :rows="field.type === 'textarea' ? 3 : undefined"
            :placeholder="field.placeholder || '请输入'"
          />
        </el-form-item>
      </el-form>
    </template>

    <!-- feedback 反馈 -->
    <template v-else-if="payload.type === 'feedback'">
      <div v-if="normalizedOptions.length" class="feedback-actions">
        <button
          v-for="option in normalizedOptions"
          :key="option.value"
          class="feedback-option"
          :class="{ active: feedbackChoice === option.value }"
          type="button"
          @click="feedbackChoice = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <el-input
        v-model="feedbackText"
        type="textarea"
        :rows="2"
        placeholder="补充说明（可选）"
      />
    </template>

    <!-- input / clarify / 其他 -->
    <template v-else-if="payload.type !== 'confirm'">
      <el-input
        v-model="textInput"
        type="textarea"
        :rows="2"
        :placeholder="payload.placeholder || '请输入说明或答案'"
      />
    </template>

    <!-- confirm 备注 -->
    <el-input
      v-if="payload.type === 'confirm'"
      v-model="confirmReason"
      size="small"
      placeholder="补充说明（可选）"
    />

    <!-- 操作按钮 -->
    <div class="interaction-actions">
      <button
        class="action-btn action-btn--ghost"
        type="button"
        @click="$emit('reject', { confirmed: false, input: buildRejectInput(), reason: '' })"
      >
        {{ payload.type === "confirm" ? "取消" : "跳过" }}
      </button>
      <button
        class="action-btn action-btn--primary"
        type="button"
        :disabled="!canSubmit || loading"
        @click="handleSubmit"
      >
        {{ loading ? "处理中" : submitLabel }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { InteractionPayload, InteractionOption, InteractionField } from "./types";

const props = defineProps<{
  payload: InteractionPayload;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [result: { confirmed: boolean; input: Record<string, any>; reason?: string }];
  reject: [result: { confirmed: boolean; input: Record<string, any>; reason?: string }];
}>();

const confirmReason = ref("");
const textInput = ref("");
const feedbackChoice = ref("");
const feedbackText = ref("");
const choiceValue = ref("");
const choiceList = ref<string[]>([]);
const formData = ref<Record<string, any>>({});

function init() {
  textInput.value = String(props.payload.defaultValue ?? "");
  const opts = normalizedOptions.value;
  if (props.payload.type === "feedback" && opts.length) {
    feedbackChoice.value = opts[0].value;
  }
  if (props.payload.type === "form") {
    const f: Record<string, any> = {};
    for (const field of normalizedFields.value) {
      f[field.name] = field.defaultValue !== undefined
        ? field.defaultValue
        : field.type === "boolean" ? false : undefined;
    }
    formData.value = f;
  }
}

const normalizedOptions = computed<InteractionOption[]>(() => {
  const raw = props.payload.options || [];
  return raw.map((opt, i) => {
    if (typeof opt === "string") return { label: opt, value: opt };
    const label = String((opt as any).label || (opt as any).title || (opt as any).name || (opt as any).value || `选项 ${i + 1}`);
    const value = String((opt as any).value ?? (opt as any).id ?? (opt as any).key ?? label);
    return { label, value, description: String((opt as any).description || "").trim() };
  }).filter((o) => o.value);
});

const normalizedFields = computed<InteractionField[]>(() =>
  (props.payload.fields || []).map((f, i) => {
    const name = String(f.name || f.key || `field_${i + 1}`).trim();
    if (!name) return null;
    return {
      name,
      label: String(f.label || f.title || name).trim(),
      type: normalizeFieldType(f.type),
      required: f.required === true,
      placeholder: String(f.placeholder || "").trim(),
      defaultValue: f.defaultValue,
      options: Array.isArray(f.options) ? f.options : [],
    };
  }).filter(Boolean) as InteractionField[],
);

const submitLabel = computed(() => {
  switch (props.payload.type) {
    case "confirm": return "确认继续";
    case "choice": return "提交选择";
    case "form": return "提交信息";
    case "feedback": return "提交反馈";
    default: return "继续处理";
  }
});

const canSubmit = computed(() => {
  switch (props.payload.type) {
    case "choice": return props.payload.multiple ? choiceList.value.length > 0 : Boolean(choiceValue.value);
    case "form": return normalizedFields.value.every((f) => !f.required || (formData.value[f.name] !== undefined && String(formData.value[f.name]).trim() !== ""));
    case "input":
    case "clarify": return Boolean(textInput.value.trim());
    default: return true;
  }
});

function isOptionSelected(value: string) {
  return props.payload.multiple ? choiceList.value.includes(value) : choiceValue.value === value;
}

function toggleChoice(value: string) {
  if (props.payload.multiple) {
    choiceList.value = isOptionSelected(value)
      ? choiceList.value.filter((v) => v !== value)
      : [...choiceList.value, value];
  } else {
    choiceValue.value = value;
  }
}

function buildRejectInput(): Record<string, any> {
  const base = props.payload.input || {};
  return { ...base, action: "reject" };
}

function handleSubmit() {
  if (!canSubmit.value) return;
  const input: Record<string, any> = { ...(props.payload.input || {}) };

  switch (props.payload.type) {
    case "confirm":
      input.action = "confirm";
      break;
    case "choice":
      input.action = "answer";
      input.selected = props.payload.multiple ? choiceList.value : choiceValue.value;
      input.value = input.selected;
      break;
    case "form":
      input.action = "answer";
      input.fields = { ...formData.value };
      Object.assign(input, formData.value);
      break;
    case "feedback":
      input.action = "feedback";
      input.selected = feedbackChoice.value;
      input.feedback = feedbackText.value.trim();
      break;
    default:
      input.action = "answer";
      input.value = textInput.value.trim();
      input.text = input.value;
  }

  emit("submit", { confirmed: true, input, reason: confirmReason.value || undefined });
}

function normalizeFieldType(type: unknown): string {
  const t = String(type || "").trim().toLowerCase();
  return ["text", "textarea", "number", "boolean", "select", "date", "datetime"].includes(t) ? t : "text";
}

function normalizeOpts(raw?: Array<string | Record<string, any>>): Array<{ label: string; value: string }> {
  return (raw || []).map((opt) => {
    if (typeof opt === "string") return { label: opt, value: opt };
    const label = String((opt as any).label || (opt as any).value || "");
    const value = String((opt as any).value ?? label);
    return { label, value };
  }).filter((o) => o.value);
}

init();
</script>

<style scoped>
.interaction-panel {
  display: flex;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  flex-direction: column;
  gap: 8px;
}

.interaction-question {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  word-break: break-word;
  white-space: pre-wrap;
}

.choice-list {
  display: grid;
  gap: 4px;
}

.choice-option {
  display: flex;
  width: 100%;
  min-height: 32px;
  padding: 6px 10px;
  color: var(--el-text-color-primary);
  text-align: left;
  cursor: pointer;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  transition: all .12s;
  align-items: center;
  gap: 8px;
}

.choice-option:hover,
.choice-option.active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.choice-indicator {
  width: 14px;
  height: 14px;
  border: 2px solid var(--el-border-color);
  border-radius: 50%;
  transition: border-color .15s, background .15s;
  flex-shrink: 0;
}

.choice-option.active .choice-indicator {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.choice-copy {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  font-size: 12px;
  line-height: 16px;
}

.choice-copy small {
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.interaction-form :deep(.el-form-item) {
  margin-bottom: 6px;
}

.interaction-form :deep(.el-form-item__label) {
  margin-bottom: 2px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.interaction-form :deep(.el-select),
.interaction-form :deep(.el-date-editor),
.interaction-form :deep(.el-input-number) {
  width: 100%;
}

.feedback-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.feedback-option {
  min-height: 28px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  transition: all .12s;
}

.feedback-option:hover,
.feedback-option.active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

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
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  transition: all .12s;
}

.action-btn--ghost {
  color: var(--el-text-color-secondary);
  background: transparent;
}

.action-btn--ghost:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color);
}

.action-btn--primary {
  color: #fff;
  background: var(--el-color-primary);
}

.action-btn--primary:hover:not(:disabled) { opacity: .85; }

.action-btn--primary:disabled { cursor: not-allowed; opacity: .4; }
</style>
