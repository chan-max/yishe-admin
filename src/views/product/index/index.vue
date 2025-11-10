<template>
  <div>
    <div class="py-4 flex justify-between gap-4 items-center">
      <!-- 导出按钮 -->
      <div style="flex: 1"></div>
      <form-item label="按名称搜索">
        <el-input
          v-model="queryParams.name"
          clearable
          placeholder="请输入名称"
          style="width: 160px"
        />
      </form-item>
      <form-item label="发布状态">
        <el-select
          v-model="queryParams.publishStatus"
          clearable
          placeholder="全部"
          style="width: 160px"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="草稿" value="draft" />
          <el-option label="待发布社交媒体" value="pending_social_media" />
          <el-option label="已发布社交媒体" value="published_social_media" />
          <el-option label="已归档" value="archived" />
        </el-select>
      </form-item>
      <el-button type="primary" @click="handleSearch" :icon="Search"> 搜索 </el-button>

      <div class="shrink-0">
        <!-- 修改按钮 -->
        <el-button type="primary" :disabled="single" @click="handleAdd" :icon="Plus">
          新增
        </el-button>
        <!-- 删除按钮 -->
        <el-button type="danger" :icon="Delete" @click="handleDelete(null)">
          批量删除
        </el-button>
      </div>
    </div>

    <!-- 表格展示 -->
    <div class="common-table">
      <vxe-grid
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
        @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange"
      >

        <template #operationDefaultSlot="{ row }">
          <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)" class="operation-dropdown">
            <el-button type="primary" link size="small">
              操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu class="operation-menu-compact">
                <!-- 基础操作 -->
                <el-dropdown-item command="edit">
                  <el-icon><Edit /></el-icon>
                  <span>编辑</span>
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <el-icon><Delete /></el-icon>
                  <span>删除</span>
                </el-dropdown-item>
                
                <!-- 发布状态（商品） -->
                <el-dropdown-item divided command="mark-draft">
                  <el-icon><Refresh /></el-icon>
                  <span>标记为草稿</span>
                </el-dropdown-item>
                <el-dropdown-item command="mark-pending">
                  <el-icon><Upload /></el-icon>
                  <span>标记为待发布社交媒体</span>
                </el-dropdown-item>
                <el-dropdown-item command="mark-published">
                  <el-icon><Share /></el-icon>
                  <span>标记为已发布社交媒体</span>
                </el-dropdown-item>
                <el-dropdown-item command="mark-archived">
                  <el-icon><Delete /></el-icon>
                  <span>标记为已归档</span>
                </el-dropdown-item>

                <!-- 工具类 -->
                <el-dropdown-item command="ai-generate" divided>
                  <el-icon><MagicStick /></el-icon>
                  <span>AI生成内容</span>
                </el-dropdown-item>
                <el-dropdown-item command="generate-code">
                  <el-icon><Refresh /></el-icon>
                  <span>生成产品代码</span>
                </el-dropdown-item>
                <el-dropdown-item 
                  command="copy-images-from-2d" 
                  :disabled="!row.productImage2DId"
                  divided
                >
                  <el-icon><Upload /></el-icon>
                  <span>复制关联二维模型信息到商品</span>
                </el-dropdown-item>
                <el-dropdown-item 
                  command="copy-images-from-sticker" 
                  :disabled="!row.stickerId"
                >
                  <el-icon><Picture /></el-icon>
                  <span>复制关联贴纸信息到商品</span>
                </el-dropdown-item>
                <el-dropdown-item 
                  command="copy-images-from-custom-model" 
                  :disabled="!row.customModelId"
                >
                  <el-icon><Box /></el-icon>
                  <span>复制关联设计模型信息到商品</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <template #urlDefaultSlot="{ row }">
          <div class="flex items-center gap-2">
            <el-carousel 
              v-if="row.images && row.images.length > 0"
              :interval="3000"
              height="120px"
              indicator-position="none"
              :arrow="row.images.length > 1 ? 'always' : 'never'"
              class="w-48 custom-carousel"
            >
              <el-carousel-item v-for="(url, index) in row.images" :key="index">
                <el-image 
                  :src="url"
                  :preview-src-list="row.images"
                  :initial-index="index"
                  :preview-teleported="true"
                  :hide-on-click-modal="false"
                  :preview-class="'custom-image-preview'"
                  class="w-full h-full object-cover rounded cursor-pointer"
                  fit="cover"
                />
                <div class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
                  {{ index + 1 }}/{{ row.images.length }}
                </div>
              </el-carousel-item>
            </el-carousel>
            <span v-else class="text-gray-400">暂无图片</span>
          </div>
        </template>

        <template #videoDefaultSlot="{ row }">
          <div class="flex items-center gap-2">
            <el-carousel 
              v-if="row.videos && row.videos.length > 0"
              :interval="3000"
              height="120px"
              indicator-position="none"
              :arrow="row.videos.length > 1 ? 'always' : 'never'"
              class="w-48 custom-carousel"
            >
              <el-carousel-item v-for="(url, index) in row.videos" :key="index">
                <div class="relative cursor-pointer w-full h-full" @click="handleVideoPreview(row.videos, index)">
                  <video :src="url" class="w-full h-full object-cover rounded" muted preload="metadata" />
                  <div class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
                    {{ index + 1 }}/{{ row.videos.length }}
                  </div>
                </div>
              </el-carousel-item>
            </el-carousel>
            <span v-else class="text-gray-400">暂无视频</span>
          </div>
        </template>

        <template #publishStatusSlot="{ row }">
          <el-tag :type="row.publishStatus === 'published_social_media' ? 'success' : (row.publishStatus === 'pending_social_media' ? 'warning' : (row.publishStatus === 'archived' ? 'danger' : 'info'))" size="small">
            {{ row.publishStatus === 'published_social_media' ? '已发布社交媒体' : row.publishStatus === 'pending_social_media' ? '待发布社交媒体' : row.publishStatus === 'archived' ? '已归档' : '草稿' }}
          </el-tag>
        </template>

        <template #codeSlot="{ row }">
          <el-tag v-if="row.code" type="info" size="small">
            {{ row.code }}
          </el-tag>
          <span v-else class="text-gray-400 text-xs">未生成</span>
        </template>

        <!-- 关联信息列：显示关联了哪个内容 -->
        <template #relationsSlot="{ row }">
          <div class="relations-summary">
            <div v-if="row.customModel || row.sticker || row.productImage2D" class="relations-info">
              <!-- 设计模型 -->
              <div v-if="row.customModel" class="relation-section-item">
                <div class="relation-header">
                  <span class="relation-label">设计模型：</span>
                </div>
                <vxe-grid
                  :data="[row.customModel]"
                  :show-header="true"
                  border
                  size="mini"
                  class="relation-sub-grid"
                  :columns="[
                    { field: 'thumbnail', title: '缩略图', width: 120, slots: { default: 'customModelThumbnailSlot' } },
                    { field: 'name', title: '名称', minWidth: 100, showOverflow: true },
                    { field: 'description', title: '描述', minWidth: 120, showOverflow: true },
                    { field: 'keywords', title: '关键词', minWidth: 100, showOverflow: true },
                    { field: 'updateTime', title: '更新时间', width: 140, slots: { default: 'customModelUpdateTimeSlot' } }
                  ]"
                >
                  <template #customModelThumbnailSlot="{ row: modelRow }">
                    <div class="flex items-center justify-center p-1">
                      <el-image
                        v-if="modelRow.thumbnail"
                        :src="modelRow.thumbnail"
                        :preview-src-list="getCustomModelImages(modelRow)"
                        :initial-index="0"
                        :preview-teleported="true"
                        :hide-on-click-modal="false"
                        class="relation-thumb-image"
                        fit="contain"
                      />
                      <span v-else class="text-gray-400 text-xs">无</span>
                    </div>
                  </template>
                  <template #customModelUpdateTimeSlot="{ row: modelRow }">
                    <span class="text-xs">{{ modelRow.updateTime ? (modelRow.updateTime + '').replace('T', ' ').slice(0, 19) : '无' }}</span>
                  </template>
                </vxe-grid>
              </div>
              
              <!-- 贴纸 -->
              <div v-if="row.sticker" class="relation-section-item">
                <div class="relation-header">
                  <span class="relation-label">贴纸：</span>
                </div>
                <vxe-grid
                  :data="[row.sticker]"
                  :show-header="true"
                  border
                  size="mini"
                  class="relation-sub-grid"
                  :columns="[
                    { field: 'url', title: '图片', width: 120, slots: { default: 'stickerImageSlot' } },
                    { field: 'name', title: '名称', minWidth: 100, showOverflow: true },
                    { field: 'description', title: '描述', minWidth: 120, showOverflow: true },
                    { field: 'keywords', title: '关键词', minWidth: 100, showOverflow: true },
                    { field: 'suffix', title: '后缀', width: 60 },
                    { field: 'updateTime', title: '更新时间', width: 140, slots: { default: 'stickerUpdateTimeSlot' } }
                  ]"
                >
                  <template #stickerImageSlot="{ row: stickerRow }">
                    <div class="flex items-center justify-center p-1">
                      <el-image
                        v-if="stickerRow.url"
                        :src="stickerRow.url"
                        :preview-src-list="[stickerRow.url]"
                        :initial-index="0"
                        :preview-teleported="true"
                        :hide-on-click-modal="false"
                        class="relation-thumb-image"
                        fit="contain"
                      />
                      <span v-else class="text-gray-400 text-xs">无</span>
                    </div>
                  </template>
                  <template #stickerUpdateTimeSlot="{ row: stickerRow }">
                    <span class="text-xs">{{ stickerRow.updateTime ? (stickerRow.updateTime + '').replace('T', ' ').slice(0, 19) : '无' }}</span>
                  </template>
                </vxe-grid>
              </div>
              
              <!-- 二维产品图 -->
              <div v-if="row.productImage2D" class="relation-section-item">
                <div class="relation-header">
                  <span class="relation-label">二维产品图：</span>
                </div>
                <vxe-grid
                  :data="[row.productImage2D]"
                  :show-header="true"
                  border
                  size="mini"
                  class="relation-sub-grid"
                  :columns="[
                    { field: 'image1', title: '图片', width: 120, slots: { default: 'productImage2DImageSlot' } },
                    { field: 'name', title: '名称', minWidth: 100, showOverflow: true },
                    { field: 'description', title: '描述', minWidth: 120, showOverflow: true },
                    { field: 'keywords', title: '关键词', minWidth: 100, showOverflow: true },
                    { field: 'updateTime', title: '更新时间', width: 140, slots: { default: 'productImage2DUpdateTimeSlot' } }
                  ]"
                >
                  <template #productImage2DImageSlot="{ row: productRow }">
                    <div class="flex items-center justify-center p-1">
                      <el-image
                        v-if="productRow.image1"
                        :src="productRow.image1"
                        :preview-src-list="getProductImage2DPreviewList(productRow)"
                        :initial-index="0"
                        :preview-teleported="true"
                        :hide-on-click-modal="false"
                        class="relation-thumb-image"
                        fit="contain"
                      />
                      <span v-else class="text-gray-400 text-xs">无</span>
                    </div>
                  </template>
                  <template #productImage2DUpdateTimeSlot="{ row: productRow }">
                    <span class="text-xs">{{ productRow.updateTime ? (productRow.updateTime + '').replace('T', ' ').slice(0, 19) : '无' }}</span>
                  </template>
                </vxe-grid>
              </div>
              
              <div class="relation-actions">
                <el-button 
                  type="primary" 
                  link 
                  size="small" 
                  @click="showRelationsDetail(row)"
                  class="relation-detail-btn"
                >
                  查看详情
                </el-button>
                <el-button 
                  type="info" 
                  link 
                  size="small" 
                  @click="showRelationsSourceInfo(row)"
                  class="relation-source-btn"
                >
                  查看源信息
                </el-button>
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
      <pagination
        :total="total"
        v-model:page="queryParams.currentPage"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="100%"
      :fullscreen="true"
      @close="dialogClose"
      align-center
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="商品类型" prop="type">
              <el-input v-model="form.type" placeholder="请输入商品类型" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="商品描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入商品描述" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="关键词" prop="keywords">
              <el-input v-model="form.keywords" placeholder="请输入关键词，多个关键词用逗号分隔" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="搜索关键字" prop="searchKeywords">
              <el-input 
                v-model="form.searchKeywords" 
                type="textarea" 
                :rows="3" 
                placeholder="请输入搜索关键字，逗号分隔，用于优化搜索功能。例如：黄色,体恤,T恤,短袖,卡通,动物,男款,童装,纯棉,休闲,日常,聚会,可爱,儿童,上衣" 
              />
              <div class="text-xs text-gray-500 mt-1">
                提示：建议包含商品名称、颜色、材质、风格、适用人群、使用场合等相关词汇，提高搜索命中率
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="商品价格" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="促销价格" prop="salePrice">
              <el-input-number v-model="form.salePrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="库存" prop="stock">
              <el-input-number v-model="form.stock" :min="0" :precision="0" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="商品规格" prop="specifications">
              <el-input v-model="form.specifications" placeholder="请输入商品规格" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="商品标签" prop="tags">
              <el-input v-model="form.tags" placeholder="请输入商品标签，多个标签用逗号分隔" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="是否绝版" prop="isLimitedEdition">
              <el-switch
                v-model="form.isLimitedEdition"
                :active-value="1"
                :inactive-value="0"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="商品番号" prop="code">
              <el-input v-model="form.code" placeholder="留空则自动生成" />
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
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
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
        
        <h3 class="text-base font-medium my-2">选择发布平台</h3>
        
        <!-- 平台选择 -->
        <el-checkbox-group v-model="selectedPlatforms" class="mb-4">
          <el-checkbox label="douyin">抖音</el-checkbox>
          <el-checkbox label="xiaohongshu">小红书</el-checkbox>
          <el-checkbox label="weibo">微博</el-checkbox>
          <el-checkbox label="kuaishou">快手</el-checkbox>
        </el-checkbox-group>
        
        <!-- 平台表单 -->
        <div class="platform-grid">
          <div v-for="platform in selectedPlatforms" :key="platform" class="platform-item">
            <el-card class="platform-form-compact" shadow="hover">
              <template #header>
                <div class="flex items-center">
                  <span class="text-base font-medium">{{ getPlatformName(platform) }}</span>
                </div>
              </template>
              <!-- 只在表单已初始化时渲染 -->
              <el-form v-if="publishForm[platform]" :model="publishForm[platform]" label-width="60px" size="small" :data-platform="platform">
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
                      :class="{ 'selected': publishForm[platform].selectedImages.includes(url) }"
                      @click="toggleImageSelection(platform, url)"
                    >
                      <img 
                        :src="url"
                        class="w-20 h-20 object-cover rounded transition-all duration-200"
                        @click.stop="preview(index, publishForm[platform].images)"
                      />
                      <div class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
                        {{ index + 1 }}/{{ publishForm[platform].images.length }}
                      </div>
                      <div class="absolute top-1 right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-md">
                        <el-icon v-if="publishForm[platform].selectedImages.includes(url)" class="text-blue-600 text-xs check-icon">
                          <Check />
                        </el-icon>
                      </div>
                    </div>
                  </div>
                </el-form-item>
                
                <el-form-item label="商品视频" v-if="publishForm[platform].videos && publishForm[platform].videos.length > 0">
                  <div class="flex flex-wrap gap-1">
                    <div 
                      v-for="(url, index) in publishForm[platform].videos" 
                      :key="index" 
                      class="relative cursor-pointer select-item-compact"
                      :class="{ 'selected': publishForm[platform].selectedVideos.includes(url) }"
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
                          <div class="w-6 h-6 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                            <el-icon class="text-white text-xs"><VideoPlay /></el-icon>
                          </div>
                        </div>
                        <div class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
                          {{ index + 1 }}/{{ publishForm[platform].videos.length }}
                        </div>
                      </div>
                      <div class="absolute top-1 right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-md">
                        <el-icon v-if="publishForm[platform].selectedVideos.includes(url)" class="text-blue-600 text-xs check-icon">
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
    <el-dialog
      title="发布结果"
      v-model="publishResultVisible"
      width="900px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      align-center
    >
      <div class="p-4 publish-result-dark-bg">
        <div v-if="publishResults.length > 0">
          <div class="flex flex-wrap gap-4 mb-4">
            <div v-for="result in publishResults" :key="result.platform" class="publish-result-card">
              <div class="flex items-center justify-between p-3 rounded-lg border publish-result-dark-item"
                   :class="{
                     'border-green-400 bg-green-900 bg-opacity-80': result.success,
                     'border-red-400 bg-red-900 bg-opacity-80': !result.success
                   }">
                <div class="flex items-center">
                  <div class="w-3 h-3 rounded-full mr-2"
                       :class="{
                         'bg-green-400': result.success,
                         'bg-red-400': !result.success
                       }"></div>
                  <span class="font-medium text-gray-100">{{ getPlatformName(result.platform) }}</span>
                </div>
                <div class="text-right ml-2">
                  <div class="font-medium"
                       :class="{
                         'text-green-400': result.success,
                         'text-red-400': !result.success
                       }">
                    {{ result.success ? '发布成功' : '发布失败' }}
                  </div>
                  <div class="text-xs text-gray-300 mt-1 max-w-[180px] break-words">{{ result.message }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 总体结果 -->
          <div class="mt-4 p-3 rounded-lg border publish-result-dark-item"
               :class="{
                 'border-green-400 bg-green-900 bg-opacity-80': publishSummary.success,
                 'border-yellow-400 bg-yellow-900 bg-opacity-80': publishSummary.partial,
                 'border-red-400 bg-red-900 bg-opacity-80': publishSummary.failed
               }">
            <div class="text-center">
              <div class="font-medium"
                   :class="{
                     'text-green-400': publishSummary.success,
                     'text-yellow-400': publishSummary.partial,
                     'text-red-400': publishSummary.failed
                   }">
                {{ publishSummary.message }}
              </div>
              <div class="text-sm text-gray-300 mt-1">
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

    <!-- 复制二维模型信息配置对话框 -->
    <el-dialog
      v-model="copy2DDialogVisible"
      title="复制关联二维模型信息到商品"
      width="700px"
      :before-close="handleCloseCopy2DDialog"
      align-center
      destroy-on-close
    >
      <el-form
        :model="copy2DForm"
        label-width="140px"
        label-position="left"
      >
        <!-- 基本信息复制 -->
        <el-divider content-position="left">基本信息复制</el-divider>
        <el-form-item label="复制基本信息">
          <el-switch
            v-model="copy2DForm.copyBasicInfo.enabled"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        
        <template v-if="copy2DForm.copyBasicInfo.enabled">
          <el-form-item label="复制名称">
            <el-switch v-model="copy2DForm.copyBasicInfo.copyName" />
          </el-form-item>
          <el-form-item label="复制描述">
            <el-switch v-model="copy2DForm.copyBasicInfo.copyDescription" />
          </el-form-item>
          <el-form-item label="复制关键词">
            <el-switch v-model="copy2DForm.copyBasicInfo.copyKeywords" />
          </el-form-item>
        </template>

        <!-- 水印配置 -->
        <el-divider content-position="left">水印配置</el-divider>
        <el-form-item label="启用水印">
          <el-switch
            v-model="copy2DForm.watermark.enabled"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        
        <template v-if="copy2DForm.watermark.enabled">
          <el-form-item label="水印文字">
            <el-input
              v-model="copy2DForm.watermark.text"
              placeholder="留空则使用产品代码"
              clearable
            />
            <div class="text-xs text-gray-400 mt-1">留空则自动使用产品代码</div>
          </el-form-item>
          
          <el-form-item label="水印位置">
            <el-select v-model="copy2DForm.watermark.position" style="width: 100%">
              <el-option label="右下角" value="bottom-right" />
              <el-option label="右上角" value="top-right" />
              <el-option label="左下角" value="bottom-left" />
              <el-option label="左上角" value="top-left" />
              <el-option label="居中" value="center" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="字体颜色">
            <el-color-picker v-model="copy2DForm.watermark.fontColor" />
          </el-form-item>
          
          <el-form-item label="透明度">
            <el-slider
              v-model="copy2DForm.watermark.opacity"
              :min="0"
              :max="1"
              :step="0.1"
              :format-tooltip="(val) => Math.round(val * 100) + '%'"
            />
          </el-form-item>
          
          <el-form-item label="字体大小（单个文字）">
            <el-input-number
              v-model="copy2DForm.watermark.fontSizePercent"
              :min="1"
              :max="20"
              :step="0.5"
              :precision="1"
              placeholder="默认5%"
              style="width: 100%"
            >
              <template #suffix>%</template>
            </el-input-number>
            <div class="text-xs text-gray-400 mt-1">
              单个文字的字体大小，相对于图片宽度的百分比（1-20%），留空则自动计算（默认5%）
            </div>
          </el-form-item>
        </template>

        <!-- 图片处理选项 -->
        <el-divider content-position="left">图片处理选项</el-divider>
        <el-form-item label="图片处理方式">
          <el-radio-group v-model="copy2DForm.imageOptions.replace">
            <el-radio :label="false">追加到现有图片</el-radio>
            <el-radio :label="true">替换现有图片</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseCopy2DDialog">取消</el-button>
          <el-button
            type="primary"
            :loading="copying2D"
            @click="executeCopy2D"
          >
            {{ copying2D ? '处理中...' : '确定复制' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 复制贴纸信息配置对话框 -->
    <el-dialog
      v-model="copyStickerDialogVisible"
      title="复制关联贴纸信息到商品"
      width="700px"
      :before-close="handleCloseCopyStickerDialog"
      align-center
      destroy-on-close
    >
      <el-form
        :model="copyStickerForm"
        label-width="140px"
        label-position="left"
      >
        <!-- 基本信息复制 -->
        <el-divider content-position="left">基本信息复制</el-divider>
        <el-form-item label="复制基本信息">
          <el-switch
            v-model="copyStickerForm.copyBasicInfo.enabled"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        
        <template v-if="copyStickerForm.copyBasicInfo.enabled">
          <el-form-item label="复制名称">
            <el-switch v-model="copyStickerForm.copyBasicInfo.copyName" />
          </el-form-item>
          <el-form-item label="复制描述">
            <el-switch v-model="copyStickerForm.copyBasicInfo.copyDescription" />
          </el-form-item>
          <el-form-item label="复制关键词">
            <el-switch v-model="copyStickerForm.copyBasicInfo.copyKeywords" />
          </el-form-item>
        </template>

        <!-- 水印配置 -->
        <el-divider content-position="left">水印配置</el-divider>
        <el-form-item label="启用水印">
          <el-switch
            v-model="copyStickerForm.watermark.enabled"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        
        <template v-if="copyStickerForm.watermark.enabled">
          <el-form-item label="水印文字">
            <el-input
              v-model="copyStickerForm.watermark.text"
              placeholder="留空则使用产品代码"
              clearable
            />
            <div class="text-xs text-gray-400 mt-1">留空则自动使用产品代码</div>
          </el-form-item>
          
          <el-form-item label="水印位置">
            <el-select v-model="copyStickerForm.watermark.position" style="width: 100%">
              <el-option label="右下角" value="bottom-right" />
              <el-option label="右上角" value="top-right" />
              <el-option label="左下角" value="bottom-left" />
              <el-option label="左上角" value="top-left" />
              <el-option label="居中" value="center" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="字体颜色">
            <el-color-picker v-model="copyStickerForm.watermark.fontColor" />
          </el-form-item>
          
          <el-form-item label="透明度">
            <el-slider
              v-model="copyStickerForm.watermark.opacity"
              :min="0"
              :max="1"
              :step="0.1"
              :format-tooltip="(val) => Math.round(val * 100) + '%'"
            />
          </el-form-item>
          
          <el-form-item label="字体大小（单个文字）">
            <el-input-number
              v-model="copyStickerForm.watermark.fontSizePercent"
              :min="1"
              :max="20"
              :step="0.5"
              :precision="1"
              placeholder="默认5%"
              style="width: 100%"
            >
              <template #suffix>%</template>
            </el-input-number>
            <div class="text-xs text-gray-400 mt-1">
              单个文字的字体大小，相对于图片宽度的百分比（1-20%），留空则自动计算（默认5%）
            </div>
          </el-form-item>
        </template>

        <!-- 图片处理选项 -->
        <el-divider content-position="left">图片处理选项</el-divider>
        <el-form-item label="图片处理方式">
          <el-radio-group v-model="copyStickerForm.imageOptions.replace">
            <el-radio :label="false">追加到现有图片</el-radio>
            <el-radio :label="true">替换现有图片</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseCopyStickerDialog">取消</el-button>
          <el-button
            type="primary"
            :loading="copyingSticker"
            @click="executeCopySticker"
          >
            {{ copyingSticker ? '处理中...' : '确定复制' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 复制设计模型信息配置对话框 -->
    <el-dialog
      v-model="copyCustomModelDialogVisible"
      title="复制关联设计模型信息到商品"
      width="700px"
      :before-close="handleCloseCopyCustomModelDialog"
      align-center
      destroy-on-close
    >
      <el-form
        :model="copyCustomModelForm"
        label-width="140px"
        label-position="left"
      >
        <!-- 基本信息复制 -->
        <el-divider content-position="left">基本信息复制</el-divider>
        <el-form-item label="复制基本信息">
          <el-switch
            v-model="copyCustomModelForm.copyBasicInfo.enabled"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        
        <template v-if="copyCustomModelForm.copyBasicInfo.enabled">
          <el-form-item label="复制名称">
            <el-switch v-model="copyCustomModelForm.copyBasicInfo.copyName" />
          </el-form-item>
          <el-form-item label="复制描述">
            <el-switch v-model="copyCustomModelForm.copyBasicInfo.copyDescription" />
          </el-form-item>
          <el-form-item label="复制关键词">
            <el-switch v-model="copyCustomModelForm.copyBasicInfo.copyKeywords" />
          </el-form-item>
        </template>

        <!-- 水印配置 -->
        <el-divider content-position="left">水印配置</el-divider>
        <el-form-item label="启用水印">
          <el-switch
            v-model="copyCustomModelForm.watermark.enabled"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        
        <template v-if="copyCustomModelForm.watermark.enabled">
          <el-form-item label="水印文字">
            <el-input
              v-model="copyCustomModelForm.watermark.text"
              placeholder="留空则使用产品代码"
              clearable
            />
            <div class="text-xs text-gray-400 mt-1">留空则自动使用产品代码</div>
          </el-form-item>
          
          <el-form-item label="水印位置">
            <el-select v-model="copyCustomModelForm.watermark.position" style="width: 100%">
              <el-option label="右下角" value="bottom-right" />
              <el-option label="右上角" value="top-right" />
              <el-option label="左下角" value="bottom-left" />
              <el-option label="左上角" value="top-left" />
              <el-option label="居中" value="center" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="字体颜色">
            <el-color-picker v-model="copyCustomModelForm.watermark.fontColor" />
          </el-form-item>
          
          <el-form-item label="透明度">
            <el-slider
              v-model="copyCustomModelForm.watermark.opacity"
              :min="0"
              :max="1"
              :step="0.1"
              :format-tooltip="(val) => Math.round(val * 100) + '%'"
            />
          </el-form-item>
          
          <el-form-item label="字体大小（单个文字）">
            <el-input-number
              v-model="copyCustomModelForm.watermark.fontSizePercent"
              :min="1"
              :max="20"
              :step="0.5"
              :precision="1"
              placeholder="默认5%"
              style="width: 100%"
            >
              <template #suffix>%</template>
            </el-input-number>
            <div class="text-xs text-gray-400 mt-1">
              单个文字的字体大小，相对于图片宽度的百分比（1-20%），留空则自动计算（默认5%）
            </div>
          </el-form-item>
        </template>

        <!-- 图片处理选项 -->
        <el-divider content-position="left">图片处理选项</el-divider>
        <el-form-item label="图片处理方式">
          <el-radio-group v-model="copyCustomModelForm.imageOptions.replace">
            <el-radio :label="false">追加到现有图片</el-radio>
            <el-radio :label="true">替换现有图片</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseCopyCustomModelDialog">取消</el-button>
          <el-button
            type="primary"
            :loading="copyingCustomModel"
            @click="executeCopyCustomModel"
          >
            {{ copyingCustomModel ? '处理中...' : '确定复制' }}
          </el-button>
        </div>
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
          style="max-width: 100%; max-height: 70vh;"
          :preview-teleported="true"
        />
        <div v-if="previewList.length > 1" class="mt-4 flex items-center gap-4">
          <el-button @click="previewIndex = Math.max(0, previewIndex - 1)" :disabled="previewIndex === 0">上一张</el-button>
          <span>{{ previewIndex + 1 }} / {{ previewList.length }}</span>
          <el-button @click="previewIndex = Math.min(previewList.length - 1, previewIndex + 1)" :disabled="previewIndex === previewList.length - 1">下一张</el-button>
        </div>
      </div>
      <div v-else-if="previewUrl" class="flex justify-center">
        <img :src="previewUrl" alt="Preview" style="max-width: 100%; max-height: 70vh;" />
      </div>
    </el-dialog>

    <!-- 视频预览弹窗 -->
    <el-dialog v-model="videoPreviewVisible" title="视频预览" width="600px" :close-on-click-modal="true">
      <div v-if="videoPreviewList.length > 0" class="flex flex-col items-center">
        <video
          :src="videoPreviewList[videoPreviewIndex]"
          controls
          autoplay
          style="width: 100%; max-height: 400px; border-radius: 8px; background: #000;"
        />
        <div class="flex gap-2 mt-2">
          <el-button
            v-for="(url, idx) in videoPreviewList"
            :key="idx"
            size="small"
            :type="idx === videoPreviewIndex ? 'primary' : 'default'"
            @click="videoPreviewIndex = idx"
          >
            {{ idx + 1 }}
          </el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="customModelDetailVisible" title="关联设计模型详情" width="100%" :fullscreen="true" :close-on-click-modal="false">
      <div v-if="customModelDetail" class="custom-model-detail-dialog p-8">
        <el-row :gutter="32">
          <!-- 左侧图片区 -->
          <el-col :span="8" class="flex flex-col items-center justify-center">
            <img v-if="customModelDetail.thumbnail" :src="customModelDetail.thumbnail" style="max-width: 240px; max-height: 240px; border-radius: 12px; box-shadow: 0 2px 8px #0001; margin-bottom: 16px; cursor:pointer;" @click="preview(0, [customModelDetail.thumbnail])" />
            <div v-else class="w-[240px] h-[240px] flex items-center justify-center bg-gray-100 text-gray-400 rounded mb-4">无缩略图</div>
            <!-- 预留更多图片展示（如有） -->
            <template v-if="customModelDetail.images && customModelDetail.images.length">
              <div class="flex flex-wrap gap-2 mt-2">
                <img v-for="(img, idx) in customModelDetail.images" :key="idx" :src="img" style="width: 60px; height: 60px; border-radius: 6px; object-fit: cover; cursor:pointer;" @click="preview(idx, customModelDetail.images)" />
              </div>
            </template>
          </el-col>
          <!-- 右侧基础信息区 -->
          <el-col :span="16">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="ID">{{ customModelDetail.id }}</el-descriptions-item>
              <el-descriptions-item label="名称">{{ customModelDetail.name }}</el-descriptions-item>
              <el-descriptions-item label="描述" :span="2">{{ customModelDetail.description || '无' }}</el-descriptions-item>
              <el-descriptions-item label="关键词">{{ customModelDetail.keywords || '无' }}</el-descriptions-item>
              <el-descriptions-item label="标签">{{ customModelDetail.tags || '无' }}</el-descriptions-item>
              <el-descriptions-item label="作者">
                <template v-if="customModelDetail.uploader && (customModelDetail.uploader.name || customModelDetail.uploader.account)">
                  {{ customModelDetail.uploader.name || customModelDetail.uploader.account }}
                </template>
                <template v-else>无</template>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ customModelDetail.createTime ? (customModelDetail.createTime + '').replace('T', ' ').slice(0, 19) : '无' }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ customModelDetail.updateTime ? (customModelDetail.updateTime + '').replace('T', ' ').slice(0, 19) : '无' }}</el-descriptions-item>
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
            <pre style="background:none;padding:0;margin:0;font-size:13px;">{{ JSON.stringify(customModelDetail.meta, null, 2) }}</pre>
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
            style="margin: 0; padding: 0; background: none;"
            :columns="[
              { field: 'thumbnail', title: '缩略图', width: '120', slots: { default: 'customModelThumbnailSlot' } },
              { field: 'name', title: '名称', minWidth: 80 },
              { field: 'description', title: '描述', minWidth: 120 },
              { field: 'keywords', title: '关键词', minWidth: 100 },
              { field: 'updateTime', title: '更新时间', minWidth: 120, slots: { default: 'customModelUpdateTimeSlot' } },
              { title: '操作', field: 'operation', width: 'auto', slots: { default: 'customModelOperationSlot' } }
            ]"
          >
            <template #customModelThumbnailSlot="{ row }">
              <div class="flex items-center justify-center p-2">
                <el-image
                  v-if="row.thumbnail"
                  :src="row.thumbnail"
                  :preview-src-list="[row.thumbnail]"
                  :initial-index="0"
                  style="width:120px; height:auto; object-fit:contain; background:#f5f5f5; cursor:pointer;"
                />
                <span v-else class="text-gray-400">无</span>
              </div>
            </template>
            <template #customModelUpdateTimeSlot="{ row }">
              <span>{{ row.updateTime ? (row.updateTime + '').replace('T', ' ').slice(0, 19) : '无' }}</span>
            </template>
            <template #customModelOperationSlot="{ row }">
              <div class="flex gap-2">
                <el-button type="primary" link size="small" @click="showCustomModelDrafts(row)">查看草稿截图</el-button>
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
            style="margin: 0; padding: 0; background: none;"
            :columns="[
              { field: 'url', title: '图片', width: '120', slots: { default: 'stickerImageSlot' } },
              { field: 'name', title: '名称', minWidth: 80 },
              { field: 'description', title: '描述', minWidth: 120 },
              { field: 'keywords', title: '关键词', minWidth: 100 },
              { field: 'suffix', title: '后缀', width: 80 },
              { field: 'updateTime', title: '更新时间', minWidth: 120, slots: { default: 'stickerUpdateTimeSlot' } },
              { title: '操作', field: 'operation', width: 'auto', slots: { default: 'stickerOperationSlot' } }
            ]"
          >
            <template #stickerImageSlot="{ row }">
              <div class="flex items-center justify-center p-2">
                <el-image
                  v-if="row.url"
                  :src="row.url"
                  :preview-src-list="[row.url]"
                  :initial-index="0"
                  style="width:120px; height:auto; object-fit:contain; background:#f5f5f5; cursor:pointer;"
                />
                <span v-else class="text-gray-400">无</span>
              </div>
            </template>
            <template #stickerUpdateTimeSlot="{ row }">
              <span>{{ row.updateTime ? (row.updateTime + '').replace('T', ' ').slice(0, 19) : '无' }}</span>
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

        <!-- 关联二维产品图 -->
        <div v-if="currentRelationsRow.productImage2D" class="relation-section">
          <h3 class="relation-section-title">关联二维产品图</h3>
          <vxe-grid
            :data="[currentRelationsRow.productImage2D]"
            :show-header="true"
            border
            size="mini"
            style="margin: 0; padding: 0; background: none;"
            :columns="[
              { field: 'image1', title: '图片', width: '120', slots: { default: 'productImage2DImageSlot' } },
              { field: 'name', title: '名称', minWidth: 120 },
              { field: 'code', title: '产品代码', width: 120 },
              { field: 'description', title: '描述', minWidth: 150 },
              { field: 'keywords', title: '关键词', minWidth: 120 },
              { field: 'updateTime', title: '更新时间', minWidth: 120, slots: { default: 'productImage2DUpdateTimeSlot' } },
              { title: '操作', field: 'operation', width: 'auto', slots: { default: 'productImage2DOperationSlot' } }
            ]"
          >
            <template #productImage2DImageSlot="{ row }">
              <div class="flex items-center justify-center p-2">
                <el-image
                  v-if="row.image1"
                  :src="row.image1"
                  :preview-src-list="getProductImage2DPreviewList(row)"
                  :initial-index="0"
                  style="width:120px; height:auto; object-fit:contain; background:#f5f5f5; cursor:pointer;"
                />
                <span v-else class="text-gray-400">无</span>
              </div>
            </template>
            <template #productImage2DUpdateTimeSlot="{ row }">
              <span>{{ row.updateTime ? (row.updateTime + '').replace('T', ' ').slice(0, 19) : '无' }}</span>
            </template>
            <template #productImage2DOperationSlot="{ row }">
              <div class="flex gap-2">
                <el-button 
                  v-if="getProductImage2DPreviewList(row).length > 0"
                  type="primary" 
                  link 
                  size="small" 
                  @click="preview(0, getProductImage2DPreviewList(row))"
                >
                  预览
                </el-button>
              </div>
            </template>
          </vxe-grid>
        </div>

        <div v-if="!currentRelationsRow.customModel && !currentRelationsRow.sticker && !currentRelationsRow.productImage2D" class="text-center py-8 text-gray-400">
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
          <el-tab-pane v-if="currentSourceInfoRow.productImage2D" label="二维产品图" name="productImage2D">
            <div class="source-info-section">
              <h4 class="source-info-title">二维产品图原始数据</h4>
              <pre class="source-info-json">{{ formatJSON(currentSourceInfoRow.productImage2D) }}</pre>
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
        <div 
          v-for="draft in customModelDrafts" 
          :key="draft.id" 
          class="draft-item"
        >
          <div class="draft-preview">
            <!-- 视频预览 -->
            <div 
              v-if="draft.suffix && ['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(draft.suffix.toLowerCase())"
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
                <el-icon class="play-icon"><VideoPlay /></el-icon>
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
        placeholder="如：请用艺术化语言描述商品内容..."
        style="font-size:16px;min-height:120px;width:100%;resize:vertical;"
      />
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { useUserStore } from "@/store/modules/user";
import { defaultSortingValue } from "@/common/sort";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search,
  Plus,
  Delete,
  Picture,
  Box,
  ArrowDown,
  Edit,
  Upload,
  Share,
  MagicStick,
  VideoPlay,
  Check,
  Refresh,
} from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";
import { downloadFileByElement, downloadImageEnhanced } from "@/common/download";
import { uploadToCOS } from "@/api/cos";
import { createProduct, getProductList, updateProduct, deleteProduct, generateProductCode, copyImagesFromProductImage2D, copyImagesFromSticker, copyImagesFromCustomModel } from "@/api/product";
import { getTitleTemplateList } from "@/api/publish";
import { uploadOSSFile } from "@/api/shop/platform";
import { ShopCategoryApi } from "@/api/shop/category";
import { ShopApi } from "@/api/shop/shopIndex";
import { PsdPreview } from "@/components/PsdPreview";
import { fontTemplateApi } from "@/api/fontTemplate";
import ProductImageUpload from '@/components/ProductImageUpload.vue'
import ProductVideoUpload from '@/components/ProductVideoUpload.vue'
import { publishToSocialMedia } from "@/api/client";
import { getDesignModel } from '@/api/designModel'
// import { preview as previewImage } from "@/components/PreviewImage/index"; // 已使用本地 preview 函数
import { getDraftList } from '@/api/draft'
import { aiGenerateProductInfo } from '@/api/product'
import { copyLink } from '@/utils/clipboard'



// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  name: '',
  search: '',
  isPublish: undefined as boolean | undefined,
  publishStatus: '' as string | ''
});

const gridOptions = ref({
  ...commonGridOptions,
  rowClassName: ({ row }) => {
    return row.isPublish ? '' : 'unpublished-row';
  },
  rowConfig:{
    height:'auto'
  },
  columns: [
    { type: "checkbox", width: 50, showOverflow: true },
    {
      title: "商品图片",
      field: "images",
      width: 300,
      slots: {
        default: "urlDefaultSlot",
      },
    },
    // {
    //   title: "商品视频",
    //   field: "videos",
    //   width: 'auto',
    //   slots: {
    //     default: "videoDefaultSlot",
    //   },
    // },
    { title: "商品名称", field: "name", width: 240, showOverflow: true },
    { title: "商品描述", field: "description", width: 240, showOverflow: false },
    { title: "关键词", field: "keywords", width: 200, showOverflow: false },
    { 
      title: "产品代码", 
      field: "code", 
      width: 120, 
      showOverflow: true,
      slots: { default: 'codeSlot' }
    },
    { 
      title: "关联信息", 
      field: "relations", 
      width: 'auto', 
      slots: { default: 'relationsSlot' }
    },
    { title: "搜索关键字", field: "searchKeywords", width: 200, showOverflow: false },

    { title: "商品类型", field: "type", width: 120, showOverflow: true },
    { title: "价格", field: "price", width: 100, showOverflow: true },
    { title: "促销价格", field: "salePrice", width: 100, showOverflow: true },
    { title: "库存", field: "stock", width: 100, showOverflow: true },

    { 
      title: "是否绝版", 
      field: "isLimitedEdition", 
      width: 100, 
      showOverflow: true,
      formatter: ({ cellValue }) => cellValue === 1 ? '是' : '否'
    },
    { 
      title: "发布状态", 
      field: "publishStatus", 
      width: 140, 
      showOverflow: true,
      slots: { default: 'publishStatusSlot' }
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
  ],
});


const { height } = useWindowSize()

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 250
})

