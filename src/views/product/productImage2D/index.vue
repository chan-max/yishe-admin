<template>
  <div class="p-4">
    <div class="py-4 flex justify-between items-center">
      <div></div>
      <div class="flex gap-2">
        <el-button type="danger" @click="handleBatchDelete" :disabled="!selectedIds.length">批量删除 ({{ selectedIds.length }})</el-button>
      </div>
    </div>
    <div class="common-table">
      <vxe-grid
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
        @checkbox-change="onCheckboxChange"
        @checkbox-all="onCheckboxAll"
      >
        <template #operationDefaultSlot="{ row }">
          <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)">
            <el-button link type="primary" size="small">
              操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="delete" class="text-red-500">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </vxe-grid>
    </div>
    <div class="py-4 flex justify-end">
      <pagination
        :total="total"
        v-model:page="queryParams.currentPage"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { commonGridOptions } from '@/common/table'
import request from '@/config/axios'
import { ArrowDown } from '@element-plus/icons-vue'

const queryParams = reactive({ currentPage: 1, pageSize: 20 })

const gridOptions = ref<any>({
  ...commonGridOptions,
  columns: [
    { type: 'checkbox', width: 50 },
    { title: 'ID', field: 'id', width: 200 },
    { title: '素材ID', field: 'materialId', width: 200 },
    { title: '二维模板组ID', field: 'templateGroup2DId', width: 'auto' },
    { title: '创建时间', field: 'createTime', width: 180 },
    { title: '更新时间', field: 'updateTime', width: 180 },
    { title: '操作', field: 'operation', width: 80, fixed: 'right', slots: { default: 'operationDefaultSlot' } },
  ],
  checkboxConfig: { reserve: true },
})

const dataSource = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const selectedIds = ref<string[]>([])

async function getList() {
  loading.value = true
  try {
    // 简易占位：如果后端未提供列表接口，这里暂用空数组
    // 可在后续加上真实分页接口：GET/POST /product-image-2d/page
    const res = await request.post({ url: '/product-image-2d/page', data: { page: queryParams.currentPage, pageSize: queryParams.pageSize } })
    dataSource.value = res.list || []
    total.value = res.total || 0
  } catch (e) {
    dataSource.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getList()
})

function onCheckboxChange(e: any) {
  const records = Array.isArray(e.records) ? e.records : []
  const reserves = Array.isArray(e.reserves) ? e.reserves : []
  selectedIds.value = [...records, ...reserves].map((r: any) => String(r.id))
}

function onCheckboxAll(e: any) {
  const records = Array.isArray(e.records) ? e.records : []
  const reserves = Array.isArray(e.reserves) ? e.reserves : []
  selectedIds.value = [...records, ...reserves].map((r: any) => String(r.id))
}

function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case 'delete':
      handleDelete(row)
      break
    default:
      console.warn('未知的操作命令:', command)
  }
}

async function handleDelete(row: any) {
  if (!row?.id) return
  try {
    await request.delete({ url: `/product-image-2d/${row.id}` })
    ElMessage.success('删除成功')
    getList()
  } catch (e) {}
}

async function handleBatchDelete() {
  if (!selectedIds.value.length) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 条记录吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await request.post({ url: '/product-image-2d/delete-batch', data: { ids: [...selectedIds.value] } })
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    getList()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}
</script>

<style scoped>
</style>


