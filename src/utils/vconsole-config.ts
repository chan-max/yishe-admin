/**
 * vconsole 配置文件
 * 支持通过环境变量控制vconsole的启用
 */

// 环境变量配置
const VCONSOLE_CONFIG = {
  // 是否启用vconsole（可通过环境变量控制）
  enabled: import.meta.env.VITE_VCONSOLE_ENABLED === 'true' || import.meta.env.DEV,
  
  // 是否只在移动端启用
  mobileOnly: import.meta.env.VITE_VCONSOLE_MOBILE_ONLY !== 'false',
  
  // 是否在微信环境下启用
  wechatEnabled: import.meta.env.VITE_VCONSOLE_WECHAT_ENABLED !== 'false',
  
  // 主题配置
  theme: import.meta.env.VITE_VCONSOLE_THEME || 'light',
  
  // 最大日志数量
  maxLogNumber: parseInt(import.meta.env.VITE_VCONSOLE_MAX_LOG || '1000'),
  
  // 默认插件
  defaultPlugins: (import.meta.env.VITE_VCONSOLE_PLUGINS || 'system,network,element,storage').split(','),
  
  // 是否显示调试信息
  showDebugInfo: import.meta.env.VITE_VCONSOLE_DEBUG_INFO !== 'false'
}

export default VCONSOLE_CONFIG
