<script lang="tsx">
import type { VNode } from "vue";
import { Icon } from "@/components/Icon";
import { ElInput, ElTooltip } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { useDesign } from "@/hooks/web/useDesign";
import { usePermissionStore } from "@/store/modules/permission";
import { useAppStore } from "@/store/modules/app";
import { isUrl } from "@/utils/is";
import { pathResolve } from "@/utils/routerHelper";
import { Logo } from "@/layout/components/Logo";
import { usePsdSetRuntimeState } from "@/services/psdSetRuntimeState";
import { usePublishTaskRuntimeState } from "@/services/publishTaskRuntimeState";
import { isClientServiceRuntimeBusy } from "@/services/clientServiceRuntime";
import { aiConfigState, refreshAiConfigState } from "@/services/aiConfigState";
import { messagePushMenuState, refreshMessagePushMenuState } from "@/services/messagePushState";
import { getBrowserAutomationRuntimeHint } from "@/services/browserAutomationRuntime";
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
    const menuKeyword = ref("");

    const routers = computed(() =>
      permissionStore.getRouters.filter((route) => !route.meta?.hidden),
    );
    const normalizeMenuText = (value: unknown) =>
      String(value ?? "")
        .trim()
        .toLowerCase();
    const menuSearchText = computed(() => normalizeMenuText(menuKeyword.value));
    const getRouteSearchText = (route: AppRouteRecordRaw, routePath: string) =>
      normalizeMenuText(
        [route.meta?.title, route.name, route.path, routePath].filter(Boolean).join(" "),
      );
    const filterMenuRoutes = (
      routeList: AppRouteRecordRaw[],
      keyword: string,
      parentPath = "/",
    ): AppRouteRecordRaw[] => {
      if (!keyword) {
        return routeList;
      }

      return routeList
        .map((route) => {
          const routePath = getRoutePath(route, parentPath);
          const children = getVisibleChildren(route);
          const matched = getRouteSearchText(route, routePath).includes(keyword);
          const filteredChildren = filterMenuRoutes(children, keyword, routePath);

          if (!matched && !filteredChildren.length) {
            return null;
          }

          return {
            ...route,
            children: matched ? children : filteredChildren,
          };
        })
        .filter(Boolean) as AppRouteRecordRaw[];
    };
    const visibleRouters = computed(() => filterMenuRoutes(routers.value, menuSearchText.value));
    const activeMenu = computed(
      () => (currentRoute.value.meta.activeMenu as string) || currentRoute.value.path,
    );
    const expandedMenus = ref<Record<string, boolean>>({});
    const {
      userAutoSchedulingEnabled,
      isAnyPsdSetProcessing,
      processingTooltipText,
      refresh: refreshPsdSetRuntime,
    } = usePsdSetRuntimeState();
    const {
      isAnyPublishTaskRunning,
      autoSchedulingEnabled: publishTaskAutoSchedulingEnabled,
      menuStatusTone: publishTaskMenuStatusTone,
      tooltipText: publishTaskTooltipText,
      refresh: refreshPublishTaskRuntime,
    } = usePublishTaskRuntimeState();
    const clientNodeStore = useClientNodeStore();
    clientNodeStore.ensureInitialized({ summary: true });

    const menuStatusRouteMap: Record<string, string> = {
      "/operation/toolkit": "browser-automation",
      "/external/toolkit": "browser-automation",
      "/external/browser-automation": "browser-automation",
      "/external/ps-automation": "ps-automation",
      "/external/google-art": "google-art",
      "/content/image-processing-record": "image-processing",
      "/content/remotion-video-record": "video-template",
    };
    const busyIndicatorDisabledRoutes = new Set([
      "/operation/toolkit",
      "/external/toolkit",
      "/external/browser-automation",
    ]);

    const routeStatusMap = computed<Record<string, "available" | "offline">>(() => {
      const result: Record<string, "available" | "offline"> = {};
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
        if (busyIndicatorDisabledRoutes.has(routePath)) {
          result[routePath] = false;
          return;
        }
        result[routePath] = clientNodeStore.clients.some((client) => {
          if (!client.isOnline) return false;
          const serviceRuntime = getClientServiceRuntime(client, pluginKey as ClientPluginKey);
          return isClientServiceRuntimeBusy(serviceRuntime);
        });
      });
      result["/product/queue"] = isAnyPublishTaskRunning.value;

      return result;
    });

    const renderMenuStatusHint = (dotNode: VNode, title: string) => {
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

    const renderRunningStatusDot = (title: string, variant?: "queue" | "psd" | "video") => {
      return renderMenuStatusHint(
        <span
          class={[
            `${prefixCls}__status-dot`,
            `${prefixCls}__status-dot--running`,
            variant ? `${prefixCls}__status-dot--running-${variant}` : undefined,
          ]}
        />,
        title,
      );
    };

    const renderAutoModeBadge = (
      title: string,
      options?: {
        enabled?: boolean;
        variant?: "queue" | "psd" | "message" | "ai";
        label?: string;
      },
    ) => {
      return renderMenuStatusHint(
        <span
          class={[
            `${prefixCls}__auto-badge`,
            options?.enabled === false
              ? `${prefixCls}__auto-badge--muted`
              : `${prefixCls}__auto-badge--enabled`,
            options?.variant ? `${prefixCls}__auto-badge--${options.variant}` : undefined,
          ]}
        >
          {options?.label || (options?.enabled === false ? "手动" : "自动")}
        </span>,
        title,
      );
    };

    const resolveBrowserAutomationStatusTitle = (
      status: "available" | "offline",
      running: boolean,
      routePath: string,
    ) => {
      if (running) {
        return routePath === "/operation/toolkit" || routePath === "/external/toolkit"
          ? "当前有工具任务正在执行"
          : "当前有任务正在执行";
      }

      if (status === "available") {
        return routePath === "/operation/toolkit" || routePath === "/external/toolkit"
          ? "工具集可用"
          : "浏览器自动化可用";
      }

      if (status === "offline") {
        return routePath === "/operation/toolkit" || routePath === "/external/toolkit"
          ? "工具集不可用"
          : "浏览器自动化不可用";
      }

      const browserRuntimes = clientNodeStore.clients
        .filter((client) => client.isOnline)
        .map((client) => getClientServiceRuntime(client, "browser-automation"))
        .filter(Boolean);

      const runtimePriority = (runtime: Record<string, any>) => {
        if (runtime.lastError || runtime.status === "error" || runtime.state === "error") {
          return 4;
        }
        if (runtime.details?.hasInstance) {
          return 3;
        }
        if (runtime.connected) {
          return 2;
        }
        return 1;
      };

      const targetRuntime = browserRuntimes
        .slice()
        .sort((left, right) => runtimePriority(right) - runtimePriority(left))[0];

      if (!targetRuntime) {
        return "客户端已连接，但自动化服务未启动";
      }

      const hint = getBrowserAutomationRuntimeHint(targetRuntime);
      if (hint === "自动化服务未启动") {
        return "客户端已连接，但自动化服务未启动";
      }
      if (hint === "自动化服务异常") {
        return "客户端已连接，但自动化服务异常";
      }

      return hint;
    };

    const renderStatusDot = (routePath: string) => {
      const rawStatus = routeStatusMap.value[routePath];
      const status = rawStatus;
      if (!status) {
        return undefined;
      }
      const supportsRunningIndicator =
        routePath !== "/external/ps-automation" && !busyIndicatorDisabledRoutes.has(routePath);
      const running = supportsRunningIndicator ? routeRunningMap.value[routePath] : false;

      const titleMap: Record<string, Record<"available" | "offline", string>> = {
        "/operation/toolkit": {
          available: "工具集可用",
          offline: "工具集不可用",
        },
        "/external/toolkit": {
          available: "工具集可用",
          offline: "工具集不可用",
        },
        "/external/browser-automation": {
          available: "浏览器自动化可用",
          offline: "浏览器自动化不可用",
        },
        "/external/ps-automation": {
          available: "套图制作可调用",
          offline: "PS 自动化不可用",
        },
        "/external/google-art": {
          available: "Google Art 可用",
          offline: "Google Art 不可用",
        },
        "/content/image-processing-record": {
          available: "图片处理可用",
          offline: "图片处理不可用",
        },
        "/content/remotion-video-record": {
          available: "视频模板可用",
          offline: "视频模板不可用",
        },
        "/product/queue": {
          available: "发布任务可执行",
          offline: "发布任务暂不可执行",
        },
      };

      const title =
        routePath === "/product/queue"
          ? publishTaskTooltipText.value
          : routePath === "/external/browser-automation" ||
              routePath === "/operation/toolkit" ||
              routePath === "/external/toolkit"
            ? resolveBrowserAutomationStatusTitle(status, running, routePath)
            : routePath === "/content/image-processing-record" && running
              ? "当前有图片任务正在执行"
              : running
                ? "当前有任务正在执行"
                : titleMap[routePath]?.[status];

      if (running) {
        return renderRunningStatusDot(
          title || "当前有任务正在执行",
          routePath === "/product/queue"
            ? "queue"
            : isRemotionRoute(routePath)
              ? "video"
              : undefined,
        );
      }

      return renderMenuStatusHint(
        <span class={[`${prefixCls}__status-dot`, `${prefixCls}__status-dot--${status}`]} />,
        title || "当前不可用",
      );
    };

    const renderServiceHealthDot = (route: AppRouteRecordRaw, routePath: string) => {
      if (menuStatusRouteMap[routePath]) {
        return undefined;
      }

      const statusKey = route.meta?.serviceStatusKey;
      if (!isServiceHealthKey(statusKey)) {
        return undefined;
      }

      if (!!routeRunningMap.value[routePath]) {
        return renderRunningStatusDot("当前有视频任务正在执行");
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
    const isQueueRoute = (routePath: string) => routePath === "/product/queue";
    const isImageProcessingRoute = (routePath: string) =>
      routePath === "/content/image-processing-record";
    const isRemotionRoute = (routePath: string) => routePath === "/content/remotion-video-record";

    const renderPsdSetAutoDot = (routePath: string) => {
      if (!isPsdSetRoute(routePath)) {
        return undefined;
      }

      if (isAnyPsdSetProcessing.value) {
        return renderRunningStatusDot(processingTooltipText.value, "psd");
      }

      return renderAutoModeBadge(
        userAutoSchedulingEnabled.value ? "自动处理已开启" : "自动处理未开启",
        {
          enabled: userAutoSchedulingEnabled.value,
          variant: "psd",
        },
      );
    };

    const renderPublishTaskAutoBadge = (routePath: string) => {
      if (!isQueueRoute(routePath)) {
        return undefined;
      }

      if (routeRunningMap.value[routePath]) {
        return renderRunningStatusDot(publishTaskTooltipText.value, "queue");
      }

      if (!publishTaskAutoSchedulingEnabled.value) {
        return undefined;
      }

      return renderAutoModeBadge(
        publishTaskMenuStatusTone.value === "offline"
          ? "自动执行已开启，但当前发布任务暂不可执行"
          : "自动执行已开启",
        {
          enabled: true,
          variant: "queue",
        },
      );
    };

    const renderAiConfigBadge = (routePath: string) => {
      if (
        routePath !== "/system/ai-api-key" ||
        !aiConfigState.initialized ||
        aiConfigState.loading ||
        aiConfigState.totalFeatureCount <= 0
      ) {
        return undefined;
      }

      const label = `${aiConfigState.boundFeatureCount}/${aiConfigState.totalFeatureCount}`;
      const title = aiConfigState.missing
        ? `AI 配置未完成：${aiConfigState.reason}。已设置 ${label}`
        : `AI 功能 Key 已全部设置：${label}`;

      return renderAutoModeBadge(title, {
        enabled: !aiConfigState.missing,
        variant: "ai",
        label,
      });
    };

    const renderMessagePushBadge = (routePath: string) => {
      if (routePath !== "/system/message-push" || !messagePushMenuState.initialized) {
        return undefined;
      }

      const enabledCount = messagePushMenuState.enabledSceneCount;
      const configuredCount = messagePushMenuState.configuredSceneCount;

      if (enabledCount === 0) {
        return renderAutoModeBadge("通知已关闭", {
          enabled: false,
          variant: "message",
          label: "关",
        });
      }

      const label = `${configuredCount}/${enabledCount}`;
      const tip = `已开启 ${enabledCount} 个场景通知，${configuredCount} 个已配置渠道`;

      return renderAutoModeBadge(tip, {
        enabled: true,
        variant: "message",
        label,
      });
    };

    const isMenuLinkRunning = (routePath: string) => {
      if (isPsdSetRoute(routePath)) {
        return isAnyPsdSetProcessing.value;
      }
      if (isQueueRoute(routePath)) {
        return !!routeRunningMap.value[routePath];
      }
      if (isRemotionRoute(routePath)) {
        return !!routeRunningMap.value[routePath];
      }
      if (isImageProcessingRoute(routePath)) {
        return !!routeRunningMap.value[routePath];
      }
      return false;
    };

    const getRoutePath = (route: AppRouteRecordRaw, parentPath = "/") => {
      return isUrl(route.path) ? route.path : pathResolve(parentPath, route.path);
    };

    const getVisibleChildren = (route: AppRouteRecordRaw) => {
      return (route.children ?? []).filter((child) => !child.meta?.hidden);
    };

    const hasRoutePath = (
      routeList: AppRouteRecordRaw[],
      targetPath: string,
      parentPath = "/",
    ): boolean => {
      return routeList.some((route) => {
        const fullPath = getRoutePath(route, parentPath);
        if (fullPath === targetPath) {
          return true;
        }
        const children = getVisibleChildren(route);
        if (!children.length) {
          return false;
        }
        return hasRoutePath(children, targetPath, fullPath);
      });
    };

    const shouldTrackAiConfig = computed(() => hasRoutePath(routers.value, "/system/ai-api-key"));
    const shouldTrackMessagePush = computed(() =>
      hasRoutePath(routers.value, "/system/message-push"),
    );

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
            !!menuSearchText.value ||
            (expandedMenus.value[routePath] ?? getVisibleChildren(route).length > 0);
        });
        expandedMenus.value = nextExpanded;
      },
      { immediate: true, deep: true },
    );

    watch(
      [visibleRouters, menuSearchText],
      ([value, keyword]) => {
        if (!keyword) {
          return;
        }
        const nextExpanded = { ...expandedMenus.value };
        value.forEach((route) => {
          const routePath = getRoutePath(route);
          if (getVisibleChildren(route).length) {
            nextExpanded[routePath] = true;
          }
        });
        expandedMenus.value = nextExpanded;
      },
      { immediate: true },
    );

    watch(
      shouldTrackAiConfig,
      (enabled) => {
        if (enabled) {
          void refreshAiConfigState();
        }
      },
      { immediate: true },
    );

    watch(
      shouldTrackMessagePush,
      (enabled) => {
        if (enabled) {
          void refreshMessagePushMenuState();
        }
      },
      { immediate: true },
    );

    onMounted(() => {
      void refreshPsdSetRuntime();
      void refreshPublishTaskRuntime();
    });

    return () => (
      <nav id={prefixCls} class={`${prefixCls} h-full`}>
        <div class={`${prefixCls}__panel`}>
          {logo.value ? (
            <div class={`${prefixCls}__logo`}>
              <Logo class={`${prefixCls}__logo-inner`} />
            </div>
          ) : undefined}

          <div class={`${prefixCls}__search`}>
            <ElInput
              v-model={menuKeyword.value}
              size="small"
              clearable
              placeholder="搜索菜单"
              prefixIcon={Search}
            />
          </div>

          {visibleRouters.value.length ? (
            visibleRouters.value.map((route) => {
              const routePath = getRoutePath(route);
              const children = getVisibleChildren(route);
              const sectionActive = isRouteActive(route);
              const expanded = menuSearchText.value ? true : expandedMenus.value[routePath];

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
                      {renderMessagePushBadge(routePath) ||
                        renderServiceHealthDot(route, routePath)}
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
                                [`${prefixCls}__link--warning`]:
                                  childPath === "/system/ai-api-key" &&
                                  aiConfigState.initialized &&
                                  !aiConfigState.loading &&
                                  aiConfigState.missing,
                                [`${prefixCls}__link--running`]: isMenuLinkRunning(childPath),
                                [`${prefixCls}__link--running-psd`]:
                                  isPsdSetRoute(childPath) && isAnyPsdSetProcessing.value,
                                [`${prefixCls}__link--running-queue`]:
                                  isQueueRoute(childPath) && !!routeRunningMap.value[childPath],
                                [`${prefixCls}__link--running-video`]:
                                  isRemotionRoute(childPath) && !!routeRunningMap.value[childPath],
                              },
                            ]}
                            onClick={() => selectMenu(childPath)}
                          >
                            <span class={`${prefixCls}__link-text`}>{child.meta?.title}</span>
                            {renderAiConfigBadge(childPath) ||
                              renderMessagePushBadge(childPath) ||
                              renderPsdSetAutoDot(childPath) ||
                              renderPublishTaskAutoBadge(childPath) ||
                              renderServiceHealthDot(child, childPath) ||
                              renderStatusDot(childPath)}
                          </button>
                        );
                      })}
                    </div>
                  ) : undefined}
                </section>
              );
            })
          ) : (
            <div class={`${prefixCls}__empty`}>没有匹配的菜单</div>
          )}
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

  &__search {
    position: sticky;
    top: var(--left-menu-search-sticky-top, 64px);
    z-index: 2;
    padding: 6px 0 8px;
    border-bottom: 1px solid var(--left-menu-divider-color);
    background: var(--left-menu-bg-color, #141414);
  }

  &__search :deep(.el-input__wrapper) {
    min-height: 30px;
    border-radius: 8px;
    background: rgb(255 255 255 / 6%);
    box-shadow: 0 0 0 1px rgb(255 255 255 / 8%) inset;
  }

  &__search :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px rgb(64 158 255 / 52%) inset;
  }

  &__search :deep(.el-input__inner) {
    color: var(--left-menu-title-color);
    font-size: 12px;
  }

  &__search :deep(.el-input__inner::placeholder) {
    color: rgb(203 213 225 / 42%);
  }

  &__search :deep(.el-input__prefix),
  &__search :deep(.el-input__clear) {
    color: rgb(203 213 225 / 56%);
  }

  &__empty {
    padding: 22px 8px;
    color: rgb(203 213 225 / 56%);
    font-size: 12px;
    text-align: center;
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
    grid-template-columns: repeat(var(--left-menu-links-columns), minmax(0, 1fr));
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

  &__link--warning:not(.#{$prefix-cls}__link--active) {
    background: linear-gradient(90deg, rgb(245 158 11 / 10%) 0%, rgb(245 158 11 / 0%) 100%);
    border-left-color: rgb(245 158 11 / 42%);
    color: rgb(255 236 205 / 92%);
  }

  &__link--warning:hover:not(.#{$prefix-cls}__link--active) {
    background:
      linear-gradient(90deg, rgb(245 158 11 / 15%) 0%, rgb(245 158 11 / 2%) 100%),
      var(--left-menu-link-hover-bg);
    border-left-color: rgb(245 158 11 / 60%);
    color: rgb(255 245 228 / 96%);
  }

  &__link-text {
    display: block;
    flex: 1;
    position: relative;
    z-index: 1;
    min-width: 0;
    overflow: hidden;
    font-size: var(--left-menu-link-font-size);
    font-weight: 500;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 2px 0;
  }

  &__status-indicator {
    position: relative;
    display: inline-flex;
    flex: none;
    align-items: center;
    z-index: 1;
  }

  :global(.#{$prefix-cls}__status-tooltip-popper.el-popper),
  :global(.#{$prefix-cls}__status-tooltip-popper.el-popper .el-popper__arrow) {
    animation: none !important;
    transition: none !important;
  }

  &__auto-badge {
    flex: none;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    min-width: 28px;
    height: 16px;
    padding: 0 6px;
    margin-left: var(--left-menu-psd-dot-margin-left);
    border-radius: 999px;
    border: 1px solid rgb(148 163 184 / 20%);
    background: rgb(148 163 184 / 10%);
    color: rgb(226 232 240 / 72%);
    font-size: 8px;
    font-weight: 400;
    line-height: 1;
    letter-spacing: 0.04em;
    text-indent: 0.04em;
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 4%),
      0 2px 6px rgb(15 23 42 / 12%);
    backdrop-filter: blur(6px);
    white-space: nowrap;
  }

  &__auto-badge--enabled {
    color: rgba(255, 140, 0, 0.94);
  }

  &__auto-badge--psd.#{$prefix-cls}__auto-badge--enabled {
    border-color: rgb(245 158 11 / 30%);
    background: linear-gradient(135deg, rgb(245 158 11 / 26%) 0%, rgb(251 191 36 / 16%) 100%);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 6%),
      0 4px 12px rgb(245 158 11 / 14%);
  }

  &__auto-badge--queue.#{$prefix-cls}__auto-badge--enabled {
    border-color: rgb(245 158 11 / 30%);
    background: linear-gradient(135deg, rgb(245 158 11 / 26%) 0%, rgb(251 191 36 / 16%) 100%);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 6%),
      0 4px 12px rgb(245 158 11 / 14%);
  }

  &__auto-badge--message.#{$prefix-cls}__auto-badge--enabled {
    border-color: rgb(34 197 94 / 30%);
    background: linear-gradient(135deg, rgb(34 197 94 / 24%) 0%, rgb(16 185 129 / 14%) 100%);
    color: rgb(134 239 172 / 94%);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 6%),
      0 4px 12px rgb(34 197 94 / 12%);
  }

  &__auto-badge--ai {
    min-width: 34px;
    padding: 0 5px;
    letter-spacing: 0;
    text-indent: 0;
  }

  &__auto-badge--ai.#{$prefix-cls}__auto-badge--enabled {
    border-color: rgb(34 197 94 / 30%);
    background: rgb(34 197 94 / 14%);
    color: rgb(134 239 172 / 94%);
  }

  &__auto-badge--ai.#{$prefix-cls}__auto-badge--muted {
    border-color: rgb(245 158 11 / 28%);
    background: rgb(245 158 11 / 14%);
    color: rgb(253 186 116 / 95%);
  }

  &__auto-badge--muted {
    border-color: rgb(148 163 184 / 16%);
    background: rgb(148 163 184 / 8%);
    color: rgb(203 213 225 / 56%);
  }

  &__link--running {
    background: linear-gradient(
      90deg,
      rgb(var(--menu-running-rgb, 245 158 11) / 12%) 0%,
      rgb(var(--menu-running-highlight-rgb, 251 191 36) / 16%) 52%,
      rgb(var(--menu-running-rgb, 245 158 11) / 12%) 100%
    );
    box-shadow:
      inset 0 0 0 1px rgb(var(--menu-running-rgb, 245 158 11) / 18%),
      0 3px 12px rgb(var(--menu-running-rgb, 245 158 11) / 8%);
  }

  &__link--running:not(.#{$prefix-cls}__link--active) {
    color: var(--menu-running-text-color, rgb(255 244 214 / 92%));
  }

  &__link--running:hover {
    box-shadow:
      inset 0 0 0 1px rgb(var(--menu-running-rgb, 245 158 11) / 24%),
      0 4px 14px rgb(var(--menu-running-rgb, 245 158 11) / 12%);
  }

  &__link--running.#{$prefix-cls}__link--active {
    background: linear-gradient(
      90deg,
      rgb(var(--menu-running-rgb, 245 158 11) / 10%) 0%,
      rgb(var(--menu-running-highlight-rgb, 251 191 36) / 12%) 52%,
      rgb(var(--menu-running-rgb, 245 158 11) / 10%) 100%
    );
    box-shadow:
      inset 0 0 0 1px rgb(var(--menu-running-rgb, 245 158 11) / 18%),
      0 0 0 1px rgb(var(--menu-running-rgb, 245 158 11) / 9%);
  }

  &__link--running-queue {
    --menu-running-rgb: 234 179 8;
    --menu-running-highlight-rgb: 250 204 21;
    --menu-running-text-color: rgb(234 179 8 / 98%);
  }

  &__link--running-psd {
    --menu-running-rgb: 234 179 8;
    --menu-running-highlight-rgb: 250 204 21;
    --menu-running-text-color: rgb(234 179 8 / 98%);
  }

  &__link--running-video {
    --menu-running-rgb: 59 130 246;
    --menu-running-highlight-rgb: 96 165 250;
    --menu-running-text-color: rgb(30 41 59 / 98%);
  }

  &__status-dot {
    flex: none;
    position: relative;
    z-index: 1;
    width: var(--left-menu-status-dot-size);
    height: var(--left-menu-status-dot-size);
    margin-left: var(--left-menu-status-dot-margin-left);
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

  &__status-dot--running {
    background: rgb(var(--menu-running-rgb, 245 158 11) / 10%);
    box-shadow:
      inset 0 0 0 1px rgb(var(--menu-running-rgb, 245 158 11) / 22%),
      0 0 10px rgb(var(--menu-running-rgb, 245 158 11) / 20%);
    animation: status-dot-running-core 1.35s ease-in-out infinite;
  }

  &__status-dot--running::before {
    inset: -1px;
    border: 1.5px solid transparent;
    border-top-color: rgb(var(--menu-running-rgb, 245 158 11));
    border-right-color: rgb(var(--menu-running-highlight-rgb, 251 191 36) / 88%);
    background: transparent;
    animation: status-ring-spin 0.9s linear infinite;
  }

  &__status-dot--running::after {
    inset: 3px;
    background: rgb(var(--menu-running-rgb, 245 158 11) / 92%);
    opacity: 0.92;
    transform: scale(1);
    box-shadow:
      0 0 0 1px rgb(255 255 255 / 18%),
      0 0 8px rgb(var(--menu-running-rgb, 245 158 11) / 34%);
    animation: status-dot-running-pulse 1.25s ease-in-out infinite;
  }

  &__status-dot--running-queue {
    --menu-running-rgb: 234 179 8;
    --menu-running-highlight-rgb: 250 204 21;
  }

  &__status-dot--running-psd {
    --menu-running-rgb: 234 179 8;
    --menu-running-highlight-rgb: 250 204 21;
  }

  &__status-dot--running-video {
    --menu-running-rgb: 59 130 246;
    --menu-running-highlight-rgb: 96 165 250;
  }

  &__status-dot--offline {
    background: rgb(148 163 184 / 88%);
    box-shadow:
      0 0 0 1px rgb(148 163 184 / 12%),
      0 0 8px rgb(148 163 184 / 12%);
    opacity: 0.1;
  }

  &__link:hover &__status-dot--offline,
  &__link--active &__status-dot--offline {
    animation: status-dot-breathe-offline 3s ease-in-out infinite;
  }

  @media (min-width: 768px) and (max-width: 1180px),
    (min-width: 1181px) and (max-width: 1366px) and (any-pointer: coarse) {
    &__panel {
      gap: 1px;
    }

    &__section-title {
      font-weight: 500;
      line-height: 1.05;
    }

    &__links {
      grid-template-columns: 1fr;
      padding-left: var(--left-menu-links-padding-left);
    }

    &__link-text {
      line-height: 1.05;
    }
  }

  @media (max-width: 767px) {
    &__links {
      grid-template-columns: 1fr;
      padding-left: calc(var(--left-menu-links-padding-left) + 2px);
    }
  }
}

