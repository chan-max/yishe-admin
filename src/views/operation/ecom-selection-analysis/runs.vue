<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ecom-data-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="resource-toolbar">
            <div class="resource-toolbar__meta">
              <div class="resource-toolbar__title">电商分析结果</div>
              <div class="resource-toolbar__desc">
                查看每次分析使用了哪些数据、采用了什么方法、提示词是什么，以及最终输出结果；热门选品结果还能继续进入“找同款”。
              </div>
            </div>
            <div class="resource-toolbar__actions">
              <el-button size="small" @click="loadData">刷新</el-button>
            </div>
          </div>

          <el-form :model="filters" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col :xs="24" :sm="12" :md="8" :lg="8">
                <el-form-item label="分析任务">
                  <el-select v-model="filters.taskId" clearable filterable placeholder="全部任务">
                    <el-option
                      v-for="item in taskOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="运行状态">
                  <el-select v-model="filters.status" clearable placeholder="全部状态">
                    <el-option label="运行中" value="running" />
                    <el-option label="成功" value="success" />
                    <el-option label="失败" value="failed" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="分析类型">
                  <el-select v-model="filters.analysisType" clearable placeholder="全部类型">
                    <el-option label="热门选品" value="hot_selling_selection" />
                    <el-option label="POD 图案分析" value="pod_pattern_analysis" />
                    <el-option label="自定义提示词分析" value="custom_prompt_extract" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" @click="handleSearch">查询</el-button>
              <el-button size="small" @click="handleReset">重置</el-button>
              <el-button
                size="small"
                type="danger"
                :disabled="!selectedIds.length"
                @click="handleBatchDelete"
              >
                批量删除 ({{ selectedIds.length }})
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
                :data="tableData"
                :loading="loading"
                @checkbox-change="handleCheckboxChange"
                @checkbox-all="handleCheckboxAll"
              >
                <template #typeSlot="{ row }">
                  <el-tag size="small" type="info">
                    {{ getAnalysisTypeLabel(row.analysisType) }}
                  </el-tag>
                </template>

                <template #statusSlot="{ row }">
                  <el-tag size="small" :type="getRunStatusTagType(row.status)">
                    {{ getRunStatusLabel(row.status) }}
                  </el-tag>
                </template>

                <template #summarySlot="{ row }">
                  <span class="table-meta-text">{{ getOverviewText(row) }}</span>
                </template>

                <template #operationSlot="{ row }">
                  <div class="flex justify-start">
                    <el-dropdown
                      class="operation-dropdown"
                      placement="bottom-end"
                      @command="(command) => handleOperationCommand(String(command), row)"
                    >
                      <el-button type="primary" link size="small" class="operation-trigger-button">
                        操作
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="detail">
                            <el-icon><View /></el-icon>
                            <span>详情</span>
                          </el-dropdown-item>
                          <el-dropdown-item
                            v-if="row.analysisType === 'hot_selling_selection'"
                            command="supply-match"
                          >
                            <el-icon><Link /></el-icon>
                            <span>创建找同款</span>
                          </el-dropdown-item>
                          <el-dropdown-item
                            command="delete"
                            divided
                            class="operation-menu-item--danger"
                          >
                            <el-icon><Delete /></el-icon>
                            <span>删除</span>
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
            v-model:page="filters.pageNo"
            v-model:limit="filters.pageSize"
            @pagination="loadList"
          />
        </div>
      </template>
    </ListPageLayout>

    <el-dialog
      v-model="detailVisible"
      fullscreen
      destroy-on-close
      class="analysis-run-detail-dialog"
      title="分析结果详情"
      @closed="handleDetailClosed"
    >
      <div v-loading="detailLoading" class="analysis-detail-shell">
        <template v-if="currentDetail">
          <CompactNotice
            v-if="currentDetail.status === 'failed'"
            type="danger"
            title="本次分析执行失败"
            :description="currentDetail.errorMessage || '请检查采集样本或 AI 模型配置后重试。'"
            class="analysis-detail-notice"
          />

          <div class="detail-overview-grid">
            <div class="detail-card detail-card--hero">
              <div class="detail-card__header">
                <div>
                  <div class="detail-card__title">
                    {{ currentDetail.task?.name || currentDetail.taskName || getAnalysisTypeLabel(currentDetail.analysisType) }}
                  </div>
                  <div class="detail-card__subtitle">
                    {{
                      currentDetail.resultData?.overview?.summary ||
                      currentDetail.errorMessage ||
                      "暂无结论摘要"
                    }}
                  </div>
                </div>
                <div class="detail-chip-row">
                  <el-tag size="small" :type="getRunStatusTagType(currentDetail.status)">
                    {{ getRunStatusLabel(currentDetail.status) }}
                  </el-tag>
                  <el-tag size="small" type="info">
                    {{ getAnalysisTypeLabel(currentDetail.analysisType) }}
                  </el-tag>
                  <el-tag
                    v-if="currentDetail.resultData?.overview?.confidence"
                    size="small"
                    :type="getConfidenceTagType(currentDetail.resultData?.overview?.confidence)"
                  >
                    置信度 {{ getConfidenceLabel(currentDetail.resultData?.overview?.confidence) }}
                  </el-tag>
                  <el-tag v-if="currentDetail.aiModel" size="small" type="info">
                    {{ currentDetail.aiModel }}
                  </el-tag>
                </div>
              </div>

              <div class="detail-overview-meta">
                <div class="overview-metric">
                  <span>样本数</span>
                  <strong>{{ detailSourceStats.itemCount || 0 }}</strong>
                </div>
                <div class="overview-metric">
                  <span>{{ resultCountLabel }}</span>
                  <strong>{{ resultCountValue }}</strong>
                </div>
                <div class="overview-metric">
                  <span>{{ supportMetricLabel }}</span>
                  <strong>{{ supportMetricValue }}</strong>
                </div>
                <div class="overview-metric">
                  <span>截图数</span>
                  <strong>{{ detailSourceStats.screenshotCount || 0 }}</strong>
                </div>
              </div>

              <div
                class="detail-text-group"
                v-if="currentDetail.resultData?.overview?.opportunityDirection"
              >
                <div class="detail-text-group__label">建议方向</div>
                <div class="detail-text-group__content">
                  {{ currentDetail.resultData?.overview?.opportunityDirection }}
                </div>
              </div>

              <div
                class="detail-text-group"
                v-if="currentDetail.resultData?.overview?.datasetAssessment"
              >
                <div class="detail-text-group__label">样本质量判断</div>
                <div class="detail-text-group__content">
                  {{ currentDetail.resultData?.overview?.datasetAssessment }}
                </div>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-card__title">来源统计</div>
              <div class="stats-list">
                <div class="stats-item">
                  <span>任务数</span>
                  <strong>{{ detailSourceStats.taskCount || 0 }}</strong>
                </div>
                <div class="stats-item">
                  <span>运行数</span>
                  <strong>{{ detailSourceStats.runCount || 0 }}</strong>
                </div>
                <div class="stats-item">
                  <span>详情覆盖</span>
                  <strong>{{ detailSourceStats.fieldCoverage?.withDetailDataCount || 0 }}</strong>
                </div>
                <div class="stats-item">
                  <span>价格覆盖</span>
                  <strong>{{ detailSourceStats.fieldCoverage?.withPriceCount || 0 }}</strong>
                </div>
                <div class="stats-item">
                  <span>图片覆盖</span>
                  <strong>{{ detailSourceStats.fieldCoverage?.withImageCount || 0 }}</strong>
                </div>
                <div class="stats-item">
                  <span>评论覆盖</span>
                  <strong>{{ detailSourceStats.fieldCoverage?.withReviewCountCount || 0 }}</strong>
                </div>
              </div>

              <div class="detail-mini-section" v-if="detailSourceStats.platformBreakdown?.length">
                <div class="detail-mini-section__title">平台分布</div>
                <div class="chip-list">
                  <el-tag
                    v-for="item in detailSourceStats.platformBreakdown"
                    :key="item.platform"
                    size="small"
                  >
                    {{ item.platform }} · {{ item.count }}
                  </el-tag>
                </div>
              </div>

              <div
                class="detail-mini-section"
                v-if="detailSourceStats.taskTypeBreakdown?.length"
              >
                <div class="detail-mini-section__title">任务类型分布</div>
                <div class="chip-list">
                  <el-tag
                    v-for="item in detailSourceStats.taskTypeBreakdown"
                    :key="item.taskType"
                    size="small"
                    type="info"
                  >
                    {{ item.taskType }} · {{ item.count }}
                  </el-tag>
                </div>
              </div>

              <div class="detail-mini-section">
                <div class="detail-mini-section__title">分析方法</div>
                <div class="stats-list">
                  <div class="stats-item">
                    <span>提示词模式</span>
                    <strong>{{ promptModeLabel }}</strong>
                  </div>
                  <div class="stats-item">
                    <span>请求模型</span>
                    <strong>{{ requestedModelLabel }}</strong>
                  </div>
                  <div class="stats-item">
                    <span>实际模型</span>
                    <strong>{{ currentDetail.aiModel || "-" }}</strong>
                  </div>
                  <div class="stats-item">
                    <span>输出视图</span>
                    <strong>{{ customResultViewLabel }}</strong>
                  </div>
                </div>
                <div class="detail-text-group" v-if="analysisMethodSummary">
                  <div class="detail-text-group__label">方法说明</div>
                  <div class="detail-text-group__content">
                    {{ analysisMethodSummary }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-toolbar" v-if="currentDetail.analysisType === 'hot_selling_selection'">
            <el-button type="primary" @click="handleCreateSupplyMatchTask(currentDetail)">
              基于本次分析创建找同款任务
            </el-button>
          </div>

          <el-tabs>
            <el-tab-pane
              v-if="currentDetail.analysisType === 'hot_selling_selection'"
              :label="`推荐商品 (${recommendedProducts.length})`"
            >
              <div v-if="recommendedProducts.length" class="recommend-list">
                <div
                  v-for="item in recommendedProducts"
                  :key="`${item.rank}-${item.productName}`"
                  class="recommend-card"
                >
                  <div class="recommend-card__header">
                    <div>
                      <div class="recommend-card__title">
                        #{{ item.rank || "-" }} {{ item.productName || "-" }}
                      </div>
                      <div class="recommend-card__desc">
                        {{ item.selectionReason || "暂无选品理由" }}
                      </div>
                    </div>
                    <div class="detail-chip-row">
                      <el-tag size="small" type="success"> 热度 {{ item.hotScore ?? "-" }} </el-tag>
                      <el-tag
                        v-if="item.confidence"
                        size="small"
                        :type="getConfidenceTagType(item.confidence)"
                      >
                        {{ getConfidenceLabel(item.confidence) }}
                      </el-tag>
                      <el-button
                        size="small"
                        type="primary"
                        plain
                        @click="
                          handleCreateSupplyMatchTask(
                            currentDetail,
                            item.sourceItemIds,
                            item.productName,
                          )
                        "
                      >
                        找同款
                      </el-button>
                    </div>
                  </div>

                  <div class="recommend-grid">
                    <div class="recommend-block">
                      <div class="recommend-block__label">需求信号</div>
                      <div class="chip-list">
                        <el-tag
                          v-for="signal in item.coreDemandSignals || []"
                          :key="signal"
                          size="small"
                        >
                          {{ signal }}
                        </el-tag>
                      </div>
                    </div>
                    <div class="recommend-block">
                      <div class="recommend-block__label">跨平台信号</div>
                      <div class="chip-list">
                        <el-tag
                          v-for="signal in item.crossPlatformSignals || []"
                          :key="signal"
                          size="small"
                          type="info"
                        >
                          {{ signal }}
                        </el-tag>
                      </div>
                    </div>
                    <div class="recommend-block">
                      <div class="recommend-block__label">价格判断</div>
                      <div class="recommend-block__text">{{ item.pricingInsight || "-" }}</div>
                    </div>
                    <div class="recommend-block">
                      <div class="recommend-block__label">竞争判断</div>
                      <div class="recommend-block__text">{{ item.competitionInsight || "-" }}</div>
                    </div>
                    <div class="recommend-block">
                      <div class="recommend-block__label">差异化方向</div>
                      <div class="chip-list">
                        <el-tag
                          v-for="idea in item.differentiationIdeas || []"
                          :key="idea"
                          size="small"
                          type="success"
                        >
                          {{ idea }}
                        </el-tag>
                      </div>
                    </div>
                    <div class="recommend-block">
                      <div class="recommend-block__label">风险提示</div>
                      <div class="chip-list">
                        <el-tag
                          v-for="risk in item.riskNotes || []"
                          :key="risk"
                          size="small"
                          type="danger"
                        >
                          {{ risk }}
                        </el-tag>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无推荐商品" />
            </el-tab-pane>

            <el-tab-pane
              v-if="currentDetail.analysisType === 'hot_selling_selection'"
              :label="`热门关键词 (${hotKeywords.length})`"
            >
              <div v-if="hotKeywords.length" class="simple-card-grid">
                <div v-for="item in hotKeywords" :key="item.keyword" class="simple-card">
                  <div class="simple-card__header">
                    <div class="simple-card__title">{{ item.keyword }}</div>
                    <el-tag size="small" type="warning">热度 {{ item.heat ?? 0 }}</el-tag>
                  </div>
                  <div class="simple-card__text">{{ item.reason || "暂无说明" }}</div>
                  <div class="chip-list">
                    <el-tag
                      v-for="platform in item.platforms || []"
                      :key="platform"
                      size="small"
                      type="info"
                    >
                      {{ platform }}
                    </el-tag>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无热门关键词" />
            </el-tab-pane>

            <el-tab-pane
              v-if="currentDetail.analysisType === 'hot_selling_selection'"
              :label="`平台洞察 (${platformInsights.length})`"
            >
              <div v-if="platformInsights.length" class="simple-card-grid">
                <div
                  v-for="item in platformInsights"
                  :key="`${item.platform}-${item.insight}`"
                  class="simple-card"
                >
                  <div class="simple-card__header">
                    <div class="simple-card__title">{{ item.platform || "-" }}</div>
                  </div>
                  <div class="simple-card__text">{{ item.insight || "暂无洞察" }}</div>
                  <div class="detail-mini-section" v-if="item.opportunityKeywords?.length">
                    <div class="detail-mini-section__title">机会词</div>
                    <div class="chip-list">
                      <el-tag
                        v-for="keyword in item.opportunityKeywords"
                        :key="keyword"
                        size="small"
                        type="success"
                      >
                        {{ keyword }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="detail-mini-section" v-if="item.riskNotes?.length">
                    <div class="detail-mini-section__title">风险</div>
                    <div class="chip-list">
                      <el-tag v-for="risk in item.riskNotes" :key="risk" size="small" type="danger">
                        {{ risk }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无平台洞察" />
            </el-tab-pane>

            <el-tab-pane
              v-if="showsStructuredResult"
              :label="`${structuredResultTabLabel} (${customResultItems.length})`"
            >
              <div v-if="customResultNotes.length" class="detail-mini-section">
                <div class="detail-mini-section__title">结果备注</div>
                <div class="chip-list">
                  <el-tag v-for="note in customResultNotes" :key="note" size="small" type="info">
                    {{ note }}
                  </el-tag>
                </div>
              </div>

              <div v-if="customResultView === 'gallery' && customGalleryItems.length" class="custom-gallery">
                <div
                  v-for="item in customGalleryItems"
                  :key="item.key"
                  class="custom-gallery__card"
                >
                  <img :src="item.imageUrl" :alt="item.title || 'custom-result'" class="custom-gallery__image" />
                  <div class="custom-gallery__meta">
                    <div class="custom-gallery__title">{{ item.title || item.imageUrl }}</div>
                    <el-link v-if="item.sourceUrl" :href="item.sourceUrl" target="_blank" type="primary">
                      查看来源
                    </el-link>
                  </div>
                </div>
              </div>

              <el-table
                v-else-if="customResultItems.length && customResultColumns.length"
                :data="customResultItems"
                border
                size="small"
                class="custom-result-table"
              >
                <el-table-column
                  v-for="column in customResultColumns"
                  :key="column.key"
                  :prop="column.key"
                  :label="column.label"
                  min-width="140"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    {{ formatCustomResultCell(row?.[column.key]) }}
                  </template>
                </el-table-column>
              </el-table>

              <div v-else-if="customResultItems.length" class="simple-card-grid">
                <div
                  v-for="(item, index) in customResultItems"
                  :key="`custom-${index}`"
                  class="simple-card"
                >
                  <pre class="json-preview json-preview--compact">{{ formatJson(item) }}</pre>
                </div>
              </div>

              <el-empty v-else description="暂无自定义结果" />
            </el-tab-pane>

            <el-tab-pane label="分析过程">
              <div class="analysis-trace-grid">
                <div class="detail-card">
                  <div class="detail-card__title">分析输入</div>
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="分析类型">
                      {{ getAnalysisTypeLabel(currentDetail.analysisType) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="提示词模式">
                      {{ promptModeLabel }}
                    </el-descriptions-item>
                    <el-descriptions-item label="请求模型">
                      {{ requestedModelLabel }}
                    </el-descriptions-item>
                    <el-descriptions-item label="模型链路">
                      {{ analysisModelChainText }}
                    </el-descriptions-item>
                    <el-descriptions-item label="样本数">
                      {{ detailSourceStats.itemCount || normalizedItems.length || 0 }}
                    </el-descriptions-item>
                    <el-descriptions-item label="原始记录数">
                      {{ currentDetail.sourceRecordIdsData?.length || 0 }}
                    </el-descriptions-item>
                  </el-descriptions>
                </div>

                <div class="detail-card">
                  <div class="detail-card__title">提示词与结构</div>
                  <div v-if="userPromptText" class="detail-text-group">
                    <div class="detail-text-group__label">用户提示词</div>
                    <pre class="json-preview json-preview--compact">{{ userPromptText }}</pre>
                  </div>
                  <div v-if="outputSchemaHintText" class="detail-text-group">
                    <div class="detail-text-group__label">输出结构提示</div>
                    <pre class="json-preview json-preview--compact">{{ outputSchemaHintText }}</pre>
                  </div>
                  <div class="detail-text-group">
                    <div class="detail-text-group__label">最终提示词</div>
                    <pre class="json-preview json-preview--compact">{{ resolvedPromptText }}</pre>
                  </div>
                </div>
              </div>

              <div class="detail-card" v-if="analysisRawResponseText">
                <div class="detail-card__title">AI 原始响应</div>
                <pre class="json-preview json-preview--compact">{{ analysisRawResponseText }}</pre>
              </div>
            </el-tab-pane>

            <el-tab-pane :label="`源商品样本 (${normalizedItems.length})`">
              <div v-if="normalizedItems.length" class="source-item-list">
                <div v-for="item in normalizedItems" :key="item.id" class="source-item-card">
                  <div class="source-item-card__header">
                    <div class="source-item-card__title">
                      {{ item.title || item.recordKey || item.id }}
                    </div>
                    <div class="detail-chip-row">
                      <el-tag size="small">{{ item.platform || "-" }}</el-tag>
                      <el-tag size="small" type="info">{{ item.taskType || "-" }}</el-tag>
                      <el-tag size="small" type="success" v-if="item.hasDetailData">含详情</el-tag>
                    </div>
                  </div>
                  <div class="source-item-card__meta">
                    <span>价格：{{ item.priceText || "-" }}</span>
                    <span>店铺：{{ item.shopName || "-" }}</span>
                    <span>关键词：{{ item.keyword || "-" }}</span>
                    <span>评论：{{ item.reviewCountText || item.reviewCount || "-" }}</span>
                  </div>
                  <div class="source-item-card__text">
                    {{ item.summaryText || item.descriptionText || item.subtitle || "暂无摘要" }}
                  </div>
                  <el-link
                    v-if="item.sourceUrl"
                    :href="item.sourceUrl"
                    target="_blank"
                    type="primary"
                  >
                    查看来源链接
                  </el-link>
                </div>
              </div>
              <el-empty v-else description="暂无源商品样本" />
            </el-tab-pane>

            <el-tab-pane label="JSON">
              <pre class="json-preview">{{ detailPreviewText }}</pre>
            </el-tab-pane>
          </el-tabs>
        </template>

        <el-empty v-else description="暂无详情数据" />
      </div>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Link, View } from "@element-plus/icons-vue";
import type { VxeGridProps } from "vxe-table";
import {
  batchDeleteEcomSelectionAnalysisRun,
  deleteEcomSelectionAnalysisRun,
  getEcomSelectionAnalysisRunDetail,
  getEcomSelectionAnalysisRunList,
  getEcomSelectionAnalysisTaskList,
  type EcomSelectionAnalysisRun,
  type EcomSelectionAnalysisTask,
} from "@/api/operation/ecomSelectionAnalysis";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import CompactNotice from "@/components/CompactNotice/index.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import {
  formatDateTime,
  formatJson,
  getAnalysisTypeLabel,
  getConfidenceLabel,
  getConfidenceTagType,
  getRunStatusLabel,
  getRunStatusTagType,
} from "@/views/operation/ecom-data/shared";

defineOptions({ name: "EcomSelectionAnalysisRunPage" });

const router = useRouter();
const loading = ref(false);
const detailLoading = ref(false);
const detailVisible = ref(false);
const total = ref(0);
const list = ref<EcomSelectionAnalysisRun[]>([]);
const tasks = ref<EcomSelectionAnalysisTask[]>([]);
const selectedIds = ref<string[]>([]);
const currentDetail = ref<EcomSelectionAnalysisRun | null>(null);

const filters = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: "",
  status: "",
  analysisType: "",
});

const updateSelectedIds = (records: EcomSelectionAnalysisRun[] = []) => {
  selectedIds.value = Array.from(
    new Set(records.map((item) => String(item.id || "").trim()).filter(Boolean)),
  );
};

const tableData = computed(() => {
  if (list.value.length <= filters.pageSize) {
    return list.value;
  }
  const start = (filters.pageNo - 1) * filters.pageSize;
  return list.value.slice(start, start + filters.pageSize);
});

const taskOptions = computed(() =>
  tasks.value.map((item) => ({ value: item.id, label: item.name })),
);

const detailSourceStats = computed(() => {
  return currentDetail.value?.sourceStatsData || currentDetail.value?.resultData?.sourceStats || {};
});

const recommendedProducts = computed(() => {
  return Array.isArray(currentDetail.value?.resultData?.recommendedProducts)
    ? currentDetail.value?.resultData?.recommendedProducts
    : [];
});

const hotKeywords = computed(() => {
  return Array.isArray(currentDetail.value?.resultData?.hotKeywords)
    ? currentDetail.value?.resultData?.hotKeywords
    : [];
});

const platformInsights = computed(() => {
  return Array.isArray(currentDetail.value?.resultData?.platformInsights)
    ? currentDetail.value?.resultData?.platformInsights
    : [];
});

const normalizedItems = computed(() => {
  return Array.isArray(currentDetail.value?.normalizedItemsData)
    ? currentDetail.value?.normalizedItemsData
    : [];
});

const analysisTrace = computed(() => {
  return currentDetail.value?.resultData?.analysisTrace || {};
});

const isStructuredResultAnalysis = (analysisType?: string | null) =>
  ["custom_prompt_extract", "pod_pattern_analysis"].includes(
    String(analysisType || "").trim(),
  );

const customResult = computed(() => {
  return currentDetail.value?.resultData?.customResult || {};
});

const showsStructuredResult = computed(() =>
  isStructuredResultAnalysis(currentDetail.value?.analysisType),
);

const customResultItems = computed(() => {
  return Array.isArray(customResult.value?.items) ? customResult.value.items : [];
});

const customResultColumns = computed(() => {
  if (Array.isArray(customResult.value?.columns) && customResult.value.columns.length) {
    return customResult.value.columns.filter(
      (item: any) => String(item?.key || "").trim() && String(item?.label || "").trim(),
    );
  }

  const firstObject = customResultItems.value.find(
    (item) => item && typeof item === "object" && !Array.isArray(item),
  ) as Record<string, any> | undefined;
  if (!firstObject) {
    return [];
  }

  return Object.keys(firstObject)
    .slice(0, 8)
    .map((key) => ({ key, label: key }));
});

const customResultView = computed(() =>
  String(customResult.value?.view || "").trim().toLowerCase() || "table",
);

const customResultViewLabel = computed(() => {
  const map: Record<string, string> = {
    gallery: "图片墙",
    table: "表格",
    list: "列表",
    json: "JSON",
  };
  return map[customResultView.value] || "-";
});

const customResultNotes = computed(() => {
  const notes = Array.isArray(customResult.value?.notes)
    ? customResult.value.notes
    : Array.isArray(currentDetail.value?.resultData?.resultNotes)
      ? currentDetail.value?.resultData?.resultNotes
      : [];
  return notes.filter(Boolean);
});

const customGalleryItems = computed(() =>
  customResultItems.value
    .map((item: any, index) => {
      const imageUrl = String(
        item?.imageUrl ||
          item?.url ||
          item?.src ||
          item?.image ||
          item?.imageUrls?.[0] ||
          "",
      ).trim();
      if (!imageUrl) {
        return null;
      }
      return {
        key: String(item?.id || item?.sourceUrl || imageUrl || index),
        imageUrl,
        title: String(item?.title || item?.name || item?.label || "").trim(),
        sourceUrl: String(item?.sourceUrl || item?.url || "").trim(),
      };
    })
    .filter(Boolean),
);

const requestedModelLabel = computed(() =>
  String(
    analysisTrace.value?.requestedModel ||
      currentDetail.value?.optionsSnapshot?.aiModel ||
      "",
  ).trim() || "默认模型",
);

const promptModeLabel = computed(() =>
  analysisTrace.value?.promptMode === "custom_prompt" ||
  currentDetail.value?.analysisType === "custom_prompt_extract"
    ? "用户自定义提示词"
    : "系统模板",
);

const structuredResultTabLabel = computed(() => {
  if (currentDetail.value?.analysisType === "pod_pattern_analysis") {
    return "图案结果";
  }
  return "自定义结果";
});

const analysisMethodSummary = computed(() =>
  String(
    analysisTrace.value?.methodSummary ||
      currentDetail.value?.resultData?.overview?.methodSummary ||
      "",
  ).trim(),
);

const analysisModelChainText = computed(() => {
  const items = Array.isArray(analysisTrace.value?.aiModelChain)
    ? analysisTrace.value.aiModelChain.filter(Boolean)
    : [];
  return items.length
    ? items.join(" -> ")
    : String(currentDetail.value?.aiModel || "").trim() || "-";
});

const userPromptText = computed(() =>
  String(
    analysisTrace.value?.userPrompt ||
      currentDetail.value?.optionsSnapshot?.customPrompt ||
      "",
  ).trim(),
);

const outputSchemaHintText = computed(() =>
  String(
    analysisTrace.value?.outputSchemaHint ||
      currentDetail.value?.optionsSnapshot?.customOutputSchema ||
      "",
  ).trim(),
);

const resolvedPromptText = computed(() =>
  String(analysisTrace.value?.resolvedPrompt || "").trim() || "-",
);

const analysisRawResponseText = computed(() =>
  String(analysisTrace.value?.aiRawText || "").trim(),
);

const resultCountLabel = computed(() =>
  showsStructuredResult.value ? "结果条数" : "推荐商品",
);

const resultCountValue = computed(() =>
  showsStructuredResult.value
    ? customResultItems.value.length
    : recommendedProducts.value.length,
);

const supportMetricLabel = computed(() =>
  showsStructuredResult.value ? "输出视图" : "热门关键词",
);

const supportMetricValue = computed(() =>
  showsStructuredResult.value
    ? customResultViewLabel.value
    : hotKeywords.value.length,
);

const detailPreviewText = computed(() => formatJson(currentDetail.value || {}));

const formatCustomResultCell = (value: unknown) => {
  if (value == null || value === "") {
    return "-";
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean).join(" / ") || "-";
  }
  if (typeof value === "object") {
    return formatJson(value);
  }
  return String(value);
};

