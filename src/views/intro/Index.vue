<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 产品数据
const products = [
  {
    icon: '🌐',
    iconClass: 'purple',
    name: '前台站点',
    desc: 'Nuxt 4 SSR 多品牌站点矩阵，SEO 全链路优化，支持 9 个品牌站点一键切换',
    features: ['SSR/SSG', 'SEO 优化', 'i18n', '响应式'],
    link: 'https://1s.design',
    linkText: '访问前台 →',
    external: true
  },
  {
    icon: '🎨',
    iconClass: 'blue',
    name: '在线设计工具',
    desc: '基于 Fabric.js 的 Canvas 画布引擎，AI 设计助手，40+ 画布操作，3D 预览',
    features: ['AI 设计', 'Canvas', '3D 预览', '贴纸系统'],
    link: 'https://1s.design/design',
    linkText: '开始设计 →',
    external: true
  },
  {
    icon: '⚙️',
    iconClass: 'green',
    name: '管理后台',
    desc: 'Vue 3 + Element Plus，电商多平台发布，BPMN 工作流，AI 图文生成',
    features: ['多平台发布', '工作流', 'AI 生成', '数据报表'],
    link: '/home',
    linkText: '进入后台 →',
    external: false
  },
  {
    icon: '💻',
    iconClass: 'red',
    name: '桌面客户端',
    desc: 'Electron 跨平台桌面应用，Playwright 自动化，Remotion 视频渲染，本地 AI Agent',
    features: ['AI Agent', '浏览器自动化', '视频渲染', 'MCP Server'],
    link: '#download',
    linkText: '下载客户端 →',
    external: false
  },
  {
    icon: '🔌',
    iconClass: 'purple',
    name: '浏览器扩展',
    desc: 'WXT + Vue 3 构建的 Chrome MV3 扩展，网页协作与素材采集',
    features: ['Content Script', 'Background', '素材采集', '实时通信'],
    link: '#download',
    linkText: '安装扩展 →',
    external: false
  },
  {
    icon: '🖥️',
    iconClass: 'blue',
    name: '后端服务',
    desc: 'NestJS 微服务架构，90+ 业务模块，LangGraph AI Agent，向量检索',
    features: ['微服务', 'AI Agent', '向量检索', 'Docker'],
    link: 'https://api.1s.design/api',
    linkText: 'API 文档 →',
    external: true
  }
]

// 功能特性
const features = [
  { icon: '🤖', title: 'AI Agent 双端架构', desc: '基于 LangGraph 的 ReAct 循环 Agent，服务端 150+ 工具，客户端 79+ 本地能力，MCP 协议统一调度' },
  { icon: '🎨', title: 'AI 设计助手', desc: '文生图、智能排版、设计建议、风格迁移，40+ 画布操作，Three.js 3D 预览' },
  { icon: '🔄', title: '可视化工作流', desc: '100+ 节点类型的自研工作流引擎，电商采集→发布→分发全自动化链路' },
  { icon: '🔍', title: '向量检索', desc: '集成 Qdrant 向量搜索引擎，支持百万级贴纸/素材的以图搜图' },
  { icon: '🛒', title: '电商多平台发布', desc: '支持 Temu、Amazon、拼多多、1688 等 17+ 电商平台一键发布' },
  { icon: '🌍', title: '多品牌站点', desc: 'SiteDefinition 配置化方案，一套代码驱动 9 个品牌站点运营' },
  { icon: '🎬', title: '视频渲染', desc: 'Remotion 视频渲染引擎，支持模板化视频批量生成' },
  { icon: '🔒', title: 'WebRTC 协作', desc: 'PeerJS + WebRTC 实现远程协作与整页监控' }
]

// 技术栈
const techStack = [
  'Vue 3', 'Nuxt 4', 'TypeScript', 'NestJS', 'Electron',
  'LangGraph', 'LangChain', 'MCP', 'Fabric.js', 'Three.js',
  'Qdrant', 'MySQL', 'Redis', 'BullMQ', 'Docker',
  'Playwright', 'Remotion', 'WXT', 'Element Plus', 'UnoCSS'
]

