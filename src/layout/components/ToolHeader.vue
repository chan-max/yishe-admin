<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-04-01 07:04:47
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-11-13 06:22:44
 * @FilePath: /yishe-admin/src/layout/components/ToolHeader.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koroFileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script lang="tsx">
import { computed, defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { Collapse } from '@/layout/components/Collapse'
import { UserInfo } from '@/layout/components/UserInfo'
import { Screenfull } from '@/layout/components/Screenfull'
import { Breadcrumb } from '@/layout/components/Breadcrumb'
import ClientStatus from '@/layout/components/ClientStatus.vue'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'

export default defineComponent({
  name: 'ToolHeader',
  setup() {
    const { getPrefixCls, variables } = useDesign()
    const prefixCls = getPrefixCls('tool-header')
    const appStore = useAppStore()

    // 面包屑
    const breadcrumb = computed(() => appStore.getBreadcrumb)

    // 折叠图标
    const hamburger = computed(() => appStore.getHamburger)

    // 全屏图标
    const screenfull = computed(() => appStore.getScreenfull)

    // 布局
    const layout = computed(() => appStore.getLayout)

    // 新增响应式屏幕宽度判断
    const isWideScreen = ref(true)
    function updateScreen() {
      isWideScreen.value = window.innerWidth >= 768
    }

    onMounted(() => {
      updateScreen()
      window.addEventListener('resize', updateScreen)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', updateScreen)
    })

    return () => (
      <div
        id={`${variables.namespace}-tool-header`}
        class={[
          prefixCls,
          'h-[var(--top-tool-height)] relative px-[var(--top-tool-p-x)] flex items-center justify-between',
          'dark:bg-[var(--el-bg-color)]'
        ]}
      >
        {layout.value !== 'top' ? (
          <div class="h-full flex items-center">
            {hamburger.value && layout.value !== 'cutMenu' ? (
              <Collapse class="custom-hover" color="var(--top-header-text-color)"></Collapse>
            ) : undefined}
            {breadcrumb.value ? <Breadcrumb class="lt-md:hidden"></Breadcrumb> : undefined}
          </div>
        ) : undefined}
        <div class="h-full flex items-center">
          <div class="client-status-wrapper"><ClientStatus /></div>
          {screenfull.value ? (
            <Screenfull class="custom-hover" color="var(--top-header-text-color)"></Screenfull>
          ) : undefined}

          <UserInfo></UserInfo>
        </div>
      </div>
    )
  }
})
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-tool-header;

.#{$prefix-cls} {
  transition: left var(--transition-time-02);
}

@media (max-width: 767px) {
  .client-status-wrapper {
    display: none !important;
  }
}
</style>
