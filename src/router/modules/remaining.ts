import { Layout } from "@/utils/routerHelper";

const { t } = useI18n();
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
    path: "/",
    name: "Root",
    redirect: "/home/index",
    meta: {
      hidden: true,
    },
  },
  {
    path: "/redirect",
    component: Layout,
    name: "Redirect",
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/views/Redirect/Redirect.vue"),
        meta: {},
      },
    ],
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/home",
    component: Layout,
    name: "Home",
    redirect: "/home/index",
    meta: {
      title: "工作台",
      icon: "ep:home-filled",
      order: 1,
      alwaysShow: true,
    },
    children: [
      {
        path: "index",
        component: () => import("@/views/Home/Index.vue"),
        name: "Index",
        meta: {
          title: "首页",
          noCache: false,
          affix: true,
        },
      },
      {
        path: "hot-search",
        component: () => import("@/views/Home/HotSearch.vue"),
        name: "HotSearch",
        meta: {
          title: "热搜",
        },
      },
      {
        path: "tools",
        redirect: "/home/tools/index",
        name: "Tools",
        meta: {
          title: "工具集合",
        },
        children: [
          {
            path: "index",
            component: () => import("@/views/Home/Tools/Index.vue"),
            name: "ToolsIndex",
            meta: {
              title: "工具列表",
            },
          },
        ],
      },
      {
        path: "statistics",
        component: () => import("@/views/Home/Statistics/index.vue"),
        name: "Statistics",
        meta: {
          title: "数据统计",
          requiresAdmin: true,
        },
      },
    ],
  },
  {
    path: "/login",
    component: () => import("@/views/Login/Login.vue"),
    name: "Login",
    meta: {
      hidden: true,
      title: t("router.login"),
      noTagsView: true,
    },
  },
  {
    path: "/403",
    component: () => import("@/views/Error/403.vue"),
    name: "NoAccess",
    meta: {
      hidden: true,
      title: "403",
      noTagsView: true,
    },
  },
  {
    path: "/404",
    component: () => import("@/views/Error/404.vue"),
    name: "NoFound",
    meta: {
      hidden: true,
      title: "404",
      noTagsView: true,
    },
  },
  {
    path: "/500",
    component: () => import("@/views/Error/500.vue"),
    name: "Error",
    meta: {
      hidden: true,
      title: "500",
      noTagsView: true,
    },
  },
  {
    path: "/resource",
    component: Layout,
    name: "Resource",
    redirect: "/resource/material-center/material",
    meta: {
      hidden: false,
      title: "资源中心",
      icon: "ep:collection",
      noCache: false,
      affix: false,
      order: 2,
      alwaysShow: true,
    },
    children: [
      {
        path: "material-center",
        redirect: "/resource/material-center/material",
        name: "ResourceMaterialCenter",
        meta: {
          title: "素材中心",
          alwaysShow: true,
        },
        children: [
          {
            path: "crawler-material",
            component: () => import("@/views/material/index/crawler-material.vue"),
            name: "CrawlerMaterial",
            meta: {
              canTo: true,
              hidden: false,
              noTagsView: false,
              title: "爬图素材",
            },
          },
          {
            path: "material",
            component: () => import("@/views/material/index/index.vue"),
            name: "Material",
            meta: {
              canTo: true,
              hidden: false,
              noTagsView: false,
              title: "图片素材",
            },
          },
          {
            path: "clip-material",
            component: () => import("@/views/material/clip-material/index.vue"),
            name: "ClipMaterial",
            meta: {
              canTo: true,
              hidden: false,
              noTagsView: false,
              title: "媒体剪辑素材",
            },
          },
        ],
      },
      {
        path: "asset-library",
        redirect: "/resource/asset-library/font",
        name: "ResourceAssetLibrary",
        meta: {
          title: "模板与资产",
          alwaysShow: true,
        },
        children: [
          {
            path: "font",
            component: () => import("@/views/material/fontTemplate/index.vue"),
            name: "Font",
            meta: {
              canTo: true,
              hidden: false,
              noTagsView: false,
              title: "字体",
            },
          },
          {
            path: "psd",
            component: () => import("@/views/material/psdTemplate/index.vue"),
            name: "Psd",
            meta: {
              canTo: true,
              hidden: false,
              noTagsView: false,
              title: "PSD模板",
            },
          },
        ],
      },
      {
        path: "content-assets",
        redirect: "/resource/content-assets/story-script",
        name: "ResourceContentAssets",
        meta: {
          title: "文案资产",
          alwaysShow: true,
        },
        children: [
          {
            path: "story-script",
            component: () => import("@/views/material/storyScript/index.vue"),
            name: "StoryScript",
            meta: {
              canTo: true,
              hidden: false,
              noTagsView: false,
              title: "故事脚本",
              requiresAdmin: true,
            },
          },
          {
            path: "sentence",
            component: () => import("@/views/material/sentence/index.vue"),
            name: "Sentence",
            meta: {
              canTo: true,
              hidden: false,
              noTagsView: false,
              title: "句子管理",
            },
          },
        ],
      },
    ],
  },
  {
    path: "/content",
    component: Layout,
    name: "Content",
    redirect: "/content/automation/code-script",
    meta: {
      title: "内容与自动化",
      icon: "ep:files",
      order: 3,
      alwaysShow: true,
      requiresAdmin: true,
    },
    children: [
      {
        path: "automation",
        redirect: "/content/automation/code-script",
        name: "ContentAutomation",
        meta: {
          title: "自动化生产",
          alwaysShow: true,
        },
        children: [
          {
            path: "code-script",
            component: () => import("@/views/material/codeScript/index.vue"),
            name: "CodeScript",
            meta: {
              canTo: true,
              hidden: false,
              noTagsView: false,
              title: "代码脚本",
              requiresAdmin: true,
            },
          },
          {
            path: "code-script-schedule",
            component: () => import("@/views/material/codeScriptSchedule/index.vue"),
            name: "CodeScriptSchedule",
            meta: {
              canTo: true,
              hidden: false,
              noTagsView: false,
              title: "脚本调度",
              requiresAdmin: true,
            },
          },
          {
            path: "remotion-video-record",
            component: () => import("@/views/material/remotionVideoRecord/index.vue"),
            name: "RemotionVideoRecord",
            meta: {
              canTo: true,
              hidden: false,
              noTagsView: false,
              title: "视频生成(remotion)",
              requiresAdmin: true,
            },
          },
        ],
      },
    ],
  },
  {
    path: "/ai",
    component: Layout,
    name: "AiService",
    redirect: "/ai/generation/tti",
    meta: {
      title: "AI创作",
      icon: "ep:cpu",
      order: 4,
      alwaysShow: true,
    },
    children: [
      {
        path: "generation",
        redirect: "/ai/generation/tti",
        name: "AiGeneration",
        meta: {
          title: "生成能力",
          alwaysShow: true,
        },
        children: [
          {
            path: "tti",
            component: () => import("@/views/ai/tti.vue"),
            name: "AiTti",
            meta: {
              title: "AI文字生成图片",
            },
          },
          {
            path: "tts",
            component: () => import("@/views/ai/tts.vue"),
            name: "AiTts",
            meta: {
              title: "AI文字转语音",
            },
          },
          {
            path: "agent",
            component: () => import("@/views/ai/agent/index.vue"),
            name: "AiAgentConsole",
            meta: {
              title: "Agent 控制台",
              requiresAdmin: true,
            },
          },
        ],
      },
      {
        path: "assets",
        redirect: "/ai/assets/prompt",
        name: "AiAssets",
        meta: {
          title: "提示词与配置",
          alwaysShow: true,
        },
        children: [
          {
            path: "prompt",
            component: () => import("@/views/material/prompt/index.vue"),
            name: "Prompt",
            meta: {
              canTo: true,
              hidden: false,
              noTagsView: false,
              title: "AI提示词管理",
              requiresAdmin: true,
            },
          },
        ],
      },
    ],
  },
  {
    path: "/product",
    component: Layout,
    name: "Product",
    redirect: "/product/catalog/index",
    meta: {
      title: "商品与发布",
      icon: "ep:goods",
      order: 5,
      alwaysShow: true,
      requiresAdmin: true,
    },
    children: [
      {
        path: "catalog",
        redirect: "/product/catalog/index",
        name: "ProductCatalog",
        meta: {
          title: "商品基础",
          alwaysShow: true,
        },
        children: [
          {
            path: "category",
            component: () => import("@/views/product/category/index.vue"),
            name: "ProductCategory",
            meta: {
              title: "商品种类",
            },
          },
          {
            path: "index",
            component: () => import("@/views/product/index/index.vue"),
            name: "ProductIndex",
            meta: {
              title: "商品",
            },
          },
          {
            path: "psd-set",
            component: () => import("@/views/material/psdSet/index.vue"),
            name: "PsdSet",
            meta: {
              canTo: true,
              hidden: false,
              noTagsView: false,
              title: "套图",
              requiresAdmin: true,
            },
          },
        ],
      },
      {
        path: "collaboration",
        redirect: "/product/collaboration/design-request",
        name: "ProductCollaboration",
        meta: {
          title: "设计与供应",
          alwaysShow: true,
        },
        children: [
          {
            path: "design-request",
            component: () => import("@/views/material/designRequest/index.vue"),
            name: "DesignRequest",
            meta: {
              title: "设计请求",
            },
          },
        ],
      },
      {
        path: "publishing",
        redirect: "/product/publishing/publish-config",
        name: "ProductPublishing",
        meta: {
          title: "发布中心",
          alwaysShow: true,
        },
        children: [
          {
            path: "publish-config",
            component: () => import("@/views/product/publish-config/index.vue"),
            name: "PublishConfig",
            meta: {
              title: "发布配置",
            },
          },
          {
            path: "queue",
            component: () => import("@/views/system/queue/index.vue"),
            name: "SystemQueue",
            meta: {
              title: "平台发布任务",
            },
          },
        ],
      },
    ],
  },
  {
    path: "/operation",
    component: Layout,
    name: "Operation",
    redirect: "/operation/shop/index",
    meta: {
      title: "运营支持",
      icon: "ep:shop",
      order: 6,
      alwaysShow: true,
    },
    children: [
      {
        path: "shop",
        redirect: "/operation/shop/index",
        name: "OperationShop",
        meta: {
          title: "渠道与店铺",
          alwaysShow: true,
        },
        children: [
          {
            path: "index",
            component: () => import("@/views/shop/index.vue"),
            name: "ShopIndex",
            meta: {
              title: "店铺列表",
            },
          },
          {
            path: "vendor",
            component: () => import("@/views/vendor/index.vue"),
            name: "VendorIndex",
            meta: {
              title: "厂家管理",
            },
          },
        ],
      },
      {
        path: "tools",
        redirect: "/operation/tools/common-url",
        name: "OperationTools",
        meta: {
          title: "运营工具",
          alwaysShow: true,
        },
        children: [
          {
            path: "message-push",
            component: () => import("@/views/message-push/index.vue"),
            name: "MessagePushIndex",
            meta: {
              title: "消息推送",
              requiresAdmin: true,
            },
          },
          {
            path: "common-url",
            component: () => import("@/views/material/commonUrl/index.vue"),
            name: "CommonUrlIndex",
            meta: {
              title: "网址管理",
              requiresAdmin: true,
            },
          },
        ],
      },
    ],
  },
  {
    path: "/system",
    component: Layout,
    name: "System",
    redirect: "/system/account/user",
    meta: {
      title: "系统管理",
      icon: "ep:setting",
      order: 7,
      alwaysShow: true,
      requiresAdmin: true,
    },
    children: [
      {
        path: "account",
        redirect: "/system/account/user",
        name: "SystemAccount",
        meta: {
          title: "组织与账号",
          alwaysShow: true,
        },
        children: [
          {
            path: "user",
            component: () => import("@/views/system/user/index.vue"),
            name: "User",
            meta: {
              title: "用户管理",
            },
          },
          {
            path: "company",
            component: () => import("@/views/system/company/index.vue"),
            name: "Company",
            meta: {
              title: "公司管理",
            },
          },
          {
            path: "public-user",
            component: () => import("@/views/system/public-user/index.vue"),
            name: "PublicUser",
            meta: {
              title: "开放用户管理",
            },
          },
        ],
      },
      {
        path: "ops",
        redirect: "/system/ops/websocket",
        name: "SystemOps",
        meta: {
          title: "连接与审计",
          alwaysShow: true,
        },
        children: [
          {
            path: "websocket",
            component: () => import("@/views/system/websocket/index.vue"),
            name: "SystemWebsocketConnections",
            meta: {
              title: "远程连接",
              requiresAdmin: true,
            },
          },
          {
            path: "operatelog",
            component: () => import("@/views/system/operatelog/index.vue"),
            name: "SystemOperateLog",
            meta: {
              title: "操作日志",
            },
          },
        ],
      },
    ],
  },
  {
    path: "/resource/crawler-material",
    redirect: "/resource/material-center/crawler-material",
    name: "ResourceCrawlerMaterialCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/material",
    redirect: "/resource/material-center/material",
    name: "ResourceMaterialCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/clip-material",
    redirect: "/resource/material-center/clip-material",
    name: "ResourceClipMaterialCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/font",
    redirect: "/resource/asset-library/font",
    name: "ResourceFontCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/psd",
    redirect: "/resource/asset-library/psd",
    name: "ResourcePsdCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/sentence",
    redirect: "/resource/content-assets/sentence",
    name: "ResourceSentenceCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/story-script",
    redirect: "/resource/content-assets/story-script",
    name: "ResourceStoryScriptCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/prompt",
    redirect: "/ai/assets/prompt",
    name: "ResourcePromptCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/code-script",
    redirect: "/content/automation/code-script",
    name: "ResourceCodeScriptCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/code-script-schedule",
    redirect: "/content/automation/code-script-schedule",
    name: "ResourceCodeScriptScheduleCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/remotion-video-record",
    redirect: "/content/automation/remotion-video-record",
    name: "ResourceRemotionVideoRecordCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/shop",
    redirect: "/operation/shop/index",
    name: "ShopCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/shop/index",
    redirect: "/operation/shop/index",
    name: "ShopIndexCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/shop/vendor",
    redirect: "/operation/shop/vendor",
    name: "ShopVendorCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/product/collaboration/vendor",
    redirect: "/operation/shop/vendor",
    name: "ProductCollaborationVendorCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/common-url",
    redirect: "/operation/tools/common-url",
    name: "CommonUrlCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/common-url/index",
    redirect: "/operation/tools/common-url",
    name: "CommonUrlIndexCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/product/category",
    redirect: "/product/catalog/category",
    name: "ProductCategoryCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/product/index",
    redirect: "/product/catalog/index",
    name: "ProductIndexCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/product/psd-set",
    redirect: "/product/catalog/psd-set",
    name: "ProductPsdSetCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/product/designRequest",
    redirect: "/product/collaboration/design-request",
    name: "ProductDesignRequestCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/product/publish-config",
    redirect: "/product/publishing/publish-config",
    name: "ProductPublishConfigCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/product/queue",
    redirect: "/product/publishing/queue",
    name: "ProductQueueCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/system/user",
    redirect: "/system/account/user",
    name: "SystemUserCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/system/company",
    redirect: "/system/account/company",
    name: "SystemCompanyCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/system/public-user",
    redirect: "/system/account/public-user",
    name: "SystemPublicUserCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/system/websocket",
    redirect: "/system/ops/websocket",
    name: "SystemWebsocketCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/system/operatelog",
    redirect: "/system/ops/operatelog",
    name: "SystemOperateLogCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import("@/views/Error/404.vue"),
    name: "",
    meta: {
      title: "404",
      hidden: true,
      breadcrumb: false,
    },
  },
];

export default remainingRouter;
