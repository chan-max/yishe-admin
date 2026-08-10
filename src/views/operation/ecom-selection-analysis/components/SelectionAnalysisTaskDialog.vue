<template>
  <el-dialog
    :model-value="modelValue"
    :title="currentTask?.id ? '编辑选品分析任务' : '新建选品分析任务'"
    fullscreen
    append-to-body
    destroy-on-close
    class="selection-analysis-task-dialog"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="task-dialog-shell">
      <div class="task-dialog-layout">
        <div class="task-dialog-main">
          <CompactNotice
            v-if="!collectTasks.length && !collectRuns.length"
            type="warning"
            title="当前没有可选的采集任务或运行"
            description="你仍可直接填写原始记录 ID 创建分析任务。"
            class="task-dialog-alert"
          />

          <el-form label-position="top" class="task-dialog-form">
            <div class="form-section-title">基础信息</div>
            <el-row :gutter="20">
              <el-col :xs="24" :lg="14">
                <el-form-item label="任务名称" required>
                  <el-input v-model="taskForm.name" placeholder="例如：无线耳机热门选品" />
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="10">
                <el-form-item label="分析类型">
                  <el-select v-model="taskForm.analysisType">
                    <el-option
                      v-for="item in analysisTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="form-section-title">数据范围</div>
            <el-row :gutter="20">
              <el-col :xs="24" :lg="12">
                <el-form-item label="采集任务">
                  <el-select
                    v-model="taskForm.sourceConfig.taskIds"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    filterable
                    clearable
                    placeholder="按采集任务筛选"
                  >
                    <el-option
                      v-for="item in collectTaskOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                  <div class="form-hint">不选时，可继续通过采集运行或原始记录 ID 收窄范围。</div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="12">
                <el-form-item label="采集运行">
                  <el-select
                    v-model="taskForm.sourceConfig.runIds"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    filterable
                    clearable
                    placeholder="按采集运行筛选"
                  >
                    <el-option
                      v-for="item in collectRunOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                  <div class="form-hint">适合锁定某几次明确的采集执行结果。</div>
                </el-form-item>
              </el-col>

              <el-col :xs="24">
                <el-form-item label="原始记录 ID">
                  <el-input
                    v-model="rawRecordIdsText"
                    type="textarea"
                    :rows="4"
                    placeholder="一行一个 rawRecordId"
                  />
                  <div class="form-hint">直接基于指定原始记录做分析时使用。</div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="8">
                <el-form-item label="最大样本数">
                  <el-input-number
                    v-model="taskForm.sourceConfig.limit"
                    :min="1"
                    :max="80"
                    controls-position="right"
                  />
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="8">
                <el-form-item label="仅保留详情样本">
                  <el-switch v-model="taskForm.sourceConfig.requireDetail" />
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="8">
                <el-form-item label="目标市场">
                  <el-input v-model="taskForm.analysisConfig.targetMarket" placeholder="例如：US" />
                </el-form-item>
              </el-col>
            </el-row>

            <div class="form-section-title">分析参数</div>
            <el-row :gutter="20">
              <el-col v-if="isHotSellingAnalysis" :xs="24" :lg="8">
                <el-form-item label="输出 Top N">
                  <el-input-number
                    v-model="taskForm.analysisConfig.topN"
                    :min="1"
                    :max="20"
                    controls-position="right"
                  />
                </el-form-item>
              </el-col>

              <el-col v-if="isCustomPromptAnalysis" :xs="24">
                <el-form-item label="自定义提示词" required>
                  <el-input
                    v-model="taskForm.analysisConfig.customPrompt"
                    type="textarea"
                    :rows="6"
                    placeholder="例如：提取主图、来源链接和适合做找同款的关键信息"
                  />
                </el-form-item>
              </el-col>

              <el-col v-if="isCustomPromptAnalysis || isPodPatternAnalysis" :xs="24">
                <el-form-item label="输出结构说明">
                  <el-input
                    v-model="taskForm.analysisConfig.customOutputSchema"
                    type="textarea"
                    :rows="4"
                    placeholder="例如：返回 gallery 视图，并保留 imageUrl、sourceUrl、title"
                  />
                </el-form-item>
              </el-col>

              <el-col v-if="!isCustomPromptAnalysis" :xs="24">
                <el-form-item :label="notesLabel">
                  <el-input
                    v-model="taskForm.analysisConfig.notes"
                    type="textarea"
                    :rows="4"
                    :placeholder="notesPlaceholder"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div class="task-dialog-side">
          <div class="preview-card">
            <div class="preview-card__header">
              <div class="preview-card__title">任务预览</div>
              <el-tag size="small" type="info">{{ analysisTypeLabel }}</el-tag>
            </div>

            <div class="preview-metrics">
              <div class="preview-metric">
                <span class="preview-metric__label">采集任务</span>
                <strong>{{ taskForm.sourceConfig.taskIds.length }}</strong>
              </div>
              <div class="preview-metric">
                <span class="preview-metric__label">采集运行</span>
                <strong>{{ taskForm.sourceConfig.runIds.length }}</strong>
              </div>
              <div class="preview-metric">
                <span class="preview-metric__label">原始记录</span>
                <strong>{{ parsedRawRecordIds.length }}</strong>
              </div>
              <div class="preview-metric">
                <span class="preview-metric__label">样本上限</span>
                <strong>{{ taskForm.sourceConfig.limit }}</strong>
              </div>
            </div>

            <div class="preview-block">
              <div class="preview-block__label">说明</div>
              <div class="preview-block__text">
                任务只负责定义数据范围和分析要求。运行态与结果会分开存储。
              </div>
            </div>

            <div class="preview-block">
              <div class="preview-block__label">请求体</div>
              <pre class="json-preview">{{ requestPreviewText }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="task-dialog-footer-bar">
        <el-button @click="emit('update:modelValue', false)">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type {
  EcomPlatformCollectCatalog,
  EcomPlatformCollectRun,
  EcomPlatformCollectTask,
} from "@/api/operation/ecomPlatformCollect";
import {
  createEcomSelectionAnalysisTask,
  updateEcomSelectionAnalysisTask,
  type EcomSelectionAnalysisTask,
} from "@/api/operation/ecomSelectionAnalysis";
import CompactNotice from "@/components/CompactNotice/index.vue";
import {
  formatDateTime,
  getPlatformLabel,
  getRunStatusLabel,
  parseTextareaList,
} from "@/views/operation/ecom-data/shared";
import { getTaskTypeLabel } from "@/views/operation/ecom-platform-collect/shared";

type AnalysisTaskForm = {
  name: string;
  analysisType: string;
  sourceConfig: {
    taskIds: string[];
    runIds: string[];
    limit: number;
    requireDetail: boolean;
  };
  analysisConfig: {
    topN: number;
    targetMarket: string;
    notes: string;
    customPrompt: string;
    customOutputSchema: string;
  };
};

const props = defineProps<{
  modelValue: boolean;
  task?: EcomSelectionAnalysisTask | null;
  collectCatalog: EcomPlatformCollectCatalog;
  collectTasks: EcomPlatformCollectTask[];
  collectRuns: EcomPlatformCollectRun[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const createDefaultForm = (): AnalysisTaskForm => ({
  name: "",
  analysisType: "hot_selling_selection",
  sourceConfig: {
    taskIds: [],
    runIds: [],
    limit: 40,
    requireDetail: false,
  },
  analysisConfig: {
    topN: 10,
    targetMarket: "",
    notes: "",
    customPrompt: "",
    customOutputSchema: "",
  },
});

const taskForm = reactive(createDefaultForm());
const rawRecordIdsText = ref("");
const submitting = ref(false);

const currentTask = computed(() => props.task || null);
const analysisTypeOptions = [
  { label: "热门选品", value: "hot_selling_selection" },
  { label: "POD 图案分析", value: "pod_pattern_analysis" },
  { label: "自定义提示词分析", value: "custom_prompt_extract" },
];

const isHotSellingAnalysis = computed(() => taskForm.analysisType === "hot_selling_selection");
const isPodPatternAnalysis = computed(() => taskForm.analysisType === "pod_pattern_analysis");
const isCustomPromptAnalysis = computed(() => taskForm.analysisType === "custom_prompt_extract");

const analysisTypeLabel = computed(() => {
  return (
    analysisTypeOptions.find((item) => item.value === taskForm.analysisType)?.label ||
    taskForm.analysisType
  );
});

const notesLabel = computed(() =>
  isPodPatternAnalysis.value ? "图案分析补充说明" : "分析补充说明",
);

const notesPlaceholder = computed(() =>
  isPodPatternAnalysis.value
    ? "例如：更关注图案主题、视觉元素、主配色和裂变方向"
    : "例如：更关注价格带、评论规模和差异化卖点",
);

const collectTaskOptions = computed(() =>
  props.collectTasks.map((item) => ({
    value: item.id,
    label: `${item.name} · ${getPlatformLabel(props.collectCatalog, item.platform)} / ${getTaskTypeLabel(
      props.collectCatalog,
      item.platform,
      item.taskType,
    )}`,
  })),
);

const collectRunOptions = computed(() =>
  props.collectRuns.map((item) => ({
    value: item.id,
    label: `${item.taskName || item.id} · ${getPlatformLabel(
      props.collectCatalog,
      item.platform,
    )} · ${getRunStatusLabel(item.status)} · ${formatDateTime(item.finishedAt || item.createTime)}`,
  })),
);

const parsedRawRecordIds = computed(() => parseTextareaList(rawRecordIdsText.value));

const normalizedPayload = computed(() => ({
  name: taskForm.name.trim(),
  analysisType: taskForm.analysisType,
  sourceConfig: {
    taskIds: taskForm.sourceConfig.taskIds,
    runIds: taskForm.sourceConfig.runIds,
    rawRecordIds: parsedRawRecordIds.value,
    limit: taskForm.sourceConfig.limit,
    requireDetail: !!taskForm.sourceConfig.requireDetail,
  },
  analysisConfig: {
    topN: taskForm.analysisConfig.topN,
    targetMarket: taskForm.analysisConfig.targetMarket.trim(),
    notes: taskForm.analysisConfig.notes.trim(),
    customPrompt: taskForm.analysisConfig.customPrompt.trim(),
    customOutputSchema: taskForm.analysisConfig.customOutputSchema.trim(),
  },
}));

const requestPreviewText = computed(() => JSON.stringify(normalizedPayload.value, null, 2));

const canSubmit = computed(() => {
  if (!taskForm.name.trim()) {
    return false;
  }
  if (isCustomPromptAnalysis.value && !taskForm.analysisConfig.customPrompt.trim()) {
    return false;
  }
  return true;
});

const resetForm = () => {
  const next = createDefaultForm();
  taskForm.name = next.name;
  taskForm.analysisType = next.analysisType;
  taskForm.sourceConfig.taskIds = [...next.sourceConfig.taskIds];
  taskForm.sourceConfig.runIds = [...next.sourceConfig.runIds];
  taskForm.sourceConfig.limit = next.sourceConfig.limit;
  taskForm.sourceConfig.requireDetail = next.sourceConfig.requireDetail;
  taskForm.analysisConfig.topN = next.analysisConfig.topN;
  taskForm.analysisConfig.targetMarket = next.analysisConfig.targetMarket;
  taskForm.analysisConfig.notes = next.analysisConfig.notes;
  taskForm.analysisConfig.customPrompt = next.analysisConfig.customPrompt;
  taskForm.analysisConfig.customOutputSchema = next.analysisConfig.customOutputSchema;
  rawRecordIdsText.value = "";
};

const hydrateForm = (task?: EcomSelectionAnalysisTask | null) => {
  resetForm();

  if (!task) {
    return;
  }

  taskForm.name = String(task.name || "").trim();
  taskForm.analysisType = String(task.analysisType || "hot_selling_selection").trim();
  taskForm.sourceConfig.taskIds = Array.isArray(task.sourceConfig?.taskIds)
    ? task.sourceConfig.taskIds.filter(Boolean)
    : [];
  taskForm.sourceConfig.runIds = Array.isArray(task.sourceConfig?.runIds)
    ? task.sourceConfig.runIds.filter(Boolean)
    : [];
  taskForm.sourceConfig.limit = Number(task.sourceConfig?.limit || 40);
  taskForm.sourceConfig.requireDetail = !!task.sourceConfig?.requireDetail;
  taskForm.analysisConfig.topN = Number(task.analysisConfig?.topN || 10);
  taskForm.analysisConfig.targetMarket = String(task.analysisConfig?.targetMarket || "").trim();
  taskForm.analysisConfig.notes = String(task.analysisConfig?.notes || "").trim();
  taskForm.analysisConfig.customPrompt = String(task.analysisConfig?.customPrompt || "").trim();
  taskForm.analysisConfig.customOutputSchema = String(
    task.analysisConfig?.customOutputSchema || "",
  ).trim();
  rawRecordIdsText.value = Array.isArray(task.sourceConfig?.rawRecordIds)
    ? task.sourceConfig.rawRecordIds.filter(Boolean).join("\n")
    : "";
};

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      hydrateForm(props.task || null);
    }
  },
  { immediate: true },
);

const handleSubmit = async () => {
  if (!taskForm.name.trim()) {
    ElMessage.warning("请先填写任务名称");
    return;
  }

  if (isCustomPromptAnalysis.value && !taskForm.analysisConfig.customPrompt.trim()) {
    ElMessage.warning("请填写自定义提示词");
    return;
  }

  submitting.value = true;
  try {
    if (currentTask.value?.id) {
      await updateEcomSelectionAnalysisTask(currentTask.value.id, normalizedPayload.value);
      ElMessage.success("分析任务已更新");
    } else {
      await createEcomSelectionAnalysisTask(normalizedPayload.value);
      ElMessage.success("分析任务已创建");
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
  margin: 4px 0 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.form-hint {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.5;
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
