export const roleConfig = [
    {
        type: 'ADMIN', 
        label: '管理员', 
        color: '#ffbb00' // 红色，代表管理员角色的高权限
    },
    {
        type: 'DESIGNER', 
        label: '美工人员', 
        color: 'pink' // 黄色，代表设计人员的创意性质
    },
    {
        type: 'ELEMENT', 
        label: '元素人员', 
        color: '#52c41a' // 绿色，代表元素人员的基础性质
    },
    {
        type: 'OPERATION', 
        label: '运营人员', 
        color: '#1890ff' // 蓝色，代表运营人员的协调性质
    },
    {
        type: 'PURCHASE', 
        label: '采购人员', 
        color: '#13c2c2' // 青色，代表采购人员的执行性质
    }
];

// 获取角色颜色
export const getRoleColor = (role) => {
    const roleItem = roleConfig.find(item => item.type === role);
    return roleItem ? roleItem.color : '#108ee9'; // 默认蓝色
};

// 获取角色标签
export const getRoleLabel = (role) => {
    const roleItem = roleConfig.find(item => item.type === role);
    return roleItem ? roleItem.label : '未知角色';
};
