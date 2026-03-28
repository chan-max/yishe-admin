<template>
  <ContentWrap :plain="true">
    <div class="agent-console-page space-y-3">
      <el-card shadow="never" class="rounded-lg">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0 space-y-1">
            <div class="flex items-center gap-2">
              <h2 class="text-base font-semibold text-[var(--el-text-color-primary)]">Agent 控制台</h2>
              <el-tag size="small">asset.search_images</el-tag>
            </div>
            <p class="text-xs leading-5 text-[var(--el-text-color-secondary)]">
              通用 Agent 入口。当前首个工具为素材库图片查询，后续可继续扩展更多可调度能力。
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <el-button size="small" @click="toolDialogVisible = true">
              查看工具（{{ tools.length }}）
            </el-button>
            <el-button size="small" :icon="Refresh" @click="loadTools" :loading="toolsLoading">
              刷新工具
            </el-button>
            <el-button
              size="small"
              type="primary"
              :icon="Promotion"
              :loading="executing"
              @click="executeInstruction"
            >
              执行指令
            </el-button>
          </div>
        </div>

        <div class="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_18rem]">
          <el-input
            v-model="instruction"
            type="textarea"
            :rows="4"
            resize="none"
            placeholder="例如：帮我找三个春季女装海报素材库图片"
          />

          <div class="grid gap-2 rounded-md border border-[var(--el-border-color-light)] bg-[var(--el-fill-color-light)] p-3 text-xs text-[var(--el-text-color-regular)]">
            <div class="font-medium text-[var(--el-text-color-primary)]">当前建议用法</div>
            <div>内部系统调用：直接输入自然语言，后端走 `/agent/execute`。</div>
            <div>外部 AI 客户端：可基于 `/agent/tools` 与 `/agent/tools/execute` 对接。</div>
            <div>当前能力：素材库图片搜索。后续可继续接发布、查询、调度等工具。</div>
          </div>
        </div>
      </el-card>

      <div class="grid gap-3 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <el-card shadow="never" class="rounded-lg">
          <template #header>
            <div class="text-sm font-medium text-[var(--el-text-color-primary)]">执行计划</div>
          </template>

          <el-empty v-if="!result" description="执行后展示计划" :image-size="60" />

          <div v-else class="space-y-3 text-xs text-[var(--el-text-color-regular)]">
            <div class="rounded-md border border-[var(--el-border-color-light)] bg-[var(--el-fill-color-light)] p-3 leading-5 text-[var(--el-text-color-primary)]">
              {{ result.reply || '执行完成' }}
            </div>

            <div class="grid gap-1 rounded-md border border-[var(--el-border-color-light)] p-3">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs text-[var(--el-text-color-placeholder)]">plans</span>
                <span class="text-xs text-[var(--el-text-color-placeholder)]">{{ result.plans?.length || 0 }} 步</span>
              </div>
              <pre class="overflow-auto rounded-md bg-[var(--el-fill-color-dark)] p-3 text-[11px] leading-5 text-white">{{ formatJson(result.plans) }}</pre>
            </div>

            <div class="rounded-md border border-[var(--el-border-color-light)] bg-[var(--el-fill-color-light)] p-3 text-[11px] leading-5 text-[var(--el-text-color-secondary)]">
              <div>备注1：</div>
              <div>`plans`：本次自然语言请求拆解后的执行步骤列表。</div>
              <div>`stepId`：步骤唯一标识，用于和执行结果一一对应。</div>
              <div>`tool`：本次准备调用的工具名。</div>
              <div>`confidence`：本次工具判断的置信度，范围通常为 0 到 1。</div>
              <div>`reason`：为什么会选择这个工具。</div>
              <div>`message`：补充说明，通常在无法执行或需要提示时返回。</div>
              <div>`input`：最终传给工具的参数对象。</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="rounded-lg">
          <template #header>
            <div class="flex items-center justify-between gap-2 text-sm font-medium text-[var(--el-text-color-primary)]">
              <span>执行结果</span>
              <span class="text-xs font-normal text-[var(--el-text-color-placeholder)]">
                {{ result?.toolResults?.length || 0 }} 次调用
              </span>
            </div>
          </template>

          <el-empty v-if="!result" description="执行后展示原始结果" :image-size="60" />

          <div v-else class="space-y-3">
            <div class="grid gap-1 rounded-md border border-[var(--el-border-color-light)] p-3">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs text-[var(--el-text-color-placeholder)]">toolResults</span>
                <span class="text-xs text-[var(--el-text-color-placeholder)]">{{ result.toolResults?.length || 0 }} 条</span>
              </div>
              <pre class="overflow-auto rounded-md bg-[var(--el-fill-color-dark)] p-3 text-[11px] leading-5 text-white">{{ formatJson(result.toolResults) }}</pre>
            </div>

            <div class="grid gap-1 rounded-md border border-[var(--el-border-color-light)] p-3">
              <span class="text-xs text-[var(--el-text-color-placeholder)]">完整响应</span>
              <pre class="overflow-auto rounded-md bg-[var(--el-fill-color-dark)] p-3 text-[11px] leading-5 text-white">{{ formatJson(result) }}</pre>
            </div>
          </div>
        </el-card>
      </div>

      <el-dialog
        v-model="toolDialogVisible"
        title="工具清单"
        fullscreen
        destroy-on-close
      >
        <div class="mb-4 rounded-md border border-[var(--el-border-color-light)] bg-[var(--el-fill-color-light)] p-3 text-xs leading-5 text-[var(--el-text-color-secondary)]">
          工具的“使用方式”会尽量转成自然语言示例。后端接口的 Swagger 摘要和描述写得越清楚，这里的提示通常也会越准确。
        </div>
        <div v-loading="toolsLoading" class="min-h-[240px]">
          <el-empty v-if="!toolsLoading && !tools.length" description="暂无工具" :image-size="60" />

          <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="tool in tools"
              :key="tool.name"
              class="rounded-lg border border-[var(--el-border-color-light)] bg-[var(--el-fill-color-light)] p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium text-[var(--el-text-color-primary)]">{{ tool.name }}</div>
                  <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--el-text-color-placeholder)]">
                    <span v-if="tool.category">{{ tool.category }}</span>
                    <span v-if="tool.method">{{ tool.method }}</span>
                    <span v-if="tool.route" class="truncate">{{ tool.route }}</span>
                  </div>
                </div>
              </div>
              <div class="mt-2 text-xs leading-5 text-[var(--el-text-color-secondary)]">{{ tool.description }}</div>
              <div
                v-if="tool.usage"
                class="mt-3 rounded-md border border-[var(--el-border-color-light)] bg-[var(--el-fill-color)] p-3 text-[11px] leading-5 text-[var(--el-text-color-regular)]"
              >
                <div class="font-medium text-[var(--el-text-color-primary)]">使用方式</div>
                <div class="mt-1">{{ tool.usage }}</div>
              </div>
              <div
                v-if="tool.examples?.length"
                class="mt-3 rounded-md border border-[var(--el-border-color-light)] bg-[var(--el-fill-color)] p-3 text-[11px] leading-5 text-[var(--el-text-color-regular)]"
              >
                <div class="font-medium text-[var(--el-text-color-primary)]">自然语言示例</div>
                <div class="mt-2 space-y-2">
                  <div
                    v-for="(example, index) in tool.examples"
                    :key="`${tool.name}-example-${index}`"
                    class="rounded-md bg-[var(--el-fill-color-light)] px-2 py-1.5 text-[var(--el-text-color-regular)]"
                  >
                    {{ index + 1 }}. {{ example }}
                  </div>
                </div>
              </div>
              <pre class="mt-3 overflow-auto rounded-md bg-[var(--el-fill-color-dark)] p-3 text-[11px] leading-5 text-white">{{ formatJson(tool.inputSchema) }}</pre>
            </div>
          </div>
        </div>
      </el-dialog>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Promotion, Refresh } from '@element-plus/icons-vue'
