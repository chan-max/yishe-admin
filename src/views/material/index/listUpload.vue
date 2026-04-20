<template>
  <div class="multi-image-upload-container">
    <div class="image-preview-container">
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
        <div class="empty-state-desc">
          点击右侧“选择图片”后，可在这里批量填写名称、描述和关键词。
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
import { Close, Loading, PictureFilled, UploadFilled } from "@element-plus/icons-vue";
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

const emits = defineEmits(["single-file-uploaded"]);

const fileList = ref<UploadImageItem[]>([]);
const usePreview = ref(true);
const useAiGenerate = ref(false);

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

const handleFileChange = async (file: UploadFile) => {
  const rawFile = file.raw as File | undefined;
  if (!rawFile) return;

  const url = URL.createObjectURL(rawFile);
  const info = await getImageDimensions(rawFile);

  fileList.value.push({
    uid: file.uid,
    name: file.name,
    nameEn: "",
    url,
    size: file.size || rawFile.size,
    raw: rawFile,
    width: info.width,
    height: info.height,
    rename: "",
    status: "waiting",
    description: "",
    descriptionEn: "",
    keywords: "",
    keywordsEn: "",
  });
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
    });

    file.status = "success";
    emits("single-file-uploaded");
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
  flex: 1 1 auto;
  width: 0;
  min-width: min(100%, 640px);
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

.image-preview-list {
  display: grid;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  align-content: start;
}

.image-preview-item {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 500px;
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

.image-preview-item:hover {
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

.preview-image {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 68%, transparent 32%);
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary-light-9) 44%, var(--el-fill-color-light) 56%) 0%,
    var(--el-fill-color-lighter) 100%
  );
}

.preview-image :deep(.el-image__inner) {
  object-fit: contain;
}

.image-error-state {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-secondary);
  font-size: 12px;
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
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
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
  flex: 0 0 clamp(224px, 20vw, 280px);
  width: clamp(224px, 20vw, 280px);
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

.switch-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--el-fill-color-extra-light);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-border-color) 84%, transparent 16%);
}

.switch-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.switch-title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.switch-desc {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 1360px) {
  .multi-image-upload-container {
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden auto;
  }

  .operation-container {
    width: 100%;
    flex-basis: auto;
    min-width: 0;
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }

  .image-preview-container {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .image-preview-container,
  .operation-card {
    padding: 14px;
    border-radius: 16px;
  }

  .image-preview-list {
    grid-template-columns: 1fr;
    padding-right: 0;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
