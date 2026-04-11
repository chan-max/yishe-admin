<template>
  <el-dialog :model-value="modelValue" :title="currentTask?.id ? '编辑选品分析任务' : '新建选品分析任务'" fullscreen append-to-body
    destroy-on-close class="selection-analysis-task-dialog" :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)">
    <div class="task-dialog-shell">
      <div class="task-dialog-layout">
        <div class="task-dialog-main">
          <CompactNotice v-if="!collectTasks.length && !collectRuns.length" type="warning" title="当前没有可选的采集任务或运行"
            description="你仍可直接填写原始记录 ID 创建分析任务；如果需要按任务或运行筛选，再先到电商采集模块执行一次采集。" class="task-dialog-alert" />

          <CompactNotice v-else-if="!hasExplicitScope" type="info" title="当前未设置显式数据范围"
            description="如果直接保存，将按当前账号下符合条件的全部采集原始数据进行分析。" class="task-dialog-alert" />

          <el-form label-position="top" class="task-dialog-form">
            <el-row :gutter="20">
              <el-col :xs="24">
                <el-form-item label="任务名称" required>
                  <el-input v-model="taskForm.name" placeholder="例如：Amazon / Temu 无线耳机热门选品" />
                  <div class="form-hint">
                    建议直接写清平台、品类和目标市场。当前版本默认执行“热门选品”分析，你主要配置数据源范围和分析偏好即可。
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="form-section-title">基础配置</div>
            <el-row :gutter="20">
              <el-col :xs="24" :lg="12">
                <el-form-item label="采集任务">
                  <el-select v-model="taskForm.sourceConfig.taskIds" multiple collapse-tags collapse-tags-tooltip
                    filterable clearable placeholder="按采集任务筛选">
                    <el-option v-for="item in collectTaskOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                  <div class="form-hint">
                    用来圈定“分析哪几个采集任务”的历史原始数据。不选时，可继续通过运行、平台或高级过滤来限定范围。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="12">
                <el-form-item label="采集运行">
                  <el-select v-model="taskForm.sourceConfig.runIds" multiple collapse-tags collapse-tags-tooltip
                    filterable clearable placeholder="按运行记录筛选">
                    <el-option v-for="item in collectRunOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                  <div class="form-hint">
                    用来锁定某几次具体执行结果。可以和“采集任务”同时使用，表示只分析这些任务里的指定运行。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24">
                <el-form-item label="直接指定原始记录 ID">
                  <el-input v-model="rawRecordIdsText" type="textarea" :rows="4"
                    placeholder="一行一个 rawRecordId，可直接基于统一原始数据做分析" />
                  <div class="form-hint">
                    不想依赖采集任务或采集结果时可直接填写。可单独使用，也可和其他筛选条件组合收窄范围。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="8">
                <el-form-item label="最大样本数">
                  <el-input-number v-model="taskForm.sourceConfig.limit" :min="1" :max="80" controls-position="right" />
                  <div class="form-hint">
                    进入 AI 分析前最终保留的样本上限。数值越大覆盖越全，耗时也会更高，通常 20-60
                    比较合适。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="6">
                <el-form-item label="目标市场">
                  <el-input v-model="taskForm.optionsData.targetMarket" placeholder="例如：美国站 / 东南亚 / 欧洲" />
                  <div class="form-hint">
                    告诉 AI 结论面向哪个市场，影响需求、语言和价格带判断；它不会直接过滤原始数据。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="6">
                <el-form-item label="输出 Top N">
                  <el-input-number v-model="taskForm.optionsData.topN" :min="1" :max="20" controls-position="right" />
                  <div class="form-hint">
                    控制最终输出多少个重点候选商品。适合先少量聚焦，再逐步扩大。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="6">
                <el-form-item label="优先详情数据">
                  <el-switch v-model="taskForm.sourceConfig.requireDetail" />
                  <div class="form-hint">
                    开启后仅保留抓到详情页补充信息的商品，样本会更少，但分析通常更完整、更稳定。
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :lg="4">
                <el-form-item label="分析类型">
                  <el-input value="热门选品" disabled />
                  <div class="form-hint">
                    当前固定为“热门选品”：服务端会先归一化原始数据，再由 AI
                    输出热门关键词、候选商品、平台洞察和下一步建议。
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="advanced-panel">
              <div class="advanced-panel__header">
                <div>
                  <div class="form-section-title advanced-panel__title">高级选项</div>
                  <div class="advanced-panel__summary">
                    {{ advancedSummaryText }}
                  </div>
                </div>
                <el-button text type="primary" @click="advancedVisible = !advancedVisible">
                  {{ advancedVisible ? "收起高级选项" : "展开高级选项" }}
                </el-button>
              </div>

              <el-row v-if="advancedVisible" :gutter="20">
                <el-col :xs="24" :lg="8">
                  <el-form-item label="来源平台">
                    <el-select v-model="taskForm.sourceConfig.platforms" multiple collapse-tags collapse-tags-tooltip
                      clearable placeholder="全部平台">
                      <el-option v-for="item in sourcePlatformOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                    <div class="form-hint">
                      在当前任务或运行范围内继续按平台过滤。不选表示不过滤；适合混合数据源时做二次收窄。
                    </div>
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :lg="8">
                  <el-form-item label="任务类型">
                    <el-select v-model="taskForm.sourceConfig.taskTypes" multiple collapse-tags
                      collapse-tags-tooltip clearable placeholder="全部任务类型">
                      <el-option v-for="item in taskTypeOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                    <div class="form-hint">
                      例如 `amazon.search`、`amazon.product_detail`、`google_trends.trend_keywords`。
                      适合在同平台下精确区分数据来源。
                    </div>
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :lg="8">
                  <el-form-item label="关键词过滤">
                    <el-input v-model="taskForm.sourceConfig.keyword" placeholder="匹配 recordKey / 来源链接 / 任务名" />
                    <div class="form-hint">
                      用于在大样本里快速缩小范围，会匹配记录关键词、来源链接和任务名等文本。
                    </div>
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :lg="8">
                  <el-form-item label="AI 模型">
                    <el-input v-model="taskForm.optionsData.aiModel" placeholder="留空则按当前 AI 功能绑定的 Key 配置执行" />
                    <div class="form-hint">
                      一般不需要填写。只有你明确想覆盖当前功能绑定 Key 上的模型时，才在这里单独指定。
                    </div>
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :lg="6">
                  <el-form-item label="采集开始时间">
                    <el-date-picker v-model="taskForm.sourceConfig.capturedAfter" type="datetime"
                      value-format="YYYY-MM-DD HH:mm:ss" clearable placeholder="开始时间" />
                    <div class="form-hint">只分析该时间之后抓取的原始数据。</div>
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :lg="6">
                  <el-form-item label="采集结束时间">
                    <el-date-picker v-model="taskForm.sourceConfig.capturedBefore" type="datetime"
                      value-format="YYYY-MM-DD HH:mm:ss" clearable placeholder="结束时间" />
                    <div class="form-hint">和开始时间组合使用，可限定某个时间窗口内的数据。</div>
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :lg="12">
                  <el-form-item label="优先参考平台">
                    <el-select v-model="taskForm.optionsData.preferredPlatforms" multiple collapse-tags
                      collapse-tags-tooltip clearable placeholder="优先关注的平台">
                      <el-option v-for="item in collectCatalog.platforms" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                    <div class="form-hint">
                      不会过滤掉其他平台数据，只是提醒 AI 在结论里优先关注这些平台的证据和信号。
                    </div>
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :lg="12">
                  <el-form-item label="重点关键词">
                    <el-input v-model="focusKeywordsText" type="textarea" :rows="5"
                      placeholder="一行一个，例如：wireless earbuds" />
                    <div class="form-hint">
                      适合聚焦某个细分品类。命中这些词的样本更容易被保留和重点分析。
                    </div>
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :lg="12">
                  <el-form-item label="排除关键词">
                    <el-input v-model="excludeKeywordsText" type="textarea" :rows="5"
                      placeholder="一行一个，例如：used / refurbished" />
                    <div class="form-hint">
                      适合排除不希望进入分析的商品方向、成色、配件词或噪声词。
                    </div>
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :lg="6">
                  <el-form-item label="目标价格最低值">
                    <el-input-number v-model="taskForm.optionsData.targetPriceRange.min" :min="0" :step="1"
                      controls-position="right" />
                    <div class="form-hint">和最高值配合，帮助 AI 聚焦目标价格带。</div>
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :lg="6">
                  <el-form-item label="目标价格最高值">
                    <el-input-number v-model="taskForm.optionsData.targetPriceRange.max" :min="0" :step="1"
                      controls-position="right" />
                    <div class="form-hint">
                      只对能识别价格的样本生效；适合做中低价、高客单等不同选品策略。
                    </div>
                  </el-form-item>
                </el-col>

                <el-col :xs="24">
                  <el-form-item label="分析备注">
                    <el-input v-model="taskForm.optionsData.notes" type="textarea" :rows="4"
                      placeholder="补充你希望 AI 更关注的维度，例如材质、品牌空间、价格带策略等" />
                    <div class="form-hint">
                      这里相当于补充提示词，不会改变样本筛选逻辑，但会影响 AI 输出时更关注的维度。
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </el-form>
        </div>

        <div class="task-dialog-side">
          <div class="preview-card">
            <div class="preview-card__header">
              <div class="preview-card__title">请求预览</div>
              <el-tag size="small" type="info">POST</el-tag>
            </div>

            <div class="preview-metrics">
              <div class="preview-metric">
                <span class="preview-metric__label">任务数</span>
                <strong>{{ taskForm.sourceConfig.taskIds.length }}</strong>
              </div>
              <div class="preview-metric">
                <span class="preview-metric__label">运行数</span>
                <strong>{{ taskForm.sourceConfig.runIds.length }}</strong>
              </div>
              <div class="preview-metric">
                <span class="preview-metric__label">原始记录</span>
                <strong>{{ parsedRawRecordIds.length }}</strong>
              </div>
              <div class="preview-metric">
                <span class="preview-metric__label">TopN</span>
                <strong>{{ taskForm.optionsData.topN }}</strong>
              </div>
            </div>

            <div class="preview-block">
              <div class="preview-block__label">分析说明</div>
              <div class="preview-block__text">
                任务保存后由服务端统一做数据归一化，最终分析与 AI
                输出解耦存储，便于后续更换采集来源或分析策略。
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
        <el-button type="primary" :loading="submitting" :disabled="!canSubmit" @click="handleSubmit">
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
import {
  getTaskTypeLabel,
  getTaskTypeSchemas,
} from "@/views/operation/ecom-platform-collect/shared";

