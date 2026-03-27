import request from '@/config/axios'

export type MessagePushPlatform = 'feishu' | 'wecom'

export interface MessagePushConfig {
  id?: number
  code: string
  name: string
  platform: MessagePushPlatform
  webhookUrl: string
  secret?: string
  enabled: boolean
  remark?: string
  createTime?: string
  updateTime?: string
}

export interface MessagePushTestPayload {
  title?: string
  content: string
}

export const getMessagePushList = () => request.get<MessagePushConfig[]>({ url: '/operations/message-push' })

export const getMessagePushDetail = (id: number) =>
  request.get<MessagePushConfig>({ url: `/operations/message-push/${id}` })

export const createMessagePush = (data: MessagePushConfig) =>
  request.post({ url: '/operations/message-push', data })

export const updateMessagePush = (id: number, data: MessagePushConfig) =>
  request.patch({ url: `/operations/message-push/${id}`, data })

export const deleteMessagePush = (id: number) =>
  request.delete({ url: `/operations/message-push/${id}` })

export const testMessagePush = (id: number, data: MessagePushTestPayload) =>
  request.post({ url: `/operations/message-push/${id}/test`, data })
