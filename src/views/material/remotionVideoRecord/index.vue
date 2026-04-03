<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="remotion-record-page">
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
                    placeholder="标题"
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
                    <el-option label="失败" value="failed" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col
                class="list-page-search-form__col--wide"
                :xs="24"
                :sm="24"
                :md="8"
                :lg="13"
                :xl="14"
              >
                <el-form-item label="服务状态">
                  <div class="remotion-record-page__status-bar">
                    <el-tag :type="remotionStatusTagType" size="small">
                      Remotion 服务 {{ remotionStatusLabel }}
                    </el-tag>
                    <div class="remotion-record-page__status-content">
                      <span
                        class="remotion-record-page__status-text"
                        :title="remotionStatusSummary"
                      >
                        {{ remotionStatusSummary }}
                      </span>
                      <span
                        v-if="remotionStatusDetail"
                        class="remotion-record-page__status-detail"
                        :title="remotionStatusDetail"
                      >
                        {{ remotionStatusDetail }}
                      </span>
                    </div>
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
                >搜索</el-button
              >
              <el-button size="small" type="primary" @click="openCreateDialog()">新增</el-button>
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
                @click="checkRemotionHealth"
                :loading="remotionStatus.loading"
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
                <template #titleSlot="{ row }">
                  <div class="record-title-cell">
                    <div class="record-title-text">
                      <span class="record-title-main">{{ row.title || "-" }}</span>
                      <span class="record-id">ID: {{ row.id }}</span>
                    </div>
                  </div>
                </template>
                <template #templateSlot="{ row }">
                  <div class="record-template-cell">
                    <div class="record-template-name">
                      <span class="record-template-main">{{
                        row.templateName || row.templateId
                      }}</span>
                      <span class="record-template-id">{{ row.templateId }}</span>
                    </div>
                  </div>
                </template>
                <template #statusSlot="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" effect="plain">{{
                    getStatusLabel(row.status)
                  }}</el-tag>
                </template>
                <template #videoSlot="{ row }">
                  <div class="record-video-cell">
                    <div class="cell-video-wrapper">
                      <video
                        v-if="row.url"
                        :id="'thumb-' + row.id"
                        :src="row.url"
                        preload="none"
                        class="cell-video-player"
                        muted
                        playsinline
                        :controls="false"
                      ></video>
                      <div
                        v-if="row.url"
                        class="cell-play-overlay"
                        aria-hidden="true"
                        @click.stop="previewVideo(row)"
                      >
                        <span class="cell-play-icon"></span>
                      </div>
                      <span v-if="!row.url" class="text-xs opacity-60">-</span>
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
                      <el-button type="primary" link size="small" class="operation-trigger-button"
                        >操作</el-button
                      >
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="detail">查看详情</el-dropdown-item>
                          <!-- 再次生成已移除 -->
                          <el-dropdown-item
                            command="delete"
                            divided
                            class="operation-menu-item--danger"
                            >删除</el-dropdown-item
                          >
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
  </ContentWrap>

  <el-dialog
    v-model="createVisible"
    title="新增视频制作"
    fullscreen
    destroy-on-close
    class="remotion-create-dialog"
  >
    <div class="remotion-create-layout">
      <el-card shadow="never">
        <template #header>第 1 步 · 选择模板</template>
        <div class="template-info-panel">
          <div v-if="templateOverviewStats.length" class="template-library-overview">
            <div
              v-for="stat in templateOverviewStats"
              :key="stat.label"
              class="template-overview-card"
            >
              <span class="template-overview-card__label">{{ stat.label }}</span>
              <strong class="template-overview-card__value">{{ stat.value }}</strong>
            </div>
          </div>

          <el-form label-position="top" class="space-y-1">
            <el-row :gutter="12">
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="内容分类">
                  <el-select
                    v-model="templateFilters.category"
                    class="w-full"
                    clearable
                    placeholder="全部分类"
                    popper-class="remotion-filter-select-dropdown"
                    @change="handleTemplateFilterChange"
                  >
                    <el-option
                      v-for="item in templateCategoryOptions"
                      :key="item"
                      :label="item"
                      :value="item"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="时长类型">
                  <el-select
                    v-model="templateFilters.durationLabel"
                    class="w-full"
                    clearable
                    placeholder="全部时长"
                    popper-class="remotion-filter-select-dropdown"
                    @change="handleTemplateFilterChange"
                  >
                    <el-option
                      v-for="item in templateDurationOptions"
                      :key="item"
                      :label="item"
                      :value="item"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="24" :lg="12">
                <el-form-item label="模板">
                  <el-select
                    v-model="form.templateId"
                    class="w-full"
                    filterable
                    placeholder="请选择模板"
                    popper-class="remotion-template-select-dropdown"
                    @change="handleTemplateChange"
                  >
                    <el-option
                      v-for="item in filteredTemplateOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    >
                      <div class="template-select-option">
                        <span class="template-select-option__name">{{ item.name }}</span>
                        <span class="template-select-option__meta">
                          {{ item.category || "未分类" }} / {{ item.durationLabel || "-" }}
                        </span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="template-filter-summary">
              当前展示 {{ filteredTemplateOptions.length }} / {{ templateOptions.length }} 个模板
            </div>
          </el-form>

          <div v-if="selectedTemplate" class="template-summary">
            <div class="template-summary-name">{{ selectedTemplate.name }}</div>
            <div class="template-summary-desc">
              {{ selectedTemplate.description || "暂无模板说明" }}
            </div>
            <div class="template-summary-meta">
              <span v-if="selectedTemplate.category">{{ selectedTemplate.category }}</span>
              <span v-if="selectedTemplate.style">{{ selectedTemplate.style }}</span>
              <span v-if="selectedTemplate.durationLabel">{{
                selectedTemplate.durationLabel
              }}</span>
              <span>{{ selectedTemplate.width }} x {{ selectedTemplate.height }}</span>
              <span>{{ selectedTemplate.fps }}fps</span>
              <span>{{ selectedTemplate.durationInFrames }}帧</span>
            </div>
            <div v-if="selectedTemplate.useCase" class="template-detail-block">
              <div class="schema-title">使用场景</div>
              <div class="template-use-case">{{ selectedTemplate.useCase }}</div>
            </div>
            <div
              v-if="selectedTemplate.tags && selectedTemplate.tags.length"
              class="template-detail-block"
            >
              <div class="schema-title">风格标签</div>
              <div class="template-tag-list">
                <span v-for="tag in selectedTemplate.tags" :key="tag" class="template-tag">{{
                  tag
                }}</span>
              </div>
            </div>
            <div
              v-if="selectedTemplate.scenes && selectedTemplate.scenes.length"
              class="template-detail-block"
            >
              <div class="schema-title">视频结构</div>
              <div class="schema-list">
                <div
                  v-for="scene in selectedTemplate.scenes"
                  :key="scene.title + scene.summary"
                  class="schema-field"
                >
                  <div class="schema-field-head">
                    <strong class="schema-label">{{ scene.title }}</strong>
                  </div>
                  <div class="schema-desc">{{ scene.summary }}</div>
                </div>
              </div>
            </div>
            <div
              v-if="
                selectedTemplate.animationHighlights && selectedTemplate.animationHighlights.length
              "
              class="template-detail-block"
            >
              <div class="schema-title">核心动效</div>
              <div class="schema-list">
                <div
                  v-for="highlight in selectedTemplate.animationHighlights"
                  :key="highlight"
                  class="schema-field"
                >
                  <div class="schema-desc">{{ highlight }}</div>
                </div>
              </div>
            </div>
            <div v-if="selectedTemplate.example" class="template-detail-block">
              <div class="schema-title">示例数据</div>
              <div class="template-meta-raw">
                <pre>{{ formatJson(selectedTemplate.example) }}</pre>
              </div>
            </div>
            <div v-if="selectedTemplateDebugMeta" class="template-detail-block">
              <div class="schema-title">调试元数据</div>
              <div class="template-meta-raw">
                <pre>{{ formatJson(selectedTemplateDebugMeta) }}</pre>
              </div>
            </div>
            <div
              v-if="selectedTemplate.inputSchema && selectedTemplate.inputSchema.length"
              class="template-input-schema"
            >
              <div class="schema-title">参数说明</div>
              <div class="schema-list">
                <div
                  v-for="field in selectedTemplate.inputSchema"
                  :key="field.key"
                  class="schema-field"
                >
                  <div class="schema-field-head">
                    <strong class="schema-label">{{ field.label || field.key }}</strong>
                    <span class="schema-key">{{ field.key }}</span>
                    <span v-if="field.required" class="schema-required">必填</span>
                  </div>
                  <div class="schema-desc">{{ field.description || "-" }}</div>
                  <div v-if="field.example !== undefined" class="schema-example">
                    示例：<code>{{ field.example }}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="请选择模板后再填写参数" :image-size="88" />
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>第 2 步 · 填写参数（JSON）</template>
        <div class="remotion-form-panel">
          <el-form label-position="top" class="remotion-json-form">
            <el-form-item label="参数 (JSON)" class="remotion-json-form__item">
              <el-input
                type="textarea"
                v-model="form.inputPropsJson"
                :rows="20"
                resize="none"
                class="remotion-json-editor"
                placeholder='输入 JSON，例如: {"text":"hello","count":3}'
              />
            </el-form-item>
          </el-form>
          <div class="remotion-json-hint">提示：参数为 JSON 格式，提交时会解析为对象。</div>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>第 3 步 · 确认制作</template>
        <div class="remotion-preview-panel">
          <div class="remotion-preview-scroll">
            <div class="confirm-meta">
              <div v-if="selectedTemplate?.assetSummary" class="template-asset-summary">
                {{ selectedTemplate.assetSummary }}
              </div>
              <el-form label-position="top" class="space-y-1">
                <el-form-item label="记录标题">
                  <el-input v-model="form.title" placeholder="用于后台记录展示" />
                </el-form-item>
                <el-form-item label="任务超时(ms)">
                  <el-input-number
                    v-model="form.timeoutMs"
                    :min="1000"
                    :max="900000"
                    :step="1000"
                    class="w-full"
                  />
                </el-form-item>
              </el-form>
            </div>
            <el-alert
              v-if="remotionStatus.checked && !remotionStatus.available"
              type="error"
              :closable="false"
              show-icon
              class="remotion-submit-alert"
              title="Remotion 服务当前不可用，请先恢复服务后再提交制作任务"
            />
            <div class="remotion-submit-pipeline">
              提交后会先创建记录，再由 Remotion 渲染视频，最后通过 design-server 上传到 COS 并回写结果。
            </div>
            <pre>{{ form.inputPropsJson }}</pre>
          </div>
          <div class="remotion-create-actions flex flex-col gap-3">
            <el-button
              type="primary"
              :loading="submitLoading"
              :disabled="!canSubmitGenerate"
              @click="submitGenerate"
            >
              开始制作
            </el-button>
            <div class="remotion-submit-hint">
              {{ submitDisabledText || "长视频会在后台继续处理，列表会自动刷新状态。" }}
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </el-dialog>

  <el-dialog
    v-model="detailVisible"
    title="视频生成详情"
    fullscreen
    destroy-on-close
    class="remotion-detail-dialog"
  >
    <div v-if="currentRow" class="remotion-detail-layout">
      <el-card shadow="never">
        <template #header>结果预览</template>
        <div class="remotion-video-preview">
          <video
            v-if="currentRow.url"
            :src="currentRow.url"
            controls
            class="remotion-video-player"
          ></video>
          <el-empty v-else description="当前记录暂无视频结果" :image-size="96" />
        </div>
      </el-card>
      <div class="remotion-detail-side">
        <el-card shadow="never">
          <template #header>基础信息</template>
          <div class="detail-section">
            <div><strong>标题：</strong>{{ currentRow.title || "-" }}</div>
            <div><strong>模板：</strong>{{ currentRow.templateName || currentRow.templateId }}</div>
            <div><strong>状态：</strong>{{ getStatusLabel(currentRow.status) }}</div>
            <div><strong>创建时间：</strong>{{ formatTimestamp(currentRow.createTime) }}</div>
            <div v-if="currentRow.url"><strong>COS地址：</strong>{{ currentRow.url }}</div>
            <div v-if="currentRow.remotionVideoUrl">
              <strong>Remotion地址：</strong>{{ currentRow.remotionVideoUrl }}
            </div>
            <div v-if="currentRow.errorMessage">
              <strong>失败信息：</strong>{{ currentRow.errorMessage }}
            </div>
          </div>
        </el-card>
        <el-card shadow="never">
          <template #header>输入参数</template>
          <div class="detail-json-panel">
            <pre>{{ formatJson(currentRow.inputProps) }}</pre>
          </div>
        </el-card>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Search } from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";
