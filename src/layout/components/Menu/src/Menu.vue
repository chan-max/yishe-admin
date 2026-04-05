<script lang="tsx">
import { Icon } from "@/components/Icon";
import { ElTooltip } from "element-plus";
import { useDesign } from "@/hooks/web/useDesign";
import { usePermissionStore } from "@/store/modules/permission";
import { useAppStore } from "@/store/modules/app";
import { isUrl } from "@/utils/is";
import { pathResolve } from "@/utils/routerHelper";
import { Logo } from "@/layout/components/Logo";
import { usePsdSetRuntimeState } from "@/services/psdSetRuntimeState";
import { usePublishTaskRuntimeState } from "@/services/publishTaskRuntimeState";
import { isClientServiceRuntimeBusy } from "@/services/clientServiceRuntime";
import {
  ensureServiceHealthInitialized,
  isServiceHealthKey,
  resolveServiceHealthMenuTooltip,
  resolveServiceHealthTone,
  serviceHealthStates,
} from "@/services/serviceHealthState";
import {
  getClientServiceRuntime,
  type ClientPluginKey,
  useClientNodeStore,
} from "@/store/modules/clientNode";
import { type PsAutomationStatusEvent, websocketClient } from "@/services/websocketClient";

const { getPrefixCls } = useDesign();
const prefixCls = getPrefixCls("menu");

