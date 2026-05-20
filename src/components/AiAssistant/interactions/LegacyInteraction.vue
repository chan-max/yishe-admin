<template>
  <section class="interaction-panel">
    <div class="interaction-main">
      <span class="interaction-badge">{{ tag }}</span>
      <div>
        <div class="interaction-title">{{ payload.label || "需要用户参与" }}</div>
        <div class="interaction-tip">{{ hint }}</div>
        <pre class="interaction-question">{{ payload.question }}</pre>
      </div>
    </div>

    <!-- choice -->
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

    <!-- form -->
    <template v-else-if="payload.type === 'form'">
      <el-form label-position="top" class="interaction-form">
        <el-form-item
          v-for="field in normalizedFields"
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
    </template>

    <!-- feedback -->
    <template v-else-if="payload.type === 'feedback'">
      <div class="feedback-actions">
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
        placeholder="可选：补充反馈"
      />
    </template>

    <!-- input / clarify / 其他 -->
    <template v-else-if="payload.type !== 'confirm'">
      <el-input
        v-model="textInput"
        type="textarea"
        :rows="2"
        :placeholder="payload.placeholder || '请输入'"
      />
    </template>

    <!-- confirm -->
    <el-input
      v-if="payload.type === 'confirm'"
      v-model="confirmReason"
      size="small"
      placeholder="可选：给这次确认补充一句备注"
    />

    <div class="interaction-actions">
      <el-button size="small" text @click="$emit('reject', { confirmed: false, input: buildRejectInput(), reason: '' })">
        {{ payload.type === "confirm" ? "取消" : "跳过" }}
      </el-button>
      <el-button
        size="small"
        type="primary"
        :disabled="!canSubmit"
        :loading="loading"
        @click="handleSubmit"
      >
        {{ submitLabel }}
      </el-button>
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

// 初始化
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

const tag = computed(() => {
  switch (props.payload.type) {
    case "choice": return "请选择";
    case "form": return "请填写";
    case "feedback": return "请反馈";
    case "input":
    case "clarify": return "请补充";
    default: return "需要确认";
  }
});

const hint = computed(() => {
  switch (props.payload.type) {
    case "choice": return props.payload.multiple ? "可多选，选择完成后提交。" : "请选择一个选项后继续。";
    case "form": return "补齐必要信息后，助手会继续执行。";
    case "feedback": return "选择一个反馈，也可以补充说明。";
    case "confirm": return "确认后继续执行，取消会终止这一步。";
    default: return "补充信息后，助手会接着处理。";
  }
});

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
.interaction-question {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.55;
  color: var(--el-text-color-regular);
}

.choice-list {
  display: grid;
  gap: 6px;
}

.choice-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  min-height: 36px;
  padding: 8px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-primary);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.16s, color 0.16s;
}

.choice-option:hover,
.choice-option.active {
  background: transparent;
  color: var(--el-color-primary);
}

.choice-indicator {
  width: 14px;
  height: 14px;
  margin-top: 2px;
  border-radius: 50%;
  border: 2px solid var(--el-border-color);
  flex-shrink: 0;
  transition: border-color 0.2s, background 0.2s;
}

.choice-option.active .choice-indicator {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
}

.choice-copy {
  display: grid;
  gap: 1px;
  min-width: 0;
  font-size: 12px;
  line-height: 18px;
}

.choice-copy small {
  display: block;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.interaction-form :deep(.el-form-item) {
  margin-bottom: 8px;
}

.interaction-form :deep(.el-form-item__label) {
  margin-bottom: 3px;
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
  gap: 6px;
}

.feedback-option {
  min-height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
}

.feedback-option:hover,
.feedback-option.active {
  background: transparent;
  color: var(--el-color-primary);
}
</style>
