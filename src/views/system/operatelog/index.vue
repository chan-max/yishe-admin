<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="operate-log-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="5" :xl="4">
                <el-form-item label="用户名">
                  <el-input
                    v-model="queryParams.userName"
                    size="small"
                    placeholder="请输入用户名"
                    clearable
                    @change="(val) => { if (!val) getList(); }"
                  />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
                <el-form-item label="操作内容">
                  <el-input
                    v-model="queryParams.action"
                    size="small"
                    placeholder="请输入操作内容"
                    clearable
                    @change="(val) => { if (!val) getList(); }"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" :icon="Search" :loading="loading" @click="handleSearch">搜索</el-button>
              <el-button size="small" :icon="Refresh" :disabled="loading" @click="resetQuery">重置</el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="handleClear"
                :disabled="loading"
              >
                清空日志
              </el-button>
            </div>
          </el-form>
        </div>
      </template>

      <template #table>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat">
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid ref="gridRef" v-bind="gridOptions" :data="dataSource" :loading="loading">
                <template #actionDefaultSlot="{ row }">
                  <div class="break-all text-sm leading-6">
                    {{ row.action }}
                  </div>
                </template>

                <template #timestampDefaultSlot="{ row }">
                  {{ formatTimestamp(row.timestamp) }}
                </template>

                <template #userAgentDefaultSlot="{ row }">
                  <el-tooltip
                    :content="row.userAgent || '-'"
                    placement="top"
                    :disabled="!row.userAgent"
                  >
                    <div class="cursor-pointer break-all text-sm leading-6">
                      {{ formatUserAgent(row.userAgent) }}
                    </div>
                  </el-tooltip>
                </template>
              </vxe-grid>
            </div>
          </div>
        </div>
      </template>

      <template #pagination>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel__pagination list-page-table-panel__pagination--flat">
          <pagination
            :total="total"
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </template>
    </ListPageLayout>
  </ContentWrap>
</template>

<script setup lang="tsx">
import { ref, reactive, onMounted, watchEffect } from "vue";
import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { useWindowSize } from "@vueuse/core";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Delete, Refresh } from "@element-plus/icons-vue";
import { getOperateLogPage, clearOperateLog, type OperateLogVO } from "@/api/system/operatelog";
import { useUserStore } from "@/store/modules/user";
import Pagination from "@/components/Pagination/index.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";

// ????
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  userName: "",
  action: "",
});

const gridRef = ref();
const dataSource = ref<OperateLogVO[]>([]);
const total = ref(0);
const loading = ref(false);

const gridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: "id",
  },
  columns: [
    {
      title: "ID",
      field: "id",
      width: 200,
      showOverflow: true,
    },
    {
      title: "用户ID",
      field: "userId",
      width: 100,
      formatter: (e) => {
        return e.cellValue ?? "-";
      },
    },
    {
      title: "用户名",
      field: "userName",
      width: 150,
      showOverflow: true,
      formatter: (e) => {
        return e.cellValue || "-";
      },
    },
    {
      title: "操作内容",
      field: "action",
      minWidth: 200,
      showOverflow: true,
      slots: {
        default: "actionDefaultSlot",
      },
    },
    {
      title: "IP地址",
      field: "ip",
      width: 150,
      showOverflow: true,
      formatter: (e) => {
        return e.cellValue || "-";
      },
    },
    {
      title: "User Agent",
      field: "userAgent",
      minWidth: 250,
      showOverflow: true,
      slots: {
        default: "userAgentDefaultSlot",
      },
    },
    {
      title: "操作时间",
      field: "timestamp",
      width: 180,
      slots: {
        default: "timestampDefaultSlot",
      },
    },
  ],
});

const { height } = useWindowSize();

function formatUserAgent(ua?: string): string {
  if (!ua) return "-";
  if (ua.length > 50) {
    return ua.substring(0, 50) + "...";
  }
  return ua;
}

async function getList() {
  loading.value = true;
  try {
    const res = await getOperateLogPage({
      currentPage: queryParams.currentPage,
      pageSize: queryParams.pageSize,
      userName: queryParams.userName || undefined,
      action: queryParams.action || undefined,
    });

    if (res.code === 0 && res.data) {
      dataSource.value = res.data.list || [];
      total.value = res.data.total || 0;
    } else {
      ElMessage.error("获取日志列表失败");
      dataSource.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error("获取日志列表失败:", error);
    ElMessage.error("获取日志列表失败");
    dataSource.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  queryParams.currentPage = 1;
  queryParams.pageSize = 20;
  queryParams.userName = "";
  queryParams.action = "";
  getList();
}

async function handleClear() {
  const userStore = useUserStore();
  if (!userStore.user?.isAdmin) {
    return ElMessage.warning("无权限：仅管理员可执行清空日志操作");
  }
  try {
    await ElMessageBox.confirm("确定要清空所有操作日志吗？此操作不可恢复！", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    loading.value = true;
    const res = await clearOperateLog();

    if (res.code === 0) {
      ElMessage.success("清空成功");
      getList();
    } else {
      ElMessage.error("清空失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("清空日志失败:", error);
      ElMessage.error("清空日志失败");
    }
  } finally {
    loading.value = false;
  }
}

watchEffect(() => {
  if (gridOptions.value) {
    gridOptions.value.maxHeight = height.value - 300;
  }
});

function handleSearch() {
  queryParams.currentPage = 1;
  getList();
}

onMounted(() => {
  getList();
});
</script>

<style scoped>
:deep(.operate-log-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.operate-log-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.operate-log-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.operate-log-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}
</style>
