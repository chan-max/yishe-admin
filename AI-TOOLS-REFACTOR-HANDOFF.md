# AI 工具系统优化 - 交接文档

日期：2026-05-20

---

## 一、已完成工作

### 1. 前端交互组件重构（yishe-admin）

**目标**：将 `AiAssistant/index.vue`（1800行）中的交互逻辑拆分为独立组件，支持 LangGraph interrupt 驱动的新交互模式。

**新建文件**：

| 文件 | 说明 |
|------|------|
| `src/components/AiAssistant/interactions/types.ts` | 统一类型定义（InteractionType、InteractionPayload 等） |
| `src/components/AiAssistant/interactions/InteractionRenderer.vue` | 动态路由组件，根据 payload.type 渲染对应交互组件 |
| `src/components/AiAssistant/interactions/ConfirmInteraction.vue` | 带预览的确认（支持 impact_preview） |
| `src/components/AiAssistant/interactions/PlanEditInteraction.vue` | 可编辑执行计划（拖拽排序、跳过步骤） |
| `src/components/AiAssistant/interactions/CompareInteraction.vue` | 方案对比选择（卡片式、支持多选） |
| `src/components/AiAssistant/interactions/StepFormInteraction.vue` | 渐进式表单（多步骤、带进度指示器） |
| `src/components/AiAssistant/interactions/LegacyInteraction.vue` | 兼容旧类型（choice/form/feedback/input/clarify/confirm） |

**修改文件**：

| 文件 | 变更 |
|------|------|
| `src/components/AiAssistant/index.vue` | 删除内联交互模板（~300行），改用 `<InteractionRenderer>`；删除旧的辅助函数（normalizeOptions、normalizeField、buildResumeInput 等）；新增 `handleInteractionSubmit`、`handleInteractionReject` |

**新增交互类型（LangGraph interrupt type）**：

| type | 用途 | 触发方式 |
|------|------|----------|
| `impact_preview` | 带预览的确认，显示操作影响 | interrupt payload 含 `preview` 字段 |
| `plan_edit` | 可编辑执行计划 | interrupt payload 含 `plan` 字段 |
| `compare` | 方案对比选择 | interrupt payload 含 `compare` 字段 |
| `step_form` | 渐进式多步表单 | interrupt payload 含 `steps` 字段 |

**自动识别逻辑**（InteractionRenderer.vue）：
- `type: "confirm"` + `preview` 字段 → 自动升级为 `impact_preview`
- `type: "confirm"` + `plan` 字段 → 自动升级为 `plan_edit`
- `type: "choice"` + `compare` 字段 → 自动升级为 `compare`
- `type: "form"` + `steps` 字段 → 自动升级为 `step_form`

---

### 2. 后端工具定义重构（design-server）

**目标**：将 4500 行单文件拆分为模块化定义，将巨型搜索工具按意图拆分为小工具。

**新建文件**：

| 文件 | 说明 |
|------|------|
| `src/ai-assistant/tools/definitions/shared-schemas.ts` | 共享参数模板（分页、关键词搜索、时间范围、文件夹定位、素材筛选） |
| `src/ai-assistant/tools/definitions/material.tools.ts` | material 类别工具定义（16个工具） |

**修改文件**：

| 文件 | 变更 |
|------|------|
| `src/ai-assistant/ai-assistant-tool-registry.service.ts` | 4500 → 2200 行；material 区块替换为 `...materialToolDefinitions` import |

**核心拆分**：

原 `material.sticker.search`（25+ 参数）拆为：

| 新工具 | 参数数 | 场景 |
|--------|--------|------|
| `material.sticker.search` | 3 | 关键词搜索（最常用） |
| `material.sticker.filter` | 13 | 高级筛选（后缀、抠图、时间、文件夹等） |
| `material.sticker.browse_folder` | 4 | 按文件夹浏览 |

**删除的冗余工具**：
- `material.sticker.query_stats` — search 结果已含 total，参数完全重复

**共享参数模板**：
```typescript
// shared-schemas.ts 导出
paginationProps      // currentPage, pageSize
keywordSearchProps   // query
dateRangeProps       // startTime, endTime
folderLocatorProps   // folderId, folderName
stickerFilterProps   // suffix, isCustom, isCutout, sizeShape
mergeProps(...schemas)  // 合并多个 schema
```

---

## 二、待优化清单

### P0 — 继续拆分其他类别

当前 registry 仍有 ~70 个内联工具定义，按相同模式拆分：

| 类别 | 工具数 | 当前状态 | 优先级 |
|------|--------|----------|--------|
| `material.psd_template` | 4 | 内联，search 有 15+ 参数 | P0 |
| `material.file_resource` | 4 | 内联，search 有 20+ 参数 | P0 |
| `material.font_template` | 4 | 内联，search 有 10+ 参数 | P0 |
| `material.crawler_material` | 4 | 内联 | P0 |
| `material.sentence` | 5 | 内联 | P1 |
| `product.*` | 7 | 内联 | P1 |
| `publish.*` | 4 | 内联 | P1 |
| `system.*` | 15 | 内联，ps_automation 有 9 个工具 | P1 |
| `temu.*` | 5 | 内联 | P2 |
| `shop.*` | 2 | 内联 | P2 |

