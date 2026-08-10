<template>
  <ContentWrap :plain="true">
    <div class="toolkit-page">
      <section v-if="!selectedPlatform" class="toolkit-platform-hub">
        <div class="toolkit-platform-hub__head">
          <div class="toolkit-platform-hub__main">
            <div class="toolkit-platform-hub__title">工具集</div>
            <div class="toolkit-platform-hub__desc">
              统一管理各平台的小工具工作台、会话能力和执行环境。
            </div>
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
            <span class="toolkit-platform-card__title">{{ platform.label }}</span>
            <span class="toolkit-platform-card__meta">
              {{ platform.description || "平台工具集" }}
            </span>
            <span class="toolkit-platform-card__footer">
              <span class="toolkit-platform-card__enter">进入工具集</span>
            </span>
          </button>
        </div>
      </section>

      <template v-else>
        <section class="toolkit-hero">
          <div class="toolkit-hero__card toolkit-hero__card--context">
            <div class="toolkit-hero__context-shell">
              <div class="toolkit-hero__context-control">
                <div class="toolkit-hero__control-group">
                  <div class="toolkit-hero__label">客户端</div>
                  <el-select
                    v-model="selectedClientId"
                    class="toolkit-hero__select"
                    size="small"
                    placeholder="请选择客户端"
                    :loading="loading && !clientOptions.length"
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

                <div class="toolkit-hero__control-group">
                  <div class="toolkit-hero__label">环境</div>
                  <el-select
                    v-model="executionProfileSelectValue"
                    class="toolkit-hero__select"
                    size="small"
                    placeholder="请选择环境"
                    :loading="loadingMap.profiles && !visibleExecutionProfileOptions.length"
                    :disabled="!selectedClientId"
                    clearable
                  >
                    <el-option
                      v-for="option in visibleExecutionProfileOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </div>
              </div>

              <div v-if="selectedPlatformContextComponent" class="toolkit-hero__context-panel">
                <component
                  :is="selectedPlatformContextComponent"
                  class="toolkit-hero__context"
                  :profile-id="temuWorkspaceProfileId"
                  :profile-loading="isTemuExecutionProfileLoading"
                  :session-record="temuWorkspaceSessionRecord"
                  :platform-account-text="temuWorkspacePlatformAccountText"
                  :validation-loading="temuWorkspaceValidationLoading"
                  :validation-checked-at-text="currentEnvironmentValidationCheckedAtText"
                  :refresh-info-loading="temuWorkspaceRefreshInfoLoading"
                  :acquire-loading="sessionToolRunning"
                  :acquire-disabled="sessionAcquireActionDisabled"
                  @acquire-session="quickAcquireCurrentSession"
                  @validate-session="validateStoredSession(selectedExecutionProfileId)"
                  @refresh-session-user-info="
                    refreshStoredSessionUserInfo(selectedExecutionProfileId)
                  "
                  @open-session-center="openSessionCenter"
                />
              </div>
            </div>
          </div>
        </section>

        <div
          v-if="selectedPlatformWorkspace"
          class="toolkit-workspace-shell"
          :class="{ 'is-locked': temuWorkspaceLocked }"
        >
          <div class="toolkit-workspace-shell__body">
            <component
              :is="selectedPlatformWorkspace"
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
          </div>

          <div v-if="temuWorkspaceLocked" class="toolkit-workspace-shell__mask">
            <div class="toolkit-workspace-shell__mask-card">
              <div class="toolkit-workspace-shell__mask-title">
                <el-icon class="toolkit-workspace-shell__mask-icon"><WarningFilled /></el-icon>
                <span>当前环境暂不可用</span>
              </div>
              <div class="toolkit-workspace-shell__mask-desc">
                {{ temuWorkspaceLockText }}
              </div>
            </div>
          </div>
        </div>
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
                  <div class="toolkit-form-panel__title">账号密码</div>
                  <div class="toolkit-form-panel__desc">
                    当前环境 {{ selectedExecutionProfileDisplayText }}
                  </div>
                </div>
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
                  size="small"
                  :loading="sessionActionState.saveCredential === selectedExecutionProfileId"
                  :disabled="!selectedExecutionProfileId"
                  @click="saveTemuCredentials()"
                >
                  保存账号密码
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
                  type="danger"
                  :disabled="!invalidStoredSessionRows.length"
                  :loading="sessionActionState.delete === '__invalid__'"
                  @click="deleteInvalidStoredSessions"
                >
                  清理无效环境
                </el-button>
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
                  <div class="toolkit-session-card__title">当前环境会话</div>
                  <div class="toolkit-session-card__desc">
                    {{ temuWorkspaceAvailability.detail }}
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
                  <el-button
                    text
                    size="small"
                    :disabled="loadingMap.runTool && !temuWorkspaceRestoreLoading"
                    :loading="temuWorkspaceRestoreLoading"
                    @click="restoreStoredSessionToEnvironment(selectedExecutionProfileId)"
                  >
                    写入当前环境
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

              <div class="toolkit-session-card__meta">
                <div
                  v-for="item in sessionCenterInfoChips"
                  :key="item.label"
                  class="toolkit-meta-chip"
                >
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>

              <div v-if="storedSessionRows.length" class="toolkit-session-overview">
                <div class="toolkit-session-overview__head">
                  <span>环境</span>
                  <span>店铺</span>
                  <span>状态</span>
                  <span>操作</span>
                </div>
                <div
                  v-for="row in storedSessionRows"
                  :key="row.profileId"
                  class="toolkit-session-overview__row"
                  :class="{ 'is-current': row.profileId === selectedExecutionProfileId }"
                >
                  <div class="toolkit-session-overview__cell toolkit-session-overview__cell--env">
                    <span class="toolkit-session-overview__primary">{{ row.profileLabel }}</span>
                    <el-tag
                      v-if="row.profileId === selectedExecutionProfileId"
                      size="small"
                      effect="plain"
                      type="success"
                    >
                      当前
                    </el-tag>
                  </div>
                  <div class="toolkit-session-overview__cell">
                    {{ row.mallName || row.mallId || "-" }}
                  </div>
                  <div class="toolkit-session-overview__cell">
                    <el-tag size="small" effect="plain" :type="row.sessionStatusTagType">
                      {{ row.sessionStatusLabel }}
                    </el-tag>
                  </div>
                  <div
                    class="toolkit-session-overview__cell toolkit-session-overview__cell--actions"
                  >
                    <el-button
                      text
                      size="small"
                      type="danger"
                      :loading="sessionActionState.delete === row.profileId"
                      @click="deleteStoredSession(row.profileId)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </div>

              <div v-if="selectedStoredMallRows.length" class="toolkit-userinfo-panel">
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

              <div class="toolkit-session-sections">
                <section class="toolkit-session-section">
                  <div class="toolkit-session-section__head">
                    <div class="toolkit-session-section__title">身份信息</div>
                    <div class="toolkit-session-section__meta">
                      {{ selectedStoredUserInfo.message }}
                    </div>
                  </div>
                  <pre class="toolkit-result-json">{{ jsonText(selectedStoredUserInfo) }}</pre>
                </section>

                <section class="toolkit-session-section">
                  <div class="toolkit-session-section__head">
                    <div class="toolkit-session-section__title">Cookie / Header</div>
                    <div class="toolkit-session-section__meta">当前环境各区域会话明细</div>
                  </div>

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
                </section>
              </div>
            </div>
          </section>
        </div>
      </el-dialog>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { WarningFilled } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { BrowserAutomationCommandResponse } from "@/api/external/browserAutomation";
