<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="skills-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="query" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col :xs="24" :sm="12" :md="8" :lg="5" :xl="4">
                <el-form-item label="关键词">
                  <el-input
                    v-model="query.keyword"
                    size="small"
                    clearable
                    placeholder="搜索名称或说明"
                    @keyup.enter="search"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="5" :xl="4">
                <el-form-item label="适用端">
                  <el-select v-model="query.target" size="small" clearable placeholder="全部">
                    <el-option label="设计工具 Agent" value="design-agent" />
                    <el-option label="Admin Agent" value="admin-agent" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="5" :xl="4">
                <el-form-item label="状态">
                  <el-select v-model="query.enabled" size="small" clearable placeholder="全部">
                    <el-option label="已启用" :value="true" />
                    <el-option label="已停用" :value="false" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button type="primary" :icon="Search" @click="search">搜索</el-button>
              <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
              <el-button type="primary" :icon="Plus" @click="openCreate">新增</el-button>
              <el-button
                type="danger"
                :icon="Delete"
                :disabled="!selectedIds.length"
                @click="removeSkills(selectedIds)"
              >
                批量删除
              </el-button>
            </div>
          </el-form>
        </div>
      </template>

      <template #table>
        <vxe-grid
          ref="gridRef"
          v-bind="gridOptions"
          :data="rows"
          :loading="loading"
          @checkbox-change="checkboxChange"
          @checkbox-all="checkboxAllChange"
        >
          <template #nameDefaultSlot="{ row }">
            <div class="skill-name">{{ row.name }}</div>
            <div class="skill-description">{{ row.description || "暂无说明" }}</div>
          </template>
          <template #targetsDefaultSlot="{ row }">
            <el-tag
              v-for="target in row.targets"
              :key="target"
              size="small"
              effect="plain"
              class="tag-gap"
            >
              {{ targetLabel(target) }}
            </el-tag>
          </template>
          <template #triggersDefaultSlot="{ row }">
            <span class="muted">{{ row.triggers?.slice(0, 4).join("、") || "未设置" }}</span>
          </template>
          <template #ownerDefaultSlot="{ row }">
            <div>{{ row.permission?.owned ? "本人" : "用户 " + row.userId }}</div>
            <el-tag
              size="small"
              :type="row.permission?.canEdit ? 'success' : 'info'"
              effect="plain"
            >
              {{ row.permission?.canEdit ? "可管理" : "只读" }}
            </el-tag>
          </template>
          <template #permissionDefaultSlot="{ row }">
            <el-tag :type="row.isPublic ? 'success' : 'info'" size="small">
              {{ row.isPublic ? "公开" : "私有" }}
            </el-tag>
          </template>
          <template #enabledDefaultSlot="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small" effect="plain">
              {{ row.enabled ? "启用" : "停用" }}
            </el-tag>
          </template>
          <template #operationDefaultSlot="{ row }">
            <el-button
              link
              type="primary"
              :disabled="row.permission?.canEdit === false"
              @click="openEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              :disabled="row.permission?.canDelete === false"
              @click="removeSkills(row.id ? [row.id] : [])"
            >
              删除
            </el-button>
          </template>
        </vxe-grid>
      </template>

      <template #pagination>
        <Pagination
          v-model:current-page="query.currentPage"
          v-model:page-size="query.pageSize"
          :total="total"
          @change="load"
        />
      </template>
    </ListPageLayout>
  </ContentWrap>

  <el-dialog
    v-model="dialogVisible"
    :title="form.id ? '编辑 Skill' : '新建 Skill'"
    fullscreen
    class="skill-editor-dialog"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="skill-editor-form"
    >
      <div class="skill-editor-meta">
        <el-form-item label="名称" prop="name" class="skill-editor-meta__name">
          <el-input v-model="form.name" maxlength="160" show-word-limit />
        </el-form-item>
        <el-form-item label="适用 Agent" prop="targets">
          <el-checkbox-group v-model="form.targets">
            <el-checkbox value="design-agent">设计工具 Agent</el-checkbox>
            <el-checkbox value="admin-agent">Admin Agent</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="使用权限">
          <div class="permission-controls">
            <el-switch v-model="form.enabled" active-text="启用" inactive-text="停用" />
            <el-switch
              v-if="canSetPublic"
              v-model="form.isPublic"
              active-text="公开"
              inactive-text="私有"
            />
            <el-tag v-else type="info" effect="plain">私有，仅本人可用</el-tag>
          </div>
        </el-form-item>
        <el-form-item label="用途说明" class="skill-editor-meta__wide">
          <el-input
            v-model="form.description"
            maxlength="4000"
            placeholder="说明它适合处理什么任务，便于匹配"
          />
        </el-form-item>
        <el-form-item label="触发关键词" class="skill-editor-meta__wide">
          <el-input v-model="triggerText" placeholder="用逗号分隔，例如：对联，书法，打印" />
        </el-form-item>
      </div>

      <div class="file-editor">
        <aside class="file-list">
          <div class="file-list__header">
            <span>虚拟文件</span>
            <el-tooltip content="添加文件" placement="top">
              <el-button :icon="Plus" circle text @click="addFile" />
            </el-tooltip>
          </div>
          <button
            v-for="path in filePaths"
            :key="path"
            type="button"
            class="file-row"
            :class="{ 'is-active': path === activePath }"
            @click="activePath = path"
          >
            <el-icon><Document /></el-icon>
            <span class="file-row__path">{{ path }}</span>
            <el-tooltip v-if="path === form.content.entry" content="入口文件">
              <el-icon class="entry-icon"><StarFilled /></el-icon>
            </el-tooltip>
          </button>
        </aside>

        <section class="file-content">
          <div class="file-content__header">
            <span>{{ activePath }}</span>
            <div>
              <el-button
                size="small"
                :disabled="activePath === form.content.entry"
                @click="setEntry"
              >
                设为入口
              </el-button>
              <el-button
                size="small"
                type="danger"
                plain
                :icon="Delete"
                :disabled="filePaths.length <= 1"
                @click="removeActiveFile"
              >
                删除文件
              </el-button>
            </div>
          </div>
          <el-input
            v-if="activePath"
            v-model="form.content.files[activePath]"
            type="textarea"
            class="file-textarea"
            resize="none"
            spellcheck="false"
          />
        </section>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import { Delete, Document, Plus, Refresh, Search, StarFilled } from "@element-plus/icons-vue";
