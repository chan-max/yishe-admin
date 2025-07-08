<template>
  <div>
    <div class="py-4 flex justify-between gap-4 items-center">
      <div style="flex: 1"></div>
      <form-item label="按名称搜索">
        <el-input
          v-model="queryParams.name"
          clearable
          placeholder="请输入名称"
          style="width: 160px"
        />
      </form-item>
      <el-button type="primary" @click="getList" :icon="Search"> 搜索 </el-button>
      <div class="shrink-0">
        <!-- 删除按钮 -->
        <el-button type="danger" :icon="Delete" @click="handleDelete(null)">
          批量删除
        </el-button>
      </div>
    </div>
    <!-- 表格展示 -->
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
        <template #thumbnailSlot="{ row }">
          <el-image
            v-if="row.thumbnail"
            :src="row.thumbnail"
            :preview-src-list="[row.thumbnail]"
            style="width: 64px; height: 64px; object-fit: cover; cursor: pointer;"
            fit="cover"
            :z-index="3000"
            preview-teleported
          />
        </template>
        <template #metaSlot="{ row }">
          <el-button type="primary" link size="small" @click="showMetaDetail(row.meta)">查看详情</el-button>
        </template>
        <template #uploaderSlot="{ row }">
          <span>{{ row.uploader?.nickname || row.uploader?.name || row.uploaderId || '' }}</span>
        </template>
      </vxe-grid>
    </div>
    <!-- 分页 -->
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
            <el-form-item label="模型名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入模型名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" placeholder="请输入描述" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="metaDialogVisible" fullscreen title="元数据详情" :close-on-click-modal="false">
      <vue-json-pretty :data="JSON.parse(metaDialogContent)" />
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete } from '@element-plus/icons-vue'
import { getDesignModelList, updateDesignModel, deleteDesignModel } from '@/api/designModel'
import { commonGridOptions } from '@/common/table'
import type { DesignModelVO } from '@/api/designModel'
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';


const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  name: ''
})
const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: 'checkbox', width: 50 },
    // { title: 'ID', field: 'id', width: 240 },
    { title: '缩略图', field: 'thumbnail', width: 120, slots: { default: 'thumbnailSlot' } },
    { title: '模型名称', field: 'name', width: 200 },
    { title: '描述', field: 'description', minWidth: 300 },
    { title: '关键词', field: 'keywords', width: 180 },
    { title: '元数据', field: 'meta', width: 120, slots: { default: 'metaSlot' } },
    { title: '作者ID', field: 'uploaderId', width: 120 },
    { title: '作者', field: 'uploader', width: 120, slots: { default: 'uploaderSlot' } },
    { title: '创建时间', field: 'createTime', width: 150 },
    { title: '修改时间', field: 'updateTime', width: 150 },
    {
      title: '操作',
      fixed: 'right',
      width: 'auto',
      slots: { default: 'operationDefaultSlot' }
    }
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
const form = ref<Partial<DesignModelVO>>({})
const submitLoading = ref(false)
const metaDialogVisible = ref(false)
const metaDialogContent = ref('')
function showMetaDetail(meta: any) {
  metaDialogContent.value = JSON.stringify(meta, null, 2)
  metaDialogVisible.value = true
}

async function getList() {
  loading.value = true
  try {
    const params = { ...queryParams }
    const res = await getDesignModelList(params)
    dataSource.value = res.list || []
    total.value = res.total || 0
    ids.value = []
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
  isEdit.value = true
  dialogVisible.value = true
  dialogTitle.value = '编辑模型'
  form.value = { ...row }
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
  ElMessageBox.confirm('确认删除该数据吗', '删除提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'error'
  })
    .then(async () => {
      await deleteDesignModel(delIds)
      ElMessage.success('删除成功')
      getList()
    })
    .catch(() => {})
}
const rules = {
  name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }]
}
const dialogClose = () => {
  dialogVisible.value = false
  submitLoading.value = false
}
const submitForm = async () => {
  submitLoading.value = true
  await formRef.value.validate().finally(() => {
    submitLoading.value = false
  })
  try {
    await updateDesignModel(form.value as any)
    ElMessage.success('更新成功')
    getList()
    dialogVisible.value = false
  } catch (e) {
  } finally {
    submitLoading.value = false
    dialogVisible.value = false
  }
}
</script>
<style lang="less"></style> 