 import { Layout } from '@/utils/routerHelper'

const { t } = useI18n()
/**
 * redirect: noredirect        当设置 noredirect 的时候该路由在面包屑导航中不可被点击
 * name:'router-name'          设定路由的名字，一定要填写不然使用<keep-alive>时会出现各种问题
 * meta : {
 hidden: true              当设置 true 的时候该路由不会再侧边栏出现 如404，login等页面(默认 false)

 alwaysShow: true          当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式，
 只有一个时，会将那个子路由当做根路由显示在侧边栏，
 若你想不管路由下面的 children 声明的个数都显示你的根路由，
 你可以设置 alwaysShow: true，这样它就会忽略之前定义的规则，
 一直显示根路由(默认 false)

 title: 'title'            设置该路由在侧边栏和面包屑中展示的名字

 icon: 'svg-name'          设置该路由的图标

 noCache: true             如果设置为true，则不会被 <keep-alive> 缓存(默认 false)

 breadcrumb: false         如果设置为false，则不会在breadcrumb面包屑中显示(默认 true)

 affix: true               如果设置为true，则会一直固定在tag项中(默认 false)

 noTagsView: true          如果设置为true，则不会出现在tag中(默认 false)

 activeMenu: '/dashboard'  显示高亮的路由路径

 followAuth: '/dashboard'  跟随哪个路由进行权限过滤

 canTo: true               设置为true即使hidden为true，也依然可以进行路由跳转(默认 false)
 }
 **/
