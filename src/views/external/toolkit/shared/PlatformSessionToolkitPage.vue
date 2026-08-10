<template>
  <ContentWrap :plain="true">
    <div class="session-toolkit">
      <section class="session-toolbar">
        <div class="session-field">
          <span>客户端</span>
          <el-select
            v-model="selectedClientId"
            class="session-select"
            size="small"
            placeholder="请选择客户端"
            :loading="loading"
            clearable
            filterable
          >
            <el-option
              v-for="option in clientOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>

        <div class="session-field">
          <span>环境</span>
          <el-select
            v-model="selectedProfileValue"
            class="session-select"
            size="small"
            placeholder="请选择环境"
            :disabled="!selectedClientId"
            clearable
          >
            <el-option
              v-for="option in profileOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>

        <div class="session-toolbar__actions">
          <el-button size="small" :loading="loading" :icon="Refresh" @click="refreshClientList">
            刷新客户端
          </el-button>
          <el-button
            size="small"
            :loading="toolsLoading"
            :disabled="!selectedClientId"
            :icon="Refresh"
            @click="loadTools"
          >
            刷新工具
          </el-button>
        </div>
      </section>

      <section class="session-status">
        <div class="session-status__main">
          <div class="session-status__title">{{ platformLabel }}会话</div>
          <div class="session-status__desc">
            {{ selectedProfileId ? `当前环境 ${selectedEnvironmentLabel}` : "请选择浏览器环境" }}
          </div>
        </div>
        <div class="session-status__chips">
          <span class="session-chip" :class="`is-${sessionTone}`">{{ sessionLabel }}</span>
          <span class="session-chip">账号 {{ accountText }}</span>
          <span class="session-chip">店铺 {{ shopText }}</span>
          <span class="session-chip">Cookie {{ cookieCount }}</span>
        </div>
      </section>

      <section class="session-actions">
        <el-button
          type="primary"
          :loading="runningFeatureKey === sessionToolKey"
          :disabled="!canRunTool"
          :icon="Download"
          @click="runFeature(sessionToolKey)"
        >
          采集登录信息
        </el-button>
        <el-button
          :loading="runningFeatureKey === checkLoginToolKey"
          :disabled="!canRunTool || !hasTool(checkLoginToolKey)"
          :icon="Search"
          @click="runFeature(checkLoginToolKey)"
        >
          检测登录
        </el-button>
        <el-button
          v-if="clickLoginToolKey"
          :loading="runningFeatureKey === clickLoginToolKey"
          :disabled="!canRunTool || !hasTool(clickLoginToolKey)"
          :icon="Link"
          @click="runFeature(clickLoginToolKey)"
        >
          点击登录
        </el-button>
        <el-button
          :loading="runningFeatureKey === openWorkspaceToolKey"
          :disabled="!canRunTool || !hasTool(openWorkspaceToolKey)"
          :icon="Link"
          @click="runFeature(openWorkspaceToolKey)"
        >
          打开工作台
        </el-button>
        <el-button :loading="storedSessionLoading" :disabled="!selectedProfileId" :icon="Refresh" @click="loadStoredSession">
          刷新会话
        </el-button>
        <el-button
          :loading="sessionActionLoading === 'validate'"
          :disabled="!selectedProfileId || !hasStoredSession"
          :icon="CircleCheck"
          @click="validateStoredSession"
        >
          校验会话
        </el-button>
        <el-button
          :disabled="!hasStoredSession && !lastRunResult"
          :icon="View"
          @click="detailDialogVisible = true"
        >
          查看详情
        </el-button>
        <el-button
          type="danger"
          plain
          :loading="sessionActionLoading === 'delete'"
          :disabled="!selectedProfileId || !hasStoredSession"
          :icon="Delete"
          @click="deleteStoredSession"
        >
          删除会话
        </el-button>
      </section>

      <section v-if="credentialPanelEnabled" class="session-credentials">
        <div class="session-credentials__head">
          <div>
            <div class="session-credentials__title">账号密码</div>
            <div class="session-credentials__desc">
              当前环境 {{ selectedProfileId ? selectedEnvironmentLabel : "未选择" }}
            </div>
          </div>
          <el-button
            size="small"
            type="primary"
            :loading="sessionActionLoading === 'saveCredential'"
            :disabled="!selectedProfileId"
            @click="saveCredentials"
          >
            保存账号密码
          </el-button>
        </div>
        <div class="session-credentials__form">
          <el-form-item :error="credentialErrors.account">
            <template #label>账号</template>
            <el-input
              v-model="credentialForm.account"
              clearable
              placeholder="请输入账号"
              @blur="validateCredentialField('account')"
            />
          </el-form-item>
          <el-form-item :error="credentialErrors.password">
            <template #label>密码</template>
            <el-input
              v-model="credentialForm.password"
              type="password"
              show-password
              clearable
              placeholder="请输入密码"
              @blur="validateCredentialField('password')"
            />
          </el-form-item>
        </div>
      </section>

      <section class="session-summary">
        <div class="session-summary__main">
          <div class="session-summary__title">
            {{ hasStoredSession ? "当前环境会话已保存" : emptyDescription }}
          </div>
          <div class="session-summary__desc">
            {{ hasStoredSession ? validationMessage || userInfoMessage || "会话已保存" : "先选择客户端和环境，再采集登录信息。" }}
          </div>
        </div>
        <span class="session-summary__time">{{ formatTime(storedSession.updatedAt) || "-" }}</span>
      </section>

      <el-dialog
        v-model="detailDialogVisible"
        class="session-detail-dialog"
        :title="`${platformLabel}会话详情`"
        width="920px"
        append-to-body
      >
        <div class="session-detail">
          <div class="session-meta-grid">
            <div class="session-meta">
              <span>用户</span>
              <strong>{{ accountText }}</strong>
            </div>
            <div class="session-meta">
              <span>店铺</span>
              <strong>{{ shopText }}</strong>
            </div>
            <div class="session-meta">
              <span>Cookie</span>
              <strong>{{ cookieCount }} 个</strong>
            </div>
            <div class="session-meta">
              <span>校验</span>
              <strong>{{ validationLabel }}</strong>
            </div>
          </div>

          <el-tabs v-model="detailTab">
            <el-tab-pane label="身份信息" name="identity">
              <pre class="session-json">{{ jsonText(storedUserInfo) }}</pre>
            </el-tab-pane>
            <el-tab-pane label="Cookie / Header" name="session">
              <pre class="session-json">{{ jsonText(sessionDetail) }}</pre>
            </el-tab-pane>
            <el-tab-pane label="最近执行结果" name="result">
              <pre class="session-json">{{ jsonText(lastRunResult) }}</pre>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-dialog>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import {
  CircleCheck,
  Delete,
  Download,
  Link,
  Refresh,
  Search,
  View,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import type { ToolkitToolItem } from "@/api/external/toolkit";
import { getToolkitTools, runToolkitTool } from "@/api/external/toolkit";
import {
  deletePlatformSession,
  getPlatformSessions,
  updatePlatformSessions,
  validatePlatformSession,
} from "@/api/user";
import { useBrowserAutomationExecutionContext } from "@/services/browserAutomationExecutionContext";
import { websocketClient, type ServiceCommandResultEvent } from "@/services/websocketClient";
import { formatDate } from "@/utils/formatTime";

const props = withDefaults(
  defineProps<{
    platformKey: string;
    platformLabel: string;
    sessionToolKey: string;
    checkLoginToolKey: string;
    openWorkspaceToolKey: string;
    clickLoginToolKey?: string;
    emptyDescription?: string;
    enableCredentialPanel?: boolean;
  }>(),
  {
    emptyDescription: "当前环境暂无会话。",
    clickLoginToolKey: "",
    enableCredentialPanel: false,
  },
);

const {
  loading,
  refreshClients,
  clientOptions,
  profileOptions,
  selectedClientId,
  selectedClient,
  selectedProfileValue,
  effectiveProfileId,
  selectedProfile,
  activeProfile,
  selectedEnvironmentLabel,
  setProfilesPayload,
  resetProfiles,
} = useBrowserAutomationExecutionContext();

const toolsLoading = ref(false);
const tools = ref<ToolkitToolItem[]>([]);
const runningFeatureKey = ref("");
const pendingToolsCommandId = ref("");
const pendingRunCommandId = ref("");
const pendingRunFeatureKey = ref("");
const storedPlatformSession = ref<Record<string, any>>({});
const storedSessionLoading = ref(false);
const sessionActionLoading = ref("");
const lastRunResult = ref<Record<string, any> | null>(null);
const lastRunSummary = ref("");
const detailDialogVisible = ref(false);
const detailTab = ref("identity");
const credentialForm = ref({ account: "", password: "" });
const credentialErrors = ref({ account: "", password: "" });

const platformKey = computed(() => String(props.platformKey || "").trim());
const platformLabel = computed(() => String(props.platformLabel || "").trim());
const sessionToolKey = computed(() => String(props.sessionToolKey || "").trim());
const checkLoginToolKey = computed(() => String(props.checkLoginToolKey || "").trim());
const openWorkspaceToolKey = computed(() => String(props.openWorkspaceToolKey || "").trim());
const clickLoginToolKey = computed(() => String(props.clickLoginToolKey || "").trim());
const emptyDescription = computed(() => String(props.emptyDescription || "").trim());
const credentialPanelEnabled = computed(() => props.enableCredentialPanel === true);
const selectedProfileId = computed(
  () => String(effectiveProfileId.value || selectedProfile.value?.id || activeProfile.value?.id || "").trim(),
);
const canRunTool = computed(() => !!selectedClientId.value && !!selectedProfileId.value);
const platformTools = computed(() =>
  tools.value.filter((item) => String(item?.platform || "").trim() === platformKey.value),
);
const hasTool = (featureKey: string) =>
  platformTools.value.some((item) => String(item?.key || "").trim() === featureKey);
const storedSession = computed(() => {
  const profileId = selectedProfileId.value;
  const profiles = asPlainObject(storedPlatformSession.value?.profiles);
  return profileId ? asPlainObject(profiles[profileId]) : {};
});
const storedCredentials = computed(() => {
  const profileId = selectedProfileId.value;
  const credentials = asPlainObject(storedPlatformSession.value?.credentials);
  return profileId ? asPlainObject(credentials[profileId]) : {};
});
const hasStoredSession = computed(() => Object.keys(storedSession.value).length > 0);
const storedUserInfo = computed(() => asPlainObject(storedSession.value?.userInfo));
const sellerSession = computed(() => asPlainObject(storedSession.value?.session?.seller));
const sellerCookies = computed(() =>
  asPlainObject(sellerSession.value?.cookies || storedSession.value?.cookies),
);
const sellerHeaders = computed(() =>
  asPlainObject(sellerSession.value?.headers || storedSession.value?.headersTemplate),
);
const cookieCount = computed(() => Object.keys(sellerCookies.value).length);
const validation = computed(() => asPlainObject(storedSession.value?.validation));
const validationStatus = computed(() => String(validation.value.status || "").trim());
const validationMessage = computed(() => String(validation.value.message || "").trim());
const userInfoMessage = computed(() => String(storedUserInfo.value.message || "").trim());
const validationLabel = computed(() => {
  const status = validationStatus.value;
  if (status === "valid") return "有效";
  if (status === "invalid") return "失效";
  if (status === "incomplete") return "不完整";
  if (status === "fresh") return "待校验";
  return "未校验";
});
const sessionTone = computed(() => {
  if (!hasStoredSession.value) return "danger";
  if (validationStatus.value === "valid") return "success";
  if (validationStatus.value === "invalid") return "danger";
  return "warning";
});
const sessionLabel = computed(() => {
  if (!hasStoredSession.value) return "未采集";
  return validationLabel.value;
});
const accountText = computed(() => {
  const userInfo = storedUserInfo.value;
  return (
    [
      storedCredentials.value.account,
      userInfo.userName || userInfo.accountName || storedSession.value.userName || storedSession.value.accountName,
      userInfo.userId || userInfo.accountId || storedSession.value.userId || storedSession.value.accountId,
    ]
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(" / ") || "-"
  );
});
const shopText = computed(() => {
  const userInfo = storedUserInfo.value;
  return (
    [
      userInfo.shopId || storedSession.value.shopId,
    ]
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(" / ") || "-"
  );
});
const sessionDetail = computed(() => ({
  cookies: sellerCookies.value,
  headers: sellerHeaders.value,
  credentials: {
    account: storedCredentials.value.account || storedSession.value.account || "",
    password: storedCredentials.value.password || storedSession.value.password ? "已保存" : "",
  },
  updatedAt: sellerSession.value.updatedAt || storedSession.value.updatedAt || "",
}));

const asPlainObject = (value: any): Record<string, any> =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const formatTime = (value?: string | null) =>
  value ? formatDate(new Date(value), "YYYY-MM-DD HH:mm:ss") : "";

const jsonText = (value: any) => {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value ?? "");
  }
};

