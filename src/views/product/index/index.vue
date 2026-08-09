<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="product-page" :sidebar-width="folderTreeCollapsed ? '28px' : '280px'">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat product-page__filter">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="按ID搜索">
                  <el-input
                    v-model="queryParams.id"
                    size="small"
                    clearable
                    placeholder="输入ID"
                    @keyup.enter="handleSearch"
                    @clear="handleSearch"
                  />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="按产品代码">
                  <el-input
                    v-model="queryParams.code"
                    size="small"
                    clearable
                    placeholder="输入产品代码"
                    @keyup.enter="handleSearch"
                    @clear="handleSearch"
                  />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="按SKU">
                  <el-input
                    v-model="queryParams.sku"
                    size="small"
                    clearable
                    placeholder="输入SKU"
                    @keyup.enter="handleSearch"
                    @clear="handleSearch"
                  />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="搜索">
                  <el-input
                    v-model="queryParams.searchText"
                    size="small"
                    clearable
                    placeholder="请输入搜索内容"
                    @keyup.enter="handleSearch"
                    @clear="handleSearch"
                  />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="12" :lg="5">
                <el-form-item label="时间范围">
                  <DateRangePicker
                    @change="
                      (val) => {
                        queryParams.startTime = val.start;
                        queryParams.endTime = val.end;
                        handleSearch();
                      }
                    "
                  />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="3">
                <el-form-item label="随机顺序">
                  <div class="product-page__switch">
                    <el-switch v-model="queryParams.random" size="small" @change="handleSearch" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="3">
                <el-form-item label="显示关联">
                  <div class="product-page__switch">
                    <el-switch
                      v-model="showRelations"
                      size="small"
                      @change="handleShowRelationsChange"
                    />
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="商品分类">
                  <el-select
                    v-model="queryParams.categoryId"
                    size="small"
                    clearable
                    filterable
                    placeholder="全部分类"
                    @change="handleSearch"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="cat in categoryList"
                      :key="cat.id"
                      :label="cat.name"
                      :value="cat.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="商品类型">
                  <el-input
                    v-model="queryParams.type"
                    size="small"
                    clearable
                    placeholder="输入商品类型"
                    @keyup.enter="handleSearch"
                    @clear="handleSearch"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="品牌">
                  <el-input
                    v-model="queryParams.brand"
                    size="small"
                    clearable
                    placeholder="输入品牌"
                    @keyup.enter="handleSearch"
                    @clear="handleSearch"
                  />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="商品状态">
                  <el-select
                    v-model="queryParams.status"
                    size="small"
                    clearable
                    placeholder="全部状态"
                    @change="handleSearch"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in productStatusOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="库存状态">
                  <el-select
                    v-model="queryParams.inventoryStatus"
                    size="small"
                    clearable
                    placeholder="全部库存"
                    @change="handleSearch"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in inventoryStatusOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="发布状态">
                  <el-select
                    v-model="queryParams.isPublish"
                    size="small"
                    clearable
                    placeholder="全部"
                    @change="handleSearch"
                    style="width: 100%"
                  >
                    <el-option label="已发布" :value="true" />
                    <el-option label="未发布" :value="false" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="价格区间">
                  <div class="flex gap-1 items-center">
                    <el-input-number
                      v-model="queryParams.priceMin"
                      size="small"
                      :min="0"
                      :precision="2"
                      controls-position="right"
                      placeholder="最低"
                      style="width: 100px"
                    />
                    <span class="text-gray-400">-</span>
                    <el-input-number
                      v-model="queryParams.priceMax"
                      size="small"
                      :min="0"
                      :precision="2"
                      controls-position="right"
                      placeholder="最高"
                      style="width: 100px"
                    />
                  </div>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="3">
                <el-form-item label="精选商品">
                  <div class="product-page__switch">
                    <el-switch
                      v-model="queryParams.isFeatured"
                      size="small"
                      @change="handleSearch"
                    />
                  </div>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="3">
                <el-form-item label="新品">
                  <div class="product-page__switch">
                    <el-switch v-model="queryParams.isNew" size="small" @change="handleSearch" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="3">
                <el-form-item label="热销">
                  <div class="product-page__switch">
                    <el-switch v-model="queryParams.isHot" size="small" @change="handleSearch" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="3">
                <el-form-item label="促销">
                  <div class="product-page__switch">
                    <el-switch v-model="queryParams.isOnSale" size="small" @change="handleSearch" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="排序">
                  <el-select
                    v-model="queryParams.sortBy"
                    size="small"
                    clearable
                    placeholder="默认排序"
                    @change="handleSearch"
                    style="width: 100%"
                  >
                    <el-option label="创建时间" value="createTime" />
                    <el-option label="更新时间" value="updateTime" />
                    <el-option label="售价" value="salePrice" />
                    <el-option label="销量" value="salesCount" />
                    <el-option label="浏览量" value="viewCount" />
                    <el-option label="评分" value="rating" />
                    <el-option label="自定义排序" value="sort" />
                    <el-option label="名称" value="name" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions product-page__actions">
              <el-button
                size="small"
                type="primary"
                @click="handleSearch"
                :icon="Search"
                :loading="loading"
                >搜索</el-button
              >
              <el-button
                size="small"
                type="primary"
                :disabled="single"
                @click="handleAdd"
                :icon="Plus"
                >新增</el-button
              >
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                :disabled="loading"
                @click="handleDelete(null)"
                >批量删除</el-button
              >
              <el-button
                size="small"
                type="success"
                :disabled="!selectedRows.length"
                @click="batchPublish"
                :icon="Check"
                >批量标记发布</el-button
              >
              <el-button
                size="small"
                type="warning"
                :disabled="!selectedRows.length"
                @click="batchUnpublish"
                :icon="Refresh"
                >批量下架</el-button
              >
            </div>
          </el-form>
        </div>
      </template>

      <template #sidebar>
        <div
          class="list-page-panel list-page-panel--flat list-page-sidebar product-page__sidebar folder-sidebar-shell"
        >
          <div class="list-page-sidebar__body product-page__sidebar-body folder-sidebar-body">
            <div
              v-show="!folderTreeCollapsed"
              class="product-page__sidebar-tree folder-sidebar-tree"
            >
              <FolderTree
                v-model="queryParams.folderId"
                folder-category="product"
                width="100%"
                :show-border="false"
                class="h-full"
                :drag-state="dragState"
                @change="handleFolderChange"
                @folder-drag-over="handleFolderDragOver"
                @folder-drag-leave="handleFolderDragLeave"
                @folder-drop="handleFolderDrop"
              />
            </div>
          </div>
          <button
            type="button"
            class="product-page__sidebar-toggle folder-sidebar-toggle"
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
          class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat product-page__table-wrap"
        >
          <div class="list-page-table-panel__body product-page__table-body">
            <div class="common-table">
              <vxe-grid
                class="product-dnd-grid dnd-text-selectable"
                v-bind="gridOptions"
                :data="dataSource"
                :loading="loading"
                @checkbox-change="checkboxChange"
                @checkbox-all="checkboxAllChange"
              >
                <template #dragHandleSlot>
                  <TableRowDragHandle />
                </template>

                <template #operationDefaultSlot="{ row }">
                  <el-dropdown
                    class="operation-dropdown"
                    placement="bottom-end"
                    @command="(command) => handleOperationCommand(String(command), row)"
                  >
                    <el-button type="primary" link size="small" class="operation-trigger-button"
                      >操作</el-button
                    >
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
                        <el-dropdown-item
                          v-if="userStore.user?.isAdmin"
                          command="delete"
                          class="operation-menu-item--danger"
                        >
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
                        <el-dropdown-item
                          v-if="getProductSourcePsdSetId(row)"
                          command="copy-images-from-psdset"
                        >
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
                    <el-tooltip
                      effect="dark"
                      content="搜索关键词 不会显示在商品信息中，只会在搜索时供搜索引擎使用"
                      placement="top"
                    >
                      <el-icon class="text-gray-400 cursor-help">
                        <QuestionFilled />
                      </el-icon>
                    </el-tooltip>
                  </div>
                </template>

                <template #urlDefaultSlot="{ row }">
                  <div class="table-preview-stack">
                    <el-carousel
                      v-if="row.images && row.images.length > 0"
                      :interval="3000"
                      height="100px"
                      indicator-position="none"
                      :arrow="row.images.length > 1 ? 'always' : 'never'"
                      class="custom-carousel table-preview-carousel"
                    >
                      <el-carousel-item v-for="(url, index) in row.images" :key="index">
                        <el-image
                          :src="url"
                          :preview-src-list="row.images"
                          :initial-index="index"
                          :preview-teleported="true"
                          :hide-on-click-modal="false"
                          :preview-class="'custom-image-preview'"
                          class="w-full h-full object-contain rounded cursor-pointer"
                          fit="contain"
                        />
                        <div class="table-preview-badge">
                          {{ (index as any) + 1 }}/{{ row.images.length }}
                        </div>
                      </el-carousel-item>
                    </el-carousel>
                    <span v-else class="table-preview-placeholder">暂无图片</span>

                    <el-tooltip
                      v-if="row.images && row.images.length > 0"
                      content="批量下载该商品的所有图片"
                      placement="top"
                    >
                      <el-button
                        type="primary"
                        link
                        size="small"
                        class="table-preview-action"
                        @click.stop="handleDownloadRowImages(row)"
                      >
                        全部下载
                      </el-button>
                    </el-tooltip>
                  </div>
                </template>

                <template #videoDefaultSlot="{ row }">
                  <div class="table-preview-stack">
                    <el-carousel
                      v-if="row.videos && row.videos.length > 0"
                      :interval="3000"
                      height="100px"
                      indicator-position="none"
                      :arrow="row.videos.length > 1 ? 'always' : 'never'"
                      class="custom-carousel table-preview-carousel"
                    >
                      <el-carousel-item v-for="(url, index) in row.videos" :key="index">
                        <div
                          class="relative cursor-pointer w-full h-full flex items-center justify-center bg-black rounded"
                          @click="handleVideoPreview(row.videos, index as any, row)"
                        >
                          <video
                            :src="url"
                            class="max-h-[100px] w-auto h-auto object-contain rounded"
                            muted
                            preload="metadata"
                          />
                          <div class="table-preview-badge">
                            {{ (index as any) + 1 }}/{{ row.videos.length }}
                          </div>
                        </div>
                      </el-carousel-item>
                    </el-carousel>
                    <span v-else class="table-preview-placeholder">暂无视频</span>
                  </div>
                </template>

                <template #idSlot="{ row }">
                  <div class="table-cell-copyable" @click="copyId(row.id)">
                    <span class="table-cell-id">{{ row.id }}</span>
                    <el-icon>
                      <DocumentCopy />
                    </el-icon>
                  </div>
                </template>

                <template #codeSlot="{ row }">
                  <el-tag v-if="row.code" type="info" size="small">
                    {{ row.code }}
                  </el-tag>
                  <span v-else class="table-cell-empty">未生成</span>
                </template>

                <template #nameSlot="{ row }">
                  <div class="table-copy-stack">
                    <div
                      class="table-copy-row"
                      :class="{ 'table-copy-row--empty': !row.name }"
                      @click.stop="row.name && copyText(row.name, '商品名称')"
                    >
                      <span class="table-copy-label">中：</span>
                      <span class="table-copy-text">{{ row.name || "未设置" }}</span>
                      <el-icon v-if="row.name" class="table-copy-icon">
                        <DocumentCopy />
                      </el-icon>
                    </div>
                    <div
                      class="table-copy-row"
                      :class="{ 'table-copy-row--empty': !row.enName }"
                      @click.stop="row.enName && copyText(row.enName, '英文名称')"
                    >
                      <span class="table-copy-label">En:</span>
                      <span class="table-copy-text">{{ row.enName || "未设置" }}</span>
                      <el-icon v-if="row.enName" class="table-copy-icon">
                        <DocumentCopy />
                      </el-icon>
                    </div>
                  </div>
                </template>

                <template #descriptionSlot="{ row }">
                  <div class="table-copy-stack">
                    <div
                      class="table-copy-row table-copy-row--multiline"
                      :class="{ 'table-copy-row--empty': !row.description }"
                      @click.stop="row.description && copyText(row.description, '商品描述')"
                    >
                      <span class="table-copy-label">中：</span>
                      <span class="table-copy-text">{{ row.description || "未设置" }}</span>
                      <el-icon v-if="row.description" class="table-copy-icon">
                        <DocumentCopy />
                      </el-icon>
                    </div>
                    <div
                      class="table-copy-row table-copy-row--multiline"
                      :class="{ 'table-copy-row--empty': !row.enDescription }"
                      @click.stop="row.enDescription && copyText(row.enDescription, '英文描述')"
                    >
                      <span class="table-copy-label">En:</span>
                      <span class="table-copy-text">{{ row.enDescription || "未设置" }}</span>
                      <el-icon v-if="row.enDescription" class="table-copy-icon">
                        <DocumentCopy />
                      </el-icon>
                    </div>
                  </div>
                </template>

                <template #keywordsSlot="{ row }">
                  <div class="table-copy-stack">
                    <div
                      class="table-copy-row table-copy-row--multiline"
                      :class="{ 'table-copy-row--empty': !row.keywords }"
                      @click.stop="row.keywords && copyText(row.keywords, '关键词')"
                    >
                      <span class="table-copy-label">中：</span>
                      <span class="table-copy-text">{{ row.keywords || "未设置" }}</span>
                      <el-icon v-if="row.keywords" class="table-copy-icon">
                        <DocumentCopy />
                      </el-icon>
                    </div>
                    <div
                      class="table-copy-row table-copy-row--multiline"
                      :class="{ 'table-copy-row--empty': !row.enKeywords }"
                      @click.stop="row.enKeywords && copyText(row.enKeywords, '英文关键词')"
                    >
                      <span class="table-copy-label">En:</span>
                      <span class="table-copy-text">{{ row.enKeywords || "未设置" }}</span>
                      <el-icon v-if="row.enKeywords" class="table-copy-icon">
                        <DocumentCopy />
                      </el-icon>
                    </div>
                  </div>
                </template>

                <template #searchKeywordsSlot="{ row }">
                  <div class="table-copy-stack">
                    <div
                      class="table-copy-row table-copy-row--multiline"
                      :class="{ 'table-copy-row--empty': !row.searchKeywords }"
                      @click.stop="row.searchKeywords && copyText(row.searchKeywords, '搜索关键字')"
                    >
                      <span class="table-copy-label">中：</span>
                      <span class="table-copy-text">{{ row.searchKeywords || "未设置" }}</span>
                      <el-icon v-if="row.searchKeywords" class="table-copy-icon">
                        <DocumentCopy />
                      </el-icon>
                    </div>
                    <div
                      class="table-copy-row table-copy-row--multiline"
                      :class="{ 'table-copy-row--empty': !row.enSearchKeywords }"
                      @click.stop="
                        row.enSearchKeywords && copyText(row.enSearchKeywords, '英文搜索关键字')
                      "
                    >
                      <span class="table-copy-label">En:</span>
                      <span class="table-copy-text">{{ row.enSearchKeywords || "未设置" }}</span>
                      <el-icon v-if="row.enSearchKeywords" class="table-copy-icon">
                        <DocumentCopy />
                      </el-icon>
                    </div>
                  </div>
                </template>

                <template #typeSlot="{ row }">
                  <span class="table-cell-text">
                    {{ normalizeProductType(row.type) }}
                  </span>
                </template>

                <template #publishStatusSlot="{ row }">
                  <el-tag :type="row.isPublish ? 'success' : 'warning'" size="small" effect="plain">
                    {{ row.isPublish ? "已发布" : "未发布" }}
                  </el-tag>
                </template>

                <template #sourceMaterialCodesSlot="{ row }">
                  <div
                    class="table-copy-row"
                    :class="{ 'table-copy-row--empty': !getProductSourceMaterialCodesText(row) }"
                    @click.stop="
                      getProductSourceMaterialCodesText(row) &&
                      copyText(getProductSourceMaterialCodesText(row), '素材图编码')
                    "
                  >
                    <span class="table-copy-text">{{
                      getProductSourceMaterialCodesText(row) || "未关联"
                    }}</span>
                    <el-icon v-if="getProductSourceMaterialCodesText(row)" class="table-copy-icon">
                      <DocumentCopy />
                    </el-icon>
                  </div>
                </template>

                <template #isFeaturedSlot="{ row }">
                  <el-tag v-if="row.isFeatured" type="warning" size="small" effect="plain"
                    >精选</el-tag
                  >
                  <span v-else class="table-cell-empty">-</span>
                </template>

                <!-- 关联信息列：显示关联了哪个内容 -->
                <template #relationsSlot="{ row }">
                  <div class="relations-summary">
                    <div v-if="hasProductRelationInfo(row)" class="relations-info">
                      <div class="relation-source-card">
                        <div class="relation-source-row">
                          <span class="relation-source-label">来源</span>
                          <span class="relation-source-value">{{
                            formatSourceType(row.sourceType)
                          }}</span>
                        </div>
                        <div class="relation-source-row">
                          <span class="relation-source-label">套图</span>
                          <span class="relation-source-value">{{
                            getProductSourcePsdSetText(row)
                          }}</span>
                        </div>
                        <div class="relation-source-row">
                          <span class="relation-source-label">素材编码</span>
                          <span class="relation-source-value">{{
                            getProductSourceMaterialCodesText(row) || "未关联"
                          }}</span>
                        </div>
                        <div class="relation-source-row">
                          <span class="relation-source-label">商品模板</span>
                          <span class="relation-source-value">{{
                            getProductSourceTemplateText(row)
                          }}</span>
                        </div>
                        <div class="relation-source-row">
                          <span class="relation-source-label">发布配置</span>
                          <span class="relation-source-value">{{
                            getProductSourcePublishConfigText(row)
                          }}</span>
                        </div>
                      </div>
                      <!-- PSD 套图 -->
                      <div v-if="row.psdSet" class="relation-section-item">
                        <div class="relation-header">
                          <span class="relation-label">PSD套图：</span>
                        </div>
                        <vxe-grid
                          :data="[row.psdSet]"
                          :show-header="true"
                          border
                          size="mini"
                          class="relation-sub-grid"
                          :columns="psdSetColumns"
                        >
                          <template #psdSetImagesSlot="{ row: psdRow }">
                            <div class="flex gap-1 flex-wrap">
                              <div
                                v-for="(img, idx) in getPsdSetImages(psdRow).slice(0, 3)"
                                :key="idx"
                                class="relation-thumb-wrapper"
                              >
                                <el-image
                                  v-if="img"
                                  :src="img"
                                  :preview-src-list="getPsdSetImages(psdRow)"
                                  :initial-index="idx"
                                  :preview-teleported="true"
                                  :hide-on-click-modal="false"
                                  class="relation-thumb-image"
                                  fit="contain"
                                />
                                <span v-else class="text-gray-400 text-xs">无</span>
                              </div>
                              <span
                                v-if="getPsdSetImages(psdRow).length > 3"
                                class="text-xs text-gray-500"
                                >+{{ getPsdSetImages(psdRow).length - 3 }}</span
                              >
                              <span
                                v-if="!getPsdSetImages(psdRow).length"
                                class="text-gray-400 text-xs"
                                >无</span
                              >
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
          </div>
        </div>
      </template>

      <template #pagination>
        <div
          class="list-page-panel list-page-panel--flat list-page-table-panel__pagination list-page-table-panel__pagination--flat product-page__pagination"
        >
          <pagination
            :total="total"
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </template>
    </ListPageLayout>

    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="100%"
      :fullscreen="true"
      :close-on-click-modal="false"
      class="product-editor-dialog"
      @close="dialogClose"
      align-center
    >
      <div class="product-editor-shell">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="right"
          label-width="96px"
          class="product-editor-form"
        >
          <section class="product-editor-section product-editor-section--primary">
            <div class="product-editor-section__header">
              <div>
                <div class="product-editor-section__title">核心信息</div>
                <div class="product-editor-section__meta">独立站展示与发布所需的主要内容</div>
              </div>
              <el-tag type="danger" effect="plain" size="small">优先填写</el-tag>
            </div>

            <el-row :gutter="20">
              <el-col :xs="24" :md="12" :lg="10">
                <el-form-item label="商品名称" prop="name">
                  <el-input
                    v-model="form.name"
                    placeholder="请输入商品名称"
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12" :lg="7">
                <el-form-item label="商品类型" prop="type">
                  <el-input v-model="form.type" placeholder="如：T恤、地毯、鼠标垫" clearable />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12" :lg="7">
                <el-form-item label="商品分类" prop="categoryId">
                  <el-select
                    v-model="form.categoryId"
                    placeholder="请选择商品分类"
                    clearable
                    filterable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="cat in categoryList"
                      :key="cat.id"
                      :label="cat.name"
                      :value="cat.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="24">
                <el-form-item label="商品图片" prop="images">
                  <ProductImageUpload
                    ref="productImageUploadRef"
                    v-model="form.images"
                    :max-count="10"
                    @files-change="handleFilesChange"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="24">
                <el-form-item label="商品描述" prop="description">
                  <el-input
                    v-model="form.description"
                    type="textarea"
                    :rows="4"
                    maxlength="2000"
                    show-word-limit
                    placeholder="描述商品外观、图案、用途和适用场景"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="24">
                <el-form-item label="关键词" prop="keywords">
                  <el-input
                    v-model="form.keywords"
                    placeholder="多个关键词用逗号分隔，如：极简,猫咪,T恤,礼物"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <section class="product-editor-section">
            <div class="product-editor-section__header">
              <div>
                <div class="product-editor-section__title">定价与库存</div>
                <div class="product-editor-section__meta">用于独立站价格展示和库存筛选</div>
              </div>
            </div>

            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :lg="4">
                <el-form-item label="售价" prop="salePrice">
                  <el-input-number v-model="form.salePrice" :min="0" :precision="2" :step="1" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="4">
                <el-form-item label="原价" prop="price">
                  <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="4">
                <el-form-item label="划线价" prop="compareAtPrice">
                  <el-input-number
                    v-model="form.compareAtPrice"
                    :min="0"
                    :precision="2"
                    :step="1"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="4">
                <el-form-item label="币种" prop="currency">
                  <el-select v-model="form.currency" filterable allow-create style="width: 100%">
                    <el-option label="人民币 CNY" value="CNY" />
                    <el-option label="美元 USD" value="USD" />
                    <el-option label="欧元 EUR" value="EUR" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="4">
                <el-form-item label="库存" prop="stock">
                  <el-input-number v-model="form.stock" :min="0" :step="1" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="4">
                <el-form-item label="库存状态" prop="inventoryStatus">
                  <el-select v-model="form.inventoryStatus" style="width: 100%">
                    <el-option
                      v-for="item in inventoryStatusOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <section class="product-editor-section">
            <div class="product-editor-section__header">
              <div>
                <div class="product-editor-section__title">商品资料</div>
                <div class="product-editor-section__meta">
                  有明确资料时填写，内容会展示在商品详情中
                </div>
              </div>
            </div>

            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :lg="4">
                <el-form-item label="品牌" prop="brand">
                  <el-input v-model="form.brand" placeholder="品牌名称" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="4">
                <el-form-item label="材质" prop="material">
                  <el-input v-model="form.material" placeholder="如：纯棉、陶瓷" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="4">
                <el-form-item label="尺寸规格" prop="dimensions">
                  <el-input v-model="form.dimensions" placeholder="如：120x60cm" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="4">
                <el-form-item label="计量单位" prop="unit">
                  <el-select v-model="form.unit" style="width: 100%">
                    <el-option label="件" value="件" />
                    <el-option label="个" value="个" />
                    <el-option label="套" value="套" />
                    <el-option label="对" value="对" />
                    <el-option label="条" value="条" />
                    <el-option label="箱" value="箱" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="4">
                <el-form-item label="重量（克）" prop="weight">
                  <el-input-number v-model="form.weight" :min="0" :precision="2" :step="10" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="4">
                <el-form-item label="产地" prop="origin">
                  <el-input v-model="form.origin" placeholder="如：中国" />
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <section class="product-editor-section product-editor-section--advanced">
            <div class="product-editor-section__header">
              <div>
                <div class="product-editor-section__title">更多设置</div>
                <div class="product-editor-section__meta">低频字段按需展开</div>
              </div>
            </div>

            <el-collapse v-model="productEditorAdvancedSections" class="product-editor-advanced">
              <el-collapse-item name="operation">
                <template #title>
                  <div class="product-editor-collapse-title">
                    <span>运营与搜索</span>
                    <small>状态、推荐标记、搜索词和 SEO</small>
                  </div>
                </template>

                <el-row :gutter="20">
                  <el-col :xs="24" :sm="12" :lg="6">
                    <el-form-item label="商品状态" prop="status">
                      <el-select
                        v-model="form.status"
                        placeholder="请选择商品状态"
                        style="width: 100%"
                      >
                        <el-option
                          v-for="item in productStatusOptions"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12" :lg="6">
                    <el-form-item label="排序值" prop="sort">
                      <el-input-number v-model="form.sort" :min="0" :step="1" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :lg="12">
                    <el-form-item label="推荐标记">
                      <div class="product-editor-switches">
                        <el-checkbox v-model="form.isFeatured" label="精选推荐" />
                        <el-checkbox v-model="form.isNew" label="新品" />
                        <el-checkbox v-model="form.isHot" label="热销" />
                        <el-checkbox v-model="form.isOnSale" label="促销" />
                      </div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="24">
                    <el-form-item label="商品标签" prop="tags">
                      <el-input v-model="form.tags" placeholder="多个标签用逗号分隔" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="搜索关键字" prop="searchKeywords">
                      <el-input
                        v-model="form.searchKeywords"
                        type="textarea"
                        :rows="3"
                        placeholder="颜色、材质、风格、适用人群、使用场景等，多个词用逗号分隔"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :lg="12">
                    <el-form-item label="URL 别名" prop="slug">
                      <el-input v-model="form.slug" placeholder="如：minimal-cat-tshirt" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :lg="12">
                    <el-form-item label="SEO 标题" prop="seoTitle">
                      <el-input
                        v-model="form.seoTitle"
                        placeholder="留空时独立站会根据商品信息生成"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="SEO 描述" prop="seoDescription">
                      <el-input
                        v-model="form.seoDescription"
                        type="textarea"
                        :rows="3"
                        placeholder="留空时独立站会使用商品描述"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-collapse-item>

              <el-collapse-item name="specifications">
                <template #title>
                  <div class="product-editor-collapse-title">
                    <span>规格与属性</span>
                    <small>结构化规格和扩展属性</small>
                  </div>
                </template>

                <el-row :gutter="20">
                  <el-col :xs="24" :lg="12">
                    <el-form-item label="规格配置" prop="specifications">
                      <el-input
                        v-model="form.specificationsText"
                        type="textarea"
                        :rows="6"
                        placeholder='JSON，例如 {"options":[{"name":"Size","values":["S","M"]}]}'
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :lg="12">
                    <el-form-item label="商品属性" prop="attributes">
                      <el-input
                        v-model="form.attributesText"
                        type="textarea"
                        :rows="6"
                        placeholder='JSON，例如 {"color":"black","style":"minimal"}'
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-collapse-item>

              <el-collapse-item name="multilingual">
                <template #title>
                  <div class="product-editor-collapse-title">
                    <span>多语言与扩展媒体</span>
                    <small>英文内容、详情图片和商品视频</small>
                  </div>
                </template>

                <el-row :gutter="20">
                  <el-col :xs="24" :lg="12">
                    <el-form-item label="英文名称" prop="enName">
                      <el-input v-model="form.enName" placeholder="请输入英文名称" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :lg="12">
                    <el-form-item label="英文关键词" prop="enKeywords">
                      <el-input v-model="form.enKeywords" placeholder="多个关键词用逗号分隔" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="英文描述" prop="enDescription">
                      <el-input
                        v-model="form.enDescription"
                        type="textarea"
                        :rows="4"
                        placeholder="请输入英文描述"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="英文搜索关键字" prop="enSearchKeywords">
                      <el-input
                        v-model="form.enSearchKeywords"
                        type="textarea"
                        :rows="3"
                        placeholder="多个英文搜索词用逗号分隔"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="详情图片" prop="detailImages">
                      <ProductImageUpload
                        v-model="form.detailImages"
                        :max-count="30"
                        @files-change="handleDetailFilesChange"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="商品视频" prop="videos">
                      <ProductVideoUpload
                        ref="productVideoUploadRef"
                        v-model="form.videos"
                        :max-count="5"
                        @files-change="handleVideoFilesChange"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-collapse-item>

              <el-collapse-item name="system">
                <template #title>
                  <div class="product-editor-collapse-title">
                    <span>编码、成本与履约</span>
                    <small>系统字段和暂未用于独立站展示的资料</small>
                  </div>
                </template>

                <el-row :gutter="20">
                  <el-col :xs="24" :sm="12" :lg="6">
                    <el-form-item label="商品番号" prop="code">
                      <el-input
                        v-model="form.code"
                        disabled
                        :placeholder="isEdit ? '暂无编码' : '保存后自动生成'"
                      >
                        <template #prefix>
                          <el-icon><Lock /></el-icon>
                        </template>
                      </el-input>
                      <div class="product-editor-field-hint">系统自动生成，不支持手动修改</div>
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12" :lg="6">
                    <el-form-item label="SKU" prop="sku">
                      <el-input v-model="form.sku" placeholder="标准 SKU" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12" :lg="6">
                    <el-form-item label="SPU" prop="spu">
                      <el-input v-model="form.spu" placeholder="标准 SPU" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12" :lg="6">
                    <el-form-item label="条码" prop="barcode">
                      <el-input v-model="form.barcode" placeholder="商品条码" />
                    </el-form-item>
                  </el-col>

                  <el-col :xs="24" :sm="12" :lg="6">
                    <el-form-item label="成本价" prop="costPrice">
                      <el-input-number v-model="form.costPrice" :min="0" :precision="2" :step="1" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12" :lg="6">
                    <el-form-item label="低库存阈值" prop="lowStockThreshold">
                      <el-input-number v-model="form.lowStockThreshold" :min="0" :step="1" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12" :lg="6">
                    <el-form-item label="起订量" prop="minOrderQuantity">
                      <el-input-number v-model="form.minOrderQuantity" :min="1" :step="1" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12" :lg="6">
                    <el-form-item label="运费模板" prop="shippingTemplateId">
                      <el-input v-model="form.shippingTemplateId" placeholder="运费模板 ID" />
                    </el-form-item>
                  </el-col>

                  <el-col :xs="24" :sm="12" :lg="6">
                    <el-form-item label="包裹重量（克）" prop="packageWeight">
                      <el-input-number
                        v-model="form.packageWeight"
                        :min="0"
                        :precision="2"
                        :step="10"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12" :lg="6">
                    <el-form-item label="包裹长" prop="packageLength">
                      <el-input-number
                        v-model="form.packageLength"
                        :min="0"
                        :precision="2"
                        :step="1"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12" :lg="6">
                    <el-form-item label="包裹宽" prop="packageWidth">
                      <el-input-number
                        v-model="form.packageWidth"
                        :min="0"
                        :precision="2"
                        :step="1"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12" :lg="6">
                    <el-form-item label="包裹高" prop="packageHeight">
                      <el-input-number
                        v-model="form.packageHeight"
                        :min="0"
                        :precision="2"
                        :step="1"
                      />
                    </el-form-item>
                  </el-col>

                  <el-col :xs="24" :lg="12">
                    <el-form-item label="来源" prop="sourceType">
                      <el-select v-model="form.sourceType" disabled style="width: 100%">
                        <el-option label="手动创建" value="manual" />
                        <el-option label="PSD套图" value="psd_set" />
                        <el-option label="导入" value="import" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :lg="12">
                    <el-form-item label="素材图编码" prop="sourceMaterialCodes">
                      <el-input
                        v-model="form.sourceMaterialCodes"
                        disabled
                        placeholder="套图转商品后自动写入"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-collapse-item>
            </el-collapse>
          </section>
        </el-form>
      </div>

      <template #footer>
        <div class="product-editor-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :icon="Check" @click="submitForm" :loading="submitLoading">
            保存商品
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 发布弹窗 -->
    <el-dialog
      title="发布到多媒体平台"
      v-model="publishDialogVisible"
      width="100%"
      :fullscreen="true"
      @close="publishDialogClose"
      align-center
    >
      <div class="p-3">
        <el-alert
          title="多媒体说明"
          description="默认引用设计模型缩略图、相关截图和视频，可勾选选择图片和视频"
          type="info"
          :closable="false"
          show-icon
          class="mb-3"
        />

        <h3 class="text-base font-bold my-2 text-[var(--el-text-color-primary)]">选择发布平台</h3>

        <!-- 平台选择 (视觉优化版) -->
        <div class="platform-selector-visual mb-6">
          <el-checkbox-group v-model="selectedPlatforms">
            <div class="platform-check-grid">
              <el-checkbox
                v-for="item in publishPlatforms.filter((p) =>
                  [
                    'douyin',
                    'kuaishou',
                    'doudian',
                    'kuaishou_shop',
                    'xiaohongshu',
                    'weibo',
                    'bilibili',
                    'xianyu',
                    'tiktok',
                    'youtube',
                  ].includes(p.value),
                )"
                :key="item.value"
                :label="item.value"
                class="platform-card-checkbox"
              >
                <div class="platform-card-inner" :style="{ '--platform-color': item.color }">
                  <div class="platform-card-logo">
                    <img
                      v-if="item.logoUrl"
                      :src="item.logoUrl"
                      :alt="item.label"
                      class="logo-img"
                    />
                    <div v-else class="logo-fallback" :style="{ backgroundColor: item.color }">
                      {{ item.icon }}
                    </div>
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
                    <div
                      class="platform-mini-icon"
                      :style="{
                        backgroundColor:
                          publishPlatforms.find((p) => p.value === platform)?.color || '#999',
                      }"
                    >
                      <img
                        v-if="publishPlatforms.find((p) => p.value === platform)?.logoUrl"
                        :src="publishPlatforms.find((p) => p.value === platform)?.logoUrl"
                        class="w-4 h-4 object-contain invert"
                      />
                      <span v-else class="text-[10px] text-white font-bold">{{
                        publishPlatforms.find((p) => p.value === platform)?.icon
                      }}</span>
                    </div>
                    <span class="text-base font-semibold">{{ getPlatformName(platform) }}</span>
                  </div>
                  <el-tag size="small" effect="plain" round>{{
                    ["tiktok", "youtube"].includes(platform) ? "International" : "Domestic"
                  }}</el-tag>
                </div>
              </template>
              <!-- 只在表单已初始化时渲染 -->
              <el-form
                v-if="publishForm[platform]"
                :model="publishForm[platform]"
                label-width="60px"
                size="small"
                :data-platform="platform"
              >
                <el-form-item v-if="platform !== 'weibo'" label="标题" required>
                  <el-input
                    v-model="publishForm[platform].title"
                    :placeholder="`请输入${getPlatformName(platform)}标题`"
                  />
                </el-form-item>
                <el-form-item label="内容" required>
                  <el-input
                    v-model="publishForm[platform].content"
                    type="textarea"
                    :rows="2"
                    :autosize="{ minRows: 2, maxRows: 8 }"
                    :placeholder="`请输入${getPlatformName(platform)}内容`"
                    @input="handleContentInput(platform)"
                  />
                </el-form-item>

                <el-form-item label="商品图片">
                  <div class="flex flex-wrap gap-1">
                    <div
                      v-for="(url, index) in publishForm[platform].images"
                      :key="index"
                      class="relative cursor-pointer select-item-compact"
                      :class="{ selected: publishForm[platform].selectedImages.includes(url) }"
                      @click="toggleImageSelection(platform, url)"
                    >
                      <img
                        :src="url"
                        class="w-20 h-20 object-cover rounded transition-all duration-200"
                        @click.stop="preview(index, publishForm[platform].images)"
                      />
                      <div
                        class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl"
                      >
                        {{ index + 1 }}/{{ publishForm[platform].images.length }}
                      </div>
                      <div
                        class="absolute top-1 right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-md"
                      >
                        <el-icon
                          v-if="publishForm[platform].selectedImages.includes(url)"
                          class="text-[var(--el-color-primary)] text-xs check-icon"
                        >
                          <Check />
                        </el-icon>
                      </div>
                    </div>
                  </div>
                </el-form-item>

                <el-form-item
                  label="商品视频"
                  v-if="publishForm[platform].videos && publishForm[platform].videos.length > 0"
                >
                  <div class="flex flex-wrap gap-1">
                    <div
                      v-for="(url, index) in publishForm[platform].videos"
                      :key="index"
                      class="relative cursor-pointer select-item-compact"
                      :class="{ selected: publishForm[platform].selectedVideos.includes(url) }"
                      @click="toggleVideoSelection(platform, url)"
                    >
                      <div
                        class="w-20 h-20 bg-black rounded relative overflow-hidden transition-all duration-200"
                        @click.stop="handlePublishVideoPreview(publishForm[platform].videos, index)"
                      >
                        <video
                          :src="url"
                          class="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                        <div class="absolute inset-0 flex items-center justify-center">
                          <div
                            class="w-6 h-6 bg-black bg-opacity-60 rounded-full flex items-center justify-center"
                          >
                            <el-icon class="text-white text-xs">
                              <VideoPlay />
                            </el-icon>
                          </div>
                        </div>
                        <div
                          class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl"
                        >
                          {{ index + 1 }}/{{ publishForm[platform].videos.length }}
                        </div>
                      </div>
                      <div
                        class="absolute top-1 right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-md"
                      >
                        <el-icon
                          v-if="publishForm[platform].selectedVideos.includes(url)"
                          class="text-[var(--el-color-primary)] text-xs check-icon"
                        >
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
        <el-button type="primary" @click="handlePublishSubmit" :loading="publishLoading"
          >确定发布</el-button
        >
      </template>
    </el-dialog>

    <!-- 发布结果弹窗 -->
    <el-dialog v-model="publishResultVisible" title="发布结果" width="900px">
      <div class="p-4 publish-result-dark-bg">
        <div v-if="publishResults.length > 0">
          <div class="flex flex-wrap gap-4 mb-4">
            <div
              v-for="result in publishResults"
              :key="result.platform"
              class="publish-result-card"
            >
              <div
                class="flex items-center justify-between p-3 rounded-lg border publish-result-dark-item"
                :class="{
                  'border-green-400 bg-green-900 bg-opacity-80': result.success,
                  'border-red-400 bg-red-900 bg-opacity-80': !result.success,
                }"
              >
                <div class="flex items-center">
                  <div
                    class="w-3 h-3 rounded-full mr-2"
                    :class="{
                      'bg-green-400': result.success,
                      'bg-red-400': !result.success,
                    }"
                  ></div>
                  <span class="font-medium text-[var(--el-text-color-primary)]">{{
                    getPlatformName(result.platform)
                  }}</span>
                </div>
                <div class="text-right ml-2">
                  <div
                    class="font-medium"
                    :class="{
                      'text-green-400': result.success,
                      'text-red-400': !result.success,
                    }"
                  >
                    {{ result.success ? "发布成功" : "发布失败" }}
                  </div>
                  <div
                    class="text-xs mt-1 max-w-[180px] break-words"
                    :class="getPublishMessageClass(result)"
                  >
                    {{ result.message }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 总体结果 -->
          <div
            class="mt-4 p-3 rounded-lg border publish-result-dark-item"
            :class="{
              'border-green-400 bg-green-900 bg-opacity-80': publishSummary.success,
              'border-yellow-400 bg-yellow-900 bg-opacity-80': publishSummary.partial,
              'border-red-400 bg-red-900 bg-opacity-80': publishSummary.failed,
            }"
          >
            <div class="text-center">
              <div
                class="font-medium"
                :class="{
                  'text-green-400': publishSummary.success,
                  'text-yellow-400': publishSummary.partial,
                  'text-red-400': publishSummary.failed,
                }"
              >
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
        <el-image
          :src="previewList[previewIndex]"
          :preview-src-list="previewList"
          :initial-index="previewIndex"
          fit="contain"
          style="max-width: 100%; max-height: 70vh"
          :preview-teleported="true"
        />
        <div v-if="previewList.length > 1" class="mt-4 flex items-center gap-4">
          <el-button
            @click="previewIndex = Math.max(0, previewIndex - 1)"
            :disabled="previewIndex === 0"
            >上一张</el-button
          >
          <span>{{ previewIndex + 1 }} / {{ previewList.length }}</span>
          <el-button
            @click="previewIndex = Math.min(previewList.length - 1, previewIndex + 1)"
            :disabled="previewIndex === previewList.length - 1"
            >下一张</el-button
          >
        </div>
      </div>
      <div v-else-if="previewUrl" class="flex justify-center">
        <img :src="previewUrl" alt="Preview" style="max-width: 100%; max-height: 70vh" />
      </div>
    </el-dialog>

    <!-- 视频预览弹窗 -->
    <el-dialog
      v-model="videoPreviewVisible"
      title="视频预览"
      width="100%"
      :fullscreen="true"
      :close-on-click-modal="true"
    >
      <div v-if="videoPreviewList.length > 0" class="video-preview-container">
        <div class="video-preview-header">
          <div class="actions" v-if="videoPreviewAllowDelete && videoPreviewRowId">
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              :loading="
                deletingVideoKey === `${videoPreviewRowId}-${videoPreviewList[videoPreviewIndex]}`
              "
              @click="
                handleDeleteVideo(
                  { id: videoPreviewRowId, videos: videoPreviewList },
                  videoPreviewList[videoPreviewIndex],
                )
              "
            >
              删除
            </el-button>
          </div>
        </div>
        <div class="video-preview-content">
          <el-button
            v-if="videoPreviewList.length > 1"
            class="video-nav-btn video-nav-prev"
            :icon="ArrowLeft"
            circle
            @click="prevVideo"
            :disabled="videoPreviewIndex === 0"
          />
          <div class="video-wrapper">
            <transition name="fade" mode="out-in">
              <video
                :key="videoPreviewIndex"
                :src="videoPreviewList[videoPreviewIndex]"
                controls
                preload="auto"
                class="video-preview-player"
              />
            </transition>
          </div>
          <el-button
            v-if="videoPreviewList.length > 1"
            class="video-nav-btn video-nav-next"
            :icon="ArrowRight"
            circle
            @click="nextVideo"
            :disabled="videoPreviewIndex === videoPreviewList.length - 1"
          />
        </div>
        <div v-if="videoPreviewList.length > 1" class="video-pagination">
          <span class="video-page-info">
            {{ videoPreviewIndex + 1 }} / {{ videoPreviewList.length }}
          </span>
        </div>
      </div>
      <div v-else class="text-center text-gray-400 py-8">暂无视频</div>
    </el-dialog>

    <el-dialog
      v-model="customModelDetailVisible"
      title="关联设计模型详情"
      width="100%"
      :fullscreen="true"
      :close-on-click-modal="false"
    >
      <div v-if="customModelDetail" class="custom-model-detail-dialog p-8">
        <el-row :gutter="32">
          <!-- 左侧图片区 -->
          <el-col :span="8" class="flex flex-col items-center justify-center">
            <img
              v-if="customModelDetail.thumbnail"
              :src="
                getPreviewImageUrl(customModelDetail.thumbnail, {
                  width: 300,
                  quality: 80,
                  format: 'webp',
                })
              "
              style="
                max-width: 240px;
                max-height: 240px;
                border-radius: 12px;
                box-shadow: 0 2px 8px #0001;
                margin-bottom: 16px;
                cursor: pointer;
              "
              @click="preview(0, [customModelDetail.thumbnail])"
            />
            <div
              v-else
              class="w-[240px] h-[240px] flex items-center justify-center bg-gray-100 text-gray-400 rounded mb-4"
            >
              无缩略图
            </div>
            <!-- 预留更多图片展示（如有） -->
            <template v-if="customModelDetail.images && customModelDetail.images.length">
              <div class="flex flex-wrap gap-2 mt-2">
                <img
                  v-for="(img, idx) in customModelDetail.images"
                  :key="idx"
                  :src="img"
                  style="
                    width: 60px;
                    height: 60px;
                    border-radius: 6px;
                    object-fit: cover;
                    cursor: pointer;
                  "
                  @click="preview(idx as any, customModelDetail.images)"
                />
              </div>
            </template>
          </el-col>
          <!-- 右侧基础信息区 -->
          <el-col :span="16">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="ID">{{ customModelDetail.id }}</el-descriptions-item>
              <el-descriptions-item label="名称">{{ customModelDetail.name }}</el-descriptions-item>
              <el-descriptions-item label="描述" :span="2">{{
                customModelDetail.description || "无"
              }}</el-descriptions-item>
              <el-descriptions-item label="关键词">{{
                customModelDetail.keywords || "无"
              }}</el-descriptions-item>
              <el-descriptions-item label="标签">{{
                customModelDetail.tags || "无"
              }}</el-descriptions-item>
              <el-descriptions-item label="作者">
                <template
                  v-if="
                    customModelDetail.uploader &&
                    (customModelDetail.uploader.name || customModelDetail.uploader.account)
                  "
                >
                  {{ customModelDetail.uploader.name || customModelDetail.uploader.account }}
                </template>
                <template v-else>无</template>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{
                customModelDetail.createTime
                  ? (customModelDetail.createTime + "").replace("T", " ").slice(0, 19)
                  : "无"
              }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{
                customModelDetail.updateTime
                  ? (customModelDetail.updateTime + "").replace("T", " ").slice(0, 19)
                  : "无"
              }}</el-descriptions-item>
              <el-descriptions-item v-if="customModelDetail.url" label="模型文件">
                <el-link :href="customModelDetail.url" target="_blank" type="primary"
                  >下载/预览</el-link
                >
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
        <!-- 元数据结构化展示 -->
        <div v-if="customModelDetail.meta" class="mt-6">
          <h4 class="font-medium mb-2">元数据</h4>
          <el-scrollbar style="max-height: 200px">
            <pre style="background: none; padding: 0; margin: 0; font-size: 13px">{{
              JSON.stringify(customModelDetail.meta, null, 2)
            }}</pre>
          </el-scrollbar>
        </div>
      </div>
      <div v-else class="p-8 text-center text-gray-400">暂无详情</div>
      <template #footer>
        <el-button @click="customModelDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 关联信息详情弹窗 -->
    <el-dialog
      v-model="relationsDetailVisible"
      title="关联信息详情"
      width="90%"
      :close-on-click-modal="false"
      align-center
      :destroy-on-close="true"
    >
      <div v-if="currentRelationsRow" class="relations-detail-content">
        <!-- 关联设计模型 -->
        <div v-if="currentRelationsRow.customModel" class="relation-section">
          <h3 class="relation-section-title">关联设计模型</h3>
          <vxe-grid
            :data="[currentRelationsRow.customModel]"
            :show-header="true"
            border
            size="mini"
            style="margin: 0; padding: 0; background: none"
            :columns="[
              {
                field: 'thumbnail',
                title: '缩略图',
                width: '120',
                slots: { default: 'customModelThumbnailSlot' },
              },
              { field: 'name', title: '名称', minWidth: 80 },
              { field: 'description', title: '描述', minWidth: 120 },
              { field: 'keywords', title: '关键词', minWidth: 100 },
              {
                field: 'updateTime',
                title: '更新时间',
                minWidth: 120,
                slots: { default: 'customModelUpdateTimeSlot' },
              },
              buildOperationColumn('customModelOperationSlot'),
            ]"
          >
            <template #customModelThumbnailSlot="{ row }">
              <div class="flex items-center justify-center p-2">
                <el-image
                  v-if="row.thumbnail"
                  :src="
                    getPreviewImageUrl(row.thumbnail, { width: 200, quality: 80, format: 'webp' })
                  "
                  :preview-src-list="[row.thumbnail]"
                  :initial-index="0"
                  style="
                    width: 120px;
                    height: auto;
                    object-fit: contain;
                    background: #f5f5f5;
                    cursor: pointer;
                  "
                />
                <span v-else class="text-gray-400">无</span>
              </div>
            </template>
            <template #customModelUpdateTimeSlot="{ row }">
              <span>{{
                row.updateTime ? (row.updateTime + "").replace("T", " ").slice(0, 19) : "无"
              }}</span>
            </template>
            <template #customModelOperationSlot="{ row }">
              <div class="flex gap-2">
                <el-button type="primary" link size="small" @click="showCustomModelDrafts(row)"
                  >查看草稿截图</el-button
                >
                <el-button
                  v-if="row.thumbnail"
                  type="success"
                  link
                  size="small"
                  @click="downloadThumbnail(row.thumbnail, row.name || '缩略图')"
                >
                  下载缩略图
                </el-button>
              </div>
            </template>
          </vxe-grid>
        </div>

        <!-- 关联贴纸 -->
        <div v-if="currentRelationsRow.sticker" class="relation-section">
          <h3 class="relation-section-title">关联贴纸</h3>
          <vxe-grid
            :data="[currentRelationsRow.sticker]"
            :show-header="true"
            border
            size="mini"
            style="margin: 0; padding: 0; background: none"
            :columns="[
              { field: 'url', title: '图片', width: '120', slots: { default: 'stickerImageSlot' } },
              { field: 'name', title: '名称', minWidth: 80 },
              { field: 'description', title: '描述', minWidth: 120 },
              { field: 'keywords', title: '关键词', minWidth: 100 },
              { field: 'suffix', title: '后缀', width: 80 },
              {
                field: 'updateTime',
                title: '更新时间',
                minWidth: 120,
                slots: { default: 'stickerUpdateTimeSlot' },
              },
              buildOperationColumn('stickerOperationSlot'),
            ]"
          >
            <template #stickerImageSlot="{ row }">
              <div class="flex items-center justify-center p-2">
                <el-image
                  v-if="row.url"
                  :src="row.url"
                  :preview-src-list="[row.url]"
                  :initial-index="0"
                  style="
                    width: 120px;
                    height: auto;
                    object-fit: contain;
                    background: #f5f5f5;
                    cursor: pointer;
                  "
                />
                <span v-else class="text-gray-400">无</span>
              </div>
            </template>
            <template #stickerUpdateTimeSlot="{ row }">
              <span>{{
                row.updateTime ? (row.updateTime + "").replace("T", " ").slice(0, 19) : "无"
              }}</span>
            </template>
            <template #stickerOperationSlot="{ row }">
              <div class="flex gap-2">
                <el-button
                  v-if="row.url"
                  type="primary"
                  link
                  size="small"
                  @click="preview(0, [row.url])"
                >
                  预览
                </el-button>
              </div>
            </template>
          </vxe-grid>
        </div>

        <!-- 关联 PSD 套图 -->
        <div v-if="currentRelationsRow.psdSet" class="relation-section">
          <h3 class="relation-section-title">关联PSD套图</h3>
          <vxe-grid
            :data="[currentRelationsRow.psdSet]"
            :show-header="true"
            border
            size="mini"
            style="margin: 0; padding: 0; background: none"
            :columns="psdSetDetailColumns"
          >
            <template #psdSetImagesSlot="{ row }">
              <div class="flex gap-1 flex-wrap">
                <div
                  v-for="(img, idx) in getPsdSetImages(row).slice(0, 3)"
                  :key="idx"
                  class="relation-thumb-wrapper"
                >
                  <el-image
                    v-if="img"
                    :src="img"
                    :preview-src-list="getPsdSetImages(row)"
                    :initial-index="idx"
                    :preview-teleported="true"
                    :hide-on-click-modal="false"
                    class="relation-thumb-image"
                    fit="contain"
                  />
                  <span v-else class="text-gray-400 text-xs">无</span>
                </div>
                <span v-if="getPsdSetImages(row).length > 3" class="text-xs text-gray-500"
                  >+{{ getPsdSetImages(row).length - 3 }}</span
                >
                <span v-if="!getPsdSetImages(row).length" class="text-gray-400 text-xs">无</span>
              </div>
            </template>
          </vxe-grid>
        </div>

        <div
          v-if="
            !currentRelationsRow.customModel &&
            !currentRelationsRow.sticker &&
            !currentRelationsRow.psdSet
          "
          class="text-center py-8 text-gray-400"
        >
          无关联信息
        </div>
      </div>
      <template #footer>
        <el-button @click="relationsDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 查看源信息对话框 -->
    <el-dialog
      v-model="relationsSourceInfoVisible"
      title="关联信息源数据"
      width="80%"
      :close-on-click-modal="false"
      align-center
      :destroy-on-close="true"
    >
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

    <el-dialog
      v-model="customModelDraftDialogVisible"
      title="关联草稿"
      width="80%"
      :close-on-click-modal="false"
      align-center
      :destroy-on-close="true"
    >
      <div v-if="customModelDrafts.length === 0" class="empty-state text-center py-8">
        <el-empty description="暂无关联草稿" />
      </div>
      <div v-else class="draft-grid">
        <div v-for="draft in customModelDrafts" :key="draft.id" class="draft-item">
          <div class="draft-preview">
            <!-- 视频预览 -->
            <div
              v-if="
                draft.suffix &&
                ['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(draft.suffix.toLowerCase())
              "
              class="video-preview-container"
              @click="handleDraftVideoPlay(draft)"
            >
              <video
                :src="draft.url"
                class="w-full h-32 rounded cursor-pointer object-cover"
                preload="metadata"
                muted
              />
              <div class="video-overlay">
                <el-icon class="play-icon">
                  <VideoPlay />
                </el-icon>
              </div>
            </div>
            <!-- 图片预览 -->
            <el-image
              v-else
              :src="draft.url"
              fit="cover"
              class="w-full h-32 rounded cursor-pointer"
              :preview-src-list="[draft.url]"
              :preview-teleported="true"
              :z-index="9999"
            />
          </div>
          <div class="draft-info p-3">
            <div class="draft-header flex justify-between items-start mb-2">
              <div class="draft-name text-sm font-medium truncate flex-1">
                {{ draft.name || "未命名" }}
              </div>
            </div>
            <div
              v-if="draft.description"
              class="draft-desc text-xs text-color-regular mt-1 line-clamp-2"
            >
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

    <el-dialog
      v-model="aiGenDialogVisible"
      title="AI自动生成内容"
      width="500px"
      align-center
      :destroy-on-close="true"
    >
      <div style="margin-bottom: 16px; color: #888; font-size: 15px">
        请输入你希望AI分析的内容风格或角度（如：偏艺术描述、简洁风格、突出色彩等）
      </div>
      <el-input
        v-model="aiGenPrompt"
        type="textarea"
        :rows="6"
        placeholder="如：请用艺术化语言描述商品内容..."
        style="font-size: 16px; min-height: 120px; width: 100%; resize: vertical"
      />
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog"
          >确定</el-button
        >
      </template>
    </el-dialog>

    <!-- 产品详情弹窗 -->
    <el-dialog
      v-model="productDetailVisible"
      title="产品详情"
      width="90%"
      :fullscreen="true"
      :close-on-click-modal="false"
      align-center
      :destroy-on-close="true"
      class="product-detail-dialog"
    >
      <div class="product-detail-wrapper">
        <div v-if="productDetailLoading" class="flex items-center justify-center py-20">
          <el-icon class="is-loading" style="font-size: 32px">
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
                  <el-tag v-if="productDetail.code" type="info" size="small">{{
                    productDetail.code
                  }}</el-tag>
                  <span v-else class="text-gray-400">未生成</span>
                </div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">商品名称</div>
                <div class="product-info-value">{{ productDetail.name || "未设置" }}</div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">英文名称</div>
                <div class="product-info-value">{{ productDetail.enName || "未设置" }}</div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">商品类型</div>
                <div class="product-info-value">
                  {{ normalizeProductType(productDetail.type) }}
                </div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">原价</div>
                <div class="product-info-value">{{ formatMoney(productDetail.price) }}</div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">售价</div>
                <div class="product-info-value">{{ formatMoney(productDetail.salePrice) }}</div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">库存</div>
                <div class="product-info-value">{{ productDetail.stock ?? 0 }}</div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">来源</div>
                <div class="product-info-value">
                  {{ formatSourceType(productDetail.sourceType) }}
                </div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">来源套图</div>
                <div class="product-info-value">
                  {{ productDetail.meta?.psdSet?.name || productDetail.meta?.psdSetId || "未关联" }}
                </div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">素材图编码</div>
                <div class="product-info-value">
                  {{ getProductSourceMaterialCodesText(productDetail) || "未关联" }}
                </div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">生成模板</div>
                <div class="product-info-value">
                  {{
                    productDetail.meta?.productGenerationTemplateName ||
                    productDetail.meta?.productGenerationTemplateId ||
                    "未关联"
                  }}
                </div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">关联发布配置</div>
                <div class="product-info-value">
                  {{ formatSourceIdList(productDetail.meta?.publishConfigIds) }}
                </div>
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
                <div class="product-info-value">{{ productDetail.description || "未设置" }}</div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">英文描述</div>
                <div class="product-info-value">{{ productDetail.enDescription || "未设置" }}</div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">关键词</div>
                <div class="product-info-value">{{ productDetail.keywords || "未设置" }}</div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">英文关键词</div>
                <div class="product-info-value">{{ productDetail.enKeywords || "未设置" }}</div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">搜索关键字</div>
                <div class="product-info-value">{{ productDetail.searchKeywords || "未设置" }}</div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">英文搜索关键字</div>
                <div class="product-info-value">
                  {{ productDetail.enSearchKeywords || "未设置" }}
                </div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">URL别名</div>
                <div class="product-info-value">{{ productDetail.slug || "未设置" }}</div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">SEO标题</div>
                <div class="product-info-value">{{ productDetail.seoTitle || "未设置" }}</div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">SEO描述</div>
                <div class="product-info-value">{{ productDetail.seoDescription || "未设置" }}</div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">创建人</div>
                <div class="product-info-value">
                  {{
                    productDetail?.uploader?.account ||
                    productDetail?.uploader?.name ||
                    productDetail?.userId ||
                    "未设置"
                  }}
                </div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">创建时间</div>
                <div class="product-info-value">
                  {{
                    productDetail.createTime ? formatTimestamp(productDetail.createTime) : "未设置"
                  }}
                </div>
              </div>
              <div class="product-info-item">
                <div class="product-info-label">修改时间</div>
                <div class="product-info-value">
                  {{
                    productDetail.updateTime ? formatTimestamp(productDetail.updateTime) : "未设置"
                  }}
                </div>
              </div>
            </div>
          </div>

          <!-- 商品图片 -->
          <div
            class="product-detail-section mb-4"
            v-if="productDetail.images && productDetail.images.length > 0"
          >
            <div class="product-detail-section-title flex items-center justify-between">
              <div class="flex items-center gap-2">
                <el-icon>
                  <Picture />
                </el-icon>
                <span>商品图片 ({{ productDetail.images.length }})</span>
              </div>
              <el-button type="primary" link size="small" @click="handleDownloadAllProductImages">
                批量下载所有图片
              </el-button>
            </div>
            <div class="flex flex-wrap gap-2">
              <el-image
                v-for="(url, index) in productDetail.images"
                :key="index"
                :src="url"
                :preview-src-list="productDetail.images"
                :initial-index="index"
                :preview-teleported="true"
                :hide-on-click-modal="false"
                class="w-32 h-32 object-cover rounded cursor-pointer"
                fit="cover"
              />
            </div>
          </div>

          <div
            class="product-detail-section mb-4"
            v-if="productDetail.detailImages && productDetail.detailImages.length > 0"
          >
            <div class="product-detail-section-title">
              <el-icon>
                <Picture />
              </el-icon>
              <span>详情图片 ({{ productDetail.detailImages.length }})</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <el-image
                v-for="(url, index) in productDetail.detailImages"
                :key="index"
                :src="url"
                :preview-src-list="productDetail.detailImages"
                :initial-index="index"
                :preview-teleported="true"
                :hide-on-click-modal="false"
                class="w-32 h-32 object-cover rounded cursor-pointer"
                fit="cover"
              />
            </div>
          </div>

          <!-- 商品视频 -->
          <div
            class="product-detail-section mb-4"
            v-if="productDetail.videos && productDetail.videos.length > 0"
          >
            <div class="product-detail-section-title">
              <el-icon>
                <VideoPlay />
              </el-icon>
              <span>商品视频 ({{ productDetail.videos.length }})</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(url, index) in productDetail.videos"
                :key="index"
                class="relative cursor-pointer"
                @click="handleVideoPreview(productDetail.videos, index as any, productDetail)"
              >
                <video :src="url" class="w-32 h-32 object-cover rounded" muted preload="metadata" />
                <div
                  class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded"
                >
                  <el-icon class="text-white text-2xl">
                    <VideoPlay />
                  </el-icon>
                </div>
                <div
                  class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl"
                >
                  {{ (index as any) + 1 }}/{{ productDetail.videos.length }}
                </div>
              </div>
            </div>
          </div>

          <!-- 关联信息 -->
          <div
            class="product-detail-section mb-4"
            v-if="productDetail.customModel || productDetail.sticker || productDetail.meta?.psdSet"
          >
            <div class="product-detail-section-title">
              <el-icon>
                <Box />
              </el-icon>
              <span>关联信息</span>
            </div>
            <div class="relations-detail-content">
              <div
                v-if="
                  productDetail.customModel || productDetail.sticker || productDetail.meta?.psdSet
                "
                class="relations-info"
              >
                <div v-if="productDetail.customModel" class="relation-card">
                  <div class="relation-card__media">
                    <el-image
                      v-if="productDetail.customModel.thumbnail"
                      :src="
                        getPreviewImageUrl(productDetail.customModel.thumbnail, {
                          width: 240,
                          quality: 80,
                          format: 'webp',
                        })
                      "
                      :preview-src-list="getCustomModelImages(productDetail.customModel)"
                      :initial-index="0"
                      :preview-teleported="true"
                      :hide-on-click-modal="false"
                      class="relation-card__image"
                      fit="contain"
                    />
                    <span v-else class="relation-card__empty">无图</span>
                  </div>
                  <div class="relation-card__body">
                    <div class="relation-card__head">
                      <span class="relation-card__type">设计模型</span>
                      <span class="relation-card__title">{{
                        productDetail.customModel.name || "未命名"
                      }}</span>
                    </div>
                    <div class="relation-card__fields">
                      <div class="relation-card__field">
                        <span>描述</span>
                        <strong>{{ productDetail.customModel.description || "-" }}</strong>
                      </div>
                      <div class="relation-card__field">
                        <span>关键词</span>
                        <strong>{{ productDetail.customModel.keywords || "-" }}</strong>
                      </div>
                      <div class="relation-card__field">
                        <span>更新时间</span>
                        <strong>{{
                          productDetail.customModel.updateTime
                            ? formatTimestamp(productDetail.customModel.updateTime)
                            : "-"
                        }}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="productDetail.sticker" class="relation-card">
                  <div class="relation-card__media">
                    <el-image
                      v-if="productDetail.sticker.url"
                      :src="productDetail.sticker.url"
                      :preview-src-list="[productDetail.sticker.url]"
                      :initial-index="0"
                      :preview-teleported="true"
                      :hide-on-click-modal="false"
                      class="relation-card__image"
                      fit="contain"
                    />
                    <span v-else class="relation-card__empty">无图</span>
                  </div>
                  <div class="relation-card__body">
                    <div class="relation-card__head">
                      <span class="relation-card__type">贴纸</span>
                      <span class="relation-card__title">{{
                        productDetail.sticker.name || "未命名"
                      }}</span>
                    </div>
                    <div class="relation-card__fields">
                      <div class="relation-card__field">
                        <span>描述</span>
                        <strong>{{ productDetail.sticker.description || "-" }}</strong>
                      </div>
                      <div class="relation-card__field">
                        <span>关键词</span>
                        <strong>{{ productDetail.sticker.keywords || "-" }}</strong>
                      </div>
                      <div class="relation-card__field">
                        <span>格式</span>
                        <strong>{{ productDetail.sticker.suffix || "-" }}</strong>
                      </div>
                      <div class="relation-card__field">
                        <span>更新时间</span>
                        <strong>{{
                          productDetail.sticker.updateTime
                            ? formatTimestamp(productDetail.sticker.updateTime)
                            : "-"
                        }}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="productDetail.meta?.psdSet" class="relation-card relation-card--wide">
                  <div class="relation-card__body">
                    <div class="relation-card__head">
                      <span class="relation-card__type">PSD套图</span>
                      <span class="relation-card__title">{{
                        productDetail.meta.psdSet.name || "未命名"
                      }}</span>
                    </div>
                    <div class="relation-card__gallery">
                      <el-image
                        v-for="(img, idx) in getPsdSetImages(productDetail.meta.psdSet).slice(0, 4)"
                        :key="idx"
                        :src="img"
                        :preview-src-list="getPsdSetImages(productDetail.meta.psdSet)"
                        :initial-index="idx"
                        :preview-teleported="true"
                        :hide-on-click-modal="false"
                        class="relation-card__gallery-image"
                        fit="cover"
                      />
                      <div
                        v-if="getPsdSetImages(productDetail.meta.psdSet).length > 4"
                        class="relation-card__more"
                      >
                        +{{ getPsdSetImages(productDetail.meta.psdSet).length - 4 }}
                      </div>
                      <span
                        v-if="!getPsdSetImages(productDetail.meta.psdSet).length"
                        class="relation-card__empty"
                        >无图</span
                      >
                    </div>
                    <div class="relation-card__fields">
                      <div class="relation-card__field">
                        <span>ID</span>
                        <strong>{{ productDetail.meta.psdSet.id || "-" }}</strong>
                      </div>
                      <div class="relation-card__field">
                        <span>描述</span>
                        <strong>{{ productDetail.meta.psdSet.description || "-" }}</strong>
                      </div>
                      <div class="relation-card__field">
                        <span>更新时间</span>
                        <strong>{{
                          productDetail.meta.psdSet.updateTime
                            ? formatTimestamp(productDetail.meta.psdSet.updateTime)
                            : "-"
                        }}</strong>
                      </div>
                    </div>
                  </div>
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
  </ContentWrap>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, watchEffect, nextTick } from "vue";
