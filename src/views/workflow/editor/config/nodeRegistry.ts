import { weiboIcon } from '@/assets/icons/apps'

export interface NodeInputField {
  field: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'code' | 'json' | 'textarea'
  required?: boolean
  placeholder?: string
  defaultValue?: any
  options?: Array<{ label: string; value: any }>
  description?: string
}

export interface NodeOutputField {
  field: string
  label: string
  type: string
  description?: string
}

export interface SystemNodeCapability {
  type: string
  name: string
  category: 'ai' | 'design' | 'material' | 'product' | 'integration' | 'logic' | 'base' | 'notify'
  icon: string
  /** 自定义图标图片 URL（优先于 icon 字段） */
  iconImage?: string
  color: string
  badge?: string
  description: string
  defaultData: Record<string, any>
  inputSchema?: NodeInputField[]
  outputSchema?: NodeOutputField[]
  /** 节点运行要求 */
  requirements?: NodeRequirement[]
}

/** 节点运行要求类型 */
export type NodeRequirementType = 'client' | 'vpn' | 'internet' | 'auth' | 'config'

export interface NodeRequirement {
  type: NodeRequirementType
  label: string
  description?: string
}

/** 预定义要求常量 */
export const NODE_REQUIREMENTS: Record<NodeRequirementType, { label: string; color: string; icon: string }> = {
  client: { label: '需客户端', color: '#8b5cf6', icon: 'ep:monitor' },
  vpn: { label: '需 VPN', color: '#f59e0b', icon: 'ep:connection' },
  internet: { label: '需外网', color: '#06b6d4', icon: 'ep:link' },
  auth: { label: '需认证', color: '#ef4444', icon: 'ep:lock' },
  config: { label: '需配置', color: '#64748b', icon: 'ep:setting' },
}

export const NODE_CATEGORIES = [
  { key: 'all', label: '全部能力', icon: 'ep:grid' },
  { key: 'base', label: '基础流程', icon: 'ep:location' },
  { key: 'ai', label: 'AI & LLM 智能', icon: 'ep:magic-stick' },
  { key: 'design', label: 'PSD & 设计渲染', icon: 'ep:picture-filled' },
  { key: 'material', label: '素材与文件管理', icon: 'ep:folder-opened' },
  { key: 'product', label: '商品与电商处理', icon: 'ep:goods' },
  { key: 'integration', label: '网络与 API 集成', icon: 'ep:connection' },
  { key: 'notify', label: '消息通知推送', icon: 'ep:bell' },
  { key: 'logic', label: '逻辑与控制流', icon: 'ep:cpu' },
] as const

export const SYSTEM_NODE_REGISTRY: SystemNodeCapability[] = [
  {
    type: 'message_push',
    name: '消息推送通知',
    category: 'notify',
    icon: 'ep:bell',
    color: '#0ea5e9',
    badge: '通知',
    description: '通过已配置的推送渠道（飞书/企业微信）发送工作流执行结果或自定义消息通知。',
    defaultData: {
      name: '消息推送通知',
      channelId: null,
      title: '工作流执行完成',
      content: '工作流已完成执行。',
    },
    inputSchema: [
      {
        field: 'channelId',
        label: '推送渠道',
        type: 'select',
        required: true,
        placeholder: '选择已配置的推送渠道',
        description: '在「消息推送」模块中配置的飞书/企业微信渠道',
        options: [],
      },
      {
        field: 'title',
        label: '消息标题',
        type: 'string',
        defaultValue: '工作流执行通知',
        placeholder: '例如：商品渲染任务完成',
        description: '支持 {{ node_id.variable }} 变量引用',
      },
      {
        field: 'content',
        label: '消息正文',
        type: 'textarea',
        defaultValue: '工作流已完成执行。',
        placeholder: '支持 {{ node_id.variable }} 变量引用',
        description: '飞书/企微 Markdown 格式均可使用',
      },
    ],
    outputSchema: [
      { field: 'sent', label: '是否发送成功', type: 'boolean' },
      { field: 'channelName', label: '推送渠道名称', type: 'string' },
      { field: 'sentAt', label: '发送时间', type: 'string' },
    ],
  },
  {
    type: 'hotsearch_weibo',
    name: '微博热搜采集',
    category: 'integration',
    icon: 'ep:trend-charts',
    iconImage: weiboIcon,
    color: '#e6162d',
    badge: '热搜',
    description: '通过已登录客户端采集微博热搜数据。自动查找用户在线设备，逐个尝试执行，全部失败则节点失败。',
    defaultData: {
      name: '微博热搜采集',
    },
    inputSchema: [],
    outputSchema: [
      { field: 'platform', label: '平台标识', type: 'string' },
      { field: 'name', label: '平台名称', type: 'string' },
      { field: 'itemCount', label: '条目数', type: 'number' },
      { field: 'items', label: '热搜条目', type: 'array' },
      { field: 'fetchedAt', label: '采集时间', type: 'string' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
    ],
  },
]