type AnalysisTaskForm = {
  name: string;
  analysisType: string;
  sourceConfig: {
    taskIds: string[];
    runIds: string[];
    rawRecordIds: string[];
    platforms: string[];
    taskTypes: string[];
    keyword: string;
    capturedAfter: string;
    capturedBefore: string;
    limit: number;
    requireDetail: boolean;
  };
  optionsData: {
    topN: number;
    targetMarket: string;
    preferredPlatforms: string[];
    targetPriceRange: {
      min: number | null;
      max: number | null;
    };
    notes: string;
    aiModel: string;
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
    rawRecordIds: [],
    platforms: [],
    taskTypes: [],
    keyword: "",
    capturedAfter: "",
    capturedBefore: "",
    limit: 40,
    requireDetail: false,
  },
  optionsData: {
    topN: 10,
    targetMarket: "",
    preferredPlatforms: [],
    targetPriceRange: {
      min: null,
      max: null,
    },
    notes: "",
    aiModel: "",
  },
});

const taskForm = reactive(createDefaultForm());
const submitting = ref(false);
const focusKeywordsText = ref("");
const excludeKeywordsText = ref("");
const rawRecordIdsText = ref("");
const advancedVisible = ref(false);

const currentTask = computed(() => props.task || null);

const buildOptionList = (
  baseOptions: Array<{ label: string; value: string }>,
  selectedValues: string[],
  labelPrefix: string,
) => {
  const map = new Map<string, string>();
  baseOptions.forEach((item) => {
    map.set(item.value, item.label);
  });
  selectedValues.forEach((value) => {
    if (value && !map.has(value)) {
      map.set(value, `${labelPrefix}: ${value}`);
    }
  });
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
};

