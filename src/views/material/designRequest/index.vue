<template>
  <ContentWrap :plain="true">
    <div class="design-request-container">
      <!-- 顶部灵感统计看板 -->
      <el-row :gutter="16" class="stats-header">
        <el-col :xs="24" :sm="8">
          <div class="stat-card stat-card--blue">
            <div class="stat-card__icon-wrapper">
              <el-icon class="stat-card__icon"><EditPen /></el-icon>
            </div>
            <div class="stat-card__info">
              <span class="stat-card__label">总计灵感创意</span>
              <span class="stat-card__value">{{ total }}</span>
            </div>
            <div class="stat-card__glow"></div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="8">
          <div class="stat-card stat-card--amber">
            <div class="stat-card__icon-wrapper">
              <el-icon class="stat-card__icon"><Calendar /></el-icon>
            </div>
            <div class="stat-card__info">
              <span class="stat-card__label">今日新增灵感</span>
              <span class="stat-card__value">{{ todayCount }}</span>
            </div>
            <div class="stat-card__glow"></div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="8">
          <div class="stat-card stat-card--purple">
            <div class="stat-card__icon-wrapper">
              <el-icon class="stat-card__icon"><Document /></el-icon>
            </div>
            <div class="stat-card__info">
              <span class="stat-card__label">待补充详细描述</span>
              <span class="stat-card__value">{{ pendingDetailCount }}</span>
            </div>
            <div class="stat-card__glow"></div>
          </div>
        </el-col>
      </el-row>

      <ListPageLayout class="design-request-page">
        <!-- 控制与过滤工具栏 -->
        <template #filter>
          <div class="control-toolbar">
            <div class="control-toolbar__actions">
              <el-button type="primary" :icon="Plus" class="action-btn action-btn--primary" @click="handleAdd">
                新增灵感
              </el-button>
              <el-button 
                type="danger" 
                plain
                :icon="Delete" 
                :loading="deleteLoading" 
                class="action-btn"
                :disabled="!ids.length"
                @click="handleDelete(null)"
              >
                批量删除 ({{ ids.length }})
              </el-button>
            </div>
            
            <div class="control-toolbar__search-and-view">
              <!-- 模糊搜索框 -->
              <el-input
                v-model="searchQuery"
                placeholder="搜索灵感名称、描述、上传者..."
                class="search-input"
                clearable
                :prefix-icon="Search"
              />

              <!-- 双视图模式切换器 -->
              <el-radio-group v-model="viewMode" size="default" class="view-mode-switch">
                <el-radio-button value="card">
                  <el-icon class="mr-1"><Grid /></el-icon>看板
                </el-radio-button>
                <el-radio-button value="table">
                  <el-icon class="mr-1"><List /></el-icon>列表
                </el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </template>

        <!-- 主体数据展现区 -->
        <template #table>
          <div class="display-area-wrapper">
            <!-- 1. 灵感看板卡片视图 (Card Grid View) -->
            <transition name="fade-slide" mode="out-in">
              <div v-if="viewMode === 'card'" class="inspiration-card-grid">
                <template v-if="filteredDataSource.length > 0">
                  <div 
                    v-for="row in filteredDataSource" 
                    :key="row.id" 
                    class="inspiration-card"
                  >
                    <!-- 卡片顶部：渐变头像与右上角浮动操作栏 -->
                    <div class="inspiration-card__header">
                      <div class="inspiration-avatar" :style="{ background: getInitialsColor(row.name) }">
                        {{ (row.name || '💡').charAt(0).toUpperCase() }}
                      </div>
                      <div class="inspiration-card__actions">
                        <el-tooltip content="编辑灵感" placement="top">
                          <el-button circle size="small" class="card-action-btn" @click.stop="handleEdit(row)">
                            <el-icon><EditPen /></el-icon>
                          </el-button>
                        </el-tooltip>
                        <el-tooltip content="删除灵感" placement="top">
                          <el-button circle size="small" type="danger" plain class="card-action-btn card-action-btn--delete" @click.stop="handleDelete(row)">
                            <el-icon><Delete /></el-icon>
                          </el-button>
                        </el-tooltip>
                      </div>
                    </div>

                    <!-- 卡片主体：创意名称及描述 -->
                    <div class="inspiration-card__body">
                      <h4 class="inspiration-title" :title="row.name">{{ row.name }}</h4>
                      <p class="inspiration-desc" :class="{ 'inspiration-desc--empty': !row.description }">
                        {{ row.description || '暂无详细描述，点击右上角进行编辑补充吧...' }}
                      </p>
                    </div>

                    <!-- 卡片底部：上传者和时间标签 -->
                    <div class="inspiration-card__footer">
                      <div class="uploader-badge" :title="row.uploader?.account || row.uploader?.name || '未知上传者'">
                        <el-icon class="uploader-badge__icon"><UserIcon /></el-icon>
                        <span class="uploader-badge__text">
                          {{ row.uploader?.name || row.uploader?.account || row.userId || '管理员' }}
                        </span>
                      </div>
                      <div class="time-badge">
                        <el-icon class="time-badge__icon"><Timer /></el-icon>
                        <span class="time-badge__text">{{ formatDateTime(row.createTime) }}</span>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="empty-state">
                    <el-empty description="没有找到匹配的灵感创意，换个词试试吧" :image-size="120" />
                  </div>
                </template>
              </div>

              <!-- 2. 精细表格视图 (Table View) -->
              <div v-else class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat">
                <div class="list-page-table-panel__body">
                  <div class="common-table">
                    <vxe-grid
                      v-bind="gridOptions"
                      :data="filteredDataSource"
                      :loading="loading"
                      @checkbox-change="checkboxChange"
                      @checkbox-all="checkboxAllChange"
                    >
                      <template #operationDefaultSlot="{ row }">
                        <div class="flex justify-start">
                          <el-dropdown class="operation-dropdown" placement="bottom-end">
                            <el-button type="primary" link size="small" class="operation-trigger-button">操作</el-button>
                            <template #dropdown>
                              <el-dropdown-menu class="operation-menu-compact">
                                <el-dropdown-item @click="handleEdit(row)">编辑</el-dropdown-item>
                                <el-dropdown-item divided @click="handleDelete(row)" class="operation-menu-item--danger">删除</el-dropdown-item>
                              </el-dropdown-menu>
                            </template>
                          </el-dropdown>
                        </div>
                      </template>
                      <template #nameSlot="{ row }">
                        <div class="text-wrap font-semibold" style="max-width: 200px; word-break: break-all;">
                          {{ row.name }}
                        </div>
                      </template>
                      <template #descriptionSlot="{ row }">
                        <div class="text-wrap text-gray-500" style="max-width: 300px; word-break: break-all;">
                          {{ row.description || '-' }}
                        </div>
                      </template>
                      <template #uploaderSlot="{ row }">
                        <span>{{ row.uploader?.account || row.uploader?.name || row.userId || '-' }}</span>
                      </template>
                      <template #phoneNumberSlot="{ row }">
                        <span>{{ row.phoneNumber || '-' }}</span>
                      </template>
                      <template #emailSlot="{ row }">
                        <span>{{ row.email || '-' }}</span>
                      </template>
                      <template #createTimeSlot="{ row }">
                        <span class="table-time-text">{{ formatDateTime(row.createTime) }}</span>
                      </template>
                      <template #updateTimeSlot="{ row }">
                        <span class="table-time-text">{{ formatDateTime(row.updateTime) }}</span>
                      </template>
                    </vxe-grid>
                  </div>
                </div>
              </div>
            </transition>
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

      <!-- 新增/编辑设计请求弹出表单 -->
      <el-dialog
        :title="dialogTitle"
        v-model="dialogVisible"
        width="560px"
        class="premium-dialog"
        @close="dialogClose"
        align-center
      >
        <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="premium-form">
          <el-form-item label="设计灵感/请求名称" prop="name" class="form-item-glow">
            <el-input 
              v-model="form.name" 
              placeholder="例如：万圣节Q版可爱小南瓜贴图" 
              maxlength="100"
              show-word-limit
              :prefix-icon="EditPen"
            />
            <span class="input-tip">起一个简短且具代表性的名字，方便以后快速检索。</span>
          </el-form-item>
          
          <el-form-item label="详细要求与描述" prop="description" class="form-item-glow">
            <el-input 
              v-model="form.description" 
              type="textarea" 
              :rows="4"
              placeholder="在这里记下你的核心元素、配色灵感、使用场景或是参考的设计风格..." 
              maxlength="1000"
              show-word-limit
            />
            <span class="input-tip">可以包含主体细节、喜欢的材质、或者针对哪些POD商品设计等。</span>
          </el-form-item>
          
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="联系电话" prop="phoneNumber" class="form-item-glow">
                <el-input 
                  v-model="form.phoneNumber" 
                  placeholder="提供电话（选填）" 
                  maxlength="20"
                  :prefix-icon="Phone"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系邮箱" prop="email" class="form-item-glow">
                <el-input 
                  v-model="form.email" 
                  placeholder="提供邮箱（选填）" 
                  maxlength="100"
                  :prefix-icon="Message"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogVisible = false" class="footer-btn">取消</el-button>
            <el-button type="primary" @click="submitForm" :loading="submitLoading" class="footer-btn footer-btn--primary">确定</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, Search, Grid, List, Timer, User as UserIcon, Phone, Message, EditPen, Document, Calendar } from '@element-plus/icons-vue'
