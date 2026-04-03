<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="image-processing-record-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col
                class="list-page-search-form__col--base"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6"
                :xl="6"
              >
                <el-form-item label="关键词">
                  <el-input
                    v-model="queryParams.keyword"
                    size="small"
                    clearable
                    placeholder="标题 / 文件名 / 原图地址"
                    @keyup.enter="getList"
                    @change="handleKeywordChange"
                  />
                </el-form-item>
              </el-col>
              <el-col
                class="list-page-search-form__col--narrow"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="5"
                :xl="4"
              >
                <el-form-item label="状态">
                  <el-select
                    v-model="queryParams.status"
                    size="small"
                    clearable
                    placeholder="全部状态"
                    @change="getList"
                  >
                    <el-option label="待处理" value="pending" />
                    <el-option label="处理中" value="processing" />
                    <el-option label="成功" value="success" />
                    <el-option label="部分成功" value="partial" />
                    <el-option label="失败" value="failed" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col
                class="list-page-search-form__col--narrow"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="5"
                :xl="4"
              >
                <el-form-item label="任务类型">
                  <el-select
                    v-model="queryParams.taskType"
                    size="small"
                    clearable
                    placeholder="全部类型"
                    @change="getList"
                  >
                    <el-option label="图片处理" value="process" />
                    <el-option label="图片裂变" value="variations" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col
                class="list-page-search-form__col--narrow"
                :xs="24"
                :sm="24"
                :md="24"
                :lg="3"
                :xl="2"
              >
                <el-form-item label="服务状态">
                  <div class="image-processing-record-page__status-bar">
                    <span
                      class="image-processing-record-page__status-dot"
                      :class="imageStatusDotClass"
                      :title="imageStatusTooltip"
                    />
                    <span class="image-processing-record-page__status-text">
                      {{ imagesStatus.available ? "可用" : "不可用" }}
                    </span>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button
                size="small"
                type="primary"
                :icon="Search"
                :loading="loading"
                @click="getList"
              >
                搜索
              </el-button>
              <el-button size="small" type="primary" :icon="Plus" @click="openCreateDialog">
                新增
              </el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                :disabled="loading"
                @click="handleBatchDelete"
              >
                批量删除({{ selectedRows.length }})
              </el-button>
              <el-button
                size="small"
                :icon="RefreshRight"
                :loading="imagesStatus.loading || metaLoading"
                @click="refreshPageMeta"
              >
                刷新状态
              </el-button>
            </div>
          </el-form>
        </div>
      </template>

      <template #table>
        <div
          class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat"
        >
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid
                v-bind="gridOptions"
                :data="dataSource"
                :loading="loading"
                @checkbox-change="handleCheckboxChange"
                @checkbox-all="handleCheckboxAll"
              >
                <template #sourceSlot="{ row }">
                  <div class="image-record-source-cell">
                    <div class="image-record-thumb" @click.stop="openRowSource(row)">
                      <img
                        v-if="getSourcePreview(row)"
                        :src="getSourcePreview(row)"
                        :alt="row.sourceFilename || row.title || '原图'"
                      />
                      <span v-else class="image-record-thumb__placeholder">无预览</span>
                    </div>
                    <div class="image-record-source-meta">
                      <span class="image-record-source-type">
                        {{ row.sourceType === "upload" ? "本地上传" : "图片地址" }}
                      </span>
                      <span class="image-record-source-name" :title="row.sourceFilename || '-'">
                        {{ row.sourceFilename || "-" }}
                      </span>
                    </div>
                  </div>
                </template>
                <template #titleSlot="{ row }">
                  <div class="image-record-title-cell">
                    <span class="image-record-title-main">{{ row.title || "-" }}</span>
                    <span class="image-record-title-sub">ID: {{ row.id }}</span>
                    <span
                      v-if="row.sourceOriginalUrl"
                      class="image-record-title-sub"
                      :title="row.sourceOriginalUrl"
                    >
                      原始地址：{{ row.sourceOriginalUrl }}
                    </span>
                  </div>
                </template>
                <template #statusSlot="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" effect="plain">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
                <template #resultSlot="{ row }">
                  <div class="image-record-result-cell">
                    <div
                      class="image-record-result-thumb"
                      :class="{ 'is-empty': !getFirstResultUrl(row) }"
                      @click.stop="openFirstResult(row)"
                    >
                      <img
                        v-if="getFirstResultUrl(row)"
                        :src="getFirstResultUrl(row)"
                        :alt="row.title || '结果图'"
                      />
                      <span v-else class="image-record-thumb__placeholder">无结果</span>
                    </div>
                    <div class="image-record-result-meta">
                      <span class="image-record-result-count">{{ getResultSummary(row) }}</span>
                    </div>
                  </div>
                </template>
                <template #createTimeSlot="{ row }">
                  <span class="table-time-text">{{ formatTimestamp(row.createTime) }}</span>
                </template>
                <template #operationDefaultSlot="{ row }">
                  <div class="flex justify-start">
                    <el-dropdown
                      trigger="click"
                      placement="bottom-end"
                      @command="(command) => handleOperationCommand(command, row)"
                      class="operation-dropdown"
                    >
                      <el-button type="primary" link size="small" class="operation-trigger-button">
                        操作
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="detail">查看详情</el-dropdown-item>
                          <el-dropdown-item
                            command="delete"
                            divided
                            class="operation-menu-item--danger"
                          >
                            删除
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </template>
              </vxe-grid>
            </div>
          </div>
        </div>
      </template>

      <template #pagination>
        <div
          class="list-page-panel list-page-panel--flat list-page-table-panel__pagination list-page-table-panel__pagination--flat"
        >
          <Pagination
            :total="total"
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </template>
    </ListPageLayout>

    <el-dialog
      v-model="createVisible"
      title="新增图片处理任务"
      fullscreen
      destroy-on-close
      class="image-processing-create-dialog"
    >
      <div v-loading="metaLoading" class="image-processing-create-layout">
        <el-tabs v-model="form.taskType" class="image-processing-mode-tabs">
          <el-tab-pane label="链式处理" name="process" />
          <el-tab-pane label="图片裂变" name="variations" />
        </el-tabs>

        <el-card shadow="never" class="image-processing-panel-card image-processing-create-workspace">
          <div class="image-processing-linear-flow">
            <CreateTaskSourceStage
              :form="form"
              :create-source-preview="createSourcePreview"
              :has-source-context="hasSourceContext"
            />

            <CreateTaskProcessStage
              v-if="form.taskType === 'process'"
              :form="form"
              :current-operations="currentOperations"
              :current-operations-parse-error="currentOperationsParseError"
              :operation-keyword="operationKeyword"
              :operation-category-filter="operationCategoryFilter"
              :operation-category-options="operationCategoryOptions"
              :filtered-operation-count="filteredOperationCount"
              :filtered-grouped-operations="filteredGroupedOperations"
              :active-catalog-operation-key="activeCatalogOperationKey"
              :get-operation-identity="getOperationIdentity"
              :get-required-param-names="getRequiredParamNames"
              :get-operation-usage-count="getOperationUsageCount"
              :get-operation-param-summary="getOperationParamSummary"
              @clear-chain="clearOperationsChain"
              @move-operation="moveCurrentOperation"
              @remove-operation="removeCurrentOperation"
              @select-operation="selectCatalogOperation"
              @append-operation="appendOperationTemplate"
              @format-json="formatOperationsJson"
              @update:operation-keyword="operationKeyword = $event"
              @update:operation-category-filter="operationCategoryFilter = $event"
              @update:operations-json="form.operationsJson = $event"
            />

            <CreateTaskVariationsStage
              v-else
              :variations="variations"
              :get-variation-operation-count="getVariationOperationCount"
              :get-variation-operation-labels="getVariationOperationLabels"
            />

            <CreateTaskSubmitStage
              :form-task-type="form.taskType"
              :current-operations="currentOperations"
              :variation-preview-names="variationPreviewNames"
              :variations="variations"
              :request-preview-json="requestPreviewJson"
              :create-submit-hint="createSubmitHint"
              :submit-loading="submitLoading"
              :can-submit-create="canSubmitCreate"
              @cancel="createVisible = false"
              @submit="submitCreate"
            />
          </div>
        </el-card>
      </div>
    </el-dialog>

    <el-dialog
      v-model="detailVisible"
      title="图片处理详情"
      fullscreen
      destroy-on-close
      class="image-processing-detail-dialog"
    >
      <div v-if="currentRow" class="image-processing-detail-layout">
        <section class="image-processing-detail-section image-processing-detail-section--source">
          <div class="image-processing-detail-card__header">
            <span>原图</span>
            <span class="image-processing-detail-card__meta">输入图片</span>
          </div>
          <div class="image-processing-detail-section__body image-processing-panel-scroll image-processing-panel-scroll--column">
            <div class="image-processing-preview-card image-processing-preview-card--detail">
              <div class="image-processing-preview-card__body image-processing-preview-card__body--detail">
                <img
                  v-if="currentRow.sourceImageUrl || currentRow.sourceOriginalUrl"
                  :src="currentRow.sourceImageUrl || currentRow.sourceOriginalUrl"
                  alt="source image"
                  class="image-processing-preview-card__image"
                />
                <div v-else class="image-processing-preview-card__empty">无原图地址</div>
              </div>
            </div>
          </div>
        </section>

        <section class="image-processing-detail-section image-processing-detail-section--results">
          <div class="image-processing-detail-card__header">
            <span>处理结果</span>
            <span class="image-processing-detail-card__meta">{{ detailResultFiles.length }} 张</span>
          </div>
          <div class="image-processing-detail-section__body image-processing-panel-scroll image-processing-panel-scroll--column">
            <div v-if="detailResultFiles.length" class="image-processing-result-gallery">
              <div
                v-for="(file, index) in detailResultFiles"
                :key="file.key || file.outputFile || `${index}`"
                class="image-processing-result-card"
                :class="{ 'is-failed': !file.success }"
              >
                <div
                  class="image-processing-result-card__thumb"
                  @click="file.url && openUrl(file.url)"
                >
                  <img
                    v-if="file.url"
                    :src="file.url"
                    :alt="file.name || file.outputFile || 'result'"
                  />
                  <div v-else class="image-processing-result-card__empty">无归档结果</div>
                </div>
                <div class="image-processing-result-card__body">
                  <div class="image-processing-result-card__title">
                    {{ file.name || file.outputFile || "结果文件" }}
                  </div>
                  <div class="image-processing-result-card__meta">
                    {{ file.description || (file.success ? "处理完成" : "处理失败") }}
                  </div>
                  <div
                    v-if="file.outputFile"
                    class="image-processing-result-card__meta is-mono"
                  >
                    {{ file.outputFile }}
                  </div>
                  <div v-if="file.error" class="image-processing-result-card__error">
                    {{ file.error }}
                  </div>
                  <div class="image-processing-result-card__actions">
                    <el-button
                      v-if="file.url"
                      type="primary"
                      link
                      size="small"
                      @click="openUrl(file.url)"
                    >
                      打开归档文件
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="image-processing-empty-state">暂无处理结果</div>
          </div>
        </section>

        <section class="image-processing-detail-section image-processing-detail-section--request">
          <div class="image-processing-detail-card__header">
            <span>请求参数</span>
            <span class="image-processing-detail-card__meta">提交内容</span>
          </div>
          <div class="image-processing-detail-section__body image-processing-panel-scroll">
            <pre class="image-processing-json-block image-processing-json-block--detail">{{
              formatJson(currentRow.requestParams)
            }}</pre>
          </div>
        </section>

        <section class="image-processing-detail-section image-processing-detail-section--response">
          <div class="image-processing-detail-card__header">
            <span>返回结果</span>
            <span class="image-processing-detail-card__meta">处理响应</span>
          </div>
          <div class="image-processing-detail-section__body image-processing-panel-scroll">
            <pre class="image-processing-json-block image-processing-json-block--detail">{{
              formatJson(currentRow.responseData)
            }}</pre>
          </div>
        </section>
      </div>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Plus, RefreshRight, Search } from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";
