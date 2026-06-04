<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="publish-binding-records-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="套图ID">
                  <el-input v-model="queryParams.psdSetId" size="small" placeholder="请输入套图ID" clearable />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="贴纸ID">
                  <el-input v-model="queryParams.stickerId" size="small" placeholder="请输入贴纸ID" clearable />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="发布配置">
                  <el-select v-model="queryParams.publishConfigId" size="small" placeholder="请选择发布配置" clearable filterable>
                    <el-option v-for="item in publishConfigOptions" :key="item.id" :label="item.name" :value="item.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="状态">
                  <el-select v-model="queryParams.status" size="small" placeholder="请选择状态" clearable>
                    <el-option label="待处理" value="pending" />
                    <el-option label="成功" value="success" />
                    <el-option label="失败" value="failed" />
                    <el-option label="已过期" value="expired" />
                    <el-option label="已删除" value="deleted" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" :icon="Search" :loading="loading" @click="handleSearch">搜索</el-button>
              <el-button size="small" :icon="Refresh" :disabled="loading" @click="resetQuery">重置</el-button>
            </div>
          </el-form>
        </div>
      </template>

      <template #table>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat">
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid ref="gridRef" v-bind="gridOptions" :data="dataSource" :loading="loading">
                <template #publishConfigDefaultSlot="{ row }">
                  <div class="publish-config-cell">
                    <span class="publish-config-name">{{ row.publishConfig?.name || "-" }}</span>
                    <el-tag v-if="row.publishConfig?.platform" size="small" type="info" class="platform-tag">
                      {{ row.publishConfig.platform }}
                    </el-tag>
                  </div>
                </template>

                <template #statusDefaultSlot="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </vxe-grid>
            </div>
          </div>
        </div>
      </template>

      <template #pagination>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel__pagination list-page-table-panel__pagination--flat">
          <pagination :total="total" v-model:page="queryParams.currentPage" v-model:limit="queryParams.pageSize" @pagination="getList" />
        </div>
      </template>
    </ListPageLayout>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect, onMounted } from "vue";
import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { useWindowSize } from "@vueuse/core";
import { defaultSortingValue } from "@/common/sort";
import { ElMessage } from "element-plus";
import { Search, Refresh } from "@element-plus/icons-vue";
import { podPublishImageBindingApi } from "@/api/podPublishImageBinding";
import Pagination from "@/components/Pagination/index.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  psdSetId: "",
  stickerId: "",
  publishConfigId: "",
  status: "",
});

const gridRef = ref();
const gridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: { keyField: "id" },
  columns: [
    { title: "套图ID", field: "psdSetId", minWidth: 180 },
    { title: "贴纸ID", field: "stickerId", minWidth: 180 },
    { title: "发布配置", field: "publishConfig.name", minWidth: 200, slots: { default: "publishConfigDefaultSlot" } },
    { title: "任务ID", field: "taskId", minWidth: 180 },
    { title: "状态", field: "status", width: 100, slots: { default: "statusDefaultSlot" } },
    { title: "创建时间", field: "createTime", width: 170, formatter: ({ cellValue }) => formatTimestamp(cellValue) },
    { title: "更新时间", field: "updateTime", width: 170, formatter: ({ cellValue }) => formatTimestamp(cellValue) },
  ],
});

const { height } = useWindowSize();
watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 240;
});

const dataSource = ref([]);
const loading = ref(false);
const total = ref(0);
const publishConfigOptions = ref([]);

async function getList() {
  loading.value = true;
  try {
    const res = await podPublishImageBindingApi.page({
      currentPage: queryParams.currentPage,
      pageSize: queryParams.pageSize,
      psdSetId: queryParams.psdSetId,
      stickerId: queryParams.stickerId,
      publishConfigId: queryParams.publishConfigId,
      status: queryParams.status,
    });
    dataSource.value = res.list || [];
    total.value = res.total || 0;
  } catch (error) {
    ElMessage.error("获取列表失败");
    dataSource.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

async function getPublishConfigOptions() {
  try {
    const res = await podPublishImageBindingApi.getPublishConfigOptions();
    publishConfigOptions.value = res || [];
  } catch (error) {
    publishConfigOptions.value = [];
  }
}

const handleSearch = () => {
  queryParams.currentPage = 1;
  getList();
};

const resetQuery = () => {
  queryParams.currentPage = 1;
  queryParams.psdSetId = "";
  queryParams.stickerId = "";
  queryParams.publishConfigId = "";
  queryParams.status = "";
  queryParams.sortingFields = defaultSortingValue();
  getList();
};

function getStatusType(status: string) {
  switch (status) {
    case "success": return "success";
    case "failed": return "danger";
    case "expired": return "warning";
    case "deleted": return "info";
    default: return "";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending": return "待处理";
    case "success": return "成功";
    case "failed": return "失败";
    case "expired": return "已过期";
    case "deleted": return "已删除";
    default: return status;
  }
}

onMounted(() => {
  getList();
  getPublishConfigOptions();
});
</script>

<style scoped lang="less">
:deep(.publish-binding-records-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.publish-binding-records-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.publish-binding-records-page .list-page-filter--flat) {
  padding-bottom: 10px;
}

.publish-binding-records-page {
  :deep(.publish-config-cell) {
    display: flex;
    align-items: center;
    gap: 8px;
    .publish-config-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .platform-tag {
      flex-shrink: 0;
    }
  }
}
</style>
