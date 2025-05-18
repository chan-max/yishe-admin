<template>
  <ScrollSelect v-if="isMounted" v-bind="$attrs" ref="reviewStageRef" :placeholder="'输入搜索'" clearable filterable
    remote collapse-tags collapse-tags-tooltip :multiple="false" searchKey="search" :initialOptions="initialOptions"
    :methods="methods" />

</template>

<script setup>
import { getAutoPublishList } from '@/api/publish'
import ScrollSelect from './raw.vue'

const props = defineProps({
  methods: {
    default: () => getAutoPublishList
  }
})

const isMounted = ref(false)

const initialOptions = ref([])
onMounted(() => {
  isMounted.value = true
})

</script>