const extractCommandResult = (value: any) => {
  const source = asPlainObject(value);
  if (Object.prototype.hasOwnProperty.call(source, "result")) {
    return source.result;
  }
  return value;
};

const extractToolItems = (value: any): ToolkitToolItem[] => {
  const source = asPlainObject(value);
  const data = asPlainObject(source.data);
  const result = asPlainObject(source.result);
  const candidates = [
    Array.isArray(value) ? value : [],
    Array.isArray(source.items) ? source.items : [],
    Array.isArray(source.data) ? source.data : [],
    Array.isArray(data.items) ? data.items : [],
    Array.isArray(result.items) ? result.items : [],
  ];
  return (candidates.find((items) => items.length > 0) || [])
    .filter((item) => item && typeof item === "object")
    .map((item) => item as ToolkitToolItem);
};

const refreshClientList = () => {
  void refreshClients();
};

const loadTools = async () => {
  if (!selectedClientId.value) {
    tools.value = [];
    return;
  }

  toolsLoading.value = true;
  try {
    const response = await getToolkitTools(selectedClientId.value);
    const commandId = String(response?.data?.commandId || "").trim();
    if (!commandId) {
      throw new Error(response?.message || "工具目录命令发送失败");
    }
    pendingToolsCommandId.value = commandId;
  } catch (error: any) {
    toolsLoading.value = false;
    ElMessage.error(error?.message || "获取工具目录失败");
  }
};

