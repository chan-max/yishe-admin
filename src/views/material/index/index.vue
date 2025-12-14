<template>
  <div>
    <!-- PC端显示原有搜索栏，移动端只显示筛选按钮（可折叠） -->
    <!-- 折叠状态：显示常用搜索和操作 -->
    <div v-show="actionsCollapsed && !isMobile" class="flex pb-4 flex-wrap justify-end gap-4 items-center search-bar">
      <div style="flex: 1"></div>
      <form-item label="按名称搜索">
        <el-input
          v-model="queryParams.imageName"
          placeholder="请输入图片名称"
          style="width: 160px"
          clearable
          @change="(val) => { if (!val) getList() }"
        />
      </form-item>
      <el-button type="primary" :icon="Search" @click="getList"> 搜索 </el-button>
      <form-item label="随机顺序">
        <el-switch
          v-model="queryParams.random"
          active-text="随机"
          inactive-text="默认"
          @change="getList"
        />
      </form-item>
      <el-button type="info" :icon="Grid" @click="actionsCollapsed = !actionsCollapsed">
        展开筛选
      </el-button>
      <div class="flex shrink-0">
        <el-button type="primary" @click="() => { uploadModalVisible = true }">上传</el-button>
        <el-button type="default" @click="handleMultiDownload">下载 ({{ ids.length }})</el-button>
        <el-button v-if="isAdmin" type="danger" :icon="Delete" @click="handleDelete(null)">批量删除({{ ids.length }})</el-button>
      </div>
    </div>

    <!-- 展开状态：显示全部搜索功能 -->
    <div v-show="!actionsCollapsed && !isMobile" class="flex pb-4 flex-wrap justify-end gap-4 items-center search-bar">
      <div style="flex: 1"></div>
      <form-item label="按名称搜索">
        <el-input
          v-model="queryParams.imageName"
          placeholder="请输入图片名称"
          style="width: 160px"
          clearable
          @change="(val) => { if (!val) getList() }"
        />
      </form-item>
      <el-button type="primary" :icon="Search" @click="getList"> 搜索 </el-button>
      <el-button type="info" :icon="Grid" @click="actionsCollapsed = !actionsCollapsed">
        收起筛选
      </el-button>
      <form-item label="排序">
        <el-select v-model="queryParams.sortingFields" placeholder="请选择排序方式" style="width: 140px" @change="getList">
          <el-option label="创建时间倒序" value="createTime DESC" />
          <el-option label="创建时间正序" value="createTime ASC" />
        </el-select>
      </form-item>
      <form-item label="后缀">
        <el-select v-model="queryParams.suffix" placeholder="请选择后缀" style="width: 120px" clearable @change="getList">
          <el-option label="全部" value="" />
          <el-option label="jpg" value="jpg" />
          <el-option label="jpeg" value="jpeg" />
          <el-option label="png" value="png" />
          <el-option label="gif" value="gif" />
          <el-option label="webp" value="webp" />
          <el-option label="svg" value="svg" />
          <el-option label="bmp" value="bmp" />
          <el-option label="tiff" value="tiff" />
        </el-select>
      </form-item>
      <form-item label="ID精确查询">
        <el-input
          v-model="queryParams.id"
          placeholder="请输入ID"
          style="width: 120px"
          clearable
          @change="(val) => { if (!val) getList() }"
        />
      </form-item>
      <form-item label="phash相似图片搜索">
        <div class="flex gap-4 items-center flex-wrap">
          <el-input
            v-model="queryParams.phash"
            placeholder="请输入phash值"
            style="width: 200px"
            clearable
            @blur="onPhashInputBlur"
          />
          
          <div class="flex gap-2">
            <el-button type="primary" @click="handlePhashSearch">搜索相似图片</el-button>
            <el-button @click="clearPhashSearch">清空</el-button>
          </div>
        </div>
      </form-item>
      <form-item label="自定义贴纸">
        <el-select v-model="queryParams.isCustom" placeholder="请选择类型" style="width: 120px" clearable @change="getList">
          <el-option label="全部" :value="null" />
          <el-option label="是" :value="true" />
          <el-option label="否" :value="false" />
        </el-select>
      </form-item>
      <form-item label="侵权状态">
        <el-select v-model="queryParams.isInfringement" placeholder="请选择状态" style="width: 120px" clearable @change="getList">
          <el-option label="全部" :value="null" />
          <el-option label="侵权" :value="true" />
          <el-option label="非侵权" :value="false" />
        </el-select>
      </form-item>
      <form-item label="发布状态">
        <el-select v-model="queryParams.isPublish" placeholder="请选择状态" style="width: 120px" clearable @change="getList">
          <el-option label="全部" :value="null" />
          <el-option label="已发布" :value="true" />
          <el-option label="未发布" :value="false" />
        </el-select>
      </form-item>
      <form-item label="随机顺序">
        <el-switch
            v-model="queryParams.random"
            active-text="随机"
            inactive-text="默认"
            @change="getList"
        />
      </form-item>
      <form-item class="date-range-picker">
        <DateRangePicker
          @change="(val) => { queryParams.startTime = val.start; queryParams.endTime = val.end; getList() }"
        />
      </form-item>
      <div class="flex shrink-0">
        <el-button type="primary" @click="() => { uploadModalVisible = true }">上传</el-button>
        <el-button v-if="isAdmin" type="info" @click="() => { urlUploadModalVisible = true }">URL上传</el-button>
        <el-button type="default" @click="handleMultiDownload">下载 ({{ ids.length }})</el-button>
        <el-button v-if="isAdmin" type="success" @click="async () => { if (!ids.length) { return ElMessage.warning('请选择要制作的素材') } resetDesignModelSteps(); designModelModalVisible = true; await loadDesignModels() }">制作设计模型({{ ids.length }})</el-button>
        <el-button v-if="isAdmin" type="primary" @click="() => { if (!ids.length) { return ElMessage.warning('请先勾选素材') } linkRow = null; openLinkTemplate2D(null) }">根据二维模板组制作商品图({{ ids.length }})</el-button>
        <el-button v-if="isAdmin" type="primary" @click="() => openPsdSetDialog()">
          制作PS套图({{ ids.length }})
        </el-button>
        <el-button v-if="isAdmin" type="warning" @click="async () => { if (!ids.length) { return ElMessage.warning('请选择要生成商品的素材') } resetGenerateProductSteps(); generateProductModalVisible = true }">生成商品({{ ids.length }})</el-button>
        <el-button v-if="isAdmin" type="warning" @click="handleBatchPublish">批量发布({{ ids.length }})</el-button>
        <el-button v-if="isAdmin" type="info" @click="handleBatchUnpublish">批量下架({{ ids.length }})</el-button>
        <el-button v-if="isAdmin" type="danger" :icon="Delete" @click="handleDelete(null)">批量删除({{ ids.length }})</el-button>
      </div>
    </div>
    <div v-if="isMobile && !actionsCollapsed" class="flex pb-4 justify-end">
      <el-button type="primary" icon="el-icon-filter" @click="filterDialogVisible = true">筛选</el-button>
    </div>
    <el-dialog v-model="filterDialogVisible" title="筛选" width="90%" align-center>
      <el-form :model="queryParams" label-width="80px">
        <el-form-item label="按名称搜索">
          <el-input v-model="queryParams.keyword" placeholder="请输入名称、描述或关键词" clearable />
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
        <el-form-item label="发布状态">
          <el-select v-model="queryParams.isPublish" placeholder="请选择状态">
            <el-option label="全部" :value="null" />
            <el-option label="已发布" :value="true" />
            <el-option label="未发布" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="随机顺序">
          <el-switch
            v-model="queryParams.random"
            active-text="随机"
            inactive-text="默认"
          />
        </el-form-item>
        <el-form-item label="按时间查询">
          <DateRangePicker
            @change="(val) => { queryParams.startTime = val.start; queryParams.endTime = val.end }"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="filterDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onMobileFilterSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="psdSetDialogVisible"
      title="制作PS套图"
      width="100%"
      style="height: 100%"
      align-center
      :destroy-on-close="true"
      class="psd-set-dialog"
      @close="resetPsdSetState"
    >
      <div class="psd-set-body">
        <div class="psd-set-materials">
          <div class="section-title">已选择素材 ({{ ids.length }})</div>
          <div class="thumbs">
            <div
              v-for="id in ids"
              :key="id"
              class="thumb"
            >
              <img :src="(dataSource.find(i => String(i.id) === String(id)) || {}).url" />
            </div>
          </div>
        </div>
        <div class="psd-set-templates">
          <div class="section-title">选择PSD模板 (可多选)</div>
          <div class="template-list" v-loading="psdSetTemplatesLoading">
            <div
              v-for="tpl in psdSetTemplates"
              :key="tpl.id"
              class="template-item"
              :class="{ 'is-checked': selectedPsdTemplateIds.includes(String(tpl.id)) }"
              @click="togglePsdTemplate(tpl.id)"
            >
              <div class="template-content-wrapper">
                <img
                  v-if="tpl.thumbnail || tpl.preview || tpl.image"
                  :src="tpl.thumbnail || tpl.preview || tpl.image"
                  :alt="tpl.name || '模板缩略图'"
                  class="template-thumbnail"
                  @error="handleTemplateImageError"
                />
                <div class="template-info">
                  <div class="template-header">
                    <div class="template-title">{{ tpl.name || '未命名模板' }}</div>
                    <div class="template-description">{{ tpl.description || '暂无描述' }}</div>
                  </div>
                  <div class="template-meta">
                    <el-tag v-if="tpl.category" size="small">{{ tpl.category }}</el-tag>
                    <span class="uploader" v-if="tpl.uploader?.name">上传者：{{ tpl.uploader.name }}</span>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-if="!psdSetTemplates.length && !psdSetTemplatesLoading" description="暂无PSD模板" />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="psd-set-footer">
          <el-alert
            type="info"
            :closable="false"
            show-icon
            :title="`将生成 ${ids.length} × ${selectedPsdTemplateIds.length} = ${ids.length * selectedPsdTemplateIds.length} 条套图任务`"
          />
          <div class="footer-actions">
            <el-button @click="psdSetDialogVisible = false">取消</el-button>
            <el-button type="primary" :disabled="!ids.length || !selectedPsdTemplateIds.length" :loading="psdSetSubmitting" @click="handleCreatePsdSets">
              开始制作
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <div class="flex gap-4">
      <div class="content-container" :style="{ width: '100%' }">
        <div class="common-table">
          <vxe-grid
            ref="gridRef"
            v-bind="gridOptions"
            :data="dataSource"
            :loading="loading"
            @checkbox-change="checkboxChange"
            @checkbox-all="checkboxAllChange"
          >
            <template #previewDefaultSlot="{ row }">
              <div class="flex flex-col items-center justify-center p-2">
                <img
                  :src="row.url"
                  :alt="row.name || '素材图片'"
                  style="width:120px; height:auto; object-fit:contain; background:#f5f5f5; cursor:pointer;"
                  @click="openImagePreview(row.url, row.name)"
            
                  @load="(event) => handleImageLoad(event, row)"
                />
                <div v-if="row.imageDimensions" class="text-xs text-gray-500 mt-1 text-center">
                  {{ row.imageDimensions.width }} × {{ row.imageDimensions.height }}
                </div>
              </div>
            </template>

            <template #nameTextSlot="{ row }">
              <div
                class="text-cell"
                :class="{ 'text-cell--empty': !row.name }"
                @click.stop="handleCopyText(row.name, '中文标题')"
                role="button"
              >
                <el-tooltip
                  :content="row.name || '-'"
                  placement="top"
                  :disabled="!(row.name && row.name.length > 0)"
                  popper-class="text-cell-tooltip"
                >
                  <div class="text-cell__content">
                    {{ row.name || '-' }}
                  </div>
                </el-tooltip>
                <el-icon v-if="row.name" class="text-cell__icon">
                  <DocumentCopy />
                </el-icon>
              </div>
            </template>

            <template #nameEnTextSlot="{ row }">
              <div
                class="text-cell"
                :class="{ 'text-cell--empty': !row.nameEn }"
                @click.stop="handleCopyText(row.nameEn, '英文标题')"
                role="button"
              >
                <el-tooltip
                  :content="row.nameEn || '-'"
                  placement="top"
                  :disabled="!(row.nameEn && row.nameEn.length > 0)"
                  popper-class="text-cell-tooltip"
                >
                  <div class="text-cell__content">
                    {{ row.nameEn || '-' }}
                  </div>
                </el-tooltip>
                <el-icon v-if="row.nameEn" class="text-cell__icon">
                  <DocumentCopy />
                </el-icon>
              </div>
            </template>

            <template #descriptionTextSlot="{ row }">
              <div
                class="text-cell text-cell--long"
                :class="{ 'text-cell--empty': !row.description }"
                @click.stop="handleCopyText(row.description, '中文描述')"
                role="button"
              >
                <el-tooltip
                  :content="row.description || '-'"
                  placement="top"
                  :disabled="!(row.description && row.description.length > 0)"
                  popper-class="text-cell-tooltip"
                >
                  <div class="text-cell__content">
                    {{ row.description || '-' }}
                  </div>
                </el-tooltip>
                <el-icon v-if="row.description" class="text-cell__icon">
                  <DocumentCopy />
                </el-icon>
              </div>
            </template>

            <template #descriptionEnTextSlot="{ row }">
              <div
                class="text-cell text-cell--long"
                :class="{ 'text-cell--empty': !row.descriptionEn }"
                @click.stop="handleCopyText(row.descriptionEn, '英文描述')"
                role="button"
              >
                <el-tooltip
                  :content="row.descriptionEn || '-'"
                  placement="top"
                  :disabled="!(row.descriptionEn && row.descriptionEn.length > 0)"
                  popper-class="text-cell-tooltip"
                >
                  <div class="text-cell__content">
                    {{ row.descriptionEn || '-' }}
                  </div>
                </el-tooltip>
                <el-icon v-if="row.descriptionEn" class="text-cell__icon">
                  <DocumentCopy />
                </el-icon>
              </div>
            </template>

            <template #keywordsTextSlot="{ row }">
              <div
                class="text-cell text-cell--long"
                :class="{ 'text-cell--empty': !row.keywords }"
                @click.stop="handleCopyText(row.keywords, '中文关键字')"
                role="button"
              >
                <el-tooltip
                  :content="row.keywords || '-'"
                  placement="top"
                  :disabled="!(row.keywords && row.keywords.length > 0)"
                  popper-class="text-cell-tooltip"
                >
                  <div class="text-cell__content">
                    {{ row.keywords || '-' }}
                  </div>
                </el-tooltip>
                <el-icon v-if="row.keywords" class="text-cell__icon">
                  <DocumentCopy />
                </el-icon>
              </div>
            </template>

            <template #keywordsEnTextSlot="{ row }">
              <div
                class="text-cell text-cell--long"
                :class="{ 'text-cell--empty': !row.keywordsEn }"
                @click.stop="handleCopyText(row.keywordsEn, '英文关键字')"
                role="button"
              >
                <el-tooltip
                  :content="row.keywordsEn || '-'"
                  placement="top"
                  :disabled="!(row.keywordsEn && row.keywordsEn.length > 0)"
                  popper-class="text-cell-tooltip"
                >
                  <div class="text-cell__content">
                    {{ row.keywordsEn || '-' }}
                  </div>
                </el-tooltip>
                <el-icon v-if="row.keywordsEn" class="text-cell__icon">
                  <DocumentCopy />
                </el-icon>
              </div>
            </template>

            <template #resolutionSlot="{ row }">
              <span>{{ row.resolutionWidth && row.resolutionHeight ? row.resolutionWidth + '×' + row.resolutionHeight : '-' }}</span>
            </template>
            <template #originWebSlot="{ row }">
              <span>{{ row.originWeb || '-' }}</span>
            </template>
            <template #sizeSlot="{ row }">
              <span>{{ row.size ? (row.size / 1024).toFixed(1) + ' KB' : '-' }}</span>
            </template>

            <template #isCustomSlot="{ row }">
              <el-tag 
                :type="row.isCustom ? 'success' : 'info'" 
                size="small"
              >
                {{ row.isCustom ? '是' : '否' }}
              </el-tag>
            </template>

            <template #isInfringementSlot="{ row }">
              <el-tag 
                :type="row.isInfringement ? 'danger' : 'success'" 
                size="small"
              >
                {{ row.isInfringement ? '侵权' : '非侵权' }}
              </el-tag>
            </template>

            <template #isPublishSlot="{ row }">
              <el-tag 
                :type="row.isPublish ? 'success' : 'info'" 
                size="small"
              >
                {{ row.isPublish ? '已发布' : '未发布' }}
              </el-tag>
            </template>

            <template #similaritySlot="{ row }">
              <el-tag 
                v-if="row.similarity !== undefined"
                :type="row.similarity >= 90 ? 'success' : row.similarity >= 70 ? 'warning' : 'info'" 
                size="small"
              >
                {{ row.similarity.toFixed(1) }}%
              </el-tag>
              <span v-else>-</span>
            </template>

            <template #originUrlSlot="{ row }">
              <el-link v-if="row.originUrl" :href="row.originUrl" target="_blank" type="primary" :underline="false" style="font-size: 12px;">
                {{ row.originUrl.length > 50 ? row.originUrl.substring(0, 50) + '...' : row.originUrl }}
              </el-link>
              <span v-else style="color: #999; font-size: 12px;">-</span>
            </template>

            <template #operationDefaultSlot="{ row }">
              <div class="flex items-center gap-1">
                <el-dropdown trigger="click" class="operation-dropdown">
                  <el-button type="primary" link size="small">
                    操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <div class="op-menu">
                      <!-- 内容相关（仅管理员） -->
                      <div 
                        v-if="isAdmin" 
                        class="op-menu-item has-submenu"
                        @mouseenter="handleSubmenuEnter"
                        @mouseleave="handleSubmenuLeave"
                      >
                        <el-icon class="op-menu-arrow"><ArrowLeft /></el-icon>
                        <span class="op-menu-label">内容相关</span>
                        <div class="op-submenu" data-submenu="content" @mouseenter="handleSubmenuKeepVisible" @mouseleave="handleSubmenuHide">
                          <div class="op-submenu-item" @click="() => handleOperationCommand('ai-generate', row)">AI自动生成内容</div>
                          <div class="op-submenu-item" @click="() => handleOperationCommand('ai-judge-infringement', row)">AI判断侵权(知名IP)</div>
                          <div class="op-submenu-item" @click="() => handleOperationCommand('view-meta', row)">查看元数据</div>
                        </div>
                      </div>

                      <!-- 发布操作（仅管理员） -->
                      <div 
                        v-if="isAdmin" 
                        class="op-menu-item has-submenu"
                        @mouseenter="handleSubmenuEnter"
                        @mouseleave="handleSubmenuLeave"
                      >
                        <el-icon class="op-menu-arrow"><ArrowLeft /></el-icon>
                        <span class="op-menu-label">发布</span>
                        <div class="op-submenu" data-submenu="publish" @mouseenter="handleSubmenuKeepVisible" @mouseleave="handleSubmenuHide">
                          <div v-if="!row.isPublish" class="op-submenu-item" @click="() => handleOperationCommand('publish', row)">发布</div>
                          <div v-else class="op-submenu-item" @click="() => handleOperationCommand('unpublish', row)">下架</div>
                        </div>
                      </div>

                      <!-- 制作操作（仅管理员） -->
                      <div 
                        v-if="isAdmin" 
                        class="op-menu-item has-submenu"
                        @mouseenter="handleSubmenuEnter"
                        @mouseleave="handleSubmenuLeave"
                      >
                        <el-icon class="op-menu-arrow"><ArrowLeft /></el-icon>
                        <span class="op-menu-label">制作</span>
                        <div class="op-submenu" data-submenu="design" @mouseenter="handleSubmenuKeepVisible" @mouseleave="handleSubmenuHide">
                          <div class="op-submenu-item" @click="() => handleOperationCommand('design-model', row)">制作设计模型</div>
                          <div class="op-submenu-item" @click="() => handleOperationCommand('link-template-2d', row)">二维模板制作商品图</div>
                          <div class="op-submenu-item" @click="() => handleOperationCommand('generate-product', row)">生成商品</div>
                          <div class="op-submenu-item" @click="() => handleOperationCommand('create-ps-set', row)">制作PS套图</div>
                        </div>
                      </div>

                      <!-- 图片操作 -->
                      <div 
                        class="op-menu-item has-submenu"
                        @mouseenter="handleSubmenuEnter"
                        @mouseleave="handleSubmenuLeave"
                      >
                        <el-icon class="op-menu-arrow"><ArrowLeft /></el-icon>
                        <span class="op-menu-label">图片操作</span>
                        <div class="op-submenu" data-submenu="image" @mouseenter="handleSubmenuKeepVisible" @mouseleave="handleSubmenuHide">
                          <div v-if="isAdmin" class="op-submenu-item" @click="() => handleOperationCommand('copy', row)">复制</div>
                          <div v-if="isAdmin" class="op-submenu-item" @click="() => handleOperationCommand('generate-phash', row)">生成哈希</div>
                          <div class="op-submenu-item" @click="() => handleOperationCommand('download', row)">下载</div>
                          <div v-if="isAdmin && (row.suffix || '').toLowerCase() === 'png'" class="op-submenu-item" @click="() => handleOperationCommand('trim-png', row)">生成无空白PNG</div>
                          <div v-if="isAdmin && (row.suffix || '').toLowerCase() === 'svg'" class="op-submenu-item" @click="() => handleOperationCommand('svg-to-png', row)">SVG转PNG</div>
                        </div>
                      </div>

                      <div v-if="isAdmin" class="op-divider"></div>
                      <div v-if="isAdmin" class="op-menu-item" @click="() => handleOperationCommand('edit', row)">
                        <span class="op-menu-arrow-placeholder"></span>
                        <span class="op-menu-label">编辑</span>
                      </div>
                      <div v-if="isAdmin" class="op-menu-item danger" @click="() => handleOperationCommand('delete', row)">
                        <span class="op-menu-arrow-placeholder"></span>
                        <span class="op-menu-label">删除</span>
                      </div>
                    </div>
                  </template>
                </el-dropdown>

                <el-icon v-if="aiTableLoading?.[row?.id]" class="is-loading ml-2" style="color:#409EFF;font-size:18px;" />
              </div>
            </template>
          </vxe-grid>
        </div>

        <!-- 分页 -->
        <div class="flex justify-end">
          <pagination
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            :total="total"
            @pagination="getList"
          />
        </div>
      </div>
    </div>

    <el-dialog
      v-model="linkTemplate2DDialogVisible"
      title="根据二维模板组制作商品图"
      fullscreen
      align-center
      class="link-2d-dialog"
    >
      <div class="link-2d-body">
        <div class="selected-materials">
          <div class="section-title">已选择素材 ({{ ids.length }})</div>
          <div class="thumbs">
            <div
              v-for="id in ids"
              :key="id"
              class="thumb"
            >
              <img :src="(dataSource.find(i => String(i.id) === String(id)) || {}).url" />
            </div>
          </div>
        </div>

        <div class="template-selector">
          <div class="section-title">选择二维模板组（可多选）</div>
          <div class="template-list">
            <div class="template-list-rows">
              <div 
                v-for="tpl in templateGroup2DOptions"
                :key="tpl.id"
                class="template-row"
                :class="{ 'is-checked': selectedTemplateGroup2DIds.includes(String(tpl.id)) }"
                @click="toggleTemplateSelection(tpl.id)"
              >
                <div class="template-checkbox">
                  <input 
                    type="checkbox" 
                    :checked="selectedTemplateGroup2DIds.includes(String(tpl.id))"
                    @change="toggleTemplateSelection(tpl.id)"
                    class="checkbox-input"
                  />
                  <div class="checkbox-custom"></div>
                </div>
                <div class="template-preview">
                  <div class="template-header">
                    <div class="template-title" :title="tpl.name">{{ tpl.name || '未命名' }}</div>
                    <div v-if="tpl.description" class="template-description">{{ tpl.description }}</div>
                  </div>
                  <div class="template-content">
                    <div class="template-images-row">
                      <div 
                        v-for="(img, index) in getTemplateImages(tpl)" 
                        :key="index"
                        class="template-image-card"
                      >
                        <div class="image-container">
                          <img 
                            :src="img" 
                            :alt="`模板图片 ${index + 1}`"
                            class="template-image"
                          />
                          <div class="image-badge">图片{{ index + 1 }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      <template #footer>
        <div class="link-2d-footer">
          <div class="result-info">
            <el-alert
              type="info"
              :closable="false"
              show-icon
              :title="`将生成 ${ids.length} × ${selectedTemplateGroup2DIds.length} = ${ids.length * selectedTemplateGroup2DIds.length} 条商品图记录`"
            />
          </div>
          <div class="footer-actions">
            <el-button @click="linkTemplate2DDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="linkingTemplate2D" @click="confirmLinkTemplate2D">确定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="uploadModalVisible"
      title="素材上传"
      width="100%"
      style="height: 100%"
      align-center
      :footer="false"
      :destroy-on-close="true"
      class="material-upload-dialog"
      @close="uploadModalClose"
    >
      <div style="height: 100%">
        <list-upload
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
      </el-form>
      
      <!-- 预览区域 -->
      <div class="preview-section">
        <div class="preview-label">图片预览</div>
        <div v-if="urlUploadForm.url && urlPreviewVisible" class="image-preview">
          <img
            :src="urlUploadForm.url"
            alt="预览图片"
            class="preview-image"
            @error="handlePreviewError"
            @load="handlePreviewLoad"
          />
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
    <el-dialog
      v-model="designModelModalVisible"
      title="制作设计模型"
      width="100%"
      style="height: 100%"
      align-center
      :destroy-on-close="true"
      class="design-model-dialog"
      :footer="null"
      @close="resetDesignModelSteps"
    >
      <!-- 新增flex容器，左右布局 -->
      <div class="design-model-flex">
        <!-- 步骤指示器，纵向 -->
        <el-steps direction="vertical" :active="currentStep" finish-status="success" align-center class="steps-vertical">
          <el-step v-for="step in designModelSteps" :key="step.key" :title="step.title" :description="step.description" />
        </el-steps>
        <!-- 步骤内容区域 -->
        <div class="design-model-content">
          <div class="steps-all">
            <!-- 步骤1：选择素材 -->
            <div
              class="step-content"
              :class="{ 'step-active': currentStep === 0, 'step-inactive': currentStep !== 0 }"
            >
              <h3 class="text-lg font-bold mb-4">已选择的素材图：</h3>
              <div class="flex flex-wrap gap-4 mb-6">
                <template v-for="id in ids" :key="id">
                  <div v-if="dataSource.find(item => String(item.id) === String(id))" class="text-center">
                    <img 
                      :src="dataSource.find(item => String(item.id) === String(id)).url" 
                      :alt="dataSource.find(item => String(item.id) === String(id)).name"
                      class="w-20 h-20 object-cover rounded border"
                    />
                    <div class="text-xs text-gray-500 mt-1">{{ dataSource.find(item => String(item.id) === String(id)).name }}</div>
                  </div>
                </template>
              </div>
              
              <div class="border border-blue-200 rounded-lg p-4">
                <div class="flex items-start">
                  <el-icon class="text-blue-500 mt-0.5 mr-2">
                    <InfoFilled />
                  </el-icon>
                  <div class="text-sm text-blue-700">
                    <p class="font-medium mb-1">已选择 {{ ids.length }} 个素材</p>
                    <p>这些素材将用于制作设计模型，请确认选择无误后点击下一步。</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 步骤2：选择设计模型 -->
            <div
              class="step-content"
              :class="{ 'step-active': currentStep === 1, 'step-inactive': currentStep !== 1 }"
            >
              <h3 class="text-lg font-bold mb-4">选择设计模型：</h3>
              
              <div class="design-model-list">
                <div v-if="designModelLoading" class="text-center py-4">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  <span class="ml-2">加载中...</span>
                </div>
                
                <div v-else-if="designModelList.length === 0" class="text-center py-4 text-gray-500">
                  暂无设计模型
                </div>
                
                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div
                    v-for="model in designModelList"
                    :key="model.id"
                    class="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-all relative"
                    :class="{ 'border-blue-500 shadow-[0_0_0_4px_rgba(64,158,255,0.6)]': selectedDesignModelIds.includes(model.id) }"
                    @click="selectDesignModel(model)"
                  >
                    <div class="flex items-center space-x-3">
                      <img
                        v-if="model.thumbnail"
                        :src="model.thumbnail"
                        :alt="model.name"
                        class="w-16 h-16 object-cover rounded"
                      />
                      <div class="flex-1 min-w-0">
                        <h4 class="font-medium truncate">{{ model.name }}</h4>
                        <p class="text-sm text-gray-500 truncate">{{ model.description || '暂无描述' }}</p>
                        <p class="text-xs text-gray-400">{{ model.createTime }}</p>
                      </div>
                    </div>
                    
                    <!-- 选中状态图标 -->
                    <div 
                      v-if="selectedDesignModelIds.includes(model.id)"
                      class="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <el-icon class="text-sm">
                        <Check />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>

              <div class=" border border-blue-200 rounded-lg p-4 mt-4">
                <div class="flex items-start">
                  <el-icon class="text-blue-500 mt-0.5 mr-2">
                    <InfoFilled />
                  </el-icon>
                  <div class="text-sm text-blue-700">
                    <p class="font-medium mb-1">已选择 {{ selectedDesignModelIds.length }} 个设计模型</p>
                    <p>将生成 {{ ids.length * selectedDesignModelIds.length }} 个新设计模型</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 步骤3：确认制作 -->
            <div
              class="step-content"
              :class="{ 'step-active': currentStep === 2, 'step-inactive': currentStep !== 2 }"
            >
              <h3 class="text-lg font-bold mb-4">确认制作信息：</h3>
              
              <div class="bg-gray-50 rounded-lg p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- 素材信息 -->
                  <div>
                    <h4 class="font-medium text-gray-700 mb-3">选择的素材 ({{ ids.length }}个)</h4>
                    <div class="space-y-2">
                      <template v-for="id in ids" :key="id">
                        <div v-if="dataSource.find(item => String(item.id) === String(id))" class="flex items-center space-x-2">
                          <img 
                            :src="dataSource.find(item => String(item.id) === String(id)).url" 
                            :alt="dataSource.find(item => String(item.id) === String(id)).name"
                            class="w-8 h-8 object-cover rounded"
                          />
                          <span class="text-sm text-gray-600">{{ dataSource.find(item => String(item.id) === String(id)).name }}</span>
                        </div>
                      </template>
                    </div>
                  </div>

                  <!-- 设计模型信息 -->
                  <div>
                    <h4 class="font-medium text-gray-700 mb-3">选择的设计模型 ({{ selectedDesignModelIds.length }}个)</h4>
                    <div class="space-y-2">
                      <template v-for="modelId in selectedDesignModelIds" :key="modelId">
                        <div v-if="designModelList.find(model => model.id === modelId)" class="flex items-center space-x-2">
                          <img 
                            v-if="designModelList.find(model => model.id === modelId).thumbnail"
                            :src="designModelList.find(model => model.id === modelId).thumbnail" 
                            :alt="designModelList.find(model => model.id === modelId).name"
                            class="w-8 h-8 object-cover rounded"
                          />
                          <span class="text-sm text-gray-600">{{ designModelList.find(model => model.id === modelId).name }}</span>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>

                <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600 mb-2">
                      {{ ids.length }} × {{ selectedDesignModelIds.length }} = {{ ids.length * selectedDesignModelIds.length }}
                    </div>
                    <div class="text-sm text-blue-700">将生成 {{ ids.length * selectedDesignModelIds.length }} 个新设计模型</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 步骤导航按钮，移到内容底部 -->
          <div class="dialog-footer" style="margin-top: 16px;">
            <div class="flex-1 text-sm text-gray-600">
              <span>步骤 {{ currentStep + 1 }} / {{ designModelSteps.length }}</span>
            </div>
            <div class="flex gap-2">
              <el-button 
                v-if="currentStep > 0"
                @click="prevStep"
              >
                上一步
              </el-button>
              <el-button 
                v-if="currentStep < designModelSteps.length - 1"
                type="primary" 
                @click="nextStep"
                :disabled="!canProceedToNextStep"
              >
                下一步
              </el-button>
              <el-button 
                v-if="currentStep === designModelSteps.length - 1"
                type="success" 
                @click="handleDesignModelConfirm"
                :disabled="!selectedDesignModelIds.length"
              >
                开始制作
              </el-button>
              <el-button @click="designModelModalVisible = false">取消</el-button>
            </div>
          </div>
        </div>
      </div>
      <!-- 移除el-dialog的footer插槽 -->
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑素材信息" width="900px" :destroy-on-close="true" align-center class="edit-material-dialog">
      <el-form :model="editForm" label-width="100px" class="edit-form">
        <el-row :gutter="20">
          <!-- 左侧：基本信息 -->
          <el-col :span="12">
            <el-form-item label="名称">
              <el-input 
                v-model="editForm.name" 
                placeholder="请输入名称" 
                clearable
              />
            </el-form-item>
          </el-col>
          <!-- 右侧：英文名称 -->
          <el-col :span="12">
            <el-form-item label="英文名称">
              <el-input 
                v-model="editForm.nameEn" 
                placeholder="请输入英文名称" 
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <!-- 左侧：描述 -->
          <el-col :span="12">
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
          <!-- 右侧：英文描述 -->
          <el-col :span="12">
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
        </el-row>

        <el-row :gutter="20">
          <!-- 左侧：关键字 -->
          <el-col :span="12">
            <el-form-item label="关键字">
              <el-input 
                v-model="editForm.keywords" 
                placeholder="请输入关键字（逗号分隔）" 
                clearable
              />
            </el-form-item>
          </el-col>
          <!-- 右侧：英文关键字 -->
          <el-col :span="12">
            <el-form-item label="英文关键字">
              <el-input 
                v-model="editForm.keywordsEn" 
                placeholder="请输入英文关键字（逗号分隔）" 
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider />

        <el-row :gutter="20">
          <!-- 自定义贴纸 -->
          <el-col :span="8">
            <el-form-item label="自定义贴纸">
              <el-switch
                v-model="editForm.isCustom"
                active-text="是"
                inactive-text="否"
              />
            </el-form-item>
          </el-col>
          <!-- 侵权状态 -->
          <el-col :span="8">
            <el-form-item label="侵权状态">
              <el-select v-model="editForm.isInfringement" placeholder="请选择" style="width: 100%">
                <el-option label="非侵权" :value="false" />
                <el-option label="侵权" :value="true" />
              </el-select>
            </el-form-item>
          </el-col>
          <!-- 发布状态 -->
          <el-col :span="8">
            <el-form-item label="发布状态">
              <el-select v-model="editForm.isPublish" placeholder="请选择" style="width: 100%">
                <el-option label="未发布" :value="false" />
                <el-option label="已发布" :value="true" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider />

        <el-form-item label="原始地址">
          <el-input 
            v-model="editForm.originUrl" 
            placeholder="请输入原始地址" 
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="editLoading" @click="submitEdit">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="aiGenDialogVisible"
      title="AI自动生成内容"
      width="500px"
      align-center
      :destroy-on-close="true"
    >
      <div style="margin-bottom: 16px; color: #888; font-size: 15px;">请输入你希望AI分析的内容风格或角度（如：偏艺术描述、简洁风格、突出色彩等）</div>
      <el-input
        v-model="aiGenPrompt"
        type="textarea"
        :rows="6"
        placeholder="如：请用艺术化语言描述图片内容..."
        style="font-size:16px;min-height:120px;width:100%;resize:vertical;"
      />
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="aiJudgeInfringementDialogVisible"
      title="AI判断侵权"
      width="600px"
      align-center
      :destroy-on-close="true"
    >
      <div style="margin-bottom: 16px; color: #666; font-size: 14px; line-height: 1.5;">
        <div style="margin-bottom: 8px; font-weight: 500; color: #333;">AI判断标准说明：</div>
        <div style="margin-bottom: 12px;">• 知名IP角色：迪士尼、漫威、DC、任天堂等公司的角色形象</div>
        <div style="margin-bottom: 12px;">• 知名品牌：Nike、Adidas、Apple、Coca-Cola等品牌标识</div>
        <div style="margin-bottom: 12px;">• 知名商标：麦当劳、星巴克、肯德基等商标</div>
        <div style="margin-bottom: 12px;">• 可能追究版权的：知名电影、游戏、动漫中的角色或场景</div>
        <div style="color: #409EFF; font-size: 13px;">注意：未知的原创设计、普通插画、风景照片等会被标记为非侵权</div>
      </div>
      <div style="margin-bottom: 16px; color: #888; font-size: 15px;">请输入你希望AI判断侵权的特定角度或要求（可选，留空则使用默认判断标准）</div>
      <el-input
        v-model="aiJudgeInfringementPrompt"
        type="textarea"
        :rows="4"
        placeholder="如：请重点关注某个特定品牌或IP..."
        style="font-size:16px;min-height:100px;width:100%;resize:vertical;"
      />
      <template #footer>
        <el-button @click="aiJudgeInfringementDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiJudgeInfringementLoading" @click="submitAiJudgeInfringementDialog">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="metaDialogVisible" fullscreen title="元数据详情" :close-on-click-modal="false">
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
          <div class="original-info" v-if="svgToPngForm.originalWidth && svgToPngForm.originalHeight">
            <el-tag type="info" size="small">
              原始尺寸: {{ svgToPngForm.originalWidth }} × {{ svgToPngForm.originalHeight }} 
              (宽高比: {{ svgToPngForm.aspectRatio.toFixed(2) }})
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
            <el-button 
              v-for="preset in sizePresets" 
              :key="preset.name"
              size="small"
              @click="applyPreset(preset)"
            >
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
    <ImagePreview
      :visible="imagePreviewVisible"
      :image-url="currentImageUrl"
      @close="closeImagePreview"
    />

    <!-- 生成关联商品弹窗 -->
    <el-dialog
      v-model="generateProductModalVisible"
      title="生成关联商品"
      width="100%"
      style="height: 100%"
      align-center
      :destroy-on-close="true"
      class="generate-product-dialog"
      :footer="null"
      @close="resetGenerateProductSteps"
    >
      <!-- 新增flex容器，左右布局 -->
      <div class="design-model-flex">
        <!-- 步骤指示器，纵向 -->
        <el-steps direction="vertical" :active="generateProductCurrentStep" finish-status="success" align-center class="steps-vertical">
          <el-step v-for="step in generateProductSteps" :key="step.key" :title="step.title" :description="step.description" />
        </el-steps>
        <!-- 步骤内容区域 -->
        <div class="design-model-content">
          <div class="steps-all">
            <!-- 步骤1：选择素材 -->
            <div
              class="step-content"
              :class="{ 'step-active': generateProductCurrentStep === 0, 'step-inactive': generateProductCurrentStep !== 0 }"
            >
              <h3 class="text-lg font-bold mb-4">已选择的素材图：</h3>
              <div class="flex flex-wrap gap-4 mb-6">
                <template v-for="id in ids" :key="id">
                  <div v-if="dataSource.find(item => String(item.id) === String(id))" class="text-center">
                    <img 
                      :src="dataSource.find(item => String(item.id) === String(id)).url" 
                      :alt="dataSource.find(item => String(item.id) === String(id)).name"
                      class="w-20 h-20 object-cover rounded border"
                    />
                    <div class="text-xs text-gray-500 mt-1">{{ dataSource.find(item => String(item.id) === String(id)).name }}</div>
                  </div>
                </template>
              </div>
              
              <div class="border border-blue-200 rounded-lg p-4">
                <div class="flex items-start">
                  <el-icon class="text-blue-500 mt-0.5 mr-2">
                    <InfoFilled />
                  </el-icon>
                  <div class="text-sm text-blue-700">
                    <p class="font-medium mb-1">已选择 {{ ids.length }} 个素材</p>
                    <p>这些素材将用于生成关联商品，请确认选择无误后点击下一步。</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 步骤2：确认生成 -->
            <div
              class="step-content"
              :class="{ 'step-active': generateProductCurrentStep === 1, 'step-inactive': generateProductCurrentStep !== 1 }"
            >
              <h3 class="text-lg font-bold mb-4">确认生成信息：</h3>
              
              <div class="bg-gray-50 rounded-lg p-6">
                <!-- 素材信息 -->
                <div>
                  <h4 class="font-medium text-gray-700 mb-3">选择的素材 ({{ ids.length }}个)</h4>
                  <div class="space-y-2">
                    <template v-for="id in ids" :key="id">
                      <div v-if="dataSource.find(item => String(item.id) === String(id))" class="flex items-center space-x-2">
                        <img 
                          :src="dataSource.find(item => String(item.id) === String(id)).url" 
                          :alt="dataSource.find(item => String(item.id) === String(id)).name"
                          class="w-8 h-8 object-cover rounded"
                        />
                        <span class="text-sm text-gray-600">{{ dataSource.find(item => String(item.id) === String(id)).name }}</span>
                      </div>
                    </template>
                  </div>
                </div>

                <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600 mb-2">
                      {{ ids.length }}
                    </div>
                    <div class="text-sm text-blue-700">将为每个素材生成 1 个新商品，共 {{ ids.length }} 个商品</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 步骤导航按钮，移到内容底部 -->
          <div class="dialog-footer" style="margin-top: 16px;">
            <div class="flex-1 text-sm text-gray-600">
              <span>步骤 {{ generateProductCurrentStep + 1 }} / {{ generateProductSteps.length }}</span>
            </div>
            <div class="flex gap-2">
              <el-button 
                v-if="generateProductCurrentStep > 0"
                @click="prevGenerateProductStep"
              >
                上一步
              </el-button>
              <el-button 
                v-if="generateProductCurrentStep < generateProductSteps.length - 1"
                type="primary" 
                @click="nextGenerateProductStep"
                :disabled="!canProceedToNextGenerateProductStep"
              >
                下一步
              </el-button>
              <el-button 
                v-if="generateProductCurrentStep === generateProductSteps.length - 1"
                type="success" 
                @click="handleGenerateProductConfirm"
                :loading="generateProductLoading"
              >
                开始生成
              </el-button>
              <el-button @click="generateProductModalVisible = false">取消</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

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
  watchEffect
} from 'vue'

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
  calculatePhash, // 新增
  aiJudgeInfringement // 新增AI判断侵权接口
} from '@/api/material' // 实际接口导入

