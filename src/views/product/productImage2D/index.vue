<template>
  <div >
    <div class="py-4 flex justify-between items-center">
      <div class="flex gap-4 items-center">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">发布状态：</span>
          <el-select v-model="queryParams.publishStatus" placeholder="选择状态" size="small" style="width: 160px" @change="handleStatusFilter">
            <el-option
              v-for="option in STATUS_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
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
      v-model="editProductDialogVisible"
      title="编辑产品信息"
      width="600px"
      align-center
      :before-close="handleCloseEditProductDialog"
    >
      <el-form
        ref="editProductFormRef"
        :model="editProductForm"
        :rules="editProductRules"
        label-width="80px"
      >
        <el-form-item label="产品名称" prop="name">
          <el-input
            v-model="editProductForm.name"
            placeholder="请输入产品名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="产品描述" prop="description">
          <el-input
            v-model="editProductForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入产品描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="关键词" prop="keywords">
          <el-input
            v-model="editProductForm.keywords"
            placeholder="请输入关键词，多个关键词用逗号分隔"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseEditProductDialog">取消</el-button>
          <el-button type="primary" @click="handleSaveProductInfo" :loading="editProductLoading">
            保存
          </el-button>
        </div>
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
                :preview-teleported="true"
                :preview-mask="true"
                :preview-close-on-press-escape="true"
                :preview-close-on-click-modal="true"
                :preview-append-to-body="true"
                @preview-close="handlePreviewClose"
                @preview-switch="handlePreviewSwitch"
                @click="handleImageClick(getImageList(row), index)"
              />
            </div>
            <div v-if="!getImageList(row).length" class="no-images">
              暂无合成图片
            </div>
          </div>
        </template>
        <template #statusSlot="{ row }">
          <el-tag :type="getStatusTagType(row.publishStatus)" size="small">
            {{ STATUS_TEXT[row.publishStatus] || '未知' }}
          </el-tag>
        </template>
        <template #codeSlot="{ row }">
          <div class="product-code">
            <span v-if="row.code" class="code-text">{{ row.code }}</span>
          </div>
        </template>
        <template #nameSlot="{ row }">
          <div class="product-name">
            <span v-if="row.name" class="name-text">{{ row.name }}</span>
          </div>
        </template>
        <template #descriptionSlot="{ row }">
          <div class="product-description">
            <span v-if="row.description" class="description-text">{{ row.description }}</span>
          </div>
        </template>
        <template #keywordsSlot="{ row }">
          <div class="product-keywords">
            <span v-if="row.keywords" class="keywords-text">{{ row.keywords }}</span>
          </div>
        </template>
        <template #isPublicSlot="{ row }">
          <span v-if="row.isPublic" class="is-public-tag">是</span>
          <span v-else class="not-public-tag">否</span>
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
        <template #operationDefaultSlot="{ row }">
          <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)">
            <el-button link type="primary" size="small">
              操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit-product" class="text-primary">编辑产品信息</el-dropdown-item>
                <el-dropdown-item 
                  command="generate-code" 
                  class="text-purple-500"
                  :disabled="generatingCodeId === row.id"
                >
                  {{ generatingCodeId === row.id ? '生成中...' : (row.code ? '重新生成代码' : '生成产品代码') }}
                </el-dropdown-item>
                <el-dropdown-item divided command="mark-pending" class="text-orange-500">标记为待发布</el-dropdown-item>
                <el-dropdown-item command="mark-published" class="text-green-500">标记为已发布</el-dropdown-item>
                <el-dropdown-item command="mark-draft" class="text-blue-500">标记为草稿</el-dropdown-item>
                <el-dropdown-item command="mark-archived" class="text-gray-500">标记为已归档</el-dropdown-item>
                <el-dropdown-item divided command="toggle-public" class="text-blue-500">
                  {{ row.isPublic ? '取消发布' : '发布' }}
                </el-dropdown-item>
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
import { ref, reactive, onMounted, watchEffect } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { commonGridOptions } from '@/common/table'
import request from '@/config/axios'
import { ArrowDown, Loading } from '@element-plus/icons-vue'
import { pageTemplateGroup2D } from '@/api/templateGroup2D'
import { useWindowSize } from '@vueuse/core'

