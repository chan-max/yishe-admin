<template>
  <div class="home-dashboard">
    <!-- 标题栏 -->
    <header class="home-topbar">
      <h1 class="home-topbar__title">{{ t('home.title') }}</h1>
      <ElButton text type="primary" @click="goTo('/home/statistics')">
        {{ t('home.statistics') }} <Icon icon="ep:arrow-right" class="home-topbar__arrow" />
      </ElButton>
    </header>

    <!-- 摘要指标 -->
    <section class="home-stats">
      <div v-for="item in statItems" :key="item.label" class="home-stat">
        <div class="home-stat__value">{{ formatNumber(item.value) }}</div>
        <div class="home-stat__label">{{ t(item.label) }}</div>
      </div>
    </section>

    <!-- 快捷入口 -->
    <section class="home-section">
      <div class="home-section__title">{{ t('home.shortcuts') }}</div>
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
            <div class="home-shortcut__title">{{ t(item.title) }}</div>
            <div class="home-shortcut__desc">{{ t(item.description) }}</div>
          </div>
        </button>
      </div>
    </section>

    <!-- 功能模块 -->
    <section class="home-section">
      <div class="home-section__title">{{ t('home.modules') }}</div>
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
              <div class="home-module__title">{{ t(mod.title) }}</div>
              <div class="home-module__desc">{{ t(mod.description) }}</div>
            </div>
          </div>
          <ul class="home-module__features">
            <li v-for="f in mod.features" :key="f.name" @click.stop="goTo(f.route)">
              <span class="home-module__feature-name">{{ t(f.name) }}</span>
              <span class="home-module__feature-desc">{{ t(f.desc) }}</span>
            </li>
          </ul>
          <div class="home-module__footer">
            <span class="home-module__link">{{ t('home.enterModule') }}</span>
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
import { useI18n } from "vue-i18n";
import { getModuleStatisticsApi } from "@/api/statistics";

defineOptions({ name: "HomeIndex" });

const { t } = useI18n();
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
  { label: "home.stat.moduleCount", value: stats.value.moduleCount },
  { label: "home.stat.todayCreated", value: stats.value.todayCreated },
  { label: "home.stat.todayUpdated", value: stats.value.todayUpdated },
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
    title: "home.shortcut.tools.title",
    description: "home.shortcut.tools.desc",
    route: "/home/tools/index",
    icon: "ep:tools",
  },
  {
    key: "toolkit",
    title: "home.shortcut.toolkit.title",
    description: "home.shortcut.toolkit.desc",
    route: "/operation/toolkit",
    icon: "ep:box",
  },
  {
    key: "browser-automation",
    title: "home.shortcut.browserAutomation.title",
    description: "home.shortcut.browserAutomation.desc",
    route: "/external/browser-automation",
    icon: "ep:connection",
  },
  {
    key: "queue",
    title: "home.shortcut.queue.title",
    description: "home.shortcut.queue.desc",
    route: "/product-publish/queue",
    icon: "ep:data-analysis",
  },
  {
    key: "psd-set",
    title: "home.shortcut.psdSet.title",
    description: "home.shortcut.psdSet.desc",
    route: "/product-publish/psd-set",
    icon: "ep:picture",
  },
  {
    key: "ai-api-key",
    title: "home.shortcut.aiApiKey.title",
    description: "home.shortcut.aiApiKey.desc",
    route: "/system/ai-api-key",
    icon: "ep:key",
  },
  {
    key: "statistics",
    title: "home.shortcut.statistics.title",
    description: "home.shortcut.statistics.desc",
    route: "/home/statistics",
    icon: "ep:trend-charts",
  },
  {
    key: "hot-search",
    title: "home.shortcut.hotSearch.title",
    description: "home.shortcut.hotSearch.desc",
    route: "/home/hot-search",
    icon: "ep:hot-water",
  },
  {
    key: "design-inspiration",
    title: "home.shortcut.designInspiration.title",
    description: "home.shortcut.designInspiration.desc",
    route: "/resource/design-inspiration",
    icon: "ep:edit",
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
    title: "home.module.resource.title",
    description: "home.module.resource.desc",
    icon: "ep:collection",
    route: "/resource/material",
    features: [
      { name: "home.module.resource.feature.imageMaterial", desc: "home.module.resource.feature.imageMaterialDesc", route: "/resource/material" },
      { name: "home.module.resource.feature.crawlerMaterial", desc: "home.module.resource.feature.crawlerMaterialDesc", route: "/resource/crawler-material" },
      { name: "home.module.resource.feature.designInspiration", desc: "home.module.resource.feature.designInspirationDesc", route: "/resource/design-inspiration" },
      { name: "home.module.resource.feature.asset3d", desc: "home.module.resource.feature.asset3dDesc", route: "/resource/asset-3d" },
    ],
  },
  {
    key: "ai",
    title: "home.module.ai.title",
    description: "home.module.ai.desc",
    icon: "ep:cpu",
    route: "/ai/mcp",
    features: [
      { name: "home.module.ai.feature.mcp", desc: "home.module.ai.feature.mcpDesc", route: "/ai/mcp" },
      { name: "home.module.ai.feature.skills", desc: "home.module.ai.feature.skillsDesc", route: "/ai/skills" },
      { name: "home.module.ai.feature.aiConfig", desc: "home.module.ai.feature.aiConfigDesc", route: "/ai/model-service" },
    ],
  },
  {
    key: "independent-site",
    title: "home.module.independentSite.title",
    description: "home.module.independentSite.desc",
    icon: "ep:shop",
    route: "/independent-site/product",
    features: [
      { name: "home.module.independentSite.feature.product", desc: "home.module.independentSite.feature.productDesc", route: "/independent-site/product" },
      { name: "home.module.independentSite.feature.category", desc: "home.module.independentSite.feature.categoryDesc", route: "/independent-site/category" },
      { name: "home.module.independentSite.feature.generationTemplate", desc: "home.module.independentSite.feature.generationTemplateDesc", route: "/independent-site/generation-template" },
    ],
  },
  {
    key: "product-publish",
    title: "home.module.productPublish.title",
    description: "home.module.productPublish.desc",
    icon: "ep:shopping-bag",
    route: "/product-publish/queue",
    features: [
      { name: "home.module.productPublish.feature.queue", desc: "home.module.productPublish.feature.queueDesc", route: "/product-publish/queue" },
      { name: "home.module.productPublish.feature.publishConfig", desc: "home.module.productPublish.feature.publishConfigDesc", route: "/product-publish/publish-config" },
      { name: "home.module.productPublish.feature.psdSet", desc: "home.module.productPublish.feature.psdSetDesc", route: "/product-publish/psd-set" },
    ],
  },
  {
    key: "external",
    title: "home.module.external.title",
    description: "home.module.external.desc",
    icon: "ep:connection",
    route: "/external/browser-automation",
    features: [
      { name: "home.module.external.feature.browserAutomation", desc: "home.module.external.feature.browserAutomationDesc", route: "/external/browser-automation" },
      { name: "home.module.external.feature.psAutomation", desc: "home.module.external.feature.psAutomationDesc", route: "/external/ps-automation" },
      { name: "home.module.external.feature.clientManagement", desc: "home.module.external.feature.clientManagementDesc", route: "/external/client-management" },
    ],
  },
  {
    key: "operation",
    title: "home.module.operation.title",
    description: "home.module.operation.desc",
    icon: "ep:shop",
    route: "/operation/link-navigation",
    features: [
      { name: "home.module.operation.feature.linkNavigation", desc: "home.module.operation.feature.linkNavigationDesc", route: "/operation/link-navigation" },
      { name: "home.module.operation.feature.toolkit", desc: "home.module.operation.feature.toolkitDesc", route: "/operation/toolkit" },
      { name: "home.module.operation.feature.ecomData", desc: "home.module.operation.feature.ecomDataDesc", route: "/ecom-platform-collect/tasks" },
    ],
  },
];

