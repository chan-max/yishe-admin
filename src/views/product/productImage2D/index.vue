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
        <template #imagesSlot="{ row }">
          <div class="image-preview-container">
            <div v-for="(image, index) in getImageList(row)" :key="index" class="image-item">
              <el-image
                :src="image"
                :preview-src-list="getImageList(row)"
                :initial-index="index"
                fit="cover"
                class="preview-image"
              />
            </div>
            <div v-if="!getImageList(row).length" class="no-images">
              暂无合成图片
            </div>
          </div>
        </template>
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
    { title: '合成图片', field: 'images', width: 300, slots: { default: 'imagesSlot' } },
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
    console.log('获取二维设计商品图列表...')
    const res = await request.post({ url: '/product-image-2d/page', data: { page: queryParams.currentPage, pageSize: queryParams.pageSize } })
    console.log('获取到的数据:', res)
    dataSource.value = res.list || []
    total.value = res.total || 0
    console.log('数据源长度:', dataSource.value.length)
  } catch (e) {
    console.error('获取列表失败:', e)
    dataSource.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getList()
})

// 获取图片列表
function getImageList(row: any): string[] {
  const images: string[] = []
  for (let i = 1; i <= 10; i++) {
    const imageUrl = row[`image${i}`]
    if (imageUrl && imageUrl.trim()) {
      images.push(imageUrl)
    }
  }
  return images
}

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
.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 280px;
}

.image-item {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-images {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  width: 100%;
  border: 1px dashed var(--el-border-color-light);
  border-radius: 4px;
}
</style>


