<template>
  <ContentWrap :plain="true" class="psd-set-page">
    <ListPageLayout class="psd-set-page__layout">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat psd-set-page__filter">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="ID">
                  <el-input v-model="queryParams.id" size="small" placeholder="套图ID" clearable
                    @change="handleIdChange" />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="关键词">
                  <el-input v-model="queryParams.keyword" size="small" placeholder="名称 / 描述 / 关键词" clearable
                    @change="handleKeywordChange" />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="状态">
                  <el-select v-model="queryParams.status" size="small" placeholder="全部状态" clearable @change="getList">
                    <el-option v-for="item in statusOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="排序方式">
                  <el-select v-model="queryParams.sortingFields" size="small" @change="getList">
                    <el-option v-for="item in sortTypeOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="12" :lg="7">
                <el-form-item label="创建时间">
                  <el-date-picker v-model="dateRange" size="small" type="datetimerange" range-separator="至"
                    start-placeholder="开始时间" end-placeholder="结束时间" format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DD HH:mm:ss" :shortcuts="dateShortcuts" @change="handleDateRangeChange" />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="12" :lg="6">
                <el-form-item label="查重配置">
                  <el-select v-model="queryParams.publishUsageConfigId" size="small" placeholder="选择后标记已用图片"
                    clearable filterable multiple collapse-tags collapse-tags-tooltip
                    @change="handlePublishUsageViewChange">
                    <el-option v-for="item in publishUsageConfigOptions" :key="item.id"
                      :label="formatPublishUsageConfigLabel(item)" :value="item.id" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions psd-set-page__actions">
              <el-button size="small" type="primary" :icon="Search" :loading="loading"
                @click="() => getList()">搜索</el-button>
              <el-dropdown trigger="click" :disabled="!selectedIds.length">
                <el-button size="small" :disabled="!selectedIds.length" :loading="batchUpdatingStatus">
                  批量改状态 ({{ selectedIds.length }})
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu class="operation-menu-compact">
                    <el-dropdown-item @click="() => handleBatchUpdateStatus('pending')">待制作</el-dropdown-item>
                    <el-dropdown-item @click="() => handleBatchUpdateStatus('processing')">制作中</el-dropdown-item>
                    <el-dropdown-item @click="() => handleBatchUpdateStatus('completed')">已完成</el-dropdown-item>
                    <el-dropdown-item @click="() => handleBatchUpdateStatus('failed')">失败</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button size="small" type="success" :disabled="!selectedIds.length" :loading="batchGeneratingProducts"
                @click="handleBatchGenerateProduct">
                生成产品 ({{ selectedIds.length }})
              </el-button>
              <el-button size="small" type="primary" :disabled="!selectedIds.length" :loading="publishConfigSubmitting"
                @click="handleBatchCreatePublishTask">
                生成发布任务 ({{ selectedIds.length }})
              </el-button>
              <el-button size="small" type="danger" @click="handleBatchDelete"
                :disabled="!selectedIds.length || loading">
                批量删除 ({{ selectedIds.length }})
              </el-button>
              <div class="psd-set-page__auto-dispatch">
                <div class="psd-set-page__auto-dispatch-main">
                  <div class="psd-set-page__auto-dispatch-title">自动调度</div>

                  <div class="psd-set-page__auto-dispatch-runtime" :class="`is-${psdSetSchedulerIndicator.tone}`">
                    <span class="psd-set-page__auto-dispatch-runtime-dot" />
                    <span>{{ psdSetSchedulerIndicator.text }}</span>
                    <span v-if="psdSetSchedulerMeta" class="psd-set-page__auto-dispatch-runtime-meta">
                      {{ psdSetSchedulerMeta }}
                    </span>
                  </div>
                </div>
                <div class="psd-set-page__auto-dispatch-side">
                  <span class="psd-set-page__auto-dispatch-status"
                    :class="userAutoSchedulingEnabled ? 'is-success' : 'is-info'">
                    <span class="psd-set-page__auto-dispatch-dot" />
                    <span>{{ userAutoSchedulingEnabled ? "已开启" : "已关闭" }}</span>
                  </span>
                  <el-button size="small" :type="userAutoSchedulingEnabled ? 'danger' : 'success'"
                    :loading="userAutoSchedulingLoading"
                    @click="handleToggleUserAutoScheduling(!userAutoSchedulingEnabled)">
                    {{ userAutoSchedulingEnabled ? "关闭自动调度" : "开启自动调度" }}
                  </el-button>
                  <el-button size="small" :loading="resettingPsRuntime" @click="handleResetAllPsAutomationRuntime">
                    重置状态
                  </el-button>
                </div>
              </div>
            </div>
          </el-form>
        </div>
      </template>

      <template #table>
        <div
          class="common-table list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat">
          <div class="list-page-table-panel__body psd-set-page__table-body">
            <vxe-grid v-bind="gridOptions" :data="dataSource" :loading="loading"
              :row-class-name="psdSetRowClassName" @checkbox-change="onSelectionChange"
              @checkbox-all="onSelectionChange" @cell-click="handlePsdSetCellClick" @scroll="handleGridScroll">
              <template #idSlot="{ row }">
                <div class="table-cell-copyable" @click="copyId(row.id)">
                  <span class="table-cell-id">{{ row.id }}</span>
                  <el-icon>
                    <DocumentCopy />
                  </el-icon>
                </div>
              </template>
              <template #stickersCountSlot="{ row }">
                <div class="flex items-center gap-2">
                  <el-tag :type="getStickersCount(row) > 1 ? 'success' : 'info'" size="small" effect="plain"
                    class="material-association-tag">
                    <span class="tag-text">{{
                      getStickersCount(row) === 1 ? "单素材" : `多素材(${getStickersCount(row)})`
                      }}</span>
                  </el-tag>
                </div>
              </template>
              <template #statusSlot="{ row }">
                <div class="status-cell">
                  <el-tag :type="statusTagType(getPsdSetDisplayStatus(row))" effect="plain" size="small">
                    {{ statusLabel(getPsdSetDisplayStatus(row)) }}
                  </el-tag>
                </div>
              </template>
              <template #imagesSlot="{ row }">
                <PsdSetTableImageCell v-memo="[row.id, row.name, row.images, getPreviewImageIndex(row)]"
                  :row-id="row.id" :name="row.name" :images="row.images" :current-index="getPreviewImageIndex(row)"
                  @shift="(delta) => shiftPreviewImage(row, delta)"
                  @preview="(index) => openPsdSetImagePreview(row, index)"
                  @download="() => handleDownloadPsdSetImages(row)" />
              </template>
              <template #configSlot="{ row }">
                <div class="flex items-center gap-2">
                  <el-tag v-if="row.stickerPsdSetConfig" type="info" size="small" effect="plain" class="cursor-pointer"
                    @click="() => handleViewConfig(row)">
                    已配置
                  </el-tag>
                  <span v-else class="table-cell-empty">未配置</span>
                </div>
              </template>
              <!-- 关联信息插槽：合并显示贴纸详情和PSD模板详情 -->
              <template #operationSlot="{ row }">
                <el-dropdown class="operation-dropdown" placement="bottom-end">
                  <el-button type="primary" link size="small" class="operation-trigger-button">操作</el-button>
                  <template #dropdown>
                    <div class="op-menu">
                      <div class="op-menu-item" @click="() => handleViewDetail(row)">
                        <span class="op-menu-label">查看详情</span>
                      </div>

                      <div class="op-menu-item" @click="() => handleEditConfigDirectly(row)">
                        <span class="op-menu-label">编辑配置</span>
                      </div>

                      <div class="op-divider"></div>

                      <el-tooltip content="需要客户端连接" placement="right"
                        :disabled="isClientConnected || startingProductionId === row.id">
                        <div class="op-menu-item" @click="() => handleStartProduction(row)" :class="{
                          'is-disabled': !isClientConnected || startingProductionId === row.id,
                        }">
                          <span class="op-menu-label">开始制作</span>
                        </div>
                      </el-tooltip>

                      <div class="op-divider"></div>

                      <div class="op-menu-section">
                        <div class="op-menu-section-title">状态标记</div>
                        <div class="op-menu-item" @click="() => updateRowStatus(row, 'pending')">
                          <span class="op-menu-label">待制作</span>
                        </div>
                        <div class="op-menu-item" @click="() => updateRowStatus(row, 'processing')">
                          <span class="op-menu-label">制作中</span>
                        </div>
                        <div class="op-menu-item" @click="() => updateRowStatus(row, 'completed')">
                          <span class="op-menu-label">已完成</span>
                        </div>
                        <div class="op-menu-item" @click="() => updateRowStatus(row, 'failed')">
                          <span class="op-menu-label">失败</span>
                        </div>
                      </div>

                      <div class="op-divider"></div>

                      <div class="op-menu-item" @click="() => handleToProduct(row)"
                        :class="{ 'is-disabled': generatingProductId === row.id }">
                        <span class="op-menu-label">生成产品</span>
                      </div>
                      <div class="op-menu-item" @click="() => handleCreatePublishTask(row)">
                        <span class="op-menu-label">生成发布任务</span>
                      </div>
                      <div class="op-menu-item" @click="() => handleViewPublishTasks(row)">
                        <span class="op-menu-label">查看发布任务</span>
                      </div>
                      <div class="op-menu-item" @click="() => handleViewPublishUsageRecords(row)">
                        <span class="op-menu-label">查看使用记录</span>
                      </div>

                      <div class="op-divider"></div>

                      <div class="op-menu-item danger" @click="() => handleDelete(row)">
                        <span class="op-menu-label">删除</span>
                      </div>
                    </div>
                  </template>
                </el-dropdown>
              </template>
            </vxe-grid>
          </div>
        </div>
      </template>

      <template #pagination>
        <div
          class="pagination-container list-page-panel list-page-panel--flat list-page-table-panel__pagination list-page-table-panel__pagination--flat">
          <pagination :total="total" v-model:page="queryParams.currentPage" v-model:limit="queryParams.pageSize"
            @pagination="getList" />
        </div>
      </template>
    </ListPageLayout>

    <el-dialog v-model="detailDialogVisible" fullscreen :show-close="true" :destroy-on-close="false"
      class="psd-set-detail-dialog" @closed="handleCloseDetailDialog">
      <template #header>
        <div class="psd-set-detail-header">
          <div class="psd-set-detail-heading">
            <div class="psd-set-detail-title">{{ detailData?.name || "套图详情" }}</div>
            <div class="psd-set-detail-subtitle">
              {{ formatTimestamp(detailData?.createTime) }} 创建
              <span v-if="detailData?.uploader?.account || detailData?.uploader?.name || detailData?.userId">
                · {{ detailData?.uploader?.account || detailData?.uploader?.name || detailData?.userId }}
              </span>
            </div>
          </div>
          <div class="psd-set-detail-header__tags" v-if="detailData">
            <el-tag :type="statusTagType(getPsdSetDisplayStatus(detailData))" effect="plain" size="small">{{
              statusLabel(getPsdSetDisplayStatus(detailData))
              }}</el-tag>
            <el-tag type="info" effect="plain" size="small">图片 {{ detailImages.length }}</el-tag>
            <el-tag type="info" effect="plain" size="small">素材 {{ detailStickers.length }}</el-tag>
            <el-tag v-if="detailAutomationCount" type="warning" effect="plain" size="small">
              自动任务 {{ detailAutomationCount }}
            </el-tag>
          </div>
        </div>
      </template>

      <div v-loading="detailLoading" class="psd-set-detail-layout" v-if="detailData">
        <section class="psd-set-detail-top">
          <div class="psd-set-detail-panel psd-set-detail-panel--hero">
            <div class="detail-header">
              <span class="detail-label">做好的图</span>
              <span class="detail-count">{{ detailImages.length }} 张</span>
            </div>
            <div class="psd-set-detail-image-grid">
              <div v-for="(img, idx) in detailImages" :key="idx" class="psd-set-detail-image-card">
                <el-image v-if="img" :src="img" :preview-src-list="detailImages" :initial-index="Number(idx)"
                  :preview-teleported="true" :hide-on-click-modal="false" class="psd-set-detail-image" fit="contain"
                  loading="lazy" />
                <span class="psd-set-detail-image-index">{{ Number(idx) + 1 }}</span>
              </div>
              <el-empty v-if="!detailImages.length" description="暂无套图图片" :image-size="80" />
            </div>
          </div>

          <div class="psd-set-detail-panel psd-set-detail-panel--compact">
            <div class="detail-header">
              <span class="detail-label">套图信息</span>
            </div>
            <div class="psd-set-detail-summary">
              <div class="psd-set-detail-summary__item">
                <span class="info-label">套图ID</span>
                <span class="info-value cursor-pointer" @click="copyId(detailData.id)">{{
                  detailData.id || "-"
                  }}</span>
              </div>
              <div class="psd-set-detail-summary__item">
                <span class="info-label">状态</span>
                <el-tag :type="statusTagType(getPsdSetDisplayStatus(detailData))" size="small" effect="plain">
                  {{ statusLabel(getPsdSetDisplayStatus(detailData)) }}
                </el-tag>
              </div>
              <div class="psd-set-detail-summary__item">
                <span class="info-label">上传者</span>
                <span class="info-value">{{
                  detailData?.uploader?.account ||
                  detailData?.uploader?.name ||
                  detailData?.userId ||
                  "-"
                  }}</span>
              </div>
              <div class="psd-set-detail-summary__item">
                <span class="info-label">制作耗时</span>
                <span class="info-value">{{
                  formatProcessingTime(detailData.processingTime)
                  }}</span>
              </div>
              <div class="psd-set-detail-summary__item">
                <span class="info-label">创建时间</span>
                <span class="info-value">{{ formatTimestamp(detailData.createTime) }}</span>
              </div>
              <div class="psd-set-detail-summary__item">
                <span class="info-label">更新时间</span>
                <span class="info-value">{{ formatTimestamp(detailData.updateTime) }}</span>
              </div>
              <div class="psd-set-detail-summary__item">
                <span class="info-label">发布任务数</span>
                <span class="info-value">{{ detailPublishTaskCount }}</span>
              </div>
            </div>
            <div class="psd-set-detail-text-grid">
              <div class="psd-set-detail-text-card">
                <div class="info-label">描述</div>
                <div class="info-value">{{ detailData.description || "-" }}</div>
              </div>
              <div class="psd-set-detail-text-card">
                <div class="info-label">关键词</div>
                <div class="info-value">{{ detailData.keywords || "-" }}</div>
              </div>
              <div class="psd-set-detail-text-card">
                <div class="info-label">状态说明</div>
                <div class="info-value">{{ resolvePsdSetStatusMessage(detailData) }}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="psd-set-detail-middle">
          <div class="psd-set-detail-panel psd-set-detail-panel--balanced">
            <div class="detail-header">
              <span class="detail-label">图片信息</span>
              <span class="detail-count">{{ detailStickers.length }} 项</span>
            </div>
            <div class="psd-set-detail-meta-list psd-set-detail-meta-list--inline">
              <div>
                <span class="info-label">来源贴纸 ID</span>
                <span class="info-value break-all">{{ detailStickerIdsText }}</span>
              </div>
              <div>
                <span class="info-label">自动动作</span>
                <span class="info-value">{{ detailAutomationText }}</span>
              </div>
              <div>
                <span class="info-label">发布任务</span>
                <span class="info-value">{{
                  detailPublishTaskCount ? `${detailPublishTaskCount} 条` : "暂无"
                  }}</span>
              </div>
            </div>
            <div v-if="detailStickers.length" class="detail-sticker-list">
              <div v-for="sticker in detailStickers" :key="sticker.id" class="detail-sticker-card">
                <el-image v-if="sticker.url" :src="sticker.url"
                  :preview-src-list="detailStickers.map((s) => s.url).filter(Boolean)"
                  :initial-index="detailStickers.findIndex((s) => s.id === sticker.id)" :preview-teleported="true"
                  :hide-on-click-modal="false" fit="contain" class="detail-thumb-image" />
                <span v-else class="text-gray-400 text-xs">无图</span>
                <div class="detail-sticker-meta">
                  <div v-if="sticker.id" class="detail-sticker-id cursor-pointer" @click="copyId(sticker.id)">
                    ID: {{ sticker.id }}
                    <el-icon class="copy-icon">
                      <DocumentCopy />
                    </el-icon>
                  </div>
                  <div class="detail-sticker-name">{{ sticker.name || "未命名贴纸" }}</div>
                  <div class="detail-sticker-desc">{{ sticker.description || "-" }}</div>
                  <div class="detail-sticker-keywords">{{ sticker.keywords || "-" }}</div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无来源素材" :image-size="72" />
          </div>

          <div class="psd-set-detail-panel psd-set-detail-panel--balanced">
            <div class="detail-header">
              <span class="detail-label">PSD 模板信息</span>
            </div>
            <div v-if="detailData.psdTemplate" class="psd-set-detail-side-card">
              <div class="psd-set-detail-meta-list psd-set-detail-meta-list--inline">
                <div>
                  <span class="info-label">模板 ID</span>
                  <span class="info-value cursor-pointer break-all" @click="copyId(detailData.psdTemplate.id)">
                    {{ detailData.psdTemplate.id || "-" }}
                  </span>
                </div>
                <div>
                  <span class="info-label">模板名称</span>
                  <span class="info-value">{{ detailData.psdTemplate.name || "未命名模板" }}</span>
                </div>
                <div>
                  <span class="info-label">关键词</span>
                  <span class="info-value">{{ detailData.psdTemplate.keywords || "-" }}</span>
                </div>
              </div>
              <div class="detail-template-card detail-template-card--unified">
                <el-image v-if="detailData.psdTemplate.thumbnail" :src="getPreviewImageUrl(detailData.psdTemplate.thumbnail, {
                  width: 360,
                  quality: 80,
                  format: 'webp',
                })
                  " :preview-src-list="[detailData.psdTemplate.thumbnail]" :preview-teleported="true"
                  :hide-on-click-modal="false" fit="contain" class="detail-thumb-image detail-thumb-image--template" />
                <span v-else class="text-gray-400 text-xs">无图</span>
                <div class="detail-sticker-meta">
                  <div class="detail-sticker-id cursor-pointer" @click="copyId(detailData.psdTemplate.id)">
                    ID: {{ detailData.psdTemplate.id || "-" }}
                    <el-icon class="copy-icon">
                      <DocumentCopy />
                    </el-icon>
                  </div>
                  <div class="detail-sticker-name">
                    {{ detailData.psdTemplate.name || "未命名模板" }}
                  </div>
                  <div class="detail-sticker-desc">{{ detailData.psdTemplate.description || "-" }}</div>
                  <div class="detail-sticker-keywords">{{ detailData.psdTemplate.keywords || "-" }}</div>
                  <div class="detail-sticker-path break-all">云资源：{{ detailData.psdTemplate.url || "-" }}</div>
                  <div class="detail-sticker-path break-all">
                    本地路径：{{ detailData.psdTemplate.windowsLocalPath || "-" }}
                  </div>
                </div>
              </div>
            </div>
            <span v-else class="text-gray-400 text-sm">无模板</span>
          </div>
        </section>

        <section class="psd-set-detail-bottom">
          <div class="psd-set-detail-panel psd-set-detail-panel--muted">
            <div class="detail-header">
              <span class="detail-label">配置与元信息</span>
            </div>
            <div class="psd-set-detail-runtime-strip">
              <div>
                <span class="info-label">调度</span>
                <el-tag :type="schedulerStatusTagType(detailData?.schedulerMeta?.status)" size="small" effect="plain">
                  {{ schedulerStatusLabel(detailData?.schedulerMeta?.status) }}
                </el-tag>
              </div>
              <div>
                <span class="info-label">进度</span>
                <span class="info-value">{{ formatSchedulerProgress(detailData?.schedulerMeta?.progress) }}</span>
              </div>
              <div>
                <span class="info-label">节点</span>
                <span class="info-value">{{ getSchedulerAssignedLabel(detailData) }}</span>
              </div>
            </div>
            <div v-if="detailData?.schedulerMeta?.currentStep || detailData?.schedulerMeta?.lastError"
              class="psd-set-detail-runtime-note">
              <span>{{ detailData?.schedulerMeta?.currentStep || detailData?.schedulerMeta?.lastError }}</span>
            </div>

            <div class="psd-set-detail-json-stack">
              <div class="psd-set-detail-json-block">
                <div class="psd-set-detail-json-title">
                  <span>套图配置</span>
                  <el-tag v-if="detailData?.stickerPsdSetConfig" type="info" size="small" effect="plain">
                    已配置
                  </el-tag>
                </div>
                <div v-if="detailData?.stickerPsdSetConfig" class="config-preview-container">
                  <pre class="config-preview">{{ formattedConfig }}</pre>
                </div>
                <span v-else class="text-gray-400 text-sm">未配置</span>
              </div>

              <div class="psd-set-detail-json-block">
                <div class="psd-set-detail-json-title">
                  <span>元信息</span>
                  <el-tag v-if="detailMetaFormatted" type="info" size="small" effect="plain">JSON</el-tag>
                </div>
                <div v-if="detailMetaFormatted" class="config-preview-container">
                  <pre class="config-preview">{{ detailMetaFormatted }}</pre>
                </div>
                <span v-else class="text-gray-400 text-sm">无元信息</span>
              </div>

              <div class="psd-set-detail-json-block">
                <div class="psd-set-detail-json-title">
                  <span>调度信息</span>
                  <el-tag v-if="detailSchedulerMetaFormatted" type="info" size="small" effect="plain">JSON</el-tag>
                </div>
                <div v-if="detailSchedulerMetaFormatted" class="config-preview-container">
                  <pre class="config-preview">{{ detailSchedulerMetaFormatted }}</pre>
                </div>
                <span v-else class="text-gray-400 text-sm">无调度信息</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </el-dialog>

    <!-- 编辑配置对话框 -->
    <el-dialog v-model="configEditDialogVisible" title="编辑配置信息" width="60%" align-center :destroy-on-close="true">
      <div v-loading="configEditDialogLoading" class="config-edit-dialog-content">
        <div v-if="configEditDialogData" class="config-edit-info">
          <div class="config-edit-info-item">
            <span class="config-edit-info-label">套图名称：</span>
            <span class="config-edit-info-value">{{ configEditDialogData.name || "-" }}</span>
          </div>
          <div class="config-edit-info-item">
            <span class="config-edit-info-label">套图ID：</span>
            <span class="config-edit-info-value">{{ configEditDialogData.id || "-" }}</span>
          </div>
        </div>
        <div class="config-editor-container">
          <el-input v-model="configEditDialogValue" type="textarea" :rows="16"
            placeholder='请输入JSON格式的配置信息，例如：&#10;{&#10;  "key1": "value1",&#10;  "key2": "value2"&#10;}'
            class="config-textarea" @input="handleConfigInputChange" />
          <div v-if="configEditDialogError" class="config-error">
            <el-icon>
              <WarningFilled />
            </el-icon>
            <span>{{ configEditDialogError }}</span>
          </div>
          <div v-else-if="configEditDialogValue.trim()" class="config-success">
            <el-icon>
              <CircleCheck />
            </el-icon>
            <span>JSON格式正确</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleCancelConfigEditDialog">取消</el-button>
        <el-button type="primary" :loading="configEditDialogSaving" @click="handleSaveConfigDialog">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看配置对话框 -->
    <el-dialog v-model="configViewDialogVisible" title="查看配置信息" width="60%" align-center :destroy-on-close="true">
      <div v-loading="configViewDialogLoading" class="config-view-dialog-content">
        <div v-if="configViewDialogData" class="config-view-info">
          <div class="config-view-info-item">
            <span class="config-view-info-label">套图名称：</span>
            <span class="config-view-info-value">{{ configViewDialogData.name || "-" }}</span>
          </div>
          <div class="config-view-info-item">
            <span class="config-view-info-label">套图ID：</span>
            <span class="config-view-info-value">{{ configViewDialogData.id || "-" }}</span>
          </div>
        </div>
        <div v-if="configViewFormatted" class="config-view-container">
          <pre class="config-view-content">{{ configViewFormatted }}</pre>
        </div>
        <div v-else class="config-view-empty">
          <span class="text-gray-400">未配置</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="configViewDialogVisible = false">关闭</el-button>
        <el-button v-if="configViewDialogData?.stickerPsdSetConfig" type="primary" @click="handleEditFromView">
          编辑配置
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="generateProductDialogVisible" fullscreen :show-close="true" :destroy-on-close="false"
      class="generate-product-dialog" @close="handleCloseGenerateProductDialog">
      <template #header>
        <div class="generate-product-dialog-header">
          <div>
            <div class="generate-product-dialog-title">套图生成产品</div>
            <div class="generate-product-dialog-subtitle">
              已选择 {{ generateProductTargetIds.length }} 个套图，配置商品信息生成提示词
            </div>
          </div>
        </div>
      </template>

      <div v-loading="generateProductDialogLoading" class="generate-product-dialog-body">
        <div class="generate-product-panel">
          <div class="generate-product-panel-title">基础配置</div>
          <el-form label-position="top">
            <el-form-item label="AI 提示词">
              <el-select v-model="generateProductForm.promptId" filterable clearable placeholder="请选择提示词"
                class="w-full">
                <el-option v-for="item in generateProductPromptOptions" :key="item.id" :label="item.title"
                  :value="item.id">
                  <div class="generate-product-option">
                    <span>{{ item.title }}</span>
                    <span class="generate-product-option-id">#{{ item.id }}</span>
                  </div>
                </el-option>
              </el-select>
              <div class="generate-product-tip">
                用于生成商品的名称、描述、关键词等信息，与发布平台无关。
              </div>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <div class="generate-product-dialog-footer">
          <el-button @click="handleCloseGenerateProductDialog">取消</el-button>
          <el-button type="primary" :loading="generateProductSubmitting" @click="handleSubmitGenerateProduct">
            确定生成产品
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="publishConfigDialogVisible" fullscreen :show-close="true" :destroy-on-close="false"
      class="generate-product-dialog publish-config-dialog" @close="handleClosePublishConfigDialog">
      <template #header>
        <div class="generate-product-dialog-header">
          <div>
            <div class="generate-product-dialog-title">套图生成发布任务</div>
            <div class="generate-product-dialog-subtitle">
              已选择 {{ publishConfigTargetIds.length }} 个套图，选择任务配置来创建发布任务
            </div>
          </div>
        </div>
      </template>

      <div v-loading="publishConfigDialogLoading" class="generate-product-dialog-body publish-config-dialog-body">
        <div class="generate-product-panel generate-product-panel--wide publish-config-panel-wrap">
          <div class="publish-config-toolbar">
            <div class="publish-config-toolbar__stats">
              <div class="publish-config-stat-card">
                <div class="publish-config-stat-card__label">目标套图</div>
                <div class="publish-config-stat-card__value">
                  {{ publishConfigTargetIds.length }}
                </div>
              </div>
              <div class="publish-config-stat-card">
                <div class="publish-config-stat-card__label">可选任务配置</div>
                <div class="publish-config-stat-card__value">
                  {{ filteredPublishConfigs.length }}
                </div>
              </div>
              <div class="publish-config-stat-card">
                <div class="publish-config-stat-card__label">已选任务配置</div>
                <div class="publish-config-stat-card__value">
                  {{ publishConfigSelectedIds.length }}
                </div>
              </div>
            </div>
            <el-alert
              class="publish-config-template-alert"
              :type="publishConfigTargetTemplateAlert.type"
              :title="publishConfigTargetTemplateAlert.title"
              show-icon
              :closable="false"
            />
            <div class="publish-config-toolbar__actions">
              <el-input v-model="publishConfigSearchText" placeholder="搜索任务配置名称、任务类型或平台..." clearable
                @input="publishConfigCurrentPage = 1" class="publish-config-search" />
              <el-tag v-if="publishConfigSelectedNames.length" type="primary" effect="plain">
                {{ publishConfigSelectedNames.join("、") }}
              </el-tag>
            </div>
          </div>

          <div class="common-table publish-config-grid-wrap">
            <vxe-grid v-bind="publishConfigGridOptions" :data="publishConfigDataSource"
              @checkbox-change="handlePublishConfigCheckboxChange"
              @checkbox-all="handlePublishConfigCheckboxAllChange">
              <template #publishConfigTemplateSlot="{ row }">
                <span>{{ getPublishConfigBindingLabel(row) }}</span>
              </template>
              <template #publishConfigMatchSlot="{ row }">
                <el-tag :type="getPublishConfigMatchInfo(row).type" size="small" effect="plain">
                  {{ getPublishConfigMatchInfo(row).label }}
                </el-tag>
              </template>
            </vxe-grid>
          </div>

          <div class="publish-config-pagination">
            <el-pagination v-model:current-page="publishConfigCurrentPage" v-model:page-size="publishConfigPageSize"
              :total="filteredPublishConfigs.length" :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next" size="small" background />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="generate-product-dialog-footer">
          <el-button @click="handleClosePublishConfigDialog">取消</el-button>
          <el-button type="primary" :loading="publishConfigSubmitting" @click="handleSubmitCreatePublishTask">
            确定生成发布任务
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="publishTasksVisible" fullscreen :show-close="true" :destroy-on-close="false"
      class="publish-task-list-dialog">
      <template #header>
        <div class="generate-product-dialog-header">
          <div>
            <div class="generate-product-dialog-title">套图关联发布任务</div>
            <div class="generate-product-dialog-subtitle">
              当前共 {{ publishTasks.length }} 条任务记录
            </div>
          </div>
        </div>
      </template>

      <div v-loading="publishTasksLoading" class="publish-task-list-body">
        <div class="publish-task-list-toolbar">
          <div class="publish-task-list-toolbar__stats">
            <el-tag type="info" effect="plain">总数 {{ publishTasks.length }}</el-tag>
            <el-tag type="success" effect="plain">完成 {{ publishTaskStatusCount.completed }}</el-tag>
            <el-tag type="warning" effect="plain">处理中 {{ publishTaskStatusCount.processing }}</el-tag>
            <el-tag type="danger" effect="plain">失败 {{ publishTaskStatusCount.failed }}</el-tag>
          </div>
        </div>

        <el-empty v-if="!publishTasksLoading && publishTasks.length === 0" description="暂无发布任务" />
        <vxe-grid v-else v-bind="publishTasksGridOptions" :data="publishTasks" class="publish-task-list-grid">
          <template #taskPlatformSlot="{ row }">
            <el-tag size="small" effect="plain">{{ formatPlatformName(row.platform) }}</el-tag>
          </template>
          <template #taskStatusSlot="{ row }">
            <el-tag :type="getPublishTaskStatusTag(row.status)" size="small">
              {{ getPublishTaskStatusLabel(row.status) }}
            </el-tag>
          </template>
          <template #taskErrorSlot="{ row }">
            <span v-if="row.error" class="publish-task-error">{{ row.error }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
          <template #taskActionSlot="{ row }">
            <el-button link type="primary" :disabled="publishTasksLoading || getPsdSetDisplayStatus(row) === 'processing'"
              @click="handleRegeneratePublishTask(row)">
              重新生成发布数据
            </el-button>
          </template>
        </vxe-grid>
      </div>
      <template #footer>
        <el-button @click="publishTasksVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="productionDispatchDialogVisible" width="760px" title="开始制作" align-center append-to-body
      destroy-on-close class="production-dispatch-dialog" @open="handleOpenProductionDispatchDialog"
      @closed="handleCloseProductionDispatchDialog">
      <div class="production-dispatch-dialog__body">
        <div v-loading="productionDispatchLoading" :element-loading-text="DISPATCH_DIALOG_LOADING_TEXT"
          class="production-dispatch-dialog__panel">
          <div class="production-dispatch-dialog__panel-title">客户端节点</div>
          <div v-if="!productionDispatchLoading && dispatchClientRows.length" class="production-dispatch-dialog__table">
            <el-table :data="dispatchClientRows" border size="small" row-key="id" :max-height="332"
              class="production-dispatch-dialog__table-main" :row-class-name="resolveDispatchClientRowClassName"
              @row-click="handleDispatchClientRowClick">
              <el-table-column label="" width="46" align="center">
                <template #default="{ row }">
                  <el-radio v-model="selectedDispatchClientId" :value="row.id" :disabled="!row.selectable"
                    @click.stop />
                </template>
              </el-table-column>
              <el-table-column prop="clientLabel" label="客户端节点" min-width="140" show-overflow-tooltip />
              <el-table-column prop="connectedAtLabel" label="连接时间" min-width="150" show-overflow-tooltip />
              <el-table-column label="在线" width="76" align="center">
                <template #default="{ row }">
                  <span class="production-dispatch-dialog__state-text" :class="`is-${row.onlineStatusTone}`">
                    {{ row.onlineStatusText }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="PS" width="72" align="center">
                <template #default="{ row }">
                  <span class="production-dispatch-dialog__state-text" :class="`is-${row.psStatusTone}`">
                    {{ row.psStatusText }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="制作" width="82" align="center">
                <template #default="{ row }">
                  <span class="production-dispatch-dialog__state-text" :class="`is-${row.productionStatusTone}`">
                    {{ row.productionStatusText }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else class="production-dispatch-dialog__empty">暂无可选客户端节点。</div>
        </div>
      </div>
      <template #footer>
        <div class="production-dispatch-dialog__footer">
          <el-button @click="productionDispatchDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="startingProductionId === productionDispatchRow?.id"
            :disabled="!selectedDispatchClientId || !selectedDispatchClient" @click="handleConfirmStartProduction">
            开始制作
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="publishUsageDialogVisible" title="图片使用记录" width="920px" :destroy-on-close="true">
      <div v-loading="publishUsageLoading" class="publish-usage-dialog">
        <el-empty v-if="!publishUsageLoading && !publishUsageRecords.length" description="暂无使用记录" />
        <vxe-grid v-else v-bind="publishUsageGridOptions" :data="publishUsageRecords">
          <template #usageImageSlot="{ row }">
            <el-image v-if="row.imageUrl" :src="row.imageUrl" fit="cover" class="publish-usage-image"
              :preview-src-list="[row.imageUrl]" :preview-teleported="true" />
          </template>
          <template #usageConfigSlot="{ row }">
            <div class="publish-usage-config-cell">
              <span>{{ row.publishConfig?.name || row.publishConfigId || "-" }}</span>
              <el-tag size="small" effect="plain">{{ formatPlatformName(row.publishConfig?.platform) }}</el-tag>
            </div>
          </template>
          <template #usageStatusSlot="{ row }">
            <el-tag :type="getPublishUsageStatusTag(row.status)" size="small">
              {{ getPublishUsageStatusLabel(row.status) }}
            </el-tag>
          </template>
        </vxe-grid>
      </div>
    </el-dialog>

    <el-image-viewer v-if="tableImageViewerVisible" :url-list="tableImageViewerUrls"
      :initial-index="tableImageViewerIndex" :hide-on-click-modal="false" teleported
      @switch="handleTableImageViewerSwitch" @close="handleTableImageViewerClose" />

    <!-- 状态详情对话框已移除；状态说明使用默认单元格文本显示 -->
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, watchEffect } from "vue";
import { ContentWrap } from "@/components/ContentWrap";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import { useWindowSize } from "@vueuse/core";
import { Search, DocumentCopy, WarningFilled, CircleCheck } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { buildOperationColumn, commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { stickerPsdSetApi } from "@/api/stickerPsdSet";
import { getPromptList } from "@/api/prompt";
import {
  getPublishConfigListApi,
  createPublishTaskApi,
  regeneratePublishTaskApi,
} from "@/api/product/publishConfig";
import request from "@/config/axios";
import { isLocalConnected } from "@/stores/connectionStatus";
import { websocketClient, type PsAutomationStatusEvent } from "@/services/websocketClient";
import { useClientNodeState } from "@/services/clientNodeState";
import { ClientControlService } from "@/services/clientControl";
import { usePsdSetRuntimeState } from "@/services/psdSetRuntimeState";
import {
  getPsdSetAutoDispatchRuntime,
  resetAllPsAutomationRuntime,
  type AutoDispatchSchedulerRuntime,
} from "@/api/system/websocket";
import {
  normalizeAutoDispatchSchedulerRuntime,
  resolveAutoDispatchSchedulerIndicator,
  resolveAutoDispatchSchedulerMeta,
} from "@/services/autoDispatchSchedulerRuntime";
import { sortTypeOptions, defaultSortingValue } from "@/common/sort";
import { getPreviewImageUrl } from "@/utils/image";
import PsdSetTableImageCell from "./components/PsdSetTableImageCell.vue";
import {
  derivePublishTaskTypeByPlatform,
  getTaskTypeLabel,
  resolveTaskTypePlatform,
} from "@/config/task-types";
import { downloadImageEnhanced } from "@/common/download";
const loading = ref(false);
const dataSource = ref<any[]>([]);
const total = ref(0);
const selectedIds = ref<string[]>([]);
const selectedPsdSetRows = ref<any[]>([]);
const tablePreviewImageIndexMap = reactive<Record<string, number>>({});
const tableImageViewerVisible = ref(false);
const tableImageViewerUrls = ref<string[]>([]);
const tableImageViewerIndex = ref(0);
const tableImageViewerDisplayIndex = computed(() =>
  tableImageViewerUrls.value.length
    ? Math.min(Math.max(tableImageViewerIndex.value, 0), tableImageViewerUrls.value.length - 1) + 1
    : 0,
);
let tableImageViewerLabelEl: HTMLDivElement | null = null;
const DISPATCH_DIALOG_LOADING_TEXT = "正在同步可用节点...";
const generatingProductId = ref<string>("");
const batchGeneratingProducts = ref(false);
const batchUpdatingStatus = ref(false);
const startingProductionId = ref<string>("");
const productionDispatchDialogVisible = ref(false);
const productionDispatchLoading = ref(false);
const productionDispatchRow = ref<any>(null);
const selectedDispatchClientId = ref("");
const resettingPsRuntime = ref(false);
const userAutoSchedulingLoading = ref(false);
const psdSetSchedulerRuntime = ref<AutoDispatchSchedulerRuntime | null>(null);
const generateProductDialogVisible = ref(false);
const generateProductDialogLoading = ref(false);
const generateProductSubmitting = ref(false);
const generateProductTargetIds = ref<string[]>([]);
const generateProductPromptOptions = ref<any[]>([]);
const generateProductForm = reactive({
  promptId: null as number | null,
});
const publishConfigDialogVisible = ref(false);
const publishConfigDialogLoading = ref(false);
const publishConfigSubmitting = ref(false);
const publishConfigOptions = ref<any[]>([]);
const publishConfigSelectedIds = ref<string[]>([]);
const publishConfigTargetIds = ref<string[]>([]);
const publishConfigTargetRows = ref<any[]>([]);
const publishConfigSearchText = ref("");
const publishConfigCurrentPage = ref(1);
const publishConfigPageSize = ref(10);
const publishTasksVisible = ref(false);
const publishTasksLoading = ref(false);
const publishTasks = ref<any[]>([]);
const currentPublishTasksPsdSetId = ref<string>("");
const publishUsageConfigOptions = ref<any[]>([]);
const publishUsageDialogVisible = ref(false);
const publishUsageLoading = ref(false);
const publishUsageRecords = ref<any[]>([]);
let psdSetMenuRuntimeSyncTimer: ReturnType<typeof setTimeout> | null = null;

// 客户端连接状态（参考 header 中的状态检测方式）
const isClientConnected = computed(() => isLocalConnected.value);
const { clients: clientNodes, refresh: refreshClientNodes } = useClientNodeState();
const {
  userAutoSchedulingEnabled,
  activePsdSets,
  activePsdSetClientIds,
  refreshActiveSummary: refreshPsdSetRuntimeSummary,
  refreshUserAutoScheduling,
  setUserAutoSchedulingEnabled,
} = usePsdSetRuntimeState();

function schedulePsdSetMenuRuntimeSync() {
  void refreshPsdSetRuntimeSummary();
  void refreshClientNodes();
  void getList(true);
  void loadPsdSetSchedulerRuntime();
  if (psdSetMenuRuntimeSyncTimer) {
    clearTimeout(psdSetMenuRuntimeSyncTimer);
  }
  psdSetMenuRuntimeSyncTimer = setTimeout(() => {
    psdSetMenuRuntimeSyncTimer = null;
    void refreshPsdSetRuntimeSummary();
    void refreshClientNodes();
    void getList(true);
    void loadPsdSetSchedulerRuntime();
    if (detailDialogVisible.value && detailData.value?.id) {
      void loadPsdSetDetailById(detailData.value.id, true);
    }
  }, 1500);
}

const publishPlatformNameMap: Record<string, string> = {
  douyin: "抖音",
  kuaishou: "快手",
  xiaohongshu: "小红书",
  weibo: "微博",
  doudian: "抖店",
  kuaishou_shop: "快手小店",
  xianyu: "闲鱼",
  bilibili: "Bilibili",
  tiktok: "TikTok",
  youtube: "YouTube",
  temu: "Temu",
};

function formatPlatformName(platform?: string) {
  return publishPlatformNameMap[String(platform || "")] || String(platform || "-");
}

function formatTaskTypeName(taskType?: string, platform?: string) {
  return getTaskTypeLabel(taskType || derivePublishTaskTypeByPlatform(platform), platform);
}

function formatPublishUsageConfigLabel(config: any) {
  const name = String(config?.name || "").trim();
  const platform = formatPlatformName(config?.platform);
  return name ? `${name} / ${platform}` : platform;
}

function getPublishUsageStatusLabel(status?: string) {
  const map: Record<string, string> = {
    pending: "发布中",
    success: "已使用",
    failed: "失败",
    expired: "已过期",
    deleted: "已释放",
  };
  return map[String(status || "")] || String(status || "-");
}

function getPublishUsageStatusTag(status?: string) {
  const map: Record<string, "info" | "warning" | "success" | "danger"> = {
    pending: "warning",
    success: "success",
    failed: "danger",
    expired: "info",
    deleted: "info",
  };
  return map[String(status || "")] || "info";
}

function getPublishTaskStatusLabel(status?: string) {
  const map: Record<string, string> = {
    pending: "待处理",
    waiting: "等待中",
    processing: "处理中",
    completed: "已完成",
    failed: "失败",
  };
  return map[String(status || "")] || String(status || "-");
}

function getPublishTaskStatusTag(status?: string) {
  const map: Record<string, "info" | "warning" | "success" | "danger"> = {
    pending: "info",
    waiting: "warning",
    processing: "warning",
    completed: "success",
    failed: "danger",
  };
  return map[String(status || "")] || "info";
}

const filteredPublishConfigs = computed(() => {
  const text = publishConfigSearchText.value.toLowerCase().trim();
  const list = publishConfigOptions.value || [];
  if (!text) {
    return list;
  }
  return list.filter(
    (item: any) =>
      String(item?.name || "")
        .toLowerCase()
        .includes(text) ||
      formatTaskTypeName(item?.taskType, item?.platform).toLowerCase().includes(text) ||
      formatPlatformName(item?.platform).toLowerCase().includes(text),
  );
});

const publishConfigSelectedNames = computed(() =>
  publishConfigSelectedIds.value
    .map((id) => publishConfigOptions.value.find((item: any) => item.id === id)?.name)
    .filter(Boolean),
);

const publishConfigTargetTemplateIds = computed(() =>
  Array.from(
    new Set(
      publishConfigTargetRows.value
        .map((item) => getPsdSetTemplateId(item))
        .filter(Boolean),
    ),
  ),
);

const publishConfigTargetTemplateMode = computed(() => {
  const hasMissingTemplate = publishConfigTargetRows.value.some((item) => !getPsdSetTemplateId(item));
  if (publishConfigTargetTemplateIds.value.length === 1 && !hasMissingTemplate) {
    return "single";
  }
  if (publishConfigTargetTemplateIds.value.length > 1) {
    return "multiple";
  }
  return "unknown";
});

const publishConfigTargetTemplateAlert = computed(() => {
  if (publishConfigTargetTemplateMode.value === "single") {
    return {
      type: "success" as const,
      title: `当前选择来自同一 PSD 模板（${publishConfigTargetTemplateIds.value[0]}），可使用通用配置或该模板绑定配置。`,
    };
  }
  if (publishConfigTargetTemplateMode.value === "multiple") {
    return {
      type: "warning" as const,
      title: `当前选择包含 ${publishConfigTargetTemplateIds.value.length} 个 PSD 模板，仅可使用通用任务配置。`,
    };
  }
  if (publishConfigTargetTemplateIds.value.length === 1) {
    return {
      type: "warning" as const,
      title: "当前选择中有套图缺少 PSD 模板信息，仅可使用通用任务配置。",
    };
  }
  return {
    type: "warning" as const,
    title: "当前套图缺少 PSD 模板信息，仅可使用通用任务配置。",
  };
});

const publishConfigDataSource = computed(() => {
  const start = (publishConfigCurrentPage.value - 1) * publishConfigPageSize.value;
  const end = start + publishConfigPageSize.value;
  return filteredPublishConfigs.value.slice(start, end);
});

const publishConfigGridOptions = computed(() => ({
  ...commonGridOptions,
  height: 520,
  loading: false,
  rowConfig: { isHover: true, keyField: "id" },
  columnConfig: { resizable: true },
  checkboxConfig: {
    checkRowKeys: publishConfigSelectedIds.value,
    highlight: true,
    trigger: "row" as const,
    checkMethod: ({ row }: any) => isPublishConfigSelectable(row),
  },
  columns: [
    { type: "checkbox" as any, width: 60, align: "center" as any },
    {
      field: "taskType",
      title: "任务类型",
      width: 180,
      formatter: ({ row }: any) => formatTaskTypeName(row?.taskType, row?.platform),
    },
    { field: "name", title: "配置名称", minWidth: 180, showOverflow: true },
    {
      field: "templateBinding",
      title: "绑定模板",
      width: 180,
      showOverflow: true,
      slots: { default: "publishConfigTemplateSlot" },
    },
    {
      field: "matchStatus",
      title: "匹配状态",
      width: 160,
      slots: { default: "publishConfigMatchSlot" },
    },
    { field: "description", title: "备注说明", minWidth: 220, showOverflow: true },
  ],
}));

const publishTasksGridOptions = computed(() => ({
  ...commonGridOptions,
  maxHeight: Math.max(height.value - 260, 360),
  rowConfig: { isHover: true, keyField: "id" },
  columnConfig: { resizable: true },
  columns: [
    { field: "id", title: "任务ID", minWidth: 240, showOverflow: true },
    { field: "platform", title: "平台", width: 120, slots: { default: "taskPlatformSlot" } },
    {
      field: "uploader",
      title: "创建人",
      width: 140,
      showOverflow: true,
      formatter: ({ row }: any) =>
        row?.uploader?.account || row?.uploader?.name || row?.userId || "-",
    },
    { field: "status", title: "状态", width: 120, slots: { default: "taskStatusSlot" } },
    { field: "description", title: "描述", minWidth: 280, showOverflow: true },
    {
      field: "createdAt",
      title: "创建时间",
      width: 180,
      formatter: ({ cellValue }: any) => formatTimestamp(cellValue),
    },
    {
      field: "updatedAt",
      title: "更新时间",
      width: 180,
      formatter: ({ cellValue }: any) => formatTimestamp(cellValue),
    },
    {
      field: "error",
      title: "错误信息",
      minWidth: 260,
      showOverflow: true,
      slots: { default: "taskErrorSlot" },
    },
    buildOperationColumn("taskActionSlot"),
  ],
}));

const publishUsageGridOptions = computed(() => ({
  ...commonGridOptions,
  maxHeight: Math.max(height.value - 260, 360),
  rowConfig: { isHover: true, keyField: "id" },
  columnConfig: { resizable: true },
  columns: [
    { field: "imageUrl", title: "图片", width: 96, slots: { default: "usageImageSlot" } },
    { field: "publishConfigId", title: "发布配置", minWidth: 220, slots: { default: "usageConfigSlot" } },
    { field: "status", title: "状态", width: 110, slots: { default: "usageStatusSlot" } },
    { field: "taskId", title: "任务ID", minWidth: 220, showOverflow: true },
    {
      field: "createTime",
      title: "创建时间",
      width: 170,
      formatter: ({ cellValue }: any) => formatTimestamp(cellValue),
    },
    {
      field: "updateTime",
      title: "更新时间",
      width: 170,
      formatter: ({ cellValue }: any) => formatTimestamp(cellValue),
    },
  ],
}));

const publishTaskStatusCount = computed(() => {
  const summary = {
    completed: 0,
    processing: 0,
    failed: 0,
  };
  publishTasks.value.forEach((item: any) => {
    if (item?.status === "completed") summary.completed += 1;
    else if (item?.status === "failed") summary.failed += 1;
    else summary.processing += 1;
  });
  return summary;
});

const statusOptions = [
  { label: "待制作", value: "pending" },
  { label: "制作中", value: "processing" },
  { label: "已完成", value: "completed" },
  { label: "失败", value: "failed" },
];

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  id: "",
  keyword: "",
  status: "",
  sortingFields: defaultSortingValue(),
  startTime: "",
  endTime: "",
  publishUsageConfigId: [] as string[],
});

const dateRange = ref<[string, string] | null>(null);

// 日期快捷选项
const dateShortcuts = [
  {
    text: "一个小时内",
    value: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 60 * 60 * 1000);
      return [start, end];
    },
  },
  {
    text: "今天",
    value: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
      return [start, end];
    },
  },
  {
    text: "昨天",
    value: () => {
      const end = new Date();
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
      return [start, end];
    },
  },
  {
    text: "最近三天",
    value: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 3 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return [start, end];
    },
  },
  {
    text: "最近一周",
    value: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return [start, end];
    },
  },
  {
    text: "最近一个月",
    value: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return [start, end];
    },
  },
  {
    text: "最近三个月",
    value: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return [start, end];
    },
  },
];

