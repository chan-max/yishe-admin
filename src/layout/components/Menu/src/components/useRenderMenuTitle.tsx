import type { RouteMeta } from 'vue-router'
import { Icon } from '@/components/Icon'
import { useI18n } from '@/hooks/web/useI18n'

export const useRenderMenuTitle = () => {
  const { t } = useI18n()

  const renderMenuTitle = (meta: RouteMeta, level = 0) => {
    const { title = 'Please set title' } = meta

    return meta.icon ? (
      <div class={['v-menu__label', `v-menu__label--level-${level}`]}>
        <Icon class="v-menu__icon" icon={meta.icon}></Icon>
        <span class="v-menu__title overflow-hidden overflow-ellipsis whitespace-nowrap">
          {t(title as string)}
        </span>
      </div>
    ) : (
      <div class={['v-menu__label', `v-menu__label--level-${level}`]}>
        <span class="v-menu__title overflow-hidden overflow-ellipsis whitespace-nowrap">
          {t(title as string)}
        </span>
      </div>
    )
  }

  return {
    renderMenuTitle
  }
}
