<template>
  <div>
    <div class=" flex pb-4 flex-wrap justify-end gap-4 items-center">
      <div style="flex: 1"></div>
      <form-item label="按名称搜索">
        <el-input
          v-model="queryParams.imageName"
          placeholder="请输入图片名称"
          style="width: 160px"
          clearable
          @change="
            (val) => {
              if (!val) {
                getList()
              }
            }
          "
        />
      </form-item>
      <el-button type="primary" :icon="Search" @click="getList"> 搜索 </el-button>

      <form-item label="按时间查询">
        <DateRangePicker
          @change="
            (val) => {
              queryParams.startTime = val.start
              queryParams.endTime = val.end
              getList()
            }
          "
        />
      </form-item>


      <div class="flex shrink-0">
        <el-button
          type="primary"
          @click="
            () => {
              uploadModalVisible = true
            }
          "
        >
          上传
        </el-button>

        <el-button type="default" @click="handleMultiDownload(null)">
          下载 ({{ ids.length }})
        </el-button>

        <el-button
          type="primary"
          @click="
            () => {
              if (!ids.length) {
                return ElMessage.warning('请选择要制作的素材')
              }
              currentRow = null
              genPicturesModalVisible = true
            }
          "
        >
          制作套图({{ ids.length }})
        </el-button>

        <el-button
          type="success"
          @click="
            async () => {
              if (!ids.length) {
                return ElMessage.warning('请选择要制作的素材')
              }
              resetDesignModelSteps()
              designModelModalVisible = true
              await loadDesignModels()
            }
          "
        >
          制作设计模型({{ ids.length }})
        </el-button>



        <!-- <el-button type="warning" @click="handleMultipleCheck(0)">
          取消入库 ({{ ids.length }})</el-button> -->
        <el-button type="danger" :icon="Delete" @click="handleDelete(null)">
          批量删除({{ ids.length }})
        </el-button>
      </div>
    </div>

    <div class="flex gap-4">
      <div class="content-container" :style="{ width: '100%' }">
        <div class="common-table">
          <vxe-grid
            ref="gridRef"
            v-bind="gridOptions"
            :data="dataSource"
            :loading="loading"
            @checkbox-change="checkboxChange"
            @checkbox-all="checkboxAllChange"
          >
            <template #previewDefaultSlot="{ row }">
              <div class="flex items-center justify-center p-2">
                <img
                  :src="row.url"
                  :alt="row.name || '素材图片'"
                  style="width:120px; height:auto; object-fit:contain; background:#f5f5f5; cursor:pointer;"
                  @click="openImagePreview(row.url, row.name)"
                  @error="handleImageError"
                />
              </div>
            </template>

            <template #resolutionSlot="{ row }">
              <span>{{ row.resolutionWidth && row.resolutionHeight ? row.resolutionWidth + '×' + row.resolutionHeight : '-' }}</span>
            </template>
            <template #originWebSlot="{ row }">
              <span>{{ row.originWeb || '-' }}</span>
            </template>
            <template #sizeSlot="{ row }">
              <span>{{ row.size ? (row.size / 1024).toFixed(1) + ' KB' : '-' }}</span>
            </template>

            <template #operationDefaultSlot="{ row }">
              <div class="flex items-center">
                <el-dropdown trigger="click">
                  <el-button circle size="small" style="border: 1px solid #d9d9d9; background: #f4f6fa; color: #333; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">
                    <el-icon><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleEdit(row)">编辑</el-dropdown-item>
                      <el-dropdown-item @click="handleDownload(row)">下载</el-dropdown-item>
                      <el-dropdown-item @click="handleDesignModel(row)">制作设计模型</el-dropdown-item>
                      <el-dropdown-item @click="onAiTableAutoGenerate(row)">AI自动生成内容</el-dropdown-item>
                      <el-dropdown-item @click="handleGeneratePhash(row)">生成哈希</el-dropdown-item>
                      <el-dropdown-item divided @click="handleDelete(row)">
                        <span style="color:var(--el-color-danger)">删除</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-icon v-if="aiTableLoading?.[row?.id]" class="is-loading ml-2" style="color:#409EFF;font-size:18px;" />
              </div>
            </template>
          </vxe-grid>
        </div>

        <!-- 分页 -->
        <div class="flex justify-end">
          <pagination
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            :total="total"
            @pagination="getList"
          />
        </div>
      </div>
    </div>

    <el-dialog
      v-model="uploadModalVisible"
      title="素材上传"
      width="100%"
      style="height: 100%"
      align-center
      :footer="false"
      :destroy-on-close="true"
      class="material-upload-dialog"
      @close="uploadModalClose"
    >
      <div style="height: 100%">
        <list-upload
          :current-upload-info="currentUploadInfo"
          @single-file-uploaded="singleFileUploaded"
        />
      </div>
    </el-dialog>

    <el-dialog
      v-model="genPicturesModalVisible"
      draggable
      title="制作套图"
      width="800px"
      align-center
      :destroy-on-close="true"
      @close="
        () => {
          currentGenPictureConfig = []
        }
      "
    >
      <el-form
        ref="genPicturesFormRef"
        :model="genPicturesForm"
        :rules="genPicturesFormRules"
        label-width="100"
      >
        <el-row style="padding: 1em">
          <el-col :span="24">
            <gen-picture @config-change="configChange" />
          </el-col>
          <el-col class="py-4">
            <el-form-item label="是否制作视频">
              <el-switch v-model="genPicturesForm.isMakeVideo" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="genPicturesModalVisible = false">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 制作设计模型弹窗 -->
    <el-dialog
      v-model="designModelModalVisible"
      title="制作设计模型"
      width="100%"
      style="height: 100%"
      align-center
      :destroy-on-close="true"
      class="design-model-dialog"
      :footer="null"
      @close="resetDesignModelSteps"
    >
      <!-- 新增flex容器，左右布局 -->
      <div class="design-model-flex">
        <!-- 步骤指示器，纵向 -->
        <el-steps direction="vertical" :active="currentStep" finish-status="success" align-center class="steps-vertical">
          <el-step v-for="step in designModelSteps" :key="step.key" :title="step.title" :description="step.description" />
        </el-steps>
        <!-- 步骤内容区域 -->
        <div class="design-model-content" style="height: 100%; overflow-y: auto;">
          <div class="steps-all">
            <!-- 步骤1：选择素材 -->
            <div
              class="step-content"
              :class="{ 'step-active': currentStep === 0, 'step-inactive': currentStep !== 0 }"
            >
              <h3 class="text-lg font-bold mb-4">已选择的素材图：</h3>
              <div class="flex flex-wrap gap-4 mb-6">
                <template v-for="id in ids" :key="id">
                  <div v-if="dataSource.find(item => String(item.id) === String(id))" class="text-center">
                    <img 
                      :src="dataSource.find(item => String(item.id) === String(id)).url" 
                      :alt="dataSource.find(item => String(item.id) === String(id)).name"
                      class="w-20 h-20 object-cover rounded border"
                    />
                    <div class="text-xs text-gray-500 mt-1">{{ dataSource.find(item => String(item.id) === String(id)).name }}</div>
                  </div>
                </template>
              </div>
              
              <div class="border border-blue-200 rounded-lg p-4">
                <div class="flex items-start">
                  <el-icon class="text-blue-500 mt-0.5 mr-2">
                    <InfoFilled />
                  </el-icon>
                  <div class="text-sm text-blue-700">
                    <p class="font-medium mb-1">已选择 {{ ids.length }} 个素材</p>
                    <p>这些素材将用于制作设计模型，请确认选择无误后点击下一步。</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 步骤2：选择设计模型 -->
            <div
              class="step-content"
              :class="{ 'step-active': currentStep === 1, 'step-inactive': currentStep !== 1 }"
            >
              <h3 class="text-lg font-bold mb-4">选择设计模型：</h3>
              
              <div class="design-model-list">
                <div v-if="designModelLoading" class="text-center py-4">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  <span class="ml-2">加载中...</span>
                </div>
                
                <div v-else-if="designModelList.length === 0" class="text-center py-4 text-gray-500">
                  暂无设计模型
                </div>
                
                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div
                    v-for="model in designModelList"
                    :key="model.id"
                    class="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-all relative"
                    :class="{ 'border-blue-500 shadow-[0_0_0_4px_rgba(64,158,255,0.6)]': selectedDesignModelIds.includes(model.id) }"
                    @click="selectDesignModel(model)"
                  >
                    <div class="flex items-center space-x-3">
                      <img
                        v-if="model.thumbnail"
                        :src="model.thumbnail"
                        :alt="model.name"
                        class="w-16 h-16 object-cover rounded"
                      />
                      <div class="flex-1 min-w-0">
                        <h4 class="font-medium truncate">{{ model.name }}</h4>
                        <p class="text-sm text-gray-500 truncate">{{ model.description || '暂无描述' }}</p>
                        <p class="text-xs text-gray-400">{{ model.createTime }}</p>
                      </div>
                    </div>
                    
                    <!-- 选中状态图标 -->
                    <div 
                      v-if="selectedDesignModelIds.includes(model.id)"
                      class="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <el-icon class="text-sm">
                        <Check />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>

              <div class=" border border-blue-200 rounded-lg p-4 mt-4">
                <div class="flex items-start">
                  <el-icon class="text-blue-500 mt-0.5 mr-2">
                    <InfoFilled />
                  </el-icon>
                  <div class="text-sm text-blue-700">
                    <p class="font-medium mb-1">已选择 {{ selectedDesignModelIds.length }} 个设计模型</p>
                    <p>将生成 {{ ids.length * selectedDesignModelIds.length }} 个新设计模型</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 步骤3：确认制作 -->
            <div
              class="step-content"
              :class="{ 'step-active': currentStep === 2, 'step-inactive': currentStep !== 2 }"
            >
              <h3 class="text-lg font-bold mb-4">确认制作信息：</h3>
              
              <div class="bg-gray-50 rounded-lg p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- 素材信息 -->
                  <div>
                    <h4 class="font-medium text-gray-700 mb-3">选择的素材 ({{ ids.length }}个)</h4>
                    <div class="space-y-2">
                      <template v-for="id in ids" :key="id">
                        <div v-if="dataSource.find(item => String(item.id) === String(id))" class="flex items-center space-x-2">
                          <img 
                            :src="dataSource.find(item => String(item.id) === String(id)).url" 
                            :alt="dataSource.find(item => String(item.id) === String(id)).name"
                            class="w-8 h-8 object-cover rounded"
                          />
                          <span class="text-sm text-gray-600">{{ dataSource.find(item => String(item.id) === String(id)).name }}</span>
                        </div>
                      </template>
                    </div>
                  </div>

                  <!-- 设计模型信息 -->
                  <div>
                    <h4 class="font-medium text-gray-700 mb-3">选择的设计模型 ({{ selectedDesignModelIds.length }}个)</h4>
                    <div class="space-y-2">
                      <template v-for="modelId in selectedDesignModelIds" :key="modelId">
                        <div v-if="designModelList.find(model => model.id === modelId)" class="flex items-center space-x-2">
                          <img 
                            v-if="designModelList.find(model => model.id === modelId).thumbnail"
                            :src="designModelList.find(model => model.id === modelId).thumbnail" 
                            :alt="designModelList.find(model => model.id === modelId).name"
                            class="w-8 h-8 object-cover rounded"
                          />
                          <span class="text-sm text-gray-600">{{ designModelList.find(model => model.id === modelId).name }}</span>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>

                <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600 mb-2">
                      {{ ids.length }} × {{ selectedDesignModelIds.length }} = {{ ids.length * selectedDesignModelIds.length }}
                    </div>
                    <div class="text-sm text-blue-700">将生成 {{ ids.length * selectedDesignModelIds.length }} 个新设计模型</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 步骤导航按钮，移到内容底部 -->
          <div class="dialog-footer" style="margin-top: 16px;">
            <div class="flex-1 text-sm text-gray-600">
              <span>步骤 {{ currentStep + 1 }} / {{ designModelSteps.length }}</span>
            </div>
            <div class="flex gap-2">
              <el-button 
                v-if="currentStep > 0"
                @click="prevStep"
              >
                上一步
              </el-button>
              <el-button 
                v-if="currentStep < designModelSteps.length - 1"
                type="primary" 
                @click="nextStep"
                :disabled="!canProceedToNextStep"
              >
                下一步
              </el-button>
              <el-button 
                v-if="currentStep === designModelSteps.length - 1"
                type="success" 
                @click="handleDesignModelConfirm"
                :disabled="!selectedDesignModelIds.length"
              >
                开始制作
              </el-button>
              <el-button @click="designModelModalVisible = false">取消</el-button>
            </div>
          </div>
        </div>
      </div>
      <!-- 移除el-dialog的footer插槽 -->
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑素材信息" width="800px" :destroy-on-close="true" align-center>
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="editForm.name" placeholder="请输入名称" style="font-size:16px;height:48px;width:100%;" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="5" placeholder="请输入描述" style="font-size:16px;min-height:100px;width:100%;" />
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="editForm.keywords" placeholder="请输入关键字（逗号分隔）" style="font-size:16px;height:48px;width:100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="aiGenDialogVisible"
      title="AI自动生成内容"
      width="500px"
      align-center
      :destroy-on-close="true"
    >
      <div style="margin-bottom: 16px; color: #888; font-size: 15px;">请输入你希望AI分析的内容风格或角度（如：偏艺术描述、简洁风格、突出色彩等）</div>
      <el-input
        v-model="aiGenPrompt"
        type="textarea"
        :rows="6"
        placeholder="如：请用艺术化语言描述图片内容..."
        style="font-size:16px;min-height:120px;width:100%;resize:vertical;"
      />
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog">确定</el-button>
      </template>
    </el-dialog>

    <!-- 图片预览弹窗 -->
    <ImagePreview
      :visible="imagePreviewVisible"
      :image-url="currentImageUrl"
      @close="closeImagePreview"
    />

  </div>
