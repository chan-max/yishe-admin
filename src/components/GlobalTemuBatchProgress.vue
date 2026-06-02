<template>
  <Transition name="fade-slide-up">
    <div
      v-if="visibleItems.length"
      class="global-temu-batch-progress"
      :class="{ 'is-collapsed': collapsed }"
    >
      <div class="global-temu-batch-progress__head">
        <strong class="global-temu-batch-progress__title">{{ title }}</strong>
        <div class="global-temu-batch-progress__actions">
          <span class="global-temu-batch-progress__summary">{{ summary }}</span>
          <el-button
            text
            size="small"
            type="danger"
            class="global-temu-batch-progress__stop-btn"
            @click="handleStopAll"
          >
            停止
          </el-button>
          <el-button
            text
            size="small"
            class="global-temu-batch-progress__toggle-btn"
            @click="collapsed = !collapsed"
          >
            {{ collapsed ? '展开' : '折叠' }}
          </el-button>
        </div>
      </div>

      <template v-if="!collapsed">
        <div
          v-for="item in visibleItems"
          :key="item.key"
          class="global-temu-batch-progress__item"
        >
          <div class="global-temu-batch-progress__item-head">
            <strong>{{ item.title }}</strong>
            <span>{{ item.progressText }}</span>
          </div>
          <el-progress :percentage="item.percent" :stroke-width="8" :show-text="false" />
          <div class="global-temu-batch-progress__item-meta">
            <span v-if="item.rowText">{{ item.rowText }}</span>
            <span v-if="item.stage">{{ item.stage }}</span>
          </div>
          <div class="global-temu-batch-progress__item-stats">
            <el-tag size="small" effect="plain" type="success">成功 {{ item.successCount }}</el-tag>
            <el-tag size="small" effect="plain" type="danger">失败 {{ item.failedCount }}</el-tag>
            <el-tag size="small" effect="plain" type="warning"
              >剩余 {{ item.remainingCount }}</el-tag
            >
          </div>
        </div>
      </template>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useTemuBatchProgressStoreWithOut } from '@/store/modules/temuBatchProgress';

defineOptions({ name: 'GlobalTemuBatchProgress' });

const store = useTemuBatchProgressStoreWithOut();
const collapsed = ref(false);

const visibleItems = computed(() => store.liveItems);

const title = computed(() =>
  visibleItems.value.length > 1
    ? `批量任务 ${visibleItems.value.length} 个`
    : visibleItems.value[0]?.title || '批量任务',
);

const summary = computed(() => {
  const items = visibleItems.value;
  if (!items.length) return '';
  const totalSuccess = items.reduce((sum, i) => sum + i.successCount, 0);
  const totalFailed = items.reduce((sum, i) => sum + i.failedCount, 0);
  const totalRemaining = items.reduce((sum, i) => sum + i.remainingCount, 0);
  return `成功 ${totalSuccess} / 失败 ${totalFailed} / 剩余 ${totalRemaining}`;
});

const handleStopAll = async () => {
  try {
    await ElMessageBox.confirm('确认停止所有批量任务吗？', '停止批量任务', {
      confirmButtonText: '停止',
      cancelButtonText: '取消',
      type: 'warning',
    });
    store.stopAll();
    ElMessage.success('已停止所有批量任务');
  } catch {
    // cancelled
  }
};
</script>

<style scoped lang="scss">
.global-temu-batch-progress {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 3000;
  width: 420px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 65vh;
  overflow-y: auto;
  transition: width 0.2s ease;
}

.global-temu-batch-progress.is-collapsed {
  width: auto;
  min-width: 190px;
  max-height: none;
  overflow-y: visible;
}

.global-temu-batch-progress__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
}

.global-temu-batch-progress__title {
  font-size: 13px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  font-weight: 600;
}

.global-temu-batch-progress__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}

.global-temu-batch-progress__summary {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.global-temu-batch-progress__stop-btn,
.global-temu-batch-progress__toggle-btn {
  padding: 2px 6px;
  min-height: auto;
  font-size: 11px;
}

.global-temu-batch-progress__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  flex-shrink: 0;
}

.global-temu-batch-progress__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.global-temu-batch-progress__item-head strong {
  font-size: 12px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.global-temu-batch-progress__item-head span {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.global-temu-batch-progress__item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.global-temu-batch-progress__item-meta span {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.global-temu-batch-progress__item-stats {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

/* Transition */
.fade-slide-up-enter-active,
.fade-slide-up-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-slide-up-enter-from,
.fade-slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
