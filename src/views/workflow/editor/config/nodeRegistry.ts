export interface NodeInputField {
  field: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'code' | 'json' | 'textarea'
  required?: boolean
  placeholder?: string
  defaultValue?: any
  options?: Array<{ label: string; value: any }>
  description?: string
}

export interface NodeOutputField {
  field: string
  label: string
  type: string
  description?: string
}

export interface SystemNodeCapability {
  type: string
  name: string
  category: 'ai' | 'design' | 'material' | 'product' | 'integration' | 'logic' | 'base' | 'notify'
  icon: string
  color: string
  badge?: string
  description: string
  defaultData: Record<string, any>
  inputSchema?: NodeInputField[]
  outputSchema?: NodeOutputField[]
}

export const NODE_CATEGORIES = [
  { key: 'all', label: '全部能力', icon: 'ep:grid' },
  { key: 'base', label: '基础流程', icon: 'ep:location' },
  { key: 'ai', label: 'AI & LLM 智能', icon: 'ep:magic-stick' },
  { key: 'design', label: 'PSD & 设计渲染', icon: 'ep:picture-filled' },
  { key: 'material', label: '素材与文件管理', icon: 'ep:folder-opened' },
  { key: 'product', label: '商品与电商处理', icon: 'ep:goods' },
  { key: 'integration', label: '网络与 API 集成', icon: 'ep:connection' },
  { key: 'notify', label: '消息通知推送', icon: 'ep:bell' },
  { key: 'logic', label: '逻辑与控制流', icon: 'ep:cpu' },
] as const

