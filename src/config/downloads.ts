import request from '@/config/axios'

export interface DownloadAction {
  key: string
  /** 国际化 key，对应 locales 中的 home.tools.* */
  label: string
  /** 下载地址，为空则按钮显示"未配置"并禁用 */
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
 * 获取下载地址配置（从后端动态获取）
 */
export const getDownloadConfig = async (): Promise<{ cards: DownloadCard[] }> => {
  return await request.get({ url: '/system-config/downloads' })
}
