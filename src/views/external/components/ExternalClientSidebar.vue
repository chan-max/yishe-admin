<template>
  <aside class="external-sidebar card">
    <div class="external-sidebar__title">{{ sectionTitle }}</div>
    <el-empty v-if="!items.length && !loading" :description="emptyText" />
    <div v-else class="external-sidebar__list">
      <button
        v-for="item in items"
        :key="item.connectionId"
        type="button"
        class="external-sidebar__item"
        :class="{ 'is-active': item.connectionId === selectedClientId }"
        @click="$emit('select', item.connectionId)"
      >
        <div class="external-sidebar__head">
          <span class="external-sidebar__name">{{ item.name }}</span>
          <span class="external-sidebar__time-label">连接时间</span>
        </div>
        <div class="external-sidebar__meta-row external-sidebar__meta-row--time">
          <span class="external-sidebar__meta">连接时间</span>
          <span class="external-sidebar__time">{{ item.time || '-' }}</span>
        </div>
        <div class="external-sidebar__meta-row">
          <span class="external-sidebar__meta">{{ item.metaLeft || '-' }}</span>
          <span class="external-sidebar__meta">{{ item.metaRight || '-' }}</span>
        </div>
        <div v-if="item.badges?.length" class="external-sidebar__badges">
          <span
            v-for="badge in item.badges"
            :key="`${item.connectionId}-${badge.text}`"
            class="external-sidebar__badge"
            :class="`is-${badge.tone}`"
          >
            {{ badge.text }}
          </span>
        </div>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
export interface ClientNodeBadge {
  text: string
  tone: 'success' | 'warning' | 'muted'
}

export interface ClientNodeItem {
  connectionId: string
  name: string
  time?: string
  metaLeft?: string
  metaRight?: string
  badges?: ClientNodeBadge[]
}

const props = withDefaults(defineProps<{
  items: ClientNodeItem[]
  loading?: boolean
  selectedClientId?: string
  sectionTitle?: string
  emptyText?: string
}>(), {
  loading: false,
  selectedClientId: '',
  sectionTitle: '客户端节点',
  emptyText: '暂无可用客户端'
})

defineEmits<{
  select: [clientId: string]
}>()

const sectionTitle = props.sectionTitle
const emptyText = props.emptyText
</script>

<style scoped>
.external-sidebar {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.external-sidebar__title {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
}

.external-sidebar__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.external-sidebar__item {
  width: 100%;
  min-height: 92px;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  background: var(--el-bg-color);
  text-align: left;
  transition:
    border-color .18s ease,
    background-color .18s ease,
    transform .18s ease;
}

.external-sidebar__item.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.external-sidebar__item:hover {
  transform: translateY(-1px);
  border-color: var(--el-color-primary-light-5);
}

.external-sidebar__head,
.external-sidebar__meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.external-sidebar__head {
  min-height: 22px;
}

.external-sidebar__meta-row {
  margin-top: 6px;
  min-height: 18px;
}

.external-sidebar__meta-row--time {
  margin-top: 4px;
}

.external-sidebar__name {
  min-width: 0;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.external-sidebar__time,
.external-sidebar__meta {
  min-width: 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.external-sidebar__time-label {
  flex-shrink: 0;
  font-size: 11px;
  line-height: 1.2;
  color: var(--el-text-color-secondary);
}

.external-sidebar__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.external-sidebar__badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  max-width: 100%;
  padding: 0 9px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  background: var(--el-fill-color-light);
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.external-sidebar__badge.is-success {
  border-color: var(--el-color-success-light-5);
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.external-sidebar__badge.is-warning {
  border-color: var(--el-color-warning-light-5);
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

@media (max-width: 1200px) {
  .external-sidebar__item {
    min-height: auto;
  }
}
</style>
