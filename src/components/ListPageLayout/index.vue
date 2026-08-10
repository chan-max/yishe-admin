<template>
  <div class="list-page-layout" :class="{ 'has-sidebar': hasSidebar }">
    <div v-if="$slots.filter" class="list-page-layout__filter">
      <slot name="filter"></slot>
    </div>

    <div class="list-page-layout__body">
      <aside
        v-if="hasSidebar"
        class="list-page-layout__sidebar"
        :style="{ '--list-page-sidebar-width': props.sidebarWidth }"
      >
        <slot name="sidebar"></slot>
      </aside>

      <section class="list-page-layout__main">
        <div class="list-page-layout__table">
          <slot name="table"></slot>
        </div>

        <div v-if="$slots.pagination" class="list-page-layout__pagination">
          <slot name="pagination"></slot>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";

defineOptions({
  name: "ListPageLayout",
});

const props = withDefaults(
  defineProps<{
    sidebarWidth?: string;
  }>(),
  {
    sidebarWidth: "280px",
  },
);

const slots = useSlots();
const hasSidebar = computed(() => Boolean(slots.sidebar));
</script>

<style scoped lang="scss">
.list-page-layout {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  box-sizing: border-box;
}

.list-page-layout__filter,
.list-page-layout__sidebar,
.list-page-layout__table,
.list-page-layout__pagination {
  min-width: 0;
}

.list-page-layout__body {
  display: flex;
  min-height: 0;
  gap: 18px;
  align-items: stretch;
}

.list-page-layout__sidebar {
  width: var(--list-page-sidebar-width);
  min-width: 0;
  min-height: 0;
  flex: 0 0 var(--list-page-sidebar-width);
}

.list-page-layout__main {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 16px;
}

.list-page-layout__table {
  min-height: 0;
  flex: 1;
}

.list-page-layout__pagination {
  display: flex;
  justify-content: flex-end;
}

@media (width <= 1024px) {
  .list-page-layout {
    padding: 16px;
    gap: 16px;
  }

  .list-page-layout.has-sidebar .list-page-layout__body {
    flex-direction: column;
  }

  .list-page-layout__sidebar {
    width: 100%;
    flex-basis: auto;
  }
}

@media (width <= 768px) {
  .list-page-layout {
    padding: 12px;
    gap: 12px;
  }

  .list-page-layout__main {
    gap: 12px;
  }

  .list-page-layout__pagination {
    justify-content: stretch;
  }
}

@media (width <= 480px) {
  .list-page-layout {
    padding: 10px;
    gap: 10px;
  }
}
</style>