const runFeature = async (featureKey: string) => {
  if (!selectedClientId.value) {
    ElMessage.warning("请先选择客户端");
    return;
  }
  if (!selectedProfileId.value) {
    ElMessage.warning("请先选择环境");
    return;
  }

  const normalizedFeatureKey = String(featureKey || "").trim();
  if (!normalizedFeatureKey) return;

  runningFeatureKey.value = normalizedFeatureKey;
  pendingRunFeatureKey.value = normalizedFeatureKey;
  try {
    const response = await runToolkitTool(selectedClientId.value, {
      featureKey: normalizedFeatureKey,
      profileId: selectedProfileId.value,
      keepPageOpen: true,
      ...(credentialPanelEnabled.value &&
      (normalizedFeatureKey === sessionToolKey.value || normalizedFeatureKey === clickLoginToolKey.value)
        ? buildCredentialCommandPayload()
        : {}),
    });
    const commandId = String(response?.data?.commandId || "").trim();
    if (!commandId) {
      throw new Error(response?.message || "工具执行命令发送失败");
    }
    pendingRunCommandId.value = commandId;
  } catch (error: any) {
    runningFeatureKey.value = "";
    pendingRunFeatureKey.value = "";
    ElMessage.error(error?.message || "执行工具失败");
  }
};

