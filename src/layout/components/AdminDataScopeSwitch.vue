<template>
  <el-popover
    v-if="visible"
    placement="bottom-end"
    :width="260"
    :show-arrow="false"
    :offset="8"
    trigger="click"
    :transition="''"
    popper-class="header-data-scope-popper"
  >
    <template #reference>
      <button type="button" class="ads-trigger" :aria-label="t('layout.dataScope.dataScope')">
        <Icon icon="ep:data-board" class="th-action-icon" :size="18" />
        <span class="th-action-label">{{ t('layout.dataScope.data') }}</span>
      </button>
    </template>

    <div class="ads-panel">
      <div class="ads-panel__title">{{ t("layout.dataScope.dataScope") }}</div>
      <el-radio-group
        v-model="radioValue"
        :disabled="switching"
        class="ads-radios"
        @change="handleRadioChange"
      >
        <el-radio-button value="self">{{ t("layout.dataScope.myData") }}</el-radio-button>
        <el-radio-button value="all">{{ t("layout.dataScope.allData") }}</el-radio-button>
      </el-radio-group>
      <el-select
        v-if="userOptions.length"
        v-model="selectedValue"
        filterable
        :loading="loading || switching"
        :disabled="switching"
        :placeholder="t('layout.dataScope.selectUserPlaceholder')"
        class="ads-select"
        size="small"
        @change="handleSelectChange"
      >
        <el-option-group :label="t('layout.dataScope.specifiedUser')">
          <el-option
            v-for="item in userOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-option-group>
      </el-select>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Icon } from "@/components/Icon";
import { ElMessage } from "element-plus";
import { getUserList } from "@/api/user";
import { useTagsView } from "@/hooks/web/useTagsView";
import { useDataScopeStore } from "@/store/modules/dataScope";
import { useUserStore } from "@/store/modules/user";

type UserOption = {
  value: string;
  label: string;
  userId: string;
};

defineOptions({ name: "AdminDataScopeSwitch" });

const { t } = useI18n();

const userStore = useUserStore();
const dataScopeStore = useDataScopeStore();
const { refreshPage } = useTagsView();
const loading = ref(false);
const loaded = ref(false);
const userOptions = ref<UserOption[]>([]);
const switching = ref(false);

const visible = computed(() => !!userStore.user?.isAdmin);

const selectedValue = computed({
  get: () => {
    if (dataScopeStore.mode === "all") return "all";
    if (dataScopeStore.mode === "user" && dataScopeStore.userId)
      return `user:${dataScopeStore.userId}`;
    return "self";
  },
  set: () => undefined,
});

const radioValue = computed({
  get: () => {
    const v = selectedValue.value;
    if (v === "self" || v === "all") return v;
    return "";
  },
  set: () => undefined,
});

async function loadUsers() {
  if (loading.value || loaded.value || !visible.value) return;
  loading.value = true;
  try {
    const res = await getUserList({ currentPage: 1, pageSize: 1000 });
    const currentUserId = String(userStore.user?.id || "");
    userOptions.value = (res.list || [])
      .map((item: any) => ({
        value: `user:${String(item.id)}`,
        label: `${item.name || item.account} (${item.account})`,
        userId: String(item.id),
      }))
      .filter((item: UserOption) => item.userId !== currentUserId);
    loaded.value = true;
  } catch {
    ElMessage.error(t("layout.dataScope.loadUserListFailed"));
  } finally {
    loading.value = false;
  }
}

async function refreshCurrentView() {
  switching.value = true;
  try {
    await refreshPage();
  } finally {
    switching.value = false;
  }
}

async function handleRadioChange(value: string) {
  if (value === "all") {
    dataScopeStore.setAll();
    ElMessage.success(t("layout.dataScope.switchedToAllData"));
    await refreshCurrentView();
  } else if (value === "self") {
    dataScopeStore.setSelf();
    ElMessage.success(t("layout.dataScope.switchedToMyData"));
    await refreshCurrentView();
  }
}

async function handleSelectChange(value: string) {
  if (!value || value === "self" || value === "all") return;
  if (value.startsWith("user:")) {
    const userId = value.slice(5);
    const option = userOptions.value.find((item) => item.userId === userId);
    if (!option) {
      dataScopeStore.setSelf();
      ElMessage.success(t("layout.dataScope.switchedToMyData"));
      await refreshCurrentView();
      return;
    }
    dataScopeStore.setUser(option.userId, option.label);
    ElMessage.success(t("layout.dataScope.switchedToUser", { label: option.label }));
    await refreshCurrentView();
  }
}

onMounted(() => {
  if (dataScopeStore.mode === "user" && dataScopeStore.userId) {
    loadUsers();
  }
});
</script>

<style lang="scss" scoped>
.ads-trigger {
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

.ads-panel {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ads-panel__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  padding: 4px 4px 0;
}

.ads-radios {
  width: 100%;
  display: flex;

  :deep(.el-radio-button__inner) {
    flex: 1;
  }
}

.ads-select {
  width: 100%;
}
</style>

<style lang="scss">
.header-data-scope-popper {
  padding: 0 !important;
  border: 1px solid var(--el-border-color-light) !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgb(0 0 0 / 12%) !important;
  overflow: hidden;
}
</style>
