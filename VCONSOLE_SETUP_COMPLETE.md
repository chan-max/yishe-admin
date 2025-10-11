# vConsole 移动端调试工具 - 安装完成

## ✅ 已完成的配置

### 1. 依赖安装
- ✅ 已添加 `vconsole: ^3.15.1` 到 `package.json`

### 2. 核心文件创建
- ✅ `src/utils/vconsole-config.ts` - 配置文件
- ✅ `src/utils/vconsole.ts` - 核心工具文件
- ✅ `src/views/test/vconsole-test.vue` - 测试页面

### 3. 主应用集成
- ✅ 已在 `src/main.ts` 中集成 vConsole 初始化

### 4. 文档创建
- ✅ `VCONSOLE_README.md` - 详细使用说明
- ✅ `scripts/install-vconsole.js` - 安装脚本

## 🚀 使用方法

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置环境变量
创建 `.env.local` 文件：
```bash
# 启用 vConsole
VITE_VCONSOLE_ENABLED=true

# 只在移动端启用
VITE_VCONSOLE_MOBILE_ONLY=true

# 主题设置
VITE_VCONSOLE_THEME=light
```

### 3. 启动应用
```bash
pnpm dev
```

### 4. 测试功能
- 在移动端设备上打开应用
- 查看右下角的 vConsole 按钮
- 访问 `/test/vconsole-test` 页面进行功能测试

## 🎯 功能特性

- ✅ 自动检测移动端环境
- ✅ 支持环境变量配置
- ✅ 微信环境特殊处理
- ✅ 避免在PC端影响开发体验
- ✅ 支持多种调试插件
- ✅ 完整的测试页面

## 📱 移动端检测

系统会自动检测以下条件：
1. 用户代理字符串包含移动设备关键词
2. 屏幕尺寸 ≤ 768px
3. 支持触摸操作

## 🔧 配置选项

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `VITE_VCONSOLE_ENABLED` | `true` (开发环境) | 是否启用 vConsole |
| `VITE_VCONSOLE_MOBILE_ONLY` | `true` | 是否只在移动端启用 |
| `VITE_VCONSOLE_THEME` | `light` | 主题 (light/dark) |
| `VITE_VCONSOLE_MAX_LOG` | `1000` | 最大日志数量 |
| `VITE_VCONSOLE_PLUGINS` | `system,network,element,storage` | 启用的插件 |

## 🧪 测试页面功能

测试页面 (`/test/vconsole-test`) 包含：
- 设备信息显示
- Console 日志测试
- 网络请求测试
- 本地存储测试
- vConsole 控制功能

## 📋 下一步

1. 运行 `pnpm install` 安装依赖
2. 创建 `.env.local` 配置文件
3. 启动开发服务器
4. 在移动端设备上测试功能

## 🆘 故障排除

如果遇到问题：
1. 检查控制台是否有错误信息
2. 确认环境变量配置正确
3. 验证当前为移动端环境
4. 查看 `VCONSOLE_README.md` 详细说明

---

**安装完成时间**: $(date)
**版本**: v1.0.0
**状态**: ✅ 就绪
