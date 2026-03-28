<template>
  <ContentWrap>
    <div class="flex items-center justify-between gap-3 py-3">
      <div class="text-sm text-[var(--el-text-color-secondary)]">
        统一维护飞书、企业微信机器人 webhook，并提供开放发送接口。
      </div>
      <el-button type="primary" @click="openDialog()">新增渠道</el-button>
    </div>

    <div class="common-table">
      <vxe-grid v-bind="gridOptions" :data="list" :loading="loading">
        <template #platformSlot="{ row }">
          <el-tag :type="row.platform === 'feishu' ? 'success' : 'warning'">
            {{ platformLabelMap[row.platform] || row.platform }}
          </el-tag>
        </template>

        <template #enabledSlot="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'">
            {{ row.enabled ? '启用' : '停用' }}
          </el-tag>
        </template>

        <template #webhookSlot="{ row }">
          <div class="message-push-url">{{ maskWebhook(row.webhookUrl) }}</div>
        </template>

        <template #remarkSlot="{ row }">
          <span>{{ row.remark || '-' }}</span>
        </template>

        <template #createTimeSlot="{ row }">
          <span>{{ formatDate(row.createTime) }}</span>
        </template>

        <template #operationSlot="{ row }">
          <div class="flex items-center justify-end gap-3">
            <el-button link type="primary" @click="openTestDialog(row)">测试发送</el-button>
            <el-button link type="primary" @click="openDialog(row.id)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
          </div>
        </template>
      </vxe-grid>
    </div>

    <MessagePushDialog ref="dialogRef" @success="getList" />
    <MessagePushTestDialog ref="testDialogRef" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteMessagePush,
  getMessagePushList,
  type MessagePushConfig,
  type MessagePushPlatform
} from '@/api/messagePush'
import { commonGridOptions } from '@/common/table'
import { formatDate } from '@/utils/formatTime'
import MessagePushDialog from './components/MessagePushDialog.vue'
import MessagePushTestDialog from './components/MessagePushTestDialog.vue'

const loading = ref(false)
const list = ref<MessagePushConfig[]>([])
const dialogRef = ref()
const testDialogRef = ref()

const platformLabelMap: Record<MessagePushPlatform, string> = {
  feishu: '飞书',
  wecom: '企业微信'
}

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { title: 'ID', field: 'id', width: 80 },
    { title: '渠道名称', field: 'name', minWidth: 160 },
    { title: '渠道编码', field: 'code', minWidth: 160 },
    { title: '平台', field: 'platform', width: 120, slots: { default: 'platformSlot' } },
    { title: '状态', field: 'enabled', width: 100, slots: { default: 'enabledSlot' } },
    { title: 'Webhook', field: 'webhookUrl', minWidth: 360, slots: { default: 'webhookSlot' } },
    { title: '备注', field: 'remark', minWidth: 220, showOverflow: 'tooltip', slots: { default: 'remarkSlot' } },
    { title: '创建时间', field: 'createTime', width: 180, slots: { default: 'createTimeSlot' } },
    { title: '操作', field: 'operation', width: 220, fixed: 'right', slots: { default: 'operationSlot' } }
  ]
})

const maskWebhook = (url?: string) => {
  const value = String(url || '').trim()
  if (!value) return '-'
  if (value.length <= 36) return value
  return `${value.slice(0, 20)}...${value.slice(-12)}`
}

const getList = async () => {
  loading.value = true
  try {
    const data = await getMessagePushList()
    list.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
}

const openDialog = (id?: number) => {
  dialogRef.value?.open(id)
}

const openTestDialog = (row: MessagePushConfig) => {
  testDialogRef.value?.open({
    id: Number(row.id),
    name: row.name,
    code: row.code
  })
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认删除该推送渠道吗？删除后开放 API 将无法再通过该编码发送。', '提示', {
      type: 'warning'
    })
    await deleteMessagePush(id)
    ElMessage.success('删除成功')
    await getList()
  } catch {}
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.message-push-url {
  line-height: 1.5;
  word-break: break-all;
}
</style>
