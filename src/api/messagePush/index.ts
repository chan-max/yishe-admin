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
