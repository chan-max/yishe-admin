<template>
  <div >
    <div class="py-4 flex justify-between items-center">
      <div class="flex gap-2 items-center">
        <el-select 
          v-model="queryParams.status" 
          placeholder="选择状态" 
          clearable 
          style="width: 160px"
          @change="handleStatusFilter"
        >
          <el-option
            v-for="option in STATUS_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </div>
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
      align-center
    >
      <div v-if="materialDetail" class="material-detail">
        <div v-if="materialDetail.url" class="mb-4">
          <h4>素材图片：</h4>
          <div class="material-images">
            <el-image
              :src="materialDetail.url"
              :preview-src-list="[materialDetail.url]"
              fit="contain"
              class="material-image"
            />
          </div>
        </div>
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
      align-center
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
              <div class="template-image-preview">
                <el-image
                  :src="image"
                  :preview-src-list="getTemplateImages(templateDetail)"
                  :initial-index="index"
                  fit="cover"
                  class="preview-thumb"
                />
                <div class="image-overlay">
                  <span class="image-label">图片{{ index + 1 }}</span>
                </div>
              </div>
              <div class="template-image-config">
                <div v-if="getTemplateImageConfig(templateDetail, index + 1)" class="config-details">
                  <div class="config-line">
                    <span class="label">位置:</span>
                    <span class="value">{{ getTemplateImageConfig(templateDetail, index + 1).position?.xPercent || 0 }}%, {{ getTemplateImageConfig(templateDetail, index + 1).position?.yPercent || 0 }}%</span>
                  </div>
                  <div class="config-line">
                    <span class="label">尺寸:</span>
                    <span class="value">{{ getTemplateImageConfig(templateDetail, index + 1).size?.widthPercent || 30 }}%</span>
                  </div>
                  <div class="config-line">
                    <span class="label">透明度:</span>
                    <span class="value">{{ getTemplateImageConfig(templateDetail, index + 1).opacity || 100 }}%</span>
                  </div>
                  <div class="config-line" v-if="getTemplateImageConfig(templateDetail, index + 1).keepOriginal">
                    <span class="label">保持原图:</span>
                    <span class="value">是</span>
                  </div>
                </div>
                <div v-else class="config-default">默认配置</div>
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

    <!-- 编辑产品信息弹窗 -->
    <el-dialog
      v-model="editInfoDialogVisible"
      title="编辑产品信息"
      width="600px"
      :before-close="handleCloseEditInfoDialog"
      align-center
    >
      <el-form :model="editInfoForm" :rules="editInfoRules" ref="editInfoFormRef" label-width="100px">
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="editInfoForm.name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="产品描述" prop="description">
          <el-input 
            v-model="editInfoForm.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入产品描述" 
          />
        </el-form-item>
        <el-form-item label="关键词" prop="keywords">
          <el-input 
            v-model="editInfoForm.keywords" 
            placeholder="请输入关键词，多个关键词用逗号分隔" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editInfoDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditInfo" :loading="editInfoLoading">确定</el-button>
      </template>
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
          <div class="images">
            <div v-for="(image, index) in getImageList(row)" :key="index" class="img-wrap">
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
          <div class="flex items-center justify-center">
            <el-button 
              link 
              type="primary" 
              size="small" 
              @click="handleViewMaterial(row.materialId)"
              :disabled="!row.materialId"
            >
              查看素材
            </el-button>
          </div>
        </template>
        <template #templateGroup2DIdSlot="{ row }">
          <div class="flex items-center justify-center">
            <el-button 
              link 
              type="primary" 
              size="small" 
              @click="handleViewTemplate(row.templateGroup2DId)"
              :disabled="!row.templateGroup2DId"
            >
              查看模板
            </el-button>
          </div>
        </template>
        <template #statusSlot="{ row }">
          <el-tag 
            :type="getStatusTagType(row.publishStatus)"
            size="small"
          >
            {{ STATUS_TEXT[row.publishStatus] || '未知' }}
          </el-tag>
        </template>
        <template #operationDefaultSlot="{ row }">
          <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)">
            <el-button link type="primary" size="small">
              操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit-info">
                  编辑产品信息
                </el-dropdown-item>
                <el-dropdown-item command="mark-pending" v-if="row.publishStatus !== PUBLISH_STATUS.PENDING_SOCIAL_MEDIA">
                  标记为待发布
                </el-dropdown-item>
                <el-dropdown-item command="mark-published" v-if="row.publishStatus !== PUBLISH_STATUS.PUBLISHED_SOCIAL_MEDIA">
                  标记为已发布
                </el-dropdown-item>
                <el-dropdown-item command="mark-draft" v-if="row.publishStatus !== PUBLISH_STATUS.DRAFT">
                  标记为草稿
                </el-dropdown-item>
                <el-dropdown-item command="mark-archived" v-if="row.publishStatus !== PUBLISH_STATUS.ARCHIVED">
                  标记为已归档
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided class="text-red-500">删除</el-dropdown-item>
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
import { ref, reactive, onMounted, watchEffect } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { commonGridOptions } from '@/common/table'
import request from '@/config/axios'
import { ArrowDown, Loading } from '@element-plus/icons-vue'
import { pageTemplateGroup2D } from '@/api/templateGroup2D'
import { useWindowSize } from '@vueuse/core'

