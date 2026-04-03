<template>
  <div class="tools-page">
    <section class="tools-hero">
      <div class="tools-hero__content">
        <div class="tools-hero__title">工具</div>
        <div class="tools-hero__desc">
          将客户端下载与常用工具入口集中管理，后续只需要调整页面常量即可维护下载地址。
        </div>
      </div>
    </section>

    <section class="tools-section">
      <div class="tools-section__head">
        <div class="tools-section__title">客户端下载</div>
        <div class="tools-section__desc">暂未配置的下载项会保持禁用，补充链接后即可直接启用。</div>
      </div>

      <div class="tools-grid tools-grid--downloads">
        <div v-for="item in downloadCards" :key="item.key" class="tools-card tools-download-card">
          <div class="tools-download-card__head">
            <span class="tools-download-card__icon">
              <Icon :icon="item.icon" />
            </span>
            <el-tag size="small" effect="plain" :type="item.downloadUrl ? 'success' : 'info'">
              {{ item.downloadUrl ? "可下载" : "待配置" }}
            </el-tag>
          </div>

          <div class="tools-download-card__title">{{ item.title }}</div>
          <div class="tools-download-card__platform">{{ item.platform }}</div>
          <div class="tools-download-card__desc">{{ item.description }}</div>

          <div class="tools-download-card__actions">
            <el-button
              type="primary"
              :disabled="!item.downloadUrl"
              @click="handleDownload(item.downloadUrl)"
            >
              {{ item.actionText }}
            </el-button>
            <span class="tools-download-card__hint">
              {{ item.downloadUrl ? "点击后新窗口打开下载地址" : "下载链接待补充" }}
            </span>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { Icon } from "@/components/Icon";

defineOptions({ name: "ToolsIndex" });

interface DownloadCard {
  key: string;
  title: string;
  platform: string;
  description: string;
  actionText: string;
  downloadUrl: string;
  icon: string;
}

const downloadCards: DownloadCard[] = [
  {
    key: "client-windows",
    title: "客户端",
    platform: "Windows",
    description: "负责与服务端建立长连接，并桥接浏览器自动化与桌面能力。",
    actionText: "下载 Windows 客户端",
    downloadUrl: "https://github.com/1s-design/yishe-client/releases/latest/download/yishe-client.exe",
    icon: "ep:monitor",
  },
  {
    key: "client-macos",
    title: "客户端",
    platform: "macOS",
    description: "负责与服务端建立长连接，并桥接浏览器自动化与桌面能力。",
    actionText: "下载 macOS 客户端",
    downloadUrl: "https://github.com/1s-design/yishe-client/releases/latest/download/yishe-client.dmg",
    icon: "mdi:apple",
  },
  {
    key: "ps-automation",
    title: "PS 自动化端",
    platform: "Windows",
    description: "负责 Photoshop 桥接能力与相关自动化任务执行。",
    actionText: "下载 PS 端",
    downloadUrl: "https://github.com/1s-design/yishe-ps/releases/latest/download/yishe-ps-windows.exe",
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

function handleDownload(downloadUrl: string) {
  if (!downloadUrl) return;
  window.open(downloadUrl, "_blank", "noopener");
}
</script>

<style scoped lang="scss">
.tools-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px 0 16px;
}

.tools-hero,
.tools-card {
  border: 1px solid color-mix(in srgb, var(--el-border-color) 54%, transparent 46%);
  border-radius: 22px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, transparent 4%);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
}

.tools-hero {
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 32%),
    radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.06), transparent 28%),
    color-mix(in srgb, var(--el-bg-color) 97%, transparent 3%);
}

.tools-hero__title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.15;
}

.tools-hero__desc {
  margin-top: 10px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.75;
  max-width: 760px;
}

.tools-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tools-section__title {
  font-size: 17px;
  font-weight: 700;
}

.tools-section__desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.tools-grid {
  display: grid;
  gap: 14px;
}

.tools-grid--downloads {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.tools-download-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
}

.tools-download-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tools-download-card__icon {
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

.tools-download-card__title {
  font-size: 16px;
  font-weight: 700;
}

.tools-download-card__platform {
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
}

.tools-download-card__desc {
  min-height: 66px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.75;
}

.tools-download-card__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-top: auto;
}

.tools-download-card__actions :deep(.el-button) {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 14px;
}

.tools-download-card__hint {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

@media (max-width: 1180px) {
  .tools-grid--downloads {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .tools-page {
    gap: 16px;
  }

  .tools-hero,
  .tools-card {
    border-radius: 18px;
  }

  .tools-hero {
    padding: 18px;
  }

  .tools-hero__title {
    font-size: 24px;
  }

  .tools-grid--downloads {
    grid-template-columns: 1fr;
  }
}
</style>
