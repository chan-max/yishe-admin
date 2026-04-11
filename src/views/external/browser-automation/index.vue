<template>
  <ContentWrap :plain="true">
    <div class="page">
      <div class="topbar">
        <div class="title">浏览器自动化控制台</div>
        <div class="actions">
          <el-button @click="handleRefreshClients">刷新节点</el-button>
          <el-button
            type="primary"
            :disabled="!selectedClientId"
            :loading="loadingMap.checkStatus"
            @click="sendSimple('checkStatus')"
            >刷新状态</el-button
          >
        </div>
      </div>

      <div class="layout" v-loading="loading">
        <ExternalClientSidebar
          :items="clientNodeItems"
          :loading="loading"
          :selected-client-id="selectedClientId"
          section-title="客户端节点"
          empty-text="暂无可用客户端"
          @select="selectedClientId = $event"
        />

        <section v-if="selectedClient" class="main">
          <div class="summary">
            <div class="card item">
              <div class="label">自动化服务</div>
              <div class="value">{{ getBrowserAutomationServiceText(selectedService) }}</div>
            </div>
            <div class="card item">
              <div class="label">浏览器实例</div>
              <div class="value">{{ getBrowserAutomationBrowserText(selectedService) }}</div>
            </div>
            <div class="card item">
              <div class="label">页面数</div>
              <div class="value">{{ selectedDetails.pageCount ?? 0 }}</div>
            </div>
            <div class="card item">
              <div class="label">最近检测</div>
              <div class="value">{{ dateText(selectedService?.lastCheckedAt) }}</div>
            </div>
          </div>

          <div class="card panel">
            <div class="supported-task-panel__head">
              <div>
                <div class="section-title">执行环境</div>
                <div class="muted">一个客户端可维护多个浏览器缓存环境，设为默认后可复用对应账号登录态。</div>
              </div>
              <el-button type="primary" :disabled="!selectedClientId" @click="openCreateProfileDialog">
                新增环境
              </el-button>
            </div>
            <div class="row wrap browser-profile-banner-row" style="margin-bottom: 12px">
              <div v-if="activeProfile" class="active-profile-banner">
                <span class="active-profile-banner__flag">当前环境</span>
                <span class="active-profile-banner__name">
                  {{ activeProfile.name || activeProfile.id }}
                </span>
                <span class="active-profile-banner__id">{{ activeProfile.id }}</span>
              </div>
              <span v-else class="muted">当前还没有已管理的环境，未创建时仍会兼容旧默认目录。</span>
            </div>
            <div class="common-table common-table--full">
              <vxe-grid v-bind="profileGridOptions" :data="profileTableRows" class="profile-grid">
                <template #lastUsedAt_default="{ row }">
                  {{ dateText(row.lastUsedAt) }}
                </template>

                <template #instance_default="{ row }">
                  <div class="table-stack">
                    <el-tag :type="getProfileInstanceTagType(row.instance)" effect="plain">
                      {{ getProfileInstanceText(row.instance) }}
                    </el-tag>
                    <span class="muted">{{ getProfileInstanceHint(row.instance) }}</span>
                  </div>
                </template>

                <template #pageCount_default="{ row }">
                  {{ row.instance?.pageCount ?? 0 }}
                </template>

                <template #status_default="{ row }">
                  <span
                    class="profile-active-badge"
                    :class="{ 'is-active': row.isActive, 'is-standby': !row.isActive }"
                  >
                    <span class="profile-active-badge__dot"></span>
                    <span>{{ row.isActive ? "当前环境" : "待命" }}</span>
                  </span>
                </template>

                <template #profileOperation_default="{ row }">
                  <div class="flex justify-start">
                    <el-dropdown
                      class="operation-dropdown"
                      placement="bottom-end"
                      @command="(command) => handleProfileOperationCommand(String(command), row)"
                    >
                      <el-button type="primary" link size="small" class="operation-trigger-button">
                        操作
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="connect">
                            <span>{{ row.instance?.connected ? "重新连接" : "打开窗口" }}</span>
                          </el-dropdown-item>
                          <el-dropdown-item
                            command="close"
                            :disabled="!row.instance?.hasInstance && !row.instance?.connected"
                          >
                            <span>关闭窗口</span>
                          </el-dropdown-item>
                          <el-dropdown-item
                            command="focus"
                            :disabled="!row.instance?.hasInstance && !row.instance?.connected"
                          >
                            <span>聚焦窗口</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="panel">
                            <span>进入面板</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="switch" :disabled="row.isActive">
                            <span>设为默认</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="edit" divided>
                            <span>编辑</span>
                          </el-dropdown-item>
                          <el-dropdown-item
                            command="delete"
                            divided
                            class="operation-menu-item--danger"
                          >
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

        </section>

        <section v-else class="main-empty card">
          <el-empty description="请选择客户端节点" />
        </section>
      </div>

      <el-dialog
        v-model="operationDialogVisible"
        fullscreen
        append-to-body
        :destroy-on-close="false"
        class="browser-automation-dialog"
        :title="operationDialogTitle"
      >
        <div class="operation-shell">
          <el-tabs v-model="activeTab" class="operation-tabs">
            <el-tab-pane label="连接控制" name="browser">
              <div class="grid">
                <div class="card panel">
                  <div class="section-title">浏览器控制</div>
                  <div class="row">
                    <el-tag v-if="currentProfileId" type="success" effect="plain">
                      当前实例：{{ currentProfileName }} ({{ currentProfileId }})
                    </el-tag>
                    <el-tag v-else type="info" effect="plain">当前实例：未选择环境</el-tag>
                    <el-input-number
                      v-model="browserForm.port"
                      :min="1"
                      :max="65535"
                      controls-position="right"
                      :disabled="!serviceEnabled"
                    />
                    <el-switch
                      v-model="browserForm.headless"
                      active-text="无头"
                      inactive-text="普通"
                      :disabled="!serviceEnabled"
                    />
                  </div>
                  <div class="row wrap">
                    <el-button
                      type="primary"
                      :disabled="!serviceEnabled"
                      :loading="loadingMap.connect"
                      @click="() => sendConnect()"
                      >连接</el-button
                    >
                    <el-button
                      :disabled="!serviceEnabled"
                      :loading="loadingMap.close"
                      @click="sendSimple('close')"
                      >关闭</el-button
                    >
                    <el-button
                      type="danger"
                      :disabled="!serviceEnabled"
                      :loading="loadingMap.forceClose"
                      @click="sendForceClose"
                      >强制关闭</el-button
                    >
                    <el-button
                      :disabled="!canLoadCurrentProfilePages"
                      :loading="loadingMap.pages"
                      @click="sendSimple('pages')"
                      >获取页面</el-button
                    >
                  </div>
                  <div v-if="currentProfileId" class="muted">
                    当前操作环境：{{ currentProfileName }}，{{ currentProfileStatusText }}
                  </div>
                  <div v-if="currentProfileId && !currentProfileConnected" class="muted">
                    当前环境的浏览器窗口尚未打开，请先点击“连接”打开对应环境后再获取页面或执行调试。
                  </div>
                  <div v-if="!serviceEnabled" class="muted">
                    自动化服务未启动，当前节点不可执行相关操作。
                  </div>
                </div>
                <div class="card panel">
                  <div class="section-title">链接调试入口</div>
                  <div class="row">
                    <el-input
                      v-model="openForm.url"
                      placeholder="https://..."
                      :disabled="!serviceEnabled"
                    />
                    <el-button
                      :disabled="!serviceEnabled"
                      :loading="loadingMap.openLink"
                      @click="sendOpenLink"
                      >打开链接</el-button
                    >
                  </div>
                </div>
              </div>
              <div class="card panel">
                <div class="section-title">页面列表</div>
                <el-table
                  :data="pageOptions"
                  border
                  stripe
                  :row-class-name="getPageRowClassName"
                  @row-click="handlePageRowClick"
                >
                  <el-table-column prop="index" label="#" width="60" />
                  <el-table-column
                    prop="title"
                    label="标题"
                    min-width="220"
                    show-overflow-tooltip
                  />
                  <el-table-column prop="url" label="链接" min-width="320" show-overflow-tooltip />
                  <el-table-column label="操作" width="140">
                    <template #default="{ row }">
                      <el-button link type="primary" @click.stop="selectDebugPage(row)">
                        {{ debugForm.pageIndex === row.index ? "当前调试页" : "调试此页" }}
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <el-tab-pane label="链接调试" name="debug">
              <div class="grid">
                <div class="card panel">
                  <div class="section-title">快速操作</div>
                  <div class="stack">
                    <el-select
                      v-model="debugForm.pageIndex"
                      placeholder="选择调试页面"
                      :disabled="!canDebugCurrentProfile || !pageOptions.length"
                    >
                      <el-option
                        v-for="page in pageOptions"
                        :key="page.optionKey"
                        :label="page.optionLabel"
                        :value="page.index"
                      />
                    </el-select>
                    <div class="debug-page-meta">
                      <div class="debug-page-meta__title">
                        当前调试页：
                        <span>{{ selectedDebugPage?.title || "未选择页面" }}</span>
                      </div>
                      <div class="debug-page-meta__url">
                        {{ selectedDebugPage?.url || "请先在页面列表或这里选择一个 tab" }}
                      </div>
                    </div>
                    <el-input-number
                      v-model="debugForm.pageIndex"
                      :min="0"
                      controls-position="right"
                      :disabled="!canDebugCurrentProfile"
                    />
                    <el-input
                      v-model="debugForm.url"
                      placeholder="URL"
                      :disabled="!canDebugCurrentProfile"
                    />
                    <el-input
                      v-model="debugForm.selector"
                      placeholder="Selector"
                      :disabled="!canDebugCurrentProfile"
                    />
                    <el-input
                      v-model="debugForm.text"
                      placeholder="Text"
                      :disabled="!canDebugCurrentProfile"
                    />
                    <el-input
                      v-model="debugForm.key"
                      placeholder="Key"
                      :disabled="!canDebugCurrentProfile"
                    />
                    <el-input-number
                      v-model="debugForm.ms"
                      :min="1"
                      controls-position="right"
                      :disabled="!canDebugCurrentProfile"
                    />
                    <el-input-number
                      v-model="debugForm.timeout"
                      :min="1000"
                      controls-position="right"
                      :disabled="!canDebugCurrentProfile"
                    />
                  </div>
                  <div class="action-grid">
                    <el-button
                      v-for="item in debugActions"
                      :key="item"
                      :disabled="!canDebugCurrentProfile"
                      :loading="loadingMap.debug"
                      @click="sendDebug(item)"
                      >{{ item }}</el-button
                    >
                  </div>
                </div>
                <div class="card panel">
                  <div class="section-title">脚本</div>
                  <el-input
                    v-model="debugForm.expression"
                    type="textarea"
                    :rows="14"
                    placeholder="页面内 JS 或 Playwright 脚本"
                    :disabled="!canDebugCurrentProfile"
                  />
                  <div class="row">
                    <el-button
                      :disabled="!canDebugCurrentProfile"
                      :loading="loadingMap.debug"
                      @click="sendDebug('eval')"
                      >执行页面内 JS</el-button
                    >
                    <el-button
                      :disabled="!canDebugCurrentProfile"
                      :loading="loadingMap.debug"
                      @click="sendDebug('playwright')"
                      >执行 Playwright</el-button
                    >
                  </div>
                </div>
              </div>
              <div class="card panel">
                <div class="section-title">结果</div>
                <div
                  v-if="debugFeedback"
                  class="debug-feedback"
                  :data-success="debugFeedback.success"
                >
                  <div class="debug-feedback__header">
                    <el-tag
                      :type="debugFeedback.success ? 'success' : 'danger'"
                      size="small"
                      effect="plain"
                    >
                      {{ debugFeedback.success ? "成功" : "失败" }}
                    </el-tag>
                    <span class="debug-feedback__message">{{ debugFeedback.message }}</span>
                  </div>
                  <div
                    v-if="
                      debugFeedback.step || debugFeedback.code || debugFeedback.pageIndex !== null
                    "
                    class="debug-feedback__meta"
                  >
                    <span v-if="debugFeedback.step">步骤：{{ debugFeedback.step }}</span>
                    <span v-if="debugFeedback.code">代码：{{ debugFeedback.code }}</span>
                    <span v-if="debugFeedback.pageIndex !== null"
                      >页面：#{{ debugFeedback.pageIndex }}</span
                    >
                  </div>
                  <div
                    v-if="debugFeedback.selector || debugFeedback.url"
                    class="debug-feedback__meta"
                  >
                    <span v-if="debugFeedback.selector"
                      >Selector：{{ debugFeedback.selector }}</span
                    >
                    <span v-if="debugFeedback.url">URL：{{ debugFeedback.url }}</span>
                  </div>
                  <div v-if="debugFeedback.suggestion" class="debug-feedback__hint">
                    建议：{{ debugFeedback.suggestion }}
                  </div>
                  <div
                    v-if="debugFeedback.detail && debugFeedback.detail !== debugFeedback.message"
                    class="debug-feedback__detail"
                  >
                    原始信息：{{ debugFeedback.detail }}
                  </div>
                </div>
                <pre class="result">{{ debugResult || "暂无结果" }}</pre>
              </div>
            </el-tab-pane>

            <el-tab-pane label="任务中心" name="tasks">
              <div class="card panel">
                <div class="row wrap">
                  <el-select
                    v-model="taskFilters.status"
                    clearable
                    placeholder="状态"
                    :disabled="!serviceEnabled"
                    ><el-option label="queued" value="queued" /><el-option
                      label="running"
                      value="running" /><el-option label="success" value="success" /><el-option
                      label="failed"
                      value="failed"
                  /></el-select>
                  <el-input
                    v-model="taskFilters.kind"
                    placeholder="任务类型"
                    :disabled="!serviceEnabled"
                  />
                  <el-input
                    v-model="taskFilters.sourceId"
                    placeholder="来源 ID"
                    :disabled="!serviceEnabled"
                  />
                  <el-button
                    type="primary"
                    :disabled="!serviceEnabled"
                    :loading="loadingMap.tasks"
                    @click="sendTasks"
                    >查询任务</el-button
                  >
                </div>
                <el-table :data="taskList" border stripe>
                  <el-table-column prop="status" label="状态" width="100" />
                  <el-table-column prop="kind" label="类型" width="120" />
                  <el-table-column prop="action" label="动作" width="120" />
                  <el-table-column prop="step" label="步骤" min-width="140" />
                  <el-table-column
                    prop="id"
                    label="任务 ID"
                    min-width="240"
                    show-overflow-tooltip
                  />
                  <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                      <el-button
                        link
                        type="primary"
                        :disabled="!serviceEnabled"
                        @click="sendTaskDetail(row.id)"
                        >详情</el-button
                      >
                      <el-button
                        link
                        type="primary"
                        :disabled="!serviceEnabled"
                        @click="sendTaskLogs(row.id)"
                        >日志</el-button
                      >
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <el-tab-pane label="工具集" name="smallFeature">
              <div class="grid small-feature-grid">
                <div class="card panel">
                  <div class="small-feature-panel__head">
                    <div>
                      <div class="section-title">工具目录</div>
                      <div class="muted">
                        统一放置 Temu 登录、会话采集这类浏览器自动化工具。admin 端负责交互，客户端负责执行。
                      </div>
                    </div>
                    <el-button
                      :disabled="!selectedClientId"
                      :loading="loadingMap.smallFeatures"
                      @click="sendSmallFeatures"
                    >
                      刷新目录
                    </el-button>
                  </div>

                  <div class="row wrap" style="margin-bottom: 12px">
                    <el-tag v-if="currentProfileId" type="success" effect="plain">
                      当前环境：{{ currentProfileName }} ({{ currentProfileId }})
                    </el-tag>
                    <el-tag v-else type="info" effect="plain">
                      当前环境：未锁定，默认使用客户端活动环境
                    </el-tag>
                    <span class="muted">执行工具时会自动带上当前面板对应的环境。</span>
                  </div>

                  <div class="small-feature-layout">
                    <div class="small-feature-list">
                      <button
                        v-for="feature in smallFeatureItems"
                        :key="feature.key"
                        type="button"
                        class="small-feature-card"
                        :class="{ 'is-active': selectedSmallFeatureKey === feature.key }"
                        @click="selectedSmallFeatureKey = feature.key"
                      >
                        <div class="small-feature-card__head">
                          <span class="small-feature-card__name">{{ feature.name }}</span>
                          <span class="small-feature-card__category">
                            {{ feature.category || "tool" }}
                          </span>
                        </div>
                        <div class="small-feature-card__meta">
                          {{ feature.platform || "browser-automation" }}
                        </div>
                        <div class="small-feature-card__desc">
                          {{ feature.description || "暂无描述" }}
                        </div>
                      </button>
                    </div>

                    <div class="small-feature-detail">
                      <template v-if="selectedSmallFeature">
                        <div class="small-feature-detail__head">
                          <div>
                            <div class="small-feature-detail__title">
                              {{ selectedSmallFeature.name }}
                            </div>
                            <div class="small-feature-detail__desc">
                              {{ selectedSmallFeature.description || "暂无描述" }}
                            </div>
                          </div>
                          <div class="small-feature-detail__badges">
                            <el-tag size="small" effect="plain">
                              {{ selectedSmallFeature.platform || "browser-automation" }}
                            </el-tag>
                            <el-tag size="small" effect="plain" type="warning">
                              {{ selectedSmallFeature.category || "tool" }}
                            </el-tag>
                          </div>
                        </div>

                        <div
                          v-if="selectedSmallFeature.tips?.length"
                          class="small-feature-tips"
                        >
                          <div class="small-feature-tips__title">使用提示</div>
                          <div
                            v-for="tip in selectedSmallFeature.tips"
                            :key="tip"
                            class="small-feature-tips__item"
                          >
                            {{ tip }}
                          </div>
                        </div>

                        <div v-if="normalizedSmallFeatureFields.length" class="stack">
                          <SmallFeatureField
                            v-for="field in normalizedSmallFeatureFields"
                            :key="field.key"
                            v-model="smallFeatureFormState[field.key]"
                            :field="field"
                            :error="smallFeatureFormErrors[field.key] || ''"
                            @blur="validateSmallFeatureField(field)"
                          />
                        </div>
                        <div v-else class="muted">当前工具无需额外参数，可以直接执行。</div>

                        <div class="row wrap" style="margin-top: 16px">
                          <el-button
                            type="primary"
                            :disabled="!selectedSmallFeature || !selectedClientId"
                            :loading="loadingMap.runSmallFeature"
                            @click="sendRunSmallFeature"
                          >
                            执行工具
                          </el-button>
                        </div>
                      </template>

                      <el-empty v-else description="请选择要执行的工具" />
                    </div>
                  </div>
                </div>

                <div class="card panel">
                  <div class="section-title">执行结果</div>
                  <div
                    v-if="smallFeatureFeedback"
                    class="debug-feedback"
                    :data-success="smallFeatureFeedback.success"
                  >
                    <div class="debug-feedback__header">
                      <el-tag
                        :type="smallFeatureFeedback.success ? 'success' : 'danger'"
                        size="small"
                        effect="plain"
                      >
                        {{ smallFeatureFeedback.success ? "成功" : "失败" }}
                      </el-tag>
                      <span class="debug-feedback__message">{{ smallFeatureFeedback.message }}</span>
                    </div>
                    <div class="debug-feedback__meta">
                      <span>功能：{{ selectedSmallFeature?.name || selectedSmallFeatureKey || "-" }}</span>
                      <span v-if="smallFeatureFeedback.updatedAt">
                        时间：{{ smallFeatureFeedback.updatedAt }}
                      </span>
                    </div>
                    <div v-if="smallFeatureFeedback.suggestion" class="debug-feedback__hint">
                      建议：{{ smallFeatureFeedback.suggestion }}
                    </div>
                    <div
                      v-if="
                        smallFeatureFeedback.detail &&
                        smallFeatureFeedback.detail !== smallFeatureFeedback.message
                      "
                      class="debug-feedback__detail"
                    >
                      原始信息：{{ smallFeatureFeedback.detail }}
                    </div>
                  </div>
                  <pre class="result">{{ smallFeatureResultText || "暂无结果" }}</pre>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-dialog>

      <el-dialog
        v-model="profileDialogVisible"
        :title="editingProfileId ? '编辑执行环境' : '新增执行环境'"
        width="520px"
      >
        <el-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileFormRules"
          label-position="top"
          class="profile-form"
        >
          <el-form-item label="环境编号">
            <el-input
              v-model="profileForm.id"
              :disabled="!!editingProfileId"
              placeholder="环境编号，例如 001；留空则自动生成"
            />
          </el-form-item>
          <el-form-item label="环境名称" prop="name" required>
            <el-input v-model="profileForm.name" placeholder="请输入环境名称" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="profileForm.remark"
              type="textarea"
              :rows="3"
              placeholder="备注，可选"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="row" style="justify-content: flex-end">
            <el-button @click="profileDialogVisible = false">取消</el-button>
            <el-button
              type="primary"
              :loading="editingProfileId ? loadingMap.updateProfile : loadingMap.createProfile"
              @click="submitProfileForm"
            >
              {{ editingProfileId ? "保存" : "创建" }}
            </el-button>
          </div>
        </template>
      </el-dialog>

      <el-dialog v-model="detailVisible" title="任务详情" width="900px">
        <pre class="result">{{ detailText }}</pre>
      </el-dialog>
      <el-dialog v-model="logsVisible" title="任务日志" width="900px">
        <pre class="result">{{ logsText }}</pre>
      </el-dialog>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import type { VxeGridProps } from "vxe-table";
