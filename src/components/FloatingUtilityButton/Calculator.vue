<template>
  <el-dialog
    v-model="visible"
    title="计算器"
    width="400px"
    :before-close="handleClose"
  >
    <div class="calculator">
      <div class="display">
        <el-input
          v-model="display"
          readonly
          size="large"
          class="display-input"
        />
      </div>
      <div class="buttons">
        <div class="button-row">
          <el-button @click="clear" class="calc-btn operator">C</el-button>
          <el-button @click="clearEntry" class="calc-btn operator">CE</el-button>
          <el-button @click="backspace" class="calc-btn operator">⌫</el-button>
          <el-button @click="inputOperator('/')" class="calc-btn operator">÷</el-button>
        </div>
        <div class="button-row">
          <el-button @click="inputNumber('7')" class="calc-btn">7</el-button>
          <el-button @click="inputNumber('8')" class="calc-btn">8</el-button>
          <el-button @click="inputNumber('9')" class="calc-btn">9</el-button>
          <el-button @click="inputOperator('*')" class="calc-btn operator">×</el-button>
        </div>
        <div class="button-row">
          <el-button @click="inputNumber('4')" class="calc-btn">4</el-button>
          <el-button @click="inputNumber('5')" class="calc-btn">5</el-button>
          <el-button @click="inputNumber('6')" class="calc-btn">6</el-button>
          <el-button @click="inputOperator('-')" class="calc-btn operator">-</el-button>
        </div>
        <div class="button-row">
          <el-button @click="inputNumber('1')" class="calc-btn">1</el-button>
          <el-button @click="inputNumber('2')" class="calc-btn">2</el-button>
          <el-button @click="inputNumber('3')" class="calc-btn">3</el-button>
          <el-button @click="inputOperator('+')" class="calc-btn operator">+</el-button>
        </div>
        <div class="button-row">
          <el-button @click="inputNumber('0')" class="calc-btn zero">0</el-button>
          <el-button @click="inputDecimal" class="calc-btn">.</el-button>
          <el-button @click="calculate" class="calc-btn equals">=</el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

defineOptions({ name: 'Calculator' })

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const display = ref('0')
const previousValue = ref<number | null>(null)
const operator = ref<string | null>(null)
const waitingForOperand = ref(false)

const inputNumber = (num: string) => {
  if (waitingForOperand.value) {
    display.value = num
    waitingForOperand.value = false
  } else {
    display.value = display.value === '0' ? num : display.value + num
  }
}

const inputDecimal = () => {
  if (waitingForOperand.value) {
    display.value = '0.'
    waitingForOperand.value = false
  } else if (display.value.indexOf('.') === -1) {
    display.value += '.'
  }
}

const inputOperator = (nextOperator: string) => {
  const inputValue = parseFloat(display.value)

  if (previousValue.value === null) {
    previousValue.value = inputValue
  } else if (operator.value) {
    const currentValue = previousValue.value || 0
    const newValue = performCalculation(currentValue, inputValue, operator.value)

    display.value = String(newValue)
    previousValue.value = newValue
  }

  waitingForOperand.value = true
  operator.value = nextOperator
}

const calculate = () => {
  if (previousValue.value !== null && operator.value) {
    const inputValue = parseFloat(display.value)
    const newValue = performCalculation(previousValue.value, inputValue, operator.value)
    
    display.value = String(newValue)
    previousValue.value = null
    operator.value = null
    waitingForOperand.value = true
  }
}

const performCalculation = (firstValue: number, secondValue: number, operator: string): number => {
  try {
    switch (operator) {
      case '+':
        return firstValue + secondValue
      case '-':
        return firstValue - secondValue
      case '*':
        return firstValue * secondValue
      case '/':
        if (secondValue === 0) {
          ElMessage.error('除数不能为零')
          return firstValue
        }
        return firstValue / secondValue
      default:
        return secondValue
    }
  } catch (error) {
    ElMessage.error('计算错误')
    return 0
  }
}

const clear = () => {
  display.value = '0'
  previousValue.value = null
  operator.value = null
  waitingForOperand.value = false
}

const clearEntry = () => {
  display.value = '0'
}

const backspace = () => {
  if (display.value.length > 1) {
    display.value = display.value.slice(0, -1)
  } else {
    display.value = '0'
  }
}

const handleClose = () => {
  visible.value = false
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  const { key } = event
  
  if (/[0-9]/.test(key)) {
    inputNumber(key)
  } else if (key === '.') {
    inputDecimal()
  } else if (['+', '-', '*', '/'].includes(key)) {
    inputOperator(key)
  } else if (key === 'Enter' || key === '=') {
    calculate()
  } else if (key === 'Escape') {
    clear()
  } else if (key === 'Backspace') {
    backspace()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.calculator {
  .display {
    margin-bottom: 16px;

    .display-input {
      :deep(.el-input__inner) {
        text-align: right;
        font-size: 24px;
        font-weight: bold;
        background-color: #f5f7fa;
      }
    }
  }

  .buttons {
    .button-row {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .calc-btn {
      flex: 1;
      height: 50px;
      font-size: 18px;
      font-weight: bold;

      &.zero {
        flex: 2;
      }

      &.operator {
        background-color: var(--el-color-primary);
        color: white;
        border-color: var(--el-color-primary);

        &:hover {
          background-color: var(--el-color-primary-light-5);
          border-color: var(--el-color-primary-light-5);
        }
      }

      &.equals {
        background-color: #67c23a;
        color: white;
        border-color: #67c23a;

        &:hover {
          background-color: #85ce61;
          border-color: #85ce61;
        }
      }
    }
  }
}

// 暗色主题适配
.dark {
  .calculator {
    .display {
      .display-input {
        :deep(.el-input__inner) {
          background-color: #2d2d2d;
          color: #e5eaf3;
        }
      }
    }
  }
}
</style>
