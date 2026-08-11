import { weiboIcon, notificationIcon, feishuIcon, wecomIcon, douyinIcon, bilibiliIcon, zhihuIcon, toutiaoIcon, doubanIcon, kuaishouIcon } from '@/assets/icons/apps'

export type NodeType =
  | 'start'
  | 'end'
  | 'http'
  | 'code'
  | 'condition'
  | 'llm'
  | 'message_push_feishu'
  | 'message_push_wecom'
  | 'hotsearch_weibo'
  | 'custom'

export type NodeRequirementType = 'client' | 'client_browser' | 'internet' | 'config'

export interface NodeRequirement {
  type: NodeRequirementType
  label: string
  description?: string
}

export interface NodeIOSchemaField {
  field: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'code' | 'json' | 'textarea' | 'array'
  required?: boolean
  defaultValue?: any
  placeholder?: string
  description?: string
  options?: { label: string; value: string | number }[]
}

export interface NodeRuntime {
  timeout?: number
  retry?: number
  retryDelay?: number
}

export interface NodeInputMapping {
  [configField: string]: string
}

export interface NodeManifest {
  type: string
  name: string
  category: string
  icon: string
  color: string
  badge?: string
  description: string
  iconImage?: string
  platform?: string
  defaultData?: Record<string, any>
  inputSchema?: NodeIOSchemaField[]
  outputSchema?: NodeIOSchemaField[]
  requirements?: NodeRequirement[]
}

export const NODE_REQUIREMENTS: Record<NodeRequirementType, { label: string; color: string; icon: string }> = {
  client: { label: '需客户端', color: '#8b5cf6', icon: 'ep:monitor' },
  client_browser: { label: '需客户端浏览器', color: '#7c3aed', icon: 'ep:chrome-filled' },
  internet: { label: '需外网', color: '#06b6d4', icon: 'ep:link' },
  config: { label: '需配置', color: '#64748b', icon: 'ep:setting' },
}

export const NODE_CATEGORIES = [
  { key: 'all', label: '全部节点', icon: 'ep:grid' },
  { key: 'base', label: '基础流程', icon: 'ep:location' },
  { key: 'ai', label: 'AI & LLM 智能', icon: 'ep:magic-stick' },
  { key: 'design', label: 'PSD & 设计渲染', icon: 'ep:picture-filled' },
  { key: 'material', label: '素材与文件管理', icon: 'ep:folder-opened' },
  { key: 'product', label: '商品与电商处理', icon: 'ep:goods' },
  { key: 'integration', label: '网络与 API 集成', icon: 'ep:connection' },
  { key: 'notify', label: '消息通知推送', icon: 'ep:bell' },
  { key: 'logic', label: '逻辑与控制流', icon: 'ep:cpu' },
] as const

export function getNodeLabel(node: any): string {
  const capType = node.data?.capabilityType || node.type
  const manifest = NODE_MANIFEST_REGISTRY.find((m) => m.type === capType)
  return node.data?.label || manifest?.name || node.type
}

export function getNodeColor(node: any): string {
  const capType = node.data?.capabilityType || node.type
  const manifest = NODE_MANIFEST_REGISTRY.find((m) => m.type === capType)
  return manifest?.color || '#64748b'
}

export function getNodeOutputSchema(node: any): NodeIOSchemaField[] {
  const capType = node.data?.capabilityType || node.type
  const manifest = NODE_MANIFEST_REGISTRY.find((m) => m.type === capType)
  return manifest?.outputSchema || []
}

