<template>
  <div class="amazon-page">
    <!-- 顶部操作栏 -->
    <div class="amazon-header">
      <div class="amazon-header__left">
        <h2 class="amazon-header__title">卖家精灵 · 亚马逊关键词分析</h2>
        <p class="amazon-header__desc">批量获取商品关键词反查数据，导出 Excel 表格</p>
      </div>
      <div class="amazon-header__actions">
        <!-- 账号状态显示 -->
        <div class="account-badge" v-if="accountInfo.email" v-loading="accountLoading">
          <el-avatar :size="24" class="account-badge__avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <span class="account-badge__name">{{ accountInfo.nickname || accountInfo.email }}</span>
          <el-tag
            :type="accountInfo.sessionValid ? 'success' : 'danger'"
            size="small"
            effect="plain"
          >
            {{ accountInfo.sessionValid ? "已登录" : "已失效" }}
          </el-tag>
        </div>
        <div class="account-badge account-badge--empty" v-else v-loading="accountLoading">
          <el-icon><User /></el-icon>
          <span>未配置账号</span>
        </div>

        <el-button type="primary" @click="showSubmitDialog = true">
          <el-icon><Download /></el-icon>
          提交任务
        </el-button>
        <el-button
          v-if="accountInfo.email && !accountInfo.sessionValid"
          :loading="autoLoggingIn"
          @click="tryAutoLogin(true)"
        >
          <el-icon><Refresh /></el-icon>
          重新登录
        </el-button>
        <el-button @click="showAccountDialog = true">
          <el-icon><Setting /></el-icon>
          {{ accountInfo.email ? "切换账号" : "配置账号" }}
        </el-button>
      </div>
    </div>

    <!-- 使用流程 -->
    <el-alert
      title="使用流程"
      type="info"
      :closable="false"
      show-icon
      class="amazon-guide"
    >
      <template #default>
        <div class="amazon-guide__steps">
          <span class="amazon-guide__step">
            <span class="amazon-guide__num">1</span>
            配置卖家精灵账号
          </span>
          <span class="amazon-guide__arrow">→</span>
          <span class="amazon-guide__step">
            <span class="amazon-guide__num">2</span>
            提交 ASIN 任务
          </span>
          <span class="amazon-guide__arrow">→</span>
          <span class="amazon-guide__step">
            <span class="amazon-guide__num">3</span>
            等待爬取完成
          </span>
          <span class="amazon-guide__arrow">→</span>
          <span class="amazon-guide__step">
            <span class="amazon-guide__num">4</span>
            合并导出 Excel
          </span>
        </div>
      </template>
    </el-alert>

    <!-- 状态概览 -->
    <div class="amazon-stats">
      <div class="amazon-stat" v-for="stat in stats" :key="stat.label">
        <div class="amazon-stat__icon" :class="`amazon-stat__icon--${stat.tone}`">
          <el-icon><component :is="stat.icon" /></el-icon>
        </div>
        <div class="amazon-stat__body">
          <div class="amazon-stat__label">{{ stat.label }}</div>
          <div class="amazon-stat__value">{{ stat.value }}</div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="amazon-toolbar">
      <el-select
        v-model="filterStatus"
        placeholder="状态筛选"
        clearable
        @change="handleFilter"
        style="width: 140px"
      >
        <el-option label="待执行" value="pending" />
        <el-option label="执行中" value="running" />
        <el-option label="已完成" value="completed" />
        <el-option label="失败" value="failed" />
        <el-option label="已停止" value="stopped" />
      </el-select>

      <div class="amazon-toolbar__spacer" />

      <el-button
        type="success"
        :disabled="selectedTasks.length === 0"
        @click="handleExecute"
      >
        执行选中 ({{ selectedTasks.length }})
      </el-button>
      <el-button
        type="warning"
        :disabled="selectedTasks.length === 0"
        @click="handleMergeExport"
      >
        合并导出 ({{ selectedTasks.length }})
      </el-button>
    </div>

    <!-- 任务表格 -->
    <el-table
      :data="tasks"
      v-loading="loading"
      @selection-change="handleSelectionChange"
      stripe
      border
      class="amazon-table"
    >
      <el-table-column type="selection" width="48" />
      <el-table-column prop="asin" label="ASIN" width="140" show-overflow-tooltip />
      <el-table-column prop="crawlDate" label="爬取日期" width="110" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small" effect="light">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Excel" width="80">
        <template #default="{ row }">
          <el-link
            v-if="row.excelUrl"
            :href="row.excelUrl"
            target="_blank"
            type="primary"
          >
            下载
          </el-link>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="errorMsg" label="错误信息" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.errorMsg" class="text-error">{{ row.errorMsg }}</span>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="canStop(row.status)"
            type="danger"
            size="small"
            link
            @click="handleStop(row.id)"
          >
            停止
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="amazon-pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="limit"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadTasks"
        @size-change="loadTasks"
      />
    </div>

    <!-- 提交任务对话框 -->
    <el-dialog v-model="showSubmitDialog" title="提交任务" width="520px" destroy-on-close>
      <el-form :model="submitForm" label-width="80px">
        <el-form-item label="ASIN" required>
          <el-input
            v-model="submitForm.asinsText"
            type="textarea"
            :rows="8"
            placeholder="每行一个 ASIN，例如：&#10;B08N5WRWNW&#10;B09JQMJQXY"
          />
          <div class="asin-count">共 {{ asinCount }} 个 ASIN</div>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="submitForm.crawlDate"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="强制爬取">
          <el-switch v-model="submitForm.forceCrawl" />
          <span class="form-hint">开启后忽略缓存重新爬取</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSubmitDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
          :disabled="asinCount === 0"
        >
          提交 {{ asinCount }} 个任务
        </el-button>
      </template>
    </el-dialog>

    <!-- 账号管理对话框 -->
    <el-dialog v-model="showAccountDialog" :title="accountInfo.email ? '切换账号' : '配置账号'" width="420px" destroy-on-close>
      <!-- 当前账号信息 -->
      <div v-if="accountInfo.email" class="current-account-info">
        <div class="current-account-info__row">
          <span class="label">当前账号</span>
          <span>{{ accountInfo.nickname || accountInfo.email }}</span>
        </div>
        <div class="current-account-info__row">
          <span class="label">状态</span>
          <el-tag :type="accountInfo.sessionValid ? 'success' : 'danger'" size="small">
            {{ accountInfo.sessionValid ? "已登录" : "已失效" }}
          </el-tag>
        </div>
        <div v-if="accountInfo.lastLoginAt" class="current-account-info__row">
          <span class="label">上次登录</span>
          <span>{{ accountInfo.lastLoginAt }}</span>
        </div>
      </div>

      <el-divider content-position="left">
        {{ accountInfo.email ? "更新或切换" : "登录信息" }}
      </el-divider>

      <el-form :model="accountForm" label-width="80px">
        <el-form-item label="邮箱/手机" required>
          <el-input v-model="accountForm.email" placeholder="卖家精灵登录邮箱或手机号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="accountForm.password" type="password" show-password placeholder="留空则使用已保存密码" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAccountDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleSaveAndLogin"
          :loading="savingAccount"
          :disabled="!accountForm.email"
        >
          保存并登录
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Download,
  Setting,
  Clock,
  Loading,
  Select,
  Close,
  User,
  Refresh,
} from "@element-plus/icons-vue";
import {
  createTasks,
  getTasks,
  stopTask,
  executeTasks,
  mergeExport,
  updateAccount,
  getAccount,
  loginAccount,
  type AmazonCrawlerTask,
} from "@/api/amazonCrawler";
import { websocketClient } from "@/services/websocketClient";

