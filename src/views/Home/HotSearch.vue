<template>
  <div class="hot-search-container">
    <el-card class="content-card">
      <template #header>
        <div class="card-header">
          <div class="title-section">
            <Icon icon="ep:fire" :size="24" />
            <span class="title-text">热搜</span>
          </div>
          <div class="header-actions">
            <el-button size="small" @click="refreshData" :loading="loading">
              <Icon icon="ep:refresh" />
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <div class="content-section">
        <!-- 平台选择 -->
        <div class="platform-selector">
          <el-tabs v-model="activePlatform" @tab-change="handlePlatformChange">
            <el-tab-pane
              v-for="platform in platforms"
              :key="platform.key"
              :label="platform.label"
              :name="platform.key"
            >
              <template #label>
                <span class="tab-label">
                  <Icon :icon="platform.icon" />
                  {{ platform.label }}
                </span>
              </template>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 热搜列表 -->
        <div class="hotsearch-list" v-loading="loading">
          <div
            v-if="currentData && currentData.length > 0"
            class="hotsearch-items"
          >
            <div
              v-for="(item, index) in currentData"
              :key="index"
              class="hotsearch-item"
              :class="{ 'is-hot': index < 3 }"
            >
              <div class="item-rank">{{ index + 1 }}</div>
              <div class="item-content">
                <div class="item-title">{{ getTitle(item) }}</div>
                <div class="item-meta">
                  <span v-if="getHot(item)" class="item-hot">
                    <Icon icon="ep:fire" />
                    {{ getHot(item) }}
                  </span>
                  <span v-if="item.label" class="item-label">{{ item.label }}</span>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无热搜数据" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@/components/Icon'
import { ElMessage } from 'element-plus'
import { getAllHotsearch, getHotsearchByPlatform } from '@/api/hotsearch'
import type { HotsearchItem, HotsearchData } from '@/api/hotsearch'

const loading = ref(false)
const hotsearchData = ref<Record<string, HotsearchData>>({})
const activePlatform = ref('weibo')
const platforms = [
  { key: 'weibo', label: '微博', icon: 'ep:s-promotion' },
  { key: 'zhihu', label: '知乎', icon: 'ep:question-filled' },
  { key: 'douyin', label: '抖音', icon: 'ep:video-camera' },
  { key: 'bilibili', label: 'B站', icon: 'ep:video-play' },
  { key: 'toutiao', label: '头条', icon: 'ep:document' },
  { key: 'douban', label: '豆瓣', icon: 'ep:star' }
]

const currentData = computed(() => {
  const data = hotsearchData.value[activePlatform.value]
  return data?.data || []
})

const getTitle = (item: HotsearchItem) => {
  return item.title || item.word || item.name || '未知'
}

const getHot = (item: HotsearchItem) => {
  return item.hot || item.hotValue || item.num || ''
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getAllHotsearch()
    if (res.success && res.data) {
      hotsearchData.value = res.data as Record<string, HotsearchData>
    }
  } catch (error) {
    ElMessage.error('获取热搜数据失败')
  } finally {
    loading.value = false
  }
}

const handlePlatformChange = (platform: string) => {
  activePlatform.value = platform
}

const refreshData = () => {
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="less">
.hot-search-container {
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

      .header-actions {
        .el-button {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }
  }
  
  .content-section {
    .platform-selector {
      margin-bottom: 20px;

      .tab-label {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .hotsearch-list {
      min-height: 400px;

      .hotsearch-items {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .hotsearch-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border: 1px solid var(--el-border-color-lighter);
          border-radius: 8px;
          transition: all 0.3s;
          cursor: pointer;

          &:hover {
            border-color: var(--el-color-primary);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          &.is-hot {
            background: linear-gradient(135deg, #fff5f5 0%, #fff9f5 100%);
            border-color: #ff6b6b;

            .item-rank {
              background: linear-gradient(135deg, #ff6b6b 0%, #ff8c69 100%);
              color: #fff;
              font-weight: bold;
            }
          }

          .item-rank {
            min-width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--el-bg-color-page);
            border-radius: 50%;
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-regular);
          }

          .item-content {
            flex: 1;
            min-width: 0;

            .item-title {
              font-size: 14px;
              font-weight: 500;
              color: var(--el-text-color-primary);
              margin-bottom: 6px;
              line-height: 1.5;
              word-break: break-word;
            }

            .item-meta {
              display: flex;
              align-items: center;
              gap: 12px;
              font-size: 12px;
              color: var(--el-text-color-secondary);

              .item-hot {
                display: flex;
                align-items: center;
                gap: 4px;
                color: var(--el-color-danger);
                font-weight: 600;
              }

              .item-label {
                padding: 2px 8px;
                background: var(--el-bg-color-page);
                border-radius: 4px;
                color: var(--el-text-color-regular);
                font-size: 11px;
              }
            }
          }
        }
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .hot-search-container {
    padding: 10px;
    
    .content-card {
      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;

        .title-section {
          font-size: 16px;
        }
      }
    }

    .content-section {
      .hotsearch-list {
        .hotsearch-items {
          .hotsearch-item {
            padding: 10px;

            .item-rank {
              min-width: 28px;
              height: 28px;
              font-size: 12px;
            }

            .item-content {
              .item-title {
                font-size: 13px;
              }

              .item-meta {
                flex-direction: column;
                align-items: flex-start;
                gap: 6px;
              }
            }
          }
        }
      }
    }
  }
}
</style>
