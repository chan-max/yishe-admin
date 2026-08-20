/**
 * 新闻资讯采集数据源配置 (60+ 源)
 * pluginKey 与客户端 newsServicesConfig 保持一致
 */
import { genericSearchAndWait } from '../genericCommand'

export interface NewsField {
  key: string
  label: string
  placeholder?: string
  type?: 'text' | 'number' | 'password'
  default?: string | number
}

export interface NewsSource {
  key: string
  label: string
  desc: string
  category: '国外新闻' | '国内新闻' | '娱乐影视' | '体育' | '招聘' | '政府数据'
  fields: NewsField[]
}

const kw = (placeholder = '输入关键词，默认 ai'): NewsField => ({
  key: 'keyword',
  label: '关键词',
  placeholder,
})
const cat = (placeholder = '如 technology / science / policy'): NewsField => ({
  key: 'category',
  label: '分类',
  placeholder,
})
const maxCount: NewsField = {
  key: 'maxCount',
  label: '数量',
  type: 'number',
  default: 10,
  placeholder: '返回条数',
}
const apiKey: NewsField = {
  key: 'apiKey',
  label: 'API Key（选填）',
  type: 'password',
  placeholder: '需要时填写，否则使用匿名访问',
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    key: 'hackernews',
    label: 'Hacker News 热帖',
    desc: '技术社区热帖，支持按分类拉取',
    category: '国外新闻',
    fields: [
      { key: 'type', label: '类别', default: 'ai', placeholder: '如 ai / show / ask / jobs' },
      { key: 'minScore', label: '最低分', type: 'number', placeholder: '按得分过滤' },
      maxCount,
    ],
  },
  {
    key: 'arxiv',
    label: 'arXiv 学术论文',
    desc: '学术论文预印本，可按分类检索',
    category: '国外新闻',
    fields: [kw('搜索论文关键词'), { key: 'category', label: '分类', placeholder: '如 cs.AI / cs.CV' }, maxCount],
  },
  {
    key: 'github',
    label: 'GitHub 趋势仓库',
    desc: '近期有热度的开源仓库趋势',
    category: '国外新闻',
    fields: [kw('趋势关键词'), { key: 'language', label: '语言', placeholder: '如 TypeScript / Python' }, maxCount],
  },
  {
    key: 'producthunt',
    label: 'Product Hunt 产品',
    desc: '最新上线的产品与上新榜单',
    category: '国外新闻',
    fields: [apiKey, kw('产品关键词'), maxCount],
  },
  {
    key: 'gdelt',
    label: 'GDELT 全球事件',
    desc: '全球新闻事件数据库',
    category: '国外新闻',
    fields: [kw('事件关键词'), { key: 'timespan', label: '时间跨度', default: '24h', placeholder: '如 24h / 7d' }, { key: 'maxrecords', label: '条数', type: 'number', default: 10 }],
  },
  {
    key: 'googlenews',
    label: 'Google News',
    desc: 'Google 聚合新闻检索',
    category: '国外新闻',
    fields: [kw('新闻关键词'), { key: 'hl', label: '语言', default: 'zh-CN', placeholder: '如 en-US' }, { key: 'gl', label: '地区', default: 'CN', placeholder: '如 US' }],
  },
  {
    key: 'reddit',
    label: 'Reddit 社区热帖',
    desc: 'Reddit 板块热帖检索',
    category: '国外新闻',
    fields: [kw('搜索关键词'), { key: 'subreddit', label: '版块', placeholder: '如 technology' }, { key: 'sort', label: '排序', default: 'hot', placeholder: 'hot / new / top' }, maxCount],
  },
  {
    key: 'theguardian',
    label: 'The Guardian',
    desc: '卫报新闻检索',
    category: '国外新闻',
    fields: [apiKey, kw('新闻关键词'), { key: 'section', label: '栏目', placeholder: '如 technology' }],
  },
  { key: 'bbcnews', label: 'BBC News', desc: 'BBC 新闻栏目抓取', category: '国外新闻', fields: [cat('如 technology / business'), maxCount] },
  { key: 'npr', label: 'NPR 新闻', desc: 'NPR 公共电台新闻', category: '国外新闻', fields: [cat(), maxCount] },
  { key: 'reuters', label: 'Reuters 路透社', desc: '路透社财经与全球新闻', category: '国外新闻', fields: [cat(), maxCount] },
  { key: 'techcrunch', label: 'TechCrunch', desc: '科技创投资讯', category: '国外新闻', fields: [cat(), maxCount] },
  { key: 'theverge', label: 'The Verge', desc: '科技与数码媒体', category: '国外新闻', fields: [cat(), maxCount] },
  { key: 'arstechnica', label: 'Ars Technica', desc: '深度科技报道', category: '国外新闻', fields: [cat(), maxCount] },
  { key: 'mittechreview', label: 'MIT Technology Review', desc: 'MIT 科技评论', category: '国外新闻', fields: [cat(), maxCount] },
  { key: 'chinadaily', label: '中国日报', desc: '中国日报英文资讯', category: '国内新闻', fields: [cat('如 china / business'), maxCount] },
  { key: 'govcn', label: '中国政府网', desc: '最新政策与政务资讯', category: '国内新闻', fields: [cat('如 policy / economy'), maxCount] },
  { key: 'xinhuanet', label: '新华网', desc: '新华社权威资讯', category: '国内新闻', fields: [cat('如 tech / china'), maxCount] },
  { key: 'thepaper', label: '澎湃新闻', desc: '澎湃新闻资讯检索', category: '国内新闻', fields: [kw('输入关键词')] },
  {
    key: '36kr',
    label: '36氪',
    desc: '科技创业财经资讯',
    category: '国内新闻',
    fields: [kw('输入关键词'), maxCount],
  },
  {
    key: 'huxiu',
    label: '虎嗅',
    desc: '深度商业与科技内容',
    category: '国内新闻',
    fields: [kw('输入关键词'), maxCount],
  },
  {
    key: 'techcrunchrss',
    label: 'TechCrunch RSS',
    desc: '科技创投资讯 RSS 订阅',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'arstechnicarss',
    label: 'Ars Technica RSS',
    desc: '深度科技报道 RSS 订阅',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'thevergerss',
    label: 'The Verge RSS',
    desc: '科技与数码媒体 RSS 订阅',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'wired',
    label: 'Wired',
    desc: '科技与文化深度报道 RSS 订阅',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'mittechreviewrss',
    label: 'MIT Technology Review RSS',
    desc: 'MIT 科技评论 RSS 订阅',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'engadget',
    label: 'Engadget',
    desc: '消费电子与科技新品 RSS 订阅',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'bbctechnology',
    label: 'BBC Technology',
    desc: 'BBC 科技频道 RSS 订阅',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'guardiantechnology',
    label: 'The Guardian Technology',
    desc: '卫报科技频道 RSS 订阅',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'time',
    label: 'TIME',
    desc: '时代周刊资讯 RSS 订阅',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'apnews',
    label: 'AP News Technology',
    desc: '美联社科技新闻抓取',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'nprtechnology',
    label: 'NPR Technology',
    desc: 'NPR 科技频道抓取',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'sciencedaily',
    label: 'ScienceDaily',
    desc: '每日科学资讯 RSS 订阅',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'physorg',
    label: 'Phys.org',
    desc: '物理科学资讯 RSS 订阅',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'quantamagazine',
    label: 'Quanta Magazine',
    desc: '量子科学深度报道 RSS 订阅',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'spacecom',
    label: 'Space.com',
    desc: '太空与航天资讯 RSS 订阅',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'nature',
    label: 'Nature',
    desc: '自然学术期刊 RSS 订阅（需首页 Cookie）',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'scienceaaas',
    label: 'Science (AAAS)',
    desc: '科学期刊 RSS 订阅',
    category: '国外新闻',
    fields: [cat(), maxCount],
  },
  {
    key: 'jiqizhixin',
    label: '机器之心',
    desc: 'AI 行业资讯与深度报道',
    category: '国内新闻',
    fields: [kw('输入关键词'), maxCount],
  },
  {
    key: 'sspai',
    label: '少数派',
    desc: '数字生活与科技评测',
    category: '国内新闻',
    fields: [kw('输入关键词'), maxCount],
  },
  // ── 娱乐影视 ──────────────────────────────────────────────
  {
    key: 'variety',
    label: 'Variety',
    desc: '影视产业新闻与资讯 RSS',
    category: '娱乐影视',
    fields: [cat(), maxCount],
  },
  {
    key: 'hollywood_reporter',
    label: 'Hollywood Reporter',
    desc: '好莱坞影视娱乐资讯 RSS',
    category: '娱乐影视',
    fields: [cat(), maxCount],
  },
  {
    key: 'deadline',
    label: 'Deadline',
    desc: '娱乐产业新闻与独家报道',
    category: '娱乐影视',
    fields: [cat(), maxCount],
  },
  {
    key: 'billboard',
    label: 'Billboard',
    desc: '音乐榜单与音乐产业资讯',
    category: '娱乐影视',
    fields: [cat(), maxCount],
  },
  {
    key: 'tmz',
    label: 'TMZ',
    desc: '娱乐八卦与明星资讯',
    category: '娱乐影视',
    fields: [cat(), maxCount],
  },
  {
    key: 'ign',
    label: 'IGN',
    desc: '游戏与影视评论及资讯',
    category: '娱乐影视',
    fields: [cat(), maxCount],
  },
  {
    key: 'polygon',
    label: 'Polygon',
    desc: '游戏文化与电子竞技资讯',
    category: '娱乐影视',
    fields: [cat(), maxCount],
  },
  {
    key: 'douban_movie',
    label: '豆瓣电影',
    desc: '电影评分与热门推荐',
    category: '娱乐影视',
    fields: [cat(), maxCount],
  },
  {
    key: 'douban_book',
    label: '豆瓣读书',
    desc: '图书推荐与读书评论',
    category: '娱乐影视',
    fields: [cat(), maxCount],
  },
  {
    key: 'douban_gallery',
    label: '豆瓣广场',
    desc: '文化话题讨论与热帖',
    category: '娱乐影视',
    fields: [cat(), maxCount],
  },
  // ── 体育 ─────────────────────────────────────────────────
  {
    key: 'zhibo8',
    label: '直播吧',
    desc: '体育赛事新闻与比分',
    category: '体育',
    fields: [cat(), maxCount],
  },
  {
    key: 'hupu',
    label: '虎扑',
    desc: '体育社区热门与流言板',
    category: '体育',
    fields: [cat(), maxCount],
  },
  {
    key: 'bbc_sport',
    label: 'BBC Sport',
    desc: '国际体育赛事与新闻',
    category: '体育',
    fields: [cat(), maxCount],
  },
  {
    key: 'flashscore',
    label: 'Flashscore',
    desc: '多项目实时比分',
    category: '体育',
    fields: [cat(), maxCount],
  },
  // ── 招聘 ─────────────────────────────────────────────────
  {
    key: 'lagou',
    label: '拉勾',
    desc: '互联网行业招聘',
    category: '招聘',
    fields: [kw('职位关键词'), maxCount],
  },
  {
    key: 'zhipin',
    label: 'BOSS 直聘',
    desc: '直聘平台职位搜索',
    category: '招聘',
    fields: [kw('职位关键词'), maxCount],
  },
  {
    key: '51job',
    label: '前程无忧',
    desc: '综合招聘平台职位',
    category: '招聘',
    fields: [kw('职位关键词'), maxCount],
  },
  {
    key: 'linkedin_jobs',
    label: 'LinkedIn Jobs',
    desc: '国际招聘平台职位',
    category: '招聘',
    fields: [kw('职位关键词'), maxCount],
  },
  // ── 政府数据 ─────────────────────────────────────────────
  {
    key: 'stats_gov',
    label: '国家统计局',
    desc: '官方统计数据与公报',
    category: '政府数据',
    fields: [cat(), maxCount],
  },
  {
    key: 'sse',
    label: '上交所',
    desc: '证券市场信息与公告',
    category: '政府数据',
    fields: [cat(), maxCount],
  },
  {
    key: 'chinamoney',
    label: '中国货币网',
    desc: '货币市场数据与行情',
    category: '政府数据',
    fields: [cat(), maxCount],
  },
  {
    key: 'worldometers',
    label: 'Worldometers',
    desc: '全球实时统计数据',
    category: '政府数据',
    fields: [cat(), maxCount],
  },
  {
    key: 'ourworldindata',
    label: 'Our World in Data',
    desc: '全球数据图表与研究',
    category: '政府数据',
    fields: [cat(), maxCount],
  },
  {
    key: 'medrxiv',
    label: 'medRxiv',
    desc: '医学预印本论文',
    category: '政府数据',
    fields: [kw('搜索关键词'), maxCount],
  },
]

export const newsSourceMap: Record<string, NewsSource> = Object.fromEntries(
  NEWS_SOURCES.map((s) => [s.key, s]),
)

export async function searchNewsSource(
  sourceKey: string,
  clientId: string,
  payload: Record<string, any>,
): Promise<any> {
  return genericSearchAndWait(clientId, sourceKey, payload)
}