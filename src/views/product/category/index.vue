
<script setup lang="ts">
import { ref, reactive, onMounted, computed, watchEffect } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { productCategoryApi } from '@/api/product-category'
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { formatTime } from '@/utils'
import { commonGridOptions } from "@/common/table"
import { useWindowSize } from "@vueuse/core"

const { t } = useI18n()

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const queryParams = reactive({
  page: 1,
  pageSize: 20,
  name: undefined,
  searchText: undefined
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
    { field: 'name', title: '名称', minWidth: 150 },
    { field: 'enName', title: '英文名称', minWidth: 150 },
    { field: 'features', title: '特点', minWidth: 200, showOverflow: true },
    { field: 'podAdvantages', title: 'POD优点', minWidth: 200, showOverflow: true },
    { field: 'designGuidelines', title: '设计准则', minWidth: 200, showOverflow: true },
    { field: 'description', title: '基础信息', minWidth: 200, showOverflow: true },
    { 
      field: 'createTime', 
      title: '创建时间', 
      width: 160,
      formatter: ({ cellValue }) => formatTime(cellValue, 'yyyy-MM-dd HH:mm')
    },
    { 
      title: '操作', 
      width: 150, 
      fixed: 'right',
      slots: { default: 'action' } 
    }
  ]
}))

const getList = async () => {
  loading.value = true
  try {
    const res = await productCategoryApi.getList(queryParams)
    tableData.value = res.list
    total.value = res.total
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

const resetQuery = () => {
  queryParams.name = undefined
  queryParams.searchText = undefined
  handleSearch()
}

// Dialog
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const form = reactive({
  id: undefined,
  name: '',
  enName: '',
  features: '',
  podAdvantages: '',
  designGuidelines: '',
  description: '',
  image: '',
  isActive: true
})

const rules = {
  name: [{ required: true, message: '请输入商品种类名称', trigger: 'blur' }]
}

const handleAdd = () => {
  dialogTitle.value = '新增商品种类'
  form.id = undefined
  form.name = ''
  form.enName = ''
  form.features = ''
  form.podAdvantages = ''
  form.designGuidelines = ''
  form.description = ''
  form.image = ''
  form.isActive = true
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑商品种类'
  Object.assign(form, row)
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (form.id) {
          await productCategoryApi.update(form)
          ElMessage.success('更新成功')
        } else {
          await productCategoryApi.add(form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        getList()
      } catch (err) {
        console.error(err)
      }
    }
  })
}

import { useUserStore } from '@/store/modules/user'

const handleDelete = (row: any) => {
  const userStore = useUserStore()
  if (!userStore.user?.isAdmin) {
    return ElMessage.warning('无权限：仅管理员可执行删除操作')
  }
  ElMessageBox.confirm('确认删除该商品种类吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
      try {
        await productCategoryApi.delete(row.id)
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
        <el-input
          v-model="queryParams.searchText"
          placeholder="搜索名称/特点/描述"
          style="width: 250px"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>
      <div>
        <el-button type="primary" @click="handleAdd">新增种类</el-button>
      </div>
    </div>

    <vxe-grid
      v-bind="gridOptions"
      :data="tableData"
      :loading="loading"
    >
      <template #action="{ row }">
        <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
        <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
      </template>
    </vxe-grid>

    <div class="mt-4 flex justify-end">
        <pagination
        v-model:page="queryParams.page"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
        />
    </div>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="60%">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="种类名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：鼠标垫" />
        </el-form-item>
        <el-form-item label="英文名称" prop="enName">
          <el-input v-model="form.enName" placeholder="例如：Mouse Pad" />
        </el-form-item>
        <el-form-item label="特点" prop="features">
          <el-input v-model="form.features" type="textarea" :rows="3" placeholder="描述该商品种类的特点" />
        </el-form-item>
        <el-form-item label="POD优点" prop="podAdvantages">
          <el-input v-model="form.podAdvantages" type="textarea" :rows="3" placeholder="描述用于POD的优点" />
        </el-form-item>
        <el-form-item label="设计准则" prop="designGuidelines">
          <el-input v-model="form.designGuidelines" type="textarea" :rows="3" placeholder="设计时的注意事项或准则" />
        </el-form-item>
        <el-form-item label="基础信息" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="其他基础信息" />
        </el-form-item>
        <el-form-item label="图片URL" prop="image">
            <el-input v-model="form.image" placeholder="图片链接" />
        </el-form-item>
        <el-form-item label="启用状态" prop="isActive">
          <el-switch v-model="form.isActive" />
        </el-form-item>
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
