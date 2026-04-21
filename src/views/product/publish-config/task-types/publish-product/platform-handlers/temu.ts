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
    productTemplate: configData?.productTemplate,
    templateImageBindings: configData?.templateImageBindings,
  };
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

    if (vendorId !== undefined && vendorId !== null && vendorId !== '' && !Number.isFinite(Number(vendorId))) {
      errors.push('绑定厂家无效');
    }

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
      "支持绑定厂家；客户端发布时会优先使用显式 productCode，否则按“素材码-厂家码”兜底生成",
      "图片字段建议通过“图片索引绑定”声明，由客户端在发布时按上传结果回填到模板",
      "浏览器自动化侧的页面打开与后续动作暂未接入到这里",
    ];
  },
};
