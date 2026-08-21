import request from "@/config/axios"
import type { WebsocketConnectionVO } from "@/api/system/websocket"

export interface DashboardStats {
  clientOnline: number
  clientTotal: number
  designToolOnline: number
  designToolTotal: number
  pluginOnline: number
  pluginTotal: number
  adminOnline: number
  totalConnections: number
  psOnline: number
  browserOnline: number
  clientsWithPsAutomation: number
  clientsWithBrowserAutomation: number
}

export interface DashboardConnection {
  id: string
  source: string
  isOnline: boolean
  connectedAt: string | null
  clientInfo?: WebsocketConnectionVO["clientInfo"]
}

function classifyConnectionSource(connection: WebsocketConnectionVO): string {
  const info = connection.clientInfo || {}
  const source = String(info.source || connection.clientSource || "").trim()
  const appName = String(info.app?.name || "").trim()

  if (
    source === "设计工具" ||
    source === "设计端" ||
    source === "design-tool" ||
    source === "design" ||
    appName === "设计工具" ||
    appName === "design-tool"
  ) {
    return "design-tool"
  }

  if (
    source === "管理后台" ||
    source === "admin" ||
    source === "管理端" ||
    source === "admin-panel" ||
    appName === "管理后台" ||
    appName === "admin"
  ) {
    return "admin"
  }

  if (
    source === "客户端" ||
    source === "client" ||
    appName === "客户端" ||
    appName === "client"
  ) {
    return "client"
  }

  const services = info.services || {}
  if (services["ps-automation"] || services.photoshop) {
    return "client"
  }
  if (services["browser-automation"]) {
    return "client"
  }

  const pageTitle = String(info.page?.title || "").trim()
  if (pageTitle.includes("设计") || pageTitle.includes("design")) {
    return "design-tool"
  }

  if (info.app) {
    return "client"
  }

  return "other"
}

function isServiceOnline(service: any): boolean {
  if (!service) return false
  return service.status === "connected" || service.available === true || service.connected === true
}

function isPluginOnline(connection: WebsocketConnectionVO): boolean {
  const services = connection.clientInfo?.services || {}
  return Object.values(services).some((s) => isServiceOnline(s))
}

export const getDashboardStatsApi = async (): Promise<DashboardStats> => {
  let list: WebsocketConnectionVO[] = []
  try {
    const connections = await request.post<WebsocketConnectionVO[]>({
      url: "/websocket/runtime-connections-view",
    })
    list = Array.isArray(connections) ? connections : connections?.data || []
  } catch (error) {
    list = []
  }

  let clientOnline = 0
  let clientTotal = 0
  let designToolOnline = 0
  let designToolTotal = 0
  let pluginOnline = 0
  let pluginTotal = 0
  let adminOnline = 0
  let psOnline = 0
  let browserOnline = 0
  let clientsWithPsAutomation = 0
  let clientsWithBrowserAutomation = 0

  for (const conn of list) {
    const source = classifyConnectionSource(conn)
    const isOnline = conn.isOnline !== false

    if (source === "client") {
      clientTotal++
      if (isOnline) {
        clientOnline++
        if (isPluginOnline(conn)) {
          pluginOnline++
        }
      }
      pluginTotal++

      const psService = conn.clientInfo?.services?.["ps-automation"] || conn.clientInfo?.services?.photoshop
      if (psService) {
        clientsWithPsAutomation++
        if (isServiceOnline(psService)) {
          psOnline++
        }
      }

      const browserService = conn.clientInfo?.services?.["browser-automation"]
      if (browserService) {
        clientsWithBrowserAutomation++
        if (isServiceOnline(browserService)) {
          browserOnline++
        }
      }
    } else if (source === "design-tool") {
      designToolTotal++
      if (isOnline) designToolOnline++
    } else if (source === "admin") {
      if (isOnline) adminOnline++
    }
  }

  return {
    clientOnline,
    clientTotal,
    designToolOnline,
    designToolTotal,
    pluginOnline,
    pluginTotal,
    adminOnline,
    totalConnections: list.length,
    psOnline,
    browserOnline,
    clientsWithPsAutomation,
    clientsWithBrowserAutomation,
  }
}
