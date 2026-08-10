<template>
  <el-dialog
    :model-value="modelValue"
    :title="currentTask?.id ? '编辑采集任务' : '新建采集任务'"
    fullscreen
    append-to-body
    class="ecom-collect-task-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="task-dialog-shell">
      <div class="task-dialog-layout">
        <div class="task-dialog-main">
          <CompactNotice
            v-if="!catalog.platforms.length"
            type="warning"
            title="当前还没有平台定义"
            description="请先让服务端完成平台目录同步，浏览器自动化环境会在执行任务时再单独选择。"
            class="task-dialog-alert"
          />

          <CompactNotice
            v-else-if="taskTypeUnavailableReason"
            type="warning"
            title="当前任务类型暂不可执行"
            :description="taskTypeUnavailableReason"
            class="task-dialog-alert"
          />

          <el-form label-position="top" class="task-dialog-form">
            <el-form-item label="任务名称" required>
              <el-input
                v-model="taskForm.name"
                placeholder="例如：Amazon 无线耳机搜索采集"
              />
            </el-form-item>

            <el-row :gutter="20">
              <el-col :xs="24" :lg="12">
                <el-form-item label="平台" required>
                  <el-select
                    v-model="taskForm.platform"
                    placeholder="请选择平台"
                    filterable
                    @change="handlePlatformChange"
                  >
                    <el-option
                      v-for="item in catalog.platforms"
                      :key="item.value"
                      :label="buildPlatformOptionLabel(item)"
                      :value="item.value"
                    />
                  </el-select>
                  <div v-if="selectedPlatform?.reason" class="form-hint">
                    {{ selectedPlatform.reason }}
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="12">
                <el-form-item label="任务类型" required>
                  <el-select
                    v-model="taskForm.taskType"
                    placeholder="请选择任务类型"
                    filterable
                    @change="handleTaskTypeChange"
                  >
                    <el-option
                      v-for="item in availableTaskTypeOptions"
                      :key="item.value"
                      :label="buildTaskTypeOptionLabel(item)"
                      :value="item.value"
                    />
                  </el-select>
                  <div
                    v-if="selectedTaskType?.description"
                    class="form-hint"
                  >
                    <div v-if="selectedTaskType?.description">
                      {{ selectedTaskType.description }}
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col
                v-for="field in schemaFields"
                :key="field.key"
                :xs="24"
                :lg="resolveFieldLgSpan(field)"
              >
                <el-form-item
                  v-if="field.component !== 'switch'"
                  :label="field.label"
                  :required="field.required"
                >
                  <el-select
                    v-if="field.component === 'select'"
                    :model-value="getFieldValue(field)"
                    filterable
                    clearable
                    :placeholder="field.placeholder || `请选择${field.label}`"
                    @update:model-value="setFieldValue(field, $event)"
                  >
                    <el-option
                      v-for="option in field.options || []"
                      :key="String(option.value)"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>

                  <el-input-number
                    v-else-if="field.component === 'input-number'"
                    :model-value="getFieldValue(field)"
                    :min="field.min"
                    :max="field.max"
                    :step="field.step || 1"
                    controls-position="right"
                    @update:model-value="setFieldValue(field, $event)"
                  />

                  <el-input
                    v-else-if="
                      field.component === 'textarea' ||
                      field.component === 'array-text' ||
                      field.component === 'json'
                    "
                    :model-value="getFieldValue(field)"
                    type="textarea"
                    :rows="field.rows || (field.component === 'json' ? 8 : 4)"
                    :placeholder="field.placeholder || ''"
                    @update:model-value="setFieldValue(field, $event)"
                  />

                  <el-input
                    v-else
                    :model-value="getFieldValue(field)"
                    :placeholder="field.placeholder || ''"
                    @update:model-value="setFieldValue(field, $event)"
                  />

                  <div
                    v-if="field.description || (field.examples && field.examples.length)"
                    class="form-hint"
                  >
                    <div v-if="field.description">{{ field.description }}</div>
                    <div
                      v-if="field.examples && field.examples.length"
                      class="form-hint__examples"
                    >
                      例如：{{ field.examples.map(formatExample).join(" / ") }}
                    </div>
                  </div>
                </el-form-item>

                <el-form-item
                  v-else
                  class="task-dialog-form-item--switch"
                  :required="field.required"
                >
                  <div class="field-toggle-panel">
                    <div class="field-toggle-panel__main">
                      <div class="field-toggle-panel__title">
                        {{ field.label }}
                      </div>
                      <div
                        v-if="field.description || (field.examples && field.examples.length)"
                        class="field-toggle-panel__desc"
                      >
                        <div v-if="field.description">{{ field.description }}</div>
                        <div
                          v-if="field.examples && field.examples.length"
                          class="form-hint__examples"
                        >
                          例如：{{ field.examples.map(formatExample).join(" / ") }}
                        </div>
                      </div>
                    </div>

                    <div class="field-toggle-panel__action">
                      <el-switch
                        class="field-switch-control"
                        :model-value="!!getFieldValue(field)"
                        @update:model-value="setFieldValue(field, $event)"
                      />
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="附加配置 / 未建模参数">
              <el-input
                v-model="advancedJsonText"
                type="textarea"
                :rows="8"
                placeholder='{"sort":"sales"}'
              />
              <div class="form-hint">
                用于保留当前任务类型 schema 尚未覆盖的配置；留空则只保存已建模字段。
              </div>
            </el-form-item>

          </el-form>
        </div>

        <div class="task-dialog-side">
          <div class="capability-card">
            <div class="capability-card__header">
              <div class="capability-card__title">请求预览</div>
            </div>

            <div class="capability-card__body">
              <div class="capability-block">
                <div class="capability-block__label">请求体</div>
                <pre class="capability-example__code">{{
                  liveRequestPreviewText
                }}</pre>
              </div>

              <div v-if="currentTask?.id" class="capability-block">
                <div class="capability-block__label">路径参数</div>
                <div class="capability-kv">
                  <span>编辑保存时会使用当前任务 ID：</span>
                  <code>{{ currentTask.id }}</code>
                </div>
              </div>

              <div v-if="liveRequestPreviewError" class="capability-warning">
                {{ liveRequestPreviewError }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="task-dialog-footer-bar">
        <el-button @click="emit('update:modelValue', false)">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import CompactNotice from "@/components/CompactNotice/index.vue";
import {
  createEcomPlatformCollectTask,
  updateEcomPlatformCollectTask,
  type EcomCollectFieldSchema,
  type EcomCollectPlatformSchema,
  type EcomCollectTaskTypeSchema,
  type EcomPlatformCollectCatalog,
  type EcomPlatformCollectTask,
} from "@/api/operation/ecomPlatformCollect";
import {
  getCapabilityStatusLabel,
  getPlatformSchema,
  getSceneSchema,
  getTaskTypeSchema,
  getTaskTypeSchemas,
  resolveTaskTypeValue,
} from "../shared";

const props = defineProps<{
  modelValue: boolean;
  catalog: EcomPlatformCollectCatalog;
  task?: EcomPlatformCollectTask | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const submitting = ref(false);
const hydratingForm = ref(false);
const advancedJsonText = ref("");
const fieldValues = reactive<Record<string, any>>({});

const taskForm = reactive({
  id: "",
  name: "",
  platform: "",
  taskType: "",
});

const currentTask = computed(() => props.task || null);

const selectedPlatform = computed(() =>
  getPlatformSchema(props.catalog, taskForm.platform),
);

const availableTaskTypeOptions = computed<EcomCollectTaskTypeSchema[]>(() =>
  getTaskTypeSchemas(props.catalog, taskForm.platform),
);

const selectedTaskType = computed(() =>
  getTaskTypeSchema(props.catalog, taskForm.platform, taskForm.taskType),
);

const resolvedCollectScene = computed(
  () => String(selectedTaskType.value?.collectScene || "").trim(),
);

const selectedScene = computed(() =>
  getSceneSchema(props.catalog, taskForm.platform, resolvedCollectScene.value),
);

const schemaFields = computed(() => {
  if (Array.isArray(selectedTaskType.value?.fields) && selectedTaskType.value?.fields?.length) {
    return selectedTaskType.value.fields;
  }
  return Array.isArray(selectedScene.value?.fields) ? selectedScene.value.fields : [];
});

const taskTypeUnavailableReason = computed(() => {
  if (selectedTaskType.value && selectedTaskType.value.runnable === false) {
    return (
      selectedTaskType.value.reason ||
      `${selectedTaskType.value.label} 当前暂不可执行`
    );
  }
  if (selectedScene.value && selectedScene.value.runnable === false) {
    return (
      selectedScene.value.reason ||
      `${selectedScene.value.label} 当前暂不可执行`
    );
  }
  if (
    !selectedTaskType.value &&
    selectedPlatform.value &&
    selectedPlatform.value.runnable === false
  ) {
    return (
      selectedPlatform.value.reason ||
      `${selectedPlatform.value.label} 当前暂不可执行`
    );
  }
  return "";
});

const canSubmit = computed(
  () =>
    !!selectedPlatform.value &&
    !!selectedTaskType.value &&
    !!resolvedCollectScene.value &&
    selectedTaskType.value.runnable !== false &&
    (!selectedScene.value || selectedScene.value.runnable !== false),
);

const buildLiveRequestBody = (allowInvalid = false) => {
  return {
    name: taskForm.name.trim(),
    platform: taskForm.platform,
    taskType: taskForm.taskType,
    configData: buildDraftConfigData(allowInvalid),
  };
};

const liveRequestPreview = computed(() => {
  try {
    return {
      body: buildLiveRequestBody(false),
      error: "",
    };
  } catch (error: any) {
    return {
      body: buildLiveRequestBody(true),
      error: error?.message || "当前仍有未完成或格式不正确的参数",
    };
  }
});

const liveRequestPreviewText = computed(() =>
  formatPayloadExample(liveRequestPreview.value.body),
);

const liveRequestPreviewError = computed(() => {
  if (!liveRequestPreview.value.error) {
    return "";
  }
  return `当前参数还不能直接保存：${liveRequestPreview.value.error}`;
});

const resetTaskForm = () => {
  taskForm.id = "";
  taskForm.name = "";
  taskForm.platform = "";
  taskForm.taskType = "";
  advancedJsonText.value = "";
  replaceFieldValues({});
};

const replaceFieldValues = (nextValues: Record<string, any>) => {
  Object.keys(fieldValues).forEach((key) => {
    delete fieldValues[key];
  });
  Object.assign(fieldValues, nextValues);
};

const formatPayloadExample = (value: any) => {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return String(value ?? "");
  }
};

const formatExample = (value: any) => {
  if (typeof value === "string") {
    return value;
  }
  return formatPayloadExample(value);
};

const buildPlatformOptionLabel = (platform: EcomCollectPlatformSchema) => {
  return `${platform.label} · ${getCapabilityStatusLabel(platform.status)}`;
};

const buildTaskTypeOptionLabel = (taskType: EcomCollectTaskTypeSchema) => {
  const availabilityLabel = taskType.availability
    ? getCapabilityStatusLabel(taskType.availability)
    : "";
  return availabilityLabel ? `${taskType.label} · ${availabilityLabel}` : taskType.label;
};

const resolveFieldLgSpan = (field: EcomCollectFieldSchema) => {
  if (
    field.component === "textarea" ||
    field.component === "array-text" ||
    field.component === "json"
  ) {
    return 24;
  }
  return 12;
};

const toFieldUiValue = (field: EcomCollectFieldSchema, value: any) => {
  if (field.component === "array-text") {
    if (Array.isArray(value)) {
      return value.join("\n");
    }
    return String(value || "");
  }

  if (field.component === "json") {
    if (value === undefined || value === null || value === "") {
      return "";
    }
    if (typeof value === "string") {
      return value;
    }
    return formatPayloadExample(value);
  }

  if (field.component === "input-number") {
    if (value === undefined || value === null || value === "") {
      return field.defaultValue ?? null;
    }
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  if (field.component === "switch") {
    return value === true;
  }

  if (value === undefined || value === null) {
    if (field.defaultValue !== undefined) {
      return field.defaultValue;
    }
    return "";
  }

  return value;
};

const fromFieldUiValue = (
  field: EcomCollectFieldSchema,
  value: any,
  options?: { allowInvalid?: boolean },
) => {
  if (field.component === "array-text") {
    return String(value || "")
      .split(/[\n,，]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (field.component === "json") {
    const text = String(value || "").trim();
    if (!text) {
      return undefined;
    }
    try {
      return JSON.parse(text);
    } catch {
      if (options?.allowInvalid) {
        return undefined;
      }
      throw new Error(`${field.label} JSON 格式不正确`);
    }
  }

  if (field.component === "input-number") {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return undefined;
    }
    return field.valueType === "integer" ? Math.floor(numericValue) : numericValue;
  }

  if (field.component === "switch") {
    return !!value;
  }

  const text = String(value || "").trim();
  return text || undefined;
};

const isFieldEmpty = (value: any) => {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
};

const parseAdvancedJson = (allowInvalid = false) => {
  const text = advancedJsonText.value.trim();
  if (!text) {
    return {};
  }
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("附加配置必须是 JSON 对象");
    }
    return parsed;
  } catch {
    if (allowInvalid) {
      return {};
    }
    throw new Error("附加配置 JSON 格式不正确");
  }
};

const buildDraftConfigData = (allowInvalid = false) => {
  const draft: Record<string, any> = {
    ...parseAdvancedJson(allowInvalid),
  };

  schemaFields.value.forEach((field) => {
    try {
      const resolved = fromFieldUiValue(field, fieldValues[field.key], {
        allowInvalid,
      });
      if (resolved !== undefined) {
        draft[field.key] = resolved;
      }
    } catch {
      if (!allowInvalid) {
        throw new Error(`${field.label} 格式不正确`);
      }
    }
  });

  return draft;
};

const syncFieldValuesFromConfig = (configData: Record<string, any> = {}) => {
  const nextValues: Record<string, any> = {};
  const activeFieldKeys = new Set<string>();

  schemaFields.value.forEach((field) => {
    activeFieldKeys.add(field.key);
    nextValues[field.key] = toFieldUiValue(field, configData[field.key]);
  });

  replaceFieldValues(nextValues);

  const extraConfig = Object.fromEntries(
    Object.entries(configData || {}).filter(
      ([key, value]) => !activeFieldKeys.has(key) && value !== undefined,
    ),
  );

  advancedJsonText.value = Object.keys(extraConfig).length
    ? JSON.stringify(extraConfig, null, 2)
    : "";
};

const getFieldValue = (field: EcomCollectFieldSchema) => {
  return fieldValues[field.key];
};

const setFieldValue = (field: EcomCollectFieldSchema, value: any) => {
  fieldValues[field.key] = value;
};

const syncTaskTypeSelection = (preferredTaskType?: string | null) => {
  const taskTypes = getTaskTypeSchemas(props.catalog, taskForm.platform);
  const normalizedPreferred = resolveTaskTypeValue(
    taskForm.platform,
    preferredTaskType ?? taskForm.taskType,
  );
  const matchedTaskType =
    taskTypes.find((item) => item.value === normalizedPreferred) || null;
  const fallbackTaskType = matchedTaskType || taskTypes[0] || null;

  taskForm.taskType = fallbackTaskType?.value || "";
};

const validateTaskForm = () => {
  if (!taskForm.name.trim()) {
    throw new Error("请填写任务名称");
  }
  if (!taskForm.platform) {
    throw new Error("请选择平台");
  }
  if (!taskForm.taskType) {
    throw new Error("请选择任务类型");
  }
  if (!selectedTaskType.value) {
    throw new Error("当前平台缺少可用任务类型定义");
  }
  if (selectedTaskType.value.runnable === false) {
    throw new Error(
      selectedTaskType.value.reason ||
        `${selectedTaskType.value.label} 当前暂不可执行`,
    );
  }
  if (selectedScene.value?.runnable === false) {
    throw new Error(
      selectedScene.value.reason ||
        `${selectedScene.value.label} 当前暂不可执行`,
    );
  }

  const configData = buildDraftConfigData(false);

  const missingField = schemaFields.value.find(
    (field) => field.required && isFieldEmpty(configData[field.key]),
  );

  if (missingField) {
    throw new Error(`请填写 ${missingField.label}`);
  }

  return configData;
};

const loadTaskToForm = () => {
  hydratingForm.value = true;
  resetTaskForm();

  if (!currentTask.value) {
    hydratingForm.value = false;
    return;
  }

  const task = currentTask.value;
  taskForm.id = task.id;
  taskForm.name = task.name;
  taskForm.platform = task.platform;
  taskForm.taskType = resolveTaskTypeValue(
    task.platform,
    task.taskType,
  );
  syncTaskTypeSelection(taskForm.taskType);
  syncFieldValuesFromConfig((task.configData || {}) as Record<string, any>);
  hydratingForm.value = false;
};

const handlePlatformChange = (platform: string) => {
  taskForm.platform = platform;
  syncTaskTypeSelection(taskForm.taskType);
};

const handleTaskTypeChange = (taskType: string) => {
  taskForm.taskType = taskType;
};

const handleSubmit = async () => {
  submitting.value = true;
  try {
    const configData = validateTaskForm();
    const payload = {
      name: taskForm.name.trim(),
      platform: taskForm.platform,
      taskType: taskForm.taskType,
      configData,
    };

    if (taskForm.id) {
      await updateEcomPlatformCollectTask(taskForm.id, payload);
      ElMessage.success("任务已更新");
    } else {
      await createEcomPlatformCollectTask(payload);
      ElMessage.success("任务已创建");
    }

    emit("update:modelValue", false);
    emit("success");
  } catch (error: any) {
    ElMessage.error(error?.message || "保存任务失败");
  } finally {
    submitting.value = false;
  }
};

watch(
  () => [taskForm.platform, taskForm.taskType],
  () => {
    if (!props.modelValue || hydratingForm.value) {
      return;
    }
    syncFieldValuesFromConfig(buildDraftConfigData(true));
  },
  { flush: "post" },
);

watch(
  () => [props.modelValue, props.task, props.catalog.platforms.length],
  ([visible]) => {
    if (visible) {
      loadTaskToForm();
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.ecom-collect-task-dialog :deep(.el-dialog) {
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: 0;
  border-radius: 0;
}

.ecom-collect-task-dialog :deep(.el-dialog__header) {
  padding: 18px 28px 14px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.ecom-collect-task-dialog :deep(.el-dialog__body) {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.ecom-collect-task-dialog :deep(.el-dialog__footer) {
  padding: 0;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  flex: 0 0 auto;
}

.task-dialog-shell {
  height: 100%;
  padding: 24px 28px 28px;
  overflow: auto;
  box-sizing: border-box;
}

.task-dialog-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
  gap: 20px;
  min-height: 100%;
}

.task-dialog-main,
.task-dialog-side {
  min-width: 0;
}

.task-dialog-alert {
  margin-bottom: 18px;
}

.task-dialog-form :deep(.el-form-item) {
  margin-bottom: 22px;
}

.task-dialog-form :deep(.el-form-item__label) {
  padding-bottom: 8px;
}

.task-dialog-form :deep(.task-dialog-form-item--switch .el-form-item__content) {
  display: block;
  line-height: normal;
}

.task-dialog-form :deep(.el-input),
.task-dialog-form :deep(.el-select),
.task-dialog-form :deep(.el-input-number) {
  width: 100%;
}

.field-toggle-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 44px;
}

.field-toggle-panel__main {
  flex: 1;
  min-width: 0;
}

.field-toggle-panel__title {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--el-text-color-primary);
}

.field-toggle-panel__desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.field-toggle-panel__action {
  display: inline-flex;
  align-items: center;
  align-self: center;
}

.field-switch-control {
  display: inline-flex;
  align-items: center;
}

.capability-card {
  position: sticky;
  top: 0;
  padding: 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgb(15 23 42 / 6%);
}

.capability-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.capability-card__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.capability-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.capability-card__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.capability-card__placeholder {
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.capability-warning {
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-color-warning-dark-2);
  background: var(--el-color-warning-light-9);
  border-radius: 10px;
}

.capability-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.capability-block__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.capability-block__text {
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.capability-block__text--muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.capability-kv {
  display: flex;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  flex-direction: column;
  gap: 4px;
}

.capability-kv code {
  padding: 8px 10px;
  font-size: 12px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
  border-radius: 10px;
  overflow-wrap: anywhere;
}

.capability-example__code {
  padding: 12px;
  margin: 10px 0 0;
  overflow: auto;
  font-size: 12px;
  line-height: 1.65;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color);
  border-radius: 10px;
}

.task-dialog-footer-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-height: 76px;
  padding: 14px 28px 18px;
  box-sizing: border-box;
}

.form-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  overflow-wrap: anywhere;
}

.form-hint__examples {
  margin-top: 4px;
}

@media (width <= 1200px) {
  .task-dialog-layout {
    grid-template-columns: 1fr;
  }

  .capability-card {
    position: static;
  }
}

@media (width <= 768px) {
  .task-dialog-shell {
    padding: 16px;
  }

  .ecom-collect-task-dialog :deep(.el-dialog__header) {
    padding: 16px 16px 12px;
  }

  .task-dialog-footer-bar {
    min-height: 68px;
    padding: 12px 16px 16px;
  }
}
</style>
