<template>
  <div>
    <el-upload action="#" :auto-upload="false" :limit="1" accept="image/*" :on-change="handleChange"
      :before-upload="beforeUpload" :on-exceed="handleExceed" :file-list="fileList" :show-file-list="false">
      <el-button type="primary" v-if="!imageUrl">选择图片</el-button>
    </el-upload>

    <!-- 图片预览 -->
    <div v-if="imageUrl" class="image-preview">
      <img :src="imageUrl" alt="预览图片" class="preview-image" />
      <el-button type="danger" @click="clearImage">清除图片</el-button>
    </div>

    <!-- 提交按钮 -->
    <!-- <el-button class="mt-4 w-full" type="success" @click="submitUpload" v-if="imageUrl">提交上传</el-button> -->
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { uploadMaterial } from '@/api/material';

const fileList = ref([]); // 文件列表
const imageUrl = ref(''); // 图片预览地址

const emits = defineEmits(['image-uploaded'])

const props = defineProps({
  id: {
  }
})

// 文件选择变化时的回调
const handleChange = async (file) => {
  // 检查文件类型和大小
  if (!beforeUpload(file)) {
    return;
  }

  // 生成图片预览地址
  imageUrl.value = URL.createObjectURL(file.raw);

  // 更新文件列表
  fileList.value = [file];
  await submitUpload()
  fileList.value = []
  emits('image-uploaded')
};

// 文件上传前的校验
const beforeUpload = (file) => {
  const isLt10M = file.size / 1024 / 1024 < 10;
  const isFileNameValid = file.name.length <= 200;
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过10MB');
    return false;
  }
  if (!isFileNameValid) {
    ElMessage.error('文件名长度不能超过200个字符');
    return false;
  }

  return true;
};

// 文件超出数量限制时的回调
const handleExceed = () => {
  ElMessage.warning('只能上传一张图片');
};

// 清除图片
const clearImage = () => {
  imageUrl.value = '';
  fileList.value = [];
};

// 提交上传
const submitUpload = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择图片');
    return;
  }

  const file = fileList.value[0].raw;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('publishId', props.id)

  try {
    await uploadMaterial(formData)
    fileList.value = []
  } catch (e) {
    ElMessage.error('素材图上传失败')
  }
};
</script>

<style scoped>
.image-preview {
  margin-top: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>