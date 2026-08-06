/**
 * 录入测试 Skills
 * 运行: npx tsx scripts/seed-skills.ts
 */
import axios from "axios";

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const TOKEN = process.env.TOKEN || "";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
  },
});

interface SkillData {
  name: string;
  description: string;
  targets: string[];
  triggers: string[];
  content: {
    entry: string;
    files: Record<string, string>;
  };
  enabled: boolean;
  isPublic: boolean;
}

const skills: SkillData[] = [
  {
    name: "海报排版规范",
    description: "适用于电商海报、促销banner的排版设计，包含出血、字体、色彩规范",
    targets: ["design-agent"],
    triggers: ["海报", "排版", "banner", "促销", "电商设计"],
    content: {
      entry: "SKILL.md",
      files: {
        "SKILL.md": `# 海报排版规范

## 适用场景
电商海报、促销banner、活动主图等平面设计任务。

## 核心规范
1. **出血**: 四周预留 3mm 出血
2. **安全区域**: 核心内容距离边缘至少 10mm
3. **字体**: 标题使用思源黑体/阿里巴巴普惠体，正文使用微软雅黑
4. **色彩**: 主色不超过3种，背景与文字对比度 ≥ 4.5:1
5. **分辨率**: 输出 300dpi，网络用途 72dpi

## 排版原则
- 标题字号 ≥ 36pt，确保远距离可读
- 信息层次：主标题 > 副标题 > 正文 > 辅助信息
- 留白比例不低于 30%
- 对齐方式统一，避免混用居中和左对齐`,
        "references/print-spec.md": `# 印刷规格参考

| 用途 | 分辨率 | 色彩模式 | 出血 |
|------|--------|----------|------|
| 印刷品 | 300dpi | CMYK | 3mm |
| 网络 | 72dpi | RGB | 无 |
| 大幅面 | 150dpi | CMYK | 5mm |`,
      },
    },
    enabled: true,
    isPublic: true,
  },
  {
    name: "品牌VI设计指引",
    description: "品牌视觉识别系统设计规范，包含Logo使用、色彩体系、字体规范",
    targets: ["design-agent"],
    triggers: ["品牌", "VI", "logo", "视觉识别", "品牌设计"],
    content: {
      entry: "SKILL.md",
      files: {
        "SKILL.md": `# 品牌VI设计指引

## 适用场景
品牌视觉识别系统设计、Logo设计、品牌升级。

## Logo使用规范
- 最小使用尺寸：宽度不小于 20mm
- 安全空间：Logo四周留出 Logo 高度 1/2 的空间
- 禁止拉伸、旋转、添加阴影或描边

## 色彩体系
- 主色：品牌核心色，用于Logo和重要元素
- 辅助色：1-2个，用于图表和装饰
- 中性色：黑灰白系，用于背景和正文

## 字体规范
- 品牌字体：指定一款品牌专属字体
- 正文字体：系统字体或开源字体
- 中英文混排时英文字号为中文的 95%`,
      },
    },
    enabled: true,
    isPublic: false,
  },
  {
    name: "对联创作助手",
    description: "辅助创作对联、春联、楹联，遵循平仄对仗规则",
    targets: ["admin-agent", "design-agent"],
    triggers: ["对联", "春联", "楹联", "对仗", "平仄", "书法"],
    content: {
      entry: "SKILL.md",
      files: {
        "SKILL.md": `# 对联创作助手

## 适用场景
创作对联、春联、楹联，以及对联相关的书法设计。

## 创作规则
1. **字数相等**: 上下联字数必须一致
2. **词性相对**: 名词对名词，动词对动词
3. **平仄相谐**: 上联末字仄声，下联末字平声
4. **内容相关**: 上下联意义关联，意境协调

## 常用格式
- 五言联：仄仄平平仄，平平仄仄平
- 七言联：平平仄仄平平仄，仄仄平平仄仄平

## 输出要求
- 提供横批建议
- 标注平仄格式
- 给出多种风格选项（传统/现代/创意）`,
      },
    },
    enabled: true,
    isPublic: true,
  },
  {
    name: "UI组件规范",
    description: "Web端UI组件设计规范，包含间距、圆角、阴影、动效等标准",
    targets: ["design-agent"],
    triggers: ["UI", "组件", "界面设计", "设计系统", "间距", "圆角"],
    content: {
      entry: "SKILL.md",
      files: {
        "SKILL.md": `# UI组件设计规范

## 适用场景
Web端后台管理系统、SaaS产品的界面设计。

## 间距系统
- 基础单位：4px
- 常用间距：8px, 12px, 16px, 24px, 32px, 48px
- 组件内边距：12px-16px
- 组件间距：16px-24px

## 圆角规范
- 按钮：6px-8px
- 卡片：8px-12px
- 输入框：6px
- 头像：50%（圆形）

## 阴影层次
- Level 1: 0 1px 3px rgba(0,0,0,0.1) - 悬浮状态
- Level 2: 0 4px 12px rgba(0,0,0,0.1) - 下拉菜单
- Level 3: 0 8px 24px rgba(0,0,0,0.12) - 弹窗

## 动效标准
- 过渡时间：200ms-300ms
- 缓动函数：ease-out 或 cubic-bezier(0.4, 0, 0.2, 1)
- 加载动画：骨架屏或 spinner`,
      },
    },
    enabled: true,
    isPublic: true,
  },
  {
    name: "电商详情页模板",
    description: "淘宝/京东商品详情页设计模板和规范",
    targets: ["design-agent"],
    triggers: ["详情页", "电商", "淘宝", "京东", "商品图", "主图"],
    content: {
      entry: "SKILL.md",
      files: {
        "SKILL.md": `# 电商详情页设计模板

## 适用场景
淘宝、京东、拼多多等电商平台商品详情页设计。

## 主图规范（800x800）
- 第1张：白底产品图
- 第2张：场景图/使用图
- 第3张：卖点图/参数图
- 第4张：促销信息图
- 第5张：品牌/店铺信息

## 详情页结构
1. 产品核心卖点（首屏）
2. 产品参数/规格
3. 细节展示（3-5个细节）
4. 使用场景
5. 尺寸对比
6. 包装清单
7. 品牌故事

## 注意事项
- 文字占比不超过图片面积的20%
- 移动端优先，宽度 750px 设计
- 文件格式：JPG/PNG，单张 ≤ 3MB`,
      },
    },
    enabled: true,
    isPublic: false,
  },
];

async function seedSkills() {
  console.log(`准备录入 ${skills.length} 个 Skills...\n`);

  for (const skill of skills) {
    try {
      const res = await api.post("/ai-skill/create", skill);
      console.log(`✓ 已创建: ${skill.name} (ID: ${res.data?.id || "unknown"})`);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message;
      console.error(`✗ 创建失败 [${skill.name}]: ${msg}`);
    }
  }

  console.log("\n录入完成！");
}

seedSkills().catch(console.error);
