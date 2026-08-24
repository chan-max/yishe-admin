<template>
  <div class="home-dashboard">
    <!-- 1. Endpoint Connection Status -->
    <section class="home-section">
      <div class="section-title-bar">
        <div class="section-title-bar__left">
          <div class="section-title-bar__icon"><Icon icon="lucide:activity" /></div>
          <div>
            <h2 class="section-title-bar__title">{{ t('home.dashboard.connStatus') }}</h2>
            <p class="section-title-bar__desc">{{ t('home.dashboard.connStatusDesc') }}</p>
          </div>
        </div>
        <ElButton plain size="small" :loading="loading" @click="loadEndpointStatus">
          {{ t('home.dashboard.refreshData') }}
        </ElButton>
      </div>

      <div class="conn-grid">
        <div class="conn-card conn-card--client">
          <div class="conn-card__top">
            <span class="conn-card__label">{{ t('home.dashboard.clientOnline') }}</span>
            <div class="conn-card__icon"><Icon icon="lucide:monitor" /></div>
          </div>
          <div class="conn-card__main">
            <div class="conn-card__value" :class="{ 'conn-card__value--offline': stats.clientOnline === 0 }">
              {{ stats.clientOnline }}<span class="conn-card__slash">/</span>{{ stats.clientTotal }}
            </div>
            <span class="conn-card__badge" :class="stats.clientOnline > 0 ? 'conn-card__badge--online' : 'conn-card__badge--offline'">
              {{ stats.clientOnline > 0 ? t('home.dashboard.online') : t('home.dashboard.offline') }}
            </span>
          </div>
        </div>

        <div class="conn-card conn-card--ps">
          <div class="conn-card__top">
            <span class="conn-card__label">{{ t('home.dashboard.psAutomation') }}</span>
            <div class="conn-card__icon"><Icon icon="lucide:palette" /></div>
          </div>
          <div class="conn-card__main">
            <div class="conn-card__value" :class="{ 'conn-card__value--offline': psNodeInfo.online === 0 }">
              {{ psNodeInfo.online }}<span class="conn-card__slash">/</span>{{ psNodeInfo.total }}
            </div>
            <span class="conn-card__badge" :class="psNodeInfo.online > 0 ? 'conn-card__badge--online' : 'conn-card__badge--offline'">
              {{ psNodeInfo.online > 0 ? t('home.dashboard.online') : t('home.dashboard.offline') }}
            </span>
          </div>
        </div>

        <div class="conn-card conn-card--browser">
          <div class="conn-card__top">
            <span class="conn-card__label">{{ t('home.dashboard.browserAutomation') }}</span>
            <div class="conn-card__icon"><Icon icon="lucide:globe" /></div>
          </div>
          <div class="conn-card__main">
            <div class="conn-card__value" :class="{ 'conn-card__value--offline': browserClientInfo.online === 0 }">
              {{ browserClientInfo.online }}<span class="conn-card__slash">/</span>{{ browserClientInfo.total }}
            </div>
            <span class="conn-card__badge" :class="browserClientInfo.online > 0 ? 'conn-card__badge--online' : 'conn-card__badge--offline'">
              {{ browserClientInfo.online > 0 ? t('home.dashboard.online') : t('home.dashboard.offline') }}
            </span>
          </div>
        </div>

        <div class="conn-card conn-card--admin">
          <div class="conn-card__top">
            <span class="conn-card__label">{{ t('home.dashboard.adminService') }}</span>
            <div class="conn-card__icon"><Icon icon="lucide:shield-check" /></div>
          </div>
          <div class="conn-card__main">
            <div class="conn-card__value" :class="{ 'conn-card__value--offline': stats.adminOnline === 0 }">
              {{ stats.adminOnline }}
            </div>
            <span class="conn-card__badge" :class="stats.adminOnline > 0 ? 'conn-card__badge--online' : 'conn-card__badge--offline'">
              {{ stats.adminOnline > 0 ? t('home.dashboard.online') : t('home.dashboard.offline') }}
            </span>
          </div>
        </div>

        <div class="conn-card conn-card--total">
          <div class="conn-card__top">
            <span class="conn-card__label">{{ t('home.dashboard.totalConnections') }}</span>
            <div class="conn-card__icon"><Icon icon="lucide:link-2" /></div>
          </div>
          <div class="conn-card__main">
            <div class="conn-card__value" :class="{ 'conn-card__value--offline': stats.totalConnections === 0 }">
              {{ stats.totalConnections }}
            </div>
            <span class="conn-card__badge" :class="stats.totalConnections > 0 ? 'conn-card__badge--online' : 'conn-card__badge--offline'">
              {{ stats.totalConnections > 0 ? t('home.dashboard.online') : t('home.dashboard.offline') }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. Quick Links -->
    <section class="home-section">
      <div class="section-title-bar">
        <div class="section-title-bar__left">
          <div class="section-title-bar__icon"><Icon icon="lucide:layout-grid" /></div>
          <h2 class="section-title-bar__title">{{ t('home.shortcuts') }}</h2>
        </div>
      </div>

      <nav class="shortcuts-grid">
        <div
          v-for="item in shortcuts"
          :key="item.key"
          class="shortcut-card"
          @click="goTo(item.route)"
        >
          <div class="shortcut-card__icon-box" :class="`shortcut-card__icon-box--${item.theme}`">
            <Icon :icon="item.icon" class="shortcut-card__icon" />
          </div>
          <div class="shortcut-card__content">
            <div class="shortcut-card__title">{{ t(item.title) }}</div>
            <div class="shortcut-card__desc">{{ t(item.description) }}</div>
          </div>
          <div class="shortcut-card__arrow">
            <Icon icon="lucide:arrow-up-right" />
          </div>
        </div>
      </nav>
    </section>

    <!-- 3. Image Library New Images Statistic -->
    <section class="home-section">
      <div class="section-title-bar">
        <div class="section-title-bar__left">
          <div class="section-title-bar__icon"><Icon icon="lucide:images" /></div>
          <div>
            <h2 class="section-title-bar__title">{{ t('home.dashboard.galleryStats') }}</h2>
            <p class="section-title-bar__desc">{{ t('home.dashboard.galleryStatsDesc') }}</p>
          </div>
        </div>
        <div class="section-title-bar__right">
          <div class="gallery-summary">
            <span class="gallery-summary__item">
              {{ t('home.dashboard.todayCreated') }}: <strong>{{ galleryModule.today.created }}</strong>
            </span>
            <span class="gallery-summary__item">
              {{ t('home.dashboard.periodCreated', { days: statsDays }) }}: <strong>{{ galleryModule.period.created }}</strong>
            </span>
          </div>
          <ElRadioGroup v-model="statsDays" size="small" @change="loadGalleryStats">
            <ElRadioButton :value="7">{{ t('home.dashboard.last7Days') }}</ElRadioButton>
            <ElRadioButton :value="30">{{ t('home.dashboard.last30Days') }}</ElRadioButton>
          </ElRadioGroup>
        </div>
      </div>

      <div class="gallery-card">
        <Echart :options="galleryChartOptions" height="260px" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { Echart } from "@/components/Echart";
import type { EChartsOption } from "echarts";
import { getDashboardStatsApi, type DashboardStats } from "@/api/dashboard";
import { getModuleStatisticsApi } from "@/api/statistics";
import { getMyPsAutomationStatus, type PsAutomationStatusVO } from "@/api/system/websocket";
import {
  getBrowserAutomationClients,
  type BrowserAutomationClientVO,
} from "@/api/external/browserAutomation";
import { useAppStore } from "@/store/modules/app";

defineOptions({ name: "HomeIndex" });

const { t } = useI18n();
const router = useRouter();
const appStore = useAppStore();
const { isDark } = storeToRefs(appStore);
const goTo = (route: string) => router.push(route);

// ── 1. Quick Links (Real Routes) ────────────────────────────────
interface ShortcutItem {
  key: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  theme: "blue" | "emerald" | "violet" | "amber" | "rose" | "indigo" | "cyan" | "orange";
}

const shortcuts: ShortcutItem[] = [
  {
    key: "tools",
    title: "home.shortcut.tools.title",
    description: "home.shortcut.tools.desc",
    route: "/home/tools/index",
    icon: "lucide:download-cloud",
    theme: "blue",
  },
  {
    key: "toolkit",
    title: "home.shortcut.toolkit.title",
    description: "home.shortcut.toolkit.desc",
    route: "/operation/toolkit",
    icon: "lucide:box",
    theme: "emerald",
  },
  {
    key: "browser-automation",
    title: "home.shortcut.browserAutomation.title",
    description: "home.shortcut.browserAutomation.desc",
    route: "/external/browser-automation",
    icon: "lucide:globe",
    theme: "violet",
  },
  {
    key: "queue",
    title: "home.shortcut.queue.title",
    description: "home.shortcut.queue.desc",
    route: "/product-publish/queue",
    icon: "lucide:list-todo",
    theme: "amber",
  },
  {
    key: "psd-set",
    title: "home.shortcut.psdSet.title",
    description: "home.shortcut.psdSet.desc",
    route: "/product-publish/psd-set",
    icon: "lucide:palette",
    theme: "rose",
  },
  {
    key: "ai-api-key",
    title: "home.shortcut.aiApiKey.title",
    description: "home.shortcut.aiApiKey.desc",
    route: "/system/ai-api-key",
    icon: "lucide:key",
    theme: "indigo",
  },
  {
    key: "statistics",
    title: "home.shortcut.statistics.title",
    description: "home.shortcut.statistics.desc",
    route: "/home/statistics",
    icon: "lucide:bar-chart-3",
    theme: "cyan",
  },
  {
    key: "hot-search",
    title: "home.shortcut.hotSearch.title",
    description: "home.shortcut.hotSearch.desc",
    route: "/home/hot-search",
    icon: "lucide:flame",
    theme: "orange",
  },
];

// ── 2. Endpoint Connection Status (Real) ────────────────────────
const loading = ref(false);
const stats = ref<DashboardStats>({
  clientOnline: 0,
  clientTotal: 0,
  designToolOnline: 0,
  designToolTotal: 0,
  pluginOnline: 0,
  pluginTotal: 0,
  adminOnline: 0,
  totalConnections: 0,
  psOnline: 0,
  browserOnline: 0,
  clientsWithPsAutomation: 0,
  clientsWithBrowserAutomation: 0,
});

const psNodes = ref<PsAutomationStatusVO[]>([]);
const browserClients = ref<BrowserAutomationClientVO[]>([]);

const psNodeInfo = computed(() => {
  const total = psNodes.value.length;
  const online = psNodes.value.filter(
    (node) => node.isOnline !== false && node.psAutomation?.enabled === true,
  ).length;
  return { online, total };
});

const browserClientInfo = computed(() => {
  const total = browserClients.value.length;
  const online = browserClients.value.filter((client) => client.isOnline === true).length;
  return { online, total };
});

// ── 3. Gallery (sticker) New Images Statistic (Real) ────────────
type GalleryModule = {
  label: string;
  total: number;
  today: { created: number; updated: number };
  period: { days: number; created: number; updated: number };
  series: Array<{ date: string; created: number; updated: number }>;
};

const statsDays = ref<7 | 30>(7);
const galleryModule = ref<GalleryModule>({
  label: "",
  total: 0,
  today: { created: 0, updated: 0 },
  period: { days: 7, created: 0, updated: 0 },
  series: [],
});

const galleryChartOptions = computed<EChartsOption>(() => {
  const series = galleryModule.value.series || [];
  const dates = series.map((p) => String(p.date || "").slice(5));
  const createdData = series.map((p) => p.created || 0);

  // 根据主题使用不同颜色
  const textColor = isDark.value ? "#94a3b8" : "#64748b";
  const tooltipBg = isDark.value ? "#1e293b" : "#ffffff";
  const splitLineColor = isDark.value ? "#334155" : "#e2e8f0";
  const itemBorderColor = isDark.value ? "#1e293b" : "#ffffff";

  return {
    tooltip: {
      trigger: "axis",
      backgroundColor: tooltipBg,
      borderColor: splitLineColor,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: textColor, fontSize: 12 },
      extraCssText: "box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12); border-radius: 8px;",
      axisPointer: {
        type: "line",
        lineStyle: { color: "rgba(99, 102, 241, 0.35)", type: "dashed", width: 1.5 },
      },
    },
    grid: {
      left: "1%",
      right: "2%",
      top: "10%",
      bottom: "2%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: dates,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 11, margin: 12 },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      splitLine: { lineStyle: { color: splitLineColor, type: "dashed" } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 11 },
    },
    series: [
      {
        name: t("home.dashboard.todayCreated"),
        type: "line",
        smooth: 0.35,
        showSymbol: false,
        symbol: "circle",
        symbolSize: 6,
        itemStyle: {
          color: "#6366F1",
          borderColor: itemBorderColor,
          borderWidth: 2,
        },
        lineStyle: {
          width: 2.5,
          color: "#6366F1",
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(99, 102, 241, 0.24)" },
              { offset: 1, color: "rgba(99, 102, 241, 0.01)" },
            ],
          },
        },
        data: createdData,
      },
    ],
  };
});

