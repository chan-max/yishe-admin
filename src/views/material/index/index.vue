<template>
  <div>
    <!-- PC端显示搜索栏，移动端使用筛选对话框 -->
    <div v-show="!isMobile" class="search-bar">
      <!-- 搜索表单容器 -->
      <div class="search-form-container">
        <!-- AI 提示词搜索 -->
        <div class="search-field search-field-wide">
          <label class="search-label">提示词</label>
          <el-input v-model="queryParams.searchPrompt" placeholder="AI提示词" clearable
            @change="(val) => { if (!val) getList() }" @keyup.enter="getList" />
        </div>

        <!-- 搜索 -->
        <div class="search-field search-field-wide">
          <label class="search-label">搜索</label>
          <el-input v-model="queryParams.searchText" placeholder="名称、描述、关键词" clearable
            @change="(val) => { if (!val) getList() }" @keyup.enter="getList" />
        </div>

        <!-- 搜索模式 -->
        <div class="search-field">
          <label class="search-label">模式</label>
          <el-select v-model="queryParams.searchMode" placeholder="模式" @change="getList">
            <el-option label="AND" value="AND" />
            <el-option label="OR" value="OR" />
          </el-select>
        </div>

        <!-- 排序 -->
        <div class="search-field">
          <label class="search-label">排序</label>
          <el-select v-model="queryParams.sortingFields" placeholder="排序" @change="getList">
            <el-option label="创建时间倒序" value="createTime DESC" />
            <el-option label="创建时间正序" value="createTime ASC" />
          </el-select>
        </div>

        <!-- 后缀 -->
        <div class="search-field">
          <label class="search-label">后缀</label>
          <el-select v-model="queryParams.suffix" placeholder="后缀" multiple clearable @change="getList">
            <el-option label="jpg" value="jpg" />
            <el-option label="jpeg" value="jpeg" />
            <el-option label="png" value="png" />
            <el-option label="gif" value="gif" />
            <el-option label="webp" value="webp" />
            <el-option label="svg" value="svg" />
            <el-option label="bmp" value="bmp" />
            <el-option label="tiff" value="tiff" />
          </el-select>
        </div>

        <!-- ID -->
        <div class="search-field">
          <label class="search-label">ID</label>
          <el-input v-model="queryParams.id" placeholder="ID" clearable @change="(val) => { if (!val) getList() }" />
        </div>

        <!-- 自定义 -->
        <div class="search-field">
          <label class="search-label">自定义</label>
          <el-select v-model="queryParams.isCustom" placeholder="自定义" clearable @change="getList">
            <el-option label="全部" :value="null" />
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </div>

        <!-- 侵权 -->
        <div class="search-field">
          <label class="search-label">侵权</label>
          <el-select v-model="queryParams.isInfringement" placeholder="侵权" clearable @change="getList">
            <el-option label="全部" :value="null" />
            <el-option label="侵权" :value="true" />
            <el-option label="非侵权" :value="false" />
          </el-select>
        </div>

        <!-- 抠图 -->
        <div class="search-field">
          <label class="search-label">抠图</label>
          <el-select v-model="queryParams.isCutout" placeholder="抠图" clearable @change="getList">
            <el-option label="全部" :value="null" />
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </div>

        <!-- 尺寸 -->
        <div class="search-field">
          <label class="search-label">尺寸</label>
          <el-select v-model="queryParams.sizeShape" placeholder="尺寸形状" clearable multiple @change="getList"
            :teleported="false">
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
        </div>

        <!-- 随机 -->
        <div class="search-field search-field-narrow">
          <label class="search-label">随机</label>
          <el-switch v-model="queryParams.random" size="small" @change="getList" />
        </div>

        <!-- 时间 -->
        <div class="search-field search-field-time">
          <label class="search-label">时间</label>
          <DateRangePicker
            @change="(val) => { queryParams.startTime = val.start; queryParams.endTime = val.end; getList() }" />
        </div>

        <!-- 相似搜索 -->
        <div class="search-field search-field-similar">
          <label class="search-label">相似</label>
          <div class="phash-form-row">
            <el-input v-model="queryParams.phash" placeholder="输入 phash 或图片地址" clearable @blur="onPhashInputBlur" />
            <div class="phash-mode">
              <el-check-tag :checked="queryParams.phashMode === 'range'"
                @change="() => queryParams.phashMode = 'range'">相似匹配</el-check-tag>
              <el-tooltip content="只找 phash 完全一致，速度最快，需已有 phash。" placement="top">
                <el-check-tag :checked="queryParams.phashMode === 'exact'" type="primary"
                  @change="() => queryParams.phashMode = 'exact'">精确匹配</el-check-tag>
              </el-tooltip>
            </div>
            <div class="phash-actions">
              <el-button type="primary" @click="handlePhashSearch">搜索相似图片</el-button>
              <el-button @click="clearPhashSearch">清空</el-button>
              <!-- 总体搜索按钮，放在清空右侧 -->
              <el-button type="primary" :icon="Search" @click="getList">搜索</el-button>
              <!-- 上传等操作按钮，同一行展示 -->
              <el-button type="primary" @click="() => { uploadModalVisible = true }">上传</el-button>
              <el-button v-if="isAdmin" type="info" @click="() => { urlUploadModalVisible = true }">URL上传</el-button>
              <el-button type="default" @click="handleMultiDownload">下载 ({{ ids.length }})</el-button>
              <el-button v-if="isAdmin" type="primary" @click="() => openPsdSetDialog(false)">制作PS套图({{ ids.length
              }})</el-button>
              <el-button v-if="isAdmin" type="success" @click="() => openPsdSetDialog(true)">多图片制作套图({{ ids.length
              }})</el-button>
              <el-button v-if="isAdmin" type="danger" :icon="Delete" @click="handleDelete(null)">批量删除({{ ids.length
              }})</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isMobile" class="flex pb-4 justify-end">
      <el-button type="primary" icon="el-icon-filter" @click="filterDialogVisible = true">筛选</el-button>
    </div>
    <el-dialog v-model="filterDialogVisible" title="筛选" width="90%" align-center>
      <el-form :model="queryParams" label-width="80px">
        <el-form-item label="提示词">
          <el-input v-model="queryParams.searchPrompt" placeholder="输入AI提示词，自动解析搜索条件" clearable />
        </el-form-item>
        <el-form-item label="搜索">
          <el-input v-model="queryParams.searchText" placeholder="请输入名称、描述或关键词（空格分隔，支持引号精确匹配）" clearable />
        </el-form-item>
        <el-form-item label="搜索模式">
          <el-select v-model="queryParams.searchMode" placeholder="请选择模式">
            <el-option label="AND（全部包含）" value="AND" />
            <el-option label="OR（任意包含）" value="OR" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="queryParams.sortingFields" placeholder="请选择排序方式">
            <el-option label="创建时间倒序" value="createTime DESC" />
            <el-option label="创建时间正序" value="createTime ASC" />
          </el-select>
        </el-form-item>
        <el-form-item label="自定义贴纸">
          <el-select v-model="queryParams.isCustom" placeholder="请选择类型">
            <el-option label="全部" :value="null" />
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="侵权状态">
          <el-select v-model="queryParams.isInfringement" placeholder="请选择状态">
            <el-option label="全部" :value="null" />
            <el-option label="侵权" :value="true" />
            <el-option label="非侵权" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="抠图素材">
          <el-select v-model="queryParams.isCutout" placeholder="请选择类型">
            <el-option label="全部" :value="null" />
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="尺寸形状">
          <el-select v-model="queryParams.sizeShape" placeholder="请选择尺寸形状" clearable multiple>
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
        <el-form-item label="随机顺序">
          <el-switch v-model="queryParams.random" active-text="随机" inactive-text="默认" />
        </el-form-item>
        <el-form-item label="按时间查询">
          <DateRangePicker @change="(val) => { queryParams.startTime = val.start; queryParams.endTime = val.end }" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="filterDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onMobileFilterSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- PC 顶部筛选栅格布局样式 -->
    <!--（放在这里是为了避免全局影响，保持只作用于本页） -->

    <el-dialog v-model="psdSetDialogVisible" title="制作PS套图" width="100%" style="height: 100%" align-center
      :destroy-on-close="true" class="psd-set-dialog" @close="resetPsdSetState">
      <div class="psd-set-body" style="height: calc(100vh - 160px); display: flex; gap: 16px;">
        <div class="psd-set-materials"
          style="width: 480px; flex-shrink: 0; display: flex; flex-direction: column; border-right: 1px solid var(--el-border-color-lighter); padding-right: 16px;">
          <div class="section-title">已选择素材 ({{ ids.length }})</div>
          <div class="thumbs" style="flex: 1; overflow-y: auto; padding-right: 4px;">
            <div v-for="id in ids" :key="id" class="thumb"
              :class="{ 'thumb-invalid-format': isMaterialFormatInvalid(id) }">
              <img
                :src="getPreviewImageUrl((dataSource.find(i => String(i.id) === String(id)) || {}).url, { width: 150, quality: 80, format: 'webp' })"
                class="thumb-img" alt="素材预览" loading="lazy" />
              <div v-if="isMaterialFormatInvalid(id)" class="thumb-format-badge">
                <el-icon>
                  <Warning />
                </el-icon>
                <span>{{ getMaterialSuffix(id) || '未知' }}</span>
              </div>
              <div v-else-if="getMaterialSuffix(id)" class="thumb-format-badge valid">
                <span>{{ getMaterialSuffix(id) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="psd-set-templates" style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
          <div class="section-title">
            选择PSD模板 (可多选，支持跨页勾选)
            <span v-if="psdSetTemplatePageParams.total > 0" class="template-count-info">
              (共 {{ psdSetTemplatePageParams.total }} 个)
            </span>
          </div>

          <div class="psd-set-content-container" style="display: flex; gap: 16px; flex: 1; overflow: hidden;">
            <!-- 文件夹树 -->
            <div class="psd-folder-tree-wrapper"
              style="width: 220px; min-width: 220px; border-right: 1px solid var(--el-border-color-lighter); padding-right: 12px; display: flex; flex-direction: column; height: 100%;">
              <div style="margin-bottom: 12px; font-weight: 500; font-size: 14px; color: var(--el-text-color-primary);">
                文件夹
              </div>
              <el-tree ref="psdFolderTreeRef" :data="psdFolderTreeData" :props="{ children: 'children', label: 'name' }"
                node-key="id" :expand-on-click-node="false" :default-expand-all="true" :highlight-current="true"
                :current-node-key="selectedPsdFolderId" @node-click="handlePsdFolderNodeClick" class="psd-folder-tree"
                style="flex: 1; overflow-y: auto;">
                <template #default="{ data }">
                  <div class="custom-tree-node" style="display: flex; align-items: center; gap: 6px; font-size: 13px;">
                    <el-icon v-if="data.isRoot || data.id === '__root__'" style="color: var(--el-color-primary)">
                      <Files />
                    </el-icon>
                    <el-icon v-else>
                      <Folder />
                    </el-icon>
                    <span class="node-label">{{ data.name }}</span>
                  </div>
                </template>
              </el-tree>
            </div>

            <!-- 模板列表 -->
            <div class="psd-template-list-container"
              style="flex: 1; min-width: 0; display: flex; flex-direction: column; height: 100%;">
              <div class="psd-set-template-toolbar">
                <el-input v-model="psdSetTemplateSearchText" placeholder="搜索模板名称、描述等" clearable
                  style="flex: 1; max-width: 300px;">
                  <template #prefix>
                    <el-icon>
                      <Search />
                    </el-icon>
                  </template>
                </el-input>
                <el-button type="primary" size="small" @click="handlePsdTemplateSelectAll">
                  {{ isAllPsdTemplatesSelected ? '取消全选' : '全选' }}
                </el-button>
                <el-button type="primary" size="small" :icon="Edit" @click="handlePsdTemplateDetailConfig">
                  详细配置
                </el-button>
                <span class="selected-count" v-if="selectedPsdTemplateIds.length > 0">
                  已选中 {{ selectedPsdTemplateIds.length }} 个
                </span>
              </div>
              <div class="template-list-wrapper" style="max-height: none; flex: 1;">
                <div class="template-list" v-loading="psdSetTemplatesLoading">
                  <div v-for="tpl in filteredPsdSetTemplates" :key="tpl.id" class="template-item"
                    :class="{ 'is-checked': selectedPsdTemplateIds.includes(String(tpl.id)) }">
                    <div class="template-content-wrapper" @click="togglePsdTemplate(tpl.id)">
                      <img v-if="tpl.thumbnail || tpl.preview || tpl.image"
                        :src="getPreviewImageUrl(tpl.thumbnail || tpl.preview || tpl.image, { width: 200, quality: 80, format: 'webp' })"
                        :alt="tpl.name || '模板缩略图'" class="template-thumbnail" loading="lazy"
                        @error="handleTemplateImageError" />
                      <div class="template-info">
                        <div class="template-header">
                          <div class="template-title-row">
                            <div class="template-title">{{ tpl.name || '未命名模板' }}</div>
                            <el-link type="primary" :underline="false" class="template-detail-link"
                              @click.stop="openTemplateDetail(tpl)">
                              查看详情
                            </el-link>
                          </div>
                        </div>
                        <div class="template-paths">
                          <div class="path-row">
                            <span class="path-label">远程链接：</span>
                            <el-link v-if="tpl.url" :href="tpl.url" target="_blank" type="primary" :underline="false"
                              class="path-link" @click.stop>
                              {{ tpl.url.length > 60 ? tpl.url.slice(0, 60) + '...' : tpl.url }}
                            </el-link>
                            <span v-else class="path-empty">暂无</span>
                          </div>
                          <div class="path-row">
                            <span class="path-label">本地路径：</span>
                            <span v-if="tpl.windowsLocalPath" class="path-text">{{ tpl.windowsLocalPath }}</span>
                            <span v-else class="path-empty">暂无</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <el-empty v-if="!filteredPsdSetTemplates.length && !psdSetTemplatesLoading"
                    :description="psdSetTemplateSearchText ? '未找到匹配的模板' : '暂无PSD模板'" />
                </div>
                <!-- PSD模板分页 -->
                <div class="template-pagination" v-if="psdSetTemplatePageParams.total > 0">
                  <pagination v-model:page="psdSetTemplatePageParams.currentPage"
                    v-model:limit="psdSetTemplatePageParams.pageSize" :total="psdSetTemplatePageParams.total"
                    @pagination="loadPsdTemplatesForPsdSet" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="psd-set-footer">
          <div class="psd-set-footer-main">

            <div style="flex: 1"></div>

            <div class="psd-set-info">
              <el-icon>
                <InfoFilled />
              </el-icon>
              <div class="psd-set-info-content">
                <div>
                  {{ psdSetMergeSticker
                    ? `合并生成，每个模板各生成 1 条，共 ${psdSetTaskCount} 条套图任务`
                    : `将生成 ${ids.length} × ${selectedPsdTemplateIds.length} = ${psdSetTaskCount} 条套图任务` }}
                </div>
                <div class="psd-set-formats-tip">
                  允许的图片格式：{{ allowedFormatsForSelectedTemplates.join('、') }}
                </div>
              </div>
            </div>

            <div class="psd-set-mode-inline">
              <span class="psd-set-mode-label">生成方式:</span>
              <el-tag :type="psdSetMergeSticker ? 'success' : 'primary'" size="large">
                {{ psdSetMergeSticker ? '合并素材 × 模板' : '单素材 × 模板' }}
              </el-tag>
            </div>

            <div>
              <el-button @click="psdSetDialogVisible = false">取消</el-button>
              <el-tooltip v-if="hasInvalidFormatMaterials"
                :content="`所选素材中包含不符合格式要求的图片（${invalidFormatMaterialsList.map(m => m.name).join('、')}），请移除后重试`"
                placement="top">
                <el-button type="primary"
                  :disabled="!ids.length || !selectedPsdTemplateIds.length || hasInvalidFormatMaterials"
                  :loading="psdSetSubmitting" @click="handleCreatePsdSets">
                  开始制作
                </el-button>
              </el-tooltip>
              <el-button v-else type="primary" :disabled="!ids.length || !selectedPsdTemplateIds.length"
                :loading="psdSetSubmitting" @click="handleCreatePsdSets">
                开始制作
              </el-button>
            </div>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 批量详细配置全屏弹窗（选中的PSD模板） -->
    <el-dialog v-model="batchDetailConfigDialogVisible" title="详细配置 - 选中的模板" fullscreen :destroy-on-close="true">
      <div class="batch-detail-config-content">
        <div class="batch-detail-config-header">
          <div class="batch-detail-config-title">
            <span>共 {{ templateConfigList.length }} 个模板</span>
          </div>
        </div>
        <div class="batch-detail-config-body">
          <div v-for="(template, index) in templateConfigList" :key="template.id" class="template-config-row">
            <div class="template-config-left">
              <div class="template-config-header-row">
                <span class="template-name">{{ template.name || `模板 ${index + 1}` }}</span>
                <el-tag :type="template.psdTemplateConfig ? 'success' : 'info'" size="small">
                  {{ template.psdTemplateConfig ? '已配置' : '未配置' }}
                </el-tag>
              </div>
              <div class="template-config-images">
                <div class="config-image-item">
                  <div class="config-image-label">素材图</div>
                  <div class="config-image-wrapper">
                    <template v-if="template.materialId !== undefined">
                      <!-- 单素材模式：显示单个匹配的素材图 -->
                      <img v-if="getMatchedMaterialId(index)" :src="getMaterialImageUrl(getMatchedMaterialId(index))"
                        :alt="'素材'" class="config-image" />
                      <span v-else class="config-image-placeholder">无匹配素材</span>
                    </template>
                    <template v-else>
                      <!-- 合并模式：显示所有素材图 -->
                      <img v-for="materialId in ids" :key="materialId" :src="getMaterialImageUrl(materialId)"
                        :alt="'素材'" class="config-image" />
                      <span v-if="!ids.length" class="config-image-placeholder">无素材</span>
                    </template>
                  </div>
                </div>
                <div class="config-image-item">
                  <div class="config-image-label">模板配置图</div>
                  <div class="config-image-wrapper">
                    <img v-if="template.thumbnail"
                      :src="getPreviewImageUrl(template.thumbnail, { width: 200, quality: 80, format: 'webp' })"
                      :alt="template.name" class="config-image" />
                    <span v-else class="config-image-placeholder">无缩略图</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="template-config-right">
              <div class="config-editor-toolbar">
                <el-button @click="handleResetConfigForTemplate(index)" type="warning" :icon="RefreshLeft" size="small">
                  重置为默认
                </el-button>
              </div>
              <el-input v-model="template.configText" type="textarea" :rows="18"
                placeholder="请输入JSON配置（例如：{&quot;key1&quot;: &quot;value1&quot;, &quot;key2&quot;: &quot;value2&quot;}）"
                class="config-textarea" />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="batchDetailConfigDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveConfigToMemory">
          保存（暂存）
        </el-button>
      </template>
    </el-dialog>

    <!-- PSD模板详情弹窗 -->
    <el-dialog v-model="psdTemplateDetailDialogVisible" title="PSD模板详情" fullscreen align-center
      :destroy-on-close="true">
      <div v-if="currentPsdTemplate" class="psd-template-detail">
        <div class="detail-layout">
          <div class="detail-left">
            <div class="detail-thumbnail">
              <img v-if="currentPsdTemplate.thumbnail || currentPsdTemplate.preview || currentPsdTemplate.image"
                :src="getPreviewImageUrl(currentPsdTemplate.thumbnail || currentPsdTemplate.preview || currentPsdTemplate.image, { width: 600, quality: 90, format: 'webp' })"
                :alt="currentPsdTemplate.name || '模板缩略图'" class="detail-thumbnail-img" loading="lazy" />
              <div v-else class="detail-thumbnail-placeholder">暂无缩略图</div>
            </div>
          </div>

          <div class="detail-right">
            <div class="detail-item">
              <span class="detail-label">模板名称：</span>
              <span class="detail-value">{{ currentPsdTemplate.name || '未命名模板' }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">描述：</span>
              <span class="detail-value">{{ currentPsdTemplate.description || '暂无' }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">关键字：</span>
              <span class="detail-value">{{ currentPsdTemplate.keywords || '暂无' }}</span>
            </div>

            <div v-if="currentPsdTemplate.psdTemplateConfig" class="detail-item">
              <span class="detail-label">PSD配置：</span>
              <div class="detail-value psd-config-value">{{ currentPsdTemplate.psdTemplateConfig }}</div>
            </div>

            <div class="detail-item">
              <span class="detail-label">远程链接：</span>
              <div class="detail-value">
                <el-link v-if="currentPsdTemplate.url" :href="currentPsdTemplate.url" target="_blank" type="primary"
                  :underline="false">
                  {{ currentPsdTemplate.url }}
                </el-link>
                <span v-else class="detail-empty">暂无</span>
              </div>
            </div>

            <div class="detail-item">
              <span class="detail-label">本地路径：</span>
              <span class="detail-value">{{ currentPsdTemplate.windowsLocalPath || '暂无' }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="psdTemplateDetailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <div class="flex overflow-visible" style="overflow: hidden;">
      <!-- 文件夹树 -->
      <div class="relative flex-shrink-0 z-[200] !overflow-visible" :class="folderTreeCollapsed ? 'w-0' : 'w-[280px]'">
        <div class="h-full overflow-hidden">
          <div class="sticker-folder-tree-container h-full w-[280px]"
            style="border-right: 1px solid var(--el-border-color); padding-right: 16px;">
            <div class="sticker-folder-tree-header" style="margin-bottom: 12px;">
              <el-button type="primary" size="small" plain style="width: 100%;" @click="handleCreateRootStickerFolder">
                <el-icon>
                  <FolderAdd />
                </el-icon>
                新建文件夹
              </el-button>
            </div>
            <el-tree ref="stickerFolderTreeRef" :data="stickerFolderTreeData"
              :props="{ children: 'children', label: 'name' }" node-key="id" :expand-on-click-node="false"
              :default-expand-all="false" :default-expanded-keys="['__root__']" :highlight-current="true"
              :current-node-key="selectedStickerFolderId"
              style="max-height: calc(100vh - 300px); overflow-y: auto; overflow-x: hidden;"
              class="sticker-folder-tree">
              <template #default="{ node, data }">
                <div class="sticker-folder-node"
                  :class="{ 'is-drop-hover': dragState.overFolderId === data.id && dragState.dragging }"
                  @dragover.prevent="handleFolderDragOver(data, $event)" @dragleave="handleFolderDragLeave(data)"
                  @drop.prevent="handleFolderDrop(data)">
                  <div class="sticker-folder-node-content">
                    <template v-if="data.isAll || data.id === '__root__'">
                      <el-icon class="folder-icon"
                        style="flex-shrink: 0; margin-right: 6px; color: var(--el-color-primary)">
                        <Files />
                      </el-icon>
                    </template>
                    <template v-else>
                      <img v-if="node.expanded && (data.children && data.children.length > 0)"
                        src="/img/folder-open.svg" class="folder-icon" alt="folder" />
                      <img v-else src="/img/folder-close.svg" class="folder-icon" alt="folder" />
                    </template>
                    <span class="sticker-folder-node-text" @click.stop="handleStickerFolderNodeClick(data)">{{ data.name
                      }}</span>
                    <span v-if="data.id !== '__root__' && !data.isAll" class="sticker-folder-node-count">({{
                      data.stickerCount || 0
                      }})</span>
                  </div>
                  <div v-if="data.id !== '__root__'" class="sticker-folder-node-actions">
                    <el-dropdown trigger="click" @command="(cmd) => handleStickerFolderCommand(cmd, data)" @click.stop
                      size="small">
                      <el-icon class="sticker-folder-action-icon">
                        <MoreFilled />
                      </el-icon>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="create">
                            <el-icon>
                              <FolderAdd />
                            </el-icon>
                            新建子文件夹
                          </el-dropdown-item>
                          <el-dropdown-item command="rename">
                            <el-icon>
                              <Edit />
                            </el-icon>
                            重命名
                          </el-dropdown-item>
                          <el-dropdown-item command="delete" divided>
                            <el-icon>
                              <Delete />
                            </el-icon>
                            删除
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
              </template>
            </el-tree>
          </div>
        </div>
        <div
          class="absolute top-1/2 -right-4 w-8 h-16 bg-white border border-gray-200 rounded-r flex items-center justify-center cursor-pointer shadow-md z-[999] hover:bg-gray-50 text-gray-600 hover:text-primary transition-colors"
          @click="folderTreeCollapsed = !folderTreeCollapsed" style="transform: translateY(-50%)">
          <el-icon :size="14">
            <DArrowRight v-if="folderTreeCollapsed" />
            <DArrowLeft v-else />
          </el-icon>
        </div>
      </div>

      <div class="content-container" style="flex: 1; min-width: 0; overflow: hidden;">
        <div class="common-table">
          <vxe-grid class="material-dnd-grid" ref="gridRef" v-bind="gridOptions" :data="dataSource" :loading="loading"
            :row-class-name="materialRowClassName" @checkbox-change="checkboxChange" @checkbox-all="checkboxAllChange">
            <template #previewDefaultSlot="{ row }">
              <div class="flex flex-col items-center justify-center p-2">
                <div class="preview-image-wrapper">
                  <img v-if="row._imageLoaded" :key="`preview-${row.id}-${row.url}`"
                    :src="getPreviewImageUrl(row.url, { width: 200, quality: 80, format: 'webp' })"
                    :alt="row.name || '素材图片'" class="preview-image" loading="lazy"
                    @click="openImagePreview(row.url, row.name)" />
                  <img v-else :key="`preview-loading-${row.id}-${row.url}`"
                    :src="getPreviewImageUrl(row.url, { width: 200, quality: 80, format: 'webp' })"
                    :alt="row.name || '素材图片'" class="preview-image preview-image-loading" loading="lazy"
                    @load="(e) => handleImageLoad(row, e)" @error="() => handleImageError(row)"
                    @click="openImagePreview(row.url, row.name)" />
                  <div v-if="!row._imageLoaded" class="preview-loading">加载中...</div>
                </div>
                <div class="text-xs text-gray-500 mt-1 text-center">
                  <template v-if="row.resolutionWidth && row.resolutionHeight">
                    <div>
                      {{ row.resolutionWidth }} × {{ row.resolutionHeight }}
                    </div>
                    <div v-if="row.aspectRatio" style="color:#999; margin-top:2px; font-size: 11px;">
                      宽高比：{{ Number(row.aspectRatio).toFixed(2) }}
                    </div>
                  </template>
                  <template v-else>
                    -
                  </template>
                  <div v-if="row.suffix" style="color:#409EFF; margin-top:2px; font-size: 11px; font-weight: 600;">
                    格式：{{ row.suffix.toUpperCase() }}
                  </div>
                </div>
              </div>
            </template>

            <template #nameBilingualSlot="{ row }">
              <div class="bilingual-cell">
                <div class="bilingual-cell__item" :class="{ 'bilingual-cell__item--empty': !row.name }"
                  @click.stop="handleCopyText(row.name, '中文名称')" role="button">
                  <span class="bilingual-cell__label">中：</span>
                  <el-tooltip :content="row.name || '-'" placement="top" :disabled="!(row.name && row.name.length > 0)"
                    popper-class="text-cell-tooltip">
                    <span class="bilingual-cell__content">{{ row.name || '-' }}</span>
                  </el-tooltip>
                  <el-icon v-if="row.name" class="bilingual-cell__icon">
                    <DocumentCopy />
                  </el-icon>
                </div>
                <div class="bilingual-cell__item bilingual-cell__item--en"
                  :class="{ 'bilingual-cell__item--empty': !row.nameEn }"
                  @click.stop="handleCopyText(row.nameEn, '英文名称')" role="button">
                  <span class="bilingual-cell__label">En:</span>
                  <el-tooltip :content="row.nameEn || '-'" placement="top"
                    :disabled="!(row.nameEn && row.nameEn.length > 0)" popper-class="text-cell-tooltip">
                    <span class="bilingual-cell__content">{{ row.nameEn || '-' }}</span>
                  </el-tooltip>
                  <el-icon v-if="row.nameEn" class="bilingual-cell__icon">
                    <DocumentCopy />
                  </el-icon>
                </div>
              </div>
            </template>

            <template #descriptionBilingualSlot="{ row }">
              <div class="bilingual-cell">
                <div class="bilingual-cell__item" :class="{ 'bilingual-cell__item--empty': !row.description }"
                  @click.stop="handleCopyText(row.description, '中文描述')" role="button">
                  <span class="bilingual-cell__label">中：</span>
                  <el-tooltip :content="row.description || '-'" placement="top"
                    :disabled="!(row.description && row.description.length > 0)" popper-class="text-cell-tooltip">
                    <span class="bilingual-cell__content">{{ row.description || '-' }}</span>
                  </el-tooltip>
                  <el-icon v-if="row.description" class="bilingual-cell__icon">
                    <DocumentCopy />
                  </el-icon>
                </div>
                <div class="bilingual-cell__item bilingual-cell__item--en"
                  :class="{ 'bilingual-cell__item--empty': !row.descriptionEn }"
                  @click.stop="handleCopyText(row.descriptionEn, '英文描述')" role="button">
                  <span class="bilingual-cell__label">En:</span>
                  <el-tooltip :content="row.descriptionEn || '-'" placement="top"
                    :disabled="!(row.descriptionEn && row.descriptionEn.length > 0)" popper-class="text-cell-tooltip">
                    <span class="bilingual-cell__content">{{ row.descriptionEn || '-' }}</span>
                  </el-tooltip>
                  <el-icon v-if="row.descriptionEn" class="bilingual-cell__icon">
                    <DocumentCopy />
                  </el-icon>
                </div>
              </div>
            </template>

            <template #keywordsBilingualSlot="{ row }">
              <div class="bilingual-cell">
                <div class="bilingual-cell__item" :class="{ 'bilingual-cell__item--empty': !row.keywords }"
                  @click.stop="handleCopyText(row.keywords, '中文关键词')" role="button">
                  <span class="bilingual-cell__label">中：</span>
                  <el-tooltip :content="row.keywords || '-'" placement="top"
                    :disabled="!(row.keywords && row.keywords.length > 0)" popper-class="text-cell-tooltip">
                    <span class="bilingual-cell__content">{{ row.keywords || '-' }}</span>
                  </el-tooltip>
                  <el-icon v-if="row.keywords" class="bilingual-cell__icon">
                    <DocumentCopy />
                  </el-icon>
                </div>
                <div class="bilingual-cell__item bilingual-cell__item--en"
                  :class="{ 'bilingual-cell__item--empty': !row.keywordsEn }"
                  @click.stop="handleCopyText(row.keywordsEn, '英文关键词')" role="button">
                  <span class="bilingual-cell__label">En:</span>
                  <el-tooltip :content="row.keywordsEn || '-'" placement="top"
                    :disabled="!(row.keywordsEn && row.keywordsEn.length > 0)" popper-class="text-cell-tooltip">
                    <span class="bilingual-cell__content">{{ row.keywordsEn || '-' }}</span>
                  </el-tooltip>
                  <el-icon v-if="row.keywordsEn" class="bilingual-cell__icon">
                    <DocumentCopy />
                  </el-icon>
                </div>
              </div>
            </template>

            <template #resolutionSlot="{ row }">
              <div v-if="row.resolutionWidth && row.resolutionHeight" class="text-xs">
                <div>
                  {{ row.resolutionWidth }} × {{ row.resolutionHeight }}
                </div>
                <div v-if="row.aspectRatio" style="color:#999; margin-top:2px; font-size: 11px;">
                  宽高比：{{ Number(row.aspectRatio).toFixed(2) }}
                </div>
              </div>
              <span v-else>-</span>
            </template>
            <template #originWebSlot="{ row }">
              <span>{{ row.originWeb || '-' }}</span>
            </template>
            <template #sizeSlot="{ row }">
              <span>{{ row.size ? (row.size / 1024).toFixed(1) + ' KB' : '-' }}</span>
            </template>

            <template #isCustomSlot="{ row }">
              <el-tag :type="row.isCustom ? 'success' : 'info'" size="small">
                {{ row.isCustom ? '是' : '否' }}
              </el-tag>
            </template>

            <template #isInfringementSlot="{ row }">
              <el-tag :type="row.isInfringement ? 'danger' : 'success'" size="small">
                {{ row.isInfringement ? '侵权' : '非侵权' }}
              </el-tag>
            </template>

            <template #isCutoutSlot="{ row }">
              <el-tag :type="row.isCutout ? 'success' : 'info'" size="small">
                {{ row.isCutout ? '是' : '否' }}
              </el-tag>
            </template>

            <template #fileSizeSlot="{ row }">
              <span v-if="row.fileSize">
                {{ formatFileSize(row.fileSize) }}
              </span>
              <span v-else style="color: #999;">-</span>
            </template>

            <template #suitableForSlot="{ row }">
              <div v-if="row.suitableFor"
                style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center; line-height: 1.5;">
                <el-tag v-for="(item, index) in (row.suitableFor || '').split(',').slice(0, 2)" :key="index"
                  size="small" type="info" style="margin: 0; flex-shrink: 0;">
                  {{ item.trim() }}
                </el-tag>
                <el-tooltip v-if="(row.suitableFor || '').split(',').length > 2"
                  :content="(row.suitableFor || '').split(',').map(item => item.trim()).join('、')" placement="top"
                  effect="dark" :show-after="200">
                  <el-tag size="small" type="info" style="margin: 0; cursor: pointer; flex-shrink: 0;">
                    +{{ (row.suitableFor || '').split(',').length - 2 }}
                  </el-tag>
                </el-tooltip>
              </div>
              <span v-else style="color: #999;">-</span>
            </template>

            <template #similaritySlot="{ row }">
              <el-tag v-if="row.similarity !== undefined"
                :type="row.similarity >= 90 ? 'success' : row.similarity >= 70 ? 'warning' : 'info'" size="small">
                {{ row.similarity.toFixed(1) }}%
              </el-tag>
              <span v-else>-</span>
            </template>

            <template #colorPaletteSlot="{ row }">
              <div v-if="row.colorPalette"
                style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center; max-height: 60px; overflow: hidden;">
                <div v-for="(color, index) in row.colorPalette.split(',').slice(0, 10)" :key="index" :style="{
                  width: '18px',
                  height: '18px',
                  backgroundColor: color.trim(),
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  flexShrink: 0
                }" :title="color.trim()" />
              </div>
              <span v-else style="color: #999;">-</span>
            </template>

            <template #originUrlSlot="{ row }">
              <el-link v-if="row.originUrl" :href="row.originUrl" target="_blank" type="primary" :underline="false"
                style="font-size: 12px;">
                {{ row.originUrl.length > 50 ? row.originUrl.substring(0, 50) + '...' : row.originUrl }}
              </el-link>
              <span v-else style="color: #999; font-size: 12px;">-</span>
            </template>

            <template #sourceSlot="{ row }">
              <el-link v-if="row.source && /^https?:\/\//i.test(row.source)" :href="row.source" target="_blank"
                type="primary" :underline="false" style="font-size: 12px;">
                {{ row.source.length > 50 ? row.source.substring(0, 50) + '...' : row.source }}
              </el-link>
              <span v-else-if="row.source" style="font-size: 12px;">{{ row.source.length > 50 ? row.source.substring(0,
                50) + '...' : row.source }}</span>
              <span v-else style="color: #999; font-size: 12px;">-</span>
            </template>

            <template #folderSlot="{ row }">
              <el-tag v-if="row.folder" type="info" size="small" style="font-size: 12px;">
                <el-icon style="margin-right: 4px;">
                  <Folder />
                </el-icon>
                {{ row.folder }}
              </el-tag>
              <span v-else style="color: #999; font-size: 12px;">根目录</span>
            </template>

            <template #operationDefaultSlot="{ row }">
              <div class="flex items-center gap-1">
                <el-dropdown trigger="click" class="operation-dropdown">
                  <el-button type="primary" link size="small">
                    操作<el-icon class="el-icon--right">
                      <ArrowDown />
                    </el-icon>
                  </el-button>
                  <template #dropdown>
                    <div class="op-menu">
                      <!-- 内容相关（仅管理员） -->
                      <div v-if="isAdmin" class="op-menu-item has-submenu" @mouseenter="handleSubmenuEnter"
                        @mouseleave="handleSubmenuLeave">
                        <el-icon class="op-menu-arrow">
                          <ArrowLeft />
                        </el-icon>
                        <span class="op-menu-label">内容相关</span>
                        <div class="op-submenu" data-submenu="content" @mouseenter="handleSubmenuKeepVisible"
                          @mouseleave="handleSubmenuHide">
                          <div class="op-submenu-item" @click="() => handleOperationCommand('ai-generate', row)">
                            AI自动生成内容</div>
                          <div class="op-submenu-item"
                            @click="() => handleOperationCommand('generate-image-info', row)">生成图片信息</div>
                          <div class="op-submenu-item" @click="() => handleOperationCommand('view-meta', row)">查看元数据
                          </div>
                        </div>
                      </div>

                      <!-- 制作操作（仅管理员） -->
                      <div v-if="isAdmin" class="op-menu-item has-submenu" @mouseenter="handleSubmenuEnter"
                        @mouseleave="handleSubmenuLeave">
                        <el-icon class="op-menu-arrow">
                          <ArrowLeft />
                        </el-icon>
                        <span class="op-menu-label">制作</span>
                        <div class="op-submenu" data-submenu="design" @mouseenter="handleSubmenuKeepVisible"
                          @mouseleave="handleSubmenuHide">
                          <div class="op-submenu-item" @click="() => handleOperationCommand('create-ps-set', row)">
                            制作PS套图</div>
                        </div>
                      </div>

                      <!-- 图片操作 -->
                      <div class="op-menu-item has-submenu" @mouseenter="handleSubmenuEnter"
                        @mouseleave="handleSubmenuLeave">
                        <el-icon class="op-menu-arrow">
                          <ArrowLeft />
                        </el-icon>
                        <span class="op-menu-label">图片操作</span>
                        <div class="op-submenu" data-submenu="image" @mouseenter="handleSubmenuKeepVisible"
                          @mouseleave="handleSubmenuHide">
                          <div class="op-submenu-item" @click="() => handleOperationCommand('download', row)">下载</div>
                          <div v-if="isAdmin" class="op-submenu-item"
                            @click="() => handleOperationCommand('copy', row)">复制</div>
                          <div class="op-submenu-item" @click="() => handleOperationCommand('find-similar', row)">找相似图
                          </div>
                          <div v-if="isAdmin && (row.suffix || '').toLowerCase() === 'png'" class="op-submenu-item"
                            @click="() => handleOperationCommand('trim-png', row)">生成无空白PNG</div>
                          <div v-if="isAdmin && (row.suffix || '').toLowerCase() === 'svg'" class="op-submenu-item"
                            @click="() => handleOperationCommand('svg-to-png', row)">SVG转PNG</div>
                        </div>
                      </div>

                      <!-- 图片裂变和视频制作 -->
                      <div class="op-menu-item has-submenu" @mouseenter="handleSubmenuEnter"
                        @mouseleave="handleSubmenuLeave">
                        <el-icon class="op-menu-arrow">
                          <ArrowLeft />
                        </el-icon>
                        <span class="op-menu-label">制作工具</span>
                        <div class="op-submenu" data-submenu="production" @mouseenter="handleSubmenuKeepVisible"
                          @mouseleave="handleSubmenuHide">
                          <div class="op-submenu-item" @click="() => handleOperationCommand('image-split', row)">图片裂变
                          </div>
                          <div class="op-submenu-item" @click="() => handleOperationCommand('video-production', row)">
                            视频制作</div>
                        </div>
                      </div>

                      <div v-if="isAdmin" class="op-divider"></div>
                      <div v-if="isAdmin" class="op-menu-item" @click="() => handleOperationCommand('edit', row)">
                        <span class="op-menu-arrow-placeholder"></span>
                        <span class="op-menu-label">编辑</span>
                      </div>
                      <div v-if="isAdmin" class="op-menu-item danger"
                        @click="() => handleOperationCommand('delete', row)">
                        <span class="op-menu-arrow-placeholder"></span>
                        <span class="op-menu-label">删除</span>
                      </div>
                    </div>
                  </template>
                </el-dropdown>

                <el-icon v-if="aiTableLoading?.[row?.id]" class="is-loading ml-2"
                  style="color:#409EFF;font-size:18px;" />
              </div>
            </template>
          </vxe-grid>
        </div>

        <!-- 分页 -->
        <div class="flex justify-end" style="margin-bottom: 24px; margin-top: 16px;">
          <pagination v-model:page="queryParams.currentPage" v-model:limit="queryParams.pageSize" :total="total"
            @pagination="getList" />
        </div>
      </div>
    </div>

    <el-dialog v-model="uploadModalVisible" title="素材上传" width="100%" style="height: 100%" align-center :footer="false"
      :destroy-on-close="true" class="material-upload-dialog" @close="uploadModalClose">
      <div style="height: 100%">
        <list-upload :current-upload-info="currentUploadInfo" @single-file-uploaded="singleFileUploaded" />
      </div>
    </el-dialog>

    <!-- URL上传弹窗 -->
    <el-dialog v-model="urlUploadModalVisible" title="URL上传素材" width="500px" align-center :destroy-on-close="true"
      @close="resetUrlUploadForm">
      <el-form ref="urlUploadFormRef" :model="urlUploadForm" :rules="urlUploadFormRules" label-width="80px">
        <el-form-item label="图片URL" prop="url">
          <el-input v-model="urlUploadForm.url" placeholder="请输入图片的完整URL地址" style="width: 100%" clearable />
        </el-form-item>
        <el-form-item label="文件名" prop="name">
          <el-input v-model="urlUploadForm.name" placeholder="请输入文件名" style="width: 100%" clearable />
        </el-form-item>
        <el-form-item label="AI生成">
          <el-switch v-model="urlUploadForm.useAiGenerate" active-text="使用AI自动生成补全内容" />
        </el-form-item>
        <el-form-item label="文件夹">
          <el-select v-model="urlUploadForm.folderId" placeholder="请选择文件夹（留空为根目录）" clearable filterable
            style="width: 100%">
            <el-option label="根目录" :value="null" />
            <el-option v-for="folder in stickerFolderSelectOptions" :key="folder.value || 'root'" :label="folder.label"
              :value="folder.value" />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 预览区域 -->
      <div class="preview-section">
        <div class="preview-label">图片预览</div>
        <div v-if="urlUploadForm.url && urlPreviewVisible" class="image-preview">
          <img :src="urlUploadForm.url" alt="预览图片" class="preview-image" loading="lazy" @error="handlePreviewError"
            @load="handlePreviewLoad" />
          <div v-if="imageInfo" class="image-info">
            <el-tag size="small" type="info">尺寸: {{ imageInfo.width }} × {{ imageInfo.height }}</el-tag>
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
          <el-button type="primary" :loading="urlUploadLoading" @click="handleUrlUpload">上传</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 制作设计模型弹窗 -->

    <el-dialog v-model="editDialogVisible" title="编辑素材信息" width="1200px" :destroy-on-close="true" align-center
      class="edit-material-dialog">
      <el-form :model="editForm" label-width="120px" class="edit-form">
        <!-- 基本信息 -->
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="名称">
              <el-input v-model="editForm.name" placeholder="请输入名称" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文名称">
              <el-input v-model="editForm.nameEn" placeholder="请输入英文名称" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="分组">
              <el-input v-model="editForm.group" placeholder="请输入分组名称" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用场景">
              <el-input v-model="editForm.suitableFor" placeholder="请输入适用场景（逗号分隔，如：phone_case,tshirt,mug）" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="描述">
              <el-input v-model="editForm.description" type="textarea" :rows="4" placeholder="请输入描述" maxlength="1000"
                show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文描述">
              <el-input v-model="editForm.descriptionEn" type="textarea" :rows="4" placeholder="请输入英文描述"
                maxlength="1000" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="关键字">
              <el-input v-model="editForm.keywords" placeholder="请输入关键字（逗号分隔）" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文关键字">
              <el-input v-model="editForm.keywordsEn" placeholder="请输入英文关键字（逗号分隔）" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider />

        <!-- 状态和属性 -->
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="自定义贴纸">
              <el-switch v-model="editForm.isCustom" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="是否公开">
              <el-switch v-model="editForm.isPublic" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="是否为材质">
              <el-switch v-model="editForm.isTexture" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="侵权状态">
              <el-select v-model="editForm.isInfringement" placeholder="请选择" style="width: 100%">
                <el-option label="非侵权" :value="false" />
                <el-option label="侵权" :value="true" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="抠图素材">
              <el-switch v-model="editForm.isCutout" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="文件后缀">
              <el-input v-model="editForm.suffix" placeholder="如：png, jpg, svg" clearable maxlength="20" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider />

        <!-- 只读信息 -->
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="图片尺寸">
              <el-input :value="editForm.width && editForm.height ? `${editForm.width} × ${editForm.height}` : '-'"
                disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="宽高比">
              <el-input :value="editForm.aspectRatio ? editForm.aspectRatio.toFixed(4) : '-'" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="文件大小">
              <el-input :value="editForm.fileSize ? formatFileSize(editForm.fileSize) : '-'" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="色系">
              <el-input :value="editForm.colorPalette || '-'" disabled placeholder="自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="感知哈希">
              <el-input :value="editForm.phash || '-'" disabled placeholder="自动生成" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider />

        <!-- URL 信息 -->
        <el-form-item label="原始地址">
          <el-input v-model="editForm.originUrl" placeholder="请输入原始地址" clearable />
        </el-form-item>
        <el-form-item label="来源">
          <el-input v-model="editForm.source" placeholder="请输入来源（文字介绍或链接）" clearable />
        </el-form-item>
        <el-form-item label="文件夹">
          <el-select v-model="editForm.folderId" placeholder="请选择文件夹（留空为根目录）" clearable filterable style="width: 100%">
            <el-option label="根目录" :value="null" />
            <el-option v-for="folder in stickerFolderSelectOptions" :key="folder.value || 'root'" :label="folder.label"
              :value="folder.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="editLoading" @click="submitEdit">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="aiGenDialogVisible" title="AI自动生成内容" width="1000px" align-center :destroy-on-close="true">
      <div class="ai-gen-form">
        <div class="form-section">
          <label class="section-label">原始信息（可选）</label>
          <div class="section-desc">粘贴网页内容或其他原始信息，帮助AI更好地理解图片内容</div>
          <el-input v-model="aiGenerateRawInfo" type="textarea" :rows="10" placeholder="如：网页上关于这张图片的描述、产品介绍等..."
            style="font-size:14px;min-height:200px;width:100%;resize:vertical;" />
        </div>

        <div class="form-section">
          <label class="section-label">分析风格（可选）</label>
          <div class="section-desc">请输入你希望AI分析的内容风格或角度</div>
          <el-input v-model="aiGenPrompt" type="textarea" :rows="10" placeholder="如：请用艺术化语言描述图片内容、突出色彩特点等..."
            style="font-size:14px;min-height:200px;width:100%;resize:vertical;" />
        </div>
      </div>
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog">确定</el-button>
      </template>
    </el-dialog>


    <el-dialog v-model="metaDialogVisible" fullscreen title="元数据详情" :close-on-click-modal="false">
      <div v-if="metaDialogContent">
        <vue-json-pretty v-if="parsedMetaData" :data="parsedMetaData" />
        <div v-else class="meta-error">
          <el-alert type="warning" :closable="false" show-icon title="元数据格式错误" description="无法解析元数据，请检查数据格式。" />
          <div class="meta-raw-content">
            <pre>{{ metaDialogContent }}</pre>
          </div>
        </div>
      </div>
      <div v-else class="meta-empty">
        <el-empty description="该素材没有元数据信息" />
      </div>
    </el-dialog>

    <!-- SVG转PNG尺寸设置弹窗 -->
    <el-dialog v-model="svgToPngDialogVisible" title="SVG转PNG - 设置输出尺寸" width="500px" align-center
      :destroy-on-close="true">
      <div class="svg-to-png-form">
        <div class="form-section">
          <h4 class="section-title">输出尺寸设置</h4>
          <div class="original-info" v-if="svgToPngForm.originalWidth && svgToPngForm.originalHeight">
            <el-tag type="info" size="small">
              原始尺寸: {{ svgToPngForm.originalWidth }} × {{ svgToPngForm.originalHeight }}
              (宽高比: {{ svgToPngForm.aspectRatio.toFixed(2) }})
            </el-tag>
          </div>
          <el-form :model="svgToPngForm" label-width="120px">
            <el-form-item label="输出宽度 (px)">
              <el-input-number v-model="svgToPngForm.width" :min="64" :max="4096" :step="64" controls-position="right"
                style="width: 200px" @change="handleWidthChange" />
            </el-form-item>
            <el-form-item label="自动计算高度">
              <el-tag type="info" size="large">
                {{ svgToPngForm.height }} px
              </el-tag>
              <span class="aspect-ratio-info">
                (基于原始宽高比 {{ svgToPngForm.aspectRatio.toFixed(2) }} 自动计算)
              </span>
            </el-form-item>
          </el-form>
        </div>

        <div class="preset-section">
          <h4 class="section-title">常用尺寸预设</h4>
          <div class="preset-buttons">
            <el-button v-for="preset in sizePresets" :key="preset.name" size="small" @click="applyPreset(preset)">
              {{ preset.name }}<br>
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
              文件大小: 约 {{ Math.round(svgToPngForm.width * svgToPngForm.height * 4 / 1024) }} KB
            </el-tag>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="svgToPngDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSvgToPng">开始转换</el-button>
      </template>
    </el-dialog>

    <!-- 图片预览弹窗 -->
    <ImagePreview :visible="imagePreviewVisible" :image-url="currentImageUrl" @close="closeImagePreview" />

    <!-- 拖拽提示气泡（跟随鼠标） -->
    <teleport to="body">
      <div v-show="dragHint.visible" class="drag-hint-bubble"
        :style="{ left: `${dragHint.x}px`, top: `${dragHint.y}px` }">
        <el-icon class="drag-hint-icon">
          <InfoFilled />
        </el-icon>
        <span>{{ dragHint.text }}</span>
      </div>
    </teleport>


  </div>
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
  nextTick
} from 'vue'
import { gridRef, resetCheckStatus } from './selection'

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
  batchMoveStickers,
  getStickerFolderTree,
  createStickerFolder,
  renameStickerFolder,
  deleteStickerFolder,
  uploadMaterialFile,
  copyStickers,
  trimPng,
  svgToPng
} from '@/api/material' // 实际接口导入

import { uploadToCOS } from '@/api/cos'
import { stickerPsdSetApi } from '@/api/stickerPsdSet'

import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import CryptoJS from 'crypto-js'
import Sortable from 'sortablejs'

import { useDebounceFn, useLocalStorage, useSessionStorage, useWindowSize, useMouse } from '@vueuse/core'
import { sortTypeOptions, defaultSortingValue } from '@/common/sort'
import { saveAs } from 'file-saver'

import { useUserStore } from '@/store/modules/user'
import listUpload from './listUpload.vue'
import { materialConfig, getMaterialConfig, categoryOptions } from '@/views/material/collect/index'
import { ElButton, ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, Search, TopRight, Upload, Loading, Check, More, InfoFilled, ArrowDown, ArrowRight, ArrowLeft, Edit, Download, Picture, MagicStick, Key, Document, Warning, PictureFilled, Grid, DocumentCopy, RefreshLeft, Folder, FolderOpened, FolderAdd, MoreFilled, Files, DArrowLeft, DArrowRight } from '@element-plus/icons-vue'
import tree from './tree.vue'
import { materialStatusOptions } from '.'
import { psdTemplateApi } from '@/api/psdTemplate'
import { formatDate } from '@/utils/formatTime'
import { getTitleTemplateList } from '@/api/publish'
import { downloadCrossOriginImage, downloadFileByElement, downloadImage } from '@/common/download'
import { getConfigTemplateList } from '@/api/publish/config'
import genPicture from './genPicture.vue'
import { getAccessToken } from '@/utils/auth'
import { getTenantId } from '@/utils/auth'
import useListSelect from '@/components/common/userListSelect.vue'
import { getDesignModelList } from '@/api/designModel'
import request from '@/config/axios'
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import { getPreviewImageUrl } from '@/utils/image'

const userStore = useUserStore()

// 判断是否为管理员
const isAdmin = computed(() => userStore.user?.isAdmin ?? false)

const form = ref({})

const queryParams = reactive({
  currentPage: 1,
  pageSize: 10,
  keyword: '',
  searchPrompt: '', // AI 提示词（最高优先级，解析为结构化搜索）
  searchText: '', // 多字段搜索（名称、描述、关键词等）
  searchMode: 'AND', // 搜索模式：AND（所有关键词必须都出现，默认）| OR（任意关键词出现即可）
  sortingFields: 'createTime DESC', // 排序字段
  startTime: '',
  endTime: '',
  suffix: [], // 新增后缀参数（支持多选）
  id: '', // 新增ID精确查询参数
  phash: '', // phash值或直接输入图片地址
  phashMode: 'range', // range | exact
  isCustom: null, // 新增自定义贴纸过滤参数，使用null而不是空字符串
  isInfringement: null, // 新增侵权状态过滤参数
  isCutout: null, // 新增抠图素材过滤参数
  sizeShape: [] as string[], // 尺寸形状：landscape(横图) | portrait(竖图) | square(正方图) | ultra-wide | wide | slightly-wide | slightly-long | long | ultra-long（支持多选）
  random: false, // 是否随机
  folderId: undefined as string | null | undefined, // 文件夹ID
})

// 尺寸形状选项配置
const sizeShapeOptions = {
  'landscape': { label: '横图', thumbClass: 'landscape-thumb' },
  'portrait': { label: '竖图', thumbClass: 'portrait-thumb' },
  'square': { label: '正方图', thumbClass: 'square-thumb' },
  'ultra-wide': { label: '超宽图 (≥2:1)', thumbClass: 'ultra-wide-thumb' },
  'wide': { label: '宽图 (1.5:1 - 2:1)', thumbClass: 'wide-thumb' },
  'slightly-wide': { label: '微宽图 (1.1:1 - 1.5:1)', thumbClass: 'slightly-wide-thumb' },
  'slightly-long': { label: '微长图 (1:1.1 - 1:1.5)', thumbClass: 'slightly-long-thumb' },
  'long': { label: '长图 (1:1.5 - 1:2)', thumbClass: 'long-thumb' },
  'ultra-long': { label: '超长图 (≤1:2)', thumbClass: 'ultra-long-thumb' }
}

// 展示模式见 ./selection.ts

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const gridOptions = computed(() => {
  const baseColumns = [
    { type: 'checkbox' as const, field: 'checkbox', title: '', width: 50, ellipsis: true, reserve: true, minWidth: 50, fixed: 'left' as const, className: '' as any },
    // { title: 'ID', field: 'id', width: 80, ellipsis: true },
    {
      title: '图片预览',
      field: 'url',
      width: 120,
      slots: { default: 'previewDefaultSlot' }
    },
    { title: '名称（中/英）', field: 'name', minWidth: 280, className: 'font-bold', slots: { default: 'nameBilingualSlot' } },
    { title: '描述（中/英）', field: 'description', minWidth: 320, slots: { default: 'descriptionBilingualSlot' } },
    { title: '关键词（中/英）', field: 'keywords', minWidth: 280, slots: { default: 'keywordsBilingualSlot' } },
    { title: '后缀', field: 'suffix', width: 80, }, // 新增后缀列
    {
      title: '文件尺寸',
      field: 'fileSize',
      width: 120,
      slots: { default: 'fileSizeSlot' }
    }, // 新增文件尺寸列
    {
      title: '适用商品',
      field: 'suitableFor',
      minWidth: 150,
      slots: { default: 'suitableForSlot' }
    }, // 新增适用商品列
    {
      title: '相似度',
      field: 'similarity',
      width: 80,
      slots: { default: 'similaritySlot' }
    }, // 新增相似度列
    {
      title: '上传者',
      field: 'uploader',
      width: 140,
      formatter: ({ row }) => row?.uploader?.account || row?.uploader?.name || row?.uploaderAccount || row?.uploaderId || '-'
    },
    {
      title: '色系',
      field: 'colorPalette',
      width: 200,
      slots: { default: 'colorPaletteSlot' }
    }, // 新增色系列
    {
      title: '侵权状态',
      field: 'isInfringement',
      width: 100,
      slots: { default: 'isInfringementSlot' }
    },
    {
      title: '抠图',
      field: 'isCutout',
      width: 100,
      slots: { default: 'isCutoutSlot' }
    },
    {
      title: '文件夹',
      field: 'folder',
      width: 180,
      slots: { default: 'folderSlot' }
    },
  ]

  // 只有管理员显示的字段
  const adminOnlyColumns = [
    { title: '感知哈希', field: 'phash', width: 80, }, // 新增哈希列
    { title: 'ID', field: 'id', width: 80, }, // 新增ID列
    {
      title: '自定义贴纸',
      field: 'isCustom',
      width: 100,
      slots: { default: 'isCustomSlot' }
    },
    { title: '原始地址', field: 'originUrl', minWidth: 200, ellipsis: true, slots: { default: 'originUrlSlot' } }, // 原始地址列
    { title: '来源', field: 'source', minWidth: 160, ellipsis: true, slots: { default: 'sourceSlot' } }, // 来源列
    {
      title: '创建时间',
      field: 'createTime',
      width: 150,
      ellipsis: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue)
      }
    },
    {
      title: '修改时间',
      field: 'updateTime',
      width: 150,
      ellipsis: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue)
      }
    },
  ]

  const operationColumn = {
    title: '操作',
    fixed: 'right' as const,
    width: 'auto',
    field: 'operation',
    slots: { default: 'operationDefaultSlot' }
  }

  return {
    ...commonGridOptions,
    maxHeight: maxHeight.value,
    rowConfig: {
      keyField: 'id'
    },
    checkboxConfig: {
      reserve: true
    },
    columns: [
      ...baseColumns,
      ...(isAdmin.value ? adminOnlyColumns : []),
      operationColumn
    ]
  }
})

