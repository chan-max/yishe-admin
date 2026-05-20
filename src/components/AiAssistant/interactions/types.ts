/** 交互类型统一定义 — 对应 LangGraph interrupt payload */

export type InteractionType =
  | "confirm"
  | "choice"
  | "form"
  | "feedback"
  | "input"
  | "clarify"
  | "impact_preview"
  | "plan_edit"
  | "compare"
  | "step_form";

/** 通用选项 */
export interface InteractionOption {
  label: string;
  value: string;
  description?: string;
}

/** 通用表单字段 */
export interface InteractionField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: Array<string | Record<string, any>>;
}

/** 预览行 — impact_preview 用 */
export interface PreviewRow {
  label: string;
  value: string;
  /** positive / negative / neutral */
  tone?: "positive" | "negative" | "neutral";
}

/** 计划步骤 — plan_edit 用 */
export interface PlanStep {
  id: string;
  label: string;
  description?: string;
  status?: "pending" | "running" | "done" | "skipped";
  editable?: boolean;
  removable?: boolean;
}

/** 对比选项 — compare 用 */
export interface CompareOption {
  id: string;
  title: string;
  description?: string;
  preview?: string;
  tags?: string[];
  meta?: Record<string, any>;
}

/** 渐进式表单步骤 — step_form 用 */
export interface StepFormStep {
  title: string;
  description?: string;
  fields: InteractionField[];
}

/** 完整的 interrupt payload 结构 */
export interface InteractionPayload {
  type: InteractionType;
  runId: string;
  question: string;
  tool?: string;
  toolName?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: any;
  riskLevel?: string;

  // choice / feedback
  options?: Array<string | Record<string, any>>;
  multiple?: boolean;

  // form / step_form
  fields?: Array<Record<string, any>>;

  // impact_preview
  preview?: {
    summary?: string;
    rows?: PreviewRow[];
    riskLevel?: "low" | "medium" | "high";
  };

  // plan_edit
  plan?: {
    steps: PlanStep[];
    editable?: boolean;
  };

  // compare
  compare?: {
    options: CompareOption[];
    multiSelect?: boolean;
  };

  // step_form
  steps?: StepFormStep[];

  // 通用扩展
  input?: Record<string, any>;
  metadata?: Record<string, any>;
}

/** 提交结果 */
export interface InteractionSubmitResult {
  confirmed: boolean;
  input: Record<string, any>;
  reason?: string;
}
