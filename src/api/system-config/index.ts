import request from '@/config/axios'

export interface DownloadAction {
  key: string
  label: string
  downloadUrl: string
}

export interface DownloadCard {
  key: string
  title: string
  platform: string
  description: string
  icon: string
  actions: DownloadAction[]
}

/**
 * 获取下载地址配置（公共接口）
 */
export const getDownloadConfig = async (): Promise<{ cards: DownloadCard[] }> => {
  return await request.get({ url: '/system-config/downloads' })
}

/**
 * 更新下载地址配置（管理员）
 */
export const updateDownloadConfig = async (cards: DownloadCard[]) => {
  return await request.put({ url: '/system-config/downloads', data: { cards } })
}
