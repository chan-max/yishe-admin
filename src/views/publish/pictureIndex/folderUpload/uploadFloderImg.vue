<script lang="ts" setup>
import { ref } from 'vue'
// import $http from '@/http/index.ts'
import { ElMessage } from 'element-plus'
const props = defineProps(['uploadProps'])

const fileUploadRef = ref()
const fileUploadFloderRef = ref()

const isUploading = ref(false) // 是否在上传中

const uploadedList = ref<any[]>([])

// 拖放进入目标区域
const handleDragOver = event => {
  event.preventDefault()
}

// 拖拽放置
const handleDrop = async event => {
  event.preventDefault()
  const files = []
  const promises: any[] = []
  for (const item of event.dataTransfer.items) {
    const entry: any = item.webkitGetAsEntry()
    console.log('[ entry ] >', entry)
    promises.push(readFiles(entry))
  }
  const resultFilesArrays = await Promise.all(promises)
  const allFiles = resultFilesArrays.flat()

  console.log('[ All files ] >', allFiles)
  handleUploadToServer(allFiles)
}

/*请求上传到服务器*/
const handleUploadToServer = (files: any[]) => {
  isUploading.value = true
  Promise.all(
    files.map((item: any) => {
      const formData = new FormData()
      formData.append('file', item, item.name)
      // return $http.request({
      //   method: 'post',
      //   url: `http://ddddddd.com/api/pictures_upload_image`,
      //   headers: { 'Content-Type': 'multipart/form-data' },
      //   data: formData
      // })
    })
  )
    .finally(() => (isUploading.value = false))
    .then(() => {
      uploadedList.value.unshift(...files)
      ElMessage.success('上传成功')
    })
    .catch(() => {
      ElMessage.error('上传失败')
    })
}

const readFiles = async (item: any) => {
  if (item.isDirectory) {
    // 是一个文件夹
    const directoryReader = item.createReader()
    // readEntries是一个异步方法
    const entries: any[] = await new Promise((resolve, reject) => {
      directoryReader.readEntries(resolve, reject)
    })
    let files = []
    for (const entry of entries) {
      const resultFiles: any = await readFiles(entry)
      files = files.concat(resultFiles)
    }
    return files
  } else {
    // file也是一个异步方法
    const file = await new Promise((resolve, reject) => {
      item.file(resolve, reject)
    })
    return [file]
  }
}

/*文件上传input*/
const toUploadFile = () => {
  fileUploadRef.value.click()
}

/*文件夹上传input*/
const toUploadFloder = () => {
  fileUploadFloderRef.value.click()
}

/*选择文件改变*/
const handleFileChange = (e: any) => {
  debugger
  handleUploadToServer(Array.from(e.target.files))
}

/*文件夹目录上传*/
const handleFloderChange = (e: any) => {
  debugger
  handleUploadToServer(Array.from(e.target.files))
}

/*删除已上传列表*/
const handleDelete = (index: number) => {
  uploadedList.value.splice(index, 1)
}
</script>

<template>
  <div class="drag-box" @dragover="handleDragOver" @dragleave="handleDragOver" @drop="handleDrop">
    <div class="div-text">
      <!-- <div class="drag-tip">
        拖拽文件至此区域
        <span class="click-txt" @click="toUploadFile">点击上传</span>
      </div> -->
      <div class="btn-wrap">
        <!-- <el-button @click="toUploadFile">上传文件</el-button> -->

        <!-- <input
          :style="{ display: 'none' }"
          type="file"
          ref="fileUploadRef"
          @change="handleFileChange"
          multiple
        /> -->
        <el-button @click="toUploadFloder">上传文件夹</el-button>
        <input :style="{ display: 'none' }" type="file" ref="fileUploadFloderRef" @change="handleFloderChange"
          webkitdirectory multiple />
      </div>
    </div>
    <!-- <div class="div-tip">支持单次或批量上传,支持文件夹上传</div> -->

    <!-- 已上传列表展示 -->
    <div class="uploaded-list-wrap">
      <div class="uploaded-item" v-for="(item, index) in uploadedList" :key="index">
        <div class="text-content">{{ item.name }}</div>
        <svg @click="handleDelete(index)" t="1702689838509" class="icon delete-icon" viewBox="0 0 1024 1024"
          version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3620" width="32" height="32">
          <path
            d="M511.998977 961.610044c-248.306272 0-449.607998-201.307865-449.607998-449.614138S263.692704 62.389956 511.998977 62.389956c248.364601 0 449.610044 201.299679 449.610044 449.606974S760.363577 961.610044 511.998977 961.610044L511.998977 961.610044zM718.186989 380.921639c8.457626-8.462742 8.457626-22.202675 0-30.658254l-45.927005-45.871747c-8.459672-8.459672-22.138206-8.459672-30.599925 0L511.603981 434.44874 381.546879 304.391638c-8.459672-8.459672-22.1423-8.459672-30.599925 0l-45.927005 45.871747c-8.457626 8.455579-8.457626 22.195511 0 30.658254l130.057101 130.053008L305.019948 641.031748c-8.457626 8.455579-8.457626 22.140253 0 30.599925L350.946954 717.555609c8.457626 8.404414 22.140253 8.404414 30.599925 0l130.057101-130.057101L641.661082 717.555609c8.461719 8.404414 22.140253 8.404414 30.599925 0l45.927005-45.922912c8.457626-8.459672 8.457626-22.144346 0-30.599925L588.129888 510.97567 718.186989 380.921639 718.186989 380.921639z"
            fill="#d81e06" p-id="3621"></path>
        </svg>
      </div>
    </div>

    <!-- 上传中进度 -->
    <div class="progress-bar" v-if="isUploading">
      <el-progress :percentage="100" :format="() => ''" :indeterminate="true" />
    </div>
  </div>
</template>

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
    padding: 16px;
    max-height: 500px;
    overflow-y: auto;

    .uploaded-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      margin-bottom: 3px;

      .text-content {
        width: 80%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .icon {
        width: 25px;
        height: 25px;
      }

      .success-icon {
        display: block;
      }

      .delete-icon {
        display: none;
      }


    }
  }
}

.div-text {
  width: 100%;
  height: 50px;
  border: 1px dashed #00b7ee;
  border-radius: 10px;
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