import { buildOperationColumn, commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { useUserStore } from "@/store/modules/user";
const userStore = useUserStore();
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search,
  DArrowLeft,
  DArrowRight,
  Check,
  Folder,
  Plus,
  Delete,
  Picture,
  Box,
  ArrowLeft,
  ArrowRight,
  Edit,
  Upload,
  Share,
  MagicStick,
  VideoPlay,
  Refresh,
  QuestionFilled,
  View,
  Document,
  DocumentCopy,
  Grid,
  Loading,
  InfoFilled,
  Lock,
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
  batchMoveProducts,
  aiGenerateProductInfo,
} from "@/api/product";
import { productCategoryApi } from "@/api/product-category";
import { productGenerationTemplateApi } from "@/api/product-generation-template";
import { getPublishConfigListApi } from "@/api/product/publishConfig";
import { uploadToCOS } from "@/api/cos";
import { copyLink } from "@/utils/clipboard";
import { getDraftList } from "@/api/draft";
import { createTask } from "@/api/system/queue";
import { getDesignModel } from "@/api/designModel";
import request from "@/config/axios";
import { normalizeProductType } from "@/utils/product-type";
import { getPreviewImageUrl } from "@/utils/image";
import FolderTree from "@/components/material/FolderTree.vue";
import TableRowDragHandle from "@/components/TableRowDragHandle/index.vue";
import DateRangePicker from "@/components/DateRangePicker.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import { useFolderRowDrag } from "@/hooks/useFolderRowDrag";
import { FOLDER_FILTER, convertFolderIdToApiParam } from "@/constants/folder";
import { isQueuedAiTaskResult, notifyQueuedAiTask, unwrapAiTaskResult } from "@/utils/aiTask";

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  id: "",
  code: "",
  sku: "",
  spu: "",
  searchText: "",
  search: "",
  isPublish: undefined as boolean | undefined,
  random: false,
  startTime: "",
  endTime: "",
  folderId: "",
  categoryId: "",
  brand: "",
  type: "",
  status: "",
  inventoryStatus: "",
  priceMin: undefined as number | undefined,
  priceMax: undefined as number | undefined,
  isFeatured: undefined as boolean | undefined,
  isNew: undefined as boolean | undefined,
  isHot: undefined as boolean | undefined,
  isOnSale: undefined as boolean | undefined,
  sortBy: "",
  sortDir: "DESC",
});