import { getDesignRequestList, createDesignRequest, updateDesignRequest, deleteDesignRequest } from '@/api/designRequest'
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from '@/common/table'
import ContentWrap from '@/components/ContentWrap/src/ContentWrap.vue'
import ListPageLayout from '@/components/ListPageLayout/index.vue'
import Pagination from '@/components/Pagination/index.vue'

// 视图模式: card看板, table表格列表
const viewMode = ref<'card' | 'table'>('card')

// 搜索过滤查询词
const searchQuery = ref('')

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20
})

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: 'checkbox', width: 50 },
    { title: 'ID', field: 'id', width: 80 },
    { title: '请求名称', field: 'name', minWidth: 200, slots: { default: 'nameSlot' } },
    { title: '详细描述', field: 'description', minWidth: 300, slots: { default: 'descriptionSlot' } },
    { title: '上传者', field: 'uploader', width: 120, slots: { default: 'uploaderSlot' } },
    { title: '联系电话', field: 'phoneNumber', width: 120, slots: { default: 'phoneNumberSlot' } },
    { title: '联系邮箱', field: 'email', width: 150, slots: { default: 'emailSlot' } },
    { ...buildTimeColumn('创建时间', 'createTime', 160), slots: { default: 'createTimeSlot' } },
    { ...buildTimeColumn('更新时间', 'updateTime', 160), slots: { default: 'updateTimeSlot' } },
    buildOperationColumn('operationDefaultSlot')
  ]
})

