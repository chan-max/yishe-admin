<template>
  <div class="collapsible-filter-form">
    <!-- 折叠状态：显示常用搜索和操作 -->
    <div v-show="collapsed" class="filter-bar-collapsed">
      <div class="flex-1"></div>
      <div class="flex flex-wrap gap-4 items-center">
        <slot name="collapsed"></slot>
        <el-button
          v-if="showExpandButton"
          type="info"
          :icon="Grid"
          @click="collapsed = false"
          class="shrink-0"
        >
          展开筛选
        </el-button>
      </div>
    </div>

    <!-- 展开状态：显示全部搜索功能 -->
    <div v-show="!collapsed" class="filter-bar-expanded">
      <div class="flex-1"></div>
      <div class="flex flex-wrap gap-4 items-center">
        <slot name="expanded"></slot>
        <el-button
          v-if="showCollapseButton"
          type="info"
          :icon="Grid"
          @click="collapsed = true"
          class="shrink-0"
        >
          收起筛选
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Grid } from '@element-plus/icons-vue'

defineOptions({
  name: 'CollapsibleFilterForm'
})

const props = withDefaults(defineProps<{
  defaultCollapsed?: boolean
  showExpandButton?: boolean
  showCollapseButton?: boolean
}>(), {
  defaultCollapsed: true,
  showExpandButton: true,
  showCollapseButton: true
})

const collapsed = ref(props.defaultCollapsed)
</script>

<style scoped>
.collapsible-filter-form {
  width: 100%;
  margin: 0;
}

.filter-bar-collapsed,
.filter-bar-expanded {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;

  /* padding-bottom 由 ListPageLayout 的 filter-section 统一管理 */
}

:deep(.el-button) {
  flex-shrink: 0;
}
</style>
