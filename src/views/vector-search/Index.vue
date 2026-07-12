<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="vector-search-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="分类">
                  <el-select
                    v-model="queryParams.collection"
                    size="small"
                    placeholder="全部分类"
                    popper-class="vector-collection-select-popper"
                    clearable
                    @change="handleSearch"
                  >
                    <el-option
                      v-for="def in collectionDefs"
                      :key="def.name"
                      :label="def.label"
                      :value="def.name"
                    >
                      <div class="vector-collection-option">
                        <div class="vector-collection-option__main">
                          <span class="vector-collection-option__label">{{ def.label }}</span>
                          <el-tag size="small" effect="plain" :type="getVectorTypeTagType(def)">
                            {{ getVectorTypeLabel(def) }}
                          </el-tag>
                          <el-tag v-if="def.internal" size="small" effect="plain" type="warning">
                            内部索引
                          </el-tag>
                          <span class="vector-collection-option__name">{{ def.name }}</span>
                        </div>
                        <div class="vector-collection-option__desc">
                          {{ getCollectionOptionDescription(def) }}
                        </div>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="搜索">
                  <el-input
                    v-model="queryParams.keyword"
                    size="small"
                    placeholder="摘要 / Source ID"
                    clearable
                    @keyup.enter="handleSearch"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" :disabled="loading" @click="handleSearch">
                查询
              </el-button>
              <el-button size="small" type="success" @click="openCreateDialog">新增</el-button>
              <el-button size="small" plain @click="openOperationsDialog">更多操作</el-button>
              <el-button
                size="small"
                type="danger"
                :disabled="loading || selectedIds.length === 0"
                @click="handleBatchDelete"
              >
                删除选中 ({{ selectedIds.length }})
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
                :data="records"
                :loading="loading"
                @checkbox-change="checkboxChange"
                @checkbox-all="checkboxAllChange"
              >
                <template #summarySlot="{ row }">
                  <span class="table-meta-text">{{ row.summary || "-" }}</span>
                </template>
                <template #collectionSlot="{ row }">
                  <div class="vector-collection-cell">
                    <el-tag size="small" :type="getCollectionTagType(row.collection)" effect="plain">
                      {{ getCollectionLabel(row.collection) }}
                    </el-tag>
                    <span class="vector-collection-cell__name">{{ row.collection }}</span>
                  </div>
                </template>
                <template #statusSlot="{ row }">
                  <el-tag
                    v-if="row.status === 'active' || row.status === 'indexed'"
                    type="success"
                    size="small"
                    effect="plain"
                    >正常</el-tag
                  >
                  <el-tag
                    v-else-if="row.status === 'deleted'"
                    type="danger"
                    size="small"
                    effect="plain"
                    >已删除</el-tag
                  >
                  <el-tag v-else type="info" size="small" effect="plain">{{
                    row.status || "未知"
                  }}</el-tag>
                </template>
                <template #operationDefaultSlot="{ row }">
                  <div class="flex items-center">
                    <el-dropdown
                      trigger="click"
                      @command="(command: string) => handleOperationCommand(command, row)"
                      class="operation-dropdown"
                    >
                      <el-button type="primary" link size="small" class="operation-trigger-button">
                        操作
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="detail">
                            <span>详情</span>
                          </el-dropdown-item>
                          <el-dropdown-item
                            command="delete"
                            divided
                            class="operation-menu-item--danger"
                          >
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
            :total="pagination.total"
            v-model:page="pagination.page"
            v-model:limit="pagination.pageSize"
            @pagination="loadRecords"
          />
        </div>
      </template>
    </ListPageLayout>

    <el-dialog v-model="operationsVisible" title="向量知识库操作" width="760px" destroy-on-close>
      <div class="vector-operation-list">
        <div class="vector-operation-item">
          <div class="vector-operation-item__main">
            <div class="vector-operation-item__title">构建基础模块索引</div>
            <div class="vector-operation-item__desc">
              构建贴纸图片、字体模板、文案句子、PSD 模板和文本文档索引；已构建且未变化的记录会自动跳过。
            </div>
          </div>
          <el-button type="primary" plain @click="openBuildBaseDialog">
            构建
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="记录详情" width="560px" destroy-on-close>
      <template v-if="detailRecord">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="ID">{{ detailRecord.id }}</el-descriptions-item>
          <el-descriptions-item label="分类">
            {{ getCollectionLabel(detailRecord.collection) }}
          </el-descriptions-item>
          <el-descriptions-item label="Source ID">{{ detailRecord.sourceId }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="detailRecord.status === 'active' ? 'success' : 'info'" size="small">
              {{ detailRecord.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="User ID">{{
            detailRecord.userId || "-"
          }}</el-descriptions-item>
          <el-descriptions-item label="索引时间">{{
            formatTime(detailRecord.indexedAt)
          }}</el-descriptions-item>
          <el-descriptions-item label="Embedding Hash" :span="2">
            <span class="mono-text">{{ detailRecord.embeddingHash }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="摘要" :span="2">{{
            detailRecord.summary
          }}</el-descriptions-item>
          <el-descriptions-item label="Embedding Text" :span="2">
            <div class="embedding-text">{{ detailRecord.embeddingText }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>

    <el-dialog
      v-model="buildBaseVisible"
      title="构建基础模块索引"
      width="680px"
      destroy-on-close
    >
      <el-form :model="buildBaseForm" label-width="96px" class="build-sticker-vector-form">
        <el-form-item label="构建范围">
          <el-checkbox-group v-model="buildBaseForm.collections">
            <el-checkbox label="sticker-images">贴纸图片</el-checkbox>
            <el-checkbox label="fonts">字体模板</el-checkbox>
            <el-checkbox label="sentences">文案句子</el-checkbox>
            <el-checkbox label="psd-templates">PSD 模板</el-checkbox>
            <el-checkbox label="text-documents">文本文档</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="批大小">
          <el-input-number
            v-model="buildBaseForm.batchSize"
            :min="10"
            :max="300"
            :step="10"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="过滤">
          <el-checkbox v-model="buildBaseForm.onlyCustom">贴纸图片只处理自定义贴纸</el-checkbox>
        </el-form-item>
        <el-form-item label="重建策略">
          <el-checkbox v-model="buildBaseForm.force">
            强制重建已构建的向量
          </el-checkbox>
          <div class="build-sticker-vector-tip">
            默认会按图片 URL、记录哈希或文本内容哈希跳过已构建且未变化的记录。
          </div>
        </el-form-item>
      </el-form>

      <div v-if="buildBaseResult" class="build-sticker-vector-result">
        <div class="build-sticker-vector-result__summary">
          <el-tag size="small" type="success" effect="plain">构建结果</el-tag>
          <span>扫描 {{ buildBaseResult.total }} 条</span>
          <span>构建 {{ buildBaseResult.indexed }} 条</span>
          <span>跳过 {{ buildBaseResult.skipped }} 条</span>
          <span>失败 {{ buildBaseResult.failed }} 条</span>
        </div>
        <div class="build-sticker-vector-result__details">
          <div
            v-for="item in baseVectorResultDetails"
            :key="item.collection"
          >
            {{ item.label }}：构建 {{ item.indexed }}，跳过 {{ item.skipped }}，失败 {{ item.failed }}
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="buildBaseVisible = false">关闭</el-button>
        <el-button type="primary" :loading="buildBaseLoading" @click="handleBuildBaseVectors">
          开始构建
        </el-button>
      </template>
    </el-dialog>

    <!-- 新增弹窗 -->
    <el-dialog
      v-model="createVisible"
      title="新增向量记录"
      width="520px"
      destroy-on-close
      @closed="resetCreateForm"
    >
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <el-form-item label="分类" prop="collection">
          <el-select
            v-model="createForm.collection"
            placeholder="请选择分类"
            popper-class="vector-collection-select-popper"
            style="width: 100%"
          >
            <el-option
              v-for="def in manualCollectionDefs"
              :key="def.name"
              :label="`${def.label}（${def.name}）`"
              :value="def.name"
            >
              <div class="vector-collection-option">
                <div class="vector-collection-option__main">
                  <span class="vector-collection-option__label">{{ def.label }}</span>
                  <span class="vector-collection-option__name">{{ def.name }}</span>
                </div>
                <div class="vector-collection-option__desc">
                  {{ getCollectionOptionDescription(def) }}
                </div>
              </div>
            </el-option>
          </el-select>
          <div v-if="!manualCollectionDefs.length" class="create-form-tip">
            当前没有支持手动新增文本向量的分类。
          </div>
        </el-form-item>
        <el-form-item label="Source ID">
          <el-input v-model="createForm.sourceId" placeholder="选填，不填则自动生成" />
        </el-form-item>
        <el-form-item label="文本内容" prop="text">
          <el-input
            v-model="createForm.text"
            type="textarea"
            :rows="6"
            placeholder="用于生成向量 embedding 的文本内容"
          />
        </el-form-item>
        <el-form-item label="元数据">
          <el-input
            v-model="createForm.metadataJson"
            type="textarea"
            :rows="3"
            placeholder='选填，JSON 格式，如 { "keywords": "简约,科技" }'
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type { VxeGridProps } from "vxe-table";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import {
  getCollectionDefinitions,
  getVectorRecords,
  getVectorRecord,
  deleteVectorRecord,
  indexVectorRecord,
  reindexContentVectors,
  reindexStickerVectors,
  type CollectionDefinition,
  type ContentVectorBuildResult,
  type StickerVectorReindexResult,
  type VectorRecord,
} from "@/api/vector-search";

defineOptions({ name: "VectorSearch" });

// ============ Collection 定义 ============
const collectionDefs = ref<CollectionDefinition[]>([]);
const manualCollectionDefs = computed(() =>
  collectionDefs.value.filter((def) => def.manualIndexable !== false && def.vectorType !== "image"),
);

function getCollectionLabel(name: string): string {
  const def = collectionDefs.value.find((d) => d.name === name);
  return def?.label || name;
}

function getCollectionDefinition(name: string) {
  return collectionDefs.value.find((d) => d.name === name);
}

function getVectorTypeLabel(def: CollectionDefinition): string {
  return def.vectorType === "image" ? "图片向量" : "文本向量";
}

function getVectorTypeTagType(def: CollectionDefinition) {
  return def.vectorType === "image" ? "success" : "info";
}

function getCollectionOptionDescription(def: CollectionDefinition): string {
  const role = def.role || def.description || "";
  const source = def.dataSource ? `来源：${def.dataSource}` : "";
  return [role, source].filter(Boolean).join(" / ");
}

function getCollectionTagType(name: string) {
  const def = getCollectionDefinition(name);
  if (def?.vectorType === "image") return "success";
  if (def?.internal) return "warning";
  return "info";
}

// ============ 查询参数 ============
const queryParams = reactive({
  collection: "",
  keyword: "",
});

// ============ 列表数据 ============
const loading = ref(false);
const records = ref<VectorRecord[]>([]);
const selectedIds = ref<number[]>([]);

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

// ============ vxe-grid 配置 ============
const gridOptions = computed<VxeGridProps>(() => ({
  ...commonGridOptions,
  columns: [
    { type: "checkbox", width: 50 },
    { field: "id", title: "ID", width: 70 },
    { field: "summary", title: "摘要", minWidth: 260, slots: { default: "summarySlot" } },
    { field: "collection", title: "分类", width: 120, slots: { default: "collectionSlot" } },
    { field: "status", title: "状态", width: 90, slots: { default: "statusSlot" } },
    buildTimeColumn("索引时间", "indexedAt", 170),
    buildOperationColumn(),
  ],
  rowConfig: { keyField: "id" },
  checkboxConfig: { reserve: true },
}));

// ============ 选中逻辑 ============
function checkboxChange({ records: checkedRecords }: { records: VectorRecord[] }) {
  syncSelection(checkedRecords);
}
function checkboxAllChange({ records: checkedRecords }: { records: VectorRecord[] }) {
  syncSelection(checkedRecords);
}
function syncSelection(checkedRecords: VectorRecord[]) {
  selectedIds.value = checkedRecords.map((r) => r.id);
}

// ============ 操作分发 ============
async function handleOperationCommand(command: string, row: VectorRecord) {
  if (command === "detail") {
    await handleViewDetail(row);
  } else if (command === "delete") {
    await handleDelete(row);
  }
}

async function loadRecords() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
    if (queryParams.collection) {
      params.collection = queryParams.collection;
    }
    const data = await getVectorRecords(params);

    let items = data?.items ?? [];
    if (queryParams.keyword) {
      const kw = queryParams.keyword.toLowerCase();
      items = items.filter(
        (item) =>
          (item.summary && item.summary.toLowerCase().includes(kw)) ||
          (item.sourceId && item.sourceId.toLowerCase().includes(kw)),
      );
    }

    records.value = items;
    pagination.total = data?.total ?? 0;
  } catch (error: any) {
    ElMessage.error(error?.message || "加载记录失败");
    records.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  selectedIds.value = [];
  loadRecords();
}

// ============ 删除 ============
async function handleDelete(row: VectorRecord) {
  try {
    await deleteVectorRecord(String(row.id));
    ElMessage.success("删除成功");
    if (records.value.length === 1 && pagination.page > 1) {
      pagination.page--;
    }
    await loadRecords();
  } catch (error: any) {
    ElMessage.error(error?.message || "删除失败");
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return;
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条记录？`, "批量删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return;
  }
  let successCount = 0;
  let failCount = 0;
  for (const id of selectedIds.value) {
    try {
      await deleteVectorRecord(String(id));
      successCount++;
    } catch {
      failCount++;
    }
  }
  if (failCount === 0) {
    ElMessage.success(`成功删除 ${successCount} 条记录`);
  } else {
    ElMessage.warning(`删除完成：成功 ${successCount} 条，失败 ${failCount} 条`);
  }
  selectedIds.value = [];
  pagination.page = 1;
  await loadRecords();
}

// ============ 详情弹窗 ============
const detailVisible = ref(false);
const detailRecord = ref<VectorRecord | null>(null);

async function handleViewDetail(row: VectorRecord) {
  try {
    const data = await getVectorRecord(String(row.id));
    detailRecord.value = data ?? row;
  } catch {
    detailRecord.value = row;
  }
  detailVisible.value = true;
}

// ============ 构建基础向量索引 ============
const operationsVisible = ref(false);
const buildBaseVisible = ref(false);
const buildBaseLoading = ref(false);
const buildBaseResult = ref<{
  total: number;
  indexed: number;
  skipped: number;
  failed: number;
  sticker?: StickerVectorReindexResult;
  content?: ContentVectorBuildResult;
} | null>(null);

const buildBaseForm = reactive({
  collections: ["sticker-images", "fonts", "sentences", "psd-templates", "text-documents"] as string[],
  batchSize: 50,
  force: false,
  onlyCustom: false,
});

const baseVectorLabels: Record<string, string> = {
  "sticker-images": "贴纸图片",
  fonts: "字体模板",
  sentences: "文案句子",
  "psd-templates": "PSD 模板",
  "text-documents": "文本文档",
};

const contentCollections = ["fonts", "sentences", "psd-templates", "text-documents"];

const baseVectorResultDetails = computed(() =>
  buildBaseForm.collections.map((collection) => {
    if (collection === "sticker-images") {
      const detail = buildBaseResult.value?.sticker?.details?.stickerImages;
      return {
        collection,
        label: baseVectorLabels[collection],
        indexed: detail?.indexed || 0,
        skipped: detail?.skipped || 0,
        failed: detail?.failed || 0,
      };
    }

    const contentDetails = buildBaseResult.value?.content?.details;
    const detail = contentDetails?.[collection as keyof NonNullable<ContentVectorBuildResult["details"]>];
    return {
      collection,
      label: baseVectorLabels[collection] || collection,
      indexed: detail?.indexed || 0,
      skipped: detail?.skipped || 0,
      failed: detail?.failed || 0,
    };
  }),
);

function openOperationsDialog() {
  operationsVisible.value = true;
}

function openBuildBaseDialog() {
  operationsVisible.value = false;
  buildBaseResult.value = null;
  buildBaseVisible.value = true;
}

function buildStickerVectorPayload(collections: string[]) {
  return {
    batchSize: buildBaseForm.batchSize,
    dryRun: false,
    force: buildBaseForm.force,
    collections,
    filters: buildBaseForm.onlyCustom ? { isCustom: true } : {},
  };
}

function buildContentVectorPayload(collections: string[]) {
  return {
    batchSize: buildBaseForm.batchSize,
    dryRun: false,
    force: buildBaseForm.force,
    collections,
    filters: {},
  };
}

async function handleBuildBaseVectors() {
  if (!buildBaseForm.collections.length) {
    ElMessage.warning("请选择至少一个构建范围");
    return;
  }

  try {
    await ElMessageBox.confirm(
      buildBaseForm.force
        ? "强制重建会重新生成已存在的向量，确认开始？"
        : "确认开始构建基础模块索引？已构建且未变化的记录会自动跳过。",
      "构建基础模块索引",
      {
        confirmButtonText: "开始",
        cancelButtonText: "取消",
        type: buildBaseForm.force ? "warning" : "info",
      },
    );
  } catch {
    return;
  }

  const stickerCollections = buildBaseForm.collections.filter((collection) => collection === "sticker-images");
  const selectedContentCollections = buildBaseForm.collections.filter((collection) =>
    contentCollections.includes(collection),
  );

  buildBaseLoading.value = true;
  try {
    let sticker: StickerVectorReindexResult | undefined;
    let content: ContentVectorBuildResult | undefined;
    const errors: string[] = [];
    if (stickerCollections.length) {
      try {
        sticker = await reindexStickerVectors(buildStickerVectorPayload(stickerCollections));
      } catch (error: any) {
        errors.push(`贴纸图片：${error?.message || "构建失败"}`);
      }
    }
    if (selectedContentCollections.length) {
      try {
        content = await reindexContentVectors(buildContentVectorPayload(selectedContentCollections));
      } catch (error: any) {
        errors.push(`内容资源：${error?.message || "构建失败"}`);
      }
    }
    if (!sticker && !content && errors.length) {
      throw new Error(errors.join("；"));
    }
    buildBaseResult.value = {
      total: (sticker?.total || 0) + (content?.total || 0),
      indexed: (sticker?.indexed || 0) + (content?.indexed || 0),
      skipped: (sticker?.skipped || 0) + (content?.skipped || 0),
      failed: (sticker?.failed || 0) + (content?.failed || 0),
      sticker,
      content,
    };
    if (errors.length) {
      ElMessage.warning(`部分构建失败：${errors.join("；")}`);
    } else {
      ElMessage.success("构建完成");
    }
    await loadRecords();
  } catch (error: any) {
    ElMessage.error(error?.message || "构建失败");
  } finally {
    buildBaseLoading.value = false;
  }
}

// ============ 新增弹窗 ============
const createVisible = ref(false);
const createLoading = ref(false);
const createFormRef = ref<FormInstance>();

const createForm = reactive({
  collection: "",
  sourceId: "",
  text: "",
  metadataJson: "",
});

const createRules: FormRules = {
  collection: [{ required: true, message: "请选择分类", trigger: "change" }],
  text: [{ required: true, message: "请输入文本内容", trigger: "blur" }],
};

function openCreateDialog() {
  createForm.collection = "";
  createForm.sourceId = "";
  createForm.text = "";
  createForm.metadataJson = "";
  createVisible.value = true;
}

function resetCreateForm() {
  createFormRef.value?.resetFields();
}

async function handleCreate() {
  const valid = await createFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  createLoading.value = true;
  try {
    let metadata: Record<string, any> | undefined;
    if (createForm.metadataJson.trim()) {
      metadata = JSON.parse(createForm.metadataJson);
    }
    await indexVectorRecord({
      collection: createForm.collection,
      sourceId: createForm.sourceId,
      text: createForm.text,
      metadata,
    });
    ElMessage.success("新增成功");
    createVisible.value = false;
    await loadRecords();
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      ElMessage.error("元数据 JSON 格式不正确");
    } else {
      ElMessage.error(error?.message || "新增失败");
    }
  } finally {
    createLoading.value = false;
  }
}

// ============ 工具方法 ============
function formatTime(val: string | undefined) {
  if (!val) return "-";
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) return val;
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return val;
  }
}

// ============ 初始化 ============
onMounted(async () => {
  try {
    const data = await getCollectionDefinitions();
    collectionDefs.value = data?.definitions ?? [];
  } catch {
    // 静默失败
  }
  await loadRecords();
});
</script>

<style scoped lang="scss">
.vector-search-page {
  gap: 10px;
  padding: 8px 0 0;

  :deep(.list-page-layout__main) {
    gap: 10px;
  }

  :deep(.list-page-filter--flat) {
    gap: 10px;
    padding-bottom: 10px;
  }

  :deep(.list-page-table-panel__pagination--flat) {
    padding-top: 10px;
  }
}

.vector-collection-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
}

.vector-collection-cell__name {
  color: var(--el-text-color-placeholder);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 14px;
}

.vector-collection-option {
  min-width: 0;
  padding-right: 8px;
  line-height: 1.2;
}

.vector-collection-option__main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.vector-collection-option__label {
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vector-collection-option__name {
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-placeholder);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vector-collection-option__desc {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 15px;
}

.create-form-tip {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.vector-operation-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  min-height: 180px;
}

.vector-operation-item {
  display: flex;
  min-height: 104px;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.vector-operation-item__main {
  flex: 1;
  min-width: 0;
}

.vector-operation-item__title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.vector-operation-item__desc {
  margin-top: 2px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

@media (max-width: 768px) {
  .vector-operation-list {
    grid-template-columns: 1fr;
    min-height: 120px;
  }

  .vector-operation-item {
    min-height: auto;
  }
}

.build-sticker-vector-form {
  :deep(.el-checkbox-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
  }

  :deep(.el-checkbox) {
    margin-right: 0;
  }
}

.build-sticker-vector-tip {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.build-sticker-vector-result {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.build-sticker-vector-result__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 20px;
}

.build-sticker-vector-result__details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.mono-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}

.embedding-text {
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}
</style>

<style lang="scss">
.vector-collection-select-popper {
  .el-select-dropdown__item {
    height: auto;
    min-height: 46px;
    padding: 6px 12px;
    line-height: normal;
    white-space: normal;
  }

  .vector-collection-option {
    width: min(560px, calc(100vw - 64px));
    min-width: 0;
    padding-right: 4px;
    line-height: 1.2;
  }

  .vector-collection-option__main {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 6px;
  }

  .vector-collection-option__label {
    flex: 0 0 auto;
    color: var(--el-text-color-primary);
    font-size: 13px;
    font-weight: 600;
    line-height: 18px;
  }

  .vector-collection-option__name {
    min-width: 0;
    overflow: hidden;
    color: var(--el-text-color-placeholder);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    line-height: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vector-collection-option__desc {
    display: -webkit-box;
    margin-top: 3px;
    overflow: hidden;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    line-height: 15px;
    white-space: normal;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}
</style>
