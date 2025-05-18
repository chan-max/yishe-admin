<template>
  <div class="p-8">
    <el-form :model="form" :rules="rules" label-width="140px" ref="formRef">
      <el-row>
        <span class="inline-title"> 产品分类 </span>
        <el-col :offset="0" :span="24">
          <el-card shadow="never">
            <el-form-item label="产品分类 :" prop="leafCatId" style="width: 100%;">
              <!-- <categoriesCascader :shopId="currentRow.shopId" @change="cascaderChange"></categoriesCascader> -->
              <el-select v-model="form.leafCatId" style="width: 640px" placeholder="请选择产品分类" @change="catIdChange">
                <el-option v-for="item in categories" :key="item.catId" :label="item.nodePath" :value="item.catId" />
              </el-select>
            </el-form-item>
          </el-card>
        </el-col>
      </el-row>

      <!-- <el-row>
        <span class="inline-title"> 产品分类 </span>
        <el-col :offset="0" :span="24">
          <el-card shadow="never">
            <el-form-item label="产品分类 :" prop="leafCatId" style="width: 100%;">
              <categoriesCascader :shopId="currentRow.shopId" @change="cascaderChange"></categoriesCascader>
            </el-form-item>
          </el-card>
        </el-col>
      </el-row> -->

      <span class="inline-title"> 产品属性 </span>
      <el-row>
        <el-col :offset="0" :span="24">
          <productProperty :config="productPropertyConfigData" :loading="productPropertyLoading"
            @change="productPropertyChange" ref="productPropertyRef"></productProperty>
        </el-col>
      </el-row>

      <span class="inline-title"> 产品信息 </span>
      <el-row>
        <el-col :offset="0" :span="24">
          <productInfo v-model="form.productInfo"></productInfo>
        </el-col>
      </el-row>
      <el-row>
        <span class="inline-title"> 变种属性 </span>
        <el-col :offset="0" :span="24">
          <el-card shadow="never" class="mr-4 w-full">
            <div>
              <productPropertyIsSale ref="productPropertyIsSaleRef" :config="productPropertyConfigData"
                :currentRow="currentRow" @change="productPropertyIsSaleChange" @size-change="(val) => {
                  form._size = val
                }"></productPropertyIsSale>

            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row v-if="goodsSize">
        <span class="inline-title"> 尺码表 </span>
        <el-col :offset="0" :span="24">
          <el-card shadow="never" class="mr-4 w-full">
            <el-form-item label="尺码表 :" required>
              <sizeTemplate :config="goodsSize" :size="form._size" @change="sizeTemplateChange" ref="sizeTemplateRef">
              </sizeTemplate>
            </el-form-item>
          </el-card>
        </el-col>
      </el-row>

      <el-row>
        <span class="inline-title"> 包装信息 </span>
        <el-col :offset="0" :span="24">
          <el-card shadow="never">
            <packageInfo v-model="form.productOuterPackageReq"></packageInfo>
            <el-form-item label="产品包装图:">
              <packageInfoImage v-model="form.productOuterPackageImageReqs" ref="packageInfoImageRef">
              </packageInfoImage>
            </el-form-item>
          </el-card>
        </el-col>
      </el-row>

      <span class="inline-title"> 产品描述 </span>
      <el-row>
        <!-- <producDescription></producDescription> -->
        <el-card shadow="never">
          <el-form-item label="产品描述 :">
            <productDescriptionTextarea v-model="form.goodsLayerDecorationReqs"></productDescriptionTextarea>
          </el-form-item>
        </el-card>
      </el-row>
      <el-row>
        <div class="flex w-full p-4">
          <div style="flex:1;"></div>
          <el-button type="primary" round @click="submit" :loading="saveLoading"> {{ saveLoading ? '正在保存' : '保存' }}
          </el-button>
        </div>
      </el-row>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { getTemuTemplateGoodsAttr, getTemuTemplateInitCategory, updateProductTemplate, getTemuTemplateGoodsSize } from '@/api/publish/template'
