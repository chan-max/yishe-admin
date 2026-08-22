<script setup lang="ts">
import { computed } from "vue";
import NodeParameterSummary from "./NodeParameterSummary.vue";
import { Handle, Position } from "@vue-flow/core";
import {
  weiboIcon,
  douyinIcon,
  bilibiliIcon,
  zhihuIcon,
  toutiaoIcon,
  doubanIcon,
  kuaishouIcon,
  v2exIcon,
  thirtySixKrIcon,
  ithomeIcon,
  xiaohongshuIcon,
} from "@/assets/icons/apps";

const props = defineProps<{
  id?: string;
  type?: string;
  data: { label?: string; config?: any; platform?: string; type?: string; name?: string };
}>();

const platformConfig: Record<string, { name: string; color: string; icon?: string }> = {
  weibo: { name: "微博", color: "#e6162d", icon: weiboIcon },
  douyin: { name: "抖音", color: "#000000", icon: douyinIcon },
  bilibili: { name: "B站", color: "#00a1d6", icon: bilibiliIcon },
  zhihu: { name: "知乎", color: "#0084ff", icon: zhihuIcon },
  toutiao: { name: "头条", color: "#f5222d", icon: toutiaoIcon },
  douban: { name: "豆瓣", color: "#007722", icon: doubanIcon },
  kuaishou: { name: "快手", color: "#ff6600", icon: kuaishouIcon },
  v2ex: { name: "V2EX", color: "#2b2b2b", icon: v2exIcon },
  "36kr": { name: "36氪", color: "#0052d9", icon: thirtySixKrIcon },
  ithome: { name: "IT之家", color: "#c8102e", icon: ithomeIcon },
  xiaohongshu: { name: "小红书", color: "#ff2442", icon: xiaohongshuIcon },
  xiaohongshu_note_detail: { name: "小红书", color: "#ff2442", icon: xiaohongshuIcon },
  baidu: { name: "百度", color: "#2932e1" },
  tencent_news: { name: "腾讯新闻", color: "#0052d9" },
  tencent_tech: { name: "腾讯科技", color: "#0052d9" },
  google_trends: { name: "Google", color: "#4285f4" },
  hackernews: { name: "HN", color: "#ff6600" },
  github: { name: "GitHub", color: "#24292e" },
  wikipedia: { name: "维基", color: "#636466" },
  bbc_news: { name: "BBC", color: "#bb1919" },
  cnn: { name: "CNN", color: "#cc0000" },
  nytimes: { name: "NYT", color: "#000000" },
  aljazeera: { name: "半岛", color: "#fa6400" },
  devto: { name: "Dev.to", color: "#0a0a0a" },
  lobsters: { name: "Lobsters", color: "#ac1917" },
  ebay_trending: { name: "eBay", color: "#e53238" },
  shopify_trending: { name: "Shopify", color: "#96bf48" },
};

const platformKey = computed(() => {
  if (props.data?.platform) return props.data.platform;
  if (props.data?.config?.platform) return props.data.config.platform;
  const rawType = props.type || props.data?.type || "";
  if (rawType.startsWith("hotsearch_")) {
    return rawType.replace(/^hotsearch_/, "");
  }
  if (rawType === "xiaohongshu_note_detail") return "xiaohongshu";
  return rawType || "weibo";
});

const config = computed(() => platformConfig[platformKey.value] || { name: platformKey.value, color: "#64748b" });
</script>

<template>
  <div class="wf-node wf-node--hotsearch" :style="{ borderColor: config.color + '40' }">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img v-if="config.icon" :src="config.icon" class="wf-node__icon" />
      <span v-else class="wf-node__text" :style="{ color: config.color }">{{ config.name }}</span>
      <span class="wf-node__title">{{ data.label || config.name + "热搜" }}</span>
    </div>
    <NodeParameterSummary :data="data" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--hotsearch {
  min-width: 100px;
  padding: 4px 8px;
  background: var(--app-content-surface-color);
  border: 1px solid;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: all 0.15s ease;
}

.wf-node--hotsearch:hover,
.wf-node--hotsearch.selected {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.wf-node__header {
  display: flex;
  align-items: center;
  gap: 4px;
}

.wf-node__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.wf-node__text {
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  flex-shrink: 0;
}

.wf-node__title {
  font-size: 11px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
</style>