</template>

<script setup lang="tsx">
import {
  ref,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  watch,
  handleError,
  watchEffect
} from 'vue'

import {
  getMaterialList,
  deleteAssetLibrary,
  checkAssetLibrary,
  pullAsset,
  materialCreatePictures,
  materialDistribute,
  getMaterialDetail,
  handleDropMaterial,
  aiAutoGenerateMaterialInfo,
  updateAssetLibrary,
  calculatePhash // 新增
} from '@/api/material' // 实际接口导入

import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import CryptoJS from 'crypto-js'

import { useDebounceFn, useLocalStorage, useSessionStorage, useWindowSize } from '@vueuse/core'
import { sortTypeOptions, defaultSortingValue } from '@/common/sort'
import { saveAs } from 'file-saver'

import { useUserStore } from '@/store/modules/user'
import listUpload from './listUpload.vue'
import { materialConfig, getMaterialConfig, categoryOptions } from '@/views/material/collect/index'
import { ElButton, ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, Search, TopRight, Upload, Loading, Check, More, InfoFilled } from '@element-plus/icons-vue'
import tree from './tree.vue'
import { materialStatusOptions } from '.'
import { getPsdTemplateList, getShopList } from '@/api/shop'
import { ShopApi } from '@/api/shop/shopIndex'
import { psdTemplateApi } from '@/api/psdTemplate'
import { formatDate } from '@/utils/formatTime'
import { getTitleTemplateList } from '@/api/publish'
import { downloadCrossOriginImage, downloadFileByElement, downloadImage } from '@/common/download'
import { useRouter } from 'vue-router'
import { ShopCategoryApi } from '@/api/shop/category'
import { getConfigTemplateList } from '@/api/publish/config'
import genPicture from './genPicture.vue'
import { getAccessToken } from '@/utils/auth'
import { getTenantId } from '@/utils/auth'
import useListSelect from '@/components/common/userListSelect.vue'
import { getDesignModelList } from '@/api/designModel'
import { getDesignToolMessenger } from '@/utils/designToolMessenger'
import request from '@/config/axios'

