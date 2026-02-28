<template>
  <div class="flex gap-3 overflow-visible">
    <div class="relative flex-shrink-0 z-[200] !overflow-visible" :class="folderTreeCollapsed ? 'w-0' : 'w-[280px]'">
      <div class="h-full overflow-hidden">
        <div class="h-full w-[280px]">
          <ContentWrap class="!p-0 h-full">
            <FolderTree v-model="queryParams.folderId" folder-category="product" width="100%" :show-border="false"
              class="h-full" @change="handleFolderChange" />
          </ContentWrap>
        </div>
      </div>
      <div
        class="absolute top-1/2 -right-4 w-8 h-16 bg-white border border-gray-200 rounded-r flex items-center justify-center cursor-pointer shadow-md z-[999] hover:bg-gray-50 text-[var(--el-text-color-primary)] hover:text-primary transition-colors"
        @click="folderTreeCollapsed = !folderTreeCollapsed" style="transform: translateY(-50%)">
        <el-icon :size="14">
          <DArrowRight v-if="folderTreeCollapsed" />
          <DArrowLeft v-else />
        </el-icon>
      </div>
    </div>
    <ContentWrap class="flex-1 min-w-0">
      <!-- 折叠状态：显示常用搜索和操作 -->
      <div v-show="actionsCollapsed" class="py-4 flex flex-wrap items-center gap-3 justify-end">
        <div style="flex: 1"></div>
        <form-item label="按ID搜索">
          <el-input v-model="queryParams.id" clearable placeholder="输入ID" style="width: 160px"
            @keyup.enter="handleSearch" @clear="handleSearch" />
        </form-item>
        <form-item label="按产品代码">
          <el-input v-model="queryParams.code" clearable placeholder="输入产品代码" style="width: 160px"
            @keyup.enter="handleSearch" @clear="handleSearch" />
        </form-item>
        <form-item label="搜索">
          <el-input v-model="queryParams.searchText" clearable placeholder="请输入搜索内容" style="width: 160px"
            @keyup.enter="handleSearch" @clear="handleSearch" />
        </form-item>
        <form-item label="随机顺序">
          <el-switch v-model="queryParams.random" active-text="" inactive-text="" size="small" @change="handleSearch" />
        </form-item>
        <form-item label="显示关联信息">
          <el-switch v-model="showRelations" active-text="" inactive-text="" size="small"
            @change="handleShowRelationsChange" />
        </form-item>
        <form-item class="date-range-picker">
          <DateRangePicker
            @change="(val) => { queryParams.startTime = val.start; queryParams.endTime = val.end; handleSearch() }" />
        </form-item>
        <el-button type="primary" @click="handleSearch" :icon="Search"> 搜索 </el-button>
        <el-button type="info" :icon="Grid" @click="actionsCollapsed = !actionsCollapsed">
          展开筛选
        </el-button>
      </div>

      <!-- 展开状态：显示全部搜索功能 -->
      <div v-show="!actionsCollapsed" class="py-4 flex flex-wrap items-center gap-3 justify-end">
        <div style="flex: 1"></div>
        <form-item label="按ID搜索">
          <el-input v-model="queryParams.id" clearable placeholder="输入ID" style="width: 160px"
            @keyup.enter="handleSearch" @clear="handleSearch" />
        </form-item>
        <form-item label="按产品代码">
          <el-input v-model="queryParams.code" clearable placeholder="输入产品代码" style="width: 160px"
            @keyup.enter="handleSearch" @clear="handleSearch" />
        </form-item>
        <form-item label="搜索">
          <el-input v-model="queryParams.searchText" clearable placeholder="请输入搜索内容" style="width: 160px"
            @keyup.enter="handleSearch" @clear="handleSearch" />
        </form-item>
        <form-item label="随机顺序">
          <el-switch v-model="queryParams.random" active-text="" inactive-text="" size="small" @change="handleSearch" />
        </form-item>
        <form-item label="显示关联信息">
          <el-switch v-model="showRelations" active-text="" inactive-text="" size="small"
            @change="handleShowRelationsChange" />
        </form-item>
        <form-item class="date-range-picker">
          <DateRangePicker
            @change="(val) => { queryParams.startTime = val.start; queryParams.endTime = val.end; handleSearch() }" />
        </form-item>
        <el-button type="primary" @click="handleSearch" :icon="Search"> 搜索 </el-button>

        <!-- 操作按钮（自适应换行，尽量靠右） -->
        <div class="shrink-0 ml-auto flex gap-2">
          <!-- 修改按钮 -->
          <el-button type="primary" :disabled="single" @click="handleAdd" :icon="Plus">
            新增
          </el-button>
          <!-- 删除按钮 -->
          <el-button type="danger" :icon="Delete" @click="handleDelete(null)">
            批量删除
          </el-button>
          <!-- 批量移动 -->
          <el-button type="warning" :disabled="!selectedRows.length" @click="handleOpenBatchMove" :icon="Folder">
            批量移动
          </el-button>
          <!-- 批量发布/下架 -->
          <el-button type="success" :disabled="!selectedRows.length" @click="batchPublish" :icon="Share">
            批量发布
          </el-button>
          <el-button type="warning" :disabled="!selectedRows.length" @click="batchUnpublish" :icon="Refresh">
            批量下架
          </el-button>
          <el-button type="info" :icon="Grid" @click="actionsCollapsed = !actionsCollapsed">
            收起筛选
          </el-button>
        </div>
      </div>

      <!-- 表格展示 -->
      <div class="common-table">
        <vxe-grid v-bind="gridOptions" :data="dataSource" :loading="loading" @checkbox-change="checkboxChange"
          @checkbox-all="checkboxAllChange">

          <template #operationDefaultSlot="{ row }">
            <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)"
              class="operation-dropdown" size="small">
              <el-button type="primary" link size="small">
                操作<el-icon class="el-icon--right">
                  <ArrowDown />
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu class="operation-menu-compact">
                  <!-- 基础操作 -->
                  <el-dropdown-item command="view-detail">
                    <el-icon>
                      <View />
                    </el-icon>
                    <span>查看详情</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="edit" divided>
                    <el-icon>
                      <Edit />
                    </el-icon>
                    <span>编辑</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="delete">
                    <el-icon>
                      <Delete />
                    </el-icon>
                    <span>删除</span>
                  </el-dropdown-item>

                  <!-- 发布状态标记 -->
                  <el-dropdown-item divided command="mark-published">
                    <el-icon>
                      <Share />
                    </el-icon>
                    <span>发布状态：标记为已发布</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="mark-unpublished">
                    <el-icon>
                      <Refresh />
                    </el-icon>
                    <span>发布状态：标记为未发布</span>
                  </el-dropdown-item>

                  <!-- 工具类 -->
                  <el-dropdown-item command="ai-generate" divided>
                    <el-icon>
                      <MagicStick />
                    </el-icon>
                    <span>AI生成内容</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="generate-code">
                    <el-icon>
                      <Refresh />
                    </el-icon>
                    <span>生成产品代码</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="generate-video"
                    :disabled="generatingVideoId === row.id || !row.images || row.images.length === 0">
                    <el-icon>
                      <VideoPlay />
                    </el-icon>
                    <span>{{ generatingVideoId === row.id ? '视频生成中...' : '生成视频' }}</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="export-social-media">
                    <el-icon>
                      <Upload />
                    </el-icon>
                    <span>导出社交媒体数据</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="publish-to-queue">
                    <el-icon>
                      <Share />
                    </el-icon>
                    <span>发布到平台（队列）</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="view-publish-tasks">
                    <el-icon>
                      <View />
                    </el-icon>
                    <span>查看发布详情</span>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="row.psdSetId" command="copy-images-from-psdset">
                    <el-icon>
                      <Picture />
                    </el-icon>
                    <span>复制关联PSD套图信息到商品</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>

          <template #searchKeywordsHeader>
            <div class="flex items-center gap-1">
              <span>搜索关键字</span>
              <el-tooltip effect="dark" content="搜索关键词 不会显示在商品信息中，只会在搜索时供搜索引擎使用" placement="top">
                <el-icon class="text-gray-400 cursor-help">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
          </template>

          <template #urlDefaultSlot="{ row }">
            <div class="flex items-center gap-2">
              <el-carousel v-if="row.images && row.images.length > 0" :interval="3000" height="100px"
                indicator-position="none" :arrow="row.images.length > 1 ? 'always' : 'never'"
                class="w-40 custom-carousel">
                <el-carousel-item v-for="(url, index) in row.images" :key="index">
                  <el-image :src="url" :preview-src-list="row.images" :initial-index="index" :preview-teleported="true"
                    :hide-on-click-modal="false" :preview-class="'custom-image-preview'"
                    class="w-full h-full object-contain rounded cursor-pointer" fit="contain" />
                  <div class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
                    {{ (index as any) + 1 }}/{{ row.images.length }}
                  </div>
                </el-carousel-item>
              </el-carousel>
              <span v-else class="text-[var(--el-text-color-secondary)]">暂无图片</span>
            </div>
          </template>

          <template #videoDefaultSlot="{ row }">
            <div class="flex items-center gap-2">
              <el-carousel v-if="row.videos && row.videos.length > 0" :interval="3000" height="100px"
                indicator-position="none" :arrow="row.videos.length > 1 ? 'always' : 'never'"
                class="w-40 custom-carousel">
                <el-carousel-item v-for="(url, index) in row.videos" :key="index">
                  <div class="relative cursor-pointer w-full h-full flex items-center justify-center bg-black rounded"
                    @click="handleVideoPreview(row.videos, index as any, row)">
                    <video :src="url" class="max-h-[100px] w-auto h-auto object-contain rounded" muted
                      preload="metadata" />
                    <div class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
                      {{ (index as any) + 1 }}/{{ row.videos.length }}
                    </div>
                  </div>
                </el-carousel-item>
              </el-carousel>
              <span v-else class="text-[var(--el-text-color-secondary)]">暂无视频</span>
            </div>
          </template>

          <template #idSlot="{ row }">
            <div class="flex items-center gap-2 cursor-pointer group" @click="copyId(row.id)">
              <span class="text-sm">{{ row.id }}</span>
              <el-icon class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <DocumentCopy />
              </el-icon>
            </div>
          </template>

          <template #codeSlot="{ row }">
            <el-tag v-if="row.code" type="info" size="small">
              {{ row.code }}
            </el-tag>
            <span v-else class="text-gray-400 text-xs">未生成</span>
          </template>

          <template #nameSlot="{ row }">
            <div class="flex flex-col gap-1">
              <div v-if="row.name" class="flex items-center gap-2 group cursor-pointer"
                @click.stop="copyText(row.name, '商品名称')">
                <span class="text-sm">{{ row.name }}</span>
                <el-icon class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DocumentCopy />
                </el-icon>
              </div>
              <div v-if="row.enName" class="flex items-center gap-2 group cursor-pointer"
                @click.stop="copyText(row.enName, '英文名称')">
                <span class="text-sm">{{ row.enName }}</span>
                <el-icon class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DocumentCopy />
                </el-icon>
              </div>
              <div v-if="!row.name && !row.enName" class="text-sm text-gray-400">未设置</div>
            </div>
          </template>

          <template #descriptionSlot="{ row }">
            <div class="flex flex-col gap-1">
              <div v-if="row.description" class="flex items-center gap-2 group cursor-pointer"
                @click.stop="copyText(row.description, '商品描述')">
                <span class="text-sm">{{ row.description }}</span>
                <el-icon class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DocumentCopy />
                </el-icon>
              </div>
              <div v-if="row.enDescription" class="flex items-center gap-2 group cursor-pointer"
                @click.stop="copyText(row.enDescription, '英文描述')">
                <span class="text-sm">{{ row.enDescription }}</span>
                <el-icon class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DocumentCopy />
                </el-icon>
              </div>
              <div v-if="!row.description && !row.enDescription" class="text-sm text-gray-400">未设置</div>
            </div>
          </template>

          <template #keywordsSlot="{ row }">
            <div class="flex flex-col gap-1">
              <div v-if="row.keywords" class="flex items-center gap-2 group cursor-pointer"
                @click.stop="copyText(row.keywords, '关键词')">
                <span class="text-sm">{{ row.keywords }}</span>
                <el-icon class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DocumentCopy />
                </el-icon>
              </div>
              <div v-if="row.enKeywords" class="flex items-center gap-2 group cursor-pointer"
                @click.stop="copyText(row.enKeywords, '英文关键词')">
                <span class="text-sm">{{ row.enKeywords }}</span>
                <el-icon class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DocumentCopy />
                </el-icon>
              </div>
              <div v-if="!row.keywords && !row.enKeywords" class="text-sm text-gray-400">未设置</div>
            </div>
          </template>

          <template #searchKeywordsSlot="{ row }">
            <div class="flex flex-col gap-1">
              <div v-if="row.searchKeywords" class="flex items-start gap-2 group cursor-pointer"
                @click.stop="copyText(row.searchKeywords, '搜索关键字')">
                <span class="text-sm line-clamp-2 flex-1">{{ row.searchKeywords }}</span>
                <el-icon
                  class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                  <DocumentCopy />
                </el-icon>
              </div>
              <div v-if="row.enSearchKeywords" class="flex items-start gap-2 group cursor-pointer"
                @click.stop="copyText(row.enSearchKeywords, '英文搜索关键字')">
                <span class="text-sm line-clamp-2 flex-1">{{ row.enSearchKeywords }}</span>
                <el-icon
                  class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                  <DocumentCopy />
                </el-icon>
              </div>
              <div v-if="!row.searchKeywords && !row.enSearchKeywords" class="text-sm text-gray-400">未设置</div>
            </div>
          </template>

          <template #typeSlot="{ row }">
            <span v-if="row.type">{{ row.type }}</span>
            <span v-else class="text-gray-400 text-xs">未设置</span>
          </template>

          <!-- 关联信息列：显示关联了哪个内容 -->
          <template #relationsSlot="{ row }">
            <div class="relations-summary">
              <div v-if="row.psdSet" class="relations-info">
                <!-- PSD 套图 -->
                <div v-if="row.psdSet" class="relation-section-item">
                  <div class="relation-header">
                    <span class="relation-label">PSD套图：</span>
                  </div>
                  <vxe-grid :data="[row.psdSet]" :show-header="true" border size="mini" class="relation-sub-grid"
                    :columns="psdSetColumns">
                    <template #psdSetImagesSlot="{ row: psdRow }">
                      <div class="flex gap-1 flex-wrap">
                        <div v-for="(img, idx) in getPsdSetImages(psdRow).slice(0, 3)" :key="idx"
                          class="relation-thumb-wrapper">
                          <el-image v-if="img" :src="img" :preview-src-list="getPsdSetImages(psdRow)"
                            :initial-index="idx" :preview-teleported="true" :hide-on-click-modal="false"
                            class="relation-thumb-image" fit="contain" />
                          <span v-else class="text-gray-400 text-xs">无</span>
                        </div>
                        <span v-if="getPsdSetImages(psdRow).length > 3" class="text-xs text-gray-500">+{{
                          (getPsdSetImages(psdRow).length - 3) }}</span>
                        <span v-if="!getPsdSetImages(psdRow).length" class="text-gray-400 text-xs">无</span>
                      </div>
                    </template>
                  </vxe-grid>
                </div>
              </div>
              <span v-else class="text-gray-400 text-sm">无关联</span>
            </div>
          </template>

          <!-- 旧的关联列模板已移除，统一使用 relationsSlot -->
        </vxe-grid>
      </div>

      <!-- 分页 -->
      <div class="py-4 flex justify-end">
        <pagination :total="total" v-model:page="queryParams.currentPage" v-model:limit="queryParams.pageSize"
          @pagination="getList" />
      </div>

      <el-dialog :title="dialogTitle" v-model="dialogVisible" width="100%" :fullscreen="true" @close="dialogClose"
        align-center>
        <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
              <el-form-item label="商品名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入商品名称" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
              <el-form-item label="英文名称" prop="enName">
                <el-input v-model="form.enName" placeholder="请输入英文名称" />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
              <el-form-item label="商品类型" prop="type">
                <el-select v-model="form.type" placeholder="请选择商品类型" clearable filterable style="width: 100%">
                  <el-option v-for="category in PRODUCT_CATEGORIES" :key="category.value" :label="category.label"
                    :value="category.value">
                    <span>{{ category.label }}</span>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
              <el-form-item label="商品标签" prop="tags">
                <el-input v-model="form.tags" placeholder="请输入商品标签，多个标签用逗号分隔" />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
              <el-form-item label="商品番号" prop="code">
                <el-input v-model="form.code" placeholder="留空则自动生成" />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
              <el-form-item label="商品描述" prop="description">
                <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入商品描述" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
              <el-form-item label="英文描述" prop="enDescription">
                <el-input v-model="form.enDescription" type="textarea" :rows="4" placeholder="请输入英文描述" />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
              <el-form-item label="关键词" prop="keywords">
                <el-input v-model="form.keywords" placeholder="请输入关键词，多个关键词用逗号分隔" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
              <el-form-item label="英文关键词" prop="enKeywords">
                <el-input v-model="form.enKeywords" placeholder="请输入英文关键词，多个关键词用逗号分隔" />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
              <el-form-item label="搜索关键字" prop="searchKeywords">
                <el-input v-model="form.searchKeywords" type="textarea" :rows="3"
                  placeholder="请输入搜索关键字，逗号分隔，用于优化搜索功能。例如：黄色,体恤,T恤,短袖,卡通,动物,男款,童装,纯棉,休闲,日常,聚会,可爱,儿童,上衣" />
                <div class="text-xs text-gray-500 mt-1">
                  提示：建议包含商品名称、颜色、材质、风格、适用人群、使用场合等相关词汇，提高搜索命中率
                </div>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
              <el-form-item label="英文搜索关键字" prop="enSearchKeywords">
                <el-input v-model="form.enSearchKeywords" type="textarea" :rows="3"
                  placeholder="请输入英文搜索关键字，逗号分隔，用于优化搜索功能。例如：yellow,T-shirt,short sleeve,cartoon,animal,men,kids,cotton,casual,daily,party,cute,children,top" />
                <div class="text-xs text-gray-500 mt-1">
                  提示：建议包含商品名称、颜色、材质、风格、适用人群、使用场合等相关词汇的英文表达，提高搜索命中率
                </div>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
              <el-form-item label="商品图片" prop="images">
                <ProductImageUpload ref="productImageUploadRef" v-model="form.images" :max-count="10"
                  @files-change="handleFilesChange" />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
              <el-form-item label="商品视频" prop="videos">
                <ProductVideoUpload ref="productVideoUploadRef" v-model="form.videos" :max-count="5"
                  @files-change="handleVideoFilesChange" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </template>
      </el-dialog>

      <!-- 发布弹窗 -->
      <el-dialog title="发布到多媒体平台" v-model="publishDialogVisible" width="100%" :fullscreen="true"
        @close="publishDialogClose" align-center>
        <div class="p-3">
          <el-alert title="多媒体说明" description="默认引用设计模型缩略图、相关截图和视频，可勾选选择图片和视频" type="info" :closable="false" show-icon
            class="mb-3" />

          <h3 class="text-base font-bold my-2 text-[var(--el-text-color-primary)]">选择发布平台</h3>

          <!-- 平台选择 (视觉优化版) -->
          <div class="platform-selector-visual mb-6">
            <el-checkbox-group v-model="selectedPlatforms">
              <div class="platform-check-grid">
                <el-checkbox
                  v-for="item in publishPlatforms.filter(p => ['douyin', 'kuaishou', 'xiaohongshu', 'weibo', 'bilibili', 'xianyu', 'tiktok', 'youtube'].includes(p.value))"
                  :key="item.value" :label="item.value" class="platform-card-checkbox">
                  <div class="platform-card-inner" :style="{ '--platform-color': item.color }">
                    <div class="platform-card-logo">
                      <img v-if="item.logoUrl" :src="item.logoUrl" :alt="item.label" class="logo-img" />
                      <div v-else class="logo-fallback" :style="{ backgroundColor: item.color }">{{ item.icon }}</div>
                    </div>
                    <span class="platform-card-label">{{ item.label }}</span>
                    <div class="platform-card-indicator">
                      <el-icon v-if="selectedPlatforms.includes(item.value)">
                        <Check />
                      </el-icon>
                    </div>
                  </div>
                </el-checkbox>
              </div>
            </el-checkbox-group>
          </div>

          <!-- 平台表单 -->
          <div class="platform-grid">
            <div v-for="platform in selectedPlatforms" :key="platform" class="platform-item">
              <el-card class="platform-form-compact" shadow="hover">
                <template #header>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="platform-mini-icon"
                        :style="{ backgroundColor: publishPlatforms.find(p => p.value === platform)?.color || '#999' }">
                        <img v-if="publishPlatforms.find(p => p.value === platform)?.logoUrl"
                          :src="publishPlatforms.find(p => p.value === platform)?.logoUrl"
                          class="w-4 h-4 object-contain invert" />
                        <span v-else class="text-[10px] text-white font-bold">{{publishPlatforms.find(p => p.value ===
                          platform)?.icon}}</span>
                      </div>
                      <span class="text-base font-semibold">{{ getPlatformName(platform) }}</span>
                    </div>
                    <el-tag size="small" effect="plain" round>{{ ['tiktok', 'youtube'].includes(platform) ?
                      'International' : 'Domestic' }}</el-tag>
                  </div>
                </template>
                <!-- 只在表单已初始化时渲染 -->
                <el-form v-if="publishForm[platform]" :model="publishForm[platform]" label-width="60px" size="small"
                  :data-platform="platform">
                  <el-form-item v-if="platform !== 'weibo'" label="标题" required>
                    <el-input v-model="publishForm[platform].title"
                      :placeholder="`请输入${getPlatformName(platform)}标题`" />
                  </el-form-item>
                  <el-form-item label="内容" required>
                    <el-input v-model="publishForm[platform].content" type="textarea" :rows="2"
                      :autosize="{ minRows: 2, maxRows: 8 }" :placeholder="`请输入${getPlatformName(platform)}内容`"
                      @input="handleContentInput(platform)" />
                  </el-form-item>

                  <el-form-item label="商品图片">
                    <div class="flex flex-wrap gap-1">
                      <div v-for="(url, index) in publishForm[platform].images" :key="index"
                        class="relative cursor-pointer select-item-compact"
                        :class="{ 'selected': publishForm[platform].selectedImages.includes(url) }"
                        @click="toggleImageSelection(platform, url)">
                        <img :src="url" class="w-20 h-20 object-cover rounded transition-all duration-200"
                          @click.stop="preview(index, publishForm[platform].images)" />
                        <div
                          class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
                          {{ index + 1 }}/{{ publishForm[platform].images.length }}
                        </div>
                        <div
                          class="absolute top-1 right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-md">
                          <el-icon v-if="publishForm[platform].selectedImages.includes(url)"
                            class="text-blue-600 text-xs check-icon">
                            <Check />
                          </el-icon>
                        </div>
                      </div>
                    </div>
                  </el-form-item>

                  <el-form-item label="商品视频"
                    v-if="publishForm[platform].videos && publishForm[platform].videos.length > 0">
                    <div class="flex flex-wrap gap-1">
                      <div v-for="(url, index) in publishForm[platform].videos" :key="index"
                        class="relative cursor-pointer select-item-compact"
                        :class="{ 'selected': publishForm[platform].selectedVideos.includes(url) }"
                        @click="toggleVideoSelection(platform, url)">
                        <div class="w-20 h-20 bg-black rounded relative overflow-hidden transition-all duration-200"
                          @click.stop="handlePublishVideoPreview(publishForm[platform].videos, index)">
                          <video :src="url" class="w-full h-full object-cover" muted preload="metadata" />
                          <div class="absolute inset-0 flex items-center justify-center">
                            <div class="w-6 h-6 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                              <el-icon class="text-white text-xs">
                                <VideoPlay />
                              </el-icon>
                            </div>
                          </div>
                          <div
                            class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
                            {{ index + 1 }}/{{ publishForm[platform].videos.length }}
                          </div>
                        </div>
                        <div
                          class="absolute top-1 right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-md">
                          <el-icon v-if="publishForm[platform].selectedVideos.includes(url)"
                            class="text-blue-600 text-xs check-icon">
                            <Check />
                          </el-icon>
                        </div>
                      </div>
                    </div>
                  </el-form-item>
                </el-form>
              </el-card>
            </div>
          </div>
        </div>

        <template #footer>
          <el-button @click="publishDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handlePublishSubmit" :loading="publishLoading">确定发布</el-button>
        </template>
      </el-dialog>

      <!-- 发布结果弹窗 -->
      <el-dialog v-model="publishResultVisible" title="发布结果" width="900px">
        <div class="p-4 publish-result-dark-bg">
          <div v-if="publishResults.length > 0">
            <div class="flex flex-wrap gap-4 mb-4">
              <div v-for="result in publishResults" :key="result.platform" class="publish-result-card">
                <div class="flex items-center justify-between p-3 rounded-lg border publish-result-dark-item" :class="{
                  'border-green-400 bg-green-900 bg-opacity-80': result.success,
                  'border-red-400 bg-red-900 bg-opacity-80': !result.success
                }">
                  <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full mr-2" :class="{
                      'bg-green-400': result.success,
                      'bg-red-400': !result.success
                    }"></div>
                    <span class="font-medium text-[var(--el-text-color-primary)]">{{ getPlatformName(result.platform)
                      }}</span>
                  </div>
                  <div class="text-right ml-2">
                    <div class="font-medium" :class="{
                      'text-green-400': result.success,
                      'text-red-400': !result.success
                    }">
                      {{ result.success ? '发布成功' : '发布失败' }}
                    </div>
                    <div class="text-xs text-[var(--el-text-color-secondary)] mt-1 max-w-[180px] break-words">{{
                      result.message }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 总体结果 -->
            <div class="mt-4 p-3 rounded-lg border publish-result-dark-item" :class="{
              'border-green-400 bg-green-900 bg-opacity-80': publishSummary.success,
              'border-yellow-400 bg-yellow-900 bg-opacity-80': publishSummary.partial,
              'border-red-400 bg-red-900 bg-opacity-80': publishSummary.failed
            }">
              <div class="text-center">
                <div class="font-medium" :class="{
                  'text-green-400': publishSummary.success,
                  'text-yellow-400': publishSummary.partial,
                  'text-red-400': publishSummary.failed
                }">
                  {{ publishSummary.message }}
                </div>
                <div class="text-sm text-[var(--el-text-color-secondary)] mt-1">
                  成功：{{ publishSummary.successCount }} 个，失败：{{ publishSummary.failCount }} 个
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <el-button type="primary" @click="closePublishResultDialog">确认</el-button>
        </template>
      </el-dialog>

      <!-- 图片预览 -->
      <el-dialog v-model="previewVisible" title="预览" width="90%" :close-on-click-modal="true">
        <div v-if="previewList.length > 0" class="flex flex-col items-center">
          <el-image :src="previewList[previewIndex]" :preview-src-list="previewList" :initial-index="previewIndex"
            fit="contain" style="max-width: 100%; max-height: 70vh;" :preview-teleported="true" />
          <div v-if="previewList.length > 1" class="mt-4 flex items-center gap-4">
            <el-button @click="previewIndex = Math.max(0, previewIndex - 1)"
              :disabled="previewIndex === 0">上一张</el-button>
            <span>{{ previewIndex + 1 }} / {{ previewList.length }}</span>
            <el-button @click="previewIndex = Math.min(previewList.length - 1, previewIndex + 1)"
              :disabled="previewIndex === previewList.length - 1">下一张</el-button>
          </div>
        </div>
        <div v-else-if="previewUrl" class="flex justify-center">
          <img :src="previewUrl" alt="Preview" style="max-width: 100%; max-height: 70vh;" />
        </div>
      </el-dialog>

      <!-- 视频预览弹窗 -->
      <el-dialog v-model="videoPreviewVisible" title="视频预览" width="100%" :fullscreen="true"
        :close-on-click-modal="true">
        <div v-if="videoPreviewList.length > 0" class="video-preview-container">
          <div class="video-preview-header">
            <div class="actions" v-if="videoPreviewAllowDelete && videoPreviewRowId">
              <el-button type="danger" size="small" :icon="Delete"
                :loading="deletingVideoKey === `${videoPreviewRowId}-${videoPreviewList[videoPreviewIndex]}`"
                @click="handleDeleteVideo({ id: videoPreviewRowId, videos: videoPreviewList }, videoPreviewList[videoPreviewIndex])">
                删除
              </el-button>
            </div>
          </div>
          <div class="video-preview-content">
            <el-button v-if="videoPreviewList.length > 1" class="video-nav-btn video-nav-prev" :icon="ArrowLeft" circle
              @click="prevVideo" :disabled="videoPreviewIndex === 0" />
            <div class="video-wrapper">
              <transition name="fade" mode="out-in">
                <video :key="videoPreviewIndex" :src="videoPreviewList[videoPreviewIndex]" controls preload="auto"
                  class="video-preview-player" />
              </transition>
            </div>
            <el-button v-if="videoPreviewList.length > 1" class="video-nav-btn video-nav-next" :icon="ArrowRight" circle
              @click="nextVideo" :disabled="videoPreviewIndex === videoPreviewList.length - 1" />
          </div>
          <div v-if="videoPreviewList.length > 1" class="video-pagination">
            <span class="video-page-info">
              {{ videoPreviewIndex + 1 }} / {{ videoPreviewList.length }}
            </span>
          </div>
        </div>
        <div v-else class="text-center text-gray-400 py-8">暂无视频</div>
      </el-dialog>

      <!-- 高级视频生成弹窗 (已抽离) -->
      <VideoGenDialog v-model:visible="videoGenDialogVisible" :row="videoGenRow" @success="getList" />


      <!-- 导出社交媒体数据弹窗 -->
      <el-dialog v-model="socialExportVisible" title="社交媒体发布数据（导出）" width="60%" :fullscreen="false"
        :close-on-click-modal="true" align-center>
        <div class="p-4 max-w-5xl mx-auto">
          <el-input v-model="socialExportText" type="textarea" :rows="18" readonly />
        </div>
        <template #footer>
          <el-button @click="socialExportVisible = false">取消</el-button>
          <el-button type="primary" @click="copySocialExport" :disabled="!socialExportText">复制JSON</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="customModelDetailVisible" title="关联设计模型详情" width="100%" :fullscreen="true"
        :close-on-click-modal="false">
        <div v-if="customModelDetail" class="custom-model-detail-dialog p-8">
          <el-row :gutter="32">
            <!-- 左侧图片区 -->
            <el-col :span="8" class="flex flex-col items-center justify-center">
              <img v-if="customModelDetail.thumbnail"
                :src="getPreviewImageUrl(customModelDetail.thumbnail, { width: 300, quality: 80, format: 'webp' })"
                style="max-width: 240px; max-height: 240px; border-radius: 12px; box-shadow: 0 2px 8px #0001; margin-bottom: 16px; cursor:pointer;"
                @click="preview(0, [customModelDetail.thumbnail])" />
              <div v-else
                class="w-[240px] h-[240px] flex items-center justify-center bg-gray-100 text-gray-400 rounded mb-4">
                无缩略图</div>
              <!-- 预留更多图片展示（如有） -->
              <template v-if="customModelDetail.images && customModelDetail.images.length">
                <div class="flex flex-wrap gap-2 mt-2">
                  <img v-for="(img, idx) in customModelDetail.images" :key="idx" :src="img"
                    style="width: 60px; height: 60px; border-radius: 6px; object-fit: cover; cursor:pointer;"
                    @click="preview(idx as any, customModelDetail.images)" />
                </div>
              </template>
            </el-col>
            <!-- 右侧基础信息区 -->
            <el-col :span="16">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="ID">{{ customModelDetail.id }}</el-descriptions-item>
                <el-descriptions-item label="名称">{{ customModelDetail.name }}</el-descriptions-item>
                <el-descriptions-item label="描述" :span="2">{{ customModelDetail.description || '无'
                }}</el-descriptions-item>
                <el-descriptions-item label="关键词">{{ customModelDetail.keywords || '无' }}</el-descriptions-item>
                <el-descriptions-item label="标签">{{ customModelDetail.tags || '无' }}</el-descriptions-item>
                <el-descriptions-item label="作者">
                  <template
                    v-if="customModelDetail.uploader && (customModelDetail.uploader.name || customModelDetail.uploader.account)">
                    {{ customModelDetail.uploader.name || customModelDetail.uploader.account }}
                  </template>
                  <template v-else>无</template>
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ customModelDetail.createTime ? (customModelDetail.createTime +
                  '').replace('T', ' ').slice(0, 19) : '无' }}</el-descriptions-item>
                <el-descriptions-item label="更新时间">{{ customModelDetail.updateTime ? (customModelDetail.updateTime +
                  '').replace('T', ' ').slice(0, 19) : '无' }}</el-descriptions-item>
                <el-descriptions-item v-if="customModelDetail.url" label="模型文件">
                  <el-link :href="customModelDetail.url" target="_blank" type="primary">下载/预览</el-link>
                </el-descriptions-item>
              </el-descriptions>
            </el-col>
          </el-row>
          <!-- 元数据结构化展示 -->
          <div v-if="customModelDetail.meta" class="mt-6">
            <h4 class="font-medium mb-2">元数据</h4>
            <el-scrollbar style="max-height: 200px;">
              <pre style="background:none;padding:0;margin:0;font-size:13px;">{{ JSON.stringify(customModelDetail.meta, null,
                2) }}</pre>
            </el-scrollbar>
          </div>
        </div>
        <div v-else class="p-8 text-center text-gray-400">暂无详情</div>
        <template #footer>
          <el-button @click="customModelDetailVisible = false">关闭</el-button>
        </template>
      </el-dialog>

      <!-- 关联信息详情弹窗 -->
      <el-dialog v-model="relationsDetailVisible" title="关联信息详情" width="90%" :close-on-click-modal="false" align-center
        :destroy-on-close="true">
        <div v-if="currentRelationsRow" class="relations-detail-content">
          <!-- 关联设计模型 -->
          <div v-if="currentRelationsRow.customModel" class="relation-section">
            <h3 class="relation-section-title">关联设计模型</h3>
            <vxe-grid :data="[currentRelationsRow.customModel]" :show-header="true" border size="mini"
              style="margin: 0; padding: 0; background: none;" :columns="[
                { field: 'thumbnail', title: '缩略图', width: '120', slots: { default: 'customModelThumbnailSlot' } },
                { field: 'name', title: '名称', minWidth: 80 },
                { field: 'description', title: '描述', minWidth: 120 },
                { field: 'keywords', title: '关键词', minWidth: 100 },
                { field: 'updateTime', title: '更新时间', minWidth: 120, slots: { default: 'customModelUpdateTimeSlot' } },
                { title: '操作', field: 'operation', width: 'auto', slots: { default: 'customModelOperationSlot' } }
              ]">
              <template #customModelThumbnailSlot="{ row }">
                <div class="flex items-center justify-center p-2">
                  <el-image v-if="row.thumbnail"
                    :src="getPreviewImageUrl(row.thumbnail, { width: 200, quality: 80, format: 'webp' })"
                    :preview-src-list="[row.thumbnail]" :initial-index="0"
                    style="width:120px; height:auto; object-fit:contain; background:#f5f5f5; cursor:pointer;" />
                  <span v-else class="text-gray-400">无</span>
                </div>
              </template>
              <template #customModelUpdateTimeSlot="{ row }">
                <span>{{ row.updateTime ? (row.updateTime + '').replace('T', ' ').slice(0, 19) : '无' }}</span>
              </template>
              <template #customModelOperationSlot="{ row }">
                <div class="flex gap-2">
                  <el-button type="primary" link size="small" @click="showCustomModelDrafts(row)">查看草稿截图</el-button>
                  <el-button v-if="row.thumbnail" type="success" link size="small"
                    @click="downloadThumbnail(row.thumbnail, row.name || '缩略图')">
                    下载缩略图
                  </el-button>
                </div>
              </template>
            </vxe-grid>
          </div>

          <!-- 关联贴纸 -->
          <div v-if="currentRelationsRow.sticker" class="relation-section">
            <h3 class="relation-section-title">关联贴纸</h3>
            <vxe-grid :data="[currentRelationsRow.sticker]" :show-header="true" border size="mini"
              style="margin: 0; padding: 0; background: none;" :columns="[
                { field: 'url', title: '图片', width: '120', slots: { default: 'stickerImageSlot' } },
                { field: 'name', title: '名称', minWidth: 80 },
                { field: 'description', title: '描述', minWidth: 120 },
                { field: 'keywords', title: '关键词', minWidth: 100 },
                { field: 'suffix', title: '后缀', width: 80 },
                { field: 'updateTime', title: '更新时间', minWidth: 120, slots: { default: 'stickerUpdateTimeSlot' } },
                { title: '操作', field: 'operation', width: 'auto', slots: { default: 'stickerOperationSlot' } }
              ]">
              <template #stickerImageSlot="{ row }">
                <div class="flex items-center justify-center p-2">
                  <el-image v-if="row.url" :src="row.url" :preview-src-list="[row.url]" :initial-index="0"
                    style="width:120px; height:auto; object-fit:contain; background:#f5f5f5; cursor:pointer;" />
                  <span v-else class="text-gray-400">无</span>
                </div>
              </template>
              <template #stickerUpdateTimeSlot="{ row }">
                <span>{{ row.updateTime ? (row.updateTime + '').replace('T', ' ').slice(0, 19) : '无' }}</span>
              </template>
              <template #stickerOperationSlot="{ row }">
                <div class="flex gap-2">
                  <el-button v-if="row.url" type="primary" link size="small" @click="preview(0, [row.url])">
                    预览
                  </el-button>
                </div>
              </template>
            </vxe-grid>
          </div>

          <!-- 关联 PSD 套图 -->
          <div v-if="currentRelationsRow.psdSet" class="relation-section">
            <h3 class="relation-section-title">关联PSD套图</h3>
            <vxe-grid :data="[currentRelationsRow.psdSet]" :show-header="true" border size="mini"
              style="margin: 0; padding: 0; background: none;" :columns="psdSetDetailColumns">
              <template #psdSetImagesSlot="{ row }">
                <div class="flex gap-1 flex-wrap">
                  <div v-for="(img, idx) in getPsdSetImages(row).slice(0, 3)" :key="idx" class="relation-thumb-wrapper">
                    <el-image v-if="img" :src="img" :preview-src-list="getPsdSetImages(row)" :initial-index="idx"
                      :preview-teleported="true" :hide-on-click-modal="false" class="relation-thumb-image"
                      fit="contain" />
                    <span v-else class="text-gray-400 text-xs">无</span>
                  </div>
                  <span v-if="getPsdSetImages(row).length > 3" class="text-xs text-gray-500">+{{
                    (getPsdSetImages(row).length - 3) }}</span>
                  <span v-if="!getPsdSetImages(row).length" class="text-gray-400 text-xs">无</span>
                </div>
              </template>
            </vxe-grid>
          </div>

          <div v-if="!currentRelationsRow.customModel && !currentRelationsRow.sticker && !currentRelationsRow.psdSet"
            class="text-center py-8 text-gray-400">
            无关联信息
          </div>
        </div>
        <template #footer>
          <el-button @click="relationsDetailVisible = false">关闭</el-button>
        </template>
      </el-dialog>

      <!-- 查看源信息对话框 -->
      <el-dialog v-model="relationsSourceInfoVisible" title="关联信息源数据" width="80%" :close-on-click-modal="false"
        align-center :destroy-on-close="true">
        <div v-if="currentSourceInfoRow" class="source-info-content">
          <el-tabs v-model="activeSourceTab" type="border-card">
            <el-tab-pane v-if="currentSourceInfoRow.customModel" label="设计模型" name="customModel">
              <div class="source-info-section">
                <h4 class="source-info-title">设计模型原始数据</h4>
                <pre class="source-info-json">{{ formatJSON(currentSourceInfoRow.customModel) }}</pre>
              </div>
            </el-tab-pane>
            <el-tab-pane v-if="currentSourceInfoRow.sticker" label="贴纸" name="sticker">
              <div class="source-info-section">
                <h4 class="source-info-title">贴纸原始数据</h4>
                <pre class="source-info-json">{{ formatJSON(currentSourceInfoRow.sticker) }}</pre>
              </div>
            </el-tab-pane>
            <el-tab-pane v-if="currentSourceInfoRow.psdSet" label="PSD套图" name="psdSet">
              <div class="source-info-section">
                <h4 class="source-info-title">PSD套图原始数据</h4>
                <pre class="source-info-json">{{ formatJSON(currentSourceInfoRow.psdSet) }}</pre>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
        <template #footer>
          <el-button @click="relationsSourceInfoVisible = false">关闭</el-button>
          <el-button type="primary" @click="copySourceInfo">复制JSON</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="customModelDraftDialogVisible" title="关联草稿" width="80%" :close-on-click-modal="false"
        align-center :destroy-on-close="true">
        <div v-if="customModelDrafts.length === 0" class="empty-state text-center py-8">
          <el-empty description="暂无关联草稿" />
        </div>
        <div v-else class="draft-grid">
          <div v-for="draft in customModelDrafts" :key="draft.id" class="draft-item">
            <div class="draft-preview">
              <!-- 视频预览 -->
              <div v-if="draft.suffix && ['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(draft.suffix.toLowerCase())"
                class="video-preview-container" @click="handleDraftVideoPlay(draft)">
                <video :src="draft.url" class="w-full h-32 rounded cursor-pointer object-cover" preload="metadata"
                  muted />
                <div class="video-overlay">
                  <el-icon class="play-icon">
                    <VideoPlay />
                  </el-icon>
                </div>
              </div>
              <!-- 图片预览 -->
              <el-image v-else :src="draft.url" fit="cover" class="w-full h-32 rounded cursor-pointer"
                :preview-src-list="[draft.url]" :preview-teleported="true" :z-index="9999" />
            </div>
            <div class="draft-info p-3">
              <div class="draft-header flex justify-between items-start mb-2">
                <div class="draft-name text-sm font-medium truncate flex-1">
                  {{ draft.name || '未命名' }}
                </div>
              </div>
              <div v-if="draft.description" class="draft-desc text-xs text-color-regular mt-1 line-clamp-2">
                {{ draft.description }}
              </div>
              <div class="draft-meta text-xs text-color-placeholder mt-2">
                <span>{{ formatTimestamp(draft.createTime) }}</span>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="customModelDraftDialogVisible = false">关闭</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="aiGenDialogVisible" title="AI自动生成内容" width="500px" align-center :destroy-on-close="true">
        <div style="margin-bottom: 16px; color: #888; font-size: 15px;">请输入你希望AI分析的内容风格或角度（如：偏艺术描述、简洁风格、突出色彩等）</div>
        <el-input v-model="aiGenPrompt" type="textarea" :rows="6" placeholder="如：请用艺术化语言描述商品内容..."
          style="font-size:16px;min-height:120px;width:100%;resize:vertical;" />
        <template #footer>
          <el-button @click="aiGenDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog">确定</el-button>
        </template>
      </el-dialog>

      <!-- 产品详情弹窗 -->
      <el-dialog v-model="productDetailVisible" title="产品详情" width="90%" :fullscreen="true"
        :close-on-click-modal="false" align-center :destroy-on-close="true" class="product-detail-dialog">
        <div class="product-detail-wrapper">
          <div v-if="productDetailLoading" class="flex items-center justify-center py-20">
            <el-icon class="is-loading" style="font-size: 32px;">
              <Loading />
            </el-icon>
            <span class="ml-2">加载中...</span>
          </div>
          <div v-else-if="productDetail" class="product-detail-content">
            <!-- 基本信息 -->
            <div class="product-detail-section mb-4">
              <div class="product-detail-section-title">
                <el-icon>
                  <Document />
                </el-icon>
                <span>基本信息</span>
              </div>
              <div class="product-info-list">
                <div class="product-info-item">
                  <div class="product-info-label">ID</div>
                  <div class="product-info-value">{{ productDetail.id }}</div>
                </div>
                <div class="product-info-item">
                  <div class="product-info-label">产品代码</div>
                  <div class="product-info-value">
                    <el-tag v-if="productDetail.code" type="info" size="small">{{ productDetail.code }}</el-tag>
                    <span v-else class="text-gray-400">未生成</span>
                  </div>
                </div>
                <div class="product-info-item">
                  <div class="product-info-label">商品名称</div>
                  <div class="product-info-value">{{ productDetail.name || '未设置' }}</div>
                </div>
                <div class="product-info-item">
                  <div class="product-info-label">英文名称</div>
                  <div class="product-info-value">{{ productDetail.enName || '未设置' }}</div>
                </div>
                <div class="product-info-item">
                  <div class="product-info-label">商品类型</div>
                  <div class="product-info-value">{{ productDetail.type || '未设置' }}</div>
                </div>
                <div class="product-info-item">
                  <div class="product-info-label">发布状态</div>
                  <div class="product-info-value">
                    <el-tag v-if="productDetail.isPublish" type="success" size="small">已发布</el-tag>
                    <el-tag v-else type="warning" size="small">未发布</el-tag>
                  </div>
                </div>
                <div class="product-info-item">
                  <div class="product-info-label">商品描述</div>
                  <div class="product-info-value">{{ productDetail.description || '未设置' }}</div>
                </div>
                <div class="product-info-item">
                  <div class="product-info-label">英文描述</div>
                  <div class="product-info-value">{{ productDetail.enDescription || '未设置' }}</div>
                </div>
                <div class="product-info-item">
                  <div class="product-info-label">关键词</div>
                  <div class="product-info-value">{{ productDetail.keywords || '未设置' }}</div>
                </div>
                <div class="product-info-item">
                  <div class="product-info-label">英文关键词</div>
                  <div class="product-info-value">{{ productDetail.enKeywords || '未设置' }}</div>
                </div>
                <div class="product-info-item">
                  <div class="product-info-label">搜索关键字</div>
                  <div class="product-info-value">{{ productDetail.searchKeywords || '未设置' }}</div>
                </div>
                <div class="product-info-item">
                  <div class="product-info-label">英文搜索关键字</div>
                  <div class="product-info-value">{{ productDetail.enSearchKeywords || '未设置' }}</div>
                </div>
                <div class="product-info-item">
                  <div class="product-info-label">创建人</div>
                  <div class="product-info-value">{{ productDetail.creatorName || '未设置' }}</div>
                </div>
                <div class="product-info-item">
                  <div class="product-info-label">创建时间</div>
                  <div class="product-info-value">
                    {{ productDetail.createTime ? formatTimestamp(productDetail.createTime) : '未设置' }}
                  </div>
                </div>
                <div class="product-info-item">
                  <div class="product-info-label">修改时间</div>
                  <div class="product-info-value">
                    {{ productDetail.updateTime ? formatTimestamp(productDetail.updateTime) : '未设置' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 商品图片 -->
            <div class="product-detail-section mb-4" v-if="productDetail.images && productDetail.images.length > 0">
              <div class="product-detail-section-title">
                <el-icon>
                  <Picture />
                </el-icon>
                <span>商品图片 ({{ productDetail.images.length }})</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <el-image v-for="(url, index) in productDetail.images" :key="index" :src="url"
                  :preview-src-list="productDetail.images" :initial-index="index" :preview-teleported="true"
                  :hide-on-click-modal="false" class="w-32 h-32 object-cover rounded cursor-pointer" fit="cover" />
              </div>
            </div>

            <!-- 商品视频 -->
            <div class="product-detail-section mb-4" v-if="productDetail.videos && productDetail.videos.length > 0">
              <div class="product-detail-section-title">
                <el-icon>
                  <VideoPlay />
                </el-icon>
                <span>商品视频 ({{ productDetail.videos.length }})</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <div v-for="(url, index) in productDetail.videos" :key="index" class="relative cursor-pointer"
                  @click="handleVideoPreview(productDetail.videos, index as any, productDetail)">
                  <video :src="url" class="w-32 h-32 object-cover rounded" muted preload="metadata" />
                  <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded">
                    <el-icon class="text-white text-2xl">
                      <VideoPlay />
                    </el-icon>
                  </div>
                  <div class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
                    {{ (index as any) + 1 }}/{{ productDetail.videos.length }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 关联信息 -->
            <div class="product-detail-section mb-4"
              v-if="productDetail.customModel || productDetail.sticker || productDetail.psdSet">
              <div class="product-detail-section-title">
                <el-icon>
                  <Box />
                </el-icon>
                <span>关联信息</span>
              </div>
              <div class="relations-detail-content">
                <!-- 使用已有的关联信息展示逻辑 -->
                <div v-if="productDetail.customModel || productDetail.sticker || productDetail.psdSet"
                  class="relations-info">
                  <!-- 设计模型 -->
                  <div v-if="productDetail.customModel" class="relation-section-item">
                    <div class="relation-header">
                      <span class="relation-label">设计模型：</span>
                    </div>
                    <vxe-grid :data="[productDetail.customModel]" :show-header="true" border size="mini"
                      class="relation-sub-grid" :columns="[
                        { field: 'thumbnail', title: '缩略图', width: 120, slots: { default: 'customModelThumbnailSlot' } },
                        { field: 'name', title: '名称', minWidth: 100, showOverflow: true },
                        { field: 'description', title: '描述', minWidth: 120, showOverflow: true },
                        { field: 'keywords', title: '关键词', minWidth: 100, showOverflow: true },
                        { field: 'updateTime', title: '更新时间', width: 140, slots: { default: 'customModelUpdateTimeSlot' } }
                      ]">
                      <template #customModelThumbnailSlot="{ row: modelRow }">
                        <div class="flex items-center justify-center p-1">
                          <el-image v-if="modelRow.thumbnail"
                            :src="getPreviewImageUrl(modelRow.thumbnail, { width: 200, quality: 80, format: 'webp' })"
                            :preview-src-list="getCustomModelImages(modelRow)" :initial-index="0"
                            :preview-teleported="true" :hide-on-click-modal="false" class="relation-thumb-image"
                            fit="contain" />
                          <span v-else class="text-gray-400 text-xs">无</span>
                        </div>
                      </template>
                      <template #customModelUpdateTimeSlot="{ row: modelRow }">
                        <span class="text-xs">{{ modelRow.updateTime ? formatTimestamp(modelRow.updateTime) : '无'
                        }}</span>
                      </template>
                    </vxe-grid>
                  </div>

                  <!-- 贴纸 -->
                  <div v-if="productDetail.sticker" class="relation-section-item">
                    <div class="relation-header">
                      <span class="relation-label">贴纸：</span>
                    </div>
                    <vxe-grid :data="[productDetail.sticker]" :show-header="true" border size="mini"
                      class="relation-sub-grid" :columns="[
                        { field: 'url', title: '图片', width: 120, slots: { default: 'stickerImageSlot' } },
                        { field: 'name', title: '名称', minWidth: 100, showOverflow: true },
                        { field: 'description', title: '描述', minWidth: 120, showOverflow: true },
                        { field: 'keywords', title: '关键词', minWidth: 100, showOverflow: true },
                        { field: 'suffix', title: '后缀', width: 60 },
                        { field: 'updateTime', title: '更新时间', width: 140, slots: { default: 'stickerUpdateTimeSlot' } }
                      ]">
                      <template #stickerImageSlot="{ row: stickerRow }">
                        <div class="flex items-center justify-center p-1">
                          <el-image v-if="stickerRow.url" :src="stickerRow.url" :preview-src-list="[stickerRow.url]"
                            :initial-index="0" :preview-teleported="true" :hide-on-click-modal="false"
                            class="relation-thumb-image" fit="contain" />
                          <span v-else class="text-gray-400 text-xs">无</span>
                        </div>
                      </template>
                      <template #stickerUpdateTimeSlot="{ row: stickerRow }">
                        <span class="text-xs">{{ stickerRow.updateTime ? formatTimestamp(stickerRow.updateTime) : '无'
                        }}</span>
                      </template>
                    </vxe-grid>
                  </div>

                  <!-- PSD 套图 -->
                  <div v-if="productDetail.psdSet" class="relation-section-item">
                    <div class="relation-header">
                      <span class="relation-label">PSD套图：</span>
                    </div>
                    <vxe-grid :data="[productDetail.psdSet]" :show-header="true" border size="mini"
                      class="relation-sub-grid" :columns="psdSetColumns">
                      <template #psdSetImagesSlot="{ row: psdRow }">
                        <div class="flex gap-1 flex-wrap">
                          <div v-for="(img, idx) in getPsdSetImages(psdRow).slice(0, 3)" :key="idx"
                            class="relation-thumb-wrapper">
                            <el-image v-if="img" :src="img" :preview-src-list="getPsdSetImages(psdRow)"
                              :initial-index="idx" :preview-teleported="true" :hide-on-click-modal="false"
                              class="relation-thumb-image" fit="contain" />
                            <span v-else class="text-gray-400 text-xs">无</span>
                          </div>
                          <span v-if="getPsdSetImages(psdRow).length > 3" class="text-xs text-gray-500">+{{
                            (getPsdSetImages(psdRow).length - 3) }}</span>
                          <span v-if="!getPsdSetImages(psdRow).length" class="text-gray-400 text-xs">无</span>
                        </div>
                      </template>
                    </vxe-grid>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="!productDetailLoading" class="text-center py-20 text-gray-400">
            暂无数据
          </div>
        </div>
        <template #footer>
          <el-button @click="productDetailVisible = false">关闭</el-button>
        </template>
      </el-dialog>

      <!-- 发布详情对话框 -->
      <el-dialog v-model="publishTasksVisible"
        :title="`发布详情 - ${currentProductForTasks?.name || currentProductForTasks?.id || ''}`" width="80%"
        :close-on-click-modal="true" align-center :destroy-on-close="true">
        <div v-loading="publishTasksLoading" class="publish-tasks-container">
          <div v-if="publishTasks.length === 0 && !publishTasksLoading" class="empty-state text-center py-8">
            <el-empty description="暂无发布任务" />
          </div>
          <vxe-grid v-else :data="publishTasks" :columns="publishTasksColumns" border stripe size="small"
            :show-header="true" :show-overflow="true" height="500" class="publish-tasks-grid">
            <template #platformSlot="{ row }">
              {{ formatPlatformName(row.platform) }}
            </template>
            <template #statusSlot="{ row }">
              <el-tag :type="formatTaskStatus(row.status).type" size="small">
                {{ formatTaskStatus(row.status).label }}
              </el-tag>
            </template>
            <template #attemptsSlot="{ row }">
              {{ row.attempts || 0 }} / {{ row.maxAttempts || 3 }}
            </template>
            <template #createdAtSlot="{ row }">
              {{ formatTimestamp(row.createdAt) }}
            </template>
            <template #updatedAtSlot="{ row }">
              {{ formatTimestamp(row.updatedAt) }}
            </template>
            <template #processedAtSlot="{ row }">
              {{ row.processedAt ? formatTimestamp(row.processedAt) : '-' }}
            </template>
            <template #errorSlot="{ row }">
              <span v-if="row.error" class="text-red-500">{{ row.error }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </vxe-grid>
        </div>
        <template #footer>
          <el-button @click="publishTasksVisible = false">关闭</el-button>
        </template>
      </el-dialog>

      <!-- 发布平台选择对话框 (vxe-grid 优化版) -->
      <el-dialog v-model="publishPlatformDialogVisible" title="选择发布配置" width="800px" :close-on-click-modal="true"
        align-center>
        <div class="platform-select-container flex flex-col gap-4">
          <!-- 搜索与筛选 -->
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-2 flex-1">
              <el-input v-model="publishConfigSearchText" placeholder="搜索配置名称或平台..." prefix-icon="Search" clearable
                @input="publishConfigCurrentPage = 1" style="width: 300px" />
              <div class="text-xs text-gray-500">
                支持多选配置并行发布到不同平台
              </div>
            </div>
            <div class="flex items-center gap-2">
              <el-tag v-if="publishQueueSelectedConfigIds.length" type="primary" effect="dark" round>
                已选 {{ publishQueueSelectedConfigIds.length }} 项
              </el-tag>
            </div>
          </div>

          <!-- vxe-grid 表格 -->
          <div class="config-grid-wrapper border rounded-lg overflow-hidden">
            <vxe-grid v-bind="publishConfigGridOptions" :data="publishConfigDataSource"
              @checkbox-change="handlePublishConfigCheckboxChange" @checkbox-all="handlePublishConfigCheckboxAllChange">

              <template #platformSlot="{ row }">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded flex items-center justify-center p-1"
                    :style="{ backgroundColor: getPlatformColor(row.platform) }">
                    <img v-if="getPlatformLogo(row.platform)" :src="getPlatformLogo(row.platform)"
                      class="w-4 h-4 object-contain invert" />
                    <span v-else class="text-[10px] text-white font-bold">{{ getPlatformIcon(row.platform) }}</span>
                  </div>
                  <span>{{ formatPlatformName(row.platform) }}</span>
                </div>
              </template>
            </vxe-grid>
          </div>

          <!-- 分页 -->
          <div class="flex justify-end pt-2">
            <el-pagination v-model:current-page="publishConfigCurrentPage" v-model:page-size="publishConfigPageSize"
              :total="filteredPublishConfigs.length" :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next" small background />
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <el-button @click="publishPlatformDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="publishConfirmLoading"
              :disabled="publishQueueSelectedConfigIds.length === 0" @click="confirmPublishToPlatforms">
              确认发布任务 ({{ publishQueueSelectedConfigIds.length }})
            </el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 批量移动弹窗 -->
      <el-dialog title="移动到文件夹" v-model="batchMoveDialogVisible" width="400px" align-center>
        <div class="h-[400px] border rounded overflow-hidden">
          <FolderTree v-model="targetFolderId" folder-category="product" :width="350" :show-border="false"
            :show-count="false" mode="select" class="w-full h-full" />
        </div>
        <template #footer>
          <el-button @click="batchMoveDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmBatchMove">确定</el-button>
        </template>
      </el-dialog>
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, watchEffect } from "vue";
import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { useUserStore } from "@/store/modules/user";
const userStore = useUserStore()
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search,
  DArrowLeft,
  DArrowRight,
  Folder,
  Plus,
  Delete,
  Picture,
  Box,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Edit,
  Upload,
  Share,
  MagicStick,
  VideoPlay,
  Check,
  Refresh,
  QuestionFilled,
  View,
  DocumentCopy,
  Grid,
  Loading,
} from "@element-plus/icons-vue";
import { useWindowSize, useLocalStorage } from "@vueuse/core";
import { downloadImageEnhanced } from "@/common/download";
import {
  createProduct,
  getProductList,
  updateProduct,
  updatePublishStatus,
  deleteProduct,
  generateProductCode,
  getProductSocialMediaExport,
  getProductPublishTasks,
  batchMoveProducts,
  aiGenerateProductInfo
} from "@/api/product";
import { uploadToCOS } from "@/api/cos";
import { copyLink } from '@/utils/clipboard'
import { getDraftList } from '@/api/draft'
import { createTask } from '@/api/system/queue'
import { getDesignModel } from '@/api/designModel'
import request from "@/config/axios";
import VideoGenDialog from './components/VideoGenDialog.vue';
import { PRODUCT_CATEGORIES } from '@/config/product-categories'
import { getPreviewImageUrl } from '@/utils/image'
import { getPublishConfigListApi } from '@/api/product/publishConfig'
import FolderTree from '@/components/material/FolderTree.vue'



// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  id: '',
  code: '',
  searchText: '',
  search: '',
  isPublish: undefined as boolean | undefined,
  random: false,
  startTime: '',
  endTime: '',
  folderId: ''
});

// 文件夹变更处理
const handleFolderChange = ({ folderId }) => {
  queryParams.folderId = folderId
  handleSearch()
}

// 搜索筛选折叠状态
const actionsCollapsed = useLocalStorage('product_filter_collapsed', true);
const folderTreeCollapsed = useLocalStorage('product_folder_collapsed', false);

// 是否显示关联信息
const showRelations = useLocalStorage('product_show_relations', true);

// 基础列配置
const baseColumns: any[] = [
  { type: "checkbox", width: 50, showOverflow: true },
  {
    title: "ID",
    field: "id",
    width: 120,
    showOverflow: false,
    slots: { default: 'idSlot' }
  },
  {
    title: "商品图片",
    field: "images",
    width: 180,
    slots: {
      default: "urlDefaultSlot",
    },
  },
  {
    title: "商品视频",
    field: "videos",
    width: 'auto',
    slots: {
      default: "videoDefaultSlot",
    },
  },
  {
    title: "商品名称",
    field: "name",
    width: 280,
    showOverflow: false,
    slots: { default: 'nameSlot' }
  },
  {
    title: "商品描述",
    field: "description",
    width: 300,
    showOverflow: false,
    slots: { default: 'descriptionSlot' }
  },
  {
    title: "关键词",
    field: "keywords",
    width: 280,
    showOverflow: false,
    slots: { default: 'keywordsSlot' }
  },
  {
    title: "搜索关键字",
    field: "searchKeywords",
    minWidth: 300,
    width: 300,
    showOverflow: false,
    slots: { header: 'searchKeywordsHeader', default: 'searchKeywordsSlot' }
  },
];

