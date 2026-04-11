<template>
  <div class="platform-raw-renderer">
    <div class="platform-raw-renderer__hero">
      <div class="platform-raw-renderer__hero-main">
        <div class="platform-raw-renderer__platform">{{ platformLabel }}</div>
        <div class="platform-raw-renderer__title">{{ heroTitle }}</div>
        <div v-if="heroSubtitle" class="platform-raw-renderer__subtitle">{{ heroSubtitle }}</div>
      </div>
      <div class="platform-raw-renderer__hero-side">
        <div v-if="heroPrice" class="platform-raw-renderer__price">{{ heroPrice }}</div>
        <div class="platform-raw-renderer__meta">
          <span>记录标识</span>
          <span class="mono">{{ recordIdentity }}</span>
        </div>
        <div class="platform-raw-renderer__meta">
          <span>采集时间</span>
          <span>{{ formatDateTime(record.capturedAt) }}</span>
        </div>
      </div>
    </div>

    <div v-if="imageList.length" class="platform-raw-renderer__section">
      <div class="platform-raw-renderer__section-title">商品图片</div>
      <div class="platform-raw-renderer__image-grid">
        <el-image
          v-for="image in imageList"
          :key="image"
          :src="image"
          fit="cover"
          preview-teleported
          :preview-src-list="imageList"
          class="platform-raw-renderer__image"
        />
      </div>
    </div>

    <div v-if="detailRows.length" class="platform-raw-renderer__section">
      <div class="platform-raw-renderer__section-title">结构化信息</div>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item
          v-for="item in detailRows"
          :key="item.label"
          :label="item.label"
          min-width="140"
        >
          <span class="platform-raw-renderer__value">{{ item.value }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="platform-raw-renderer__section">
      <div class="platform-raw-renderer__section-title">来源信息</div>
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="来源链接">
          <el-link
            v-if="sourceUrl"
            :href="sourceUrl"
            target="_blank"
            type="primary"
          >
            {{ sourceUrl }}
          </el-link>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="任务 ID">
          <span class="mono">{{ record.taskId }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="运行 ID">
          <span class="mono">{{ record.runId }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div v-if="snapshots.length" class="platform-raw-renderer__section">
      <div class="platform-raw-renderer__section-title">执行截图</div>
      <div class="platform-raw-renderer__snapshot-grid">
        <div
          v-for="snapshot in snapshots"
          :key="`${snapshot.url || snapshot.path || snapshot.key || ''}`"
          class="platform-raw-renderer__snapshot-card"
        >
          <el-image
            v-if="snapshot.url"
            :src="snapshot.url"
            fit="cover"
            preview-teleported
            :preview-src-list="snapshotUrls"
            class="platform-raw-renderer__snapshot-image"
          />
          <div v-else class="platform-raw-renderer__snapshot-placeholder">
            本地截图未上传
          </div>
          <div class="platform-raw-renderer__snapshot-meta">
            <div class="platform-raw-renderer__snapshot-label">
              {{ snapshot.label || "截图" }}
            </div>
            <div v-if="snapshot.key" class="mono platform-raw-renderer__snapshot-key">
              {{ snapshot.key }}
            </div>
            <div
              v-else-if="snapshot.path"
              class="mono platform-raw-renderer__snapshot-path"
            >
              {{ snapshot.path }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="platform-raw-renderer__section">
      <div class="platform-raw-renderer__section-title">原始 JSON</div>
      <pre class="platform-raw-renderer__json">{{ formatJson(collectData) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EcomPlatformRawRecord } from "@/api/operation/ecomPlatformCollect";
import {
  extractStringList,
  getDefaultHeroTitle,
  normalizeSnapshotItems,
  pickFirstValue,
  resolveFieldValue,
  type PlatformRawFieldDefinition,
} from "./helpers";
import { formatDateTime, formatJson, getRawLink } from "../../shared";

const props = withDefaults(
  defineProps<{
    record: EcomPlatformRawRecord;
    platformLabel: string;
    titlePaths?: string[];
    subtitlePaths?: string[];
    pricePaths?: string[];
    imagePaths?: string[];
    detailFields?: PlatformRawFieldDefinition[];
    imageExcludePatterns?: string[];
    imageLimit?: number;
  }>(),
  {
    titlePaths: () => [],
    subtitlePaths: () => [],
    pricePaths: () => [],
    imagePaths: () => [],
    detailFields: () => [],
    imageExcludePatterns: () => [],
    imageLimit: 8,
  },
);

const collectData = computed(() =>
  props.record?.collectData && typeof props.record.collectData === "object"
    ? props.record.collectData
    : {},
);

const heroTitle = computed(() => {
  const resolved = pickFirstValue(collectData.value, props.titlePaths);
  return resolved ? resolveFieldValue(collectData.value, {
    label: "标题",
    paths: props.titlePaths,
  }) : getDefaultHeroTitle(props.record);
});

const heroSubtitle = computed(() =>
  resolveFieldValue(collectData.value, {
    label: "副标题",
    paths: props.subtitlePaths,
  }),
);

const heroPrice = computed(() =>
  resolveFieldValue(collectData.value, {
    label: "价格",
    paths: props.pricePaths,
  }),
);

const imageList = computed(() => {
  const candidates = extractStringList(collectData.value, props.imagePaths);
  return Array.from(new Set(candidates.filter(Boolean)))
    .filter(
      (item) =>
        !props.imageExcludePatterns.some((pattern) =>
          item.toLowerCase().includes(String(pattern).toLowerCase()),
        ),
    )
    .slice(0, props.imageLimit);
});

const detailRows = computed(() =>
  props.detailFields
    .map((item) => ({
      label: item.label,
      value: resolveFieldValue(collectData.value, item),
    }))
    .filter((item) => item.value),
);

const snapshots = computed(() => normalizeSnapshotItems(props.record.snapshotData));
const snapshotUrls = computed(() =>
  snapshots.value
    .map((item) => String(item.url || "").trim())
    .filter(Boolean),
);
const recordIdentity = computed(
  () =>
    resolveFieldValue(collectData.value, {
      label: "记录标识",
      paths: ["recordKey", "asin", "itemId", "sku", "id"],
    }) || "-",
);
const sourceUrl = computed(() => getRawLink(props.record));
</script>

<style scoped lang="scss">
.platform-raw-renderer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.platform-raw-renderer__hero,
.platform-raw-renderer__section {
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
}

.platform-raw-renderer__hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.platform-raw-renderer__hero-main {
  min-width: 0;
}

.platform-raw-renderer__platform {
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.platform-raw-renderer__title {
  margin-top: 6px;
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.5;
  word-break: break-word;
}

.platform-raw-renderer__subtitle {
  margin-top: 8px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.7;
}

.platform-raw-renderer__hero-side {
  flex: none;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.platform-raw-renderer__price {
  color: var(--el-color-danger);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.platform-raw-renderer__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.platform-raw-renderer__section-title {
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.platform-raw-renderer__image-grid,
.platform-raw-renderer__snapshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.platform-raw-renderer__image,
.platform-raw-renderer__snapshot-image {
  width: 100%;
  height: 140px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
}

.platform-raw-renderer__snapshot-card {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.platform-raw-renderer__snapshot-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 140px;
  padding: 12px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-align: center;
}

.platform-raw-renderer__snapshot-meta {
  padding: 10px;
}

.platform-raw-renderer__snapshot-label {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 500;
}

.platform-raw-renderer__snapshot-key {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.5;
  word-break: break-all;
}

.platform-raw-renderer__snapshot-path {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.5;
  word-break: break-all;
}

.platform-raw-renderer__json {
  max-height: 420px;
  overflow: auto;
  margin: 0;
  padding: 14px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.platform-raw-renderer__value {
  white-space: pre-wrap;
  word-break: break-word;
}

.mono {
  font-family:
    "SFMono-Regular",
    "Cascadia Code",
    "Source Code Pro",
    monospace;
}

@media (max-width: 900px) {
  .platform-raw-renderer__hero {
    flex-direction: column;
  }

  .platform-raw-renderer__hero-side {
    min-width: 0;
  }
}
</style>