const getOverviewText = (row: EcomSelectionAnalysisRun) => {
  const overviewSummary = String(
    row?.resultPreview?.overview?.summary || row?.resultData?.overview?.summary || "",
  ).trim();
  if (overviewSummary) {
    return overviewSummary;
  }

  const customResultCount = Number(row?.resultPreview?.customResult?.itemCount || 0);
  if (customResultCount > 0) {
    return row.analysisType === "pod_pattern_analysis"
      ? `已输出 ${customResultCount} 条图案结果`
      : `已输出 ${customResultCount} 条自定义结果`;
  }

  const recommendedProductCount = Number(row?.resultPreview?.recommendedProductCount || 0);
  if (recommendedProductCount > 0) {
    return `已推荐 ${recommendedProductCount} 个候选方向`;
  }

  if (row?.sourceStatsData?.itemCount) {
    return `样本 ${row.sourceStatsData.itemCount} 个`;
  }

  if (row.errorMessage) {
    return row.errorMessage;
  }

  if (row.status === "running") {
    return "分析执行中";
  }

  return "暂无摘要";
};

const getListResultCount = (row: EcomSelectionAnalysisRun) => {
  if (
    ["custom_prompt_extract", "pod_pattern_analysis"].includes(
      String(row.analysisType || "").trim(),
    )
  ) {
    return Number(row?.resultPreview?.customResult?.itemCount || 0);
  }

  return Number(row?.resultPreview?.recommendedProductCount || 0);
};

