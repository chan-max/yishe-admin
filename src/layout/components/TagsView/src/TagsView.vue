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
      tagsViewStore.addVisitedView(cloneDeep(tag));
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
  <div
    :id="prefixCls"
    :class="prefixCls"
    class="relative w-full flex border-b border-[color:color-mix(in_srgb,var(--tags-view-border-color)_16%,transparent_84%)] bg-[var(--top-header-bg-color)]"
  >
    <span
      :class="tagsViewImmerse ? '' : `${prefixCls}__tool ${prefixCls}__tool--first`"
      class="h-[var(--tags-view-height)] w-[34px] flex cursor-pointer items-center justify-center"
      @click="move(-200)"
    >
      <Icon
        hover-color="var(--tags-view-tool-hover-color)"
        color="var(--el-text-color-placeholder)"
        icon="ep:arrow-left"
        width="12"
        height="12"
      />
    </span>
    <div class="flex-1 overflow-hidden">
      <ElScrollbar ref="scrollbarRef" class="h-full" @scroll="scroll">
        <div class="h-[var(--tags-view-height)] flex">
          <ContextMenu
            v-for="item in visitedViews"
            :key="item.fullPath"
            :ref="itemRefs.set"
            :class="[
              `${prefixCls}__item`,
              tagsViewImmerse ? `${prefixCls}__item--immerse` : '',
              item?.meta?.affix ? `${prefixCls}__item--affix` : '',
              {
                'is-active': isActive(item),
              },
            ]"
            :schema="[
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
            ]"
            :tag-item="item"
            @visible-change="visibleChange"
          >
            <div>
              <router-link :ref="tagLinksRefs.set" v-slot="{ navigate }" :to="{ ...item }" custom>
                <div
                  :class="`h-full flex items-center justify-center whitespace-nowrap ${prefixCls}__item--label`"
                  @click="navigate"
                >
                  <span :class="`${prefixCls}__item--title`">
                    {{
                      t(item?.meta?.title as string) +
                      (item?.meta?.titleSuffix ? ` (${item?.meta?.titleSuffix})` : "")
                    }}
                  </span>
                  <Icon
                    :class="`${prefixCls}__item--close`"
                    :size="11"
                    color="currentColor"
                    icon="ep:close"
                    @click.prevent.stop="closeSelectedTag(item)"
                  />
                </div>
              </router-link>
            </div>
          </ContextMenu>
        </div>
      </ElScrollbar>
    </div>
    <span
      :class="tagsViewImmerse ? '' : `${prefixCls}__tool`"
      class="h-[var(--tags-view-height)] w-[34px] flex cursor-pointer items-center justify-center"
      @click="move(200)"
    >
      <Icon
        hover-color="var(--tags-view-tool-hover-color)"
        color="var(--el-text-color-placeholder)"
        icon="ep:arrow-right"
        width="12"
        height="12"
      />
    </span>
    <span
      :class="tagsViewImmerse ? '' : `${prefixCls}__tool`"
      class="h-[var(--tags-view-height)] w-[34px] flex cursor-pointer items-center justify-center"
      @click="refreshSelectedTag(selectedTag)"
    >
      <Icon
        hover-color="var(--tags-view-tool-hover-color)"
        color="var(--el-text-color-placeholder)"
        icon="ep:refresh"
        width="12"
        height="12"
      />
    </span>
    <ContextMenu
      :schema="[
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
      ]"
      trigger="click"
    >
      <span
        :class="tagsViewImmerse ? '' : `${prefixCls}__tool`"
        class="block h-[var(--tags-view-height)] w-[34px] flex cursor-pointer items-center justify-center"
      >
        <Icon
          hover-color="var(--tags-view-tool-hover-color)"
          color="var(--el-text-color-placeholder)"
          icon="ep:more-filled"
          width="12"
          height="12"
        />
      </span>
    </ContextMenu>
  </div>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-tags-view;

.#{$prefix-cls} {
  :deep(.#{$elNamespace}-scrollbar__view) {
    height: 100%;
  }

  :deep(.#{$elNamespace}-scrollbar__bar.is-horizontal) {
    display: none;
  }

  &__tool {
    position: relative;
    color: var(--tags-view-tool-color);
    transition:
      color 0.2s ease,
      background-color 0.2s ease;

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
      color: var(--tags-view-tool-hover-color);
      background: color-mix(in srgb, var(--tags-view-tool-hover-bg) 56%, transparent 44%);
    }

    &--first {
      &::before {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-right: 1px solid
          color-mix(in srgb, var(--tags-view-border-color) 18%, transparent 82%);
        border-left: none;
        content: "";
      }
    }
  }

  &__item {
    position: relative;
    top: 0;
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: center;
    padding-right: 0;
    margin-left: 0;
    font-size: 11px;
    font-weight: 400;
    color: var(--tags-view-item-color);
    cursor: pointer;
    border-right: 1px solid
      color-mix(in srgb, var(--tags-view-item-border-color) 58%, transparent 42%);
    border-radius: 0;
    box-sizing: border-box;
    transition:
      color 0.2s ease,
      background-color 0.2s ease,
      border-color 0.2s ease;

    &--close {
      position: absolute;
      top: 50%;
      right: 6px;
      display: flex;
      width: 13px;
      height: 13px;
      align-items: center;
      justify-content: center;
      color: inherit;
      opacity: 0;
      border-radius: 999px;
      transform: translate(0, -50%);
      transition:
        opacity 0.18s ease,
        background-color 0.18s ease;
    }

    &:not(.#{$prefix-cls}__item--affix):hover {
      color: var(--tags-view-item-hover-color);
      background: color-mix(in srgb, var(--tags-view-item-hover-bg) 72%, transparent 28%);

      .#{$prefix-cls}__item--close {
        opacity: 1;
      }

      .#{$prefix-cls}__item--close:hover {
        background: color-mix(in srgb, var(--tags-view-tool-hover-bg) 52%, transparent 48%);
      }
    }
  }

  &__item--label {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    justify-content: center;
    padding: 0 24px;
    line-height: 1;
    text-align: center;
  }

  &__item.is-active {
    color: var(--el-color-primary);
    background: none;
    border-right-color: color-mix(
      in srgb,
      var(--tags-view-item-active-border-color) 46%,
      transparent 54%
    );
    box-shadow: none;
  }

  &__item.is-active .#{$prefix-cls}__item--title {
    color: var(--el-color-primary);
  }

  &__item--title {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    max-width: 100%;
    text-align: center;
  }

  &__item.is-active .#{$prefix-cls}__item--title::after {
    position: absolute;
    bottom: -10px;
    left: 50%;
    width: 24px;
    height: 2px;
    border-radius: 999px;
    background: var(--el-color-primary);
    content: "";
    transform: translateX(-50%);
  }

  &__item--immerse {
    top: 0;
    height: 100%;
    padding-right: 0;
    margin: 0;
    border: none !important;

    .#{$prefix-cls}__item--label {
      padding: 0 24px;
    }

    .#{$prefix-cls}__item--close {
      right: 6px;
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
    &__tool {
      &--first {
        &::after {
          display: none;
        }
      }
    }

    &__item {
      border-right-color: color-mix(
        in srgb,
        var(--tags-view-item-border-color) 72%,
        transparent 28%
      );
    }

    &__item.is-active {
      color: var(--el-color-primary);
      background: none;
    }

    &__item--immerse:not(.is-active) {
      &:hover {
        color: var(--tags-view-item-hover-color);
      }
    }
  }
}
</style>
