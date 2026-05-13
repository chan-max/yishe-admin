interface TemuFieldMeta {
  label: string;
  description: string;
  itemFields?: Array<{ key: string; label: string }>;
}

export interface TemuTemplateSummaryItem {
  key: string;
  label: string;
  value: string;
}

export type TemuEditableValueType = "string" | "number" | "boolean" | null;

export interface TemuTemplateTreeNode {
  id: string;
  key: string;
  sourcePath: string;
  depth: number;
  label: string;
  displayKey: string;
  typeLabel: string;
  preview: string;
  description: string;
  known: boolean;
  editable: boolean;
  valueType: TemuEditableValueType;
  rawValue: string | number | boolean | null;
  children: TemuTemplateTreeNode[];
}

export interface TemuTemplateAnalysisResult {
  rawEmpty: boolean;
  status: "idle" | "success" | "error";
  statusText: string;
  error: string;
  summaryItems: TemuTemplateSummaryItem[];
  tree: TemuTemplateTreeNode[];
  unknownFieldKeys: string[];
}

const TOP_LEVEL_FIELD_META: Record<string, TemuFieldMeta> = {
  materialMultiLanguages: {
    label: "素材多语言",
    description: "图片、素材相关的多语言扩展信息。",
    itemFields: [
      { key: "language", label: "语言代码" },
      { key: "materialImgUrl", label: "素材地址" },
    ],
  },
  productName: {
    label: "商品标题",
    description: "商品默认标题，通常是 Temu 发布时最核心的标题文案。",
  },
  productI18nReqs: {
    label: "标题多语言",
    description: "不同语言下的商品标题配置。",
    itemFields: [
      { key: "productName", label: "对应语言标题" },
      { key: "language", label: "语言代码" },
    ],
  },
  productPropertyReqs: {
    label: "商品属性",
    description: "类目属性、材质、厚度、功能等基础属性列表。",
    itemFields: [
      { key: "templatePid", label: "模板属性 ID" },
      { key: "pid", label: "属性 ID" },
      { key: "propName", label: "属性名" },
      { key: "propValue", label: "属性值" },
    ],
  },
  productSkcReqs: {
    label: "SKC 列表",
    description: "商品款式维度，每个 SKC 下可以再挂多个 SKU。",
    itemFields: [
      { key: "previewImgUrls", label: "SKC 预览图" },
      { key: "extCode", label: "外部编码" },
      { key: "productSkuReqs", label: "SKU 列表" },
      { key: "isBasePlate", label: "是否底板" },
    ],
  },
  productSpecPropertyReqs: {
    label: "规格属性",
    description: "规格值定义，例如尺寸、颜色、版本等。",
    itemFields: [
      { key: "parentSpecName", label: "规格组名" },
      { key: "specName", label: "规格名" },
      { key: "propValue", label: "展示值" },
    ],
  },
  carouselImageUrls: {
    label: "轮播图",
    description: "商品详情页主轮播图列表。",
  },
  carouselImageI18nReqs: {
    label: "轮播图多语言",
    description: "轮播图在不同语言场景下的扩展信息。",
  },
  materialImgUrl: {
    label: "素材主图",
    description: "商品素材主图，一般作为主展示图或源图引用。",
  },
  goodsLayerDecorationReqs: {
    label: "图层装饰",
    description: "商品图层装饰、贴纸、额外视觉配置。",
  },
  goodsLayerDecorationCustomizeI18nReqs: {
    label: "图层装饰多语言",
    description: "图层装饰文案的多语言配置。",
  },
  sizeTemplateIds: {
    label: "尺码模板",
    description: "绑定的尺码模板 ID 列表。",
  },
  showSizeTemplateIds: {
    label: "展示尺码模板",
    description: "前台展示的尺码模板 ID 列表。",
  },
  goodsModelReqs: {
    label: "3D资源",
    description: "3D资源或展示模型相关配置。",
  },
  productWhExtAttrReq: {
    label: "仓储扩展属性",
    description: "发货地、原产地等仓储/物流相关信息。",
    itemFields: [
      { key: "outerGoodsUrl", label: "外部商品链接" },
      { key: "productOrigin", label: "商品原产地" },
    ],
  },
  productCarouseVideoReqList: {
    label: "轮播视频",
    description: "商品轮播区域使用的视频配置。",
  },
  goodsAdvantageLabelTypes: {
    label: "卖点标签",
    description: "商品卖点标签类型列表。",
  },
  productDetailVideoReqList: {
    label: "详情视频",
    description: "商品详情页视频配置。",
  },
  productOuterPackageImageReqs: {
    label: "外包装图片",
    description: "商品外包装图片列表。",
    itemFields: [{ key: "imageUrl", label: "图片地址" }],
  },
  productOuterPackageReq: {
    label: "外包装配置",
    description: "商品外包装形态和包装类型。",
    itemFields: [
      { key: "packageShape", label: "包装形状" },
      { key: "packageType", label: "包装类型" },
    ],
  },
  sensitiveTransNormalFileReqs: {
    label: "敏感文件",
    description: "敏感品类或普通文件声明列表。",
  },
  productGuideFileNewReqList: {
    label: "说明书文件",
    description: "产品说明书、指南文件列表。",
  },
  productGuideFileI18nReqs: {
    label: "说明书多语言",
    description: "产品说明书多语言配置。",
  },
  productSaleExtAttrReq: {
    label: "销售扩展属性",
    description: "销售侧扩展属性，例如适用人群、体型等。",
  },
  productNonAuditExtAttrReq: {
    label: "非审核扩展属性",
    description: "非审核类扩展字段，例如 California 65 警告信息。",
  },
  personalizationSwitch: {
    label: "个性化开关",
    description: "是否开启个性化/定制能力。",
  },
  productComplianceStatementReq: {
    label: "合规声明",
    description: "平台要求的合规协议版本和协议地址。",
    itemFields: [
      { key: "protocolVersion", label: "协议版本" },
      { key: "protocolUrl", label: "协议地址" },
    ],
  },
  productOriginCertFileReqs: {
    label: "原产地证明",
    description: "原产地证书文件列表。",
  },
  productId: {
    label: "商品 ID",
    description: "Temu 商品 ID，已有商品更新或回显时常见。",
  },
};

