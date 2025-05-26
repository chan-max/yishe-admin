<template>
  <div class="multi-image-upload-container">
    <!-- 左侧：图片预览区域 -->
    <div class="image-preview-container">
      <div class="image-preview-list">
        <div v-for="(file, index) in fileList" :key="file.uid" class="image-preview-item">
          <el-image
            :src="usePreview ? file.url : 'empty'"
            alt="preview"
            class="preview-image"
            loading="lazy"
            fit="contain"
          >
            <template #error>
              <div class="w-full h-full flex items-center justify-center">
                <el-icon style="z-index: 0" size="24" color="#999">
                  <PictureFilled />
                </el-icon>
              </div>
            </template>
          </el-image>

          <div class="preview-placeholder">
            <div>
              {{ file.name }}
            </div>
            <div class="pt-2 flex gap-2 flex-wrap" style="overflow: auto">
              <el-tag link round size="small" type="primary">
                {{ (file.size / 1024 / 1024).toFixed(2) + "Mb" }}
              </el-tag>
              <el-tag v-if="file.rename" round size="small" link type="primary">
                重命名: {{ file.rename }}
              </el-tag>
              <!-- <el-tag round size="small" link type="primary">
                比例: {{ file.width + ' x ' + file.height }}
              </el-tag> -->
            </div>
          </div>

          <div class="actions">
            <el-icon
              v-if="file.status !== 'uploading'"
              @click="handleRemove(index)"
              size="20"
            >
              <Close />
            </el-icon>
          </div>
          <!-- 上传状态 -->
          <div v-if="file.status === 'uploading'" class="status uploading">
            <el-icon class="loading-icon">
              <Loading />
            </el-icon>
            上传中...
          </div>
          <div
            v-if="file.status === 'fail'"
            class="status fail"
            @click="handleRetry(index)"
          >
            上传失败，点击重试
          </div>
          <div v-if="file.status === 'success'" class="status success">上传成功</div>
        </div>
      </div>
    </div>

    <div class="operation-container">
      <div class="font-bold py-2" style="color: #bbb; border-bottom: 1px solid #ddd">
        上传路径 : <span style="font-size: 0.8em">{{ currentUploadInfo.path }}</span>
      </div>
      <div class="stats">
        <span>
          选择
          <span class="stats-num" style="color: var(--el-color-primary)">{{
            totalCount
          }}</span>
          张</span
        >
        <span
          >成功
          <span class="stats-num" style="color: var(--el-color-success)">{{
            successCount
          }}</span>
          张</span
        >
        <span
          >失败
          <span class="stats-num" style="color: var(--el-color-danger)">{{
            failCount
          }}</span
          >张</span
        >

        <span
          >上传中
          <span class="stats-num" style="color: var(--el-color-warning)">{{
            loadingCount
          }}</span
          >张</span
        >
      </div>

      <el-progress
        :format="() => `${successCount}/${totalCount}`"
        :text-inside="true"
        :stroke-width="24"
        :percentage="totalCount ? (successCount / totalCount) * 100 : totalCount"
        :striped-flow="someLoading"
        :striped="someLoading"
        :status="totalCount == successCount ? 'success' : 'warning'"
      />

      <div class="local-select">
        <el-upload
          action="#"
          accept="image/*"
          list-type="text"
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          multiple
        >
          <el-button type="primary" plain :icon="UploadFilled">选择图片</el-button>
        </el-upload>
      </div>

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
      <div class="flex items-center gap-2">
        <el-switch
          v-model="usePreview"
          size="small"
          active-text="开启图片预览(预览会占用大量资源)"
        ></el-switch>
        <!-- <el-alert  size="small" type="warning"  description=" " /> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage, ElNotification } from "element-plus";
import {
  Plus,
  Close,
  Loading,
  Upload,
  UploadFilled,
  PictureFilled,
  TopRight,
} from "@element-plus/icons-vue";
import { useDebounceFn } from "@vueuse/core";
import { throttleLoop, throttleLoopWithRAF } from "@/common/render";
import { getMaterialMaxOrder, uploadMaterialFile } from "@/api/material";
import { useUserStore } from "@/store/modules/user";
import { VxeRadioGroup } from "vxe-pc-ui";
import { getImageDimensionsViaImageBitmap } from "@/common/img";
import { uploadToCOS } from "@/api/cos";

