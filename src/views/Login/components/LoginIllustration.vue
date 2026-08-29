<template>
  <div class="login-art-panel" aria-label="品牌插画区域">
    <img
      v-for="(img, index) in illustrations"
      :key="img"
      :src="img"
      :class="['login-art-image', { 'is-active': index === activeIndex }]"
      alt=""
      aria-hidden="true"
    />
    <div class="login-art-slogan" aria-label="创意、自由、开放">
      <span>创意</span>
      <i aria-hidden="true" />
      <span>自由</span>
      <i aria-hidden="true" />
      <span>开放</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import mondrian from '@/assets/imgs/login/mondrian-composition.jpg'
import mondrianNoII from '@/assets/imgs/login/mondrian-composition-no-ii.jpg'
import pearlEarring from '@/assets/imgs/login/girl-with-a-pearl-earring.jpg'
import solitaryTree from '@/assets/imgs/login/solitary-tree.jpg'
import lamuTown from '@/assets/imgs/login/lamu-town.jpg'
import peacockAndPeonies from '@/assets/imgs/login/peacock-and-peonies.jpg'
import chineseLandscape1 from '@/assets/imgs/login/chinese-landscape-art-1.jpg'
import chineseLandscape2 from '@/assets/imgs/login/chinese-landscape-art-2.jpg'

const illustrations = [
  mondrian,
  mondrianNoII,
  pearlEarring,
  solitaryTree,
  lamuTown,
  peacockAndPeonies,
  chineseLandscape1,
  chineseLandscape2,
]

const activeIndex = ref(Math.floor(Math.random() * illustrations.length))
let timer: number | null = null

onMounted(() => {
  timer = window.setInterval(() => {
    let next = Math.floor(Math.random() * illustrations.length)
    if (next === activeIndex.value && illustrations.length > 1) {
      next = (next + 1) % illustrations.length
    }
    activeIndex.value = next
  }, 8000)
})

onBeforeUnmount(() => {
  if (timer !== null) {
    window.clearInterval(timer)
    timer = null
  }
})
</script>

<style lang="scss" scoped>
.login-art-panel {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  overflow: hidden;
  border-top-right-radius: clamp(6px, 0.8vw, 10px);
  border-bottom-right-radius: clamp(6px, 0.8vw, 10px);
  corner-shape: squircle;
  background: linear-gradient(135deg, #faf9ff 0%, #f0edff 100%);
}

.login-art-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 1.1s ease-in-out;
}

.login-art-image.is-active {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .login-art-image {
    transition: none;
  }
}

.login-art-slogan {
  position: absolute;
  bottom: clamp(24px, 4vh, 48px);
  left: clamp(24px, 4vw, 54px);
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  z-index: 2;

  i {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.56;
  }
}

// Dark mode
:global(html.dark) {
  .login-art-panel {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }
}

// Tablet
@media (max-width: 1200px) {
  .login-art-panel {
    min-height: 300px;
  }
}

// Mobile
@media (max-width: 768px) {
  .login-art-panel {
    min-height: 240px;
  }
}
</style>
