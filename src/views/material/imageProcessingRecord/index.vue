<template>
  <ContentWrap :plain="true">
    <!-- 顶部：处理预设库 -->
    <div class="image-processing-showcase">
      <div class="image-processing-showcase__header">
        <div class="image-processing-showcase__title-row">
          <h2 class="image-processing-showcase__title">处理预设库</h2>
          <el-tag
            :type="processingCount > 0 ? 'warning' : imagesStatus.available ? 'success' : 'info'"
            effect="light"
            size="small"
          >
            <span class="pulse-dot" :class="{ 'is-active': imagesStatus.available, 'is-processing': processingCount > 0 }"></span>
            {{ processingCount > 0 ? `正在处理中 (${processingCount} 个)` : imagesStatus.available ? "客户端引擎已连线" : "内置引擎就绪" }}
          </el-tag>
        </div>

        <el-button type="primary" size="small" :icon="Plus" @click="openCreateDialog">
          新建任务
        </el-button>
      </div>

      <div class="image-processing-showcase__tabs-bar">
        <el-radio-group v-model="activeShowcaseCategory" size="small">
          <el-radio-button label="all">全部 ({{ unifiedShowcaseItems.length }})</el-radio-button>
          <el-radio-button label="basic">基础编辑</el-radio-button>
          <el-radio-button label="effect">艺术效果</el-radio-button>
          <el-radio-button label="filter">风格滤镜</el-radio-button>
          <el-radio-button label="variation">裂变预设</el-radio-button>
        </el-radio-group>

        <el-input
          v-model="showcaseKeyword"
          size="small"
          clearable
          placeholder="搜索处理方式"
          class="showcase-search-input"
          :prefix-icon="Search"
        />
      </div>

      <div v-if="filteredUnifiedShowcaseItems.length" class="showcase-grid">
        <div
          v-for="item in filteredUnifiedShowcaseItems"
          :key="item.key"
          class="showcase-card"
          :class="{ 'showcase-card--variation': item.kind === 'variation' }"
          @click="handleShowcaseItemClick(item)"
        >
          <div class="showcase-card__header">
            <div
              class="showcase-card__icon-box"
              :class="{ 'showcase-card__icon-box--var': item.kind === 'variation' }"
            >
              <el-icon><PictureFilled v-if="item.kind === 'variation'" /><Operation v-else /></el-icon>
            </div>
            <div class="showcase-card__title-wrap">
              <div class="showcase-card__title">{{ item.title }}</div>
              <div class="showcase-card__code">{{ item.subtitle }}</div>
            </div>
            <el-tag
              size="small"
              :type="item.kind === 'variation' ? 'success' : 'info'"
              effect="plain"
            >
              {{ item.categoryLabel }}
            </el-tag>
          </div>
        </div>
      </div>

      <div v-else class="showcase-empty">
        <span>未找到匹配方式</span>
      </div>
    </div>

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
                    <el-option label="等待客户端" value="pending_client" />
                    <el-option label="已派发" value="assigned" />
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
                @click="handleBatchDelete"
              >
                批量删除({{ selectedRows.length }})
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
                        v-if="getSourcePreview(row) && !imageLoadErrorMap[row.id]"
                        :src="getSourcePreview(row)"
                        :alt="row.sourceFilename || row.title || '原图'"
                        @error="handleImageError(row.id)"
                      />
                      <span v-else class="image-record-thumb__placeholder">
                        {{ imageLoadErrorMap[row.id] ? "原图失效" : "无预览" }}
                      </span>
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
                        v-if="getFirstResultUrl(row) && !imageLoadErrorMap['res_' + row.id]"
                        :src="getFirstResultUrl(row)"
                        :alt="row.title || '结果图'"
                        @error="handleImageError('res_' + row.id)"
                      />
                      <span v-else class="image-record-thumb__placeholder">
                        {{ imageLoadErrorMap['res_' + row.id] ? "加载失败" : "无结果" }}
                      </span>
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
        <el-card shadow="never" class="image-processing-panel-card image-processing-create-workspace">
          <div class="image-processing-linear-flow">
            <CreateTaskSourceStage
              :form="form"
              :create-source-preview="createSourcePreview"
              :has-source-context="hasSourceContext"
            />

            <CreateTaskProcessStage
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

            <CreateTaskSubmitStage
              :form-task-type="form.taskType"
              :current-operations="currentOperations"
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
                  @click="file.url && previewImage(file.url, detailResultFiles.map((f: any) => f.url).filter(Boolean))"
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
                      @click="previewImage(file.url, detailResultFiles.map((f: any) => f.url).filter(Boolean))"
                    >
                      预览图片
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
import { Delete, Plus, Search } from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";
import { formatTimestamp } from "@/common/date";
import { createImageViewer } from "@/components/ImageViewer";
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

