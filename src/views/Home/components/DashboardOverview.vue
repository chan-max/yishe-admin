<template>
  <div class="dashboard-overview">
    <!-- Stat Cards Grid -->
    <div class="dashboard-stats-grid">
      <!-- Client Online -->
      <div class="dashboard-stat-card dashboard-stat-card--primary">
        <div class="dashboard-stat-card__icon">
          <Icon icon="ep:monitor" />
        </div>
        <div class="dashboard-stat-card__body">
          <div class="dashboard-stat-card__value">
            <CountTo :duration="1200" :end-val="stats.clientOnline" :start-val="0" />
          </div>
          <div class="dashboard-stat-card__label">{{ t('home.dashboard.clientOnline') }}</div>
          <div class="dashboard-stat-card__meta">
            <span class="dashboard-stat-card__status-dot dashboard-stat-card__status-dot--online"></span>
            {{ t('home.dashboard.online') }} / {{ t('home.dashboard.total') }}: {{ stats.clientTotal }}
          </div>
        </div>
      </div>

      <!-- Design Tool Online -->
      <div class="dashboard-stat-card dashboard-stat-card--success">
        <div class="dashboard-stat-card__icon">
          <Icon icon="ep:edit-pen" />
        </div>
        <div class="dashboard-stat-card__body">
          <div class="dashboard-stat-card__value">
            <CountTo :duration="1200" :end-val="stats.designToolOnline" :start-val="0" />
          </div>
          <div class="dashboard-stat-card__label">{{ t('home.dashboard.designToolOnline') }}</div>
          <div class="dashboard-stat-card__meta">
            <span class="dashboard-stat-card__status-dot dashboard-stat-card__status-dot--online"></span>
            {{ t('home.dashboard.online') }} / {{ t('home.dashboard.total') }}: {{ stats.designToolTotal }}
          </div>
        </div>
      </div>

      <!-- Plugin Online -->
      <div class="dashboard-stat-card dashboard-stat-card--warning">
        <div class="dashboard-stat-card__icon">
          <Icon icon="ep:connection" />
        </div>
        <div class="dashboard-stat-card__body">
          <div class="dashboard-stat-card__value">
            <CountTo :duration="1200" :end-val="stats.pluginOnline" :start-val="0" />
          </div>
          <div class="dashboard-stat-card__label">{{ t('home.dashboard.pluginOnline') }}</div>
          <div class="dashboard-stat-card__meta">
            <span class="dashboard-stat-card__status-dot dashboard-stat-card__status-dot--online"></span>
            {{ t('home.dashboard.active') }} / {{ t('home.dashboard.total') }}: {{ stats.pluginTotal }}
          </div>
        </div>
      </div>

      <!-- Admin Online -->
      <div class="dashboard-stat-card dashboard-stat-card--info">
        <div class="dashboard-stat-card__icon">
          <Icon icon="ep:user-filled" />
        </div>
        <div class="dashboard-stat-card__body">
          <div class="dashboard-stat-card__value">
            <CountTo :duration="1200" :end-val="stats.adminOnline" :start-val="0" />
          </div>
          <div class="dashboard-stat-card__label">{{ t('home.dashboard.adminOnline') }}</div>
          <div class="dashboard-stat-card__meta">
            <span class="dashboard-stat-card__status-dot dashboard-stat-card__status-dot--online"></span>
            {{ t('home.dashboard.activeSessions') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Secondary Stats Row -->
    <div class="dashboard-secondary-grid">
      <!-- PS Automation -->
      <div class="dashboard-secondary-card">
        <div class="dashboard-secondary-card__header">
          <Icon icon="ep:cpu" class="dashboard-secondary-card__icon" />
          <span class="dashboard-secondary-card__title">{{ t('home.dashboard.psAutomation') }}</span>
        </div>
        <div class="dashboard-secondary-card__value">
          <CountTo :duration="1200" :end-val="stats.psOnline" :start-val="0" />
        </div>
        <div class="dashboard-secondary-card__desc">{{ t('home.dashboard.onlinePsEnv') }}</div>
      </div>

      <!-- Browser Automation -->
      <div class="dashboard-secondary-card">
        <div class="dashboard-secondary-card__header">
          <Icon icon="ep:promotion" class="dashboard-secondary-card__icon" />
          <span class="dashboard-secondary-card__title">{{ t('home.dashboard.browserAutomation') }}</span>
        </div>
        <div class="dashboard-secondary-card__value">
          <CountTo :duration="1200" :end-val="stats.browserOnline" :start-val="0" />
        </div>
        <div class="dashboard-secondary-card__desc">{{ t('home.dashboard.onlineBrowserEnv') }}</div>
      </div>

      <!-- Total Connections -->
      <div class="dashboard-secondary-card">
        <div class="dashboard-secondary-card__header">
          <Icon icon="ep:link" class="dashboard-secondary-card__icon" />
          <span class="dashboard-secondary-card__title">{{ t('home.dashboard.totalConnections') }}</span>
        </div>
        <div class="dashboard-secondary-card__value dashboard-secondary-card__value--accent">
          <CountTo :duration="1200" :end-val="stats.totalConnections" :start-val="0" />
        </div>
        <div class="dashboard-secondary-card__desc">{{ t('home.dashboard.activeConnections') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { getDashboardStatsApi, type DashboardStats } from "@/api/dashboard";

defineOptions({ name: "DashboardOverview" });

const { t } = useI18n();

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

let refreshTimer: ReturnType<typeof setInterval> | null = null;

const loadStats = async () => {
  loading.value = true;
  try {
    stats.value = await getDashboardStatsApi();
  } catch {
    // silent fail
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadStats();
  refreshTimer = setInterval(loadStats, 10_000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
});
</script>

<style scoped lang="scss">
.dashboard-overview {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// ── Main Stat Cards Grid ────────────────────────────────
.dashboard-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.dashboard-stat-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-bg-color) 96%, transparent 4%) 0%,
    color-mix(in srgb, var(--el-bg-color) 92%, transparent 8%) 100%
  );
  border: 1px solid color-mix(in srgb, var(--el-border-color) 35%, transparent 65%);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color) 80%);
    box-shadow: 0 8px 24px rgb(15 23 42 / 8%);
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    font-size: 20px;
    border-radius: 12px;
    flex-shrink: 0;
    color: #fff;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__value {
    font-size: 28px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
  }

  &__label {
    margin-top: 4px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;

    &--online {
      background: #10b981;
      box-shadow: 0 0 6px rgb(16 185 129 / 50%);
    }
  }

  &--primary &__icon {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
  }

  &--success &__icon {
    background: linear-gradient(135deg, #10b981, #06b6d4);
  }

  &--warning &__icon {
    background: linear-gradient(135deg, #f59e0b, #ef4444);
  }

  &--info &__icon {
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
  }
}

// ── Secondary Stats Grid ────────────────────────────────
.dashboard-secondary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.dashboard-secondary-card {
  padding: 16px 18px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, transparent 4%);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 35%, transparent 65%);

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color) 80%);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__icon {
    font-size: 16px;
    color: var(--el-text-color-secondary);
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }

  &__value {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;

    &--accent {
      color: var(--el-color-primary);
    }
  }

  &__separator {
    margin: 0 4px;
    font-weight: 400;
    color: var(--el-text-color-placeholder);
  }

  &__total {
    font-weight: 400;
    color: var(--el-text-color-secondary);
  }

  &__desc {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

// ── 暗色模式：用阴影替代边框 ──────────────────────────
html.dark .dashboard-stat-card {
  border: 1px solid transparent;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.06);

  &:hover {
    border-color: transparent;
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.5),
      0 0 0 1px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  }
}

html.dark .dashboard-secondary-card {
  border: 1px solid transparent;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.05);

  &:hover {
    border-color: transparent;
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.4),
      0 0 0 1px color-mix(in srgb, var(--el-color-primary) 25%, transparent);
  }
}

// ── Responsive ──────────────────────────────────────────
@media (width <= 1400px) {
  .dashboard-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-secondary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width <= 767px) {
  .dashboard-stats-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-secondary-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-stat-card {
    padding: 16px;
  }

  .dashboard-stat-card__value {
    font-size: 24px;
  }
}
</style>
