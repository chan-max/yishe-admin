<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  success: [token: string]
  failed: []
  close: []
}>()

const status = ref<'idle' | 'checking' | 'success'>('idle')
const startTime = ref(Date.now())
const mouseMoveCount = ref(0)

function handleMouseMove() {
  mouseMoveCount.value++
}

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMouseMove)
})

watch(() => props.visible, (val) => {
  if (val) {
    status.value = 'idle'
    mouseMoveCount.value = 0
    startTime.value = Date.now()
  }
})

function verify() {
  if (status.value !== 'idle') return

  status.value = 'checking'

  const delay = 1000 + Math.random() * 800

  setTimeout(() => {
    const stayTime = Date.now() - startTime.value
    let score = 0

    if (stayTime > 600) score += 40
    if (mouseMoveCount.value > 2) score += 40
    score += 20

    if (score >= 60) {
      status.value = 'success'
      const token = btoa(JSON.stringify({ t: Date.now(), r: Math.random() }))
      setTimeout(() => emit('success', token), 300)
    } else {
      status.value = 'idle'
      emit('failed')
    }
  }, delay)
}
</script>

<template>
  <Teleport to="body">
    <transition name="cf-fade">
      <div v-if="visible" class="cf-overlay">
        <div class="cf-box" :class="`cf-box--${status}`" @click="verify">
          <span class="cf-text">
            {{ status === 'idle' ? '点击验证' : status === 'checking' ? '正在验证...' : '验证通过' }}
          </span>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.cf-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.25);
}

.cf-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 24px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: background 0.15s;
  animation: cf-in 0.1s ease;
}

.cf-box:hover {
  background: #fafafa;
}

.cf-box--checking,
.cf-box--success {
  cursor: default;
}

.cf-box--checking:hover,
.cf-box--success:hover {
  background: #fff;
}

/* 文字 */
.cf-text {
  font-size: 13px;
  color: #555;
  font-weight: 500;
  white-space: nowrap;
}

.cf-box--checking .cf-text {
  color: #d97706;
  font-weight: 600;
}

.cf-box--success .cf-text {
  color: #22c55e;
}

/* 动画 */
@keyframes cf-in {
  from { transform: scale(0.97); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.cf-fade-enter-active,
.cf-fade-leave-active {
  transition: opacity 0.1s ease;
}

.cf-fade-enter-from,
.cf-fade-leave-to {
  opacity: 0;
}

/* 暗色模式 */
:global(html.dark) {
  .cf-box {
    background: #1a1a1a;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  .cf-box:hover {
    background: #222;
  }

  .cf-box--checking:hover,
  .cf-box--success:hover {
    background: #1a1a1a;
  }

  .cf-svg {
    color: #666;
  }

  .cf-text {
    color: #bbb;
  }

  .cf-box--checking .cf-text {
    color: #d97706;
    font-weight: 600;
  }

  .cf-box--success .cf-text {
    color: #4ade80;
  }
}
</style>
