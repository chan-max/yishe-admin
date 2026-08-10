<script lang="ts" setup>
import { ElMessage, ElMessageBox } from "element-plus";

import avatarImg from "@/assets/imgs/avatar.png";
import { useDesign } from "@/hooks/web/useDesign";
import { useTagsViewStore } from "@/store/modules/tagsView";
import { usePermissionStore } from "@/store/modules/permission";
import { useUserStore } from "@/store/modules/user";
import { getAccessToken } from "@/utils/auth";

defineOptions({ name: "UserInfo" });

const { t } = useI18n();
const { push, replace } = useRouter();
const userStore = useUserStore();
const permissionStore = usePermissionStore();
const tagsViewStore = useTagsViewStore();
const { getPrefixCls } = useDesign();
const prefixCls = getPrefixCls("user-info");

const avatar = computed(() => userStore.user.avatar || avatarImg);
const userName = computed(() => userStore.user.name || userStore.user.account || "Admin");

const companyName = computed(() => userStore.user.company?.name || null);
const isAdmin = computed(() => userStore.user.isAdmin || false);
const expireTime = computed(() => userStore.user.expireTime);
const isForever = computed(() => !expireTime.value);

const remainingTime = computed(() => {
  if (!expireTime.value) return "永久有效";

  const now = new Date().getTime();
  const expire = new Date(expireTime.value).getTime();
  const diff = expire - now;

  if (diff <= 0) return "已过期";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `还有 ${days} 天到期`;
  if (hours > 0) return `还有 ${hours} 小时到期`;
  if (minutes > 0) return `还有 ${minutes} 分钟到期`;
  return "即将到期";
});

function hasRouteByName(routes: AppRouteRecordRaw[] = [], routeName: string): boolean {
  return routes.some((route) => {
    if (String(route.name || "") === routeName) {
      return true;
    }
    return hasRouteByName(route.children || [], routeName);
  });
}

const canAccessProfile = computed(() =>
  hasRouteByName(permissionStore.getRouters, "PersonalSettings"),
);

const loginOut = async () => {
  try {
    await ElMessageBox.confirm(t("common.loginOutMessage"), t("common.reminder"), {
      confirmButtonText: t("common.ok"),
      cancelButtonText: t("common.cancel"),
      type: "warning",
    });
    await userStore.loginOut();
    tagsViewStore.delAllViews();
    replace("/login?redirect=/home/index");
  } catch {}
};

const toProfile = async () => {
  if (!canAccessProfile.value) {
    return;
  }
  push("/personal/settings");
};

function copyToClipboard(text: string): boolean {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    return true;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

function handleViewToken() {
  const token = getAccessToken();
  if (!token) {
    ElMessage.warning("当前没有可用的 Token");
    return;
  }
  ElMessageBox.alert(
    `<div style="word-break:break-all;font-family:monospace;font-size:12px;line-height:1.6;max-height:200px;overflow-y:auto;padding:8px;background:var(--el-fill-color-light);border-radius:4px;user-select:all">${token}</div>`,
    "当前登录 Token",
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: "复制并关闭",
      showClose: true,
      customClass: "token-viewer-dialog",
      callback: (action: string) => {
        if (action === "confirm") {
          if (copyToClipboard(token)) {
            ElMessage.success("Token 已复制到剪贴板");
          } else {
            ElMessage.error("复制失败，请手动选中复制");
          }
        }
      },
    },
  );
}
</script>