import {
  checkBrowserAutomationStatus,
  closeBrowserAutomation,
  closeBrowserAutomationProfile,
  connectBrowserAutomation,
  createBrowserAutomationProfile,
  deleteBrowserAutomationProfile,
  executeBrowserAutomationDebug,
  fetchBrowserAutomationPages,
  focusBrowserAutomationProfile,
  forceCloseBrowserAutomation,
  getBrowserAutomationSmallFeatures,
  getBrowserAutomationTaskDetail,
  getBrowserAutomationTaskLogs,
  openBrowserAutomationLink,
  queryBrowserAutomationTasks,
  runBrowserAutomationSmallFeature,
  switchBrowserAutomationProfile,
  updateBrowserAutomationProfile,
  type BrowserAutomationClientVO,
  type BrowserAutomationCommandResponse,
  type BrowserAutomationProfileInstanceSummary,
  type BrowserAutomationProfileSummary,
  type BrowserAutomationSmallFeatureItem,
  type BrowserAutomationServiceStatus,
} from "@/api/external/browserAutomation";
import {
  getBrowserAutomationBrowserText,
  getBrowserAutomationBrowserTone,
  getBrowserAutomationServiceText,
  getBrowserAutomationServiceTone,
} from "@/services/browserAutomationRuntime";
import { websocketClient, type ServiceCommandResultEvent } from "@/services/websocketClient";
import { usePluginClientNodes } from "@/services/clientNodeState";
import { buildOperationColumn, commonGridOptions } from "@/common/table";
import { formatDate } from "@/utils/formatTime";
import ExternalClientSidebar, {
  type ClientNodeItem,
} from "../components/ExternalClientSidebar.vue";
import SmallFeatureField from "./components/SmallFeatureField.vue";

