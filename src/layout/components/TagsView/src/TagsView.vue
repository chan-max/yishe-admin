<script lang="ts" setup>
import { computed, nextTick, ref, unref, watch } from "vue";
import type { RouteLocationNormalizedLoaded, RouterLinkProps } from "vue-router";
import { useRouter } from "vue-router";
import { usePermissionStore } from "@/store/modules/permission";
import { useTagsViewStore } from "@/store/modules/tagsView";
import { useAppStore } from "@/store/modules/app";
import { useI18n } from "@/hooks/web/useI18n";
import { filterAffixTags } from "./helper";
import { ContextMenu, ContextMenuExpose } from "@/layout/components/ContextMenu";
import { useDesign } from "@/hooks/web/useDesign";
import { useTemplateRefsList } from "@vueuse/core";
import { ElScrollbar } from "element-plus";
import { useScrollTo } from "@/hooks/event/useScrollTo";
import { useTagsView } from "@/hooks/web/useTagsView";
import { cloneDeep } from "lodash-es";

defineOptions({ name: "TagsView" });

const { getPrefixCls } = useDesign();

const prefixCls = getPrefixCls("tags-view");

const { t } = useI18n();

const { currentRoute, push } = useRouter();

const { closeAll, closeLeft, closeRight, closeOther, closeCurrent, refreshPage } = useTagsView();

const permissionStore = usePermissionStore();

const routers = computed(() => permissionStore.getRouters);

const tagsViewStore = useTagsViewStore();

const visitedViews = computed(() => tagsViewStore.getVisitedViews);

const affixTagArr = ref<RouteLocationNormalizedLoaded[]>([]);

const selectedTag = computed(() => tagsViewStore.getSelectedTag);

const setSelectTag = tagsViewStore.setSelectedTag;

const appStore = useAppStore();

const tagsViewImmerse = computed(() => appStore.getTagsViewImmerse);

// 初始化tag
const initTags = () => {
  affixTagArr.value = filterAffixTags(unref(routers));
  for (const tag of unref(affixTagArr)) {
    // Must have tag name
    if (tag.name) {
      tagsViewStore.addVisitedView(cloneDeep(tag) as RouteLocationNormalizedLoaded);
    }
  }
};

// 新增tag
const addTags = () => {
  const { name } = unref(currentRoute);
  if (name) {
    setSelectTag(unref(currentRoute));
    tagsViewStore.addView(unref(currentRoute));
  }
};

// 关闭选中的tag
const closeSelectedTag = (view: RouteLocationNormalizedLoaded) => {
  closeCurrent(view, () => {
    if (isActive(view)) {
      toLastView();
    }
  });
};

// 去最后一个
const toLastView = () => {
  const visitedViews = tagsViewStore.getVisitedViews;
  const latestView = visitedViews.slice(-1)[0];
  if (latestView) {
    push(latestView);
  } else {
    if (
      unref(currentRoute).path === permissionStore.getAddRouters[0].path ||
      unref(currentRoute).path === permissionStore.getAddRouters[0].redirect
    ) {
      addTags();
      return;
    }
    // You can set another route
    push(permissionStore.getAddRouters[0].path);
  }
};

// 关闭全部
const closeAllTags = () => {
  closeAll(() => {
    toLastView();
  });
};

// 关闭其它
const closeOthersTags = () => {
  closeOther();
};

// 重新加载
const refreshSelectedTag = async (view?: RouteLocationNormalizedLoaded) => {
  refreshPage(view);
};

// 关闭左侧
const closeLeftTags = () => {
  closeLeft();
};

// 关闭右侧
const closeRightTags = () => {
  closeRight();
};

// 滚动到选中的tag
const moveToCurrentTag = async () => {
  await nextTick();
  for (const v of unref(visitedViews)) {
    if (v.fullPath === unref(currentRoute).fullPath) {
      moveToTarget(v);
      break;
    }
  }
};

const tagLinksRefs = useTemplateRefsList<RouterLinkProps>();