// 滚动动画
const visibleElements = ref<Set<string>>(new Set())

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleElements.value.add(entry.target.id)
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  )

  document.querySelectorAll('[data-animate]').forEach((el) => {
    observer.observe(el)
  })
})

// 平滑滚动
const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="intro-page">
    <!-- 背景效果 -->
    <div class="bg-effects"></div>

    <!-- 导航 -->
    <nav class="nav">
      <div class="nav-logo">
        <div class="nav-logo-icon">🎨</div>
        <span>衣设 1s.design</span>
      </div>
      <div class="nav-links">
        <a href="javascript:void(0)" @click="scrollTo('products')">产品</a>
        <a href="javascript:void(0)" @click="scrollTo('features')">功能</a>
        <a href="javascript:void(0)" @click="scrollTo('download')">下载</a>
        <a href="javascript:void(0)" @click="scrollTo('guide')">引导</a>
        <a href="https://1s.design" class="nav-cta" target="_blank">立即体验</a>
      </div>
    </nav>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-badge">
        <span class="hero-badge-dot"></span>
        <span>开放创意设计平台 · POD 按需定制</span>
      </div>
      <h1>
        最大的最具创意的<br>
        <span class="gradient-text">印花商品开放平台</span>
      </h1>
      <p class="hero-desc">
        衣设（1s.design）提供免费在线设计工具、丰富印花载体、社区灵感分享与一件起订专属按需定制服务。
        支持 AI 智能设计、多品牌站点矩阵、电商全平台发布。
      </p>
      <div class="hero-actions">
        <a href="https://1s.design" class="btn btn-primary" target="_blank">
          🚀 进入前台
        </a>
        <a href="javascript:void(0)" class="btn btn-secondary" @click="scrollTo('download')">
          📥 下载客户端
        </a>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-value">6+</div>
          <div class="hero-stat-label">子系统</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-value">90+</div>
          <div class="hero-stat-label">后端模块</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-value">150+</div>
          <div class="hero-stat-label">AI 工具</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-value">9</div>
          <div class="hero-stat-label">品牌站点</div>
        </div>
      </div>
    </section>

    <!-- 产品矩阵 -->
    <section class="section" id="products">
      <div class="section-header" data-animate id="products-header">
        <span class="section-tag">产品矩阵</span>
        <h2 class="section-title">完整 SaaS 生态</h2>
        <p class="section-desc">从设计工具到电商运营，从桌面客户端到浏览器扩展，覆盖创意定制全链路</p>
      </div>
      <div class="products-grid">
        <div
          v-for="(product, index) in products"
          :key="index"
          class="product-card"
          data-animate
          :id="`product-${index}`"
        >
          <div class="product-icon" :class="product.iconClass">{{ product.icon }}</div>
          <h3 class="product-name">{{ product.name }}</h3>
          <p class="product-desc">{{ product.desc }}</p>
          <div class="product-features">
            <span v-for="feature in product.features" :key="feature" class="product-feature">
              {{ feature }}
            </span>
          </div>
          <a
            v-if="product.external"
            :href="product.link"
            class="product-link"
            target="_blank"
          >
            {{ product.linkText }}
          </a>
          <a
            v-else
            href="javascript:void(0)"
            class="product-link"
            @click="scrollTo(product.link.replace('#', ''))"
          >
            {{ product.linkText }}
          </a>
        </div>
      </div>
    </section>

    <!-- 核心功能 -->
    <section class="section" id="features">
      <div class="section-header" data-animate id="features-header">
        <span class="section-tag">核心功能</span>
        <h2 class="section-title">全链路能力覆盖</h2>
        <p class="section-desc">从创意设计到电商运营，AI 驱动的全流程自动化</p>
      </div>
      <div class="features-grid">
        <div
          v-for="(feature, index) in features"
          :key="index"
          class="feature-item"
          data-animate
          :id="`feature-${index}`"
        >
          <div class="feature-icon">{{ feature.icon }}</div>
          <h4 class="feature-title">{{ feature.title }}</h4>
          <p class="feature-desc">{{ feature.desc }}</p>
        </div>
      </div>
    </section>

    <!-- 下载中心 -->
    <section class="section" id="download">
      <div class="section-header" data-animate id="download-header">
        <span class="section-tag">下载中心</span>
        <h2 class="section-title">客户端与插件</h2>
        <p class="section-desc">全平台客户端与浏览器扩展，随时随地使用</p>
      </div>
      <div class="download-grid">
        <div class="download-card" data-animate id="download-1">
          <div class="download-icon">💻</div>
          <h3 class="download-name">桌面客户端</h3>
          <p class="download-desc">Windows / macOS / Linux 全平台<br>AI Agent + 浏览器自动化 + 视频渲染</p>
          <a href="#" class="download-btn">⬇️ 下载 Windows</a>
          <br><br>
          <a href="#" class="download-btn secondary">⬇️ 下载 macOS</a>
        </div>
        <div class="download-card" data-animate id="download-2">
          <div class="download-icon">🔌</div>
          <h3 class="download-name">浏览器扩展</h3>
          <p class="download-desc">Chrome / Edge 浏览器<br>Content Script + 素材采集</p>
          <a href="#" class="download-btn">🔗 Chrome 应用商店</a>
          <br><br>
          <a href="#" class="download-btn secondary">📦 离线安装包</a>
        </div>
        <div class="download-card" data-animate id="download-3">
          <div class="download-icon">🌐</div>
          <h3 class="download-name">在线工具</h3>
          <p class="download-desc">无需安装，浏览器直接使用<br>AI 设计 + 贴纸系统 + 3D 预览</p>
          <a href="https://1s.design/design" class="download-btn" target="_blank">🚀 立即使用</a>
        </div>
      </div>
    </section>

    <!-- 快速引导 -->
    <section class="section" id="guide">
      <div class="section-header" data-animate id="guide-header">
        <span class="section-tag">快速引导</span>
        <h2 class="section-title">四步快速上手</h2>
        <p class="section-desc">从注册到发布，全程引导</p>
      </div>
      <div class="guide-steps">
        <div class="guide-step" data-animate id="guide-1">
          <div class="guide-step-number">1</div>
          <h4 class="guide-step-title">注册账号</h4>
          <p class="guide-step-desc">访问前台站点<br>注册开放用户账号</p>
        </div>
        <div class="guide-step" data-animate id="guide-2">
          <div class="guide-step-number">2</div>
          <h4 class="guide-step-title">下载客户端</h4>
          <p class="guide-step-desc">下载桌面客户端<br>或安装浏览器扩展</p>
        </div>
        <div class="guide-step" data-animate id="guide-3">
          <div class="guide-step-number">3</div>
          <h4 class="guide-step-title">在线设计</h4>
          <p class="guide-step-desc">使用 AI 设计工具<br>创作专属印花图案</p>
        </div>
        <div class="guide-step" data-animate id="guide-4">
          <div class="guide-step-number">4</div>
          <h4 class="guide-step-title">发布商品</h4>
          <p class="guide-step-desc">通过管理后台<br>一键发布多平台</p>
        </div>
      </div>
    </section>

    <!-- 技术栈 -->
    <section class="section">
      <div class="section-header" data-animate id="tech-header">
        <span class="section-tag">技术栈</span>
        <h2 class="section-title">现代化技术体系</h2>
        <p class="section-desc">全栈 TypeScript，AI 驱动的开发体验</p>
      </div>
      <div class="tech-tags" data-animate id="tech-tags">
        <span v-for="tech in techStack" :key="tech" class="tech-tag">{{ tech }}</span>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-logo">🎨 衣设 1s.design</div>
      <div class="footer-links">
        <a href="https://1s.design" target="_blank">前台站点</a>
        <a href="https://1s.design/design" target="_blank">设计工具</a>
        <a href="https://api.1s.design/api" target="_blank">API 文档</a>
        <a href="https://github.com/chan-max" target="_blank">GitHub</a>
      </div>
      <p class="footer-copy">© 2024-2026 衣设 1s.design · 开放创意设计平台 · MIT License</p>
    </footer>
  </div>