defineOptions({ name: "ExternalBrowserAutomation" });

interface BrowserDebugFeedback {
  success: boolean;
  action: string | null;
  message: string;
  detail: string | null;
  step: string | null;
  code: string | null;
  suggestion: string | null;
  pageIndex: number | null;
  selector: string | null;
  url: string | null;
  timeout: boolean;
  updatedAt: string | null;
}

const {
  clients: rawClients,
  loading,
  refresh: refreshClientNodes,
  getServiceRuntime,
} = usePluginClientNodes("browser-automation");
const selectedClientId = ref("");
const activeTab = ref("browser");
const pageList = ref<Record<string, any>[]>([]);
const taskList = ref<Record<string, any>[]>([]);
const smallFeatureItems = ref<BrowserAutomationSmallFeatureItem[]>([]);
const debugResult = ref("");
const debugFeedback = ref<BrowserDebugFeedback | null>(null);
const smallFeatureResultText = ref("");
const smallFeatureFeedback = ref<BrowserDebugFeedback | null>(null);
const detailText = ref("");
const logsText = ref("");
const detailVisible = ref(false);
const logsVisible = ref(false);
const operationDialogVisible = ref(false);
const profileDialogVisible = ref(false);
const editingProfileId = ref<string | null>(null);
const profileFormRef = ref<FormInstance>();
const selectedSmallFeatureKey = ref("");

