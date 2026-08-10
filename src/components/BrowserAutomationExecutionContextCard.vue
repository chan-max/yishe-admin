<template>
  <div class="execution-context-card">
    <div v-if="title || description" class="execution-context-card__header">
      <div>
        <div class="execution-context-card__title">{{ title }}</div>
        <div v-if="description" class="execution-context-card__description">{{ description }}</div>
      </div>

      <el-button text size="small" :loading="loading" @click="refreshClients">
        刷新环境
      </el-button>
    </div>

    <el-form label-position="top" class="execution-context-card__form">
      <el-row :gutter="16">
        <el-col :xs="24" :lg="12">
          <el-form-item label="客户端节点" required>
            <el-select
              v-model="form.clientId"
              filterable
              clearable
              placeholder="请选择客户端"
              :loading="loading"
            >
              <el-option
                v-for="item in clientOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <div class="execution-context-card__option">
                  <span>{{ item.label }}</span>
                  <span class="execution-context-card__option-meta">{{ item.meta || item.hint }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :lg="12">
          <el-form-item label="浏览器环境 / Profile" required>
            <el-select
              v-model="form.profileId"
              filterable
              clearable
              placeholder="请选择浏览器环境"
              :disabled="!form.clientId"
              :loading="loading"
            >
              <el-option
                v-for="item in profileOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <div class="execution-context-card__option">
                  <span>{{ item.label }}</span>
                  <span class="execution-context-card__option-meta">{{ item.meta }}</span>
                </div>
              </el-option>
            </el-select>
            <div class="execution-context-card__hint">
              必须选择一个明确的浏览器环境后才会执行任务。
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :xs="24" :lg="24">
          <el-form-item :label="taskType ? '执行标识' : '目标平台'">
            <div class="execution-context-card__meta-box">
              <span>{{ platform || "-" }}</span>
              <code v-if="taskType" class="execution-context-card__meta-code">{{ taskType }}</code>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="环境备注">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="例如：优先复用已登录 Amazon US 买家账号的环境"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  normalizeBrowserAutomationProfilesPayload,
  useBrowserAutomationExecutionContext,
} from "@/services/browserAutomationExecutionContext";
import {
  createDefaultBrowserAutomationExecutionContext,
  normalizeBrowserAutomationExecutionContext,
  type BrowserAutomationExecutionContext,
} from "@/views/operation/ecom-data/shared";

const props = withDefaults(
  defineProps<{
    modelValue?: Record<string, any> | null;
    title?: string;
    description?: string;
    platform?: string;
    taskType?: string;
  }>(),
  {
    modelValue: null,
    title: "执行环境",
    description: "",
    platform: "",
    taskType: "",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: BrowserAutomationExecutionContext): void;
}>();

const {
  loading,
  refreshClients,
  clientOptions,
  profileOptions,
  selectedClientId,
  selectedClient,
  selectedProfileValue,
  setProfilesPayload,
  resetProfiles,
} = useBrowserAutomationExecutionContext();

const syncingFromProps = ref(false);
const form = reactive(createDefaultBrowserAutomationExecutionContext());

const applyModelValue = (value?: Record<string, any> | null) => {
  const next = normalizeBrowserAutomationExecutionContext(value);
  syncingFromProps.value = true;
  form.clientId = next.clientId || "";
  form.profileId = next.profileId || "";
  form.notes = next.notes || "";
  selectedClientId.value = form.clientId;
  selectedProfileValue.value = form.profileId || "";
  syncingFromProps.value = false;
};

const normalizedValue = computed<BrowserAutomationExecutionContext>(() => {
  const next = normalizeBrowserAutomationExecutionContext(form);
  next.clientId = String(form.clientId || "").trim();
  next.profileId = String(form.profileId || "").trim();
  return next;
});

const emitValue = () => {
  if (syncingFromProps.value) {
    return;
  }
  emit("update:modelValue", normalizedValue.value);
};

const refreshProfileList = (clientId: string) => {
  const normalizedClientId = String(clientId || "").trim();
  if (!normalizedClientId) {
    resetProfiles();
    return;
  }

  const runtimeDetails = selectedClient.value?.runtime?.details;
  setProfilesPayload(normalizeBrowserAutomationProfilesPayload(runtimeDetails));
};

watch(
  () => props.modelValue,
  (value) => {
    applyModelValue(value || null);
  },
  { immediate: true, deep: true },
);

watch(
  () => form.clientId,
  (value, previousValue) => {
    selectedClientId.value = value;
    if (value !== previousValue) {
      form.profileId = "";
    }
    refreshProfileList(value);
    emitValue();
  },
);

watch(
  () => selectedClient.value?.runtime?.details,
  () => {
    refreshProfileList(form.clientId);
  },
  { deep: true },
);

watch(
  () => form.profileId,
  (value) => {
    selectedProfileValue.value = value || "";
    emitValue();
  },
);

watch(
  () => form.notes,
  () => {
    emitValue();
  },
);
</script>

<style scoped lang="scss">
.execution-context-card {
}

.execution-context-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 0 0 16px;
}

.execution-context-card__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--el-text-color-primary);
}

.execution-context-card__description {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.execution-context-card__form {
  padding: 0;
}

.execution-context-card__option {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.execution-context-card__option-meta,
.execution-context-card__hint,
.execution-context-card__meta-code {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.execution-context-card__hint {
  margin-top: 6px;
}

.execution-context-card__meta-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--el-text-color-primary);
}

.execution-context-card__meta-code {
  overflow-wrap: anywhere;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__label) {
  padding-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

:deep(.el-select),
:deep(.el-input) {
  width: 100%;
}
</style>
