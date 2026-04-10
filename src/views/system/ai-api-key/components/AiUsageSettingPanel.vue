<template>
  <Dialog
    v-model="dialogVisible"
    title="AI 使用设置"
    :initial-fullscreen="true"
    :fullscreen="false"
    scroll
  >
    <div class="ai-setting-dialog">
      <div v-if="!keyOptions.length" class="ai-setting-dialog__empty">
        当前还没有可选 Key。请先新增一个 Key，再回来绑定对应功能。
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

            <el-table-column label="使用 Key" min-width="320">
              <template #default="{ row }">
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
                  />
                </el-select>
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
  getAiFeatureRegistry,
  type AiApiKeyConfig,
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

const props = defineProps<{
  keys: AiApiKeyConfig[];
}>();

const emit = defineEmits(["saved"]);

const dialogVisible = ref(false);
const loading = ref(false);
const saving = ref(false);
const registry = ref<AiFeatureRegistryItem[]>([]);

const createDefaultSetting = (): AiSettingFormData => ({
  version: 1,
  items: [],
  updatedAt: "",
});

const form = reactive<AiSettingFormData>(createDefaultSetting());

const keyOptions = computed(() => {
  return [...(props.keys || [])].sort(
    (left, right) => Number(right.id || 0) - Number(left.id || 0),
  );
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
    const [registryData, settingData] = await Promise.all([
      getAiFeatureRegistry(),
      getAiSetting(),
    ]);
    registry.value = Array.isArray(registryData) ? registryData : [];
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

const formatKeyOptionLabel = (item: AiApiKeyConfig) => {
  const model = String(item.model || "").trim();
  return model ? `${item.name} (${model})` : item.name;
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
.ai-setting-dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ai-setting-dialog__empty {
  padding: 12px 14px;
  border: 1px dashed var(--el-border-color);
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-extra-light);
}

.ai-setting-dialog__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ai-setting-dialog__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.ai-setting-dialog__toolbar-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ai-setting-dialog__table-wrap {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 28%);
}

.ai-setting-dialog__table {
  --ai-setting-table-header-bg: color-mix(
    in srgb,
    var(--el-fill-color-light) 88%,
    var(--el-bg-color) 12%
  );
}

.ai-setting-dialog__table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.ai-setting-dialog__table :deep(th.el-table__cell) {
  background: var(--ai-setting-table-header-bg);
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.ai-setting-dialog__table :deep(td.el-table__cell) {
  background: var(--el-bg-color);
}

.ai-setting-dialog__table :deep(.el-table__row:hover > td.el-table__cell) {
  background: var(--el-fill-color-extra-light);
}

.ai-setting-dialog__table :deep(.el-table__fixed-right) {
  background: var(--el-bg-color);
  box-shadow: -10px 0 18px rgb(15 23 42 / 8%);
}

.ai-setting-dialog__table :deep(.el-table__fixed-right-patch) {
  background: var(--ai-setting-table-header-bg);
}

.ai-setting-dialog__table :deep(.el-table__fixed-right th.el-table__cell) {
  background: var(--ai-setting-table-header-bg);
}

.ai-setting-dialog__table :deep(.el-table__fixed-right td.el-table__cell) {
  background: var(--el-bg-color);
}

.ai-setting-dialog__table :deep(.el-table__fixed-right .el-table__row:hover > td.el-table__cell) {
  background: var(--el-fill-color-extra-light);
}

.feature-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-cell__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.feature-cell__desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.feature-cell__code {
  font-size: 11px;
  color: var(--el-text-color-disabled);
}

.feature-group {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ai-setting-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ai-setting-dialog__footer-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 960px) {
  .ai-setting-dialog__toolbar,
  .ai-setting-dialog__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .ai-setting-dialog__footer-actions {
    justify-content: flex-end;
  }
}
</style>
