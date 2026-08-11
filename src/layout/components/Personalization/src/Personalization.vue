<script setup lang="ts">
import { computed, ref } from "vue";
import { useAppStore } from "@/store/modules/app";
import { ElMessage } from "element-plus";
import { LOADING_TEMPLATES, DEFAULT_LOADING_STYLE } from "@/config/loadingTemplates";

defineOptions({ name: "Personalization" });

const { t } = useI18n();

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
  ElMessage.success(t("layout.personalization.themeColorResetSuccess"));
};

const loadingStyle = computed(() => appStore.getLoadingStyle);

const selectLoadingStyle = (key: string) => {
  appStore.setLoadingStyle(key);
  ElMessage.success(t("layout.personalization.loadingStyleSwitched"));
};

const resetLoadingStyle = () => {
  appStore.setLoadingStyle(DEFAULT_LOADING_STYLE);
  ElMessage.success(t("layout.personalization.loadingStyleResetSuccess"));
};
</script>

<template>
  <button type="button" class="personalization-trigger" :aria-label="t('layout.personalization.personalization')" @click="drawerVisible = true">
    <span class="th-action-icon">
      <Icon icon="ep:brush" :size="18" />
    </span>
    <span class="th-action-label">{{ t("layout.personalization.personalization") }}</span>
  </button>

  <el-drawer v-model="drawerVisible" :title="t('layout.personalization.personalizationTitle')" size="320px" append-to-body :with-header="true"
    class="personalization-drawer">
    <div class="personalization-body">
      <section class="personalization-section">
        <div class="personalization-section__head">
          <span class="personalization-section__title">{{ t("layout.personalization.themeColor") }}</span>
          <button type="button" class="personalization-reset" @click="handleReset">
            {{ t("layout.personalization.reset") }}
          </button>
        </div>
        <p class="personalization-section__desc">
          {{ t("layout.personalization.themeColorDesc") }}
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
          <span class="personalization-section__title">{{ t("layout.personalization.darkMode") }}</span>
          <el-switch v-model="isDark" inline-prompt :active-text="t('layout.personalization.dark')" :inactive-text="t('layout.personalization.light')" />
        </div>
        <p class="personalization-section__desc">{{ t("layout.personalization.darkModeDesc") }}</p>
      </section>

      <section class="personalization-section">
        <div class="personalization-section__head">
          <span class="personalization-section__title">{{ t("layout.personalization.loadingStyle") }}</span>
          <button
            v-if="loadingStyle !== DEFAULT_LOADING_STYLE"
            type="button"
            class="personalization-reset"
            @click="resetLoadingStyle"
          >
            {{ t("layout.personalization.reset") }}
          </button>
        </div>
        <p class="personalization-section__desc">{{ t("layout.personalization.loadingStyleDesc") }}</p>
        <div class="personalization-loaders">
          <button
            v-for="tpl in LOADING_TEMPLATES"
            :key="tpl.key"
            type="button"
            class="personalization-loader"
            :class="{ active: loadingStyle === tpl.key }"
            :title="tpl.desc"
            @click="selectLoadingStyle(tpl.key)"
          >
            <span class="personalization-loader__preview" :data-loader="tpl.key">
              <span class="loader-preview" />
            </span>
            <span class="personalization-loader__name">{{ tpl.name }}</span>
          </button>
        </div>
      </section>
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.personalization-trigger {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: none;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;

  &:active {
    transform: scale(0.94);
  }
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
  font-size: 12px;
  color: var(--el-color-primary);
  cursor: pointer;
  background: transparent;
  border: none;

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
  cursor: pointer;
  border: none;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 10%);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    transform: scale(1.1);
  }

  &.active {
    box-shadow:
      inset 0 0 0 1px rgb(0 0 0 / 10%),
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
  text-shadow: 0 1px 2px rgb(0 0 0 / 35%);
}

.personalization-color-picker {
  width: 26px;
  height: 26px;
}