// 关联信息列
const relationsColumn = {
  title: "关联信息",
  field: "relations",
  width: 'auto',
  slots: { default: 'relationsSlot' }
};

// 动态列配置
const gridColumns = computed(() => {
  const columns = [...baseColumns];
  if (showRelations.value) {
    columns.push(relationsColumn);
  }
  columns.push(
    {
      title: "产品代码",
      field: "code",
      width: 120,
      showOverflow: true,
      slots: { default: 'codeSlot' }
    },
    {
      title: "商品类型",
      field: "type",
      width: 140,
      showOverflow: true,
      slots: { default: 'typeSlot' }
    },
    { title: "创建人", field: "creatorName", minWidth: 100, showOverflow: true },
    {
      title: "创建时间",
      field: "createTime",
      width: 150,
      showOverflow: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue);
      },
    },
    {
      title: "修改时间",
      field: "updateTime",
      width: 150,
      showOverflow: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue);
      },
    },
    {
      title: "操作",
      fixed: "right",
      showOverflow: false,
      width: "auto",
      slots: {
        default: "operationDefaultSlot",
      },
    },
  );
  return columns;
});

const gridOptions = computed(() => ({
  ...commonGridOptions,
  maxHeight: gridMaxHeight.value,
  rowClassName: ({ row }) => {
    return row.isPublish ? 'published-row' : 'unpublished-row';
  },
  rowConfig: {
    isHover: true
  },
  columns: gridColumns.value,
}));

