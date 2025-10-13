<template>
  <div class="p-4">
    <div class="py-4 flex justify-between gap-4 items-center">
      <div style="flex: 1"></div>
      <div class="shrink-0">
        <el-button type="primary" @click="handleAdd">新增</el-button>
      </div>
    </div>
    <div class="common-table">
      <vxe-grid
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
      >
        <template #imagesSlot="{ row }">
          <div class="images larger">
            <div class="img-wrap" v-for="(url, i) in getImages(row)" :key="i">
              <el-image
                :src="url"
                :preview-src-list="getImages(row)"
                :initial-index="i"
                fit="cover"
                @load="() => ensureImageMeta(url)"
              />
              
            </div>
          </div>
        </template>
        <template #operationDefaultSlot="{ row }">
          <el-dropdown trigger="hover">
            <span class="el-dropdown-link">
              <el-button link type="primary" size="small">操作</el-button>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleEdit(row)">编辑</el-dropdown-item>
                <el-dropdown-item @click="openImageOption(row)">编辑图片模板信息</el-dropdown-item>
                <el-dropdown-item divided @click="handleDelete(row)" class="text-red-500">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="800px" align-center @close="dialogClose">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="名称" prop="name">
              <el-input v-model="form.name" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="关键字" prop="keywords">
              <el-input v-model="form.keywords" placeholder="逗号分隔" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="3" maxlength="1000" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="图片">
              <div class="uploader">
                <el-upload
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  multiple
                  accept="image/*"
                  :before-upload="beforeUploadImage"
                  :on-change="handleFileChange"
                >
                  <el-button type="primary">选择图片</el-button>
                </el-upload>
                <div class="thumbs">
                  <div class="thumb" v-for="(item, idx) in imageItems" :key="idx">
                    <el-image
                      :src="item.preview || item.url"
                      :preview-src-list="imageItems.map(i => i.preview || i.url).filter(Boolean)"
                      :initial-index="idx"
                      fit="cover"
                      @load="() => (item.url ? ensureImageMeta(item.url) : undefined)"
                    />
                    
                    <div class="ops">
                      <el-button size="small" @click="replaceImage(idx)">替换</el-button>
                      <el-button size="small" type="danger" @click="removeImage(idx)">移除</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑图片模板信息 -->
    <el-dialog
      v-model="imageOptionDialogVisible"
      width="1000px"
      title="编辑图片模板信息"
      align-center
    >
      <div v-if="currentImageRow" class="image-option-body">
        <div class="image-option-grid vertical">
          <div
            class="image-option-item"
            v-for="(url, index) in getImages(currentImageRow)"
            :key="index"
          >
            <div class="preview">
              <el-image :src="url" fit="contain" @load="() => ensureImageMeta(url)" />
            </div>
            <div class="details">
              <div class="meta">
                <div class="line">尺寸：<span>{{ imageMetaMap[url]?.w || '-' }}×{{ imageMetaMap[url]?.h || '-' }}</span></div>
                <div class="line">比例：<span>{{ imageMetaMap[url]?.ratio || '-' }}</span></div>
              </div>
              <div class="json-editor">
                <el-input
                  type="textarea"
                  :rows="6"
                  v-model="imageOptionsDraft[index]"
                  :placeholder="jsonPlaceholder"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="imageOptionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveImageOptions" :loading="imageOptionSaving">保存</el-button>
      </template>
    </el-dialog>
  </div>
  
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { uploadToCOS } from '@/api/cos'
import { pageTemplateGroup2D, createTemplateGroup2D, updateTemplateGroup2D, deleteTemplateGroup2D } from '@/api/templateGroup2D'
import { commonGridOptions } from '@/common/table'

const queryParams = reactive({ currentPage: 1, pageSize: 20 })
const jsonPlaceholder = '请输入JSON配置，例如：{ "padding": 8 }'

const gridOptions = ref<any>({
  ...commonGridOptions,
  columns: [
    { type: 'checkbox', width: 50 },
    { title: '图片', field: 'images', minWidth: 360, slots: { default: 'imagesSlot' } },
    { title: '名称', field: 'name', minWidth: 240 },
    { title: '关键字', field: 'keywords', minWidth: 240 },
    { title: '描述', field: 'description', minWidth: 320 },
    { title: '更新时间', field: 'updateTime', width: 180 },
    { title: '操作', fixed: 'right', width: 96, slots: { default: 'operationDefaultSlot' } },
  ]
})

