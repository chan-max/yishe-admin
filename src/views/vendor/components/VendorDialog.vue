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
            <el-form-item label="厂家编码">
              <el-input
                :model-value="formData.code || ''"
                :placeholder="formData.id ? '暂无厂家编码' : '创建后由后台自动生成'"
                disabled
              />
            </el-form-item>
          </el-col>
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

      <div class="vendor-form__section">
        <div class="vendor-form__section-header">
          <div class="vendor-form__section-title mb-0">商品信息</div>
          <el-button type="primary" plain @click="addProduct">新增商品</el-button>
        </div>

        <div v-if="formData.products.length" class="vendor-product-list">
          <div v-for="(product, productIndex) in formData.products" :key="product.localKey" class="vendor-product-card">
            <div class="vendor-product-card__header">
              <div class="vendor-product-card__title">商品 {{ productIndex + 1 }}</div>
              <el-button type="danger" link @click="removeProduct(productIndex)">删除商品</el-button>
            </div>

            <el-row :gutter="20">
              <el-col :xs="24" :md="8">
                <el-form-item :label="`商品名称 ${productIndex + 1}`" label-width="120px">
                  <el-input v-model="product.name" placeholder="例如：鼠标垫、圆鼠标垫" />
                </el-form-item>
              </el-col>
            </el-row>

            <div class="vendor-product-card__subheader">
              <div class="vendor-product-card__subtitle">型号与价格</div>
              <el-button type="primary" link @click="addVariant(productIndex)">新增型号</el-button>
            </div>

            <div v-if="product.variants.length" class="vendor-product-card__variants">
              <div
                v-for="(variant, variantIndex) in product.variants"
                :key="variant.localKey"
                class="vendor-product-card__variant"
              >
                <el-row :gutter="16">
                  <el-col :xs="24" :md="7">
                    <el-form-item :label="variantIndex === 0 ? '型号' : ' '" label-width="72px">
                      <el-input v-model="variant.model" placeholder="例如：标准款、加厚款" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :md="7">
                    <el-form-item :label="variantIndex === 0 ? '尺寸' : ' '" label-width="72px">
                      <el-input v-model="variant.size" placeholder="可留空，例如：240x200mm" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :md="7">
                    <el-form-item :label="variantIndex === 0 ? '价格' : ' '" label-width="72px">
                      <el-input-number
                        v-model="variant.price"
                        :min="0"
                        :precision="2"
                        :step="0.1"
                        :controls="false"
                        class="w-full"
                        placeholder="请输入价格"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :md="3" class="vendor-product-card__variant-action">
                    <el-button type="danger" link @click="removeVariant(productIndex, variantIndex)">删除</el-button>
                  </el-col>
                </el-row>
              </div>
            </div>

            <el-empty v-else description="先为这个商品添加型号、尺寸和价格" :image-size="68" />
          </div>
        </div>

        <el-empty v-else description="还没有录入商品，点击右上角新增商品" :image-size="88" />
      </div>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">确定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { UploadProps, UploadUserFile } from 'element-plus'
import { computed, reactive, ref, unref } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { VendorProductItem } from '@/api/vendor'
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

type ProductVariantFormItem = {
  localKey: string
  model: string
  size: string
  price: number | null
}

type ProductFormItem = {
  localKey: string
  name: string
  variants: ProductVariantFormItem[]
}

const createLocalKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const createEmptyVariant = (): ProductVariantFormItem => ({
  localKey: createLocalKey(),
  model: '',
  size: '',
  price: null
})

const createEmptyProduct = (): ProductFormItem => ({
  localKey: createLocalKey(),
  name: '',
  variants: [createEmptyVariant()]
})

const buildProductFormList = (
  products?: VendorProductItem[]
): ProductFormItem[] => {
  const groupedProducts = new Map<string, ProductFormItem>()

  ;(products || []).forEach((item) => {
    const productName = String(item?.name || '').trim()
    const groupKey = productName || createLocalKey()
    const existingProduct =
      groupedProducts.get(groupKey) ||
      ({
        localKey: createLocalKey(),
        name: productName,
        variants: []
      } as ProductFormItem)

    existingProduct.variants.push({
      localKey: createLocalKey(),
      model: String(item?.model || '').trim(),
      size: String(item?.size || '').trim(),
      price: item?.price === undefined || item?.price === null ? null : Number(item.price)
    })

    groupedProducts.set(groupKey, existingProduct)
  })

  return Array.from(groupedProducts.values())
}

