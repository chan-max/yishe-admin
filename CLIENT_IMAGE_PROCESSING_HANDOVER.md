# 衣设客户端图片处理系统 — 交接文档

## 一、系统架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    yishe-client (Electron)                   │
├─────────────────────────────────────────────────────────────┤
│  MCP Server (端口3210)                                       │
│    └── image_process_execute 工具                           │
│         └── executeImageToolPlan()                          │
│              └── processImage()                             │
│                   ├── 下载远程图片                            │
│                   ├── 校验操作链                              │
│                   └── executeOperationsChain()              │
│                        └── ImageMagick 引擎执行              │
├─────────────────────────────────────────────────────────────┤
│  本地 ImageMagick CLI                                        │
│    └── magick 命令                                          │
└─────────────────────────────────────────────────────────────┘
```

**核心文件路径：**
```
yishe-client/src/main/
├── image-tool/
│   ├── index.ts                    # 主入口，processImage() 函数
│   └── legacy/
│       ├── imagemagick.js          # ImageMagick CLI 封装
│       ├── operation-registry.js   # 操作注册与校验
│       ├── operations-config.js    # 基础操作配置
│       ├── filter-operations-config.js  # 滤镜操作配置
│       ├── lowpoly.js              # Lowpoly 特效实现
│       └── ai-service.js           # AI 服务集成
└── mcp-server/
    └── server.ts                   # MCP 服务入口
```

---

## 二、支持的操作类型（60+）

### 基础操作（basic）

| 操作 | 说明 | 必填参数 | 可选参数 |
|------|------|----------|----------|
| `resize` | 调整大小 | `width`, `height` | `maintainAspectRatio`(默认true), `quality`(默认90) |
| `crop` | 矩形裁剪 | `width`, `height` | `x`, `y`, `maintainAspectRatio` |
| `shapeCrop` | 形状裁剪 | `shape`(circle/ellipse/star/triangle/diamond/heart/hexagon/octagon) | `width`, `height`, `x`, `y`, `backgroundColor` |
| `rotate` | 旋转 | `degrees` | `backgroundColor` |
| `convert` | 格式转换 | `format`(jpg/png/gif/webp/bmp) | `quality` |
| `watermark` | 水印 | - | `type`(text/image), `text`, `fontSize`, `color`, `position`等 |
| `adjust` | 亮度/对比度/饱和度 | - | `brightness`, `contrast`, `saturation`(-100到100) |
| `trim` | 自动裁剪边缘 | - | `fuzz`, `backgroundColor` |
| `extent` | 扩展画布 | `width`, `height` | `x`, `y`, `backgroundColor`, `gravity` |
| `flip` | 垂直翻转 | - | - |
| `flop` | 水平翻转 | - | - |
| `transpose` | 主对角线翻转 | - | - |
| `transverse` | 副对角线翻转 | - | - |

### 效果操作（effect）- 使用平铺格式

| 操作 | 说明 | 默认参数 |
|------|------|----------|
| `grayscale` | 黑白化 | `intensity:100` |
| `sepia` | 怀旧效果 | `intensity:80` |
| `blur` | 模糊 | `radius:5, sigma:5` |
| `sharpen` | 锐化 | `radius:1, amount:1` |
| `gaussian-blur` | 高斯模糊 | `radius:5` |
| `motion-blur` | 运动模糊 | `radius:10, angle:0` |
| `charcoal` | 炭笔画 | `radius:1, sigma:0.5` |
| `sketch` | 素描 | `radius:1, sigma:0.5` |
| `emboss` | 浮雕 | `radius:1, sigma:0.5` |
| `edge` | 边缘检测 | `radius:1` |
| `posterize` | 海报化 | `levels:4` |
| `pixelate` | 像素化 | `size:10` |
| `mosaic` | 马赛克 | `size:10` |
| `oil-painting` | 油画 | `radius:3` |
| `lowpoly` | Low Poly几何风格 | `pointCount:900, edgeBias:0.65` |
| `vignette` | 晕影效果 | `radius:0, sigma:40` |
| `polaroid` | 宝丽来相框 | `angle:0` |
| `dropShadow` | 悬浮阴影 | `opacity:60, sigma:5, dx:4, dy:4` |
| `roundCorners` | 圆角矩形 | `rx:20` |
| `contrastStretch` | 智能补光 | `blackPoint:0.15, whitePoint:0.05` |
| `normalize` | 标准化 | - |
| `equalize` | 均衡化 | - |
| `gamma` | 伽马校正 | `value:1.0` |
| `threshold` | 二值化 | `value:50` |
| `negate` | 负片 | - |
| `noise` | 添加噪点 | `noiseType:Uniform` |
| `despeckle` | 去噪点 | - |
| `hue` | 色相调整 | `value:0` |
| `colorize` | 着色 | `color:#FF0000, intensity:50` |
| `tint` | 色调调整 | `color:#FFD700, intensity:50` |
| `brightness` | 亮度调整 | `value:0` |
| `contrast` | 对比度调整 | `value:0` |
| `saturation` | 饱和度调整 | `value:0` |
| `adaptive-blur` | 自适应模糊 | `radius:5, sigma:5` |
| `adaptive-sharpen` | 自适应锐化 | `radius:1, sigma:1` |
| `morphology` | 形态学操作 | `method:Erode, kernel:Disk, size:3` |
| `colorspace` | 色彩空间转换 | `space:RGB` |
| `auto-level` | 自动色阶 | - |
| `auto-gamma` | 自动伽马 | - |
| `auto-contrast` | 自动对比度 | - |
| `quantize` | 量化 | `colors:256` |

---

