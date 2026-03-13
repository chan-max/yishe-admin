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

  const hideSensitiveElements = () => {
    if (!shouldHideForNonAdmin()) return

    const keywords = ['删除', '移除', '删除项', '移除项', '删除记录']
    const classes = [/btn-?delete/i, /delete/i, /del/i, /remove/i]
    const elements = Array.from(document.querySelectorAll('button, a, span, i'))

    elements.forEach((el) => {
      try {
        const text = (el.textContent || '').trim()
        if (text && keywords.some((keyword) => text.includes(keyword))) {
          ;(el as HTMLElement).style.display = 'none'
          return
        }

        const className = el.getAttribute?.('class') || ''
        if (className && classes.some((rule) => rule.test(className))) {
          ;(el as HTMLElement).style.display = 'none'
        }
      } catch {
        // ignore
      }
    })
  }

  if (typeof window !== 'undefined') {
    setTimeout(hideSensitiveElements, 500)
    try {
      const observer = new MutationObserver(() => {
        hideSensitiveElements()
      })
      observer.observe(document.body, { childList: true, subtree: true })
    } catch {
      // ignore
    }
  }
}
