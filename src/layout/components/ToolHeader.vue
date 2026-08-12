<script lang="ts" setup>
import { computed, inject } from "vue";
import { Icon } from "@/components/Icon";
import { UserInfo } from "@/layout/components/UserInfo";
import { Screenfull } from "@/layout/components/Screenfull";
import { Breadcrumb } from "@/layout/components/Breadcrumb";
import { ThemeSwitch } from "@/layout/components/ThemeSwitch";
import { LocaleDropdown } from "@/layout/components/LocaleDropdown";
import { Personalization } from "@/layout/components/Personalization";
import ClientStatus from "@/layout/components/ClientStatus.vue";
import AdminDataScopeSwitch from "@/layout/components/AdminDataScopeSwitch.vue";
import GlobalNotificationCenter from "@/layout/components/GlobalNotificationCenter.vue";
import GlobalNotificationToastStack from "@/layout/components/GlobalNotificationToastStack.vue";
import ToolLauncherDropdown from "@/components/ToolWindowHost/ToolLauncherDropdown.vue";
import { useAppStore } from "@/store/modules/app";
import { useSplitStore } from "@/store/modules/split";
import { useDesign } from "@/hooks/web/useDesign";
import { ElTooltip } from "element-plus";

defineOptions({ name: "ToolHeader" });

const { getPrefixCls, variables } = useDesign();
const prefixCls = getPrefixCls("tool-header");
const appStore = useAppStore();

const breadcrumb = computed(() => appStore.getBreadcrumb);
const screenfull = computed(() => appStore.getScreenfull);
const mobile = computed(() => appStore.getMobile);
const collapse = computed(() => appStore.getCollapse);
const openMobileMenu = inject<() => void>("openMobileMenu", () => {});
const expandDesktopMenu = () => appStore.setCollapse(false);

const { t } = useI18n();
const splitStore = useSplitStore();
</script>

<template>
  <header
    :id="`${variables.namespace}-tool-header`"
    :class="[prefixCls, 'flex items-center justify-between']"
  >
    <!-- 左：菜单切换 + 面包屑 -->
    <div class="th-left flex items-center">
      <button
        v-if="mobile"
        type="button"
        class="th-menu-btn"
        :aria-label="t('layout.toolHeader.openMenu')"
        @click="openMobileMenu"
      >
        <Icon icon="ep:menu" />
      </button>
      <ElTooltip
        v-else-if="collapse"
        :content="t('layout.toolHeader.expandMenu')"
        placement="bottom"
        effect="light"
        :show-after="300"
      >
        <button
          type="button"
          class="th-menu-btn"
          :aria-label="t('layout.toolHeader.expandMenu')"
          @click="expandDesktopMenu"
        >
          <Icon icon="ep:expand" />
        </button>
      </ElTooltip>
      <Breadcrumb v-if="breadcrumb" class="th-breadcrumb lt-md:hidden" />
    </div>

    <!-- 右：操作区（上图标下文字，无外框）+ 用户信息 -->
    <div class="th-right">
      <GlobalNotificationToastStack />

      <div class="th-actions">
        <!-- 通知 — 图标 + 文字，点击跳转 -->
        <GlobalNotificationCenter />

        <!-- 数据域 — 图标 + 文字 + 弹出面板 -->
        <AdminDataScopeSwitch v-if="!mobile" />

        <!-- 工具 — 图标 + 文字 + 下拉菜单 -->
        <ToolLauncherDropdown v-if="!mobile" />

        <!-- 连接状态 — 图标 + 文字 + 弹出面板 -->
        <ClientStatus v-if="!mobile" />

        <!-- 主题 — 图标 + 文字 -->
        <ThemeSwitch v-if="!mobile" />

        <!-- 个性化 — 图标 + 文字 -->
        <Personalization v-if="!mobile" />

        <!-- 全屏 — 图标 + 文字 -->
        <Screenfull
          v-if="screenfull && !mobile"
          color="var(--top-header-text-color)"
        />

        <!-- 分屏 -->
        <button
          type="button"
          class="split-btn"
          :class="{ 'is-active': splitStore.enabled }"
          :title="splitStore.enabled ? t('layout.split.disableSplit') : t('layout.split.enableSplit')"
          @click="splitStore.enabled ? splitStore.disable() : splitStore.enable()"
        >
          <span class="th-action-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
          </span>
          <span class="th-action-label">{{ splitStore.enabled ? t('layout.split.exitSplit') : t('layout.split.split') }}</span>
        </button>

        <!-- 语言切换 — 图标 + 文字 -->
        <LocaleDropdown v-if="!mobile" />
      </div>

      <UserInfo />
    </div>
  </header>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-tool-header;

