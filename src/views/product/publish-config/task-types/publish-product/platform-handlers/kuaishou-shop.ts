import type { PlatformHandler } from './types'
import { normalizePsdImageIndexes, validatePsdImageIndexes, normalizeVendorProductMappings } from './shared'

export const kuaishouShopHandler: PlatformHandler = {
  platform: 'kuaishou_shop',

  validateConfig(configData) {
    const errors: string[] = []
    const sameId = typeof configData?.sameId === 'string' ? configData.sameId.trim() : ''
    const vendorId = configData?.vendorId

    if (sameId && !/^\d+$/.test(sameId)) {
      errors.push('模板 sameId 必须是数字')
    }
    if (vendorId !== undefined && vendorId !== null && vendorId !== '' && !Number.isFinite(Number(vendorId))) {
      errors.push('绑定厂家无效')
    }
    if (!validatePsdImageIndexes(configData?.psdImageIndexes)) {
      errors.push('套图图片序号格式不正确，请填写 1、1,3 或 2-5')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  formatConfigForSubmit(configData) {
    const formatted = { ...configData }

    if (formatted.sameId !== undefined && formatted.sameId !== null) {
      formatted.sameId = String(formatted.sameId).trim()
    }
    if (formatted.vendorId !== undefined && formatted.vendorId !== null && formatted.vendorId !== '') {
      formatted.vendorId = Number(formatted.vendorId)
    } else {
      formatted.vendorId = undefined
    }
    formatted.psdImageIndexes = normalizePsdImageIndexes(formatted.psdImageIndexes) || undefined
    formatted.vendorCode = String(formatted.vendorCode || '').trim() || undefined
    formatted.vendorName = String(formatted.vendorName || '').trim() || undefined
    formatted.vendorProductMappings = normalizeVendorProductMappings(formatted.vendorProductMappings)

    return formatted
  },

  formatConfigForEdit(configData) {
    const formatted = { ...configData }
    if (formatted.sameId !== undefined && formatted.sameId !== null) {
      formatted.sameId = String(formatted.sameId).trim()
    }
    if (formatted.vendorId !== undefined && formatted.vendorId !== null && formatted.vendorId !== '') {
      formatted.vendorId = Number(formatted.vendorId)
    }
    formatted.psdImageIndexes = normalizePsdImageIndexes(formatted.psdImageIndexes)
    return formatted
  },

  getHints() {
    return [
      '支持配置快手小店模板 sameId，发布端会优先进入 add?sameId=... 页面',
      '支持绑定厂家，生成 productCode 时会按“素材码-厂家码”拼接',
      '支持按序号选择套图图片，例如 1、1,3 或 2-5；留空默认使用全部套图图片',
      '当前先支持标题、描述、图片和少量可选参数透传'
    ]
  }
}