const userStore = useUserStore()

const form = ref({})

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  imageName: '',
  startTime: '',
  endTime: '',
  sortingFields: '',
})

// 展示模式
const picMode = useLocalStorage('material_view_mode', false)

watch(picMode, () => {
  ids.value = []
})

const gridRef = ref()

function resetCheckStatus() {
  if (gridRef.value?.clearCheckboxRow) {
    gridRef.value?.clearCheckboxRow()
  }
  if (gridRef.value?.clearCheckboxReserve) {
    gridRef.value?.clearCheckboxReserve()
  }
  ids.value = []
}

const gridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: 'id'
  },
  checkboxConfig: {
    reserve: true
  },
  columns: [
    { type: 'checkbox', width: 50, ellipsis: true, reserve: true },
    // { title: 'ID', field: 'id', width: 80, ellipsis: true },
    {
      title: '图片预览',
      field: 'url',
      width: 120,
      slots: { default: 'previewDefaultSlot' }
    },
    { title: '图片名称', field: 'name', minWidth: 180, className: 'font-bold' },
    { title: '描述', field: 'description', minWidth: 200 },
    { title: '关键词', field: 'keywords', minWidth: 160 },
    { title: '后缀', field: 'suffix', width: 80 }, // 新增后缀列
    { title: '感知哈希', field: 'phash', width: 80 }, // 新增后缀列
    {
      title: '创建时间',
      field: 'createTime',
      width: 150,
      ellipsis: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue)
      }
    },
    {
      title: '修改时间',
      field: 'updateTime',
      width: 150,
      ellipsis: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue)
      }
    },
    {
      title: '操作',
      fixed: 'right',
      width: 'auto',
      field: 'operation',
      slots: { default: 'operationDefaultSlot' }
    }
  ]
})

