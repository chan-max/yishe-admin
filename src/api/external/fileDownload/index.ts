import { sendServiceCommand } from "@/api/system/websocket";

export interface FileDownloadCommand {
  url: string;
}

export interface FileDownloadResult {
  success: boolean;
  message: string;
  filePath?: string;
  fileSize?: number;
  skipped?: boolean;
  cacheKey?: string;
  error?: string;
}

export const downloadFileToClient = (clientId: string, url: string) => {
  return sendServiceCommand({
    clientId,
    service: "file-download",
    action: "download-file",
    mode: "production",
    payload: { url } as FileDownloadCommand,
  });
};

export const checkFileDownloadedOnClient = (clientId: string, url: string) => {
  return sendServiceCommand({
    clientId,
    service: "file-download",
    action: "check-file-downloaded",
    mode: "production",
    payload: { url } as FileDownloadCommand,
  });
};
