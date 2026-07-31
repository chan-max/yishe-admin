import type { App } from 'vue'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

function resolveAdminStatus(): boolean | null {
  try {
    const { wsCache } = useCache()
    const userInfo = wsCache.get(CACHE_KEY.USER)

    if (!userInfo) return null

    const possibleValues = [
      userInfo?.user?.isAdmin,
      userInfo?.isAdmin,
      userInfo?.user?.admin,
      userInfo?.admin
    ]

    const matched = possibleValues.find((value) => value !== undefined && value !== null)
    if (matched === undefined) return null

    return !!matched
  } catch {
    return null
  }
}

function shouldHideForNonAdmin() {
  const isAdmin = resolveAdminStatus()
  return isAdmin === false
}

/**
 * `v-admin-only` 指令：仅在明确识别为非管理员时隐藏。
 * 如果当前用户信息尚未加载完成，默认先不隐藏，避免误伤管理员按钮。
 */
export function adminOnly(app: App<Element>) {
  app.directive('adminOnly', {
    mounted(el) {
      if (shouldHideForNonAdmin()) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    },
    updated(el) {
      if (shouldHideForNonAdmin() && el.parentNode) {
        el.parentNode.removeChild(el)
      }
    }
  })

  // 全局屏蔽已按需求禁用：普通用户与管理员用户均可查看和操作删除相关功能
  const hideSensitiveElements = () => {
    // 允许所有用户查看与操作删除相关按钮
    return
  }
}
