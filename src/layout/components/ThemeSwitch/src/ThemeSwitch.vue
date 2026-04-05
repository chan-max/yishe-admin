<script lang="ts" setup>
import { computed } from "vue";
import { useAppStore } from "@/store/modules/app";
import { useIcon } from "@/hooks/web/useIcon";
import { useDesign } from "@/hooks/web/useDesign";

defineOptions({ name: "ThemeSwitch" });

const { getPrefixCls } = useDesign();

const prefixCls = getPrefixCls("theme-switch");

const Sun = useIcon({ icon: "emojione-monotone:sun", color: "#fde047" });

const CrescentMoon = useIcon({ icon: "emojione-monotone:crescent-moon", color: "#fde047" });

const appStore = useAppStore();

const isDark = computed({
  get: () => appStore.getIsDark,
  set: (value: boolean) => {
    appStore.setIsDark(value);
  },
});
</script>

<template>
  <ElSwitch
    v-model="isDark"
    :active-icon="Sun"
    :class="prefixCls"
    :inactive-icon="CrescentMoon"
    inline-prompt
  />
</template>
<style lang="scss" scoped>
:deep(.el-switch) {
  --el-switch-on-color: var(--top-header-hover-color);
  --el-switch-off-color: var(--top-header-hover-color);
  --el-switch-border-color: var(--top-tool-border-color);
  --el-switch-width: var(--theme-switch-width);
  --el-switch-height: var(--theme-switch-height);
  --el-switch-button-size: var(--theme-switch-button-size);
}

:deep(.el-switch__core) {
  border: 1px solid var(--top-tool-border-color);
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.08);
}

:deep(.el-switch__action) {
  color: var(--top-header-text-color);
  background: var(--app-content-surface-color);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.18);
}

:deep(.el-switch__inner) {
  color: var(--top-header-text-color);
}

:deep(.el-switch__core .el-switch__inner .is-icon) {
  overflow: visible;
}
</style>