const { height } = useWindowSize()
const maxHeight = ref(null)
// 跟踪鼠标位置用于拖拽气泡
const { x: mouseX, y: mouseY } = useMouse({ touch: false })

watchEffect(() => {
  maxHeight.value = height.value - 200
})

const dataSource = ref([])
const loading = ref(false)
const open = ref(false)
const title = ref('')
const ids = ref<string[]>([])
// 拖拽状态（拖素材 -> 文件夹）
const dragState = reactive({
  dragging: false,
  draggingIds: [] as string[],
  overFolderId: null as string | null,
  overFolderPath: ''
})
const materialDragSortable = ref<Sortable | null>(null)
const dragHint = reactive({
  visible: false,
  text: '',
  x: -9999,
  y: -9999
})
const dragHintListenerBound = ref(false)

function bindGlobalDragHint() {
  if (dragHintListenerBound.value) return
  window.addEventListener('dragover', handleGlobalDragOver)
  dragHintListenerBound.value = true
}

function unbindGlobalDragHint() {
  if (!dragHintListenerBound.value) return
  window.removeEventListener('dragover', handleGlobalDragOver)
  dragHintListenerBound.value = false
}

function handleGlobalDragOver(e: DragEvent) {
  if (!dragState.dragging) return
  // 仅在悬停文件夹时显示气泡
  if (!dragState.overFolderId) return
  dragHint.visible = true
  dragHint.text = `将 ${dragState.draggingIds.length} 个素材移动到 ${dragState.overFolderPath || '该文件夹'}`
  updateDragHintPosition(e)
}