const loadingMap = reactive<Record<string, boolean>>({
  checkStatus: false,
  connect: false,
  close: false,
  focus: false,
  forceClose: false,
  pages: false,
  debug: false,
  tasks: false,
  taskDetail: false,
  taskLogs: false,
  smallFeatures: false,
  runSmallFeature: false,
  openLink: false,
  createProfile: false,
  updateProfile: false,
  deleteProfile: false,
  switchProfile: false,
});
const pending = reactive<Record<string, string>>({});

const browserForm = reactive({ port: 9222, headless: false, profileId: "" });
const openForm = reactive({ url: "" });
const profileForm = reactive({
  id: "",
  name: "",
  remark: "",
});
const profileFormRules: FormRules = {
  name: [
    {
      required: true,
      message: "请填写环境名称",
      trigger: "blur",
    },
  ],
};
const smallFeatureFormState = reactive<Record<string, any>>({});
const smallFeatureFormErrors = reactive<Record<string, string>>({});
const debugForm = reactive({
  pageIndex: 0,
  url: "",
  selector: "",
  text: "",
  key: "",
  expression: "",
  ms: 1000,
  timeout: 30000,
});
const taskFilters = reactive({ status: "", kind: "", sourceId: "" });
const debugActions = [
  "newPage",
  "goto",
  "bringToFront",
  "reload",
  "closePage",
  "click",
  "fill",
  "type",
  "press",
  "text",
  "html",
  "count",
  "wait",
  "screenshot",
];

const mapBrowserAutomationClient = (client: any): BrowserAutomationClientVO => ({
  clientId: client.id,
  isOnline: client.isOnline,
  nodeStatus: client.nodeStatus,
  connectedAt: client.connectedAt,
  lastOnlineAt: client.lastOnlineAt,
  lastOfflineAt: client.lastOfflineAt,
  appVersion: client.clientInfo?.appVersion || null,
  machine: client.clientInfo?.machine || null,
  location: client.clientInfo?.location || null,
  uploader: (getServiceRuntime(client) as BrowserAutomationServiceStatus | null) || null,
});

const clients = computed<BrowserAutomationClientVO[]>(() =>
  rawClients.value.map((client) => mapBrowserAutomationClient(client)),
);

const selectedClient = computed(
  () => clients.value.find((item) => item.clientId === selectedClientId.value) || null,
);
const selectedClientName = computed(
  () => selectedClient.value?.machine?.code || selectedClient.value?.clientId || "未选择节点",
);
const selectedService = computed<BrowserAutomationServiceStatus | null>(
  () => selectedClient.value?.uploader || null,
);
const selectedDetails = computed(() => selectedService.value?.details || {});
const profileItems = computed<BrowserAutomationProfileSummary[]>(() => {
  const profiles = selectedDetails.value?.profiles;
  return Array.isArray(profiles) ? profiles : [];
});
const profileInstances = computed<BrowserAutomationProfileInstanceSummary[]>(() => {
  const instances = selectedDetails.value?.instances;
  return Array.isArray(instances) ? instances : [];
});
const profileInstanceMap = computed(
  () =>
    new Map(
      profileInstances.value
        .map((item) => [String(item?.profileId || "").trim(), item] as const)
        .filter(([profileId]) => !!profileId),
    ),
);
const profileTableRows = computed(() =>
  profileItems.value.map((item) => {
    const instance = profileInstanceMap.value.get(String(item?.id || "").trim()) || null;
    const connection = selectedDetails.value?.connection;
    const isCurrentProfile =
      String(item?.id || "").trim() &&
      String(item?.id || "").trim() === String(activeProfileId.value || "").trim();

    return {
      ...item,
      instance,
      port:
        normalizeBrowserPortValue(instance) ??
        (isCurrentProfile ? normalizeBrowserPortValue(connection) : null),
    };
  }),
);
const profileGridOptions = ref<VxeGridProps<any>>({
  ...commonGridOptions,
  rowConfig: {
    keyField: "id",
    isHover: true,
  },
  columns: [
    { field: "id", title: "编号", width: 90, align: "left", headerAlign: "left" },
    {
      field: "name",
      title: "名称",
      minWidth: 180,
      showOverflow: "tooltip",
      align: "left",
      headerAlign: "left",
    },
    {
      field: "port",
      title: "端口",
      width: 90,
      align: "left",
      headerAlign: "left",
      formatter: ({ row }) => row?.port ?? "-",
    },
    {
      field: "lastUsedAt",
      title: "最近使用",
      minWidth: 170,
      align: "left",
      headerAlign: "left",
      slots: { default: "lastUsedAt_default" },
    },
    {
      field: "instance",
      title: "浏览器状态",
      minWidth: 200,
      align: "left",
      headerAlign: "left",
      slots: { default: "instance_default" },
    },
    {
      field: "pageCount",
      title: "页面",
      width: 80,
      align: "left",
      headerAlign: "left",
      slots: { default: "pageCount_default" },
    },
    {
      field: "isActive",
      title: "状态",
      width: 100,
      align: "left",
      headerAlign: "left",
      slots: { default: "status_default" },
    },
    buildOperationColumn("profileOperation_default", 110, {
      align: "left",
      headerAlign: "left",
    }),
  ],
});
const activeProfileId = computed(
  () =>
    String(
      selectedDetails.value?.activeProfileId ||
        selectedDetails.value?.activeProfile?.id ||
        "",
    ).trim() || "",
);
const activeProfile = computed(
  () =>
    profileItems.value.find(
      (item) => item?.isActive === true || item?.id === activeProfileId.value,
    ) || null,
);
const currentProfileId = computed(
  () =>
    String(
      browserForm.profileId || activeProfileId.value || profileItems.value[0]?.id || "",
    ).trim() || "",
);
const currentProfile = computed(
  () =>
    profileItems.value.find((item) => String(item?.id || "").trim() === currentProfileId.value) ||
    null,
);
const currentProfileInstance = computed(
  () => profileInstanceMap.value.get(currentProfileId.value) || null,
);
const currentProfileName = computed(
  () =>
    currentProfile.value?.name ||
    currentProfileInstance.value?.profileName ||
    currentProfileId.value ||
    "未选择环境",
);
const operationDialogTitle = computed(() => {
  const clientName = selectedClientName.value;
  const profileName = currentProfileId.value
    ? `${currentProfileName.value} (${currentProfileId.value})`
    : "未选择环境";
  return `集中操作台 · ${clientName} · ${profileName}`;
});
const hasAnyConnectedProfile = computed(
  () =>
    profileInstances.value.some(
      (item) => item.connected === true || item.hasInstance === true,
    ) ||
    selectedDetails.value?.browserConnected === true ||
    selectedDetails.value?.hasInstance === true,
);
const serviceEnabled = computed(() =>
  Boolean(selectedClient.value?.isOnline && selectedService.value?.connected),
);
const browserReady = computed(() => Boolean(serviceEnabled.value && hasAnyConnectedProfile.value));
const currentProfileConnected = computed(() => {
  if (!currentProfileId.value) {
    return browserReady.value;
  }
  return currentProfileInstance.value?.connected === true;
});
const canLoadCurrentProfilePages = computed(() => {
  if (!serviceEnabled.value) {
    return false;
  }
  if (!currentProfileId.value) {
    return browserReady.value;
  }
  return currentProfileConnected.value;
});
const canDebugCurrentProfile = computed(() => canLoadCurrentProfilePages.value);
const currentProfileStatusText = computed(() =>
  getProfileInstanceText(currentProfileInstance.value),
);
const selectedSmallFeature = computed(
  () =>
    smallFeatureItems.value.find((item) => item.key === selectedSmallFeatureKey.value) || null,
);
const normalizedSmallFeatureFields = computed(() =>
  normalizeSmallFeatureFields(selectedSmallFeature.value),
);
const clientNodeItems = computed<ClientNodeItem[]>(() =>
  clients.value.map((client) => ({
    connectionId: client.clientId,
    name: client.machine?.code || client.clientId,
    time: dateText(client.lastOnlineAt || client.connectedAt || client.lastOfflineAt),
    metaLeft: client.appVersion || "未知版本",
    metaRight: client.location?.ip || client.location?.city || "未知位置",
    badges: [
      { text: client.isOnline ? "在线" : "离线", tone: client.isOnline ? "success" : "muted" },
      {
        text: getBrowserAutomationServiceText(client.uploader),
        tone: getBrowserAutomationServiceTone(client.uploader),
      },
      {
        text: getBrowserAutomationBrowserText(client.uploader),
        tone: getBrowserAutomationBrowserTone(client.uploader),
      },
    ],
  })),
);

