import type { TemuRegionKey } from "@/api/external/toolkit/temu";

export interface TemuFieldOption {
  label: string;
  value: string | number;
}

export interface TemuActionField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "json" | "array-number" | "array-string";
  required?: boolean;
  placeholder?: string;
  hint?: string;
  rows?: number;
  defaultValue?: any;
  options?: TemuFieldOption[];
}

export interface TemuActionPreset {
  fields: TemuActionField[];
  note?: string;
  buildPayload: (parsed: Record<string, any>, profileId: string) => Record<string, any>;
}

export interface TemuFormSeedAction {
  key: string;
  label: string;
  description: string;
  patch: Record<string, any>;
}

export interface TemuInsightCard {
  key: string;
  label: string;
  value: string;
  tone?: "default" | "accent" | "success" | "warning";
}

export interface TemuFeedbackNotice {
  key: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
}

export interface TemuIndexedCatalogAction {
  key: string;
  label: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST";
  regionHints: TemuRegionKey[];
  status: "available" | "planned";
  groupKey: string;
  groupLabel: string;
}

export const TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY =
  "temu-publish-detail-request-capture";

export const REGION_LABELS: Record<TemuRegionKey, string> = {
  global: "全球站",
  us: "美国站",
  eu: "欧区站",
  seller: "卖家中心",
};

export const QUICK_ACTION_KEYS = [
  "goods.list",
  "goods.detail",
  "activity.list",
  "finance.history",
  "goods.adjust-price.list",
  "jit.list-all",
  "goods.category-search",
] as const;

export const NEXT_ACTION_MAP: Record<string, string[]> = {
  "activity.list": ["activity.match"],
  "activity.filter": ["activity.match"],
  "activity.match": ["activity.generate-payload"],
  "activity.generate-payload": ["activity.merge-payloads", "activity.submit"],
  "activity.merge-payloads": ["activity.submit"],
  "finance.history": ["finance.download", "finance.direct-url"],
  "goods.category-search": ["goods.expected-place.list"],
  "goods.expected-place.list": ["goods.expected-place.update"],
  "goods.adjust-price.list": ["goods.adjust-price.reject"],
  "goods.lifecycle": ["jit.open", "jit.stock.update"],
  "jit.list": ["jit.open", "jit.stock.update"],
  "jit.list-all": ["jit.open", "jit.stock.update"],
  "compliance.page-query": ["compliance.detail"],
  "compliance.detail": ["compliance.submit"],
};

const createRegionField = (defaultValue: TemuRegionKey = "global"): TemuActionField => ({
  key: "region",
  label: "区域",
  type: "select",
  defaultValue,
  hint: "优先使用该区域会话；若该区域会话不完整，后端会尽量回退到全球站会话。",
});

const buildProfilePayload = (parsed: Record<string, any>, profileId: string) => ({
  profileId,
  ...parsed,
});

const buildProfileRegionPayload = (parsed: Record<string, any>, profileId: string) => ({
  profileId,
  region: (parsed.region as TemuRegionKey) || "global",
  ...Object.fromEntries(Object.entries(parsed).filter(([key]) => key !== "region")),
});

