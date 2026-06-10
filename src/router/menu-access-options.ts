import remainingRouter from "@/router/modules/remaining";
import {
  ADMIN_ONLY_MENU_KEYS,
  type MenuAccessGroup,
  type MenuAccessOption,
} from "@/constants/access-control";

function getVisibleChildren(route: AppRouteRecordRaw) {
  return (route.children || []).filter((child) => !child.meta?.hidden);
}

function getMenuKey(route: AppRouteRecordRaw) {
  return String(route.meta?.menuKey || "").trim();
}

function getLegacyMenuKeys(route: AppRouteRecordRaw) {
  return Array.isArray(route.meta?.legacyMenuKeys)
    ? route.meta.legacyMenuKeys
        .map((item: any) => String(item || "").trim())
        .filter(Boolean)
    : [];
}

function createMenuOption(route: AppRouteRecordRaw): MenuAccessOption | null {
  const key = getMenuKey(route);
  if (!key) {
    return null;
  }

  const legacyKeys = getLegacyMenuKeys(route);

  return {
    key,
    label: String(route.meta?.title || route.name || route.path),
    adminOnly: !!route.meta?.requiresAdmin || ADMIN_ONLY_MENU_KEYS.has(key),
    ...(legacyKeys.length ? { legacyKeys } : {}),
  };
}

function collectMenuOptions(routes: AppRouteRecordRaw[]): MenuAccessOption[] {
  return routes.flatMap((route) => {
    if (route.meta?.hidden) {
      return [];
    }

    const visibleChildren = getVisibleChildren(route);
    if (visibleChildren.length) {
      return collectMenuOptions(visibleChildren);
    }

    const option = createMenuOption(route);
    return option ? [option] : [];
  });
}

function dedupeOptions(options: MenuAccessOption[]) {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.key)) {
      return false;
    }

    seen.add(option.key);
    return true;
  });
}

export function buildMenuAccessGroups(
  routes: AppRouteRecordRaw[] = remainingRouter,
): MenuAccessGroup[] {
  return routes.flatMap((route) => {
    if (route.meta?.hidden) {
      return [];
    }

    const visibleChildren = getVisibleChildren(route);
    const options = visibleChildren.length
      ? collectMenuOptions(visibleChildren)
      : createMenuOption(route)
        ? [createMenuOption(route) as MenuAccessOption]
        : [];

    if (!options.length) {
      return [];
    }

    return [
      {
        label: String(route.meta?.title || route.name || route.path),
        options: dedupeOptions(options),
      },
    ];
  });
}

export const MENU_ACCESS_GROUPS = buildMenuAccessGroups();
export const MENU_ACCESS_OPTIONS = MENU_ACCESS_GROUPS.flatMap((group) => group.options);

export function normalizeMenuAccessKeys(
  rawKeys: string[],
  selectableKeys?: Set<string>,
) {
  const selectedKeys = new Set(
    rawKeys.map((item) => String(item || "").trim()).filter(Boolean),
  );

  return MENU_ACCESS_OPTIONS.filter((option) => {
    if (selectableKeys && !selectableKeys.has(option.key)) {
      return false;
    }

    if (selectedKeys.has(option.key)) {
      return true;
    }

    return (option.legacyKeys || []).some((legacyKey) => selectedKeys.has(legacyKey));
  }).map((option) => option.key);
}
