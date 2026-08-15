/**
 * Emojipedia Emoji/Sticker 接口封装
 */
import { sendServiceCommand, type ServiceCommandDTO } from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface EmojipediaItem {
  id: string; name?: string; title: string; description?: string;
  image: string; svgUrl?: string; pngUrl?: string; thumbnail?: string; downloadUrl?: string;
  link?: string; url?: string; emoji?: string; platform?: string; tags?: string[];
  width?: number | null; height?: number | null; author?: string; license?: string; isFree?: boolean;
}
export interface EmojipediaSearchResult {
  success: boolean; query: string; count: number; total?: number; totalPages?: number;
  items: EmojipediaItem[]; links: string[]; page: number; nextPage: number | null; error?: string;
}
export interface EmojipediaServiceStatus {
  key?: string; pluginKey?: string; label?: string; connected?: boolean; available?: boolean;
  status?: string; state?: string; busy?: boolean; message?: string; endpoint?: string;
  lastCheckedAt?: string; supportedCommands?: string[]; details?: Record<string, any>;
}
export interface EmojipediaClientVO {
  clientId: string; isOnline?: boolean; nodeStatus?: string | null; machine?: any; location?: any;
  emojipedia?: EmojipediaServiceStatus | null;
}
export interface EmojipediaCommandResponse {
  success: boolean; message: string; data?: { commandId?: string; clientId?: string; pluginKey?: string; payload?: any };
}

function sendCmd(clientId: string, name: string, payload?: Record<string, any>) {
  return sendServiceCommand({ target: { clientId, pluginKey: 'emojipedia' }, command: { name, payload: payload || {} }, mode: 'production' }) as Promise<EmojipediaCommandResponse>
}
function waitForResult(commandId: string, timeoutMs = 60000): Promise<{ success: boolean; message: string; data?: any }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { websocketClient.events.off('serviceCommandResult', handler); reject(new Error(`超时`)); }, timeoutMs);
    const handler = (event: any) => { if (event.commandId === commandId) { clearTimeout(timer); websocketClient.events.off('serviceCommandResult', handler); resolve({ success: event.success, message: event.message, data: event.data }); } };
    websocketClient.events.on('serviceCommandResult', handler);
  });
}
export function refreshEmojipediaStatus(clientId: string) { return sendCmd(clientId, 'refreshRuntime'); }
export function searchEmojipedia(clientId: string, keyword: string, opts: { page?: number; limit?: number; category?: string; platform?: string } = {}) {
  return sendCmd(clientId, 'search', { keyword, query: keyword, page: opts.page || 1, limit: opts.limit || 20, category: opts.category, platform: opts.platform });
}
export function syncEmojipediaToMaterialLibrary(clientId: string, data: { imageUrl: string; metadata?: Record<string, any> }) { return sendCmd(clientId, 'sync', data); }
export function downloadEmojipediaItem(clientId: string, data: { imageUrl: string; filename?: string; platform?: string }) { return sendCmd(clientId, 'download', data); }
export async function searchEmojipediaAndWait(clientId: string, keyword: string, opts: { page?: number; limit?: number; category?: string; platform?: string } = {}): Promise<EmojipediaSearchResult> {
  const res = await searchEmojipedia(clientId, keyword, opts);
  const cmdId = res.data?.commandId || (res as any).commandId;
  if (!res.success || !cmdId) throw new Error(res.message || '搜索命令发送失败');
  const result = await waitForResult(cmdId);
  if (!result.success) throw new Error(result.message || '搜索失败');
  return ((result.data?.data || result.data) || {}) as EmojipediaSearchResult;
}
export async function syncEmojipediaToMaterialLibraryAndWait(clientId: string, data: { imageUrl: string; metadata?: Record<string, any> }) {
  const res = await syncEmojipediaToMaterialLibrary(clientId, data);
  const cmdId = res.data?.commandId || (res as any).commandId;
  if (!res.success || !cmdId) throw new Error(res.message || '同步命令发送失败');
  return waitForResult(cmdId);
}