const dateText = (value?: string | null) =>
  value ? formatDate(new Date(value), "YYYY-MM-DD HH:mm:ss") : "-";
function normalizeBrowserPortValue(source: any) {
  const candidates = [
    source?.port,
    source?.debugPort,
    source?.remoteDebuggingPort,
    source?.remoteDebugPort,
  ];

  for (const candidate of candidates) {
    const port = Number(candidate);
    if (Number.isInteger(port) && port > 0) {
      return port;
    }
  }

  return null;
}
const normalizeBrowserAutomationKey = (value?: string | null) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (
    normalized === "uploader" ||
    normalized === "browser" ||
    normalized === "browser-automation"
  ) {
    return "browser-automation";
  }
  return normalized;
};
const jsonText = (value: any) => {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value);
  }
};
const toNullableText = (value: any) => {
  const normalized = String(value || "").trim();
  return normalized || null;
};
const getCommandErrorDetail = (event: ServiceCommandResultEvent) => {
  if (
    event.errorDetail &&
    typeof event.errorDetail === "object" &&
    !Array.isArray(event.errorDetail)
  ) {
    return event.errorDetail as Record<string, any>;
  }

  const dataDetail = event.data?.errorDetail;
  if (dataDetail && typeof dataDetail === "object" && !Array.isArray(dataDetail)) {
    return dataDetail as Record<string, any>;
  }

  return null;
};
const buildDebugFeedback = (event: ServiceCommandResultEvent, action?: string) => {
  const errorDetail = getCommandErrorDetail(event);
  const pageIndexValue =
    typeof errorDetail?.pageIndex === "number"
      ? errorDetail.pageIndex
      : typeof event.data?.pageIndex === "number"
        ? event.data.pageIndex
        : null;

  return {
    success: !!event.success,
    action: toNullableText(action || event.action),
    message:
      toNullableText(errorDetail?.userMessage) ||
      toNullableText(event.message) ||
      toNullableText(event.error) ||
      (event.success ? "执行成功" : "执行失败"),
    detail:
      toNullableText(errorDetail?.rawMessage) ||
      (event.success ? null : toNullableText(event.error || event.message)),
    step: toNullableText(errorDetail?.step),
    code: toNullableText(errorDetail?.code),
    suggestion: toNullableText(errorDetail?.suggestion),
    pageIndex: pageIndexValue,
    selector: toNullableText(errorDetail?.selector),
    url: toNullableText(errorDetail?.url || event.data?.url),
    timeout: errorDetail?.timeout === true,
    updatedAt: toNullableText(event.finishedAt),
  } satisfies BrowserDebugFeedback;
};
const buildDebugResultText = (feedback: BrowserDebugFeedback, data: Record<string, any>) => {
  if (feedback.action === "pages") {
    return jsonText({
      action: feedback.action,
      success: feedback.success,
      message: feedback.message,
      step: feedback.step,
      code: feedback.code,
      suggestion: feedback.suggestion,
      pageCount: Array.isArray(data?.pages) ? data.pages.length : 0,
      pages: Array.isArray(data?.pages) ? data.pages : [],
      runtime: data?.runtime || null,
      updatedAt: feedback.updatedAt,
    });
  }

  return jsonText({
    action: feedback.action,
    success: feedback.success,
    message: feedback.message,
    step: feedback.step,
    code: feedback.code,
    suggestion: feedback.suggestion,
    pageIndex: feedback.pageIndex,
    selector: feedback.selector,
    url: feedback.url,
    timeout: feedback.timeout,
    result: data || null,
    updatedAt: feedback.updatedAt,
  });
};
const resetDebugOutput = () => {
  debugFeedback.value = null;
  debugResult.value = "";
};
const resetReactiveRecord = (
  target: Record<string, any>,
  nextValue: Record<string, any> = {},
) => {
  Object.keys(target).forEach((key) => {
    delete target[key];
  });
  Object.entries(nextValue).forEach(([key, value]) => {
    target[key] = value;
  });
};
const normalizeSmallFeatureFields = (feature?: BrowserAutomationSmallFeatureItem | null) => {
  return (feature?.fields || [])
    .filter((field) => String(field?.key || "").trim() !== "profileId")
    .map((field) => {
    const type = String(field?.type || "text").trim() || "text";
    return {
      ...field,
      component:
        type === "boolean"
          ? "switch"
          : type === "password"
            ? "password"
            : type === "select"
              ? "select"
              : type === "array-text"
                ? "array-text"
                : "input",
      inputType: type === "password" ? "password" : "text",
    };
  });
};
const buildDynamicDefaultState = (fields: Array<Record<string, any>> = []) => {
  const nextState: Record<string, any> = {};
  fields.forEach((field) => {
    const key = String(field?.key || "").trim();
    if (!key) return;
    if (field.component === "switch") {
      nextState[key] =
        field.defaultValue !== undefined ? !!field.defaultValue : false;
      return;
    }
    if (field.component === "array-text") {
      nextState[key] = Array.isArray(field.defaultValue)
        ? field.defaultValue.join("\n")
        : typeof field.defaultValue === "string"
          ? field.defaultValue
          : "";
      return;
    }
    nextState[key] = field.defaultValue ?? "";
  });
  return nextState;
};
const isMissingDynamicFieldValue = (field: Record<string, any>, value: unknown) => {
  if (field.component === "switch") {
    return value === undefined || value === null;
  }
  return !String(value ?? "").trim();
};
const validateDynamicField = (
  field: Record<string, any>,
  state: Record<string, any>,
  errors: Record<string, string>,
) => {
  const key = String(field?.key || "").trim();
  if (!key) return true;
  if (field.required && isMissingDynamicFieldValue(field, state[key])) {
    errors[key] = `请填写${field.label || key}`;
    return false;
  }
  errors[key] = "";
  return true;
};
const validateSmallFeatureField = (field: Record<string, any>) =>
  validateDynamicField(field, smallFeatureFormState, smallFeatureFormErrors);
