<template>
  <div class="home-dashboard">
    <!-- 标题栏 -->
    <header class="home-topbar">
      <h1 class="home-topbar__title">{{ t('home.title') }}</h1>
      <ElButton text type="primary" @click="goTo('/home/statistics')">
        {{ t('home.statistics') }} <Icon icon="ep:arrow-right" class="home-topbar__arrow" />
      </ElButton>
    </header>

    <!-- Dashboard Overview -->
    <DashboardOverview />

    <!-- 快捷入口 -->
    <section class="home-section">
      <div class="home-section__title">{{ t('home.shortcuts') }}</div>
      <nav class="home-shortcuts">
        <a
          v-for="item in shortcuts"
          :key="item.key"
          class="home-shortcuts__item"
          @click.prevent="goTo(item.route)"
        >
          <Icon :icon="item.icon" class="home-shortcuts__icon" />
          <span class="home-shortcuts__label">{{ t(item.title) }}</span>
          <span class="home-shortcuts__desc">{{ t(item.description) }}</span>
          <Icon icon="ep:arrow-right" class="home-shortcuts__arrow" />
        </a>
      </nav>
    </section>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import DashboardOverview from "./components/DashboardOverview.vue";

defineOptions({ name: "HomeIndex" });

const { t } = useI18n();
const router = useRouter();
const goTo = (route: string) => router.push(route);

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

/* ── 快捷入口（扁平简洁） ────────────────── */
.home-shortcuts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.home-shortcuts__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.home-shortcuts__item:hover {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.home-shortcuts__item:hover .home-shortcuts__arrow {
  opacity: 1;
  transform: translateX(0);
}

.home-shortcuts__icon {
  flex: none;
  font-size: 18px;
  color: var(--el-text-color-secondary);
}

.home-shortcuts__label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.home-shortcuts__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.home-shortcuts__arrow {
  flex: none;
  margin-left: auto;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.15s ease, transform 0.15s ease;
}
</style>
