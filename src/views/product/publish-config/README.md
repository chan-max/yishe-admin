# 发布配置平台扩展指南

## 架构说明

发布配置系统采用**配置化、平铺化**的设计，方便快速添加新平台支持。

### 核心文件

- `platform-config.ts` - 平台配置定义文件（所有平台的字段配置）
- `index.vue` - 主界面（自动根据平台渲染表单）

### 设计原则

1. **平铺结构** - 所有配置字段平铺在 configData 对象中，不嵌套
2. **配置驱动** - UI 完全由配置生成，不需要手写表单代码
3. **类型安全** - TypeScript 类型定义完整
4. **易扩展** - 添加新平台只需在配置文件中新增配置

## 添加新平台步骤

### 1. 在 `platform-config.ts` 中添加平台配置

```typescript
export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  // ... 现有平台配置
  
  // 新平台配置
  your_platform: {
    platform: 'your_platform',
    label: '平台名称',
    description: '平台描述',
    supportVideo: true,  // 是否支持视频
    supportImage: true,  // 是否支持图片
    titleMaxLength: 100, // 标题最大长度
    fields: [
      {
        key: 'fieldName',        // 字段key（平铺在configData中）
        label: '字段标签',        // 显示标签
        type: 'input',           // 字段类型：input/textarea/select/switch/number/radio
        placeholder: '提示文本',  // 占位符
        defaultValue: 'default', // 默认值
        span: 8,                 // 栅格占位（基于24列）
        required: true,          // 是否必填
        tooltip: '提示信息',      // 工具提示
        rows: 3,                 // textarea行数
        options: [               // select选项
          { label: '选项1', value: 'value1' },
          { label: '选项2', value: 'value2' }
        ]
      }
    ]
  }
}
```

### 2. 字段类型说明

#### input - 单行输入框
```typescript
{
  key: 'location',
  label: '地理位置',
  type: 'input',
  placeholder: '例如：北京市朝阳区',
  span: 12
}
```

#### textarea - 多行文本
```typescript
{
  key: 'description',
  label: '详细描述',
  type: 'textarea',
  rows: 5,
  placeholder: '输入详细描述',
  span: 24
}
```

#### number - 数字输入
```typescript
{
  key: 'price',
  label: '价格',
  type: 'number',
  placeholder: '输入价格',
  span: 8,
  required: true
}
```

#### select - 下拉选择
```typescript
{
  key: 'privacy',
  label: '隐私设置',
  type: 'select',
  options: [
    { label: '公开', value: 'public' },
    { label: '私密', value: 'private' }
  ],
  defaultValue: 'public',
  span: 8
}
```

#### switch - 开关
```typescript
{
  key: 'allowComment',
  label: '允许评论',
  type: 'switch',
  defaultValue: true,
  tooltip: '是否允许用户评论',
  span: 8
}
```

### 3. 布局建议

- **单行多列**：使用 `span: 8` 或 `span: 12` 实现多列布局（总和24）
- **全宽字段**：使用 `span: 24`
- **重要字段**：设置 `required: true`
- **复杂字段**：添加 `tooltip` 说明

### 4. 复用通用字段

```typescript
// 视频平台通用字段
const videoCommonFields: FieldConfig[] = [
  {
    key: 'privacy',
    label: '隐私设置',
    type: 'select',
    options: [
      { label: '公开', value: 'public' },
      { label: '私密', value: 'private' }
    ],
    defaultValue: 'public',
    span: 8
  }
]

// 在平台配置中使用
{
  platform: 'new_video_platform',
  fields: [
    ...videoCommonFields,  // 复用通用字段
    // 平台特有字段
    {
      key: 'customField',
      label: '特有字段',
      type: 'input'
    }
  ]
}
```

## 数据结构

### 前端表单数据

```typescript
// 基础信息
form = {
  name: '配置名称',
  platform: 'douyin',
  description: '配置描述',
  isActive: true,
  titleTemplate: 'AI标题模板',
  titleConfig: '{}'
}

// 平台配置数据（平铺结构）
platformConfigData = {
  privacy: 'public',
  allowComment: true,
  allowShare: true,
  coverType: 'auto'
  // ... 更多平台字段
}
```

### 保存到后端

```typescript
{
  name: '配置名称',
  platform: 'douyin',
  description: '配置描述',
  isActive: true,
  titleTemplate: 'AI标题模板',
  titleConfig: {},
  configData: {
    // 平台配置数据平铺保存
    privacy: 'public',
    allowComment: true,
    allowShare: true,
    coverType: 'auto'
  }
}
```

## 示例：添加 Bilibili 平台

```typescript
// 在 platform-config.ts 中添加
bilibili: {
  platform: 'bilibili',
  label: 'B站',
  description: 'Bilibili视频平台配置',
  supportVideo: true,
  supportImage: true,
  titleMaxLength: 80,
  fields: [
    {
      key: 'category',
      label: '投稿分区',
      type: 'select',
      options: [
        { label: '动画', value: '1' },
        { label: '游戏', value: '4' },
        { label: '知识', value: '36' },
        { label: '生活', value: '160' }
      ],
      defaultValue: '160',
      span: 8,
      required: true
    },
    {
      key: 'tag',
      label: '标签',
      type: 'input',
      placeholder: '多个标签用逗号分隔，最多10个',
      span: 16
    },
    {
      key: 'copyright',
      label: '版权',
      type: 'select',
      options: [
        { label: '自制', value: '1' },
        { label: '转载', value: '2' }
      ],
      defaultValue: '1',
      span: 8
    },
    {
      key: 'allowReprint',
      label: '允许转载',
      type: 'switch',
      defaultValue: true,
      span: 8
    }
  ]
}
```

## 后端集成

### 在 publish-config.service.ts 中添加平台处理器

```typescript
private buildBilibiliPayload(input: { 
  title: string; 
  description: string; 
  content: string; 
  tags: string[]; 
  images: string[]; 
  videos: string[]; 
  publishOptions: Record<string, any> 
}) {
  // 从 publishOptions.platformSettings 中获取配置
  const settings = input.publishOptions
  
  return {
    platform: 'bilibili',
    title: input.title,
    description: input.description,
    tags: input.tags,
    publishOptions: input.publishOptions,
    filePathSource: input.videos[0] || null,
    isVideo: true,
    videoUrl: input.videos[0] || null,
    // 平台特有字段
    category: settings?.category,
    copyright: settings?.copyright,
    allowReprint: settings?.allowReprint
  }
}

// 在 buildPlatformPayload 中添加路由
private buildPlatformPayload(platform: string, input: ...) {
  switch (platform) {
    // ... 现有平台
    case 'bilibili':
      return this.buildBilibiliPayload(input);
    default:
      return this.buildDefaultPayload(platform, input);
  }
}
```

## 优势

1. **零代码 UI** - 添加平台无需写 Vue 模板代码
2. **类型安全** - TypeScript 完整类型提示
3. **易维护** - 配置集中管理
4. **易扩展** - 新平台只需添加配置
5. **平铺结构** - 数据扁平化，易于处理

## 注意事项

1. 字段 key 必须唯一且语义化
2. 必填字段设置 `required: true`
3. 为复杂字段添加 `tooltip` 说明
4. 合理使用 `span` 控制布局
5. 设置合理的 `defaultValue`
6. 保持 configData 结构平铺，避免嵌套