// 处理日期范围选择器变化
function handleDateRangeChange(value: [string, string] | null) {
  if (value && value.length === 2) {
    queryParams.startTime = value[0];
    queryParams.endTime = value[1];
  } else {
    queryParams.startTime = "";
    queryParams.endTime = "";
  }
  getList();
}

const showDetails = ref(false);
const detailDialogVisible = ref(false);
const detailLoading = ref(false);
const detailData = ref<any>(null);
const detailStickers = computed(() => getStickers(detailData.value || {}));
const detailImages = computed(() =>
  Array.isArray(detailData.value?.images) ? detailData.value.images : [],
);
const detailMetaObject = computed(() => {
  const meta = detailData.value?.meta;
  if (!meta) return null;
  if (typeof meta === "string") {
    try {
      return JSON.parse(meta);
    } catch (e) {
      return null;
    }
  }
  return typeof meta === "object" ? meta : null;
});
const detailAutomationList = computed(() => {
  const automations = detailMetaObject.value?.automations;
  return Array.isArray(automations) ? automations : [];
});
const detailAutomationCount = computed(() => detailAutomationList.value.length);
const detailAutomationText = computed(() => {
  if (!detailAutomationList.value.length) return "无";
  return detailAutomationList.value
    .map((item: any) => item?.type || item?.action || item?.kind || "未命名动作")
    .join("、");
});
const detailStickerIdsText = computed(() => {
  const ids = detailStickers.value.map((item: any) => item?.id).filter(Boolean);
  return ids.length ? ids.join("\n") : "-";
});
const detailPublishTaskCount = computed(() => {
  const value =
    detailData.value?.publishTaskCount ??
    detailMetaObject.value?.publishTaskCount ??
    detailMetaObject.value?.publishTasks?.length ??
    0;
  return Number(value) || 0;
});

