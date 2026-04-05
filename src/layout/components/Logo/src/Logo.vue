<script lang="ts" setup>
import { computed } from "vue";
import { useAppStore } from "@/store/modules/app";
import { useDesign } from "@/hooks/web/useDesign";

defineOptions({ name: "Logo" });

const { getPrefixCls } = useDesign();
const prefixCls = getPrefixCls("logo");
const appStore = useAppStore();

const title = computed(() => appStore.getTitle);
</script>

<template>
  <div class="logo-shell">
    <router-link :class="[prefixCls, 'logo-link']" to="/">
      <img class="logo-mark" style="object-fit: contain" src="@/assets/imgs/logo.png" />
      <div class="logo-title">
        {{ title }}
      </div>
    </router-link>
  </div>
</template>

<style scoped lang="scss">
.logo-shell {
  padding: var(--logo-padding-y) var(--logo-padding-x);
}

.logo-link {
  display: flex;
  width: 100%;
  height: var(--logo-height) !important;
  align-items: center;
  overflow: hidden;
  cursor: pointer;
  text-decoration: none;
}

.logo-mark {
  width: calc(var(--logo-height) - 12px);
  height: calc(var(--logo-height) - 12px);
}

.logo-title {
  flex: 1;
  min-width: 0;
  margin-left: var(--logo-title-gap);
  overflow: hidden;
  color: var(--logo-title-text-color);
  font-size: var(--logo-title-font-size);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
