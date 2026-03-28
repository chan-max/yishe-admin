<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="code-script-schedule-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
                <el-form-item label="调度名称">
                  <el-input
                    v-model="queryParams.search"
                    size="small"
                    placeholder="请输入调度名称"
                    clearable
                    @keyup.enter="getList"
                    @change="(val) => { if (!val) getList(); }"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="5" :xl="4">
                <el-form-item label="运行环境">
                  <el-select v-model="queryParams.runtimeEnv" size="small" clearable @change="getList">
                    <el-option label="开发环境" value="development" />
                    <el-option label="生产环境" value="production" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
                <el-form-item label="代码脚本">
                  <el-select
                    v-model="queryParams.scriptId"
                    size="small"
                    filterable
                    clearable
                    placeholder="请选择代码脚本"
                    @change="handleScriptFilterChange"
                  >
                    <el-option
                      v-for="script in scriptOptions"
                      :key="script.id"
                      :label="`${script.name} (#${script.id})`"
                      :value="script.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="4" :xl="3">
                <el-form-item label="启用状态">
                  <el-select v-model="queryParams.isEnabled" size="small" clearable @change="getList">
                    <el-option label="启用" :value="true" />
                    <el-option label="停用" :value="false" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button size="small" class="!ml-0" type="primary" :icon="Search" @click="getList">
                搜索
              </el-button>
              <el-button
                size="small"
                class="!ml-0"
                type="danger"
                plain
                :disabled="!ids.length"
                @click="handleDelete()"
              >
                批量删除 ({{ ids.length }})
              </el-button>
              <el-button size="small" type="primary" :icon="Plus" @click="handleAdd">新增调度</el-button>
            </div>
          </el-form>
        </div>
      </template>

      <template #table>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat">
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid
                v-bind="gridOptions"
                :data="dataSource"
                :loading="loading"
                @checkbox-change="checkboxChange"
                @checkbox-all="checkboxAllChange"
              >
                <template #scriptSlot="{ row }">
                  <div class="flex flex-col">
                    <span>{{ row.scriptName || `脚本#${row.scriptId}` }}</span>
                    <span class="text-xs text-[var(--el-text-color-secondary)]"
                      >ID {{ row.scriptId }}</span
                    >
                  </div>
                </template>
                <template #envSlot="{ row }">
                  <el-tag
                    size="small"
                    :type="row.runtimeEnv === 'production' ? 'danger' : 'success'"
                  >
                    {{ formatRuntimeEnv(row.runtimeEnv) }}
                  </el-tag>
                </template>
                <template #triggerSlot="{ row }">
                  <div class="flex flex-col">
                    <span>{{ row.triggerType === "cron" ? "固定时间" : "间隔执行" }}</span>
                    <span class="text-xs text-[var(--el-text-color-secondary)]">{{
                      formatTrigger(row)
                    }}</span>
                  </div>
                </template>
                <template #enabledSlot="{ row }">
                  <el-tag :type="row.isEnabled ? 'success' : 'info'" size="small">
                    {{ row.isEnabled ? "启用" : "停用" }}
                  </el-tag>
                </template>
                <template #lastStatusSlot="{ row }">
                  <el-tag
                    v-if="row.lastStatus"
                    :type="getExecutionStatusType(row.lastStatus)"
                    size="small"
                    effect="plain"
                  >
                    {{ row.lastStatus }}
                  </el-tag>
                  <span v-else class="text-xs text-[var(--el-text-color-secondary)]">-</span>
                </template>
                <template #nextRunAtSlot="{ row }">
                  <span>{{ formatScheduleDateTime(row.nextRunAt) }}</span>
                </template>
                <template #operationSlot="{ row }">
                  <el-dropdown
                    trigger="click"
                    @command="(command) => handleOperationCommand(command, row)"
                    class="operation-dropdown"
                  >
                    <el-button type="primary" link size="small" class="operation-trigger-button">
                      操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu class="operation-menu-compact">
                        <el-dropdown-item command="run">立即执行</el-dropdown-item>
                        <el-dropdown-item command="toggle">{{
                          row.isEnabled ? "停用" : "启用"
                        }}</el-dropdown-item>
                        <el-dropdown-item command="records">执行记录</el-dropdown-item>
                        <el-dropdown-item command="edit">编辑</el-dropdown-item>
                        <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
              </vxe-grid>
            </div>
          </div>
        </div>
      </template>

      <template #pagination>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel__pagination list-page-table-panel__pagination--flat">
          <Pagination
            :total="total"
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </template>
    </ListPageLayout>
  </ContentWrap>

  <el-dialog :title="dialogTitle" v-model="dialogVisible" fullscreen align-center destroy-on-close>
    <div
      class="mx-auto grid h-[calc(100vh-120px)] max-w-[1440px] grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_420px]"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="110px"
        class="grid min-h-0 gap-4"
      >
        <div class="grid gap-4 lg:grid-cols-2">
          <div class="rounded border border-solid border-[var(--el-border-color-light)] p-4">
            <div class="mb-3 text-sm font-600">基础信息</div>
            <el-form-item label="调度名称" prop="name" class="mb-4">
              <el-input
                v-model="form.name"
                maxlength="200"
                show-word-limit
                placeholder="请输入调度名称"
              />
            </el-form-item>
            <el-form-item label="代码脚本" prop="scriptId" class="mb-4">
              <el-select
                v-model="form.scriptId"
                filterable
                class="w-full"
                placeholder="请选择代码脚本"
              >
                <el-option
                  v-for="script in scriptOptions"
                  :key="script.id"
                  :label="`${script.name} (#${script.id})`"
                  :value="script.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="运行环境" prop="runtimeEnv" class="mb-4">
              <el-radio-group v-model="form.runtimeEnv">
                <el-radio label="development">开发环境</el-radio>
                <el-radio label="production">生产环境</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="是否启用" prop="isEnabled" class="mb-0">
              <el-switch v-model="form.isEnabled" />
            </el-form-item>
          </div>

          <div class="rounded border border-solid border-[var(--el-border-color-light)] p-4">
            <div class="mb-3 text-sm font-600">执行配置</div>
            <el-form-item label="触发方式" prop="triggerType" class="mb-4">
              <el-radio-group v-model="form.triggerType">
                <el-radio label="cron">固定时间</el-radio>
                <el-radio label="interval">间隔执行</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item
              v-if="form.triggerType === 'cron'"
              label="Cron 表达式"
              prop="cronExpr"
              class="mb-4"
            >
              <el-input v-model="form.cronExpr" placeholder="例如：0 9 * * *" />
            </el-form-item>
            <el-form-item v-else label="间隔分钟" prop="intervalMinutes" class="mb-4">
              <el-input-number
                v-model="form.intervalMinutes"
                :min="1"
                :max="1440"
                class="w-full!"
              />
            </el-form-item>
            <el-form-item label="超时覆盖(ms)" prop="timeoutMsOverride" class="mb-0">
              <el-input-number
                v-model="form.timeoutMsOverride"
                :min="100"
                :max="1800000"
                class="w-full!"
              />
            </el-form-item>
          </div>
        </div>

        <div class="rounded border border-solid border-[var(--el-border-color-light)] p-4">
          <div class="mb-3 text-sm font-600">参数覆盖</div>
          <el-form-item label-width="0" prop="paramsOverride" class="mb-0">
            <el-input
              v-model="form.paramsOverride"
              type="textarea"
              :rows="12"
              placeholder='请输入 JSON，例如 { "shopId": 1 }'
            />
          </el-form-item>
        </div>
      </el-form>

      <div class="grid min-h-0 gap-4">
        <div
          class="rounded border border-solid border-[var(--el-border-color-light)] bg-[var(--el-fill-color-lighter)] p-4"
        >
          <div class="mb-3 text-sm font-600">Cron 快捷模板</div>
          <div class="flex flex-wrap gap-2">
            <el-button
              v-for="item in cronTemplates"
              :key="item.expr"
              size="small"
              @click="applyCronTemplate(item.expr)"
            >
              {{ item.label }}
            </el-button>
          </div>
        </div>

        <div
          class="rounded border border-solid border-[var(--el-border-color-light)] bg-[var(--el-fill-color-lighter)] p-4"
        >
          <div class="mb-3 text-sm font-600">Cron 参考</div>
          <div class="space-y-2 text-xs leading-6 text-[var(--el-text-color-secondary)]">
            <div v-for="item in cronTemplates" :key="`${item.expr}-desc`">
              {{ item.label }}:
              <span class="font-mono text-[var(--el-text-color-primary)]">{{ item.expr }}</span>
              {{ item.desc }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submitForm">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog title="执行记录" v-model="executionDialogVisible" fullscreen align-center>
    <div class="flex h-[calc(100vh-120px)] flex-col">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <el-tag v-if="currentSchedule" size="small" type="primary">
            {{ currentSchedule.name }} (#{{ currentSchedule.id }})
          </el-tag>
        </div>
        <div class="flex items-center gap-2">
          <el-button
            size="small"
            type="danger"
            plain
            :disabled="!executionIds.length"
            @click="handleDeleteExecution()"
          >
            批量删除 ({{ executionIds.length }})
          </el-button>
          <el-button size="small" type="primary" @click="getExecutionList">刷新记录</el-button>
        </div>
      </div>

      <div class="common-table flex-1 min-h-0">
        <vxe-grid
          v-bind="executionGridOptions"
          :data="executionDataSource"
          :loading="executionLoading"
          @checkbox-change="executionCheckboxChange"
          @checkbox-all="executionCheckboxAllChange"
        >
          <template #executionStatusSlot="{ row }">
            <el-tag :type="getExecutionStatusType(row.status)" size="small">{{
              row.status
            }}</el-tag>
          </template>
          <template #scheduledAtSlot="{ row }">
            <span>{{ formatScheduleDateTime(row.scheduledAt) }}</span>
          </template>
          <template #startedAtSlot="{ row }">
            <span>{{ formatScheduleDateTime(row.startedAt) }}</span>
          </template>
          <template #executionOperationSlot="{ row }">
            <el-dropdown
              trigger="click"
              @command="(command) => handleExecutionOperationCommand(command, row)"
            >
              <el-button type="primary" link size="small">
                操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="detail">详情</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </vxe-grid>
      </div>

      <div class="flex justify-end pt-3">
        <Pagination
          :total="executionTotal"
          v-model:page="executionQuery.currentPage"
          v-model:limit="executionQuery.pageSize"
          @pagination="getExecutionList"
        />
      </div>
    </div>
  </el-dialog>

  <el-dialog title="执行详情" v-model="executionDetailVisible" fullscreen align-center>
    <div class="h-[calc(100vh-120px)] overflow-auto" v-loading="executionDetailLoading">
      <div class="mb-3 flex flex-wrap items-center gap-3 text-[var(--el-text-color-secondary)]">
        <el-tag :type="getExecutionStatusType(executionDetail.status)" size="small">{{
          executionDetail.status || "-"
        }}</el-tag>
        <span>调度：{{ executionDetail.scheduleName || "-" }}</span>
        <span>脚本：{{ executionDetail.scriptName || "-" }}</span>
        <span>脚本执行ID：{{ executionDetail.codeScriptRunId || "-" }}</span>
        <span>沙盒运行ID：{{ executionDetail.sandboxRunId || "-" }}</span>
      </div>
      <div
        class="grid h-[72vh] grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]"
      >
        <div
          class="flex min-h-0 flex-col rounded border border-solid border-[var(--el-border-color-light)] bg-[var(--el-fill-color-lighter)] p-3"
        >
          <div class="mb-2 text-sm font-600">执行结果</div>
          <pre class="m-0 flex-1 overflow-auto whitespace-pre-wrap break-all text-xs leading-6">{{
            formatJson(executionDetail.runResult)
          }}</pre>
        </div>
        <div class="grid h-full min-h-0 gap-3 grid-rows-2">
          <div
            class="flex min-h-0 flex-col rounded border border-solid border-[var(--el-border-color-light)] bg-[var(--el-fill-color-lighter)] p-3"
          >
            <div class="mb-2 text-sm font-600">参数快照</div>
            <pre class="m-0 flex-1 overflow-auto whitespace-pre-wrap break-all text-xs leading-6">{{
              formatJson(executionDetail.paramsSnapshotJson)
            }}</pre>
          </div>
          <div
            class="flex min-h-0 flex-col rounded border border-solid border-[var(--el-border-color-light)] bg-[var(--el-fill-color-lighter)] p-3"
          >
            <div class="mb-2 text-sm font-600">日志</div>
            <div
            class="m-0 flex-1 overflow-auto whitespace-pre-wrap break-all rounded bg-[var(--list-page-base-bg)] p-3 font-mono text-xs leading-6 text-slate-200"
            >
              <div
                v-for="(line, index) in formattedExecutionLogLines"
                :key="`${index}-${line.text}`"
                :class="line.className"
              >
                {{ line.text }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDown, Plus, Search } from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";
import { commonGridOptions } from "@/common/table";
import Pagination from "@/components/Pagination/index.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import { formatDate } from "@/utils/formatTime";
import { getCodeScriptList } from "@/api/codeScript";
import {
  createCodeScriptSchedule,
  deleteCodeScriptScheduleExecution,
  deleteCodeScriptSchedule,
  getCodeScriptSchedule,
  getCodeScriptScheduleExecution,
  getCodeScriptScheduleExecutionList,
  getCodeScriptScheduleList,
  runNowCodeScriptSchedule,
  toggleCodeScriptSchedule,
  updateCodeScriptSchedule,
} from "@/api/codeScriptSchedule";

const { height } = useWindowSize();
const route = useRoute();
const router = useRouter();

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  search: "",
  scriptId: undefined as number | undefined,
  runtimeEnv: "",
  isEnabled: undefined as boolean | undefined,
});