function normalizePsdSetId(value: unknown) {
  return String(value || "").trim();
}

function getPsdSetTemplateId(row: any) {
  return String(row?.psdTemplateId || row?.psdTemplate?.id || "").trim();
}

function getPublishConfigBoundTemplateId(config: any) {
  return String(config?.configData?.templateBinding?.psdTemplateId || "").trim();
}

function getPublishConfigBindingLabel(config: any) {
  const boundTemplateId = getPublishConfigBoundTemplateId(config);
  return boundTemplateId || "通用配置";
}

function getPublishConfigMatchInfo(config: any) {
  const boundTemplateId = getPublishConfigBoundTemplateId(config);
  if (!boundTemplateId) {
    return {
      selectable: true,
      label: "可选",
      type: "success" as const,
      reason: "",
    };
  }

  if (publishConfigTargetTemplateMode.value === "multiple") {
    return {
      selectable: false,
      label: "多模板不可用",
      type: "warning" as const,
      reason: "所选套图包含多个 PSD 模板，绑定模板配置需按模板分批生成",
    };
  }

  if (publishConfigTargetTemplateMode.value !== "single") {
    return {
      selectable: false,
      label: "缺少模板",
      type: "warning" as const,
      reason: "当前套图缺少 PSD 模板信息，无法使用绑定模板配置",
    };
  }

  const targetTemplateId = publishConfigTargetTemplateIds.value[0];
  const matched = boundTemplateId === targetTemplateId;
  return {
    selectable: matched,
    label: matched ? "模板匹配" : "模板不一致",
    type: matched ? ("success" as const) : ("danger" as const),
    reason: matched ? "" : "任务配置绑定的 PSD 模板与当前套图模板不一致",
  };
}

