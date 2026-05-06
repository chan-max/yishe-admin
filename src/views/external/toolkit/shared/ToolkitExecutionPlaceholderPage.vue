<template>
  <ContentWrap :plain="true">
    <div class="toolkit-page">
      <section class="toolkit-hero">
        <div class="toolkit-hero__card toolkit-hero__card--context">
          <div class="toolkit-hero__context-shell">
            <div class="toolkit-hero__context-control">
              <div class="toolkit-hero__control-group">
                <div class="toolkit-hero__label">客户端</div>
                <el-select
                  v-model="selectedClientId"
                  class="toolkit-hero__select"
                  size="small"
                  placeholder="请选择客户端"
                  :loading="loading"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="option in clientOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </div>

              <div class="toolkit-hero__control-group">
                <div class="toolkit-hero__label">环境</div>
                <el-select
                  v-model="selectedProfileValue"
                  class="toolkit-hero__select"
                  size="small"
                  placeholder="请选择环境"
                  :disabled="!selectedClientId"
                  clearable
                >
                  <el-option
                    v-for="option in profileOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="toolkit-workspace-shell">
        <div class="toolkit-workspace-shell__body">
          <div class="toolkit-placeholder-workspace">
            <template v-if="!selectedClientId">
              <el-empty description="请先选择客户端后再查看工具。" />
            </template>
            <template v-else>
              <div class="toolkit-placeholder-workspace__head">
                <div class="toolkit-placeholder-workspace__title">{{ title }}工具</div>
                <el-button size="small" :loading="toolsLoading" @click="loadPlatformTools">
                  刷新工具
                </el-button>
              </div>

              <template v-if="platformTools.length">
                <div class="toolkit-placeholder-workspace__actions">
                  <el-button
                    v-for="tool in platformTools"
                    :key="tool.key"
                    class="toolkit-placeholder-workspace__action-button"
                    :class="{
                      'is-running': runningFeatureKey === tool.key,
                    }"
                    :style="platformActionButtonStyle"
                    size="small"
                    :loading="runningFeatureKey === tool.key"
                    @click="runFeature(tool.key)"
                  >
                    {{ tool.name || tool.key }}
                  </el-button>
                </div>

                <div v-if="lastRunSummary" class="toolkit-placeholder-workspace__result">
                  <el-alert
                    :title="lastRunSummary"
                    :type="lastRunSuccess ? 'success' : 'warning'"
                    :closable="false"
                    show-icon
                  />
                  <pre v-if="lastRunResultText" class="toolkit-placeholder-workspace__json">{{
                    lastRunResultText
                  }}</pre>
                </div>
              </template>

              <el-empty v-else-if="!toolsLoading" description="当前平台暂未接入可用工具。" />
            </template>
          </div>
        </div>
      </div>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import type { ToolkitToolItem } from "@/api/external/toolkit";
import { getToolkitTools, runToolkitTool } from "@/api/external/toolkit";
import { useBrowserAutomationExecutionContext } from "@/services/browserAutomationExecutionContext";
import { websocketClient, type ServiceCommandResultEvent } from "@/services/websocketClient";

defineOptions({ name: "ToolkitExecutionPlaceholderPage" });

const props = defineProps<{
  title: string;
  platformKey: string;
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
const toolsLoading = ref(false);
const runningFeatureKey = ref("");
const platformTools = ref<ToolkitToolItem[]>([]);
const pendingToolCommandId = ref("");
const pendingRunCommandId = ref("");
const lastRunResult = ref<Record<string, any> | null>(null);
const lastRunSuccess = ref(false);
const lastRunSummary = ref("");

const platformActionThemes: Record<
  string,
  {
    color: string;
  }
> = {
  doudian: {
    color: "#fe2c55",
  },
  kuaishou_shop: {
    color: "#ff6a00",
  },
  qianniu: {
    color: "#ff6a00",
  },
  alibaba_1688: {
    color: "#ff6a00",
  },
};

const platformActionButtonStyle = computed<CSSProperties>(() => {
  const theme = platformActionThemes[props.platformKey];
  if (!theme) {
    return {};
  }

  return {
    "--toolkit-action-color": theme.color,
  } as CSSProperties;
});

const extractToolkitToolResultPayload = (value: any) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (Object.prototype.hasOwnProperty.call(value, "result")) {
      return (value as Record<string, any>).result;
    }
  }

  return value;
};

