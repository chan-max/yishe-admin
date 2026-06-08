<template>
  <PlatformSessionToolkitPage
    platform-key="doudian"
    platform-label="抖店"
    session-tool-key="doudian-session-acquire"
    check-login-tool-key="doudian-check-login"
    open-workspace-tool-key="doudian-open-workspace"
    empty-description="当前环境暂无抖店会话。"
  />
</template>

<script setup lang="ts">
import PlatformSessionToolkitPage from "../shared/PlatformSessionToolkitPage.vue";

defineOptions({ name: "ToolkitDoudianPage" });
</script>