defineOptions({ name: "AmazonCrawlerIndex" });

// ─── 任务列表 ───────────────────────────────────────────────
const tasks = ref<AmazonCrawlerTask[]>([]);
const loading = ref(false);
const page = ref(1);
const limit = ref(20);
const total = ref(0);
const filterStatus = ref("");
const selectedTasks = ref<AmazonCrawlerTask[]>([]);

// ─── 状态统计 ───────────────────────────────────────────────
const statusCount = ref({ pending: 0, running: 0, completed: 0, failed: 0, stopped: 0 });

const stats = computed(() => [
  { label: "待执行", value: statusCount.value.pending, tone: "pending", icon: Clock },
  { label: "执行中", value: statusCount.value.running, tone: "running", icon: Loading },
  { label: "已完成", value: statusCount.value.completed, tone: "completed", icon: Select },
  { label: "失败 / 停止", value: statusCount.value.failed + statusCount.value.stopped, tone: "failed", icon: Close },
]);

// ─── 提交任务 ───────────────────────────────────────────────
const showSubmitDialog = ref(false);
const submitting = ref(false);
const submitForm = ref({
  asinsText: "",
  crawlDate: new Date().toISOString().split("T")[0],
  forceCrawl: false,
});

const asinCount = computed(() =>
  submitForm.value.asinsText.split("\n").map((s) => s.trim()).filter(Boolean).length,
);

