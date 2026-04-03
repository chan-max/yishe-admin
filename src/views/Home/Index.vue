<template>
  <div class="home-dashboard">
    <section class="home-panel home-hero">
      <div class="home-hero__content">
        <div class="home-hero__eyebrow">统一操作入口</div>
        <div class="home-hero__title">工作台</div>
        <div class="home-hero__desc">
          将核心操作入口集中到首页，个人连接状态统一收拢到顶部状态入口，方便在 iPad
          与桌面端快速进入对应模块；客户端下载统一收纳到工具模块中维护。
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

defineOptions({ name: "HomeIndex" });

interface ShortcutItem {
  key: string;
  title: string;
  description: string;
  route: string;
  icon: string;
}

const router = useRouter();

const shortcuts: ShortcutItem[] = [
  {
    key: "tools",
    title: "工具",
    description: "集中查看客户端、PS 端和自动化端下载入口。",
    route: "/home/tools/index",
    icon: "ep:tools",
  },
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

@media (min-width: 768px) and (max-width: 1180px) {
  .home-dashboard {
    gap: 20px;
  }

  .home-hero,
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
  .home-shortcut__desc {
    font-size: 14px;
  }
}

@media (max-width: 767px) {
  .home-dashboard {
    gap: 16px;
  }

  .home-hero,
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
