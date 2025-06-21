# KeywordsInput 关键词输入组件

一个支持逗号分隔关键词输入的通用组件。

## 功能特性

- 支持逗号分隔的关键词输入
- 自动清理多余空格和逗号
- 支持显示关键词标签
- 支持删除单个关键词
- 支持字数限制和提示
- 完全兼容 v-model

## 使用方法

### 基础用法

```vue
<template>
  <KeywordsInput v-model="keywords" />
</template>

<script setup>
import KeywordsInput from '@/components/KeywordsInput'
import { ref } from 'vue'

const keywords = ref('')
</script>
```

### 在表单中使用

```vue
<template>
  <el-form-item label="关键词标签" prop="keywords">
    <KeywordsInput 
      v-model="formData.keywords" 
      placeholder="请输入关键词，用逗号分隔"
      :show-tags="true"
    />
  </el-form-item>
</template>
```

### 在 CrudSchema 中使用

```typescript
const crudSchemas = reactive<CrudSchema[]>([
  {
    label: '关键词标签',
    field: 'keywords',
    isSearch: true,
    search: {
      componentProps: {
        placeholder: '请输入关键词搜索'
      }
    },
    form: {
      component: 'KeywordsInput',
      componentProps: {
        placeholder: '请输入关键词，用逗号分隔，如：热门,推荐,新品',
        showTags: true
      },
      labelMessage: '多个关键词请用逗号分隔'
    },
    table: {
      width: 200
    }
  }
])
```

## Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| modelValue | 绑定值 | string | - |
| placeholder | 占位符 | string | '请输入关键词，用逗号分隔' |
| maxlength | 最大长度 | number | 200 |
| showWordLimit | 是否显示字数统计 | boolean | true |
| disabled | 是否禁用 | boolean | false |
| showHelper | 是否显示帮助文本 | boolean | true |
| helperText | 帮助文本内容 | string | '多个关键词请用逗号分隔' |
| showTags | 是否显示关键词标签 | boolean | false |
| separator | 分隔符 | string | ',' |

## Events

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| update:modelValue | 值更新时触发 | (value: string) |
| change | 值变化时触发 | (value: string) |

## 示例

### 输入效果
用户输入：`热门, 推荐, 新品`

组件会自动清理为：`热门,推荐,新品`

### 标签显示
当 `showTags` 为 `true` 时，会显示可删除的标签：
- 热门 [×]
- 推荐 [×]  
- 新品 [×]

## 注意事项

1. 组件会自动清理输入中的多余空格
2. 空的关键词会被自动过滤
3. 支持自定义分隔符，默认为逗号
4. 完全兼容 Element Plus 的表单验证 