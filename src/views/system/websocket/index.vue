<template>
  <div class="flex flex-col gap-4 p-4">
    <ContentWrap>
      <div class="flex flex-wrap items-start justify-between gap-3 py-3">
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <el-button type="primary" @click="fetchConnections" :loading="loading">
            <Icon icon="ep:refresh" class="mr-5px" /> 刷新
          </el-button>
          <el-switch v-model="autoRefresh" active-text="自动刷新" />
          <span class="text-sm text-[var(--el-text-color-secondary)]">当前展示为 WebSocket 网关 `/ws` 的实时连接</span>
        </div>
        <div class="flex shrink-0 items-center gap-1.5">
          <el-tag :type="adminWsStatusTag.type" size="small">
            管理后台: {{ adminWsStatusTag.text }}
          </el-tag>
          <span v-if="adminConnectionId" class="admin-connection-id">ID: {{ adminConnectionId }}</span>
        </div>
      </div>

      <el-empty v-if="!loading && connections.length === 0" description="暂无连接" />

      <div v-else class="common-table">
        <vxe-grid
          v-bind="gridOptions"
          :data="connections"
          :loading="loading"
          ref="gridRef"
        >
          <template #duration_default="{ row }">
            {{ formatPast(row.connectedAt) }}
          </template>
          <template #clientSource_default="{ row }">
            <el-tag v-if="row.clientSource === 'yishe-extension'" type="success" size="small">
              浏览器插件
            </el-tag>
            <el-tag v-else-if="row.clientSource" type="success" size="small">
              {{ row.clientSource }}
            </el-tag>
            <span v-else>-</span>
          </template>
          <template #ip_default="{ row }">
            {{ row.ip || '-' }}
          </template>
          <template #ua_default="{ row }">
            {{ row.userAgent || '-' }}
          </template>
          <template #clientInfo_default="{ row }">
            {{ formatClientInfo(row.clientInfo) }}
          </template>
          <template #query_default="{ row }">
            {{ formatQuery(row.query) }}
          </template>
          <template #operation_default="{ row }">
            <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)">
              <el-button type="primary" link size="small">
                操作
                <Icon icon="ep:arrow-down" class="ml-5px" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="send-message">
                    <Icon icon="ep:message" class="mr-5px" />
                    发送消息
                  </el-dropdown-item>
                  <el-dropdown-item command="control" divided>
                    <Icon icon="ep:setting" class="mr-5px" />
                    操控
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </vxe-grid>
      </div>
    </ContentWrap>

    <!-- 操控全屏弹窗 -->
    <el-dialog
      v-model="controlDialogVisible"
      title="连接操控"
      fullscreen
      :close-on-click-modal="false"
      class="control-dialog"
    >
      <div class="control-dialog-content">
        <div class="control-dialog-header">
          <div class="control-connection-info">
            <div class="connection-info-left">
              <div class="connection-id">
                <span class="label">连接 ID：</span>
                <span class="value">{{ currentConnection?.id || '-' }}</span>
              </div>
              <div class="connection-meta">
                <span class="meta-item">
                  <Icon icon="ep:location" class="mr-4px" />
                  {{ currentConnection?.ip || '-' }}
                </span>
                <span class="meta-item">
                  <Icon icon="ep:clock" class="mr-4px" />
                  {{ currentConnection?.connectedAt ? formatPast(currentConnection.connectedAt) : '-' }}
                </span>
                <span class="meta-item" v-if="currentConnection?.namespace">
                  <Icon icon="ep:folder" class="mr-4px" />
                  {{ currentConnection.namespace }}
                </span>
              </div>
            </div>
            <div class="connection-info-right">
                <el-tag v-if="currentConnection?.clientSource === 'yishe-extension'" type="success" size="small">
                <Icon icon="ep:chrome-filled" class="mr-4px" />
                  浏览器插件
                </el-tag>
              <el-tag v-else-if="currentConnection?.clientSource" type="info" size="small">
                {{ currentConnection.clientSource }}
              </el-tag>
              <div class="connection-time" v-if="currentConnection?.connectedAt">
                {{ formatDate(new Date(currentConnection.connectedAt)) }}
              </div>
            </div>
          </div>
        </div>

        <div class="control-dialog-body">
          <vxe-grid
            v-if="currentConnection?.clientSource === 'yishe-extension'"
            v-bind="functionGridOptions"
            :data="functionList"
            class="function-grid"
          >
            <template #icon_default="{ row }">
              <div class="function-icon-cell">
                <Icon :icon="row.icon" />
              </div>
            </template>
            <template #schedule_default="{ row }">
              <div v-if="row.schedule" class="schedule-status-cell">
                <div class="schedule-status-row">
                  <el-tag :type="row.schedule.enabled ? 'success' : 'info'" size="small">
                    {{ row.schedule.enabled ? '已启用' : '已禁用' }}
                  </el-tag>
                  <span class="schedule-info-text">{{ formatSchedule(row.schedule) }}</span>
                  </div>
                <div v-if="row.schedule.type" class="schedule-type-text">
                  <el-tag :type="row.schedule.type === 'cron' ? 'primary' : 'success'" size="small" plain>
                    {{ row.schedule.type === 'cron' ? '固定时间点' : '间隔时间' }}
                  </el-tag>
                </div>
              </div>
              <span v-else class="text-gray-400">未设置</span>
                </template>
            <template #operation_default="{ row }">
              <el-dropdown trigger="click" @command="(command) => handleFunctionOperation(command, row)">
                <el-button type="primary" link size="small">
                  操作
                  <Icon icon="ep:arrow-down" class="ml-5px" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="open">
                      <Icon icon="ep:setting" class="mr-5px" />
                      打开配置
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </vxe-grid>

          <el-empty
            v-else
            description="当前连接类型不支持操控功能"
            :image-size="100"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="controlDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>



    <!-- 发送消息对话框 -->
    <el-dialog
      v-model="sendMessageDialogVisible"
      title="发送消息"
      width="500px"
      align-center
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="连接 ID">
          <el-input :value="currentConnection?.id" disabled />
        </el-form-item>
        <el-form-item label="连接类型">
          <el-tag v-if="currentConnection?.clientSource === 'yishe-extension'" type="success" size="small">
            浏览器插件
          </el-tag>
          <el-tag v-else  size="small" type="success">{{ currentConnection?.clientSource || '未知' }}</el-tag>
        </el-form-item>
        <el-form-item label="事件名称">
          <el-input v-model="messageEvent" placeholder="默认为 admin-message" />
        </el-form-item>
        <el-form-item label="消息内容">
          <el-input
            v-model="messageContent"
            type="textarea"
            :rows="6"
            placeholder='请输入消息内容，支持 JSON 格式，如 {"type":"test","message":"Hello"}'
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendMessageDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="sendMessageDialogLoading" @click="handleConfirmSendMessage">
          发送
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, watchEffect } from 'vue'
import type { VxeGridInstance, VxeGridProps } from 'vxe-table'
import { useMessage } from '@/hooks/web/useMessage'
import { formatDate, formatPast } from '@/utils/formatTime'
import { useWindowSize } from '@vueuse/core'
import { commonGridOptions } from '@/common/table'
import * as WebsocketApi from '@/api/system/websocket'
import type {
  WebsocketConnectionVO,
  WebsocketClientInfo,
  ScheduledTask,
  SetTaskDTO,
  TokenUserInfo
} from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

