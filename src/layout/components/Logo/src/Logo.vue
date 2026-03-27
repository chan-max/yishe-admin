<script lang="ts" setup>
import { computed } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'Logo' })

const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('logo')
const appStore = useAppStore()

const title = computed(() => appStore.getTitle)
</script>

<template>
  <div class="px-12px py-3">
    <router-link
      :class="[
        prefixCls,
        'flex !h-[var(--logo-height)] items-center cursor-pointer decoration-none overflow-hidden'
      ]"
      to="/"
    >
      <img
        class="h-[calc(var(--logo-height)-12px)] w-[calc(var(--logo-height)-12px)]"
        style="object-fit:contain;"
        src="@/assets/imgs/logo.png"
      />
      <div
        :class="[
          'ml-10px text-14px font-600 tracking-[0.02em]',
          'text-[var(--logo-title-text-color)]'
        ]"
      >
        {{ title }}
      </div>
    </router-link>
  </div>
</template>
