<template>
  <div ref="rootEl" class="psd-set-table-image-cell">
    <div v-if="imageCount > 0" class="psd-set-table-image-cell__card">
      <img
        v-if="shouldRenderImage && renderedUrl"
        :src="renderedUrl"
        :alt="name || '套图图片'"
        loading="lazy"
        decoding="async"
        fetchpriority="low"
        draggable="false"
        class="psd-set-table-image-cell__image"
        @click.stop="emit('preview', safeIndex)"
        @error="handleImageError"
      />
      <div v-else class="psd-set-table-image-cell__image psd-set-table-image-cell__image--placeholder"></div>

      <button
        v-if="imageCount > 1"
        type="button"
        aria-label="上一张套图图片"
        title="上一张"
        class="psd-set-table-image-cell__nav psd-set-table-image-cell__nav--left"
        @click.stop="emit('shift', -1)"
      >
        <el-icon>
          <ArrowLeft />
        </el-icon>
      </button>
      <button
        v-if="imageCount > 1"
        type="button"
        aria-label="下一张套图图片"
        title="下一张"
        class="psd-set-table-image-cell__nav psd-set-table-image-cell__nav--right"
        @click.stop="emit('shift', 1)"
      >
        <el-icon>
          <ArrowRight />
        </el-icon>
      </button>

      <div class="psd-set-table-image-cell__badge">{{ safeIndex + 1 }}/{{ imageCount }}</div>
      <div v-if="imageCount > 1" class="psd-set-table-image-cell__count">共 {{ imageCount }} 张</div>
    </div>

    <span v-else class="psd-set-table-image-cell__empty">无</span>

    <el-tooltip v-if="imageCount > 0" content="批量下载该套图的所有图片" placement="top">
      <el-button
        type="primary"
        link
        size="small"
        class="psd-set-table-image-cell__action"
        @click.stop="emit('download')"
      >
        全部下载
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import { getFastPreviewImageUrl } from "@/utils/image";

const props = withDefaults(
  defineProps<{
    rowId?: string | number | null;
    name?: string;
    images?: unknown[];
    currentIndex?: number;
  }>(),
  {
    rowId: null,
    name: "",
    images: () => [],
    currentIndex: 0,
  },
);

const emit = defineEmits<{
  (event: "shift", delta: number): void;
  (event: "preview", index: number): void;
  (event: "download"): void;
}>();

const rootEl = ref<HTMLElement | null>(null);
const hasEnteredViewport = ref(false);
const fastImageFailed = ref(false);
let intersectionObserver: IntersectionObserver | null = null;

const imageList = computed(() =>
  Array.isArray(props.images)
    ? props.images.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    : [],
);

const imageCount = computed(() => imageList.value.length);

const safeIndex = computed(() => {
  if (imageCount.value <= 0) {
    return 0;
  }
  const rawIndex = Number.isFinite(props.currentIndex) ? Math.trunc(props.currentIndex || 0) : 0;
  return Math.min(Math.max(rawIndex, 0), imageCount.value - 1);
});

const currentUrl = computed(() => imageList.value[safeIndex.value] || imageList.value[0] || "");

const fastPreviewUrl = computed(() =>
  getFastPreviewImageUrl(currentUrl.value, {
    width: 240,
    height: 180,
    quality: 68,
    sizeLimit: "100k!",
  }) || currentUrl.value,
);

const renderedUrl = computed(() => (fastImageFailed.value ? currentUrl.value : fastPreviewUrl.value));
const shouldRenderImage = computed(() => hasEnteredViewport.value && imageCount.value > 0);

function markVisibleIfNearViewport() {
  if (hasEnteredViewport.value || typeof window === "undefined") {
    return;
  }

  const element = rootEl.value;
  if (!element) {
    return;
  }

  const rect = element.getBoundingClientRect();
  const preloadDistance = 320;
  if (rect.bottom >= -preloadDistance && rect.top <= window.innerHeight + preloadDistance) {
    hasEnteredViewport.value = true;
  }
}

function setupIntersectionObserver() {
  if (typeof window === "undefined") {
    hasEnteredViewport.value = true;
    return;
  }

  if (!("IntersectionObserver" in window)) {
    hasEnteredViewport.value = true;
    return;
  }

  const element = rootEl.value;
  if (!element) {
    return;
  }

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) {
        hasEnteredViewport.value = true;
      }
    },
    { root: null, rootMargin: "320px 0px", threshold: 0.01 },
  );
  intersectionObserver.observe(element);
}

function handleImageError() {
  if (!fastImageFailed.value && renderedUrl.value !== currentUrl.value) {
    fastImageFailed.value = true;
  }
}

watch(
  () => [props.rowId, currentUrl.value],
  () => {
    fastImageFailed.value = false;
    requestAnimationFrame(markVisibleIfNearViewport);
  },
);

onMounted(() => {
  markVisibleIfNearViewport();
  setupIntersectionObserver();
});

onBeforeUnmount(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
});
</script>

<style scoped>
.psd-set-table-image-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  content-visibility: auto;
  contain-intrinsic-size: 140px 180px;
}

.psd-set-table-image-cell__card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 112px;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  contain: layout paint;
}

.psd-set-table-image-cell__card:hover {
  border-color: rgba(64, 158, 255, 0.45);
}

.psd-set-table-image-cell__image {
  display: block;
  width: 100%;
  height: 100%;
  padding: 8px;
  border-radius: 8px;
  object-fit: contain;
  cursor: zoom-in;
  box-sizing: border-box;
  user-select: none;
}

.psd-set-table-image-cell__image--placeholder {
  cursor: default;
  background:
    linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent),
    var(--el-fill-color-light);
  background-size: 180px 100%, 100% 100%;
}

.psd-set-table-image-cell__nav {
  position: absolute;
  top: 50%;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: rgba(15, 23, 42, 0.58);
  cursor: pointer;
  opacity: 0;
  transform: translateY(-50%);
  transition:
    opacity 0.15s ease,
    background-color 0.15s ease;
}

.psd-set-table-image-cell__card:hover .psd-set-table-image-cell__nav,
.psd-set-table-image-cell__nav:focus-visible {
  opacity: 1;
}

.psd-set-table-image-cell__nav:hover {
  background: rgba(15, 23, 42, 0.78);
}

.psd-set-table-image-cell__nav:focus-visible {
  outline: 2px solid rgba(64, 158, 255, 0.72);
  outline-offset: 1px;
}

.psd-set-table-image-cell__nav--left {
  left: 6px;
}

.psd-set-table-image-cell__nav--right {
  right: 6px;
}

.psd-set-table-image-cell__nav .el-icon {
  font-size: 14px;
}

@media (hover: none) {
  .psd-set-table-image-cell__nav {
    opacity: 0.88;
  }
}

.psd-set-table-image-cell__badge {
  position: absolute;
  right: 6px;
  top: 6px;
  z-index: 2;
  min-width: 24px;
  height: 16px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.58);
  color: #fff;
  font-size: 9px;
  line-height: 16px;
  text-align: center;
}

.psd-set-table-image-cell__count {
  position: absolute;
  left: 6px;
  top: 6px;
  z-index: 2;
  height: 16px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.72);
  color: #fff;
  font-size: 9px;
  line-height: 16px;
}

.psd-set-table-image-cell__empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 112px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-lighter);
  font-size: 12px;
}

.psd-set-table-image-cell__action {
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.08);
}
</style>
