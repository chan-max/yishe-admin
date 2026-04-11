<template>
  <div class="small-feature-field" :class="{ 'is-error': !!error }">
    <div class="small-feature-field__label">
      <span>{{ field.label }}</span>
      <span v-if="field.required" class="small-feature-field__required">*</span>
    </div>

    <template v-if="resolvedComponent === 'array-text'">
      <el-input
        :model-value="stringValue"
        type="textarea"
        :rows="field.rows || 4"
        :placeholder="field.placeholder || ''"
        @update:model-value="handleInput"
        @blur="emit('blur')"
      />
    </template>

    <template v-else-if="resolvedComponent === 'select'">
      <el-select
        :model-value="modelValue"
        class="small-feature-field__control"
        :placeholder="field.placeholder || `请选择${field.label}`"
        @update:model-value="handleInput"
        @blur="emit('blur')"
      >
        <el-option
          v-for="option in normalizedOptions"
          :key="String(option.value)"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
    </template>

    <template v-else-if="resolvedComponent === 'switch'">
      <el-switch
        :model-value="!!modelValue"
        :active-text="field.switchLabel || field.description || `启用${field.label}`"
        @update:model-value="handleInput"
        @change="emit('blur')"
      />
    </template>

    <template v-else>
      <el-input
        :model-value="stringValue"
        :type="resolvedInputType"
        :placeholder="field.placeholder || ''"
        @update:model-value="handleInput"
        @blur="emit('blur')"
      />
    </template>

    <div v-if="error" class="small-feature-field__hint small-feature-field__hint--error">
      {{ error }}
    </div>
    <div v-else-if="hintText" class="small-feature-field__hint">
      {{ hintText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  field: Record<string, any>;
  modelValue?: string | number | boolean | null | unknown[] | Record<string, any>;
  error?: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: unknown): void;
  (event: "blur"): void;
}>();

const resolvedComponent = computed(() => {
  const component = String(props.field?.component || "").trim();
  if (component) {
    return component;
  }

  const type = String(props.field?.type || "text").trim();
  if (type === "boolean") return "switch";
  if (type === "password") return "password";
  if (type === "select") return "select";
  if (type === "array-text") return "array-text";
  return "input";
});

const resolvedInputType = computed(() => {
  if (resolvedComponent.value === "password") return "password";
  if (resolvedComponent.value === "url") return "url";
  if (resolvedComponent.value === "input-number") return "number";
  return String(props.field?.inputType || "text").trim() || "text";
});

const normalizedOptions = computed(() =>
  Array.isArray(props.field?.options)
    ? props.field.options.map((item: Record<string, any>) => ({
        label: String(item?.label || item?.value || "").trim(),
        value: item?.value ?? "",
      }))
    : [],
);

const stringValue = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.join("\n");
  }
  if (props.modelValue === undefined || props.modelValue === null) {
    return "";
  }
  return String(props.modelValue);
});

const hintText = computed(() => {
  const description = String(props.field?.description || "").trim();
  return description || "";
});

function handleInput(value: unknown) {
  emit("update:modelValue", value);
}
</script>

<style scoped lang="scss">
.small-feature-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.small-feature-field__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.small-feature-field__required {
  color: var(--el-color-danger);
}

.small-feature-field__control {
  width: 100%;
}

.small-feature-field__hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.small-feature-field__hint--error {
  color: var(--el-color-danger);
}
</style>
