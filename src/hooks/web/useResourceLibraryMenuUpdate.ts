import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ResourceLibraryApi } from '@/api/resource-library'

/**
 * 资源广场菜单"新"标签状态管理
 *
 * 逻辑：
 * - 后端返回每种资源类型的最新发布时间
 * - 前端记录用户上次访问资源广场各子页面的时间
 * - 如果最新发布时间 > 上次访问时间，则显示"新"标签
 */

const STORAGE_KEY = 'resource-library-last-visit'

// 资源类型 → 路由路径映射
const RESOURCE_TYPE_ROUTE_MAP: Record<string, string> = {
  sticker: '/resource-library/sticker',
  psd_template: '/resource-library/psd-template',
  font_template: '/resource-library/font-template',
  asset_3d: '/resource-library/asset-3d',
  file_resource: '/resource-library/file-resource',
  sentence: '/resource-library/sentence',
  ai_skill: '/resource-library/ai-skill',
  prompt: '/resource-library/prompt',
  design_prompt: '/resource-library/design-prompt',
}

// 路由路径 → 资源类型（反向映射）
const ROUTE_RESOURCE_TYPE_MAP: Record<string, string> = Object.entries(
  RESOURCE_TYPE_ROUTE_MAP,
).reduce<Record<string, string>>((acc, [type, path]) => {
  acc[path] = type
  return acc
}, {})

// 各资源类型的最新发布时间
const latestUpdates = ref<Record<string, string | null>>({})

// 用户上次访问时间（从 localStorage 读取）
const lastVisitMap = ref<Record<string, number>>({})

// 轮询定时器
let pollTimer: ReturnType<typeof setInterval> | null = null

/** 从 localStorage 读取访问记录 */
function loadVisitMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/** 写入访问记录到 localStorage */
function saveVisitMap(map: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

/** 标记某个路由为已访问（当前时间） */
function markVisited(routePath: string): void {
  const resourceType = ROUTE_RESOURCE_TYPE_MAP[routePath]
  if (!resourceType) return

  lastVisitMap.value = {
    ...lastVisitMap.value,
    [resourceType]: Date.now(),
  }
  saveVisitMap(lastVisitMap.value)
}

// 7 天内的内容视为"新"
const NEW_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

/** 判断某个资源类型是否有新内容（7 天内） */
function hasNewContent(resourceType: string): boolean {
  const latest = latestUpdates.value[resourceType]
  if (!latest) return false

  const latestTime = new Date(latest).getTime()
  const now = Date.now()

  // 超过 7 天，不再显示"新"
  if (now - latestTime > NEW_THRESHOLD_MS) return false

  const lastVisit = lastVisitMap.value[resourceType]
  if (!lastVisit) return true // 从未访问过，显示"新"

  return latestTime > lastVisit
}

/** 计算颜色深度（越近越深）返回 0~1，1 表示刚刚发布 */
function getNewContentIntensity(resourceType: string): number {
  const latest = latestUpdates.value[resourceType]
  if (!latest) return 0

  const latestTime = new Date(latest).getTime()
  const now = Date.now()
  const age = now - latestTime

  if (age > NEW_THRESHOLD_MS) return 0
  if (age <= 0) return 1

  // 线性衰减：刚发布=1，7天前=0
  return 1 - age / NEW_THRESHOLD_MS
}

/** 判断某个路由路径是否有新内容 */
function hasNewContentByRoute(routePath: string): boolean {
  const resourceType = ROUTE_RESOURCE_TYPE_MAP[routePath]
  if (!resourceType) return false
  return hasNewContent(resourceType)
}

/** 获取某个路由路径的颜色深度 */
function getNewContentIntensityByRoute(routePath: string): number {
  const resourceType = ROUTE_RESOURCE_TYPE_MAP[routePath]
  if (!resourceType) return 0
  return getNewContentIntensity(resourceType)
}

/** 获取各类型最新更新时间 */
async function fetchMenuUpdates(): Promise<void> {
  try {
    const data = await ResourceLibraryApi.getMenuUpdates()
    if (data) {
      latestUpdates.value = data
    }
  } catch {
    // 静默失败，不影响菜单正常显示
  }
}

export function useResourceLibraryMenuUpdate() {
  onMounted(() => {
    lastVisitMap.value = loadVisitMap()
    void fetchMenuUpdates()
    // 每 60 秒轮询一次
    pollTimer = setInterval(() => void fetchMenuUpdates(), 60_000)
  })

  onBeforeUnmount(() => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  })

  return {
    latestUpdates,
    lastVisitMap,
    hasNewContent,
    hasNewContentByRoute,
    getNewContentIntensity,
    getNewContentIntensityByRoute,
    markVisited,
    fetchMenuUpdates,
  }
}