function updateDragHintPosition(e?: DragEvent) {
  const x = e && 'clientX' in e ? e.clientX : mouseX.value
  const y = e && 'clientY' in e ? e.clientY : mouseY.value
  dragHint.x = (x || 0) + 14
  dragHint.y = (y || 0) + 16
}

function getDefaultDragHint() {
  return `拖到左侧文件夹以移动（当前 ${dragState.draggingIds.length} 个）`
}

function hideDragHint() {
  dragHint.visible = false
  dragHint.text = ''
  dragHint.x = -9999
  dragHint.y = -9999
  unbindGlobalDragHint()
}

function materialRowClassName({ row }: any) {
  if (dragState.dragging && dragState.draggingIds.includes(String(row.id))) {
    return 'is-dragging-row'
  }
  return ''
}
const single = ref(false)
const multiple = ref(true)
const total = ref(0)
const formRef = ref()
const dialogTitle = ref('')
const dialogVisible = ref(false)
const isEdit = ref(true)
const currentRow = ref()
const submitLoading = ref(false)

const rules = {
  name: [{ required: true, message: '', trigger: 'blur' }]
}

const editDialogVisible = ref(false)
const editForm = ref({
  id: '',
  name: '',
  nameEn: '',
  description: '',
  descriptionEn: '',
  keywords: '',
  keywordsEn: '',
  group: '',
  suitableFor: '',
  suffix: '',
  isCustom: false,
  isPublic: false,
  isTexture: false,
  isInfringement: false,
  isCutout: false,
  originUrl: '',
  source: '',
  folderId: null, // 文件夹ID
  folderPath: '', // 展示用路径
  // 只读字段（用于显示）
  width: null,
  height: null,
  aspectRatio: null,
  fileSize: null,
  colorPalette: '',
  phash: ''
})
const editLoading = ref(false)

