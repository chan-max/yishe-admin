import { defineStore } from 'pinia'
import { store } from '@/store'
import { cloneDeep } from 'lodash-es'
import remainingRouter from '@/router/modules/remaining'
import { hasRouteMenuAccess } from '@/router/access-control'
import {
  resolveFirstAccessibleMenuPath,
  resolveMenuRoutePath
} from '@/router/menu-path'
import { useUserStore } from '@/store/modules/user'
import { pathResolve } from '@/utils/routerHelper'
import { isUrl } from '@/utils/is'

function cloneRoutesInDefinedOrder(routes: AppRouteRecordRaw[]): AppRouteRecordRaw[] {
  return routes
    .map((route) => ({
      ...route,
      children: route.children ? cloneRoutesInDefinedOrder(route.children) : route.children
    }))
}

function filterRoutesByAccess(routes: AppRouteRecordRaw[], user: any): AppRouteRecordRaw[] {
  return routes
    .map((route) => {
      if (!hasRouteMenuAccess(route, user)) {
        return null
      }

      const hasChildren = Array.isArray(route.children) && route.children.length > 0

      if (!hasChildren) {
        return route
      }

      const children = filterRoutesByAccess(route.children, user)

      // 父级菜单没有任何可访问子项时，整组直接隐藏
      if (!children.length) {
        return null
      }

      return {
        ...route,
        children
      }
    })
    .filter(Boolean) as AppRouteRecordRaw[]
}

function getDefaultRoutes(routes: AppRouteRecordRaw[]): AppRouteRecordRaw[] {
  return cloneRoutesInDefinedOrder(routes.filter((route) => !route.meta?.hidden))
}

function getVisibleChildren(children: AppRouteRecordRaw[] = []) {
  return children.filter((child) => !child.meta?.hidden)
}

function flattenChildrenToSecondLevel(
  children: AppRouteRecordRaw[],
  topLevelPath: string,
  parentPath = topLevelPath
): AppRouteRecordRaw[] {
  return children.flatMap((child) => {
    const currentPath = isUrl(child.path) ? child.path : pathResolve(parentPath, child.path)
    const visibleChildren = getVisibleChildren(child.children)

    if (!visibleChildren.length) {
      const childPath = isUrl(currentPath) ? currentPath : currentPath.replace(`${topLevelPath}/`, '')
      return [
        {
          ...child,
          path: childPath,
          children: undefined
        }
      ]
    }

    return flattenChildrenToSecondLevel(visibleChildren, topLevelPath, currentPath)
  })
}

function flattenMenusToTwoLevels(routes: AppRouteRecordRaw[]): AppRouteRecordRaw[] {
  return cloneRoutesInDefinedOrder(routes).map((route) => {
    const visibleChildren = getVisibleChildren(route.children)

    if (!visibleChildren.length) {
      return route
    }

    return {
      ...route,
      children: cloneRoutesInDefinedOrder(flattenChildrenToSecondLevel(visibleChildren, route.path))
    }
  })
}

function applyAccessibleRedirects(
  routes: AppRouteRecordRaw[],
  parentPath = '/'
): AppRouteRecordRaw[] {
  return routes.map((route) => {
    const routePath = resolveMenuRoutePath(route, parentPath)
    const children = route.children
      ? applyAccessibleRedirects(route.children, routePath)
      : route.children
    const firstChildPath = children?.length
      ? resolveFirstAccessibleMenuPath(children, routePath)
      : ''

    return {
      ...route,
      ...(firstChildPath ? { redirect: firstChildPath } : {}),
      children
    }
  })
}

export interface PermissionState {
  routers: AppRouteRecordRaw[]
  addRouters: AppRouteRecordRaw[]
  menuTabRouters: AppRouteRecordRaw[]
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    routers: [],
    addRouters: [],
    menuTabRouters: []
  }),
  getters: {
    getRouters(): AppRouteRecordRaw[] {
      return this.routers
    },
    getAddRouters(): AppRouteRecordRaw[] {
      return this.addRouters
    },
    getMenuTabRouters(): AppRouteRecordRaw[] {
      return this.menuTabRouters
    }
  },
  actions: {
    async generateRoutes(): Promise<void> {
      const userStore = useUserStore(store)
      const accessRoutes = filterRoutesByAccess(cloneDeep(remainingRouter), userStore.user)
      const routers = applyAccessibleRedirects(flattenMenusToTwoLevels(accessRoutes))

      this.routers = routers
      this.addRouters = getDefaultRoutes(routers)
    },
    setMenuTabRouters(routers: AppRouteRecordRaw[]): void {
      this.menuTabRouters = routers
    }
  },
  persist: false
})

export const usePermissionStoreWithOut = () => {
  return usePermissionStore(store)
}

if (import.meta.hot) {
  import.meta.hot.accept('@/router/modules/remaining', () => {
    const userStore = useUserStore(store)
    if (!userStore.getIsSetUser) {
      return
    }

    void usePermissionStore(store).generateRoutes()
  })
}