## 三、MCP 调用方式

### 3.1 建立 SSE 连接

```bash
curl -N http://localhost:3210/sse
```

返回：
```
event: endpoint
data: /messages?sessionId=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 3.2 调用 image_process_execute

```bash
curl -X POST "http://localhost:3210/messages?sessionId=YOUR_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "id": 1,
    "params": {
      "name": "image_process_execute",
      "arguments": {
        "imageUrl": "https://example.com/image.jpg",
        "operations": [
          { "type": "resize", "params": { "width": 800, "height": 800 } },
          { "type": "grayscale", "params": {} },
          { "type": "watermark", "params": { "type": "text", "text": "Yishe", "position": "bottom-right" } }
        ]
      }
    }
  }'
```

### 3.3 操作链示例

**示例1：黑白高对比风格**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "operations": [
    { "type": "resize", "params": { "width": 800, "height": 800, "maintainAspectRatio": true } },
    { "type": "grayscale", "params": { "intensity": 100 } },
    { "type": "contrast", "params": { "value": 30 } },
    { "type": "watermark", "params": { "type": "text", "text": "Black Label", "position": "bottom-right", "fontSize": 28, "color": "#FFFFFF" } }
  ]
}
```

**示例2：Lowpoly 艺术晶格**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "operations": [
    { "type": "resize", "params": { "width": 800, "height": 800 } },
    { "type": "lowpoly", "params": { "pointCount": 900, "edgeBias": 0.65 } },
    { "type": "watermark", "params": { "type": "text", "text": "Art Style", "position": "bottom-right" } }
  ]
}
```

**示例3：宝丽来相框 + 悬浮阴影**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "operations": [
    { "type": "resize", "params": { "width": 600, "height": 600 } },
    { "type": "polaroid", "params": { "angle": 5 } },
    { "type": "dropShadow", "params": { "opacity": 70, "sigma": 8, "dx": 6, "dy": 6 } }
  ]
}
```

---

## 四、安全机制

### 4.1 原图物理隔离

```typescript
// safeUnlink - 确保绝不删除原图
function safeUnlink(filePath: string) {
  // 仅允许删除临时文件和输出文件
  // 源图文件（uploads/目录）禁止删除
}
```

### 4.2 文件存储结构

```
yishe-client/workspace/image-tool/
├── uploads/      # 上传的源图（受保护，禁止删除）
├── output/       # 处理结果（可清理）
├── template/     # 模板文件
└── temp/         # 临时文件（自动清理）
```

### 4.3 COS 防盗链处理

```typescript
// downloadFromUrl - 补全腾讯云 COS 防盗链 Header
const headers = {
  'User-Agent': 'Mozilla/5.0 ...',
  'Host': new URL(url).host  // 补全 Host Header
};
```

---

## 五、测试 SOP

### 5.1 健康检查

```bash
curl http://localhost:3210/health
```

### 5.2 数据库查询最新记录

```sql
SELECT id, title, status, source_original_url, result_files, error_message, create_time
FROM image_processing_record
ORDER BY create_time DESC
LIMIT 5;
```

### 5.3 验证结果文件

```bash
# 检查文件是否可访问
curl -I "https://yishe-storage-1257307499.cos.ap-beijing.myqcloud.com/path/to/result.jpg"

# 使用 ImageMagick 验证图片
magick identify -verbose result.jpg | grep -E "Geometry|Type|Depth"
```

### 5.4 常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 下载失败: HTTP 404 | 源图片URL失效 | 更换有效URL |
| 文字水印缺少 text | watermark参数缺少text字段 | 确保params.text不为空 |
| lowpoly执行失败 | 与其他效果组合使用 | lowpoly需单独使用 |
| MCP返回Accepted但无处理 | 客户端未启动MCP服务 | 重启客户端 |

---

## 六、新增算子开发指南

### 6.1 添加新操作步骤

1. **在 `operations-config.js` 中添加配置**
```javascript
{
  type: 'newOperation',
  category: 'effect',
  description: '新操作描述',
  params: {
    param1: { type: 'number', description: '参数1', default: 10 }
  }
}
```

2. **在 `index.ts` 的 `executeOperation()` 中添加执行逻辑**
```typescript
case 'newOperation':
  command = await imageProcessor.newOperation(currentInputPath, outputPath, {
    param1: parseInt(params.param1) || 10
  });
  break;
```

3. **在 `imagemagick.js` 中实现 ImageMagick 命令**
```javascript
async newOperation(inputPath, outputPath, options) {
  const cmd = `magick "${inputPath}" -new-operation-param ${options.param1} "${outputPath}"`;
  await execCommand(cmd);
  return cmd;
}
```

### 6.2 测试新操作

```bash
# 1. 重启客户端加载新代码
# 2. 调用MCP测试
curl -X POST "http://localhost:3210/messages?sessionId=YOUR_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "id": 1,
    "params": {
      "name": "image_process_execute",
      "arguments": {
        "imageUrl": "https://example.com/test.jpg",
        "operations": [
          { "type": "newOperation", "params": { "param1": 20 } }
        ]
      }
    }
  }'
```

---

## 七、版本信息

| 仓库 | 版本号 | 提交 |
|------|--------|------|
| yishe-admin | v0.0.198 | 3ae5ad3 |
| design-server | v0.0.119 | 7a005fe |
| yishe-client | v1.2.167 | 6cad701 |

---

## 八、联系与支持

- 代码仓库：`/Users/jackie/workspace/yishe-client`
- 日志位置：`/Users/jackie/workspace/yishe-client/logs/`
- 工作空间：`/Users/jackie/workspace/yishe-client/workspace/image-tool/`
