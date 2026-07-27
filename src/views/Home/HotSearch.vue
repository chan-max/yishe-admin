<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="hotsearch-page">
      <template #filter>
        <el-form :model="queryParams" label-position="top" class="list-page-search-form" @submit.prevent="loadList">
          <el-row :gutter="12" class="list-page-search-form__row">
            <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  size="small"
                  value-format="YYYY-MM-DD"
                  :shortcuts="dateShortcuts"
                  style="width: 100%"
                  @change="handleDateChange"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <div class="list-page-search-form__actions">
            <el-button size="small" type="primary" :loading="loading" @click="loadList">刷新</el-button>
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
                <!-- 采集时间 -->
                <template #timeSlot="{ row }">
                  <span>{{ formatDateTime(row.fetchedAt) }}</span>
                </template>

                <!-- 状态 -->
                <template #statusSlot="{ row }">
                  <el-tag size="small" effect="plain" :type="statusTagType(row.status)">
                    {{ statusLabel(row.status) }}
                  </el-tag>
                </template>

                <!-- 平台列表 -->
                <template #platformsSlot="{ row }">
                  <div class="inline-chip-list">
                    <span v-for="p in getActivePlatforms(row.platforms).slice(0, 8)" :key="p" class="info-chip">
                      {{ platformNameMap[p] || p }}
                    </span>
                    <span v-if="getActivePlatforms(row.platforms).length > 8" class="info-chip info-chip--more">
                      +{{ getActivePlatforms(row.platforms).length - 8 }}
                    </span>
                  </div>
                </template>

                <!-- 数据量 -->
                <template #countSlot="{ row }">
                  <span
                    class="metric-badge"
                    :class="{ 'metric-badge--success': row.itemCount > 0 }"
                  >
                    {{ row.itemCount }}
                  </span>
                </template>

                <!-- 成功率 -->
                <template #rateSlot="{ row }">
                  <span
                    :class="{
                      'text-success': row.failCount === 0,
                      'text-warning': row.failCount > 0,
                    }"
                  >
                    {{ row.successCount }}/{{ getActivePlatformCount(row.platforms) }}
                  </span>
                </template>

                <!-- 热点摘要列 -->
                <template #summarySlot="{ row }">
                  <div v-if="row.analysisStatus === 'done' && row.analysis" class="analysis-cell">
                    <div class="analysis-cell__summary analysis-cell__summary--compact">
                      {{ row.analysis.fullSummary || row.analysis.summary || "" }}
                    </div>
                    <div v-if="row.analysis.keyTopics?.length" class="analysis-cell__topics">
                      <el-tag
                        v-for="(t, i) in row.analysis.keyTopics.slice(0, 3)"
                        :key="i"
                        size="small"
                        effect="plain"
                        :type="
                          t.heat === 'high' ? 'danger' : t.heat === 'rising' ? 'warning' : 'info'
                        "
                        class="analysis-cell__topic-tag"
                      >
                        {{ t.topic }}
                      </el-tag>
                      <span v-if="row.analysis.keyTopics.length > 3" class="text-gray-400 text-xs">+{{ row.analysis.keyTopics.length - 3 }}</span>
                    </div>
                    <div v-if="row.analysis.tags?.length || row.analysis.hotTags?.length" class="analysis-cell__tags analysis-cell__tags--compact">
                      <el-tag
                        v-for="(t, i) in (row.analysis.tags || row.analysis.hotTags || []).slice(0, 5)"
                        :key="i"
                        size="small"
                        effect="light"
                        class="analysis-cell__tag"
                        @click.stop="copyTag(t.tag)"
                      >
                        #{{ t.tag }}
                      </el-tag>
                    </div>
                  </div>
                  <span
                    v-else-if="row.analysisStatus === 'analyzing'"
                    style="color: var(--el-color-warning); font-size: 12px"
                    >分析中...</span
                  >
                  <span
                    v-else-if="row.analysisStatus === 'failed'"
                    style="color: var(--el-color-danger); font-size: 12px"
                    >失败</span
                  >
                  <span v-else style="color: var(--el-text-color-placeholder); font-size: 12px"
                    >未分析</span
                  >
                </template>

                <!-- AI状态列 -->
                <template #aiStatusSlot="{ row }">
                  <el-button
                    v-if="row.analysisStatus === 'pending' || !row.analysisStatus"
                    link
                    type="primary"
                    size="small"
                    :loading="analyzingId === row.id"
                    @click.stop="handleTriggerAnalysis(row)"
                  >
                    分析
                  </el-button>
                  <el-button
                    v-else-if="row.analysisStatus === 'failed'"
                    link
                    type="danger"
                    size="small"
                    @click.stop="handleTriggerAnalysis(row)"
                  >
                    重试
                  </el-button>
                  <el-icon
                    v-else-if="row.analysisStatus === 'analyzing'"
                    class="is-loading"
                    style="color: var(--el-color-warning)"
                    ><i class="el-icon-loading"
                  /></el-icon>
                  <el-icon
                    v-else-if="row.analysisStatus === 'done'"
                    style="color: var(--el-color-success)"
                    ><span>✓</span></el-icon
                  >
                </template>

                <!-- 操作 -->
                <template #operationSlot="{ row }">
                  <div class="table-operation-cell__actions">
                    <el-button link type="primary" size="small" @click="openDetail(row)">
                      详情
                    </el-button>
                    <el-button link type="danger" size="small" @click="handleDelete(row.id)">
                      删除
                    </el-button>
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
            v-model:page="pageNo"
            v-model:limit="pageSize"
            @pagination="loadList"
          />
        </div>
      </template>
    </ListPageLayout>
  </ContentWrap>

  <!-- 详情弹窗 -->
  <el-dialog v-model="detailVisible" title="采集详情" fullscreen @closed="currentDetail = null">
    <div v-if="currentDetail" class="detail-dialog">
      <section class="detail-dialog__hero">
        <div>
          <div class="detail-dialog__time">{{ formatDateTime(currentDetail.fetchedAt) }}</div>
          <div class="detail-dialog__summary">
            {{ currentDetail.platformCount }} 个平台 · {{ currentDetail.itemCount }} 条热搜
            <span v-if="currentDetail.duration">
              · 耗时 {{ (currentDetail.duration / 1000).toFixed(1) }}s</span
            >
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center">
          <el-tag size="small" :type="statusTagType(currentDetail.status)">
            {{ statusLabel(currentDetail.status) }}
          </el-tag>
          <el-button
            v-if="
              currentDetail.analysisStatus !== 'done' &&
              currentDetail.analysisStatus !== 'analyzing'
            "
            size="small"
            type="primary"
            :loading="analyzingId === currentDetail.id"
            @click="handleTriggerAnalysis(currentDetail)"
          >
            AI 分析
          </el-button>
        </div>
      </section>

      <!-- Tabs: 原始数据 / AI 分析 -->
      <el-tabs v-model="detailTab" style="margin-top: 16px">
        <el-tab-pane label="原始数据" name="data">
          <div v-if="currentDetail.data" class="detail-dialog__platforms">
            <div
              v-for="key in getDetailPlatformOrder(currentDetail)"
              :key="key"
              class="detail-platform"
            >
              <div class="detail-platform__header">
                <span class="detail-platform__name">
                  <span v-if="!currentDetail.data[key]?.success" class="detail-platform__dot" />
                  {{ currentDetail.data[key]?.name || key }}
                </span>
                <span class="detail-platform__count"
                  >{{ currentDetail.data[key]?.itemCount || 0 }} 条</span
                >
              </div>
              <div v-if="currentDetail.data[key]?.items?.length" class="detail-platform__list">
                <div
                  v-for="(item, idx) in currentDetail.data[key].items"
                  :key="idx"
                  class="detail-item"
                >
                  <span class="detail-item__rank" :class="{ 'is-top': idx < 3 }">{{
                    item.rank
                  }}</span>
                  <a
                    class="detail-item__title"
                    :href="item.url || undefined"
                    :target="item.url ? '_blank' : undefined"
                    >{{ item.title }}</a
                  >
                  <span v-if="item.hot" class="detail-item__hot">{{ formatHot(item.hot) }}</span>
                </div>
              </div>
              <div v-else-if="!currentDetail.data[key]?.success" class="detail-platform__error">
                {{ currentDetail.data[key]?.error || "采集失败" }}
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- AI 分析 Tab -->
        <el-tab-pane label="热点分析" name="analysis">
          <div
            v-if="currentDetail.analysisStatus === 'done' && currentDetail.analysis"
            class="analysis-content"
          >
            <!-- 降级提示 -->
            <el-alert
              v-if="currentDetail.analysis.aiError"
              type="warning"
              :closable="false"
              style="margin-bottom: 16px"
            >
              AI分析降级（自动提取）: {{ currentDetail.analysis.aiError }}
            </el-alert>

            <!-- 完整热点总结 -->
            <div class="analysis-section">
              <h4>📝 热点总结</h4>
              <div class="analysis-summary-text">
                {{ currentDetail.analysis.fullSummary || currentDetail.analysis.summary || "暂无" }}
              </div>
            </div>

            <!-- 核心话题 -->
            <div v-if="currentDetail.analysis.keyTopics?.length" class="analysis-section">
              <h4>💡 核心话题 ({{ currentDetail.analysis.keyTopics.length }})</h4>
              <div class="analysis-topics-grid">
                <div
                  v-for="(topic, i) in currentDetail.analysis.keyTopics"
                  :key="i"
                  class="analysis-topic-card"
                >
                  <div class="analysis-topic-header">
                    <span class="analysis-topic-name">{{ topic.topic }}</span>
                    <el-tag
                      size="small"
                      :type="
                        topic.heat === 'high'
                          ? 'danger'
                          : topic.heat === 'rising'
                            ? 'warning'
                            : 'info'
                      "
                    >
                      {{ topic.heat }}
                    </el-tag>
                  </div>
                  <div class="analysis-topic-desc">{{ topic.description }}</div>
                  <div class="analysis-topic-platforms">
                    <el-tag
                      v-for="p in (topic.platforms || []).slice(0, 4)"
                      :key="p"
                      size="small"
                      effect="plain"
                      type="info"
                      >{{ p }}</el-tag
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- 设计元素分析 -->
            <div v-if="currentDetail.analysis.designElements?.length" class="analysis-section">
              <h4>🎨 设计元素灵感 ({{ currentDetail.analysis.designElements.length }})</h4>
              <div class="analysis-design-grid">
                <div
                  v-for="(de, i) in currentDetail.analysis.designElements"
                  :key="i"
                  class="analysis-design-card"
                >
                  <div class="analysis-design-source">{{ de.source }}</div>
                  <div class="analysis-design-element">{{ de.element }}</div>
                  <div class="analysis-design-suggestion">💡 {{ de.suggestion }}</div>
                  <div class="analysis-design-products">
                    <el-tooltip
                      v-for="(p, pi) in de.products"
                      :key="pi"
                      :content="typeof p === 'object' ? p.reason : ''"
                      placement="top"
                    >
                      <el-tag
                        size="small"
                        effect="plain"
                        type="success"
                      >{{ typeof p === 'object' ? p.name : p }}</el-tag>
                    </el-tooltip>
                  </div>
                  <div class="analysis-design-meta">
                    <span>受众: {{ de.audience }}</span>
                    <el-tag
                      size="small"
                      :type="
                        de.appeal === 'high'
                          ? 'danger'
                          : de.appeal === 'medium'
                            ? 'warning'
                            : 'info'
                      "
                    >
                      {{ de.appeal }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>

            <!-- 各平台热搜原始内容 -->
            <div v-if="currentDetail.analysis.platformHighlights?.length" class="analysis-section">
              <h4>🔍 各平台热搜</h4>
              <div
                v-for="(ph, i) in currentDetail.analysis.platformHighlights"
                :key="i"
                class="analysis-group"
              >
                <div class="analysis-group-header">
                  <span>{{ ph.platform }}</span>
                  <span
                    v-if="ph.summary"
                    style="font-size: 12px; color: var(--el-text-color-secondary)"
                    >{{ ph.summary }}</span
                  >
                </div>
                <ul class="analysis-highlight-list">
                  <li v-for="(item, j) in ph.items || ph.highlights || []" :key="j">
                    <span v-if="typeof item === 'object'">
                      {{ item.title }}
                      <span
                        v-if="item.hot"
                        style="color: var(--el-color-danger); font-size: 11px; margin-left: 4px"
                        >{{ item.hot }}</span
                      >
                    </span>
                    <span v-else>{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- 可用标签 -->
            <div v-if="allTags.length" class="analysis-section">
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 12px;
                "
              >
                <h4 style="margin: 0">🏷️ 可用标签 ({{ allTags.length }})</h4>
                <el-button size="small" type="primary" @click="copyAllTags(allTags)"
                  >一键复制全部</el-button
                >
              </div>
              <div class="analysis-tags-wrap">
                <el-tag
                  v-for="(item, i) in allTags"
                  :key="i"
                  size="default"
                  effect="light"
                  class="analysis-tag-item"
                  @click="copyTag(item.tag)"
                >
                  #{{ item.tag }}
                  <span class="analysis-tag-meta">{{ item.category }}</span>
                </el-tag>
              </div>
            </div>
          </div>

          <div
            v-else-if="currentDetail.analysisStatus === 'analyzing'"
            style="text-align: center; padding: 60px 0"
          >
            <el-icon class="is-loading" :size="32"><i class="el-icon-loading" /></el-icon>
            <p style="margin-top: 12px; color: var(--el-text-color-secondary)">AI 正在分析中...</p>
          </div>

          <div
            v-else-if="currentDetail.analysisStatus === 'failed'"
            style="text-align: center; padding: 60px 0"
          >
            <p style="color: var(--el-color-danger); font-size: 16px; margin-bottom: 8px">
              AI 分析失败
            </p>
            <p
              v-if="currentDetail.analysis?.error"
              style="
                color: var(--el-text-color-secondary);
                font-size: 13px;
                max-width: 600px;
                margin: 0 auto 16px;
                word-break: break-all;
              "
            >
              {{ currentDetail.analysis.error }}
            </p>
            <el-button size="small" type="primary" @click="handleTriggerAnalysis(currentDetail)"
              >重试</el-button
            >
          </div>

          <div v-else style="text-align: center; padding: 60px 0">
            <p style="color: var(--el-text-color-secondary)">尚未进行 AI 分析</p>
            <el-button
              size="small"
              type="primary"
              :loading="analyzingId === currentDetail.id"
              @click="handleTriggerAnalysis(currentDetail)"
              >开始分析</el-button
            >
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <el-empty v-else description="暂无详情" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { VxeGridProps } from "vxe-table";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import {
  pageHotsearch,
  deleteHotsearch,
  triggerAnalysis,
} from "@/api/hotsearch-data";
import type { HotSearchCollectRecord } from "@/api/hotsearch-data";
import { buildOperationColumn, commonGridOptions } from "@/common/table";

defineOptions({ name: "HotSearch" });

// ============ 平台定义 ============
interface PlatformDef {
  key: string;
  name: string;
  environment: "direct" | "proxy" | "browser";
}

const ALL_PLATFORMS: PlatformDef[] = [
  { key: "weibo", name: "微博", environment: "direct" },
  { key: "douyin", name: "抖音", environment: "direct" },
  { key: "bilibili", name: "哔哩哔哩", environment: "direct" },
  { key: "zhihu", name: "知乎", environment: "direct" },
  { key: "toutiao", name: "今日头条", environment: "direct" },
  { key: "douban", name: "豆瓣", environment: "direct" },
  { key: "kuaishou", name: "快手", environment: "direct" },
  { key: "v2ex", name: "V2EX", environment: "direct" },
  { key: "36kr", name: "36氪", environment: "direct" },
  { key: "ithome", name: "IT之家", environment: "direct" },
  { key: "github", name: "GitHub", environment: "direct" },
  { key: "wikipedia", name: "维基百科", environment: "direct" },
  { key: "devto", name: "Dev.to", environment: "direct" },
  { key: "google_trends", name: "Google Trends", environment: "proxy" },
  { key: "hackernews", name: "Hacker News", environment: "proxy" },
  { key: "bbc_news", name: "BBC News", environment: "proxy" },
  { key: "cnn", name: "CNN", environment: "proxy" },
  { key: "nytimes", name: "New York Times", environment: "proxy" },
  { key: "aljazeera", name: "Al Jazeera", environment: "proxy" },
  { key: "ebay_trending", name: "eBay Trending", environment: "proxy" },
  { key: "shopify_trending", name: "Shopify Trending", environment: "proxy" },
];

const activePlatformKeys = new Set(ALL_PLATFORMS.map((p) => p.key));

function getActivePlatforms(platforms?: string[]): string[] {
  if (!platforms) return [];
  return platforms.filter((p) => activePlatformKeys.has(p));
}

function getActivePlatformCount(platforms?: string[]): number {
  return getActivePlatforms(platforms).length;
}

const platformNameMap: Record<string, string> = Object.fromEntries(
  ALL_PLATFORMS.map((p) => [p.key, p.name]),
);

// ============ 表格 ============
const loading = ref(false);
const tableData = ref<HotSearchCollectRecord[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const selectedIds = ref<number[]>([]);
const dateRange = ref<[string, string] | null>(null);

const dateShortcuts = [
  {
    text: '今天',
    value: () => {
      const start = new Date();
      const end = new Date();
      return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
    },
  },
  {
    text: '最近7天',
    value: () => {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const end = new Date();
      return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
    },
  },
  {
    text: '最近30天',
    value: () => {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      const end = new Date();
      return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
    },
  },
];

const handleDateChange = () => {
  pageNo.value = 1;
  loadList();
};

const gridOptions = ref<VxeGridProps<HotSearchCollectRecord>>({
  ...(commonGridOptions as VxeGridProps<HotSearchCollectRecord>),
  rowConfig: { ...(commonGridOptions as any).rowConfig, keyField: "id" },
  checkboxConfig: { reserve: true },
  columns: [
    { type: "checkbox", width: 40 },
    { title: "时间", field: "fetchedAt", width: 120, slots: { default: "timeSlot" } },
    { title: "平台", field: "platforms", width: 180, slots: { default: "platformsSlot" } },
    {
      title: "热点摘要",
      field: "analysisStatus",
      minWidth: 360,
      slots: { default: "summarySlot" },
    },
    { title: "状态", field: "status", width: 70, slots: { default: "statusSlot" } },
    {
      title: "条目",
      field: "itemCount",
      width: 55,
      align: "center",
      slots: { default: "countSlot" },
    },
    {
      title: "成功率",
      field: "successCount",
      width: 60,
      align: "center",
      slots: { default: "rateSlot" },
    },
    {
      title: "AI",
      field: "analysisStatus",
      width: 46,
      align: "center",
      slots: { default: "aiStatusSlot" },
    },
    buildOperationColumn("operationSlot", 80),
  ],
});

const handleCheckboxChange = ({ records }: any) => {
  selectedIds.value = records.map((r: any) => r.id);
};
const handleCheckboxAll = ({ records }: any) => {
  selectedIds.value = records.map((r: any) => r.id);
};

const statusTagType = (s: string) =>
  s === "success" ? "success" : s === "partial" ? "warning" : s === "failed" ? "danger" : "info";
const statusLabel = (s: string) =>
  s === "success" ? "全部成功" : s === "partial" ? "部分成功" : s === "failed" ? "全部失败" : s;

const formatDateTime = (v: any) => {
  if (!v) return "-";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatHot = (hot: string | number) => {
  if (!hot) return "";
  const t = String(hot).trim();
  if (/^\d+$/.test(t)) return Number(t).toLocaleString();
  return t;
};

const loadList = async () => {
  loading.value = true;
  try {
    const params: any = { currentPage: pageNo.value, pageSize: pageSize.value };
    if (dateRange.value) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    const res = await pageHotsearch(params);
    tableData.value = (res.list || []).filter((r) => r.status !== "failed");
    total.value = res.total || 0;
    selectedIds.value = [];
  } catch {
    ElMessage.error("获取采集记录失败");
  } finally {
    loading.value = false;
  }
};

// ============ 详情弹窗 ============
const detailVisible = ref(false);
const currentDetail = ref<HotSearchCollectRecord | null>(null);
const detailTab = ref("data");
const analyzingId = ref<number | null>(null);

const allTags = computed(() => {
  const analysis = currentDetail.value?.analysis;
  if (!analysis) return [];
  const tags = analysis.tags || analysis.hotTags || [];
  const seen = new Set<string>();
  return tags.filter((t: any) => {
    if (!t?.tag || seen.has(t.tag)) return false;
    seen.add(t.tag);
    return true;
  });
});

const openDetail = (row: HotSearchCollectRecord) => {
  currentDetail.value = row;
  detailTab.value = row.analysisStatus === "done" ? "analysis" : "data";
  detailVisible.value = true;
};

const handleTriggerAnalysis = async (row: HotSearchCollectRecord) => {
  analyzingId.value = row.id;
  try {
    await triggerAnalysis(row.id);
    ElMessage.success("AI 分析已触发，完成后将推送通知");
    row.analysisStatus = "analyzing";
  } catch (e: any) {
    ElMessage.error(`触发失败: ${e?.message || "未知错误"}`);
  } finally {
    analyzingId.value = null;
  }
};

const copyTag = (tag: string) => {
  navigator.clipboard.writeText(`#${tag}`).then(() => {
    ElMessage.success(`已复制 #${tag}`);
  });
};

const copyAllTags = (tags: { tag: string }[]) => {
  const text = tags.map((t) => `#${t.tag}`).join(" ");
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success(`已复制全部 ${tags.length} 个标签`);
  });
};

const getDetailPlatformOrder = (record: HotSearchCollectRecord) => {
  if (!record.data) return [];
  return Object.keys(record.data)
    .filter((key) => activePlatformKeys.has(key))
    .sort((a, b) => {
      const order = ALL_PLATFORMS.map((p) => p.key);
      return (
        (order.indexOf(a) === -1 ? 999 : order.indexOf(a)) -
        (order.indexOf(b) === -1 ? 999 : order.indexOf(b))
      );
    });
};

// ============ 删除 ============
const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定删除这条采集记录？", "确认删除", {
      confirmButtonText: "删除",
      type: "warning",
    });
    await deleteHotsearch(id);
    ElMessage.success("已删除");
    loadList();
  } catch (e: any) {
    if (e !== "cancel") ElMessage.error("删除失败");
  }
};

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条记录？`, "批量删除", {
      confirmButtonText: "删除",
      type: "warning",
    });
    await Promise.all(selectedIds.value.map((id) => deleteHotsearch(id)));
    ElMessage.success("已删除");
    loadList();
  } catch (e: any) {
    if (e !== "cancel") ElMessage.error("删除失败");
  }
};

onMounted(() => {
  loadList();
});
</script>

<style scoped lang="scss">
.hotsearch-page {
  min-height: 100%;
}

:deep(.hotsearch-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.hotsearch-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.hotsearch-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.hotsearch-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}

:deep(.hotsearch-page .common-table__body-cell) {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

:deep(.hotsearch-page .vxe-body--column .vxe-cell) {
  padding-top: 4px;
  padding-bottom: 4px;
}

.list-page-filter__actions {
  display: flex;
  gap: 8px;
  padding: 0 0 12px;
}

.primary-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.primary-cell__title {
  font-size: 12px;
  font-weight: 500;
}
.primary-cell__meta {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  font-family: monospace;
}

.inline-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.info-chip {
  display: inline-block;
  padding: 0 6px;
  border-radius: 3px;
  background: var(--el-fill-color-light);
  font-size: 11px;
  line-height: 18px;
  color: var(--el-text-color-regular);
}
.info-chip--more {
  color: var(--el-text-color-secondary);
}

.metric-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}
.metric-badge--success {
  color: var(--el-color-success);
}

.text-success {
  color: var(--el-color-success);
  font-weight: 600;
  font-size: 12px;
}
.text-warning {
  color: var(--el-color-warning);
  font-weight: 600;
  font-size: 12px;
}

.table-operation-cell__actions {
  display: flex;
  gap: 4px;
}

.detail-dialog__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.detail-dialog__time {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.detail-dialog__summary {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.detail-dialog__platforms {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.detail-platform {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  overflow: hidden;
}
.detail-platform__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--el-fill-color-lighter);
  font-size: 13px;
  font-weight: 600;
}
.detail-platform__name {
  display: flex;
  align-items: center;
  gap: 6px;
}
.detail-platform__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-color-danger);
}
.detail-platform__count {
  color: var(--el-text-color-secondary);
  font-weight: 400;
}
.detail-platform__list {
  padding: 6px 10px 8px;
}
.detail-platform__error {
  padding: 8px 14px;
  color: var(--el-color-danger);
  font-size: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 4px;
  border-radius: 6px;
  &:hover {
    background: var(--el-fill-color-light);
  }
}
.detail-item__rank {
  width: 20px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  &.is-top {
    color: var(--el-color-primary);
  }
}
.detail-item__title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-primary);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover {
    color: var(--el-color-primary);
  }
}
.detail-item__hot {
  font-size: 11px;
  color: var(--el-color-danger);
}

.analysis-content {
  padding: 0 4px;
}
.analysis-section {
  margin-bottom: 24px;
  h4 {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--el-text-color-primary);
  }
  p {
    font-size: 14px;
    line-height: 1.7;
    color: var(--el-text-color-regular);
  }
}
.analysis-summary-text {
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
  padding: 14px 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  white-space: pre-wrap;
}
.analysis-topics-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.analysis-topic-card {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.analysis-topic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.analysis-topic-name {
  font-weight: 600;
  font-size: 14px;
}
.analysis-topic-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  margin-bottom: 6px;
}
.analysis-topic-platforms {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.analysis-highlight-list {
  margin: 0;
  padding-left: 18px;
  li {
    font-size: 13px;
    line-height: 1.7;
    color: var(--el-text-color-regular);
  }
}

.analysis-design-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}
.analysis-design-card {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.analysis-design-source {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.analysis-design-element {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.analysis-design-suggestion {
  font-size: 13px;
  color: var(--el-color-primary);
}
.analysis-design-products {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.analysis-design-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.analysis-cell {
  padding: 2px 0;
  overflow: hidden;
  max-height: 80px;
}
.analysis-cell__summary {
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  margin-bottom: 3px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}
.analysis-cell__summary--compact {
  -webkit-line-clamp: 2;
  margin-bottom: 3px;
}
.analysis-cell__topics {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  max-height: 40px;
  overflow: hidden;
}
.analysis-cell__topic-tag {
  max-width: 100px;
  font-size: 10px;
  padding: 0 4px;
  height: 18px;
  line-height: 18px;
}
.analysis-cell__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  max-height: 40px;
  overflow: hidden;
}
.analysis-cell__tag {
  cursor: pointer;
  font-size: 10px;
  padding: 0 4px;
  height: 18px;
  line-height: 18px;
  &:hover {
    opacity: 0.8;
  }
}

.analysis-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.analysis-tag-item {
  cursor: pointer;
  transition: transform 0.15s;
  &:hover {
    transform: scale(1.05);
  }
}
.analysis-tag-meta {
  margin-left: 4px;
  font-size: 11px;
  opacity: 0.6;
}
.analysis-group {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.analysis-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
}
</style>