// PSD 套图列配置（关联列表 & 详情弹窗共用）
const psdSetBaseColumns = [
  { field: 'images', title: '套图图片', width: 240, slots: { default: 'psdSetImagesSlot' } },
  { field: 'name', title: '名称', minWidth: 120, showOverflow: true },
  { field: 'description', title: '描述', minWidth: 150, showOverflow: true },
  { field: 'keywords', title: '关键词', minWidth: 120, showOverflow: true },
  { field: 'updateTime', title: '更新时间', minWidth: 140, formatter: ({ cellValue }) => formatTimestamp(cellValue) }
];
const psdSetColumns = psdSetBaseColumns;
const psdSetDetailColumns = [...psdSetBaseColumns, { field: 'id', title: '关联ID', minWidth: 120 }];


const { height } = useWindowSize()
const gridMaxHeight = ref<number>(0)

watchEffect(() => {
  gridMaxHeight.value = height.value - 250
})

const dataSource = ref([]);
const loading = ref(false);
const ids = ref([]);
const single = ref(false);
const total = ref(0);
const selectedRows = ref<any[]>([]);
const formRef = ref();
const dialogTitle = ref("");
const dialogVisible = ref(false);
const isEdit = ref(true);
const currentRow = ref({});
const submitLoading = ref(false);
const previewVisible = ref(false);
const previewUrl = ref('');
const previewList = ref<string[]>([]);
const previewIndex = ref(0);
const fileList = ref([]);
const pendingFiles = ref([]);
const existingImages = ref([]);
const videoFileList = ref([]);
const pendingVideoFiles = ref([]);
const existingVideos = ref([]);
const generatingVideoId = ref<string>('');
const videoGenDialogVisible = ref(false);
const videoGenRow = ref<any>(null);
const deletingVideoKey = ref<string>('');
const publishDialogVisible = ref(false);
const batchMoveDialogVisible = ref(false);
const targetFolderId = ref<string | null>(null);

const handleOpenBatchMove = () => {
  if (!selectedRows.value.length) return;
  targetFolderId.value = '__root__'; // 默认选中根目录
  batchMoveDialogVisible.value = true;
}

const confirmBatchMove = async () => {
  if (!selectedRows.value.length) return;
  try {
    const ids = selectedRows.value.map((r: any) => r.id);
    // targetFolderId.value is usually '__root__' or a UUID
    await batchMoveProducts({
      ids,
      folderId: targetFolderId.value || '__root__'
    });
    ElMessage.success('移动成功');
    batchMoveDialogVisible.value = false;
    getList();
  } catch (error) {
    console.error(error);
  }
}

// 打开视频生成对话框
async function handleGenerateVideo(row: any) {
  if (!row?.id) return;
  videoGenRow.value = row;
  videoGenDialogVisible.value = true;
}


// 社交媒体导出
const socialExportVisible = ref(false);
const socialExportText = ref('');

const publishLoading = ref(false);
const currentPublishRow = ref<{
  id?: string;
  name?: string;
  description?: string;
  images?: string[];
  videos?: string[];
}>({});
const productImageUploadRef = ref();
const productVideoUploadRef = ref();

// 产品详情弹窗相关状态
const productDetailVisible = ref(false);
const productDetailLoading = ref(false);
const productDetail = ref<any>(null);

