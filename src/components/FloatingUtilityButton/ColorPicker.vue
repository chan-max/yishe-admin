<template>
  <el-dialog
    v-model="visible"
    title="颜色选择器"
    width="500px"
    :before-close="handleClose"
  >
    <div class="color-picker">
      <div class="color-display">
        <div class="color-preview" :style="{ backgroundColor: selectedColor }"></div>
        <div class="color-info">
          <div class="color-value">
            <label>HEX:</label>
            <el-input v-model="hexColor" @input="updateFromHex" size="small" />
          </div>
          <div class="color-value">
            <label>RGB:</label>
            <el-input v-model="rgbColor" @input="updateFromRgb" size="small" />
          </div>
          <div class="color-value">
            <label>HSL:</label>
            <el-input v-model="hslColor" readonly size="small" />
          </div>
        </div>
      </div>

      <div class="color-controls">
        <div class="control-group">
          <label>红色 (R):</label>
          <el-slider v-model="rgb.r" :max="255" @input="updateFromRgbSlider" />
          <span>{{ rgb.r }}</span>
        </div>
        <div class="control-group">
          <label>绿色 (G):</label>
          <el-slider v-model="rgb.g" :max="255" @input="updateFromRgbSlider" />
          <span>{{ rgb.g }}</span>
        </div>
        <div class="control-group">
          <label>蓝色 (B):</label>
          <el-slider v-model="rgb.b" :max="255" @input="updateFromRgbSlider" />
          <span>{{ rgb.b }}</span>
        </div>
      </div>

      <div class="preset-colors">
        <h4>预设颜色</h4>
        <div class="color-grid">
          <div
            v-for="color in presetColors"
            :key="color"
            class="preset-color"
            :style="{ backgroundColor: color }"
            @click="selectPresetColor(color)"
            :title="color"
          ></div>
        </div>
      </div>

      <div class="color-history" v-if="colorHistory.length > 0">
        <h4>历史颜色</h4>
        <div class="color-grid">
          <div
            v-for="color in colorHistory"
            :key="color"
            class="preset-color"
            :style="{ backgroundColor: color }"
            @click="selectPresetColor(color)"
            :title="color"
          ></div>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="copyToClipboard(hexColor)">复制 HEX</el-button>
        <el-button @click="copyToClipboard(rgbColor)">复制 RGB</el-button>
        <el-button @click="addToHistory" type="primary">添加到历史</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

defineOptions({ name: 'ColorPicker' })

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

const rgb = ref({ r: 255, g: 0, b: 0 })
const colorHistory = ref<string[]>([])

const selectedColor = computed(() => {
  return `rgb(${rgb.value.r}, ${rgb.value.g}, ${rgb.value.b})`
})

const hexColor = computed({
  get: () => rgbToHex(rgb.value.r, rgb.value.g, rgb.value.b),
  set: (value: string) => {
    const result = hexToRgb(value)
    if (result) {
      rgb.value = result
    }
  }
})

const rgbColor = computed({
  get: () => `rgb(${rgb.value.r}, ${rgb.value.g}, ${rgb.value.b})`,
  set: (value: string) => {
    const result = parseRgb(value)
    if (result) {
      rgb.value = result
    }
  }
})

const hslColor = computed(() => {
  const hsl = rgbToHsl(rgb.value.r, rgb.value.g, rgb.value.b)
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
})

const presetColors = [
  '#FF0000', '#FF8000', '#FFFF00', '#80FF00', '#00FF00', '#00FF80',
  '#00FFFF', '#0080FF', '#0000FF', '#8000FF', '#FF00FF', '#FF0080',
  '#FFFFFF', '#E0E0E0', '#C0C0C0', '#A0A0A0', '#808080', '#606060',
  '#404040', '#202020', '#000000', '#8B4513', '#A0522D', '#D2691E'
]

// 颜色转换函数
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('').toUpperCase()
}

const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

const parseRgb = (rgb: string): { r: number, g: number, b: number } | null => {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    }
  }
  return null
}

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

const updateFromHex = (value: string) => {
  const result = hexToRgb(value)
  if (result) {
    rgb.value = result
  }
}

const updateFromRgb = (value: string) => {
  const result = parseRgb(value)
  if (result) {
    rgb.value = result
  }
}

const updateFromRgbSlider = () => {
  // RGB 值已经通过 v-model 更新，这里只是触发重新计算
}

const selectPresetColor = (color: string) => {
  const result = hexToRgb(color)
  if (result) {
    rgb.value = result
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(`已复制: ${text}`)
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const addToHistory = () => {
  const color = hexColor.value
  if (!colorHistory.value.includes(color)) {
    colorHistory.value.unshift(color)
    if (colorHistory.value.length > 12) {
      colorHistory.value = colorHistory.value.slice(0, 12)
    }
    ElMessage.success('已添加到历史颜色')
  }
}

const handleClose = () => {
  visible.value = false
}
</script>

<style lang="scss" scoped>
.color-picker {
  .color-display {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;

    .color-preview {
      width: 100px;
      height: 100px;
      border: 2px solid #e4e7ed;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .color-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .color-value {
        display: flex;
        align-items: center;
        gap: 8px;

        label {
          width: 40px;
          font-weight: 500;
          color: #303133;
        }
      }
    }
  }

  .color-controls {
    margin-bottom: 24px;

    .control-group {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;

      label {
        width: 80px;
        font-weight: 500;
        color: #303133;
      }

      .el-slider {
        flex: 1;
      }

      span {
        width: 30px;
        font-weight: bold;
        color: #606266;
        text-align: right;
      }
    }
  }

  .preset-colors,
  .color-history {
    margin-bottom: 16px;

    h4 {
      margin: 0 0 12px;
      font-size: 14px;
      color: #303133;
    }

    .color-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 8px;

      .preset-color {
        width: 30px;
        height: 30px;
        cursor: pointer;
        border: 1px solid #e4e7ed;
        border-radius: 4px;
        transition: transform 0.2s ease;

        &:hover {
          transform: scale(1.1);
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 暗色主题适配
.dark {
  .color-picker {
    .color-display {
      .color-preview {
        border-color: #414243;
      }

      .color-info {
        .color-value {
          label {
            color: #e5eaf3;
          }
        }
      }
    }

    .color-controls {
      .control-group {
        label {
          color: #e5eaf3;
        }

        span {
          color: #a3a6ad;
        }
      }
    }

    .preset-colors,
    .color-history {
      h4 {
        color: #e5eaf3;
      }

      .color-grid {
        .preset-color {
          border-color: #414243;
        }
      }
    }
  }
}
</style>
