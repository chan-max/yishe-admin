<template>
  <div class="multi-image-upload-container">
    <div
      class="image-preview-container"
      :class="{ 'is-drag-over': isDragOver }"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDropFiles"
    >
      <div v-if="fileList.length" class="image-preview-list">
        <div v-for="(file, index) in fileList" :key="file.uid" class="image-preview-item">
          <div class="preview-media">
            <el-image
              :src="usePreview ? file.url : ''"
              alt="preview"
              :lazy="true"
              class="preview-image"
              loading="lazy"
              fit="contain"
            >
              <template #error>
                <div class="image-error-state">
                  <el-icon size="28" color="var(--el-text-color-secondary)">
                    <PictureFilled />
                  </el-icon>
                  <span>{{ usePreview ? "预览加载失败" : "已关闭图片预览" }}</span>
                </div>
              </template>
            </el-image>

            <div class="actions">
              <el-icon v-if="file.status !== 'uploading'" size="18" @click="handleRemove(index)">
                <Close />
              </el-icon>
            </div>

            <div v-if="file.status === 'uploading'" class="status uploading">
              <el-icon class="loading-icon">
                <Loading />
              </el-icon>
              上传中...
            </div>
            <div v-if="file.status === 'fail'" class="status fail" @click="handleRetry(index)">
              上传失败，点击重试
            </div>
            <div v-if="file.status === 'success'" class="status success">上传成功</div>
          </div>

          <div class="preview-details">
            <div class="preview-fields">
              <el-input v-model="file.name" size="small" placeholder="图片名称" />
              <el-input v-model="file.nameEn" size="small" placeholder="英文名称" />
              <el-input
                v-model="file.description"
                size="small"
                type="textarea"
                :rows="2"
                placeholder="图片描述"
              />
              <el-input
                v-model="file.descriptionEn"
                size="small"
                type="textarea"
                :rows="2"
                placeholder="英文描述"
              />
              <el-input
                v-model="file.keywords"
                size="small"
                placeholder="关键词（用英文逗号分隔）"
              />
              <el-input
                v-model="file.keywordsEn"
                size="small"
                placeholder="英文关键词（用英文逗号分隔）"
              />
            </div>

            <div class="preview-footer">
              <div v-if="file.rename" class="rename-tag">
                <el-tag round size="small" type="primary" effect="light">
                  重命名: {{ file.rename }}
                </el-tag>
              </div>

              <div class="file-info-tags">
                <el-tag round size="small" type="info" effect="light">
                  {{ `${(file.size / 1024 / 1024).toFixed(2)}Mb` }}
                </el-tag>
                <el-tag
                  v-if="file.width > 0 && file.height > 0"
                  round
                  size="small"
                  type="info"
                  effect="light"
                >
                  {{ file.width }} x {{ file.height }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-state-icon">
          <el-icon size="32">
            <PictureFilled />
          </el-icon>
        </div>
        <div class="empty-state-title">还没有待上传的图片</div>
        <div class="empty-state-desc">点击右侧“选择图片”，或直接拖拽图片到这里。</div>
      </div>
    </div>

    <div class="operation-container">
      <div class="operation-card">
        <div class="section-title">上传概览</div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">已选择</span>
            <span class="stat-value is-primary">{{ totalCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">成功</span>
            <span class="stat-value is-success">{{ successCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">失败</span>
            <span class="stat-value is-danger">{{ failCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">上传中</span>
            <span class="stat-value is-warning">{{ loadingCount }}</span>
          </div>
        </div>

        <el-progress
          class="upload-progress"
          :format="() => `${successCount}/${totalCount}`"
          :text-inside="true"
          :stroke-width="20"
          :percentage="totalCount ? (successCount / totalCount) * 100 : totalCount"
          :striped-flow="someLoading"
          :striped="someLoading"
          :status="totalCount > 0 && totalCount === successCount ? 'success' : 'warning'"
        />
      </div>

      <div class="operation-card">
        <div class="section-title">批量操作</div>
        <div class="action-stack">
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
            <input
              ref="folderInputRef"
              class="folder-input"
              type="file"
              accept="image/*"
              multiple
              webkitdirectory
              directory
              @change="handleFolderChange"
            />
            <el-button plain :icon="FolderOpened" @click="openFolderPicker">
              选择文件夹
            </el-button>
          </div>

          <div class="action-button-row">
            <el-button
              class="w-full"
              type="primary"
              :disabled="totalCount === 0"
              @click="handleUpload"
            >
              上传
            </el-button>
          </div>

          <div class="action-button-row">
            <el-button
              class="w-full"
              type="danger"
              plain
              :disabled="totalCount === 0"
              @click="handleClear"
            >
              清空
            </el-button>
          </div>

          <div class="action-button-row">
            <el-button
              class="w-full"
              plain
              :disabled="someLoading"
              @click="clearUploadState"
            >
              清空状态
            </el-button>
          </div>
        </div>
      </div>

      <div class="operation-card">
        <div class="section-title">上传选项</div>
        <div class="switch-list">
          <div class="switch-row">
            <div class="switch-copy">
              <div class="switch-title">开启图片预览</div>
              <div class="switch-desc">关闭后可减少本地资源占用，适合一次性批量上传。</div>
            </div>
            <el-switch v-model="usePreview" size="small" />
          </div>
          <div class="switch-row">
            <div class="switch-copy">
              <div class="switch-title">AI 自动补全内容</div>
              <div class="switch-desc">上传后自动补全名称、描述和关键词，适合素材整理。</div>
            </div>
            <el-switch v-model="useAiGenerate" size="small" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import type { PropType } from "vue";
import type { UploadFile } from "element-plus";
import { ElMessage, ElNotification } from "element-plus";
import { Close, FolderOpened, Loading, PictureFilled, UploadFilled } from "@element-plus/icons-vue";
import { useLocalStorage } from "@vueuse/core";
import { uploadToCOS } from "@/api/cos";
import { uploadMaterialFile } from "@/api/material";
import { useUserStore } from "@/store/modules/user";

interface UploadInfo {
  path?: string;
}

type UploadStatus = "waiting" | "uploading" | "success" | "fail";

interface UploadImageItem {
  uid: string | number;
  name: string;
  nameEn: string;
  url: string;
  size: number;
  raw: File;
  relativePath?: string;
  width: number;
  height: number;
  rename: string;
  status: UploadStatus;
  description: string;
  descriptionEn: string;
  keywords: string;
  keywordsEn: string;
}

const userStore = useUserStore();

defineProps({
  currentUploadInfo: {
    type: Object as PropType<UploadInfo>,
    default: () => ({ path: "" }),
  },
});

const emits = defineEmits<{
  "single-file-uploaded": [{ useAiGenerate: boolean }];
}>();

const fileList = ref<UploadImageItem[]>([]);
const folderInputRef = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);
const usePreview = useLocalStorage("material-upload:use-preview", true);
const useAiGenerate = useLocalStorage("material-upload:use-ai-generate", false);

const totalCount = computed(() => fileList.value.length);
const successCount = computed(
  () => fileList.value.filter((file) => file.status === "success").length,
);
const loadingCount = computed(
  () => fileList.value.filter((file) => file.status === "uploading").length,
);
const failCount = computed(() => fileList.value.filter((file) => file.status === "fail").length);
const someLoading = computed(() => fileList.value.some((item) => item.status === "uploading"));

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: 0, height: 0 });
    };

    img.src = objectUrl;
  });
};

