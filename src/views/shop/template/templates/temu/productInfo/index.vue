<template>
  <el-card shadow="never">
    <!-- <el-form-item :label="t('shop.productTitle') + ' :'" required>
      <el-input :placeholder="t('shop.productTitle')" style="width: 880px;"></el-input>
    </el-form-item>

    <el-form-item :label="t('shop.englishTitle') + ' :'">
      <el-input :placeholder="t('shop.englishTitle')" style="width: 880px;"></el-input>
    </el-form-item> -->

    <el-form-item :label="t('shop.productCode') + ' :'">
      <el-input v-model="model.extCode" :placeholder="t('shop.productCode')" style="width: 480px;"></el-input>
    </el-form-item>

    <el-form-item :label="t('shop.origin') + ' :'" required>
      <div class="flex gap-4">
        <el-select v-model="model.region1ShortName" style="width: 160px" :placeholder="t('shop.selectCountry')" disabled>
          <el-option v-for="item in countries" :key="item.code" :label="item.chineseName" :value="item.shortName" />
        </el-select>
        <el-select v-model="model.region2Id" style="width: 160px" :placeholder="t('shop.selectProvince')">
          <el-option v-for="item in provinces" :key="item.code" :label="item.chineseName" :value="item.code" />
        </el-select>
      </div>
    </el-form-item>

    <el-form-item :label="t('shop.externalProductLink') + ' :'">
      <el-input :placeholder="t('common.inputPlaceholder')" style="width: 880px;" v-model="model.outerGoodsUrl"></el-input>
    </el-form-item>

    <!-- <el-form-item :label="t('shop.sensitiveProperty') + ' :'">
      <el-radio-group v-model="form.isSensitive">
        <el-radio :value="0"> {{ t('shop.no') }} </el-radio>
        <el-radio :value="1"> {{ t('shop.yes') }} </el-radio>
      </el-radio-group>
    </el-form-item> -->

    <!-- <el-form-item :label="t('shop.sensitiveType') + ' : '" v-if="form.isSensitive">
      <el-checkbox-group v-model="form.sensitiveList">
        <el-checkbox v-for="item in sensitiveOptions" :key="item.code" :label="item.label" :value="item.code">
          {{ item.label }}
        </el-checkbox>
      </el-checkbox-group>
    </el-form-item> -->

    <!-- <el-form-item :label="t('shop.batteryCapacity') + ' :'" v-if="form.sensitiveList.includes(110001) || form.sensitiveList.includes(120001)">
      <el-input style="width:240px" v-model="form.maxBatteryCapacity">
        <template #append>
          wh
        </template>
</el-input>
</el-form-item> -->
    <!-- <el-form-item :label="t('shop.volume') + ' :'" v-if="form.sensitiveList.includes(140001)">
      <el-input style="width:240px" v-model="form.maxLiquidCapacity">
        <template #append>
          ml
        </template>
      </el-input>
    </el-form-item> -->
    <!-- <el-form-item :label="t('shop.length') + ' :'" v-if="form.sensitiveList.includes(170001)">
      <el-input style="width:240px" v-model="form.maxKnifeLength">
        <template #append>
          cm
        </template>
      </el-input>
    </el-form-item> -->
    <!-- <el-form-item :label="t('shop.bladeAngle') + ' :'" v-if="form.sensitiveList.includes(170001)">
      <el-input style="width:240px" v-model="form.knifeTipAngle">
        <template #append>
          {{ t('shop.degree') }}
        </template>
      </el-input>
    </el-form-item> -->

    <!-- <el-form-item :label="t('shop.customProduct') + ' :'">
      <el-radio-group v-model="form.personalizationSwitch">
        <el-radio :value="0"> {{ t('shop.no') }} </el-radio>
        <el-radio :value="1"> {{ t('shop.yes') }} </el-radio>
      </el-radio-group>
    </el-form-item> -->

    <!-- <el-form-item label="" v-if="form.personalizationSwitch">
      <el-radio-group v-model="form.technologyType">
        <el-radio :value="1"> {{ t('shop.singleProcess') }} </el-radio>
        <el-radio :value="2"> {{ t('shop.combinedProcess') }} </el-radio>
      </el-radio-group>
    </el-form-item> -->

    <!-- <el-form-item label="" v-if="form.personalizationSwitch">
      <div class="flex gap-4">
        <el-select v-model="form.customizedTechnologyReq.firstType" clearable style="width: 240px" :placeholder="t('shop.firstProcess')">
          <el-option v-for="item in TECHNOLOGY_TYPE_OPTIONS" :key="item.value" :label="item.label"
            :value="item.value" />
        </el-select>
        <el-select v-model="form.customizedTechnologyReq.twiceType" multiple clearable
          :multiple-limit="form.technologyType == 1 ? 1 : 0" style="width: 360px" :placeholder="t('shop.secondProcess')">
          <el-option v-for="item in findChildrenOptions(form.customizedTechnologyReq.firstType)" :key="item.value"
            :label="item.label" :value="item.value" />
        </el-select>
      </div>
    </el-form-item> -->
    <!-- <el-form-item>
      <el-alert type="warning" :closable="false" :description="t('shop.customProductTip')">
      </el-alert>
    </el-form-item> -->

    <!-- <el-form-item :label="t('shop.productCarouselImage') + ' :'">
      <el-input style="width:240px" v-model="form.carouselImageUrls">
      </el-input>
    </el-form-item> -->
  </el-card>
</template>

<script setup lang="ts">
import { getTemuTemplateAreaCountries } from '@/api/publish/template';
import { TECHNOLOGY_TYPE, TECHNOLOGY_TYPE_OPTIONS, findChildrenOptions } from './enum'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
  { value: 1, label: t('shop.pureElectric'), code: 110001 },
  { value: 2, label: t('shop.builtInElectric'), code: 120001 },
  { value: 3, label: t('shop.magnetic'), code: 130001 },
  { value: 4, label: t('shop.liquid'), code: 140001 },
  { value: 5, label: t('shop.powder'), code: 150001 },
  { value: 6, label: t('shop.paste'), code: 160001 },
  { value: 7, label: t('shop.knife'), code: 170001 }
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
