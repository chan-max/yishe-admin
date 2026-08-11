<script lang="ts" setup>
import { computed } from "vue";
import { useAppStore } from "@/store/modules/app";
import { Icon } from "@/components/Icon";
import { useDesign } from "@/hooks/web/useDesign";

defineOptions({ name: "ThemeSwitch" });

const { t } = useI18n();

const { getPrefixCls } = useDesign();
const prefixCls = getPrefixCls("theme-switch");
const appStore = useAppStore();

const isDark = computed({
  get: () => appStore.getIsDark,
  set: (value: boolean) => appStore.setIsDark(value),
});

const toggle = () => {
  isDark.value = !isDark.value;
};
</script>

<template>
  <button
    type="button"
    :class="prefixCls"
    :aria-label="t('layout.theme.toggleTheme')"
    @click="toggle"
  >
    <span class="th-action-icon">
      <Icon
        :icon="isDark ? 'ep:moon' : 'ep:sunny'"
        :size="18"
      />
    </span>
    <span class="th-action-label">{{ t("layout.theme.theme") }}</span>
  </button>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-theme-switch;

.#{$prefix-cls} {
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

.th-action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 18px;
  line-height: 1;
}

.th-action-label {
  margin-top: 3px;
  font-size: 8px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}
</style>
