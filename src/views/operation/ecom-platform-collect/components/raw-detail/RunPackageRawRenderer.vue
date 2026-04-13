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
          <span>{{ formatDateTime(finishedAt) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="执行客户端">
          <span class="mono">{{ machineLabel }}</span>
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

    <div
      v-if="
        capabilityProfile.accessTags.length ||
        capabilityProfile.outputTags.length ||
        capabilityProfile.analysisHints.length ||
        capabilityProfile.notes.length
      "
      class="run-package-renderer__section"
    >
      <div class="run-package-renderer__section-title">能力说明</div>
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
        <div class="run-package-renderer__insight-title">当前可用字段能力</div>
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
        <div class="run-package-renderer__insight-title">推荐分析方向</div>
        <ul class="run-package-renderer__ai-list">
          <li v-for="item in capabilityProfile.analysisHints" :key="item">
            {{ item }}
          </li>
        </ul>
      </div>

      <div v-if="capabilityProfile.notes.length" class="run-package-renderer__insight-block">
        <div class="run-package-renderer__insight-title">限制与说明</div>
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
      <div class="run-package-renderer__section-title">字段对照</div>
      <div class="run-package-renderer__field-catalog-hint">
        预期字段来自当前 taskType 的 capability schema，实际字段来自本次运行结果。
      </div>

      <div v-if="schemaReview.packageFields.length" class="run-package-renderer__insight-block">
        <div class="run-package-renderer__insight-title">collectData 结果包字段</div>
        <div class="run-package-renderer__field-review-grid">
          <div
            v-for="item in schemaReview.packageFields"
            :key="`package-${item.key}`"
            class="run-package-renderer__field-review-card"
          >
            <div class="run-package-renderer__field-head">
              <code>{{ item.key }}</code>
              <el-tag size="small" effect="plain" :type="item.present ? 'success' : 'warning'">
                {{ item.present ? "已返回" : "未返回" }}
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
        <div class="run-package-renderer__insight-title">records[] 预期字段</div>
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
                    ? `覆盖 ${Math.round(item.coverageRatio * 100)}%`
                    : item.stability === "core"
                      ? "缺失"
                      : "未返回"
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
              类型 {{ item.valueTypes.join(" / ") }}
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="schemaReview.missingCoreRecordFields.length"
        class="run-package-renderer__insight-block"
      >
        <div class="run-package-renderer__insight-title">需要回查的核心字段</div>
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
        <div class="run-package-renderer__insight-title">未建档字段</div>
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
              覆盖率 {{ Math.round(item.coverageRatio * 100) }}%
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
      <div class="run-package-renderer__section-title">结果包洞察</div>

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
        <div class="run-package-renderer__insight-title">可分析维度</div>
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
        <div class="run-package-renderer__insight-title">字段覆盖</div>
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
        <div class="run-package-renderer__insight-title">样本侧写</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item
            v-if="insights.sampleKeywords.length"
            label="关键词样本"
          >
            {{ insights.sampleKeywords.join("、") }}
          </el-descriptions-item>
          <el-descriptions-item v-if="insights.topShops.length" label="店铺样本">
            {{ insights.topShops.join("、") }}
          </el-descriptions-item>
          <el-descriptions-item v-if="insights.topBrands.length" label="品牌样本">
            {{ insights.topBrands.join("、") }}
          </el-descriptions-item>
          <el-descriptions-item v-if="insights.topDomains.length" label="来源域名">
            {{ insights.topDomains.join("、") }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-if="insights.aiBrief" class="run-package-renderer__insight-block">
        <div class="run-package-renderer__insight-title">AI 分析建议</div>
        <div class="run-package-renderer__ai-brief">{{ insights.aiBrief }}</div>
        <ul v-if="insights.aiSuggestions.length" class="run-package-renderer__ai-list">
          <li v-for="item in insights.aiSuggestions" :key="item">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>

    <div v-if="fieldCatalog.length" class="run-package-renderer__section">
      <div class="run-package-renderer__section-title">实际字段目录</div>
      <div class="run-package-renderer__field-catalog-hint">
        该目录基于本次运行返回的 records 动态扫描生成，会随着平台字段变化自动更新。
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
            <span>覆盖率 {{ Math.round(item.coverageRatio * 100) }}%</span>
            <span>类型 {{ item.valueTypes.join(" / ") }}</span>
          </div>
          <div v-if="item.sampleValues.length" class="run-package-renderer__field-samples">
            <span>样例：</span>
            <span>{{ item.sampleValues.join("；") }}</span>
          </div>
        </div>
      </div>
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
      <div class="run-package-renderer__section-title">商品简览</div>
      <div class="run-package-renderer__field-catalog-hint">
        这里优先展示稳定字段，尽量不依赖平台易变 DOM 文案；复杂或临时字段仍保留在下方原始 JSON 中。
      </div>
      <el-empty v-if="!recordPreviewCards.length" description="本次执行没有返回记录" />
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
            <div v-else class="run-package-renderer__preview-placeholder">无图片</div>
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
                查看来源
              </el-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="run-package-renderer__section">
      <div class="run-package-renderer__section-title">记录 JSON</div>
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
  ) || "运行结果包",
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
    ["消息", rawSummary.value.message],
    ["记录数", rawSummary.value.recordsCount || recordsCount.value],
    ["截图数", rawSummary.value.snapshotCount || snapshotCount.value],
    ["更新时间", rawSummary.value.updatedAt],
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
    title: pickRecordValue(item, RECORD_TITLE_PATHS) || `记录 ${index + 1}`,
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

.run-package-renderer__insight-grid,
.run-package-renderer__coverage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.run-package-renderer__insight-card,
.run-package-renderer__coverage-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
}

.run-package-renderer__insight-card span,
.run-package-renderer__coverage-head span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.run-package-renderer__insight-card strong,
.run-package-renderer__coverage-head strong {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
}

.run-package-renderer__insight-card small,
.run-package-renderer__coverage-item small {
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.run-package-renderer__insight-block {
  margin-top: 16px;
}

.run-package-renderer__insight-title {
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
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
  color: var(--el-text-color-regular);
  line-height: 1.7;
}

.run-package-renderer__ai-list {
  margin: 10px 0 0;
  padding-left: 18px;
  color: var(--el-text-color-regular);
  line-height: 1.7;
}

.run-package-renderer__field-catalog-hint {
  margin-bottom: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
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
  overflow: hidden;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
}

.run-package-renderer__preview-media {
  width: 96px;
  height: 96px;
}

.run-package-renderer__preview-image,
.run-package-renderer__preview-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background: var(--el-fill-color-light);
}

.run-package-renderer__preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
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
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.6;
  word-break: break-word;
}

.run-package-renderer__preview-subtitle {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.run-package-renderer__preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.run-package-renderer__preview-key {
  flex: 1;
  min-width: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.run-package-renderer__field-card {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
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
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
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
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-extra-light);
}

.run-package-renderer__field-review-label {
  margin-top: 8px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 500;
}

.run-package-renderer__field-review-desc,
.run-package-renderer__field-review-meta {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
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