</template>

<style scoped>
/* ========== Reset & Base ========== */
.intro-page {
  position: relative;
  min-height: 100vh;
  background: #0a0a0f;
  color: #f0f0f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  line-height: 1.6;
  overflow-x: hidden;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

a {
  color: inherit;
  text-decoration: none;
}

/* ========== Background Effects ========== */
.bg-effects {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.bg-effects::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(ellipse at 30% 20%, rgba(105, 0, 255, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(0, 150, 255, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(59, 166, 118, 0.04) 0%, transparent 50%);
  animation: bgFloat 20s ease-in-out infinite;
}

@keyframes bgFloat {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(2%, -2%) rotate(1deg); }
  66% { transform: translate(-1%, 1%) rotate(-0.5deg); }
}

/* ========== Navigation ========== */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 16px 32px;
  background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid #2a2a3a;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
}

.nav-logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #6900ff 0%, #0096ff 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.nav-links {
  display: flex;
  gap: 24px;
  align-items: center;
}

.nav-links a {
  font-size: 14px;
  color: #8888a0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.nav-links a:hover {
  color: #f0f0f5;
}

.nav-cta {
  padding: 8px 20px;
  background: linear-gradient(135deg, #6900ff 0%, #0096ff 100%);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: white !important;
  transition: all 0.3s ease;
}

.nav-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(105, 0, 255, 0.4);
}

