<template>
  <ImageEngineCollectView
    pluginKey="baidu"
    title="百度图片 控制台"
    eyebrow="百度图片 (海量中文与电商配图)"
    placeholder="例如: 现代极简, 国风壁纸, 咖啡, 唯美风景..."
    accentColor="#2932E1"
  />
</template>

<script setup lang="ts">
import ImageEngineCollectView from '../components/ImageEngineCollectView.vue'

defineOptions({ name: 'ExternalBaidu' })
</script>
