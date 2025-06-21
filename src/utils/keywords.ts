/**
 * 关键词处理工具函数
 */

/**
 * 解析关键词字符串为数组
 * @param keywords 关键词字符串，用逗号分隔
 * @param separator 分隔符，默认为逗号
 * @returns 关键词数组
 */
export const parseKeywords = (keywords: string, separator: string = ','): string[] => {
  if (!keywords) return []
  
  return keywords
    .split(separator)
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0)
}

/**
 * 格式化关键词数组为字符串
 * @param keywords 关键词数组
 * @param separator 分隔符，默认为逗号
 * @returns 格式化后的关键词字符串
 */
export const formatKeywords = (keywords: string[], separator: string = ','): string => {
  if (!keywords || !Array.isArray(keywords)) return ''
  
  return keywords
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0)
    .join(separator)
}

/**
 * 清理关键词字符串
 * @param keywords 关键词字符串
 * @param separator 分隔符，默认为逗号
 * @returns 清理后的关键词字符串
 */
export const cleanKeywords = (keywords: string, separator: string = ','): string => {
  return formatKeywords(parseKeywords(keywords, separator), separator)
}

/**
 * 检查关键词是否包含指定关键词
 * @param keywords 关键词字符串
 * @param targetKeyword 目标关键词
 * @param separator 分隔符，默认为逗号
 * @returns 是否包含
 */
export const hasKeyword = (keywords: string, targetKeyword: string, separator: string = ','): boolean => {
  const keywordArray = parseKeywords(keywords, separator)
  return keywordArray.some(keyword => keyword.toLowerCase() === targetKeyword.toLowerCase())
}

/**
 * 添加关键词
 * @param keywords 原关键词字符串
 * @param newKeyword 新关键词
 * @param separator 分隔符，默认为逗号
 * @returns 添加后的关键词字符串
 */
export const addKeyword = (keywords: string, newKeyword: string, separator: string = ','): string => {
  if (!newKeyword || !newKeyword.trim()) return keywords
  
  const keywordArray = parseKeywords(keywords, separator)
  const trimmedKeyword = newKeyword.trim()
  
  // 检查是否已存在
  if (keywordArray.some(keyword => keyword.toLowerCase() === trimmedKeyword.toLowerCase())) {
    return keywords
  }
  
  keywordArray.push(trimmedKeyword)
  return formatKeywords(keywordArray, separator)
}

/**
 * 移除关键词
 * @param keywords 原关键词字符串
 * @param targetKeyword 要移除的关键词
 * @param separator 分隔符，默认为逗号
 * @returns 移除后的关键词字符串
 */
export const removeKeyword = (keywords: string, targetKeyword: string, separator: string = ','): string => {
  const keywordArray = parseKeywords(keywords, separator)
  const filteredKeywords = keywordArray.filter(
    keyword => keyword.toLowerCase() !== targetKeyword.toLowerCase()
  )
  return formatKeywords(filteredKeywords, separator)
}

/**
 * 获取关键词数量
 * @param keywords 关键词字符串
 * @param separator 分隔符，默认为逗号
 * @returns 关键词数量
 */
export const getKeywordCount = (keywords: string, separator: string = ','): number => {
  return parseKeywords(keywords, separator).length
}

/**
 * 验证关键词格式
 * @param keywords 关键词字符串
 * @param separator 分隔符，默认为逗号
 * @returns 验证结果
 */
export const validateKeywords = (keywords: string, separator: string = ','): {
  isValid: boolean
  message: string
} => {
  if (!keywords) {
    return { isValid: true, message: '' }
  }
  
  const keywordArray = parseKeywords(keywords, separator)
  
  // 检查关键词长度
  for (const keyword of keywordArray) {
    if (keyword.length > 50) {
      return { 
        isValid: false, 
        message: `关键词"${keyword}"长度不能超过50个字符` 
      }
    }
  }
  
  // 检查关键词数量
  if (keywordArray.length > 20) {
    return { 
      isValid: false, 
      message: '关键词数量不能超过20个' 
    }
  }
  
  return { isValid: true, message: '' }
} 