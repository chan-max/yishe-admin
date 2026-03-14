<template>
  <ContentWrap>
    <div class="flex items-center justify-between gap-3 py-3">
      <div class="flex items-center gap-3">
        <el-button type="danger" plain :disabled="!selectedIds.length" @click="handleBatchDelete">
          批量删除 ({{ selectedIds.length }})
        </el-button>
      </div>
      <el-button type="primary" @click="openDialog()">新增厂家</el-button>
    </div>

    <div class="common-table">
      <vxe-grid
        v-bind="gridOptions"
        :data="list"
        :loading="loading"
        @checkbox-change="handleCheckboxChange"
        @checkbox-all="handleCheckboxAll"
      >
        <template #imagesSlot="{ row }">
          <div class="flex items-center gap-2">
            <template v-if="row.images?.length">
              <el-image
                v-for="image in row.images.slice(0, 3)"
                :key="image"
                :src="image"
                fit="cover"
                :preview-src-list="row.images"
                preview-teleported
                class="h-10 w-10 rounded border border-solid border-[var(--el-border-color-light)]"
              />
              <span v-if="row.images.length > 3" class="text-xs text-[var(--el-text-color-secondary)]">+{{ row.images.length - 3 }}</span>
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

    <VendorDialog ref="dialogRef" @success="getList" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { commonGridOptions } from '@/common/table'
import { batchDeleteVendor, deleteVendor, getVendorList } from '@/api/vendor'
import VendorDialog from './components/VendorDialog.vue'
import { formatDate } from '@/utils/formatTime'

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
    { title: '厂家名称', field: 'name', minWidth: 180 },
    { title: '联系人', field: 'contactName', width: 120 },
    { title: '联系电话', field: 'contactPhone', width: 140 },
    { title: '图片', field: 'images', width: 180, slots: { default: 'imagesSlot' } },
    { title: '地址', field: 'address', minWidth: 220, showOverflow: 'tooltip' },
    { title: '描述', field: 'description', minWidth: 240, showOverflow: 'tooltip' },
    { title: '创建时间', field: 'createTime', width: 180, slots: { default: 'createTimeSlot' } },
    { title: '操作', field: 'operation', width: 160, fixed: 'right', slots: { default: 'operationSlot' } }
  ]
})

const getList = async () => {
  loading.value = true
  try {
    const data = await getVendorList()
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
    await ElMessageBox.confirm('确认删除该厂家吗？删除后会同步清理对应的 COS 图片。', '提示', { type: 'warning' })
    await deleteVendor(id)
    ElMessage.success('删除成功')
    await getList()
  } catch {}
}

const handleBatchDelete = async () => {
  if (!selectedIds.value.length) return
  try {
    await ElMessageBox.confirm(`确认批量删除 ${selectedIds.value.length} 个厂家吗？删除后会同步清理对应的 COS 图片。`, '提示', { type: 'warning' })
    await batchDeleteVendor(selectedIds.value)
    ElMessage.success('批量删除成功')
    await getList()
  } catch {}
}

onMounted(() => {
  getList()
})
</script>
