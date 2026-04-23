// 保留历史权限 key，避免线上已有角色权限失效；展示语义已经统一为“文件资源”。
const FILE_RESOURCE_MENU_KEY = "resource.clip-material";

export interface MenuAccessOption {
  key: string;
  label: string;
  adminOnly?: boolean;
}

export interface MenuAccessGroup {
  label: string;
  options: MenuAccessOption[];
}

export const ADMIN_ONLY_MENU_KEYS = new Set([
  "system.user",
  "system.company",
  "system.public-user",
  "system.websocket",
  "system.operatelog",
]);

export const MENU_ACCESS_GROUPS: MenuAccessGroup[] = [
  {
    label: "工作台",
    options: [
      { key: "home.index", label: "首页" },
      { key: "home.hot-search", label: "热搜" },
      { key: "home.tools", label: "工具" },
      { key: "home.statistics", label: "数据统计" },
    ],
  },
  {
    label: "资源中心",
    options: [
      { key: "resource.crawler-material", label: "爬图素材" },
      { key: "resource.material", label: "图片素材" },
      { key: FILE_RESOURCE_MENU_KEY, label: "文件资源" },
      { key: "resource.font", label: "字体" },
      { key: "resource.psd", label: "PSD模板" },
      { key: "resource.story-script", label: "故事脚本" },
      { key: "resource.sentence", label: "文案管理" },
    ],
  },
  {
    label: "内容与自动化",
    options: [
      { key: "content.code-script", label: "代码脚本" },
      { key: "content.code-script-schedule", label: "脚本调度" },
      { key: "content.remotion-video-record", label: "视频模板(video-template)" },
      { key: "content.image-processing-record", label: "图片处理(image-tool)" },
    ],
  },
  {
    label: "客户端功能",
    options: [
      { key: "external.browser-automation", label: "浏览器自动化" },
      { key: "external.browser-plugin", label: "浏览器插件" },
      { key: "external.ps-automation", label: "PS 自动化" },
      { key: "external.google-art", label: "Google Art" },
    ],
  },
  {
    label: "AI创作",
    options: [
      { key: "ai.assistant", label: "智能助手" },
      { key: "ai.tti", label: "AI文字生成图片" },
      { key: "ai.tts", label: "AI文字转语音" },
      { key: "ai.agent", label: "Agent 控制台" },
      { key: "ai.prompt", label: "AI提示词管理" },
    ],
  },
  {
    label: "商品与发布",
    options: [
      { key: "product.category", label: "商品种类" },
      { key: "product.index", label: "商品" },
      { key: "product.psd-set", label: "套图" },
      { key: "product.design-request", label: "设计需求" },
      { key: "product.publish-config", label: "任务配置" },
      { key: "product.queue", label: "任务队列" },
    ],
  },
  {
    label: "运营支持",
    options: [
      { key: "operation.ecom-platform-collect", label: "电商数据链路" },
      { key: "external.toolkit", label: "工具集" },
      { key: "operation.link-navigation", label: "链接导航" },
      { key: "operation.shop", label: "店铺" },
      { key: "operation.vendor", label: "厂家" },
      { key: "operation.common-url", label: "通用链接" },
    ],
  },
  {
    label: "系统管理",
    options: [
      { key: "system.ai-api-key", label: "AI API Key" },
      { key: "system.message-push", label: "消息推送" },
      { key: "system.user", label: "用户管理", adminOnly: true },
      { key: "system.company", label: "公司管理", adminOnly: true },
      { key: "system.public-user", label: "开放用户管理", adminOnly: true },
      { key: "system.websocket", label: "远程连接", adminOnly: true },
      { key: "system.operatelog", label: "操作日志", adminOnly: true },
    ],
  },
  {
    label: "个人账户",
    options: [{ key: "personal.settings", label: "个人设置" }],
  },
];

export const ROUTE_MENU_KEY_MAP: Record<string, string> = {
  Index: "home.index",
  HotSearch: "home.hot-search",
  ToolsIndex: "home.tools",
  Statistics: "home.statistics",
  CrawlerMaterial: "resource.crawler-material",
  Material: "resource.material",
  FileResource: FILE_RESOURCE_MENU_KEY,
  ClipMaterial: FILE_RESOURCE_MENU_KEY,
  Font: "resource.font",
  Psd: "resource.psd",
  StoryScript: "resource.story-script",
  Sentence: "resource.sentence",
  CodeScript: "content.code-script",
  CodeScriptSchedule: "content.code-script-schedule",
  RemotionVideoRecord: "content.remotion-video-record",
  ImageProcessingRecord: "content.image-processing-record",
  OperationToolkitRoot: "external.toolkit",
  OperationToolkit: "external.toolkit",
  OperationToolkitTemu: "external.toolkit",
  OperationToolkitDoudian: "external.toolkit",
  OperationToolkitKuaishouShop: "external.toolkit",
  ExternalToolkitLegacy: "external.toolkit",
  ExternalTemuLegacy: "external.toolkit",
  ExternalBrowserAutomation: "external.browser-automation",
  ExternalBrowserPlugin: "external.browser-plugin",
  ExternalPsAutomation: "external.ps-automation",
  ExternalGoogleArt: "external.google-art",
  AiAssistant: "ai.assistant",
  AiTti: "ai.tti",
  AiTts: "ai.tts",
  AiAgentConsole: "ai.agent",
  Prompt: "ai.prompt",
  ProductCategory: "product.category",
  ProductIndex: "product.index",
  PsdSet: "product.psd-set",
  DesignRequest: "product.design-request",
  PublishConfig: "product.publish-config",
  SystemQueue: "product.queue",
  EcomPlatformCollectRoot: "operation.ecom-platform-collect",
  EcomPlatformCollectTaskPage: "operation.ecom-platform-collect",
  EcomPlatformCollectRunPage: "operation.ecom-platform-collect",
  EcomPlatformCollectRawPage: "operation.ecom-platform-collect",
  EcomSelectionAnalysisTaskPage: "operation.ecom-platform-collect",
  EcomSelectionAnalysisRunPage: "operation.ecom-platform-collect",
  EcomSelectionAnalysisResultPage: "operation.ecom-platform-collect",
  EcomSelectionSupplyMatchTaskPage: "operation.ecom-platform-collect",
  EcomSelectionSupplyMatchRunPage: "operation.ecom-platform-collect",
  EcomSelectionSupplyMatchItemPage: "operation.ecom-platform-collect",
  OperationEcomPlatformCollect: "operation.ecom-platform-collect",
  OperationLinkNavigation: "operation.link-navigation",
  ShopIndex: "operation.shop",
  VendorIndex: "operation.vendor",
  CommonUrlIndex: "operation.common-url",
  SystemAiApiKeyIndex: "system.ai-api-key",
  MessagePushIndex: "system.message-push",
  User: "system.user",
  Company: "system.company",
  PublicUser: "system.public-user",
  SystemWebsocketConnections: "system.websocket",
  SystemOperateLog: "system.operatelog",
  PersonalSettings: "personal.settings",
};
