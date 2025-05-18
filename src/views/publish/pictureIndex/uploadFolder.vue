<template>
  <div>
    <!-- 批量替换套图按钮 -->
    <el-button @click="openFloderUpload" type="primary">批量替换套图</el-button>

    <!-- 上传弹窗 -->
    <el-dialog title="批量替换套图" v-model="showUploadFloder" :width="720" align-center>
      <!-- 上传区域 -->
      <el-alert style="margin-bottom: 12px;" title="上传提示" description="选择的文件夹要保证下一级只有文件夹，并且子文件夹名称与素材名称对应，子文件夹中应只包含图片"
        type="warning" show-icon :closable="false" />
      <div class="drag-box" @dragover="handleDragOver" @dragleave="handleDragOver" @drop="handleDrop">
        <div class="div-text">
          <div class="btn-wrap">
            <el-button @click="toUploadFloder" link :icon="FolderOpened" type="primary">选择文件夹</el-button>
            <input :style="{ display: 'none' }" type="file" ref="fileUploadFloderRef" @change="handleFloderChange"
              webkitdirectory multiple />
          </div>
        </div>

        <!-- 已上传列表展示 -->
        <div class="uploaded-list-wrap">
          <div class="uploaded-item" v-for="(item, index) in uploadedList" :key="index"
            :class="{ ['error-status']: item.pathChunks !== 1 }">
            <!-- 图片预览 -->
            <div class="preview">
              <img v-if="item?.previewUrl" :src="item.previewUrl" alt="preview" class="preview-img" />
              <div v-else class="file-icon">
                <el-icon>
                  <Document />
                </el-icon>
              </div>
            </div>
            <!-- 文件信息 -->
            <div class="file-info">
              <div style="font-size: 13px;">{{ item.name }}</div>
              <div style="font-size: 11px;">{{ item.pathChunks }}

              </div>
            </div>

            <!-- 删除按钮 -->
            <el-button @click="handleDelete(index)" link type="danger" :icon="DeleteFilled"> </el-button>
          </div>
        </div>

        <!-- 上传中进度 -->
        <div class="progress-bar" v-if="isUploading">
          <el-progress :percentage="100" :format="() => ''" :indeterminate="true" />
        </div>
      </div>

      <!-- 弹窗底部按钮 -->
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showUploadFloder = false">取消</el-button>
          <el-button type="primary" @click="submit">确认替换</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ElMessage, ElProgress } from 'element-plus'
import { DeleteFilled, FolderOpened, Document } from '@element-plus/icons-vue'

// 上传弹窗显示状态
const showUploadFloder = ref(false)

// 打开上传弹窗
const openFloderUpload = () => {
  showUploadFloder.value = true
}

// 上传相关逻辑
const fileUploadFloderRef = ref()
const isUploading = ref(false) // 是否在上传中
const uploadedList = ref<any[]>([]) // 已上传文件列表

// 拖放进入目标区域
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

// 拖拽放置
const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  const files: File[] = []
  const promises: Promise<File[]>[] = []

  for (const item of event.dataTransfer!.items) {
    const entry = item.webkitGetAsEntry()
    if (entry) {
      promises.push(readFiles(entry))
    }
  }

  const resultFilesArrays = await Promise.all(promises)
  const allFiles = resultFilesArrays.flat()
  handleFiles(allFiles)
}

// 读取文件或文件夹
const readFiles = async (entry: any, path: string = ''): Promise<File[]> => {
  if (entry.isDirectory) {
    const directoryReader = entry.createReader()
    const entries: any[] = await new Promise((resolve, reject) => {
      directoryReader.readEntries(resolve, reject)
    })
    let files: File[] = []
    for (const subEntry of entries) {
      const resultFiles = await readFiles(subEntry, `${path}/${entry.name}`)
      files = files.concat(resultFiles)
    }
    return files
  } else {
    const file: File = await new Promise((resolve, reject) => {
      entry.file(resolve, reject)
    })
    // 添加路径信息
    file.path = `${path}/${entry.name}`
    return [file]
  }
}

// 处理文件
const handleFiles = (files: File[]) => {
  const filesWithPreview = files.map(file => {

    return {
      ...file,
      name: file.name,
      size: file.size,
      pathChunks: file.webkitRelativePath.split('/'),
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }
  })

  uploadedList.value.unshift(...filesWithPreview)
}

// 文件夹上传
const toUploadFloder = () => {
  fileUploadFloderRef.value.click()
}

// 文件夹选择变化
const handleFloderChange = (event: Event) => {
  const files = Array.from((event.target as HTMLInputElement).files || [])
  handleFiles(files)
}

// 删除已上传文件
const handleDelete = (index: number) => {
  uploadedList.value.splice(index, 1)
}

// 提交替换
const submit = () => {
  isUploading.value = true

  // 模拟上传参数
  const formDataList = uploadedList.value.map(file => {
    const formData = new FormData()
    formData.append('file', file, file.name)
    return formData
  })

  // 打印模拟的上传参数
  console.log('模拟上传参数:', formDataList)

  // 模拟上传过程
  setTimeout(() => {
    isUploading.value = false
    ElMessage.success('上传成功')
    showUploadFloder.value = false
  }, 2000)
}
</script>

<style lang="scss" scoped>
.drag-box {
  position: relative;

  .progress-bar {
    position: absolute;
    z-index: 100;
    width: 100%;
    top: 0;
    left: 0px;
    right: 0px;
    bottom: -5px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.8);

    :deep(.el-progress.el-progress--line) {
      width: 100%;
      margin-left: 10px;
    }
  }

  .uploaded-list-wrap {
    max-height: 500px;
    overflow-y: auto;

    .error-status{
      border:1px solid  var(--el-color-danger);
      background-color: rgba(255,0,0,.1);
    }

    .uploaded-item {

      display: flex;
      gap: 12px;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      margin: 8px;
      padding: 8px;
      border-radius: 6px;
      
      .preview {
        width: 50px;
        height: 50px;
        margin-right: 10px;
        flex-shrink: 0;

        .preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 4px;

        }

        .file-icon {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
      }

      .file-info {
        flex: 1;
        margin-right: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
    }
  }
}

.div-text {
  width: 100%;
  height: 50px;
  border: 1px dashed var(--el-color-primary);
  border-radius: 10px;
  margin-bottom: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 18px;

  .click-txt {
    color: #00b7ee;
    cursor: pointer;
  }
}
</style>