const buildCredentialCommandPayload = () => {
  const account = String(credentialForm.value.account || storedCredentials.value.account || "").trim();
  const password = String(credentialForm.value.password || storedCredentials.value.password || "").trim();
  return {
    ...(account ? { account } : {}),
    ...(password ? { password } : {}),
  };
};

const syncCredentialsFromStoredSession = () => {
  if (!credentialPanelEnabled.value) {
    credentialForm.value = { account: "", password: "" };
    credentialErrors.value = { account: "", password: "" };
    return;
  }
  credentialForm.value = {
    account: String(storedCredentials.value.account || storedSession.value.account || "").trim(),
    password: String(storedCredentials.value.password || storedSession.value.password || "").trim(),
  };
  credentialErrors.value = { account: "", password: "" };
};

const validateCredentialField = (field: "account" | "password") => {
  const value = String(credentialForm.value[field] || "").trim();
  credentialErrors.value = {
    ...credentialErrors.value,
    [field]: value ? "" : `请填写${field === "account" ? "账号" : "密码"}`,
  };
  return !!value;
};

const validateCredentials = () => {
  const accountValid = validateCredentialField("account");
  const passwordValid = validateCredentialField("password");
  return accountValid && passwordValid;
};

const saveCredentials = async () => {
  if (!selectedProfileId.value) {
    ElMessage.warning("请先选择环境");
    return;
  }
  if (!validateCredentials()) {
    return;
  }

  const savedAt = new Date().toISOString();
  sessionActionLoading.value = "saveCredential";
  try {
    await updatePlatformSessions({
      platform: platformKey.value,
      profileId: selectedProfileId.value,
      data: {
        account: String(credentialForm.value.account || "").trim(),
        password: String(credentialForm.value.password || "").trim(),
        updatedAt: savedAt,
        validation: Object.keys(validation.value).length
          ? validation.value
          : {
              status: "draft",
              message: "账号密码已保存，等待采集会话",
              checkedAt: "",
            },
      },
    });
    await loadStoredSession();
    ElMessage.success("账号密码已保存");
  } catch (error: any) {
    ElMessage.error(error?.message || "保存账号密码失败");
  } finally {
    sessionActionLoading.value = "";
  }
};

