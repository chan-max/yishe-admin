
export const compositeConfig = [
    {
        type: 0,
        label: '未制作',
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
        label: '已制作',
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


export const getCompositeInfo = (hasComposite) => {
    const compositeItem = compositeConfig.find(item => item.type == hasComposite);
    return compositeItem ? compositeItem : {
        label: '未制作',
        tagType: 'info',  // 标签类型
        color: '#b0b0b0'  // 灰色，代表未制作状态 }; // 默认蓝色
    };
}
