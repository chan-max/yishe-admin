<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, Delete, Promotion, Switch } from '@element-plus/icons-vue'
import { useClipboard } from '@vueuse/core'
import { translateText } from '@/api/translate/translate'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/api/translate'

defineOptions({ name: 'ToolTranslator' })

type SourceLanguage = SupportedLanguage | 'auto'
type LanguageOption = {
  code: SupportedLanguage
  name: string
  zhName: string
}

const { copy, isSupported } = useClipboard()

const languageZhNameMap: Record<SupportedLanguage, string> = {
  zh: '中文',
  en: '英语',
  ja: '日语',
  de: '德语',
  fr: '法语',
  es: '西班牙语',
  ko: '韩语',
  ru: '俄语',
  pt: '葡萄牙语',
  it: '意大利语',
  ar: '阿拉伯语',
  hi: '印地语',
  th: '泰语',
  vi: '越南语',
}

const languageOptions: LanguageOption[] = SUPPORTED_LANGUAGES.map((lang) => ({
  ...lang,
  zhName: languageZhNameMap[lang.code],
}))

const sourceLanguages: Array<LanguageOption | { code: 'auto'; name: string; zhName: string }> = [
  { code: 'auto', name: '自动检测', zhName: '自动识别' },
  ...languageOptions,
]

const sourceLang = ref<SourceLanguage>('auto')
const targetLang = ref<SupportedLanguage>('zh')
const sourceText = ref('')
const targetText = ref('')
const context = ref('')
const translating = ref(false)

const resolvedSourceLang = computed<SupportedLanguage>(() =>
  sourceLang.value === 'auto' ? 'en' : sourceLang.value,
)
const sameLanguage = computed(() => sourceLang.value !== 'auto' && sourceLang.value === targetLang.value)
const canTranslate = computed(() => !!sourceText.value.trim() && !sameLanguage.value && !translating.value)

const formatLanguageLabel = (lang: { name: string; zhName: string }) => {
  return lang.name === lang.zhName ? lang.name : `${lang.name} / ${lang.zhName}`
}

const handleTranslate = async () => {
  if (!sourceText.value.trim()) {
    ElMessage.warning('请输入需要翻译的文本')
    return
  }

  if (sameLanguage.value) {
    ElMessage.warning('源语言和目标语言不能相同')
    return
  }

  translating.value = true
  targetText.value = ''

  try {
    const result = await translateText({
      text: sourceText.value,
      sourceLang: resolvedSourceLang.value,
      targetLang: targetLang.value,
      context: context.value.trim() || undefined,
    })

    targetText.value = result.translatedText
  } catch (error: any) {
    ElMessage.error(error?.message || '翻译失败')
  } finally {
    translating.value = false
  }
}

const swapLanguages = () => {
  if (sourceLang.value === 'auto') {
    ElMessage.info('自动检测模式下无法交换语言')
    return
  }

  const nextSourceLang = targetLang.value
  const nextTargetLang = sourceLang.value
  const nextSourceText = targetText.value

  sourceLang.value = nextSourceLang
  targetLang.value = nextTargetLang
  targetText.value = sourceText.value
  sourceText.value = nextSourceText
}

const clearAll = () => {
  sourceText.value = ''
  targetText.value = ''
}

const copyResult = async () => {
  if (!targetText.value) return
  if (!isSupported.value) {
    ElMessage.warning('当前浏览器不支持剪贴板')
    return
  }

  await copy(targetText.value)
  ElMessage.success('已复制')
}
</script>