:global(html.dark) {
  .#{$prefix-cls}__link--running-queue {
    --menu-running-text-color: rgb(250 204 21 / 98%);
  }

  .#{$prefix-cls}__link--running-psd {
    --menu-running-text-color: rgb(250 204 21 / 98%);
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

@keyframes status-ring-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes status-dot-running-core {
  0%,
  100% {
    transform: scale(0.98);
    box-shadow:
      inset 0 0 0 1px rgb(245 158 11 / 20%),
      0 0 8px rgb(245 158 11 / 16%);
  }
  50% {
    transform: scale(1.04);
    box-shadow:
      inset 0 0 0 1px rgb(245 158 11 / 28%),
      0 0 12px rgb(245 158 11 / 28%);
  }
}

@keyframes status-dot-running-pulse {
  0%,
  100% {
    opacity: 0.88;
    transform: scale(0.92);
  }
  50% {
    opacity: 1;
    transform: scale(1);
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

  .#{$prefix-cls}__search {
    top: 54px;
    padding-bottom: 7px;
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
    font-size: 11px;
  }

  .#{$prefix-cls}__status-dot,
  .#{$prefix-cls}__auto-badge {
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

  .#{$prefix-cls}__search {
    top: 50px;
    padding: 5px 0 7px;
  }

  .#{$prefix-cls}__section {
    padding: 5px 0 7px;
  }

  .#{$prefix-cls}__section-head {
    padding: 7px 8px;
    border-radius: 10px;
  }

  .#{$prefix-cls}__section-title {
    font-size: 11px;
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

