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
    <button type="button" class="tool-launcher-trigger">
      <Icon icon="ep:monitor" class="tool-launcher-trigger__icon" />
      <span class="tool-launcher-trigger__label <lg:hidden">工具</span>
      <Icon icon="ep:arrow-down" class="tool-launcher-trigger__caret" />
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
  min-height: calc(var(--top-header-action-size) - 6px);
  align-items: center;
  gap: 5px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--left-menu-border-color) 88%, transparent 12%);
  border-radius: 3px;
  background: color-mix(in srgb, var(--top-header-bg-color) 74%, var(--top-header-hover-color) 26%);
  color: var(--top-header-text-color);
  cursor: pointer;
  box-shadow: inset 0 1px 0 color-mix(in srgb, #ffffff 36%, transparent 64%);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 28%, var(--left-menu-border-color));
    background: color-mix(
      in srgb,
      var(--top-header-hover-color) 80%,
      var(--top-header-bg-color) 20%
    );
    color: var(--el-color-primary);
    box-shadow: inset 0 1px 0 color-mix(in srgb, #ffffff 50%, transparent 50%);
  }
}

.tool-launcher-trigger__icon {
  font-size: 11px;
  color: var(--el-color-primary);
}

.tool-launcher-trigger__label {
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
}

.tool-launcher-trigger__caret {
  font-size: 8px;
  opacity: 0.52;
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
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--el-fill-color-light);
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
</style>
