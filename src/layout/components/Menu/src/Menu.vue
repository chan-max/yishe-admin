<script lang="tsx">
import { Icon } from '@/components/Icon'
import { useDesign } from '@/hooks/web/useDesign'
import { usePermissionStore } from '@/store/modules/permission'
import { useAppStore } from '@/store/modules/app'
import { isUrl } from '@/utils/is'
import { pathResolve } from '@/utils/routerHelper'
import { Logo } from '@/layout/components/Logo'

const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('menu')

export default defineComponent({
  name: 'Menu',
  setup() {
    const appStore = useAppStore()
    const permissionStore = usePermissionStore()
    const { push, currentRoute } = useRouter()
    const closeMobileMenu = inject<() => void>('closeMobileMenu', () => {})
    const logo = computed(() => appStore.logo)

    const routers = computed(() => permissionStore.getRouters.filter((route) => !route.meta?.hidden))
    const activeMenu = computed(() => (currentRoute.value.meta.activeMenu as string) || currentRoute.value.path)
    const expandedMenus = ref<Record<string, boolean>>({})

    const getRoutePath = (route: AppRouteRecordRaw, parentPath = '/') => {
      return isUrl(route.path) ? route.path : pathResolve(parentPath, route.path)
    }

    const getVisibleChildren = (route: AppRouteRecordRaw) => {
      return (route.children ?? []).filter((child) => !child.meta?.hidden)
    }

    const hasActiveChild = (route: AppRouteRecordRaw) => {
      const routePath = getRoutePath(route)
      return getVisibleChildren(route).some((child) => getRoutePath(child, routePath) === activeMenu.value)
    }

    const isRouteActive = (route: AppRouteRecordRaw) => {
      return getRoutePath(route) === activeMenu.value || hasActiveChild(route)
    }

    const selectMenu = (path: string) => {
      if (isUrl(path)) {
        window.open(path)
      } else {
        push(path)
      }
      closeMobileMenu()
    }

    const toggleSection = (routePath: string) => {
      expandedMenus.value = {
        ...expandedMenus.value,
        [routePath]: !expandedMenus.value[routePath]
      }
    }

    watch(
      routers,
      (value) => {
        const nextExpanded: Record<string, boolean> = {}
        value.forEach((route) => {
          const routePath = getRoutePath(route)
          nextExpanded[routePath] =
            expandedMenus.value[routePath] ?? getVisibleChildren(route).length > 0
        })
        expandedMenus.value = nextExpanded
      },
      { immediate: true, deep: true }
    )

    return () => (
      <nav id={prefixCls} class={`${prefixCls} h-full`}>
        <div class={`${prefixCls}__panel`}>
          {logo.value ? (
            <div class={`${prefixCls}__logo`}>
              <Logo class={`${prefixCls}__logo-inner`} />
            </div>
          ) : undefined}

          {routers.value.map((route) => {
            const routePath = getRoutePath(route)
            const children = getVisibleChildren(route)
            const sectionActive = isRouteActive(route)
            const expanded = expandedMenus.value[routePath]

            if (!children.length) {
              return (
                <button
                  type="button"
                  key={routePath}
                  class={[
                    `${prefixCls}__section`,
                    `${prefixCls}__section--leaf`,
                    { [`${prefixCls}__section--active`]: sectionActive }
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
                  </div>
                </button>
              )
            }

            return (
              <section
                key={routePath}
                class={[
                  `${prefixCls}__section`,
                  { [`${prefixCls}__section--active`]: sectionActive }
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
                    icon={expanded ? 'ep:arrow-up' : 'ep:arrow-down'}
                  />
                </button>

                {expanded ? (
                  <div class={`${prefixCls}__links`}>
                    {children.map((child) => {
                      const childPath = getRoutePath(child, routePath)
                      return (
                        <button
                          type="button"
                          key={childPath}
                          title={String(child.meta?.title ?? '')}
                          class={[
                            `${prefixCls}__link`,
                            { [`${prefixCls}__link--active`]: childPath === activeMenu.value }
                          ]}
                          onClick={() => selectMenu(childPath)}
                        >
                          <span class={`${prefixCls}__link-text`}>{child.meta?.title}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : undefined}
              </section>
            )
          })}
        </div>
      </nav>
    )
  }
})
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
    padding: 0 7px 18px;
  }

  &__logo {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: 8px 0 10px;
    margin-bottom: 4px;
    border-bottom: 1px solid var(--left-menu-divider-color);
    background: var(--left-menu-bg-color, #141414);
  }

  &__logo-inner {
    width: 100%;
    border: 0 !important;
  }

  &__section {
    width: 100%;
    padding: 5px 0 7px;
    border-bottom: 1px solid var(--left-menu-divider-color);
  }

  &__section--leaf {
    display: block;
    padding-bottom: 3px;
    background: transparent;
  }

  &__section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 5px 7px;
    border: none;
    border-radius: 9px;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: background-color var(--transition-time-02), color var(--transition-time-02);
  }

  &__section-head:hover {
    background: var(--left-menu-hover-color);
  }

  &__section-label {
    display: flex;
    align-items: center;
    gap: 7px;
    flex: 1;
    min-width: 0;
  }

  &__section-icon {
    flex: none;
    font-size: 13px;
    color: var(--left-menu-icon-color);
  }

  &__section-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: var(--left-menu-title-color);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__section-arrow {
    flex: none;
    font-size: 11px;
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
    gap: 4px 6px;
    padding: 7px 2px 0 24px;
  }

  &__link {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 26px;
    min-width: 0;
    padding: 4px 7px;
    border: 0;
    border-left: 2px solid transparent;
    border-radius: 0 5px 5px 0;
    background: transparent;
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
    font-size: 11px;
    font-weight: 500;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 1024px) {
    &__links {
      grid-template-columns: 1fr;
      padding-left: 26px;
    }
  }
}
</style>
