<script lang="tsx">
import { computed, defineComponent } from 'vue'
import { Icon } from '@/components/Icon'
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
    const breadcrumb = computed(() => appStore.getBreadcrumb)
    const screenfull = computed(() => appStore.getScreenfull)
    const mobile = computed(() => appStore.getMobile)
    const openMobileMenu = inject<() => void>('openMobileMenu', () => {})

    return () => (
      <header
        id={`${variables.namespace}-tool-header`}
        class={[
          prefixCls,
          'h-[var(--top-tool-height)] px-12px md:px-16px flex items-center justify-between'
        ]}
      >
        <div class="flex h-full min-w-0 items-center gap-6px md:gap-8px">
          {mobile.value ? (
            <button
              type="button"
              class="flex h-34px w-34px items-center justify-center rounded-8px border border-[var(--left-menu-border-color)] bg-[var(--top-header-hover-color)] text-[var(--top-header-text-color)]"
              onClick={openMobileMenu}
            >
              <Icon icon="ep:menu" />
            </button>
          ) : undefined}
          {breadcrumb.value ? <Breadcrumb class="min-w-0 lt-md:hidden" /> : undefined}
        </div>

        <div class="flex h-full items-center gap-2px md:gap-6px">
          <div class="client-status-wrapper">
            <ClientStatus />
          </div>
          {screenfull.value ? (
            <Screenfull class="custom-hover" color="var(--top-header-text-color)" />
          ) : undefined}
          <UserInfo />
        </div>
      </header>
    )
  }
})
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-tool-header;

.#{$prefix-cls} {
  color: var(--top-header-text-color);
}

@media (max-width: 1024px) {
  .client-status-wrapper {
    display: none !important;
  }
}
</style>