const buildStoredSessionPayload = (sessionBundle: Record<string, any>, profileId: string) => {
  const collectedAt = String(sessionBundle?.collectedAt || new Date().toISOString()).trim();
  const currentProfile = asPlainObject(asPlainObject(storedPlatformSession.value?.profiles)[profileId]);
  const currentSession = asPlainObject(currentProfile?.session);
  const currentUserInfo = asPlainObject(currentProfile?.userInfo);
  const credentials = credentialPanelEnabled.value ? buildCredentialCommandPayload() : {};
  const nextUserInfo = asPlainObject(sessionBundle?.userInfo);
  const headersTemplate = asPlainObject(sessionBundle?.headersTemplate || sessionBundle?.headers);
  const cookies = asPlainObject(sessionBundle?.cookies);
  const userId = String(sessionBundle?.userId || nextUserInfo.userId || currentProfile.userId || currentUserInfo.userId || "").trim();
  const userName = String(sessionBundle?.userName || nextUserInfo.userName || currentProfile.userName || currentUserInfo.userName || "").trim();
  const shopId = String(sessionBundle?.shopId || nextUserInfo.shopId || currentProfile.shopId || currentUserInfo.shopId || "").trim();
  const shopName = "";
  const accountId = String(sessionBundle?.accountId || nextUserInfo.accountId || currentProfile.accountId || currentUserInfo.accountId || "").trim();
  const accountName = String(sessionBundle?.accountName || nextUserInfo.accountName || currentProfile.accountName || currentUserInfo.accountName || "").trim();
  const roles = Array.isArray(nextUserInfo.roles)
    ? nextUserInfo.roles
    : Array.isArray(sessionBundle?.roles)
      ? sessionBundle.roles
      : [];

  return {
    userId,
    userName,
    shopId,
    shopName,
    accountId,
    accountName,
    ...(credentials.account ? { account: credentials.account } : {}),
    ...(credentials.password ? { password: credentials.password } : {}),
    roles,
    headersTemplate,
    cookies,
    userInfo: {
      status: userId || userName || shopId ? "success" : "missing",
      message: String(nextUserInfo.message || `浏览器环境已同步${platformLabel.value}用户信息`).trim(),
      fetchedAt: String(nextUserInfo.fetchedAt || collectedAt).trim(),
      userId,
      userName,
      shopId,
      shopName,
      accountId,
      accountName,
      roles,
    },
    updatedAt: collectedAt,
    validation: {
      status: "fresh",
      message: "会话已完成采集，建议重新校验",
      checkedAt: collectedAt,
    },
    session: {
      seller: {
        ...asPlainObject(currentSession?.seller),
        cookies,
        headers: headersTemplate,
        updatedAt: collectedAt,
      },
    },
  };
};

