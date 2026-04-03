<template>
  <div class="home-dashboard">
    <section class="home-panel home-hero">
      <div class="home-hero__content">
        <div class="home-hero__eyebrow">统一操作入口</div>
        <div class="home-hero__title">工作台</div>
        <div class="home-hero__desc">
          将客户端下载和核心操作入口集中到首页，个人连接状态统一收拢到顶部状态入口，方便在 iPad
          与桌面端快速进入对应模块。
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
import { useRouter } from "vue-router";
import { Icon } from "@/components/Icon";

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

function goTo(route: string) {
  router.push(route);
}

function handleDownload(downloadUrl: string) {
  if (!downloadUrl) {
    return;
  }

  window.open(downloadUrl, "_blank", "noopener");
}
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

.home-grid--downloads {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.home-grid--shortcuts {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

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

.home-shortcut:hover {
  transform: translateY(-1px);
}

.home-shortcut:focus-visible {
  box-shadow:
    0 0 0 3px rgb(59 130 246 / 14%),
    0 10px 28px rgba(15, 23, 42, 0.05);
}

.home-download-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

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
  .home-grid--downloads {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 768px) and (max-width: 1180px) {
  .home-dashboard {
    gap: 20px;
  }

  .home-hero,
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
  .home-download-card__desc,
  .home-shortcut__desc {
    font-size: 14px;
  }
}

@media (max-width: 767px) {
  .home-dashboard {
    gap: 16px;
  }

  .home-hero,
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