const { height } = useWindowSize()

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 280
})

const dataSource = ref([])
const loading = ref(false)
const open = ref(false)
const title = ref('')
const ids = ref<string[]>([])
const single = ref(false)
const multiple = ref(true)
const total = ref(0)
const formRef = ref()
const dialogTitle = ref('')
const dialogVisible = ref(false)
const isEdit = ref(true)
const currentRow = ref()
const submitLoading = ref(false)

const rules = {
  name: [{ required: true, message: '', trigger: 'blur' }]
}

const genPicturesModalVisible = ref(false)
const designModelModalVisible = ref(false)

// 设计模型相关
const designModelList = ref([])
const designModelLoading = ref(false)
const selectedDesignModelIds = ref([])

// 分步骤相关
const currentStep = ref(0)
const designModelSteps = ref([
  {
    key: 'select-materials',
    title: '选择素材',
    description: '确认要使用的素材'
  },
  {
    key: 'select-models',
    title: '选择设计模型',
    description: '选择要应用的设计模型'
  },
  {
    key: 'confirm',
    title: '确认制作',
    description: '确认制作信息并开始制作'
  }
])

// 计算是否可以进入下一步
const canProceedToNextStep = computed(() => {
  switch (currentStep.value) {
    case 0: // 选择素材步骤
      return ids.value.length > 0
    case 1: // 选择设计模型步骤
      return selectedDesignModelIds.value.length > 0
    case 2: // 确认制作步骤
      return true
    default:
      return false
  }
})

