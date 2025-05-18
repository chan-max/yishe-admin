
export const titleConfig = [
  {
      type: 0,
      label: '未完成',
      tagType: 'info',  // 标签类型
      color: '#b0b0b0'  // 灰色，代表未制作状态
  },
  {
      type: 1,
      label: '制作中',
      tagType: 'warning',  // 标签类型
      color: '#faad14'  // 黄色，代表制作中状态
  },
  {
      type: 2,
      label: '已完成',
      tagType: 'success',  // 标签类型
      color: '#52c41a'  // 绿色，代表已制作状态
  },
  {
      type: 3,
      label: '错误',
      tagType: 'danger',  // 标签类型
      color: '#ff4d4f'  // 红色，代表错误状态
  }
];

// 获取标题信息
export const getTitleStatusInfo = (t) => {
  const titleItem = titleConfig.find(item => item.type == t);
  return titleItem ? titleItem :  {
      type: 3,
      label: '错误',
      tagType: 'danger',  // 标签类型
      color: '#ff4d4f'  // 红色，代表错误状态
  }
}
