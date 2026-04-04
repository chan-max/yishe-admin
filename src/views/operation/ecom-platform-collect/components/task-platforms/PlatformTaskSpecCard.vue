<template>
  <div v-if="spec" class="platform-task-spec-card">
    <div class="platform-task-spec-card__header">
      <div class="platform-task-spec-card__title">平台配置说明</div>
      <el-tag size="small" effect="plain">{{ spec.title }}</el-tag>
    </div>

    <div v-if="spec.description" class="platform-task-spec-card__desc">
      {{ spec.description }}
    </div>

    <div v-if="allNotes.length" class="platform-task-spec-card__notes">
      <div
        v-for="(note, index) in allNotes"
        :key="`${index}-${note}`"
        class="platform-task-spec-card__note"
      >
        {{ note }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type {
  EcomCollectPlatformFormSpec,
  EcomCollectSceneKey,
} from "./types";

const props = defineProps<{
  spec?: EcomCollectPlatformFormSpec | null;
  scene?: EcomCollectSceneKey | "" | null;
}>();

const allNotes = computed(() => {
  const commonNotes = Array.isArray(props.spec?.notes) ? props.spec?.notes : [];
  const sceneNotes =
    props.spec?.sceneNotes?.[props.scene as EcomCollectSceneKey] || [];
  return [...commonNotes, ...sceneNotes];
});
</script>

<style scoped lang="scss">
.platform-task-spec-card {
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
}

.platform-task-spec-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.platform-task-spec-card__title {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.platform-task-spec-card__desc {
  margin-top: 8px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.7;
}

.platform-task-spec-card__notes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}

.platform-task-spec-card__note {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}
</style>