// ─── 账号状态 ───────────────────────────────────────────────
const showAccountDialog = ref(false);
const accountLoading = ref(false);
const savingAccount = ref(false);
const autoLoggingIn = ref(false);
const accountInfo = reactive({
  email: "",
  nickname: "",
  lastLoginAt: "",
  sessionValid: false,
});
const accountForm = ref({ email: "", password: "" });

type AmazonAccountInfo = {
  email?: string;
  nickname?: string;
  lastLoginAt?: string | Date | null;
  sessionValid?: boolean;
};

const unwrapResponseData = <T,>(response: any): T | undefined => {
  return response?.data?.data ?? response?.data ?? response;
};

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("zh-CN", { hour12: false });
};

const resetAccountInfo = () => {
  Object.assign(accountInfo, {
    email: "",
    nickname: "",
    lastLoginAt: "",
    sessionValid: false,
  });
};

// ─── 账号加载 ───────────────────────────────────────────────
const loadAccount = async () => {
  accountLoading.value = true;
  try {
    const res = await getAccount();
    const info = unwrapResponseData<AmazonAccountInfo | null>(res);

    if (!info) {
      resetAccountInfo();
      return;
    }

    Object.assign(accountInfo, {
      email: info.email || "",
      nickname: info.nickname || "",
      lastLoginAt: formatDateTime(info.lastLoginAt),
      sessionValid: !!info.sessionValid,
    });

    if (info.email) {
      accountForm.value = { ...accountForm.value, email: info.email };
    }
  } catch (err) {
    console.error("[loadAccount] error:", err);
  } finally {
    accountLoading.value = false;
  }
};

// ─── 状态工具 ───────────────────────────────────────────────
const statusTagType = (status: string) => {
  const map: Record<string, "success" | "danger" | "primary" | "warning" | "info"> = {
    pending: "info",
    running: "warning",
    completed: "success",
    failed: "danger",
    stopped: "info",
  };
  return map[status] || "info";
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: "待执行",
    running: "执行中",
    completed: "已完成",
    failed: "失败",
    stopped: "已停止",
  };
  return map[status] || status;
};

const canStop = (status: string) => status === "running" || status === "pending";

const updateStatusCount = () => {
  const counts = { pending: 0, running: 0, completed: 0, failed: 0, stopped: 0 };
  for (const task of tasks.value) {
    if (task.status in counts) {
      counts[task.status] += 1;
    }
  }
  statusCount.value = counts;
};