const isImageFile = (file: File) => {
  if (file.type?.startsWith("image/")) {
    return true;
  }
  return /\.(apng|avif|bmp|gif|ico|jpe?g|jfif|pjpeg|pjp|png|svg|webp)$/i.test(file.name || "");
};

const buildFileUid = (file: File, fallback?: string | number) => {
  const relativePath = String((file as any).webkitRelativePath || "").trim();
  return fallback || `${relativePath || file.name}-${file.size}-${file.lastModified}`;
};

const buildAiGenerateRawInfo = (file: UploadImageItem) => {
  const sourceName = file.raw?.name || file.name || "";
  const nameWithoutExt = sourceName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  const parts = [
    `原始文件名：${sourceName}`,
    nameWithoutExt ? `从文件名提取的可读名称：${nameWithoutExt}` : "",
    file.relativePath ? `所在路径：${file.relativePath}` : "",
    file.width && file.height ? `图片尺寸：${file.width}x${file.height}px` : "",
    file.name && file.name !== sourceName ? `用户填写名称：${file.name}` : "",
    file.nameEn ? `用户填写英文名称：${file.nameEn}` : "",
    file.description ? `用户填写描述：${file.description}` : "",
    file.descriptionEn ? `用户填写英文描述：${file.descriptionEn}` : "",
    file.keywords ? `用户填写关键词：${file.keywords}` : "",
    file.keywordsEn ? `用户填写英文关键词：${file.keywordsEn}` : "",
  ].filter(Boolean);

  return parts.join("\n");
};

