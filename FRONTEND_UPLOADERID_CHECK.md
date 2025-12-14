# 前端上传 uploaderId 检查报告

## 检查结果总览

**发现：部分前端代码已经传递了 uploaderId，但仍有部分未传递。**

虽然后端已经在 Controller 层自动从 JWT token 中提取用户ID并设置 uploaderId，但为了确保数据的完整性和可追溯性，建议前端也显式传递 uploaderId。

## 详细检查结果

### ✅ 1. ClipMaterial (剪辑素材)

**文件**: `src/views/material/clip-material/clip-material-upload.vue`
**状态**: ✅ **已传递 uploaderId**
**代码**:
```typescript
const materialData = {
  // ... 其他字段
  uploaderId: userStore.userInfo?.id  // ✅ 已传递
}
await createClipMaterial(materialData)
```

### ❌ 2. Sticker (贴纸)

**文件**: `src/views/material/index/index.vue` (line 3048)
**状态**: ❌ **未传递 uploaderId**
**当前代码**:
```typescript
await uploadMaterialFile({
  url,
  name: urlUploadForm.name,
  // ... 其他字段，但缺少 uploaderId
})
```
**需要修改**: 添加 `uploaderId: userStore.user.id`

### ❓ 3. Draft (草稿)

**需要检查**: 找到 createDraft 或 uploadDraft 的调用位置

### ❌ 4. PsdTemplate (PSD模板)

**文件**: `src/views/material/psdTemplate/index.vue` (line 578)
**状态**: ❌ **未传递 uploaderId**
**当前代码**:
```typescript
await psdTemplateApi.createPsdTemplate({
  name: form.value.name,
  description: form.value.description || "",
  // ... 其他字段，但缺少 uploaderId
})
```
**需要修改**: 添加 `uploaderId: userStore.user.id`

### ❌ 5. FontTemplate (字体模板)

**文件**: `src/views/material/fontTemplate/index.vue` (line 1139)
**状态**: ❌ **未传递 uploaderId**
**当前代码**:
```typescript
await fontTemplateApi.createFontTemplate({
  name: form.value.name,
  description: form.value.description,
  // ... 其他字段，但缺少 uploaderId
})
```
**需要修改**: 添加 `uploaderId: userStore.user.id`

### ❓ 6. CustomModel (自定义模型)

**需要检查**: 找到 createCustomModel 的调用位置

### ✅ 7. CrawlerMaterial (爬虫素材)

**文件**: `src/views/material/index/crawler-material.vue`
**状态**: ✅ **已传递 uploaderId**
**代码**:
```typescript
uploaderId: String(userStore.user.id)  // ✅ 已传递
```

## 需要修改的文件清单

### 优先级：高（必须修改）

1. **Sticker** - `src/views/material/index/index.vue` (line ~3048)
2. **PsdTemplate** - `src/views/material/psdTemplate/index.vue` (line ~578)
3. **FontTemplate** - `src/views/material/fontTemplate/index.vue` (line ~1139)

### 优先级：中（需要确认）

4. **Draft** - 需要找到调用位置
5. **CustomModel** - 需要找到调用位置

## 修改方案

### 获取用户ID的方式

```typescript
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const userId = userStore.user.id  // 或 userStore.userInfo?.id（根据实际情况）
```

### 修改示例

**修改前**:
```typescript
await uploadMaterialFile({
  url,
  name: urlUploadForm.name,
  // ... 其他字段
})
```

**修改后**:
```typescript
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

await uploadMaterialFile({
  url,
  name: urlUploadForm.name,
  // ... 其他字段
  uploaderId: userStore.user.id  // ✅ 添加这一行
})
```

## 注意事项

1. **用户ID字段名**: 
   - 大部分使用 `uploaderId`
   - 确保与后端 DTO 字段名一致

2. **用户ID类型**: 
   - 后端实体中大部分是 `any` 类型
   - 前端传递时可以是 `string` 或 `number`，取决于后端实际使用

3. **可空性**: 
   - 虽然字段是可选的（后端会自动设置），但前端显式传递更保险

4. **双重保险**: 
   - 即使后端已经自动设置，前端也传递 uploaderId 可以：
     - 防止后端代码被误改
     - 在日志中更容易追踪
     - 数据更明确

## 总结

| 数据类型 | 前端传递 | 后端自动设置 | 状态 | 需要修改 |
|---------|---------|------------|------|---------|
| ClipMaterial | ✅ | ✅ | ✅ 完成 | 否 |
| Sticker | ❌ | ✅ | ⚠️ 需要修改 | ✅ 是 |
| Draft | ❓ | ✅ | ❓ 待检查 | ❓ |
| PsdTemplate | ❌ | ✅ | ⚠️ 需要修改 | ✅ 是 |
| FontTemplate | ❌ | ✅ | ⚠️ 需要修改 | ✅ 是 |
| CustomModel | ❓ | ✅ | ❓ 待检查 | ❓ |
| CrawlerMaterial | ✅ | ✅ | ✅ 完成 | 否 |

**建议**: 为所有未传递 uploaderId 的上传接口添加用户ID传递，确保数据完整性。