**操作步骤**（每个类别）：
1. 在 `tools/definitions/` 下创建 `{category}.tools.ts`
2. 从 registry 中剪切该类别的工具定义
3. 用 `shared-schemas.ts` 的模板替换重复参数
4. 如果 search 工具参数 >10 个，按意图拆分
5. 删除冗余的 `query_stats` 工具
6. 在 registry 中添加 `import` 和 `...spread`
7. 运行 `npx tsc --noEmit --skipLibCheck` 验证

### P1 — 后端 executor 适配

拆分 search 工具后，后端 `resolveTool()` 的 switch 需要新增 case：

```typescript
// ai-assistant-tool-registry.service.ts → resolveTool()
case "material.sticker.filter":
  return this.stickerSearchTool;  // 复用同一个 executor
case "material.sticker.browse_folder":
  return this.stickerSearchTool;  // 复用同一个 executor
```

executor 的 `run()` 方法需要根据传入参数自动判断走哪条查询路径（当前已支持，因为参数都是透传到 service 层）。

### P1 — 前端工具展示优化

当前 `AiAssistantApi.getCapabilityCatalog()` 返回的工具列表可以按新分类展示。前端可优化：
- 工具搜索/过滤
- 按类别折叠展示
- 工具详情弹窗（显示 inputSchema、examples）

### P2 — LangGraph Agent 工具选择优化

工具定义中的 `description` 和 `examples` 是 LLM 选择工具的关键依据。优化建议：
- description 控制在 50 字以内
- examples 用口语化表达（模拟用户真实提问）
- 每个工具的 examples 不超过 3 个
- 对比工具间的 description，确保不重叠

### P2 — Skills / Planning Policy 扩展

当前只有 `sticker-psd-set.skill.ts` 一个 skill 文件。建议为高频工具添加 planning policy：
- `material.sticker.filter` — 需要用户确认筛选条件
- `material.sticker_psd_set.create` — 需要确认模板和素材选择
- `publish.task.create` — 需要确认发布配置

---

## 三、架构说明

### 工具定义流程

```
tools/definitions/shared-schemas.ts     ← 共享参数模板
tools/definitions/material.tools.ts     ← 类别工具定义（用模板组装）
tools/definitions/product.tools.ts      ← （待创建）
...
        ↓ import
ai-assistant-tool-registry.service.ts   ← 注册中心，合并所有定义
        ↓ getToolDefinitions()
        ↓ normalizeToolDefinition()     ← 自动补全默认值
        ↓
GET /ai-assistant/tools                 ← API 返回给前端
        ↓
agent/tools.ts → adaptTools()           ← 转为 LangChain StructuredTool
        ↓
LangGraph Agent                         ← LLM 选择并调用
```

### interrupt 交互流程

```
LangGraph Agent 执行中
  → 需要用户输入 → interrupt(payload)
  → SSE 事件推送到前端
  → applyInterrupt() → pendingInteraction 赋值
  → <InteractionRenderer :payload="pendingInteraction" />
      → 根据 payload.type 选择组件
      → 用户操作 → emit('submit') / emit('reject')
  → handleInteractionSubmit()
  → resumeRunStream(runId, { confirmed, input, reason })
  → Agent 继续执行
```

### interrupt payload 结构

```typescript
// 基础字段（所有类型通用）
{
  type: "confirm" | "choice" | "form" | "feedback" | "input" | "clarify"
    | "impact_preview" | "plan_edit" | "compare" | "step_form",
  runId: string,
  question: string,
  tool?: string,
  label?: string,
  input?: Record<string, any>,

  // impact_preview 专用
  preview?: {
    summary?: string,
    rows?: Array<{ label: string, value: string, tone?: "positive" | "negative" | "neutral" }>,
    riskLevel?: "low" | "medium" | "high"
  },

  // plan_edit 专用
  plan?: {
    steps: Array<{ id: string, label: string, description?: string, status?: string, editable?: boolean }>,
    editable?: boolean
  },

  // compare 专用
  compare?: {
    options: Array<{ id: string, title: string, description?: string, preview?: string, tags?: string[] }>,
    multiSelect?: boolean
  },

  // step_form 专用
  steps?: Array<{ title: string, description?: string, fields: Field[] }>
}
```

---

## 四、验证方式

### 前端
```bash
cd /Users/jackie/workspace/yishe-admin
npx vue-tsc --noEmit --skipLibCheck
```

### 后端
```bash
cd /Users/jackie/workspace/design-server
npx tsc --noEmit --skipLibCheck
```

### 手动测试
1. 启动后端：`cd design-server && npm run start:dev`
2. 启动前端：`cd yishe-admin && npm run dev`
3. 打开智能助手，发送消息触发工具调用
4. 验证新交互类型：在后端 interrupt 时传入 `preview`/`plan`/`compare`/`steps` 字段