const executionQuery = reactive({
  currentPage: 1,
  pageSize: 10,
  scheduleId: undefined as number | undefined,
});

const loading = ref(false);
const dataSource = ref<any[]>([]);
const total = ref(0);
const ids = ref<number[]>([]);
const scriptOptions = ref<any[]>([]);

const executionLoading = ref(false);
const executionDataSource = ref<any[]>([]);
const executionTotal = ref(0);
const executionIds = ref<number[]>([]);

const dialogVisible = ref(false);
const dialogTitle = ref("");
const submitLoading = ref(false);
const isEdit = ref(false);
const formRef = ref();
const form = reactive({
  id: undefined as number | undefined,
  name: "",
  scriptId: undefined as number | undefined,
  runtimeEnv: "development",
  triggerType: "cron",
  cronExpr: "0 9 * * *",
  intervalMinutes: 60,
  paramsOverride: "{}",
  timeoutMsOverride: undefined as number | undefined,
  isEnabled: true,
});

const currentSchedule = ref<any>(null);
const executionDialogVisible = ref(false);
const executionDetailVisible = ref(false);
const executionDetailLoading = ref(false);
const executionDetail = reactive<any>({
  id: undefined,
  status: "",
  scheduleName: "",
  scriptName: "",
  codeScriptRunId: "",
  sandboxRunId: "",
  paramsSnapshotJson: {},
  runResult: null,
  logs: [],
  errorText: "",
});