const processingCount = computed(() => {
  const now = Date.now();
  return dataSource.value.filter((item) => {
    if (
      item.status !== "processing" &&
      item.status !== "pending" &&
      item.status !== "assigned" &&
      item.status !== "pending_client"
    ) {
      return false;
    }
    const createdAt = new Date(item.createTime || item.createdAt || 0).getTime();
    if (createdAt && now - createdAt > 2 * 60 * 1000) {
      return false;
    }
    return true;
  }).length;
});

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  keyword: "",
  status: "",
  taskType: "",
});

const form = reactive<Record<string, any>>({
  title: "",
  taskType: "process",
  imageUrl: "",
  operationsJson: EMPTY_OPERATIONS_JSON,
  processorId: "imagemagick",
  sourceModule: "",
  sourceRecordId: "",
  sourceName: "",
  sourceImageOwned: true,
});

const DEFAULT_FALLBACK_OPERATIONS = [
  { type: "resize", apiType: "resize", category: "basic", description: "调整图像尺寸与宽高比", params: { width: { type: "number", description: "目标宽度 (px)", required: true }, height: { type: "number", description: "目标高度 (px)", required: true }, maintainAspectRatio: { type: "boolean", description: "保持原宽高比", default: true } }, requiredParams: ["width", "height"] },
  { type: "crop", apiType: "crop", category: "basic", description: "按指定坐标和大小裁剪图像", params: { x: { type: "number", description: "起点 X 坐标 (px)" }, y: { type: "number", description: "起点 Y 坐标 (px)" }, width: { type: "number", description: "裁剪宽度 (px)", required: true }, height: { type: "number", description: "裁剪高度 (px)", required: true } }, requiredParams: ["width", "height"] },
  { type: "shapeCrop", apiType: "shapeCrop", category: "basic", description: "圆形 / 椭圆 / 多边形形状裁剪", params: { shape: { type: "string", description: "形状 (circle/ellipse/polygon)", default: "circle" }, width: { type: "number", description: "宽度 (px)", default: 200 }, height: { type: "number", description: "高度 (px)", default: 200 } }, requiredParams: [] },
  { type: "rotate", apiType: "rotate", category: "basic", description: "旋转图像指定角度", params: { degrees: { type: "number", description: "旋转角度 (度)", default: 90 }, backgroundColor: { type: "string", description: "空白填充颜色", default: "#000000" } }, requiredParams: ["degrees"] },
  { type: "convert", apiType: "convert", category: "basic", description: "转换图像文件格式 (JPG/PNG/WEBP/GIF)", params: { format: { type: "string", description: "目标格式 (jpg/png/webp/gif)", default: "jpg" }, quality: { type: "number", description: "压缩质量 (1-100)", default: 90 } }, requiredParams: ["format"] },
  { type: "watermark", apiType: "watermark", category: "basic", description: "添加文字或图片水印", params: { type: { type: "string", description: "水印类型 (text/image)", default: "text" }, text: { type: "string", description: "文字内容", default: "衣设 Yishe" }, fontSize: { type: "number", description: "字号大小 (px)", default: 24 }, color: { type: "string", description: "文字颜色", default: "#FFFFFF" }, position: { type: "string", description: "位置 (top-left/center/bottom-right 等)", default: "bottom-right" } }, requiredParams: [] },
  { type: "adjust", apiType: "adjust", category: "basic", description: "基础图像调整（亮度/对比度/饱和度）", params: { brightness: { type: "number", description: "亮度 (-100 到 100)", default: 0 }, contrast: { type: "number", description: "对比度 (-100 到 100)", default: 0 }, saturation: { type: "number", description: "饱和度 (-100 到 100)", default: 0 } }, requiredParams: [] },
  { type: "lowpoly", apiType: "effects-lowpoly", category: "effect", description: "晶格低多边形 Lowpoly 艺术效果", params: { pointCount: { type: "number", description: "采样点数量", default: 900 }, edgeBias: { type: "number", description: "边缘权重", default: 0.65 } }, requiredParams: [] },
  { type: "blur", apiType: "effects-blur", category: "effect", description: "高斯模糊效果", params: { radius: { type: "number", description: "模糊半径", default: 5 }, sigma: { type: "number", description: "模糊 Sigma", default: 5 } }, requiredParams: [] },
  { type: "sharpen", apiType: "effects-sharpen", category: "effect", description: "图像锐化清晰增强", params: { radius: { type: "number", description: "锐化半径", default: 1 }, amount: { type: "number", description: "锐化程度", default: 1 } }, requiredParams: [] },
  { type: "grayscale", apiType: "effects-grayscale", category: "effect", description: "黑白灰度效果", params: { intensity: { type: "number", description: "强度", default: 100 } }, requiredParams: [] },
  { type: "sepia", apiType: "effects-sepia", category: "effect", description: "复古暖调棕褐色", params: { intensity: { type: "number", description: "强度", default: 80 } }, requiredParams: [] },
  { type: "charcoal", apiType: "effects-charcoal", category: "effect", description: "木炭素描画效果", params: { radius: { type: "number", description: "素描半径", default: 1 } }, requiredParams: [] },
  { type: "oil-painting", apiType: "effects-oil-painting", category: "effect", description: "油画艺术画笔效果", params: { radius: { type: "number", description: "笔触大小", default: 3 } }, requiredParams: [] },
  { type: "pixelate", apiType: "effects-pixelate", category: "effect", description: "像素马赛克效果", params: { size: { type: "number", description: "像素块大小", default: 10 } }, requiredParams: [] },
  { type: "vignette", apiType: "effects-vignette", category: "effect", description: "四周暗角效果", params: { radius: { type: "number", description: "晕影半径", default: 100 } }, requiredParams: [] },
  { type: "filter-grayscale", apiType: "filter-grayscale", category: "filter", description: "黑白灰度滤镜", params: { intensity: { type: "number", description: "滤镜强度 (0-1)", default: 1 } }, requiredParams: [] },
  { type: "filter-sepia", apiType: "filter-sepia", category: "filter", description: "复古老照片滤镜", params: { intensity: { type: "number", description: "滤镜强度 (0-1)", default: 1 } }, requiredParams: [] },
  { type: "filter-invert", apiType: "filter-invert", category: "filter", description: "底片反色滤镜", params: { intensity: { type: "number", description: "滤镜强度 (0-1)", default: 1 } }, requiredParams: [] },
  { type: "filter-blur", apiType: "filter-blur", category: "filter", description: "柔和模糊滤镜", params: { intensity: { type: "number", description: "滤镜强度 (0-1)", default: 1 } }, requiredParams: [] },
];

