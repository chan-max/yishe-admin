<template>
  <div>
    <div class="py-4 flex flex-wrap justify-end gap-4 items-center">
      <el-switch
        v-model="picMode"
        size="small"
        active-text="网格"
        inactive-text="列表"
        inline-prompt
      />

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

      <form-item label="时间排序">
        <el-select v-model="queryParams.sortingFields" style="width: 160px" @change="getList">
          <el-option
            v-for="item in sortTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
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
            () => {
              if (!ids.length) {
                return ElMessage.warning('请选择要制作的素材')
              }
              selectedMaterialIds.value = [...ids.value]
              designModelModalVisible = true
            }
          "
        >
          制作设计模型({{ ids.length }})
        </el-button>

        <el-button
          type="warning"
          @click="
            () => {
              if (!ids.length) {
                return ElMessage.warning('请选择要制作的素材')
              }
              selectedMaterialIds.value = [...ids.value]
              batchDesignModelModalVisible = true
            }
          "
        >
          批量制作({{ ids.length }})
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
        <div v-if="!picMode" class="common-table">
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
                <single-image :src="row.url" />
              </div>
            </template>

            <template #operationDefaultSlot="{ row }">
              <div class="table-operation-column">
                <el-button type="default" link size="small" @click="handleDownload(row)">
                  下载
                </el-button>
                <el-button type="success" link size="small" @click="handleDesignModel(row)">
                  制作设计模型
                </el-button>
                <el-button type="warning" link size="small" @click="handleBatchDesignModel(row)">
                  批量制作
                </el-button>
                <el-button type="danger" link danger size="small" @click="handleDelete(row)">
                  删除
                </el-button>
              </div>
            </template>
          </vxe-grid>
        </div>

        <div v-else>
          <template v-if="loading">
            <div class="w-full h-8 flex justify-center">...</div>
          </template>

          <template v-else-if="total">
            <div
              :style="{ height: gridOptions.maxHeight + 'px' }"
              style="overflow: auto"
              class="flex justify-center p-4 gap-4 flex-wrap"
            >
              <template v-for="info in dataSource">
                <img-card
                  :is-checked="ids.includes(info.id)"
                  :info="info"
                  :ids="ids"
                  @delete="imgCardDelete"
                  @picture="
                    (_info) => {
                      currentRow = _info
                      genPicturesModalVisible = true
                    }
                  "
                />
              </template>
            </div>
          </template>

          <el-empty v-if="!loading && !total" :image-size="64" style="padding: 48px">
            <template #description>
              <span style="font-size: 11px; color: #aaa"> 暂无素材 </span>
            </template>
          </el-empty>
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
      :footer="false"
      :destroy-on-close="true"
      class="design-model-dialog"
    >
      <div style="height: 100%">
        <div class="p-4">
          <h3 class="text-lg font-bold mb-4">已选择的素材图：</h3>
          <div class="flex flex-wrap gap-4">
            <template v-for="id in selectedMaterialIds" :key="id">
              <div v-if="dataSource.find(item => item.id === id)" class="text-center">
                <img 
                  :src="dataSource.find(item => item.id === id).url" 
                  :alt="dataSource.find(item => item.id === id).name"
                  class="w-20 h-20 object-cover rounded border"
                />
              </div>
            </template>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 批量制作弹窗 -->
    <el-dialog
      v-model="batchDesignModelModalVisible"
      title="批量制作"
      width="100%"
      style="height: 100%"
      align-center
      :footer="false"
      :destroy-on-close="true"
      class="batch-design-model-dialog"
    >
      <div style="height: 100%">
        <div class="p-4">
          <h3 class="text-lg font-bold mb-4">已选择的素材图：</h3>
          <div class="flex flex-wrap gap-4">
            <template v-for="id in selectedMaterialIds" :key="id">
              <div v-if="dataSource.find(item => item.id === id)" class="text-center">
                <img 
                  :src="dataSource.find(item => item.id === id).url" 
                  :alt="dataSource.find(item => item.id === id).name"
                  class="w-20 h-20 object-cover rounded border"
                />
              </div>
            </template>
          </div>
        </div>
      </div>
    </el-dialog>
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
  handleDropMaterial
} from '@/api/material' // 实际接口导入

import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import CryptoJS from 'crypto-js'

import { useDebounceFn, useLocalStorage, useSessionStorage, useWindowSize } from '@vueuse/core'
import { sortTypeOptions, defaultSortingValue } from '@/common/sort'
import { saveAs } from 'file-saver'

import { useUserStore } from '@/store/modules/user'
import imgCard from './imgCard.vue'
import listUpload from './listUpload.vue'
import { materialConfig, getMaterialConfig, categoryOptions } from '@/views/material/collect/index'
import { ElButton, ElNotification, ElMessage } from 'element-plus'
import { Delete, Plus, Search, TopRight, Upload } from '@element-plus/icons-vue'
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

const userStore = useUserStore()

const form = ref({})

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
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
    {
      title: '图片预览',
      field: 'url',
      width: 'auto',
      slots: {
        default: 'previewDefaultSlot'
      }
    },
    { title: '图片名称', field: 'name', minWidth: 180, className: 'font-bold' },

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
      slots: {
        default: 'operationDefaultSlot'
      }
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
const ids = ref([])
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
const batchDesignModelModalVisible = ref(false)
const selectedMaterialIds = ref([])

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
    delIds = [...ids.value]
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
  ids.value = [...e.records.map((item) => item.id), ...e.reserves.map((item) => item.id)]
}

function checkboxAllChange(e) {
  ids.value = [...e.records.map((item) => item.id), ...e.reserves.map((item) => item.id)]
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

function handleDesignModel(row) {
  selectedMaterialIds.value = [row.id]
  designModelModalVisible.value = true
}

function handleBatchDesignModel(row) {
  selectedMaterialIds.value = [row.id]
  batchDesignModelModalVisible.value = true
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
</script>

<style scoped>
.table-header {
  border-radius: 4px;
  box-shadow: rgba(17, 17, 26, 0.15) 0px 1px 0px;
}

h1 {
  font-size: 1rem;
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
  }
}

.batch-design-model-dialog {
  .el-dialog__body {
    height: calc(100% - 40px);
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