import type { ToolkitToolItem } from "@/api/external/toolkit";
import { getToolkitTools, runToolkitTool } from "@/api/external/toolkit";
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
import { TOOLKIT_PLATFORM_REGISTRY, type ToolkitPlatformDefinition } from "./platformRegistry";
import {
  TEMU_PLATFORM_KEY,
  TEMU_SESSION_RESTORE_TOOL_KEY,
  TEMU_SESSION_TOOL_KEY,
} from "./temu/platform";
import {
  extractRequestErrorMessage,
  resolveTemuValidationLabel as resolveValidationLabel,
  resolveTemuValidationTagType as resolveValidationTagType,
  resolveTemuWorkspaceAvailability,
} from "./temu/temuWorkspace.helpers";

defineOptions({ name: "OperationToolkit" });

const TOOLKIT_DEFAULT_ROUTE = "/operation/toolkit/temu";

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

type ToolkitSessionStatusTagType = "success" | "warning" | "danger";

const {
  loading,
  refreshClients,
  clientOptions,
  profileOptions,
  selectedClientId,
  selectedClient,
  selectedClientName,
  selectedProfileValue,
  selectedProfile,
  effectiveProfileId,
  selectedEnvironmentLabel,
  activeProfile,
  setProfilesPayload,
  resetProfiles,
} = useBrowserAutomationExecutionContext();
const route = useRoute();
const router = useRouter();
const sessionCenterVisible = ref(false);
const storedPlatformSession = ref<Record<string, any>>({});
const storedSessionLoading = ref(false);
const storedSessionLoaded = ref(false);
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
  applyMall: "",
  saveCredential: "",
});
const autoValidatedTemuSessions = reactive<Record<string, string>>({});
const pending = reactive<Record<string, string>>({});
const pendingRunToolFeatureKeys = reactive<Record<string, string>>({});
const pendingTimeoutHandles = new Map<string, ReturnType<typeof setTimeout>>();
const TOOLKIT_RUN_TOOL_TIMEOUT_MS = 7 * 60_000;
const TOOLKIT_COMMAND_TIMEOUT_MS = 20_000;