defineOptions({ name: 'SystemWebsocketConnections' })

type WebsocketConnectionRow = WebsocketConnectionVO & {
  __userLookupStatus?: 'idle' | 'loading' | 'success' | 'error'
  __userLookupError?: string
}

interface TokenUserCacheEntry {
  user: TokenUserInfo | null
  error?: string
}

const message = useMessage()

// 管理后台 WebSocket 连接状态
const adminWsStatus = computed(() => websocketClient.state.status)
const adminConnectionId = computed(() => websocketClient.state.connectionId)

const adminWsStatusTag = computed(() => {
  switch (adminWsStatus.value) {
    case 'connected':
      return { text: '已连接', type: 'success' as const, icon: 'ep:success-filled' }
    case 'connecting':
      return { text: '连接中', type: 'warning' as const, icon: 'ep:loading' }
    case 'reconnecting':
      return { text: '重连中', type: 'warning' as const, icon: 'ep:refresh' }
    case 'error':
      return { text: '连接异常', type: 'danger' as const, icon: 'ep:warning-filled' }
    case 'disconnected':
      return { text: '已断开', type: 'info' as const, icon: 'ep:close' }
    default:
      return { text: '未连接', type: 'info' as const, icon: 'ep:circle-close' }
  }
})


const tokenUserCache = reactive<Record<string, TokenUserCacheEntry>>({})
const tokenLookupInFlight = new Map<string, Promise<void>>()

