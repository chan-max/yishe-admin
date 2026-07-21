<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="user-behavior-log-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col
                class="list-page-search-form__col--base"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="5"
                :xl="4"
              >
                <el-form-item label="行为动作">
                  <el-select
                    v-model="queryParams.action"
                    size="small"
                    clearable
                    placeholder="全部行为动作"
                    @change="handleSearch"
                  >
                    <el-option label="页面浏览 (page_view)" value="page_view" />
                    <el-option label="商品查看 (product_view)" value="product_view" />
                    <el-option label="商品搜索 (product_search)" value="product_search" />
                    <el-option label="提交定制需求 (design_request_submit)" value="design_request_submit" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col
                class="list-page-search-form__col--base"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="5"
                :xl="4"
              >
                <el-form-item label="独立站开放用户">
                  <el-input
                    v-model="queryParams.publicUserId"
                    size="small"
                    placeholder="请输入开放账号或姓名"
                    clearable
                    @change="(val) => { if (!val) handleSearch() }"
                    @keyup.enter="handleSearch"
                  />
                </el-form-item>
              </el-col>
              <el-col
                class="list-page-search-form__col--wide"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6"
                :xl="5"
              >
                <el-form-item label="关键词 / 关联目标">
                  <el-input
                    v-model="queryParams.searchText"
                    size="small"
                    placeholder="按页面名称/目标ID/搜索词检索"
                    clearable
                    @change="(val) => { if (!val) handleSearch() }"
                    @keyup.enter="handleSearch"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button
                size="small"
                type="primary"
                :icon="Search"
                :loading="loading"
                @click="handleSearch"
              >
                搜索
              </el-button>
              <el-button
                size="small"
                :icon="Refresh"
                :disabled="loading"
                @click="resetQuery"
              >
                重置
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
              <vxe-grid ref="gridRef" v-bind="gridOptions" :data="dataSource" :loading="loading">
                <template #actionSlot="{ row }">
                  <el-tag :type="getActionTagType(row.action)" size="small">
                    {{ formatActionLabel(row.action) }}
                  </el-tag>
                </template>

                <template #userSlot="{ row }">
                  <div class="font-medium text-sm">
                    {{ row.publicUserName || row.publicUserId || '匿名开放用户' }}
                    <span v-if="row.publicUserId" class="text-gray-400 text-xs ml-1">
                      ({{ row.publicUserId }})
                    </span>
                  </div>
                </template>

                <template #targetSlot="{ row }">
                  <div class="break-all text-sm leading-6">
                    <span v-if="row.targetName" class="mr-1 font-normal">{{ row.targetName }}</span>
                    <code v-if="row.targetId" class="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-blue-600">
                      {{ row.targetId }}
                    </code>
                    <span v-if="!row.targetName && !row.targetId" class="text-gray-400">-</span>
                  </div>
                </template>

                <template #metadataSlot="{ row }">
                  <el-button
                    v-if="row.metadata && Object.keys(row.metadata).length"
                    size="small"
                    type="primary"
                    link
                    @click="openMetadataDialog(row)"
                  >
                    查看元数据
                  </el-button>
                  <span v-else class="text-gray-400">-</span>
                </template>

                <template #createTimeSlot="{ row }">
                  {{ formatTimestamp(row.createTime) }}
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

    <!-- 元数据查看弹窗 -->
    <el-dialog
      v-model="metadataDialogVisible"
      title="独立站开放用户行为元数据 (JSON Metadata)"
      width="580px"
      append-to-body
    >
      <div class="code-preview-box">
        <pre class="json-code"><code>{{ formattedMetadata }}</code></pre>
      </div>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watchEffect } from "vue";
import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { useWindowSize } from "@vueuse/core";
import { Search, Refresh } from "@element-plus/icons-vue";
import { UserBehaviorLogApi, type UserBehaviorLogItem } from "@/api/user-behavior-log";
import Pagination from "@/components/Pagination/index.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";

defineOptions({ name: "IndependentSiteUserBehaviorLog" });

const loading = ref(false);
const dataSource = ref<UserBehaviorLogItem[]>([]);
const total = ref(0);
const gridRef = ref();

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  action: "",
  publicUserId: "",
  searchText: "",
});

const metadataDialogVisible = ref(false);
const currentMetadata = ref<Record<string, any> | null>(null);

const formattedMetadata = computed(() => {
  if (!currentMetadata.value) return "{}";
  return JSON.stringify(currentMetadata.value, null, 2);
});

const gridOptions = reactive({
  ...commonGridOptions,
  columns: [
    { field: "action", title: "行为动作", width: 180, slots: { default: "actionSlot" } },
    { field: "publicUser", title: "独立站开放用户", width: 220, slots: { default: "userSlot" } },
    { field: "target", title: "关联目标/访问路径", minWidth: 220, slots: { default: "targetSlot" } },
    { field: "ip", title: "IP 地址", width: 140 },
    { field: "metadata", title: "附加元数据", width: 120, slots: { default: "metadataSlot" } },
    { field: "createTime", title: "记录时间", width: 170, slots: { default: "createTimeSlot" } },
  ],
});

const { height } = useWindowSize();
watchEffect(() => {
  if (gridOptions) {
    gridOptions.maxHeight = height.value - 240;
  }
});

function formatActionLabel(action: string) {
  switch (action) {
    case "page_view":
      return "页面浏览";
    case "product_view":
      return "商品查看";
    case "product_search":
      return "商品搜索";
    case "design_request_submit":
      return "提交定制需求";
    default:
      return action || "未知行为";
  }
}

function getActionTagType(action: string) {
  switch (action) {
    case "page_view":
      return "info";
    case "product_view":
      return "success";
    case "product_search":
      return "warning";
    case "design_request_submit":
      return "danger";
    default:
      return "info";
  }
}

async function getList() {
  loading.value = true;
  try {
    const res = await UserBehaviorLogApi.getPage({
      currentPage: queryParams.currentPage,
      pageSize: queryParams.pageSize,
      action: queryParams.action || undefined,
      publicUserId: queryParams.publicUserId || undefined,
      searchText: queryParams.searchText || undefined,
    });
    dataSource.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryParams.currentPage = 1;
  getList();
}

function resetQuery() {
  queryParams.action = "";
  queryParams.publicUserId = "";
  queryParams.searchText = "";
  queryParams.currentPage = 1;
  getList();
}

function openMetadataDialog(row: UserBehaviorLogItem) {
  currentMetadata.value = row.metadata || null;
  metadataDialogVisible.value = true;
}

onMounted(() => {
  getList();
});
</script>

<style scoped>
.user-behavior-log-page {
  padding: 0;
}

.code-preview-box {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
  max-height: 380px;
  overflow-y: auto;
  background-color: var(--el-fill-color-light);
}

.json-code {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
}
</style>
