/**
 * 移动端手势防护模块
 * 防止页面缩放和左右滑动
 */

class MobileGestureGuard {
  private lastTouchEnd = 0
  private isInitialized = false

  /**
   * 初始化移动端手势防护
   */
  init() {
    if (this.isInitialized) return
    
    // 只在移动端启用
    if (!this.isMobile()) return

    this.preventZoom()
    this.preventSwipe()
    this.preventBounce()
    
    this.isInitialized = true
    console.log('移动端手势防护已启用')
  }

  /**
   * 检测是否为移动端
   */
  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768
  }

  /**
   * 防止缩放手势
   */
  private preventZoom() {
    // 防止双击缩放
    document.addEventListener('dblclick', (e) => {
      e.preventDefault()
    }, { passive: false })

    // 防止双指缩放
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }, { passive: false })

    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }, { passive: false })

    // 防止快速双击缩放
    document.addEventListener('touchend', (e) => {
      const now = new Date().getTime()
      if (now - this.lastTouchEnd <= 300) {
        e.preventDefault()
      }
      this.lastTouchEnd = now
    }, { passive: false })

    // 防止键盘缩放快捷键
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
        e.preventDefault()
      }
    }, { passive: false })

    // 防止鼠标滚轮缩放
    document.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
      }
    }, { passive: false })
  }

  /**
   * 防止左右滑动手势
   */
  private preventSwipe() {
    let startX = 0
    let startY = 0
    let isScrolling = false

    document.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX
        startY = e.touches[0].clientY
        isScrolling = false
      }
    }, { passive: true })

    document.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && !isScrolling) {
        const deltaX = Math.abs(e.touches[0].clientX - startX)
        const deltaY = Math.abs(e.touches[0].clientY - startY)
        
        // 如果水平移动距离大于垂直移动距离，且超过阈值
        if (deltaX > deltaY && deltaX > 30) {
          // 检查是否在可滚动元素内
          const target = e.target as HTMLElement
          if (!this.isInScrollableElement(target)) {
            e.preventDefault()
          }
        }
      }
    }, { passive: false })

    // 防止浏览器前进后退手势
    window.addEventListener('popstate', () => {
      // 可以在这里添加自定义的导航逻辑
    })
  }

  /**
   * 防止页面弹性滚动
   */
  private preventBounce() {
    // 防止整个页面的弹性滚动
    document.addEventListener('touchmove', (e) => {
      const target = e.target as HTMLElement
      
      // 如果不在可滚动元素内，防止默认行为
      if (!this.isInScrollableElement(target)) {
        // 检查是否会导致页面滚动
        if (document.body.scrollTop === 0 || 
            document.body.scrollTop === document.body.scrollHeight - window.innerHeight) {
          e.preventDefault()
        }
      }
    }, { passive: false })
  }

  /**
   * 检查元素是否在可滚动容器内
   */
  private isInScrollableElement(element: HTMLElement): boolean {
    let current = element
    
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current)
      const overflow = style.overflow + style.overflowX + style.overflowY
      
      // 检查是否有滚动条
      if (overflow.includes('scroll') || overflow.includes('auto')) {
        // 检查是否确实可以滚动
        if (current.scrollWidth > current.clientWidth || 
            current.scrollHeight > current.clientHeight) {
          return true
        }
      }
      
      // 检查特定的可滚动类名
      if (current.classList.contains('scrollable') ||
          current.classList.contains('vxe-table') ||
          current.classList.contains('el-table') ||
          current.classList.contains('el-scrollbar')) {
        return true
      }
      
      current = current.parentElement as HTMLElement
    }
    
    return false
  }

  /**
   * 销毁手势防护
   */
  destroy() {
    if (!this.isInitialized) return
    
    // 这里可以移除事件监听器，但通常不需要
    this.isInitialized = false
    console.log('移动端手势防护已禁用')
  }

  /**
   * 临时禁用手势防护（比如在某些特定组件中）
   */
  temporaryDisable(duration = 1000) {
    this.destroy()
    setTimeout(() => {
      this.init()
    }, duration)
  }
}

// 创建单例实例
export const mobileGestureGuard = new MobileGestureGuard()

// 自动初始化
if (typeof window !== 'undefined') {
  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mobileGestureGuard.init()
    })
  } else {
    mobileGestureGuard.init()
  }
}

export default mobileGestureGuard
