<template>
  <ImageEngineCollectView
    pluginKey="wallhaven"
    title="Wallhaven 4K/8K壁纸 控制台"
    eyebrow="Wallhaven (2K/4K/8K 顶级壁纸与插画)"
    placeholder="例如: cyberpunk, anime, landscape, abstract, fantasy..."
    accentColor="#49A9C8"
  />
</template>

<script setup lang="ts">
import ImageEngineCollectView from '../components/ImageEngineCollectView.vue'

defineOptions({ name: 'ExternalWallhaven' })
</script>