const dataSource = ref([]);
const loading = ref(false);
const ids = ref([]);
const single = ref(false);
const total = ref(0);
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
const publishDialogVisible = ref(false);

// 复制二维模型信息相关状态
const copy2DDialogVisible = ref(false);
const copying2D = ref(false);
const currentCopy2DProductId = ref<string>('');
const copy2DForm = reactive({
  watermark: {
    enabled: true,
    text: '',
    position: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
    fontSizePercent: 5 as number | undefined, // 相对于图片宽度的百分比，默认5%
    fontColor: '#FFFFFF',
    opacity: 0.6
  },
  copyBasicInfo: {
    enabled: false,
    copyName: true,
    copyDescription: true,
    copyKeywords: true
  },
  imageOptions: {
    replace: false
  }
});

// 复制贴纸信息相关状态
const copyStickerDialogVisible = ref(false);
const copyingSticker = ref(false);
const currentCopyStickerProductId = ref<string>('');
const copyStickerForm = reactive({
  watermark: {
    enabled: true,
    text: '',
    position: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
    fontSizePercent: 5 as number | undefined,
    fontColor: '#FFFFFF',
    opacity: 0.6
  },
  copyBasicInfo: {
    enabled: false,
    copyName: true,
    copyDescription: true,
    copyKeywords: true
  },
  imageOptions: {
    replace: false
  }
});