const LOG_TYPE_CLASS_MAP: Record<string, string> = {
  success: "text-emerald-300",
  fail: "text-rose-300",
  error: "text-rose-300",
  done: "text-sky-300",
  start: "text-amber-300",
  page: "text-violet-300",
  request: "text-cyan-300",
  warn: "text-yellow-300",
  info: "text-slate-200",
};

const cronTemplates = [
  { label: "每 5 分钟", expr: "*/5 * * * *", desc: "适合高频轻量任务" },
  { label: "每 10 分钟", expr: "*/10 * * * *", desc: "常用轮询任务" },
  { label: "每 30 分钟", expr: "*/30 * * * *", desc: "中频同步任务" },
  { label: "每小时整点", expr: "0 * * * *", desc: "每小时执行一次" },
  { label: "每天 09:00", expr: "0 9 * * *", desc: "每天上午 9 点" },
  { label: "每天 12:00", expr: "0 12 * * *", desc: "每天中午 12 点" },
  { label: "每天 18:00", expr: "0 18 * * *", desc: "每天下午 6 点" },
  { label: "每天 00:30", expr: "30 0 * * *", desc: "适合夜间批处理" },
  { label: "工作日 09:00", expr: "0 9 * * 1-5", desc: "周一到周五上午 9 点" },
  { label: "工作日 18:00", expr: "0 18 * * 1-5", desc: "周一到周五下午 6 点" },
  { label: "每周一 09:00", expr: "0 9 * * 1", desc: "每周一上午 9 点" },
  { label: "每周日 23:00", expr: "0 23 * * 0", desc: "每周日晚上 11 点" },
  { label: "每月 1 日 09:00", expr: "0 9 1 * *", desc: "每月 1 日上午 9 点" },
  { label: "每月最后一天 23:00", expr: "0 23 28-31 * *", desc: "需脚本内自行兜底最后一天判断" },
];

const gridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: { keyField: "id" },
  checkboxConfig: { reserve: true },
  columns: [
    { type: "checkbox", width: 48, reserve: true },
    { title: "ID", field: "id", width: 80 },
    { title: "调度名称", field: "name", minWidth: 180, showOverflow: true },
    { title: "关联脚本", field: "scriptName", minWidth: 180, slots: { default: "scriptSlot" } },
    { title: "运行环境", field: "runtimeEnv", width: 110, slots: { default: "envSlot" } },
    { title: "触发方式", field: "triggerType", minWidth: 180, slots: { default: "triggerSlot" } },
    { title: "启用状态", field: "isEnabled", width: 100, slots: { default: "enabledSlot" } },
    { title: "执行状态", field: "lastStatus", width: 110, slots: { default: "lastStatusSlot" } },
    {
      title: "下次执行",
      field: "nextRunAt",
      width: 170,
      showOverflow: true,
      slots: { default: "nextRunAtSlot" },
    },
    { title: "操作", width: 110, fixed: "right" as const, slots: { default: "operationSlot" } },
  ],
} as any);

const executionGridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: { keyField: "id" },
  checkboxConfig: { reserve: true },
  columns: [
    { type: "checkbox", width: 48, reserve: true },
    { title: "记录ID", field: "id", width: 90 },
    { title: "状态", field: "status", width: 100, slots: { default: "executionStatusSlot" } },
    { title: "触发来源", field: "triggerSource", width: 100 },
    {
      title: "计划执行时间",
      field: "scheduledAt",
      width: 170,
      showOverflow: true,
      slots: { default: "scheduledAtSlot" },
    },
    {
      title: "开始时间",
      field: "startedAt",
      width: 170,
      showOverflow: true,
      slots: { default: "startedAtSlot" },
    },
    { title: "耗时(ms)", field: "durationMs", width: 100 },
    { title: "沙盒ID", field: "sandboxRunId", minWidth: 180, showOverflow: true },
    { title: "操作", width: 100, slots: { default: "executionOperationSlot" } },
  ],
} as any);

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 260;
  executionGridOptions.value.maxHeight = height.value - 240;
});