export const NODE_MANIFEST_REGISTRY: NodeManifest[] = [
  {
    type: 'hotsearch_weibo',
    name: '微博热搜采集',
    category: 'integration',
    iconImage: weiboIcon,
    color: '#e6162d',
    badge: '热搜',
    description: '通过已登录客户端采集微博热搜数据。自动查找用户在线设备，逐个尝试执行，全部失败则节点失败。',
    defaultData: { name: '微博热搜采集' },
    inputSchema: [],
    outputSchema: [
      { field: 'platform', label: '平台标识', type: 'string' },
      { field: 'name', label: '平台名称', type: 'string' },
      { field: 'itemCount', label: '条目数', type: 'number' },
      { field: 'items', label: '热搜条目', type: 'array' },
      { field: 'fetchedAt', label: '采集时间', type: 'string' },
      { field: 'duration', label: '耗时(ms)', type: 'number' },
    ],
    requirements: [{ type: 'client', label: '需客户端在线' }],
  },
  {
    type: 'hotsearch_douyin',
    name: '抖音热搜采集',
    category: 'integration',
    iconImage: douyinIcon,
    color: '#000000',
    badge: '热搜',
    description: '通过已登录客户端采集抖音热搜数据。自动查找用户在线设备，逐个尝试执行，全部失败则节点失败。',
    defaultData: { name: '抖音热搜采集', platform: 'douyin' },
    inputSchema: [],
    outputSchema: [
      { field: 'platform', label: '平台标识', type: 'string' },
      { field: 'name', label: '平台名称', type: 'string' },
      { field: 'itemCount', label: '条目数', type: 'number' },
      { field: 'items', label: '热搜条目', type: 'array' },
      { field: 'fetchedAt', label: '采集时间', type: 'string' },
      { field: 'duration', label: '耗时(ms)', type: 'number' },
    ],
    requirements: [{ type: 'client', label: '需客户端在线' }],
  },
  {
    type: 'hotsearch_bilibili',
    name: 'B站热搜采集',
    category: 'integration',
    iconImage: bilibiliIcon,
    color: '#00a1d6',
    badge: '热搜',
    description: '通过已登录客户端采集B站热搜数据。',
    defaultData: { name: 'B站热搜采集', platform: 'bilibili' },
    inputSchema: [],
    outputSchema: [
      { field: 'platform', label: '平台标识', type: 'string' },
      { field: 'name', label: '平台名称', type: 'string' },
      { field: 'itemCount', label: '条目数', type: 'number' },
      { field: 'items', label: '热搜条目', type: 'array' },
      { field: 'fetchedAt', label: '采集时间', type: 'string' },
      { field: 'duration', label: '耗时(ms)', type: 'number' },
    ],
    requirements: [{ type: 'client', label: '需客户端在线' }],
  },
  {
    type: 'hotsearch_zhihu',
    name: '知乎热榜采集',
    category: 'integration',
    iconImage: zhihuIcon,
    color: '#0084ff',
    badge: '热搜',
    description: '通过已登录客户端采集知乎热榜数据。',
    defaultData: { name: '知乎热榜采集', platform: 'zhihu' },
    inputSchema: [],
    outputSchema: [
      { field: 'platform', label: '平台标识', type: 'string' },
      { field: 'name', label: '平台名称', type: 'string' },
      { field: 'itemCount', label: '条目数', type: 'number' },
      { field: 'items', label: '热搜条目', type: 'array' },
      { field: 'fetchedAt', label: '采集时间', type: 'string' },
      { field: 'duration', label: '耗时(ms)', type: 'number' },
    ],
    requirements: [{ type: 'client', label: '需客户端在线' }],
  },
  {
    type: 'hotsearch_toutiao',
    name: '今日头条热搜采集',
    category: 'integration',
    iconImage: toutiaoIcon,
    color: '#f5222d',
    badge: '热搜',
    description: '通过已登录客户端采集今日头条热搜数据。',
    defaultData: { name: '今日头条热搜采集', platform: 'toutiao' },
    inputSchema: [],
    outputSchema: [
      { field: 'platform', label: '平台标识', type: 'string' },
      { field: 'name', label: '平台名称', type: 'string' },
      { field: 'itemCount', label: '条目数', type: 'number' },
      { field: 'items', label: '热搜条目', type: 'array' },
      { field: 'fetchedAt', label: '采集时间', type: 'string' },
      { field: 'duration', label: '耗时(ms)', type: 'number' },
    ],
    requirements: [{ type: 'client', label: '需客户端在线' }],
  },
  {
    type: 'hotsearch_douban',
    name: '豆瓣热门采集',
    category: 'integration',
    iconImage: doubanIcon,
    color: '#007722',
    badge: '热搜',
    description: '通过已登录客户端采集豆瓣热门数据。',
    defaultData: { name: '豆瓣热门采集', platform: 'douban' },
    inputSchema: [],
    outputSchema: [
      { field: 'platform', label: '平台标识', type: 'string' },
      { field: 'name', label: '平台名称', type: 'string' },
      { field: 'itemCount', label: '条目数', type: 'number' },
      { field: 'items', label: '热搜条目', type: 'array' },
      { field: 'fetchedAt', label: '采集时间', type: 'string' },
      { field: 'duration', label: '耗时(ms)', type: 'number' },
    ],
    requirements: [{ type: 'client', label: '需客户端在线' }],
  },
  {
    type: 'hotsearch_kuaishou',
    name: '快手热搜采集',
    category: 'integration',
    iconImage: kuaishouIcon,
    color: '#ff6600',
    badge: '热搜',
    description: '通过已登录客户端采集快手热搜数据。',
    defaultData: { name: '快手热搜采集', platform: 'kuaishou' },
    inputSchema: [],
    outputSchema: [
      { field: 'platform', label: '平台标识', type: 'string' },
      { field: 'name', label: '平台名称', type: 'string' },
      { field: 'itemCount', label: '条目数', type: 'number' },
      { field: 'items', label: '热搜条目', type: 'array' },
      { field: 'fetchedAt', label: '采集时间', type: 'string' },
      { field: 'duration', label: '耗时(ms)', type: 'number' },
    ],
    requirements: [{ type: 'client', label: '需客户端在线' }],
  },
  {
    type: 'hotsearch_v2ex',
    name: 'V2EX热门采集',
    category: 'integration',
    icon: "ep:connection",
    color: '#2b2b2b',
    badge: '热搜',
    description: '通过已登录客户端采集V2EX热门数据。',
    defaultData: { name: 'V2EX热门采集', platform: 'v2ex' },
    inputSchema: [],
    outputSchema: [
      { field: 'platform', label: '平台标识', type: 'string' },
      { field: 'name', label: '平台名称', type: 'string' },
      { field: 'itemCount', label: '条目数', type: 'number' },
      { field: 'items', label: '热搜条目', type: 'array' },
      { field: 'fetchedAt', label: '采集时间', type: 'string' },
      { field: 'duration', label: '耗时(ms)', type: 'number' },
    ],
    requirements: [{ type: 'client', label: '需客户端在线' }],
  },
  {
    type: 'hotsearch_36kr',
    name: '36氪热门采集',
    category: 'integration',
    icon: "ep:connection",
    color: '#0052d9',
    badge: '热搜',
    description: '通过已登录客户端采集36氪热门数据。',
    defaultData: { name: '36氪热门采集', platform: '36kr' },
    inputSchema: [],
    outputSchema: [
      { field: 'platform', label: '平台标识', type: 'string' },
      { field: 'name', label: '平台名称', type: 'string' },
      { field: 'itemCount', label: '条目数', type: 'number' },
      { field: 'items', label: '热搜条目', type: 'array' },
      { field: 'fetchedAt', label: '采集时间', type: 'string' },
      { field: 'duration', label: '耗时(ms)', type: 'number' },
    ],
    requirements: [{ type: 'client', label: '需客户端在线' }],
  },
  {
    type: 'hotsearch_ithome',
    name: 'IT之家热门采集',
    category: 'integration',
    icon: "ep:connection",
    color: '#c8102e',
    badge: '热搜',
    description: '通过已登录客户端采集IT之家热门数据。',
    defaultData: { name: 'IT之家热门采集', platform: 'ithome' },
    inputSchema: [],
    outputSchema: [
      { field: 'platform', label: '平台标识', type: 'string' },
      { field: 'name', label: '平台名称', type: 'string' },
      { field: 'itemCount', label: '条目数', type: 'number' },
      { field: 'items', label: '热搜条目', type: 'array' },
      { field: 'fetchedAt', label: '采集时间', type: 'string' },
      { field: 'duration', label: '耗时(ms)', type: 'number' },
    ],
    requirements: [{ type: 'client', label: '需客户端在线' }],
  },
  {
    type: 'message_push_feishu',
    name: '飞书推送',
    category: 'notify',
    icon: 'ep:promotion',
    iconImage: feishuIcon,
    color: '#00d6b9',
    badge: '飞书',
    description: '通过已配置的飞书机器人渠道发送工作流执行结果或自定义消息通知。',
    platform: 'feishu',
    defaultData: { name: '飞书推送', channelId: null, title: '工作流执行完成', content: '工作流已完成执行。' },
    inputSchema: [
      { field: 'channelId', label: '飞书渠道', type: 'select', required: true, placeholder: '选择已配置的飞书渠道', description: '在「消息推送」模块中配置的飞书机器人', options: [] },
      { field: 'title', label: '消息标题', type: 'string', defaultValue: '工作流执行通知', placeholder: '例如：商品渲染任务完成', description: '支持 {{ node_id.variable }} 变量引用' },
      { field: 'content', label: '消息正文', type: 'textarea', defaultValue: '工作流已完成执行。', placeholder: '支持 {{ node_id.variable }} 变量引用', description: '飞书 Markdown 格式' },
    ],
    outputSchema: [
      { field: 'sent', label: '是否发送成功', type: 'boolean' },
      { field: 'channelName', label: '推送渠道名称', type: 'string' },
      { field: 'sentAt', label: '发送时间', type: 'string' },
    ],
  },
  {
    type: 'message_push_wecom',
    name: '企微推送',
    category: 'notify',
    icon: 'ep:chat-dot-round',
    iconImage: wecomIcon,
    color: '#07c160',
    badge: '企微',
    description: '通过已配置的企业微信渠道发送工作流执行结果或自定义消息通知。',
    platform: 'wecom',
    defaultData: { name: '企微推送', channelId: null, title: '工作流执行完成', content: '工作流已完成执行。' },
    inputSchema: [
      { field: 'channelId', label: '企微渠道', type: 'select', required: true, placeholder: '选择已配置的企微渠道', description: '在「消息推送」模块中配置的企业微信', options: [] },
      { field: 'title', label: '消息标题', type: 'string', defaultValue: '工作流执行通知', placeholder: '例如：商品渲染任务完成', description: '支持 {{ node_id.variable }} 变量引用' },
      { field: 'content', label: '消息正文', type: 'textarea', defaultValue: '工作流已完成执行。', placeholder: '支持 {{ node_id.variable }} 变量引用', description: '企微 Markdown 格式' },
    ],
    outputSchema: [
      { field: 'sent', label: '是否发送成功', type: 'boolean' },
      { field: 'channelName', label: '推送渠道名称', type: 'string' },
      { field: 'sentAt', label: '发送时间', type: 'string' },
    ],
  },
]

export function getManifestByType(type: string): NodeManifest | undefined {
  return NODE_MANIFEST_REGISTRY.find((m) => m.type === type)
}

export function getManifestsByCategory(category: string): NodeManifest[] {
  if (category === 'all') return NODE_MANIFEST_REGISTRY
  return NODE_MANIFEST_REGISTRY.filter((m) => m.category === category)
}
