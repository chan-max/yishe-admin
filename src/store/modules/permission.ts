import { defineStore } from 'pinia'
import { store } from '@/store'
import { cloneDeep } from 'lodash-es'
import remainingRouter from '@/router/modules/remaining'
import { viewsRouter } from '@/router/modules/views'
import { flatMultiLevelRoutes } from '@/utils/routerHelper'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'
import { useUserStore } from '@/store/modules/user'

const { wsCache } = useCache()

// 过滤需要管理员权限的路由
function filterAdminRoutes(routes: AppRouteRecordRaw[], isAdmin: boolean): AppRouteRecordRaw[] {
  if (isAdmin) {
    return routes // 管理员可以看到所有路由
  }
  
  return routes
    .map(route => {
      // 如果路由需要管理员权限，不显示
      if (route.meta?.requiresAdmin) {
        return null
      }
      
      // 如果有子路由，递归过滤
      if (route.children && route.children.length > 0) {
        const filteredChildren = filterAdminRoutes(route.children, isAdmin)
        if (filteredChildren.length === 0) {
          return null // 如果所有子路由都被过滤掉，父路由也不显示
        }
        return {
          ...route,
          children: filteredChildren
        }
      }
      
      return route
    })
    .filter(Boolean) as AppRouteRecordRaw[]
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
      return flatMultiLevelRoutes(cloneDeep(this.addRouters))
    },
    getMenuTabRouters(): AppRouteRecordRaw[] {
      return this.menuTabRouters
    }
  },
  actions: {
    async generateRoutes(): Promise<unknown> {
      return new Promise<void>(async (resolve) => {
        // 获取用户信息，判断是否为管理员
        const userStore = useUserStore(store)
        const isAdmin = userStore.user?.isAdmin || false
        
        // 过滤需要管理员权限的路由
        const filteredRemainingRouter = filterAdminRoutes(cloneDeep(remainingRouter), isAdmin)
        
        // 使用固定路由配置
        this.addRouters = viewsRouter.concat([
          {
            path: '/:path(.*)*',
            component: () => import('@/views/Error/404.vue'),
            name: '404Page',
            meta: {
              hidden: true,
              breadcrumb: false
            }
          }
        ])
        // 渲染菜单的所有路由，remainingRouter 包含基础路由（如首页、登录页等）
        this.routers = cloneDeep(filteredRemainingRouter.concat(viewsRouter))
        resolve()
      })
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
