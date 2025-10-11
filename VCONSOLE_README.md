# vConsole 移动端调试工具配置

## 概述

本项目已集成 vConsole 移动端调试工具，用于在移动端浏览器中调试应用。

## 功能特性

- ✅ 自动检测移动端环境
- ✅ 支持环境变量配置
- ✅ 微信环境特殊处理
- ✅ 避免在PC端影响开发体验
- ✅ 支持多种调试插件

## 环境变量配置

在项目根目录创建 `.env.local` 或 `.env.development` 文件，添加以下配置：

```bash
# 是否启用vconsole (true/false)
VITE_VCONSOLE_ENABLED=true

# 是否只在移动端启用 (true/false)
VITE_VCONSOLE_MOBILE_ONLY=true

# 是否在微信环境下启用 (true/false)
VITE_VCONSOLE_WECHAT_ENABLED=true

# vconsole主题 (light/dark)
VITE_VCONSOLE_THEME=light

# 最大日志数量
VITE_VCONSOLE_MAX_LOG=1000

# 启用的插件 (用逗号分隔)
VITE_VCONSOLE_PLUGINS=system,network,element,storage

# 是否显示调试信息 (true/false)
VITE_VCONSOLE_DEBUG_INFO=true
```

## 默认行为

- 开发环境 (`import.meta.env.DEV`) 默认启用
- 生产环境默认禁用
- 只在移动端设备上启用
- 微信小程序环境下自动禁用

## 使用方法

### 1. 自动启用

vConsole 会在应用启动时自动检测环境并启用，无需手动操作。

### 2. 手动控制

```typescript
import { 
  initVConsole, 
  destroyVConsole, 
  showVConsole, 
  hideVConsole,
  toggleVConsole 
} from '@/utils/vconsole'

// 初始化
initVConsole()

// 显示/隐藏
showVConsole()
hideVConsole()
toggleVConsole()

// 销毁
destroyVConsole()
```

### 3. 全局访问

vConsole 实例会挂载到 `window.vConsole`，可以直接访问：

```javascript
// 检查是否已初始化
if (window.vConsole) {
  window.vConsole.show()
}
```

## 调试插件

默认启用的插件：

- **System**: 系统信息
- **Network**: 网络请求
- **Element**: DOM元素检查
- **Storage**: 本地存储

## 移动端检测逻辑

系统会通过以下方式检测移动端：

1. 用户代理字符串检测
2. 屏幕尺寸检测 (≤768px)
3. 触摸支持检测

## 注意事项

1. **性能影响**: vConsole 会增加包体积，生产环境建议禁用
2. **微信环境**: 在微信小程序中会自动禁用
3. **PC端**: 默认不在PC端启用，避免影响开发体验
4. **内存使用**: 日志会占用内存，建议设置合理的最大日志数量

## 故障排除

### vConsole 未显示

1. 检查环境变量配置
2. 确认当前为移动端环境
3. 查看控制台是否有错误信息
4. 检查是否在微信小程序环境

### 性能问题

1. 减少最大日志数量
2. 禁用不必要的插件
3. 在生产环境禁用 vConsole

## 更新日志

- v1.0.0: 初始版本，支持基础移动端调试功能
- v1.1.0: 添加环境变量配置支持
- v1.2.0: 优化移动端检测逻辑，添加微信环境处理
