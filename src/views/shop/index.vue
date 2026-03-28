<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="shop-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="resource-toolbar">
            <div class="resource-toolbar__summary">
              <div class="resource-toolbar__title">店铺资源管理</div>
            </div>
            <div class="resource-toolbar__meta">
              <div class="resource-toolbar__actions">
                <el-button size="small" type="danger" plain :disabled="!selectedIds.length" @click="handleBatchDelete">
                  批量删除
                </el-button>
                <el-button size="small" type="primary" @click="openDialog()">新增店铺</el-button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #table>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat">
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid
                v-bind="gridOptions"
                :data="list"
                :loading="loading"
                @checkbox-change="handleCheckboxChange"
                @checkbox-all="handleCheckboxAll"
              >
        <template #logoSlot="{ row }">
          <div class="flex items-center">
            <el-image
              v-if="row.logo"
              :src="row.logo"
              fit="contain"
              :preview-src-list="[row.logo]"
              preview-teleported
              class="table-thumb table-thumb--md table-thumb--contain"
            />
            <span v-else class="text-xs text-[var(--el-text-color-secondary)]">-</span>
          </div>
        </template>

        <template #carouselSlot="{ row }">
          <div class="flex items-center gap-2">
            <template v-if="row.carousel?.length">
              <el-image
                v-for="image in row.carousel.slice(0, 3)"
                :key="image"
                :src="image"
                fit="cover"
                :preview-src-list="row.carousel"
                preview-teleported
                class="table-thumb table-thumb--sm"
              />
              <span v-if="row.carousel.length > 3" class="table-thumb-count">+{{ row.carousel.length - 3 }}</span>
            </template>
            <span v-else class="text-xs text-[var(--el-text-color-secondary)]">-</span>
          </div>
        </template>

        <template #createTimeSlot="{ row }">
          <span class="table-time-text">{{ formatDate(row.createTime) }}</span>
        </template>

        <template #operationSlot="{ row }">
          <div class="flex justify-start">
            <el-dropdown
              class="operation-dropdown"
              placement="bottom-end"
              @command="(command) => handleOperationCommand(String(command), row)"
            >
              <el-button type="primary" link size="small" class="operation-trigger-button">操作</el-button>
              <template #dropdown>
                <el-dropdown-menu class="operation-menu-compact">
                  <el-dropdown-item command="edit">
                    <span>编辑</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
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
    </ListPageLayout>

    <ShopDialog ref="dialogRef" @success="getList" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from '@/common/table'
import { batchDeleteShop, deleteShop, getShopList } from '@/api/shop'
import ShopDialog from './components/ShopDialog.vue'
import { formatDate } from '@/utils/formatTime'
import ListPageLayout from '@/components/ListPageLayout/index.vue'

const loading = ref(false)
const list = ref<any[]>([])
const dialogRef = ref()
const selectedIds = ref<number[]>([])

const updateSelectedIds = (records: any[]) => {
  selectedIds.value = (records || []).map((item) => Number(item.id)).filter((id) => Number.isInteger(id) && id > 0)
}

const gridOptions = ref({
  ...commonGridOptions,
  rowConfig: {
    keyField: 'id'
  },
  checkboxConfig: {
    reserve: true
  },
  columns: [
    { type: 'checkbox', width: 48 },
    { title: 'ID', field: 'id', width: 80 },
    { title: '店铺名称', field: 'name', minWidth: 180 },
    { title: 'Logo', field: 'logo', width: 100, slots: { default: 'logoSlot' } },
    { title: '轮播图', field: 'carousel', width: 180, slots: { default: 'carouselSlot' } },
    { title: '描述', field: 'description', minWidth: 240, showOverflow: 'tooltip' },
    { ...buildTimeColumn('创建时间', 'createTime', 180), slots: { default: 'createTimeSlot' } },
    buildOperationColumn('operationSlot')
  ]
})

const getList = async () => {
  loading.value = true
  try {
    const data = await getShopList()
    list.value = Array.isArray(data) ? data : []
    selectedIds.value = []
  } finally {
    loading.value = false
  }
}

const openDialog = (id?: number) => {
  dialogRef.value?.open(id)
}

const handleOperationCommand = (command: string, row: any) => {
  if (command === 'edit') {
    openDialog(row.id)
    return
  }
  if (command === 'delete') {
    handleDelete(row.id)
  }
}

const handleCheckboxChange = ({ records }: any) => {
  updateSelectedIds(records)
}

const handleCheckboxAll = ({ records }: any) => {
  updateSelectedIds(records)
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认删除该店铺吗？', '提示', { type: 'warning' })
    await deleteShop(id)
    ElMessage.success('删除成功')
    await getList()
  } catch {}
}

const handleBatchDelete = async () => {
  if (!selectedIds.value.length) return
  try {
    await ElMessageBox.confirm(`确认批量删除 ${selectedIds.value.length} 个店铺吗？`, '提示', { type: 'warning' })
    await batchDeleteShop(selectedIds.value)
    ElMessage.success('批量删除成功')
    await getList()
  } catch {}
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
:deep(.shop-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.shop-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.shop-page .list-page-filter--flat) {
  padding-bottom: 10px;
}

.resource-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 16px;
}

.resource-toolbar__summary {
  min-width: 0;
  flex: 1 1 320px;
}

.resource-toolbar__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.resource-toolbar__description {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.resource-toolbar__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.resource-toolbar__meta-item {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border: 1px solid var(--app-content-border-color);
  border-radius: 8px;
  background: var(--app-content-surface-muted-color);
}

.resource-toolbar__meta-label {
  font-size: 11px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.resource-toolbar__meta-value {
  font-size: 12px;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.resource-toolbar__actions {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .resource-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .resource-toolbar__meta {
    justify-content: flex-start;
  }

  .resource-toolbar__meta-item,
  .resource-toolbar__actions {
    width: 100%;
  }

  .resource-toolbar__actions :deep(.el-button) {
    flex: 1 1 auto;
  }
}
</style>
