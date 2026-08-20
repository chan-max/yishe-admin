/**
 * 数据工具采集配置 (20+ 工具)
 * pluginKey 与客户端 dataToolsConfig 保持一致
 */
import { genericSearchAndWait } from '../genericCommand'

export interface DataToolField {
  key: string
  label: string
  placeholder?: string
  type?: 'text' | 'number'
  default?: string | number
}

export interface DataToolSource {
  key: string
  label: string
  desc: string
  category: '天气' | '汇率金融' | '查询工具' | '其他' | '金融行情'
  fields: DataToolField[]
}

const num = (key: string, label: string, defaultValue: number, placeholder?: string): DataToolField => ({
  key,
  label,
  type: 'number',
  default: defaultValue,
  placeholder,
})

export const DATA_TOOLS: DataToolSource[] = [
  {
    key: 'openmeteo',
    label: 'Open-Meteo 天气预报',
    desc: '免费开源天气 API，按经纬度返回天气预报',
    category: '天气',
    fields: [num('latitude', '纬度', 39.9, '如 39.9'), num('longitude', '经度', 116.4, '如 116.4')],
  },
  {
    key: 'wttr',
    label: 'wttr.in 天气',
    desc: '终端天气查询，直接输入城市名',
    category: '天气',
    fields: [{ key: 'city', label: '城市', default: 'Beijing', placeholder: '英文城市名' }],
  },
  {
    key: 'sunrisesunset',
    label: '日出日落时间',
    desc: '查询指定经纬度当日日出/日落/夜幕时间',
    category: '天气',
    fields: [num('lat', '纬度', 39.9), num('lng', '经度', 116.4)],
  },
  {
    key: 'coingecko',
    label: 'CoinGecko 加密货币行情',
    desc: '主流加密货币实时价格与币种信息',
    category: '汇率金融',
    fields: [
      { key: 'ids', label: '币种 ID', default: 'bitcoin,ethereum', placeholder: '多个用逗号分隔' },
      { key: 'vs_currencies', label: '计价货币', default: 'usd,cny', placeholder: '如 usd,cny' },
    ],
  },
  {
    key: 'frankfurter',
    label: '欧洲央行汇率',
    desc: '欧洲央行每日参考汇率',
    category: '汇率金融',
    fields: [
      { key: 'from', label: '基准货币', default: 'USD', placeholder: '如 USD' },
      { key: 'to', label: '目标货币', default: 'CNY,EUR', placeholder: '多个用逗号分隔' },
    ],
  },
  {
    key: 'erapi',
    label: '实时外汇汇率',
    desc: '实时外汇汇率查询（以某货币为基准）',
    category: '汇率金融',
    fields: [{ key: 'base', label: '基准货币', default: 'USD', placeholder: '如 USD / CNY' }],
  },
  {
    key: 'fawazahmed',
    label: '全球币种汇率',
    desc: '全球币种汇率对照，无 API Key 限制',
    category: '汇率金融',
    fields: [{ key: 'base', label: '基准货币', default: 'usd', placeholder: '小写，如 usd' }],
  },
  {
    key: 'dictionary',
    label: '英语词典',
    desc: 'Dictionary API 单词释义查询',
    category: '查询工具',
    fields: [{ key: 'word', label: '单词', default: 'technology', placeholder: '输入英文单词' }],
  },
  {
    key: 'zippopotam',
    label: '邮编地理查询',
    desc: '查询邮编对应的省市与经纬度',
    category: '查询工具',
    fields: [
      { key: 'countryCode', label: '国家代码', default: 'us', placeholder: '如 us / cn' },
      { key: 'zipCode', label: '邮编', default: '90210', placeholder: '如 100000' },
    ],
  },
  {
    key: 'countryis',
    label: 'IP 归属国家',
    desc: '输入 IP 查询归属国家与语言',
    category: '查询工具',
    fields: [{ key: 'ip', label: 'IP 地址', default: '8.8.8.8', placeholder: '如 8.8.8.8' }],
  },
  {
    key: 'ipify',
    label: '公网 IP 查询',
    desc: '一键查询公网出口 IP',
    category: '查询工具',
    fields: [],
  },
  {
    key: 'timeapi',
    label: '全球时区时间',
    desc: '指定时区返回当前时间、日期与星期',
    category: '查询工具',
    fields: [{ key: 'timezone', label: '时区', default: 'Asia/Shanghai', placeholder: '如 Asia/Shanghai' }],
  },
  {
    key: 'colorapi',
    label: '颜色代码解析',
    desc: '解析 HEX/HSL/RGB 颜色信息与颜色名',
    category: '查询工具',
    fields: [{ key: 'hex', label: '色值', default: '24B1E0', placeholder: '不带 #' }],
  },
  {
    key: 'joke',
    label: '趣味笑话',
    desc: '随机返回一条程序猿笑话',
    category: '其他',
    fields: [],
  },
  // ── 天气（扩展）────────────────────────────────────────────
  {
    key: 'weather_cn',
    label: '中国天气网',
    desc: '国内城市天气预报，支持城市代码查询',
    category: '天气',
    fields: [{ key: 'cityCode', label: '城市代码', default: '101010100', placeholder: '北京:101010100, 上海:101020100' }],
  },
  {
    key: 'weather_com',
    label: 'Weather.com',
    desc: '国际天气预报，支持全球城市',
    category: '天气',
    fields: [{ key: 'city', label: '城市', default: 'Beijing', placeholder: '英文城市名' }],
  },
  // ── 金融行情 ──────────────────────────────────────────────
  {
    key: 'yahoo_finance',
    label: 'Yahoo Finance',
    desc: '全球股票、基金、外汇行情与市场概览',
    category: '金融行情',
    fields: [{ key: 'symbol', label: '股票代码', default: 'AAPL', placeholder: '如 AAPL, TSLA' }],
  },
  {
    key: 'sina_finance',
    label: '新浪财经',
    desc: '国内股票、基金、期货行情与快讯',
    category: '金融行情',
    fields: [{ key: 'code', label: '股票代码', default: 'sh600000', placeholder: '如 sh600000' }],
  },
  {
    key: 'eastmoney',
    label: '东方财富',
    desc: '股票、基金、期货行情中心数据',
    category: '金融行情',
    fields: [{ key: 'code', label: '股票代码', default: '000001', placeholder: '如 000001' }],
  },
  {
    key: 'cls_telegraph',
    label: '财联社电报',
    desc: '7x24小时实时财经快讯与公告',
    category: '金融行情',
    fields: [{ key: 'keyword', label: '关键词', default: '', placeholder: '可选，筛选相关快讯' }],
  },
  {
    key: 'coinmarketcap',
    label: 'CoinMarketCap',
    desc: '加密货币市值、价格与交易所数据',
    category: '金融行情',
    fields: [{ key: 'symbol', label: '币种', default: 'bitcoin', placeholder: '如 bitcoin, ethereum' }],
  },
]

export const dataToolMap: Record<string, DataToolSource> = Object.fromEntries(
  DATA_TOOLS.map((s) => [s.key, s]),
)

export async function searchDataTool(
  toolKey: string,
  clientId: string,
  payload: Record<string, any>,
): Promise<any> {
  return genericSearchAndWait(clientId, toolKey, payload)
}