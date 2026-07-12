import request from "@/config/axios";

export interface ModelServiceHealth {
  key: string;
  name: string;
  available: boolean;
  baseUrl: string;
  message: string;
  timestamp: string;
}

export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface EmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    index: number;
    embedding: number[];
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// 查询模型服务健康状态
export const getModelServiceHealth = () => {
  return request.get<ModelServiceHealth>({
    url: "/external-service-health/model-service",
  });
};

// 获取模型列表
export const getModelServiceModels = () => {
  return request.get<{ object: string; data: ModelInfo[] }>({
    url: "/model-service/v1/models",
  });
};

// 测试 Embedding 生成
export const testEmbedding = (text: string) => {
  return request.post<EmbeddingResponse>({
    url: "/model-service/v1/embeddings",
    data: {
      model: "Xenova/all-MiniLM-L6-v2",
      input: text,
    },
  });
};
