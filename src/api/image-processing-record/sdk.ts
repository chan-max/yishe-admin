import { createImageProcessingRecord, getImageProcessingMeta } from "./index";

export interface ProgrammaticProcessImageOptions {
  imageUrl: string;
  operations?: Array<{ type: string; params?: Record<string, any> }>;
  taskType?: "process" | "variations";
  title?: string;
  processorId?: string;
  sourceModule?: string;
  sourceRecordId?: string;
  sourceName?: string;
}

/**
 * 编程式 SDK 方法：供 AI Agent、自动化脚本或前端代码无界面调用图片处理能力
 */
export async function executeImageProcessingPlan(options: ProgrammaticProcessImageOptions) {
  const taskType = options.taskType || (options.operations?.length ? "process" : "variations");
  const operationsJson = options.operations ? JSON.stringify(options.operations, null, 2) : undefined;

  const payload = {
    imageUrl: options.imageUrl,
    taskType,
    title: options.title || `AI 自动生成 - ${new Date().toLocaleString()}`,
    processorId: options.processorId || "imagemagick",
    operationsJson,
    sourceModule: options.sourceModule || "ai-agent",
    sourceRecordId: options.sourceRecordId,
    sourceName: options.sourceName || "AI 编程调用",
  };

  return await createImageProcessingRecord(payload);
}

/**
 * 编程式 SDK 演示方法：用 4 张不同风光/艺术/人像图片一键发起 4 组真实图片处理任务
 */
export async function triggerSampleImageProcessingTests() {
  const samples: ProgrammaticProcessImageOptions[] = [
    {
      title: "示例 1 - 1080p高清风光+品牌水印",
      imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200",
      operations: [
        { type: "resize", params: { width: 1080, height: 1080, maintainAspectRatio: true } },
        { type: "watermark", params: { type: "text", text: "衣设 Yishe 艺术", position: "bottom-right", fontSize: 26, color: "#FFFFFF" } },
      ],
    },
    {
      title: "示例 2 - 艺术油画晶格 Lowpoly+锐化",
      imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000",
      operations: [
        { type: "lowpoly", params: { pointCount: 850, edgeBias: 0.65 } },
        { type: "sharpen", params: { radius: 1, amount: 1 } },
      ],
    },
    {
      title: "示例 3 - 复古怀旧棕褐滤镜+无损PNG",
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000",
      operations: [
        { type: "sepia", params: { intensity: 80 } },
        { type: "convert", params: { format: "png", quality: 95 } },
      ],
    },
    {
      title: "示例 4 - 黑白高级灰度+柔和高斯模糊",
      imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1000",
      operations: [
        { type: "grayscale", params: { intensity: 100 } },
        { type: "blur", params: { radius: 3, sigma: 3 } },
      ],
    },
  ];

  const results = [];
  for (const sample of samples) {
    const res = await executeImageProcessingPlan(sample);
    results.push(res);
  }
  return results;
}

/**
 * 编程式 SDK 方法：查询当前系统支持的全量图片算子元数据
 */
export async function fetchSupportedImageMeta() {
  return await getImageProcessingMeta();
}
