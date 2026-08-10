<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

interface LinkItem {
  name: string
  url: string
  platform?: string
  icon?: string
  logoUrl?: string
  category?: string
}

// 特殊平台的 logo 映射（直接使用网站根路径的 favicon）
const specialLogos: Record<string, string> = {
  'https://www.xiaohongshu.com': 'https://www.xiaohongshu.com/favicon.ico',
  'https://baijiahao.baidu.com': 'https://www.baidu.com/favicon.ico',
  'https://www.dangdang.com': 'https://www.dangdang.com/favicon.ico',
  'https://www.goofish.com/publish': 'https://www.goofish.com/favicon.ico',
  'https://seller.ozon.ru/': 'https://seller.ozon.ru/favicon.ico',
  'https://www.ozon.ru/': 'https://www.ozon.ru/favicon.ico',
  'https://partner.kuajingmaihuo.com/': 'https://partner.kuajingmaihuo.com/favicon.ico',
  'https://cn.lianlianpay.com/account': 'https://cn.lianlianpay.com/favicon.ico',
  'https://www.1688.com': 'https://www.1688.com/favicon.ico',
  'https://op.jinritemai.com/docs/center': 'https://op.jinritemai.com/favicon.ico',
  'https://fxg.jinritemai.com/ffa/mshop/homepage/index': 'https://fxg.jinritemai.com/favicon.ico',
  'https://open.kwaixiaodian.com/': 'https://open.kwaixiaodian.com/favicon.ico',
  'https://s.kwaixiaodian.com/zone/home': 'https://s.kwaixiaodian.com/favicon.ico',
  'https://agentseller.temu.com/': 'https://agentseller.temu.com/favicon.ico'
}

// 获取平台 logo 的函数
const getLogoUrl = (url: string): string => {
  // 优先使用特殊映射的 logo
  if (specialLogos[url]) {
    return specialLogos[url]
  }
  
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    // 使用 Google 的 favicon API
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return ''
  }
}

