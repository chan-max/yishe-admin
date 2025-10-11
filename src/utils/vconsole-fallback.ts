/**
 * vConsole 备用加载方案
 * 使用CDN方式加载，避免模块导入问题
 */

import VCONSOLE_CONFIG from './vconsole-config'

// 检测是否为移动端
function isMobile(): boolean {
  const userAgent = navigator.userAgent.toLowerCase()
  const mobileKeywords = [
    'mobile', 'android', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'windows phone', 'opera mini', 'iemobile'
  ]
  
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword))
  const isMobileScreen = window.innerWidth <= 768 || window.innerHeight <= 768
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

// 从CDN加载vconsole
function loadVConsoleFromCDN(): Promise<any> {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载过
    if (window.VConsole) {
      resolve(window.VConsole)
      return
    }

    // 创建script标签加载vconsole
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/vconsole@latest/dist/vconsole.min.js'
    script.onload = () => {
      if (window.VConsole) {
        resolve(window.VConsole)
      } else {
        reject(new Error('VConsole 加载失败'))
      }
    }
    script.onerror = () => {
      reject(new Error('VConsole 脚本加载失败'))
    }
    
    document.head.appendChild(script)
  })
}

// 初始化vconsole (CDN方式)
export async function initVConsoleFromCDN(): Promise<void> {
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
    // 从CDN加载vconsole
    const VConsole = await loadVConsoleFromCDN()
    
    // 创建vconsole实例
    const vConsole = new VConsole({
      theme: VCONSOLE_CONFIG.theme as 'light' | 'dark',
      defaultPlugins: VCONSOLE_CONFIG.defaultPlugins as any,
      maxLogNumber: VCONSOLE_CONFIG.maxLogNumber,
      onReady: function () {
        console.log('vconsole: 移动端调试工具已启用 (CDN方式)')
        
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
      console.log('=== 移动端调试信息 (CDN方式) ===')
      console.log('User Agent:', navigator.userAgent)
      console.log('Screen Size:', `${window.innerWidth} x ${window.innerHeight}`)
      console.log('Device Pixel Ratio:', window.devicePixelRatio)
      console.log('Touch Support:', 'ontouchstart' in window)
      console.log('Environment:', import.meta.env.MODE)
      console.log('vConsole Config:', VCONSOLE_CONFIG)
      console.log('================================')
    }
    
  } catch (error) {
    console.error('vconsole: CDN方式初始化失败', error)
  }
}

// 扩展window类型定义
declare global {
  interface Window {
    vConsole?: any
    VConsole?: any
    __wxjs_environment?: string
  }
}
