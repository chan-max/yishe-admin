<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Connection, MoreFilled, EditPen, Delete } from '@element-plus/icons-vue'
import ContentWrap from '@/components/ContentWrap/src/ContentWrap.vue'
import {
  getWorkflowPageApi,
  createWorkflowApi,
  deleteWorkflowApi,
  type WorkflowItem
} from '@/api/workflow'

const router = useRouter()

// 列表数据
const loading = ref(false)
const list = ref<WorkflowItem[]>([])
const total = ref(0)
const params = reactive({
  currentPage: 1,
  pageSize: 20,
  name: '',
  status: ''
})

// 创建对话框
const createVisible = ref(false)
const creating = ref(false)
const createForm = reactive({ name: '', description: '' })

const fetchList = async () => {
  loading.value = true
  try {
    const res: any = await getWorkflowPageApi({ ...params })
    list.value = res.list || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

onMounted(fetchList)

const handleSearch = () => {
  params.currentPage = 1
  fetchList()
}

const handleCreate = async () => {
  if (!createForm.name.trim()) {
    ElMessage.warning('请输入工作流名称')
    return
  }
  creating.value = true
  try {
    const res: any = await createWorkflowApi({
      name: createForm.name.trim(),
      description: createForm.description.trim()
    })
    ElMessage.success('创建成功')
    createVisible.value = false
    createForm.name = ''
    createForm.description = ''
    // 直接打开编辑器
    router.push(`/workflow/editor/${res.id}`)
  } finally {
    creating.value = false
  }
}

const openEditor = (row: WorkflowItem) => {
  router.push(`/workflow/editor/${row.id}`)
}

const handleDelete = async (row: WorkflowItem) => {
  await ElMessageBox.confirm(`确定删除工作流「${row.name}」吗？`, '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger'
  })
  await deleteWorkflowApi(row.id)
  ElMessage.success('已删除')
  fetchList()
}

const statusMap: Record<string, { label: string; type: string }> = {
  draft: { label: '草稿', type: 'info' },
  published: { label: '已发布', type: 'success' },
  archived: { label: '已归档', type: 'warning' }
}
</script>

<template>
  <ContentWrap :plain="true">
    <div class="workflow-list-page">
      <!-- 页头 -->
      <div class="wf-page-header">
        <div class="wf-page-header__left">
          <h1 class="wf-page-title">工作流</h1>
          <p class="wf-page-subtitle">构建和管理你的自动化工作流程</p>
        </div>
        <el-button type="primary" @click="createVisible = true">
          <el-icon class="mr-1"><Plus /></el-icon>
          新建工作流
        </el-button>
      </div>

    <!-- 搜索 -->
    <div class="wf-search-bar">
      <el-input
        v-model="params.name"
        placeholder="搜索工作流名称..."
        clearable
        style="width: 280px"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="params.status" placeholder="全部状态" clearable style="width: 140px" @change="handleSearch">
        <el-option label="草稿" value="draft" />
        <el-option label="已发布" value="published" />
        <el-option label="已归档" value="archived" />
      </el-select>
      <el-button @click="handleSearch">查询</el-button>
    </div>

    <!-- 工作流卡片网格 (扁平无边框无阴影) -->
    <div v-loading="loading" class="wf-grid">
      <!-- 新建卡片 -->
      <div class="wf-card wf-card--new" @click="createVisible = true">
        <div class="wf-card--new__icon">
          <el-icon><Plus /></el-icon>
        </div>
        <span class="wf-card--new__title">新建工作流</span>
      </div>

      <!-- 工作流卡片 -->
      <div
        v-for="item in list"
        :key="item.id"
        class="wf-card"
        @click="openEditor(item)"
      >
        <!-- 卡片头部 (图标 + 状态) -->
        <div class="wf-card__header">
          <div class="wf-card__icon">
            <el-icon><Connection /></el-icon>
          </div>
          <div class="wf-card__status" :class="'wf-card__status--' + item.status">
            <span class="wf-card__status-dot" />
            <span>{{ statusMap[item.status]?.label || item.status }}</span>
          </div>
        </div>

        <!-- 标题与简短描述 -->
        <div class="wf-card__info">
          <h3 class="wf-card__title" :title="item.name">{{ item.name }}</h3>
          <p class="wf-card__desc" v-if="item.description">{{ item.description }}</p>
        </div>

        <!-- 极简底栏 (更新时间与三点菜单) -->
        <div class="wf-card__footer">
          <span class="wf-card__time">更新于 {{ new Date(item.updateTime).toLocaleDateString('zh-CN') }}</span>
          <div class="wf-card__actions" @click.stop>
            <el-dropdown trigger="click" placement="bottom-end">
              <button type="button" class="wf-more-btn" title="更多操作">
                <el-icon><MoreFilled /></el-icon>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="openEditor(item)">
                    <el-icon class="mr-1"><EditPen /></el-icon> 编辑
                  </el-dropdown-item>
                  <el-dropdown-item type="danger" divided @click="handleDelete(item)">
                    <el-icon class="mr-1"><Delete /></el-icon> 删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > params.pageSize" class="wf-pagination">
      <el-pagination
        v-model:current-page="params.currentPage"
        v-model:page-size="params.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @change="fetchList"
      />
    </div>


    <!-- 创建对话框 -->
    <el-dialog v-model="createVisible" title="新建工作流" width="440px" align-center>
      <el-form label-position="top" @submit.prevent="handleCreate">
        <el-form-item label="工作流名称" required>
          <el-input
            v-model="createForm.name"
            placeholder="例如：图片处理流程"
            autofocus
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述（可选）">
          <el-input
            v-model="createForm.description"
            type="textarea"
            placeholder="简单描述这个工作流的用途..."
            :rows="3"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">创建并打开编辑器</el-button>
      </template>
    </el-dialog>
  </div>
  </ContentWrap>
</template>

<style scoped lang="scss">
.workflow-list-page {
  padding: 0;
  min-height: 100%;
}

.wf-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.wf-page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 4px;
}

