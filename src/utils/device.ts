/**
 * 设备标识工具
 * 用于生成和管理设备唯一标识
 */

// 生成设备指纹
export function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Device fingerprint', 2, 2)
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform
  ].join('|')
  
  // 生成简单的hash
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36)
}

// 获取或创建设备ID
export function getDeviceId(): string {
  const deviceKey = 'DEVICE_ID'
  let deviceId = localStorage.getItem(deviceKey)
  
  if (!deviceId) {
    deviceId = generateDeviceFingerprint()
    localStorage.setItem(deviceKey, deviceId)
  }
  
  return deviceId
}

// 获取设备信息
export function getDeviceInfo() {
  return {
    id: getDeviceId(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: Date.now()
  }
}

// 检查是否为移动设备
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 获取设备类型
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (isMobileDevice()) {
    return 'mobile'
  }
  
  if (screen.width >= 768 && screen.width <= 1024) {
    return 'tablet'
  }
  
  return 'desktop'
}
