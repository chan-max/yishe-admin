<script lang="ts" setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import UploadFloderImg from './uploadFloderImg.vue'

const uploadProps = ref({
  name: 'file',
  multiple: true,
  accept: 'image/*',
  action: `http://xxxx.com/api/pictures_upload_image`,
  onChange: (info: any) => {
    console.log(info, '文件上传啦=============')
  },
  onProgress: (progress: any) => {
    console.log(progress, '上传进度啦========')
  },
  onSuccess: (file: any) => {
    console.log(file, '成功啦-==============')
  }
})

// 文件夹上传显示
const showUploadFloder = ref(false)
const openFloderUpload = () => {
  showUploadFloder.value = true
}

function submit() {

}
</script>

<template>
  <el-button @click="openFloderUpload" type=primary>批量替换套图</el-button>
  <!-- 上传弹窗(上传文件夹) -->
  <el-dialog title="批量替换套图" v-model="showUploadFloder" :width="800" align-center>
    <UploadFloderImg v-if="showUploadFloder" :uploadProps="uploadProps" />

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showUploadFloder = false">取消</el-button>
        <el-button type="primary" @click="submit">
          确认替换
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
