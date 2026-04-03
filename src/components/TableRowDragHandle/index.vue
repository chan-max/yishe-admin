<template>
  <div class="row-drag-handle table-row-drag-handle" :title="title" aria-hidden="true">
    <span class="table-row-drag-handle__grip" aria-hidden="true">
      <span v-for="bar in 4" :key="bar" class="table-row-drag-handle__bar" />
    </span>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: '拖拽移动'
  }
)
</script>

<style scoped>
.table-row-drag-handle {
  position: relative;
  display: inline-flex;
  width: var(--table-row-drag-handle-size);
  height: var(--table-row-drag-handle-size);
  align-items: center;
  justify-content: center;
  border: 1px solid var(--table-row-drag-handle-border-color);
  border-radius: var(--table-row-drag-handle-radius);
  background: var(--table-row-drag-handle-bg);
  color: var(--table-row-drag-handle-color);
  box-shadow: var(--table-row-drag-handle-shadow);
  cursor: grab;
  opacity: 0.78;
  user-select: none;
  touch-action: none;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease,
    opacity 0.18s ease;
  will-change: transform, opacity, background-color, border-color;
}

.table-row-drag-handle__grip {
  display: inline-flex;
  align-items: center;
  gap: 2.5px;
  height: 12px;
}

.table-row-drag-handle__bar {
  width: 2px;
  height: 11px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.92;
  transition:
    transform 0.18s ease,
    opacity 0.18s ease,
    height 0.18s ease;
}

.table-row-drag-handle__bar:nth-child(1),
.table-row-drag-handle__bar:nth-child(4) {
  height: 8px;
  opacity: 0.64;
}

.table-row-drag-handle__bar:nth-child(2),
.table-row-drag-handle__bar:nth-child(3) {
  height: 12px;
}

.table-row-drag-handle:hover {
  border-color: var(--table-row-drag-handle-hover-border-color);
  background: var(--table-row-drag-handle-hover-bg);
  color: var(--table-row-drag-handle-hover-color);
  box-shadow: var(--table-row-drag-handle-hover-shadow);
  opacity: 1;
  transform: translateY(-1px);
}

.table-row-drag-handle:hover .table-row-drag-handle__bar:nth-child(1),
.table-row-drag-handle:hover .table-row-drag-handle__bar:nth-child(4) {
  transform: translateY(0.5px);
}

.table-row-drag-handle:hover .table-row-drag-handle__bar:nth-child(2),
.table-row-drag-handle:hover .table-row-drag-handle__bar:nth-child(3) {
  transform: translateY(-0.5px);
}

.table-row-drag-handle:active {
  background: var(--table-row-drag-handle-active-bg);
  color: var(--table-row-drag-handle-active-color);
  box-shadow: var(--table-row-drag-handle-active-shadow);
  cursor: grabbing;
  transform: scale(0.96);
  opacity: 1;
}
</style>