export default defineComponent({
  name: "Menu",
  setup() {
    const appStore = useAppStore();
    const permissionStore = usePermissionStore();
    const { push, currentRoute } = useRouter();
    const closeMobileMenu = inject<() => void>("closeMobileMenu", () => {});
    const logo = computed(() => appStore.logo);

    const routers = computed(() =>
      permissionStore.getRouters.filter((route) => !route.meta?.hidden),
    );
    const activeMenu = computed(
      () => (currentRoute.value.meta.activeMenu as string) || currentRoute.value.path,
    );
    const expandedMenus = ref<Record<string, boolean>>({});
    const {
      userAutoSchedulingEnabled,
      isAnyPsdSetProcessing,
      refresh: refreshPsdSetRuntime,
      setUserAutoSchedulingEnabled,
    } = usePsdSetRuntimeState();
    const {
      isAnyPublishTaskRunning,
      menuStatusTone: publishTaskMenuStatusTone,
      tooltipText: publishTaskTooltipText,
      refresh: refreshPublishTaskRuntime,
    } = usePublishTaskRuntimeState();
    const clientNodeStore = useClientNodeStore();
    clientNodeStore.ensureInitialized();

    const menuStatusRouteMap: Record<string, string> = {
      "/external/browser-automation": "browser-automation",
      "/external/ps-automation": "ps-automation",
      "/external/google-art": "google-art",
    };

    const routeStatusMap = computed<Record<string, "available" | "degraded" | "offline">>(() => {
      const result: Record<string, "available" | "degraded" | "offline"> = {};
      Object.entries(menuStatusRouteMap).forEach(([routePath, pluginKey]) => {
        result[routePath] =
          clientNodeStore.pluginStatusMap[
            pluginKey as keyof typeof clientNodeStore.pluginStatusMap
          ] || "offline";
      });
      result["/product/queue"] = publishTaskMenuStatusTone.value;
      return result;
    });

    const routeRunningMap = computed<Record<string, boolean>>(() => {
      const result: Record<string, boolean> = {};

      Object.entries(menuStatusRouteMap).forEach(([routePath, pluginKey]) => {
        result[routePath] = clientNodeStore.clients.some((client) => {
          if (!client.isOnline) return false;
          const serviceRuntime = getClientServiceRuntime(client, pluginKey as ClientPluginKey);
          return isClientServiceRuntimeBusy(serviceRuntime);
        });
      });
      result["/product/queue"] = isAnyPublishTaskRunning.value;

      return result;
    });

    const handlePsAutomationStatus = (event: PsAutomationStatusEvent) => {
      const autoSchedulingEnabled =
        typeof event?.autoDispatchEnabled === "boolean"
          ? event.autoDispatchEnabled
          : event?.autoSchedulingEnabled;

      if (typeof autoSchedulingEnabled === "boolean") {
        setUserAutoSchedulingEnabled(autoSchedulingEnabled);
      }
    };

    const renderMenuStatusHint = (dotNode: JSX.Element, title: string) => {
      return (
        <ElTooltip
          content={title}
          placement="right"
          effect="light"
          showAfter={0}
          hideAfter={0}
          popperClass={`${prefixCls}__status-tooltip-popper`}
        >
          <span class={`${prefixCls}__status-indicator`} aria-label={title}>
            {dotNode}
          </span>
        </ElTooltip>
      );
    };

    const renderStatusDot = (routePath: string) => {
      const status = routeStatusMap.value[routePath];
      if (!status) {
        return undefined;
      }
      const running = routeRunningMap.value[routePath];

      const titleMap: Record<string, Record<"available" | "degraded" | "offline", string>> = {
        "/external/browser-automation": {
          available: "浏览器自动化可用",
          degraded: "浏览器自动化已连接，但当前不可执行",
          offline: "浏览器自动化不可用",
        },
        "/external/ps-automation": {
          available: "套图制作可调用",
          degraded: "PS 自动化已连接，但当前不可执行",
          offline: "PS 自动化不可用",
        },
        "/external/google-art": {
          available: "Google Art 可用",
          degraded: "Google Art 已连接，但当前不可执行",
          offline: "Google Art 不可用",
        },
        "/product/queue": {
          available: "发布任务可执行",
          degraded: "发布任务可执行",
          offline: "发布任务暂不可执行",
        },
      };

      const title =
        routePath === "/product/queue"
          ? publishTaskTooltipText.value
          : running
            ? "当前有任务正在执行"
            : titleMap[routePath]?.[status];

      return renderMenuStatusHint(
        <span
          class={[
            `${prefixCls}__status-dot`,
            running ? `${prefixCls}__status-dot--running` : `${prefixCls}__status-dot--${status}`,
          ]}
        />,
        title || "当前不可用",
      );
    };

    const renderServiceHealthDot = (route: AppRouteRecordRaw) => {
      const statusKey = route.meta?.serviceStatusKey;
      if (!isServiceHealthKey(statusKey)) {
        return undefined;
      }

      ensureServiceHealthInitialized(statusKey);
      const snapshot = serviceHealthStates[statusKey];
      const tone = resolveServiceHealthTone(snapshot);
      const title = resolveServiceHealthMenuTooltip(snapshot);

      return renderMenuStatusHint(
        <span class={[`${prefixCls}__status-dot`, `${prefixCls}__status-dot--${tone}`]} />,
        title,
      );
    };

    const isPsdSetRoute = (routePath: string) => routePath === "/product/psd-set";
    const shouldUseRunningLinkHighlight = (routePath: string) => routePath === "/product/queue";

    const renderPsdSetAutoDot = (routePath: string) => {
      if (!isPsdSetRoute(routePath)) {
        return undefined;
      }

      return renderMenuStatusHint(
        <span
          class={[
            `${prefixCls}__psd-status-dot`,
            userAutoSchedulingEnabled.value
              ? `${prefixCls}__psd-status-dot--enabled`
              : `${prefixCls}__psd-status-dot--muted`,
          ]}
        />,
        userAutoSchedulingEnabled.value ? "自动处理已开启" : "自动处理未开启",
      );
    };

    const getRoutePath = (route: AppRouteRecordRaw, parentPath = "/") => {
      return isUrl(route.path) ? route.path : pathResolve(parentPath, route.path);
    };

    const getVisibleChildren = (route: AppRouteRecordRaw) => {
      return (route.children ?? []).filter((child) => !child.meta?.hidden);
    };

    const hasActiveChild = (route: AppRouteRecordRaw) => {
      const routePath = getRoutePath(route);
      return getVisibleChildren(route).some(
        (child) => getRoutePath(child, routePath) === activeMenu.value,
      );
    };

    const isRouteActive = (route: AppRouteRecordRaw) => {
      return getRoutePath(route) === activeMenu.value || hasActiveChild(route);
    };

    const selectMenu = (path: string) => {
      if (isUrl(path)) {
        window.open(path);
      } else {
        push(path);
      }
      closeMobileMenu();
    };

    const toggleSection = (routePath: string) => {
      expandedMenus.value = {
        ...expandedMenus.value,
        [routePath]: !expandedMenus.value[routePath],
      };
    };

    watch(
      routers,
      (value) => {
        const nextExpanded: Record<string, boolean> = {};
        value.forEach((route) => {
          const routePath = getRoutePath(route);
          nextExpanded[routePath] =
            expandedMenus.value[routePath] ?? getVisibleChildren(route).length > 0;
        });
        expandedMenus.value = nextExpanded;
      },
      { immediate: true, deep: true },
    );

    onMounted(() => {
      void refreshPsdSetRuntime();
      void refreshPublishTaskRuntime();
      websocketClient.events.on("psAutomationStatus", handlePsAutomationStatus);
    });

    onUnmounted(() => {
      websocketClient.events.off("psAutomationStatus", handlePsAutomationStatus);
    });

    return () => (
      <nav id={prefixCls} class={`${prefixCls} h-full`}>
        <div class={`${prefixCls}__panel`}>
          {logo.value ? (
            <div class={`${prefixCls}__logo`}>
              <Logo class={`${prefixCls}__logo-inner`} />
            </div>
          ) : undefined}

          {routers.value.map((route) => {
            const routePath = getRoutePath(route);
            const children = getVisibleChildren(route);
            const sectionActive = isRouteActive(route);
            const expanded = expandedMenus.value[routePath];

            if (!children.length) {
              return (
                <button
                  type="button"
                  key={routePath}
                  class={[
                    `${prefixCls}__section`,
                    `${prefixCls}__section--leaf`,
                    { [`${prefixCls}__section--active`]: sectionActive },
                  ]}
                  onClick={() => selectMenu(routePath)}
                >
                  <div class={`${prefixCls}__section-head`}>
                    <div class={`${prefixCls}__section-label`}>
                      {route.meta?.icon ? (
                        <Icon class={`${prefixCls}__section-icon`} icon={route.meta.icon} />
                      ) : undefined}
                      <span class={`${prefixCls}__section-title`}>{route.meta?.title}</span>
                    </div>
                    {renderServiceHealthDot(route)}
                  </div>
                </button>
              );
            }

            return (
              <section
                key={routePath}
                class={[
                  `${prefixCls}__section`,
                  { [`${prefixCls}__section--active`]: sectionActive },
                ]}
              >
                <button
                  type="button"
                  class={`${prefixCls}__section-head`}
                  onClick={() => toggleSection(routePath)}
                >
                  <div class={`${prefixCls}__section-label`}>
                    {route.meta?.icon ? (
                      <Icon class={`${prefixCls}__section-icon`} icon={route.meta.icon} />
                    ) : undefined}
                    <span class={`${prefixCls}__section-title`}>{route.meta?.title}</span>
                  </div>
                  <Icon
                    class={`${prefixCls}__section-arrow`}
                    icon={expanded ? "ep:arrow-up" : "ep:arrow-down"}
                  />
                </button>

                {expanded ? (
                  <div class={`${prefixCls}__links`}>
                    {children.map((child) => {
                      const childPath = getRoutePath(child, routePath);
                      return (
                        <button
                          type="button"
                          key={childPath}
                          title={String(child.meta?.title ?? "")}
                          class={[
                            `${prefixCls}__link`,
                            {
                              [`${prefixCls}__link--active`]: childPath === activeMenu.value,
                              [`${prefixCls}__link--psd-running`]:
                                isPsdSetRoute(childPath) && isAnyPsdSetProcessing.value,
                              [`${prefixCls}__link--service-running`]:
                                shouldUseRunningLinkHighlight(childPath) &&
                                !!routeRunningMap.value[childPath],
                            },
                          ]}
                          onClick={() => selectMenu(childPath)}
                        >
                          <span class={`${prefixCls}__link-text`}>{child.meta?.title}</span>
                          {renderPsdSetAutoDot(childPath) ||
                            renderServiceHealthDot(child) ||
                            renderStatusDot(childPath)}
                        </button>
                      );
                    })}
                  </div>
                ) : undefined}
              </section>
            );
          })}
        </div>
      </nav>
    );
  },
});
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-menu;

