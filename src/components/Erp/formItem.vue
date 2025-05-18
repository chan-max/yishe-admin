<template>
  <div class="form-item" :style="formItemStyle">
    <!-- 使用 label 参数 -->
    <label v-if="label" class="table-form-item-label" :style="labelStyle">
      {{ label }}
    </label>

    <!-- 使用 label 插槽 -->
    <label v-else-if="$slots.label" class="table-form-item-label" :style="labelStyle">
      <slot name="label"></slot>
    </label>

    <!-- 默认插槽用于放置表单控件 -->
    <div class="form-item-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "FormItem",
  props: {
    label: {
      type: String,
      default: "",
    },
    labelWidth: {
      type: [String, Number],
      default: 48, // 支持字符串（如 '100px'）或数字（如 100）
    },
  },
  computed: {
    // 动态计算 label 的样式
    labelStyle() {
      return {
        minWidth:
          typeof this.labelWidth === "number" ? `${this.labelWidth}px` : this.labelWidth,
        textAlign: "right", // 标签右对齐
        marginRight: "8px", // 标签和内容之间的间距
      };
    },
    // 动态计算 form-item 的布局
    formItemStyle() {
      return {
        display: "flex",
        alignItems: "center", // 垂直居中
      };
    },
  },
};
</script>

<style scoped>
.form-item {
}

.table-form-item-label {
  font-weight: 500;
  font-size: 12px;
  text-wrap: nowrap;
  display: inline-block; /* 确保宽度生效 */
}

.form-item-content {
  flex: 1; /* 内容区域占据剩余空间 */
}
</style>
