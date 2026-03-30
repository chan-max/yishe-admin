<template>
  <div>
    <div class="pb-4 flex flex-wrap justify-start gap-4 items-center search-bar">
      <!-- 这里放所有搜索/过滤表单项和按钮，结构与crawler-material.vue一致，参数不变 -->
      <form-item class="date-range-picker">
        <DateRangePicker
          @change="(val) => { queryParams.startTime = val.start; queryParams.endTime = val.end; getList() }"
        />
      </form-item>
      <el-button
        type="danger"
        :disabled="!ids.length"
        @click="handleDelete(null)"
      >
        批量删除
      </el-button>
    </div>
    <div class="common-table">
      <vxe-grid
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
        @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange"
      >
        <template #operationDefaultSlot="{ row }">
          <el-dropdown
            class="operation-dropdown"
            placement="bottom-end"
            @command="(command) => handleOperationCommand(String(command), row)"
          >
            <el-button type="primary" link size="small" class="operation-trigger-button">操作</el-button>
            <template #dropdown>
              <el-dropdown-menu class="operation-menu-compact">
                <el-dropdown-item command="edit">
                  <el-icon><Edit /></el-icon>
                  <span>编辑</span>
                </el-dropdown-item>
                <el-dropdown-item command="ai-generate">
                  <el-icon><MagicStick /></el-icon>
                  <span>AI生成内容</span>
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided class="operation-menu-item--danger">
                  <el-icon><Delete /></el-icon>
                  <span>删除</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #nameSlot="{ row }">
          <div class="text-wrap" style="max-width: 200px; word-break: break-all;">
            {{ row.name || '-' }}
          </div>
        </template>
        <template #descriptionSlot="{ row }">
          <div class="text-wrap" style="max-width: 300px; word-break: break-all;">
            {{ row.description || '-' }}
          </div>
        </template>
        <template #priceSlot="{ row }">
          <span>{{ row.price || '-' }}</span>
        </template>
        <template #urlSlot="{ row }">
          <div class="text-wrap" style="max-width: 200px; word-break: break-all;">
            {{ row.url || '-' }}
          </div>
        </template>
        <template #keywordsSlot="{ row }">
          <div class="text-wrap" style="max-width: 200px; word-break: break-all;">
            {{ row.keywords || '-' }}
          </div>
        </template>
        <template #thumbnailSlot="{ row }">
          <el-image 
            v-if="row.thumbnail" 
            :src="row.thumbnail"
            :lazy="true" 
            style="width: 120px; height: 120px; object-fit: cover;"
            :preview-src-list="[row.thumbnail]"
          />
          <span v-else>-</span>
        </template>
        <template #createTimeSlot="{ row }">
          <span>{{ formatDateTime(row.createTime) }}</span>
        </template>
        <template #updateTimeSlot="{ row }">
          <span>{{ formatDateTime(row.updateTime) }}</span>
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
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="700px"
      @close="dialogClose"
      align-center
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="模型名称" prop="name">
              <el-input 
                v-model="form.name" 
                placeholder="请输入模型名称" 
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="模型描述" prop="description">
              <el-input 
                v-model="form.description" 
                type="textarea" 
                :rows="3"
                placeholder="请输入模型描述（可选）" 
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="关键词" prop="keywords">
              <el-input 
                v-model="form.keywords" 
                placeholder="请输入关键词（可选）" 
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="aiGenDialogVisible"
      title="AI自动生成内容"
      width="500px"
      align-center
      :destroy-on-close="true"
    >
      <div style="margin-bottom: 16px; color: #888; font-size: 15px;">
        请输入你希望AI分析的内容风格或角度（如：偏艺术描述、简洁风格、突出色彩等）
      </div>
      <el-input
        v-model="aiGenPrompt"
        type="textarea"
        :rows="6"
        placeholder="如：请用艺术化语言描述商品图片..."
        style="font-size:16px;min-height:120px;width:100%;resize:vertical;"
      />
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, More, Edit, MagicStick } from '@element-plus/icons-vue'
import { getProductModelPage, updateProductModel, deleteProductModel } from '@/api/productModel'
import { buildOperationColumn, commonGridOptions } from '@/common/table'
import request from '@/config/axios'

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20
})

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: 'checkbox', width: 50 },
    { title: '缩略图', field: 'thumbnail', width: 150, slots: { default: 'thumbnailSlot' } },
    { title: '模型名称', field: 'name', minWidth: 200, slots: { default: 'nameSlot' } },
    { title: '模型描述', field: 'description', minWidth: 300, slots: { default: 'descriptionSlot' } },
    { title: '关键词', field: 'keywords', minWidth: 200, slots: { default: 'keywordsSlot' } },
    { title: '引用次数', field: 'ref_count', width: 100 },
    { title: '点赞次数', field: 'like_count', width: 100 },
    { title: '收藏次数', field: 'save_count', width: 100 },
    { title: '链接次数', field: 'link_count', width: 100 },
    { title: '创建时间', field: 'createTime', width: 160, slots: { default: 'createTimeSlot' } },
    { title: '更新时间', field: 'updateTime', width: 160, slots: { default: 'updateTimeSlot' } },
    buildOperationColumn('operationDefaultSlot')
  ]
})