.#{$prefix-cls} {
  height: 100%;
  border-right: 1px solid var(--left-menu-border-color, #2f3542);
  background: var(--left-menu-bg-color, #141414);
  overflow-y: scroll;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: var(--app-scrollbar-thumb-color) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: var(--app-scrollbar-thumb-color);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--app-scrollbar-thumb-hover-color);
  }

  &__panel {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: 100%;
    padding: 0 var(--left-menu-panel-padding-x) var(--left-menu-panel-padding-bottom);
  }

  &__logo {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: var(--left-menu-logo-padding-top) 0 var(--left-menu-logo-padding-bottom);
    margin-bottom: var(--left-menu-logo-margin-bottom);
    border-bottom: 1px solid var(--left-menu-divider-color);
    background: var(--left-menu-bg-color, #141414);
  }

  &__logo-inner {
    width: 100%;
    border: 0 !important;
  }

  &__section {
    width: 100%;
    padding: var(--left-menu-section-padding-top) 0 var(--left-menu-section-padding-bottom);
    border-bottom: 1px solid var(--left-menu-divider-color);
  }

  &__section--leaf {
    display: block;
    padding-bottom: 3px;
    border: none;
    background: transparent;
    appearance: none;
    -webkit-appearance: none;
    outline: none;
    box-shadow: none;
  }

  &__section-head {
    appearance: none;
    -webkit-appearance: none;
    border: none;
    outline: none;
    box-shadow: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--left-menu-section-head-padding-y) var(--left-menu-section-head-padding-x);
    border-radius: var(--left-menu-section-radius);
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition:
      background-color var(--transition-time-02),
      color var(--transition-time-02);
  }

  &__section-head:hover {
    background: var(--left-menu-hover-color);
  }

  &__section-head::-moz-focus-inner {
    border: 0;
    padding: 0;
  }

  &__section-head:focus {
    outline: none;
  }

  &__section-head:focus-visible {
    outline: 2px solid rgb(64 158 255 / 32%);
    outline-offset: 1px;
  }

  &__section-label {
    display: flex;
    align-items: center;
    gap: var(--left-menu-section-gap);
    flex: 1;
    min-width: 0;
  }

  &__section-icon {
    flex: none;
    font-size: var(--left-menu-section-icon-size);
    color: var(--left-menu-icon-color);
  }

  &__section-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: var(--left-menu-title-color);
    font-size: var(--left-menu-section-title-size);
    font-weight: 600;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__section-arrow {
    flex: none;
    font-size: var(--left-menu-section-arrow-size);
    color: var(--left-menu-arrow-color);
  }

  &__section--active > .#{$prefix-cls}__section-head {
    background: var(--left-menu-hover-color);
  }

  &__section--active > .#{$prefix-cls}__section-head .#{$prefix-cls}__section-icon,
  &__section--active > .#{$prefix-cls}__section-head .#{$prefix-cls}__section-title {
    color: var(--left-menu-text-active-color);
  }

  &__links {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--left-menu-links-gap-y) var(--left-menu-links-gap-x);
    padding: var(--left-menu-links-padding-top) var(--left-menu-links-padding-right) 0
      var(--left-menu-links-padding-left);
  }

  &__link {
    appearance: none;
    -webkit-appearance: none;
    display: flex;
    align-items: center;
    width: 100%;
    min-height: var(--left-menu-link-min-height);
    min-width: 0;
    padding: var(--left-menu-link-padding-y) var(--left-menu-link-padding-x);
    border: 0;
    border-left: 2px solid transparent;
    border-radius: 0 var(--left-menu-link-radius) var(--left-menu-link-radius) 0;
    background: transparent;
    outline: none;
    box-shadow: none;
    color: var(--left-menu-link-text-color);
    cursor: pointer;
    text-align: left;
    transition:
      background-color var(--transition-time-02),
      border-color var(--transition-time-02),
      color var(--transition-time-02),
      transform var(--transition-time-02);
  }

  &__link:hover {
    background: var(--left-menu-link-hover-bg);
    border-left-color: var(--left-menu-link-active-border-color);
    color: var(--left-menu-link-hover-color);
    transform: translateX(1px);
  }

  &__link::-moz-focus-inner {
    border: 0;
    padding: 0;
  }

  &__link:focus {
    outline: none;
  }

  &__link:focus-visible {
    outline: 2px solid rgb(64 158 255 / 28%);
    outline-offset: 1px;
  }

  &__link--active {
    background: var(--left-menu-link-active-bg);
    border-left-color: var(--left-menu-link-active-border-color);
    color: var(--left-menu-link-active-color);
  }

  &__link-text {
    display: block;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: var(--left-menu-link-font-size);
    font-weight: 500;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__status-indicator {
    position: relative;
    display: inline-flex;
    flex: none;
    align-items: center;
  }

  :global(.#{$prefix-cls}__status-tooltip-popper.el-popper),
  :global(.#{$prefix-cls}__status-tooltip-popper.el-popper .el-popper__arrow) {
    animation: none !important;
    transition: none !important;
  }

  &__psd-status-dot {
    flex: none;
    position: relative;
    width: var(--left-menu-psd-dot-size);
    height: var(--left-menu-psd-dot-size);
    margin-left: 8px;
    border-radius: 999px;
    background: rgb(148 163 184 / 88%);
    box-shadow: 0 0 0 1px rgb(148 163 184 / 14%);
  }

  &__psd-status-dot::after {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    content: "";
    opacity: 0;
    transform: scale(1);
  }

  &__psd-status-dot--enabled {
    background: #34d399;
    box-shadow:
      0 0 0 1px rgb(52 211 153 / 22%),
      0 0 9px rgb(52 211 153 / 28%);
    animation: status-dot-breathe-available 2.2s ease-in-out infinite;
  }

  &__psd-status-dot--enabled::after {
    background: rgb(52 211 153 / 26%);
    animation: status-dot-wave-available 2.2s ease-out infinite;
  }

  &__psd-status-dot--running {
    background: #f97316;
    box-shadow:
      0 0 0 1px rgb(249 115 22 / 24%),
      0 0 10px rgb(249 115 22 / 38%);
    animation: status-dot-breathe-running 1.9s ease-in-out infinite;
  }

  &__psd-status-dot--running::after {
    background: rgb(249 115 22 / 24%);
    animation: status-dot-wave-running 1.9s ease-out infinite;
  }

  &__psd-status-dot--muted {
    background: rgb(148 163 184 / 88%);
    box-shadow: 0 0 0 1px rgb(148 163 184 / 12%);
  }

  &__link--psd-running {
    border-left-color: rgb(250 204 21 / 72%);
    background: rgb(250 204 21 / 18%);
    box-shadow:
      inset 0 0 0 1px rgb(250 204 21 / 20%),
      inset 2px 0 0 rgb(250 204 21 / 58%);
    animation: psd-link-amber-breathe 2.2s ease-in-out infinite;
  }

  &__link--service-running {
    border-left-color: rgb(45 212 191 / 70%);
    background: rgb(45 212 191 / 14%);
    box-shadow:
      inset 0 0 0 1px rgb(45 212 191 / 16%),
      inset 2px 0 0 rgb(45 212 191 / 52%);
    animation: service-link-teal-breathe 2.4s ease-in-out infinite;
  }

  &__status-dot {
    flex: none;
    position: relative;
    width: var(--left-menu-status-dot-size);
    height: var(--left-menu-status-dot-size);
    margin-left: 6px;
    border-radius: 999px;
    background: var(--el-text-color-placeholder);
    box-shadow: 0 0 0 1px rgb(255 255 255 / 10%);
  }

  &__status-dot::before,
  &__status-dot::after {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    content: "";
  }

  &__status-dot::before {
    background: inherit;
    opacity: 0.95;
  }

  &__status-dot::after {
    opacity: 0;
    transform: scale(1);
  }

  &__status-dot--available {
    background: #34d399;
    box-shadow:
      0 0 0 1px rgb(52 211 153 / 22%),
      0 0 10px rgb(52 211 153 / 40%),
      0 0 18px rgb(52 211 153 / 18%);
    animation: status-dot-breathe-available 2.2s ease-in-out infinite;
  }

  &__status-dot--available::after {
    background: rgb(52 211 153 / 30%);
    animation: status-dot-wave-available 2.2s ease-out infinite;
  }

  &__status-dot--degraded {
    background: #f59e0b;
    box-shadow:
      0 0 0 1px rgb(245 158 11 / 22%),
      0 0 10px rgb(245 158 11 / 34%),
      0 0 18px rgb(245 158 11 / 14%);
    animation: status-dot-breathe-degraded 2.6s ease-in-out infinite;
  }

  &__status-dot--degraded::after {
    background: rgb(245 158 11 / 24%);
    animation: status-dot-wave-degraded 2.6s ease-out infinite;
  }

  &__status-dot--running {
    background: #14b8a6;
    box-shadow:
      0 0 0 1px rgb(20 184 166 / 22%),
      0 0 12px rgb(20 184 166 / 36%),
      0 0 20px rgb(20 184 166 / 16%);
    animation: status-dot-breathe-running 1.9s ease-in-out infinite;
  }

  &__status-dot--running::after {
    background: rgb(20 184 166 / 26%);
    animation: status-dot-wave-running 1.9s ease-out infinite;
  }

  &__status-dot--offline {
    background: rgb(148 163 184 / 88%);
    box-shadow:
      0 0 0 1px rgb(148 163 184 / 12%),
      0 0 8px rgb(148 163 184 / 12%);
  }

  &__link:hover &__status-dot--offline,
  &__link--active &__status-dot--offline {
    animation: status-dot-breathe-offline 3s ease-in-out infinite;
  }

  @media (max-width: 1024px) {
    &__links {
      grid-template-columns: 1fr;
      padding-left: calc(var(--left-menu-links-padding-left) + 2px);
    }
  }
}

@keyframes status-dot-breathe-available {
  0%,
  100% {
    transform: scale(0.96);
    box-shadow:
      0 0 0 1px rgb(52 211 153 / 20%),
      0 0 8px rgb(52 211 153 / 28%),
      0 0 14px rgb(52 211 153 / 12%);
  }
  50% {
    transform: scale(1.08);
    box-shadow:
      0 0 0 1px rgb(52 211 153 / 28%),
      0 0 14px rgb(52 211 153 / 48%),
      0 0 26px rgb(52 211 153 / 24%);
  }
}

@keyframes status-dot-wave-available {
  0% {
    opacity: 0.42;
    transform: scale(1);
  }
  70%,
  100% {
    opacity: 0;
    transform: scale(2.8);
  }
}

@keyframes status-dot-breathe-degraded {
  0%,
  100% {
    transform: scale(0.97);
    box-shadow:
      0 0 0 1px rgb(245 158 11 / 18%),
      0 0 7px rgb(245 158 11 / 22%),
      0 0 12px rgb(245 158 11 / 10%);
  }
  50% {
    transform: scale(1.06);
    box-shadow:
      0 0 0 1px rgb(245 158 11 / 26%),
      0 0 12px rgb(245 158 11 / 36%),
      0 0 20px rgb(245 158 11 / 18%);
  }
}

@keyframes status-dot-wave-degraded {
  0% {
    opacity: 0.34;
    transform: scale(1);
  }
  75%,
  100% {
    opacity: 0;
    transform: scale(2.4);
  }
}

@keyframes status-dot-breathe-offline {
  0%,
  100% {
    transform: scale(1);
    box-shadow:
      0 0 0 1px rgb(148 163 184 / 10%),
      0 0 6px rgb(148 163 184 / 10%);
  }
  50% {
    transform: scale(1.03);
    box-shadow:
      0 0 0 1px rgb(148 163 184 / 14%),
      0 0 10px rgb(148 163 184 / 16%);
  }
}

@keyframes status-dot-breathe-running {
  0%,
  100% {
    transform: scale(0.96);
    box-shadow:
      0 0 0 1px rgb(249 115 22 / 18%),
      0 0 8px rgb(249 115 22 / 22%),
      0 0 14px rgb(249 115 22 / 10%);
  }
  50% {
    transform: scale(1.08);
    box-shadow:
      0 0 0 1px rgb(249 115 22 / 28%),
      0 0 14px rgb(249 115 22 / 42%),
      0 0 22px rgb(249 115 22 / 18%);
  }
}

@keyframes status-dot-wave-running {
  0% {
    opacity: 0.36;
    transform: scale(1);
  }
  75%,
  100% {
    opacity: 0;
    transform: scale(2.5);
  }
}

@keyframes psd-link-amber-breathe {
  0%,
  100% {
    box-shadow:
      inset 0 0 0 1px rgb(250 204 21 / 14%),
      inset 2px 0 0 rgb(250 204 21 / 44%);
    background: rgb(250 204 21 / 14%);
  }
  50% {
    box-shadow:
      inset 0 0 0 1px rgb(250 204 21 / 28%),
      inset 2px 0 0 rgb(250 204 21 / 72%);
    background: rgb(250 204 21 / 22%);
  }
}

@keyframes service-link-teal-breathe {
  0%,
  100% {
    box-shadow:
      inset 0 0 0 1px rgb(45 212 191 / 12%),
      inset 2px 0 0 rgb(45 212 191 / 40%);
    background: rgb(45 212 191 / 12%);
  }
  50% {
    box-shadow:
      inset 0 0 0 1px rgb(45 212 191 / 24%),
      inset 2px 0 0 rgb(45 212 191 / 66%);
    background: rgb(45 212 191 / 18%);
  }
}

@media (min-width: 768px) and (max-width: 1180px) {
  .#{$prefix-cls}__panel {
    gap: 4px;
    padding: 0 10px 22px;
  }

  .#{$prefix-cls}__logo {
    padding: 10px 0 12px;
  }

  .#{$prefix-cls}__section {
    padding: 7px 0 9px;
  }

  .#{$prefix-cls}__section-head {
    min-height: 42px;
    padding: 8px 10px;
    border-radius: 12px;
  }

  .#{$prefix-cls}__links {
    gap: 6px 8px;
    padding: 9px 2px 0 28px;
  }

  .#{$prefix-cls}__link {
    min-height: 34px;
    padding: 6px 10px;
    border-left-width: 3px;
    border-radius: 0 8px 8px 0;
  }

  .#{$prefix-cls}__link-text {
    font-size: 12px;
  }

  .#{$prefix-cls}__status-dot,
  .#{$prefix-cls}__psd-status-dot {
    transform: scale(1.08);
  }
}

@media (max-width: 767px) {
  .#{$prefix-cls}__panel {
    gap: 4px;
    padding: 0 8px 18px;
  }

  .#{$prefix-cls}__logo {
    padding: 8px 0 10px;
    margin-bottom: 2px;
  }

  .#{$prefix-cls}__section {
    padding: 5px 0 7px;
  }

  .#{$prefix-cls}__section-head {
    padding: 7px 8px;
    border-radius: 10px;
  }

  .#{$prefix-cls}__section-title {
    font-size: 12px;
  }

  .#{$prefix-cls}__links {
    gap: 5px;
    padding: 8px 2px 0 20px;
  }

  .#{$prefix-cls}__link {
    min-height: 30px;
    padding: 5px 8px;
    border-radius: 0 7px 7px 0;
  }

  .#{$prefix-cls}__link-text {
    font-size: 11px;
  }
}
</style>
