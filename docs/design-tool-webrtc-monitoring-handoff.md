# 设计工具 WebRTC 整页监控交接文档

## 背景目标

管理后台需要监控设计工具端的运行状态和页面画面。当前实现目标不是高性能远程桌面，也不是让服务端承载视频流，而是给运营/管理员提供一个轻量的“网页管理系统监控设计工具”的能力。

核心约束：

- 监控范围从原来的画布扩展为整个设计工具页面。
- 媒体流不经过业务服务端，服务端只做鉴权、连接管理和 JSON 信令转发。
- 后台和设计工具之间使用 WebRTC P2P，PeerJS 只负责建立连接。
- 默认低帧率、低分辨率，优先稳定和低资源消耗。

## 代码位置

管理后台 `D:\workspace\yishe-admin`：

- `src/views/external/design-tool/index.vue`
  - 设计工具连接列表。
  - “整页监控”入口和监控弹窗。
  - 向设计工具发送 `page-monitor-request` / `page-monitor-stop` 远程命令。
- `src/services/canvasMonitor.ts`
  - 后台侧 PeerJS 接收端。
  - 初始化 admin peer。
  - 接收远端 WebRTC media stream 并挂载到 `<video>`。
- `src/services/websocketClient.ts`
  - 增加远程监控信令相关字段类型。
- `src/api/system/websocket/index.ts`
  - 打开设计工具相关 API。注意这里应使用项目封装后的 `request.post()` 获取业务响应。

设计工具 `D:\workspace\yishe-tool`：

- `src/services/canvasStream.ts`
  - 设计工具侧页面采集和 WebRTC 推流。
  - 使用 `html-to-image` 将页面 DOM 转成图片，再绘制到隐藏 canvas。
  - 通过 `canvas.captureStream(fps)` 生成 MediaStream。
  - 使用 PeerJS call 到后台 admin peer。
- `src/services/websocketClient.ts`
  - 监听后台远程命令：
    - `page-monitor-request`
    - `canvas-monitor-request`
    - `page-monitor-stop`
  - 返回设计工具端 peerId 给后台。
  - 限制只有发起监控的 admin peer 可以连接。

服务端 `D:\workspace\yishe-server`：

- 当前方案没有新增媒体流接口。
- 服务端只沿用现有 websocket/remote-command/service-command 能力做授权和信令转发。
- 不承担截图、视频帧、音视频流中转。

## 实现架构

整体链路：

1. 管理后台页面点击某个设计工具实例的“整页监控”。
2. 后台创建一个 PeerJS admin peer，得到 `adminPeerId`。
3. 后台通过服务端 websocket 向目标设计工具发送 JSON 命令：
   - `type: "page-monitor-request"`
   - `payload.adminPeerId`
   - 帧率、分辨率等参数。
4. 服务端只转发这个 JSON 命令到目标设计工具连接。
5. 设计工具收到命令后创建自己的 PeerJS peer。
6. 设计工具启动页面采集：
   - 将页面 DOM 转为图片。
   - 绘制到隐藏 canvas。
   - 用 `canvas.captureStream()` 得到视频流。
7. 设计工具通过 PeerJS/WebRTC call 到后台 `adminPeerId`。
8. 后台 `canvasMonitorService` 接收 MediaStream，并展示在监控弹窗的 `<video>`。
9. 关闭弹窗或点击停止后，后台发送 `page-monitor-stop`，两端清理 PeerJS、MediaStream、定时器。

## 为什么服务端不消耗流量资源

本方案的媒体数据链路是：

```text
设计工具浏览器 -> WebRTC P2P -> 管理后台浏览器
```

服务端只处理：

```text
后台发起监控请求 -> 服务端鉴权/转发 JSON -> 设计工具
设计工具返回 peerId -> 服务端转发 JSON -> 后台
```

也就是说服务端只经过少量文本消息，不经过截图帧和视频流。后续如果引入 TURN 中继，需要注意 TURN 服务器才会承载媒体流量，不能部署到当前业务服务端上，除非明确接受这部分带宽成本。

## 当前默认参数

后台发起监控时默认传给设计工具：

- `snapshotFps: 1`
- `fps: 6`
- `maxWidth: 1280`
- `maxHeight: 720`
- `targetSelector: "#app"`

含义：

