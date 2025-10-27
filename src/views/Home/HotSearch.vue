<template>
  <div class="hot-search-container">
    <div class="header">
      <span class="title">热搜</span>
      <el-button size="small" text @click="refreshData" :loading="loading">
        刷新
      </el-button>
    </div>

    <div class="content-section" v-loading="loading">
        <!-- 所有平台的热搜数据 -->
        <div
          v-for="platform in platformsWithData"
          :key="platform.key"
          class="platform-section"
        >
          <div class="platform-header">
            <span class="platform-name">{{ platform.label }}</span>
          </div>

          <div class="hotsearch-list">
              <div
                v-for="(item, index) in getPlatformData(platform.key)"
                :key="index"
                class="hotsearch-item"
                :class="{ 'is-hot': index < 5 }"
              >
              <div class="item-rank">{{ index + 1 }}</div>
              <div class="item-content">
                <div class="item-title">{{ getTitle(item) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!hasAnyData" class="empty">暂无热搜数据</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAllHotsearch } from '@/api/hotsearch'
import type { HotsearchItem } from '@/api/hotsearch'

interface Platform {
  key: string
  label: string
  icon: string
}

const loading = ref(false)
const hotsearchData = ref<Record<string, any>>({})

/**
 * 平台配置说明
 * key: 后端返回的数据中的 key（平台名称）
 * label: 前端显示的平台名称
 * icon: 平台图标
 * 
 * 平台对应关系：
 * weibo - 微博 - 有 title, hot(数值), rank, label, icon
 * douyin - 抖音 - 有 title, hot(数值), rank, video_count, label
 * toutiao - 今日头条 - 有 title, hot(字符串，如"1342.3万"), rank
 * toutiao2 - 今日头条2 - 有 title, hot(数值), rank, tag, cover, icon, url
 * bilibili - 哔哩哔哩 - 有 title, hot(数值), rank, icon, keyword, url
 * zhihu - 知乎 - 有 title, hot, rank, icon, type, uuid
 * douban - 豆瓣 - 有 title, hot, rank, subtitle, type, url, id（hot为浏览数字符串）
 * music - 酷狗音乐 - 有 title, songName, artist, rank, duration, url, isNew, hot
 */
const platforms: Platform[] = [
  { key: 'weibo', label: '微博', icon: 'ep:s-promotion' },
  { key: 'douyin', label: '抖音', icon: 'ep:video-camera' },
  { key: 'toutiao', label: '今日头条', icon: 'ep:document' },
  { key: 'toutiao2', label: '今日头条2', icon: 'ep:document' },
  { key: 'bilibili', label: '哔哩哔哩', icon: 'ep:video-play' },
  { key: 'zhihu', label: '知乎', icon: 'ep:question-filled' },
  { key: 'douban', label: '豆瓣', icon: 'ep:star' },
  { key: 'music', label: '酷狗音乐', icon: 'ep:microphone' }
]

const hasAnyData = computed(() => {
  return Object.keys(hotsearchData.value).length > 0
})

const platformsWithData = computed(() => {
  return platforms.filter(platform => {
    const data = hotsearchData.value[platform.key]
    return data && data.data && Array.isArray(data.data) && data.data.length > 0
  })
})

const getPlatformData = (platformKey: string) => {
  const data = hotsearchData.value[platformKey]
  const items = data?.data || []
  
  // 微博只显示前10条
  if (platformKey === 'weibo') {
    return items.slice(0, 10)
  }
  
  return items
}

/**
 * 获取热搜标题
 * 不同平台使用不同的字段名表示标题
 */
const getTitle = (item: HotsearchItem) => {
  return item.title || item.word || item.name || item.songName || '未知'
}

/**
 * 获取热度值
 * 不同平台的热度表示方式不同：
 * - 微博/抖音：直接是数字或字符串
 * - 豆瓣：使用 subtitle 显示"xxx篇内容 · xxx次浏览"
 * - 酷狗音乐：使用 hot 字段显示"新入榜"等标签
 */
const getHot = (item: HotsearchItem) => {
  // 不同平台的热度字段可能不同，兼容各种格式
  const hot = item.hot || item.hotValue || item.num || ''
  // 豆瓣的特殊处理：显示浏览数
  if (item.subtitle) {
    return item.subtitle
  }
  // 酷狗的特殊处理：显示热度标签
  if (item.isNew && item.hot) {
    return item.hot
  }
  return hot
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getAllHotsearch()
    if (res.success && res.data) {
      hotsearchData.value = res.data as Record<string, any>
      ElMessage.success('热搜数据已更新')
    }
  } catch (error) {
    ElMessage.error('获取热搜数据失败')
    console.error('获取热搜数据失败:', error)
  } finally {
    loading.value = false
  }
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
  padding: 12px 16px;
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }
  
  .content-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 12px;

    .platform-section {
      border: 1px solid #e8e9ec;
      border-radius: 6px;
      padding: 10px;
      background: #fafbfc;

      .platform-header {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
        padding-bottom: 6px;
        border-bottom: 1px solid #f0f1f3;
      }

      .hotsearch-list {
        .hotsearch-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          padding: 3px 0;
          
          &.is-hot {
            .item-rank {
              color: #f56c6c;
              font-weight: 600;
              font-size: 12px;
            }
            
            .item-content {
              .item-title {
                color: #303133;
                font-weight: 500;
                font-size: 13px;
              }
            }
          }

          .item-rank {
            min-width: 18px;
            font-size: 11px;
            font-weight: 500;
            color: #9ea3b0;
            flex-shrink: 0;
          }

          .item-content {
            flex: 1;
            min-width: 0;
            
            .item-title {
              margin-bottom: 2px;
              word-break: break-word;
              line-height: 1.4;
              color: #606266;
              font-size: 12px;
            }

            .item-meta {
              font-size: 10px;
              color: #909399;
              
              .item-hot {
                color: #f56c6c;
                font-weight: 500;
              }

              .item-label {
                color: #909399;
                padding: 1px 4px;
                background: #f5f7fa;
                border-radius: 2px;
              }
            }
          }
        }
      }
    }

    .empty {
      text-align: center;
      color: #9ea3b0;
      padding: 20px;
      grid-column: 1 / -1;
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .hot-search-container {
    padding: 8px;
    
    .content-section {
      grid-template-columns: 1fr;
      gap: 10px;

      .platform-section {
        .platform-header {
          font-size: 13px;
          margin-bottom: 6px;
        }

        .hotsearch-item {
          font-size: 12px;

          .item-rank {
            min-width: 18px;
            font-size: 11px;
          }
        }
      }
    }
  }
}
</style>