import { ContentWrap } from "@/components/ContentWrap";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import { useUserStore } from "@/store/modules/user";
import {
  createAiSkill,
  deleteAiSkill,
  getAiSkillPage,
  updateAiSkill,
  type AiSkill,
  type AiSkillTarget,
} from "@/api/ai-skill";

const userStore = useUserStore();
const isAdmin = computed(() => userStore.user?.isAdmin === true);
const loading = ref(false);
const saving = ref(false);
const rows = ref<AiSkill[]>([]);
const selectedIds = ref<string[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const triggerText = ref("");
const activePath = ref("SKILL.md");

const query = reactive<{
  currentPage: number;
  pageSize: number;
  keyword: string;
  target: AiSkillTarget | "";
  enabled: boolean | "";
}>({
  currentPage: 1,
  pageSize: 20,
  keyword: "",
  target: "",
  enabled: "",
});

const createEmptySkill = (): AiSkill => ({
  name: "",
  description: "",
  targets: ["design-agent", "admin-agent"],
  triggers: [],
  content: {
    entry: "SKILL.md",
    files: {
      "SKILL.md":
        "# Skill\n\n说明这个 Skill 的目标、适用条件和执行步骤。\n\n需要引用其他文件时，请在这里写出对应路径。",
    },
  },
  enabled: true,
  isPublic: false,
});

const form = reactive<AiSkill>(createEmptySkill());
const filePaths = computed(() => Object.keys(form.content.files));
const canSetPublic = computed(() => isAdmin.value && (form.permission?.canSetPublic ?? true));
const rules = {
  name: [{ required: true, message: "请输入 Skill 名称", trigger: "blur" }],
  targets: [
    {
      type: "array",
      required: true,
      min: 1,
      message: "至少选择一个 Agent",
      trigger: "change",
    },
  ],
};
const gridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: { keyField: "id" },
  checkboxConfig: {
    reserve: true,
    checkMethod: ({ row }: { row: AiSkill }) => row.permission?.canDelete !== false,
  },
  columns: [
    { type: "checkbox", width: 50 },
    {
      title: "Skill",
      field: "name",
      minWidth: 240,
      slots: { default: "nameDefaultSlot" },
    },
    {
      title: "适用 Agent",
      field: "targets",
      minWidth: 180,
      slots: { default: "targetsDefaultSlot" },
    },
    {
      title: "触发词",
      field: "triggers",
      minWidth: 180,
      slots: { default: "triggersDefaultSlot" },
    },
    {
      title: "归属",
      field: "userId",
      width: 130,
      slots: { default: "ownerDefaultSlot" },
    },
    {
      title: "权限",
      field: "isPublic",
      width: 88,
      slots: { default: "permissionDefaultSlot" },
    },
    {
      title: "状态",
      field: "enabled",
      width: 82,
      slots: { default: "enabledDefaultSlot" },
    },
    buildTimeColumn("更新时间", "updateTime"),
    buildOperationColumn("operationDefaultSlot", 120),
  ],
});

