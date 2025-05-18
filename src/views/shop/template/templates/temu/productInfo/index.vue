<template>
  <el-card shadow="never">
    <!-- <el-form-item label="产品标题 :" required>
      <el-input placeholder="产品标题" style="width: 880px;"></el-input>
    </el-form-item>

    <el-form-item label="英文标题 :">
      <el-input placeholder="英文标题" style="width: 880px;"></el-input>
    </el-form-item> -->

    <el-form-item label="产品货号 :">
      <el-input v-model="model.extCode" placeholder="产品货号" style="width: 480px;"></el-input>
    </el-form-item>

    <el-form-item label="产地 :" required>
      <div class="flex gap-4">
        <el-select v-model="model.region1ShortName" style="width: 160px" placeholder="请选择国家" disabled>
          <el-option v-for="item in countries" :key="item.code" :label="item.chineseName" :value="item.shortName" />
        </el-select>
        <el-select v-model="model.region2Id" style="width: 160px" placeholder="请选择省份">
          <el-option v-for="item in provinces" :key="item.code" :label="item.chineseName" :value="item.code" />
        </el-select>
      </div>
    </el-form-item>

    <el-form-item label="站外产品链接 :">
      <el-input placeholder="请输入" style="width: 880px;" v-model="model.outerGoodsUrl"></el-input>
    </el-form-item>

    <!-- <el-form-item label="敏感属性 :">
      <el-radio-group v-model="form.isSensitive">
        <el-radio :value="0"> 否 </el-radio>
        <el-radio :value="1"> 是 </el-radio>
      </el-radio-group>
    </el-form-item> -->

    <!-- <el-form-item label="敏感类型 : " v-if="form.isSensitive">
      <el-checkbox-group v-model="form.sensitiveList">
        <el-checkbox v-for="item in sensitiveOptions" :key="item.code" :label="item.label" :value="item.code">
          {{ item.label }}
        </el-checkbox>
      </el-checkbox-group>
    </el-form-item> -->

    <!-- <el-form-item label="电量 :" v-if="form.sensitiveList.includes(110001) || form.sensitiveList.includes(120001)">
      <el-input style="width:240px" v-model="form.maxBatteryCapacity">
        <template #append>
          wh
        </template>
</el-input>
</el-form-item> -->
    <!-- <el-form-item label="容积 :" v-if="form.sensitiveList.includes(140001)">
      <el-input style="width:240px" v-model="form.maxLiquidCapacity">
        <template #append>
          ml
        </template>
      </el-input>
    </el-form-item> -->
    <!-- <el-form-item label="长度 :" v-if="form.sensitiveList.includes(170001)">
      <el-input style="width:240px" v-model="form.maxKnifeLength">
        <template #append>
          cm
        </template>
      </el-input>
    </el-form-item> -->
    <!-- <el-form-item label="刀刃角度 :" v-if="form.sensitiveList.includes(170001)">
      <el-input style="width:240px" v-model="form.knifeTipAngle">
        <template #append>
          度
        </template>
      </el-input>
    </el-form-item> -->

    <!-- <el-form-item label="定制产品 :">
      <el-radio-group v-model="form.personalizationSwitch">
        <el-radio :value="0"> 否 </el-radio>
        <el-radio :value="1"> 是 </el-radio>
      </el-radio-group>
    </el-form-item> -->

    <!-- <el-form-item label="" v-if="form.personalizationSwitch">
      <el-radio-group v-model="form.technologyType">
        <el-radio :value="1"> 单一工艺 </el-radio>
        <el-radio :value="2"> 组合工艺 </el-radio>
      </el-radio-group>
    </el-form-item> -->

    <!-- <el-form-item label="" v-if="form.personalizationSwitch">
      <div class="flex gap-4">
        <el-select v-model="form.customizedTechnologyReq.firstType" clearable style="width: 240px" placeholder="一级工艺">
          <el-option v-for="item in TECHNOLOGY_TYPE_OPTIONS" :key="item.value" :label="item.label"
            :value="item.value" />
        </el-select>
        <el-select v-model="form.customizedTechnologyReq.twiceType" multiple clearable
          :multiple-limit="form.technologyType == 1 ? 1 : 0" style="width: 360px" placeholder="二级工艺">
          <el-option v-for="item in findChildrenOptions(form.customizedTechnologyReq.firstType)" :key="item.value"
            :label="item.label" :value="item.value" />
        </el-select>
      </div>
    </el-form-item> -->
    <!-- <el-form-item>
      <el-alert type="warning" :closable="false" description=" 1、选择定制产品后，请及时在卖家中心配置定制模板信息，否则无法正常加站点售卖
        2、选择定制产品后，请保证账户预留金额充足，否则将发布失败
        3、工艺类型不同，履约发货时间限制不同，请您根据商品实际定制工艺进行升级，以免造成违约和违规">
      </el-alert>
    </el-form-item> -->

    <!-- <el-form-item label="产品轮播图 :">
      <el-input style="width:240px" v-model="form.carouselImageUrls">
      </el-input>
    </el-form-item> -->
  </el-card>
</template>

<script setup lang="ts">
import { getTemuTemplateAreaCountries } from '@/api/publish/template';
import { TECHNOLOGY_TYPE, TECHNOLOGY_TYPE_OPTIONS, findChildrenOptions } from './enum'

const model = defineModel({
  default: {
    extCode: '',
    region1ShortName: '',
    region2Id: '',
    outerGoodsUrl: '',
  }
})

const form = ref({
  extCode: '', // 货号
  isSensitive: 0,// 0 , 1
  sensitiveList: [],
  region1ShortName: 'CN', // 固定中国
  region2Id: '',
  personalizationSwitch: 0, // 定制产品

  maxBatteryCapacity: '', // 最大电池容量 
  maxLiquidCapacity: '', // 最大容积
  maxKnifeLength: '', // 刀具长度
  knifeTipAngle: '', // 刀具角度

  technologyType: 1, //  工艺类型 1：单一工艺，2：组合工艺


  // 定制工艺请求
  customizedTechnologyReq: {
    firstType: '',
    twiceType: []
  },

  carouselImageUrls: '[1,2,3,4,5,6]',

  outerGoodsUrl: ''
})

const sensitiveOptions = ref([
  { value: 1, label: '纯电', code: 110001 },
  { value: 2, label: '内电', code: 120001 },
  { value: 3, label: '磁性', code: 130001 },
  { value: 4, label: '液体', code: 140001 },
  { value: 5, label: '粉末', code: 150001 },
  { value: 6, label: '膏体', code: 160001 },
  { value: 7, label: '刀具', code: 170001 }
])

const countries = ref()
const provinces = ref()

async function initCountries() {
  const res = await getTemuTemplateAreaCountries()

  countries.value = res.erpCountriesVO
  provinces.value = res.erpProvincesVO
}
initCountries()


</script>