const validateSmallFeatureForm = () => {
  let valid = true;
  normalizedSmallFeatureFields.value.forEach((field) => {
    if (!validateDynamicField(field, smallFeatureFormState, smallFeatureFormErrors)) {
      valid = false;
    }
  });
  return valid;
};
const buildDynamicPayload = (fields: Array<Record<string, any>>, state: Record<string, any>) => {
  const payload: Record<string, any> = {};
  fields.forEach((field) => {
    const key = String(field?.key || "").trim();
    if (!key) return;
    const rawValue = state[key];
    if (field.component === "switch") {
      payload[key] = !!rawValue;
      return;
    }
    if (field.component === "array-text") {
      const values = String(rawValue || "")
        .split(/\r?\n|,|，/)
        .map((item) => item.trim())
        .filter(Boolean);
      if (values.length) {
        payload[key] = values;
      }
      return;
    }
    const normalized = String(rawValue ?? "").trim();
    if (normalized) {
      payload[key] = normalized;
    }
  });
  return payload;
};
const syncSelectedSmallFeature = () => {
  if (!smallFeatureItems.value.length) {
    selectedSmallFeatureKey.value = "";
    return;
  }
  if (
    !smallFeatureItems.value.some((item) => item.key === selectedSmallFeatureKey.value)
  ) {
    selectedSmallFeatureKey.value = smallFeatureItems.value[0]?.key || "";
  }
};
const initializeSmallFeatureFormState = () => {
  resetReactiveRecord(
    smallFeatureFormState,
    buildDynamicDefaultState(normalizedSmallFeatureFields.value),
  );
  resetReactiveRecord(smallFeatureFormErrors, {});
};
const resetSmallFeatureOutput = () => {
  smallFeatureFeedback.value = null;
  smallFeatureResultText.value = "";
};
const normalizePageOption = (page: Record<string, any>, fallbackIndex: number) => {
  const rawIndex =
    typeof page?.index === "number"
      ? page.index
      : typeof page?.pageIndex === "number"
        ? page.pageIndex
        : fallbackIndex;
  const title = String(page?.title || page?.name || `页面 ${rawIndex}`);
  const url = String(page?.url || "");

  return {
    ...page,
    index: rawIndex,
    title,
    url,
    isActive:
      page?.isActive === true ||
      page?.active === true ||
      page?.current === true ||
      page?.selected === true,
    optionKey: `${rawIndex}-${title}-${url}`,
    optionLabel: `#${rawIndex} ${title}${url ? ` · ${url}` : ""}`,
  };
};
const getPagesFromClient = (
  client?: BrowserAutomationClientVO | null,
  profileId?: string | null,
) => {
  const normalizedProfileId = String(profileId || "").trim();
  if (normalizedProfileId) {
    const instances = client?.uploader?.details?.instances;
    if (Array.isArray(instances)) {
      const matchedInstance = instances.find(
        (item: Record<string, any>) =>
          String(item?.profileId || "").trim() === normalizedProfileId,
      );
      if (Array.isArray(matchedInstance?.pages)) {
        return matchedInstance.pages;
      }
    }
  }

  const pages = client?.uploader?.details?.pages;
  return Array.isArray(pages) ? pages : [];
};
const pageOptions = computed(() =>
  pageList.value.map((page, index) => normalizePageOption(page, index)),
);
const selectedDebugPage = computed(
  () => pageOptions.value.find((page) => page.index === debugForm.pageIndex) || null,
);
const syncSelectedPages = () => {
  pageList.value = getPagesFromClient(selectedClient.value, currentProfileId.value);
};
const syncDebugPageIndex = () => {
  if (!pageOptions.value.length) {
    debugForm.pageIndex = 0;
    return;
  }

  const exists = pageOptions.value.some((page) => page.index === debugForm.pageIndex);
  if (exists) {
    return;
  }

  const preferredPage =
    pageOptions.value.find((page) => page.isActive) || pageOptions.value[0] || null;
  if (preferredPage) {
    debugForm.pageIndex = preferredPage.index;
  }
};
const selectDebugPage = (page: Record<string, any>) => {
  const normalizedPage = normalizePageOption(page, 0);
  debugForm.pageIndex = normalizedPage.index;
  if (activeTab.value !== "debug") {
    activeTab.value = "debug";
  }
};
const handlePageRowClick = (row: Record<string, any>) => {
  selectDebugPage(row);
};
const getPageRowClassName = ({ row }: { row: Record<string, any> }) => {
  return row?.index === debugForm.pageIndex ? "page-row-is-active" : "";
};
const getProfileInstanceText = (
  instance?: BrowserAutomationProfileInstanceSummary | null,
) => {
  if (!instance) return "未打开";
  if (instance.busy) return "执行中";
  if (instance.connected) return "已打开";
  if (instance.hasInstance || instance.connecting) return "连接中";
  return "未打开";
};
const getProfileInstanceTagType = (
  instance?: BrowserAutomationProfileInstanceSummary | null,
) => {
  if (instance?.busy) return "warning";
  if (instance?.connected) return "success";
  if (instance?.hasInstance || instance?.connecting) return "info";
  return "info";
};
const getProfileInstanceHint = (
  instance?: BrowserAutomationProfileInstanceSummary | null,
) => {
  if (!instance) return "浏览器窗口未打开";
  if (instance.busy) {
    return instance.currentTaskId
      ? `任务 ${instance.currentTaskId} 执行中`
      : "当前环境正在执行任务";
  }
  if (instance.connected) {
    return `已打开 ${instance.pageCount ?? 0} 个页面`;
  }
  if (instance.hasInstance || instance.connecting) {
    return "浏览器正在建立连接";
  }
  return "浏览器窗口未打开";
};
const setOperationProfile = (profileId?: string | null) => {
  const normalizedProfileId = String(profileId || "").trim();
  browserForm.profileId = normalizedProfileId;
};
const openOperationPanelForProfile = (
  profileId?: string | null,
  port?: number | null,
) => {
  setOperationProfile(profileId);
  const normalizedPort = normalizeBrowserPortValue({ port });
  if (normalizedPort) {
    browserForm.port = normalizedPort;
  }
  operationDialogVisible.value = true;
};
const resetProfileForm = () => {
  editingProfileId.value = null;
  profileForm.id = "";
  profileForm.name = "";
  profileForm.remark = "";
};
const openCreateProfileDialog = () => {
  resetProfileForm();
  profileDialogVisible.value = true;
  void nextTick(() => {
    profileFormRef.value?.clearValidate();
  });
};
const openEditProfileDialog = (profile: BrowserAutomationProfileSummary) => {
  resetProfileForm();
  editingProfileId.value = profile.id;
  profileDialogVisible.value = true;
  profileForm.id = String(profile.id || "").trim();
  profileForm.name = String(profile.name || "").trim();
  profileForm.remark = String(profile.remark || "").trim();
  void nextTick(() => {
    profileFormRef.value?.clearValidate();
  });
};
const handleProfileOperationCommand = (
  command: string,
  row: BrowserAutomationProfileSummary & {
    port?: number | null;
    instance?: BrowserAutomationProfileInstanceSummary | null;
  },
) => {
  switch (command) {
    case "connect":
      void sendConnect(row.id);
      break;
    case "close":
      void sendCloseProfile(row.id);
      break;
    case "focus":
      void sendFocusProfile(row.id);
      break;
    case "panel":
      openOperationPanelForProfile(row.id, row.port);
      break;
    case "switch":
      void sendSwitchProfile(row.id);
      break;
    case "edit":
      openEditProfileDialog(row);
      break;
    case "delete":
      void sendDeleteProfile(row.id);
      break;
  }
};
const submitProfileForm = async () => {
  if (!selectedClientId.value) return;
  const valid = await profileFormRef.value?.validate().catch(() => false);
  if (valid === false) {
    return;
  }
  const payload = {
    ...(editingProfileId.value ? {} : { id: profileForm.id.trim() || undefined }),
    name: profileForm.name.trim() || undefined,
    remark: profileForm.remark.trim() || undefined,
  };

  if (editingProfileId.value) {
    return dispatch(
      "updateProfile",
      () =>
        updateBrowserAutomationProfile(
          selectedClientId.value,
          editingProfileId.value as string,
          payload,
        ),
      "更新环境命令已发送",
    );
  }

  return dispatch(
    "createProfile",
    () => createBrowserAutomationProfile(selectedClientId.value, payload),
    "创建环境命令已发送",
  );
};
const sendSwitchProfile = async (profileId: string) =>
  selectedClientId.value &&
  dispatch(
    "switchProfile",
    () => switchBrowserAutomationProfile(selectedClientId.value, profileId),
    "设为默认环境命令已发送",
  );