// 步骤导航方法
function nextStep() {
  if (currentStep.value < designModelSteps.value.length - 1 && canProceedToNextStep.value) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 重置步骤状态
function resetDesignModelSteps() {
  currentStep.value = 0
  selectedDesignModelIds.value = []
}

// 处理上传

const uploadModalVisible = ref(false)

function uploadModalClose() {}

async function getList() {
  loading.value = true
  let res = await getMaterialList({
    ...queryParams
  }).finally(() => {
    loading.value = false
  })

  dataSource.value = res.list
  total.value = res.total
  // ids.value = [];
}

function imgCardDelete(row) {
  handleDelete(row)
}

getList()

// 操作函数
function handleQuery() {
  queryParams.currentPage = 1
}

function resetQuery() {
  getList()
}

// 下载
function handleMultiDownload() {
  if (!ids.value.length) {
    return ElMessage.warning('请选择要下载的数据')
  }

  // 处理图片下载
  try {
    ids.value.forEach(async (id, index) => {
      let row = dataSource.value.find((item) => {
        return item.id == id
      })

      if (!row) {
        return
      }
      setTimeout(async () => {
        try {
          const downloadUrl = row.url || row.ossObjectName
          const fileName = row.name || row.imageName || `image_${id}.jpg`
          
          if (!downloadUrl) {
            ElMessage.error(`图片 ${fileName} 下载失败：缺少下载链接`)
            return
          }
          
          // 使用新的下载函数，确保文件被下载而不是打开新页面
          await downloadImage(downloadUrl, fileName)
          ElNotification.success(`图片 ${fileName} 下载成功`)
        } catch (error) {
          console.error('下载失败:', error)
          ElMessage.error(`图片下载失败：${error.message}`)
        }
      }, 500 * index)
    })
  } catch (e) {
    console.error('批量下载失败:', e)
    ElMessage.error('批量下载失败')
  }
}

function handleDelete(row?) {
  let delIds: any = null
  if (row) {
    delIds = [row.id]
  } else {
    delIds = Array.isArray(ids.value) ? [...ids.value] : []
    if (!delIds.length) {
      return ElMessage.warning('请选择要删除的数据')
    }
  }

  ElMessageBox.confirm('确认删除该数据吗', '删除提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'error'
  })
    .then(async () => {
      delIds = delIds.map((id) => String(id))
      await deleteAssetLibrary({ ids: delIds })
      ElNotification.success('删除成功')
      resetCheckStatus()
      getList()
    })
    .catch(() => {})
}
function checkboxChange(e) {
  const records = Array.isArray(e.records) ? e.records : []
  const reserves = Array.isArray(e.reserves) ? e.reserves : []
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)]
}

