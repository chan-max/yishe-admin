<template>
  <div ref="contentRef" v-dompurify-html="renderedMarkdown" class="markdown-view"></div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { Marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/vs2015.min.css'

const props = defineProps({
  content: {
    type: String,
    required: true
  }
})

const message = useMessage()
const { copy } = useClipboard()
const contentRef = ref<HTMLElement | null>(null)

const markdown = new Marked({
  gfm: true,
  breaks: true
})

markdown.use({
  renderer: {
    code(token) {
      const rawCode = String(token.text || '')
      const language = String(token.lang || '').trim().toLowerCase()
      const highlighted =
        language && hljs.getLanguage(language)
          ? hljs.highlight(rawCode, { language }).value
          : hljs.highlightAuto(rawCode).value
      const encoded = encodeURIComponent(rawCode)
      const languageClass = language ? ` language-${language}` : ''

      return [
        '<pre class="markdown-view__code-block">',
        `<button class="markdown-view__copy-button" data-copy="${encoded}" type="button">复制</button>`,
        `<code class="hljs${languageClass}">${highlighted}</code>`,
        '</pre>'
      ].join('')
    }
  }
})

const escapeAsHtml = (content: string) => {
  return String(content || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />')
}

const renderedMarkdown = computed(() => {
  try {
    return markdown.parse(String(props.content || '')) as string
  } catch (error) {
    console.error('[MarkdownView] render failed:', error)
    return escapeAsHtml(String(props.content || ''))
  }
})

const handleContentClick = async (event: Event) => {
  const target = event.target as HTMLElement | null
  const button = target?.closest('.markdown-view__copy-button') as HTMLElement | null
  if (!button) {
    return
  }

  const encodedText = String(button.dataset.copy || '')
  if (!encodedText) {
    return
  }

  try {
    await copy(decodeURIComponent(encodedText))
    message.success('复制成功!')
  } catch (error) {
    console.error('[MarkdownView] copy failed:', error)
    message.error('复制失败')
  }
}

onMounted(() => {
  contentRef.value?.addEventListener('click', handleContentClick)
})

onBeforeUnmount(() => {
  contentRef.value?.removeEventListener('click', handleContentClick)
})
</script>

<style lang="scss">
.markdown-view {
  font-family: PingFang SC;
  font-size: 0.95rem;
  font-weight: 400;
  line-height: 1.5rem;
  letter-spacing: 0;
  text-align: left;
  color: var(--markdown-text-color, var(--ai-text, var(--el-text-color-primary, #1f2329)));
  max-width: 100%;

  :deep(pre) {
    position: relative;
  }

  :deep(pre code.hljs) {
    width: auto;
  }

  :deep(code.hljs) {
    border-radius: 6px;
    padding-top: 20px;
    width: auto;

    @media screen and (min-width: 1536px) {
      width: 960px;
    }

    @media screen and (max-width: 1536px) and (min-width: 1024px) {
      width: calc(100vw - 400px - 64px - 32px * 2);
    }

    @media screen and (max-width: 1024px) and (min-width: 768px) {
      width: calc(100vw - 32px * 2);
    }

    @media screen and (max-width: 768px) {
      width: calc(100vw - 16px * 2);
    }
  }

  p,
  :deep(code.hljs) {
    margin-bottom: 10px;
  }

  a {
    color: var(--ai-primary, var(--el-color-primary));
  }

  strong,
  b {
    color: var(--markdown-heading-color, var(--ai-text, var(--el-text-color-primary, #1f2329)));
  }

  p {
    margin: 0 0 4px;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: var(--markdown-heading-color, var(--ai-text, var(--el-text-color-primary, #1f2329)));
    margin: 24px 0 8px;
    font-weight: 600;
  }

  h1 {
    font-size: 22px;
    line-height: 32px;
  }

  h2 {
    font-size: 20px;
    line-height: 30px;
  }

  h3 {
    font-size: 18px;
    line-height: 28px;
  }

  h4,
  h5,
  h6 {
    font-size: 16px;
    line-height: 24px;
  }

  ul,
  ol {
    margin: 2px 0 6px;
    padding: 0;
    font-size: 15px;
    line-height: 22px;
    color: var(--markdown-text-color, var(--ai-text, var(--el-text-color-primary, #1f2329)));
  }

  li {
    margin: 2px 0 4px 18px;
  }

  ol > li {
    list-style-type: decimal;
  }

  ul > li {
    list-style-type: disc;
    font-size: 15px;
    line-height: 22px;
    margin-right: 11px;
    color: var(--markdown-text-color, var(--ai-text, var(--el-text-color-primary, #1f2329)));
  }

  ol ul,
  ol ul > li,
  ul ul,
  ul ul li {
    font-size: 15px;
    list-style: none;
    margin-left: 6px;
    margin-bottom: 4px;
  }

  ul ul ul,
  ul ul ul li,
  ol ol,
  ol ol > li,
  ol ul ul,
  ol ul ul > li,
  ul ol,
  ul ol > li {
    list-style: square;
  }

  blockquote {
    margin: 8px 0;
    padding-left: 12px;
    border-left: 3px solid
      color-mix(in srgb, var(--ai-primary, var(--el-color-primary)) 28%, transparent 72%);
    color: var(--markdown-text-color, var(--ai-text, var(--el-text-color-primary, #1f2329)));
  }

  :deep(.markdown-view__code-block) {
    position: relative;
    margin: 8px 0 10px;
  }

  :deep(.markdown-view__copy-button) {
    position: absolute;
    top: 8px;
    right: 8px;
    border: 0;
    border-radius: 8px;
    padding: 3px 8px;
    background: color-mix(in srgb, #000000 58%, transparent 42%);
    color: #fff;
    font-size: 11px;
    line-height: 1.2;
    cursor: pointer;
  }

  :deep(.markdown-view__copy-button:hover) {
    background: color-mix(in srgb, #000000 72%, transparent 28%);
  }
}
</style>