const collectTaskOptions = computed(() =>
  buildOptionList(
    props.collectTasks.map((item) => ({
      value: item.id,
      label: `${item.name} · ${getPlatformLabel(props.collectCatalog, item.platform)} / ${getTaskTypeLabel(props.collectCatalog, item.platform, item.taskType)}`,
    })),
    taskForm.sourceConfig.taskIds,
    "采集任务",
  ),
);

const collectRunOptions = computed(() =>
  buildOptionList(
    props.collectRuns.map((item) => ({
      value: item.id,
      label: `${item.taskName || item.id} · ${getPlatformLabel(props.collectCatalog, item.platform)} · ${getRunStatusLabel(item.status)} · ${formatDateTime(item.finishedAt || item.createTime)}`,
    })),
    taskForm.sourceConfig.runIds,
    "采集运行",
  ),
);

const parsedRawRecordIds = computed(() => parseTextareaList(rawRecordIdsText.value));

const sourcePlatformOptions = computed(() =>
  buildOptionList(
    props.collectCatalog.platforms.map((item) => ({
      value: item.value,
      label: item.label,
    })),
    taskForm.sourceConfig.platforms,
    "来源平台",
  ),
);

const availableTaskTypeOptions = computed(() => {
  const platformSet = new Set(taskForm.sourceConfig.platforms);
  return props.collectCatalog.platforms.flatMap((platform) => {
    if (platformSet.size && !platformSet.has(platform.value)) {
      return [];
    }

    return getTaskTypeSchemas(props.collectCatalog, platform.value).map((taskType) => ({
      value: taskType.value,
      label: `${platform.label} / ${taskType.label}`,
    }));
  });
});

