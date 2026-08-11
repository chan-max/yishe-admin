<template>
  <div>
    <el-checkbox-group v-model="checkList">
      <el-checkbox :label="t('shop.height')" :value="20002" />
      <el-checkbox :label="t('shop.width')" :value="20003" disabled />
      <el-checkbox :label="t('shop.length')" :value="20004" disabled />
    </el-checkbox-group>
    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="101" :label="t('shop.customSize')" width="240" />
      <el-table-column prop="20002" :label="t('shop.height')" width="240" v-if="checkList.includes(20002)">
        <template #default="scope">
          <el-input v-model="scope.row[20002]" type="number" min="0" :placeholder="t('common.inputPlaceholder')"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="20003" :label="t('shop.width')" width="120">
        <template #default="scope">
          <el-input v-model="scope.row[20003]" type="number" min="0" :placeholder="t('common.inputPlaceholder')"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="20004" :label="t('shop.length')" width="120">
        <template #default="scope">
          <el-input v-model="scope.row[20004]" type="number" min="0" :placeholder="t('common.inputPlaceholder')"></el-input>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  config: {
    default: {}
  },
  size: {
    default: []
  }
})

const emits = defineEmits(['change'])

watch(() => props.size, () => {

  let newTable = props.size.map((size) => {

    let existRow = tableData.value.find((row) => row['101'] == size)

    return {
      '101': size,
      ...existRow
    }
  })

  tableData.value = newTable
})

const checkList = ref([20003, 20004])
const tableData = ref([])

watch(tableData, () => {

  const sizeMeta = props.config.sizeSpecMeta.elementList.filter((item) => {
    return checkList.value.includes(item.id)
  })

  emits('change', tableData, sizeMeta)
})


defineExpose({
  validate() {
    
  },
  init(data) {
    if(!data){
      return
    }
    tableData.value = data
  }
})
</script>