const productStatusOptions = [
  { label: "在售", value: "active" },
  { label: "草稿", value: "draft" },
  { label: "归档", value: "archived" },
];

const inventoryStatusOptions = [
  { label: "有库存", value: "in_stock" },
  { label: "无库存", value: "out_of_stock" },
  { label: "预售", value: "preorder" },
];

const optionLabel = (options: Array<{ label: string; value: string }>, value?: string) =>
  options.find((item) => item.value === value)?.label || value || "-";

const categoryList = ref<any[]>([]);
const loadCategoryList = async () => {
  try {
    const res = await productCategoryApi.getAll();
    categoryList.value = Array.isArray(res) ? res : res?.list || res?.data || [];
  } catch (e) {
    categoryList.value = [];
  }
};

// 文件夹变更处理
const handleFolderChange = ({ folderId }) => {
  queryParams.folderId = folderId;
  handleSearch();
};

// 搜索筛选折叠状态
const actionsCollapsed = useLocalStorage("product_filter_collapsed", true);
const folderTreeCollapsed = useLocalStorage("product_folder_collapsed", false);

// 是否显示关联信息
const showRelations = useLocalStorage("product_show_relations", true);

// 基础列配置
const baseColumns: any[] = [
  {
    title: "",
    field: "dragHandle",
    width: 34,
    showOverflow: false,
    align: "center",
    slots: { default: "dragHandleSlot" },
  },
  { type: "checkbox", width: 42, showOverflow: true },
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
    width: "auto",
    slots: {
      default: "videoDefaultSlot",
    },
  },
  {
    title: "商品名称",
    field: "name",
    width: 280,
    showOverflow: false,
    slots: { default: "nameSlot" },
  },
  {
    title: "商品描述",
    field: "description",
    width: 300,
    showOverflow: false,
    slots: { default: "descriptionSlot" },
  },
  {
    title: "关键词",
    field: "keywords",
    width: 280,
    showOverflow: false,
    slots: { default: "keywordsSlot" },
  },
  {
    title: "搜索关键字",
    field: "searchKeywords",
    minWidth: 300,
    width: 300,
    showOverflow: false,
    slots: { header: "searchKeywordsHeader", default: "searchKeywordsSlot" },
  },
];

