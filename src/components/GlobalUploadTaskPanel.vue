<template>
  <div v-if="globalUploadTasks.length" class="global-upload-panel">
    <div class="global-upload-panel__header">
      <div class="global-upload-panel__title">文件上传</div>
      <el-button size="small" text @click="clearFinishedGlobalUploadTasks">清理</el-button>
    </div>

    <div class="global-upload-panel__list">
      <div
        v-for="task in globalUploadTasks"
        :key="task.id"
        class="global-upload-panel__item"
        :class="`is-${task.status}`"
      >
        <div class="global-upload-panel__item-row">
          <div class="global-upload-panel__item-name">{{ task.name }}</div>
          <span class="global-upload-panel__item-status">
            {{ getGlobalUploadTaskStatusText(task.status) }}
          </span>
        </div>
        <el-progress
          :percentage="task.progress"
          :status="task.status === 'success' ? 'success' : task.status === 'error' ? 'exception' : undefined"
          :show-text="false"
          :stroke-width="4"
        />
        <div class="global-upload-panel__item-stage">{{ task.stage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import {
  clearFinishedGlobalUploadTasks,
  getGlobalUploadTaskStatusText,
  globalUploadTasks,
  hasRunningGlobalUploadTasks,
} from "@/services/globalUploadTasks";

defineOptions({ name: "GlobalUploadTaskPanel" });

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!hasRunningGlobalUploadTasks.value) {
    return;
  }

  event.preventDefault();
  event.returnValue = "文件仍在上传中，关闭页面可能导致上传中断。";
};

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
});
</script>

<style scoped lang="scss">
.global-upload-panel {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 3000;
  width: min(300px, calc(100vw - 36px));
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.global-upload-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.global-upload-panel__title {
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
}

.global-upload-panel__list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 180px;
  overflow: auto;
}

.global-upload-panel__item {
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.global-upload-panel__item.is-running {
  background: var(--el-color-primary-light-9);
}

.global-upload-panel__item.is-success {
  background: var(--el-color-success-light-9);
}

.global-upload-panel__item.is-error {
  background: var(--el-color-danger-light-9);
}

.global-upload-panel__item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  margin-bottom: 4px;
}

.global-upload-panel__item-name {
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.global-upload-panel__item-status {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.global-upload-panel__item-stage {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
