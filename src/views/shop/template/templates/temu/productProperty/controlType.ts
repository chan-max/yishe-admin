/**
 * 控件类型枚举
 * @readonly
 * @enum {number}
 */
const ControlType = Object.freeze({
  /** 可输入文本框 */
  INPUT: 0,
  /** 可勾选的选项（如复选框） */
  CHOOSE: 1,
  /** 既可输入又可勾选的控件 */
  INPUT_CHOOSE: 3,
  /** 单项时间选择器（年月日） */
  SINGLE_YMD_DATE: 5,
  /** 双项时间选择器（年月日） */
  MULTIPLE_YMD_DATE: 6,
  /** 单项时间选择器（年月） */
  SINGLE_YM_DATE: 7,
  /** 双项时间选择器（年月） */
  MULTIPLE_YM_DATE: 8,
  /** 调色盘选择器 */
  COLOR_SELECTOR: 9,
  /** 尺码选择器 */
  SIZE_SELECTOR: 10,
  /** 输入数值范围（如最小值-最大值） */
  NUMBER_RANGE: 11,
  /** 输入数值乘积（2维计算） */
  NUMBER_PRODUCT_DOUBLE: 12,
  /** 输入数值乘积（3维计算） */
  NUMBER_PRODUCT_TRIPLE: 13,
  /** 自动计算框（如公式计算） */
  AUTO_COMPUTE: 14,
  /** 地区选择器（省市区） */
  REGION_CHOOSE: 15,
  /** 属性勾选和数值录入（组合控件） */
  PROPERTY_CHOOSE_AND_INPUT: 16,
});
