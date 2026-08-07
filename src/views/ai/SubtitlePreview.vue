<template>
  <el-dialog v-model="visible" class="subtitle-preview-dialog" title="字幕预览" fullscreen :destroy-on-close="true"
    @close="handleClose">
    <div class="subtitle-preview-body">
      <div v-if="row?.resultUrl" class="preview-audio-row">
        <audio ref="audioRef" :src="row.resultUrl" preload="auto" class="audio-preview"
          @loadedmetadata="onLoadedMetadata" @timeupdate="onTimeUpdate" @ended="onEnded" @play="onPlay"
          @pause="onPause" />
        <div class="preview-controls">
          <el-button size="small" type="primary" @click="isPlaying ? pause() : play()">
            {{ isPlaying ? '暂停' : '开始' }}
          </el-button>
          <el-button size="small" @click="handleClose">停止并关闭</el-button>
          <div class="time-info" style="margin-left:12px; line-height:32px; color:var(--el-text-color-secondary)">
            播放：{{ formatDuration(currentTime) }} / {{ formatDuration(audioDuration) }} s
          </div>
        </div>
        <div class="audio-progress-wrapper" style="margin-top:8px; display:flex; align-items:center; gap:8px">
          <div class="audio-progress"
            style="flex:1; height:8px; background:var(--el-border-color); border-radius:4px; overflow:hidden">
            <div class="audio-progress-fill"
              :style="{ width: audioProgressPercent, background: 'var(--el-color-primary)', height: '100%' }"></div>
          </div>
          <div class="audio-progress-percent"
            style="min-width:48px; text-align:right; color:var(--el-text-color-secondary)">{{ audioProgressPercent }}
          </div>
        </div>
      </div>
      <div v-else class="no-audio">无可用音频</div>

      <div class="current-sentence-display">
        <div v-if="currentSentenceIndex !== -1" class="current-sentence-content">
          <div class="current-sentence-label">当前正在播放</div>
          <div class="current-sentence-text sentence-karaoke" :style="getKaraokeStyle(currentSentenceIndex)">
            {{ row?.subtitle?.sentences[currentSentenceIndex]?.text }}
          </div>
        </div>
        <div v-else class="current-sentence-placeholder">
          {{ isPlaying ? '准备中...' : '点击播放开始预览' }}
        </div>
      </div>

      <div class="subtitle-preview-track" ref="trackRef">
        <ul class="preview-sentences">
          <li v-for="(s, idx) in row?.subtitle?.sentences || []" :key="s.index"
            :class="['preview-sentence', { active: idx === currentSentenceIndex }]"
            @click="seekToSentence(Number(s.start))">
            <span class="sentence-time">[{{ s.start }}~{{ s.end }}s]</span>
            <div class="sentence-karaoke" :style="getKaraokeStyle(idx)">
              {{ s.text }}
            </div>
          </li>
        </ul>
      </div>
    </div>
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps<{
  modelValue: boolean
  row: any
}>()

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const audioRef = ref<HTMLAudioElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)
const currentTime = ref(0)
const audioDuration = ref(0)
const currentSentenceIndex = ref(-1)
const isPlaying = ref(false)
const timerLoopId = ref<number | null>(null)

const formatDuration = (val: any) => {
  if (val === undefined || val === null || val === '') return '-'
  const num = parseFloat(val)
  if (isNaN(num)) return val
  return num.toFixed(2)
}

const audioProgressPercent = computed(() => {
  const dur = audioDuration.value || props.row?.duration || 0
  if (!dur || dur <= 0) return '0%'
  const p = Math.max(0, Math.min(100, Math.round((currentTime.value / Number(dur)) * 100)))
  return `${p}%`
})

const startSyncLoop = () => {
  if (timerLoopId.value) return
  const loop = () => {
    if (audioRef.value) {
      updateProgress(audioRef.value.currentTime)
    }
    timerLoopId.value = requestAnimationFrame(loop)
  }
  timerLoopId.value = requestAnimationFrame(loop)
}

const stopSyncLoop = () => {
  if (timerLoopId.value) {
    cancelAnimationFrame(timerLoopId.value)
    timerLoopId.value = null
  }
}

const updateProgress = (t: number) => {
  currentTime.value = t
  const sentences = props.row?.subtitle?.sentences || []
  if (!sentences.length) return

  const findIdx = sentences.findIndex((s: any) => {
    const start = Number(s.start || 0)
    const end = Number(s.end || (start + (Number(s.duration) || 0)))
    return t >= start && t <= end
  })

  if (findIdx !== -1) {
    currentSentenceIndex.value = findIdx
  } else {
    // 处于间隙或未开始
    currentSentenceIndex.value = -1
  }
}

