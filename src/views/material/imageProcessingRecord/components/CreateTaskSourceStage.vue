<template>
  <section class="create-task-stage">
    <div class="create-task-stage__header">
      <div class="create-task-stage__index">1</div>
      <div class="create-task-stage__title-wrap">
        <div class="create-task-stage__title">输入源图信息</div>
        <div class="create-task-stage__desc">先完成必填的图片地址，再补充标题和来源链路。</div>
      </div>
    </div>

    <div class="create-task-source-grid">
      <div class="create-task-panel">
        <div class="create-task-intro">
          <div class="create-task-intro__title">先确认源图和标题</div>
          <div class="create-task-intro__desc">输入可访问的图片地址后，就可以继续配置处理方式。</div>
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

          <el-form-item label="图片地址">
            <el-input
              v-model="form.imageUrl"
              clearable
              placeholder="https://example.com/source.png"
            />
          </el-form-item>
        </el-form>

        <div class="create-task-tip">
          当前仅支持远程图片地址，请先粘贴可直接访问的原图链接。
        </div>
      </div>

      <div class="create-task-panel create-task-panel--preview">
        <div class="create-task-preview-card">
          <div class="create-task-preview-card__title">原图预览</div>
          <div class="create-task-preview-card__body">
            <img
              v-if="createSourcePreview"
              :src="createSourcePreview"
              alt="source preview"
              class="create-task-preview-card__image"
            />
            <div v-else class="create-task-preview-card__empty">等待选择图片</div>
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

defineProps<{
  form: Record<string, any>;
  createSourcePreview: string;
  hasSourceContext: boolean;
}>();
</script>

<style scoped lang="scss">
.create-task-stage {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.create-task-stage__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.create-task-stage__index {
  display: flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.create-task-stage__title-wrap {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.create-task-stage__title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}

.create-task-stage__desc {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.create-task-source-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) 360px;
  gap: 16px;
  align-items: stretch;
}

.create-task-panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color-page);
  padding: 16px 18px;
}

.create-task-panel--preview {
  padding: 0;
  border: 0;
  background: transparent;
}

.create-task-intro,
.create-task-context-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: var(--el-fill-color-extra-light);
  padding: 12px 14px;
}

.create-task-intro__title,
.create-task-context-card__title,
.create-task-preview-card__title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
}

.create-task-intro__desc,
.create-task-tip,
.create-task-context-card__item .label,
.create-task-context-card__item .value,
.create-task-preview-card__empty {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.create-task-form {
  display: flex;
  flex-direction: column;
}

.create-task-preview-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: var(--el-bg-color);
  padding: 12px;
}

.create-task-preview-card__body {
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
  background: var(--el-fill-color-light);
}

.create-task-preview-card__image {
  width: 100%;
  max-height: 320px;
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
    padding: 14px;
  }
}
</style>
