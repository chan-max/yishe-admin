<script setup lang="ts">
import { ref, computed } from 'vue'
import { create, all, type MathJsStatic } from 'mathjs'

defineOptions({ name: 'ToolCalculator' })

const math: MathJsStatic = create(all)

const expr = ref('')
const display = ref('0')
const done = ref(false)

const preview = computed(() => {
  if (!expr.value || done.value) return ''
  try {
    const r = math.evaluate(expr.value)
    const f = math.format(r, { precision: 10 })
    return f === expr.value ? '' : f
  } catch {
    return ''
  }
})

const press = (b: string) => {
  const fn: Record<string, () => void> = {
    AC: () => { expr.value = ''; display.value = '0'; done.value = false },
    '←': back,
    '%': pct,
    '+/−': sign,
    '=': calc,
    '.': dot,
    '÷': () => op('/'),
    '×': () => op('*'),
    '+': () => op('+'),
    '−': () => op('-'),
  }
  if (fn[b]) fn[b]()
  else digit(b)
}

const digit = (d: string) => {
  if (display.value === 'Error' || done.value) {
    expr.value = d; display.value = d; done.value = false; return
  }
  expr.value += d; display.value = expr.value
}

const op = (o: string) => {
  if (display.value === 'Error') return
  if (done.value) { done.value = false; expr.value += o; display.value = expr.value; return }
  const last = expr.value.slice(-1)
  if (['+', '-', '*', '/'].includes(last)) expr.value = expr.value.slice(0, -1) + o
  else if (expr.value) expr.value += o
  else if (o === '-') expr.value = '-'
  display.value = expr.value || '0'
}

const dot = () => {
  if (display.value === 'Error' || done.value) {
    expr.value = '0.'; display.value = '0.'; done.value = false; return
  }
  const p = expr.value.split(/[\+\-\*\/]/)
  if (p[p.length - 1].includes('.')) return
  expr.value += (!expr.value || /[\+\-\*\/]$/.test(expr.value)) ? '0.' : '.'
  display.value = expr.value
}

const calc = () => {
  if (!expr.value) return
  try {
    const r = math.evaluate(expr.value)
    const f = math.format(r, { precision: 10 })
    expr.value = f; display.value = f; done.value = true
  } catch {
    display.value = 'Error'; expr.value = ''; done.value = true
  }
}

const back = () => {
  if (display.value === 'Error' || done.value) { press('AC'); return }
  expr.value = expr.value.slice(0, -1); display.value = expr.value || '0'
}

const sign = () => {
  if (!expr.value || display.value === 'Error') return
  try {
    const n = math.format(math.unaryMinus(math.evaluate(expr.value)), { precision: 10 })
    expr.value = n; display.value = n; done.value = true
  } catch {
    expr.value = expr.value.startsWith('-') ? expr.value.slice(1) : '-' + expr.value
    display.value = expr.value
  }
}

const pct = () => {
  if (!expr.value || display.value === 'Error') return
  try {
    const n = math.format(math.divide(math.evaluate(expr.value), 100), { precision: 10 })
    expr.value = n; display.value = n; done.value = true
  } catch {
    display.value = 'Error'; done.value = true
  }
}

const rows = [
  ['AC', '←', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['+/−', '0', '.', '='],
]
</script>

<template>
  <div class="calc">
    <div class="calc__screen">
      <div class="calc__val" :class="{ err: display === 'Error' }">{{ display }}</div>
      <div v-if="preview" class="calc__pre">{{ preview }}</div>
    </div>
    <div class="calc__keys">
      <template v-for="(row, i) in rows" :key="i">
        <button
          v-for="b in row"
          :key="b"
          class="k"
          :class="{ op: ['÷', '×', '−', '+', '='].includes(b), fn: ['AC', '←', '%', '+/−'].includes(b), z: b === '0' }"
          @click="press(b)"
        >{{ b }}</button>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.calc {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 4px;
  background: var(--app-content-surface-color);
}

.calc__screen {
  display: flex;
  height: 42px;
  min-height: 42px;
  padding: 6px 2px;
  text-align: right;
  flex-direction: column;
  justify-content: flex-end;
}

.calc__val {
  font-size: 24px;
  font-weight: 300;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);

  &.err { color: var(--el-color-danger) }
}

.calc__pre {
  margin-top: 2px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.calc__keys {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
}

.k {
  height: 34px;
  font-size: 14px;
  font-weight: 400;
  color: var(--el-text-color-primary);
  cursor: pointer;
  background: var(--ep-cover-soft-bg);
  border: none;
  border-radius: 6px;
  transition: background 0.1s;

  &:hover { background: var(--ep-cover-soft-bg-hover) }

  &:active { transform: scale(0.96) }

  &.op {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);

    &:hover { background: color-mix(in srgb, var(--el-color-primary) 22%, transparent) }
  }

  &.fn {
    color: var(--el-text-color-secondary);
    background: color-mix(in srgb, var(--el-text-color-secondary) 8%, transparent);

    &:hover { background: var(--ep-cover-soft-bg-hover) }
  }

  &.z { grid-column: span 2 }
}
</style>
