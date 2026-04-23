<template>
  <div ref="contentRef" v-dompurify-html="renderedMarkdown" class="markdown-view"></div>
</template>

<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
import { Marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/vs2015.min.css";

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
});

const message = useMessage();
const { copy } = useClipboard();
const contentRef = ref<HTMLElement | null>(null);

const markdown = new Marked({
  gfm: true,
  breaks: true,
});

markdown.use({
  renderer: {
    image(token) {
      const rawHref = String(token.href || "").trim();
      const rawText = String(token.text || "").trim();
      const rawTitle = String(token.title || "").trim();

      if (!rawHref) {
        return rawText || "";
      }

      const alt = rawText || rawTitle || "image";
      const caption = rawTitle || rawText;

      return [
        '<figure class="markdown-view__image-block">',
        `<img class="markdown-view__image" src="${rawHref}" alt="${alt}" loading="lazy" />`,
        caption ? `<figcaption class="markdown-view__image-caption">${caption}</figcaption>` : "",
        "</figure>",
      ].join("");
    },
    link(token) {
      const rawHref = String(token.href || "").trim();
      const rawTitle = String(token.title || "").trim();
      const text = token.text || rawHref;

      if (!rawHref) {
        return text;
      }

      const titleAttr = rawTitle ? ` title="${rawTitle}"` : "";
      return `<a href="${rawHref}" target="_blank" rel="noopener noreferrer nofollow"${titleAttr}>${text}</a>`;
    },
    code(token) {
      const rawCode = String(token.text || "");
      const language = String(token.lang || "")
        .trim()
        .toLowerCase();
      const highlighted =
        language && hljs.getLanguage(language)
          ? hljs.highlight(rawCode, { language }).value
          : hljs.highlightAuto(rawCode).value;
      const encoded = encodeURIComponent(rawCode);
      const languageClass = language ? ` language-${language}` : "";

      return [
        '<pre class="markdown-view__code-block">',
        `<button class="markdown-view__copy-button" data-copy="${encoded}" type="button">复制</button>`,
        `<code class="hljs${languageClass}">${highlighted}</code>`,
        "</pre>",
      ].join("");
    },
  },
});