const toolkitPlatforms = computed<ToolkitPlatformDefinition[]>(() => TOOLKIT_PLATFORM_REGISTRY);
const selectedPlatformKey = computed(() => String(route.meta?.toolkitPlatform || "").trim());

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
  () =>
    loadingMap.runTool &&
    runningToolkitFeatureKey.value === TEMU_SESSION_TOOL_KEY,
);
const temuWorkspaceRestoreLoading = computed(
  () => loadingMap.runTool && runningToolkitFeatureKey.value === TEMU_SESSION_RESTORE_TOOL_KEY,
);
const sessionAcquireActionDisabled = computed(
  () =>
    !selectedClientId.value ||
    !selectedExecutionProfileId.value ||
    (loadingMap.runTool && !sessionToolRunning.value),
);

const storedSessionRows = computed(() => {
  const profiles = asPlainObject(storedPlatformSession.value?.profiles);
  const currentProfileMap = new Map(
    (Array.isArray(profileOptions.value) ? profileOptions.value : [])
      .map((item) => [String(item?.value || "").trim(), item] as const)
      .filter(
        ([profileId]) => !!profileId && profileId !== ACTIVE_BROWSER_AUTOMATION_PROFILE_VALUE,
      ),
  );

  return Object.entries(profiles)
    .map(([profileId, value]) => {
      const record = asPlainObject(value);
      const validation = asPlainObject(record.validation);
      const currentProfile = currentProfileMap.get(String(profileId || "").trim()) || null;
      const profileExists = !!currentProfile;
      const validationStatus = String(validation.status || "")
        .trim()
        .toLowerCase();
      const sessionStatus = !profileExists
        ? "invalid_environment"
        : ["invalid", "failed", "expired"].includes(validationStatus)
          ? "invalid"
          : validationStatus === "incomplete"
            ? "incomplete"
          : "valid";

      return {
        profileId,
        profileLabel: currentProfile?.label || String(profileId || "").trim() || "未命名环境",
        mallId: String(record.mallId || "").trim(),
        mallName: String(record.mallName || "").trim(),
        updatedAt: String(record.updatedAt || "").trim(),
        validation,
        profileExists,
        sessionStatus,
        sessionStatusLabel:
          sessionStatus === "invalid_environment"
            ? "无效环境"
            : sessionStatus === "invalid"
              ? "失效"
              : sessionStatus === "incomplete"
                ? "不完整"
              : "正常",
        sessionStatusTagType: (
          sessionStatus === "invalid_environment"
            ? "warning"
            : sessionStatus === "invalid"
              ? "danger"
              : sessionStatus === "incomplete"
                ? "warning"
                : "success"
        ) as ToolkitSessionStatusTagType,
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
const invalidStoredSessionRows = computed(() =>
  storedSessionRows.value.filter((item) => item.sessionStatus === "invalid_environment"),
);

const sessionAcquireForm = reactive({
  account: "",
  password: "",
});
const sessionAcquireErrors = reactive<Record<string, string>>({
  account: "",
  password: "",
});
const sessionAcquireFieldDefinitions = computed(() => [
  {
    key: "account",
    label: "账号",
    type: "text",
    required: false,
    placeholder: "请输入 Temu 账号",
    description: "用于当前环境未登录时自动登录。",
  },
  {
    key: "password",
    label: "密码",
    type: "password",
    required: false,
    placeholder: "请输入 Temu 密码",
    description: "也可以不保存，改为先在浏览器环境中手动登录。",
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
const isTemuExecutionProfileLoading = computed(() => false);
const executionProfileSelectValue = computed({
  get: () => selectedProfileValue.value,
  set: (value: string) => {
    selectedProfileValue.value = String(value || "").trim();
  },
});
const visibleExecutionProfileOptions = computed(() => profileOptions.value);
const selectedClientRuntimeDetailsSignature = computed(() => {
  const details = asPlainObject(selectedClient.value?.runtime?.details);
  const profiles = Array.isArray(details.profiles) ? details.profiles : [];
  const instances = Array.isArray(details.instances) ? details.instances : [];
  return JSON.stringify({
    activeProfileId: String(details.activeProfileId || "").trim(),
    profileIds: profiles.map((item: any) => String(item?.id || "").trim()).filter(Boolean),
    instanceIds: instances.map((item: any) => String(item?.profileId || "").trim()).filter(Boolean),
  });
});
const selectedExecutionProfileId = computed(
  () => effectiveProfileId.value || selectedProfile.value?.id || activeProfile.value?.id || "",
);
const selectedExecutionProfileDisplayText = computed(
  () => selectedExecutionProfileId.value || "未选择",
);
const selectedExecutionEnvironmentText = computed(() =>
  selectedExecutionProfileId.value ? selectedEnvironmentLabel.value : "未选择",
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
const temuWorkspaceRefreshInfoLoading = computed(
  () =>
    !!selectedExecutionProfileId.value &&
    sessionActionState.refreshInfo === selectedExecutionProfileId.value,
);
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
const temuWorkspaceLocked = computed(() => {
  if (selectedPlatformKey.value !== TEMU_PLATFORM_KEY) {
    return false;
  }

  if (!selectedClientId.value || !selectedExecutionProfileId.value) {
    return true;
  }

  if (!storedSessionLoaded.value) {
    return false;
  }

  return !temuWorkspaceAvailability.value.canUse;
});
const temuWorkspaceLockText = computed(() => {
  if (!selectedClientId.value) {
    return "请先选择在线客户端。";
  }

  if (!selectedExecutionProfileId.value) {
    return "请先选择执行环境。";
  }

  return temuWorkspaceAvailability.value.detail || "当前环境会话暂不可用，请先处理会话状态。";
});
const selectedStoredSession = computed(() => temuWorkspaceSessionRecord.value);
const resolveTemuStoredCredentialValue = (
  record: Record<string, any> | null | undefined,
  key: "account" | "password",
  profileId?: string,
) => {
  const normalizedRecord = asPlainObject(record);
  const session = asPlainObject(normalizedRecord?.session);
  const normalizedProfileId = String(profileId || "").trim();
  const platformCredentialRecord =
    normalizedProfileId && selectedPlatformKey.value === TEMU_PLATFORM_KEY
      ? asPlainObject(asPlainObject(storedPlatformSession.value?.credentials)?.[normalizedProfileId])
      : {};
  return String(
    session?.[key] || normalizedRecord?.[key] || platformCredentialRecord?.[key] || "",
  ).trim();
};
const syncTemuSessionAcquireCredentialsFromStoredSession = (profileId?: string) => {
  // 优先回显当前环境最近一次保存的凭证，减少重复输入。
  if (selectedPlatformKey.value !== TEMU_PLATFORM_KEY) {
    return;
  }

  const normalizedProfileId = String(profileId || selectedExecutionProfileId.value || "").trim();
  if (!normalizedProfileId) {
    sessionAcquireForm.account = "";
    sessionAcquireForm.password = "";
    return;
  }

  const record = asPlainObject(
    storedSessionRows.value.find((item) => item.profileId === normalizedProfileId)?.record || null,
  );
  sessionAcquireForm.account = resolveTemuStoredCredentialValue(
    record,
    "account",
    normalizedProfileId,
  );
  sessionAcquireForm.password = resolveTemuStoredCredentialValue(
    record,
    "password",
    normalizedProfileId,
  );
};
const currentEnvironmentValidation = computed(() =>
  asPlainObject(selectedExecutionStoredSession.value?.validation),
);
const currentEnvironmentValidationCheckedAtText = computed(() => {
  if (temuWorkspaceValidationLoading.value) {
    return "校验中";
  }

  return formatDateTime(currentEnvironmentValidation.value?.checkedAt) || "未校验";
});

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
const currentEnvironmentCookieSummary = computed(() => {
  const counts = selectedExecutionStoredSession.value?.cookieCounts;
  if (!counts) {
    return "-";
  }

  return `全球 ${counts.global} / 美区 ${counts.us} / 欧区 ${counts.eu}`;
});
const sessionCenterInfoChips = computed(() => [
  {
    label: "账号",
    value:
      selectedStoredAccountText.value && selectedStoredAccountText.value !== "-"
        ? selectedStoredAccountText.value
        : "待同步",
  },
  {
    label: "店铺",
    value: selectedStoredUserInfo.value.mallName || selectedStoredUserInfo.value.mallId || "未绑定",
  },
  {
    label: "Cookie",
    value: currentEnvironmentCookieSummary.value,
  },
  {
    label: "身份",
    value: temuWorkspaceAvailability.value.userInfoLabel,
  },
  {
    label: "校验",
    value: resolveValidationLabel(currentEnvironmentValidation.value),
  },
  {
    label: "上次校验",
    value: currentEnvironmentValidationCheckedAtText.value,
  },
  {
    label: "更新时间",
    value: formatDateTime(selectedStoredSession.value?.updatedAt) || "-",
  },
]);
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

const clearPendingTimeout = (commandId?: string) => {
  const normalizedCommandId = String(commandId || "").trim();
  if (!normalizedCommandId) {
    return;
  }

  const timer = pendingTimeoutHandles.get(normalizedCommandId);
  if (timer) {
    clearTimeout(timer);
    pendingTimeoutHandles.delete(normalizedCommandId);
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
    const timeoutMs =
      action === "runTool" ? TOOLKIT_RUN_TOOL_TIMEOUT_MS : TOOLKIT_COMMAND_TIMEOUT_MS;
    const timeoutLabel =
      action === "profiles"
        ? "环境列表"
        : action === "tools"
          ? "工具目录"
          : String(options.featureKey || "工具").trim() || "工具";
    const timeoutMessage =
      action === "runTool"
        ? `${timeoutLabel} 执行超时，请检查客户端日志或浏览器自动化服务状态`
        : `${timeoutLabel} 加载超时，请检查客户端在线状态或浏览器自动化服务状态`;
    const timer = setTimeout(() => {
      if (!pending[commandId]) {
        clearPendingTimeout(commandId);
        return;
      }

      delete pending[commandId];
      delete pendingRunToolFeatureKeys[commandId];
      clearPendingTimeout(commandId);
      finish(action);
      ElMessage.error(timeoutMessage);
    }, timeoutMs);
    pendingTimeoutHandles.set(commandId, timer);
    if (sentMessage) {
      ElMessage.success(sentMessage);
    }
  } catch (error: any) {
    finish(action);
    ElMessage.error(error?.message || "命令发送失败");
  }
};

const sendTools = async () =>
  selectedClientId.value && dispatchCommand("tools", () => getToolkitTools(selectedClientId.value));

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

const buildTemuStoredSessionPayload = (
  sessionBundle: Record<string, any>,
  profileId: string,
  credentials?: {
    account?: string;
    password?: string;
  },
) => {
  // Admin 端回写结构与发布端实时回写保持一致，避免两边对同一份 Temu session 读出不同结果。
  const collectedAt = String(sessionBundle?.collectedAt || new Date().toISOString()).trim();
  const regionHeaders = asPlainObject(sessionBundle?.regionHeaders);
  const currentPlatform = asPlainObject(storedPlatformSession.value);
  const currentProfile = asPlainObject(currentPlatform?.profiles?.[profileId]);
  const currentSession = asPlainObject(currentProfile?.session);
  const currentUserInfo = asPlainObject(currentProfile?.userInfo);
  const storedAccount = String(
    credentials?.account ?? currentSession?.account ?? currentProfile?.account ?? "",
  ).trim();
  const storedPassword = String(
    credentials?.password ?? currentSession?.password ?? currentProfile?.password ?? "",
  ).trim();
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
        account: storedAccount,
        password: storedPassword,
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
          message: "会话已完成全量采集，建议重新校验",
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

const persistTemuSessionBundle = async (
  sessionBundle: Record<string, any>,
  profileId: string,
  credentials?: {
    account?: string;
    password?: string;
  },
) => {
  await updatePlatformSessions({
    platform: TEMU_PLATFORM_KEY,
    data: buildTemuStoredSessionPayload(sessionBundle, profileId, credentials),
  });
  await refreshStoredPlatformSessions();
};

const saveTemuCredentials = async (profileId?: string | Event | null) => {
  const normalizedProfileId =
    typeof profileId === "string"
      ? profileId.trim()
      : String(selectedExecutionProfileId.value || "").trim();
  if (!normalizedProfileId) {
    ElMessage.warning("请先选择执行环境");
    return;
  }

  const account = String(sessionAcquireForm.account || "").trim();
  const password = String(sessionAcquireForm.password || "").trim();
  let valid = true;

  if (!account) {
    sessionAcquireErrors.account = "请填写账号";
    valid = false;
  }

  if (!password) {
    sessionAcquireErrors.password = "请填写密码";
    valid = false;
  }

  if (!valid) {
    return;
  }

  const currentRecord = asPlainObject(
    storedSessionRows.value.find((item) => item.profileId === normalizedProfileId)?.record || null,
  );
  const currentValidation = asPlainObject(currentRecord?.validation);
  const savedAt = new Date().toISOString();

  sessionActionState.saveCredential = normalizedProfileId;
  try {
    await updatePlatformSessions({
      platform: TEMU_PLATFORM_KEY,
      profileId: normalizedProfileId,
      data: {
        account,
        password,
        updatedAt: savedAt,
        validation: Object.keys(currentValidation).length
          ? currentValidation
          : {
              status: "draft",
              message: "账号密码已保存，等待采集会话",
              checkedAt: "",
            },
      },
    });
    await refreshStoredPlatformSessions();
    ElMessage.success("账号密码已保存");
  } catch (error: any) {
    ElMessage.error(error?.message || "保存账号密码失败");
  } finally {
    sessionActionState.saveCredential = "";
  }
};

const dispatchTemuSessionAcquire = async (
  profileId: string,
  options?: {
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

  const account = String(options?.account || "").trim();
  const password = String(options?.password || "").trim();

  await dispatchCommand(
    "runTool",
    () =>
      runToolkitTool(selectedClientId.value, {
        featureKey: TEMU_SESSION_TOOL_KEY,
        profileId,
        collectRegionCookies: options?.collectRegionCookies !== false,
        keepPageOpen: options?.keepPageOpen !== false,
        ...(account ? { account } : {}),
        ...(password ? { password } : {}),
      }),
    sentMessage,
    {
      featureKey: TEMU_SESSION_TOOL_KEY,
    },
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
      account: sessionAcquireForm.account,
      password: sessionAcquireForm.password,
      collectRegionCookies: true,
      keepPageOpen: true,
    },
    "Temu 会话采集命令已发送",
  );
};

const restoreStoredSessionToEnvironment = async (profileId?: string) => {
  if (!selectedClientId.value) {
    ElMessage.warning("请先选择在线客户端");
    return;
  }

  const normalizedProfileId = String(profileId || selectedExecutionProfileId.value || "").trim();
  if (!normalizedProfileId) {
    ElMessage.warning("请先选择执行环境");
    return;
  }

  const storedRecord =
    storedSessionRows.value.find((item) => item.profileId === normalizedProfileId)?.record || null;
  const session = asPlainObject(storedRecord?.session);

  if (!Object.keys(session).length) {
    ElMessage.warning("当前环境没有可恢复的已存储 Temu 会话");
    return;
  }

  await dispatchCommand(
    "runTool",
    () =>
      runToolkitTool(selectedClientId.value, {
        featureKey: TEMU_SESSION_RESTORE_TOOL_KEY,
        profileId: normalizedProfileId,
        session,
        keepPageOpen: false,
        validateAfterRestore: false,
        activatePage: false,
      }),
    "Temu 存储会话写入当前环境命令已发送",
    {
      featureKey: TEMU_SESSION_RESTORE_TOOL_KEY,
    },
  );
};

const runWorkspaceTool = async (payload: { featureKey: string; payload: Record<string, any> }) => {
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
    storedSessionLoaded.value = false;
    sessionAcquireForm.account = "";
    sessionAcquireForm.password = "";
    return;
  }

  storedSessionLoading.value = true;
  try {
    const response = await getPlatformSessions({ platform: TEMU_PLATFORM_KEY });
    storedPlatformSession.value = asPlainObject(response);
    storedSessionLoaded.value = true;
    syncTemuSessionAcquireCredentialsFromStoredSession();
  } catch (error: any) {
    ElMessage.error(error?.message || "获取已存储会话失败");
  } finally {
    storedSessionLoading.value = false;
  }
};

const openSessionCenter = () => {
  sessionCenterVisible.value = true;

  if (selectedPlatformSupportsStoredSessions.value) {
    void refreshStoredPlatformSessions();
  }
};

const refreshStoredSessionUserInfo = async (profileId?: string) => {
  const normalizedProfileId = String(profileId || selectedExecutionProfileId.value || "").trim();
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
  const normalizedProfileId = String(profileId || selectedExecutionProfileId.value || "").trim();
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
  const normalizedProfileId = String(profileId || selectedExecutionProfileId.value || "").trim();
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
  const normalizedProfileId = String(profileId || selectedExecutionProfileId.value || "").trim();
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
    const result = await deletePlatformSession({
      platform: TEMU_PLATFORM_KEY,
      profileId: normalizedProfileId,
    });
    await refreshStoredPlatformSessions();
    ElMessage.success(
      result?.credentialsPreserved ? "会话已删除，账号密码已保留" : "会话已删除",
    );
  } catch (error: any) {
    ElMessage.error(error?.message || "删除会话失败");
  } finally {
    sessionActionState.delete = "";
  }
};

const deleteInvalidStoredSessions = async () => {
  const rows = invalidStoredSessionRows.value;
  if (!rows.length) {
    ElMessage.warning("当前没有可清理的无效环境会话");
    return;
  }

  try {
    await ElMessageBox.confirm(`确认清理 ${rows.length} 条无效环境会话吗？`, "清理无效环境", {
      type: "warning",
    });
  } catch {
    return;
  }

  sessionActionState.delete = "__invalid__";
  try {
    for (const row of rows) {
      await deletePlatformSession({
        platform: selectedPlatformKey.value,
        profileId: row.profileId,
      });
    }

    ElMessage.success(`已清理 ${rows.length} 条无效环境会话`);
    await refreshStoredPlatformSessions();
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "清理无效环境会话失败"));
  } finally {
    sessionActionState.delete = "";
  }
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

  clearPendingTimeout(event.commandId);
  delete pending[event.commandId];
  delete pendingRunToolFeatureKeys[event.commandId];
  finish(action);

  const data = event.data;
  const dataObject = asPlainObject(data);
  if (event.clientId === selectedClientId.value) {
    if (action === "tools") {
      toolkitTools.value = event.success ? extractToolkitToolItems(data) : [];
    }

    if (action === "runTool") {
      const result = asPlainObject(extractToolkitToolResultPayload(data));
      const featureKey = String(
        dataObject?.featureKey || result?.featureKey || pendingFeatureKey,
      ).trim();
      let handledRunToolFeedback = false;

      if (featureKey) {
        toolkitToolResults[featureKey] = buildToolkitToolExecutionRecord(event, featureKey);
      }

      if (
        event.success &&
        featureKey === TEMU_SESSION_TOOL_KEY
      ) {
        const sessionBundle = asPlainObject(result?.sessionBundle);
        const profileId = resolveCollectedProfileId(result);
        if (sessionBundle && profileId) {
          try {
            await persistTemuSessionBundle(
              sessionBundle,
              profileId,
              sessionAcquireForm.account || sessionAcquireForm.password
                ? {
                    account: sessionAcquireForm.account,
                    password: sessionAcquireForm.password,
                  }
                : undefined,
            );
            const validation = await validatePlatformSession({
              platform: TEMU_PLATFORM_KEY,
              profileId,
            });
            await refreshStoredPlatformSessions();
            handledRunToolFeedback = true;
            ElMessage[validation?.success ? "success" : "warning"](
              validation?.success
                ? "Temu 会话已采集保存，并校验通过"
                : validation?.message || "Temu 会话已采集保存，但校验未通过，请稍后重试或手动校验身份",
            );
          } catch (error: any) {
            handledRunToolFeedback = true;
            ElMessage.warning(`会话获取成功，但自动存储失败：${error?.message || "未知错误"}`);
          }
        } else {
          handledRunToolFeedback = true;
          ElMessage.warning("Temu 会话采集命令已完成，但没有返回可保存的会话数据，请查看客户端日志");
        }
      }

      if (handledRunToolFeedback) {
        return;
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
  const normalizedKey = String(platformKey || "").trim();
  const targetRoute =
    toolkitPlatforms.value.find((item) => item.key === normalizedKey)?.routePath ||
    TOOLKIT_DEFAULT_ROUTE;
  if (route.path !== targetRoute) {
    void router.push(targetRoute);
  }
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
    selectedProfileValue.value = "";
    toolkitTools.value = [];
    resetToolkitToolResults();
    runningToolkitFeatureKey.value = "";

    if (!value) {
      return;
    }

    void sendTools();
  },
  { immediate: false },
);

watch(
  selectedClientRuntimeDetailsSignature,
  () => {
    setProfilesPayload(asPlainObject(selectedClient.value?.runtime?.details));
  },
  { immediate: true },
);

watch(
  [selectedClientId, visibleExecutionProfileOptions],
  ([clientId, options]) => {
    if (!String(clientId || "").trim()) {
      return;
    }

    if (String(selectedProfileValue.value || "").trim()) {
      return;
    }

    const activeOption = (Array.isArray(options) ? options : []).find(
      (item) => item.isActiveOption,
    );
    if (!activeOption) {
      return;
    }

    selectedProfileValue.value = String(activeOption.value || "").trim();
  },
  { immediate: true },
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
    if (value && !selectedPlatform.value) {
      void router.replace(TOOLKIT_DEFAULT_ROUTE);
      return;
    }

    if (!value) {
      sessionCenterVisible.value = false;
    }

    void refreshStoredPlatformSessions();
  },
  { immediate: true },
);

watch(
  selectedExecutionProfileId,
  () => {
    resetToolkitToolResults();
    syncTemuSessionAcquireCredentialsFromStoredSession();
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
  void loadClients();
  if (selectedClientId.value) {
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
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.toolkit-platform-hub__title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.toolkit-page-head__desc,
.toolkit-platform-hub__desc {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.toolkit-platform-hub {
  display: flex;
  padding: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
  box-shadow: var(--el-box-shadow-light);
  flex-direction: column;
  gap: 10px;
}

.toolkit-platform-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.toolkit-platform-card {
  display: flex;
  width: 190px;
  min-height: 96px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease,
    background-color 0.2s ease;
  flex-direction: column;
  gap: 6px;
  flex: 0 0 190px;
}

.toolkit-platform-card:hover {
  border-color: var(--el-color-primary-light-7);
  transform: translateY(-1px);
  box-shadow: var(--el-box-shadow-light);
}

.toolkit-platform-card__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.toolkit-platform-card__meta {
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.toolkit-platform-card__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: auto;
}

.toolkit-platform-card__enter {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.toolkit-hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toolkit-workspace-shell {
  position: relative;
  min-width: 0;
}

.toolkit-workspace-shell.is-locked .toolkit-workspace-shell__body {
  pointer-events: none;
  filter: saturate(0.72);
  user-select: none;
}

.toolkit-workspace-shell__body {
  min-width: 0;
}

.toolkit-workspace-shell__mask {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: color-mix(in srgb, var(--el-bg-color) 72%, transparent);
  backdrop-filter: blur(2px);
}

.toolkit-workspace-shell__mask-card {
  display: flex;
  max-width: 420px;
  padding: 16px 18px;
  text-align: center;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 14px;
  box-shadow: var(--el-box-shadow-light);
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.toolkit-workspace-shell__mask-title {
  display: inline-flex;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  text-align: center;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.toolkit-workspace-shell__mask-icon {
  font-size: 16px;
  color: var(--el-color-warning);
}

.toolkit-workspace-shell__mask-desc {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.toolkit-hero__card {
  padding: 10px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 18px;
  box-shadow: var(--el-box-shadow-light);
}

.toolkit-hero__card--selectors {
  padding-top: 12px;
  padding-bottom: 12px;
}

.toolkit-hero__label {
  display: flex;
  padding-right: 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  text-wrap: nowrap;
  align-items: center;
}

.toolkit-hero__card--context {
  padding-top: 12px;
  padding-bottom: 12px;
}

.toolkit-hero__context-shell {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}

.toolkit-hero__context-control {
  display: flex;
  max-width: 460px;
  min-width: 0;
  flex: 0 1 420px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolkit-hero__control-group {
  flex: 1 1 180px;
  min-width: 0;
}

.toolkit-hero__control-group .toolkit-hero__label {
  padding-right: 0;
  margin-bottom: 6px;
}

.toolkit-hero__select {
  width: 100%;
}

.toolkit-hero__context-panel {
  flex: 1 1 420px;
  display: flex;
  align-items: center;
  min-width: 0;
}

.toolkit-hero__context {
  width: 100%;
  min-width: 0;
}

.toolkit-option {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.toolkit-option__text,
.toolkit-option__separator {
  display: inline-flex;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  color: var(--el-text-color-primary);
  align-items: center;
}

.toolkit-option__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.toolkit-center__summary-item strong {
  display: inline;
  margin-top: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.toolkit-panel {
  padding: 0;
  background: transparent;
  border: 0;
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
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.toolkit-panel__desc,
.toolkit-session-card__desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.toolkit-panel__actions {
  display: flex;
  gap: 8px;
}

.toolkit-form-panel {
  padding: 0 0 8px;
  margin-top: 8px;
  background: transparent;
  border: 0;
  border-radius: 0;
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
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.toolkit-form-panel__desc {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
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
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  justify-content: flex-end;
  gap: 8px;
}

.toolkit-form :deep(.small-feature-field) {
  min-height: 100%;
  padding: 9px 10px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  gap: 6px;
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
  font-size: 11px;
  line-height: 1.45;
  white-space: normal;
}

.toolkit-session-card,
.toolkit-userinfo-panel {
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.toolkit-session-overview {
  margin-top: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.toolkit-session-overview__head,
.toolkit-session-overview__row {
  display: grid;
  grid-template-columns: minmax(220px, 1.4fr) minmax(160px, 1fr) 140px 88px;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
}

.toolkit-session-overview__head {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}

.toolkit-session-overview__row {
  border-top: 1px solid var(--el-border-color-lighter);
}

.toolkit-session-overview__row.is-current {
  background: color-mix(in srgb, var(--el-color-success) 6%, var(--el-bg-color));
}

.toolkit-session-overview__cell {
  display: flex;
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-primary);
  align-items: center;
  gap: 6px;
}

.toolkit-session-overview__cell--env {
  gap: 8px;
  flex-wrap: wrap;
}

.toolkit-session-overview__cell--actions {
  justify-content: flex-end;
}

.toolkit-session-overview__primary {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.toolkit-session-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolkit-session-card__tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.toolkit-session-region__time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.toolkit-session-region__json-box {
  padding: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.toolkit-result-json,
.toolkit-session-region__json-box pre {
  max-height: 280px;
  padding: 12px;
  margin: 0;
  overflow: auto;
  font-family:
    SFMono-Regular, "JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
  line-height: 1.65;
  color: var(--el-text-color-primary);
  word-break: break-word;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.toolkit-result-json {
  margin-top: 10px;
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
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.toolkit-userinfo-panel__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
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
  padding: 10px 12px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toolkit-mall-item.is-current {
  background: var(--el-color-success-light-9);
  border-color: var(--el-color-success-light-5);
}

.toolkit-mall-item__main {
  min-width: 0;
}

.toolkit-mall-item__name {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.toolkit-mall-item__meta {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.toolkit-mall-item__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.toolkit-meta-chip {
  padding: 10px 12px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.toolkit-meta-chip span {
  display: block;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.toolkit-meta-chip strong {
  display: block;
  margin-top: 2px;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.toolkit-session-sections {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 4px;
}

.toolkit-session-section {
  padding-top: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.toolkit-session-section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.toolkit-session-section__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.toolkit-session-section__meta {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.toolkit-session-dialog__regions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolkit-session-region {
  padding: 14px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
}

.toolkit-session-region__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.toolkit-session-region__meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.toolkit-session-region__json-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.toolkit-session-region__json-title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

:deep(.toolkit-center-dialog .el-dialog__header) {
  padding: 18px 20px 10px;
}

:deep(.toolkit-center-dialog .el-dialog__body) {
  padding: 4px 20px 20px;
}

@media (width <= 1180px) {
  .toolkit-form--acquire,
  .toolkit-session-region__json-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .toolkit-session-card__meta {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (width <= 760px) {
  .toolkit-page-head,
  .toolkit-platform-hub__head,
  .toolkit-panel__head,
  .toolkit-form-panel__head,
  .toolkit-session-card__head,
  .toolkit-session-region__head,
  .toolkit-session-section__head {
    flex-direction: column;
  }

  .toolkit-hero {
    gap: 8px;
  }

  .toolkit-hero__card {
    padding: 12px;
  }

  .toolkit-hero__context-shell {
    flex-direction: column;
    align-items: stretch;
  }

  .toolkit-hero__context-control {
    flex-basis: auto;
    max-width: none;
  }

  .toolkit-platform-grid {
    width: 100%;
  }

  .toolkit-platform-card {
    flex-basis: 100%;
    width: 100%;
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

  .toolkit-session-overview__head {
    display: none;
  }

  .toolkit-session-overview__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }

  .toolkit-session-overview__cell--actions {
    justify-content: flex-start;
  }
}
</style>