.personalization-loaders {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.personalization-loader {
  display: flex;
  padding: 10px 4px 8px;
  cursor: pointer;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-radius: 10px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
  flex-direction: column;
  align-items: center;
  gap: 6px;

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 40%, transparent);
    transform: translateY(-1px);
  }

  &.active {
    border-color: var(--el-color-primary);
    box-shadow: inset 0 0 0 1px var(--el-color-primary);
  }
}

.personalization-loader__preview {
  position: relative;
  display: flex;
  width: 44px;
  height: 40px;
  align-items: center;
  justify-content: center;
}

.personalization-loader__name {
  font-size: 12px;
  line-height: 1;
  color: var(--el-text-color-primary);
}

// ---- 加载动画模版预览（与 _loading.scss 视觉一致，复用全局 keyframes）----
.loader-preview {
  position: relative;
  display: block;
  width: 26px;
  height: 26px;
}

.personalization-loader__preview[data-loader="ring"] .loader-preview::before {
  display: block;
  width: 26px;
  height: 26px;
  margin: 0 auto;
  background:
    radial-gradient(farthest-side, var(--el-color-primary) 94%, transparent) top/5px 5px no-repeat,
    conic-gradient(transparent 30%, var(--el-color-primary));
  border-radius: 50%;
  content: "";
  animation: yishe-loading-rotate 1s infinite linear;
  mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 0);
  mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 0);
}

.personalization-loader__preview[data-loader="dual-ring"] .loader-preview::before {
  display: block;
  width: 26px;
  height: 26px;
  margin: 0 auto;
  border: 2px solid color-mix(in srgb, var(--el-color-primary) 20%, transparent);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  content: "";
  animation: yishe-loading-rotate 0.9s infinite linear;
}

.personalization-loader__preview[data-loader="dual-ring"] .loader-preview::after {
  position: absolute;
  top: 6px;
  left: 50%;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  border: 2px solid color-mix(in srgb, var(--el-color-primary) 16%, transparent);
  border-bottom-color: var(--el-color-primary);
  border-radius: 50%;
  content: "";
  animation: yishe-loading-rotate-rev 1.3s infinite linear;
}

.personalization-loader__preview[data-loader="ripple"] .loader-preview::before {
  display: block;
  width: 26px;
  height: 26px;
  margin: 0 auto;
  background: radial-gradient(circle, var(--el-color-primary) 0 3px, transparent 4px);
  border-radius: 50%;
  content: "";
}

.personalization-loader__preview[data-loader="ripple"] .loader-preview::after {
  position: absolute;
  top: 0;
  left: 50%;
  width: 26px;
  height: 26px;
  margin-left: -13px;
  border: 2px solid var(--el-color-primary);
  border-radius: 50%;
  content: "";
  animation: yishe-loading-ripple 1.6s infinite ease-out;
}

.personalization-loader__preview[data-loader="dots"] .loader-preview::before {
  display: block;
  width: 30px;
  height: 26px;
  margin: 0 auto;
  content: "";
}

.personalization-loader__preview[data-loader="dots"] .loader-preview::after {
  position: absolute;
  top: 10px;
  left: 50%;
  width: 6px;
  height: 6px;
  margin-left: -3px;
  background: var(--el-color-primary);
  border-radius: 50%;
  content: "";
  box-shadow:
    -9px 0 0 0 var(--el-color-primary),
    9px 0 0 0 var(--el-color-primary);
  animation: yishe-loading-dots 0.9s infinite ease-in-out;
}

.personalization-loader__preview[data-loader="bars"] .loader-preview::before {
  display: block;
  width: 24px;
  height: 26px;
  margin: 0 auto;
  content: "";
}

.personalization-loader__preview[data-loader="bars"] .loader-preview::after {
  position: absolute;
  top: 6px;
  left: 50%;
  width: 4px;
  height: 14px;
  margin-left: -8px;
  background: var(--el-color-primary);
  border-radius: 999px;
  content: "";
  box-shadow:
    6px 0 0 -1px var(--el-color-primary),
    12px 0 0 -1px var(--el-color-primary);
  animation: yishe-loading-bars 1s infinite ease-in-out;
}
</style>
