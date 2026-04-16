<template>
  <ContentWrap :plain="true">
    <div class="toolkit-page">
      <section v-if="!selectedPlatform" class="toolkit-platform-hub">
        <div class="toolkit-platform-hub__head">
          <div class="toolkit-platform-hub__main">
            <div class="toolkit-platform-hub__title">工具集</div>
            <div class="toolkit-platform-hub__desc">
              选择一个工具集进入对应工作台。目前仅支持 Temu。
            </div>
          </div>

          <div class="toolkit-page-head__actions">
            <el-button text size="small" :loading="loading" @click="handleRefreshContext">
              刷新
            </el-button>
            <el-button text size="small" @click="goToBrowserAutomation">环境管理</el-button>
          </div>
        </div>

        <div class="toolkit-platform-grid">
          <button
            v-for="platform in toolkitPlatforms"
            :key="platform.key"
            type="button"
            class="toolkit-platform-card"
            @click="enterToolkitPlatform(platform.key)"
          >
            <span class="toolkit-platform-card__eyebrow">工具集</span>
            <span class="toolkit-platform-card__title">{{ platform.label }}</span>
            <span class="toolkit-platform-card__desc">{{ platform.description }}</span>
            <span class="toolkit-platform-card__footer">
              <el-tag size="small" effect="plain">已支持</el-tag>
              <span class="toolkit-platform-card__enter">进入工具集</span>
            </span>
          </button>
        </div>
      </section>

      <template v-else>
        <section class="toolkit-page-head">
          <div class="toolkit-page-head__main">
            <el-button
              text
              circle
              size="small"
              :icon="ArrowLeft"
              class="toolkit-page-head__back"
              title="返回工具集"
              aria-label="返回工具集"
              @click="leaveToolkitPlatform"
            />

            <div class="toolkit-page-head__content">
              <div class="toolkit-page-head__title">{{ selectedPlatformLabel }} 工具集</div>
            </div>
          </div>

          <div class="toolkit-page-head__actions">
            <el-button text size="small" :loading="loading" @click="handleRefreshContext">
              刷新
            </el-button>
            <el-button text size="small" @click="goToBrowserAutomation">环境管理</el-button>
          </div>
        </section>

        <section class="toolkit-hero">
          <div class="toolkit-hero__card toolkit-hero__card--selectors">
            <div class="toolkit-hero__selectors">
              <div class="toolkit-hero__field">
                <div class="toolkit-hero__label">在线客户端</div>
                <el-select
                  v-model="selectedClientId"
                  class="toolkit-hero__select"
                  size="small"
                  placeholder="请选择在线客户端"
                  :loading="loading"
                  clearable
                >
                  <el-option
                    v-for="option in clientOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  >
                    <div class="toolkit-option">
                      <div class="toolkit-option__title">{{ option.label }}</div>
                      <div class="toolkit-option__meta">{{ option.meta || option.hint }}</div>
                    </div>
                  </el-option>
                </el-select>
              </div>

              <div class="toolkit-hero__field">
                <div class="toolkit-hero__label">执行环境</div>
                <el-select
                  v-model="executionProfileSelectValue"
                  class="toolkit-hero__select"
                  size="small"
                  placeholder="请选择执行环境"
                  :loading="loadingMap.profiles"
                >
                  <el-option
                    v-for="option in visibleExecutionProfileOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  >
                    <div class="toolkit-option">
                      <div class="toolkit-option__title">{{ option.label }}</div>
                      <div class="toolkit-option__meta">{{ option.meta }}</div>
                    </div>
                  </el-option>
                </el-select>
              </div>
            </div>
          </div>

          <div
            v-if="selectedPlatformContextComponent"
            class="toolkit-hero__card toolkit-hero__card--status"
          >
            <component
              :is="selectedPlatformContextComponent"
              class="toolkit-hero__context"
              :profile-id="temuWorkspaceProfileId"
              :profile-loading="isTemuExecutionProfileLoading"
              :session-record="temuWorkspaceSessionRecord"
              :platform-account-text="temuWorkspacePlatformAccountText"
              :validation-loading="temuWorkspaceValidationLoading"
              :acquire-loading="sessionToolRunning"
              :acquire-disabled="sessionAcquireActionDisabled"
              @acquire-session="quickAcquireCurrentSession"
              @open-session-center="openSessionCenter"
            />
          </div>
        </section>

        <component
          :is="selectedPlatformWorkspace"
          v-if="selectedPlatformWorkspace"
          :client-id="selectedClientId"
          :profile-id="temuWorkspaceProfileId"
          :session-record="temuWorkspaceSessionRecord"
          :tool-items="temuWorkspaceTools"
          :tools-loading="loadingMap.tools"
          :running-feature-key="runningToolkitFeatureKey"
          :tool-busy="loadingMap.runTool"
          :tool-results="temuWorkspaceToolResults"
          @refresh-tools="sendTools"
          @run-tool="runWorkspaceTool"
        />
      </template>

      <el-dialog
        v-model="sessionCenterVisible"
        :title="sessionCenterDialogTitle"
        fullscreen
        destroy-on-close
        class="toolkit-center-dialog"
      >
        <div class="toolkit-center">
          <div class="toolkit-center__summary">
            <div class="toolkit-center__summary-item">
              <span>在线客户端</span>
              <strong>{{ selectedClientName }}</strong>
            </div>
            <div class="toolkit-center__summary-item">
              <span>执行环境</span>
              <strong>{{ selectedExecutionEnvironmentText }}</strong>
            </div>
            <div class="toolkit-center__summary-item">
              <span>认证状态</span>
              <strong>{{ sessionCenterSessionStatusLabel }}</strong>
            </div>
          </div>

          <section
            v-if="selectedPlatformKey === TEMU_PLATFORM_KEY"
            class="toolkit-panel toolkit-panel--acquire"
          >
            <div class="toolkit-form-panel toolkit-form-panel--acquire">
              <div class="toolkit-form-panel__head">
                <div>
                  <div class="toolkit-form-panel__title">获取会话</div>
                  <div class="toolkit-form-panel__desc">
                    当前环境 {{ selectedExecutionProfileDisplayText }}
                  </div>
                </div>

                <el-tag size="small" effect="plain">
                  {{ sessionAcquireModeLabel }}
                </el-tag>
              </div>

              <div class="toolkit-form toolkit-form--acquire">
                <SmallFeatureField
                  v-for="field in visibleSessionAcquireFields"
                  :key="field.key"
                  v-model="sessionAcquireForm[field.key]"
                  :field="field"
                  :error="sessionAcquireErrors[field.key] || ''"
                  @blur="validateSessionAcquireField(field)"
                />
              </div>

              <div class="toolkit-runner">
                <el-button
                  type="primary"
                  size="small"
                  :loading="sessionToolRunning"
                  :disabled="sessionAcquireActionDisabled"
                  @click="acquireCurrentSession"
                >
                  {{ sessionAcquireSubmitText }}
                </el-button>
              </div>
            </div>
          </section>

          <section
            v-if="selectedPlatformSupportsStoredSessions"
            class="toolkit-panel toolkit-panel--session"
          >
            <div class="toolkit-panel__head">
              <div>
                <div class="toolkit-panel__title">环境认证信息</div>
                <div class="toolkit-panel__desc">
                  {{ sessionCenterHeadline }}
                </div>
              </div>

              <div class="toolkit-panel__actions">
                <el-button
                  text
                  :loading="storedSessionLoading"
                  @click="refreshStoredPlatformSessions"
                >
                  刷新信息
                </el-button>
              </div>
            </div>

            <el-empty
              v-if="!selectedStoredSession && !storedSessionLoading"
              description="当前客户端当前环境暂无 Temu 会话，可先在上方获取"
              :image-size="60"
            />

            <div v-else-if="selectedStoredSession" class="toolkit-session-card">
              <div class="toolkit-session-card__head">
                <div>
                  <div class="toolkit-session-card__title">认证信息</div>
                  <div class="toolkit-session-card__desc">
                    {{ currentEnvironmentAccountText }}
                  </div>
                </div>

                <div class="toolkit-session-card__tags">
                  <el-tag
                    size="small"
                    effect="plain"
                    :type="resolveValidationTagType(currentEnvironmentValidation)"
                  >
                    {{ resolveValidationLabel(currentEnvironmentValidation) }}
                  </el-tag>
                </div>
              </div>

              <div class="toolkit-session-card__meta">
                <div class="toolkit-meta-chip">
                  <span>当前店铺</span>
                  <strong>{{
                    selectedStoredUserInfo.mallName || selectedStoredUserInfo.mallId || "未绑定"
                  }}</strong>
                </div>
                <div class="toolkit-meta-chip">
                  <span>Cookie</span>
                  <strong>{{ currentEnvironmentCookieSummary }}</strong>
                </div>
                <div class="toolkit-meta-chip">
                  <span>更新时间</span>
                  <strong>{{ formatDateTime(selectedStoredSession.updatedAt) || "-" }}</strong>
                </div>
              </div>

              <div class="toolkit-session-card__actions">
                <el-button
                  size="small"
                  :loading="sessionActionState.refreshInfo === selectedExecutionProfileId"
                  @click="refreshStoredSessionUserInfo(selectedExecutionProfileId)"
                >
                  同步身份信息
                </el-button>
                <el-button
                  size="small"
                  :loading="sessionActionState.validate === selectedExecutionProfileId"
                  @click="validateStoredSession(selectedExecutionProfileId)"
                >
                  校验会话
                </el-button>
                <el-button
                  size="small"
                  :loading="sessionActionState.reacquire === selectedExecutionProfileId"
                  @click="reacquireStoredSession(selectedExecutionProfileId)"
                >
                  重新采集
                </el-button>
                <el-button
                  size="small"
                  :loading="sessionRestoreRunning"
                  @click="restoreStoredSessionToCurrentEnvironment(selectedExecutionProfileId)"
                >
                  写入当前环境
                </el-button>
                <el-button size="small" @click="openSessionDetail(selectedExecutionProfileId)">
                  查看 Cookie / Header
                </el-button>
                <el-button
                  text
                  size="small"
                  type="danger"
                  :loading="sessionActionState.delete === selectedExecutionProfileId"
                  @click="deleteStoredSession(selectedExecutionProfileId)"
                >
                  删除会话
                </el-button>
              </div>
            </div>

            <div v-if="showMallPanel" class="toolkit-userinfo-panel">
              <div class="toolkit-userinfo-panel__head">
                <div>
                  <div class="toolkit-userinfo-panel__title">店铺信息</div>
                  <div class="toolkit-userinfo-panel__desc">
                    {{ mallPanelDescription }}
                  </div>
                </div>
              </div>

              <div class="toolkit-mall-list">
                <div
                  v-for="row in selectedStoredMallRows.slice(0, 5)"
                  :key="row.key"
                  class="toolkit-mall-item"
                  :class="{ 'is-current': row.isCurrent }"
                >
                  <div class="toolkit-mall-item__main">
                    <div class="toolkit-mall-item__name">{{ row.mallName || "-" }}</div>
                    <div class="toolkit-mall-item__meta">{{ row.mallId || "-" }}</div>
                  </div>
                  <div class="toolkit-mall-item__actions">
                    <el-tag v-if="row.isCurrent" size="small" effect="plain" type="success">
                      当前
                    </el-tag>
                    <el-button
                      v-else
                      text
                      size="small"
                      :loading="
                        sessionActionState.applyMall ===
                        buildMallActionKey(selectedExecutionProfileId, row.mallId)
                      "
                      @click="applyStoredMall(selectedExecutionProfileId, row)"
                    >
                      设为当前
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <el-collapse
              v-if="showUserInfoCollapse"
              v-model="userInfoCollapseNames"
              class="toolkit-result-collapse"
            >
              <el-collapse-item name="raw" title="查看原始身份信息">
                <pre class="toolkit-result-json">{{ jsonText(selectedStoredUserInfo) }}</pre>
              </el-collapse-item>
            </el-collapse>
          </section>
        </div>
      </el-dialog>
    </div>
  </ContentWrap>

  <el-dialog v-model="sessionDetailDialogVisible" title="Temu 会话详情" fullscreen>
    <template v-if="selectedStoredSession">
      <div class="toolkit-session-dialog">
        <div class="toolkit-session-dialog__regions">
          <section
            v-for="region in selectedSessionRegionCards"
            :key="region.key"
            class="toolkit-session-region"
          >
            <div class="toolkit-session-region__head">
              <div>
                <div class="toolkit-session-region__title">{{ region.label }}</div>
                <div class="toolkit-session-region__meta">
                  Cookie {{ region.cookieCount }} 个 · Header {{ region.headerCount }} 个
                </div>
              </div>
              <span class="toolkit-session-region__time">
                {{ formatDateTime(region.updatedAt) || "-" }}
              </span>
            </div>

            <div class="toolkit-session-region__json-grid">
              <div class="toolkit-session-region__json-box">
                <div class="toolkit-session-region__json-title">Cookies</div>
                <pre>{{ jsonText(region.cookies) }}</pre>
              </div>
              <div class="toolkit-session-region__json-box">
                <div class="toolkit-session-region__json-title">Headers</div>
                <pre>{{ jsonText(region.headers) }}</pre>
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ArrowLeft } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { BrowserAutomationCommandResponse } from "@/api/external/browserAutomation";
import type { ToolkitToolItem } from "@/api/external/toolkit";
import { getToolkitProfiles, getToolkitTools, runToolkitTool } from "@/api/external/toolkit";
import {
  deletePlatformSession,
  getPlatformSessions,
  refreshPlatformSessionInfo,
  updatePlatformSessions,
  validatePlatformSession,
} from "@/api/user";
import {
  ACTIVE_BROWSER_AUTOMATION_PROFILE_VALUE,
  useBrowserAutomationExecutionContext,
} from "@/services/browserAutomationExecutionContext";
import { websocketClient, type ServiceCommandResultEvent } from "@/services/websocketClient";
import { formatDate } from "@/utils/formatTime";
import SmallFeatureField from "../browser-automation/components/SmallFeatureField.vue";
import {
  TOOLKIT_PLATFORM_REGISTRY,
  type ToolkitPlatformDefinition,
} from "./platformRegistry";
import {
  TEMU_PLATFORM_KEY,
  TEMU_SESSION_RESTORE_TOOL_KEY,
  TEMU_SESSION_TOOL_KEY,
} from "./temu/platform";
import {
  resolveTemuValidationLabel as resolveValidationLabel,
  resolveTemuValidationTagType as resolveValidationTagType,
  resolveTemuWorkspaceAvailability,
} from "./temu/temuWorkspace.helpers";

