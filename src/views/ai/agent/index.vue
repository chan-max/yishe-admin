<template>
  <ContentWrap>
    <div class="space-y-3">
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

      <div class="grid gap-3 2xl:grid-cols-[20rem_22rem_minmax(0,1fr)] xl:grid-cols-[18rem_20rem_minmax(0,1fr)]">
        <el-card shadow="never" class="rounded-lg">
          <template #header>
            <div class="flex items-center justify-between gap-2 text-sm font-medium text-[var(--el-text-color-primary)]">
              <span>工具清单</span>
              <span class="text-xs font-normal text-[var(--el-text-color-placeholder)]">{{ tools.length }} 个</span>
            </div>
          </template>

          <el-empty v-if="!toolsLoading && !tools.length" description="暂无工具" :image-size="60" />

          <div v-else v-loading="toolsLoading" class="space-y-2">
            <div
              v-for="tool in tools"
              :key="tool.name"
              class="rounded-md border border-[var(--el-border-color-light)] bg-white p-3"
            >
              <div class="truncate text-sm font-medium text-[var(--el-text-color-primary)]">{{ tool.name }}</div>
              <div class="mt-1 text-xs leading-5 text-[var(--el-text-color-secondary)]">{{ tool.description }}</div>
              <pre class="mt-2 overflow-auto rounded-md bg-[var(--el-fill-color-dark)] p-2 text-[11px] leading-5 text-white">{{ formatJson(tool.inputSchema) }}</pre>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="rounded-lg">
          <template #header>
            <div class="text-sm font-medium text-[var(--el-text-color-primary)]">执行计划</div>
          </template>

          <el-empty v-if="!result" description="执行后展示计划" :image-size="60" />

          <div v-else class="space-y-3 text-xs text-[var(--el-text-color-regular)]">
            <div class="rounded-md border border-[var(--el-border-color-light)] bg-[var(--el-fill-color-light)] p-3 leading-5 text-[var(--el-text-color-primary)]">
              {{ result.reply || '执行完成' }}
            </div>

            <div class="grid gap-2 rounded-md border border-[var(--el-border-color-light)] p-3">
              <div class="grid grid-cols-[56px_minmax(0,1fr)] gap-2">
                <span class="text-[var(--el-text-color-placeholder)]">工具</span>
                <span class="break-all text-[var(--el-text-color-primary)]">{{ result.plan?.tool || '-' }}</span>
              </div>
              <div class="grid grid-cols-[56px_minmax(0,1fr)] gap-2">
                <span class="text-[var(--el-text-color-placeholder)]">置信度</span>
                <span class="text-[var(--el-text-color-primary)]">{{ formatConfidence(result.plan?.confidence) }}</span>
              </div>
              <div class="grid grid-cols-[56px_minmax(0,1fr)] gap-2">
                <span class="text-[var(--el-text-color-placeholder)]">原因</span>
                <span class="leading-5 text-[var(--el-text-color-primary)]">{{ result.plan?.reason || '-' }}</span>
              </div>
              <div class="grid gap-1">
                <span class="text-[var(--el-text-color-placeholder)]">入参</span>
                <pre class="overflow-auto rounded-md bg-[var(--el-fill-color-dark)] p-2 text-[11px] leading-5 text-white">{{ formatJson(result.plan?.input || {}) }}</pre>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="rounded-lg">
          <template #header>
            <div class="flex items-center justify-between gap-2 text-sm font-medium text-[var(--el-text-color-primary)]">
              <span>素材结果</span>
              <span class="text-xs font-normal text-[var(--el-text-color-placeholder)]">{{ result?.toolResult?.count || 0 }} 条</span>
            </div>
          </template>

          <el-empty
            v-if="!result?.toolResult?.items?.length"
            :description="result ? '当前没有返回素材库图片' : '执行后展示素材结果'"
            :image-size="60"
          />

          <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
            <div
              v-for="item in result.toolResult.items"
              :key="item.id"
              class="overflow-hidden rounded-md border border-[var(--el-border-color-light)] bg-white"
            >
              <el-image
                :src="item.imageUrl"
                :preview-src-list="[item.imageUrl]"
                :preview-teleported="true"
                fit="cover"
                class="block h-40 w-full bg-[var(--el-fill-color)]"
              />
              <div class="space-y-2 p-3">
                <div class="line-clamp-1 text-sm font-medium text-[var(--el-text-color-primary)]">{{ item.title }}</div>
                <div class="text-[11px] text-[var(--el-text-color-secondary)]">
                  {{ item.sourceLabel }}<span v-if="item.sourcePlatform"> / {{ item.sourcePlatform }}</span>
                </div>
                <div class="line-clamp-2 min-h-[36px] text-xs leading-5 text-[var(--el-text-color-regular)]">
                  {{ item.description || '暂无描述' }}
                </div>
                <div class="text-[11px] text-[var(--el-text-color-placeholder)]">
                  {{ item.suffix || '-' }}<span v-if="item.createdAt"> / {{ item.createdAt }}</span>
                </div>
                <div class="flex items-center gap-3 text-xs">
                  <el-link type="primary" :href="item.imageUrl" target="_blank">打开图片</el-link>
                  <el-link v-if="item.originUrl" :href="item.originUrl" target="_blank">原始地址</el-link>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
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
const tools = ref<AgentToolDefinition[]>([])
const result = ref<AgentExecuteResponse | null>(null)

const formatJson = (value: unknown) => JSON.stringify(value ?? {}, null, 2)

const loadTools = async () => {
  toolsLoading.value = true
  try {
    const response = await AgentApi.getTools()
    tools.value = Array.isArray(response?.tools) ? response.tools : []
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
    const response = await AgentApi.executeInstruction(normalizedInstruction, {
      scene: 'admin-web'
    })
    result.value = response

    if (!response?.success) {
      ElMessage.error('执行失败')
      return
    }

    if (response.toolResult?.count) {
      ElMessage.success(`已返回 ${response.toolResult.count} 条素材结果`)
      return
    }

    ElMessage.warning(response.reply || '未返回素材结果')
  } catch (error: any) {
    console.error('执行 Agent 指令失败:', error)
    ElMessage.error(error?.message || '执行失败')
  } finally {
    executing.value = false
  }
}

const formatConfidence = (confidence?: number) => {
  if (typeof confidence !== 'number' || Number.isNaN(confidence)) {
    return '-'
  }
  return `${Math.round(confidence * 100)}%`
}

onMounted(() => {
  loadTools()
})
</script>
