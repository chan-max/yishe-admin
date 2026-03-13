import type { App } from 'vue'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

/**
 * v-admin-only 指令：仅管理员可见
 * 另外：启动时在 DOM 中扫描包含“删除/移除/移除项”等关键词的按钮并隐藏（非管理员）
 */
export function adminOnly(app: App<Element>) {
  app.directive('adminOnly', (el) => {
    try {
      const { wsCache } = useCache()
      const userInfo = wsCache.get(CACHE_KEY.USER)
      const isAdmin = !!userInfo?.user?.isAdmin
      if (!isAdmin) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } catch (e) {
      // 如果检查失败，默认不移除
      // console.warn('adminOnly 指令检查失败', e)
    }
  })

  // DOM 扫描与观察器：隐藏含“删除/移除”等文本或明显 class 的按钮
  const hideSensitiveElements = () => {
    try {
      const { wsCache } = useCache()
      const userInfo = wsCache.get(CACHE_KEY.USER)
      const isAdmin = !!userInfo?.user?.isAdmin
      if (isAdmin) return

      const keywords = ['删除', '移除', '删除项', '移除项', '删除记录']
      const classes = [/btn-?delete/i, /delete/i, /del/i, /remove/i]

      const elements = Array.from(document.querySelectorAll('button, a, span, i'))
      elements.forEach((el) => {
        try {
          const text = (el.textContent || '').trim()
          if (text && keywords.some((k) => text.includes(k))) {
            ;(el as HTMLElement).style.display = 'none'
            return
          }
          const className = (el.getAttribute && el.getAttribute('class')) || ''
          if (className && classes.some((r) => r.test(className))) {
            ;(el as HTMLElement).style.display = 'none'
            return
          }
        } catch (e) {
          // ignore
        }
      })
    } catch (e) {
      // ignore
    }
  }

  // 初次执行
  if (typeof window !== 'undefined') {
    setTimeout(hideSensitiveElements, 500)
    // 观察后续 DOM 变化
    try {
      const observer = new MutationObserver(() => {
        hideSensitiveElements()
      })
      observer.observe(document.body, { childList: true, subtree: true })
    } catch (e) {
      // ignore
    }
  }
}