import { uploadToCOS } from '@/api/cos'
import { uploadMaterialFile, copyStickers, trimPng, svgToPng, generateRelatedProducts } from '@/api/material'
import { stickerPsdSetApi } from '@/api/stickerPsdSet'

import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import CryptoJS from 'crypto-js'

import { useDebounceFn, useLocalStorage, useSessionStorage, useWindowSize } from '@vueuse/core'
import { sortTypeOptions, defaultSortingValue } from '@/common/sort'
import { saveAs } from 'file-saver'

import { useUserStore } from '@/store/modules/user'
import listUpload from './listUpload.vue'
import { materialConfig, getMaterialConfig, categoryOptions } from '@/views/material/collect/index'
import { ElButton, ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, Search, TopRight, Upload, Loading, Check, More, InfoFilled, ArrowDown, ArrowRight, ArrowLeft, Edit, Download, Picture, MagicStick, Key, Document, Warning, PictureFilled, Grid, DocumentCopy } from '@element-plus/icons-vue'
import tree from './tree.vue'
import { materialStatusOptions } from '.'
import { psdTemplateApi } from '@/api/psdTemplate'
import { formatDate } from '@/utils/formatTime'
import { getTitleTemplateList } from '@/api/publish'
import { downloadCrossOriginImage, downloadFileByElement, downloadImage } from '@/common/download'
import { useRouter } from 'vue-router'
import { getConfigTemplateList } from '@/api/publish/config'
import genPicture from './genPicture.vue'
import { getAccessToken } from '@/utils/auth'
import { getTenantId } from '@/utils/auth'
import useListSelect from '@/components/common/userListSelect.vue'
import { getDesignModelList } from '@/api/designModel'
import { getDesignToolMessenger } from '@/utils/designToolMessenger'
import request from '@/config/axios'
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import { pageTemplateGroup2D } from '@/api/templateGroup2D'
import { createProductImage2D, batchCreateProductImage2D } from '@/api/productImage2D'