export const ACTION_PRESETS: Record<string, TemuActionPreset> = {
  [TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY]: {
    fields: [
      {
        key: "spuId",
        label: "SPU ID",
        type: "text",
        required: true,
        placeholder: "请输入 spuId",
        hint: "会进入商品发布详情页，自动点击“提交”，并返回商品发布模板 product/edit 请求里的 POST 参数。",
      },
    ],
    note: "当前动作会在客户端浏览器环境中执行，用于根据商品 spuId 获取商品发布模板请求里的 POST 参数。",
    buildPayload: buildProfilePayload,
  },
  "goods.list": {
    fields: [
      createRegionField(),
      { key: "page", label: "页码", type: "number", defaultValue: 1 },
      { key: "pageSize", label: "每页数量", type: "number", defaultValue: 20 },
      { key: "skcTopStatus", label: "在售状态", type: "number", placeholder: "例如 100" },
      {
        key: "skcIdList",
        label: "SKC ID 列表",
        type: "array-number",
        hint: "支持换行、逗号、中文逗号分隔",
      },
      { key: "spuIdList", label: "SPU ID 列表", type: "array-number" },
      { key: "skuIdList", label: "SKU ID 列表", type: "array-number" },
      { key: "catIdList", label: "类目 ID 列表", type: "array-number" },
    ],
    note: "默认查询前 20 条，可按 SKC / SPU / SKU / 类目组合筛选。",
    buildPayload: buildProfileRegionPayload,
  },
  "goods.detail": {
    fields: [
      createRegionField(),
      {
        key: "productId",
        label: "SPU ID",
        type: "number",
        required: true,
        placeholder: "请输入 productId / SPU ID",
        hint: "接口地址为 /visage-agent-seller/product/query，按 productId 查询。",
      },
    ],
    note: "适合在拿到 SPU 之后，继续查看单个商品的完整详情原始返回。",
    buildPayload: buildProfileRegionPayload,
  },
  "goods.lifecycle": {
    fields: [
      createRegionField(),
      {
        key: "mode",
        label: "查询模式",
        type: "select",
        defaultValue: "default",
        options: [
          { label: "默认上新/异常核价", value: "default" },
          { label: "按 SPU 搜索 SKC", value: "search_skc_id" },
          { label: "JIT 模式", value: "jit" },
        ],
      },
      { key: "pageNum", label: "页码", type: "number", defaultValue: 1 },
      { key: "pageSize", label: "每页数量", type: "number", defaultValue: 100 },
      { key: "spuIdList", label: "SPU ID 列表", type: "array-number" },
      { key: "supplierTodoTypeList", label: "待办类型列表", type: "array-number" },
      { key: "secondarySelectStatusList", label: "次级状态列表", type: "array-number" },
      {
        key: "timeType",
        label: "时间类型",
        type: "number",
        placeholder: "1 创建时间 / 2 更新时间",
      },
      { key: "timeBegin", label: "开始时间戳", type: "number" },
      { key: "timeEnd", label: "结束时间戳", type: "number" },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "activity.list": {
    fields: [createRegionField()],
    buildPayload: buildProfileRegionPayload,
  },
  "activity.filter": {
    fields: [
      createRegionField(),
      {
        key: "activityTypes",
        label: "活动类型列表",
        type: "array-number",
        hint: "传 10000001 时会附带专题活动",
      },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "activity.match": {
    fields: [
      createRegionField(),
      { key: "activityType", label: "活动类型", type: "number", defaultValue: 5 },
      { key: "activityThematicId", label: "专题活动 ID", type: "number" },
      { key: "searchScrollContext", label: "滚动上下文", type: "textarea", rows: 2 },
      { key: "spuIdList", label: "SPU ID 列表", type: "array-number" },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "activity.generate-payload": {
    fields: [
      { key: "activityType", label: "活动类型", type: "number", required: true },
      { key: "activityThematicId", label: "专题活动 ID", type: "number" },
      { key: "stockThreshold", label: "活动库存阈值", type: "number" },
      {
        key: "productInfo",
        label: "商品信息 JSON",
        type: "json",
        required: true,
        rows: 10,
        hint: "传 activity.match 返回里的单个 product 结构",
      },
    ],
    buildPayload: (parsed) => parsed,
  },
  "activity.merge-payloads": {
    fields: [
      { key: "activityType", label: "活动类型", type: "number", required: true },
      { key: "activityThematicId", label: "专题活动 ID", type: "number" },
      {
        key: "payloadList",
        label: "payload 列表 JSON",
        type: "json",
        required: true,
        rows: 10,
      },
    ],
    buildPayload: (parsed) => parsed,
  },
  "activity.submit": {
    fields: [
      createRegionField(),
      {
        key: "payload",
        label: "提交 payload",
        type: "json",
        required: true,
        rows: 10,
      },
    ],
    note: "通常与“活动匹配列表”和“生成报名 payload”联动使用。",
    buildPayload: buildProfileRegionPayload,
  },
  "finance.history": {
    fields: [
      { key: "taskType", label: "任务类型", type: "number", required: true, defaultValue: 19 },
      { key: "pageNum", label: "页码", type: "number", defaultValue: 1 },
      { key: "pageSize", label: "每页数量", type: "number", defaultValue: 100 },
    ],
    buildPayload: buildProfilePayload,
  },
  "finance.export": {
    fields: [
      createRegionField("global"),
      { key: "queryParams", label: "queryParams JSON", type: "json", required: true, rows: 8 },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "finance.download": {
    fields: [
      createRegionField("global"),
      { key: "downloadId", label: "导出任务 ID", type: "number", required: true },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "finance.direct-url": {
    fields: [
      createRegionField("global"),
      { key: "queryParams", label: "queryParams JSON", type: "json", required: true, rows: 8 },
    ],
    buildPayload: (parsed, profileId) => ({
      profileId,
      region: parsed.region || "global",
      queryParams: parsed.queryParams,
    }),
  },
  "compliance.page-query": {
    fields: [
      createRegionField(),
      { key: "spuIdList", label: "SPU ID 列表", type: "array-number", required: true },
      { key: "pageNum", label: "页码", type: "number", defaultValue: 1 },
      { key: "pageSize", label: "每页数量", type: "number", defaultValue: 100 },
      { key: "type", label: "查询类型", type: "number", defaultValue: 2 },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "compliance.detail": {
    fields: [
      createRegionField(),
      {
        key: "detailType",
        label: "详情类型",
        type: "select",
        required: true,
        defaultValue: "template",
        options: [
          { label: "模板", value: "template" },
          { label: "详情", value: "detail" },
        ],
      },
      { key: "payload", label: "请求 JSON", type: "json", required: true, rows: 10 },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "compliance.submit": {
    fields: [
      createRegionField(),
      { key: "payload", label: "提交 payload", type: "json", required: true, rows: 10 },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "jit.list": {
    fields: [
      createRegionField(),
      { key: "spuIdList", label: "SPU ID 列表", type: "array-number" },
      { key: "startDate", label: "开始日期", type: "text", placeholder: "YYYYMMDD" },
      { key: "endDate", label: "结束日期", type: "text", placeholder: "YYYYMMDD" },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "jit.list-all": {
    fields: [
      createRegionField(),
      { key: "spuIdList", label: "SPU ID 列表", type: "array-number" },
      { key: "startDate", label: "开始日期", type: "text", placeholder: "YYYYMMDD" },
      { key: "endDate", label: "结束日期", type: "text", placeholder: "YYYYMMDD" },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "jit.open": {
    fields: [
      createRegionField(),
      {
        key: "skcSpuList",
        label: "SKC / SPU 对应 JSON",
        type: "json",
        required: true,
        rows: 8,
        hint: '格式示例：[{"skcId":60920034417,"spuId":6307893340}]',
      },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "jit.stock.update": {
    fields: [
      createRegionField(),
      { key: "skcId", label: "SKC ID", type: "number", required: true },
      { key: "finalNum", label: "目标库存", type: "number", defaultValue: 500 },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "goods.category-search": {
    fields: [
      createRegionField(),
      { key: "searchText", label: "搜索关键词", type: "text", required: true },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "goods.expected-place.list": {
    fields: [
      createRegionField(),
      {
        key: "categoryPaths",
        label: "类目路径 JSON",
        type: "json",
        rows: 8,
        hint: '格式示例：[{"cat_ids":[1,20,27],"cat_names":["宠物用品","狗狗用品类","狗用进食垫"]}]',
      },
      { key: "expectReceiveAreaConfigType", label: "目标区域类型", type: "number" },
      { key: "pageNumber", label: "页码", type: "number", defaultValue: 1 },
      { key: "pageSize", label: "每页数量", type: "number", defaultValue: 1000 },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "goods.expected-place.update": {
    fields: [
      createRegionField(),
      { key: "skcIdList", label: "SKC ID 列表", type: "array-number", required: true },
      {
        key: "exceptReceiveAreaConfigType",
        label: "设置为",
        type: "select",
        required: true,
        defaultValue: 1,
        options: [
          { label: "广东", value: 1 },
          { label: "义乌", value: 2 },
          { label: "按历史发货地推荐", value: 3 },
        ],
      },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "goods.adjust-price.list": {
    fields: [
      createRegionField(),
      { key: "pageNum", label: "页码", type: "number", defaultValue: 1 },
      { key: "orderIdList", label: "价格申报单号列表", type: "array-string" },
      { key: "skcIdList", label: "SKC ID 列表", type: "array-string" },
    ],
    buildPayload: buildProfileRegionPayload,
  },
  "goods.adjust-price.reject": {
    fields: [
      createRegionField(),
      { key: "adjustIdList", label: "adjustId 列表", type: "array-number", required: true },
      { key: "reason", label: "不调整原因", type: "text", defaultValue: "我就不调整" },
    ],
    buildPayload: buildProfileRegionPayload,
  },
};
