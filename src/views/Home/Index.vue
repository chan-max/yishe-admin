<template>
  <div class="home-dashboard" v-loading="loading">
    <section class="home-panel home-hero">
      <div class="home-hero__content">
        <div class="home-hero__eyebrow">统一操作入口</div>
        <div class="home-hero__title">工作台</div>
        <div class="home-hero__desc">
          将客户端下载、节点状态和核心操作入口集中到首页，方便在 iPad 与桌面端快速进入对应模块。
        </div>
      </div>

      <div class="home-hero__actions">
        <el-button type="primary" @click="goTo('/external/browser-automation')">
          浏览器自动化
        </el-button>
        <el-button @click="goTo('/product/queue')">任务中心</el-button>
        <el-button @click="goTo('/system/ai-api-key')">AI API Key</el-button>
      </div>
    </section>

    <section class="home-section">
      <div class="home-section__head">
        <div>
          <div class="home-section__title">节点概览</div>
          <div class="home-section__desc">首页直接查看客户端、PS 与浏览器自动化的当前状态。</div>
        </div>
      </div>

      <div class="home-grid home-grid--status">
        <button
          v-for="card in statusCards"
          :key="card.key"
          type="button"
          class="home-panel home-status-card"
          :class="`is-${card.tone}`"
          @click="goTo(card.route)"
        >
          <div class="home-status-card__head">
            <span class="home-status-card__icon">
              <Icon :icon="card.icon" />
            </span>
            <span class="home-status-card__badge">{{ card.statusText }}</span>
          </div>
          <div class="home-status-card__value">{{ card.value }}</div>
          <div class="home-status-card__title">{{ card.title }}</div>
          <div class="home-status-card__meta">{{ card.meta }}</div>
          <div class="home-status-card__hint">{{ card.hint }}</div>
        </button>
      </div>
    </section>

    <MyRuntimeConnections />

    <section class="home-section">
      <div class="home-section__head">
        <div>
          <div class="home-section__title">客户端下载</div>
          <div class="home-section__desc">
            下载链接暂时留空，后续只需要修改页面配置常量即可启用。
          </div>
        </div>
      </div>

      <div class="home-grid home-grid--downloads">
        <div v-for="item in downloadCards" :key="item.key" class="home-panel home-download-card">
          <div class="home-download-card__head">
            <span class="home-download-card__icon">
              <Icon :icon="item.icon" />
            </span>
            <el-tag size="small" effect="plain" :type="item.downloadUrl ? 'success' : 'info'">
              {{ item.downloadUrl ? "可下载" : "待配置" }}
            </el-tag>
          </div>

          <div class="home-download-card__title">{{ item.title }}</div>
          <div class="home-download-card__platform">{{ item.platform }}</div>
          <div class="home-download-card__desc">{{ item.description }}</div>

          <div class="home-download-card__actions">
            <el-button
              type="primary"
              :disabled="!item.downloadUrl"
              @click="handleDownload(item.downloadUrl)"
            >
              {{ item.actionText }}
            </el-button>
            <span class="home-download-card__hint">
              {{ item.downloadUrl ? "点击后新窗口打开下载地址" : "下载链接待补充" }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <section class="home-section">
      <div class="home-section__head">
        <div>
          <div class="home-section__title">快捷入口</div>
          <div class="home-section__desc">保留 admin 端集中操作思路，常用模块从这里直接进入。</div>
        </div>
      </div>

      <div class="home-grid home-grid--shortcuts">
        <button
          v-for="item in shortcuts"
          :key="item.key"
          type="button"
          class="home-panel home-shortcut"
          @click="goTo(item.route)"
        >
          <span class="home-shortcut__icon">
            <Icon :icon="item.icon" />
          </span>
          <div class="home-shortcut__content">
            <div class="home-shortcut__title">{{ item.title }}</div>
            <div class="home-shortcut__desc">{{ item.description }}</div>
          </div>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@/components/Icon";
import MyRuntimeConnections from "./components/MyRuntimeConnections.vue";
import { getClientServiceRuntime, useClientNodeStoreRefs } from "@/store/modules/clientNode";
import {
  isClientServiceNodeAvailable,
  type ClientServiceSummary,
} from "@/services/clientServiceRuntime";

defineOptions({ name: "HomeIndex" });

interface DownloadCard {
  key: string;
  title: string;
  platform: string;
  description: string;
  actionText: string;
  downloadUrl: string;
  icon: string;
}

interface ShortcutItem {
  key: string;
  title: string;
  description: string;
  route: string;
  icon: string;
}

const router = useRouter();
const { store, clients, onlineClients, loading, pluginStatusMap } = useClientNodeStoreRefs();

// 下载链接后续只需要在这里补充即可，不需要改模板结构。
const downloadCards: DownloadCard[] = [
  {
    key: "client",
    title: "客户端",
    platform: "Windows / macOS",
    description: "负责与服务端建立长连接，并桥接浏览器自动化与桌面能力。",
    actionText: "下载客户端",
    downloadUrl: "",
    icon: "ep:monitor",
  },
  {
    key: "ps-automation",
    title: "PS 自动化端",
    platform: "Windows",
    description: "负责 Photoshop 桥接能力与相关自动化任务执行。",
    actionText: "下载 PS 端",
    downloadUrl: "",
    icon: "ep:set-up",
  },
  {
    key: "browser-automation",
    title: "浏览器自动化端",
    platform: "Windows",
    description: "作为独立服务承接浏览器自动化执行，与客户端保持清晰解耦。",
    actionText: "下载自动化端",
    downloadUrl: "",
    icon: "ep:connection",
  },
];

const shortcuts: ShortcutItem[] = [
  {
    key: "browser-automation",
    title: "浏览器自动化控制台",
    description: "查看节点状态、连接控制和调试入口。",
    route: "/external/browser-automation",
    icon: "ep:connection",
  },
  {
    key: "queue",
    title: "任务中心",
    description: "查看发布任务、实时运行状态和执行日志。",
    route: "/product/queue",
    icon: "ep:data-analysis",
  },
  {
    key: "psd-set",
    title: "套图制作",
    description: "继续处理 PS 相关能力与自动制作流程。",
    route: "/product/psd-set",
    icon: "ep:picture",
  },
  {
    key: "ai-api-key",
    title: "AI API Key",
    description: "录入与维护平台密钥信息，便于后续接入使用。",
    route: "/system/ai-api-key",
    icon: "ep:key",
  },
];

const browserAutomationClients = computed(() =>
  store.getPluginClients("browser-automation", { includeOffline: true }),
);
const psAutomationClients = computed(() =>
  store.getPluginClients("ps-automation", { includeOffline: true }),
);
const googleArtClients = computed(() =>
  store.getPluginClients("google-art", { includeOffline: true }),
);

const browserAutomationAvailableCount = computed(
  () =>
    browserAutomationClients.value.filter((client) =>
      isClientServiceNodeAvailable(client, getClientServiceRuntime(client, "browser-automation")),
    ).length,
);

const psAutomationEnabledCount = computed(
  () =>
    psAutomationClients.value.filter((client) =>
      isClientServiceNodeAvailable(client, getClientServiceRuntime(client, "ps-automation")),
    ).length,
);

const psAutomationRunningCount = computed(
  () =>
    clients.value.filter((client) => {
      if (!client?.isOnline) {
        return false;
      }

      const psAutomation = client.clientInfo?.psAutomation || {};
      return !!(
        psAutomation.running ||
        psAutomation.currentPsSetId ||
        psAutomation.currentPsSetName
      );
    }).length,
);

const googleArtAvailableCount = computed(
  () =>
    googleArtClients.value.filter((client) =>
      isClientServiceNodeAvailable(client, getClientServiceRuntime(client, "google-art")),
    ).length,
);

const summaryTextMap: Record<ClientServiceSummary, string> = {
  available: "可用",
  degraded: "受限",
  offline: "离线",
};

const statusCards = computed(() => [
  {
    key: "clients",
    title: "客户端节点",
    value: `${onlineClients.value.length}/${clients.value.length}`,
    meta: "在线 / 总数",
    hint:
      onlineClients.value.length > 0
        ? "当前至少有一个在线客户端，可以继续进行节点调度。"
        : "当前没有在线客户端，请先确认桌面端是否已启动并连接。",
    tone: onlineClients.value.length > 0 ? "available" : "offline",
    statusText: onlineClients.value.length > 0 ? "在线中" : "未连接",
    route: "/external/browser-automation",
    icon: "ep:monitor",
  },
  {
    key: "browser-automation",
    title: "浏览器自动化",
    value: `${browserAutomationAvailableCount.value}/${browserAutomationClients.value.length}`,
    meta: "可执行节点 / 总节点",
    hint: `状态 ${summaryTextMap[pluginStatusMap.value["browser-automation"]] || "离线"}，当前可执行 ${browserAutomationAvailableCount.value} 个节点。`,
    tone: resolveClientServiceSummaryState("browser-automation"),
    statusText: summaryTextMap[resolveClientServiceSummaryState("browser-automation")],
    route: "/external/browser-automation",
    icon: "ep:connection",
  },
  {
    key: "ps-automation",
    title: "PS 自动化",
    value: `${psAutomationEnabledCount.value}/${psAutomationClients.value.length}`,
    meta: `可调用节点 / 总节点 · 执行中 ${psAutomationRunningCount.value}`,
    hint:
      psAutomationRunningCount.value > 0
        ? `当前有 ${psAutomationRunningCount.value} 个 PS 任务正在执行。`
        : "当前没有进行中的 PS 任务。",
    tone: resolveClientServiceSummaryState("ps-automation"),
    statusText: summaryTextMap[resolveClientServiceSummaryState("ps-automation")],
    route: "/external/ps-automation",
    icon: "ep:set-up",
  },
  {
    key: "google-art",
    title: "Google Art",
    value: `${googleArtAvailableCount.value}/${googleArtClients.value.length}`,
    meta: "可用节点 / 总节点",
    hint: `状态 ${summaryTextMap[pluginStatusMap.value["google-art"]] || "离线"}，当前可用 ${googleArtAvailableCount.value} 个节点。`,
    tone: resolveClientServiceSummaryState("google-art"),
    statusText: summaryTextMap[resolveClientServiceSummaryState("google-art")],
    route: "/external/google-art",
    icon: "ep:picture-filled",
  },
]);

function resolveClientServiceSummaryState(
  key: "browser-automation" | "ps-automation" | "google-art",
): ClientServiceSummary {
  return pluginStatusMap.value[key] || "offline";
}

function goTo(route: string) {
  router.push(route);
}

function handleDownload(downloadUrl: string) {
  if (!downloadUrl) {
    return;
  }

  window.open(downloadUrl, "_blank", "noopener");
}

onMounted(() => {
  void store.refresh();
});
</script>

<style scoped lang="scss">
.home-dashboard {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px 0 16px;
}

.home-panel {
  border: 1px solid color-mix(in srgb, var(--el-border-color) 54%, transparent 46%);
  border-radius: 22px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, transparent 4%);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
}

