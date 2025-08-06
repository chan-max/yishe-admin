/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-05-19 08:24:58
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-02 12:39:15
 * @FilePath: /yudao-ui-admin-vue3/src/router/modules/views.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Layout } from '@/utils/routerHelper'
import { useI18n } from '@/hooks/web/useI18n'

const { t } = useI18n()

export const viewsRouter: AppRouteRecordRaw[] = [
  // {
  //   path: '/home',
  //   component: Layout,
  //   name: 'Home',
  //   meta: {
  //     title: t('router.home'),
  //     icon: 'ep:home-filled',
  //     order: 0
  //   },
  //   children: [
  //     {
  //       path: 'index',
  //       component: () => import('@/views/Home/Index.vue'),
  //       name: 'HomeIndex',
  //       meta: {
  //         title: t('router.home'),
  //         icon: 'ep:home-filled'
  //       }
  //     }
  //   ]
  // },

]