// 其他缺少的变量
const currentUploadInfo = ref({ path: '', folderId: null as string | null, folderPath: '', folder: '' })
const currentGenPictureConfig = ref([])
const genPicturesForm = ref({})
const genPicturesFormRules = ref({})
const genPicturesModalVisible = ref(false)

// 图片预览相关状态
const imagePreviewVisible = ref(false)
const currentImageUrl = ref('')

// SVG转PNG相关状态
const svgToPngDialogVisible = ref(false)
const currentSvgRow = ref<any>(null)
const svgToPngForm = ref({
  width: 512,
  height: 512,
  originalWidth: 512,
  originalHeight: 512,
  aspectRatio: 1
})

// 尺寸预设
const sizePresets = ref([
  { name: '小图标', width: 64 },
  { name: '中图标', width: 128 },
  { name: '大图标', width: 256 },
  { name: '标准', width: 512 },
  { name: '高清', width: 1024 },
  { name: '超高清', width: 2048 },
  { name: '常用', width: 800 },
  { name: '中等', width: 1200 },
  { name: '大图', width: 1600 },
  { name: '超大', width: 2400 }
])

const filterDialogVisible = ref(false)
const isMobile = ref(false)
// 不再需要折叠状态，所有搜索字段始终显示

// PS 套图制作
const psdSetDialogVisible = ref(false)
const psdSetTemplates = ref<any[]>([])
const psdSetTemplatesLoading = ref(false)
const selectedPsdTemplateIds = ref<string[]>([])
// PSD模板文件夹相关
const psdFolderTreeRef = ref()
const selectedPsdFolderId = ref<string | null>('__root__')
const psdFolderTreeData = ref<any[]>([])

// PSD模板分页相关
const psdSetTemplatePageParams = reactive({
  currentPage: 1,
  pageSize: 12,
  total: 0
})

// 批量详细配置相关状态
const batchDetailConfigDialogVisible = ref(false)
const templateConfigList = ref<Array<{
  id: string
  name: string
  thumbnail?: string
  psdInfo: any
  originalPsdInfo: any
  configText: string
  psdTemplateConfig?: any
  materialId?: string | number // 关联的素材ID
}>>([])
const psdSetSubmitting = ref(false)
const psdSetMergeSticker = ref(false)
const psdSetTemplateSearchText = ref('')

// PSD模板详情弹窗
const psdTemplateDetailDialogVisible = ref(false)
const currentPsdTemplate = ref<any>(null)

// 直接使用后端返回的模板列表（后端已过滤）
const filteredPsdSetTemplates = computed(() => {
  return psdSetTemplates.value
})

// 判断是否所有可见模板都已选中
const isAllPsdTemplatesSelected = computed(() => {
  if (!filteredPsdSetTemplates.value.length) return false
  return filteredPsdSetTemplates.value.every(tpl =>
    selectedPsdTemplateIds.value.includes(String(tpl.id))
  )
})



const psdSetTaskCount = computed(() =>
  psdSetMergeSticker.value
    ? selectedPsdTemplateIds.value.length
    : ids.value.length * selectedPsdTemplateIds.value.length,
)

// PSD制作套图允许的图片格式（固定为这三个）
const psdSetAllowedFormats = ['jpg', 'png', 'jpeg', 'svg', 'webp']

// 获取当前选中PSD模板的允许格式
const allowedFormatsForSelectedTemplates = computed(() => {
  // 固定返回允许的格式列表
  return psdSetAllowedFormats
})

// 检查是否有不符合格式的素材
const hasInvalidFormatMaterials = computed(() => {
  if (!ids.value.length) return false

  const allowedFormatsSet = new Set(psdSetAllowedFormats)

  return ids.value.some(id => {
    const material = dataSource.value.find(item => String(item.id) === String(id))
    if (!material) return false

    const materialSuffix = (material.suffix || '').toLowerCase().replace(/^\./, '')
    if (!materialSuffix) return true // 没有后缀视为无效

    return !allowedFormatsSet.has(materialSuffix)
  })
})

// 获取不符合格式的素材列表（用于提示）
const invalidFormatMaterialsList = computed(() => {
  const allowedFormatsSet = new Set(psdSetAllowedFormats)
  const invalidList: Array<{ name: string, suffix: string }> = []

  ids.value.forEach(id => {
    const material = dataSource.value.find(item => String(item.id) === String(id))
    if (!material) return

    const materialSuffix = (material.suffix || '').toLowerCase().replace(/^\./, '')
    if (!materialSuffix || !allowedFormatsSet.has(materialSuffix)) {
      invalidList.push({
        name: material.name || `ID: ${material.id}`,
        suffix: materialSuffix || '未知格式'
      })
    }
  })

  return invalidList
})



// 处理上传

const uploadModalVisible = ref(false)

function uploadModalClose() {
  // 关闭时更新 currentUploadInfo，确保下次打开时使用当前选中的文件夹
  currentUploadInfo.value = {
    path: '',
    folderId: selectedStickerFolderId.value === '__root__' ? null : selectedStickerFolderId.value,
    folderPath: selectedStickerFolderPath.value || '',
    folder: selectedStickerFolderPath.value || ''
  }
}

// 打开上传对话框时，更新当前上传信息
watch(uploadModalVisible, (visible) => {
  if (visible) {
    currentUploadInfo.value = {
      path: '',
      folderId: selectedStickerFolderId.value === '__root__' ? null : selectedStickerFolderId.value,
      folderPath: selectedStickerFolderPath.value || '',
      folder: selectedStickerFolderPath.value || ''
    }
  }
})

async function getList() {
  loading.value = true
  // 清理旧的超时定时器
  imageLoadTimeouts.forEach((timeout) => {
    clearTimeout(timeout)
  })
  imageLoadTimeouts.clear()
  // 立即清空旧数据，确保旧图片被销毁
  dataSource.value = []

  // 构建查询参数，确保 suffix 和 sizeShape 数组格式正确传递
  const params = {
    ...queryParams,
    // 如果 suffix 是空数组，传递空数组；如果是旧格式字符串，转换为数组
    suffix: Array.isArray(queryParams.suffix) ? queryParams.suffix : (queryParams.suffix ? [queryParams.suffix] : []),
    // 如果 sizeShape 是空数组，传递空数组；如果是旧格式字符串，转换为数组
    sizeShape: Array.isArray(queryParams.sizeShape) ? queryParams.sizeShape : (queryParams.sizeShape ? [queryParams.sizeShape] : [])
  }

  let res = await getMaterialList(params).finally(() => {
    loading.value = false
  })
  // 将后端返回的宽高/比例信息映射到列表行数据，便于展示
  dataSource.value = (res.list || []).map((item) => {
    const width = item.width
    const height = item.height
    const aspectRatio = item.aspectRatio || (width && height ? width / height : undefined)

    return {
      ...item,
      resolutionWidth: width ?? item.resolutionWidth,
      resolutionHeight: height ?? item.resolutionHeight,
      aspectRatio,
      _imageLoaded: false // 重置图片加载状态，确保分页切换时显示加载提示
    }
  })
  total.value = res.total

  // 为每个图片设置加载超时，防止一直显示加载中
  dataSource.value.forEach((item) => {
    setupImageLoadTimeout(item)
  })

  // 列表渲染完成后挂载拖拽（使用 SortableJS）
  nextTick(setupMaterialDrag)
}

// 初始化/刷新素材行的拖拽能力
function setupMaterialDrag() {
  nextTick(() => {
    const tbody = document.querySelector('.material-dnd-grid .vxe-table--body tbody') as HTMLElement | null
    if (!tbody) return

    // 销毁旧实例，避免重复绑定
    materialDragSortable.value?.destroy()
    materialDragSortable.value = Sortable.create(tbody, {
      animation: 120,
      sort: false, // 不改变表格排序，只做拖拽数据
      ghostClass: 'material-drag-ghost',
      onStart: (evt) => {
        const row = dataSource.value[evt.oldIndex]
        const draggingIds = ids.value.length ? [...ids.value] : row ? [String(row.id)] : []
        dragState.draggingIds = draggingIds
        dragState.dragging = draggingIds.length > 0
        // 仅当悬停在文件夹上时才显示气泡
        dragHint.visible = false
        dragHint.text = ''
        dragHint.x = -9999
        dragHint.y = -9999
        dragState.overFolderId = null
        dragState.overFolderPath = ''
        bindGlobalDragHint()
        // 记录初始指针位置
        if (evt.originalEvent && 'clientX' in evt.originalEvent) {
          updateDragHintPosition(evt.originalEvent as DragEvent)
        }
      },
      onEnd: () => {
        dragState.dragging = false
        dragState.draggingIds = []
        dragState.overFolderId = null
        dragState.overFolderPath = ''
        hideDragHint()
      }
    })
  })
}

// 图片加载超时处理映射
const imageLoadTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

// 设置图片加载超时
function setupImageLoadTimeout(row: any) {
  const timeoutKey = `image-${row.id}-${row.url}`

  // 清除之前的超时（如果存在）
  if (imageLoadTimeouts.has(timeoutKey)) {
    clearTimeout(imageLoadTimeouts.get(timeoutKey))
  }

  // 设置5秒超时，如果图片还没加载完成，强制标记为已加载
  const timeout = setTimeout(() => {
    if (!row._imageLoaded) {
      row._imageLoaded = true
      imageLoadTimeouts.delete(timeoutKey)
    }
  }, 5000)

  imageLoadTimeouts.set(timeoutKey, timeout)
}

// 处理图片加载成功
function handleImageLoad(row: any, event: Event) {
  const timeoutKey = `image-${row.id}-${row.url}`

  // 清除超时定时器
  if (imageLoadTimeouts.has(timeoutKey)) {
    clearTimeout(imageLoadTimeouts.get(timeoutKey))
    imageLoadTimeouts.delete(timeoutKey)
  }

  // 检查图片是否真的加载完成（可能因为缓存等原因已经加载）
  const img = event.target as HTMLImageElement
  if (img.complete && img.naturalHeight !== 0) {
    row._imageLoaded = true
  } else {
    // 如果图片还没完全加载，等待一下
    setTimeout(() => {
      row._imageLoaded = true
    }, 100)
  }
}

// 处理图片加载失败
function handleImageError(row: any) {
  const timeoutKey = `image-${row.id}-${row.url}`

  // 清除超时定时器
  if (imageLoadTimeouts.has(timeoutKey)) {
    clearTimeout(imageLoadTimeouts.get(timeoutKey))
    imageLoadTimeouts.delete(timeoutKey)
  }

  // 即使加载失败，也标记为已加载，避免一直显示加载中
  row._imageLoaded = true
}

