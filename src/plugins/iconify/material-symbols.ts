/**
 * Material Symbols 图标集加载器
 * 将 material-symbols 图标数据注册到 Iconify 实例中
 * 使得 <Icon icon="material-symbols:xxx" /> 可以直接使用
 */
import Iconify from '@iconify/iconify'
import materialSymbols from '@iconify/json/json/material-symbols.json'

// 将 material-symbols 图标集注册到 Iconify
Iconify.addCollection(materialSymbols as any)

export default materialSymbols