const flattenProducts = (products: ProductFormItem[]): VendorProductItem[] =>
  products.flatMap((product) =>
    product.variants
      .map((variant) => ({
        name: String(product.name || '').trim(),
        model: String(variant.model || '').trim(),
        size: String(variant.size || '').trim(),
        price: variant.price === undefined || variant.price === null ? null : Number(variant.price)
      }))
      .filter((item) => item.name || item.model || item.size || item.price !== null)
  )

const formData = reactive({
  id: undefined as number | undefined,
  code: '',
  name: '',
  description: '',
  contactName: '',
  contactPhone: '',
  address: '',
  images: [] as string[],
  products: [] as ProductFormItem[]
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
  formData.code = ''
  formData.name = ''
  formData.description = ''
  formData.contactName = ''
  formData.contactPhone = ''
  formData.address = ''
  formData.images = []
  formData.products = []
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
    const products = buildProductFormList(Array.isArray(data?.products) ? data.products : [])
    Object.assign(formData, {
      ...data,
      images,
      products
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

const addProduct = () => {
  formData.products.push(createEmptyProduct())
}

const removeProduct = (productIndex: number) => {
  formData.products.splice(productIndex, 1)
}

const addVariant = (productIndex: number) => {
  formData.products[productIndex]?.variants.push(createEmptyVariant())
}

const removeVariant = (productIndex: number, variantIndex: number) => {
  const variants = formData.products[productIndex]?.variants
  if (!variants) return
  variants.splice(variantIndex, 1)
  if (!variants.length) {
    variants.push(createEmptyVariant())
  }
}

const validateProducts = () => {
  const normalizedProducts = flattenProducts(formData.products)

  if (!normalizedProducts.length) return true

  const hasMissingProductName = normalizedProducts.some((item) => !item.name)
  if (hasMissingProductName) {
    ElMessage.warning('请先填写商品名称')
    return false
  }

  const hasMissingModel = normalizedProducts.some((item) => !item.model)
  if (hasMissingModel) {
    ElMessage.warning('请为每个商品填写型号')
    return false
  }

  const hasMissingPrice = normalizedProducts.some((item) => item.price === null || Number.isNaN(Number(item.price)))
  if (hasMissingPrice) {
    ElMessage.warning('请为每个型号填写价格')
    return false
  }

  return true
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
    if (!validateProducts()) return

    formLoading.value = true
    try {
      const images = await uploadPendingImages()
      const payload = {
        ...formData,
        images,
        products: flattenProducts(formData.products)
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
  padding: 18px 18px 8px;
  margin-bottom: 16px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-radius: 12px;
  box-shadow: none;
}

.vendor-form__section-title {
  margin-bottom: 18px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.vendor-form__section-header,
.vendor-product-card__header,
.vendor-product-card__subheader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.vendor-form__section-header {
  margin-bottom: 18px;
}

.vendor-form__section-title.mb-0 {
  margin-bottom: 0;
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

.vendor-product-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.vendor-product-card {
  padding: 16px;
  border: 1px solid var(--app-content-border-color);
  border-radius: 12px;
  background: var(--app-content-surface-muted-color);
}

.vendor-product-card__header {
  margin-bottom: 18px;
}

.vendor-product-card__title,
.vendor-product-card__subtitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.vendor-product-card__subheader {
  margin: 4px 0 12px;
}

.vendor-product-card__variants {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vendor-product-card__variant {
  padding: 14px 14px 0;
  border-radius: 10px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
}

.vendor-product-card__variant-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.vendor-image-upload :deep(.el-upload--picture-card),
.vendor-image-upload :deep(.el-upload-list__item) {
  width: 132px;
  height: 132px;
  border-radius: 12px;
}
</style>
