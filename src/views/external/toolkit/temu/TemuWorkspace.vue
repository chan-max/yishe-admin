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
          <el-button
            text
            size="small"
            :loading="catalogLoading || !!toolsLoading"
            @click="refreshWorkspaceActions"
          >
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
                v-model="activeActionState.formState[field.key]"
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
                v-model="activeActionState.formState[field.key]"
                class="temu-field__control"
                :controls="false"
              />

              <el-input
                v-else
                v-model="activeActionState.formState[field.key]"
                :type="
                  field.type === 'json' ||
                  field.type === 'textarea' ||
                  field.type.startsWith('array')
                    ? 'textarea'
                    : 'text'
                "
                class="temu-field__control"
                :autosize="
                  field.type === 'json' ||
                  field.type === 'textarea' ||
                  field.type.startsWith('array')
                    ? { minRows: field.rows || 3, maxRows: field.type === 'json' ? 14 : 8 }
                    : undefined
                "
                :placeholder="field.placeholder || `请输入${field.label}`"
              />

              <div v-if="field.hint" class="temu-field__hint">{{ field.hint }}</div>
              <div v-if="activeActionState.formErrors[field.key]" class="temu-field__error">
                {{ activeActionState.formErrors[field.key] }}
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
              :loading="activeActionRunning"
              :disabled="!canRunSelectedAction || (isAnyActionRunning && !activeActionRunning)"
              @click="runAction"
            >
              {{ canRunSelectedAction ? "执行动作" : runButtonLabel }}
            </el-button>
          </div>
        </div>

        <div v-else class="temu-workspace__unsupported">
          当前动作已经接到目录里了，但前端还没有配置专用表单。后续可以继续把它可视化。
        </div>

        <div v-if="activeActionResult" class="temu-workspace__result">
          <div class="temu-workspace__result-head">
            <div class="temu-workspace__result-title">
              <span>原始结果</span>
              <el-tag
                size="small"
                effect="plain"
                :type="activeActionResult.success ? 'success' : 'danger'"
              >
                {{ activeActionResult.success ? "成功" : "失败" }}
              </el-tag>
            </div>

            <div class="temu-workspace__result-tools">
              <el-button
                v-if="canCopyPublishTemplate"
                text
                size="small"
                @click="copyText('商品模板', publishTemplateText)"
              >
                复制商品模板
              </el-button>
              <el-button text size="small" @click="copyText('原始结果', actionResultText)">
                复制结果
              </el-button>
            </div>
          </div>

          <pre class="temu-workspace__json">{{ actionResultText }}</pre>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { computed, onMounted, reactive, ref, watch } from "vue";
import type { ToolkitToolItem } from "@/api/external/toolkit";
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
  REGION_LABELS,
  TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY,
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
  countObjectKeys,
  extractRequestErrorMessage,
  stringifyJson,
  validateAndNormalizeField,
} from "./temuWorkspace.helpers";

defineOptions({ name: "ToolkitTemuWorkspace" });

interface TemuActionWorkspaceState {
  formState: Record<string, any>;
  formErrors: Record<string, string>;
  lastResult: TemuActionResponse | null;
}

interface TemuWorkspaceAction extends TemuCatalogAction {
  executionType?: "api" | "tool";
  featureKey?: string;
}

interface TemuWorkspaceActionGroup extends Omit<TemuCatalogGroup, "actions"> {
  actions: TemuWorkspaceAction[];
}

const props = defineProps<{
  clientId?: string;
  profileId?: string;
  sessionRecord?: Record<string, any> | null;
  toolItems?: ToolkitToolItem[];
  toolsLoading?: boolean;
  runningFeatureKey?: string;
  toolBusy?: boolean;
  toolResults?: Record<string, any> | null;
}>();

const emit = defineEmits<{
  (e: "refresh-tools"): void;
  (e: "run-tool", payload: { featureKey: string; payload: Record<string, any> }): void;
}>();