function isPublishConfigSelectable(config: any) {
  return getPublishConfigMatchInfo(config).selectable;
}

type PsdSetRuntimeUpdatePayload = {
  status?: string;
  message?: string;
  progress?: number;
  total?: number;
  assignedClientId?: string | null;
  assignedMachineCode?: string | null;
  schedulerStatus?: string;
};

function buildPsdSetRuntimePayloadFromSummary(item: any): PsdSetRuntimeUpdatePayload {
  return {
    status: item?.status || "processing",
    schedulerStatus: item?.schedulerStatus || undefined,
    message:
      String(item?.currentStep || "").trim() ||
      String(item?.statusMessage || "").trim() ||
      undefined,
    progress: typeof item?.progress === "number" ? item.progress : undefined,
    assignedClientId: item?.assignedClientId ?? null,
    assignedMachineCode: item?.assignedMachineCode ?? null,
  };
}

function normalizePsdSetSchedulerMeta(value: any) {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return typeof value === "object" && !Array.isArray(value) ? { ...value } : null;
}

function normalizePsdSetRecord(record: any) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return record;
  }
  const schedulerMeta = normalizePsdSetSchedulerMeta(record.schedulerMeta);
  return {
    ...record,
    ...(schedulerMeta ? { schedulerMeta } : {}),
  };
}

function normalizePsdSetRuntimeStatus(status?: unknown) {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  if (normalizedStatus === "running" || normalizedStatus === "assigned") {
    return "processing";
  }
  return normalizedStatus;
}

function resolvePsdSetProgressPercent(progress?: number, total?: number, fallback?: number | null) {
  if (typeof progress !== "number") {
    return typeof fallback === "number" ? fallback : null;
  }
  if (typeof total === "number" && total > 0) {
    return Math.max(0, Math.min(100, Math.round((progress / total) * 100)));
  }
  return Math.max(0, Math.min(100, progress));
}

function resolvePsdSetRuntimeStatusMessage(status: string, message?: string, schedulerMeta?: any) {
  const currentStep = String(schedulerMeta?.currentStep || "").trim();
  if (
    currentStep &&
    (status === "processing" ||
      schedulerMeta?.status === "assigned" ||
      schedulerMeta?.status === "running")
  ) {
    return currentStep;
  }

  const explicitMessage = String(message || "").trim();
  if (explicitMessage) {
    return explicitMessage;
  }

  if (currentStep) {
    return currentStep;
  }

  switch (status) {
    case "completed":
      return "制作完成";
    case "failed":
      return String(schedulerMeta?.lastError || "制作失败");
    case "processing":
      return "正在处理中...";
    case "pending":
      return "等待调度";
    default:
      return "";
  }
}

function resolvePsdSetStatusMessage(record: any) {
  if (!record || typeof record !== "object") {
    return "-";
  }
  return (
    resolvePsdSetRuntimeStatusMessage(
      String(record.status || "").trim(),
      record.statusMessage,
      normalizePsdSetSchedulerMeta(record.schedulerMeta),
    ) || "-"
  );
}

function findPsdSetRowIndexById(psdSetId: unknown) {
  const normalizedId = normalizePsdSetId(psdSetId);
  if (!normalizedId) {
    return -1;
  }

  return dataSource.value.findIndex((item) => normalizePsdSetId(item?.id) === normalizedId);
}

function buildPsdSetRuntimeRecord(
  target: any,
  payload: PsdSetRuntimeUpdatePayload,
) {
  if (!target || typeof target !== "object") {
    return target;
  }

  if (
    isPsdSetTerminalOrManualStatus(target.status) &&
    isPsdSetRuntimePayloadActive(payload)
  ) {
    return target;
  }

  const rawPayloadStatus = String(payload.status || "").trim().toLowerCase();
  const nextStatus =
    normalizePsdSetRuntimeStatus(payload.status || target.status) || target.status;
  const currentMeta = normalizePsdSetSchedulerMeta(target.schedulerMeta) || {};
  const now = new Date().toISOString();
  const nextMeta: Record<string, any> = {
    ...currentMeta,
    lastHeartbeatAt: now,
    assignedClientId:
      payload.assignedClientId !== undefined
        ? payload.assignedClientId
        : currentMeta.assignedClientId || null,
    assignedMachineCode:
      payload.assignedMachineCode !== undefined
        ? payload.assignedMachineCode
        : currentMeta.assignedMachineCode || null,
    currentStep:
      payload.message !== undefined
        ? payload.message || currentMeta.currentStep || null
        : currentMeta.currentStep || null,
    progress: resolvePsdSetProgressPercent(
      payload.progress,
      payload.total,
      currentMeta.progress ?? null,
    ),
  };

  const nextSchedulerStatus =
    payload.schedulerStatus ||
    (rawPayloadStatus === "assigned"
      ? "assigned"
      : rawPayloadStatus === "running"
        ? "running"
        : nextStatus === "processing"
          ? "running"
          : nextStatus === "completed"
            ? "completed"
            : nextStatus === "failed"
              ? "failed"
              : nextStatus === "pending"
                ? "pending"
                : currentMeta.status || null);

  if (nextSchedulerStatus) {
    nextMeta.status = nextSchedulerStatus;
  }

  if (nextSchedulerStatus === "assigned") {
    nextMeta.progress = 0;
    nextMeta.startedAt = null;
    nextMeta.finishedAt = null;
    nextMeta.lastError = null;
    nextMeta.currentStep = payload.message || currentMeta.currentStep || "等待客户端接收任务";
  } else if (nextSchedulerStatus === "running") {
    nextMeta.startedAt = currentMeta.startedAt || currentMeta.assignedAt || now;
    nextMeta.finishedAt = null;
    nextMeta.lastError = null;
  } else if (nextSchedulerStatus === "completed") {
    nextMeta.startedAt = currentMeta.startedAt || currentMeta.assignedAt || now;
    nextMeta.finishedAt = now;
    nextMeta.progress = 100;
    nextMeta.lastError = null;
  } else if (nextSchedulerStatus === "failed") {
    nextMeta.startedAt = currentMeta.startedAt || currentMeta.assignedAt || now;
    nextMeta.finishedAt = now;
    nextMeta.lastError = payload.message || currentMeta.lastError || "制作失败";
  } else if (nextSchedulerStatus === "pending") {
    nextMeta.finishedAt = null;
    nextMeta.assignedClientId = null;
    nextMeta.assignedMachineCode = null;
  }

  return {
    ...target,
    status: nextStatus,
    statusMessage: resolvePsdSetRuntimeStatusMessage(nextStatus, payload.message, nextMeta),
    schedulerMeta: nextMeta,
  };
}

function isPsdSetRuntimePayloadActive(payload: PsdSetRuntimeUpdatePayload) {
  const status = normalizePsdSetRuntimeStatus(payload.status);
  const schedulerStatus = String(payload.schedulerStatus || "").trim();
  return (
    status === "processing" ||
    schedulerStatus === "assigned" ||
    schedulerStatus === "running"
  );
}

function isPsdSetTerminalOrManualStatus(status: unknown) {
  const normalizedStatus = normalizePsdSetRuntimeStatus(status);
  return (
    normalizedStatus === "completed" ||
    normalizedStatus === "failed"
  );
}

function rememberPsdSetRuntimeOverlay(psdSetId: string, payload: PsdSetRuntimeUpdatePayload) {
  const normalizedId = normalizePsdSetId(psdSetId);
  if (!normalizedId) {
    return;
  }

  psdSetRuntimeOverlayMap.value = {
    ...psdSetRuntimeOverlayMap.value,
    [normalizedId]: {
      payload,
      expiresAt: isPsdSetRuntimePayloadActive(payload)
        ? Date.now() + PSD_SET_RUNTIME_ACTIVE_OVERLAY_TTL_MS
        : Date.now() + PSD_SET_RUNTIME_TERMINAL_OVERLAY_TTL_MS,
    },
  };
}

function getPsdSetRuntimeOverlay(psdSetId: unknown) {
  const normalizedId = normalizePsdSetId(psdSetId);
  const overlay = normalizedId ? psdSetRuntimeOverlayMap.value[normalizedId] : null;
  if (!overlay) {
    return null;
  }

  if (overlay.expiresAt && overlay.expiresAt <= Date.now()) {
    const nextMap = { ...psdSetRuntimeOverlayMap.value };
    delete nextMap[normalizedId];
    psdSetRuntimeOverlayMap.value = nextMap;
    return null;
  }

  return overlay;
}

function clearPsdSetRuntimeOverlay(psdSetId: unknown) {
  const normalizedId = normalizePsdSetId(psdSetId);
  if (!normalizedId || !psdSetRuntimeOverlayMap.value[normalizedId]) {
    return;
  }

  const nextMap = { ...psdSetRuntimeOverlayMap.value };
  delete nextMap[normalizedId];
  psdSetRuntimeOverlayMap.value = nextMap;
}

function clearAllPsdSetRuntimeOverlays() {
  if (!Object.keys(psdSetRuntimeOverlayMap.value).length) {
    return;
  }
  psdSetRuntimeOverlayMap.value = {};
}

function mergePsdSetRuntimeOverlay(record: any) {
  const overlay = getPsdSetRuntimeOverlay(record?.id);
  if (overlay && isPsdSetRuntimePayloadActive(overlay.payload) && isPsdSetTerminalOrManualStatus(record?.status)) {
    clearPsdSetRuntimeOverlay(record?.id);
    return record;
  }
  return overlay ? buildPsdSetRuntimeRecord(record, overlay.payload) : record;
}

function applyPsdSetRuntimeUpdate(
  psdSetId: unknown,
  payload: PsdSetRuntimeUpdatePayload,
) {
  const normalizedId = normalizePsdSetId(psdSetId);
  if (!normalizedId) {
    return;
  }

  rememberPsdSetRuntimeOverlay(normalizedId, payload);

  const rowIndex = findPsdSetRowIndexById(normalizedId);
  if (rowIndex >= 0) {
    const currentRow = dataSource.value[rowIndex];
    dataSource.value.splice(rowIndex, 1, buildPsdSetRuntimeRecord(currentRow, payload));
  }

  if (normalizePsdSetId(detailData.value?.id) === normalizedId) {
    detailData.value = buildPsdSetRuntimeRecord(detailData.value, payload);
  }
}

function isPsdSetRuntimeActive(record: any) {
  if (!record || typeof record !== "object") {
    return false;
  }
  const normalizedStatus = normalizePsdSetRuntimeStatus(record.status);
  if (normalizedStatus === "completed" || normalizedStatus === "failed") {
    return false;
  }
  if (normalizedStatus === "processing") {
    return true;
  }
  const schedulerMeta = normalizePsdSetSchedulerMeta(record.schedulerMeta);
  const schedulerStatus = String(schedulerMeta?.status || "").trim();
  if (schedulerStatus === "completed" || schedulerStatus === "failed") {
    return false;
  }
  return schedulerMeta?.status === "assigned" || schedulerMeta?.status === "running";
}

function isPsdSetActiveBySummary(psdSetId: unknown) {
  const normalizedId = normalizePsdSetId(psdSetId);
  if (!normalizedId) {
    return false;
  }

  return activePsdSets.value.some((item: any) => {
    if (normalizePsdSetId(item?.id) !== normalizedId) {
      return false;
    }
    const status = normalizePsdSetRuntimeStatus(item?.status);
    const schedulerStatus = String(item?.schedulerStatus || "").trim();
    return (
      status === "processing" ||
      schedulerStatus === "assigned" ||
      schedulerStatus === "running"
    );
  });
}

function getPsdSetDisplayStatus(record: any) {
  if (!record || typeof record !== "object") {
    return normalizePsdSetRuntimeStatus(record) || "";
  }

  const normalizedStatus = normalizePsdSetRuntimeStatus(record.status);
  if (
    normalizedStatus === "completed" ||
    normalizedStatus === "failed"
  ) {
    return normalizedStatus;
  }

  const schedulerMeta = normalizePsdSetSchedulerMeta(record.schedulerMeta);
  const schedulerStatus = String(schedulerMeta?.status || "").trim();
  if (schedulerStatus === "completed" || schedulerStatus === "failed") {
    return schedulerStatus;
  }

  if (isPsdSetRuntimeActive(record) || isPsdSetActiveBySummary(record.id)) {
    return "processing";
  }

  return normalizedStatus || record.status || "";
}

function applyManualPsdSetStatusLocally(psdSetId: unknown, status: string) {
  const normalizedId = normalizePsdSetId(psdSetId);
  if (!normalizedId) {
    return;
  }

  clearPsdSetRuntimeOverlay(normalizedId);
  const normalizedStatus = normalizePsdSetRuntimeStatus(status) || status;
  const applyToRecord = (record: any) => {
    if (!record || typeof record !== "object") {
      return record;
    }

    const currentMeta = normalizePsdSetSchedulerMeta(record.schedulerMeta) || {};
    const now = new Date().toISOString();
    const nextMeta = {
      ...currentMeta,
      status: normalizedStatus,
      progress: normalizedStatus === "completed" ? 100 : normalizedStatus === "pending" ? 0 : currentMeta.progress,
      finishedAt:
        normalizedStatus === "completed" || normalizedStatus === "failed"
          ? currentMeta.finishedAt || now
          : null,
      currentStep:
        normalizedStatus === "completed"
          ? "制作完成"
          : normalizedStatus === "failed"
            ? currentMeta.lastError || "制作失败"
            : normalizedStatus === "pending"
              ? "等待调度"
              : currentMeta.currentStep,
    };

    if (normalizedStatus === "pending") {
      nextMeta.assignedClientId = null;
      nextMeta.assignedMachineCode = null;
      nextMeta.lastError = null;
    }

    return {
      ...record,
      status: normalizedStatus,
      statusMessage: resolvePsdSetRuntimeStatusMessage(normalizedStatus, undefined, nextMeta),
      schedulerMeta: nextMeta,
    };
  };

  const rowIndex = findPsdSetRowIndexById(normalizedId);
  if (rowIndex >= 0) {
    dataSource.value.splice(rowIndex, 1, applyToRecord(dataSource.value[rowIndex]));
  }

  if (normalizePsdSetId(detailData.value?.id) === normalizedId) {
    detailData.value = applyToRecord(detailData.value);
  }
}