const taskTypeOptions = computed(() =>
  buildOptionList(availableTaskTypeOptions.value, taskForm.sourceConfig.taskTypes, "任务类型"),
);

const canSubmit = computed(() => !!taskForm.name.trim());

const hasExplicitScope = computed(() => {
  return !!(
    taskForm.sourceConfig.taskIds.length ||
    taskForm.sourceConfig.runIds.length ||
    parsedRawRecordIds.value.length ||
    taskForm.sourceConfig.platforms.length ||
    taskForm.sourceConfig.taskTypes.length ||
    taskForm.sourceConfig.keyword.trim() ||
    taskForm.sourceConfig.capturedAfter ||
    taskForm.sourceConfig.capturedBefore
  );
});

const normalizedPayload = computed(() => ({
  name: taskForm.name.trim(),
  analysisType: taskForm.analysisType,
  sourceConfig: {
    taskIds: taskForm.sourceConfig.taskIds,
    runIds: taskForm.sourceConfig.runIds,
    rawRecordIds: parsedRawRecordIds.value,
    platforms: taskForm.sourceConfig.platforms,
    taskTypes: taskForm.sourceConfig.taskTypes,
    keyword: taskForm.sourceConfig.keyword.trim(),
    capturedAfter: taskForm.sourceConfig.capturedAfter || null,
    capturedBefore: taskForm.sourceConfig.capturedBefore || null,
    limit: taskForm.sourceConfig.limit,
    requireDetail: !!taskForm.sourceConfig.requireDetail,
  },
  optionsData: {
    topN: taskForm.optionsData.topN,
    focusKeywords: parseTextareaList(focusKeywordsText.value),
    excludeKeywords: parseTextareaList(excludeKeywordsText.value),
    targetMarket: taskForm.optionsData.targetMarket.trim(),
    preferredPlatforms: taskForm.optionsData.preferredPlatforms,
    targetPriceRange: {
      min:
        taskForm.optionsData.targetPriceRange.min != null
          ? Number(taskForm.optionsData.targetPriceRange.min)
          : null,
      max:
        taskForm.optionsData.targetPriceRange.max != null
          ? Number(taskForm.optionsData.targetPriceRange.max)
          : null,
    },
    notes: taskForm.optionsData.notes.trim(),
    aiModel: taskForm.optionsData.aiModel.trim(),
  },
}));