const NESTED_FIELD_META: Record<string, TemuFieldMeta> = {
  templatePid: { label: "模板属性 ID", description: "类目模板里的属性 ID。" },
  pid: { label: "属性 ID", description: "平台属性 ID。" },
  refPid: { label: "引用属性 ID", description: "引用或映射使用的属性 ID。" },
  propName: { label: "属性名", description: "属性展示名称。" },
  vid: { label: "属性值 ID", description: "属性值对应的 ID。" },
  propValue: { label: "属性值", description: "属性的实际展示值。" },
  valueUnit: { label: "单位", description: "数值型属性单位。" },
  valueExtendInfo: { label: "扩展值", description: "属性扩展信息。" },
  numberInputValue: { label: "数值输入", description: "数值型属性的录入值。" },
  previewImgUrls: { label: "预览图", description: "当前层级关联的预览图列表。" },
  extCode: { label: "外部编码", description: "业务侧自定义外部编码。" },
  mainProductSkuSpecReqs: { label: "主规格", description: "主商品规格信息。" },
  productSkuReqs: { label: "SKU 列表", description: "SKC 下的具体 SKU 集合。" },
  thumbUrl: { label: "缩略图", description: "SKU 缩略图地址。" },
  supplierPrice: { label: "供货价", description: "供货价，通常是分为单位的整数。" },
  currencyType: { label: "币种", description: "价格使用的币种。" },
  productSkuSpecReqs: { label: "SKU 规格", description: "SKU 具体规格值列表。" },
  productSkuId: { label: "SKU ID", description: "平台 SKU ID。" },
  productSkuWhExtAttrReq: { label: "仓储扩展", description: "SKU 的仓储/物流扩展属性。" },
  productSkuVolumeReq: { label: "体积信息", description: "SKU 包装尺寸。" },
  len: { label: "长度", description: "包装长度。" },
  width: { label: "宽度", description: "包装宽度。" },
  height: { label: "高度", description: "包装高度。" },
  productSkuWeightReq: { label: "重量信息", description: "SKU 重量信息。" },
  value: { label: "值", description: "当前字段的数值内容。" },
  productSkuBarCodeReqs: { label: "条码", description: "SKU 条码列表。" },
  productSkuSensitiveAttrReq: { label: "敏感属性", description: "敏感品信息。" },
  isSensitive: { label: "是否敏感", description: "是否属于敏感品。" },
  sensitiveList: { label: "敏感项", description: "敏感项列表。" },
  productSkuSensitiveLimitReq: { label: "敏感限制", description: "敏感品限制信息。" },
  productSkuMultiPackReq: { label: "多包装", description: "多件装配置。" },
  skuClassification: { label: "SKU 分类", description: "SKU 分类类型。" },
  numberOfPieces: { label: "件数", description: "包装中的件数。" },
  pieceUnitCode: { label: "件单位", description: "件数单位编码。" },
  productSkuNetContentReq: { label: "净含量", description: "净含量配置。" },
  totalNetContent: { label: "总净含量", description: "总净含量配置。" },
  mixedType: { label: "混装类型", description: "混装类型配置。" },
  individuallyPacked: { label: "独立包装", description: "是否独立包装。" },
  productSkuAccessoriesReq: { label: "配件配置", description: "SKU 配件配置。" },
  productSkuAccessories: { label: "配件列表", description: "SKU 配件列表。" },
  productSkuNonAuditExtAttrReq: { label: "非审核扩展", description: "SKU 非审核扩展属性。" },
  productSkcId: { label: "SKC ID", description: "平台 SKC ID。" },
  isBasePlate: { label: "是否底板", description: "当前款式是否为底板。" },
  parentSpecId: { label: "规格组 ID", description: "规格组 ID。" },
  parentSpecName: { label: "规格组名", description: "规格组名称。" },
  specId: { label: "规格 ID", description: "规格值 ID。" },
  specName: { label: "规格名", description: "规格值名称。" },
  valueGroupId: { label: "值分组 ID", description: "值分组 ID。" },
  valueGroupName: { label: "值分组名", description: "值分组名称。" },
  imageUrl: { label: "图片地址", description: "图片 URL。" },
  packageShape: { label: "包装形状", description: "包装形状类型。" },
  packageType: { label: "包装类型", description: "包装类型。" },
  outerGoodsUrl: { label: "外部商品链接", description: "站外商品链接。" },
  productOrigin: { label: "原产地", description: "商品原产地信息。" },
  countryShortName: { label: "国家简称", description: "原产地国家简称。" },
  region2Id: { label: "地区 ID", description: "原产地区域 ID。" },
  protocolVersion: { label: "协议版本", description: "合规协议版本。" },
  protocolUrl: { label: "协议地址", description: "合规协议链接。" },
  california65WarningInfoReq: { label: "65 警告", description: "California 65 警告信息。" },
  california65WarningType: { label: "警告类型", description: "65 警告类型。" },
  california65ChemicalNames: { label: "化学品名称", description: "警告涉及的化学品名称。" },
  cosmeticInfoReq: { label: "化妆品信息", description: "化妆品相关扩展信息。" },
  productName: { label: "商品标题", description: "当前层级的标题文本。" },
  language: { label: "语言", description: "语言代码。" },
};