// ── 4. Real Data Loading ────────────────────────────────────────
const loadEndpointStatus = async () => {
  loading.value = true;
  try {
    const results = await Promise.allSettled([
      getDashboardStatsApi(),
      getMyPsAutomationStatus(),
      getBrowserAutomationClients(),
    ]);

    const [statsRes, psRes, browserRes] = results;

    if (statsRes.status === "fulfilled") stats.value = statsRes.value;
    if (psRes.status === "fulfilled") {
      psNodes.value = Array.isArray(psRes.value) ? psRes.value : [];
    }
    if (browserRes.status === "fulfilled") {
      browserClients.value = Array.isArray(browserRes.value) ? browserRes.value : [];
    }
  } finally {
    loading.value = false;
  }
};

const loadGalleryStats = async () => {
  const res = (await getModuleStatisticsApi(statsDays.value)) as any;
  const payload = res?.data && res.data.modules ? res.data : res;
  const modules = Array.isArray(payload?.modules) ? payload.modules : [];
  const sticker = modules.find((m: any) => m?.key === "sticker") || modules[0];
  if (!sticker) return;
  galleryModule.value = {
    label: String(sticker.label || ""),
    total: Number(sticker.total || 0),
    today: {
      created: Number(sticker.today?.created || 0),
      updated: Number(sticker.today?.updated || 0),
    },
    period: {
      days: Number(sticker.period?.days || statsDays.value),
      created: Number(sticker.period?.created || 0),
      updated: Number(sticker.period?.updated || 0),
    },
    series: Array.isArray(sticker.series) ? sticker.series : [],
  };
};

