<template>
  <el-dialog
    :model-value="modelValue"
    :title="currentTask?.id ? t('operation.editSupplyMatchTask') : t('operation.createSupplyMatchTask')"
    fullscreen
    append-to-body
    destroy-on-close
    class="supply-match-task-dialog"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="task-dialog-shell">
      <div class="task-dialog-layout">
        <div class="task-dialog-main">
          <CompactNotice
            type="info"
            :title="t('operation.supportIndependentRunOrReuseHistory')"
            :description="t('operation.supplyMatchTaskDesc')"
            class="task-dialog-alert"
          />

          <CompactNotice
            v-if="hasSourceItemWithoutAnalysisRun"
            type="warning"
            :title="t('operation.filledSourceItemIdButNoAnalysisRun')"
            :description="t('operation.sourceItemIdsNeedAnalysisRunId')"
            class="task-dialog-alert"
          />

          <el-form label-position="top" class="task-dialog-form">
            <el-row :gutter="20">
              <el-col :xs="24" :lg="16">
                <el-form-item :label="t('operation.taskName')" required>
                  <el-input v-model="taskForm.name" :placeholder="t('operation.supplyMatchTaskNamePlaceholder')"/>
                  <div class="form-hint">
                    {{ t('operation.taskNameHint') }}
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="8">
                <el-form-item :label="t('operation.matchType')">
                  <el-select v-model="taskForm.matchType" disabled>
                    <el-option :label="t('operation.supplyMatch')" value="supply_match" />
                  </el-select>
                  <div class="form-hint">
                    {{ t('operation.matchTypeHint') }}
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="form-section-title">{{ t('operation.sourceRange') }}</div>
            <el-row :gutter="20">
              <el-col :xs="24" :lg="12">
                <el-form-item :label="t('operation.sourceAnalysisRun')">
                  <el-select
                    v-model="taskForm.sourceConfig.analysisRunId"
                    filterable
                    clearable
                    :placeholder="t('operation.sourceAnalysisRunPlaceholder')"
                  >
                    <el-option
                      v-for="item in analysisRunOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                  <div class="form-hint">
                    {{ t('operation.sourceAnalysisRunHint') }}
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="12">
                <el-form-item :label="t('operation.directSpecifyRawRecordIds')">
                  <el-input
                    v-model="rawRecordIdsText"
                    type="textarea"
                    :rows="5"
                    :placeholder="t('operation.rawRecordIdsPlaceholder')"
                  />
                  <div class="form-hint">
                    {{ t('operation.directSpecifyRawRecordIdsHint') }}
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="12">
                <el-form-item :label="t('operation.keywordOrTitleSeeds')">
                  <el-input
                    v-model="keywordSeedsText"
                    type="textarea"
                    :rows="5"
                    :placeholder="t('operation.keywordOrTitleSeedsPlaceholder')"
                  />
                  <div class="form-hint">
                    {{ t('operation.keywordOrTitleSeedsHint') }}
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="12">
                <el-form-item :label="t('operation.supplierPlatforms')">
                  <el-select
                    v-model="taskForm.optionsData.supplierPlatforms"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    clearable
                    :placeholder="t('operation.selectSupplierPlatforms')"
                    :loading="catalogLoading"
                  >
                    <el-option
                      v-for="item in supplierPlatformOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                      :disabled="item.disabled"
                    />
                  </el-select>
                  <div class="form-hint">
                    {{ t('operation.supplierPlatformsHint') }}
                  </div>
                  <div
                    v-if="!supplierPlatformOptions.length"
                    class="form-hint"
                  >
                    {{ t('operation.noSupplierPlatformsAvailable') }}
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="12">
                <el-form-item :label="t('operation.limitSourceItemIds')">
                  <el-input
                    v-model="sourceItemIdsText"
                    type="textarea"
                    :rows="5"
                    :placeholder="t('operation.sourceItemIdsPlaceholder')"
                  />
                  <div class="form-hint">{{ t('operation.limitSourceItemIdsHint') }}</div>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="form-section-title">{{ t('operation.matchingExecutionParams') }}</div>
            <el-row :gutter="20">
              <el-col :xs="24" :lg="4">
                <el-form-item :label="t('operation.sourceItemCount')">
                  <el-input-number
                    v-model="taskForm.optionsData.maxSourceItems"
                    :min="1"
                    :max="20"
                    controls-position="right"
                  />
                  <div class="form-hint">
                    {{ t('operation.sourceItemCountHint') }}
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="4">
                <el-form-item :label="t('operation.maxMatchesPerSource')">
                  <el-input-number
                    v-model="taskForm.optionsData.maxMatchesPerSource"
                    :min="1"
                    :max="20"
                    controls-position="right"
                  />
                  <div class="form-hint">
                    {{ t('operation.maxMatchesPerSourceHint') }}
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="4">
                <el-form-item :label="t('operation.maxDetailsPerSource')">
                  <el-input-number
                    v-model="taskForm.optionsData.maxDetailPerSource"
                    :min="0"
                    :max="10"
                    controls-position="right"
                  />
                  <div class="form-hint">
                    {{ t('operation.maxDetailsPerSourceHint') }}
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="6">
                <el-form-item :label="t('operation.maxCardsPerQuery')">
                  <el-input-number
                    v-model="taskForm.optionsData.maxSearchItemsPerQuery"
                    :min="1"
                    :max="20"
                    controls-position="right"
                  />
                  <div class="form-hint">
                    {{ t('operation.maxCardsPerQueryHint') }}
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="6">
                <el-form-item :label="t('operation.queryExpansionCount')">
                  <el-input-number
                    v-model="taskForm.optionsData.queryCount"
                    :min="1"
                    :max="6"
                    controls-position="right"
                  />
                  <div class="form-hint">
                    {{ t('operation.queryExpansionCountHint') }}
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="6">
                <el-form-item :label="t('operation.executionTimeoutMinutes')">
                  <el-input-number
                    v-model="taskForm.optionsData.timeoutMinutes"
                    :min="5"
                    :max="90"
                    controls-position="right"
                  />
                  <div class="form-hint">
                    {{ t('operation.executionTimeoutMinutesHint') }}
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="6">
                <el-form-item :label="t('operation.captureSnapshots')">
                  <el-switch v-model="taskForm.optionsData.captureSnapshots" />
                  <div class="form-hint">{{ t('operation.captureSnapshotsHint') }}</div>
                </el-form-item>
              </el-col>

              <el-col :xs="24">
                <el-form-item :label="t('operation.executionNotes')">
                  <el-input
                    v-model="taskForm.optionsData.notes"
                    type="textarea"
                    :rows="4"
                    :placeholder="t('operation.executionNotesPlaceholder')"
                  />
                  <div class="form-hint">
                    {{ t('operation.executionNotesHint') }}
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

          </el-form>
        </div>

        <div class="task-dialog-side">
          <div class="preview-card">
            <div class="preview-card__header">
              <div class="preview-card__title">{{ t('operation.executionPreview') }}</div>
              <el-tag size="small" type="info">{{ t('operation.clientExecution') }}</el-tag>
            </div>

            <div class="preview-metrics">
              <div class="preview-metric">
                <span class="preview-metric__label">{{ t('operation.analysisRun') }}</span>
                <strong>{{ taskForm.sourceConfig.analysisRunId ? 1 : 0 }}</strong>
              </div>
              <div class="preview-metric">
                <span class="preview-metric__label">{{ t('operation.sourceProducts') }}</span>
                <strong>{{
                  parsedSourceItemIds.length || taskForm.optionsData.maxSourceItems
                }}</strong>
              </div>
              <div class="preview-metric">
                <span class="preview-metric__label">{{ t('operation.rawRecords') }}</span>
                <strong>{{ parsedRawRecordIds.length }}</strong>
              </div>
              <div class="preview-metric">
                <span class="preview-metric__label">{{ t('operation.snapshot') }}</span>
                <strong>{{ taskForm.optionsData.captureSnapshots ? t('operation.enabled') : t('operation.disabled') }}</strong>
              </div>
            </div>

            <div class="preview-block">
              <div class="preview-block__label">{{ t('operation.executionDescription') }}</div>
              <div class="preview-block__text">
                {{ t('operation.executionDescriptionText') }}
              </div>
            </div>

            <div class="preview-block">
              <div class="preview-block__label">{{ t('operation.requestBody') }}</div>
              <pre class="json-preview">{{ requestPreviewText }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="task-dialog-footer-bar">
        <el-button @click="emit('update:modelValue', false)">{{ t('common.cancel') }}</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{ t('common.save') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from 'vue-i18n';
import { ElMessage } from "element-plus";
import {
  createEcomSelectionSupplyMatchTask,
  getEcomSelectionSupplyMatchCatalog,
  type EcomSelectionSupplyMatchCatalog,
  updateEcomSelectionSupplyMatchTask,
  type EcomSelectionSupplyMatchTask,
} from "@/api/operation/ecomSelectionSupplyMatch";
import type { EcomSelectionAnalysisRun } from "@/api/operation/ecomSelectionAnalysis";
import CompactNotice from "@/components/CompactNotice/index.vue";
import {
  formatDateTime,
  getRunStatusLabel,
  parseTextareaList,
} from "@/views/operation/ecom-data/shared";

const { t } = useI18n();

type SupplyMatchTaskForm = {
  name: string;
  matchType: string;
  sourceConfig: {
    analysisRunId: string;
    sourceItemIds: string[];
    rawRecordIds: string[];
    keywordSeeds: string[];
  };
  optionsData: {
    supplierPlatforms: string[];
    maxSourceItems: number;
    maxMatchesPerSource: number;
    maxDetailPerSource: number;
    maxSearchItemsPerQuery: number;
    queryCount: number;
    captureSnapshots: boolean;
    timeoutMinutes: number;
    notes: string;
  };
};

const props = defineProps<{
  modelValue: boolean;
  task?: EcomSelectionSupplyMatchTask | null;
  analysisRuns: EcomSelectionAnalysisRun[];
  presetAnalysisRunId?: string;
  presetSourceItemIds?: string[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const catalog = ref<EcomSelectionSupplyMatchCatalog>({
  matchTypes: [{ label: t('operation.supplyMatch'), value: "supply_match" }],
  supplierPlatforms: [],
});

const createDefaultForm = (): SupplyMatchTaskForm => ({
  name: "",
  matchType: "supply_match",
  sourceConfig: {
    analysisRunId: "",
    sourceItemIds: [],
    rawRecordIds: [],
    keywordSeeds: [],
  },
  optionsData: {
    supplierPlatforms: [],
    maxSourceItems: 5,
    maxMatchesPerSource: 5,
    maxDetailPerSource: 3,
    maxSearchItemsPerQuery: 8,
    queryCount: 3,
    captureSnapshots: false,
    timeoutMinutes: 30,
    notes: "",
  },
});

const taskForm = reactive(createDefaultForm());
const sourceItemIdsText = ref("");
const rawRecordIdsText = ref("");
const keywordSeedsText = ref("");
const submitting = ref(false);
const catalogLoading = ref(false);
const supplierPlatformOptions = computed(() =>
  (catalog.value.supplierPlatforms || []).map((item) => ({
    label: item.label || item.value,
    value: item.value,
    disabled: item.runnable === false,
  })),
);
const defaultSupplierPlatforms = computed(() => {
  const runnablePlatforms = supplierPlatformOptions.value
    .filter((item) => item.disabled !== true)
    .map((item) => item.value);
  if (runnablePlatforms.length) {
    return runnablePlatforms.slice(0, 1);
  }
  return supplierPlatformOptions.value.length
    ? [supplierPlatformOptions.value[0].value]
    : [];
});

const currentTask = computed(() => props.task || null);

const availableAnalysisRuns = computed(() =>
  props.analysisRuns.filter(
    (item) =>
      item.analysisType === "hot_selling_selection" &&
      item.status === "success",
  ),
);

const analysisRunOptions = computed(() => {
  const map = new Map<string, string>();

  availableAnalysisRuns.value.forEach((item) => {
    map.set(
      item.id,
      `${item.taskName || item.id} · ${getRunStatusLabel(item.status)} · ${formatDateTime(item.finishedAt || item.createTime)}`,
    );
  });

  const currentId = String(taskForm.sourceConfig.analysisRunId || "").trim();
  if (currentId && !map.has(currentId)) {
    map.set(currentId, `${t('operation.analysisRun')}: ${currentId}`);
  }

  return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
});

const parsedSourceItemIds = computed(() => parseTextareaList(sourceItemIdsText.value));
const parsedRawRecordIds = computed(() => parseTextareaList(rawRecordIdsText.value));
const parsedKeywordSeeds = computed(() => parseTextareaList(keywordSeedsText.value));

const canSubmit = computed(() => {
  return !!(
    taskForm.name.trim() &&
    (
      taskForm.sourceConfig.analysisRunId ||
      parsedRawRecordIds.value.length ||
      parsedKeywordSeeds.value.length
    )
  );
});

const hasSourceItemWithoutAnalysisRun = computed(() => {
  return !!(parsedSourceItemIds.value.length && !taskForm.sourceConfig.analysisRunId);
});

const normalizedPayload = computed(() => ({
  name: taskForm.name.trim(),
  matchType: taskForm.matchType,
  sourceConfig: {
    analysisRunId: String(taskForm.sourceConfig.analysisRunId || "").trim(),
    sourceItemIds: parsedSourceItemIds.value,
    rawRecordIds: parsedRawRecordIds.value,
    keywordSeeds: parsedKeywordSeeds.value,
  },
  optionsData: {
    supplierPlatforms: taskForm.optionsData.supplierPlatforms,
    maxSourceItems: taskForm.optionsData.maxSourceItems,
    maxMatchesPerSource: taskForm.optionsData.maxMatchesPerSource,
    maxDetailPerSource: taskForm.optionsData.maxDetailPerSource,
    maxSearchItemsPerQuery: taskForm.optionsData.maxSearchItemsPerQuery,
    queryCount: taskForm.optionsData.queryCount,
    captureSnapshots: !!taskForm.optionsData.captureSnapshots,
    timeoutMinutes: taskForm.optionsData.timeoutMinutes,
    notes: taskForm.optionsData.notes.trim(),
  },
}));

const requestPreviewText = computed(() => JSON.stringify(normalizedPayload.value, null, 2));

const ensureSupplierPlatformsSelected = () => {
  const allowedValues = new Set(
    supplierPlatformOptions.value.map((item) => String(item.value || "").trim()),
  );
  const selectedValues = Array.isArray(taskForm.optionsData.supplierPlatforms)
    ? taskForm.optionsData.supplierPlatforms
        .map((item) => String(item || "").trim())
        .filter((item) => allowedValues.has(item))
    : [];

  taskForm.optionsData.supplierPlatforms = selectedValues.length
    ? selectedValues
    : [...defaultSupplierPlatforms.value];
};

const loadCatalog = async () => {
  catalogLoading.value = true;
  try {
    const data = await getEcomSelectionSupplyMatchCatalog();
    catalog.value = {
      matchTypes: Array.isArray(data?.matchTypes) && data.matchTypes.length
        ? data.matchTypes
        : [{ label: t('operation.supplyMatch'), value: "supply_match" }],
      supplierPlatforms: Array.isArray(data?.supplierPlatforms) ? data.supplierPlatforms : [],
      meta: data?.meta || {},
    };
    ensureSupplierPlatformsSelected();
  } finally {
    catalogLoading.value = false;
  }
};

const resetForm = () => {
  const next = createDefaultForm();
  taskForm.name = next.name;
  taskForm.matchType = next.matchType;
  taskForm.sourceConfig.analysisRunId = next.sourceConfig.analysisRunId;
  taskForm.sourceConfig.sourceItemIds = [...next.sourceConfig.sourceItemIds];
  taskForm.sourceConfig.rawRecordIds = [...next.sourceConfig.rawRecordIds];
  taskForm.optionsData.supplierPlatforms = [...defaultSupplierPlatforms.value];
  taskForm.optionsData.maxSourceItems = next.optionsData.maxSourceItems;
  taskForm.optionsData.maxMatchesPerSource = next.optionsData.maxMatchesPerSource;
  taskForm.optionsData.maxDetailPerSource = next.optionsData.maxDetailPerSource;
  taskForm.optionsData.maxSearchItemsPerQuery = next.optionsData.maxSearchItemsPerQuery;
  taskForm.optionsData.queryCount = next.optionsData.queryCount;
  taskForm.optionsData.captureSnapshots = next.optionsData.captureSnapshots;
  taskForm.optionsData.timeoutMinutes = next.optionsData.timeoutMinutes;
  taskForm.optionsData.notes = next.optionsData.notes;
  sourceItemIdsText.value = "";
  rawRecordIdsText.value = "";
  keywordSeedsText.value = "";
};

const hydrateForm = (task?: EcomSelectionSupplyMatchTask | null) => {
  resetForm();

  if (task) {
    taskForm.name = String(task.name || "").trim();
    taskForm.matchType = String(task.matchType || "supply_match").trim();
    taskForm.sourceConfig.analysisRunId = String(task.sourceConfig?.analysisRunId || "").trim();
    taskForm.optionsData.supplierPlatforms = Array.isArray(task.optionsData?.supplierPlatforms)
      ? task.optionsData?.supplierPlatforms.filter(Boolean)
      : [...defaultSupplierPlatforms.value];
    taskForm.optionsData.maxSourceItems = Number(task.optionsData?.maxSourceItems || 5);
    taskForm.optionsData.maxMatchesPerSource = Number(task.optionsData?.maxMatchesPerSource || 5);
    taskForm.optionsData.maxDetailPerSource = Number(task.optionsData?.maxDetailPerSource || 3);
    taskForm.optionsData.maxSearchItemsPerQuery = Number(
      task.optionsData?.maxSearchItemsPerQuery || 8,
    );
    taskForm.optionsData.queryCount = Number(task.optionsData?.queryCount || 3);
    taskForm.optionsData.captureSnapshots = !!task.optionsData?.captureSnapshots;
    taskForm.optionsData.timeoutMinutes = Number(task.optionsData?.timeoutMinutes || 30);
    taskForm.optionsData.notes = String(task.optionsData?.notes || "").trim();
    sourceItemIdsText.value = Array.isArray(task.sourceConfig?.sourceItemIds)
      ? task.sourceConfig?.sourceItemIds.filter(Boolean).join("\n")
      : "";
    rawRecordIdsText.value = Array.isArray(task.sourceConfig?.rawRecordIds)
      ? task.sourceConfig?.rawRecordIds.filter(Boolean).join("\n")
      : "";
    keywordSeedsText.value = Array.isArray(task.sourceConfig?.keywordSeeds)
      ? task.sourceConfig?.keywordSeeds.filter(Boolean).join("\n")
      : "";
    ensureSupplierPlatformsSelected();
    return;
  }

  if (props.presetAnalysisRunId) {
    taskForm.sourceConfig.analysisRunId = String(props.presetAnalysisRunId || "").trim();
  }
  if (Array.isArray(props.presetSourceItemIds) && props.presetSourceItemIds.length) {
    sourceItemIdsText.value = props.presetSourceItemIds.filter(Boolean).join("\n");
  }
  ensureSupplierPlatformsSelected();
};

watch(
  () => props.modelValue,
  async (visible) => {
    if (visible) {
      await loadCatalog();
      hydrateForm(props.task || null);
    }
  },
  { immediate: true },
);

const handleSubmit = async () => {
  if (!taskForm.name.trim()) {
    ElMessage.warning(t('operation.pleaseFillTaskNameFirst'));
    return;
  }

  if (
    !taskForm.sourceConfig.analysisRunId &&
    !parsedRawRecordIds.value.length &&
    !parsedKeywordSeeds.value.length
  ) {
    ElMessage.warning(t('operation.pleaseSelectAnalysisRunOrFillRawRecordIdsOrKeywordSeeds'));
    return;
  }

  submitting.value = true;
  try {
    if (currentTask.value?.id) {
      await updateEcomSelectionSupplyMatchTask(currentTask.value.id, normalizedPayload.value);
      ElMessage.success(t('operation.supplyMatchTaskUpdated'));
    } else {
      await createEcomSelectionSupplyMatchTask(normalizedPayload.value);
      ElMessage.success(t('operation.supplyMatchTaskCreated'));
    }

    emit("success");
    emit("update:modelValue", false);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.task-dialog-shell {
  min-height: calc(100vh - 150px);
}

.task-dialog-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  min-height: 100%;
}

.task-dialog-main,
.task-dialog-side {
  min-width: 0;
}

.task-dialog-form {
  padding: 18px 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
}

.task-dialog-alert {
  margin-bottom: 14px;
}

.form-section-title {
  margin: 10px 0 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.form-hint {
  margin-top: 6px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-placeholder);
}

.preview-card {
  position: sticky;
  top: 0;
  padding: 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
}

.preview-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.preview-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.preview-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.preview-metric {
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.preview-metric__label {
  display: block;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.preview-metric strong {
  display: block;
  margin-top: 4px;
  font-size: 18px;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.preview-block {
  margin-top: 16px;
}

.preview-block__label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.preview-block__text {
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.json-preview {
  max-height: calc(100vh - 360px);
  padding: 14px;
  margin: 0;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  word-break: break-word;
  white-space: pre-wrap;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.task-dialog-footer-bar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

@media (width <= 1200px) {
  .task-dialog-layout {
    grid-template-columns: 1fr;
  }

  .preview-card {
    position: static;
  }

  .json-preview {
    max-height: 420px;
  }
}
</style>