const appendRawFile = async (rawFile: File, uid?: string | number) => {
  if (!rawFile || !isImageFile(rawFile)) return false;

  const relativePath = String((rawFile as any).webkitRelativePath || "").trim();
  const url = URL.createObjectURL(rawFile);
  const info = await getImageDimensions(rawFile);

  fileList.value.push({
    uid: buildFileUid(rawFile, uid),
    name: rawFile.name,
    nameEn: "",
    url,
    size: rawFile.size,
    raw: rawFile,
    relativePath,
    width: info.width,
    height: info.height,
    rename: "",
    status: "waiting",
    description: "",
    descriptionEn: "",
    keywords: "",
    keywordsEn: "",
  });

  return true;
};

const handleFileChange = async (file: UploadFile) => {
  const rawFile = file.raw as File | undefined;
  if (!rawFile) return;
  await appendRawFile(rawFile, file.uid);
};

const openFolderPicker = () => {
  folderInputRef.value?.click();
};

const handleFolderChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []).filter(isImageFile);
  input.value = "";

  if (!files.length) {
    ElMessage.warning("文件夹里没有可上传的图片文件");
    return;
  }

  let addedCount = 0;
  for (const file of files) {
    if (await appendRawFile(file)) {
      addedCount += 1;
    }
  }

  ElMessage.success(`已从文件夹选择 ${addedCount} 张图片`);
};

const handleDragOver = () => {
  isDragOver.value = true;
};

const handleDragLeave = (event: DragEvent) => {
  const target = event.currentTarget as HTMLElement | null;
  const related = event.relatedTarget as Node | null;
  if (!target || !related || !target.contains(related)) {
    isDragOver.value = false;
  }
};

const handleDropFiles = async (event: DragEvent) => {
  isDragOver.value = false;
  const files = Array.from(event.dataTransfer?.files || []).filter(isImageFile);

  if (!files.length) {
    ElMessage.warning("请拖入图片文件");
    return;
  }

  let addedCount = 0;
  for (const file of files) {
    if (await appendRawFile(file)) {
      addedCount += 1;
    }
  }

  ElMessage.success(`已添加 ${addedCount} 张图片`);
};

const revokeFileUrl = (index: number) => {
  const current = fileList.value[index];
  if (current?.url?.startsWith("blob:")) {
    URL.revokeObjectURL(current.url);
  }
};

const handleRemove = (index: number) => {
  revokeFileUrl(index);
  fileList.value.splice(index, 1);
};

const handleRetry = async (index: number) => {
  const file = fileList.value[index];
  if (!file) return;

  file.status = "uploading";
  await uploadFile(file);
};

const handleUpload = async () => {
  if (fileList.value.length && successCount.value === fileList.value.length) {
    return ElNotification.success("图片都上传成功了，请再选择新素材吧~");
  }

  for (let i = 0; i < fileList.value.length; i++) {
    const file = fileList.value[i];
    if (file.status === "waiting" || file.status === "fail") {
      file.status = "uploading";
      void uploadFile(file);
    }
  }
};

const handleClear = () => {
  if (fileList.value.length && failCount.value) {
    return ElNotification.error("有上传失败的图片，请上传成功后再清空");
  }

  fileList.value.forEach((_, index) => revokeFileUrl(index));
  fileList.value = [];
};

const clearUploadState = () => {
  if (someLoading.value) {
    ElMessage.warning("还有图片正在上传，上传结束后再清空状态");
    return;
  }

  fileList.value.forEach((_, index) => revokeFileUrl(index));
  fileList.value = [];
  usePreview.value = true;
  useAiGenerate.value = false;
  ElMessage.success("已清空上传状态");
};

defineExpose({
  clearUploadState,
});

const uploadFile = async (file: UploadImageItem) => {
  try {
    let suffix = "";
    if (file.raw?.name) {
      const match = file.raw.name.match(/\.([a-zA-Z0-9]+)$/);
      if (match) {
        suffix = match[1].toLowerCase();
      }
    }

    const userAccount =
      (userStore.user as any)?.account ||
      userStore.user?.shortName ||
      userStore.user?.name ||
      "anonymous";
    const userId = (userStore.user as any)?.id || (userStore as any).userInfo?.id;

    const cos = await uploadToCOS({
      file: file.raw,
      category: "sticker",
      account: userAccount,
      userId,
    });

    const { url } = cos;
    const width = file.width || 0;
    const height = file.height || 0;
    const aspectRatio = width && height ? width / height : undefined;

    await uploadMaterialFile({
      url,
      name: file.name,
      nameEn: file.nameEn || "",
      description: file.description || "",
      descriptionEn: file.descriptionEn || "",
      keywords: file.keywords || "",
      keywordsEn: file.keywordsEn || "",
      suffix,
      width,
      height,
      aspectRatio,
      userId: userStore.user?.id,
      useAiGenerate: useAiGenerate.value,
      aiGenerateRawInfo: useAiGenerate.value ? buildAiGenerateRawInfo(file) : undefined,
    });

    file.status = "success";
    emits("single-file-uploaded", { useAiGenerate: useAiGenerate.value });
  } catch (error) {
    file.status = "fail";
    console.error("上传文件失败:", error);
    const errorMessage = error instanceof Error ? error.message : String(error || "未知错误");
    ElMessage.error(`文件 ${file.name} 上传失败: ${errorMessage}`);
  }
};