// ─── 数据加载 ───────────────────────────────────────────────
const loadTasks = async () => {
  loading.value = true;
  try {
    const res = await getTasks({
      status: filterStatus.value || undefined,
      page: page.value,
      limit: limit.value,
    });
    const payload = unwrapResponseData<{ data?: AmazonCrawlerTask[]; list?: AmazonCrawlerTask[]; total?: number }>(res);
    tasks.value = payload?.data || payload?.list || [];
    total.value = payload?.total || 0;
    updateStatusCount();
  } finally {
    loading.value = false;
  }
};

const handleFilter = () => {
  page.value = 1;
  loadTasks();
};

// ─── 操作 ───────────────────────────────────────────────────
const handleSelectionChange = (selection: AmazonCrawlerTask[]) => {
  selectedTasks.value = selection;
};

const handleSubmit = async () => {
  const asins = submitForm.value.asinsText.split("\n").map((s) => s.trim()).filter(Boolean);
  if (asins.length === 0) {
    ElMessage.warning("请输入至少一个 ASIN");
    return;
  }

  submitting.value = true;
  try {
    await createTasks({
      asins,
      crawlDate: submitForm.value.crawlDate,
      forceCrawl: submitForm.value.forceCrawl,
    });
    ElMessage.success(`成功提交 ${asins.length} 个任务`);
    showSubmitDialog.value = false;
    submitForm.value.asinsText = "";
    loadTasks();
  } finally {
    submitting.value = false;
  }
};

const handleStop = async (id: number) => {
  await ElMessageBox.confirm("确定停止该任务？", "提示", { type: "warning" });
  await stopTask(id);
  ElMessage.success("任务已停止");
  loadTasks();
};

const handleExecute = async () => {
  const taskIds = selectedTasks.value
    .filter((t) => t.status === "pending" || t.status === "failed")
    .map((t) => t.id);

  if (taskIds.length === 0) {
    ElMessage.warning("请选择待执行或失败的任务");
    return;
  }

  await executeTasks(taskIds);
  ElMessage.success(`已开始执行 ${taskIds.length} 个任务`);
  loadTasks();
};

const handleMergeExport = async () => {
  const taskIds = selectedTasks.value
    .filter((t) => t.status === "completed")
    .map((t) => t.id);

  if (taskIds.length === 0) {
    ElMessage.warning("请选择已完成的任务");
    return;
  }

  const res = await mergeExport(taskIds);
  const payload = unwrapResponseData<{ url?: string }>(res);
  ElMessage.success("导出成功");
  if (payload?.url) {
    window.open(payload.url, "_blank");
  }
};

// ─── 自动尝试登录（使用已保存的账号密码） ───────────────────
const tryAutoLogin = async (showMessage = false) => {
  if (!accountInfo.email) {
    return false;
  }
  if (accountInfo.sessionValid) {
    if (showMessage) ElMessage.success("当前账号已登录");
    return false;
  }

  autoLoggingIn.value = true;
  try {
    await loginAccount();
    await loadAccount();
    if (showMessage || accountInfo.sessionValid) {
      ElMessage.success("卖家精灵登录成功");
    }
    return true;
  } catch (err) {
    if (showMessage) {
      ElMessage.error("自动登录失败，请检查账号密码");
    }
    return false;
  } finally {
    autoLoggingIn.value = false;
  }
};

// ─── 保存并登录（切换账号或更新密码） ──────────────────────
const handleSaveAndLogin = async () => {
  if (!accountForm.value.email) {
    ElMessage.warning("请填写邮箱或手机号");
    return;
  }

  savingAccount.value = true;
  try {
    await updateAccount(accountForm.value);
    await loginAccount();
    ElMessage.success("登录成功");
    showAccountDialog.value = false;
    await loadAccount();
    accountForm.value.password = "";
  } finally {
    savingAccount.value = false;
  }
};

