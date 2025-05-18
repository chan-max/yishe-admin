<template>
  <div class="enhanced-time-range-picker">
    <el-date-picker
      v-model="internalValue"
      type="datetimerange"
      :shortcuts="shortcuts"
      range-separator="至"
      start-placeholder="开始时间"
      end-placeholder="结束时间"
      format="YYYY-MM-DD HH:mm"
      value-format="x"
      :default-time="defaultTime"
      @change="handleInternalChange"
      @calendar-change="handleCalendarChange"
      :picker-options="pickerOptions"
    />
    
    <!-- <div v-if="internalValue && internalValue.length === 2" class="time-info">
      <p>开始时间: {{ formatTime(internalValue[0]) }} ({{ internalValue[0] }})</p>
      <p>结束时间: {{ formatTime(internalValue[1]) }} ({{ internalValue[1] }})</p>
      <p v-if="timeDifference < minDuration" class="warning-text">
        时间范围至少 {{ minDuration / (60 * 1000) }} 分钟
      </p>
    </div> -->
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  minDuration: {
    type: Number,
    default: 5 * 60 * 1000 // 默认最小5分钟
  },
  maxDuration: {
    type: Number,
    default: 30 * 24 * 60 * 60 * 1000 // 默认最大30天
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// 内部管理的值
const internalValue = ref([...props.modelValue]);

// 计算时间差
const timeDifference = computed(() => {
  if (internalValue.value?.length === 2) {
    return internalValue.value[1] - internalValue.value[0];
  }
  return 0;
});

// 默认时间设置
const defaultTime = [
  new Date(2000, 1, 1, 0, 0, 0),
  new Date(2000, 1, 1, 23, 59, 0)
];

// 快捷选项
const shortcuts = [
  {
    text: '最近1小时',
    value: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 3600 * 1000);
      return [start, end];
    }
  },
  {
    text: '今天',
    value: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
      return [start, end];
    }
  },
  {
    text: '最近24小时',
    value: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 86400 * 1000);
      return [start, end];
    }
  },
  {
    text: '本周',
    value: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1, 0, 0);
      const end = new Date(start.getTime() + 7 * 86400 * 1000 - 60000);
      return [start, end];
    }
  }
];

// 选择器选项
const pickerOptions = {
  disabledDate(time) {
    // 可选：禁用今天之后的日期
    return time.getTime() > Date.now();
  },
  onPick: ({ maxDate, minDate }) => {
    // 选择时的回调，可用于更复杂的逻辑
  }
};

// 格式化时间显示
const formatTime = (timestamp) => {
  return new Date(Number(timestamp)).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
};

// 处理内部值变化
const handleInternalChange = (val) => {
  if (!val || val.length !== 2) {
    internalValue.value = [];
    emitChange();
    return;
  }

  let [start, end] = val.map(Number);
  
  // 验证并修正时间范围
  if (start >= end) {
    ElMessage.warning('结束时间必须大于开始时间');
    end = start + props.minDuration;
  }
  
  // 验证最小持续时间
  // if (end - start < props.minDuration) {
  //   ElMessage.warning(`时间范围至少需要 ${props.minDuration / (60 * 1000)} 分钟`);
  //   end = start + props.minDuration;
  // }
  
  // // 验证最大持续时间
  // if (end - start > props.maxDuration) {
  //   ElMessage.warning(`时间范围最多 ${props.maxDuration / (24 * 60 * 60 * 1000)} 天`);
  //   end = start + props.maxDuration;
  // }
  
  internalValue.value = [start, end];
  emitChange();
};

// 处理日历选择时的变化
const handleCalendarChange = (val) => {
  if (!val || val.length !== 2) return;
  
  const [start, end] = val.map(Number);
  if (start >= end) {
    ElMessage.warning('请确保结束时间大于开始时间');
  }
};

// 触发change事件
const emitChange = () => {
  emit('update:modelValue', internalValue.value);
  emit('change', {
    start: internalValue.value[0],
    end: internalValue.value[1],
    duration: timeDifference.value
  });
};

// 监听外部modelValue变化
watch(() => props.modelValue, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(internalValue.value)) {
    internalValue.value = [...newVal];
  }
}, { deep: true });
</script>

<style scoped>
.enhanced-time-range-picker {
  padding: 20px;
  max-width: 600px;
}

.time-info {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.time-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #606266;
}

.warning-text {
  color: #e6a23c;
  font-weight: bold;
}
</style>