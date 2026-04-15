import type { PlatformHandler } from './types'

function isPlainRecord(value: unknown): value is Record<string, any> {
  return !!value && Object.prototype.toString.call(value) === '[object Object]'
}

function toSerializablePlainObject(value: unknown): Record<string, any> | null {
  if (!isPlainRecord(value)) {
    return null
  }

  try {
    const normalized = JSON.parse(JSON.stringify(value))
    return isPlainRecord(normalized) ? normalized : null
  } catch {
    return null
  }
}

function parseJsObjectLiteral(raw: string): Record<string, any> | null {
  try {
    const evaluated = new Function(`"use strict"; return (${raw});`)()
    return toSerializablePlainObject(evaluated)
  } catch {
    return null
  }
}

function normalizeTemuProductTemplate(input: unknown): Record<string, any> | null {
  if (isPlainRecord(input)) {
    return toSerializablePlainObject(input)
  }

  if (!input || typeof input !== 'string') {
    return null
  }

  const raw = input.trim()
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    return toSerializablePlainObject(parsed)
  } catch {
    return parseJsObjectLiteral(raw)
  }
}

function pickTemuConfigFields(configData: Record<string, any> = {}) {
  return {
    productTemplate: configData?.productTemplate
  }
}

export const temuHandler: PlatformHandler = {
  platform: 'temu',

  validateConfig(configData) {
    const errors: string[] = []
    const rawProductTemplate = configData?.productTemplate
    const hasProductTemplate =
      rawProductTemplate !== undefined && rawProductTemplate !== null && String(rawProductTemplate).trim()
    const normalizedProductTemplate = normalizeTemuProductTemplate(rawProductTemplate)

    if (!hasProductTemplate) {
      errors.push('商品模板不能为空')
    }

    if (hasProductTemplate && !normalizedProductTemplate) {
      errors.push('商品模板格式无效，请输入合法 JSON 或 JS 对象')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  formatConfigForSubmit(configData) {
    const formatted = pickTemuConfigFields(configData)
    const normalizedProductTemplate = normalizeTemuProductTemplate(formatted.productTemplate)

    if (normalizedProductTemplate) {
      formatted.productTemplate = normalizedProductTemplate
    } else {
      delete formatted.productTemplate
    }

    return formatted
  },

  formatConfigForEdit(configData) {
    const formatted = pickTemuConfigFields(configData)
    formatted.productTemplate = (() => {
      const nextValue = normalizeTemuProductTemplate(formatted.productTemplate)
      return nextValue ? JSON.stringify(nextValue, null, 2) : ''
    })()

    return formatted
  },

  getHints() {
    return [
      'Temu 当前仅使用商品模板配置，登录与类目路径已暂时隐藏',
      '商品模板支持 JSON 和合法 JS 对象字面量，保存后会统一转成标准对象',
      '浏览器自动化侧的页面打开与后续动作暂未接入到这里'
    ]
  }
}