const loadDashboardData = async () => {
  await Promise.allSettled([loadEndpointStatus(), loadGalleryStats()]);
};

let refreshTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  loadDashboardData();
  refreshTimer = setInterval(loadEndpointStatus, 15000);
});

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});
</script>

<style scoped lang="scss">
.home-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 0 28px;
}

/* ── Section Title Bar ───────────────────────────────── */
.section-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;

  &__left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    font-size: 16px;
    color: var(--el-text-color-secondary);
    background: color-mix(in srgb, var(--el-text-color-secondary) 8%, transparent);
    border-radius: 8px;
    flex-shrink: 0;
    transition:
      background-color 0.18s ease,
      color 0.18s ease;
  }

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__desc {
    margin: 2px 0 0;
    font-size: 11.5px;
    color: var(--el-text-color-secondary);
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
}

/* ── 1. Connection Status Cards ───────────────────────── */
.conn-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.conn-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-radius: 12px;
  box-shadow: 0 2px 10px -4px rgba(0, 0, 0, 0.03);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: color-mix(
      in srgb,
      var(--el-color-primary) 32%,
      var(--app-content-border-color)
    );
    box-shadow: 0 8px 20px -6px color-mix(in srgb, var(--el-text-color) 10%, transparent);
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__label {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    font-size: 14px;
    border-radius: 7px;
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
    background: color-mix(in srgb, var(--el-text-color-secondary) 8%, transparent);
    transition:
      background-color 0.18s ease,
      color 0.18s ease;
  }

  &__main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__value {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--el-text-color-primary);
    line-height: 1;

    &--offline {
      color: var(--el-text-color-placeholder);
    }
  }

  &__slash {
    margin: 0 2px;
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-placeholder);
  }

  &__badge {
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 4px;
    border: 1px solid transparent;

    &--online {
      color: var(--ep-cover-feedback-success-text);
      background: var(--ep-cover-feedback-success-bg);
      border-color: var(--ep-cover-feedback-success-border);
    }

    &--offline {
      color: var(--ep-cover-feedback-error-text);
      background: var(--ep-cover-feedback-error-bg);
      border-color: var(--ep-cover-feedback-error-border);
    }
  }

  &:hover .conn-card__icon {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  }
}

