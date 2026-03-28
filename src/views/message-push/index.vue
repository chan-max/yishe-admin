<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="message-push-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="list-page-filter__row">
            <div class="text-[12px] leading-[1.6] text-[var(--el-text-color-secondary)]">
              统一维护飞书、企业微信机器人 webhook，并提供开放发送接口。
            </div>
            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" @click="openDialog()">新增渠道</el-button>
            </div>
          </div>
        </div>
      </template>

      <template #table>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat">
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid v-bind="gridOptions" :data="list" :loading="loading">
                <template #platformSlot="{ row }">
                  <el-tag size="small" :type="row.platform === 'feishu' ? 'success' : 'warning'">
                    {{ platformLabelMap[row.platform] || row.platform }}
                  </el-tag>
                </template>

                <template #enabledSlot="{ row }">
                  <el-tag size="small" :type="row.enabled ? 'success' : 'info'">
                    {{ row.enabled ? '启用' : '停用' }}
                  </el-tag>
                </template>

                <template #webhookSlot="{ row }">
                  <div class="message-push-url">{{ maskWebhook(row.webhookUrl) }}</div>
                </template>

                <template #remarkSlot="{ row }">
                  <span class="table-meta-text">{{ row.remark || '-' }}</span>
                </template>

                <template #operationDefaultSlot="{ row }">
                  <div class="flex justify-end">
                    <el-dropdown
                      trigger="click"
                      class="operation-dropdown"
                      @command="(command) => handleOperationCommand(command, row)"
                    >
                      <el-button type="primary" link size="small" class="operation-trigger-button">
                        操作
                        <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="test">
                            <span>测试发送</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="edit">
                            <span>编辑</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="delete" divided>
                            <span>删除</span>
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </template>
              </vxe-grid>
            </div>
          </div>
        </div>
      </template>
    </ListPageLayout>

    <MessagePushDialog ref="dialogRef" @success="getList" />
    <MessagePushTestDialog ref="testDialogRef" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteMessagePush,
  getMessagePushList,
  type MessagePushConfig,
  type MessagePushPlatform
} from '@/api/messagePush'
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from '@/common/table'
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
    buildTimeColumn('创建时间', 'createTime'),
    buildOperationColumn('operationDefaultSlot')
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

const handleOperationCommand = (command: string, row: MessagePushConfig) => {
  if (command === 'test') {
    openTestDialog(row)
    return
  }
  if (command === 'edit') {
    openDialog(row.id)
    return
  }
  if (command === 'delete') {
    handleDelete(row.id as number)
  }
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
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}

:deep(.message-push-page .list-page-filter--flat) {
  padding-bottom: 12px;
}
</style>
