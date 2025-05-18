<template>
  <el-form-item label="外包装形状：">
    <el-select v-model="model.packageShape" style="width: 160px" placeholder="请选择">
      <el-option v-for="item in packageShape" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>

  <el-form-item label="外包装类型：">
    <el-select v-model="model.packageType" style="width: 160px" placeholder="请选择">
      <el-option v-for="item in packageType" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>
</template>

<script setup lang="ts">

const model = defineModel({
  default: {
    packageShape: 0,
    packageType: 0,
  }
})


const packageShape = ref([
  {
    label: '不规则',
    value: 0
  },
  {
    label: '长方体',
    value: 1
  },
  {
    label: '圆柱体',
    value: 2
  },
])

const packageType = ref([
  {
    label: '硬包装',
    value: 0
  },
  {
    label: '软包装+硬物',
    value: 1
  },
  {
    label: '软包装+软物',
    value: 2
  },
])

</script>