const dataSource = ref<any[]>([])
const loading = ref(false)
const ids = ref<string[]>([])
const total = ref(0)
const deleteLoading = ref(false)
const formRef = ref()
const dialogTitle = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref<{
  id?: string
  name: string
  description: string
  phoneNumber: string
  email: string
}>({
  name: '',
  description: '',
  phoneNumber: '',
  email: ''
})
const submitLoading = ref(false)

// 计算看板统计数据
const todayCount = computed(() => {
  const today = new Date().toDateString();
  return dataSource.value.filter((item: any) => {
    if (!item.createTime) return false;
    return new Date(item.createTime).toDateString() === today;
  }).length;
})

const pendingDetailCount = computed(() => {
  return dataSource.value.filter((item: any) => !item.description).length;
})

// 本地模糊过滤数据源
const filteredDataSource = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return dataSource.value;
  return dataSource.value.filter((item: any) => {
    return (
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.phoneNumber && item.phoneNumber.includes(query)) ||
      (item.uploader?.account && item.uploader.account.toLowerCase().includes(query)) ||
      (item.uploader?.name && item.uploader.name.toLowerCase().includes(query))
    );
  });
})

// 头像色彩哈希渐变
function getInitialsColor(name: string) {
  if (!name) return 'linear-gradient(135deg, #a0cfff 0%, #409eff 100%)';
  const presets = [
    'linear-gradient(135deg, #7F7FD5 0%, #86A8E7 50%, #91EAE4 100%)', // 冰蓝青黛
    'linear-gradient(135deg, #FEB692 0%, #EA5455 100%)', // 暖红
    'linear-gradient(135deg, #CE9FFC 0%, #7367F0 100%)', // 魅紫
    'linear-gradient(135deg, #81FBB8 0%, #28C76F 100%)', // 翠绿
    'linear-gradient(135deg, #FFD26F 0%, #3677FF 100%)', // 耀金深蓝
    'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECOEF 100%)', // 柔粉
    'linear-gradient(135deg, #E2B0FF 0%, #9F44D3 100%)', // 薰衣草
    'linear-gradient(135deg, #5EFCE8 0%, #7367F0 100%)', // 湖青紫
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % presets.length;
  return presets[index];
}

// 格式化日期时间
function formatDateTime(dateStr: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function getList() {
  loading.value = true
  try {
    const params = { 
      page: queryParams.currentPage,
      pageSize: queryParams.pageSize
    }
    const res = await getDesignRequestList(params)
    dataSource.value = res.list || []
    total.value = res.total || 0
    ids.value = []
  } catch (error) {
    console.error('获取列表失败:', error)
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  isEdit.value = false
  dialogVisible.value = true
  dialogTitle.value = '新增创意灵感'
  form.value = {
    name: '',
    description: '',
    phoneNumber: '',
    email: ''
  }
}

onMounted(getList)

function checkboxChange(e) {
  ids.value = e.records.map((item) => item.id)
}

function checkboxAllChange(e) {
  ids.value = e.records.map((item) => item.id)
}

function handleEdit(row) {
  isEdit.value = true
  dialogVisible.value = true
  dialogTitle.value = '编辑创意灵感'
  form.value = { 
    id: row.id,
    name: row.name,
    description: row.description || '',
    phoneNumber: row.phoneNumber || '',
    email: row.email || ''
  }
}

function handleDelete(row?) {
  let delIds: string[] = []
  if (row) {
    delIds = [row.id]
  } else if (!ids.value.length) {
    return ElMessage.warning('请选择要删除的数据')
  } else {
    delIds = [...ids.value]
  }
  
  ElMessageBox.confirm(
    `确认删除选中的 ${delIds.length} 条灵感吗？此操作无法撤销。`, 
    '删除灵感提示', 
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '暂不删除',
      confirmButtonClass: 'el-button--danger',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        deleteLoading.value = true
        for (const id of delIds) {
          await deleteDesignRequest(id)
        }
        ElMessage.success('已删除灵感创意')
        getList()
      } catch (error) {
        console.error('删除失败:', error)
        ElMessage.error('删除失败')
      } finally {
        deleteLoading.value = false
      }
    })
    .catch(() => {})
}

const rules = {
  name: [
    { required: true, message: '请输入灵感名称', trigger: 'blur' },
    { min: 1, max: 100, message: '请求名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 1000, message: '描述长度不能超过 1000 个字符', trigger: 'blur' }
  ],
  phoneNumber: [
    { max: 20, message: '联系电话长度不能超过 20 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
    { max: 100, message: '邮箱长度不能超过 100 个字符', trigger: 'blur' }
  ]
}

const dialogClose = () => {
  dialogVisible.value = false
  submitLoading.value = false
  formRef.value?.resetFields()
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (isEdit.value) {
      await updateDesignRequest(form.value.id!, {
        name: form.value.name,
        description: form.value.description,
        phoneNumber: form.value.phoneNumber,
        email: form.value.email
      })
      ElMessage.success('更新创意成功')
    } else {
      await createDesignRequest({
        name: form.value.name,
        description: form.value.description,
        phoneNumber: form.value.phoneNumber,
        email: form.value.email
      })
      ElMessage.success('记录新创意成功')
    }
    
    getList()
    dialogVisible.value = false
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.design-request-container {
  padding: 12px 16px;
  background-color: #fafbfc;
  min-height: calc(100vh - 110px);
}

/* 顶部统计卡片 */
.stats-header {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 20px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(235, 238, 245, 0.8);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  margin-bottom: 12px;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}

.stat-card__icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 14px;
  margin-right: 18px;
  font-size: 22px;
  z-index: 2;
}

.stat-card--blue .stat-card__icon-wrapper {
  background-color: rgba(64, 158, 255, 0.08);
  color: #409eff;
}

.stat-card--amber .stat-card__icon-wrapper {
  background-color: rgba(230, 162, 60, 0.08);
  color: #e6a23c;
}

.stat-card--purple .stat-card__icon-wrapper {
  background-color: rgba(155, 109, 255, 0.08);
  color: #9b6dff;
}

.stat-card__info {
  display: flex;
  flex-direction: column;
  z-index: 2;
}

.stat-card__label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
  font-weight: 500;
}

.stat-card__value {
  font-size: 26px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.2;
}

.stat-card__glow {
  position: absolute;
  right: -20px;
  bottom: -20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.15;
  pointer-events: none;
  z-index: 1;
}

.stat-card--blue .stat-card__glow { background-color: #409eff; }
.stat-card--amber .stat-card__glow { background-color: #e6a23c; }
.stat-card--purple .stat-card__glow { background-color: #9b6dff; }

/* 页面布局定制 */
:deep(.design-request-page) {
  gap: 12px;
  padding: 0;
}

:deep(.design-request-page .list-page-layout__main) {
  gap: 12px;
}

/* 控制工具栏 */
.control-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  background: #ffffff;
  padding: 16px 20px;
  border-radius: 16px;
  border: 1px solid rgba(235, 238, 245, 0.8);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.01);
}

.control-toolbar__actions {
  display: flex;
  gap: 10px;
}

.control-toolbar__search-and-view {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 260px;
}

:deep(.search-input .el-input__wrapper) {
  border-radius: 20px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.25s;
  padding-left: 12px;
}

:deep(.search-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset, 0 0 8px rgba(64, 158, 255, 0.15);
}

.view-mode-switch {
  border-radius: 20px;
  padding: 2px;
  background: #f0f2f5;
}

:deep(.view-mode-switch .el-radio-button__inner) {
  border-radius: 18px !important;
  border: none !important;
  box-shadow: none !important;
  height: 32px;
  line-height: 32px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 13px;
  background: transparent;
  color: #606266;
}

:deep(.view-mode-switch .el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #ffffff;
  color: #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
}

.action-btn {
  border-radius: 20px;
  font-weight: 500;
  padding: 8px 18px;
}

.action-btn--primary {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
  transition: all 0.25s;
}

.action-btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.35);
}

/* 灵感看板卡片 Grid */
.display-area-wrapper {
  margin-top: 4px;
}

.inspiration-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 4px 0;
}