const gridOptions = ref<VxeGridProps<EcomSelectionAnalysisRun>>({
  ...(commonGridOptions as VxeGridProps<EcomSelectionAnalysisRun>),
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "id",
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: [
    { type: "checkbox", width: 48 },
    { title: "任务名称", field: "taskName", minWidth: 220, showOverflow: "tooltip" },
    {
      title: "类型",
      field: "analysisType",
      width: 110,
      slots: { default: "typeSlot" },
    },
    {
      title: "状态",
      field: "status",
      width: 100,
      slots: { default: "statusSlot" },
    },
    {
      title: "AI 模型",
      field: "aiModel",
      minWidth: 140,
      formatter: ({ row }) => row.aiModel || "-",
    },
    {
      title: "样本数",
      field: "sourceStatsData",
      width: 88,
      formatter: ({ row }) => Number(row.sourceStatsData?.itemCount || 0),
    },
    {
      title: "结果量",
      field: "resultPreview",
      width: 88,
      formatter: ({ row }) => getListResultCount(row),
    },
    {
      ...buildTimeColumn("开始时间", "startedAt", 180),
      formatter: ({ cellValue }) => formatDateTime(cellValue as string),
    },
    {
      ...buildTimeColumn("结束时间", "finishedAt", 180),
      formatter: ({ cellValue }) => formatDateTime(cellValue as string),
    },
    {
      title: "摘要",
      field: "summaryText",
      minWidth: 220,
      showOverflow: "tooltip",
      slots: { default: "summarySlot" },
    },
    buildOperationColumn("operationSlot", 132),
  ],
});

