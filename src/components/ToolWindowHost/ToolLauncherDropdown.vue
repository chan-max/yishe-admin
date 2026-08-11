<script setup lang="ts">
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElMessage } from "element-plus";
import { openToolWindow, getAvailableToolRegistryList } from "@/hooks/web/useToolWindow";

defineOptions({ name: "ToolLauncherDropdown" });

const getModeLabel = (tool: typeof toolRegistryList[number]) => {
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
};
</script>

<template>
  <ElDropdown trigger="click" placement="bottom-end" popper-class="tool-launcher-dropdown-popper">
    <button type="button" class="tool-launcher-trigger" aria-label="工具">
      <Icon icon="ep:monitor" class="th-action-icon" :size="18" />
      <span class="th-action-label">工具</span>
    </button>

    <template #dropdown>
      <ElDropdownMenu class="tool-launcher-menu">
        <ElDropdownItem
          v-for="item in launcherItems"
          :key="item.key"
          class="tool-launcher-menu__item"
          @click="handleOpen(item.key)"
        >
          <div class="tool-launcher-menu__content">
            <div class="tool-launcher-menu__title">
              <Icon :icon="item.icon" class="tool-launcher-menu__title-icon" />
              <span class="tool-launcher-menu__title-text">{{ item.title }}</span>
            </div>
            <span class="tool-launcher-menu__tag">
              {{ item.modeLabel }}
            </span>
          </div>
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>

<style scoped lang="scss">
.tool-launcher-trigger {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: none;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;

  &:active {
    transform: scale(0.94);
  }
}

.tool-launcher-menu__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.tool-launcher-menu__title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 500;
}

.tool-launcher-menu__title-icon {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--el-color-primary);
}

.tool-launcher-menu__tag {
  padding: 1px 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 3px;
  flex-shrink: 0;
}
</style>
