<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="shop-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="list-page-search-form__actions">
            <el-button size="small" type="danger" plain :disabled="!selectedIds.length" @click="handleBatchDelete">
              批量删除 ({{ selectedIds.length }})
            </el-button>
            <el-button size="small" type="primary" @click="openDialog()">新增店铺</el-button>
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
              class="h-12 w-12 rounded border border-solid border-[var(--el-border-color-light)] bg-black/5 p-1"
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
                class="h-10 w-10 rounded border border-solid border-[var(--el-border-color-light)]"
              />
              <span v-if="row.carousel.length > 3" class="text-xs text-[var(--el-text-color-secondary)]">+{{ row.carousel.length - 3 }}</span>
            </template>
            <span v-else class="text-xs text-[var(--el-text-color-secondary)]">-</span>
          </div>
        </template>

        <template #createTimeSlot="{ row }">
          <span>{{ formatDate(row.createTime) }}</span>
        </template>

        <template #operationSlot="{ row }">
          <div class="flex items-center justify-end gap-3">
            <el-button link type="primary" size="small" @click="openDialog(row.id)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
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
import { commonGridOptions } from '@/common/table'
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
    { title: '创建时间', field: 'createTime', width: 180, slots: { default: 'createTimeSlot' } },
    { title: '操作', field: 'operation', width: 160, fixed: 'right', slots: { default: 'operationSlot' } }
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
  gap: 10px;
  padding-bottom: 10px;
}
</style>
