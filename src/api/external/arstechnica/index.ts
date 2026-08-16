/**
 * Ars Technica 数据接口封装
 */
import { sendServiceCommand, type ServiceCommandDTO } from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface ArstechnicaItem { id: string; title: string; url: string; [key: string]: any; }
export interface ArstechnicaResult { success: boolean; query: string; count: number; total: number; items: ArstechnicaItem[]; error?: string; }
export interface ArstechnicaServiceStatus { connected?: boolean; available?: boolean; status?: string; state?: string; message?: string; supportedCommands?: string[]; }
export interface ArstechnicaClientVO { clientId: string; isOnline?: boolean; [mod]?: ArstechnicaServiceStatus | null; }
export interface ArstechnicaCommandResponse { success: boolean; message: string; data?: any; }

function sendCmd(clientId: string, name: string, payload?: Record<string, any>) {
  return sendServiceCommand({ target: { clientId, pluginKey: 'arstechnica' }, command: { name, payload: payload || {} }, mode: 'production' }) as Promise<ArstechnicaCommandResponse>
}
function waitForResult(commandId: string, timeoutMs = 60000): Promise<{ success: boolean; message: string; data?: any }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { websocketClient.events.off('serviceCommandResult', handler); reject(new Error('超时')); }, timeoutMs);
    const handler = (event: any) => { if (event.commandId === commandId) { clearTimeout(timer); websocketClient.events.off('serviceCommandResult', handler); resolve({ success: event.success, message: event.message, data: event.data }); } };
    websocketClient.events.on('serviceCommandResult', handler);
  })
}
export function getStatus(clientId: string) { return sendCmd(clientId, 'status') }
export function search(clientId: string, payload: any) { return sendCmd(clientId, 'search', payload) }
export function searchAndWait(clientId: string, payload: any): Promise<ArstechnicaResult> {
  return (async () => {
    const res = await search(clientId, payload);
    const cmdId = res.data?.commandId || (res as any).commandId;
    if (!res.success || !cmdId) throw new Error(res.message || '命令发送失败');
    const result = await waitForResult(cmdId);
    if (!result.success) throw new Error(result.message || '搜索失败');
    return (result.data?.data || result.result || {}) as ArstechnicaResult;
  })();
}