const extractToolkitToolItems = (value: any): ToolkitToolItem[] => {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, any>)
      : {};
  const data =
    source.data && typeof source.data === "object" && !Array.isArray(source.data)
      ? (source.data as Record<string, any>)
      : {};
  const result =
    source.result && typeof source.result === "object" && !Array.isArray(source.result)
      ? (source.result as Record<string, any>)
      : {};

  const candidates = [
    Array.isArray(value) ? value : [],
    Array.isArray(source.items) ? source.items : [],
    Array.isArray(source.data) ? source.data : [],
    Array.isArray(data.items) ? data.items : [],
    Array.isArray(result.items) ? result.items : [],
  ];

  return (candidates.find((items) => items.length > 0) || [])
    .filter((item) => item && typeof item === "object")
    .map((item) => item as ToolkitToolItem);
};

const lastRunResultText = computed(() => {
  if (!lastRunResult.value) {
    return "";
  }

  try {
    return JSON.stringify(lastRunResult.value, null, 2);
  } catch {
    return "";
  }
});

const syncPlatformTools = (items: ToolkitToolItem[] = []) => {
  platformTools.value = items
    .filter((item) => String(item?.platform || "").trim() === String(props.platformKey || "").trim())
    .sort((left, right) => {
      const getWeight = (item: ToolkitToolItem) => {
        const category = String(item?.category || "").trim();
        const key = String(item?.key || "").trim();
        if (category === "navigation" || key.endsWith("-open-workspace")) {
          return 0;
        }
        if (category === "session" || key.endsWith("-check-login")) {
          return 1;
        }
        return 2;
      };

      return getWeight(left) - getWeight(right);
    });
};

const loadPlatformTools = async () => {
  if (!selectedClientId.value) {
    syncPlatformTools([]);
    return;
  }

  try {
    const response = await getToolkitTools(selectedClientId.value);
    const commandId = String(response?.data?.commandId || "").trim();
    if (!commandId) {
      throw new Error(response?.message || "工具目录命令发送失败");
    }
    toolsLoading.value = true;
    pendingToolCommandId.value = commandId;
  } catch (error: any) {
    toolsLoading.value = false;
    ElMessage.error(error?.message || "获取工具目录失败");
  }
};

const runFeature = async (featureKey: string) => {
  if (!selectedClientId.value) {
    ElMessage.warning("请先选择客户端");
    return;
  }

  const normalizedFeatureKey = String(featureKey || "").trim();
  if (!normalizedFeatureKey) {
    ElMessage.warning("缺少 featureKey");
    return;
  }

  try {
    const response = await runToolkitTool(selectedClientId.value, {
      featureKey: normalizedFeatureKey,
      profileId: String(selectedProfileValue.value || "").trim() || undefined,
    });
    const commandId = String(response?.data?.commandId || "").trim();
    if (!commandId) {
      throw new Error(response?.message || "工具执行命令发送失败");
    }
    runningFeatureKey.value = normalizedFeatureKey;
    pendingRunCommandId.value = commandId;
  } catch (error: any) {
    runningFeatureKey.value = "";
    ElMessage.error(error?.message || "执行工具失败");
  }
};

const onCommand = (event: ServiceCommandResultEvent) => {
  if (event.clientId !== selectedClientId.value) {
    return;
  }

  if (event.commandId === pendingToolCommandId.value) {
    pendingToolCommandId.value = "";
    toolsLoading.value = false;
    if (event.success) {
      syncPlatformTools(extractToolkitToolItems(event.data));
      return;
    }

    syncPlatformTools([]);
    ElMessage.error(event.message || event.error || "获取工具目录失败");
    return;
  }

  if (event.commandId === pendingRunCommandId.value) {
    pendingRunCommandId.value = "";
    runningFeatureKey.value = "";
    lastRunSuccess.value = !!event.success;
    lastRunSummary.value =
      event.message || event.error || (event.success ? "执行成功" : "执行失败");
    const result = extractToolkitToolResultPayload(event.data);
    lastRunResult.value = result || null;
    ElMessage[event.success ? "success" : "warning"](lastRunSummary.value);
  }
};