const moveToTarget = (currentTag: RouteLocationNormalizedLoaded) => {
  const wrap$ = unref(scrollbarRef)?.wrapRef;
  let firstTag: Nullable<RouterLinkProps> = null;
  let lastTag: Nullable<RouterLinkProps> = null;

  const tagList = unref(tagLinksRefs);
  // find first tag and last tag
  if (tagList.length > 0) {
    firstTag = tagList[0];
    lastTag = tagList[tagList.length - 1];
  }
  if ((firstTag?.to as RouteLocationNormalizedLoaded).fullPath === currentTag.fullPath) {
    // 直接滚动到0的位置
    const { start } = useScrollTo({
      el: wrap$!,
      position: "scrollLeft",
      to: 0,
      duration: 500,
    });
    start();
  } else if ((lastTag?.to as RouteLocationNormalizedLoaded).fullPath === currentTag.fullPath) {
    // 滚动到最后的位置
    const { start } = useScrollTo({
      el: wrap$!,
      position: "scrollLeft",
      to: wrap$!.scrollWidth - wrap$!.offsetWidth,
      duration: 500,
    });
    start();
  } else {
    // find preTag and nextTag
    const currentIndex: number = tagList.findIndex(
      (item) => (item?.to as RouteLocationNormalizedLoaded).fullPath === currentTag.fullPath,
    );
    const tgsRefs = document.getElementsByClassName(`${prefixCls}__item`);

    const prevTag = tgsRefs[currentIndex - 1] as HTMLElement;
    const nextTag = tgsRefs[currentIndex + 1] as HTMLElement;

    // the tag's offsetLeft after of nextTag
    const afterNextTagOffsetLeft = nextTag.offsetLeft + nextTag.offsetWidth + 4;

    // the tag's offsetLeft before of prevTag
    const beforePrevTagOffsetLeft = prevTag.offsetLeft - 4;

    if (afterNextTagOffsetLeft > unref(scrollLeftNumber) + wrap$!.offsetWidth) {
      const { start } = useScrollTo({
        el: wrap$!,
        position: "scrollLeft",
        to: afterNextTagOffsetLeft - wrap$!.offsetWidth,
        duration: 500,
      });
      start();
    } else if (beforePrevTagOffsetLeft < unref(scrollLeftNumber)) {
      const { start } = useScrollTo({
        el: wrap$!,
        position: "scrollLeft",
        to: beforePrevTagOffsetLeft,
        duration: 500,
      });
      start();
    }
  }
};

// 是否是当前tag
const isActive = (route: RouteLocationNormalizedLoaded): boolean => {
  return route.fullPath === unref(currentRoute).fullPath;
};

// 所有右键菜单组件的元素
const itemRefs = useTemplateRefsList<ComponentRef<typeof ContextMenu & ContextMenuExpose>>();

// 右键菜单状态改变的时候
const visibleChange = (visible: boolean, tagItem: RouteLocationNormalizedLoaded) => {
  if (visible) {
    for (const v of unref(itemRefs)) {
      const elDropdownMenuRef = v.elDropdownMenuRef;
      if (tagItem.fullPath !== v.tagItem.fullPath) {
        elDropdownMenuRef?.handleClose();
        setSelectTag(tagItem);
      }
    }
  }
};

// elscroll 实例
const scrollbarRef = ref<ComponentRef<typeof ElScrollbar>>();

// 保存滚动位置
const scrollLeftNumber = ref(0);

const scroll = ({ scrollLeft }) => {
  scrollLeftNumber.value = scrollLeft as number;
};

// 移动到某个位置
const move = (to: number) => {
  const wrap$ = unref(scrollbarRef)?.wrapRef;
  const { start } = useScrollTo({
    el: wrap$!,
    position: "scrollLeft",
    to: unref(scrollLeftNumber) + to,
    duration: 500,
  });
  start();
};

onBeforeMount(() => {
  initTags();
  addTags();
});

watch(
  () => currentRoute.value,
  () => {
    addTags();
    moveToCurrentTag();
  },
);
</script>