import { formatTimestamp } from "@/common/date";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import {
  deleteRemotionVideoRecord,
  batchDeleteRemotionVideoRecord,
  generateRemotionVideoRecord,
  getRemotionTemplateList,
  getRemotionVideoRecordDetail,
  getRemotionVideoRecordPage,
} from "@/api/remotion-video-record";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import { refreshServiceHealth, useServiceHealthState } from "@/services/serviceHealthState";

const { height } = useWindowSize();
const loading = ref(false);
const total = ref(0);
const dataSource = ref<any[]>([]);
const templateOptions = ref<any[]>([]);
const templateFilters = reactive({
  category: "",
  durationLabel: "",
});
const createVisible = ref(false);
const detailVisible = ref(false);
const submitLoading = ref(false);
const currentRow = ref<any>(null);
const remotionStatus = useServiceHealthState("remotion");
let processingPollTimer: ReturnType<typeof setTimeout> | null = null;

const remotionStatusLabel = computed(() => {
  if (remotionStatus.loading && !remotionStatus.checked) return "检测中";
  if (!remotionStatus.checked) return "未检测";
  return remotionStatus.available ? "可用" : "不可用";
});

const remotionStatusTagType = computed(() => {
  if (remotionStatus.loading && !remotionStatus.checked) return "warning";
  if (!remotionStatus.checked) return "info";
  return remotionStatus.available ? "success" : "danger";
});