watch(
  () => selectedClient.value?.runtime?.details,
  (details) => {
    setProfilesPayload((details || {}) as Record<string, any>);
  },
  { immediate: true, deep: true },
);

watch(
  selectedClientId,
  (value) => {
    resetProfiles();
    selectedProfileValue.value = "";
    if (!value) {
      syncPlatformTools([]);
      return;
    }

    setProfilesPayload((selectedClient.value?.runtime?.details || {}) as Record<string, any>);
    void loadPlatformTools();
  },
  { immediate: false },
);

watch(
  [selectedClientId, profileOptions],
  ([clientId, options]) => {
    if (!String(clientId || "").trim()) {
      return;
    }

    if (String(selectedProfileValue.value || "").trim()) {
      return;
    }

    const activeOption = (Array.isArray(options) ? options : []).find(
      (item) => item.isActiveOption,
    );
    if (!activeOption) {
      return;
    }

    selectedProfileValue.value = String(activeOption.value || "").trim();
  },
  { immediate: true, deep: true },
);

onMounted(async () => {
  websocketClient.events.on("serviceCommandResult", onCommand);
  await refreshClients();
  setProfilesPayload((selectedClient.value?.runtime?.details || {}) as Record<string, any>);
  if (selectedClientId.value) {
    void loadPlatformTools();
  }
});

onUnmounted(() => {
  websocketClient.events.off("serviceCommandResult", onCommand);
});
</script>

<style scoped lang="scss">
.toolkit-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 8px;
}

.toolkit-hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toolkit-workspace-shell {
  position: relative;
  min-width: 0;
}

.toolkit-workspace-shell__body {
  min-width: 0;
}

.toolkit-hero__card {
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  border-radius: 18px;
  box-shadow: var(--el-box-shadow-light);
  padding: 10px 12px;
}

.toolkit-hero__label {
  color: var(--el-text-color-regular);
  font-size: 11px;
  font-weight: 600;
  text-wrap: nowrap;
  padding-right: 12px;
  display: flex;
  align-items: center;
}

.toolkit-hero__card--context {
  padding-top: 12px;
  padding-bottom: 12px;
}

.toolkit-hero__context-shell {
  display: flex;
  align-items: flex-start;
}

.toolkit-hero__context-control {
  flex: 1 1 auto;
  max-width: 760px;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.toolkit-hero__control-group {
  flex: 1 1 180px;
  min-width: 0;
}

.toolkit-hero__control-group .toolkit-hero__label {
  padding-right: 0;
  margin-bottom: 6px;
}

.toolkit-hero__select {
  width: 100%;
}

.toolkit-placeholder-workspace {
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  border-radius: 18px;
  box-shadow: var(--el-box-shadow-light);
  padding: 16px;
}

.toolkit-placeholder-workspace__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.toolkit-placeholder-workspace__title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 700;
}

.toolkit-placeholder-workspace__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.toolkit-placeholder-workspace__action-button {
  --toolkit-action-color: var(--el-color-primary);

  color: #fff;
  border: 0;
  background: var(--toolkit-action-color);
}

.toolkit-placeholder-workspace__action-button:hover,
.toolkit-placeholder-workspace__action-button:focus {
  color: #fff;
  border: 0;
  background: var(--toolkit-action-color);
  filter: brightness(1.05);
}

.toolkit-placeholder-workspace__action-button:active,
.toolkit-placeholder-workspace__action-button.is-running {
  color: #fff;
  background: var(--toolkit-action-color);
  filter: brightness(0.96);
}

.toolkit-placeholder-workspace__result {
  margin-top: 14px;
}

.toolkit-placeholder-workspace__json {
  margin: 10px 0 0;
  padding: 12px;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 768px) {
  .toolkit-hero__context-control {
    flex-basis: auto;
    max-width: none;
    width: 100%;
  }
}
</style>