<template>
  <div :id="prefixCls" :class="prefixCls" class="relative w-full flex bg-[var(--top-header-bg-color)]">
    <span :class="tagsViewImmerse ? '' : `${prefixCls}__tool ${prefixCls}__tool--first`"
      class="h-[var(--tags-view-height)] w-[var(--tags-view-tool-width)] flex cursor-pointer items-center justify-center"
      @click="move(-200)">
      <Icon hover-color="var(--tags-view-tool-hover-color)" color="var(--el-text-color-placeholder)"
        icon="ep:arrow-left" width="12" height="12" />
    </span>
    <div class="flex-1 overflow-hidden">
      <ElScrollbar ref="scrollbarRef" class="h-full" @scroll="scroll">
        <div class="h-[var(--tags-view-height)] flex">
          <ContextMenu v-for="item in visitedViews" :key="item.fullPath" :ref="itemRefs.set" :class="[
            `${prefixCls}__item`,
            tagsViewImmerse ? `${prefixCls}__item--immerse` : '',
            item?.meta?.affix ? `${prefixCls}__item--affix` : '',
            {
              'is-active': isActive(item),
            },
          ]" :schema="[
            {
              icon: 'ep:refresh',
              label: t('common.reload'),
              disabled: selectedTag?.fullPath !== item.fullPath,
              command: () => {
                refreshSelectedTag(item);
              },
            },
            {
              icon: 'ep:close',
              label: t('common.closeTab'),
              disabled: !!visitedViews?.length && selectedTag?.meta.affix,
              command: () => {
                closeSelectedTag(item);
              },
            },
            {
              divided: true,
              icon: 'ep:d-arrow-left',
              label: t('common.closeTheLeftTab'),
              disabled:
                !!visitedViews?.length &&
                (item.fullPath === visitedViews[0].fullPath ||
                  selectedTag?.fullPath !== item.fullPath),
              command: () => {
                closeLeftTags();
              },
            },
            {
              icon: 'ep:d-arrow-right',
              label: t('common.closeTheRightTab'),
              disabled:
                !!visitedViews?.length &&
                (item.fullPath === visitedViews[visitedViews.length - 1].fullPath ||
                  selectedTag?.fullPath !== item.fullPath),
              command: () => {
                closeRightTags();
              },
            },
            {
              divided: true,
              icon: 'ep:discount',
              label: t('common.closeOther'),
              disabled: selectedTag?.fullPath !== item.fullPath,
              command: () => {
                closeOthersTags();
              },
            },
            {
              icon: 'ep:minus',
              label: t('common.closeAll'),
              command: () => {
                closeAllTags();
              },
            },
          ]" :tag-item="item" @visible-change="visibleChange">
            <div class="h-full w-full flex min-w-0 items-center justify-center">
              <router-link :ref="tagLinksRefs.set" v-slot="{ navigate }" :to="{ ...item }" custom>
                <div :class="`h-full w-full flex min-w-0 items-center justify-center whitespace-nowrap ${prefixCls}__item--label`"
                  @click="navigate">
                  <span :class="`${prefixCls}__item--title`">
                    {{
                      t(item?.meta?.title as string) +
                      (item?.meta?.titleSuffix ? ` (${item?.meta?.titleSuffix})` : "")
                    }}
                  </span>
                  <Icon :class="`${prefixCls}__item--close`" :size="11" color="currentColor" icon="ep:close"
                    @click.prevent.stop="closeSelectedTag(item)" />
                </div>
              </router-link>
            </div>
          </ContextMenu>
        </div>
      </ElScrollbar>
    </div>
    <span :class="tagsViewImmerse ? '' : `${prefixCls}__tool`"
      class="h-[var(--tags-view-height)] w-[var(--tags-view-tool-width)] flex cursor-pointer items-center justify-center"
      @click="move(200)">
      <Icon hover-color="var(--tags-view-tool-hover-color)" color="var(--el-text-color-placeholder)"
        icon="ep:arrow-right" width="12" height="12" />
    </span>
    <span :class="tagsViewImmerse ? '' : `${prefixCls}__tool`"
      class="h-[var(--tags-view-height)] w-[var(--tags-view-tool-width)] flex cursor-pointer items-center justify-center"
      @click="refreshSelectedTag(selectedTag)">
      <Icon hover-color="var(--tags-view-tool-hover-color)" color="var(--el-text-color-placeholder)" icon="ep:refresh"
        width="12" height="12" />
    </span>
    <ContextMenu :schema="[
      {
        icon: 'ep:refresh',
        label: t('common.reload'),
        command: () => {
          refreshSelectedTag(selectedTag);
        },
      },
      {
        icon: 'ep:close',
        label: t('common.closeTab'),
        disabled: !!visitedViews?.length && selectedTag?.meta.affix,
        command: () => {
          closeSelectedTag(selectedTag!);
        },
      },
      {
        divided: true,
        icon: 'ep:d-arrow-left',
        label: t('common.closeTheLeftTab'),
        disabled: !!visitedViews?.length && selectedTag?.fullPath === visitedViews[0].fullPath,
        command: () => {
          closeLeftTags();
        },
      },
      {
        icon: 'ep:d-arrow-right',
        label: t('common.closeTheRightTab'),
        disabled:
          !!visitedViews?.length &&
          selectedTag?.fullPath === visitedViews[visitedViews.length - 1].fullPath,
        command: () => {
          closeRightTags();
        },
      },
      {
        divided: true,
        icon: 'ep:discount',
        label: t('common.closeOther'),
        command: () => {
          closeOthersTags();
        },
      },
      {
        icon: 'ep:minus',
        label: t('common.closeAll'),
        command: () => {
          closeAllTags();
        },
      },
    ]" trigger="click">
      <span :class="tagsViewImmerse ? '' : `${prefixCls}__tool`"
        class="block h-[var(--tags-view-height)] w-[var(--tags-view-tool-width)] flex cursor-pointer items-center justify-center">
        <Icon hover-color="var(--tags-view-tool-hover-color)" color="var(--el-text-color-placeholder)"
          icon="ep:more-filled" width="12" height="12" />
      </span>
    </ContextMenu>
  </div>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-tags-view;