// ─── 打开账号对话框时预填邮箱 ──────────────────────────────
watch(showAccountDialog, (val) => {
  if (val) {
    accountForm.value = {
      email: accountInfo.email || accountForm.value.email,
      password: "",
    };
  }
});

// ─── WebSocket 监听 ────────────────────────────────────────
const handleTaskUpdate = (task: AmazonCrawlerTask) => {
  const index = tasks.value.findIndex((t) => t.id === task.id);
  if (index !== -1) {
    tasks.value[index] = { ...tasks.value[index], ...task };
  } else {
    tasks.value.unshift(task);
  }
  updateStatusCount();
  ElMessage.info(`任务 ${task.asin} → ${statusLabel(task.status)}`);
};

let unlisten: (() => void) | null = null;

onMounted(async () => {
  // 先加载账号信息
  await loadAccount();

  // 如果有账号但未登录，自动尝试登录
  if (accountInfo.email && !accountInfo.sessionValid) {
    const success = await tryAutoLogin();
    if (success) {
      ElMessage.success("已自动登录");
    }
  }
  
  // 加载任务列表
  loadTasks();

  unlisten = () => {
    websocketClient.events.off("amazonCrawlerTaskUpdate", handleTaskUpdate);
  };
  websocketClient.events.on("amazonCrawlerTaskUpdate", handleTaskUpdate);
});

onUnmounted(() => {
  if (unlisten) unlisten();
});
</script>

<style scoped lang="scss">
.amazon-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 100%;
  padding: 4px 6px 8px;
  background: var(--el-bg-color-page);
}

// ─── 顶部 ────────────────────────────────────────────────
.amazon-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.amazon-header__left {
  min-width: 0;
}

.amazon-header__title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}

.amazon-header__desc {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.amazon-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex-shrink: 0;
}

.account-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-light);
}

.account-badge--empty {
  color: var(--el-text-color-secondary);
}

.account-badge__avatar {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.account-badge__name {
  font-size: 13px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ─── 使用流程 ────────────────────────────────────────────
.amazon-guide {
  padding: 8px 12px;
}

.amazon-guide :deep(.el-alert__title) {
  font-size: 13px;
  font-weight: 600;
}

.amazon-guide__steps {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
  font-size: 13px;
}

.amazon-guide__step {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.amazon-guide__num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.amazon-guide__arrow {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

// ─── 统计卡片 ────────────────────────────────────────────
.amazon-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.amazon-stat {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.amazon-stat__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 20px;
  color: #fff;

  &--pending { background: #909399; }
  &--running { background: #e6a23c; }
  &--completed { background: #67c23a; }
  &--failed { background: #f56c6c; }
}

.amazon-stat__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.amazon-stat__value {
  font-size: 20px;
  font-weight: 700;
}

// ─── 工具栏 ──────────────────────────────────────────────
.amazon-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.amazon-toolbar__spacer {
  flex: 1;
}

// ─── 表格 ────────────────────────────────────────────────
.amazon-table {
  border-radius: 8px;
  overflow: hidden;
}

.amazon-table :deep(.el-table__header th) {
  font-weight: 600;
}

.text-muted { color: var(--el-text-color-placeholder); }
.text-error { color: var(--el-color-danger); }

// ─── 分页 ────────────────────────────────────────────────
.amazon-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 10px 0 0;
}

// ─── 表单 ────────────────────────────────────────────────
.asin-count {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

// ─── 对话框账号信息 ──────────────────────────────────────
.current-account-info {
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.current-account-info__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}

.current-account-info__row .label {
  color: var(--el-text-color-secondary);
  min-width: 56px;
}

// ─── 响应式 ──────────────────────────────────────────────
@media (max-width: 768px) {
  .amazon-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .amazon-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .amazon-header__actions,
  .amazon-toolbar {
    width: 100%;
  }

  .amazon-toolbar {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .amazon-toolbar__spacer {
    display: none;
  }
}
</style>
