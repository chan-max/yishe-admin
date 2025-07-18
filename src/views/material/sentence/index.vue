<template>
  <div>
    <div class="py-4 flex justify-between gap-4 items-center">
      <div style="flex: 1"></div>
      <form-item label="按内容搜索">
        <el-input
          v-model="queryParams.search"
          clearable
          placeholder="请输入句子内容或描述"
          style="width: 200px"
        />
      </form-item>
      <el-button type="primary" @click="getList" :icon="Search"> 搜索 </el-button>
      <el-button @click="resetQuery" :icon="Refresh"> 重置 </el-button>
      <div class="shrink-0">
        <el-button type="primary" :icon="Plus" @click="handleAdd"> 新增 </el-button>
        <el-button type="primary" :icon="Plus" @click="aiDialogVisible = true" style="margin-left: 8px;">AI生成新句子</el-button>
        <el-button type="danger" :icon="Delete" @click="handleDelete(null)">
          批量删除
        </el-button>
      </div>
    </div>
    <el-dialog v-model="aiDialogVisible" title="AI生成新句子" width="400px" align-center>
      <el-input v-model="aiPromptTop" placeholder="可选，留空将使用默认提示词" />
      <template #footer>
        <el-button @click="aiDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiLoadingTop" @click="handleAIGenerateAndAdd">生成并添加</el-button>
      </template>
    </el-dialog>
    <div class="common-table">
      <vxe-grid
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
        @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange"
      >
        <template #operationDefaultSlot="{ row }">
          <div class="flex table-operation-column">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </div>
        </template>
        <template #contentSlot="{ row }">
          <div class="text-wrap" style="max-width: 300px; word-break: break-all;">
            {{ row.content }}
          </div>
        </template>
        <template #descriptionSlot="{ row }">
          <div class="text-wrap" style="max-width: 200px; word-break: break-all;">
            {{ row.description || '-' }}
          </div>
        </template>
        <template #createdAtSlot="{ row }">
          <span>{{ formatDateTime(row.createdAt) }}</span>
        </template>
        <template #updatedAtSlot="{ row }">
          <span>{{ formatDateTime(row.updatedAt) }}</span>
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
      width="600px"
      @close="dialogClose"
      align-center
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="句子内容" prop="content">
              <el-input 
                v-model="form.content" 
                type="textarea" 
                :rows="4"
                placeholder="请输入句子内容" 
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input 
                v-model="form.description" 
                type="textarea" 
                :rows="3"
                placeholder="请输入描述（可选）" 
                maxlength="500"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete, Plus, Refresh } from '@element-plus/icons-vue'
import { getSentenceList, createSentence, updateSentence, deleteSentence, aiGenerateSentence } from '@/api/sentence'
import { commonGridOptions } from '@/common/table'

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  search: ''
})

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: 'checkbox', width: 50 },
    { title: 'ID', field: 'id', width: 80 },
    { title: '句子内容', field: 'content', minWidth: 300, slots: { default: 'contentSlot' } },
    { title: '描述', field: 'description', minWidth: 200, slots: { default: 'descriptionSlot' } },
    { title: '创建时间', field: 'createdAt', width: 160, slots: { default: 'createdAtSlot' } },
    { title: '更新时间', field: 'updatedAt', width: 160, slots: { default: 'updatedAtSlot' } },
    { title: '操作', fixed: 'right', width: 120, slots: { default: 'operationDefaultSlot' } }
  ]
})

const dataSource = ref([])
const loading = ref(false)
const ids = ref([])
const total = ref(0)
const formRef = ref()
const dialogTitle = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({
  content: '',
  description: ''
})
const submitLoading = ref(false)
const aiPromptTop = ref('')
const aiLoadingTop = ref(false)
const aiDialogVisible = ref(false)
const editId = ref<string | null>(null)

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
    const res = await getSentenceList(params)
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

function resetQuery() {
  queryParams.search = ''
  queryParams.currentPage = 1
  getList()
}

function handleAdd() {
  isEdit.value = false
  dialogVisible.value = true
  dialogTitle.value = '新增句子'
  form.value = {
    content: '',
    description: ''
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
  isEdit.value = true
  dialogVisible.value = true
  dialogTitle.value = '编辑句子'
  editId.value = row.id
  form.value = {
    content: row.content,
    description: row.description || ''
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
          await deleteSentence(id)
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

async function handleAIGenerateAndAdd() {
  aiLoadingTop.value = true
  try {
    const res = await aiGenerateSentence({ prompt: aiPromptTop.value })
    if (res.content) {
      await createSentence({ content: res.content, description: res.description || '' })
      ElMessage.success('AI生成并添加成功')
      aiDialogVisible.value = false
      aiPromptTop.value = ''
      getList()
    } else {
      ElMessage.error('AI未返回内容')
    }
  } catch (e) {
    ElMessage.error('AI生成失败')
  } finally {
    aiLoadingTop.value = false
  }
}

const rules = {
  content: [
    { required: true, message: '请输入句子内容', trigger: 'blur' },
    { min: 1, max: 1000, message: '句子内容长度在 1 到 1000 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '描述长度不能超过 500 个字符', trigger: 'blur' }
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
    
    if (isEdit.value) {
      await updateSentence(editId.value, {
        content: form.value.content,
        description: form.value.description
      })
      ElMessage.success('更新成功')
    } else {
      await createSentence({
        content: form.value.content,
        description: form.value.description
      })
      ElMessage.success('新增成功')
    }
    
    getList()
    dialogVisible.value = false
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.text-wrap {
  white-space: normal;
  line-height: 1.5;
}
</style> 