export const SYSTEM_NODE_REGISTRY: SystemNodeCapability[] = [
  // ─── 1. 基础流程节点 ──────────────────────────────────────────
  {
    type: 'start',
    name: '开始节点',
    category: 'base',
    icon: 'ep:video-play',
    color: '#22c55e',
    badge: '触发',
    description: '工作流启动入口，可配置手动触发或定时 Cron 触发规则。',
    defaultData: {
      name: '开始节点',
      triggerType: 'manual',
      cronExpression: '0 8 * * *',
    },
    inputSchema: [
      {
        field: 'triggerType',
        label: '触发模式',
        type: 'select',
        defaultValue: 'manual',
        options: [
          { label: '手动触发 / API 触发', value: 'manual' },
          { label: '定时 Cron 触发', value: 'cron' },
        ],
      },
      {
        field: 'cronExpression',
        label: 'Cron 表达式',
        type: 'string',
        defaultValue: '0 8 * * *',
        placeholder: '0 8 * * *',
      },
    ],
    outputSchema: [
      { field: 'triggerTime', label: '触发时间', type: 'string' },
      { field: 'triggerType', label: '触发方式', type: 'string' },
      { field: 'params', label: '外部输入参数', type: 'object' },
    ],
  },
  {
    type: 'end',
    name: '结束出口',
    category: 'base',
    icon: 'ep:circle-check',
    color: '#ef4444',
    badge: '出口',
    description: '工作流最终输出出口，汇总各分支执行结果。',
    defaultData: {
      name: '结束出口',
      outputMode: 'all',
    },
    inputSchema: [
      {
        field: 'outputMode',
        label: '输出拼接模式',
        type: 'select',
        defaultValue: 'all',
        options: [
          { label: '汇总所有上游节点输出', value: 'all' },
          { label: '仅输出指定变量', value: 'custom' },
        ],
      },
    ],
  },

  // ─── 2. AI & LLM 智能能力 ──────────────────────────────────────
  {
    type: 'llm',
    name: 'AI 大语言模型',
    category: 'ai',
    icon: 'ep:chat-dot-round',
    color: '#8b5cf6',
    badge: 'LLM',
    description: '调用 OpenAI / Claude / DeepSeek 等大模型生成文本或进行多轮对话。',
    defaultData: {
      name: 'AI 大语言模型',
      model: 'gpt-4o',
      prompt: '请处理以下输入内容：{{ input.text }}',
      temperature: 0.7,
    },
    inputSchema: [
      {
        field: 'model',
        label: '模型选择',
        type: 'select',
        defaultValue: 'gpt-4o',
        options: [
          { label: 'GPT-4o (推荐)', value: 'gpt-4o' },
          { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
          { label: 'DeepSeek R1 / V3', value: 'deepseek-chat' },
        ],
      },
      {
        field: 'prompt',
        label: 'Prompt 提示词模板',
        type: 'textarea',
        placeholder: '输入提示词，支持 {{ node_id.variable }} 引用',
        defaultValue: '请处理以下输入内容：{{ input.text }}',
      },
    ],
    outputSchema: [
      { field: 'text', label: '回答文本', type: 'string' },
      { field: 'tokens', label: 'Token 消耗', type: 'number' },
    ],
  },
  {
    type: 'ai_prompt_enhance',
    name: 'AI 提示词增强',
    category: 'ai',
    icon: 'ep:magic-stick',
    color: '#a855f7',
    badge: 'AI',
    description: '智能扩写、润色与结构化优化设计提示词 (Design Prompt)。',
    defaultData: {
      name: 'AI 提示词增强',
      style: 'luxury',
      rawPrompt: '{{ input.keyword }}',
    },
    inputSchema: [
      {
        field: 'style',
        label: '风格偏好',
        type: 'select',
        defaultValue: 'luxury',
        options: [
          { label: '高端奢华 (Luxury)', value: 'luxury' },
          { label: '极简现代 (Minimalist)', value: 'minimalist' },
          { label: '国潮风尚 (Guochao)', value: 'guochao' },
          { label: '二次元动漫 (Anime)', value: 'anime' },
        ],
      },
      {
        field: 'rawPrompt',
        label: '原始关键字/句子',
        type: 'string',
        placeholder: '输入原始提示词',
      },
    ],
    outputSchema: [
      { field: 'enhancedPrompt', label: '增强后的提示词', type: 'string' },
      { field: 'tags', label: '提取关键词', type: 'array' },
    ],
  },
  {
    type: 'ai_image_gen',
    name: 'AI 图像生成',
    category: 'ai',
    icon: 'ep:picture-filled',
    color: '#ec4899',
    badge: 'AI',
    description: '基于文生图/图生图模型 (Midjourney / SD / Flux) 自动渲染高精图像。',
    defaultData: {
      name: 'AI 图像生成',
      aspectRatio: '1:1',
      prompt: '{{ ai_prompt_enhance_1.enhancedPrompt }}',
    },
    inputSchema: [
      {
        field: 'aspectRatio',
        label: '图像画幅比例',
        type: 'select',
        defaultValue: '1:1',
        options: [
          { label: '1:1 正方形', value: '1:1' },
          { label: '3:4 纵向商品图', value: '3:4' },
          { label: '16:9 横屏展板', value: '16:9' },
        ],
      },
      {
        field: 'prompt',
        label: '生成提示词',
        type: 'textarea',
        placeholder: '正向提示词 Prompt',
      },
    ],
    outputSchema: [
      { field: 'imageUrl', label: '生成图片 URL', type: 'string' },
      { field: 'width', label: '图片宽度', type: 'number' },
      { field: 'height', label: '图片高度', type: 'number' },
    ],
  },
  {
    type: 'ai_matting',
    name: 'AI 智能抠图',
    category: 'ai',
    icon: 'ep:scissors',
    color: '#d946ef',
    badge: 'AI',
    description: '发丝级 AI 自动发扣图、前景提取与透明 PNG 输出。',
    defaultData: {
      name: 'AI 智能抠图',
      imageUrl: '{{ ai_image_gen_1.imageUrl }}',
    },
    inputSchema: [
      {
        field: 'imageUrl',
        label: '待抠图图片地址',
        type: 'string',
        placeholder: '输入图片 URL 或变量引用',
      },
    ],
    outputSchema: [
      { field: 'pngUrl', label: '透明背景 PNG URL', type: 'string' },
      { field: 'maskUrl', label: 'Mask 遮罩图 URL', type: 'string' },
    ],
  },

  // ─── 3. PSD & 设计渲染能力 ──────────────────────────────────────
  {
    type: 'psd_parse',
    name: 'PSD 智能解析',
    category: 'design',
    icon: 'ep:document',
    color: '#3b82f6',
    badge: 'PSD',
    description: '自动解析 PSD 模板图层树结构，智能识别可替换文本与 SmartObject。',
    defaultData: {
      name: 'PSD 智能解析',
      psdId: '',
    },
    inputSchema: [
      {
        field: 'psdId',
        label: 'PSD 模板 ID',
        type: 'string',
        placeholder: '输入 PSD 素材模板 ID',
      },
    ],
    outputSchema: [
      { field: 'layers', label: '图层树 JSON', type: 'array' },
      { field: 'textNodes', label: '可替换文本列表', type: 'array' },
    ],
  },
  {
    type: 'psd_batch_render',
    name: 'PSD 批量渲染导出',
    category: 'design',
    icon: 'ep:film',
    color: '#2563eb',
    badge: 'PSD',
    description: '根据传入数据批量替换 PSD 文本与图片并导出合成结果图。',
    defaultData: {
      name: 'PSD 批量渲染',
      psdId: '',
      replaceData: '{}',
    },
    inputSchema: [
      {
        field: 'psdId',
        label: 'PSD 模板 ID',
        type: 'string',
      },
      {
        field: 'replaceData',
        label: '替换节点映射 (JSON)',
        type: 'json',
        placeholder: '{"Title": "{{ llm_1.text }}", "Logo": "{{ ai_matting_1.pngUrl }}"}',
      },
    ],
    outputSchema: [
      { field: 'resultImageUrl', label: '合成结果图地址', type: 'string' },
      { field: 'renderTimeMs', label: '渲染耗时(ms)', type: 'number' },
    ],
  },
  {
    type: 'font_template_render',
    name: '字体模板合成',
    category: 'design',
    icon: 'ep:edit',
    color: '#1d4ed8',
    badge: '渲染',
    description: '将文本映射至艺术字体/3D特效字体模板，生成高精透明烫金/浮雕字。',
    defaultData: {
      name: '字体模板合成',
      fontTemplateId: '',
      text: '新品上市',
    },
    inputSchema: [
      {
        field: 'fontTemplateId',
        label: '字体模板 ID',
        type: 'string',
      },
      {
        field: 'text',
        label: '渲染文本',
        type: 'string',
        defaultValue: '新品上市',
      },
    ],
    outputSchema: [
      { field: 'renderedFontUrl', label: '特效字 PNG 地址', type: 'string' },
    ],
  },

  // ─── 4. 素材与文件管理能力 ─────────────────────────────────────
  {
    type: 'material_search',
    name: '素材批量检索',
    category: 'material',
    icon: 'ep:folder-opened',
    color: '#10b981',
    badge: '素材',
    description: '按文件夹、标签、向量相似度在素材库中快速搜索匹配素材。',
    defaultData: {
      name: '素材批量检索',
      folderId: '',
      keyword: '',
      limit: 10,
    },
    inputSchema: [
      {
        field: 'keyword',
        label: '检索关键字',
        type: 'string',
        placeholder: '例如: 春季/金色/抽象画',
      },
      {
        field: 'limit',
        label: '返回最大数量',
        type: 'number',
        defaultValue: 10,
      },
    ],
    outputSchema: [
      { field: 'materials', label: '素材对象数组', type: 'array' },
      { field: 'total', label: '匹配总数', type: 'number' },
    ],
  },
  {
    type: 'file_transcode',
    name: '文件资源转码',
    category: 'material',
    icon: 'ep:upload-filled',
    color: '#059669',
    badge: '文件',
    description: '自动对图片、音视频文件进行压缩、WebP/MP4 转换与云端 CDN 存储。',
    defaultData: {
      name: '文件资源转码',
      fileUrl: '',
      targetFormat: 'webp',
    },
    inputSchema: [
      {
        field: 'fileUrl',
        label: '源文件 URL',
        type: 'string',
      },
      {
        field: 'targetFormat',
        label: '目标格式',
        type: 'select',
        defaultValue: 'webp',
        options: [
          { label: 'WebP 压缩图', value: 'webp' },
          { label: 'PNG 高清图', value: 'png' },
          { label: 'MP4 视频', value: 'mp4' },
        ],
      },
    ],
    outputSchema: [
      { field: 'cdnUrl', label: '转码后 CDN 地址', type: 'string' },
      { field: 'sizeBytes', label: '文件大小 (Bytes)', type: 'number' },
    ],
  },

  // ─── 5. 商品与电商处理能力 ─────────────────────────────────────
  {
    type: 'product_create',
    name: '商品创建与 SKU 关联',
    category: 'product',
    icon: 'ep:goods',
    color: '#f59e0b',
    badge: '电商',
    description: '根据自动渲染的设计成果创建新商品并生成多规格 SKU 属性。',
    defaultData: {
      name: '商品创建',
      title: '自动生成设计商品',
      categoryId: '',
    },
    inputSchema: [
      {
        field: 'title',
        label: '商品名称',
        type: 'string',
      },
      {
        field: 'categoryId',
        label: '绑定商品分类 ID',
        type: 'string',
      },
    ],
    outputSchema: [
      { field: 'productId', label: '新生成商品 ID', type: 'string' },
      { field: 'skuList', label: 'SKU 列表', type: 'array' },
    ],
  },

  // ─── 6. 网络与 API 集成 ─────────────────────────────────────────
  {
    type: 'http',
    name: 'HTTP / Webhook 请求',
    category: 'integration',
    icon: 'ep:connection',
    color: '#06b6d4',
    badge: 'HTTP',
    description: '自由发起 GET / POST 请求调用外部系统 API 或触发第三方 Webhook。',
    defaultData: {
      name: 'HTTP 请求',
      method: 'POST',
      url: 'https://api.example.com/webhook',
      headers: '{"Content-Type": "application/json"}',
      body: '{"event": "workflow_finished"}',
    },
    inputSchema: [
      {
        field: 'method',
        label: 'HTTP 请求方法',
        type: 'select',
        defaultValue: 'POST',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
        ],
      },
      {
        field: 'url',
        label: '目标 URL 地址',
        type: 'string',
        placeholder: 'https://...',
      },
      {
        field: 'body',
        label: 'Request Body (JSON/Text)',
        type: 'textarea',
      },
    ],
    outputSchema: [
      { field: 'status', label: 'HTTP 状态码', type: 'number' },
      { field: 'data', label: '响应数据 (JSON)', type: 'object' },
    ],
  },

  // ─── 7. 逻辑与控制流节点 ────────────────────────────────────────
  {
    type: 'condition',
    name: '条件分支判断',
    category: 'logic',
    icon: 'ep:share',
    color: '#eab308',
    badge: '条件',
    description: '根据表达式（如 {{ node_1.status }} === 200）分流走到不同分支。',
    defaultData: {
      name: '条件分支',
      operator: '==',
      targetValue: 'true',
    },
    inputSchema: [
      {
        field: 'leftValue',
        label: '左侧变量/表达式',
        type: 'string',
        placeholder: '{{ http_1.status }}',
      },
      {
        field: 'operator',
        label: '比较操作符',
        type: 'select',
        defaultValue: '==',
        options: [
          { label: '等于 (==)', value: '==' },
          { label: '不等于 (!=)', value: '!=' },
          { label: '大于 (>)', value: '>' },
          { label: '包含 (contains)', value: 'contains' },
        ],
      },
      {
        field: 'rightValue',
        label: '右侧比较值',
        type: 'string',
      },
    ],
    outputSchema: [
      { field: 'matchedBranch', label: '匹配的分支', type: 'string' },
    ],
  },
  {
    type: 'code',
    name: 'Custom Code 代码',
    category: 'logic',
    icon: 'ep:cpu',
    color: '#f97316',
    badge: '代码',
    description: '编写 JavaScript / Python 自定义代码，灵活清洗数据或处理复杂逻辑。',
    defaultData: {
      name: 'Custom Code',
      language: 'javascript',
      code: 'return { result: inputs.text.toUpperCase() };',
    },
    inputSchema: [
      {
        field: 'language',
        label: '代码语言',
        type: 'select',
        defaultValue: 'javascript',
        options: [
          { label: 'JavaScript (Node.js)', value: 'javascript' },
          { label: 'Python 3', value: 'python' },
        ],
      },
      {
        field: 'code',
        label: '代码内容',
        type: 'code',
        defaultValue: 'return { result: inputs.text.toUpperCase() };',
      },
    ],
    outputSchema: [
      { field: 'result', label: '脚本返回值', type: 'any' },
    ],
  },

  // ─── 8. 消息通知推送 ─────────────────────────────────────────
  {
    type: 'message_push',
    name: '消息推送通知',
    category: 'notify',
    icon: 'ep:bell',
    color: '#0ea5e9',
    badge: '通知',
    description: '通过已配置的推送渠道（飞书/企业微信）发送工作流执行结果或自定义消息通知。',
    defaultData: {
      name: '消息推送通知',
      channelId: null,
      title: '工作流执行完成',
      content: '工作流已完成执行。\n结果：{{ end_1.summary }}',
    },
    inputSchema: [
      {
        field: 'channelId',
        label: '推送渠道',
        type: 'select',
        required: true,
        placeholder: '选择已配置的推送渠道',
        description: '在「消息推送」模块中配置的飞书/企业微信渠道',
        options: [], // 运行时动态从 API 加载
      },
      {
        field: 'title',
        label: '消息标题',
        type: 'string',
        defaultValue: '工作流执行通知',
        placeholder: '例如：商品渲染任务完成',
        description: '支持 {{ node_id.variable }} 变量引用',
      },
      {
        field: 'content',
        label: '消息正文',
        type: 'textarea',
        defaultValue: '工作流已完成执行。\n结果：{{ end_1.summary }}',
        placeholder: '支持 {{ node_id.variable }} 变量引用',
        description: '飞书/企微 Markdown 格式均可使用',
      },
      {
        field: 'sendOnError',
        label: '仅在失败时发送',
        type: 'boolean',
        defaultValue: false,
        description: '勾选后，只有工作流中出现错误节点时才触发此推送',
      },
    ],
    outputSchema: [
      { field: 'sent', label: '是否发送成功', type: 'boolean' },
      { field: 'channelName', label: '推送渠道名称', type: 'string' },
      { field: 'sentAt', label: '发送时间', type: 'string' },
    ],
  },
  {
    type: 'message_push_error_alert',
    name: '错误告警推送',
    category: 'notify',
    icon: 'ep:warning',
    color: '#ef4444',
    badge: '告警',
    description: '工作流节点运行失败时，立即推送错误详情与堆栈到指定渠道，用于故障告警监控。',
    defaultData: {
      name: '错误告警推送',
      channelId: null,
      alertTitle: '⚠️ 工作流执行异常',
      includeStackTrace: true,
    },
    inputSchema: [
      {
        field: 'channelId',
        label: '告警推送渠道',
        type: 'select',
        required: true,
        placeholder: '选择告警接收渠道',
        options: [], // 运行时动态从 API 加载
      },
      {
        field: 'alertTitle',
        label: '告警消息标题',
        type: 'string',
        defaultValue: '⚠️ 工作流执行异常',
      },
      {
        field: 'includeStackTrace',
        label: '包含错误详情',
        type: 'boolean',
        defaultValue: true,
        description: '是否在推送中附上失败节点名称与错误信息',
      },
    ],
    outputSchema: [
      { field: 'sent', label: '是否告警推送成功', type: 'boolean' },
    ],
  },
]