watch(
  () => form.triggerType,
  (value) => {
    if (value === "cron") {
      form.intervalMinutes = 60;
    } else {
      form.cronExpr = "0 9 * * *";
    }
  },
);

watch(
  () => route.query.scriptId,
  (value) => {
    const scriptId = Number(value);
    const nextScriptId = Number.isFinite(scriptId) && scriptId > 0 ? scriptId : undefined;
    if (queryParams.scriptId === nextScriptId) {
      return;
    }
    queryParams.scriptId = nextScriptId;
    queryParams.currentPage = 1;
    getList();
  },
);

const rules = {
  name: [{ required: true, message: "请输入调度名称", trigger: "blur" }],
  scriptId: [{ required: true, message: "请选择代码脚本", trigger: "change" }],
  runtimeEnv: [{ required: true, message: "请选择运行环境", trigger: "change" }],
  triggerType: [{ required: true, message: "请选择触发方式", trigger: "change" }],
  cronExpr: [{ required: true, message: "请输入 cron 表达式", trigger: "blur" }],
  intervalMinutes: [{ required: true, message: "请输入间隔分钟", trigger: "change" }],
  paramsOverride: [{ required: true, message: "请输入参数覆盖 JSON", trigger: "blur" }],
};

function formatRuntimeEnv(value: string) {
  return value === "production" ? "生产环境" : "开发环境";
}

