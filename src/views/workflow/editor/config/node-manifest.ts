import {
  weiboIcon,
  feishuIcon,
  wecomIcon,
  douyinIcon,
  bilibiliIcon,
  zhihuIcon,
  toutiaoIcon,
  doubanIcon,
  kuaishouIcon,
  javaScriptIcon,
  openaiIcon,
  googleArtsCultureIcon,
  pinterestIcon,
  wikimediaIcon,
  pexelsIcon,
  pixabayIcon,
  rawpixelIcon,
  stocksnapIcon,
  openverseIcon,
  openclipartIcon,
  undrawIcon,
  iconifyIcon,
  nounprojectIcon,
  vecteezyIcon,
  openmojiIcon,
  googleIconsIcon,
  emojipediaIcon,
  svgrepoIcon,
  kaboompicsIcon,
  v2exIcon,
  thirtySixKrIcon,
  ithomeIcon,
} from '@/assets/icons/apps'

import {
  hackernewsIcon, arxivIcon, githubIcon, gdeltIcon, googlenewsIcon,
  redditIcon, producthuntIcon, theguardianIcon, bbcnewsIcon, nprIcon,
  techcrunchIcon, thevergeIcon, arstechnicaIcon, mittechreviewIcon,
  reutersIcon, chinadailyIcon, govcnIcon, xinhuanetIcon,
  thepaperIcon, thirtySixKrNewsIcon, huxiuIcon,
} from '@/assets/icons/news'

import {
  openmeteoIcon,
  wttrIcon,
  coingeckoIcon,
  frankfurterIcon,
  dictionaryIcon,
  jokeIcon,
  ipifyIcon,
  sunrisesunsetIcon,
  timeapiIcon,
  zippopotamIcon,
  countryisIcon,
  erapiIcon,
  fawazahmedIcon,
  colorapiIcon,
  shopifyIcon,
} from '@/assets/icons/utility'


export type NodeType =
  | 'start'
  | 'end'
  | 'http'
  | 'code'
  | 'condition'
  | 'switch'
  | 'js_code'
  | 'ai_call'
  | 'loop'
  | 'while_loop'
  | 'llm'
  | 'message_push_feishu'
  | 'message_push_wecom'
  | 'hotsearch_weibo'
  | 'google_arts_culture'
  | 'pinterest_culture'
  | 'wikimedia_culture'
  | 'pexels_search'
  | 'pixabay_search'
  | 'rawpixel_search'
  | 'stocksnap_search'
  | 'openverse_search'
  | 'openclipart_search'
  | 'undraw_search'
  | 'iconify_search'
  | 'nounproject_search'
  | 'vecteezy_search'
  | 'openmoji_search'
  | 'googleicons_search'
  | 'emojipedia_search'
  | 'svgrepo_search'
  | 'kaboompics_search'
  | 'custom'
  | 'openmeteo_search'
  | 'wttr_search'
  | 'coingecko_search'
  | 'frankfurter_search'
  | 'dictionary_search'
  | 'joke_search'
  | 'ipify_search'
  | 'sunrisesunset_search'
  | 'timeapi_search'
  | 'zippopotam_search'
  | 'countryis_search'
  | 'erapi_search'
  | 'fawazahmed_search'
  | 'colorapi_search'
  | 'shopify_search'
  | 'hackernews_search'
  | 'arxiv_search'
  | 'github_search'
  | 'gdelt_search'
  | 'googlenews_search'
  | 'reddit_search'
  | 'producthunt_search'
  | 'theguardian_search'
  | 'bbcnews_search'
  | 'npr_search'
  | 'reuters_search'
  | 'techcrunch_search'
  | 'theverge_search'
  | 'arstechnica_search'
  | 'mittechreview_search'
  | 'chinadaily_search'
  | 'govcn_search'
  | 'xinhuanet_search'
  | 'thepaper_search'
  | '36kr_search'
  | 'huxiu_search'

export type NodeRequirementType = 'client' | 'client_browser' | 'internet' | 'config'

export interface NodeRequirement {
  type: NodeRequirementType
  label: string
  description?: string
}

export interface NodeIOSchemaField {
  field: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'code' | 'json' | 'textarea' | 'array' | 'any'
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
  icon?: string
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
  // ─── Webhook 触发 ────────────────────────────────────────
  {
    type: 'webhook_trigger',
    name: 'Webhook 触发',
    category: 'trigger',
    icon: 'ep:link',
    color: '#8b5cf6',
    badge: '触发',
    description: '通过 HTTP Webhook 请求远程触发工作流。支持开发环境(localhost)和线上环境(api.1s.design)自动切换。',
    defaultData: { name: 'Webhook 触发', config: { method: 'POST', path: '' } },
    inputSchema: [
      { field: 'method', label: '请求方法', type: 'select', defaultValue: 'POST', options: [{ label: 'POST', value: 'POST' }, { label: 'GET', value: 'GET' }, { label: 'PUT', value: 'PUT' }] },
      { field: 'path', label: '路径标识', type: 'string', placeholder: '自动生成或自定义' },
    ],
    outputSchema: [
      { field: 'body', label: '请求体', type: 'json' },
      { field: 'headers', label: '请求头', type: 'json' },
      { field: 'query', label: '查询参数', type: 'json' },
    ],
    requirements: [],
  },

