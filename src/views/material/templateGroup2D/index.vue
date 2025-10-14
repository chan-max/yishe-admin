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
      title="编辑图片模板信息"
      fullscreen
    >
      <div v-if="currentImageRow" class="image-option-body">
        <div class="image-option-grid vertical">
          <div
            class="image-option-item"
            v-for="(url, index) in getImages(currentImageRow)"
            :key="index"
          >
            <div class="preview" :ref="el => (previewRefs[index] = el)" :style="getPreviewBoxStyle(url)">
              <el-image :src="url" fit="contain" @load="() => handleImageLoaded(url)" />
              <div class="overlay-block" :style="getOverlayStyle(url, index)"></div>
            </div>
            <div class="details">
              <div class="meta">
                <div class="line">尺寸：<span>{{ imageMetaMap[url]?.w || '-' }}×{{ imageMetaMap[url]?.h || '-' }}</span></div>
                <div class="line">比例：<span>{{ imageMetaMap[url]?.ratio || '-' }}</span></div>
              </div>
              <div class="config-editor">
                <!-- 手动配置 -->
                <div class="manual-controls">
                  <h4>手动配置</h4>
                  <!-- 位置控制 -->
                  <div class="control-group">
                    <label>位置 (左上角为原点，单位: 像素):</label>
                        <div class="position-controls">
                          <div class="control-item">
                            <span>X:</span>
                            <el-slider
                              v-model="manualConfigs[index].position.x"
                              :min="0"
                              :max="imageMetaMap[url]?.w ? Math.floor(imageMetaMap[url].w) : 2000"
                              :step="1"
                              show-input
                              @change="onManualConfigChange(index)"
                            />
                          </div>
                          <div class="control-item">
                            <span>Y:</span>
                            <el-slider
                              v-model="manualConfigs[index].position.y"
                              :min="0"
                              :max="imageMetaMap[url]?.h ? Math.floor(imageMetaMap[url].h) : 2000"
                              :step="1"
                              show-input
                              @change="onManualConfigChange(index)"
                            />
                          </div>
                        </div>
                  </div>

                  <!-- 尺寸控制 -->
                  <div class="control-group">
                    <label>尺寸 (宽度百分比%):</label>
                    <div class="control-item">
                      <span>宽度%:</span>
                      <el-slider
                        v-model="manualConfigs[index].size.widthPercent"
                        :min="1"
                        :max="100"
                        :step="1"
                        show-input
                        @change="onManualConfigChange(index)"
                      />
                    </div>
                  </div>

                  <!-- 透明度控制 -->
                  <div class="control-group">
                    <label>透明度:</label>
                    <div class="control-item">
                      <span>透明度%:</span>
                      <el-slider
                        v-model="manualConfigs[index].opacity"
                        :min="0"
                        :max="100"
                        :step="1"
                        show-input
                        @change="onManualConfigChange(index)"
                      />
                    </div>
                  </div>

                  <!-- 保持原图开关 -->
                  <div class="control-group">
                    <label>保持原图:</label>
                    <div class="control-item">
                      <el-switch
                        v-model="manualConfigs[index].keepOriginal"
                        @change="onManualConfigChange(index)"
                      />
                      <span style="margin-left: 8px; font-size: 12px; color: var(--el-text-color-secondary);">
                        开启时不进行图片组合，直接使用模板原图
                      </span>
                    </div>
                  </div>

                </div>

                <!-- JSON配置 -->
                <div class="json-editor">
                  <h4>JSON配置</h4>
                  <el-input
                    v-model="imageOptionsDraft[index]"
                    type="textarea"
                    :rows="6"
                    :placeholder="jsonPlaceholder"
                    @input="onJsonConfigChange(index)"
                  />
                </div>
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
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { uploadToCOS } from '@/api/cos'
import { pageTemplateGroup2D, createTemplateGroup2D, updateTemplateGroup2D, deleteTemplateGroup2D } from '@/api/templateGroup2D'
import { commonGridOptions } from '@/common/table'

const queryParams = reactive({ currentPage: 1, pageSize: 20 })
const jsonPlaceholder = `请输入JSON配置，例如：
{
  "position": { "x": 0, "y": 0 },
  "size": { "widthPercent": 30 },
  "opacity": 100,
  "keepOriginal": false
}

参数说明：
• position: { x, y } - 素材左上角坐标(像素)，0,0表示左上角
• size: { widthPercent: 1-100 } - 素材宽度占模板宽度的百分比
• opacity: 0-100 - 素材透明度百分比，100表示完全不透明
• keepOriginal: true/false - 是否保持原图，true时直接使用模板原图，不进行图片组合处理`

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
const manualConfigs = ref<any[]>([])
const previewRefs = ref<any[]>([])
const overlayTick = ref(0)

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
      if (val === undefined || val === null) return getDefaultImageOption()
      // 如果是字符串，直接展示原始字符串，避免出现被加上引号的情况
      if (typeof val === 'string') return val
      // 对象/数组等再进行格式化
      return JSON.stringify(val, null, 2)
    } catch (e) {
      return getDefaultImageOption()
    }
  })
  
  // 初始化手动配置
  manualConfigs.value = urls.map((_, idx) => {
    const key = `imageOption${idx + 1}`
    const val = row[key]
    try {
      if (val === undefined || val === null) return getDefaultManualConfig()
      if (typeof val === 'string') {
        try {
          return JSON.parse(val)
        } catch {
          return getDefaultManualConfig()
        }
      }
      return val
    } catch (e) {
      return getDefaultManualConfig()
    }
  })
  
  imageOptionDialogVisible.value = true
  // 等待渲染，初始化元数据并强制刷新一次覆盖块
  nextTick(() => {
    urls.forEach((u) => ensureImageMeta(u))
    overlayTick.value++
  })
}