// 组件卸载时清理所有超时定时器
onUnmounted(() => {
  imageLoadTimeouts.forEach((timeout) => {
    clearTimeout(timeout)
  })
  imageLoadTimeouts.clear()
  materialDragSortable.value?.destroy()
  unbindGlobalDragHint()
})

// phash相似图片搜索
async function handlePhashSearch() {
  // 去除phash值的前后空格
  queryParams.phash = queryParams.phash.trim()

  if (!queryParams.phash) {
    ElMessage.warning('请输入phash值或图片地址')
    return
  }

  // 重置页码
  queryParams.currentPage = 1
  // 调用现有的getList函数，它会自动检测phash参数并调用相似度搜索
  await getList()
}

// phash输入框失去焦点时自动trim
function onPhashInputBlur() {
  queryParams.phash = queryParams.phash.trim()
}

// 清空phash搜索
function clearPhashSearch() {
  queryParams.phash = ''
  queryParams.currentPage = 1
  getList()
}

// 文件夹相关状态
const folderTreeCollapsed = useLocalStorage('material_folder_collapsed', false)
const stickerFolderTreeRef = ref()
const selectedStickerFolderId = ref<string | null>('__all__') // 默认选中全部
const selectedStickerFolderPath = ref('')
const stickerFolderTreeData = ref<any[]>([])

// 文件夹选择选项（用于下拉框）
const stickerFolderSelectOptions = computed(() => {
  const options: Array<{ label: string; value: string | null; path: string }> = [
    { label: '根目录', value: null, path: '' }
  ]

  // 递归构建文件夹选项
  const buildOptions = (folders: any[], prefix = '') => {
    folders.forEach(folder => {
      const label = prefix ? `${prefix} / ${folder.name}` : folder.name
      options.push({
        label,
        value: folder.id,
        path: folder.path || ''
      })
      if (folder.children && folder.children.length > 0) {
        buildOptions(folder.children, label)
      }
    })
  }

  // 从根目录节点的 children 中构建选项
  if (stickerFolderTreeData.value.length > 0 && stickerFolderTreeData.value[0].children) {
    buildOptions(stickerFolderTreeData.value[0].children)
  }

  return options
})

// 加载文件夹树
async function loadStickerFolderTree() {
  try {
    // 不传 parentId，确保只获取根文件夹
    const res = await getStickerFolderTree()
    // 确保只显示根文件夹（parentId 为 null 的文件夹）
    const rootFolders = (res || []).filter((folder: any) => folder.parentId === null || folder.parentId === undefined)

    // 创建"全部"节点
    const allNode = {
      id: '__all__',
      name: '全部',
      path: '',
      parentId: null,
      children: [] as any[],
      isAll: true
    }

    const rootNode = {
      id: '__root__',
      name: '未分类',
      path: '',
      parentId: null,
      children: [] as any[],
      stickerCount: 0
    }

    // 创建根目录节点，放在最上方
    stickerFolderTreeData.value = [allNode, rootNode, ...rootFolders]

    // 确保根目录节点被选中
    nextTick(() => {
      if (stickerFolderTreeRef.value && !selectedStickerFolderId.value) {
        selectedStickerFolderId.value = '__all__' // Default to All? Or Root? Let's Default to Root as before for compatibility, or All? User asked "how to view all".
        // Let's default to __root__ for now, or ensure selection logic is consistent.
        if (selectedStickerFolderId.value === '__all__') {
          stickerFolderTreeRef.value.setCurrentKey('__all__')
        } else {
          stickerFolderTreeRef.value.setCurrentKey('__root__')
        }
      }
    })
  } catch (error) {
    console.error('加载文件夹失败:', error)
    ElMessage.error('加载文件夹失败')
  }
}

// 文件夹节点点击
function handleStickerFolderNodeClick(data: any) {
  if (data.id === '__all__') {
    selectedStickerFolderId.value = '__all__'
    selectedStickerFolderPath.value = ''
    queryParams.folderId = undefined as any
  } else if (data.id === '__root__') {
    // 如果是根目录节点
    selectedStickerFolderId.value = '__root__'
    selectedStickerFolderPath.value = ''
    queryParams.folderId = 'root' // 使用 'root' 代表未分类（根目录）
  } else {
    selectedStickerFolderId.value = data.id
    selectedStickerFolderPath.value = data.path || ''
    queryParams.folderId = data.id || null
  }
  queryParams.currentPage = 1
  getList()
}

// 选择根目录（保留此函数以防其他地方调用）
function handleSelectRootStickerFolder() {
  selectedStickerFolderId.value = '__root__'
  selectedStickerFolderPath.value = ''
  queryParams.folderId = null
  queryParams.currentPage = 1
  getList()
  // 设置树节点选中状态
  if (stickerFolderTreeRef.value) {
    stickerFolderTreeRef.value.setCurrentKey('__root__')
  }
}

// 拖拽到文件夹时的交互
function handleFolderDragOver(data: any, evt?: DragEvent) {
  if (!dragState.dragging) return
  if (data.id === '__all__') return // Prevent drop on All
  dragState.overFolderId = data.id
  dragState.overFolderPath = data.path || ''
  dragHint.visible = true
  dragHint.text = `将 ${dragState.draggingIds.length} 个素材移动到 ${dragState.overFolderPath || '该文件夹'}`
  // 同步指针位置（node 层级的 dragover 事件）
  updateDragHintPosition(evt)
}

function handleFolderDragLeave(data: any) {
  if (dragState.overFolderId === data.id) {
    dragState.overFolderId = null
    dragState.overFolderPath = ''
    dragHint.text = getDefaultDragHint()
    dragHint.visible = false
    dragHint.x = -9999
    dragHint.y = -9999
  }
}

async function handleFolderDrop(data: any) {
  if (!dragState.draggingIds.length) return

  const targetFolderId = data.id === '__root__' ? null : data.id
  const targetPath = data.path || ''
  const movingIds = [...dragState.draggingIds]

  try {
    await batchMoveStickers({ ids: movingIds, folderId: targetFolderId })
    ElMessage.success(`已移动 ${movingIds.length} 个素材到 ${targetPath || '根目录'}`)

    // Stay in current folder, just refresh tree and list
    await loadStickerFolderTree() // 确保右侧数量与树同步刷新
    await getList()
    resetCheckStatus(ids)
  } catch (error) {
    ElMessage.error((error as Error).message || '移动失败')
  } finally {
    hideDragHint()
    dragState.dragging = false
    dragState.draggingIds = []
    dragState.overFolderId = null
    dragState.overFolderPath = ''
  }
}

// 创建根文件夹
async function handleCreateRootStickerFolder() {
  try {
    const { value } = await ElMessageBox.prompt('请输入文件夹名称', '新建文件夹', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^[^/\\?*<>|"]+$/,
      inputErrorMessage: '文件夹名称不能包含特殊字符：/ \\ ? * < > | "',
    })

    await createStickerFolder({ name: value, parentId: null })
    ElMessage.success('创建成功')
    await loadStickerFolderTree()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error((error as Error).message || '创建失败')
    }
  }
}

// 文件夹操作命令
async function handleStickerFolderCommand(command: string, data: any) {
  switch (command) {
    case 'create':
      await handleCreateChildStickerFolder(data)
      break
    case 'rename':
      await handleRenameStickerFolder(data)
      break
    case 'delete':
      await handleDeleteStickerFolder(data)
      break
  }
}

// 创建子文件夹
async function handleCreateChildStickerFolder(parent: any) {
  try {
    const { value } = await ElMessageBox.prompt('请输入文件夹名称', '新建子文件夹', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^[^/\\?*<>|"]+$/,
      inputErrorMessage: '文件夹名称不能包含特殊字符：/ \\ ? * < > | "',
    })

    await createStickerFolder({ name: value, parentId: parent.id })
    ElMessage.success('创建成功')
    await loadStickerFolderTree()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error((error as Error).message || '创建失败')
    }
  }
}