onBeforeUnmount(() => {
  fileList.value.forEach((_, index) => revokeFileUrl(index));
});
</script>

<style scoped lang="scss">
.multi-image-upload-container {
  display: flex;
  align-items: stretch;
  width: 100%;
  height: 100%;
  min-height: 0;
  gap: 14px;
  overflow: hidden;
}

.image-preview-container {
  position: relative;
  display: flex;
  width: 0;
  min-width: min(100%, 640px);
  min-height: 0;
  padding: 14px;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-fill-color-blank) 88%, var(--el-color-primary-light-9) 12%) 0%,
    var(--el-fill-color-extra-light) 100%
  );
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--el-fill-color-blank) 70%, transparent 30%),
    0 10px 30px rgb(15 23 42 / 5%);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
  flex: 1 1 auto;
  flex-direction: column;
}

.image-preview-container.is-drag-over {
  background: color-mix(in srgb, var(--el-color-primary-light-9) 52%, var(--el-fill-color-blank) 48%);
  border-color: color-mix(in srgb, var(--el-color-primary) 56%, var(--el-border-color) 44%);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 34%, transparent 66%),
    0 14px 34px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.image-preview-container.is-drag-over .empty-state,
.image-preview-container.is-drag-over .image-preview-list {
  opacity: 0.82;
}

.image-preview-list {
  display: grid;
  min-height: 0;
  padding-right: 4px;
  overflow-y: auto;
  flex: 1;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  align-content: start;
}

.image-preview-item {
  position: relative;
  display: flex;
  min-height: 500px;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent 28%);
  border-radius: 16px;
  box-shadow: 0 12px 28px rgb(15 23 42 / 6%);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  flex-direction: column;
}

.image-preview-item:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 24%, var(--el-border-color) 76%);
  transform: translateY(-1px);
  box-shadow: 0 16px 34px rgb(15 23 42 / 8%);
}

.preview-media {
  position: relative;
  height: 190px;
  padding: 12px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-fill-color-blank) 94%, transparent 6%) 0%,
    color-mix(in srgb, var(--el-fill-color-light) 86%, var(--el-fill-color-extra-light) 14%) 100%
  );
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.preview-image {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary-light-9) 44%, var(--el-fill-color-light) 56%) 0%,
    var(--el-fill-color-lighter) 100%
  );
  border: 1px solid color-mix(in srgb, var(--el-border-color) 68%, transparent 32%);
  border-radius: 12px;
}

.preview-image :deep(.el-image__inner) {
  object-fit: contain;
}

.image-error-state {
  display: flex;
  width: 100%;
  height: 100%;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.actions {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  width: 30px;
  height: 30px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: color-mix(in srgb, var(--el-fill-color-blank) 92%, transparent 8%);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent 30%);
  border-radius: 999px;
  box-shadow: 0 8px 20px rgb(15 23 42 / 8%);
  transition:
    transform 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
}

.actions:hover {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-fill-color-blank) 96%, transparent 4%);
  border-color: color-mix(in srgb, var(--el-color-danger) 20%, var(--el-border-color) 80%);
  transform: scale(1.04);
}

.status {
  position: absolute;
  right: 20px;
  bottom: 20px;
  left: 20px;
  display: flex;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  border: 1px solid transparent;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgb(15 23 42 / 8%);
  gap: 6px;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}

.uploading {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary-light-9) 78%, transparent 22%);
  border-color: color-mix(in srgb, var(--el-color-primary) 18%, transparent 82%);
}

.fail {
  color: var(--el-color-danger);
  cursor: pointer;
  background: color-mix(in srgb, var(--el-color-danger-light-9) 82%, transparent 18%);
  border-color: color-mix(in srgb, var(--el-color-danger) 20%, transparent 80%);
}

.fail:hover {
  background: color-mix(in srgb, var(--el-color-danger-light-8) 88%, transparent 12%);
}

.success {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success-light-9) 84%, transparent 16%);
  border-color: color-mix(in srgb, var(--el-color-success) 20%, transparent 80%);
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

