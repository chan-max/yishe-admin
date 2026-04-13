<template>
  <section class="temu-workspace">
    <section class="temu-workspace__action-shell">
      <div class="temu-workspace__toolbar">
        <div class="temu-workspace__toolbar-main">
          <div class="temu-workspace__section-title">业务动作</div>
          <div class="temu-workspace__counts">
            <span>{{ actionCategoryTabs.length }} 类</span>
            <span>{{ visibleActionCount }} 动作</span>
            <span>{{ availableActionCount }} 可执行</span>
          </div>
        </div>

        <div class="temu-workspace__toolbar-side">
          <el-input
            v-model="actionSearchKeyword"
            clearable
            class="temu-workspace__search"
            placeholder="搜索动作"
          />
          <el-button text size="small" :loading="catalogLoading" @click="loadCatalog">
            刷新目录
          </el-button>
        </div>
      </div>

      <div v-if="actionCategoryTabs.length" class="temu-workspace__category-bar">
        <div class="temu-workspace__category-tabs">
          <button
            v-for="group in actionCategoryTabs"
            :key="group.key"
            type="button"
            class="temu-category-tab"
            :class="{ 'is-active': selectedCategoryKey === group.key }"
            @click="selectedCategoryKey = group.key"
          >
            <span>{{ group.label }}</span>
            <em>{{ group.actions.length }}</em>
          </button>
        </div>
      </div>

      <div v-if="selectedCategoryActions.length" class="temu-workspace__action-grid">
        <button
          v-for="action in selectedCategoryActions"
          :key="action.key"
          type="button"
          class="temu-function-button"
          :class="{
            'is-active': selectedActionKey === action.key,
            'is-disabled': !isRunnableAction(action),
          }"
          :disabled="!isRunnableAction(action)"
          @click="focusActionByKey(action.key)"
        >
          <span class="temu-function-button__head">
            <span class="temu-function-button__label">{{ action.label }}</span>
            <span class="temu-function-button__status">
              {{ action.status === "available" ? "可用" : "规划中" }}
            </span>
          </span>
          <span class="temu-function-button__desc">
            {{ action.description || "当前动作暂无额外说明" }}
          </span>
          <span class="temu-function-button__meta">
            {{ action.key }}
          </span>
        </button>
      </div>

      <div v-else-if="actionSearchKeyword" class="temu-workspace__filter-empty">
        当前筛选条件下没有可展示的动作，换个关键词试试。
      </div>

      <div v-else-if="!catalogLoading" class="temu-workspace__filter-empty">
        当前暂无可展示的动作。
      </div>

      <div v-if="selectedAction" class="temu-workspace__editor">
        <div class="temu-workspace__editor-head">
          <div>
            <div class="temu-workspace__editor-title">{{ selectedAction.label }}</div>
            <div class="temu-workspace__editor-desc">{{ selectedAction.description }}</div>
          </div>

          <div class="temu-workspace__editor-tags">
            <el-tag size="small" effect="plain">
              {{ selectedAction.key }}
            </el-tag>
            <el-tag
              size="small"
              effect="plain"
              :type="selectedAction.status === 'available' ? 'success' : 'info'"
            >
              {{ selectedAction.status === "available" ? "可用" : "规划中" }}
            </el-tag>
          </div>
        </div>

        <div v-if="selectedActionPreset" class="temu-workspace__form-wrap">
          <div v-if="actionFeedbackNotices.length" class="temu-workspace__feedback-list">
            <el-alert
              v-for="notice in actionFeedbackNotices"
              :key="notice.key"
              :title="notice.title"
              :description="notice.message"
              :type="notice.type"
              :closable="false"
              show-icon
            />
          </div>

          <div v-if="formSeedActions.length" class="temu-workspace__helper-panel">
            <div class="temu-workspace__helper-label">快捷填充</div>
            <div class="temu-workspace__helper-actions">
              <button
                v-for="seed in formSeedActions"
                :key="seed.key"
                type="button"
                class="temu-helper-chip"
                @click="applyFormSeed(seed)"
              >
                <span class="temu-helper-chip__title">{{ seed.label }}</span>
                <span class="temu-helper-chip__desc">{{ seed.description }}</span>
              </button>
            </div>
          </div>

          <div class="temu-workspace__form">
            <div
              v-for="field in selectedActionPreset.fields"
              :key="field.key"
              class="temu-field"
              :class="{ 'is-wide': field.type === 'json' || field.type === 'textarea' }"
            >
              <div class="temu-field__label">
                {{ field.label }}
                <span v-if="field.required" class="temu-field__required">*</span>
              </div>

              <el-select
                v-if="field.type === 'select'"
                v-model="formState[field.key]"
                clearable
                class="temu-field__control"
                :placeholder="field.placeholder || `请选择${field.label}`"
              >
                <el-option
                  v-for="option in resolveFieldOptions(field)"
                  :key="String(option.value)"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>

              <el-input-number
                v-else-if="field.type === 'number'"
                v-model="formState[field.key]"
                class="temu-field__control"
                :controls="false"
              />

              <el-input
                v-else
                v-model="formState[field.key]"
                :type="
                  field.type === 'json' || field.type === 'textarea' || field.type.startsWith('array')
                    ? 'textarea'
                    : 'text'
                "
                class="temu-field__control"
                :autosize="
                  field.type === 'json' || field.type === 'textarea' || field.type.startsWith('array')
                    ? { minRows: field.rows || 3, maxRows: field.type === 'json' ? 14 : 8 }
                    : undefined
                "
                :placeholder="field.placeholder || `请输入${field.label}`"
              />

              <div v-if="field.hint" class="temu-field__hint">{{ field.hint }}</div>
              <div v-if="formErrors[field.key]" class="temu-field__error">
                {{ formErrors[field.key] }}
              </div>
            </div>
          </div>

          <div v-if="selectedActionPreset.note" class="temu-workspace__note">
            {{ selectedActionPreset.note }}
          </div>

          <div class="temu-workspace__runner">
            <el-button @click="resetFormState">重置参数</el-button>
            <el-button
              type="primary"
              :loading="running"
              :disabled="!canRunSelectedAction"
              @click="runAction"
            >
              {{ canRunSelectedAction ? "执行动作" : runButtonLabel }}
            </el-button>
          </div>
        </div>

        <div v-else class="temu-workspace__unsupported">
          当前动作已经接到目录里了，但前端还没有配置专用表单。后续可以继续把它可视化。
        </div>
      </div>
    </section>

    <div v-if="lastResult" class="temu-workspace__result">
      <div class="temu-workspace__result-head">
        <div class="temu-workspace__result-status">
          <el-tag size="small" effect="plain" :type="lastResult.success ? 'success' : 'danger'">
            {{ lastResult.success ? "成功" : "失败" }}
          </el-tag>
          <span>{{ lastResult.message || "动作已返回结果" }}</span>
        </div>

        <div class="temu-workspace__result-tools">
          <el-button
            v-if="lastResult.request?.url"
            text
            size="small"
            @click="copyText('请求地址', String(lastResult.request?.url || ''))"
          >
            复制请求地址
          </el-button>
          <el-button
            v-if="detectedResultUrl"
            text
            size="small"
            @click="copyText('结果链接', detectedResultUrl)"
          >
            复制结果链接
          </el-button>
          <el-button text size="small" @click="copyText('结果 JSON', jsonText(lastResult.result))">
            复制结果
          </el-button>
        </div>
      </div>

      <div v-if="resultFeedbackNotices.length" class="temu-workspace__feedback-list">
        <el-alert
          v-for="notice in resultFeedbackNotices"
          :key="notice.key"
          :title="notice.title"
          :description="notice.message"
          :type="notice.type"
          :closable="false"
          show-icon
        />
      </div>

      <div v-if="resultInsightCards.length" class="temu-workspace__insights">
        <div
          v-for="card in resultInsightCards"
          :key="card.key"
          class="temu-insight-card"
          :class="`is-${card.tone || 'default'}`"
        >
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </div>
      </div>

      <div v-if="recommendedNextActions.length" class="temu-workspace__next-panel">
        <div class="temu-workspace__helper-label">推荐下一步</div>
        <div class="temu-workspace__helper-actions">
          <button
            v-for="action in recommendedNextActions"
            :key="action.key"
            type="button"
            class="temu-helper-chip temu-helper-chip--next"
            @click="focusActionByKey(action.key, true)"
          >
            <span class="temu-helper-chip__title">{{ action.label }}</span>
            <span class="temu-helper-chip__desc">{{ action.description }}</span>
          </button>
        </div>
      </div>

      <div class="temu-workspace__result-meta">
        <span>{{ lastResult.action || selectedAction?.key || "-" }}</span>
        <span v-if="lastResult.region">区域 {{ lastResult.region }}</span>
        <span v-if="lastResult.request?.status">HTTP {{ lastResult.request?.status }}</span>
      </div>

      <div v-if="lastResult.request?.url" class="temu-workspace__request-url">
        {{ lastResult.request.url }}
      </div>

      <el-collapse v-model="collapseNames" class="temu-workspace__collapse">
        <el-collapse-item name="result" title="结果摘要">
          <pre class="temu-workspace__json">{{ jsonText(lastResult.result) }}</pre>
        </el-collapse-item>
        <el-collapse-item name="raw" title="原始返回">
          <pre class="temu-workspace__json">{{ jsonText(lastResult.raw) }}</pre>
        </el-collapse-item>
      </el-collapse>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { computed, onMounted, reactive, ref, watch } from "vue";
