<template>
  <section class="create-task-stage">
    <div class="create-task-stage__header">
      <div class="create-task-stage__index">2</div>
      <div class="create-task-stage__title-wrap">
        <div class="create-task-stage__title">确认裂变预设</div>
        <div class="create-task-stage__desc">先查看可用预设，再确认这次要执行的裂变方向。</div>
      </div>
    </div>

    <div class="create-task-block">
      <div class="create-task-intro">
        <div class="create-task-intro__title">当前模式会按预设生成多组结果</div>
        <div class="create-task-intro__desc">可以先浏览每组预设包含的步骤，确认是否符合预期。</div>
      </div>

      <div class="create-task-pills">
        <div class="create-task-pill">当前共 {{ variations.length }} 组裂变预设</div>
        <div class="create-task-pill">提交后会依次执行全部预设</div>
      </div>

      <div v-if="variations.length" class="create-task-grid">
        <div v-for="variation in variations" :key="variation.id || variation.name" class="create-task-card">
          <div class="create-task-card__header">
            <div class="create-task-card__title-wrap">
              <div class="create-task-card__title">{{ variation.name || `预设 ${variation.id}` }}</div>
              <div class="create-task-card__desc">{{ variation.description || "无描述" }}</div>
            </div>
            <el-tag size="small" effect="plain">{{ getVariationOperationCount(variation) }} 步</el-tag>
          </div>

          <div class="create-task-card__ops">
            <span
              v-for="(label, labelIndex) in getVariationOperationLabels(variation)"
              :key="`${variation.id || variation.name}-${label}-${labelIndex}`"
              class="create-task-card__op"
            >
              {{ label }}
            </span>
            <span
              v-if="getVariationOperationCount(variation) > getVariationOperationLabels(variation).length"
              class="create-task-card__op create-task-card__op--more"
            >
              +{{ getVariationOperationCount(variation) - getVariationOperationLabels(variation).length }}
            </span>
          </div>
        </div>
      </div>

      <div v-else class="create-task-empty">
        <div class="create-task-empty__title">暂未读取到裂变预设</div>
        <div class="create-task-empty__desc">请先刷新页面数据，确认预设列表已正常加载。</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: "CreateTaskVariationsStage" });

defineProps<{
  variations: any[];
  getVariationOperationCount: (variation: any) => number;
  getVariationOperationLabels: (variation: any) => string[];
}>();
</script>

<style scoped lang="scss">
.create-task-stage,
.create-task-block {
  display: flex;
  flex-direction: column;
}

.create-task-stage {
  gap: 14px;
}

.create-task-stage__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.create-task-stage__index {
  display: flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.create-task-stage__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.create-task-stage__title,
.create-task-intro__title,
.create-task-card__title,
.create-task-empty__title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
}

.create-task-stage__desc,
.create-task-intro__desc,
.create-task-card__desc,
.create-task-empty__desc {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.create-task-block {
  gap: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color-page);
  padding: 16px 18px;
}

.create-task-intro {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: var(--el-fill-color-extra-light);
  padding: 12px 14px;
}

.create-task-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.create-task-pill {
  border-radius: 999px;
  background: var(--el-fill-color-extra-light);
  padding: 6px 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.create-task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.create-task-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: var(--el-bg-color);
  padding: 16px 18px;
}

.create-task-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.create-task-card__title-wrap {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.create-task-card__ops {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.create-task-card__op {
  border-radius: 999px;
  background: var(--el-fill-color-light);
  padding: 5px 10px;
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.create-task-card__op--more {
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-secondary);
}

.create-task-empty {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px dashed var(--el-border-color);
  border-radius: 14px;
  background: var(--el-fill-color-extra-light);
  padding: 24px 16px;
  text-align: center;
}

@media (max-width: 768px) {
  .create-task-block,
  .create-task-card {
    padding: 14px;
  }

  .create-task-card__header {
    flex-direction: column;
  }
}
</style>
