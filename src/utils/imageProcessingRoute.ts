import type { LocationQuery, LocationQueryRaw, RouteLocationRaw } from 'vue-router'

export type ImageProcessingTaskType = 'process' | 'variations'

const IMAGE_PROCESSING_PREFILL_STORAGE_PREFIX = 'image-processing-prefill:'

export interface ImageProcessingRoutePrefill {
  imageUrl: string
  title?: string
  sourceName?: string
  sourceModule?: string
  sourceRecordId?: string
  taskType?: ImageProcessingTaskType
  openCreate?: boolean
  operations?: any[]
  operationKeyword?: string
}

export const IMAGE_PROCESSING_PREFILL_QUERY_KEYS = [
  'prefillKey',
  'imageUrl',
  'title',
  'sourceName',
  'sourceModule',
  'sourceRecordId',
  'taskType',
  'openCreate',
  'operations',
  'operationKeyword'
] as const

const normalizeQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return String(value[0] || '').trim()
  }
  return String(value || '').trim()
}

const canUseSessionStorage = () => {
  return typeof window !== 'undefined' && !!window.sessionStorage
}

const buildStorageKey = (prefillKey: string) => {
  return `${IMAGE_PROCESSING_PREFILL_STORAGE_PREFIX}${prefillKey}`
}

const normalizePrefillPayload = (payload: Partial<ImageProcessingRoutePrefill> | null) => {
  const imageUrl = normalizeQueryValue(payload?.imageUrl)
  if (!imageUrl) {
    return null
  }

  const title = normalizeQueryValue(payload?.title)
  const sourceName = normalizeQueryValue(payload?.sourceName)
  const sourceModule = normalizeQueryValue(payload?.sourceModule)
  const sourceRecordId = normalizeQueryValue(payload?.sourceRecordId)
  const taskType = normalizeTaskType(payload?.taskType)
  const operations = Array.isArray(payload?.operations) ? payload.operations : undefined
  const operationKeyword = normalizeQueryValue(payload?.operationKeyword)
  const openCreate =
    payload?.openCreate === undefined ? true : payload.openCreate !== false

  return {
    imageUrl,
    title: title || undefined,
    sourceName: sourceName || undefined,
    sourceModule: sourceModule || undefined,
    sourceRecordId: sourceRecordId || undefined,
    taskType,
    openCreate,
    operations,
    operationKeyword: operationKeyword || undefined
  } satisfies ImageProcessingRoutePrefill
}

const persistImageProcessingPrefill = (payload: ImageProcessingRoutePrefill) => {
  if (!canUseSessionStorage()) {
    return ''
  }

  const prefillKey = `ip_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  try {
    window.sessionStorage.setItem(buildStorageKey(prefillKey), JSON.stringify(payload))
    return prefillKey
  } catch (error) {
    return ''
  }
}

const readStoredImageProcessingPrefill = (prefillKey: string) => {
  if (!prefillKey || !canUseSessionStorage()) {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(buildStorageKey(prefillKey))
    if (!raw) {
      return null
    }
    return normalizePrefillPayload(JSON.parse(raw))
  } catch (error) {
    return null
  }
}

const normalizeTaskType = (value: unknown): ImageProcessingTaskType => {
  return String(value || '').trim() === 'variations' ? 'variations' : 'process'
}

export const buildImageProcessingRouteLocation = (
  payload: ImageProcessingRoutePrefill
): RouteLocationRaw => {
  const normalizedPayload = normalizePrefillPayload(payload)
  if (!normalizedPayload) {
    return {
      name: 'ImageProcessingRecord'
    }
  }

  const prefillKey = persistImageProcessingPrefill(normalizedPayload)
  const query: LocationQueryRaw = prefillKey
    ? {
        prefillKey
      }
    : {
        imageUrl: normalizedPayload.imageUrl,
        openCreate: normalizedPayload.openCreate === false ? '0' : '1',
        ...(normalizedPayload.title ? { title: normalizedPayload.title } : {}),
        ...(normalizedPayload.sourceName ? { sourceName: normalizedPayload.sourceName } : {}),
        ...(normalizedPayload.sourceModule
          ? { sourceModule: normalizedPayload.sourceModule }
          : {}),
        ...(normalizedPayload.sourceRecordId
          ? { sourceRecordId: normalizedPayload.sourceRecordId }
          : {}),
        ...(normalizedPayload.taskType ? { taskType: normalizedPayload.taskType } : {}),
        ...(normalizedPayload.operationKeyword
          ? { operationKeyword: normalizedPayload.operationKeyword }
          : {}),
        ...(normalizedPayload.operations
          ? { operations: JSON.stringify(normalizedPayload.operations) }
          : {})
      }

  return {
    name: 'ImageProcessingRecord',
    query
  }
}

export const resolveImageProcessingRoutePrefill = (
  query: LocationQuery
): ImageProcessingRoutePrefill | null => {
  const prefillKey = normalizeQueryValue(query.prefillKey)
  if (prefillKey) {
    const storedPayload = readStoredImageProcessingPrefill(prefillKey)
    if (storedPayload) {
      return storedPayload
    }
  }

  return normalizePrefillPayload({
    imageUrl: normalizeQueryValue(query.imageUrl),
    title: normalizeQueryValue(query.title),
    sourceName: normalizeQueryValue(query.sourceName),
    sourceModule: normalizeQueryValue(query.sourceModule),
    sourceRecordId: normalizeQueryValue(query.sourceRecordId),
    taskType: normalizeTaskType(query.taskType),
    openCreate: normalizeQueryValue(query.openCreate) !== '0',
    operationKeyword: normalizeQueryValue(query.operationKeyword),
    operations: parseOperationsQueryValue(query.operations)
  })
}

const parseOperationsQueryValue = (value: unknown) => {
  const raw = normalizeQueryValue(value)
  if (!raw) {
    return undefined
  }
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

export const clearImageProcessingRoutePrefill = (query: LocationQuery) => {
  const prefillKey = normalizeQueryValue(query.prefillKey)
  if (!prefillKey || !canUseSessionStorage()) {
    return
  }

  try {
    window.sessionStorage.removeItem(buildStorageKey(prefillKey))
  } catch (error) {
    // ignore storage cleanup failures
  }
}

export const stripImageProcessingPrefillQuery = (query: LocationQuery) => {
  const nextQuery: Record<string, any> = { ...query }
  for (const key of IMAGE_PROCESSING_PREFILL_QUERY_KEYS) {
    delete nextQuery[key]
  }
  return nextQuery
}

export const buildImageProcessingPrefillSignature = (
  payload: ImageProcessingRoutePrefill | null
) => {
  if (!payload?.imageUrl) {
    return ''
  }

  return [
    payload.imageUrl,
    payload.title || '',
    payload.sourceName || '',
    payload.sourceModule || '',
    payload.sourceRecordId || '',
    payload.taskType || 'process',
    payload.openCreate === false ? '0' : '1',
    payload.operationKeyword || '',
    JSON.stringify(payload.operations || [])
  ].join('::')
}