const hasActivePsdSetRuntime = computed(() => {
  return (
    dataSource.value.some((item) => isPsdSetRuntimeActive(item)) ||
    isPsdSetRuntimeActive(detailData.value)
  );
});

// 编辑配置对话框相关状态
const configEditDialogVisible = ref(false);
const configEditDialogLoading = ref(false);
const configEditDialogData = ref<any>(null);
const configEditDialogValue = ref("");
const configEditDialogError = ref("");
const configEditDialogSaving = ref(false);
let configValidateTimer: ReturnType<typeof setTimeout> | null = null;
let psdSetSchedulerRuntimeTimer: ReturnType<typeof setInterval> | null = null;
let psdSetRuntimeReloadTimer: ReturnType<typeof setTimeout> | null = null;
let psdSetActiveRuntimeTimer: ReturnType<typeof setInterval> | null = null;
const PSD_SET_RUNTIME_ACTIVE_OVERLAY_TTL_MS = 10 * 60 * 1000;
const PSD_SET_RUNTIME_TERMINAL_OVERLAY_TTL_MS = 10000;
const psdSetRuntimeOverlayMap = ref<
  Record<string, { payload: PsdSetRuntimeUpdatePayload; expiresAt: number | null }>
>({});

// 查看配置对话框相关状态
const configViewDialogVisible = ref(false);
const configViewDialogLoading = ref(false);
const configViewDialogData = ref<any>(null);
const configViewFormatted = computed(() => {
  const config = configViewDialogData.value?.stickerPsdSetConfig;
  if (!config) return "";
  try {
    const parsed = typeof config === "string" ? JSON.parse(config) : config;
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return String(config);
  }
});

// 格式化配置信息用于预览
const formattedConfig = computed(() => {
  const config = detailData.value?.stickerPsdSetConfig;
  if (!config) return "";
  try {
    const parsed = typeof config === "string" ? JSON.parse(config) : config;
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return String(config);
  }
});

const detailMetaFormatted = computed(() => {
  const meta = detailData.value?.meta;
  if (!meta) return "";
  try {
    const parsed = typeof meta === "string" ? JSON.parse(meta) : meta;
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return String(meta);
  }
});

const detailSchedulerMetaFormatted = computed(() => {
  const schedulerMeta = detailData.value?.schedulerMeta;
  if (!schedulerMeta) return "";
  try {
    const parsed = typeof schedulerMeta === "string" ? JSON.parse(schedulerMeta) : schedulerMeta;
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return String(schedulerMeta);
  }
});

function getColumns() {
  const baseColumns = [
    { type: "checkbox", width: 50, fixed: "left" as const },
    { title: "套图图片", field: "images", width: 200, slots: { default: "imagesSlot" } },
    { title: "套图名称", field: "name", minWidth: 180 },
    { title: "多素材关联", field: "stickers", width: 120, slots: { default: "stickersCountSlot" } },
    { title: "描述", field: "description", minWidth: 200, showOverflow: true },
    { title: "关键词", field: "keywords", minWidth: 180, showOverflow: true },
    {
      title: "上传者",
      field: "uploader",
      width: 140,
      formatter: ({ row }) => row?.uploader?.account || row?.uploader?.name || row?.userId || "-",
    },
    { title: "状态", field: "status", width: 120, slots: { default: "statusSlot" } },
    {
      title: "状态说明",
      field: "statusMessage",
      width: 320,
      showOverflow: true,
      formatter: ({ row }) => resolvePsdSetStatusMessage(row),
    },
    { title: "配置信息", field: "config", width: 150, slots: { default: "configSlot" } },
    {
      title: "制作耗时",
      field: "processingTime",
      width: 140,
      formatter: ({ cellValue }) => formatProcessingTime(cellValue),
    },
    {
      title: "ID",
      field: "id",
      width: 120,
      showOverflow: false,
      slots: { default: "idSlot" },
    },
    {
      title: "创建时间",
      field: "createTime",
      width: 160,
      formatter: ({ cellValue }) => formatTimestamp(cellValue),
    },
    {
      title: "更新时间",
      field: "updateTime",
      width: 160,
      formatter: ({ cellValue }) => formatTimestamp(cellValue),
    },
  ];

  const operationColumn = [buildOperationColumn("operationSlot")];

  return [...baseColumns, ...operationColumn];
}

const gridOptions = ref<any>({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: "id",
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: getColumns(),
});

function psdSetRowClassName({ row }: any) {
  if (row?.publishUsage?.occupied === true) {
    return "is-publish-usage-occupied has-publish-usage-badge";
  }
  if (row?.publishUsage?.occupied === false) {
    return "is-publish-usage-available has-publish-usage-badge";
  }
  return "";
}

function handlePsdSetCellClick({ row, column }: any) {
  if (!row?.publishUsage) {
    return;
  }
  if (String(column?.type || "") === "checkbox" || String(column?.field || "") === "checkbox") {
    void handleViewPublishUsageRecords(row);
  }
}

const { height } = useWindowSize();

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 240;
});

async function getList(silent = false) {
  if (!silent) {
    loading.value = true;
  }
  try {
    const res = await stickerPsdSetApi.page({
      ...queryParams,
      id: queryParams.id?.trim() || undefined,
      status: queryParams.status || undefined,
      keyword: queryParams.keyword?.trim() || undefined,
      includeDetails: showDetails.value,
      sortingFields: queryParams.sortingFields,
      startTime: queryParams.startTime || undefined,
      endTime: queryParams.endTime || undefined,
      publishUsageConfigId: queryParams.publishUsageConfigId.length
        ? queryParams.publishUsageConfigId
        : undefined,
    });
    dataSource.value = Array.isArray(res.list)
      ? res.list.map((item) => mergePsdSetRuntimeOverlay(normalizePsdSetRecord(item)))
      : [];
    total.value = res.total || 0;
  } finally {
    if (!silent) {
      loading.value = false;
    }
  }
}

function handleIdChange(val: string) {
  if (!val) {
    getList();
  }
}

function handleKeywordChange(val: string) {
  if (!val) {
    getList();
  }
}

