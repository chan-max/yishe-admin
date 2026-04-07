<script setup lang="ts">
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElMessage } from 'element-plus'
import { openToolWindow, getAvailableToolRegistryList } from '@/hooks/web/useToolWindow'

defineOptions({ name: 'ToolLauncherDropdown' })

const getModeLabel = (mode?: 'window' | 'fullscreen') => (mode === 'window' ? '浮窗' : '全屏')

const launcherItems = computed(() =>
  getAvailableToolRegistryList().map((tool) => ({
    key: tool.key,
    title: tool.title,
    icon: tool.icon || 'ep:monitor',
    modeLabel: getModeLabel(tool.defaultMode),
  }))
)

const handleOpen = (key: string) => {
  const opened = openToolWindow(key)
  if (!opened) {
    ElMessage.warning('当前工具暂时无法打开，请先检查工具地址配置')
  }
}
</script>

<template>
  <ElDropdown trigger="click" placement="bottom-end">
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
  border: 1px solid rgba(77, 95, 121, 0.34);
  border-radius: 3px;
  background: #0d131d;
  color: #d8e3f1;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;

  &:hover {
    border-color: rgba(111, 222, 160, 0.28);
    background: #121a25;
    color: #80e4af;
  }
}

.tool-launcher-trigger__icon {
  font-size: 11px;
  color: #6fdea0;
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

:deep(.tool-launcher-menu) {
  padding: 4px;
  border: 1px solid rgba(36, 48, 66, 0.96);
  background: #0c121a;
}

:deep(.tool-launcher-menu__item) {
  padding: 0;
  border-radius: 4px;
  line-height: normal;
  color: #d8e3f1;
}

:deep(.tool-launcher-menu__item:not(.is-disabled):focus) {
  background: transparent;
}

.tool-launcher-menu__content {
  display: flex;
  min-width: 168px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 4px;
  transition: background-color 0.18s ease, color 0.18s ease;
}

:deep(.tool-launcher-menu__item:not(.is-disabled):hover .tool-launcher-menu__content) {
  background: #111a26;
}

.tool-launcher-menu__title {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  font-family:
    'Cascadia Code',
    'Consolas',
    'Courier New',
    monospace;
  font-size: 10px;
  font-weight: 500;
}

.tool-launcher-menu__title-icon {
  flex-shrink: 0;
  font-size: 11px;
  color: #67d697;
}

.tool-launcher-menu__title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-launcher-menu__tag {
  flex-shrink: 0;
  padding: 1px 4px;
  border: 1px solid rgba(103, 214, 151, 0.12);
  border-radius: 3px;
  background: rgba(103, 214, 151, 0.04);
  font-family:
    'Cascadia Code',
    'Consolas',
    'Courier New',
    monospace;
  font-size: 8px;
  color: #6fdea0;
}
</style>
