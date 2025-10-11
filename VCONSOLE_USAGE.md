# vConsole 使用说明

## ✅ 安装状态
- vConsole 已成功安装 (版本: 3.15.1)
- 核心文件已创建并配置完成
- 已集成到主应用中

## 🚀 快速开始

### 1. 启用 vConsole
在项目根目录创建 `.env.local` 文件：
```bash
VITE_VCONSOLE_ENABLED=true
VITE_VCONSOLE_MOBILE_ONLY=true
```

### 2. 启动应用
```bash
npm run dev
```

### 3. 移动端测试
- 在手机浏览器中打开应用
- 查看右下角的 vConsole 按钮
- 点击按钮打开调试面板

## 📱 功能特性

### 自动检测
- ✅ 只在移动端设备上启用
- ✅ 自动检测微信环境
- ✅ 避免在PC端影响开发体验

### 调试功能
- 📊 系统信息查看
- 🌐 网络请求监控
- 🏗️ DOM元素检查
- 💾 本地存储管理

## 🧪 测试页面

访问 `/test/vconsole-test` 页面进行功能测试：
- 设备信息显示
- Console 日志测试
- 网络请求测试
- 本地存储测试

## ⚙️ 配置选项

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `VITE_VCONSOLE_ENABLED` | `true` (开发环境) | 是否启用 vConsole |
| `VITE_VCONSOLE_MOBILE_ONLY` | `true` | 是否只在移动端启用 |
| `VITE_VCONSOLE_THEME` | `light` | 主题 (light/dark) |
| `VITE_VCONSOLE_MAX_LOG` | `1000` | 最大日志数量 |

## 🔧 手动控制

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

## 🆘 故障排除

### 问题：vConsole 未显示
1. 检查 `.env.local` 文件是否存在
2. 确认 `VITE_VCONSOLE_ENABLED=true`
3. 验证当前为移动端环境
4. 查看浏览器控制台是否有错误

### 问题：TypeScript 错误
- 已使用 `require` 方式导入，避免类型问题
- 如仍有问题，可添加 `// @ts-ignore` 注释

## 📋 文件结构

```
src/
├── utils/
│   ├── vconsole.ts          # 核心工具文件
│   ├── vconsole-config.ts   # 配置文件
│   └── vconsole-test.ts     # 测试文件
├── views/
│   └── test/
│       └── vconsole-test.vue # 测试页面
└── main.ts                  # 主应用入口
```

## 🎯 下一步

1. 创建 `.env.local` 配置文件
2. 启动开发服务器
3. 在移动端设备上测试功能
4. 根据需要调整配置选项

---

**状态**: ✅ 就绪  
**版本**: v1.0.0  
**最后更新**: $(date)
