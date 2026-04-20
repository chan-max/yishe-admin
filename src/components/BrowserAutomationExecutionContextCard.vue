<template>
  <div class="rounded-5 border border-slate-200 bg-white shadow-sm">
    <div class="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div>
        <div class="text-4 text-slate-900 font-600 leading-tight">{{ title }}</div>
        <div v-if="description" class="mt-1 text-3.5 text-slate-500 leading-6">{{ description }}</div>
      </div>

      <el-button text size="small" :loading="loading" @click="refreshClients">
        刷新环境
      </el-button>
    </div>

    <el-form label-position="top" class="px-5 py-5">
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
                <div class="flex flex-col gap-1">
                  <span>{{ item.label }}</span>
                  <span class="text-3 text-slate-500">{{ item.meta || item.hint }}</span>
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
                <div class="flex flex-col gap-1">
                  <span>{{ item.label }}</span>
                  <span class="text-3 text-slate-500">{{ item.meta }}</span>
                </div>
              </el-option>
            </el-select>
            <div class="mt-1.5 text-3 text-slate-500 leading-5.5">
              不选时默认由该客户端使用当前活动浏览器环境执行。
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :xs="24" :lg="24">
          <el-form-item :label="taskType ? '执行标识' : '目标平台'">
            <div class="flex flex-col gap-1.5 rounded-3 bg-slate-50 px-3 py-3 text-slate-700">
              <span>{{ platform || "-" }}</span>
              <code v-if="taskType" class="text-3.5 text-slate-500 overflow-wrap-anywhere">{{ taskType }}</code>
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
:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__label) {
  padding-bottom: 8px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 500;
}

:deep(.el-select),
:deep(.el-input) {
  width: 100%;
}
</style>