const dataSource = ref([])
const loading = ref(false)
const total = ref(0)
const formRef = ref()
const dialogTitle = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const currId = ref<string | null>(null)

const form = ref({
  name: '',
  description: '',
  keywords: ''
})

// imageItems: [{ url?: string, file?: File, preview?: string }]
const imageItems = ref<any[]>([])
const submitLoading = ref(false)
// 缓存图片元数据 { url: { w, h, ratio } }
const imageMetaMap = reactive<Record<string, { w: number; h: number; ratio: string }>>({})

const imageOptionDialogVisible = ref(false)
const currentImageRow = ref<any>(null)
const imageOptionsDraft = ref<string[]>([])
const imageOptionSaving = ref(false)

function computeRatio(w: number, h: number) {
  if (!w || !h) return '-'
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const g = gcd(w, h)
  return `${Math.round(w / g)}:${Math.round(h / g)}`
}

function ensureImageMeta(url: string) {
  if (!url || imageMetaMap[url]) return
  const img = new Image()
  img.onload = () => {
    const w = img.naturalWidth
    const h = img.naturalHeight
    imageMetaMap[url] = { w, h, ratio: computeRatio(w, h) }
  }
  img.src = url
}

function openImageOption(row) {
  currentImageRow.value = row
  const urls = getImages(row)
  imageOptionsDraft.value = urls.map((_, idx) => {
    const key = `imageOption${idx + 1}`
    const val = row[key]
    try {
      if (val === undefined || val === null) return ''
      // 如果是字符串，直接展示原始字符串，避免出现被加上引号的情况
      if (typeof val === 'string') return val
      // 对象/数组等再进行格式化
      return JSON.stringify(val, null, 2)
    } catch (e) {
      return ''
    }
  })
  imageOptionDialogVisible.value = true
}

async function saveImageOptions() {
  if (!currentImageRow.value) return
  try {
    imageOptionSaving.value = true
    const payload: any = {}
    // 需要是合理的 JSON 或 JS 对象表达式；否则阻止保存
    const parseJsonOrObject = (text: string): any => {
      // 优先尝试严格 JSON
      try {
        return JSON.parse(text)
      } catch {}
      // 其次尝试 JS 对象/数组/原始表达式（例如 {a:1}, [1,2], 'abc'）
      try {
        // 使用 Function 包裹并以表达式方式返回
        // 管理端内网使用，输入来源可控；这里用于配置解析
        // eslint-disable-next-line no-new-func
        const fn = new Function(`return ( ${text} )`)
        const v = fn()
        // 仅接受对象或数组，避免意外的可执行代码产生副作用
        if (v !== null && (Array.isArray(v) || typeof v === 'object')) {
          return v
        }
        throw new Error('表达式不是对象或数组')
      } catch (e) {
        throw new Error('无效的 JSON 或对象字面量')
      }
    }

    for (let idx = 0; idx < imageOptionsDraft.value.length; idx++) {
      const txt = imageOptionsDraft.value[idx]
      const key = `imageOption${idx + 1}`
      if (txt && txt.trim()) {
        try {
          const parsed = parseJsonOrObject(txt.trim())
          payload[key] = parsed
        } catch (e: any) {
          ElMessage.error(`第 ${idx + 1} 张图片的模板信息不是有效的 JSON/对象：${e?.message || ''}`)
          return
        }
      } else {
        payload[key] = null
      }
    }
    await updateTemplateGroup2D(currentImageRow.value.id, payload)
    ElMessage.success('已保存图片模板信息')
    imageOptionDialogVisible.value = false
    getList()
  } finally {
    imageOptionSaving.value = false
  }
}

function getImages(row) {
  const urls: string[] = []
  for (let i = 1; i <= 10; i++) {
    const key = `image${i}`
    if (row[key]) urls.push(row[key])
  }
  return urls
}