function checkboxAllChange(e) {
  const records = Array.isArray(e.records) ? e.records : []
  const reserves = Array.isArray(e.reserves) ? e.reserves : []
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)]
}

async function handleDownload(row) {
  // 处理图片下载
  try {
    const downloadUrl = row.url || row.ossObjectName
    const fileName = row.name || row.imageName || `image_${row.id}.jpg`
    
    if (!downloadUrl) {
      ElMessage.error(`图片 ${fileName} 下载失败：缺少下载链接`)
      return
    }
    
    // 使用新的下载函数，确保文件被下载而不是打开新页面
    await downloadImage(downloadUrl, fileName)
    ElNotification.success(`图片 ${fileName} 下载成功`)
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error(`图片下载失败：${error.message}`)
  }
}

async function handleDesignModel(row) {
  // 设置当前选中的素材为单个素材
  ids.value = [row.id]
  resetDesignModelSteps()
  designModelModalVisible.value = true
  await loadDesignModels()
}

async function loadDesignModels() {
  designModelLoading.value = true
  try {
    const res = await getDesignModelList({
      currentPage: 1,
      pageSize: 100
    })
    designModelList.value = res.list || []
  } catch (error) {
    console.error('加载设计模型失败:', error)
    ElMessage.error('加载设计模型失败')
  } finally {
    designModelLoading.value = false
  }
}



function selectDesignModel(model) {
  const index = selectedDesignModelIds.value.indexOf(model.id)
  if (index > -1) {
    // 如果已选中，则取消选中
    selectedDesignModelIds.value.splice(index, 1)
  } else {
    // 如果未选中，则添加到选中列表
    selectedDesignModelIds.value.push(model.id)
  }
}

function handleDesignModelConfirm() {
  if (!selectedDesignModelIds.value.length) {
    ElMessage.warning('请选择设计模型')
    return
  }
  
  // 打印最终数据
  console.log('素材图ID数组:', ids.value)
  console.log('设计模型ID数组:', selectedDesignModelIds.value)
  
  // 发送数据到设计工具
  const designToolMessenger = getDesignToolMessenger()
  const childWindow = designToolMessenger.getChildWindow()

  const success = designToolMessenger.sendDesignModelData({
    materialIds: Array.isArray(ids.value) ? [...ids.value] : [],
    designModelIds: selectedDesignModelIds.value
  })
  
  if (success) {
    ElMessage.success('数据已发送到设计工具')
    if (childWindow && typeof childWindow.focus === 'function') {
      childWindow.focus()
    }
    // 关闭弹窗并重置步骤
    designModelModalVisible.value = false
    resetDesignModelSteps()
  }
}



const delayUpdateList = useDebounceFn(() => {
  getList()
}, 1999)

function singleFileUploaded() {
  console.log('单个文件上传')
  delayUpdateList()
}

/**
 * @group
 */

const genPicturesFormRef = ref()

const aiGenDialogVisible = ref(false)
const aiGenPrompt = ref('')
const aiGenDialogLoading = ref(false)
let aiGenRow = null

const aiTableLoading = ref<Record<string, boolean>>({})

function onAiTableAutoGenerate(row) {
  if (aiTableLoading.value[row.id]) return
  aiGenRow = row
  aiGenPrompt.value = ''
  aiGenDialogVisible.value = true
}

async function submitAiGenDialog() {
  if (!aiGenRow) return
  aiGenDialogLoading.value = true
  aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: true }
  try {
    await handleAiAutoGenerate(aiGenRow, () => {
      aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: false }
      aiGenDialogLoading.value = false
      aiGenDialogVisible.value = false
      aiGenRow = null
    }, aiGenPrompt.value)
  } catch (e) {
    aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: false }
    aiGenDialogLoading.value = false
    aiGenDialogVisible.value = false
    aiGenRow = null
  }
}

async function handleAiAutoGenerate(row, cb, prompt) {
  try {
    const res = await aiAutoGenerateMaterialInfo({
      id: row.id,
      prompt: prompt || ''
    })
    // 更新行数据
    if (res && res.data) {
      row.name = res.data.name
      row.description = res.data.description
      row.keywords = res.data.keywords
      // 你可以根据实际返回结构调整
    }
    ElNotification.success('AI自动生成内容成功')
    if (typeof cb === 'function') cb()
    getList()
  } catch (e) {
    ElNotification.error('AI自动生成内容失败')
    if (typeof cb === 'function') cb()
  }
}