const DEFAULT_FALLBACK_VARIATIONS = [
  { id: "square_hd", name: "正方形高清图 (1080x1080)", description: "输出 1080x1080 标准电商商品展示主图", operations: [{ type: "resize", params: { width: 1080, height: 1080, maintainAspectRatio: true } }] },
  { id: "portrait_mobile", name: "竖屏手机海报 (1080x1920)", description: "输出 9:16 竖屏手机端海报规格", operations: [{ type: "resize", params: { width: 1080, height: 1920, maintainAspectRatio: true } }] },
  { id: "vintage_bw", name: "复古黑白风", description: "转换为高对比度复古黑白老照片效果", operations: [{ type: "effects", params: { effectType: "grayscale" } }] },
  { id: "sepia_warm", name: "暖调棕褐怀旧", description: "添加经典暖色调 Sepia 怀旧风格滤镜", operations: [{ type: "effects", params: { effectType: "sepia", intensity: 80 } }] },
  { id: "art_lowpoly", name: "晶格低多边形艺术风", description: "将图片转换为现代 Lowpoly 几何晶格艺术图形", operations: [{ type: "effects", params: { effectType: "lowpoly", pointCount: 900, edgeBias: 0.65 } }] },
  { id: "watermark_brand", name: "品牌保护水印图", description: "在右下角自动添加品牌文字水印", operations: [{ type: "watermark", params: { type: "text", text: "衣设 Yishe", position: "bottom-right", fontSize: 24, color: "#FFFFFF" } }] },
  { id: "web_optimized_png", name: "Web 优化无损 PNG", description: "转换为 PNG 高清格式并优化质量", operations: [{ type: "convert", params: { format: "png", quality: 95 } }] },
  { id: "circle_avatar", name: "圆形头像标贴", description: "裁剪为透明背景圆形贴图", operations: [{ type: "shapeCrop", params: { shape: "circle", width: 400, height: 400 } }] },
];

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
const ACTIVE_RECORD_STATUSES = new Set(["pending", "pending_client", "assigned", "processing"]);

