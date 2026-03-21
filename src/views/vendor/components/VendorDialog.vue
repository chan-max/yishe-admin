<template>
  <Dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :initial-fullscreen="true"
    scroll
    max-height="calc(100vh - 140px)"
    width="1200px"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="96px"
      class="vendor-form"
      v-loading="formLoading"
    >
      <div class="vendor-form__section">
        <div class="vendor-form__section-title">基础信息</div>
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-form-item label="厂家名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入厂家名称" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="联系人" prop="contactName">
              <el-input v-model="formData.contactName" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="地址" prop="address">
              <el-input v-model="formData.address" placeholder="请输入地址" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="vendor-form__section">
        <div class="vendor-form__section-title">展示信息</div>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="厂家描述" prop="description">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="5"
                placeholder="请输入厂家描述"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="厂家图片" prop="images">
              <el-upload
                v-model:file-list="imageFileList"
                action="#"
                list-type="picture-card"
                :auto-upload="false"
                :multiple="true"
                :limit="20"
                :before-upload="beforeImageUpload"
                :on-change="handleImageChange"
                :on-remove="handleImageRemove"
                :on-preview="handleImagePreview"
                class="vendor-image-upload"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
              <div class="vendor-form__hint">
                选择图片后仅做本地暂存和预览，点击“确定”时才会上传到 COS。文件路径使用
                `vendor/日期/账号/...`
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">确定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { UploadFile, UploadFiles, UploadProps, UploadUserFile } from 'element-plus'
import { computed, reactive, ref, unref } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { createVendor, getVendorDetail, updateVendor } from '@/api/vendor'
import { createImageViewer } from '@/components/ImageViewer'
import { uploadToCOS } from '@/api/cos'
import { useUserStore } from '@/store/modules/user'

const emit = defineEmits(['success'])

const userStore = useUserStore()
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formRef = ref()
const imageFileList = ref<UploadUserFile[]>([])
const existingImages = ref<string[]>([])

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

const userAccount = computed(
  () =>
    (userStore.user as any)?.account || userStore.user?.shortName || userStore.user?.name || 'anonymous'
)

const revokeLocalPreviewUrls = () => {
  imageFileList.value.forEach((file) => {
    if (file.raw && typeof file.url === 'string' && file.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url)
    }
  })
}

const buildExistingFileList = (images: string[]) =>
  images.map((url) => ({
    name: url.substring(url.lastIndexOf('/') + 1),
    url
  }))

const resetForm = () => {
  revokeLocalPreviewUrls()
  formData.id = undefined
  formData.name = ''
  formData.description = ''
  formData.contactName = ''
  formData.contactPhone = ''
  formData.address = ''
  formData.images = []
  existingImages.value = []
  imageFileList.value = []
}

const open = async (id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = id ? '编辑厂家' : '新增厂家'
  resetForm()

  if (!id) return

  formLoading.value = true
  try {
    const data = await getVendorDetail(id)
    const images = Array.isArray(data?.images) ? data.images : []
    Object.assign(formData, {
      ...data,
      images
    })
    existingImages.value = [...images]
    imageFileList.value = buildExistingFileList(images)
  } finally {
    formLoading.value = false
  }
}

const beforeImageUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const isImage = supportedTypes.includes(rawFile.type)
  const isLt5M = rawFile.size / 1024 / 1024 < 5

  if (!isImage) {
    ElNotification({
      title: '温馨提示',
      message: '仅支持 JPG、PNG、GIF、WEBP 图片格式',
      type: 'warning'
    })
  }

  if (!isLt5M) {
    ElNotification({
      title: '温馨提示',
      message: '单张图片大小不能超过 5MB',
      type: 'warning'
    })
  }

  return isImage && isLt5M
}

const handleImageChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
  if (uploadFile.raw && (!uploadFile.url || !uploadFile.url.startsWith('blob:'))) {
    uploadFile.url = URL.createObjectURL(uploadFile.raw)
  }
  imageFileList.value = uploadFiles as UploadUserFile[]
}

const handleImageRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  if (uploadFile.raw && typeof uploadFile.url === 'string' && uploadFile.url.startsWith('blob:')) {
    URL.revokeObjectURL(uploadFile.url)
  }
  if (!uploadFile.raw && uploadFile.url) {
    existingImages.value = existingImages.value.filter((url) => url !== uploadFile.url)
  }
  imageFileList.value = uploadFiles as UploadUserFile[]
}

const handleImagePreview: UploadProps['onPreview'] = (uploadFile) => {
  if (!uploadFile.url) return
  createImageViewer({
    zIndex: 9999999,
    urlList: [uploadFile.url]
  })
}

const handleCancel = () => {
  dialogVisible.value = false
  resetForm()
}

const uploadPendingImages = async () => {
  const uploadedUrls = new Map<UploadUserFile, string>()

  for (const file of imageFileList.value) {
    if (!file.raw) continue

    const result = await uploadToCOS({
      file: file.raw as File,
      category: 'vendor',
      account: userAccount.value
    })
    uploadedUrls.set(file, result.url)
  }

  return imageFileList.value
    .map((file) => {
      if (file.raw) {
        return uploadedUrls.get(file) || ''
      }
      return file.url || ''
    })
    .filter(Boolean)
}

const submitForm = async () => {
  const form = unref(formRef)
  if (!form) return

  await form.validate(async (valid) => {
    if (!valid) return

    formLoading.value = true
    try {
      const images = await uploadPendingImages()
      const payload = {
        ...formData,
        images
      }

      if (payload.id) {
        await updateVendor(payload.id, payload)
        ElMessage.success('修改成功')
      } else {
        await createVendor(payload)
        ElMessage.success('新增成功')
      }

      dialogVisible.value = false
      resetForm()
      emit('success')
    } catch (error: any) {
      ElMessage.error(error?.message || '图片上传或保存失败')
    } finally {
      formLoading.value = false
    }
  })
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.vendor-form {
  padding: 8px 4px;
}

.vendor-form__section {
  padding: 20px 20px 8px;
  margin-bottom: 18px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.04);
}

.vendor-form__section-title {
  margin-bottom: 18px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.vendor-form__hint {
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.vendor-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.vendor-form :deep(.el-textarea__inner) {
  min-height: 140px;
}

.vendor-image-upload :deep(.el-upload--picture-card),
.vendor-image-upload :deep(.el-upload-list__item) {
  width: 132px;
  height: 132px;
  border-radius: 12px;
}
</style>
