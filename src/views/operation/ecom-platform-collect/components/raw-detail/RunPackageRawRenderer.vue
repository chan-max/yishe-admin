<template>
  <div class="run-package-renderer">
    <div class="run-package-renderer__hero">
      <div class="run-package-renderer__hero-main">
        <div class="run-package-renderer__eyebrow">
          {{ platformLabel }} / {{ taskTypeLabel }}
        </div>
        <div class="run-package-renderer__title">
          {{ packageTitle }}
        </div>
        <div class="run-package-renderer__summary">
          {{ summaryMessage }}
        </div>
      </div>
      <div class="run-package-renderer__hero-side">
        <div class="run-package-renderer__stat-grid">
          <div class="run-package-renderer__stat-card">
            <span>{{ t('operation.recordCount') }}</span>
            <strong>{{ recordsCount }}</strong>
          </div>
          <div class="run-package-renderer__stat-card">
            <span>{{ t('operation.snapshotCount') }}</span>
            <strong>{{ snapshotCount }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="run-package-renderer__section">
      <div class="run-package-renderer__section-title">{{ t('operation.executionInfo') }}</div>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item :label="t('operation.taskId')">
          <span class="mono">{{ record.taskId || "-" }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('operation.runId')">
          <span class="mono">{{ record.runId || "-" }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('operation.collectTime')">
          <span>{{ formatDateTime(record.capturedAt) }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('operation.finishTime')">
          <span>{{ formatDateTime(finishedAt) }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('operation.executionClient')">
          <span class="mono">{{ machineLabel }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('operation.resultPackageType')">
          <span class="mono">{{ packageType }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div v-if="summaryEntries.length" class="run-package-renderer__section">
      <div class="run-package-renderer__section-title">{{ t('operation.executionSummary') }}</div>
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

    <div
      v-if="
        capabilityProfile.accessTags.length ||
        capabilityProfile.outputTags.length ||
        capabilityProfile.analysisHints.length ||
        capabilityProfile.notes.length
      "
      class="run-package-renderer__section"
    >
      <div class="run-package-renderer__section-title">{{ t('operation.capabilityDescription') }}</div>
      <div class="run-package-renderer__field-catalog-hint">
        {{ capabilityProfile.summary }}
      </div>

      <div class="run-package-renderer__tag-list">
        <el-tag :type="capabilityProfile.availabilityTag.type" effect="plain" size="small">
          {{ capabilityProfile.availabilityTag.label }}
        </el-tag>
        <el-tag :type="capabilityProfile.verificationTag.type" effect="plain" size="small">
          {{ capabilityProfile.verificationTag.label }}
        </el-tag>
        <el-tag
          v-for="item in capabilityProfile.accessTags"
          :key="item.label"
          :type="item.type"
          effect="plain"
          size="small"
        >
          {{ item.label }}
        </el-tag>
        <el-tag
          v-if="capabilityProfile.podTag"
          :type="capabilityProfile.podTag.type"
          effect="plain"
          size="small"
        >
          {{ capabilityProfile.podTag.label }}
        </el-tag>
      </div>

      <div v-if="capabilityProfile.outputTags.length" class="run-package-renderer__insight-block">
        <div class="run-package-renderer__insight-title">{{ t('operation.availableFieldCapabilities') }}</div>
        <div class="run-package-renderer__tag-list">
          <el-tag
            v-for="item in capabilityProfile.outputTags"
            :key="item"
            effect="plain"
            size="small"
          >
            {{ item }}
          </el-tag>
        </div>
      </div>

      <div v-if="capabilityProfile.analysisHints.length" class="run-package-renderer__insight-block">
        <div class="run-package-renderer__insight-title">{{ t('operation.recommendedAnalysisDirection') }}</div>
        <ul class="run-package-renderer__ai-list">
          <li v-for="item in capabilityProfile.analysisHints" :key="item">
            {{ item }}
          </li>
        </ul>
      </div>

      <div v-if="capabilityProfile.notes.length" class="run-package-renderer__insight-block">
        <div class="run-package-renderer__insight-title">{{ t('operation.limitationsAndNotes') }}</div>
        <ul class="run-package-renderer__ai-list">
          <li v-for="item in capabilityProfile.notes" :key="item">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>

    <div
      v-if="
        schemaReview.packageFields.length ||
        schemaReview.recordFields.length ||
        schemaReview.undocumentedRecordFields.length ||
        schemaReview.undocumentedPackageFields.length
      "
      class="run-package-renderer__section"
    >
      <div class="run-package-renderer__section-title">{{ t('operation.fieldComparison') }}</div>
      <div class="run-package-renderer__field-catalog-hint">
        {{ t('operation.fieldComparisonHint') }}
      </div>

      <div v-if="schemaReview.packageFields.length" class="run-package-renderer__insight-block">
        <div class="run-package-renderer__insight-title">{{ t('operation.collectDataResultPackageFields') }}</div>
        <div class="run-package-renderer__field-review-grid">
          <div
            v-for="item in schemaReview.packageFields"
            :key="`package-${item.key}`"
            class="run-package-renderer__field-review-card"
          >
            <div class="run-package-renderer__field-head">
              <code>{{ item.key }}</code>
              <el-tag size="small" effect="plain" :type="item.present ? 'success' : 'warning'">
                {{ item.present ? t('operation.returned') : t('operation.notReturned') }}
              </el-tag>
            </div>
            <div class="run-package-renderer__field-review-label">{{ item.label }}</div>
            <div v-if="item.description" class="run-package-renderer__field-review-desc">
              {{ item.description }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="schemaReview.recordFields.length" class="run-package-renderer__insight-block">
        <div class="run-package-renderer__insight-title">{{ t('operation.recordsExpectedFields') }}</div>
        <div class="run-package-renderer__field-review-grid">
          <div
            v-for="item in schemaReview.recordFields"
            :key="`record-${item.key}`"
            class="run-package-renderer__field-review-card"
          >
            <div class="run-package-renderer__field-head">
              <code>{{ item.key }}</code>
              <el-tag
                size="small"
                effect="plain"
                :type="item.found ? 'success' : item.stability === 'core' ? 'danger' : 'warning'"
              >
                {{
                  item.found
                    ? `${t('operation.coverage')} ${Math.round(item.coverageRatio * 100)}%`
                    : item.stability === "core"
                      ? t('operation.missing')
                      : t('operation.notReturned')
                }}
              </el-tag>
            </div>
            <div class="run-package-renderer__field-review-label">{{ item.label }}</div>
            <div v-if="item.description" class="run-package-renderer__field-review-desc">
              {{ item.description }}
            </div>
            <div
              v-if="item.found && item.valueTypes.length"
              class="run-package-renderer__field-review-meta"
            >
              {{ t('operation.type') }} {{ item.valueTypes.join(" / ") }}
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="schemaReview.missingCoreRecordFields.length"
        class="run-package-renderer__insight-block"
      >
        <div class="run-package-renderer__insight-title">{{ t('operation.coreFieldsNeedRecheck') }}</div>
        <div class="run-package-renderer__field-catalog-hint">
          {{
            schemaReview.missingCoreRecordFields
              .map((item) => item.label || item.key)
              .join("、")
          }}
        </div>
      </div>

      <div
        v-if="
          schemaReview.undocumentedRecordFields.length ||
          schemaReview.undocumentedPackageFields.length
        "
        class="run-package-renderer__insight-block"
      >
        <div class="run-package-renderer__insight-title">{{ t('operation.undocumentedFields') }}</div>
        <div class="run-package-renderer__field-review-grid">
          <div
            v-for="item in schemaReview.undocumentedRecordFields"
            :key="`undoc-record-${item.path}`"
            class="run-package-renderer__field-review-card"
          >
            <div class="run-package-renderer__field-head">
              <code>{{ item.path }}</code>
              <el-tag size="small" effect="plain" type="info">
                records[]
              </el-tag>
            </div>
            <div class="run-package-renderer__field-review-meta">
              {{ t('operation.coverageRate') }} {{ Math.round(item.coverageRatio * 100) }}%
            </div>
          </div>
          <div
            v-for="item in schemaReview.undocumentedPackageFields"
            :key="`undoc-package-${item}`"
            class="run-package-renderer__field-review-card"
          >
            <div class="run-package-renderer__field-head">
              <code>{{ item }}</code>
              <el-tag size="small" effect="plain" type="info">
                collectData
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="
        insights.metrics.length ||
        insights.dimensionTags.length ||
        insights.fieldCoverage.length ||
        insights.aiBrief
      "
      class="run-package-renderer__section"
    >
      <div class="run-package-renderer__section-title">{{ t('operation.resultPackageInsights') }}</div>

      <div
        v-if="insights.metrics.length"
        class="run-package-renderer__insight-grid"
      >
        <div
          v-for="item in insights.metrics"
          :key="item.label"
          class="run-package-renderer__insight-card"
        >
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small v-if="item.hint">{{ item.hint }}</small>
        </div>
      </div>

      <div v-if="insights.dimensionTags.length" class="run-package-renderer__insight-block">
        <div class="run-package-renderer__insight-title">{{ t('operation.analyzableDimensions') }}</div>
        <div class="run-package-renderer__tag-list">
          <el-tag
            v-for="tag in insights.dimensionTags"
            :key="tag"
            effect="plain"
            size="small"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>

      <div v-if="insights.fieldCoverage.length" class="run-package-renderer__insight-block">
        <div class="run-package-renderer__insight-title">{{ t('operation.fieldCoverage') }}</div>
        <div class="run-package-renderer__coverage-grid">
          <div
            v-for="item in insights.fieldCoverage"
            :key="item.key"
            class="run-package-renderer__coverage-item"
          >
            <div class="run-package-renderer__coverage-head">
              <span>{{ item.label }}</span>
              <strong>{{ Math.round(item.ratio * 100) }}%</strong>
            </div>
            <el-progress
              :percentage="Math.round(item.ratio * 100)"
              :stroke-width="8"
              :show-text="false"
            />
            <small>{{ item.coveredCount }}/{{ item.total }}</small>
          </div>
        </div>
      </div>

      <div
        v-if="
          insights.sampleKeywords.length ||
          insights.topShops.length ||
          insights.topBrands.length ||
          insights.topDomains.length
        "
        class="run-package-renderer__insight-block"
      >
        <div class="run-package-renderer__insight-title">{{ t('operation.sampleProfile') }}</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item
            v-if="insights.sampleKeywords.length"
            :label="t('operation.keywordSamples')"
          >
            {{ insights.sampleKeywords.join("、") }}
          </el-descriptions-item>
          <el-descriptions-item v-if="insights.topShops.length" :label="t('operation.shopSamples')">
            {{ insights.topShops.join("、") }}
          </el-descriptions-item>
          <el-descriptions-item v-if="insights.topBrands.length" :label="t('operation.brandSamples')">
            {{ insights.topBrands.join("、") }}
          </el-descriptions-item>
          <el-descriptions-item v-if="insights.topDomains.length" :label="t('operation.sourceDomains')">
            {{ insights.topDomains.join("、") }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-if="insights.aiBrief" class="run-package-renderer__insight-block">
        <div class="run-package-renderer__insight-title">{{ t('operation.aiAnalysisSuggestions') }}</div>
        <div class="run-package-renderer__ai-brief">{{ insights.aiBrief }}</div>
        <ul v-if="insights.aiSuggestions.length" class="run-package-renderer__ai-list">
          <li v-for="item in insights.aiSuggestions" :key="item">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>

    <div v-if="fieldCatalog.length" class="run-package-renderer__section">
      <div class="run-package-renderer__section-title">{{ t('operation.actualFieldCatalog') }}</div>
      <div class="run-package-renderer__field-catalog-hint">
        {{ t('operation.actualFieldCatalogHint') }}
      </div>
      <div class="run-package-renderer__field-catalog">
        <div
          v-for="item in fieldCatalog"
          :key="item.path"
          class="run-package-renderer__field-card"
        >
          <div class="run-package-renderer__field-head">
            <code>{{ item.path }}</code>
            <el-tag size="small" effect="plain">
              {{ item.coverageCount }}/{{ item.total }}
            </el-tag>
          </div>
          <div class="run-package-renderer__field-meta">
            <span>{{ t('operation.coverageRate') }} {{ Math.round(item.coverageRatio * 100) }}%</span>
            <span>{{ t('operation.type') }} {{ item.valueTypes.join(" / ") }}</span>
          </div>
          <div v-if="item.sampleValues.length" class="run-package-renderer__field-samples">
            <span>{{ t('operation.sample') }}</span>
            <span>{{ item.sampleValues.join("；") }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="snapshots.length" class="run-package-renderer__section">
      <div class="run-package-renderer__section-title">{{ t('operation.executionScreenshots') }}</div>
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
            {{ t('operation.localScreenshotNotUploaded') }}
          </div>
          <div class="run-package-renderer__snapshot-meta">
            <div class="run-package-renderer__snapshot-label">
              {{ snapshot.label || t('operation.screenshot') }}
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
      <div class="run-package-renderer__section-title">{{ t('operation.productPreview') }}</div>
      <div class="run-package-renderer__field-catalog-hint">
        {{ t('operation.productPreviewHint') }}
      </div>
      <el-empty v-if="!recordPreviewCards.length" :description="t('operation.noRecordsReturned')" />
      <div v-else class="run-package-renderer__preview-grid">
        <div
          v-for="item in recordPreviewCards"
          :key="item.id"
          class="run-package-renderer__preview-card"
        >
          <div class="run-package-renderer__preview-media">
            <el-image
              v-if="item.imageUrl"
              :src="item.imageUrl"
              fit="cover"
              preview-teleported
              class="run-package-renderer__preview-image"
            />
            <div v-else class="run-package-renderer__preview-placeholder">{{ t('operation.noImage') }}</div>
          </div>

          <div class="run-package-renderer__preview-content">
            <div class="run-package-renderer__preview-head">
              <span class="run-package-renderer__record-index">#{{ item.index }}</span>
              <div class="run-package-renderer__preview-title">{{ item.title }}</div>
            </div>

            <div v-if="item.subtitle" class="run-package-renderer__preview-subtitle">
              {{ item.subtitle }}
            </div>

            <div class="run-package-renderer__tag-list">
              <el-tag v-if="item.priceText" effect="plain" size="small" type="success">
                {{ item.priceText }}
              </el-tag>
              <el-tag v-if="item.shopName" effect="plain" size="small" type="info">
                {{ item.shopName }}
              </el-tag>
              <el-tag v-if="item.keyword" effect="plain" size="small" type="warning">
                {{ item.keyword }}
              </el-tag>
              <el-tag v-if="item.badgeText" effect="plain" size="small">
                {{ item.badgeText }}
              </el-tag>
              <el-tag v-if="item.ratingText" effect="plain" size="small">
                {{ item.ratingText }}
              </el-tag>
            </div>

            <div class="run-package-renderer__preview-footer">
              <span class="mono run-package-renderer__preview-key">
                {{ item.recordKey || "-" }}
              </span>
              <el-link
                v-if="item.sourceUrl"
                :href="item.sourceUrl"
                target="_blank"
                type="primary"
              >
                {{ t('operation.viewSource') }}
              </el-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="run-package-renderer__section">
      <div class="run-package-renderer__section-title">{{ t('operation.recordJson') }}</div>
      <el-empty v-if="!recordRows.length" :description="t('operation.noRecordsReturned')" />
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
            <el-descriptions-item :label="t('operation.recordIdentifier')">
              <span class="mono">{{ item.recordKey || "-" }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('operation.sourceLink')">
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
            <el-descriptions-item :label="t('operation.recordCollectTime')">
              <span>{{ formatDateTime(item.capturedAt) }}</span>
            </el-descriptions-item>
          </el-descriptions>

          <pre class="run-package-renderer__json">{{ item.jsonText }}</pre>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="run-package-renderer__section">
      <div class="run-package-renderer__section-title">{{ t('operation.resultPackageJson') }}</div>
      <pre class="run-package-renderer__json">{{ packageJson }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from 'vue-i18n';
import type {
  EcomPlatformCollectCatalog,
  EcomPlatformRawRecord,
} from "@/api/operation/ecomPlatformCollect";
import { normalizeDisplayValue, normalizeSnapshotItems, readPathValue } from "./helpers";
import { buildRunPackageCapabilityProfile } from "./runPackageCapabilityProfile";
import { buildRunPackageFieldCatalog } from "./runPackageFieldCatalog";
import { buildRunPackageInsights } from "./runPackageInsights";
import { buildRunPackageSchemaReview } from "./runPackageSchemaReview";
import {
  getTaskTypeSchema,
  formatDateTime,
  formatJson,
  getPlatformLabel,
  getRawFinishedAt,
  getRawPackage,
  getRawPackageRecords,
  getRawPackageSummary,
  getRawPlatform,
  getRawRecordsCount,
  getRawSummaryMessage,
  getRawTaskType,
  getShortUrl,
  getSnapshotCount,
  getTaskTypeLabel,
} from "../../shared";

const { t } = useI18n();

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
const RECORD_IMAGE_PATHS = [
  "detailData.imageUrl",
  "imageUrl",
  "detailData.imageUrls[0]",
  "imageUrls[0]",
  "listingData.imageUrl",
  "listingData.imageUrls[0]",
  "picture",
  "thumbnail",
];
const RECORD_SUBTITLE_PATHS = [
  "subtitle",
  "descriptionText",
  "summaryText",
  "brand",
  "detailData.brand",
  "listingData.subtitle",
];
const RECORD_PRICE_PATHS = [
  "detailData.priceText",
  "priceText",
  "price",
  "listingData.priceText",
];
const RECORD_SHOP_PATHS = [
  "detailData.shopName",
  "shopName",
  "sellerName",
  "merchantName",
  "listingData.shopName",
];
const RECORD_KEYWORD_PATHS = [
  "keyword",
  "seedKeyword",
  "query.keyword",
  "listingData.keyword",
];
const RECORD_BADGE_PATHS = [
  "badgeText",
  "approxTraffic",
  "rank",
  "listingData.badgeText",
];
const RECORD_RATING_PATHS = [
  "ratingText",
  "reviewCountText",
  "detailData.ratingText",
  "listingData.ratingText",
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
  getRawPackage(props.record),
);
const rawSummary = computed(() =>
  getRawPackageSummary(props.record),
);
const packageTitle = computed(() =>
  getTaskTypeLabel(
    props.catalog,
    getRawPlatform(props.record),
    getRawTaskType(props.record),
  ) || t('operation.runResultPackage'),
);
const platformLabel = computed(() =>
  getPlatformLabel(props.catalog, getRawPlatform(props.record)),
);
const taskTypeLabel = computed(() =>
  getTaskTypeLabel(
    props.catalog,
    getRawPlatform(props.record),
    getRawTaskType(props.record),
  ),
);
const summaryMessage = computed(() => getRawSummaryMessage(props.record));
const recordsCount = computed(() => getRawRecordsCount(props.record));
const snapshotCount = computed(() =>
  getSnapshotCount(props.record.snapshotData || rawPackage.value),
);
const finishedAt = computed(() =>
  getRawFinishedAt(props.record),
);
const machineLabel = computed(() =>
  normalizeDisplayValue(
    rawPackage.value?.debugMeta?.machineCode ||
      rawPackage.value?.debugMeta?.assignedMachineCode ||
      rawPackage.value?.debugMeta?.clientId ||
      (rawSummary.value as Record<string, any>)?.machineCode ||
      "-",
  ) || "-",
);
const packageType = computed(() =>
  String(rawPackage.value?.packageType || "run_result").trim() || "run_result",
);
const snapshots = computed(() =>
  normalizeSnapshotItems(props.record.snapshotData || rawPackage.value?.snapshots),
);
const snapshotUrls = computed(() =>
  snapshots.value
    .map((item) => String(item.url || "").trim())
    .filter(Boolean),
);
const summaryEntries = computed(() => {
  const fieldMap: Array<[string, any]> = [
    [t('operation.message'), rawSummary.value.message],
    [t('operation.recordCount'), rawSummary.value.recordsCount || recordsCount.value],
    [t('operation.snapshotCount'), rawSummary.value.snapshotCount || snapshotCount.value],
    [t('operation.updateTime'), rawSummary.value.updatedAt],
  ];

  return fieldMap
    .map(([label, value]) => ({
      label,
      value: normalizeDisplayValue(value),
    }))
    .filter((item) => item.value);
});
const insights = computed(() => buildRunPackageInsights(props.record));
const fieldCatalog = computed(() => buildRunPackageFieldCatalog(props.record));
const schemaReview = computed(() =>
  buildRunPackageSchemaReview(props.record, props.catalog),
);
const taskTypeSchema = computed(() =>
  getTaskTypeSchema(
    props.catalog,
    getRawPlatform(props.record),
    getRawTaskType(props.record),
  ),
);
const capabilityProfile = computed(() =>
  buildRunPackageCapabilityProfile({
    taskTypeSchema: taskTypeSchema.value,
    schemaReview: schemaReview.value,
  }),
);
const recordPreviewCards = computed(() =>
  getRawPackageRecords(props.record).map((item: any, index: number) => ({
    id: `${props.record.id}-preview-${index + 1}`,
    index: index + 1,
    title: pickRecordValue(item, RECORD_TITLE_PATHS) || `${t('operation.record')} ${index + 1}`,
    recordKey: pickRecordValue(item, RECORD_KEY_PATHS),
    sourceUrl: pickRecordValue(item, RECORD_LINK_PATHS),
    capturedAt: pickRecordValue(item, RECORD_CAPTURED_AT_PATHS),
    imageUrl: pickRecordValue(item, RECORD_IMAGE_PATHS),
    subtitle: pickRecordValue(item, RECORD_SUBTITLE_PATHS),
    priceText: pickRecordValue(item, RECORD_PRICE_PATHS),
    shopName: pickRecordValue(item, RECORD_SHOP_PATHS),
    keyword: pickRecordValue(item, RECORD_KEYWORD_PATHS),
    badgeText: pickRecordValue(item, RECORD_BADGE_PATHS),
    ratingText: pickRecordValue(item, RECORD_RATING_PATHS),
  })),
);
const recordRows = computed(() =>
  getRawPackageRecords(props.record).map((item: any, index: number) => {
    const title = pickRecordValue(item, RECORD_TITLE_PATHS) || `${t('operation.record')} ${index + 1}`;
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
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
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
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-color-primary);
}

.run-package-renderer__title {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.run-package-renderer__summary {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.run-package-renderer__hero-side {
  display: flex;
  min-width: 240px;
  flex-direction: column;
  gap: 12px;
}

.run-package-renderer__status {
  display: flex;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.run-package-renderer__stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.run-package-renderer__stat-card {
  padding: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 10px;
}

.run-package-renderer__stat-card strong {
  display: block;
  margin-top: 6px;
  font-size: 22px;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.run-package-renderer__section-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.run-package-renderer__summary-value {
  word-break: break-word;
}

.run-package-renderer__insight-grid,
.run-package-renderer__coverage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.run-package-renderer__insight-card,
.run-package-renderer__coverage-item {
  display: flex;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 10px;
  flex-direction: column;
  gap: 8px;
}

.run-package-renderer__insight-card span,
.run-package-renderer__coverage-head span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.run-package-renderer__insight-card strong,
.run-package-renderer__coverage-head strong {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.run-package-renderer__insight-card small,
.run-package-renderer__coverage-item small {
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.run-package-renderer__insight-block {
  margin-top: 16px;
}

.run-package-renderer__insight-title {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.run-package-renderer__tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.run-package-renderer__coverage-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.run-package-renderer__ai-brief {
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.run-package-renderer__ai-list {
  padding-left: 18px;
  margin: 10px 0 0;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.run-package-renderer__field-catalog-hint {
  margin-bottom: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.run-package-renderer__field-catalog {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.run-package-renderer__preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.run-package-renderer__preview-card {
  display: grid;
  padding: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 12px;
}

.run-package-renderer__preview-media {
  width: 96px;
  height: 96px;
}

.run-package-renderer__preview-image,
.run-package-renderer__preview-placeholder {
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  border-radius: 10px;
}

.run-package-renderer__preview-placeholder {
  display: flex;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  align-items: center;
  justify-content: center;
}

.run-package-renderer__preview-content {
  min-width: 0;
}

.run-package-renderer__preview-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.run-package-renderer__preview-title {
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.run-package-renderer__preview-subtitle {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.run-package-renderer__preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.run-package-renderer__preview-key {
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.run-package-renderer__field-card {
  padding: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.run-package-renderer__field-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.run-package-renderer__field-head code {
  overflow-wrap: anywhere;
  color: var(--el-color-primary);
}

.run-package-renderer__field-meta,
.run-package-renderer__field-samples {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.run-package-renderer__field-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.run-package-renderer__field-review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.run-package-renderer__field-review-card {
  padding: 12px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.run-package-renderer__field-review-label {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.run-package-renderer__field-review-desc,
.run-package-renderer__field-review-meta {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.run-package-renderer__snapshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.run-package-renderer__snapshot-card {
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.run-package-renderer__snapshot-image {
  width: 100%;
  height: 140px;
  background: var(--el-fill-color-light);
}

.run-package-renderer__snapshot-placeholder {
  display: flex;
  width: 100%;
  height: 140px;
  padding: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
  background: var(--el-fill-color-light);
  align-items: center;
  justify-content: center;
}

.run-package-renderer__snapshot-meta {
  padding: 10px;
}

.run-package-renderer__snapshot-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.run-package-renderer__snapshot-ref {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}

.run-package-renderer__record-title {
  display: flex;
  min-width: 0;
  padding-right: 12px;
  align-items: center;
  gap: 12px;
}

.run-package-renderer__record-index {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.run-package-renderer__record-name {
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.run-package-renderer__record-key {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex: none;
}

.run-package-renderer__json {
  padding: 16px;
  margin: 12px 0 0;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  color: #e5eefb;
  word-break: break-word;
  white-space: pre-wrap;
  background: #111827;
  border-radius: 12px;
}

.mono {
  font-family:
    SFMono-Regular,
    "JetBrains Mono",
    Consolas,
    "Liberation Mono",
    monospace;
}

@media (width <= 900px) {
  .run-package-renderer__hero {
    flex-direction: column;
  }

  .run-package-renderer__hero-side {
    min-width: 0;
  }
}
</style>