defineOptions({ name: "OperationToolkit" });

interface ToolkitFeedback {
  success: boolean;
  message: string;
  detail: string | null;
  suggestion: string | null;
  updatedAt: string | null;
}

interface ToolkitToolExecutionRecord {
  featureKey: string;
  success: boolean;
  message: string;
  detail: string | null;
  suggestion: string | null;
  updatedAt: string | null;
  result: any;
  output: any;
  rawEvent: ServiceCommandResultEvent;
}

const router = useRouter();
const {
  loading,
  refreshClients,
  clientOptions,
  profileOptions,
  selectedClientId,
  selectedClientName,
  selectedProfileValue,
  selectedProfile,
  effectiveProfileId,
  selectedEnvironmentLabel,
  activeProfile,
  setProfilesPayload,
  resetProfiles,
} = useBrowserAutomationExecutionContext();
const selectedPlatformKey = ref("");
const sessionCenterVisible = ref(false);
const storedPlatformSession = ref<Record<string, any>>({});
const storedSessionLoading = ref(false);
const selectedStoredProfileId = ref("");
const sessionDetailDialogVisible = ref(false);
const userInfoCollapseNames = ref<string[]>([]);
const toolkitTools = ref<ToolkitToolItem[]>([]);
const runningToolkitFeatureKey = ref("");
const toolkitToolResults = reactive<Record<string, ToolkitToolExecutionRecord>>({});
const loadingMap = reactive({
  profiles: false,
  tools: false,
  runTool: false,
});
const sessionActionState = reactive({
  refreshInfo: "",
  validate: "",
  delete: "",
  reacquire: "",
  applyMall: "",
});
const autoValidatedTemuSessions = reactive<Record<string, string>>({});
const pending = reactive<Record<string, string>>({});
const pendingRunToolFeatureKeys = reactive<Record<string, string>>({});

const toolkitPlatforms = computed<ToolkitPlatformDefinition[]>(() => TOOLKIT_PLATFORM_REGISTRY);

