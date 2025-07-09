<template>
  <div>
    <div class="py-4 flex justify-between gap-4 items-center">
      <div style="flex: 1"></div>
      <div class="shrink-0">
        <el-button type="danger" :icon="Delete" @click="handleDelete(null)">
          批量删除
        </el-button>
      </div>
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
          <div class="flex table-operation-column">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </div>
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
            style="width: 50px; height: 50px; object-fit: cover;"
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
          <el-col :span="12">
            <el-form-item label="价格" prop="price">
              <el-input 
                v-model="form.price" 
                placeholder="请输入价格（可选）" 
                maxlength="1000"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关键词" prop="keywords">
              <el-input 
                v-model="form.keywords" 
                placeholder="请输入关键词（可选）" 
                maxlength="1000"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="模型地址" prop="url">
              <el-input 
                v-model="form.url" 
                placeholder="请输入模型地址（可选）" 
                maxlength="1000"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="缩略图地址" prop="thumbnail">
              <el-input 
                v-model="form.thumbnail" 
                placeholder="请输入缩略图地址（可选）" 
                maxlength="1000"
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
import { Delete } from '@element-plus/icons-vue'
import { getProductModelPage, updateProductModel, deleteProductModel } from '@/api/productModel'
import { commonGridOptions } from '@/common/table'

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20
})

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: 'checkbox', width: 50 },
    { title: 'ID', field: 'id', width: 80 },
    { title: '模型名称', field: 'name', minWidth: 200, slots: { default: 'nameSlot' } },
    { title: '模型描述', field: 'description', minWidth: 300, slots: { default: 'descriptionSlot' } },
    { title: '价格', field: 'price', width: 100, slots: { default: 'priceSlot' } },
    { title: '关键词', field: 'keywords', minWidth: 200, slots: { default: 'keywordsSlot' } },
    { title: '缩略图', field: 'thumbnail', width: 80, slots: { default: 'thumbnailSlot' } },
    { title: '引用次数', field: 'ref_count', width: 100 },
    { title: '点赞次数', field: 'like_count', width: 100 },
    { title: '收藏次数', field: 'save_count', width: 100 },
    { title: '链接次数', field: 'link_count', width: 100 },
    { title: '创建时间', field: 'createTime', width: 160, slots: { default: 'createTimeSlot' } },
    { title: '更新时间', field: 'updateTime', width: 160, slots: { default: 'updateTimeSlot' } },
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
const form = ref<{
  id?: string
  name: string
  description: string
  price: string
  url: string
  keywords: string
  thumbnail: string
}>({
  name: '',
  description: '',
  price: '',
  url: '',
  keywords: '',
  thumbnail: ''
})
const submitLoading = ref(false)

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
    price: row.price || '',
    url: row.url || '',
    keywords: row.keywords || '',
    thumbnail: row.thumbnail || ''
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
  price: [
    { max: 1000, message: '价格长度不能超过 1000 个字符', trigger: 'blur' }
  ],
  url: [
    { max: 1000, message: '模型地址长度不能超过 1000 个字符', trigger: 'blur' }
  ],
  keywords: [
    { max: 1000, message: '关键词长度不能超过 1000 个字符', trigger: 'blur' }
  ],
  thumbnail: [
    { max: 1000, message: '缩略图地址长度不能超过 1000 个字符', trigger: 'blur' }
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
      price: form.value.price,
      url: form.value.url,
      keywords: form.value.keywords,
      thumbnail: form.value.thumbnail
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
</script>

<style scoped>
.text-wrap {
  white-space: normal;
  line-height: 1.5;
}
</style> 