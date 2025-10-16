<template>
  <div class="p-4">
    <div class="py-4 flex justify-between items-center">
      <div></div>
      <div class="flex gap-2">
        <el-button type="danger" @click="handleBatchDelete" :disabled="!selectedIds.length">批量删除 ({{ selectedIds.length }})</el-button>
      </div>
    </div>
    
    <!-- 素材详情弹窗 -->
    <el-dialog
      v-model="materialDialogVisible"
      title="素材详情"
      width="800px"
      :before-close="handleCloseMaterialDialog"
    >
      <div v-if="materialDetail" class="material-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="素材ID">{{ materialDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="素材名称">{{ materialDetail.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="文件后缀">{{ materialDetail.suffix || '-' }}</el-descriptions-item>
          <el-descriptions-item label="素材分组">{{ materialDetail.group || '-' }}</el-descriptions-item>
          <el-descriptions-item label="是否公开">{{ materialDetail.isPublic ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="是否材质">{{ materialDetail.isTexture ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="是否自定义">{{ materialDetail.isCustom ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="是否侵权">{{ materialDetail.isInfringement ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="是否发布">{{ materialDetail.isPublish ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="上传者">{{ materialDetail.uploader?.name || materialDetail.uploader?.account || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ materialDetail.createTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ materialDetail.updateTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关键词" :span="2">{{ materialDetail.keywords || '-' }}</el-descriptions-item>
          <el-descriptions-item label="素材描述" :span="2">{{ materialDetail.description || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="materialDetail.url" class="mt-4">
          <h4>素材图片：</h4>
          <div class="material-images">
            <el-image
              :src="materialDetail.url"
              :preview-src-list="[materialDetail.url]"
              fit="cover"
              class="material-image"
            />
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8">
        <el-icon class="text-4xl text-gray-400"><Loading /></el-icon>
        <p class="mt-2 text-gray-500">加载中...</p>
      </div>
    </el-dialog>

    <!-- 模板详情弹窗 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="模板详情"
      width="800px"
      :before-close="handleCloseTemplateDialog"
    >
      <div v-if="templateDetail" class="template-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="模板组ID">{{ templateDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="模板组名称">{{ templateDetail.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ templateDetail.createTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ templateDetail.updateTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关键词" :span="2">{{ templateDetail.keywords || '-' }}</el-descriptions-item>
          <el-descriptions-item label="模板描述" :span="2">{{ templateDetail.description || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="getTemplateImages(templateDetail).length" class="mt-4">
          <h4>模板图片：</h4>
          <div class="template-images">
            <div v-for="(image, index) in getTemplateImages(templateDetail)" :key="index" class="template-image-item">
              <div class="template-image-info">
                <p><strong>图片{{ index + 1 }}：</strong></p>
                <p v-if="getTemplateImageOption(templateDetail, index + 1)" class="text-sm text-gray-600">
                  配置：{{ getTemplateImageOption(templateDetail, index + 1) }}
                </p>
              </div>
              <div class="template-image-preview">
                <el-image
                  :src="image"
                  :preview-src-list="getTemplateImages(templateDetail)"
                  :initial-index="index"
                  fit="cover"
                  class="preview-thumb"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8">
        <el-icon class="text-4xl text-gray-400"><Loading /></el-icon>
        <p class="mt-2 text-gray-500">加载中...</p>
      </div>
    </el-dialog>
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
        <template #materialIdSlot="{ row }">
          <div class="flex items-center gap-2">
            <span>{{ row.materialId }}</span>
            <el-button 
              link 
              type="primary" 
              size="small" 
              @click="handleViewMaterial(row.materialId)"
              :disabled="!row.materialId"
            >
              查看
            </el-button>
          </div>
        </template>
        <template #templateGroup2DIdSlot="{ row }">
          <div class="flex items-center gap-2">
            <span>{{ row.templateGroup2DId }}</span>
            <el-button 
              link 
              type="primary" 
              size="small" 
              @click="handleViewTemplate(row.templateGroup2DId)"
              :disabled="!row.templateGroup2DId"
            >
              查看
            </el-button>
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
import { ArrowDown, Loading } from '@element-plus/icons-vue'
import { pageTemplateGroup2D } from '@/api/templateGroup2D'

const queryParams = reactive({ currentPage: 1, pageSize: 20 })

const gridOptions = ref<any>({
  ...commonGridOptions,
  columns: [
    { type: 'checkbox', width: 50 },
    { title: '合成图片', field: 'images', width: 300, slots: { default: 'imagesSlot' } },
    { title: 'ID', field: 'id', width: 200 },
    { title: '素材ID', field: 'materialId', width: 200, slots: { default: 'materialIdSlot' } },
    { title: '二维模板组ID', field: 'templateGroup2DId', width: 'auto', slots: { default: 'templateGroup2DIdSlot' } },
    { title: '创建时间', field: 'createTime', width: 180 },
    { title: '更新时间', field: 'updateTime', width: 180 },
    { title: '操作', field: 'operation', width: 120, fixed: 'right', slots: { default: 'operationDefaultSlot' } },
  ],
  checkboxConfig: { reserve: true },
})

const dataSource = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const selectedIds = ref<string[]>([])

// 弹窗相关状态
const materialDialogVisible = ref(false)
const templateDialogVisible = ref(false)
const materialDetail = ref<any>(null)
const templateDetail = ref<any>(null)

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

// 获取模板图片列表
function getTemplateImages(template: any): string[] {
  const images: string[] = []
  for (let i = 1; i <= 10; i++) {
    const imageUrl = template[`image${i}`]
    if (imageUrl && imageUrl.trim()) {
      images.push(imageUrl)
    }
  }
  return images
}

// 获取模板图片配置
function getTemplateImageOption(template: any, index: number): string {
  const option = template[`imageOption${index}`]
  if (option && option.trim()) {
    try {
      // 尝试解析JSON配置
      const parsed = JSON.parse(option)
      return JSON.stringify(parsed, null, 2)
    } catch {
      // 如果不是JSON，直接返回字符串
      return option
    }
  }
  return ''
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
    await ElMessageBox.confirm(
      '确定要删除该记录吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

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

// 查看关联素材
async function handleViewMaterial(materialId: string) {
  if (!materialId) {
    ElMessage.warning('素材ID为空')
    return
  }
  
  materialDialogVisible.value = true
  materialDetail.value = null
  
  try {
    // 根据后端接口定义，使用 sticker/page 接口获取素材详情
    // 使用 POST 方式：POST /sticker/page
    const res = await request.post({ 
      url: `/sticker/page`, 
      data: { 
        id: materialId, 
        currentPage: 1, 
        pageSize: 1 
      } 
    })
    materialDetail.value = res.list?.[0] || res
  } catch (e) {
    console.error('获取素材详情失败:', e)
    ElMessage.error('获取素材详情失败')
    materialDetail.value = {
      id: materialId,
      name: '获取失败',
      type: '-',
      category: '-',
      createTime: '-',
      updateTime: '-',
      description: '获取素材详情失败，请稍后重试'
    }
  }
}

// 查看关联模板
async function handleViewTemplate(templateGroup2DId: string) {
  if (!templateGroup2DId) {
    ElMessage.warning('模板组ID为空')
    return
  }
  
  templateDialogVisible.value = true
  templateDetail.value = null
  
  try {
    // 使用现有的API函数获取模板详情
    // 由于分页接口不支持ID过滤，我们需要获取所有模板然后过滤
    const res = await pageTemplateGroup2D({ page: 1, pageSize: 1000 })
    const template = res.list?.find((item: any) => item.id === templateGroup2DId)
    templateDetail.value = template || null
  } catch (e) {
    console.error('获取模板详情失败:', e)
    ElMessage.error('获取模板详情失败')
    templateDetail.value = {
      id: templateGroup2DId,
      name: '获取失败',
      type: '-',
      category: '-',
      createTime: '-',
      updateTime: '-',
      description: '获取模板详情失败，请稍后重试'
    }
  }
}

// 关闭素材详情弹窗
function handleCloseMaterialDialog() {
  materialDialogVisible.value = false
  materialDetail.value = null
}

// 关闭模板详情弹窗
function handleCloseTemplateDialog() {
  templateDialogVisible.value = false
  templateDetail.value = null
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

/* 弹窗样式 */
.material-detail,
.template-detail {
  max-height: 60vh;
  overflow-y: auto;
}

.material-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.material-image {
  width: 120px;
  height: 120px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
}

.template-images {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.template-image-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  background-color: var(--el-bg-color-page);
}

.template-image-info {
  flex: 1;
}

.template-image-info p {
  margin: 4px 0;
  font-size: 14px;
}

.template-image-preview {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
}

.preview-thumb {
  width: 100%;
  height: 100%;
}
</style>


