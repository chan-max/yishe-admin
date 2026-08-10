<template>
  <aside class="sidebar">
    <div class="sidebar__title">{{ sectionTitle }}</div>
    <el-empty v-if="!items.length && !loading" :description="emptyText" :image-size="48" />
    <div v-else class="sidebar__list">
      <button
        v-for="item in items"
        :key="item.connectionId"
        type="button"
        class="sidebar__item"
        :class="{
          'is-active': item.connectionId === selectedClientId,
          'is-offline': item.isOnline === false,
        }"
        @click="$emit('select', item.connectionId)"
      >
        <div class="sidebar__item-head">
          <span class="sidebar__name">{{ item.name }}</span>
          <span
            v-if="item.isOnline !== undefined"
            :class="['sidebar__badge', item.isOnline ? 'sidebar__badge--on' : 'sidebar__badge--off']"
          />
        </div>
        <div class="sidebar__meta" v-if="item.metaLeft || item.metaRight">
          <span>{{ item.metaLeft }}</span>
          <span>{{ item.metaRight }}</span>
        </div>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
export interface ClientNodeItem {
  connectionId: string
  name: string
  time?: string
  metaLeft?: string
  metaRight?: string
  detail?: string
  isOnline?: boolean
}

withDefaults(defineProps<{
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
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  padding: 12px 8px;
}

.sidebar__title {
  padding: 0 8px 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.sidebar__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar__item {
  width: 100%;
  padding: 8px 10px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition: background-color .15s;
}

.sidebar__item:hover {
  background: var(--el-fill-color-light);
}

.sidebar__item.is-active {
  background: var(--el-fill-color);
}

.sidebar__item.is-offline {
  opacity: .55;
}

.sidebar__item.is-offline.is-active {
  opacity: 1;
}

.sidebar__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.sidebar__name {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar__badge {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sidebar__badge--on {
  background: var(--el-color-success);
}

.sidebar__badge--off {
  background: var(--el-color-info);
}

.sidebar__meta {
  display: flex;
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.3;
  color: var(--el-text-color-secondary);
  justify-content: space-between;
}
</style>