const userStore = useUserStore()

// 判断是否为管理员
const isAdmin = computed(() => userStore.user?.isAdmin ?? false)

const form = ref({})

const queryParams = reactive({
  currentPage: 1,
  pageSize: 10,
  keyword: '',
  imageName: '', // 按名称搜索
  sortingFields: 'createTime DESC', // 排序字段
  startTime: '',
  endTime: '',
  suffix: '', // 新增后缀参数
  id: '', // 新增ID精确查询参数
  phash: '', // phash值
  isCustom: null, // 新增自定义贴纸过滤参数，使用null而不是空字符串
  isInfringement: null, // 新增侵权状态过滤参数
  isPublish: null, // 新增发布状态过滤参数
  random: false, // 是否随机
})

// 展示模式
const picMode = useLocalStorage('material_view_mode', false)

watch(picMode, () => {
  ids.value = []
})

const gridRef = ref()

function resetCheckStatus() {
  if (gridRef.value?.clearCheckboxRow) {
    gridRef.value?.clearCheckboxRow()
  }
  if (gridRef.value?.clearCheckboxReserve) {
    gridRef.value?.clearCheckboxReserve()
  }
  ids.value = []
}

const gridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: 'id'
  },
  checkboxConfig: {
    reserve: true
  },
  columns: [
    { type: 'checkbox' as const, field: 'checkbox', title: '', width: 50, ellipsis: true, reserve: true, minWidth: 50, fixed: 'left' as const, className: '' as any },
    // { title: 'ID', field: 'id', width: 80, ellipsis: true },
    {
      title: '图片预览',
      field: 'url',
      width: 120,
      slots: { default: 'previewDefaultSlot' }
    },
    { title: '图片名称', field: 'name', minWidth: 220, className: 'font-bold', slots: { default: 'nameTextSlot' } },
    { title: '英文名称', field: 'nameEn', minWidth: 220, slots: { default: 'nameEnTextSlot' } },
    { title: '描述', field: 'description', minWidth: 260, slots: { default: 'descriptionTextSlot' } },
    { title: '英文描述', field: 'descriptionEn', minWidth: 260, slots: { default: 'descriptionEnTextSlot' } },
    { title: '关键词', field: 'keywords', minWidth: 240, slots: { default: 'keywordsTextSlot' } },
    { title: '英文关键词', field: 'keywordsEn', minWidth: 240, slots: { default: 'keywordsEnTextSlot' } },
    { title: '后缀', field: 'suffix', width: 80, }, // 新增后缀列
    { title: '感知哈希', field: 'phash', width: 80,  }, // 新增哈希列
    { 
      title: '相似度', 
      field: 'similarity', 
      width: 80,
      slots: { default: 'similaritySlot' }
    }, // 新增相似度列
    { title: 'ID', field: 'id', width: 80,  }, // 新增ID列
    { title: '原始地址', field: 'originUrl', minWidth: 200, ellipsis: true, slots: { default: 'originUrlSlot' } }, // 原始地址列
    { 
      title: '自定义贴纸', 
      field: 'isCustom', 
      width: 100,
      slots: { default: 'isCustomSlot' }
    },
    { 
      title: '侵权状态', 
      field: 'isInfringement', 
      width: 100,
      slots: { default: 'isInfringementSlot' }
    },
    { 
      title: '发布状态', 
      field: 'isPublish', 
      width: 100,
      slots: { default: 'isPublishSlot' }
    },
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
    {
      title: '操作',
      fixed: 'right',
      width: 'auto',
      field: 'operation',
      slots: { default: 'operationDefaultSlot' }
    }
  ]
})

