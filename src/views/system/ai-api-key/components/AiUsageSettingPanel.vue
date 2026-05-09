<template>
  <Dialog
    v-model="dialogVisible"
    title="AI 使用设置"
    :initial-fullscreen="true"
    :fullscreen="true"
    scroll
    class="ai-setting-usage-dialog"
  >
    <div class="ai-setting-dialog">
      <div class="ai-setting-dialog__hero">
        <div class="ai-setting-dialog__hero-main">
          <div class="ai-setting-dialog__hero-title">功能场景绑定</div>
          <div class="ai-setting-dialog__hero-desc">按功能选择实际调用的 AI Key。</div>
        </div>

        <div class="ai-setting-dialog__stats">
          <div class="ai-setting-dialog__stat-card">
            <span class="ai-setting-dialog__stat-label">功能分组</span>
            <span class="ai-setting-dialog__stat-value">{{ featureGroups.length }}</span>
          </div>
          <div class="ai-setting-dialog__stat-card">
            <span class="ai-setting-dialog__stat-label">功能数量</span>
            <span class="ai-setting-dialog__stat-value">{{ form.items.length }}</span>
          </div>
          <div class="ai-setting-dialog__stat-card">
            <span class="ai-setting-dialog__stat-label">已配置</span>
            <span class="ai-setting-dialog__stat-value">{{ configuredCount }}</span>
          </div>
          <div class="ai-setting-dialog__stat-card">
            <span class="ai-setting-dialog__stat-label">可用 Key</span>
            <span class="ai-setting-dialog__stat-value">{{ availableKeyCount }}</span>
          </div>
        </div>
      </div>

      <div v-if="!availableKeyCount" class="ai-setting-dialog__empty">
        当前还没有可用 Key。请先新增自己的 Key，或联系管理员开放公开 Key 和共享 AI 使用权限。
      </div>

      <el-form
        v-loading="loading"
        :model="form"
        label-position="top"
        class="ai-setting-dialog__form"
      >
        <div class="ai-setting-dialog__toolbar">
          <div class="ai-setting-dialog__legend">
            <span class="key-option__tag" data-source="mine">我的 Key</span>
            <span class="key-option__tag" data-source="public">公开 Key</span>
            <span class="key-option__tag key-option__tag--danger">不可用 / 已失效</span>
          </div>
          <el-button size="small" :disabled="loading" @click="loadConfig"> 刷新 </el-button>
        </div>

        <div class="ai-setting-groups">
          <section v-for="group in featureGroups" :key="group.group" class="ai-setting-group">
            <div class="ai-setting-group__header">
              <div>
                <div class="ai-setting-group__title">{{ group.group }}</div>
                <div class="ai-setting-group__meta">
                  已配置 {{ group.configuredCount }} / {{ group.items.length }}
                </div>
              </div>
            </div>

            <div class="ai-setting-group__cards">
              <article v-for="row in group.items" :key="row.code" class="ai-setting-feature">
                <div class="ai-setting-feature__head">
                  <div class="ai-setting-feature__status-row">
                    <span
                      class="ai-setting-feature__status"
                      :class="{
                        'is-bound': !!row.keyId,
                        'is-invalid': resolveSelectedOption(row.keyId)?.available === false,
                      }"
                    >
                      {{
                        resolveSelectedOption(row.keyId)?.available === false
                          ? "Key 不可用"
                          : row.keyId
                            ? "已绑定"
                            : "未绑定"
                      }}
                    </span>
                    <span class="ai-setting-feature__code">{{ row.code }}</span>
                  </div>
                  <div class="ai-setting-feature__title">{{ row.label }}</div>
                </div>

                <div class="ai-setting-feature__body">
                  <div class="ai-setting-feature__scene">{{ row.scene || "未标注使用位置" }}</div>
                  <div class="ai-setting-feature__desc">{{ row.description }}</div>

                  <div
                    class="ai-setting-feature__current"
                    :class="{ 'is-empty': !resolveSelectedOption(row.keyId) }"
                  >
                    <div class="ai-setting-feature__current-label">当前 Key</div>
                    <div class="ai-setting-feature__current-main">
                      <span class="ai-setting-feature__current-name">
                        {{ resolveSelectedOption(row.keyId)?.name || "未绑定" }}
                      </span>
                      <span
                        v-if="
                          resolveSelectedOption(row.keyId)?.source &&
                          resolveSelectedOption(row.keyId)?.source !== 'missing'
                        "
                        class="key-option__tag"
                        :data-source="resolveSelectedOption(row.keyId)?.source"
                      >
                        {{ formatSourceLabel(resolveSelectedOption(row.keyId)?.source) }}
                      </span>
                    </div>
                    <div
                      v-if="resolveSelectedOption(row.keyId)"
                      class="ai-setting-feature__current-meta"
                    >
                      <span>{{ resolveSelectedOption(row.keyId)?.model || "未设置模型" }}</span>
                      <span v-if="resolveSelectedOption(row.keyId)?.uploader?.account">
                        / {{ resolveSelectedOption(row.keyId)?.uploader?.account }}
                      </span>
                    </div>
                    <div
                      v-if="resolveSelectedOption(row.keyId)?.available === false"
                      class="feature-key-hint"
                    >
                      当前绑定的 Key
                      {{ resolveSelectedOption(row.keyId)?.unavailableReasonText || "不可用" }}，
                      请重新选择。
                    </div>
                  </div>
                </div>

                <div class="ai-setting-feature__footer">
                  <el-select
                    v-model="row.keyId"
                    size="small"
                    class="w-full"
                    clearable
                    filterable
                    placeholder="选择 Key"
                  >
                    <el-option
                      v-for="item in keyOptions"
                      :key="item.id"
                      :label="formatKeyOptionLabel(item)"
                      :value="item.id!"
                      :disabled="item.available === false"
                    >
                      <div class="key-option">
                        <div class="key-option__title-row">
                          <span class="key-option__title">{{ item.name }}</span>
                          <span
                            v-if="item.source && item.source !== 'missing'"
                            class="key-option__tag"
                            :data-source="item.source"
                          >
                            {{ formatSourceLabel(item.source) }}
                          </span>
                          <span
                            v-if="item.available === false"
                            class="key-option__tag key-option__tag--danger"
                          >
                            {{ item.unavailableReasonText || "不可用" }}
                          </span>
                        </div>
                        <div class="key-option__meta">
                          <span>{{ item.model || "未设置模型" }}</span>
                          <span v-if="item.uploader?.account"> / {{ item.uploader.account }} </span>
                        </div>
                      </div>
                    </el-option>
                  </el-select>
                  <el-button link :disabled="!row.keyId" @click="resetFeature(row)">清空</el-button>
                </div>
              </article>
            </div>
          </section>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="ai-setting-dialog__footer">
        <span>最近更新时间：{{ updatedAtText }}</span>
        <div class="ai-setting-dialog__footer-actions">
          <el-button size="small" @click="dialogVisible = false">关闭</el-button>
          <el-button size="small" type="primary" :loading="saving" @click="saveConfig">
            保存设置
          </el-button>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import dayjs from "dayjs";
