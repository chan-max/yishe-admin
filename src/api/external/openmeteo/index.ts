import { sendServiceCommand, type ServiceCommandDTO } from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface uopenmeteoResult { success: boolean; query: string; count: number; total: number; items: any[]; error?: string; }
export interface uopenmeteoServiceStatus { connected?: boolean; available?: boolean; status?: string; state?: string; message?: string; }
export interface uopenmeteoClientVO { clientId: string; isOnline?: boolean; openmeteo?: uopenmeteoServiceStatus | null; }

function sendCmd(clientId: string, name: string, payload?: Record<string, any>) {
  return sendServiceCommand({ target: { clientId, pluginKey: 'openmeteo' }, command: { name, payload: payload || {} }, mode: 'production' }) as Promise<any>
}
function waitForResult(commandId: string, timeoutMs = 60000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { websocketClient.events.off('serviceCommandResult', handler); reject(new Error('超时')); }, timeoutMs);
    const handler = (event: any) => { if (event.commandId === commandId) { clearTimeout(timer); websocketClient.events.off('serviceCommandResult', handler); resolve({ success: event.success, message: event.message, data: event.data }); } };
    websocketClient.events.on('serviceCommandResult', handler);
  });
}
export function getStatus(clientId: string) { return sendCmd(clientId, 'status') }
export function search(clientId: string, payload: any) { return sendCmd(clientId, 'search', payload) }
export function searchAndWait(clientId: string, payload: any): Promise<uopenmeteoResult> {
  return (async () => {
    const res = await search(clientId, payload);
    const cmdId = res.data?.commandId || (res as any).commandId;
    if (!res.success || !cmdId) throw new Error(res.message || '命令发送失败');
    const result = await waitForResult(cmdId);
    if (!result.success) throw new Error(result.message || '搜索失败');
    return (result.data?.data || result.result || {}) as uopenmeteoResult;
  })();
}
