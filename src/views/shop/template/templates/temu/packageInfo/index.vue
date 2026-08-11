<template>
  <el-form-item :label="t('shop.packageShape') + '：'">
    <el-select v-model="model.packageShape" style="width: 160px" :placeholder="t('common.selectPlaceholder')">
      <el-option v-for="item in packageShape" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>

  <el-form-item :label="t('shop.packageType') + '：'">
    <el-select v-model="model.packageType" style="width: 160px" :placeholder="t('common.selectPlaceholder')">
      <el-option v-for="item in packageType" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const model = defineModel({
  default: {
    packageShape: 0,
    packageType: 0,
  }
})


const packageShape = ref([
  {
    label: t('shop.irregular'),
    value: 0
  },
  {
    label: t('shop.cuboid'),
    value: 1
  },
  {
    label: t('shop.cylinder'),
    value: 2
  },
])

const packageType = ref([
  {
    label: t('shop.hardPackage'),
    value: 0
  },
  {
    label: t('shop.softHardPackage'),
    value: 1
  },
  {
    label: t('shop.softSoftPackage'),
    value: 2
  },
])

</script>