const selectedPlatform = computed(
  () => toolkitPlatforms.value.find((item) => item.key === selectedPlatformKey.value) || null,
);
const selectedPlatformLabel = computed(() => selectedPlatform.value?.label || "工具");
const selectedPlatformContextComponent = computed(
  () => selectedPlatform.value?.workspaceContextComponent || null,
);
const selectedPlatformWorkspace = computed(
  () => selectedPlatform.value?.workspaceComponent || null,
);
const sessionCenterDialogTitle = computed(() => `${selectedPlatformLabel.value} 会话与身份`);
const selectedPlatformSupportsStoredSessions = computed(
  () => selectedPlatform.value?.supportsStoredSessions === true,
);
const temuWorkspaceTools = computed(() =>
  toolkitTools.value.filter((item) => {
    const platform = String(item?.platform || "").trim();
    const featureKey = String(item?.key || "").trim();
    return platform === TEMU_PLATFORM_KEY && featureKey !== TEMU_SESSION_TOOL_KEY;
  }),
);
const temuWorkspaceToolResults = computed(() => toolkitToolResults);
const sessionToolRunning = computed(
  () => loadingMap.runTool && runningToolkitFeatureKey.value === TEMU_SESSION_TOOL_KEY,
);
const sessionRestoreRunning = computed(
  () =>
    loadingMap.runTool && runningToolkitFeatureKey.value === TEMU_SESSION_RESTORE_TOOL_KEY,
);
const sessionAcquireActionDisabled = computed(
  () =>
    !selectedClientId.value ||
    !selectedExecutionProfileId.value ||
    (loadingMap.runTool && !sessionToolRunning.value),
);

const storedSessionRows = computed(() => {
  const profiles = asPlainObject(storedPlatformSession.value?.profiles);

  return Object.entries(profiles)
    .map(([profileId, value]) => {
      const record = asPlainObject(value);
      return {
        profileId,
        mallId: String(record.mallId || "").trim(),
        mallName: String(record.mallName || "").trim(),
        updatedAt: String(record.updatedAt || "").trim(),
        validation: asPlainObject(record.validation),
        cookieCounts: {
          global: countObjectKeys(record?.session?.global?.cookies),
          us: countObjectKeys(record?.session?.us?.cookies),
          eu: countObjectKeys(record?.session?.eu?.cookies),
        },
        record,
      };
    })
    .sort((left, right) => {
      const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
      const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
      return rightTime - leftTime;
    });
});

const sessionAcquireForm = reactive({
  acquireMode: "direct",
  account: "",
  password: "",
  collectRegionCookies: true,
  keepPageOpen: true,
});
const sessionAcquireErrors = reactive<Record<string, string>>({
  account: "",
  password: "",
});
const sessionAcquireFieldDefinitions = computed(() => [
  {
    key: "acquireMode",
    label: "获取方式",
    type: "select",
    required: true,
    options: [
      { label: "直接获取", value: "direct" },
      { label: "登录并获取", value: "login" },
    ],
    description: "复用当前登录态，或先登录再采集。",
  },
  {
    key: "account",
    label: "账号",
    type: "text",
    required: false,
    placeholder: "请输入 Temu 账号",
    description: "始终显示，仅“登录并获取”时必填并生效。",
    requiredWhen: {
      acquireMode: "login",
    },
  },
  {
    key: "password",
    label: "密码",
    type: "password",
    required: false,
    placeholder: "请输入 Temu 密码",
    description: "始终显示，仅“登录并获取”时必填并生效。",
    requiredWhen: {
      acquireMode: "login",
    },
  },
  {
    key: "collectRegionCookies",
    label: "采集区域 Cookie",
    type: "boolean",
    required: false,
    switchLabel: "补抓区域 Cookie",
    description: "补抓 global / us / eu Cookie。",
  },
  {
    key: "keepPageOpen",
    label: "保留页面",
    type: "boolean",
    required: false,
    switchLabel: "执行后保留页面",
    description: "便于继续观察结果或处理风控。",
  },
]);
const visibleSessionAcquireFields = computed(() =>
  sessionAcquireFieldDefinitions.value
    .filter((field) => isSessionAcquireFieldVisible(field))
    .map((field) => ({
      ...field,
      required: isSessionAcquireFieldRequired(field),
    })),
);
const sessionAcquireModeLabel = computed(() =>
  sessionAcquireForm.acquireMode === "login" ? "登录并获取" : "直接获取",
);
const sessionAcquireSubmitText = computed(() =>
  sessionAcquireForm.acquireMode === "login" ? "登录后采集会话" : "采集当前环境会话",
);
const isTemuExecutionProfileLoading = computed(
  () =>
    selectedPlatformKey.value === TEMU_PLATFORM_KEY &&
    !!selectedClientId.value &&
    loadingMap.profiles,
);
const executionProfileSelectValue = computed({
  get: () => (isTemuExecutionProfileLoading.value ? "" : selectedProfileValue.value),
  set: (value: string) => {
    selectedProfileValue.value = String(value || ACTIVE_BROWSER_AUTOMATION_PROFILE_VALUE);
  },
});
const visibleExecutionProfileOptions = computed(() =>
  isTemuExecutionProfileLoading.value ? [] : profileOptions.value,
);
const selectedExecutionProfileId = computed(() =>
  isTemuExecutionProfileLoading.value
    ? ""
    : effectiveProfileId.value || selectedProfile.value?.id || activeProfile.value?.id || "",
);
const selectedExecutionProfileDisplayText = computed(() =>
  isTemuExecutionProfileLoading.value ? "" : selectedExecutionProfileId.value || "未选择",
);
const selectedExecutionEnvironmentText = computed(() =>
  isTemuExecutionProfileLoading.value
    ? ""
    : selectedExecutionProfileId.value
      ? selectedEnvironmentLabel.value
      : "未选择",
);
const selectedExecutionStoredSession = computed(() => {
  const profileId = String(selectedExecutionProfileId.value || "").trim();
  if (!profileId) {
    return null;
  }
  return storedSessionRows.value.find((item) => item.profileId === profileId) || null;
});
const temuWorkspaceProfileId = computed(() => selectedExecutionProfileId.value);
const temuWorkspaceSessionRecord = computed(
  () => selectedExecutionStoredSession.value?.record || null,
);
const temuWorkspacePlatformAccountText = computed(() => {
  const record = asPlainObject(temuWorkspaceSessionRecord.value);
  const userInfo = asPlainObject(record?.userInfo);
  return String(userInfo.accountId || record?.accountId || "").trim();
});
const temuWorkspaceValidationLoading = computed(
  () =>
    !!selectedExecutionProfileId.value &&
    sessionActionState.validate === selectedExecutionProfileId.value,
);
const temuWorkspaceAvailability = computed(() =>
  resolveTemuWorkspaceAvailability(temuWorkspaceSessionRecord.value, {
    platformAccountText: temuWorkspacePlatformAccountText.value,
    isValidating: temuWorkspaceValidationLoading.value,
  }),
);
const selectedStoredSession = computed(() => temuWorkspaceSessionRecord.value);
const currentEnvironmentValidation = computed(() =>
  asPlainObject(selectedExecutionStoredSession.value?.validation),
);

const storedPlatformAccountText = computed(() => {
  const accountTexts = collectPlatformAccountTexts(storedPlatformSession.value);
  if (!accountTexts.length) {
    return "-";
  }
  if (accountTexts.length === 1) {
    return accountTexts[0];
  }
  return `${accountTexts.length} 个账号`;
});

const selectedStoredUserInfo = computed(() => {
  const record = asPlainObject(selectedStoredSession.value);
  const userInfo = asPlainObject(record?.userInfo);
  const mallList = Array.isArray(userInfo.mallList)
    ? userInfo.mallList
    : Array.isArray(record?.mallList)
      ? record.mallList
      : [];

  return {
    status: String(userInfo.status || "").trim() || "missing",
    message:
      String(userInfo.message || "").trim() ||
      (mallList.length ? "已获取用户信息" : "暂无用户信息"),
    fetchedAt: String(userInfo.fetchedAt || "").trim(),
    accountId: String(userInfo.accountId || record?.accountId || "").trim(),
    accountType: String(userInfo.accountType || record?.accountType || "").trim(),
    mallId: String(userInfo.mallId || record?.mallId || "").trim(),
    mallName: String(userInfo.mallName || record?.mallName || "").trim(),
    mallList,
    mallCount: mallList.length,
  };
});

const selectedStoredAccountText = computed(() => {
  const accountId = String(selectedStoredUserInfo.value.accountId || "").trim();
  const accountType = String(selectedStoredUserInfo.value.accountType || "").trim();
  return [accountId, accountType].filter(Boolean).join(" / ") || storedPlatformAccountText.value;
});

const selectedStoredMallRows = computed(() => {
  const currentMallId = String(selectedStoredUserInfo.value.mallId || "").trim();

  return selectedStoredUserInfo.value.mallList.map((mall: any, index: number) => {
    const mallId = getTemuMallId(mall);
    const mallName = getTemuMallName(mall);

    return {
      key: `${mallId || mallName || "mall"}-${index}`,
      mallId,
      mallName,
      isCurrent: !!mallId && mallId === currentMallId,
      raw: mall,
    };
  });
});

