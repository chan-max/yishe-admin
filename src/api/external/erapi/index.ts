import { sendServiceCommand } from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'
export function getStatus(clientId: string) { return sendServiceCommand({ target: { clientId, pluginKey: 'erapi' }, command: { name: 'status' }, mode: 'production' }) }
export function search(clientId: string, payload: any) { return sendServiceCommand({ target: { clientId, pluginKey: 'erapi' }, command: { name: 'search', payload }, mode: 'production' }) }
