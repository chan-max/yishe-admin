import router from "@/router";
import type { RouteLocationNormalizedLoaded } from "vue-router";
import { getRawRoute } from "@/utils/routerHelper";
import { defineStore } from "pinia";
import { store } from "../index";
import { findIndex } from "@/utils";
import { useUserStoreWithOut } from "./user";

export interface TagsViewState {
  visitedViews: RouteLocationNormalizedLoaded[];
  cachedViews: Set<string>;
  selectedTag?: RouteLocationNormalizedLoaded;
  refreshViewMap: Record<string, number>;
}

export const useTagsViewStore = defineStore("tagsView", {
  state: (): TagsViewState => ({
    visitedViews: [],
    cachedViews: new Set(),
    selectedTag: undefined,
    refreshViewMap: {},
  }),
  getters: {
    getVisitedViews(): RouteLocationNormalizedLoaded[] {
      return this.visitedViews;
    },
    getCachedViews(): string[] {
      return Array.from(this.cachedViews);
    },
    getSelectedTag(): RouteLocationNormalizedLoaded | undefined {
      return this.selectedTag;
    },
  },
  actions: {
    // 新增缓存和tag
    addView(view: RouteLocationNormalizedLoaded): void {
      this.addVisitedView(view);
      this.addCachedView();
    },
    // 新增tag
    addVisitedView(view: RouteLocationNormalizedLoaded) {
      // 使用 path（不含 query）判断，同一页面的不同 ?参数 不重复生成 Tab
      if (this.visitedViews.some((v) => v.path === view.path)) return;
      if (view.meta?.noTagsView) return;
      const visitedView = Object.assign({}, view, { title: view.meta?.title || "no-name" });

      if (visitedView.meta) {
        const titleSuffixList: string[] = [];
        this.visitedViews.forEach((v) => {
          if (v.path === visitedView.path && v.meta?.title === visitedView.meta?.title) {
            titleSuffixList.push(v.meta?.titleSuffix || "1");
          }
        });
        if (titleSuffixList.length) {
          let titleSuffix = 1;
          while (titleSuffixList.includes(`${titleSuffix}`)) {
            titleSuffix += 1;
          }
          visitedView.meta.titleSuffix = titleSuffix === 1 ? undefined : `${titleSuffix}`;
        }
      }

      this.visitedViews.push(visitedView);
    },
    // 新增缓存
    addCachedView() {
      const cacheMap: Set<string> = new Set();
      for (const v of this.visitedViews) {
        const item = getRawRoute(v);
        const needCache = !item.meta?.noCache;
        if (!needCache) {
          continue;
        }
        const rawName = item.name;
        if (!rawName || typeof rawName === "symbol") continue;
        // 使用统一前缀 + route.name 作为缓存 key，与 AppView.vue 中的 getRouteCacheName 保持一致
        cacheMap.add(`RouteKeepAlive__${rawName}`);
      }
      if (Array.from(this.cachedViews).sort().toString() === Array.from(cacheMap).sort().toString())
        return;
      this.cachedViews = cacheMap;
    },
    // 删除某个
    delView(view: RouteLocationNormalizedLoaded) {
      this.delVisitedView(view);
      this.delCachedView();
    },
    // 删除tag
    delVisitedView(view: RouteLocationNormalizedLoaded) {
      for (const [i, v] of this.visitedViews.entries()) {
        if (v.path === view.path) {
          this.visitedViews.splice(i, 1);
          break;
        }
      }
    },
    // 删除缓存
    delCachedView() {
      const route = router.currentRoute.value;
      const rawName = route.name;
      if (!rawName || typeof rawName === "symbol") return;
      const routeCacheName = `RouteKeepAlive__${rawName}`;
      const index = findIndex<string>(this.getCachedViews, (v) => v === routeCacheName);
      if (index > -1) {
        this.cachedViews.delete(this.getCachedViews[index]);
      }
    },
    // 删除所有缓存和tag
    delAllViews() {
      this.delAllVisitedViews();
      this.delCachedView();
    },
    // 删除所有tag
    delAllVisitedViews() {
      const userStore = useUserStoreWithOut();

      // const affixTags = this.visitedViews.filter((tag) => tag.meta.affix)
      this.visitedViews = userStore.getUser
        ? this.visitedViews.filter((tag) => tag?.meta?.affix)
        : [];
    },
    // 删除其他
    delOthersViews(view: RouteLocationNormalizedLoaded) {
      this.delOthersVisitedViews(view);
      this.addCachedView();
    },
    // 删除其他tag
    delOthersVisitedViews(view: RouteLocationNormalizedLoaded) {
      this.visitedViews = this.visitedViews.filter((v) => {
        return v?.meta?.affix || v.path === view.path;
      });
    },
    // 删除左侧
    delLeftViews(view: RouteLocationNormalizedLoaded) {
      const index = findIndex<RouteLocationNormalizedLoaded>(
        this.visitedViews,
        (v) => v.path === view.path,
      );
      if (index > -1) {
        this.visitedViews = this.visitedViews.filter((v, i) => {
          return v?.meta?.affix || v.path === view.path || i > index;
        });
        this.addCachedView();
      }
    },
    // 删除右侧
    delRightViews(view: RouteLocationNormalizedLoaded) {
      const index = findIndex<RouteLocationNormalizedLoaded>(
        this.visitedViews,
        (v) => v.path === view.path,
      );
      if (index > -1) {
        this.visitedViews = this.visitedViews.filter((v, i) => {
          return v?.meta?.affix || v.path === view.path || i < index;
        });
        this.addCachedView();
      }
    },
    // 刷新单个路由视图（通过更新 key 来触发 keep-alive 重新创建组件实例）
    refreshView(view: RouteLocationNormalizedLoaded) {
      const name = view.name as string;
      if (!name) return;
      this.refreshViewMap[name] = (this.refreshViewMap[name] || 0) + 1;
    },

    updateVisitedView(view: RouteLocationNormalizedLoaded) {
      for (let v of this.visitedViews) {
        if (v.path === view.path) {
          v = Object.assign(v, view);
          break;
        }
      }
    },
    // 设置当前选中的 tag
    setSelectedTag(tag: RouteLocationNormalizedLoaded) {
      this.selectedTag = tag;
    },
    setTitle(title: string, path?: string) {
      for (const v of this.visitedViews) {
        if (v.path === (path ?? this.selectedTag?.path)) {
          v.meta.title = title;
          break;
        }
      }
    },
  },
  persist: false,
});

export const useTagsViewStoreWithOut = () => {
  return useTagsViewStore(store);
};
