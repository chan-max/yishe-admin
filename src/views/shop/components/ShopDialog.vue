<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" v-loading="formLoading">
      <el-form-item label="店铺名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入店铺名称" />
      </el-form-item>
      <el-form-item label="店铺描述" prop="description">
        <el-input v-model="formData.description" type="textarea" placeholder="请输入店铺描述" />
      </el-form-item>
      <el-form-item label="店铺Logo" prop="logo">
        <UploadImg v-model="formData.logo" />
      </el-form-item>
      <el-form-item label="轮播图" prop="carousel">
        <UploadImgs v-model="formData.carousel" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitForm" :loading="formLoading">确定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, unref } from 'vue'
import { ElMessage } from 'element-plus'
import { createShop, updateShop, getShopDetail } from '@/api/shop'
import UploadImg from '@/components/UploadFile/src/UploadImg.vue'
import UploadImgs from '@/components/UploadFile/src/UploadImgs.vue'

const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formRef = ref()
const formData = reactive({
  id: undefined,
  name: '',
  description: '',
  logo: '',
  carousel: [] as string[]
})

const formRules = {
  name: [{ required: true, message: '请输入店铺名称', trigger: 'blur' }]
}

const open = async (id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = id ? '编辑店铺' : '新增店铺'
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      const res = await getShopDetail(id)
      Object.assign(formData, res)
    } finally {
      formLoading.value = false
    }
  }
}

const resetForm = () => {
  formData.id = undefined
  formData.name = ''
  formData.description = ''
  formData.logo = ''
  formData.carousel = []
}

const submitForm = async () => {
  const form = unref(formRef)
  if (!form) return
  await form.validate(async (valid) => {
    if (valid) {
      formLoading.value = true
      try {
        const data = { ...formData }
        if (data.id) {
          await updateShop(data.id, data)
          ElMessage.success('修改成功')
        } else {
          await createShop(data)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        emit('success')
      } finally {
        formLoading.value = false
      }
    }
  })
}

defineExpose({ open })
</script>