const persistSessionBundle = async (sessionBundle: Record<string, any>) => {
  const profileId = String(sessionBundle?.profileId || selectedProfileId.value || "").trim();
  if (!profileId) {
    throw new Error(`缺少环境 ID，无法保存${platformLabel.value}会话`);
  }

  await updatePlatformSessions({
    platform: platformKey.value,
    profileId,
    data: buildStoredSessionPayload(sessionBundle, profileId),
  });
  await loadStoredSession();
  const validationResult = await validatePlatformSession({
    platform: platformKey.value,
    profileId,
  });
  await loadStoredSession();
  return validationResult;
};

const loadStoredSession = async () => {
  if (!selectedProfileId.value) {
    storedPlatformSession.value = {};
    return;
  }

  storedSessionLoading.value = true;
  try {
    storedPlatformSession.value = asPlainObject(
      await getPlatformSessions({ platform: platformKey.value }),
    );
  } catch (error: any) {
    ElMessage.error(error?.message || `获取${platformLabel.value}会话失败`);
  } finally {
    storedSessionLoading.value = false;
  }
};

const validateStoredSession = async () => {
  if (!selectedProfileId.value) return;
  sessionActionLoading.value = "validate";
  try {
    const result = await validatePlatformSession({
      platform: platformKey.value,
      profileId: selectedProfileId.value,
    });
    await loadStoredSession();
    ElMessage[result?.success ? "success" : "warning"](result?.message || "校验完成");
  } catch (error: any) {
    ElMessage.error(error?.message || "校验会话失败");
  } finally {
    sessionActionLoading.value = "";
  }
};

