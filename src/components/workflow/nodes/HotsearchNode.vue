<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { weiboIcon, douyinIcon, bilibiliIcon, zhihuIcon, toutiaoIcon, doubanIcon, kuaishouIcon, v2exIcon, thirtySixKrIcon } from '@/assets/icons/apps'

const props = defineProps<{ data: { label?: string; config?: any; platform?: string } }>()

const platformConfig: Record<string, { name: string; color: string; icon?: string }> = {
  weibo: { name: '微博', color: '#e6162d', icon: weiboIcon },
  douyin: { name: '抖音', color: '#000000', icon: douyinIcon },
  bilibili: { name: 'B站', color: '#00a1d6', icon: bilibiliIcon },
  zhihu: { name: '知乎', color: '#0084ff', icon: zhihuIcon },
  toutiao: { name: '头条', color: '#f5222d', icon: toutiaoIcon },
  douban: { name: '豆瓣', color: '#007722', icon: doubanIcon },
  kuaishou: { name: '快手', color: '#ff6600', icon: kuaishouIcon },
  v2ex: { name: 'V2EX', color: '#2b2b2b', icon: v2exIcon },
  '36kr': { name: '36氪', color: '#0052d9', icon: thirtySixKrIcon },
  ithome: { name: 'IT之家', color: '#c8102e' },
}

const platform = props.data?.platform || 'weibo'
const config = platformConfig[platform] || { name: platform, color: '#64748b' }
</script>

<template>
  <div class="wf-node wf-node--hotsearch" :style="{ borderColor: config.color + '40' }">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img v-if="config.icon" :src="config.icon" class="wf-node__icon" />
      <span v-else class="wf-node__text" :style="{ color: config.color }">{{ config.name }}</span>
      <span class="wf-node__title">{{ data.label || config.name + '热搜' }}</span>
    </div>
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