const sessionCenterSessionStatusLabel = computed(() => {
  if (!selectedExecutionProfileId.value) {
    return "未选择环境";
  }

  return temuWorkspaceAvailability.value.label;
});

const sessionCenterHeadline = computed(() => {
  if (!selectedClientId.value) {
    return "请先选择在线客户端";
  }
  if (!selectedExecutionProfileId.value) {
    return "请先选择执行环境";
  }
  if (!selectedExecutionStoredSession.value) {
    return "这里只展示当前客户端当前环境的认证信息，当前环境还没有 Temu 会话";
  }

  return "这里只展示当前客户端当前环境的 Temu 会话与身份信息";
});
const currentEnvironmentAccountText = computed(() => {
  if (selectedStoredAccountText.value && selectedStoredAccountText.value !== "-") {
    return selectedStoredAccountText.value;
  }

  return "账号信息待同步";
});
const currentEnvironmentCookieSummary = computed(() => {
  const counts = selectedExecutionStoredSession.value?.cookieCounts;
  if (!counts) {
    return "-";
  }

  return `全球 ${counts.global} / 美区 ${counts.us} / 欧区 ${counts.eu}`;
});
const showMallPanel = computed(
  () =>
    selectedStoredMallRows.value.length > 1 ||
    selectedStoredMallRows.value.some((item) => !item.isCurrent),
);
const mallPanelDescription = computed(() => {
  const count = selectedStoredMallRows.value.length;
  if (!count) {
    return "暂无可切换店铺";
  }
  if (count > 5) {
    return `已同步 ${count} 个店铺，仅展示前 5 个`;
  }

  return `已同步 ${count} 个店铺`;
});
const showUserInfoCollapse = computed(() => {
  return (
    selectedStoredUserInfo.value.status !== "missing" ||
    selectedStoredMallRows.value.length > 0 ||
    !!selectedStoredUserInfo.value.accountId
  );
});

const selectedSessionRegionCards = computed(() => {
  const session = asPlainObject(selectedStoredSession.value?.session);
  const fallbackUpdatedAt = String(selectedStoredSession.value?.updatedAt || "").trim();

  return [
    {
      key: "global",
      label: "全球",
      cookies: asPlainObject(session?.global?.cookies),
      headers: asPlainObject(session?.global?.headers),
      updatedAt: String(session?.global?.updatedAt || fallbackUpdatedAt).trim(),
    },
    {
      key: "us",
      label: "美国",
      cookies: asPlainObject(session?.us?.cookies),
      headers: asPlainObject(session?.us?.headers),
      updatedAt: String(session?.us?.updatedAt || fallbackUpdatedAt).trim(),
    },
    {
      key: "eu",
      label: "欧区",
      cookies: asPlainObject(session?.eu?.cookies),
      headers: asPlainObject(session?.eu?.headers),
      updatedAt: String(session?.eu?.updatedAt || fallbackUpdatedAt).trim(),
    },
  ].map((item) => ({
    ...item,
    cookieCount: countObjectKeys(item.cookies),
    headerCount: countObjectKeys(item.headers),
  }));
});

const formatDateTime = (value?: string | null) =>
  value ? formatDate(new Date(value), "YYYY-MM-DD HH:mm:ss") : "";

const jsonText = (value: any) => {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value);
  }
};

const asPlainObject = (value: any): Record<string, any> =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const countObjectKeys = (value: any) => Object.keys(asPlainObject(value)).length;

const toNullableText = (value: any) => {
  const normalized = String(value || "").trim();
  return normalized || null;
};

const normalizeBrowserAutomationKey = (value?: string | null) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (
    normalized === "uploader" ||
    normalized === "browser" ||
    normalized === "browser-automation"
  ) {
    return "browser-automation";
  }
  return normalized;
};

const getTemuMallId = (mall: any) =>
  String(mall?.mallId ?? mall?.mallid ?? mall?.id ?? mall?.storeId ?? "").trim();

const getTemuMallName = (mall: any) =>
  String(mall?.mallName ?? mall?.name ?? mall?.storeName ?? mall?.mall_name ?? "").trim();

const resolveTemuAccountSnapshot = (value: any) => {
  const record = asPlainObject(value);
  const userInfo = asPlainObject(record?.userInfo);
  const accountId = String(userInfo.accountId || record?.accountId || "").trim();
  const accountType = String(userInfo.accountType || record?.accountType || "").trim();

  return {
    accountId,
    accountType,
    text: [accountId, accountType].filter(Boolean).join(" / "),
  };
};

const collectPlatformAccountTexts = (value: any) => {
  const profiles = asPlainObject(value?.profiles);
  return Array.from(
    new Set(
      Object.values(profiles)
        .map((item) => resolveTemuAccountSnapshot(item).text)
        .filter(Boolean),
    ),
  );
};

const buildMallActionKey = (profileId?: string | null, mallId?: string | null) =>
  `${String(profileId || "").trim()}::${String(mallId || "").trim()}`;

const buildTemuSessionRestorePayload = (record: any) => {
  const normalizedRecord = asPlainObject(record);
  const session = asPlainObject(normalizedRecord.session);
  const userInfo = asPlainObject(normalizedRecord.userInfo);

  return {
    mallId: String(userInfo.mallId || normalizedRecord.mallId || "").trim(),
    mallName: String(userInfo.mallName || normalizedRecord.mallName || "").trim(),
    session: {
      global: {
        cookies: asPlainObject(session?.global?.cookies),
        headers: asPlainObject(session?.global?.headers),
        updatedAt: String(session?.global?.updatedAt || normalizedRecord.updatedAt || "").trim(),
      },
      us: {
        cookies: asPlainObject(session?.us?.cookies),
        headers: asPlainObject(session?.us?.headers),
        updatedAt: String(session?.us?.updatedAt || normalizedRecord.updatedAt || "").trim(),
      },
      eu: {
        cookies: asPlainObject(session?.eu?.cookies),
        headers: asPlainObject(session?.eu?.headers),
        updatedAt: String(session?.eu?.updatedAt || normalizedRecord.updatedAt || "").trim(),
      },
    },
  };
};

const isSessionAcquireFieldVisible = (field: Record<string, any>) => {
  const visibleWhen = asPlainObject(field?.visibleWhen);
  if (!Object.keys(visibleWhen).length) {
    return true;
  }

  return Object.entries(visibleWhen).every(([key, expected]) => {
    return (
      String(sessionAcquireForm[key as keyof typeof sessionAcquireForm] ?? "").trim() ===
      String(expected ?? "").trim()
    );
  });
};

const isSessionAcquireFieldRequired = (field: Record<string, any>) => {
  const requiredWhen = asPlainObject(field?.requiredWhen);
  if (!Object.keys(requiredWhen).length) {
    return field.required === true;
  }

  return Object.entries(requiredWhen).every(([key, expected]) => {
    return (
      String(sessionAcquireForm[key as keyof typeof sessionAcquireForm] ?? "").trim() ===
      String(expected ?? "").trim()
    );
  });
};

const validateSessionAcquireField = (field: Record<string, any>) => {
  const key = String(field?.key || "").trim();
  if (!key) {
    return true;
  }

  const required = isSessionAcquireFieldRequired(field);
  const value = sessionAcquireForm[key as keyof typeof sessionAcquireForm];
  const isEmpty =
    value === undefined || value === null || (typeof value === "string" ? !value.trim() : false);

  if (required && isEmpty) {
    sessionAcquireErrors[key as keyof typeof sessionAcquireErrors] = `请填写${field.label || key}`;
    return false;
  }

  if (key in sessionAcquireErrors) {
    sessionAcquireErrors[key as keyof typeof sessionAcquireErrors] = "";
  }
  return true;
};

const buildToolFeedback = (event: ServiceCommandResultEvent) => {
  const errorDetail =
    event.errorDetail && typeof event.errorDetail === "object" && !Array.isArray(event.errorDetail)
      ? event.errorDetail
      : event.data?.errorDetail &&
          typeof event.data.errorDetail === "object" &&
          !Array.isArray(event.data.errorDetail)
        ? event.data.errorDetail
        : null;

  return {
    success: !!event.success,
    message:
      toNullableText(errorDetail?.userMessage) ||
      toNullableText(event.message) ||
      toNullableText(event.error) ||
      (event.success ? "执行成功" : "执行失败"),
    detail:
      toNullableText(errorDetail?.rawMessage) ||
      (event.success ? null : toNullableText(event.error || event.message)),
    suggestion: toNullableText(errorDetail?.suggestion),
    updatedAt: toNullableText(event.finishedAt),
  } satisfies ToolkitFeedback;
};

