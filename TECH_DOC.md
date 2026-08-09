# Yishe Admin 技术交接文档

> **版本**：v0.0.251  
> **最后更新**：2026-08-09  
> **维护团队**：jc & Antigravity AI  

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈全览](#2-技术栈全览)
3. [项目结构](#3-项目结构)
4. [已实现功能模块](#4-已实现功能模块)
5. [工作流引擎系统](#5-工作流引擎系统)
6. [客户端优先架构思想](#6-客户端优先架构思想)
7. [AI 能力集成](#7-ai-能力集成)
8. [数据流与状态管理](#8-数据流与状态管理)
9. [开发规范与命令](#9-开发规范与命令)
10. [后续开发计划 (Roadmap)](#10-后续开发计划-roadmap)
11. [相关联系系统](#11-相关联系系统)

---

## 1. 项目概述

**Yishe Admin** 是一套以电商设计自动化为核心的智能管理后台系统。其定位是：

> 为设计师与电商运营人员提供 **AI 驱动、自动化、工作流可编排** 的高效创作平台。  
> 核心特点：**客户端优先（Client-First）** 执行架构，将大量计算任务下沉至用户浏览器本地执行，最大化节约服务端资源。

### 系统定位

```
用户浏览器 (yishe-admin)
    ↕ API + WebSocket
设计服务端 (design-server - NestJS)
    ↕ 模型服务
AI 模型层 (yishe-models - Python)
    ↕
客户端 (yishe-client - 电商主站)
```

---

## 2. 技术栈全览

### 前端核心

| 技术 | 版本 | 用途 |
|------|------|------|
| **Vue 3** | ^3.5.32 | 核心框架，Composition API |
| **Vite** | ^8.0.8 | 构建工具，极速热更新 |
| **TypeScript** | ^6.0.2 | 强类型开发 |
| **Element Plus** | ^2.13.6 | 主 UI 组件库 |
| **Ant Design Vue** | ^4.2.6 | 辅助 UI 组件库 |
| **Pinia** | ^2.3.1 | 状态管理，支持持久化 |
| **Vue Router** | ^4.6.4 | 前端路由 |
| **vue-i18n** | ^9.14.5 | 国际化 |

### 工作流可视化

| 技术 | 版本 | 用途 |
|------|------|------|
| **@vue-flow/core** | ^1.48.2 | 工作流画布引擎（节点拖拽、连线） |
| **@vue-flow/background** | ^1.3.2 | 画布背景网格 |
| **@vue-flow/controls** | ^1.1.3 | 画布控制面板（缩放/适应） |
| **@vue-flow/minimap** | ^1.5.4 | 画布小地图 |

### 设计与渲染

| 技术 | 版本 | 用途 |
|------|------|------|
| **ag-psd** | ^28.1.0 | 客户端 PSD 文件解析 |
| **html-to-image** | ^1.11.13 | DOM 截图导出 |
| **cropperjs** | ^1.6.1 | 图片裁剪 |
| **ffmpeg.js** | ^4.2.9003 | 客户端视频处理（WebAssembly） |

### 代码编辑器

| 技术 | 版本 | 用途 |
|------|------|------|
| **CodeMirror 6** | ^6.x | 代码脚本编辑器，支持 JS/Python 语法高亮 |
| **@wangeditor** | ^5.1.x | 富文本编辑器 |

### 流程图 / BPM

| 技术 | 版本 | 用途 |
|------|------|------|
| **bpmn-js** | ^17.9.2 | 审批流/业务流程设计器 |
| **bpmn-js-properties-panel** | 5.23.0 | BPMN 属性配置面板 |

### 数据处理与通信

| 技术 | 版本 | 用途 |
|------|------|------|
| **Axios** | ^1.15.0 | HTTP 请求库 |
| **@microsoft/fetch-event-source** | ^2.0.1 | SSE 流式 AI 响应 |
| **socket.io-client** | ^4.7.5 | WebSocket 实时通信 |
| **peerjs** | ^1.5.5 | WebRTC P2P 点对点通信 |
| **xlsx** | ^0.18.5 | Excel 读写 |
| **echarts** | ^5.5.0 | 数据图表 |

### 云存储

| 技术 | 用途 |
|------|------|
| **cos-js-sdk-v5** | 腾讯云 COS 对象存储 |
| **ali-oss** | 阿里云 OSS 对象存储 |

### 表格与列表

| 技术 | 版本 | 用途 |
|------|------|------|
| **vxe-table** | 4.11.19 | 高性能大数据表格（支持拖拽排序） |
| **sortablejs** | ^1.15.3 | 列表拖拽排序 |
| **vuedraggable** | ^4.1.0 | Vue 拖拽列表组件 |

---

## 3. 项目结构

```
src/
├── api/                  # API 接口层（按业务模块分类）
│   ├── ai/               # AI 相关 API（大模型/技能/抠图等）
│   ├── aiAssistant/      # AI 助手对话 API
│   ├── workflow/         # 工作流 CRUD API
│   ├── material/         # 素材管理 API
│   ├── product/          # 商品相关 API
│   ├── vector-search.ts  # 向量检索 API
│   └── ...（其他 45+ API 模块）
│
├── components/           # 公共组件库（72+ 组件）
│   ├── workflow/         # 工作流专属组件
│   │   ├── nodes/        # 画布节点可视化组件（7 种节点类型）
│   │   ├── NodeLibraryPanel.vue    # 系统能力工具箱面板
│   │   ├── ConfigPanel.vue         # 右侧节点属性配置面板（动态 Schema）
│   │   ├── AdvancedCronDialog.vue  # 高级 Cron 定时配置弹窗
│   │   └── TriggerConfigDialog.vue # 触发器运行历史面板
│   ├── AiAssistant/      # AI 助手悬浮对话组件
│   ├── DiyEditor/        # 自定义装修编辑器
│   ├── Editor/           # 富文本编辑器
│   └── ...
│
├── views/                # 页面视图（24 大业务模块）
│   ├── workflow/         # 工作流模块
│   │   ├── index/        # 工作流列表页
│   │   └── editor/       # 工作流画布编辑器
│   │       ├── index.vue           # 编辑器主页（画布+工具栏+面板）
│   │       ├── config/
│   │       │   └── nodeRegistry.ts # 全量系统能力节点注册表（15+ 种节点）
│   │       └── engine/             # 客户端工作流执行引擎（建设中）
│   │           ├── types.ts        # 执行引擎类型定义
│   │           └── templateEvaluator.ts  # {{ 变量 }} 模板求值器
│   ├── material/         # 素材管理中心（19 个子模块）
│   ├── ai/               # AI 功能中心
│   │   ├── assistant/    # AI 助手对话界面
│   │   ├── tti.vue       # 文生图（Text-to-Image）
│   │   ├── tts.vue       # 语音合成（Text-to-Speech）
│   │   └── skills/       # AI 技能管理
│   ├── product/          # 商品管理
│   ├── publish-task/     # 发布任务管理
│   └── ...
│
├── store/                # Pinia 状态仓库
├── router/               # 路由配置（remaining.ts 动态路由）
├── styles/               # 全局样式
│   ├── var.css           # CSS 变量（主题 Token）
│   └── vxe-table-theme.scss # VXE 表格主题样式
├── hooks/                # 组合式 Hooks
├── utils/                # 工具函数
└── psd/                  # PSD 客户端解析相关工具
```

---

## 4. 已实现功能模块

### 4.1 素材管理中心 (`src/views/material/`)

| 子模块 | 说明 |
|--------|------|
| **图片素材库** (`index/`) | 主素材库，支持文件夹树/拖拽排序/批量上传/预览 |
| **PSD 模板管理** (`psdTemplate/`) | PSD 文件管理、图层解析、批量渲染任务 |
| **字体模板** (`fontTemplate/`) | 艺术字/3D 特效字体模板管理 |
| **图片组管理** (`imageGroup/`) | 图片组合/拼接管理 |
| **提示词库** (`prompt/`) | AI 生成提示词管理，支持模板化 |
| **语句库** (`sentence/`) | 文案语句管理，可批量引用 |
| **文件资源** (`file-resource/`) | 通用文件资源管理（视频/音频/文档） |
| **设计模型** (`designModel/`) | 自训练 AI 模型版本管理 |
| **代码脚本** (`codeScript/`) | 自动化脚本管理（JS/Python） |
| **定时脚本任务** (`codeScriptSchedule/`) | 脚本定时执行调度 |
| **通用链接** (`commonUrl/`) | 外部 URL 素材收藏管理 |
| **AI 技能** (`skills/`) | AI 能力工具箱管理（技能注册/测试） |

### 4.2 AI 功能中心 (`src/views/ai/`)

| 功能 | 说明 |
|------|------|
| **AI 对话助手** | 多模型支持（GPT-4o/Claude/DeepSeek），流式 SSE 输出，命令行面板 |
| **文生图 (TTI)** | 支持多款图像生成模型，Prompt 模板管理 |
| **语音合成 (TTS)** | 文本转语音，多音色支持，字幕预览 |
| **MCP 集成** | Model Context Protocol 工具集成，支持外部工具注册 |
| **AI 模型服务** | AI 模型服务管理，支持多提供商（OpenAI/Anthropic 等） |

### 4.3 工作流系统 (`src/views/workflow/`)

> 详见第 5 节。

### 4.4 商品管理 (`src/views/product/`)

- 商品 CRUD 管理、SKU 规格配置
- 商品渲染图自动绑定
- 商品发布任务管理 (`publish-task/`)

### 4.5 独立站电商 (`src/views/independent-site/`)

- 独立站店铺配置与管理
- 商品与店铺绑定关系

### 4.6 向量检索 (`src/views/vector-search/`)

- 基于向量数据库的语义相似度搜索
- 图片 PHash 相似图片检索
- 文本向量嵌入检索

### 4.7 系统管理 (`src/views/system/`)

- 用户/角色/权限管理（RBAC）
- 数据字典管理
- 操作日志审计
- API 秘钥管理

---

## 5. 工作流引擎系统

工作流是系统最核心的未来方向，目标是允许用户 **零代码编排复杂自动化任务链**。

### 5.1 已完成的工作流前端组件

| 文件 | 说明 |
|------|------|
| `views/workflow/index/` | 工作流列表页，支持创建/编辑/运行/删除 |
| `views/workflow/editor/index.vue` | 画布编辑器主页，集成 VueFlow 拖拽画布 |
| `editor/config/nodeRegistry.ts` | **全量系统能力节点注册表**（15+ 节点，6 大分类） |
| `editor/engine/types.ts` | 客户端执行引擎类型定义 |
| `editor/engine/templateEvaluator.ts` | `{{ node_id.variable }}` 模板变量求值器 |
| `components/workflow/NodeLibraryPanel.vue` | 左侧能力工具箱（搜索/分类/拖拽/快速添加） |
| `components/workflow/ConfigPanel.vue` | 右侧配置面板（动态 Schema 表单 + 输出变量预览） |
| `components/workflow/nodes/StartNode.vue` | 开始/触发节点（手动/Cron 定时） |
| `components/workflow/nodes/LLMNode.vue` | AI 大模型节点 |
| `components/workflow/nodes/HttpNode.vue` | HTTP/Webhook 请求节点 |
| `components/workflow/nodes/CodeNode.vue` | 自定义代码脚本节点 |
| `components/workflow/nodes/ConditionNode.vue` | 条件分支逻辑节点 |
| `components/workflow/AdvancedCronDialog.vue` | 高级 Cron 定时设置面板 |
| `components/workflow/TriggerConfigDialog.vue` | 触发历史与运行日志 |

### 5.2 已注册的系统能力节点（`nodeRegistry.ts`）

| 分类 | 节点类型 | 说明 |
|------|----------|------|
| **基础流程** | `start` / `end` | 触发入口（手动/Cron）和结果出口 |
| **AI & LLM** | `llm` | GPT-4o / Claude / DeepSeek 文本生成 |
| **AI & LLM** | `ai_prompt_enhance` | 设计提示词 AI 增强/改写 |
| **AI & LLM** | `ai_image_gen` | 文生图（Midjourney/SD/Flux） |
| **AI & LLM** | `ai_matting` | AI 发丝级智能抠图 |
| **PSD & 设计** | `psd_parse` | PSD 文件图层智能解析 |
| **PSD & 设计** | `psd_batch_render` | PSD 批量替换文本/图片并渲染导出 |
| **PSD & 设计** | `font_template_render` | 艺术字/特效字模板合成 |
| **素材管理** | `material_search` | 素材库关键字/向量检索 |
| **素材管理** | `file_transcode` | 图片/视频压缩与 CDN 存储 |
| **电商商品** | `product_create` | 商品创建与 SKU 关联 |
| **API 集成** | `http` | 通用 HTTP/Webhook 请求 |
| **逻辑控制** | `condition` | If/Else 条件分支判断 |
| **逻辑控制** | `code` | JS/Python 自定义代码执行 |

### 5.3 后端工作流支持（`design-server`）

- `workflow.entity.ts` — 工作流定义实体（节点图 JSON 持久化）
- `workflow-execution.entity.ts` — 执行历史记录
- `workflow-trigger.entity.ts` — 触发器配置（Cron 表达式）
- `workflow-scheduler.service.ts` — 定时 Cron 调度服务
- `workflow.service.ts` — 工作流 CRUD 业务逻辑

---

## 6. 客户端优先架构思想

### 核心理念

> **"让用户的浏览器成为算力节点"** — 将大量原本需要服务端执行的任务，移交至用户客户端（浏览器/本地运行环境）执行，大幅降低服务器成本，消除网络往返延迟。

### 哪些任务适合在客户端执行

| 任务类型 | 客户端执行技术 | 节省的服务端成本 |
|----------|---------------|-----------------|
| **AI 大模型调用** | 浏览器直连 LLM API（fetch/SSE） | 中转服务器 API 代理开销 |
| **PSD 图层解析** | `ag-psd` 库，在浏览器 WebWorker 解析 | 无需上传 PSD 至服务端 |
| **图片切图与合成** | HTML5 `<canvas>` / `OffscreenCanvas` | 无需云端图片处理 API |
| **视频处理** | `ffmpeg.js` WebAssembly，客户端转码 | 无需视频处理服务器 |
| **自定义代码脚本** | 浏览器 `WebWorker` 安全沙箱 | 无需代码执行服务器 |
| **条件逻辑判断** | 纯客户端 JS 求值 | 无服务端开销 |

### 混合调度策略

```
节点调度决策树

if 节点需要访问私有数据库/内部服务:
    → 服务端执行 (design-server)
else if 节点只需要调用外部 API / 处理本地文件:
    → 客户端浏览器执行（零服务器成本）
```

### 工作流客户端引擎文件

| 文件 | 状态 | 功能 |
|------|------|------|
| `engine/types.ts` | ✅ 已完成 | 执行上下文、日志与结果类型定义 |
| `engine/templateEvaluator.ts` | ✅ 已完成 | `{{ node.var }}` 变量模板求值 |
| `engine/clientRunner.ts` | 🔨 建设中 | 拓扑排序调度引擎（主入口） |
| `engine/executors/llmExecutor.ts` | 📋 计划中 | 浏览器直连 AI 大模型 |
| `engine/executors/codeExecutor.ts` | 📋 计划中 | WebWorker JS 代码执行 |
| `engine/executors/canvasExecutor.ts` | 📋 计划中 | Canvas 图像本地合成 |
| `engine/executors/httpExecutor.ts` | 📋 计划中 | 浏览器直发 HTTP 请求 |

---

## 7. AI 能力集成

### 当前集成的 AI 模型与服务

| 服务 | 用途 | 集成方式 |
|------|------|----------|
| OpenAI GPT-4o | 对话、Prompt 生成、内容创作 | 客户端 SSE 直连 |
| Anthropic Claude | 对话、长文档处理 | 客户端 SSE 直连 |
| DeepSeek | 对话、代码生成 | 客户端 SSE 直连 |
| 文生图（Midjourney/SD/Flux） | AI 图像生成 | 服务端异步调用 |
| AI 抠图模型 | 前景提取、透明背景 | 服务端 Python 模型 |
| TTS（语音合成） | 文本转语音 | 服务端模型 |
| 向量 Embedding | 语义检索 | 服务端模型 |

### AI 助手架构

```
src/ai/
├── simple.ts       # 生产环境: 命令式简单循环 Agent
└── graph.ts        # 实验性: LangGraph 风格 (未接入生产)
    └── nodes/      # LangGraph 各 Agent 节点
```

---

## 8. 数据流与状态管理

### Pinia 状态仓库

| Store | 用途 |
|-------|------|
| `useAppStore` | 全局应用设置（主题/语言/布局/深色模式） |
| `usePermissionStore` | 路由权限与菜单树（动态路由） |
| `useTagsViewStore` | 多标签页（历史 Tab）管理 |
| `useUserStore` | 当前登录用户信息 |

### 主要数据流

```
后端 API (design-server NestJS)
    → Axios HTTP 请求
    → API 层 (src/api/)
    → Pinia Store / 组件本地 ref
    → UI 渲染

AI 流式响应：
后端 or 大模型 API
    → fetchEventSource (SSE)
    → 流式 chunk 追加至 ref
    → 实时 UI 更新
```

---

## 9. 开发规范与命令

### 常用命令

```bash
# 启动开发服务器（本地环境）
npm run dev

# TypeScript 类型检查
npm run typecheck  # 等价 vue-tsc --noEmit

# 生产构建
npm run build:prod

# 代码格式化
npm run lint:format
```

### 代码规范

1. **渐进式重构原则**：每次变更必须是独立可用的，不允许破坏现有流程；
2. **禁止硬编码密钥**：所有 API Key 通过后端接口获取并客户端解密使用；
3. **TypeScript 强类型**：修改代码后需运行 `npm run typecheck` 验证；
4. **组件命名**：`PascalCase.vue`，文件夹 `camelCase`；
5. **API 分层**：所有后端调用通过 `src/api/` 目录集中管理；
6. **样式**：全局变量定义在 `src/styles/var.css`，SCSS 组件内使用 `<style scoped lang="scss">`。

### 主题 Token 体系

所有颜色/尺寸均通过 CSS 变量（`src/styles/var.css`）管理，支持亮/暗双主题：

```css
/* 示例核心变量 */
--top-tool-height: 50px;
--tags-view-height: 38px;
--app-content-padding: 16px;
--el-color-primary: /* 品牌色，Element Plus 主色 */;
```

---

## 10. 后续开发计划 (Roadmap)

### 🔨 近期 (本月内)

| 优先级 | 功能 | 描述 |
|--------|------|------|
| P0 | **工作流客户端执行引擎** | 完成 `clientRunner.ts` 拓扑调度器 + `llmExecutor` + `codeExecutor` |
| P0 | **工作流运行状态可视化** | 节点画布实时高亮运行状态（运行中/成功/失败/耗时） |
| P1 | **节点变量引用 UI 选择器** | 下游节点配置时，可点击选择上游节点的输出变量 (`{{ node_id.var }}`) |
| P1 | **工作流运行日志面板** | 底部抽屉显示逐节点入参/出参/耗时/错误堆栈 |

### 📋 中期 (1-2 个月)

| 优先级 | 功能 | 描述 |
|--------|------|------|
| P1 | **Canvas 图片本地合成执行器** | 客户端 `OffscreenCanvas` 实现 PSD 合成与切图 |
| P1 | **商品批量自动生成工作流** | 触发→AI生图→AI抠图→PSD渲染→商品发布 完整链路 |
| P2 | **工作流模板市场** | 内置行业场景化工作流模板（电商主图/春节海报/详情页） |
| P2 | **工作流批量任务（循环节点）** | 支持对列表数据循环执行工作流（批量处理 100 张图片） |
| P2 | **Webhook 入站触发器** | 外部系统通过 HTTP POST 触发工作流执行 |

### 🔮 远期 (季度+)

| 优先级 | 功能 | 描述 |
|--------|------|------|
| P3 | **LangGraph 多 Agent 工作流** | 接入实验性 `graph.ts` LangGraph 实现，支持多 Agent 协作 |
| P3 | **WebWorker 代码沙箱** | 完整的隔离式 JS/Python 客户端代码执行环境 |
| P3 | **工作流执行统计分析** | 各节点成功率、耗时分布、错误频率可视化 Dashboard |
| P3 | **客户端 PSD 渲染引擎** | 无需服务端，浏览器内 `ag-psd` + `canvas` 完成 PSD 全量渲染 |

---

## 11. 相关联系系统

### 同仓库关联项目

| 项目 | 技术栈 | 说明 |
|------|--------|------|
| **design-server** | NestJS + TypeORM + MySQL | 主后端服务，提供全部 REST API 和 Cron 调度 |
| **yishe-models** | Python + FastAPI | AI 模型微服务（抠图/TTS/向量化/自训练模型） |
| **yishe-client** | Nuxt 3 + Tailwind CSS | 电商用户前台（多独立站子应用架构） |

### 核心后端路径参考

| 路径 | 说明 |
|------|------|
| `design-server/src/workflow/` | 工作流完整后端（CRUD/调度/执行历史） |
| `design-server/src/ai-assistant/` | AI 助手与命令路由 |
| `design-server/src/material/` | 素材管理后端 |
| `design-server/src/cos/` | 腾讯云 COS 文件上传服务 |

---

> 📌 **文档维护说明**：随着功能开发进展，请同步更新本文档。每个功能模块建议在完成后更新「已实现功能模块」章节，并将 Roadmap 中对应条目移至已完成状态。