const { height } = useWindowSize()

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 200
})

const dataSource = ref([])
const loading = ref(false)
const open = ref(false)
const title = ref('')
const ids = ref<string[]>([])
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

const designModelModalVisible = ref(false)
const filterDialogVisible = ref(false)
const isMobile = ref(false)
const actionsCollapsed = ref(true)

// PS 套图制作
const psdSetDialogVisible = ref(false)
const psdSetTemplates = ref<any[]>([])
const psdSetTemplatesLoading = ref(false)
const selectedPsdTemplateIds = ref<string[]>([])
const psdSetSubmitting = ref(false)

// 设计模型相关
const designModelList = ref([])
const designModelLoading = ref(false)
const selectedDesignModelIds = ref([])

// 分步骤相关
const currentStep = ref(0)
const designModelSteps = ref([
  {
    key: 'select-materials',
    title: '选择素材',
    description: '确认要使用的素材'
  },
  {
    key: 'select-models',
    title: '选择设计模型',
    description: '选择要应用的设计模型'
  },
  {
    key: 'confirm',
    title: '确认制作',
    description: '确认制作信息并开始制作'
  }
])

// 计算是否可以进入下一步
const canProceedToNextStep = computed(() => {
  switch (currentStep.value) {
    case 0: // 选择素材步骤
      return ids.value.length > 0
    case 1: // 选择设计模型步骤
      return selectedDesignModelIds.value.length > 0
    case 2: // 确认制作步骤
      return true
    default:
      return false
  }
})

