<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="760px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="厂家名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入厂家名称" />
      </el-form-item>
      <el-form-item label="联系人" prop="contactName">
        <el-input v-model="formData.contactName" placeholder="请输入联系人" />
      </el-form-item>
      <el-form-item label="联系电话" prop="contactPhone">
        <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="地址" prop="address">
        <el-input v-model="formData.address" placeholder="请输入地址" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          placeholder="请输入厂家描述"
        />
      </el-form-item>
      <el-form-item label="厂家图片" prop="images">
        <UploadImgs v-model="formData.images" :limit="999" width="120px" height="120px" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">确定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, ref, unref } from 'vue'
import { ElMessage } from 'element-plus'
import { createVendor, getVendorDetail, updateVendor } from '@/api/vendor'
import UploadImgs from '@/components/UploadFile/src/UploadImgs.vue'

const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formRef = ref()

const formData = reactive({
  id: undefined as number | undefined,
  name: '',
  description: '',
  contactName: '',
  contactPhone: '',
  address: '',
  images: [] as string[]
})

const formRules = {
  name: [{ required: true, message: '请输入厂家名称', trigger: 'blur' }]
}

const resetForm = () => {
  formData.id = undefined
  formData.name = ''
  formData.description = ''
  formData.contactName = ''
  formData.contactPhone = ''
  formData.address = ''
  formData.images = []
}

const open = async (id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = id ? '编辑厂家' : '新增厂家'
  resetForm()

  if (!id) return

  formLoading.value = true
  try {
    const data = await getVendorDetail(id)
    Object.assign(formData, {
      ...data,
      images: Array.isArray(data?.images) ? data.images : []
    })
  } finally {
    formLoading.value = false
  }
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
        images: Array.isArray(formData.images) ? formData.images : []
      }
      if (payload.id) {
        await updateVendor(payload.id, payload)
        ElMessage.success('修改成功')
      } else {
        await createVendor(payload)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      emit('success')
    } finally {
      formLoading.value = false
    }
  })
}

defineExpose({ open })
</script>
