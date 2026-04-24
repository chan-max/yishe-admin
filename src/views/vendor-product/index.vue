<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="vendor-product-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="resource-toolbar">
            <div class="resource-toolbar__meta">
              <div class="resource-toolbar__actions vendor-product-toolbar">
                <el-select v-model="queryVendorId" clearable filterable size="small" placeholder="全部厂家" style="width: 220px">
                  <el-option v-for="vendor in vendors" :key="vendor.id" :label="vendor.name" :value="vendor.id" />
                </el-select>
                <el-button size="small" type="primary" @click="openDialog()">新增供应商商品</el-button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #table>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat">
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid v-bind="gridOptions" :data="filteredList" :loading="loading">
                <template #vendorSlot="{ row }">
                  <span>{{ row.vendor?.name || getVendorName(row.vendorId) }}</span>
                </template>
                <template #priceSlot="{ row }">
                  <span>{{ row.price === null || row.price === undefined || row.price === '' ? '-' : `¥${Number(row.price).toFixed(2)}` }}</span>
                </template>
                <template #createTimeSlot="{ row }">
                  <span class="table-time-text">{{ formatDate(row.createTime) }}</span>
                </template>
                <template #operationSlot="{ row }">
                  <el-dropdown placement="bottom-end" @command="(command) => handleOperationCommand(String(command), row)">
                    <el-button type="primary" link size="small">操作</el-button>
                    <template #dropdown>
                      <el-dropdown-menu class="operation-menu-compact">
                        <el-dropdown-item command="edit">编辑</el-dropdown-item>
                        <el-dropdown-item command="delete" divided class="operation-menu-item--danger">删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
              </vxe-grid>
            </div>
          </div>
        </div>
      </template>
    </ListPageLayout>

    <Dialog v-model="dialogVisible" :title="formData.id ? '编辑供应商商品' : '新增供应商商品'" width="720px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="96px" v-loading="formLoading">
        <el-form-item label="供应商" prop="vendorId">
          <el-select v-model="formData.vendorId" filterable placeholder="请选择供应商" class="w-full">
            <el-option v-for="vendor in vendors" :key="vendor.id" :label="vendor.name" :value="vendor.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="formData.name" placeholder="例如：鼠标垫" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="型号" prop="model">
              <el-input v-model="formData.model" placeholder="例如：标准方垫" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="规格/尺寸" prop="size">
              <el-input v-model="formData.size" placeholder="例如：240x200mm" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="参考价格" prop="price">
              <el-input-number v-model="formData.price" :min="0" :precision="2" :step="0.1" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="formData.unit" placeholder="例如：个、套、张" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="可填写起订量、打样周期等" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="submitForm">确定</el-button>
      </template>
    </Dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, unref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from '@/common/table'
import {
  createVendorProduct,
  deleteVendorProduct,
  getVendorList,
  getVendorProductList,
  updateVendorProduct,
  type Vendor,
  type VendorProductItem
} from '@/api/vendor'
import { formatDate } from '@/utils/formatTime'
import ListPageLayout from '@/components/ListPageLayout/index.vue'

const route = useRoute()
const loading = ref(false)
const formLoading = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const list = ref<VendorProductItem[]>([])
const vendors = ref<Vendor[]>([])
const queryVendorId = ref<number | undefined>()

const createEmptyForm = (): VendorProductItem => ({
  vendorId: undefined,
  name: '',
  model: '',
  size: '',
  price: null,
  unit: '',
  remark: ''
})

const formData = reactive<VendorProductItem>(createEmptyForm())

const formRules: FormRules = {
  vendorId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }]
}

const filteredList = computed(() => {
  if (!queryVendorId.value) return list.value
  return list.value.filter((item) => Number(item.vendorId) === Number(queryVendorId.value))
})

const gridOptions = ref({
  ...commonGridOptions,
  rowConfig: { keyField: 'id' },
  columns: [
    { title: 'ID', field: 'id', width: 80 },
    { title: '供应商', field: 'vendorId', minWidth: 180, slots: { default: 'vendorSlot' } },
    { title: '商品名称', field: 'name', minWidth: 160 },
    { title: '型号', field: 'model', minWidth: 140, showOverflow: 'tooltip' },
    { title: '规格/尺寸', field: 'size', minWidth: 140, showOverflow: 'tooltip' },
    { title: '参考价格', field: 'price', width: 120, slots: { default: 'priceSlot' } },
    { title: '单位', field: 'unit', width: 90 },
    { title: '备注', field: 'remark', minWidth: 220, showOverflow: 'tooltip' },
    { ...buildTimeColumn('创建时间', 'createTime', 180), slots: { default: 'createTimeSlot' } },
    buildOperationColumn('operationSlot')
  ]
})

const getVendorName = (vendorId?: number) => vendors.value.find((item) => Number(item.id) === Number(vendorId))?.name || '-'

const resetForm = () => {
  Object.assign(formData, createEmptyForm())
  formRef.value?.clearValidate()
}

const loadData = async () => {
  loading.value = true
  try {
    const [vendorData, productData] = await Promise.all([getVendorList(), getVendorProductList()])
    vendors.value = Array.isArray(vendorData) ? vendorData : []
    list.value = Array.isArray(productData) ? productData : []
  } finally {
    loading.value = false
  }
}

const openDialog = (row?: VendorProductItem) => {
  resetForm()
  if (row?.id) {
    Object.assign(formData, {
      ...row,
      price: row.price === undefined ? null : row.price
    })
  } else if (queryVendorId.value) {
    formData.vendorId = queryVendorId.value
  }
  dialogVisible.value = true
}

const handleOperationCommand = (command: string, row: VendorProductItem) => {
  if (command === 'edit') {
    openDialog(row)
    return
  }
  if (command === 'delete') {
    handleDelete(row.id)
  }
}

const handleDelete = async (id?: number) => {
  if (!id) return
  try {
    await ElMessageBox.confirm('确认删除该供应商商品吗？', '提示', { type: 'warning' })
    await deleteVendorProduct(id)
    ElMessage.success('删除成功')
    await loadData()
  } catch {}
}

const submitForm = async () => {
  const form = unref(formRef)
  if (!form) return
  await form.validate(async (valid) => {
    if (!valid) return
    formLoading.value = true
    try {
      const payload = {
        ...formData,
        vendorId: Number(formData.vendorId),
        price: formData.price === undefined ? null : formData.price
      }
      if (payload.id) {
        await updateVendorProduct(payload.id, payload)
        ElMessage.success('修改成功')
      } else {
        await createVendorProduct(payload)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      await loadData()
    } finally {
      formLoading.value = false
    }
  })
}

watch(
  () => route.query.vendorId,
  (vendorId) => {
    const numericVendorId = Number(vendorId)
    queryVendorId.value = Number.isInteger(numericVendorId) && numericVendorId > 0 ? numericVendorId : undefined
  },
  { immediate: true }
)

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
:deep(.vendor-product-page) {
  gap: 10px;
  padding: 8px 0 0;
}

.vendor-product-toolbar {
  align-items: center;
  gap: 10px;
}
</style>
