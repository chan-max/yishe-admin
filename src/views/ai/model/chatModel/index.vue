<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="模型名字" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入模型名字"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="模型标识" prop="model">
        <el-input
          v-model="queryParams.model"
          placeholder="请输入模型标识"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="模型平台" prop="platform">
        <el-input
          v-model="queryParams.platform"
          placeholder="请输入模型平台"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['ai:chat-model:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="所属平台" align="center" prop="platform">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AI_PLATFORM" :value="scope.row.platform" />
        </template>
      </el-table-column>
      <el-table-column label="模型名字" align="center" prop="name" />
      <el-table-column label="模型标识" align="center" prop="model" />
      <el-table-column label="API 秘钥" align="center" prop="keyId" min-width="140">
        <template #default="scope">
          <span>{{ apiKeyList.find((item) => item.id === scope.row.keyId)?.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sort" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="温度参数" align="center" prop="temperature" />
      <el-table-column label="回复数 Token 数" align="center" prop="maxTokens" min-width="140" />
      <el-table-column label="上下文数量" align="center" prop="maxContexts" />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['ai:chat-model:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['ai:chat-model:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.currentPage"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <ChatModelForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { ChatModelApi, ChatModelVO } from '@/api/ai/model/chatModel'
import ChatModelForm from './ChatModelForm.vue'
import { DICT_TYPE } from '@/utils/dict'
import { ApiKeyApi, ApiKeyVO } from '@/api/ai/model/apiKey'

/** API 聊天模型 列表 */
defineOptions({ name: 'AiChatModel' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<ChatModelVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  currentPage: 1,
  pageSize: 10,
  name: undefined,
  model: undefined,
  platform: undefined
})
const queryFormRef = ref() // 搜索的表单
const apiKeyList = ref([] as ApiKeyVO[]) // API 密钥列表

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ChatModelApi.getChatModelPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.currentPage = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ChatModelApi.deleteChatModel(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(async () => {
  getList()
  // 获得下拉数据
  apiKeyList.value = await ApiKeyApi.getApiKeySimpleList()
})
</script>