import { AgentApi, type AgentExecuteResponse, type AgentToolDefinition } from '@/api/agent'

const instruction = ref('帮我找三个素材库图片')
const executing = ref(false)
const toolsLoading = ref(false)
const toolDialogVisible = ref(false)
const tools = ref<AgentToolDefinition[]>([])
const result = ref<AgentExecuteResponse | null>(null)

const formatJson = (value: unknown) => JSON.stringify(value ?? {}, null, 2)

const normalizeToolsResponse = (payload: any) => {
  if (payload && Array.isArray(payload.tools)) {
    return payload
  }
  if (payload?.data && Array.isArray(payload.data.tools)) {
    return payload.data
  }
  return { success: false, tools: [] }
}

const normalizeExecuteResponse = (payload: any): AgentExecuteResponse | null => {
  if (payload && typeof payload === 'object' && Array.isArray(payload.plans)) {
    return payload as AgentExecuteResponse
  }
  if (payload?.data && typeof payload.data === 'object' && Array.isArray(payload.data.plans)) {
    return payload.data as AgentExecuteResponse
  }
  return null
}

const loadTools = async () => {
  toolsLoading.value = true
  try {
    const payload = await AgentApi.getTools()
    const response = normalizeToolsResponse(payload)
    tools.value = Array.isArray(response.tools) ? response.tools : []
  } catch (error: any) {
    console.error('获取 Agent 工具清单失败:', error)
    ElMessage.error(error?.message || '获取工具清单失败')
  } finally {
    toolsLoading.value = false
  }
}

const executeInstruction = async () => {
  const normalizedInstruction = instruction.value.trim()
  if (!normalizedInstruction) {
    ElMessage.warning('请输入自然语言指令')
    return
  }

  executing.value = true
  try {
    const payload = await AgentApi.executeInstruction(normalizedInstruction, {
      scene: 'admin-web'
    })
    const response = normalizeExecuteResponse(payload)
    result.value = response

    if (!response?.success) {
      ElMessage.error('执行失败')
      return
    }

    if (response.toolResults?.length) {
      const count = response.toolResults.length
      ElMessage.success(`已返回 ${count} 次工具执行结果`)
      return
    }

    ElMessage.warning(response.reply || '未返回工具结果')
  } catch (error: any) {
    console.error('执行 Agent 指令失败:', error)
    ElMessage.error(error?.message || '执行失败')
  } finally {
    executing.value = false
  }
}

onMounted(() => {
  loadTools()
})
</script>

<style scoped>
.agent-console-page {
  padding: 8px 0 0;
}

.agent-console-page :deep(.el-card) {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0;
  background: rgba(255, 255, 255, 0.02);
  box-shadow: none;
}

.agent-console-page :deep(.el-card__header) {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}
</style>