// 步骤导航方法
function nextStep() {
  if (currentStep.value < designModelSteps.value.length - 1 && canProceedToNextStep.value) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 重置步骤状态
function resetDesignModelSteps() {
  currentStep.value = 0
  selectedDesignModelIds.value = []
}

// 生成商品相关
const generateProductModalVisible = ref(false)
const generateProductCurrentStep = ref(0)
const generateProductLoading = ref(false)

const generateProductSteps = ref([
  {
    key: 'select-materials',
    title: '选择素材',
    description: '确认要使用的素材'
  },
  {
    key: 'confirm',
    title: '确认生成',
    description: '确认生成信息并开始生成'
  }
])

// 计算是否可以进入下一步（生成商品）
const canProceedToNextGenerateProductStep = computed(() => {
  switch (generateProductCurrentStep.value) {
    case 0: // 选择素材步骤
      return ids.value.length > 0
    case 1: // 确认生成步骤
      return true
    default:
      return false
  }
})

// 步骤导航方法（生成商品）
function nextGenerateProductStep() {
  if (generateProductCurrentStep.value < generateProductSteps.value.length - 1 && canProceedToNextGenerateProductStep.value) {
    generateProductCurrentStep.value++
  }
}

function prevGenerateProductStep() {
  if (generateProductCurrentStep.value > 0) {
    generateProductCurrentStep.value--
  }
}

// 重置步骤状态（生成商品）
function resetGenerateProductSteps() {
  generateProductCurrentStep.value = 0
}

// 确认生成关联商品
async function handleGenerateProductConfirm() {
  generateProductLoading.value = true
  try {
    // 直接根据贴纸生成商品，不传商品模型ID
    const res = await generateRelatedProducts({
      stickerIds: ids.value.map(String)
    })
    
    ElMessage.success(`成功生成 ${res.total} 个商品`)
    generateProductModalVisible.value = false
    resetGenerateProductSteps()
    getList() // 刷新列表
  } catch (error) {
    console.error('生成商品失败:', error)
    ElMessage.error(`生成商品失败: ${error.message || '未知错误'}`)
  } finally {
    generateProductLoading.value = false
  }
}

// 处理单个素材的生成关联商品
async function handleGenerateProduct(row) {
  ids.value = [row.id]
  resetGenerateProductSteps()
  generateProductModalVisible.value = true
}

// 处理上传

const uploadModalVisible = ref(false)

function uploadModalClose() {}

async function getList() {
  loading.value = true
  let res = await getMaterialList({
    ...queryParams
  }).finally(() => {
    loading.value = false
  })
  dataSource.value = res.list
  total.value = res.total
}

// phash相似图片搜索
async function handlePhashSearch() {
  // 去除phash值的前后空格
  queryParams.phash = queryParams.phash.trim()
  
  if (!queryParams.phash) {
    ElMessage.warning('请输入phash值')
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
      resetCheckStatus()
      getList()
    })
    .catch(() => {})
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
    
    img.onload = function() {
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
    
    img.onerror = function() {
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

async function handleDesignModel(row) {
  // 设置当前选中的素材为单个素材
  ids.value = [row.id]
  resetDesignModelSteps()
  designModelModalVisible.value = true
  await loadDesignModels()
}

async function openPsdSetDialog(row?: any) {
  if (row) {
    ids.value = [row.id]
  } else if (!ids.value.length) {
    ElMessage.warning('请选择要制作的素材')
    return
  }
  psdSetDialogVisible.value = true
  await loadPsdTemplatesForPsdSet()
}

async function loadPsdTemplatesForPsdSet() {
  psdSetTemplatesLoading.value = true
  try {
    const res = await psdTemplateApi.getPsdTemplatePage({
      currentPage: 1,
      pageSize: 200
    })
    psdSetTemplates.value = res.list || []
  } catch (error) {
    console.error('加载PSD模板失败:', error)
    ElMessage.error('加载PSD模板失败')
  } finally {
    psdSetTemplatesLoading.value = false
  }
}

function togglePsdTemplate(templateId: string | number) {
  const id = String(templateId)
  const index = selectedPsdTemplateIds.value.indexOf(id)
  if (index > -1) {
    selectedPsdTemplateIds.value.splice(index, 1)
  } else {
    selectedPsdTemplateIds.value.push(id)
  }
}

function resetPsdSetState() {
  selectedPsdTemplateIds.value = []
}

// 处理PSD模板缩略图加载错误
function handleTemplateImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

async function handleCreatePsdSets() {
  if (!ids.value.length) {
    return ElMessage.warning('请先勾选素材')
  }
  if (!selectedPsdTemplateIds.value.length) {
    return ElMessage.warning('请选择PSD模板')
  }
  psdSetSubmitting.value = true
  try {
    const res = await stickerPsdSetApi.batchCreate({
      stickerIds: ids.value.map((id) => String(id)),
      psdTemplateIds: [...selectedPsdTemplateIds.value]
    })
    const total = res?.total ?? ids.value.length * selectedPsdTemplateIds.value.length
    ElMessage.success(`成功创建 ${total} 条套图任务`)
    psdSetDialogVisible.value = false
    resetPsdSetState()
  } catch (error: any) {
    console.error('创建套图失败:', error)
    ElMessage.error(error?.message || '创建套图失败')
  } finally {
    psdSetSubmitting.value = false
  }
}

// 处理单个素材的二维模板制作
async function handleLinkTemplate2D(row) {
  // 设置当前选中的素材为单个素材
  ids.value = [row.id]
  await openLinkTemplate2D(row)
}

async function loadDesignModels() {
  designModelLoading.value = true
  try {
    // 只查母版模型
    const res = await getDesignModelList({
      currentPage: 1,
      pageSize: 100,
      isTemplate: true
    })
    designModelList.value = res.list || []
  } catch (error) {
    console.error('加载设计模型失败:', error)
    ElMessage.error('加载设计模型失败')
  } finally {
    designModelLoading.value = false
  }
}



function selectDesignModel(model) {
  const index = selectedDesignModelIds.value.indexOf(model.id)
  if (index > -1) {
    // 如果已选中，则取消选中
    selectedDesignModelIds.value.splice(index, 1)
  } else {
    // 如果未选中，则添加到选中列表
    selectedDesignModelIds.value.push(model.id)
  }
}

function handleDesignModelConfirm() {
  if (!selectedDesignModelIds.value.length) {
    ElMessage.warning('请选择设计模型')
    return
  }
  
  // 打印最终数据
  console.log('素材图ID数组:', ids.value)
  console.log('设计模型ID数组:', selectedDesignModelIds.value)
  
  // 发送数据到设计工具
  const designToolMessenger = getDesignToolMessenger()
  const childWindow = designToolMessenger.getChildWindow()

  const success = designToolMessenger.sendDesignModelData({
    materialIds: Array.isArray(ids.value) ? [...ids.value] : [],
    designModelIds: selectedDesignModelIds.value
  })
  
  if (success) {
    ElMessage.success('数据已发送到设计工具')
    if (childWindow && typeof childWindow.focus === 'function') {
      childWindow.focus()
    }
    // 关闭弹窗并重置步骤
    designModelModalVisible.value = false
    resetDesignModelSteps()
  }
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
const aiGenDialogLoading = ref(false)
let aiGenRow = null

const aiJudgeInfringementDialogVisible = ref(false)
const aiJudgeInfringementPrompt = ref('')
const aiJudgeInfringementLoading = ref(false)
let aiJudgeInfringementRow = null

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
  aiGenDialogVisible.value = true
}

function onAiJudgeInfringement(row) {
  if (aiTableLoading.value[row.id]) return
  aiJudgeInfringementRow = row
  aiJudgeInfringementPrompt.value = ''
  aiJudgeInfringementDialogVisible.value = true
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
    }, aiGenPrompt.value)
  } catch (e) {
    aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: false }
    aiGenDialogLoading.value = false
    aiGenDialogVisible.value = false
    aiGenRow = null
  }
}

