import type { PlatformHandler } from './types'
import { normalizeTemuCategoryPath } from './shared'

function pickTemuConfigFields(configData: Record<string, any> = {}) {
  return {
    account: configData?.account,
    password: configData?.password,
    needLogin: configData?.needLogin,
    categoryPath: configData?.categoryPath
  }
}

export const temuHandler: PlatformHandler = {
  platform: 'temu',

  validateConfig(configData) {
    const errors: string[] = []
    const account = typeof configData?.account === 'string' ? configData.account.trim() : ''
    const password = typeof configData?.password === 'string' ? configData.password.trim() : ''
    const needLogin = configData?.needLogin === true
    const rawCategoryPath = configData?.categoryPath
    const normalizedCategoryPath = normalizeTemuCategoryPath(rawCategoryPath)

    if (needLogin && !account) {
      errors.push('开启登录后必须填写账号')
    }

    if (needLogin && !password) {
      errors.push('开启登录后必须填写密码')
    }

    if (rawCategoryPath !== undefined && rawCategoryPath !== null && String(rawCategoryPath).trim()) {
      if (normalizedCategoryPath.length === 0) {
        errors.push('类目路径格式无效，请输入 JSON 数组或逐行填写类目')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  formatConfigForSubmit(configData) {
    const formatted = pickTemuConfigFields(configData)
    if (formatted.account !== undefined && formatted.account !== null) {
      formatted.account = String(formatted.account).trim()
    }
    if (formatted.password !== undefined && formatted.password !== null) {
      formatted.password = String(formatted.password).trim()
    }
    formatted.needLogin = formatted.needLogin === true
    formatted.categoryPath = normalizeTemuCategoryPath(formatted.categoryPath)

    if (!formatted.categoryPath.length) {
      delete formatted.categoryPath
    }

    return formatted
  },

  formatConfigForEdit(configData) {
    const formatted = pickTemuConfigFields(configData)

    if (formatted.account !== undefined && formatted.account !== null) {
      formatted.account = String(formatted.account).trim()
    }
    if (formatted.password !== undefined && formatted.password !== null) {
      formatted.password = String(formatted.password).trim()
    }
    formatted.needLogin = formatted.needLogin === true
    formatted.categoryPath = (() => {
      const nextValue = normalizeTemuCategoryPath(formatted.categoryPath)
      return nextValue.length > 0 ? JSON.stringify(nextValue) : ''
    })()

    return formatted
  },

  getHints() {
    return [
      '如需发布前自动处理登录，请开启“是否需要登录”并填写账号密码',
      '类目路径建议直接填写 JSON 数组，例如：["厨房","毛巾"]',
      '发布执行时会按数组顺序逐列匹配类目文字并点击'
    ]
  }
}