const getKaraokeStyle = (idx: number) => {
  if (idx < 0) return {}
  const sentences = props.row?.subtitle?.sentences || []
  const s = sentences[idx]
  if (!s) return {}

  const t = currentTime.value
  const sStart = Number(s.start || 0)
  const sDur = Number(s.duration || (Number(s.end) - sStart || 0))
  const sEnd = sStart + sDur

  let p = 0
  if (t >= sEnd) {
    p = 100
  } else if (t <= sStart) {
    p = 0
  } else {
    const effectiveDur = Math.max(0.01, sDur)
    p = Math.round(((t - sStart) / effectiveDur) * 100)
  }

  return {
    'background-image': `linear-gradient(to right, var(--el-color-primary) ${p}%, var(--el-text-color-placeholder) ${p}%)`
  }
}

const play = async () => {
  if (!audioRef.value) return
  try {
    await audioRef.value.play()
  } catch (e) { }
}

const pause = () => {
  if (!audioRef.value) return
  audioRef.value.pause()
}

const seekToSentence = (startTime: number) => {
  if (audioRef.value) {
    audioRef.value.currentTime = startTime
    if (!isPlaying.value) {
      play()
    }
  }
}

const onPlay = () => {
  isPlaying.value = true
  startSyncLoop()
}

const onPause = () => {
  isPlaying.value = false
  stopSyncLoop()
}

const onTimeUpdate = (e: any) => {
  const t = e.target.currentTime || 0
  audioDuration.value = Number(e.target.duration || audioDuration.value || props.row?.duration || 0)
  if (!timerLoopId.value) {
    updateProgress(t)
  }
}

const onLoadedMetadata = (e: any) => {
  audioDuration.value = Number(e.target.duration || props.row?.duration || 0)
}

const onEnded = () => {
  currentTime.value = 0
  stopSyncLoop()
  currentSentenceIndex.value = -1
  isPlaying.value = false
}

const handleClose = () => {
  stopSyncLoop()
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
  }
  visible.value = false
}

watch(() => props.modelValue, async (val) => {
  if (val) {
    await nextTick()
    if (audioRef.value) {
      audioRef.value.currentTime = 0
      audioDuration.value = Number(props.row?.duration || 0)
      play()
    }
  }
})

watch(() => currentSentenceIndex.value, (newIdx) => {
  if (newIdx !== -1 && trackRef.value) {
    nextTick(() => {
      const container = trackRef.value
      if (!container) return
      const activeItem = container.querySelector('.preview-sentence.active') as HTMLElement
      if (activeItem) {
        const containerHeight = container.offsetHeight
        const itemTop = activeItem.offsetTop
        const itemHeight = activeItem.offsetHeight
        container.scrollTo({
          top: itemTop - containerHeight / 2 + itemHeight / 2,
          behavior: 'smooth'
        })
      }
    })
  }
})

onBeforeUnmount(() => {
  stopSyncLoop()
})
</script>

<style scoped>
.subtitle-preview-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100vh - 120px);
  padding: 20px;
}

.subtitle-preview-track {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--el-fill-color-light);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}

.preview-sentences {
  list-style: none;
  padding: 0;
  margin: 0;
}

.preview-sentence {
  padding: 10px 12px;
  border-radius: 6px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.preview-sentence:hover {
  background: var(--el-fill-color);
}

.preview-sentence.active {
  background: var(--el-color-primary-light-9);
  transform: translateX(4px);
}

.sentence-time {
  width: 120px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}

.sentence-karaoke {
  font-size: 16px;
  line-height: 1.6;
  font-weight: 500;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-repeat: no-repeat;
  word-break: break-word;
  color: var(--el-text-color-placeholder);
  display: inline;
  padding: 2px 0;
}

.current-sentence-display {
  margin-bottom: 16px;
  padding: 20px;
  background: var(--el-color-primary-light-9);
  border-radius: 12px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--el-color-primary-light-7);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-primary) 5%, transparent);
  transition: all 0.3s ease;
}

.current-sentence-content {
  text-align: center;
  width: 100%;
  animation: fadeIn 0.4s ease-out;
}

.current-sentence-label {
  font-size: 12px;
  color: var(--el-color-primary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
  opacity: 0.8;
}

.current-sentence-text.sentence-karaoke {
  display: inline-block;
  margin: 0 auto;
  font-size: 18px;
}

.current-sentence-placeholder {
  color: var(--el-text-color-placeholder);
  font-style: italic;
  font-size: 16px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.active .sentence-karaoke {
  font-weight: 600;
}

.audio-preview {
  width: 100%;
  height: 32px;
  display: none;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.no-audio {
  text-align: center;
  padding: 20px;
  color: var(--el-text-color-secondary);
}
</style>
