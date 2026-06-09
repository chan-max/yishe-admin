import request from '@/config/axios'

export type MessagePushPlatform = 'feishu' | 'wecom'

export interface MessagePushConfig {
  id?: number
  name: string
  platform: MessagePushPlatform
  webhookUrl: string
  secret?: string
  enabled: boolean
  remark?: string
  userId?: number | null
  uploader?: {
    id?: number
    account?: string
    name?: string
  } | null
  createTime?: string
  updateTime?: string
}

export interface MessagePushTestPayload {
  title?: string
  content: string
}

export const getMessagePushList = () => request.get<MessagePushConfig[]>({ url: '/system/message-push' })

export const getMessagePushDetail = (id: number) =>
  request.get<MessagePushConfig>({ url: `/system/message-push/${id}` })

export const createMessagePush = (data: MessagePushConfig) =>
  request.post({ url: '/system/message-push', data })

export const updateMessagePush = (id: number, data: MessagePushConfig) =>
  request.patch({ url: `/system/message-push/${id}`, data })

export const deleteMessagePush = (id: number) =>
  request.delete({ url: `/system/message-push/${id}` })

export const testMessagePush = (id: number, data: MessagePushTestPayload) =>
  request.post({ url: `/system/message-push/${id}/test`, data })

// 通知场景定义
export interface MessagePushScene {
  code: string
  label: string
  group: string
  scene: string
  description: string
}

// 通知场景设置项
export interface MessagePushSceneSetting {
  code: string
  enabled: boolean
  channelId: number | null
}

// 用户消息推送设置
export interface UserMessagePushSetting {
  scenes: MessagePushSceneSetting[]
  updatedAt?: string
}

// 获取通知场景列表
export const getMessagePushScenes = () =>
  request.get<MessagePushScene[]>({ url: '/system/message-push/scenes' })

// 获取渠道选项（用于下拉选择）
export const getMessagePushChannelOptions = () =>
  request.get<MessagePushConfig[]>({ url: '/system/message-push' })

// 获取用户消息推送设置
export function getUserMessagePushSetting() {
  return request.post<UserMessagePushSetting>({
    url: '/user/getMessagePushSetting',
  })
}

// 更新用户消息推送设置
export function updateUserMessagePushSetting(data: UserMessagePushSetting) {
  return request.post<UserMessagePushSetting>({
    url: '/user/updateMessagePushSetting',
    data,
  })
}
