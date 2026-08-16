import { sendServiceCommand } from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'
export interface usunrisesunsetResult { success: boolean; query: string; count: number; total: number; items: any[]; error?: string; }
export function getStatus(clientId: string) { return sendServiceCommand({ target: { clientId, pluginKey: 'sunrisesunset' }, command: { name: 'status' }, mode: 'production' }) }
export function search(clientId: string, payload: any) { return sendServiceCommand({ target: { clientId, pluginKey: 'sunrisesunset' }, command: { name: 'search', payload }, mode: 'production' }) }