import { formatTimestamp } from "@/common/date";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import {
  batchDeleteImageProcessingRecord,
  createImageProcessingRecord,
  deleteImageProcessingRecord,
  getImageProcessingMeta,
  getImageProcessingRecordDetail,
  getImageProcessingRecordPage,
} from "@/api/image-processing-record";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import { refreshServiceHealth, useServiceHealthState } from "@/services/serviceHealthState";
import {
  websocketClient,
  type ImageProcessingRecordChangedEvent,
} from "@/services/websocketClient";
import CreateTaskProcessStage from "./components/CreateTaskProcessStage.vue";
import CreateTaskSourceStage from "./components/CreateTaskSourceStage.vue";
import CreateTaskSubmitStage from "./components/CreateTaskSubmitStage.vue";
import CreateTaskVariationsStage from "./components/CreateTaskVariationsStage.vue";
import {
  buildImageProcessingPrefillSignature,
  clearImageProcessingRoutePrefill,
  resolveImageProcessingRoutePrefill,
  stripImageProcessingPrefillQuery,
} from "@/utils/imageProcessingRoute";

const EMPTY_OPERATIONS_JSON = "[]";

const { height } = useWindowSize();
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const total = ref(0);
const dataSource = ref<any[]>([]);
const selectedRows = ref<any[]>([]);
const createVisible = ref(false);
const detailVisible = ref(false);
const submitLoading = ref(false);
const metaLoading = ref(false);
const currentRow = ref<any>(null);
const catalog = ref<Record<string, any> | null>(null);
const operations = ref<any[]>([]);
const variations = ref<any[]>([]);
const imagesStatus = useServiceHealthState("images");
const lastAppliedPrefillSignature = ref("");
const operationKeyword = ref("");
const operationCategoryFilter = ref("all");
const activeCatalogOperationKey = ref("");

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  keyword: "",
  status: "",
  taskType: "",
});

