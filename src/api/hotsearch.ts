import request from '@/config/axios'

export interface HotsearchItem {
  title?: string
  hot?: string | number
  note?: string
  label?: string
  icon?: string
  icon_desc?: string
  rank?: number
  topic_flag?: number
  flag?: string
  word_scheme?: string
  // 其他可能的字段
  word?: string
  name?: string
  songName?: string
  artist?: string
  subtitle?: string
  [key: string]: any
}

export interface HotsearchData {
  key: string
  data: HotsearchItem[]
  timestamp: string
  expireAt: string
  category?: string
  platform: string
  platformIndex: string
}

export interface HotsearchResponse {
  success: boolean
  data: Record<string, HotsearchData> | HotsearchData | string[]
  timestamp?: string
  message?: string
  count?: number
}

/**
 * 获取所有平台的热搜数据
 */
export const getAllHotsearch = () => {
  return request.post<HotsearchResponse>({ url: '/data/category/hotsearch' })
}
