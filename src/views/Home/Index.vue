<template>
  <div class="home-dashboard">
    <!-- 标题栏 -->
    <header class="home-topbar">
      <h1 class="home-topbar__title">工作台</h1>
      <ElButton text type="primary" @click="goTo('/home/statistics')">
        数据统计 <Icon icon="ep:arrow-right" class="home-topbar__arrow" />
      </ElButton>
    </header>

    <!-- 摘要指标 -->
    <section class="home-stats">
      <div v-for="item in statItems" :key="item.label" class="home-stat">
        <div class="home-stat__value">{{ formatNumber(item.value) }}</div>
        <div class="home-stat__label">{{ item.label }}</div>
      </div>
    </section>

    <!-- 快捷入口 -->
    <section class="home-section">
      <div class="home-section__title">快捷入口</div>
      <div class="home-grid home-grid--shortcuts">
        <button
          v-for="item in shortcuts"
          :key="item.key"
          type="button"
          class="home-shortcut"
          @click="goTo(item.route)"
        >
          <span class="home-shortcut__icon">
            <Icon :icon="item.icon" />
          </span>
          <div class="home-shortcut__body">
            <div class="home-shortcut__title">{{ item.title }}</div>
            <div class="home-shortcut__desc">{{ item.description }}</div>
          </div>
        </button>
      </div>
    </section>

    <!-- 功能模块 -->
    <section class="home-section">
      <div class="home-section__title">功能模块</div>
      <div class="home-grid home-grid--modules">
        <article
          v-for="mod in modules"
          :key="mod.key"
          class="home-module"
          @click="goTo(mod.route)"
        >
          <div class="home-module__head">
            <span class="home-module__icon">
              <Icon :icon="mod.icon" />
            </span>
            <div>
              <div class="home-module__title">{{ mod.title }}</div>
              <div class="home-module__desc">{{ mod.description }}</div>
            </div>
          </div>
          <ul class="home-module__features">
            <li v-for="f in mod.features" :key="f.name" @click.stop="goTo(f.route)">
              <span class="home-module__feature-name">{{ f.name }}</span>
              <span class="home-module__feature-desc">{{ f.desc }}</span>
            </li>
          </ul>
          <div class="home-module__footer">
            <span class="home-module__link">进入模块</span>
            <Icon icon="ep:arrow-right" />
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getModuleStatisticsApi } from "@/api/statistics";

defineOptions({ name: "HomeIndex" });

const router = useRouter();
const goTo = (route: string) => router.push(route);
const formatNumber = (v: number) => new Intl.NumberFormat("zh-CN").format(v);

// ── 摘要指标 ──────────────────────────────────────
const statsLoading = ref(false);
const stats = ref<{ moduleCount: number; todayCreated: number; todayUpdated: number }>({
  moduleCount: 0,
  todayCreated: 0,
  todayUpdated: 0,
});

const statItems = computed(() => [
  { label: "模块总数", value: stats.value.moduleCount },
  { label: "今日新增", value: stats.value.todayCreated },
  { label: "今日修改", value: stats.value.todayUpdated },
]);

const loadStats = async () => {
  statsLoading.value = true;
  try {
    const res: any = await getModuleStatisticsApi(1);
    const data = res?.data || res;
    stats.value = {
      moduleCount: Number(data?.summary?.moduleCount || 0),
      todayCreated: Number(data?.summary?.periodCreated || 0),
      todayUpdated: Number(data?.summary?.periodUpdated || 0),
    };
  } catch {
    // 静默失败，不影响首页渲染
  } finally {
    statsLoading.value = false;
  }
};

// ── 快捷入口 ──────────────────────────────────────
interface ShortcutItem {
  key: string;
  title: string;
  description: string;
  route: string;
  icon: string;
}

const shortcuts: ShortcutItem[] = [
  {
    key: "tools",
    title: "工具",
    description: "客户端与插件下载",
    route: "/home/tools/index",
    icon: "ep:tools",
  },
  {
    key: "toolkit",
    title: "工具集",
    description: "按平台进入业务工具",
    route: "/operation/toolkit",
    icon: "ep:box",
  },
  {
    key: "browser-automation",
    title: "浏览器自动化",
    description: "环境管理与调试",
    route: "/external/browser-automation",
    icon: "ep:connection",
  },
  {
    key: "queue",
    title: "任务中心",
    description: "发布任务与执行日志",
    route: "/product-publish/queue",
    icon: "ep:data-analysis",
  },
  {
    key: "psd-set",
    title: "套图制作",
    description: "PS 自动制作流程",
    route: "/product-publish/psd-set",
    icon: "ep:picture",
  },
  {
    key: "ai-api-key",
    title: "AI API Key",
    description: "平台密钥管理",
    route: "/system/ai-api-key",
    icon: "ep:key",
  },
  {
    key: "statistics",
    title: "数据统计",
    description: "模块数据趋势",
    route: "/home/statistics",
    icon: "ep:trend-charts",
  },
  {
    key: "hot-search",
    title: "热搜管理",
    description: "多平台热搜采集分析",
    route: "/home/hot-search",
    icon: "ep:hot-water",
  },
];

// ── 功能模块 ──────────────────────────────────────
interface ModuleFeature {
  name: string;
  desc: string;
  route: string;
}

interface ModuleItem {
  key: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  features: ModuleFeature[];
}