/* ========== Hero Section ========== */
.hero {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120px 32px 80px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(105, 0, 255, 0.1);
  border: 1px solid rgba(105, 0, 255, 0.3);
  border-radius: 999px;
  font-size: 13px;
  color: #9955ff;
  margin-bottom: 24px;
  animation: fadeInUp 0.6s ease;
}

.hero-badge-dot {
  width: 6px;
  height: 6px;
  background: #6900ff;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.5); }
}

.hero h1 {
  font-size: clamp(36px, 6vw, 72px);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 20px;
  animation: fadeInUp 0.6s ease 0.1s both;
}

.gradient-text {
  background: linear-gradient(135deg, #6900ff 0%, #0096ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: clamp(16px, 2vw, 20px);
  color: #8888a0;
  max-width: 640px;
  margin-bottom: 40px;
  animation: fadeInUp 0.6s ease 0.2s both;
}

.hero-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  animation: fadeInUp 0.6s ease 0.3s both;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  outline: none;
}

.btn-primary {
  background: linear-gradient(135deg, #6900ff 0%, #0096ff 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(105, 0, 255, 0.4);
}

.btn-secondary {
  background: #12121a;
  color: #f0f0f5;
  border: 1px solid #2a2a3a;
}

.btn-secondary:hover {
  background: #1a1a25;
  border-color: #6900ff;
  transform: translateY(-2px);
}

.hero-stats {
  display: flex;
  gap: 48px;
  margin-top: 60px;
  animation: fadeInUp 0.6s ease 0.4s both;
}

.hero-stat {
  text-align: center;
}

.hero-stat-value {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #6900ff 0%, #0096ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-stat-label {
  font-size: 13px;
  color: #8888a0;
  margin-top: 4px;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== Section Common ========== */
.section {
  position: relative;
  z-index: 1;
  padding: 100px 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-tag {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(105, 0, 255, 0.1);
  border-radius: 999px;
  font-size: 12px;
  color: #9955ff;
  margin-bottom: 12px;
}

.section-title {
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 800;
  margin-bottom: 16px;
}

.section-desc {
  font-size: 16px;
  color: #8888a0;
  max-width: 600px;
  margin: 0 auto;
}

/* ========== Products Grid ========== */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 24px;
}

.product-card {
  background: #12121a;
  border: 1px solid #2a2a3a;
  border-radius: 16px;
  padding: 32px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.product-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(135deg, #6900ff 0%, #0096ff 100%);
  opacity: 0;
  transition: all 0.3s ease;
}

.product-card:hover {
  background: #1a1a25;
  border-color: rgba(105, 0, 255, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 8px 40px rgba(105, 0, 255, 0.2);
}

.product-card:hover::before {
  opacity: 1;
}

.product-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 20px;
}

.product-icon.purple { background: rgba(105, 0, 255, 0.15); }
.product-icon.blue { background: rgba(0, 150, 255, 0.15); }
.product-icon.green { background: rgba(59, 166, 118, 0.15); }
.product-icon.red { background: rgba(255, 100, 100, 0.15); }

.product-name {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
}

.product-desc {
  font-size: 14px;
  color: #8888a0;
  margin-bottom: 20px;
  line-height: 1.7;
}

.product-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.product-feature {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 12px;
  color: #8888a0;
}

.product-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #9955ff;
  transition: all 0.3s ease;
  cursor: pointer;
}

.product-link:hover {
  gap: 10px;
  color: #6900ff;
}

/* ========== Features Section ========== */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.feature-item {
  background: #12121a;
  border: 1px solid #2a2a3a;
  border-radius: 10px;
  padding: 24px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  border-color: rgba(105, 0, 255, 0.3);
  transform: translateY(-2px);
}

.feature-icon {
  font-size: 28px;
  margin-bottom: 12px;
}

.feature-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.feature-desc {
  font-size: 13px;
  color: #8888a0;
  line-height: 1.6;
}

/* ========== Download Section ========== */
.download-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.download-card {
  background: #12121a;
  border: 1px solid #2a2a3a;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s ease;
}

.download-card:hover {
  border-color: rgba(105, 0, 255, 0.3);
  box-shadow: 0 8px 40px rgba(105, 0, 255, 0.2);
}

.download-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #6900ff 0%, #0096ff 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.download-name {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}

.download-desc {
  font-size: 13px;
  color: #8888a0;
  margin-bottom: 20px;
}

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #6900ff 0%, #0096ff 100%);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  transition: all 0.3s ease;
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(105, 0, 255, 0.4);
}

.download-btn.secondary {
  background: #1a1a25;
  border: 1px solid #2a2a3a;
}

.download-btn.secondary:hover {
  border-color: #6900ff;
}

/* ========== Guide Steps ========== */
.guide-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.guide-step {
  text-align: center;
}

.guide-step-number {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #6900ff 0%, #0096ff 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
}

.guide-step-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.guide-step-desc {
  font-size: 13px;
  color: #8888a0;
}

/* ========== Tech Stack ========== */
.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.tech-tag {
  padding: 8px 16px;
  background: #12121a;
  border: 1px solid #2a2a3a;
  border-radius: 8px;
  font-size: 13px;
  color: #8888a0;
  transition: all 0.3s ease;
}

.tech-tag:hover {
  border-color: #6900ff;
  color: #f0f0f5;
}

/* ========== Footer ========== */
.footer {
  position: relative;
  z-index: 1;
  padding: 60px 32px 40px;
  text-align: center;
  border-top: 1px solid #2a2a3a;
}

.footer-logo {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 16px;
}

.footer-links {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.footer-links a {
  font-size: 14px;
  color: #8888a0;
  transition: all 0.3s ease;
}

.footer-links a:hover {
  color: #f0f0f5;
}

.footer-copy {
  font-size: 13px;
  color: #8888a0;
}

/* ========== Animations ========== */
[data-animate] {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

[data-animate].visible,
[data-animate][id^="products-header"],
[data-animate][id^="features-header"],
[data-animate][id^="download-header"],
[data-animate][id^="guide-header"],
[data-animate][id^="tech-header"] {
  opacity: 1;
  transform: translateY(0);
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .nav {
    padding: 12px 16px;
  }

  .nav-links {
    display: none;
  }

  .hero {
    padding: 100px 16px 60px;
  }

  .hero-stats {
    gap: 24px;
  }

  .section {
    padding: 60px 16px;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