const connections = ref<WebsocketConnectionRow[]>([])
const loading = ref(false)
const autoRefresh = ref(false)
const refreshTimer = ref<number | null>(null)
const refreshInterval = 10_000

// 发送消息对话框
const sendMessageDialogVisible = ref(false)
const sendMessageDialogLoading = ref(false)
const currentConnection = ref<WebsocketConnectionRow | null>(null)
const messageContent = ref('')
const messageEvent = ref('admin-message')


const formatSchedule = (task: ScheduledTask) => {
  if (task.type === 'cron') {
    return task.schedule
  } else {
    const hours = parseFloat(task.schedule)
    if (hours >= 24) {
      return `每 ${Math.floor(hours / 24)} 天`
    } else if (hours >= 1) {
      return `每 ${hours} 小时`
    } else {
      return `每 ${Math.floor(hours * 60)} 分钟`
    }
  }
}


// 操控对话框
const controlDialogVisible = ref(false)

// 功能列表数据
interface ExtensionFunctionItem {
  id: string
  name: string
  description: string
  icon: string
  handler: () => void | Promise<void>
  scheduleCommand?: string
  schedule: ScheduledTask | null
}

const functionList = ref<ExtensionFunctionItem[]>([])

// 加载功能列表中的定时任务信息
const loadFunctionSchedule = async () => {
  if (!currentConnection.value) return

  await Promise.all(
    functionList.value.map(async (func) => {
      if (!func.scheduleCommand) {
        func.schedule = null
        return
      }
      try {
        const response = await WebsocketApi.getScheduleTask(currentConnection.value!.id, func.scheduleCommand)
        func.schedule = response.data
      } catch (error) {
        console.error(`加载定时任务信息失败: ${func.id}`, error)
        func.schedule = null
      }
    })
  )
}

// 功能列表表格配置
const functionGridOptions = ref<VxeGridProps<any>>({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: 'id',
    isHover: true
  },
  columns: [
    { type: 'seq', width: 60, title: '序号', align: 'center' },
    {
      field: 'icon',
      title: '',
      width: 80,
      align: 'center',
      slots: { default: 'icon_default' }
    },
    {
      field: 'name',
      title: '功能名称',
      minWidth: 200,
      showOverflow: 'tooltip'
    },
    {
      field: 'description',
      title: '功能描述',
      minWidth: 250,
      showOverflow: 'tooltip'
    },
    {
      field: 'schedule',
      title: '定时任务',
      minWidth: 200,
      align: 'center',
      slots: { default: 'schedule_default' }
    },
    {
      title: '操作',
      fixed: 'right' as const,
      width: 120,
      align: 'center',
      slots: { default: 'operation_default' }
    }
  ]
})

const gridRef = ref<VxeGridInstance>()
const { height } = useWindowSize()

const gridOptions = ref<VxeGridProps<WebsocketConnectionRow>>({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: 'id'
  },
  columns: [
    { type: 'seq', width: 60, title: '序号', align: 'center' },
    {
      field: 'id',
      title: '连接 ID',
      minWidth: 240,
      showOverflow: 'tooltip'
    },
    {
      field: 'namespace',
      title: '命名空间',
      minWidth: 120,
      showOverflow: 'tooltip'
    },
    {
      field: 'clientSource',
      title: '连接类型',
      width: 120,
      align: 'center',
      slots: { default: 'clientSource_default' }
    },
    {
      field: 'user',
      title: '用户信息',
      minWidth: 220,
      showOverflow: 'tooltip',
      formatter: ({ row }) => formatUserFromConnection(row as WebsocketConnectionRow)
    },
    {
      field: 'token',
      title: 'Token',
      minWidth: 260,
      showOverflow: 'tooltip',
      formatter: ({ row }) => extractTokenFromRow(row as WebsocketConnectionRow)
    },
    {
      field: 'connectedAt',
      title: '连接时间',
      minWidth: 200,
      ellipsis: true,
      formatter: ({ cellValue }) => (cellValue ? formatDate(new Date(cellValue)) : '')
    },
    {
      field: 'duration',
      title: '持续时长',
      minWidth: 140,
      slots: { default: 'duration_default' }
    },
    {
      field: 'ip',
      title: 'IP 地址',
      minWidth: 160,
      showOverflow: 'tooltip',
      slots: { default: 'ip_default' }
    },
    {
      field: 'userAgent',
      title: 'User-Agent',
      minWidth: 260,
      showOverflow: 'tooltip',
      slots: { default: 'ua_default' }
    },
    {
      field: 'clientInfo',
      title: '客户端信息',
      minWidth: 320,
      showOverflow: 'tooltip',
      slots: { default: 'clientInfo_default' }
    },
    {
      field: 'query',
      title: 'Query 参数',
      minWidth: 260,
      showOverflow: 'tooltip',
      slots: { default: 'query_default' }
    },
    {
      title: '操作',
      fixed: 'right' as const,
      width: 120,
      align: 'center',
      slots: { default: 'operation_default' }
    }
  ]
})

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 200
})

