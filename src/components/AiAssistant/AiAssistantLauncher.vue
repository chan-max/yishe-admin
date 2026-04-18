<template>
  <div v-if="!hideLauncher" class="ai-assistant-launcher">
    <el-tooltip content="AI 助手" placement="left">
      <button type="button" class="ai-assistant-launcher__button" @click="visible = true">
        <el-icon><ChatDotRound /></el-icon>
      </button>
    </el-tooltip>

    <el-drawer
      v-model="visible"
      :with-header="false"
      :size="drawerSize"
      append-to-body
      direction="rtl"
      :destroy-on-close="false"
    >
      <AiAssistantPanel mode="drawer" @open-page="openAssistantPage" />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChatDotRound } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/modules/app'
import AiAssistantPanel from './AiAssistantPanel.vue'

defineOptions({ name: 'AiAssistantLauncher' })

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const visible = ref(false)

const hideLauncher = computed(() => route.path.startsWith('/ai/assistant'))
const drawerSize = computed(() => (appStore.getMobile ? '100%' : '460px'))

const openAssistantPage = async () => {
  visible.value = false
  await router.push('/ai/assistant')
}
</script>

<style lang="scss" scoped>
.ai-assistant-launcher {
  position: fixed;
  right: 18px;
  bottom: 24px;
  z-index: 2100;

  &__button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 54px;
    height: 54px;
    border: 0;
    border-radius: 999px;
    background: linear-gradient(135deg, #2d6bff 0%, #5e9bff 100%);
    color: #fff;
    box-shadow: 0 14px 28px rgba(45, 107, 255, 0.28);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-1px) scale(1.02);
      box-shadow: 0 18px 32px rgba(45, 107, 255, 0.34);
    }

    .el-icon {
      font-size: 22px;
    }
  }
}

@media (max-width: 768px) {
  .ai-assistant-launcher {
    right: 14px;
    bottom: 18px;

    &__button {
      width: 50px;
      height: 50px;
    }
  }
}
</style>
