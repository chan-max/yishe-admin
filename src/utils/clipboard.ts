import { ElMessage } from 'element-plus'

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @param successMessage 成功提示消息，默认为 '复制成功'
 * @param errorMessage 失败提示消息，默认为 '复制失败'
 * @returns Promise<boolean> 是否复制成功
 */
export async function copyToClipboard(
  text: string,
  successMessage: string = '复制成功',
  errorMessage: string = '复制失败'
): Promise<boolean> {
  if (!text) {
    ElMessage.warning('没有可复制的内容')
    return false
  }

  try {
    // 检查 Clipboard API 是否可用
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      ElMessage.success(successMessage)
      return true
    } else {
      // 降级到传统方法
      return fallbackCopyTextToClipboard(text, successMessage, errorMessage)
    }
  } catch (err) {
    console.error('复制失败:', err)
    // 降级到传统方法
    return fallbackCopyTextToClipboard(text, successMessage, errorMessage)
  }
}

/**
 * 降级复制方法（兼容旧浏览器）
 * @param text 要复制的文本
 * @param successMessage 成功提示消息
 * @param errorMessage 失败提示消息
 * @returns boolean 是否复制成功
 */
function fallbackCopyTextToClipboard(
  text: string,
  successMessage: string,
  errorMessage: string
): boolean {
  const textArea = document.createElement('textarea')
  textArea.value = text
  
  // 避免滚动到底部
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  textArea.style.pointerEvents = 'none'
  
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  
  try {
    const successful = document.execCommand('copy')
    if (successful) {
      ElMessage.success(successMessage)
      return true
    } else {
      ElMessage.error(errorMessage)
      return false
    }
  } catch (err) {
    console.error('降级复制失败:', err)
    ElMessage.error(errorMessage)
    return false
  } finally {
    document.body.removeChild(textArea)
  }
}

/**
 * 复制产品代码
 * @param code 产品代码
 */
export function copyProductCode(code: string) {
  return copyToClipboard(code, '产品代码已复制', '复制产品代码失败')
}

/**
 * 复制链接
 * @param link 链接地址
 */
export function copyLink(link: string) {
  return copyToClipboard(link, '链接已复制到剪贴板', '复制链接失败')
}
