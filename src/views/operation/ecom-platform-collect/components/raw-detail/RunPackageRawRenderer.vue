<template>
  <div class="run-package-renderer">
    <div class="run-package-renderer__hero">
      <div class="run-package-renderer__hero-main">
        <div class="run-package-renderer__eyebrow">
          {{ platformLabel }} / {{ taskTypeLabel }}
        </div>
        <div class="run-package-renderer__title">
          {{ record.taskName || "采集执行结果包" }}
        </div>
        <div class="run-package-renderer__summary">
          {{ summaryMessage }}
        </div>
      </div>
      <div class="run-package-renderer__hero-side">
        <div class="run-package-renderer__status">
          <span>运行状态</span>
          <el-tag size="small" :type="runStatusTagType">
            {{ runStatusLabel }}
          </el-tag>
        </div>
        <div class="run-package-renderer__stat-grid">
          <div class="run-package-renderer__stat-card">
            <span>记录数</span>
            <strong>{{ recordsCount }}</strong>
          </div>
          <div class="run-package-renderer__stat-card">
            <span>截图数</span>
            <strong>{{ snapshotCount }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="run-package-renderer__section">
      <div class="run-package-renderer__section-title">执行信息</div>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="任务 ID">
          <span class="mono">{{ record.taskId || "-" }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="运行 ID">
          <span class="mono">{{ record.runId || "-" }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="采集时间">
          <span>{{ formatDateTime(record.capturedAt) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="完成时间">
          <span>{{ formatDateTime(record.finishedAt || record.run?.finishedAt) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="执行客户端">
          <span class="mono">
            {{
              record.run?.assignedMachineCode ||
              record.run?.assignedClientId ||
              record.summaryData?.machineCode ||
              "-"
            }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="结果包类型">
          <span class="mono">{{ packageType }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div v-if="summaryEntries.length" class="run-package-renderer__section">
      <div class="run-package-renderer__section-title">执行摘要</div>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item
          v-for="item in summaryEntries"
          :key="item.label"
          :label="item.label"
        >
          <span class="run-package-renderer__summary-value">{{ item.value }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div v-if="snapshots.length" class="run-package-renderer__section">
      <div class="run-package-renderer__section-title">执行截图</div>
      <div class="run-package-renderer__snapshot-grid">
        <div
          v-for="snapshot in snapshots"
          :key="snapshot.url || snapshot.path || snapshot.key || ''"
          class="run-package-renderer__snapshot-card"
        >
          <el-image
            v-if="snapshot.url"
            :src="snapshot.url"
            fit="cover"
            preview-teleported
            :preview-src-list="snapshotUrls"
            class="run-package-renderer__snapshot-image"
          />
          <div v-else class="run-package-renderer__snapshot-placeholder">
            本地截图未上传
          </div>
          <div class="run-package-renderer__snapshot-meta">
            <div class="run-package-renderer__snapshot-label">
              {{ snapshot.label || "截图" }}
            </div>
            <div
              v-if="snapshot.key || snapshot.path"
              class="mono run-package-renderer__snapshot-ref"
            >
              {{ snapshot.key || snapshot.path }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="run-package-renderer__section">
      <div class="run-package-renderer__section-title">采集记录</div>
      <el-empty v-if="!recordRows.length" description="本次执行没有返回记录" />
      <el-collapse v-else>
        <el-collapse-item
          v-for="item in recordRows"
          :key="item.id"
          :name="item.id"
        >
          <template #title>
            <div class="run-package-renderer__record-title">
              <span class="run-package-renderer__record-index">#{{ item.index }}</span>
              <span class="run-package-renderer__record-name">{{ item.title }}</span>
              <span class="mono run-package-renderer__record-key">
                {{ item.recordKey || "-" }}
              </span>
            </div>
          </template>

          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="记录标识">
              <span class="mono">{{ item.recordKey || "-" }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="来源链接">
              <el-link
                v-if="item.sourceUrl"
                :href="item.sourceUrl"
                target="_blank"
                type="primary"
              >
                {{ getShortUrl(item.sourceUrl) }}
              </el-link>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="记录采集时间">
              <span>{{ formatDateTime(item.capturedAt) }}</span>
            </el-descriptions-item>
          </el-descriptions>

          <pre class="run-package-renderer__json">{{ item.jsonText }}</pre>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="run-package-renderer__section">
      <div class="run-package-renderer__section-title">结果包 JSON</div>
      <pre class="run-package-renderer__json">{{ packageJson }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type {
  EcomPlatformCollectCatalog,
  EcomPlatformRawRecord,
} from "@/api/operation/ecomPlatformCollect";
import { normalizeDisplayValue, normalizeSnapshotItems, readPathValue } from "./helpers";
import {
  formatDateTime,
  formatJson,
  getPlatformLabel,
  getRawPackageRecords,
  getRawRecordsCount,
  getRawRunStatus,
  getRawSummaryMessage,
  getRunStatusLabel,
  getRunStatusTagType,
  getShortUrl,
  getSnapshotCount,
  getTaskTypeLabel,
} from "../../shared";

const props = defineProps<{
  record: EcomPlatformRawRecord;
  catalog: EcomPlatformCollectCatalog;
}>();

const RECORD_TITLE_PATHS = [
  "detailData.title",
  "title",
  "listingData.title",
  "name",
  "productName",
  "keyword",
  "pageTitle",
];
const RECORD_KEY_PATHS = ["recordKey", "asin", "itemId", "sku", "id"];
const RECORD_LINK_PATHS = [
  "detailData.sourceUrl",
  "sourceUrl",
  "url",
  "originalSourceUrl",
  "listingData.sourceUrl",
];
const RECORD_CAPTURED_AT_PATHS = [
  "capturedAt",
  "collectedAt",
  "detailData.capturedAt",
  "listingData.capturedAt",
];

const pickRecordValue = (record: Record<string, any>, paths: string[]) => {
  for (const path of paths) {
    const resolved = readPathValue(record, path);
    const normalized = normalizeDisplayValue(resolved);
    if (normalized) {
      return normalized;
    }
  }
  return "";
};

const rawPackage = computed(() =>
  props.record?.collectData && typeof props.record.collectData === "object"
    ? props.record.collectData
    : {},
);
const platformLabel = computed(() =>
  getPlatformLabel(props.catalog, props.record.platform),
);
const taskTypeLabel = computed(() =>
  getTaskTypeLabel(props.catalog, props.record.platform, props.record.taskType),
);
const runStatus = computed(() => getRawRunStatus(props.record));
const runStatusLabel = computed(() => getRunStatusLabel(runStatus.value));
const runStatusTagType = computed(() => getRunStatusTagType(runStatus.value));
const summaryMessage = computed(() => getRawSummaryMessage(props.record));
const recordsCount = computed(() => getRawRecordsCount(props.record));
const snapshotCount = computed(() =>
  Number(props.record.snapshotCount) || getSnapshotCount(props.record.snapshotData),
);
const packageType = computed(() =>
  String(rawPackage.value?.packageType || "run_result").trim() || "run_result",
);
const snapshots = computed(() =>
  normalizeSnapshotItems(rawPackage.value?.snapshots || props.record.snapshotData),
);
const snapshotUrls = computed(() =>
  snapshots.value
    .map((item) => String(item.url || "").trim())
    .filter(Boolean),
);
const summaryEntries = computed(() => {
  const summary =
    props.record?.summaryData && typeof props.record.summaryData === "object"
      ? props.record.summaryData
      : rawPackage.value?.summary && typeof rawPackage.value.summary === "object"
        ? rawPackage.value.summary
        : {};

  const fieldMap: Array<[string, any]> = [
    ["消息", summary.message],
    ["任务类型", summary.taskType || props.record.taskType],
    ["平台", summary.platform || props.record.platform],
    ["记录数", summary.recordsCount],
    ["截图数", summary.snapshots?.length || props.record.snapshotCount],
    ["更新时间", summary.updatedAt],
    ["异常信息", props.record.run?.errorMessage],
  ];

  return fieldMap
    .map(([label, value]) => ({
      label,
      value: normalizeDisplayValue(value),
    }))
    .filter((item) => item.value);
});
const recordRows = computed(() =>
  getRawPackageRecords(props.record).map((item: any, index: number) => {
    const title = pickRecordValue(item, RECORD_TITLE_PATHS) || `记录 ${index + 1}`;
    return {
      id: `${props.record.id}-${index + 1}`,
      index: index + 1,
      title,
      recordKey: pickRecordValue(item, RECORD_KEY_PATHS),
      sourceUrl: pickRecordValue(item, RECORD_LINK_PATHS),
      capturedAt: pickRecordValue(item, RECORD_CAPTURED_AT_PATHS),
      jsonText: formatJson(item),
    };
  }),
);
const packageJson = computed(() => formatJson(rawPackage.value));
</script>

<style scoped lang="scss">
.run-package-renderer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.run-package-renderer__hero,
.run-package-renderer__section {
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
}

.run-package-renderer__hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.run-package-renderer__hero-main {
  min-width: 0;
}

.run-package-renderer__eyebrow {
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.run-package-renderer__title {
  margin-top: 6px;
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.5;
  word-break: break-word;
}

.run-package-renderer__summary {
  margin-top: 8px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.7;
}

.run-package-renderer__hero-side {
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.run-package-renderer__status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.run-package-renderer__stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.run-package-renderer__stat-card {
  padding: 12px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.run-package-renderer__stat-card strong {
  display: block;
  margin-top: 6px;
  color: var(--el-text-color-primary);
  font-size: 22px;
  line-height: 1.2;
}

.run-package-renderer__section-title {
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.run-package-renderer__summary-value {
  word-break: break-word;
}

.run-package-renderer__snapshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.run-package-renderer__snapshot-card {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.run-package-renderer__snapshot-image {
  width: 100%;
  height: 140px;
  background: var(--el-fill-color-light);
}

.run-package-renderer__snapshot-placeholder {
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

.run-package-renderer__snapshot-meta {
  padding: 10px;
}

.run-package-renderer__snapshot-label {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 500;
}

.run-package-renderer__snapshot-ref {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  word-break: break-all;
}

.run-package-renderer__record-title {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 12px;
}

.run-package-renderer__record-index {
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
}

.run-package-renderer__record-name {
  flex: 1;
  min-width: 0;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.run-package-renderer__record-key {
  flex: none;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.run-package-renderer__json {
  margin: 12px 0 0;
  padding: 16px;
  overflow: auto;
  border-radius: 12px;
  background: #111827;
  color: #e5eefb;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.mono {
  font-family:
    "SFMono-Regular",
    "JetBrains Mono",
    "Consolas",
    "Liberation Mono",
    monospace;
}

@media (max-width: 900px) {
  .run-package-renderer__hero {
    flex-direction: column;
  }

  .run-package-renderer__hero-side {
    min-width: 0;
  }
}
</style>
