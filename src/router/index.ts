/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-04-01 07:04:47
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-05-19 08:31:20
 * @FilePath: /yudao-ui-admin-vue3/src/router/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import remainingRouter from './modules/remaining'

// 创建路由实例
const router = createRouter({
  // history: createWebHistory(import.meta.env.VITE_BASE_PATH), // createWebHashHistory URL带#，createWebHistory URL不带#
  history: createWebHashHistory(import.meta.env.VITE_BASE_PATH),
  strict: true,
  routes: remainingRouter as RouteRecordRaw[],
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export const resetRouter = (): void => {
  const resetWhiteNameList = ['Redirect', 'Login', 'NoFind', 'Root']
  router.getRoutes().forEach((route) => {
    const { name } = route
    if (name && !resetWhiteNameList.includes(name as string)) {
      router.hasRoute(name) && router.removeRoute(name)
    }
  })
}

export const setupRouter = (app: App<Element>) => {
  app.use(router)
}

export default router