async function getList() {
  loading.value = true
  try {
    const res = await pageTemplateGroup2D({ page: queryParams.currentPage, pageSize: queryParams.pageSize })
    dataSource.value = res.list || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  isEdit.value = false
  currId.value = null
  dialogVisible.value = true
  dialogTitle.value = '新增模板组'
  form.value = { name: '', description: '', keywords: '' }
  imageItems.value = []
}

function handleEdit(row) {
  isEdit.value = true
  currId.value = row.id
  dialogVisible.value = true
  dialogTitle.value = '编辑模板组'
  form.value = { name: row.name, description: row.description || '', keywords: row.keywords || '' }
  imageItems.value = getImages(row).map(url => ({ url }))
}

function handleDelete(row) {
  ElMessageBox.confirm('确定删除该模板组吗？', '提示', { type: 'warning' })
    .then(async () => {
      await deleteTemplateGroup2D(row.id)
      ElMessage.success('删除成功')
      getList()
    })
    .catch(() => {})
}

function handleFileChange(file) {
  // 仅本地缓存，点击“确定”时再统一上传到COS
  const raw = file?.raw
  if (!raw) return
  if (!raw.type || !raw.type.startsWith('image/')) {
    ElMessage.error('只能选择图片文件')
    return
  }
  const preview = URL.createObjectURL(raw)
  imageItems.value.push({ file: raw, preview })
}

function replaceImage(index: number) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = (input.files && input.files[0]) as File
    if (!file) return
    if (!file.type || !file.type.startsWith('image/')) {
      ElMessage.error('只能选择图片文件')
      return
    }
    const preview = URL.createObjectURL(file)
    const old = imageItems.value[index]
    imageItems.value[index] = { file, preview, url: old?.url }
  }
  input.click()
}

function beforeUploadImage(file: File) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    ElMessage.error('只能选择图片文件')
    return false
  }
  return true
}

function removeImage(index: number) {
  const item = imageItems.value[index]
  if (item?.preview) URL.revokeObjectURL(item.preview)
  imageItems.value.splice(index, 1)
}

const rules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 1, max: 255, message: '长度1-255', trigger: 'blur' }
  ],
  keywords: [
    { max: 500, message: '长度不超过500', trigger: 'blur' }
  ],
  description: [
    { max: 1000, message: '长度不超过1000', trigger: 'blur' }
  ]
}

function fillImages(payload: any, urls: string[]) {
  for (let i = 1; i <= 10; i++) {
    payload[`image${i}`] = urls[i - 1] || ''
  }
}

async function submitForm() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitLoading.value = true
    const payload: any = {
      name: form.value.name,
      description: form.value.description,
      keywords: form.value.keywords,
    }
    // 统一上传：已有url直接使用；有file则上传到COS取url
    const finalUrls: string[] = []
    for (const item of imageItems.value) {
      if (item.url && !item.file) {
        finalUrls.push(item.url)
      } else if (item.file) {
        const res = await uploadToCOS({ file: item.file })
        finalUrls.push(res.url)
      }
      if (finalUrls.length >= 10) break
    }
    fillImages(payload, finalUrls)
    if (isEdit.value && currId.value) {
      await updateTemplateGroup2D(currId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await createTemplateGroup2D(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getList()
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  getList()
})

function dialogClose() {
  submitLoading.value = false
}
</script>

<style scoped>
.images {
  display: flex;
  gap: 8px;
}
.images .img-wrap {
  position: relative;
}
.images .el-image, .images img {
  width: 64px;
  height: 64px;
  object-fit: contain;
  border-radius: 4px;
}
.images.larger img {
  width: 96px;
  height: 96px;
}
.images .img-caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 2px 4px;
  font-size: 12px;
  line-height: 1.2;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  display: flex;
  justify-content: center;
  gap: 4px;
}
.images .img-caption .divider { opacity: .7 }
.uploader {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.thumb {
  width: 100px;
  height: 100px;
  position: relative;
}
.thumb .el-image, .thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
}
.thumb .img-caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 4px 6px;
  font-size: 12px;
  line-height: 1.2;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.image-option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.image-option-grid.vertical { grid-template-columns: 1fr; }
.image-option-item { border: 1px solid var(--el-border-color); border-radius: 6px; padding: 10px; display: grid; grid-template-columns: 260px 1fr; gap: 12px; align-items: start; }
.image-option-item .preview { width: 100%; height: 260px; overflow: hidden; border-radius: 4px; padding: 8px; background: var(--el-fill-color-lighter); }
.image-option-item .preview .el-image { width: 100%; height: 100%; object-fit: contain; }
.image-option-item .details { display: flex; flex-direction: column; gap: 8px; }
.image-option-item .meta { font-size: 12px; color: var(--el-text-color-secondary); display: flex; gap: 12px; }
.image-option-item .json-editor { margin-top: 4px; }
.image-option-body { max-height: 70vh; overflow: auto; padding-right: 6px; }
.thumb .ops {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 6px;
  padding: 6px;
  background: rgba(0,0,0,0.4);
  justify-content: center;
}
</style>


