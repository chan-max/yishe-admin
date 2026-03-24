<script setup lang="ts">
import { ref, reactive, onMounted, computed, watchEffect, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
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
  formatConfigForEdit,
  executePlatformBeforeSubmit
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
  const userStore = useUserStore()
  if (!userStore.user?.isAdmin) {
    return ElMessage.warning('无权限：仅管理员可执行删除操作')
  }
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
const submitLoading = ref(false)

// 动态平台配置
const currentPlatformConfig = ref<PlatformConfig | null>(null)
const platformConfigData = ref<Record<string, any>>({})

const form = reactive({
  id: undefined,
  name: '',
  platform: '',
  description: '',
  isActive: true
})

const titleConfigForm = reactive({
  templateContent: '',
  maxLength: undefined as number | undefined,
  style: '',
  tone: '',
  includeEmoji: null as boolean | null,
  requiredKeywords: [] as string[],
  avoidWords: [] as string[]
})

const appendImageUrlValidation = computed(() => {
  if (form.platform !== 'doudian') {
    return {
      hasError: false,
      invalidUrls: [] as Array<{ index: number; value: string }>
    }
  }

  const rawValue = platformConfigData.value?.appendImageUrls
  const lines = Array.isArray(rawValue)
    ? rawValue
    : typeof rawValue === 'string'
      ? rawValue.split(/\r?\n/)
      : []

  const invalidUrls = lines
    .map((item: any, index: number) => ({
      index,
      value: String(item || '').trim()
    }))
    .filter((item) => item.value)
    .filter((item) => !/^https?:\/\//i.test(item.value))

  return {
    hasError: invalidUrls.length > 0,
    invalidUrls
  }
})

function normalizePublishConfigData(platform: string, value: Record<string, any> = {}) {
  const normalized = {
    ...getPlatformDefaultData(platform),
    ...(value || {})
  }

  const platformConfig = getPlatformConfig(platform)
  if (platformConfig?.fields?.length) {
    platformConfig.fields.forEach((field) => {
      if (field.type === 'url-list' && !Array.isArray(normalized[field.key])) {
        normalized[field.key] = normalized[field.key]
          ? [String(normalized[field.key])]
          : []
      }
    })
  }

  return normalized
}

function ensureUrlListField(fieldKey: string) {
  const currentValue = platformConfigData.value?.[fieldKey]
  if (!Array.isArray(currentValue)) {
    platformConfigData.value[fieldKey] = currentValue ? [String(currentValue)] : []
  }
}

function addUrlListItem(fieldKey: string) {
  ensureUrlListField(fieldKey)
  platformConfigData.value[fieldKey].push('')
}

function removeUrlListItem(fieldKey: string, index: number) {
  ensureUrlListField(fieldKey)
  const nextList = [...platformConfigData.value[fieldKey]]
  nextList.splice(index, 1)
  platformConfigData.value[fieldKey] = nextList
}

function getUrlListItemError(fieldKey: string, index: number) {
  if (fieldKey !== 'appendImageUrls') {
    return ''
  }
  const invalidItem = appendImageUrlValidation.value.invalidUrls.find((item) => item.index === index)
  return invalidItem ? '仅支持 http/https URL' : ''
}

// 监听平台变化，更新配置字段
watch(() => form.platform, (newPlatform) => {
  if (newPlatform) {
    currentPlatformConfig.value = getPlatformConfig(newPlatform)
    platformConfigData.value = normalizePublishConfigData(newPlatform, platformConfigData.value)
  } else {
    currentPlatformConfig.value = null
    platformConfigData.value = {}
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
  form.description = ''
  form.isActive = true
  titleConfigForm.templateContent = ''
  titleConfigForm.maxLength = undefined
  titleConfigForm.style = ''
  titleConfigForm.tone = ''
  titleConfigForm.includeEmoji = null
  titleConfigForm.requiredKeywords = []
  titleConfigForm.avoidWords = []
  platformConfigData.value = {}
  currentPlatformConfig.value = null
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑发布配置'
  form.id = row.id
  form.name = row.name
  form.platform = row.platform
  form.description = row.description
  form.isActive = row.isActive

  titleConfigForm.templateContent = row.titleTemplate || ''
  titleConfigForm.maxLength = typeof row.titleConfig?.maxLength === 'number' ? row.titleConfig.maxLength : undefined
  titleConfigForm.style = row.titleConfig?.style || ''
  titleConfigForm.tone = row.titleConfig?.tone || ''
  titleConfigForm.includeEmoji = typeof row.titleConfig?.includeEmoji === 'boolean' ? row.titleConfig.includeEmoji : null
  titleConfigForm.requiredKeywords = Array.isArray(row.titleConfig?.requiredKeywords)
    ? row.titleConfig.requiredKeywords
    : (Array.isArray(row.titleConfig?.keywords) ? row.titleConfig.keywords : [])
  titleConfigForm.avoidWords = Array.isArray(row.titleConfig?.avoidWords) ? row.titleConfig.avoidWords : []
  
  // 加载平台配置数据
  currentPlatformConfig.value = getPlatformConfig(row.platform)
  platformConfigData.value = normalizePublishConfigData(
    row.platform,
    formatConfigForEdit(row.platform, row.configData || {})
  )
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value || submitLoading.value) return

  submitLoading.value = true
  try {
    await formRef.value.validate()

    // 校验平台配置
    const validation = validatePlatformConfig(form.platform, platformConfigData.value)
    if (!validation.valid) {
      ElMessage.error(validation.errors.join('；'))
      return
    }

    if (appendImageUrlValidation.value.hasError) {
      ElMessage.error('附加图片地址校验未通过，请检查 http/https URL')
      return
    }

    // 格式化平台配置
    const formattedConfigData = formatConfigForSubmit(form.platform, platformConfigData.value)

    const parsedTitleConfig = {
      maxLength: typeof titleConfigForm.maxLength === 'number' ? titleConfigForm.maxLength : undefined,
      style: titleConfigForm.style?.trim() || undefined,
      tone: titleConfigForm.tone?.trim() || undefined,
      includeEmoji: typeof titleConfigForm.includeEmoji === 'boolean' ? titleConfigForm.includeEmoji : undefined,
      requiredKeywords: Array.isArray(titleConfigForm.requiredKeywords) ? titleConfigForm.requiredKeywords : undefined,
      avoidWords: Array.isArray(titleConfigForm.avoidWords) ? titleConfigForm.avoidWords : undefined
    }

    let data = {
      name: form.name,
      platform: form.platform,
      description: form.description,
      isActive: form.isActive,
      titleTemplate: titleConfigForm.templateContent?.trim() || undefined,
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
    const message = String(err?.message || '')
    if (message && !message.toLowerCase().includes('validation')) {
      ElMessage.error(err.message || '操作失败')
    }
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = (row: any) => {
  const userStore = useUserStore()
  if (!userStore.user?.isAdmin) {
    return ElMessage.warning('无权限：仅管理员可执行删除操作')
  }
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
              <el-button v-admin-only
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
        <el-button v-admin-only link type="danger" @click="handleDelete(row)">删除</el-button>
      </template>
    </vxe-grid>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" :fullscreen="true" class="publish-config-dialog">
      <div class="publish-config-dialog__body">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="104px" class="publish-config-form">
          <section class="publish-config-panel publish-config-panel--basic">
            <div class="publish-config-panel__header">
              <div>
                <div class="publish-config-panel__title">基础信息</div>
                <div class="publish-config-panel__desc">配置名称、平台、启用状态与描述。</div>
              </div>
            </div>
            <el-row :gutter="18">
              <el-col :span="10">
                <el-form-item label="配置名称" prop="name">
                  <el-input v-model="form.name" placeholder="例如：抖店主账号 / 快手小店测试配置" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="平台" prop="platform">
                  <el-select v-model="form.platform" placeholder="请选择平台" style="width: 100%;">
                    <el-option v-for="item in platformOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="启用状态" prop="isActive">
                  <div class="publish-config-switch">
                    <el-switch v-model="form.isActive" />
                    <span class="publish-config-switch__text">{{ form.isActive ? '启用中' : '已停用' }}</span>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="描述" prop="description">
                  <el-input
                    v-model="form.description"
                    type="textarea"
                    :autosize="{ minRows: 2, maxRows: 4 }"
                    placeholder="简要说明这条发布配置的适用场景"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <div class="publish-config-workspace">
            <section class="publish-config-panel publish-config-panel--platform">
              <div class="publish-config-panel__header">
              <div>
                <div class="publish-config-panel__title">平台配置</div>
                  <div class="publish-config-panel__desc">平台专属字段。</div>
              </div>
                <el-tag v-if="currentPlatformConfig" type="info" effect="plain" round>
                  {{ currentPlatformConfig.label }}
                </el-tag>
              </div>

              <template v-if="currentPlatformConfig && form.platform">
                <div class="publish-config-platform__summary">
                  <span>{{ currentPlatformConfig.description }}</span>
                  <span>图片：{{ currentPlatformConfig.supportImage ? '支持' : '不支持' }}</span>
                  <span>视频：{{ currentPlatformConfig.supportVideo ? '支持' : '不支持' }}</span>
                </div>

                <el-row v-if="currentPlatformConfig.fields.length > 0" :gutter="18">
                  <el-col
                    v-for="field in currentPlatformConfig.fields"
                    :key="field.key"
                    :span="field.span || 24"
                  >
                    <el-form-item :label="field.label" :required="field.required">
                      <el-input
                        v-if="field.type === 'input'"
                        v-model="platformConfigData[field.key]"
                        :placeholder="field.placeholder"
                      />

                      <el-input
                        v-else-if="field.type === 'textarea'"
                        v-model="platformConfigData[field.key]"
                        type="textarea"
                        :rows="field.rows || 3"
                        :placeholder="field.placeholder"
                      />

                      <div v-else-if="field.type === 'url-list'">
                        <div class="publish-config-url-list">
                          <div
                            v-for="(_, index) in (Array.isArray(platformConfigData[field.key]) ? platformConfigData[field.key] : [])"
                            :key="`${field.key}-${index}`"
                            class="publish-config-url-list__item"
                          >
                            <div>
                              <el-input
                                v-model="platformConfigData[field.key][index]"
                                :placeholder="field.placeholder"
                              />
                              <div v-if="getUrlListItemError(field.key, index)" class="publish-config-field-error">
                                {{ getUrlListItemError(field.key, index) }}
                              </div>
                            </div>
                            <el-button
                              text
                              type="danger"
                              @click="removeUrlListItem(field.key, index)"
                            >
                              删除
                            </el-button>
                          </div>
                        </div>
                        <el-button text type="primary" @click="addUrlListItem(field.key)">新增地址</el-button>
                        <div v-if="field.tooltip" class="publish-config-field-tip">
                          {{ field.tooltip }}
                        </div>
                        <div v-if="field.key === 'appendImageUrls'" class="publish-config-field-note">
                          一个输入框对应一个地址，生成发布任务时会追加到套图图片后面。
                        </div>
                      </div>

                      <el-input-number
                        v-else-if="field.type === 'number'"
                        v-model="platformConfigData[field.key]"
                        :placeholder="field.placeholder"
                        style="width: 100%;"
                      />

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

                      <div v-else-if="field.type === 'switch'" class="publish-config-switch">
                        <el-switch v-model="platformConfigData[field.key]" />
                        <span v-if="field.tooltip" class="publish-config-switch__hint">{{ field.tooltip }}</span>
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-empty
                  v-else
                  description="该平台暂未定义专属字段，后续确认发布流程后再补充"
                  :image-size="88"
                />
              </template>

              <el-empty
                v-else
                description="请选择平台后再配置专属字段"
                :image-size="92"
              />
            </section>

            <section class="publish-config-panel publish-config-panel--ai">
              <div class="publish-config-panel__header">
              <div>
                <div class="publish-config-panel__title">AI 标题生成配置</div>
                  <div class="publish-config-panel__desc">标题模板与规则。</div>
              </div>
              </div>

              <div class="publish-config-ai-grid">
                <div class="publish-config-ai-grid__main">
                  <el-form-item label="标题模板" class="publish-config-ai-grid__editor">
                    <el-input
                      v-model="titleConfigForm.templateContent"
                      type="textarea"
                      :autosize="{ minRows: 14, maxRows: 22 }"
                      placeholder="直接填写发布任务标题生成模板。发布任务生成标题时只使用这里的内容。"
                    />
                    <div class="publish-config-field-tip">
                      当前配置不再保存或依赖 `promptId`。发布任务生成标题时只读取这里的 `titleTemplate` 内容。
                      {{ currentPlatformConfig ? `当前平台标题限制：${currentPlatformConfig.titleMaxLength || '无'} 字符。` : '' }}
                    </div>
                  </el-form-item>
                </div>

                <div class="publish-config-ai-grid__side">
                  <el-form-item label="最大字数">
                    <el-input-number
                      v-model="titleConfigForm.maxLength"
                      :min="1"
                      :max="200"
                      style="width: 100%;"
                      placeholder="例如：30"
                    />
                  </el-form-item>
                  <el-form-item label="风格">
                    <el-input v-model="titleConfigForm.style" placeholder="如 marketing / formal / cute" />
                  </el-form-item>
                  <el-form-item label="语气">
                    <el-input v-model="titleConfigForm.tone" placeholder="如 enthusiastic / neutral" />
                  </el-form-item>
                  <el-form-item label="包含 Emoji">
                    <el-radio-group v-model="titleConfigForm.includeEmoji">
                      <el-radio :label="true">允许</el-radio>
                      <el-radio :label="false">禁止</el-radio>
                      <el-radio :label="null">不限</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item label="必含关键词">
                    <el-select
                      v-model="titleConfigForm.requiredKeywords"
                      multiple
                      filterable
                      allow-create
                      default-first-option
                      placeholder="输入后回车添加"
                      style="width: 100%;"
                    />
                  </el-form-item>
                  <el-form-item label="禁用词">
                    <el-select
                      v-model="titleConfigForm.avoidWords"
                      multiple
                      filterable
                      allow-create
                      default-first-option
                      placeholder="输入后回车添加"
                      style="width: 100%;"
                    />
                  </el-form-item>
                </div>
              </div>
            </section>
          </div>
        </el-form>
      </div>
      <template #footer>
        <div class="publish-config-dialog__footer">
          <div class="publish-config-dialog__footer-actions">
            <el-button :disabled="submitLoading" @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="submitLoading" @click="submitForm">保存配置</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </ContentWrap>
</template>


<style scoped lang="less">
.publish-config-dialog {
  :deep(.el-dialog) {
    height: 100vh;
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-dialog__header) {
    flex-shrink: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
  }

  :deep(.el-dialog__body) {
    flex: 1;
    padding: 0;
    background: var(--el-fill-color-light);
    overflow: hidden;
  }

  :deep(.el-dialog__footer) {
    flex-shrink: 0;
    padding: 14px 24px 18px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
  }
}

.publish-config-dialog__body {
  height: 100%;
  padding: 18px 22px 22px;
  box-sizing: border-box;
  overflow-y: auto;
}

.publish-config-form {
  min-height: 100%;
}

.publish-config-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 18px 18px 8px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}

.publish-config-panel--basic {
  margin-bottom: 16px;
}

.publish-config-workspace {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.publish-config-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.publish-config-panel__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}

.publish-config-panel__desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.publish-config-platform__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
  border: 1px dashed var(--el-border-color);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.publish-config-ai-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.publish-config-panel--ai {
  padding-bottom: 18px;
}

.publish-config-ai-grid__side {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.publish-config-ai-grid__editor {
  :deep(.el-form-item__content) {
    display: block;
  }
}

.publish-config-field-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.publish-config-field-note {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 12px;
  line-height: 1.5;
}

.publish-config-url-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.publish-config-url-list__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.publish-config-field-error {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-color-danger);
  word-break: break-all;
}

.publish-config-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
}

.publish-config-switch__text,
.publish-config-switch__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.publish-config-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.publish-config-dialog__footer-actions {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

@media (max-width: 768px) {
  .publish-config-dialog__body {
    padding: 14px;
  }

  .publish-config-ai-grid__side {
    grid-template-columns: 1fr;
  }

  .publish-config-dialog__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .publish-config-dialog__footer-actions {
    justify-content: flex-end;
  }
}
</style>