.inspiration-card {
  position: relative;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(235, 238, 245, 0.8);
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 240px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.015);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
}

.inspiration-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
  border-color: rgba(64, 158, 255, 0.2);
}

/* 卡片顶部和浮动操作 */
.inspiration-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.inspiration-avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 18px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.inspiration-card__actions {
  opacity: 0;
  transform: translateY(4px);
  display: flex;
  gap: 6px;
  transition: all 0.25s ease;
}

.inspiration-card:hover .inspiration-card__actions {
  opacity: 1;
  transform: translateY(0);
}

.card-action-btn {
  background: #f5f7fa;
  border: none;
  color: #606266;
  transition: all 0.2s;
}

.card-action-btn:hover {
  background: #e1e6eb;
  color: #409eff;
}

.card-action-btn--delete:hover {
  background: #fef0f0;
  color: #f56c6c;
}

/* 卡片主体 */
.inspiration-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.inspiration-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.inspiration-desc {
  font-size: 13px;
  color: #5e6d82;
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  height: 82px;
}

.inspiration-desc--empty {
  color: #c0c4cc;
  font-style: italic;
}

/* 卡片底部 */
.inspiration-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  margin-top: auto;
  border-top: 1px dashed #f0f2f5;
}

.uploader-badge, .time-badge {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #909399;
  max-width: 110px;
}

