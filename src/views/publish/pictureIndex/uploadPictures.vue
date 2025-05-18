<template>
  <div>
    <!-- el-upload 组件 -->
    <el-upload
      action="#" 
      list-type="picture-card" 
      :on-change="handleChange" 
      :auto-upload="false" 
      multiple 
      :limit="10" 
      :on-exceed="handleExceed"
    >
      <el-icon><Plus /></el-icon>
    </el-upload>

    <!-- 手动上传按钮 -->
    <el-button type="primary" @click="submitUpload">上传文件</el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

// 存储上传的文件列表
const fileList = ref([]);

// 文件变化时的回调
const handleChange = (file, files) => {
  fileList.value = files; // 更新文件列表
};

// 超出文件限制时的回调
const handleExceed = () => {
  ElMessage.warning('最多只能上传 10 个文件');
};

// 手动上传文件
const submitUpload = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择文件');
    return;
  }

  const formData = new FormData(); // 创建 FormData 对象
  fileList.value.forEach((file) => {
    formData.append('files', file.raw); // 将文件添加到 FormData
  });

  try {
    // 调用上传接口
    const response = await uploadFiles(formData);
    ElMessage.success('上传成功');
    console.log('上传结果:', response);
  } catch (error) {
    ElMessage.error('上传失败');
    console.error('上传失败:', error);
  }
};

// 模拟上传接口
const uploadFiles = async (formData) => {
  // 这里替换为你的上传接口
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟接口返回
      resolve({ code: 200, message: '上传成功' });
    }, 1000);
  });
};
</script>

<style scoped>
/* 自定义样式 */
</style>