<script setup lang="ts">
import { computed, ref } from "vue";
import { useAppStore } from "@/store/modules/app";
import { ElMessage } from "element-plus";

defineOptions({ name: "Personalization" });

const appStore = useAppStore();

const drawerVisible = ref(false);

const PRESET_COLORS = [
  "#2d6bff",
  "#5b8cff",
  "#409eff",
  "#0ea5e9",
  "#06b6d4",
  "#10b981",
  "#16a34a",
  "#f59e0b",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#7c3aed",
  "#111827",
];

const themeColor = computed(() => {
  const primary = appStore.getTheme?.elColorPrimary;
  if (primary) return primary;
  return appStore.getIsDark ? "#5b8cff" : "#2d6bff";
});

const isDark = computed({
  get: () => appStore.getIsDark,
  set: (value: boolean) => appStore.setIsDark(value),
});

const applyThemeColor = (color: string) => {
  if (!color) return;
  appStore.setTheme({ elColorPrimary: color });
  appStore.setCssVarTheme();
};

const handlePickerChange = (color: string | null) => {
  if (!color) return;
  applyThemeColor(color);
};

const handleReset = () => {
  const def = appStore.getIsDark ? "#5b8cff" : "#2d6bff";
  applyThemeColor(def);
  ElMessage.success("主题色已恢复默认");
};
</script>

<template>
  <button type="button" class="personalization-trigger" aria-label="个性化设置" @click="drawerVisible = true">
    <Icon icon="ep:brush" :size="12" />
    <span class="personalization-trigger__label">个性化</span>
    <span class="personalization-trigger__dot" :style="{ backgroundColor: themeColor }"></span>
  </button>

  <el-drawer v-model="drawerVisible" title="个性化设置" size="320px" append-to-body :with-header="true"
    class="personalization-drawer">
    <div class="personalization-body">
      <section class="personalization-section">
        <div class="personalization-section__head">
          <span class="personalization-section__title">主题色</span>
          <button type="button" class="personalization-reset" @click="handleReset">
            恢复默认
          </button>
        </div>
        <p class="personalization-section__desc">
          选择后即时生效。
        </p>
        <div class="personalization-swatches">
          <button v-for="color in PRESET_COLORS" :key="color" type="button" class="personalization-swatch"
            :class="{ active: themeColor.toLowerCase() === color.toLowerCase() }" :style="{ backgroundColor: color }"
            :aria-label="color" @click="applyThemeColor(color)">
            <span v-if="themeColor.toLowerCase() === color.toLowerCase()" class="personalization-swatch__check">
              ✓
            </span>
          </button>
          <el-color-picker class="personalization-color-picker" :model-value="themeColor"
            @change="handlePickerChange" />
        </div>
      </section>

      <section class="personalization-section">
        <div class="personalization-section__head">
          <span class="personalization-section__title">深色模式</span>
          <el-switch v-model="isDark" inline-prompt active-text="深" inactive-text="浅" />
        </div>
        <p class="personalization-section__desc">切换后整个系统界面会使用暗色配色。</p>
      </section>
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.personalization-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 7px;
  border: 1px solid var(--top-tool-border-color);
  border-radius: 7px;
  background: var(--top-header-hover-color);
  color: var(--top-header-text-color);
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;

  &:hover,
  &:focus-visible {
    outline: none;
    border-color: color-mix(in srgb, var(--top-header-text-color) 14%, transparent 86%);
    color: var(--el-text-color-primary);
  }
}

.personalization-trigger__label {
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
}

.personalization-trigger__dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
}

.personalization-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.personalization-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.personalization-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.personalization-section__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.personalization-reset {
  padding: 0;
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--el-color-primary);
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
}

.personalization-section__desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.personalization-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.personalization-swatch {
  position: relative;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    transform: scale(1.1);
  }

  &.active {
    box-shadow:
      inset 0 0 0 1px rgba(0, 0, 0, 0.1),
      0 0 0 2px var(--el-color-primary);
  }
}

.personalization-swatch__check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.personalization-color-picker {
  width: 26px;
  height: 26px;
}
</style>
