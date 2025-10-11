# vConsole 故障排除指南

## 🔧 问题解决

### 问题：`require is not defined`
**原因**: 在浏览器环境中使用 `require` 语法导致错误

**解决方案**: 已更新为动态导入方式
- ✅ 使用 `import('vconsole')` 动态导入
- ✅ 提供CDN备用方案
- ✅ 自动降级处理

## 🚀 加载方式

### 1. 主要方式：动态导入
```typescript
// 使用 ES6 动态导入
const vconsoleModule = await import('vconsole' as any)
VConsole = vconsoleModule.default || vconsoleModule
```

### 2. 备用方式：CDN加载
```typescript
// 从CDN加载vconsole
const script = document.createElement('script')
script.src = 'https://unpkg.com/vconsole@latest/dist/vconsole.min.js'
```

## 📋 自动降级流程

1. **尝试动态导入** → 如果失败
2. **自动切换到CDN方式** → 如果也失败
3. **记录错误日志** → 不影响应用正常运行

## 🎯 配置说明

### 环境变量配置
创建 `.env.local` 文件：
```bash
# 启用 vConsole
VITE_VCONSOLE_ENABLED=true

# 只在移动端启用
VITE_VCONSOLE_MOBILE_ONLY=true

# 主题设置
VITE_VCONSOLE_THEME=light
```

### 手动控制
```typescript
import { 
  showVConsole, 
  hideVConsole, 
  toggleVConsole 
} from '@/utils/vconsole'

// 显示/隐藏 vConsole
showVConsole()
hideVConsole()
toggleVConsole()
```

## 🧪 测试方法

### 1. 移动端测试
- 在手机浏览器中打开应用
- 查看右下角的 vConsole 按钮
- 点击按钮打开调试面板

### 2. 功能测试
访问 `/test/vconsole-test` 页面：
- 设备信息显示
- Console 日志测试
- 网络请求测试
- 本地存储测试

## 🔍 调试信息

### 控制台日志
```
vconsole: 移动端调试工具已启用
=== 移动端调试信息 ===
User Agent: Mozilla/5.0...
Screen Size: 375 x 667
Device Pixel Ratio: 2
Touch Support: true
Environment: development
====================
```

### 错误处理
```
vConsole 模块导入失败，尝试CDN方式: [错误信息]
vconsole: 移动端调试工具已启用 (CDN方式)
```

## 📱 移动端检测

系统会自动检测：
- ✅ 用户代理字符串
- ✅ 屏幕尺寸 (≤768px)
- ✅ 触摸支持
- ✅ 微信环境

## 🆘 常见问题

### Q: vConsole 按钮不显示
**A**: 检查以下几点：
1. 确认 `.env.local` 文件存在且配置正确
2. 验证当前为移动端环境
3. 查看控制台是否有错误信息
4. 确认不在微信小程序环境

### Q: 控制台显示模块导入错误
**A**: 这是正常的，系统会自动切换到CDN方式：
1. 等待几秒钟
2. 查看是否有 "CDN方式" 的成功日志
3. 如果仍有问题，检查网络连接

### Q: 在PC端也显示了vConsole
**A**: 检查配置：
```bash
VITE_VCONSOLE_MOBILE_ONLY=true
```

## 📋 文件结构

```
src/
├── utils/
│   ├── vconsole.ts              # 主要实现 (动态导入)
│   ├── vconsole-fallback.ts     # 备用实现 (CDN方式)
│   └── vconsole-config.ts       # 配置文件
├── views/
│   └── test/
│       └── vconsole-test.vue    # 测试页面
└── main.ts                      # 主应用入口
```

## 🎯 最佳实践

1. **开发环境**: 启用 vConsole 进行调试
2. **生产环境**: 禁用 vConsole 避免性能影响
3. **移动端优先**: 只在移动端启用，避免影响PC端开发
4. **错误处理**: 提供备用方案，确保应用稳定运行

---

**状态**: ✅ 问题已解决  
**版本**: v1.1.0  
**更新**: 修复 require 错误，添加CDN备用方案
