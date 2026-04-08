<template>
  <div class="multi-file-upload-container">
    <div class="file-preview-container">
      <div v-if="fileList.length" class="file-preview-list">
        <div v-for="(file, index) in fileList" :key="file.uid" class="file-preview-item">
          <div class="preview-media">
            <video
              v-if="file.url && isVideoFile(file.suffix)"
              :src="file.url"
              class="preview-video"
              controls
              preload="metadata"
            />
            <el-image
              v-else-if="file.url && isImageFile(file.suffix)"
              :src="file.url"
              class="preview-image"
              fit="cover"
            >
              <template #error>
                <div class="preview-placeholder">
                  <el-icon size="44" color="var(--el-text-color-secondary)">
                    <component :is="getFileIcon(file.suffix)" />
                  </el-icon>
                  <div class="preview-placeholder__title">{{ file.name }}</div>
                  <div class="preview-placeholder__meta">{{ formatFileSize(file.size) }}</div>
                  <div class="preview-placeholder__suffix">{{ file.suffix.toUpperCase() }}</div>
                </div>
              </template>
            </el-image>
            <div v-else class="preview-placeholder">
              <el-icon size="44" color="var(--el-text-color-secondary)">
                <component :is="getFileIcon(file.suffix)" />
              </el-icon>
              <div class="preview-placeholder__title">{{ file.name }}</div>
              <div class="preview-placeholder__meta">{{ formatFileSize(file.size) }}</div>
              <div class="preview-placeholder__suffix">{{ file.suffix.toUpperCase() }}</div>
            </div>

            <div class="actions">
              <el-icon
                v-if="file.status !== UploadStatus.Uploading"
                size="18"
                @click="handleRemove(index)"
              >
                <Close />
              </el-icon>
            </div>

            <div v-if="file.status === UploadStatus.Uploading" class="status uploading">
              <el-icon class="loading-icon">
                <Loading />
              </el-icon>
              上传中...
            </div>
            <div
              v-if="file.status === UploadStatus.Fail"
              class="status fail"
              @click="handleRetry(index)"
            >
              上传失败，点击重试
            </div>
            <div v-if="file.status === UploadStatus.Success" class="status success">上传成功</div>
          </div>

          <div class="preview-details">
            <div class="preview-fields">
              <el-input v-model="file.name" size="small" placeholder="文件名称" />
              <el-input
                v-model="file.description"
                size="small"
                type="textarea"
                :rows="2"
                placeholder="文件描述"
              />
              <el-input
                v-model="file.keywords"
                size="small"
                placeholder="关键词（用英文逗号分隔）"
              />
              <el-select v-model="file.category" size="small" placeholder="选择分类">
                <el-option label="风景" value="风景" />
                <el-option label="人物" value="人物" />
                <el-option label="动物" value="动物" />
                <el-option label="建筑" value="建筑" />
                <el-option label="动画" value="动画" />
                <el-option label="其他" value="其他" />
              </el-select>
              <el-input v-model="file.tags" size="small" placeholder="标签（用英文逗号分隔）" />
            </div>

            <div class="preview-footer">
              <div class="file-info-tags">
                <el-tag round size="small" type="info" effect="light">
                  {{ formatFileSize(file.size) }}
                </el-tag>
                <el-tag round size="small" type="info" effect="light">
                  {{ file.suffix.toUpperCase() }}
                </el-tag>
                <el-tag v-if="file.category" round size="small" type="primary" effect="light">
                  {{ file.category }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-state-icon">
          <el-icon size="32">
            <Folder />
          </el-icon>
        </div>
        <div class="empty-state-title">还没有待上传的文件</div>
        <div class="empty-state-desc">
          点击右侧“选择文件”后，可在这里批量填写名称、描述、分类和关键词。
        </div>
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
              :accept="acceptAllFiles"
              list-type="text"
              :auto-upload="false"
              :on-change="handleFileChange"
              :show-file-list="false"
              multiple
            >
              <el-button type="primary" plain :icon="UploadFilled">选择文件</el-button>
            </el-upload>
          </div>

          <el-button
            class="w-full"
            type="primary"
            :disabled="totalCount === 0"
            @click="handleUpload"
          >
            上传
          </el-button>

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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { PropType } from "vue";
import { ElMessage, ElNotification } from "element-plus";
import {
  Close,
  Document,
  Folder,
  Loading,
  Picture,
  UploadFilled,
  VideoPlay,
} from "@element-plus/icons-vue";
import type { UploadFile } from "element-plus";
import { createFileResource } from "@/api/file-resource";
import { uploadToCOS, initCOS } from "@/api/cos";
import { useUserStore } from "@/store/modules/user";

interface UploadInfo {
  path?: string;
}

enum UploadStatus {
  Waiting = "waiting",
  Uploading = "uploading",
  Success = "success",
  Fail = "fail",
}

interface FileUploadItem {
  uid: string | number;
  name: string;
  description: string;
  keywords: string;
  category: string;
  tags: string;
  suffix: string;
  size: number;
  status: UploadStatus;
  file: File;
  url: string;
  id?: string | number;
}

defineProps({
  currentUploadInfo: {
    type: Object as PropType<UploadInfo>,
    default: () => ({}),
  },
});

const emits = defineEmits(["single-file-uploaded"]);
const userStore = useUserStore();

const fileList = ref<FileUploadItem[]>([]);

const totalCount = computed(() => fileList.value.length);
const successCount = computed(
  () => fileList.value.filter((file) => file.status === UploadStatus.Success).length,
);
const failCount = computed(
  () => fileList.value.filter((file) => file.status === UploadStatus.Fail).length,
);
const loadingCount = computed(
  () => fileList.value.filter((file) => file.status === UploadStatus.Uploading).length,
);
const someLoading = computed(() => loadingCount.value > 0);

const acceptAllFiles = "*";

function isVideoFile(suffix: string): boolean {
  const videoSuffixes = ["mp4", "mov", "avi", "mkv", "wmv", "flv", "webm", "m4v", "3gp", "ogv"];
  return videoSuffixes.includes(suffix.toLowerCase());
}

function isImageFile(suffix: string): boolean {
  const imageSuffixes = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico", "tiff", "tif"];
  return imageSuffixes.includes(suffix.toLowerCase());
}

function getFileIcon(suffix: string) {
  const videoSuffixes = ["mp4", "mov", "avi", "mkv", "wmv", "flv", "webm", "m4v", "3gp", "ogv"];
  const imageSuffixes = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico", "tiff", "tif"];
  const documentSuffixes = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf"];

  if (videoSuffixes.includes(suffix.toLowerCase())) return VideoPlay;
  if (imageSuffixes.includes(suffix.toLowerCase())) return Picture;
  if (documentSuffixes.includes(suffix.toLowerCase())) return Document;
  return Folder;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function handleFileChange(file: UploadFile | File) {
  const actualFile = (file as UploadFile).raw || (file as File);
  if (!actualFile) return;

  const maxSize = 1024 * 1024 * 1024;
  if (actualFile.size > maxSize) {
    ElMessage.error("文件大小不能超过1GB");
    return;
  }

  const suffix = actualFile.name.split(".").pop()?.toLowerCase() || "unknown";

  fileList.value.push({
    uid: (file as UploadFile).uid || `${Date.now()}-${Math.random()}`,
    name: actualFile.name.replace(/\.[^/.]+$/, ""),
    description: "",
    keywords: "",
    category: "",
    tags: "",
    suffix,
    size: actualFile.size,
    status: UploadStatus.Waiting,
    file: actualFile,
    url: "",
  });
}

function handleRemove(index: number) {
  fileList.value.splice(index, 1);
}

function handleRetry(index: number) {
  const file = fileList.value[index];
  if (!file) return;

  file.status = UploadStatus.Waiting;
  void handleUpload();
}

function handleClear() {
  fileList.value = [];
}

async function handleUpload() {
  if (totalCount.value === 0) {
    ElMessage.warning("请先选择文件");
    return;
  }

  const waitingFiles = fileList.value.filter((file) => file.status === UploadStatus.Waiting);
  if (waitingFiles.length === 0) {
    ElMessage.warning("没有待上传的文件");
    return;
  }

  for (const file of waitingFiles) {
    await uploadSingleFile(file);
  }
}

async function uploadSingleFile(fileItem: FileUploadItem) {
  try {
    fileItem.status = UploadStatus.Uploading;

    await initCOS();

    const cosResult = await uploadToCOS({
      file: fileItem.file,
      category: "file-resource",
      account:
        (userStore.user as any)?.account ||
        userStore.user?.shortName ||
        userStore.user?.name ||
        "anonymous",
      userId: (userStore.user as any)?.id || (userStore as any).userInfo?.id,
    });

    if (!cosResult.url) {
      throw new Error("上传到COS失败");
    }

    fileItem.url = cosResult.url;

    const materialData = {
      name: fileItem.name,
      description: fileItem.description,
      keywords: fileItem.keywords,
      suffix: fileItem.suffix,
      category: fileItem.category,
      tags: fileItem.tags,
      url: cosResult.url,
      isPublic: true,
      userId: userStore.userInfo?.id,
    };

    const result = await createFileResource(materialData);
    if (!result) {
      throw new Error("保存到数据库失败");
    }

    fileItem.status = UploadStatus.Success;
    fileItem.id = result.id;
    ElNotification.success(`文件 ${fileItem.name} 上传成功`);
    emits("single-file-uploaded");
  } catch (error) {
    console.error("上传失败:", error);
    fileItem.status = UploadStatus.Fail;
    const message = error instanceof Error ? error.message : "未知错误";
    ElMessage.error(`文件 ${fileItem.name} 上传失败: ${message}`);
  }
}
</script>

<style scoped lang="scss">
.multi-file-upload-container {
  display: flex;
  align-items: stretch;
  width: 100%;
  height: 100%;
  min-height: 0;
  gap: 14px;
  overflow: hidden;
}

.file-preview-container {
  flex: 1 1 auto;
  width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-fill-color-blank) 88%, var(--el-color-primary-light-9) 12%) 0%,
    var(--el-fill-color-extra-light) 100%
  );
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--el-fill-color-blank) 70%, transparent 30%),
    0 10px 30px rgba(15, 23, 42, 0.05);
}

