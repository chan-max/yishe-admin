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
  {
    path: '/system',
    component: Layout,
    name: 'System',
    meta: {
      title: t('router.system'),
      icon: 'ep:setting',
      order: 1
    },
    children: [
      {
        path: 'user',
        component: () => import('@/views/system/user/index.vue'),
        name: 'SystemUser',
        meta: {
          title: t('router.systemUser'),
          icon: 'ep:user'
        }
      },
      {
        path: 'role',
        component: () => import('@/views/system/role/index.vue'),
        name: 'SystemRole',
        meta: {
          title: t('router.systemRole'),
          icon: 'ep:user-filled'
        }
      },
      {
        path: 'menu',
        component: () => import('@/views/system/menu/index.vue'),
        name: 'SystemMenu',
        meta: {
          title: t('router.systemMenu'),
          icon: 'ep:menu'
        }
      },
      {
        path: 'dept',
        component: () => import('@/views/system/dept/index.vue'),
        name: 'SystemDept',
        meta: {
          title: t('router.systemDept'),
          icon: 'ep:office-building'
        }
      }
    ]
  },
] 