import {
  executeTemuAction,
  getTemuCatalog,
  type TemuActionResponse,
  type TemuCatalogAction,
  type TemuCatalogGroup,
  type TemuRegionKey,
} from "@/api/external/toolkit/temu";
import {
  ACTION_PRESETS,
  NEXT_ACTION_MAP,
  REGION_LABELS,
  type TemuActionField,
  type TemuFormSeedAction,
  type TemuIndexedCatalogAction,
} from "./temuWorkspace.shared";
import {
  asPlainObject,
  buildActionFeedbackNotices,
  buildDefaultFormState,
  buildFormPatchState,
  buildFormSeedActions,
  buildResultInsightCards,
  buildResultFeedbackNotices,
  countObjectKeys,
  detectResultUrl,
  extractRequestErrorMessage,
  stringifyJson,
  validateAndNormalizeField,
} from "./temuWorkspace.helpers";

defineOptions({ name: "ToolkitTemuWorkspace" });

const props = defineProps<{
  profileId?: string;
  sessionRecord?: Record<string, any> | null;
}>();

const flattenCatalogActions = (groups: TemuCatalogGroup[] = []) =>
  groups.flatMap((group) => group.actions);

const resetReactiveRecord = (target: Record<string, any>, nextValue: Record<string, any> = {}) => {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.entries(nextValue).forEach(([key, value]) => {
    target[key] = value;
  });
};