const applyListData = (data: any) => {
  list.value = Array.isArray(data?.list) ? data.list : [];
  total.value = Number(data?.total || 0);
  selectedIds.value = [];
};

const loadList = async () => {
  loading.value = true;
  try {
    const data = await getEcomSelectionAnalysisRunList(filters);
    applyListData(data);
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [runData, taskData] = await Promise.all([
      getEcomSelectionAnalysisRunList(filters),
      getEcomSelectionAnalysisTaskList({ pageNo: 1, pageSize: 100 }),
    ]);
    applyListData(runData);
    tasks.value = Array.isArray(taskData?.list) ? taskData.list : [];
  } finally {
    loading.value = false;
  }
};

const handleSearch = async () => {
  filters.pageNo = 1;
  await loadList();
};

const handleReset = async () => {
  filters.pageNo = 1;
  filters.taskId = "";
  filters.status = "";
  filters.analysisType = "";
  await loadList();
};

const handleCheckboxChange = ({ records }: { records: EcomSelectionAnalysisRun[] }) => {
  updateSelectedIds(records);
};

const handleCheckboxAll = ({ records }: { records: EcomSelectionAnalysisRun[] }) => {
  updateSelectedIds(records);
};

const handleOperationCommand = (command: string, row: EcomSelectionAnalysisRun) => {
  switch (command) {
    case "detail":
      void openDetail(row);
      break;
    case "supply-match":
      void handleCreateSupplyMatchTask(row);
      break;
    case "delete":
      void handleDelete(row);
      break;
  }
};

