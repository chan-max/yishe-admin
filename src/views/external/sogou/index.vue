<template>
  <ImageEngineCollectView
    pluginKey="sogou"
    title="搜狗图片 控制台"
    eyebrow="搜狗图片 (海量中文配图与表情包)"
    placeholder="例如: 极简插画, 唯美风景, 表情包, 萌宠..."
    accentColor="#FB6022"
  />
</template>

<script setup lang="ts">
import ImageEngineCollectView from '../components/ImageEngineCollectView.vue'

defineOptions({ name: 'ExternalSogou' })
</script>