// 状态常量定义
const PUBLISH_STATUS = {
  DRAFT: 'draft',                    // 草稿
  PENDING_SOCIAL_MEDIA: 'pending_social_media',  // 待发布社交媒体
  PUBLISHED_SOCIAL_MEDIA: 'published_social_media',  // 已发布社交媒体
  ARCHIVED: 'archived'               // 已归档
} as const

// 状态显示文本
const STATUS_TEXT = {
  [PUBLISH_STATUS.DRAFT]: '草稿',
  [PUBLISH_STATUS.PENDING_SOCIAL_MEDIA]: '待发布社交媒体',
  [PUBLISH_STATUS.PUBLISHED_SOCIAL_MEDIA]: '已发布社交媒体',
  [PUBLISH_STATUS.ARCHIVED]: '已归档'
} as const

// 状态选项
const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '草稿', value: PUBLISH_STATUS.DRAFT },
  { label: '待发布社交媒体', value: PUBLISH_STATUS.PENDING_SOCIAL_MEDIA },
  { label: '已发布社交媒体', value: PUBLISH_STATUS.PUBLISHED_SOCIAL_MEDIA },
  { label: '已归档', value: PUBLISH_STATUS.ARCHIVED }
]

const queryParams = reactive({ 
  currentPage: 1, 
  pageSize: 20,
  status: '' // 状态过滤
})

const gridOptions = ref<any>({
  ...commonGridOptions,
  columns: [
    { type: 'checkbox', width: 50 },
    { title: '合成图片', field: 'images', minWidth: 'auto', slots: { default: 'imagesSlot' } },
    { title: '产品名称', field: 'name', width: 200, showOverflow: true },
    { title: '产品描述', field: 'description', width: 200, showOverflow: true },
    { title: '关键词', field: 'keywords', width: 150, showOverflow: true },
    { title: '素材详情', field: 'materialId', width: 120, slots: { default: 'materialIdSlot' } },
    { title: '模板详情', field: 'templateGroup2DId', width: 120, slots: { default: 'templateGroup2DIdSlot' } },
    { 
      title: '发布状态', 
      field: 'publishStatus', 
      width: 140, 
      slots: { default: 'statusSlot' },
      formatter: ({ cellValue }) => STATUS_TEXT[cellValue] || '未知'
    },
    { title: '创建时间', field: 'createTime', width: 180 },
    { title: '更新时间', field: 'updateTime', width: 180 },
    { title: '操作', field: 'operation', width: 120, fixed: 'right', slots: { default: 'operationDefaultSlot' } },
  ],
  checkboxConfig: { reserve: true },
})

const { height } = useWindowSize()

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 250
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

// 编辑产品信息相关状态
const editInfoDialogVisible = ref(false)
const editInfoLoading = ref(false)
const editInfoFormRef = ref()
const currentEditRow = ref<any>(null)
const editInfoForm = ref({
  name: '',
  description: '',
  keywords: ''
})

const editInfoRules = {
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }]
}