function formatProcessingTime(seconds: any): string {
  const s = Number(seconds);
  if (isNaN(s) || s <= 0) return "-";
  if (s < 60) return `${s.toFixed(2)}秒`;
  if (s < 3600) {
    const minutes = Math.floor(s / 60);
    const secs = s % 60;
    return `${minutes}分${secs.toFixed(2)}秒`;
  }
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${hours}小时${minutes}分${secs.toFixed(2)}秒`;
}

function getPreviewImageList(row: any): string[] {
  return Array.isArray(row?.images)
    ? row.images.filter((url: any) => typeof url === "string" && url.trim())
    : [];
}

function handlePublishUsageViewChange() {
  queryParams.currentPage = 1;
  getList();
}

function getPreviewImageKey(row: any) {
  const id = normalizePsdSetId(row?.id);
  return id || getPreviewImageList(row).join("|");
}

function getPreviewImageCount(row: any) {
  return getPreviewImageList(row).length;
}

function getPreviewImageIndex(row: any) {
  const imageCount = getPreviewImageCount(row);
  if (imageCount <= 0) {
    return 0;
  }

  const key = getPreviewImageKey(row);
  const rawIndex = Number(tablePreviewImageIndexMap[key] ?? 0);
  const index = Number.isFinite(rawIndex) ? Math.trunc(rawIndex) : 0;
  return Math.min(Math.max(index, 0), imageCount - 1);
}

function shiftPreviewImage(row: any, delta: number) {
  const images = getPreviewImageList(row);
  if (images.length <= 1) {
    return;
  }

  const key = getPreviewImageKey(row);
  const currentIndex = getPreviewImageIndex(row);
  tablePreviewImageIndexMap[key] = (currentIndex + delta + images.length) % images.length;
}

function openPsdSetImagePreview(row: any, initialIndex?: number) {
  const images = getPreviewImageList(row);
  if (!images.length) {
    return;
  }

  const index = typeof initialIndex === "number" ? initialIndex : getPreviewImageIndex(row);
  tableImageViewerUrls.value = images;
  tableImageViewerIndex.value = Math.min(Math.max(Math.trunc(index), 0), images.length - 1);
  tableImageViewerVisible.value = true;
  nextTick(() => {
    mountTableImageViewerIndexLabel();
    updateTableImageViewerIndexLabel();
  });
}

function handleTableImageViewerSwitch(index: number) {
  tableImageViewerIndex.value = Math.min(
    Math.max(Math.trunc(Number(index) || 0), 0),
    Math.max(tableImageViewerUrls.value.length - 1, 0),
  );
  updateTableImageViewerIndexLabel();
}

function handleTableImageViewerClose() {
  tableImageViewerVisible.value = false;
  removeTableImageViewerIndexLabel();
}

function mountTableImageViewerIndexLabel() {
  if (typeof document === "undefined") {
    return;
  }

  const viewerWrapper = document.querySelector(".el-image-viewer__wrapper");
  if (!viewerWrapper) {
    return;
  }

  if (!tableImageViewerLabelEl) {
    tableImageViewerLabelEl = document.createElement("div");
    tableImageViewerLabelEl.className = "psd-set-image-viewer-index-label";
    tableImageViewerLabelEl.style.cssText = [
      "position:absolute",
      "left:24px",
      "top:24px",
      "z-index:10",
      "display:inline-flex",
      "align-items:center",
      "justify-content:center",
      "height:34px",
      "min-width:104px",
      "padding:0 14px",
      "border-radius:999px",
      "background:rgba(15,23,42,.82)",
      "color:#fff",
      "font-size:14px",
      "line-height:34px",
      "box-shadow:0 8px 22px rgba(0,0,0,.28)",
      "pointer-events:none",
    ].join(";");
  }

  if (tableImageViewerLabelEl.parentElement !== viewerWrapper) {
    viewerWrapper.appendChild(tableImageViewerLabelEl);
  }
}

function updateTableImageViewerIndexLabel() {
  if (!tableImageViewerLabelEl) {
    return;
  }

  tableImageViewerLabelEl.textContent = `第 ${tableImageViewerDisplayIndex.value} / 共 ${tableImageViewerUrls.value.length} 张`;
}

function removeTableImageViewerIndexLabel() {
  tableImageViewerLabelEl?.remove();
  tableImageViewerLabelEl = null;
}

// 批量下载套图图片（与商品页面逻辑一致）
async function handleDownloadPsdSetImages(row: any) {
  if (!row || !Array.isArray(row.images) || !row.images.length) {
    ElMessage.warning("暂无可下载的套图图片");
    return;
  }

  const images: string[] = row.images.filter((u: any) => typeof u === "string" && u.trim());
  if (!images.length) {
    ElMessage.warning("暂无可下载的套图图片");
    return;
  }

  const baseName = row.name || "套图图片";
  ElMessage.info(`开始下载 ${images.length} 张图片，请稍候...`);

  for (let i = 0; i < images.length; i++) {
    const url = images[i];
    const suffixMatch = String(url).match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
    const ext = suffixMatch ? suffixMatch[1] : "jpg";
    const filename = `${baseName}_${i + 1}.${ext}`;

    try {
      await downloadImageEnhanced(url, filename, { showMessage: false, fallbackToNewWindow: true });
    } catch (e) {
      console.error("下载单张图片失败:", e);
    }
  }

  ElMessage.success("套图图片批量下载任务已完成");
}

function statusLabel(status: string) {
  const normalizedStatus = normalizePsdSetRuntimeStatus(status);
  const item = statusOptions.find((s) => s.value === normalizedStatus);
  return item ? item.label : normalizedStatus || "-";
}

function schedulerStatusLabel(status?: string) {
  const map: Record<string, string> = {
    pending: "待调度",
    assigned: "已分配",
    running: "执行中",
    completed: "已完成",
    failed: "失败",
    timeout: "超时",
  };
  return map[String(status || "").trim()] || "待调度";
}

function schedulerStatusTagType(status?: string) {
  switch (status) {
    case "completed":
      return "success";
    case "running":
      return "warning";
    case "assigned":
      return "info";
    case "failed":
    case "timeout":
      return "danger";
    default:
      return "info";
  }
}

function formatSchedulerProgress(progress?: number | null) {
  return typeof progress === "number" ? `${progress}%` : "-";
}

function getSchedulerAssignedLabel(row: any) {
  const meta = normalizePsdSetSchedulerMeta(row?.schedulerMeta);
  if (!meta) return "-";
  return meta.assignedMachineCode || meta.assignedClientId || "-";
}

function getClientPhotoshopService(client: any) {
  return (
    client?.clientInfo?.services?.["ps-automation"] ||
    client?.clientInfo?.services?.photoshop ||
    null
  );
}

function getClientDisplayName(client: any) {
  return client?.clientInfo?.machine?.code || client?.id || "-";
}

function getDispatchClientActivePsdSets(client: any) {
  const clientId = String(client?.id || "").trim();
  if (!clientId) {
    return [];
  }
  return activePsdSets.value.filter(
    (item) => String(item?.assignedClientId || "").trim() === clientId,
  );
}

function isDispatchClientBusy(client: any) {
  const clientId = String(client?.id || "").trim();
  return !!clientId && activePsdSetClientIds.value.includes(clientId);
}

function isDispatchClientExecutable(client: any) {
  const service = getClientPhotoshopService(client);
  if (!client?.isOnline || !service) return false;
  if (isDispatchClientBusy(client)) return false;
  return service.available === true;
}

function getDispatchClientOnlineStatus(client: any) {
  return client?.isOnline ? { text: "在线", tone: "success" } : { text: "离线", tone: "danger" };
}

function getDispatchClientPsStatus(client: any) {
  const service = getClientPhotoshopService(client);
  if (!client?.isOnline) {
    return { text: "不可用", tone: "danger" };
  }
  if (!service) {
    return { text: "未开启", tone: "muted" };
  }
  if (service.status === "error" || service.state === "error") {
    return { text: "异常", tone: "danger" };
  }
  if (service.available) {
    return { text: "已开启", tone: "success" };
  }
  if (service.connected) {
    return { text: "未就绪", tone: "info" };
  }
  return { text: "未开启", tone: "muted" };
}

function getDispatchClientProductionStatus(client: any) {
  const activeItems = getDispatchClientActivePsdSets(client);
  if (activeItems.length > 0) {
    return {
      text: activeItems.length > 1 ? `制作中(${activeItems.length})` : "制作中",
      tone: "warning",
    };
  }
  return { text: "空闲", tone: isDispatchClientExecutable(client) ? "success" : "muted" };
}

const dispatchCandidateClients = computed(() =>
  clientNodes.value.filter((client) => {
    if (!client?.isOnline) {
      return false;
    }
    const service = getClientPhotoshopService(client);
    return !!(service || client?.clientInfo?.psAutomation);
  }),
);

const dispatchClientRows = computed(() =>
  dispatchCandidateClients.value
    .map((client) => {
      const onlineStatus = getDispatchClientOnlineStatus(client);
      const psStatus = getDispatchClientPsStatus(client);
      const productionStatus = getDispatchClientProductionStatus(client);
      return {
        id: client.id,
        client,
        clientLabel: getClientDisplayName(client),
        connectedAtLabel: formatTimestamp(client.connectedAt) || "-",
        onlineStatusText: onlineStatus.text,
        onlineStatusTone: onlineStatus.tone,
        psStatusText: psStatus.text,
        psStatusTone: psStatus.tone,
        productionStatusText: productionStatus.text,
        productionStatusTone: productionStatus.tone,
        selectable: isDispatchClientExecutable(client),
      };
    })
    .sort((a, b) => {
      if (a.selectable !== b.selectable) {
        return a.selectable ? -1 : 1;
      }
      return a.clientLabel.localeCompare(b.clientLabel, "zh-CN");
    }),
);

const dispatchableClients = computed(() =>
  dispatchCandidateClients.value.filter((client) => isDispatchClientExecutable(client)),
);

const selectedDispatchClient = computed(
  () =>
    dispatchCandidateClients.value.find((item) => item.id === selectedDispatchClientId.value) ||
    null,
);

const psdSetSchedulerIndicator = computed(() =>
  resolveAutoDispatchSchedulerIndicator(psdSetSchedulerRuntime.value),
);

const psdSetSchedulerMeta = computed(() =>
  resolveAutoDispatchSchedulerMeta(psdSetSchedulerRuntime.value),
);

async function openProductionDispatchDialog(row: any) {
  productionDispatchRow.value = row;
  selectedDispatchClientId.value = "";
  productionDispatchLoading.value = true;
  productionDispatchDialogVisible.value = true;
}

async function handleOpenProductionDispatchDialog() {
  productionDispatchLoading.value = true;
  try {
    await Promise.all([refreshClientNodes(), refreshPsdSetRuntimeSummary()]);
    if (!selectedDispatchClientId.value && dispatchableClients.value.length === 1) {
      selectedDispatchClientId.value = dispatchableClients.value[0].id;
    }
  } finally {
    productionDispatchLoading.value = false;
  }
}

function handleCloseProductionDispatchDialog() {
  productionDispatchLoading.value = false;
  productionDispatchRow.value = null;
  selectedDispatchClientId.value = "";
}

function handleSelectDispatchClient(clientId: string) {
  selectedDispatchClientId.value = clientId;
}

function handleDispatchClientRowClick(row: any) {
  if (!row?.selectable) {
    return;
  }
  handleSelectDispatchClient(row.id);
}

function resolveDispatchClientRowClassName({ row }: { row: any }) {
  const classNames: string[] = [];
  if (row?.id === selectedDispatchClientId.value) {
    classNames.push("is-selected");
  }
  if (!row?.selectable) {
    classNames.push("is-disabled");
  }
  return classNames.join(" ");
}

async function refreshUserAutoSchedulingSetting() {
  await refreshUserAutoScheduling();
}

async function loadPsdSetDetailById(psdSetId: unknown, silent = false) {
  const normalizedId = normalizePsdSetId(psdSetId);
  if (!normalizedId) {
    return;
  }

  if (!silent) {
    detailLoading.value = true;
  }

  try {
    const res = await request.get({
      url: `/sticker-psd-set/${normalizedId}`,
    });
    detailData.value = normalizePsdSetRecord(res?.data || res || {});
  } catch (error: any) {
    if (!silent) {
      console.error("获取套图详情失败:", error);
      ElMessage.error(error?.message || "获取详情失败");
      detailDialogVisible.value = false;
    }
  } finally {
    if (!silent) {
      detailLoading.value = false;
    }
  }
}

async function loadPsdSetSchedulerRuntime() {
  try {
    const response = await getPsdSetAutoDispatchRuntime();
    psdSetSchedulerRuntime.value = normalizeAutoDispatchSchedulerRuntime(response);
  } catch {
    psdSetSchedulerRuntime.value = null;
  }
}

function schedulePsdSetRuntimeRefresh(delay = 600) {
  if (psdSetRuntimeReloadTimer) {
    clearTimeout(psdSetRuntimeReloadTimer);
  }

  psdSetRuntimeReloadTimer = setTimeout(() => {
    psdSetRuntimeReloadTimer = null;
    void getList(true);
    void loadPsdSetSchedulerRuntime();
    if (detailDialogVisible.value && detailData.value?.id) {
      void loadPsdSetDetailById(detailData.value.id, true);
    }
  }, delay);
}

function stopPsdSetActiveRuntimeRefresh() {
  if (!psdSetActiveRuntimeTimer) {
    return;
  }
  clearInterval(psdSetActiveRuntimeTimer);
  psdSetActiveRuntimeTimer = null;
}

async function handleToggleUserAutoScheduling(enabled: boolean) {
  const previousEnabled = userAutoSchedulingEnabled.value;
  setUserAutoSchedulingEnabled(enabled);
  userAutoSchedulingLoading.value = true;
  try {
    const result = await ClientControlService.setPsAutomationUserAutoScheduling(enabled);
    if (!result.success) {
      setUserAutoSchedulingEnabled(previousEnabled);
      return;
    }

    if (enabled) {
      void refreshPsdSetRuntimeSummary();
      schedulePsdSetRuntimeRefresh(120);
    }
    void loadPsdSetSchedulerRuntime();
  } catch {
    setUserAutoSchedulingEnabled(previousEnabled);
  } finally {
    userAutoSchedulingLoading.value = false;
  }
}

function statusTagType(status: string) {
  switch (normalizePsdSetRuntimeStatus(status)) {
    case "completed":
      return "success";
    case "processing":
      return "warning";
    case "failed":
      return "danger";
    case "pending":
      return "info";
    default:
      return "info";
  }
}

// 获取贴纸数组（兼容旧数据：优先使用 stickers，没有则使用 sticker）
function getStickers(row: any) {
  if (Array.isArray(row.stickers) && row.stickers.length > 0) {
    return row.stickers;
  }
  if (row.sticker) {
    return [row.sticker];
  }
  return [];
}

// 获取贴纸数量
function getStickersCount(row: any) {
  const stickers = getStickers(row);
  if (stickers.length > 0) {
    return stickers.length;
  }
  // 如果没有 stickers 数据，尝试从 stickerIds 获取数量
  if (Array.isArray(row.stickerIds) && row.stickerIds.length > 0) {
    return row.stickerIds.length;
  }
  // 如果有 stickerId，说明至少有一个
  if (row.stickerId) {
    return 1;
  }
  return 0;
}

// 复制 ID
async function copyId(id: string) {
  if (!id) return;
  try {
    await navigator.clipboard.writeText(id);
    ElMessage.success("ID 已复制到剪贴板");
  } catch (e) {
    // 降级方案
    const textarea = document.createElement("textarea");
    textarea.value = id;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    ElMessage.success("ID 已复制到剪贴板");
  }
}

function onSelectionChange({ records, reserves }) {
  const current = Array.isArray(records) ? records : [];
  const reserveList = Array.isArray(reserves) ? reserves : [];
  const selectedRows = [...current, ...reserveList];
  selectedIds.value = selectedRows.map((item) => item.id);
  selectedPsdSetRows.value = selectedRows;
}

async function updateRowStatus(row, status: string) {
  try {
    await stickerPsdSetApi.updateStatus(row.id, { status });
    applyManualPsdSetStatusLocally(row.id, status);
    ElMessage.success("状态已更新");
    getList(true);
  } catch (error: any) {
    ElMessage.error(error?.message || "状态更新失败");
  }
}

async function handleToProduct(row: any) {
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法生成产品");
  }
  generatingProductId.value = row.id;
  await openGenerateProductDialog([row.id]);
}

// 查看配置信息（独立的弹窗）
async function handleViewConfig(row: any) {
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法查看配置");
  }
  configViewDialogVisible.value = true;
  configViewDialogLoading.value = true;
  try {
    const res = await request.get({
      url: `/sticker-psd-set/${row.id}`,
    });
    configViewDialogData.value = res?.data || res || {};
  } catch (error: any) {
    console.error("获取套图详情失败:", error);
    ElMessage.error(error?.message || "获取配置失败");
    configViewDialogVisible.value = false;
  } finally {
    configViewDialogLoading.value = false;
  }
}

// 从查看配置弹窗跳转到编辑配置
function handleEditFromView() {
  if (!configViewDialogData.value?.id) {
    return ElMessage.warning("缺少ID，无法编辑配置");
  }
  // 关闭查看配置弹窗
  configViewDialogVisible.value = false;
  // 打开编辑配置弹窗
  handleEditConfigDirectly(configViewDialogData.value);
}

async function handleViewDetail(row: any) {
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法查看详情");
  }
  detailDialogVisible.value = true;
  await loadPsdSetDetailById(row.id);
}

function handleCloseDetailDialog() {
  detailLoading.value = false;
  detailData.value = null;
}

// 直接编辑配置信息（打开独立的编辑配置对话框）
async function handleEditConfigDirectly(row: any) {
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法编辑配置");
  }
  configEditDialogVisible.value = true;
  configEditDialogLoading.value = true;
  configEditDialogError.value = "";
  configEditDialogValue.value = "";
  try {
    const res = await request.get({
      url: `/sticker-psd-set/${row.id}`,
    });
    configEditDialogData.value = res?.data || res || {};
    // 初始化配置编辑值
    const config = configEditDialogData.value?.stickerPsdSetConfig;
    if (config) {
      try {
        const parsed = typeof config === "string" ? JSON.parse(config) : config;
        configEditDialogValue.value = JSON.stringify(parsed, null, 2);
      } catch (e) {
        // 如果解析失败，显示原始值并提示错误
        configEditDialogValue.value = String(config);
        configEditDialogError.value = "当前配置格式不正确，请修正后保存";
      }
    } else {
      configEditDialogValue.value = "{}";
    }
  } catch (error: any) {
    console.error("获取套图详情失败:", error);
    ElMessage.error(error?.message || "获取详情失败");
    configEditDialogVisible.value = false;
  } finally {
    configEditDialogLoading.value = false;
  }
}

// 增强的JSON校验函数（用于编辑配置对话框）
function validateJsonEnhanced(jsonString: string): { valid: boolean; error?: string } {
  const trimmed = jsonString?.trim() || "";

  // 空值视为有效
  if (!trimmed) {
    return { valid: true };
  }

  // 检查是否以 { 或 [ 开头（基本结构检查）
  const firstChar = trimmed.charAt(0);
  const lastChar = trimmed.charAt(trimmed.length - 1);

  if (firstChar === "{" && lastChar !== "}") {
    return { valid: false, error: "JSON对象缺少闭合括号 }" };
  }

  if (firstChar === "[" && lastChar !== "]") {
    return { valid: false, error: "JSON数组缺少闭合括号 ]" };
  }

  // 尝试解析JSON
  try {
    const parsed = JSON.parse(trimmed);

    // 额外检查：确保解析后是对象或数组（不允许原始值）
    if (parsed !== null && typeof parsed !== "object" && !Array.isArray(parsed)) {
      return { valid: false, error: "配置必须是JSON对象或数组，不能是原始值" };
    }

    return { valid: true };
  } catch (e: any) {
    // 提供更友好的错误信息
    let errorMsg = "JSON格式错误";
    if (e.message) {
      if (e.message.includes("Unexpected token")) {
        errorMsg = `JSON语法错误：${e.message}`;
      } else if (e.message.includes("Unexpected end")) {
        errorMsg = "JSON不完整，请检查是否缺少引号、括号或逗号";
      } else if (e.message.includes("Unexpected string")) {
        errorMsg = "字符串格式错误，请检查引号是否匹配";
      } else {
        errorMsg = `JSON解析错误：${e.message}`;
      }
    }
    return { valid: false, error: errorMsg };
  }
}

// 实时校验JSON（用于编辑配置对话框）
function validateJsonRealtime(jsonString: string) {
  const result = validateJsonEnhanced(jsonString);
  configEditDialogError.value = result.error || "";
  return result.valid;
}

// 处理配置输入变化（带防抖）
function handleConfigInputChange() {
  // 清除之前的定时器
  if (configValidateTimer) {
    clearTimeout(configValidateTimer);
  }

  // 如果输入为空，清除错误信息
  if (!configEditDialogValue.value.trim()) {
    configEditDialogError.value = "";
    return;
  }

  // 防抖：500ms后执行校验
  configValidateTimer = setTimeout(() => {
    validateJsonRealtime(configEditDialogValue.value);
  }, 500);
}

// 取消编辑配置对话框
function handleCancelConfigEditDialog() {
  // 清理定时器
  if (configValidateTimer) {
    clearTimeout(configValidateTimer);
    configValidateTimer = null;
  }
  configEditDialogVisible.value = false;
  configEditDialogError.value = "";
  // 延迟清空数据，避免关闭动画时闪烁
  setTimeout(() => {
    configEditDialogData.value = null;
    configEditDialogValue.value = "";
  }, 300);
}

// 保存编辑配置对话框的配置信息
async function handleSaveConfigDialog() {
  const trimmedValue = configEditDialogValue.value?.trim() || "";

  // 验证JSON格式
  const validation = validateJsonEnhanced(trimmedValue);
  if (!validation.valid) {
    configEditDialogError.value = validation.error || "JSON格式错误";
    return;
  }

  if (!configEditDialogData.value?.id) {
    return ElMessage.warning("缺少ID，无法保存配置");
  }

  configEditDialogSaving.value = true;
  try {
    // 解析并格式化JSON
    let configValue: any = null;
    if (trimmedValue) {
      configValue = JSON.parse(trimmedValue);
    }

    // 调用更新API（使用新字段名 stickerPsdSetConfig）
    await stickerPsdSetApi.update(configEditDialogData.value.id, {
      stickerPsdSetConfig: configValue,
    });

    ElMessage.success("配置信息已保存");

    // 清理定时器
    if (configValidateTimer) {
      clearTimeout(configValidateTimer);
      configValidateTimer = null;
    }

    configEditDialogVisible.value = false;
    configEditDialogError.value = "";

    // 刷新列表以同步数据
    getList();

    // 延迟清空数据
    setTimeout(() => {
      configEditDialogData.value = null;
      configEditDialogValue.value = "";
    }, 300);
  } catch (error: any) {
    console.error("保存配置信息失败:", error);
    ElMessage.error(error?.message || "保存配置信息失败");
  } finally {
    configEditDialogSaving.value = false;
  }
}

function handleDelete(row) {
  ElMessageBox.confirm("确定删除该套图记录吗？", "删除确认", {
    confirmButtonText: "删除",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      await stickerPsdSetApi.remove(row.id);
      ElMessage.success("删除成功");
      getList();
    })
    .catch(() => { });
}

function handleBatchDelete() {
  if (!selectedIds.value.length) {
    return ElMessage.warning("请至少选择一条记录");
  }
  ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条记录吗？`, "批量删除", {
    confirmButtonText: "删除",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      await stickerPsdSetApi.removeBatch(selectedIds.value);
      ElMessage.success("批量删除成功");
      selectedIds.value = [];
      getList();
    })
    .catch(() => { });
}

async function handleBatchUpdateStatus(status: string) {
  if (!selectedIds.value.length) {
    return ElMessage.warning("请至少选择一条记录");
  }

  const statusLabel = statusOptions.find((s) => s.value === status)?.label || status;
  try {
    await ElMessageBox.confirm(
      `确定将选中的 ${selectedIds.value.length} 条记录的状态改为"${statusLabel}"吗？`,
      "批量修改状态",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info",
      },
    );
  } catch (e) {
    return;
  }

  batchUpdatingStatus.value = true;
  let successCount = 0;
  let failCount = 0;

  try {
    for (const id of selectedIds.value) {
      try {
        await stickerPsdSetApi.updateStatus(id, { status });
        applyManualPsdSetStatusLocally(id, status);
        successCount += 1;
      } catch (error) {
        failCount += 1;
        console.error(`批量更新状态失败（ID: ${id}）`, error);
      }
    }

    if (successCount) {
      ElMessage.success(`成功更新 ${successCount} 条记录的状态`);
    }
    if (failCount) {
      ElMessage.warning(`有 ${failCount} 条记录更新失败，请稍后重试`);
    }

    if (successCount > 0) {
      selectedIds.value = [];
      getList();
    }
  } finally {
    batchUpdatingStatus.value = false;
  }
}

async function handleBatchGenerateProduct() {
  if (!selectedIds.value.length) {
    return ElMessage.warning("请选择需要生成产品的记录");
  }
  await openGenerateProductDialog(selectedIds.value);
}

async function ensurePublishConfigOptions() {
  if (publishConfigDialogLoading.value || publishConfigOptions.value.length > 0) {
    return;
  }

  publishConfigDialogLoading.value = true;
  try {
    const res = await getPublishConfigListApi();
    const list = Array.isArray(res)
      ? res
      : Array.isArray((res as any)?.list)
        ? (res as any).list
        : [];
    publishConfigOptions.value = list.filter((item: any) => item?.isActive !== false);
  } catch (error: any) {
    console.error("加载任务配置失败:", error);
    ElMessage.error(error?.message || "加载任务配置失败");
  } finally {
    publishConfigDialogLoading.value = false;
  }
}

async function openPublishConfigDialog(ids: string[]) {
  const normalizedIds = Array.from(
    new Set((ids || []).map((item) => String(item).trim()).filter(Boolean)),
  );
  if (!normalizedIds.length) {
    return ElMessage.warning("请选择需要生成发布任务的套图");
  }

  const selectedRowMap = new Map<string, any>();
  selectedPsdSetRows.value.forEach((item) => {
    const id = normalizePsdSetId(item?.id);
    if (id) {
      selectedRowMap.set(id, item);
    }
  });
  dataSource.value.forEach((item) => {
    const id = normalizePsdSetId(item?.id);
    if (id && !selectedRowMap.has(id)) {
      selectedRowMap.set(id, item);
    }
  });

  publishConfigTargetIds.value = normalizedIds;
  publishConfigTargetRows.value = normalizedIds.map((id) => selectedRowMap.get(id) || { id });
  publishConfigSelectedIds.value = [];
  publishConfigSearchText.value = "";
  publishConfigCurrentPage.value = 1;
  publishConfigDialogVisible.value = true;
  await ensurePublishConfigOptions();
}

