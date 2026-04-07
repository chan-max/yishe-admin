<script lang="ts" setup>
import { propTypes } from "@/utils/propTypes";
import { useDesign } from "@/hooks/web/useDesign";

defineOptions({ name: "ContentWrap" });

const { getPrefixCls } = useDesign();

const prefixCls = getPrefixCls("content-wrap");

defineProps({
  title: propTypes.string.def(""),
  message: propTypes.string.def(""),
  bodyStyle: propTypes.object.def({ padding: "0px" }),
  plain: propTypes.bool.def(false),
});
</script>

<template>
  <ElCard
    :body-style="bodyStyle"
    :class="[prefixCls, 'mb-15px', { 'is-plain': plain }]"
    shadow="never"
  >
    <template v-if="title" #header>
      <div class="content-wrap__header">
        <div class="content-wrap__title-wrap">
          <span class="content-wrap__title">{{ title }}</span>
          <ElTooltip v-if="message" effect="dark" placement="right">
            <template #content>
              <div class="max-w-200px">{{ message }}</div>
            </template>
            <Icon :size="14" class="content-wrap__tooltip" icon="ep:question-filled" />
          </ElTooltip>
        </div>
        <div class="content-wrap__header-extra">
          <slot name="header"></slot>
        </div>
      </div>
    </template>
    <slot></slot>
  </ElCard>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-content-wrap;

.#{$prefix-cls} {
  overflow: hidden;
  border: 1px solid var(--app-content-border-color);
  border-radius: 16px;
  background: var(--app-content-surface-color);
  box-shadow: var(--app-content-shadow);

  :deep(.el-card__header) {
    padding: 16px 18px;
    border-bottom: 1px solid var(--app-content-border-color);
    background: var(--app-content-surface-muted-color);
  }

  :deep(.el-card__body) {
    padding: 0;
  }
}

.#{$prefix-cls}.is-plain {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;

  :deep(.el-card__header) {
    padding: 0 0 14px;
    border-bottom: 0;
    background: transparent;
  }

  :deep(.el-card__body) {
    padding: 0;
    background: transparent;
  }
}

.content-wrap__header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.content-wrap__title-wrap {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.content-wrap__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: 0.01em;
}

.content-wrap__tooltip {
  color: var(--el-text-color-secondary);
}

.content-wrap__header-extra {
  display: flex;
  min-width: 0;
  flex: 1;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .#{$prefix-cls} {
    border-radius: 14px;

    :deep(.el-card__header) {
      padding: 14px 16px;
    }
  }

  .content-wrap__header {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .content-wrap__header-extra {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .#{$prefix-cls} {
    border-radius: 12px;

    :deep(.el-card__header) {
      padding: 12px 14px;
    }
  }

  .content-wrap__title {
    font-size: 13px;
  }
}
</style>