// 关联信息列
const relationsColumn = {
  title: "关联信息",
  field: "relations",
  width: "auto",
  slots: { default: "relationsSlot" },
};

const sourceMaterialCodesColumn = {
  title: "素材图编码",
  field: "sourceMaterialCodes",
  width: 180,
  showOverflow: true,
  slots: { default: "sourceMaterialCodesSlot" },
};

// 动态列配置
const gridColumns = computed(() => {
  const columns = [...baseColumns];
  if (showRelations.value) {
    columns.push(relationsColumn);
  }
  columns.push(sourceMaterialCodesColumn);
  columns.push(
    {
      title: "产品代码",
      field: "code",
      width: 120,
      showOverflow: true,
      slots: { default: "codeSlot" },
    },
    {
      title: "SKU/SPU",
      field: "sku",
      width: 150,
      showOverflow: true,
      formatter: ({ row }) => [row.sku, row.spu].filter(Boolean).join(" / ") || "-",
    },
    {
      title: "商品类型",
      field: "type",
      width: 140,
      showOverflow: true,
      slots: { default: "typeSlot" },
    },
    {
      title: "分类",
      field: "categoryId",
      width: 120,
      showOverflow: true,
      formatter: ({ row }) => {
        const cat = categoryList.value.find((c) => c.id === row.categoryId);
        return cat?.name || "-";
      },
    },
    {
      title: "品牌",
      field: "brand",
      width: 100,
      showOverflow: true,
      formatter: ({ cellValue }) => cellValue || "-",
    },
    {
      title: "状态",
      field: "status",
      width: 80,
      formatter: ({ cellValue }) => optionLabel(productStatusOptions, cellValue),
    },
    {
      title: "原价",
      field: "price",
      width: 90,
      align: "right",
      formatter: ({ cellValue }) => {
        const v = Number(cellValue || 0);
        return v > 0 ? `¥${v.toFixed(2)}` : "-";
      },
    },
    {
      title: "售价",
      field: "salePrice",
      width: 90,
      align: "right",
      formatter: ({ cellValue }) => {
        const v = Number(cellValue || 0);
        return v > 0 ? `¥${v.toFixed(2)}` : "-";
      },
    },
    {
      title: "划线价",
      field: "compareAtPrice",
      width: 90,
      align: "right",
      formatter: ({ cellValue }) => {
        const v = Number(cellValue || 0);
        return v > 0 ? `¥${v.toFixed(2)}` : "-";
      },
    },
    {
      title: "库存",
      field: "stock",
      width: 70,
      align: "right",
    },
    {
      title: "库存状态",
      field: "inventoryStatus",
      width: 90,
      formatter: ({ cellValue }) => optionLabel(inventoryStatusOptions, cellValue),
    },
    {
      title: "销量",
      field: "salesCount",
      width: 70,
      align: "right",
      formatter: ({ cellValue }) => cellValue || 0,
    },
    {
      title: "精选",
      field: "isFeatured",
      width: 60,
      align: "center",
      slots: { default: "isFeaturedSlot" },
    },
    {
      title: "标签",
      field: "commerceFlags",
      width: 120,
      formatter: ({ row }) =>
        [row.isNew ? "新品" : "", row.isHot ? "热销" : "", row.isOnSale ? "促销" : ""]
          .filter(Boolean)
          .join(" / ") || "-",
    },
    {
      title: "发布状态",
      field: "isPublish",
      width: 100,
      align: "center",
      slots: { default: "publishStatusSlot" },
    },
    {
      title: "ID",
      field: "id",
      width: 120,
      showOverflow: false,
      slots: { default: "idSlot" },
    },
    {
      title: "创建人",
      field: "uploader",
      minWidth: 100,
      showOverflow: true,
      formatter: ({ row }) => row?.uploader?.account || row?.uploader?.name || row?.userId || "-",
    },
    {
      title: "创建时间",
      field: "createTime",
      width: 150,
      className: "table-time-cell",
      showOverflow: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue);
      },
    },
    {
      title: "修改时间",
      field: "updateTime",
      width: 150,
      className: "table-time-cell",
      showOverflow: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue);
      },
    },
    buildOperationColumn("operationDefaultSlot"),
  );
  return columns;
});