/* ===== 整体 header ===== */
.#{$prefix-cls} {
  height: var(--top-tool-height);
  padding: 0 12px;
  gap: 8px;
}

/* ===== 左侧 ===== */
.th-left {
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}

.th-menu-btn {
  display: inline-flex;
  width: var(--header-action-size, 34px);
  height: var(--header-action-size, 34px);
  padding: 0;
  color: var(--top-header-text-color);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--left-menu-border-color);
  border-radius: var(--header-action-radius, 8px);
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--header-action-hover-bg);
    border-color: color-mix(in srgb, var(--el-color-primary) 36%, var(--left-menu-border-color));
  }
}

.th-breadcrumb {
  flex-shrink: 1;
  overflow: hidden;
  white-space: nowrap;
}

/* ===== 右：操作区 + 用户信息（无外框） ===== */
.th-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  min-width: 0;
}

.th-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ===== 统一操作按钮：上方图标、下方文字（Past 风格） ===== */
.th-actions :deep(button),
.th-actions :deep(.v-screenfull),
.th-actions :deep(.locale-dropdown-trigger) {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: auto;
  min-width: 48px;
  min-height: calc(var(--top-tool-height) - 14px);
  padding: 4px 6px 3px;
  margin: 0;
  color: var(--top-header-text-color);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 10px;
  box-shadow: none;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;

  &:hover,
  &:focus,
  &:focus-visible {
    color: var(--el-color-primary);
    background-color: color-mix(in srgb, var(--top-header-hover-color) 65%, transparent 35%);
    border: none;
    outline: none;
    transform: scale(1.06);
  }

  &:active {
    transform: scale(0.96);
  }
}

/* 图标区：固定尺寸，保证各图标大小统一、不影响文字位置 */
.th-actions :deep(.th-action-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 18px;
  line-height: 1;
}

.th-actions :deep(.th-action-label) {
  margin-top: 3px;
  font-size: 8px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

/* ===== 响应式 ===== */
@media (width >= 768px) and (width <= 1180px) {
  .#{$prefix-cls} {
    padding: 0 10px;
    gap: 6px;
  }

  .th-actions {
    gap: 3px;
  }
}

@media (width <= 768px) {
  .#{$prefix-cls} {
    padding: 0 8px;
    gap: 4px;
  }

  .th-actions :deep(button),
  .th-actions :deep(.v-screenfull) {
    min-width: 42px;
    padding: 3px 4px 2px;
  }

  .th-actions :deep(.th-action-label) {
    font-size: 7px;
    margin-top: 2px;
  }
}

@media (width <= 640px) {
  .#{$prefix-cls} {
    padding: 0 4px;
    gap: 2px;
  }

  .th-right {
    gap: 6px;
  }
}

/* ===== 分屏按钮 ===== */
.split-btn {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: auto;
  min-width: 48px;
  min-height: calc(var(--top-tool-height) - 14px);
  padding: 4px 6px 3px;
  margin: 0;
  color: var(--top-header-text-color);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 10px;
  box-shadow: none;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.split-btn:hover {
  color: var(--el-color-primary);
  background-color: color-mix(in srgb, var(--top-header-hover-color) 65%, transparent 35%);
  transform: scale(1.06);
}

.split-btn.is-active {
  color: var(--el-color-primary);
  background-color: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

</style>
