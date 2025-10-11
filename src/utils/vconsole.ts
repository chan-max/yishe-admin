/**
 * vconsole 移动端调试工具配置
 * 只在移动端环境下启用，避免在PC端影响开发体验
 */

// 使用动态导入方式，避免在浏览器环境中的问题
let VConsole: any = null
import VCONSOLE_CONFIG from './vconsole-config'

// 扩展window类型定义
declare global {
  interface Window {
    vConsole?: any
    __wxjs_environment?: string
  }
}

// 检测是否为移动端
function isMobile(): boolean {
  const userAgent = navigator.userAgent.toLowerCase()
  const mobileKeywords = [
    'mobile', 'android', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'windows phone', 'opera mini', 'iemobile'
  ]
  
  // 检查用户代理字符串
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword))
  
  // 检查屏幕尺寸（作为辅助判断）
  const isMobileScreen = window.innerWidth <= 768 || window.innerHeight <= 768
  
  // 检查触摸支持
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  return isMobileUA || (isMobileScreen && isTouchDevice)
}


// 检测是否在微信环境
function isWeChat(): boolean {
  return /micromessenger/i.test(navigator.userAgent)
}

// 检测是否在微信小程序环境
function isWeChatMiniProgram(): boolean {
  return window.__wxjs_environment === 'miniprogram'
}

// 初始化vconsole
export async function initVConsole(): Promise<void> {
  // 检查是否启用vconsole
  if (!VCONSOLE_CONFIG.enabled) {
    console.log('vconsole: 已禁用，跳过初始化')
    return
  }
  
  // 如果配置为只在移动端启用，则检查设备类型
  if (VCONSOLE_CONFIG.mobileOnly && !isMobile()) {
    console.log('vconsole: 当前为PC端环境，跳过vconsole初始化')
    return
  }
  
  // 在微信小程序环境下不启用vconsole
  if (isWeChatMiniProgram()) {
    console.log('vconsole: 当前为微信小程序环境，跳过vconsole初始化')
    return
  }
  
  // 检查是否已经初始化过
  if (window.vConsole) {
    console.log('vconsole: 已经初始化过，跳过重复初始化')
    return
  }
  
  try {
    // 动态导入vconsole模块
    if (!VConsole) {
      const vconsoleModule = await import('vconsole' as any)
      VConsole = vconsoleModule.default || vconsoleModule
    }
    
    // 创建vconsole实例
    const vConsole = new VConsole({
      theme: VCONSOLE_CONFIG.theme as 'light' | 'dark',
      defaultPlugins: VCONSOLE_CONFIG.defaultPlugins as any,
      maxLogNumber: VCONSOLE_CONFIG.maxLogNumber,
      onReady: function () {
        console.log('vconsole: 移动端调试工具已启用')
        
        // 在微信环境下添加特殊提示
        if (isWeChat()) {
          console.log('vconsole: 检测到微信环境，调试工具已启用')
        }
      },
      onClearLog: function () {
        console.log('vconsole: 日志已清空')
      }
    })
    
    // 将vconsole实例挂载到window对象，方便全局访问
    window.vConsole = vConsole
    
    // 添加一些有用的调试信息
    if (VCONSOLE_CONFIG.showDebugInfo) {
      console.log('=== 移动端调试信息 ===')
      console.log('User Agent:', navigator.userAgent)
      console.log('Screen Size:', `${window.innerWidth} x ${window.innerHeight}`)
      console.log('Device Pixel Ratio:', window.devicePixelRatio)
      console.log('Touch Support:', 'ontouchstart' in window)
      console.log('Environment:', import.meta.env.MODE)
      console.log('vConsole Config:', VCONSOLE_CONFIG)
      console.log('====================')
    }
    
  } catch (error) {
    console.error('vconsole: 初始化失败', error)
  }
}

// 销毁vconsole
export function destroyVConsole(): void {
  if (window.vConsole) {
    window.vConsole.destroy()
    window.vConsole = null
    console.log('vconsole: 已销毁')
  }
}

// 切换vconsole显示状态
export function toggleVConsole(): void {
  if (window.vConsole) {
    window.vConsole.show()
  }
}

// 隐藏vconsole
export function hideVConsole(): void {
  if (window.vConsole) {
    window.vConsole.hide()
  }
}

// 显示vconsole
export function showVConsole(): void {
  if (window.vConsole) {
    window.vConsole.show()
  }
}