const catalogLoading = ref(false);
const running = ref(false);
const collapseNames = ref<string[]>(["result"]);
const selectedCategoryKey = ref("");
const selectedActionKey = ref("");
const actionSearchKeyword = ref("");
const catalog = ref<TemuCatalogGroup[]>([]);
const lastResult = ref<TemuActionResponse | null>(null);
const formState = reactive<Record<string, any>>({});
const formErrors = reactive<Record<string, string>>({});

const sessionRecord = computed(() => asPlainObject(props.sessionRecord));
const sessionData = computed(() => asPlainObject(sessionRecord.value?.session));
const regionCookieCounts = computed(() => ({
  global: countObjectKeys(sessionData.value?.global?.cookies),
  us: countObjectKeys(sessionData.value?.us?.cookies),
  eu: countObjectKeys(sessionData.value?.eu?.cookies),
}));
const hasUsableSession = computed(() => regionCookieCounts.value.global > 0);

const normalizedSearchKeyword = computed(() => actionSearchKeyword.value.trim().toLowerCase());

const catalogActionIndex = computed(() => {
  const actionMap = new Map<string, TemuIndexedCatalogAction>();
  catalog.value.forEach((group) => {
    group.actions.forEach((action) => {
      actionMap.set(action.key, {
        ...action,
        groupKey: group.key,
        groupLabel: group.label,
      });
    });
  });
  return actionMap;
});

