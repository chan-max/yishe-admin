<script lang="ts" setup>
import { useLocaleStore } from '@/store/modules/locale'
import { useLocale } from '@/hooks/web/useLocale'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'LocaleDropdown' })

const { t } = useI18n()
const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('locale-dropdown')

const localeStore = useLocaleStore()

const langMap = computed(() => localeStore.getLocaleMap)

const currentLang = computed(() => localeStore.getCurrentLocale)

const setLang = (lang: LocaleType) => {
  if (lang === unref(currentLang).lang) return
  window.location.reload()
  localeStore.setCurrentLocale({
    lang
  })
  const { changeLocale } = useLocale()
  changeLocale(lang)
}
</script>

<template>
  <ElDropdown :class="prefixCls" trigger="click" @command="setLang">
    <button type="button" class="locale-dropdown-trigger">
      <span class="locale-dropdown-icon">
        <Icon icon="ion:language-sharp" :size="18" />
      </span>
      <span class="locale-dropdown-label">{{ t('layout.language.language') }}</span>
    </button>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem v-for="item in langMap" :key="item.lang" :command="item.lang">
          {{ item.name }}
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-locale-dropdown;

.#{$prefix-cls} {
  display: inline-flex;
}

.locale-dropdown-trigger {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: none;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;

  &:active {
    transform: scale(0.94);
  }
}

.locale-dropdown-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 18px;
  line-height: 1;
}

.locale-dropdown-label {
  margin-top: 3px;
  font-size: 8px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}
</style>