// 重命名文件夹
async function handleRenameStickerFolder(data: any) {
  try {
    const { value } = await ElMessageBox.prompt('请输入新名称', '重命名文件夹', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: data.name,
      inputPattern: /^[^/\\?*<>|"]+$/,
      inputErrorMessage: '文件夹名称不能包含特殊字符：/ \\ ? * < > | "',
    })

    await renameStickerFolder({ id: data.id, name: value })
    ElMessage.success('重命名成功')
    await loadStickerFolderTree()

    // 如果当前选中的文件夹被重命名，需要更新查询参数
    if (selectedStickerFolderId.value === data.id) {
      // 重新加载文件夹树后，找到新的文件夹信息
      const findFolder = (folders: any[], targetId: string): any => {
        for (const folder of folders) {
          if (folder.id === targetId) {
            return folder
          }
          if (folder.children && folder.children.length > 0) {
            const found = findFolder(folder.children, targetId)
            if (found) return found
          }
        }
        return null
      }

      // 从根目录节点的 children 中查找
      const rootNode = stickerFolderTreeData.value[0]
      const updatedFolder = findFolder(rootNode.children || [], data.id)
      if (updatedFolder && updatedFolder.path) {
        selectedStickerFolderPath.value = updatedFolder.path

        getList()
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error((error as Error).message || '重命名失败')
    }
  }
}

// 删除文件夹
async function handleDeleteStickerFolder(data: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件夹"${data.name}"吗？${data.stickerCount > 0 ? `文件夹下有 ${data.stickerCount} 个素材，删除后素材将移动到根目录。` : ''}`,
      '删除文件夹',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await deleteStickerFolder(data.id, true)
    ElMessage.success('删除成功')

    // 如果删除的是当前选中的文件夹，切换到根目录
    if (selectedStickerFolderId.value === data.id) {
      selectedStickerFolderId.value = '__root__'
      selectedStickerFolderPath.value = ''
      queryParams.folderId = null
      queryParams.currentPage = 1
      getList()
      if (stickerFolderTreeRef.value) {
        stickerFolderTreeRef.value.setCurrentKey('__root__')
      }
    }

    await loadStickerFolderTree()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error((error as Error).message || '删除失败')
    }
  }
}

// 文件夹变更时，同步更新上传信息
watch(selectedStickerFolderPath, (newPath) => {
  currentUploadInfo.value = {
    ...currentUploadInfo.value,
    folderPath: newPath || '',
    folder: newPath || '',
    folderId: selectedStickerFolderId.value === '__root__' ? null : selectedStickerFolderId.value
  }
})

// 初始化时加载文件夹树
loadStickerFolderTree()

getList()

// 批量移动素材到文件夹
async function handleBatchMoveToFolder() {
  if (!ids.value.length) {
    return ElMessage.warning('请选择要移动的素材')
  }

  try {
    const targetFolderId = selectedStickerFolderId.value === '__root__' ? null : selectedStickerFolderId.value
    const targetFolderPath = selectedStickerFolderPath.value || ''

    await batchMoveStickers({ ids: ids.value, folderId: targetFolderId })
    ElMessage.success(`成功移动 ${ids.value.length} 个素材${targetFolderPath ? `到 ${targetFolderPath}` : '到根目录'}`)
    getList()
    ids.value = []
    resetCheckStatus(ids)
  } catch (error) {
    ElMessage.error((error as Error).message || '移动失败')
  }
}

getList()

// 操作函数
function handleQuery() {
  queryParams.currentPage = 1
}

function resetQuery() {
  getList()
}

// 移动端筛选提交
function onMobileFilterSubmit() {
  filterDialogVisible.value = false
  getList()
}

// 下载
function handleMultiDownload() {
  if (!ids.value.length) {
    return ElMessage.warning('请选择要下载的数据')
  }

  // 处理图片下载
  try {
    ids.value.forEach(async (id, index) => {
      let row = dataSource.value.find((item) => {
        return item.id == id
      })

      if (!row) {
        return
      }
      setTimeout(async () => {
        try {
          const downloadUrl = row.url || row.ossObjectName
          const fileName = row.name || row.imageName || `image_${id}.jpg`

          if (!downloadUrl) {
            ElMessage.error(`图片 ${fileName} 下载失败：缺少下载链接`)
            return
          }

          // 使用新的下载函数，确保文件被下载而不是打开新页面
          await downloadImage(downloadUrl, fileName)
          ElNotification.success(`图片 ${fileName} 下载成功`)
        } catch (error) {
          console.error('下载失败:', error)
          ElMessage.error(`图片下载失败：${error.message}`)
        }
      }, 500 * index)
    })
  } catch (e) {
    console.error('批量下载失败:', e)
    ElMessage.error('批量下载失败')
  }
}

function handleDelete(row?) {
  let delIds: any = null
  if (row) {
    delIds = [row.id]
  } else {
    delIds = Array.isArray(ids.value) ? [...ids.value] : []
    if (!delIds.length) {
      return ElMessage.warning('请选择要删除的数据')
    }
  }

  ElMessageBox.confirm('确认删除该数据吗', '删除提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'error'
  })
    .then(async () => {
      delIds = delIds.map((id) => String(id))
      await deleteAssetLibrary({ ids: delIds })
      ElNotification.success('删除成功')
      resetCheckStatus(ids)
      getList()
    })
    .catch(() => { })
}
function checkboxChange(e) {
  const records = Array.isArray(e.records) ? e.records : []
  const reserves = Array.isArray(e.reserves) ? e.reserves : []
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)]
}

function checkboxAllChange(e) {
  const records = Array.isArray(e.records) ? e.records : []
  const reserves = Array.isArray(e.reserves) ? e.reserves : []
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)]
}

async function handleDownload(row) {
  // 处理图片下载
  try {
    const downloadUrl = row.url || row.ossObjectName
    const fileName = row.name || row.imageName || `image_${row.id}.jpg`

    if (!downloadUrl) {
      ElMessage.error(`图片 ${fileName} 下载失败：缺少下载链接`)
      return
    }

    // 使用新的下载函数，确保文件被下载而不是打开新页面
    await downloadImage(downloadUrl, fileName)
    ElNotification.success(`图片 ${fileName} 下载成功`)
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error(`图片下载失败：${error.message}`)
  }
}

// 复制单个素材
async function handleCopy(row) {
  try {
    const res = await copyStickers({ ids: String(row.id) })
    const count = Array.isArray(res?.list) ? res.list.length : 1
    ElMessage.success(`复制成功 ${count} 条`)
    getList()
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

// 生成无空白PNG（仅对 png 后缀显示）
async function handleTrimPng(row) {
  if ((row.suffix || '').toLowerCase() !== 'png') {
    ElMessage.warning('仅支持 PNG 图片');
    return;
  }
  try {
    const res = await trimPng({ id: String(row.id) })
    if (res && res.id) {
      ElMessage.success('生成成功');
    } else {
      ElMessage.success('生成成功');
    }
    getList()
  } catch (e) {
    ElMessage.error('生成失败')
  }
}

// SVG转PNG（仅对 svg 后缀显示）
async function handleSvgToPng(row) {
  if ((row.suffix || '').toLowerCase() !== 'svg') {
    ElMessage.warning('仅支持 SVG 图片');
    return;
  }

  // 获取SVG原始尺寸
  try {
    const svgDimensions = await getSvgDimensions(row.url)
    if (svgDimensions) {
      svgToPngForm.value.originalWidth = (svgDimensions as any).width
      svgToPngForm.value.originalHeight = (svgDimensions as any).height
      svgToPngForm.value.aspectRatio = (svgDimensions as any).width / (svgDimensions as any).height

      // 根据原始比例设置默认尺寸
      const baseSize = 512
      if (svgToPngForm.value.aspectRatio > 1) {
        // 宽度大于高度
        svgToPngForm.value.width = baseSize
        svgToPngForm.value.height = Math.round(baseSize / svgToPngForm.value.aspectRatio)
      } else {
        // 高度大于等于宽度
        svgToPngForm.value.height = baseSize
        svgToPngForm.value.width = Math.round(baseSize * svgToPngForm.value.aspectRatio)
      }
    }
  } catch (error) {
    console.warn('获取SVG尺寸失败:', error)
    // 如果获取失败，使用默认值
    svgToPngForm.value.originalWidth = 512
    svgToPngForm.value.originalHeight = 512
    svgToPngForm.value.aspectRatio = 1
    svgToPngForm.value.width = 512
    svgToPngForm.value.height = 512
  }

  // 打开尺寸设置弹窗
  currentSvgRow.value = row
  svgToPngDialogVisible.value = true
}

// 获取SVG原始尺寸
async function getSvgDimensions(svgUrl) {
  return new Promise((resolve) => {
    const img = new Image()

    img.onload = function () {
      const naturalWidth = (this as HTMLImageElement).naturalWidth
      const naturalHeight = (this as HTMLImageElement).naturalHeight

      console.log('SVG自然尺寸:', { naturalWidth, naturalHeight })

      // 如果naturalWidth和naturalHeight都是0或undefined，尝试解析SVG内容
      if (!naturalWidth || !naturalHeight || naturalWidth === 0 || naturalHeight === 0) {
        console.log('naturalWidth/naturalHeight无效，尝试解析SVG内容')
        parseSvgContent(svgUrl).then(resolve)
      } else {
        resolve({ width: naturalWidth, height: naturalHeight })
      }
    }

    img.onerror = function () {
      console.log('图片加载失败，尝试解析SVG内容')
      parseSvgContent(svgUrl).then(resolve)
    }

    // 设置crossOrigin以支持跨域
    img.crossOrigin = 'anonymous'
    img.src = svgUrl
  })
}

// 解析SVG内容的备用方法
async function parseSvgContent(svgUrl) {
  try {
    const response = await fetch(svgUrl)
    const svgText = await response.text()

    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')
    const svgElement = svgDoc.querySelector('svg')

    if (!svgElement) return { width: 512, height: 512 }

    let width, height

    // 优先使用viewBox
    const viewBox = svgElement.getAttribute('viewBox')
    if (viewBox) {
      const parts = viewBox.split(/\s+/)
      if (parts.length >= 4) {
        width = parseFloat(parts[2])
        height = parseFloat(parts[3])
      }
    }

    // 如果没有viewBox，使用width和height属性
    if (!width || !height) {
      width = parseFloat(svgElement.getAttribute('width')) || 512
      height = parseFloat(svgElement.getAttribute('height')) || 512
    }

    console.log('SVG解析尺寸:', { width, height })
    return { width, height }
  } catch (error) {
    console.error('解析SVG失败:', error)
    return { width: 512, height: 512 }
  }
}

// 确认SVG转PNG
async function confirmSvgToPng() {
  if (!currentSvgRow.value?.id) return

  try {
    ElMessage.info('正在转换SVG为PNG，请稍候...');
    const res = await svgToPng({
      id: String(currentSvgRow.value.id),
      width: svgToPngForm.value.width,
      height: svgToPngForm.value.height
    })
    if (res && res.id) {
      ElMessage.success('SVG转PNG成功');
    } else {
      ElMessage.success('SVG转PNG成功');
    }
    svgToPngDialogVisible.value = false
    getList()
  } catch (e) {
    ElMessage.error('SVG转PNG失败')
  }
}


async function openPsdSetDialog(mergeMode?: boolean | any) {
  // 如果传入的是对象(row),则是从表格行点击的,默认使用单素材模式
  if (mergeMode && typeof mergeMode === 'object') {
    ids.value = [mergeMode.id]
    psdSetMergeSticker.value = false
  } else {
    // 如果是布尔值,则是从按钮点击的,使用传入的模式
    if (!ids.value.length) {
      ElMessage.warning('请选择要制作的素材')
      return
    }
    psdSetMergeSticker.value = mergeMode === true
  }
  // 打开弹窗时重置分页
  psdSetTemplatePageParams.currentPage = 1
  psdSetDialogVisible.value = true
  // 加载PSD模板文件夹
  loadPsdFolderTree()
  await loadPsdTemplatesForPsdSet()
}











// 处理PSD模板缩略图加载错误
function handleTemplateImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// 打开PSD模板详情
function openTemplateDetail(template: any) {
  currentPsdTemplate.value = template
  psdTemplateDetailDialogVisible.value = true
}

// 获取素材图片URL
function getMaterialImageUrl(materialId: string | number): string {
  const material = dataSource.value.find(item => String(item.id) === String(materialId))
  if (!material || !material.url) return ''
  return getPreviewImageUrl(material.url, { width: 200, quality: 80, format: 'webp' })
}

// 获取与配置项匹配的素材ID
function getMatchedMaterialId(configIndex: number): string | number | null {
  const config = templateConfigList.value[configIndex]
  if (!config) return null

  // 如果配置项有关联的素材ID（单素材模式），直接返回
  if (config.materialId !== undefined) {
    return config.materialId
  }

  // 合并模式：显示第一个素材作为参考（实际上所有素材都会合并）
  if (ids.value.length > 0) {
    return ids.value[0]
  }

  return null
}

// 重置模板配置为默认
function handleResetConfigForTemplate(templateIndex: number) {
  const template = templateConfigList.value[templateIndex]
  ElMessageBox.confirm('确定要重置为默认配置吗？当前修改将丢失。', '重置确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      if (template.originalPsdInfo) {
        template.configText = JSON.stringify(template.originalPsdInfo, null, 2)
        template.psdInfo = JSON.parse(JSON.stringify(template.originalPsdInfo))
      } else {
        template.configText = ''
        template.psdInfo = null
      }
      ElMessage.success('已重置为默认配置')
    })
    .catch(() => { })
}

// 验证配置文本格式（在生成套图前调用）
function validateConfigTexts(): boolean {
  for (const template of templateConfigList.value) {
    if (!template.configText || !template.configText.trim()) {
      // 空配置也是允许的
      continue
    }

    try {
      JSON.parse(template.configText.trim())
    } catch (e) {
      ElMessage.warning(`模板"${template.name}"的配置JSON格式错误`)
      return false
    }
  }
  return true
}

// 保存配置到内存（暂存，不调用接口）
function handleSaveConfigToMemory() {
  // 验证所有配置文本的JSON格式
  let hasError = false
  for (const template of templateConfigList.value) {
    if (!template.configText || !template.configText.trim()) {
      // 空配置也是允许的
      continue
    }

    try {
      JSON.parse(template.configText.trim())
    } catch (e) {
      ElMessage.warning(`模板"${template.name}"的配置JSON格式错误，请修正后再保存`)
      hasError = true
      break
    }
  }

  if (hasError) {
    return
  }

  // 配置已暂存到内存中（templateConfigList），无需额外操作
  ElMessage.success('配置已保存（暂存），点击"开始制作"时将使用此配置')
  // 可以选择关闭弹窗，或者保持打开让用户继续编辑
  // batchDetailConfigDialogVisible.value = false
}

// PSD模板相关逻辑

// 重置状态
function resetPsdSetState() {
  selectedPsdTemplateIds.value = []
  psdSetMergeSticker.value = false
  psdSetTemplateSearchText.value = ''
  psdSetTemplatePageParams.currentPage = 1
  psdSetTemplatePageParams.total = 0
  psdSetTemplatePageParams.total = 0
  selectedPsdFolderId.value = '__all__'
}

// 加载PSD模板文件夹树
async function loadPsdFolderTree() {
  try {
    const res = await getStickerFolderTree({ folderCategory: 'psdtemplate' })
    const rootFolders = (res || []).filter((folder: any) => folder.parentId === null || folder.parentId === undefined)

    // 创建根目录节点
    // 创建"全部"节点
    const allNode = {
      id: '__all__',
      name: '全部',
      path: '',
      parentId: null,
      children: [],
      isRoot: true
    }

    const uncatNode = {
      id: '__root__',
      name: '未分类',
      path: '',
      parentId: null,
      children: [],
      isRoot: false
    }

    psdFolderTreeData.value = [allNode, uncatNode, ...rootFolders]

    nextTick(() => {
      if (psdFolderTreeRef.value && selectedPsdFolderId.value) {
        psdFolderTreeRef.value.setCurrentKey(selectedPsdFolderId.value)
      }
    })
  } catch (error) {
    console.error('加载PSD文件夹失败:', error)
  }
}

// PSD文件夹节点点击
function handlePsdFolderNodeClick(data: any) {
  if (data.id === '__all__') {
    selectedPsdFolderId.value = '__all__'
  } else if (data.id === '__root__') {
    selectedPsdFolderId.value = '__root__'
  } else {
    selectedPsdFolderId.value = data.id
  }
  psdSetTemplatePageParams.currentPage = 1
  loadPsdTemplatesForPsdSet()
}

// 加载PSD模板列表
async function loadPsdTemplatesForPsdSet() {
  psdSetTemplatesLoading.value = true
  try {
    const res = await psdTemplateApi.getPsdTemplatePage({
      currentPage: psdSetTemplatePageParams.currentPage,
      pageSize: psdSetTemplatePageParams.pageSize,
      searchKeyword: psdSetTemplateSearchText.value.trim() || undefined,
      enabled: true,
      folderId: selectedPsdFolderId.value === '__all__' ? undefined : (selectedPsdFolderId.value === '__root__' ? null : selectedPsdFolderId.value)
    })
    psdSetTemplates.value = res.list || []
    psdSetTemplatePageParams.total = res.total || 0
  } catch (error) {
    console.error('加载PSD模板失败:', error)
    ElMessage.error('加载PSD模板失败')
  } finally {
    psdSetTemplatesLoading.value = false
  }
}

// 切换选中状态
function togglePsdTemplate(templateId: string | number) {
  const id = String(templateId)
  const index = selectedPsdTemplateIds.value.indexOf(id)
  if (index > -1) {
    selectedPsdTemplateIds.value.splice(index, 1)
  } else {
    selectedPsdTemplateIds.value.push(id)
  }
}

// 搜索防抖
const debouncedSearchPsdTemplates = useDebounceFn(() => {
  if (psdSetDialogVisible.value) {
    psdSetTemplatePageParams.currentPage = 1
    loadPsdTemplatesForPsdSet()
  }
}, 500)

watch(psdSetTemplateSearchText, () => {
  if (psdSetDialogVisible.value) {
    debouncedSearchPsdTemplates()
  }
})

// 全选/取消全选
function handlePsdTemplateSelectAll() {
  if (isAllPsdTemplatesSelected.value) {
    filteredPsdSetTemplates.value.forEach(tpl => {
      const id = String(tpl.id)
      const index = selectedPsdTemplateIds.value.indexOf(id)
      if (index > -1) {
        selectedPsdTemplateIds.value.splice(index, 1)
      }
    })
  } else {
    filteredPsdSetTemplates.value.forEach(tpl => {
      const id = String(tpl.id)
      if (!selectedPsdTemplateIds.value.includes(id)) {
        selectedPsdTemplateIds.value.push(id)
      }
    })
  }
}

// 详细配置弹窗处理
function handlePsdTemplateDetailConfig() {
  if (!selectedPsdTemplateIds.value.length) {
    ElMessage.warning('请先选择PSD模板')
    return
  }

  const selectedTemplates = psdSetTemplates.value.filter(tpl =>
    selectedPsdTemplateIds.value.includes(String(tpl.id))
  )

  if (selectedTemplates.length === 0) {
    ElMessage.warning('未找到选中的模板数据')
    return
  }

  templateConfigList.value = []

  if (psdSetMergeSticker.value) {
    templateConfigList.value = selectedTemplates.map(template => {
      const templateConfig = template.psdTemplateConfig
      let psdInfoObj = null
      let configText = ''
      if (templateConfig) {
        try {
          psdInfoObj = typeof templateConfig === 'string' ? JSON.parse(templateConfig) : templateConfig
          configText = JSON.stringify(psdInfoObj, null, 2)
        } catch (e) {
          console.error('解析模板配置失败:', e)
          configText = typeof templateConfig === 'string' ? templateConfig : ''
        }
      }
      const originalPsdInfo = psdInfoObj ? JSON.parse(JSON.stringify(psdInfoObj)) : null

      return {
        id: String(template.id),
        name: template.name || '未命名模板',
        thumbnail: template.thumbnail || template.preview || template.image,
        psdInfo: psdInfoObj,
        originalPsdInfo,
        configText,
        materialId: undefined,
      }
    })
  } else {
    ids.value.forEach(materialId => {
      selectedTemplates.forEach(template => {
        const templateConfig = template.psdTemplateConfig
        let psdInfoObj = null
        let configText = ''
        if (templateConfig) {
          try {
            psdInfoObj = typeof templateConfig === 'string' ? JSON.parse(templateConfig) : templateConfig
            configText = JSON.stringify(psdInfoObj, null, 2)
          } catch (e) {
            console.error('解析模板配置失败:', e)
            configText = typeof templateConfig === 'string' ? templateConfig : ''
          }
        }
        const originalPsdInfo = psdInfoObj ? JSON.parse(JSON.stringify(psdInfoObj)) : null
        const material = dataSource.value.find(item => String(item.id) === String(materialId))
        const materialName = material?.name || `素材${materialId}`

        templateConfigList.value.push({
          id: `${template.id}_${materialId}`,
          name: `${materialName} × ${template.name || '未命名模板'}`,
          thumbnail: template.thumbnail || template.preview || template.image,
          psdInfo: psdInfoObj,
          originalPsdInfo,
          configText,
          materialId: materialId,
        })
      })
    })
  }

  batchDetailConfigDialogVisible.value = true
}

async function handleCreatePsdSets() {
  if (!ids.value.length) {
    return ElMessage.warning('请先勾选素材')
  }
  if (!selectedPsdTemplateIds.value.length) {
    return ElMessage.warning('请选择PSD模板')
  }

  // 检查图片格式是否符合要求
  const formatCheckResult = checkMaterialFormats()
  if (!formatCheckResult.valid) {
    ElMessage.warning(formatCheckResult.message)
    return
  }

  // 验证配置文本格式（如果有配置）
  if (templateConfigList.value.length > 0 && !validateConfigTexts()) {
    return
  }

  // 构建配置映射：将详细配置弹窗中的配置信息传递到后台
  const configMap: Record<string, any> = {}
  if (templateConfigList.value.length > 0) {
    templateConfigList.value.forEach(config => {
      let psdInfo = null
      if (config.configText && config.configText.trim()) {
        try {
          psdInfo = JSON.parse(config.configText.trim())
        } catch (e) {
          console.error('解析配置失败:', e)
        }
      }

      // 使用配置项的ID作为key（在单素材模式下是 templateId_materialId，在合并模式下是 templateId）
      configMap[config.id] = psdInfo
    })
  }

  psdSetSubmitting.value = true
  try {
    const res = await stickerPsdSetApi.batchCreate({
      stickerIds: ids.value.map((id) => String(id)),
      psdTemplateIds: [...selectedPsdTemplateIds.value],
      mergeSticker: psdSetMergeSticker.value,
      configMap: Object.keys(configMap).length > 0 ? configMap : undefined
    })
    const createdList = (res as any)?.list
    const createdCount = Array.isArray(createdList)
      ? createdList.length
      : (res as any)?.total ?? psdSetTaskCount.value

    // 如果后端返回“所有组合都已存在”，列表通常为空，此时提示为“无需重复创建”
    if (Array.isArray(createdList) && createdList.length === 0) {
      ElMessage.info((res as any)?.message || '所有组合都已存在，无需重复创建')
    } else {
      ElMessage.success(`成功创建 ${createdCount} 条套图任务`)
    }
    psdSetDialogVisible.value = false
    resetPsdSetState()
  } catch (error: any) {
    console.error('创建套图失败:', error)
    ElMessage.error(error?.message || '创建套图失败')
  } finally {
    psdSetSubmitting.value = false
  }
}

// 判断素材格式是否无效
function isMaterialFormatInvalid(materialId: string | number): boolean {
  const material = dataSource.value.find(item => String(item.id) === String(materialId))
  if (!material) return false

  const materialSuffix = (material.suffix || '').toLowerCase().replace(/^\./, '')
  if (!materialSuffix) return true // 没有后缀视为无效

  // 检查格式是否在允许列表中（jpg、png、jpeg）
  return !psdSetAllowedFormats.includes(materialSuffix)
}

// 获取素材的后缀
function getMaterialSuffix(materialId: string | number): string {
  const material = dataSource.value.find(item => String(item.id) === String(materialId))
  if (!material || !material.suffix) return ''
  return (material.suffix || '').toLowerCase().replace(/^\./, '')
}

// 检查素材格式是否符合PSD模板要求
function checkMaterialFormats() {
  // 使用固定的允许格式列表
  const allowedFormatsSet = new Set(psdSetAllowedFormats)

  // 检查所有选中素材的格式
  const invalidMaterials: Array<{ id: string | number, name: string, suffix: string }> = []

  ids.value.forEach(id => {
    const material = dataSource.value.find(item => String(item.id) === String(id))
    if (!material) return

    const materialSuffix = (material.suffix || '').toLowerCase().replace(/^\./, '')

    // 如果素材没有后缀，也视为无效
    if (!materialSuffix) {
      invalidMaterials.push({
        id: material.id,
        name: material.name || `ID: ${material.id}`,
        suffix: '未知格式'
      })
      return
    }

    // 检查格式是否在允许列表中
    if (!allowedFormatsSet.has(materialSuffix)) {
      invalidMaterials.push({
        id: material.id,
        name: material.name || `ID: ${material.id}`,
        suffix: materialSuffix
      })
    }
  })

  // 如果有不符合格式的素材，返回错误信息
  if (invalidMaterials.length > 0) {
    const allowedFormatsList = psdSetAllowedFormats.join('、')
    const invalidNames = invalidMaterials.slice(0, 5).map(m => `${m.name}(${m.suffix})`).join('、')
    const moreCount = invalidMaterials.length > 5 ? `等${invalidMaterials.length}个` : ''

    return {
      valid: false,
      message: `所选素材中包含不符合格式要求的图片。\n允许的格式：${allowedFormatsList}\n不符合的素材：${invalidNames}${moreCount}\n请移除不符合格式的素材后重试。`
    }
    return { valid: true, message: '' }
  }

  const delayUpdateList = useDebounceFn(() => {
    getList()
  }, 1999)

  function singleFileUploaded() {
    console.log('单个文件上传')
    delayUpdateList()
  }

  /**
   * @group
   */

  const aiGenDialogVisible = ref(false)
  const aiGenPrompt = ref('')
  const aiGenerateRawInfo = ref('')
  const aiGenDialogLoading = ref(false)
  let aiGenRow = null


  const aiTableLoading = ref<Record<string, boolean>>({})

  // meta相关变量
  const metaDialogVisible = ref(false)
  const metaDialogContent = ref('')
  const parsedMetaData = computed(() => {
    if (!metaDialogContent.value) return null
    try {
      // 尝试解析 JSON 字符串
      const parsed = JSON.parse(metaDialogContent.value)
      return parsed
    } catch (error) {
      // 如果解析失败，返回 null，显示原始内容
      return null
    }
  })

  function onAiTableAutoGenerate(row) {
    if (aiTableLoading.value[row.id]) return
    aiGenRow = row
    aiGenPrompt.value = ''
    aiGenerateRawInfo.value = ''
    aiGenDialogVisible.value = true
  }

  async function submitAiGenDialog() {
    if (!aiGenRow) return
    aiGenDialogLoading.value = true
    aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: true }
    try {
      await handleAiAutoGenerate(aiGenRow, () => {
        aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: false }
        aiGenDialogLoading.value = false
        aiGenDialogVisible.value = false
        aiGenRow = null
      }, aiGenPrompt.value, aiGenerateRawInfo.value)
    } catch (e) {
      aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: false }
      aiGenDialogLoading.value = false
      aiGenDialogVisible.value = false
      aiGenRow = null
    }
  }

  async function handleAiAutoGenerate(row, cb, prompt, aiGenerateRawInfo) {
    try {
      const res = await aiAutoGenerateMaterialInfo({
        id: row.id,
        prompt: prompt || '',
        aiGenerateRawInfo: aiGenerateRawInfo || ''
      })
      // 更新行数据 - 兼容不同的返回结构
      const resultData = res?.data || res
      if (resultData) {
        row.name = resultData.name || row.name
        row.nameEn = resultData.nameEn || row.nameEn
        row.description = resultData.description || row.description
        row.descriptionEn = resultData.descriptionEn || row.descriptionEn
        row.keywords = resultData.keywords || row.keywords
        row.keywordsEn = resultData.keywordsEn || row.keywordsEn
        // 更新侵权信息
        if (typeof resultData.isInfringement === 'boolean') {
          row.isInfringement = resultData.isInfringement
        }
        // 更新适用商品
        if (resultData.suitableFor) {
          row.suitableFor = resultData.suitableFor
        }
      }
      const infringementText = resultData?.isInfringement ? '（已标记为侵权）' : '（已标记为非侵权）'
      const suitableText = resultData?.suitableFor ? `，适用商品：${resultData.suitableFor}` : ''
      ElNotification.success(`AI自动生成内容成功${infringementText}${suitableText}`)
      if (typeof cb === 'function') cb()
      getList()
    } catch (e) {
      ElNotification.error('AI自动生成内容失败')
      if (typeof cb === 'function') cb()
    }
  }

  // 查找相似图：将当前行的 phash 带入搜索
  async function handleFindSimilar(row) {
    if (!row?.phash) {
      ElMessage.warning('该图片暂无 phash，请先生成后再搜索相似图');
      return;
    }
    queryParams.phash = (row.phash || '').trim();
    queryParams.currentPage = 1;
    // 精确匹配更快，行内查找优先用精确模式；可根据需要再切换
    queryParams.phashMode = 'exact';
    await getList();
  }



  // 处理宽度变化
  function handleWidthChange(value) {
    // 根据原始宽高比自动计算高度
    if (svgToPngForm.value.aspectRatio) {
      svgToPngForm.value.height = Math.round(value / svgToPngForm.value.aspectRatio)
    }
  }

  // 应用预设尺寸
  function applyPreset(preset) {
    // 设置宽度，高度会自动计算
    svgToPngForm.value.width = preset.width
    handleWidthChange(preset.width)
  }

  function handleEdit(row) {
    editForm.value = {
      id: row.id,
      name: row.name || '',
      nameEn: row.nameEn || '',
      description: row.description || '',
      descriptionEn: row.descriptionEn || '',
      keywords: row.keywords || '',
      keywordsEn: row.keywordsEn || '',
      group: row.group || '',
      suitableFor: row.suitableFor || '',
      suffix: row.suffix || '',
      isCustom: row.isCustom || false,
      isPublic: row.isPublic || false,
      isTexture: row.isTexture || false,
      isInfringement: row.isInfringement || false,
      isCutout: row.isCutout || false,
      originUrl: row.originUrl || '',
      source: row.source || '',
      folderId: row.folderId ?? row.folder?.id ?? null,
      folderPath: row.folder || row.folderEntity?.path || '',
      // 只读字段（用于显示）
      width: row.width || null,
      height: row.height || null,
      aspectRatio: row.aspectRatio || null,
      fileSize: row.fileSize || null,
      colorPalette: row.colorPalette || '',
      phash: row.phash || ''
    }
    editDialogVisible.value = true
  }

  async function submitEdit() {
    editLoading.value = true
    try {
      // 只提交可编辑的字段，排除只读字段
      const submitData = {
        id: editForm.value.id,
        name: editForm.value.name,
        nameEn: editForm.value.nameEn,
        description: editForm.value.description,
        descriptionEn: editForm.value.descriptionEn,
        keywords: editForm.value.keywords,
        keywordsEn: editForm.value.keywordsEn,
        group: editForm.value.group,
        suitableFor: editForm.value.suitableFor,
        suffix: editForm.value.suffix,
        isCustom: editForm.value.isCustom,
        isPublic: editForm.value.isPublic,
        isTexture: editForm.value.isTexture,
        isInfringement: editForm.value.isInfringement,
        isCutout: editForm.value.isCutout,
        originUrl: editForm.value.originUrl,
        source: editForm.value.source,
        folderId: editForm.value.folderId ?? null
      }
      await updateAssetLibrary(submitData)
      ElNotification.success('保存成功')
      editDialogVisible.value = false
      getList()
    } catch (e) {
      ElNotification.error('保存失败')
    } finally {
      editLoading.value = false
    }
  }

  // 图片预览相关方法
  function openImagePreview(imageUrl: string, imageName?: string) {
    currentImageUrl.value = imageUrl
    imagePreviewVisible.value = true
  }

  function closeImagePreview() {
    imagePreviewVisible.value = false
    currentImageUrl.value = ''
  }


  // 显示meta详情
  function showMetaDetail(meta: any) {
    if (!meta) {
      ElMessage.warning('该素材没有元数据信息')
      return
    }

    try {
      // 如果 meta 是字符串，直接使用
      if (typeof meta === 'string') {
        metaDialogContent.value = meta
      } else {
        // 如果是对象，转换为格式化的 JSON 字符串
        metaDialogContent.value = JSON.stringify(meta, null, 2)
      }
      metaDialogVisible.value = true
    } catch (error) {
      console.error('处理元数据失败:', error)
      ElMessage.error('处理元数据失败，请检查数据格式')
      // 即使出错也显示原始数据
      metaDialogContent.value = String(meta)
      metaDialogVisible.value = true
    }
  }




  // 生成图片信息
  async function handleGenerateImageInfo(row) {
    if (!row.url) {
      ElMessage.error('图片无有效链接，无法生成图片信息');
      return;
    }

    try {
      aiTableLoading.value = { ...aiTableLoading.value, [row.id]: true };
      const res = await generateImageInfo({
        id: row.id
      });
      if (res) {
        // 更新行数据 - 直接更新 dataSource 中对应的行
        const index = dataSource.value.findIndex(item => String(item.id) === String(row.id));
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
          const colors = res.colorPalette.split(',').slice(0, 3).join(', ');
          infoParts.push(`色系: ${colors}${res.colorPalette.split(',').length > 3 ? '...' : ''}`);
        }
        if (res.isCutout !== undefined) {
          infoParts.push(`抠图: ${res.isCutout ? '是' : '否'}`);
        }

        ElNotification.success(`生成图片信息成功${infoParts.length ? `：${infoParts.join('，')}` : ''}`);
        // 刷新列表以更新所有数据
        await getList();
      }
    } catch (e) {
      console.error('生成图片信息失败:', e);
      ElMessage.error(`生成图片信息失败: ${e?.message || '未知错误'}`);
    } finally {
      aiTableLoading.value = { ...aiTableLoading.value, [row.id]: false };
    }
  }

  // 处理dropdown操作命令
  function handleOperationCommand(command: string, row: any) {
    switch (command) {
      case 'edit':
        handleEdit(row);
        break;
      case 'download':
        handleDownload(row);
        break;
      case 'ai-generate':
        onAiTableAutoGenerate(row);
        break;
      case 'generate-image-info':
        handleGenerateImageInfo(row);
        break;
      case 'find-similar':
        handleFindSimilar(row);
        break;
      case 'view-meta':
        showMetaDetail(row.meta);
        break;
      case 'trim-png':
        handleTrimPng(row);
        break;
      case 'svg-to-png':
        handleSvgToPng(row);
        break;
      case 'copy':
        handleCopy(row);
        break;
      case 'create-ps-set':
        openPsdSetDialog(row);
        break;
      case 'image-split':
        ElMessage.info('图片裂变功能开发中...');
        break;
      case 'video-production':
        ElMessage.info('视频制作功能开发中...');
        break;
      case 'delete':
        handleDelete(row);
        break;
      default:
        console.warn('未知的操作命令:', command);
    }
  }

  // URL上传相关
  const urlUploadModalVisible = ref(false)
  const urlUploadLoading = ref(false)
  const urlUploadFormRef = ref()
  const urlPreviewVisible = ref(false)
  const imageInfo = ref(null)

  const urlUploadForm = reactive({
    url: '',
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    keywords: '',
    keywordsEn: '',
    isCustom: false,
    isInfringement: false,
    useAiGenerate: false, // 是否使用AI生成补全内容
    folderId: null as string | null, // 文件夹ID
    folderPath: '' // 展示路径
  })

  const urlUploadFormRules = {
    url: [
      { required: true, message: '请输入图片URL', trigger: 'blur' },
      {
        pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?.*)?$/i,
        message: '请输入有效的图片URL',
        trigger: 'blur'
      }
    ],
    name: [
      { required: true, message: '请输入文件名', trigger: 'blur' }
    ]
  }

  // 重置URL上传表单
  function resetUrlUploadForm() {
    urlUploadForm.url = ''
    urlUploadForm.name = ''
    urlUploadForm.nameEn = ''
    urlUploadForm.description = ''
    urlUploadForm.descriptionEn = ''
    urlUploadForm.keywords = ''
    urlUploadForm.keywordsEn = ''
    urlUploadForm.isCustom = false
    urlUploadForm.isInfringement = false
    urlUploadForm.useAiGenerate = false
    urlUploadForm.folderId = selectedStickerFolderId.value === '__root__' ? null : selectedStickerFolderId.value // 重置为当前选中的文件夹
    urlUploadForm.folderPath = selectedStickerFolderPath.value || ''
    urlPreviewVisible.value = false
    imageInfo.value = null
  }

  // 监听URL变化，自动显示预览
  watch(() => urlUploadForm.url, (newUrl) => {
    if (newUrl && isValidImageUrl(newUrl)) {
      urlPreviewVisible.value = true
      imageInfo.value = null
    } else {
      urlPreviewVisible.value = false
      imageInfo.value = null
    }
  })

  // 验证是否为有效的图片URL
  function isValidImageUrl(url) {
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?.*)?$/i
    return imageExtensions.test(url)
  }

  // 处理预览图片加载成功
  function handlePreviewLoad(event) {
    const img = event.target
    imageInfo.value = {
      width: img.naturalWidth,
      height: img.naturalHeight,
      size: '未知'
    }
  }

  // 处理预览图片加载失败
  function handlePreviewError() {
    ElMessage.warning('图片预览加载失败，请检查URL是否正确')
    urlPreviewVisible.value = false
  }

  // 从URL获取图片文件
  async function fetchImageFromUrl(url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'image/*'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error('URL指向的不是图片文件')
      }

      const blob = await response.blob()

      // 检查文件大小（限制10MB）
      if (blob.size > 10 * 1024 * 1024) {
        throw new Error('图片文件过大，请选择小于10MB的图片')
      }

      // 从URL或content-type获取文件扩展名
      let extension = 'jpg'
      const urlMatch = url.match(/\.([a-zA-Z0-9]+)(\?.*)?$/i)
      if (urlMatch) {
        extension = urlMatch[1].toLowerCase()
      } else if (contentType) {
        const typeMatch = contentType.match(/image\/([a-zA-Z0-9]+)/i)
        if (typeMatch) {
          extension = typeMatch[1].toLowerCase()
          if (extension === 'jpeg') extension = 'jpg'
        }
      }

      // 创建File对象
      const fileName = urlUploadForm.name || `image_${Date.now()}.${extension}`
      const file = new File([blob], fileName, { type: blob.type })

      return { file, extension }
    } catch (error) {
      console.error('获取图片失败:', error)
      throw new Error(`获取图片失败: ${error.message}`)
    }
  }

  // 处理子菜单显示和定位
  function handleSubmenuEnter(event: MouseEvent) {
    const menuItem = event.currentTarget as HTMLElement
    if (!menuItem) return

    const submenu = menuItem.querySelector('.op-submenu') as HTMLElement
    if (!submenu) return

    // 先隐藏所有其他子菜单
    const allSubmenus = document.querySelectorAll('.op-submenu') as NodeListOf<HTMLElement>
    allSubmenus.forEach((sm) => {
      if (sm !== submenu) {
        sm.style.opacity = '0'
        sm.style.visibility = 'hidden'
        sm.style.pointerEvents = 'none'
      }
    })

    // 清除之前的隐藏定时器
    if (submenuHideTimer) {
      clearTimeout(submenuHideTimer)
      submenuHideTimer = null
    }

    // 获取菜单项的位置（使用 getBoundingClientRect 获取相对于视口的位置）
    const menuItemRect = menuItem.getBoundingClientRect()

    // 临时显示子菜单到屏幕外以获取其真实尺寸
    submenu.style.position = 'fixed'
    submenu.style.left = '-9999px'
    submenu.style.top = '0'
    submenu.style.right = 'auto' // 清除可能存在的 right 属性
    submenu.style.opacity = '1'
    submenu.style.visibility = 'visible'
    submenu.style.transform = 'none'
    submenu.style.pointerEvents = 'none'

    // 强制重排以获取真实尺寸
    void submenu.offsetWidth

    // 获取子菜单的尺寸
    const submenuWidth = submenu.offsetWidth || 160 // 如果没有获取到，使用默认值 160px
    const submenuHeight = submenu.offsetHeight

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // 计算子菜单的位置（优先右侧，空间不足则左侧）
    let left = menuItemRect.right + 4
    let top = menuItemRect.top

    // 检查右侧是否有足够空间
    if (left + submenuWidth > viewportWidth - 10) {
      // 如果右侧空间不足，显示在左侧
      left = menuItemRect.left - submenuWidth - 4
      // 确保不会超出屏幕左边界
      if (left < 10) {
        left = 10
      }
    }

    // 检查底部是否有足够空间，如果不够则向上调整
    if (top + submenuHeight > viewportHeight - 10) {
      top = Math.max(10, viewportHeight - submenuHeight - 10)
    }

    // 确保顶部不会超出屏幕
    if (top < 10) {
      top = 10
    }

    // 设置子菜单的最终位置和样式
    // 使用 setProperty 并设置 important 标志，确保位置不被 CSS 覆盖
    submenu.style.setProperty('right', 'auto', 'important')
    submenu.style.setProperty('left', `${left}px`, 'important')
    submenu.style.setProperty('top', `${top}px`, 'important')
    submenu.style.opacity = '1'
    submenu.style.visibility = 'visible'
    submenu.style.transform = 'translateX(0)'
    submenu.style.pointerEvents = 'auto'

    // 确保位置设置生效，强制重排
    void submenu.offsetWidth
  }

  let submenuHideTimer: ReturnType<typeof setTimeout> | null = null

  function handleSubmenuLeave(event: MouseEvent) {
    const menuItem = event.currentTarget as HTMLElement
    if (!menuItem) return

    const submenu = menuItem.querySelector('.op-submenu') as HTMLElement
    if (!submenu) return

    // 清除之前的定时器
    if (submenuHideTimer) {
      clearTimeout(submenuHideTimer)
    }

    // 延迟隐藏，允许鼠标移动到子菜单
    submenuHideTimer = setTimeout(() => {
      // 检查鼠标是否仍在子菜单上
      const elementUnderMouse = document.elementFromPoint(event.clientX, event.clientY)
      const isHovering = elementUnderMouse?.closest('.op-submenu') === submenu ||
        elementUnderMouse?.closest('.has-submenu') === menuItem

      if (!isHovering) {
        submenu.style.opacity = '0'
        submenu.style.visibility = 'hidden'
        submenu.style.pointerEvents = 'none'
      }
    }, 200)
  }

  // 保持子菜单可见
  function handleSubmenuKeepVisible(event: MouseEvent) {
    const submenu = event.currentTarget as HTMLElement
    if (!submenu) return

    // 先隐藏所有其他子菜单
    const allSubmenus = document.querySelectorAll('.op-submenu') as NodeListOf<HTMLElement>
    allSubmenus.forEach((sm) => {
      if (sm !== submenu) {
        sm.style.opacity = '0'
        sm.style.visibility = 'hidden'
        sm.style.pointerEvents = 'none'
      }
    })

    // 清除隐藏定时器
    if (submenuHideTimer) {
      clearTimeout(submenuHideTimer)
      submenuHideTimer = null
    }

    // 确保子菜单可见
    submenu.style.opacity = '1'
    submenu.style.visibility = 'visible'
    submenu.style.pointerEvents = 'auto'
  }

  // 隐藏子菜单
  function handleSubmenuHide(event: MouseEvent) {
    const submenu = event.currentTarget as HTMLElement
    if (!submenu) return

    // 延迟隐藏
    submenuHideTimer = setTimeout(() => {
      submenu.style.opacity = '0'
      submenu.style.visibility = 'hidden'
      submenu.style.pointerEvents = 'none'
    }, 200)
  }

  // 复制文本到剪贴板
  async function handleCopyText(text: string, label: string) {
    if (!text) {
      ElMessage.warning(`${label}为空，无法复制`)
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      ElMessage.success(`${label}已复制到剪贴板`)
    } catch (error) {
      // 降级方案：使用传统方法
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        ElMessage.success(`${label}已复制到剪贴板`)
      } catch (e) {
        ElMessage.error('复制失败')
      }
      document.body.removeChild(textarea)
    }
  }

  // 处理URL上传
  async function handleUrlUpload() {
    if (!urlUploadFormRef.value) return

    try {
      // 验证表单
      await urlUploadFormRef.value.validate()

      urlUploadLoading.value = true

      // 获取图片文件
      const { file, extension } = await fetchImageFromUrl(urlUploadForm.url)

      // 上传到COS
      const userAccount = (userStore.user as any)?.account || userStore.user?.shortName || userStore.user?.name || 'anonymous'
      const cos = await uploadToCOS({
        file,
        category: 'sticker', // 素材上传到 sticker 分类
        account: userAccount
      })
      const { key, url } = cos

      // 计算图片宽高及宽高比（如果预览阶段已经获取到了尺寸，则优先使用）
      const width = imageInfo.value?.width || 0
      const height = imageInfo.value?.height || 0
      const aspectRatio = width && height ? width / height : undefined

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
        uploaderId: userStore.user?.id,
        useAiGenerate: urlUploadForm.useAiGenerate, // 是否使用AI生成补全内容
        folderId: urlUploadForm.folderId ?? null
      })

      ElNotification.success('图片上传成功')
      urlUploadModalVisible.value = false
      resetUrlUploadForm()

      // 刷新列表
      getList()

    } catch (error) {
      console.error('URL上传失败:', error)
      ElMessage.error(`上传失败: ${error.message}`)
    } finally {
      urlUploadLoading.value = false
    }
  }}
</script>
<style scoped>
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
  gap: 12px;
}

.psd-set-footer-main {
  display: flex;
  align-items: center;
  gap: 36px;
  width: 100%;
  flex-wrap: wrap;
}

.psd-set-info {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  color: var(--el-color-info);
  font-size: 13px;
  min-width: 260px;
}

.psd-set-info :deep(.el-icon) {
  font-size: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.psd-set-info-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.psd-set-formats-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  padding: 4px 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  border-left: 2px solid var(--el-color-warning);
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

  .psd-set-footer {
    align-items: stretch;
  }

  .psd-set-dialog :deep(.el-dialog__body) {
    max-height: calc(100vh - 120px);
  }

  .footer-actions {
    width: 100%;
    justify-content: flex-end;
    gap: 8px;
  }
}

/* PC端优化 */
.text-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 4px;
  background: rgba(64, 158, 255, 0.04);
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  min-height: 28px;
  position: relative;
}

.text-cell:hover {
  background: rgba(64, 158, 255, 0.12);
  box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.25);
}

.text-cell--empty {
  background: transparent;
  cursor: default;
  color: var(--el-text-color-placeholder);
  box-shadow: none;
}

.text-cell__content {
  flex: 1;
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
  font-size: 13px;
  line-height: 1.3;
  color: inherit;
}

.text-cell--long .text-cell__content {
  -webkit-line-clamp: 3;
}

.text-cell__icon {
  flex-shrink: 0;
  font-size: 16px;
  color: var(--el-color-primary);
  opacity: 0;
  transition: opacity 0.2s;
}

.text-cell:not(.text-cell--empty):hover .text-cell__icon {
  opacity: 1;
}

.text-cell--empty .text-cell__icon {
  display: none;
}

.text-cell--empty .text-cell__content {
  -webkit-line-clamp: 1;
  color: var(--el-text-color-placeholder);
}

/* 双语单元格样式 */
.bilingual-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}

.bilingual-cell__item {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 4px;
  background: rgba(64, 158, 255, 0.04);
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  min-height: 26px;
  position: relative;
}

.bilingual-cell__item:hover {
  background: rgba(64, 158, 255, 0.12);
  box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.25);
}

.bilingual-cell__item--en {
  background: rgba(103, 194, 58, 0.04);
}

.bilingual-cell__item--en:hover {
  background: rgba(103, 194, 58, 0.12);
  box-shadow: inset 0 0 0 1px rgba(103, 194, 58, 0.25);
}

.bilingual-cell__item--empty {
  background: transparent;
  cursor: default;
  color: var(--el-text-color-placeholder);
  box-shadow: none;
}

.bilingual-cell__label {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
  padding-top: 1px;
  opacity: 0.8;
}

.bilingual-cell__item--en .bilingual-cell__label {
  color: var(--el-color-success);
}

.bilingual-cell__content {
  flex: 1;
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
  font-size: 13px;
  line-height: 1.4;
  color: inherit;
}

.bilingual-cell__icon {
  flex-shrink: 0;
  font-size: 16px;
  color: var(--el-color-primary);
  opacity: 0;
  transition: opacity 0.2s;
  margin-top: 2px;
}

.bilingual-cell__item--en .bilingual-cell__icon {
  color: var(--el-color-success);
}

.bilingual-cell__item:not(.bilingual-cell__item--empty):hover .bilingual-cell__icon {
  opacity: 1;
}

.bilingual-cell__item--empty .bilingual-cell__icon {
  display: none;
}

.bilingual-cell__item--empty .bilingual-cell__content {
  -webkit-line-clamp: 1;
  color: var(--el-text-color-placeholder);
}

.material-dnd-grid :deep(.vxe-table--body tbody tr) {
  cursor: grab;
  user-select: none;
}

.material-dnd-grid :deep(.vxe-table--body tbody tr.is-dragging-row) {
  opacity: 0.75;
  background: var(--el-color-primary-light-9);
}

.material-dnd-grid :deep(.vxe-table--body tbody td) {
  user-select: none;
  -webkit-user-drag: none;
}

.material-drag-ghost {
  opacity: 0.6 !important;
  background: var(--el-color-primary-light-8) !important;
}

.drag-hint-bubble {
  position: fixed;
  z-index: 99999;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--el-color-primary);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  pointer-events: none;
  transform: translate(6px, 6px);
  transition: opacity 0.12s ease;
}

.drag-hint-icon {
  display: flex;
  align-items: center;
}

.flex.pb-4,
.search-bar {
  gap: 12px;
  /* 收紧整体水平/垂直间距 */
  flex-wrap: wrap;
  align-items: center;
}

.flex.pb-4>*,
.search-bar>* {
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

.search-field> :not(.search-label) {
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


.search-bar-form :deep(.el-form-item__content)>* {
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
}

.search-field-similar .phash-form-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.search-field-similar .phash-form-row .el-input {
  min-width: 200px;
  max-width: 320px;
  flex: 1;
}

.search-field-similar .phash-mode {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.search-field-similar .phash-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
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

  .flex.pb-4>*,
  .search-bar>* {
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

  .common-table {
    overflow-x: auto;
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
  transition: box-shadow 0.2s, background 0.2s, opacity 0.2s;
  background: transparent;
  color: #fff;
}

.step-active {
  box-shadow: 0 0 0 3px #409eff44;
  background: rgba(64, 158, 255, 0.10) !important;
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
  background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
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

/* 文件夹树样式 */
.sticker-folder-tree-container {
  .sticker-folder-tree-header {
    margin-bottom: 12px;
  }

  .sticker-folder-tree {
    --el-tree-node-content-height: 36px;

    :deep(.el-tree-node__content) {
      height: 36px;
      padding-left: 8px !important;

      &:hover {
        background-color: var(--el-fill-color-light);
      }
    }

    :deep(.el-tree-node.is-current > .el-tree-node__content) {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      font-weight: 500;
    }

    :deep(.el-tree-node__expand-icon) {
      color: var(--el-text-color-regular);
    }
  }

  .sticker-folder-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-right: 8px;
    border-radius: 6px;
    transition: background-color 0.15s ease, box-shadow 0.15s ease;

    &.is-drop-hover {
      background: var(--el-color-primary-light-9);
      box-shadow: inset 0 0 0 1px var(--el-color-primary-light-7);

      .sticker-folder-node-text {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }

    .sticker-folder-node-content {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;

      .folder-icon {
        width: 16px;
        height: 16px;
        margin-right: 6px;
        flex-shrink: 0;
      }

      .sticker-folder-node-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        cursor: pointer;
        transform-origin: left center;

        &:hover {
          transform: scale(1.05);
        }
      }

      .sticker-folder-node-count {
        font-size: 11px;
        color: var(--el-color-primary);
        font-weight: 300;
        margin-left: 6px;
      }
    }

    .sticker-folder-node-actions {
      display: flex;
      align-items: center;
      padding-right: 4px;
      margin-left: 12px;

      .sticker-folder-action-icon {
        font-size: 14px;
        cursor: pointer;
        opacity: 0.4;
        transition: opacity 0.2s, color 0.2s;
        color: var(--el-text-color-regular);
        padding: 2px;

        &:hover {
          opacity: 1;
          color: var(--el-color-primary);
        }
      }

      :deep(.el-dropdown) {
        .el-dropdown__caret-button {
          display: none;
        }
      }
    }

    &:hover {
      .sticker-folder-node-actions {
        .sticker-folder-action-icon {
          opacity: 0.7;
        }
      }
    }
  }

  /* 下拉菜单样式优化 */
  :deep(.el-dropdown-menu) {
    min-width: 140px;
    padding: 4px 0;

    .el-dropdown-menu__item {
      padding: 6px 16px;
      font-size: 13px;

      .el-icon {
        margin-right: 6px;
        font-size: 14px;
      }
    }
  }
}
</style>
<style scoped>
.op-menu {
  min-width: 120px;
  padding: 1px 0;
  position: relative;
  overflow: visible !important;
  /* 确保菜单本身允许溢出 */
}

/* 一级菜单项 */
.op-menu-item {
  position: relative;
  padding: 4px 8px;
  font-size: 11px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: visible !important;
  /* 确保菜单项允许溢出 */
}

.op-menu-item:hover {
  background: var(--el-fill-color-light);
}

.op-menu-item.danger {
  color: var(--el-color-danger);
}

.op-menu-item.danger:hover {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

/* 箭头图标 - 放在文字左边 */
.op-menu-arrow {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  transition: transform 0.2s;
  flex-shrink: 0;
  width: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 没有子菜单的占位，保持对齐 */
.op-menu-arrow-placeholder {
  width: 12px;
  flex-shrink: 0;
}

.op-menu-label {
  flex: 1;
  display: flex;
  align-items: center;
}


/* 子菜单 */
.op-submenu {
  position: fixed;
  /* 使用 fixed 定位，避免被父容器裁剪 */
  min-width: 120px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 2px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  padding: 1px 0;
  opacity: 0;
  visibility: hidden;
  transform: translateX(-5px);
  transition: opacity 0.2s, transform 0.2s, visibility 0.2s;
  z-index: 9999;
  /* 提高 z-index 确保在最上层 */
  white-space: nowrap;
  pointer-events: none;
  /* 初始禁用交互，hover 时启用 */
  margin: 0;
  /* 初始位置，会被 JS 动态设置 */
  left: 0;
  top: 0;
}

/* 子菜单显示时保持可见（即使鼠标移开一点） */
.op-submenu:hover {
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}

.op-menu-item.has-submenu:hover .op-submenu {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
  pointer-events: auto;
  /* hover 时启用交互 */
}

/* 子菜单项 */
.op-submenu-item {
  padding: 4px 10px;
  font-size: 11px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.op-submenu-item:hover {
  background: var(--el-fill-color-light);
}

/* 分隔线 */
.op-divider {
  height: 1px;
  background: var(--el-border-color-lighter);
  margin: 3px 8px;
}

/* 针对操作按钮的优化 */
.operation-dropdown :deep(.el-dropdown__list) {
  padding: 0;
  overflow: visible !important;
}

/* 确保下拉菜单容器允许溢出显示子菜单 */
.operation-dropdown {
  position: relative;
}

/* 修复 Element Plus Dropdown 的 overflow 限制 */
.operation-dropdown :deep(.el-popper) {
  overflow: visible !important;
}

.operation-dropdown :deep(.el-popper__arrow) {
  display: none;
}

/* 确保 popper 容器和内部都允许溢出 */
.operation-dropdown :deep(.el-popper),
.operation-dropdown :deep(.el-dropdown-menu),
.operation-dropdown :deep(.el-dropdown-menu__item) {
  overflow: visible !important;
  overflow-x: visible !important;
  overflow-y: visible !important;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .op-menu {
    min-width: 140px;
  }

  .op-menu-item {
    padding: 10px 12px;
    font-size: 14px;
  }

  .op-submenu {
    min-width: 140px;
  }

  .op-submenu-item {
    padding: 10px 14px;
    font-size: 14px;
  }
}

/* 处理右侧屏幕边界情况 */
@media (min-width: 769px) {

  /* 通过JS动态调整，CSS无法完美处理，但可以设置备用方案 */
  .op-menu-item.has-submenu:nth-last-child(-n+2):hover .op-submenu,
  .op-menu-item.has-submenu:nth-last-child(-n+2):hover .op-submenu {
    left: auto;
    right: 100%;
    margin-left: 0;
    margin-right: 4px;
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
.edit-material-dialog :deep(.el-dialog__body) {
  padding: 30px;
  max-height: 70vh;
  overflow-y: auto;
}

.edit-material-dialog :deep(.el-dialog) {
  border-radius: 8px;
}

.edit-form {
  padding: 0;
}

.edit-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.edit-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.edit-form :deep(.el-row) {
  margin-bottom: 0;
}

.edit-form :deep(.el-divider) {
  margin: 24px 0;
}

.edit-form :deep(.el-input),
.edit-form :deep(.el-textarea),
.edit-form :deep(.el-select) {
  font-size: 14px;
}

.edit-form :deep(.el-textarea__inner) {
  min-height: 100px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .edit-material-dialog {
    width: 95% !important;
  }
}

@media (max-width: 768px) {
  .edit-material-dialog {
    width: 95% !important;
  }

  .edit-form :deep(.el-col) {
    margin-bottom: 0;
  }

  .edit-form :deep(.el-col) {
    margin-bottom: 16px;
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
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
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

.psd-set-dialog :deep(.el-dialog__body) {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 520px;
  max-height: calc(100vh - 160px);
  overflow: hidden;
}

.psd-set-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(360px, 1.6fr) minmax(280px, 1.2fr);
  gap: 16px;
  width: 100%;
  overflow: hidden;
  padding-right: 4px;
}

.psd-set-materials,
.psd-set-templates {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 16px;
  min-height: 220px;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  overflow-y: auto;
  overflow-x: hidden;
}

.psd-set-materials .thumb {
  position: relative;
  height: 120px;
  width: auto;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.psd-set-materials .thumb.thumb-invalid-format {
  border-color: var(--el-color-danger);
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
}

.psd-set-materials .thumb img {
  width: auto;
  height: 100%;
  max-width: 100%;
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

.psd-set-template-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.psd-set-template-toolbar .selected-count {
  font-size: 13px;
  color: var(--el-color-primary);
  font-weight: 500;
  padding: 4px 10px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(64, 158, 255, 0.3);
  white-space: nowrap;
}

.psd-set-templates .template-list-wrapper {
  flex: 1;
  min-height: 0;
  max-height: calc(100vh - 320px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.psd-set-templates .template-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.psd-set-templates .template-pagination {
  flex-shrink: 0;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: flex-end;
}

.psd-set-templates .template-item {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--el-bg-color);
}

.psd-set-templates .template-item.is-checked {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.3);
  background: rgba(64, 158, 255, 0.06);
}

.psd-set-templates .template-content-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.psd-set-templates .template-thumbnail {
  width: 80px;
  height: 80px;
  min-width: 80px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-lighter);
  flex-shrink: 0;
}

.psd-set-templates .template-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.psd-set-templates .template-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
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
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
  margin-bottom: 4px;
  padding: 6px 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  border-left: 3px solid var(--el-color-primary);
}

.psd-set-templates .template-meta {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
  flex-wrap: wrap;
}

.psd-set-templates .template-paths {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  align-items: center;
  gap: 16px;
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
  font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
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
  content: '';
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

/* 横图系列 */
.landscape-thumb {
  width: 48px;
  height: 24px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.15) 0%, rgba(64, 158, 255, 0.25) 100%);
}

.ultra-wide-thumb {
  width: 56px;
  height: 20px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.15) 0%, rgba(64, 158, 255, 0.25) 100%);
}

.wide-thumb {
  width: 52px;
  height: 22px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.15) 0%, rgba(64, 158, 255, 0.25) 100%);
}

.slightly-wide-thumb {
  width: 50px;
  height: 23px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.15) 0%, rgba(64, 158, 255, 0.25) 100%);
}

/* 正方形 */
.square-thumb {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.15) 0%, rgba(103, 194, 58, 0.25) 100%);
}

.square-thumb::after {
  border-color: rgba(103, 194, 58, 0.3);
}

/* 竖图系列 - 调整尺寸以适应选项高度 */
.portrait-thumb {
  width: 20px;
  height: 36px;
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.15) 0%, rgba(245, 108, 108, 0.25) 100%);
}

.portrait-thumb::after {
  border-color: rgba(245, 108, 108, 0.3);
}

.slightly-long-thumb {
  width: 20px;
  height: 38px;
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.15) 0%, rgba(245, 108, 108, 0.25) 100%);
}

.slightly-long-thumb::after {
  border-color: rgba(245, 108, 108, 0.3);
}

.long-thumb {
  width: 18px;
  height: 40px;
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.15) 0%, rgba(245, 108, 108, 0.25) 100%);
}

.long-thumb::after {
  border-color: rgba(245, 108, 108, 0.3);
}

.ultra-long-thumb {
  width: 18px;
  height: 42px;
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.15) 0%, rgba(245, 108, 108, 0.25) 100%);
}

.ultra-long-thumb::after {
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

.size-select-value .size-thumb {
  width: 36px;
  height: 18px;
}

.size-select-value .square-thumb {
  width: 18px;
  height: 18px;
}

.size-select-value .portrait-thumb,
.size-select-value .slightly-long-thumb,
.size-select-value .long-thumb,
.size-select-value .ultra-long-thumb {
  width: 18px;
  height: 36px;
}

.size-select-value .ultra-wide-thumb {
  width: 42px;
  height: 15px;
}

.size-select-value .wide-thumb {
  width: 39px;
  height: 16px;
}

.size-select-value .slightly-wide-thumb {
  width: 37px;
  height: 17px;
}

.size-select-value .slightly-long-thumb {
  width: 17px;
  height: 37px;
}

.size-select-value .long-thumb {
  width: 16px;
  height: 39px;
}

.size-select-value .ultra-long-thumb {
  width: 15px;
  height: 42px;
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
.batch-detail-config-content {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);

  .batch-detail-config-header {
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color);
    background: var(--el-fill-color-lighter);

    .batch-detail-config-title {
      font-size: 16px;
      color: var(--el-text-color-primary);
      font-weight: 600;
    }
  }

  .batch-detail-config-body {
    flex: 1;
    overflow: auto;
    padding: 20px;
    background: var(--el-bg-color);

    .template-config-row {
      display: flex;
      gap: 20px;
      padding: 20px;
      margin-bottom: 20px;
      background: var(--el-bg-color-page);
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;

      .template-config-left {
        width: 320px;
        flex-shrink: 0;

        .template-config-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--el-border-color-lighter);

          .template-name {
            font-size: 15px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }

        .template-config-images {
          display: flex;
          flex-direction: column;
          gap: 16px;

          .config-image-item {
            .config-image-label {
              font-size: 13px;
              font-weight: 500;
              color: var(--el-text-color-regular);
              margin-bottom: 8px;
            }

            .config-image-wrapper {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;

              .config-image {
                width: 120px;
                height: 120px;
                border: 1px solid var(--el-border-color);
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
                border: 1px dashed var(--el-border-color);
                border-radius: 4px;
                background: var(--el-fill-color-lighter);
                width: 120px;
                height: 120px;
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
          margin-bottom: 12px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .config-textarea {
          :deep(.el-textarea__inner) {
            font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            line-height: 1.6;
          }
        }
      }
    }
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
</style>