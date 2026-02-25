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
              <el-option-group v-for="group in voiceGroups" :key="group.label" :label="group.label">
                <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value">
                  <div class="voice-option">
                    <span class="voice-label">{{ item.label }}</span>
                    <span class="voice-desc">{{ item.desc }}</span>
                  </div>
                </el-option>
              </el-option-group>
            </el-select>
          </div>

          <div class="setting-item">
            <div class="section-label">AI 模型</div>
            <el-select v-model="ttsForm.model" placeholder="请选择模型" class="premium-select">
              <el-option label="Qwen3 TTS Flash (最新版)" value="qwen3-tts-flash-2025-11-27" />
              <el-option label="Qwen3 TTS Flash (通用版)" value="qwen3-tts-flash" />
              <el-option label="Qwen3 TTS Instruct (指令版)" value="qwen3-tts-instruct-flash" />
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

        <!-- Advanced Settings -->
        <div class="advanced-settings">
          <div class="setting-row">
            <div class="label-with-value">
              <span class="section-label">语速</span>
              <span class="value-badge">{{ ttsForm.speed }}x</span>
            </div>
            <el-slider v-model="ttsForm.speed" :min="0.5" :max="2.0" :step="0.1" />
          </div>
          <div class="setting-row">
            <div class="label-with-value">
              <span class="section-label">语调</span>
              <span class="value-badge">{{ ttsForm.pitch }}x</span>
            </div>
            <el-slider v-model="ttsForm.pitch" :min="0.5" :max="2.0" :step="0.1" />
          </div>
        </div>

        <div class="action-footer">
          <el-button type="primary" class="generate-btn" :loading="loading" @click="handleGenerate">
            <el-icon v-if="!loading">
              <MagicStick />
            </el-icon>
            {{ loading ? '生成中...' : '开始合成语音' }}
          </el-button>
        </div>

        <div v-if="audioUrl" class="result-section">
          <div class="result-header">
            <span class="result-title">生成结果</span>
            <el-button type="primary" link :icon="Download" @click="handleDownload">下载音频</el-button>
          </div>
          <div class="audio-player-container">
            <audio ref="audioRef" :src="audioUrl" controls class="audio-player"></audio>
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
          提示：Qwen3-TTS 提供了极高质量的语音合成。如果文本过长，请尝试减少字数或分段生成。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Microphone, MagicStick, InfoFilled, Download } from '@element-plus/icons-vue'
import { generateTts } from '@/api/ai/tts'
import { ElMessage, ElNotification } from 'element-plus'

const loading = ref(false)
const audioUrl = ref('')
const audioRef = ref<HTMLAudioElement | null>(null)

const ttsForm = reactive({
  text: '',
  voice: 'Cherry',
  model: 'qwen3-tts-flash',
  format: 'mp3',
  sample_rate: 24000,
  speed: 1.0,
  pitch: 1.0
})