// 发布状态常量
const PUBLISH_STATUS = {
  DRAFT: 'draft',
  PENDING_SOCIAL_MEDIA: 'pending_social_media',
  PUBLISHED_SOCIAL_MEDIA: 'published_social_media',
  ARCHIVED: 'archived'
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

const queryParams = reactive({ currentPage: 1, pageSize: 20, publishStatus: '' })

// 获取窗口尺寸
const { height } = useWindowSize()

const gridOptions = ref<any>({
  ...commonGridOptions,
  columns: [
    { type: 'checkbox', width: 50 },
    { title: '合成图片', field: 'images', minWidth: 'auto', slots: { default: 'imagesSlot' } },
    { title: '产品代码', field: 'code', width: 120, slots: { default: 'codeSlot' } },
    { title: '产品名称', field: 'name', width: 150, slots: { default: 'nameSlot' } },
    { title: '产品描述', field: 'description', width: 200, slots: { default: 'descriptionSlot' } },
    { title: '关键词', field: 'keywords', width: 150, slots: { default: 'keywordsSlot' } },
    { title: '发布状态', field: 'publishStatus', width: 140, slots: { default: 'statusSlot' } },
    { title: '是否公开', field: 'isPublic', width: 100, slots: { default: 'isPublicSlot' } },
    { title: '素材详情', field: 'materialId', width: 120, slots: { default: 'materialIdSlot' } },
    { title: '模板详情', field: 'templateGroup2DId', width: 120, slots: { default: 'templateGroup2DIdSlot' } },
    { title: '创建时间', field: 'createTime', width: 180 },
    { title: '更新时间', field: 'updateTime', width: 180 },
    { title: '操作', field: 'operation', width: 120, fixed: 'right', slots: { default: 'operationDefaultSlot' } },
  ],
  checkboxConfig: { reserve: true },
})

// 监听窗口尺寸变化，动态调整表格高度
watchEffect(() => {
  // 计算表格最大高度：窗口高度 - 头部区域 - 分页区域 - 其他边距
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
const editProductDialogVisible = ref(false)
const editProductFormRef = ref()
const editProductLoading = ref(false)
const editProductForm = reactive({
  id: '',
  name: '',
  description: '',
  keywords: ''
})

// 编辑产品信息表单验证规则
const editProductRules = {
  name: [
    { required: true, message: '请输入产品名称', trigger: 'blur' },
    { min: 1, max: 100, message: '产品名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '产品描述长度不能超过 500 个字符', trigger: 'blur' }
  ],
  keywords: [
    { max: 200, message: '关键词长度不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 图片预览相关状态
const currentPreviewImages = ref<string[]>([])
const currentPreviewIndex = ref(0)

// 生成代码相关状态
const generatingCodeId = ref<string>('')

// 生成唯一码
async function handleGenerateCode(row: any) {
  if (!row?.id) return
  
  try {
    generatingCodeId.value = row.id
    
    await request.post({
      url: '/product-image-2d/generate-code',
      data: { id: row.id }
    })
    
    const message = row.code ? '产品代码重新生成成功' : '产品代码生成成功'
    ElMessage.success(message)
    getList()
  } catch (e) {
    console.error('生成产品代码失败:', e)
    ElMessage.error('生成产品代码失败')
  } finally {
    generatingCodeId.value = ''
  }
}

async function getList() {
  loading.value = true
  try {
    console.log('获取二维设计商品图列表...')
    const res = await request.post({ 
      url: '/product-image-2d/page', 
      data: { 
        page: queryParams.currentPage, 
        pageSize: queryParams.pageSize,
        publishStatus: queryParams.publishStatus
      } 
    })
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

function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case 'edit-product':
      handleEditProduct(row)
      break
    case 'generate-code':
      handleGenerateCode(row)
      break
    case 'delete':
      handleDelete(row)
      break
    case 'mark-pending':
      updateStatus(row.id, PUBLISH_STATUS.PENDING_SOCIAL_MEDIA)
      break
    case 'mark-published':
      updateStatus(row.id, PUBLISH_STATUS.PUBLISHED_SOCIAL_MEDIA)
      break
    case 'mark-draft':
      updateStatus(row.id, PUBLISH_STATUS.DRAFT)
      break
    case 'mark-archived':
      updateStatus(row.id, PUBLISH_STATUS.ARCHIVED)
      break
    case 'toggle-public':
      togglePublic(row)
      break
    default:
      console.warn('未知的操作命令:', command)
  }
}

// 状态过滤处理
function handleStatusFilter() {
  queryParams.currentPage = 1
  getList()
}

// 获取状态标签类型
function getStatusTagType(status: string) {
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
async function updateStatus(id: string, status: string) {
  try {
    await request.post({ 
      url: '/product-image-2d/update-status', 
      data: { id, publishStatus: status } 
    })
    ElMessage.success('状态更新成功')
    getList()
  } catch (e) {
    console.error('更新状态失败:', e)
    ElMessage.error('状态更新失败')
  }
}

// 切换发布状态
async function togglePublic(row: any) {
  try {
    await request.post({ 
      url: '/product-image-2d/update-status', 
      data: { id: row.id, isPublic: !row.isPublic } 
    })
    ElMessage.success(row.isPublic ? '已取消发布' : '已发布')
    getList()
  } catch (e) {
    console.error('更新发布状态失败:', e)
    ElMessage.error('更新发布状态失败')
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
function handleEditProduct(row: any) {
  editProductForm.id = row.id
  editProductForm.name = row.name || ''
  editProductForm.description = row.description || ''
  editProductForm.keywords = row.keywords || ''
  editProductDialogVisible.value = true
}

// 关闭编辑产品信息弹窗
function handleCloseEditProductDialog() {
  editProductDialogVisible.value = false
  editProductForm.id = ''
  editProductForm.name = ''
  editProductForm.description = ''
  editProductForm.keywords = ''
  // 清除表单验证
  if (editProductFormRef.value) {
    editProductFormRef.value.clearValidate()
  }
}

// 保存产品信息
async function handleSaveProductInfo() {
  if (!editProductFormRef.value) return
  
  try {
    // 验证表单
    await editProductFormRef.value.validate()
    
    editProductLoading.value = true
    
    await request.post({
      url: '/product-image-2d/update-product-info',
      data: {
        id: editProductForm.id,
        name: editProductForm.name,
        description: editProductForm.description,
        keywords: editProductForm.keywords
      }
    })
    
    ElMessage.success('产品信息更新成功')
    handleCloseEditProductDialog()
    getList()
  } catch (e) {
    console.error('更新产品信息失败:', e)
    ElMessage.error('更新产品信息失败')
  } finally {
    editProductLoading.value = false
  }
}

// 预览关闭事件
function handlePreviewClose() {
  currentPreviewImages.value = []
  currentPreviewIndex.value = 0
}

// 预览切换事件
function handlePreviewSwitch(index: number) {
  currentPreviewIndex.value = index
}

// 下载当前预览的图片
async function handleDownloadCurrentImage() {
  if (currentPreviewImages.value.length === 0) return
  
  const currentImage = currentPreviewImages.value[currentPreviewIndex.value]
  const filename = `合成图片${currentPreviewIndex.value + 1}`
  
  try {
    ElMessage.info('正在下载图片...')
    
    // 使用fetch获取图片数据
    const response = await fetch(currentImage)
    if (!response.ok) {
      throw new Error('图片下载失败')
    }
    
    // 获取图片的blob数据
    const blob = await response.blob()
    
    // 创建blob URL
    const blobUrl = window.URL.createObjectURL(blob)
    
    // 创建下载链接
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `${filename}.jpg`
    
    // 添加到DOM中，触发点击，然后移除
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理blob URL
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl)
    }, 1000)
    
    ElMessage.success('下载完成')
  } catch (error) {
    console.error('下载图片失败:', error)
    ElMessage.error('下载失败，请稍后重试')
  }
}

// 图片点击事件
function handleImageClick(images: string[], index: number) {
  currentPreviewImages.value = images
  currentPreviewIndex.value = index
  
  // 延迟添加下载按钮，确保预览弹窗已经渲染
  setTimeout(() => {
    addDownloadButtonToPreview()
  }, 100)
}

// 在预览弹窗中添加下载按钮
function addDownloadButtonToPreview() {
  const previewContainer = document.querySelector('.el-image-viewer__wrapper')
  if (!previewContainer) return
  
  // 检查是否已经添加了下载按钮
  if (previewContainer.querySelector('.preview-download-btn')) return
  
  const downloadBtn = document.createElement('div')
  downloadBtn.className = 'preview-download-btn'
  downloadBtn.innerHTML = `
    <button 
      style="
        position: absolute;
        bottom: 20px;
        right: 20px;
        z-index: 2000;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 4px;
      "
      onmouseover="this.style.background='rgba(0, 0, 0, 0.9)'"
      onmouseout="this.style.background='rgba(0, 0, 0, 0.7)'"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      下载
    </button>
  `
  
  downloadBtn.addEventListener('click', handleDownloadCurrentImage)
  previewContainer.appendChild(downloadBtn)
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
  flex-shrink: 0;
}

.images .preview-image {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
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

/* 产品信息字段样式 */
.product-code,
.product-name,
.product-description,
.product-keywords {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 4px 0;
}

.code-text,
.name-text,
.description-text,
.keywords-text {
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 1.4;
  word-break: break-all;
}

.code-text {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: var(--el-color-primary);
}

.product-description {
  max-width: 200px;
}

.product-description .description-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-template-tag, .not-template-tag, .is-public-tag, .not-public-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  height: 28px;
  line-height: 28px;
  border-radius: 16px;
  font-size: 15px;
}
.is-template-tag {
  font-weight: bold;
  color: #fff;
  background: linear-gradient(90deg, #FFD700 0%, #FFB300 100%);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.12);
  border: 1.5px solid #FFD700;
}
.not-template-tag {
  font-weight: 500;
  color: rgba(120,120,120,0.25);
  background: rgba(220,220,220,0.12);
  border: 1px solid rgba(200,200,200,0.12);
  transition: all 0.2s;
}
.is-public-tag {
  font-weight: bold;
  color: #fff;
  background: linear-gradient(90deg, #67C23A 0%, #85CE61 100%);
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.12);
  border: 1.5px solid #67C23A;
}
.not-public-tag {
  font-weight: 500;
  color: rgba(120,120,120,0.25);
  background: rgba(220,220,220,0.12);
  border: 1px solid rgba(200,200,200,0.12);
  transition: all 0.2s;
}
</style>