async function submitAiJudgeInfringementDialog() {
  if (!aiJudgeInfringementRow) return
  aiJudgeInfringementLoading.value = true
  aiTableLoading.value = { ...aiTableLoading.value, [aiJudgeInfringementRow.id]: true }
  try {
    await handleAiJudgeInfringement(aiJudgeInfringementRow, () => {
      aiTableLoading.value = { ...aiTableLoading.value, [aiJudgeInfringementRow.id]: false }
      aiJudgeInfringementLoading.value = false
      aiJudgeInfringementDialogVisible.value = false
      aiJudgeInfringementRow = null
    }, aiJudgeInfringementPrompt.value)
  } catch (e) {
    aiTableLoading.value = { ...aiTableLoading.value, [aiJudgeInfringementRow.id]: false }
    aiJudgeInfringementLoading.value = false
    aiJudgeInfringementDialogVisible.value = false
    aiJudgeInfringementRow = null
  }
}

async function handleAiAutoGenerate(row, cb, prompt) {
  try {
    const res = await aiAutoGenerateMaterialInfo({
      id: row.id,
      prompt: prompt || ''
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
    }
    ElNotification.success('AI自动生成内容成功')
    if (typeof cb === 'function') cb()
    getList()
  } catch (e) {
    ElNotification.error('AI自动生成内容失败')
    if (typeof cb === 'function') cb()
  }
}

async function handleAiJudgeInfringement(row, cb, prompt) {
  try {
    const res = await aiJudgeInfringement({
      id: row.id,
      prompt: prompt || ''
    })
    
    // 更新行数据
    if (res) {
      row.isInfringement = res.isInfringement
      
      // 显示AI判断结果
      const resultText = res.isInfringement ? '侵权' : '非侵权'
      const resultType = res.isInfringement ? 'warning' : 'success'
      
      ElNotification({
        title: 'AI判断侵权完成',
        message: `判断结果：${resultText}，置信度：${(res.confidence * 100).toFixed(1)}%，理由：${res.reason}`,
        duration: 5000,
        type: resultType
      })
    }
    
    if (typeof cb === 'function') cb()
    getList()
  } catch (e) {
    ElNotification.error(`AI判断侵权失败：${e.message || '未知错误'}`)
    if (typeof cb === 'function') cb()
  }
}

async function handleGeneratePhash(row) {
  if (!row.url) {
    ElMessage.error('图片无有效链接，无法生成哈希');
    return;
  }
  try {
    const { phash } = await calculatePhash({ url: row.url, ext: row.suffix || 'jpg' });
    if (phash) {
      row.phash = phash;
      ElMessage.success('哈希生成成功: ' + phash);
      // 可选：自动保存到后端
      await updateAssetLibrary({ id: row.id, phash });
      getList();
    } else {
      ElMessage.warning('哈希生成失败');
    }
  } catch (e) {
    ElMessage.error('哈希生成失败');
  }
}

// 发布贴纸
async function handlePublish(row) {
  try {
    await updateAssetLibrary({ id: row.id, isPublish: true });
    row.isPublish = true;
    ElMessage.success('发布成功');
    getList();
  } catch (e) {
    ElMessage.error('发布失败');
  }
}

// 下架贴纸
async function handleUnpublish(row) {
  try {
    await updateAssetLibrary({ id: row.id, isPublish: false });
    row.isPublish = false;
    ElMessage.success('下架成功');
    getList();
  } catch (e) {
    ElMessage.error('下架失败');
  }
}

// 批量发布
async function handleBatchPublish() {
  if (!ids.value.length) {
    return ElMessage.warning('请选择要发布的素材');
  }
  
  try {
    const promises = ids.value.map(id => 
      updateAssetLibrary({ id, isPublish: true })
    );
    await Promise.all(promises);
    ElMessage.success(`成功发布 ${ids.value.length} 个素材`);
    resetCheckStatus();
    getList();
  } catch (e) {
    ElMessage.error('批量发布失败');
  }
}

// 批量下架
async function handleBatchUnpublish() {
  if (!ids.value.length) {
    return ElMessage.warning('请选择要下架的素材');
  }
  
  try {
    const promises = ids.value.map(id => 
      updateAssetLibrary({ id, isPublish: false })
    );
    await Promise.all(promises);
    ElMessage.success(`成功下架 ${ids.value.length} 个素材`);
    resetCheckStatus();
    getList();
  } catch (e) {
    ElMessage.error('批量下架失败');
  }
}

const editDialogVisible = ref(false)
const editForm = ref({ id: '', name: '', nameEn: '', description: '', descriptionEn: '', keywords: '', keywordsEn: '', isCustom: false, isInfringement: false, isPublish: false, originUrl: '' })
const editLoading = ref(false)

// 其他缺少的变量
const currentUploadInfo = ref({ path: '' })
const currentGenPictureConfig = ref([])
const genPicturesForm = ref({})
const genPicturesFormRules = ref({})
const genPicturesModalVisible = ref(false)

// 配置变更函数
function configChange(config) {
  currentGenPictureConfig.value = config
}

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
    isCustom: row.isCustom || false,
    isInfringement: row.isInfringement || false,
    isPublish: row.isPublish || false,
    originUrl: row.originUrl || ''
  }
  editDialogVisible.value = true
}