const activeShowcaseCategory = ref("all");
const showcaseKeyword = ref("");

function getCategoryLabel(cat?: string): string {
  return categoryLabelMap[cat || ""] || categoryLabelMap.default || "常用操作";
}

const unifiedShowcaseItems = computed(() => {
  const opList = (operations.value.length ? operations.value : DEFAULT_FALLBACK_OPERATIONS).map((op: any) => ({
    key: `op-${op.apiType || op.type}`,
    kind: "operation",
    title: op.description || op.type,
    subtitle: op.apiType || op.type,
    category: op.category || "basic",
    categoryLabel: getCategoryLabel(op.category),
    raw: op,
  }));

  const varList = (variations.value.length ? variations.value : DEFAULT_FALLBACK_VARIATIONS).map((v: any) => ({
    key: `var-${v.id || v.name}`,
    kind: "variation",
    title: v.name || v.id,
    subtitle: v.description || "自动生成多组衍生结果",
    category: "variation",
    categoryLabel: "多图裂变",
    raw: v,
  }));

  return [...opList, ...varList];
});

const filteredUnifiedShowcaseItems = computed(() => {
  const cat = activeShowcaseCategory.value;
  const kw = showcaseKeyword.value.trim().toLowerCase();

  return unifiedShowcaseItems.value.filter((item) => {
    if (cat !== "all" && item.category !== cat) {
      return false;
    }
    if (kw) {
      const text = `${item.title} ${item.subtitle} ${item.categoryLabel}`.toLowerCase();
      return text.includes(kw);
    }
    return true;
  });
});

const testGenerateLoading = ref(false);

async function generateTestRecords() {
  testGenerateLoading.value = true;
  try {
    const testCases = [
      {
        title: "测试任务 - 1080x1080正方形+文字水印",
        taskType: "process",
        imageUrl: "https://picsum.photos/id/1025/1200/800.jpg",
        processorId: "imagemagick",
        operationsJson: JSON.stringify([
          { type: "resize", params: { width: 1080, height: 1080, maintainAspectRatio: true } },
          { type: "watermark", params: { type: "text", text: "衣设 Yishe AI", position: "bottom-right", fontSize: 28, color: "#FFFFFF" } }
        ], null, 2),
      },
      {
        title: "测试任务 - 晶格 Lowpoly 艺术效果+锐化",
        taskType: "process",
        imageUrl: "https://picsum.photos/id/1069/1000/1000.jpg",
        processorId: "imagemagick",
        operationsJson: JSON.stringify([
          { type: "lowpoly", params: { pointCount: 900, edgeBias: 0.65 } },
          { type: "sharpen", params: { radius: 1, amount: 1 } }
        ], null, 2),
      },
      {
        title: "测试任务 - 复古怀旧滤镜+无损PNG转换",
        taskType: "process",
        imageUrl: "https://picsum.photos/id/1062/1200/800.jpg",
        processorId: "imagemagick",
        operationsJson: JSON.stringify([
          { type: "sepia", params: { intensity: 80 } },
          { type: "convert", params: { format: "png", quality: 95 } }
        ], null, 2),
      },
    ];

    for (const item of testCases) {
      await createImageProcessingRecord(item);
    }
    ElMessage.success("已发起 3 条测试任务，请观察下方记录列表！");
    await getList();
  } catch (error: any) {
    ElMessage.error(error?.message || "生成测试记录失败");
  } finally {
    testGenerateLoading.value = false;
  }
}

function handleShowcaseItemClick(item: any) {
  if (item.kind === "operation") {
    quickStartOperation(item.raw);
  } else {
    quickStartVariation(item.raw);
  }
}

function quickStartOperation(op: any) {
  openCreateDialog();
  form.taskType = "process";
  if (op) {
    activeCatalogOperationKey.value = getOperationIdentity(op);
    appendCatalogOperation(op);
  }
}

function quickStartVariation(_v?: any) {
  openCreateDialog();
  form.taskType = "variations";
}

let recordRefreshTimer: ReturnType<typeof setTimeout> | null = null;
let processingPollTimer: ReturnType<typeof setTimeout> | null = null;
const pendingRecordRefreshIds = new Set<string>();
let pendingListRefresh = false;

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
  return !currentOperationsParseError.value && currentOperations.value.length > 0;
});