const sendDeleteProfile = async (profileId: string) => {
  if (!selectedClientId.value) return;
  try {
    await ElMessageBox.confirm(
      `确认删除执行环境 ${profileId} 吗？会同时删除对应缓存目录。`,
      "删除环境",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
      },
    );
  } catch {
    return;
  }

  return dispatch(
    "deleteProfile",
    () => deleteBrowserAutomationProfile(selectedClientId.value, profileId),
    "删除环境命令已发送",
  );
};

const finish = (action?: string) => {
  if (action && action in loadingMap) loadingMap[action] = false;
};

const dispatch = async (
  action: string,
  requestor: () => Promise<BrowserAutomationCommandResponse>,
  okText: string,
) => {
  if (loadingMap[action]) return;
  loadingMap[action] = true;
  try {
    const response = await requestor();
    if (!response?.success) {
      finish(action);
      ElMessage.error(response?.message || "命令发送失败");
      return;
    }
    const commandId = response.data?.commandId;
    if (!commandId) {
      finish(action);
      return;
    }
    pending[commandId] = action;
    ElMessage.success(okText);
  } catch (error: any) {
    finish(action);
    ElMessage.error(error?.message || "命令发送失败");
  }
};

const loadClients = async () => {
  await refreshClientNodes();
  if (
    !selectedClientId.value ||
    !clients.value.some((item) => item.clientId === selectedClientId.value)
  ) {
    selectedClientId.value = clients.value[0]?.clientId || "";
  }
  syncSelectedPages();
};

const handleRefreshClients = async () => {
  await loadClients();
};

const sendSimple = async (kind: "checkStatus" | "close" | "pages") => {
  if (!selectedClientId.value) return;
  const targetProfileId = currentProfileId.value || undefined;
  if (kind === "pages") {
    resetDebugOutput();
  }
  if (kind === "checkStatus")
    return dispatch(
      "checkStatus",
      () => checkBrowserAutomationStatus(selectedClientId.value),
      "状态刷新命令已发送",
    );
  if (kind === "close")
    return sendCloseProfile(targetProfileId);
  return dispatch(
    "pages",
    () => fetchBrowserAutomationPages(selectedClientId.value, targetProfileId),
    "获取页面命令已发送",
  );
};

const sendConnect = async (profileId?: string | null) => {
  if (!selectedClientId.value) return;
  const normalizedProfileId = String(profileId || browserForm.profileId || "").trim();
  if (normalizedProfileId) {
    browserForm.profileId = normalizedProfileId;
  }
  return dispatch(
    "connect",
    () =>
      connectBrowserAutomation(selectedClientId.value, {
        ...browserForm,
        ...(normalizedProfileId ? { profileId: normalizedProfileId } : {}),
      }),
    "连接命令已发送",
  );
};
const sendCloseProfile = async (profileId?: string | null) => {
  if (!selectedClientId.value) return;
  const normalizedProfileId = String(profileId || "").trim();
  return dispatch(
    "close",
    () =>
      normalizedProfileId
        ? closeBrowserAutomationProfile(selectedClientId.value, normalizedProfileId)
        : closeBrowserAutomation(selectedClientId.value),
    "关闭命令已发送",
  );
};
const sendFocusProfile = async (profileId?: string | null) => {
  if (!selectedClientId.value) return;
  const normalizedProfileId = String(profileId || "").trim();
  return dispatch(
    "focus",
    () => focusBrowserAutomationProfile(selectedClientId.value, normalizedProfileId || undefined),
    "聚焦窗口命令已发送",
  );
};
const sendForceClose = async () =>
  selectedClientId.value &&
  dispatch(
    "forceClose",
    () => forceCloseBrowserAutomation(selectedClientId.value, { port: browserForm.port }),
    "强制关闭命令已发送",
  );
const sendOpenLink = async () =>
  selectedClientId.value &&
  openForm.url.trim() &&
  dispatch(
    "openLink",
    () =>
      openBrowserAutomationLink(selectedClientId.value, {
        url: openForm.url.trim(),
        ...(currentProfileId.value ? { profileId: currentProfileId.value } : {}),
      }),
    "打开链接命令已发送",
  );
const sendDebug = async (action: string) =>
  selectedClientId.value &&
  (resetDebugOutput(),
  dispatch(
    "debug",
    () =>
      executeBrowserAutomationDebug(selectedClientId.value, {
        action,
        ...debugForm,
        ...(currentProfileId.value ? { profileId: currentProfileId.value } : {}),
      }),
    "调试命令已发送",
  ));
const sendTasks = async () =>
  selectedClientId.value &&
  dispatch(
    "tasks",
    () => queryBrowserAutomationTasks(selectedClientId.value, taskFilters),
    "任务查询命令已发送",
  );
const sendTaskDetail = async (taskId: string) =>
  selectedClientId.value &&
  dispatch(
    "taskDetail",
    () => getBrowserAutomationTaskDetail(selectedClientId.value, taskId),
    "任务详情命令已发送",
  );
const sendTaskLogs = async (taskId: string) =>
  selectedClientId.value &&
  dispatch(
    "taskLogs",
    () => getBrowserAutomationTaskLogs(selectedClientId.value, taskId),
    "任务日志命令已发送",
  );
const sendSmallFeatures = async () =>
  selectedClientId.value &&
  dispatch(
    "smallFeatures",
    () => getBrowserAutomationSmallFeatures(selectedClientId.value),
    "工具目录请求已发送",
  );
const sendRunSmallFeature = async () => {
  if (!selectedClientId.value) return;
  if (!selectedSmallFeature.value) {
    ElMessage.warning("请先选择要执行的工具");
    return;
  }
  if (!validateSmallFeatureForm()) {
    ElMessage.warning("请先完善工具参数");
    return;
  }

  resetSmallFeatureOutput();
  return dispatch(
    "runSmallFeature",
    () =>
      runBrowserAutomationSmallFeature(selectedClientId.value, {
        featureKey: selectedSmallFeature.value?.key,
        ...(currentProfileId.value ? { profileId: currentProfileId.value } : {}),
        ...buildDynamicPayload(
          normalizedSmallFeatureFields.value,
          smallFeatureFormState,
        ),
      }),
    "工具执行命令已发送",
  );
};

const onCommand = async (event: ServiceCommandResultEvent) => {
  if (normalizeBrowserAutomationKey(event.pluginKey || event.service) !== "browser-automation")
    return;
  const action = pending[event.commandId];
  if (!action) {
    return;
  }
  delete pending[event.commandId];
  finish(action);
  const data = event.data || {};
  const feedback = buildDebugFeedback(event, action);
  if (event.clientId === selectedClientId.value) {
    if (Array.isArray(data.pages)) pageList.value = data.pages;
    if (action === "debug" || action === "pages") {
      debugFeedback.value = feedback;
      debugResult.value = buildDebugResultText(feedback, data);
    }
    if (action === "tasks") taskList.value = Array.isArray(data.items) ? data.items : [];
    if (action === "taskDetail") {
      detailText.value = jsonText(data.task || null);
      detailVisible.value = true;
    }
    if (action === "taskLogs") {
      logsText.value = jsonText(data.logs || []);
      logsVisible.value = true;
    }
    if (action === "smallFeatures") {
      smallFeatureItems.value = Array.isArray(data.items) ? data.items : [];
      syncSelectedSmallFeature();
    }
    if (action === "runSmallFeature") {
      smallFeatureFeedback.value = feedback;
      smallFeatureResultText.value = jsonText({
        action: feedback.action,
        success: feedback.success,
        message: feedback.message,
        featureKey: data.featureKey || selectedSmallFeatureKey.value || null,
        result: data.result || null,
        updatedAt: feedback.updatedAt,
      });
    }
  }
  if (event.success && (action === "createProfile" || action === "updateProfile")) {
    profileDialogVisible.value = false;
    resetProfileForm();
  }
  (event.success ? ElMessage.success : ElMessage.error)(feedback.message);
  await loadClients();
};