function formatTrigger(row: any) {
  return row.triggerType === "cron" ? row.cronExpr || "-" : `每 ${row.intervalMinutes || 0} 分钟`;
}

function getExecutionStatusType(status: string) {
  if (status === "completed") return "success";
  if (status === "running" || status === "queued") return "warning";
  if (status === "failed" || status === "timed_out" || status === "cancelled") return "danger";
  return "info";
}

function formatJson(value: any) {
  return JSON.stringify(value ?? null, null, 2);
}

function detectLogLineType(text: string) {
  const normalized = String(text || "").toUpperCase();
  if (normalized.includes("[SUCCESS]")) return "success";
  if (normalized.includes("[FAIL]")) return "fail";
  if (normalized.includes("[ERROR]")) return "error";
  if (normalized.includes("[DONE]")) return "done";
  if (normalized.includes("[START]")) return "start";
  if (normalized.includes("[PAGE]")) return "page";
  if (normalized.includes("[REQUEST]")) return "request";
  if (normalized.includes("[WARN]") || normalized.includes("[WARNING]")) return "warn";
  return "info";
}

function normalizeLogLines(logs: any, errorText?: string) {
  const result: Array<{ text: string; className: string }> = [];

  const appendLine = (raw: unknown, preferredType?: string) => {
    const text = String(raw ?? "").trimEnd();
    if (!text) return;
    const type = preferredType || detectLogLineType(text);
    result.push({
      text,
      className: LOG_TYPE_CLASS_MAP[type] || LOG_TYPE_CLASS_MAP.info,
    });
  };

  if (Array.isArray(logs)) {
    logs.forEach((item) => {
      if (typeof item === "string") {
        item.split("\n").forEach((line) => appendLine(line));
        return;
      }

      if (item && typeof item === "object") {
        const ts = item.ts ? `[${formatScheduleDateTime(item.ts)}] ` : "";
        const message = item.message ?? formatJson(item);
        const type =
          item.level === "error"
            ? "error"
            : item.level === "warn" || item.level === "warning"
              ? "warn"
              : detectLogLineType(String(message));

        String(message)
          .split("\n")
          .forEach((line) => appendLine(`${ts}${line}`, type));
        return;
      }

      appendLine(item);
    });
  } else if (logs) {
    String(formatJson(logs))
      .split("\n")
      .forEach((line) => appendLine(line));
  }

  if (errorText) {
    appendLine("[ERROR]", "error");
    String(errorText)
      .split("\n")
      .forEach((line) => appendLine(line, "error"));
  }

  if (!result.length) {
    appendLine("暂无日志", "info");
  }

  return result;
}

const formattedExecutionLogLines = computed(() =>
  normalizeLogLines(executionDetail.logs, executionDetail.errorText),
);

function formatScheduleDateTime(value: unknown) {
  if (!value) return "-";

  if (value instanceof Date) {
    return formatDate(value);
  }

  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return "-";

    const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(raw);
    const normalized = hasTimezone ? raw : raw.replace(" ", "T") + "Z";
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return formatDate(parsed);
    }
  }

  const parsed = new Date(value as any);
  return Number.isNaN(parsed.getTime()) ? String(value) : formatDate(parsed);
}

function applyCronTemplate(expr: string) {
  form.cronExpr = expr;
}

async function getScriptOptions() {
  const res = await getCodeScriptList({
    currentPage: 1,
    pageSize: 500,
    search: "",
  });
  scriptOptions.value = res.list || [];
}