.preview-details {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: var(--el-bg-color);
}

.preview-fields {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
}

.preview-fields :deep(.el-input__wrapper),
.preview-fields :deep(.el-textarea__inner) {
  background: var(--el-fill-color-extra-light);
  border-radius: 10px;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-border-color) 84%, transparent 16%) inset;
  transition:
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.preview-fields :deep(.el-input__wrapper:hover),
.preview-fields :deep(.el-textarea__inner:hover) {
  background: var(--el-fill-color-blank);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 16%, transparent 84%) inset;
}

.preview-fields :deep(.el-input__wrapper.is-focus),
.preview-fields :deep(.el-textarea__inner:focus) {
  background: var(--el-fill-color-blank);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 34%, transparent 66%) inset,
    0 0 0 4px color-mix(in srgb, var(--el-color-primary) 10%, transparent 90%);
}

.preview-fields :deep(.el-input__inner),
.preview-fields :deep(.el-textarea__inner) {
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.preview-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rename-tag {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.file-info-tags :deep(.el-tag),
.rename-tag :deep(.el-tag) {
  font-weight: 500;
  border-radius: 999px;
}

.empty-state {
  display: flex;
  height: 100%;
  min-height: 420px;
  padding: 40px 24px;
  text-align: center;
  background: color-mix(in srgb, var(--el-fill-color-blank) 84%, transparent 16%);
  border: 1px dashed color-mix(in srgb, var(--el-border-color) 78%, transparent 22%);
  border-radius: 16px;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

.empty-state-icon {
  display: flex;
  width: 72px;
  height: 72px;
  color: var(--el-color-primary);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary) 12%, transparent 88%) 0%,
    color-mix(in srgb, var(--el-color-primary) 4%, transparent 96%) 100%
  );
  border-radius: 20px;
  align-items: center;
  justify-content: center;
}

.empty-state-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.empty-state-desc {
  max-width: 320px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.operation-container {
  display: flex;
  width: clamp(224px, 20vw, 280px);
  max-height: 100%;
  min-width: 0;
  min-height: 0;
  padding-right: 2px;
  overflow-y: auto;
  flex: 0 0 clamp(224px, 20vw, 280px);
  flex-shrink: 0;
  flex-direction: column;
  gap: 12px;
}

.operation-card {
  display: flex;
  padding: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgb(15 23 42 / 5%);
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  display: flex;
  padding: 10px 12px;
  background: var(--el-fill-color-extra-light);
  border-radius: 14px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-border-color) 84%, transparent 16%);
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}

.stat-value.is-primary {
  color: var(--el-color-primary);
}

.stat-value.is-success {
  color: var(--el-color-success);
}

.stat-value.is-danger {
  color: var(--el-color-danger);
}

.stat-value.is-warning {
  color: var(--el-color-warning);
}

.upload-progress :deep(.el-progress-bar__outer) {
  background: var(--el-fill-color-light);
}

.upload-progress :deep(.el-progress-bar__innerText) {
  font-size: 11px;
}

.action-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
}

.action-stack > * {
  width: 100%;
}

.action-stack :deep(.el-button) {
  width: 100%;
  justify-content: center;
  margin-left: 0;
}

.action-button-row {
  width: 100%;
}

.local-select {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.folder-input {
  display: none;
}

.local-select :deep(.el-upload) {
  display: block;
  width: 100%;
}

.local-select :deep(.el-upload .el-button) {
  width: 100%;
  justify-content: center;
}

.switch-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-row {
  display: flex;
  padding: 10px 12px;
  background: var(--el-fill-color-extra-light);
  border-radius: 14px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-border-color) 84%, transparent 16%);
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.switch-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.switch-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.switch-desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

@media (width <= 1360px) {
  .multi-image-upload-container {
    flex-direction: column;
    height: auto;
    min-height: 100%;
    overflow: visible;
  }

  .operation-container {
    width: 100%;
    max-height: none;
    min-width: 0;
    padding-right: 0;
    overflow: visible;
    flex-basis: auto;
  }

  .image-preview-container {
    width: 100%;
    min-width: 0;
    flex: none;
    overflow: visible;
  }

  .image-preview-list {
    flex: none;
    overflow: visible;
  }
}

@media (width <= 768px) {
  .multi-image-upload-container {
    gap: 10px;
  }

  .image-preview-container,
  .operation-card {
    padding: 10px;
    border-radius: 12px;
  }

  .image-preview-list {
    grid-template-columns: 1fr;
    padding-right: 0;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .empty-state {
    min-height: 280px;
    padding: 28px 16px;
  }
}
</style>