/* ── 2. Shortcuts Grid ────────────────────────────────── */
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.shortcut-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-radius: 10px;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: color-mix(
      in srgb,
      var(--el-color-primary) 32%,
      var(--app-content-border-color)
    );
    background: color-mix(in srgb, var(--el-color-primary) 5%, var(--app-content-surface-color));
    box-shadow: 0 6px 16px -6px color-mix(in srgb, var(--el-text-color) 9%, transparent);

    .shortcut-card__icon-box {
      color: var(--el-color-primary);
      background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    }

    .shortcut-card__arrow {
      opacity: 1;
      transform: translate(1px, -1px);
      color: var(--el-color-primary);
    }
  }

  &__icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 9px;
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
    background: color-mix(in srgb, var(--el-text-color-secondary) 8%, transparent);
    transition:
      background-color 0.18s ease,
      color 0.18s ease;
  }

  &__icon {
    font-size: 18px;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__desc {
    margin-top: 2px;
    font-size: 11.5px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__arrow {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    opacity: 0.4;
    transition: all 0.18s ease;
  }
}

/* ── 3. Gallery Statistic ─────────────────────────────── */
.gallery-summary {
  display: flex;
  align-items: center;
  gap: 14px;

  &__item {
    font-size: 12px;
    color: var(--el-text-color-secondary);

    strong {
      color: var(--el-text-color-primary);
      font-size: 13px;
    }
  }
}

.gallery-card {
  padding: 8px 4px 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

:global(.dark) .gallery-card {
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color);
}
</style>