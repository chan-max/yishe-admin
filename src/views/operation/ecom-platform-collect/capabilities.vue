<template>
  <ContentWrap :plain="true">
    <div v-loading="loading" class="capability-page">
      <div class="capability-page__hero">
        <div class="capability-page__hero-main">
          <div class="capability-page__eyebrow">{{ t('operation.capabilitySchema') }}</div>
          <div class="capability-page__title">{{ t('operation.platformCapabilityOverview') }}</div>
          <div class="capability-page__desc">
            {{ t('operation.capabilityDescription') }}
          </div>
          <div class="capability-page__meta">
            <span>{{ t('operation.capabilityClient') }} {{ catalog.meta?.onlineCapabilityClientCount || 0 }} / {{ catalog.meta?.capabilityClientCount || 0 }}</span>
            <span>{{ t('operation.generatedAt') }} {{ formatDateTime(catalog.meta?.generatedAt || catalog.generatedAt) }}</span>
          </div>
        </div>
        <div class="capability-page__hero-actions">
          <el-button size="small" @click="loadData">{{ t('common.refresh') }}</el-button>
        </div>
      </div>

      <div class="capability-page__filters">
        <el-form :model="filters" label-position="top" class="capability-filter-form">
          <el-row :gutter="12">
            <el-col :xs="24" :sm="12" :md="10" :lg="10">
              <el-form-item :label="t('operation.keyword')">
                <el-input
                  v-model="filters.keyword"
                  clearable
                  :placeholder="t('operation.searchPlaceholder')"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="5">
              <el-form-item :label="t('operation.platform')">
                <el-select v-model="filters.platform" clearable :placeholder="t('operation.allPlatforms')">
                  <el-option
                    v-for="item in catalog.platforms"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="5">
              <el-form-item :label="t('operation.focusPerspective')">
                <el-select v-model="filters.focus" :placeholder="t('operation.all')">
                  <el-option :label="t('operation.all')" value="all" />
                  <el-option :label="t('operation.directlyRunnable')" value="runnable" />
                  <el-option :label="t('operation.blockedOrUnimplemented')" value="blocked" />
                  <el-option :label="t('operation.podPatternAnalyzable')" value="pod_ready" />
                  <el-option :label="t('operation.highRiskCaptcha')" value="captcha_risk" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="4">
              <el-form-item :label="t('operation.declaredFieldView')">
                <el-select v-model="filters.fieldMode" :placeholder="t('operation.expandAll')">
                  <el-option :label="t('operation.allFields')" value="all" />
                  <el-option :label="t('operation.recordsOnly')" value="records" />
                  <el-option :label="t('operation.collectDataOnly')" value="package" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="capability-page__stats">
        <div class="stat-card">
          <span>{{ t('operation.platformCount') }}</span>
          <strong>{{ stats.platformCount }}</strong>
        </div>
        <div class="stat-card">
          <span>{{ t('operation.taskTypeCount') }}</span>
          <strong>{{ stats.taskTypeCount }}</strong>
        </div>
        <div class="stat-card">
          <span>{{ t('operation.runnable') }}</span>
          <strong>{{ stats.runnableCount }}</strong>
        </div>
        <div class="stat-card">
          <span>{{ t('operation.podAnalyzable') }}</span>
          <strong>{{ stats.podReadyCount }}</strong>
        </div>
      </div>

      <div class="feature-panel">
        <div class="feature-panel__header">
          <div>
            <div class="feature-panel__title">{{ t('operation.featureDirectory') }}</div>
            <div class="feature-panel__desc">
              {{ t('operation.featureDirectoryDesc') }}
            </div>
          </div>
          <el-tag effect="plain" type="info">{{ t('operation.total') }} {{ featureCards.length }} {{ t('operation.items') }}</el-tag>
        </div>
        <el-table
          v-if="featureCards.length"
          :data="featureCards"
          border
          size="small"
          max-height="420"
          class="feature-table"
        >
          <el-table-column :label="t('operation.feature')" min-width="220">
            <template #default="{ row }">
              <div class="feature-name-cell">
                <strong>{{ row.label }}</strong>
                <code>{{ row.taskType }}</code>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('operation.platform')" prop="platformLabel" width="140" />
          <el-table-column :label="t('operation.scene')" width="130">
            <template #default="{ row }">
              {{ row.collectScene || "-" }}
            </template>
          </el-table-column>
          <el-table-column :label="t('operation.status')" width="120">
            <template #default="{ row }">
              <el-tag size="small" effect="plain" :type="getCapabilityStatusTagType(row.availability)">
                {{ row.availabilityLabel || getCapabilityStatusLabel(row.availability) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('operation.verification')" width="110">
            <template #default="{ row }">
              {{ row.verificationLabel || row.verification || "-" }}
            </template>
          </el-table-column>
          <el-table-column :label="t('operation.parameter')" width="90">
            <template #default="{ row }">
              {{ Array.isArray(row.fields) ? row.fields.length : 0 }}
            </template>
          </el-table-column>
          <el-table-column :label="t('operation.description')" min-width="260">
            <template #default="{ row }">
              <span class="feature-table__desc">
                {{ row.description || row.docs?.overview || row.reason || "-" }}
              </span>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else :description="t('operation.noFeaturesUnderFilter')" />
      </div>

      <div v-if="platformCards.length" class="platform-card-list">
        <div
          v-for="platform in platformCards"
          :key="platform.value"
          class="platform-card"
        >
          <div class="platform-card__header">
            <div class="platform-card__title-wrap">
              <div class="platform-card__title">
                {{ platform.label }}
                <span class="platform-card__code">{{ platform.value }}</span>
              </div>
              <div class="platform-card__summary">
                {{ platform.docs?.overview || t('operation.platformCapabilityMaintainedByClient') }}
              </div>
            </div>
            <div class="platform-card__tags">
              <el-tag
                size="small"
                effect="plain"
                :type="getCapabilityStatusTagType(platform.status)"
              >
                {{ platform.statusLabel || getCapabilityStatusLabel(platform.status) }}
              </el-tag>
              <el-tag
                v-for="tag in platform.accessTags"
                :key="`${platform.value}-${tag.label}`"
                size="small"
                effect="plain"
                :type="tag.type"
              >
                {{ tag.label }}
              </el-tag>
            </div>
          </div>

          <div class="platform-card__metrics">
            <span>{{ t('operation.taskType') }} {{ platform.taskCards.length }}</span>
            <span>{{ t('operation.runnable') }} {{ platform.runnableCount }}</span>
            <span>{{ t('operation.blocked') }} {{ platform.blockedCount }}</span>
            <span>{{ t('operation.pod') }} {{ platform.podReadyCount }}</span>
          </div>

          <div v-if="platform.noteList.length" class="platform-card__notes">
            <div
              v-for="note in platform.noteList"
              :key="`${platform.value}-${note}`"
              class="platform-card__note"
            >
              {{ note }}
            </div>
          </div>

          <el-collapse class="platform-card__collapse">
            <el-collapse-item
              v-for="task in platform.taskCards"
              :key="task.value"
              :name="task.value"
            >
              <template #title>
                <div class="task-card__title-row">
                  <div class="task-card__title-wrap">
                    <div class="task-card__title">{{ task.label }}</div>
                    <div class="task-card__code">{{ task.value }}</div>
                  </div>
                  <div class="task-card__title-tags">
                    <el-tag size="small" effect="plain" :type="task.digest.availabilityTag.type">
                      {{ task.digest.availabilityTag.label }}
                    </el-tag>
                    <el-tag size="small" effect="plain" :type="task.digest.verificationTag.type">
                      {{ task.digest.verificationTag.label }}
                    </el-tag>
                    <el-tag size="small" effect="plain" :type="task.digest.podTag.type">
                      {{ task.digest.podTag.label }}
                    </el-tag>
                  </div>
                </div>
              </template>

              <div class="task-card__body">
                <div class="task-card__overview">
                  <div class="task-card__overview-main">
                    <div class="task-card__overview-text">
                      {{ task.docs?.overview || task.description || t('operation.noAdditionalFeatureDesc') }}
                    </div>
                    <div class="task-card__use-hint">
                      {{ task.digest.useSuggestion }}
                    </div>
                  </div>
                  <div class="task-card__overview-stats">
                    <div class="task-mini-stat">
                      <span>{{ t('operation.parameter') }}</span>
                      <strong>{{ task.digest.parameterCount }}</strong>
                    </div>
                    <div class="task-mini-stat">
                      <span>records</span>
                      <strong>{{ task.digest.recordFieldCount }}</strong>
                    </div>
                    <div class="task-mini-stat">
                      <span>collectData</span>
                      <strong>{{ task.digest.packageFieldCount }}</strong>
                    </div>
                  </div>
                </div>

                <div class="task-card__tag-row">
                  <el-tag
                    v-for="tag in task.digest.accessTags"
                    :key="`${task.value}-${tag.label}`"
                    size="small"
                    effect="plain"
                    :type="tag.type"
                  >
                    {{ tag.label }}
                  </el-tag>
                  <el-tag
                    v-for="tag in task.digest.outputTags"
                    :key="`${task.value}-output-${tag}`"
                    size="small"
                    effect="plain"
                  >
                    {{ tag }}
                  </el-tag>
                </div>

                <div
                  v-if="task.digest.analysisHints.length"
                  class="task-card__section"
                >
                  <div class="task-card__section-title">{{ t('operation.recommendedAnalysisDirection') }}</div>
                  <ul class="task-card__list">
                    <li v-for="item in task.digest.analysisHints" :key="item">
                      {{ item }}
                    </li>
                  </ul>
                </div>

                <div
                  v-if="task.digest.notes.length"
                  class="task-card__section"
                >
                  <div class="task-card__section-title">{{ t('operation.limitationsAndNotes') }}</div>
                  <ul class="task-card__list">
                    <li v-for="item in task.digest.notes" :key="item">
                      {{ item }}
                    </li>
                  </ul>
                </div>

                <div
                  v-if="Array.isArray(task.fields) && task.fields.length"
                  class="task-card__section"
                >
                  <div class="task-card__section-title">{{ t('operation.parameterFields') }}</div>
                  <div class="field-grid">
                    <div
                      v-for="field in task.fields"
                      :key="`${task.value}-param-${field.key}`"
                      class="field-card"
                    >
                      <div class="field-card__head">
                        <code>{{ field.key }}</code>
                        <el-tag
                          v-if="field.required"
                          size="small"
                          effect="plain"
                          type="danger"
                        >
                          {{ t('operation.required') }}
                        </el-tag>
                      </div>
                      <div class="field-card__label">{{ field.label || field.key }}</div>
                      <div class="field-card__meta">
                        {{ field.component || "input" }} / {{ field.valueType || "string" }}
                      </div>
                      <div v-if="field.description" class="field-card__desc">
                        {{ field.description }}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-if="filters.fieldMode !== 'package' && task.recordFields.length"
                  class="task-card__section"
                >
                  <div class="task-card__section-title">{{ t('operation.recordsFields') }}</div>
                  <div class="field-grid">
                    <div
                      v-for="field in task.recordFields"
                      :key="`${task.value}-record-${field.key}`"
                      class="field-card"
                    >
                      <div class="field-card__head">
                        <code>{{ field.key }}</code>
                        <el-tag size="small" effect="plain" :type="getFieldTagType(field.stability)">
                          {{ field.stability || "optional" }}
                        </el-tag>
                      </div>
                      <div class="field-card__label">{{ field.label || field.key }}</div>
                      <div class="field-card__meta">{{ field.valueType || "string" }}</div>
                      <div v-if="field.description" class="field-card__desc">
                        {{ field.description }}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-if="filters.fieldMode !== 'records' && task.packageFields.length"
                  class="task-card__section"
                >
                  <div class="task-card__section-title">{{ t('operation.collectDataFields') }}</div>
                  <div class="field-grid">
                    <div
                      v-for="field in task.packageFields"
                      :key="`${task.value}-package-${field.key}`"
                      class="field-card"
                    >
                      <div class="field-card__head">
                        <code>{{ field.key }}</code>
                        <el-tag size="small" effect="plain" :type="getFieldTagType(field.stability)">
                          {{ field.stability || "optional" }}
                        </el-tag>
                      </div>
                      <div class="field-card__label">{{ field.label || field.key }}</div>
                      <div class="field-card__meta">{{ field.valueType || "string" }}</div>
                      <div v-if="field.description" class="field-card__desc">
                        {{ field.description }}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-if="Array.isArray(task.docs?.examples) && task.docs.examples.length"
                  class="task-card__section"
                >
                  <div class="task-card__section-title">{{ t('operation.example') }}</div>
                  <div class="task-card__examples">
                    <div
                      v-for="(example, index) in task.docs.examples"
                      :key="`${task.value}-example-${index}`"
                      class="task-card__example"
                    >
                      <div class="task-card__example-title">
                        {{ example.title || `${t('operation.example')} ${index + 1}` }}
                      </div>
                      <div v-if="example.description" class="task-card__example-desc">
                        {{ example.description }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>

      <el-empty v-else :description="t('operation.noCapabilityDefinitionsUnderFilter')" />
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref } from "vue";
import { useI18n } from 'vue-i18n';
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import {
  getEcomPlatformCollectFeatures,
  type EcomCollectFeatureSchema,
  type EcomCollectOutputFieldSchema,
  type EcomCollectPlatformSchema,
  type EcomCollectTaskTypeSchema,
} from "@/api/operation/ecomPlatformCollect";
import {
  buildCapabilitySearchText,
  buildTaskTypeCapabilityDigest,
  type CapabilityTag,
} from "./capabilityCatalog";
import {
  createEmptyEcomCollectCatalog,
  formatDateTime,
  getCapabilityAccessLabel,
  getCapabilityAccessTagType,
  getCapabilityStatusLabel,
  getCapabilityStatusTagType,
  getTaskTypeSchemas,
  loadEcomCollectCatalog,
} from "./shared";

const { t } = useI18n();

defineOptions({ name: "EcomPlatformCollectCapabilityPage" });

interface TaskTypeCard extends EcomCollectTaskTypeSchema {
  digest: ReturnType<typeof buildTaskTypeCapabilityDigest>;
  recordFields: EcomCollectOutputFieldSchema[];
  packageFields: EcomCollectOutputFieldSchema[];
  searchText: string;
}

interface PlatformCard extends EcomCollectPlatformSchema {
  taskCards: TaskTypeCard[];
  accessTags: CapabilityTag[];
  noteList: string[];
  runnableCount: number;
  blockedCount: number;
  podReadyCount: number;
  searchText: string;
}

const loading = ref(false);
const catalog = reactive(createEmptyEcomCollectCatalog());
const features = ref<EcomCollectFeatureSchema[]>([]);

const filters = reactive({
  keyword: "",
  platform: "",
  focus: "all",
  fieldMode: "all",
});

const normalizeText = (value: unknown) => String(value || "").trim();

const dedupeFields = (fields?: EcomCollectOutputFieldSchema[] | null) =>
  Array.from(
    new Map(
      (Array.isArray(fields) ? fields : [])
        .filter((field) => normalizeText(field?.key))
        .map((field) => [normalizeText(field.key), field]),
    ).values(),
  );

const buildPlatformAccessTags = (platform: EcomCollectPlatformSchema) => {
  const access = platform.access;
  const tags: CapabilityTag[] = [];
  if (access?.login) {
    tags.push({
      label: access.loginLabel || getCapabilityAccessLabel("login", access.login),
      type: getCapabilityAccessTagType("login", access.login),
    });
  }
  if (access?.captcha) {
    tags.push({
      label: access.captchaLabel || getCapabilityAccessLabel("captcha", access.captcha),
      type: getCapabilityAccessTagType("captcha", access.captcha),
    });
  }
  if (access?.antiBot) {
    tags.push({
      label: access.antiBotLabel || getCapabilityAccessLabel("antiBot", access.antiBot),
      type: getCapabilityAccessTagType("antiBot", access.antiBot),
    });
  }
  return tags;
};

const matchesFocus = (task: TaskTypeCard) => {
  switch (filters.focus) {
    case "runnable":
      return task.runnable !== false;
    case "blocked":
      return task.runnable === false;
    case "pod_ready":
      return task.digest.podTag.type === "success";
    case "captcha_risk":
      return task.digest.accessTags.some(
        (item) => item.label.includes("验证码") && item.type === "danger",
      );
    default:
      return true;
  }
};

const matchesFeatureFocus = (feature: EcomCollectFeatureSchema) => {
  switch (filters.focus) {
    case "runnable":
      return feature.runnable !== false;
    case "blocked":
      return feature.runnable === false;
    case "captcha_risk":
      return feature.access?.captcha === "likely" || feature.access?.captcha === "blocking";
    case "pod_ready": {
      const recordFields = Array.isArray(feature.docs?.recordFields)
        ? feature.docs.recordFields
        : [];
      return recordFields.some((field) =>
        ["imageUrl", "imageUrls", "pictureSource"].includes(String(field.key || "")),
      );
    }
    default:
      return true;
  }
};

const buildFeatureSearchText = (feature: EcomCollectFeatureSchema) =>
  [
    feature.value,
    feature.featureKey,
    feature.taskType,
    feature.label,
    feature.description,
    feature.platform,
    feature.platformLabel,
    feature.collectScene,
    feature.docs?.overview,
    feature.reason,
    ...(Array.isArray(feature.fields) ? feature.fields.map((field) => field.key) : []),
  ]
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

const featureCards = computed(() => {
  const keyword = normalizeText(filters.keyword).toLowerCase();
  return features.value
    .filter((feature) => !filters.platform || feature.platform === filters.platform)
    .filter((feature) => matchesFeatureFocus(feature))
    .filter((feature) => !keyword || buildFeatureSearchText(feature).includes(keyword));
});

const platformCards = computed<PlatformCard[]>(() => {
  const keyword = normalizeText(filters.keyword).toLowerCase();

  return catalog.platforms
    .filter((platform) => !filters.platform || platform.value === filters.platform)
    .map((platform) => {
      const taskCards = getTaskTypeSchemas(catalog, platform.value)
        .map((taskType) => {
          const digest = buildTaskTypeCapabilityDigest(taskType);
          return {
            ...taskType,
            digest,
            recordFields: dedupeFields(taskType.docs?.recordFields),
            packageFields: dedupeFields(taskType.docs?.packageFields),
            searchText: buildCapabilitySearchText(taskType),
          };
        })
        .filter((task) => matchesFocus(task))
        .filter((task) => !keyword || task.searchText.includes(keyword));

      const noteList = [
        ...((Array.isArray(platform.docs?.notes) ? platform.docs.notes : []) || []),
        ...((Array.isArray(platform.maintenance?.notes)
          ? platform.maintenance?.notes
          : []) || []),
        platform.reason || "",
      ]
        .map((item) => normalizeText(item))
        .filter(Boolean);

      const searchText = [
        platform.value,
        platform.label,
        platform.docs?.overview,
        ...noteList,
      ]
        .map((item) => normalizeText(item))
        .filter(Boolean)
        .join("\n")
        .toLowerCase();

      return {
        ...platform,
        taskCards,
        accessTags: buildPlatformAccessTags(platform),
        noteList,
        runnableCount: taskCards.filter((item) => item.runnable !== false).length,
        blockedCount: taskCards.filter((item) => item.runnable === false).length,
        podReadyCount: taskCards.filter((item) => item.digest.podTag.type === "success")
          .length,
        searchText,
      };
    })
    .filter((platform) => {
      if (platform.taskCards.length) {
        return true;
      }
      return !!keyword && platform.searchText.includes(keyword);
    });
});

const stats = computed(() => {
  const taskCards = platformCards.value.flatMap((platform) => platform.taskCards);
  return {
    platformCount: platformCards.value.length,
    taskTypeCount: taskCards.length,
    runnableCount: taskCards.filter((item) => item.runnable !== false).length,
    podReadyCount: taskCards.filter((item) => item.digest.podTag.type === "success")
      .length,
  };
});

const getFieldTagType = (stability?: string | null) => {
  const map: Record<string, "success" | "warning" | "info" | "danger"> = {
    core: "success",
    optional: "info",
    platform: "warning",
  };
  return map[normalizeText(stability)] || "info";
};

const loadData = async () => {
  loading.value = true;
  try {
    const [data, featureData] = await Promise.all([
      loadEcomCollectCatalog(),
      getEcomPlatformCollectFeatures(),
    ]);
    catalog.platforms = Array.isArray(data?.platforms) ? data.platforms : [];
    catalog.meta = data?.meta || catalog.meta;
    catalog.generatedAt = data?.generatedAt || null;
    features.value = Array.isArray(featureData?.list) ? featureData.list : [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  void loadData();
});

onActivated(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
.capability-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.capability-page__hero {
  display: flex;
  padding: 20px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-radius: 16px;
  justify-content: space-between;
  gap: 16px;
}

.capability-page__hero-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.capability-page__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--el-color-primary);
  text-transform: uppercase;
}

.capability-page__title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.capability-page__desc {
  max-width: 720px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.capability-page__meta {
  display: flex;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  flex-wrap: wrap;
  gap: 6px 16px;
}

.capability-page__hero-actions {
  display: flex;
  align-items: flex-start;
}

.capability-page__filters {
  padding: 0;
}

.capability-page__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  display: flex;
  padding: 14px 16px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-radius: 12px;
  flex-direction: column;
  gap: 4px;
}

.stat-card span {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.stat-card strong {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.feature-panel {
  display: flex;
  padding: 16px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-radius: 12px;
  flex-direction: column;
  gap: 12px;
}

.feature-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.feature-panel__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.feature-panel__desc {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.feature-name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-name-cell strong {
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.feature-name-cell code {
  font-size: 11px;
  color: var(--el-color-primary);
}

.feature-table__desc {
  display: inline-block;
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.platform-card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.platform-card {
  padding: 16px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-radius: 16px;
}

.platform-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.platform-card__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.platform-card__title {
  display: flex;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  align-items: baseline;
  gap: 8px;
}

.platform-card__code,
.task-card__code {
  font-size: 11px;
  font-weight: 500;
  color: var(--el-text-color-placeholder);
}

.platform-card__summary {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.platform-card__tags,
.task-card__title-tags,
.task-card__tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.platform-card__metrics {
  display: flex;
  margin-top: 10px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  flex-wrap: wrap;
  gap: 6px 14px;
}

.platform-card__notes {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
}

.platform-card__note {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.platform-card__collapse {
  margin-top: 12px;
  border-top: 1px solid var(--app-content-border-color);
}

:deep(.platform-card__collapse .el-collapse-item__header) {
  min-height: 56px;
  align-items: center;
}

.task-card__title-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding-right: 12px;
}

.task-card__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-card__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.task-card__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 6px;
}

.task-card__overview {
  display: flex;
  padding: 14px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--app-content-border-color);
  border-radius: 12px;
  justify-content: space-between;
  gap: 16px;
}

.task-card__overview-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-card__overview-text,
.task-card__use-hint {
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.task-card__overview-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 80px));
  gap: 6px;
}

.task-mini-stat {
  display: flex;
  padding: 8px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-radius: 10px;
  flex-direction: column;
  gap: 2px;
}

.task-mini-stat span {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

.task-mini-stat strong {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.task-card__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-card__section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.task-card__list {
  padding-left: 16px;
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.field-card {
  display: flex;
  padding: 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--app-content-border-color);
  border-radius: 10px;
  flex-direction: column;
  gap: 6px;
}

.field-card__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
}

.field-card__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.field-card__meta,
.field-card__desc,
.task-card__example-desc {
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-placeholder);
}

.task-card__examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-card__example {
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--app-content-border-color);
  border-radius: 10px;
}

.task-card__example-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

@media (width <= 1080px) {
  .capability-page__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .platform-card__header,
  .feature-panel__header,
  .task-card__title-row,
  .task-card__overview {
    flex-direction: column;
  }

  .task-card__overview-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (width <= 768px) {
  .capability-page__hero {
    padding: 14px;
  }

  .capability-page__title {
    font-size: 16px;
  }

  .capability-page__stats,
  .field-grid,
  .task-card__overview-stats {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
