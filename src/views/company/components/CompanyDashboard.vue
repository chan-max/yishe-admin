<template>
  <div class="organization-dashboard">
    <header class="organization-hero">
      <div class="organization-hero__identity">
        <div class="organization-hero__avatar" aria-hidden="true">
          {{ company.name?.trim()?.[0] || '组' }}
        </div>
        <div class="organization-hero__copy">
          <p class="organization-hero__eyebrow">我的组织</p>
          <div class="organization-hero__title-row">
            <h1>{{ company.name }}</h1>
            <span class="role-tag" :class="roleClass">{{ roleText }}</span>
          </div>
          <p class="organization-hero__description">
            {{ company.description || '在这里管理团队成员与组织邀请码。' }}
          </p>
          <div class="organization-hero__meta">
            <span>{{ company.memberCount || 0 }} 位团队成员</span>
            <i aria-hidden="true" />
            <span>创建于 {{ formatDate(company.createTime) }}</span>
          </div>
        </div>
      </div>
    </header>

    <div class="organization-dashboard__content">
      <main class="organization-dashboard__main">
        <section class="surface-card members-card">
          <header class="surface-card__header">
            <div>
              <p class="surface-card__eyebrow">TEAM</p>
              <h2>团队成员 <span>{{ company.memberCount || 0 }}</span></h2>
              <p>组织内成员及其当前权限</p>
            </div>
          </header>

          <ul class="member-list" aria-label="团队成员列表">
            <li v-for="member in company.members" :key="member.id" class="member-row">
              <div class="member-row__profile">
                <div class="member-avatar" aria-hidden="true">
                  {{ member.name?.trim()?.[0] || member.account?.[0] || '?' }}
                </div>
                <div class="member-row__identity">
                  <div class="member-row__name-line">
                    <span class="member-row__name">{{ member.name || member.account }}</span>
                    <span v-if="member.id === currentUserId" class="self-tag">我</span>
                  </div>
                  <span class="member-row__account">{{ member.email || member.account }}</span>
                </div>
              </div>

              <div class="member-row__role">
                <span class="member-role" :class="memberRoleClass(member.role)">
                  {{ memberRoleText(member.role) }}
                </span>
              </div>

              <div class="member-row__action">
                <el-button
                  v-if="canRemove(member)"
                  text
                  type="danger"
                  @click="handleRemoveMember(member)"
                >
                  移除
                </el-button>
                <span v-else class="member-row__status">{{ member.id === currentUserId ? '当前登录账号' : '' }}</span>
              </div>
            </li>
          </ul>
        </section>
      </main>

      <aside class="organization-dashboard__aside">
        <section class="surface-card invite-card">
          <header class="surface-card__header surface-card__header--compact">
            <div>
              <p class="surface-card__eyebrow">INVITATION</p>
              <h2>邀请码</h2>
            </div>
            <span class="invite-card__hint">可分享给新成员</span>
          </header>

          <div class="invite-card__code">
            <code>{{ company.inviteCode }}</code>
            <el-button text type="primary" @click="copyInviteCode">复制</el-button>
          </div>
          <el-button
            v-if="company.isOwner"
            class="invite-card__regenerate"
            text
            type="primary"
            @click="handleRegenerate"
          >
            重新生成邀请码
          </el-button>
          <p v-if="company.isOwner" class="invite-card__note">重新生成后，旧邀请码将立即失效。</p>
        </section>

        <section class="surface-card details-card">
          <header class="surface-card__header surface-card__header--compact">
            <div>
              <p class="surface-card__eyebrow">DETAILS</p>
              <h2>组织信息</h2>
            </div>
          </header>
          <dl class="details-list">
            <div>
              <dt>组织名称</dt>
              <dd>{{ company.name }}</dd>
            </div>
            <div>
              <dt>我的角色</dt>
              <dd>{{ roleText }}</dd>
            </div>
            <div v-if="company.description">
              <dt>组织简介</dt>
              <dd class="details-list__description">{{ company.description }}</dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd>{{ formatTime(company.createTime) }}</dd>
            </div>
          </dl>
        </section>

        <section class="danger-zone">
          <div>
            <strong>{{ company.isOwner ? '解散组织' : '退出组织' }}</strong>
            <p>{{ company.isOwner ? '所有成员将解除组织关联。' : '退出后可加入其他组织。' }}</p>
          </div>
          <el-button v-if="company.isOwner" text type="danger" @click="handleDissolve">解散</el-button>
          <el-button v-else text type="danger" @click="handleLeave">退出</el-button>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import { regenerateInviteCode, removeMember, leaveCompany, dissolveCompany } from '@/api/company'