const gridOptions = computed(() => ({
  ...commonGridOptions,
  maxHeight: gridMaxHeight.value,
  rowClassName: ({ row }) => {
    if (!row) return "";
    if (dragState.dragging && dragState.draggingIds.includes(String(row.id))) {
      return "is-dragging-row";
    }
    return "";
  },
  rowConfig: {
    isHover: true,
  },
  columns: gridColumns.value,
}));

// PSD 套图列配置（关联列表 & 详情弹窗共用）
const psdSetBaseColumns = [
  { field: "images", title: "套图图片", width: 240, slots: { default: "psdSetImagesSlot" } },
  { field: "name", title: "名称", minWidth: 120, showOverflow: true },
  { field: "description", title: "描述", minWidth: 150, showOverflow: true },
  { field: "keywords", title: "关键词", minWidth: 120, showOverflow: true },
  {
    field: "updateTime",
    title: "更新时间",
    minWidth: 140,
    formatter: ({ cellValue }) => formatTimestamp(cellValue),
  },
];
const psdSetColumns = psdSetBaseColumns;
const psdSetDetailColumns = [...psdSetBaseColumns, { field: "id", title: "关联ID", minWidth: 120 }];
const relationGridOptions = {
  border: "inner",
  round: false,
  size: "small",
  showHeader: true,
  showOverflow: "tooltip",
  showHeaderOverflow: false,
  minHeight: 156,
  rowConfig: {
    isHover: true,
    height: 78,
  },
  columnConfig: {
    resizable: true,
  },
  headerCellClassName: "relation-sub-grid__header",
  cellClassName: "relation-sub-grid__cell",
} as const;

const { height } = useWindowSize();
const gridMaxHeight = ref<number>(0);

watchEffect(() => {
  gridMaxHeight.value = height.value - 250;
});

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
const productEditorAdvancedSections = ref<string[]>([
  "operation",
  "specifications",
  "multilingual",
  "system",
]);
const currentRow = ref({});
const submitLoading = ref(false);
const previewVisible = ref(false);
const previewUrl = ref("");
const previewList = ref<string[]>([]);
const previewIndex = ref(0);
const fileList = ref([]);
const pendingFiles = ref([]);
const existingImages = ref([]);
const videoFileList = ref([]);
const pendingVideoFiles = ref([]);
const existingVideos = ref([]);
const pendingDetailFiles = ref([]);
const deletingVideoKey = ref<string>("");
const publishDialogVisible = ref(false);

// 拖拽状态（拖商品 -> 文件夹）
const {
  dragState,
  setupRowDrag,
  handleFolderDragOver,
  handleFolderDragLeave,
  resetAfterDrop,
  markExternalFolderDropHandled,
} = useFolderRowDrag({
  gridClass: "product-dnd-grid",
  dataSource,
  selectedIds: ids,
  onDropToFolder: handleFolderDrop,
});

async function handleFolderDrop(payload: { data: any }) {
  markExternalFolderDropHandled();
  if (!dragState.draggingIds.length) return;
  if (payload.data.id === FOLDER_FILTER.ALL) return;

  const targetFolderId =
    payload.data.id === FOLDER_FILTER.NOT_GROUP ? FOLDER_FILTER.NOT_GROUP : payload.data.id;
  const targetPath = payload.data.path || "";
  const movingIds = [...dragState.draggingIds];

  try {
    await batchMoveProducts({
      ids: movingIds,
      folderId: convertFolderIdToApiParam(targetFolderId) as string,
    });
    ElMessage.success(`已移动 ${movingIds.length} 个商品到 ${targetPath || "未分组"}`);
    await getList();
    ids.value = [];
    selectedRows.value = [];
  } catch (error) {
    ElMessage.error((error as Error).message || "移动失败");
  } finally {
    resetAfterDrop();
  }
}

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
const productGenerationTemplateMap = ref<Record<string, any>>({});
const publishConfigMap = ref<Record<string, any>>({});
const relationDictionaryLoaded = ref(false);
const relationDictionaryLoading = ref(false);

// 发布结果相关
const publishResultVisible = ref(false);
const publishResults = ref<
  Array<{
    platform: string;
    success: boolean;
    message: string;
    data?: any;
  }>
>([]);

// 发布结果汇总
const publishSummary = computed(() => {
  if (publishResults.value.length === 0) {
    return {
      success: false,
      partial: false,
      failed: false,
      message: "",
      successCount: 0,
      failCount: 0,
    };
  }

  const successCount = publishResults.value.filter((r) => r.success).length;
  const failCount = publishResults.value.filter((r) => !r.success).length;
  const total = publishResults.value.length;

  return {
    success: successCount === total,
    partial: successCount > 0 && failCount > 0,
    failed: failCount === total,
    message:
      successCount === total
        ? "所有平台发布成功！"
        : successCount > 0
          ? `部分平台发布成功`
          : "所有平台发布失败",
    successCount,
    failCount,
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
  doudian: PlatformForm | null;
  kuaishou_shop: PlatformForm | null;
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
  doudian: null,
  kuaishou_shop: null,
  bilibili: null,
  xianyu: null,
  tiktok: null,
  youtube: null,
});

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
  status: string;
  sku: string;
  spu: string;
  categoryId: string;
  brand: string;
  material: string;
  weight: number;
  dimensions: string;
  unit: string;
  barcode: string;
  origin: string;
  costPrice: number;
  compareAtPrice: number;
  currency: string;
  inventoryStatus: string;
  lowStockThreshold: number;
  minOrderQuantity: number;
  sort: number;
  isFeatured: boolean;
  isNew: boolean;
  isHot: boolean;
  isOnSale: boolean;
  images: string[];
  videos: string[];
  detailImages: string[];
  price: number;
  salePrice: number;
  stock: number;
  specifications?: any;
  specificationsText: string;
  attributes?: any;
  attributesText: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  sourceType: string;
  sourceMaterialCodes: string;
  shippingTemplateId: string;
  packageWeight: number;
  packageLength: number;
  packageWidth: number;
  packageHeight: number;
  tags: string;
  isPublish?: boolean;
  createTime?: Date;
  updateTime?: Date;
  file: any;
}

const form = ref<ProductForm>({
  code: "",
  name: "",
  enName: "",
  description: "",
  enDescription: "",
  keywords: "",
  enKeywords: "",
  searchKeywords: "",
  enSearchKeywords: "",
  type: "",
  status: "active",
  sku: "",
  spu: "",
  categoryId: "",
  brand: "",
  material: "",
  weight: 0,
  dimensions: "",
  unit: "件",
  barcode: "",
  origin: "",
  costPrice: 0,
  compareAtPrice: 0,
  currency: "CNY",
  inventoryStatus: "in_stock",
  lowStockThreshold: 0,
  minOrderQuantity: 1,
  sort: 0,
  isFeatured: false,
  isNew: false,
  isHot: false,
  isOnSale: false,
  images: [] as string[],
  videos: [] as string[],
  detailImages: [] as string[],
  price: 0,
  salePrice: 0,
  stock: 0,
  specifications: null,
  specificationsText: "",
  attributes: null,
  attributesText: "",
  slug: "",
  seoTitle: "",
  seoDescription: "",
  sourceType: "manual",
  sourceMaterialCodes: "",
  shippingTemplateId: "",
  packageWeight: 0,
  packageLength: 0,
  packageWidth: 0,
  packageHeight: 0,
  tags: "",
  isPublish: false,
  file: null,
});

const validateProductImages = (_rule: any, _value: unknown, callback: (error?: Error) => void) => {
  if (form.value.images.length > 0 || pendingFiles.value.length > 0) {
    callback();
    return;
  }
  callback(new Error("请至少添加一张商品图片"));
};

const rules = {
  name: [{ required: true, message: "请输入商品名称", trigger: "blur" }],
  description: [{ required: false, message: "请输入商品描述", trigger: "blur" }],
  type: [{ required: true, message: "请输入商品类型", trigger: "blur" }],
  images: [{ validator: validateProductImages, trigger: "change" }],
};

const dialogClose = () => {
  dialogVisible.value = false;
  productEditorAdvancedSections.value = ["operation", "specifications", "multilingual", "system"];
  fileList.value = [];
  pendingFiles.value = [];
  existingImages.value = [];
  videoFileList.value = [];
  pendingVideoFiles.value = [];
  existingVideos.value = [];
  pendingDetailFiles.value = [];
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
  pendingFiles.value = files.filter((file) => file.raw).map((file) => file.raw);
  formRef.value?.validateField("images").catch(() => undefined);
};

// 处理视频文件列表变化
const handleVideoFilesChange = (files) => {
  pendingVideoFiles.value = files.filter((file) => file.raw).map((file) => file.raw);
};

const handleDetailFilesChange = (files) => {
  pendingDetailFiles.value = files.filter((file) => file.raw).map((file) => file.raw);
};

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  // 如果图片加载失败，使用占位图（可以使用一个默认的占位图）
  // 或者隐藏图片：img.style.display = 'none';
  // 这里暂时隐藏，等图片准备好后会自动显示
  img.style.opacity = "0.3";
  img.style.backgroundColor = "#f0f0f0";
};

