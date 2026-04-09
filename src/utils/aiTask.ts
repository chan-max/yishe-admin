import { ElNotification } from "element-plus";

export interface QueuedAiTaskResult {
  accepted?: boolean;
  queued?: boolean;
  id?: string;
  message?: string;
}

export interface QueuedAiTaskNoticeOptions {
  title?: string;
  fallbackMessage?: string;
}

export function unwrapAiTaskResult<T = any>(result: any): T {
  return (result?.data ?? result) as T;
}

export function isQueuedAiTaskResult(result: any): boolean {
  const payload = unwrapAiTaskResult<QueuedAiTaskResult>(result);
  return Boolean(payload?.accepted || payload?.queued);
}

export function notifyQueuedAiTask(result: any, options?: QueuedAiTaskNoticeOptions) {
  const payload = unwrapAiTaskResult<QueuedAiTaskResult>(result);

  ElNotification({
    type: "info",
    title: options?.title || "AI生成任务已提交",
    message:
      payload?.message || options?.fallbackMessage || "正在处理中，完成后会通过消息中心通知结果",
  });

  return payload;
}