const catalogGroups = computed(() => {
  const keyword = normalizedSearchKeyword.value;
  if (!keyword) {
    return catalog.value;
  }

  return catalog.value.reduce((result, group) => {
    const groupMatched = [group.label, group.description, group.key]
      .filter(Boolean)
      .some((item) => String(item).toLowerCase().includes(keyword));

    const actions = group.actions.filter((action) => {
      if (groupMatched) {
        return true;
      }

      return [action.label, action.description, action.key]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(keyword));
    });

    if (actions.length) {
      result.push({
        ...group,
        actions,
      });
    }
    return result;
  }, [] as TemuCatalogGroup[]);
});

const actionCategoryTabs = computed(() =>
  catalogGroups.value.filter((group) => Array.isArray(group.actions) && group.actions.length > 0),
);
const selectedCategory = computed(
  () => actionCategoryTabs.value.find((group) => group.key === selectedCategoryKey.value) || null,
);
const selectedCategoryActions = computed(() =>
  Array.isArray(selectedCategory.value?.actions) ? selectedCategory.value.actions : [],
);
const visibleActions = computed(() => flattenCatalogActions(actionCategoryTabs.value));
const selectedAction = computed<TemuCatalogAction | null>(
  () =>
    selectedCategoryActions.value.find((item) => item.key === selectedActionKey.value) ||
    visibleActions.value.find((item) => item.key === selectedActionKey.value) ||
    null,
);
const selectedActionPreset = computed(() =>
  selectedAction.value ? ACTION_PRESETS[selectedAction.value.key] || null : null,
);
const visibleActionCount = computed(() => flattenCatalogActions(actionCategoryTabs.value).length);
const availableActionCount = computed(
  () =>
    flattenCatalogActions(actionCategoryTabs.value).filter(
      (action) => action.status === "available" && !!ACTION_PRESETS[action.key],
    ).length,
);

const formSeedActions = computed<TemuFormSeedAction[]>(() =>
  buildFormSeedActions(selectedAction.value?.key, lastResult.value),
);
const actionFeedbackNotices = computed(() =>
  buildActionFeedbackNotices({
    action: selectedAction.value,
    sessionRecord: sessionRecord.value,
    jsonFieldCount: (selectedActionPreset.value?.fields || []).filter(
      (field) => field.type === "json",
    ).length,
    hasFormSeeds: formSeedActions.value.length > 0,
  }),
);
const resultInsightCards = computed(() => buildResultInsightCards(lastResult.value));
const resultFeedbackNotices = computed(() => buildResultFeedbackNotices(lastResult.value));
const detectedResultUrl = computed(() => detectResultUrl(lastResult.value));
const recommendedNextActions = computed(() => {
  const actionKey = String(lastResult.value?.action || "").trim();
  return (NEXT_ACTION_MAP[actionKey] || [])
    .map((key) => catalogActionIndex.value.get(key))
    .filter((item): item is TemuIndexedCatalogAction => !!item)
    .filter((item) => item.status === "available" && !!ACTION_PRESETS[item.key]);
});
const canRunSelectedAction = computed(
  () =>
    !!(
      props.profileId &&
      hasUsableSession.value &&
      selectedAction.value?.endpoint &&
      selectedActionPreset.value
    ),
);
const runButtonLabel = computed(() => {
  if (!props.profileId) {
    return "先选择环境";
  }
  if (!hasUsableSession.value) {
    return "先准备会话";
  }
  return "执行动作";
});

