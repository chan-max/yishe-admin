<template>
  <!-- 定时采集状态栏 -->
  <ContentWrap plain>
    <div class="schedule-bar">
      <div class="schedule-bar__left">
        <span class="schedule-bar__label">定时采集</span>
        <template v-if="currentSchedule">
          <el-tag size="small" :type="currentSchedule.enabled ? 'success' : 'info'" effect="light">
            {{ currentSchedule.enabled ? "已开启" : "已关闭" }}
          </el-tag>
          <span class="schedule-bar__info">
            {{ getClientLabel(currentSchedule.clientId) }} · 每
            {{ currentSchedule.intervalMinutes }} 分钟 ·
            {{ currentSchedule.platforms?.length || 0 }} 个平台
          </span>
          <span v-if="currentSchedule.lastRunAt" class="schedule-bar__info">
            上次 {{ formatDateTime(currentSchedule.lastRunAt) }}
          </span>
        </template>
        <span v-else class="schedule-bar__info">未配置</span>
      </div>
      <div class="schedule-bar__right">
        <el-switch
          v-if="currentSchedule"
          :model-value="currentSchedule.enabled"
          @change="(val: boolean) => handleToggleSchedule(currentSchedule!.id, val)"
        />
        <el-button size="small" @click="openScheduleDialog">
          {{ currentSchedule ? "编辑" : "设置" }}
        </el-button>
      </div>
    </div>
  </ContentWrap>

  <!-- 定时任务设置弹窗 -->
  <el-dialog v-model="showScheduleDialog" title="定时采集设置" width="640px">
    <el-form label-position="top" size="default">
      <el-form-item label="客户端">
        <el-select v-model="scheduleForm.clientId" placeholder="选择客户端" style="width: 100%" :disabled="!!currentSchedule">
          <el-option v-for="c in clientList" :key="c.id" :label="c.label" :value="c.id">
            <span style="display: flex; align-items: center; gap: 6px">
              <span class="client-dot" :class="{ 'is-online': c.isOnline }" />
              {{ c.label }}
              <el-tag v-if="c.isOnline" size="small" type="success" effect="plain">在线</el-tag>
            </span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="浏览器环境（可选）">
        <el-select
          v-model="scheduleForm.profileId"
          clearable
          placeholder="留空则使用默认环境"
          style="width: 100%"
        >
          <el-option
            v-for="p in getClientProfiles(scheduleForm.clientId)"
            :key="p.id"
            :label="p.label"
            :value="p.id"
          />
        </el-select>
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="采集间隔">
            <el-input-number
              v-model="scheduleForm.intervalMinutes"
              :min="1"
              :max="1440"
              style="width: 100%"
            />
            <div class="form-tip">分钟</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="网络环境">
            <el-select v-model="scheduleForm.environment" style="width: 100%">
              <el-option label="全部" value="all" />
              <el-option label="国内直连" value="direct" />
              <el-option label="需代理" value="proxy" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="采集平台">
        <el-checkbox
          v-model="scheduleSelectAll"
          :indeterminate="scheduleIndeterminate"
          @change="handleScheduleSelectAll"
          style="margin-bottom: 8px"
        >
          全选
        </el-checkbox>
        <el-checkbox-group v-model="scheduleForm.platforms">
          <el-checkbox v-for="p in ALL_PLATFORMS" :key="p.key" :value="p.key" border>
            {{ p.name }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button
        v-if="currentSchedule"
        type="danger"
        text
        @click="handleDeleteSchedule"
        style="float: left"
      >
        删除定时
      </el-button>
      <el-button @click="showScheduleDialog = false">取消</el-button>
      <el-button type="primary" :loading="scheduleSaving" @click="handleSaveSchedule"
        >保存</el-button
      >
    </template>
  </el-dialog>

  <ContentWrap :plain="true">
    <ListPageLayout class="hotsearch-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="list-page-filter__actions">
            <el-button size="small" type="primary" @click="openCollectDialog"> 采集 </el-button>
            <el-button size="small" :loading="loading" @click="loadList">刷新</el-button>
            <el-button
              size="small"
              type="danger"
              :disabled="!selectedIds.length"
              @click="handleBatchDelete"
            >
              批量删除 ({{ selectedIds.length }})
            </el-button>
          </div>
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
                    <span v-for="p in (row.platforms || []).slice(0, 5)" :key="p" class="info-chip">
                      {{ platformNameMap[p] || p }}
                    </span>
                    <span v-if="(row.platforms || []).length > 5" class="info-chip info-chip--more">
                      +{{ row.platforms.length - 5 }}
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
                    {{ row.successCount }}/{{ row.platformCount }}
                  </span>
                </template>

                <!-- AI分析 -->
                <template #analysisSlot="{ row }">
                  <el-tag
                    v-if="row.analysisStatus === 'done'"
                    size="small"
                    type="success"
                    effect="plain"
                    @click="openDetail(row)"
                    style="cursor: pointer"
                  >
                    已分析
                  </el-tag>
                  <el-tag v-else-if="row.analysisStatus === 'analyzing'" size="small" type="warning" effect="plain">
                    分析中
                  </el-tag>
                  <el-tag v-else-if="row.analysisStatus === 'failed'" size="small" type="danger" effect="plain">
                    失败
                  </el-tag>
                  <el-button
                    v-else
                    link
                    type="primary"
                    size="small"
                    :loading="analyzingId === row.id"
                    @click="handleTriggerAnalysis(row)"
                  >
                    分析
                  </el-button>
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
        <div style="display: flex; gap: 8px; align-items: center;">
          <el-tag size="small" :type="statusTagType(currentDetail.status)">
            {{ statusLabel(currentDetail.status) }}
          </el-tag>
          <el-button
            v-if="currentDetail.analysisStatus !== 'done' && currentDetail.analysisStatus !== 'analyzing'"
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
                  <span class="detail-item__rank" :class="{ 'is-top': idx < 3 }">{{ item.rank }}</span>
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
      <el-tab-pane label="AI 分析" name="analysis">
        <div v-if="currentDetail.analysisStatus === 'done' && currentDetail.analysis" class="analysis-content">
          <!-- 趋势总结 -->
          <div class="analysis-section">
            <h4>📝 趋势总结</h4>
            <p>{{ currentDetail.analysis.summary }}</p>
          </div>

          <!-- 热点列表 -->
          <div v-if="currentDetail.analysis.trends?.length" class="analysis-section">
            <h4>🔥 热点趋势 ({{ currentDetail.analysis.trends.length }})</h4>
            <div class="analysis-trends">
              <div v-for="(trend, i) in currentDetail.analysis.trends" :key="i" class="analysis-trend-card">
                <div class="analysis-trend-header">
                  <span class="analysis-trend-rank">#{{ i + 1 }}</span>
                  <span class="analysis-trend-title">{{ trend.title }}</span>
                  <el-tag size="small" :type="trend.significance === 'high' ? 'danger' : trend.significance === 'medium' ? 'warning' : 'info'">
                    {{ trend.significance }}
                  </el-tag>
                </div>
                <div class="analysis-trend-desc">{{ trend.description }}</div>
                <div class="analysis-trend-platform">{{ trend.platform }}</div>
              </div>
            </div>
          </div>

          <!-- POD 推荐 -->
          <div v-if="currentDetail.analysis.podRecommendations?.length" class="analysis-section">
            <h4>🎯 POD 商品推荐 ({{ currentDetail.analysis.podRecommendations.length }})</h4>
            <div class="analysis-pod-grid">
              <div v-for="(pod, i) in currentDetail.analysis.podRecommendations" :key="i" class="analysis-pod-card">
                <div class="analysis-pod-element">{{ pod.element }}</div>
                <div class="analysis-pod-source">来源: {{ pod.source }}</div>
                <div class="analysis-pod-products">
                  <el-tag v-for="p in pod.targetProducts" :key="p" size="small" effect="plain">{{ p }}</el-tag>
                </div>
                <div class="analysis-pod-reason">{{ pod.reason }}</div>
                <div class="analysis-pod-suggestion">💡 {{ pod.designSuggestion }}</div>
                <el-tag size="small" :type="pod.estimatedAppeal === 'high' ? 'success' : pod.estimatedAppeal === 'medium' ? 'warning' : 'info'">
                  潜力: {{ pod.estimatedAppeal }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 市场洞察 -->
          <div v-if="currentDetail.analysis.marketInsights" class="analysis-section">
            <h4>💡 市场洞察</h4>
            <p>{{ currentDetail.analysis.marketInsights }}</p>
          </div>
        </div>

        <div v-else-if="currentDetail.analysisStatus === 'analyzing'" style="text-align: center; padding: 60px 0">
          <el-icon class="is-loading" :size="32"><i class="el-icon-loading" /></el-icon>
          <p style="margin-top: 12px; color: var(--el-text-color-secondary)">AI 正在分析中...</p>
        </div>

        <div v-else-if="currentDetail.analysisStatus === 'failed'" style="text-align: center; padding: 60px 0">
          <p style="color: var(--el-color-danger)">AI 分析失败</p>
          <el-button size="small" type="primary" @click="handleTriggerAnalysis(currentDetail)">重试</el-button>
        </div>

        <div v-else style="text-align: center; padding: 60px 0">
          <p style="color: var(--el-text-color-secondary)">尚未进行 AI 分析</p>
          <el-button size="small" type="primary" :loading="analyzingId === currentDetail.id" @click="handleTriggerAnalysis(currentDetail)">开始分析</el-button>
        </div>
      </el-tab-pane>
      </el-tabs>
    </div>
    <el-empty v-else description="暂无详情" />
  </el-dialog>

  <!-- 采集弹窗 -->
  <el-dialog
    v-model="showDialog"
    title="采集热搜"
    width="640px"
    :close-on-click-modal="!collectLoading"
  >
    <div class="dialog-section">
      <div class="dialog-section__title">执行环境</div>
      <el-form label-position="top" size="default">
        <el-form-item label="客户端">
          <el-select v-model="execContext.clientId" placeholder="选择客户端" style="width: 100%">
            <el-option v-for="c in clientList" :key="c.id" :label="c.label" :value="c.id">
              <span style="display: flex; align-items: center; gap: 6px">
                <span class="client-dot" :class="{ 'is-online': c.isOnline }" />
                {{ c.label }}
                <el-tag v-if="c.isOnline" size="small" type="success" effect="plain">在线</el-tag>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="浏览器环境（可选）">
          <el-select
            v-model="execContext.profileId"
            clearable
            placeholder="留空则使用默认环境"
            style="width: 100%"
          >
            <el-option
              v-for="p in getClientProfiles(execContext.clientId)"
              :key="p.id"
              :label="p.label"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <div class="dialog-section">
      <div class="dialog-section__title">网络环境</div>
      <el-radio-group v-model="selectedEnv">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="direct">国内直连</el-radio-button>
        <el-radio-button value="proxy">需代理</el-radio-button>
      </el-radio-group>
    </div>

    <div class="dialog-section">
      <div class="dialog-section__title">
        平台
        <el-checkbox
          v-model="selectAll"
          :indeterminate="isIndeterminate"
          @change="handleSelectAll"
          style="margin-left: 12px"
        >
          全选
        </el-checkbox>
      </div>
      <el-checkbox-group v-model="selectedPlatforms" class="platform-grid">
        <el-checkbox
          v-for="p in filteredPlatforms"
          :key="p.key"
          :value="p.key"
          :disabled="collectLoading"
          border
        >
          {{ p.name }}
        </el-checkbox>
      </el-checkbox-group>
    </div>

    <template #footer>
      <el-button @click="showDialog = false" :disabled="collectLoading">取消</el-button>
      <el-button
        type="primary"
        :loading="collectLoading"
        :disabled="!execContext.clientId || selectedPlatforms.length === 0"
        @click="triggerCollect"
      >
        采集 {{ selectedPlatforms.length }} 个平台
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { VxeGridProps } from "vxe-table";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import {
  pageHotsearch,
  deleteHotsearch,
  getSchedules,
  saveSchedule,
  toggleSchedule,
  deleteSchedule,
  triggerAnalysis,
} from "@/api/hotsearch-data";
import type { HotSearchCollectRecord, HotsearchSchedule } from "@/api/hotsearch-data";
import { useClientNodeState } from "@/services/clientNodeState";
import { getClientServiceRuntime } from "@/store/modules/clientNode";
import { buildOperationColumn, commonGridOptions } from "@/common/table";

defineOptions({ name: "HotSearch" });

// ============ 客户端列表 ============
const { clients } = useClientNodeState();
const clientList = computed(() =>
  clients.value
    .filter((c: any) => c.clientInfo?.deviceKey) // 只显示有 deviceKey 的客户端
    .map((c: any) => ({
      id: c.clientInfo.deviceKey, // 用 deviceKey 作为 ID，和客户端轮询一致
      label:
        c.clientInfo?.machine?.code ||
        c.clientInfo?.machine?.platform ||
        c.clientInfo.deviceKey.slice(0, 16),
      isOnline: c.isOnline,
    })),
);
const getClientLabel = (clientId: string) => {
  return clientList.value.find((c) => c.id === clientId)?.label || clientId.slice(0, 16);
};

// 从客户端 runtime 中提取浏览器 Profile 列表
const getClientProfiles = (clientId: string) => {
  if (!clientId) return [];
  // clientId 现在是 deviceKey，需要从 clients 中匹配
  const client = clients.value.find((c: any) => c.clientInfo?.deviceKey === clientId);
  if (!client) return [];
  const runtime = getClientServiceRuntime(client, "browser-automation");
  const details = runtime?.details || runtime || {};
  const items = Array.isArray(details.items)
    ? details.items
    : Array.isArray(details.profiles)
      ? details.profiles
      : [];
  return items
    .filter((p: any) => p?.id)
    .map((p: any) => ({
      id: p.id,
      label: p.name || p.label || p.id,
    }));
};

// ============ 平台定义 ============
interface PlatformDef {
  key: string;
  name: string;
  environment: "direct" | "proxy" | "browser";
}

const ALL_PLATFORMS: PlatformDef[] = [
  // 国内直连
  { key: "weibo", name: "微博", environment: "direct" },
  { key: "douyin", name: "抖音", environment: "direct" },
  { key: "bilibili", name: "哔哩哔哩", environment: "direct" },
  { key: "zhihu", name: "知乎", environment: "direct" },
  { key: "toutiao", name: "今日头条", environment: "direct" },
  { key: "douban", name: "豆瓣", environment: "direct" },
  { key: "kuaishou", name: "快手", environment: "direct" },
  { key: "v2ex", name: "V2EX", environment: "direct" },
  { key: "36kr", name: "36氪", environment: "direct" },
  { key: "huxiu", name: "虎嗅", environment: "direct" },
  { key: "sspai", name: "少数派", environment: "direct" },
  { key: "ithome", name: "IT之家", environment: "direct" },
  { key: "taobao_hot", name: "淘宝热搜", environment: "direct" },
  { key: "jd_hot", name: "京东热搜", environment: "direct" },
  { key: "pdd_hot", name: "拼多多热搜", environment: "direct" },
  // 国际新闻/趋势（需代理）
  { key: "github", name: "GitHub", environment: "direct" },
  { key: "wikipedia", name: "维基百科", environment: "direct" },
  { key: "devto", name: "Dev.to", environment: "direct" },
  { key: "npm_trending", name: "npm Trending", environment: "direct" },
  { key: "google_trends", name: "Google Trends", environment: "proxy" },
  { key: "hackernews", name: "Hacker News", environment: "proxy" },
  { key: "reddit", name: "Reddit", environment: "proxy" },
  { key: "producthunt", name: "Product Hunt", environment: "proxy" },
  { key: "bbc_news", name: "BBC News", environment: "proxy" },
  { key: "cnn", name: "CNN", environment: "proxy" },
  { key: "nytimes", name: "New York Times", environment: "proxy" },
  { key: "guardian", name: "The Guardian", environment: "proxy" },
  { key: "reuters", name: "Reuters", environment: "proxy" },
  { key: "aljazeera", name: "Al Jazeera", environment: "proxy" },
  { key: "yahoo_news", name: "Yahoo News", environment: "proxy" },
  { key: "medium", name: "Medium", environment: "proxy" },
  { key: "quora", name: "Quora", environment: "proxy" },
  { key: "flipboard", name: "Flipboard", environment: "proxy" },
  // 电商平台（需代理）
  { key: "amazon_bestsellers", name: "Amazon 畅销榜", environment: "proxy" },
  { key: "aliexpress_popular", name: "AliExpress 热门", environment: "proxy" },
  { key: "ebay_trending", name: "eBay Trending", environment: "proxy" },
  { key: "etsy_trending", name: "Etsy Trending", environment: "proxy" },
  { key: "shopify_trending", name: "Shopify Trending", environment: "proxy" },
];

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

const gridOptions = ref<VxeGridProps<HotSearchCollectRecord>>({
  ...(commonGridOptions as VxeGridProps<HotSearchCollectRecord>),
  rowConfig: { ...(commonGridOptions as any).rowConfig, keyField: "id" },
  checkboxConfig: { reserve: true },
  columns: [
    { type: "checkbox", width: 48 },
    { title: "采集时间", field: "fetchedAt", minWidth: 200, slots: { default: "timeSlot" } },
    { title: "状态", field: "status", width: 100, slots: { default: "statusSlot" } },
    { title: "平台", field: "platforms", minWidth: 260, slots: { default: "platformsSlot" } },
    {
      title: "条目数",
      field: "itemCount",
      width: 90,
      align: "center",
      slots: { default: "countSlot" },
    },
    {
      title: "成功率",
      field: "successCount",
      width: 80,
      align: "center",
      slots: { default: "rateSlot" },
    },
    {
      title: "AI分析",
      field: "analysisStatus",
      width: 90,
      align: "center",
      slots: { default: "analysisSlot" },
    },
    buildOperationColumn("operationSlot", 120),
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
    second: "2-digit",
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
    const res = await pageHotsearch({ currentPage: pageNo.value, pageSize: pageSize.value });
    tableData.value = res.list || [];
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
    // 更新本地状态
    row.analysisStatus = "analyzing";
  } catch (e: any) {
    ElMessage.error(`触发失败: ${e?.message || "未知错误"}`);
  } finally {
    analyzingId.value = null;
  }
};

const getDetailPlatformOrder = (record: HotSearchCollectRecord) => {
  if (!record.data) return [];
  return Object.keys(record.data).sort((a, b) => {
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

// ============ 采集弹窗 ============
const showDialog = ref(false);
const collectLoading = ref(false);
const execContext = ref<Record<string, any>>({ clientId: "", profileId: "", notes: "" });
const selectedEnv = ref<"all" | "direct" | "proxy">("direct");
const selectedPlatforms = ref<string[]>([]);

const filteredPlatforms = computed(() => {
  if (selectedEnv.value === "all") return ALL_PLATFORMS;
  return ALL_PLATFORMS.filter((p) => p.environment === selectedEnv.value);
});

const selectAll = computed({
  get: () =>
    filteredPlatforms.value.length > 0 &&
    selectedPlatforms.value.length === filteredPlatforms.value.length,
  set: () => {},
});
const isIndeterminate = computed(() => {
  const c = selectedPlatforms.value.length;
  return c > 0 && c < filteredPlatforms.value.length;
});
const handleSelectAll = (val: boolean) => {
  selectedPlatforms.value = val ? filteredPlatforms.value.map((p) => p.key) : [];
};

watch(selectedEnv, () => {
  const validKeys = new Set(filteredPlatforms.value.map((p) => p.key));
  selectedPlatforms.value = selectedPlatforms.value.filter((k) => validKeys.has(k));
});

const openCollectDialog = () => {
  // 默认选中第一个客户端（让浏览器环境下拉框有选项）
  if (!execContext.value.clientId) {
    execContext.value.clientId = clientList.value[0]?.id || "";
  }
  showDialog.value = true;
  if (!selectedPlatforms.value.length) {
    selectedEnv.value = "direct";
    selectedPlatforms.value = ALL_PLATFORMS.filter((p) => p.environment === "direct").map(
      (p) => p.key,
    );
  }
};

const triggerCollect = async () => {
  if (!execContext.value.clientId) {
    ElMessage.warning("请选择客户端");
    return;
  }
  if (!selectedPlatforms.value.length) {
    ElMessage.warning("请选择平台");
    return;
  }

  collectLoading.value = true;
  try {
    const res = await fetch("http://localhost:1519/api/hotsearch/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platforms: selectedPlatforms.value,
        reportToServer: true,
        clientId: execContext.value.clientId,
        profileId: execContext.value.profileId || undefined,
      }),
    });

    if (!res.ok) throw new Error(`客户端响应异常: ${res.status}`);
    const result = await res.json();

    if (result.success) {
      const { summary } = result;
      ElMessage.success(`采集完成: 成功 ${summary.success}, 失败 ${summary.failed}`);
      showDialog.value = false;
      pageNo.value = 1;
      await loadList();
    } else {
      throw new Error(result.message || "采集失败");
    }
  } catch (e: any) {
    ElMessage.error(`采集失败: ${e.message}`);
  } finally {
    collectLoading.value = false;
  }
};

// ============ 定时任务管理 ============
const schedules = ref<HotsearchSchedule[]>([]);
const showScheduleDialog = ref(false);
const scheduleSaving = ref(false);
const scheduleForm = ref({
  id: undefined as number | undefined,
  clientId: "",
  profileId: "",
  platforms: [] as string[],
  intervalMinutes: 60,
  environment: "all",
});

const currentSchedule = computed(() => schedules.value[0] || null);

const scheduleSelectAll = computed({
  get: () =>
    ALL_PLATFORMS.length > 0 && scheduleForm.value.platforms.length === ALL_PLATFORMS.length,
  set: () => {},
});
const scheduleIndeterminate = computed(() => {
  const c = scheduleForm.value.platforms.length;
  return c > 0 && c < ALL_PLATFORMS.length;
});
const handleScheduleSelectAll = (val: boolean) => {
  scheduleForm.value.platforms = val ? ALL_PLATFORMS.map((p) => p.key) : [];
};

const loadSchedules = async () => {
  try {
    const res = await getSchedules();
    // API 返回 { data: [...], code: 0 } 或直接是数组
    schedules.value = Array.isArray(res)
      ? res
      : Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];
  } catch {}
};

const openScheduleDialog = () => {
  const s = currentSchedule.value;
  // clientId 始终使用当前连接的客户端（保证一致）
  const fixedClientId = clientList.value[0]?.id || s?.clientId || "";
  if (s) {
    scheduleForm.value = {
      id: s.id,
      clientId: fixedClientId,
      profileId: "",
      platforms: s.platforms || [],
      intervalMinutes: s.intervalMinutes,
      environment: s.environment || "all",
    };
  } else {
    scheduleForm.value = {
      id: undefined,
      clientId: fixedClientId,
      profileId: "",
      platforms: ALL_PLATFORMS.filter((p) => p.environment === "direct").map((p) => p.key),
      intervalMinutes: 60,
      environment: "all",
    };
  }
  showScheduleDialog.value = true;
};

const handleSaveSchedule = async () => {
  if (!scheduleForm.value.clientId) {
    ElMessage.warning("请选择客户端");
    return;
  }
  if (!scheduleForm.value.platforms.length) {
    ElMessage.warning("请选择平台");
    return;
  }
  scheduleSaving.value = true;
  try {
    await saveSchedule(scheduleForm.value);
    ElMessage.success("已保存");
    showScheduleDialog.value = false;
    await loadSchedules();
  } catch {
    ElMessage.error("保存失败");
  } finally {
    scheduleSaving.value = false;
  }
};

const handleToggleSchedule = async (id: number, enabled: boolean) => {
  try {
    await toggleSchedule(id, enabled);
    ElMessage.success(enabled ? "已开启" : "已关闭");
    await loadSchedules();
  } catch {
    ElMessage.error("操作失败");
  }
};

const handleDeleteSchedule = async () => {
  if (!currentSchedule.value) return;
  try {
    await ElMessageBox.confirm("确定删除定时采集配置？", "确认", { type: "warning" });
    await deleteSchedule(currentSchedule.value.id);
    ElMessage.success("已删除");
    showScheduleDialog.value = false;
    await loadSchedules();
  } catch (e: any) {
    if (e !== "cancel") ElMessage.error("删除失败");
  }
};

// 定时轮询 schedules（和客户端保持同步）
let schedulePollTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  loadList();
  loadSchedules();
  schedulePollTimer = setInterval(loadSchedules, 15000);
});

