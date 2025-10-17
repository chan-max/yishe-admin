/**
 * 用户身份标志功能说明
 * 在右上角用户信息处显示管理员/普通用户标志
 */

export const userBadgeFeatures = {
  // 功能说明
  description: `
    🎯 用户身份标签功能已优化完成！

    📍 显示位置：
    - 用户头像右上角小巧标签
    - 用户下拉菜单头部详细信息

    🎨 视觉效果：
    - 管理员：金色圆形标签 + 皇冠图标 + 脉冲动画
    - 普通用户：绿色圆形标签 + 用户图标 + 简洁样式

    📱 响应式设计：
    - 桌面端：16px圆形标签
    - 移动端：14px圆形标签自适应
  `,

  // 样式特点
  styles: {
    admin: {
      size: '16px圆形标签',
      background: '金色渐变背景',
      icon: '皇冠图标 (ep:crown)',
      color: '深金色图标',
      animation: '脉冲缩放动画',
      border: '白色边框',
      position: '头像右上角'
    },
    user: {
      size: '16px圆形标签',
      background: '绿色渐变背景',
      icon: '用户图标 (ep:user)',
      color: '白色图标',
      animation: '无动画',
      border: '白色边框',
      position: '头像右上角'
    }
  },

  // 实现细节
  implementation: {
    template: `
      <!-- 管理员标签 -->
      <div v-if="isAdmin" class="admin-label" title="管理员">
        <Icon icon="ep:crown" />
      </div>
      
      <!-- 普通用户标签 -->
      <div v-else class="user-label" title="普通用户">
        <Icon icon="ep:user" />
      </div>
    `,
    
    css: `
      .admin-label {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        background: linear-gradient(135deg, #ffd700, #ffed4e);
        border: 2px solid #ffffff;
        border-radius: 50%;
        animation: adminPulse 2s ease-in-out infinite;
      }
      
      .user-label {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        background: linear-gradient(135deg, #10b981, #34d399);
        border: 2px solid #ffffff;
        border-radius: 50%;
      }
    `
  },

  // 使用说明
  usage: `
    1. 🔍 查看用户身份：
       - 管理员：头像右上角金色圆形标签 + 皇冠图标
       - 普通用户：头像右上角绿色圆形标签 + 用户图标

    2. 📋 下拉菜单信息：
       - 点击用户头像查看详细信息
       - 显示用户类型和公司信息

    3. 🎨 视觉效果：
       - 管理员标签有脉冲动画效果
       - 普通用户标签简洁明了
       - 小巧精致，不占用过多空间

    4. 🔧 技术实现：
       - 基于 userStore.user.isAdmin 判断
       - 使用 Element Plus 图标
       - CSS3 动画和渐变效果
       - 绝对定位在头像右上角
  `,

  // 测试方法
  test: `
    🧪 测试方法：
    
    1. 登录管理员账号：
       - 应该看到金色皇冠标志
       - 标志应该有发光动画
       - 下拉菜单显示"系统管理员"
    
    2. 登录普通用户账号：
       - 应该看到灰色用户标志
       - 标志无动画效果
       - 下拉菜单显示"普通用户"
    
    3. 响应式测试：
       - 缩小浏览器窗口
       - 标志应该自适应调整大小
       - 移动端显示正常
  `
}

// 导出功能说明
if (typeof window !== 'undefined') {
  window.userBadgeFeatures = userBadgeFeatures
}
