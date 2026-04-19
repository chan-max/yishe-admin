<template>
  <div class="ai-assistant-structured-result">
    <div v-if="summaryItems.length" class="ai-assistant-structured-result__stats">
      <div
        v-for="item in summaryItems"
        :key="item.key"
        class="ai-assistant-structured-result__stat"
      >
        <Statistic :title="item.label" :value="item.value" />
      </div>
    </div>

    <Descriptions
      v-if="descriptionItems.length"
      :column="1"
      bordered
      size="small"
      class="ai-assistant-structured-result__descriptions"
    >
      <Descriptions.Item
        v-for="item in descriptionItems"
        :key="item.key"
        :label="item.label"
      >
        <span>{{ item.value }}</span>
      </Descriptions.Item>
    </Descriptions>

    <Collapse
      v-if="sectionItems.length"
      :bordered="false"
      size="small"
      class="ai-assistant-structured-result__collapse"
    >
      <CollapsePanel
        v-for="section in sectionItems"
        :key="section.key"
        :header="section.title"
      >
        <div v-if="section.type === 'list'" class="ai-assistant-structured-result__list">
          <div
            v-for="(row, rowIndex) in section.rows"
            :key="`${section.key}:${rowIndex}`"
            class="ai-assistant-structured-result__list-item"
          >
            <Tag v-if="row.badge" :color="row.badgeColor || 'processing'">{{ row.badge }}</Tag>
            <div class="ai-assistant-structured-result__list-item-main">
              <div class="ai-assistant-structured-result__list-item-title">
                {{ row.title }}
              </div>
              <div
                v-if="row.description"
                class="ai-assistant-structured-result__list-item-description"
              >
                {{ row.description }}
              </div>
            </div>
          </div>
        </div>

        <VueJsonPretty
          v-else
          :data="section.data"
          :show-line="false"
          :show-double-quotes="false"
          :show-length="true"
          :show-icon="true"
          class="ai-assistant-structured-result__json"
        />
      </CollapsePanel>
    </Collapse>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Collapse, Descriptions, Statistic, Tag } from "ant-design-vue";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";

type PropsValue = Record<string, any> | null | undefined;

const props = defineProps<{
  value?: PropsValue;
}>();

const CollapsePanel = Collapse.Panel;

const dataObject = computed<Record<string, any>>(() => {
  return props.value && typeof props.value === "object" ? props.value : {};
});

const summaryKeys = [
  ["count", "当前数量"],
  ["total", "总数"],
  ["groupCount", "分组数"],
  ["actionCount", "动作数"],
  ["pageSize", "每页数量"],
  ["currentPage", "当前页"],
  ["totalPage", "总页数"],
  ["logCount", "日志数"],
  ["imageCount", "图片数"],
];

const summaryItems = computed(() =>
  summaryKeys
    .map(([key, label]) => ({
      key,
      label,
      value: dataObject.value[key],
    }))
    .filter((item) => item.value !== undefined && item.value !== null && item.value !== ""),
);

const descriptionItems = computed(() => {
  const preferredKeys = [
    ["query", "查询词"],
    ["status", "状态"],
    ["message", "消息"],
    ["label", "标签"],
    ["profileId", "环境"],
    ["region", "区域"],
    ["actionKey", "动作 Key"],
    ["actionLabel", "动作名称"],
    ["errorText", "错误信息"],
    ["fetchedAt", "抓取时间"],
  ];

  return preferredKeys
    .map(([key, label]) => ({
      key,
      label,
      value: formatValue(dataObject.value[key]),
    }))
    .filter((item) => item.value);
});

const sectionItems = computed(() => {
  const entries: Array<{
    key: string;
    title: string;
    type: "list" | "json";
    rows?: Array<{ title: string; description?: string; badge?: string; badgeColor?: string }>;
    data?: any;
  }> = [];

  const items = Array.isArray(dataObject.value.items) ? dataObject.value.items : [];
  if (items.length) {
    entries.push({
      key: "items",
      title: `结果列表 (${items.length})`,
      type: "list",
      rows: items.slice(0, 20).map((item: Record<string, any>) => ({
        title:
          formatValue(item.name) ||
          formatValue(item.title) ||
          formatValue(item.label) ||
          formatValue(item.id) ||
          "未命名记录",
        description: [
          formatValue(item.description),
          formatValue(item.statusMessage),
          formatValue(item.actionLabel),
          formatValue(item.profileId),
        ]
          .filter(Boolean)
          .join(" · "),
        badge: formatValue(item.status),
        badgeColor: resolveStatusColor(formatValue(item.status)),
      })),
    });
  }

  const groups = Array.isArray(dataObject.value.groups) ? dataObject.value.groups : [];
  if (groups.length) {
    entries.push({
      key: "groups",
      title: `分组详情 (${groups.length})`,
      type: "list",
      rows: groups.map((item: Record<string, any>) => ({
        title:
          formatValue(item.label) || formatValue(item.key) || "未命名分组",
        description: [
          formatValue(item.description),
          item.actionCount != null ? `动作 ${item.actionCount} 个` : "",
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    });
  }

  const params = dataObject.value.params;
  if (params && typeof params === "object") {
    entries.push({
      key: "params",
      title: "执行参数",
      type: "json",
      data: params,
    });
  }

  const result = dataObject.value.result;
  if (result && typeof result === "object") {
    entries.push({
      key: "result",
      title: "原始结果",
      type: "json",
      data: result,
    });
  }

  const logs = Array.isArray(dataObject.value.logs) ? dataObject.value.logs : [];
  if (logs.length) {
    entries.push({
      key: "logs",
      title: `执行日志 (${logs.length})`,
      type: "list",
      rows: logs.slice(0, 50).map((item: Record<string, any>) => ({
        title: formatValue(item.message) || "日志",
        description: formatValue(item.time),
        badge: formatValue(item.level),
        badgeColor: resolveStatusColor(formatValue(item.level)),
      })),
    });
  }

  return entries;
});

const formatValue = (value: unknown) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
};

const resolveStatusColor = (status: string) => {
  const normalized = status.toLowerCase();
  if (["failed", "error"].includes(normalized)) return "error";
  if (["completed", "success"].includes(normalized)) return "success";
  if (["processing", "running", "warning"].includes(normalized)) return "processing";
  return "default";
};
</script>

<style lang="scss" scoped>
.ai-assistant-structured-result {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
  }

  &__stat {
    padding: 12px;
    border: 1px solid var(--ai-line);
    border-radius: 14px;
    background: var(--ai-surface-soft);
  }

  &__descriptions {
    :deep(.ant-descriptions-view) {
      border-radius: 14px;
      overflow: hidden;
    }
  }

  &__collapse {
    border-radius: 14px;
    overflow: hidden;

    :deep(.ant-collapse-item) {
      border-bottom: 1px solid var(--ai-line);
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__list-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 10px 12px;
    border: 1px solid var(--ai-line);
    border-radius: 12px;
    background: var(--ai-surface-soft);
  }

  &__list-item-main {
    min-width: 0;
    flex: 1;
  }

  &__list-item-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--ai-text);
  }

  &__list-item-description {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--ai-text-secondary);
    word-break: break-word;
  }

  &__json {
    border: 1px solid var(--ai-line);
    border-radius: 12px;
    padding: 10px 12px;
    background: var(--ai-surface-soft);
    overflow: auto;
  }
}
</style>