.#{$prefix-cls} {
  isolation: isolate;
  border-top: 1px solid color-mix(in srgb, var(--tags-view-border-color) 44%, transparent 56%);
  border-bottom: 1px solid color-mix(in srgb, var(--tags-view-border-color) 58%, transparent 42%);
  background: linear-gradient(180deg,
      color-mix(in srgb, var(--top-header-bg-color) 92%, #ffffff 8%) 0%,
      var(--top-header-bg-color) 100%);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #ffffff 68%, transparent 32%),
    inset 0 -1px 0 color-mix(in srgb, var(--tags-view-border-color) 16%, transparent 84%);

  >* {
    position: relative;
    z-index: 1;
  }

  :deep(.#{$elNamespace}-scrollbar__view) {
    height: 100%;
  }

  :deep(.#{$elNamespace}-scrollbar__bar.is-horizontal) {
    display: none;
  }

  &__tool {
    position: relative;
    color: var(--tags-view-tool-color);
    border-radius: 7px;
    transform-origin: center;
    transition:
      color 0.2s ease,
      background-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.18s ease;
    will-change: transform;

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-left: 1px solid color-mix(in srgb, var(--tags-view-border-color) 18%, transparent 82%);
      content: "";
    }

    &:hover {
      z-index: 3;
      color: var(--tags-view-tool-hover-color);
      background: color-mix(in srgb, var(--tags-view-tool-hover-bg) 56%, transparent 44%);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
      transform: translateY(-1px) scale(1.12);
    }

    &:active {
      box-shadow: none;
      transform: translateY(0) scale(0.96);
      transition-duration: 0.08s;
    }

    &:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--el-color-primary) 42%, transparent 58%);
      outline-offset: -2px;
    }

    &--first {
      &::before {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-right: 1px solid color-mix(in srgb, var(--tags-view-border-color) 18%, transparent 82%);
        border-left: none;
        content: "";
      }
    }
  }

  &__item {
    position: relative;
    top: 0;
    display: flex;
    height: calc(100% - 10px);
    align-items: center;
    justify-content: center;
    min-width: 0;
    max-width: var(--tags-view-item-max-width, 200px);
    padding-right: 0;
    margin: 5px 0 5px 4px;
    font-size: var(--tags-view-item-font-size);
    font-weight: 400;
    color: var(--tags-view-item-color);
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    box-sizing: border-box;
    transform-origin: center;
    transition:
      color 0.2s ease,
      background-color 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.18s ease;
    will-change: transform;

    &--close {
      position: absolute;
      top: 50%;
      right: var(--tags-view-close-right);
      display: flex;
      width: var(--tags-view-close-size);
      height: var(--tags-view-close-size);
      align-items: center;
      justify-content: center;
      color: inherit;
      opacity: 0.6;
      border-radius: 999px;
      transform: translate(0, -50%);
      transition:
        opacity 0.18s ease,
        background-color 0.18s ease,
        transform 0.18s ease;
    }

    &:hover {
      z-index: 3;
      color: var(--tags-view-item-hover-color);
      background: color-mix(in srgb, var(--tags-view-item-hover-bg) 70%, transparent 30%);
      border-color: color-mix(in srgb, var(--tags-view-item-border-color) 42%, transparent 58%);
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
      transform: translateY(-1px) scale(1.02);

      &:not(.#{$prefix-cls}__item--affix) .#{$prefix-cls}__item--close {
        opacity: 0.85;
      }

      .#{$prefix-cls}__item--close:hover {
        opacity: 1;
        background: color-mix(in srgb, var(--tags-view-tool-hover-bg) 75%, transparent 25%);
        transform: translate(0, -50%) scale(1.15);
      }
    }

    &:active {
      box-shadow: none;
      transform: translateY(0) scale(0.98);
      transition-duration: 0.08s;
    }
  }

  &__item--label {
    display: flex;
    width: 100%;
    height: 100%;
    min-width: 0;
    align-items: center;
    justify-content: center;
    padding-left: var(--tags-view-item-inline-padding, 14px);
    padding-right: calc(var(--tags-view-close-size, 16px) + var(--tags-view-close-right, 6px) + 10px);
    line-height: 1;
    text-align: center;
    cursor: pointer;
    box-sizing: border-box;
  }

  &__item--affix .#{$prefix-cls}__item--label {
    padding-left: var(--tags-view-item-inline-padding, 14px);
    padding-right: var(--tags-view-item-inline-padding, 14px);
  }

  &__item.is-active {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--tags-view-item-bg) 82%, transparent 18%);
    border-color: color-mix(in srgb,
        var(--tags-view-item-active-border-color) 44%,
        transparent 56%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      0 1px 2px rgba(15, 23, 42, 0.03);
  }

  &__item.is-active .#{$prefix-cls}__item--title {
    color: var(--el-color-primary);
  }

  &__item--title {
    position: relative;
    display: inline-block;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    vertical-align: middle;
    white-space: nowrap;
  }

  &__item.is-active .#{$prefix-cls}__item--title::after {
    position: absolute;
    bottom: var(--tags-view-active-indicator-offset);
    left: 50%;
    width: var(--tags-view-active-indicator-width);
    height: 2px;
    border-radius: 999px;
    background: var(--el-color-primary);
    content: "";
    transform: translateX(-50%);
  }

  &__item--immerse {
    top: 0;
    height: calc(100% - 10px);
    padding-right: 0;
    margin: 5px 0 5px 4px;

    .#{$prefix-cls}__item--label {
      padding-left: var(--tags-view-item-inline-padding, 14px);
      padding-right: calc(var(--tags-view-close-size, 16px) + var(--tags-view-close-right, 6px) + 10px);
    }

    .#{$prefix-cls}__item--close {
      right: var(--tags-view-close-right);
    }
  }

  &__item--immerse:not(.is-active) {
    &:hover {
      color: var(--tags-view-item-hover-color);
    }
  }
}

.dark {
  .#{$prefix-cls} {
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--top-header-bg-color) 96%, #1f1f1f 4%) 0%,
        var(--top-header-bg-color) 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.03),
      inset 0 -1px 0 color-mix(in srgb, var(--tags-view-border-color) 32%, transparent 68%);

    &::before {
      border-color: color-mix(in srgb, var(--tags-view-border-color) 92%, transparent 8%);
      background: color-mix(in srgb, var(--top-header-bg-color) 94%, #1a1a1a 6%);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
    }

    &__tool {
      &--first {
        &::after {
          display: none;
        }
      }
    }

    &__item {
      background: transparent;
      border-color: transparent;
    }

    &__item.is-active {
      color: var(--el-color-primary);
      background: color-mix(in srgb, var(--tags-view-item-bg) 92%, transparent 8%);
      border-color: color-mix(in srgb,
          var(--tags-view-item-active-border-color) 30%,
          transparent 70%);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.03),
        0 1px 2px rgba(0, 0, 0, 0.16);
    }

    &__item--immerse:not(.is-active) {
      &:hover {
        color: var(--tags-view-item-hover-color);
      }
    }
  }
}
</style>