.file-preview-list {
  display: grid;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  align-content: start;
}

.file-preview-item {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 470px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent 28%);
  border-radius: 16px;
  background: var(--el-bg-color);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.file-preview-item:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--el-color-primary) 24%, var(--el-border-color) 76%);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
}

.preview-media {
  position: relative;
  height: 190px;
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-fill-color-blank) 94%, transparent 6%) 0%,
    color-mix(in srgb, var(--el-fill-color-light) 86%, var(--el-fill-color-extra-light) 14%) 100%
  );
}

.preview-video,
.preview-image {
  width: 100%;
  height: 100%;
  display: block;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 68%, transparent 32%);
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary-light-9) 44%, var(--el-fill-color-light) 56%) 0%,
    var(--el-fill-color-lighter) 100%
  );
  object-fit: cover;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 18px;
  border: 1px dashed color-mix(in srgb, var(--el-border-color) 84%, transparent 16%);
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-fill-color-light) 78%, transparent 22%) 0%,
    var(--el-fill-color-lighter) 100%
  );
  text-align: center;
}

.preview-placeholder__title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  word-break: break-word;
}

.preview-placeholder__meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.preview-placeholder__suffix {
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-fill-color-blank) 92%, transparent 8%);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 600;
}

.actions {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent 30%);
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-fill-color-blank) 92%, transparent 8%);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  backdrop-filter: blur(6px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
  transition:
    transform 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.actions:hover {
  transform: scale(1.04);
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-fill-color-blank) 96%, transparent 4%);
  border-color: color-mix(in srgb, var(--el-color-danger) 20%, var(--el-border-color) 80%);
}

