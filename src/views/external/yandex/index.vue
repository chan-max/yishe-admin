<template>
  <ImageEngineCollectView
    pluginKey="yandex"
    title="Yandex 图片 控制台"
    eyebrow="Yandex (艺术插画、二次元与欧美无水印大图)"
    placeholder="例如: digital art, wallpaper 4k, illustration, character..."
    accentColor="#FC3F1D"
  />
</template>

<script setup lang="ts">
import ImageEngineCollectView from '../components/ImageEngineCollectView.vue'

defineOptions({ name: 'ExternalYandex' })
</script>
