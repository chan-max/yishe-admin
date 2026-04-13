<script lang="tsx">
import { computed, defineComponent, provide, ref, watch } from 'vue'
import { Backtop } from '@/components/Backtop'
import { useRenderLayout } from './components/useRenderLayout'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'

const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('layout')

export default defineComponent({
  name: 'Layout',
  setup() {
    const appStore = useAppStore()
    const mobile = computed(() => appStore.getMobile)
    const mobileMenuOpen = ref(false)

    const openMobileMenu = () => {
      if (mobile.value) {
        mobileMenuOpen.value = true
      }
    }

    const closeMobileMenu = () => {
      mobileMenuOpen.value = false
    }

    watch(
      () => mobile.value,
      (value) => {
        if (!value) {
          mobileMenuOpen.value = false
        }
      },
      { immediate: true }
    )

    provide('openMobileMenu', openMobileMenu)
    provide('closeMobileMenu', closeMobileMenu)

    const { renderBasic } = useRenderLayout({ mobileMenuOpen, closeMobileMenu })

    return () => (
      <section class={[prefixCls, 'w-full h-full relative overflow-hidden']}>
        {renderBasic()}
        {/* <Backtop />  */}
      </section>
    )
  }
})
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-layout;

.#{$prefix-cls} {
  background-color: var(--app-content-bg-color);
}
</style>
