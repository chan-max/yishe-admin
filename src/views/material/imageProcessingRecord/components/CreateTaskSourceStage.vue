<template>
  <section class="create-task-stage">
    <div class="create-task-stage__header">
      <div class="create-task-stage__index">1</div>
      <div class="create-task-stage__title-wrap">
        <div class="create-task-stage__title">选择源图</div>
        <div class="create-task-stage__desc">支持上传本地文件或直接粘贴网络图片链接。</div>
      </div>
    </div>

    <div class="create-task-source-grid">
      <div class="create-task-panel">
        <div class="create-task-intro">
          <div class="create-task-intro__title">源图提供方式</div>
          <el-radio-group v-model="sourceMode" size="small" @change="handleSourceModeChange">
            <el-radio-button label="upload">本地文件上传</el-radio-button>
            <el-radio-button label="url">网络图片链接</el-radio-button>
          </el-radio-group>
        </div>

        <el-form label-position="top" class="create-task-form">
          <el-form-item label="任务标题">
            <el-input
              v-model="form.title"
              clearable
              maxlength="255"
              placeholder="可选，留空会自动生成标题"
            />
          </el-form-item>

          <el-form-item v-if="sourceMode === 'upload'" label="上传本地源图文件">
            <UploadImg
              v-model="form.imageUrl"
              :limit="1"
              :is-show-tip="false"
              @change="handleUploadSuccess"
            />
          </el-form-item>

          <el-form-item v-else label="图片远程 URL 链接">
            <el-input
              v-model="form.imageUrl"
              clearable
              placeholder="https://example.com/source.png"
              @input="handleUrlInput"
            />
          </el-form-item>

        </el-form>
      </div>

      <div class="create-task-panel create-task-panel--preview">
        <div class="create-task-preview-card">
          <div class="create-task-preview-card__title">源图预览</div>
          <div class="create-task-preview-card__body">
            <img
              v-if="createSourcePreview"
              :src="createSourcePreview"
              alt="source preview"
              class="create-task-preview-card__image"
            />
            <div v-else class="create-task-preview-card__empty">等待选择或上传图片</div>
          </div>
        </div>

        <div v-if="hasSourceContext" class="create-task-context-card">
          <div class="create-task-context-card__title">来源链路</div>
          <div class="create-task-context-card__item">
            <span class="label">来源模块</span>
            <span class="value">{{ form.sourceModule || "-" }}</span>
          </div>
          <div class="create-task-context-card__item">
            <span class="label">来源记录</span>
            <span class="value">{{ form.sourceRecordId || "-" }}</span>
          </div>
          <div class="create-task-context-card__item">
            <span class="label">来源名称</span>
            <span class="value">{{ form.sourceName || "-" }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import UploadImg from "@/components/UploadFile/src/UploadImg.vue";

defineOptions({ name: "CreateTaskSourceStage" });

const props = defineProps<{
  form: Record<string, any>;
  createSourcePreview: string;
  hasSourceContext: boolean;
}>();

const sourceMode = ref("upload");

function handleSourceModeChange(mode: string) {
  if (mode === "upload") {
    props.form.sourceImageOwned = true;
  } else {
    props.form.sourceImageOwned = false;
  }
}

function handleUploadSuccess() {
  props.form.sourceImageOwned = true;
}

function handleUrlInput() {
  props.form.sourceImageOwned = false;
}
</script>

<style scoped lang="scss">
.create-task-stage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.create-task-stage__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.create-task-stage__index {
  display: flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.create-task-stage__title-wrap {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.create-task-stage__title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}

.create-task-stage__desc {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  line-height: 1.4;
}

.create-task-source-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;
}

.create-task-panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 16px;
  background: transparent;
  padding: 0;
  border: none;
  box-shadow: none;
}

.create-task-panel--preview {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.create-task-intro,
.create-task-context-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  padding: 0;
}

.create-task-intro__title,
.create-task-context-card__title,
.create-task-preview-card__title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.create-task-intro__desc,
.create-task-tip,
.create-task-context-card__item .label,
.create-task-context-card__item .value,
.create-task-preview-card__empty {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.create-task-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.create-task-preview-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: transparent;
  padding: 0;
  border: none;
  box-shadow: none;
}

.create-task-preview-card__body {
  display: flex;
  min-height: 200px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  border: 1px dashed var(--el-border-color-lighter);
}

.create-task-preview-card__image {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.create-task-context-card__item {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 10px;
}

.create-task-context-card__item .value {
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}

@media (max-width: 1200px) {
  .create-task-source-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .create-task-panel {
    padding: 0;
  }
}
</style>
