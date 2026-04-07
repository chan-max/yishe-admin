<script setup lang="ts">
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElMessage } from "element-plus";
import { openToolWindow, getAvailableToolRegistryList } from "@/hooks/web/useToolWindow";

defineOptions({ name: "ToolLauncherDropdown" });

const getModeLabel = (mode?: "window" | "fullscreen") => (mode === "window" ? "浮窗" : "全屏");

const launcherItems = computed(() =>
  getAvailableToolRegistryList().map((tool) => ({
    key: tool.key,
    title: tool.title,
    icon: tool.icon || "ep:monitor",
    modeLabel: getModeLabel(tool.defaultMode),
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
  min-width: 168px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 4px;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.tool-launcher-menu__title {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  font-family: "Cascadia Code", "Consolas", "Courier New", monospace;
  font-size: 10px;
  font-weight: 500;
}

.tool-launcher-menu__title-icon {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--el-color-primary);
}

.tool-launcher-menu__title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-launcher-menu__tag {
  flex-shrink: 0;
  padding: 1px 4px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 16%, transparent 84%);
  border-radius: 3px;
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent 92%);
  font-family: "Cascadia Code", "Consolas", "Courier New", monospace;
  font-size: 8px;
  color: var(--el-color-primary);
}

:global(.tool-launcher-dropdown-popper.el-popper) {
  border: 1px solid color-mix(in srgb, var(--app-content-border-color) 78%, transparent 22%) !important;
  background: color-mix(in srgb, var(--el-bg-color) 98%, transparent 2%) !important;
  box-shadow:
    0 12px 28px rgba(15, 23, 42, 0.12),
    0 1px 0 color-mix(in srgb, #ffffff 28%, transparent 72%) inset !important;
  padding: 4px !important;
  backdrop-filter: blur(12px);
}

:global(.tool-launcher-dropdown-popper .tool-launcher-menu) {
  padding: 0;
  border: none;
  background: transparent;
}

:global(.tool-launcher-dropdown-popper .tool-launcher-menu__item) {
  padding: 0;
  border-radius: 4px;
  line-height: normal;
  color: var(--el-text-color-primary);
}

:global(.tool-launcher-dropdown-popper .tool-launcher-menu__item:not(.is-disabled):focus) {
  background: transparent;
}

:global(.tool-launcher-dropdown-popper .tool-launcher-menu__item:not(.is-disabled):hover) {
  background: transparent;
}

:global(
  .tool-launcher-dropdown-popper
    .tool-launcher-menu__item:not(.is-disabled):hover
    .tool-launcher-menu__content
) {
  background: var(--el-fill-color-light);
}
</style>