const MAX_TREE_DEPTH = 12;

function isPlainRecord(value: unknown): value is Record<string, any> {
  return !!value && Object.prototype.toString.call(value) === "[object Object]";
}

function toSerializablePlainObject(value: unknown): Record<string, any> | null {
  if (!isPlainRecord(value)) {
    return null;
  }

  try {
    const normalized = JSON.parse(JSON.stringify(value));
    return isPlainRecord(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

function parseJsObjectLiteral(raw: string): Record<string, any> | null {
  try {
    const evaluated = new Function(`"use strict"; return (${raw});`)();
    return toSerializablePlainObject(evaluated);
  } catch {
    return null;
  }
}

export function normalizeTemuProductTemplate(input: unknown): Record<string, any> | null {
  if (isPlainRecord(input)) {
    return toSerializablePlainObject(input);
  }

  if (!input || typeof input !== "string") {
    return null;
  }

  const raw = input.trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return toSerializablePlainObject(parsed);
  } catch {
    return parseJsObjectLiteral(raw);
  }
}

function resolveTemuFieldMeta(
  key: string,
  options: { topLevel?: boolean } = {},
): { meta: TemuFieldMeta; known: boolean } {
  if (/^cat(\d+)Id$/.test(key)) {
    const level = Number(key.match(/^cat(\d+)Id$/)?.[1] || 0);
    return {
      meta: {
        label: `类目 ${level} ID`,
        description: `类目路径第 ${level} 层的类目 ID。0 一般表示当前层未使用。`,
      },
      known: true,
    };
  }

  const meta = options.topLevel
    ? TOP_LEVEL_FIELD_META[key]
    : NESTED_FIELD_META[key] || TOP_LEVEL_FIELD_META[key];
  if (meta) {
    return { meta, known: true };
  }

  return {
    meta: {
      label: key,
      description: "当前字段暂未收录中文说明，初版先按原始字段名展示。",
    },
    known: false,
  };
}

function truncateText(value: string, maxLength = 72) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function formatScalarPreview(value: unknown) {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${truncateText(value.trim() || "(空字符串)", 48)}"`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return Object.prototype.toString.call(value);
}

function summarizeValue(value: unknown): { typeLabel: string; summary: string } {
  if (Array.isArray(value)) {
    if (!value.length) {
      return { typeLabel: "数组", summary: "数组，当前 0 项" };
    }

    const firstMeaningful = value.find((item) => item !== null && item !== undefined);
    const recordKeys = isPlainRecord(firstMeaningful)
      ? Object.keys(firstMeaningful).slice(0, 4)
      : [];
    const urlCount = value.filter(
      (item) => typeof item === "string" && /^https?:\/\//i.test(String(item).trim()),
    ).length;

    if (recordKeys.length) {
      return {
        typeLabel: "数组",
        summary: `数组，共 ${value.length} 项；首项字段：${recordKeys.join("、")}`,
      };
    }

    if (urlCount > 0) {
      return {
        typeLabel: "数组",
        summary: `数组，共 ${value.length} 项；其中 URL ${urlCount} 项`,
      };
    }

    return {
      typeLabel: "数组",
      summary: `数组，共 ${value.length} 项；示例值：${formatScalarPreview(firstMeaningful)}`,
    };
  }

  if (isPlainRecord(value)) {
    const keys = Object.keys(value);
    return {
      typeLabel: "对象",
      summary: keys.length
        ? `对象，包含 ${keys.length} 个键：${keys.slice(0, 5).join("、")}${keys.length > 5 ? " 等" : ""}`
        : "对象，当前为空对象",
    };
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return {
      typeLabel: "文本",
      summary: trimmed
        ? `文本，${trimmed.length} 个字符：${truncateText(trimmed)}`
        : "文本，当前为空字符串",
    };
  }

  if (typeof value === "number") {
    return { typeLabel: "数值", summary: `数值：${value}` };
  }

  if (typeof value === "boolean") {
    return { typeLabel: "布尔", summary: `布尔值：${value ? "true" : "false"}` };
  }

  if (value === null) {
    return { typeLabel: "空值", summary: "当前为 null" };
  }

  return {
    typeLabel: "未知",
    summary: `当前值类型：${Object.prototype.toString.call(value)}`,
  };
}

function buildChildHints(meta: TemuFieldMeta) {
  return (meta.itemFields || []).map((item) => `${item.label}（${item.key}）`);
}

function countSkuItems(template: Record<string, any>) {
  const skcList = Array.isArray(template.productSkcReqs) ? template.productSkcReqs : [];
  return skcList.reduce((total, item) => {
    const skuList = Array.isArray(item?.productSkuReqs) ? item.productSkuReqs : [];
    return total + skuList.length;
  }, 0);
}

function buildSummaryItems(template: Record<string, any>): TemuTemplateSummaryItem[] {
  return [
    {
      key: "top-level",
      label: "顶层字段",
      value: String(Object.keys(template).length),
    },
    {
      key: "properties",
      label: "商品属性",
      value: String(
        Array.isArray(template.productPropertyReqs) ? template.productPropertyReqs.length : 0,
      ),
    },
    {
      key: "skc",
      label: "SKC 数",
      value: String(Array.isArray(template.productSkcReqs) ? template.productSkcReqs.length : 0),
    },
    {
      key: "sku",
      label: "SKU 数",
      value: String(countSkuItems(template)),
    },
    {
      key: "specs",
      label: "规格值数",
      value: String(
        Array.isArray(template.productSpecPropertyReqs)
          ? template.productSpecPropertyReqs.length
          : 0,
      ),
    },
    {
      key: "carousel",
      label: "轮播图数",
      value: String(
        Array.isArray(template.carouselImageUrls) ? template.carouselImageUrls.length : 0,
      ),
    },
  ];
}

function buildArrayItemLabel(value: Record<string, any>, index: number) {
  const markers = [
    value?.specName,
    value?.propName,
    value?.propValue,
    value?.productName,
    value?.language,
    value?.extCode,
    value?.imageUrl,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return markers[0] ? `第 ${index + 1} 项 · ${truncateText(markers[0], 28)}` : `第 ${index + 1} 项`;
}

function resolveEditableValueType(value: unknown): TemuEditableValueType {
  if (typeof value === "string") {
    return "string";
  }
  if (typeof value === "number") {
    return "number";
  }
  if (typeof value === "boolean") {
    return "boolean";
  }
  return null;
}

function buildTreeNode(
  value: unknown,
  options: {
    path: string;
    key: string;
    displayKey: string;
    depth: number;
    labelOverride?: string;
    topLevel?: boolean;
  },
): TemuTemplateTreeNode {
  const { meta, known } = resolveTemuFieldMeta(options.key, { topLevel: options.topLevel });
  const summary = summarizeValue(value);
  const label = options.labelOverride || meta.label;

  if (options.depth >= MAX_TREE_DEPTH) {
    return {
      id: options.path,
      key: options.key,
      sourcePath: options.path,
      label,
      displayKey: options.displayKey,
      typeLabel: summary.typeLabel,
      preview: summary.summary,
      description: meta.description,
      known,
      depth: options.depth,
      editable: false,
      valueType: null,
      rawValue: null,
      children: [],
    };
  }

  if (Array.isArray(value)) {
    const children: TemuTemplateTreeNode[] = [];
    value.forEach((item, index) => {
      const childPath = `${options.path}[${index}]`;
      if (isPlainRecord(item)) {
        children.push(
          buildTreeNode(item, {
            path: childPath,
            key: options.key,
            displayKey: `[${index}]`,
            depth: options.depth + 1,
            labelOverride: buildArrayItemLabel(item, index),
          }),
        );
        return;
      }

      children.push({
        id: childPath,
        key: options.key,
        sourcePath: childPath,
        label: `第 ${index + 1} 项`,
        displayKey: `[${index}]`,
        typeLabel: "值",
        preview: formatScalarPreview(item),
        description: "",
        known: true,
        depth: options.depth + 1,
        editable: resolveEditableValueType(item) !== null,
        valueType: resolveEditableValueType(item),
        rawValue:
          typeof item === "string" || typeof item === "number" || typeof item === "boolean"
            ? item
            : null,
        children: [],
      });
    });

    const childHints = buildChildHints(meta);
    const preview = childHints.length
      ? `${summary.summary}；常见字段：${childHints.slice(0, 4).join("、")}`
      : summary.summary;

    return {
      id: options.path,
      key: options.key,
      sourcePath: options.path,
      label,
      displayKey: options.displayKey,
      typeLabel: summary.typeLabel,
      preview,
      description: meta.description,
      known,
      depth: options.depth,
      editable: false,
      valueType: null,
      rawValue: null,
      children,
    };
  }

  if (isPlainRecord(value)) {
    const entries = Object.entries(value);
    const children = entries.map(([childKey, childValue]) =>
      buildTreeNode(childValue, {
        path: `${options.path}.${childKey}`,
        key: childKey,
        displayKey: childKey,
        depth: options.depth + 1,
      }),
    );

    return {
      id: options.path,
      key: options.key,
      sourcePath: options.path,
      label,
      displayKey: options.displayKey,
      typeLabel: summary.typeLabel,
      preview: summary.summary,
      description: meta.description,
      known,
      depth: options.depth,
      editable: false,
      valueType: null,
      rawValue: null,
      children,
    };
  }

  const valueType = resolveEditableValueType(value);

  return {
    id: options.path,
    key: options.key,
    sourcePath: options.path,
    depth: options.depth,
    label,
    displayKey: options.displayKey,
    typeLabel: summary.typeLabel,
    preview: formatScalarPreview(value),
    description: meta.description,
    known,
    editable: valueType !== null,
    valueType,
    rawValue:
      typeof value === "string" || typeof value === "number" || typeof value === "boolean"
        ? value
        : null,
    children: [],
  };
}

function collectUnknownFieldKeys(nodes: TemuTemplateTreeNode[]): string[] {
  const collected = new Set<string>();

  const visit = (items: TemuTemplateTreeNode[]) => {
    items.forEach((item) => {
      if (!item.known && item.key && item.key !== "__overflow__") {
        collected.add(item.key);
      }
      if (item.children.length) {
        visit(item.children);
      }
    });
  };

  visit(nodes);
  return Array.from(collected);
}

function parseTemuSourcePath(path: string): Array<string | number> {
  const tokens: Array<string | number> = [];
  const matcher = /([^.[\]]+)|\[(\d+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(path))) {
    if (match[1]) {
      tokens.push(match[1]);
    } else if (match[2]) {
      tokens.push(Number(match[2]));
    }
  }

  return tokens;
}

function setValueByPath(
  target: Record<string, any> | any[],
  pathTokens: Array<string | number>,
  value: string | number | boolean,
) {
  let cursor: any = target;

  for (let index = 0; index < pathTokens.length - 1; index += 1) {
    const token = pathTokens[index];
    const nextToken = pathTokens[index + 1];

    if (cursor[token] === undefined || cursor[token] === null) {
      cursor[token] = typeof nextToken === "number" ? [] : {};
    }

    cursor = cursor[token];
  }

  const lastToken = pathTokens[pathTokens.length - 1];
  cursor[lastToken] = value;
}

export function updateTemuProductTemplateValue(
  input: unknown,
  sourcePath: string,
  value: string | number | boolean,
): string | null {
  const normalized = normalizeTemuProductTemplate(input);
  if (!normalized) {
    return null;
  }

  const pathTokens = parseTemuSourcePath(sourcePath);
  if (!pathTokens.length) {
    return null;
  }

  const cloned = JSON.parse(JSON.stringify(normalized));
  setValueByPath(cloned, pathTokens, value);
  return JSON.stringify(cloned, null, 2);
}

function createDefaultArrayItemValue(arrayValue: unknown[]) {
  const sample = arrayValue.find((item) => item !== null && item !== undefined);
  if (isPlainRecord(sample)) {
    return Object.keys(sample).reduce<Record<string, any>>((acc, key) => {
      const sampleValue = sample[key];
      if (Array.isArray(sampleValue)) acc[key] = [];
      else if (isPlainRecord(sampleValue)) acc[key] = {};
      else if (typeof sampleValue === "number") acc[key] = 0;
      else if (typeof sampleValue === "boolean") acc[key] = false;
      else acc[key] = "";
      return acc;
    }, {});
  }
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;
  if (Array.isArray(sample)) return [];
  return "";
}

function getValueByPath(target: Record<string, any> | any[], pathTokens: Array<string | number>) {
  let cursor: any = target;
  for (const token of pathTokens) {
    if (cursor === undefined || cursor === null) {
      return undefined;
    }
    cursor = cursor[token];
  }
  return cursor;
}

export function addTemuProductTemplateArrayItem(input: unknown, sourcePath: string): string | null {
  const normalized = normalizeTemuProductTemplate(input);
  if (!normalized) return null;
  const pathTokens = parseTemuSourcePath(sourcePath);
  const cloned = JSON.parse(JSON.stringify(normalized));
  const arrayValue = getValueByPath(cloned, pathTokens);
  if (!Array.isArray(arrayValue)) return null;
  arrayValue.push(createDefaultArrayItemValue(arrayValue));
  return JSON.stringify(cloned, null, 2);
}

export function removeTemuProductTemplateArrayItem(
  input: unknown,
  sourcePath: string,
  index: number,
): string | null {
  const normalized = normalizeTemuProductTemplate(input);
  if (!normalized) return null;
  const pathTokens = parseTemuSourcePath(sourcePath);
  const cloned = JSON.parse(JSON.stringify(normalized));
  const arrayValue = getValueByPath(cloned, pathTokens);
  if (!Array.isArray(arrayValue) || index < 0 || index >= arrayValue.length) return null;
  arrayValue.splice(index, 1);
  return JSON.stringify(cloned, null, 2);
}

export function analyzeTemuProductTemplate(input: unknown): TemuTemplateAnalysisResult {
  const rawText = typeof input === "string" ? input.trim() : "";
  if (!rawText) {
    return {
      rawEmpty: true,
      status: "idle",
      statusText: "待输入",
      error: "",
      summaryItems: [],
      tree: [],
      unknownFieldKeys: [],
    };
  }

  const normalized = normalizeTemuProductTemplate(input);
  if (!normalized) {
    return {
      rawEmpty: false,
      status: "error",
      statusText: "解析失败",
      error: "当前内容不是合法的 JSON 或 JS 对象字面量，暂时无法解析字段说明。",
      summaryItems: [],
      tree: [],
      unknownFieldKeys: [],
    };
  }

  const tree = Object.entries(normalized).map(([key, value]) =>
    buildTreeNode(value, {
      path: key,
      key,
      displayKey: key,
      depth: 0,
      topLevel: true,
    }),
  );
  return {
    rawEmpty: false,
    status: "success",
    statusText: "解析成功",
    error: "",
    summaryItems: buildSummaryItems(normalized),
    tree,
    unknownFieldKeys: collectUnknownFieldKeys(tree),
  };
}