import {
  getAiApiKeyUsageOptions,
  getAiFeatureRegistry,
  type AiApiKeyConfig,
  type AiApiKeySource,
  type AiFeatureRegistryItem,
} from "@/api/aiApiKey";
import { getAiSetting, updateAiSetting, type UserAiSetting } from "@/api/user";
import { ElMessage } from "element-plus";

type FeatureSettingFormItem = AiFeatureRegistryItem & {
  keyId: number | null;
};

type AiSettingFormData = {
  version: number;
  items: FeatureSettingFormItem[];
  updatedAt: string;
};

type FeatureSettingGroup = {
  group: string;
  items: FeatureSettingFormItem[];
  configuredCount: number;
};

const emit = defineEmits(["saved"]);

const dialogVisible = ref(false);
const loading = ref(false);
const saving = ref(false);
const registry = ref<AiFeatureRegistryItem[]>([]);
const usageOptions = ref<AiApiKeyConfig[]>([]);

const createDefaultSetting = (): AiSettingFormData => ({
  version: 1,
  items: [],
  updatedAt: "",
});

const form = reactive<AiSettingFormData>(createDefaultSetting());

const keyOptions = computed(() => {
  return usageOptions.value;
});

const keyOptionMap = computed(() => {
  return new Map(
    keyOptions.value
      .map((item) => [normalizeKeyId(item.id), item] as const)
      .filter((item): item is [number, AiApiKeyConfig] => item[0] !== null),
  );
});

