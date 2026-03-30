import axios from 'axios'

const PS_API_BASE = 'http://localhost:1595'

const psApiClient = axios.create({
  baseURL: PS_API_BASE,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json'
  }
})

psApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      const isSecureOrigin =
        typeof window !== 'undefined' && window.location?.protocol === 'https:'

      const networkMessage = isSecureOrigin
        ? '无法从当前安全页面访问本机 localhost:1595，可能是浏览器拦截了本地网络请求或 yishe-ps 尚未放行预检'
        : '无法连接 localhost:1595'

      return Promise.reject(new Error(networkMessage))
    }

    const errorMessage =
      error.response?.data?.detail?.message ||
      error.response?.data?.detail?.error ||
      error.message ||
      '请求失败'
    return Promise.reject(new Error(errorMessage))
  }
)

export interface PhotoshopStatusResponse {
  is_running: boolean
  is_available: boolean
  executable_path?: string
  com_registered: boolean
  connection_test?: {
    success: boolean
    error?: string
    version?: string
  }
  diagnostics: string
  timestamp: string
}

export interface PSDAnalysisResponse {
  file_info: {
    file_path: string
    file_name: string
    file_size: number
    file_size_mb: number
  }
  document_info: {
    width: number
    height: number
    color_mode: string
    depth?: number
    channels?: number
    resolution?: {
      horizontal: number
      vertical: number
      unit: string
    }
  }
  smart_objects: Array<Record<string, any>>
  statistics: {
    total_smart_objects: number
    total_layers: number
    has_smart_objects: boolean
  }
  timestamp: string
}

export interface ProcessRequest {
  psd_path: string
  smart_objects?: Array<Record<string, any>>
  defaults?: Record<string, any>
  image_path?: string
  export_dir?: string
  smart_object_name?: string
  output_filename?: string
  tile_size?: number
  resize_mode?: 'stretch' | 'contain' | 'cover' | 'custom'
  custom_options?: Record<string, any>
  verbose?: boolean
}

export interface ProcessResponse {
  success: boolean
  message: string
  data?: {
    export_files: Array<Record<string, any>>
  }
  timestamp: string
}

export interface HealthResponse {
  status: string
  version: string
  timestamp: string
}

export const localPhotoshopApi = {
  async checkHealth(): Promise<HealthResponse> {
    const response = await psApiClient.get<HealthResponse>('/health')
    return response.data
  },

  async checkPhotoshopStatus(testConnection = false): Promise<PhotoshopStatusResponse> {
    const response = await psApiClient.get<PhotoshopStatusResponse>('/photoshopStatus', {
      params: { test_connection: testConnection }
    })
    return response.data
  },

  async analyzePsd(psdPath: string): Promise<PSDAnalysisResponse> {
    const response = await psApiClient.post<PSDAnalysisResponse>('/analyzePsd', {
      psd_path: psdPath
    })
    return response.data
  },

  async processPsd(request: ProcessRequest): Promise<ProcessResponse> {
    const response = await psApiClient.post<ProcessResponse>('/processPsd', request)
    return response.data
  }
}

export default localPhotoshopApi
