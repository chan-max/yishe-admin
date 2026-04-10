function readConfiguredMenuKeys(setting: any) {
  if (!setting || typeof setting !== "object") {
    return { configured: false, keys: [] as string[] };
  }

  const rawMenuAccess = setting.menuAccess && typeof setting.menuAccess === "object"
    ? setting.menuAccess
    : null;
  const rawAccessControl = setting.accessControl && typeof setting.accessControl === "object"
    ? setting.accessControl
    : null;
  const configured = !!rawMenuAccess || !!rawAccessControl;
  const keys = Array.isArray(rawMenuAccess?.keys)
    ? rawMenuAccess.keys
    : Array.isArray(rawAccessControl?.menuKeys)
      ? rawAccessControl.menuKeys
      : [];

  return {
    configured,
    keys: Array.from(new Set(keys.map((item: any) => String(item || "").trim()).filter(Boolean)))
  };
}

const ALWAYS_ALLOW_ROUTE_NAMES = new Set([
  "Root",
  "RedirectRoot",
  "Redirect",
  "Home",
  "Index",
  "Login",
  "NoAccess",
  "NoFound",
  "Error",
  "Personal",
  "PersonalSettings",
  "UserProfileCompat",
]);

export function hasRouteMenuAccess(route: AppRouteRecordRaw, user: any) {
  const { configured, keys } = readConfiguredMenuKeys(user?.setting);
  const isAdmin = !!user?.isAdmin;
  const routeName = String(route.name || "").trim();
  const menuKey = String(route.meta?.menuKey || "").trim();

  if (ALWAYS_ALLOW_ROUTE_NAMES.has(routeName)) {
    return true;
  }

  if (route.meta?.hidden && route.meta?.noTagsView && !menuKey) {
    return false;
  }

  if (menuKey) {
    if (configured) {
      return keys.includes(menuKey);
    }
    if (isAdmin) {
      return true;
    }
    return menuKey === "personal.settings";
  }

  if (!isAdmin && route.meta?.requiresAdmin) {
    return false;
  }

  return Array.isArray(route.children) && route.children.length > 0;
}
