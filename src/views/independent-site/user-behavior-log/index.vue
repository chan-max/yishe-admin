<template>
  <div class="user-behavior-log-page">
    <ContentWrap :plain="true">
      <div class="page-wrapper">
        <!-- 搜索与筛选栏 -->
        <div class="filter-header">
          <div class="filter-left">
            <h3 class="title">独立站开放用户行为日志</h3>
            <el-tag type="info" size="small" effect="plain">用户隔离已防护</el-tag>
          </div>
          <div class="filter-right">
            <el-select
              v-model="queryParams.action"
              placeholder="行为动作筛选"
              clearable
              size="small"
              class="filter-item"
              @change="handleSearch"
            >
              <el-option label="页面浏览 (page_view)" value="page_view" />
              <el-option label="商品查看 (product_view)" value="product_view" />
              <el-option label="商品搜索 (product_search)" value="product_search" />
              <el-option label="提交定制需求 (design_request_submit)" value="design_request_submit" />
            </el-select>

            <el-input
              v-model="queryParams.publicUserId"
              placeholder="开放账号/姓名"
              clearable
              size="small"
              class="filter-item"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />

            <el-input
              v-model="queryParams.searchText"
              placeholder="关键词/目标ID"
              clearable
              size="small"
              class="filter-item"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />

            <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
            <el-button size="small" @click="handleReset">重置</el-button>
          </div>
        </div>

        <!-- 数据表格 -->
        <div class="grid-container">
          <vxe-grid
            ref="gridRef"
            v-bind="gridOptions"
            :loading="loading"
            :data="tableData"
          >
            <!-- 行为动作 Tag -->
            <template #action_slot="{ row }">
              <el-tag :type="getActionTagType(row.action)" size="small">
                {{ formatActionLabel(row.action) }}
              </el-tag>
            </template>

            <!-- 开放用户信息 -->
            <template #user_slot="{ row }">
              <span class="user-info-text">
                {{ row.publicUserName || row.publicUserId || '匿名开放用户' }}
              </span>
              <span v-if="row.publicUserId" class="user-id-sub">({{ row.publicUserId }})</span>
            </template>

            <!-- 关联目标 -->
            <template #target_slot="{ row }">
              <span v-if="row.targetName" class="target-text">{{ row.targetName }}</span>
              <code v-if="row.targetId" class="target-id">{{ row.targetId }}</code>
              <span v-if="!row.targetName && !row.targetId" class="text-gray-400">-</span>
            </template>

            <!-- JSON 扩展元数据操作 -->
            <template #metadata_slot="{ row }">
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
          </vxe-grid>

          <!-- 分页器 -->
          <div class="pagination-bar">
            <el-pagination
              v-model:current-page="queryParams.currentPage"
              v-model:page-size="queryParams.pageSize"
              :total="total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              size="small"
              @size-change="fetchData"
              @current-change="fetchData"
            />
          </div>
        </div>
      </div>
    </ContentWrap>

    <!-- 元数据 JSON 查看弹窗 -->
    <el-dialog
      v-model="metadataDialogVisible"
      title="行为日志元数据 (JSON Metadata)"
      width="600px"
      append-to-body
    >
      <div class="code-box">
        <pre class="json-code"><code>{{ formattedMetadata }}</code></pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import ContentWrap from '@/components/ContentWrap/src/ContentWrap.vue'
import { UserBehaviorLogApi, type UserBehaviorLogItem } from '@/api/user-behavior-log'
import type { VxeGridProps } from 'vxe-table'

defineOptions({ name: 'IndependentSiteUserBehaviorLog' })

const loading = ref(false)
const tableData = ref<UserBehaviorLogItem[]>([])
const total = ref(0)

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  action: '',
  publicUserId: '',
  searchText: '',
})

const metadataDialogVisible = ref(false)
const currentMetadata = ref<Record<string, any> | null>(null)

const formattedMetadata = computed(() => {
  if (!currentMetadata.value) return '{}'
  return JSON.stringify(currentMetadata.value, null, 2)
})

const gridOptions = reactive<VxeGridProps<UserBehaviorLogItem>>({
  border: true,
  size: 'small',
  align: 'left',
  columns: [
    { field: 'action', title: '行为动作', width: 180, slots: { default: 'action_slot' } },
    { field: 'user', title: '独立站开放用户', width: 220, slots: { default: 'user_slot' } },
    { field: 'target', title: '关联目标/项目', minWidth: 200, slots: { default: 'target_slot' } },
    { field: 'ip', title: 'IP 地址', width: 140 },
    { field: 'metadata', title: '附加信息', width: 120, slots: { default: 'metadata_slot' } },
    { field: 'createTime', title: '记录时间', width: 170 },
  ],
})

function formatActionLabel(action: string) {
  switch (action) {
    case 'page_view':
      return '页面浏览'
    case 'product_view':
      return '商品查看'
    case 'product_search':
      return '商品搜索'
    case 'design_request_submit':
      return '提交定制需求'
    default:
      return action || '未知行为'
  }
}

function getActionTagType(action: string) {
  switch (action) {
    case 'page_view':
      return 'info'
    case 'product_view':
      return 'success'
    case 'product_search':
      return 'warning'
    case 'design_request_submit':
      return 'danger'
    default:
      return 'info'
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await UserBehaviorLogApi.getPage({
      currentPage: queryParams.currentPage,
      pageSize: queryParams.pageSize,
      action: queryParams.action || undefined,
      publicUserId: queryParams.publicUserId || undefined,
      searchText: queryParams.searchText || undefined,
    })
    tableData.value = res.list || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.currentPage = 1
  fetchData()
}

function handleReset() {
  queryParams.action = ''
  queryParams.publicUserId = ''
  queryParams.searchText = ''
  queryParams.currentPage = 1
  fetchData()
}

function openMetadataDialog(row: UserBehaviorLogItem) {
  currentMetadata.value = row.metadata || null
  metadataDialogVisible.value = true
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.user-behavior-log-page {
  padding: 0;
}

.page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-wrap: wrap;
  gap: 8px;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: var(--el-text-color-primary);
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-item {
  width: 170px;
}

.grid-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-info-text {
  font-weight: 600;
  font-size: 13px;
}

.user-id-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}

.target-text {
  font-size: 13px;
  margin-right: 6px;
}

.target-id {
  font-family: monospace;
  font-size: 12px;
  color: var(--el-color-primary);
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.code-box {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px 12px;
  max-height: 360px;
  overflow-y: auto;
}

.json-code {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
}
</style>