  // ─── 条件分支 ────────────────────────────────────────────
  {
    type: 'condition',
    name: '条件分支',
    category: 'logic',
    icon: 'ep:connection',
    color: '#f59e0b',
    description: '根据条件表达式将工作流导向不同分支。支持多条件判断，每个条件对应一个输出端口。',
    defaultData: { name: '条件分支', config: { conditions: [] } },
    inputSchema: [],
    outputSchema: [
      { field: 'branch', label: '匹配分支', type: 'string' },
      { field: 'matched', label: '是否匹配', type: 'boolean' },
    ],
    requirements: [],
  },
  // ─── 多路切换 ────────────────────────────────────────────
  {
    type: 'switch',
    name: '多路切换',
    category: 'logic',
    icon: 'ep:connection',
    color: '#06b6d4',
    description: '根据字段值匹配多个 case 分支。配置多个值和对应标签，匹配则从对应端口输出。',
    defaultData: { name: '多路切换', config: { cases: [] } },
    inputSchema: [],
    outputSchema: [
      { field: 'branch', label: '匹配分支', type: 'string' },
      { field: 'matched', label: '是否匹配', type: 'boolean' },
    ],
    requirements: [],
  },
  // ─── JS 代码沙箱 ────────────────────────────────────────
  {
    type: 'js_code',
    name: '执行 JS 代码',
    category: 'logic',
    iconImage: javaScriptIcon,
    color: '#10b981',
    description: '在安全沙箱中执行 JavaScript 代码。支持 $params、$tools(HTTP/文件/COS)、$result、$log。预装 axios、dayjs、cheerio、lodash、sharp 等库。',
    defaultData: { name: '执行 JS 代码', config: { code: '', timeoutMs: 30000 } },
    inputSchema: [
      { field: 'code', label: 'JavaScript 代码', type: 'code', required: true, placeholder: '// $params 包含上游节点输出\n// $result = { ok: true }' },
      { field: 'timeoutMs', label: '超时时间(ms)', type: 'number', defaultValue: 30000 },
    ],
    outputSchema: [
      { field: 'result', label: '执行结果', type: 'any' },
      { field: 'logs', label: '执行日志', type: 'array' },
      { field: 'durationMs', label: '耗时(ms)', type: 'number' },
    ],
    requirements: [],
  },
  // ─── AI 大模型调用 ──────────────────────────────────────
  {
    type: 'ai_call',
    name: 'AI 调用',
    category: 'logic',
    iconImage: openaiIcon,
    color: '#6366f1',
    description: '调用 AI 大模型进行文本生成、内容分析、数据处理。支持变量插值引用上游节点输出，输出格式可选文本或 JSON。',
    defaultData: { name: 'AI 调用', config: { userPrompt: '', systemPrompt: '', temperature: 0.7, maxTokens: 2000, outputFormat: 'text' } },
    inputSchema: [
      { field: 'systemPrompt', label: '系统提示词', type: 'textarea', placeholder: '可选，定义 AI 的角色和行为' },
      { field: 'userPrompt', label: '用户提示词', type: 'textarea', required: true, placeholder: '支持 {{nodeId.field}} 变量引用' },
      { field: 'temperature', label: '温度', type: 'number', defaultValue: 0.7, description: '0-2，越高越有创意' },
      { field: 'maxTokens', label: '最大Token', type: 'number', defaultValue: 2000 },
      { field: 'outputFormat', label: '输出格式', type: 'select', defaultValue: 'text', options: [{ label: '文本', value: 'text' }, { label: 'JSON', value: 'json' }] },
    ],
    outputSchema: [
      { field: 'content', label: '生成内容', type: 'string' },
      { field: 'tokens', label: 'Token用量', type: 'number' },
      { field: 'model', label: '使用模型', type: 'string' },
    ],
    requirements: [],
  },
  // ─── For Each 循环 ──────────────────────────────────────
  {
    type: 'loop',
    name: 'For 循环',
    category: 'logic',
    icon: 'ep:refresh',
    color: '#8b5cf6',
    description: '遍历数组中的每个元素，依次执行循环体。有两个输出端口：循环体和完成。',
    defaultData: { name: 'For 循环', config: { items: [] } },
    inputSchema: [],
    outputSchema: [
      { field: 'items', label: '遍历数组', type: 'array' },
      { field: 'results', label: '执行结果', type: 'array' },
      { field: 'count', label: '循环次数', type: 'number' },
    ],
    requirements: [],
  },
  // ─── While 循环 ─────────────────────────────────────────
  {
    type: 'while_loop',
    name: 'While 循环',
    category: 'logic',
    icon: 'ep:refresh',
    color: '#ec4899',
    description: '当条件满足时重复执行循环体。有两个输出端口：循环体和完成。',
    defaultData: { name: 'While 循环', config: { condition: {}, maxIterations: 100 } },
    inputSchema: [],
    outputSchema: [
      { field: 'results', label: '执行结果', type: 'array' },
      { field: 'count', label: '循环次数', type: 'number' },
    ],
    requirements: [],
  },
  // ─── 微博热搜采集 ────────────────────────────────────────
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
    iconImage: v2exIcon,
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
    iconImage: thirtySixKrIcon,
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
    iconImage: ithomeIcon,
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
  },  // ─── Google Art 高清素材采集 ────────────────────────────
  {
    type: 'google_arts_culture',
    name: 'Google Art 素材采集',
    category: 'material',
    iconImage: googleArtsCultureIcon,
    color: '#4285f4',
    badge: '采集',
    description: '从 Google Arts & Culture 搜索艺术作品，批量添加到素材库。需客户端在线且可访问 Google。',
    defaultData: {
      name: 'Google Art 素材采集',
      config: { keyword: '', maxCount: 10 },
    },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: false, placeholder: '例如: van gogh, impressionism (留空默认精选素材)' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'pinterest_culture',
    name: 'Pinterest 素材采集',
    category: 'material',
    iconImage: pinterestIcon,
    color: '#e60023',
    badge: '采集',
    description: '从 Pinterest 搜索图片素材，批量添加到素材库（仅采集图片）。需客户端在线且可访问 Pinterest。',
    defaultData: {
      name: 'Pinterest 素材采集',
      config: { keyword: '', maxCount: 10, scope: 'pins' },
    },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: interior design, landscape photography' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'wikimedia_culture',
    name: 'Wikimedia Commons 素材采集',
    category: 'material',
    iconImage: wikimediaIcon,
    color: '#5f7d8c',
    badge: '采集',
    description: '从 Wikimedia Commons 搜索自由版权图片素材，批量添加到素材库（仅采集图片）。需客户端在线且可访问 Wikimedia。',
    defaultData: {
      name: 'Wikimedia Commons 素材采集',
      config: { keyword: '', maxCount: 10, type: 'image' },
    },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: hitler, landscape, interior design' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'pexels_search',
    name: 'Pexels 高清摄影采集',
    category: 'material',
    iconImage: pexelsIcon,
    color: '#05a081',
    badge: '采集',
    description: '从 Pexels 检索高清摄影大图与素材，批量添加到素材库（仅采集图片）。需客户端在线且可访问 Pexels。',
    defaultData: {
      name: 'Pexels 高清摄影采集',
      config: { keyword: '', maxCount: 10 },
    },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: cat, nature, interior design' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'pixabay_search',
    name: 'Pixabay 采集',
    category: 'material',
    description: '通过客户端从 Pixabay 免费图库按关键词搜索并同步上传至素材库',
    iconImage: pixabayIcon,
    color: '#02be6e',
    defaultData: {
      label: 'Pixabay 采集',
      config: { keyword: '', maxCount: 10 },
    },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: hi, cat, nature, background' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'rawpixel_search',
    name: 'Rawpixel 采集',
    category: 'material',
    description: '通过客户端从 Rawpixel 艺术与免版权图库按关键词搜索并同步上传至素材库',
    iconImage: rawpixelIcon,
    color: '#e65100',
    defaultData: {
      label: 'Rawpixel 采集',
      config: { keyword: '', maxCount: 10, sort: 'curated' },
    },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: cat, pattern, vintage, art' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
      { field: 'sort', label: '排序模式', type: 'select', defaultValue: 'curated', options: [{ label: '精选推荐', value: 'curated' }, { label: '最新上线', value: 'latest' }, { label: '热门高赞', value: 'popular' }] },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'stocksnap_search',
    name: 'StockSnap 采集',
    category: 'material',
    description: '通过客户端从 StockSnap CC0 免版权高清图库按关键词搜索并同步上传至素材库',
    iconImage: stocksnapIcon,
    color: '#E91E63',
    defaultData: {
      label: 'StockSnap 采集',
      config: { keyword: '', maxCount: 10, sort: 'date' },
    },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: cat, vintage, nature' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
      { field: 'sort', label: '排序模式', type: 'select', defaultValue: 'date', options: [{ label: '最新发布', value: 'date' }, { label: '热门浏览', value: 'popular' }] },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'openverse_search',
    name: 'Openverse 采集',
    category: 'material',
    description: '通过客户端从 Openverse 6 亿+ CC/CC0 共享图库按关键词搜索并同步上传至素材库',
    iconImage: openverseIcon,
    color: '#B23A22',
    defaultData: {
      label: 'Openverse 采集',
      config: { keyword: '', maxCount: 10 },
    },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: cat, vintage, nature' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'openclipart_search',
    name: 'Openclipart 矢量采集',
    category: 'material',
    description: '通过客户端从 Openclipart 100% CC0 免费矢量插画图库按关键词搜索并同步上传至素材库',
    iconImage: openclipartIcon,
    color: '#D35400',
    defaultData: {
      label: 'Openclipart 矢量采集',
      config: { keyword: '', maxCount: 10, formatPreference: 'png' },
    },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: cat, robot, flower, banner' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
      { field: 'formatPreference', label: '格式偏好', type: 'select', defaultValue: 'png', options: [{ label: '超清位图 (PNG)', value: 'png' }, { label: '矢量原图 (SVG)', value: 'svg' }] },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'undraw_search',
    name: 'undraw 开源插画采集',
    category: 'material',
    description: '通过客户端从 undraw 开源插画图库按关键词搜索，支持自定义主题色，同步上传至素材库',
    iconImage: undrawIcon,
    color: '#6C63FF',
    defaultData: {
      label: 'undraw 插画采集',
      config: { keyword: '', maxCount: 10, color: '#6C63FF' },
    },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: cat, robot, flower, banner' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
      { field: 'color', label: '主题色', type: 'select', defaultValue: '#6C63FF', options: [{ label: '经典紫 (#6C63FF)', value: '#6C63FF' }, { label: '热情红 (#E74C3C)', value: '#E74C3C' }, { label: '海洋蓝 (#3498DB)', value: '#3498DB' }, { label: '自然绿 (#2ECC71)', value: '#2ECC71' }, { label: '暖橙 (#F39C12)', value: '#F39C12' }, { label: '深色 (#2C3E50)', value: '#2C3E50' }] },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'iconify_search',
    name: 'Iconify 图标采集',
    category: 'material',
    description: '通过客户端从 Iconify 200,000+ 开源图标库按关键词搜索并同步上传至素材库',
    iconImage: iconifyIcon,
    color: '#6C63FF',
    defaultData: { label: 'Iconify 图标采集', config: { keyword: '', maxCount: 10, prefix: '', color: '#000000' } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: cat, heart, home, user' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
      { field: 'prefix', label: '图标集', type: 'select', defaultValue: '', options: [{ label: '全部图标集', value: '' }, { label: 'Material Design (mdi)', value: 'mdi' }, { label: 'Font Awesome (fa)', value: 'fa' }, { label: 'Heroicons', value: 'heroicons' }, { label: 'Feather', value: 'feather' }, { label: 'Lucide', value: 'lucide' }, { label: 'Tabler', value: 'tabler' }] },
      { field: 'color', label: '图标颜色', type: 'select', defaultValue: '#000000', options: [{ label: '黑色 (#000000)', value: '#000000' }, { label: '白色 (#FFFFFF)', value: '#FFFFFF' }, { label: '紫色 (#6C63FF)', value: '#6C63FF' }, { label: '红色 (#E74C3C)', value: '#E74C3C' }, { label: '蓝色 (#3498DB)', value: '#3498DB' }, { label: '绿色 (#2ECC71)', value: '#2ECC71' }] },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'nounproject_search',
    name: 'Noun Project 采集',
    category: 'material',
    description: '通过客户端从 The Noun Project 搜索开源图标或摄影图片并同步上传至素材库',
    iconImage: nounprojectIcon,
    color: '#1A1A1A',
    defaultData: { label: 'Noun Project 采集', config: { keyword: '', maxCount: 10, mediaType: 'icons' } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: cat, nature, business, technology' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
      { field: 'mediaType', label: '素材类型', type: 'select', defaultValue: 'icons', options: [{ label: '矢量图标 (Icons)', value: 'icons' }, { label: '摄影图片 (Photos)', value: 'photos' }] },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'vecteezy_search',
    name: 'Vecteezy 素材采集',
    category: 'material',
    description: '通过客户端从 Vecteezy 检索免版税摄影图片、透明 PNG 或矢量素材并同步上传至素材库',
    iconImage: vecteezyIcon,
    color: '#FF6D00',
    defaultData: { label: 'Vecteezy 采集', config: { keyword: '', maxCount: 10, mediaType: 'photos' } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: cat, nature, business, technology' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
      { field: 'mediaType', label: '素材类型', type: 'select', defaultValue: 'photos', options: [{ label: '摄影图片 (Photos)', value: 'photos' }, { label: '透明 PNG (PNG)', value: 'png' }, { label: '矢量插画 (Vector)', value: 'vector' }] },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'openmoji_search',
    name: 'OpenMoji Emoji 采集',
    category: 'material',
    description: '通过客户端从 OpenMoji 开源项目检索 4500+ 高清 Emoji 矢量/彩色/黑白素材并同步上传至素材库',
    iconImage: openmojiIcon,
    color: '#000000',
    defaultData: { label: 'OpenMoji 采集', config: { keyword: '', maxCount: 10, colorMode: 'color' } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: cat, heart, smile, star' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
      { field: 'colorMode', label: '颜色模式', type: 'select', defaultValue: 'color', options: [{ label: '彩色矢量 (Color SVG)', value: 'color' }, { label: '黑白线条 (Black SVG)', value: 'black' }] },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'googleicons_search',
    name: 'Google Material Icons 采集',
    category: 'material',
    description: '通过客户端从 Google 官方 Material Symbols/Icons 检索 2000+ 矢量图标并同步上传至素材库',
    iconImage: googleIconsIcon,
    color: '#4285F4',
    defaultData: { label: 'Google Icons 采集', config: { keyword: '', maxCount: 10, style: 'outlined' } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: home, search, settings, person' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
      { field: 'style', label: '图标风格', type: 'select', defaultValue: 'outlined', options: [{ label: '线性轮廓 (Outlined)', value: 'outlined' }, { label: '实心填充 (Filled)', value: 'filled' }, { label: '圆角风格 (Rounded)', value: 'rounded' }, { label: '直角尖锐 (Sharp)', value: 'sharp' }] },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'emojipedia_search',
    name: 'Emojipedia 贴纸采集',
    category: 'material',
    description: '通过客户端从 Emojipedia 检索 Apple 3D 原生高清 Emoji 与贴纸素材并同步上传至素材库',
    iconImage: emojipediaIcon,
    color: '#FF8C00',
    defaultData: { label: 'Emojipedia 贴纸采集', config: { keyword: '', maxCount: 10, category: 'stickers' } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: cat, fire, laugh, rocket' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
      { field: 'category', label: '检索分类', type: 'select', defaultValue: 'stickers', options: [{ label: '高清贴纸 (Stickers)', value: 'stickers' }, { label: '标准 Emoji (Emojis)', value: 'emojis' }] },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
  },
  {
    type: 'hackernews_search',
    name: 'Hacker News 热帖',
    category: 'news_data',
    description: '从 Hacker News 获取热门技术文章、讨论和创业动态',
    iconImage: hackernewsIcon,
    color: '#FF6600',
    defaultData: { label: 'Hacker News 热帖', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: AI, startup, programming' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'arxiv_search',
    name: 'arXiv 学术论文',
    category: 'news_data',
    description: '从 arXiv 搜索 AI/ML/CS 等前沿科研论文',
    iconImage: arxivIcon,
    color: '#B31B1B',
    defaultData: { label: 'arXiv 学术论文', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: transformer, LLM, diffusion model' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'github_search',
    name: 'GitHub 趋势仓库',
    category: 'news_data',
    description: '搜索 GitHub 热门开源项目、开发趋势和代码仓库',
    iconImage: githubIcon,
    color: '#333333',
    defaultData: { label: 'GitHub 趋势仓库', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: llm, chatgpt, stable-diffusion' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'gdelt_search',
    name: 'GDELT 全球事件',
    category: 'news_data',
    description: '全球新闻事件监测、舆情分析和地理编码数据',
    iconImage: gdeltIcon,
    color: '#1A73E8',
    defaultData: { label: 'GDELT 全球事件', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: election, protest, climate' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'googlenews_search',
    name: 'Google News',
    category: 'news_data',
    description: '综合新闻聚合搜索，支持多语言和地区',
    iconImage: googlenewsIcon,
    color: '#4285F4',
    defaultData: { label: 'Google News', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: AI, technology, business' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'reddit_search',
    name: 'Reddit 社区热帖',
    category: 'news_data',
    description: '获取 Reddit 社区热门讨论、行业热点和用户观点',
    iconImage: redditIcon,
    color: '#FF4500',
    defaultData: { label: 'Reddit 社区热帖', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: MachineLearning, technology' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'producthunt_search',
    name: 'Product Hunt',
    category: 'news_data',
    description: '发现最新 AI 产品、软件工具和创业项目',
    iconImage: producthuntIcon,
    color: '#DA552F',
    defaultData: { label: 'Product Hunt', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: AI, productivity, developer tools' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'theguardian_search',
    name: 'The Guardian',
    category: 'news_data',
    description: '获取卫报深度报道、国际新闻和科技资讯',
    iconImage: theguardianIcon,
    color: '#052962',
    defaultData: { label: 'The Guardian', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: AI, climate, technology' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'bbcnews_search',
    name: 'BBC News',
    category: 'news_data',
    description: '获取 BBC 国际新闻、科技和健康资讯',
    iconImage: bbcnewsIcon,
    color: '#BB1919',
    defaultData: { label: 'BBC News', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: technology, science, AI' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'npr_search',
    name: 'NPR 新闻',
    category: 'news_data',
    description: '获取美国国家公共广播电台新闻、科技和文化报道',
    iconImage: nprIcon,
    color: '#000000',
    defaultData: { label: 'NPR 新闻', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: technology, science, AI' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'techcrunch_search',
    name: 'TechCrunch',
    category: 'news_data',
    description: '获取 TechCrunch 科技创业、AI 公司和投资新闻',
    iconImage: techcrunchIcon,
    color: '#0A9E01',
    defaultData: { label: 'TechCrunch', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: AI, startup, funding' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'theverge_search',
    name: 'The Verge',
    category: 'news_data',
    description: '获取 The Verge 科技评测、AI 和消费电子资讯',
    iconImage: thevergeIcon,
    color: '#E2127A',
    defaultData: { label: 'The Verge', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: AI, review, tech' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'arstechnica_search',
    name: 'Ars Technica',
    category: 'news_data',
    description: '获取 Ars Technica 深度技术、科学和安全报道',
    iconImage: arstechnicaIcon,
    color: '#FF4500',
    defaultData: { label: 'Ars Technica', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: AI, security, science' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'mittechreview_search',
    name: 'MIT Tech Review',
    category: 'news_data',
    description: '获取 MIT 科技评论前沿科技、AI 和创新深度分析',
    iconImage: mittechreviewIcon,
    color: '#000000',
    defaultData: { label: 'MIT Tech Review', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: AI, innovation, future' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'reuters_search',
    name: 'Reuters 路透社',
    category: 'news_data',
    description: '获取路透社国际新闻、财经和市场资讯',
    iconImage: reutersIcon,
    color: '#FF8000',
    defaultData: { label: 'Reuters 路透社', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: markets, technology, world' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'chinadaily_search',
    name: '中国日报',
    category: 'news_data',
    description: '获取中国日报国内外新闻、商业和科技报道',
    iconImage: chinadailyIcon,
    color: '#CE1126',
    defaultData: { label: '中国日报', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: China, technology, business' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'govcn_search',
    name: '中国政府网',
    category: 'news_data',
    description: '获取政府最新政策、法规和公告信息',
    iconImage: govcnIcon,
    color: '#DE2910',
    defaultData: { label: '中国政府网', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: 政策, 法规, 公告' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'xinhuanet_search',
    name: '新华网',
    category: 'news_data',
    description: '获取新华网国内国际新闻、财经和科技资讯',
    iconImage: xinhuanetIcon,
    color: '#003DA5',
    defaultData: { label: '新华网', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: 科技, 财经, 国际' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'thepaper_search',
    name: '澎湃新闻',
    category: 'news_data',
    description: '获取澎湃新闻社会、财经、科技深度报道与时事评论',
    iconImage: thepaperIcon,
    color: '#000000',
    defaultData: { label: '澎湃新闻', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: 财经, 科技, 评论' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: '36kr_search',
    name: '36氪',
    category: 'news_data',
    description: '获取 36氪 前沿科技、创投、商业热点与快讯',
    iconImage: thirtySixKrNewsIcon,
    color: '#0052D9',
    defaultData: { label: '36氪', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: AI, 创业, 商业' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'huxiu_search',
    name: '虎嗅',
    category: 'news_data',
    description: '获取虎嗅科技、商业、创投深度分析与精选文章',
    iconImage: huxiuIcon,
    color: '#F44336',
    defaultData: { label: '虎嗅', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: 商业, 科技, 创投' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-100)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'items', label: '数据列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },

  {
    type: 'svgrepo_search',
    name: 'SVGRepo 矢量图库采集',
    category: 'material',
    description: '通过客户端从 SVGRepo 检索 50万+ 高清矢量图标与插画素材并同步上传至素材库',
    iconImage: svgrepoIcon,
    color: '#6b9bd2',
    defaultData: { label: 'SVGRepo 矢量采集', config: { keyword: '', maxCount: 12, style: 'all' } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: cat, animal, tech, arrow, shopping' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 12, description: '每次最多采集数量 (1-50)' },
      { field: 'style', label: '矢量风格', type: 'select', defaultValue: 'all', options: [{ label: '全部风格 (All)', value: 'all' }, { label: '单色图标 (Monotone)', value: 'monotone' }, { label: '多色插画 (Multicolor)', value: 'multicolor' }, { label: '双色渐变 (Duotone)', value: 'duotone' }, { label: '线性轮廓 (Outlined)', value: 'outlined' }, { label: '实心填充 (Filled)', value: 'filled' }] },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  {
    type: 'kaboompics_search',
    name: 'Kaboompics 高清摄影采集',
    category: 'material',
    description: '通过客户端从 Kaboompics 检索精品生活美学与商业高清摄影大图并同步上传至素材库',
    iconImage: kaboompicsIcon,
    color: '#C4704B',
    defaultData: { label: 'Kaboompics 摄影采集', config: { keyword: '', maxCount: 10 } },
    inputSchema: [
      { field: 'keyword', label: '搜索关键词', type: 'string', required: true, placeholder: '例如: coffee, interior, nature, lifestyle' },
      { field: 'maxCount', label: '采集数量', type: 'number', defaultValue: 10, description: '每次最多采集数量 (1-50)' },
    ],
    outputSchema: [
      { field: 'successCount', label: '成功数量', type: 'number' },
      { field: 'failCount', label: '失败数量', type: 'number' },
      { field: 'images', label: '图片列表', type: 'array' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
      { type: 'internet', label: '需外网' },
    ],
  },
  // ══════════════════════════════════════════════════════
  // 工具类节点 (15 utilities)
  // ══════════════════════════════════════════════════════
  {
    type: 'openmeteo_search',
    name: 'Open-Meteo 天气',
    category: 'utility',
    description: '全球实时天气预报',
    iconImage: openmeteoIcon,
    color: '#0066CC',
    defaultData: { label: 'Open-Meteo 天气', config: { latitude: 39.9, longitude: 116.4 } },
    inputSchema: [
      { field: 'latitude', label: '纬度', type: 'number', required: true },
      { field: 'longitude', label: '经度', type: 'number', required: true },
    ],
    outputSchema: [ { field: 'temperature', label: '温度', type: 'number' } ],
    requirements: [ { type: 'client', label: '需客户端在线' }, { type: 'internet', label: '需外网' } ],
  },
  {
    type: 'coingecko_search',
    name: 'CoinGecko 币价',
    category: 'utility',
    description: '加密货币实时价格',
    iconImage: coingeckoIcon,
    color: '#8DC647',
    defaultData: { label: 'CoinGecko 币价', config: { ids: 'bitcoin,ethereum' } },
    inputSchema: [ { field: 'ids', label: '币种ID', type: 'string', defaultValue: 'bitcoin,ethereum' } ],
    outputSchema: [ { field: 'prices', label: '价格', type: 'json' } ],
    requirements: [ { type: 'client', label: '需客户端在线' }, { type: 'internet', label: '需外网' } ],
  },
  {
    type: 'frankfurter_search',
    name: 'Frankfurter 汇率',
    category: 'utility',
    description: '实时/历史汇率',
    iconImage: frankfurterIcon,
    color: '#003399',
    defaultData: { label: 'Frankfurter 汇率', config: { from: 'USD', to: 'CNY,EUR' } },
    inputSchema: [ { field: 'from', label: '基准货币', type: 'string', defaultValue: 'USD' }, { field: 'to', label: '目标货币', type: 'string', defaultValue: 'CNY,EUR' } ],
    outputSchema: [ { field: 'rates', label: '汇率', type: 'json' } ],
    requirements: [ { type: 'client', label: '需客户端在线' }, { type: 'internet', label: '需外网' } ],
  },
  {
    type: 'dictionary_search',
    name: 'Free Dictionary',
    category: 'utility',
    description: '英语词典查询',
    iconImage: dictionaryIcon,
    color: '#6B46C1',
    defaultData: { label: 'Free Dictionary', config: { word: 'hello' } },
    inputSchema: [ { field: 'word', label: '查询单词', type: 'string', required: true } ],
    outputSchema: [ { field: 'definition', label: '释义', type: 'string' } ],
    requirements: [ { type: 'client', label: '需客户端在线' }, { type: 'internet', label: '需外网' } ],
  },
  {
    type: 'sunrisesunset_search',
    name: 'Sunrise-Sunset 日出日落',
    category: 'utility',
    description: '日出日落、日照时长',
    iconImage: sunrisesunsetIcon,
    color: '#FF8C00',
    defaultData: { label: '日出日落', config: { lat: 39.9, lng: 116.4 } },
    inputSchema: [ { field: 'lat', label: '纬度', type: 'number', required: true }, { field: 'lng', label: '经度', type: 'number', required: true } ],
    outputSchema: [ { field: 'sunrise', label: '日出', type: 'string' }, { field: 'sunset', label: '日落', type: 'string' } ],
    requirements: [ { type: 'client', label: '需客户端在线' }, { type: 'internet', label: '需外网' } ],
  },
  {
    type: 'timeapi_search',
    name: 'timeapi.io 时区时间',
    category: 'utility',
    description: '指定时区当前时间',
    iconImage: timeapiIcon,
    color: '#4A90D9',
    defaultData: { label: '时区时间', config: { timezone: 'Asia/Shanghai' } },
    inputSchema: [ { field: 'timezone', label: '时区', type: 'string', required: true } ],
    outputSchema: [ { field: 'dateTime', label: '时间', type: 'string' } ],
    requirements: [ { type: 'client', label: '需客户端在线' }, { type: 'internet', label: '需外网' } ],
  },
  {
    type: 'zippopotam_search',
    name: 'Zippopotam 邮编查询',
    category: 'utility',
    description: '邮编查询城市/经纬度',
    iconImage: zippopotamIcon,
    color: '#2E8B57',
    defaultData: { label: '邮编查询', config: { countryCode: 'us', zipCode: '90210' } },
    inputSchema: [ { field: 'countryCode', label: '国家代码', type: 'string', defaultValue: 'us' }, { field: 'zipCode', label: '邮编', type: 'string', required: true } ],
    outputSchema: [ { field: 'city', label: '城市', type: 'string' } ],
    requirements: [ { type: 'client', label: '需客户端在线' }, { type: 'internet', label: '需外网' } ],
  },
  {
    type: 'countryis_search',
    name: 'country.is IP归属',
    category: 'utility',
    description: 'IP地址归属国家',
    iconImage: countryisIcon,
    color: '#8B4513',
    defaultData: { label: 'IP归属', config: { ip: '8.8.8.8' } },
    inputSchema: [ { field: 'ip', label: 'IP地址', type: 'string', required: true } ],
    outputSchema: [ { field: 'country', label: '国家', type: 'string' } ],
    requirements: [ { type: 'client', label: '需客户端在线' }, { type: 'internet', label: '需外网' } ],
  },
  {
    type: 'erapi_search',
    name: 'open.er-api 汇率',
    category: 'utility',
    description: '多币种实时汇率',
    iconImage: erapiIcon,
    color: '#228B22',
    defaultData: { label: '汇率查询', config: { base: 'USD' } },
    inputSchema: [ { field: 'base', label: '基准货币', type: 'string', defaultValue: 'USD' } ],
    outputSchema: [ { field: 'rates', label: '汇率', type: 'json' } ],
    requirements: [ { type: 'client', label: '需客户端在线' }, { type: 'internet', label: '需外网' } ],
  },
  {
    type: 'fawazahmed_search',
    name: 'fawazahmed 汇率',
    category: 'utility',
    description: 'CDN 全币种汇率',
    iconImage: fawazahmedIcon,
    color: '#FF6347',
    defaultData: { label: '汇率数据', config: { base: 'usd' } },
    inputSchema: [ { field: 'base', label: '基准货币', type: 'string', defaultValue: 'usd' } ],
    outputSchema: [ { field: 'currencies', label: '汇率数据', type: 'json' } ],
    requirements: [ { type: 'client', label: '需客户端在线' }, { type: 'internet', label: '需外网' } ],
  },
  {
    type: 'colorapi_search',
    name: 'The Color API',
    category: 'utility',
    description: 'HEX颜色查询（RGB/HSL/名称）',
    iconImage: colorapiIcon,
    color: '#24B1E0',
    defaultData: { label: '颜色查询', config: { hex: '24B1E0' } },
    inputSchema: [ { field: 'hex', label: 'HEX颜色', type: 'string', required: true } ],
    outputSchema: [ { field: 'name', label: '颜色名称', type: 'string' } ],
    requirements: [ { type: 'client', label: '需客户端在线' }, { type: 'internet', label: '需外网' } ],
  },
  {
    type: 'wttr_search',
    name: 'wttr.in 终端天气',
    category: 'utility',
    description: '全球城市天气与预报',
    iconImage: wttrIcon,
    color: '#2563EB',
    defaultData: { label: 'wttr 天气', config: { city: 'Beijing' } },
    inputSchema: [ { field: 'city', label: '城市名称', type: 'string', defaultValue: 'Beijing' } ],
    outputSchema: [ { field: 'data', label: '天气详情', type: 'json' } ],
    requirements: [ { type: 'client', label: '需客户端在线' }, { type: 'internet', label: '需外网' } ],
  },

  {
    type: 'joke_search',
    name: 'JokeAPI 编程/趣味笑话',
    category: 'utility',
    description: '趣味笑话与搞笑段子',
    iconImage: jokeIcon,
    color: '#F59E0B',
    defaultData: { label: 'Joke 笑话', config: { category: 'Programming' } },
    inputSchema: [ { field: 'category', label: '笑话类型', type: 'string', defaultValue: 'Programming' } ],
    outputSchema: [ { field: 'joke', label: '笑话内容', type: 'string' } ],
    requirements: [ { type: 'client', label: '需客户端在线' }, { type: 'internet', label: '需外网' } ],
  },
  {
    type: 'ipify_search',
    name: 'ipify 公网IP查询',
    category: 'utility',
    description: '获取客户端当前公网IP',
    iconImage: ipifyIcon,
    color: '#10B981',
    defaultData: { label: '公网IP', config: {} },
    inputSchema: [],
    outputSchema: [ { field: 'ip', label: 'IP地址', type: 'string' } ],
    requirements: [ { type: 'client', label: '需客户端在线' }, { type: 'internet', label: '需外网' } ],
  },
  {
    type: 'shopify_search',
    name: 'Shopify 独立站商品',
    category: 'ecommerce',
    description: '检索 Shopify 店铺公开商品清单',
    iconImage: shopifyIcon,
    color: '#96BF48',
    defaultData: { label: 'Shopify 商品', config: { storeUrl: '', limit: 20 } },
    inputSchema: [
      { field: 'storeUrl', label: '店铺域名/URL', type: 'string', required: true, placeholder: 'example.myshopify.com' },
      { field: 'keyword', label: '筛选关键词', type: 'string' },
      { field: 'limit', label: '最多获取数', type: 'number', defaultValue: 20 },
    ],
    outputSchema: [
      { field: 'count', label: '商品数量', type: 'number' },
      { field: 'items', label: '商品列表', type: 'array' },
    ],
    requirements: [ { type: 'client', label: '需客户端在线' }, { type: 'internet', label: '需外网' } ],
  },
]


export function getManifestByType(type: string): NodeManifest | undefined {
  return NODE_MANIFEST_REGISTRY.find((m) => m.type === type)
}

export function getManifestsByCategory(category: string): NodeManifest[] {
  if (category === 'all') return NODE_MANIFEST_REGISTRY
  return NODE_MANIFEST_REGISTRY.filter((m) => m.category === category)
}