// 发布结果相关
const publishResultVisible = ref(false);
const publishResults = ref<Array<{
  platform: string;
  success: boolean;
  message: string;
  data?: any;
}>>([]);

// 发布结果汇总
const publishSummary = computed(() => {
  if (publishResults.value.length === 0) {
    return {
      success: false,
      partial: false,
      failed: false,
      message: '',
      successCount: 0,
      failCount: 0
    };
  }

  const successCount = publishResults.value.filter(r => r.success).length;
  const failCount = publishResults.value.filter(r => !r.success).length;
  const total = publishResults.value.length;

  return {
    success: successCount === total,
    partial: successCount > 0 && failCount > 0,
    failed: failCount === total,
    message: successCount === total ? '所有平台发布成功！' :
      successCount > 0 ? `部分平台发布成功` :
        '所有平台发布失败',
    successCount,
    failCount
  };
});

// 定义平台表单类型
interface PlatformForm {
  title: string;
  content: string;
  images: string[];
  selectedImages: string[];
  videos: string[];
  selectedVideos: string[];
}

interface PublishForm {
  douyin: PlatformForm | null;
  xiaohongshu: PlatformForm | null;
  weibo: PlatformForm | null;
  kuaishou: PlatformForm | null;
  bilibili: PlatformForm | null;
  xianyu: PlatformForm | null;
  tiktok: PlatformForm | null;
  youtube: PlatformForm | null;
}

// 发布相关的状态
const selectedPlatforms = ref<string[]>([]);
const publishForm = ref<PublishForm>({
  douyin: null,
  xiaohongshu: null,
  weibo: null,
  kuaishou: null,
  bilibili: null,
  xianyu: null,
  tiktok: null,
  youtube: null
});

// 发布配置选择相关状态
const publishConfigSearchText = ref('');
const publishConfigCurrentPage = ref(1);
const publishConfigPageSize = ref(10);
const availablePublishConfigs = ref<any[]>([]);
const publishQueueSelectedConfigIds = ref<string[]>([]);
const publishConfirmLoading = ref(false);
const publishPlatformDialogVisible = ref(false);
const currentPublishProduct = ref<any>(null);

const filteredPublishConfigs = computed(() => {
  const text = publishConfigSearchText.value.toLowerCase().trim();
  let filtered = availablePublishConfigs.value;
  if (text) {
    filtered = filtered.filter(c =>
      c.name?.toLowerCase().includes(text) ||
      formatPlatformName(c.platform).toLowerCase().includes(text)
    );
  }
  return filtered;
});

const publishConfigDataSource = computed(() => {
  const start = (publishConfigCurrentPage.value - 1) * publishConfigPageSize.value;
  const end = start + publishConfigPageSize.value;
  return filteredPublishConfigs.value.slice(start, end);
});

const publishConfigGridOptions = computed(() => ({
  border: true,
  height: 480,
  loading: false,
  rowConfig: { isHover: true, keyField: 'id' },
  columnConfig: { resizable: true },
  checkboxConfig: {
    checkRowKeys: publishQueueSelectedConfigIds.value,
    highlight: true,
    trigger: 'row' as const
  },
  columns: [
    { type: 'checkbox' as any, width: 60, align: 'center' as any },
    { field: 'platform', title: '平台', width: 140, slots: { default: 'platformSlot' } },
    { field: 'name', title: '配置名称', minWidth: 180, showOverflow: true },
    { field: 'description', title: '备注说明', minWidth: 200, showOverflow: true }
  ]
}));

// 处理配置选择变更
function handlePublishConfigCheckboxChange({ checked, row }) {
  if (checked) {
    if (!publishQueueSelectedConfigIds.value.includes(row.id)) {
      publishQueueSelectedConfigIds.value.push(row.id);
    }
  } else {
    publishQueueSelectedConfigIds.value = publishQueueSelectedConfigIds.value.filter(id => id !== row.id);
  }
}

function handlePublishConfigCheckboxAllChange({ checked, records }) {
  // 只操作当前页的数据
  const currentPageIds = publishConfigDataSource.value.map(r => r.id);
  if (checked) {
    currentPageIds.forEach(id => {
      if (!publishQueueSelectedConfigIds.value.includes(id)) {
        publishQueueSelectedConfigIds.value.push(id);
      }
    });
  } else {
    publishQueueSelectedConfigIds.value = publishQueueSelectedConfigIds.value.filter(id => !currentPageIds.includes(id));
  }
}

// 监听平台选择变化
// watch(selectedPlatforms, async (newPlatforms) => {
//   // 重置所有平台表单为null
//   Object.keys(publishForm.value).forEach(platform => {
//     publishForm.value[platform as keyof PublishForm] = null;
//   });
// 
//   // 查询草稿图片
//   let images: string[] = [];
//   // 使用 any 断言，避免 TS 报错
//   let customModelId = (currentPublishRow.value as any)?.customModelId;
//   // 兼容 customModelId 可能在 customModel.id 下
//   if (!customModelId && (currentPublishRow.value as any)?.customModel && (currentPublishRow.value as any).customModel.id) {
//     customModelId = (currentPublishRow.value as any).customModel.id;
//   }
//   if (customModelId) {
//     try {
//       const res = await getDraftList({
//         customModelId,
//         currentPage: 1,
//         pageSize: 100
//       });
//       images = (res.list || []).map(draft => draft.url).filter(Boolean);
//     } catch (e) {
//       images = [];
//     }
//   }
// 
//   // 为选中的平台初始化表单
//   newPlatforms.forEach(platform => {
//     publishForm.value[platform as keyof PublishForm] = {
//       title: currentPublishRow.value?.name || '',
//       content: currentPublishRow.value?.description || '',
//       images: images,
//       selectedImages: [...images]
//     };
//   });
// });

interface ProductForm {
  id?: string;
  code: string;
  name: string;
  enName: string;
  description: string;
  enDescription: string;
  keywords: string;
  enKeywords: string;
  searchKeywords: string;
  enSearchKeywords: string;
  type: string;
  images: string[];
  videos: string[];
  tags: string;
  isActive: boolean;
  isPublish?: boolean;
  createTime?: Date;
  updateTime?: Date;
  file: any;
}

const form = ref<ProductForm>({
  code: '',
  name: '',
  enName: '',
  description: '',
  enDescription: '',
  keywords: '',
  enKeywords: '',
  searchKeywords: '',
  enSearchKeywords: '',
  type: '',
  images: [] as string[],
  videos: [] as string[],
  tags: '',
  isActive: true,
  isPublish: false,
  file: null,
});

const rules = {
  name: [{ required: true, message: "请输入商品名称", trigger: "blur" }],
  description: [{ required: false, message: "请输入商品描述", trigger: "blur" }],
  type: [{ required: false, message: "请选择商品类型", trigger: "blur" }],
};

const dialogClose = () => {
  dialogVisible.value = false;
  fileList.value = [];
  pendingFiles.value = [];
  existingImages.value = [];
  videoFileList.value = [];
  pendingVideoFiles.value = [];
  existingVideos.value = [];
  submitLoading.value = false;
};

function checkboxChange(e) {
  ids.value = e.records.map((item) => item.id);
  selectedRows.value = e.records || [];
  single.value = ids.value.length !== 1;
}

function checkboxAllChange(e) {
  ids.value = e.records.map((item) => item.id);
  selectedRows.value = e.records || [];
  single.value = ids.value.length !== 1;
}

// 处理文件列表变化
const handleFilesChange = (files) => {
  pendingFiles.value = files.filter(file => file.raw).map(file => file.raw)
}

// 处理视频文件列表变化
const handleVideoFilesChange = (files) => {
  pendingVideoFiles.value = files.filter(file => file.raw).map(file => file.raw)
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  // 如果图片加载失败，使用占位图（可以使用一个默认的占位图）
  // 或者隐藏图片：img.style.display = 'none';
  // 这里暂时隐藏，等图片准备好后会自动显示
  img.style.opacity = '0.3';
  img.style.backgroundColor = '#f0f0f0';
}

const submitForm = async () => {
  submitLoading.value = true;
  try {
    await formRef.value.validate();
    const formData = { ...form.value };
    delete formData.file;
    delete formData.createTime;
    delete formData.updateTime;
    // 如果是新建且code为空，删除code字段，让后端自动生成
    if (!isEdit.value && (!formData.code || formData.code.trim() === '')) {
      delete formData.code;
    }
    // 上传所有待上传的图片到COS
    let newImageUrls: string[] = [];
    const userAccount = (userStore.user as any)?.account || userStore.user?.shortName || userStore.user?.name || 'anonymous'
    const productId = isEdit.value ? form.value.id : undefined // 编辑时使用产品 ID
    if (pendingFiles.value.length > 0) {
      const uploadPromises = pendingFiles.value.map(async (file) => {
        try {
          const result = await uploadToCOS({
            file,
            category: 'product',
            account: userAccount,
            entityId: productId // 编辑时使用产品 ID
          });
          return result.url;
        } catch (error) {
          ElMessage.error(`图片 ${file.name} 上传失败`);
          throw error;
        }
      });
      try {
        const results = await Promise.all(uploadPromises);
        newImageUrls = results.filter(url => url !== null);
      } catch (error) {
        ElMessage.error('图片上传失败，请重试');
        return;
      }
    }
    // 上传所有待上传的视频到COS
    let newVideoUrls: string[] = [];
    if (pendingVideoFiles.value.length > 0) {
      const uploadPromises = pendingVideoFiles.value.map(async (file) => {
        try {
          const result = await uploadToCOS({
            file,
            category: 'product',
            account: userAccount,
            entityId: productId // 编辑时使用产品 ID
          });
          return result.url;
        } catch (error) {
          ElMessage.error(`视频 ${file.name} 上传失败`);
          throw error;
        }
      });
      try {
        const results = await Promise.all(uploadPromises);
        newVideoUrls = results.filter(url => url !== null);
      } catch (error) {
        ElMessage.error('视频上传失败，请重试');
        return;
      }
    }
    // 合并已有图片和新上传的图片URL
    formData.images = [...form.value.images, ...newImageUrls];
    // 合并已有视频和新上传的视频URL
    formData.videos = [...form.value.videos, ...newVideoUrls];
    if (isEdit.value) {
      await updateProduct(formData);
      ElMessage.success("更新成功");
    } else {
      delete formData.id;
      await createProduct(formData);
      ElMessage.success("添加成功");
    }
    dialogVisible.value = false;
    resetQuery(); // 重置查询参数
    getList(); // 重新获取列表
    productImageUploadRef.value?.reset(); // 重置图片上传组件
  } catch (e) {
    ElMessage.error("操作失败");
  } finally {
    submitLoading.value = false;
  }
};

function handlePreview(row) {
  // 暂时不实现预览功能
}

const copyUrl = (url: string) => {
  copyLink(url);
};

// 复制 ID
async function copyId(id: string) {
  if (!id) return;
  try {
    await navigator.clipboard.writeText(id);
    ElMessage.success('ID 已复制到剪贴板');
  } catch (e) {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = id;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    ElMessage.success('ID 已复制到剪贴板');
  }
}

// 复制文本（通用）
async function copyText(text: string, label?: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success(`${label || '内容'}已复制到剪贴板`);
  } catch (e) {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    ElMessage.success(`${label || '内容'}已复制到剪贴板`);
  }
}