const form = reactive({
  title: "",
  taskType: "process",
  sourceType: "url",
  imageUrl: "",
  operationsJson: EMPTY_OPERATIONS_JSON,
  sourceModule: "",
  sourceRecordId: "",
  sourceName: "",
});

const categoryLabelMap: Record<string, string> = {
  all: "全部",
  basic: "基础操作",
  effect: "图片效果",
  filter: "滤镜效果",
  default: "其他操作",
};

const categoryOrderMap: Record<string, number> = {
  basic: 1,
  effect: 2,
  filter: 3,
  default: 9,
};

const imageStatusSummary = computed(() => {
  if (imagesStatus.loading && !imagesStatus.checked) return "检测中";
  if (!imagesStatus.checked) return "未检测";
  if (imagesStatus.available) {
    return imagesStatus.message || "服务可用";
  }
  return imagesStatus.message || "服务异常";
});

const imageStatusDetail = computed(() => {
  const parts: string[] = [];
  if (imagesStatus.baseUrl) {
    parts.push(imagesStatus.baseUrl);
  }
  if (imagesStatus.timestamp) {
    parts.push(formatHealthTime(imagesStatus.timestamp));
  }
  return parts.join(" | ");
});

const imageStatusDotClass = computed(() => {
  if (imagesStatus.loading && !imagesStatus.checked) return "is-warning";
  if (!imagesStatus.checked) return "is-info";
  return imagesStatus.available ? "is-success" : "is-danger";
});

const imageStatusTooltip = computed(() => {
  return [imageStatusSummary.value, imageStatusDetail.value].filter(Boolean).join(" | ");
});

let recordRefreshTimer: ReturnType<typeof setTimeout> | null = null;
let pendingRecordRefreshEvent: ImageProcessingRecordChangedEvent | null = null;

const createSourcePreview = computed(() => {
  return String(form.imageUrl || "").trim();
});

const hasSourceContext = computed(() => {
  return !!(form.sourceModule || form.sourceRecordId || form.sourceName);
});

const currentOperationsState = computed(() => {
  const raw = String(form.operationsJson || "").trim();
  if (!raw) {
    return {
      items: [] as any[],
      error: "",
    };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return {
        items: [] as any[],
        error: "处理链 JSON 必须是数组",
      };
    }
    return {
      items: parsed.map((item, index) => buildCurrentOperationViewModel(item, index)),
      error: "",
    };
  } catch (error: any) {
    return {
      items: [] as any[],
      error: `处理链 JSON 解析失败：${error?.message || error}`,
    };
  }
});

const currentOperations = computed(() => currentOperationsState.value.items);

const currentOperationsParseError = computed(() => currentOperationsState.value.error);

const variationPreviewNames = computed(() => {
  return variations.value
    .map((item) => String(item?.name || "").trim())
    .filter(Boolean)
    .slice(0, 8);
});

const operationUsageCountMap = computed(() => {
  const map = new Map<string, number>();

  currentOperations.value.forEach((item) => {
    const key = String(item.meta?.apiType || item.meta?.type || item.raw?.type || "").trim();
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });

  return map;
});

const operationCategoryOptions = computed(() => {
  const counts = new Map<string, number>();

  operations.value.forEach((operation) => {
    const category = String(operation?.category || "default");
    counts.set(category, (counts.get(category) || 0) + 1);
  });

  const options = [
    {
      value: "all",
      label: categoryLabelMap.all,
      count: operations.value.length,
    },
  ];

  Array.from(counts.entries())
    .sort((a, b) => {
      const orderDiff = (categoryOrderMap[a[0]] || 99) - (categoryOrderMap[b[0]] || 99);
      if (orderDiff !== 0) return orderDiff;
      return a[0].localeCompare(b[0]);
    })
    .forEach(([value, count]) => {
      options.push({
        value,
        label: categoryLabelMap[value] || value,
        count,
      });
    });

  return options;
});

const filteredGroupedOperations = computed(() => {
  const keyword = String(operationKeyword.value || "").trim().toLowerCase();
  const categoryFilter = String(operationCategoryFilter.value || "all");
  const groups = new Map<string, any[]>();

  operations.value
    .filter((operation) => {
      const category = String(operation?.category || "default");
      if (categoryFilter !== "all" && category !== categoryFilter) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return matchesOperationKeyword(operation, keyword);
    })
    .sort((a, b) => {
      const categoryDiff =
        (categoryOrderMap[String(a?.category || "default")] || 99) -
        (categoryOrderMap[String(b?.category || "default")] || 99);
      if (categoryDiff !== 0) {
        return categoryDiff;
      }
      const aLabel = String(a?.description || a?.type || a?.apiType || "");
      const bLabel = String(b?.description || b?.type || b?.apiType || "");
      return aLabel.localeCompare(bLabel, "zh-CN");
    })
    .forEach((operation) => {
      const category = String(operation?.category || "default");
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)?.push(operation);
    });

  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    label: categoryLabelMap[category] || category,
    items,
  }));
});

