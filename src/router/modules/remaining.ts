import { Layout } from "@/utils/routerHelper";
import { ROUTE_MENU_KEY_MAP } from "@/constants/access-control";

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
    name: "RedirectRoot",
    children: [
      {
        path: ":path(.*)",
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
        path: "tools/index",
        component: () => import("@/views/Home/Tools/Index.vue"),
        name: "ToolsIndex",
        meta: {
          title: "工具",
        },
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
    redirect: "/resource/material",
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
        path: "file-resource",
        alias: "/resource/clip-material",
        component: () => import("@/views/material/clip-material/index.vue"),
        name: "FileResource",
        meta: {
          canTo: true,
          hidden: false,
          noTagsView: false,
          title: "文件资源",
        },
      },
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
  {
    path: "/content",
    component: Layout,
    name: "Content",
    redirect: "/content/code-script",
    meta: {
      title: "内容与自动化",
      icon: "ep:files",
      order: 3,
      alwaysShow: true,
      requiresAdmin: true,
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
          serviceStatusKey: "sandbox",
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
          title: "视频生成 (模板)",
          requiresAdmin: true,
          serviceStatusKey: "remotion",
        },
      },
      {
        path: "image-processing-record",
        component: () => import("@/views/material/imageProcessingRecord/index.vue"),
        name: "ImageProcessingRecord",
        meta: {
          canTo: true,
          hidden: false,
          noTagsView: false,
          title: "图片处理",
          requiresAdmin: true,
          serviceStatusKey: "images",
        },
      },
    ],
  },
  {
    path: "/external",
    component: Layout,
    name: "ExternalFeature",
    redirect: "/external/browser-automation",
    meta: {
      title: "客户端功能",
      icon: "ep:connection",
      order: 4,
      alwaysShow: true,
      requiresAdmin: true,
    },
    children: [
      {
        path: "browser-automation",
        component: () => import("@/views/external/browser-automation/index.vue"),
        name: "ExternalBrowserAutomation",
        meta: {
          title: "浏览器自动化",
          requiresAdmin: true,
        },
      },
      {
        path: "ps-automation",
        component: () => import("@/views/system/ps-console/index.vue"),
        name: "ExternalPsAutomation",
        meta: {
          title: "PS 自动化",
          requiresAdmin: true,
        },
      },
      {
        path: "google-art",
        component: () => import("@/views/external/google-art/index.vue"),
        name: "ExternalGoogleArt",
        meta: {
          title: "Google Art",
          requiresAdmin: true,
        },
      },
    ],
  },
  {
    path: "/ai",
    component: Layout,
    name: "AiService",
    redirect: "/ai/tti",
    meta: {
      title: "AI创作",
      icon: "ep:cpu",
      order: 4,
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
  {
    path: "/product",
    component: Layout,
    name: "Product",
    redirect: "/product/index",
    meta: {
      title: "商品与发布",
      icon: "ep:goods",
      order: 5,
      alwaysShow: true,
      requiresAdmin: true,
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
      {
        path: "design-request",
        component: () => import("@/views/material/designRequest/index.vue"),
        name: "DesignRequest",
        meta: {
          title: "设计请求",
        },
      },
      {
        path: "publish-config",
        component: () => import("@/views/product/publish-config/index.vue"),
        name: "PublishConfig",
        meta: {
          title: "任务配置",
        },
      },
      {
        path: "queue",
        component: () => import("@/views/system/queue/index.vue"),
        name: "SystemQueue",
        meta: {
          title: "平台任务",
        },
      },
    ],
  },
  {
    path: "/ecom-platform-collect",
    component: Layout,
    name: "EcomPlatformCollectRoot",
    redirect: "/ecom-platform-collect/tasks",
    meta: {
      title: "电商数据链路",
      icon: "ep:data-analysis",
      order: 6,
      alwaysShow: true,
    },
    children: [
      {
        path: "tasks",
        component: () => import("@/views/operation/ecom-platform-collect/index.vue"),
        name: "EcomPlatformCollectTaskPage",
        meta: {
          title: "采集任务",
          noCache: true,
          order: 1,
        },
      },
      {
        path: "runs",
        component: () => import("@/views/operation/ecom-platform-collect/runs.vue"),
        name: "EcomPlatformCollectRunPage",
        meta: {
          title: "采集运行",
          noCache: true,
          order: 2,
        },
      },
      {
        path: "raw-records",
        component: () => import("@/views/operation/ecom-platform-collect/raw-records.vue"),
        name: "EcomPlatformCollectRawPage",
        meta: {
          title: "原始数据",
          noCache: true,
          order: 3,
        },
      },
      {
        path: "selection-analysis/tasks",
        component: () => import("@/views/operation/ecom-selection-analysis/index.vue"),
        name: "EcomSelectionAnalysisTaskPage",
        meta: {
          title: "选品分析任务",
          noCache: true,
          order: 4,
        },
      },
      {
        path: "selection-analysis/runs",
        component: () => import("@/views/operation/ecom-selection-analysis/runs.vue"),
        name: "EcomSelectionAnalysisRunPage",
        meta: {
          title: "选品分析结果",
          noCache: true,
          order: 5,
        },
      },
      {
        path: "supply-match/tasks",
        component: () => import("@/views/operation/ecom-selection-supply-match/index.vue"),
        name: "EcomSelectionSupplyMatchTaskPage",
        meta: {
          title: "找同款任务",
          noCache: true,
          order: 6,
        },
      },
      {
        path: "supply-match/runs",
        component: () => import("@/views/operation/ecom-selection-supply-match/runs.vue"),
        name: "EcomSelectionSupplyMatchRunPage",
        meta: {
          title: "找同款运行",
          noCache: true,
          order: 7,
        },
      },
      {
        path: "supply-match/items",
        component: () => import("@/views/operation/ecom-selection-supply-match/items.vue"),
        name: "EcomSelectionSupplyMatchItemPage",
        meta: {
          title: "找同款结果",
          noCache: true,
          order: 8,
        },
      },
    ],
  },
  {
    path: "/operation",
    component: Layout,
    name: "Operation",
    redirect: "/operation/link-navigation",
    meta: {
      title: "运营支持",
      icon: "ep:shop",
      order: 7,
      alwaysShow: true,
    },
    children: [
      {
        path: "link-navigation",
        component: () => import("@/views/operation/link-navigation/index.vue"),
        name: "OperationLinkNavigation",
        meta: {
          title: "链接导航",
        },
      },
      {
        path: "shop",
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
  {
    path: "/personal",
    component: Layout,
    name: "Personal",
    redirect: "/personal/settings",
    meta: {
      title: "个人设置",
      icon: "ep:user-filled",
      order: 7,
      alwaysShow: true,
    },
    children: [
      {
        path: "settings",
        component: () => import("@/views/Profile/Index.vue"),
        name: "PersonalSettings",
        meta: {
          title: "个人设置",
        },
      },
    ],
  },
  {
    path: "/system",
    component: Layout,
    name: "System",
    redirect: "/system/user",
    meta: {
      title: "系统管理",
      icon: "ep:setting",
      order: 8,
      alwaysShow: true,
      requiresAdmin: true,
    },
    children: [
      {
        path: "ai-api-key",
        component: () => import("@/views/system/ai-api-key/index.vue"),
        name: "SystemAiApiKeyIndex",
        meta: {
          title: "AI API Key",
          requiresAdmin: true,
        },
      },
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
  {
    path: "/user/profile",
    redirect: "/personal/settings",
    name: "UserProfileCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/material-center/crawler-material",
    redirect: "/resource/crawler-material",
    name: "ResourceMaterialCenterCrawlerCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/material-center/material",
    redirect: "/resource/material",
    name: "ResourceMaterialCenterMaterialCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/material-center/clip-material",
    redirect: "/resource/file-resource",
    name: "ResourceMaterialCenterFileResourceCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/asset-library/font",
    redirect: "/resource/font",
    name: "ResourceAssetLibraryFontCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/asset-library/psd",
    redirect: "/resource/psd",
    name: "ResourceAssetLibraryPsdCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/content-assets/sentence",
    redirect: "/resource/sentence",
    name: "ResourceContentAssetsSentenceCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/resource/content-assets/story-script",
    redirect: "/resource/story-script",
    name: "ResourceContentAssetsStoryScriptCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/ai/assets/prompt",
    redirect: "/ai/prompt",
    name: "AiAssetsPromptCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/content/automation/code-script",
    redirect: "/content/code-script",
    name: "ContentAutomationCodeScriptCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/content/automation/code-script-schedule",
    redirect: "/content/code-script-schedule",
    name: "ContentAutomationCodeScriptScheduleCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/content/automation/remotion-video-record",
    redirect: "/content/remotion-video-record",
    name: "ContentAutomationRemotionVideoRecordCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/content/automation/image-processing-record",
    redirect: "/content/image-processing-record",
    name: "ContentAutomationImageProcessingRecordCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/ai/generation/tti",
    redirect: "/ai/tti",
    name: "AiGenerationTtiCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/ai/generation/tts",
    redirect: "/ai/tts",
    name: "AiGenerationTtsCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/ai/generation/agent",
    redirect: "/ai/agent",
    name: "AiGenerationAgentCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/shop",
    redirect: "/operation/shop",
    name: "ShopCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/shop/index",
    redirect: "/operation/shop",
    name: "ShopIndexCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/shop/vendor",
    redirect: "/operation/vendor",
    name: "ShopVendorCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/product/collaboration/vendor",
    redirect: "/operation/vendor",
    name: "ProductCollaborationVendorCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/common-url",
    redirect: "/operation/common-url",
    name: "CommonUrlCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/common-url/index",
    redirect: "/operation/common-url",
    name: "CommonUrlIndexCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/product/catalog/category",
    redirect: "/product/category",
    name: "ProductCatalogCategoryCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/product/catalog/index",
    redirect: "/product/index",
    name: "ProductCatalogIndexCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/product/catalog/psd-set",
    redirect: "/product/psd-set",
    name: "ProductCatalogPsdSetCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/product/designRequest",
    redirect: "/product/design-request",
    name: "ProductDesignRequestCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/product/collaboration/design-request",
    redirect: "/product/design-request",
    name: "ProductCollaborationDesignRequestCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/product/publishing/publish-config",
    redirect: "/product/publish-config",
    name: "ProductPublishingPublishConfigCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/product/publishing/queue",
    redirect: "/product/queue",
    name: "ProductPublishingQueueCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/operation/shop/index",
    redirect: "/operation/shop",
    name: "OperationShopIndexCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/operation/shop/vendor",
    redirect: "/operation/vendor",
    name: "OperationShopVendorCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/operation/tools/common-url",
    redirect: "/operation/common-url",
    name: "OperationToolsCommonUrlCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/system/organization/ai-api-key",
    redirect: "/system/ai-api-key",
    name: "SystemOrganizationAiApiKeyCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/system/organization/message-push",
    redirect: "/system/message-push",
    name: "SystemOrganizationMessagePushCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/system/organization/user",
    redirect: "/system/user",
    name: "SystemOrganizationUserCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/system/organization/company",
    redirect: "/system/company",
    name: "SystemOrganizationCompanyCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/system/organization/public-user",
    redirect: "/system/public-user",
    name: "SystemOrganizationPublicUserCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/system/audit/websocket",
    redirect: "/system/websocket",
    name: "SystemAuditWebsocketCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/system/audit/operatelog",
    redirect: "/system/operatelog",
    name: "SystemAuditOperatelogCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/operation/ecom-platform-collect",
    redirect: "/ecom-platform-collect/tasks",
    name: "OperationEcomPlatformCollectCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/system/account/:pathMatch(.*)*",
    redirect: (to) => `/system/${String(to.params.pathMatch || "")}`,
    name: "SystemAccountCompat",
    meta: {
      hidden: true,
      noTagsView: true,
    },
  },
  {
    path: "/system/ops/:pathMatch(.*)*",
    redirect: (to) => `/system/${String(to.params.pathMatch || "")}`,
    name: "SystemOpsCompat",
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

function attachMenuKeys(routes: AppRouteRecordRaw[]): AppRouteRecordRaw[] {
  return routes.map((route) => {
    const menuKey = route.name ? ROUTE_MENU_KEY_MAP[String(route.name)] : "";
    return {
      ...route,
      meta: menuKey
        ? {
            ...(route.meta || {}),
            menuKey,
          }
        : route.meta,
      children: route.children ? attachMenuKeys(route.children) : route.children,
    };
  });
}

export default attachMenuKeys(remainingRouter);