async function load() {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      currentPage: query.currentPage,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      target: query.target || undefined,
    };
    if (query.enabled !== "") params.enabled = query.enabled;
    const result = await getAiSkillPage(params);
    rows.value = result?.list || [];
    total.value = result?.total || 0;
    selectedIds.value = [];
  } catch {
    ElMessage.error("Skills 加载失败");
  } finally {
    loading.value = false;
  }
}

function search() {
  query.currentPage = 1;
  void load();
}

function resetSearch() {
  query.keyword = "";
  query.target = "";
  query.enabled = "";
  search();
}

function openCreate() {
  resetForm(createEmptySkill());
  triggerText.value = "";
  activePath.value = "SKILL.md";
  dialogVisible.value = true;
}

function openEdit(row: AiSkill) {
  const content = row.content || { entry: "SKILL.md", files: { "SKILL.md": "" } };
  resetForm({
    ...row,
    targets: [...(row.targets || [])],
    triggers: [...(row.triggers || [])],
    content: {
      entry: content.entry,
      files: { ...content.files },
    },
    permission: row.permission ? { ...row.permission } : undefined,
  });
  triggerText.value = form.triggers.join("，");
  activePath.value = form.content.entry;
  dialogVisible.value = true;
}

function resetForm(value: AiSkill) {
  for (const key of Object.keys(form)) {
    delete (form as any)[key];
  }
  Object.assign(form, value);
}

async function addFile() {
  try {
    const result = await ElMessageBox.prompt(
      "请输入相对路径，例如 references/print-spec.md",
      "添加虚拟文件",
      {
        inputPlaceholder: "references/example.md",
        inputValidator: (value) => {
          const path = String(value || "")
            .trim()
            .replace(/\\/g, "/");
          if (
            !path ||
            path.startsWith("/") ||
            path.split("/").some((part) => !part || part === "." || part === "..")
          ) {
            return "请输入安全的相对路径";
          }
          if (path in form.content.files) return "该文件已存在";
          return true;
        },
      },
    );
    const path = result.value.trim().replace(/\\/g, "/");
    form.content.files[path] = "";
    activePath.value = path;
  } catch {
    // 用户取消
  }
}

function setEntry() {
  if (activePath.value) form.content.entry = activePath.value;
}

async function removeActiveFile() {
  if (!activePath.value || filePaths.value.length <= 1) return;
  try {
    await ElMessageBox.confirm("确认删除文件 " + activePath.value + "？", "删除文件", {
      type: "warning",
    });
  } catch {
    return;
  }
  const path = activePath.value;
  delete form.content.files[path];
  const next = Object.keys(form.content.files)[0];
  if (form.content.entry === path) form.content.entry = next;
  activePath.value = next;
}

