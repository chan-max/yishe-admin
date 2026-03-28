import { computed, type Ref } from 'vue'
import { ElScrollbar } from 'element-plus'
import { Menu } from '@/layout/components/Menu'
import { TagsView } from '@/layout/components/TagsView'
import AppView from './AppView.vue'
import ToolHeader from './ToolHeader.vue'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'

const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('layout')
const appStore = useAppStore()

const pageLoading = computed(() => appStore.getPageLoading)
const tagsView = computed(() => appStore.getTagsView)
const fixedHeader = computed(() => appStore.getFixedHeader)
const mobile = computed(() => appStore.getMobile)

interface RenderLayoutOptions {
  mobileMenuOpen: Ref<boolean>
  closeMobileMenu: () => void
}

export const useRenderLayout = ({ mobileMenuOpen, closeMobileMenu }: RenderLayoutOptions) => {
  const renderBasic = () => {
    return (
      <>
        {mobile.value && mobileMenuOpen.value ? (
          <div
            class="absolute inset-0 z-[1400] bg-[var(--app-overlay-color)] backdrop-blur-[2px]"
            onClick={closeMobileMenu}
          />
        ) : undefined}

        <aside
            class={[
              'absolute top-0 left-0 h-full border-r border-[var(--left-menu-border-color)] bg-[var(--left-menu-bg-color)]',
              {
                'z-[30] shadow-[var(--left-menu-shadow)]':
                  !mobile.value,
              'z-[1401]':
                mobile.value,
              'w-[var(--left-menu-max-width)]': !mobile.value,
              'w-[min(86vw,var(--left-menu-max-width))] shadow-2xl transition-transform duration-200':
                mobile.value,
              'translate-x-0': !mobile.value || mobileMenuOpen.value,
              '-translate-x-full': mobile.value && !mobileMenuOpen.value
            }
          ]}
        >
          <Menu />
        </aside>

        <main
          class={[
            `${prefixCls}-content`,
            'absolute top-0 h-full border-l border-[var(--app-content-border-color)]',
            {
              'left-[var(--left-menu-max-width)] w-[calc(100%-var(--left-menu-max-width))]':
                !mobile.value,
              '!left-0 !w-full !border-l-0': mobile.value
            }
          ]}
        >
          <ElScrollbar
            v-loading={pageLoading.value}
            class={[
              `${prefixCls}-content-scrollbar`,
              {
                '!h-[calc(100%-var(--top-tool-height)-var(--tags-view-height))] mt-[calc(var(--top-tool-height)+var(--tags-view-height))]':
                  fixedHeader.value
              }
            ]}
          >
            <div
              class={[
                {
                  'fixed top-0 z-10 left-[var(--left-menu-max-width)] w-[calc(100%-var(--left-menu-max-width))]':
                    fixedHeader.value && !mobile.value,
                  '!fixed top-0 !left-0 !w-full': fixedHeader.value && mobile.value
                }
              ]}
            >
              <ToolHeader
                class={[
                  'bg-[var(--top-header-bg-color)] border-b border-[var(--top-tool-border-color)] shadow-[var(--top-header-shadow)]',
                  {
                    'layout-border__bottom': !tagsView.value
                  }
                ]}
              />
              {tagsView.value ? (
                <TagsView class="layout-border__top layout-border__bottom" />
              ) : undefined}
            </div>

            <AppView />
          </ElScrollbar>
        </main>
      </>
    )
  }

  return {
    renderBasic
  }
}