import categoriesCascader from './cascader.vue'
import productProperty from './productProperty/productProperty.vue'
import productPropertyIsSale from './productPropertyIsSale/productPropertyIsSale.vue'
import producDescription from './productDescription/index.vue'
import packageInfo from './packageInfo/index.vue'
import productInfo from './productInfo/index.vue'
import productDescriptionTextarea from './productDescription/productDescriptionTextarea/index.vue'
import packageInfoImage from './packageInfo/packageInfoImage.vue'
import sizeTemplate from './sizeTemplate/index.vue'

const props = defineProps({
  currentRow: {
  } as any,
  detailData: {
    default: {}
  }, // 详情数据
})

const form = ref({
  leafCatId: '',

  // 用于辅助尺码表的尺码字符串信息
  _size: [],

  sizeTemplateInput: [],
  sizeTemplateSizeMeta:[],

  // 商品属性
  productPropertyReqs: [],

  productSpecPropertyReqs: [],   // 商品规格，先传空

  productOuterPackageReq: {
    "packageShape": 0,
    "packageType": 2
  } as any, // 包装信息


  // 产品包装图
  productOuterPackageImageReqs: [],

  // 变种属性
  productSkuReqs: [],

  productInfo: {
    extCode: '',
    region1ShortName: '',
    region2Id: null,
    outerGoodsUrl: '',
  }, // 产品信息

  "productSaleExtAttrReq": {
    // 定制工艺
    "customizedTechnologyReq": {}
  },

  goodsLayerDecorationReqs: [], // 产品描述富文本 !
})

// 商品属性
const productPropertyConfigData = ref([])



// async function cascaderChange(val, isLeaf, postData) {
//   initGoodsAttr({
//     shopId: props.currentRow.shopId,
//     leafCatId: val[val.length - 1]
//   })
// }


const categories = ref([])

async function initInitCategory() {
  const res = await getTemuTemplateInitCategory({})
  categories.value = res
}

initInitCategory()

const productPropertyLoading = ref(false)

async function initGoodsAttr(data) {
  productPropertyLoading.value = true
  const info = await getTemuTemplateGoodsAttr(data)
  productPropertyConfigData.value = info
  productPropertyLoading.value = false
}

function catIdChange(id) {
  initGoodsAttr({
    shopId: props.currentRow.shopId,
    leafCatId: id
  })
  initGoodsSize({
    shopId: props.currentRow.shopId,
    catId: id
  })
}

const rules = {
  leafCatId: [{ required: true, message: "请选择分类", trigger: "blur" }],
}

const formRef = ref()

// 变种属性表单发生变化  , 用我的结构转成后台的结构
function productPropertyIsSaleChange(val) {
  form.value.productSkuReqs = val
}


// 商品尺码表

const sizeTemplateRef = ref()

function sizeTemplateChange(records,sizeMeta) {
  form.value.sizeTemplateInput = records
  form.value.sizeTemplateSizeMeta = sizeMeta
}

const goodsSize = ref([])
async function initGoodsSize(params) {
  let res = await getTemuTemplateGoodsSize(params)
  goodsSize.value = res
}

// 商品属性改变时触发
function productPropertyChange(val) {
  form.value.productPropertyReqs = val
}

// 变种属性的ref实例, 用于校验
const productPropertyIsSaleRef = ref()

// 商品属性校验
const productPropertyRef = ref()