// 复制设计模型信息相关状态
const copyCustomModelDialogVisible = ref(false);
const copyingCustomModel = ref(false);
const currentCopyCustomModelProductId = ref<string>('');
const copyCustomModelForm = reactive({
  watermark: {
    enabled: true,
    text: '',
    position: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
    fontSizePercent: 5 as number | undefined,
    fontColor: '#FFFFFF',
    opacity: 0.6
  },
  copyBasicInfo: {
    enabled: false,
    copyName: true,
    copyDescription: true,
    copyKeywords: true
  },
  imageOptions: {
    replace: false
  }
});
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
}

// 发布相关的状态
const selectedPlatforms = ref<string[]>([]);
const publishForm = ref<PublishForm & { kuaishou: PlatformForm | null }>({
  douyin: null,
  xiaohongshu: null,
  weibo: null,
  kuaishou: null
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
  description: string;
  keywords: string;
  searchKeywords: string;
  type: string;
  images: string[];
  videos: string[];
  price: number;
  salePrice: number;
  stock: number;
  specifications: string;
  tags: string;
  isActive: boolean;
  isLimitedEdition: number;
  isPublish?: boolean;
  createTime?: Date;
  updateTime?: Date;
  file: any;
}

const form = ref<ProductForm>({
  code: '',
  name: '',
  description: '',
  keywords: '',
  searchKeywords: '',
  type: '',
  images: [] as string[],
  videos: [] as string[],
  price: 0,
  salePrice: 0,
  stock: 0,
  specifications: '',
  tags: '',
  isActive: true,
  isLimitedEdition: 0,
  isPublish: false,
  file: null,
});

const rules = {
  name: [{ required: true, message: "请输入商品名称", trigger: "blur" }],
  description: [{ required: false, message: "请输入商品描述", trigger: "blur" }],
  type: [{ required: false, message: "请选择商品类型", trigger: "blur" }],
  price: [{ required: true, message: "请输入商品价格", trigger: "blur" }],
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
}

function checkboxAllChange(e) {
  ids.value = e.records.map((item) => item.id);
}

// 处理文件列表变化
const handleFilesChange = (files) => {
  pendingFiles.value = files.filter(file => file.raw).map(file => file.raw)
}

// 处理视频文件列表变化
const handleVideoFilesChange = (files) => {
  pendingVideoFiles.value = files.filter(file => file.raw).map(file => file.raw)
}

const submitForm = async () => {
  submitLoading.value = true;
  try {
    await formRef.value.validate();
    const formData = { ...form.value };
    formData.isLimitedEdition = Number(formData.isLimitedEdition);
    formData.price = Number(formData.price);
    formData.salePrice = Number(formData.salePrice);
    delete formData.file;
    delete formData.createTime;
    delete formData.updateTime;
    // 如果是新建且code为空，删除code字段，让后端自动生成
    if (!isEdit.value && (!formData.code || formData.code.trim() === '')) {
      delete formData.code;
    }
    // 上传所有待上传的图片到COS
    let newImageUrls: string[] = [];
    if (pendingFiles.value.length > 0) {
      const uploadPromises = pendingFiles.value.map(async (file) => {
        try {
          const result = await uploadToCOS({ file });
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
          const result = await uploadToCOS({ file });
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

getList()
async function getList() {
  loading.value = true;

  let params: any = {
    currentPage: queryParams.currentPage,
    pageSize: queryParams.pageSize,
    search: queryParams.name,
  };
  
  // 如果选择了发布状态，添加到查询参数中
  if (queryParams.isPublish !== undefined) {
    params.isPublish = queryParams.isPublish;
  }
  if (queryParams.publishStatus) {
    params.publishStatus = queryParams.publishStatus;
  }

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
  queryParams.currentPage = 1;
  queryParams.pageSize = 20;
  queryParams.name = '';
  queryParams.search = '';
  queryParams.isPublish = undefined;
  queryParams.publishStatus = '';
};

// 搜索按钮点击事件
const handleSearch = () => {
  queryParams.currentPage = 1; // 搜索时重置到第一页
  getList();
};

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
  dialogVisible.value = true;
  dialogTitle.value = "新建商品";
  form.value = {
    code: '',
    name: '',
    description: '',
    keywords: '',
    searchKeywords: '',
    type: '',
    images: [] as string[],
    videos: [] as string[],
    price: 0,
    salePrice: 0,
    stock: 0,
    specifications: '',
    tags: '',
    isActive: true,
    isLimitedEdition: 0,
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
    
    // 调用更新接口，传递isPublish参数
    await updateProduct({
      ...row,
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
function handlePublish(row) {
  currentPublishRow.value = row;
  publishDialogVisible.value = true;
  // 默认选中所有平台
  selectedPlatforms.value = ['douyin', 'xiaohongshu', 'weibo', 'kuaishou'];
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
    publishForm.value[platform as keyof PublishForm | 'kuaishou'] = {
      title: row?.name || '',
      content: row?.description || '',
      images: images,
      selectedImages: [...images],
      videos: videos,
      selectedVideos: [...videos]
    };
  });
  // 清理未选中的平台
  Object.keys(publishForm.value).forEach(platform => {
    if (!platforms.includes(platform)) {
      publishForm.value[platform as keyof PublishForm | 'kuaishou'] = null;
    }
  });
}

// 获取平台名称
const getPlatformName = (platform: string) => {
  const platformNames = {
    douyin: '抖音',
    xiaohongshu: '小红书',
    weibo: '微博',
    kuaishou: '快手'
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
  publishLoading.value = true;
  try {
    // 验证表单
    if (selectedPlatforms.value.length === 0) {
      ElMessage.warning('请至少选择一个发布平台');
      return;
    }

    // 验证每个选中平台的表单
    for (const platform of selectedPlatforms.value) {
      const form = publishForm.value[platform as keyof PublishForm | 'kuaishou'];
      if (platform !== 'weibo' && (!form || !form.title || !form.content)) {
        ElMessage.warning(`请完善${getPlatformName(platform)}的发布内容`);
        return;
      }
      if (platform === 'weibo' && (!form || !form.content)) {
        ElMessage.warning(`请完善${getPlatformName(platform)}的发布内容`);
        return;
      }
      if (form.selectedImages.length === 0 && form.selectedVideos.length === 0) {
        ElMessage.warning(`请至少选择一张图片或一个视频用于${getPlatformName(platform)}发布`);
        return;
      }
    }

    // 构建发布数据
    const publishData = {
      productId: currentPublishRow.value.id,
      platforms: selectedPlatforms.value.map(platform => {
        const base = {
          platform,
          content: publishForm.value[platform as keyof PublishForm | 'kuaishou']!.content,
          images: publishForm.value[platform as keyof PublishForm | 'kuaishou']!.selectedImages,
          videos: publishForm.value[platform as keyof PublishForm | 'kuaishou']!.selectedVideos
        };
        if (platform !== 'weibo') {
          return {
            ...base,
            title: publishForm.value[platform as keyof PublishForm | 'kuaishou']!.title
          };
        }
        return base;
      })
    };

    const response = await publishToSocialMedia(publishData);
    
    let results = [];
    if (response && response.results) {
      results = response.results;
    }

    if (results.length > 0) {
      publishResults.value = results.map(result => ({
        platform: result.platform,
        success: result.success,
        message: formatPublishMessage(result),
        data: result.data
      }));
      publishResultVisible.value = true;
    } else {
      publishResults.value = [{
        platform: 'unknown',
        success: false,
        message: '发布请求已提交，但未收到详细结果'
      }];
      publishResultVisible.value = true;
    }
  } catch (error) {
    console.error('发布失败:', error);
    ElMessage.error('发布失败，请重试');
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

function handleVideoPreview(list: string[], index: number) {
  videoPreviewList.value = list;
  videoPreviewIndex.value = index;
  videoPreviewVisible.value = true;
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
    const res = await getDesignModel({id})
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
      aiGenRow.value.description = res.description
      aiGenRow.value.keywords = res.keywords
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
    case 'edit':
      handleEdit(row);
      break;
    case 'delete':
      handleDelete(row);
      break;
    case 'publish':
    case 'unpublish':
      handleTogglePublish(row);
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
    case 'copy-images-from-2d':
      handleCopyImagesFrom2D(row);
      break;
    case 'copy-images-from-sticker':
      handleCopyImagesFromSticker(row);
      break;
    case 'copy-images-from-custom-model':
      handleCopyImagesFromCustomModel(row);
      break;
    case 'mark-draft':
      handleUpdatePublishStatus(row, 'draft');
      break;
    case 'mark-pending':
      handleUpdatePublishStatus(row, 'pending_social_media');
      break;
    case 'mark-published':
      handleUpdatePublishStatus(row, 'published_social_media');
      break;
    case 'mark-archived':
      handleUpdatePublishStatus(row, 'archived');
      break;
    default:
      console.warn('未知的操作命令:', command);
  }
}

// 处理生成产品代码
async function handleGenerateProductCode(row: any) {
  try {
    const res = await generateProductCode({ id: row.id });
    if (res && res.code) {
      row.code = res.code;
      ElMessage.success('产品代码生成成功');
      // 刷新列表
      getList();
    }
  } catch (error) {
    ElMessage.error('生成产品代码失败');
  }
}

// 处理从二维产品图复制图片并添加水印
async function handleCopyImagesFrom2D(row: any) {
  if (!row.productImage2DId) {
    ElMessage.warning('该产品未关联二维产品图');
    return;
  }
  
  // 设置默认水印文字为产品代码
  copy2DForm.watermark.text = row.code || '';
  currentCopy2DProductId.value = row.id;
  copy2DDialogVisible.value = true;
}

// 执行复制二维模型信息
async function executeCopy2D() {
  if (!currentCopy2DProductId.value) return;
  
  // 验证水印配置（留空时后端会使用产品代码，所以不需要验证）
  
  try {
    copying2D.value = true;
    
    const requestData: any = {
      id: currentCopy2DProductId.value
    };
    
    // 水印配置
    if (copy2DForm.watermark.enabled) {
      requestData.watermark = {
        enabled: true,
        text: copy2DForm.watermark.text || undefined, // 如果为空，后端会使用产品代码
        position: copy2DForm.watermark.position,
        fontColor: copy2DForm.watermark.fontColor,
        opacity: copy2DForm.watermark.opacity
      };
      
      // 传递字体大小百分比（相对于图片宽度）
      if (copy2DForm.watermark.fontSizePercent !== undefined && copy2DForm.watermark.fontSizePercent !== null) {
        requestData.watermark.fontSizePercent = copy2DForm.watermark.fontSizePercent;
      }
    } else {
      requestData.watermark = { enabled: false };
    }
    
    // 基本信息复制配置
    if (copy2DForm.copyBasicInfo.enabled) {
      requestData.copyBasicInfo = {
        enabled: true,
        copyName: copy2DForm.copyBasicInfo.copyName,
        copyDescription: copy2DForm.copyBasicInfo.copyDescription,
        copyKeywords: copy2DForm.copyBasicInfo.copyKeywords
      };
    } else {
      requestData.copyBasicInfo = { enabled: false };
    }
    
    // 图片处理选项
    requestData.imageOptions = {
      replace: copy2DForm.imageOptions.replace
    };
    
    const res = await copyImagesFromProductImage2D(requestData);
    if (res && res.success) {
      ElMessage.success(res.message || `成功复制 ${res.copiedImageCount} 张图片`);
      // 刷新列表
      getList();
      copy2DDialogVisible.value = false;
    }
  } catch (error: any) {
    console.error('复制信息失败:', error);
    ElMessage.error(error?.message || '复制信息失败');
  } finally {
    copying2D.value = false;
  }
}

// 关闭复制二维模型信息对话框
function handleCloseCopy2DDialog() {
  copy2DDialogVisible.value = false;
  currentCopy2DProductId.value = '';
  // 重置表单
  copy2DForm.watermark.enabled = true;
  copy2DForm.watermark.text = '';
  copy2DForm.watermark.position = 'bottom-right';
  copy2DForm.watermark.fontSizePercent = 5; // 重置为默认值5%
  copy2DForm.watermark.fontColor = '#FFFFFF';
  copy2DForm.watermark.opacity = 0.6;
  copy2DForm.copyBasicInfo.enabled = false;
  copy2DForm.copyBasicInfo.copyName = true;
  copy2DForm.copyBasicInfo.copyDescription = true;
  copy2DForm.copyBasicInfo.copyKeywords = true;
  copy2DForm.imageOptions.replace = false;
}

// 处理从贴纸复制图片并添加水印
async function handleCopyImagesFromSticker(row: any) {
  if (!row.stickerId) {
    ElMessage.warning('该产品未关联贴纸');
    return;
  }
  
  // 设置默认水印文字为产品代码
  copyStickerForm.watermark.text = row.code || '';
  currentCopyStickerProductId.value = row.id;
  copyStickerDialogVisible.value = true;
}

// 执行复制贴纸信息
async function executeCopySticker() {
  if (!currentCopyStickerProductId.value) return;
  
  try {
    copyingSticker.value = true;
    
    const requestData: any = {
      id: currentCopyStickerProductId.value
    };
    
    // 水印配置
    if (copyStickerForm.watermark.enabled) {
      requestData.watermark = {
        enabled: true,
        text: copyStickerForm.watermark.text || undefined,
        position: copyStickerForm.watermark.position,
        fontColor: copyStickerForm.watermark.fontColor,
        opacity: copyStickerForm.watermark.opacity
      };
      
      if (copyStickerForm.watermark.fontSizePercent !== undefined && copyStickerForm.watermark.fontSizePercent !== null) {
        requestData.watermark.fontSizePercent = copyStickerForm.watermark.fontSizePercent;
      }
    } else {
      requestData.watermark = { enabled: false };
    }
    
    // 基本信息复制配置
    if (copyStickerForm.copyBasicInfo.enabled) {
      requestData.copyBasicInfo = {
        enabled: true,
        copyName: copyStickerForm.copyBasicInfo.copyName,
        copyDescription: copyStickerForm.copyBasicInfo.copyDescription,
        copyKeywords: copyStickerForm.copyBasicInfo.copyKeywords
      };
    } else {
      requestData.copyBasicInfo = { enabled: false };
    }
    
    // 图片处理选项
    requestData.imageOptions = {
      replace: copyStickerForm.imageOptions.replace
    };
    
    const res = await copyImagesFromSticker(requestData);
    if (res && res.success) {
      ElMessage.success(res.message || `成功复制 ${res.copiedImageCount} 张图片`);
      getList();
      copyStickerDialogVisible.value = false;
    }
  } catch (error: any) {
    console.error('复制信息失败:', error);
    ElMessage.error(error?.message || '复制信息失败');
  } finally {
    copyingSticker.value = false;
  }
}

// 关闭复制贴纸信息对话框
function handleCloseCopyStickerDialog() {
  copyStickerDialogVisible.value = false;
  currentCopyStickerProductId.value = '';
  // 重置表单
  copyStickerForm.watermark.enabled = true;
  copyStickerForm.watermark.text = '';
  copyStickerForm.watermark.position = 'bottom-right';
  copyStickerForm.watermark.fontSizePercent = 5;
  copyStickerForm.watermark.fontColor = '#FFFFFF';
  copyStickerForm.watermark.opacity = 0.6;
  copyStickerForm.copyBasicInfo.enabled = false;
  copyStickerForm.copyBasicInfo.copyName = true;
  copyStickerForm.copyBasicInfo.copyDescription = true;
  copyStickerForm.copyBasicInfo.copyKeywords = true;
  copyStickerForm.imageOptions.replace = false;
}

// 处理从设计模型复制图片并添加水印
async function handleCopyImagesFromCustomModel(row: any) {
  if (!row.customModelId) {
    ElMessage.warning('该产品未关联设计模型');
    return;
  }
  
  // 设置默认水印文字为产品代码
  copyCustomModelForm.watermark.text = row.code || '';
  currentCopyCustomModelProductId.value = row.id;
  copyCustomModelDialogVisible.value = true;
}

// 执行复制设计模型信息
async function executeCopyCustomModel() {
  if (!currentCopyCustomModelProductId.value) return;
  
  try {
    copyingCustomModel.value = true;
    
    const requestData: any = {
      id: currentCopyCustomModelProductId.value
    };
    
    // 水印配置
    if (copyCustomModelForm.watermark.enabled) {
      requestData.watermark = {
        enabled: true,
        text: copyCustomModelForm.watermark.text || undefined,
        position: copyCustomModelForm.watermark.position,
        fontColor: copyCustomModelForm.watermark.fontColor,
        opacity: copyCustomModelForm.watermark.opacity
      };
      
      if (copyCustomModelForm.watermark.fontSizePercent !== undefined && copyCustomModelForm.watermark.fontSizePercent !== null) {
        requestData.watermark.fontSizePercent = copyCustomModelForm.watermark.fontSizePercent;
      }
    } else {
      requestData.watermark = { enabled: false };
    }
    
    // 基本信息复制配置
    if (copyCustomModelForm.copyBasicInfo.enabled) {
      requestData.copyBasicInfo = {
        enabled: true,
        copyName: copyCustomModelForm.copyBasicInfo.copyName,
        copyDescription: copyCustomModelForm.copyBasicInfo.copyDescription,
        copyKeywords: copyCustomModelForm.copyBasicInfo.copyKeywords
      };
    } else {
      requestData.copyBasicInfo = { enabled: false };
    }
    
    // 图片处理选项
    requestData.imageOptions = {
      replace: copyCustomModelForm.imageOptions.replace
    };
    
    const res = await copyImagesFromCustomModel(requestData);
    if (res && res.success) {
      ElMessage.success(res.message || `成功复制 ${res.copiedImageCount} 张图片`);
      getList();
      copyCustomModelDialogVisible.value = false;
    }
  } catch (error: any) {
    console.error('复制信息失败:', error);
    ElMessage.error(error?.message || '复制信息失败');
  } finally {
    copyingCustomModel.value = false;
  }
}

// 关闭复制设计模型信息对话框
function handleCloseCopyCustomModelDialog() {
  copyCustomModelDialogVisible.value = false;
  currentCopyCustomModelProductId.value = '';
  // 重置表单
  copyCustomModelForm.watermark.enabled = true;
  copyCustomModelForm.watermark.text = '';
  copyCustomModelForm.watermark.position = 'bottom-right';
  copyCustomModelForm.watermark.fontSizePercent = 5;
  copyCustomModelForm.watermark.fontColor = '#FFFFFF';
  copyCustomModelForm.watermark.opacity = 0.6;
  copyCustomModelForm.copyBasicInfo.enabled = false;
  copyCustomModelForm.copyBasicInfo.copyName = true;
  copyCustomModelForm.copyBasicInfo.copyDescription = true;
  copyCustomModelForm.copyBasicInfo.copyKeywords = true;
  copyCustomModelForm.imageOptions.replace = false;
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

// 获取二维产品图的所有图片列表（用于预览）
function getProductImage2DPreviewList(productImage2D: any): string[] {
  if (!productImage2D) return []
  const images: string[] = []
  for (let i = 1; i <= 10; i++) {
    const imageUrl = productImage2D[`image${i}`]
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
      images.push(imageUrl)
    }
  }
  return images
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

// 获取关联信息文本
function getRelationsText(row: any): string {
  const relations: string[] = []
  if (row.customModel) relations.push('设计模型')
  if (row.sticker) relations.push('贴纸')
  if (row.productImage2D) relations.push('二维产品图')
  
  if (relations.length === 0) return '无关联'
  if (relations.length === 1) return `关联${relations[0]}`
  if (relations.length === 2) return `关联${relations[0]}、${relations[1]}`
  return `关联${relations[0]}、${relations[1]}、${relations[2]}`
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
  } else if (row.productImage2D) {
    activeSourceTab.value = 'productImage2D'
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
  } else if (activeSourceTab.value === 'productImage2D' && currentSourceInfoRow.value.productImage2D) {
    jsonText = JSON.stringify(currentSourceInfoRow.value.productImage2D, null, 2)
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

async function handleUpdatePublishStatus(row: any, status: string) {
  try {
    await updateProduct({
      ...row,
      publishStatus: status
    });
    ElMessage.success('发布状态已更新');
    getList();
  } catch (e) {
    ElMessage.error('更新发布状态失败');
  }
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


// 未发布商品行的样式
.unpublished-row {
  background-color: rgba(255, 193, 7, 0.08) !important; /* 浅浅的半透明警告色 */
  border-left: 3px solid rgba(255, 193, 7, 0.3) !important; /* 左侧半透明橙色边框 */
  
  &:hover {
    background-color: rgba(255, 193, 7, 0.12) !important; /* 悬停时稍微明显一点 */
  }
}

.dark-btn {
  background: linear-gradient(90deg, #232526 0%, #414345 100%);
  color: #fff !important;
  border: none;
}
.dark-btn:hover {
  background: linear-gradient(90deg, #414345 0%, #232526 100%);
  color: #fff !important;
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
    transform: translateY(-2px);
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

// 操作dropdown样式
.operation-dropdown {
  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .el-icon {
      margin-right: 4px;
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    
    span {
      font-size: 13px;
      line-height: 1.5;
    }
  }
  
  .text-orange-500 {
    color: #f97316;
  }
  
  .text-green-500 {
    color: #22c55e;
  }
}

// 紧凑型操作菜单
.operation-menu-compact {
  min-width: 140px !important;
  padding: 2px 0 !important;
  
  .el-dropdown-menu__item {
    padding: 6px 12px !important;
    font-size: 12px !important;
    line-height: 1.4 !important;
    height: auto !important;
    min-height: 28px !important;
    
    .el-icon {
      font-size: 13px !important;
      width: 13px !important;
      height: 13px !important;
      margin-right: 6px !important;
    }
    
    span {
      font-size: 12px !important;
    }
    
    &:hover {
      background-color: var(--el-fill-color-light) !important;
    }
  }
  
  .el-dropdown-menu__item--divided {
    margin-top: 2px !important;
    border-top: 1px solid var(--el-border-color-lighter) !important;
    padding-top: 6px !important;
  }
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
    transform: translate(-50%, -50%);
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
    transition: transform 0.2s ease;
    
    &:hover {
      transform: scale(1.02);
    }
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
    transition: transform 0.2s ease;
    
    &:hover {
      transform: scale(1.02);
    }
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
  
  &:hover {
    transform: translateY(-2px);
  }
  
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
  
  &:hover {
    transform: translateY(-1px);
  }
  
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
  color: #2563eb !important; /* 蓝色 */
  
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
  padding: 4px 8px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
  border-radius: 4px;
  border-left: 3px solid var(--el-color-primary);
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
    transform: scale(1.05);
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
  color: #303133;
}

.source-info-json {
  background: #f5f7fa;
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
</style>