const modules: ModuleItem[] = [
  {
    key: "resource",
    title: "资源中心",
    description: "素材管理与设计资源",
    icon: "ep:collection",
    route: "/resource/material",
    features: [
      { name: "图片素材", desc: "图片资源管理", route: "/resource/material" },
      { name: "采集素材", desc: "自动化采集", route: "/resource/crawler-material" },
      { name: "设计灵感", desc: "灵感收集", route: "/resource/design-inspiration" },
      { name: "3D资源", desc: "三维模型管理", route: "/resource/asset-3d" },
    ],
  },
  {
    key: "ai",
    title: "AI 创作",
    description: "AI 工具与智能服务",
    icon: "ep:cpu",
    route: "/ai/mcp",
    features: [
      { name: "MCP 工具", desc: "模型上下文协议", route: "/ai/mcp" },
      { name: "Skills", desc: "AI 技能管理", route: "/ai/skills" },
      { name: "AI 配置", desc: "模型与参数设置", route: "/ai/model-service" },
    ],
  },
  {
    key: "independent-site",
    title: "独立站",
    description: "独立站商品与店铺",
    icon: "ep:shop",
    route: "/independent-site/product",
    features: [
      { name: "商品管理", desc: "独立站商品", route: "/independent-site/product" },
      { name: "商品分类", desc: "分类体系维护", route: "/independent-site/category" },
      { name: "商品生成模板", desc: "模板配置", route: "/independent-site/generation-template" },
    ],
  },
  {
    key: "product-publish",
    title: "商品发布",
    description: "发布任务与套图流程",
    icon: "ep:shopping-bag",
    route: "/product-publish/queue",
    features: [
      { name: "发布队列", desc: "任务列表管理", route: "/product-publish/queue" },
      { name: "发布配置", desc: "队列状态监控", route: "/product-publish/publish-config" },
      { name: "套图制作", desc: "PS 自动制作", route: "/product-publish/psd-set" },
    ],
  },
  {
    key: "external",
    title: "客户端功能",
    description: "浏览器与客户端能力",
    icon: "ep:connection",
    route: "/external/browser-automation",
    features: [
      { name: "浏览器自动化", desc: "环境与调试", route: "/external/browser-automation" },
      { name: "PS 自动化", desc: "PS 远程控制", route: "/external/ps-automation" },
      { name: "客户端管理", desc: "节点状态", route: "/external/client-management" },
    ],
  },
  {
    key: "operation",
    title: "运营支持",
    description: "运营工具与平台对接",
    icon: "ep:shop",
    route: "/operation/link-navigation",
    features: [
      { name: "链接导航", desc: "常用平台入口", route: "/operation/link-navigation" },
      { name: "工具集", desc: "平台业务工具", route: "/operation/toolkit" },
      { name: "电商数据", desc: "数据链路管理", route: "/ecom-platform-collect/tasks" },
    ],
  },
];

onMounted(() => {
  loadStats();
});
</script>

<style scoped lang="scss">
.home-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 0 24px;
}

/* ── 标题栏 ──────────────────────────────── */
.home-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 8px;
}

.home-topbar__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}

.home-topbar__arrow {
  margin-left: 2px;
  font-size: 13px;
}

/* ── 摘要指标 ────────────────────────────── */
.home-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.home-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 50%, transparent 50%);
  background: color-mix(in srgb, var(--el-bg-color) 97%, transparent 3%);
}

.home-stat__value {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.home-stat__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* ── 通用 section ────────────────────────── */
.home-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.home-section__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

/* ── 快捷入口网格 ────────────────────────── */
.home-grid {
  display: grid;
  gap: 12px;
}

.home-grid--shortcuts {
  grid-template-columns: repeat(4, 1fr);
}

.home-grid--modules {
  grid-template-columns: repeat(2, 1fr);
}

/* ── 快捷入口卡片 ────────────────────────── */
.home-shortcut {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 50%, transparent 50%);
  background: color-mix(in srgb, var(--el-bg-color) 97%, transparent 3%);
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  outline: none;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--el-color-primary) 24%, var(--el-border-color) 76%);
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  }
}

.home-shortcut__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-fill-color-light) 80%, transparent 20%);
  color: var(--el-text-color-primary);
  font-size: 16px;
}

.home-shortcut__body {
  min-width: 0;
}

.home-shortcut__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}

.home-shortcut__desc {
  margin-top: 3px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 功能模块卡片 ────────────────────────── */
.home-module {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 50%, transparent 50%);
  background: color-mix(in srgb, var(--el-bg-color) 97%, transparent 3%);
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 24%, var(--el-border-color) 76%);
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  }
}

.home-module__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.home-module__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-fill-color-light) 80%, transparent 20%);
  color: var(--el-text-color-primary);
  font-size: 17px;
}

.home-module__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}

.home-module__desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.home-module__features {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 7px 0;
    border-top: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 60%, transparent 40%);
    cursor: pointer;
    transition: color 0.14s ease;

    &:hover {
      color: var(--el-color-primary);
    }

    &:hover .home-module__feature-name,
    &:hover .home-module__feature-desc {
      color: var(--el-color-primary);
    }
  }
}

.home-module__feature-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  transition: color 0.14s ease;
}

.home-module__feature-desc {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  transition: color 0.14s ease;
}

.home-module__footer {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-top: 2px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
}

/* ── 响应式 ──────────────────────────────── */
@media (max-width: 1180px) {
  .home-grid--shortcuts {
    grid-template-columns: repeat(2, 1fr);
  }

  .home-grid--modules {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .home-stats {
    grid-template-columns: 1fr;
  }

  .home-grid--shortcuts {
    grid-template-columns: 1fr;
  }

  .home-stat__value {
    font-size: 22px;
  }
}
</style>