async function save() {
  await formRef.value?.validate();
  if (!filePaths.value.length || !(form.content.entry in form.content.files)) {
    ElMessage.error("请保留一个有效的入口文件");
    return;
  }
  form.triggers = [
    ...new Set(
      triggerText.value
        .split(/[,，;；\n]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
  saving.value = true;
  try {
    const payload: AiSkill = {
      id: form.id,
      name: form.name.trim(),
      description: form.description?.trim() || "",
      targets: [...form.targets],
      triggers: [...form.triggers],
      content: {
        entry: form.content.entry,
        files: { ...form.content.files },
      },
      enabled: form.enabled,
      isPublic: canSetPublic.value ? form.isPublic : false,
    };
    if (form.id) {
      await updateAiSkill(payload);
      ElMessage.success("Skill 已更新");
    } else {
      await createAiSkill(payload);
      ElMessage.success("Skill 已创建");
    }
    dialogVisible.value = false;
    await load();
  } catch {
    ElMessage.error("Skill 保存失败");
  } finally {
    saving.value = false;
  }
}

async function removeSkills(ids: string[]) {
  if (!ids.length) return;
  try {
    await ElMessageBox.confirm("确认删除选中的 " + ids.length + " 个 Skill？", "删除 Skills", {
      type: "warning",
    });
  } catch {
    return;
  }
  try {
    await deleteAiSkill(ids);
    ElMessage.success("删除成功");
    await load();
  } catch {
    ElMessage.error("删除失败");
  }
}

function syncSelectedRows(records: AiSkill[]) {
  selectedIds.value = records
    .filter((item) => item.permission?.canDelete !== false)
    .map((item) => item.id!)
    .filter(Boolean);
}

function checkboxChange({ records }: { records: AiSkill[] }) {
  syncSelectedRows(records);
}

function checkboxAllChange({ records }: { records: AiSkill[] }) {
  syncSelectedRows(records);
}

function targetLabel(target: AiSkillTarget) {
  return target === "design-agent" ? "设计工具" : "Admin";
}

onMounted(load);
</script>

<style scoped>
.skills-page {
  gap: 10px;
  padding: 8px 0 0;

  :deep(.list-page-layout__main) {
    gap: 10px;
  }

  :deep(.list-page-filter--flat) {
    gap: 10px;
    padding-bottom: 10px;
  }

  :deep(.list-page-table-panel__pagination--flat) {
    padding-top: 10px;
  }
}

.permission-controls,
.file-content__header > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.skill-name {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.skill-description {
  max-width: 420px;
  margin-top: 4px;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-gap {
  margin: 2px 4px 2px 0;
}

.muted {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.skill-editor-form {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
}

.skill-editor-meta {
  display: grid;
  padding: 14px 20px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  column-gap: 16px;
  grid-template-columns: minmax(260px, 1.5fr) minmax(220px, 1fr) minmax(220px, 1fr);
}

.skill-editor-meta :deep(.el-form-item) {
  margin-bottom: 14px;
}

.skill-editor-meta__wide {
  grid-column: span 2;
}

.file-editor {
  display: grid;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  grid-template-columns: 260px minmax(0, 1fr);
}

.file-list {
  overflow: auto;
  border-right: 1px solid var(--el-border-color);
  background: var(--el-fill-color-extra-light);
}

.file-list__header,
.file-content__header {
  display: flex;
  height: 48px;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid var(--el-border-color);
  font-weight: 600;
}

.file-row {
  display: grid;
  width: 100%;
  min-height: 42px;
  padding: 8px 10px;
  border: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font: inherit;
  grid-template-columns: 18px minmax(0, 1fr) 18px;
  text-align: left;
}

.file-row:hover,
.file-row.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.file-row__path {
  overflow: hidden;
  padding: 0 6px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-icon {
  color: var(--el-color-warning);
}

.file-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.file-content__header > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-textarea {
  flex: 1;
}

.file-textarea :deep(.el-textarea__inner) {
  height: 100%;
  min-height: 100% !important;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.65;
}

:global(.skill-editor-dialog) {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}

:global(.skill-editor-dialog .el-dialog__header) {
  margin: 0;
  padding: 14px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:global(.skill-editor-dialog .el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
}

:global(.skill-editor-dialog .el-dialog__body) {
  min-height: 0;
  flex: 1;
  overflow: hidden;
  padding: 0;
}

:global(.skill-editor-dialog .el-dialog__footer) {
  padding: 10px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 900px) {
  .skill-editor-meta {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .skill-editor-meta__wide {
    grid-column: span 1;
  }
}

@media (max-width: 640px) {
  :global(.skill-editor-dialog .el-dialog__body) {
    overflow: auto;
  }

  .skill-editor-form {
    height: auto;
    min-height: 100%;
  }

  .skill-editor-meta,
  .file-editor {
    grid-template-columns: 1fr;
  }

  .skill-editor-meta__wide {
    grid-column: auto;
  }

  .file-list {
    max-height: 180px;
    border-right: 0;
    border-bottom: 1px solid var(--el-border-color);
  }

  .file-textarea :deep(.el-textarea__inner) {
    min-height: 420px !important;
  }
}
</style>
