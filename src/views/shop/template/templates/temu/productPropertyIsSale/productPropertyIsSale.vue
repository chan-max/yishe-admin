<template>

  <div class="flex flex-col gap-6">
    <template v-for="item, index in config.properties?.filter((item) => item.isSale)">
      <template v-if="components['controlTypeComponent' + item.controlType]">
        <component :is="components['controlTypeComponent' + item.controlType]" :config="item"
          @change="change($event, index)" v-if="showComponent(config.properties[index])"></component>
      </template>
      <template>
        --
      </template>
    </template>
  </div>

  <div class="flex flex-col gap-4">
    <div v-for="parentSpecFormItem, index in parentSpecForm" class="flex flex-col gap-4">
      <div class="flex gap-4">
        <div v-for="item, i in parentSpecFormItem.children" class="flex items-center gap-0">
          <el-tag round type="info" size="large">
            <span>
              {{ item }}
            </span>
          </el-tag>
          <el-button :icon="CloseBold" type="danger" link size="small" @click="() => {
            parentSpecFormItem.children.splice(i, 1)
            initTable()
          }"></el-button>
        </div>
      </div>
      <div class="flex gap-4">
        <el-select v-model="parentSpecForm[index].parentSpecId" style="width: 160px" placeholder="选择规格">
          <el-option v-for="item in parentSpec" :key="item.parentSpecId" :label="item.parentSpecName"
            :value="item.parentSpecId" />
        </el-select>
        <el-input v-model="parentSpecForm[index].input" placeholder="请添加子规格" style="width: 320px"> </el-input>
        <el-button type="primary" :disabled="!parentSpecFormItem.parentSpecId" @click="() => {
          if (!parentSpecForm[index].input) {
            return
          }
          if (parentSpecFormItem.children.includes(parentSpecForm[index].input)) {
            return ElMessage.warning('子规格已存在')
          }
          parentSpecFormItem.children.push(parentSpecForm[index].input)
          initTable()
          parentSpecFormItem.input = ''
        }"> 添加 </el-button>
      </div>
    </div>
  </div>

  <div class="pt-8">
    <el-table :data="tableData" style="width: 100%">
      <!-- 自定义属性的列 -->
      <template v-for="pf in parentSpecForm">
        <el-table-column v-if="pf.children.length" :label="getNameByParentSpecId(pf.parentSpecId)"
          :prop="pf.parentSpecId">
        </el-table-column>
      </template>
      <!-- <el-table-column label="SKU货号" prop="name" width="180">
        <template #default="scope">
          <el-input placeholder="请输入" v-model="scope.row.sku"></el-input>
        </template>
      </el-table-column> -->
      <el-table-column label="尺寸图名称" prop="thumbKey" width="180">
        <template #header>
          <span class="required-star">*</span>尺寸图名称
        </template>
        <template #default="scope">
          <el-input type="number" min="0" v-model="scope.row.thumbKey" placeholder="请输入"></el-input>
        </template>
      </el-table-column>
      <el-table-column label="申报价格(CNY)" prop="supplierPrice" width="180">
        <template #header>
          <span class="required-star">*</span>申报价格(CNY)
        </template>
        <template #default="scope">
          <el-input type="number" min="0" v-model="scope.row.supplierPrice" placeholder="请输入"></el-input>
        </template>
      </el-table-column>

      <el-table-column label="尺寸(cm)" width="280">
        <template #header>
          <span class="required-star">*</span>尺寸(cm)
        </template>
        <template #default="scope">
          <div class="flex gap-2 items-center ">
            <el-input v-model="scope.row.len" type="number" min="0" placeholder="长"></el-input>
            <el-input v-model="scope.row.width" type="number" min="0" placeholder="宽"></el-input>
            <el-input v-model="scope.row.height" type="number" min="0" placeholder="高"></el-input>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="重量(g)" width="120">
        <template #header>
          <span class="required-star">*</span>重量(g)
        </template>
        <template #default="scope">
          <el-input v-model="scope.row.productSkuWeightReq" type="number" min="0" placeholder="请输入"></el-input>
        </template>
      </el-table-column>
      <el-table-column label="建议售价" width="180">
        <template #header>
          建议售价
        </template>
        <template #default="scope">
          <el-input v-model="scope.row.suggestedPrice" type="number"  placeholder="请输入">
            <template #append>
              CNY
            </template>
          </el-input>
        </template>
      </el-table-column>
      <el-table-column label="SKU分类" width="480">
        <template #default="scope">
          <div class="flex gap-2">
            <el-select placeholder="品类" v-model="scope.row.skuClassification" @change="(val) => {
              // 单品只能有一件
              if (val == '1') {
                scope.row.numberOfPieces = 1
              }
            }">
              <el-option v-for="item in sku1" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-select placeholder="包装" v-model="scope.row.individuallyPacked"
              v-if="scope.row.skuClassification == 2 || scope.row.skuClassification == 3">
              <el-option v-for="item in sku2" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-input placeholder="数量" type="number" min="0" v-model="scope.row.numberOfPieces"
              :disabled="scope.row.skuClassification == 1"></el-input>
            <el-select placeholder="单位" v-model="scope.row.pieceUnitCode">
              <el-option v-for="item in sku3" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { CloseBold, Delete } from '@element-plus/icons-vue'