const flattenCatalogActions = (groups: Array<{ actions: TemuCatalogAction[] }> = []) =>
  groups.flatMap((group) => group.actions);

const resetReactiveRecord = (target: Record<string, any>, nextValue: Record<string, any> = {}) => {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.entries(nextValue).forEach(([key, value]) => {
    target[key] = value;
  });
};

const catalogLoading = ref(false);
const runningActionKey = ref("");
const selectedCategoryKey = ref("");
const selectedActionKey = ref("");
const actionSearchKeyword = ref("");
const catalog = ref<TemuCatalogGroup[]>([]);
const actionWorkspaceStates = reactive<Record<string, TemuActionWorkspaceState>>({});

const sessionRecord = computed(() => asPlainObject(props.sessionRecord));
const sessionData = computed(() => asPlainObject(sessionRecord.value?.session));
const regionCookieCounts = computed(() => ({
  global: countObjectKeys(sessionData.value?.global?.cookies),
  us: countObjectKeys(sessionData.value?.us?.cookies),
  eu: countObjectKeys(sessionData.value?.eu?.cookies),
}));
const hasUsableSession = computed(() => regionCookieCounts.value.global > 0);

const normalizedSearchKeyword = computed(() => actionSearchKeyword.value.trim().toLowerCase());

const publishDetailToolItem = computed<ToolkitToolItem | null>(() => {
  const matched = (Array.isArray(props.toolItems) ? props.toolItems : []).find(
    (item) => String(item?.key || "").trim() === TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY,
  );
  return matched || null;
});

const publishDetailToolAction = computed<TemuWorkspaceAction>(() => {
  const item = publishDetailToolItem.value;
  const rawName = String(item?.name || "").trim();
  const label = rawName.replace(/^temu\s*/i, "").trim() || "根据商品spuId 获取 商品发布模板";
  return {
    key: TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY,
    label,
    description:
      String(item?.description || "").trim() ||
      "输入商品 spuId 后打开商品发布详情页，自动点击“提交”，并返回商品发布模板请求里的 POST 参数。",
    endpoint: "__tool__",
    method: "POST",
    regionHints: ["global"],
    status: "available",
    executionType: "tool",
    featureKey: TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY,
  };
});

const mergedCatalog = computed<TemuWorkspaceActionGroup[]>(() => {
  const groups = catalog.value.map((group) => ({
    ...group,
    actions: Array.isArray(group.actions) ? [...group.actions] : [],
  }));

  const targetGroup =
    groups.find((group) => group.key === "goods") ||
    (() => {
      const nextGroup: TemuWorkspaceActionGroup = {
        key: "goods",
        label: "商品与上新",
        description: "商品相关动作。",
        actions: [],
      };
      groups.unshift(nextGroup);
      return nextGroup;
    })();

  if (
    !targetGroup.actions.some(
      (action) => action.key === TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY,
    )
  ) {
    const goodsDetailIndex = targetGroup.actions.findIndex(
      (action) => action.key === "goods.detail",
    );
    if (goodsDetailIndex >= 0) {
      targetGroup.actions.splice(goodsDetailIndex + 1, 0, publishDetailToolAction.value);
    } else {
      targetGroup.actions.push(publishDetailToolAction.value);
    }
  }

  return groups;
});

const isToolAction = (action?: Pick<TemuWorkspaceAction, "key" | "executionType"> | null) =>
  !!action &&
  (action.executionType === "tool" ||
    String(action.key || "").trim() === TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY);