const submitForm = async () => {
  submitLoading.value = true;
  try {
    await formRef.value.validate();
    const formData = { ...form.value };
    delete formData.file;
    delete formData.createTime;
    delete formData.updateTime;
    // 如果是新建且code为空，删除code字段，让后端自动生成
    if (!isEdit.value && (!formData.code || formData.code.trim() === "")) {
      delete formData.code;
    }
    if (form.value.specificationsText?.trim()) {
      try {
        formData.specifications = JSON.parse(form.value.specificationsText);
      } catch (error) {
        ElMessage.error("规格配置必须是合法 JSON");
        return;
      }
    } else {
      formData.specifications = null;
    }
    delete formData.specificationsText;
    if (form.value.attributesText?.trim()) {
      try {
        formData.attributes = JSON.parse(form.value.attributesText);
      } catch (error) {
        ElMessage.error("商品属性必须是合法 JSON");
        return;
      }
    } else {
      formData.attributes = null;
    }
    delete formData.attributesText;
    // 上传所有待上传的图片到COS
    let newImageUrls: string[] = [];
    const userAccount =
      (userStore.user as any)?.account ||
      userStore.user?.shortName ||
      userStore.user?.name ||
      "anonymous";
    const userId = (userStore.user as any)?.id || (userStore as any).userInfo?.id;
    const productId = isEdit.value ? form.value.id : undefined; // 编辑时使用产品 ID
    if (pendingFiles.value.length > 0) {
      const uploadPromises = pendingFiles.value.map(async (file) => {
        try {
          const result = await uploadToCOS({
            file,
            category: "product",
            account: userAccount,
            userId,
            entityId: productId, // 编辑时使用产品 ID
          });
          return result.url;
        } catch (error) {
          ElMessage.error(`图片 ${file.name} 上传失败`);
          throw error;
        }
      });
      try {
        const results = await Promise.all(uploadPromises);
        newImageUrls = results.filter((url) => url !== null);
      } catch (error) {
        ElMessage.error("图片上传失败，请重试");
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
            category: "product",
            account: userAccount,
            userId,
            entityId: productId, // 编辑时使用产品 ID
          });
          return result.url;
        } catch (error) {
          ElMessage.error(`视频 ${file.name} 上传失败`);
          throw error;
        }
      });
      try {
        const results = await Promise.all(uploadPromises);
        newVideoUrls = results.filter((url) => url !== null);
      } catch (error) {
        ElMessage.error("视频上传失败，请重试");
        return;
      }
    }
    let newDetailImageUrls: string[] = [];
    if (pendingDetailFiles.value.length > 0) {
      const uploadPromises = pendingDetailFiles.value.map(async (file) => {
        try {
          const result = await uploadToCOS({
            file,
            category: "product",
            account: userAccount,
            userId,
            entityId: productId,
          });
          return result.url;
        } catch (error) {
          ElMessage.error(`详情图片 ${file.name} 上传失败`);
          throw error;
        }
      });
      try {
        const results = await Promise.all(uploadPromises);
        newDetailImageUrls = results.filter((url) => url !== null);
      } catch (error) {
        ElMessage.error("详情图片上传失败，请重试");
        return;
      }
    }
    // 合并已有图片和新上传的图片URL
    formData.images = [...form.value.images, ...newImageUrls];
    // 合并已有视频和新上传的视频URL
    formData.videos = [...form.value.videos, ...newVideoUrls];
    formData.detailImages = [...form.value.detailImages, ...newDetailImageUrls];
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

const formatMoney = (value: any) => {
  const amount = Number(value || 0);
  return amount > 0 ? amount.toFixed(2) : "未设置";
};

const formatSourceType = (value?: string) => {
  const map: Record<string, string> = {
    manual: "手动创建",
    psd_set: "PSD套图",
    import: "导入",
  };
  return map[value || ""] || value || "未设置";
};

const formatSourceIdList = (value?: any) => {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,，\s]+/)
      : [];
  const normalized = list.map((item) => String(item || "").trim()).filter(Boolean);
  return normalized.length ? normalized.join("、") : "未关联";
};

const normalizeRelationIdList = (value?: any): string[] => {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,，\s]+/)
      : [];
  return Array.from(new Set(list.map((item) => String(item || "").trim()).filter(Boolean)));
};

const getProductSourceMeta = (row: any) => {
  const meta = row?.meta && typeof row.meta === "object" ? row.meta : {};
  return { meta };
};

const getProductSourcePsdSetId = (row: any) => {
  const { meta } = getProductSourceMeta(row);
  return String(meta.psdSetId || meta.psdSet?.id || "").trim();
};

const getPsdSetAutomationConfigIds = (row: any, actionType: string, key: string) => {
  const automations = Array.isArray(row?.meta?.psdSet?.meta?.automations)
    ? row.meta.psdSet.meta.automations
    : [];
  return normalizeRelationIdList(
    automations
      .filter((item: any) => item?.action_type === actionType)
      .flatMap((item: any) => item?.config?.[key] || []),
  );
};

const getProductSourcePsdSetText = (row: any) => {
  const { meta } = getProductSourceMeta(row);
  return meta.psdSet?.name || meta.psdSetId || "未关联";
};

const getProductSourceTemplateIds = (row: any) => {
  const { meta } = getProductSourceMeta(row);
  const fromProduct = normalizeRelationIdList([meta.productGenerationTemplateId]);
  const fromPsdSet = getPsdSetAutomationConfigIds(
    row,
    "generate_product",
    "productGenerationTemplateIds",
  );
  return Array.from(new Set([...fromProduct, ...fromPsdSet]));
};

const getProductSourcePublishConfigIds = (row: any) => {
  const { meta } = getProductSourceMeta(row);
  const fromProduct = normalizeRelationIdList(meta.publishConfigIds);
  const fromPsdSet = getPsdSetAutomationConfigIds(
    row,
    "create_publish_task_from_config",
    "publishConfigIds",
  );
  return Array.from(new Set([...fromProduct, ...fromPsdSet]));
};

const formatRelationNames = (ids: string[], map: Record<string, any>, fallbackName?: string) => {
  if (fallbackName && !ids.length) return fallbackName;
  const values = ids
    .map((id) => {
      const item = map[id];
      return item?.name || item?.taskType || item?.platform || id;
    })
    .filter(Boolean);
  return values.length ? values.join("、") : "未关联";
};

const getProductSourceTemplateText = (row: any) => {
  const { meta } = getProductSourceMeta(row);
  return formatRelationNames(
    getProductSourceTemplateIds(row),
    productGenerationTemplateMap.value,
    meta.productGenerationTemplateName,
  );
};

const getProductSourcePublishConfigText = (row: any) =>
  formatRelationNames(getProductSourcePublishConfigIds(row), publishConfigMap.value);

const getProductSourceMaterialCodesText = (row: any) => {
  const { meta } = getProductSourceMeta(row);
  const value = row?.sourceMaterialCodes || meta.sourceMaterialCodes;
  return normalizeRelationIdList(value).join("、");
};

const hasProductRelationInfo = (row: any) =>
  !!(
    getProductSourcePsdSetId(row) ||
    getProductSourceMaterialCodesText(row) ||
    row?.meta?.psdSet ||
    getProductSourceTemplateIds(row).length ||
    getProductSourcePublishConfigIds(row).length
  );

const loadRelationDictionaries = async () => {
  if (relationDictionaryLoaded.value || relationDictionaryLoading.value) return;
  relationDictionaryLoading.value = true;
  try {
    const [templateRes, configRes] = await Promise.allSettled([
      productGenerationTemplateApi.getList({ currentPage: 1, pageSize: 500, isActive: true }),
      getPublishConfigListApi(),
    ]);

    if (templateRes.status === "fulfilled") {
      const list = Array.isArray((templateRes.value as any)?.list)
        ? (templateRes.value as any).list
        : Array.isArray((templateRes.value as any)?.data?.list)
          ? (templateRes.value as any).data.list
          : [];
      productGenerationTemplateMap.value = Object.fromEntries(
        list.map((item: any) => [String(item.id), item]),
      );
    }

    if (configRes.status === "fulfilled") {
      const list = Array.isArray(configRes.value)
        ? configRes.value
        : Array.isArray((configRes.value as any)?.data)
          ? (configRes.value as any).data
          : Array.isArray((configRes.value as any)?.list)
            ? (configRes.value as any).list
            : [];
      publishConfigMap.value = Object.fromEntries(list.map((item: any) => [String(item.id), item]));
    }
    relationDictionaryLoaded.value = true;
  } catch (error) {
    console.warn("[商品列表] 加载关联配置字典失败", error);
  } finally {
    relationDictionaryLoading.value = false;
  }
};

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

// 复制文本（通用）
async function copyText(text: string, label?: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success(`${label || "内容"}已复制到剪贴板`);
  } catch (e) {
    // 降级方案
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    ElMessage.success(`${label || "内容"}已复制到剪贴板`);
  }
}

