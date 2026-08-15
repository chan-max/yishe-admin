/**
 * OpenMoji 开源 Emoji 接口封装
 */
import { sendServiceCommand, type ServiceCommandDTO } from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface OpenMojiEmoji {
  id: string; name?: string; title: string; description?: string;
  image: string; svgUrl?: string; svgBlackUrl?: string; pngUrl?: string; pngBlackUrl?: string;
  thumbnail?: string; downloadUrl?: string; link?: string; url?: string;
  emoji?: string; hexcode?: string; group?: string; subGroup?: string; tags?: string[];
  width?: number | null; height?: number | null; author?: string; license?: string; isFree?: boolean;
}
export interface OpenMojiSearchResult {
  success: boolean; query: string; count: number; total?: number; totalPages?: number;
  items: OpenMojiEmoji[]; links: string[]; page: number; nextPage: number | null; error?: string;
}
export interface OpenMojiServiceStatus {
  key?: string; pluginKey?: string; label?: string; connected?: boolean; available?: boolean;
  status?: string; state?: string; busy?: boolean; message?: string; endpoint?: string;
  lastCheckedAt?: string; supportedCommands?: string[]; details?: Record<string, any>;
}
export interface OpenMojiClientVO {
  clientId: string; isOnline?: boolean; nodeStatus?: string | null; machine?: any; location?: any;
  openmoji?: OpenMojiServiceStatus | null;
}
export interface OpenMojiCommandResponse {
  success: boolean; message: string; data?: { commandId?: string; clientId?: string; pluginKey?: string; payload?: any };
}

function sendCmd(clientId: string, name: string, payload?: Record<string, any>) {
  return sendServiceCommand({ target: { clientId, pluginKey: 'openmoji' }, command: { name, payload: payload || {} }, mode: 'production' }) as Promise<OpenMojiCommandResponse>
}
function waitForResult(commandId: string, timeoutMs = 60000): Promise<{ success: boolean; message: string; data?: any }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { websocketClient.events.off('serviceCommandResult', handler); reject(new Error(`超时`)); }, timeoutMs);
    const handler = (event: any) => { if (event.commandId === commandId) { clearTimeout(timer); websocketClient.events.off('serviceCommandResult', handler); resolve({ success: event.success, message: event.message, data: event.data }); } };
    websocketClient.events.on('serviceCommandResult', handler);
  });
}
export function refreshOpenMojiStatus(clientId: string) { return sendCmd(clientId, 'refreshRuntime'); }
export function searchOpenMoji(clientId: string, keyword: string, opts: { page?: number; limit?: number; style?: 'color' | 'black'; group?: string } = {}) {
  return sendCmd(clientId, 'search', { keyword, query: keyword, page: opts.page || 1, limit: opts.limit || 20, style: opts.style, group: opts.group });
}
export function syncOpenMojiToMaterialLibrary(clientId: string, data: { imageUrl: string; metadata?: Record<string, any> }) { return sendCmd(clientId, 'sync', data); }
export function downloadOpenMojiEmoji(clientId: string, data: { imageUrl: string; filename?: string; style?: 'color' | 'black' }) { return sendCmd(clientId, 'download', data); }
export async function searchOpenMojiAndWait(clientId: string, keyword: string, opts: { page?: number; limit?: number; style?: 'color' | 'black'; group?: string } = {}): Promise<OpenMojiSearchResult> {
  const res = await searchOpenMoji(clientId, keyword, opts);
  const cmdId = res.data?.commandId || (res as any).commandId;
  if (!res.success || !cmdId) throw new Error(res.message || '搜索命令发送失败');
  const result = await waitForResult(cmdId);
  if (!result.success) throw new Error(result.message || '搜索失败');
  return ((result.data?.data || result.data) || {}) as OpenMojiSearchResult;
}
export async function syncOpenMojiToMaterialLibraryAndWait(clientId: string, data: { imageUrl: string; metadata?: Record<string, any> }) {
  const res = await syncOpenMojiToMaterialLibrary(clientId, data);
  const cmdId = res.data?.commandId || (res as any).commandId;
  if (!res.success || !cmdId) throw new Error(res.message || '同步命令发送失败');
  return waitForResult(cmdId);
}