const hasPresetForAction = (actionKey?: string | null) =>
  !!(actionKey && ACTION_PRESETS[actionKey]);

const isRunnableAction = (action?: Pick<TemuCatalogAction, "key" | "status"> | null) =>
  !!(action && action.status === "available" && hasPresetForAction(action.key));

const buildRegionOptions = (regionHints: TemuRegionKey[] = []) => {
  const preferredRegions = regionHints.length ? regionHints : ["global", "us", "eu", "seller"];

  return preferredRegions.map((region) => {
    const cookieCount =
      region === "seller"
        ? regionCookieCounts.value.global
        : regionCookieCounts.value[region as "global" | "us" | "eu"];

    return {
      value: region,
      label:
        region === "seller"
          ? `${REGION_LABELS[region]} · 复用主会话`
          : `${REGION_LABELS[region]} · Cookie ${cookieCount}`,
    };
  });
};

const resolveFieldOptions = (field: TemuActionField) => {
  if (field.key === "region") {
    return buildRegionOptions(selectedAction.value?.regionHints || []);
  }
  return field.options || [];
};

const syncSelection = () => {
  if (!actionCategoryTabs.value.length) {
    selectedCategoryKey.value = "";
    selectedActionKey.value = "";
    return;
  }

  if (!actionCategoryTabs.value.some((group) => group.key === selectedCategoryKey.value)) {
    selectedCategoryKey.value = actionCategoryTabs.value[0]?.key || "";
  }

  const actions = selectedCategoryActions.value;
  if (!actions.length) {
    selectedActionKey.value = "";
    return;
  }

  if (!actions.some((item) => item.key === selectedActionKey.value)) {
    const preferredAction = actions.find(
      (item) => item.status === "available" && hasPresetForAction(item.key),
    );
    const fallbackAction = actions.find((item) => hasPresetForAction(item.key));
    selectedActionKey.value =
      preferredAction?.key || fallbackAction?.key || actions[0]?.key || "";
  }
};

const resetFormState = () => {
  resetReactiveRecord(formState, buildDefaultFormState(selectedActionPreset.value?.fields || []));
  resetReactiveRecord(formErrors, {});
};

const jsonText = (value: any) => stringifyJson(value ?? null);

const validateForm = () => {
  const parsed: Record<string, any> = {};
  let valid = true;

  resetReactiveRecord(formErrors, {});
  (selectedActionPreset.value?.fields || []).forEach((field) => {
    try {
      const normalizedValue = validateAndNormalizeField(field, formState[field.key]);
      if (normalizedValue !== undefined) {
        parsed[field.key] = normalizedValue;
      }
    } catch (error: any) {
      formErrors[field.key] = error?.message || `请检查${field.label}`;
      valid = false;
    }
  });

  return {
    valid,
    parsed,
  };
};

const focusActionByKey = (actionKey?: string | null, clearSearch = false) => {
  const matched = catalogActionIndex.value.get(String(actionKey || "").trim());
  if (!matched) {
    return;
  }

  if (clearSearch) {
    actionSearchKeyword.value = "";
  }

  selectedCategoryKey.value = matched.groupKey;
  selectedActionKey.value = matched.key;
};

const applyFormSeed = (seed: TemuFormSeedAction) => {
  const nextState = buildFormPatchState(selectedActionPreset.value?.fields || [], seed.patch);
  Object.entries(nextState).forEach(([key, value]) => {
    formState[key] = value;
    formErrors[key] = "";
  });
  ElMessage.success(`${seed.label} 已带入`);
};