const filteredOperationCount = computed(() => {
  return filteredGroupedOperations.value.reduce((total, group) => total + group.items.length, 0);
});

const canSubmitCreate = computed(() => {
  if (imagesStatus.checked && !imagesStatus.available) {
    return false;
  }
  if (!/^https?:\/\//i.test(String(form.imageUrl || "").trim())) {
    return false;
  }

  if (form.taskType === "process") {
    return !currentOperationsParseError.value && currentOperations.value.length > 0;
  }

  return variations.value.length > 0;
});

const detailResultFiles = computed(() => {
  return Array.isArray(currentRow.value?.resultFiles) ? currentRow.value.resultFiles : [];
});

const requestPreviewJson = computed(() => {
  return formatJson(buildCreateRequestPreview());
});

const createSubmitHint = computed(() => {
  if (imagesStatus.checked && !imagesStatus.available) {
    return "图片处理服务当前不可用，请稍后再试。";
  }
  if (!/^https?:\/\//i.test(String(form.imageUrl || "").trim())) {
    return "请先输入有效的图片地址，再继续提交任务。";
  }
  if (form.taskType === "process") {
    if (currentOperationsParseError.value) {
      return currentOperationsParseError.value;
    }
    if (!currentOperations.value.length) {
      return "请先从操作目录中加入至少一个处理步骤。";
    }
  } else if (!variations.value.length) {
    return "当前还没有可用的裂变预设，请先刷新页面数据。";
  }
  return "当前配置已完成，可以直接提交任务。";
});

const gridOptions = computed(() => ({
  ...commonGridOptions,
  maxHeight: Math.max(height.value - 250, 420),
  rowConfig: { keyField: "id" },
  columns: [
    { type: "checkbox", width: 50 },
    { title: "原图", field: "sourceImageUrl", width: 190, slots: { default: "sourceSlot" } },
    { title: "标题", field: "title", minWidth: 280, slots: { default: "titleSlot" } },
    { title: "状态", field: "status", width: 120, slots: { default: "statusSlot" } },
    { title: "结果", field: "resultFiles", minWidth: 200, slots: { default: "resultSlot" } },
    {
      title: "上传者",
      field: "uploader",
      width: 140,
      formatter: ({ row }: any) =>
        row?.uploader?.account || row?.uploader?.name || row?.userId || "-",
    },
    { ...buildTimeColumn("创建时间", "createTime", 180), slots: { default: "createTimeSlot" } },
    buildOperationColumn("operationDefaultSlot"),
  ],
}));

watch(
  () => form.taskType,
  (taskType) => {
    if (taskType === "process") {
      syncDefaultOperationsJson();
    }
  },
);

function handleKeywordChange(value: string) {
  if (!value) {
    getList();
  }
}

function handleCheckboxChange({ records }: any) {
  selectedRows.value = records || [];
}

function handleCheckboxAll({ records }: any) {
  selectedRows.value = records || [];
}

function getStatusLabel(status?: string) {
  const labelMap: Record<string, string> = {
    pending: "待处理",
    processing: "处理中",
    success: "成功",
    partial: "部分成功",
    failed: "失败",
  };
  return labelMap[status || ""] || status || "-";
}

function getStatusTagType(status?: string) {
  if (status === "success") return "success";
  if (status === "partial" || status === "processing") return "warning";
  if (status === "failed") return "danger";
  return "info";
}

function getSourcePreview(row: any) {
  return row?.sourceImageUrl || row?.sourceOriginalUrl || "";
}

function getFirstResultUrl(row: any) {
  const files = Array.isArray(row?.resultFiles) ? row.resultFiles : [];
  const first = files.find((item: any) => item?.success && item?.url);
  return first?.url || "";
}

function getResultSummary(row: any) {
  const files = Array.isArray(row?.resultFiles) ? row.resultFiles : [];
  const successCount = files.filter((item: any) => item?.success).length;
  if (!files.length) {
    return "0 个结果";
  }
  return `${successCount}/${files.length} 个已归档`;
}

function openUrl(url?: string) {
  const normalized = String(url || "").trim();
  if (!normalized) return;
  window.open(normalized, "_blank", "noopener,noreferrer");
}

function openRowSource(row: any) {
  openUrl(getSourcePreview(row));
}

function openFirstResult(row: any) {
  openUrl(getFirstResultUrl(row));
}

function resetForm() {
  form.title = "";
  form.taskType = "process";
  form.sourceType = "url";
  form.imageUrl = "";
  form.operationsJson = EMPTY_OPERATIONS_JSON;
  form.sourceModule = "";
  form.sourceRecordId = "";
  form.sourceName = "";
  operationKeyword.value = "";
  operationCategoryFilter.value = "all";
  activeCatalogOperationKey.value = "";
}

function formatOperationsJson() {
  const raw = String(form.operationsJson || "").trim();
  if (!raw) {
    form.operationsJson = EMPTY_OPERATIONS_JSON;
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      ElMessage.error("处理 JSON 必须是数组");
      return;
    }
    form.operationsJson = JSON.stringify(parsed, null, 2);
  } catch (error: any) {
    ElMessage.error(`JSON 格式错误：${error?.message || error}`);
  }
}

function normalizeOperationLookupKey(value?: string) {
  let key = String(value || "").trim();
  if (!key) {
    return "";
  }

  if (key === "shape-crop") {
    key = "shapeCrop";
  }
  if (key.startsWith("effects-")) {
    key = key.slice("effects-".length);
  }
  if (key.startsWith("effect-")) {
    key = key.slice("effect-".length);
  }
  if (key.startsWith("filter_")) {
    key = key.replace(/^filter_/, "filter-");
  }

  return key;
}

