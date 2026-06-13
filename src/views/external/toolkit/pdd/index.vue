<template>
  <PlatformSessionToolkitPage
    platform-key="pdd"
    platform-label="拼多多"
    session-tool-key="pdd-session-acquire"
    check-login-tool-key="pdd-check-login"
    open-workspace-tool-key="pdd-open-workspace"
    click-login-tool-key="pdd-click-login"
    empty-description="当前环境暂无拼多多会话。"
    :enable-credential-panel="true"
  />
</template>

<script setup lang="ts">
import PlatformSessionToolkitPage from "../shared/PlatformSessionToolkitPage.vue";

defineOptions({ name: "ToolkitPddPage" });
</script>