const availableKeyCount = computed(() => {
  return keyOptions.value.filter((item) => item.available !== false).length;
});

const configuredCount = computed(() => {
  return form.items.filter((item) => !!item.keyId).length;
});

const featureGroups = computed<FeatureSettingGroup[]>(() => {
  const groupMap = new Map<string, FeatureSettingFormItem[]>();

  form.items.forEach((item) => {
    const groupKey = String(item.group || "未分组").trim() || "未分组";
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, []);
    }
    groupMap.get(groupKey)?.push(item);
  });

  return Array.from(groupMap.entries()).map(([group, items]) => ({
    group,
    items,
    configuredCount: items.filter((item) => !!item.keyId).length,
  }));
});

const updatedAtText = computed(() => {
  return form.updatedAt ? dayjs(form.updatedAt).format("YYYY-MM-DD HH:mm:ss") : "未保存";
});

const normalizeKeyId = (value: unknown) => {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    return null;
  }
  return normalized;
};

const formatSourceLabel = (source?: AiApiKeySource) => {
  if (source === "public") return "公开";
  if (source === "missing") return "";
  return "我的";
};

const formatKeyOptionLabel = (item: AiApiKeyConfig) => {
  const sourceLabel = formatSourceLabel(item.source);
  const parts = [
    item.name,
    item.model ? `(${item.model})` : "",
    sourceLabel ? `[${sourceLabel}]` : "",
  ].filter(Boolean);

  if (item.available === false && item.unavailableReasonText) {
    parts.push(`- ${item.unavailableReasonText}`);
  }

  return parts.join(" ");
};

const resolveSelectedOption = (keyId: unknown) => {
  const normalizedKeyId = normalizeKeyId(keyId);
  if (!normalizedKeyId) {
    return null;
  }
  return keyOptionMap.value.get(normalizedKeyId) || null;
};

const applySetting = (payload?: Partial<UserAiSetting>) => {
  const rawFeatureKeys =
    payload?.featureKeys &&
    typeof payload.featureKeys === "object" &&
    !Array.isArray(payload.featureKeys)
      ? payload.featureKeys
      : {};

  Object.assign(form, {
    version: Number(payload?.version || 1) || 1,
    items: registry.value.map((item) => ({
      ...item,
      keyId: normalizeKeyId(rawFeatureKeys[item.code]),
    })),
    updatedAt: String(payload?.updatedAt || "").trim(),
  });
};

const loadConfig = async () => {
  loading.value = true;
  try {
    const [registryData, settingData, optionData] = await Promise.all([
      getAiFeatureRegistry(),
      getAiSetting(),
      getAiApiKeyUsageOptions(),
    ]);
    registry.value = Array.isArray(registryData) ? registryData : [];
    usageOptions.value = Array.isArray(optionData) ? optionData : [];
    applySetting(settingData || {});
  } finally {
    loading.value = false;
  }
};

const open = async () => {
  dialogVisible.value = true;
  await loadConfig();
};

const resetFeature = (feature: FeatureSettingFormItem) => {
  feature.keyId = null;
};

const saveConfig = async () => {
  const featureKeys = form.items.reduce<Record<string, number>>((result, item) => {
    const keyId = normalizeKeyId(item.keyId);
    if (!keyId) {
      return result;
    }
    result[item.code] = keyId;
    return result;
  }, {});

  const payload: UserAiSetting = {
    version: 1,
    featureKeys,
    updatedAt: form.updatedAt || "",
  };

  saving.value = true;
  try {
    const data = await updateAiSetting(payload);
    applySetting(data || payload);
    ElMessage.success("AI 使用设置已保存");
    emit("saved");
    dialogVisible.value = false;
  } finally {
    saving.value = false;
  }
};

defineExpose({
  open,
  reload: loadConfig,
});
</script>