onMounted(() => {
  loadStats();
});
</script>

<style scoped lang="scss">


/* ── 响应式 ──────────────────────────────── */
@media (width <= 1180px) {
  .home-grid--shortcuts {
    grid-template-columns: repeat(2, 1fr);
  }

  .home-grid--modules {
    grid-template-columns: 1fr;
  }
}

@media (width <= 767px) {
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
  padding: 16px 18px;
  background: color-mix(in srgb, var(--el-bg-color) 97%, transparent 3%);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 50%, transparent 50%);
  border-radius: 12px;
  flex-direction: column;
  gap: 4px;
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
  width: 100%;
  padding: 14px;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: color-mix(in srgb, var(--el-bg-color) 97%, transparent 3%);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 50%, transparent 50%);
  border-radius: 12px;
  outline: none;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
  appearance: none;
  appearance: none;
  align-items: flex-start;
  gap: 12px;

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 24%, var(--el-border-color) 76%);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgb(15 23 42 / 6%);
  }
}

.home-shortcut__icon {
  display: inline-flex;
  width: 34px;
  height: 34px;
  font-size: 16px;
  color: var(--el-text-color-primary);
  background: color-mix(in srgb, var(--el-fill-color-light) 80%, transparent 20%);
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.home-shortcut__body {
  min-width: 0;
}

.home-shortcut__title {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.home-shortcut__desc {
  margin-top: 3px;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── 功能模块卡片 ────────────────────────── */
.home-module {
  display: flex;
  padding: 16px 18px;
  cursor: pointer;
  background: color-mix(in srgb, var(--el-bg-color) 97%, transparent 3%);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 50%, transparent 50%);
  border-radius: 12px;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease;
  flex-direction: column;
  gap: 12px;

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 24%, var(--el-border-color) 76%);
    box-shadow: 0 4px 14px rgb(15 23 42 / 6%);
  }
}

.home-module__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.home-module__icon {
  display: inline-flex;
  width: 36px;
  height: 36px;
  font-size: 17px;
  color: var(--el-text-color-primary);
  background: color-mix(in srgb, var(--el-fill-color-light) 80%, transparent 20%);
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.home-module__title {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.home-module__desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.home-module__features {
  display: flex;
  padding: 0;
  margin: 0;
  list-style: none;
  flex-direction: column;
  gap: 0;

  li {
    display: flex;
    padding: 7px 0;
    cursor: pointer;
    border-top: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 60%, transparent 40%);
    transition: color 0.14s ease;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

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
</style>