function getOperationIdentity(operation: any) {
  return String(operation?.apiType || operation?.type || "").trim();
}

function resolveOperationMetaByType(type?: string) {
  const normalized = normalizeOperationLookupKey(type);
  if (!normalized) {
    return null;
  }

  return (
    operations.value.find((operation) => {
      const candidates = [
        operation?.apiType,
        operation?.type,
        ...(Array.isArray(operation?.aliases) ? operation.aliases : []),
      ]
        .map((item) => normalizeOperationLookupKey(item))
        .filter(Boolean);

      return candidates.includes(normalized);
    }) || null
  );
}

function getRequiredParamNames(operation: any) {
  const params = operation?.params || {};
  return Object.entries(params)
    .filter(([, definition]: any) => !!definition?.required)
    .map(([key]) => key);
}

function getOperationParamSummary(operation: any) {
  const paramNames = Object.keys(operation?.params || {});
  if (!paramNames.length) {
    return "无需额外参数";
  }
  return `参数：${paramNames.join(", ")}`;
}

function cloneParamDefaultValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneParamDefaultValue(item)) as T;
  }
  if (value && typeof value === "object") {
    return { ...(value as Record<string, any>) } as T;
  }
  return value;
}

function resolveOperationParamDefault(definition: any) {
  if (definition?.default !== undefined) {
    return cloneParamDefaultValue(definition.default);
  }
  if (Array.isArray(definition?.enum) && definition.enum.length) {
    return cloneParamDefaultValue(definition.enum[0]);
  }
  if (definition?.type === "number" && definition?.minimum !== undefined) {
    return Number(definition.minimum);
  }
  if (!definition?.required) {
    return undefined;
  }
  if (definition.type === "boolean") {
    return false;
  }
  if (definition.type === "array") {
    return [];
  }
  if (definition.type === "object") {
    return {};
  }
  return "";
}

function formatOperationParamValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(" / ");
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  if (value === undefined || value === null || value === "") {
    return "-";
  }
  return String(value);
}

function getCurrentOperationParamEntries(operation: any) {
  const params =
    operation?.params && typeof operation.params === "object" && !Array.isArray(operation.params)
      ? operation.params
      : {};

  return Object.entries(params).map(([name, value]) => ({
    name,
    value: formatOperationParamValue(value),
  }));
}

function buildCurrentOperationViewModel(operation: any, index: number) {
  const meta = resolveOperationMetaByType(operation?.type);
  const title =
    String(meta?.description || meta?.type || operation?.type || `步骤 ${index + 1}`).trim() ||
    `步骤 ${index + 1}`;

  return {
    key: `${index}-${String(operation?.type || meta?.apiType || meta?.type || "unknown")}`,
    raw: operation,
    meta,
    title,
    description:
      meta?.description && meta.description !== title
        ? meta.description
        : meta
          ? `${categoryLabelMap[String(meta.category || "default")] || "操作"}配置`
          : "当前 JSON 中的自定义操作",
    typeLabel: String(meta?.apiType || operation?.type || "-"),
    categoryLabel: categoryLabelMap[String(meta?.category || "default")] || "其他操作",
    requiredParams: Array.isArray(meta?.requiredParams) ? meta.requiredParams : [],
    paramEntries: getCurrentOperationParamEntries(operation),
  };
}

function getOperationParamRows(operation: any) {
  const params = operation?.params || {};
  return Object.entries(params as Record<string, any>).map(([name, definition]) => {
    const metaParts = [definition?.type || "any", definition?.required ? "必填" : "可选"];

    if (definition?.default !== undefined) {
      metaParts.push(`默认 ${formatOperationParamValue(definition.default)}`);
    } else if (definition?.type === "number" && definition?.minimum !== undefined) {
      metaParts.push(`建议起始 ${definition.minimum}`);
    }

    if (definition?.minimum !== undefined || definition?.maximum !== undefined) {
      metaParts.push(`范围 ${definition?.minimum ?? "-"} ~ ${definition?.maximum ?? "-"}`);
    }

    if (Array.isArray(definition?.enum) && definition.enum.length) {
      metaParts.push(`枚举 ${definition.enum.join(" / ")}`);
    }

    return {
      name,
      description: definition?.description || "无说明",
      meta: metaParts.join(" · "),
    };
  });
}

function getVariationOperationCount(variation: any) {
  if (Array.isArray(variation?.operations)) {
    return variation.operations.length;
  }
  const count = Number(variation?.operationCount);
  return Number.isFinite(count) ? count : 0;
}

function getVariationOperationLabels(variation: any) {
  const operationsList = Array.isArray(variation?.operations) ? variation.operations : [];
  return operationsList
    .slice(0, 4)
    .map((operation: any) => {
      const meta = resolveOperationMetaByType(operation?.type);
      return String(meta?.description || meta?.apiType || operation?.type || "").trim();
    })
    .filter(Boolean);
}

function buildOperationTemplate(operation: any) {
  const template: Record<string, any> = {
    type: operation?.apiType || operation?.type,
  };
  const params = operation?.params || {};
  const paramValues: Record<string, any> = {};

  for (const [key, definition] of Object.entries(params as Record<string, any>)) {
    const defaultValue = resolveOperationParamDefault(definition);
    if (defaultValue !== undefined) {
      paramValues[key] = defaultValue;
    }
  }

  if (Object.keys(paramValues).length) {
    template.params = paramValues;
  }

  return template;
}

function resolveDefaultOperationsJson() {
  const exampleOperation =
    ["resize", "crop", "effects-grayscale", "grayscale"]
      .map((type) => resolveOperationMetaByType(type))
      .find(Boolean) || operations.value[0];

  if (!exampleOperation) {
    return EMPTY_OPERATIONS_JSON;
  }
  return JSON.stringify([buildOperationTemplate(exampleOperation)], null, 2);
}

function syncDefaultOperationsJson(options: { forceExample?: boolean } = {}) {
  if (form.taskType !== "process") {
    return;
  }

  if (options.forceExample) {
    form.operationsJson = resolveDefaultOperationsJson();
    return;
  }

  if (!String(form.operationsJson || "").trim()) {
    form.operationsJson = EMPTY_OPERATIONS_JSON;
  }
}

