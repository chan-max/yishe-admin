<template>
  <div class="execution-card">
    <div class="execution-card__head">
      <div>
        <div class="execution-card__title">{{ title }}</div>
        <div v-if="description" class="execution-card__desc">{{ description }}</div>
      </div>

      <el-button text size="small" :loading="loading" @click="refreshClients">
        刷新环境
      </el-button>
    </div>

    <el-form label-position="top" class="execution-card__form">
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
                <div class="execution-option">
                  <span>{{ item.label }}</span>
                  <span class="execution-option__meta">{{ item.meta || item.hint }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :lg="12">
          <el-form-item label="浏览器环境 / Profile">
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
                <div class="execution-option">
                  <span>{{ item.label }}</span>
                  <span class="execution-option__meta">{{ item.meta }}</span>
                </div>
              </el-option>
            </el-select>
            <div class="execution-card__hint">
              不选时默认由该客户端使用当前活动浏览器环境执行。
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :xs="24" :lg="24">
          <el-form-item :label="taskType ? '执行标识' : '目标平台'">
            <div class="execution-card__meta-box">
              <span>{{ platform || "-" }}</span>
              <code v-if="taskType">{{ taskType }}</code>
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
.execution-card {
  padding: 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
}

.execution-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.execution-card__title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.execution-card__desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.execution-card__hint {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.execution-card__form :deep(.el-select),
.execution-card__form :deep(.el-input) {
  width: 100%;
}

.execution-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.execution-option__meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.execution-card__meta-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 40px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}

.execution-card__meta-box code {
  overflow-wrap: anywhere;
}
</style>