function handleClosePublishConfigDialog() {
  publishConfigDialogVisible.value = false;
  publishConfigSelectedIds.value = [];
  publishConfigTargetIds.value = [];
  publishConfigTargetRows.value = [];
  publishConfigSearchText.value = "";
  publishConfigCurrentPage.value = 1;
}

function handlePublishConfigCheckboxChange({ checked, row }) {
  if (checked && !isPublishConfigSelectable(row)) {
    ElMessage.warning(getPublishConfigMatchInfo(row).reason || "当前任务配置不可选");
    return;
  }
  if (checked) {
    if (!publishConfigSelectedIds.value.includes(row.id)) {
      publishConfigSelectedIds.value.push(row.id);
    }
  } else {
    publishConfigSelectedIds.value = publishConfigSelectedIds.value.filter((id) => id !== row.id);
  }
}

function handlePublishConfigCheckboxAllChange({ checked }) {
  const currentPageIds = publishConfigDataSource.value
    .filter((item: any) => isPublishConfigSelectable(item))
    .map((item: any) => item.id);
  if (checked) {
    currentPageIds.forEach((id: string) => {
      if (!publishConfigSelectedIds.value.includes(id)) {
        publishConfigSelectedIds.value.push(id);
      }
    });
  } else {
    publishConfigSelectedIds.value = publishConfigSelectedIds.value.filter(
      (id) => !currentPageIds.includes(id),
    );
  }
}

async function handleCreatePublishTask(row: any) {
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法生成发布任务");
  }
  await openPublishConfigDialog([row.id]);
}

async function handleBatchCreatePublishTask() {
  if (!selectedIds.value.length) {
    return ElMessage.warning("请选择需要生成发布任务的套图");
  }
  await openPublishConfigDialog(selectedIds.value);
}

async function handleSubmitCreatePublishTask() {
  if (!publishConfigTargetIds.value.length) {
    return ElMessage.warning("未选择套图");
  }
  if (!publishConfigSelectedIds.value.length) {
    return ElMessage.warning("请选择任务配置");
  }

  const invalidSelectedConfigs = publishConfigSelectedIds.value
    .map((id) => publishConfigOptions.value.find((item: any) => item.id === id))
    .filter((item) => item && !isPublishConfigSelectable(item));
  if (invalidSelectedConfigs.length) {
    const firstInvalid = invalidSelectedConfigs[0];
    publishConfigSelectedIds.value = publishConfigSelectedIds.value.filter((id) => {
      const config = publishConfigOptions.value.find((item: any) => item.id === id);
      return config && isPublishConfigSelectable(config);
    });
    return ElMessage.warning(
      getPublishConfigMatchInfo(firstInvalid).reason || "已选任务配置与当前套图模板不匹配",
    );
  }

  publishConfigSubmitting.value = true;
  let successCount = 0;
  let failCount = 0;

  try {
    for (const psdSetId of publishConfigTargetIds.value) {
      for (const publishConfigId of publishConfigSelectedIds.value) {
        try {
          const config = publishConfigOptions.value.find(
            (item: any) => item.id === publishConfigId,
          );
          const resolvedTaskType = String(
            config?.taskType || derivePublishTaskTypeByPlatform(config?.platform),
          ).trim();
          const resolvedPlatform = String(
            config?.platform || resolveTaskTypePlatform(resolvedTaskType),
          ).trim();
          if (!resolvedTaskType || !resolvedPlatform) {
            throw new Error("任务配置缺少任务类型或平台信息");
          }
          await createPublishTaskApi({
            psdSetId,
            taskType: resolvedTaskType,
            platform: resolvedPlatform,
            publishConfigId,
            description: `套图 ${psdSetId} -> ${config.name || resolvedTaskType || publishConfigId}`,
            metadata: {
              publishConfigId,
              publishConfigName: config?.name || "",
            },
          });
          successCount += 1;
        } catch (error) {
          failCount += 1;
          console.error(
            `生成发布任务失败（套图ID: ${psdSetId}, 配置ID: ${publishConfigId}）`,
            error,
          );
        }
      }
    }

    if (successCount > 0) {
      ElMessage.success(`成功创建 ${successCount} 个发布任务`);
      handleClosePublishConfigDialog();
    }
    if (failCount > 0) {
      ElMessage.warning(`有 ${failCount} 个发布任务创建失败`);
    }
  } finally {
    publishConfigSubmitting.value = false;
  }
}

async function handleViewPublishTasks(row: any) {
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法查看发布任务");
  }

  currentPublishTasksPsdSetId.value = String(row.id);
  publishTasksVisible.value = true;
  publishTasksLoading.value = true;
  publishTasks.value = [];

  try {
    const res = await stickerPsdSetApi.getPublishTasks(row.id);
    publishTasks.value = Array.isArray(res)
      ? res
      : Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];
  } catch (error: any) {
    console.error("获取发布任务失败:", error);
    ElMessage.error(error?.message || "获取发布任务失败");
    publishTasksVisible.value = false;
  } finally {
    publishTasksLoading.value = false;
  }
}

async function handleViewPublishUsageRecords(row: any) {
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法查看使用记录");
  }
  publishUsageDialogVisible.value = true;
  publishUsageLoading.value = true;
  publishUsageRecords.value = [];
  try {
    const res = await stickerPsdSetApi.getPublishUsageRecords({ psdSetId: row.id });
    publishUsageRecords.value = Array.isArray(res)
      ? res
      : Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];
  } catch (error: any) {
    console.error("获取使用记录失败:", error);
    ElMessage.error(error?.message || "获取使用记录失败");
    publishUsageDialogVisible.value = false;
  } finally {
    publishUsageLoading.value = false;
  }
}

async function loadPublishUsageConfigOptions() {
  try {
    const res = await stickerPsdSetApi.getPublishUsageConfigOptions();
    publishUsageConfigOptions.value = Array.isArray(res)
      ? res
      : Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];
  } catch (error) {
    console.error("获取查重配置选项失败:", error);
    publishUsageConfigOptions.value = [];
  }
}

async function reloadCurrentPublishTasks() {
  if (!currentPublishTasksPsdSetId.value) {
    return;
  }
  publishTasksLoading.value = true;
  try {
    const res = await stickerPsdSetApi.getPublishTasks(currentPublishTasksPsdSetId.value);
    publishTasks.value = Array.isArray(res)
      ? res
      : Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];
  } finally {
    publishTasksLoading.value = false;
  }
}

async function handleRegeneratePublishTask(row: any) {
  const taskId = String(row?.id || "").trim();
  if (!taskId) {
    return ElMessage.warning("缺少任务ID，无法重新生成");
  }

  await ElMessageBox.confirm(
    "将基于当前套图信息和任务配置，重新生成这条任务的发布数据。是否继续？",
    "重新生成发布数据",
    {
      type: "warning",
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    },
  );

  publishTasksLoading.value = true;
  try {
    await regeneratePublishTaskApi(taskId);
    ElMessage.success("已触发重新生成");
    await reloadCurrentPublishTasks();
  } catch (error: any) {
    console.error("重新生成发布数据失败:", error);
    ElMessage.error(error?.message || "重新生成发布数据失败");
    publishTasksLoading.value = false;
  }
}

async function ensureGenerateProductDialogOptions() {
  if (!generateProductPromptOptions.value.length) {
    const res = await getPromptList({
      currentPage: 1,
      pageSize: 1000,
    });
    generateProductPromptOptions.value = Array.isArray(res?.list) ? res.list : [];
  }
}

async function openGenerateProductDialog(ids: string[]) {
  const normalizedIds = Array.from(
    new Set((ids || []).map((item) => String(item).trim()).filter(Boolean)),
  );
  if (!normalizedIds.length) {
    return ElMessage.warning("请选择需要生成产品的套图");
  }

  generateProductTargetIds.value = normalizedIds;
  generateProductForm.promptId = null;
  generateProductDialogVisible.value = true;
  generateProductDialogLoading.value = true;

  try {
    await ensureGenerateProductDialogOptions();
  } catch (error: any) {
    console.error("加载生成产品配置失败:", error);
    ElMessage.error(error?.message || "加载配置失败");
  } finally {
    generateProductDialogLoading.value = false;
  }
}

function handleCloseGenerateProductDialog() {
  generateProductDialogVisible.value = false;
  generateProductTargetIds.value = [];
  generateProductForm.promptId = null;
  generatingProductId.value = "";
  batchGeneratingProducts.value = false;
}

async function handleSubmitGenerateProduct() {
  if (!generateProductTargetIds.value.length) {
    return ElMessage.warning("未选择套图");
  }

  generateProductSubmitting.value = true;
  let successCount = 0;
  let failCount = 0;

  try {
    for (const id of generateProductTargetIds.value) {
      try {
        await stickerPsdSetApi.generateProduct({
          id,
          promptId: generateProductForm.promptId,
        });
        successCount += 1;
      } catch (error) {
        failCount += 1;
        console.error(`生成产品失败（ID: ${id}）`, error);
      }
    }

    if (successCount) {
      ElMessage.success(`成功生成 ${successCount} 个产品`);
    }
    if (failCount) {
      ElMessage.warning(`有 ${failCount} 个产品生成失败，请稍后重试`);
    }

    if (successCount > 0) {
      handleCloseGenerateProductDialog();
      getList();
    }
  } finally {
    generateProductSubmitting.value = false;
    batchGeneratingProducts.value = false;
    if (!generateProductDialogVisible.value) {
      generatingProductId.value = "";
    }
  }
}

async function handleStartProduction(row: any) {
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法开始制作");
  }

  if (!isClientConnected.value) {
    return ElMessage.warning("客户端未连接，请先启动客户端");
  }

  if (websocketClient.state.status !== "connected") {
    return ElMessage.warning("WebSocket未连接，请稍后重试");
  }

  await openProductionDispatchDialog(row);
}

async function handleConfirmStartProduction() {
  const row = productionDispatchRow.value;
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法开始制作");
  }

  if (!selectedDispatchClientId.value) {
    return ElMessage.warning("请选择一个客户端节点");
  }

  if (!selectedDispatchClient.value) {
    return ElMessage.warning("所选客户端不存在，请刷新后重试");
  }

  if (!isDispatchClientExecutable(selectedDispatchClient.value)) {
    return ElMessage.warning("所选客户端当前不可执行，请重新选择");
  }

  try {
    await ElMessageBox.confirm(
      `确认由客户端 ${getClientDisplayName(selectedDispatchClient.value)} 开始制作该套图吗？`,
      "开始制作确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info",
      },
    );
  } catch (e) {
    return;
  }

  try {
    startingProductionId.value = row.id;
    const response = await stickerPsdSetApi.dispatch(row.id, {
      clientId: selectedDispatchClientId.value,
    });
    startingProductionId.value = "";
    productionDispatchDialogVisible.value = false;

    if (response?.success) {
      applyPsdSetRuntimeUpdate(row.id, {
        status: "processing",
        message: response.message || "任务已分配，等待客户端执行",
        progress: 0,
        assignedClientId:
          String(response?.data?.clientId || selectedDispatchClientId.value).trim() || null,
        assignedMachineCode: String(response?.data?.machineCode || "").trim() || null,
        schedulerStatus: "assigned",
      });
      schedulePsdSetMenuRuntimeSync();
      ElMessage.success(response.message || "制作任务已调度");
      await Promise.all([getList(), refreshClientNodes()]);
    } else {
      ElMessage.warning(response?.message || "开始制作失败");
    }
  } catch (error: any) {
    console.error("开始制作失败:", error);
    ElMessage.error(error?.message || "开始制作失败，请检查客户端连接状态");
    startingProductionId.value = "";
  }
}

async function handleResetAllPsAutomationRuntime() {
  try {
    await ElMessageBox.confirm(
      "确认重置当前账号所有客户端的 PS 自动化运行态吗？该操作只清理残留的忙碌状态、当前任务标记和进度，不会删除套图或制作结果。",
      "重置状态确认",
      {
        confirmButtonText: "重置",
        cancelButtonText: "取消",
        type: "warning",
      },
    );
  } catch {
    return;
  }

  resettingPsRuntime.value = true;
  try {
    const response = await resetAllPsAutomationRuntime();
    ElMessage.success(response?.message || "状态已重置");
    schedulePsdSetMenuRuntimeSync();
    await Promise.all([
      refreshClientNodes(),
      refreshPsdSetRuntimeSummary(),
      loadPsdSetSchedulerRuntime(),
    ]);
  } catch (error: any) {
    ElMessage.error(error?.message || "重置状态失败");
  } finally {
    resettingPsRuntime.value = false;
  }
}

// 监听客户端推送的制作状态（实时更新表格行）
const productionStatusHandler = (data: {
  psdSetId?: string;
  status: string;
  message?: string;
  progress?: number;
  total?: number;
  assignedClientId?: string | null;
  assignedMachineCode?: string | null;
}) => {
  try {
    const normalizedPsdSetId = normalizePsdSetId(data?.psdSetId);
    if (!normalizedPsdSetId) return;

    const rowIndex = findPsdSetRowIndexById(normalizedPsdSetId);
    const currentRecord = rowIndex >= 0 ? dataSource.value[rowIndex] : null;
    const incomingStatus = normalizePsdSetRuntimeStatus(data.status);
    const nextStatus =
      incomingStatus === "pending" &&
        (isPsdSetRuntimeActive(currentRecord) || isPsdSetActiveBySummary(normalizedPsdSetId))
        ? "processing"
        : incomingStatus;

    applyPsdSetRuntimeUpdate(normalizedPsdSetId, {
      status: nextStatus,
      message: data.message,
      progress: data.progress,
      total: data.total,
      assignedClientId: data.assignedClientId,
      assignedMachineCode: data.assignedMachineCode,
    });

    schedulePsdSetRuntimeRefresh(
      data.status === "completed" || data.status === "failed" ? 260 : 900,
    );
  } catch (e) {
    console.error("处理 production-status 事件失败", e);
  }
};

const psAutomationStatusHandler = (data: PsAutomationStatusEvent) => {
  try {
    const normalizedPsdSetId = normalizePsdSetId(data?.currentPsSetId);
    if (!normalizedPsdSetId) return;

    if (data.running) {
      applyPsdSetRuntimeUpdate(normalizedPsdSetId, {
        status: "processing",
        message: String(data.currentStep || "").trim() || "客户端处理中",
        progress: typeof data.progress === "number" ? data.progress : 0,
        assignedClientId: String(data.clientId || "").trim() || null,
        schedulerStatus: "running",
      });
      schedulePsdSetRuntimeRefresh(1200);
      return;
    }

    if (data.lastError) {
      applyPsdSetRuntimeUpdate(normalizedPsdSetId, {
        status: "failed",
        message: data.lastError,
        assignedClientId: String(data.clientId || "").trim() || null,
        schedulerStatus: "failed",
      });
      schedulePsdSetRuntimeRefresh(360);
    }
  } catch (e) {
    console.error("处理 ps-automation-status 事件失败", e);
  }
};

watch(
  hasActivePsdSetRuntime,
  (active) => {
    if (!active) {
      stopPsdSetActiveRuntimeRefresh();
      return;
    }

    void getList(true);
    void loadPsdSetSchedulerRuntime();
    if (detailDialogVisible.value && detailData.value?.id) {
      void loadPsdSetDetailById(detailData.value.id, true);
    }

    if (psdSetActiveRuntimeTimer) {
      return;
    }

    psdSetActiveRuntimeTimer = setInterval(() => {
      void getList(true);
      void loadPsdSetSchedulerRuntime();
      if (detailDialogVisible.value && detailData.value?.id) {
        void loadPsdSetDetailById(detailData.value.id, true);
      }
    }, 3000);
  },
  { immediate: true },
);

watch(
  () =>
    activePsdSets.value
      .map((item: any) =>
        [
          normalizePsdSetId(item?.id),
          String(item?.status || "").trim(),
          String(item?.schedulerStatus || "").trim(),
          String(item?.statusMessage || "").trim(),
          String(item?.currentStep || "").trim(),
          typeof item?.progress === "number" ? String(item.progress) : "",
          String(item?.updateTime || "").trim(),
        ].join(":"),
      )
      .join("|"),
  (fingerprint) => {
    if (!fingerprint) {
      clearAllPsdSetRuntimeOverlays();
      stopPsdSetActiveRuntimeRefresh();
      if (psdSetRuntimeReloadTimer) {
        clearTimeout(psdSetRuntimeReloadTimer);
        psdSetRuntimeReloadTimer = null;
      }
      void getList(true);
      void loadPsdSetSchedulerRuntime();
      return;
    }

    activePsdSets.value.forEach((item: any) => {
      if (!isPsdSetActiveBySummary(item?.id)) {
        return;
      }
      applyPsdSetRuntimeUpdate(item.id, buildPsdSetRuntimePayloadFromSummary(item));
    });
    void getList(true);
    void loadPsdSetSchedulerRuntime();
    if (detailDialogVisible.value && detailData.value?.id) {
      void loadPsdSetDetailById(detailData.value.id, true);
    }
  },
);