async function getList() {
  loading.value = true;
  try {
    const res = await getCodeScriptScheduleList({ ...queryParams });
    dataSource.value = res.list || [];
    total.value = res.total || 0;
    ids.value = [];
  } catch (error: any) {
    ElMessage.error(error?.message || "获取脚本调度列表失败");
  } finally {
    loading.value = false;
  }
}

async function getExecutionList() {
  if (!executionQuery.scheduleId) return;
  executionLoading.value = true;
  try {
    const res = await getCodeScriptScheduleExecutionList({ ...executionQuery });
    executionDataSource.value = res.list || [];
    executionTotal.value = res.total || 0;
    executionIds.value = [];
  } catch (error: any) {
    ElMessage.error(error?.message || "获取执行记录失败");
  } finally {
    executionLoading.value = false;
  }
}

function checkboxChange({ records }) {
  ids.value = records.map((item) => item.id);
}

function checkboxAllChange({ records }) {
  ids.value = records.map((item) => item.id);
}

function executionCheckboxChange({ records }) {
  executionIds.value = records.map((item) => item.id);
}

function executionCheckboxAllChange({ records }) {
  executionIds.value = records.map((item) => item.id);
}

function syncRouteScriptId(scriptId?: number) {
  const currentScriptId =
    typeof route.query.scriptId === "string" ? route.query.scriptId : undefined;
  const nextScriptId = scriptId ? String(scriptId) : undefined;
  if (currentScriptId === nextScriptId) {
    return;
  }
  const nextQuery = { ...route.query };
  if (scriptId) {
    nextQuery.scriptId = String(scriptId);
  } else {
    delete nextQuery.scriptId;
  }
  router.replace({ path: route.path, query: nextQuery });
}

function handleScriptFilterChange(value?: number) {
  queryParams.currentPage = 1;
  syncRouteScriptId(value);
  getList();
}

function resetForm() {
  form.id = undefined;
  form.name = "";
  form.scriptId = undefined;
  form.runtimeEnv = "development";
  form.triggerType = "cron";
  form.cronExpr = "0 9 * * *";
  form.intervalMinutes = 60;
  form.paramsOverride = "{}";
  form.timeoutMsOverride = undefined;
  form.isEnabled = true;
}

function handleAdd() {
  isEdit.value = false;
  dialogTitle.value = "新增脚本调度";
  resetForm();
  if (queryParams.scriptId) {
    form.scriptId = queryParams.scriptId;
  }
  dialogVisible.value = true;
}

async function handleEdit(row: any) {
  const detail = await getCodeScriptSchedule(row.id);
  isEdit.value = true;
  dialogTitle.value = "编辑脚本调度";
  form.id = detail.id;
  form.name = detail.name;
  form.scriptId = detail.scriptId;
  form.runtimeEnv = detail.runtimeEnv;
  form.triggerType = detail.triggerType;
  form.cronExpr = detail.cronExpr || "0 9 * * *";
  form.intervalMinutes = detail.intervalMinutes || 60;
  form.paramsOverride = detail.paramsOverride || "{}";
  form.timeoutMsOverride = detail.timeoutMsOverride || undefined;
  form.isEnabled = !!detail.isEnabled;
  dialogVisible.value = true;
}

async function submitForm() {
  await formRef.value?.validate();
  submitLoading.value = true;
  try {
    const payload = {
      id: form.id,
      name: form.name,
      scriptId: form.scriptId,
      runtimeEnv: form.runtimeEnv,
      triggerType: form.triggerType,
      cronExpr: form.triggerType === "cron" ? form.cronExpr : undefined,
      intervalMinutes: form.triggerType === "interval" ? form.intervalMinutes : undefined,
      paramsOverride: form.paramsOverride,
      timeoutMsOverride: form.timeoutMsOverride,
      isEnabled: form.isEnabled,
    };
    if (isEdit.value) {
      await updateCodeScriptSchedule(payload);
      ElMessage.success("脚本调度更新成功");
    } else {
      await createCodeScriptSchedule(payload);
      ElMessage.success("脚本调度创建成功");
    }
    dialogVisible.value = false;
    getList();
  } catch (error: any) {
    ElMessage.error(error?.message || "保存脚本调度失败");
  } finally {
    submitLoading.value = false;
  }
}