// 关联二维模板组
const linkTemplate2DDialogVisible = ref(false)
const selectedTemplateGroup2DId = ref('') // 保留以兼容旧逻辑（未使用）
const selectedTemplateGroup2DIds = ref<string[]>([])
const linkingTemplate2D = ref(false)
const templateGroup2DOptions = ref<any[]>([])
let linkRow: any = null

async function openLinkTemplate2D(row: any) {
  linkRow = row
  selectedTemplateGroup2DId.value = ''
  selectedTemplateGroup2DIds.value = []
  linkTemplate2DDialogVisible.value = true
  try {
    const res = await pageTemplateGroup2D({ page: 1, pageSize: 200 })
    templateGroup2DOptions.value = res.list || []
  } catch (e) {
    ElMessage.error('加载二维模板组失败')
  }
}

// 获取模板的所有图片
function getTemplateImages(tpl) {
  const images = []
  for (let i = 1; i <= 10; i++) {
    const imageKey = `image${i}`
    if (tpl[imageKey]) {
      images.push(tpl[imageKey])
    }
  }
  return images
}

// 获取模板图片的配置信息
function getTemplateImageConfig(tpl, imageIndex) {
  try {
    const imageOptionKey = `imageOption${imageIndex}`
    const imageOption = tpl[imageOptionKey]
    if (!imageOption) return null
    
    const config = typeof imageOption === 'string' ? JSON.parse(imageOption) : imageOption
    return config
  } catch (error) {
    console.error('解析模板配置失败:', error)
    return null
  }
}

// 切换模板选择
function toggleTemplateSelection(templateId) {
  const idStr = String(templateId)
  const index = selectedTemplateGroup2DIds.value.indexOf(idStr)
  if (index > -1) {
    selectedTemplateGroup2DIds.value.splice(index, 1)
  } else {
    selectedTemplateGroup2DIds.value.push(idStr)
  }
}