const remotionStatusSummary = computed(() => {
  if (remotionStatus.loading && !remotionStatus.checked) return "检测中";
  if (!remotionStatus.checked) return "未检测";
  if (remotionStatus.available) {
    return remotionStatus.message || "服务可用";
  }
  return remotionStatus.message || "服务异常";
});

const remotionStatusDetail = computed(() => {
  const parts: string[] = [];
  if (remotionStatus.baseUrl) {
    parts.push(remotionStatus.baseUrl);
  }
  if (remotionStatus.timestamp) {
    parts.push(formatHealthTime(remotionStatus.timestamp));
  }
  return parts.join(" | ");
});

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  keyword: "",
  status: "",
});

const form = reactive({
  templateId: "",
  title: "",
  timeoutMs: 300000,
  inputProps: {} as Record<string, any>,
  // Raw JSON string editor for flexible, complex params
  inputPropsJson: "{}",
});

const selectedTemplate = computed(
  () => templateOptions.value.find((item) => item.id === form.templateId) || null,
);
const templateCategoryOptions = computed(() =>
  Array.from(
    new Set(
      templateOptions.value.map((item) => String(item?.category || "").trim()).filter(Boolean),
    ),
  ),
);
const templateDurationOptions = computed(() =>
  Array.from(
    new Set(
      templateOptions.value.map((item) => String(item?.durationLabel || "").trim()).filter(Boolean),
    ),
  ),
);
const filteredTemplateOptions = computed(() =>
  templateOptions.value.filter((item) => {
    if (templateFilters.category && item.category !== templateFilters.category) {
      return false;
    }
    if (templateFilters.durationLabel && item.durationLabel !== templateFilters.durationLabel) {
      return false;
    }
    return true;
  }),
);
const templateOverviewStats = computed(() => [
  { label: "模板总数", value: templateOptions.value.length },
  { label: "当前结果", value: filteredTemplateOptions.value.length },
  { label: "内容分类", value: templateCategoryOptions.value.length },
]);
const selectedTemplateDebugMeta = computed(() => {
  if (!selectedTemplate.value) return null;
  return {
    id: selectedTemplate.value.id,
    compositionId: selectedTemplate.value.compositionId,
    category: selectedTemplate.value.category,
    style: selectedTemplate.value.style,
    durationLabel: selectedTemplate.value.durationLabel,
    resolution: `${selectedTemplate.value.width} x ${selectedTemplate.value.height}`,
    fps: selectedTemplate.value.fps,
    durationInFrames: selectedTemplate.value.durationInFrames,
    editableFields: selectedTemplate.value.editableFields,
    assetSummary: selectedTemplate.value.assetSummary,
    tags: selectedTemplate.value.tags,
  };
});
const canSubmitGenerate = computed(
  () => !!form.templateId && (!remotionStatus.checked || remotionStatus.available),
);
const submitDisabledText = computed(() => {
  if (!form.templateId) return "请先选择模板";
  if (remotionStatus.checked && !remotionStatus.available) return "Remotion 服务不可用";
  return "";
});

