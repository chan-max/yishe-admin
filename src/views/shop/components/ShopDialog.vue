<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" v-loading="formLoading">
      <el-form-item :label="t('shop.name')" prop="name">
        <el-input v-model="formData.name" :placeholder="t('shop.namePlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('shop.description')" prop="description">
        <el-input v-model="formData.description" type="textarea" :placeholder="t('shop.descriptionPlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('shop.logo')" prop="logo">
        <UploadImg v-model="formData.logo" />
      </el-form-item>
      <el-form-item :label="t('shop.carousel')" prop="carousel">
        <UploadImgs v-model="formData.carousel" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="submitForm" :loading="formLoading">{{ t('common.confirm') }}</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, unref } from 'vue'
import { ElMessage } from 'element-plus'
import { createShop, updateShop, getShopDetail } from '@/api/shop'
import UploadImg from '@/components/UploadFile/src/UploadImg.vue'
import UploadImgs from '@/components/UploadFile/src/UploadImgs.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
  name: [{ required: true, message: t('shop.nameRequired'), trigger: 'blur' }]
}

const open = async (id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = id ? t('shop.editShop') : t('shop.addShop')
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
          ElMessage.success(t('common.updateSuccess'))
        } else {
          await createShop(data)
          ElMessage.success(t('common.addSuccess'))
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
