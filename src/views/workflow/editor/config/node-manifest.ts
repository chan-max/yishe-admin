import type { Node } from '@vue-flow/core'

/**
 * 节点运行要求类型
 */
export type NodeRequirementType = 'client' | 'client_browser' | 'internet' | 'config'

export interface NodeRequirement {
  type: NodeRequirementType
  label: string
  description?: string
}

/**
 * 节点 IO 字段 Schema
 */
export interface NodeIOSchemaField {
  field: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'code' | 'json' | 'textarea' | 'array'
  required?: boolean
  defaultValue?: any
  placeholder?: string
  description?: string
  options?: Array<{ label: string; value: string | number }>
}

/**
 * 节点运行策略
 */
export interface NodeRuntime {
  timeout?: number       // 超时时间(ms)，默认 60000
  retry?: number         // 重试次数，默认 0
  retryDelay?: number    // 重试间隔(ms)，默认 1000
}

/**
 * 变量映射（未来 V2 格式）
 */
export interface NodeInputMapping {
  [configField: string]  // config 中的字段名
    : string             // 模板表达式，如 "{{ nodeId.field }}"
}

/**
 * 节点清单 — 统一注册格式
 * 
 * 前端根据 Manifest 自动生成：
 * - 节点卡片（名称、图标、颜色）
 * - 配置 UI（inputSchema → 表单）
 * - 输出变量面板（outputSchema → 变量列表）
 * 
 * 后端根据 Manifest 自动：
 * - 注册 executor
 * - 校验节点配置
 */
export interface NodeManifest {
  /** 节点类型标识（唯一） */
  type: string
  /** 显示名称 */
  name: string
  /** 分类 */
  category: string
  /** Element Plus 图标名 */
  icon: string
  /** 自定义 SVG 图标 URL（优先于 icon） */
  iconImage?: string
  /** 主题色 */
  color: string
  /** 角标文字 */
  badge?: string
  /** 节点描述 */
  description: string
  /** 默认节点数据 */
  defaultData: Record<string, any>
  /** 输入配置 Schema — 自动生成配置 UI */
  inputSchema?: NodeIOSchemaField[]
  /** 输出变量 Schema — 供下游引用 */
  outputSchema?: NodeIOSchemaField[]
  /** 运行要求 */
  requirements?: NodeRequirement[]
}

/**
 * 节点运行要求常量
 */
export const NODE_REQUIREMENTS: Record<NodeRequirementType, { label: string; color: string; icon: string }> = {
  client: { label: '需客户端', color: '#8b5cf6', icon: 'ep:monitor' },
  client_browser: { label: '需客户端浏览器', color: '#7c3aed', icon: 'ep:chrome-filled' },
  internet: { label: '需外网', color: '#06b6d4', icon: 'ep:link' },
  config: { label: '需配置', color: '#64748b', icon: 'ep:setting' },
}

/**
 * 节点分类
 */
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

/**
 * 获取节点的显示名称
 */
export function getNodeLabel(node: Node): string {
  const capType = node.data?.capabilityType || node.type
  const manifest = NODE_MANIFEST_REGISTRY.find((m) => m.type === capType)
  return node.data?.label || manifest?.name || node.type
}

/**
 * 获取节点的图标颜色
 */
export function getNodeColor(node: Node): string {
  const capType = node.data?.capabilityType || node.type
  const manifest = NODE_MANIFEST_REGISTRY.find((m) => m.type === capType)
  return manifest?.color || '#64748b'
}

/**
 * 获取节点的输出 Schema
 */
export function getNodeOutputSchema(node: Node): NodeIOSchemaField[] {
  const capType = node.data?.capabilityType || node.type
  const manifest = NODE_MANIFEST_REGISTRY.find((m) => m.type === capType)
  return manifest?.outputSchema || []
}

// ─────────────────────────────────────────────────────────────────────────────
// 节点注册表（各节点在此注册自己的 Manifest）
// ─────────────────────────────────────────────────────────────────────────────

import { weiboIcon, notificationIcon } from '@/assets/icons/apps'

/**
 * 节点注册表 — 所有节点在此注册
 */
export const NODE_MANIFEST_REGISTRY: NodeManifest[] = [
  // ─── 微博热搜采集 ───────────────────────────────────────
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
      { field: 'duration', label: '耗时(ms)', type: 'number' },
    ],
    requirements: [
      { type: 'client', label: '需客户端在线' },
    ],
  },

  // ─── 消息推送通知 ───────────────────────────────────────
  {
    type: 'message_push',
    name: '消息推送通知',
    category: 'notify',
    icon: 'ion:notifications-outline',
    iconImage: notificationIcon,
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
        description: '在「消息推送」模块中配置的飞书/企微渠道',
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
]

/**
 * 根据类型获取 Manifest
 */
export function getManifestByType(type: string): NodeManifest | undefined {
  return NODE_MANIFEST_REGISTRY.find((m) => m.type === type)
}

/**
 * 根据分类获取 Manifest 列表
 */
export function getManifestsByCategory(category: string): NodeManifest[] {
  if (category === 'all') return NODE_MANIFEST_REGISTRY
  return NODE_MANIFEST_REGISTRY.filter((m) => m.category === category)
}

/**
 * 别名导出（向后兼容）
 */
export { NODE_MANIFEST_REGISTRY as SYSTEM_NODE_REGISTRY }