async function getList() {
  loading.value = true
  try {
    console.log('获取二维设计商品图列表...')
    const requestData: any = { 
      page: queryParams.currentPage, 
      pageSize: queryParams.pageSize 
    }
    
    // 添加状态过滤条件
    if (queryParams.status) {
      requestData.publishStatus = queryParams.status
    }
    
    const res = await request.post({ url: '/product-image-2d/page', data: requestData })
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

// 获取图片配置（解析为对象）
function getImageConfig(row: any, imageIndex: number): any {
  const key = `imageOption${imageIndex}`
  const config = row[key]
  if (!config) return null
  
  try {
    // 如果是字符串，尝试解析JSON
    if (typeof config === 'string') {
      return JSON.parse(config)
    }
    // 如果已经是对象，直接返回
    if (typeof config === 'object') {
      return config
    }
  } catch (e) {
    console.warn(`解析图片${imageIndex}配置失败:`, e)
  }
  
  return null
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

// 获取模板图片配置（解析为对象）
function getTemplateImageConfig(template: any, index: number): any {
  const option = template[`imageOption${index}`]
  if (!option) return null
  
  try {
    // 如果是字符串，尝试解析JSON
    if (typeof option === 'string') {
      return JSON.parse(option)
    }
    // 如果已经是对象，直接返回
    if (typeof option === 'object') {
      return option
    }
  } catch (e) {
    console.warn(`解析图片${index}配置失败:`, e)
  }
  
  return null
}

// 获取模板图片配置（原始字符串格式，用于兼容）
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

// 状态过滤处理
function handleStatusFilter() {
  queryParams.currentPage = 1 // 重置到第一页
  getList()
}

// 获取状态标签类型
function getStatusTagType(status: string): 'info' | 'warning' | 'success' | 'danger' | 'primary' {
  switch (status) {
    case PUBLISH_STATUS.DRAFT:
      return 'info'
    case PUBLISH_STATUS.PENDING_SOCIAL_MEDIA:
      return 'warning'
    case PUBLISH_STATUS.PUBLISHED_SOCIAL_MEDIA:
      return 'success'
    case PUBLISH_STATUS.ARCHIVED:
      return 'danger'
    default:
      return 'primary'
  }
}

// 更新状态
async function updateStatus(row: any, newStatus: string) {
  try {
    await request.put({ 
      url: `/product-image-2d/${row.id}/status`, 
      data: { publishStatus: newStatus } 
    })
    ElMessage.success('状态更新成功')
    getList() // 重新获取列表
  } catch (e) {
    console.error('更新状态失败:', e)
    ElMessage.error('状态更新失败')
  }
}

function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case 'edit-info':
      handleEditInfo(row)
      break
    case 'delete':
      handleDelete(row)
      break
    case 'mark-pending':
      updateStatus(row, PUBLISH_STATUS.PENDING_SOCIAL_MEDIA)
      break
    case 'mark-published':
      updateStatus(row, PUBLISH_STATUS.PUBLISHED_SOCIAL_MEDIA)
      break
    case 'mark-draft':
      updateStatus(row, PUBLISH_STATUS.DRAFT)
      break
    case 'mark-archived':
      updateStatus(row, PUBLISH_STATUS.ARCHIVED)
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

// 编辑产品信息
function handleEditInfo(row: any) {
  currentEditRow.value = row
  editInfoForm.value = {
    name: row.name || '',
    description: row.description || '',
    keywords: row.keywords || ''
  }
  editInfoDialogVisible.value = true
}

// 提交编辑产品信息
async function submitEditInfo() {
  if (!currentEditRow.value?.id) return
  
  editInfoLoading.value = true
  try {
    await editInfoFormRef.value.validate()
    
    await request.put({ 
      url: `/product-image-2d/${currentEditRow.value.id}/info`, 
      data: editInfoForm.value 
    })
    
    ElMessage.success('产品信息更新成功')
    editInfoDialogVisible.value = false
    getList() // 重新获取列表
  } catch (e) {
    console.error('更新产品信息失败:', e)
    ElMessage.error('更新产品信息失败')
  } finally {
    editInfoLoading.value = false
  }
}

// 关闭编辑产品信息弹窗
function handleCloseEditInfoDialog() {
  editInfoDialogVisible.value = false
  currentEditRow.value = null
  editInfoForm.value = {
    name: '',
    description: '',
    keywords: ''
  }
}
</script>

<style scoped>
.images {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  align-items: center;
}

.images .img-wrap {
  position: relative;
}

.images .preview-image {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
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
  max-width: 300px;
  max-height: 300px;
  width: auto;
  height: auto;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
}

.template-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 8px;
}

.template-image-item {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background-color: var(--el-bg-color-page);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.template-image-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.template-image-preview {
  position: relative;
  width: 100%;
  height: 120px;
  overflow: hidden;
  border-bottom: 1px solid var(--el-border-color-light);
}

.preview-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.template-image-config {
  padding: 12px;
  flex: 1;
}

/* 模板配置显示样式 */
.config-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  line-height: 1.4;
}

.config-line .label {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  min-width: 50px;
}

.config-line .value {
  color: var(--el-color-primary);
  font-weight: 600;
  text-align: right;
  flex: 1;
  margin-left: 8px;
}

.config-default {
  color: var(--el-text-color-placeholder);
  font-style: italic;
  font-size: 12px;
  text-align: center;
  padding: 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}
</style>