.status {
  position: absolute;
  right: 20px;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.uploading {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary-light-9) 78%, transparent 22%);
  border-color: color-mix(in srgb, var(--el-color-primary) 18%, transparent 82%);
}

.fail {
  cursor: pointer;
  color: var(--el-color-danger);
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
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
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
.preview-fields :deep(.el-textarea__inner),
.preview-fields :deep(.el-select__wrapper) {
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-border-color) 84%, transparent 16%) inset;
  transition:
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.preview-fields :deep(.el-input__wrapper:hover),
.preview-fields :deep(.el-textarea__inner:hover),
.preview-fields :deep(.el-select__wrapper:hover) {
  background: var(--el-fill-color-blank);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 16%, transparent 84%) inset;
}

.preview-fields :deep(.el-input__wrapper.is-focus),
.preview-fields :deep(.el-textarea__inner:focus),
.preview-fields :deep(.el-select__wrapper.is-focused) {
  background: var(--el-fill-color-blank);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 34%, transparent 66%) inset,
    0 0 0 4px color-mix(in srgb, var(--el-color-primary) 10%, transparent 90%);
}

.preview-fields :deep(.el-input__inner),
.preview-fields :deep(.el-textarea__inner),
.preview-fields :deep(.el-select__selected-item) {
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.preview-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.file-info-tags :deep(.el-tag) {
  border-radius: 999px;
  font-weight: 500;
}

.empty-state {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  height: 100%;
  padding: 40px 24px;
  border: 1px dashed color-mix(in srgb, var(--el-border-color) 78%, transparent 22%);
  border-radius: 16px;
  background: color-mix(in srgb, var(--el-fill-color-blank) 84%, transparent 16%);
  text-align: center;
}

.empty-state-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary) 12%, transparent 88%) 0%,
    color-mix(in srgb, var(--el-color-primary) 4%, transparent 96%) 100%
  );
  color: var(--el-color-primary);
}

.empty-state-title {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 700;
}

.empty-state-desc {
  max-width: 320px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.operation-container {
  flex: 0 0 clamp(268px, 24vw, 300px);
  width: clamp(268px, 24vw, 300px);
  min-width: 0;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  padding-right: 2px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.operation-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.section-title {
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--el-fill-color-extra-light);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-border-color) 84%, transparent 16%);
}

.stat-label {
  color: var(--el-text-color-secondary);
  font-size: 11px;
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
}

.local-select {
  width: 100%;
}

.local-select :deep(.el-upload) {
  display: block;
  width: 100%;
}

.local-select :deep(.el-upload .el-button) {
  width: 100%;
  justify-content: center;
}

@media (max-width: 1200px) {
  .multi-file-upload-container {
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden auto;
  }

  .operation-container {
    width: 100%;
    flex-basis: auto;
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}

@media (max-width: 768px) {
  .file-preview-container,
  .operation-card {
    padding: 14px;
    border-radius: 16px;
  }

  .file-preview-list {
    grid-template-columns: 1fr;
    padding-right: 0;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
