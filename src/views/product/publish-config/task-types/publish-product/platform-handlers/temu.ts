import type { PlatformHandler } from "./types";
import { normalizeTemuProductTemplate } from "./temu-template";

function parseSerializableObject(value: any) {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return null;
    }
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function pickTemuConfigFields(configData: Record<string, any> = {}) {
  return {
    vendorId: configData?.vendorId,
    vendorCode: configData?.vendorCode,
    vendorName: configData?.vendorName,
    vendorProductMappings: configData?.vendorProductMappings,
    supId: configData?.supId,
    productTemplate: configData?.productTemplate,
    templateImageBindings: configData?.templateImageBindings,
  };
}

function validateTemplateImageBindingsOneBased(bindings: Record<string, any> | null): boolean {
  if (!bindings) {
    return true;
  }

  const bindingKeys = [
    "materialImgUrl",
    "carouselImageUrls",
    "productSkcReqs[].previewImgUrls",
    "productSkcReqs[].productSkuReqs[].thumbUrl",
  ];

  return bindingKeys.every((key) => {
    const rawValue = bindings[key];
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      return true;
    }

    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    return values.every((item) => {
      const value = Number(item);
      return Number.isInteger(value) && value > 0;
    });
  });
}

export const temuHandler: PlatformHandler = {
  platform: "temu",

  validateConfig(configData) {
    const errors: string[] = [];
    const rawProductTemplate = configData?.productTemplate;
    const rawTemplateImageBindings = configData?.templateImageBindings;
    const vendorId = configData?.vendorId;
    const hasProductTemplate =
      rawProductTemplate !== undefined &&
      rawProductTemplate !== null &&
      String(rawProductTemplate).trim();
    const hasTemplateImageBindings =
      rawTemplateImageBindings !== undefined &&
      rawTemplateImageBindings !== null &&
      String(rawTemplateImageBindings).trim();
    const normalizedProductTemplate = normalizeTemuProductTemplate(rawProductTemplate);
    const normalizedTemplateImageBindings = parseSerializableObject(rawTemplateImageBindings);

    if (!hasProductTemplate) {
      errors.push("商品模板不能为空");
    }

    if (hasProductTemplate && !normalizedProductTemplate) {
      errors.push("商品模板格式无效，请输入合法 JSON 或 JS 对象");
    }

    if (hasTemplateImageBindings && !normalizedTemplateImageBindings) {
      errors.push("图片索引绑定格式无效，请输入合法 JSON 对象");
    }

    if (
      normalizedTemplateImageBindings &&
      !validateTemplateImageBindingsOneBased(normalizedTemplateImageBindings)
    ) {
      errors.push("图片索引绑定必须从 1 开始，请填写 1、2、3 这样的图片序号");
    }

    if (vendorId !== undefined && vendorId !== null && vendorId !== '' && !Number.isFinite(Number(vendorId))) {
      errors.push('绑定厂家无效');
    }

    const mappings = Array.isArray(configData?.vendorProductMappings)
      ? configData.vendorProductMappings
      : [];
    mappings.forEach((item: any, index: number) => {
      if (!String(item?.code || '').trim()) {
        errors.push(`第 ${index + 1} 个供应商商品缺少编码快照`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  formatConfigForSubmit(configData) {
    const formatted = pickTemuConfigFields(configData);
    const normalizedProductTemplate = normalizeTemuProductTemplate(formatted.productTemplate);
    const normalizedTemplateImageBindings = parseSerializableObject(formatted.templateImageBindings);

    if (formatted.vendorId !== undefined && formatted.vendorId !== null && formatted.vendorId !== '') {
      formatted.vendorId = Number(formatted.vendorId);
    } else {
      formatted.vendorId = undefined;
    }

    formatted.vendorCode = String(formatted.vendorCode || '').trim() || undefined;
    formatted.vendorName = String(formatted.vendorName || '').trim() || undefined;
    formatted.vendorProductMappings = Array.isArray(formatted.vendorProductMappings)
      ? formatted.vendorProductMappings
          .map((item: any, index: number) => ({
            vendorProductId:
              item?.vendorProductId === undefined || item?.vendorProductId === null || item?.vendorProductId === ''
                ? undefined
                : Number(item.vendorProductId),
            code: String(item?.code || '').trim(),
            name: String(item?.name || '').trim(),
            model: String(item?.model || '').trim(),
            size: String(item?.size || '').trim(),
            productSize: String(item?.productSize || '').trim(),
            packageSize: String(item?.packageSize || '').trim(),
            sort: index + 1,
          }))
          .filter((item: any) => item.code)
      : [];

    if (formatted.supId !== undefined && formatted.supId !== null) {
      formatted.supId = String(formatted.supId).trim() || undefined;
    }

    if (normalizedProductTemplate) {
      formatted.productTemplate = normalizedProductTemplate;
    } else {
      delete formatted.productTemplate;
    }

    if (normalizedTemplateImageBindings) {
      formatted.templateImageBindings = normalizedTemplateImageBindings;
    } else {
      delete formatted.templateImageBindings;
    }

    return formatted;
  },

  formatConfigForEdit(configData) {
    const formatted = pickTemuConfigFields(configData);
    if (formatted.vendorId !== undefined && formatted.vendorId !== null && formatted.vendorId !== '') {
      formatted.vendorId = Number(formatted.vendorId);
    }
    formatted.vendorCode = String(formatted.vendorCode || '').trim();
    formatted.vendorName = String(formatted.vendorName || '').trim();
    formatted.vendorProductMappings = Array.isArray(formatted.vendorProductMappings)
      ? formatted.vendorProductMappings.map((item: any, index: number) => ({
          ...item,
          vendorProductId:
            item?.vendorProductId === undefined || item?.vendorProductId === null || item?.vendorProductId === ''
              ? undefined
              : Number(item.vendorProductId),
          sort: Number(item?.sort) || index + 1,
        }))
      : [];
    if (formatted.supId !== undefined && formatted.supId !== null) {
      formatted.supId = String(formatted.supId).trim();
    }
    formatted.productTemplate = (() => {
      const nextValue = normalizeTemuProductTemplate(formatted.productTemplate);
      return nextValue ? JSON.stringify(nextValue, null, 2) : "";
    })();
    formatted.templateImageBindings = (() => {
      const nextValue = parseSerializableObject(formatted.templateImageBindings);
      return nextValue ? JSON.stringify(nextValue, null, 2) : "";
    })();

    return formatted;
  },

  getHints() {
    return [
      "Temu 当前仅使用商品模板配置，登录与类目路径已暂时隐藏",
      "商品模板支持 JSON 和合法 JS 对象字面量，保存后会统一转成标准对象",
      "SKC 货号使用“素材码-厂家码”，SKU 货号按顺序使用“素材码-供应商商品码”",
      "供应商商品映射会保存编码快照，后续发布不再实时查询供应商商品编码",
      "图片字段建议通过“图片索引绑定”声明，由客户端在发布时按上传结果回填到模板",
      "浏览器自动化侧的页面打开与后续动作暂未接入到这里",
    ];
  },
};
