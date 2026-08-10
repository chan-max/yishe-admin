import request from '@/config/axios'
import qs from 'qs'

export interface NotifyMessageVO {
  id: number
  userId: number
  userType: number
  templateId: number
  templateCode: string
  templateNickname: string
  templateContent: string
  templateType: number
  templateParams: string
  readStatus: boolean
  readTime: Date
  createTime: Date
  // 通用消息新增字段
  senderId?: number
  senderType?: number // 0=系统 1=用户/管理员
  messageType?: number // 0=模板消息 1=直接消息
}

/** 直接发送消息请求 */
export interface NotifySendDirectReqVO {
  receiverIds: number[]
  title: string
  content: string
}

// 查询站内信消息列表
export const getNotifyMessagePage = async (params: PageParam) => {
  return await request.get({ url: '/system/notify-message/page', params })
}

// 获得我的站内信分页
export const getMyNotifyMessagePage = async (params: PageParam) => {
  return await request.post({ url: '/system/notify-message/my-page', data: params })
}

// 批量标记已读
export const updateNotifyMessageRead = async (ids) => {
  return await request.put({
    url: '/system/notify-message/update-read?ids=' + (Array.isArray(ids) ? ids.join(',') : ids)
  })
}

// 标记所有站内信为已读
export const updateAllNotifyMessageRead = async () => {
  return await request.put({ url: '/system/notify-message/update-all-read' })
}

// 获取当前用户的最新站内信列表
export const getUnreadNotifyMessageList = async () => {
  return await request.get({ url: '/system/notify-message/get-unread-list' })
}

// 获得当前用户的未读站内信数量
export const getUnreadNotifyMessageCount = async () => {
  return await request.get({ url: '/system/notify-message/get-unread-count' })
}

// 直接发送消息（通用，不依赖模板）
export const sendDirectNotifyMessage = async (data: NotifySendDirectReqVO) => {
  return await request.post({ url: '/system/notify-message/send-direct', data })
}

// 获取我发出的消息
export const getSentNotifyMessagePage = async (params: PageParam) => {
  return await request.post({ url: '/system/notify-message/sent-page', data: params })
}

// 删除消息
export const deleteNotifyMessage = async (ids) => {
  return await request.delete({
    url: '/system/notify-message/delete?ids=' + (Array.isArray(ids) ? ids.join(',') : ids)
  })
}

// 清空所有消息
export const clearAllNotifyMessage = async () => {
  return await request.delete({ url: '/system/notify-message/clear-all' })
}