<template>
  <ElDropdown :class="prefixCls" trigger="click">
    <div class="user-trigger">
      <ElAvatar :size="26" :src="avatar" class="user-avatar" />
      <div class="user-meta <lg:hidden">
        <span class="user-name">{{ userName }}</span>
        <span class="user-role" :class="isAdmin ? 'is-admin' : 'is-member'">
          {{ isAdmin ? "Administrator" : "Member" }}
        </span>
      </div>
      <Icon icon="ep:caret-bottom" class="user-caret" />
    </div>

    <template #dropdown>
      <ElDropdownMenu class="ud-menu">
        <div class="ud-profile">
          <ElAvatar :src="avatar" :size="36" class="ud-avatar" />
          <div class="ud-info">
            <p class="ud-name">{{ userName }}</p>
            <p v-if="companyName" class="ud-company">{{ companyName }}</p>
            <p class="ud-expire" :class="{ 'is-forever': isForever }">{{ remainingTime }}</p>
          </div>
        </div>

        <div class="ud-actions">
          <ElDropdownItem v-if="canAccessProfile" @click="toProfile" class="ud-item">
            <Icon icon="ep:user" class="ud-icon" />
            {{ t("common.profile") }}
          </ElDropdownItem>
          <ElDropdownItem @click="handleViewToken" class="ud-item">
            <Icon icon="ep:view" class="ud-icon" />
            查看 Token
          </ElDropdownItem>
          <div class="ud-sep" />
          <ElDropdownItem @click="loginOut" class="ud-item ud-item--out">
            <Icon icon="ep:switch-button" class="ud-icon" />
            {{ t("common.loginOut") }}
          </ElDropdownItem>
        </div>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>

<style scoped lang="scss">


@media (width <= 768px) {
  .user-trigger {
    padding: 2px;
    gap: 0;
  }
}

.user-trigger {
  display: flex;
  padding: 2px 6px 2px 2px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
  align-items: center;
  gap: 8px;

  &:hover {
    background: rgb(0 0 0 / 4%);
  }
}

.user-avatar {
  flex-shrink: 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--top-header-text-color);
  white-space: nowrap;
}

.user-role {
  font-size: 10px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.01em;
  white-space: nowrap;

  &.is-admin {
    color: #f59e0b;
  }

  &.is-member {
    color: var(--el-text-color-placeholder);
  }
}

.user-caret {
  font-size: 10px;
  opacity: 0.25;
  flex-shrink: 0;
}

/* Dropdown */
.ud-menu {
  min-width: 200px !important;
  padding: 0 !important;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light) !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgb(0 0 0 / 10%) !important;
}

.ud-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.ud-avatar {
  flex-shrink: 0;
}

.ud-info {
  flex: 1;
  min-width: 0;
}

.ud-name {
  margin: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ud-company {
  margin: 3px 0 0;
  overflow: hidden;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ud-expire {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--el-text-color-placeholder);

  &.is-forever {
    color: #10b981;
  }
}

.ud-actions {
  padding: 4px;
}

.ud-sep {
  height: 1px;
  margin: 3px 0;
  background: var(--el-border-color-lighter);
}

.ud-item {
  display: flex !important;
  padding: 6px 10px !important;
  font-size: 12.5px !important;
  font-weight: 400 !important;
  color: var(--el-text-color-primary) !important;
  border-radius: 5px !important;
  transition: background 0.12s !important;
  align-items: center !important;
  gap: 7px !important;

  &:hover {
    color: var(--el-text-color-primary) !important;
    background: var(--el-fill-color-light) !important;
  }

  &--out {
    color: var(--el-color-danger) !important;

    &:hover {
      color: var(--el-color-danger) !important;
      background: var(--el-color-danger-light-9) !important;
    }
  }
}

.ud-icon {
  font-size: 13px;
  opacity: 0.6;
}

:deep(.el-dropdown) {
  color: inherit;
}

/* Trigger */
</style>

<style lang="scss">
/* Token viewer dialog — must be global (ElMessageBox renders outside scoped scope) */
.token-viewer-dialog {
  max-width: 560px;

  .el-message-box__header {
    padding-bottom: 8px;
  }

  .el-message-box__title {
    font-size: 14px;
    font-weight: 600;
  }

  .el-message-box__content {
    padding-top: 0;
  }

  .el-message-box__btns {
    padding-top: 12px;
  }
}
</style>