.uploader-badge__icon, .time-badge__icon {
  margin-right: 4px;
  font-size: 12px;
}

.uploader-badge__text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.time-badge {
  max-width: 140px;
}

.time-badge__text {
  white-space: nowrap;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 40px 0;
}

/* 表格定制 */
.list-page-panel--flat {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(235, 238, 245, 0.8);
}

.text-wrap {
  white-space: normal;
  line-height: 1.5;
}

/* 动效 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 弹出表单美化 */
:deep(.premium-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.premium-dialog .el-dialog__header) {
  padding: 24px 24px 10px;
  margin-right: 0;
  border-bottom: 1px solid #f0f2f5;
}

:deep(.premium-dialog .el-dialog__title) {
  font-weight: 600;
  font-size: 17px;
  color: #2c3e50;
}

:deep(.premium-dialog .el-dialog__body) {
  padding: 24px 24px 10px;
}

.premium-form {
  margin-bottom: 0;
}

:deep(.premium-form .el-form-item__label) {
  font-weight: 600;
  font-size: 13px;
  color: #303133;
  padding-bottom: 6px;
}

:deep(.premium-form .el-input__wrapper),
:deep(.premium-form .el-textarea__inner) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.25s;
}

:deep(.premium-form .el-input__wrapper:hover),
:deep(.premium-form .el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

:deep(.premium-form .el-input__wrapper.is-focus),
:deep(.premium-form .el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #409eff inset, 0 0 8px rgba(64, 158, 255, 0.15) !important;
}

.input-tip {
  font-size: 11px;
  color: #a8abb2;
  margin-top: 4px;
  display: inline-block;
  line-height: 1.3;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 24px 24px;
}

.footer-btn {
  border-radius: 20px;
  padding: 10px 22px;
  font-weight: 500;
}

.footer-btn--primary {
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.2);
}
</style>
