<template>
  <div class="tools-container">
    <el-card class="content-card">
      <template #header>
        <div class="card-header">
          <div class="title-section">
            <Icon icon="ep:tools" :size="24" />
            <span class="title-text">工具列表</span>
          </div>
        </div>
      </template>

      <div class="content-section">
        <el-alert
          title="工具集合"
          type="info"
          :closable="false"
          show-icon
          description="此功能即将上线"
        />

        <div class="placeholder-content">
          <el-empty description="内容暂无，敬请期待" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@/components/Icon'
</script>

<style scoped lang="less">
.tools-container {
  padding: 20px;
  height: 100%;
  
  .content-card {
    height: 100%;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .title-section {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: bold;
        font-size: 18px;
        color: var(--el-text-color-primary);
      }
    }
  }
  
  .content-section {
    .placeholder-content {
      margin-top: 40px;
      padding: 60px 0;
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .tools-container {
    padding: 10px;
    
    .content-card {
      .card-header {
        .title-section {
          font-size: 16px;
        }
      }
    }
  }
}
</style>