import controlTypeComponent0 from '../productProperty/controlTypeComponents/controlTypeComponent0.vue'
import controlTypeComponent1 from '../productProperty/controlTypeComponents/controlTypeComponent1.vue'
import controlTypeComponent16 from '../productProperty/controlTypeComponents/controlTypeComponent16.vue'
import { getTemuTemplateParentSpec } from '@/api/publish/template'
import { useDebounceFn } from '@vueuse/core'

/**
 * 示例
*/

/**
 * 价格 * 100
 * 长宽高 * 10
 * 重量 * 1000
*/

const components = {
  controlTypeComponent1,
  controlTypeComponent0,
  controlTypeComponent16,
}

const props = defineProps({
  config: {
  } as any,
  currentRow: {
    default: {}
  }
})

const emits = defineEmits(['change', 'sizeChange'])

const form = ref([])

const flatedForm = computed(() => {
  return form.value.flat()
})

function showComponent(c) {
  let ptid = c.parentTemplatePid

  if (ptid == 0) {
    return true
  }

  // 存在限制父节点

  let p = props.config.properties.find((item) => item.templatePid == ptid)

  if (!p) {
    return
  }

  // 判断 父节点的值是否选中
  flatedForm

  let pSameValue = flatedForm.value.find((item) => {
    return item?.templatePid == p.templatePid
  })

  if (!pSameValue?.vid) {
    return false
  }

  if (!c.templatePropertyValueParentList) {
    return false
  }

  let isSelect = c.templatePropertyValueParentList.some((item) => {

    let parentVidList = item.parentVidList

    let eq = parentVidList.some((ite) => {
      return pSameValue.vid == ite
    })

    return eq
  })

  return isSelect
}

function change($event, index) {
  form.value[index] = $event
  console.log('表单配置', JSON.stringify(form.value))
}


// 父子规格 变种属性
const parentSpecForm = ref([
  {
    parentSpecId: '',
    input: '',
    children: [], // spacName
  },
  {
    parentSpecId: '',
    input: '',
    children: [], // spacName
  }
])


const parentSpec = ref([])

async function initParentSpec() {
  const res = await getTemuTemplateParentSpec({
    shopId: props.currentRow.shopId
  })
  parentSpec.value = res

  // 设置默认值为 第一个和第二个

  if (parentSpecForm.value[0]?.parentSpecId) {
    parentSpecForm.value[0].parentSpecId = res[0].parentSpecId
  }

  if (parentSpecForm.value?.[1]?.parentSpecId) {
    parentSpecForm.value[1].parentSpecId = res[1].parentSpecId
  }

}

