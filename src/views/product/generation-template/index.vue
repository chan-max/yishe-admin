<script setup lang="ts">
import { computed, onMounted, reactive, ref, watchEffect } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useWindowSize } from "@vueuse/core";
import { ContentWrap } from "@/components/ContentWrap";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import { buildOperationColumn, commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { productGenerationTemplateApi } from "@/api/product-generation-template";

const loading = ref(false);
const submitLoading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const queryParams = reactive({
  page: 1,
  pageSize: 20,
  searchText: "",
});

const { height } = useWindowSize();
const gridMaxHeight = ref(0);
watchEffect(() => {
  gridMaxHeight.value = height.value - 220;
});

const formatMoney = (value: any) => {
  const amount = Number(value || 0);
  return amount > 0 ? amount.toFixed(2) : "-";
};

const gridOptions = computed(() => ({
  ...commonGridOptions,
  maxHeight: gridMaxHeight.value,
  columns: [
    { field: "name", title: "模板名称", minWidth: 160 },
    { field: "productType", title: "商品类型", minWidth: 120 },
    { field: "price", title: "原价", width: 100, formatter: ({ cellValue }) => formatMoney(cellValue) },
    { field: "salePrice", title: "售价", width: 100, formatter: ({ cellValue }) => formatMoney(cellValue) },
    { field: "stock", title: "库存", width: 90 },
    { field: "tags", title: "标签", minWidth: 180, showOverflow: true },
    {
      field: "autoPublish",
      title: "自动发布",
      width: 100,
      formatter: ({ cellValue }) => (cellValue === false ? "否" : "是"),
    },
    {
      field: "isActive",
      title: "状态",
      width: 90,
      formatter: ({ cellValue }) => (cellValue === false ? "停用" : "启用"),
    },
    {
      field: "uploader",
      title: "创建者",
      minWidth: 110,
      formatter: ({ row }) => row?.uploader?.account || row?.uploader?.name || row?.userId || "-",
    },
    {
      field: "createTime",
      title: "创建时间",
      width: 160,
      formatter: ({ cellValue }) => formatTimestamp(cellValue),
    },
    buildOperationColumn("action"),
  ],
}));

const getList = async () => {
  loading.value = true;
  try {
    const res = await productGenerationTemplateApi.getList(queryParams);
    tableData.value = Array.isArray(res?.list) ? res.list : [];
    total.value = Number(res?.total || 0);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  queryParams.page = 1;
  getList();
};

const resetQuery = () => {
  queryParams.searchText = "";
  handleSearch();
};

const dialogVisible = ref(false);
const dialogTitle = ref("");
const formRef = ref();
const form = reactive<any>({
  id: "",
  name: "",
  productType: "",
  titlePrompt: "",
  aiPrompt: "",
  descriptionPrompt: "",
  keywordPrompt: "",
  seoPrompt: "",
  tags: "",
  price: 0,
  salePrice: 0,
  stock: 0,
  specificationsText: "",
  imagePolicyText: "",
  autoPublish: true,
  isActive: true,
});

const rules = {
  name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
};

const resetForm = () => {
  Object.assign(form, {
    id: "",
    name: "",
    productType: "",
    titlePrompt: "",
    aiPrompt: "",
    descriptionPrompt: "",
    keywordPrompt: "",
    seoPrompt: "",
    tags: "",
    price: 0,
    salePrice: 0,
    stock: 0,
    specificationsText: "",
    imagePolicyText: "",
    autoPublish: true,
    isActive: true,
  });
};

const handleAdd = () => {
  resetForm();
  dialogTitle.value = "新增商品生成模板";
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  resetForm();
  Object.assign(form, {
    ...row,
    price: Number(row.price || 0),
    salePrice: Number(row.salePrice || 0),
    stock: Number(row.stock || 0),
    specificationsText: row.specifications ? JSON.stringify(row.specifications, null, 2) : "",
    imagePolicyText: row.imagePolicy ? JSON.stringify(row.imagePolicy, null, 2) : "",
    autoPublish: row.autoPublish !== false,
    isActive: row.isActive !== false,
  });
  dialogTitle.value = "编辑商品生成模板";
  dialogVisible.value = true;
};

const parseJsonText = (text: string, label: string) => {
  const raw = String(text || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${label} 必须是合法 JSON`);
  }
};

const submitForm = async () => {
  if (!formRef.value) return;
  submitLoading.value = true;
  try {
    await formRef.value.validate();
    const payload = {
      ...form,
      specifications: parseJsonText(form.specificationsText, "规格配置"),
      imagePolicy: parseJsonText(form.imagePolicyText, "图片策略"),
    };
    delete payload.specificationsText;
    delete payload.imagePolicyText;
    if (payload.id) {
      await productGenerationTemplateApi.update(payload);
      ElMessage.success("更新成功");
    } else {
      delete payload.id;
      await productGenerationTemplateApi.add(payload);
      ElMessage.success("创建成功");
    }
    dialogVisible.value = false;
    getList();
  } catch (error: any) {
    ElMessage.error(error?.message || "保存失败");
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确认删除商品生成模板“${row.name}”吗？`, "提示", {
    type: "warning",
    confirmButtonText: "确定",
    cancelButtonText: "取消",
  });
  await productGenerationTemplateApi.delete(row.id);
  ElMessage.success("删除成功");
  getList();
};

onMounted(getList);
</script>

<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="product-generation-template-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
                <el-form-item label="关键词">
                  <el-input
                    v-model="queryParams.searchText"
                    size="small"
                    clearable
                    placeholder="搜索模板名称/商品类型/标签"
                    @keyup.enter="handleSearch"
                    @clear="handleSearch"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" :loading="loading" @click="handleSearch">搜索</el-button>
              <el-button size="small" :disabled="loading" @click="resetQuery">重置</el-button>
              <el-button size="small" type="primary" @click="handleAdd">新增模板</el-button>
            </div>
          </el-form>
        </div>
      </template>

      <template #table>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat">
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid v-bind="gridOptions" :data="tableData" :loading="loading">
                <template #action="{ row }">
                  <el-dropdown class="operation-dropdown" placement="bottom-end">
                    <el-button type="primary" link size="small" class="operation-trigger-button">操作</el-button>
                    <template #dropdown>
                      <el-dropdown-menu class="operation-menu-compact">
                        <el-dropdown-item @click="handleEdit(row)">编辑</el-dropdown-item>
                        <el-dropdown-item divided class="operation-menu-item--danger" @click="handleDelete(row)">删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
              </vxe-grid>
            </div>
          </div>
        </div>
      </template>

      <template #pagination>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel__pagination list-page-table-panel__pagination--flat">
          <pagination
            v-model:page="queryParams.page"
            v-model:limit="queryParams.pageSize"
            :total="total"
            @pagination="getList"
          />
        </div>
      </template>
    </ListPageLayout>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="76%" top="5vh">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="form.name" placeholder="例如：鼠标垫独立站模板" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品类型">
              <el-input v-model="form.productType" placeholder="例如：鼠标垫" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="原价">
              <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="售价">
              <el-input-number v-model="form.salePrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="库存">
              <el-input-number v-model="form.stock" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="标签">
              <el-input v-model="form.tags" placeholder="多个标签用逗号分隔" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="标题提示词">
              <el-input v-model="form.titlePrompt" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="AI提示词">
              <el-input v-model="form.aiPrompt" type="textarea" :rows="4" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="描述提示词">
              <el-input v-model="form.descriptionPrompt" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关键词提示词">
              <el-input v-model="form.keywordPrompt" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="SEO提示词">
              <el-input v-model="form.seoPrompt" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格配置">
              <el-input v-model="form.specificationsText" type="textarea" :rows="4" placeholder='JSON，例如 {"options":[]}' />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图片策略">
              <el-input v-model="form.imagePolicyText" type="textarea" :rows="4" placeholder='JSON，例如 {"usePsdImagesAsDetailImages":true}' />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生成后发布">
              <el-switch v-model="form.autoPublish" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用">
              <el-switch v-model="form.isActive" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<style scoped>
:deep(.product-generation-template-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.product-generation-template-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.product-generation-template-page .list-page-filter--flat) {
  padding-bottom: 10px;
}

:deep(.product-generation-template-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}
</style>
