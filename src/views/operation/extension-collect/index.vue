<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="extension-collect-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col
                class="list-page-search-form__col--wide"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6"
                :xl="5"
              >
                <el-form-item label="关键词">
                  <el-input
                    v-model="queryParams.search"
                    size="small"
                    placeholder="搜索标题/备注"
                    clearable
                    @change="
                      (val) => {
                        if (!val) getList();
                      }
                    "
                  />
                </el-form-item>
              </el-col>
              <el-col
                class="list-page-search-form__col--narrow"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="4"
                :xl="3"
              >
                <el-form-item label="采集类型">
                  <el-select
                    v-model="queryParams.collectType"
                    size="small"
                    placeholder="全部类型"
                    clearable
                    @change="getList"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="商品" value="product" />
                    <el-option label="文章" value="article" />
                    <el-option label="网页" value="web_page" />
                    <el-option label="趋势词" value="trend" />
                    <el-option label="图片批量" value="image_batch" />
                    <el-option label="文本片段" value="text_snippet" />
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
                >搜索</el-button
              >
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                :loading="deleteLoading"
                @click="handleDelete(null)"
                :disabled="!ids.length"
                >批量删除({{ ids.length }})</el-button
              >
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
                @checkbox-change="checkboxChange"
                @checkbox-all="checkboxAllChange"
              >
                <template #coverImageSlot="{ row }">
                  <el-image
                    v-if="getCoverImage(row)"
                    :src="getCoverImage(row)"
                    :preview-src-list="[getCoverImage(row)]"
                    fit="cover"
                    style="width: 60px; height: 60px; border-radius: 4px"
                    preview-teleported
                  />
                  <div v-else class="no-image">无图</div>
                </template>

                <template #titleSlot="{ row }">
                  <div class="collect-title">
                    <el-link
                      v-if="row.sourceUrl"
                      :href="row.sourceUrl"
                      target="_blank"
                      type="primary"
                      :underline="false"
                    >
                      {{ row.sourceTitle || row.data?.title || "-" }}
                    </el-link>
                    <span v-else>{{ row.sourceTitle || row.data?.title || "-" }}</span>
                  </div>
                  <div v-if="row.data?.price" class="collect-price">
                    {{ row.data.currency || "" }} {{ row.data.price }}
                  </div>
                </template>

                <template #collectTypeSlot="{ row }">
                  <el-tag :type="getTypeTagType(row.collectType)" size="small">
                    {{ getTypeLabel(row.collectType) }}
                  </el-tag>
                </template>

                <template #platformSlot="{ row }">
                  <el-tag v-if="row.data?.platform" type="info" size="small">
                    {{ row.data.platform }}
                  </el-tag>
                  <span v-else>-</span>
                </template>

                <template #aiAnalyzedSlot="{ row }">
                  <el-tag :type="row.aiAnalysis ? 'success' : 'info'" size="small">
                    {{ row.aiAnalysis ? "已分析" : "未分析" }}
                  </el-tag>
                </template>

                <template #tagsSlot="{ row }">
                  <div v-if="row.userTags && row.userTags.length" class="tag-list">
                    <el-tag
                      v-for="tag in row.userTags.slice(0, 3)"
                      :key="tag"
                      size="small"
                      class="tag-item"
                      >{{ tag }}</el-tag
                    >
                  </div>
                  <span v-else>-</span>
                </template>

                <template #createdAtSlot="{ row }">
                  <span>{{ formatTimestamp(row.createdAt) }}</span>
                </template>

                <template #operationDefaultSlot="{ row }">
                  <div class="flex items-center">
                    <el-dropdown
                      trigger="click"
                      @command="(command) => handleOperationCommand(command, row)"
                      class="operation-dropdown"
                    >
                      <el-button type="primary" link size="small" class="operation-trigger-button"
                        >操作</el-button
                      >
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="detail">
                            <el-icon><View /></el-icon><span>查看详情</span>
                          </el-dropdown-item>
                          <el-dropdown-item
                            command="delete"
                            divided
                            class="operation-menu-item--danger"
                          >
                            <el-icon><Delete /></el-icon><span>删除</span>
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
          <pagination
            :total="total"
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </template>
    </ListPageLayout>

    <!-- 全屏详情抽屉 -->
    <el-drawer
      v-model="detailVisible"
      title="采集详情"
      direction="rtl"
      size="100%"
      :destroy-on-close="true"
    >
      <div v-if="currentRecord" class="detail-fullscreen">
        <!-- 顶部信息栏 -->
        <div class="detail-header">
          <div class="detail-header__info">
            <el-tag :type="getTypeTagType(currentRecord.collectType)" size="large">
              {{ getTypeLabel(currentRecord.collectType) }}
            </el-tag>
            <span class="detail-header__title">{{
              currentRecord.sourceTitle || currentRecord.data?.title || "无标题"
            }}</span>
          </div>
          <div class="detail-header__meta">
            <span>ID: {{ currentRecord.id }}</span>
            <span>平台: {{ currentRecord.data?.platform || "-" }}</span>
            <span>时间: {{ formatTimestamp(currentRecord.createdAt) }}</span>
            <span
              >上传者:
              {{ currentRecord.uploader?.account || currentRecord.uploader?.name || "-" }}</span
            >
          </div>
          <div v-if="currentRecord.sourceUrl" class="detail-header__link">
            <el-link :href="currentRecord.sourceUrl" target="_blank" type="primary">
              {{ currentRecord.sourceUrl }}
            </el-link>
          </div>
        </div>

        <el-divider />

        <!-- 内容区域 - 根据类型动态渲染 -->
        <div class="detail-body">
          <!-- 商品类型 -->
          <template v-if="currentRecord.collectType === 'product'">
            <div class="detail-columns">
              <!-- 左侧：图片 -->
              <div class="detail-col detail-col--images">
                <h4>商品图片</h4>
                <div class="image-grid">
                  <el-image
                    v-for="(img, idx) in currentRecord.data?.images || []"
                    :key="idx"
                    :src="img"
                    :preview-src-list="currentRecord.data.images"
                    :initial-index="idx"
                    fit="cover"
                    class="image-grid__item"
                    preview-teleported
                  />
                </div>
              </div>

              <!-- 右侧：基本信息 -->
              <div class="detail-col detail-col--info">
                <h4>基本信息</h4>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="标题">{{
                    currentRecord.data?.title || "-"
                  }}</el-descriptions-item>
                  <el-descriptions-item label="价格">
                    <span class="price-highlight"
                      >{{ currentRecord.data?.currency || "" }}
                      {{ currentRecord.data?.price || "-" }}</span
                    >
                  </el-descriptions-item>
                  <el-descriptions-item label="品牌">{{
                    currentRecord.data?.brand || "-"
                  }}</el-descriptions-item>
                  <el-descriptions-item v-if="currentRecord.data?.rating" label="评分">
                    {{ currentRecord.data.rating.value }}/{{ currentRecord.data.rating.max }}
                  </el-descriptions-item>
                  <el-descriptions-item v-if="currentRecord.data?.reviewCount" label="评论数">
                    {{ currentRecord.data.reviewCount.count }}
                  </el-descriptions-item>
                  <el-descriptions-item v-if="currentRecord.data?.seller" label="卖家">
                    {{ currentRecord.data.seller.name || "-" }}
                  </el-descriptions-item>
                  <el-descriptions-item v-if="currentRecord.data?.category?.length" label="分类">
                    {{ currentRecord.data.category.join(" > ") }}
                  </el-descriptions-item>
                </el-descriptions>

                <!-- 规格参数 -->
                <template
                  v-if="
                    currentRecord.data?.specifications &&
                    Object.keys(currentRecord.data.specifications).length
                  "
                >
                  <h4 style="margin-top: 20px">规格参数</h4>
                  <el-table
                    :data="
                      Object.entries(currentRecord.data.specifications).map(([k, v]) => ({
                        key: k,
                        value: v,
                      }))
                    "
                    size="small"
                    border
                  >
                    <el-table-column prop="key" label="参数" width="180" />
                    <el-table-column prop="value" label="值" />
                  </el-table>
                </template>

                <!-- 描述 -->
                <template v-if="currentRecord.data?.description">
                  <h4 style="margin-top: 20px">商品描述</h4>
                  <div class="description-content">{{ currentRecord.data.description }}</div>
                </template>
              </div>
            </div>
          </template>

          <!-- 文章类型 -->
          <template v-else-if="currentRecord.collectType === 'article'">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="标题" :span="2">{{
                currentRecord.data?.title || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="作者">{{
                currentRecord.data?.author || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="发布时间">{{
                currentRecord.data?.publishDate || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="字数">{{
                currentRecord.data?.wordCount || "-"
              }}</el-descriptions-item>
              <el-descriptions-item v-if="currentRecord.data?.tags?.length" label="标签">
                <el-tag
                  v-for="tag in currentRecord.data.tags"
                  :key="tag"
                  size="small"
                  class="tag-item"
                  >{{ tag }}</el-tag
                >
              </el-descriptions-item>
            </el-descriptions>
            <h4 style="margin-top: 20px">正文内容</h4>
            <div class="article-content">{{ currentRecord.data?.content || "无内容" }}</div>
          </template>

          <!-- 网页类型 -->
          <template v-else-if="currentRecord.collectType === 'web_page'">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="标题" :span="2">{{
                currentRecord.data?.title || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="描述" :span="2">{{
                currentRecord.data?.description || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="类型">{{
                currentRecord.data?.ogType || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="网站">{{
                currentRecord.data?.siteName || "-"
              }}</el-descriptions-item>
            </el-descriptions>
            <template v-if="currentRecord.data?.content">
              <h4 style="margin-top: 20px">页面内容</h4>
              <div class="article-content">{{ currentRecord.data.content }}</div>
            </template>
          </template>

          <!-- 趋势词类型 -->
          <template v-else-if="currentRecord.collectType === 'trend'">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="来源" :span="2">{{
                currentRecord.data?.source || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="时间范围">{{
                currentRecord.data?.timeRange || "-"
              }}</el-descriptions-item>
            </el-descriptions>
            <template v-if="currentRecord.data?.keywords?.length">
              <h4 style="margin-top: 20px">关键词列表</h4>
              <div class="keyword-cloud">
                <el-tag
                  v-for="(kw, idx) in currentRecord.data.keywords"
                  :key="idx"
                  size="large"
                  class="keyword-tag"
                >
                  {{ typeof kw === "string" ? kw : kw.word || kw.keyword || JSON.stringify(kw) }}
                </el-tag>
              </div>
            </template>
            <template v-if="currentRecord.data?.trends">
              <h4 style="margin-top: 20px">趋势数据</h4>
              <el-input
                type="textarea"
                :model-value="JSON.stringify(currentRecord.data.trends, null, 2)"
                :rows="10"
                readonly
              />
            </template>
          </template>

          <!-- 图片批量类型 -->
          <template v-else-if="currentRecord.collectType === 'image_batch'">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="页面标题" :span="2">{{
                currentRecord.data?.pageTitle || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="图片数量">{{
                currentRecord.data?.images?.length || 0
              }}</el-descriptions-item>
            </el-descriptions>
            <h4 style="margin-top: 20px">图片列表</h4>
            <div class="image-grid">
              <el-image
                v-for="(img, idx) in currentRecord.data?.images || []"
                :key="idx"
                :src="typeof img === 'string' ? img : img.url"
                :preview-src-list="
                  (currentRecord.data?.images || []).map((i) => (typeof i === 'string' ? i : i.url))
                "
                :initial-index="idx"
                fit="cover"
                class="image-grid__item"
                preview-teleported
              />
            </div>
          </template>

          <!-- 文本片段类型 -->
          <template v-else-if="currentRecord.collectType === 'text_snippet'">
            <h4>选中的文本</h4>
            <div class="text-snippet">{{ currentRecord.data?.selectedText || "-" }}</div>
            <template v-if="currentRecord.data?.surroundingText">
              <h4 style="margin-top: 20px">上下文</h4>
              <div class="article-content">{{ currentRecord.data.surroundingText }}</div>
            </template>
          </template>

          <!-- 其他未知类型 - 通用 JSON 展示 -->
          <template v-else>
            <h4>采集数据</h4>
            <el-input
              type="textarea"
              :model-value="JSON.stringify(currentRecord.data, null, 2)"
              :rows="15"
              readonly
            />
          </template>
        </div>

        <el-divider />

        <!-- AI 分析结果 -->
        <div v-if="currentRecord.aiAnalysis" class="detail-section">
          <h3>AI 分析结果</h3>
          <div class="ai-analysis">
            <div v-if="currentRecord.aiAnalysis.summary" class="analysis-item">
              <strong>总结：</strong>{{ currentRecord.aiAnalysis.summary }}
            </div>
            <div v-if="currentRecord.aiAnalysis.sellingPoints?.length" class="analysis-item">
              <strong>卖点：</strong>
              <ul>
                <li v-for="(point, idx) in currentRecord.aiAnalysis.sellingPoints" :key="idx">
                  {{ point }}
                </li>
              </ul>
            </div>
            <div v-if="currentRecord.aiAnalysis.targetAudience" class="analysis-item">
              <strong>目标人群：</strong>{{ currentRecord.aiAnalysis.targetAudience }}
            </div>
            <div v-if="currentRecord.aiAnalysis.priceAnalysis" class="analysis-item">
              <strong>价格分析：</strong>{{ currentRecord.aiAnalysis.priceAnalysis }}
            </div>
            <div
              v-if="currentRecord.aiAnalysis.competitiveAdvantages?.length"
              class="analysis-item"
            >
              <strong>竞争优势：</strong>
              <ul>
                <li v-for="(adv, idx) in currentRecord.aiAnalysis.competitiveAdvantages" :key="idx">
                  {{ adv }}
                </li>
              </ul>
            </div>
            <div v-if="currentRecord.aiAnalysis.potentialIssues?.length" class="analysis-item">
              <strong>潜在问题：</strong>
              <ul>
                <li v-for="(issue, idx) in currentRecord.aiAnalysis.potentialIssues" :key="idx">
                  {{ issue }}
                </li>
              </ul>
            </div>
            <div v-if="currentRecord.aiAnalysis.suggestedKeywords?.length" class="analysis-item">
              <strong>建议关键词：</strong>
              <el-tag
                v-for="kw in currentRecord.aiAnalysis.suggestedKeywords"
                :key="kw"
                size="small"
                class="tag-item"
                >{{ kw }}</el-tag
              >
            </div>
            <div v-if="currentRecord.aiAnalysis.categorySuggestion" class="analysis-item">
              <strong>建议分类：</strong>{{ currentRecord.aiAnalysis.categorySuggestion }}
            </div>
            <div v-if="currentRecord.aiAnalysis.podElements?.length" class="analysis-item">
              <strong>POD 元素：</strong>
              <el-tag
                v-for="elem in currentRecord.aiAnalysis.podElements"
                :key="elem"
                size="small"
                type="warning"
                class="tag-item"
                >{{ elem }}</el-tag
              >
            </div>
            <div v-if="currentRecord.aiAnalysis.qualityScore" class="analysis-item">
              <strong>质量评分：</strong>{{ currentRecord.aiAnalysis.qualityScore }}/10
            </div>
            <div v-if="currentRecord.aiAnalysis.marketPotential" class="analysis-item">
              <strong>市场潜力：</strong>
              <el-tag
                :type="
                  currentRecord.aiAnalysis.marketPotential === 'high'
                    ? 'success'
                    : currentRecord.aiAnalysis.marketPotential === 'medium'
                      ? 'warning'
                      : 'info'
                "
                size="small"
              >
                {{ currentRecord.aiAnalysis.marketPotential }}
              </el-tag>
            </div>
          </div>
          <div class="ai-meta">
            <span>模型：{{ currentRecord.aiAnalysis.model || "-" }}</span>
            <span>提供商：{{ currentRecord.aiAnalysis.provider || "-" }}</span>
          </div>
        </div>

        <!-- 用户备注 -->
        <div v-if="currentRecord.userNotes" class="detail-section">
          <h3>用户备注</h3>
          <p>{{ currentRecord.userNotes }}</p>
        </div>

        <!-- 原始 JSON（调试用） -->
        <div class="detail-section">
          <h3>
            原始数据
            <el-button size="small" link @click="showRawJson = !showRawJson">
              {{ showRawJson ? "收起" : "展开" }}
            </el-button>
          </h3>
          <el-collapse-transition>
            <el-input
              v-show="showRawJson"
              type="textarea"
              :model-value="JSON.stringify(currentRecord.data, null, 2)"
              :rows="10"
              readonly
              style="font-family: monospace"
            />
          </el-collapse-transition>
        </div>
      </div>
    </el-drawer>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watchEffect } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Delete, View } from "@element-plus/icons-vue";
import { ExtensionCollectApi } from "@/api/operation/extensionCollect";
import { buildOperationColumn, commonGridOptions } from "@/common/table";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import Pagination from "@/components/Pagination/index.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import { useWindowSize } from "@vueuse/core";

const { height } = useWindowSize();

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  search: "",
  collectType: "",
});

const gridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: { keyField: "id" },
  checkboxConfig: { reserve: true },
  columns: [
    { type: "checkbox", width: 50, ellipsis: true, reserve: true },
    { title: "ID", field: "id", width: 70 },
    { title: "封面", field: "coverImage", width: 80, slots: { default: "coverImageSlot" } },
    { title: "标题/价格", field: "sourceTitle", minWidth: 250, slots: { default: "titleSlot" } },
    { title: "类型", field: "collectType", width: 90, slots: { default: "collectTypeSlot" } },
    { title: "平台", field: "platform", width: 90, slots: { default: "platformSlot" } },
    { title: "AI分析", field: "aiAnalysis", width: 80, slots: { default: "aiAnalyzedSlot" } },
    { title: "标签", field: "userTags", width: 150, slots: { default: "tagsSlot" } },
    {
      title: "上传者",
      field: "uploader",
      width: 100,
      formatter: ({ row }) => row?.uploader?.account || row?.uploader?.name || "-",
    },
    { title: "创建时间", field: "createdAt", width: 150, slots: { default: "createdAtSlot" } },
    buildOperationColumn("operationDefaultSlot"),
  ],
} as any);

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 280;
});

const dataSource = ref<any[]>([]);
const loading = ref(false);
const ids = ref<number[]>([]);
const total = ref(0);
const deleteLoading = ref(false);

const detailVisible = ref(false);
const currentRecord = ref<any>(null);
const showRawJson = ref(false);

function getCoverImage(row: any) {
  return row.data?.coverImage || row.data?.images?.[0] || null;
}

async function getList() {
  loading.value = true;
  try {
    const params: any = { ...queryParams };
    if (!params.collectType) delete params.collectType;
    const res = await ExtensionCollectApi.getPage(params);
    dataSource.value = res.list || [];
    total.value = res.total || 0;
    ids.value = [];
  } catch (error) {
    console.error("获取列表失败:", error);
    ElMessage.error("获取列表失败");
  } finally {
    loading.value = false;
  }
}

function checkboxChange(e: any) {
  const records = Array.isArray(e.records) ? e.records : [];
  const reserves = Array.isArray(e.reserves) ? e.reserves : [];
  ids.value = [...records.map((item: any) => item.id), ...reserves.map((item: any) => item.id)];
}

function checkboxAllChange(e: any) {
  checkboxChange(e);
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    product: "商品",
    article: "文章",
    web_page: "网页",
    trend: "趋势词",
    image_batch: "图片批量",
    text_snippet: "文本片段",
  };
  return map[type] || type;
}

function getTypeTagType(type: string) {
  const map: Record<string, string> = {
    product: "danger",
    article: "warning",
    web_page: "",
    trend: "success",
    image_batch: "info",
    text_snippet: "info",
  };
  return map[type] || "";
}

function formatTimestamp(date: Date | string) {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function handleViewDetail(row: any) {
  currentRecord.value = row;
  showRawJson.value = false;
  detailVisible.value = true;
}

async function handleDelete(row?: any | null) {
  let delIds: number[] = [];
  if (row) {
    delIds = [row.id];
  } else if (ids.value.length) {
    delIds = [...ids.value];
  } else {
    return ElMessage.warning("请选择要删除的数据");
  }

  try {
    await ElMessageBox.confirm(`确认删除选中的 ${delIds.length} 条数据吗？`, "删除提示", {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return;
  }

  deleteLoading.value = true;
  try {
    for (const id of delIds) {
      await ExtensionCollectApi.delete(id);
    }
    ElMessage.success("删除成功");
    await getList();
  } catch (error) {
    ElMessage.error("删除失败");
  } finally {
    deleteLoading.value = false;
  }
}

function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case "detail":
      handleViewDetail(row);
      break;
    case "delete":
      handleDelete(row);
      break;
  }
}

onMounted(getList);
</script>

<style scoped>
:deep(.extension-collect-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.extension-collect-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.extension-collect-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.extension-collect-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}

.collect-title {
  font-size: 14px;
  line-height: 1.5;
}

.collect-price {
  font-weight: 600;
  font-size: 13px;
  margin-top: 4px;
}

.no-image {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  border-radius: 4px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-item {
  margin-right: 4px;
  margin-bottom: 2px;
}

/* 全屏详情样式 */
.detail-fullscreen {
  padding: 0 24px 24px;
}

.detail-header {
  margin-bottom: 16px;
}

.detail-header__info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.detail-header__title {
  font-size: 20px;
  font-weight: 600;
}

.detail-header__meta {
  display: flex;
  gap: 20px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 8px;
}

.detail-header__link {
  font-size: 13px;
}

.detail-body {
  margin: 20px 0;
}

.detail-columns {
  display: flex;
  gap: 24px;
}

.detail-col {
  flex: 1;
}

.detail-col--images {
  flex: 0 0 400px;
}

.detail-col--info {
  flex: 1;
  min-width: 0;
}

.detail-columns h4 {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.image-grid__item {
  width: 120px;
  height: 120px;
  border-radius: 8px;
}

.price-highlight {
  font-size: 18px;
  font-weight: 600;
}

.description-content,
.article-content {
  border-radius: 8px;
  padding: 16px;
  line-height: 1.8;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
  background: var(--el-fill-color-light);
}

.article-content {
  max-height: 500px;
}

.text-snippet {
  border-left: 4px solid var(--el-color-warning);
  border-radius: 4px;
  padding: 16px;
  font-size: 16px;
  line-height: 1.8;
  background: var(--el-fill-color-lighter);
}

.keyword-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  font-size: 14px;
}

.detail-section {
  margin-top: 24px;
}

.detail-section h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-analysis {
  border-radius: 8px;
  padding: 20px;
  background: var(--el-fill-color-light);
}

.analysis-item {
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.8;
}

.analysis-item ul {
  margin: 4px 0 0 20px;
  padding: 0;
}

.analysis-item li {
  margin: 4px 0;
}

.ai-meta {
  margin-top: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  display: flex;
  gap: 20px;
}
</style>
