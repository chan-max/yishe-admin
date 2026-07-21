<template>
  <div class="open-docs-container">
    <ContentWrap :plain="true">
      <div class="docs-wrapper">
        <!-- 头部说明栏 -->
        <div class="docs-header">
          <div class="header-left">
            <h2 class="docs-title">开放接口文档</h2>
            <el-tag type="info" size="small" effect="plain">v1.0.0</el-tag>
          </div>
          <div class="header-right">
            <span>基础地址:</span>
            <code class="endpoint-text">https://design.1s.com/api</code>
          </div>
        </div>

        <!-- 页面内垂直菜单 + 详情区（通过页内 v-menu 进行模块扩展） -->
        <div class="docs-main-layout">
          <!-- 左侧页内垂直菜单 (el-menu 形式，极其方便未来扩充新接口与分组) -->
          <aside class="docs-v-menu">
            <el-menu
              :default-active="activeApiId"
              class="v-menu-instance"
              @select="handleMenuSelect"
            >
              <el-menu-item-group title="基础指引">
                <el-menu-item index="auth">
                  <span>凭证与 Header 认证</span>
                </el-menu-item>
              </el-menu-item-group>

              <el-menu-item-group title="商品开放接口">
                <el-menu-item index="get-products">
                  <span>开放商品列表</span>
                </el-menu-item>
                <el-menu-item index="get-product-detail">
                  <span>单个商品详情</span>
                </el-menu-item>
                <el-menu-item index="get-categories">
                  <span>商品分类目录</span>
                </el-menu-item>
              </el-menu-item-group>

              <el-menu-item-group title="通用规范">
                <el-menu-item index="status-codes">
                  <span>状态码与响应说明</span>
                </el-menu-item>
              </el-menu-item-group>
            </el-menu>
          </aside>

          <!-- 右侧当前选择的接口内容与详情 -->
          <main class="docs-detail-panel">
            <!-- 1. 凭证与 Header 认证 -->
            <div v-if="activeApiId === 'auth'" class="api-detail-block">
              <h3 class="detail-title">凭证与 Header 认证</h3>
              <p class="section-desc">
                在调用开放接口前，请在【开放用户管理】中创建开放用户并获取专用的 <code>x-app-key</code> 和 <code>x-app-secret</code>。所有接口均要求在 Header 中携带验证凭证。
              </p>

              <!-- 测试拼接区 -->
              <div class="tester-clean-bar">
                <span class="label-text">测试拼接：</span>
                <el-input v-model="testKey" placeholder="x-app-key" size="small" class="input-item" />
                <el-input v-model="testSecret" placeholder="x-app-secret" size="small" type="password" show-password class="input-item" />
                <el-button size="small" type="primary" link @click="handleCopy(curlGeneratedCode)">
                  {{ copiedText === curlGeneratedCode ? '已复制 ✓' : '复制 cURL' }}
                </el-button>
              </div>

              <div class="code-clean-box">
                <pre class="code-text"><code>{{ curlGeneratedCode }}</code></pre>
              </div>

              <div class="table-block">
                <div class="table-title">HTTP Request Headers 规范</div>
                <el-table :data="headerRows" size="small" style="width: 100%">
                  <el-table-column prop="name" label="Header 字段" width="200">
                    <template #default="{ row }">
                      <code class="param-code">{{ row.name }}</code>
                    </template>
                  </el-table-column>
                  <el-table-column prop="example" label="示例值" width="240" />
                  <el-table-column prop="desc" label="说明" />
                </el-table>
              </div>
            </div>

            <!-- 2. 开放商品列表 -->
            <div v-else-if="activeApiId === 'get-products'" class="api-detail-block">
              <div class="detail-header-row">
                <h3 class="detail-title">开放商品列表</h3>
                <div class="api-meta-clean">
                  <el-tag type="success" size="small">GET</el-tag>
                  <code class="endpoint-text">/api/public-user/products</code>
                </div>
              </div>
              <p class="section-desc">分页查询独立站上架开放销售的商品列表。</p>

              <div class="table-block">
                <div class="table-title">Query 请求参数</div>
                <el-table :data="getProductsParams" size="small" style="width: 100%">
                  <el-table-column prop="name" label="参数名" width="180">
                    <template #default="{ row }">
                      <code class="param-code">{{ row.name }}</code>
                    </template>
                  </el-table-column>
                  <el-table-column prop="type" label="类型" width="100" />
                  <el-table-column prop="required" label="必填" width="80">
                    <template #default="{ row }">
                      <span :class="row.required ? 'text-red-500 font-medium' : 'text-gray-400'">
                        {{ row.required ? '是' : '否' }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="desc" label="说明" />
                </el-table>
              </div>

              <div class="table-block">
                <div class="table-title-row">
                  <span class="table-title">响应示例 (JSON)</span>
                  <el-button size="small" type="primary" link @click="handleCopy(productsJsonResponse)">
                    {{ copiedText === productsJsonResponse ? '已复制 ✓' : '复制 JSON' }}
                  </el-button>
                </div>
                <div class="code-clean-box">
                  <pre class="code-text"><code>{{ productsJsonResponse }}</code></pre>
                </div>
              </div>
            </div>

            <!-- 3. 单个商品详情 -->
            <div v-else-if="activeApiId === 'get-product-detail'" class="api-detail-block">
              <div class="detail-header-row">
                <h3 class="detail-title">单个商品详情</h3>
                <div class="api-meta-clean">
                  <el-tag type="success" size="small">GET</el-tag>
                  <code class="endpoint-text">/api/public-user/products/:id</code>
                </div>
              </div>
              <p class="section-desc">根据商品 ID 获取指定开放商品的完整属性及渲染图片。</p>

              <div class="table-block">
                <div class="table-title">Path 路径参数</div>
                <el-table :data="getProductDetailParams" size="small" style="width: 100%">
                  <el-table-column prop="name" label="参数名" width="180">
                    <template #default="{ row }">
                      <code class="param-code">{{ row.name }}</code>
                    </template>
                  </el-table-column>
                  <el-table-column prop="type" label="类型" width="100" />
                  <el-table-column prop="required" label="必填" width="80">
                    <template #default="{ row }">
                      <span class="text-red-500 font-medium">是</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="desc" label="说明" />
                </el-table>
              </div>

              <div class="table-block">
                <div class="table-title-row">
                  <span class="table-title">响应示例 (JSON)</span>
                  <el-button size="small" type="primary" link @click="handleCopy(productDetailJsonResponse)">
                    {{ copiedText === productDetailJsonResponse ? '已复制 ✓' : '复制 JSON' }}
                  </el-button>
                </div>
                <div class="code-clean-box">
                  <pre class="code-text"><code>{{ productDetailJsonResponse }}</code></pre>
                </div>
              </div>
            </div>

            <!-- 4. 商品分类目录 -->
            <div v-else-if="activeApiId === 'get-categories'" class="api-detail-block">
              <div class="detail-header-row">
                <h3 class="detail-title">商品分类目录</h3>
                <div class="api-meta-clean">
                  <el-tag type="success" size="small">GET</el-tag>
                  <code class="endpoint-text">/api/public-user/categories</code>
                </div>
              </div>
              <p class="section-desc">查询开放商品的分类目录与层级结构。</p>

              <div class="table-block">
                <div class="table-title-row">
                  <span class="table-title">响应示例 (JSON)</span>
                  <el-button size="small" type="primary" link @click="handleCopy(categoriesJsonResponse)">
                    {{ copiedText === categoriesJsonResponse ? '已复制 ✓' : '复制 JSON' }}
                  </el-button>
                </div>
                <div class="code-clean-box">
                  <pre class="code-text"><code>{{ categoriesJsonResponse }}</code></pre>
                </div>
              </div>
            </div>

            <!-- 5. 状态码与响应说明 -->
            <div v-else-if="activeApiId === 'status-codes'" class="api-detail-block">
              <h3 class="detail-title">状态码与响应说明</h3>
              <p class="section-desc">系统接口统一采用 HTTP 状态码搭配 JSON code 字段标识请求状态。</p>

              <el-table :data="statusCodeRows" size="small" style="width: 100%">
                <el-table-column prop="http" label="HTTP Status" width="180">
                  <template #default="{ row }">
                    <code class="param-code">{{ row.http }}</code>
                  </template>
                </el-table-column>
                <el-table-column prop="code" label="Error Code" width="220" />
                <el-table-column prop="desc" label="含义说明" />
              </el-table>
            </div>
          </main>
        </div>
      </div>
    </ContentWrap>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import ContentWrap from '@/components/ContentWrap/src/ContentWrap.vue'

const activeApiId = ref('auth')
const testKey = ref('app_yishe_open_key')
const testSecret = ref('sec_yishe_open_secret')
const copiedText = ref('')

function handleMenuSelect(index: string) {
  activeApiId.value = index
}

function handleCopy(text: string) {
  navigator.clipboard.writeText(text)
  copiedText.value = text
  ElMessage.success('已复制到剪贴板')
  setTimeout(() => {
    copiedText.value = ''
  }, 2000)
}

const curlGeneratedCode = computed(() => {
  return `curl -X GET "https://design.1s.com/api/public-user/products?page=1&pageSize=20" \\
  -H "x-app-key: ${testKey.value || 'YOUR_APP_KEY'}" \\
  -H "x-app-secret: ${testSecret.value || 'YOUR_APP_SECRET'}" \\
  -H "Content-Type: application/json"`
})

const headerRows = [
  { name: 'x-app-key', example: 'app_yishe_open_key', desc: '开放用户唯一标识凭证' },
  { name: 'x-app-secret', example: 'sec_yishe_open_secret', desc: '接口签名与校验密钥' },
  { name: 'Content-Type', example: 'application/json', desc: '统一请求数据类型' }
]

const getProductsParams = [
  { name: 'page', type: 'number', required: false, desc: '页码，默认从 1 开始' },
  { name: 'pageSize', type: 'number', required: false, desc: '每页条数，默认 20，最大 50' },
  { name: 'searchText', type: 'string', required: false, desc: '搜索关键词或商品编码' }
]

const getProductDetailParams = [
  { name: 'id', type: 'string', required: true, desc: '商品记录 ID（例如 prod_1001）' }
]

const productsJsonResponse = `{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "prod_1001",
        "title": "印花宠物地垫 POD商品",
        "code": "6174",
        "price": 9.99,
        "stock": 999,
        "productType": "印花地垫",
        "psdSetId": "psd_set_8812",
        "coverUrl": "https://img.yishe.com/preview/prod_1001.png",
        "createTime": "2026-07-21 15:00:00"
      }
    ],
    "total": 1,
    "currentPage": 1,
    "pageSize": 20
  }
}`

const productDetailJsonResponse = `{
  "code": 200,
  "message": "success",
  "data": {
    "id": "prod_1001",
    "title": "印花宠物地垫 POD商品",
    "code": "6174",
    "price": 9.99,
    "stock": 999,
    "productType": "印花地垫",
    "description": "加厚面料，超清热转印工艺",
    "images": [
      "https://img.yishe.com/preview/prod_1001_1.png",
      "https://img.yishe.com/preview/prod_1001_2.png"
    ],
    "psdSet": {
      "id": "psd_set_8812",
      "name": "地垫套图方案",
      "status": "completed"
    }
  }
}`

const categoriesJsonResponse = `{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "cat_101",
      "name": "家居软装",
      "children": [
        { "id": "cat_101_1", "name": "印花地垫" },
        { "id": "cat_101_2", "name": "定制抱枕" }
      ]
    }
  ]
}`

const statusCodeRows = [
  { http: '200 OK', code: 'SUCCESS', desc: '请求处理成功' },
  { http: '400 Bad Request', code: 'INVALID_PARAMS', desc: '参数错误或缺失必要字段' },
  { http: '401 Unauthorized', code: 'AUTH_FAILED', desc: '凭证无效或 x-app-key / secret 缺失' },
  { http: '403 Forbidden', code: 'ACCESS_DENIED', desc: '开放用户无权访问对应的资源项目' },
  { http: '404 Not Found', code: 'NOT_FOUND', desc: '指定 ID 的商品或资源不存在' }
]
</script>

<style scoped>
.open-docs-container {
  padding: 0;
}

.docs-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.docs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-wrap: wrap;
  gap: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.docs-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: var(--el-text-color-primary);
}

.header-right {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.endpoint-text {
  font-family: monospace;
  font-size: 13px;
  color: var(--el-color-primary);
  font-weight: 600;
}

.docs-main-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.docs-v-menu {
  width: 210px;
  flex-shrink: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
}

.v-menu-instance {
  border-right: none;
}

:deep(.v-menu-instance .el-menu-item-group__title) {
  padding: 10px 14px 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
}

:deep(.v-menu-instance .el-menu-item) {
  height: 38px;
  line-height: 38px;
  font-size: 13px;
}

.docs-detail-panel {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 16px;
}

.api-detail-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.detail-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: var(--el-text-color-primary);
}

.section-desc {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin: 0;
  line-height: 1.5;
}

.api-meta-clean {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tester-clean-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.label-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.input-item {
  width: 180px;
}

.table-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.table-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.param-code {
  font-family: monospace;
  font-size: 12px;
  color: var(--el-color-primary);
}

.code-clean-box {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px 12px;
}

.code-text {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
}

@media (max-width: 800px) {
  .docs-main-layout {
    flex-direction: column;
  }
  .docs-v-menu {
    width: 100%;
  }
}
</style>
