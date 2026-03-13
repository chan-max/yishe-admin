import { Layout } from '@/utils/routerHelper'

const { t } = useI18n()
/**
 * 路由字段说明：
 * redirect: 设置重定向地址。
 * name: 路由名称，需保持唯一，便于 keep-alive 与菜单状态管理。
 * meta.hidden: 是否在侧边栏隐藏。
 * meta.alwaysShow: 即使只有一个子路由，也始终显示父级菜单。
 * meta.title: 菜单、面包屑、标签页显示名称。
 * meta.icon: 菜单图标。
 * meta.noCache: 是否禁用 keep-alive 缓存。
 * meta.breadcrumb: 是否显示在面包屑中。
 * meta.affix: 是否固定在标签页。
 * meta.noTagsView: 是否不显示在标签页中。
 * meta.activeMenu: 高亮指定菜单。
 * meta.followAuth: 跟随指定路由做权限控制。
 * meta.canTo: 即使 hidden 为 true，也允许路由跳转。
 */
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
          title: '媒体剪辑素材'
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
          title: 'PSD模板'
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
      {
        path: 'prompt',
        component: () => import('@/views/material/prompt/index.vue'),
        name: 'Prompt',
        meta: {
          canTo: true,
          hidden: false,
          noTagsView: false,
          title: 'AI提示词管理',
          requiresAdmin: true
        }
      },
      
      {
        path: 'story-script',
        component: () => import('@/views/material/storyScript/index.vue'),
        name: 'StoryScript',
        meta: {
          canTo: true,
          hidden: false,
          noTagsView: false,
          title: '故事脚本',
          requiresAdmin: true
        }
      },
      {
        path: 'remotion-video-record',
        component: () => import('@/views/material/remotionVideoRecord/index.vue'),
        name: 'RemotionVideoRecord',
        meta: {
          canTo: true,
          hidden: false,
          noTagsView: false,
          title: '视频生成',
          requiresAdmin: true
        }
      },

      // 仅管理员可见
      // {
      //   path: 'draft',
      //   component: () => import('@/views/draft/index/index.vue'),
      //   name: 'Draft',
      //   meta: {
      //     canTo: true,
      //     hidden: false,
      //     noTagsView: false,
      //     title: '草稿图',
      //     requiresAdmin: true
      //   }
      // },

      // 仅管理员可见
      // {
      //   path: 'productModel',
      //   component: () => import('@/views/material/productModel/index.vue'),
      //   name: 'ProductModel',
      //   meta: {
      //     canTo: true,
      //     hidden: false,
      //     noTagsView: false,
      //     title: '商品3D模型',
      //     requiresAdmin: true
      //   }
      // },
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
        path: 'category',
        component: () => import('@/views/product/category/index.vue'),
        name: 'ProductCategory',
        meta: {
          title: '商品种类',
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
      {
        path: 'publish-config',
        component: () => import('@/views/product/publish-config/index.vue'),
        name: 'PublishConfig',
        meta: {
          title: '发布配置',
        }
      },
      {
        path: 'queue',
        component: () => import('@/views/system/queue/index.vue'),
        name: 'SystemQueue',
        meta: {
          title: '平台发布任务',
        }
      },
    ]
  },
  {
    path: '/ai',
    component: Layout,
    name: 'AiService',
    meta: {
      title: 'AI服务',
      icon: 'ep:cpu',
      alwaysShow: true
    },
    children: [
      {
        path: 'tts',
        component: () => import('@/views/ai/tts.vue'),
        name: 'AiTts',
        meta: {
          title: 'AI文字转语音',
        }
      },
      {
        path: 'tti',
        component: () => import('@/views/ai/tti.vue'),
        name: 'AiTti',
        meta: {
          title: 'AI文字生成图片',
        }
      }
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
        path: 'public-user',
        component: () => import('@/views/system/public-user/index.vue'),
        name: 'PublicUser',
        meta: {
          title: '开放用户管理',
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

  , {
    path: '/shop',
    component: Layout,
    redirect: '/shop/index',
    name: 'Shop',
    meta: {
      title: '运营管理',
      icon: 'ep:shop',
      order: 5,
      alwaysShow: true
    },
    children: [
      {
        path: 'index',
        component: () => import('@/views/shop/index.vue'),
        name: 'ShopIndex',
        meta: {
          title: '店铺列表'
        }
      }
    ]
  }
]

export default remainingRouter









