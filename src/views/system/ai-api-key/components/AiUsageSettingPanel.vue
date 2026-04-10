<template>
  <Dialog
    v-model="dialogVisible"
    title="AI 使用设置"
    :initial-fullscreen="true"
    :fullscreen="false"
    scroll
  >
    <div class="ai-setting-dialog">
      <div v-if="!availableKeyCount" class="ai-setting-dialog__empty">
        当前还没有可用 Key。请先新增自己的 Key，或联系管理员开放可用 Key。
      </div>

      <el-form
        v-loading="loading"
        :model="form"
        label-position="top"
        class="ai-setting-dialog__form"
      >
        <div class="ai-setting-dialog__toolbar">
          <div class="ai-setting-dialog__toolbar-text">
            共 {{ form.items.length }} 个 AI 功能，已配置 {{ configuredCount }} 个
          </div>
          <el-button size="small" :disabled="loading" @click="loadConfig">
            刷新
          </el-button>
        </div>

        <div class="ai-setting-dialog__table-wrap">
          <el-table
            :data="form.items"
            size="small"
            border
            max-height="620"
            class="ai-setting-dialog__table"
          >
            <el-table-column label="功能" min-width="360">
              <template #default="{ row }">
                <div class="feature-cell">
                  <div class="feature-cell__title">{{ row.label }}</div>
                  <div class="feature-cell__desc">{{ row.description }}</div>
                  <div class="feature-cell__code">{{ row.code }}</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="分组" width="120">
              <template #default="{ row }">
                <span class="feature-group">{{ row.group }}</span>
              </template>
            </el-table-column>

            <el-table-column label="使用 Key" min-width="360">
              <template #default="{ row }">
                <div class="key-select-cell">
                  <el-select
                    v-model="row.keyId"
                    class="w-full"
                    clearable
                    filterable
                    placeholder="请选择这个功能要使用的 Key"
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
                          <span class="key-option__tag" :data-source="item.source">
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
                          <span v-if="item.uploader?.account">
                            / {{ item.uploader.account }}
                          </span>
                        </div>
                      </div>
                    </el-option>
                  </el-select>

                  <div
                    v-if="resolveSelectedOption(row.keyId)?.available === false"
                    class="feature-key-hint"
                  >
                    当前绑定的 Key
                    {{ resolveSelectedOption(row.keyId)?.unavailableReasonText || "不可用" }}，
                    请重新选择。
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="90" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link :disabled="!row.keyId" @click="resetFeature(row)">
                  清空
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="ai-setting-dialog__footer">
        <span>最近更新时间：{{ updatedAtText }}</span>
        <div class="ai-setting-dialog__footer-actions">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button type="primary" :loading="saving" @click="saveConfig">
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
  return [...usageOptions.value].sort(
    (left, right) => Number(right.id || 0) - Number(left.id || 0),
  );
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

const updatedAtText = computed(() => {
  return form.updatedAt
    ? dayjs(form.updatedAt).format("YYYY-MM-DD HH:mm:ss")
    : "未保存";
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
  if (source === "missing") return "失效";
  return "我的";
};

const formatKeyOptionLabel = (item: AiApiKeyConfig) => {
  const parts = [
    item.name,
    item.model ? `(${item.model})` : "",
    `[${formatSourceLabel(item.source)}]`,
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
.key-select-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.key-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px 0;
}

.key-option__title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.key-option__title {
  min-width: 0;
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.key-option__meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.key-option__tag {
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 20px;
}

.key-option__tag[data-source="mine"] {
  background: rgba(64, 158, 255, 0.12);
  color: var(--el-color-primary);
}

.key-option__tag[data-source="public"] {
  background: rgba(103, 194, 58, 0.12);
  color: var(--el-color-success);
}

.key-option__tag[data-source="missing"],
.key-option__tag--danger {
  background: rgba(245, 108, 108, 0.12);
  color: var(--el-color-danger);
}

.feature-key-hint {
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1.5;
}
</style>
