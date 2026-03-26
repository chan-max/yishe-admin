import { defineStore } from 'pinia'
import { store } from '@/store'
import { cloneDeep } from 'lodash-es'
import remainingRouter from '@/router/modules/remaining'
import { useUserStore } from '@/store/modules/user'
import { pathResolve } from '@/utils/routerHelper'
import { isUrl } from '@/utils/is'

function filterRoutesByAdmin(routes: AppRouteRecordRaw[], isAdmin: boolean): AppRouteRecordRaw[] {
  return routes
    .map((route) => {
      if (!isAdmin && route.meta?.requiresAdmin) {
        return null
      }

      if (!route.children?.length) {
        return route
      }

      const children = filterRoutesByAdmin(route.children, isAdmin)
      if (!children.length && !route.component) {
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
  return routes.filter((route) => !route.meta?.hidden)
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
  return routes.map((route) => {
    const visibleChildren = getVisibleChildren(route.children)

    if (!visibleChildren.length) {
      return route
    }

    return {
      ...route,
      children: flattenChildrenToSecondLevel(visibleChildren, route.path)
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
      const isAdmin = userStore.user?.isAdmin || false
      const accessRoutes = filterRoutesByAdmin(cloneDeep(remainingRouter), isAdmin)
      const routers = flattenMenusToTwoLevels(accessRoutes)

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
