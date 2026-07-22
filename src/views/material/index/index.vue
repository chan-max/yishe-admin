<template>
  <ContentWrap :plain="true">
    <el-tabs v-model="materialViewMode" class="material-view-mode-tabs" style="margin-bottom: 8px;">
      <el-tab-pane label="单图列表" name="single" />
      <el-tab-pane label="按组查看" name="group" />
    </el-tabs>

    <ImageGroupView
      v-if="materialViewMode === 'group'"
      @add-stickers="handleGroupAddStickers"
    />

    <ListPageLayout
      v-else
      class="material-index-page"
      :sidebar-width="folderTreeCollapsed ? '28px' : '280px'"
    >
      <template #filter>
        <div v-if="!isMobile" class="list-page-filter list-page-filter--flat material-index-filter">
          <el-form
            :model="queryParams"
            label-position="top"
            class="list-page-search-form material-index-search-form"
          >
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col
                class="list-page-search-form__col--wide"
                :xs="24"
                :sm="12"
                :md="12"
                :lg="6"
                :xl="6"
              >
                <el-form-item label="搜索">
                  <el-input
                    v-model="queryParams.searchText"
                    size="small"
                    placeholder="名称、描述、关键词"
                    clearable
                    @change="
                      (val) => {
                        if (!val) getList();
                      }
                    "
                    @keyup.enter="getList"
                  />
                </el-form-item>
              </el-col>

              <el-col
                class="list-page-search-form__col--narrow"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="4"
                :xl="3"
              >
                <el-form-item label="排序">
                  <el-select
                    v-model="queryParams.sortingFields"
                    size="small"
                    placeholder="排序"
                    @change="getList"
                  >
                    <el-option label="创建时间倒序" value="createTime DESC" />
                    <el-option label="创建时间正序" value="createTime ASC" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col
                class="list-page-search-form__col--wide"
                :xs="24"
                :sm="12"
                :md="12"
                :lg="5"
                :xl="4"
              >
                <el-form-item label="后缀">
                  <el-select
                    v-model="queryParams.suffix"
                    size="small"
                    placeholder="后缀"
                    multiple
                    clearable
                    collapse-tags
                    collapse-tags-tooltip
                    @change="getList"
                  >
                    <el-option label="jpg" value="jpg" />
                    <el-option label="jpeg" value="jpeg" />
                    <el-option label="png" value="png" />
                    <el-option label="gif" value="gif" />
                    <el-option label="webp" value="webp" />
                    <el-option label="svg" value="svg" />
                    <el-option label="bmp" value="bmp" />
                    <el-option label="tiff" value="tiff" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col
                class="list-page-search-form__col--narrow"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="3"
                :xl="2"
              >
                <el-form-item label="ID">
                  <el-input
                    v-model="queryParams.id"
                    size="small"
                    placeholder="ID"
                    clearable
                    @change="
                      (val) => {
                        if (!val) getList();
                      }
                    "
                  />
                </el-form-item>
              </el-col>

              <el-col
                class="list-page-search-form__col--narrow"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="3"
                :xl="3"
              >
                <el-form-item label="自定义">
                  <el-select
                    v-model="queryParams.isCustom"
                    size="small"
                    placeholder="自定义"
                    clearable
                    @change="getList"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="是" :value="true" />
                    <el-option label="否" :value="false" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col
                class="list-page-search-form__col--narrow"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="3"
                :xl="3"
              >
                <el-form-item label="侵权">
                  <el-select
                    v-model="queryParams.isInfringement"
                    size="small"
                    placeholder="侵权"
                    clearable
                    @change="getList"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="侵权" :value="true" />
                    <el-option label="非侵权" :value="false" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col
                class="list-page-search-form__col--narrow"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="3"
                :xl="3"
              >
                <el-form-item label="抠图">
                  <el-select
                    v-model="queryParams.isCutout"
                    size="small"
                    placeholder="抠图"
                    clearable
                    @change="getList"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="是" :value="true" />
                    <el-option label="否" :value="false" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col
                class="list-page-search-form__col--narrow"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="3"
                :xl="3"
              >
                <el-form-item label="无缝">
                  <el-select
                    v-model="queryParams.seamless"
                    size="small"
                    placeholder="无缝"
                    clearable
                    @change="getList"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="是" :value="true" />
                    <el-option label="否" :value="false" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col
                class="list-page-search-form__col--wide"
                :xs="24"
                :sm="12"
                :md="12"
                :lg="7"
                :xl="6"
              >
                <el-form-item label="尺寸">
                  <el-select
                    v-model="queryParams.sizeShape"
                    size="small"
                    placeholder="尺寸形状"
                    clearable
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    @change="getList"
                    :teleported="false"
                  >
                    <el-option-group label="正方形">
                      <el-option
                        v-for="config in sizeShapeGroups.square"
                        :key="config.key"
                        :value="config.key"
                        :label="getFullLabel(config)"
                      >
                        <div class="size-option">
                          <div
                            class="size-thumb"
                            :class="`${config.key}-thumb`"
                            :style="{
                              width: `${config.thumbWidth}px`,
                              height: `${config.thumbHeight}px`,
                            }"
                          ></div>
                          <span class="size-label">{{ config.label }} ({{ config.ratio }})</span>
                          <span class="size-key">[{{ config.key }}]</span>
                        </div>
                      </el-option>
                    </el-option-group>
                    <el-option-group label="横图 (宽>高)">
                      <el-option
                        v-for="config in sizeShapeGroups.landscape"
                        :key="config.key"
                        :value="config.key"
                        :label="getFullLabel(config)"
                      >
                        <div class="size-option">
                          <div
                            class="size-thumb"
                            :class="`${config.key}-thumb`"
                            :style="{
                              width: `${config.thumbWidth}px`,
                              height: `${config.thumbHeight}px`,
                            }"
                          ></div>
                          <span class="size-label">{{ config.label }} ({{ config.ratio }})</span>
                          <span class="size-key">[{{ config.key }}]</span>
                        </div>
                      </el-option>
                    </el-option-group>
                    <el-option-group label="竖图 (高>宽)">
                      <el-option
                        v-for="config in sizeShapeGroups.portrait"
                        :key="config.key"
                        :value="config.key"
                        :label="getFullLabel(config)"
                      >
                        <div class="size-option">
                          <div
                            class="size-thumb"
                            :class="`${config.key}-thumb`"
                            :style="{
                              width: `${config.thumbWidth}px`,
                              height: `${config.thumbHeight}px`,
                            }"
                          ></div>
                          <span class="size-label">{{ config.label }} ({{ config.ratio }})</span>
                          <span class="size-key">[{{ config.key }}]</span>
                        </div>
                      </el-option>
                    </el-option-group>
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col
                class="list-page-search-form__col--narrow"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="2"
                :xl="2"
              >
                <el-form-item label="随机">
                  <div class="material-index-search-form__switch">
                    <el-switch v-model="queryParams.random" size="small" @change="getList" />
                  </div>
                </el-form-item>
              </el-col>

              <el-col
                class="list-page-search-form__col--wide"
                :xs="24"
                :sm="12"
                :md="12"
                :lg="5"
                :xl="5"
              >
                <el-form-item label="时间">
                  <DateRangePicker
                    @change="
                      (val) => {
                        queryParams.startTime = val.start;
                        queryParams.endTime = val.end;
                        getList();
                      }
                    "
                  />
                </el-form-item>
              </el-col>

              <el-col
                v-if="!phashSearchDisabled"
                class="list-page-search-form__col--full"
                :xs="24"
                :sm="24"
                :md="24"
                :lg="24"
                :xl="24"
              >
                <el-form-item label="相似搜索">
                  <div class="material-index-phash">
                    <div class="material-index-phash__row">
                      <el-input
                        v-model="queryParams.phash"
                        size="small"
                        placeholder="输入 phash 或图片地址"
                        clearable
                        @blur="onPhashInputBlur"
                      />
                      <div class="material-index-phash__modes">
                        <el-check-tag
                          :checked="queryParams.phashMode === 'range'"
                          @change="() => (queryParams.phashMode = 'range')"
                        >
                          相似匹配
                        </el-check-tag>
                        <el-tooltip
                          content="只找 phash 完全一致，速度最快，需已有 phash。"
                          placement="top"
                        >
                          <el-check-tag
                            :checked="queryParams.phashMode === 'exact'"
                            @change="() => (queryParams.phashMode = 'exact')"
                          >
                            精确匹配
                          </el-check-tag>
                        </el-tooltip>
                      </div>
                      <div class="material-index-phash__actions">
                        <el-button size="small" type="primary" @click="handlePhashSearch"
                          >搜索相似图片</el-button
                        >
                        <el-button size="small" @click="clearPhashSearch">清空</el-button>
                      </div>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
              <el-col
                class="list-page-search-form__col--wide"
                :xs="24"
                :sm="12"
                :md="12"
                :lg="6"
                :xl="6"
              >
                <el-form-item label="查重配置">
                  <div class="flex items-center gap-2" style="min-width: 0">
                    <el-select
                      v-model="queryParams.publishUsageConfigId"
                      size="small"
                      placeholder="选择后标记已用图片"
                      clearable
                      filterable
                      multiple
                      style="min-width: 200px"
                      @change="handlePublishUsageViewChange"
                    >
                      <el-option
                        v-for="item in publishUsageConfigOptions"
                        :key="item.id"
                        :label="formatPublishUsageConfigLabel(item)"
                        :value="item.id"
                      />
                    </el-select>
                    <el-button size="small" @click="toggleSelectAll">
                      {{ isAllSelected ? "取消全选" : "全选" }}
                    </el-button>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions material-index-search-form__actions">
              <el-button
                size="small"
                type="primary"
                :icon="Search"
                :loading="loading"
                @click="getList"
              >
                搜索
              </el-button>
              <el-button
                size="small"
                type="success"
                plain
                :icon="Picture"
                :loading="similarImageSubmitting"
                @click="openSimilarImageDialog()"
              >
                模糊搜索
              </el-button>
              <el-button
                size="small"
                type="primary"
                @click="
                  () => {
                    uploadModalVisible = true;
                  }
                "
              >
                上传
              </el-button>
              <el-button
                v-if="isAdmin"
                size="small"
                @click="
                  () => {
                    urlUploadModalVisible = true;
                  }
                "
              >
                URL上传
              </el-button>
              <el-button size="small" @click="handleMultiDownload">
                下载 ({{ ids.length }})
              </el-button>
              <el-button
                size="small"
                type="success"
                :disabled="loading || !ids.length"
                @click="() => openStickerUserTransferDialog('copy')"
              >
                分享给用户({{ ids.length }})
              </el-button>
              <el-button
                size="small"
                type="warning"
                :disabled="loading || !ids.length"
                @click="() => openStickerUserTransferDialog('move')"
              >
                转移给用户({{ ids.length }})
              </el-button>
              <el-button
                size="small"
                type="primary"
                plain
                :disabled="loading || !ids.length"
                @click="() => openPsdSetDialog(false)"
              >
                制作PS套图({{ ids.length }})
              </el-button>
              <el-button
                size="small"
                type="warning"
                plain
                :disabled="loading || !ids.length"
                @click="() => openPsdSetDialog(true)"
              >
                多图套图({{ ids.length }})
              </el-button>
              <el-button
                size="small"
                type="success"
                plain
                :disabled="loading || !ids.length"
                @click="openMaterialPublishConfigDialog"
              >
                选择发布配置({{ ids.length }})
              </el-button>
              <el-button
                size="small"
                type="primary"
                plain
                :icon="MagicStick"
                :disabled="loading || !ids.length"
                @click="openMaterialProductConfigDialog"
              >
                生成独立站商品({{ ids.length }})
              </el-button>
              <el-button
                size="small"
                type="success"
                plain
                :disabled="loading || !ids.length"
                @click="openBatchAddToGroupDialog"
              >
                添加到组图({{ ids.length }})
              </el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                :loading="deleteLoading"
                :disabled="loading || !ids.length"
                @click="handleDelete(null)"
              >
                批量删除({{ ids.length }})
              </el-button>
            </div>
          </el-form>
        </div>
        <div v-else class="material-index-mobile-filter">
          <el-button size="small" type="primary" @click="filterDialogVisible = true"
            >筛选</el-button
          >
        </div>
        <div v-if="similarImageSearchStatusVisible" class="similar-image-search-status">
          <div v-if="similarImageActiveSourceType === 'text'" class="similar-image-search-status__thumb similar-image-search-status__thumb--text">
            <el-icon :size="18" color="#67c23a"><Search /></el-icon>
          </div>
          <div v-else class="similar-image-search-status__thumb">
            <img :src="similarImageActivePreviewUrl" alt="相似图查询图片" />
          </div>
          <div class="similar-image-search-status__content">
            <div class="similar-image-search-status__line">
              <el-tag size="small" type="success" effect="plain">
                {{ similarImageActiveSourceType === 'text' ? '文字搜索' : '相似图' }}
              </el-tag>
              <span class="similar-image-search-status__source">
                {{ similarImageActiveSourceText }}
              </span>
              <span v-if="similarImageSearchMeta" class="similar-image-search-status__meta">
                （耗时: {{ similarImageSearchMeta.searchTimeMs }}ms | 最匹配: {{ similarImageSearchMeta.scoreRange?.max ? (similarImageSearchMeta.scoreRange.max * 100).toFixed(1) + '%' : '-' }}）
              </span>
            </div>
          </div>
          <div class="similar-image-search-status__actions">
            <el-button size="small" text type="primary" @click="openSimilarImageDialog()">
              {{ similarImageActiveSourceType === 'text' ? '重新搜索' : '更换图片' }}
            </el-button>
            <el-button size="small" text @click="clearSimilarImageSearchResults">
              清除
            </el-button>
          </div>
        </div>
        <el-dialog v-model="filterDialogVisible" title="筛选" width="90%" align-center>
          <el-form :model="queryParams" label-width="80px">
            <el-form-item label="搜索">
              <el-input
                v-model="queryParams.searchText"
                placeholder="请输入名称、描述或关键词（空格分隔，支持引号精确匹配）"
                clearable
              />
            </el-form-item>
            <el-form-item label="排序">
              <el-select v-model="queryParams.sortingFields" placeholder="请选择排序方式">
                <el-option label="创建时间倒序" value="createTime DESC" />
                <el-option label="创建时间正序" value="createTime ASC" />
              </el-select>
            </el-form-item>
            <el-form-item label="自定义贴纸">
              <el-select v-model="queryParams.isCustom" placeholder="请选择类型">
                <el-option label="全部" value="" />
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
            <el-form-item label="侵权状态">
              <el-select v-model="queryParams.isInfringement" placeholder="请选择状态">
                <el-option label="全部" value="" />
                <el-option label="侵权" :value="true" />
                <el-option label="非侵权" :value="false" />
              </el-select>
            </el-form-item>
            <el-form-item label="抠图素材">
              <el-select v-model="queryParams.isCutout" placeholder="请选择类型">
                <el-option label="全部" value="" />
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
            <el-form-item label="无缝贴图">
              <el-select v-model="queryParams.seamless" placeholder="请选择类型">
                <el-option label="全部" value="" />
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
            <el-form-item label="尺寸形状">
              <el-select
                v-model="queryParams.sizeShape"
                placeholder="请选择尺寸形状"
                clearable
                multiple
              >
                <el-option-group label="常用">
                  <el-option value="landscape" label="横图">
                    <div class="size-option">
                      <div class="size-thumb landscape-thumb"></div>
                      <span class="size-label">横图</span>
                    </div>
                  </el-option>
                  <el-option value="portrait" label="竖图">
                    <div class="size-option">
                      <div class="size-thumb portrait-thumb"></div>
                      <span class="size-label">竖图</span>
                    </div>
                  </el-option>
                  <el-option value="square" label="正方图">
                    <div class="size-option">
                      <div class="size-thumb square-thumb"></div>
                      <span class="size-label">正方图</span>
                    </div>
                  </el-option>
                </el-option-group>
                <el-option-group label="横图细分">
                  <el-option value="ultra-wide" label="超宽图 (≥2:1)">
                    <div class="size-option">
                      <div class="size-thumb ultra-wide-thumb"></div>
                      <span class="size-label">超宽图 (≥2:1)</span>
                    </div>
                  </el-option>
                  <el-option value="wide" label="宽图 (1.5:1 - 2:1)">
                    <div class="size-option">
                      <div class="size-thumb wide-thumb"></div>
                      <span class="size-label">宽图 (1.5:1 - 2:1)</span>
                    </div>
                  </el-option>
                  <el-option value="slightly-wide" label="微宽图 (1.1:1 - 1.5:1)">
                    <div class="size-option">
                      <div class="size-thumb slightly-wide-thumb"></div>
                      <span class="size-label">微宽图 (1.1:1 - 1.5:1)</span>
                    </div>
                  </el-option>
                </el-option-group>
                <el-option-group label="竖图细分">
                  <el-option value="slightly-long" label="微长图 (1:1.1 - 1:1.5)">
                    <div class="size-option">
                      <div class="size-thumb slightly-long-thumb"></div>
                      <span class="size-label">微长图 (1:1.1 - 1:1.5)</span>
                    </div>
                  </el-option>
                  <el-option value="long" label="长图 (1:1.5 - 1:2)">
                    <div class="size-option">
                      <div class="size-thumb long-thumb"></div>
                      <span class="size-label">长图 (1:1.5 - 1:2)</span>
                    </div>
                  </el-option>
                  <el-option value="ultra-long" label="超长图 (≤1:2)">
                    <div class="size-option">
                      <div class="size-thumb ultra-long-thumb"></div>
                      <span class="size-label">超长图 (≤1:2)</span>
                    </div>
                  </el-option>
                </el-option-group>
              </el-select>
            </el-form-item>
            <el-form-item label="后缀">
              <el-select v-model="queryParams.suffix" placeholder="请选择后缀" multiple clearable>
                <el-option label="jpg" value="jpg" />
                <el-option label="jpeg" value="jpeg" />
                <el-option label="png" value="png" />
                <el-option label="gif" value="gif" />
                <el-option label="webp" value="webp" />
                <el-option label="svg" value="svg" />
                <el-option label="bmp" value="bmp" />
                <el-option label="tiff" value="tiff" />
              </el-select>
            </el-form-item>
            <el-form-item label="查重配置">
              <div class="flex items-center gap-2">
                <el-select
                  v-model="queryParams.publishUsageConfigId"
                  placeholder="选择后标记已用图片"
                  clearable
                  filterable
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  style="min-width: 200px"
                >
                  <el-option
                    v-for="item in publishUsageConfigOptions"
                    :key="item.id"
                    :label="formatPublishUsageConfigLabel(item)"
                    :value="item.id"
                  />
                </el-select>
                <el-button size="small" @click="toggleSelectAll">
                  {{ isAllSelected ? "取消全选" : "全选" }}
                </el-button>
              </div>
            </el-form-item>
            <el-form-item label="随机顺序">
              <el-switch v-model="queryParams.random" active-text="随机" inactive-text="默认" />
            </el-form-item>
            <el-form-item label="按时间查询">
              <DateRangePicker
                @change="
                  (val) => {
                    queryParams.startTime = val.start;
                    queryParams.endTime = val.end;
                  }
                "
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="filterDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="onMobileFilterSubmit">确定</el-button>
          </template>
        </el-dialog>
        <!-- PC 顶部筛选栅格布局样式 -->
        <!--（放在这里是为了避免全局影响，保持只作用于本页） -->

        <el-dialog
          v-model="materialPublishConfigDialogVisible"
          fullscreen
          align-center
          :destroy-on-close="false"
          class="material-publish-config-dialog"
          @close="handleCloseMaterialPublishConfigDialog"
        >
          <template #header>
            <div class="material-publish-config-dialog__header">
              <div class="material-publish-config-dialog__header-main">
                <div class="material-publish-config-dialog__header-title">选择发布配置</div>
              </div>

              <div class="material-publish-config-dialog__header-chips">
                <span class="material-publish-config-dialog__header-chip">
                  素材 {{ selectedMaterialsForPublishConfig.length }} 张
                </span>
                <span class="material-publish-config-dialog__header-chip">
                  可用配置 {{ materialPublishConfigUsableCount }} 个
                </span>
              </div>
            </div>
          </template>

          <div
            v-loading="materialPublishConfigLoading"
            class="material-publish-config-dialog__body"
          >
            <div
              class="material-publish-config-dialog__panel material-publish-config-dialog__panel--materials"
            >
              <div class="material-publish-config-dialog__section-head">
                <div>
                  <div class="material-publish-config-dialog__section-eyebrow">步骤 1</div>
                  <div class="material-publish-config-dialog__section-title">已选图片</div>
                  <div class="material-publish-config-dialog__section-desc">
                    当前共 {{ selectedMaterialsForPublishConfig.length }} 张素材，可先确认格式与尺寸信息
                  </div>
                </div>
                <div class="material-publish-config-dialog__tag-list">
                  <el-tag
                    :type="hasInvalidFormatMaterials ? 'warning' : 'success'"
                    effect="plain"
                  >
                    {{
                      hasInvalidFormatMaterials
                        ? `${invalidFormatMaterialsList.length} 张格式需处理`
                        : "格式检查通过"
                    }}
                  </el-tag>
                  <el-tag type="info" effect="plain">
                    允许格式：{{ psdSetAllowedFormats.join("、") }}
                  </el-tag>
                </div>
              </div>

              <el-alert
                v-if="hasInvalidFormatMaterials"
                type="warning"
                :closable="false"
                show-icon
                class="material-publish-config-dialog__warning"
              >
                <template #title>
                  所选素材中有 {{ invalidFormatMaterialsList.length }} 张图片格式不符合要求：{{
                    invalidFormatMaterialsList.map((item) => item.name).join("、")
                  }}
                </template>
              </el-alert>

              <div class="material-publish-config-dialog__material-list">
                <div
                  v-for="material in selectedMaterialsForPublishConfig"
                  :key="material.id"
                  class="material-publish-config-dialog__material-item"
                  :class="{
                    'material-publish-config-dialog__material-item--invalid':
                      isMaterialFormatInvalid(material.id),
                  }"
                >
                  <button
                    type="button"
                    class="material-publish-config-dialog__material-remove"
                    title="移除该图片"
                    @click.stop="removeSelectedMaterial(material.id)"
                  >
                    ×
                  </button>
                  <div class="material-publish-config-dialog__material-preview">
                    <img
                      v-if="getMaterialPreviewSource(material)"
                      :src="getFastPreviewImageUrl(getMaterialPreviewSource(material), { width: 220 })"
                      :alt="material.name || `素材${material.id}`"
                      :title="material.name || `素材${material.id}`"
                    />
                    <div v-else class="material-publish-config-dialog__material-placeholder">
                      暂无预览
                    </div>
                  </div>

                  <div class="material-publish-config-dialog__material-meta">
                    <span class="material-publish-config-dialog__material-name">
                      {{ material.name || `素材${material.id}` }}
                    </span>
                    <span class="material-publish-config-dialog__material-suffix">
                      {{ getMaterialSuffix(material.id) || "未知格式" }}
                    </span>
                  </div>
                </div>

                <el-empty
                  v-if="!selectedMaterialsForPublishConfig.length"
                  description="请先选择图片素材"
                  :image-size="84"
                />
              </div>
            </div>

            <div
              class="material-publish-config-dialog__panel material-publish-config-dialog__panel--configs"
            >
              <div
                class="material-publish-config-dialog__section-head material-publish-config-dialog__section-head--configs"
              >
                <div>
                  <div class="material-publish-config-dialog__section-eyebrow">步骤 2</div>
                  <div class="material-publish-config-dialog__section-title">发布配置</div>
                  <div class="material-publish-config-dialog__section-desc">
                    已统一按配置名称、任务类型和平台搜索，未配置 PSD 模板的配置不可用
                  </div>
                </div>
                <div class="material-publish-config-dialog__section-tools">
                  <el-tag type="success" effect="plain">
                    可用 {{ materialPublishConfigUsableCount }} / {{ filteredMaterialPublishConfigs.length }}
                  </el-tag>
                  <div class="material-publish-config-dialog__search">
                    <el-input
                      v-model="materialPublishConfigSearchText"
                      clearable
                      placeholder="搜索配置名称、任务类型或平台"
                      @input="materialPublishConfigCurrentPage = 1"
                    >
                      <template #prefix>
                        <el-icon>
                          <Search />
                        </el-icon>
                      </template>
                    </el-input>
                  </div>
                </div>
              </div>

              <div class="common-table material-publish-config-dialog__table">
                <vxe-grid
                  ref="materialPublishConfigGridRef"
                  v-bind="materialPublishConfigGridOptions"
                  :data="materialPublishConfigDataSource"
                  @checkbox-change="handleMaterialPublishConfigCheckboxChange"
                  @checkbox-all="handleMaterialPublishConfigCheckboxAllChange"
                />
              </div>

              <div
                v-if="filteredMaterialPublishConfigs.length > 0"
                class="material-publish-config-dialog__pagination"
              >
                <pagination
                  v-model:page="materialPublishConfigCurrentPage"
                  v-model:limit="materialPublishConfigPageSize"
                  :total="filteredMaterialPublishConfigs.length"
                />
              </div>
            </div>
          </div>

          <template #footer>
            <div class="material-publish-config-dialog__footer">
              <div class="material-publish-config-dialog__footer-info">
                <span class="material-publish-config-dialog__footer-chip">
                  素材 {{ ids.length }} 张
                </span>
                <span class="material-publish-config-dialog__footer-chip">
                  发布配置 {{ materialPublishConfigSelectedIds.length }} 个
                </span>
                <span class="material-publish-config-dialog__footer-chip">
                  预计生成 {{ materialPublishConfigTaskCount }} 条套图任务
                </span>
                <span
                  v-if="hasInvalidFormatMaterials"
                  class="material-publish-config-dialog__footer-tip"
                >
                  当前存在格式不兼容素材，请处理后再开始制作
                </span>
                <span
                  v-else
                  class="material-publish-config-dialog__footer-tip material-publish-config-dialog__footer-tip--muted"
                >
                  选好配置后即可直接创建任务，业务逻辑与原流程保持一致
                </span>
              </div>
              <div class="material-publish-config-dialog__footer-actions">
                <el-button @click="handleCloseMaterialPublishConfigDialog">取消</el-button>
                <el-button
                  type="primary"
                  :loading="materialPublishConfigSubmitting"
                  :disabled="
                    !ids.length ||
                    !materialPublishConfigSelectedIds.length ||
                    hasInvalidFormatMaterials
                  "
                  @click="handleCreatePsdSetsByPublishConfig"
                >
                  创建发布任务
                </el-button>
              </div>
            </div>
          </template>
        </el-dialog>

        <el-dialog
          v-model="materialProductConfigDialogVisible"
          fullscreen
          align-center
          :destroy-on-close="false"
          class="material-publish-config-dialog"
          @close="handleCloseMaterialProductConfigDialog"
        >
          <template #header>
            <div class="material-publish-config-dialog__header">
              <div class="material-publish-config-dialog__header-main">
                <div class="material-publish-config-dialog__header-title">
                  生成独立站商品
                </div>
              </div>

              <div class="material-publish-config-dialog__header-chips">
                <span class="material-publish-config-dialog__header-chip">
                  素材 {{ selectedMaterialsForPublishConfig.length }} 张
                </span>
                <span class="material-publish-config-dialog__header-chip">
                  可用配置 {{ materialProductConfigUsableCount }} 个
                </span>
              </div>
            </div>
          </template>

          <div
            v-loading="materialProductConfigLoading"
            class="material-publish-config-dialog__body"
          >
            <div
              class="material-publish-config-dialog__panel material-publish-config-dialog__panel--materials"
            >
              <div class="material-publish-config-dialog__section-head">
                <div>
                  <div class="material-publish-config-dialog__section-eyebrow">步骤 1</div>
                  <div class="material-publish-config-dialog__section-title">已选图片</div>
                  <div class="material-publish-config-dialog__section-desc">
                    当前共 {{ selectedMaterialsForPublishConfig.length }} 张素材
                  </div>
                </div>
                <div class="material-publish-config-dialog__tag-list">
                  <el-tag
                    :type="hasInvalidFormatMaterials ? 'warning' : 'success'"
                    effect="plain"
                  >
                    {{
                      hasInvalidFormatMaterials
                        ? `${invalidFormatMaterialsList.length} 张格式需处理`
                        : "格式检查通过"
                    }}
                  </el-tag>
                  <el-tag type="info" effect="plain">
                    允许格式：{{ psdSetAllowedFormats.join("、") }}
                  </el-tag>
                </div>
              </div>

              <el-alert
                v-if="hasInvalidFormatMaterials"
                type="warning"
                :closable="false"
                show-icon
                class="material-publish-config-dialog__warning"
              >
                <template #title>
                  所选素材中有 {{ invalidFormatMaterialsList.length }} 张图片格式不符合要求：{{
                    invalidFormatMaterialsList.map((item) => item.name).join("、")
                  }}
                </template>
              </el-alert>

              <div class="material-publish-config-dialog__material-list">
                <div
                  v-for="material in selectedMaterialsForPublishConfig"
                  :key="material.id"
                  class="material-publish-config-dialog__material-item"
                  :class="{
                    'material-publish-config-dialog__material-item--invalid':
                      isMaterialFormatInvalid(material.id),
                  }"
                >
                  <button
                    type="button"
                    class="material-publish-config-dialog__material-remove"
                    title="移除该图片"
                    @click.stop="removeSelectedMaterial(material.id)"
                  >
                    ×
                  </button>
                  <div class="material-publish-config-dialog__material-preview">
                    <img
                      v-if="getMaterialPreviewSource(material)"
                      :src="getFastPreviewImageUrl(getMaterialPreviewSource(material), { width: 220 })"
                      :alt="material.name || `素材${material.id}`"
                      :title="material.name || `素材${material.id}`"
                    />
                    <div v-else class="material-publish-config-dialog__material-placeholder">
                      暂无预览
                    </div>
                  </div>

                  <div class="material-publish-config-dialog__material-meta">
                    <span class="material-publish-config-dialog__material-name">
                      {{ material.name || `素材${material.id}` }}
                    </span>
                    <span class="material-publish-config-dialog__material-suffix">
                      {{ getMaterialSuffix(material.id) || "未知格式" }}
                    </span>
                  </div>
                </div>

                <el-empty
                  v-if="!selectedMaterialsForPublishConfig.length"
                  description="请先选择图片素材"
                  :image-size="84"
                />
              </div>
            </div>

            <div
              class="material-publish-config-dialog__panel material-publish-config-dialog__panel--configs"
            >
              <div
                class="material-publish-config-dialog__section-head material-publish-config-dialog__section-head--configs"
              >
                <div>
                  <div class="material-publish-config-dialog__section-eyebrow">步骤 2</div>
                  <div class="material-publish-config-dialog__section-title">
                    独立站商品配置
                  </div>
                  <div class="material-publish-config-dialog__section-desc">
                    未绑定 PSD 模板的商品配置不可用于图片直达商品流程
                  </div>
                </div>
                <div class="material-publish-config-dialog__section-tools">
                  <el-tag type="success" effect="plain">
                    可用 {{ materialProductConfigUsableCount }} /
                    {{ filteredMaterialProductConfigs.length }}
                  </el-tag>
                  <div class="material-publish-config-dialog__search">
                    <el-input
                      v-model="materialProductConfigSearchText"
                      clearable
                      placeholder="搜索配置名称、商品类型或标签"
                      @input="materialProductConfigCurrentPage = 1"
                    >
                      <template #prefix>
                        <el-icon>
                          <Search />
                        </el-icon>
                      </template>
                    </el-input>
                  </div>
                </div>
              </div>

              <div class="common-table material-publish-config-dialog__table">
                <vxe-grid
                  ref="materialProductConfigGridRef"
                  v-bind="materialProductConfigGridOptions"
                  :data="materialProductConfigDataSource"
                  @checkbox-change="handleMaterialProductConfigCheckboxChange"
                  @checkbox-all="handleMaterialProductConfigCheckboxAllChange"
                />
              </div>

              <div
                v-if="filteredMaterialProductConfigs.length > 0"
                class="material-publish-config-dialog__pagination"
              >
                <pagination
                  v-model:page="materialProductConfigCurrentPage"
                  v-model:limit="materialProductConfigPageSize"
                  :total="filteredMaterialProductConfigs.length"
                />
              </div>
            </div>
          </div>

          <template #footer>
            <div class="material-publish-config-dialog__footer">
              <div class="material-publish-config-dialog__footer-info">
                <span class="material-publish-config-dialog__footer-chip">
                  素材 {{ ids.length }} 张
                </span>
                <span class="material-publish-config-dialog__footer-chip">
                  商品配置 {{ materialProductConfigSelectedIds.length }} 个
                </span>
                <span class="material-publish-config-dialog__footer-chip">
                  预计生成 {{ materialProductConfigTaskCount }} 个独立站商品
                </span>
                <span
                  v-if="hasInvalidFormatMaterials"
                  class="material-publish-config-dialog__footer-tip"
                >
                  当前存在格式不兼容素材，请处理后再创建任务
                </span>
                <span
                  v-else
                  class="material-publish-config-dialog__footer-tip material-publish-config-dialog__footer-tip--muted"
                >
                  套图完成后将自动生成商品信息、SEO和价格
                </span>
              </div>
              <div class="material-publish-config-dialog__footer-actions">
                <el-button @click="handleCloseMaterialProductConfigDialog">取消</el-button>
                <el-button
                  type="primary"
                  :loading="materialProductConfigSubmitting"
                  :disabled="
                    !ids.length ||
                    !materialProductConfigSelectedIds.length ||
                    hasInvalidFormatMaterials
                  "
                  @click="handleCreatePsdSetsByProductConfig"
                >
                  创建商品任务
                </el-button>
              </div>
            </div>
          </template>
        </el-dialog>

        <el-dialog
          v-model="psdSetDialogVisible"
          fullscreen
          align-center
          :destroy-on-close="true"
          class="psd-set-dialog"
          @close="resetPsdSetState"
        >
          <template #header>
            <div class="psd-set-dialog__header">
              <div class="psd-set-dialog__header-main">
                <div class="psd-set-dialog__header-title">{{ psdSetDialogTitle }}</div>
              </div>
              <div class="psd-set-dialog__header-chips">
                <span class="psd-set-dialog__header-chip">素材 {{ ids.length }} 张</span>
                <span class="psd-set-dialog__header-chip">
                  模板 {{ selectedPsdTemplateIds.length }} 个
                </span>
                <span class="psd-set-dialog__header-chip is-accent">
                  预计 {{ psdSetTaskCount }} 条任务
                </span>
              </div>
            </div>
          </template>

          <div class="psd-set-body">
            <div class="psd-set-materials">
              <div class="psd-set-panel__head">
                <div>
                  <div class="psd-set-panel__eyebrow">步骤 1</div>
                  <div class="section-title">已选择素材 ({{ ids.length }})</div>
                  <div class="psd-set-panel__desc">
                    可直接按当前素材的尺寸和抠图属性筛选模板。
                  </div>
                </div>
                <div class="psd-set-panel__tags">
                  <el-tag
                    :type="hasInvalidFormatMaterials ? 'warning' : 'success'"
                    effect="plain"
                  >
                    {{
                      hasInvalidFormatMaterials
                        ? `${invalidFormatMaterialsList.length} 张格式需处理`
                        : "格式检查通过"
                    }}
                  </el-tag>
                </div>
              </div>
              <el-alert
                v-if="hasInvalidFormatMaterials"
                type="warning"
                :closable="false"
                show-icon
                class="psd-set-panel__alert"
              >
                <template #title>
                  当前有 {{ invalidFormatMaterialsList.length }} 张素材格式不兼容：{{
                    invalidFormatMaterialsList.map((item) => item.name).join("、")
                  }}
                </template>
              </el-alert>
              <div class="thumbs">
                <div
                  v-for="id in ids"
                  :key="id"
                  class="thumb"
                  :class="{ 'thumb-invalid-format': isMaterialFormatInvalid(id) }"
                >
                  <button
                    type="button"
                    class="thumb-remove"
                    title="移除该图片"
                    @click.stop="removeSelectedMaterial(id)"
                  >
                    ×
                  </button>
                  <div class="thumb-image-wrapper">
                    <img
                      :src="
                        getFastPreviewImageUrl(
                          getMaterialPreviewSource(getMaterialById(id)),
                          { width: 150 },
                        )
                      "
                      class="thumb-img"
                      alt="素材预览"
                      loading="lazy"
                    />
                    <div v-if="isMaterialFormatInvalid(id)" class="thumb-format-badge">
                      <el-icon>
                        <Warning />
                      </el-icon>
                      <span>{{ getMaterialSuffix(id) || "未知" }}</span>
                    </div>
                    <div v-else-if="getMaterialSuffix(id)" class="thumb-format-badge valid">
                      <span>{{ getMaterialSuffix(id) }}</span>
                    </div>
                  </div>
                  <div class="thumb-info-row">
                    <el-tag
                      v-if="getMaterialShapeLabel(id)"
                      size="small"
                      type="info"
                      class="thumb-info-tag"
                    >
                      {{ getMaterialShapeLabel(id) }}
                    </el-tag>
                    <el-tag
                      v-if="getMaterialCutoutStatus(id) !== null"
                      size="small"
                      :type="getMaterialCutoutStatus(id) ? 'success' : 'info'"
                      class="thumb-info-tag"
                    >
                      {{ getMaterialCutoutStatus(id) ? "抠图" : "非抠图" }}
                    </el-tag>
                  </div>
                  <div class="thumb-action-row">
                    <el-button
                      size="small"
                      type="primary"
                      link
                      :disabled="!getMaterialShapeKey(id) && !getMaterialCutoutMode(id)"
                      @click="applyMaterialFilters(id)"
                    >
                      用当前图筛选模板
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <div class="psd-set-templates">
              <div class="psd-set-panel__head">
                <div>
                  <div class="psd-set-panel__eyebrow">步骤 2</div>
                  <div class="section-title">
                    选择PSD模板 (可多选，支持跨页勾选)
                    <span v-if="psdSetTemplatePageParams.total > 0" class="template-count-info">
                      (共 {{ psdSetTemplatePageParams.total }} 个)
                    </span>
                  </div>
                  <div class="psd-set-panel__desc">
                    模板列表会保留当前筛选条件和勾选状态，方便连续操作。
                  </div>
                </div>
                <div class="psd-set-panel__tags">
                  <el-tag type="primary" effect="plain">
                    已选 {{ selectedPsdTemplateIds.length }} 个
                  </el-tag>
                  <el-tag type="info" effect="plain">预计 {{ psdSetTaskCount }} 条任务</el-tag>
                </div>
              </div>

              <div class="psd-set-content-container">
                <div class="psd-template-folder-filter">
                  <span class="psd-template-folder-filter__label">文件夹</span>
                  <el-cascader
                    v-model="selectedPsdFolderId"
                    :options="psdFolderTreeData"
                    :props="{
                      value: 'id',
                      label: 'name',
                      children: 'children',
                      checkStrictly: true,
                      emitPath: false,
                    }"
                    placeholder="选择模板文件夹"
                    filterable
                    clearable
                    :show-all-levels="false"
                    popper-class="psd-template-folder-cascader-popper"
                    class="psd-template-folder-filter__cascader"
                    @change="handlePsdFolderChange"
                  />
                </div>

                <div class="psd-template-list-container">
                  <div class="psd-set-template-toolbar">
                    <el-input
                      v-model="psdSetTemplateSearchText"
                      placeholder="搜索"
                      clearable
                      class="psd-set-template-toolbar__search"
                    >
                      <template #prefix>
                        <el-icon>
                          <Search />
                        </el-icon>
                      </template>
                    </el-input>

                    <!-- 尺寸过滤 -->
                    <el-select
                      v-model="psdSetTemplatePageParams.suitableSizesArray"
                      placeholder="尺寸"
                      clearable
                      multiple
                      style="max-width: 200px"
                      @change="
                        () => {
                          psdSetTemplatePageParams.currentPage = 1;
                          loadPsdTemplatesForPsdSet();
                        }
                      "
                    >
                      <el-option-group label="正方形">
                        <el-option
                          v-for="config in SIZE_SHAPE_GROUPS.square"
                          :key="config.key"
                          :label="config.label"
                          :value="config.key"
                        />
                      </el-option-group>
                      <el-option-group label="横图">
                        <el-option
                          v-for="config in SIZE_SHAPE_GROUPS.landscape"
                          :key="config.key"
                          :label="config.label"
                          :value="config.key"
                        />
                      </el-option-group>
                      <el-option-group label="竖图">
                        <el-option
                          v-for="config in SIZE_SHAPE_GROUPS.portrait"
                          :key="config.key"
                          :label="config.label"
                          :value="config.key"
                        />
                      </el-option-group>
                    </el-select>

                    <!-- 抠图过滤 -->
                    <el-select
                      v-model="psdSetTemplatePageParams.cutoutModesArray"
                      placeholder="抠图支持"
                      clearable
                      multiple
                      style="max-width: 200px"
                      @change="
                        () => {
                          psdSetTemplatePageParams.currentPage = 1;
                          loadPsdTemplatesForPsdSet();
                        }
                      "
                    >
                      <el-option label="抠图" value="CUTOUT" />
                      <el-option label="非抠图" value="NON_CUTOUT" />
                    </el-select>

                    <el-button
                      size="default"
                      class="psd-template-toolbar-button"
                      @click="handlePsdTemplateSelectAll"
                    >
                      {{ isAllPsdTemplatesSelected ? "取消全选" : "全选" }}
                    </el-button>
                    <el-button
                      size="default"
                      :icon="Edit"
                      class="psd-template-toolbar-button"
                      @click="handlePsdTemplateDetailConfig"
                    >
                      详细配置
                    </el-button>
                    <span class="selected-count" v-if="selectedPsdTemplateIds.length > 0">
                      已选中 {{ selectedPsdTemplateIds.length }} 个
                    </span>
                  </div>
                  <div class="template-list-wrapper">
                    <div class="template-list" v-loading="psdSetTemplatesLoading">
                      <div
                        v-for="tpl in filteredPsdSetTemplates"
                        :key="tpl.id"
                        class="template-item"
                        :class="{ 'is-checked': selectedPsdTemplateIds.includes(String(tpl.id)) }"
                      >
                        <div class="template-content-wrapper" @click="togglePsdTemplate(tpl.id)">
                          <img
                            v-if="tpl.thumbnail || tpl.preview || tpl.image"
                            :src="
                              getFastPreviewImageUrl(tpl.thumbnail || tpl.preview || tpl.image, {
                                width: 200,
                              })
                            "
                            :alt="tpl.name || '模板缩略图'"
                            class="template-thumbnail"
                            loading="lazy"
                            title="点击预览"
                            @click.stop="openImagePreview(tpl.thumbnail || tpl.preview || tpl.image, tpl.name)"
                            @error="handleTemplateImageError"
                          />
                          <div class="template-info">
                            <div class="template-header">
                              <div class="template-title-row">
                                <div class="template-title">{{ tpl.name || "未命名模板" }}</div>
                                <el-link
                                  type="primary"
                                  :underline="false"
                                  class="template-detail-link"
                                  @click.stop="openTemplateDetail(tpl)"
                                >
                                  查看详情
                                </el-link>
                              </div>
                            </div>
                            <div class="template-paths">
                              <div class="path-row">
                                <span class="path-label">适用尺寸：</span>
                                <div
                                  v-if="tpl.suitableSizes && tpl.suitableSizes.length > 0"
                                  class="suitable-sizes-wrap"
                                >
                                  <el-tag
                                    v-for="sizeKey in tpl.suitableSizes"
                                    :key="sizeKey"
                                    size="small"
                                    :style="{
                                      backgroundColor: getSizeShapeUiConfig(sizeKey)?.color + '20',
                                      borderColor: getSizeShapeUiConfig(sizeKey)?.color,
                                      color: getSizeShapeUiConfig(sizeKey)?.color,
                                      marginRight: '4px',
                                    }"
                                  >
                                    {{ getSizeShapeUiConfig(sizeKey)?.label || sizeKey }}
                                  </el-tag>
                                </div>
                                <span v-else class="path-empty">暂无</span>
                              </div>
                              <div class="path-row">
                                <span class="path-label">适用抠图：</span>
                                <div
                                  v-if="tpl.cutoutModes && tpl.cutoutModes.length > 0"
                                  class="suitable-cutout-wrap"
                                >
                                  <el-tag
                                    v-for="mode in tpl.cutoutModes"
                                    :key="mode"
                                    size="small"
                                    type="info"
                                    style="margin-right: 4px"
                                  >
                                    {{ getCutoutModeLabel(mode) }}
                                  </el-tag>
                                </div>
                                <span v-else class="path-empty">暂无</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <el-empty
                        v-if="!filteredPsdSetTemplates.length && !psdSetTemplatesLoading"
                        :description="psdSetTemplateSearchText ? '未找到匹配的模板' : '暂无PSD模板'"
                      />
                    </div>
                    <!-- PSD模板分页 -->
                    <div class="template-pagination" v-if="psdSetTemplatePageParams.total > 0">
                      <pagination
                        v-model:page="psdSetTemplatePageParams.currentPage"
                        v-model:limit="psdSetTemplatePageParams.pageSize"
                        :total="psdSetTemplatePageParams.total"
                        @pagination="loadPsdTemplatesForPsdSet"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="psd-set-footer">
            <div class="psd-set-footer-main">
              <div class="psd-set-info">
                <el-icon>
                  <InfoFilled />
                </el-icon>
                <div class="psd-set-info-content">
                  <span class="psd-set-info-chip">
                    {{
                      psdSetMergeSticker
                        ? `合并生成，每个模板各生成 1 条，共 ${psdSetTaskCount} 条套图任务`
                        : `将生成 ${ids.length} × ${selectedPsdTemplateIds.length} = ${psdSetTaskCount} 条套图任务`
                    }}
                  </span>
                  <span class="psd-set-info-chip psd-set-info-chip--subtle">
                    允许的图片格式：{{ allowedFormatsForSelectedTemplates.join("、") }}
                  </span>
                  <span class="psd-set-info-chip psd-set-info-chip--subtle">
                    自动化动作：{{
                      enabledPsdSetAutomationCount ? enabledPsdSetAutomationKeys.join("、") : "未启用"
                    }}
                  </span>
                </div>
              </div>

              <div class="psd-set-mode-inline">
                <span class="psd-set-mode-label">生成方式:</span>
                <el-tag :type="psdSetMergeSticker ? 'success' : 'primary'" size="large">
                  {{ psdSetMergeSticker ? "合并素材 × 模板" : "单素材 × 模板" }}
                </el-tag>
              </div>

              <div class="psd-set-footer-actions">
                <el-button @click="psdSetDialogVisible = false">取消</el-button>
                <el-button plain @click="psdSetAutomationDialogVisible = true">
                  完成后动作{{ enabledPsdSetAutomationCount ? `(${enabledPsdSetAutomationCount})` : "" }}
                </el-button>
                <el-button
                  type="info"
                  plain
                  :disabled="!ids.length || !selectedPsdTemplateIds.length"
                  @click="showPsdSetParams"
                  >查看发送参数</el-button
                >
                <el-tooltip
                  v-if="hasInvalidFormatMaterials"
                  :content="`所选素材中包含不符合格式要求的图片（${invalidFormatMaterialsList.map((m) => m.name).join('、')}），请移除后重试`"
                  placement="top"
                >
                  <el-button
                    type="primary"
                    :disabled="
                      !ids.length || !selectedPsdTemplateIds.length || hasInvalidFormatMaterials
                    "
                    :loading="psdSetSubmitting"
                    @click="handleCreatePsdSets"
                  >
                    开始制作
                  </el-button>
                </el-tooltip>
                <el-button
                  v-else
                  type="primary"
                  :disabled="!ids.length || !selectedPsdTemplateIds.length"
                  :loading="psdSetSubmitting"
                  @click="handleCreatePsdSets"
                >
                  开始制作
                </el-button>
              </div>
            </div>
          </div>
        </el-dialog>

        <el-dialog
          v-model="psdSetAutomationDialogVisible"
          fullscreen
          align-center
          class="psd-set-automation-dialog"
        >
          <template #header>
            <div class="psd-set-automation-dialog__header">
              <div>
                <div class="psd-set-automation-dialog__eyebrow">可选增强</div>
                <div class="psd-set-automation-dialog__title">完成后自动执行</div>
                <div class="psd-set-automation-dialog__subtitle">
                  套图成功后可继续自动生成商品或创建发布任务，不影响当前制作主流程。
                </div>
              </div>
            </div>
          </template>
          <div class="psd-set-automation-dialog-body">
            <div class="psd-set-automation-dialog__intro">
              勾选需要的动作即可，只有启用后的字段会参与提交。
            </div>
            <div
              v-for="action in psdSetAutomationActions"
              :key="action.key"
              class="psd-set-automation-item"
              :class="{ 'is-active': action.enabled }"
            >
              <div class="psd-set-automation-head">
                <el-checkbox v-model="action.enabled">
                  {{ action.label }}
                </el-checkbox>
                <el-tag :type="action.enabled ? 'success' : 'info'" effect="plain">
                  {{ action.enabled ? "已启用" : "未启用" }}
                </el-tag>
                <span class="psd-set-automation-key">{{ action.key }}</span>
              </div>
              <div class="psd-set-automation-desc">{{ action.description }}</div>
              <div v-if="action.enabled && action.fields?.length" class="psd-set-automation-config">
                <div
                  v-for="field in action.fields"
                  :key="`${action.key}-${field.key}`"
                  class="psd-set-automation-field"
                >
                  <div class="psd-set-automation-field-title">
                    <span>{{ field.label }}</span>
                    <span class="psd-set-automation-field-key">{{ field.key }}</span>
                  </div>
                  <el-input
                    v-if="field.component === 'textarea'"
                    v-model="action.params[field.key]"
                    type="textarea"
                    :rows="field.rows || 2"
                    :placeholder="field.placeholder"
                  />
                  <div
                    v-else-if="field.component === 'product-template-list'"
                    class="psd-set-automation-list"
                  >
                    <div class="psd-set-automation-list__toolbar">
                      <el-input
                        v-model="psdSetAutomationProductTemplateSearchText"
                        size="small"
                        clearable
                        placeholder="搜索模板名称/商品类型/标签"
                      />
                      <el-tag size="small" type="info">
                        已选 {{ action.params[field.key]?.length || 0 }} 个模板
                      </el-tag>
                    </div>
                    <vxe-grid
                      class="psd-set-automation-list__grid"
                      border
                      size="mini"
                      :loading="psdSetAutomationProductTemplatesLoading"
                      :data="filteredPsdSetAutomationProductTemplates"
                      :columns="psdSetAutomationProductTemplateColumns"
                      :max-height="360"
                      :row-config="{ keyField: 'id', isHover: true }"
                      :checkbox-config="{ checkRowKeys: action.params[field.key] || [] }"
                      @checkbox-change="
                        (event) => handlePsdSetAutomationListCheckboxChange(action, field.key, event)
                      "
                      @checkbox-all="
                        (event) => handlePsdSetAutomationListCheckboxChange(action, field.key, event)
                      "
                    />
                  </div>
                  <div
                    v-else-if="field.component === 'publish-config-list'"
                    class="psd-set-automation-list"
                  >
                    <div class="psd-set-automation-list__toolbar">
                      <el-input
                        v-model="psdSetAutomationPublishConfigSearchText"
                        size="small"
                        clearable
                        placeholder="搜索任务配置名称、任务类型或平台"
                      />
                      <el-tag size="small" type="info">
                        已选 {{ action.params[field.key]?.length || 0 }} 个配置
                      </el-tag>
                    </div>
                    <vxe-grid
                      class="psd-set-automation-list__grid"
                      border
                      size="mini"
                      :loading="psdSetAutomationPublishConfigsLoading"
                      :data="filteredPsdSetAutomationPublishConfigs"
                      :columns="psdSetAutomationPublishConfigColumns"
                      :max-height="360"
                      :row-config="{ keyField: 'id', isHover: true }"
                      :checkbox-config="{ checkRowKeys: action.params[field.key] || [] }"
                      @checkbox-change="
                        (event) => handlePsdSetAutomationListCheckboxChange(action, field.key, event)
                      "
                      @checkbox-all="
                        (event) => handlePsdSetAutomationListCheckboxChange(action, field.key, event)
                      "
                    />
                  </div>
                  <el-input
                    v-else
                    v-model="action.params[field.key]"
                    :placeholder="field.placeholder"
                  />
                </div>
              </div>
            </div>
          </div>
          <template #footer>
            <el-button @click="psdSetAutomationDialogVisible = false">关闭</el-button>
          </template>
        </el-dialog>

        <!-- 批量详细配置全屏弹窗（选中的PSD模板） -->
        <el-dialog
          v-model="batchDetailConfigDialogVisible"
          title="详细配置 - 选中的模板"
          fullscreen
          :destroy-on-close="true"
        >
          <div class="batch-detail-config-content">
            <div class="batch-detail-config-header">
              <div class="batch-detail-config-title">
                <span>共 {{ templateConfigList.length }} 个模板</span>
              </div>
            </div>
            <div class="batch-detail-config-body">
              <div
                v-for="(template, index) in templateConfigList"
                :key="template.id"
                class="template-config-row"
              >
                <div class="template-config-left">
                  <div class="template-config-header-row">
                    <span class="template-name">{{ template.name || `模板 ${index + 1}` }}</span>
                    <el-tag :type="template.psdTemplateConfig ? 'success' : 'info'" size="small">
                      {{ template.psdTemplateConfig ? "已配置" : "未配置" }}
                    </el-tag>
                  </div>
                  <div class="template-config-images">
                    <div class="config-image-item">
                      <div class="config-image-label">素材图</div>
                      <div class="config-image-wrapper">
                        <template v-if="template.materialId !== undefined">
                          <!-- 单素材模式：显示单个匹配的素材图 -->
                          <img
                            v-if="getMatchedMaterialId(index)"
                            :src="getMaterialImageUrl(getMatchedMaterialId(index))"
                            :alt="'素材'"
                            class="config-image"
                          />
                          <span v-else class="config-image-placeholder">无匹配素材</span>
                        </template>
                        <template v-else>
                          <!-- 合并模式：显示所有素材图 -->
                          <img
                            v-for="materialId in ids"
                            :key="materialId"
                            :src="getMaterialImageUrl(materialId)"
                            :alt="'素材'"
                            class="config-image"
                          />
                          <span v-if="!ids.length" class="config-image-placeholder">无素材</span>
                        </template>
                      </div>
                    </div>
                    <div class="config-image-item">
                      <div class="config-image-label">模板配置图</div>
                      <div class="config-image-wrapper">
                        <img
                          v-if="template.thumbnail"
                          :src="getFastPreviewImageUrl(template.thumbnail, { width: 200 })"
                          :alt="template.name"
                          class="config-image"
                        />
                        <span v-else class="config-image-placeholder">无缩略图</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="template-config-right">
                  <div class="config-editor-toolbar">
                    <el-button
                      @click="handleResetConfigForTemplate(index)"
                      type="warning"
                      :icon="RefreshLeft"
                      size="small"
                    >
                      重置为默认
                    </el-button>
                  </div>
                  <el-input
                    v-model="template.configText"
                    type="textarea"
                    :rows="18"
                    placeholder='请输入JSON配置（例如：{"key1": "value1", "key2": "value2"}）'
                    class="config-textarea"
                  />
                </div>
              </div>
            </div>
          </div>
          <template #footer>
            <el-button @click="batchDetailConfigDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSaveConfigToMemory"> 保存（暂存） </el-button>
          </template>
        </el-dialog>

        <!-- PSD模板详情弹窗 -->
        <el-dialog
          v-model="psdTemplateDetailDialogVisible"
          title="PSD模板详情"
          fullscreen
          align-center
          :destroy-on-close="true"
        >
          <div v-if="currentPsdTemplate" class="psd-template-detail">
            <div class="detail-layout">
              <div class="detail-left">
                <div class="detail-thumbnail">
                  <img
                    v-if="
                      currentPsdTemplate.thumbnail ||
                      currentPsdTemplate.preview ||
                      currentPsdTemplate.image
                    "
                    :src="
                      getPreviewImageUrl(
                        currentPsdTemplate.thumbnail ||
                          currentPsdTemplate.preview ||
                          currentPsdTemplate.image,
                        { width: 600, quality: 90, format: 'webp' },
                      )
                    "
                    :alt="currentPsdTemplate.name || '模板缩略图'"
                    class="detail-thumbnail-img"
                    loading="lazy"
                  />
                  <div v-else class="detail-thumbnail-placeholder">暂无缩略图</div>
                </div>
              </div>

              <div class="detail-right">
                <div class="detail-item">
                  <span class="detail-label">模板名称：</span>
                  <span class="detail-value">{{ currentPsdTemplate.name || "未命名模板" }}</span>
                </div>

                <div class="detail-item">
                  <span class="detail-label">描述：</span>
                  <span class="detail-value">{{ currentPsdTemplate.description || "暂无" }}</span>
                </div>

                <div class="detail-item">
                  <span class="detail-label">关键字：</span>
                  <span class="detail-value">{{ currentPsdTemplate.keywords || "暂无" }}</span>
                </div>

                <div v-if="currentPsdTemplate.psdTemplateConfig" class="detail-item">
                  <span class="detail-label">PSD配置：</span>
                  <div class="detail-value psd-config-value">
                    {{ currentPsdTemplate.psdTemplateConfig }}
                  </div>
                </div>

                <div class="detail-item">
                  <span class="detail-label">远程链接：</span>
                  <div class="detail-value">
                    <el-link
                      v-if="currentPsdTemplate.url"
                      :href="currentPsdTemplate.url"
                      target="_blank"
                      type="primary"
                      :underline="false"
                    >
                      {{ currentPsdTemplate.url }}
                    </el-link>
                    <span v-else class="detail-empty">暂无</span>
                  </div>
                </div>

                <div class="detail-item">
                  <span class="detail-label">本地路径：</span>
                  <span class="detail-value">{{
                    currentPsdTemplate.windowsLocalPath || "暂无"
                  }}</span>
                </div>
              </div>
            </div>
          </div>
          <template #footer>
            <el-button @click="psdTemplateDetailDialogVisible = false">关闭</el-button>
          </template>
        </el-dialog>
      </template>

      <template #sidebar>
        <div
          class="list-page-panel list-page-panel--flat list-page-sidebar material-index-sidebar folder-sidebar-shell"
        >
          <div class="list-page-sidebar__body material-index-sidebar__body folder-sidebar-body">
            <div
              v-show="!folderTreeCollapsed"
              class="material-index-sidebar__tree folder-sidebar-tree"
            >
              <FolderTree
                v-model="selectedStickerFolderId"
                width="100%"
                :folder-category="FOLDER_CATEGORY"
                :drag-state="dragState"
                @change="handleStickerFolderChange"
                @reloaded="loadStickerFolderTree"
                @folder-drag-over="handleFolderDragOver"
                @folder-drag-leave="handleFolderDragLeave"
                @folder-drop="handleFolderDrop"
              />
            </div>
          </div>
          <button
            type="button"
            class="material-index-sidebar__toggle folder-sidebar-toggle"
            @click="folderTreeCollapsed = !folderTreeCollapsed"
          >
            <el-icon :size="14">
              <DArrowRight v-if="folderTreeCollapsed" />
              <DArrowLeft v-else />
            </el-icon>
          </button>
        </div>
      </template>

      <template #table>
        <div
          class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat"
        >
          <div class="list-page-table-panel__body material-index-table-panel__body">
            <div class="common-table">
              <vxe-grid
                class="material-dnd-grid dnd-text-selectable"
                ref="gridRef"
                v-bind="gridOptions"
                :data="dataSource"
                :loading="loading"
                :row-class-name="materialRowClassName"
                @cell-click="handleMaterialCellClick"
                @checkbox-change="checkboxChange"
                @checkbox-all="checkboxAllChange"
              >
                <template #dragHandleSlot>
                  <TableRowDragHandle />
                </template>
                <template #previewDefaultSlot="{ row }">
                  <div
                    class="material-compact-preview"
                    :class="{ 'material-compact-preview--custom': isCustomMaterial(row) }"
                  >
                    <span v-if="isCustomMaterial(row)" class="material-compact-preview__corner">
                      定制
                    </span>
                    <div class="material-compact-preview__image-wrap">
                      <img
                        v-if="row.url && !row._imageError"
                        :key="`preview-${row.id}-${row.url}`"
                        :src="getFastPreviewImageUrl(row.url, { width: 160 })"
                        :alt="row.name || '素材图片'"
                        class="material-compact-preview__image"
                        loading="lazy"
                        decoding="async"
                        @error="row._imageError = true"
                        @click="openImagePreview(row.url, row.name)"
                      />
                      <div v-else class="material-compact-preview__empty">无图</div>
                    </div>
                  </div>
                </template>

                <template #compactNameSlot="{ row }">
                  <div class="material-compact-name">
                    <div class="material-compact-name__title material-compact-name__title--wrap">
                      {{ row.name || `素材 ${row.id}` }}
                    </div>
                  </div>
                </template>

                <template #codeSlot="{ row }">
                  <div v-if="row.code || row.id" class="code-cell">
                    <span
                      v-if="row.code"
                      class="code-value code-clickable"
                      @click.stop="handleCopyText(row.code, '编码')"
                      title="点击复制编码"
                    >{{ row.code }}</span>
                    <span
                      v-if="row.id"
                      class="id-value id-clickable"
                      @click.stop="handleCopyText(row.id, 'ID')"
                      title="点击复制ID"
                    >#{{ row.id }}</span>
                  </div>
                  <span v-else class="table-cell-empty">-</span>
                </template>

                <template #fileInfoSlot="{ row }">
                  <div v-if="row.suffix || row.width || row.fileSize" class="file-info">
                    <span v-if="row.suffix" class="file-info__tag">
                      {{ String(row.suffix).toUpperCase() }}
                    </span>
                    <span v-if="row.fileSize" class="file-info__size">
                      {{ formatFileSize(row.fileSize) }}
                    </span>
                    <span v-if="row.width && row.height" class="file-info__resolution">
                      {{ row.width }} × {{ row.height }}
                    </span>
                    <span v-if="row.aspectRatio" class="file-info__ratio">
                      {{ Number(row.aspectRatio).toFixed(2) }}
                    </span>
                  </div>
                  <span v-else class="table-cell-empty">-</span>
                </template>

                <template #cutoutSlot="{ row }">
                  <el-tag
                    :type="row.isCutout ? 'success' : 'info'"
                    effect="plain"
                    size="small"
                    class="cutout-tag"
                  >
                    {{ row.isCutout ? "是" : "否" }}
                  </el-tag>
                </template>

                <template #nameBilingualSlot="{ row }">
                  <div class="table-bilingual-cell">
                    <div
                      class="table-bilingual-cell__item"
                      :class="{ 'table-bilingual-cell__item--empty': !row.name }"
                      @click.stop="handleCopyText(row.name, '中文名称')"
                      role="button"
                    >
                      <span class="table-bilingual-cell__label">中：</span>
                      <el-tooltip
                        :content="row.name || '-'"
                        placement="top"
                        effect="light"
                        :show-after="500"
                        :disabled="!(row.name && row.name.length > 0)"
                        popper-class="text-cell-tooltip"
                      >
                        <span class="table-bilingual-cell__content">{{ row.name || "-" }}</span>
                      </el-tooltip>
                      <el-icon v-if="row.name" class="table-bilingual-cell__icon">
                        <DocumentCopy />
                      </el-icon>
                    </div>
                    <div
                      class="table-bilingual-cell__item"
                      :class="{ 'table-bilingual-cell__item--empty': !row.nameEn }"
                      @click.stop="handleCopyText(row.nameEn, '英文名称')"
                      role="button"
                    >
                      <span class="table-bilingual-cell__label">En:</span>
                      <el-tooltip
                        :content="row.nameEn || '-'"
                        placement="top"
                        effect="light"
                        :show-after="500"
                        :disabled="!(row.nameEn && row.nameEn.length > 0)"
                        popper-class="text-cell-tooltip"
                      >
                        <span class="table-bilingual-cell__content">{{ row.nameEn || "-" }}</span>
                      </el-tooltip>
                      <el-icon v-if="row.nameEn" class="table-bilingual-cell__icon">
                        <DocumentCopy />
                      </el-icon>
                    </div>
                  </div>
                </template>

                <template #descriptionBilingualSlot="{ row }">
                  <div class="table-bilingual-cell">
                    <div
                      class="table-bilingual-cell__item table-bilingual-cell__item--multiline"
                      :class="{ 'table-bilingual-cell__item--empty': !row.description }"
                      @click.stop="handleCopyText(row.description, '中文描述')"
                      role="button"
                    >
                      <span class="table-bilingual-cell__label">中：</span>
                      <el-tooltip
                        :content="row.description || '-'"
                        placement="top"
                        effect="light"
                        :show-after="500"
                        :disabled="!(row.description && row.description.length > 0)"
                        popper-class="text-cell-tooltip"
                      >
                        <span class="table-bilingual-cell__content">
                          {{ row.description || "-" }}
                        </span>
                      </el-tooltip>
                      <el-icon v-if="row.description" class="table-bilingual-cell__icon">
                        <DocumentCopy />
                      </el-icon>
                    </div>
                    <div
                      class="table-bilingual-cell__item table-bilingual-cell__item--multiline"
                      :class="{ 'table-bilingual-cell__item--empty': !row.descriptionEn }"
                      @click.stop="handleCopyText(row.descriptionEn, '英文描述')"
                      role="button"
                    >
                      <span class="table-bilingual-cell__label">En:</span>
                      <el-tooltip
                        :content="row.descriptionEn || '-'"
                        placement="top"
                        effect="light"
                        :show-after="500"
                        :disabled="!(row.descriptionEn && row.descriptionEn.length > 0)"
                        popper-class="text-cell-tooltip"
                      >
                        <span class="table-bilingual-cell__content">
                          {{ row.descriptionEn || "-" }}
                        </span>
                      </el-tooltip>
                      <el-icon v-if="row.descriptionEn" class="table-bilingual-cell__icon">
                        <DocumentCopy />
                      </el-icon>
                    </div>
                  </div>
                </template>

                <template #keywordsBilingualSlot="{ row }">
                  <div class="table-bilingual-cell">
                    <div
                      class="table-bilingual-cell__item table-bilingual-cell__item--multiline"
                      :class="{ 'table-bilingual-cell__item--empty': !row.keywords }"
                      @click.stop="handleCopyText(row.keywords, '中文关键词')"
                      role="button"
                    >
                      <span class="table-bilingual-cell__label">中：</span>
                      <el-tooltip
                        :content="row.keywords || '-'"
                        placement="top"
                        effect="light"
                        :show-after="500"
                        :disabled="!(row.keywords && row.keywords.length > 0)"
                        popper-class="text-cell-tooltip"
                      >
                        <span class="table-bilingual-cell__content">
                          {{ row.keywords || "-" }}
                        </span>
                      </el-tooltip>
                      <el-icon v-if="row.keywords" class="table-bilingual-cell__icon">
                        <DocumentCopy />
                      </el-icon>
                    </div>
                    <div
                      class="table-bilingual-cell__item table-bilingual-cell__item--multiline"
                      :class="{ 'table-bilingual-cell__item--empty': !row.keywordsEn }"
                      @click.stop="handleCopyText(row.keywordsEn, '英文关键词')"
                      role="button"
                    >
                      <span class="table-bilingual-cell__label">En:</span>
                      <el-tooltip
                        :content="row.keywordsEn || '-'"
                        placement="top"
                        effect="light"
                        :show-after="500"
                        :disabled="!(row.keywordsEn && row.keywordsEn.length > 0)"
                        popper-class="text-cell-tooltip"
                      >
                        <span class="table-bilingual-cell__content">
                          {{ row.keywordsEn || "-" }}
                        </span>
                      </el-tooltip>
                      <el-icon v-if="row.keywordsEn" class="table-bilingual-cell__icon">
                        <DocumentCopy />
                      </el-icon>
                    </div>
                  </div>
                </template>

                <template #originWebSlot="{ row }">
                  <span v-if="row.originWeb" class="table-cell-text">{{ row.originWeb }}</span>
                  <span v-else class="table-cell-empty">-</span>
                </template>
                <template #sizeSlot="{ row }">
                  <span v-if="row.size" class="table-cell-text table-time-cell">{{
                    (row.size / 1024).toFixed(1) + " KB"
                  }}</span>
                  <span v-else class="table-cell-empty">-</span>
                </template>

                <template #isCustomSlot="{ row }">
                  <el-tag :type="row.isCustom ? 'success' : 'info'" size="small">
                    {{ row.isCustom ? "是" : "否" }}
                  </el-tag>
                </template>

                <template #isInfringementSlot="{ row }">
                  <el-tag :type="row.isInfringement ? 'danger' : 'success'" size="small">
                    {{ row.isInfringement ? "侵权" : "非侵权" }}
                  </el-tag>
                </template>

                <template #isCutoutSlot="{ row }">
                  <el-tag :type="row.isCutout ? 'success' : 'info'" size="small">
                    {{ row.isCutout ? "是" : "否" }}
                  </el-tag>
                </template>

                <template #seamlessSlot="{ row }">
                  <el-tag :type="normalizeBooleanValue(row.seamless) ? 'success' : 'info'" size="small">
                    {{ normalizeBooleanValue(row.seamless) ? "是" : "否" }}
                  </el-tag>
                </template>

                <template #fileSizeSlot="{ row }">
                  <span v-if="row.fileSize" class="table-cell-text table-time-cell">
                    {{ formatFileSize(row.fileSize) }}
                  </span>
                  <span v-else class="table-cell-empty">-</span>
                </template>

                <template #suitableForSlot="{ row }">
                  <div v-if="row.suitableFor" class="table-tag-list">
                    <el-tag
                      v-for="(item, index) in (row.suitableFor || '').split(',').slice(0, 2)"
                      :key="index"
                      size="small"
                      type="info"
                    >
                      {{ item.trim() }}
                    </el-tag>
                    <el-tooltip
                      v-if="(row.suitableFor || '').split(',').length > 2"
                      :content="
                        (row.suitableFor || '')
                          .split(',')
                          .map((item) => item.trim())
                          .join('、')
                      "
                      placement="top"
                      effect="dark"
                      :show-after="200"
                    >
                      <el-tag size="small" type="info">
                        +{{ (row.suitableFor || "").split(",").length - 2 }}
                      </el-tag>
                    </el-tooltip>
                  </div>
                  <span v-else class="table-cell-empty">-</span>
                </template>

                <template #similaritySlot="{ row }">
                  <el-tag
                    v-if="row.similarity !== undefined"
                    :type="
                      row.similarity >= 90 ? 'success' : row.similarity >= 70 ? 'warning' : 'info'
                    "
                    size="small"
                  >
                    {{ row.similarity.toFixed(1) }}%
                  </el-tag>
                  <span v-else class="table-cell-empty">-</span>
                </template>

                <template #colorPaletteSlot="{ row }">
                  <div v-if="row.colorPalette" class="table-color-palette">
                    <div
                      v-for="(color, index) in row.colorPalette.split(',').slice(0, 10)"
                      :key="index"
                      class="table-color-swatch"
                      :style="{ backgroundColor: color.trim() }"
                      :title="color.trim()"
                    />
                  </div>
                  <span v-else class="table-cell-empty">-</span>
                </template>

                <template #originUrlSlot="{ row }">
                  <el-link
                    v-if="row.originUrl"
                    :href="row.originUrl"
                    target="_blank"
                    type="primary"
                    :underline="false"
                    class="table-cell-link"
                  >
                    {{
                      row.originUrl.length > 50
                        ? row.originUrl.substring(0, 50) + "..."
                        : row.originUrl
                    }}
                  </el-link>
                  <span v-else class="table-cell-empty">-</span>
                </template>

                <template #sourceSlot="{ row }">
                  <el-link
                    v-if="row.source && /^https?:\/\//i.test(row.source)"
                    :href="row.source"
                    target="_blank"
                    type="primary"
                    :underline="false"
                    class="table-cell-link"
                  >
                    {{ row.source.length > 50 ? row.source.substring(0, 50) + "..." : row.source }}
                  </el-link>
                  <span v-else-if="row.source" class="table-cell-text table-cell-text--secondary">{{
                    row.source.length > 50 ? row.source.substring(0, 50) + "..." : row.source
                  }}</span>
                  <span v-else class="table-cell-empty">-</span>
                </template>

                <template #folderSlot="{ row }">
                  <el-tag v-if="row.folder" type="info" size="small">
                    <el-icon class="mr-4px">
                      <Folder />
                    </el-icon>
                    {{ row.folder }}
                  </el-tag>
                  <span v-else class="table-cell-empty">根目录</span>
                </template>

                <template #operationDefaultSlot="{ row }">
                  <div class="flex items-center gap-1">
                    <el-dropdown
                      :ref="(el) => setOperationDropdownRef(row.id, el)"
                      class="operation-dropdown"
                      popper-class="operation-dropdown-popper"
                      placement="bottom-end"
                      trigger="click"
                      @visible-change="(visible) => handleOperationDropdownVisibleChange(visible, row)"
                    >
                      <el-button
                        type="primary"
                        link
                        size="small"
                        class="operation-trigger-button"
                        :loading="operationCommandLoadingId === String(row.id)"
                        >操作</el-button
                      >
                      <template #dropdown>
                        <div class="op-menu" @click.stop>
                          <!-- 内容相关（仅管理员） -->
                          <div
                            class="op-menu-item has-submenu"
                            @mouseenter="handleSubmenuEnter"
                            @mouseleave="handleSubmenuLeave"
                          >
                            <el-icon class="op-menu-arrow">
                              <ArrowLeft />
                            </el-icon>
                            <span class="op-menu-label">内容相关</span>
                            <div
                              class="op-submenu"
                              data-submenu="content"
                              @mouseenter="handleSubmenuKeepVisible"
                              @mouseleave="handleSubmenuHide"
                            >
                              <div
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('ai-generate', row)"
                              >
                                AI自动生成内容
                              </div>
                              <div
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('generate-image-info', row)"
                              >
                                生成图片信息
                              </div>
                              <div
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('story-script', row)"
                              >
                                生成故事脚本
                              </div>
                              <div
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('view-meta', row)"
                              >
                                查看元数据
                              </div>
                            </div>
                          </div>

                          <!-- 制作操作 -->
                          <div
                            class="op-menu-item has-submenu"
                            @mouseenter="handleSubmenuEnter"
                            @mouseleave="handleSubmenuLeave"
                          >
                            <el-icon class="op-menu-arrow">
                              <ArrowLeft />
                            </el-icon>
                            <span class="op-menu-label">制作</span>
                            <div
                              class="op-submenu"
                              data-submenu="design"
                              @mouseenter="handleSubmenuKeepVisible"
                              @mouseleave="handleSubmenuHide"
                            >
                              <div
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('create-ps-set', row)"
                              >
                                制作PS套图
                              </div>
                              <div
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('view-ps-sets', row)"
                              >
                                查看该素材套图
                              </div>
                            </div>
                          </div>

                          <!-- 图片操作 -->
                          <div
                            class="op-menu-item has-submenu"
                            @mouseenter="handleSubmenuEnter"
                            @mouseleave="handleSubmenuLeave"
                          >
                            <el-icon class="op-menu-arrow">
                              <ArrowLeft />
                            </el-icon>
                            <span class="op-menu-label">图片操作</span>
                            <div
                              class="op-submenu"
                              data-submenu="image"
                              @mouseenter="handleSubmenuKeepVisible"
                              @mouseleave="handleSubmenuHide"
                            >
                              <div
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('download', row)"
                              >
                                下载
                              </div>
                              <div
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('download-rotated-90', row)"
                              >
                                下载旋转90°
                              </div>
                              <div
                                v-if="isAdmin"
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('copy', row)"
                              >
                                复制
                              </div>
                              <div
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('copy-origin-url', row)"
                              >
                                复制原始链接
                              </div>
                              <div
                                v-if="!visualSimilarSearchDisabled"
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('find-similar', row)"
                              >
                                找相似图
                              </div>
                              <div
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('view-publish-usage', row)"
                              >
                                查看发布绑定
                              </div>
                              <div
                                v-if="isAdmin && (row.suffix || '').toLowerCase() === 'png'"
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('trim-png', row)"
                              >
                                生成无空白PNG
                              </div>
                              <div
                                v-if="isAdmin && (row.suffix || '').toLowerCase() === 'svg'"
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('svg-to-png', row)"
                              >
                                SVG转PNG
                              </div>
                            </div>
                          </div>

                          <div
                            v-if="isAdmin"
                            class="op-menu-item has-submenu"
                            @mouseenter="handleSubmenuEnter"
                            @mouseleave="handleSubmenuLeave"
                          >
                            <el-icon class="op-menu-arrow">
                              <ArrowLeft />
                            </el-icon>
                            <span class="op-menu-label">归属操作</span>
                            <div
                              class="op-submenu"
                              data-submenu="ownership"
                              @mouseenter="handleSubmenuKeepVisible"
                              @mouseleave="handleSubmenuHide"
                            >
                              <div
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('copy-to-user', row)"
                              >
                                分享给用户
                              </div>
                              <div
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('move-to-user', row)"
                              >
                                转移给用户
                              </div>
                            </div>
                          </div>

                          <!-- 图片裂变和视频制作 -->
                          <div
                            class="op-menu-item has-submenu"
                            @mouseenter="handleSubmenuEnter"
                            @mouseleave="handleSubmenuLeave"
                          >
                            <el-icon class="op-menu-arrow">
                              <ArrowLeft />
                            </el-icon>
                            <span class="op-menu-label">制作工具</span>
                            <div
                              class="op-submenu"
                              data-submenu="production"
                              @mouseenter="handleSubmenuKeepVisible"
                              @mouseleave="handleSubmenuHide"
                            >
                              <div
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('image-process', row)"
                              >
                                图片处理
                              </div>
                              <div
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('image-split', row)"
                              >
                                图片裂变
                              </div>
                              <div
                                class="op-submenu-item"
                                @click.stop="handleOperationCommand('video-production', row)"
                              >
                                视频制作
                              </div>
                            </div>
                          </div>

                          <div class="op-divider"></div>
                          <div class="op-menu-item" @click.stop="handleOperationCommand('view-detail', row)">
                            <span class="op-menu-arrow-placeholder"></span>
                            <span class="op-menu-label">查看详情</span>
                          </div>

                          <div v-if="isAdmin" class="op-divider"></div>
                          <div
                            v-if="isAdmin"
                            class="op-menu-item"
                            @click.stop="handleOperationCommand('edit', row)"
                          >
                            <span class="op-menu-arrow-placeholder"></span>
                            <span class="op-menu-label">编辑</span>
                          </div>
                          <div
                            v-if="isAdmin"
                            class="op-menu-item danger"
                            @click.stop="handleOperationCommand('delete', row)"
                          >
                            <span class="op-menu-arrow-placeholder"></span>
                            <span class="op-menu-label">删除</span>
                          </div>
                        </div>
                      </template>
                    </el-dropdown>

                    <el-icon
                      v-if="aiTableLoading?.[row?.id]"
                      class="is-loading ml-2"
                      style="color: #409eff; font-size: 18px"
                    />
                  </div>
                </template>
              </vxe-grid>
            </div>
          </div>
        </div>
      </template>

      <template #pagination>
        <div
          class="list-page-panel list-page-panel--flat list-page-table-panel__pagination list-page-table-panel__pagination--flat material-index-pagination"
        >
          <pagination
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            :total="total"
            @pagination="handlePagination"
          />
        </div>
      </template>
    </ListPageLayout>

    <el-dialog
      v-model="addToGroupDialogVisible"
      title="添加到组图"
      width="520px"
      append-to-body
      destroy-on-close
    >
      <el-form label-width="88px" @submit.prevent="submitBatchAddToGroup">
        <el-form-item label="已选素材">
          <el-tag type="info" effect="plain">{{ selectedGroupStickerIds.length }} 张</el-tag>
        </el-form-item>

        <el-form-item label="目标组图" required>
          <el-select
            v-model="targetGroupValue"
            :loading="availableGroupsLoading"
            placeholder="选择组图，或输入新组图名称"
            allow-create
            filterable
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="group in availableGroupList"
              :key="group.id"
              :label="`${group.name} (${group.stickersCount || 0})`"
              :value="group.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="selectedTargetGroup" label="已有图片">
          <div class="add-to-group-preview">
            <div v-if="selectedTargetGroup.stickers.length" class="add-to-group-preview__grid">
              <el-image
                v-for="sticker in selectedTargetGroup.stickers"
                :key="sticker.id"
                :src="sticker.url || ''"
                fit="cover"
                class="add-to-group-preview__image"
                :preview-src-list="getGroupPreviewUrls(selectedTargetGroup)"
                preview-teleported
              />
            </div>
            <span v-else class="table-cell-empty">暂无图片</span>
          </div>
        </el-form-item>

        <el-form-item label="槽位标识">
          <el-input v-model="batchSlotType" maxlength="64" placeholder="选填，如 front / back" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="addToGroupDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="addingToGroup"
          :disabled="!targetGroupValue || !selectedGroupStickerIds.length"
          @click="submitBatchAddToGroup"
        >
          添加 {{ selectedGroupStickerIds.length }} 张
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="similarImageDialogVisible"
      title="模糊搜索"
      width="560px"
      align-center
      :destroy-on-close="false"
      class="similar-image-search-dialog"
      @closed="resetSimilarImageDialog"
    >
      <div class="similar-image-search">
        <el-tabs v-model="similarImageSearchTab" class="similar-image-search__tabs">
          <el-tab-pane label="文字搜索" name="text">
            <div class="similar-image-search__section">
              <el-input
                v-model="similarImageSearchText"
                placeholder="输入文字描述，例如：可爱的猫咪、樱花树下的少女"
                clearable
                @keyup.enter="submitSimilarImageSearch"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane label="图片 URL" name="url">
            <div class="similar-image-search__section">
              <el-input
                v-model="similarImageUrl"
                placeholder="粘贴图片 URL，例如 https://example.com/image.png"
                clearable
                @keyup.enter="submitSimilarImageSearch"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane label="本地图片" name="file">
            <div class="similar-image-search__section">
              <el-upload
                class="similar-image-upload"
                drag
                action="#"
                accept="image/*"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleSimilarImageUploadChange"
              >
                <el-icon class="similar-image-upload__icon">
                  <UploadFilled />
                </el-icon>
                <div class="similar-image-upload__text">拖拽图片到这里，或点击选择</div>
              </el-upload>
              <div v-if="similarImageFileName" class="similar-image-file-name">
                {{ similarImageFileName }}
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="similar-image-search__options">
          <div class="similar-image-search__option-item">
            <span class="similar-image-search__option-label">检索数量：</span>
            <el-input-number
              v-model="similarImageSearchLimit"
              size="small"
              :min="1"
              :max="200"
              controls-position="right"
              style="width: 100px"
            />
          </div>
        </div>

        <div v-if="similarImageSearchTab !== 'text'" class="similar-image-preview">
          <div class="similar-image-preview__title">查询图片</div>
          <div v-if="similarImagePreviewSrc" class="similar-image-preview__frame">
            <img :src="similarImagePreviewSrc" alt="查询图片预览" />
          </div>
          <div v-else class="similar-image-preview__empty">
            <el-icon>
              <PictureFilled />
            </el-icon>
            <span>等待选择图片</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="similarImageDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="similarImageSubmitting"
            @click="submitSimilarImageSearch"
          >
            搜索
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="uploadModalVisible"
      title="素材上传"
      width="calc(100vw - 32px)"
      top="16px"
      :footer="false"
      :destroy-on-close="false"
      class="material-upload-dialog"
      @close="uploadModalClose"
    >
      <template #header="{ titleId, titleClass }">
        <div class="material-upload-dialog__header">
          <span :id="titleId" :class="titleClass">素材上传</span>
          <el-button size="small" type="danger" plain @click="clearUploadDialogState">
            清空
          </el-button>
        </div>
      </template>
      <div class="material-upload-dialog__content">
        <list-upload
          ref="uploadListRef"
          :current-upload-info="currentUploadInfo"
          @single-file-uploaded="singleFileUploaded"
        />
      </div>
    </el-dialog>

    <!-- URL上传弹窗 -->
    <el-dialog
      v-model="urlUploadModalVisible"
      title="URL上传素材"
      width="500px"
      align-center
      :destroy-on-close="true"
      @close="resetUrlUploadForm"
    >
      <el-form
        ref="urlUploadFormRef"
        :model="urlUploadForm"
        :rules="urlUploadFormRules"
        label-width="80px"
      >
        <el-form-item label="图片URL" prop="url">
          <el-input
            v-model="urlUploadForm.url"
            placeholder="请输入图片的完整URL地址"
            style="width: 100%"
            clearable
          />
        </el-form-item>
        <el-form-item label="文件名" prop="name">
          <el-input
            v-model="urlUploadForm.name"
            placeholder="请输入文件名"
            style="width: 100%"
            clearable
          />
        </el-form-item>
        <el-form-item label="AI生成">
          <el-switch v-model="urlUploadForm.useAiGenerate" active-text="使用AI自动生成补全内容" />
        </el-form-item>
        <el-form-item label="文件夹">
          <el-select
            v-model="urlUploadForm.folderId"
            placeholder="请选择文件夹（留空为根目录）"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option label="根目录" :value="null" />
            <el-option
              v-for="folder in stickerFolderSelectOptions"
              :key="folder.value || 'root'"
              :label="folder.label"
              :value="folder.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 预览区域 -->
      <div class="preview-section">
        <div class="preview-label">图片预览</div>
        <div v-if="urlUploadForm.url && urlPreviewVisible" class="image-preview">
          <img
            :src="urlUploadForm.url"
            alt="预览图片"
            class="preview-image"
            loading="lazy"
            @error="handlePreviewError"
            @load="handlePreviewLoad"
          />
          <div v-if="imageInfo" class="image-info">
            <el-tag size="small" type="info"
              >尺寸: {{ imageInfo.width }} × {{ imageInfo.height }}</el-tag
            >
          </div>
        </div>
        <div v-else-if="urlUploadForm.url && !urlPreviewVisible" class="preview-error">
          <el-icon size="32" color="#f56c6c">
            <PictureFilled />
          </el-icon>
          <p>图片预览加载失败</p>
          <p class="error-text">请检查URL是否正确</p>
        </div>
        <div v-else class="preview-placeholder">
          <el-icon size="32" color="#c0c4cc">
            <PictureFilled />
          </el-icon>
          <p>请输入图片URL后显示预览</p>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="urlUploadModalVisible = false">取消</el-button>
          <el-button type="primary" :loading="urlUploadLoading" @click="handleUrlUpload"
            >上传</el-button
          >
        </div>
      </template>
    </el-dialog>

    <!-- 制作设计模型弹窗 -->

    <el-dialog
      v-model="editDialogVisible"
      title="编辑素材信息"
      fullscreen
      :destroy-on-close="true"
      class="edit-material-dialog"
    >
      <div class="edit-material-body">
        <el-form
          :model="editForm"
          label-position="top"
          size="small"
          class="edit-form material-index-search-form"
        >
          <section class="edit-section">
            <div class="edit-section-title">基础信息</div>
            <el-row :gutter="12">
              <el-col :xs="24" :md="12">
                <el-form-item label="名称">
                  <el-input v-model="editForm.name" placeholder="请输入名称" clearable />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="英文名称">
                  <el-input v-model="editForm.nameEn" placeholder="请输入英文名称" clearable />
                </el-form-item>
              </el-col>
              <el-col :xs="24">
                <el-form-item label="描述">
                  <el-input
                    v-model="editForm.description"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入描述"
                    maxlength="1000"
                    show-word-limit
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24">
                <el-form-item label="英文描述">
                  <el-input
                    v-model="editForm.descriptionEn"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入英文描述"
                    maxlength="1000"
                    show-word-limit
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="关键字">
                  <el-input
                    v-model="editForm.keywords"
                    placeholder="请输入关键字（逗号分隔）"
                    clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="英文关键字">
                  <el-input
                    v-model="editForm.keywordsEn"
                    placeholder="请输入英文关键字（逗号分隔）"
                    clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="适用场景">
                  <el-input
                    v-model="editForm.suitableFor"
                    placeholder="请输入适用场景（逗号分隔，如：phone_case,tshirt,mug）"
                    clearable
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <section class="edit-section">
            <div class="edit-section-title">状态与属性</div>
            <el-row :gutter="12">
              <el-col :xs="12" :sm="8" :lg="4">
                <el-form-item label="自定义贴纸">
                  <el-switch
                    v-model="editForm.isCustom"
                    size="small"
                    active-text="是"
                    inactive-text="否"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="12" :sm="8" :lg="4">
                <el-form-item label="是否公开">
                  <el-switch
                    v-model="editForm.isPublic"
                    size="small"
                    active-text="是"
                    inactive-text="否"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="12" :sm="8" :lg="4">
                <el-form-item label="是否为材质">
                  <el-switch
                    v-model="editForm.isTexture"
                    size="small"
                    active-text="是"
                    inactive-text="否"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="12" :sm="8" :lg="4">
                <el-form-item label="抠图素材">
                  <el-switch
                    v-model="editForm.isCutout"
                    size="small"
                    active-text="是"
                    inactive-text="否"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="12" :sm="8" :lg="4">
                <el-form-item label="无缝贴图">
                  <el-switch
                    v-model="editForm.seamless"
                    size="small"
                    active-text="是"
                    inactive-text="否"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="12" :sm="8" :lg="4">
                <el-form-item label="侵权状态">
                  <el-select
                    v-model="editForm.isInfringement"
                    placeholder="请选择"
                    style="width: 100%"
                  >
                    <el-option label="非侵权" :value="false" />
                    <el-option label="侵权" :value="true" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="素材编码">
                  <el-input
                    v-model="editForm.code"
                    placeholder="格式：3-6位随机字母+2-7位数字，如 abc123"
                    clearable
                    maxlength="14"
                  >
                    <template #append>
                      <el-button
                        size="small"
                        :loading="generatingCode"
                        @click="handleGenerateMaterialCode"
                        >生成编码</el-button
                      >
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="文件后缀">
                  <el-input
                    v-model="editForm.suffix"
                    placeholder="如：png, jpg, svg"
                    clearable
                    maxlength="20"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <section class="edit-section">
            <div class="edit-section-title">元信息（只读）</div>
            <el-row :gutter="12">
              <el-col :xs="24" :sm="12" :lg="8">
                <el-form-item label="图片尺寸">
                  <el-input
                    :value="
                      editForm.width && editForm.height
                        ? `${editForm.width} × ${editForm.height}`
                        : '-'
                    "
                    disabled
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="8">
                <el-form-item label="宽高比">
                  <el-input
                    :value="editForm.aspectRatio ? editForm.aspectRatio.toFixed(4) : '-'"
                    disabled
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="8">
                <el-form-item label="文件大小">
                  <el-input
                    :value="editForm.fileSize ? formatFileSize(editForm.fileSize) : '-'"
                    disabled
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="色系">
                  <el-input :value="editForm.colorPalette || '-'" disabled placeholder="自动生成" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="感知哈希">
                  <el-input :value="editForm.phash || '-'" disabled placeholder="自动生成" />
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <section class="edit-section">
            <div class="edit-section-title">来源信息</div>
            <el-row :gutter="12">
              <el-col :xs="24">
                <el-form-item label="原始地址">
                  <el-input v-model="editForm.originUrl" placeholder="请输入原始地址" clearable />
                </el-form-item>
              </el-col>
              <el-col :xs="24">
                <el-form-item label="来源">
                  <el-input
                    v-model="editForm.source"
                    placeholder="请输入来源（文字介绍或链接）"
                    clearable
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </section>
        </el-form>
      </div>
      <template #footer>
        <div class="edit-dialog-footer">
          <el-button size="small" @click="editDialogVisible = false">取消</el-button>
          <el-button size="small" type="primary" :loading="editLoading" @click="submitEdit"
            >保存</el-button
          >
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="素材详情"
      fullscreen
      :destroy-on-close="true"
      class="material-detail-dialog"
    >
      <div v-loading="detailDialogLoading" class="material-detail-body">
        <el-empty
          v-if="!stickerDetailCurrent && !detailDialogLoading"
          description="暂无素材详情"
        />
        <template v-else-if="stickerDetailCurrent">
          <section class="material-detail-hero">
            <div class="material-detail-preview">
              <el-image
                v-if="stickerDetailCurrent.url"
                :src="stickerDetailCurrent.url"
                fit="contain"
                :preview-src-list="[stickerDetailCurrent.url]"
                :preview-teleported="true"
              >
                <template #error>
                  <div class="material-detail-preview__empty">图片加载失败</div>
                </template>
              </el-image>
              <div v-else class="material-detail-preview__empty">暂无图片</div>
            </div>
            <div class="material-detail-summary">
              <div class="material-detail-title">
                {{ stickerDetailCurrent.name || stickerDetailCurrent.code || stickerDetailCurrent.id || "未命名素材" }}
              </div>
              <div class="material-detail-subtitle">
                {{ stickerDetailCurrent.nameEn || stickerDetailCurrent.description || "无英文名称或描述" }}
              </div>
              <div class="material-detail-tags">
                <el-tag v-if="stickerDetailCurrent.code" size="small" effect="plain">
                  {{ stickerDetailCurrent.code }}
                </el-tag>
                <el-tag v-if="stickerDetailCurrent.suffix" size="small" type="info" effect="plain">
                  {{ stickerDetailCurrent.suffix }}
                </el-tag>
                <el-tag
                  v-if="stickerDetailCurrent.isInfringement"
                  size="small"
                  type="danger"
                  effect="plain"
                >
                  侵权
                </el-tag>
                <el-tag v-if="stickerDetailCurrent.isCutout" size="small" type="success" effect="plain">
                  抠图
                </el-tag>
                <el-tag v-if="normalizeBooleanValue(stickerDetailCurrent.seamless)" size="small" type="warning" effect="plain">
                  无缝
                </el-tag>
              </div>
              <div class="material-detail-actions">
                <el-button
                  size="small"
                  :disabled="!stickerDetailCurrent.url"
                  @click="handleCopyText(stickerDetailCurrent.url || '', '图片链接')"
                >
                  复制图片链接
                </el-button>
                <el-button
                  size="small"
                  :disabled="!stickerDetailCurrent.phash"
                  @click="handleCopyText(stickerDetailCurrent.phash || '', '感知哈希')"
                >
                  复制感知哈希
                </el-button>
                <el-button
                  size="small"
                  :disabled="!stickerDetailCurrent.originUrl"
                  @click="handleCopyText(stickerDetailCurrent.originUrl || '', '原始地址')"
                >
                  复制原始地址
                </el-button>
              </div>
            </div>
          </section>

          <section class="material-detail-section">
            <div class="material-detail-section__title">基础信息</div>
            <div class="material-detail-grid">
              <div class="material-detail-field">
                <span class="material-detail-label">ID</span>
                <span class="material-detail-value">{{ formatDetailValue(stickerDetailCurrent.id) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">素材编码</span>
                <span class="material-detail-value">{{ formatDetailValue(stickerDetailCurrent.code) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">文件后缀</span>
                <span class="material-detail-value">{{ formatDetailValue(stickerDetailCurrent.suffix) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">分组</span>
                <span class="material-detail-value">{{ formatDetailValue(stickerDetailCurrent.group) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">上传者</span>
                <span class="material-detail-value">{{ getDetailUploaderLabel(stickerDetailCurrent) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">归属用户ID</span>
                <span class="material-detail-value">{{ formatDetailValue(stickerDetailCurrent.userId) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">文件夹ID</span>
                <span class="material-detail-value">{{ formatDetailValue(stickerDetailCurrent.folderId) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">文件夹路径</span>
                <span class="material-detail-value">{{ formatDetailValue(stickerDetailCurrent.folder || stickerDetailCurrent.folderEntity?.path) }}</span>
              </div>
            </div>
          </section>

          <section class="material-detail-section">
            <div class="material-detail-section__title">文案信息</div>
            <div class="material-detail-grid">
              <div class="material-detail-field">
                <span class="material-detail-label">名称</span>
                <span class="material-detail-value">{{ formatDetailValue(stickerDetailCurrent.name) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">英文名称</span>
                <span class="material-detail-value">{{ formatDetailValue(stickerDetailCurrent.nameEn) }}</span>
              </div>
              <div class="material-detail-field material-detail-field--wide">
                <span class="material-detail-label">描述</span>
                <span class="material-detail-value material-detail-value--multiline">{{ formatDetailValue(stickerDetailCurrent.description) }}</span>
              </div>
              <div class="material-detail-field material-detail-field--wide">
                <span class="material-detail-label">英文描述</span>
                <span class="material-detail-value material-detail-value--multiline">{{ formatDetailValue(stickerDetailCurrent.descriptionEn) }}</span>
              </div>
              <div class="material-detail-field material-detail-field--wide">
                <span class="material-detail-label">关键词</span>
                <span class="material-detail-value material-detail-value--multiline">{{ formatDetailValue(stickerDetailCurrent.keywords) }}</span>
              </div>
              <div class="material-detail-field material-detail-field--wide">
                <span class="material-detail-label">英文关键词</span>
                <span class="material-detail-value material-detail-value--multiline">{{ formatDetailValue(stickerDetailCurrent.keywordsEn) }}</span>
              </div>
              <div class="material-detail-field material-detail-field--wide">
                <span class="material-detail-label">适用场景</span>
                <span class="material-detail-value material-detail-value--multiline">{{ formatDetailValue(stickerDetailCurrent.suitableFor) }}</span>
              </div>
            </div>
          </section>

          <section class="material-detail-section">
            <div class="material-detail-section__title">图片信息</div>
            <div class="material-detail-grid">
              <div class="material-detail-field">
                <span class="material-detail-label">图片尺寸</span>
                <span class="material-detail-value">
                  {{
                    stickerDetailCurrent.width && stickerDetailCurrent.height
                      ? `${stickerDetailCurrent.width} × ${stickerDetailCurrent.height}`
                      : "-"
                  }}
                </span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">宽高比</span>
                <span class="material-detail-value">{{ formatAspectRatio(stickerDetailCurrent.aspectRatio) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">文件大小</span>
                <span class="material-detail-value">{{ formatDetailFileSize(stickerDetailCurrent.fileSize) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">色系</span>
                <span class="material-detail-value">
                  <span v-if="stickerDetailCurrent.colorPalette" class="material-detail-palette">
                    <span
                      v-for="color in stickerDetailCurrent.colorPalette.split(',').slice(0, 12)"
                      :key="color"
                      class="material-detail-swatch"
                      :style="{ backgroundColor: color.trim() }"
                      :title="color.trim()"
                    />
                  </span>
                  <span v-else>-</span>
                </span>
              </div>
              <div class="material-detail-field material-detail-field--wide">
                <span class="material-detail-label">图片链接</span>
                <span class="material-detail-value material-detail-value--break">{{ formatDetailValue(stickerDetailCurrent.url) }}</span>
              </div>
              <div class="material-detail-field material-detail-field--wide">
                <span class="material-detail-label">原始地址</span>
                <span class="material-detail-value material-detail-value--break">{{ formatDetailValue(stickerDetailCurrent.originUrl) }}</span>
              </div>
              <div class="material-detail-field material-detail-field--wide">
                <span class="material-detail-label">来源</span>
                <span class="material-detail-value material-detail-value--break">{{ formatDetailValue(stickerDetailCurrent.source) }}</span>
              </div>
              <div class="material-detail-field material-detail-field--wide">
                <span class="material-detail-label">感知哈希</span>
                <span class="material-detail-value material-detail-value--break">{{ formatDetailValue(stickerDetailCurrent.phash) }}</span>
              </div>
            </div>
          </section>

          <section class="material-detail-section">
            <div class="material-detail-section__title">状态与时间</div>
            <div class="material-detail-grid">
              <div class="material-detail-field">
                <span class="material-detail-label">公开</span>
                <span class="material-detail-value">{{ formatBooleanDetail(stickerDetailCurrent.isPublic) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">材质</span>
                <span class="material-detail-value">{{ formatBooleanDetail(stickerDetailCurrent.isTexture) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">自定义贴纸</span>
                <span class="material-detail-value">{{ formatBooleanDetail(stickerDetailCurrent.isCustom) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">侵权</span>
                <span class="material-detail-value">{{ formatBooleanDetail(stickerDetailCurrent.isInfringement) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">抠图</span>
                <span class="material-detail-value">{{ formatBooleanDetail(stickerDetailCurrent.isCutout) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">无缝贴图</span>
                <span class="material-detail-value">{{ formatBooleanDetail(stickerDetailCurrent.seamless) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">创建时间</span>
                <span class="material-detail-value">{{ formatDetailDate(stickerDetailCurrent.createTime) }}</span>
              </div>
              <div class="material-detail-field">
                <span class="material-detail-label">修改时间</span>
                <span class="material-detail-value">{{ formatDetailDate(stickerDetailCurrent.updateTime) }}</span>
              </div>
            </div>
          </section>

          <section class="material-detail-section">
            <div class="material-detail-section__title">元数据</div>
            <vue-json-pretty v-if="parsedDetailMetaData" :data="parsedDetailMetaData" />
            <pre v-else class="material-detail-raw">{{ formatDetailValue(stickerDetailCurrent.meta, "暂无元数据") }}</pre>
          </section>

          <section class="material-detail-section">
            <div class="material-detail-section__title">完整详情 JSON</div>
            <vue-json-pretty :data="stickerDetailJsonData" />
          </section>
        </template>
      </div>
      <template #footer>
        <div class="edit-dialog-footer">
          <el-button size="small" @click="detailDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="aiGenDialogVisible"
      title="AI自动生成内容"
      width="1000px"
      align-center
      :destroy-on-close="true"
    >
      <div class="ai-gen-form">
        <div class="form-section">
          <label class="section-label">原始信息（可选）</label>
          <div class="section-desc">粘贴网页内容或其他原始信息，帮助AI更好地理解图片内容</div>
          <el-input
            v-model="aiGenerateRawInfo"
            type="textarea"
            :rows="10"
            placeholder="如：网页上关于这张图片的描述、产品介绍等..."
            style="font-size: 14px; min-height: 200px; width: 100%; resize: vertical"
          />
        </div>

        <div class="form-section">
          <label class="section-label">分析风格（可选）</label>
          <div class="section-desc">请输入你希望AI分析的内容风格或角度</div>
          <el-input
            v-model="aiGenPrompt"
            type="textarea"
            :rows="10"
            placeholder="如：请用艺术化语言描述图片内容、突出色彩特点等..."
            style="font-size: 14px; min-height: 200px; width: 100%; resize: vertical"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog"
          >确定</el-button
        >
      </template>
    </el-dialog>

    <el-dialog
      v-model="metaDialogVisible"
      fullscreen
      title="元数据详情"
      :close-on-click-modal="false"
    >
      <div v-if="metaDialogContent">
        <vue-json-pretty v-if="parsedMetaData" :data="parsedMetaData" />
        <div v-else class="meta-error">
          <el-alert
            type="warning"
            :closable="false"
            show-icon
            title="元数据格式错误"
            description="无法解析元数据，请检查数据格式。"
          />
          <div class="meta-raw-content">
            <pre>{{ metaDialogContent }}</pre>
          </div>
        </div>
      </div>
      <div v-else class="meta-empty">
        <el-empty description="该素材没有元数据信息" />
      </div>
    </el-dialog>

    <el-dialog
      v-model="stickerUserTransferDialogVisible"
      :title="stickerUserTransferDialogTitle"
      width="560px"
      align-center
      :close-on-click-modal="false"
      @closed="resetStickerUserTransferDialog"
    >
      <div class="sticker-user-transfer-dialog">
        <el-alert
          :type="stickerUserTransferAction === 'copy' ? 'success' : 'warning'"
          :closable="false"
          show-icon
          :title="
            stickerUserTransferAction === 'copy'
              ? '复制素材并分享给目标用户，原素材会保留。'
              : '转移素材给目标用户，会变更素材归属并同步调整 COS 路径。'
          "
        />

        <el-form label-width="96px" class="sticker-user-transfer-form">
          <el-form-item label="目标用户" required>
            <el-select
              v-model="stickerUserTransferTargetUserId"
              class="sticker-user-transfer-form__select"
              filterable
              clearable
              :loading="stickerUserTransferUsersLoading"
              placeholder="请选择目标用户"
            >
              <el-option
                v-for="item in stickerUserTransferUserOptions"
                :key="item.id"
                :label="item.label"
                :value="item.id"
              >
                <div class="sticker-user-transfer-option">
                  <div class="sticker-user-transfer-option__main">
                    <span>{{ item.name || item.account || `用户 #${item.id}` }}</span>
                    <el-tag v-if="item.isAdmin" size="small" type="warning">管理员</el-tag>
                  </div>
                  <span class="sticker-user-transfer-option__meta">
                    {{ item.account || `ID ${item.id}` }}
                  </span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="素材数量">
            <el-tag type="info">{{ stickerUserTransferIds.length }}</el-tag>
          </el-form-item>

          <el-form-item label="选中素材">
            <div class="sticker-user-transfer-preview">
              <el-tag
                v-for="item in stickerUserTransferPreviewItems"
                :key="item.id"
                size="small"
                effect="plain"
              >
                {{ item.label }}
              </el-tag>
              <span
                v-if="stickerUserTransferIds.length > stickerUserTransferPreviewItems.length"
                class="sticker-user-transfer-preview__more"
              >
                等 {{ stickerUserTransferIds.length }} 条
              </span>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="stickerUserTransferDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="stickerUserTransferSubmitting"
          @click="submitStickerUserTransfer"
        >
          {{ stickerUserTransferSubmitText }}
        </el-button>
      </template>
    </el-dialog>

    <!-- SVG转PNG尺寸设置弹窗 -->
    <el-dialog
      v-model="svgToPngDialogVisible"
      title="SVG转PNG - 设置输出尺寸"
      width="500px"
      align-center
      :destroy-on-close="true"
    >
      <div class="svg-to-png-form">
        <div class="form-section">
          <h4 class="section-title">输出尺寸设置</h4>
          <div
            class="original-info"
            v-if="svgToPngForm.originalWidth && svgToPngForm.originalHeight"
          >
            <el-tag type="info" size="small">
              原始尺寸: {{ svgToPngForm.originalWidth }} ×
              {{ svgToPngForm.originalHeight }} (宽高比: {{ svgToPngForm.aspectRatio.toFixed(2) }})
            </el-tag>
          </div>
          <el-form :model="svgToPngForm" label-width="120px">
            <el-form-item label="输出宽度 (px)">
              <el-input-number
                v-model="svgToPngForm.width"
                :min="64"
                :max="4096"
                :step="64"
                controls-position="right"
                style="width: 200px"
                @change="handleWidthChange"
              />
            </el-form-item>
            <el-form-item label="自动计算高度">
              <el-tag type="info" size="large"> {{ svgToPngForm.height }} px </el-tag>
              <span class="aspect-ratio-info">
                (基于原始宽高比 {{ svgToPngForm.aspectRatio.toFixed(2) }} 自动计算)
              </span>
            </el-form-item>
          </el-form>
        </div>

        <div class="preset-section">
          <h4 class="section-title">常用尺寸预设</h4>
          <div class="preset-buttons">
            <el-button
              v-for="preset in sizePresets"
              :key="preset.name"
              size="small"
              @click="applyPreset(preset)"
            >
              {{ preset.name }}<br />
              <span class="preset-size">{{ preset.width }}px</span>
            </el-button>
          </div>
        </div>

        <div class="preview-section">
          <h4 class="section-title">预览信息</h4>
          <div class="preview-info">
            <el-tag type="info" size="large">
              输出尺寸: {{ svgToPngForm.width }} × {{ svgToPngForm.height }} px
            </el-tag>
            <el-tag type="success" size="large" style="margin-left: 8px">
              文件大小: 约
              {{ Math.round((svgToPngForm.width * svgToPngForm.height * 4) / 1024) }} KB
            </el-tag>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="svgToPngDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSvgToPng">开始转换</el-button>
      </template>
    </el-dialog>

    <RelatedPsdSetDialog ref="relatedPsdSetDialogRef" />
    <el-dialog
      v-model="storyScriptDialogVisible"
      fullscreen
      destroy-on-close
      class="story-script-dialog"
      :title="`故事脚本 - ${storyScriptCurrentSticker?.name || '素材图'}`"
    >
      <div
        class="grid h-[calc(100vh-96px)] min-h-0 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]"
      >
        <aside class="min-h-0 overflow-hidden rounded-2xl border shadow-sm">
          <div class="flex h-full min-h-0 flex-col overflow-hidden">
            <div class="border-b px-5 py-4">
              <div class="text-base font-semibold">脚本列表</div>
              <div class="mt-1 text-xs opacity-70">选择一个版本，在右侧查看内容和操作。</div>
            </div>

            <div v-if="storyScriptCurrentSticker" class="border-b px-5 py-4 text-sm">
              <div class="truncate font-medium">
                {{ storyScriptCurrentSticker.name || "未命名素材" }}
              </div>
              <div class="mt-2 line-clamp-3 text-xs opacity-70">
                {{
                  storyScriptCurrentSticker.description ||
                  storyScriptCurrentSticker.keywords ||
                  "暂无素材补充信息"
                }}
              </div>
            </div>

            <div
              v-if="!storyScriptList.length && !storyScriptListLoading"
              class="flex flex-1 items-center justify-center px-4"
            >
              <el-empty description="暂无脚本" :image-size="88" />
            </div>

            <div v-else class="flex-1 overflow-y-auto p-3">
              <button
                v-for="item in storyScriptList"
                :key="item.id"
                type="button"
                class="mb-3 block w-full rounded-xl border px-4 py-3 text-left transition last:mb-0"
                :class="selectedStoryScript?.id === item.id ? 'border-primary' : ''"
                @click="selectedStoryScriptId = item.id"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0 truncate text-sm font-medium">
                    {{ item.title || `版本 ${item.versionNo}` }}
                  </div>
                </div>
                <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-70">
                  <span>v{{ item.versionNo }}</span>
                  <span>{{ item.sceneType }}</span>
                </div>
                <div class="mt-2 line-clamp-3 text-xs leading-5 opacity-80">
                  {{ item.content || "暂无正文" }}
                </div>
              </button>
            </div>
          </div>
        </aside>

        <section
          class="min-h-0 overflow-hidden rounded-2xl border shadow-sm"
          v-loading="storyScriptListLoading"
        >
          <div class="flex h-full min-h-0 flex-col overflow-hidden">
            <div class="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div class="min-h-0 px-6 py-5 xl:border-r">
                <div v-if="!selectedStoryScript" class="flex h-full items-center justify-center">
                  <el-empty description="请选择左侧版本或先生成脚本" />
                </div>

                <div v-else class="flex h-full min-h-0 flex-col">
                  <div class="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <h3 class="break-words text-lg font-semibold">
                          {{ selectedStoryScript.title || `版本 ${selectedStoryScript.versionNo}` }}
                        </h3>
                        <el-tag effect="plain">{{
                          selectedStoryScript.status || "generated"
                        }}</el-tag>
                      </div>
                      <div class="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs opacity-70">
                        <span>版本 v{{ selectedStoryScript.versionNo }}</span>
                        <span>场景 {{ selectedStoryScript.sceneType }}</span>
                        <span>{{
                          selectedStoryScript.createTime
                            ? formatTimestamp(selectedStoryScript.createTime)
                            : ""
                        }}</span>
                      </div>
                    </div>

                    <div class="flex flex-wrap gap-2">
                      <el-button
                        size="small"
                        @click="handleCopyStoryScript(selectedStoryScript.content, '正文')"
                        >复制正文</el-button
                      >
                      <el-button
                        v-if="selectedStoryScript.subtitleContent"
                        size="small"
                        @click="
                          handleCopyStoryScript(selectedStoryScript.subtitleContent, '字幕稿')
                        "
                        >复制字幕</el-button
                      >
                      <el-button
                        size="small"
                        type="danger"
                        plain
                        @click="handleDeleteStoryScript(selectedStoryScript)"
                        >删除</el-button
                      >
                    </div>
                  </div>

                  <div class="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                    <div class="rounded-2xl border p-4">
                      <div class="mb-2 text-xs font-medium uppercase tracking-wide opacity-60">
                        正文
                      </div>
                      <div class="whitespace-pre-wrap break-words text-[15px] leading-7">
                        {{ selectedStoryScript.content || "-" }}
                      </div>
                    </div>

                    <div
                      v-if="selectedStoryScript.subtitleContent"
                      class="mt-4 rounded-2xl border p-4"
                    >
                      <div class="mb-2 text-xs font-medium uppercase tracking-wide opacity-60">
                        字幕稿
                      </div>
                      <pre class="whitespace-pre-wrap break-words font-sans text-sm leading-7">{{
                        selectedStoryScript.subtitleContent
                      }}</pre>
                    </div>

                    <div
                      v-if="selectedStoryScript.hashtags"
                      class="mt-4 rounded-2xl border p-4 text-sm"
                    >
                      <div class="mb-2 text-xs font-medium uppercase tracking-wide opacity-60">
                        标签
                      </div>
                      <div class="break-all">{{ selectedStoryScript.hashtags }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="min-h-0 border-t px-6 py-5 xl:border-t-0 xl:border-l">
                <div class="h-full overflow-y-auto pl-0 xl:pl-1">
                  <div class="mb-4">
                    <div class="text-base font-semibold">生成配置</div>
                    <div class="mt-1 text-xs opacity-70">
                      填写右侧控制条件后生成新版本故事脚本。
                    </div>
                  </div>

                  <el-form label-position="top" class="space-y-1">
                    <el-form-item label="使用场景">
                      <el-select v-model="storyScriptForm.sceneType" class="w-full">
                        <el-option label="社交平台文案" value="social_post" />
                        <el-option label="短视频字幕" value="short_video_subtitle" />
                        <el-option label="口播脚本" value="voiceover" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="风格要求">
                      <el-input
                        v-model="storyScriptForm.stylePrompt"
                        type="textarea"
                        :rows="4"
                        resize="vertical"
                      />
                    </el-form-item>
                    <el-form-item label="语气要求">
                      <el-input
                        v-model="storyScriptForm.tonePrompt"
                        type="textarea"
                        :rows="4"
                        resize="vertical"
                      />
                    </el-form-item>
                    <el-form-item label="长度要求">
                      <el-input v-model="storyScriptForm.lengthPrompt" />
                    </el-form-item>
                    <el-form-item label="补充要求">
                      <el-input
                        v-model="storyScriptForm.extraPrompt"
                        type="textarea"
                        :rows="8"
                        resize="vertical"
                      />
                    </el-form-item>
                  </el-form>

                  <div class="mt-4 flex flex-col gap-3">
                    <el-button
                      type="primary"
                      class="!ml-0 w-full"
                      :loading="storyScriptSubmitting"
                      @click="handleGenerateStoryScript"
                    >
                      生成故事脚本
                    </el-button>
                    <el-button class="!ml-0 w-full" @click="refreshStoryScriptList"
                      >刷新列表</el-button
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </el-dialog>

    <!-- PSD套图参数查看弹窗 -->
    <el-dialog
      v-model="psdSetParamsDialogVisible"
      title="PSD套图发送参数"
      width="80%"
      :destroy-on-close="true"
      align-center
    >
      <div class="psd-params-viewer">
        <pre class="params-content">{{ psdSetParamsContent }}</pre>
      </div>
      <template #footer>
        <el-button @click="psdSetParamsDialogVisible = false">关闭</el-button>
        <el-button
          type="primary"
          @click="() => { (navigator as any).clipboard.writeText(psdSetParamsContent); ElMessage.success('已复制到剪贴板') }"
          >复制参数</el-button
        >
      </template>
    </el-dialog>

    <!-- 图片预览弹窗 -->
    <ImagePreview
      :visible="imagePreviewVisible"
      :image-url="currentImageUrl"
      @close="closeImagePreview"
    />

    <el-dialog v-model="publishUsageDialogVisible" title="图片发布绑定" width="920px" :destroy-on-close="true">
      <div v-loading="publishUsageLoading" class="publish-usage-dialog">
        <el-empty v-if="!publishUsageLoading && !publishUsageRecords.length" description="暂无发布绑定" />
        <vxe-grid v-else v-bind="publishUsageGridOptions" :data="publishUsageRecords">
          <template #usageImageSlot="{ row }">
            <el-image
              v-if="row.imageUrl"
              :src="row.imageUrl"
              fit="cover"
              class="publish-usage-image"
              :preview-src-list="[row.imageUrl]"
              :preview-teleported="true"
            />
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
  </ContentWrap>
</template>

<script setup lang="tsx">
import {
  ref,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  watch,
  handleError,
  watchEffect,
  nextTick,
} from "vue";
import { gridRef, resetCheckStatus } from "./selection";

import {
  getMaterialList,
  deleteAssetLibrary,
  checkAssetLibrary,
  pullAsset,
  materialDistribute,
  getMaterialDetail,
  handleDropMaterial,
  aiAutoGenerateMaterialInfo,
  updateAssetLibrary,
  generateImageInfo, // 新增
  generateStickerCode,
  batchMoveStickers,
  getStickerFolderTree,
  uploadMaterialFile,
  copyStickers,
  copyStickersToUser,
  moveStickersToUser,
  getStickerById,
  trimPng,
  svgToPng,
  generateStickerStoryScript,
  getStickerStoryScriptList,
  deleteStickerStoryScript,
  searchStickerByImage,
  searchStickerByText,
} from "@/api/material"; // 实际接口导入

import { uploadToCOS } from "@/api/cos";
import { stickerPsdSetApi } from "@/api/stickerPsdSet";

import { buildOperationColumn, commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import CryptoJS from "crypto-js";

import {
  useDebounceFn,
  useLocalStorage,
  useSessionStorage,
  useWindowSize,
  useMouse,
} from "@vueuse/core";
import { sortTypeOptions, defaultSortingValue } from "@/common/sort";
import { saveAs } from "file-saver";

import { useUserStore } from "@/store/modules/user";
import listUpload from "./listUpload.vue";

import { ElButton, ElNotification, ElMessage, ElMessageBox } from "element-plus";
import { isQueuedAiTaskResult, notifyQueuedAiTask, unwrapAiTaskResult } from "@/utils/aiTask";
import {
  Delete,
  Plus,
  Search,
  Loading,
  Check,
  More,
  InfoFilled,
  ArrowRight,
  ArrowLeft,
  Edit,
  Picture,
  UploadFilled,
  MagicStick,
  Key,
  Document,
  Warning,
  PictureFilled,
  DocumentCopy,
  RefreshLeft,
  Folder,
  Files,
  DArrowLeft,
  DArrowRight,
} from "@element-plus/icons-vue";
import tree from "./tree.vue";
import { materialStatusOptions } from ".";
import { psdTemplateApi } from "@/api/psdTemplate";
import { formatDate } from "@/utils/formatTime";
import { getTitleTemplateList } from "@/api/publish";
import { downloadCrossOriginImage, downloadFileByElement, downloadImage } from "@/common/download";
import { getConfigTemplateList } from "@/api/publish/config";
import { getPublishConfigListApi } from "@/api/product/publishConfig";
import { productGenerationTemplateApi } from "@/api/product-generation-template";
import genPicture from "./genPicture.vue";
import { getAccessToken } from "@/utils/auth";
import { getTenantId } from "@/utils/auth";
import { buildImageProcessingRouteLocation } from "@/utils/imageProcessingRoute";
import { getUserList } from "@/api/user";
import { getDesignModelList } from "@/api/designModel";
import request from "@/config/axios";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import { getFastPreviewImageUrl, getPreviewImageUrl, getRotatedImageUrl } from "@/utils/image";
import {
  SIZE_SHAPE_GROUPS,
  getFullLabel,
  getSizeShapeByRatio,
  getSizeShapeUiConfig,
} from "./sizeShapeConfig";
import { useFolderRowDrag } from "@/hooks/useFolderRowDrag";
import RelatedPsdSetDialog from "./RelatedPsdSetDialog.vue";
import FolderTree from "@/components/material/FolderTree.vue";
import TableRowDragHandle from "@/components/TableRowDragHandle/index.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import ImageGroupView from "../imageGroup/index.vue";
import { imageGroupApi, type ImageGroupItem } from "@/api/imageGroup";
import { FOLDER_FILTER } from "@/constants/folder";
import { derivePublishTaskTypeByPlatform, getTaskTypeLabel } from "@/config/task-types";

const userStore = useUserStore();
const router = useRouter();
const FOLDER_CATEGORY = "sticker";

// 判断是否为管理员
const isAdmin = computed(() => userStore.user?.isAdmin ?? false);
const visualSimilarSearchDisabled = false;
const phashSearchDisabled = true;
const VISUAL_SIMILAR_SEARCH_DISABLED_MESSAGE = "模糊搜索功能暂时禁用";
const PHASH_SEARCH_DISABLED_MESSAGE = "pHash 相似匹配功能暂时禁用";

type StickerUserTransferAction = "copy" | "move";
type StickerUserTransferUserOption = {
  id: string;
  name: string;
  account: string;
  label: string;
  isAdmin: boolean;
};

const storyScriptDialogVisible = ref(false);
const storyScriptSubmitting = ref(false);
const storyScriptListLoading = ref(false);
const storyScriptCurrentSticker = ref<any>(null);
const storyScriptList = ref<any[]>([]);
const selectedStoryScriptId = ref("");
const selectedStoryScript = computed(() => {
  if (!storyScriptList.value.length) return null;
  return (
    storyScriptList.value.find((item) => item.id === selectedStoryScriptId.value) ||
    storyScriptList.value[0]
  );
});
const storyScriptForm = reactive({
  sceneType: "social_post",
  stylePrompt: "真实自然，有画面感，适合社交平台传播",
  tonePrompt: "口语化、有温度、不要营销腔",
  lengthPrompt: "120字以内",
  extraPrompt: "",
});

async function openStoryScriptDialog(row: any) {
  storyScriptCurrentSticker.value = row;
  storyScriptDialogVisible.value = true;
  storyScriptForm.sceneType = "social_post";
  storyScriptForm.stylePrompt = "真实自然，有画面感，适合社交平台传播";
  storyScriptForm.tonePrompt = "口语化、有温度、不要营销腔";
  storyScriptForm.lengthPrompt = "120字以内";
  storyScriptForm.extraPrompt = "";
  await loadStoryScriptList(row.id);
}

async function loadStoryScriptList(stickerId?: string) {
  const currentStickerId = stickerId || storyScriptCurrentSticker.value?.id;
  if (!currentStickerId) {
    storyScriptList.value = [];
    return;
  }
  storyScriptListLoading.value = true;
  try {
    const result = await getStickerStoryScriptList({ stickerId: currentStickerId });
    storyScriptList.value = Array.isArray(result) ? result : [];
    selectedStoryScriptId.value = storyScriptList.value[0]?.id || "";
  } catch (error: any) {
    storyScriptList.value = [];
    selectedStoryScriptId.value = "";
    ElMessage.error(error?.message || "获取故事脚本列表失败");
  } finally {
    storyScriptListLoading.value = false;
  }
}

async function refreshStoryScriptList() {
  await loadStoryScriptList();
}

async function handleGenerateStoryScript() {
  if (!storyScriptCurrentSticker.value?.id) {
    ElMessage.warning("请先选择素材图");
    return;
  }
  storyScriptSubmitting.value = true;
  try {
    await generateStickerStoryScript({
      stickerId: storyScriptCurrentSticker.value.id,
      sceneType: storyScriptForm.sceneType,
      stylePrompt: storyScriptForm.stylePrompt,
      tonePrompt: storyScriptForm.tonePrompt,
      lengthPrompt: storyScriptForm.lengthPrompt,
      extraPrompt: storyScriptForm.extraPrompt,
    });
    ElMessage.success("故事脚本生成成功");
    await loadStoryScriptList();
  } catch (error: any) {
    ElMessage.error(error?.message || "故事脚本生成失败");
  } finally {
    storyScriptSubmitting.value = false;
  }
}

async function handleDeleteStoryScript(item: any) {
  try {
    await ElMessageBox.confirm("确认删除该故事脚本版本吗？", "删除确认", { type: "warning" });
    await deleteStickerStoryScript(item.id);
    ElMessage.success("删除成功");
    await loadStoryScriptList();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "删除故事脚本失败");
    }
  }
}

async function handleCopyStoryScript(text: string, label: string) {
  if (!text) {
    ElMessage.warning(label + "为空");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success(label + "已复制");
  } catch (error) {
    ElMessage.error(label + "复制失败");
  }
}

// 尺寸形状配置
const sizeShapeGroups = SIZE_SHAPE_GROUPS;

// 抠图模式标签映射
const getCutoutModeLabel = (mode: string) => {
  const map = {
    CUTOUT: "抠图",
    NON_CUTOUT: "非抠图",
  };
  return map[mode] || mode;
};

const form = ref({});

const { height } = useWindowSize();
const maxHeight = ref(0);

watchEffect(() => {
  maxHeight.value = height.value - 260;
});

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  keyword: "",
  searchText: "", // 多字段搜索（名称、描述、关键词等）
  sortingFields: "createTime DESC", // 排序字段
  startTime: "",
  endTime: "",
  suffix: [], // 新增后缀参数（支持多选）
  id: "", // 新增ID精确查询参数
  phash: "", // phash值或直接输入图片地址
  phashMode: "range", // range | exact
  isCustom: "" as boolean | string, // 空字符串表示"全部"，请求时转为 null
  isInfringement: "" as boolean | string,
  isCutout: "" as boolean | string,
  seamless: "" as boolean | string,
  sizeShape: [] as string[], // 尺寸形状：landscape(横图) | portrait(竖图) | square(正方图) | ultra-wide | wide | slightly-wide | slightly-long | long | ultra-long（支持多选）
  random: false, // 是否随机
  folderId: FOLDER_FILTER.ALL as string | null | undefined, // 文件夹ID
  publishUsageConfigId: [] as string[],
});

const vectorSimilarSearchActive = ref(false);
const similarImageSearchMeta = ref<any>(null);
const similarImageSearchLimit = ref(10); // 检索数量默认 10
const similarImageDialogVisible = ref(false);
const similarImageSearchTab = useLocalStorage<"url" | "file" | "text">(
  "material_similar_image_search_tab",
  "url",
);
const similarImageUrl = ref("");
const similarImageFile = ref<File | null>(null);
const similarImageFileName = ref("");
const similarImageFilePreviewUrl = ref("");
const similarImageSubmitting = ref(false);
const similarImageActivePreviewUrl = ref("");
const similarImageActiveSourceType = ref<"url" | "file" | "text" | "">("");
const similarImageActiveSourceLabel = ref("");
const similarImageSearchText = ref("");
const similarImagePreviewSrc = computed(() => {
  if (similarImageSearchTab.value === "url") {
    return similarImageUrl.value.trim();
  }
  if (similarImageSearchTab.value === "text") {
    return "";
  }
  return similarImageFilePreviewUrl.value;
});
const similarImageSearchStatusVisible = computed(
  () =>
    vectorSimilarSearchActive.value &&
    (Boolean(similarImageActivePreviewUrl.value) ||
      similarImageActiveSourceType.value === "text"),
);
const similarImageActiveSourceText = computed(() => {
  if (similarImageActiveSourceType.value === "file") {
    return similarImageActiveSourceLabel.value
      ? `本地图片：${similarImageActiveSourceLabel.value}`
      : "本地图片";
  }
  if (similarImageActiveSourceType.value === "url") {
    return similarImageActiveSourceLabel.value || "图片 URL";
  }
  if (similarImageActiveSourceType.value === "text") {
    return `文字搜索：${similarImageActiveSourceLabel.value}`;
  }
  return "查询图片";
});

const publishUsageConfigOptions = ref<any[]>([]);
const publishUsageDialogVisible = ref(false);
const publishUsageLoading = ref(false);
const publishUsageRecords = ref<any[]>([]);

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
  taobao: "淘宝",
  pdd: "拼多多",
};

function formatPlatformName(platform?: string) {
  return publishPlatformNameMap[String(platform || "")] || String(platform || "-");
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

function handlePublishUsageViewChange() {
  queryParams.currentPage = 1;
  getList();
}

const isAllSelected = computed(() => {
  return (
    publishUsageConfigOptions.value.length > 0 &&
    queryParams.publishUsageConfigId.length === publishUsageConfigOptions.value.length
  );
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    queryParams.publishUsageConfigId = [];
  } else {
    queryParams.publishUsageConfigId = publishUsageConfigOptions.value.map((item) => item.id);
  }
  queryParams.currentPage = 1;
  getList();
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

async function handleViewPublishUsageRecords(row: any) {
  const stickerId = String(row?.id || "").trim();
  const imageUrl = String(row?.url || row?.originUrl || "").trim();
  if (!stickerId && !imageUrl) {
    return ElMessage.warning("缺少图片ID，无法查看发布绑定");
  }
  publishUsageDialogVisible.value = true;
  publishUsageLoading.value = true;
  publishUsageRecords.value = [];
  try {
    const res = await stickerPsdSetApi.getPublishUsageRecords({
      stickerId: stickerId || undefined,
      imageUrl: stickerId ? undefined : imageUrl,
    });
    publishUsageRecords.value = Array.isArray(res)
      ? res
      : Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];
  } catch (error: any) {
    console.error("获取发布绑定失败:", error);
    ElMessage.error(error?.message || "获取发布绑定失败");
    publishUsageDialogVisible.value = false;
  } finally {
    publishUsageLoading.value = false;
  }
}

// 尺寸形状选项配置
const sizeShapeOptions = {
  landscape: { label: "横图", thumbClass: "landscape-thumb" },
  portrait: { label: "竖图", thumbClass: "portrait-thumb" },
  square: { label: "正方图", thumbClass: "square-thumb" },
  "ultra-wide": { label: "超宽图 (≥2:1)", thumbClass: "ultra-wide-thumb" },
  wide: { label: "宽图 (1.5:1 - 2:1)", thumbClass: "wide-thumb" },
  "slightly-wide": { label: "微宽图 (1.1:1 - 1.5:1)", thumbClass: "slightly-wide-thumb" },
  "slightly-long": { label: "微长图 (1:1.1 - 1:1.5)", thumbClass: "slightly-long-thumb" },
  long: { label: "长图 (1:1.5 - 1:2)", thumbClass: "long-thumb" },
  "ultra-long": { label: "超长图 (≤1:2)", thumbClass: "ultra-long-thumb" },
};

// 展示模式见 ./selection.ts

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// 获取格式标签类型
function getFormatTagType(suffix: string): string {
  const typeMap: Record<string, string> = {
    png: "success",
    jpg: "",
    jpeg: "",
    svg: "warning",
    gif: "info",
    webp: "",
    psd: "danger",
  };
  return typeMap[suffix?.toLowerCase()] || "info";
}

const gridOptions = computed(() => {
  const showSimilarityColumn =
    vectorSimilarSearchActive.value || Boolean(String(queryParams.phash || "").trim());
  const baseColumns = [
    {
      title: "",
      field: "dragHandle",
      width: 34,
      showOverflow: false,
      align: "center" as const,
      slots: {
        default: "dragHandleSlot",
      },
    },
    {
      type: "checkbox" as const,
      field: "checkbox",
      title: "",
      width: 42,
      ellipsis: true,
      reserve: true,
      minWidth: 42,
      className: "" as any,
    },
    {
      title: "预览图",
      field: "url",
      width: 128,
      slots: { default: "previewDefaultSlot" },
    },
    {
      title: "素材",
      field: "name",
      minWidth: 220,
      className: "font-bold",
      slots: { default: "compactNameSlot" },
    },
    {
      title: "编码",
      field: "code",
      width: 100,
      slots: { default: "codeSlot" },
    },
    {
      title: "文件信息",
      field: "fileInfo",
      minWidth: 200,
      slots: { default: "fileInfoSlot" },
    },
    {
      title: "抠图",
      field: "isCutout",
      width: 72,
      slots: { default: "cutoutSlot" },
    },
    {
      title: "文件夹",
      field: "folder",
      minWidth: 140,
      formatter: ({ cellValue }: any) => cellValue || "根目录",
    },
    {
      title: "创建时间",
      field: "createTime",
      width: 150,
      className: "table-time-cell",
      formatter: ({ cellValue }: any) => (cellValue ? formatTimestamp(cellValue) : "-"),
    },
    {
      title: "修改时间",
      field: "updateTime",
      width: 150,
      className: "table-time-cell",
      formatter: ({ cellValue }: any) => (cellValue ? formatTimestamp(cellValue) : "-"),
    },
    ...(showSimilarityColumn
      ? [
          {
            title: "相似度",
            field: "similarity",
            width: 80,
            slots: { default: "similaritySlot" },
          },
        ]
      : []),
  ];

  const operationColumn = buildOperationColumn("operationDefaultSlot");

  return {
    ...commonGridOptions,
    maxHeight: maxHeight.value,
    rowConfig: {
      keyField: "id",
    },
    checkboxConfig: {
      reserve: true,
    },
    columns: [...baseColumns, operationColumn],
  };
});

const dataSource = ref([]);
const stickerDetailCache = new Map<string, any>();
const selectedMaterialCache = reactive<Record<string, any>>({});
const loading = ref(false);
const deleteLoading = ref(false);
const activeOperationRowId = ref("");
const operationCommandLoadingId = ref("");
const operationDropdownRefs = new Map<string, any>();
const open = ref(false);
const title = ref("");
const ids = ref<string[]>([]);
const materialViewMode = useLocalStorage<"single" | "group">(
  "material_view_mode",
  "single",
);
const addToGroupDialogVisible = ref(false);
const availableGroupsLoading = ref(false);
const addingToGroup = ref(false);
const targetGroupValue = ref("");
const batchSlotType = ref("");
const availableGroupList = ref<ImageGroupItem[]>([]);
const selectedGroupStickerIds = ref<string[]>([]);
const preferredTargetGroup = ref<ImageGroupItem | null>(null);
const selectedTargetGroup = computed(
  () => availableGroupList.value.find((group) => group.id === targetGroupValue.value) || null,
);

function handleGroupAddStickers(group: ImageGroupItem) {
  preferredTargetGroup.value = group;
  materialViewMode.value = "single";
  ElMessage.info(`目标组图已设为“${group.name}”`);
}

function getGroupPreviewUrls(group: ImageGroupItem) {
  return group.stickers.map((item) => item.url).filter((url): url is string => Boolean(url));
}

async function openBatchAddToGroupDialog() {
  if (!ids.value.length) {
    ElMessage.warning("请先勾选需要添加到组图的素材");
    return;
  }
  if (ids.value.length > 200) {
    ElMessage.warning("单次最多添加 200 张素材");
    return;
  }

  selectedGroupStickerIds.value = [...ids.value];
  targetGroupValue.value = preferredTargetGroup.value?.id || "";
  batchSlotType.value = "";
  addToGroupDialogVisible.value = true;
  availableGroupsLoading.value = true;

  try {
    const result = await imageGroupApi.page({ pageNo: 1, pageSize: 100 });
    availableGroupList.value = result.list || [];
    if (
      preferredTargetGroup.value &&
      !availableGroupList.value.some((group) => group.id === preferredTargetGroup.value?.id)
    ) {
      availableGroupList.value.unshift(preferredTargetGroup.value);
    }
  } catch (error: any) {
    availableGroupList.value = preferredTargetGroup.value ? [preferredTargetGroup.value] : [];
    ElMessage.error(error?.message || "加载组图列表失败");
  } finally {
    availableGroupsLoading.value = false;
  }
}

async function submitBatchAddToGroup() {
  const targetValue = targetGroupValue.value.trim();
  if (!targetValue) {
    ElMessage.warning("请选择目标组图或输入新组图名称");
    return;
  }
  if (!selectedGroupStickerIds.value.length) {
    ElMessage.warning("没有待添加的素材");
    return;
  }

  const stickers = selectedGroupStickerIds.value.map((stickerId) => ({
    stickerId,
    slotType: batchSlotType.value.trim() || undefined,
  }));
  const existingGroup = availableGroupList.value.find((group) => group.id === targetValue);

  addingToGroup.value = true;
  try {
    if (existingGroup) {
      await imageGroupApi.addStickers(existingGroup.id, { stickers });
    } else {
      await imageGroupApi.create({
        name: targetValue,
        stickers,
      });
    }
    ElMessage.success(`已添加 ${stickers.length} 张素材`);
    addToGroupDialogVisible.value = false;
    preferredTargetGroup.value = null;
    selectedGroupStickerIds.value = [];
    resetCheckStatus(ids);
    await getList();
  } catch (error: any) {
    ElMessage.error(error?.message || "添加到组图失败");
  } finally {
    addingToGroup.value = false;
  }
}

const {
  dragState,
  setupRowDrag,
  handleFolderDragOver,
  handleFolderDragLeave,
  resetAfterDrop,
  markExternalFolderDropHandled,
} = useFolderRowDrag({
  gridClass: "material-dnd-grid",
  dataSource,
  selectedIds: ids,
  onDropToFolder: handleFolderDrop,
});

function materialRowClassName({ row }: any) {
  if (dragState.dragging && dragState.draggingIds.includes(String(row.id))) {
    return "is-dragging-row";
  }
  if (row?.publishUsage?.occupied === true) {
    return "is-publish-usage-occupied has-publish-usage-badge";
  }
  if (row?.publishUsage?.occupied === false) {
    return "is-publish-usage-available has-publish-usage-badge";
  }
  return "";
}

function handleMaterialCellClick({ row, column }: any) {
  if (!row?.publishUsage) {
    return;
  }
  const firstColumnFields = new Set(["dragHandle", "checkbox"]);
  if (firstColumnFields.has(String(column?.field || ""))) {
    void handleViewPublishUsageRecords(row);
  }
}

function isCustomMaterial(row: any) {
  return row?.isCustom === true || row?.isCustom === "true" || row?.isCustom === 1;
}

const single = ref(false);
const multiple = ref(true);
const total = ref(0);
const formRef = ref();
const dialogTitle = ref("");
const dialogVisible = ref(false);
const isEdit = ref(true);
const currentRow = ref();
const submitLoading = ref(false);

const rules = {
  name: [{ required: true, message: "", trigger: "blur" }],
};

const editDialogVisible = ref(false);
const editForm = ref({
  id: "",
  code: "",
  name: "",
  nameEn: "",
  description: "",
  descriptionEn: "",
  keywords: "",
  keywordsEn: "",
  suitableFor: "",
  suffix: "",
  isCustom: false,
  isPublic: false,
  isTexture: false,
  isInfringement: false,
  isCutout: false,
  seamless: false,
  originUrl: "",
  source: "",
  folderId: null, // 文件夹ID
  folderPath: "", // 展示用路径
  // 只读字段（用于显示）
  width: null,
  height: null,
  aspectRatio: null,
  fileSize: null,
  colorPalette: "",
  phash: "",
});
const editLoading = ref(false);
const generatingCode = ref(false);
const detailDialogVisible = ref(false);
const detailDialogLoading = ref(false);
const stickerDetailCurrent = ref<any>(null);
const parsedDetailMetaData = computed(() => {
  const meta = stickerDetailCurrent.value?.meta;
  if (!meta) return null;
  if (typeof meta === "object") return meta;
  if (typeof meta !== "string") return null;
  const trimmed = meta.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
});
const stickerDetailJsonData = computed(() => stickerDetailCurrent.value || {});

function formatDetailValue(value: any, fallback = "-") {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function formatBooleanDetail(value: any) {
  if (value === undefined || value === null || value === "") return "-";
  return normalizeBooleanValue(value) ? "是" : "否";
}

function normalizeBooleanValue(value: any) {
  if (value === true || value === 1) return true;
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function formatAspectRatio(value: any) {
  const ratio = Number(value);
  return Number.isFinite(ratio) && ratio > 0 ? ratio.toFixed(4) : "-";
}

function formatDetailFileSize(value: any) {
  const size = Number(value);
  return Number.isFinite(size) && size > 0 ? formatFileSize(size) : "-";
}

function formatDetailDate(value: any) {
  return value ? formatTimestamp(value) : "-";
}

function getDetailUploaderLabel(detail: any) {
  return (
    detail?.uploader?.account ||
    detail?.uploader?.name ||
    detail?.uploaderAccount ||
    detail?.userId ||
    "-"
  );
}

// 其他缺少的变量
const currentUploadInfo = ref({
  path: "",
  folderId: null as string | null,
  folderPath: "",
  folder: "",
});
const currentGenPictureConfig = ref([]);
const genPicturesForm = ref({});
const genPicturesFormRules = ref({});
const genPicturesModalVisible = ref(false);

// 图片预览相关状态
const imagePreviewVisible = ref(false);
const currentImageUrl = ref("");

function closeImagePreview() {
  imagePreviewVisible.value = false;
  currentImageUrl.value = "";
}

// 元数据弹窗（提前定义，避免与模板渲染顺序问题）
const metaDialogVisible = ref(false);
const metaDialogContent = ref("");

// 素材转移 / 分享给用户
const stickerUserTransferDialogVisible = ref(false);
const stickerUserTransferSubmitting = ref(false);
const stickerUserTransferUsersLoading = ref(false);
const stickerUserTransferUsersLoaded = ref(false);
const stickerUserTransferAction = ref<StickerUserTransferAction>("copy");
const stickerUserTransferIds = ref<string[]>([]);
const stickerUserTransferTargetUserId = ref("");
const stickerUserTransferUserOptions = ref<StickerUserTransferUserOption[]>([]);

const stickerUserTransferDialogTitle = computed(() =>
  stickerUserTransferAction.value === "copy" ? "分享素材给用户" : "转移素材给用户",
);
const stickerUserTransferSubmitText = computed(() =>
  stickerUserTransferAction.value === "copy" ? "确认分享" : "确认转移",
);
const stickerUserTransferPreviewItems = computed(() => {
  return stickerUserTransferIds.value.slice(0, 5).map((id) => {
    const row = dataSource.value.find((item) => String(item.id) === String(id));
    return {
      id: String(id),
      label: row?.name || row?.nameEn || `ID: ${id}`,
    };
  });
});

// SVG转PNG相关状态
const svgToPngDialogVisible = ref(false);
const currentSvgRow = ref<any>(null);
const svgToPngForm = ref({
  width: 512,
  height: 512,
  originalWidth: 512,
  originalHeight: 512,
  aspectRatio: 1,
});

// 尺寸预设
const sizePresets = ref([
  { name: "小图标", width: 64 },
  { name: "中图标", width: 128 },
  { name: "大图标", width: 256 },
  { name: "标准", width: 512 },
  { name: "高清", width: 1024 },
  { name: "超高清", width: 2048 },
  { name: "常用", width: 800 },
  { name: "中等", width: 1200 },
  { name: "大图", width: 1600 },
  { name: "超大", width: 2400 },
]);

const filterDialogVisible = ref(false);
const isMobile = ref(false);
// 不再需要折叠状态，所有搜索字段始终显示

// PS 套图制作
const psdSetDialogVisible = ref(false);
const psdSetTemplates = ref<any[]>([]);
const psdSetTemplatesLoading = ref(false);
const selectedPsdTemplateIds = ref<string[]>([]);
// PSD模板文件夹相关
const selectedPsdFolderId = ref<string | null>("__root__");
const psdFolderTreeData = ref<any[]>([]);

// PSD模板分页相关
const psdSetTemplatePageParams = reactive({
  currentPage: 1,
  pageSize: 12,
  total: 0,
  suitableSizesArray: [] as string[], // 适用尺寸筛选
  cutoutModesArray: [] as string[], // 抠图模式筛选
});

// 批量详细配置相关状态
const batchDetailConfigDialogVisible = ref(false);
const templateConfigList = ref<
  Array<{
    id: string;
    name: string;
    thumbnail?: string;
    psdInfo: any;
    originalPsdInfo: any;
    configText: string;
    psdTemplateConfig?: any;
    materialId?: string | number; // 关联的素材ID
  }>
>([]);
const psdSetSubmitting = ref(false);
const materialPublishConfigDialogVisible = ref(false);
const materialPublishConfigLoading = ref(false);
const materialPublishConfigSubmitting = ref(false);
const materialPublishConfigSearchText = ref("");
const materialPublishConfigCurrentPage = ref(1);
const materialPublishConfigPageSize = ref(10);
const materialPublishConfigOptions = ref<any[]>([]);
const materialPublishConfigSelectedIds = ref<string[]>([]);
const materialPublishConfigGridRef = ref<any>(null);
const materialProductConfigDialogVisible = ref(false);
const materialProductConfigLoading = ref(false);
const materialProductConfigSubmitting = ref(false);
const materialProductConfigSearchText = ref("");
const materialProductConfigCurrentPage = ref(1);
const materialProductConfigPageSize = ref(10);
const materialProductConfigOptions = ref<any[]>([]);
const materialProductConfigSelectedIds = ref<string[]>([]);
const materialProductConfigGridRef = ref<any>(null);
const psdSetMergeSticker = ref(false);
const psdSetTemplateSearchText = ref("");
const psdSetAutomationDialogVisible = ref(false);
const psdSetAutomationPublishConfigsLoading = ref(false);
const psdSetAutomationPublishConfigs = ref<any[]>([]);
const psdSetAutomationPublishConfigSearchText = ref("");
const psdSetAutomationProductTemplatesLoading = ref(false);
const psdSetAutomationProductTemplates = ref<any[]>([]);
const psdSetAutomationProductTemplateSearchText = ref("");
const psdSetAutomationActions = ref([
  {
    key: "generate_product",
    label: "自动生成商品",
    description: "套图制作完成后自动创建商品，并进入商品生成流程。",
    enabled: false,
    params: {
      productGenerationTemplateIds: [] as string[],
    },
    fields: [
      {
        key: "productGenerationTemplateIds",
        label: "商品生成模板",
        component: "product-template-list",
        placeholder: "选择一个或多个商品生成模板",
      },
    ],
  },
  {
    key: "create_publish_task_from_config",
    label: "自动生成发布任务",
    description: "套图制作完成后，直接按选中的任务配置创建发布任务。",
    enabled: false,
    params: {
      publishConfigIds: [] as string[],
    },
    fields: [
      {
        key: "publishConfigIds",
        label: "任务配置",
        component: "publish-config-list",
        placeholder: "选择一个或多个任务配置",
      },
    ],
  },
]);

// PSD参数查看
const psdSetParamsDialogVisible = ref(false);
const psdSetParamsContent = ref("");

// PSD模板详情弹窗
const psdTemplateDetailDialogVisible = ref(false);
const currentPsdTemplate = ref<any>(null);

// 直接使用后端返回的模板列表（后端已过滤）
const filteredPsdSetTemplates = computed(() => {
  return psdSetTemplates.value;
});

// 判断是否所有可见模板都已选中
const isAllPsdTemplatesSelected = computed(() => {
  if (!filteredPsdSetTemplates.value.length) return false;
  return filteredPsdSetTemplates.value.every((tpl) =>
    selectedPsdTemplateIds.value.includes(String(tpl.id)),
  );
});

const psdSetTaskCount = computed(() =>
  psdSetMergeSticker.value
    ? selectedPsdTemplateIds.value.length
    : ids.value.length * selectedPsdTemplateIds.value.length,
);
function cacheSelectedMaterialRows(rows: any[] = []) {
  rows.forEach((row) => {
    if (!row?.id) return;
    selectedMaterialCache[String(row.id)] = {
      ...(selectedMaterialCache[String(row.id)] || {}),
      ...row,
    };
  });
}

const selectedMaterialsForPublishConfig = computed(() =>
  ids.value
    .map(
      (id) =>
        getMaterialById(id) || {
          id,
          name: `素材${id}`,
          url: "",
          suffix: "",
        },
    )
    .filter(Boolean),
);
const materialPublishConfigMissingPreviewIds = computed(() =>
  selectedMaterialsForPublishConfig.value
    .filter((material: any) => !getMaterialPreviewSource(material))
    .map((material: any) => String(material.id)),
);
const filteredMaterialPublishConfigs = computed(() => {
  const keyword = materialPublishConfigSearchText.value.trim().toLowerCase();
  return materialPublishConfigOptions.value
    .filter((item: any) => item?.isActive !== false)
    .filter((item: any) => {
      if (!keyword) {
        return true;
      }

      const taskTypeLabel = getTaskTypeLabel(
        item?.taskType || derivePublishTaskTypeByPlatform(item?.platform),
        item?.platform,
      ).toLowerCase();
      return (
        String(item?.name || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item?.description || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item?.platform || "")
          .toLowerCase()
          .includes(keyword) ||
        taskTypeLabel.includes(keyword)
      );
    });
});
const materialPublishConfigDataSource = computed(() => {
  const start = (materialPublishConfigCurrentPage.value - 1) * materialPublishConfigPageSize.value;
  const end = start + materialPublishConfigPageSize.value;
  return filteredMaterialPublishConfigs.value.slice(start, end);
});
const materialPublishConfigTaskCount = computed(
  () => ids.value.length * materialPublishConfigSelectedIds.value.length,
);
const materialPublishConfigUsableCount = computed(
  () =>
    filteredMaterialPublishConfigs.value.filter((item: any) => isMaterialPublishConfigUsable(item))
      .length,
);
const materialPublishConfigGridOptions = computed(() => ({
  ...commonGridOptions,
  loading: false,
  rowConfig: { isHover: true, keyField: "id" },
  rowClassName: ({ row }: any) =>
    isMaterialPublishConfigUsable(row) ? "" : "material-publish-config-dialog__row--disabled",
  columnConfig: { resizable: true },
  checkboxConfig: {
    checkRowKeys: materialPublishConfigSelectedIds.value,
    highlight: true,
    trigger: "row" as const,
    checkMethod: ({ row }: any) => isMaterialPublishConfigUsable(row),
  },
  columns: [
    { type: "checkbox" as any, width: 60, align: "center" as any },
    {
      field: "taskType",
      title: "任务类型",
      width: 180,
      formatter: ({ row }: any) =>
        getTaskTypeLabel(
          row?.taskType || derivePublishTaskTypeByPlatform(row?.platform),
          row?.platform,
        ),
    },
    { field: "name", title: "配置名称", minWidth: 180, showOverflow: true },
    {
      field: "templateBindingStatus",
      title: "状态",
      width: 150,
      formatter: ({ row }: any) =>
        isMaterialPublishConfigUsable(row) ? "可用" : "未配置PSD模板，无法使用",
    },
    { field: "description", title: "备注说明", minWidth: 220, showOverflow: true },
  ],
}));
const filteredMaterialProductConfigs = computed(() => {
  const keyword = materialProductConfigSearchText.value.trim().toLowerCase();
  return materialProductConfigOptions.value
    .filter((item: any) => item?.isActive !== false)
    .filter((item: any) => {
      if (!keyword) return true;
      return [item?.name, item?.productType, item?.tags]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(keyword));
    });
});
const materialProductConfigDataSource = computed(() => {
  const start = (materialProductConfigCurrentPage.value - 1) * materialProductConfigPageSize.value;
  return filteredMaterialProductConfigs.value.slice(
    start,
    start + materialProductConfigPageSize.value,
  );
});
const materialProductConfigTaskCount = computed(
  () => ids.value.length * materialProductConfigSelectedIds.value.length,
);
const materialProductConfigUsableCount = computed(
  () =>
    filteredMaterialProductConfigs.value.filter((item: any) =>
      isMaterialProductConfigUsable(item),
    ).length,
);
const materialProductConfigGridOptions = computed(() => ({
  ...commonGridOptions,
  loading: false,
  rowConfig: { isHover: true, keyField: "id" },
  rowClassName: ({ row }: any) =>
    isMaterialProductConfigUsable(row) ? "" : "material-publish-config-dialog__row--disabled",
  columnConfig: { resizable: true },
  checkboxConfig: {
    checkRowKeys: materialProductConfigSelectedIds.value,
    highlight: true,
    trigger: "row" as const,
    checkMethod: ({ row }: any) => isMaterialProductConfigUsable(row),
  },
  columns: [
    { type: "checkbox" as any, width: 60, align: "center" as any },
    { field: "name", title: "商品配置", minWidth: 180, showOverflow: true },
    {
      field: "productType",
      title: "商品类型",
      width: 140,
      formatter: ({ cellValue }: any) => String(cellValue || "").trim() || "AI 自动识别",
    },
    {
      field: "pricingMode",
      title: "价格策略",
      width: 110,
      formatter: ({ cellValue }: any) => (cellValue === "ai" ? "AI 生成" : "固定价格"),
    },
    {
      field: "psdTemplateId",
      title: "PSD模板",
      width: 170,
      formatter: ({ row }: any) =>
        isMaterialProductConfigUsable(row) ? "已绑定" : "未绑定，无法使用",
    },
    {
      field: "autoPublish",
      title: "生成后发布",
      width: 110,
      formatter: ({ cellValue }: any) => (cellValue === false ? "否" : "是"),
    },
  ],
}));
const filteredPsdSetAutomationPublishConfigs = computed(() => {
  const keyword = psdSetAutomationPublishConfigSearchText.value.trim().toLowerCase();
  if (!keyword) {
    return psdSetAutomationPublishConfigs.value;
  }
  return psdSetAutomationPublishConfigs.value.filter((item: any) => {
    const taskTypeLabel = getTaskTypeLabel(
      item?.taskType || derivePublishTaskTypeByPlatform(item?.platform),
      item?.platform,
    ).toLowerCase();
    return [item?.name, item?.description, item?.platform]
      .map((value) => String(value || "").toLowerCase())
      .some((value) => value.includes(keyword)) || taskTypeLabel.includes(keyword);
  });
});
const filteredPsdSetAutomationProductTemplates = computed(() => {
  const keyword = psdSetAutomationProductTemplateSearchText.value.trim().toLowerCase();
  if (!keyword) {
    return psdSetAutomationProductTemplates.value;
  }
  return psdSetAutomationProductTemplates.value.filter((item: any) =>
    [item?.name, item?.productType, item?.tags]
      .map((value) => String(value || "").toLowerCase())
      .some((value) => value.includes(keyword)),
  );
});
const psdSetAutomationProductTemplateColumns: any[] = [
  { type: "checkbox", width: 48 },
  { field: "name", title: "模板名称", minWidth: 180, showOverflow: true },
  { field: "productType", title: "商品类型", width: 120, showOverflow: true },
  {
    field: "salePrice",
    title: "售价",
    width: 90,
    formatter: ({ cellValue }: any) => {
      const amount = Number(cellValue || 0);
      return amount > 0 ? amount.toFixed(2) : "-";
    },
  },
  { field: "stock", title: "库存", width: 80 },
  { field: "tags", title: "标签", minWidth: 180, showOverflow: true },
];
const psdSetAutomationPublishConfigColumns: any[] = [
  { type: "checkbox", width: 48 },
  {
    field: "taskType",
    title: "任务类型",
    width: 170,
    formatter: ({ row }: any) =>
      getTaskTypeLabel(
        row?.taskType || derivePublishTaskTypeByPlatform(row?.platform),
        row?.platform,
      ),
  },
  { field: "name", title: "配置名称", minWidth: 180, showOverflow: true },
  { field: "platform", title: "平台", width: 110, showOverflow: true },
  { field: "description", title: "备注说明", minWidth: 220, showOverflow: true },
];
const enabledPsdSetAutomationCount = computed(
  () => psdSetAutomationActions.value.filter((action) => action.enabled).length,
);
const enabledPsdSetAutomationKeys = computed(() =>
  psdSetAutomationActions.value.filter((action) => action.enabled).map((action) => action.key),
);
const relatedPsdSetDialogRef = ref<any>(null);

// PSD制作套图允许的图片格式（固定为这三个）
const psdSetAllowedFormats = ["jpg", "png", "jpeg", "svg", "webp"];

// 获取当前选中PSD模板的允许格式
const allowedFormatsForSelectedTemplates = computed(() => {
  // 固定返回允许的格式列表
  return psdSetAllowedFormats;
});

// 检查是否有不符合格式的素材
const hasInvalidFormatMaterials = computed(() => {
  if (!ids.value.length) return false;

  const allowedFormatsSet = new Set(psdSetAllowedFormats);

  return ids.value.some((id) => {
    const material = dataSource.value.find((item) => String(item.id) === String(id));
    if (!material) return false;

    const materialSuffix = (material.suffix || "").toLowerCase().replace(/^\./, "");
    if (!materialSuffix) return true; // 没有后缀视为无效

    return !allowedFormatsSet.has(materialSuffix);
  });
});

// 获取不符合格式的素材列表（用于提示）
const invalidFormatMaterialsList = computed(() => {
  const allowedFormatsSet = new Set(psdSetAllowedFormats);
  const invalidList: Array<{ name: string; suffix: string }> = [];

  ids.value.forEach((id) => {
    const material = dataSource.value.find((item) => String(item.id) === String(id));
    if (!material) return;

    const materialSuffix = (material.suffix || "").toLowerCase().replace(/^\./, "");
    if (!materialSuffix || !allowedFormatsSet.has(materialSuffix)) {
      invalidList.push({
        name: material.name || `ID: ${material.id}`,
        suffix: materialSuffix || "未知格式",
      });
    }
  });

  return invalidList;
});
const psdSetDialogTitle = computed(() =>
  psdSetMergeSticker.value ? "多图套图工作台" : "PS 套图工作台",
);

// 处理上传

const uploadModalVisible = ref(false);
const uploadListRef = ref<InstanceType<typeof listUpload> | null>(null);

function clearUploadDialogState() {
  uploadListRef.value?.clearUploadState?.();
}

function uploadModalClose() {
  // 关闭时更新 currentUploadInfo，确保下次打开时使用当前选中的文件夹
  currentUploadInfo.value = {
    path: "",
    folderId: getSelectedStickerFolderTargetId(),
    folderPath: selectedStickerFolderPath.value || "",
    folder: selectedStickerFolderPath.value || "",
  };
}

// 打开上传对话框时，更新当前上传信息
watch(uploadModalVisible, (visible) => {
  if (visible) {
    currentUploadInfo.value = {
      path: "",
      folderId: getSelectedStickerFolderTargetId(),
      folderPath: selectedStickerFolderPath.value || "",
      folder: selectedStickerFolderPath.value || "",
    };
  }
});

async function getList() {
  loading.value = true;
  vectorSimilarSearchActive.value = false;
  similarImageActivePreviewUrl.value = "";
  similarImageActiveSourceType.value = "";
  similarImageActiveSourceLabel.value = "";
  stickerDetailCache.clear();
  if (phashSearchDisabled) {
    queryParams.phash = "";
  }
  // 立即清空旧数据，确保旧图片被销毁
  dataSource.value = [];

  // 构建查询参数，确保 suffix 和 sizeShape 数组格式正确传递；空字符串转为 null 以兼容后端
  const phash = phashSearchDisabled ? "" : String(queryParams.phash || "").trim();
  const searchText = String(queryParams.searchText || "").trim();
  const suffixList = Array.isArray(queryParams.suffix)
    ? queryParams.suffix
    : queryParams.suffix
      ? [queryParams.suffix]
      : [];
  const sizeShapeList = Array.isArray(queryParams.sizeShape)
    ? queryParams.sizeShape
    : queryParams.sizeShape
      ? [queryParams.sizeShape]
      : [];
  const params = {
    ...queryParams,
    listMode: "compact",
    includeRelations: false,
    keyword: undefined,
    searchText: searchText || undefined,
    id: String(queryParams.id || "").trim() || undefined,
    phash: phash || undefined,
    phashMode: phash ? queryParams.phashMode : undefined,
    startTime: queryParams.startTime || undefined,
    endTime: queryParams.endTime || undefined,
    folderId: getStickerFolderFilterForQuery(queryParams.folderId),
    isCustom: queryParams.isCustom === "" ? null : queryParams.isCustom,
    isInfringement: queryParams.isInfringement === "" ? null : queryParams.isInfringement,
    isCutout: queryParams.isCutout === "" ? null : queryParams.isCutout,
    seamless: queryParams.seamless === "" ? null : queryParams.seamless,
    suffix: suffixList.length ? suffixList : undefined,
    sizeShape: sizeShapeList.length ? sizeShapeList : undefined,
    publishUsageConfigId: queryParams.publishUsageConfigId.length
      ? queryParams.publishUsageConfigId
      : undefined,
  };

  let res = await getMaterialList(params).finally(() => {
    loading.value = false;
  });
  // 将后端返回的宽高/比例信息映射到列表行数据，便于展示
  dataSource.value = normalizeMaterialListRows(res.list || []);
  total.value = res.total;

  cacheSelectedMaterialRows(dataSource.value.filter((item) => ids.value.includes(String(item.id))));

  // 列表渲染完成后挂载拖拽
  nextTick(setupRowDrag);
}

function normalizeMaterialListRows(items: any[]) {
  return (items || []).map((item) => {
    const width = item.width;
    const height = item.height;
    const aspectRatio = item.aspectRatio || (width && height ? width / height : undefined);
    const shapeConfig = aspectRatio ? getSizeShapeByRatio(aspectRatio) : undefined;
    const shapeLabel = shapeConfig
      ? shapeConfig.group === "portrait"
        ? "长图"
        : shapeConfig.group === "landscape"
          ? "宽图"
          : "正方图"
      : "";
    const rawScore = Number(item._score ?? item.score ?? 0);
    const similarity =
      item.similarity !== undefined
        ? Number(item.similarity)
        : rawScore > 0
          ? Math.min(100, Math.max(0, rawScore * 100))
          : undefined;

    return {
      ...item,
      resolutionWidth: width ?? item.resolutionWidth,
      resolutionHeight: height ?? item.resolutionHeight,
      aspectRatio,
      shapeLabel,
      similarity,
      _imageError: false,
    };
  });
}

async function loadVectorSimilarResults(imageUrl: string, resetPage = true): Promise<boolean> {
  if (!imageUrl) {
    ElMessage.warning("该图片暂无可搜索的图片地址");
    return false;
  }

  loading.value = true;
  stickerDetailCache.clear();
  dataSource.value = [];
  if (resetPage) {
    queryParams.currentPage = 1;
    queryParams.pageSize = similarImageSearchLimit.value;
  }
  try {
    const offset = (queryParams.currentPage - 1) * queryParams.pageSize;
    const result = await searchStickerByImage({
      imageUrl,
      mode: "visual",
      limit: queryParams.pageSize,
      offset,
    });
    const items = normalizeMaterialListRows(result?.results || []);
    dataSource.value = items;
    total.value = result?.total || items.length;
    similarImageSearchMeta.value = result?.meta || null;
    queryParams.phash = "";
    vectorSimilarSearchActive.value = true;
    cacheSelectedMaterialRows(dataSource.value.filter((item) => ids.value.includes(String(item.id))));
    nextTick(setupRowDrag);
    return true;
  } catch (error: any) {
    vectorSimilarSearchActive.value = false;
    similarImageSearchMeta.value = null;
    ElMessage.error(error?.message || "搜索失败");
    return false;
  } finally {
    loading.value = false;
  }
}

async function loadVectorSimilarTextResults(text: string, resetPage = true): Promise<boolean> {
  if (!text?.trim()) {
    ElMessage.warning("请输入搜索文本");
    return false;
  }

  loading.value = true;
  stickerDetailCache.clear();
  dataSource.value = [];
  if (resetPage) {
    queryParams.currentPage = 1;
    queryParams.pageSize = similarImageSearchLimit.value;
  }
  try {
    const offset = (queryParams.currentPage - 1) * queryParams.pageSize;
    const result = await searchStickerByText({
      text: text.trim(),
      limit: queryParams.pageSize,
      offset,
    });
    const items = normalizeMaterialListRows(result?.results || []);
    dataSource.value = items;
    total.value = result?.total || items.length;
    similarImageSearchMeta.value = result?.meta || null;
    queryParams.phash = "";
    vectorSimilarSearchActive.value = true;
    cacheSelectedMaterialRows(dataSource.value.filter((item) => ids.value.includes(String(item.id))));
    nextTick(setupRowDrag);
    return true;
  } catch (error: any) {
    vectorSimilarSearchActive.value = false;
    similarImageSearchMeta.value = null;
    ElMessage.error(error?.message || "文字搜索失败");
    return false;
  } finally {
    loading.value = false;
  }
}

function openSimilarImageDialog(defaultImageUrl = "") {
  if (visualSimilarSearchDisabled) {
    ElMessage.warning(VISUAL_SIMILAR_SEARCH_DISABLED_MESSAGE);
    return;
  }
  if (defaultImageUrl) {
    similarImageSearchTab.value = "url";
    similarImageUrl.value = defaultImageUrl;
  }
  similarImageDialogVisible.value = true;
}

function setSimilarImageActiveStatus(options: {
  previewUrl: string;
  sourceType: "url" | "file";
  sourceLabel?: string;
}) {
  similarImageActivePreviewUrl.value = options.previewUrl;
  similarImageActiveSourceType.value = options.sourceType;
  similarImageActiveSourceLabel.value = options.sourceLabel || "";
}

async function clearSimilarImageSearchResults() {
  vectorSimilarSearchActive.value = false;
  similarImageActivePreviewUrl.value = "";
  similarImageActiveSourceType.value = "";
  similarImageActiveSourceLabel.value = "";
  similarImageSearchMeta.value = null;
  queryParams.currentPage = 1;
  queryParams.pageSize = 20; // 恢复默认分页大小
  await getList();
}

async function handlePagination() {
  if (vectorSimilarSearchActive.value) {
    if (similarImageActiveSourceType.value === "text") {
      await loadVectorSimilarTextResults(similarImageActiveSourceLabel.value, false);
    } else {
      await loadVectorSimilarResults(similarImageActivePreviewUrl.value, false);
    }
  } else {
    await getList();
  }
}

function releaseSimilarImagePreviewUrl() {
  if (similarImageFilePreviewUrl.value) {
    URL.revokeObjectURL(similarImageFilePreviewUrl.value);
    similarImageFilePreviewUrl.value = "";
  }
}

function resetSimilarImageDialog() {
  similarImageUrl.value = "";
  similarImageFile.value = null;
  similarImageFileName.value = "";
  similarImageSearchText.value = "";
  releaseSimilarImagePreviewUrl();
}

function handleSimilarImageUploadChange(uploadFile: any) {
  const file = uploadFile?.raw as File | undefined;
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    ElMessage.warning("请选择图片文件");
    return;
  }

  releaseSimilarImagePreviewUrl();
  similarImageFile.value = file;
  similarImageFileName.value = file.name || "本地图片";
  similarImageFilePreviewUrl.value = URL.createObjectURL(file);
  similarImageSearchTab.value = "file";
}

function isValidRemoteImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function submitSimilarImageSearch() {
  if (visualSimilarSearchDisabled) {
    ElMessage.warning(VISUAL_SIMILAR_SEARCH_DISABLED_MESSAGE);
    return;
  }

  similarImageSubmitting.value = true;
  try {
    // Handle text search
    if (similarImageSearchTab.value === "text") {
      const searchText = similarImageSearchText.value.trim();
      if (!searchText) {
        ElMessage.warning("请输入搜索文本");
        return;
      }
      const success = await loadVectorSimilarTextResults(searchText);
      if (success) {
        setSimilarImageActiveStatus({
          previewUrl: "",
          sourceType: "text",
          sourceLabel: searchText,
        });
        similarImageDialogVisible.value = false;
      }
      return;
    }

    let imageUrl = "";
    let activePreviewUrl = "";
    let activeSourceType: "url" | "file" = "url";
    let activeSourceLabel = "";
    if (similarImageSearchTab.value === "url") {
      imageUrl = similarImageUrl.value.trim();
      if (!imageUrl) {
        ElMessage.warning("请输入图片 URL");
        return;
      }
      if (!isValidRemoteImageUrl(imageUrl)) {
        ElMessage.warning("请输入 http 或 https 开头的图片 URL");
        return;
      }
      activePreviewUrl = imageUrl;
      activeSourceType = "url";
      activeSourceLabel = "图片 URL";
    } else {
      const file = similarImageFile.value;
      if (!file) {
        ElMessage.warning("请选择本地图片");
        return;
      }
      imageUrl = await readImageFileAsSearchDataUrl(file);
      activePreviewUrl = imageUrl;
      activeSourceType = "file";
      activeSourceLabel = file.name || similarImageFileName.value || "本地图片";
    }

    const success = await loadVectorSimilarResults(imageUrl);
    if (success) {
      setSimilarImageActiveStatus({
        previewUrl: activePreviewUrl,
        sourceType: activeSourceType,
        sourceLabel: activeSourceLabel,
      });
      similarImageDialogVisible.value = false;
    }
  } catch (error: any) {
    ElMessage.error(error?.message || "读取图片失败");
  } finally {
    similarImageSubmitting.value = false;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });
}

async function readImageFileAsSearchDataUrl(file: File): Promise<string> {
  const fallback = () => readFileAsDataUrl(file);

  if (!file.type.startsWith("image/") || file.type.includes("svg")) {
    return fallback();
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("图片解码失败"));
      img.src = objectUrl;
    });

    const maxSide = 1024;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback();
    ctx.drawImage(image, 0, 0, width, height);

    return await new Promise<string>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("图片压缩失败"));
            return;
          }
          readFileAsDataUrl(new File([blob], file.name || "search-image.jpg", { type: blob.type }))
            .then(resolve)
            .catch(reject);
        },
        "image/jpeg",
        0.86,
      );
    });
  } catch {
    return fallback();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function normalizeStickerDetailResponse(res: any) {
  if (!res) return null;
  if (res.id) return res;
  if (res.data?.id) return res.data;
  if (Array.isArray(res.list) && res.list[0]) return res.list[0];
  if (Array.isArray(res.data?.list) && res.data.list[0]) return res.data.list[0];
  return null;
}

async function fetchStickerDetail(rowOrId: any) {
  const id = String(typeof rowOrId === "object" ? rowOrId?.id : rowOrId || "").trim();
  if (!id) {
    throw new Error("缺少素材ID");
  }

  const cached = stickerDetailCache.get(id);
  if (cached) {
    return cached;
  }

  const detail = normalizeStickerDetailResponse(await getStickerById(id));
  if (!detail) {
    throw new Error("素材详情不存在");
  }

  const row = dataSource.value.find((item: any) => String(item.id) === id);
  const merged = row ? { ...row, ...detail } : detail;
  stickerDetailCache.set(id, merged);
  if (row) {
    Object.assign(row, merged);
  }
  return merged;
}

onUnmounted(() => {
  hideAllOperationSubmenus();
  operationDropdownRefs.clear();
  resetAfterDrop();
  releaseSimilarImagePreviewUrl();
});

// phash相似图片搜索
async function handlePhashSearch() {
  if (phashSearchDisabled) {
    ElMessage.warning(PHASH_SEARCH_DISABLED_MESSAGE);
    return;
  }
  // 去除phash值的前后空格
  queryParams.phash = queryParams.phash.trim();

  if (!queryParams.phash) {
    ElMessage.warning("请输入phash值或图片地址");
    return;
  }

  // 重置页码
  queryParams.currentPage = 1;
  // 调用现有的getList函数，它会自动检测phash参数并调用相似度搜索
  await getList();
}

// phash输入框失去焦点时自动trim
function onPhashInputBlur() {
  if (phashSearchDisabled) {
    return;
  }
  queryParams.phash = queryParams.phash.trim();
}

// 清空phash搜索
function clearPhashSearch() {
  queryParams.phash = "";
  queryParams.currentPage = 1;
  getList();
}

// 文件夹相关状态
const folderTreeCollapsed = useLocalStorage("material_folder_collapsed", false);
const selectedStickerFolderId = ref<string | null>(FOLDER_FILTER.ALL);
const selectedStickerFolderPath = ref("");
const stickerFolderTreeData = ref<any[]>([]);

function getSelectedStickerFolderTargetId() {
  if (
    selectedStickerFolderId.value === FOLDER_FILTER.ALL ||
    selectedStickerFolderId.value === FOLDER_FILTER.NOT_GROUP
  ) {
    return null;
  }
  return selectedStickerFolderId.value;
}

function getStickerFolderFilterForQuery(folderId: string | null | undefined) {
  if (folderId === FOLDER_FILTER.ALL || folderId === undefined || folderId === null) {
    return undefined;
  }
  if (folderId === FOLDER_FILTER.NOT_GROUP) {
    return "root";
  }
  return folderId;
}

// 文件夹选择选项（用于下拉框）
const stickerFolderSelectOptions = computed(() => {
  const options: Array<{ label: string; value: string | null; path: string }> = [
    { label: "根目录", value: null, path: "" },
  ];

  // 递归构建文件夹选项
  const buildOptions = (folders: any[], prefix = "") => {
    folders.forEach((folder) => {
      const label = prefix ? `${prefix} / ${folder.name}` : folder.name;
      options.push({
        label,
        value: folder.id,
        path: folder.path || "",
      });
      if (folder.children && folder.children.length > 0) {
        buildOptions(folder.children, label);
      }
    });
  };

  buildOptions(
    stickerFolderTreeData.value.filter(
      (folder) => folder.id !== FOLDER_FILTER.ALL && folder.id !== FOLDER_FILTER.NOT_GROUP,
    ),
  );

  return options;
});

// 加载文件夹树
async function loadStickerFolderTree() {
  try {
    const res = await getStickerFolderTree({ folderCategory: FOLDER_CATEGORY });
    const rootFolders = (res || []).filter(
      (folder: any) => folder.parentId === null || folder.parentId === undefined,
    );

    const allNode = {
      id: FOLDER_FILTER.ALL,
      name: "全部",
      path: "",
      parentId: null,
      children: [] as any[],
      isAll: true,
    };

    const rootNode = {
      id: FOLDER_FILTER.NOT_GROUP,
      name: "未分类",
      path: "",
      parentId: null,
      children: [] as any[],
      stickerCount: 0,
    };

    stickerFolderTreeData.value = [allNode, rootNode, ...rootFolders];
    if (!selectedStickerFolderId.value) {
      selectedStickerFolderId.value = FOLDER_FILTER.ALL;
    }
  } catch (error) {
    console.error("加载文件夹失败:", error);
    ElMessage.error("加载文件夹失败");
  }
}

function handleStickerFolderChange(payload: { folderId: string | null; node?: any }) {
  const { folderId, node } = payload;
  selectedStickerFolderId.value = folderId;
  selectedStickerFolderPath.value =
    folderId && folderId !== FOLDER_FILTER.ALL && folderId !== FOLDER_FILTER.NOT_GROUP
      ? node?.path || ""
      : "";
  queryParams.folderId = folderId;
  queryParams.currentPage = 1;
  getList();
}

// 拖拽到文件夹时的交互
async function handleFolderDrop(payload: { data: any }) {
  markExternalFolderDropHandled();
  if (!dragState.draggingIds.length) return;
  if (payload.data.id === FOLDER_FILTER.ALL) {
    resetAfterDrop();
    return;
  }

  const targetFolderId = payload.data.id === FOLDER_FILTER.NOT_GROUP ? null : payload.data.id;
  const targetPath = payload.data.path || "";
  const movingIds = [...dragState.draggingIds];

  try {
    await batchMoveStickers({ ids: movingIds, folderId: targetFolderId });
    ElMessage.success(`已移动 ${movingIds.length} 个素材到 ${targetPath || "根目录"}`);

    await loadStickerFolderTree();
    await getList();
    resetCheckStatus(ids);
  } catch (error) {
    ElMessage.error((error as Error).message || "移动失败");
  } finally {
    resetAfterDrop();
  }
}

// 文件夹变更时，同步更新上传信息
watch(selectedStickerFolderPath, (newPath) => {
  currentUploadInfo.value = {
    ...currentUploadInfo.value,
    folderPath: newPath || "",
    folder: newPath || "",
    folderId: getSelectedStickerFolderTargetId(),
  };
});

// 初始化时加载文件夹树
loadStickerFolderTree();

loadPublishUsageConfigOptions();
getList();

// 批量移动素材到文件夹
async function handleBatchMoveToFolder() {
  if (!ids.value.length) {
    return ElMessage.warning("请选择要移动的素材");
  }

  try {
    const targetFolderId = getSelectedStickerFolderTargetId();
    const targetFolderPath = selectedStickerFolderPath.value || "";

    await batchMoveStickers({ ids: ids.value, folderId: targetFolderId });
    ElMessage.success(
      `成功移动 ${ids.value.length} 个素材${targetFolderPath ? `到 ${targetFolderPath}` : "到根目录"}`,
    );
    getList();
    ids.value = [];
    resetCheckStatus(ids);
  } catch (error) {
    ElMessage.error((error as Error).message || "移动失败");
  }
}

getList();

// 操作函数
function handleQuery() {
  queryParams.currentPage = 1;
}

function resetQuery() {
  getList();
}

// 移动端筛选提交
function onMobileFilterSubmit() {
  filterDialogVisible.value = false;
  getList();
}

// 下载
function handleMultiDownload() {
  if (!ids.value.length) {
    return ElMessage.warning("请选择要下载的数据");
  }

  // 处理图片下载
  try {
    ids.value.forEach(async (id, index) => {
      let row = dataSource.value.find((item) => {
        return item.id == id;
      });

      if (!row) {
        return;
      }
      setTimeout(async () => {
        try {
          const downloadUrl = row.url || row.ossObjectName;
          const fileName = row.name || row.imageName || `image_${id}.jpg`;

          if (!downloadUrl) {
            ElMessage.error(`图片 ${fileName} 下载失败：缺少下载链接`);
            return;
          }

          // 使用新的下载函数，确保文件被下载而不是打开新页面
          await downloadImage(downloadUrl, fileName);
          ElNotification.success(`图片 ${fileName} 下载成功`);
        } catch (error) {
          console.error("下载失败:", error);
          ElMessage.error(`图片下载失败：${error.message}`);
        }
      }, 500 * index);
    });
  } catch (e) {
    console.error("批量下载失败:", e);
    ElMessage.error("批量下载失败");
  }
}

async function handleDelete(row?) {
  let delIds: any = null;
  if (row) {
    delIds = [row.id];
  } else {
    delIds = Array.isArray(ids.value) ? [...ids.value] : [];
    if (!delIds.length) {
      return ElMessage.warning("请选择要删除的数据");
    }
  }

  try {
    await ElMessageBox.confirm("确认删除该数据吗", "删除提示", {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "error",
    });
    delIds = delIds.map((id) => String(id));
    deleteLoading.value = true;
    await deleteAssetLibrary({ ids: delIds });
    ElNotification.success("删除成功");
    resetCheckStatus(ids);
    await getList();
  } catch (error: any) {
    if (error === "cancel" || error === "close" || error?.action === "cancel" || error?.action === "close") {
      return;
    }
    console.error("删除失败:", error);
    ElMessage.error(error?.message || "删除失败");
  } finally {
    deleteLoading.value = false;
  }
}
function checkboxChange(e) {
  const records = Array.isArray(e.records) ? e.records : [];
  const reserves = Array.isArray(e.reserves) ? e.reserves : [];
  cacheSelectedMaterialRows([...records, ...reserves]);
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)];
}

function checkboxAllChange(e) {
  const records = Array.isArray(e.records) ? e.records : [];
  const reserves = Array.isArray(e.reserves) ? e.reserves : [];
  cacheSelectedMaterialRows([...records, ...reserves]);
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)];
}

function removeSelectedMaterial(materialId: string | number) {
  const normalizedId = String(materialId);
  ids.value = ids.value.filter((id) => String(id) !== normalizedId);
  const tableRef = gridRef.value;
  const row =
    dataSource.value.find((item) => String(item.id) === normalizedId) ||
    selectedMaterialCache[normalizedId];
  if (row) {
    tableRef?.setCheckboxRow?.(row, false);
  }
  tableRef?.removeCheckboxReserveRow?.(row || { id: normalizedId });
  if (!ids.value.length) {
    materialPublishConfigSelectedIds.value = [];
    selectedPsdTemplateIds.value = [];
  }
}

async function handleDownload(row) {
  // 处理图片下载
  try {
    const downloadUrl = row.url || row.ossObjectName;
    const fileName = row.name || row.imageName || `image_${row.id}.jpg`;

    if (!downloadUrl) {
      ElMessage.error(`图片 ${fileName} 下载失败：缺少下载链接`);
      return;
    }

    // 使用新的下载函数，确保文件被下载而不是打开新页面
    await downloadImage(downloadUrl, fileName);
    ElNotification.success(`图片 ${fileName} 下载成功`);
  } catch (error) {
    console.error("下载失败:", error);
    ElMessage.error(`图片下载失败：${error.message}`);
  }
}

async function handleDownloadRotated90(row) {
  try {
    const originalUrl = row.url || row.ossObjectName;
    const fileName = row.name || row.imageName || `image_${row.id}.jpg`;

    if (!originalUrl) {
      ElMessage.error(`图片 ${fileName} 下载失败：缺少下载链接`);
      return;
    }

    const rotatedUrl = getRotatedImageUrl(originalUrl, 90);
    if (!rotatedUrl) {
      ElMessage.error(`图片 ${fileName} 不支持旋转处理`);
      return;
    }

    // 给文件名加上旋转标记
    const dotIndex = fileName.lastIndexOf('.');
    const rotatedFileName = dotIndex > 0
      ? `${fileName.substring(0, dotIndex)}_rotated90${fileName.substring(dotIndex)}`
      : `${fileName}_rotated90`;

    await downloadImage(rotatedUrl, rotatedFileName);
    ElNotification.success(`旋转90°图片 ${rotatedFileName} 下载成功`);
  } catch (error) {
    console.error("旋转下载失败:", error);
    ElMessage.error(`旋转图片下载失败：${error.message}`);
  }
}

// 复制单个素材
async function handleCopy(row) {
  try {
    const res = await copyStickers({ ids: String(row.id) });
    const count = Array.isArray(res?.list) ? res.list.length : 1;
    ElMessage.success(`复制成功 ${count} 条`);
    getList();
  } catch (e) {
    ElMessage.error("复制失败");
  }
}

function ensureStickerAdminOperation() {
  if (!isAdmin.value) {
    ElMessage.warning("无权限：仅管理员可执行该操作");
    return false;
  }
  return true;
}

async function loadStickerTransferUserOptions() {
  if (stickerUserTransferUsersLoading.value || stickerUserTransferUsersLoaded.value) {
    return;
  }

  stickerUserTransferUsersLoading.value = true;
  try {
    const res = await getUserList({ currentPage: 1, pageSize: 1000 });
    stickerUserTransferUserOptions.value = (res?.list || []).map((item: any) => ({
      id: String(item.id),
      name: String(item.name || "").trim(),
      account: String(item.account || "").trim(),
      label: `${item.name || item.account || `用户#${item.id}`} (${item.account || item.id})`,
      isAdmin: !!item.isAdmin,
    }));
    stickerUserTransferUsersLoaded.value = true;
  } catch (error: any) {
    ElMessage.error(error?.message || "加载用户列表失败");
  } finally {
    stickerUserTransferUsersLoading.value = false;
  }
}

function resetStickerUserTransferDialog() {
  stickerUserTransferSubmitting.value = false;
  stickerUserTransferAction.value = "copy";
  stickerUserTransferIds.value = [];
  stickerUserTransferTargetUserId.value = "";
}

async function openStickerUserTransferDialog(action: StickerUserTransferAction, row?: any) {
  if (!ensureStickerAdminOperation()) {
    return;
  }

  const targetIds = row
    ? [String(row.id)]
    : (Array.isArray(ids.value) ? ids.value : []).map((id) => String(id)).filter(Boolean);

  if (!targetIds.length) {
    ElMessage.warning("请选择要操作的素材");
    return;
  }

  stickerUserTransferAction.value = action;
  stickerUserTransferIds.value = Array.from(new Set(targetIds));
  stickerUserTransferTargetUserId.value = "";
  await loadStickerTransferUserOptions();
  stickerUserTransferDialogVisible.value = true;
}

async function submitStickerUserTransfer() {
  if (!ensureStickerAdminOperation()) {
    return;
  }

  if (!stickerUserTransferIds.value.length) {
    ElMessage.warning("请选择要操作的素材");
    return;
  }

  if (!stickerUserTransferTargetUserId.value) {
    ElMessage.warning("请选择目标用户");
    return;
  }

  stickerUserTransferSubmitting.value = true;
  const actionLabel = stickerUserTransferAction.value === "copy" ? "分享" : "转移";

  try {
    const payload = {
      ids: stickerUserTransferIds.value,
      targetUserId: stickerUserTransferTargetUserId.value,
    };
    const res =
      stickerUserTransferAction.value === "copy"
        ? await copyStickersToUser(payload)
        : await moveStickersToUser(payload);
    const result = res || {};

    const successCount = Array.isArray(result?.list)
      ? result.list.length
      : Number(result?.total || 0);
    const failedCount = Array.isArray(result?.failed) ? result.failed.length : 0;
    const warningCount = Array.isArray(result?.warnings) ? result.warnings.length : 0;

    if (successCount > 0) {
      ElNotification.success(
        `${actionLabel}成功 ${successCount} 条${failedCount ? `，失败 ${failedCount} 条` : ""}${warningCount ? `，警告 ${warningCount} 条` : ""}`,
      );
      stickerUserTransferDialogVisible.value = false;
      resetCheckStatus(ids);
      await getList();
    } else if (failedCount > 0) {
      ElMessage.error(`${actionLabel}失败 ${failedCount} 条`);
    } else {
      ElMessage.warning(`未处理任何素材，请稍后重试`);
    }

    if (failedCount > 0) {
      ElNotification.warning({
        title: `${actionLabel}失败详情`,
        message: result.failed
          .slice(0, 3)
          .map((item: any) => `${item.id}: ${item.message}`)
          .join("；"),
        duration: 6000,
      });
    }

    if (warningCount > 0) {
      ElNotification.warning({
        title: `${actionLabel}完成，但有警告`,
        message: result.warnings
          .slice(0, 3)
          .map((item: any) => `${item.id}: ${item.message}`)
          .join("；"),
        duration: 6000,
      });
    }
  } catch (error: any) {
    ElMessage.error(error?.message || `${actionLabel}失败`);
  } finally {
    stickerUserTransferSubmitting.value = false;
  }
}

// 生成无空白PNG（仅对 png 后缀显示）
async function handleTrimPng(row) {
  if ((row.suffix || "").toLowerCase() !== "png") {
    ElMessage.warning("仅支持 PNG 图片");
    return;
  }
  try {
    const res = await trimPng({ id: String(row.id) });
    if (res && res.id) {
      ElMessage.success("生成成功");
    } else {
      ElMessage.success("生成成功");
    }
    getList();
  } catch (e) {
    ElMessage.error("生成失败");
  }
}

// SVG转PNG（仅对 svg 后缀显示）
async function handleSvgToPng(row) {
  if ((row.suffix || "").toLowerCase() !== "svg") {
    ElMessage.warning("仅支持 SVG 图片");
    return;
  }

  // 获取SVG原始尺寸
  try {
    const svgDimensions = await getSvgDimensions(row.url);
    if (svgDimensions) {
      svgToPngForm.value.originalWidth = (svgDimensions as any).width;
      svgToPngForm.value.originalHeight = (svgDimensions as any).height;
      svgToPngForm.value.aspectRatio = (svgDimensions as any).width / (svgDimensions as any).height;

      // 根据原始比例设置默认尺寸
      const baseSize = 512;
      if (svgToPngForm.value.aspectRatio > 1) {
        // 宽度大于高度
        svgToPngForm.value.width = baseSize;
        svgToPngForm.value.height = Math.round(baseSize / svgToPngForm.value.aspectRatio);
      } else {
        // 高度大于等于宽度
        svgToPngForm.value.height = baseSize;
        svgToPngForm.value.width = Math.round(baseSize * svgToPngForm.value.aspectRatio);
      }
    }
  } catch (error) {
    console.warn("获取SVG尺寸失败:", error);
    // 如果获取失败，使用默认值
    svgToPngForm.value.originalWidth = 512;
    svgToPngForm.value.originalHeight = 512;
    svgToPngForm.value.aspectRatio = 1;
    svgToPngForm.value.width = 512;
    svgToPngForm.value.height = 512;
  }

  // 打开尺寸设置弹窗
  currentSvgRow.value = row;
  svgToPngDialogVisible.value = true;
}

// 获取SVG原始尺寸
async function getSvgDimensions(svgUrl) {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = function () {
      const naturalWidth = (this as HTMLImageElement).naturalWidth;
      const naturalHeight = (this as HTMLImageElement).naturalHeight;

      console.log("SVG自然尺寸:", { naturalWidth, naturalHeight });

      // 如果naturalWidth和naturalHeight都是0或undefined，尝试解析SVG内容
      if (!naturalWidth || !naturalHeight || naturalWidth === 0 || naturalHeight === 0) {
        console.log("naturalWidth/naturalHeight无效，尝试解析SVG内容");
        parseSvgContent(svgUrl).then(resolve);
      } else {
        resolve({ width: naturalWidth, height: naturalHeight });
      }
    };

    img.onerror = function () {
      console.log("图片加载失败，尝试解析SVG内容");
      parseSvgContent(svgUrl).then(resolve);
    };

    // 设置crossOrigin以支持跨域
    img.crossOrigin = "anonymous";
    img.src = svgUrl;
  });
}

// 解析SVG内容的备用方法
async function parseSvgContent(svgUrl) {
  try {
    const response = await fetch(svgUrl);
    const svgText = await response.text();

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
    const svgElement = svgDoc.querySelector("svg");

    if (!svgElement) return { width: 512, height: 512 };

    let width, height;

    // 优先使用viewBox
    const viewBox = svgElement.getAttribute("viewBox");
    if (viewBox) {
      const parts = viewBox.split(/\s+/);
      if (parts.length >= 4) {
        width = parseFloat(parts[2]);
        height = parseFloat(parts[3]);
      }
    }

    // 如果没有viewBox，使用width和height属性
    if (!width || !height) {
      width = parseFloat(svgElement.getAttribute("width")) || 512;
      height = parseFloat(svgElement.getAttribute("height")) || 512;
    }

    console.log("SVG解析尺寸:", { width, height });
    return { width, height };
  } catch (error) {
    console.error("解析SVG失败:", error);
    return { width: 512, height: 512 };
  }
}

// 确认SVG转PNG
async function confirmSvgToPng() {
  if (!currentSvgRow.value?.id) return;

  try {
    ElMessage.info("正在转换SVG为PNG，请稍候...");
    const res = await svgToPng({
      id: String(currentSvgRow.value.id),
      width: svgToPngForm.value.width,
      height: svgToPngForm.value.height,
    });
    if (res && res.id) {
      ElMessage.success("SVG转PNG成功");
    } else {
      ElMessage.success("SVG转PNG成功");
    }
    svgToPngDialogVisible.value = false;
    getList();
  } catch (e) {
    ElMessage.error("SVG转PNG失败");
  }
}

async function openPsdSetDialog(mergeMode?: boolean | any) {
  resetPsdSetState();

  // 如果传入的是对象(row),则是从表格行点击的,默认使用单素材模式
  if (mergeMode && typeof mergeMode === "object") {
    ids.value = [mergeMode.id];
    psdSetMergeSticker.value = false;
  } else {
    // 如果是布尔值,则是从按钮点击的,使用传入的模式
    if (!ids.value.length) {
      ElMessage.warning("请选择要制作的素材");
      return;
    }
    psdSetMergeSticker.value = mergeMode === true;
  }
  // 打开弹窗时重置分页
  psdSetTemplatePageParams.currentPage = 1;
  psdSetDialogVisible.value = true;
  // 加载PSD模板文件夹
  loadPsdFolderTree();
  await loadPsdTemplatesForPsdSet();
}

async function openMaterialPublishConfigDialog() {
  if (!ids.value.length) {
    ElMessage.warning("请选择要处理的素材");
    return;
  }

  clearMaterialPublishConfigSelection();
  materialPublishConfigDialogVisible.value = true;
  materialPublishConfigSearchText.value = "";
  materialPublishConfigCurrentPage.value = 1;
  await ensureSelectedMaterialPreviews();
  await loadPublishConfigsForMaterialPublishDialog();
}

async function openMaterialProductConfigDialog() {
  if (!ids.value.length) {
    ElMessage.warning("请选择要处理的素材");
    return;
  }

  clearMaterialProductConfigSelection();
  materialProductConfigDialogVisible.value = true;
  materialProductConfigSearchText.value = "";
  materialProductConfigCurrentPage.value = 1;
  await ensureSelectedMaterialPreviews();
  await loadProductConfigsForMaterialDialog();
}

function handleCloseMaterialProductConfigDialog() {
  materialProductConfigDialogVisible.value = false;
  clearMaterialProductConfigSelection();
  materialProductConfigSearchText.value = "";
  materialProductConfigCurrentPage.value = 1;
}

function clearMaterialProductConfigSelection() {
  materialProductConfigSelectedIds.value = [];
  materialProductConfigGridRef.value?.clearCheckboxRow?.();
}

async function loadProductConfigsForMaterialDialog() {
  materialProductConfigLoading.value = true;
  try {
    const res: any = await productGenerationTemplateApi.getList({
      currentPage: 1,
      pageSize: 1000,
      isActive: true,
    });
    materialProductConfigOptions.value = Array.isArray(res?.list) ? res.list : [];
  } catch (error) {
    console.error("加载独立站商品配置失败:", error);
    ElMessage.error("加载独立站商品配置失败");
  } finally {
    materialProductConfigLoading.value = false;
  }
}

function handleCloseMaterialPublishConfigDialog() {
  materialPublishConfigDialogVisible.value = false;
  clearMaterialPublishConfigSelection();
  materialPublishConfigSearchText.value = "";
  materialPublishConfigCurrentPage.value = 1;
}

function clearMaterialPublishConfigSelection() {
  materialPublishConfigSelectedIds.value = [];
  materialPublishConfigGridRef.value?.clearCheckboxRow?.();
}

async function ensureSelectedMaterialPreviews() {
  const missingIds = materialPublishConfigMissingPreviewIds.value;
  if (!missingIds.length) {
    return;
  }

  await Promise.allSettled(
    missingIds.map(async (id) => {
      try {
        const detail = await fetchStickerDetail(id);
        cacheSelectedMaterialRows([detail]);
      } catch (error) {
        console.warn("补全素材预览失败", { id, error });
      }
    }),
  );
}

function isMaterialPublishConfigUsable(row: any) {
  return Boolean(String(row?.configData?.templateBinding?.psdTemplateId || "").trim());
}

function isMaterialProductConfigUsable(row: any) {
  return row?.isActive !== false && Boolean(String(row?.psdTemplateId || "").trim());
}

function handleMaterialPublishConfigCheckboxChange({ checked, row }) {
  if (!isMaterialPublishConfigUsable(row)) {
    return;
  }
  if (checked) {
    if (!materialPublishConfigSelectedIds.value.includes(row.id)) {
      materialPublishConfigSelectedIds.value.push(row.id);
    }
  } else {
    materialPublishConfigSelectedIds.value = materialPublishConfigSelectedIds.value.filter(
      (id) => id !== row.id,
    );
  }
}

function handleMaterialPublishConfigCheckboxAllChange({ checked }) {
  const currentPageIds = materialPublishConfigDataSource.value
    .filter((item: any) => isMaterialPublishConfigUsable(item))
    .map((item: any) => item.id);
  if (checked) {
    currentPageIds.forEach((id: string) => {
      if (!materialPublishConfigSelectedIds.value.includes(id)) {
        materialPublishConfigSelectedIds.value.push(id);
      }
    });
  } else {
    materialPublishConfigSelectedIds.value = materialPublishConfigSelectedIds.value.filter(
      (id) => !currentPageIds.includes(id),
    );
  }
}

function handleMaterialProductConfigCheckboxChange({ checked, row }) {
  if (!isMaterialProductConfigUsable(row)) return;
  const rowId = String(row.id);
  if (checked) {
    if (!materialProductConfigSelectedIds.value.includes(rowId)) {
      materialProductConfigSelectedIds.value.push(rowId);
    }
  } else {
    materialProductConfigSelectedIds.value = materialProductConfigSelectedIds.value.filter(
      (id) => id !== rowId,
    );
  }
}

function handleMaterialProductConfigCheckboxAllChange({ checked }) {
  const currentPageIds = materialProductConfigDataSource.value
    .filter((item: any) => isMaterialProductConfigUsable(item))
    .map((item: any) => String(item.id));
  if (checked) {
    currentPageIds.forEach((id) => {
      if (!materialProductConfigSelectedIds.value.includes(id)) {
        materialProductConfigSelectedIds.value.push(id);
      }
    });
  } else {
    materialProductConfigSelectedIds.value = materialProductConfigSelectedIds.value.filter(
      (id) => !currentPageIds.includes(id),
    );
  }
}

function handlePsdSetAutomationListCheckboxChange(action: any, fieldKey: string, event: any) {
  action.params[fieldKey] = (event?.records || [])
    .map((item: any) => String(item?.id || "").trim())
    .filter(Boolean);
}

async function handleCreatePsdSetsByPublishConfig() {
  if (!ids.value.length) {
    return ElMessage.warning("请先勾选素材");
  }
  if (!materialPublishConfigSelectedIds.value.length) {
    return ElMessage.warning("请选择发布配置");
  }

  const formatCheckResult = checkMaterialFormats();
  if (!formatCheckResult || !formatCheckResult.valid) {
    ElMessage.warning(formatCheckResult?.message || "素材格式检查异常，请重试");
    return;
  }

  materialPublishConfigSubmitting.value = true;
  try {
    const res: any = await stickerPsdSetApi.batchCreateByPublishConfig({
      stickerIds: ids.value.map((id) => String(id)),
      publishConfigIds: [...materialPublishConfigSelectedIds.value],
    });
    const createdCount = Array.isArray(res?.list)
      ? res.list.length
      : Number(res?.total || materialPublishConfigTaskCount.value);
    ElMessage.success(`成功创建 ${createdCount} 条套图任务`);
    handleCloseMaterialPublishConfigDialog();
    resetCheckStatus(ids);
  } catch (error: any) {
    console.error("按发布配置创建套图失败:", error);
    ElMessage.error(error?.message || "按发布配置创建套图失败");
  } finally {
    materialPublishConfigSubmitting.value = false;
  }
}

async function handleCreatePsdSetsByProductConfig() {
  if (!ids.value.length) {
    return ElMessage.warning("请先勾选素材");
  }
  if (!materialProductConfigSelectedIds.value.length) {
    return ElMessage.warning("请选择独立站商品配置");
  }

  const formatCheckResult = checkMaterialFormats();
  if (!formatCheckResult || !formatCheckResult.valid) {
    ElMessage.warning(formatCheckResult?.message || "素材格式检查异常，请重试");
    return;
  }

  materialProductConfigSubmitting.value = true;
  try {
    const res: any = await stickerPsdSetApi.batchCreateByProductGenerationTemplate({
      stickerIds: ids.value.map((id) => String(id)),
      productGenerationTemplateIds: [...materialProductConfigSelectedIds.value],
    });
    const productTotal = Number(res?.productTotal || materialProductConfigTaskCount.value);
    const psdSetTotal = Array.isArray(res?.list) ? res.list.length : Number(res?.total || 0);
    ElMessage.success(`已创建 ${psdSetTotal} 条套图任务，完成后生成 ${productTotal} 个独立站商品`);
    handleCloseMaterialProductConfigDialog();
    resetCheckStatus(ids);
  } catch (error: any) {
    console.error("按独立站商品配置创建套图失败:", error);
    ElMessage.error(error?.message || "创建独立站商品任务失败");
  } finally {
    materialProductConfigSubmitting.value = false;
  }
}

// 处理PSD模板缩略图加载错误
function handleTemplateImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
}

// 打开PSD模板详情
function openTemplateDetail(template: any) {
  currentPsdTemplate.value = template;
  psdTemplateDetailDialogVisible.value = true;
}

// 获取素材图片URL
function getMaterialImageUrl(materialId: string | number): string {
  const material = getMaterialById(materialId);
  const source = getMaterialPreviewSource(material);
  if (!source) return "";
  return getFastPreviewImageUrl(source, { width: 200 });
}

// 获取与配置项匹配的素材ID
function getMatchedMaterialId(configIndex: number): string | number | null {
  const config = templateConfigList.value[configIndex];
  if (!config) return null;

  // 如果配置项有关联的素材ID（单素材模式），直接返回
  if (config.materialId !== undefined) {
    return config.materialId;
  }

  // 合并模式：显示第一个素材作为参考（实际上所有素材都会合并）
  if (ids.value.length > 0) {
    return ids.value[0];
  }

  return null;
}

// 重置模板配置为默认
function handleResetConfigForTemplate(templateIndex: number) {
  const template = templateConfigList.value[templateIndex];
  ElMessageBox.confirm("确定要重置为默认配置吗？当前修改将丢失。", "重置确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      if (template.originalPsdInfo) {
        template.configText = JSON.stringify(template.originalPsdInfo, null, 2);
        template.psdInfo = JSON.parse(JSON.stringify(template.originalPsdInfo));
      } else {
        template.configText = "";
        template.psdInfo = null;
      }
      ElMessage.success("已重置为默认配置");
    })
    .catch(() => {});
}

// 验证配置文本格式（在生成套图前调用）
function validateConfigTexts(): boolean {
  for (const template of templateConfigList.value) {
    if (!template.configText || !template.configText.trim()) {
      // 空配置也是允许的
      continue;
    }

    try {
      JSON.parse(template.configText.trim());
    } catch (e) {
      ElMessage.warning(`模板"${template.name}"的配置JSON格式错误`);
      return false;
    }
  }
  return true;
}

// 保存配置到内存（暂存，不调用接口）
function handleSaveConfigToMemory() {
  // 验证所有配置文本的JSON格式
  let hasError = false;
  for (const template of templateConfigList.value) {
    if (!template.configText || !template.configText.trim()) {
      // 空配置也是允许的
      continue;
    }

    try {
      JSON.parse(template.configText.trim());
    } catch (e) {
      ElMessage.warning(`模板"${template.name}"的配置JSON格式错误，请修正后再保存`);
      hasError = true;
      break;
    }
  }

  if (hasError) {
    return;
  }

  // 配置已暂存到内存中（templateConfigList），无需额外操作
  ElMessage.success('配置已保存（暂存），点击"开始制作"时将使用此配置');
  // 可以选择关闭弹窗，或者保持打开让用户继续编辑
  // batchDetailConfigDialogVisible.value = false
}

// PSD模板相关逻辑

// 重置状态
function resetPsdSetState() {
  selectedPsdTemplateIds.value = [];
  psdSetTemplates.value = [];
  templateConfigList.value = [];
  batchDetailConfigDialogVisible.value = false;
  psdSetMergeSticker.value = false;
  psdSetTemplateSearchText.value = "";
  psdSetAutomationDialogVisible.value = false;
  psdSetParamsDialogVisible.value = false;
  psdSetParamsContent.value = "";
  psdTemplateDetailDialogVisible.value = false;
  currentPsdTemplate.value = null;
  psdSetTemplatePageParams.currentPage = 1;
  psdSetTemplatePageParams.pageSize = 12;
  psdSetTemplatePageParams.total = 0;
  psdSetTemplatePageParams.suitableSizesArray = [];
  psdSetTemplatePageParams.cutoutModesArray = [];
  selectedPsdFolderId.value = "__root__";
  psdSetAutomationActions.value = psdSetAutomationActions.value.map((action) => ({
    ...action,
    enabled: false,
    params: {
      ...(action.params || {}),
      promptId: null,
      productGenerationTemplateIds: [],
      publishConfigIds: [],
    },
  }));
}

async function loadProductTemplatesForPsdAutomation() {
  if (
    psdSetAutomationProductTemplatesLoading.value ||
    psdSetAutomationProductTemplates.value.length > 0
  ) {
    return;
  }

  psdSetAutomationProductTemplatesLoading.value = true;
  try {
    const res = await productGenerationTemplateApi.getList({
      currentPage: 1,
      pageSize: 1000,
      isActive: true,
    });
    psdSetAutomationProductTemplates.value = Array.isArray((res as any)?.list)
      ? (res as any).list
      : [];
  } catch (error) {
    console.error("加载商品生成模板失败:", error);
    ElMessage.error("加载商品生成模板失败");
  } finally {
    psdSetAutomationProductTemplatesLoading.value = false;
  }
}

async function fetchPublishConfigOptions() {
  const res = await getPublishConfigListApi();
  return Array.isArray(res) ? res : Array.isArray((res as any)?.list) ? (res as any).list : [];
}

async function loadPublishConfigsForPsdAutomation() {
  if (
    psdSetAutomationPublishConfigsLoading.value ||
    psdSetAutomationPublishConfigs.value.length > 0
  ) {
    return;
  }

  psdSetAutomationPublishConfigsLoading.value = true;
  try {
    const list = await fetchPublishConfigOptions();
    psdSetAutomationPublishConfigs.value = list.filter((item: any) => item?.isActive !== false);
  } catch (error) {
    console.error("加载任务配置失败:", error);
    ElMessage.error("加载任务配置失败");
  } finally {
    psdSetAutomationPublishConfigsLoading.value = false;
  }
}

async function loadPublishConfigsForMaterialPublishDialog() {
  materialPublishConfigLoading.value = true;
  try {
    materialPublishConfigOptions.value = await fetchPublishConfigOptions();
  } catch (error) {
    console.error("加载发布配置失败:", error);
    ElMessage.error("加载发布配置失败");
  } finally {
    materialPublishConfigLoading.value = false;
  }
}

// 加载PSD模板文件夹树
async function loadPsdFolderTree() {
  try {
    const res = await getStickerFolderTree({ folderCategory: "psdtemplate" });
    const rootFolders = (res || []).filter(
      (folder: any) => folder.parentId === null || folder.parentId === undefined,
    );

    // 创建根目录节点
    // 创建"全部"节点
    const allNode = {
      id: "__all__",
      name: "全部",
      path: "",
      parentId: null,
      children: [],
      isRoot: true,
    };

    const uncatNode = {
      id: "__root__",
      name: "未分类",
      path: "",
      parentId: null,
      children: [],
      isRoot: false,
    };

    psdFolderTreeData.value = [allNode, uncatNode, ...rootFolders];
  } catch (error) {
    console.error("加载PSD文件夹失败:", error);
  }
}

// PSD文件夹切换
function handlePsdFolderChange(value: string | null | undefined) {
  selectedPsdFolderId.value = value || "__all__";
  psdSetTemplatePageParams.currentPage = 1;
  loadPsdTemplatesForPsdSet();
}

// 加载PSD模板列表
async function loadPsdTemplatesForPsdSet() {
  psdSetTemplatesLoading.value = true;
  try {
    const res = await psdTemplateApi.getPsdTemplatePage({
      currentPage: psdSetTemplatePageParams.currentPage,
      pageSize: psdSetTemplatePageParams.pageSize,
      searchKeyword: psdSetTemplateSearchText.value.trim() || undefined,
      suitableSizes: psdSetTemplatePageParams.suitableSizesArray?.length
        ? psdSetTemplatePageParams.suitableSizesArray.join(",")
        : undefined,
      cutoutModes: psdSetTemplatePageParams.cutoutModesArray?.length
        ? psdSetTemplatePageParams.cutoutModesArray.join(",")
        : undefined,
      enabled: true,
      folderId:
        selectedPsdFolderId.value === "__all__"
          ? undefined
          : selectedPsdFolderId.value === "__root__"
            ? null
            : selectedPsdFolderId.value,
    });
    // 处理 suitableSizes 和 cutoutModes 字段（从字符串转为数组）
    psdSetTemplates.value = (res.list || []).map((item) => {
      if (item && typeof item.suitableSizes === "string") {
        try {
          item.suitableSizes = item.suitableSizes
            ? item.suitableSizes
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [];
        } catch (e) {
          item.suitableSizes = [];
        }
      }
      if (item && typeof item.cutoutModes === "string") {
        try {
          item.cutoutModes = item.cutoutModes
            ? item.cutoutModes
                .split(",")
                .map((mode) => mode.trim())
                .filter(Boolean)
            : [];
        } catch (e) {
          item.cutoutModes = [];
        }
      }
      return item;
    });
    psdSetTemplatePageParams.total = res.total || 0;
  } catch (error) {
    console.error("加载PSD模板失败:", error);
    ElMessage.error("加载PSD模板失败");
  } finally {
    psdSetTemplatesLoading.value = false;
  }
}

// 切换选中状态
function togglePsdTemplate(templateId: string | number) {
  const id = String(templateId);
  const index = selectedPsdTemplateIds.value.indexOf(id);
  if (index > -1) {
    selectedPsdTemplateIds.value.splice(index, 1);
  } else {
    selectedPsdTemplateIds.value.push(id);
  }
}

// 搜索防抖
const debouncedSearchPsdTemplates = useDebounceFn(() => {
  if (psdSetDialogVisible.value) {
    psdSetTemplatePageParams.currentPage = 1;
    loadPsdTemplatesForPsdSet();
  }
}, 500);

watch(psdSetTemplateSearchText, () => {
  if (psdSetDialogVisible.value) {
    debouncedSearchPsdTemplates();
  }
});

watch(psdSetAutomationDialogVisible, (visible) => {
  if (visible) {
    loadProductTemplatesForPsdAutomation();
    loadPublishConfigsForPsdAutomation();
  }
});

// 全选/取消全选
function handlePsdTemplateSelectAll() {
  if (isAllPsdTemplatesSelected.value) {
    filteredPsdSetTemplates.value.forEach((tpl) => {
      const id = String(tpl.id);
      const index = selectedPsdTemplateIds.value.indexOf(id);
      if (index > -1) {
        selectedPsdTemplateIds.value.splice(index, 1);
      }
    });
  } else {
    filteredPsdSetTemplates.value.forEach((tpl) => {
      const id = String(tpl.id);
      if (!selectedPsdTemplateIds.value.includes(id)) {
        selectedPsdTemplateIds.value.push(id);
      }
    });
  }
}

// 详细配置弹窗处理
function handlePsdTemplateDetailConfig() {
  if (!selectedPsdTemplateIds.value.length) {
    ElMessage.warning("请先选择PSD模板");
    return;
  }

  const selectedTemplates = psdSetTemplates.value.filter((tpl) =>
    selectedPsdTemplateIds.value.includes(String(tpl.id)),
  );

  if (selectedTemplates.length === 0) {
    ElMessage.warning("未找到选中的模板数据");
    return;
  }

  templateConfigList.value = [];

  if (psdSetMergeSticker.value) {
    templateConfigList.value = selectedTemplates.map((template) => {
      const templateConfig = template.psdTemplateConfig;
      let psdInfoObj = null;
      let configText = "";
      if (templateConfig) {
        try {
          psdInfoObj =
            typeof templateConfig === "string" ? JSON.parse(templateConfig) : templateConfig;
          configText = JSON.stringify(psdInfoObj, null, 2);
        } catch (e) {
          console.error("解析模板配置失败:", e);
          configText = typeof templateConfig === "string" ? templateConfig : "";
        }
      }
      const originalPsdInfo = psdInfoObj ? JSON.parse(JSON.stringify(psdInfoObj)) : null;

      return {
        id: String(template.id),
        name: template.name || "未命名模板",
        thumbnail: template.thumbnail || template.preview || template.image,
        psdInfo: psdInfoObj,
        originalPsdInfo,
        configText,
        materialId: undefined,
      };
    });
  } else {
    ids.value.forEach((materialId) => {
      selectedTemplates.forEach((template) => {
        const templateConfig = template.psdTemplateConfig;
        let psdInfoObj = null;
        let configText = "";
        if (templateConfig) {
          try {
            psdInfoObj =
              typeof templateConfig === "string" ? JSON.parse(templateConfig) : templateConfig;
            configText = JSON.stringify(psdInfoObj, null, 2);
          } catch (e) {
            console.error("解析模板配置失败:", e);
            configText = typeof templateConfig === "string" ? templateConfig : "";
          }
        }
        const originalPsdInfo = psdInfoObj ? JSON.parse(JSON.stringify(psdInfoObj)) : null;
        const material = dataSource.value.find((item) => String(item.id) === String(materialId));
        const materialName = material?.name || `素材${materialId}`;

        templateConfigList.value.push({
          id: `${template.id}_${materialId}`,
          name: `${materialName} × ${template.name || "未命名模板"}`,
          thumbnail: template.thumbnail || template.preview || template.image,
          psdInfo: psdInfoObj,
          originalPsdInfo,
          configText,
          materialId: materialId,
        });
      });
    });
  }

  batchDetailConfigDialogVisible.value = true;
}

// 构建PSD套图发送参数
function buildPsdSetAutomationConfig() {
  console.log("[PSD 套图] 自动化动作:", psdSetAutomationActions.value);
  const automations = psdSetAutomationActions.value
    .filter((action) => {
      console.log(
        "[PSD 套图] 动作",
        action.key,
        "enabled:",
        action.enabled,
        "params:",
        action.params,
      );
      return action.enabled;
    })
    .map((action) => ({
      action_type: action.key,
      config: Object.fromEntries(
        Object.entries(action.params || {}).filter(
          ([, value]) => value !== "" && value !== null && value !== undefined,
        ),
      ),
    }));

  console.log("[PSD 套图] 构建的自动化配置:", automations);
  if (!automations.length) {
    return undefined;
  }

  return automations;
}

function buildPsdSetParams() {
  const configBindings: Array<{
    stickerId?: string;
    stickerIds?: string[];
    psdTemplateId: string;
    psdTemplateConfig?: any;
  }> = [];
  if (templateConfigList.value.length > 0) {
    templateConfigList.value.forEach((config) => {
      let psdInfo = null;
      if (config.configText && config.configText.trim()) {
        try {
          psdInfo = JSON.parse(config.configText.trim());
        } catch (e) {
          console.error("解析配置失败:", e);
        }
      }

      const normalizedTemplateId = psdSetMergeSticker.value
        ? String(config.id || "").trim()
        : String(config.id || "").split("_")[0]?.trim();
      if (!normalizedTemplateId) {
        return;
      }

      if (psdSetMergeSticker.value) {
        configBindings.push({
          stickerIds: ids.value.map((id) => String(id)),
          psdTemplateId: normalizedTemplateId,
          psdTemplateConfig: psdInfo,
        });
        return;
      }

      configBindings.push({
        stickerId:
          config.materialId !== undefined && config.materialId !== null
            ? String(config.materialId)
            : undefined,
        psdTemplateId: normalizedTemplateId,
        psdTemplateConfig: psdInfo,
      });
    });
  }

  const automationConfig = buildPsdSetAutomationConfig();

  return {
    stickerIds: ids.value.map((id) => String(id)),
    psdTemplateIds: [...selectedPsdTemplateIds.value],
    mergeSticker: psdSetMergeSticker.value,
    configBindings: configBindings.length > 0 ? configBindings : undefined,
    meta: automationConfig ? { automations: automationConfig } : undefined,
  };
}

// 显示PSD套图发送参数
function showPsdSetParams() {
  const params = buildPsdSetParams();
  psdSetParamsContent.value = JSON.stringify(params, null, 2);
  psdSetParamsDialogVisible.value = true;
}

async function handleCreatePsdSets() {
  if (!ids.value.length) {
    return ElMessage.warning("请先勾选素材");
  }
  if (!selectedPsdTemplateIds.value.length) {
    return ElMessage.warning("请选择PSD模板");
  }

  // 检查图片格式是否符合要求
  const formatCheckResult = checkMaterialFormats();
  if (!formatCheckResult || !formatCheckResult.valid) {
    ElMessage.warning(formatCheckResult?.message || "素材格式检查异常，请重试");
    return;
  }

  // 验证配置文本格式（如果有配置）
  if (templateConfigList.value.length > 0 && !validateConfigTexts()) {
    return;
  }

  psdSetSubmitting.value = true;
  try {
    const params = buildPsdSetParams();
    console.log("[PSD 套图] 发送参数:", JSON.stringify(params, null, 2));
    const res = await stickerPsdSetApi.batchCreate(params);
    console.log("[PSD 套图] 后端响应:", res);
    const createdList = (res as any)?.list;
    const createdCount = Array.isArray(createdList)
      ? createdList.length
      : ((res as any)?.total ?? psdSetTaskCount.value);

    // 如果后端返回“所有组合都已存在”，列表通常为空，此时提示为“无需重复创建”
    if (Array.isArray(createdList) && createdList.length === 0) {
      ElMessage.info((res as any)?.message || "所有组合都已存在，无需重复创建");
    } else {
      ElMessage.success(`成功创建 ${createdCount} 条套图任务`);
    }
    psdSetDialogVisible.value = false;
    resetPsdSetState();
    resetCheckStatus(ids);
  } catch (error: any) {
    console.error("创建套图失败:", error);
    ElMessage.error(error?.message || "创建套图失败");
  } finally {
    psdSetSubmitting.value = false;
  }
}

// 判断素材格式是否无效
function isMaterialFormatInvalid(materialId: string | number): boolean {
  const material = getMaterialById(materialId);
  if (!material) return false;

  const materialSuffix = (material.suffix || "").toLowerCase().replace(/^\./, "");
  if (!materialSuffix) return true; // 没有后缀视为无效

  // 检查格式是否在允许列表中（jpg、png、jpeg）
  return !psdSetAllowedFormats.includes(materialSuffix);
}

// 获取素材的后缀
function getMaterialSuffix(materialId: string | number): string {
  const material = getMaterialById(materialId);
  if (!material || !material.suffix) return "";
  return (material.suffix || "").toLowerCase().replace(/^\./, "");
}

function getMaterialById(materialId: string | number) {
  const id = String(materialId);
  return dataSource.value.find((item) => String(item.id) === id) || selectedMaterialCache[id];
}

function getMaterialPreviewSource(material: any): string {
  return String(
    material?.url ||
      material?.previewUrl ||
      material?.preview ||
      material?.thumbnail ||
      material?.imageUrl ||
      material?.image ||
      material?.ossObjectName ||
      "",
  ).trim();
}

// 获取素材的形状标签（长图/宽图/正方图）
function getMaterialShapeLabel(materialId: string | number): string {
  const material = getMaterialById(materialId);
  if (!material || !material.aspectRatio) return "";
  const sizeShape = getSizeShapeByRatio(material.aspectRatio);
  return sizeShape?.label || "";
}

function getMaterialShapeKey(materialId: string | number): string {
  const material = getMaterialById(materialId);
  if (!material || !material.aspectRatio) return "";
  const sizeShape = getSizeShapeByRatio(material.aspectRatio);
  return sizeShape?.key || "";
}

// 获取素材的抠图状态
function getMaterialCutoutStatus(materialId: string | number): boolean | null {
  const material = getMaterialById(materialId);
  if (!material) return null;
  return material.isCutout ?? null;
}

function getMaterialCutoutMode(materialId: string | number): string {
  const isCutout = getMaterialCutoutStatus(materialId);
  if (isCutout === true) return "CUTOUT";
  if (isCutout === false) return "NON_CUTOUT";
  return "";
}

function applyMaterialFilters(materialId: string | number) {
  const sizeKey = getMaterialShapeKey(materialId);
  const cutoutMode = getMaterialCutoutMode(materialId);

  if (!sizeKey && !cutoutMode) {
    ElMessage.warning("当前素材缺少可用于筛选的比例和抠图信息");
    return;
  }

  psdSetTemplatePageParams.currentPage = 1;
  psdSetTemplatePageParams.suitableSizesArray = sizeKey ? [sizeKey] : [];
  psdSetTemplatePageParams.cutoutModesArray = cutoutMode ? [cutoutMode] : [];
  loadPsdTemplatesForPsdSet();
}

// 检查素材格式是否符合PSD模板要求
function checkMaterialFormats() {
  // 使用固定的允许格式列表
  const allowedFormatsSet = new Set(psdSetAllowedFormats);

  // 检查所有选中素材的格式
  const invalidMaterials: Array<{ id: string | number; name: string; suffix: string }> = [];

  ids.value.forEach((id) => {
    const material = dataSource.value.find((item) => String(item.id) === String(id));
    if (!material) return;

    const materialSuffix = (material.suffix || "").toLowerCase().replace(/^\./, "");

    // 如果素材没有后缀，也视为无效
    if (!materialSuffix) {
      invalidMaterials.push({
        id: material.id,
        name: material.name || `ID: ${material.id}`,
        suffix: "未知格式",
      });
      return;
    }

    // 检查格式是否在允许列表中
    if (!allowedFormatsSet.has(materialSuffix)) {
      invalidMaterials.push({
        id: material.id,
        name: material.name || `ID: ${material.id}`,
        suffix: materialSuffix,
      });
    }
  });

  // 如果有不符合格式的素材，返回错误信息
  if (invalidMaterials.length > 0) {
    const allowedFormatsList = psdSetAllowedFormats.join("、");
    const invalidNames = invalidMaterials
      .slice(0, 5)
      .map((m) => `${m.name}(${m.suffix})`)
      .join("、");
    const moreCount = invalidMaterials.length > 5 ? `等${invalidMaterials.length}个` : "";

    return {
      valid: false,
      message: `所选素材中包含不符合格式要求的图片。\n允许的格式：${allowedFormatsList}\n不符合的素材：${invalidNames}${moreCount}\n请移除不符合格式的素材后重试。`,
    };
  }

  return { valid: true, message: "" };
}

const delayUpdateList = useDebounceFn(() => {
  getList();
}, 1999);

function singleFileUploaded(payload?: { useAiGenerate?: boolean }) {
  console.log("单个文件上传");
  if (!payload?.useAiGenerate) delayUpdateList();
}

/**
 * @group
 */

const aiGenDialogVisible = ref(false);
const aiGenPrompt = ref("");
const aiGenerateRawInfo = ref("");
const aiGenDialogLoading = ref(false);
let aiGenRow = null;

const aiTableLoading = ref<Record<string, boolean>>({});

// meta 内容解析（metaDialogVisible/metaDialogContent 已在前方定义）
const parsedMetaData = computed(() => {
  if (!metaDialogContent.value) return null;
  try {
    // 尝试解析 JSON 字符串
    const parsed = JSON.parse(metaDialogContent.value);
    return parsed;
  } catch (error) {
    // 如果解析失败，返回 null，显示原始内容
    return null;
  }
});

function onAiTableAutoGenerate(row) {
  if (aiTableLoading.value[row.id]) return;
  aiGenRow = row;
  aiGenPrompt.value = "";
  aiGenerateRawInfo.value = "";
  aiGenDialogVisible.value = true;
}

async function submitAiGenDialog() {
  if (!aiGenRow) return;
  aiGenDialogLoading.value = true;
  aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: true };
  try {
    await handleAiAutoGenerate(
      aiGenRow,
      () => {
        aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: false };
        aiGenDialogLoading.value = false;
        aiGenDialogVisible.value = false;
        aiGenRow = null;
      },
      aiGenPrompt.value,
      aiGenerateRawInfo.value,
    );
  } catch (e) {
    aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: false };
    aiGenDialogLoading.value = false;
    aiGenDialogVisible.value = false;
    aiGenRow = null;
  }
}

async function handleAiAutoGenerate(row, cb, prompt, aiGenerateRawInfo) {
  try {
    const res = await aiAutoGenerateMaterialInfo({
      id: row.id,
      prompt: prompt || "",
      aiGenerateRawInfo: aiGenerateRawInfo || "",
    });
    const resultData = unwrapAiTaskResult(res);

    if (isQueuedAiTaskResult(resultData)) {
      notifyQueuedAiTask(resultData, {
        title: "AI自动生成任务已提交",
        fallbackMessage: "正在后台生成素材信息，完成后会通过消息中心通知；需要查看最新结果时请手动刷新。",
      });
      if (typeof cb === "function") cb();
      return;
    }

    // 更新行数据 - 兼容不同的返回结构
    if (resultData) {
      row.name = resultData.name || row.name;
      row.nameEn = resultData.nameEn || row.nameEn;
      row.description = resultData.description || row.description;
      row.descriptionEn = resultData.descriptionEn || row.descriptionEn;
      row.keywords = resultData.keywords || row.keywords;
      row.keywordsEn = resultData.keywordsEn || row.keywordsEn;
      // 更新侵权信息
      if (typeof resultData.isInfringement === "boolean") {
        row.isInfringement = resultData.isInfringement;
      }
      // 更新适用商品
      if (resultData.suitableFor) {
        row.suitableFor = resultData.suitableFor;
      }
    }
    const infringementText =
      typeof resultData?.isInfringement === "boolean"
        ? resultData.isInfringement
          ? "（已标记为侵权）"
          : "（已标记为非侵权）"
        : "";
    const suitableText = resultData?.suitableFor ? `，适用商品：${resultData.suitableFor}` : "";
    ElNotification.success(`AI自动生成内容成功${infringementText}${suitableText}`);
    if (typeof cb === "function") cb();
  } catch (e) {
    ElNotification.error("AI自动生成内容失败");
    if (typeof cb === "function") cb();
  }
}

// 查找相似图：使用视觉向量搜索当前图片的近似素材
async function handleFindSimilar(row) {
  if (visualSimilarSearchDisabled) {
    ElMessage.warning(VISUAL_SIMILAR_SEARCH_DISABLED_MESSAGE);
    return;
  }
  const imageUrl = String(row?.url || row?.originUrl || "").trim();
  if (!imageUrl) {
    ElMessage.warning("该图片暂无可搜索的图片地址");
    return;
  }
  const success = await loadVectorSimilarResults(imageUrl);
  if (success) {
    setSimilarImageActiveStatus({
      previewUrl: imageUrl,
      sourceType: "url",
      sourceLabel: row?.name || row?.code || "当前素材",
    });
  }
}

// 处理宽度变化
function handleWidthChange(value) {
  // 根据原始宽高比自动计算高度
  if (svgToPngForm.value.aspectRatio) {
    svgToPngForm.value.height = Math.round(value / svgToPngForm.value.aspectRatio);
  }
}

// 应用预设尺寸
function applyPreset(preset) {
  // 设置宽度，高度会自动计算
  svgToPngForm.value.width = preset.width;
  handleWidthChange(preset.width);
}

async function handleViewDetail(row: any) {
  detailDialogVisible.value = true;
  detailDialogLoading.value = true;
  stickerDetailCurrent.value = null;
  try {
    stickerDetailCurrent.value = await fetchStickerDetail(row);
  } catch (error: any) {
    detailDialogVisible.value = false;
    ElMessage.error(error?.message || "获取素材详情失败");
  } finally {
    detailDialogLoading.value = false;
  }
}

async function handleEdit(row) {
  let detail = row;
  try {
    detail = await fetchStickerDetail(row);
  } catch (error: any) {
    ElMessage.error(error?.message || "获取素材详情失败");
    return;
  }

  editForm.value = {
    id: detail.id,
    code: detail.code || "",
    name: detail.name || "",
    nameEn: detail.nameEn || "",
    description: detail.description || "",
    descriptionEn: detail.descriptionEn || "",
    keywords: detail.keywords || "",
    keywordsEn: detail.keywordsEn || "",
    suitableFor: detail.suitableFor || "",
    suffix: detail.suffix || "",
    isCustom: normalizeBooleanValue(detail.isCustom),
    isPublic: normalizeBooleanValue(detail.isPublic),
    isTexture: normalizeBooleanValue(detail.isTexture),
    seamless: normalizeBooleanValue(detail.seamless),
    isInfringement: normalizeBooleanValue(detail.isInfringement),
    isCutout: normalizeBooleanValue(detail.isCutout),
    originUrl: detail.originUrl || "",
    source: detail.source || "",
    folderId: detail.folderId ?? detail.folder?.id ?? null,
    folderPath: detail.folder || detail.folderEntity?.path || "",
    // 只读字段（用于显示）
    width: detail.width || null,
    height: detail.height || null,
    aspectRatio: detail.aspectRatio || null,
    fileSize: detail.fileSize || null,
    colorPalette: detail.colorPalette || "",
    phash: detail.phash || "",
  };
  editDialogVisible.value = true;
}

async function handleGenerateMaterialCode() {
  if (generatingCode.value) return;

  generatingCode.value = true;
  try {
    const res = await generateStickerCode();
    const generatedCode = (res?.code || res?.data?.code || "").trim().toLowerCase();

    if (!generatedCode) {
      throw new Error("未返回有效编码");
    }

    editForm.value.code = generatedCode;
    ElMessage.success("编码生成成功");
  } catch (e: any) {
    ElMessage.error(e?.message || "编码生成失败");
  } finally {
    generatingCode.value = false;
  }
}

async function submitEdit() {
  editLoading.value = true;
  try {
    const inputCode = (editForm.value.code || "").trim().toLowerCase();
    if (inputCode && !/^[a-z]{3,6}\d{2,7}$/.test(inputCode)) {
      ElMessage.warning("编码格式必须为 3-6 位字母 + 2-7 位数字，例如 abc123");
      return;
    }

    // 只提交可编辑的字段，排除只读字段
    const submitData = {
      id: editForm.value.id,
      code: inputCode,
      name: editForm.value.name,
      nameEn: editForm.value.nameEn,
      description: editForm.value.description,
      descriptionEn: editForm.value.descriptionEn,
      keywords: editForm.value.keywords,
      keywordsEn: editForm.value.keywordsEn,
      suitableFor: editForm.value.suitableFor,
      suffix: editForm.value.suffix,
      isCustom: editForm.value.isCustom,
      isPublic: editForm.value.isPublic,
      isTexture: editForm.value.isTexture,
      seamless: editForm.value.seamless,
      isInfringement: editForm.value.isInfringement,
      isCutout: editForm.value.isCutout,
      originUrl: editForm.value.originUrl,
      source: editForm.value.source,
    };
    await updateAssetLibrary(submitData);
    ElNotification.success("保存成功");
    editDialogVisible.value = false;
    getList();
  } catch (e) {
    ElNotification.error("保存失败");
  } finally {
    editLoading.value = false;
  }
}

// 图片预览相关方法（closeImagePreview 已在前方定义）
function openImagePreview(imageUrl: string, imageName?: string) {
  currentImageUrl.value = imageUrl;
  imagePreviewVisible.value = true;
}

// 显示meta详情
async function handleShowMetaDetail(row: any) {
  try {
    const detail = await fetchStickerDetail(row);
    showMetaDetail(detail.meta);
  } catch (error: any) {
    ElMessage.error(error?.message || "获取素材详情失败");
  }
}

function showMetaDetail(meta: any) {
  if (!meta) {
    ElMessage.warning("该素材没有元数据信息");
    return;
  }

  try {
    // 如果 meta 是字符串，直接使用
    if (typeof meta === "string") {
      metaDialogContent.value = meta;
    } else {
      // 如果是对象，转换为格式化的 JSON 字符串
      metaDialogContent.value = JSON.stringify(meta, null, 2);
    }
    metaDialogVisible.value = true;
  } catch (error) {
    console.error("处理元数据失败:", error);
    ElMessage.error("处理元数据失败，请检查数据格式");
    // 即使出错也显示原始数据
    metaDialogContent.value = String(meta);
    metaDialogVisible.value = true;
  }
}

// 生成图片信息
async function handleGenerateImageInfo(row) {
  if (!row.url) {
    ElMessage.error("图片无有效链接，无法生成图片信息");
    return;
  }

  try {
    aiTableLoading.value = { ...aiTableLoading.value, [row.id]: true };
    const res = await generateImageInfo({
      id: row.id,
    });
    if (res) {
      // 更新行数据 - 直接更新 dataSource 中对应的行
      const index = dataSource.value.findIndex((item) => String(item.id) === String(row.id));
      if (index !== -1) {
        const targetRow = dataSource.value[index];
        if (res.width !== undefined) {
          targetRow.width = res.width;
          targetRow.resolutionWidth = res.width;
        }
        if (res.height !== undefined) {
          targetRow.height = res.height;
          targetRow.resolutionHeight = res.height;
        }
        if (res.aspectRatio !== undefined) targetRow.aspectRatio = res.aspectRatio;
        if (res.fileSize !== undefined) targetRow.fileSize = res.fileSize;
        if (res.colorPalette !== undefined) targetRow.colorPalette = res.colorPalette;
        if (res.suffix !== undefined) targetRow.suffix = res.suffix;
        if (res.phash !== undefined) targetRow.phash = res.phash;
        if (res.isCutout !== undefined) targetRow.isCutout = res.isCutout;
      }

      // 同时更新当前 row 对象（用于显示）
      if (res.width !== undefined) {
        row.width = res.width;
        row.resolutionWidth = res.width;
      }
      if (res.height !== undefined) {
        row.height = res.height;
        row.resolutionHeight = res.height;
      }
      if (res.aspectRatio !== undefined) row.aspectRatio = res.aspectRatio;
      if (res.fileSize !== undefined) row.fileSize = res.fileSize;
      if (res.colorPalette !== undefined) row.colorPalette = res.colorPalette;
      if (res.suffix !== undefined) row.suffix = res.suffix;
      if (res.phash !== undefined) row.phash = res.phash;
      if (res.isCutout !== undefined) row.isCutout = res.isCutout;

      const infoParts = [];
      if (res.width && res.height) {
        infoParts.push(`尺寸: ${res.width} × ${res.height}`);
      }
      if (res.fileSize) {
        infoParts.push(`大小: ${formatFileSize(res.fileSize)}`);
      }
      if (res.colorPalette) {
        const colors = res.colorPalette.split(",").slice(0, 3).join(", ");
        infoParts.push(`色系: ${colors}${res.colorPalette.split(",").length > 3 ? "..." : ""}`);
      }
      if (res.isCutout !== undefined) {
        infoParts.push(`抠图: ${res.isCutout ? "是" : "否"}`);
      }

      ElNotification.success(
        `生成图片信息成功${infoParts.length ? `：${infoParts.join("，")}` : ""}`,
      );
      // 刷新列表以更新所有数据
      await getList();
    }
  } catch (e) {
    console.error("生成图片信息失败:", e);
    ElMessage.error(`生成图片信息失败: ${e?.message || "未知错误"}`);
  } finally {
    aiTableLoading.value = { ...aiTableLoading.value, [row.id]: false };
  }
}

function buildImageProcessingPrefillOptions(row: any, taskType: "process" | "variations") {
  if (taskType !== "process") {
    return {};
  }

  const isSeamlessMaterial = normalizeBooleanValue(row?.seamless) || normalizeBooleanValue(row?.isTexture);
  if (!isSeamlessMaterial) {
    return {};
  }

  const params: Record<string, any> = {
    mode: "sticker",
    tileMode: "mirror",
    blendPercent: 12,
    preserveTransparent: true,
  };
  if (!row?.width || !row?.height) {
    params.outputSize = 1024;
  }

  return {
    operationKeyword: "无缝",
    operations: [
      {
        type: "seamless-tile",
        params,
      },
    ],
  };
}

function openImageProcessingWorkbench(row: any, taskType: "process" | "variations" = "process") {
  if (!isAdmin.value) {
    ElMessage.warning("当前功能仅管理员可用");
    return;
  }

  const imageUrl = String(row?.url || "").trim();
  if (!imageUrl) {
    ElMessage.warning("当前素材缺少可处理的图片地址");
    return;
  }

  router.push(
    buildImageProcessingRouteLocation({
      imageUrl,
      title: row?.name || row?.nameEn || "",
      sourceName: row?.name || row?.nameEn || "",
      sourceModule: "material",
      sourceRecordId: row?.id ? String(row.id) : "",
      taskType,
      openCreate: true,
      ...buildImageProcessingPrefillOptions(row, taskType),
    }),
  );
}

// 处理dropdown操作命令
async function handleOperationCommand(command: string, row: any) {
  const rowId = String(row?.id || "");
  closeOperationDropdown(rowId);
  if (rowId) {
    operationCommandLoadingId.value = rowId;
  }
  try {
    switch (command) {
      case "view-detail":
        await handleViewDetail(row);
        break;
      case "edit":
        await handleEdit(row);
        break;
      case "download":
        await handleDownload(row);
        break;
      case "download-rotated-90":
        await handleDownloadRotated90(row);
        break;
      case "ai-generate":
        await onAiTableAutoGenerate(row);
        break;
      case "generate-image-info":
        await handleGenerateImageInfo(row);
        break;
      case "find-similar":
        await handleFindSimilar(row);
        break;
      case "view-publish-usage":
        await handleViewPublishUsageRecords(row);
        break;
      case "view-meta":
        await handleShowMetaDetail(row);
        break;
      case "trim-png":
        await handleTrimPng(row);
        break;
      case "svg-to-png":
        await handleSvgToPng(row);
        break;
      case "copy":
        await handleCopy(row);
        break;
      case "copy-origin-url":
        await handleCopyText(row?.url || "", "图片链接");
        break;
      case "copy-to-user":
        openStickerUserTransferDialog("copy", row);
        break;
      case "move-to-user":
        openStickerUserTransferDialog("move", row);
        break;
      case "create-ps-set":
        openPsdSetDialog(row);
        break;
      case "view-ps-sets":
        relatedPsdSetDialogRef.value?.open(row);
        break;
      case "image-process":
        openImageProcessingWorkbench(row, "process");
        break;
      case "image-split":
        openImageProcessingWorkbench(row, "variations");
        break;
      case "video-production":
        ElMessage.info("视频制作功能开发中...");
        break;
      case "story-script":
        await openStoryScriptDialog(row);
        break;
      case "delete":
        await handleDelete(row);
        break;
      default:
        console.warn("未知的操作命令:", command);
    }
  } catch (error: any) {
    console.error("[material] 操作执行失败:", command, error);
    ElMessage.error(error?.message || "操作失败，请稍后重试");
  } finally {
    if (operationCommandLoadingId.value === rowId) {
      operationCommandLoadingId.value = "";
    }
  }
}

function handleOperationDropdownVisibleChange(visible: boolean, row: any) {
  const rowId = String(row?.id || "");
  hideAllOperationSubmenus();
  if (visible) {
    const previousRowId = activeOperationRowId.value;
    if (previousRowId && previousRowId !== rowId) {
      operationDropdownRefs.get(previousRowId)?.handleClose?.();
    }
    activeOperationRowId.value = rowId;
    return;
  }
  if (!rowId || activeOperationRowId.value === rowId) {
    activeOperationRowId.value = "";
  }
}

function setOperationDropdownRef(rowId: any, el: any) {
  const key = String(rowId || "");
  if (!key) return;
  if (el) {
    operationDropdownRefs.set(key, el);
  } else {
    operationDropdownRefs.delete(key);
  }
}

// URL上传相关
const urlUploadModalVisible = ref(false);
const urlUploadLoading = ref(false);
const urlUploadFormRef = ref();
const urlPreviewVisible = ref(false);
const imageInfo = ref(null);

const urlUploadForm = reactive({
  url: "",
  name: "",
  nameEn: "",
  description: "",
  descriptionEn: "",
  keywords: "",
  keywordsEn: "",
  isCustom: false,
  isInfringement: false,
  useAiGenerate: false, // 是否使用AI生成补全内容
  folderId: null as string | null, // 文件夹ID
  folderPath: "", // 展示路径
});

const urlUploadFormRules = {
  url: [
    { required: true, message: "请输入图片URL", trigger: "blur" },
    {
      pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?.*)?$/i,
      message: "请输入有效的图片URL",
      trigger: "blur",
    },
  ],
  name: [{ required: true, message: "请输入文件名", trigger: "blur" }],
};

// 重置URL上传表单
function resetUrlUploadForm() {
  urlUploadForm.url = "";
  urlUploadForm.name = "";
  urlUploadForm.nameEn = "";
  urlUploadForm.description = "";
  urlUploadForm.descriptionEn = "";
  urlUploadForm.keywords = "";
  urlUploadForm.keywordsEn = "";
  urlUploadForm.isCustom = false;
  urlUploadForm.isInfringement = false;
  urlUploadForm.useAiGenerate = false;
  urlUploadForm.folderId = getSelectedStickerFolderTargetId();
  urlUploadForm.folderPath = selectedStickerFolderPath.value || "";
  urlPreviewVisible.value = false;
  imageInfo.value = null;
}

// 监听URL变化，自动显示预览
watch(
  () => urlUploadForm.url,
  (newUrl) => {
    if (newUrl && isValidImageUrl(newUrl)) {
      urlPreviewVisible.value = true;
      imageInfo.value = null;
    } else {
      urlPreviewVisible.value = false;
      imageInfo.value = null;
    }
  },
);

// 验证是否为有效的图片URL
function isValidImageUrl(url) {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?.*)?$/i;
  return imageExtensions.test(url);
}

// 处理预览图片加载成功
function handlePreviewLoad(event) {
  const img = event.target;
  imageInfo.value = {
    width: img.naturalWidth,
    height: img.naturalHeight,
    size: "未知",
  };
}

// 处理预览图片加载失败
function handlePreviewError() {
  ElMessage.warning("图片预览加载失败，请检查URL是否正确");
  urlPreviewVisible.value = false;
}

// 从URL获取图片文件
async function fetchImageFromUrl(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      headers: {
        Accept: "image/*",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      throw new Error("URL指向的不是图片文件");
    }

    const blob = await response.blob();

    // 检查文件大小（限制10MB）
    if (blob.size > 10 * 1024 * 1024) {
      throw new Error("图片文件过大，请选择小于10MB的图片");
    }

    // 从URL或content-type获取文件扩展名
    let extension = "jpg";
    const urlMatch = url.match(/\.([a-zA-Z0-9]+)(\?.*)?$/i);
    if (urlMatch) {
      extension = urlMatch[1].toLowerCase();
    } else if (contentType) {
      const typeMatch = contentType.match(/image\/([a-zA-Z0-9]+)/i);
      if (typeMatch) {
        extension = typeMatch[1].toLowerCase();
        if (extension === "jpeg") extension = "jpg";
      }
    }

    // 创建File对象
    const fileName = urlUploadForm.name || `image_${Date.now()}.${extension}`;
    const file = new File([blob], fileName, { type: blob.type });

    return { file, extension };
  } catch (error) {
    console.error("获取图片失败:", error);
    throw new Error(`获取图片失败: ${error.message}`);
  }
}

let submenuHideTimer: ReturnType<typeof setTimeout> | null = null;

function hideAllOperationSubmenus() {
  if (submenuHideTimer) {
    clearTimeout(submenuHideTimer);
    submenuHideTimer = null;
  }

  const allSubmenus = document.querySelectorAll(".op-submenu") as NodeListOf<HTMLElement>;
  allSubmenus.forEach((submenu) => {
    submenu.style.opacity = "0";
    submenu.style.visibility = "hidden";
    submenu.style.pointerEvents = "none";
    submenu.style.transform = "";
  });
}

function closeOperationDropdown(rowId?: string) {
  const targetRowId = rowId || activeOperationRowId.value;
  if (targetRowId) {
    operationDropdownRefs.get(targetRowId)?.handleClose?.();
  }
  if (!rowId || activeOperationRowId.value === rowId) {
    activeOperationRowId.value = "";
  }
  hideAllOperationSubmenus();
}

// 处理子菜单显示和定位
function handleSubmenuEnter(event: MouseEvent) {
  const menuItem = event.currentTarget as HTMLElement;
  if (!menuItem) return;

  const submenu = menuItem.querySelector(".op-submenu") as HTMLElement;
  if (!submenu) return;

  // 先隐藏所有其他子菜单
  const allSubmenus = document.querySelectorAll(".op-submenu") as NodeListOf<HTMLElement>;
  allSubmenus.forEach((sm) => {
    if (sm !== submenu) {
      sm.style.opacity = "0";
      sm.style.visibility = "hidden";
      sm.style.pointerEvents = "none";
    }
  });

  // 清除之前的隐藏定时器
  if (submenuHideTimer) {
    clearTimeout(submenuHideTimer);
    submenuHideTimer = null;
  }

  // 获取菜单项的位置（使用 getBoundingClientRect 获取相对于视口的位置）
  const menuItemRect = menuItem.getBoundingClientRect();

  // 临时显示子菜单到屏幕外以获取其真实尺寸
  submenu.style.position = "fixed";
  submenu.style.left = "-9999px";
  submenu.style.top = "0";
  submenu.style.right = "auto"; // 清除可能存在的 right 属性
  submenu.style.opacity = "1";
  submenu.style.visibility = "visible";
  submenu.style.transform = "none";
  submenu.style.pointerEvents = "none";

  // 强制重排以获取真实尺寸
  void submenu.offsetWidth;

  // 获取子菜单的尺寸
  const submenuWidth = submenu.offsetWidth || 160; // 如果没有获取到，使用默认值 160px
  const submenuHeight = submenu.offsetHeight;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 计算子菜单的位置（优先右侧，空间不足则左侧）
  let left = menuItemRect.right + 4;
  let top = menuItemRect.top;

  // 检查右侧是否有足够空间
  if (left + submenuWidth > viewportWidth - 10) {
    // 如果右侧空间不足，显示在左侧
    left = menuItemRect.left - submenuWidth - 4;
    // 确保不会超出屏幕左边界
    if (left < 10) {
      left = 10;
    }
  }

  // 检查底部是否有足够空间，如果不够则向上调整
  if (top + submenuHeight > viewportHeight - 10) {
    top = Math.max(10, viewportHeight - submenuHeight - 10);
  }

  // 确保顶部不会超出屏幕
  if (top < 10) {
    top = 10;
  }

  // 设置子菜单的最终位置和样式
  // 使用 setProperty 并设置 important 标志，确保位置不被 CSS 覆盖
  submenu.style.setProperty("right", "auto", "important");
  submenu.style.setProperty("left", `${left}px`, "important");
  submenu.style.setProperty("top", `${top}px`, "important");
  submenu.style.opacity = "1";
  submenu.style.visibility = "visible";
  submenu.style.transform = "translateX(0)";
  submenu.style.pointerEvents = "auto";

  // 确保位置设置生效，强制重排
  void submenu.offsetWidth;
}

function handleSubmenuLeave(event: MouseEvent) {
  const menuItem = event.currentTarget as HTMLElement;
  if (!menuItem) return;

  const submenu = menuItem.querySelector(".op-submenu") as HTMLElement;
  if (!submenu) return;

  // 清除之前的定时器
  if (submenuHideTimer) {
    clearTimeout(submenuHideTimer);
  }

  // 延迟隐藏，允许鼠标移动到子菜单
  submenuHideTimer = setTimeout(() => {
    // 检查鼠标是否仍在子菜单上
    const elementUnderMouse = document.elementFromPoint(event.clientX, event.clientY);
    const isHovering =
      elementUnderMouse?.closest(".op-submenu") === submenu ||
      elementUnderMouse?.closest(".has-submenu") === menuItem;

    if (!isHovering) {
      submenu.style.opacity = "0";
      submenu.style.visibility = "hidden";
      submenu.style.pointerEvents = "none";
    }
  }, 200);
}

// 保持子菜单可见
function handleSubmenuKeepVisible(event: MouseEvent) {
  const submenu = event.currentTarget as HTMLElement;
  if (!submenu) return;

  // 先隐藏所有其他子菜单
  const allSubmenus = document.querySelectorAll(".op-submenu") as NodeListOf<HTMLElement>;
  allSubmenus.forEach((sm) => {
    if (sm !== submenu) {
      sm.style.opacity = "0";
      sm.style.visibility = "hidden";
      sm.style.pointerEvents = "none";
    }
  });

  // 清除隐藏定时器
  if (submenuHideTimer) {
    clearTimeout(submenuHideTimer);
    submenuHideTimer = null;
  }

  // 确保子菜单可见
  submenu.style.opacity = "1";
  submenu.style.visibility = "visible";
  submenu.style.pointerEvents = "auto";
}

// 隐藏子菜单
function handleSubmenuHide(event: MouseEvent) {
  const submenu = event.currentTarget as HTMLElement;
  if (!submenu) return;

  // 延迟隐藏
  submenuHideTimer = setTimeout(() => {
    submenu.style.opacity = "0";
    submenu.style.visibility = "hidden";
    submenu.style.pointerEvents = "none";
  }, 200);
}

// 复制文本到剪贴板
async function handleCopyText(text: string, label: string) {
  if (!text) {
    ElMessage.warning(`${label}为空，无法复制`);
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success(`${label}已复制到剪贴板`);
  } catch (error) {
    // 降级方案：使用传统方法
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      ElMessage.success(`${label}已复制到剪贴板`);
    } catch (e) {
      ElMessage.error("复制失败");
    }
    document.body.removeChild(textarea);
  }
}

// 处理URL上传
async function handleUrlUpload() {
  if (!urlUploadFormRef.value) return;

  try {
    // 验证表单
    await urlUploadFormRef.value.validate();

    urlUploadLoading.value = true;

    // 获取图片文件
    const { file, extension } = await fetchImageFromUrl(urlUploadForm.url);

    // 上传到COS
    const userAccount =
      (userStore.user as any)?.account ||
      userStore.user?.shortName ||
      userStore.user?.name ||
      "anonymous";
    const userId = (userStore.user as any)?.id || (userStore as any).userInfo?.id;
    const cos = await uploadToCOS({
      file,
      category: "sticker", // 素材上传到 sticker 分类
      account: userAccount,
      userId,
    });
    const { key, url } = cos;

    // 计算图片宽高及宽高比（如果预览阶段已经获取到了尺寸，则优先使用）
    const width = imageInfo.value?.width || 0;
    const height = imageInfo.value?.height || 0;
    const aspectRatio = width && height ? width / height : undefined;

    // 上传到服务器
    await uploadMaterialFile({
      url,
      name: urlUploadForm.name,
      nameEn: urlUploadForm.nameEn,
      description: urlUploadForm.description,
      descriptionEn: urlUploadForm.descriptionEn,
      keywords: urlUploadForm.keywords,
      keywordsEn: urlUploadForm.keywordsEn,
      suffix: extension,
      isCustom: urlUploadForm.isCustom,
      isInfringement: urlUploadForm.isInfringement,
      width,
      height,
      aspectRatio,
      userId: userStore.user?.id,
      useAiGenerate: urlUploadForm.useAiGenerate, // 是否使用AI生成补全内容
      folderId: urlUploadForm.folderId ?? null,
    });

    ElNotification.success("图片上传成功");
    urlUploadModalVisible.value = false;
    resetUrlUploadForm();

    // 刷新列表
    getList();
  } catch (error) {
    console.error("URL上传失败:", error);
    ElMessage.error(`上传失败: ${error.message}`);
  } finally {
    urlUploadLoading.value = false;
  }
}
</script>
<style scoped>
.material-compact-preview {
  position: relative;
  display: inline-flex;
  width: 96px;
  height: 96px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.material-compact-preview__image-wrap {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.material-compact-preview__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: zoom-in;
}

.material-compact-preview__empty {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.material-compact-preview__corner {
  position: absolute;
  top: 3px;
  left: 3px;
  z-index: 2;
  display: inline-flex;
  height: 16px;
  align-items: center;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.92);
  color: #fff;
  font-size: 10px;
  line-height: 1;
  pointer-events: none;
}

.material-compact-name {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.material-compact-name__title {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-compact-name__title--wrap {
  white-space: normal;
  word-break: break-word;
}

/* 编码列 */
.code-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  line-height: 1.3;
}

.code-value {
  color: var(--el-text-color-regular);
  font-family: "Courier New", "Consolas", monospace;
  font-size: 11px;
}

.code-clickable {
  cursor: pointer;
  padding: 1px 4px;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.code-clickable:hover {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.id-value {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.id-clickable {
  cursor: pointer;
  padding: 1px 4px;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.id-clickable:hover {
  background-color: var(--el-color-info-light-9);
  color: var(--el-color-info);
}

/* 文件信息合并列 */
.file-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 2px 0;
}

.file-info__tag,
.file-info__size,
.file-info__resolution,
.file-info__ratio {
  font-size: 10px;
  line-height: 14px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  padding: 0 4px;
  border-radius: 2px;
  width: fit-content;
  font-family: "Courier New", "Consolas", monospace;
  letter-spacing: 0.3px;
}

.material-compact-name__meta {
  display: flex;
  min-width: 0;
  gap: 5px;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 抠图标签 */
.cutout-tag {
  font-size: 11px;
}

.material-compact-badge {
  display: inline-flex;
  height: 20px;
  align-items: center;
  padding: 0 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
}

.material-compact-badge--success {
  border-color: var(--el-color-success-light-7);
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.material-compact-badge--danger {
  border-color: var(--el-color-danger-light-7);
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

/* 预览图片容器样式 */
.preview-image-wrapper {
  position: relative;
  width: 120px;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.table-preview-stack--custom {
  position: relative;
  padding-top: 20px;
}

.preview-custom-corner {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: inline-flex;
  height: 17px;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  color: #f5fff0;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0;
  white-space: nowrap;
  background: linear-gradient(135deg, #a3ff12 0%, #39ff14 55%, #00dc82 100%);
  border-radius: 999px;
  box-shadow:
    0 0 0 1px rgba(210, 255, 165, 0.52),
    0 3px 8px rgba(57, 255, 20, 0.24);
  pointer-events: none;
}

.preview-image {
  width: 120px;
  height: auto;
  max-height: 120px;
  object-fit: contain;
  cursor: pointer;
  display: block;
}

.preview-image-loading {
  display: none !important;
  visibility: hidden;
  opacity: 0;
}

.preview-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 12px;
  pointer-events: none;
  background: transparent;
  z-index: 1;
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

.design-model-dialog :deep(.el-dialog__body) {
  max-height: calc(100vh - 160px);
  overflow: hidden;
}

.design-model-flex {
  height: 100%;
  overflow: hidden;
}

.design-model-content {
  max-height: calc(100vh - 80px);
  overflow: auto;
}

.selected-materials {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  height: 100%;
}

.selected-materials .thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-materials .thumb {
  width: 72px;
  height: 72px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
}

.selected-materials .thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.template-header {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.template-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
  margin-bottom: 4px;
}

.template-description {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  margin-top: 4px;
}

.template-content {
  width: 100%;
}

.config-summary {
  width: 100%;
  text-align: center;
}

.config-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
  font-size: 12px;
}

.config-label {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  font-size: 11px;
}

.config-value {
  color: var(--el-color-primary);
  font-weight: 600;
  font-size: 11px;
}

.config-default {
  color: var(--el-text-color-placeholder);
  font-style: italic;
  font-size: 11px;
  padding: 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  border: 1px dashed var(--el-border-color-light);
}

.section-title {
  font-size: 14px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: none;
  padding-bottom: 0;
}

.section-title .selected-count {
  font-size: 13px;
  color: var(--el-color-primary);
  font-weight: 500;
  padding: 2px 8px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(64, 158, 255, 0.3);
}

.section-title .template-count-info {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: normal;
  margin-left: 4px;
}

.result-info {
  grid-column: 1 / -1;
}

:global(.psd-set-dialog.el-dialog) {
  --psd-set-workbench-min-height: 560px;
  display: flex;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 760px;
  flex-direction: column;
  margin: 0;
  overflow: hidden;
  background: var(--el-dialog-bg-color, var(--el-bg-color));
}

:global(.psd-set-dialog.el-dialog .el-dialog__header) {
  flex: 0 0 auto;
  margin-right: 0;
  padding: 14px 16px 12px;
}

:global(.psd-set-dialog.el-dialog .el-dialog__body) {
  flex: 1 1 0;
  display: grid;
  grid-template-rows: minmax(var(--psd-set-workbench-min-height), 1fr) auto;
  gap: 10px;
  height: 0;
  min-height: 0;
  padding: 0 16px 16px;
  overflow: auto;
  background: var(--el-bg-color-page);
}

.psd-set-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
  flex-wrap: wrap;
}

.psd-set-dialog__header-main {
  min-width: 0;
}

.psd-set-dialog__header-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.psd-set-dialog__header-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.psd-set-dialog__header-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  border: 1px solid var(--el-border-color-lighter);
}

.psd-set-dialog__header-chip.is-accent {
  background: rgba(24, 160, 88, 0.1);
  border-color: rgba(24, 160, 88, 0.18);
  color: #188058;
}

.psd-set-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.psd-set-panel__eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--el-color-primary);
}

.psd-set-panel__desc {
  margin-top: -6px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.psd-set-panel__tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.psd-set-panel__alert {
  margin: 0;
}

.psd-set-mode-inline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.psd-set-mode-label {
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 500;
}

.psd-set-mode-group {
  margin: 0;
}

.psd-set-mode-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.psd-set-footer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.psd-set-footer-main {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  flex-wrap: wrap;
}

.psd-set-footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;
}

.psd-set-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--el-color-info);
  font-size: 12px;
  min-width: 0;
}

.psd-set-info :deep(.el-icon) {
  font-size: 14px;
  margin-top: 0;
  flex-shrink: 0;
}

.psd-set-info-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}

.psd-set-info-chip {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--el-color-info-light-9);
  color: var(--el-color-info-dark-2);
  line-height: 1.35;
  font-size: 12px;
}

.psd-set-info-chip--subtle {
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
}

.psd-set-automation-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.psd-set-automation-dialog__header {
  width: 100%;
}

.psd-set-automation-dialog__eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--el-color-primary);
}

.psd-set-automation-dialog__title {
  margin-top: 4px;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.psd-set-automation-dialog__subtitle,
.psd-set-automation-dialog__intro {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.psd-set-automation-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.psd-set-automation-item.is-active {
  border-color: rgba(24, 160, 88, 0.24);
  background: linear-gradient(135deg, rgba(24, 160, 88, 0.08), rgba(24, 160, 88, 0.02));
  box-shadow: 0 8px 24px rgba(24, 160, 88, 0.08);
}

.psd-set-automation-head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.psd-set-automation-key {
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.psd-set-automation-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.psd-set-automation-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 720px;
}

.psd-set-automation-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.psd-set-automation-field-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.psd-set-automation-field-key {
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.psd-set-automation-list {
  width: 100%;
}

.psd-set-automation-list__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.psd-set-automation-list__toolbar .el-input {
  max-width: 360px;
  min-width: 240px;
}

.psd-set-automation-list__grid {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
}

.psd-set-automation-list__grid :deep(.vxe-table) {
  font-size: 12px;
}

.psd-set-automation-list__grid :deep(.vxe-header--row) {
  height: 34px;
}

.psd-set-automation-list__grid :deep(.vxe-header--column) {
  height: 34px !important;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  font-size: 12px !important;
  background: var(--el-fill-color-light);
}

.psd-set-automation-list__grid :deep(.vxe-header--column .vxe-cell),
.psd-set-automation-list__grid :deep(.vxe-header--column .vxe-cell--title) {
  min-height: 18px !important;
  line-height: 18px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  font-size: 12px !important;
  font-weight: 600 !important;
}

.psd-set-automation-list__grid :deep(.vxe-body--column) {
  height: 32px;
  padding-top: 5px;
  padding-bottom: 5px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  margin-left: auto;
}

@media (max-width: 960px) {
  .psd-set-body {
    grid-template-columns: 1fr;
  }

  .psd-set-content-container {
    flex-direction: column;
  }

  .psd-template-folder-filter {
    width: 100%;
    align-items: stretch;
  }

  .psd-template-folder-filter__cascader {
    width: 100%;
  }

  .psd-set-footer {
    align-items: stretch;
  }

  .psd-set-dialog :deep(.el-dialog__body) {
    padding: 0 12px 12px;
  }

  .psd-set-footer-actions,
  .footer-actions {
    width: 100%;
    justify-content: flex-end;
    gap: 8px;
  }

}

.material-dnd-grid :deep(.vxe-table--body tbody tr.is-dragging-row) {
  opacity: 0.6 !important;
  background: var(--el-color-primary-light-9) !important;
}

.material-dnd-grid :deep(.vxe-table--body tbody tr.is-publish-usage-occupied .vxe-body--column) {
  background: rgba(245, 158, 11, 0.1) !important;
}

.material-dnd-grid :deep(.vxe-table--body tbody tr.is-publish-usage-available .vxe-body--column) {
  background: rgba(34, 197, 94, 0.08) !important;
}

.material-dnd-grid
  :deep(.vxe-table--body tbody tr.is-publish-usage-occupied:hover .vxe-body--column) {
  background: rgba(245, 158, 11, 0.16) !important;
}

.material-dnd-grid
  :deep(.vxe-table--body tbody tr.is-publish-usage-available:hover .vxe-body--column) {
  background: rgba(34, 197, 94, 0.13) !important;
}

.material-dnd-grid
  :deep(.vxe-table--body tbody tr.has-publish-usage-badge .vxe-body--column:first-child) {
  position: relative;
  cursor: pointer;
}

.material-dnd-grid
  :deep(.vxe-table--body tbody tr.has-publish-usage-badge .vxe-body--column:first-child::before) {
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

.material-dnd-grid
  :deep(.vxe-table--body tbody tr.is-publish-usage-occupied .vxe-body--column:first-child::before) {
  content: "已用";
  background: rgba(217, 119, 6, 0.94);
}

.material-dnd-grid
  :deep(.vxe-table--body tbody tr.is-publish-usage-available .vxe-body--column:first-child::before) {
  content: "未用";
  background: rgba(22, 163, 74, 0.94);
}

.material-drag-ghost {
  opacity: 0.4 !important;
  background: var(--el-color-primary-light-8) !important;
}

.flex.pb-4,
.search-bar {
  gap: 12px;
  /* 收紧整体水平/垂直间距 */
  flex-wrap: wrap;
  align-items: center;
}

.flex.pb-4 > *,
.search-bar > * {
  margin-bottom: 0;
}

/* 顶部筛选：el-form 栅格布局（PC） */
.search-bar-form {
  width: 100%;
  margin-bottom: 8px;
  /* 收紧表单与列表间距 */
}

.search-bar-form :deep(.el-form-item) {
  margin-bottom: 6px;
  /* 控件间垂直间距收紧 */
}

.search-bar-form :deep(.el-form-item__label) {
  padding-right: 6px;
  /* 收紧 label 与控件的左右间距 */
  text-align: right;
  /* label 右对齐，保持整齐 */
}

.search-bar-form :deep(.el-form-item__label),
.search-bar-form :deep(.el-form-item__content) {
  line-height: 32px;
}

.search-bar-form :deep(.el-form-item__content) {
  min-height: 32px;
  display: flex;
  align-items: center;
  /* 解决 switch / date 等控件高度导致的错位 */
}

.search-btn-offset {
  padding-left: 84px;
  /* 与表单 label-width 对齐，避免按钮列挤压导致大屏错位 */
  display: flex;
  align-items: center;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  width: 240px;
  /* 默认固定宽度 */
  flex-shrink: 0;
}

/* 宽字段 - 用于需要更大输入空间的字段 */
.search-field-wide {
  width: 320px;
}

/* 窄字段 - 用于开关等简单控件 */
.search-field-narrow {
  width: 120px;
}

/* 时间字段 - 需要更宽的空间 */
.search-field-time {
  width: 380px;
}

.search-label {
  width: 48px;
  min-width: 48px;
  text-align: right;
  padding-right: 4px;
  line-height: 32px;
  flex-shrink: 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.search-field > :not(.search-label) {
  flex: 1;
  min-width: 0;
  max-width: 100%;
}

.search-field .el-input,
.search-field .el-select {
  width: 100%;
}

.search-field .el-button {
  white-space: nowrap;
}

.search-bar-form :deep(.el-form-item__content) > * {
  width: 100%;
}

.search-bar-form :deep(.el-switch) {
  width: auto;
  /* switch 不要被拉伸占满，避免看起来不齐 */
}

/* 搜索表单容器 - Flex布局 */
.search-form-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 10px 12px;
  /* 紧凑的间距 */
  margin-bottom: 12px;
}

.search-button-field {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  flex-basis: 100%;
  margin-top: 8px;
}

.search-field-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  width: 100%;
  flex-basis: 100%;
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 相似搜索 - 占满整行 */
.search-field-similar {
  width: 100%;
  flex-basis: 100%;
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px solid var(--el-border-color-lighter);
  align-items: flex-start;
}

.search-field-similar .phash-form-row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.search-field-similar .phash-form-row .el-input {
  max-width: none;
  flex: 1 1 auto;
}

.search-field-similar .phash-mode {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.search-field-similar .phash-top-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}

.search-field-similar .phash-top-row .el-input {
  min-width: 260px;
  flex: 1 1 420px;
}

.search-field-similar .phash-top-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.search-field-similar .phash-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  flex: 0 0 auto;
}

.search-field-similar .el-button {
  white-space: nowrap;
}

/* 移除按钮字段的特定宽度限制 */

/* 搜索区域允许换行 */
.search-bar .el-row {
  flex-wrap: wrap !important;
  /* 强制允许换行，避免挤压 */
  row-gap: 12px;
  column-gap: 8px;
}

.search-bar-form :deep(.el-row) {
  flex-wrap: wrap;
  /* 允许控件换行，避免挤压重叠 */
  row-gap: 6px;
  column-gap: 6px;
  /* 进一步收紧间距 */
}

.search-bar-form :deep(.el-col) {
  /* 不要覆盖 Element Plus 栅格（span/lg/xl），否则大屏下会错位且宽度调整不生效 */
  max-width: 100%;
  padding-left: 0;
  padding-right: 0;
}

.search-bar-form :deep(.el-input),
.search-bar-form :deep(.el-select),
.search-bar-form :deep(.el-date-editor) {
  width: 100%;
  min-width: 0;
  /* 让控件随栅格收缩，不会撑破布局 */
  max-width: 100%;
}

.search-bar-form :deep(.el-input__wrapper),
.search-bar-form :deep(.el-select__wrapper),
.search-bar-form :deep(.el-date-editor .el-input__wrapper) {
  min-width: 0;
  max-width: 100%;
}

@media (max-width: 1366px) {
  /* 在较小分辨率下进一步缩小避免溢出 */
  .search-bar-form :deep(.el-col) {
    /* 保持栅格布局，不再通过 flex-basis/min-width 干预 */
  }
}

.search-actions-col {
  display: flex;
  justify-content: flex-start;
  /* 让筛选表单操作按钮靠左对齐 */
  margin-top: 4px;
}

.search-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  /* 左对齐避免两侧空白 */
  column-gap: 6px;
  row-gap: 6px;
  align-items: center;
}

.phash-form-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.phash-mode {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.phash-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

@media (max-width: 992px) {
  .phash-form-row {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .search-actions-col {
    justify-content: flex-start;
  }

  .search-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 600px) {
  .flex.pb-4,
  .search-bar {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
    padding-bottom: 8px !important;
  }

  .flex.pb-4 > *,
  .search-bar > * {
    width: 100% !important;
    min-width: 0 !important;
    margin-right: 0 !important;
    margin-bottom: 8px !important;
  }

  .el-input,
  .el-select,
  .el-button,
  .el-date-editor {
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box;
  }

  .date-range-picker {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box;
  }

  .date-range-picker .el-date-editor,
  .date-range-picker .el-range-editor {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
  }

  .content-container {
    padding: 0 4px !important;
  }
}

.table-header {
  border-radius: 4px;
  box-shadow: rgba(17, 17, 26, 0.15) 0px 1px 0px;
}

h1 {
  font-size: 1rem;
}

/* 步骤内容区块统一透明背景风格 */
.step-content {
  margin-bottom: 24px;
  border-radius: 8px;
  padding: 24px;
  transition:
    box-shadow 0.2s,
    background 0.2s,
    opacity 0.2s;
  background: transparent;
  color: #fff;
}

.step-active {
  box-shadow: 0 0 0 3px #409eff44;
  background: rgba(64, 158, 255, 0.1) !important;
  /* 高亮：主色+透明 */
  opacity: 1;
}

.step-inactive {
  background: rgba(100, 100, 100, 0.06) !important;
  /* 弱化：深灰+透明 */
  opacity: 0.6;
  filter: grayscale(0.2);
}

/* 去除步骤内容内部的白色/灰色背景 */
.bg-gray-50,
.border-blue-200,
.bg-blue-50 {
  background: transparent !important;
  border-color: rgba(64, 158, 255, 0.15) !important;
}

.design-model-flex {
  display: flex;
  flex-direction: row;
  height: 100%;
}

.steps-vertical {
  flex-shrink: 0;
  min-width: 180px;
  margin-right: 32px;
}

.design-model-content {
  flex: 1;
  overflow-y: auto;
}

/* URL上传容器布局 */
.url-upload-container {
  display: flex;
  gap: 20px;
  min-height: 300px;
}

.form-section {
  flex: 1;
  min-width: 0;
}

.preview-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.preview-label {
  margin-bottom: 12px;
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

.image-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafafa;
  padding: 16px;
  min-height: 200px;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  object-fit: contain;
  background-color: #fff;
  background-image:
    linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
    linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
    linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
  background-size: 10px 10px;
  background-position:
    0 0,
    0 5px,
    5px -5px,
    -5px 0px;
}

.image-info {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-placeholder,
.preview-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafafa;
  padding: 16px;
  min-height: 200px;
  color: #909399;
  text-align: center;
}

.preview-error {
  color: #f56c6c;
}

.error-text {
  font-size: 12px;
  margin-top: 4px;
}

.preview-placeholder p,
.preview-error p {
  margin: 8px 0 0 0;
  font-size: 14px;
}

/* SVG转PNG弹窗样式 */
.svg-to-png-form {
  padding: 16px 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.form-section {
  margin-bottom: 24px;
}

.original-info {
  margin-bottom: 16px;
  padding: 8px 12px;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
}

.aspect-ratio-info {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.preset-section {
  margin-bottom: 24px;
}

.preset-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.preset-buttons .el-button {
  height: auto;
  padding: 8px 12px;
  text-align: center;
  line-height: 1.2;
}

.preset-size {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.preview-section {
  margin-bottom: 16px;
}

.preview-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .url-upload-container {
    flex-direction: column;
    gap: 16px;
  }

  .preview-section {
    min-height: 150px;
  }

  .image-preview,
  .preview-placeholder,
  .preview-error {
    min-height: 150px;
  }

  .preset-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}

.material-publish-config-dialog {
  :deep(.el-dialog) {
    width: 1100px;
    height: 100vh;
    margin: 0;
    display: flex;
    flex-direction: column;
    background: var(--el-dialog-bg-color, var(--el-bg-color));
  }

  :deep(.el-dialog__header) {
    margin-right: 0;
    padding: 14px 16px 0;
  }

  :deep(.el-dialog__body) {
    flex: 1;
    overflow: hidden;
    padding: 0 16px 14px;
    background: var(--el-bg-color-page);
  }

  :deep(.el-dialog__footer) {
    flex-shrink: 0;
    padding: 10px 16px 14px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-dialog-bg-color, var(--el-bg-color));
  }
}

.material-publish-config-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  flex-wrap: wrap;
}

.material-publish-config-dialog__header-main {
  min-width: 0;
}

.material-publish-config-dialog__header-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.material-publish-config-dialog__header-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  border: 1px solid var(--el-border-color-lighter);
}

.material-publish-config-dialog__header-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.material-publish-config-dialog__body {
  display: grid;
  grid-template-columns: 520px minmax(0, 1fr);
  gap: 12px;
  height: 100%;
  min-height: calc(100vh - 144px);
  box-sizing: border-box;
}

.material-publish-config-dialog__panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  padding: 14px;
  border: 1px solid rgba(64, 158, 255, 0.08);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--el-bg-color), var(--el-fill-color-extra-light));
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
  overflow: auto;
}

.material-publish-config-dialog__panel--configs {
  align-self: start;
}

.material-publish-config-dialog__section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.material-publish-config-dialog__section-head--configs {
  align-items: flex-end;
}

.material-publish-config-dialog__section-title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.material-publish-config-dialog__section-eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--el-color-primary);
}

.material-publish-config-dialog__section-desc {
  margin-top: 2px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.material-publish-config-dialog__tag-list,
.material-publish-config-dialog__section-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.material-publish-config-dialog__warning {
  margin: 0;
}

.material-publish-config-dialog__warning :deep(.el-alert__title) {
  line-height: 1.6;
}

.material-publish-config-dialog__material-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 0;
  flex: 1 1 auto;
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
  align-content: start;
}

.material-publish-config-dialog__material-item {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 140px;
  flex-shrink: 0;
  padding: 0;
  border-radius: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}

.material-publish-config-dialog__material-item:hover {
  transform: translateY(-1px);
  border-color: rgba(64, 158, 255, 0.16);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
}

.material-publish-config-dialog__material-item--invalid {
  border-color: var(--el-color-danger);
  box-shadow: 0 0 0 1px rgba(245, 108, 108, 0.12);
}

.material-publish-config-dialog__material-preview {
  width: 100%;
  height: 120px;
  overflow: hidden;
  border-radius: 0;
  background: var(--el-fill-color-lighter);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.material-publish-config-dialog__material-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0 8px;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.material-publish-config-dialog__material-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: var(--el-fill-color-extra-light);
  border-top: 1px solid var(--el-border-color-lighter);
}

.material-publish-config-dialog__material-name {
  min-width: 0;
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-publish-config-dialog__material-suffix {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
}

.material-publish-config-dialog__search {
  width: min(280px, 100%);
}

.material-publish-config-dialog__search :deep(.el-input) {
  width: 100%;
}

.material-publish-config-dialog__table {
  flex: none;
  min-height: 0;
}

.material-publish-config-dialog__table
  :deep(.material-publish-config-dialog__row--disabled .vxe-body--column) {
  background: var(--el-fill-color-light);
}

.material-publish-config-dialog__table :deep(.material-publish-config-dialog__row--disabled .vxe-cell),
.material-publish-config-dialog__table
  :deep(.material-publish-config-dialog__row--disabled .vxe-cell--wrapper),
.material-publish-config-dialog__table
  :deep(.material-publish-config-dialog__row--disabled .vxe-cell--label) {
  opacity: 0.58;
}

.material-publish-config-dialog__table
  :deep(.material-publish-config-dialog__row--disabled:hover .vxe-body--column) {
  background: var(--el-fill-color);
}

.material-publish-config-dialog__table
  :deep(.material-publish-config-dialog__row--disabled .vxe-cell--checkbox.is--disabled) {
  opacity: 0.5;
}

.material-publish-config-dialog__pagination,
.material-publish-config-dialog__footer,
.material-publish-config-dialog__footer-actions {
  display: flex;
}

.material-publish-config-dialog__pagination {
  justify-content: flex-end;
  padding-top: 6px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.material-publish-config-dialog__footer {
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.material-publish-config-dialog__footer-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}

.material-publish-config-dialog__footer-chip {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.material-publish-config-dialog__footer-tip {
  font-size: 12px;
  color: var(--el-color-danger);
}

.material-publish-config-dialog__footer-tip--muted {
  color: var(--el-text-color-secondary);
}

.material-publish-config-dialog__footer-actions {
  gap: 8px;
  flex-shrink: 0;
}

@media (max-width: 960px) {
  .material-publish-config-dialog {
    :deep(.el-dialog__body) {
      overflow: auto;
    }
  }

  .material-publish-config-dialog__body {
    grid-template-columns: 1fr;
    height: auto;
    min-height: auto;
  }

  .material-publish-config-dialog__section-head--configs,
  .material-publish-config-dialog__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .material-publish-config-dialog__search {
    width: 100%;
  }

  .material-publish-config-dialog__footer-actions {
    justify-content: flex-end;
  }
}

@media (max-width: 640px) {
  .material-publish-config-dialog {
    :deep(.el-dialog__header) {
      padding: 12px 12px 0;
    }

    :deep(.el-dialog__body) {
      padding: 0 12px 12px;
    }

    :deep(.el-dialog__footer) {
      padding: 10px 12px 12px;
    }
  }

  .material-publish-config-dialog__material-item {
    min-width: 0;
  }

  .material-publish-config-dialog__material-preview {
    width: 100%;
  }
}
</style>
<style>
.el-popper.is-pure {
  overflow: visible !important;
}

.el-popper[x-placement] {
  overflow: visible !important;
}

/* 确保所有 dropdown 相关的容器都允许溢出 */
.el-dropdown__popper {
  overflow: visible !important;
}

.el-dropdown__popper .el-dropdown-menu {
  overflow: visible !important;
}

.el-dropdown__popper .el-dropdown-menu__item {
  overflow: visible !important;
}
</style>
<style scoped>
.operation-dropdown {
  line-height: 1;
}

.operation-trigger-button {
  min-width: 42px;
  padding: 0 4px;
  border-radius: 4px;
}

.operation-trigger-button:hover,
.operation-trigger-button:focus-visible {
  background: var(--el-color-primary-light-9);
  outline: none;
}

:global(.operation-dropdown-popper),
:global(.operation-dropdown-popper .el-scrollbar),
:global(.operation-dropdown-popper .el-scrollbar__wrap),
:global(.operation-dropdown-popper .el-scrollbar__view) {
  overflow: visible !important;
}

.op-menu {
  min-width: 136px;
  padding: 5px;
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
}

.op-menu-item,
.op-submenu-item {
  display: flex;
  align-items: center;
  min-height: 32px;
  box-sizing: border-box;
  border-radius: 6px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  user-select: none;
  transition:
    background-color 0.14s ease,
    color 0.14s ease,
    box-shadow 0.14s ease;
}

.op-menu-item {
  position: relative;
  gap: 8px;
  padding: 7px 10px;
  font-size: 13px;
  line-height: 1.45;
}

.op-menu-item:hover,
.op-menu-item:focus-visible,
.op-menu-item.has-submenu:hover,
.op-submenu-item:hover,
.op-submenu-item:focus-visible {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  box-shadow: inset 0 0 0 1px var(--el-color-primary-light-7);
  outline: none;
}

.op-menu-item.danger:hover,
.op-menu-item.danger:focus-visible {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  box-shadow: inset 0 0 0 1px var(--el-color-danger-light-7);
}

.op-menu-arrow,
.op-menu-arrow-placeholder {
  width: 14px;
  flex: 0 0 14px;
}

.op-menu-arrow {
  color: var(--el-text-color-placeholder);
  transition:
    color 0.14s ease,
    transform 0.14s ease;
}

.op-menu-item.has-submenu:hover .op-menu-arrow {
  color: var(--el-color-primary);
  transform: translateX(-2px);
}

.op-menu-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
}

.op-divider {
  height: 1px;
  margin: 5px 4px;
  background: var(--el-border-color-lighter);
}

.op-submenu {
  position: fixed;
  top: 0;
  left: -9999px;
  min-width: 132px;
  max-height: calc(100vh - 20px);
  overflow-y: auto;
  padding: 5px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  z-index: 3200;
}

.op-submenu-item {
  min-height: 31px;
  padding: 7px 12px;
  font-size: 12px;
  line-height: 1.45;
}

.material-upload-dialog :deep(.el-dialog) {
  display: flex;
  width: calc(100vw - 32px) !important;
  max-width: calc(100vw - 32px);
  height: calc(100vh - 32px);
  max-height: calc(100vh - 32px);
  flex-direction: column;
  margin: 16px auto !important;
  border-radius: 18px;
  overflow: hidden;
}

:global(.material-upload-dialog.el-dialog) {
  display: flex;
  width: calc(100vw - 32px) !important;
  max-width: calc(100vw - 32px);
  height: calc(100vh - 32px);
  max-height: calc(100vh - 32px);
  flex-direction: column;
  margin-top: 16px !important;
  margin-bottom: 16px !important;
  border-radius: 18px;
  overflow: hidden;
}

:global(.material-upload-dialog.el-dialog .el-dialog__header) {
  padding: 18px 24px 16px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

:global(.material-upload-dialog.el-dialog .el-dialog__body) {
  display: flex;
  flex: 1;
  min-height: 0;
  padding: 12px 14px 14px;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.material-upload-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-right: 36px;
}

.material-upload-dialog :deep(.el-dialog__header) {
  padding: 18px 24px 16px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.material-upload-dialog :deep(.el-dialog__body) {
  display: flex;
  flex: 1;
  min-height: 0;
  padding: 12px 14px 14px;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.material-upload-dialog :deep(.el-dialog__body > div) {
  flex: 1;
  min-height: 0;
}

.material-upload-dialog__content {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.edit-material-dialog :deep(.el-dialog__body) {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.edit-material-dialog :deep(.el-dialog) {
  display: flex;
  flex-direction: column;
  height: 100vh;
  border-radius: 0;
  overflow: hidden;
}

.edit-material-dialog :deep(.el-dialog__header) {
  padding: 10px 16px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.edit-material-dialog :deep(.el-dialog__footer) {
  padding: 8px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.edit-material-body {
  flex: 1;
  min-height: 0;
  height: auto;
  overflow-y: auto;
  padding: 10px 12px;
  background: var(--el-bg-color-page);
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-section {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 10px 12px 2px;
}

.edit-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
}

.edit-form :deep(.el-form-item) {
  margin-bottom: 8px;
}

.edit-form :deep(.el-form-item__label) {
  padding-bottom: 3px;
  line-height: 1.35;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.edit-form :deep(.el-row) {
  margin-bottom: 0;
}

.edit-form :deep(.el-form-item__content) {
  min-height: 28px;
  display: flex;
  align-items: center;
}

.edit-form :deep(.el-form-item__content) > * {
  width: 100%;
}

.edit-form :deep(.el-input__wrapper),
.edit-form :deep(.el-select__wrapper) {
  min-height: 28px;
}

.edit-form :deep(.el-switch) {
  width: auto;
  height: 22px;
  --el-switch-on-color: var(--el-color-primary);
}

.edit-form :deep(.el-input-group__append .el-button) {
  min-width: 64px;
}

.edit-form :deep(.el-textarea__inner) {
  min-height: 84px;
  line-height: 1.45;
}

.material-detail-dialog :deep(.el-dialog__body) {
  padding: 0;
  overflow: hidden;
}

.material-detail-dialog :deep(.el-dialog) {
  border-radius: 0;
}

.material-detail-dialog :deep(.el-dialog__header) {
  padding: 16px 24px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.material-detail-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.material-detail-body {
  height: calc(100vh - 124px);
  overflow-y: auto;
  padding: 20px 24px;
  background: var(--el-bg-color-page);
}

.material-detail-hero,
.material-detail-section {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.material-detail-hero {
  display: grid;
  grid-template-columns: minmax(220px, 320px) minmax(0, 1fr);
  gap: 20px;
  padding: 16px;
  margin-bottom: 12px;
}

.material-detail-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background-color: var(--el-fill-color-lighter);
  overflow: hidden;
}

.material-detail-preview :deep(.el-image) {
  width: 100%;
  height: 220px;
}

.material-detail-preview__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 220px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.material-detail-summary {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
}

.material-detail-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.35;
  word-break: break-word;
}

.material-detail-subtitle {
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  word-break: break-word;
}

.material-detail-tags,
.material-detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.material-detail-section {
  padding: 16px;
  margin-bottom: 12px;
}

.material-detail-section__title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.material-detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px 12px;
}

.material-detail-field {
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.material-detail-field--wide {
  grid-column: span 2;
}

.material-detail-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.material-detail-value {
  display: block;
  min-width: 0;
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.material-detail-value--multiline {
  white-space: pre-wrap;
}

.material-detail-value--break {
  word-break: break-all;
}

.material-detail-palette {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
}

.material-detail-swatch {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
}

.material-detail-raw {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.6;
}

.edit-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式布局 */
@media (max-width: 1360px) {
  .material-upload-dialog :deep(.el-dialog__body) {
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}

@media (max-width: 1200px) {
  .edit-material-body,
  .material-detail-body {
    padding: 16px;
  }

  .material-detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .material-detail-hero {
    grid-template-columns: 1fr;
  }

  .material-detail-grid {
    grid-template-columns: 1fr;
  }

  .material-detail-field--wide {
    grid-column: span 1;
  }

  .op-submenu {
    min-width: 140px;
  }

  .op-submenu-item {
    min-height: 36px;
    padding: 10px 12px;
    font-size: 14px;
  }

  .material-upload-dialog :deep(.el-dialog) {
    width: calc(100vw - 12px) !important;
    max-width: calc(100vw - 12px);
    height: calc(100vh - 12px);
    max-height: calc(100vh - 12px);
    margin: 6px auto !important;
    border-radius: 14px;
  }

  :global(.material-upload-dialog.el-dialog) {
    width: calc(100vw - 12px) !important;
    max-width: calc(100vw - 12px);
    height: calc(100vh - 12px);
    max-height: calc(100vh - 12px);
    margin-top: 6px !important;
    margin-bottom: 6px !important;
    border-radius: 14px;
  }

  :global(.material-upload-dialog.el-dialog .el-dialog__header) {
    padding: 14px 16px;
  }

  :global(.material-upload-dialog.el-dialog .el-dialog__body) {
    padding: 12px;
  }

  .material-upload-dialog :deep(.el-dialog__header) {
    padding: 14px 16px;
  }

  .material-upload-dialog :deep(.el-dialog__body) {
    padding: 12px;
  }

  .edit-material-dialog :deep(.el-dialog__header),
  .edit-material-dialog :deep(.el-dialog__footer) {
    padding-left: 16px;
    padding-right: 16px;
  }

  .edit-material-body {
    padding: 12px;
    height: calc(100vh - 116px);
  }

  .edit-section {
    padding: 12px 12px 0;
  }
}

/* 元数据弹窗样式 */
.meta-error {
  padding: 20px;
}

.meta-raw-content {
  margin-top: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.meta-raw-content pre {
  margin: 0;
  padding: 0;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 600px;
  overflow: auto;
}

.meta-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

:global(.text-cell-tooltip) {
  max-width: 520px;
  word-break: break-word;
  white-space: normal;
  line-height: 1.5;
}

.psd-set-body {
  height: 100%;
  min-height: var(--psd-set-workbench-min-height);
  display: grid;
  grid-template-columns: minmax(260px, 0.88fr) minmax(0, 1.72fr);
  gap: 14px;
  width: 100%;
  overflow: hidden;
  padding-right: 2px;
}

.psd-set-materials,
.psd-set-templates {
  border: 1px solid rgba(64, 158, 255, 0.08);
  border-radius: 16px;
  padding: 14px;
  min-height: 220px;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
  background: linear-gradient(180deg, var(--el-bg-color), var(--el-fill-color-extra-light));
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
}

.psd-set-content-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.psd-template-folder-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.psd-template-folder-filter__label {
  font-weight: 500;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.psd-template-folder-filter__cascader {
  width: min(100%, 360px);
}

.psd-template-folder-filter__cascader :deep(.el-cascader-node__prefix) {
  display: none;
}

:deep(.psd-template-folder-cascader-popper .el-cascader-node__prefix) {
  display: none;
}

:deep(.psd-template-folder-cascader-popper .el-radio) {
  display: none;
}

:deep(.psd-template-folder-cascader-popper .el-cascader-node) {
  padding-left: 16px;
}

:deep(.psd-template-folder-cascader-popper .el-cascader-node__label) {
  padding-left: 0;
}

.psd-template-list-container {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.psd-set-materials .format-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  border-left: 2px solid var(--el-color-primary);
}

.psd-set-materials .format-tip .el-icon {
  color: var(--el-color-primary);
  font-size: 14px;
}

.psd-set-materials .thumbs {
  min-height: 0;
  max-height: 100vh;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  overflow-y: auto;
  overflow-x: hidden;
}

.psd-set-materials .thumb {
  position: relative;
  min-height: 136px;
  max-height: 152px;
  width: calc(50% - 4px);
  min-width: 108px;
  max-width: 132px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.psd-set-materials .thumb:hover {
  transform: translateY(-1px);
  border-color: rgba(64, 158, 255, 0.18);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.psd-set-materials .thumb.thumb-invalid-format {
  border-color: var(--el-color-danger);
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
}

.psd-set-materials .thumb-remove,
.material-publish-config-dialog__material-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.68);
  color: #fff;
  font-size: 18px;
  line-height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.18);
  transition:
    background 0.16s ease,
    transform 0.16s ease;
}

.psd-set-materials .thumb-remove:hover,
.material-publish-config-dialog__material-remove:hover {
  background: var(--el-color-danger);
  transform: scale(1.04);
}

.psd-set-materials .thumb-image-wrapper {
  position: relative;
  width: 100%;
  height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.psd-set-materials .thumb img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  background: #f5f7fa;
}

.psd-set-materials .thumb-format-badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 2px 6px;
  background: rgba(245, 108, 108, 0.9);
  color: white;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.psd-set-materials .thumb-format-badge.valid {
  background: rgba(103, 194, 58, 0.9);
}

.psd-set-materials .thumb-format-badge .el-icon {
  font-size: 12px;
}

.psd-set-materials .thumb-info-row {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.psd-set-materials .thumb-info-tag {
  font-size: 11px;
  height: 20px;
  line-height: 18px;
  padding: 0 6px;
}

.psd-set-materials .thumb-action-row {
  margin-top: 2px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  line-height: 1;
}

.psd-set-materials .thumb-action-row .el-button {
  margin: 0;
  padding: 0;
  min-height: auto;
  font-size: 12px;
}

.psd-set-template-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.psd-set-template-toolbar__search {
  flex: 1;
  max-width: 260px;
}

.psd-template-toolbar-button,
.psd-template-toolbar-button:hover,
.psd-template-toolbar-button:focus,
.psd-template-toolbar-button:active,
.psd-template-toolbar-button:focus-visible {
  box-shadow: none !important;
}

.psd-set-template-toolbar .selected-count {
  font-size: 12px;
  color: var(--el-color-primary);
  font-weight: 500;
  padding: 3px 8px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(64, 158, 255, 0.22);
  white-space: nowrap;
}

.psd-set-templates .template-list-wrapper {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.psd-set-templates .template-list {
  flex: 1;
  padding:1em;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.psd-set-templates .template-pagination {
  flex-shrink: 0;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: flex-end;
}

.psd-set-templates .template-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  padding: 12px;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease,
    background-color 0.16s ease;
  background: linear-gradient(180deg, var(--el-bg-color), var(--el-fill-color-extra-light));
}

.psd-set-templates .template-item:hover {
  transform: translateY(-1px);
  border-color: rgba(64, 158, 255, 0.18);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.06);
}

.psd-set-templates .template-item.is-checked {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.18);
  background: linear-gradient(180deg, rgba(64, 158, 255, 0.08), rgba(64, 158, 255, 0.03));
}

.psd-set-templates .template-content-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.psd-set-templates .template-thumbnail {
  width: 72px;
  height: 72px;
  min-width: 72px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-lighter);
  flex-shrink: 0;
  cursor: zoom-in;
}

.psd-set-templates .template-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.psd-set-templates .template-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}

.psd-set-templates .template-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
  flex: 1;
}

.psd-set-templates .template-detail-link {
  font-size: 12px;
  flex-shrink: 0;
}

.psd-set-templates .template-psd-info {
  font-size: 12px;
  color: var(--el-text-color-regular);
  line-height: 1.4;
  margin-bottom: 2px;
  padding: 5px 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  border-left: 3px solid var(--el-color-primary);
}

.psd-set-templates .template-meta {
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #909399;
  flex-wrap: wrap;
}

.psd-set-templates .template-paths {
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
  color: #666;
}

.psd-set-templates .path-row {
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.4;
  word-break: break-all;
}

.psd-set-templates .suitable-sizes-wrap,
.psd-set-templates .suitable-cutout-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.psd-set-templates .path-label {
  color: #909399;
  flex-shrink: 0;
}

.psd-set-templates .path-empty {
  color: #c0c4cc;
}

.psd-set-templates .path-text {
  color: #606266;
}

.psd-set-templates .path-link {
  max-width: 100%;
}

.psd-set-templates .path-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.psd-set-footer {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

@media (max-width: 960px) {
  :global(.psd-set-dialog.el-dialog) {
    --psd-set-workbench-min-height: 440px;
    min-height: 100vh;
    min-height: 100dvh;
  }

  :global(.psd-set-dialog.el-dialog .el-dialog__body) {
    display: block;
    overflow-y: auto;
  }

  .psd-set-body {
    height: auto;
    min-height: 0;
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .psd-set-materials,
  .psd-set-templates {
    min-height: 440px;
    max-height: none;
  }
}

/* PSD模板详情弹窗样式 */
.psd-template-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.psd-template-detail .detail-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.psd-template-detail .detail-left {
  flex-shrink: 0;
  width: 600px;
}

.psd-template-detail .detail-right {
  flex: 1;
  min-width: 0;
}

.psd-template-detail .detail-thumbnail {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  position: sticky;
  top: 20px;
}

.psd-template-detail .detail-thumbnail-img {
  max-width: 100%;
  max-height: calc(100vh - 200px);
  border-radius: 4px;
  object-fit: contain;
}

.psd-template-detail .detail-thumbnail-placeholder {
  padding: 100px 20px;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
  width: 100%;
}

.psd-template-detail .detail-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.psd-template-detail .detail-item:last-child {
  border-bottom: none;
}

.psd-template-detail .detail-label {
  font-weight: 600;
  color: var(--el-text-color-regular);
  font-size: 15px;
  min-width: 120px;
  flex-shrink: 0;
}

.psd-template-detail .detail-value {
  flex: 1;
  color: var(--el-text-color-primary);
  font-size: 15px;
  line-height: 1.8;
  word-break: break-word;
}

.psd-template-detail .psd-config-value {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  border-left: 3px solid var(--el-color-primary);
  font-family: "Courier New", "Consolas", "Monaco", monospace;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 500px;
  overflow-y: auto;
}

.psd-template-detail .detail-empty {
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .psd-template-detail .detail-layout {
    flex-direction: column;
  }

  .psd-template-detail .detail-left {
    width: 100%;
  }

  .psd-template-detail .detail-thumbnail {
    position: static;
  }
}
</style>

<style scoped>
.size-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  min-height: 40px;
  box-sizing: border-box;
}

.size-thumb {
  width: 48px;
  height: 24px;
  border: 1.5px solid var(--el-border-color);
  border-radius: 3px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.2) 100%);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.size-thumb::after {
  content: "";
  position: absolute;
  inset: 2px;
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 2px;
}

.size-label {
  flex: 1;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.size-key {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: "Courier New", "Consolas", "Monaco", monospace;
  background: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* 横图系列 - 使用渐变背景区分 */
.landscape-thumb,
.slightly-wide-thumb,
.wide-thumb,
.very-wide-thumb,
.ultra-wide-thumb,
.extreme-wide-thumb {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.15) 0%, rgba(64, 158, 255, 0.25) 100%);
}

/* 正方形 */
.square-thumb {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.15) 0%, rgba(103, 194, 58, 0.25) 100%);
}

.square-thumb::after {
  border-color: rgba(103, 194, 58, 0.3);
}

/* 竖图系列 - 使用渐变背景区分 */
.portrait-thumb,
.slightly-long-thumb,
.long-thumb,
.very-long-thumb,
.ultra-long-thumb,
.extreme-long-thumb {
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.15) 0%, rgba(245, 108, 108, 0.25) 100%);
}

.portrait-thumb::after,
.slightly-long-thumb::after,
.long-thumb::after,
.very-long-thumb::after,
.ultra-long-thumb::after,
.extreme-long-thumb::after {
  border-color: rgba(245, 108, 108, 0.3);
}

/* 选中状态 */
:deep(.el-select-dropdown__item.is-selected) .size-thumb {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

:deep(.el-select-dropdown__item:hover) .size-thumb {
  border-color: var(--el-color-primary);
  transform: scale(1.05);
  transition: transform 0.2s;
}

/* 确保选项内容不被截断 - 增加高度和内边距 */
:deep(.el-select-dropdown__item) {
  padding: 10px 14px;
  min-height: 50px;
  height: auto;
  line-height: 1.5;
  display: flex;
  align-items: center;
}

/* 选项组标题样式 */
:deep(.el-select-group__title) {
  padding: 8px 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

/* 确保选项容器有足够空间 */
:deep(.el-select-dropdown__list) {
  padding: 4px 0;
}

/* 选中值的显示优化 */
:deep(.el-select__input-wrapper) {
  display: flex;
  align-items: center;
}

/* 选中值中显示缩略图（如果支持） */
.size-select-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 选中值显示时的缩略图尺寸会根据实际比例自动缩放 */
.size-select-value .size-thumb {
  max-width: 40px;
  max-height: 32px;
}
</style>

<style>
.template-detail-tooltip {
  max-width: 400px;
  padding: 12px;
}

.template-detail-tooltip,
.template-detail-tooltip.el-popper {
  transition: none !important;
}

.template-tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  line-height: 1.6;
}

.template-tooltip-content .tooltip-item {
  padding: 4px 0;
}

.template-tooltip-content .tooltip-item strong {
  font-weight: 600;
  margin-right: 6px;
  display: inline-block;
  min-width: 60px;
}
</style>

<style lang="less" scoped>
.material-index-filter {
  gap: 10px;
  padding-top: 8px;
}

.material-index-page {
  gap: 10px;
  padding: 8px 0 0;
  --material-copy-hover-bg: var(--el-fill-color-light);
  --material-copy-hover-border: var(--el-border-color);
  --material-copy-hover-text: var(--el-color-primary);
  --material-copy-hover-label: var(--el-text-color-primary);
  --material-copy-hover-icon: var(--el-color-primary);
}

:global(html.dark) .material-index-page {
  --material-copy-hover-bg: var(--el-fill-color);
  --material-copy-hover-border: var(--el-border-color-light);
  --material-copy-hover-text: var(--el-color-primary-light-3);
  --material-copy-hover-label: var(--el-text-color-primary);
  --material-copy-hover-icon: var(--el-color-primary-light-3);
}

.material-index-search-form {
  width: 100%;
}

.material-index-search-form__actions {
  justify-content: flex-start;
}

.material-index-search-form__switch {
  display: flex;
  min-height: 28px;
  align-items: center;
}

.material-index-mobile-filter {
  display: flex;
  justify-content: flex-start;
}

.similar-image-search-status {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 3px 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-fill-color-extra-light);
}

.similar-image-search-status__thumb {
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 3px;
  background: var(--el-bg-color);
}

.similar-image-search-status__thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.similar-image-search-status__thumb--text {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-success-light-9);
}

.similar-image-search-status__content {
  min-width: 0;
  flex: 1 1 auto;
}

.similar-image-search-status__line {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.similar-image-search-status__source {
  min-width: 0;
  max-width: 280px;
  overflow: hidden;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.similar-image-search-status__meta {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
  opacity: 0.8;
}

.similar-image-search-status__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0;
}

.similar-image-search-status__actions :deep(.el-button) {
  height: 22px;
  padding: 0 4px;
  font-size: 12px;
}

.similar-image-search {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.similar-image-search__tabs {
  width: 100%;
}

.similar-image-search__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.similar-image-search__options {
  display: flex;
  align-items: center;
  padding: 0 4px;
}

.similar-image-search__option-item {
  display: flex;
  align-items: center;
}

.similar-image-search__option-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-right: 8px;
}

.similar-image-upload {
  width: 100%;
}

.similar-image-upload :deep(.el-upload) {
  width: 100%;
}

.similar-image-upload :deep(.el-upload-dragger) {
  width: 100%;
  padding: 24px 16px;
}

.similar-image-upload__icon {
  margin-bottom: 8px;
  font-size: 32px;
  color: var(--el-color-primary);
}

.similar-image-upload__text {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.similar-image-file-name {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
  word-break: break-all;
}

.similar-image-preview {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-extra-light);
  padding: 12px;
}

.similar-image-preview__title {
  margin-bottom: 10px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 600;
}

.similar-image-preview__frame,
.similar-image-preview__empty {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: var(--el-bg-color);
}

.similar-image-preview__frame img {
  display: block;
  max-width: 100%;
  max-height: 260px;
  object-fit: contain;
}

.similar-image-preview__empty {
  flex-direction: column;
  gap: 8px;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.similar-image-preview__empty .el-icon {
  font-size: 32px;
}

.material-index-phash__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.material-index-phash__row > :first-child {
  flex: 1 1 280px;
  min-width: 220px;
}

.material-index-phash__modes,
.material-index-phash__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.sticker-user-transfer-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sticker-user-transfer-form {
  margin-top: 4px;
}

.sticker-user-transfer-form__select {
  width: 100%;
}

.sticker-user-transfer-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.sticker-user-transfer-option__main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--el-text-color-primary);
}

.sticker-user-transfer-option__meta {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.sticker-user-transfer-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sticker-user-transfer-preview__more {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 24px;
}

.material-index-sidebar {
  position: relative;
  min-height: 100%;
}

.material-index-sidebar__body {
  padding: 0;
}

.material-index-sidebar__tree {
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.material-index-table-panel__body {
  padding: 0;
  overflow: hidden;
}

.material-index-page :deep(.table-bilingual-cell__item:not(.table-bilingual-cell__item--empty)) {
  padding: 4px 6px;
  border-radius: 6px;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.material-index-page :deep(.table-bilingual-cell__content),
.material-index-page :deep(.table-bilingual-cell__label),
.material-index-page :deep(.table-bilingual-cell__icon) {
  transition:
    color 0.2s ease,
    opacity 0.2s ease;
}

.material-index-page
  :deep(.table-bilingual-cell__item:not(.table-bilingual-cell__item--empty):hover) {
  background: var(--material-copy-hover-bg);
  box-shadow: inset 0 0 0 1px var(--material-copy-hover-border);
}

.material-index-page
  :deep(
    .table-bilingual-cell__item:not(.table-bilingual-cell__item--empty):hover
      .table-bilingual-cell__content
  ) {
  color: var(--material-copy-hover-text);
}

.material-index-page
  :deep(
    .table-bilingual-cell__item:not(.table-bilingual-cell__item--empty):hover
      .table-bilingual-cell__label
  ) {
  color: var(--material-copy-hover-label);
}

.material-index-page
  :deep(
    .table-bilingual-cell__item:not(.table-bilingual-cell__item--empty):hover
      .table-bilingual-cell__icon
  ) {
  color: var(--material-copy-hover-icon);
}

.material-index-pagination {
  margin-top: 0;
}

@media (max-width: 1024px) {
  .material-index-sidebar__body {
    padding-bottom: 28px;
  }
}

.batch-detail-config-content {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);

  .batch-detail-config-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);

    .batch-detail-config-title {
      font-size: 16px;
      color: var(--el-text-color-primary);
      font-weight: 600;
    }
  }

  .batch-detail-config-body {
    flex: 1;
    overflow: auto;
    padding: 12px 16px 16px;
    background: var(--el-bg-color);

    .template-config-row {
      display: flex;
      gap: 16px;
      padding: 14px 0;
      margin-bottom: 0;
      background: transparent;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      .template-config-left {
        width: 280px;
        flex-shrink: 0;

        .template-config-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;

          .template-name {
            font-size: 15px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }

        .template-config-images {
          display: flex;
          flex-direction: column;
          gap: 10px;

          .config-image-item {
            .config-image-label {
              font-size: 12px;
              font-weight: 500;
              color: var(--el-text-color-regular);
              margin-bottom: 6px;
            }

            .config-image-wrapper {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;

              .config-image {
                width: 108px;
                height: 108px;
                border: 1px solid var(--el-border-color-lighter);
                border-radius: 4px;
                object-fit: contain;
                background: var(--el-fill-color-lighter);
              }

              .config-image-placeholder {
                display: block;
                color: var(--el-text-color-placeholder);
                font-size: 12px;
                padding: 40px 20px;
                text-align: center;
                border: 1px dashed var(--el-border-color-lighter);
                border-radius: 4px;
                background: var(--el-fill-color-lighter);
                width: 108px;
                height: 108px;
                box-sizing: border-box;
              }
            }
          }
        }
      }

      .template-config-right {
        flex: 1;
        min-width: 0;

        .config-editor-toolbar {
          margin-bottom: 8px;
          display: flex;
          justify-content: flex-start;
          gap: 8px;
        }

        .config-textarea {
          :deep(.el-textarea__inner) {
            font-family: "Courier New", "Consolas", "Monaco", monospace;
            font-size: 13px;
            line-height: 1.6;
          }
        }
      }
    }
  }
}

@media (max-width: 1024px) {
  .batch-detail-config-content {
    .batch-detail-config-body {
      padding: 10px 12px 12px;

      .template-config-row {
        flex-direction: column;
        gap: 12px;

        .template-config-left {
          width: 100%;
        }
      }
    }
  }
}

@media (max-width: 640px) {
  .similar-image-search-status {
    display: flex;
    flex-wrap: wrap;
  }

  .similar-image-search-status__source {
    max-width: 180px;
  }

  .similar-image-search-status__actions {
    margin-left: auto;
  }
}

</style>

<style lang="less">
.ai-generate-raw-info-dialog {
  :deep(.el-messagebox__message) {
    margin: 10px 0 20px 0;
  }

  :deep(.el-textarea) {
    width: 100%;

    .el-textarea__inner {
      min-height: 120px;
      resize: vertical;
    }
  }
}

.ai-gen-form {
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-label {
      display: block;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 6px;
      font-size: 14px;
    }

    .section-desc {
      color: var(--el-text-color-regular);
      font-size: 13px;
      margin-bottom: 12px;
      line-height: 1.5;
    }

    :deep(.el-textarea) {
      .el-textarea__inner {
        min-height: 100px;
        resize: vertical;
        font-family: inherit;
      }
    }
  }
}

:deep(.material-view-mode-tabs) {
  .el-tabs__nav-wrap::after {
    display: none !important;
  }
  .el-tabs__active-bar {
    display: none !important;
  }
  .el-tabs__item {
    padding: 0 6px !important;
    font-size: 14px;
    font-weight: 500;
    color: #606266;
  }
  .el-tabs__item:first-child {
    padding-left: 0 !important;
  }
  .el-tabs__item.is-active {
    color: #303133;
    font-weight: 700;
  }
  .el-tabs__header {
    margin-bottom: 6px !important;
  }
}

.add-to-group-preview {
  width: 100%;
}

.add-to-group-preview__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 56px);
  gap: 8px;
  width: 100%;
}

.add-to-group-preview__image {
  width: 56px;
  height: 56px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}
</style>