initParentSpec()

function getNameByParentSpecId(id) {
  let target = parentSpec.value.find((item) => item.parentSpecId == id)
  return target?.parentSpecName
}

// 根据变种属性添加变种信息
function initTable() {
  let copy = [...tableData.value]
  tableData.value = []
  let p1 = parentSpecForm.value[0]
  let p2 = parentSpecForm.value[1]

  // 都没为空
  if (!p1.children.length && !p2.children.length) {
    return
  }

  let p1loop = p1.children.length || 1
  let p2loop = p2.children.length || 1



  for (let i = 0; i < p1loop; i++) {
    for (let j = 0; j < p2loop; j++) {
      // 这里可以使用旧的数据填充
      let row = {
      }
      let currentP1Child = p1.children[i]
      let currentP2Child = p2.children[j]
      row[p1.parentSpecId] = currentP1Child
      row[p2.parentSpecId] = currentP2Child

      // 复制一份
      let copyRow = copy.find((ite) => ite[p1.parentSpecId] == currentP1Child || ite[p2.parentSpecId] == currentP2Child)
      if (copyRow) {
        row = {
          ...copyRow,
          ...row
        }
      }

      tableData.value.push(row)
    }
  }
}

const tableData = ref([
])

// 3001 尺码需要特殊处理

const debounceChanger = useDebounceFn(() => {
  const s = getPostStruct()
  console.log('tableData', tableData.value, s)

  // 如果有尺码表需要
  const sizeItem = parentSpecForm.value.find((item) => item.parentSpecId == '3001')

  if (sizeItem) {
    emits('sizeChange', [...sizeItem.children])
  }


  emits('change', s)
}, 99)

onMounted(() => {
  watch(tableData, debounceChanger, {
    deep: true,
  })
})

const sku1 = ref([
  {
    label: '单品',
    value: 1
  },
  {
    label: '同款多件',
    value: 2
  },
  {
    label: '混合套装',
    value: 3
  },
])

const sku2 = ref([
  {
    label: '非独立包装',
    value: 0
  },
  {
    label: '独立包装',
    value: 1
  },
])

const sku3 = ref([
  {
    label: '件',
    value: 1
  },
  {
    label: '双',
    value: 2
  },
  {
    label: '独立包装',
    value: 3
  },
])

defineExpose({
  async validate() {
    tableData.value.forEach((row) => {
      if (!row.supplierPrice) {
        throw ElMessage.warning('申报价格不能为空')
      }
      if (!row.len) {
        throw ElMessage.warning('尺寸长不能为空')
      }
      if (!row.width) {
        throw ElMessage.warning('尺寸宽不能为空')
      }
      if (!row.height) {
        throw ElMessage.warning('尺寸高不能为空')
      }
      if (!row.productSkuWeightReq) {
        throw ElMessage.warning('重量不能为空')
      }
      if (!row.thumbKey) {
        throw ElMessage.warning('尺寸图名称不能为空')
      }
    })
  },

  // 初始化数据
  initFormat(productSkuReqs) {
    // 原始的返回数据

    if (!productSkuReqs?.length) {
      return
    }

    // 生成一个初始化表单
    let newParentRuleForm = [{
      parentSpecId: '',
      children: []
    }, {
      parentSpecId: '',
      children: []
    }]

    // 新的 tableData
    tableData.value = productSkuReqs.map((item, index) => {

      // 新的行

      const row = {
        thumbKey: item?.thumbKey,
        width: item?.productSkuWhExtAttrReq?.productSkuVolumeReq?.width ? item?.productSkuWhExtAttrReq?.productSkuVolumeReq?.width / 10 : null,
        height: item?.productSkuWhExtAttrReq?.productSkuVolumeReq?.height ? item?.productSkuWhExtAttrReq?.productSkuVolumeReq?.height /10 : null,
        individuallyPacked: item?.productSkuMultiPackReq?.individuallyPacked,
        len: item?.productSkuWhExtAttrReq?.productSkuVolumeReq?.len ? item?.productSkuWhExtAttrReq?.productSkuVolumeReq?.len / 10 : null,
        numberOfPieces: item?.productSkuMultiPackReq?.numberOfPieces,
        pieceUnitCode: item?.productSkuMultiPackReq?.pieceUnitCode,
        productSkuWeightReq: item?.productSkuWhExtAttrReq?.productSkuWeightReq?.value ? item?.productSkuWhExtAttrReq?.productSkuWeightReq?.value / 1000 : null,
        skuClassification: item?.productSkuMultiPackReq?.skuClassification,
        suggestedPrice: item?.productSkuSuggestedPriceReq?.suggestedPrice ? item?.productSkuSuggestedPriceReq?.suggestedPrice / 100 : null,
        supplierPrice: item?.supplierPrice ? item?.supplierPrice / 100 : null,
  
      }

      // 处理选择表单
      let itemArr = item.productSkuSpecReqs
      itemArr.forEach((it) => {
        let { parentSpecId, specName } = it

        row[parentSpecId] = specName

        let exist = newParentRuleForm.find((item) => item.parentSpecId == parentSpecId)

        if (!exist) {
          let currentItem = newParentRuleForm.find((item) => !item.parentSpecId)
          exist = currentItem
          exist.parentSpecId = Number(parentSpecId)
        }

        if (!exist.children.includes(specName)) {
          exist.children.push(specName)
        }
      })

      return row
    })

    parentSpecForm.value = newParentRuleForm
  }
})

