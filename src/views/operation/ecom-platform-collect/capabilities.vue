<template>
  <ContentWrap :plain="true">
    <div v-loading="loading" class="capability-page">
      <div class="capability-page__hero">
        <div class="capability-page__hero-main">
          <div class="capability-page__eyebrow">Capability Schema</div>
          <div class="capability-page__title">平台能力总览</div>
          <div class="capability-page__desc">
            这里展示的是浏览器自动化端声明的实时能力协议：每个平台支持哪些 taskType、需要什么参数、理论上会返回哪些字段、有哪些登录/验证码/风控限制，以及适合做哪些分析。
          </div>
          <div class="capability-page__meta">
            <span>能力客户端 {{ catalog.meta?.onlineCapabilityClientCount || 0 }} / {{ catalog.meta?.capabilityClientCount || 0 }}</span>
            <span>生成时间 {{ formatDateTime(catalog.meta?.generatedAt || catalog.generatedAt) }}</span>
          </div>
        </div>
        <div class="capability-page__hero-actions">
          <el-button size="small" @click="loadData">刷新</el-button>
        </div>
      </div>

      <CompactNotice
        type="info"
        title="怎么看这页"
        description="这页看的是 capability 声明，用来判断平台和任务类型是否值得继续开发；真实运行后到底返回了哪些字段，请到原始数据详情里的“字段对照”和“记录 JSON”确认。"
        class="capability-page__notice"
      />

      <div class="capability-page__filters">
        <el-form :model="filters" label-position="top" class="capability-filter-form">
          <el-row :gutter="12">
            <el-col :xs="24" :sm="12" :md="10" :lg="10">
              <el-form-item label="关键词">
                <el-input
                  v-model="filters.keyword"
                  clearable
                  placeholder="搜索平台 / taskType / 字段名 / 说明"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="5">
              <el-form-item label="平台">
                <el-select v-model="filters.platform" clearable placeholder="全部平台">
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
              <el-form-item label="聚焦视角">
                <el-select v-model="filters.focus" placeholder="全部">
                  <el-option label="全部" value="all" />
                  <el-option label="可直接执行" value="runnable" />
                  <el-option label="受限 / 未实现" value="blocked" />
                  <el-option label="POD 图案可分析" value="pod_ready" />
                  <el-option label="高风险验证码" value="captcha_risk" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="4">
              <el-form-item label="声明字段视图">
                <el-select v-model="filters.fieldMode" placeholder="展开全部">
                  <el-option label="全部字段" value="all" />
                  <el-option label="仅 records[]" value="records" />
                  <el-option label="仅 collectData" value="package" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="capability-page__stats">
        <div class="stat-card">
          <span>平台数</span>
          <strong>{{ stats.platformCount }}</strong>
        </div>
        <div class="stat-card">
          <span>taskType 数</span>
          <strong>{{ stats.taskTypeCount }}</strong>
        </div>
        <div class="stat-card">
          <span>可执行</span>
          <strong>{{ stats.runnableCount }}</strong>
        </div>
        <div class="stat-card">
          <span>POD 可分析</span>
          <strong>{{ stats.podReadyCount }}</strong>
        </div>
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
                {{ platform.docs?.overview || "当前平台能力由浏览器自动化端维护。" }}
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
            <span>taskType {{ platform.taskCards.length }}</span>
            <span>可执行 {{ platform.runnableCount }}</span>
            <span>受限 {{ platform.blockedCount }}</span>
            <span>POD {{ platform.podReadyCount }}</span>
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
                      {{ task.docs?.overview || task.description || "暂无额外功能说明。" }}
                    </div>
                    <div class="task-card__use-hint">
                      {{ task.digest.useSuggestion }}
                    </div>
                  </div>
                  <div class="task-card__overview-stats">
                    <div class="task-mini-stat">
                      <span>参数</span>
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
                  <div class="task-card__section-title">推荐分析方向</div>
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
                  <div class="task-card__section-title">限制与说明</div>
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
                  <div class="task-card__section-title">参数字段</div>
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
                          必填
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
                  <div class="task-card__section-title">records[] 字段</div>
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
                  <div class="task-card__section-title">collectData 字段</div>
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
                  <div class="task-card__section-title">示例</div>
                  <div class="task-card__examples">
                    <div
                      v-for="(example, index) in task.docs.examples"
                      :key="`${task.value}-example-${index}`"
                      class="task-card__example"
                    >
                      <div class="task-card__example-title">
                        {{ example.title || `示例 ${index + 1}` }}
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

      <el-empty v-else description="当前筛选条件下暂无可展示的能力定义" />
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref } from "vue";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import CompactNotice from "@/components/CompactNotice/index.vue";
import {
  getEcomPlatformCollectCatalog,
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
} from "./shared";

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
    const data = await getEcomPlatformCollectCatalog();
    catalog.platforms = Array.isArray(data?.platforms) ? data.platforms : [];
    catalog.meta = data?.meta || catalog.meta;
    catalog.generatedAt = data?.generatedAt || null;
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
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.18), transparent 36%),
    linear-gradient(135deg, #fffaf2 0%, #f6faff 100%);
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.capability-page__hero-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.capability-page__eyebrow {
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.capability-page__title {
  color: #0f172a;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.capability-page__desc {
  max-width: 980px;
  color: #475569;
  font-size: 14px;
  line-height: 1.8;
}

.capability-page__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  color: #64748b;
  font-size: 12px;
}

.capability-page__hero-actions {
  display: flex;
  align-items: flex-start;
}

.capability-page__notice,
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
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.stat-card span {
  color: #64748b;
  font-size: 12px;
}

.stat-card strong {
  color: #0f172a;
  font-size: 24px;
  font-weight: 700;
}

.platform-card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.platform-card {
  padding: 18px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
}

.platform-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.platform-card__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.platform-card__title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
}

.platform-card__code,
.task-card__code {
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
}

.platform-card__summary {
  color: #475569;
  font-size: 13px;
  line-height: 1.7;
}

.platform-card__tags,
.task-card__title-tags,
.task-card__tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.platform-card__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-top: 12px;
  color: #64748b;
  font-size: 12px;
}

.platform-card__notes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}

.platform-card__note {
  color: #475569;
  font-size: 13px;
  line-height: 1.7;
}

.platform-card__collapse {
  margin-top: 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
}

:deep(.platform-card__collapse .el-collapse-item__header) {
  min-height: 72px;
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
  gap: 4px;
}

.task-card__title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.task-card__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 8px;
}

.task-card__overview {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.task-card__overview-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-card__overview-text,
.task-card__use-hint {
  color: #475569;
  font-size: 13px;
  line-height: 1.8;
}

.task-card__overview-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 92px));
  gap: 8px;
}

.task-mini-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.task-mini-stat span {
  color: #64748b;
  font-size: 11px;
}

.task-mini-stat strong {
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
}

.task-card__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-card__section-title {
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
}

.task-card__list {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  font-size: 13px;
  line-height: 1.8;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.field-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.field-card__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
}

.field-card__label {
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
}

.field-card__meta,
.field-card__desc,
.task-card__example-desc {
  color: #64748b;
  font-size: 12px;
  line-height: 1.7;
}

.task-card__examples {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-card__example {
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.task-card__example-title {
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 1080px) {
  .capability-page__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .platform-card__header,
  .task-card__title-row,
  .task-card__overview {
    flex-direction: column;
  }

  .task-card__overview-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .capability-page__hero {
    padding: 18px;
  }

  .capability-page__title {
    font-size: 24px;
  }

  .capability-page__stats,
  .field-grid,
  .task-card__overview-stats {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