const remainingRouter: AppRouteRecordRaw[] = [
  {
    path: '/',
    name: 'Root',
    redirect: '/home/index',
    meta: {
      hidden: true
    }
  },
  {
    path: '/redirect',
    component: Layout,
    name: 'Redirect',
    children: [
      {
        path: '/redirect/:path(.*)',
        name: 'Redirect',
        component: () => import('@/views/Redirect/Redirect.vue'),
        meta: {}
      }
    ],
    meta: {
      hidden: true,
      noTagsView: true
    }
  },
  {
    path: '/home',
    component: Layout,
    name: 'Home',
    redirect: '/home/index',
    meta: {
      title: '工作台',
      icon: 'ep:home-filled',
      order: 1,
      alwaysShow: true
    },
    children: [
      {
        path: 'index',
        component: () => import('@/views/Home/Index.vue'),
        name: 'Index',
        meta: {
          title: '首页',
          noCache: false,
          affix: true
        }
      },
      {
        path: 'hot-search',
        component: () => import('@/views/Home/HotSearch.vue'),
        name: 'HotSearch',
        meta: {
          title: '热搜'
        }
      },
      {
        path: 'tools',
        component: Layout,
        redirect: '/home/tools/index',
        name: 'Tools',
        meta: {
          title: '工具集合'
        },
        children: [
          {
            path: 'index',
            component: () => import('@/views/Home/Tools/Index.vue'),
            name: 'ToolsIndex',
            meta: {
              title: '工具列表'
            }
          }
        ]
  },
  {
        path: 'statistics',
        component: () => import('@/views/Home/Statistics/index.vue'),
        name: 'Statistics',
        meta: {
          title: '数据统计',
          requiresAdmin: true
        }
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/Login/Login.vue'),
    name: 'Login',
    meta: {
      hidden: true,
      title: t('router.login'),
      noTagsView: true
    }
  },
  {
    path: '/403',
    component: () => import('@/views/Error/403.vue'),
    name: 'NoAccess',
    meta: {
      hidden: true,
      title: '403',
      noTagsView: true
    }
  },
  {
    path: '/404',
    component: () => import('@/views/Error/404.vue'),
    name: 'NoFound',
    meta: {
      hidden: true,
      title: '404',
      noTagsView: true
    }
  },
  {
    path: '/500',
    component: () => import('@/views/Error/500.vue'),
    name: 'Error',
    meta: {
      hidden: true,
      title: '500',
      noTagsView: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/Error/404.vue'),
    name: '',
    meta: {
      title: '404',
      hidden: true,
      breadcrumb: false
    }
  },
  {
    path: '/resource',
    component: Layout,
    name: 'Resource',
    meta: {
      hidden: false,
      title: '设计资源',
      icon: 'ep:collection',
      noCache: false,
      affix: false
    },
    children: [
      {
        path: 'crawler-material',
        component: () => import('@/views/material/index/crawler-material.vue'),
        name: 'CrawlerMaterial',
        meta: {
          canTo: true,
          hidden: false,
          noTagsView: false,
          title: '爬图素材'
        }
      },
      {
        path: 'material',
        component: () => import('@/views/material/index/index.vue'),
        name: 'Material',
        meta: {
          canTo: true,
          hidden: false,
          noTagsView: false,
          title: '图片素材'
        }
      },
      {
        path: 'clip-material',
        component: () => import('@/views/material/clip-material/index.vue'),
        name: 'ClipMaterial',
        meta: {
          canTo: true,
          hidden: false,
          noTagsView: false,
          title: '剪辑素材'
        }
      },
      {
        path: 'font',
        component: () => import('@/views/material/fontTemplate/index.vue'),
        name: 'Font',
        meta: {
          canTo: true,
          hidden: false,
          noTagsView: false,
          title: '字体'
        }
      },
      {
        path: 'psd',
        component: () => import('@/views/material/psdTemplate/index.vue'),
        name: 'Psd',
        meta: {
          canTo: true,
          hidden: false,
          noTagsView: false,
          title: 'psd套图'
        }
      },

      {
        path: 'sentence',
        component: () => import('@/views/material/sentence/index.vue'),
        name: 'Sentence',
        meta: {
          canTo: true,
          hidden: false,
          noTagsView: false,
          title: '句子管理'
        }
      },

      // 仅管理员可见
      {
        path: 'draft',
        component: () => import('@/views/draft/index/index.vue'),
        name: 'Draft',
        meta: {
          canTo: true,
          hidden: false,
          noTagsView: false,
          title: '草稿图',
          requiresAdmin: true
        }
      },

      // 仅管理员可见
      {
        path: 'productModel',
        component: () => import('@/views/material/productModel/index.vue'),
        name: 'ProductModel',
        meta: {
          canTo: true,
          hidden: false,
          noTagsView: false,
          title: '商品3d模型',
          requiresAdmin: true
        }
      },
      {
        path: 'template-group-2d',
        component: () => import('@/views/material/templateGroup2D/index.vue'),
        name: 'TemplateGroup2D',
        meta: {
          canTo: true,
          hidden: false,
          noTagsView: false,
          title: '二维模板组',
          requiresAdmin: true
        }
      },
    ]
  },
  {
    path: '/product',
    component: Layout,
    name: 'Product',
    meta: {
      title: '商品管理',
      icon: 'ep:goods',
      order: 2,
      alwaysShow: true,
      requiresAdmin: true
    },
    children: [
      {
        path: 'designRequest',
        component: () => import('@/views/material/designRequest/index.vue'),
        name: 'DesignRequest',
        meta: {
          title: '设计请求',
        }
      },
      {
        path: 'designModel',
        component: () => import('@/views/material/designModel/index.vue'),
        name: 'DesignModel',
        meta: {
          title: '设计模型',
        }
      },
      {
        path: 'product-image-2d',
        component: () => import('@/views/product/productImage2D/index.vue'),
        name: 'ProductImage2D',
        meta: {
          title: '二维设计商品图',
        }
      },
      {
        path: 'psd-set',
        component: () => import('@/views/material/psdSet/index.vue'),
        name: 'PsdSet',
        meta: {
          canTo: true,
          hidden: false,
          noTagsView: false,
          title: '套图',
          requiresAdmin: true
        }
      },
      {
        path: 'index',
        component: () => import('@/views/product/index/index.vue'),
        name: 'ProductIndex',
        meta: {
          title: '商品',
        }
      },
    ]
  },
  {
    path: '/common-url',
    component: Layout,
    name: 'CommonUrl',
    meta: {
      title: '常用网址',
      icon: 'ep:link',
      order: 4,
      alwaysShow: true,
      requiresAdmin: true
    },
    children: [
      {
        path: 'index',
        component: () => import('@/views/material/commonUrl/index.vue'),
        name: 'CommonUrlIndex',
        meta: {
          title: '网址管理',
        }
      },
    ]
  },
  {
    path: '/system',
    component: Layout,
    name: 'System',
    meta: {
      title: '系统管理',
      icon: 'ep:setting',
      order: 3,
      alwaysShow: true,
      requiresAdmin: true
    },
    children: [
      {
        path: 'company',
        component: () => import('@/views/system/company/index.vue'),
        name: 'Company',
        meta: {
          title: '公司管理',
        }
      },
      {
        path: 'user',
        component: () => import('@/views/system/user/index.vue'),
        name: 'User',
        meta: {
          title: '用户管理',
        }
      },
      {
        path: 'websocket',
        component: () => import('@/views/system/websocket/index.vue'),
        name: 'SystemWebsocketConnections',
        meta: {
          title: '远程连接',
          requiresAdmin: true
        }
      },
      {
        path: 'operatelog',
        component: () => import('@/views/system/operatelog/index.vue'),
        name: 'SystemOperateLog',
        meta: {
          title: '操作日志',
        }
      },
    ]
  }

]

export default remainingRouter
