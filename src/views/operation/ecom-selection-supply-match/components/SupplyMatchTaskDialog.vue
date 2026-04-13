<template>
  <el-dialog
    :model-value="modelValue"
    :title="currentTask?.id ? '编辑找同款任务' : '新建找同款任务'"
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
            v-if="!availableAnalysisRuns.length"
            type="warning"
            title="还没有可选的分析运行"
            description="建议先在电商分析模块执行一次成功的“热门选品”分析，再从分析结果创建找同款任务。"
            class="task-dialog-alert"
          />

          <CompactNotice
            v-if="hasSourceItemWithoutAnalysisRun"
            type="warning"
            title="已填写来源商品 ID，但未选择分析运行"
            description="`sourceItemIds` 需要配合 `analysisRunId` 使用，否则服务端不会知道这些来源商品属于哪次分析结果。"
            class="task-dialog-alert"
          />

          <el-form label-position="top" class="task-dialog-form">
            <el-row :gutter="20">
              <el-col :xs="24" :lg="16">
                <el-form-item label="任务名称" required>
                  <el-input v-model="taskForm.name" placeholder="例如：热门耳机 1688 找同款" />
                  <div class="form-hint">
                    建议写清来源品类和目标供货平台，后续回看历史任务时会更容易定位。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="8">
                <el-form-item label="匹配类型">
                  <el-select v-model="taskForm.matchType" disabled>
                    <el-option label="找同款" value="supply_match" />
                  </el-select>
                  <div class="form-hint">
                    当前固定为“找同款”，后续如果扩展为找替代款、找差异款，也会沿用同一套任务结构。
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="form-section-title">来源范围</div>
            <el-row :gutter="20">
              <el-col :xs="24" :lg="12">
                <el-form-item label="来源分析运行">
                  <el-select
                    v-model="taskForm.sourceConfig.analysisRunId"
                    filterable
                    clearable
                    placeholder="优先从热门选品分析结果中找同款"
                  >
                    <el-option
                      v-for="item in analysisRunOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                  <div class="form-hint">
                    可直接选择一份选品分析结果作为来源；如果不想依赖分析结果，也可以直接填写右侧原始记录
                    ID。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="12">
                <el-form-item label="直接指定原始记录 ID">
                  <el-input
                    v-model="rawRecordIdsText"
                    type="textarea"
                    :rows="5"
                    placeholder="一行一个 rawRecordId，用于绕过分析结果直接找同款"
                  />
                  <div class="form-hint">
                    不依赖选品分析结果时使用。至少需要提供 `analysisRunId` 或 `rawRecordIds`
                    其中之一。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="12">
                <el-form-item label="供货平台">
                  <el-select
                    v-model="taskForm.optionsData.supplierPlatforms"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    clearable
                    placeholder="请选择供货平台"
                  >
                    <el-option
                      v-for="item in supplierPlatformOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                  <div class="form-hint">
                    目前默认优先 1688。后续新增义乌购、Alibaba 等供货源时，也会继续挂在这里扩展。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="12">
                <el-form-item label="限定来源商品 ID">
                  <el-input
                    v-model="sourceItemIdsText"
                    type="textarea"
                    :rows="5"
                    placeholder="一行一个 sourceItemId，可从选品分析推荐商品中带入"
                  />
                  <div class="form-hint">不填则从分析运行中自动挑选前若干来源商品。</div>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="form-section-title">匹配执行参数</div>
            <el-row :gutter="20">
              <el-col :xs="24" :lg="4">
                <el-form-item label="来源商品数">
                  <el-input-number
                    v-model="taskForm.optionsData.maxSourceItems"
                    :min="1"
                    :max="20"
                    controls-position="right"
                  />
                  <div class="form-hint">
                    控制这次最多拿多少个来源商品去扩展同款，先小批量验证会更稳。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="4">
                <el-form-item label="每个来源最大匹配">
                  <el-input-number
                    v-model="taskForm.optionsData.maxMatchesPerSource"
                    :min="1"
                    :max="20"
                    controls-position="right"
                  />
                  <div class="form-hint">
                    每个来源商品最多保留多少个候选同款，值越大结果越全，但噪声也可能变多。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="4">
                <el-form-item label="每个来源最大详情数">
                  <el-input-number
                    v-model="taskForm.optionsData.maxDetailPerSource"
                    :min="0"
                    :max="10"
                    controls-position="right"
                  />
                  <div class="form-hint">
                    会继续进入多少个候选详情页补抓信息。设为 0 时只保留搜索卡片数据。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="6">
                <el-form-item label="每次搜索最多卡片">
                  <el-input-number
                    v-model="taskForm.optionsData.maxSearchItemsPerQuery"
                    :min="1"
                    :max="20"
                    controls-position="right"
                  />
                  <div class="form-hint">
                    每条查询词在搜索页最多读取多少张卡片，适合控制风控和整体执行时长。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="6">
                <el-form-item label="查询词扩展数">
                  <el-input-number
                    v-model="taskForm.optionsData.queryCount"
                    :min="1"
                    :max="6"
                    controls-position="right"
                  />
                  <div class="form-hint">
                    会基于来源标题、品牌和属性自动生成多条供货查询词。商品越泛，通常可适当多给一点。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="6">
                <el-form-item label="执行超时（分钟）">
                  <el-input-number
                    v-model="taskForm.optionsData.timeoutMinutes"
                    :min="5"
                    :max="90"
                    controls-position="right"
                  />
                  <div class="form-hint">
                    防止平台卡顿或风控时任务长时间挂起。常规同款任务 20-30 分钟通常就够用。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="6">
                <el-form-item label="是否截图">
                  <el-switch v-model="taskForm.optionsData.captureSnapshots" />
                  <div class="form-hint">默认关闭，只有需要质检或回溯时再开启，避免存储膨胀。</div>
                </el-form-item>
              </el-col>

              <el-col :xs="24">
                <el-form-item label="执行备注">
                  <el-input
                    v-model="taskForm.optionsData.notes"
                    type="textarea"
                    :rows="4"
                    placeholder="例如：优先找工厂店、支持小批量起订、优先保留有详情页与参数图的供货商品"
                  />
                  <div class="form-hint">
                    这里相当于给执行策略补充偏好说明，不改变来源范围，但会影响查询词构造和结果筛选倾向。
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div class="task-dialog-side">
          <div class="preview-card">
            <div class="preview-card__header">
              <div class="preview-card__title">执行预览</div>
              <el-tag size="small" type="info">客户端执行</el-tag>
            </div>

            <div class="preview-metrics">
              <div class="preview-metric">
                <span class="preview-metric__label">分析运行</span>
                <strong>{{ taskForm.sourceConfig.analysisRunId ? 1 : 0 }}</strong>
              </div>
              <div class="preview-metric">
                <span class="preview-metric__label">来源商品</span>
                <strong>{{
                  parsedSourceItemIds.length || taskForm.optionsData.maxSourceItems
                }}</strong>
              </div>
              <div class="preview-metric">
                <span class="preview-metric__label">原始记录</span>
                <strong>{{ parsedRawRecordIds.length }}</strong>
              </div>
              <div class="preview-metric">
                <span class="preview-metric__label">截图</span>
                <strong>{{ taskForm.optionsData.captureSnapshots ? "开启" : "关闭" }}</strong>
              </div>
            </div>

            <div class="preview-block">
              <div class="preview-block__label">执行说明</div>
              <div class="preview-block__text">
                任务保存后由服务端调度客户端浏览器自动化执行，同款列表、详情、对比得分与截图都按统一结果结构回传。
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
import {
  createEcomSelectionSupplyMatchTask,
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

type SupplyMatchTaskForm = {
  name: string;
  matchType: string;
  sourceConfig: {
    analysisRunId: string;
    sourceItemIds: string[];
    rawRecordIds: string[];
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

const supplierPlatformOptions = [{ label: "1688", value: "1688" }];

const createDefaultForm = (): SupplyMatchTaskForm => ({
  name: "",
  matchType: "supply_match",
  sourceConfig: {
    analysisRunId: "",
    sourceItemIds: [],
    rawRecordIds: [],
  },
  optionsData: {
    supplierPlatforms: ["1688"],
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
const submitting = ref(false);

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
    map.set(currentId, `分析运行: ${currentId}`);
  }

  return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
});

const parsedSourceItemIds = computed(() => parseTextareaList(sourceItemIdsText.value));
const parsedRawRecordIds = computed(() => parseTextareaList(rawRecordIdsText.value));

const canSubmit = computed(() => {
  return !!(
    taskForm.name.trim() &&
    (taskForm.sourceConfig.analysisRunId || parsedRawRecordIds.value.length)
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

const resetForm = () => {
  const next = createDefaultForm();
  taskForm.name = next.name;
  taskForm.matchType = next.matchType;
  taskForm.sourceConfig.analysisRunId = next.sourceConfig.analysisRunId;
  taskForm.sourceConfig.sourceItemIds = [...next.sourceConfig.sourceItemIds];
  taskForm.sourceConfig.rawRecordIds = [...next.sourceConfig.rawRecordIds];
  taskForm.optionsData.supplierPlatforms = [...next.optionsData.supplierPlatforms];
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
};

const hydrateForm = (task?: EcomSelectionSupplyMatchTask | null) => {
  resetForm();

  if (task) {
    taskForm.name = String(task.name || "").trim();
    taskForm.matchType = String(task.matchType || "supply_match").trim();
    taskForm.sourceConfig.analysisRunId = String(task.sourceConfig?.analysisRunId || "").trim();
    taskForm.optionsData.supplierPlatforms = Array.isArray(task.optionsData?.supplierPlatforms)
      ? task.optionsData?.supplierPlatforms.filter(Boolean)
      : ["1688"];
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
    return;
  }

  if (props.presetAnalysisRunId) {
    taskForm.sourceConfig.analysisRunId = String(props.presetAnalysisRunId || "").trim();
  }
  if (Array.isArray(props.presetSourceItemIds) && props.presetSourceItemIds.length) {
    sourceItemIdsText.value = props.presetSourceItemIds.filter(Boolean).join("\n");
  }
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

  if (!taskForm.sourceConfig.analysisRunId && !parsedRawRecordIds.value.length) {
    ElMessage.warning("请至少选择一个分析运行或填写原始记录 ID");
    return;
  }

  submitting.value = true;
  try {
    if (currentTask.value?.id) {
      await updateEcomSelectionSupplyMatchTask(currentTask.value.id, normalizedPayload.value);
      ElMessage.success("找同款任务已更新");
    } else {
      await createEcomSelectionSupplyMatchTask(normalizedPayload.value);
      ElMessage.success("找同款任务已创建");
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
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
}

.task-dialog-alert {
  margin-bottom: 14px;
}

.form-section-title {
  margin: 10px 0 14px;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.form-hint {
  margin-top: 6px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  line-height: 1.45;
}

.preview-card {
  position: sticky;
  top: 0;
  padding: 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
}

.preview-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.preview-card__title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.preview-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.preview-metric {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.preview-metric__label {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.preview-metric strong {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-primary);
  font-size: 18px;
  line-height: 1.2;
}

.preview-block {
  margin-top: 16px;
}

.preview-block__label {
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.preview-block__text {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.7;
}

.json-preview {
  max-height: calc(100vh - 360px);
  overflow: auto;
  margin: 0;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.task-dialog-footer-bar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

@media (max-width: 1200px) {
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