const copyText = async (label: string, text: string) => {
  const normalized = String(text || "").trim();
  if (!normalized) {
    ElMessage.warning(`${label} 暂无可复制内容`);
    return;
  }

  try {
    if (!navigator?.clipboard?.writeText) {
      throw new Error("clipboard_unsupported");
    }
    await navigator.clipboard.writeText(normalized);
    ElMessage.success(`${label} 已复制`);
  } catch {
    ElMessage.warning(`当前环境不支持自动复制，请手动复制${label}`);
  }
};

const loadCatalog = async () => {
  catalogLoading.value = true;
  try {
    const response = await getTemuCatalog();
    catalog.value = Array.isArray(response?.groups) ? response.groups : [];
    syncSelection();
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "获取 Temu 目录失败"));
  } finally {
    catalogLoading.value = false;
  }
};

const runAction = async () => {
  if (!props.profileId) {
    ElMessage.warning("请先选择在线客户端和执行环境");
    return;
  }
  if (!hasUsableSession.value) {
    ElMessage.warning("请先采集或选择一个已存储的 Temu 会话");
    return;
  }
  if (!selectedAction.value?.endpoint || !selectedActionPreset.value) {
    ElMessage.warning("当前动作暂未配置可执行表单");
    return;
  }

  const { valid, parsed } = validateForm();
  if (!valid) {
    ElMessage.warning("请先完善动作参数");
    return;
  }

  running.value = true;
  try {
    const payload = selectedActionPreset.value.buildPayload(parsed, props.profileId);
    const response = await executeTemuAction(selectedAction.value.endpoint, payload);
    lastResult.value = response;
    collapseNames.value = ["result"];
    ElMessage[response?.success ? "success" : "warning"](
      response?.message || `${selectedAction.value.label} 已返回结果`,
    );
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "执行 Temu 动作失败"));
  } finally {
    running.value = false;
  }
};

watch(
  actionCategoryTabs,
  () => {
    syncSelection();
  },
  { deep: true },
);

watch(selectedCategoryKey, () => {
  syncSelection();
});

watch(selectedActionKey, () => {
  resetFormState();
});

watch(
  () => props.profileId,
  () => {
    lastResult.value = null;
  },
);

onMounted(() => {
  void loadCatalog();
});
</script>