async function handleGeneratePhash(row) {
  if (!row.url) {
    ElMessage.error('图片无有效链接，无法生成哈希');
    return;
  }
  try {
    const { phash } = await calculatePhash({ url: row.url, ext: row.suffix || 'jpg' });
    if (phash && phash !== '000000000000') {
      row.phash = phash;
      ElMessage.success('哈希生成成功: ' + phash);
      // 可选：自动保存到后端
      await updateAssetLibrary({ id: row.id, phash });
      getList();
    } else {
      ElMessage.warning('哈希生成失败');
    }
  } catch (e) {
    ElMessage.error('哈希生成失败');
  }
}

const editDialogVisible = ref(false)
const editForm = ref({ id: '', name: '', description: '', keywords: '' })
const editLoading = ref(false)

// 图片预览相关状态
const imagePreviewVisible = ref(false)
const currentImageUrl = ref('')

function handleEdit(row) {
  editForm.value = { id: row.id, name: row.name, description: row.description, keywords: row.keywords }
  editDialogVisible.value = true
}

async function submitEdit() {
  editLoading.value = true
  try {
    await updateAssetLibrary(editForm.value)
    ElNotification.success('保存成功')
    editDialogVisible.value = false
    getList()
  } catch (e) {
    ElNotification.error('保存失败')
  } finally {
    editLoading.value = false
  }
}

// 图片预览相关方法
function openImagePreview(imageUrl: string, imageName?: string) {
  currentImageUrl.value = imageUrl
  imagePreviewVisible.value = true
}

function closeImagePreview() {
  imagePreviewVisible.value = false
  currentImageUrl.value = ''
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/src/assets/images/image-error.png' // 错误图片占位符，可以根据实际情况调整
  console.warn('图片加载失败:', img.alt)
}

defineExpose({ handleGeneratePhash });
</script>

<style scoped>
.table-header {
  border-radius: 4px;
  box-shadow: rgba(17, 17, 26, 0.15) 0px 1px 0px;
}

h1 {
  font-size: 1rem;
}
/* 步骤内容区块统一透明背景风格 */
.step-content {
  margin-bottom: 24px;
  border-radius: 8px;
  padding: 24px;
  transition: box-shadow 0.2s, background 0.2s, opacity 0.2s;
  background: transparent;
  color: #fff;
}
.step-active {
  box-shadow: 0 0 0 3px #409eff44;
  background: rgba(64, 158, 255, 0.10) !important; /* 高亮：主色+透明 */
  opacity: 1;
}
.step-inactive {
  background: rgba(100, 100, 100, 0.06) !important; /* 弱化：深灰+透明 */
  opacity: 0.6;
  filter: grayscale(0.2);
}
/* 去除步骤内容内部的白色/灰色背景 */
.bg-gray-50,
.border-blue-200,
.bg-blue-50 {
  background: transparent !important;
  border-color: rgba(64,158,255,0.15) !important;
}
.design-model-flex {
  display: flex;
  flex-direction: row;
  height: 100%;
}
.steps-vertical {
  flex-shrink: 0;
  min-width: 180px;
  margin-right: 32px;
}
.design-model-content {
  flex: 1;
  overflow-y: auto;
}
</style>

<style lang="less">
.material-upload-dialog {
  .el-dialog__body {
    height: calc(100% - 40px);
  }
}


.design-model-dialog {
  .el-dialog__body {
    height: calc(100% - 40px);
    padding: 0;
  }
  
  .design-model-content {
    padding: 16px;
  }
  
  .dialog-footer {
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .steps-indicator {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
  }

  .step-content {
    min-height: 400px;
  }

  /* 缩小步骤条样式 */
  .el-steps {
    margin-bottom: 12px !important;
    padding: 0 !important;
  }
  .el-step__title {
    font-size: 14px !important;
  }
  .el-step__description {
    font-size: 12px !important;
  }
  .el-step {
    min-width: 80px !important;
    padding: 0 8px !important;
  }
}



.preview-label {
  span {
    font-size: 1.8em;
    color: var(--el-color-primary);
    font-weight: bold;
  }
}
</style>