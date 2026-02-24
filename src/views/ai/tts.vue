<template>
  <div class="tts-container">
    <el-card class="tts-card">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon class="title-icon">
              <Microphone />
            </el-icon>
            AI 文字转语音助手 (Qwen Powered)
          </span>
          <div class="header-actions">
            <el-tag type="success" effect="dark" round>Premium</el-tag>
          </div>
        </div>
      </template>

      <div class="tts-content">
        <div class="input-section">
          <div class="section-label">输入文本</div>
          <el-input v-model="ttsForm.text" type="textarea" :rows="8" placeholder="请输入您想要转换成语音的文字内容..." maxlength="500"
            show-word-limit class="premium-textarea" />
        </div>

        <div class="settings-grid">
          <div class="setting-item">
            <div class="section-label">选择音色</div>
            <el-select v-model="ttsForm.voice" placeholder="请选择音色" class="premium-select">
              <el-option v-for="item in voiceOptions" :key="item.value" :label="item.label" :value="item.value">
                <div class="voice-option">
                  <span class="voice-label">{{ item.label }}</span>
                  <span class="voice-desc">{{ item.desc }}</span>
                </div>
              </el-option>
            </el-select>
          </div>

          <div class="setting-item">
            <div class="section-label">采样率</div>
            <el-select v-model="ttsForm.sample_rate" placeholder="采样率" class="premium-select">
              <el-option label="16k Hz" :value="16000" />
              <el-option label="24k Hz" :value="24000" />
              <el-option label="48k Hz" :value="48000" />
            </el-select>
          </div>

          <div class="setting-item">
            <div class="section-label">输出格式</div>
            <el-radio-group v-model="ttsForm.format" size="small">
              <el-radio-button label="mp3">MP3</el-radio-button>
              <el-radio-button label="wav">WAV</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="action-footer">
          <el-button type="primary" class="generate-btn" :loading="loading" @click="handleGenerate">
            <el-icon v-if="!loading">
              <MagicStick />
            </el-icon>
            {{ loading ? '生成中...' : '生成语音' }}
          </el-button>
        </div>

        <div v-if="audioUrl" class="result-section">
          <el-divider>预览生成音频</el-divider>
          <div class="audio-player-container">
            <audio ref="audioRef" :src="audioUrl" controls class="audio-player"></audio>
            <div class="audio-actions">
              <el-button type="success" :icon="Download" circle @click="handleDownload" />
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Tips Section -->
    <div class="tips-container">
      <div class="tip-card">
        <el-icon class="tip-icon">
          <InfoFilled />
        </el-icon>
        <div class="tip-text">
          提示：Qwen TTS (CosyVoice) 提供了极高质量的语音合成，支持多情感表达。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Microphone, MagicStick, InfoFilled, Download } from '@element-plus/icons-vue'
import { generateTts } from '@/api/ai/tts'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const audioUrl = ref('')
const audioRef = ref<HTMLAudioElement | null>(null)

const ttsForm = reactive({
  text: '',
  voice: 'Vivian',
  model: 'qwen3-tts-flash-2025-11-27',
  format: 'mp3',
  sample_rate: 24000
})

const voiceOptions = [
  { label: 'Vivian (元气女声)', value: 'Vivian', desc: '活力动听，支持多语种' },
  { label: 'Cherry (甜美女声)', value: 'Cherry', desc: '温柔自然，适合带货推荐' },
  { label: 'Elias (磁性男声)', value: 'Elias', desc: '深沉稳重，适合专业解说' },
  { label: 'Momo (可爱少女)', value: 'Momo', desc: '甜美可爱，二次元推荐' },
  { label: 'Ono Anna (职场女性)', value: 'Ono Anna', desc: '从容自信，商业播报' },
  { label: 'Eldric Sage (儒雅男声)', value: 'Eldric Sage', desc: '学识博学，有声书风格' },
  { label: 'Bunny (萌系女伴)', value: 'Bunny', desc: '灵动有趣，亲和力强' },
]

const handleGenerate = async () => {
  if (!ttsForm.text) {
    return ElMessage.warning('请输入要生成的文字')
  }

  loading.value = true
  try {
    const res = await generateTts({
      ...ttsForm
    })

    console.log('📥 [Frontend] TTS Response received:', res)
    console.log('📥 [Frontend] Response size:', res?.size || res?.byteLength || 'unknown')

    // 清除旧的 URL
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value)
    }

    // 创建新的 Blob URL (如果后端返回的是 Blob 则直接使用，否则包裹一下)
    const blob = res instanceof Blob ? res : new Blob([res], { type: `audio/${ttsForm.format === 'mp3' ? 'mpeg' : ttsForm.format}` })
    audioUrl.value = URL.createObjectURL(blob)

    ElMessage.success('语音生成成功！')

    // 自动播放
    setTimeout(() => {
      audioRef.value?.play()
    }, 100)
  } catch (error: any) {
    console.error('TTS Generate Error:', error)
    ElMessage.error(error.message || '生成失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handleDownload = () => {
  if (!audioUrl.value) return
  const a = document.createElement('a')
  a.href = audioUrl.value
  a.download = `voice_${Date.now()}.${ttsForm.format}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>

<style scoped>
.tts-container {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.tts-card {
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color-overlay);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  color: var(--el-color-primary);
}

.tts-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.premium-textarea :deep(.el-textarea__inner) {
  background-color: var(--el-fill-color-blank);
  border-color: var(--el-border-color);
  color: var(--el-text-color-primary);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.premium-select {
  width: 100%;
}

.voice-option {
  display: flex;
  flex-direction: column;
  padding: 2px 0;
}

.voice-label {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.voice-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.2;
}

.action-footer {
  display: flex;
  justify-content: center;
  padding-top: 10px;
}

.generate-btn {
  padding: 20px 40px;
  font-size: 16px;
  border-radius: 4px;
}

.result-section {
  margin-top: 10px;
}

.audio-player-container {
  background-color: var(--el-fill-color-light);
  padding: 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.audio-player {
  flex: 1;
  height: 36px;
}

.tips-container {
  margin-top: 20px;
}

.tip-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background-color: var(--el-color-warning-light-9);
  border-radius: 4px;
  border: 1px solid var(--el-color-warning-light-8);
}

.tip-icon {
  color: var(--el-color-warning);
  font-size: 18px;
}

.tip-text {
  font-size: 13px;
  color: var(--el-color-warning-darker);
}
</style>
