import request from "@/config/axios";

export interface McpToolParameter {
  name: string;
  label?: string;
  description: string;
  type: string | string[];
  required: boolean;
  default?: any;
  enum?: any[];
  example?: any;
  items?: Record<string, any>;
}

export interface McpToolExample {
  title: string;
  prompt: string;
  description?: string;
  input?: Record<string, any>;
}

export interface McpTool {
  name: string;
  label: string;
  description: string;
  category: string;
  categoryLabel: string;
  readOnly: boolean;
  runtime: string;
  parameters: McpToolParameter[];
  inputSchema: Record<string, any>;
  executionPolicy: {
    mode: "read_only" | "safe_write" | "confirm_required";
    requiresBrowser: boolean;
    requiresConfirmation: boolean;
    idempotent: boolean;
    riskLevel: "low" | "medium" | "high";
  };
  examples: McpToolExample[];
  tags: string[];
  metadata: {
    available: boolean;
    completenessScore: number;
  };
}

export interface McpToolCategory {
  key: string;
  label: string;
  description: string;
  toolCount: number;
  tools: McpTool[];
}

export interface McpToolListResponse {
  success: boolean;
  total: number;
  count: number;
  tools: McpTool[];
  categories: McpToolCategory[];
}

export interface McpSession {
  sessionId: string;
  user: {
    id: number;
    account: string;
    name: string;
  };
}

export interface McpLog {
  id: number;
  userId?: number;
  userName?: string;
  toolName: string;
  input?: any;
  output?: any;
  success: boolean;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

export const McpApi = {
  /**
   * 获取所有 MCP 工具
   */
  getTools: async (params?: {
    category?: string;
    readOnly?: boolean;
    riskLevel?: string;
  }) => {
    return request.get<McpToolListResponse>({
      url: "/system/mcp/tools",
      params,
    });
  },

  /**
   * 更新特定工具重写规则
   */
  updateTool: async (
    name: string,
    data: {
      enabled?: boolean;
      confirmRequired?: boolean;
      riskLevel?: "low" | "medium" | "high";
    },
  ) => {
    return request.patch({
      url: `/system/mcp/tools/${name}`,
      data,
    });
  },

  /**
   * 获取活跃 MCP SSE 会话
   */
  getSessions: async () => {
    return request.get<{ success: boolean; total: number; list: McpSession[] }>({
      url: "/system/mcp/sessions",
    });
  },

  /**
   * 获取 MCP 审计日志记录
   */
  getLogs: async (params?: {
    page?: number;
    pageSize?: number;
    userName?: string;
    toolName?: string;
  }) => {
    return request.get<{
      success: boolean;
      list: McpLog[];
      total: number;
      page: number;
      pageSize: number;
    }>({
      url: "/system/mcp/logs",
      params,
    });
  },
};