const openDetail = async (row: EcomSelectionAnalysisRun) => {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    currentDetail.value = await getEcomSelectionAnalysisRunDetail(row.id);
  } finally {
    detailLoading.value = false;
  }
};

const handleDetailClosed = () => {
  currentDetail.value = null;
};

const handleCreateSupplyMatchTask = async (
  run: EcomSelectionAnalysisRun,
  sourceItemIds?: string[],
  productName?: string,
) => {
  if (run.analysisType !== "hot_selling_selection") {
    ElMessage.warning("只有“热门选品”分析结果可以继续创建找同款任务");
    return;
  }

  await router.push({
    name: "EcomSelectionSupplyMatchTaskPage",
    query: {
      analysisRunId: run.id,
      sourceItemIds:
        Array.isArray(sourceItemIds) && sourceItemIds.length ? sourceItemIds.join(",") : "",
      productName: productName || "",
    },
  });
};

const handleDelete = async (row: EcomSelectionAnalysisRun) => {
  try {
    await ElMessageBox.confirm(
      "确认删除这条分析结果吗？删除后将无法再基于它创建找同款任务。",
      "提示",
      { type: "warning" },
    );
    await deleteEcomSelectionAnalysisRun(row.id);
    ElMessage.success("分析结果已删除");
    await loadList();
  } catch {}
};

