<!-- 基于 ruoyi-vue3 的 Pagination 重构，核心是简化无用的属性，并使用 ts 重写 -->
<template>
  <div v-show="total > 0" class="yishe-pagination">
    <div v-if="isMobile" class="yishe-pagination__summary">
      <span>共 {{ total }} 条</span>
      <span>{{ currentPage }} / {{ pageCount || 1 }} 页</span>
    </div>
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :background="true"
      :page-sizes="[10, 20, 30, 50, 100, 200, 500, 1000]"
      :pager-count="responsivePagerCount"
      :small="isMobile"
      :total="total"
      class="yishe-pagination__control"
      :layout="responsiveLayout"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>
<script lang="ts" setup>
defineOptions({ name: 'Pagination' })

const props = defineProps({
  // 总条目数
  total: {
    required: true,
    type: Number
  },
  // 当前页数：currentPage
  page: {
    type: Number,
    default: 1
  },
  // 每页显示条目个数：pageSize
  limit: {
    type: Number,
    default: 20
  },
  // 设置最大页码按钮数。 页码按钮的数量，当总页数超过该值时会折叠
  // 移动端页码按钮的数量端默认值 5
  pagerCount: {
    type: Number,
    default: document.body.clientWidth < 992 ? 5 : 7
  }
})

const emit = defineEmits(['update:page', 'update:limit', 'pagination'])

const windowWidth = ref(typeof window === 'undefined' ? 1200 : window.innerWidth)
const updateWindowWidth = () => {
  if (typeof window !== 'undefined') {
    windowWidth.value = window.innerWidth
  }
}

onMounted(() => {
  updateWindowWidth()
  window.addEventListener('resize', updateWindowWidth, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

const isMobile = computed(() => windowWidth.value <= 640)
const responsiveLayout = computed(() => {
  if (windowWidth.value <= 420) {
    return 'prev, pager, next'
  }
  if (windowWidth.value <= 640) {
    return 'prev, pager, next'
  }
  if (windowWidth.value <= 900) {
    return 'total, sizes, prev, pager, next'
  }
  return 'total, sizes, prev, pager, next, jumper'
})
const responsivePagerCount = computed(() => {
  if (windowWidth.value <= 900) {
    return 5
  }
  return props.pagerCount
})
const pageCount = computed(() => {
  const limit = Number(pageSize.value) || 1
  return Math.max(1, Math.ceil((Number(props.total) || 0) / limit))
})

const currentPage = computed({
  get() {
    return props.page
  },
  set(val) {
    // 触发 update:page 事件，更新 limit 属性，从而更新 currentPage
    emit('update:page', val)
  }
})
const pageSize = computed({
  get() {
    return props.limit
  },
  set(val) {
    // 触发 update:limit 事件，更新 limit 属性，从而更新 pageSize
    emit('update:limit', val)
  }
})
const handleSizeChange = (val) => {
  // 如果修改后超过最大页面，强制跳转到第 1 页
  if (currentPage.value * val > props.total) {
    currentPage.value = 1
  }
  // 触发 pagination 事件，重新加载列表
  emit('pagination', { page: currentPage.value, limit: val })
}
const handleCurrentChange = (val) => {
  // 触发 pagination 事件，重新加载列表
  emit('pagination', { page: val, limit: pageSize.value })
}
</script>
<style scoped lang="scss">
.yishe-pagination {
  display: flex;
  width: 100%;
  min-width: 0;
  margin: 15px 0;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.yishe-pagination__summary {
  display: none;
  width: 100%;
  font-size: 12px;
  line-height: 1.3;
  color: var(--el-text-color-secondary);
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.yishe-pagination__control {
  max-width: 100%;
}

:deep(.el-pagination) {
  flex-wrap: wrap;
  justify-content: flex-end;
  row-gap: 8px;
  max-width: 100%;
}

@media (width <= 768px) {
  .yishe-pagination {
    align-items: stretch;
  }

  :deep(.el-pagination) {
    justify-content: flex-start;
  }
}

@media (width <= 640px) {
  .yishe-pagination {
    margin: 10px 0;
    gap: 6px;
  }

  .yishe-pagination__summary {
    display: flex;
  }

  :deep(.el-pagination) {
    width: 100%;
    justify-content: center;
    gap: 6px;
  }

  :deep(.el-pagination .btn-prev),
  :deep(.el-pagination .btn-next),
  :deep(.el-pagination .el-pager li) {
    min-width: 28px;
  }

  :deep(.el-pagination__sizes),
  :deep(.el-pagination__total),
  :deep(.el-pagination__jump) {
    margin-left: 0 !important;
  }
}

@media (width <= 420px) {
  :deep(.el-pagination) {
    flex-wrap: nowrap;
    overflow: hidden;
  }

  :deep(.el-pagination .btn-prev),
  :deep(.el-pagination .btn-next),
  :deep(.el-pagination .el-pager li) {
    width: 26px;
    height: 26px;
    min-width: 26px;
    padding: 0;
  }

  :deep(.el-pagination .el-pager) {
    display: flex;
    min-width: 0;
    flex: 0 1 auto;
  }
}
</style>