async function confirmLinkTemplate2D() {
  if (!selectedTemplateGroup2DIds.value.length) {
    ElMessage.warning('请选择二维模板组')
    return
  }

  function toggleTemplate2D(id: string) {
    const key = String(id)
    const idx = selectedTemplateGroup2DIds.value.indexOf(key)
    if (idx >= 0) {
      selectedTemplateGroup2DIds.value.splice(idx, 1)
    } else {
      selectedTemplateGroup2DIds.value.push(key)
    }
  }
  try {
    linkingTemplate2D.value = true
    const materialIds = linkRow ? [String(linkRow.id)] : (Array.isArray(ids.value) ? [...ids.value] : [])
    if (!materialIds.length) {
      ElMessage.warning('请先勾选素材或从行操作进入')
      return
    }
    await batchCreateProductImage2D({ materialIds: materialIds.map(String), templateGroup2DIds: [...selectedTemplateGroup2DIds.value] })
    ElMessage.success(`制作成功，共 ${materialIds.length * selectedTemplateGroup2DIds.value.length} 条`) 
    linkTemplate2DDialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(`关联失败：${e?.message || ''}`)
  } finally {
    linkingTemplate2D.value = false
  }
}

async function submitEdit() {
  editLoading.value = true
  try {
    await updateAssetLibrary(editForm.value)
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


// 处理图片加载完成事件
function handleImageLoad(event: Event, row: any) {
  const img = event.target as HTMLImageElement
  if (img.naturalWidth && img.naturalHeight) {
    // 将图片尺寸信息存储到行数据中
    row.imageDimensions = {
      width: img.naturalWidth,
      height: img.naturalHeight
    }
    console.log(`图片 ${row.name || row.id} 尺寸: ${img.naturalWidth} × ${img.naturalHeight}`)
  } else {
    console.warn(`图片 ${row.name || row.id} 无法获取尺寸信息`)
  }
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

defineExpose({ handleGeneratePhash });



// 处理dropdown操作命令
function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case 'edit':
      handleEdit(row);
      break;
    case 'download':
      handleDownload(row);
      break;
    case 'design-model':
      handleDesignModel(row);
      break;
    case 'link-template-2d':
      handleLinkTemplate2D(row);
      break;
    case 'ai-generate':
      onAiTableAutoGenerate(row);
      break;
    case 'ai-judge-infringement':
      onAiJudgeInfringement(row);
      break;
    case 'generate-phash':
      handleGeneratePhash(row);
      break;
    case 'publish':
      handlePublish(row);
      break;
    case 'unpublish':
      handleUnpublish(row);
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
    case 'generate-product':
      handleGenerateProduct(row);
      break;
    case 'create-ps-set':
      openPsdSetDialog(row);
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
  isPublish: false
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
  urlUploadForm.isPublish = false
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
  submenu.style.left = `${left}px`
  submenu.style.top = `${top}px`
  submenu.style.opacity = '1'
  submenu.style.visibility = 'visible'
  submenu.style.transform = 'translateX(0)'
  submenu.style.pointerEvents = 'auto'
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
    const cos = await uploadToCOS({ file })
    const { key, url } = cos
    
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
      isPublish: urlUploadForm.isPublish,
      uploaderId: userStore.user?.id
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
}

</script>

<style scoped>
.link-2d-dialog :deep(.el-dialog__body) { height: calc(100vh - 120px); display: flex; flex-direction: column; overflow: hidden; }
.design-model-dialog :deep(.el-dialog__body) { max-height: calc(100vh - 160px); overflow: hidden; }
.design-model-flex { height: 100%; overflow: hidden; }
.design-model-content { max-height: calc(100vh - 80px); overflow: auto; }
.link-2d-body { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; flex: 1; overflow: hidden; min-height: 0; height: 100%; }
.link-2d-footer { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 12px; }
.link-2d-footer .result-info { flex: 1; min-width: 0; }
.link-2d-footer .footer-actions { display: flex; gap: 8px; }
.selected-materials { display: flex; flex-direction: column; min-height: 0; overflow: hidden; height: 100%; }
.selected-materials .thumbs { display: flex; flex-wrap: wrap; gap: 8px; }
.selected-materials .thumb { width: 72px; height: 72px; border: 1px solid var(--el-border-color); border-radius: 4px; overflow: hidden; background: var(--el-fill-color-lighter); }
.selected-materials .thumb img { width: 100%; height: 100%; object-fit: cover; }
.template-selector { display: flex; flex-direction: column; min-height: 0; overflow: hidden; height: 100%; }
.template-selector .template-list { min-height: 320px; max-height: calc(100vh - 200px); overflow: auto; border: 1px solid var(--el-border-color); border-radius: 4px; padding: 8px; width: 100%; }
.template-selector .section-title { margin-top: 8px; }
.template-selector .template-list-rows { display: flex; flex-direction: column; gap: 10px; }
.template-selector .template-row { 
  display: flex; 
  align-items: flex-start; 
  gap: 16px; 
  padding: 16px; 
  border: 2px solid var(--el-border-color); 
  border-radius: 12px; 
  background: transparent; 
  width: 100%; 
  min-height: auto; 
  transition: all 0.3s ease;
  cursor: pointer;
}

.template-checkbox {
  position: relative;
  flex-shrink: 0;
  margin-top: 4px;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid var(--el-border-color);
  border-radius: 4px;
  background: white;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-input:checked + .checkbox-custom {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.template-selector .template-list-rows {
  width: 100%;
  overflow: visible;
}

.template-selector .template-list {
  overflow-x: auto;
  overflow-y: auto;
}
.template-selector .template-row:hover { 
  border-color: var(--el-color-primary); 
  box-shadow: 0 4px 12px rgba(64,158,255,0.12); 
  background: rgba(64,158,255,0.06); 
}
.template-selector .template-row.is-checked { 
  border-color: var(--el-color-primary); 
  box-shadow: 0 0 0 2px var(--el-color-primary) inset; 
  background: rgba(64,158,255,0.08);
}

.template-preview {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  flex: 1;
  overflow: visible;
}

.template-header {
  margin-bottom: 12px;
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

.template-images-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
  overflow: visible;
  min-width: 0;
}

.template-image-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color-page);
  transition: all 0.2s ease;
  min-width: 120px;
  flex: 0 0 auto;
  overflow: visible;
}

.template-image-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: var(--el-color-primary);
}

.image-container {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
}

.template-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
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
.template-selector .row-actions { display: flex; align-items: center; gap: 8px; }
.template-selector .check-indicator { width: 14px; height: 14px; border: 2px solid var(--el-border-color); border-radius: 50%; display: inline-block; }
.template-selector .check-indicator.checked { border-color: var(--el-color-primary); background: var(--el-color-primary); }
.section-title { font-size: 14px; color: var(--el-text-color-regular); margin-bottom: 8px; }
.result-info { grid-column: 1 / -1; }
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
.flex.pb-4, .search-bar {
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.flex.pb-4 > *, .search-bar > * {
  margin-bottom: 0;
}
@media (max-width: 600px) {
  .flex.pb-4, .search-bar {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
    padding-bottom: 8px !important;
  }
  .flex.pb-4 > *, .search-bar > * {
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
  background: rgba(64, 158, 255, 0.10) !important; /* 高亮：主色+透明 */
  opacity: 1;
}
.step-inactive {
  background: rgba(100, 100, 100, 0.06) !important; /* 弱化：深灰+透明 */
  opacity: 0.6;
  filter: grayscale(0.2);
}
/* 去除步骤内容内部的白色/灰色背景 */
.bg-gray-50,
.border-blue-200,
.bg-blue-50 {
  background: transparent !important;
  border-color: rgba(64,158,255,0.15) !important;
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
  color: #303133;
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
</style>
  <style scoped>
  .op-menu { 
    min-width: 120px; 
    padding: 1px 0; 
    position: relative;
    overflow: visible !important; /* 确保菜单本身允许溢出 */
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
    overflow: visible !important; /* 确保菜单项允许溢出 */
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
    position: fixed; /* 使用 fixed 定位，避免被父容器裁剪 */
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
    z-index: 9999; /* 提高 z-index 确保在最上层 */
    white-space: nowrap;
    pointer-events: none; /* 初始禁用交互，hover 时启用 */
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
    pointer-events: auto; /* hover 时启用交互 */
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
  
  <!-- 非 scoped 样式，用于覆盖 Element Plus 的默认样式 -->
  <style>
  /* 全局样式：确保 dropdown popper 允许溢出显示子菜单 */
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

  <!-- 编辑素材表单样式 -->
  <style scoped>
  .edit-material-dialog :deep(.el-dialog__body) {
    padding: 24px;
  }

  .edit-form {
    padding: 0;
  }

  .edit-form :deep(.el-form-item) {
    margin-bottom: 22px;
  }

  .edit-form :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--el-text-color-regular);
  }

  .edit-form :deep(.el-row) {
    margin-bottom: 0;
  }

  .edit-form :deep(.el-divider) {
    margin: 20px 0;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  /* 响应式布局 */
  @media (max-width: 768px) {
    .edit-material-dialog {
      width: 95% !important;
    }

    .edit-form :deep(.el-col) {
      margin-bottom: 0;
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
}
.psd-set-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(240px, 0.8fr) minmax(360px, 1.6fr);
  gap: 16px;
  width: 100%;
  overflow-y: auto;
  padding-right: 4px;
}
.psd-set-materials,
.psd-set-templates {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 16px;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.psd-set-materials .thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.psd-set-materials .thumb {
  width: 64px;
  height: 64px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
}
.psd-set-materials .thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.psd-set-templates .template-list {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
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
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
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
.psd-set-templates .template-title {
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.psd-set-templates .template-description {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
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
.psd-set-footer {
  display: flex;
  align-items: center;
  gap: 16px;
}
.psd-set-footer .footer-actions {
  display: flex;
  gap: 12px;
}
  </style>