import { useUserStore } from '@/store/modules/user'

const { success, error, confirm } = useMessage()

const props = defineProps<{
  company: any
}>()

const emit = defineEmits<{
  refresh: []
  left: []
  dissolved: []
}>()

const userStore = useUserStore()
const currentUserId = computed(() => userStore.user?.id)

const roleText = computed(() => memberRoleText(props.company.isOwner ? 'owner' : props.company.myRole))
const roleClass = computed(() => `role-tag--${props.company.isOwner ? 'owner' : props.company.myRole || 'member'}`)

function memberRoleText(role?: string) {
  if (role === 'owner') return '所有者'
  if (role === 'admin') return '管理员'
  return '成员'
}

function memberRoleClass(role?: string) {
  return `member-role--${role === 'owner' || role === 'admin' ? role : 'member'}`
}

function canRemove(member: any) {
  return props.company.isOwner && member.id !== currentUserId.value
}

function formatTime(time: string) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(time: string) {
  if (!time) return '-'
  return new Date(time).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

async function copyInviteCode() {
  try {
    await navigator.clipboard.writeText(props.company.inviteCode)
    success('邀请码已复制')
  } catch {
    error('复制失败')
  }
}

async function handleRegenerate() {
  try {
    await confirm('重新生成后，旧邀请码将失效，确定继续吗？', '提示')
    await regenerateInviteCode()
    success('邀请码已更新')
    emit('refresh')
  } catch (err: any) {
    if (err !== 'cancel') error(err.message || '操作失败')
  }
}

async function handleRemoveMember(member: any) {
  try {
    await confirm(`确定移除成员“${member.name || member.account}”吗？`, '移除成员')
    await removeMember(member.id)
    success('成员已移除')
    emit('refresh')
  } catch (err: any) {
    if (err !== 'cancel') error(err.message || '操作失败')
  }
}

async function handleLeave() {
  try {
    await confirm('确定退出组织吗？', '退出组织')
    await leaveCompany()
    success('已退出组织')
    emit('left')
  } catch (err: any) {
    if (err !== 'cancel') error(err.message || '操作失败')
  }
}

async function handleDissolve() {
  try {
    await confirm('解散组织后，所有成员将被解绑，此操作不可恢复！', '解散组织')
    await dissolveCompany()
    success('组织已解散')
    emit('dissolved')
  } catch (err: any) {
    if (err !== 'cancel') error(err.message || '操作失败')
  }
}
</script>

<style scoped>
.organization-dashboard {
  width: 100%;
  max-width: none;
  margin: 0 auto;
  padding: 18px 24px 28px;
  color: var(--el-text-color-primary);
}

.organization-hero {
  padding: 10px 0 22px;
  border-bottom: 1px solid var(--app-content-border-color);
}

.organization-hero__identity {
  display: flex;
  gap: 18px;
  align-items: center;
}

.organization-hero__avatar,
.member-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  color: var(--el-color-primary-dark-2);
  font-weight: 700;
  background: color-mix(in srgb, var(--el-color-primary) 14%, var(--app-content-surface-muted-color));
}

.organization-hero__avatar {
  width: 58px;
  height: 58px;
  border-radius: 17px;
  font-size: 24px;
}

.organization-hero__copy { min-width: 0; }
.organization-hero__eyebrow,
.surface-card__eyebrow {
  margin: 0 0 4px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
}

.organization-hero__title-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.organization-hero h1 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 25px;
  line-height: 1.3;
  font-weight: 700;
}

.organization-hero__description {
  max-width: 720px;
  margin: 6px 0 0;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.6;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.organization-hero__meta {
  display: flex;
  gap: 9px;
  align-items: center;
  margin-top: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.organization-hero__meta i { width: 3px; height: 3px; border-radius: 50%; background: var(--el-text-color-placeholder); }

.role-tag,
.member-role,
.self-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}
.role-tag { padding: 6px 10px; }
.role-tag--owner, .member-role--owner { color: #9a5b00; background: #fff4dc; }
.role-tag--admin, .member-role--admin { color: var(--el-text-color-regular); background: var(--app-content-surface-muted-color); }
.role-tag--member, .member-role--member { color: var(--el-color-primary); background: color-mix(in srgb, var(--el-color-primary) 10%, transparent); }

.organization-dashboard__content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 350px;
  gap: 20px;
  align-items: start;
  margin-top: 20px;
}

.organization-dashboard__aside { display: grid; gap: 0; }
.surface-card {
  overflow: hidden;
  background: transparent;
}
.surface-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0 16px;
}
.surface-card__header--compact { padding-bottom: 14px; }
.surface-card h2 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 17px;
  font-weight: 650;
}
.surface-card h2 span { margin-left: 4px; color: var(--el-text-color-placeholder); font-size: 14px; font-weight: 500; }
.surface-card__header > div > p:last-child { margin: 6px 0 0; color: var(--el-text-color-placeholder); font-size: 13px; }

