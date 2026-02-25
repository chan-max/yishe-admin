<template>
  <ContentWrap title="AI 文字转语音助手">
    <template #header>
      <div class="flex flex-grow justify-end">
        <el-tag type="success" effect="dark" round>Premium</el-tag>
      </div>
    </template>

    <el-row :gutter="24">
      <!-- 左侧：文本输入区 -->
      <el-col :lg="15" :md="14" :sm="24" :xs="24">
        <div class="input-card">
          <div class="card-title">
            <el-icon>
              <EditPen />
            </el-icon>
            输入转换文本
          </div>
          <el-input v-model="ttsForm.text" type="textarea" :rows="18" placeholder="请输入您想要转换成语音的文字内容..." maxlength="500"
            show-word-limit class="premium-textarea" />
          <div class="tips-wrapper mt-6">
            <div class="tip-card">
              <el-icon class="tip-icon">
                <InfoFilled />
              </el-icon>
              <div class="tip-text">
                提示：Qwen3-TTS 提供了极其拟人的语音合成效果。如果文本过长，建议分段生成以获得最佳韵律。
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧：设置与结果 -->
      <el-col :lg="9" :md="10" :sm="24" :xs="24">
        <div class="settings-sidebar">
          <div class="sidebar-section">
            <div class="section-title">基准配置</div>
            <div class="setting-list">
              <div class="setting-item">
                <span class="setting-label">选择音色</span>
                <el-select v-model="ttsForm.voice" placeholder="选择预设或角色" class="w-full">
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
                <span class="setting-label">模型引擎</span>
                <el-select v-model="ttsForm.model" placeholder="选择版本" class="w-full">
                  <el-option label="Qwen3 TTS Flash (最新)" value="qwen3-tts-flash" />
                  <el-option label="Qwen3 TTS Instruct (指令)" value="qwen3-tts-instruct-flash" />
                </el-select>
              </div>

              <div class="setting-item">
                <div class="flex justify-between items-center mb-1">
                  <span class="setting-label">输出格式</span>
                  <el-radio-group v-model="ttsForm.format" size="small">
                    <el-radio-button label="mp3">MP3</el-radio-button>
                    <el-radio-button label="wav">WAV</el-radio-button>
                  </el-radio-group>
                </div>
              </div>
            </div>
          </div>

          <div class="sidebar-section mt-6">
            <div class="section-title">语气微调</div>
            <div class="slider-group">
              <div class="slider-item">
                <div class="slider-header">
                  <span>语速 (Speed)</span>
                  <span class="slider-value">{{ ttsForm.speed }}x</span>
                </div>
                <el-slider v-model="ttsForm.speed" :min="0.5" :max="2.0" :step="0.1" />
              </div>
              <div class="slider-item">
                <div class="slider-header">
                  <span>语调 (Pitch)</span>
                  <span class="slider-value">{{ ttsForm.pitch }}x</span>
                </div>
                <el-slider v-model="ttsForm.pitch" :min="0.5" :max="2.0" :step="0.1" />
              </div>
            </div>
          </div>

          <div class="action-btn-wrapper mt-8">
            <el-button type="primary" class="generate-btn" :loading="loading" @click="handleGenerate">
              <el-icon v-if="!loading" class="mr-1">
                <MagicStick />
              </el-icon>
              {{ loading ? '并行生成中...' : '生成音频' }}
            </el-button>
          </div>

          <transition name="el-zoom-in-top">
            <div v-if="audioUrl" class="result-sidebar-box mt-6">
              <div class="result-box-header">
                <div class="flex items-center gap-1">
                  <el-icon color="#67C23A">
                    <Checked />
                  </el-icon>
                  <span>生成完毕</span>
                </div>
                <el-button type="primary" link @click="handleDownload">下载文件</el-button>
              </div>
              <div class="player-wrapper mt-3">
                <audio ref="audioRef" :src="audioUrl" controls class="custom-audio" />
              </div>
            </div>
          </transition>
        </div>
      </el-col>
    </el-row>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { MagicStick, InfoFilled, Download, EditPen, Checked } from '@element-plus/icons-vue'
import { generateTts } from '@/api/ai/tts'
import { ElMessage, ElNotification } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'

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

<style scoped lang="scss">
.input-card {
  background: var(--el-bg-color);
  padding: 0;

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--el-text-color-primary);

    .el-icon {
      color: var(--el-color-primary);
    }
  }
}

.premium-textarea :deep(.el-textarea__inner) {
  padding: 16px;
  font-size: 15px;
  line-height: 1.6;
  border-radius: 8px;
  background-color: var(--el-fill-color-blank);
  transition: all 0.3s ease;

  &:focus {
    background-color: var(--el-bg-color);
    box-shadow: 0 0 0 1px var(--el-color-primary-light-8);
  }
}

.settings-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-section {
  background: var(--el-fill-color-light);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);

  .section-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--el-text-color-primary);
    position: relative;
    padding-left: 10px;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 14px;
      background: var(--el-color-primary);
      border-radius: 2px;
    }
  }
}

.setting-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  .setting-label {
    display: block;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
  }
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.slider-item {
  .slider-header {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--el-text-color-regular);
    margin-bottom: 4px;

    .slider-value {
      font-weight: 600;
      color: var(--el-color-primary);
    }
  }
}

.generate-btn {
  width: 100%;
  padding: 24px 0;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  letter-spacing: 1px;
  box-shadow: var(--el-box-shadow-light);
}

.result-sidebar-box {
  background: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-7);
  border-radius: 12px;
  padding: 16px;

  .result-box-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.player-wrapper {
  .custom-audio {
    width: 100%;
    height: 36px;
  }
}

.tips-wrapper {
  .tip-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    background: var(--el-fill-color-blank);
    border: 1px dashed var(--el-border-color);
    border-radius: 8px;

    .tip-icon {
      margin-top: 2px;
      color: var(--el-color-warning);
    }

    .tip-text {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      line-height: 1.5;
    }
  }
}

.voice-option {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  padding: 4px 0;

  .voice-label {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .voice-desc {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }
}

/* 动画效果 */
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

.scale-in-center {
  animation: fadeIn 0.4s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
}
</style>