<style scoped lang="scss">
.temu-workspace {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.temu-workspace__toolbar,
.temu-workspace__editor-head,
.temu-workspace__result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.temu-workspace__editor-desc,
.temu-workspace__request-url,
.temu-workspace__note,
.temu-field__hint {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.65;
}

.temu-workspace__editor-tags,
.temu-workspace__result-tools,
.temu-workspace__toolbar-side {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.temu-workspace__action-shell,
.temu-workspace__result {
  padding: 9px 10px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.temu-insight-card {
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
}

.temu-insight-card span {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.temu-insight-card strong {
  display: block;
  margin-top: 3px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
  word-break: break-word;
}

.temu-workspace__section-title,
.temu-workspace__helper-label,
.temu-workspace__editor-title {
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 700;
}

.temu-workspace__toolbar-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
}

.temu-workspace__action-shell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.temu-workspace__counts {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 10px;
}

.temu-workspace__search {
  width: 190px;
}

.temu-workspace__feedback-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.temu-workspace__helper-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.temu-workspace__category-bar {
  overflow: hidden;
}

.temu-workspace__category-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: thin;
}

.temu-category-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: max-content;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;
}

.temu-category-tab span {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.temu-category-tab em {
  padding: 0 5px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 10px;
  font-style: normal;
  line-height: 1.4;
}

.temu-category-tab:hover {
  border-color: var(--el-border-color-dark);
  color: var(--el-text-color-primary);
}

.temu-category-tab.is-active {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.temu-category-tab.is-active em {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
}

.temu-function-button,
.temu-helper-chip {
  appearance: none;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.temu-function-button:hover,
.temu-helper-chip:hover {
  transform: translateY(-1px);
  border-color: var(--el-border-color-dark);
}

.temu-function-button__label,
.temu-helper-chip__title {
  color: var(--el-text-color-primary);
  font-size: 11px;
  font-weight: 700;
}

.temu-function-button__meta,
.temu-helper-chip__desc,
.temu-workspace__result-meta {
  color: var(--el-text-color-secondary);
  font-size: 10px;
  line-height: 1.55;
}

.temu-function-button.is-active .temu-function-button__label,
.temu-helper-chip--next .temu-helper-chip__title {
  color: var(--el-color-primary);
}

.temu-function-button.is-active .temu-function-button__status {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
}

.temu-workspace__action-grid,
.temu-workspace__insights {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.temu-workspace__action-grid {
  margin-top: 0;
}

.temu-function-button {
  padding: 8px 9px;
  border-radius: 10px;
  text-align: left;
}

.temu-function-button__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.temu-function-button__status {
  flex-shrink: 0;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 10px;
  line-height: 18px;
}

.temu-function-button__desc {
  display: -webkit-box;
  margin-top: 5px;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.temu-function-button__meta,
.temu-helper-chip__desc {
  display: block;
  margin-top: 6px;
}

.temu-function-button.is-active {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  box-shadow: inset 0 0 0 1px var(--el-color-primary-light-7);
}

.temu-function-button.is-disabled {
  cursor: not-allowed;
  opacity: 0.66;
}

.temu-workspace__editor,
.temu-workspace__filter-empty {
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-lighter);
}

.temu-workspace__helper-panel,
.temu-workspace__next-panel {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-light);
}

.temu-helper-chip {
  padding: 9px 11px;
  border-radius: 12px;
  max-width: 320px;
  text-align: left;
}

.temu-helper-chip--next {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.temu-workspace__form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.temu-field.is-wide {
  grid-column: 1 / -1;
}

.temu-field__label {
  margin-bottom: 6px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-weight: 600;
}

.temu-field__required {
  color: var(--el-color-danger);
}

.temu-field__control {
  width: 100%;
}

.temu-field__error {
  margin-top: 6px;
  color: var(--el-color-danger);
  font-size: 12px;
}

.temu-workspace__note {
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--el-fill-color-light);
}

.temu-workspace__runner {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.temu-workspace__unsupported,
.temu-workspace__filter-empty {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.75;
}

.temu-workspace__result-status,
.temu-workspace__result-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.temu-workspace__result-status {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
}

.temu-insight-card.is-accent {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.temu-insight-card.is-success {
  background: var(--el-color-success-light-9);
  border-color: var(--el-color-success-light-7);
}

.temu-insight-card.is-warning {
  background: var(--el-color-warning-light-9);
  border-color: var(--el-color-warning-light-7);
}

.temu-workspace__collapse {
  margin-top: 12px;
}

.temu-workspace__json {
  margin: 0;
  padding: 12px;
  border-radius: 12px;
  background: var(--el-fill-color-darker);
  color: var(--el-color-white);
  font-size: 12px;
  line-height: 1.7;
  overflow: auto;
  max-height: 360px;
}

@media (max-width: 1280px) {
  .temu-workspace__form,
  .temu-workspace__action-grid,
  .temu-workspace__insights {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .temu-workspace__toolbar,
  .temu-workspace__editor-head,
  .temu-workspace__result-head {
    flex-direction: column;
    align-items: stretch;
  }

  .temu-workspace__action-grid,
  .temu-workspace__insights,
  .temu-workspace__form {
    grid-template-columns: minmax(0, 1fr);
  }

  .temu-workspace__search {
    width: 100%;
  }

  .temu-workspace__toolbar-side,
  .temu-workspace__result-tools,
  .temu-workspace__runner {
    width: 100%;
  }

  .temu-workspace__runner {
    justify-content: stretch;
    flex-direction: column;
  }
}
</style>
