/**
 * 热搜采集平台配置 (25 平台)
 * key 与客户端热搜模块 config.key 保持一致
 */
export interface HotsearchPlatform {
  key: string
  label: string
  group: '国内热搜' | '国际趋势' | '电商'
}

export const HOTSEARCH_PLATFORMS: HotsearchPlatform[] = [
  // 国内热搜 (direct)
  { key: 'weibo', label: '微博', group: '国内热搜' },
  { key: 'douyin', label: '抖音', group: '国内热搜' },
  { key: 'bilibili', label: '哔哩哔哩', group: '国内热搜' },
  { key: 'zhihu', label: '知乎', group: '国内热搜' },
  { key: 'toutiao', label: '今日头条', group: '国内热搜' },
  { key: 'baidu', label: '百度热搜', group: '国内热搜' },
  { key: 'tencent_news', label: '腾讯新闻', group: '国内热搜' },
  { key: 'tencent_tech', label: '腾讯科技', group: '国内热搜' },
  { key: 'douban', label: '豆瓣', group: '国内热搜' },
  { key: 'kuaishou', label: '快手', group: '国内热搜' },
  { key: 'v2ex', label: 'V2EX', group: '国内热搜' },
  { key: '36kr', label: '36氪', group: '国内热搜' },
  { key: 'ithome', label: 'IT之家', group: '国内热搜' },
  // 国际趋势 (proxy)
  { key: 'google_trends', label: 'Google Trends', group: '国际趋势' },
  { key: 'hackernews', label: 'Hacker News', group: '国际趋势' },
  { key: 'github', label: 'GitHub', group: '国际趋势' },
  { key: 'wikipedia', label: '维基百科', group: '国际趋势' },
  { key: 'bbc_news', label: 'BBC News', group: '国际趋势' },
  { key: 'cnn', label: 'CNN', group: '国际趋势' },
  { key: 'nytimes', label: 'New York Times', group: '国际趋势' },
  { key: 'aljazeera', label: 'Al Jazeera', group: '国际趋势' },
  { key: 'devto', label: 'Dev.to', group: '国际趋势' },
  { key: 'lobsters', label: 'Lobsters', group: '国际趋势' },
  // 电商 (proxy)
  { key: 'ebay_trending', label: 'eBay Trending', group: '电商' },
  { key: 'shopify_trending', label: 'Shopify Trending', group: '电商' },
]

export const hotsearchPlatformMap: Record<string, HotsearchPlatform> = Object.fromEntries(
  HOTSEARCH_PLATFORMS.map((p) => [p.key, p]),
)