const gridOptions = computed(() => ({
  ...commonGridOptions,
  maxHeight: Math.max(height.value - 250, 420),
  rowConfig: { keyField: "id" },
  columns: [
    { type: "checkbox", width: 50 },
    { title: "视频", field: "url", minWidth: 200, slots: { default: "videoSlot" } },
    { title: "标题", field: "title", minWidth: 260, slots: { default: "titleSlot" } },
    { title: "模板", field: "templateName", minWidth: 220, slots: { default: "templateSlot" } },
    { title: "状态", field: "status", width: 120, slots: { default: "statusSlot" } },
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

function handleKeywordChange(val: string) {
  if (!val) getList();
}

// 多选状态
const selectedRows = ref<any[]>([]);

// 多选change事件
function handleCheckboxChange({ records }: any) {
  selectedRows.value = records || [];
}

// 全选change事件
function handleCheckboxAll({ records }: any) {
  selectedRows.value = records || [];
}

// 批量删除
async function handleBatchDelete() {
  if (!selectedRows.value || selectedRows.value.length === 0) {
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
    const ids = selectedRows.value.map((r: any) => r.id);
    const res: any = await batchDeleteRemotionVideoRecord(ids);
    const payload = res?.data ?? res;
    if (payload && payload.failed && payload.failed.length) {
      ElMessage.warning(`部分删除失败：${payload.failed.length} 条`);
    } else {
      ElMessage.success(`成功删除 ${payload.successIds?.length || ids.length} 条记录`);
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

function getStatusLabel(status?: string) {
  const map: Record<string, string> = {
    pending: "待处理",
    processing: "处理中",
    success: "成功",
    failed: "失败",
  };
  return map[status || ""] || status || "-";
}

function getStatusTagType(status?: string) {
  if (status === "success") return "success";
  if (status === "failed") return "danger";
  if (status === "processing") return "warning";
  return "info";
}

function formatJson(value: any) {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return "{}";
  }
}

async function loadTemplates() {
  try {
    const result: any = await getRemotionTemplateList();
    templateOptions.value = Array.isArray(result) ? result : [];
  } catch (error: any) {
    templateOptions.value = [];
    ElMessage.error(getRemotionErrorMessage(error, "获取 Remotion 模板失败"));
  }
}

async function checkRemotionHealth() {
  await refreshServiceHealth("remotion");
}

function resetTemplateFilters() {
  templateFilters.category = "";
  templateFilters.durationLabel = "";
}

function resetForm() {
  resetTemplateFilters();
  form.templateId = "";
  form.title = "";
  form.timeoutMs = 300000;
  form.inputProps = {};
  form.inputPropsJson = "{}";
}

function stopProcessingPoll() {
  if (processingPollTimer) {
    clearTimeout(processingPollTimer);
    processingPollTimer = null;
  }
}

function scheduleProcessingPoll() {
  stopProcessingPoll();
  const hasPendingRecord = dataSource.value.some((item) =>
    ["pending", "processing"].includes(String(item?.status || "")),
  );
  if (!hasPendingRecord) {
    return;
  }
  processingPollTimer = setTimeout(() => {
    void getList();
  }, 5000);
}

function handleTemplateFilterChange() {
  if (!form.templateId) return;
  const stillVisible = filteredTemplateOptions.value.some((item) => item.id === form.templateId);
  if (!stillVisible) {
    form.templateId = "";
    form.inputProps = {};
    form.inputPropsJson = "{}";
  }
}

function handleTemplateChange() {
  form.inputProps = selectedTemplate.value?.defaultInputProps
    ? { ...selectedTemplate.value.defaultInputProps }
    : {};
  try {
    form.inputPropsJson = selectedTemplate.value?.defaultInputProps
      ? JSON.stringify(selectedTemplate.value.defaultInputProps, null, 2)
      : "{}";
  } catch {
    form.inputPropsJson = "{}";
  }
  if (!form.title) {
    form.title = selectedTemplate.value?.name || "";
  }
}

function openCreateDialog(row?: any) {
  createVisible.value = true;
  void Promise.allSettled([loadTemplates(), checkRemotionHealth()]);

  if (!row) {
    resetForm();
    return;
  }

  resetTemplateFilters();
  form.templateId = row.templateId || "";
  form.title = row.title || "";
  form.timeoutMs = 300000;
  form.inputProps = row.inputProps ? JSON.parse(JSON.stringify(row.inputProps)) : {};
  try {
    form.inputPropsJson = row.inputProps ? JSON.stringify(row.inputProps, null, 2) : "{}";
  } catch {
    form.inputPropsJson = "{}";
  }
}

async function submitGenerate() {
  if (!form.templateId) {
    ElMessage.warning("请先选择模板");
    return;
  }
  submitLoading.value = true;
  try {
    await checkRemotionHealth();
    if (remotionStatus.checked && !remotionStatus.available) {
      ElMessage.error("Remotion 服务不可用，请先恢复服务后再提交");
      return;
    }

    let inputPropsToSend: Record<string, any> = {};
    if (form.inputPropsJson && String(form.inputPropsJson).trim()) {
      try {
        inputPropsToSend = JSON.parse(form.inputPropsJson);
      } catch (e) {
        ElMessage.error("参数 JSON 格式不正确");
        submitLoading.value = false;
        return;
      }
    } else {
      inputPropsToSend = form.inputProps || {};
    }

    const result: any = await generateRemotionVideoRecord({
      templateId: form.templateId,
      title: form.title || undefined,
      timeoutMs: Number(form.timeoutMs || 300000),
      inputProps: inputPropsToSend,
    });

    if (result?.status === "failed") {
      ElMessage.error(result?.errorMessage || "视频制作任务提交失败");
      await getList();
      return;
    }

    ElMessage.success("已提交制作任务，正在后台生成");
    createVisible.value = false;
    await getList();
  } catch (error: any) {
    ElMessage.error(getRemotionErrorMessage(error, "视频生成失败"));
  } finally {
    submitLoading.value = false;
  }
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

function getRemotionErrorMessage(error: any, fallback: string) {
  const raw = String(error?.message || error || "").trim();
  const lower = raw.toLowerCase();

  if (!raw) return fallback;
  if (lower.includes("connection refused") || lower.includes("econnrefused")) {
    return "服务未启动";
  }
  if (lower.includes("network error")) {
    return "网络异常";
  }
  if (lower.includes("timeout")) {
    return "请求超时";
  }
  if (lower.includes("not found")) {
    return "接口不存在";
  }
  if (lower.includes("remotion")) {
    return "Remotion 服务异常";
  }
  return raw || fallback;
}

async function getList() {
  stopProcessingPoll();
  loading.value = true;
  try {
    const result: any = await getRemotionVideoRecordPage({ ...queryParams });
    dataSource.value = result?.list || result?.records || [];
    total.value = result?.total || 0;
  } catch (error: any) {
    dataSource.value = [];
    total.value = 0;
    ElMessage.error(error?.message || "获取视频生成记录失败");
  } finally {
    loading.value = false;
    scheduleProcessingPoll();
  }
}

async function openDetail(row: any) {
  const result: any = await getRemotionVideoRecordDetail(row.id);
  currentRow.value = result;
  detailVisible.value = true;
}

function previewVideo(row: any) {
  if (!row?.url) return;

  const el = document.getElementById(`thumb-${row.id}`) as HTMLVideoElement | null;
  if (!el) {
    // fallback: 在新标签打开
    window.open(row.url, "_blank");
    return;
  }

  try {
    // 在全屏前开启控件，尝试播放，然后进入全屏
    el.controls = true;
    const p = el.play();
    if (p && typeof p.then === "function") p.catch(() => {});

    // 隐藏覆盖层，避免覆盖原生控件
    try {
      const overlay = el.parentElement?.querySelector(".cell-play-overlay") as HTMLElement | null;
      if (overlay) overlay.style.display = "none";
    } catch {}

    // 标准全屏 API
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else {
      // iOS Safari 回退方法（非标准）
      const anyEl: any = el;
      if (anyEl.webkitEnterFullscreen) {
        try {
          anyEl.webkitEnterFullscreen();
        } catch {}
      } else {
        // 最后回退为在新标签打开
        window.open(row.url, "_blank");
      }
    }

    // 监听退出全屏，恢复覆盖层与控件状态
    const onFullChange = () => {
      try {
        if (document.fullscreenElement !== el) {
          el.controls = false;
          const overlay = el.parentElement?.querySelector(
            ".cell-play-overlay",
          ) as HTMLElement | null;
          if (overlay) overlay.style.display = "";
          document.removeEventListener("fullscreenchange", onFullChange);
        }
      } catch {}
    };
    document.addEventListener("fullscreenchange", onFullChange);

    // iOS 退出事件回退
    try {
      el.addEventListener(
        "webkitendfullscreen",
        () => {
          try {
            el.controls = false;
            const overlay = el.parentElement?.querySelector(
              ".cell-play-overlay",
            ) as HTMLElement | null;
            if (overlay) overlay.style.display = "";
          } catch {}
        },
        { once: true },
      );
    } catch {}
  } catch (err) {
    window.open(row.url, "_blank");
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除记录「${row.title || row.id}」吗？`, "删除确认", {
      type: "warning",
    });
    await deleteRemotionVideoRecord(row.id);
    ElMessage.success("删除成功");
    await getList();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "删除视频记录失败");
    }
  }
}

function handleOperationCommand(command: string, row: any) {
  if (command === "detail") {
    openDetail(row);
    return;
  }
  // 'regenerate' action removed
  if (command === "delete") {
    handleDelete(row);
  }
}

onMounted(async () => {
  resetForm();
  await Promise.allSettled([loadTemplates(), getList(), checkRemotionHealth()]);
});

onBeforeUnmount(() => {
  stopProcessingPoll();
});
</script>

<style scoped>
:deep(.remotion-record-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.remotion-record-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.remotion-record-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.remotion-record-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}

.remotion-record-page__status-bar {
  display: flex;
  width: 100%;
  min-height: 40px;
  align-items: flex-start;
  gap: 10px;
}

.remotion-record-page__status-content {
  display: flex;
  min-width: 0;
  flex: 1;
  max-width: 360px;
  flex-direction: column;
  gap: 2px;
}

.remotion-record-page__status-text {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 12px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remotion-record-page__status-detail {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-title-cell,
.record-template-cell,
.record-video-cell,
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.record-title-text,
.record-template-name,
.template-summary-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.record-title-sub,
.record-template-id,
.template-summary-desc,
.template-summary-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.template-info-panel,
.remotion-form-panel,
.remotion-preview-panel,
.detail-section,
.detail-json-panel {
  height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.remotion-create-layout {
  /* 调高弹窗高度以减少空白，调整为更高的可视占比 */
  height: calc(100vh - 80px);
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr) 360px;
  /* 使三列卡片均分并撑满可用高度，避免底部空白 */
  grid-template-rows: minmax(0, 1fr);
  gap: 16px;
}

:deep(.remotion-create-layout > .el-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.remotion-create-layout > .el-card .el-card__body) {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.remotion-preview-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.remotion-form-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.remotion-json-form {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  flex-direction: column;
}

.remotion-json-form__item {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 0;
  flex-direction: column;
}

:deep(.remotion-json-form__item .el-form-item__content) {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.remotion-json-editor {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

:deep(.remotion-json-editor .el-textarea) {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

:deep(.remotion-json-editor .el-textarea__inner) {
  height: 100%;
  min-height: 100% !important;
  line-height: 1.6;
}

.remotion-json-hint {
  margin-top: 12px;
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.remotion-preview-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 4px;
}

.remotion-create-actions {
  flex: 0 0 auto;
  margin-top: 0;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.remotion-submit-alert {
  margin-bottom: 12px;
}

.remotion-submit-pipeline {
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.6;
}

.remotion-submit-hint {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.remotion-create-banner {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 2px 0;
}

.remotion-create-banner__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.remotion-create-banner__desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.template-summary {
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  margin-top: 12px;
}

.template-library-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.template-overview-card {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.08), rgba(64, 158, 255, 0.02));
  border: 1px solid rgba(64, 158, 255, 0.16);
}

.template-overview-card__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.template-overview-card__value {
  font-size: 22px;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.template-select-option {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.template-select-option__name {
  flex: 1 1 auto;
  min-width: 0;
  color: var(--el-text-color-primary);
  line-height: 1.45;
  white-space: normal;
  word-break: break-word;
}

.template-select-option__meta {
  flex: 0 0 auto;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.45;
  white-space: nowrap;
}

.template-filter-summary {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.template-summary-meta {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.template-detail-block {
  margin-top: 12px;
}

.template-use-case {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.template-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.08);
  border: 1px solid rgba(64, 158, 255, 0.14);
  color: var(--el-color-primary);
  font-size: 12px;
  line-height: 1.4;
}

.template-meta-form {
  margin-top: 12px;
}
.template-asset-summary {
  margin-top: 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.confirm-meta {
  margin-bottom: 12px;
}

.detail-section > div {
  word-break: break-word;
  line-height: 1.6;
}

.template-input-schema {
  margin-top: 12px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(250, 250, 250, 0.02);
  border: 1px dashed var(--el-border-color-light);
}
.schema-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.schema-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.schema-field {
  font-size: 13px;
}
.schema-field-head {
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.schema-label {
  color: var(--el-text-color-primary);
}
.schema-key {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.schema-required {
  background: #ffecb5;
  color: #663c00;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}
.schema-desc {
  color: var(--el-text-color-secondary);
}
.schema-example code {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

/* 原始元数据展示适配 */
.template-meta-raw {
  margin-top: 8px;
}
.template-meta-raw pre {
  margin: 8px 0 0 0;
  max-height: 50vh;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  background: rgba(0, 0, 0, 0.03);
  padding: 10px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-light);
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.6;
}

.remotion-preview-panel pre,
.detail-json-panel pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.7;
}

.remotion-detail-layout {
  height: calc(100vh - 56px);
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(360px, 0.9fr);
  gap: 16px;
}

.remotion-detail-layout > .el-card,
.remotion-detail-side,
.remotion-detail-side > .el-card {
  min-height: 0;
}

.remotion-detail-layout > .el-card:first-child :deep(.el-card__body) {
  height: calc(100% - 56px);
}

.remotion-detail-side {
  display: grid;
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

.remotion-detail-layout > .el-card,
.remotion-detail-side > .el-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.remotion-detail-layout > .el-card .el-card__body),
:deep(.remotion-detail-side > .el-card .el-card__body) {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.remotion-video-preview {
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 12px;
}

.remotion-video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  background: #000;
}

.remotion-video-preview {
  aspect-ratio: 16 / 9;
  max-height: 100%;
}

.cell-video-player {
  width: 160px;
  height: 90px;
  object-fit: cover;
  border-radius: 6px;
  background: #000;
}

.cell-video-wrapper {
  position: relative;
  display: inline-block;
  width: 160px;
  height: 90px;
  overflow: hidden;
  border-radius: 6px;
}

.cell-play-overlay {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  z-index: 2;
}

.cell-play-icon {
  width: 0;
  height: 0;
  border-left: 10px solid #fff;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  margin-left: 2px;
}

.cell-video-wrapper:hover .cell-play-overlay {
  background: rgba(0, 0, 0, 0.65);
}

.cell-video-wrapper {
  cursor: pointer;
}

.remotion-detail-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

/* 使左右两栏在高度受限时可滚动，确保参数区域可见 */
.remotion-detail-grid > .el-card {
  max-height: calc(100vh - 420px);
  overflow: auto;
}

.detail-json-panel pre {
  max-height: none;
  overflow: auto;
}

:deep(.remotion-filter-select-dropdown.el-select__popper) {
  min-width: 240px !important;
}

:deep(.remotion-template-select-dropdown.el-select__popper) {
  min-width: 520px !important;
  max-width: min(720px, calc(100vw - 32px));
}

:deep(.remotion-template-select-dropdown .el-select-dropdown__item) {
  height: auto;
  min-height: 44px;
  padding-top: 8px;
  padding-bottom: 8px;
  line-height: 1.4;
}

:deep(.remotion-create-dialog .el-dialog__body),
:deep(.remotion-detail-dialog .el-dialog__body) {
  overflow: hidden;
  padding: 16px 20px 20px;
}

@media (max-width: 1280px) {
  .remotion-record-page__status-content {
    max-width: none;
  }

  .remotion-create-layout {
    grid-template-columns: 1fr;
    height: auto;
  }

  .remotion-detail-layout {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(360px, 50vh) minmax(0, 1fr);
  }
}

@media (max-width: 900px) {
  .remotion-record-page__status-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .remotion-record-page__status-content {
    max-width: none;
  }

  .cell-video-player,
  .cell-video-wrapper {
    width: 140px;
    height: 79px;
  }
}

@media (max-width: 768px) {
  .template-library-overview {
    grid-template-columns: 1fr;
  }

  :deep(.remotion-record-page .list-page-search-form__row) {
    row-gap: 0;
  }

  :deep(.remotion-record-page .list-page-search-form__actions) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    width: 100%;
  }

  :deep(.remotion-record-page .list-page-search-form__actions .el-button) {
    width: 100%;
    margin: 0;
  }

  .remotion-record-page__status-text,
  .remotion-record-page__status-detail {
    white-space: nowrap;
  }

  .remotion-create-layout {
    gap: 12px;
  }

  .remotion-preview-panel,
  .remotion-preview-scroll {
    overflow: visible;
  }

  :deep(.remotion-create-layout > .el-card),
  :deep(.remotion-detail-layout > .el-card),
  :deep(.remotion-detail-side > .el-card) {
    border-radius: 10px;
  }

  :deep(.remotion-create-dialog .el-dialog__body),
  :deep(.remotion-detail-dialog .el-dialog__body) {
    overflow: auto;
    padding: 12px;
  }

  .remotion-detail-layout {
    height: auto;
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    gap: 12px;
  }

  .remotion-detail-side {
    grid-template-rows: auto;
    gap: 12px;
  }

  .remotion-video-preview {
    min-height: 220px;
    padding: 8px;
  }

  .template-summary-meta {
    flex-direction: column;
    gap: 6px;
  }

  .template-meta-raw pre,
  .remotion-preview-panel pre,
  .detail-json-panel pre {
    font-size: 11px;
    line-height: 1.6;
  }

  :deep(.remotion-template-select-dropdown.el-select__popper) {
    min-width: min(520px, calc(100vw - 24px)) !important;
  }
}

@media (max-width: 480px) {
  :deep(.remotion-record-page .list-page-search-form__actions) {
    grid-template-columns: 1fr;
  }

  .remotion-record-page__status-bar {
    min-height: 0;
  }

  .cell-video-player,
  .cell-video-wrapper {
    width: 120px;
    height: 68px;
  }

  .record-title-main,
  .record-template-main {
    font-size: 13px;
  }

  .record-id,
  .record-template-id,
  .table-time-text {
    font-size: 11px;
  }

  .remotion-video-preview {
    min-height: 180px;
  }

  .template-summary,
  .template-input-schema {
    padding: 10px;
  }
}
</style>
