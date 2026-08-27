<template>
  <div class="empty-state">
    <header class="empty-state__intro">
      <p class="empty-state__eyebrow">COLLABORATION</p>
      <h1 class="empty-state__title">从一个组织开始协作</h1>
      <p class="empty-state__subtitle">创建自己的工作空间，或使用邀请码加入已有团队。</p>
    </header>

    <div class="empty-state__actions">
      <button class="action-card action-card--primary" type="button" @click="showCreateDialog = true">
        <span class="action-card__icon" aria-hidden="true">+</span>
        <span class="action-card__body">
          <strong>创建组织</strong>
          <span>我是团队发起人，创建后将成为组织所有者。</span>
        </span>
        <span class="action-card__arrow" aria-hidden="true">→</span>
      </button>
      <button class="action-card" type="button" @click="showJoinDialog = true">
        <span class="action-card__icon action-card__icon--join" aria-hidden="true">↗</span>
        <span class="action-card__body">
          <strong>加入组织</strong>
          <span>已有邀请码？加入团队并与成员共同协作。</span>
        </span>
        <span class="action-card__arrow" aria-hidden="true">→</span>
      </button>
    </div>

    <p class="empty-state__hint">每个账号同一时间只能属于一个组织。</p>

    <!-- 创建组织弹窗 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建组织"
      width="400px"
      align-center
      :close-on-click-modal="false"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-position="top"
      >
        <el-form-item label="组织名称" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="请输入组织名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="组织简介（可选）" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="2"
            placeholder="简单描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreate">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 加入组织弹窗 -->
    <el-dialog
      v-model="showJoinDialog"
      title="加入组织"
      width="400px"
      align-center
      :close-on-click-modal="false"
    >
      <el-form
        ref="joinFormRef"
        :model="joinForm"
        :rules="joinRules"
        label-position="top"
      >
        <el-form-item label="邀请码" prop="inviteCode">
          <el-input
            v-model="joinForm.inviteCode"
            placeholder="请输入邀请码"
            maxlength="20"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showJoinDialog = false">取消</el-button>
        <el-button type="primary" :loading="joinLoading" @click="handleJoin">
          加入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { selfCreateCompany, joinCompanyByCode } from '@/api/company'
import { useMessage } from '@/hooks/web/useMessage'

const { success, error } = useMessage()

const emit = defineEmits<{
  created: []
  joined: []
}>()

// 创建组织
const showCreateDialog = ref(false)
const createFormRef = ref<FormInstance>()
const createLoading = ref(false)
const createForm = reactive({
  name: '',
  description: '',
})
const createRules: FormRules = {
  name: [
    { required: true, message: '请输入组织名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2-50 个字符', trigger: 'blur' },
  ],
}

async function handleCreate() {
  if (!createFormRef.value) return
  await createFormRef.value.validate(async (valid) => {
    if (!valid) return
    createLoading.value = true
    try {
      await selfCreateCompany({
        name: createForm.name,
        description: createForm.description || undefined,
      })
      success('组织创建成功')
      showCreateDialog.value = false
      createForm.name = ''
      createForm.description = ''
      emit('created')
    } catch (err: any) {
      error(err.message || '创建失败')
    } finally {
      createLoading.value = false
    }
  })
}

// 加入组织
const showJoinDialog = ref(false)
const joinFormRef = ref<FormInstance>()
const joinLoading = ref(false)
const joinForm = reactive({
  inviteCode: '',
})
const joinRules: FormRules = {
  inviteCode: [
    { required: true, message: '请输入邀请码', trigger: 'blur' },
  ],
}

async function handleJoin() {
  if (!joinFormRef.value) return
  await joinFormRef.value.validate(async (valid) => {
    if (!valid) return
    joinLoading.value = true
    try {
      await joinCompanyByCode({
        inviteCode: joinForm.inviteCode,
      })
      success('成功加入组织')
      showJoinDialog.value = false
      joinForm.inviteCode = ''
      emit('joined')
    } catch (err: any) {
      error(err.message || '加入失败')
    } finally {
      joinLoading.value = false
    }
  })
}
</script>

<style scoped>
.empty-state {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  padding: 56px 24px;
}

.empty-state__intro { max-width: 620px; }
.empty-state__eyebrow {
  margin: 0 0 8px;
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .12em;
}
.empty-state__title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: clamp(28px, 3vw, 36px);
  font-weight: 700;
  letter-spacing: -.03em;
  line-height: 1.2;
}

.empty-state__subtitle {
  margin: 12px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 15px;
  line-height: 1.65;
}

.empty-state__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 34px;
  padding-top: 20px;
  border-top: 1px solid var(--app-content-border-color);
}

.action-card {
  display: flex;
  gap: 16px;
  align-items: center;
  min-height: 136px;
  padding: 22px;
  color: var(--el-text-color-primary);
  text-align: left;
  cursor: pointer;
  border: 0;
  border-radius: 0;
  background: transparent;
  transition: color .16s ease, background-color .16s ease;
}
.action-card:hover {
  background: var(--app-content-surface-muted-color);
}
.action-card:focus-visible {
  outline: none;
  outline: 1px solid var(--el-color-primary);
}
.action-card--primary {
  background: var(--app-content-surface-muted-color);
}
.action-card + .action-card { border-left: 1px solid var(--app-content-border-color); }
.action-card__icon {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: var(--el-color-primary);
  border-radius: 8px;
  background: var(--app-content-surface-muted-color);
  font-size: 25px;
  font-weight: 500;
  line-height: 1;
}
.action-card__icon--join { font-size: 22px; }
.action-card__body { display: grid; gap: 6px; min-width: 0; }
.action-card__body strong { color: var(--el-text-color-primary); font-size: 16px; }
.action-card__body span { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.55; }
.action-card__arrow { margin-left: auto; color: var(--el-text-color-placeholder); font-size: 21px; transition: transform .16s ease; }
.action-card:hover .action-card__arrow { color: var(--el-color-primary); transform: translateX(3px); }
.empty-state__hint { margin: 18px 0 0; color: var(--el-text-color-placeholder); font-size: 12px; }

@media (max-width: 640px) {
  .empty-state { padding: 42px 16px; }
  .empty-state__actions { grid-template-columns: 1fr; }
  .action-card + .action-card { border-top: 1px solid var(--app-content-border-color); border-left: 0; }
  .action-card { min-height: 116px; padding: 18px; }
}
</style>