const handleBatchDelete = async () => {
  if (!selectedIds.value.length) return;
  try {
    await ElMessageBox.confirm(`确认批量删除 ${selectedIds.value.length} 条分析结果吗？`, "提示", {
      type: "warning",
    });
    await batchDeleteEcomSelectionAnalysisRun(selectedIds.value);
    ElMessage.success("批量删除成功");
    await loadList();
  } catch {}
};

onMounted(() => {
  void loadData();
});

onActivated(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
:deep(.ecom-data-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.ecom-data-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.ecom-data-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.ecom-data-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}

.resource-toolbar__title {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.resource-toolbar__desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.table-meta-text {
  color: var(--el-text-color-secondary);
}

.analysis-detail-shell {
  min-height: calc(100vh - 180px);
}

.analysis-detail-notice {
  margin-bottom: 14px;
}

.detail-overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
  gap: 16px;
  margin-bottom: 18px;
}

.detail-card {
  padding: 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
}

.detail-card--hero {
  background: var(--el-fill-color-lighter);
}

.detail-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.detail-card__title {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.detail-card__subtitle {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.detail-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-overview-meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.overview-metric {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.overview-metric span {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.overview-metric strong {
  display: block;
  margin-top: 6px;
  color: var(--el-text-color-primary);
  font-size: 22px;
  line-height: 1.2;
}

.detail-text-group {
  margin-top: 16px;
}

.detail-text-group__label,
.detail-mini-section__title,
.recommend-block__label {
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.detail-text-group__content,
.recommend-block__text,
.simple-card__text,
.source-item-card__text {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.stats-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stats-item {
  padding: 12px;
  border-radius: 12px;
  background: var(--el-fill-color-light);
}

.stats-item span {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.stats-item strong {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-primary);
  font-size: 20px;
}

.detail-mini-section {
  margin-top: 14px;
}

.detail-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 14px;
}

.analysis-trace-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.recommend-list,
.source-item-list {
  display: grid;
  gap: 14px;
}

.recommend-card,
.source-item-card,
.simple-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
}

.recommend-card__header,
.simple-card__header,
.source-item-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.recommend-card__title,
.simple-card__title,
.source-item-card__title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}

.recommend-card__desc {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.recommend-block {
  min-width: 0;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.custom-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.custom-gallery__card {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
}

.custom-gallery__image {
  display: block;
  width: 100%;
  height: 220px;
  object-fit: cover;
  background: var(--el-fill-color-light);
}

.custom-gallery__meta {
  display: grid;
  gap: 8px;
  padding: 12px 14px 14px;
}

.custom-gallery__title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.6;
  word-break: break-word;
}

.simple-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.custom-result-table {
  width: 100%;
}

.source-item-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 10px 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.json-preview {
  max-height: 560px;
  overflow: auto;
  margin: 0;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.json-preview--compact {
  max-height: 320px;
  padding: 12px 14px;
  font-size: 12px;
}

@media (max-width: 1200px) {
  .detail-overview-grid,
  .analysis-trace-grid,
  .simple-card-grid,
  .recommend-grid {
    grid-template-columns: 1fr;
  }

  .detail-overview-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .detail-card__header,
  .recommend-card__header,
  .simple-card__header,
  .source-item-card__header {
    flex-direction: column;
  }

  .detail-overview-meta,
  .stats-list {
    grid-template-columns: 1fr;
  }
}
</style>