function cleanupRoutePrefill() {
  clearImageProcessingRoutePrefill(route.query);
  const nextQuery = stripImageProcessingPrefillQuery(route.query);
  router.replace({ path: route.path, query: nextQuery });
}

function applyRoutePrefill() {
  const prefill = resolveImageProcessingRoutePrefill(route.query);
  const signature = buildImageProcessingPrefillSignature(prefill);

  if (!prefill?.imageUrl || !signature || lastAppliedPrefillSignature.value === signature) {
    return;
  }

  lastAppliedPrefillSignature.value = signature;
  resetForm();
  form.sourceType = "url";
  form.imageUrl = prefill.imageUrl;
  form.taskType = prefill.taskType || "process";
  form.title = prefill.title || prefill.sourceName || "";
  form.sourceModule = prefill.sourceModule || "";
  form.sourceRecordId = prefill.sourceRecordId || "";
  form.sourceName = prefill.sourceName || "";
  syncDefaultOperationsJson();

  if (prefill.openCreate !== false) {
    createVisible.value = true;
    void refreshPageMeta();
  }

  cleanupRoutePrefill();
}

function replaceOperationsJson(operationsList: any[]) {
  form.operationsJson = JSON.stringify(operationsList, null, 2);
}

function parseOperationsJsonArray(rawValue: string) {
  const raw = String(rawValue || "").trim();
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("处理链 JSON 必须是数组");
  }
  return parsed;
}

function clearOperationsChain() {
  form.operationsJson = EMPTY_OPERATIONS_JSON;
}

function moveCurrentOperation(index: number, direction: -1 | 1) {
  try {
    const parsed = parseOperationsJsonArray(form.operationsJson);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= parsed.length) {
      return;
    }
    const [current] = parsed.splice(index, 1);
    parsed.splice(targetIndex, 0, current);
    replaceOperationsJson(parsed);
  } catch (error: any) {
    ElMessage.error(error?.message || "当前处理链格式不合法，无法调整顺序");
  }
}

function removeCurrentOperation(index: number) {
  try {
    const parsed = parseOperationsJsonArray(form.operationsJson);
    parsed.splice(index, 1);
    replaceOperationsJson(parsed);
  } catch (error: any) {
    ElMessage.error(error?.message || "当前处理链格式不合法，无法删除步骤");
  }
}

function selectCatalogOperation(operation: any) {
  activeCatalogOperationKey.value = getOperationIdentity(operation);
}

function getOperationUsageCount(operation: any) {
  const identity = getOperationIdentity(operation);
  if (!identity) {
    return 0;
  }
  return operationUsageCountMap.value.get(identity) || 0;
}

function matchesOperationKeyword(operation: any, keyword: string) {
  const paramDefinitionTexts = Object.values(operation?.params || {}).reduce<any[]>(
    (result, definition: any) => {
      result.push(definition?.description, definition?.type);
      if (Array.isArray(definition?.enum)) {
        result.push(...definition.enum);
      }
      return result;
    },
    [],
  );

  const textParts = [
    operation?.type,
    operation?.apiType,
    operation?.description,
    operation?.category,
    ...(Array.isArray(operation?.aliases) ? operation.aliases : []),
    ...Object.keys(operation?.params || {}),
    ...paramDefinitionTexts,
  ]
    .filter((item) => item !== undefined && item !== null && item !== "")
    .map((item) => String(item).toLowerCase());

  return textParts.some((item) => item.includes(keyword));
}

function appendOperationTemplate(operation: any) {
  const raw = String(form.operationsJson || "").trim();
  let parsed: any[] = [];

  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch (error: any) {
      ElMessage.error(`当前 JSON 不合法，无法插入模板：${error?.message || error}`);
      return;
    }
  }

  if (!Array.isArray(parsed)) {
    ElMessage.error("当前 JSON 必须是数组，才能追加操作模板");
    return;
  }

  parsed.push(buildOperationTemplate(operation));
  replaceOperationsJson(parsed);
  selectCatalogOperation(operation);
}

function formatJson(value: any) {
  if (value === null || value === undefined || value === "") {
    return "{}";
  }
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function parseOperationsJsonSafe(rawValue: string) {
  const raw = String(rawValue || "").trim();
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed;
  } catch (error) {
    return raw;
  }
}

function buildCreateRequestPreview() {
  return {
    title: String(form.title || "").trim() || null,
    taskType: form.taskType,
    source: {
      type: "url",
      imageUrl: String(form.imageUrl || "").trim() || null,
      sourceModule: String(form.sourceModule || "").trim() || null,
      sourceRecordId: String(form.sourceRecordId || "").trim() || null,
      sourceName: String(form.sourceName || "").trim() || null,
    },
    request:
      form.taskType === "process"
        ? {
            operations: parseOperationsJsonSafe(form.operationsJson),
          }
        : {
            variationCount: variations.value.length,
            variationNames: variations.value.map((item) => item?.name).filter(Boolean),
          },
  };
}