<style scoped lang="scss">
:deep(.ai-setting-usage-dialog .el-dialog__body) {
  flex: 1;
  min-height: 0;
  padding: 0 !important;
}

:deep(.ai-setting-usage-dialog .el-dialog__footer) {
  padding: 16px 22px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
}

:deep(.ai-setting-usage-dialog .el-dialog) {
  display: flex;
  flex-direction: column;
}

:deep(.ai-setting-usage-dialog .el-scrollbar) {
  height: 100% !important;
}

:deep(.ai-setting-usage-dialog .el-scrollbar__view) {
  min-height: 100%;
}

.ai-setting-dialog {
  min-height: 100%;
  box-sizing: border-box;
  padding: 14px 16px 18px;
  background: var(--el-bg-color-page);
}

.ai-setting-dialog__hero {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.ai-setting-dialog__hero-main {
  flex: 1;
  min-width: 0;
}

.ai-setting-dialog__hero-title {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
}

.ai-setting-dialog__hero-desc {
  margin-top: 6px;
  max-width: 680px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.5;
}

.ai-setting-dialog__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(96px, 1fr));
  gap: 10px;
  min-width: 220px;
}

.ai-setting-dialog__stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.ai-setting-dialog__stat-label {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1;
}

.ai-setting-dialog__stat-value {
  color: var(--el-text-color-primary);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.1;
}

.ai-setting-dialog__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ai-setting-dialog__empty {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: 8px;
  background: var(--el-color-danger-light-9);
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.6;
}

.ai-setting-dialog__form {
  margin-top: 12px;
}

.ai-setting-dialog__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.ai-setting-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-setting-group {
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.ai-setting-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.ai-setting-group__title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}

.ai-setting-group__meta {
  margin-top: 2px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.4;
}

.ai-setting-group__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 10px;
}

.ai-setting-feature {
  display: flex;
  min-width: 0;
  min-height: 238px;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.ai-setting-feature:hover {
  border-color: var(--el-border-color);
  box-shadow: var(--el-box-shadow-lighter);
}

.ai-setting-feature__head {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
}

.ai-setting-feature__status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ai-setting-feature__status {
  display: inline-flex;
  align-items: center;
  flex: none;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 600;
  line-height: 22px;
}

.ai-setting-feature__status.is-bound {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.ai-setting-feature__status.is-invalid {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.ai-setting-feature__title {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
}

.ai-setting-feature__code {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  color: var(--el-text-color-secondary);
  font-size: 10px;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
}

.ai-setting-feature__body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.ai-setting-feature__scene {
  color: var(--el-text-color-primary);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.45;
}

.ai-setting-feature__desc {
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.5;
  display: -webkit-box;
  min-height: 36px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.ai-setting-feature__current {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-height: 74px;
  padding: 9px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.ai-setting-feature__current.is-empty {
  border-style: dashed;
  background: var(--el-fill-color-blank);
}

.ai-setting-feature__current-label {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.2;
}

.ai-setting-feature__current-main {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.ai-setting-feature__current-name {
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-setting-feature__current-meta {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.4;
}

.ai-setting-feature__footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.key-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 1px 0;
}

.key-option__title-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.key-option__title {
  min-width: 0;
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 12px;
}

.key-option__meta {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.key-option__tag {
  display: inline-flex;
  align-items: center;
  flex: none;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 10px;
  line-height: 18px;
}

.key-option__tag[data-source="mine"] {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.key-option__tag[data-source="public"] {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.key-option__tag[data-source="missing"],
.key-option__tag--danger {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.feature-key-hint {
  color: var(--el-color-danger);
  font-size: 11px;
  line-height: 1.4;
}

.ai-setting-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
}

.ai-setting-dialog__footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 1080px) {
  .ai-setting-dialog__hero {
    flex-direction: column;
  }

  .ai-setting-dialog__stats {
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .ai-setting-dialog {
    padding: 16px;
  }

  .ai-setting-dialog__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ai-setting-dialog__toolbar,
  .ai-setting-dialog__footer,
  .ai-setting-dialog__footer-actions,
  .ai-setting-feature__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .ai-setting-group__cards {
    grid-template-columns: 1fr;
  }

  .ai-setting-feature__footer {
    display: flex;
  }
}
</style>