getList();
loadCategoryList();
async function getList() {
  loading.value = true;
  if (showRelations.value) {
    loadRelationDictionaries();
  }

  let params: any = {
    currentPage: queryParams.currentPage,
    pageSize: queryParams.pageSize,
    includeRelations: showRelations.value,
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
  if (queryParams.sku && String(queryParams.sku).trim()) {
    params.sku = String(queryParams.sku).trim();
  }
  if (queryParams.spu && String(queryParams.spu).trim()) {
    params.spu = String(queryParams.spu).trim();
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
  // 文件夹筛选
  if (queryParams.folderId && String(queryParams.folderId).trim()) {
    params.folderId = String(queryParams.folderId).trim();
  }
  params.random = queryParams.random;

  // 分类筛选
  if (queryParams.categoryId) {
    params.categoryId = queryParams.categoryId;
  }
  // 品牌筛选
  if (queryParams.brand && String(queryParams.brand).trim()) {
    params.brand = String(queryParams.brand).trim();
  }
  // 类型筛选
  if (queryParams.type) {
    params.type = queryParams.type;
  }
  if (queryParams.status) {
    params.status = queryParams.status;
  }
  if (queryParams.inventoryStatus) {
    params.inventoryStatus = queryParams.inventoryStatus;
  }
  // 价格区间
  if (queryParams.priceMin !== undefined && queryParams.priceMin !== null) {
    params.priceMin = queryParams.priceMin;
  }
  if (queryParams.priceMax !== undefined && queryParams.priceMax !== null) {
    params.priceMax = queryParams.priceMax;
  }
  // 精选筛选
  if (queryParams.isFeatured !== undefined && queryParams.isFeatured !== null) {
    params.isFeatured = queryParams.isFeatured;
  }
  if (queryParams.isNew !== undefined && queryParams.isNew !== null) {
    params.isNew = queryParams.isNew;
  }
  if (queryParams.isHot !== undefined && queryParams.isHot !== null) {
    params.isHot = queryParams.isHot;
  }
  if (queryParams.isOnSale !== undefined && queryParams.isOnSale !== null) {
    params.isOnSale = queryParams.isOnSale;
  }
  // 排序
  if (queryParams.sortBy) {
    params.sortBy = queryParams.sortBy;
    params.sortDir = queryParams.sortDir || "DESC";
  }

  try {
    let res = await getProductList(params);
    dataSource.value = res.list || [];
    total.value = res.total || 0;
    ids.value = [];
    nextTick(setupRowDrag);
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
  queryParams.currentPage = 1;
  queryParams.pageSize = 20;
  queryParams.id = "";
  queryParams.code = "";
  queryParams.sku = "";
  queryParams.spu = "";
  queryParams.searchText = "";
  queryParams.search = "";
  queryParams.isPublish = undefined;
  queryParams.random = false;
  queryParams.startTime = "";
  queryParams.endTime = "";
  queryParams.categoryId = "";
  queryParams.brand = "";
  queryParams.type = "";
  queryParams.status = "";
  queryParams.inventoryStatus = "";
  queryParams.priceMin = undefined;
  queryParams.priceMax = undefined;
  queryParams.isFeatured = undefined;
  queryParams.isNew = undefined;
  queryParams.isHot = undefined;
  queryParams.isOnSale = undefined;
  queryParams.sortBy = "";
  queryParams.sortDir = "DESC";
};

// 搜索按钮点击事件
const handleSearch = () => {
  queryParams.currentPage = 1; // 搜索时重置到第一页
  getList();
};

// 处理显示关联信息切换
const handleShowRelationsChange = () => {
  // 列配置会自动更新，因为使用了 computed
  if (showRelations.value) {
    loadRelationDictionaries();
  }
  getList();
};

// 查看产品详情
async function handleViewDetail(row: any) {
  if (!row?.id) {
    ElMessage.warning("产品ID不存在");
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
      pageSize: 1,
    });

    if (res && res.list && res.list.length > 0) {
      productDetail.value = res.list[0];
    } else {
      ElMessage.error("未找到产品详情");
      productDetailVisible.value = false;
    }
  } catch (error: any) {
    console.error("获取产品详情失败:", error);
    ElMessage.error(error?.message || "获取产品详情失败");
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
    .catch(() => {});
}

function handleAdd() {
  isEdit.value = false;
  productEditorAdvancedSections.value = ["operation", "specifications", "multilingual", "system"];
  dialogVisible.value = true;
  dialogTitle.value = "新建商品";
  form.value = {
    code: "",
    name: "",
    enName: "",
    description: "",
    enDescription: "",
    keywords: "",
    enKeywords: "",
    searchKeywords: "",
    enSearchKeywords: "",
    type: "",
    status: "active",
    sku: "",
    spu: "",
    categoryId: "",
    brand: "",
    material: "",
    weight: 0,
    dimensions: "",
    unit: "件",
    barcode: "",
    origin: "",
    costPrice: 0,
    compareAtPrice: 0,
    currency: "CNY",
    inventoryStatus: "in_stock",
    lowStockThreshold: 0,
    minOrderQuantity: 1,
    sort: 0,
    isFeatured: false,
    isNew: false,
    isHot: false,
    isOnSale: false,
    images: [] as string[],
    videos: [] as string[],
    detailImages: [] as string[],
    price: 0,
    salePrice: 0,
    stock: 0,
    specifications: null,
    specificationsText: "",
    attributes: null,
    attributesText: "",
    slug: "",
    seoTitle: "",
    seoDescription: "",
    sourceType: "manual",
    sourceMaterialCodes: "",
    shippingTemplateId: "",
    packageWeight: 0,
    packageLength: 0,
    packageWidth: 0,
    packageHeight: 0,
    tags: "",
    isPublish: false,
    file: null,
  };
  fileList.value = [];
  pendingFiles.value = [];
  videoFileList.value = [];
  pendingVideoFiles.value = [];
  nextTick(() => formRef.value?.clearValidate());
}

function handleEdit(row) {
  currentRow.value = row;
  isEdit.value = true;
  productEditorAdvancedSections.value = ["operation", "specifications", "multilingual", "system"];
  dialogVisible.value = true;
  dialogTitle.value = "编辑商品";
  const images = Array.isArray(row.images) ? row.images : [];
  const videos = Array.isArray(row.videos) ? row.videos : [];
  const detailImages = Array.isArray(row.detailImages) ? row.detailImages : [];
  form.value = {
    ...row,
    type: normalizeProductType(row.type),
    images,
    videos,
    detailImages,
    categoryId: row.categoryId || "",
    status: row.status || "active",
    sku: row.sku || "",
    spu: row.spu || "",
    brand: row.brand || "",
    material: row.material || "",
    weight: Number(row.weight || 0),
    dimensions: row.dimensions || "",
    unit: row.unit || "件",
    barcode: row.barcode || "",
    origin: row.origin || "",
    costPrice: Number(row.costPrice || 0),
    compareAtPrice: Number(row.compareAtPrice || 0),
    currency: row.currency || "CNY",
    inventoryStatus: row.inventoryStatus || "in_stock",
    lowStockThreshold: Number(row.lowStockThreshold || 0),
    minOrderQuantity: Number(row.minOrderQuantity || 1),
    sort: Number(row.sort || 0),
    isFeatured: !!row.isFeatured,
    isNew: !!row.isNew,
    isHot: !!row.isHot,
    isOnSale: !!row.isOnSale,
    price: Number(row.price || 0),
    salePrice: Number(row.salePrice || 0),
    stock: Number(row.stock || 0),
    specificationsText: row.specifications ? JSON.stringify(row.specifications, null, 2) : "",
    attributesText: row.attributes ? JSON.stringify(row.attributes, null, 2) : "",
    slug: row.slug || "",
    seoTitle: row.seoTitle || "",
    seoDescription: row.seoDescription || "",
    sourceType: row.sourceType || "manual",
    sourceMaterialCodes: row.sourceMaterialCodes || "",
    shippingTemplateId: row.shippingTemplateId || "",
    packageWeight: Number(row.packageWeight || 0),
    packageLength: Number(row.packageLength || 0),
    packageWidth: Number(row.packageWidth || 0),
    packageHeight: Number(row.packageHeight || 0),
  };
  if (images.length > 0) {
    fileList.value = images.map((url, index) => ({
      name: `图片${index + 1}`,
      url: url,
    }));
    pendingFiles.value = [];
  } else {
    fileList.value = [];
    pendingFiles.value = [];
  }
  if (videos.length > 0) {
    videoFileList.value = videos.map((url, index) => ({
      name: `视频${index + 1}`,
      url: url,
    }));
    pendingVideoFiles.value = [];
  } else {
    videoFileList.value = [];
    pendingVideoFiles.value = [];
  }
  nextTick(() => formRef.value?.clearValidate());
}

// 处理发布/下架切换
async function handleTogglePublish(row) {
  const action = row.isPublish ? "下架" : "发布";
  try {
    await ElMessageBox.confirm(`确认${action}商品"${row.name}"吗？`, `${action}确认`, {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 调用更新发布状态接口，只传递id和isPublish
    await updatePublishStatus({
      id: row.id,
      isPublish: !row.isPublish,
    });

    ElMessage.success(`${action}成功`);
    getList(); // 重新获取列表
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(`${action}失败`);
    }
  }
}

// 处理发布按钮点击
function handlePublish(row: any) {
  currentPublishRow.value = row;
  publishDialogVisible.value = true;
  // 默认选中主要平台
  selectedPlatforms.value = ["douyin", "kuaishou", "xiaohongshu", "weibo"];
  // 如果有英文字段，默认也选中国际化平台
  if (row.enName || row.enDescription) {
    selectedPlatforms.value.push("tiktok", "youtube");
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
        pageSize: 100,
      });
      // 分离图片和视频
      const drafts = res.list || [];
      drafts.forEach((draft) => {
        if (draft.url) {
          const isVideo =
            draft.suffix &&
            ["mp4", "webm", "avi", "mov", "mkv"].includes(draft.suffix.toLowerCase());
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
  platforms.forEach((platform) => {
    // 判断是否优先使用英文字段
    const isEnPlatform = ["tiktok", "youtube"].includes(platform);

    let title = row?.name || "";
    let content = row?.description || "";

    if (isEnPlatform) {
      title = row.enName && row.enName.trim() ? row.enName : row.name || "";
      content =
        row.enDescription && row.enDescription.trim() ? row.enDescription : row.description || "";
    }

    publishForm.value[platform as keyof PublishForm] = {
      title: title,
      content: content,
      images: images,
      selectedImages: [...images],
      videos: videos,
      selectedVideos: [...videos],
    };
  });
  // 清理未选中的平台
  Object.keys(publishForm.value).forEach((platform) => {
    if (!platforms.includes(platform)) {
      publishForm.value[platform as keyof PublishForm] = null;
    }
  });
}

// 获取平台名称
const getPlatformName = (platform: string) => {
  const platformNames: Record<string, string> = {
    douyin: "抖音",
    xiaohongshu: "小红书",
    weibo: "微博",
    kuaishou: "快手",
    doudian: "抖店",
    kuaishou_shop: "快手小店",
    bilibili: "B站",
    xianyu: "咸鱼",
    tiktok: "TikTok",
    youtube: "YouTube",
  };
  return platformNames[platform] || platform;
};

// 格式化发布结果的message
function formatPublishMessage(result: any) {
  const platformName = getPlatformName(result.platform);
  if (result.data) {
    if (result.data.loginStatus === "not_logged_in") {
      return `${platformName}未登录，请先登录该平台`;
    }
    if (result.data.loginStatus === "error") {
      return `${platformName}接口异常：${result.data.error || result.message || "未知错误"}`;
    }
    if (result.data.loginStatus === "logged_in" && !result.success) {
      return `${platformName}已登录，但发布失败：${result.message || "未知错误"}`;
    }
  }
  return result.message || "未知错误";
}

function getPublishMessageClass(result: any) {
  const loginStatus = result?.data?.loginStatus;
  if (loginStatus === "not_logged_in") {
    return "text-red-400";
  }
  if (loginStatus === "logged_in") {
    return "text-green-400";
  }
  if (loginStatus === "error") {
    return "text-red-400";
  }
  return result?.success ? "text-green-400" : "text-red-400";
}

// 关闭发布弹窗
function publishDialogClose() {
  publishDialogVisible.value = false;
  publishLoading.value = false;
  selectedPlatforms.value = [];
  // 重置所有平台表单为null
  Object.keys(publishForm.value).forEach((platform) => {
    publishForm.value[platform as keyof PublishForm | "kuaishou"] = null;
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
    return ElMessage.warning("商品ID不存在");
  }

  if (selectedPlatforms.value.length === 0) {
    return ElMessage.warning("请至少选择一个发布平台");
  }

  // 验证每个选中平台的表单
  for (const platform of selectedPlatforms.value) {
    const pForm = publishForm.value[platform as keyof PublishForm];
    if (!pForm) continue;

    if (platform !== "weibo" && (!pForm.title || !pForm.content)) {
      return ElMessage.warning(`请完善${getPlatformName(platform)}的发布内容`);
    }
    if (platform === "weibo" && !pForm.content) {
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
    const tasks = selectedPlatforms.value
      .map((platform) => {
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
            manual: true,
          },
        };
      })
      .filter(Boolean);

    // 批量创建任务（使用 allSettled，避免单个失败导致整体中断）
    const settledResults = await Promise.allSettled(
      tasks.map((task) => task && createTask(task as any)),
    );

    const successCount = settledResults.filter((item: any) => {
      if (item.status !== "fulfilled") return false;
      const r = item.value;
      return !!(r?.messageId || r?.id || r?.data?.messageId || r?.data?.id);
    }).length;

    const totalCount = tasks.length;
    const failedCount = Math.max(totalCount - successCount, 0);

    if (successCount === totalCount) {
      ElMessage.success(`成功创建 ${successCount}/${totalCount} 个发布任务，已添加到发布队列`);
      publishDialogVisible.value = false;
    } else if (successCount > 0) {
      ElMessage.warning(
        `部分创建成功：${successCount}/${totalCount} 个发布任务，失败 ${failedCount} 个`,
      );
    } else {
      ElMessage.error(`发布任务创建失败：0/${totalCount}`);
    }
  } catch (error: any) {
    console.error("手动创建发布任务失败:", error);
    ElMessage.error(error?.message || "发布任务创建失败");
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
const videoPreviewRowId = ref<string>("");
const videoPreviewAllowDelete = ref(false);

function handleVideoPreview(list: string[], index: number, row?: any) {
  videoPreviewList.value = list;
  videoPreviewIndex.value = index;
  videoPreviewRowId.value = row?.id || "";
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

const customModelDetailVisible = ref(false);
const customModelDetail = ref<any>(null);

// 关联信息详情弹窗
const relationsDetailVisible = ref(false);
const currentRelationsRow = ref<any>(null);

// 查看源信息相关状态
const relationsSourceInfoVisible = ref(false);
const currentSourceInfoRow = ref<any>(null);
const activeSourceTab = ref("customModel");

async function showCustomModelDetail(id: string) {
  try {
    const res = await getDesignModel({ id });
    customModelDetail.value = res.data || res; // 兼容不同返回结构
    customModelDetailVisible.value = true;
  } catch (e) {
    ElMessage.error("获取模型详情失败");
  }
}

const customModelDraftDialogVisible = ref(false);
const customModelDrafts = ref([]);
const customModelDraftModel = ref<any>(null);

async function showCustomModelDrafts(model) {
  customModelDraftModel.value = model;
  customModelDraftDialogVisible.value = true;
  try {
    const res = await getDraftList({
      customModelId: model.id,
      currentPage: 1,
      pageSize: 100,
    });
    customModelDrafts.value = res.list || [];
  } catch (error) {
    ElMessage.error("获取关联草稿失败");
    customModelDrafts.value = [];
  }
}

const aiGenDialogVisible = ref(false);
const aiGenPrompt = ref("");
const aiGenDialogLoading = ref(false);
const aiGenRow = ref<any>(null);

function onAiProductAutoGenerate(row) {
  if (aiGenDialogLoading.value) return;
  aiGenRow.value = row;
  aiGenPrompt.value = "";
  aiGenDialogVisible.value = true;
}

async function submitAiGenDialog() {
  if (!aiGenRow.value) return;
  aiGenDialogLoading.value = true;
  try {
    const res = await aiGenerateProductInfo({
      id: aiGenRow.value.id,
      prompt: aiGenPrompt.value || "",
    });

    const resultData = unwrapAiTaskResult(res);

    if (isQueuedAiTaskResult(resultData)) {
      notifyQueuedAiTask(resultData);
      aiGenDialogVisible.value = false;
      return;
    }

    if (resultData && resultData.name) {
      aiGenRow.value.name = resultData.name;
      aiGenRow.value.enName = resultData.enName;
      aiGenRow.value.type = resultData.type;
      aiGenRow.value.description = resultData.description;
      aiGenRow.value.enDescription = resultData.enDescription;
      aiGenRow.value.tags = resultData.tags;
      aiGenRow.value.keywords = resultData.keywords;
      aiGenRow.value.enKeywords = resultData.enKeywords;
      aiGenRow.value.searchKeywords = resultData.searchKeywords;
      aiGenRow.value.enSearchKeywords = resultData.enSearchKeywords;
      aiGenRow.value.slug = resultData.slug;
      aiGenRow.value.seoTitle = resultData.seoTitle;
      aiGenRow.value.seoDescription = resultData.seoDescription;
      aiGenRow.value.price = resultData.price;
      aiGenRow.value.salePrice = resultData.salePrice;
      aiGenRow.value.compareAtPrice = resultData.compareAtPrice;
      ElMessage.success("AI自动生成内容成功");
      getList();
    } else {
      ElMessage.error("AI生成内容失败，未返回有效数据");
    }
    aiGenDialogVisible.value = false;
  } catch (e) {
    ElMessage.error("AI自动生成内容失败");
  } finally {
    aiGenDialogLoading.value = false;
    aiGenRow.value = null;
  }
}

// 处理dropdown操作命令
function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case "view-detail":
      handleViewDetail(row);
      break;
    case "edit":
      handleEdit(row);
      break;
    case "delete":
      handleDelete(row);
      break;
    case "mark-published":
      handleUpdatePublishStatus(row, true);
      break;
    case "mark-unpublished":
      handleUpdatePublishStatus(row, false);
      break;
    case "social-publish":
      handlePublish(row);
      break;
    case "ai-generate":
      onAiProductAutoGenerate(row);
      break;
    case "generate-code":
      handleGenerateProductCode(row);
      break;
    case "copy-images-from-psdset":
      handleCopyImagesFromPsdSet(row);
      break;
    default:
      console.warn("未知的操作命令:", command);
  }
}

// 批量发布
async function batchPublish(rows?: any[]) {
  const list = rows && rows.length ? rows : selectedRows.value;
  if (!list || list.length === 0) {
    return ElMessage.warning("请先选择要发布的记录");
  }
  try {
    await ElMessageBox.confirm(`确定将选中的 ${list.length} 条商品标记为发布吗？`, "批量发布确认", {
      confirmButtonText: "确定发布",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return;
  }
  try {
    const tasks = list.map((item) => updatePublishStatus({ id: item.id, isPublish: true }));
    await Promise.all(tasks);
    ElMessage.success(`已发布 ${list.length} 条记录`);
    getList();
  } catch (e) {
    ElMessage.error("批量发布失败，请重试");
  }
}

// 批量下架
async function batchUnpublish(rows?: any[]) {
  const list = rows && rows.length ? rows : selectedRows.value;
  if (!list || list.length === 0) {
    return ElMessage.warning("请先选择要下架的记录");
  }
  try {
    await ElMessageBox.confirm(
      `确定将选中的 ${list.length} 条商品下架吗？下架后商品将不再对外展示。`,
      "批量下架确认",
      {
        confirmButtonText: "确定下架",
        cancelButtonText: "取消",
        type: "warning",
      },
    );
  } catch {
    return;
  }
  try {
    const tasks = list.map((item) => updatePublishStatus({ id: item.id, isPublish: false }));
    await Promise.all(tasks);
    ElMessage.success(`已下架 ${list.length} 条记录`);
    getList();
  } catch (e) {
    ElMessage.error("批量下架失败，请重试");
  }
}

// 处理生成产品代码（统一走后端接口，由后端保证唯一不重复）
async function handleGenerateProductCode(row: any) {
  try {
    const res = await generateProductCode({ id: row.id });
    if (res && res.code) {
      row.code = res.code;
      ElMessage.success("产品代码生成成功");
      getList();
    } else {
      ElMessage.warning("未返回产品代码，请重试");
    }
  } catch (error: any) {
    ElMessage.error(error?.message || "生成产品代码失败");
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
    await ElMessageBox.confirm("确认删除该视频吗？", "删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    deletingVideoKey.value = `${row.id}-${url}`;
    const newVideos = (row.videos || []).filter((v: string) => v !== url);
    await updateProduct({ id: row.id, videos: newVideos });

    // 更新预览列表和索引
    const deletedIndex = videoPreviewList.value.findIndex((v) => v === url);
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

    ElMessage.success("视频已删除");
    getList();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "删除视频失败");
    }
  } finally {
    deletingVideoKey.value = "";
  }
}

// 复制关联 PSD 套图信息到商品
async function handleCopyImagesFromPsdSet(row: any) {
  if (!row?.id) return;
  if (!getProductSourcePsdSetId(row)) {
    return ElMessage.warning("该商品未关联PSD套图");
  }
  try {
    await request.post({
      url: "/product/copy-images-from-psdset",
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
    });
    ElMessage.success("复制成功");
    getList();
  } catch (e) {
    ElMessage.error(e?.message || "复制失败");
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
  const form = publishForm.value[platform as keyof PublishForm | "kuaishou"];
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
  const form = publishForm.value[platform as keyof PublishForm | "kuaishou"];
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
    ElMessage.info("正在准备下载...");

    const result = await downloadImageEnhanced(url, filename, {
      showMessage: false, // 关闭通用方法的console消息，使用我们的ElMessage
      fallbackToNewWindow: true,
    });

    if (result.success) {
      ElMessage.success("下载完成");
    } else if (result.fallback) {
      ElMessage.warning(result.message);
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error("下载失败:", error);
    ElMessage.error("下载失败，请重试");
  }
}

// 批量下载某一行商品的所有图片（列表中“批量下载”按钮）
async function handleDownloadRowImages(row: any) {
  if (!row || !Array.isArray(row.images) || !row.images.length) {
    ElMessage.warning("暂无可下载的商品图片");
    return;
  }

  const images: string[] = row.images.filter((u: any) => typeof u === "string" && u.trim());
  if (!images.length) {
    ElMessage.warning("暂无可下载的商品图片");
    return;
  }

  const baseName = row.name || "商品图片";

  ElMessage.info(`开始下载 ${images.length} 张图片，请稍候...`);

  for (let i = 0; i < images.length; i++) {
    const url = images[i];
    const suffixMatch = url.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
    const ext = suffixMatch ? suffixMatch[1] : "jpg";
    const filename = `${baseName}_${i + 1}.${ext}`;

    try {
      await downloadImageEnhanced(url, filename, {
        showMessage: false,
        fallbackToNewWindow: true,
      });
    } catch (e) {
      console.error("下载单张图片失败:", e);
    }
  }

  ElMessage.success("商品图片批量下载任务已完成");
}

// 预览图片
function preview(index: number, urls: string[]) {
  if (!urls || urls.length === 0) return;
  previewList.value = urls;
  previewIndex.value = Math.max(0, Math.min(index, urls.length - 1));
  previewUrl.value = urls[previewIndex.value] || urls[0];
  previewVisible.value = true;
}

// 获取设计模型的图片列表（用于展示）
function getCustomModelImages(customModel: any): string[] {
  if (!customModel) return [];
  const images: string[] = [];

  // 添加缩略图
  if (
    customModel.thumbnail &&
    typeof customModel.thumbnail === "string" &&
    customModel.thumbnail.trim()
  ) {
    images.push(customModel.thumbnail);
  }

  // 添加其他图片
  if (customModel.images && Array.isArray(customModel.images)) {
    customModel.images.forEach((url: string) => {
      if (url && typeof url === "string" && url.trim() && !images.includes(url)) {
        images.push(url);
      }
    });
  }

  return images;
}

// 获取 PSD 套图的图片列表，兼容数组、逗号分隔字符串、meta.images
function getPsdSetImages(psdSet: any): string[] {
  if (!psdSet) return [];
  // 提取 images 字段（优先），兼容数组/对象数组/字符串
  const normalizeArray = (arr: any[]) =>
    arr
      .map((u) => {
        if (typeof u === "string") return u.trim();
        if (u && typeof u === "object" && typeof u.url === "string") return u.url.trim();
        return "";
      })
      .filter((u) => !!u);

  if (Array.isArray(psdSet.images)) {
    const urls = normalizeArray(psdSet.images);
    if (urls.length) return urls;
  }

  if (typeof psdSet.images === "string") {
    const raw = psdSet.images.trim();
    if ((raw.startsWith("[") && raw.endsWith("]")) || (raw.startsWith("{") && raw.endsWith("}"))) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const urls = normalizeArray(parsed);
          if (urls.length) return urls;
        }
      } catch {
        // ignore and fallback
      }
    }
    const urls = raw
      .split(",")
      .map((u: string) => u.trim())
      .filter((u: string) => u);
    if (urls.length) return urls;
  }

  // 最后一层兜底：meta.images 仅在 images 为空时尝试
  const meta = psdSet.meta || {};
  if (Array.isArray(meta.images)) {
    const urls = normalizeArray(meta.images);
    if (urls.length) return urls;
  }
  if (typeof meta.images === "string") {
    const urls = meta.images
      .split(",")
      .map((u: string) => u.trim())
      .filter((u: string) => u);
    if (urls.length) return urls;
  }

  return [];
}

// 显示关联信息详情
function showRelationsDetail(row: any) {
  currentRelationsRow.value = row;
  relationsDetailVisible.value = true;
}

// 查看源信息
function showRelationsSourceInfo(row: any) {
  currentSourceInfoRow.value = row;
  // 设置默认激活的标签页
  if (row.customModel) {
    activeSourceTab.value = "customModel";
  } else if (row.sticker) {
    activeSourceTab.value = "sticker";
  } else if (row.psdSet) {
    activeSourceTab.value = "psdSet";
  }
  relationsSourceInfoVisible.value = true;
}

// 格式化JSON显示
function formatJSON(obj: any): string {
  if (!obj) return "无数据";
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
}

// 复制源信息
async function copySourceInfo() {
  if (!currentSourceInfoRow.value) return;

  let jsonText = "";
  if (activeSourceTab.value === "customModel" && currentSourceInfoRow.value.customModel) {
    jsonText = JSON.stringify(currentSourceInfoRow.value.customModel, null, 2);
  } else if (activeSourceTab.value === "sticker" && currentSourceInfoRow.value.sticker) {
    jsonText = JSON.stringify(currentSourceInfoRow.value.sticker, null, 2);
  } else if (activeSourceTab.value === "psdSet" && currentSourceInfoRow.value.psdSet) {
    jsonText = JSON.stringify(currentSourceInfoRow.value.psdSet, null, 2);
  }

  if (jsonText) {
    try {
      await navigator.clipboard.writeText(jsonText);
      ElMessage.success("已复制到剪贴板");
    } catch (e) {
      // 降级方案
      const textarea = document.createElement("textarea");
      textarea.value = jsonText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      ElMessage.success("已复制到剪贴板");
    }
  }
}

async function handleUpdatePublishStatus(row: any, isPublish: boolean) {
  try {
    await updatePublishStatus({
      id: row.id,
      isPublish: isPublish,
    });
    ElMessage.success(`发布状态已更新为：${isPublish ? "已发布" : "未发布"}`);
    getList();
  } catch (e) {
    ElMessage.error("更新发布状态失败");
  }
}

// 平台 logo 使用 Iconify API（simple-icons 等），无则用首字 fallback
const PUBLISH_PLATFORM_LOGOS: Record<string, string> = {
  douyin: "https://api.iconify.design/simple-icons/douyin.svg",
  xiaohongshu: "https://api.iconify.design/simple-icons/xiaohongshu.svg",
  weibo: "https://api.iconify.design/simple-icons/sinaweibo.svg",
  kuaishou: "https://api.iconify.design/simple-icons/kuaishou.svg",
  bilibili: "https://api.iconify.design/simple-icons/bilibili.svg",
  zhihu: "https://api.iconify.design/simple-icons/zhihu.svg",
  tiktok: "https://api.iconify.design/simple-icons/tiktok.svg",
  taobao: "https://api.iconify.design/simple-icons/taobao.svg",
  youtube: "https://api.iconify.design/simple-icons/youtube.svg",
  instagram: "https://api.iconify.design/simple-icons/instagram.svg",
  facebook: "https://api.iconify.design/simple-icons/facebook.svg",
  twitter: "https://api.iconify.design/simple-icons/twitter.svg",
  wechat: "https://api.iconify.design/simple-icons/wechat.svg",
};

// 发布平台选项（任务类型命名：{action}-{object}-{platform}，便于任务队列查询）
const publishPlatforms = [
  {
    label: "抖音",
    value: "douyin",
    icon: "抖",
    color: "#000000",
    logoUrl: PUBLISH_PLATFORM_LOGOS.douyin,
  },
  {
    label: "小红书",
    value: "xiaohongshu",
    icon: "红",
    color: "#FF2442",
    logoUrl: PUBLISH_PLATFORM_LOGOS.xiaohongshu,
  },
  {
    label: "微博",
    value: "weibo",
    icon: "微",
    color: "#E6162D",
    logoUrl: PUBLISH_PLATFORM_LOGOS.weibo,
  },
  {
    label: "快手",
    value: "kuaishou",
    icon: "快",
    color: "#FF6600",
    logoUrl: PUBLISH_PLATFORM_LOGOS.kuaishou,
  },
  { label: "抖店", value: "doudian", icon: "店", color: "#2F54EB", logoUrl: undefined },
  { label: "快手小店", value: "kuaishou_shop", icon: "店", color: "#FA8C16", logoUrl: undefined },
  {
    label: "B站",
    value: "bilibili",
    icon: "B",
    color: "#FB7299",
    logoUrl: PUBLISH_PLATFORM_LOGOS.bilibili,
  },
  {
    label: "知乎",
    value: "zhihu",
    icon: "知",
    color: "#0084FF",
    logoUrl: PUBLISH_PLATFORM_LOGOS.zhihu,
  },
  {
    label: "TikTok",
    value: "tiktok",
    icon: "T",
    color: "#000000",
    logoUrl: PUBLISH_PLATFORM_LOGOS.tiktok,
  },
  { label: "Temu", value: "temu", icon: "T", color: "#FF6B35", logoUrl: undefined },
  {
    label: "淘宝",
    value: "taobao",
    icon: "淘",
    color: "#FF4400",
    logoUrl: PUBLISH_PLATFORM_LOGOS.taobao,
  },
  {
    label: "YouTube",
    value: "youtube",
    icon: "Y",
    color: "#FF0000",
    logoUrl: PUBLISH_PLATFORM_LOGOS.youtube,
  },
  {
    label: "Instagram",
    value: "instagram",
    icon: "I",
    color: "#E4405F",
    logoUrl: PUBLISH_PLATFORM_LOGOS.instagram,
  },
  {
    label: "Facebook",
    value: "facebook",
    icon: "F",
    color: "#1877F2",
    logoUrl: PUBLISH_PLATFORM_LOGOS.facebook,
  },
  {
    label: "Twitter",
    value: "twitter",
    icon: "T",
    color: "#1DA1F2",
    logoUrl: PUBLISH_PLATFORM_LOGOS.twitter,
  },
  {
    label: "视频号",
    value: "wechat_channels",
    icon: "视",
    color: "#07C160",
    logoUrl: PUBLISH_PLATFORM_LOGOS.wechat,
  },
  { label: "百家号", value: "baijiahao", icon: "百", color: "#105BFD", logoUrl: undefined },
  { label: "咸鱼", value: "xianyu", icon: "咸", color: "#FFDA44", logoUrl: undefined },
  { label: "京东", value: "jd", icon: "京", color: "#E4393C", logoUrl: undefined },
  { label: "拼多多", value: "pinduoduo", icon: "拼", color: "#E02E24", logoUrl: undefined },
  { label: "今日头条", value: "toutiao", icon: "头", color: "#ED4040", logoUrl: undefined },
  { label: "大鱼号", value: "dayu", icon: "大", color: "#3A76D2", logoUrl: undefined },
  { label: "企鹅号", value: "penguin", icon: "企", color: "#2783F4", logoUrl: undefined },
  { label: "搜狐号", value: "sohu", icon: "搜", color: "#FFC335", logoUrl: undefined },
  { label: "网易号", value: "netease", icon: "网", color: "#D22923", logoUrl: undefined },
  { label: "度小视", value: "duxiaoshi", icon: "度", color: "#33BEFF", logoUrl: undefined },
  { label: "美拍", value: "meipai", icon: "美", color: "#FF547D", logoUrl: undefined },
  { label: "秒拍", value: "miaopai", icon: "秒", color: "#FFD705", logoUrl: undefined },
  { label: "A站", value: "acfun", icon: "A", color: "#FD4C5D", logoUrl: undefined },
  { label: "西瓜视频", value: "xigua", icon: "西", color: "#FE3059", logoUrl: undefined },
  { label: "好看视频", value: "haokan", icon: "好", color: "#EE3333", logoUrl: undefined },
  { label: "全民小视频", value: "quanmin", icon: "全", color: "#FD3756", logoUrl: undefined },
];

// 格式化平台名称
function formatPlatformName(platform: string) {
  const platformMap: Record<string, string> = {
    douyin: "抖音",
    xiaohongshu: "小红书",
    weibo: "微博",
    kuaishou: "快手",
    bilibili: "B站",
    zhihu: "知乎",
    tiktok: "TikTok",
    temu: "Temu",
    taobao: "淘宝",
    youtube: "YouTube",
    instagram: "Instagram",
    facebook: "Facebook",
    twitter: "Twitter",
    wechat_channels: "视频号",
    baijiahao: "百家号",
    xianyu: "咸鱼",
    jd: "京东",
    pinduoduo: "拼多多",
    toutiao: "今日头条",
    dayu: "大鱼号",
    penguin: "企鹅号",
    sohu: "搜狐号",
    netease: "网易号",
    duxiaoshi: "度小视",
    meipai: "美拍",
    miaopai: "秒拍",
    acfun: "A站",
    xigua: "西瓜视频",
    haokan: "好看视频",
    quanmin: "全民小视频",
  };
  return platformMap[platform] || platform;
}

// 任务类型命名：{action}-{object}-{platform}，便于任务队列按平台查询
function getPublishTaskType(platform: string) {
  return `publish-product-${platform}`;
}
</script>

<style lang="less">
.product-page.list-page-layout {
  gap: 10px;
  padding: 8px 0 0;
}

.product-page .list-page-layout__body,
.product-page .list-page-layout__main {
  gap: 10px;
}

.product-page__filter {
  gap: 10px;
  padding-bottom: 10px;
}

.product-page__actions {
  justify-content: flex-start;
}

.product-page__switch {
  display: flex;
  min-height: 28px;
  align-items: center;
}

.product-page__sidebar {
  position: relative;
  min-height: 100%;
}

.product-page__sidebar-body {
  padding: 0;
}

.product-page__sidebar-tree {
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.product-page__table-wrap {
  background: transparent;
}

.product-page__table-body {
  padding: 0;
  overflow: hidden;
}

.product-page__pagination {
  padding-top: 0;
}

.product-page .list-page-table-panel__pagination--flat {
  padding-top: 10px;
}

@media (max-width: 1024px) {
  .product-page__sidebar-body {
    padding-bottom: 28px;
  }
}

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
      box-shadow:
        0 0 0 4px var(--el-color-primary),
        0 6px 20px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
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
      box-shadow:
        0 0 0 4px var(--el-color-primary),
        0 3px 12px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
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
  color: var(--el-color-primary) !important;
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

.relation-source-card {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 10px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.relation-source-row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  line-height: 1.5;
}

.relation-source-label {
  flex: 0 0 auto;
  color: var(--el-text-color-secondary);
}

.relation-source-value {
  min-width: 0;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  text-shadow: 0 1px 2px color-mix(in srgb, var(--el-color-primary) 10%, transparent);
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
  font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", "source-code-pro", monospace;
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
  :deep(.el-dialog__header) {
    height: 52px;
    padding: 14px 18px;
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__title) {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  :deep(.el-dialog__headerbtn) {
    top: 4px;
  }

  .el-dialog__body {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 104px);
    padding: 0;
    background: var(--el-bg-color);
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
    padding: 14px 18px 18px;

    // 自定义滚动条样式
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
      border-radius: 999px;

      &:hover {
        background: var(--el-text-color-placeholder);
      }
    }
  }

  .el-dialog__footer {
    flex-shrink: 0;
    padding: 10px 18px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  // 产品信息列表样式
  .product-info-list {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .product-info-item {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr);
    min-height: 34px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:nth-child(3),
    &:nth-child(4),
    &:nth-child(14),
    &:nth-child(15),
    &:nth-child(16),
    &:nth-child(17),
    &:nth-child(18),
    &:nth-child(19),
    &:nth-child(20),
    &:nth-child(21) {
      grid-column: span 2;
    }

    .product-info-label {
      min-width: 0;
      padding: 7px 10px 7px 0;
      font-size: 12px;
      line-height: 20px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
    }

    .product-info-value {
      min-width: 0;
      padding: 7px 12px 7px 0;
      font-size: 13px;
      line-height: 20px;
      color: var(--el-text-color-regular);
      word-break: break-word;
    }
  }

  // 产品详情 section 样式
  .product-detail-section {
    padding: 12px 0 14px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .product-detail-section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 10px;
    padding: 0;
    border-bottom: 0;

    .el-icon {
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }

  .product-detail-section-title.flex {
    min-height: 28px;
  }

  .product-detail-section-title :deep(.el-button) {
    padding: 0;
  }

  .relations-info {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .relation-card {
    display: flex;
    min-width: 0;
    min-height: 132px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    background: var(--el-fill-color-extra-light);
  }

  .relation-card--wide {
    grid-column: 1 / -1;
  }

  .relation-card__media {
    display: flex;
    width: 132px;
    min-height: 132px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-right: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
  }

  .relation-card__image {
    width: 112px;
    height: 112px;
    border-radius: 4px;
    background: var(--el-fill-color-light);
  }

  .relation-card__body {
    min-width: 0;
    flex: 1;
    padding: 12px;
  }

  .relation-card__head {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .relation-card__type {
    flex-shrink: 0;
    padding: 2px 7px;
    border-radius: 4px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-size: 12px;
    line-height: 18px;
  }

  .relation-card__title {
    min-width: 0;
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
    line-height: 22px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .relation-card__fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 14px;
  }

  .relation-card__field {
    min-width: 0;

    span {
      display: block;
      margin-bottom: 2px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      line-height: 18px;
    }

    strong {
      display: block;
      min-width: 0;
      color: var(--el-text-color-regular);
      font-size: 13px;
      font-weight: 400;
      line-height: 20px;
      word-break: break-word;
    }
  }

  .relation-card__gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .relation-card__gallery-image,
  .relation-card__more {
    width: 86px;
    height: 86px;
    border-radius: 4px;
    background: var(--el-bg-color);
  }

  .relation-card__more {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed var(--el-border-color);
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .relation-card__empty {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
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
        box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
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

  .relations-detail-content,
  .relations-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }

  .relation-section-item {
    min-width: 0;
  }

  .relation-header {
    display: flex;
    align-items: center;
    height: 24px;
    margin-bottom: 6px;
  }

  .relation-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }

  .relation-sub-grid {
    width: 100%;
    min-height: 156px;
  }

  .relation-sub-grid :deep(.vxe-table--header-wrapper),
  .relation-sub-grid :deep(.vxe-table--header),
  .relation-sub-grid :deep(.vxe-header--row) {
    min-height: 38px !important;
  }

  .relation-sub-grid :deep(.relation-sub-grid__header) {
    height: 38px !important;
    background: var(--el-fill-color-extra-light);
  }

  .relation-sub-grid :deep(.relation-sub-grid__header .vxe-cell) {
    min-height: 38px !important;
    line-height: 18px !important;
    padding-top: 9px !important;
    padding-bottom: 9px !important;
    font-size: 12px;
    font-weight: 600;
    white-space: normal;
  }

  .relation-sub-grid :deep(.relation-sub-grid__cell) {
    height: 78px;
    padding-top: 6px;
    padding-bottom: 6px;
    vertical-align: middle;
  }

  .relation-thumb-image {
    width: 64px;
    height: 64px;
    border-radius: 4px;
    background: var(--el-fill-color-extra-light);
  }

  .relation-thumb-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 68px;
    height: 68px;
  }

  @media (max-width: 1280px) {
    .product-info-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 768px) {
    .product-info-list,
    .product-info-item {
      display: block;
    }

    .product-info-item {
      padding: 7px 0;
    }

    .product-info-item .product-info-label,
    .product-info-item .product-info-value {
      padding: 0;
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
        font-family: "JetBrains Mono", "Fira Code", monospace;
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
            background: var(--el-color-primary);
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

.product-editor-dialog {
  .el-dialog__header {
    margin: 0;
    padding: 12px 18px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-dialog__title {
    font-size: 15px;
    font-weight: 600;
  }

  .el-dialog__headerbtn {
    top: 2px;
  }

  .el-dialog__body {
    display: block;
    height: calc(100vh - 104px);
    padding: 0;
    overflow: hidden;
  }

  .el-dialog__footer {
    padding: 9px 18px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.product-editor-shell {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 6px;
    background: var(--el-border-color);
  }
}

.product-editor-form {
  width: 100%;

  .el-form-item {
    margin-bottom: 12px;
  }

  .el-form-item__label {
    padding-right: 10px;
  }

  .el-input-number {
    width: 100%;
  }
}

.product-editor-section {
  padding: 0;
  border: 0;
}

.product-editor-section--primary {
  padding: 0;
  border: 0;
}

.product-editor-section--advanced {
  padding: 0;

  > .product-editor-section__header {
    display: none;
  }
}

.product-editor-section__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0 12px;

  &::after {
    content: "";
    flex: 1;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .el-tag {
    display: none;
  }
}

.product-editor-section__title {
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.product-editor-section__meta {
  display: none;
}

.product-editor-switches {
  display: flex;
  min-height: 30px;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 16px;
}

.product-editor-advanced {
  border-top: 0;
  border-bottom: 0;

  .el-collapse-item__header {
    height: 32px;
    min-height: 32px;
    padding: 0;
    border-bottom: 0;
    color: var(--el-text-color-regular);
    font-size: 13px;
    pointer-events: none;
  }

  .el-collapse-item__wrap {
    border-bottom: 0;
  }

  .el-collapse-item__content {
    padding: 0;
  }

  .el-collapse-item__arrow {
    display: none;
  }
}

.product-editor-collapse-title {
  display: flex;
  min-width: 0;
  width: 100%;
  align-items: center;
  gap: 10px;

  &::after {
    content: "";
    flex: 1;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  span {
    font-weight: 600;
    white-space: nowrap;
  }

  small {
    display: none;
  }
}

.product-editor-field-hint {
  display: none;
}

.product-editor-footer {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .product-editor-shell {
    padding: 10px 8px 18px;
  }

  .product-editor-form {
    .el-form-item__label {
      width: 88px !important;
    }

    .el-form-item__content {
      margin-left: 88px !important;
    }
  }
}
</style>