const requestPreviewText = computed(() => JSON.stringify(normalizedPayload.value, null, 2));

const advancedSummaryText = computed(() => {
  const parts = [
    taskForm.sourceConfig.platforms.length ? "已设置来源平台" : "",
    parsedRawRecordIds.value.length ? `原始记录 ${parsedRawRecordIds.value.length} 条` : "",
    taskForm.sourceConfig.taskTypes.length ? "已设置任务类型" : "",
    taskForm.sourceConfig.keyword.trim() ? "已设置关键词过滤" : "",
    taskForm.sourceConfig.capturedAfter || taskForm.sourceConfig.capturedBefore
      ? "已设置采集时间"
      : "",
    focusKeywordsText.value.trim() ? "已设置重点词" : "",
    excludeKeywordsText.value.trim() ? "已设置排除词" : "",
    taskForm.optionsData.preferredPlatforms.length ? "已设置优先平台" : "",
    taskForm.optionsData.targetPriceRange.min != null ||
      taskForm.optionsData.targetPriceRange.max != null
      ? "已设置价格带"
      : "",
    taskForm.optionsData.notes.trim() ? "已填写备注" : "",
    taskForm.optionsData.aiModel.trim() ? `模型 ${taskForm.optionsData.aiModel.trim()}` : "",
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "默认使用推荐配置，如需更细粒度控制可展开设置。";
});

const resetForm = () => {
  const next = createDefaultForm();
  taskForm.name = next.name;
  taskForm.analysisType = next.analysisType;
  taskForm.sourceConfig.taskIds = [...next.sourceConfig.taskIds];
  taskForm.sourceConfig.runIds = [...next.sourceConfig.runIds];
  taskForm.sourceConfig.rawRecordIds = [...next.sourceConfig.rawRecordIds];
  taskForm.sourceConfig.platforms = [...next.sourceConfig.platforms];
  taskForm.sourceConfig.taskTypes = [...next.sourceConfig.taskTypes];
  taskForm.sourceConfig.keyword = next.sourceConfig.keyword;
  taskForm.sourceConfig.capturedAfter = next.sourceConfig.capturedAfter;
  taskForm.sourceConfig.capturedBefore = next.sourceConfig.capturedBefore;
  taskForm.sourceConfig.limit = next.sourceConfig.limit;
  taskForm.sourceConfig.requireDetail = next.sourceConfig.requireDetail;
  taskForm.optionsData.topN = next.optionsData.topN;
  taskForm.optionsData.targetMarket = next.optionsData.targetMarket;
  taskForm.optionsData.preferredPlatforms = [...next.optionsData.preferredPlatforms];
  taskForm.optionsData.targetPriceRange.min = next.optionsData.targetPriceRange.min;
  taskForm.optionsData.targetPriceRange.max = next.optionsData.targetPriceRange.max;
  taskForm.optionsData.notes = next.optionsData.notes;
  taskForm.optionsData.aiModel = next.optionsData.aiModel;
  focusKeywordsText.value = "";
  excludeKeywordsText.value = "";
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
    ? task.sourceConfig?.taskIds.filter(Boolean)
    : [];
  taskForm.sourceConfig.runIds = Array.isArray(task.sourceConfig?.runIds)
    ? task.sourceConfig?.runIds.filter(Boolean)
    : [];
  taskForm.sourceConfig.rawRecordIds = Array.isArray(task.sourceConfig?.rawRecordIds)
    ? task.sourceConfig?.rawRecordIds.filter(Boolean)
    : [];
  taskForm.sourceConfig.platforms = Array.isArray(task.sourceConfig?.platforms)
    ? task.sourceConfig?.platforms.filter(Boolean)
    : [];
  taskForm.sourceConfig.taskTypes = Array.isArray(task.sourceConfig?.taskTypes)
    ? task.sourceConfig?.taskTypes.filter(Boolean)
    : [];
  taskForm.sourceConfig.keyword = String(task.sourceConfig?.keyword || "").trim();
  taskForm.sourceConfig.capturedAfter = String(task.sourceConfig?.capturedAfter || "").trim();
  taskForm.sourceConfig.capturedBefore = String(task.sourceConfig?.capturedBefore || "").trim();
  taskForm.sourceConfig.limit = Number(task.sourceConfig?.limit || 40);
  taskForm.sourceConfig.requireDetail = !!task.sourceConfig?.requireDetail;
  taskForm.optionsData.topN = Number(task.optionsData?.topN || 10);
  taskForm.optionsData.targetMarket = String(task.optionsData?.targetMarket || "").trim();
  taskForm.optionsData.preferredPlatforms = Array.isArray(task.optionsData?.preferredPlatforms)
    ? task.optionsData?.preferredPlatforms.filter(Boolean)
    : [];
  taskForm.optionsData.targetPriceRange.min =
    task.optionsData?.targetPriceRange?.min != null
      ? Number(task.optionsData.targetPriceRange.min)
      : null;
  taskForm.optionsData.targetPriceRange.max =
    task.optionsData?.targetPriceRange?.max != null
      ? Number(task.optionsData.targetPriceRange.max)
      : null;
  taskForm.optionsData.notes = String(task.optionsData?.notes || "").trim();
  taskForm.optionsData.aiModel = String(task.optionsData?.aiModel || "").trim();
  focusKeywordsText.value = Array.isArray(task.optionsData?.focusKeywords)
    ? task.optionsData?.focusKeywords.filter(Boolean).join("\n")
    : "";
  excludeKeywordsText.value = Array.isArray(task.optionsData?.excludeKeywords)
    ? task.optionsData?.excludeKeywords.filter(Boolean).join("\n")
    : "";
  rawRecordIdsText.value = Array.isArray(task.sourceConfig?.rawRecordIds)
    ? task.sourceConfig?.rawRecordIds.filter(Boolean).join("\n")
    : "";
};

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      hydrateForm(props.task || null);
      advancedVisible.value = !!(
        taskForm.sourceConfig.platforms.length ||
        taskForm.sourceConfig.taskTypes.length ||
        taskForm.sourceConfig.keyword.trim() ||
        taskForm.sourceConfig.capturedAfter ||
        taskForm.sourceConfig.capturedBefore ||
        focusKeywordsText.value.trim() ||
        excludeKeywordsText.value.trim() ||
        taskForm.optionsData.preferredPlatforms.length ||
        taskForm.optionsData.targetPriceRange.min != null ||
        taskForm.optionsData.targetPriceRange.max != null ||
        taskForm.optionsData.notes.trim() ||
        taskForm.optionsData.aiModel.trim()
      );
    }
  },
  { immediate: true },
);

watch(
  () => availableTaskTypeOptions.value.map((item) => item.value).join("|"),
  () => {
    const taskTypeValues = availableTaskTypeOptions.value.map((item) => item.value);
    const allowSet = new Set(taskTypeValues);
    const nextTaskTypes = taskForm.sourceConfig.taskTypes.filter((item) => allowSet.has(item));

    if (
      nextTaskTypes.length === taskForm.sourceConfig.taskTypes.length &&
      nextTaskTypes.every((item, index) => item === taskForm.sourceConfig.taskTypes[index])
    ) {
      return;
    }

    taskForm.sourceConfig.taskTypes = nextTaskTypes;
  },
);

const handleSubmit = async () => {
  if (!canSubmit.value) {
    ElMessage.warning("请先填写任务名称");
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
  margin-top: 4px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  line-height: 1.45;
}

.advanced-panel {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.advanced-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.advanced-panel__title {
  margin: 0;
}

.advanced-panel__summary {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
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
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
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