const catalogActionIndex = computed(() => {
  const actionMap = new Map<string, TemuIndexedCatalogAction>();
  mergedCatalog.value.forEach((group) => {
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
    return mergedCatalog.value;
  }

  return mergedCatalog.value.reduce((result, group) => {
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
  }, [] as TemuWorkspaceActionGroup[]);
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
const selectedAction = computed<TemuWorkspaceAction | null>(
  () =>
    selectedCategoryActions.value.find((item) => item.key === selectedActionKey.value) ||
    visibleActions.value.find((item) => item.key === selectedActionKey.value) ||
    null,
);
const selectedActionPreset = computed(() =>
  selectedAction.value ? ACTION_PRESETS[selectedAction.value.key] || null : null,
);
const createActionWorkspaceState = (actionKey?: string | null): TemuActionWorkspaceState => {
  const preset = ACTION_PRESETS[String(actionKey || "").trim()];
  return {
    formState: buildDefaultFormState(preset?.fields || []),
    formErrors: {},
    lastResult: null,
  };
};

const ensureActionWorkspaceState = (actionKey?: string | null) => {
  const normalizedKey = String(actionKey || "").trim();
  if (!normalizedKey) {
    return null;
  }

  if (!actionWorkspaceStates[normalizedKey]) {
    actionWorkspaceStates[normalizedKey] = createActionWorkspaceState(normalizedKey);
  }

  return actionWorkspaceStates[normalizedKey];
};

const emptyActionWorkspaceState: TemuActionWorkspaceState = {
  formState: {},
  formErrors: {},
  lastResult: null,
};

const activeActionState = computed(
  () => ensureActionWorkspaceState(selectedAction.value?.key) || emptyActionWorkspaceState,
);
const visibleActionCount = computed(() => flattenCatalogActions(actionCategoryTabs.value).length);
const availableActionCount = computed(
  () =>
    flattenCatalogActions(actionCategoryTabs.value).filter(
      (action) => action.status === "available" && !!ACTION_PRESETS[action.key],
    ).length,
);

const formSeedActions = computed<TemuFormSeedAction[]>(() =>
  buildFormSeedActions(selectedAction.value?.key, activeActionState.value.lastResult),
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
const activeToolRecord = computed(() => {
  if (!selectedAction.value || !isToolAction(selectedAction.value)) {
    return null;
  }

  const toolResults = asPlainObject(props.toolResults);
  const record = asPlainObject(toolResults[selectedAction.value.key]);
  return Object.keys(record).length ? record : null;
});
const activeActionResult = computed<TemuActionResponse | null>(() => {
  if (isToolAction(selectedAction.value)) {
    const record = activeToolRecord.value;
    if (!record) {
      return null;
    }

    return {
      success: record.success !== false,
      action: selectedAction.value?.key,
      message: String(record.message || "").trim(),
      profileId: props.profileId,
      result:
        record.output !== undefined
          ? record.output
          : record.result !== undefined
            ? record.result
            : null,
      raw:
        record.result && typeof record.result === "object"
          ? record.result
          : record.output && typeof record.output === "object"
            ? record.output
            : null,
    };
  }

  return activeActionState.value.lastResult;
});
const activeActionRunning = computed(() => {
  if (!selectedAction.value?.key) {
    return false;
  }

  if (isToolAction(selectedAction.value)) {
    return props.runningFeatureKey === selectedAction.value.key;
  }

  return runningActionKey.value === selectedAction.value.key;
});
const isAnyActionRunning = computed(() => !!runningActionKey.value || !!props.toolBusy);
const actionResultText = computed(() => jsonText(activeActionResult.value ?? null));
const resolvePublishTemplateValue = (result: TemuActionResponse | null) => {
  if (
    !result ||
    String(result.action || "").trim() !== TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY
  ) {
    return null;
  }

  const resultValue = asPlainObject(result.result);
  const rawValue = asPlainObject(result.raw);
  const candidateContainers = [
    resultValue,
    asPlainObject(resultValue.data),
    rawValue,
    asPlainObject(rawValue.data),
  ];

  for (const container of candidateContainers) {
    if (Object.prototype.hasOwnProperty.call(container, "postDataJson")) {
      const postDataJson = container.postDataJson;
      if (postDataJson !== undefined && postDataJson !== null) {
        return postDataJson;
      }
    }
  }

  return null;
};
const publishTemplateText = computed(() => {
  const value = resolvePublishTemplateValue(activeActionResult.value);
  return value === null ? "" : jsonText(value);
});
const canCopyPublishTemplate = computed(() => !!publishTemplateText.value.trim());
const canRunSelectedAction = computed(() => {
  if (!selectedAction.value || !selectedActionPreset.value) {
    return false;
  }

  if (isToolAction(selectedAction.value)) {
    return !!(props.clientId && props.profileId && hasUsableSession.value);
  }

  return !!(props.profileId && hasUsableSession.value && selectedAction.value.endpoint);
});
const runButtonLabel = computed(() => {
  if (isAnyActionRunning.value && !activeActionRunning.value) {
    return "动作执行中";
  }
  if (isToolAction(selectedAction.value) && !props.clientId) {
    return "先选择客户端";
  }
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

const isRunnableAction = (action?: Pick<TemuWorkspaceAction, "key" | "status"> | null) =>
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
    selectedActionKey.value = preferredAction?.key || fallbackAction?.key || actions[0]?.key || "";
  }
};

const resetFormState = () => {
  const state = activeActionState.value;
  resetReactiveRecord(
    state.formState,
    buildDefaultFormState(selectedActionPreset.value?.fields || []),
  );
  resetReactiveRecord(state.formErrors, {});
};

const jsonText = (value: any) => stringifyJson(value ?? null);

const validateForm = () => {
  const state = activeActionState.value;
  const parsed: Record<string, any> = {};
  let valid = true;

  resetReactiveRecord(state.formErrors, {});
  (selectedActionPreset.value?.fields || []).forEach((field) => {
    try {
      const normalizedValue = validateAndNormalizeField(field, state.formState[field.key]);
      if (normalizedValue !== undefined) {
        parsed[field.key] = normalizedValue;
      }
    } catch (error: any) {
      state.formErrors[field.key] = error?.message || `请检查${field.label}`;
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
  const state = activeActionState.value;
  const nextState = buildFormPatchState(selectedActionPreset.value?.fields || [], seed.patch);
  Object.entries(nextState).forEach(([key, value]) => {
    state.formState[key] = value;
    state.formErrors[key] = "";
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

const refreshWorkspaceActions = async () => {
  emit("refresh-tools");
  await loadCatalog();
};

const runAction = async () => {
  const state = activeActionState.value;
  const action = selectedAction.value;
  if (!action || !selectedActionPreset.value) {
    ElMessage.warning("当前动作暂未配置可执行表单");
    return;
  }
  if (isToolAction(action) && !props.clientId) {
    ElMessage.warning("请先选择在线客户端");
    return;
  }
  if (!props.profileId) {
    ElMessage.warning("请先选择在线客户端和执行环境");
    return;
  }
  if (!hasUsableSession.value) {
    ElMessage.warning("请先采集或选择一个已存储的 Temu 会话");
    return;
  }

  if (runningActionKey.value || props.toolBusy) {
    ElMessage.warning("当前已有动作正在执行，请稍候");
    return;
  }

  const { valid, parsed } = validateForm();
  if (!valid) {
    ElMessage.warning("请先完善动作参数");
    return;
  }

  if (isToolAction(action)) {
    emit("run-tool", {
      featureKey: action.featureKey || action.key,
      payload: selectedActionPreset.value.buildPayload(parsed, props.profileId),
    });
    return;
  }

  runningActionKey.value = String(action.key || "").trim();
  try {
    const payload = selectedActionPreset.value.buildPayload(parsed, props.profileId);
    const response = await executeTemuAction(action.endpoint, payload);
    state.lastResult = response;
    ElMessage[response?.success ? "success" : "warning"](
      response?.message || `${action.label} 已返回结果`,
    );
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "执行 Temu 动作失败"));
  } finally {
    runningActionKey.value = "";
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

watch(
  () => props.profileId,
  () => {
    Object.values(actionWorkspaceStates).forEach((state) => {
      state.lastResult = null;
    });
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
  gap: 14px;
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
.temu-workspace__note,
.temu-field__hint {
  margin-top: 4px;
  color: var(--el-text-color-regular);
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

.temu-workspace__action-shell {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.temu-workspace__result {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
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
  gap: 14px;
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
  gap: 10px;
}

.temu-workspace__form-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
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
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
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
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-regular);
  font-size: 10px;
  font-style: normal;
  line-height: 1.4;
}

.temu-category-tab:hover {
  border-color: var(--el-border-color-dark);
  color: var(--el-text-color-primary);
}

.temu-category-tab.is-active {
  border-color: color-mix(in srgb, var(--el-color-primary) 35%, white);
  background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
  color: var(--el-color-primary);
}

.temu-category-tab.is-active em {
  background: color-mix(in srgb, var(--el-color-primary) 16%, white);
  color: var(--el-color-primary);
}

.temu-function-button,
.temu-helper-chip {
  appearance: none;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.temu-function-button:hover,
.temu-helper-chip:hover {
  border-color: var(--el-border-color-dark);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.temu-function-button__label,
.temu-helper-chip__title {
  color: var(--el-text-color-primary);
  font-size: 11px;
  font-weight: 700;
}

.temu-function-button__meta,
.temu-helper-chip__desc {
  color: var(--el-text-color-regular);
  font-size: 11px;
  line-height: 1.55;
}

.temu-function-button.is-active .temu-function-button__label {
  color: var(--el-color-primary);
}

.temu-function-button.is-active .temu-function-button__status {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
}

.temu-workspace__action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 220px));
  gap: 10px;
}

.temu-function-button {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 104px;
  padding: 10px;
  border-radius: 12px;
  text-align: left;
  background: var(--el-fill-color-blank);
}

.temu-function-button__label {
  display: -webkit-box;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.temu-function-button__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}

.temu-function-button__status {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-regular);
  font-size: 10px;
  line-height: 18px;
}

.temu-function-button__desc {
  display: -webkit-box;
  margin-top: 6px;
  overflow: hidden;
  color: var(--el-text-color-regular);
  font-size: 11px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.temu-function-button__meta,
.temu-helper-chip__desc {
  display: block;
  margin-top: auto;
}

.temu-function-button__meta {
  padding-top: 8px;
  color: var(--el-text-color-placeholder);
  font-size: 10px;
  line-height: 1.4;
  word-break: break-all;
}

.temu-function-button.is-active {
  border-color: color-mix(in srgb, var(--el-color-primary) 36%, white);
  background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color));
}

.temu-function-button.is-active .temu-function-button__desc,
.temu-function-button.is-active .temu-function-button__meta {
  color: var(--el-text-color-primary);
}

.temu-function-button.is-disabled {
  cursor: not-allowed;
  opacity: 0.66;
}

.temu-workspace__editor,
.temu-workspace__filter-empty {
  padding: 0;
  border: 0;
  background: transparent;
}

.temu-workspace__editor::before,
.temu-workspace__filter-empty::before {
  content: "";
  display: block;
  margin-bottom: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.temu-workspace__editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.temu-workspace__helper-panel {
  padding: 0;
  border: 0;
  background: transparent;
}

.temu-helper-chip {
  padding: 9px 10px;
  border-radius: 10px;
  max-width: 320px;
  text-align: left;
  background: var(--el-fill-color-extra-light);
}

.temu-workspace__form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
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
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color);
  border-radius: 0;
  border-right: 0;
  border-bottom: 0;
  border-left: 0;
  background: transparent;
}

.temu-workspace__runner {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.temu-workspace__unsupported,
.temu-workspace__filter-empty {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.75;
}

.temu-workspace__result-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
}

.temu-workspace__json {
  margin: 0;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 12px;
  line-height: 1.7;
  overflow: auto;
  max-height: 720px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family:
    "SFMono-Regular", "JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, monospace;
}

@media (max-width: 1280px) {
  .temu-workspace__action-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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
