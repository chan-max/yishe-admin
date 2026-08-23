<template>
  <ImageEngineCollectView
    pluginKey="so"
    title="360 图片 控制台"
    eyebrow="360 图片 (海量国内设计配图与海报背景)"
    placeholder="例如: 海报背景, 唯美风景, 简约, 插画..."
    accentColor="#1DA362"
  />
</template>

<script setup lang="ts">
import ImageEngineCollectView from '../components/ImageEngineCollectView.vue'

defineOptions({ name: 'ExternalSo' })
</script>
