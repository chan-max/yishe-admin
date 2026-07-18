<script lang="tsx">
import { computed, defineComponent, inject } from "vue";
import { Icon } from "@/components/Icon";
import { UserInfo } from "@/layout/components/UserInfo";
import { Screenfull } from "@/layout/components/Screenfull";
import { Breadcrumb } from "@/layout/components/Breadcrumb";
import { ThemeSwitch } from "@/layout/components/ThemeSwitch";
import ClientStatus from "@/layout/components/ClientStatus.vue";
import AdminDataScopeSwitch from "@/layout/components/AdminDataScopeSwitch.vue";
import GlobalNotificationCenter from "@/layout/components/GlobalNotificationCenter.vue";
import GlobalNotificationToastStack from "@/layout/components/GlobalNotificationToastStack.vue";
import ToolLauncherDropdown from "@/components/ToolWindowHost/ToolLauncherDropdown.vue";
import { useAppStore } from "@/store/modules/app";
import { useDesign } from "@/hooks/web/useDesign";
import { ElTooltip } from "element-plus";

export default defineComponent({
  name: "ToolHeader",
  setup() {
    const { getPrefixCls, variables } = useDesign();
    const prefixCls = getPrefixCls("tool-header");
    const appStore = useAppStore();
    const breadcrumb = computed(() => appStore.getBreadcrumb);
    const screenfull = computed(() => appStore.getScreenfull);
    const mobile = computed(() => appStore.getMobile);
    const collapse = computed(() => appStore.getCollapse);
    const openMobileMenu = inject<() => void>("openMobileMenu", () => {});
    const expandDesktopMenu = () => appStore.setCollapse(false);

    return () => (
      <header
        id={`${variables.namespace}-tool-header`}
        class={[prefixCls, "flex h-[var(--top-tool-height)] items-center justify-between"]}
      >
        <div class="tool-header-left flex h-full min-w-0 items-center">
          {mobile.value ? (
            <button
              type="button"
              class="tool-header-menu-toggle"
              aria-label="打开菜单"
              onClick={openMobileMenu}
            >
              <Icon icon="ep:menu" />
            </button>
          ) : collapse.value ? (
            <ElTooltip content="展开菜单" placement="bottom" effect="light" showAfter={300}>
              <button
                type="button"
                class="tool-header-menu-toggle"
                aria-label="展开菜单"
                onClick={expandDesktopMenu}
              >
                <Icon icon="ep:expand" />
              </button>
            </ElTooltip>
          ) : undefined}
          {breadcrumb.value ? (
            <Breadcrumb class="header-breadcrumb min-w-0 lt-md:hidden" />
          ) : undefined}
        </div>

        <div class="tool-header-right flex h-full min-w-0 items-center justify-end">
          <GlobalNotificationToastStack />
          {!mobile.value ? <AdminDataScopeSwitch /> : undefined}
          <GlobalNotificationCenter />
          {!mobile.value ? <ToolLauncherDropdown /> : undefined}
          {!mobile.value ? (
            <div class="client-status-wrapper">
              <ClientStatus />
            </div>
          ) : undefined}
          {!mobile.value ? (
            <div class="custom-hover tool-header-theme-switch flex h-[var(--top-header-action-size)] items-center rounded-999px">
              <ThemeSwitch />
            </div>
          ) : undefined}
          {screenfull.value ? (
            !mobile.value ? (
              <Screenfull class="custom-hover" color="var(--top-header-text-color)" />
            ) : undefined
          ) : undefined}
          <UserInfo />
        </div>
      </header>
    );
  },
});
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-tool-header;

.#{$prefix-cls} {
  min-height: var(--top-tool-height);
  padding-left: 14px;
  padding-right: 14px;
  color: var(--top-header-text-color);
}

.#{$prefix-cls} :deep(.custom-hover) {
  min-height: var(--top-header-action-size);
}

.#{$prefix-cls} :deep(.admin-data-scope) {
  flex-shrink: 1;
}

.tool-header-left {
  overflow: hidden;
  gap: 8px;
}

.tool-header-menu-toggle {
  display: inline-flex;
  width: var(--top-header-action-size);
  height: var(--top-header-action-size);
  flex: 0 0 var(--top-header-action-size);
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--left-menu-border-color);
  border-radius: var(--top-header-action-radius);
  background: transparent;
  color: var(--top-header-text-color);
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease;
}

.tool-header-menu-toggle:hover,
.tool-header-menu-toggle:focus-visible {
  outline: none;
  border-color: color-mix(in srgb, var(--el-color-primary) 36%, var(--left-menu-border-color));
  background: var(--top-header-hover-color);
}

.tool-header-right {
  gap: 10px;
  overflow: visible;
  padding-left: 10px;
}

.tool-header-right > * {
  display: flex;
  min-height: var(--top-header-action-size);
  align-items: center;
}

.tool-header-theme-switch {
  padding-inline: 6px;
}

.header-breadcrumb {
  flex-shrink: 1;
  overflow: hidden;
  white-space: nowrap;
}

.client-status-wrapper {
  display: flex;
  min-width: 0;
  flex-shrink: 1;
  justify-content: flex-end;
  white-space: nowrap;
  padding-right: 2px;
}

.client-status-wrapper :deep(.header-connection-status__trigger) {
  max-width: 100%;
}

@media (min-width: 768px) and (max-width: 1180px) {
  .#{$prefix-cls} {
    padding-left: 12px;
    padding-right: 10px;
  }

  .tool-header-right {
    gap: 8px;
  }

  .tool-header-left {
    gap: 6px;
  }

  .tool-header-right {
    padding-left: 8px;
  }

  .header-breadcrumb {
    max-width: min(34vw, 280px);
  }
}

@media (max-width: 768px) {
  .#{$prefix-cls} {
    padding-left: 10px;
    padding-right: 8px;
  }

  .tool-header-right {
    gap: 4px;
    padding-left: 4px;
  }

  .client-status-wrapper {
    flex-shrink: 0;
  }
}

@media (max-width: 640px) {
  .#{$prefix-cls} {
    padding-left: 8px;
    padding-right: 4px;
  }

  .tool-header-left {
    gap: 4px;
  }

  .tool-header-right {
    gap: 2px;
    padding-left: 2px;
  }
}
</style>