onBeforeUnmount(() => {
  if (schedulePollTimer) {
    clearInterval(schedulePollTimer);
    schedulePollTimer = null;
  }
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
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}

:deep(.hotsearch-page .vxe-body--column .vxe-cell) {
  padding-top: 6px;
  padding-bottom: 6px;
}

/* 列表操作区 */
.list-page-filter__actions {
  display: flex;
  gap: 8px;
  padding: 0 0 12px;
}

/* 表格单元格 */
.primary-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.primary-cell__title {
  font-size: 13px;
  font-weight: 500;
}
.primary-cell__meta {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: monospace;
}

.inline-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.info-chip {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.info-chip--more {
  color: var(--el-text-color-secondary);
}

.metric-badge {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}
.metric-badge--success {
  color: var(--el-color-success);
}

.text-success {
  color: var(--el-color-success);
  font-weight: 600;
}
.text-warning {
  color: var(--el-color-warning);
  font-weight: 600;
}

.table-operation-cell__actions {
  display: flex;
  gap: 4px;
}

/* 详情弹窗 */
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

/* 弹窗 */
.dialog-section {
  margin-bottom: 20px;
}
.dialog-section__title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
}
/* 注: 不再隐藏最后一个 el-form-item，否则浏览器环境和采集平台会被隐藏 */
.platform-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.platform-grid .el-checkbox {
  margin-right: 0;
}

/* 定时采集状态栏 */
.schedule-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.schedule-bar__left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}
.schedule-bar__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.schedule-bar__info {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.schedule-bar__right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.client-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
  flex-shrink: 0;
  &.is-online {
    background: var(--el-color-success);
  }
}

/* AI 分析 */
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
.analysis-trends {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.analysis-trend-card {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.analysis-trend-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.analysis-trend-rank {
  font-weight: 700;
  color: var(--el-color-primary);
  font-size: 14px;
  min-width: 24px;
}
.analysis-trend-title {
  flex: 1;
  font-weight: 500;
  font-size: 14px;
}
.analysis-trend-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
.analysis-trend-platform {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
}
.analysis-pod-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}
.analysis-pod-card {
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.analysis-pod-element {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.analysis-pod-source {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.analysis-pod-products {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.analysis-pod-reason {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}
.analysis-pod-suggestion {
  font-size: 12px;
  color: var(--el-color-primary);
}
</style>