- DOM 快照频率低，减少设计工具端 CPU 压力。
- WebRTC 视频帧率低，保证能看状态即可。
- 最大 720p，避免后台查看时占用过高带宽。
- 当前采集目标是应用根节点，可继续调整为全页面或特定容器。

## 权限与安全

当前设计：

- 后台只能对自己有权限的在线设计工具连接发起命令。
- 服务端沿用已有连接所有权校验。
- 设计工具端记录 `allowedAdminPeerId`，只允许本次请求中的 admin peer 建立连接。
- 停止监控后应清理 allowed peer、PeerJS call、MediaStream tracks 和定时器。

后续建议补强：

- 增加一次性 monitor session token。
- 在 `page-monitor-request` 中带 `sessionId`，所有响应和 stop 都按 sessionId 匹配。
- 限制单个设计工具同时只能存在一个监控会话，或明确支持多后台并发查看。
- 在 UI 上显示监控发起人、开始时间、持续时长。

## 已知问题

1. DOM 转图片不是实时屏幕录制

   当前用 `html-to-image` 做页面快照，再输出成视频流。它适合轻量监控，但不是原生屏幕共享。复杂 CSS、跨域图片、canvas、video、iframe 可能无法完整复制。

2. 页面动态效果会有延迟

   `snapshotFps` 默认 1，适合看状态，不适合看高频操作过程。

3. WebRTC NAT 穿透不稳定

   只靠 PeerJS 默认能力，在复杂网络下可能连不上。真正生产化需要配置 STUN/TURN。

4. 当前没有监控质量控制 UI

   帧率、分辨率、采集范围目前写在请求参数里，后台没有提供下拉或滑块调整。

5. 错误提示还可以更细

   目前主要显示连接失败、超时、peer 错误。后续可以区分“目标离线”“peer 初始化失败”“浏览器不支持 captureStream”“NAT 穿透失败”等。

## 后续优化路线

### 第一阶段：稳定性

- 增加 monitor sessionId，避免旧响应污染新会话。
- 后台弹窗关闭时确保停止命令发出，并本地立即释放 video stream。
- 设计工具端确保所有异常路径都会 `stopMonitoring()`。
- 补齐 PeerJS error/open/close/disconnected 的状态上报。
- 增加 15 到 30 秒连接超时提示。

### 第二阶段：画质和性能

- 后台增加“流畅 / 标准 / 清晰”档位：
  - 流畅：640x360，1 fps snapshot，5 fps stream。
  - 标准：1280x720，1 fps snapshot，6 fps stream。
  - 清晰：1600x900，2 fps snapshot，10 fps stream。
- 根据页面是否可见自动降频。
- 长时间监控自动降频或提示确认继续。
- 对重复画面做跳帧，页面无变化时不重绘 canvas。

### 第三阶段：更真实的整页监控

可考虑替代方案：

- `getDisplayMedia`
  - 优点：真实屏幕/标签页共享，效果最好。
  - 缺点：需要用户授权，不能后台静默开启。
- Chrome DevTools Protocol screencast
  - 优点：对浏览器自动化环境更可靠。
  - 缺点：实现复杂，可能需要客户端本地服务参与。
- Playwright/Chrome 截图流
  - 优点：适合自动化浏览器环境。
  - 缺点：本质仍是截图流，客户端 CPU 负担要控制。

当前方案选择 `html-to-image + canvas.captureStream`，是为了尽量纯前端、低侵入、不让服务端背流量。

### 第四阶段：监控管理系统化

- 后台增加监控会话列表：
  - 哪个管理员正在看哪个设计工具。
  - 当前连接质量。
  - 开始时间和持续时长。
- 支持只读监控和远程指令联动。
- 支持监控截图留痕，但截图不要自动上传服务端，除非用户手动保存。
- 增加审计日志：谁在什么时候发起/停止监控。

## 交接注意点

- 不要把视频帧传到 `yishe-server`。
- 不要在服务端新增截图上传、视频中转、长连接二进制流接口。
- 如果必须解决 NAT 穿透问题，优先独立部署 TURN，不要混进业务 API 服务。
- 设计工具端采集频率一定要保守，避免影响 Temu 发布任务和设计 Agent 执行。
- 后台提示颜色不要用 `success` 字段缺失来判失败，只有明确 `success === false`、`error` 或 `errorDetail` 才应该红色。