watch(clients, (list) => {
  if (!selectedClientId.value || !list.some((item) => item.clientId === selectedClientId.value)) {
    selectedClientId.value = list[0]?.clientId || "";
  }
});

watch(
  selectedDetails,
  () => {
    syncSelectedPages();
    syncDebugPageIndex();
  },
  { deep: true },
);

watch(selectedClientId, (value) => {
  syncSelectedPages();
  syncDebugPageIndex();
  resetDebugOutput();
  smallFeatureItems.value = [];
  selectedSmallFeatureKey.value = "";
  resetReactiveRecord(smallFeatureFormState, {});
  resetReactiveRecord(smallFeatureFormErrors, {});
  resetSmallFeatureOutput();
  browserForm.profileId = activeProfileId.value || "";
  if (!value) operationDialogVisible.value = false;
  if (value && operationDialogVisible.value && activeTab.value === "smallFeature") {
    void sendSmallFeatures();
  }
});

watch(
  currentProfileId,
  () => {
    syncSelectedPages();
    syncDebugPageIndex();
    resetDebugOutput();
    resetSmallFeatureOutput();
  },
  { immediate: true },
);

watch(
  activeProfileId,
  (value) => {
    if (!value) {
      browserForm.profileId = "";
      return;
    }
    if (!browserForm.profileId || !profileItems.value.some((item) => item.id === browserForm.profileId)) {
      browserForm.profileId = value;
    }
  },
  { immediate: true },
);

watch(selectedSmallFeatureKey, () => {
  initializeSmallFeatureFormState();
});

watch(
  pageOptions,
  () => {
    syncDebugPageIndex();
  },
  { deep: true, immediate: true },
);

watch([operationDialogVisible, activeTab, canLoadCurrentProfilePages], ([visible, tab, ready]) => {
  if (!visible) return;
  if (tab === "smallFeature") {
    if (!smallFeatureItems.value.length && !loadingMap.smallFeatures && selectedClientId.value) {
      void sendSmallFeatures();
    }
    return;
  }
  if (!ready) return;
  if ((tab === "browser" || tab === "debug") && !pageOptions.value.length && !loadingMap.pages) {
    void sendSimple("pages");
  }
});

onMounted(async () => {
  await loadClients();
  websocketClient.events.on("serviceCommandResult", onCommand);
});

onUnmounted(() => {
  websocketClient.events.off("serviceCommandResult", onCommand);
});
</script>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
}

.actions,
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wrap {
  flex-wrap: wrap;
}

.layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 12px;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.console-entry {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 16px;
}

.supported-task-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.supported-task-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.supported-task-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.supported-task-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 180px;
  min-height: 48px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
}

.supported-task-chip__label {
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.supported-task-chip__key {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.4;
  font-family: Consolas, Monaco, "Courier New", monospace;
  word-break: break-all;
}

.console-entry__content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  text-align: left;
}

.console-entry :deep(.el-button) {
  align-self: flex-start;
}

.card {
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.panel,
.item,
.main-empty {
  padding: 12px;
}

.panel,
.stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.table-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.browser-profile-banner-row {
  align-items: stretch;
}

.active-profile-banner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  min-width: 0;
  padding: 6px 10px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.035), rgba(16, 185, 129, 0.055));
  color: var(--el-text-color-primary);
}

.active-profile-banner__flag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.active-profile-banner__name {
  max-width: 320px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.active-profile-banner__id {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  max-width: 220px;
  padding: 0 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.72);
  color: rgba(71, 85, 105, 0.92);
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-active-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.profile-active-badge__dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: currentColor;
}

.profile-active-badge.is-active {
  border-color: rgba(34, 197, 94, 0.26);
  background: linear-gradient(180deg, rgba(34, 197, 94, 0.14), rgba(34, 197, 94, 0.06));
  color: #15803d;
  box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.08);
}

.profile-active-badge.is-standby {
  border-color: rgba(148, 163, 184, 0.32);
  background: rgba(148, 163, 184, 0.08);
  color: #64748b;
}

.common-table {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.common-table--full :deep(.vxe-grid),
.common-table--full :deep(.vxe-table),
.common-table--full :deep(.vxe-table--render-wrapper),
.common-table--full :deep(.vxe-table--main-wrapper),
.profile-grid {
  width: 100%;
}

.profile-grid :deep(.vxe-header--column),
.profile-grid :deep(.vxe-body--column) {
  text-align: left;
}

.main-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 560px;
}

.summary,
.grid,
.action-grid {
  display: grid;
  gap: 12px;
}

.summary {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.action-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.label,
.muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.value,
.section-title {
  font-weight: 600;
}

.value {
  margin-top: 4px;
  font-size: 15px;
  line-height: 1.4;
}

.section-title {
  font-size: 13px;
  line-height: 1.2;
}

@media (max-width: 768px) {
  .active-profile-banner {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
    padding: 8px 10px;
    border-radius: 16px;
  }

  .active-profile-banner__name {
    max-width: 100%;
    white-space: normal;
    word-break: break-word;
  }
}

.row :deep(.el-input),
.row :deep(.el-select),
.row :deep(.el-input-number) {
  flex: 1;
  min-width: 0;
}

.stack :deep(.el-input),
.stack :deep(.el-input-number),
.stack :deep(.el-date-editor) {
  width: 100%;
}

.debug-feedback {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.debug-feedback[data-success="false"] {
  border-color: var(--el-color-danger-light-5);
  background: var(--el-color-danger-light-9);
}

.debug-feedback__header,
.debug-feedback__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.debug-feedback__message {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.debug-feedback__meta,
.debug-feedback__detail,
.debug-feedback__hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.result {
  margin: 0;
  padding: 12px;
  min-height: 180px;
  max-height: 420px;
  overflow: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.operation-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.browser-automation-dialog :deep(.el-dialog__body) {
  padding-top: 12px;
}

.profile-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.debug-page-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.debug-page-meta__title {
  font-size: 12px;
  color: var(--el-text-color-secondary);

  span {
    color: var(--el-text-color-primary);
    font-weight: 600;
  }
}

.debug-page-meta__url {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.small-feature-grid {
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.8fr);
  align-items: start;
}

.small-feature-panel__head,
.small-feature-detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.small-feature-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 12px;
}

.small-feature-list,
.small-feature-detail,
.small-feature-tips {
  display: flex;
  flex-direction: column;
}

.small-feature-list {
  gap: 10px;
}

.small-feature-detail {
  gap: 12px;
  min-width: 0;
}

.small-feature-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-fill-color-blank);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.small-feature-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 10px 22px rgba(32, 98, 196, 0.08);
}

.small-feature-card.is-active {
  border-color: var(--el-color-primary);
  box-shadow: 0 12px 24px rgba(32, 98, 196, 0.12);
  transform: translateY(-1px);
}

.small-feature-card__head,
.small-feature-detail__badges {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.small-feature-card__name,
.small-feature-detail__title,
.small-feature-tips__title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.small-feature-card__category {
  font-size: 12px;
  color: var(--el-color-warning-dark-2);
}

.small-feature-card__meta,
.small-feature-card__desc,
.small-feature-detail__desc,
.small-feature-tips__item {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.small-feature-tips {
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.browser-automation-dialog :deep(.page-row-is-active) {
  --el-table-tr-bg-color: var(--el-color-primary-light-9);
}

@media (max-width: 1200px) {
  .layout,
  .summary,
  .grid,
  .action-grid {
    grid-template-columns: 1fr;
  }

  .small-feature-layout,
  .small-feature-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .console-entry {
    flex-direction: column;
    align-items: stretch;
  }

  .actions {
    flex-wrap: wrap;
  }
}
</style>