const voiceGroups = [
  {
    label: '精品人声 (Boutique)',
    options: [
      { label: 'Cherry (芊悦)', value: 'Cherry', desc: '阳光积极、亲切自然小姐姐' },
      { label: 'Serena (苏瑶)', value: 'Serena', desc: '温柔小姐姐' },
      { label: 'Ethan (晨煦)', value: 'Ethan', desc: '标准普通话，阳光温暖朝气男声' },
      { label: 'Chelsie (千雪)', value: 'Chelsie', desc: '二次元虚拟女友' },
    ]
  },
  {
    label: '角色与趣味 (Roles & Fun)',
    options: [
      { label: 'Momo (茉兔)', value: 'Momo', desc: '撒娇搞怪，逗你开心' },
      { label: 'Vivian (十三)', value: 'Vivian', desc: '可爱的小暴躁，拽拽的' },
      { label: 'Moon (月白)', value: 'Moon', desc: '率性帅气的月白男声' },
      { label: 'Maia (四月)', value: 'Maia', desc: '知性与温柔的碰撞' },
      { label: 'Kai (凯)', value: 'Kai', desc: '耳朵的一场 SPA' },
      { label: 'Nofish (不吃鱼)', value: 'Nofish', desc: '不会翘舌音的设计师男声' },
      { label: 'Bella (萌宝)', value: 'Bella', desc: '不打醉拳的小萝莉' },
      { label: 'Eldric Sage (沧明子)', value: 'Eldric Sage', desc: '沉稳睿智的老者' },
      { label: 'Mia (乖小妹)', value: 'Mia', desc: '温顺如春水，乖巧如初雪' },
      { label: 'Mochi (沙小弥)', value: 'Mochi', desc: '聪明伶俐的小大人' },
      { label: 'Bellona (燕铮莺)', value: 'Bellona', desc: '字正腔圆，尽显江湖' },
      { label: 'Vincent (田叔)', value: 'Vincent', desc: '独特的沙哑烟嗓，豪情万丈' },
      { label: 'Bunny (萌小姬)', value: 'Bunny', desc: '“萌属性”爆棚的小萝莉' },
      { label: 'Neil (阿闻)', value: 'Neil', desc: '最专业的新闻主持人' },
      { label: 'Elias (墨讲师)', value: 'Elias', desc: '学科严谨，讲课好听' },
      { label: 'Arthur (徐大爷)', value: 'Arthur', desc: '质朴的烟嗓，讲村里的故事' },
      { label: 'Nini (邻家妹妹)', value: 'Nini', desc: '软糯黏人，这一声哥哥太酥了' },
      { label: 'Ebona (诡婆婆)', value: 'Ebona', desc: '幽暗低语，童年阴影风格' },
      { label: 'Seren (小婉)', value: 'Seren', desc: '温和舒缓，助你晚安好梦' },
      { label: 'Pip (顽屁小孩)', value: 'Pip', desc: '调皮捣蛋充满童真' },
      { label: 'Stella (少女阿月)', value: 'Stella', desc: '迷糊少女，代表月亮消灭你' },
    ]
  },
  {
    label: '多语种与国际 (Global)',
    options: [
      { label: 'Jennifer (詹妮弗)', value: 'Jennifer', desc: '电影质感般美语女声' },
      { label: 'Ryan (甜茶)', value: 'Ryan', desc: '戏感炸裂，真实与张力共舞' },
      { label: 'Katerina (卡捷琳娜)', value: 'Katerina', desc: '御姐音色，韵律回味' },
      { label: 'Aiden (艾登)', value: 'Aiden', desc: '精通厨艺的美语大男孩' },
      { label: 'Bodega (博德加)', value: 'Bodega', desc: '热情的西班牙大叔' },
      { label: 'Sonrisa (索尼莎)', value: 'Sonrisa', desc: '热情开朗的拉美大姐' },
      { label: 'Alek (阿列克)', value: 'Alek', desc: '战斗民族的冷与暖' },
      { label: 'Dolce (多尔切)', value: 'Dolce', desc: '慵懒的意大利大叔' },
      { label: 'Sohee (素熙)', value: 'Sohee', desc: '情绪丰富的韩国欧尼' },
      { label: 'Ono Anna (小野杏)', value: 'Ono Anna', desc: '鬼灵精怪的青梅竹马' },
      { label: 'Lenn (莱恩)', value: 'Lenn', desc: '理性是底色，叛逆的德国青年' },
      { label: 'Emilien (埃米尔安)', value: 'Emilien', desc: '浪漫的法国大哥哥' },
      { label: 'Andre (安德雷)', value: 'Andre', desc: '自然舒服、沉稳男声' },
      { label: 'Radio Gol (拉迪奥)', value: 'Radio Gol', desc: '足球解说风格声' },
    ]
  },
  {
    label: '特色方言 (Dialects)',
    options: [
      { label: 'Jada (上海-阿珍)', value: 'Jada', desc: '风风火火的沪上阿姐' },
      { label: 'Dylan (北京-晓东)', value: 'Dylan', desc: '北京胡同长大的少年' },
      { label: 'Li (南京-老李)', value: 'Li', desc: '耐心的瑜伽老师' },
      { label: 'Marcus (陕西-秦川)', value: 'Marcus', desc: '心实声沉，老陕的味道' },
      { label: 'Roy (闽南-阿杰)', value: 'Roy', desc: '诙谐直爽台北哥仔' },
      { label: 'Peter (天津-李彼得)', value: 'Peter', desc: '天津相声，专业捧哏' },
      { label: 'Sunny (四川-晴儿)', value: 'Sunny', desc: '甜到心里的川妹子' },
      { label: 'Eric (四川-程川)', value: 'Eric', desc: '跳脱市井的成都男子' },
      { label: 'Rocky (粤语-阿强)', value: 'Rocky', desc: '幽默阿强在线陪聊' },
      { label: 'Kiki (粤语-阿清)', value: 'Kiki', desc: '甜美的港妹闺蜜' },
    ]
  }
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

    // 创建新的 Blob URL
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value)
    }

    // axios 拦截器已经处理了 blob 转换 JSON 的情况
    // 如果走到这里 res 就是 audio blob
    const blob = res instanceof Blob ? res : new Blob([res], { type: `audio/${ttsForm.format === 'mp3' ? 'mpeg' : ttsForm.format}` })

    // 检查 blob 大小，如果太小可能是错误信息被包装成了 blob
    if (blob.size < 200) {
      const text = await blob.text()
      try {
        const errorData = JSON.parse(text)
        throw new Error(errorData.message || '生成失败')
      } catch (e) {
        // 不是 JSON，可能真的是很短的音频或者是其他错误
      }
    }

    audioUrl.value = URL.createObjectURL(blob)

    ElNotification({
      title: '成功',
      message: '语音合成成功',
      type: 'success',
      position: 'top-right'
    })

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
  a.download = `yishe_ai_voice_${Date.now()}.${ttsForm.format}`
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

.advanced-settings {
  background-color: var(--el-fill-color-blank);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-row {
  display: flex;
  flex-direction: column;
}

.label-with-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.value-badge {
  font-size: 12px;
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.action-footer {
  display: flex;
  justify-content: center;
  padding-top: 10px;
}

.generate-btn {
  padding: 24px 60px;
  font-size: 16px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.result-section {
  margin-top: 10px;
  background: var(--el-color-primary-light-9);
  padding: 20px;
  border-radius: 8px;
  border: 1px dashed var(--el-color-primary-light-5);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.audio-player-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.audio-player {
  flex: 1;
  height: 40px;
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
  border-radius: 8px;
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