const linkCategories = [
  {
    key: 'social-media',
    label: '自媒体平台',
    icon: 'vscode-icons:folder-type-view',
    links: [
      { name: '微博', url: 'https://weibo.com', platform: 'weibo', icon: 'mdi-sina-weibo' },
      { name: '小红书', url: 'https://www.xiaohongshu.com', platform: 'xiaohongshu', icon: 'mdi-book-open-variant' },
      { name: '抖音', url: 'https://www.douyin.com', platform: 'douyin', icon: 'mdi-music-note' },
      { name: '快手', url: 'https://www.kuaishou.com', platform: 'kuaishou', icon: 'mdi-lightning-bolt' },
      { name: 'B站', url: 'https://www.bilibili.com', icon: 'mdi-play-circle' },
      { name: '知乎', url: 'https://www.zhihu.com', icon: 'mdi-help-circle' },
      { name: '今日头条', url: 'https://www.toutiao.com', icon: 'mdi-newspaper' },
      { name: '百家号', url: 'https://baijiahao.baidu.com', icon: 'mdi-file-document-edit' }
    ]
  },
  {
    key: 'cross-border',
    label: '跨境电商平台',
    icon: 'vscode-icons:folder-type-global',
    links: [
      { name: 'Amazon', url: 'https://www.amazon.com', platform: 'amazon', icon: 'mdi-cart' },
      { name: 'Temu', url: 'https://www.temu.com', icon: 'mdi-shopping' },
        { name: 'Temu 开放平台', url: 'https://partner.kuajingmaihuo.com/', icon: 'mdi-api' },
      { name: 'Temu 卖家中心', url: 'https://agentseller.temu.com/', icon: 'mdi-store-cog' },
      { name: 'Shein', url: 'https://www.shein.com', platform: 'shein', icon: 'mdi-tshirt-crew' },
      { name: 'eBay', url: 'https://www.ebay.com', icon: 'mdi-store' },
      { name: 'Shopify', url: 'https://www.shopify.com', icon: 'mdi-shopping' },
      { name: 'TikTok Shop', url: 'https://www.tiktok.com/shop', icon: 'mdi-shopping-music' },
      { name: 'TikTok Seller', url: 'https://seller.tiktokshopglobalselling.com/', icon: 'mdi-store-cog' },
      { name: '速卖通', url: 'https://www.aliexpress.com', platform: 'aliexpress', icon: 'mdi-package-variant' },
      { name: 'Wish', url: 'https://www.wish.com', icon: 'mdi-gift' },
      { name: 'Etsy', url: 'https://www.etsy.com', icon: 'mdi-hand-heart' },
      { name: 'Lazada', url: 'https://www.lazada.com', icon: 'mdi-shopping-outline' },
      { name: 'Shopee', url: 'https://www.shopee.com', icon: 'mdi-basket' },
      { name: 'Ozon', url: 'https://www.ozon.ru/', icon: 'mdi-shopping' },
      { name: 'Ozon Seller', url: 'https://seller.ozon.ru/', icon: 'mdi-store-cog' }
    ]
  },
  {
    key: 'social-networks',
    label: '常用社交媒体',
    icon: 'vscode-icons:folder-type-client',
    links: [
      { name: 'Facebook', url: 'https://www.facebook.com', icon: 'mdi-facebook' },
      { name: 'Twitter', url: 'https://twitter.com', icon: 'mdi-twitter' },
      { name: 'Instagram', url: 'https://www.instagram.com', icon: 'mdi-instagram' },
      { name: 'LinkedIn', url: 'https://www.linkedin.com', icon: 'mdi-linkedin' },
      { name: 'YouTube', url: 'https://www.youtube.com', icon: 'mdi-youtube' },
      { name: 'Pinterest', url: 'https://www.pinterest.com', icon: 'mdi-pinterest' },
      { name: 'TikTok', url: 'https://www.tiktok.com', icon: 'mdi-music' },
      { name: 'Snapchat', url: 'https://www.snapchat.com', icon: 'mdi-snapchat' }
    ]
  },
  {
    key: 'ecommerce',
    label: '运营电商平台',
    icon: 'vscode-icons:folder-type-server',
    links: [
      { name: '1688', url: 'https://www.1688.com', icon: 'mdi-shopping' },
      { name: '淘宝', url: 'https://www.taobao.com', icon: 'mdi-shopping' },
      { name: '天猫', url: 'https://www.tmall.com', icon: 'mdi-store' },
      { name: '京东', url: 'https://www.jd.com', icon: 'mdi-package' },
      { name: '拼多多', url: 'https://www.pinduoduo.com', icon: 'mdi-cart-variant' },
      { name: '抖店', url: 'https://fxg.jinritemai.com/ffa/mshop/homepage/index', icon: 'mdi-storefront' },
      { name: '抖店 开放平台', url: 'https://op.jinritemai.com/docs/center', icon: 'mdi-api' },
      { name: '快手小店', url: 'https://s.kwaixiaodian.com/zone/home', icon: 'mdi-storefront-outline' },
      { name: '快手电商 开放平台', url: 'https://open.kwaixiaodian.com/', icon: 'mdi-api' },
      { name: '咸鱼', url: 'https://www.goofish.com/publish', platform: 'xianyu', icon: 'mdi-shopping-outline' },
      { name: '苏宁易购', url: 'https://www.suning.com', icon: 'mdi-store-outline' },
      { name: '唯品会', url: 'https://www.vip.com', icon: 'mdi-tag' },
      { name: '当当', url: 'https://www.dangdang.com', icon: 'mdi-book-open' },
      { name: '国美', url: 'https://www.gome.com.cn', icon: 'mdi-home' }
    ]
  },
  {
    key: 'tools',
    label: '工具模块',
    icon: 'vscode-icons:folder-type-tools',
    links: [
      { name: '连连付款', url: 'https://cn.lianlianpay.com/account', icon: 'mdi-credit-card-outline' }
    ]
  }
].map(category => ({
  ...category,
  links: category.links.map(link => ({
    ...link,
    logoUrl: getLogoUrl(link.url)
  }))
}))

const searchKeyword = ref('')
const imageErrors = ref<Set<string>>(new Set())

const openLink = async (link: LinkItem) => {
  try {
    window.open(link.url, '_blank')
    ElMessage.success(`正在打开 ${link.name}`)
  } catch (error) {
    console.error('打开链接失败:', error)
    ElMessage.error(`操作失败，请稍后重试`)
  }
}

const copyUrl = async (link: LinkItem, event: Event) => {
  event.stopPropagation()
  try {
    await navigator.clipboard.writeText(link.url)
    ElMessage.success(`已复制 ${link.name} 链接`)
  } catch (error) {
    console.error('复制链接失败:', error)
    ElMessage.error('复制失败')
  }
}

const filteredCategories = computed(() => {
  if (!searchKeyword.value.trim()) {
    return linkCategories
  }
  
  const keyword = searchKeyword.value.toLowerCase().trim()
  return linkCategories.map(category => {
    const filteredLinks = category.links.filter(link => 
      link.name.toLowerCase().includes(keyword) || 
      category.label.toLowerCase().includes(keyword)
    )
    return {
      ...category,
      links: filteredLinks
    }
  }).filter(category => category.links.length > 0)
})