.wf-page-subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.wf-search-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
}

.wf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.wf-card {
  background: var(--app-content-surface-color);
  border: 1px solid transparent;
  box-shadow: none;
  border-radius: 12px;
  padding: 16px 18px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 140px;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 7%, var(--app-content-surface-color));
    border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);

    .wf-card__title {
      color: var(--el-color-primary);
    }

    .wf-card__icon {
      color: #ffffff;
      background: var(--el-color-primary);
    }
  }
}

.wf-card--new {
  background: var(--app-content-surface-color);
  border: 1.5px dashed var(--app-content-border-color);
  box-shadow: none;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  gap: 10px;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 7%, var(--app-content-surface-color));
    border-color: var(--el-color-primary);

    .wf-card--new__icon {
      background: var(--el-color-primary);
      color: #ffffff;
    }

    .wf-card--new__title {
      color: var(--el-color-primary);
    }
  }
}

.wf-card--new__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--app-content-surface-muted-color);
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.15s ease;
}

.wf-card--new__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  transition: color 0.15s ease;
}

/* 卡片头部 */
.wf-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.wf-card__icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--app-content-surface-muted-color);
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.15s ease;
}

.wf-card__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;

  &--draft {
    color: var(--el-text-color-secondary);
    .wf-card__status-dot { background: #94a3b8; }
  }

  &--published {
    color: #16a34a;
    .wf-card__status-dot { background: #22c55e; }
  }

  &--archived {
    color: #d97706;
    .wf-card__status-dot { background: #f59e0b; }
  }
}

.wf-card__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* 标题与描述 */
.wf-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wf-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wf-card__desc {
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 极简底栏 */
.wf-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 4px;
}

.wf-card__time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.wf-card__actions {
  display: flex;
  align-items: center;
}

.wf-more-btn {
  border: none;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  font-size: 14px;
  transition: all 0.15s ease;

  &:hover {
    background: var(--app-content-surface-color);
    color: var(--el-color-primary);
  }
}

.wf-pagination {
  display: flex;
  justify-content: center;
}
</style>
