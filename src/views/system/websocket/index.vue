<template>
  <div class="websocket-page">
    <ContentWrap class="mb-16px">
      <div class="ws-test-card">
        <div class="ws-test-card__header">
          <div class="ws-test-card__status">
            <span>当前状态：</span>
            <el-tag :type="statusTag.type">
              {{ statusTag.text }}
            </el-tag>
          </div>
          <div class="ws-test-card__actions">
            <el-button text type="primary" @click="clearLogs" :disabled="logList.length === 0">
              清空日志
            </el-button>
            <el-button text type="primary" @click="testCardCollapsed = !testCardCollapsed">
              <Icon :icon="testCardCollapsed ? 'ep:arrow-down' : 'ep:arrow-up'" class="mr-5px" />
              {{ testCardCollapsed ? '展开' : '折叠' }}
            </el-button>
          </div>
        </div>

        <el-collapse-transition>
          <div v-show="!testCardCollapsed" class="ws-test-card__content">
            <el-form class="ws-test-form" label-position="top">
          <el-form-item label="测试地址">
            <el-input v-model="wsUrl" placeholder="例如：wss://your-host/ws" :disabled="isConnected" />
          </el-form-item>
          <div class="ws-test-form__buttons">
            <el-button type="primary" @click="connectWebsocket" :loading="isConnecting" :disabled="isConnected">
              <Icon icon="ep:connection" class="mr-5px" /> 测试连接
            </el-button>
            <el-button @click="disconnectWebsocket" :disabled="!canDisconnect">
              <Icon icon="ep:close-bold" class="mr-5px" /> 断开连接
            </el-button>
            <el-button type="warning" @click="sendPing" :disabled="!isConnected">
              <Icon icon="ep:notification" class="mr-5px" /> 测试 Ping
            </el-button>
          </div>

          <el-form-item label="测试消息">
            <el-input
              v-model="testPayload"
              type="textarea"
              :rows="3"
              placeholder='请输入要发送的消息，如 {"type":"ping"}'
            />
          </el-form-item>
          <div class="ws-test-form__buttons">
            <el-button type="success" @click="handleSendTestMessage" :disabled="!isConnected">
              <Icon icon="ep:position" class="mr-5px" /> 发送测试消息
            </el-button>
          </div>
        </el-form>

        <div class="ws-test-card__log">
          <div class="ws-test-card__log-title">
            <span>实时日志</span>
            <span class="ws-test-card__log-subtitle">用于确认 WebSocket 是否收发正常</span>
          </div>
          <el-scrollbar class="ws-test-card__log-list">
            <div v-if="logList.length === 0" class="ws-test-card__log-empty">暂无日志</div>
            <div v-else>
              <div v-for="(item, index) in logList" :key="index" class="ws-test-card__log-item">
                {{ item }}
              </div>
            </div>
          </el-scrollbar>
        </div>
          </div>
        </el-collapse-transition>
      </div>
    </ContentWrap>

    <ContentWrap>
      <div class="websocket-toolbar">
        <el-button type="primary" @click="fetchConnections" :loading="loading">
          <Icon icon="ep:refresh" class="mr-5px" /> 刷新
        </el-button>
        <el-switch v-model="autoRefresh" active-text="自动刷新" />
        <span class="websocket-toolbar__hint">当前展示为 WebSocket 网关 `/ws` 的实时连接</span>
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

    <!-- Sora 爬取配置弹窗 -->
    <el-dialog
      v-model="soraDialogVisible"
      title="Sora 图片爬取"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="soraTab" type="border-card">
        <el-tab-pane label="立即执行" name="execute">
          <el-form :model="soraForm" label-width="120px" :loading="soraLoading">
            <el-form-item label="目标页面 URL">
              <el-input
                v-model="soraForm.targetUrl"
                placeholder="https://sora.chatgpt.com/explore?type=images"
                clearable
              />
            </el-form-item>
            <el-form-item label="采集数量上限">
              <el-input-number
                v-model="soraForm.count"
                :min="1"
                :max="200"
                :step="1"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="上传到服务器">
              <el-switch v-model="soraForm.uploadToServer" />
            </el-form-item>
            <el-form-item label="发送飞书通知">
              <el-switch v-model="soraForm.notifyFeishu" />
            </el-form-item>
            <el-form-item label="素材来源标记">
              <el-input v-model="soraForm.sourceTag" placeholder="sora" clearable />
            </el-form-item>
            <el-form-item label="素材备注">
              <el-input
                v-model="soraForm.description"
                type="textarea"
                :rows="2"
                placeholder="Sora 图片素材"
              />
            </el-form-item>
          </el-form>
          <div style="text-align: right; margin-top: 20px">
            <el-button @click="soraDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="soraLoading" @click="handleSoraScrape">
              <Icon icon="ep:video-play" class="mr-5px" />
              开始爬取
            </el-button>
          </div>
        </el-tab-pane>
        <el-tab-pane label="定时任务" name="schedule">
          <div v-if="soraScheduleTask" class="schedule-info-section">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="任务状态">
                <el-tag :type="soraScheduleTask.enabled ? 'success' : 'info'">
                  {{ soraScheduleTask.enabled ? '已启用' : '已禁用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="执行计划">
                {{ formatSchedule(soraScheduleTask) }}
              </el-descriptions-item>
              <el-descriptions-item label="任务类型">
                <el-tag :type="soraScheduleTask.type === 'cron' ? 'primary' : 'success'" size="small">
                  {{ soraScheduleTask.type === 'cron' ? '固定时间点' : '间隔时间' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
            <div class="schedule-actions" style="margin-top: 20px; text-align: center">
              <el-button
                :type="soraScheduleTask.enabled ? 'warning' : 'success'"
                @click="handleToggleSoraSchedule"
                :loading="soraScheduleLoading"
              >
                {{ soraScheduleTask.enabled ? '禁用任务' : '启用任务' }}
              </el-button>
              <el-button type="danger" @click="handleDeleteSoraSchedule" :loading="soraScheduleLoading">
                删除任务
              </el-button>
            </div>
            <div style="margin-top: 20px; padding: 12px; background: var(--el-color-info-light-9); border-radius: 4px; font-size: 12px; color: var(--el-color-info); text-align: center">
              <Icon icon="ep:info-filled" class="mr-4px" />
              如需修改任务配置，请先删除当前任务，然后重新创建
            </div>
          </div>
          <div v-else>
            <el-form :model="soraScheduleForm" label-width="120px" :loading="soraScheduleLoading">
              <el-form-item label="任务类型">
                <el-radio-group v-model="soraScheduleForm.type">
                  <el-radio label="cron">固定时间点（Cron）</el-radio>
                  <el-radio label="interval">间隔时间</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="soraScheduleForm.type === 'cron'" label="Cron 表达式">
                <el-input
                  v-model="soraScheduleForm.cronExpression"
                  placeholder="例如：0 0 11 * * *（每天 11:00）"
                  clearable
                >
                  <template #append>
                    <el-button size="small" @click="showSoraCronExamples = !showSoraCronExamples">
                      {{ showSoraCronExamples ? '隐藏' : '示例' }}
                    </el-button>
                  </template>
                </el-input>
                <div v-if="showSoraCronExamples" class="cron-examples" style="margin-top: 10px; font-size: 12px; color: #909399">
                  <div>示例：</div>
                  <div>• <code>0 0 11 * * *</code> - 每天 11:00</div>
                  <div>• <code>0 0 */4 * * *</code> - 每 4 小时</div>
                  <div>• <code>0 30 9 * * 1-5</code> - 工作日 9:30</div>
                </div>
              </el-form-item>
              <el-form-item v-else label="间隔时间（小时）">
                <el-input-number
                  v-model="soraScheduleForm.intervalHours"
                  :min="0.5"
                  :max="168"
                  :step="0.5"
                  :precision="1"
                  style="width: 100%"
                  placeholder="例如：6 表示每 6 小时执行一次"
                />
                <div style="margin-top: 5px; font-size: 12px; color: #909399">
                  请输入间隔时间（小时），如：2（每 2 小时）、6（每 6 小时）、24（每天）
                </div>
              </el-form-item>
              <el-divider />
              <div style="font-size: 12px; color: #909399; margin-bottom: 15px; padding: 10px; background: var(--el-color-info-light-9); border-radius: 4px">
                <Icon icon="ep:info-filled" class="mr-4px" />
                定时任务将使用"立即执行"标签页中的爬取参数
              </div>
            </el-form>
            <div style="text-align: right; margin-top: 20px">
              <el-button @click="soraDialogVisible = false">取消</el-button>
              <el-button type="primary" :loading="soraScheduleLoading" @click="handleSaveSoraSchedule">
                <Icon icon="ep:check" class="mr-5px" />
                创建任务
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- Pinterest 爬取配置弹窗 -->
    <el-dialog
      v-model="pinterestDialogVisible"
      title="Pinterest 图片爬取"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="pinterestTab" type="border-card">
        <el-tab-pane label="立即执行" name="execute">
                <el-form :model="pinterestForm" label-width="120px" :loading="pinterestLoading">
                  <el-form-item label="目标页面 URL">
                    <el-input
                      v-model="pinterestForm.targetUrl"
                      placeholder="https://www.pinterest.com/today/"
                      clearable
                    />
                  </el-form-item>
                  <el-form-item label="采集数量上限">
                    <el-input-number
                      v-model="pinterestForm.count"
                      :min="1"
                      :max="500"
                      :step="1"
                      style="width: 100%"
                    />
                  </el-form-item>
                  <el-form-item label="上传到服务器">
                    <el-switch v-model="pinterestForm.uploadToServer" />
                  </el-form-item>
                  <el-form-item label="发送飞书通知">
                    <el-switch v-model="pinterestForm.notifyFeishu" />
                  </el-form-item>
                  <el-form-item label="素材来源标记">
                    <el-input v-model="pinterestForm.sourceTag" placeholder="pinterest" clearable />
                  </el-form-item>
                  <el-form-item label="素材备注">
                    <el-input
                      v-model="pinterestForm.description"
                      type="textarea"
                      :rows="2"
                      placeholder="Pinterest 图片素材"
                    />
                  </el-form-item>
          </el-form>
          <div style="text-align: right; margin-top: 20px">
            <el-button @click="pinterestDialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="pinterestLoading" @click="handlePinterestScrape">
                      <Icon icon="ep:video-play" class="mr-5px" />
                      开始爬取
                    </el-button>
          </div>
        </el-tab-pane>
        <el-tab-pane label="定时任务" name="schedule">
          <!-- 已有任务：只显示信息和基本操作 -->
          <div v-if="pinterestScheduleTask" class="schedule-info-section">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="任务状态">
                <el-tag :type="pinterestScheduleTask.enabled ? 'success' : 'info'">
                  {{ pinterestScheduleTask.enabled ? '已启用' : '已禁用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="执行计划">
                {{ formatSchedule(pinterestScheduleTask) }}
              </el-descriptions-item>
              <el-descriptions-item label="任务类型">
                <el-tag :type="pinterestScheduleTask.type === 'cron' ? 'primary' : 'success'" size="small">
                  {{ pinterestScheduleTask.type === 'cron' ? '固定时间点' : '间隔时间' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
            <div class="schedule-actions" style="margin-top: 20px; text-align: center">
              <el-button
                :type="pinterestScheduleTask.enabled ? 'warning' : 'success'"
                @click="handleTogglePinterestSchedule"
                :loading="pinterestScheduleLoading"
              >
                {{ pinterestScheduleTask.enabled ? '禁用任务' : '启用任务' }}
              </el-button>
              <el-button type="danger" @click="handleDeletePinterestSchedule" :loading="pinterestScheduleLoading">
                删除任务
              </el-button>
            </div>
            <div style="margin-top: 20px; padding: 12px; background: var(--el-color-info-light-9); border-radius: 4px; font-size: 12px; color: var(--el-color-info); text-align: center">
              <Icon icon="ep:info-filled" class="mr-4px" />
              如需修改任务配置，请先删除当前任务，然后重新创建
            </div>
          </div>
          
          <!-- 没有任务：显示创建表单 -->
          <div v-else>
            <el-form :model="pinterestScheduleForm" label-width="120px" :loading="pinterestScheduleLoading">
              <el-form-item label="任务类型">
                <el-radio-group v-model="pinterestScheduleForm.type">
                  <el-radio label="cron">固定时间点（Cron）</el-radio>
                  <el-radio label="interval">间隔时间</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="pinterestScheduleForm.type === 'cron'" label="Cron 表达式">
                <el-input
                  v-model="pinterestScheduleForm.cronExpression"
                  placeholder="例如：0 0 10 * * *（每天 10:00）"
                  clearable
                >
                  <template #append>
                    <el-button size="small" @click="showCronExamples = !showCronExamples">
                      {{ showCronExamples ? '隐藏' : '示例' }}
                    </el-button>
                  </template>
                </el-input>
                <div v-if="showCronExamples" class="cron-examples" style="margin-top: 10px; font-size: 12px; color: #909399">
                  <div>示例：</div>
                  <div>• <code>0 0 10 * * *</code> - 每天 10:00</div>
                  <div>• <code>0 0 */3 * * *</code> - 每 3 小时</div>
                  <div>• <code>0 0 9,18 * * *</code> - 每天 9:00 和 18:00</div>
                  <div>• <code>0 30 8 * * 1-5</code> - 工作日 8:30</div>
                </div>
              </el-form-item>
              <el-form-item v-else label="间隔时间（小时）">
                <el-input-number
                  v-model="pinterestScheduleForm.intervalHours"
                  :min="0.1"
                  :max="168"
                  :step="0.1"
                  :precision="1"
                  style="width: 100%"
                  placeholder="例如：3 表示每 3 小时执行一次"
                />
                <div style="margin-top: 5px; font-size: 12px; color: #909399">
                  请输入间隔时间（小时），如：1（每小时）、3（每 3 小时）、24（每天）
            </div>
              </el-form-item>
              <el-divider />
              <div style="font-size: 12px; color: #909399; margin-bottom: 15px; padding: 10px; background: var(--el-color-info-light-9); border-radius: 4px">
                <Icon icon="ep:info-filled" class="mr-4px" />
                定时任务将使用"立即执行"标签页中的爬取参数
        </div>
            </el-form>
            <div style="text-align: right; margin-top: 20px">
              <el-button @click="pinterestDialogVisible = false">取消</el-button>
              <el-button type="primary" :loading="pinterestScheduleLoading" @click="handleSavePinterestSchedule">
                <Icon icon="ep:check" class="mr-5px" />
                创建任务
              </el-button>
      </div>
          </div>
        </el-tab-pane>
      </el-tabs>
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
import { io, Socket } from 'socket.io-client'
import { useMessage } from '@/hooks/web/useMessage'
import { formatDate, formatPast } from '@/utils/formatTime'
import { useWindowSize } from '@vueuse/core'
import { commonGridOptions } from '@/common/table'
import * as WebsocketApi from '@/api/system/websocket'
import type {
  WebsocketConnectionVO,
  WebsocketClientInfo,
  ScheduledTask,
  SetTaskDTO
} from '@/api/system/websocket'

defineOptions({ name: 'SystemWebsocketConnections' })

const message = useMessage()

const SCRAPER_COMMANDS = {
  pinterest: 'pinterest/scrape',
  sora: 'sora/scrape'
} as const

const connections = ref<WebsocketConnectionVO[]>([])
const loading = ref(false)
const autoRefresh = ref(false)
const refreshTimer = ref<number | null>(null)
const refreshInterval = 10_000
const testCardCollapsed = ref(true)

// 发送消息对话框
const sendMessageDialogVisible = ref(false)
const sendMessageDialogLoading = ref(false)
const currentConnection = ref<WebsocketConnectionVO | null>(null)
const messageContent = ref('')
const messageEvent = ref('admin-message')

// Pinterest 爬取表单
const pinterestForm = reactive({
  targetUrl: 'https://www.pinterest.com/today/',
  count: 10,
  uploadToServer: true,
  notifyFeishu: true,
  sourceTag: 'pinterest',
  description: 'Pinterest 图片素材'
})
const pinterestLoading = ref(false)
const pinterestTab = ref('execute') // 标签页：execute 或 schedule

// Pinterest 定时任务相关
const pinterestScheduleTask = ref<ScheduledTask | null>(null)
const pinterestScheduleLoading = ref(false)
const showCronExamples = ref(false)
const pinterestScheduleForm = reactive({
  type: 'interval' as 'cron' | 'interval',
  cronExpression: '0 0 10 * * *',
  intervalHours: 3
})

const SORA_DEFAULT_URL = 'https://sora.chatgpt.com/explore?type=images'
const soraForm = reactive({
  targetUrl: SORA_DEFAULT_URL,
  count: 24,
  uploadToServer: true,
  notifyFeishu: true,
  sourceTag: 'sora',
  description: 'Sora 图片素材'
})
const soraLoading = ref(false)
const soraTab = ref('execute')

const soraScheduleTask = ref<ScheduledTask | null>(null)
const soraScheduleLoading = ref(false)
const showSoraCronExamples = ref(false)
const soraScheduleForm = reactive({
  type: 'interval' as 'cron' | 'interval',
  cronExpression: '0 0 11 * * *',
  intervalHours: 6
})

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

const loadPinterestSchedule = async () => {
  if (!currentConnection.value) return

  pinterestScheduleLoading.value = true
  try {
    const response = await WebsocketApi.getScheduleTask(currentConnection.value.id, SCRAPER_COMMANDS.pinterest)
    if (response.data) {
      pinterestScheduleTask.value = response.data
      pinterestScheduleForm.type = response.data.type
      if (response.data.type === 'cron') {
        pinterestScheduleForm.cronExpression = response.data.schedule
      } else {
        pinterestScheduleForm.intervalHours = parseFloat(response.data.schedule)
      }
      if (response.data.params) {
        Object.assign(pinterestForm, response.data.params)
      }
    } else {
      pinterestScheduleTask.value = null
    }
  } catch (error: any) {
    message.error(error?.message || '获取定时任务失败')
  } finally {
    pinterestScheduleLoading.value = false
  }
}

const handleSavePinterestSchedule = async () => {
  if (!currentConnection.value) {
    message.warning('请先选择连接')
    return
  }

  if (pinterestScheduleForm.type === 'cron' && !pinterestScheduleForm.cronExpression?.trim()) {
    message.warning('请输入 Cron 表达式')
    return
  }

  if (pinterestScheduleForm.type === 'interval' && (!pinterestScheduleForm.intervalHours || pinterestScheduleForm.intervalHours <= 0)) {
    message.warning('请输入有效的间隔时间（大于 0）')
    return
  }

  if (!pinterestForm.targetUrl?.trim()) {
    message.warning('请输入目标页面 URL（在"立即执行"标签页）')
    return
  }

  pinterestScheduleLoading.value = true
  try {
    const data: SetTaskDTO = {
      clientId: currentConnection.value.id,
      type: pinterestScheduleForm.type,
      schedule: pinterestScheduleForm.type === 'cron' ? pinterestScheduleForm.cronExpression : String(pinterestScheduleForm.intervalHours),
      command: SCRAPER_COMMANDS.pinterest,
      params: {
        targetUrl: pinterestForm.targetUrl.trim(),
        count: pinterestForm.count || 10,
        uploadToServer: pinterestForm.uploadToServer ?? true,
        notifyFeishu: pinterestForm.notifyFeishu ?? true,
        sourceTag: pinterestForm.sourceTag?.trim() || 'pinterest',
        description: pinterestForm.description?.trim() || 'Pinterest 图片素材（定时任务）'
      }
    }

    const response = await WebsocketApi.setScheduleTask(data)
    if (response.success) {
      message.success(response.message || '定时任务设置成功')
      await loadPinterestSchedule()
      await loadFunctionSchedule() // 同时更新功能列表中的显示
    } else {
      message.error(response.message || '定时任务设置失败')
    }
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || error?.message || '设置定时任务失败'
    message.error(errorMsg)
  } finally {
    pinterestScheduleLoading.value = false
  }
}

const handleTogglePinterestSchedule = async () => {
  if (!currentConnection.value || !pinterestScheduleTask.value) return

  pinterestScheduleLoading.value = true
  try {
    const response = await WebsocketApi.toggleScheduleTask({
      clientId: currentConnection.value.id,
      enabled: !pinterestScheduleTask.value.enabled,
      command: SCRAPER_COMMANDS.pinterest
    })
    if (response.success) {
      message.success(response.message || '操作成功')
      await loadPinterestSchedule()
      await loadFunctionSchedule() // 同时更新功能列表中的显示
    } else {
      message.error(response.message || '操作失败')
    }
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || error?.message || '操作失败'
    message.error(errorMsg)
  } finally {
    pinterestScheduleLoading.value = false
  }
}

const handleDeletePinterestSchedule = async () => {
  if (!currentConnection.value || !pinterestScheduleTask.value) return

  try {
    await message.confirm('确定要删除此定时任务吗？', '确认删除')
  } catch {
    return
  }

  pinterestScheduleLoading.value = true
  try {
    const response = await WebsocketApi.removeScheduleTask(currentConnection.value.id, SCRAPER_COMMANDS.pinterest)
    if (response.success) {
      message.success(response.message || '定时任务已删除')
      pinterestScheduleTask.value = null
      await loadFunctionSchedule() // 同时更新功能列表中的显示
    } else {
      message.error(response.message || '删除失败')
    }
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || error?.message || '删除失败'
    message.error(errorMsg)
  } finally {
    pinterestScheduleLoading.value = false
  }
}

const loadSoraSchedule = async () => {
  if (!currentConnection.value) return

  soraScheduleLoading.value = true
  try {
    const response = await WebsocketApi.getScheduleTask(currentConnection.value.id, SCRAPER_COMMANDS.sora)
    if (response.data) {
      soraScheduleTask.value = response.data
      soraScheduleForm.type = response.data.type
      if (response.data.type === 'cron') {
        soraScheduleForm.cronExpression = response.data.schedule
      } else {
        soraScheduleForm.intervalHours = parseFloat(response.data.schedule)
      }
      if (response.data.params) {
        Object.assign(soraForm, response.data.params)
      }
    } else {
      soraScheduleTask.value = null
    }
  } catch (error: any) {
    message.error(error?.message || '获取 Sora 定时任务失败')
  } finally {
    soraScheduleLoading.value = false
  }
}

const handleSaveSoraSchedule = async () => {
  if (!currentConnection.value) {
    message.warning('请先选择连接')
    return
  }

  if (soraScheduleForm.type === 'cron' && !soraScheduleForm.cronExpression?.trim()) {
    message.warning('请输入 Cron 表达式')
    return
  }

  if (soraScheduleForm.type === 'interval' && (!soraScheduleForm.intervalHours || soraScheduleForm.intervalHours <= 0)) {
    message.warning('请输入有效的间隔时间（大于 0）')
    return
  }

  if (!soraForm.targetUrl?.trim()) {
    message.warning('请输入目标页面 URL（在"立即执行"标签页）')
    return
  }

  soraScheduleLoading.value = true
  try {
    const data: SetTaskDTO = {
      clientId: currentConnection.value.id,
      type: soraScheduleForm.type,
      schedule: soraScheduleForm.type === 'cron' ? soraScheduleForm.cronExpression : String(soraScheduleForm.intervalHours),
      command: SCRAPER_COMMANDS.sora,
      params: {
        targetUrl: soraForm.targetUrl.trim(),
        count: soraForm.count || 20,
        uploadToServer: soraForm.uploadToServer ?? true,
        notifyFeishu: soraForm.notifyFeishu ?? false,
        sourceTag: soraForm.sourceTag?.trim() || 'sora',
        description: soraForm.description?.trim() || 'Sora 图片素材（定时任务）'
      }
    }

    const response = await WebsocketApi.setScheduleTask(data)
    if (response.success) {
      message.success(response.message || '定时任务设置成功')
      await loadSoraSchedule()
      await loadFunctionSchedule()
    } else {
      message.error(response.message || '定时任务设置失败')
    }
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || error?.message || '设置定时任务失败'
    message.error(errorMsg)
  } finally {
    soraScheduleLoading.value = false
  }
}

const handleToggleSoraSchedule = async () => {
  if (!currentConnection.value || !soraScheduleTask.value) return

  soraScheduleLoading.value = true
  try {
    const response = await WebsocketApi.toggleScheduleTask({
      clientId: currentConnection.value.id,
      enabled: !soraScheduleTask.value.enabled,
      command: SCRAPER_COMMANDS.sora
    })
    if (response.success) {
      message.success(response.message || '操作成功')
      await loadSoraSchedule()
      await loadFunctionSchedule()
    } else {
      message.error(response.message || '操作失败')
    }
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || error?.message || '操作失败'
    message.error(errorMsg)
  } finally {
    soraScheduleLoading.value = false
  }
}

const handleDeleteSoraSchedule = async () => {
  if (!currentConnection.value || !soraScheduleTask.value) return

  try {
    await message.confirm('确定要删除此定时任务吗？', '确认删除')
  } catch {
    return
  }

  soraScheduleLoading.value = true
  try {
    const response = await WebsocketApi.removeScheduleTask(currentConnection.value.id, SCRAPER_COMMANDS.sora)
    if (response.success) {
      message.success(response.message || '定时任务已删除')
      soraScheduleTask.value = null
      await loadFunctionSchedule()
    } else {
      message.error(response.message || '删除失败')
    }
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || error?.message || '删除失败'
    message.error(errorMsg)
  } finally {
    soraScheduleLoading.value = false
  }
}

// 操控对话框
const controlDialogVisible = ref(false)
const pinterestDialogVisible = ref(false)
const soraDialogVisible = ref(false)

const openPinterestDialog = async () => {
  pinterestDialogVisible.value = true
  await loadPinterestSchedule()
}

const openSoraDialog = async () => {
  soraDialogVisible.value = true
  await loadSoraSchedule()
}

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

const functionList = ref<ExtensionFunctionItem[]>([
  {
    id: 'pinterest',
    name: 'Pinterest 图片爬取',
    description: '从 Pinterest 页面采集图片并上传到服务器',
    icon: 'ep:picture',
    handler: openPinterestDialog,
    scheduleCommand: SCRAPER_COMMANDS.pinterest,
    schedule: null
  },
  {
    id: 'sora',
    name: 'Sora 图片爬取',
    description: '从 Sora Explore 页面采集图片并上传到服务器',
    icon: 'ep:camera',
    handler: openSoraDialog,
    scheduleCommand: SCRAPER_COMMANDS.sora,
    schedule: null
  }
])

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

const gridOptions = ref<VxeGridProps<WebsocketConnectionVO>>({
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

const getDefaultWsUrl = () => {
  const explicitUrl = import.meta.env.VITE_WS_URL as string | undefined
  if (explicitUrl) {
    return explicitUrl
  }

  const baseUrl = (import.meta.env.VITE_BASE_URL as string | undefined) ?? ''
  if (baseUrl) {
    const normalizedBase = baseUrl.replace(/\/$/, '')
    const sanitizedBase = normalizedBase.replace(/\/api$/i, '')
    return `${sanitizedBase.replace(/^http/i, 'ws')}/ws`
  }

  if (typeof window === 'undefined') {
    return ''
  }

  const { protocol, host } = window.location
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:'
  return `${wsProtocol}//${host}/ws`
}

const wsUrl = ref(getDefaultWsUrl())
const testPayload = ref('{"type":"ping"}')
const logList = ref<string[]>([])
const maxLogLength = 100

type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
const wsStatus = ref<WsStatus>('disconnected')
let socketClient: Socket | null = null

const isConnected = computed(() => wsStatus.value === 'connected')
const isConnecting = computed(() => wsStatus.value === 'connecting')
const canDisconnect = computed(() => wsStatus.value === 'connected' || wsStatus.value === 'connecting')

const statusTag = computed(() => {
  switch (wsStatus.value) {
    case 'connected':
      return { text: '已连接', type: 'success' as const }
    case 'connecting':
      return { text: '连接中', type: 'warning' as const }
    case 'error':
      return { text: '连接异常', type: 'danger' as const }
    default:
      return { text: '未连接', type: 'info' as const }
  }
})

const pushLog = (label: string, detail: string) => {
  const timestamp = formatDate(new Date(), 'HH:mm:ss')
  logList.value.unshift(`[${timestamp}] [${label}] ${detail}`)
  if (logList.value.length > maxLogLength) {
    logList.value.length = maxLogLength
  }
}

const clearLogs = () => {
  logList.value = []
}

const registerSocketListeners = (client: Socket) => {
  client.on('connect', () => {
    wsStatus.value = 'connected'
    pushLog('CONNECT', `连接已建立 (id: ${client.id})`)
    message.success('WebSocket 已连接')
    fetchConnections()
  })

  client.on('disconnect', (reason) => {
    pushLog('DISCONNECT', `连接关闭，原因：${reason}`)
    if (wsStatus.value !== 'error') {
      wsStatus.value = 'disconnected'
    }
    fetchConnections()
  })

  client.on('connect_error', (error) => {
    wsStatus.value = 'error'
    pushLog('CONNECT_ERROR', error.message ?? '连接失败')
    message.error(error.message ?? 'WebSocket 连接失败')
  })

  client.on('pong', (data) => {
    pushLog('PONG', stringifyData(data))
  })

  client.on('test-message-ack', (data) => {
    pushLog('ACK', stringifyData(data))
  })

  client.onAny((event, ...args) => {
    if (event === 'pong' || event === 'test-message-ack') {
      return
    }
    pushLog(`EVENT:${event}`, stringifyData(args.length > 1 ? args : args[0]))
  })
}

const connectWebsocket = () => {
  if (!wsUrl.value) {
    message.warning('请先填写 WebSocket 地址')
    return
  }

  if (socketClient) {
    socketClient.removeAllListeners()
    socketClient.disconnect()
    socketClient = null
  }

  try {
    wsStatus.value = 'connecting'
    const client = io(wsUrl.value, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 10_000,
      withCredentials: true
    })
    socketClient = client
    registerSocketListeners(client)
  } catch (error: any) {
    wsStatus.value = 'error'
    pushLog('ERROR', error?.message ?? '创建 WebSocket 失败')
    message.error(error?.message ?? '创建 WebSocket 失败')
  }
}

const disconnectWebsocket = () => {
  if (socketClient) {
    pushLog('INFO', '手动关闭连接')
    socketClient.disconnect()
    socketClient.removeAllListeners()
    socketClient = null
    wsStatus.value = 'disconnected'
  }
}

const safeSend = (payload: string, silent = false) => {
  if (!socketClient || wsStatus.value !== 'connected') {
    message.warning('请先建立 WebSocket 连接')
    return false
  }
  try {
    let data: any = payload
    try {
      data = JSON.parse(payload)
    } catch {
      data = payload
    }
    socketClient.emit('test-message', data)
    pushLog('EMIT', stringifyData(data))
    if (!silent) {
      message.success('消息已发送')
    }
    return true
  } catch (error: any) {
    pushLog('ERROR', error?.message ?? '发送消息失败')
    message.error(error?.message ?? '发送消息失败')
    return false
  }
}

const handleSendTestMessage = () => {
  const payload = testPayload.value.trim()
  if (!payload) {
    message.warning('请输入要发送的消息')
    return
  }
  safeSend(payload)
}

const sendPing = () => {
  if (!socketClient || wsStatus.value !== 'connected') {
    message.warning('请先建立 WebSocket 连接')
    return
  }
  socketClient.emit('ping')
  pushLog('PING', '已发送 Ping')
  message.success('已发送 Ping 消息')
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
    connections.value = await WebsocketApi.getWebsocketConnections()
  } catch (error: any) {
    message.error(error?.message ?? '获取 WebSocket 连接失败')
  } finally {
    loading.value = false
  }
}

const handleOperationCommand = (command: string, row: WebsocketConnectionVO) => {
  if (command === 'send-message') {
    handleSendMessage(row)
  } else if (command === 'control') {
    handleControl(row)
  }
}

const handleControl = async (row: WebsocketConnectionVO) => {
  currentConnection.value = row
  controlDialogVisible.value = true
  // 加载定时任务信息
  await loadFunctionSchedule()
}

const handleSendMessage = (row: WebsocketConnectionVO) => {
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

const handlePinterestScrape = async () => {
  if (!currentConnection.value) {
    message.warning('请先选择连接')
    return
  }

  if (!pinterestForm.targetUrl?.trim()) {
    message.warning('请输入目标页面 URL')
    return
  }

  pinterestLoading.value = true
  try {
    const command = {
      command: 'pinterest/scrape',
      params: {
        targetUrl: pinterestForm.targetUrl.trim(),
        count: pinterestForm.count || 10,
        uploadToServer: pinterestForm.uploadToServer ?? true,
        notifyFeishu: pinterestForm.notifyFeishu ?? true,
        sourceTag: pinterestForm.sourceTag?.trim() || 'pinterest',
        description: pinterestForm.description?.trim() || 'Pinterest 图片素材',
      },
    }

    const response = await WebsocketApi.sendMessageToConnection(
      currentConnection.value.id,
      command,
      'admin-message'
    )

    // 检查返回的 success 字段
    const result = response as any
    if (result?.success === false || result?.data?.success === false) {
      const errorMsg = result?.message || result?.data?.message || '爬取任务启动失败'
      message.error(errorMsg)
      return
    }

    message.success('爬取任务已启动，请查看插件端日志或等待完成通知')
    pinterestDialogVisible.value = false
  } catch (error: any) {
    // 处理网络错误或其他异常
    const errorMsg = error?.response?.data?.message || error?.message || '启动爬取任务失败'
    message.error(errorMsg)
  } finally {
    pinterestLoading.value = false
  }
}

const handleSoraScrape = async () => {
  if (!currentConnection.value) {
    message.warning('请先选择连接')
    return
  }

  if (!soraForm.targetUrl?.trim()) {
    message.warning('请输入目标页面 URL')
    return
  }

  soraLoading.value = true
  try {
    const command = {
      command: SCRAPER_COMMANDS.sora,
      params: {
        targetUrl: soraForm.targetUrl.trim() || SORA_DEFAULT_URL,
        count: soraForm.count || 20,
        uploadToServer: soraForm.uploadToServer ?? true,
        notifyFeishu: soraForm.notifyFeishu ?? false,
        sourceTag: soraForm.sourceTag?.trim() || 'sora',
        description: soraForm.description?.trim() || 'Sora 图片素材'
      }
    }

    const response = await WebsocketApi.sendMessageToConnection(
      currentConnection.value.id,
      command,
      'admin-message'
    )

    const result = response as any
    if (result?.success === false || result?.data?.success === false) {
      const errorMsg = result?.message || result?.data?.message || '爬取任务启动失败'
      message.error(errorMsg)
      return
    }

    message.success('Sora 爬取任务已启动，请查看插件端日志或等待完成通知')
    soraDialogVisible.value = false
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || error?.message || '启动爬取任务失败'
    message.error(errorMsg)
  } finally {
    soraLoading.value = false
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
  disconnectWebsocket()
})

const stringifyData = (value: unknown) => {
  if (value === undefined) {
    return 'undefined'
  }
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
</script>

<style scoped>
.websocket-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mb-16px {
  margin-bottom: 16px;
}

.ws-test-card {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ws-test-card__header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

.ws-test-card__content {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.ws-test-card__status span:first-child {
  margin-right: 8px;
  color: var(--el-text-color-regular);
}

.ws-test-form {
  flex: 1 1 360px;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ws-test-form__buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.ws-test-card__log {
  flex: 1 1 320px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ws-test-card__log-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ws-test-card__log-subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ws-test-card__log-list {
  height: 220px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
}

.ws-test-card__log-empty {
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.ws-test-card__log-item {
  font-family: ui-monospace, SFMono-Regular, SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 12px;
  line-height: 18px;
  padding: 2px 0;
  border-bottom: 1px dashed var(--el-border-color-extra-light);
}

.ws-test-card__log-item:last-child {
  border-bottom: none;
}

.websocket-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.websocket-toolbar__hint {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.common-table {
  border-radius: 8px;
  overflow: hidden;
}

@media screen and (max-width: 960px) {
  .ws-test-card {
    flex-direction: column;
  }

  .ws-test-card__log-list {
    height: 180px;
  }
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