.home-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 32%),
    radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.06), transparent 28%),
    color-mix(in srgb, var(--el-bg-color) 97%, transparent 3%);
}

.home-hero__content {
  max-width: 760px;
}

.home-hero__eyebrow {
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.home-hero__title {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.15;
}

.home-hero__desc {
  margin-top: 10px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.75;
}

.home-hero__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.home-hero__actions :deep(.el-button) {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 14px;
}

.home-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.home-section__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.home-section__title {
  font-size: 17px;
  font-weight: 700;
}

.home-section__desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.home-grid {
  display: grid;
  gap: 14px;
}

.home-grid--status {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.home-grid--downloads {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.home-grid--shortcuts {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.home-status-card,
.home-shortcut {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  outline: none;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.home-status-card {
  padding: 18px;
}

.home-status-card:hover,
.home-shortcut:hover {
  transform: translateY(-1px);
}

.home-status-card:focus-visible,
.home-shortcut:focus-visible {
  box-shadow:
    0 0 0 3px rgb(59 130 246 / 14%),
    0 10px 28px rgba(15, 23, 42, 0.05);
}

.home-status-card__head,
.home-download-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.home-status-card__icon,
.home-download-card__icon,
.home-shortcut__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-fill-color-light) 78%, transparent 22%);
  color: var(--el-text-color-primary);
  font-size: 18px;
}

.home-status-card__badge {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-fill-color-light) 74%, transparent 26%);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
}