const getToolkitArrayCandidates = (value: any) => {
  const source = asPlainObject(value);
  const result = asPlainObject(source?.result);
  const data = asPlainObject(source?.data);

  return [
    Array.isArray(value) ? value : [],
    Array.isArray(source?.items) ? source.items : [],
    Array.isArray(source?.data) ? source.data : [],
    Array.isArray(data?.items) ? data.items : [],
    Array.isArray(result?.items) ? result.items : [],
    Array.isArray(result?.data) ? result.data : [],
  ];
};

const extractToolkitToolItems = (value: any): ToolkitToolItem[] => {
  const matched = getToolkitArrayCandidates(value).find((items) => items.length > 0) || [];

  return matched
    .filter((item) => item && typeof item === "object")
    .map((item) => item as ToolkitToolItem);
};

const extractToolkitToolResultPayload = (value: any) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (Object.prototype.hasOwnProperty.call(value, "result")) {
      return (value as Record<string, any>).result;
    }
  }

  return value;
};

const resetToolkitToolResults = () => {
  Object.keys(toolkitToolResults).forEach((key) => delete toolkitToolResults[key]);
};

const buildToolkitToolExecutionRecord = (
  event: ServiceCommandResultEvent,
  featureKey: string,
): ToolkitToolExecutionRecord => {
  const feedback = buildToolFeedback(event);
  const result = extractToolkitToolResultPayload(event.data);
  const output =
    result !== undefined && result !== null
      ? result
      : {
          success: feedback.success,
          message: feedback.message,
          detail: feedback.detail,
          suggestion: feedback.suggestion,
          updatedAt: feedback.updatedAt,
          featureKey,
        };

  return {
    featureKey,
    success: feedback.success,
    message: feedback.message,
    detail: feedback.detail,
    suggestion: feedback.suggestion,
    updatedAt: feedback.updatedAt,
    result,
    output,
    rawEvent: event,
  };
};

const syncStoredProfileSelection = (options: { preferExecutionProfile?: boolean } = {}) => {
  if (!storedSessionRows.value.length) {
    selectedStoredProfileId.value = "";
    return;
  }

  const preferredProfileId =
    effectiveProfileId.value || selectedProfile.value?.id || activeProfile.value?.id || "";
  if (options.preferExecutionProfile) {
    if (!preferredProfileId) {
      selectedStoredProfileId.value = "";
      return;
    }

    const matched = storedSessionRows.value.find((item) => item.profileId === preferredProfileId);
    selectedStoredProfileId.value = matched?.profileId || "";
    return;
  }

  if (
    selectedStoredProfileId.value &&
    storedSessionRows.value.some((item) => item.profileId === selectedStoredProfileId.value)
  ) {
    return;
  }

  if (preferredProfileId) {
    const matched = storedSessionRows.value.find((item) => item.profileId === preferredProfileId);
    if (matched) {
      selectedStoredProfileId.value = matched.profileId;
      return;
    }
  }

  selectedStoredProfileId.value = "";
};

const finish = (action?: string) => {
  if (action === "profiles") {
    loadingMap.profiles = false;
    return;
  }
  if (action === "tools") {
    loadingMap.tools = false;
    return;
  }
  if (action === "runTool") {
    loadingMap.runTool = false;
    runningToolkitFeatureKey.value = "";
  }
};

const dispatchCommand = async (
  action: "profiles" | "tools" | "runTool",
  requestor: () => Promise<BrowserAutomationCommandResponse>,
  sentMessage?: string,
  options: {
    featureKey?: string;
  } = {},
) => {
  if (loadingMap[action]) return;
  loadingMap[action] = true;
  if (action === "runTool") {
    runningToolkitFeatureKey.value = String(options.featureKey || "").trim();
  }

  try {
    const response = await requestor();
    if (!response?.success) {
      finish(action);
      ElMessage.error(response?.message || "命令发送失败");
      return;
    }

    const commandId = response.data?.commandId;
    if (!commandId) {
      finish(action);
      return;
    }

    pending[commandId] = action;
    if (action === "runTool" && options.featureKey) {
      pendingRunToolFeatureKeys[commandId] = options.featureKey;
    }
    if (sentMessage) {
      ElMessage.success(sentMessage);
    }
  } catch (error: any) {
    finish(action);
    ElMessage.error(error?.message || "命令发送失败");
  }
};

const sendProfiles = async () =>
  selectedClientId.value &&
  dispatchCommand("profiles", () => getToolkitProfiles(selectedClientId.value));

const sendTools = async () =>
  selectedClientId.value &&
  dispatchCommand("tools", () => getToolkitTools(selectedClientId.value));

const buildMergedRegionSession = (
  nextCookies: Record<string, any>,
  nextHeaders: Record<string, any>,
  fallback: Record<string, any>,
  updatedAt: string,
) => {
  const fallbackCookies = asPlainObject(fallback?.cookies);
  const fallbackHeaders = asPlainObject(fallback?.headers);

  return {
    cookies: Object.keys(nextCookies).length ? nextCookies : fallbackCookies,
    headers: Object.keys(nextHeaders).length ? nextHeaders : fallbackHeaders,
    updatedAt,
  };
};

const buildTemuStoredSessionPayload = (sessionBundle: Record<string, any>, profileId: string) => {
  const collectedAt = String(sessionBundle?.collectedAt || new Date().toISOString()).trim();
  const regionHeaders = asPlainObject(sessionBundle?.regionHeaders);
  const currentPlatform = asPlainObject(storedPlatformSession.value);
  const currentProfile = asPlainObject(currentPlatform?.profiles?.[profileId]);
  const currentSession = asPlainObject(currentProfile?.session);
  const currentUserInfo = asPlainObject(currentProfile?.userInfo);
  const sessionHeadersTemplate = asPlainObject(sessionBundle?.headersTemplate);
  const nextGlobalHeaders = Object.keys(sessionHeadersTemplate).length
    ? sessionHeadersTemplate
    : asPlainObject(regionHeaders.global);
  const nextMallList =
    Array.isArray(sessionBundle?.mallList) && sessionBundle.mallList.length
      ? sessionBundle.mallList
      : Array.isArray(currentProfile?.mallList)
        ? currentProfile.mallList
        : [];
  const nextAccountId = String(
    sessionBundle?.accountId || currentProfile?.accountId || currentUserInfo?.accountId || "",
  ).trim();
  const nextAccountType = String(
    sessionBundle?.accountType || currentProfile?.accountType || currentUserInfo?.accountType || "",
  ).trim();
  const nextMallId = String(
    sessionBundle?.mallId || currentProfile?.mallId || currentUserInfo?.mallId || "",
  ).trim();
  const nextMallName = String(
    sessionBundle?.mallName || currentProfile?.mallName || currentUserInfo?.mallName || "",
  ).trim();
  const hasFreshUserInfo = !!nextAccountId || nextMallList.length > 0;
  const nextUserInfo = {
    status: hasFreshUserInfo ? "success" : String(currentUserInfo.status || "missing"),
    message: hasFreshUserInfo
      ? "采集时同步返回用户信息"
      : String(currentUserInfo.message || "暂无用户信息，可手动获取"),
    fetchedAt: hasFreshUserInfo ? collectedAt : String(currentUserInfo.fetchedAt || "").trim(),
    accountId: nextAccountId,
    accountType: nextAccountType,
    mallId: nextMallId,
    mallName: nextMallName,
    mallList: nextMallList,
    mallCount: nextMallList.length,
  };

  return {
    profiles: {
      [profileId]: {
        mallId: nextMallId,
        mallName: nextMallName,
        accountId: nextAccountId,
        accountType: nextAccountType,
        mallList: nextMallList,
        headersTemplate: nextGlobalHeaders,
        userInfo: nextUserInfo,
        updatedAt: collectedAt,
        validation: {
          status: "fresh",
          message: "会话已更新，建议重新校验",
          checkedAt: collectedAt,
        },
        session: {
          global: buildMergedRegionSession(
            asPlainObject(sessionBundle?.cookies_global || sessionBundle?.cookies),
            nextGlobalHeaders,
            asPlainObject(currentSession?.global),
            collectedAt,
          ),
          us: buildMergedRegionSession(
            asPlainObject(sessionBundle?.cookies_us),
            asPlainObject(regionHeaders.us),
            asPlainObject(currentSession?.us),
            collectedAt,
          ),
          eu: buildMergedRegionSession(
            asPlainObject(sessionBundle?.cookies_eu),
            asPlainObject(regionHeaders.eu),
            asPlainObject(currentSession?.eu),
            collectedAt,
          ),
        },
      },
    },
  };
};

const resolveCollectedProfileId = (result: Record<string, any>) => {
  const candidates = [
    result?.profileId,
    effectiveProfileId.value,
    selectedProfile.value?.id,
    activeProfile.value?.id,
  ];

  return candidates.map((item) => String(item || "").trim()).find(Boolean) || "";
};