const props = defineProps({
  currentUploadInfo: {
    default: {},
  },
});

const userStore = useUserStore();

// 文件列表
const fileList = ref([]);

const emits = defineEmits(["single-file-uploaded"]);

enum UploadStatus {
  Waiting = "waiting",
  Uploading = "uploading",
  Success = "success",
  Fail = "fail",
}

const usePreview = ref(true);

// 统计信息
const totalCount = computed(() => fileList.value.length);
const successCount = computed(
  () => fileList.value.filter((file) => file.status === "success").length
);

const loadingCount = computed(
  () => fileList.value.filter((file) => file.status === "uploading").length
);
const failCount = computed(
  () => fileList.value.filter((file) => file.status === "fail").length
);

// 任意图片正在上传
const someLoading = computed(() => {
  return fileList.value.some((item) => item.status == "uploading");
});

const handleFileChange = async (file) => {
  const url = URL.createObjectURL(file.raw); // 生成 Blob URL

  // const info = await getImageDimensionsViaImageBitmap(file.raw)
  const info = {
    width: 0,
    height: 0,
  };

  if (file.size > 10 * 1024 * 1024) {
    return ElMessage.warning(`图片${file.name}大于10mb`);
  }

  fileList.value.push({
    uid: file.uid,
    name: file.name,
    url, // 使用 Blob URL
    size: file.size,
    raw: file.raw,
    width: info.width,
    height: info.height,
    rename: "", // 该图片的重命名
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
  await uploadFile(file);
};

// 上传所有图片
const handleUpload = async () => {

  if (fileList.value.length && successCount.value == fileList.value.length) {
    return ElNotification.success("图片都上传成功了，请再选择新素材吧~");
  }


  for (let i = 0; i < fileList.value.length; i++) {
    const file = fileList.value[i];
    if (file.status === "waiting" || file.status === "fail") {
      file.status = "uploading";
      //   await uploadFile(file, i);
      uploadFile(file,);
    }
  }
};

// 清空所有图片
const handleClear = () => {
  if (fileList.value.length && failCount.value) {
    return ElNotification.error("有上传失败的图片，请上传成功后再清空");
  }
  fileList.value = [];
};

// 上传单个文件
const uploadFile = async (file) => {
  try {
    const cos = await uploadToCOS({
      file:file.raw,
    });
    const { key, url } = cos;
    await uploadMaterialFile({
      url,
      thumbnail: cos,
    });
    file.status = "success";
    emits("single-file-uploaded");
  } catch (error) {
    file.status = "fail";
    ElMessage.error(`文件 ${file.name} 上传失败`);
  }
};
</script>

<style scoped>
.multi-image-upload-container {
  display: flex;
  height: 100%;
  /* 设置高度为 100% */
  width: 100%;
  /* 设置宽度为 100% */
  gap: 20px;
  /* 左右两侧间距 */
}

.image-preview-container {
  flex: 1;
  overflow-y: auto;
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
  width: 160px;
  height: 160px;
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

  &:hover {
    transform: scale(1.1);
  }
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
  cursor: pointer;
  background: rgba(255, 0, 0, 0.7);

  &:hover {
    transform: scale(1.02);
  }
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
  gap: 16px;
  /* 操作按钮间距 */
}

.stats {
  justify-content: space-around;
  display: flex;
  gap: 12px;
  padding: 16px 0;
}

.stats span {
  font-size: 11px;
  color: #bbb;
  font-weight: bold;
}

.stats-num {
  font-size: 2em !important;
}

.preview-placeholder {
  top: 0;
  left: 0px;
  padding: 12px;
  position: absolute;
  font-size: 11px;
  width: 100%;
  height: 100%;
  overflow: auto;
  text-overflow: ellipsis;
  display: block;
}
</style>

<style lang="less">
.local-select {
  .el-upload,
  .el-button {
    width: 100%;
  }
}
</style>