async function handleDelete(row?: any) {
  const deleteIds = row ? [row.id] : [...ids.value];
  if (!deleteIds.length) {
    ElMessage.warning("请选择要删除的调度任务");
    return;
  }
  await ElMessageBox.confirm(`确认删除选中的 ${deleteIds.length} 条脚本调度吗？`, "删除提示", {
    type: "warning",
  });
  try {
    await deleteCodeScriptSchedule({ ids: deleteIds });
    ElMessage.success("删除成功");
    getList();
  } catch (error: any) {
    ElMessage.error(error?.message || "删除失败");
  }
}

async function handleToggle(row: any) {
  try {
    await toggleCodeScriptSchedule({ id: row.id, enabled: !row.isEnabled });
    ElMessage.success(`已${row.isEnabled ? "停用" : "启用"}调度`);
    getList();
  } catch (error: any) {
    ElMessage.error(error?.message || "状态切换失败");
  }
}

async function handleRunNow(row: any) {
  await ElMessageBox.confirm(`确认立即执行调度「${row.name}」吗？`, "立即执行", {
    type: "warning",
  });
  try {
    const detail = await runNowCodeScriptSchedule({ id: row.id });
    ElMessage.success("已触发立即执行");
    await getList();
    currentSchedule.value = row;
    executionQuery.scheduleId = row.id;
    executionQuery.currentPage = 1;
    executionDialogVisible.value = true;
    await getExecutionList();
    if (detail?.id) {
      await openExecutionDetail(detail);
    }
  } catch (error: any) {
    ElMessage.error(error?.message || "立即执行失败");
  }
}

async function openExecutionRecords(row: any) {
  currentSchedule.value = row;
  executionQuery.scheduleId = row.id;
  executionQuery.currentPage = 1;
  executionDialogVisible.value = true;
  await getExecutionList();
}

async function openExecutionDetail(row: any) {
  executionDetailLoading.value = true;
  executionDetailVisible.value = true;
  try {
    const detail = await getCodeScriptScheduleExecution(row.id);
    Object.assign(executionDetail, detail || {});
  } catch (error: any) {
    ElMessage.error(error?.message || "获取执行详情失败");
  } finally {
    executionDetailLoading.value = false;
  }
}

async function handleDeleteExecution(row?: any) {
  const deleteIds = row?.id ? [row.id] : [...executionIds.value];
  if (!deleteIds.length) {
    ElMessage.warning("请选择要删除的执行记录");
    return;
  }

  await ElMessageBox.confirm(`确认删除选中的 ${deleteIds.length} 条执行记录吗？`, "删除提示", {
    type: "warning",
  });

  try {
    await deleteCodeScriptScheduleExecution({ ids: deleteIds });
    ElMessage.success("删除成功");
    if (row?.id && executionDetailVisible.value && executionDetail.id === row.id) {
      executionDetailVisible.value = false;
    }
    await getExecutionList();
  } catch (error: any) {
    ElMessage.error(error?.message || "删除执行记录失败");
  }
}

async function handleExecutionOperationCommand(command: string, row: any) {
  if (command === "detail") {
    await openExecutionDetail(row);
    return;
  }
  if (command === "delete") {
    await handleDeleteExecution(row);
  }
}

async function handleOperationCommand(command: string, row: any) {
  if (command === "edit") {
    await handleEdit(row);
    return;
  }
  if (command === "delete") {
    await handleDelete(row);
    return;
  }
  if (command === "toggle") {
    await handleToggle(row);
    return;
  }
  if (command === "run") {
    await handleRunNow(row);
    return;
  }
  if (command === "records") {
    await openExecutionRecords(row);
  }
}

onMounted(async () => {
  const routeScriptId = Number(route.query.scriptId);
  if (Number.isFinite(routeScriptId) && routeScriptId > 0) {
    queryParams.scriptId = routeScriptId;
  }
  await Promise.all([getScriptOptions(), getList()]);
});
</script>

<style scoped>
:deep(.code-script-schedule-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.code-script-schedule-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.code-script-schedule-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.code-script-schedule-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}
</style>
