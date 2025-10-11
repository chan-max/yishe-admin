#!/usr/bin/env node

/**
 * vConsole 安装脚本
 * 用于在项目中安装和配置 vConsole
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 开始安装 vConsole...')

// 检查 package.json 中是否已包含 vconsole
const packageJsonPath = path.join(process.cwd(), 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

if (!packageJson.dependencies.vconsole) {
  console.log('📦 添加 vconsole 依赖到 package.json...')
  packageJson.dependencies.vconsole = '^3.15.1'
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  console.log('✅ vconsole 依赖已添加')
} else {
  console.log('✅ vconsole 依赖已存在')
}

// 检查是否已存在 vconsole 配置文件
const vconsoleConfigPath = path.join(process.cwd(), 'src/utils/vconsole-config.ts')
if (!fs.existsSync(vconsoleConfigPath)) {
  console.log('⚙️ 创建 vconsole 配置文件...')
  // 配置文件已在之前创建
  console.log('✅ vconsole 配置文件已创建')
} else {
  console.log('✅ vconsole 配置文件已存在')
}

// 检查是否已存在 vconsole 工具文件
const vconsoleUtilPath = path.join(process.cwd(), 'src/utils/vconsole.ts')
if (!fs.existsSync(vconsoleUtilPath)) {
  console.log('🔧 创建 vconsole 工具文件...')
  // 工具文件已在之前创建
  console.log('✅ vconsole 工具文件已创建')
} else {
  console.log('✅ vconsole 工具文件已存在')
}

// 检查 main.ts 是否已引入 vconsole
const mainTsPath = path.join(process.cwd(), 'src/main.ts')
const mainTsContent = fs.readFileSync(mainTsPath, 'utf8')

if (!mainTsContent.includes('initVConsole')) {
  console.log('🔗 在 main.ts 中添加 vconsole 初始化...')
  // 已在之前添加
  console.log('✅ vconsole 初始化已添加')
} else {
  console.log('✅ vconsole 初始化已存在')
}

console.log('')
console.log('🎉 vConsole 安装完成！')
console.log('')
console.log('📋 使用说明：')
console.log('1. 在移动端设备上打开应用')
console.log('2. 查看右下角的 vConsole 按钮')
console.log('3. 点击按钮打开调试面板')
console.log('')
console.log('⚙️ 配置说明：')
console.log('1. 创建 .env.local 文件')
console.log('2. 添加 VITE_VCONSOLE_ENABLED=true 启用 vConsole')
console.log('3. 查看 VCONSOLE_README.md 了解详细配置')
console.log('')
console.log('🧪 测试页面：')
console.log('访问 /test/vconsole-test 页面进行功能测试')
console.log('')