const persistTemuSessionBundle = async (sessionBundle: Record<string, any>, profileId: string) => {
  await updatePlatformSessions({
    platform: TEMU_PLATFORM_KEY,
    data: buildTemuStoredSessionPayload(sessionBundle, profileId),
  });
  selectedStoredProfileId.value = profileId;
  await refreshStoredPlatformSessions();
};

const dispatchTemuSessionAcquire = async (
  profileId: string,
  options?: {
    acquireMode?: "direct" | "login";
    account?: string;
    password?: string;
    collectRegionCookies?: boolean;
    keepPageOpen?: boolean;
  },
  sentMessage = "Temu 会话获取命令已发送",
) => {
  if (!selectedClientId.value) {
    ElMessage.warning("请先选择在线客户端");
    return;
  }

  const acquireMode = options?.acquireMode === "login" ? "login" : "direct";
  const account = String(options?.account || "").trim();
  const password = String(options?.password || "").trim();

  await dispatchCommand(
    "runTool",
    () =>
      runToolkitTool(selectedClientId.value, {
        featureKey: TEMU_SESSION_TOOL_KEY,
        profileId,
        acquireMode,
        collectRegionCookies: options?.collectRegionCookies !== false,
        keepPageOpen: options?.keepPageOpen !== false,
        ...(acquireMode === "login" ? { account, password } : {}),
      }),
    sentMessage,
    {
      featureKey: TEMU_SESSION_TOOL_KEY,
    },
  );
};

const acquireCurrentSession = async () => {
  const profileId = String(selectedExecutionProfileId.value || "").trim();
  if (!profileId) {
    ElMessage.warning("请先选择执行环境");
    return;
  }

  sessionAcquireErrors.account = "";
  sessionAcquireErrors.password = "";
  const valid = visibleSessionAcquireFields.value.every((field) =>
    validateSessionAcquireField(field),
  );
  if (!valid) {
    ElMessage.warning("请先完善会话获取参数");
    return;
  }

  await dispatchTemuSessionAcquire(
    profileId,
    {
      acquireMode: sessionAcquireForm.acquireMode as "direct" | "login",
      account: sessionAcquireForm.account,
      password: sessionAcquireForm.password,
      collectRegionCookies: sessionAcquireForm.collectRegionCookies,
      keepPageOpen: sessionAcquireForm.keepPageOpen,
    },
    sessionAcquireForm.acquireMode === "login"
      ? "Temu 登录后采集会话命令已发送"
      : "Temu 当前环境会话采集命令已发送",
  );
};

const quickAcquireCurrentSession = async () => {
  if (!selectedClientId.value) {
    ElMessage.warning("请先选择在线客户端");
    return;
  }

  const profileId = String(selectedExecutionProfileId.value || "").trim();
  if (!profileId) {
    ElMessage.warning("请先选择执行环境");
    return;
  }

  await dispatchTemuSessionAcquire(
    profileId,
    {
      acquireMode: "direct",
      collectRegionCookies: sessionAcquireForm.collectRegionCookies,
      keepPageOpen: sessionAcquireForm.keepPageOpen,
    },
    "Temu 当前环境会话采集命令已发送",
  );
};

const runWorkspaceTool = async (payload: {
  featureKey: string;
  payload: Record<string, any>;
}) => {
  if (!selectedClientId.value) {
    ElMessage.warning("请先选择在线客户端");
    return;
  }

  const featureKey = String(payload?.featureKey || "").trim();
  if (!featureKey) {
    ElMessage.warning("缺少工具标识");
    return;
  }
  const featureName =
    toolkitTools.value.find((item) => String(item?.key || "").trim() === featureKey)?.name ||
    featureKey;

  await dispatchCommand(
    "runTool",
    () =>
      runToolkitTool(selectedClientId.value, {
        featureKey,
        ...(payload?.payload && typeof payload.payload === "object" ? payload.payload : {}),
      }),
    `${featureName} 命令已发送`,
    {
      featureKey,
    },
  );
};

const refreshStoredPlatformSessions = async () => {
  if (selectedPlatformKey.value !== TEMU_PLATFORM_KEY) {
    storedPlatformSession.value = {};
    selectedStoredProfileId.value = "";
    return;
  }

  storedSessionLoading.value = true;
  try {
    const response = await getPlatformSessions({ platform: TEMU_PLATFORM_KEY });
    storedPlatformSession.value = asPlainObject(response);
    syncStoredProfileSelection();
  } catch (error: any) {
    ElMessage.error(error?.message || "获取已存储会话失败");
  } finally {
    storedSessionLoading.value = false;
  }
};

const openSessionDetail = (profileId?: string) => {
  const normalizedProfileId = String(
    profileId || selectedExecutionProfileId.value || selectedStoredProfileId.value || "",
  ).trim();
  if (normalizedProfileId) {
    selectedStoredProfileId.value = normalizedProfileId;
  }

  if (!selectedStoredSession.value) {
    ElMessage.warning("暂无可查看的会话详情");
    return;
  }

  sessionDetailDialogVisible.value = true;
};

const openSessionCenter = () => {
  selectedStoredProfileId.value = String(selectedExecutionProfileId.value || "").trim();

  sessionCenterVisible.value = true;

  if (selectedPlatformSupportsStoredSessions.value) {
    void refreshStoredPlatformSessions();
  }
};

const refreshStoredSessionUserInfo = async (profileId?: string) => {
  const normalizedProfileId = String(
    profileId || selectedExecutionProfileId.value || selectedStoredProfileId.value || "",
  ).trim();
  if (!normalizedProfileId) {
    ElMessage.warning("请先选择要获取信息的会话");
    return;
  }

  sessionActionState.refreshInfo = normalizedProfileId;
  try {
    const result = await refreshPlatformSessionInfo({
      platform: TEMU_PLATFORM_KEY,
      profileId: normalizedProfileId,
    });
    await refreshStoredPlatformSessions();
    ElMessage[result?.success ? "success" : "warning"](result?.message || "用户信息获取完成");
  } catch (error: any) {
    ElMessage.error(error?.message || "获取用户信息失败");
  } finally {
    sessionActionState.refreshInfo = "";
  }
};

const applyStoredMall = async (
  profileId?: string,
  mall?: { mallId?: string; mallName?: string },
) => {
  const normalizedProfileId = String(
    profileId || selectedExecutionProfileId.value || selectedStoredProfileId.value || "",
  ).trim();
  const mallId = String(mall?.mallId || "").trim();
  const mallName = String(mall?.mallName || "").trim();

  if (!normalizedProfileId || !mallId) {
    ElMessage.warning("请选择要设置的店铺");
    return;
  }

  const actionKey = buildMallActionKey(normalizedProfileId, mallId);
  sessionActionState.applyMall = actionKey;

  try {
    await updatePlatformSessions({
      platform: TEMU_PLATFORM_KEY,
      profileId: normalizedProfileId,
      data: {
        mallId,
        mallName,
        userInfo: {
          mallId,
          mallName,
        },
      },
    });
    await refreshStoredPlatformSessions();
    ElMessage.success("当前店铺已更新");
  } catch (error: any) {
    ElMessage.error(error?.message || "设置当前店铺失败");
  } finally {
    sessionActionState.applyMall = "";
  }
};

const validateStoredSession = async (profileId?: string, options: { silent?: boolean } = {}) => {
  const normalizedProfileId = String(
    profileId || selectedExecutionProfileId.value || selectedStoredProfileId.value || "",
  ).trim();
  if (!normalizedProfileId) {
    ElMessage.warning("请先选择要校验的会话");
    return;
  }

  sessionActionState.validate = normalizedProfileId;
  try {
    const result = await validatePlatformSession({
      platform: TEMU_PLATFORM_KEY,
      profileId: normalizedProfileId,
    });
    await refreshStoredPlatformSessions();
    if (!options.silent || !result?.success) {
      ElMessage[result?.success ? "success" : "warning"](result?.message || "校验完成");
    }
  } catch (error: any) {
    if (!options.silent) {
      ElMessage.error(error?.message || "校验会话失败");
    }
  } finally {
    sessionActionState.validate = "";
  }
};