const formatQuery = (query?: Record<string, string | string[]>) => {
  if (!query) {
    return '-'
  }

  const entries = Object.entries(query).filter(([key]) => key !== 'clientInfo')

  if (entries.length === 0) {
    return '-'
  }

  return entries
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=${value.join(',')}`
      }
      return `${key}=${value}`
    })
    .join('；')
}

const formatClientInfo = (info?: WebsocketClientInfo) => {
  if (!info) {
    return '-'
  }

  const segments: string[] = []

  if (info.clientId) {
    segments.push(`ID: ${info.clientId}`)
  }

  if (info.machine?.code) {
    segments.push(`机器码: ${info.machine.code}`)
  }

  if (info.browser?.name) {
    segments.push(`浏览器: ${info.browser.name}${info.browser.version ? ` ${info.browser.version}` : ''}`)
  }

  if (info.os?.name) {
    segments.push(`系统: ${info.os.name}${info.os.version ? ` ${info.os.version}` : ''}`)
  }

  if (info.platform?.arch) {
    segments.push(`架构: ${info.platform.arch}${info.platform.nacl_arch ? ` / ${info.platform.nacl_arch}` : ''}`)
  }

  if (info.language) {
    segments.push(`语言: ${info.language}`)
  }

  if (info.timeZone) {
    segments.push(`时区: ${info.timeZone}`)
  }

  if (info.device?.hardwareConcurrency || info.device?.memory) {
    const parts: string[] = []
    if (info.device?.hardwareConcurrency) {
      parts.push(`${info.device.hardwareConcurrency} 核`)
    }
    if (info.device?.memory) {
      parts.push(`${info.device.memory} GB`)
    }
    segments.push(`硬件: ${parts.join(' / ')}`)
  }

  const locationFields = [info.location?.city, info.location?.region, info.location?.country].filter(Boolean)
  if (locationFields.length > 0) {
    segments.push(`位置: ${locationFields.join(' · ')}`)
  }

  if (info.location?.ip) {
    segments.push(`IP: ${info.location.ip}`)
  }

  if (info.location?.org) {
    segments.push(`网络: ${info.location.org}`)
  }

  if (segments.length === 0) {
    return '-'
  }

  return segments.join(' | ')
}

const pickTokenString = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const picked = pickTokenString(item)
      if (picked) {
        return picked
      }
    }
    return null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return null
}

const getTokenFromRow = (row: WebsocketConnectionRow): string | null => {
  if (!row) {
    return null
  }
  const queryToken = pickTokenString(row.query?.token)
  if (queryToken) {
    return queryToken
  }
  const infoToken = pickTokenString((row.clientInfo as any)?.auth?.token)
  if (infoToken) {
    return infoToken
  }
  return null
}

const formatUserSummary = (user?: Partial<TokenUserInfo> & { username?: string }) => {
  if (!user) {
    return '-'
  }

  const parts: string[] = []
  const displayName = user.name || user.nickname || user.account || user.username
  if (displayName) {
    parts.push(displayName)
  }

  if (user.id) {
    parts.push(`ID: ${user.id}`)
  }

  if (user.email) {
    parts.push(user.email)
  }

  if (user.company?.name) {
    parts.push(`公司: ${user.company.name}`)
  }

  return parts.length ? parts.join(' | ') : '-'
}

const refreshConnectionsView = () => {
  connections.value = connections.value.map((item) => item)
}

const formatUserFromConnection = (row: WebsocketConnectionRow) => {
  if (row.__userLookupStatus === 'loading') {
    return '查询中...'
  }

  if (row.__userLookupStatus === 'error') {
    return row.__userLookupError || '查询失败'
  }

  const info: any = row.clientInfo || {}
  const user = info.user || {
    id: row.userId,
    account: row.username,
    nickname: row.nickname,
    email: row.email
  }

  return formatUserSummary(user)
}

const extractTokenFromRow = (row: WebsocketConnectionRow) => {
  return getTokenFromRow(row) ?? '-'
}

const applyCachedUserInfo = (rows: WebsocketConnectionRow[]) => {
  rows.forEach((row) => {
    const token = getTokenFromRow(row)
    if (!token) {
      row.__userLookupStatus = undefined
      row.__userLookupError = undefined
      return
    }

    const cacheEntry = tokenUserCache[token]
    if (cacheEntry) {
      if (cacheEntry.user) {
        row.clientInfo = {
          ...(row.clientInfo || {}),
          user: cacheEntry.user
        } as WebsocketClientInfo
        row.__userLookupStatus = 'success'
        row.__userLookupError = undefined
      } else {
        row.__userLookupStatus = 'error'
        row.__userLookupError = cacheEntry.error || '未找到对应的用户'
      }
    } else if ((row.clientInfo as any)?.user) {
      row.__userLookupStatus = 'success'
      row.__userLookupError = undefined
    } else {
      row.__userLookupStatus = undefined
      row.__userLookupError = undefined
    }
  })
  refreshConnectionsView()
}

const markRowsLoadingByToken = (token: string) => {
  connections.value.forEach((row) => {
    if (getTokenFromRow(row) === token) {
      row.__userLookupStatus = 'loading'
      row.__userLookupError = undefined
    }
  })
  refreshConnectionsView()
}

const applyLookupResultToRows = (token: string, user: TokenUserInfo | null, errorMessage?: string) => {
  connections.value.forEach((row) => {
    if (getTokenFromRow(row) !== token) {
      return
    }
    if (user) {
      row.clientInfo = {
        ...(row.clientInfo || {}),
        user
      } as WebsocketClientInfo
      row.__userLookupStatus = 'success'
      row.__userLookupError = undefined
    } else {
      row.__userLookupStatus = 'error'
      row.__userLookupError = errorMessage || '未找到对应的用户'
    }
  })
  refreshConnectionsView()
}

const fetchUserInfoForToken = async (token: string) => {
  markRowsLoadingByToken(token)
  try {
    const response = await WebsocketApi.getUserInfoByToken(token)
    if (response.success && response.data) {
      tokenUserCache[token] = { user: response.data }
      applyLookupResultToRows(token, response.data)
    } else {
      const errorMessage = response.message || '未找到对应的用户'
      tokenUserCache[token] = { user: null, error: errorMessage }
      applyLookupResultToRows(token, null, errorMessage)
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || '查询用户信息失败'
    tokenUserCache[token] = { user: null, error: errorMessage }
    applyLookupResultToRows(token, null, errorMessage)
  }
}

const ensureUserInfoForTokens = (rows: WebsocketConnectionRow[]) => {
  const tokens = Array.from(
    new Set(
      rows
        .map((row) => getTokenFromRow(row))
        .filter((token): token is string => Boolean(token))
    )
  )

  tokens.forEach((token) => {
    const hasUserInfo = rows.some((row) => getTokenFromRow(row) === token && (row.clientInfo as any)?.user)
    if (hasUserInfo) {
      return
    }
    if (tokenUserCache[token]) {
      applyCachedUserInfo(rows)
      return
    }
    if (tokenLookupInFlight.has(token)) {
      return
    }
    const task = fetchUserInfoForToken(token).finally(() => {
      tokenLookupInFlight.delete(token)
    })
    tokenLookupInFlight.set(token, task)
  })
}

const clearTimer = () => {
  if (refreshTimer.value !== null) {
    window.clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

const fetchConnections = async () => {
  loading.value = true
  try {
    const response = await WebsocketApi.getWebsocketConnections()
    // 处理响应数据：可能是数组，也可能是包装后的对象 { data: [...], code: 0, ... }
    let list: WebsocketConnectionVO[] = []
    if (Array.isArray(response)) {
      list = response
    } else if (response && typeof response === 'object' && Array.isArray(response.data)) {
      list = response.data
    } else {
      console.warn('[fetchConnections] 意外的响应格式:', response)
      list = []
    }
    connections.value = list.map((item) => ({
      ...item,
      __userLookupStatus: undefined,
      __userLookupError: undefined
    }))
    applyCachedUserInfo(connections.value)
    ensureUserInfoForTokens(connections.value)
  } catch (error: any) {
    message.error(error?.message ?? '获取 WebSocket 连接失败')
  } finally {
    loading.value = false
  }
}

const handleOperationCommand = (command: string, row: WebsocketConnectionRow) => {
  if (command === 'send-message') {
    handleSendMessage(row)
  } else if (command === 'control') {
    handleControl(row)
  }
}

const handleControl = async (row: WebsocketConnectionRow) => {
  currentConnection.value = row
  controlDialogVisible.value = true
  // 加载定时任务信息
  await loadFunctionSchedule()
}

const handleSendMessage = (row: WebsocketConnectionRow) => {
  currentConnection.value = row
  messageContent.value = ''
  messageEvent.value = 'admin-message'
  sendMessageDialogVisible.value = true
}

const handleFunctionOperation = (command: string, row: any) => {
  if (command === 'open' && row.handler && typeof row.handler === 'function') {
    row.handler()
  }
}


const handleConfirmSendMessage = async () => {
  if (!currentConnection.value) {
    return
  }

  if (!messageContent.value.trim()) {
    message.warning('请输入消息内容')
    return
  }

  sendMessageDialogLoading.value = true
  try {
    let data: any = messageContent.value
    try {
      data = JSON.parse(messageContent.value)
    } catch {
      // 如果不是 JSON，就作为普通字符串发送
    }

    const response = await WebsocketApi.sendMessageToConnection(
      currentConnection.value.id,
      data,
      messageEvent.value || undefined
    )
    
    // 检查返回的 success 字段
    const result = response as any
    if (result?.success === false || result?.data?.success === false) {
      const errorMsg = result?.message || result?.data?.message || '消息发送失败'
      message.error(errorMsg)
      return
    }
    
    message.success('消息发送成功')
    sendMessageDialogVisible.value = false
    messageContent.value = ''
  } catch (error: any) {
    // 处理网络错误或其他异常
    const errorMsg = error?.response?.data?.message || error?.message || '消息发送失败'
    message.error(errorMsg)
  } finally {
    sendMessageDialogLoading.value = false
  }
}

watch(autoRefresh, (value) => {
  clearTimer()
  if (value) {
    refreshTimer.value = window.setInterval(fetchConnections, refreshInterval)
  }
})

onMounted(() => {
  fetchConnections()
})

onBeforeUnmount(() => {
  clearTimer()
})
</script>

<style scoped>

.admin-connection-id {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: 'Monaco', 'Menlo', monospace;
}

.common-table {
  border-radius: 8px;
  overflow: hidden;
}

/* 操控弹窗样式 */
.control-dialog {
  .el-dialog__body {
    padding: 0;
    height: calc(100vh - 120px);
    overflow: hidden;
  }
}

.control-dialog-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.control-dialog-header {
  padding: 12px 20px;
  background: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.control-connection-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.connection-info-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.connection-id {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  
  .label {
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }
  
  .value {
    color: var(--el-text-color-primary);
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 11px;
  }
}

.connection-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 11px;
  color: var(--el-text-color-regular);
  
  .meta-item {
    display: flex;
    align-items: center;
  }
}

.connection-info-right {
    display: flex;
    flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.connection-time {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.control-dialog-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: var(--el-bg-color);
  }

.function-grid {
  height: 100%;
}

.function-icon-cell {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary-light-9);
  border-radius: 6px;
  margin: 0 auto;
  
  .iconify {
    font-size: 20px;
    color: var(--el-color-primary);
  }
}

.function-name-cell {
  font-size: 14px;
    font-weight: 600;
  color: var(--el-text-color-primary);
  }

.function-desc-cell {
  font-size: 12px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.schedule-status-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  
  .schedule-status-row {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .schedule-info-text {
      font-size: 12px;
      color: var(--el-text-color-primary);
      font-family: 'Monaco', 'Menlo', monospace;
    }
  }
  
  .schedule-type-text {
    font-size: 11px;
  }
}
</style>
