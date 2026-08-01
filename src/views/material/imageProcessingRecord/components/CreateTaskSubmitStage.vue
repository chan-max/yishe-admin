<template>
  <section class="create-task-stage">
    <div class="create-task-stage__header">
      <div class="create-task-stage__index">3</div>
      <div class="create-task-stage__title-wrap">
        <div class="create-task-stage__title">提交确认</div>
        <div class="create-task-stage__desc">最后确认配置内容，没问题就可以直接提交。</div>
      </div>
    </div>

    <div class="create-task-submit-grid">
      <div class="create-task-panel">
        <div v-if="currentOperations.length" class="create-task-preview-chain">
          <div class="create-task-preview-chain__title">本次处理链 ({{ currentOperations.length }} 步)</div>
          <div class="create-task-preview-chip-list">
            <span v-for="operation in currentOperations" :key="operation.key" class="create-task-preview-chip">
              {{ operation.title }}
            </span>
          </div>
        </div>
      </div>

      <div class="create-task-panel create-task-panel--preview">
        <div class="create-task-request-preview">
          <div class="create-task-request-preview__title">提交预览</div>
          <pre class="create-task-json-block">{{ requestPreviewJson }}</pre>
        </div>
      </div>
    </div>

    <div class="create-task-actions">
      <div class="create-task-actions__hint">{{ createSubmitHint }}</div>
      <div class="create-task-actions__buttons">
        <el-button @click="$emit('cancel')">取消</el-button>
        <el-button type="primary" :loading="submitLoading" :disabled="!canSubmitCreate" @click="$emit('submit')">
          立即执行
        </el-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: "CreateTaskSubmitStage" });

defineProps<{
  formTaskType: string;
  currentOperations: any[];
  requestPreviewJson: string;
  createSubmitHint: string;
  submitLoading: boolean;
  canSubmitCreate: boolean;
}>();

defineEmits(["cancel", "submit"]);
</script>

<style scoped lang="scss">
.create-task-stage,
.create-task-panel,
.create-task-intro,
.create-task-request-preview,
.create-task-preview-chain,
.create-task-actions {
  display: flex;
  flex-direction: column;
}

.create-task-stage {
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
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.create-task-stage__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.create-task-stage__title,
.create-task-intro__title,
.create-task-request-preview__title,
.create-task-preview-chain__title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
}

.create-task-stage__desc,
.create-task-intro__desc,
.create-task-preview-chain__desc,
.create-task-actions__hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.create-task-submit-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) 360px;
  gap: 16px;
  align-items: stretch;
}

.create-task-panel {
  min-height: 0;
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
.create-task-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: transparent;
  padding: 0;
  border: none;
  box-shadow: none;
}

.create-task-panel--preview {
  padding: 0;
  border: 0;
  background: transparent;
}

.create-task-intro,
.create-task-request-preview,
.create-task-preview-chain {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: transparent;
  padding: 0;
  border: none;
}

.create-task-request-preview {
  min-height: 100%;
}

.create-task-preview-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.create-task-preview-chip {
  border-radius: 4px;
  background: var(--el-fill-color-light);
  padding: 4px 10px;
  color: var(--el-text-color-primary);
  font-size: 12px;
}

.create-task-preview-chip--more {
  color: var(--el-text-color-secondary);
}

.create-task-json-block {
  margin: 0;
  overflow: auto;
  max-width: 100%;
  flex: 1;
  border-radius: 6px;
  background: var(--el-fill-color-extra-light);
  padding: 10px 12px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  border: 1px dashed var(--el-border-color-lighter);
}

.create-task-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-extra-light);
  background: transparent;
}

.create-task-actions__buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 1200px) {
  .create-task-submit-grid {
    grid-template-columns: 1fr;
  }

  .create-task-request-preview {
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .create-task-panel,
  .create-task-actions {
    padding: 0;
  }

  .create-task-actions__buttons {
    justify-content: stretch;
  }

  .create-task-actions__buttons .el-button {
    flex: 1;
  }
}
</style>