const deleteStoredSession = async () => {
  if (!selectedProfileId.value) return;
  try {
    await ElMessageBox.confirm(`确认删除环境 ${selectedProfileId.value} 的${platformLabel.value}会话吗？`, "删除会话", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }

  sessionActionLoading.value = "delete";
  try {
    await deletePlatformSession({
      platform: platformKey.value,
      profileId: selectedProfileId.value,
    });
    await loadStoredSession();
    ElMessage.success(`${platformLabel.value}会话已删除`);
  } catch (error: any) {
    ElMessage.error(error?.message || "删除会话失败");
  } finally {
    sessionActionLoading.value = "";
  }
};

const handleRunResult = async (event: ServiceCommandResultEvent) => {
  pendingRunCommandId.value = "";
  const featureKey = pendingRunFeatureKey.value;
  runningFeatureKey.value = "";
  pendingRunFeatureKey.value = "";
  const result = asPlainObject(extractCommandResult(event.data));
  lastRunResult.value = result || null;
  lastRunSummary.value = event.message || event.error || (event.success ? "执行成功" : "执行失败");

  if (event.success && featureKey === sessionToolKey.value) {
    const sessionBundle = asPlainObject(result?.sessionBundle);
    if (!Object.keys(sessionBundle).length) {
      ElMessage.warning(`采集完成，但没有返回可保存的${platformLabel.value}会话`);
      return;
    }

    try {
      const validationResult = await persistSessionBundle(sessionBundle);
      ElMessage[validationResult?.success ? "success" : "warning"](
        validationResult?.success
          ? `${platformLabel.value}登录信息已采集保存，并校验通过`
          : validationResult?.message || `${platformLabel.value}登录信息已保存，但校验未通过`,
      );
      return;
    } catch (error: any) {
      ElMessage.warning(`采集成功，但保存失败：${error?.message || "未知错误"}`);
      return;
    }
  }

  ElMessage[event.success ? "success" : "warning"](lastRunSummary.value);
};

const onCommand = (event: ServiceCommandResultEvent) => {
  if (event.clientId !== selectedClientId.value) return;

  if (event.commandId === pendingToolsCommandId.value) {
    pendingToolsCommandId.value = "";
    toolsLoading.value = false;
    if (event.success) {
      tools.value = extractToolItems(event.data);
      return;
    }
    tools.value = [];
    ElMessage.error(event.message || event.error || "获取工具目录失败");
    return;
  }

  if (event.commandId === pendingRunCommandId.value) {
    void handleRunResult(event);
  }
};

watch(
  () => selectedClient.value?.runtime?.details,
  (details) => setProfilesPayload((details || {}) as Record<string, any>),
  { immediate: true, deep: true },
);

watch(
  selectedClientId,
  (value) => {
    resetProfiles();
    selectedProfileValue.value = "";
    tools.value = [];
    storedPlatformSession.value = {};
    if (!value) return;
    setProfilesPayload((selectedClient.value?.runtime?.details || {}) as Record<string, any>);
    void loadTools();
  },
);

watch(
  [selectedClientId, profileOptions],
  ([clientId, options]) => {
    if (!String(clientId || "").trim() || String(selectedProfileValue.value || "").trim()) return;
    const activeOption = (Array.isArray(options) ? options : []).find((item) => item.isActiveOption);
    if (activeOption) selectedProfileValue.value = String(activeOption.value || "").trim();
  },
  { immediate: true, deep: true },
);

watch(selectedProfileId, () => {
  void loadStoredSession();
});

watch(
  [storedSession, storedCredentials, credentialPanelEnabled],
  () => {
    syncCredentialsFromStoredSession();
  },
  { immediate: true },
);

onMounted(async () => {
  websocketClient.events.on("serviceCommandResult", onCommand);
  await refreshClients();
  setProfilesPayload((selectedClient.value?.runtime?.details || {}) as Record<string, any>);
  if (selectedClientId.value) void loadTools();
  if (selectedProfileId.value) void loadStoredSession();
});

onUnmounted(() => {
  websocketClient.events.off("serviceCommandResult", onCommand);
});
</script>

<style scoped lang="scss">
.session-toolkit {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 10px;
}

.session-toolbar,
.session-status,
.session-actions,
.session-credentials,
.session-summary {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
}

.session-toolbar {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
}

.session-field {
  flex: 1 1 220px;
  min-width: 0;
}

.session-field span {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.session-select {
  width: 100%;
}

.session-toolbar__actions,
.session-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.session-actions {
  padding: 12px;
}

.session-credentials {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.session-credentials__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.session-credentials__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.session-credentials__desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.session-credentials__form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.session-credentials__form :deep(.el-form-item) {
  margin-bottom: 0;
}

.session-status,
.session-summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
}

.session-status__title,
.session-summary__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.session-status__desc,
.session-summary__desc,
.session-summary__time {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.session-status__chips {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.session-chip {
  display: inline-flex;
  min-height: 26px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 999px;
  align-items: center;
}

.session-chip.is-success {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  border-color: var(--el-color-success-light-5);
}

.session-chip.is-warning {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border-color: var(--el-color-warning-light-5);
}

.session-chip.is-danger {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-color: var(--el-color-danger-light-5);
}

.session-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.session-meta {
  min-width: 0;
  padding: 10px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.session-meta span {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.session-meta strong {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}

.session-json {
  max-height: 460px;
  padding: 12px;
  margin: 0;
  overflow: auto;
  font-size: 12px;
  line-height: 1.55;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

@media (width <= 900px) {
  .session-status,
  .session-summary {
    flex-direction: column;
  }

  .session-status__chips {
    justify-content: flex-start;
  }

  .session-credentials__head {
    flex-direction: column;
  }

  .session-credentials__form {
    grid-template-columns: 1fr;
  }

  .session-meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
