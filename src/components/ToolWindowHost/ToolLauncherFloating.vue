<script lang="ts" setup>
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { Icon } from "@/components/Icon";
import { openToolWindow, getAvailableToolRegistryList } from "@/hooks/web/useToolWindow";

defineOptions({ name: "ToolLauncherFloating" });

const visible = ref(false);

const isMobile = computed(() => {
  return window.innerWidth < 768;
});

const getModeLabel = (tool: ReturnType<typeof getAvailableToolRegistryList>[number]) => {
  if (tool.component) return '内置'
  return tool.defaultMode === 'window' ? '浮窗' : '全屏'
}

const launcherItems = computed(() =>
  getAvailableToolRegistryList().map((tool) => ({
    key: tool.key,
    title: tool.title,
    icon: tool.icon || "ep:monitor",
    modeLabel: getModeLabel(tool),
  })),
);

const handleOpen = (key: string) => {
  const opened = openToolWindow(key);
  if (!opened) {
    ElMessage.warning("当前工具暂时无法打开，请先检查工具地址配置");
  }
  visible.value = false;
};
</script>

<template>
  <Teleport to="body">
    <div v-if="!isMobile" class="tool-launcher-floating-root">
      <div class="tool-launcher-floating" @click="visible = !visible">
        <Icon icon="ep:tools" class="tool-launcher-floating-icon" />
      </div>
      <div v-if="visible" class="tool-launcher-floating-backdrop" @click.self="visible = false">
        <div class="tool-launcher-floating-popper">
          <div class="tool-launcher-floating-popper-header">
            <span class="tool-launcher-floating-popper-title">工具</span>
            <button class="tool-launcher-floating-popper-close" @click="visible = false">
              <Icon icon="ep:close" />
            </button>
          </div>
          <div class="tool-launcher-floating-popper-list">
            <div
              v-for="item in launcherItems"
              :key="item.key"
              class="tool-launcher-floating-popper-item"
              @click="handleOpen(item.key)"
            >
              <div class="tool-launcher-floating-popper-item-title">
                <Icon :icon="item.icon" class="tool-launcher-floating-popper-item-icon" />
                <span>{{ item.title }}</span>
              </div>
              <span class="tool-launcher-floating-popper-item-tag">{{ item.modeLabel }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tool-launcher-floating-root {
  position: fixed;
  right: 24px;
  bottom: 0;
  z-index: 2147483647 !important;
}

.tool-launcher-floating {
  position: absolute;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 0;
  background: #409eff;
  color: #fff;
  cursor: pointer;
  box-shadow:
    -2px -2px 8px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  overflow: hidden;
  opacity: 1;
}

.tool-launcher-floating::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
  border-radius: 0;
  pointer-events: none;
}

.tool-launcher-floating:hover {
  background: #3a8ee6;
  box-shadow:
    -3px -3px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.tool-launcher-floating-icon {
  width: 12px;
  height: 12px;
}

.tool-launcher-floating-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 0;
  background: transparent;
  pointer-events: auto;
}

.tool-launcher-floating-popper {
  position: absolute;
  right: 0;
  bottom: 30px;
  width: 280px;
  max-height: 60vh;
  overflow: hidden;
  border-radius: 8px 0 8px 8px;
  background: var(--el-bg-color);
  box-shadow: -4px -4px 16px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.15s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tool-launcher-floating-popper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.tool-launcher-floating-popper-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tool-launcher-floating-popper-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-launcher-floating-popper-close:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.tool-launcher-floating-popper-list {
  max-height: calc(60vh - 40px);
  overflow-y: auto;
  padding: 6px;
}

.tool-launcher-floating-popper-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.tool-launcher-floating-popper-item:hover {
  background: var(--el-fill-color-light);
}

.tool-launcher-floating-popper-item-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.tool-launcher-floating-popper-item-icon {
  font-size: 14px;
  color: var(--el-color-primary);
}

.tool-launcher-floating-popper-item-tag {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--el-fill-color);
  font-size: 10px;
  color: var(--el-text-color-secondary);
}
</style>
