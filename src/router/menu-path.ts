import { isUrl } from "@/utils/is";
import { pathResolve } from "@/utils/routerHelper";

function getVisibleChildren(route: AppRouteRecordRaw) {
  return (route.children || []).filter((child) => !child.meta?.hidden);
}

export function resolveMenuRoutePath(route: AppRouteRecordRaw, parentPath = "/") {
  return isUrl(route.path) ? route.path : pathResolve(parentPath, route.path);
}

export function resolveFirstAccessibleMenuPath(
  routes: AppRouteRecordRaw[],
  parentPath = "/",
) {
  for (const route of routes) {
    if (route.meta?.hidden) {
      continue;
    }

    const routePath = resolveMenuRoutePath(route, parentPath);
    const childPath = resolveFirstAccessibleMenuPath(
      getVisibleChildren(route),
      routePath,
    );

    if (childPath) {
      return childPath;
    }

    if (routePath) {
      return routePath;
    }
  }

  return "";
}
