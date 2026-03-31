import { defineStore } from 'pinia'
import { store } from '@/store'
import { cloneDeep } from 'lodash-es'
import remainingRouter from '@/router/modules/remaining'
import { hasRouteMenuAccess } from '@/router/access-control'
import { useUserStore } from '@/store/modules/user'
import { pathResolve } from '@/utils/routerHelper'
import { isUrl } from '@/utils/is'

function getRouteOrder(route: AppRouteRecordRaw): number {
  const order = route.meta?.order
  return typeof order === 'number' ? order : Number.MAX_SAFE_INTEGER
}

function sortRoutes(routes: AppRouteRecordRaw[]): AppRouteRecordRaw[] {
  return [...routes]
    .sort((a, b) => {
      const orderDiff = getRouteOrder(a) - getRouteOrder(b)
      if (orderDiff !== 0) {
        return orderDiff
      }

      const titleA = String(a.meta?.title ?? '')
      const titleB = String(b.meta?.title ?? '')
      const titleDiff = titleA.localeCompare(titleB, 'zh-CN')
      if (titleDiff !== 0) {
        return titleDiff
      }

      return a.path.localeCompare(b.path, 'en')
    })
    .map((route) => ({
      ...route,
      children: route.children ? sortRoutes(route.children) : route.children
    }))
}

function filterRoutesByAccess(routes: AppRouteRecordRaw[], user: any): AppRouteRecordRaw[] {
  return routes
    .map((route) => {
      if (!hasRouteMenuAccess(route, user)) {
        return null
      }

      if (!route.children?.length) {
        return route
      }

      const children = filterRoutesByAccess(route.children, user)
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
  return sortRoutes(routes.filter((route) => !route.meta?.hidden))
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
  return sortRoutes(routes).map((route) => {
    const visibleChildren = getVisibleChildren(route.children)

    if (!visibleChildren.length) {
      return route
    }

    return {
      ...route,
      children: sortRoutes(flattenChildrenToSecondLevel(visibleChildren, route.path))
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