:global(html.light .v-menu__auto-badge) {
  border-color: rgb(100 116 139 / 34%) !important;
  background: rgb(241 245 249 / 98%) !important;
  color: rgb(51 65 85 / 98%) !important;
  box-shadow: none !important;
}

:global(html.light .v-menu__auto-badge--enabled) {
  border-color: rgb(217 119 6 / 44%) !important;
  background: rgb(255 247 237 / 98%) !important;
  color: rgb(154 52 18 / 98%) !important;
}

:global(html.light .v-menu__auto-badge--psd.v-menu__auto-badge--enabled),
:global(html.light .v-menu__auto-badge--queue.v-menu__auto-badge--enabled) {
  border-color: rgb(217 119 6 / 46%) !important;
  background: rgb(255 247 237 / 98%) !important;
  color: rgb(154 52 18 / 98%) !important;
  box-shadow: none !important;
}

:global(html.light .v-menu__auto-badge--message.v-menu__auto-badge--enabled),
:global(html.light .v-menu__auto-badge--ai.v-menu__auto-badge--enabled) {
  border-color: rgb(22 163 74 / 44%) !important;
  background: rgb(240 253 244 / 98%) !important;
  color: rgb(21 128 61 / 98%) !important;
  box-shadow: none !important;
}

:global(html.light .v-menu__auto-badge--muted),
:global(html.light .v-menu__auto-badge--ai.v-menu__auto-badge--muted) {
  border-color: rgb(100 116 139 / 40%) !important;
  background: rgb(248 250 252 / 98%) !important;
  color: rgb(51 65 85 / 98%) !important;
}
</style>