function formatHealthTime(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

watch(
  () => route.fullPath,
  () => {
    applyRoutePrefill();
  },
  { immediate: true },
);

async function refreshPageMeta() {
  await Promise.allSettled([refreshServiceHealth("images"), loadMeta(true)]);
}

async function loadMeta(silent = false) {
  if (!silent) {
    metaLoading.value = true;
  }

  try {
    const result: any = await getImageProcessingMeta();
    catalog.value = result?.catalog || null;
    operations.value = Array.isArray(result?.operations) ? result.operations : [];
    variations.value = Array.isArray(result?.variations) ? result.variations : [];
    if (
      !activeCatalogOperationKey.value ||
      !operations.value.some((operation) => getOperationIdentity(operation) === activeCatalogOperationKey.value)
    ) {
      activeCatalogOperationKey.value = operations.value[0]
        ? getOperationIdentity(operations.value[0])
        : "";
    }
    syncDefaultOperationsJson();
  } catch (error: any) {
    catalog.value = null;
    operations.value = [];
    variations.value = [];
    ElMessage.error(error?.message || "获取图片服务元数据失败");
  } finally {
    metaLoading.value = false;
  }
}

async function getList() {
  loading.value = true;
  selectedRows.value = [];
  try {
    const result: any = await getImageProcessingRecordPage({ ...queryParams });
    dataSource.value = result?.list || result?.records || [];
    total.value = result?.total || 0;
  } catch (error: any) {
    dataSource.value = [];
    total.value = 0;
    ElMessage.error(error?.message || "获取图片处理记录失败");
  } finally {
    loading.value = false;
  }
}

function scheduleRecordRefresh(event?: ImageProcessingRecordChangedEvent) {
  if (event?.recordId) {
    pendingRecordRefreshEvent = event;
  }

  if (recordRefreshTimer) {
    clearTimeout(recordRefreshTimer);
  }

  recordRefreshTimer = setTimeout(async () => {
    recordRefreshTimer = null;
    const latestEvent = pendingRecordRefreshEvent;
    pendingRecordRefreshEvent = null;
    await getList();

    if (latestEvent?.recordId && currentRow.value?.id === latestEvent.recordId && detailVisible.value) {
      try {
        const result: any = await getImageProcessingRecordDetail(latestEvent.recordId);
        await prepareDetailState(result);
      } catch {
        // ignore detail refresh failure to keep realtime updates lightweight
      }
    }
  }, 280);
}

function handleImageProcessingRecordChanged(event: ImageProcessingRecordChangedEvent) {
  if (!event?.recordId) {
    return;
  }
  scheduleRecordRefresh(event);
}

function openCreateDialog() {
  resetForm();
  createVisible.value = true;
  void refreshPageMeta();
}

async function prepareDetailState(row: any) {
  currentRow.value = row;
}

async function submitCreate() {
  if (!canSubmitCreate.value) {
    ElMessage.warning(createSubmitHint.value);
    return;
  }

  if (form.taskType === "process") {
    const raw = String(form.operationsJson || "").trim();
    if (!raw) {
      ElMessage.warning("请填写处理 JSON");
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) {
        ElMessage.warning("处理 JSON 必须是非空数组");
        return;
      }
      form.operationsJson = JSON.stringify(parsed, null, 2);
    } catch (error: any) {
      ElMessage.error(`处理 JSON 格式错误：${error?.message || error}`);
      return;
    }
  }

  submitLoading.value = true;
  try {
    await refreshServiceHealth("images");
    if (imagesStatus.checked && !imagesStatus.available) {
      ElMessage.error("图片处理服务不可用，请先恢复服务后再提交");
      return;
    }

    const payload = new FormData();
    if (String(form.title || "").trim()) {
      payload.append("title", String(form.title).trim());
    }
    payload.append("taskType", form.taskType);
    if (String(form.sourceModule || "").trim()) {
      payload.append("sourceModule", String(form.sourceModule).trim());
    }
    if (String(form.sourceRecordId || "").trim()) {
      payload.append("sourceRecordId", String(form.sourceRecordId).trim());
    }
    if (String(form.sourceName || "").trim()) {
      payload.append("sourceName", String(form.sourceName).trim());
    }
    if (form.taskType === "process") {
      payload.append("operationsJson", form.operationsJson);
    }

    payload.append("imageUrl", String(form.imageUrl || "").trim());

    const result: any = await createImageProcessingRecord(payload);
    createVisible.value = false;
    await getList();

    if (result?.status === "pending" || result?.status === "processing") {
      ElMessage.success("任务已提交，正在后台处理中");
      return;
    }

    if (result?.status === "failed") {
      await prepareDetailState(result);
      detailVisible.value = true;
      ElMessage.error(result?.errorMessage || "图片处理失败");
      return;
    }

    if (result?.status === "partial") {
      await prepareDetailState(result);
      detailVisible.value = true;
      ElMessage.warning("任务已完成，但部分结果处理失败");
      return;
    }

    ElMessage.success("图片处理完成，结果已归档");
  } catch (error: any) {
    ElMessage.error(error?.message || "创建图片处理任务失败");
  } finally {
    submitLoading.value = false;
  }
}

async function openDetail(row: any) {
  try {
    const result: any = await getImageProcessingRecordDetail(row.id);
    await prepareDetailState(result);
    detailVisible.value = true;
  } catch (error: any) {
    ElMessage.error(error?.message || "获取详情失败");
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除记录「${row.title || row.id}」吗？`, "删除确认", {
      type: "warning",
    });
    await deleteImageProcessingRecord(row.id);
    if (currentRow.value?.id === row.id) {
      detailVisible.value = false;
      currentRow.value = null;
    }
    ElMessage.success("删除成功");
    await getList();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "删除图片处理记录失败");
    }
  }
}

async function handleBatchDelete() {
  if (!selectedRows.value.length) {
    ElMessage.warning("请选择要删除的记录");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedRows.value.length} 条记录吗？`,
      "批量删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    loading.value = true;
    const ids = selectedRows.value.map((item: any) => item.id);
    const result: any = await batchDeleteImageProcessingRecord(ids);

    if (result?.failed?.length) {
      ElMessage.warning(`部分删除失败：${result.failed.length} 条`);
    } else {
      ElMessage.success(`成功删除 ${result?.successIds?.length || ids.length} 条记录`);
    }

    selectedRows.value = [];
    await getList();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "批量删除失败");
    }
  } finally {
    loading.value = false;
  }
}

function handleOperationCommand(command: string, row: any) {
  if (command === "detail") {
    openDetail(row);
    return;
  }
  if (command === "delete") {
    handleDelete(row);
  }
}

onMounted(async () => {
  websocketClient.events.on("imageProcessingRecordChanged", handleImageProcessingRecordChanged);
  await Promise.allSettled([loadMeta(), getList(), refreshServiceHealth("images")]);
});

onBeforeUnmount(() => {
  websocketClient.events.off("imageProcessingRecordChanged", handleImageProcessingRecordChanged);
  if (recordRefreshTimer) {
    clearTimeout(recordRefreshTimer);
    recordRefreshTimer = null;
  }
  pendingRecordRefreshEvent = null;
});
</script>

<style scoped>
:deep(.image-processing-record-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.image-processing-record-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.image-processing-record-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.image-processing-record-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}

.image-processing-record-page__status-bar {
  display: flex;
  width: 100%;
  min-height: 32px;
  align-items: center;
  gap: 6px;
}

