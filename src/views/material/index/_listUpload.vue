<template>
  <div class="multi-image-upload-container">
    <!-- 左侧：图片预览区域 -->
    <div class="image-preview-container">
      <div class="image-preview-list">
        <div v-for="(file, index) in fileList" :key="file.uid" class="image-preview-item">
          <img :src="file.url" alt="preview" class="preview-image" />
          <div class="actions">
            <el-icon v-if="file.status !== 'uploading'" @click="handleRemove(index)">
              <Close />
            </el-icon>
            <span v-if="file.status === 'fail'" class="retry" @click="handleRetry(index)"
              >重试</span
            >
          </div>
          <!-- 上传状态 -->
          <div v-if="file.status === 'uploading'" class="status uploading">
            <el-icon class="loading-icon"><Loading /></el-icon>
            上传中...
          </div>
          <div v-if="file.status === 'fail'" class="status fail">上传失败</div>
          <div v-if="file.status === 'success'" class="status success">上传成功</div>
        </div>
      </div>
    </div>


    <div class="operation-container">
      
      <div class="stats">
        <span>共选择了 {{ totalCount }} 张图片</span>
        <span>成功 {{ successCount }} 张</span>
        <span>失败 {{ failCount }} 张</span>
      </div>

   
      <el-upload
        action="#"
        list-type="text"
        :auto-upload="false"
        :on-change="handleFileChange"
        :show-file-list="false"
        multiple
      >
        <el-button type="primary" plain>选择图片</el-button>
      </el-upload>

      <div>
        <el-button
          class="w-full"
          type="primary"
          @click="handleUpload"
          :disabled="totalCount === 0"
        >
          上传
        </el-button>
      </div>

      <!-- 清空按钮 -->
      <div>
        <el-button
          class="w-full"
          type="danger"
          @click="handleClear"
          :disabled="totalCount === 0"
        >
          清空
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Close, Loading } from "@element-plus/icons-vue";

// 文件列表
const fileList = ref([]);

// 统计信息
const totalCount = computed(() => fileList.value.length);
const successCount = computed(
  () => fileList.value.filter((file) => file.status === "success").length
);
const failCount = computed(
  () => fileList.value.filter((file) => file.status === "fail").length
);

// 处理文件选择
// const handleFileChange = (file) => {
//   const reader = new FileReader();
//   reader.onload = (e) => {
//     fileList.value.push({
//       uid: file.uid,
//       name: file.name,
//       url: e.target.result,
//       raw: file.raw,
//       status: "waiting", // waiting, uploading, success, fail
//     });
//   };
//   reader.readAsDataURL(file.raw);
// };


const handleFileChange = (file) => {
  // const url = URL.createObjectURL(file.raw); // 生成 Blob URL
  fileList.value.push({
    uid: file.uid,
    name: file.name,
    // url, // 使用 Blob URL
    // raw: file.raw,
    status: "waiting", // waiting, uploading, success, fail
  });
};

// 移除图片
const handleRemove = (index) => {
  fileList.value.splice(index, 1);
};

// 重试上传
const handleRetry = async (index) => {
  const file = fileList.value[index];
  file.status = "uploading";
  await uploadFile(file, index);
};

// 上传所有图片
const handleUpload = async () => {
  for (let i = 0; i < fileList.value.length; i++) {
    const file = fileList.value[i];
    if (file.status === "waiting" || file.status === "fail") {
      file.status = "uploading";
      //   await uploadFile(file, i);
      uploadFile(file, i);
    }
  }
};

// 清空所有图片
const handleClear = () => {
  fileList.value = [];
};

// 上传单个文件
const uploadFile = async (file, index) => {
  try {
    // 模拟上传接口
    const response = await mockUploadApi(file.raw);
    if (response.success) {
      file.status = "success";
    } else {
      file.status = "fail";
    }
  } catch (error) {
    file.status = "fail";
    ElMessage.error(`文件 ${file.name} 上传失败`);
  }
};

// 模拟上传接口
const mockUploadApi = (file) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.2) {
        resolve({ success: true });
      } else {
        reject(new Error("上传失败"));
      }
    }, 1000);
  });
};
</script>

<style scoped>
.multi-image-upload-container {
  display: flex;
  height: 100%; /* 设置高度为 100% */
  width: 100%; /* 设置宽度为 100% */
  gap: 20px; /* 左右两侧间距 */
}

.image-preview-container {
  flex: 1; /* 左侧占 3 份 */
  overflow-y: auto; /* 图片过多时出现滚动条 */
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: start;
  gap: 10px;
}

.image-preview-item {
  position: relative;
  width: 100px;
  height: 100px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.actions {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  gap: 5px;
  cursor: pointer;
}

.actions .el-icon {
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  padding: 4px;
}

.retry {
  color: #fff;
  background: rgba(255, 0, 0, 0.7);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.status {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  text-align: center;
  font-size: 12px;
  padding: 4px;
}

.uploading {
  background: rgba(0, 0, 0, 0.7);
}

.fail {
  background: rgba(255, 0, 0, 0.7);
}

.success {
  background: rgba(0, 128, 0, 0.7);
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.operation-container {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px; /* 操作按钮间距 */
}

.stats {
  font-size: 14px;
  color: #666;
}

.stats span {
  display: block;
  margin-bottom: 8px;
}
</style>