const dataSource = ref([])
const loading = ref(false)
const ids = ref([])
const total = ref(0)
const formRef = ref()
const dialogTitle = ref('')
const dialogVisible = ref(false)
const form = ref<{
  id?: string
  name: string
  description: string
  keywords: string
}>({
  name: '',
  description: '',
  keywords: ''
})
const submitLoading = ref(false)

const aiGenDialogVisible = ref(false)
const aiGenPrompt = ref('')
const aiGenDialogLoading = ref(false)
let aiGenRow: any = null

function onAiTableAutoGenerate(row) {
  aiGenRow = row
  aiGenPrompt.value = ''
  aiGenDialogVisible.value = true
}

async function submitAiGenDialog() {
  if (!aiGenRow) return
  aiGenDialogLoading.value = true
  try {
    const res = await request.post({
      url: '/product-model/ai-generate-info',
      data: {
        id: aiGenRow.id,
        prompt: aiGenPrompt.value
      }
    })

    if (res && res.data) {
      // 如果当前在编辑弹窗，直接填充
      if (dialogVisible.value && form.value.id === aiGenRow.id) {
        form.value.name = res.data.name
        form.value.description = res.data.description
        form.value.keywords = res.data.keywords
      }
      // 也可以直接更新表格行
      aiGenRow.name = res.data.name
      aiGenRow.description = res.data.description
      aiGenRow.keywords = res.data.keywords
    }
    ElMessage.success('AI自动生成内容成功')
    getList(); // 新增：AI生成成功后刷新列表
    aiGenDialogVisible.value = false
    aiGenRow = null
  } catch (e) {
    ElMessage.error('AI自动生成内容失败')
  } finally {
    aiGenDialogLoading.value = false
  }
}

// 格式化日期时间
function formatDateTime(dateStr: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

async function getList() {
  loading.value = true
  try {
    const params = { ...queryParams }
    const res = await getProductModelPage(params)
    dataSource.value = res.list || []
    total.value = res.total || 0
    ids.value = []
  } catch (error) {
    console.error('获取列表失败:', error)
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(getList)

function checkboxChange(e) {
  ids.value = e.records.map((item) => item.id)
}

function checkboxAllChange(e) {
  ids.value = e.records.map((item) => item.id)
}

function handleEdit(row) {
  dialogVisible.value = true
  dialogTitle.value = '编辑商品模型'
  form.value = { 
    id: row.id,
    name: row.name || '',
    description: row.description || '',
    keywords: row.keywords || ''
  }
}

function handleDelete(row?) {
  let delIds = null
  if (row) {
    delIds = [row.id]
  } else if (!ids.value.length) {
    return ElMessage.warning('请选择要删除的数据')
  } else {
    delIds = [...ids.value]
  }
  
  ElMessageBox.confirm(
    `确认删除选中的 ${delIds.length} 条数据吗？`, 
    '删除提示', 
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        for (const id of delIds) {
          await deleteProductModel(id)
        }
        ElMessage.success('删除成功')
        getList()
      } catch (error) {
        console.error('删除失败:', error)
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

const rules = {
  name: [
    { max: 1000, message: '模型名称长度不能超过 1000 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 1000, message: '描述长度不能超过 1000 个字符', trigger: 'blur' }
  ],
  keywords: [
    { max: 1000, message: '关键词长度不能超过 1000 个字符', trigger: 'blur' }
  ]
}

const dialogClose = () => {
  dialogVisible.value = false
  submitLoading.value = false
  formRef.value?.resetFields()
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    await updateProductModel({
      id: form.value.id,
      name: form.value.name,
      description: form.value.description,
      keywords: form.value.keywords
    })
    
    ElMessage.success('更新成功')
    getList()
    dialogVisible.value = false
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 处理dropdown操作命令
function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case 'edit':
      handleEdit(row);
      break;
    case 'ai-generate':
      onAiTableAutoGenerate(row);
      break;
    case 'delete':
      handleDelete(row);
      break;
    default:
      console.warn('未知的操作命令:', command);
  }
}
</script>

<style scoped>
.text-wrap {
  white-space: normal;
  line-height: 1.5;
}
.pb-4.flex, .search-bar {
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.pb-4.flex > *, .search-bar > * {
  margin-bottom: 0;
}
@media (max-width: 600px) {
  .pb-4.flex, .search-bar {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
    padding-bottom: 8px !important;
  }
  .pb-4.flex > *, .search-bar > * {
    width: 100% !important;
    min-width: 0 !important;
    margin-right: 0 !important;
    margin-bottom: 8px !important;
  }
  .el-input,
  .el-select,
  .el-button,
  .el-date-editor {
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box;
  }
  .content-container {
    padding: 0 4px !important;
  }
}

/* 操作dropdown样式 */

</style> 