.image-processing-record-page__status-dot {
  display: inline-flex;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--el-text-color-disabled);
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.12);
}

.image-processing-record-page__status-dot.is-success {
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.14);
}

.image-processing-record-page__status-dot.is-warning {
  background: var(--el-color-warning);
  box-shadow: 0 0 0 3px rgba(230, 162, 60, 0.14);
}

.image-processing-record-page__status-dot.is-danger {
  background: var(--el-color-danger);
  box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.14);
}

.image-processing-record-page__status-dot.is-info {
  background: var(--el-color-info);
  box-shadow: 0 0 0 3px rgba(144, 147, 153, 0.14);
}

.image-processing-record-page__status-text {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.image-record-source-cell,
.image-record-result-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.image-record-title-cell,
.image-record-source-meta,
.image-record-result-meta {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.image-record-thumb,
.image-record-result-thumb {
  display: flex;
  width: 72px;
  height: 72px;
  flex: 0 0 72px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
  background: var(--el-fill-color-light);
  cursor: pointer;
}

.image-record-thumb img,
.image-record-result-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-record-thumb__placeholder {
  padding: 0 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-align: center;
  line-height: 1.5;
}

.image-record-source-type,
.image-record-title-sub {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.image-record-source-name,
.image-record-title-main,
.image-record-result-count {
  color: var(--el-text-color-primary);
  font-weight: 500;
  word-break: break-word;
}

.image-record-result-thumb.is-empty {
  cursor: default;
}

:deep(.image-processing-create-dialog .el-dialog__body) {
  height: calc(100vh - 70px);
  padding-top: 12px;
  overflow: hidden;
}

:deep(.image-processing-detail-dialog .el-dialog__body) {
  height: calc(100vh - 70px);
  padding-top: 12px;
  overflow-y: auto;
  overflow-x: hidden;
}

.image-processing-create-layout {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 16px;
}

.image-processing-mode-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.image-processing-mode-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.image-processing-mode-tabs :deep(.el-tabs__item) {
  height: 34px;
  padding: 0 14px;
  font-size: 13px;
}

.image-processing-create-layout :deep(.image-processing-panel-card .el-card__header) {
  padding: 16px 20px 14px;
}

.image-processing-create-layout :deep(.image-processing-panel-card .el-card__body) {
  gap: 16px;
  padding: 20px 20px 18px;
}

.image-processing-create-workspace {
  min-height: 0;
  flex: 1;
}

.image-processing-linear-flow {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 20px;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 2px;
  padding-bottom: 8px;
}

.image-processing-panel-card {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
}

:deep(.image-processing-panel-card .el-card__body) {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  padding: 16px 18px 18px;
}

.image-processing-panel-scroll {
  min-height: auto;
  flex: initial;
  overflow: visible;
  padding-right: 0;
}

.image-processing-panel-scroll--column {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.image-processing-preview-card {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
  padding: 10px;
}

.image-processing-preview-card--detail {
  margin-top: 0;
  background: linear-gradient(180deg, var(--el-fill-color-extra-light), var(--el-bg-color));
}

.image-processing-preview-card__title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.image-processing-preview-card__body {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 10px;
  background: var(--el-fill-color-light);
}

.image-processing-preview-card__body--detail {
  min-height: 180px;
}

.image-processing-preview-card__image {
  width: 100%;
  height: 100%;
  max-height: 180px;
  object-fit: contain;
}

.image-processing-preview-card__empty,
.image-processing-empty-state,
.image-processing-result-card__empty {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  text-align: center;
  line-height: 1.6;
}

.image-processing-panel-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.image-processing-panel-toolbar--split {
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.image-processing-panel-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.image-processing-chain-overview,
.image-processing-op-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.image-processing-chain-overview__item,
.image-processing-op-toolbar span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.image-processing-chain-overview__item {
  border-radius: 999px;
  background: var(--el-fill-color-extra-light);
  padding: 6px 10px;
}

.image-processing-json-block {
  margin: 0;
  overflow: auto;
  max-width: 100%;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  padding: 10px;
  color: var(--el-text-color-regular);
  font-size: 11px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.image-processing-json-block--detail {
  background: linear-gradient(180deg, var(--el-fill-color-extra-light), var(--el-fill-color-light));
}

.image-processing-detail-layout {
  display: flex;
  min-height: auto;
  height: auto;
  flex-direction: column;
  gap: 12px;
}

.image-processing-detail-section {
  display: flex;
  min-height: auto;
  flex-direction: column;
  gap: 8px;
  padding: 6px 0;
  overflow: visible;
}

.image-processing-detail-section__body {
  min-height: auto;
}

.image-processing-detail-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.image-processing-detail-card__meta {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 400;
  line-height: 1.5;
}

.image-processing-result-gallery {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  align-content: start;
}

.image-processing-result-card {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.image-processing-result-card.is-failed {
  border-color: rgba(245, 108, 108, 0.35);
}

.image-processing-result-card__thumb {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--el-fill-color-light);
  cursor: pointer;
}

.image-processing-result-card__thumb img {
  width: 100%;
  height: 100%;
  max-height: 180px;
  object-fit: contain;
}

.image-processing-result-card__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
}

.image-processing-result-card__title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.image-processing-result-card__meta {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.5;
}

.image-processing-result-card__meta.is-mono {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.image-processing-result-card__error {
  color: var(--el-color-danger);
  font-size: 11px;
  line-height: 1.5;
}

.image-processing-result-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

@media (max-width: 1440px) {
  .image-processing-detail-layout {
    gap: 10px;
  }
}

@media (max-width: 1200px) {
  .image-processing-detail-layout {
    height: auto;
  }

  .image-processing-create-layout {
    height: auto;
  }

  :deep(.image-processing-create-dialog .el-dialog__body),
  :deep(.image-processing-detail-dialog .el-dialog__body) {
    overflow-y: auto;
  }

  .image-processing-preview-card__body--detail {
    min-height: 180px;
  }
}

@media (max-width: 768px) {
  .image-record-source-cell,
  .image-record-result-cell {
    align-items: flex-start;
  }

  .image-processing-panel-toolbar--split,
  .image-processing-panel-toolbar__actions {
    justify-content: flex-start;
  }

}
</style>
