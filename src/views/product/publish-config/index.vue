<script setup lang="ts">
import { ref, reactive, onMounted, computed, watchEffect, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPublishConfigListApi,
  createPublishConfigApi,
  updatePublishConfigApi,
  deletePublishConfigApi
} from '@/api/product/publishConfig'
import { ContentWrap } from '@/components/ContentWrap'
import { formatTime } from '@/utils'
import { commonGridOptions } from "@/common/table"
import { useWindowSize } from "@vueuse/core"
import { 
  getAllPlatforms, 
  getPlatformConfig, 
  getPlatformDefaultData,
  type PlatformConfig
} from './platform-config'
import {
  validatePlatformConfig,
  formatConfigForSubmit,
  executePlatformBeforeSubmit,
  getPlatformHints
} from './platform-handlers'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const selectedIds = ref<(string | number)[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 20
})

const { height } = useWindowSize()
const gridMaxHeight = ref<number>(0)

watchEffect(() => {
  gridMaxHeight.value = height.value - 220
})

const gridOptions = computed(() => ({
  ...commonGridOptions,
  maxHeight: gridMaxHeight.value,
  columns: [
      { type: 'checkbox', width: 50, fixed: 'left' as const },
    { field: 'name', title: '配置名称', minWidth: 150 },
    { field: 'platform', title: '平台', minWidth: 100 },
    { field: 'description', title: '描述', minWidth: 200, showOverflow: true },
    { field: 'titleTemplate', title: '标题提示词', minWidth: 220, showOverflow: true },
    {
      field: 'createTime',
      title: '创建时间',
      width: 160,
      formatter: ({ cellValue }) => formatTime(cellValue, 'yyyy-MM-dd HH:mm')
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right' as const,
      slots: { default: 'action' }
    }
  ]
}))

const getList = async () => {
  loading.value = true
  try {
    const res = await getPublishConfigListApi()
    if (Array.isArray(res)) {
        tableData.value = res
        total.value = res.length
    } else if (res && res.list) {
         tableData.value = res.list
         total.value = res.total
    } else {
        tableData.value = res as any
        total.value = (res as any).length
    }

    selectedIds.value = []

  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  getList()
}

const handleSelectionChange = (e: any) => {
  selectedIds.value = (e?.records || []).map((item: any) => item.id)
}

const handleBatchDelete = () => {
  if (!selectedIds.value.length) {
    ElMessage.warning('请先选择要删除的配置')
    return
  }
  
  ElMessageBox.confirm(`确认删除选中的 ${selectedIds.value.length} 个配置吗？`, '批量删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      loading.value = true
      // 并发删除所有选中的配置
      await Promise.all(selectedIds.value.map(id => deletePublishConfigApi(String(id))))
      ElMessage.success(`成功删除 ${selectedIds.value.length} 个配置`)
      selectedIds.value = []
      getList()
    } catch (err) {
      console.error(err)
      ElMessage.error('批量删除失败')
    } finally {
      loading.value = false
    }
  })
}

// Dialog
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()

// 动态平台配置
const currentPlatformConfig = ref<PlatformConfig | null>(null)
const platformConfigData = ref<Record<string, any>>({})
const platformHints = ref<string[]>([])

const form = reactive({
  id: undefined,
  name: '',
  platform: '',
  description: '',
  isActive: true,
  titleTemplate: '',
  titleConfig: '{}'
})

// 监听平台变化，更新配置字段
watch(() => form.platform, (newPlatform) => {
  if (newPlatform) {
    currentPlatformConfig.value = getPlatformConfig(newPlatform)
    platformHints.value = getPlatformHints(newPlatform)
    // 如果是新增，初始化默认值
    if (!form.id) {
      platformConfigData.value = getPlatformDefaultData(newPlatform)
    }
  } else {
    currentPlatformConfig.value = null
    platformConfigData.value = {}
    platformHints.value = []
  }
}, { immediate: true })

const platformOptions = getAllPlatforms()

const rules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }]
}

const handleAdd = () => {
  dialogTitle.value = '新增发布配置'
  form.id = undefined
  form.name = ''
  form.platform = ''
  form.titleTemplate = ''
  form.titleConfig = '{}'
  form.description = ''
  form.isActive = true
  platformConfigData.value = {}
  currentPlatformConfig.value = null
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑发布配置'
  form.id = row.id
  form.name = row.name
  form.platform = row.platform
  form.titleTemplate = row.titleTemplate || ''
  form.titleConfig = row.titleConfig ? JSON.stringify(row.titleConfig, null, 2) : '{}'
  form.description = row.description
  form.isActive = row.isActive
  
  // 加载平台配置数据
  currentPlatformConfig.value = getPlatformConfig(row.platform)
  platformConfigData.value = row.configData || {}
  
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        // 校验平台配置
        const validation = validatePlatformConfig(form.platform, platformConfigData.value)
        if (!validation.valid) {
          ElMessage.error(validation.errors.join('；'))
          return
        }
        
        // 格式化平台配置
        const formattedConfigData = formatConfigForSubmit(form.platform, platformConfigData.value)
        
        let parsedTitleConfig = {}
        
        if (form.titleConfig && form.titleConfig.trim()) {
          try {
            parsedTitleConfig = JSON.parse(form.titleConfig)
          } catch (e) {
            ElMessage.error('标题配置 JSON 格式错误')
            return
          }
        }

        let data = {
          name: form.name,
          platform: form.platform,
          description: form.description,
          isActive: form.isActive,
          titleTemplate: form.titleTemplate,
          titleConfig: parsedTitleConfig,
          configData: formattedConfigData
        }
        
        // 执行平台特定的提交前钩子
        data = executePlatformBeforeSubmit(form.platform, data)

        if (form.id) {
          await updatePublishConfigApi(form.id, data)
          ElMessage.success('更新成功')
        } else {
          await createPublishConfigApi(data)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        getList()
      } catch (err: any) {
        console.error(err)
        ElMessage.error(err.message || '操作失败')
      }
    }
  })
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认删除该配置吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deletePublishConfigApi(row.id)
      ElMessage.success('删除成功')
      getList()
    } catch (err) {
      console.error(err)
    }
  })
}