// 处理图片加载失败的情况
const handleImageError = (event: Event, link: LinkItem) => {
  // 标记该链接的图片加载失败
  imageErrors.value.add(link.url)
  const img = event.target as HTMLImageElement
  if (img) {
    img.style.display = 'none'
  }
}

// 检查图片是否加载失败
const isImageError = (url: string) => {
  return imageErrors.value.has(url)
}

</script>

<template>
  <div class="link-navigation-page">
    <!-- 顶部紧凑型 Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon-wrapper">
          <Icon icon="ep:guide" class="header-icon" />
        </div>
        <div>
          <h2 class="header-title">链接导航</h2>
          <p class="header-subtitle">常用自媒体、跨境及运营平台快捷访问入口</p>
        </div>
      </div>
      <div class="header-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索平台名称..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <Icon icon="ep:search" />
          </template>
        </el-input>
      </div>
    </div>

    <!-- 分类列表 -->
    <div class="categories-list">
      <div 
        v-for="category in filteredCategories"
        :key="category.key"
        class="category-section"
      >
        <div class="category-header">
          <div class="category-title">
            <Icon :icon="category.icon" class="category-icon" />
            <span>{{ category.label }}</span>
            <span class="category-count">{{ category.links.length }}</span>
          </div>
        </div>

        <div class="links-grid">
          <div
            v-for="link in category.links"
            :key="link.url"
            class="link-card"
            @click="openLink(link)"
          >
            <div class="link-icon">
              <img 
                v-if="link.logoUrl && !isImageError(link.url)" 
                :src="link.logoUrl" 
                :alt="link.name"
                @error="handleImageError($event, link)"
                class="link-logo"
              />
              <Icon 
                v-if="link.icon && (!link.logoUrl || isImageError(link.url))" 
                :icon="link.icon"
                class="fallback-icon"
              />
            </div>
            <div class="link-info">
              <span class="link-name" :title="link.name">{{ link.name }}</span>
            </div>
            <div class="link-actions">
              <div 
                class="action-btn"
                @click="copyUrl(link, $event)"
                title="复制链接"
              >
                <Icon icon="ep:copy-document" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredCategories.length === 0" class="empty-state">
      <Icon icon="ep:search" class="empty-icon" />
      <p>未找到匹配的平台</p>
    </div>
  </div>
</template>

<style scoped>
.link-navigation-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

/* 顶部 Header：更加精致紧凑 */
.page-header {
  display: flex;
  padding: 12px 20px;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 2%);
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-wrapper {
  display: flex;
  width: 32px;
  height: 32px;
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  border-radius: 8px;
  align-items: center;
  justify-content: center;
}

.header-icon {
  font-size: 18px;
}

.header-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.search-input {
  width: 240px;
}

.search-input :deep(.el-input__wrapper) {
  background-color: var(--el-fill-color-light);
  border: 1px solid transparent;
  border-radius: 16px;
  box-shadow: none;
  transition: all 0.2s ease;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  background-color: var(--el-bg-color);
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-section {
  padding: 16px;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.category-header {
  padding-bottom: 8px;
  margin-bottom: 12px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.category-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.category-icon {
  font-size: 16px;
  color: var(--el-color-primary);
}

.category-count {
  padding: 1px 6px;
  margin-left: 4px;
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color);
  border-radius: 10px;
}

/* 链接网格：更加紧凑精美 */
.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.link-card {
  position: relative;
  display: flex;
  padding: 8px 10px;
  overflow: hidden;
  cursor: pointer;
  background-color: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  align-items: center;
  gap: 8px;
}

.link-card:hover {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.link-icon {
  display: flex;
  width: 20px;
  height: 20px;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.link-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.fallback-icon {
  font-size: 14px;
}

.link-info {
  display: flex;
  min-width: 0; /* 允许文本截断 */
  flex: 1;
  align-items: center;
}

.link-name {
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-card:hover .link-name {
  color: var(--el-color-primary);
}

/* 隐藏在右侧的悬浮操作按钮 */
.link-actions {
  display: flex;
  align-items: center;
  opacity: 0;
  transform: translateX(4px);
  transition: all 0.2s ease;
}

.link-card:hover .link-actions {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  display: flex;
  width: 20px;
  height: 20px;
  color: var(--el-text-color-secondary);
  border-radius: 4px;
  transition: all 0.15s ease;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  color: var(--el-color-primary);
  background-color: var(--el-color-white);
  box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--el-text-color-secondary);
  gap: 8px;
}

.empty-icon {
  font-size: 32px;
  color: var(--el-text-color-placeholder);
}

.empty-state p {
  margin: 0;
  font-size: 13px;
}
</style>