function getDefaultImageOption() {
  return JSON.stringify({
    position: { x: 0, y: 0 },
    size: { widthPercent: 30 },
    opacity: 100,
    keepOriginal: false
  }, null, 2)
}

function getDefaultManualConfig() {
  return {
    position: { x: 0, y: 0 },
    size: { widthPercent: 30 },
    opacity: 100,
    keepOriginal: false
  }
}

// 手动配置变化时同步到JSON
function onManualConfigChange(index: number) {
  const config = manualConfigs.value[index]
  if (config) {
    imageOptionsDraft.value[index] = JSON.stringify(config, null, 2)
  }
}

// JSON配置变化时同步到手动配置
function onJsonConfigChange(index: number) {
  try {
    const config = JSON.parse(imageOptionsDraft.value[index])
    manualConfigs.value[index] = config
  } catch (e) {
    // JSON解析失败时保持手动配置不变
  }
}

// 计算左侧缩略图上的展示方块样式（仅展示，无交互）
function getOverlayStyle(url: string, index: number) {
  // 引入一个无用读取以触发响应式刷新
  void overlayTick.value
  const meta = imageMetaMap[url]
  const preview = previewRefs.value[index]
  const config = manualConfigs.value[index]
  if (!meta || !preview || !config) return { display: 'none' }

  const imgEl: HTMLImageElement | null = preview.querySelector('img')
  if (!imgEl) return { display: 'none' }

  // 预览容器尺寸
  const containerRect = preview.getBoundingClientRect()
  const imgRect = imgEl.getBoundingClientRect()

  // 图片在容器中的位置与显示尺寸
  const imgLeft = imgRect.left - containerRect.left
  const imgTop = imgRect.top - containerRect.top
  const imgWidth = imgRect.width
  const imgHeight = imgRect.height

  // 将真实坐标/尺寸映射为显示坐标/尺寸
  const scaleX = imgWidth / (meta.w || 1)
  const scaleY = imgHeight / (meta.h || 1)

  // 位置（真实像素，左上角为原点），映射到显示坐标
  let posX = imgLeft + (config.position?.x || 0) * scaleX
  let posY = imgTop + (config.position?.y || 0) * scaleY

  // 尺寸：使用宽度百分比（相对于模板宽度）
  let realSize = 0
  const sizeCfg = config.size || {}
  const widthPercent = typeof sizeCfg.widthPercent === 'number' ? sizeCfg.widthPercent : 30
  realSize = Math.max(1, Math.min(100, widthPercent)) / 100 * meta.w

  const displaySize = realSize * Math.min(scaleX, scaleY)

  // 约束左上角不超出模板图边界
  const left = Math.max(imgLeft, Math.min(imgLeft + imgWidth - displaySize, posX))
  const top = Math.max(imgTop, Math.min(imgTop + imgHeight - displaySize, posY))

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${displaySize}px`,
    height: `${displaySize}px`,
    display: 'block'
  }
}

// 根据图片原始宽高比，动态设置预览容器尺寸，避免出现额外留白
function getPreviewBoxStyle(url: string) {
  const meta = imageMetaMap[url]
  if (!meta || !meta.w || !meta.h) return {}
  // 使用 CSS aspect-ratio 让容器完全按图片比例自适应，无额外空白
  const ratio = meta.w / meta.h
  return { aspectRatio: `${ratio}`, width: '100%' }
}

function handleImageLoaded(url: string) {
  ensureImageMeta(url)
  // 图片加载后再强制刷新一次覆盖块
  overlayTick.value++
}

// 已废弃：尺寸类型切换（改为使用 widthPercent），保留空函数防止引用
function onSizeTypeChange(_index: number) {}







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
.image-option-item { 
  border: 1px solid var(--el-border-color); 
  border-radius: 6px; 
  padding: 20px; 
  display: grid; 
  grid-template-columns: 350px 1fr; 
  gap: 24px; 
  align-items: start; 
  margin-bottom: 20px;
}
.image-option-item .preview { 
  width: 100%; 
  /* height 由 aspect-ratio 决定，避免空白 */
  overflow: hidden; 
  border-radius: 4px; 
  padding: 0; 
  background: var(--el-fill-color-lighter); 
}
.image-option-item .preview .el-image { width: 100%; height: 100%; object-fit: contain; display: block; }
.image-option-item .preview { position: relative; }
.overlay-block {
  position: absolute;
  border: 2px dashed #409eff;
  background: rgba(64,158,255,0.15);
  pointer-events: none;
  border-radius: 4px;
  /* 边框风格（用阴影画线，无模糊、无扩散） */
  box-shadow:
    0 -2px 0 0 rgba(255, 200, 0, 0.95),
    -2px 0 0 0 rgba(255, 200, 0, 0.95);
}
.image-option-item .details { display: flex; flex-direction: column; gap: 8px; }
.image-option-item .meta { font-size: 12px; color: var(--el-text-color-secondary); display: flex; gap: 12px; }
.image-option-item .config-editor { margin-top: 4px; }
.image-option-body { 
  max-height: calc(100vh - 120px); 
  overflow: auto; 
  padding-right: 6px; 
}

.config-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-editor h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 8px;
}

.manual-controls {
  padding: 12px 0;
}

.control-group {
  margin-bottom: 16px;
}

.control-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.position-controls {
  display: flex;
  gap: 16px;
}

.control-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-item span {
  min-width: 20px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.fixed-size-controls {
  display: flex;
  gap: 12px;
}

.fixed-size-controls > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fixed-size-controls span {
  min-width: 40px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

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