const deleteStoredSession = async (profileId?: string) => {
  const normalizedProfileId = String(
    profileId || selectedExecutionProfileId.value || selectedStoredProfileId.value || "",
  ).trim();
  if (!normalizedProfileId) {
    ElMessage.warning("请先选择要删除的会话");
    return;
  }

  try {
    await ElMessageBox.confirm(`确认删除环境 ${normalizedProfileId} 的 Temu 会话吗？`, "删除会话", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }

  sessionActionState.delete = normalizedProfileId;
  try {
    await deletePlatformSession({
      platform: TEMU_PLATFORM_KEY,
      profileId: normalizedProfileId,
    });
    await refreshStoredPlatformSessions();
    ElMessage.success("会话已删除");
  } catch (error: any) {
    ElMessage.error(error?.message || "删除会话失败");
  } finally {
    sessionActionState.delete = "";
  }
};

const reacquireStoredSession = async (profileId?: string) => {
  const normalizedProfileId = String(
    profileId || selectedExecutionProfileId.value || selectedStoredProfileId.value || "",
  ).trim();
  if (!normalizedProfileId) {
    ElMessage.warning("请先选择要重新获取的会话");
    return;
  }

  if (!selectedClientId.value) {
    ElMessage.warning("请先选择在线客户端");
    return;
  }

  if (
    !profileOptions.value.some((item) => item.value === normalizedProfileId) &&
    normalizedProfileId !== activeProfile.value?.id
  ) {
    ElMessage.warning("当前客户端下未找到该执行环境，请先切换到对应客户端或环境");
    return;
  }

  sessionActionState.reacquire = normalizedProfileId;
  try {
    selectedProfileValue.value = normalizedProfileId;
    await dispatchTemuSessionAcquire(normalizedProfileId);
  } finally {
    sessionActionState.reacquire = "";
  }
};

const restoreStoredSessionToCurrentEnvironment = async (profileId?: string) => {
  const normalizedProfileId = String(
    profileId || selectedExecutionProfileId.value || selectedStoredProfileId.value || "",
  ).trim();
  if (!selectedClientId.value) {
    ElMessage.warning("请先选择在线客户端");
    return;
  }
  if (!normalizedProfileId) {
    ElMessage.warning("请先选择执行环境");
    return;
  }

  const sessionRecord = selectedStoredSession.value;
  if (!sessionRecord) {
    ElMessage.warning("当前环境暂无可写入的 Temu 会话");
    return;
  }

  const restorePayload = buildTemuSessionRestorePayload(sessionRecord);
  const totalCookieCount =
    countObjectKeys(restorePayload.session.global.cookies) +
    countObjectKeys(restorePayload.session.us.cookies) +
    countObjectKeys(restorePayload.session.eu.cookies);
  if (!totalCookieCount) {
    ElMessage.warning("当前存储会话没有可写入的 Cookie");
    return;
  }

  await dispatchCommand(
    "runTool",
    () =>
      runToolkitTool(selectedClientId.value, {
        featureKey: TEMU_SESSION_RESTORE_TOOL_KEY,
        profileId: normalizedProfileId,
        ...restorePayload,
      }),
    "Temu 存储会话写入命令已发送",
    {
      featureKey: TEMU_SESSION_RESTORE_TOOL_KEY,
    },
  );
};

const buildTemuAutoValidationCacheKey = (profileId: string) =>
  `${String(selectedClientId.value || "").trim()}::${profileId}`;

const buildTemuAutoValidationSignature = (profileId: string) => {
  const record = asPlainObject(temuWorkspaceSessionRecord.value);
  const validation = asPlainObject(record.validation);
  return [
    profileId,
    String(record.updatedAt || "").trim(),
    String(validation.status || "").trim(),
    String(validation.checkedAt || "").trim(),
    countObjectKeys(record?.session?.global?.cookies),
  ].join("::");
};

const ensureTemuSessionValidated = async () => {
  if (selectedPlatformKey.value !== TEMU_PLATFORM_KEY) {
    return;
  }

  const profileId = String(selectedExecutionProfileId.value || "").trim();
  if (!profileId || !temuWorkspaceAvailability.value.shouldAutoValidate) {
    return;
  }

  const cacheKey = buildTemuAutoValidationCacheKey(profileId);
  const signature = buildTemuAutoValidationSignature(profileId);
  if (autoValidatedTemuSessions[cacheKey] === signature) {
    return;
  }

  autoValidatedTemuSessions[cacheKey] = signature;
  await validateStoredSession(profileId, { silent: true });
};

const onCommand = async (event: ServiceCommandResultEvent) => {
  if (normalizeBrowserAutomationKey(event.pluginKey || event.service) !== "browser-automation") {
    return;
  }

  const action = pending[event.commandId];
  const pendingFeatureKey = String(pendingRunToolFeatureKeys[event.commandId] || "").trim();
  if (!action) {
    return;
  }

  delete pending[event.commandId];
  delete pendingRunToolFeatureKeys[event.commandId];
  finish(action);

  const data = event.data;
  const dataObject = asPlainObject(data);
  if (event.clientId === selectedClientId.value) {
    if (action === "profiles") {
      setProfilesPayload({
        activeProfileId: dataObject?.activeProfileId || null,
        workspaceDir: dataObject?.workspaceDir,
        profilesRootDir: dataObject?.profilesRootDir,
        items: Array.isArray(dataObject?.items) ? dataObject.items : [],
      });
    }

    if (action === "tools") {
      toolkitTools.value = event.success ? extractToolkitToolItems(data) : [];
    }

    if (action === "runTool") {
      const result = asPlainObject(extractToolkitToolResultPayload(data));
      const featureKey = String(
        dataObject?.featureKey || result?.featureKey || pendingFeatureKey,
      ).trim();

      if (featureKey) {
        toolkitToolResults[featureKey] = buildToolkitToolExecutionRecord(event, featureKey);
      }

      if (
        event.success &&
        [TEMU_SESSION_TOOL_KEY, "temu-session-collect"].includes(
          featureKey,
        )
      ) {
        const sessionBundle = asPlainObject(result?.sessionBundle);
        const profileId = resolveCollectedProfileId(result);
        if (sessionBundle && profileId) {
          try {
            await persistTemuSessionBundle(sessionBundle, profileId);
          } catch (error: any) {
            ElMessage.warning(`会话获取成功，但自动存储失败：${error?.message || "未知错误"}`);
          }
        }
      }
    }
  }

  if (action === "runTool") {
    const feedback = buildToolFeedback(event);
    ElMessage[feedback.success ? "success" : "error"](feedback.message);
    return;
  }

  if (!event.success) {
    const feedback = buildToolFeedback(event);
    ElMessage.error(feedback.message);
  }
};

const loadClients = async () => {
  await refreshClients();
};

const enterToolkitPlatform = (platformKey: string) => {
  selectedPlatformKey.value = String(platformKey || "").trim();
};

const leaveToolkitPlatform = () => {
  sessionCenterVisible.value = false;
  sessionDetailDialogVisible.value = false;
  selectedPlatformKey.value = "";
};

const handleRefreshContext = async () => {
  await loadClients();
  if (selectedClientId.value) {
    void sendProfiles();
    void sendTools();
  }
  void refreshStoredPlatformSessions();
};

const goToBrowserAutomation = () => {
  router.push("/external/browser-automation");
};

const temuAutoValidationWatchKey = computed(() => {
  const record = asPlainObject(temuWorkspaceSessionRecord.value);
  const validation = asPlainObject(record.validation);
  return [
    selectedPlatformKey.value,
    String(selectedClientId.value || "").trim(),
    String(selectedExecutionProfileId.value || "").trim(),
    String(record.updatedAt || "").trim(),
    String(validation.status || "").trim(),
    String(validation.checkedAt || "").trim(),
    countObjectKeys(record?.session?.global?.cookies),
    temuWorkspaceValidationLoading.value ? "validating" : "idle",
  ].join("::");
});

watch(
  selectedClientId,
  (value) => {
    resetProfiles();
    selectedProfileValue.value = ACTIVE_BROWSER_AUTOMATION_PROFILE_VALUE;
    toolkitTools.value = [];
    resetToolkitToolResults();
    runningToolkitFeatureKey.value = "";

    if (!value) {
      return;
    }

    void sendProfiles();
    void sendTools();
  },
  { immediate: false },
);

watch(
  () => sessionAcquireForm.acquireMode,
  (mode) => {
    sessionAcquireErrors.account = "";
    sessionAcquireErrors.password = "";
    if (mode !== "login") {
      sessionAcquireForm.account = "";
      sessionAcquireForm.password = "";
    }
  },
);

watch(
  () => sessionAcquireForm.account,
  () => {
    if (sessionAcquireErrors.account) {
      sessionAcquireErrors.account = "";
    }
  },
);

watch(
  () => sessionAcquireForm.password,
  () => {
    if (sessionAcquireErrors.password) {
      sessionAcquireErrors.password = "";
    }
  },
);

watch(
  selectedPlatformKey,
  (value) => {
    if (!value) {
      sessionCenterVisible.value = false;
      sessionDetailDialogVisible.value = false;
    }

    void refreshStoredPlatformSessions();
  },
  { immediate: true },
);

watch(
  storedSessionRows,
  () => {
    syncStoredProfileSelection();
  },
  { deep: true },
);

watch(
  selectedExecutionProfileId,
  () => {
    syncStoredProfileSelection({ preferExecutionProfile: true });
    resetToolkitToolResults();
  },
  { immediate: true },
);

watch(
  temuAutoValidationWatchKey,
  () => {
    void ensureTemuSessionValidated();
  },
  { immediate: true },
);

onMounted(async () => {
  websocketClient.events.on("serviceCommandResult", onCommand);
  await loadClients();
  if (selectedClientId.value) {
    void sendProfiles();
    void sendTools();
  }
});

onUnmounted(() => {
  websocketClient.events.off("serviceCommandResult", onCommand);
});
</script>

<style scoped lang="scss">
.toolkit-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 8px;
}