const escapeAsHtml = (content: string) => {
  return String(content || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");
};

const renderedMarkdown = computed(() => {
  try {
    return markdown.parse(String(props.content || "")) as string;
  } catch (error) {
    console.error("[MarkdownView] render failed:", error);
    return escapeAsHtml(String(props.content || ""));
  }
});

const handleContentClick = async (event: Event) => {
  const target = event.target as HTMLElement | null;
  const button = target?.closest(".markdown-view__copy-button") as HTMLElement | null;
  if (!button) {
    return;
  }

  const encodedText = String(button.dataset.copy || "");
  if (!encodedText) {
    return;
  }

  try {
    await copy(decodeURIComponent(encodedText));
    message.success("复制成功!");
  } catch (error) {
    console.error("[MarkdownView] copy failed:", error);
    message.error("复制失败");
  }
};

onMounted(() => {
  contentRef.value?.addEventListener("click", handleContentClick);
});

onBeforeUnmount(() => {
  contentRef.value?.removeEventListener("click", handleContentClick);
});
</script>

<style lang="scss">
.markdown-view {
  --markdown-font-size: 13px;
  --markdown-line-height: 1.62;
  --markdown-letter-spacing: -0.006em;
  --markdown-paragraph-gap: 6px;
  --markdown-block-gap: 10px;
  --markdown-heading-gap-top: 18px;
  --markdown-heading-gap-bottom: 8px;
  --markdown-list-indent: 18px;
  --markdown-inline-code-font-size: 0.92em;
  --markdown-code-font-size: 12px;
  --markdown-code-line-height: 1.65;
  --markdown-image-max-width: min(240px, 100%);
  --markdown-image-max-height: 200px;
  --markdown-code-border-color: color-mix(
    in srgb,
    var(--ai-border-color, var(--el-border-color-light)) 84%,
    transparent 16%
  );
  --markdown-code-bg: color-mix(
    in srgb,
    var(--ai-panel-bg, var(--el-bg-color-overlay)) 76%,
    var(--ai-panel-soft-bg, var(--el-fill-color-light)) 24%
  );
  --markdown-inline-code-bg: color-mix(
    in srgb,
    var(--ai-primary, var(--el-color-primary)) 8%,
    var(--ai-panel-bg, #fff) 92%
  );
  --markdown-inline-code-color: color-mix(
    in srgb,
    var(--ai-text, var(--el-text-color-primary)) 88%,
    var(--ai-primary, var(--el-color-primary)) 12%
  );
  --markdown-quote-border: color-mix(
    in srgb,
    var(--ai-primary, var(--el-color-primary)) 24%,
    transparent 76%
  );
  --markdown-divider-color: color-mix(
    in srgb,
    var(--ai-border-color, var(--el-border-color-light)) 78%,
    transparent 22%
  );
  font-family: "PingFang SC", "SF Pro Display", "Helvetica Neue", sans-serif;
  font-size: var(--markdown-font-size);
  font-weight: 400;
  line-height: var(--markdown-line-height);
  letter-spacing: var(--markdown-letter-spacing);
  text-align: left;
  color: var(--markdown-text-color, var(--ai-text, var(--el-text-color-primary, #1f2329)));
  max-width: 100%;
  word-break: break-word;

  > :first-child {
    margin-top: 0 !important;
  }

  > :last-child {
    margin-bottom: 0 !important;
  }

  :deep(pre) {
    margin: 0;
  }

  :deep(code.hljs) {
    display: block;
    width: auto;
    max-width: 100%;
    overflow-x: auto;
    margin: 0;
    border-radius: inherit;
    padding: 30px 12px 12px;
    background: transparent;
    font-size: var(--markdown-code-font-size);
    line-height: var(--markdown-code-line-height);
  }

  a {
    color: var(--ai-primary, var(--el-color-primary));
    text-decoration: none;
    border-bottom: 1px solid
      color-mix(in srgb, var(--ai-primary, var(--el-color-primary)) 18%, transparent 82%);
    transition:
      color 0.18s ease,
      border-color 0.18s ease;
  }

  a:hover {
    color: color-mix(in srgb, var(--ai-primary, var(--el-color-primary)) 86%, #000 14%);
    border-bottom-color: color-mix(
      in srgb,
      var(--ai-primary, var(--el-color-primary)) 32%,
      transparent 68%
    );
  }

  :deep(.markdown-view__image-block) {
    display: block;
    margin: var(--markdown-block-gap) 0;
    max-width: var(--markdown-image-max-width);
  }

  :deep(.markdown-view__image) {
    display: block;
    width: auto !important;
    height: auto !important;
    max-width: var(--markdown-image-max-width) !important;
    max-height: var(--markdown-image-max-height) !important;
    border: 1px solid var(--ai-line, var(--el-border-color-light));
    border-radius: 10px;
    background: var(--ai-surface-soft, var(--el-fill-color-light));
    object-fit: contain;
    overflow: hidden;
  }

  :deep(img) {
    max-width: var(--markdown-image-max-width) !important;
    max-height: var(--markdown-image-max-height) !important;
    height: auto !important;
  }

  :deep(.markdown-view__image-caption) {
    margin-top: 6px;
    font-size: 11px;
    line-height: 1.5;
    color: var(--ai-text-secondary, var(--el-text-color-secondary));
  }

  strong,
  b {
    color: var(--markdown-heading-color, var(--ai-text, var(--el-text-color-primary, #1f2329)));
  }

  p {
    margin: 0 0 var(--markdown-paragraph-gap);
  }

  p + p {
    margin-top: 2px;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: var(--markdown-heading-color, var(--ai-text, var(--el-text-color-primary, #1f2329)));
    margin: var(--markdown-heading-gap-top) 0 var(--markdown-heading-gap-bottom);
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.02em;
  }

  h1 {
    font-size: 20px;
  }

  h2 {
    font-size: 18px;
  }

  h3 {
    font-size: 16px;
  }

  h4 {
    font-size: 15px;
  }

  h5,
  h6 {
    font-size: 14px;
  }

  ul,
  ol {
    margin: 0 0 var(--markdown-paragraph-gap);
    padding-left: calc(var(--markdown-list-indent) + 4px);
    font-size: inherit;
    line-height: inherit;
    color: var(--markdown-text-color, var(--ai-text, var(--el-text-color-primary, #1f2329)));
  }

  li {
    margin: 0;
    padding-left: 2px;
  }

  li + li {
    margin-top: 4px;
  }

  li > p {
    margin: 0;
  }

  ol > li {
    list-style-type: decimal;
  }

  ul > li {
    list-style-type: disc;
  }

  ul ul,
  ul ol,
  ol ul,
  ol ol {
    margin-top: 4px;
    margin-bottom: 0;
  }

  blockquote {
    margin: var(--markdown-block-gap) 0;
    padding-left: 12px;
    border-left: 3px solid var(--markdown-quote-border);
    color: var(--ai-text-secondary, var(--el-text-color-secondary));
  }

  blockquote > :last-child {
    margin-bottom: 0;
  }

  hr {
    margin: 14px 0;
    border: 0;
    border-top: 1px solid var(--markdown-divider-color);
  }

  table {
    width: 100%;
    margin: var(--markdown-block-gap) 0;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 12px;
    line-height: 1.6;
  }

  th,
  td {
    padding: 7px 8px;
    border: 1px solid var(--markdown-divider-color);
    text-align: left;
    vertical-align: top;
  }

  th {
    font-weight: 600;
    background: color-mix(
      in srgb,
      var(--ai-panel-soft-bg, var(--el-fill-color-light)) 78%,
      transparent 22%
    );
  }

  code:not(.hljs) {
    display: inline;
    padding: 1px 5px;
    border-radius: 6px;
    background: var(--markdown-inline-code-bg);
    color: var(--markdown-inline-code-color);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: var(--markdown-inline-code-font-size);
    line-height: 1.45;
  }

  :deep(.markdown-view__code-block) {
    position: relative;
    margin: var(--markdown-block-gap) 0;
    overflow: hidden;
    border: 1px solid var(--markdown-code-border-color);
    border-radius: 12px;
    background: var(--markdown-code-bg);
  }

  :deep(.markdown-view__copy-button) {
    position: absolute;
    top: 9px;
    right: 9px;
    border: 0;
    border-radius: 8px;
    padding: 3px 7px;
    background: color-mix(in srgb, #000000 58%, transparent 42%);
    color: #fff;
    font-size: 10px;
    line-height: 1.2;
    cursor: pointer;
  }

  :deep(.markdown-view__copy-button:hover) {
    background: color-mix(in srgb, #000000 72%, transparent 28%);
  }
}
</style>