onMounted(() => {
  websocketClient.events.on("production-status", productionStatusHandler);
  websocketClient.events.on("psAutomationStatus", psAutomationStatusHandler);
  void Promise.all([
    refreshUserAutoSchedulingSetting(),
    loadPsdSetSchedulerRuntime(),
    loadPublishUsageConfigOptions(),
  ]);
  psdSetSchedulerRuntimeTimer = setInterval(() => {
    void loadPsdSetSchedulerRuntime();
  }, 10000);
});

onUnmounted(() => {
  websocketClient.events.off("production-status", productionStatusHandler);
  websocketClient.events.off("psAutomationStatus", psAutomationStatusHandler);
  stopPsdSetActiveRuntimeRefresh();
  if (psdSetMenuRuntimeSyncTimer) {
    clearTimeout(psdSetMenuRuntimeSyncTimer);
    psdSetMenuRuntimeSyncTimer = null;
  }
  if (psdSetRuntimeReloadTimer) {
    clearTimeout(psdSetRuntimeReloadTimer);
    psdSetRuntimeReloadTimer = null;
  }
  if (psdSetSchedulerRuntimeTimer) {
    clearInterval(psdSetSchedulerRuntimeTimer);
    psdSetSchedulerRuntimeTimer = null;
  }
});

getList();
</script>

<style scoped>
.psd-set-page {
  padding-top: 8px;
}

.psd-set-page__layout {
  gap: 10px;
  padding: 0;
}

.psd-set-page__layout :deep(.list-page-layout__main) {
  gap: 10px;
}

.psd-set-page__filter {
  gap: 10px;
}

.psd-set-page__actions {
  justify-content: flex-start;
  align-items: center;
}

.psd-set-page__auto-dispatch {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  min-height: 40px;
  padding: 10px 12px;
  margin-right: 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-fill-color-light);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.psd-set-page__auto-dispatch-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.psd-set-page__auto-dispatch-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.psd-set-page__auto-dispatch-runtime {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.4;
  flex-wrap: wrap;
}

.psd-set-page__auto-dispatch-runtime.is-success {
  color: #67c23a;
}

.psd-set-page__auto-dispatch-runtime.is-warning {
  color: #f97316;
}

.psd-set-page__auto-dispatch-runtime.is-danger {
  color: #f56c6c;
}

.psd-set-page__auto-dispatch-runtime.is-info {
  color: #909399;
}

.psd-set-page__auto-dispatch-runtime-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
  flex: 0 0 auto;
}

.psd-set-page__auto-dispatch-runtime.is-success .psd-set-page__auto-dispatch-runtime-dot {
  box-shadow: 0 0 0 0 rgb(103 194 58 / 24%);
  animation: status-breath-success 1.8s infinite ease-in-out;
}

.psd-set-page__auto-dispatch-runtime.is-warning .psd-set-page__auto-dispatch-runtime-dot {
  box-shadow: 0 0 0 0 rgb(249 115 22 / 22%);
  animation: status-breath-warning 1.8s infinite ease-in-out;
}

.psd-set-page__auto-dispatch-runtime-meta {
  color: var(--el-text-color-placeholder);
}

.psd-set-page__auto-dispatch-side {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.psd-set-page__auto-dispatch-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  background: var(--el-bg-color);
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.psd-set-page__auto-dispatch-status.is-success {
  border-color: rgb(103 194 58 / 24%);
  color: #67c23a;
}

.psd-set-page__auto-dispatch-status.is-info {
  border-color: rgb(144 147 153 / 24%);
  color: #909399;
}

.psd-set-page__auto-dispatch-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
}

.psd-set-page__auto-dispatch-status.is-success .psd-set-page__auto-dispatch-dot {
  box-shadow: 0 0 0 0 rgb(103 194 58 / 32%);
  animation: status-breath-success 1.8s infinite ease-in-out;
}

.psd-set-page__table-body {
  padding: 0;
}

.psd-set-page :deep(.list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

.psd-set-page :deep(.list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}

.psd-set-page :deep(.vxe-table--body tbody tr.is-publish-usage-occupied .vxe-body--column) {
  background: rgba(245, 158, 11, 0.1) !important;
}

.psd-set-page :deep(.vxe-table--body tbody tr.is-publish-usage-available .vxe-body--column) {
  background: rgba(34, 197, 94, 0.08) !important;
}

.psd-set-page :deep(.vxe-table--body tbody tr.is-publish-usage-occupied:hover .vxe-body--column) {
  background: rgba(245, 158, 11, 0.16) !important;
}

.psd-set-page :deep(.vxe-table--body tbody tr.is-publish-usage-available:hover .vxe-body--column) {
  background: rgba(34, 197, 94, 0.13) !important;
}

.psd-set-page :deep(.vxe-table--body tbody tr.has-publish-usage-badge .vxe-body--column:first-child) {
  position: relative;
  cursor: pointer;
}

.psd-set-page :deep(.vxe-table--body tbody tr.has-publish-usage-badge .vxe-body--column:first-child::before) {
  position: absolute;
  top: 2px;
  left: 2px;
  z-index: 4;
  height: 16px;
  padding: 0 5px;
  border-radius: 999px;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
  pointer-events: none;
}

.psd-set-page :deep(.vxe-table--body tbody tr.is-publish-usage-occupied .vxe-body--column:first-child::before) {
  content: "已用";
  background: rgba(217, 119, 6, 0.94);
}

.psd-set-page :deep(.vxe-table--body tbody tr.is-publish-usage-available .vxe-body--column:first-child::before) {
  content: "未用";
  background: rgba(22, 163, 74, 0.94);
}

.status-message {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.status-cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
  width: 100%;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}

.pagination-container :deep(.el-pagination) {
  font-size: 14px;
}

/* 详情列样式 */
.details-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.related-info-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.detail-section-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.detail-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.psd-set-detail-dialog :deep(.el-dialog__body) {
  box-sizing: border-box;
  height: calc(100vh - 78px);
  padding: 0 22px 22px;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.psd-set-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding-right: 28px;
}

.psd-set-detail-heading {
  min-width: 0;
}

.psd-set-detail-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.psd-set-detail-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.psd-set-detail-header__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.psd-set-detail-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow-y: auto;
  padding-right: 4px;
}

.psd-set-detail-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 0.42fr);
  gap: 12px;
  align-items: start;
}

.psd-set-detail-middle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
}

.psd-set-detail-bottom {
  display: block;
}

.psd-set-detail-panel {
  padding: 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.psd-set-detail-panel--hero {
  padding: 16px;
}

.psd-set-detail-panel--compact,
.psd-set-detail-panel--muted {
  padding: 12px;
}

.psd-set-detail-panel--balanced {
  display: flex;
  flex-direction: column;
  min-height: 420px;
}

.psd-set-detail-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.psd-set-detail-summary__item,
.psd-set-detail-text-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--el-fill-color-extra-light);
}

.psd-set-detail-text-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-top: 10px;
}

.psd-set-detail-image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px;
}

.psd-set-detail-image-card {
  position: relative;
  padding: 6px;
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-light);
  min-width: 0;
}

.psd-set-detail-image {
  width: 100%;
  height: 190px;
  border-radius: 6px;
  background: var(--el-bg-color-page);
}

.psd-set-detail-image-index {
  position: absolute;
  top: 10px;
  right: 10px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 22px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.psd-set-detail-side-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.psd-set-detail-template-image {
  width: 100%;
  height: 190px;
  border-radius: 6px;
  background: var(--el-bg-color-page);
}

.psd-set-detail-meta-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.psd-set-detail-meta-list--inline {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 10px;
}

.psd-set-detail-meta-list>div {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--el-fill-color-extra-light);
  min-width: 0;
}

.detail-sticker-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
  flex: 1;
  align-content: start;
}

.detail-info-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  background: var(--el-fill-color-lighter);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.detail-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.45;
}

.info-value--muted {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.detail-sticker-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.detail-sticker-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.detail-sticker-name,
.detail-sticker-desc,
.detail-sticker-keywords {
  word-break: break-word;
}

.detail-sticker-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.detail-sticker-desc,
.detail-sticker-keywords,
.detail-sticker-path {
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

.detail-sticker-id {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
  font-family: "Courier New", Consolas, monospace;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;
}

.detail-sticker-id.cursor-pointer {
  cursor: pointer;
  user-select: none;
}

.detail-sticker-id.cursor-pointer:hover {
  color: var(--el-color-primary);
}

.detail-sticker-id .copy-icon {
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.detail-sticker-id.cursor-pointer:hover .copy-icon {
  opacity: 1;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 10px;
}

.detail-label {
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

.detail-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.detail-sub-grid {
  width: 100%;
  margin: 0;
  padding: 0;
  background: none;
}

.detail-sub-grid :deep(.vxe-table) {
  font-size: 12px;
}

.detail-sub-grid :deep(.vxe-table--header) {
  background-color: var(--el-table-header-bg-color);
}

.detail-sub-grid :deep(.vxe-table--body) {
  background-color: transparent;
}

.detail-sub-grid :deep(.vxe-cell) {
  padding: 4px 8px;
}

.detail-sub-grid :deep(.vxe-table--header-wrapper) {
  .vxe-cell {
    font-weight: 500;
    font-size: 12px;
  }
}

.detail-thumb-image {
  width: 78px;
  height: 78px;
  object-fit: contain;
  flex: 0 0 auto;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--el-border-color-light);
  transition: all 0.2s ease;
  background-color: var(--el-bg-color-page);
}

.detail-thumb-image:hover {
  border-color: var(--el-color-primary);
}

.detail-thumb-image--template {
  width: 96px;
  height: 96px;
}

.detail-template-card--unified {
  align-items: flex-start;
  padding: 8px;
  border-color: var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.psd-set-detail-runtime-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.psd-set-detail-runtime-strip>div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-radius: 6px;
  background: var(--el-fill-color-extra-light);
}

.psd-set-detail-runtime-note {
  margin-bottom: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--el-color-warning-light-9);
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}

.psd-set-detail-json-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.psd-set-detail-json-block {
  min-width: 0;
}

.psd-set-detail-json-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 1100px) {
  .psd-set-detail-dialog :deep(.el-dialog__body) {
    height: auto;
    min-height: calc(100vh - 78px);
  }

  .psd-set-detail-layout,
  .psd-set-detail-top,
  .psd-set-detail-middle,
  .psd-set-detail-bottom {
    grid-template-columns: 1fr;
    height: auto;
  }

  .psd-set-detail-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .psd-set-detail-header__tags {
    justify-content: flex-start;
  }

  .psd-set-detail-meta-list--inline {
    grid-template-columns: 1fr;
  }
}

.detail-template-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.detail-template-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.detail-template-paths {
  font-size: 12px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.template-file-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  justify-content: flex-start;
  padding: 4px 0;
  min-width: 120px;
}

/* 素材关联标签样式 */
.material-association-tag {
  font-weight: 500;
  min-width: 70px;
  text-align: center;
}

.material-association-tag .tag-text {
  display: inline-block;
}

/* 配置信息相关样式 */
.config-editor-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-textarea :deep(.el-textarea__inner) {
  font-family: "Courier New", Consolas, monospace;
  font-size: 13px;
  line-height: 1.5;
}

.config-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: 4px;
  color: var(--el-color-danger);
  font-size: 12px;
}

.config-success {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-7);
  border-radius: 4px;
  color: var(--el-color-success);
  font-size: 12px;
}

.config-preview-container {
  padding: 10px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  overflow: auto;
}

.config-preview {
  margin: 0;
  font-family: "Courier New", Consolas, monospace;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.config-display {
  padding: 8px 0;
}

/* 编辑配置对话框相关样式 */
.config-edit-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-edit-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.config-edit-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.config-edit-info-label {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  min-width: 80px;
}

.config-edit-info-value {
  color: var(--el-text-color-regular);
  flex: 1;
}

/* 查看配置对话框相关样式 */
.config-view-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-view-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.config-view-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.config-view-info-label {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  min-width: 80px;
}

.config-view-info-value {
  color: var(--el-text-color-regular);
  flex: 1;
}

.config-view-container {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  max-height: 500px;
  overflow: auto;
}

.config-view-content {
  margin: 0;
  font-family: "Courier New", Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.config-view-empty {
  padding: 40px;
  text-align: center;
  font-size: 14px;
}

.generate-product-dialog-body {
  min-height: calc(100vh - 140px);
  padding: 8px 0 24px;
}

.publish-config-dialog-body {
  display: flex;
  min-height: calc(100vh - 140px);
  overflow: hidden;
}

.generate-product-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.generate-product-dialog-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.generate-product-dialog-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.generate-product-panel {}

.generate-product-panel--wide {
  width: 100%;
}

.publish-config-panel-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%;
}

.publish-config-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.publish-config-toolbar__stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.publish-config-template-alert {
  flex: 1 1 360px;
  min-width: 280px;
}

.publish-config-stat-card {
  min-width: 132px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.publish-config-stat-card__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.publish-config-stat-card__value {
  margin-top: 8px;
  font-size: 22px;
  line-height: 1;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.publish-config-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.publish-config-search {
  width: 320px;
}

.publish-config-grid-wrap {
  flex: 1;
  min-height: 0;
}

.publish-config-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.publish-config-tip {
  margin-top: 0;
}

.generate-product-panel-title {
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.generate-product-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.generate-product-option-id,
.generate-product-option-meta {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.generate-product-tip {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.generate-product-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
}

.publish-task-list-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: calc(100vh - 150px);
  min-height: 0;
  overflow: hidden;
}

.publish-task-list-dialog :deep(.el-dialog__body) {
  box-sizing: border-box;
  height: calc(100vh - 78px);
  overflow: hidden;
}

.publish-task-list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.publish-task-list-toolbar__stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.publish-task-list-grid {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.publish-task-error {
  color: var(--el-color-danger);
}

.production-dispatch-dialog__body {
  display: flex;
  flex-direction: column;
  min-height: 204px;
}

.production-dispatch-dialog__panel {
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 62%, transparent 38%);
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-fill-color-light) 6%);
  min-height: 206px;
}

.production-dispatch-dialog__panel-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.production-dispatch-dialog__panel-title {
  margin-bottom: 10px;
}

.production-dispatch-dialog__empty {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.production-dispatch-dialog__table {
  overflow: hidden;
}

.production-dispatch-dialog__table :deep(.el-table) {
  --el-table-row-hover-bg-color: transparent;
  --el-table-current-row-bg-color: transparent;
  font-size: 12px;
}

.production-dispatch-dialog__table :deep(.el-table td),
.production-dispatch-dialog__table :deep(.el-table th) {
  padding-top: 7px;
  padding-bottom: 7px;
}

.production-dispatch-dialog__table :deep(.el-table .cell) {
  padding-left: 8px;
  padding-right: 8px;
  line-height: 1.35;
}

.production-dispatch-dialog__table :deep(.el-table__row) {
  cursor: pointer;
}

.production-dispatch-dialog__table :deep(.el-table__row.is-disabled) {
  cursor: not-allowed;
}

.production-dispatch-dialog__table :deep(.el-table__row.is-disabled td) {
  color: var(--el-text-color-placeholder);
}

.production-dispatch-dialog__table :deep(.el-radio) {
  pointer-events: none;
}

.production-dispatch-dialog__state-text {
  font-weight: 600;
  font-size: 11px;
  line-height: 1.2;
}

.production-dispatch-dialog__state-text.is-success {
  color: #1f8f46;
}

.production-dispatch-dialog__state-text.is-warning {
  color: #b26a00;
}

.production-dispatch-dialog__state-text.is-danger {
  color: #d5485a;
}

.production-dispatch-dialog__state-text.is-info {
  color: #356dd1;
}

.production-dispatch-dialog__state-text.is-muted {
  color: var(--el-text-color-secondary);
}

.production-dispatch-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
}

.publish-usage-image {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.publish-usage-config-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

@media (max-width: 768px) {
  .psd-set-page__auto-dispatch {
    width: 100%;
    align-items: flex-start;
  }

  .psd-set-page__auto-dispatch-side {
    width: 100%;
    justify-content: flex-start;
  }

  .production-dispatch-dialog__table :deep(.el-table) {
    font-size: 12px;
  }

  .publish-task-list-dialog :deep(.el-dialog__body) {
    height: auto;
    min-height: calc(100vh - 78px);
  }

  .publish-task-list-body {
    height: auto;
    min-height: calc(100vh - 200px);
  }

  .publish-config-search {
    width: 100%;
  }

  .publish-config-toolbar__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
