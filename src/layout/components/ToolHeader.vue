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
import { useAppStore } from "@/store/modules/app";
import { useDesign } from "@/hooks/web/useDesign";

export default defineComponent({
  name: "ToolHeader",
  setup() {
    const { getPrefixCls, variables } = useDesign();
    const prefixCls = getPrefixCls("tool-header");
    const appStore = useAppStore();
    const breadcrumb = computed(() => appStore.getBreadcrumb);
    const screenfull = computed(() => appStore.getScreenfull);
    const mobile = computed(() => appStore.getMobile);
    const openMobileMenu = inject<() => void>("openMobileMenu", () => {});

    return () => (
      <header
        id={`${variables.namespace}-tool-header`}
        class={[
          prefixCls,
          "h-[var(--top-tool-height)] pl-12px pr-8px md:pl-16px md:pr-10px flex items-center justify-between",
        ]}
      >
        <div class="tool-header-left flex h-full min-w-0 items-center gap-6px md:gap-8px">
          {mobile.value ? (
            <button
              type="button"
              class="flex h-[var(--top-header-action-size)] w-[var(--top-header-action-size)] items-center justify-center rounded-[var(--top-header-action-radius)] border border-[var(--left-menu-border-color)] bg-[var(--top-header-hover-color)] text-[var(--top-header-text-color)]"
              onClick={openMobileMenu}
            >
              <Icon icon="ep:menu" />
            </button>
          ) : undefined}
          {breadcrumb.value ? (
            <Breadcrumb class="header-breadcrumb min-w-0 lt-md:hidden" />
          ) : undefined}
        </div>

        <div class="tool-header-right flex h-full min-w-0 items-center justify-end gap-2px md:gap-4px">
          <GlobalNotificationToastStack />
          <AdminDataScopeSwitch />
          <GlobalNotificationCenter />
          <div class="client-status-wrapper">
            <ClientStatus />
          </div>
          <div class="custom-hover flex h-[var(--top-header-action-size)] items-center rounded-999px px-6px">
            <ThemeSwitch />
          </div>
          {screenfull.value ? (
            <Screenfull class="custom-hover" color="var(--top-header-text-color)" />
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
}

.tool-header-right {
  overflow: hidden;
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
}

.client-status-wrapper :deep(.header-connection-status__trigger) {
  max-width: 100%;
}

@media (min-width: 768px) and (max-width: 1180px) {
  .#{$prefix-cls} {
    min-height: var(--top-tool-height);
    padding-left: 10px;
    padding-right: 8px;
  }

  .tool-header-left,
  .tool-header-right {
    gap: 6px;
  }

  .tool-header-right > * {
    display: flex;
    min-height: var(--top-header-action-size);
    align-items: center;
  }

  .header-breadcrumb {
    max-width: min(34vw, 280px);
  }
}

@media (max-width: 768px) {
  .#{$prefix-cls} {
    padding-left: 10px;
    padding-right: 6px;
  }

  .tool-header-right {
    gap: 4px;
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
}
</style>
