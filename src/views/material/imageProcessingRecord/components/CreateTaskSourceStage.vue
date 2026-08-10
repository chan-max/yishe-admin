<template>
  <section class="create-task-stage">
    <div class="create-task-stage__header">
      <div class="create-task-stage__index">1</div>
      <div class="create-task-stage__title-wrap">
        <div class="create-task-stage__title">指定网络源图</div>
        <div class="create-task-stage__desc">仅支持输入 HTTP / HTTPS 远程网络图片链接（原图将被永久防删隔离保护）。</div>
      </div>
    </div>

    <div class="create-task-source-grid">
      <div class="create-task-panel">
        <el-form label-position="top" class="create-task-form">
          <el-form-item label="任务标题">
            <el-input
              v-model="form.title"
              clearable
              maxlength="255"
              placeholder="可选，留空会自动生成标题"
            />
          </el-form-item>

          <el-form-item label="图片远程 HTTP / HTTPS URL 链接">
            <el-input
              v-model="form.imageUrl"
              clearable
              placeholder="https://example.com/source.jpg"
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
defineOptions({ name: "CreateTaskSourceStage" });

const props = defineProps<{
  form: Record<string, any>;
  createSourcePreview: string;
  hasSourceContext: boolean;
}>();

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
  font-size: 12px;
  font-weight: 700;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.create-task-stage__title-wrap {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.create-task-stage__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.create-task-stage__desc {
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-placeholder);
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
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  flex-direction: column;
  gap: 16px;
}

.create-task-panel--preview {
  padding: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.create-task-intro,
.create-task-context-card {
  display: flex;
  padding: 0;
  background: var(--el-fill-color-blank);
  border-radius: 8px;
  flex-direction: column;
  gap: 8px;
}

.create-task-intro__title,
.create-task-context-card__title,
.create-task-preview-card__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.create-task-intro__desc,
.create-task-tip,
.create-task-context-card__item .label,
.create-task-context-card__item .value,
.create-task-preview-card__empty {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.create-task-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.create-task-preview-card {
  display: flex;
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  flex-direction: column;
  gap: 8px;
}

.create-task-preview-card__body {
  display: flex;
  min-height: 200px;
  overflow: hidden;
  background: var(--el-fill-color-light);
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: 8px;
  align-items: center;
  justify-content: center;
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

@media (width <= 1200px) {
  .create-task-source-grid {
    grid-template-columns: 1fr;
  }
}

@media (width <= 768px) {
  .create-task-panel {
    padding: 0;
  }
}
</style>