onMounted(() => {
  getList()
})
</script>

<template>
  <ContentWrap>
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
         <!-- Search logic could be improved with backend support -->
        <el-button type="primary" @click="handleSearch">刷新</el-button>
              <el-button 
                type="danger" 
                :disabled="selectedIds.length === 0"
                @click="handleBatchDelete"
              >
                批量删除 <span v-if="selectedIds.length > 0">({{ selectedIds.length }})</span>
              </el-button>
      </div>
      <div>
        <el-button type="primary" @click="handleAdd">新增配置</el-button>
      </div>
    </div>

    <vxe-grid
      v-bind="gridOptions"
      :data="tableData"
      :loading="loading"
      @checkbox-change="handleSelectionChange"
      @checkbox-all="handleSelectionChange"
    >
      <template #action="{ row }">
        <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
        <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
      </template>
    </vxe-grid>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" :fullscreen="true">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" style="max-width: 100%; margin: 0; padding: 20px 40px;">
        <!-- 基本信息 - 三列布局 -->
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="配置名称" prop="name">
              <el-input v-model="form.name" placeholder="例如：抖音-主账号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="平台" prop="platform">
              <el-select v-model="form.platform" placeholder="请选择平台" style="width: 100%;">
                <el-option v-for="item in platformOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="启用状态" prop="isActive">
              <el-switch v-model="form.isActive" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 描述 - 全宽 -->
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" placeholder="配置描述信息" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 平台配置 - 动态渲染 -->
        <template v-if="currentPlatformConfig && form.platform">
          <el-divider content-position="left" style="margin: 24px 0;">
            {{ currentPlatformConfig.label }}平台配置
            <span style="font-size: 12px; color: #909399; margin-left: 10px;">{{ currentPlatformConfig.description }}</span>
          </el-divider>

          <!-- 平台提示信息 -->
          <el-alert
            v-if="platformHints.length > 0"
            :title="`${currentPlatformConfig.label}平台提示`"
            type="info"
            :closable="false"
            style="margin-bottom: 20px;"
          >
            <ul style="margin: 0; padding-left: 20px;">
              <li v-for="(hint, index) in platformHints" :key="index" style="margin: 5px 0;">
                {{ hint }}
              </li>
            </ul>
          </el-alert>

          <!-- 动态渲染平台字段 -->
          <el-row :gutter="24">
            <el-col 
              v-for="field in currentPlatformConfig.fields" 
              :key="field.key" 
              :span="field.span || 24"
            >
              <el-form-item 
                :label="field.label" 
                :required="field.required"
              >
                <!-- 输入框 -->
                <el-input 
                  v-if="field.type === 'input'"
                  v-model="platformConfigData[field.key]"
                  :placeholder="field.placeholder"
                />
                
                <!-- 文本域 -->
                <el-input 
                  v-else-if="field.type === 'textarea'"
                  v-model="platformConfigData[field.key]"
                  type="textarea"
                  :rows="field.rows || 3"
                  :placeholder="field.placeholder"
                />
                
                <!-- 数字输入 -->
                <el-input-number
                  v-else-if="field.type === 'number'"
                  v-model="platformConfigData[field.key]"
                  :placeholder="field.placeholder"
                  style="width: 100%;"
                />
                
                <!-- 选择器 -->
                <el-select 
                  v-else-if="field.type === 'select'"
                  v-model="platformConfigData[field.key]"
                  :placeholder="field.placeholder || '请选择'"
                  style="width: 100%;"
                >
                  <el-option
                    v-for="option in field.options"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                
                <!-- 开关 -->
                <div v-else-if="field.type === 'switch'" style="display: flex; align-items: center;">
                  <el-switch v-model="platformConfigData[field.key]" />
                  <span v-if="field.tooltip" style="margin-left: 10px; font-size: 12px; color: #909399;">
                    {{ field.tooltip }}
                  </span>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 未选择平台时的提示 -->
        <el-alert
          v-else-if="!form.platform"
          title="请先选择发布平台"
          type="info"
          :closable="false"
          style="margin: 24px 0;"
        />

        <el-divider content-position="left" style="margin: 24px 0;">AI 标题生成配置</el-divider>

        <!-- AI配置 - 两列并排最大化空间 -->
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="标题提示词" prop="titleTemplate">
              <el-input
                v-model="form.titleTemplate"
                type="textarea"
                :rows="15"
                :placeholder="`用于AI生成标题的提示词。${currentPlatformConfig ? '当前平台标题限制：' + (currentPlatformConfig.titleMaxLength || '无') + '字符' : ''}`"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标题配置" prop="titleConfig">
              <el-input
                v-model="form.titleConfig"
                type="textarea"
                :rows="15"
                placeholder="JSON格式配置标题生成参数，例如：&#10;{&#10;  'maxLength': 50,&#10;  'style': 'marketing',&#10;  'includeEmoji': true,&#10;  'tone': 'enthusiastic',&#10;  'keywords': ['热销', '爆款'],&#10;  'avoidWords': ['劣质', '便宜']&#10;}"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </ContentWrap>
</template>
