const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '49.232.186.238',
    port: 3306,
    user: 's1',
    password: '666666',
    database: 's1',
  });

  const skills = [
    {
      id: 'skill-001-0000-0000-000000000001',
      user_id: 1,
      name: '海报排版规范',
      description: '适用于电商海报、促销banner的排版设计，包含出血、字体、色彩规范',
      targets: JSON.stringify(['design-agent']),
      triggers: JSON.stringify(['海报', '排版', 'banner', '促销', '电商设计']),
      content: JSON.stringify({
        entry: 'SKILL.md',
        files: {
          'SKILL.md': '# 海报排版规范\n\n## 适用场景\n电商海报、促销banner、活动主图等平面设计任务。\n\n## 核心规范\n1. 出血: 四周预留 3mm 出血\n2. 安全区域: 核心内容距离边缘至少 10mm\n3. 字体: 标题使用思源黑体/阿里巴巴普惠体，正文使用微软雅黑\n4. 色彩: 主色不超过3种，背景与文字对比度 >= 4.5:1\n5. 分辨率: 输出 300dpi，网络用途 72dpi\n\n## 排版原则\n- 标题字号 >= 36pt\n- 信息层次：主标题 > 副标题 > 正文 > 辅助信息\n- 留白比例不低于 30%',
        },
      }),
      enabled: 1,
      is_public: 1,
    },
    {
      id: 'skill-002-0000-0000-000000000002',
      user_id: 1,
      name: '品牌VI设计指引',
      description: '品牌视觉识别系统设计规范，包含Logo使用、色彩体系、字体规范',
      targets: JSON.stringify(['design-agent']),
      triggers: JSON.stringify(['品牌', 'VI', 'logo', '视觉识别', '品牌设计']),
      content: JSON.stringify({
        entry: 'SKILL.md',
        files: {
          'SKILL.md': '# 品牌VI设计指引\n\n## 适用场景\n品牌视觉识别系统设计、Logo设计、品牌升级。\n\n## Logo使用规范\n- 最小使用尺寸：宽度不小于 20mm\n- 安全空间：Logo四周留出 Logo 高度 1/2 的空间\n- 禁止拉伸、旋转、添加阴影或描边\n\n## 色彩体系\n- 主色：品牌核心色，用于Logo和重要元素\n- 辅助色：1-2个，用于图表和装饰\n- 中性色：黑灰白系，用于背景和正文\n\n## 字体规范\n- 品牌字体：指定一款品牌专属字体\n- 正文字体：系统字体或开源字体',
        },
      }),
      enabled: 1,
      is_public: 0,
    },
    {
      id: 'skill-003-0000-0000-000000000003',
      user_id: 1,
      name: '对联创作助手',
      description: '辅助创作对联、春联、楹联，遵循平仄对仗规则',
      targets: JSON.stringify(['admin-agent', 'design-agent']),
      triggers: JSON.stringify(['对联', '春联', '楹联', '对仗', '平仄', '书法']),
      content: JSON.stringify({
        entry: 'SKILL.md',
        files: {
          'SKILL.md': '# 对联创作助手\n\n## 适用场景\n创作对联、春联、楹联，以及对联相关的书法设计。\n\n## 创作规则\n1. 字数相等: 上下联字数必须一致\n2. 词性相对: 名词对名词，动词对动词\n3. 平仄相谐: 上联末字仄声，下联末字平声\n4. 内容相关: 上下联意义关联，意境协调\n\n## 常用格式\n- 五言联：仄仄平平仄，平平仄仄平\n- 七言联：平平仄仄平平仄，仄仄平平仄仄平\n\n## 输出要求\n- 提供横批建议\n- 标注平仄格式\n- 给出多种风格选项（传统/现代/创意）',
        },
      }),
      enabled: 1,
      is_public: 1,
    },
    {
      id: 'skill-004-0000-0000-000000000004',
      user_id: 1,
      name: 'UI组件规范',
      description: 'Web端UI组件设计规范，包含间距、圆角、阴影、动效等标准',
      targets: JSON.stringify(['design-agent']),
      triggers: JSON.stringify(['UI', '组件', '界面设计', '设计系统', '间距', '圆角']),
      content: JSON.stringify({
        entry: 'SKILL.md',
        files: {
          'SKILL.md': '# UI组件设计规范\n\n## 适用场景\nWeb端后台管理系统、SaaS产品的界面设计。\n\n## 间距系统\n- 基础单位：4px\n- 常用间距：8px, 12px, 16px, 24px, 32px, 48px\n- 组件内边距：12px-16px\n- 组件间距：16px-24px\n\n## 圆角规范\n- 按钮：6px-8px\n- 卡片：8px-12px\n- 输入框：6px\n\n## 阴影层次\n- Level 1: 0 1px 3px rgba(0,0,0,0.1)\n- Level 2: 0 4px 12px rgba(0,0,0,0.1)\n- Level 3: 0 8px 24px rgba(0,0,0,0.12)\n\n## 动效标准\n- 过渡时间：200ms-300ms\n- 缓动函数：ease-out',
        },
      }),
      enabled: 1,
      is_public: 1,
    },
    {
      id: 'skill-005-0000-0000-000000000005',
      user_id: 1,
      name: '电商详情页模板',
      description: '淘宝/京东商品详情页设计模板和规范',
      targets: JSON.stringify(['design-agent']),
      triggers: JSON.stringify(['详情页', '电商', '淘宝', '京东', '商品图', '主图']),
      content: JSON.stringify({
        entry: 'SKILL.md',
        files: {
          'SKILL.md': '# 电商详情页设计模板\n\n## 适用场景\n淘宝、京东、拼多多等电商平台商品详情页设计。\n\n## 主图规范（800x800）\n- 第1张：白底产品图\n- 第2张：场景图/使用图\n- 第3张：卖点图/参数图\n- 第4张：促销信息图\n- 第5张：品牌/店铺信息\n\n## 详情页结构\n1. 产品核心卖点（首屏）\n2. 产品参数/规格\n3. 细节展示（3-5个细节）\n4. 使用场景\n5. 尺寸对比\n6. 包装清单\n7. 品牌故事\n\n## 注意事项\n- 文字占比不超过图片面积的20%\n- 移动端优先，宽度 750px 设计',
        },
      }),
      enabled: 1,
      is_public: 0,
    },
  ];

  for (const s of skills) {
    await conn.execute(
      'INSERT INTO `ai_skill` (id, user_id, name, description, targets, triggers, content, enabled, is_public, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [s.id, s.user_id, s.name, s.description, s.targets, s.triggers, s.content, s.enabled, s.is_public],
    );
    console.log(`✓ ${s.name}`);
  }

  await conn.end();
  console.log('\n录入完成！');
}

main().catch((e) => { console.error(e); process.exit(1); });