const detailResultFiles = computed(() => {
  return Array.isArray(currentRow.value?.resultFiles) ? currentRow.value.resultFiles : [];
});

const requestPreviewJson = computed(() => {
  return formatJson(buildCreateRequestPreview());
});

const createSubmitHint = computed(() => {
  if (imagesStatus.checked && !imagesStatus.available) {
    return String(imagesStatus.message || "").trim() || "图片处理服务当前不可用，请稍后再试。";
  }
  if (!/^https?:\/\//i.test(String(form.imageUrl || "").trim())) {
    return "请先选择或输入有效的源图地址。";
  }
  if (currentOperationsParseError.value) {
    return currentOperationsParseError.value;
  }
  if (!currentOperations.value.length) {
    return "请先加入至少一个处理步骤。";
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
    pending_client: "等待客户端",
    assigned: "已派发",
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
  if (status === "pending_client" || status === "assigned") return "primary";
  if (status === "partial" || status === "processing") return "warning";
  if (status === "failed") return "danger";
  return "info";
}

function isActiveRecordStatus(status?: string) {
  return ACTIVE_RECORD_STATUSES.has(String(status || ""));
}

function hasConnectedRealtimeChannel() {
  return websocketClient.state.status === "connected";
}

function mergeRecordRow(nextRow: any) {
  if (!nextRow?.id) {
    return;
  }

  const targetRow = dataSource.value.find((item) => item.id === nextRow.id);
  if (targetRow) {
    Object.assign(targetRow, nextRow);
  }

  if (currentRow.value?.id === nextRow.id) {
    currentRow.value = {
      ...currentRow.value,
      ...nextRow,
    };
  }
}

function stopProcessingPoll() {
  if (processingPollTimer) {
    clearTimeout(processingPollTimer);
    processingPollTimer = null;
  }
}

function scheduleProcessingPoll() {
  stopProcessingPoll();

  if (hasConnectedRealtimeChannel()) {
    return;
  }

  const hasPendingRecord = dataSource.value.some((item) => isActiveRecordStatus(item?.status));
  if (!hasPendingRecord) {
    return;
  }

  processingPollTimer = setTimeout(() => {
    void refreshActiveRows();
  }, 3000);
}

async function refreshRecordRows(recordIds: string[]) {
  const uniqueIds = Array.from(
    new Set(recordIds.map((item) => String(item || "").trim()).filter(Boolean)),
  );
  if (!uniqueIds.length) {
    return false;
  }

  let shouldReloadList = false;
  const resultList = await Promise.allSettled(
    uniqueIds.map((recordId) => getImageProcessingRecordDetail(recordId)),
  );

  resultList.forEach((result, index) => {
    const recordId = uniqueIds[index];
    const isVisibleRow = dataSource.value.some((item) => item.id === recordId);
    const isCurrentDetail = currentRow.value?.id === recordId && detailVisible.value;

    if (result.status !== "fulfilled") {
      if (isVisibleRow || isCurrentDetail) {
        shouldReloadList = true;
      }
      return;
    }

    const nextRow = result.value;
    const nextStatus = String(nextRow?.status || "").trim();
    if (queryParams.status && nextStatus && queryParams.status !== nextStatus) {
      shouldReloadList = true;
      return;
    }

    if (isVisibleRow || isCurrentDetail) {
      mergeRecordRow(nextRow);
    }
  });

  if (shouldReloadList) {
    await getList();
    return true;
  }

  return false;
}

async function refreshActiveRows() {
  stopProcessingPoll();

  const activeIds = dataSource.value
    .filter((item) => isActiveRecordStatus(item?.status))
    .map((item) => String(item?.id || ""))
    .filter(Boolean);

  if (!activeIds.length) {
    return;
  }

  try {
    const reloaded = await refreshRecordRows(activeIds);
    if (!reloaded) {
      scheduleProcessingPoll();
    }
  } catch {
    scheduleProcessingPoll();
  }
}

const imageLoadErrorMap = ref<Record<string, boolean>>({});

function handleImageError(id: string | number) {
  if (id) {
    imageLoadErrorMap.value[String(id)] = true;
  }
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

function previewImage(url?: string, list?: string[]) {
  const normalized = String(url || "").trim();
  if (!normalized) return;
  const urlList = (list && list.length ? list : [normalized]).filter(Boolean);
  const initialIndex = Math.max(0, urlList.indexOf(normalized));
  createImageViewer({
    urlList,
    initialIndex,
  });
}

function openUrl(url?: string) {
  const normalized = String(url || "").trim();
  if (!normalized) return;
  previewImage(normalized);
}

function openRowSource(row: any) {
  previewImage(getSourcePreview(row));
}

function openFirstResult(row: any) {
  const files = Array.isArray(row?.resultFiles) ? row.resultFiles : [];
  const validUrls = files.map((item: any) => item?.url).filter(Boolean);
  previewImage(getFirstResultUrl(row), validUrls);
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
  if (Array.isArray(prefill.operations) && prefill.operations.length) {
    replaceOperationsJson(prefill.operations);
  } else {
    syncDefaultOperationsJson();
  }
  if (prefill.operationKeyword) {
    operationKeyword.value = prefill.operationKeyword;
  }

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
    operations.value =
      Array.isArray(result?.operations) && result.operations.length > 0
        ? result.operations
        : DEFAULT_FALLBACK_OPERATIONS;
    variations.value =
      Array.isArray(result?.variations) && result.variations.length > 0
        ? result.variations
        : DEFAULT_FALLBACK_VARIATIONS;
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
    operations.value = DEFAULT_FALLBACK_OPERATIONS;
    variations.value = DEFAULT_FALLBACK_VARIATIONS;
    console.warn("获取图片服务元数据警告，使用本地内置处理方式目录:", error);
  } finally {
    metaLoading.value = false;
  }
}

async function getList() {
  stopProcessingPoll();
  loading.value = true;
  selectedRows.value = [];
  try {
    const result: any = await getImageProcessingRecordPage({ ...queryParams });
    dataSource.value = result?.list || result?.records || [];
    total.value = result?.total || 0;
    console.log("📥 [ImageProcessingRecord] 成功获取到的记录列表条数:", dataSource.value.length, dataSource.value);
  } catch (error: any) {
    dataSource.value = [];
    total.value = 0;
    ElMessage.error(error?.message || "获取图片处理记录失败");
  } finally {
    loading.value = false;
    scheduleProcessingPoll();
  }
}

function scheduleRecordRefresh(
  event?: ImageProcessingRecordChangedEvent & { forceListRefresh?: boolean },
) {
  if (event?.recordId) {
    pendingRecordRefreshIds.add(String(event.recordId));
  }

  if (event?.forceListRefresh) {
    pendingListRefresh = true;
  }

  if (recordRefreshTimer) {
    clearTimeout(recordRefreshTimer);
  }

  recordRefreshTimer = setTimeout(async () => {
    recordRefreshTimer = null;
    const recordIds = Array.from(pendingRecordRefreshIds);
    pendingRecordRefreshIds.clear();
    const shouldRefreshList = pendingListRefresh;
    pendingListRefresh = false;

    if (shouldRefreshList) {
      await getList();
      return;
    }

    const reloaded = await refreshRecordRows(recordIds);
    if (!reloaded) {
      scheduleProcessingPoll();
    }
  }, 280);
}

function handleImageProcessingRecordChanged(event: ImageProcessingRecordChangedEvent) {
  const recordId = String(event?.recordId || "").trim();
  if (!recordId) {
    return;
  }

  const isVisibleRow = dataSource.value.some((item) => item.id === recordId);
  const isCurrentDetail = currentRow.value?.id === recordId && detailVisible.value;
  if (!isVisibleRow && !isCurrentDetail) {
    const canRefreshListForNewIncomingRow =
      Number(queryParams.currentPage || 1) === 1 &&
      !String(queryParams.keyword || "").trim() &&
      (!queryParams.status || queryParams.status === String(event?.status || "").trim()) &&
      (!queryParams.taskType || queryParams.taskType === String(event?.taskType || "").trim());

    if (canRefreshListForNewIncomingRow) {
      scheduleRecordRefresh({
        ...event,
        recordId,
        forceListRefresh: true,
      });
    }
    return;
  }

  scheduleRecordRefresh({
    ...event,
    recordId,
  });
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
      ElMessage.error(
        String(imagesStatus.message || "").trim() || "图片处理当前不可执行，请先恢复后再提交",
      );
      return;
    }

    const payload: Record<string, string> = {
      taskType: form.taskType,
      imageUrl: String(form.imageUrl || "").trim(),
    };
    if (String(form.title || "").trim()) {
      payload.title = String(form.title).trim();
    }
    if (String(form.sourceModule || "").trim()) {
      payload.sourceModule = String(form.sourceModule).trim();
    }
    if (String(form.sourceRecordId || "").trim()) {
      payload.sourceRecordId = String(form.sourceRecordId).trim();
    }
    if (String(form.sourceName || "").trim()) {
      payload.sourceName = String(form.sourceName).trim();
    }
    if (String(form.processorId || "").trim()) {
      payload.processorId = String(form.processorId).trim();
    }
    if (form.taskType === "process") {
      payload.operationsJson = form.operationsJson;
    }

    const result: any = await createImageProcessingRecord(payload);
    createVisible.value = false;
    await getList();

    if (
      result?.status === "pending_client" ||
      result?.status === "assigned" ||
      result?.status === "pending" ||
      result?.status === "processing"
    ) {
      ElMessage.success(
        result?.status === "pending_client"
          ? "任务已提交，等待客户端接单"
          : "任务已提交，正在后台处理中",
      );
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

watch(
  () => websocketClient.state.status,
  () => {
    if (hasConnectedRealtimeChannel()) {
      stopProcessingPoll();
      return;
    }
    scheduleProcessingPoll();
  },
);

onMounted(async () => {
  websocketClient.events.on("imageProcessingRecordChanged", handleImageProcessingRecordChanged);
  (window as any).runSampleImageProcessingTests = async () => {
    const { triggerSampleImageProcessingTests } = await import("@/api/image-processing-record/sdk");
    await triggerSampleImageProcessingTests();
    await getList();
  };
  await Promise.allSettled([loadMeta(), getList(), refreshServiceHealth("images")]);
});

onBeforeUnmount(() => {
  websocketClient.events.off("imageProcessingRecordChanged", handleImageProcessingRecordChanged);
  if (recordRefreshTimer) {
    clearTimeout(recordRefreshTimer);
    recordRefreshTimer = null;
  }
  stopProcessingPoll();
  pendingRecordRefreshIds.clear();
  pendingListRefresh = false;
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
  padding: 12px 16px;
  overflow: hidden;
}

:deep(.image-processing-detail-dialog .el-dialog__body) {
  height: calc(100vh - 70px);
  padding: 12px 16px;
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
  padding-right: 14px;
  padding-bottom: 8px;
}

.image-processing-linear-flow::-webkit-scrollbar {
  width: 6px;
}

.image-processing-linear-flow::-webkit-scrollbar-thumb {
  background: var(--el-border-color-dark, #c0c4cc);
  border-radius: 4px;
}

.image-processing-linear-flow::-webkit-scrollbar-track {
  background: transparent;
}

.image-processing-panel-card {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
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

.image-processing-unified-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-radius: 12px;
  background: var(--el-fill-color-light);
  margin-bottom: 12px;
}

.dialog-mode-pill-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
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

.image-processing-showcase {
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color-page);
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-processing-showcase__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.image-processing-showcase__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.image-processing-showcase__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.image-processing-showcase__tabs-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  border-top: 1px dashed var(--el-border-color-lighter);
  padding-top: 10px;
}

.showcase-search-input {
  width: 280px;
}

.showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 10px;
  padding: 4px 2px;
  overflow: visible;
}

.showcase-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-bg-color);
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    .showcase-card__hint {
      color: var(--el-color-primary);
    }
  }
}

.showcase-card__header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.showcase-card__icon-box {
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 16px;
  flex-shrink: 0;

  &--var {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
  }
}

.showcase-card__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.showcase-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  word-break: break-word;
}

.showcase-card__code {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  word-break: break-word;
}

.showcase-card__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.showcase-card__hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  transition: color 0.2s ease;
}

.pulse-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-info);
  margin-right: 6px;
  vertical-align: middle;

  &.is-active {
    background: var(--el-color-success);
    box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
  }

  &.is-processing {
    background: var(--el-color-warning);
    animation: pulse-breathing 1.2s infinite ease-in-out;
  }
}

@keyframes pulse-breathing {
  0% {
    transform: scale(0.9);
    box-shadow: 0 0 0 0 rgba(230, 162, 60, 0.6);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 5px rgba(230, 162, 60, 0);
  }
  100% {
    transform: scale(0.9);
    box-shadow: 0 0 0 0 rgba(230, 162, 60, 0);
  }
}
</style>