// 获取发送到后台的结构
function getPostStruct() {
  return tableData.value.map((row) => {
    let p1 = parentSpecForm?.value?.[0]
    let p2 = parentSpecForm?.value?.[1]
    let p1Children = p1?.children
    let p2Children = p2?.children

    let items = []

    if (row[p1.parentSpecId]) {
      items.push({
        "parentSpecId": p1.parentSpecId,
        "parentSpecName": getNameByParentSpecId(p1.parentSpecId),
        "specName": row[p1.parentSpecId],
      })
    }

    if (row[p2.parentSpecId]) {
      items.push({
        "parentSpecId": p2.parentSpecId,
        "parentSpecName": getNameByParentSpecId(p2.parentSpecId),
        "specName": row[p2.parentSpecId],
      })
    }

    return {
      currencyType: "CNY",
      // 自定义的父规格
      productSkuSpecReqs: items,
      thumbKey: row.thumbKey,
      supplierPrice: row.supplierPrice * 100,
      productSkuMultiPackReq: {
        // 件数
        numberOfPieces: row.numberOfPieces,
        // 是否独立包装 非必填
        individuallyPacked: row.individuallyPacked,
        // 净含量 先传空
        productSkuNetContentReq: {},
        // sku分类，1：单品，2：同款多件装，3：混合套装
        skuClassification: row.skuClassification,
        // 单件单位，1：件，2：双，3：包
        pieceUnitCode: row.pieceUnitCode
      },
      productSkuSuggestedPriceReq: {
        // 特殊的建议价格
        suggestedPrice: row.suggestedPrice * 100,
        suggestedPricecurrencyType: 'CNY',

      },
      productSkuWhExtAttrReq: {
        // 重量
        productSkuWeightReq: {
          "value": row.productSkuWeightReq * 1000
        },
        // 敏感属性限制
        "productSkuSensitiveLimitReq": {},
        // 体积
        "productSkuVolumeReq": {
          // 长
          "len": row.len * 10,
          // 宽
          "width": row.width * 10,
          // 高
          "height": row.height * 10
        },
        // 敏感属性
        "productSkuSensitiveAttrReq": {
          // 是否存在敏感属性
          "isSensitive": 0,
          // 敏感属性id列表
          "sensitiveList": []
        }
      },
    }
  })
}

</script>

<style>
.required-star {
  color: red;
}
</style>