getList()
async function getList() {
  loading.value = true;

  let params: any = {
    currentPage: queryParams.currentPage,
    pageSize: queryParams.pageSize,
  };

  // 通用搜索文本：只在有值时才传递
  if (queryParams.searchText && String(queryParams.searchText).trim()) {
    params.searchText = String(queryParams.searchText).trim();
  }

  // 精确搜索条件
  if (queryParams.id && String(queryParams.id).trim()) {
    params.id = String(queryParams.id).trim();
  }
  if (queryParams.code && String(queryParams.code).trim()) {
    params.code = String(queryParams.code).trim();
  }

  // 如果选择了发布状态，添加到查询参数中
  if (queryParams.isPublish !== undefined) {
    params.isPublish = queryParams.isPublish;
  }
  // 时间范围筛选
  if (queryParams.startTime) {
    params.startTime = queryParams.startTime;
  }
  if (queryParams.endTime) {
    params.endTime = queryParams.endTime;
  }
  params.random = queryParams.random;

  try {
    let res = await getProductList(params);
    dataSource.value = res.list || [];
    total.value = res.total || 0;
    ids.value = [];
  } catch (error) {
    ElMessage.error("获取列表失败");
    dataSource.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

// 重置查询参数
const resetQuery = () => {
  queryParams.currentPage = 1; // 搜索时重置到第一页
  queryParams.pageSize = 20;
  queryParams.id = '';
  queryParams.code = '';
  queryParams.searchText = '';
  queryParams.search = '';
  queryParams.isPublish = undefined;
  queryParams.random = false;
  queryParams.startTime = '';
  queryParams.endTime = '';
};

// 搜索按钮点击事件
const handleSearch = () => {
  queryParams.currentPage = 1; // 搜索时重置到第一页
  getList();
};

// 处理显示关联信息切换
const handleShowRelationsChange = () => {
  // 列配置会自动更新，因为使用了 computed
};

// 查看产品详情
async function handleViewDetail(row: any) {
  if (!row?.id) {
    ElMessage.warning('产品ID不存在');
    return;
  }

  productDetailLoading.value = true;
  productDetailVisible.value = true;
  productDetail.value = null;

  try {
    // 根据 id 查询产品详情
    const res = await getProductList({
      id: row.id,
      currentPage: 1,
      pageSize: 1
    });

    if (res && res.list && res.list.length > 0) {
      productDetail.value = res.list[0];
    } else {
      ElMessage.error('未找到产品详情');
      productDetailVisible.value = false;
    }
  } catch (error: any) {
    console.error('获取产品详情失败:', error);
    ElMessage.error(error?.message || '获取产品详情失败');
    productDetailVisible.value = false;
  } finally {
    productDetailLoading.value = false;
  }
}

function handleDelete(row?) {
  let delIds: string[] = [];
  if (row) {
    delIds = [row.id];
  } else if (!ids.value.length) {
    return ElMessage.warning("请选择要删除的数据");
  } else {
    delIds = [...ids.value];
  }

  ElMessageBox.confirm(`确认删除选中的${delIds.length}条数据吗`, "删除提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "error",
  })
    .then(async () => {
      try {
        await deleteProduct(delIds);
        ElMessage.success("删除成功");
        getList();
      } catch (error) {
        ElMessage.error("删除失败");
      }
    })
    .catch(() => { });
}

function handleAdd() {
  isEdit.value = false;
  dialogVisible.value = true;
  dialogTitle.value = "新建商品";
  form.value = {
    code: '',
    name: '',
    enName: '',
    description: '',
    enDescription: '',
    keywords: '',
    enKeywords: '',
    searchKeywords: '',
    enSearchKeywords: '',
    type: '',
    images: [] as string[],
    videos: [] as string[],
    tags: '',
    isActive: true,
    isPublish: false,
    file: null,
  };
  fileList.value = [];
  pendingFiles.value = [];
  videoFileList.value = [];
  pendingVideoFiles.value = [];
}

function handleEdit(row) {
  currentRow.value = row;
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑商品";
  const images = Array.isArray(row.images) ? row.images : [];
  const videos = Array.isArray(row.videos) ? row.videos : [];
  form.value = {
    ...row,
    images,
    videos,
  };
  if (images.length > 0) {
    fileList.value = images.map((url, index) => ({
      name: `图片${index + 1}`,
      url: url
    }));
    pendingFiles.value = [];
  } else {
    fileList.value = [];
    pendingFiles.value = [];
  }
  if (videos.length > 0) {
    videoFileList.value = videos.map((url, index) => ({
      name: `视频${index + 1}`,
      url: url
    }));
    pendingVideoFiles.value = [];
  } else {
    videoFileList.value = [];
    pendingVideoFiles.value = [];
  }
}

// 处理发布/下架切换
async function handleTogglePublish(row) {
  const action = row.isPublish ? '下架' : '发布';
  try {
    await ElMessageBox.confirm(
      `确认${action}商品"${row.name}"吗？`,
      `${action}确认`,
      {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    // 调用更新发布状态接口，只传递id和isPublish
    await updatePublishStatus({
      id: row.id,
      isPublish: !row.isPublish
    });

    ElMessage.success(`${action}成功`);
    getList(); // 重新获取列表
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`);
    }
  }
}

// 处理发布按钮点击
function handlePublish(row: any) {
  currentPublishRow.value = row;
  publishDialogVisible.value = true;
  // 默认选中主要平台
  selectedPlatforms.value = ['douyin', 'kuaishou', 'xiaohongshu', 'weibo'];
  // 如果有英文字段，默认也选中国际化平台
  if (row.enName || row.enDescription) {
    selectedPlatforms.value.push('tiktok', 'youtube');
  }
  // 初始化表单
  initPublishForm(row, selectedPlatforms.value);
}

async function initPublishForm(row, platforms) {
  // 查询草稿图片
  let images = [];
  let videos = [];
  let customModelId = (row as any)?.customModelId;
  if (!customModelId && (row as any)?.customModel && (row as any).customModel.id) {
    customModelId = (row as any).customModel.id;
  }
  if (customModelId) {
    try {
      const res = await getDraftList({
        customModelId,
        currentPage: 1,
        pageSize: 100
      });
      // 分离图片和视频
      const drafts = res.list || [];
      drafts.forEach(draft => {
        if (draft.url) {
          const isVideo = draft.suffix && ['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(draft.suffix.toLowerCase());
          if (isVideo) {
            videos.push(draft.url);
          } else {
            images.push(draft.url);
          }
        }
      });
    } catch (e) {
      images = [];
      videos = [];
    }
  }

  // 添加关联模型的缩略图
  if ((row as any)?.customModel?.thumbnail) {
    const thumbnailUrl = (row as any).customModel.thumbnail;
    // 如果缩略图不在图片列表中，则添加到开头
    if (!images.includes(thumbnailUrl)) {
      images.unshift(thumbnailUrl);
    }
  }

  // 添加商品本身的图片和视频
  if (row.images && Array.isArray(row.images)) {
    images = [...images, ...row.images];
  }
  if (row.videos && Array.isArray(row.videos)) {
    videos = [...videos, ...row.videos];
  }

  // 初始化每个平台的表单
  platforms.forEach(platform => {
    // 判断是否优先使用英文字段
    const isEnPlatform = ['tiktok', 'youtube'].includes(platform);

    let title = row?.name || '';
    let content = row?.description || '';

    if (isEnPlatform) {
      title = (row.enName && row.enName.trim() ? row.enName : (row.name || ''));
      content = (row.enDescription && row.enDescription.trim() ? row.enDescription : (row.description || ''));
    }

    publishForm.value[platform as keyof PublishForm] = {
      title: title,
      content: content,
      images: images,
      selectedImages: [...images],
      videos: videos,
      selectedVideos: [...videos]
    };
  });
  // 清理未选中的平台
  Object.keys(publishForm.value).forEach(platform => {
    if (!platforms.includes(platform)) {
      publishForm.value[platform as keyof PublishForm] = null;
    }
  });
}

// 获取平台名称
const getPlatformName = (platform: string) => {
  const platformNames: Record<string, string> = {
    douyin: '抖音',
    xiaohongshu: '小红书',
    weibo: '微博',
    kuaishou: '快手',
    bilibili: 'B站',
    xianyu: '咸鱼',
    tiktok: 'TikTok',
    youtube: 'YouTube'
  };
  return platformNames[platform] || platform;
};



// 格式化发布结果的message
function formatPublishMessage(result: any) {
  const platformName = getPlatformName(result.platform);
  if (result.data) {
    if (result.data.loginStatus === 'not_logged_in') {
      return `${platformName}未登录，请先登录该平台`;
    }
    if (result.data.loginStatus === 'error') {
      return `${platformName}接口异常：${result.data.error || result.message || '未知错误'}`;
    }
    if (result.data.loginStatus === 'logged_in' && !result.success) {
      return `${platformName}已登录，但发布失败：${result.message || '未知错误'}`;
    }
  }
  return result.message || '未知错误';
}

// 关闭发布弹窗
function publishDialogClose() {
  publishDialogVisible.value = false;
  publishLoading.value = false;
  selectedPlatforms.value = [];
  // 重置所有平台表单为null
  Object.keys(publishForm.value).forEach(platform => {
    publishForm.value[platform as keyof PublishForm | 'kuaishou'] = null;
  });
  // 清空发布结果
  publishResults.value = [];
  // 重置当前发布行
  currentPublishRow.value = {};
}

// 处理内容输入，自适应textarea高度
function handleContentInput(platform: string) {
  // Element Plus的autosize属性会自动处理高度调整
  // 这里可以添加其他逻辑，比如字数统计等
}

// 修改发布提交方法
async function handlePublishSubmit() {
  if (!currentPublishRow.value?.id) {
    return ElMessage.warning('商品ID不存在');
  }

  if (selectedPlatforms.value.length === 0) {
    return ElMessage.warning('请至少选择一个发布平台');
  }

  // 验证每个选中平台的表单
  for (const platform of selectedPlatforms.value) {
    const pForm = publishForm.value[platform as keyof PublishForm];
    if (!pForm) continue;

    if (platform !== 'weibo' && (!pForm.title || !pForm.content)) {
      return ElMessage.warning(`请完善${getPlatformName(platform)}的发布内容`);
    }
    if (platform === 'weibo' && !pForm.content) {
      return ElMessage.warning(`请完善${getPlatformName(platform)}的发布内容`);
    }
    if (pForm.selectedImages.length === 0 && pForm.selectedVideos.length === 0) {
      return ElMessage.warning(`请至少选择一张图片或一个视频用于${getPlatformName(platform)}发布`);
    }
  }

  publishLoading.value = true;
  try {
    const row = currentPublishRow.value as any;

    // 为每个选中的平台创建任务
    const tasks = selectedPlatforms.value.map(platform => {
      const pForm = publishForm.value[platform as keyof PublishForm];
      if (!pForm) return null;

      return {
        type: getPublishTaskType(platform),
        data: {
          productId: row.id,
          platform: platform,
          // 手动输入的数据作为覆盖
          title: pForm.title,
          description: pForm.content,
          images: pForm.selectedImages,
          videos: pForm.selectedVideos,
        },
        description: `手动发布商品"${row.name || row.id}"到${getPlatformName(platform)}`,
        metadata: {
          platform: platform,
          productId: row.id,
          productName: row.name,
          manual: true
        },
      };
    }).filter(Boolean);

    // 批量创建任务
    const results = await Promise.all(
      tasks.map(task => task && createTask(task as any))
    );

    const successCount = results.filter(r => r && r.id).length;

    if (successCount === selectedPlatforms.value.length) {
      ElMessage.success(`成功创建 ${successCount} 个发布任务，已添加到发布队列`);
      publishDialogVisible.value = false;
    } else {
      ElMessage.warning(`成功创建 ${successCount}/${selectedPlatforms.value.length} 个发布任务`);
    }
  } catch (error: any) {
    console.error('手动创建发布任务失败:', error);
    ElMessage.error(error?.message || '发布任务创建失败');
  } finally {
    publishLoading.value = false;
  }
}

// 发布结果弹窗关闭时清空结果，并关闭发布弹窗
function closePublishResultDialog() {
  publishResultVisible.value = false;
  publishResults.value = [];
  publishDialogVisible.value = false;
}




// 视频预览相关
const videoPreviewVisible = ref(false);
const videoPreviewList = ref<string[]>([]);
const videoPreviewIndex = ref(0);
const videoPreviewRowId = ref<string>('');
const videoPreviewAllowDelete = ref(false);

function handleVideoPreview(list: string[], index: number, row?: any) {
  videoPreviewList.value = list;
  videoPreviewIndex.value = index;
  videoPreviewRowId.value = row?.id || '';
  videoPreviewAllowDelete.value = Boolean(row?.id && row?.videos);
  videoPreviewVisible.value = true;
}

function prevVideo() {
  if (videoPreviewIndex.value > 0) {
    videoPreviewIndex.value--;
  }
}

function nextVideo() {
  if (videoPreviewIndex.value < videoPreviewList.value.length - 1) {
    videoPreviewIndex.value++;
  }
}

const customModelDetailVisible = ref(false)
const customModelDetail = ref<any>(null)

// 关联信息详情弹窗
const relationsDetailVisible = ref(false)
const currentRelationsRow = ref<any>(null)

// 查看源信息相关状态
const relationsSourceInfoVisible = ref(false)
const currentSourceInfoRow = ref<any>(null)
const activeSourceTab = ref('customModel')

async function showCustomModelDetail(id: string) {
  try {
    const res = await getDesignModel({ id })
    customModelDetail.value = res.data || res // 兼容不同返回结构
    customModelDetailVisible.value = true
  } catch (e) {
    ElMessage.error('获取模型详情失败')
  }
}

const customModelDraftDialogVisible = ref(false)
const customModelDrafts = ref([])
const customModelDraftModel = ref<any>(null)

async function showCustomModelDrafts(model) {
  customModelDraftModel.value = model
  customModelDraftDialogVisible.value = true
  try {
    const res = await getDraftList({
      customModelId: model.id,
      currentPage: 1,
      pageSize: 100
    })
    customModelDrafts.value = res.list || []
  } catch (error) {
    ElMessage.error('获取关联草稿失败')
    customModelDrafts.value = []
  }
}

const aiGenDialogVisible = ref(false)
const aiGenPrompt = ref('')
const aiGenDialogLoading = ref(false)
const aiGenRow = ref<any>(null)

function onAiProductAutoGenerate(row) {
  if (aiGenDialogLoading.value) return
  aiGenRow.value = row
  aiGenPrompt.value = ''
  aiGenDialogVisible.value = true
}

async function submitAiGenDialog() {
  if (!aiGenRow.value) return
  aiGenDialogLoading.value = true
  try {
    const res = await aiGenerateProductInfo({
      id: aiGenRow.value.id,
      prompt: aiGenPrompt.value || ''
    })
    if (res && res.name) {
      aiGenRow.value.name = res.name
      aiGenRow.value.enName = res.enName
      aiGenRow.value.description = res.description
      aiGenRow.value.enDescription = res.enDescription
      aiGenRow.value.keywords = res.keywords
      aiGenRow.value.enKeywords = res.enKeywords
      aiGenRow.value.searchKeywords = res.searchKeywords
      aiGenRow.value.enSearchKeywords = res.enSearchKeywords
      ElMessage.success('AI自动生成内容成功')
      getList()
    } else {
      ElMessage.error('AI生成内容失败，未返回有效数据')
    }
    aiGenDialogVisible.value = false
  } catch (e) {
    ElMessage.error('AI自动生成内容失败')
  } finally {
    aiGenDialogLoading.value = false
    aiGenRow.value = null
  }
}

// 处理dropdown操作命令
function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case 'view-detail':
      handleViewDetail(row);
      break;
    case 'edit':
      handleEdit(row);
      break;
    case 'delete':
      handleDelete(row);
      break;
    case 'mark-published':
      handleUpdatePublishStatus(row, true);
      break;
    case 'mark-unpublished':
      handleUpdatePublishStatus(row, false);
      break;
    case 'social-publish':
      handlePublish(row);
      break;
    case 'ai-generate':
      onAiProductAutoGenerate(row);
      break;
    case 'generate-code':
      handleGenerateProductCode(row);
      break;
    case 'copy-images-from-psdset':
      handleCopyImagesFromPsdSet(row);
      break;
    case 'generate-video':
      handleGenerateVideo(row);
      break;
    case 'export-social-media':
      handleSocialMediaExport(row);
      break;
    case 'publish-to-queue':
      handlePublishToQueue(row);
      break;
    case 'view-publish-tasks':
      handleViewPublishTasks(row);
      break;
    default:
      console.warn('未知的操作命令:', command);
  }
}

async function handleSocialMediaExport(row: any) {
  if (!row?.id) return;
  try {
    const res = await getProductSocialMediaExport(row.id);
    socialExportText.value = JSON.stringify(res, null, 2);
    socialExportVisible.value = true;
  } catch (e: any) {
    ElMessage.error(e?.message || '导出失败');
  }
}

async function copySocialExport() {
  if (!socialExportText.value) return;
  try {
    await navigator.clipboard.writeText(socialExportText.value);
    ElMessage.success('已复制');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = socialExportText.value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    ElMessage.success('已复制');
  }
}

// 批量发布
async function batchPublish(rows?: any[]) {
  const list = rows && rows.length ? rows : selectedRows.value;
  if (!list || list.length === 0) {
    return ElMessage.warning('请先选择要发布的记录');
  }
  try {
    const tasks = list.map(item => updatePublishStatus({ id: item.id, isPublish: true }));
    await Promise.all(tasks);
    ElMessage.success(`已发布 ${list.length} 条记录`);
    getList();
  } catch (e) {
    ElMessage.error('批量发布失败，请重试');
  }
}

// 批量下架
async function batchUnpublish(rows?: any[]) {
  const list = rows && rows.length ? rows : selectedRows.value;
  if (!list || list.length === 0) {
    return ElMessage.warning('请先选择要下架的记录');
  }
  try {
    const tasks = list.map(item => updatePublishStatus({ id: item.id, isPublish: false }));
    await Promise.all(tasks);
    ElMessage.success(`已下架 ${list.length} 条记录`);
    getList();
  } catch (e) {
    ElMessage.error('批量下架失败，请重试');
  }
}

// 处理生成产品代码（统一走后端接口，由后端保证唯一不重复）
async function handleGenerateProductCode(row: any) {
  try {
    const res = await generateProductCode({ id: row.id });
    if (res && res.code) {
      row.code = res.code;
      ElMessage.success('产品代码生成成功');
      getList();
    } else {
      ElMessage.warning('未返回产品代码，请重试');
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '生成产品代码失败');
  }
}

// 切换图片选择状态（视频生成）- 已由于抽离组件而弃用
function toggleVideoGenImageSelection(url: string) {
  // logic moved to VideoGenDialog
}

// 根据商品图片生成视频 - 已由于抽离组件而弃用
async function submitGenerateVideo() {
  // logic moved to VideoGenDialog
}


// 删除单个视频（会触发后端删除 COS 对应文件）
async function handleDeleteVideo(row: any, url: string) {
  if (!row?.id || !url) return;
  try {
    await ElMessageBox.confirm('确认删除该视频吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    deletingVideoKey.value = `${row.id}-${url}`;
    const newVideos = (row.videos || []).filter((v: string) => v !== url);
    await updateProduct({ id: row.id, videos: newVideos });

    // 更新预览列表和索引
    const deletedIndex = videoPreviewList.value.findIndex(v => v === url);
    videoPreviewList.value = newVideos;

    if (videoPreviewList.value.length === 0) {
      // 如果没有视频了，关闭弹窗
      videoPreviewVisible.value = false;
    } else {
      // 调整索引：如果删除的是当前或之前的视频，索引需要调整
      if (deletedIndex <= videoPreviewIndex.value) {
        videoPreviewIndex.value = Math.max(0, videoPreviewIndex.value - 1);
      }
      // 确保索引不越界
      if (videoPreviewIndex.value >= videoPreviewList.value.length) {
        videoPreviewIndex.value = videoPreviewList.value.length - 1;
      }
    }

    ElMessage.success('视频已删除');
    getList();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除视频失败');
    }
  } finally {
    deletingVideoKey.value = '';
  }
}

// 复制关联 PSD 套图信息到商品
async function handleCopyImagesFromPsdSet(row: any) {
  if (!row?.id) return
  if (!row?.psdSetId) {
    return ElMessage.warning('该商品未关联PSD套图')
  }
  try {
    await request.post({
      url: '/product/copy-images-from-psdset',
      data: {
        id: row.id,
        copyBasicInfo: {
          enabled: true,
          copyName: true,
          copyDescription: true,
          copyKeywords: true,
        },
        imageOptions: {
          replace: false,
        },
      },
    })
    ElMessage.success('复制成功')
    getList()
  } catch (e) {
    ElMessage.error(e?.message || '复制失败')
  }
}

// 处理草稿视频预览
function handleDraftVideoPlay(draft: any) {
  videoPreviewList.value = [draft.url];
  videoPreviewIndex.value = 0;
  videoPreviewVisible.value = true;
}

// 处理发布弹窗中的视频预览
function handlePublishVideoPreview(videos: string[], index: number) {
  videoPreviewList.value = videos;
  videoPreviewIndex.value = index;
  videoPreviewVisible.value = true;
}

// 切换图片选择状态
function toggleImageSelection(platform: string, url: string) {
  const form = publishForm.value[platform as keyof PublishForm | 'kuaishou'];
  if (!form) return;

  const index = form.selectedImages.indexOf(url);
  if (index > -1) {
    form.selectedImages.splice(index, 1);
  } else {
    form.selectedImages.push(url);
  }
}

// 切换视频选择状态
function toggleVideoSelection(platform: string, url: string) {
  const form = publishForm.value[platform as keyof PublishForm | 'kuaishou'];
  if (!form) return;

  const index = form.selectedVideos.indexOf(url);
  if (index > -1) {
    form.selectedVideos.splice(index, 1);
  } else {
    form.selectedVideos.push(url);
  }
}

// 下载缩略图
async function downloadThumbnail(url: string, filename: string) {
  try {
    ElMessage.info('正在准备下载...');

    const result = await downloadImageEnhanced(url, filename, {
      showMessage: false, // 关闭通用方法的console消息，使用我们的ElMessage
      fallbackToNewWindow: true
    });

    if (result.success) {
      ElMessage.success('下载完成');
    } else if (result.fallback) {
      ElMessage.warning(result.message);
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('下载失败:', error);
    ElMessage.error('下载失败，请重试');
  }
}

// 预览图片
function preview(index: number, urls: string[]) {
  if (!urls || urls.length === 0) return
  previewList.value = urls
  previewIndex.value = Math.max(0, Math.min(index, urls.length - 1))
  previewUrl.value = urls[previewIndex.value] || urls[0]
  previewVisible.value = true
}

// 获取设计模型的图片列表（用于展示）
function getCustomModelImages(customModel: any): string[] {
  if (!customModel) return []
  const images: string[] = []

  // 添加缩略图
  if (customModel.thumbnail && typeof customModel.thumbnail === 'string' && customModel.thumbnail.trim()) {
    images.push(customModel.thumbnail)
  }

  // 添加其他图片
  if (customModel.images && Array.isArray(customModel.images)) {
    customModel.images.forEach((url: string) => {
      if (url && typeof url === 'string' && url.trim() && !images.includes(url)) {
        images.push(url)
      }
    })
  }

  return images
}

// 获取 PSD 套图的图片列表，兼容数组、逗号分隔字符串、meta.images
function getPsdSetImages(psdSet: any): string[] {
  if (!psdSet) return []
  // 提取 images 字段（优先），兼容数组/对象数组/字符串
  const normalizeArray = (arr: any[]) =>
    arr
      .map((u) => {
        if (typeof u === 'string') return u.trim()
        if (u && typeof u === 'object' && typeof u.url === 'string') return u.url.trim()
        return ''
      })
      .filter((u) => !!u)

  if (Array.isArray(psdSet.images)) {
    const urls = normalizeArray(psdSet.images)
    if (urls.length) return urls
  }

  if (typeof psdSet.images === 'string') {
    const raw = psdSet.images.trim()
    if ((raw.startsWith('[') && raw.endsWith(']')) || (raw.startsWith('{') && raw.endsWith('}'))) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          const urls = normalizeArray(parsed)
          if (urls.length) return urls
        }
      } catch {
        // ignore and fallback
      }
    }
    const urls = raw
      .split(',')
      .map((u: string) => u.trim())
      .filter((u: string) => u)
    if (urls.length) return urls
  }

  // 最后一层兜底：meta.images 仅在 images 为空时尝试
  const meta = psdSet.meta || {}
  if (Array.isArray(meta.images)) {
    const urls = normalizeArray(meta.images)
    if (urls.length) return urls
  }
  if (typeof meta.images === 'string') {
    const urls = meta.images
      .split(',')
      .map((u: string) => u.trim())
      .filter((u: string) => u)
    if (urls.length) return urls
  }

  return []
}



// 显示关联信息详情
function showRelationsDetail(row: any) {
  currentRelationsRow.value = row
  relationsDetailVisible.value = true
}

// 查看源信息
function showRelationsSourceInfo(row: any) {
  currentSourceInfoRow.value = row
  // 设置默认激活的标签页
  if (row.customModel) {
    activeSourceTab.value = 'customModel'
  } else if (row.sticker) {
    activeSourceTab.value = 'sticker'
  } else if (row.psdSet) {
    activeSourceTab.value = 'psdSet'
  }
  relationsSourceInfoVisible.value = true
}

// 格式化JSON显示
function formatJSON(obj: any): string {
  if (!obj) return '无数据'
  try {
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return String(obj)
  }
}

// 复制源信息
async function copySourceInfo() {
  if (!currentSourceInfoRow.value) return

  let jsonText = ''
  if (activeSourceTab.value === 'customModel' && currentSourceInfoRow.value.customModel) {
    jsonText = JSON.stringify(currentSourceInfoRow.value.customModel, null, 2)
  } else if (activeSourceTab.value === 'sticker' && currentSourceInfoRow.value.sticker) {
    jsonText = JSON.stringify(currentSourceInfoRow.value.sticker, null, 2)
  } else if (activeSourceTab.value === 'psdSet' && currentSourceInfoRow.value.psdSet) {
    jsonText = JSON.stringify(currentSourceInfoRow.value.psdSet, null, 2)
  }

  if (jsonText) {
    try {
      await navigator.clipboard.writeText(jsonText)
      ElMessage.success('已复制到剪贴板')
    } catch (e) {
      // 降级方案
      const textarea = document.createElement('textarea')
      textarea.value = jsonText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      ElMessage.success('已复制到剪贴板')
    }
  }
}

async function handleUpdatePublishStatus(row: any, isPublish: boolean) {
  try {
    await updatePublishStatus({
      id: row.id,
      isPublish: isPublish
    });
    ElMessage.success(`发布状态已更新为：${isPublish ? '已发布' : '未发布'}`);
    getList();
  } catch (e) {
    ElMessage.error('更新发布状态失败');
  }
}

// 平台 logo 使用 Iconify API（simple-icons 等），无则用首字 fallback
const PUBLISH_PLATFORM_LOGOS: Record<string, string> = {
  douyin: 'https://api.iconify.design/simple-icons/douyin.svg',
  xiaohongshu: 'https://api.iconify.design/simple-icons/xiaohongshu.svg',
  weibo: 'https://api.iconify.design/simple-icons/sinaweibo.svg',
  kuaishou: 'https://api.iconify.design/simple-icons/kuaishou.svg',
  bilibili: 'https://api.iconify.design/simple-icons/bilibili.svg',
  zhihu: 'https://api.iconify.design/simple-icons/zhihu.svg',
  tiktok: 'https://api.iconify.design/simple-icons/tiktok.svg',
  taobao: 'https://api.iconify.design/simple-icons/taobao.svg',
  youtube: 'https://api.iconify.design/simple-icons/youtube.svg',
  instagram: 'https://api.iconify.design/simple-icons/instagram.svg',
  facebook: 'https://api.iconify.design/simple-icons/facebook.svg',
  twitter: 'https://api.iconify.design/simple-icons/twitter.svg',
  wechat: 'https://api.iconify.design/simple-icons/wechat.svg',
};

// 发布平台选项（任务类型命名：{action}-{object}-{platform}，便于任务队列查询）
const publishPlatforms = [
  { label: '抖音', value: 'douyin', icon: '抖', color: '#000000', logoUrl: PUBLISH_PLATFORM_LOGOS.douyin },
  { label: '小红书', value: 'xiaohongshu', icon: '红', color: '#FF2442', logoUrl: PUBLISH_PLATFORM_LOGOS.xiaohongshu },
  { label: '微博', value: 'weibo', icon: '微', color: '#E6162D', logoUrl: PUBLISH_PLATFORM_LOGOS.weibo },
  { label: '快手', value: 'kuaishou', icon: '快', color: '#FF6600', logoUrl: PUBLISH_PLATFORM_LOGOS.kuaishou },
  { label: 'B站', value: 'bilibili', icon: 'B', color: '#FB7299', logoUrl: PUBLISH_PLATFORM_LOGOS.bilibili },
  { label: '知乎', value: 'zhihu', icon: '知', color: '#0084FF', logoUrl: PUBLISH_PLATFORM_LOGOS.zhihu },
  { label: 'TikTok', value: 'tiktok', icon: 'T', color: '#000000', logoUrl: PUBLISH_PLATFORM_LOGOS.tiktok },
  { label: 'Temu', value: 'temu', icon: 'T', color: '#FF6B35', logoUrl: undefined },
  { label: '淘宝', value: 'taobao', icon: '淘', color: '#FF4400', logoUrl: PUBLISH_PLATFORM_LOGOS.taobao },
  { label: 'YouTube', value: 'youtube', icon: 'Y', color: '#FF0000', logoUrl: PUBLISH_PLATFORM_LOGOS.youtube },
  { label: 'Instagram', value: 'instagram', icon: 'I', color: '#E4405F', logoUrl: PUBLISH_PLATFORM_LOGOS.instagram },
  { label: 'Facebook', value: 'facebook', icon: 'F', color: '#1877F2', logoUrl: PUBLISH_PLATFORM_LOGOS.facebook },
  { label: 'Twitter', value: 'twitter', icon: 'T', color: '#1DA1F2', logoUrl: PUBLISH_PLATFORM_LOGOS.twitter },
  { label: '视频号', value: 'wechat_channels', icon: '视', color: '#07C160', logoUrl: PUBLISH_PLATFORM_LOGOS.wechat },
  { label: '百家号', value: 'baijiahao', icon: '百', color: '#105BFD', logoUrl: undefined },
  { label: '咸鱼', value: 'xianyu', icon: '咸', color: '#FFDA44', logoUrl: undefined },
  { label: '京东', value: 'jd', icon: '京', color: '#E4393C', logoUrl: undefined },
  { label: '拼多多', value: 'pinduoduo', icon: '拼', color: '#E02E24', logoUrl: undefined },
  { label: '今日头条', value: 'toutiao', icon: '头', color: '#ED4040', logoUrl: undefined },
  { label: '大鱼号', value: 'dayu', icon: '大', color: '#3A76D2', logoUrl: undefined },
  { label: '企鹅号', value: 'penguin', icon: '企', color: '#2783F4', logoUrl: undefined },
  { label: '搜狐号', value: 'sohu', icon: '搜', color: '#FFC335', logoUrl: undefined },
  { label: '网易号', value: 'netease', icon: '网', color: '#D22923', logoUrl: undefined },
  { label: '度小视', value: 'duxiaoshi', icon: '度', color: '#33BEFF', logoUrl: undefined },
  { label: '美拍', value: 'meipai', icon: '美', color: '#FF547D', logoUrl: undefined },
  { label: '秒拍', value: 'miaopai', icon: '秒', color: '#FFD705', logoUrl: undefined },
  { label: 'A站', value: 'acfun', icon: 'A', color: '#FD4C5D', logoUrl: undefined },
  { label: '西瓜视频', value: 'xigua', icon: '西', color: '#FE3059', logoUrl: undefined },
  { label: '好看视频', value: 'haokan', icon: '好', color: '#EE3333', logoUrl: undefined },
  { label: '全民小视频', value: 'quanmin', icon: '全', color: '#FD3756', logoUrl: undefined },
];

// 获取平台相关元数据
const getPlatformColor = (platform: string) => {
  return publishPlatforms.find(p => p.value === platform)?.color || '#999';
};

const getPlatformLogo = (platform: string) => {
  return publishPlatforms.find(p => p.value === platform)?.logoUrl;
};

const getPlatformIcon = (platform: string) => {
  return publishPlatforms.find(p => p.value === platform)?.icon || 'P';
};

// 格式化平台名称
function formatPlatformName(platform: string) {
  const platformMap: Record<string, string> = {
    douyin: '抖音',
    xiaohongshu: '小红书',
    weibo: '微博',
    kuaishou: '快手',
    bilibili: 'B站',
    zhihu: '知乎',
    tiktok: 'TikTok',
    temu: 'Temu',
    taobao: '淘宝',
    youtube: 'YouTube',
    instagram: 'Instagram',
    facebook: 'Facebook',
    twitter: 'Twitter',
    wechat_channels: '视频号',
    baijiahao: '百家号',
    xianyu: '咸鱼',
    jd: '京东',
    pinduoduo: '拼多多',
    toutiao: '今日头条',
    dayu: '大鱼号',
    penguin: '企鹅号',
    sohu: '搜狐号',
    netease: '网易号',
    duxiaoshi: '度小视',
    meipai: '美拍',
    miaopai: '秒拍',
    acfun: 'A站',
    xigua: '西瓜视频',
    haokan: '好看视频',
    quanmin: '全民小视频',
  };
  return platformMap[platform] || platform;
}

// 任务类型命名：{action}-{object}-{platform}，便于任务队列按平台查询
function getPublishTaskType(platform: string) {
  return `publish-product-${platform}`;
}

// 发布到平台队列
async function handlePublishToQueue(row: any) {
  if (!row?.id) {
    return ElMessage.warning('商品ID不存在');
  }

  currentPublishProduct.value = row;
  publishQueueSelectedConfigIds.value = [];
  publishConfigSearchText.value = '';
  publishConfigCurrentPage.value = 1;

  // 获取发布配置
  try {
    const res = await getPublishConfigListApi();
    if (Array.isArray(res)) {
      availablePublishConfigs.value = res;
    } else if (res && res.list) {
      availablePublishConfigs.value = res.list;
    } else {
      availablePublishConfigs.value = [];
    }
  } catch (e) {
    console.error(e);
    ElMessage.error('获取发布配置失败');
    return;
  }

  publishPlatformDialogVisible.value = true;
}

// 确认发布到选中的平台
async function confirmPublishToPlatforms() {
  if (!currentPublishProduct.value?.id) {
    return ElMessage.warning('商品ID不存在');
  }

  if (publishQueueSelectedConfigIds.value.length === 0) {
    return ElMessage.warning('请至少选择一个发布配置');
  }

  const row = currentPublishProduct.value;
  const configIds = publishQueueSelectedConfigIds.value;
  publishConfirmLoading.value = true;

  try {
    // 为每个配置创建一个单独的任务
    const tasks = configIds.map(configId => {
      const config = availablePublishConfigs.value.find(c => c.id === configId);
      if (!config) return null;

      return {
        type: getPublishTaskType(config.platform),
        data: {
          productId: row.id,
          platform: config.platform,
          publishConfigId: config.id,
          // 将配置中的个性化数据合并到 data 中，供执行端使用
          ...(config.configData || {})
        },
        description: `发布商品"${row.name || row.id}"到${config.name} (${formatPlatformName(config.platform)})`,
        metadata: {
          platform: config.platform,
          productId: row.id,
          productName: row.name,
          publishConfigId: config.id,
          configName: config.name
        },
      };
    }).filter(Boolean);

    // 批量创建任务
    const results = await Promise.all(
      tasks.map(task => task && createTask(task))
    );

    const successCount = results.filter(r => r && r.id).length;

    publishPlatformDialogVisible.value = false;

    if (successCount === configIds.length) {
      ElMessage.success(`成功创建 ${successCount} 个发布任务，已添加到发布队列`);
    } else {
      ElMessage.warning(`成功创建 ${successCount}/${configIds.length} 个发布任务`);
    }
  } catch (error: any) {
    console.error('创建发布任务失败:', error);
    ElMessage.error(error?.message || '创建发布任务失败');
  } finally {
    publishConfirmLoading.value = false;
  }
}

// 查看发布详情
const publishTasksVisible = ref(false);
const publishTasks = ref<any[]>([]);
const currentProductForTasks = ref<any>(null);
const publishTasksLoading = ref(false);

// 发布任务列表列配置
const publishTasksColumns = [
  { field: 'platform', title: '平台', width: 120, slots: { default: 'platformSlot' } },
  { field: 'status', title: '状态', width: 120, slots: { default: 'statusSlot' } },
  { field: 'description', title: '描述', minWidth: 200, showOverflow: true },
  { field: 'attempts', title: '重试次数', width: 120, slots: { default: 'attemptsSlot' } },
  { field: 'createdAt', title: '创建时间', width: 180, slots: { default: 'createdAtSlot' } },
  { field: 'updatedAt', title: '更新时间', width: 180, slots: { default: 'updatedAtSlot' } },
  { field: 'processedAt', title: '完成时间', width: 180, slots: { default: 'processedAtSlot' } },
  { field: 'error', title: '错误信息', minWidth: 200, showOverflow: true, slots: { default: 'errorSlot' } },
];

async function handleViewPublishTasks(row: any) {
  if (!row?.id) {
    return ElMessage.warning('商品ID不存在');
  }

  currentProductForTasks.value = row;
  publishTasksVisible.value = true;
  publishTasksLoading.value = true;

  try {
    const res = await getProductPublishTasks(row.id);
    publishTasks.value = res || [];
  } catch (error: any) {
    console.error('获取发布任务列表失败:', error);
    ElMessage.error(error?.message || '获取发布任务列表失败');
    publishTasks.value = [];
  } finally {
    publishTasksLoading.value = false;
  }
}

// 格式化任务状态
function formatTaskStatus(status: string) {
  const statusMap: Record<string, { label: string; type: string }> = {
    pending: { label: '待处理', type: 'info' },
    processing: { label: '处理中', type: 'warning' },
    completed: { label: '已完成', type: 'success' },
    failed: { label: '失败', type: 'danger' },
  };
  return statusMap[status] || { label: status, type: 'info' };
}

</script>

<style lang="less">
.custom-carousel {
  position: relative;
  padding: 0 20px;

  .el-carousel__container {
    margin: 0 -20px;
  }

  .el-carousel__arrow {
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    width: 24px;
    height: 24px;

    &:hover {
      background-color: rgba(0, 0, 0, 0.5);
    }

    i {
      font-size: 14px;
    }
  }

  .el-carousel__arrow--left {
    left: 0;
  }

  .el-carousel__arrow--right {
    right: 0;
  }
}




.dark-btn {
  background: var(--el-button-bg-color);
  color: var(--el-button-text-color) !important;
}

// 夜间模式风格的发布结果弹窗
.publish-result-dark-dialog .el-dialog__header {
  background: #232526;
  color: #fff;
  border-bottom: 1px solid #333;
}

.publish-result-dark-bg {
  background: #18191c;
}

.publish-result-dark-item {
  background: #232526 !important;
  border-color: #333 !important;
}

.publish-result-dark-dialog .el-dialog__body {
  background: #18191c;
}

.publish-result-dark-dialog .el-dialog__footer {
  background: #232526;
  border-top: 1px solid #333;
}

.publish-result-card {
  width: 29%;
  min-width: 220px;
  max-width: 32%;
  margin-bottom: 0 !important;
  flex: 1 1 29%;
  box-sizing: border-box;
}

@media (max-width: 900px) {
  .publish-result-card {
    width: 100%;
    max-width: 100%;
  }
}

.custom-model-detail-dialog {
  min-height: 320px;

  .el-form-item {
    margin-bottom: 18px;
  }

  .el-form-item__label {
    font-weight: 500;
    font-size: 15px;
  }

  pre {
    border-radius: 4px;
    padding: 0;
    font-size: 13px;
    margin: 0;
    background: none;
  }
}


.draft-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.draft-item {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: var(--el-box-shadow-light);
  }
}

.draft-preview {
  position: relative;
}

.draft-info {
  background: var(--el-bg-color);
}

.draft-header {
  .draft-name {
    font-weight: 500;
  }
}

.draft-desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.draft-meta {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 8px;
}

.empty-state {
  color: var(--el-text-color-placeholder);
}

/* 操作dropdown样式已移至公共样式文件 list-page-common.css */
/* 保留特定颜色样式 */
.operation-dropdown {
  .text-orange-500 {
    color: #f97316;
  }

  .text-green-500 {
    color: #22c55e;
  }
}

.video-preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 120px);
  padding: 20px;
  overflow: hidden;
}

.video-preview-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  max-width: 98vw;
  margin-bottom: 20px;
  z-index: 10;
}

.video-preview-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: 98vw;
  max-height: calc(100vh - 200px);
}

.video-nav-btn {
  position: absolute;
  z-index: 10;
  min-width: 48px !important;
  width: 48px !important;
  min-height: 48px !important;
  height: 48px !important;
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--el-border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  padding: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);

  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.video-nav-prev {
    left: 30px;
  }

  &.video-nav-next {
    right: 30px;
  }

  .el-icon {
    font-size: 20px;
    color: #333;
  }
}

.video-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.video-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
}

.video-page-info {
  font-size: 14px;
  color: var(--el-text-color-regular);
  text-align: center;
  font-weight: 500;
}

.video-preview-player {
  max-width: 98vw;
  max-height: calc(100vh - 240px);
  width: auto !important;
  height: auto !important;
  border-radius: 8px;
  display: block;
  object-fit: contain;
  position: relative;
  margin: 0 auto;
}

// 视频对话框样式
.video-dialog {
  .el-message-box__content {
    padding: 30px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .el-message-box__message {
    margin: 0;
  }

  video {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 70vh;
    object-fit: contain;
  }
}

.video-preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .video-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .play-icon {
    font-size: 30px;
    color: #fff;
  }
}

// 发布弹窗中视频样式
.platform-form {
  .el-form-item {
    margin-bottom: 20px;
  }

  video {
    border-radius: 8px;
  }

  .el-checkbox-group {
    .el-checkbox {
      margin-right: 0;
      margin-bottom: 0;
    }
  }
}

// 紧凑版平台表单样式
.platform-form-compact {
  .el-form-item {
    margin-bottom: 12px;
  }

  .el-form-item__label {
    font-size: 13px;
    line-height: 1.4;
  }

  .el-input__inner,
  .el-textarea__inner {
    font-size: 13px;
  }

  .el-card__header {
    padding: 12px 16px;
  }

  .el-card__body {
    padding: 12px 16px;
  }

  video {
    border-radius: 6px;
  }

  .el-checkbox-group {
    .el-checkbox {
      margin-right: 0;
      margin-bottom: 0;
    }
  }
}

// 自适应平台网格布局
.platform-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  align-items: start;
}

.platform-item {
  min-width: 0; // 防止内容溢出
}

// 响应式断点优化
@media (min-width: 1400px) {
  .platform-grid {
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  }
}

@media (min-width: 1600px) {
  .platform-grid {
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  }
}

@media (min-width: 1920px) {
  .platform-grid {
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  }
}

@media (max-width: 1399px) {
  .platform-grid {
    grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  }
}

@media (max-width: 1199px) {
  .platform-grid {
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  }
}

@media (max-width: 991px) {
  .platform-grid {
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  }
}

@media (max-width: 767px) {
  .platform-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .platform-form-compact {
    .el-card__header {
      padding: 8px 12px;
    }

    .el-card__body {
      padding: 8px 12px;
    }

    .el-form-item {
      margin-bottom: 8px;
    }

    .el-form-item__label {
      font-size: 12px;
    }

    .el-input__inner,
    .el-textarea__inner {
      font-size: 12px;
    }
  }
}

// 选择项样式
.select-item {
  position: relative;
  transition: all 0.2s ease;


  &.selected {
    .w-32 {
      box-shadow: 0 0 0 4px #3b82f6, 0 6px 20px rgba(59, 130, 246, 0.4);
    }
  }

  .w-32 {
    transition: all 0.2s ease;
  }
}

// 紧凑版选择项样式
.select-item-compact {
  position: relative;
  transition: all 0.2s ease;


  &.selected {
    .w-20 {
      box-shadow: 0 0 0 4px #3b82f6, 0 3px 12px rgba(59, 130, 246, 0.4);
    }
  }

  .w-20 {
    transition: all 0.2s ease;
  }
}

// Check图标样式优化
.check-icon {
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #2563eb !important;
  /* 蓝色 */

  svg {
    width: 12px;
    height: 12px;
    color: inherit;
    stroke-width: 5;
    font-weight: bold;
  }
}

// 关联信息列样式
.relations-summary {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.relations-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.relation-section-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.relation-header {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 6px;
  padding: 4px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.relation-label {
  color: var(--el-color-primary);
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(64, 158, 255, 0.1);
}

.relation-value {
  color: var(--el-text-color-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.relation-sub-grid {
  width: 100%;
  margin: 0;
  padding: 0;
  background: none;

  :deep(.vxe-table) {
    font-size: 12px;
  }

  :deep(.vxe-table--header) {
    background-color: var(--el-table-header-bg-color);
  }

  :deep(.vxe-table--body) {
    background-color: transparent;
  }

  :deep(.vxe-cell) {
    padding: 4px 8px;
  }

  :deep(.vxe-table--header-wrapper) {
    .vxe-cell {
      font-weight: 500;
      font-size: 12px;
    }
  }
}

.relation-thumb-image {
  width: 100px;
  height: 100px;
  object-fit: contain;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s ease;
  background-color: var(--el-bg-color-page);

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}

.relation-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.relation-detail-btn,
.relation-source-btn {
  margin-top: 4px;
  padding: 0;
  height: auto;
  font-size: 12px;
}

.source-info-content {
  max-height: 70vh;
  overflow-y: auto;
}

.source-info-section {
  padding: 16px;
}

.source-info-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
}

.source-info-json {
  background: var(--el-bg-color-page);
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  margin: 0;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 60vh;
  overflow-y: auto;
}

// 关联信息详情弹窗样式
.relations-detail-content {
  padding: 16px 0;
}

.relation-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.relation-section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--el-border-color-light);
}

// 视频生成配置弹窗样式
:deep(.el-dialog__body) {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 110px);
  padding: 20px;
  overflow: hidden;
}

.video-gen-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.video-gen-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  .el-card {
    .el-card__header {
      padding: 16px 20px;
    }

    .el-card__body {
      padding: 20px;
    }
  }

  .el-form-item {
    margin-bottom: 16px;
  }

  .el-row {
    margin-bottom: 0;
  }
}

.preview-info-item {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  text-align: center;

  .preview-label {
    font-size: 12px;
    margin-bottom: 8px;
  }

  .preview-value {
    font-size: 16px;
    font-weight: 600;
  }
}

// 产品详情弹窗样式
.product-detail-dialog {
  .el-dialog__body {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 160px);
    padding: 20px;
    overflow: hidden;
  }

  .product-detail-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .product-detail-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 8px;

    // 自定义滚动条样式
    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;

      &:hover {
        background: #a8a8a8;
      }
    }
  }

  .el-dialog__footer {
    flex-shrink: 0;
    padding: 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  // 产品信息列表样式
  .product-info-list {
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    overflow: hidden;
  }

  .product-info-item {
    display: flex;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }

    .product-info-label {
      width: 180px;
      min-width: 180px;
      padding: 12px 16px;
      background: var(--el-fill-color-lighter);
      font-weight: 500;
      color: var(--el-text-color-primary);
      border-right: 1px solid var(--el-border-color-lighter);
      flex-shrink: 0;
    }

    .product-info-value {
      flex: 1;
      padding: 12px 16px;
      color: var(--el-text-color-regular);
      word-break: break-word;
    }
  }

  // 产品详情 section 样式
  .product-detail-section {
    padding: 16px;
    background: var(--el-bg-color);
    border-radius: 4px;
    border: 1px solid var(--el-border-color-lighter);
  }

  .product-detail-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .el-icon {
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }

  // 发布平台选择对话框样式
  .platform-select-container {
    padding: 8px 0;
  }

  .publish-selected-summary {
    min-height: 22px;
    line-height: 22px;
  }

  .platform-checkbox-group {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
  }

  .platform-checkbox-item {
    margin: 0;
    height: auto;

    :deep(.el-checkbox__input) {
      display: none;
    }

    :deep(.el-checkbox__label) {
      padding: 0;
      width: 100%;
    }

    .platform-item-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px 20px;
      border: 2px solid var(--el-border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      background-color: var(--el-bg-color);
      min-width: 100px;
      gap: 8px;

      &:hover {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }

    &.is-checked {
      .platform-item-content {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
      }
    }

    .platform-icon-wrap {
      position: relative;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      margin-bottom: 6px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .platform-logo {
      position: relative;
      z-index: 1;
      width: 28px;
      height: 28px;
      object-fit: contain;
    }

    .platform-icon-fallback {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      z-index: 0;
    }

    .platform-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }

  // 发布任务列表样式
  .publish-tasks-container {
    min-height: 500px;
  }

  .publish-tasks-grid {
    min-height: 500px;

    :deep(.vxe-table) {
      .vxe-table--header {
        background-color: var(--el-bg-color-page);
      }

      .vxe-table--body {
        .vxe-body--row {
          &:hover {
            background-color: var(--el-fill-color-light);
          }
        }
      }
    }
  }
}

// 社交媒体发布 UI 优化样式
.platform-selector-visual {
  .platform-check-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 12px;
  }

  .platform-card-checkbox {
    margin: 0;
    height: auto;
    width: 100%;

    :deep(.el-checkbox__input) {
      display: none;
    }

    :deep(.el-checkbox__label) {
      padding: 0;
      width: 100%;
    }

    .platform-card-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px 8px;
      background: var(--el-bg-color);
      border: 2px solid var(--el-border-color-lighter);
      border-radius: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      cursor: pointer;
      overflow: hidden;

      &:hover {
        border-color: var(--platform-color);
        background: var(--el-color-primary-light-9);
        transform: translateY(-2px);
      }

      .platform-card-logo {
        width: 32px;
        height: 32px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: center;

        .logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .logo-fallback {
          width: 100%;
          height: 100%;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
        }
      }

      .platform-card-label {
        font-size: 13px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        width: 100%;
        text-align: center;
      }

      .platform-card-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        overflow: hidden;
      }

      .platform-card-sub {
        color: var(--el-text-color-secondary);
        opacity: 0.8;
      }

      .platform-card-indicator {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--el-border-color-lighter);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        transition: all 0.2s;
      }
    }

    &.is-checked {
      .platform-card-inner {
        border-color: var(--platform-color);
        background: var(--el-color-primary-light-9);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

        .platform-card-indicator {
          background: var(--platform-color);
        }
      }
    }
  }
}

.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
  align-items: start;

  .platform-form-compact {
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s;

    :deep(.el-card__header) {
      padding: 12px 16px;
      background-color: var(--el-fill-color-light);
    }

    .platform-mini-icon {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.select-item-compact {
  border: 2px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s;

  &.selected {
    border-color: var(--el-color-primary);
    transform: scale(0.95);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
  }

  &:hover:not(.selected) {
    border-color: var(--el-border-color-darker);
  }

  .check-icon {
    font-weight: bold;
  }
}

.publish-result-dark-bg {
  background: #1a1a1a;
  border-radius: 8px;
  min-height: 200px;
}

.publish-result-card {
  flex: 1 1 200px;
}

.publish-result-dark-item {
  color: #fff;
  background: rgba(45, 45, 45, 0.8);
}

// 视频生成高级对话框样式
.video-gen-compact-dialog {
  :deep(.el-dialog__header) {
    padding: 0;
    margin-right: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  }

  :deep(.el-dialog__body) {
    padding: 0;
    background: var(--el-bg-color);
  }

  .video-gen-dialog-header {
    display: flex;
    align-items: center;
    padding: 16px 24px;
    gap: 16px;

    .header-icon {
      font-size: 28px;
      color: var(--el-color-primary);
      background: var(--el-fill-color-light);
      padding: 8px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .header-text {
      .title {
        display: block;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .subtitle {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .video-gen-main-content {
    padding: 20px;
    height: 600px;

    .video-gen-tabs {
      height: 100%;

      :deep(.el-tabs__content) {
        height: calc(100% - 40px);
        overflow: hidden;
      }

      .tab-label {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .tab-content-scroll {
        height: 100%;
        overflow-y: auto;
        padding: 10px 4px;
      }
    }
  }

  .form-section {
    margin-bottom: 24px;

    .section-header {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 12px;
      padding-left: 8px;
      border-left: 4px solid var(--el-color-primary);
    }
  }

  .image-grid-selector {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;

    .image-item-card {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &.is-selected {
        border-color: var(--el-color-primary);

        .selection-overlay {
          opacity: 1;
        }
      }

      .thumb {
        width: 100%;
        height: 100%;
      }

      .selection-overlay {
        position: absolute;
        inset: 0;
        background: rgba(var(--el-color-primary-rgb), 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;

        .el-icon {
          color: #fff;
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }
      }

      .image-index {
        position: absolute;
        bottom: 4px;
        right: 4px;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        backdrop-filter: blur(4px);
      }
    }
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    background: var(--el-fill-color-light);
    padding: 16px;
    border-radius: 12px;
    margin-top: 16px;

    .grid-item {
      .label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-bottom: 6px;
      }

      .unit {
        font-size: 12px;
        margin-left: 6px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .param-preview-panel {
    height: 100%;
    background: var(--el-bg-color);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

    .panel-header {
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--el-fill-color-light);
      border-bottom: 1px solid var(--el-border-color-lighter);
      color: var(--el-text-color-primary);
      font-size: 13px;
    }

    .json-content {
      flex: 1;
      overflow: auto;
      padding: 16px;

      pre {
        margin: 0;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 12px;
        line-height: 1.6;
        color: var(--el-text-color-primary);

        code {
          white-space: pre-wrap;
          word-break: break-all;
        }
      }
    }

    .panel-footer {
      padding: 12px 20px;
      background: var(--el-fill-color-light);
      border-top: 1px solid var(--el-border-color-lighter);
      display: flex;
      gap: 16px;

      .info-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: #888;

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4caf50;

          &.blue {
            background: #2196f3;
          }
        }
      }
    }
  }

  .video-gen-footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);

    .submit-btn {
      padding: 0 24px;
      height: 40px;
      font-weight: 600;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);

      .el-icon {
        margin-right: 8px;
        font-size: 18px;
      }
    }
  }
}
</style>
