<script lang="tsx">
import { ElBreadcrumb, ElBreadcrumbItem } from 'element-plus'
import { ref, watch, computed, unref, defineComponent, TransitionGroup } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissionStore } from '@/store/modules/permission'
import { filterBreadcrumb } from './helper'
import { filter, treeToList } from '@/utils/tree'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useDesign } from '@/hooks/web/useDesign'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('breadcrumb')

export default defineComponent({
  name: 'Breadcrumb',
  setup() {
    const { currentRoute } = useRouter()

    const { t } = useI18n()

    const levelList = ref<AppRouteRecordRaw[]>([])

    const permissionStore = usePermissionStore()

    const menuRouters = computed(() => {
      const routers = permissionStore.getRouters
      return filterBreadcrumb(routers)
    })

    const getBreadcrumb = () => {
      const currentPath = currentRoute.value.matched.slice(-1)[0].path

      levelList.value = filter<AppRouteRecordRaw>(unref(menuRouters), (node: AppRouteRecordRaw) => {
        return node.path === currentPath
      })
    }

    const renderBreadcrumb = () => {
      const breadcrumbList = treeToList<AppRouteRecordRaw[]>(unref(levelList))
      return breadcrumbList.map((v) => {
        const disabled = !v.redirect || v.redirect === 'noredirect'
        return (
          <ElBreadcrumbItem to={{ path: disabled ? '' : v.path }} key={v.name}>
            <span class={`${prefixCls}__label`}>{t(v?.meta?.title)}</span>
          </ElBreadcrumbItem>
        )
      })
    }

    watch(
      () => currentRoute.value,
      (route: RouteLocationNormalizedLoaded) => {
        if (route.path.startsWith('/redirect/')) {
          return
        }
        getBreadcrumb()
      },
      {
        immediate: true
      }
    )

    return () => (
      <ElBreadcrumb separator="/" class={`${prefixCls} flex items-center h-full ml-[4px]`}>
        <TransitionGroup appear enter-active-class="animate__animated animate__fadeInRight">
          {renderBreadcrumb()}
        </TransitionGroup>
      </ElBreadcrumb>
    )
  }
})
</script>

<style lang="scss" scoped>
$prefix-cls: #{$elNamespace}-breadcrumb;

.#{$prefix-cls} {
  font-size: 11px;

  &__label {
    display: inline-flex;
    align-items: center;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.#{$prefix-cls}__separator) {
    margin: 0 6px;
    color: rgba(255, 255, 255, 0.24);
    font-size: 10px;
  }

  :deep(.#{$prefix-cls}__item) {
    display: flex;

    .#{$prefix-cls}__inner {
      display: flex;
      align-items: center;
      color: rgba(255, 255, 255, 0.52);
      font-size: 11px;
      font-weight: 400;

      &:hover {
        color: rgba(255, 255, 255, 0.72);
      }
    }
  }

  :deep(.#{$prefix-cls}__item):not(:last-child) {
    .#{$prefix-cls}__inner {
      color: var(--top-header-text-color);

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  :deep(.#{$prefix-cls}__item):last-child {
    .#{$prefix-cls}__inner {
      display: flex;
      align-items: center;
      color: rgba(255, 255, 255, 0.88);
      font-size: 11px;
      font-weight: 500;

      &:hover {
        color: rgba(255, 255, 255, 0.88);
      }
    }
  }
}
</style>