<template>
  <div class="translator">
    <div class="lang-row">
      <select v-model="sourceLang" class="lang-select">
        <option v-for="lang in sourceLanguages" :key="lang.code" :value="lang.code">
          {{ formatLanguageLabel(lang) }}
        </option>
      </select>

      <button class="icon-btn" type="button" title="交换语言" @click="swapLanguages">
        <el-icon><Switch /></el-icon>
      </button>

      <select v-model="targetLang" class="lang-select">
        <option v-for="lang in languageOptions" :key="lang.code" :value="lang.code">
          {{ formatLanguageLabel(lang) }}
        </option>
      </select>
    </div>

    <div class="text-grid">
      <section class="text-box">
        <textarea
          v-model="sourceText"
          class="textarea"
          placeholder="输入要翻译的文本"
          spellcheck="false"
          @keydown.ctrl.enter="handleTranslate"
        />
        <div class="box-footer">
          <span>{{ sourceText.length }} 字符</span>
          <button class="text-btn" type="button" :disabled="!sourceText && !targetText" @click="clearAll">
            <el-icon><Delete /></el-icon>
            清空
          </button>
        </div>
      </section>

      <section v-loading="translating" class="text-box result">
        <textarea
          v-model="targetText"
          class="textarea"
          placeholder="翻译结果"
          spellcheck="false"
          readonly
        />
        <div class="box-footer">
          <span>{{ targetText.length }} 字符</span>
          <button class="text-btn" type="button" :disabled="!targetText" @click="copyResult">
            <el-icon><CopyDocument /></el-icon>
            复制
          </button>
        </div>
      </section>
    </div>

    <div class="action-row">
      <input v-model="context" class="context-input" placeholder="上下文，可选：如商品描述、客服话术" />
      <button class="translate-btn" type="button" :disabled="!canTranslate" @click="handleTranslate">
        <el-icon><Promotion /></el-icon>
        {{ translating ? '翻译中...' : '翻译' }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.translator {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: clamp(3px, 1.2cqw, 7px);
  font-size: 13px;
  color: var(--el-text-color-primary);
  background: var(--app-content-surface-color);
  container-type: size;
  align-self: stretch;
  flex-direction: column;
  gap: 6px;
}

button,
select,
textarea,
input {
  font: inherit;
}

button {
  border: 0;
}

.lang-row,
.action-row {
  display: grid;
  flex-shrink: 0;
  gap: 6px;
}

.lang-row {
  grid-template-columns: minmax(0, 1fr) 32px minmax(0, 1fr);
}

.action-row {
  grid-template-columns: minmax(0, 1fr) auto;
}

.lang-select,
.context-input {
  width: 100%;
  height: 32px;
  min-width: 0;
  padding: 0 9px;
  color: var(--el-text-color-primary);
  background: var(--ep-cover-soft-bg);
  border: 1px solid var(--app-content-border-color);
  border-radius: 5px;
  outline: none;

  &:focus {
    border-color: var(--el-color-primary);
  }
}

.icon-btn,
.text-btn,
.translate-btn {
  display: inline-flex;
  cursor: pointer;
  border-radius: 5px;
  align-items: center;
  justify-content: center;
  gap: 5px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
}

.icon-btn {
  width: 32px;
  height: 32px;
  color: var(--el-text-color-secondary);
  background: var(--ep-cover-soft-bg);
  border: 1px solid var(--app-content-border-color);

  &:hover:not(:disabled) {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }
}

.text-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 6px;
  flex: 1;
  min-height: 0;
}

.text-box {
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--ep-cover-soft-bg);
  border: 1px solid var(--app-content-border-color);
  border-radius: 6px;
  flex-direction: column;

  &.result {
    border-color: color-mix(in srgb, var(--el-color-primary) 45%, transparent);
  }
}

.textarea {
  min-height: 0;
  padding: 9px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--el-text-color-primary);
  background: transparent;
  border: 0;
  outline: none;
  resize: none;
  flex: 1;

  &::placeholder {
    color: var(--el-text-color-placeholder);
  }

  &[readonly] {
    color: color-mix(in srgb, var(--el-color-primary) 78%, var(--el-text-color-primary));
  }
}

.box-footer {
  display: flex;
  min-height: 30px;
  padding: 4px 7px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border-top: 1px solid var(--app-content-border-color);
  align-items: center;
  justify-content: space-between;
}

.text-btn {
  height: 24px;
  padding: 0 7px;
  color: var(--el-text-color-secondary);
  background: transparent;

  &:hover:not(:disabled) {
    color: var(--el-text-color-primary);
    background: var(--ep-cover-soft-bg-hover);
  }
}

.translate-btn {
  height: 32px;
  padding: 0 16px;
  font-weight: 600;
  color: var(--el-color-white);
  white-space: nowrap;
  background: var(--el-color-primary);

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--el-color-primary) 88%, #000);
  }
}

@container (max-width: 620px) {
  .lang-row {
    grid-template-columns: minmax(0, 1fr) 30px minmax(0, 1fr);
  }

  .text-grid,
  .action-row {
    grid-template-columns: 1fr;
  }

  .text-grid {
    grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  }
}

@container (max-width: 380px) {
  .translator {
    gap: 4px;
  }

  .lang-row {
    grid-template-columns: 1fr;
  }

  .icon-btn {
    width: 100%;
  }
}

@container (max-height: 430px) {
  .translator {
    gap: 4px;
  }

  .lang-select,
  .context-input,
  .icon-btn,
  .translate-btn {
    height: 28px;
  }

  .box-footer {
    min-height: 24px;
    padding-block: 2px;
  }

  .textarea {
    padding: 7px;
    line-height: 1.45;
  }
}

@container (max-height: 320px) {
  .action-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .context-input {
    display: none;
  }
}
</style>