.toolkit-page-head,
.toolkit-platform-hub__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toolkit-page-head {
  padding: 2px 2px 0;
}

.toolkit-page-head__main,
.toolkit-platform-hub__main {
  min-width: 0;
}

.toolkit-page-head__main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolkit-page-head__content {
  min-width: 0;
}

.toolkit-page-head__back {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;
}

.toolkit-page-head__back :deep(.el-icon) {
  font-size: 16px;
}

.toolkit-page-head__title {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}

.toolkit-platform-hub__title {
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
}

.toolkit-page-head__desc,
.toolkit-platform-hub__desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.toolkit-page-head__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.toolkit-platform-hub {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  border-radius: 18px;
  box-shadow: var(--el-box-shadow-light);
}

.toolkit-platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.toolkit-platform-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 16px;
  text-align: left;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-blank);
  border-radius: 16px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease,
    background-color 0.2s ease;
}

.toolkit-platform-card:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: var(--el-box-shadow-light);
  transform: translateY(-1px);
}

.toolkit-platform-card__eyebrow {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.toolkit-platform-card__title {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 700;
}

.toolkit-platform-card__desc {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.toolkit-platform-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
}

.toolkit-platform-card__enter {
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.toolkit-hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toolkit-hero__card {
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  border-radius: 18px;
  box-shadow: var(--el-box-shadow-light);
  padding: 10px 12px;
}

.toolkit-hero__card--selectors {
  padding-top: 12px;
  padding-bottom: 12px;
}

.toolkit-hero__selectors {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
  align-items: end;
}

.toolkit-hero__field {
  min-width: 0;
}

.toolkit-hero__label {
  margin-bottom: 6px;
  color: var(--el-text-color-regular);
  font-size: 11px;
  font-weight: 600;
}

.toolkit-hero__select {
  width: 100%;
}

.toolkit-hero__context {
  min-width: 0;
}

.toolkit-option__title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.toolkit-option__meta {
  margin-top: 2px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
  white-space: normal;
}

.toolkit-center {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 100%;
  padding-top: 8px;
}

.toolkit-center__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.toolkit-center__summary-item {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.toolkit-center__summary-item span {
  display: inline;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.toolkit-center__summary-item strong {
  display: inline;
  margin-top: 0;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
  word-break: break-word;
}

.toolkit-panel {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.toolkit-panel--acquire {
  margin-top: 2px;
}

.toolkit-panel__head,
.toolkit-session-card__head,
.toolkit-session-region__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.toolkit-panel__title,
.toolkit-session-card__title {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 700;
}

.toolkit-panel__desc,
.toolkit-session-card__desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.7;
}

.toolkit-panel__actions {
  display: flex;
  gap: 8px;
}

.toolkit-form-panel {
  margin-top: 8px;
  padding: 0 0 8px;
  border-radius: 0;
  background: transparent;
  border: 0;
}

.toolkit-form-panel--acquire {
  margin-top: 0;
}

.toolkit-form-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.toolkit-form-panel__title {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 700;
}

.toolkit-form-panel__desc {
  margin-top: 2px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.5;
}

.toolkit-form {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.toolkit-form--acquire {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.toolkit-runner {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.toolkit-form :deep(.small-feature-field) {
  min-height: 100%;
  gap: 6px;
  padding: 9px 10px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.toolkit-form :deep(.small-feature-field.is-error) {
  border-color: var(--el-color-danger-light-5);
}

.toolkit-form :deep(.small-feature-field__label) {
  font-size: 11px;
}

.toolkit-form :deep(.small-feature-field__hint) {
  font-size: 11px;
  line-height: 1.45;
}

.toolkit-form :deep(.small-feature-field .el-select),
.toolkit-form :deep(.small-feature-field .el-input),
.toolkit-form :deep(.small-feature-field .el-input-number) {
  width: 100%;
}

.toolkit-form :deep(.small-feature-field .el-switch) {
  display: inline-flex;
  align-items: flex-start;
  height: auto;
}

.toolkit-form :deep(.small-feature-field .el-switch__label) {
  white-space: normal;
  line-height: 1.45;
  font-size: 11px;
}

.toolkit-session-card,
.toolkit-userinfo-panel {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.toolkit-session-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolkit-session-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.toolkit-session-region__time {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.toolkit-result-collapse {
  margin-top: 12px;
}

.toolkit-result-collapse :deep(.el-collapse-item__header),
.toolkit-result-collapse :deep(.el-collapse-item__wrap) {
  background: transparent;
}

.toolkit-result-collapse :deep(.el-collapse-item__header) {
  color: var(--el-text-color-primary);
  font-weight: 600;
  border-bottom-color: var(--el-border-color-lighter);
}

.toolkit-result-collapse :deep(.el-collapse-item__wrap) {
  border-bottom-color: var(--el-border-color-lighter);
}

.toolkit-result-collapse :deep(.el-collapse-item__content) {
  padding-bottom: 0;
  color: var(--el-text-color-primary);
}

.toolkit-session-region__json-box {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.toolkit-result-json,
.toolkit-session-region__json-box pre {
  margin: 0;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 12px;
  line-height: 1.65;
  overflow: auto;
  max-height: 280px;
  font-family:
    "SFMono-Regular", "JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo,
    monospace;
  word-break: break-word;
}

.toolkit-result-json {
  margin-top: 10px;
}

.toolkit-session-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.toolkit-session-card__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 16px;
}

.toolkit-userinfo-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.toolkit-userinfo-panel__title {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 700;
}

.toolkit-userinfo-panel__desc {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.toolkit-userinfo-panel__desc {
  margin-top: 2px;
  line-height: 1.5;
}

.toolkit-mall-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.toolkit-mall-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-fill-color-blank);
}

.toolkit-mall-item.is-current {
  border-color: var(--el-color-success-light-5);
  background: var(--el-color-success-light-9);
}

.toolkit-mall-item__main {
  min-width: 0;
}

.toolkit-mall-item__name {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
}

.toolkit-mall-item__meta {
  margin-top: 2px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.toolkit-mall-item__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.toolkit-meta-chip {
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: 0;
}

.toolkit-meta-chip span {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.toolkit-meta-chip strong {
  display: block;
  margin-top: 2px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
  word-break: break-word;
}

.toolkit-session-dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.toolkit-session-dialog__regions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolkit-session-region {
  padding: 14px;
  border-radius: 16px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
}

.toolkit-session-region__title {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 700;
}

.toolkit-session-region__meta {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.toolkit-session-region__json-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.toolkit-session-region__json-title {
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 700;
}

:deep(.toolkit-center-dialog .el-dialog__header) {
  padding: 18px 20px 10px;
}

:deep(.toolkit-center-dialog .el-dialog__body) {
  padding: 4px 20px 20px;
}

@media (max-width: 1180px) {
  .toolkit-form--acquire,
  .toolkit-session-region__json-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .toolkit-session-card__meta {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 760px) {
  .toolkit-page-head,
  .toolkit-platform-hub__head,
  .toolkit-panel__head,
  .toolkit-form-panel__head,
  .toolkit-session-card__head,
  .toolkit-session-region__head {
    flex-direction: column;
  }

  .toolkit-hero {
    gap: 8px;
  }

  .toolkit-hero__card {
    padding: 12px;
  }

  .toolkit-hero__selectors {
    grid-template-columns: minmax(0, 1fr);
  }

  .toolkit-hero__context {
    padding-top: 0;
  }

  .toolkit-page-head__actions {
    width: 100%;
    justify-content: flex-start;
  }

  .toolkit-platform-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .toolkit-platform-card__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolkit-userinfo-panel__head {
    flex-direction: column;
  }

  .toolkit-mall-item {
    flex-direction: column;
    align-items: stretch;
  }

  .toolkit-mall-item__actions {
    justify-content: flex-end;
  }
}
</style>