.home-status-card__value {
  margin-top: 18px;
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
}

.home-status-card__title {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 700;
}

.home-status-card__meta {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.home-status-card__hint {
  margin-top: 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.home-status-card.is-available {
  border-color: color-mix(in srgb, var(--el-color-success) 26%, transparent 74%);
}

.home-status-card.is-available .home-status-card__badge {
  background: color-mix(in srgb, var(--el-color-success-light-9) 88%, transparent 12%);
  color: var(--el-color-success);
}

.home-status-card.is-degraded {
  border-color: color-mix(in srgb, var(--el-color-warning) 28%, transparent 72%);
}

.home-status-card.is-degraded .home-status-card__badge {
  background: color-mix(in srgb, var(--el-color-warning-light-9) 88%, transparent 12%);
  color: var(--el-color-warning);
}

.home-status-card.is-offline .home-status-card__badge {
  color: var(--el-text-color-placeholder);
}

.home-download-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
}

.home-download-card__title {
  font-size: 16px;
  font-weight: 700;
}

.home-download-card__platform {
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
}

.home-download-card__desc {
  min-height: 66px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.75;
}

.home-download-card__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-top: auto;
}

.home-download-card__actions :deep(.el-button) {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 14px;
}

.home-download-card__hint {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.home-shortcut {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px;
}

.home-shortcut__content {
  min-width: 0;
}

.home-shortcut__title {
  font-size: 14px;
  font-weight: 700;
}

.home-shortcut__desc {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 1180px) {
  .home-grid--status,
  .home-grid--downloads {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 768px) and (max-width: 1180px) {
  .home-dashboard {
    gap: 20px;
  }

  .home-hero,
  .home-status-card,
  .home-download-card,
  .home-shortcut {
    border-radius: 24px;
  }

  .home-hero {
    padding: 22px;
  }

  .home-hero__title {
    font-size: 30px;
  }

  .home-hero__desc,
  .home-status-card__hint,
  .home-download-card__desc,
  .home-shortcut__desc {
    font-size: 14px;
  }

  .home-status-card__value {
    font-size: 32px;
  }
}

@media (max-width: 767px) {
  .home-dashboard {
    gap: 16px;
  }

  .home-hero,
  .home-status-card,
  .home-download-card,
  .home-shortcut {
    border-radius: 18px;
  }

  .home-hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 18px;
  }

  .home-hero__title {
    font-size: 24px;
  }

  .home-grid--status,
  .home-grid--downloads,
  .home-grid--shortcuts {
    grid-template-columns: 1fr;
  }

  .home-hero__actions {
    width: 100%;
    justify-content: flex-start;
  }

  .home-hero__actions :deep(.el-button) {
    width: 100%;
    margin-left: 0 !important;
  }
}
</style>