.member-list { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--app-content-border-color); }
.member-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 86px 88px;
  gap: 14px;
  align-items: center;
  min-height: 76px;
  padding: 12px 0;
  border-bottom: 1px solid var(--app-content-border-color);
  transition: background-color .16s ease;
}
.member-row:last-child { border-bottom: 0; }
.member-row:hover { background: var(--app-content-surface-muted-color); }
.member-row__profile { display: flex; min-width: 0; gap: 12px; align-items: center; }
.member-avatar { width: 38px; height: 38px; border-radius: 50%; font-size: 15px; }
.member-row__identity { display: grid; min-width: 0; gap: 4px; }
.member-row__name-line { display: flex; gap: 7px; align-items: center; min-width: 0; }
.member-row__name { overflow: hidden; color: var(--el-text-color-primary); font-size: 14px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.member-row__account { overflow: hidden; color: var(--el-text-color-placeholder); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.self-tag { padding: 3px 6px; color: var(--el-text-color-regular); background: var(--app-content-surface-muted-color); font-size: 11px; }
.member-row__role { justify-self: start; }
.member-role { padding: 5px 8px; white-space: nowrap; }
.member-row__action { justify-self: end; min-width: 64px; text-align: right; }
.member-row__status { color: var(--el-text-color-placeholder); font-size: 12px; white-space: nowrap; }

.invite-card { padding-bottom: 20px; border-bottom: 1px solid var(--app-content-border-color); }
.invite-card__hint { align-self: center; color: var(--el-text-color-placeholder); font-size: 11px; white-space: nowrap; }
.invite-card__code { display: flex; gap: 8px; align-items: center; padding: 0; }
.invite-card__code code {
  flex: 1;
  min-width: 0;
  padding: 10px 11px;
  overflow: hidden;
  color: var(--el-color-primary);
  border: 0;
  border-radius: 0;
  background: transparent;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .04em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.invite-card__regenerate { width: auto; margin: 10px 0 0; }
.invite-card__note { margin: 10px 0 0; color: var(--el-text-color-placeholder); font-size: 12px; line-height: 1.55; }

.details-card { padding: 18px 0; border-bottom: 1px solid var(--app-content-border-color); }
.details-list { margin: 0; padding: 0; }
.details-list > div { display: grid; grid-template-columns: 78px minmax(0, 1fr); gap: 12px; padding: 9px 0; }
.details-list dt { color: var(--el-text-color-placeholder); font-size: 12px; }
.details-list dd { margin: 0; overflow: hidden; color: var(--el-text-color-regular); font-size: 13px; line-height: 1.45; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
.details-list__description { white-space: normal !important; }

.danger-zone {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0 0;
  background: transparent;
}
.danger-zone strong { display: block; color: var(--el-color-danger); font-size: 13px; }
.danger-zone p { margin: 4px 0 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.4; }

@media (max-width: 900px) {
  .organization-dashboard { padding: 16px 18px 24px; }
  .organization-dashboard__content { grid-template-columns: 1fr; }
  .organization-dashboard__aside { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 28px; }
  .danger-zone { grid-column: 1 / -1; }
}

:global(html.dark) .role-tag--owner,
:global(html.dark) .member-role--owner {
  color: #fcd34d;
  background: rgba(180, 83, 9, .24);
}

@media (max-width: 640px) {
  .organization-dashboard { padding: 16px; }
  .organization-hero { padding: 8px 0 18px; }
  .organization-hero__identity { align-items: flex-start; }
  .organization-hero__avatar { width: 46px; height: 46px; border-radius: 14px; font-size: 20px; }
  .organization-hero h1 { font-size: 21px; }
  .organization-hero__description { white-space: normal; }
  .organization-dashboard__aside { grid-template-columns: 1fr; }
  .member-row { grid-template-columns: minmax(0, 1fr) auto; min-height: 70px; padding: 12px 16px; }
  .member-row__role { display: none; }
  .member-row__action { min-width: 0; }
  .surface-card__header { padding: 10px 0 14px; }
  .invite-card__code { padding: 0; }
  .invite-card__regenerate { width: auto; margin: 10px 0 0; }
  .invite-card__note { margin-right: 0; margin-left: 0; }
  .details-list { padding-right: 0; padding-left: 0; }
}
</style>
