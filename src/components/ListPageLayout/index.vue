<template>
  <div class="list-page-layout">
    <!-- 过滤表单区域 -->
    <div v-if="$slots.filter" class="filter-section">
      <slot name="filter"></slot>
    </div>

    <!-- 表格区域 -->
    <div class="table-section">
      <slot name="table"></slot>
    </div>

    <!-- 分页区域 -->
    <div v-if="$slots.pagination" class="pagination-section">
      <slot name="pagination"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ListPageLayout'
})
</script>

<style scoped>
.list-page-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem; /* 统一的页面内边距 */
}

.filter-section {
  margin: 0;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.filter-section > *:first-child {
  margin-top: 0;
}

.table-section {
  flex: 1;
  min-height: 0;
}

.pagination-section {
  padding: 1rem 0;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}
</style>