const saveLoading = ref(false)
async function submit() {
  await formRef.value.validate()
  await productPropertyIsSaleRef.value.validate()
  await productPropertyRef.value.validate()

  const sizeTemplate = {
    "meta": {
      // "elements": [
      //   { id: 20002, name: "高", unit: "cm" },
      //   { id: 20003, name: "宽", unit: "cm" },
      //   { id: 20004, name: "长", unit: "cm" }
      // ],
      elements: form.value.sizeTemplateSizeMeta,
      "groups": [
        {
          "name": "自定义尺码",
          "unnecessary": false,
          "id": 101
        }
      ]
    }, // 写死 
    "records": goodsSize.value ? form.value.sizeTemplateInput.map((item) => {
      return {
        values: item
      }
    }) : null,
    "generalSizeType": 101, // 写死
    "localSizeSource": 1 // 写死
  }

  const post = {
    leafCatId: form.value.leafCatId,
    productPropertyReqs: form.value.productPropertyReqs, // 商品属性
    productSpecPropertyReqs: [],    // 商品规格，先传空
    // 货品销售域扩展属性请求
    productSaleExtAttrReq: {
      // 定制工艺
      customizedTechnologyReq: {} // 暂时先不填
    },
    // 主商品SKU规格 传默认值
    "mainProductSkuSpecReqs": [
      {
        "parentSpecId": 0,
        "parentSpecName": "",
        "specId": 0,
        "specName": ""
      }
    ],

    // 变种属性
    productSkuReqs: form.value.productSkuReqs,
    // productSkuReqs: [],
    // 尺码表信息
    sizeTemplate: sizeTemplate,

    // 包装信息
    productOuterPackageReq: form.value.productOuterPackageReq,
    // 产品包装图
    productOuterPackageImageReqs: form.value.productOuterPackageImageReqs,
    // SKC货号
    extCode: form.value.productInfo.extCode,
    "productWhExtAttrReq": {
      // 站外商品链接
      "outerGoodsUrl": form.value.productInfo.outerGoodsUrl,
      // 货品产地
      "productOrigin": {
        "region1ShortName": form.value.productInfo.region1ShortName || 'CN',
        "region2Id": form.value.productInfo.region2Id,
      }
    },
    goodsLayerDecorationReqs: form.value.goodsLayerDecorationReqs,
  }

  saveLoading.value = true
  await updateProductTemplate({
    id: props.currentRow.id,
    templateTemu: post
  }).finally(() => {
    saveLoading.value = false
  });

  ElMessage.success("更新成功");
}

// 外包装组件引用
const packageInfoImageRef = ref()

// 初始化反显
async function init() {
  let data = props.detailData as any
  form.value.leafCatId = data.leafCatId
  // 根据
  if (form.value.leafCatId) {
    // 获取商品属性后再初始化
    await initGoodsSize({
      shopId: props.currentRow.shopId,
      catId: form.value.leafCatId,
    })

    await initGoodsAttr({
      shopId: props.currentRow.shopId,
      leafCatId: form.value.leafCatId,
    })

    productPropertyRef.value.init(data.productPropertyReqs || [])

  }

  // 商品描述
  form.value.goodsLayerDecorationReqs = data.goodsLayerDecorationReqs || []

  // 包装信息
  form.value.productOuterPackageReq = data.productOuterPackageReq || {}

  form.value.productInfo.extCode = data.extCode
  form.value.productInfo.region1ShortName = data?.productWhExtAttrReq?.productOrigin?.region1ShortName || 'CN'
  form.value.productInfo.region2Id = data?.productWhExtAttrReq?.productOrigin?.region2Id ? Number(data?.productWhExtAttrReq?.productOrigin?.region2Id) : null
  form.value.productInfo.outerGoodsUrl = data?.productWhExtAttrReq?.outerGoodsUrl

  // 初始化包装图
  form.value.productOuterPackageImageReqs = data?.productOuterPackageImageReqs || []
  await nextTick()
  // 初始化变种属性，让其转换为可以展示的结构
  productPropertyIsSaleRef.value.initFormat(data.productSkuReqs)

  // 初始化尺码表
  sizeTemplateRef.value?.init(data?.sizeTemplate?.records?.map((item) => {
    return item.values
  }))
}

init()
</script>

<style lang="less" scoped>
.inline-title {
  display: block;
  padding: 12px 0 12px 8px;
  font-size: 1.2em;
  // border-bottom: 1px solid var(--el-color-primary);
}
</style>