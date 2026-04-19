import { computed } from "vue";
import { theme as antdTheme } from "ant-design-vue";
import { useAppStore } from "@/store/modules/app";

const normalizeHex = (value: string) => {
  const input = String(value || "").trim();
  if (!input.startsWith("#")) {
    return null;
  }

  if (input.length === 4) {
    return `#${input[1]}${input[1]}${input[2]}${input[2]}${input[3]}${input[3]}`;
  }

  return input.length === 7 ? input : null;
};

const withAlpha = (value: string, alpha: number) => {
  const normalized = normalizeHex(value);
  if (!normalized) {
    return value;
  }

  const bigint = Number.parseInt(normalized.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const useAiAssistantTheme = () => {
  const appStore = useAppStore();

  const isDark = computed(() => appStore.getIsDark);
  const primaryColor = computed(() => {
    return appStore.getTheme?.elColorPrimary || (isDark.value ? "#8cbcff" : "#2d6bff");
  });

  const antdThemeConfig = computed(() => {
    return {
      algorithm: isDark.value ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: primaryColor.value,
        borderRadius: 12,
        colorInfo: primaryColor.value,
        borderRadiusSM: 10,
        borderRadiusLG: 16,
        fontSize: 13,
        fontSizeSM: 12,
        controlHeight: 34,
        controlHeightSM: 30,
        controlHeightLG: 38,
        wireframe: false,
      },
    };
  });

  const panelCssVars = computed<Record<string, string>>(() => {
    const primary = primaryColor.value;
    return {
      "--ai-primary": primary,
      "--ai-primary-soft": withAlpha(primary, isDark.value ? 0.14 : 0.08),
      "--ai-primary-soft-strong": withAlpha(primary, isDark.value ? 0.18 : 0.12),
      "--ai-text": isDark.value
        ? "color-mix(in srgb, var(--el-text-color-primary) 90%, #ffffff 10%)"
        : "var(--el-text-color-primary)",
      "--ai-text-secondary": isDark.value
        ? "color-mix(in srgb, var(--el-text-color-primary) 72%, #ffffff 28%)"
        : "var(--el-text-color-regular)",
      "--ai-text-tertiary": isDark.value
        ? "color-mix(in srgb, var(--el-text-color-primary) 58%, #ffffff 42%)"
        : "var(--el-text-color-secondary)",
      "--ai-page-bg": "var(--app-content-bg-color)",
      "--ai-shell-bg":
        "color-mix(in srgb, var(--app-content-surface-color) 82%, var(--app-content-bg-color) 18%)",
      "--ai-sidebar-bg":
        "color-mix(in srgb, var(--app-content-surface-muted-color) 88%, var(--app-content-bg-color) 12%)",
      "--ai-toolbar-bg":
        "color-mix(in srgb, var(--app-content-surface-color) 86%, transparent 14%)",
      "--ai-composer-bg":
        "color-mix(in srgb, var(--app-content-surface-color) 92%, var(--app-content-surface-muted-color) 8%)",
      "--ai-panel-bg": "var(--app-content-surface-color)",
      "--ai-panel-muted-bg": "var(--app-content-surface-muted-color)",
      "--ai-panel-soft-bg":
        "color-mix(in srgb, var(--app-content-surface-color) 38%, var(--app-content-surface-muted-color) 62%)",
      "--ai-border-color": "var(--app-content-border-color)",
      "--ai-border-strong-color":
        "color-mix(in srgb, var(--app-content-border-color) 78%, var(--ai-primary) 22%)",
      "--ai-user-bubble-bg": withAlpha(primary, isDark.value ? 0.14 : 0.08),
      "--ai-assistant-bubble-bg": isDark.value
        ? "color-mix(in srgb, var(--app-content-surface-color) 70%, var(--app-content-surface-muted-color) 30%)"
        : "transparent",
      "--ai-tool-bubble-bg": "var(--app-content-surface-muted-color)",
      "--ai-assistant-avatar-bg":
        "color-mix(in srgb, var(--app-content-surface-color) 84%, var(--ai-primary) 16%)",
      "--ai-assistant-avatar-text":
        "color-mix(in srgb, var(--el-text-color-primary) 62%, var(--ai-primary) 38%)",
      "--ai-assistant-avatar-border":
        "color-mix(in srgb, var(--app-content-border-color) 72%, var(--ai-primary) 28%)",
      "--ai-user-avatar-bg":
        "color-mix(in srgb, var(--app-content-surface-muted-color) 88%, var(--app-content-surface-color) 12%)",
      "--ai-user-avatar-text":
        "color-mix(in srgb, var(--el-text-color-primary) 84%, var(--ai-primary) 16%)",
      "--ai-user-avatar-border":
        "color-mix(in srgb, var(--app-content-border-color) 86%, var(--ai-primary) 14%)",
      "--ai-avatar-font":
        '"SF Pro Display", "PingFang SC", "Helvetica Neue", "Arial Narrow", sans-serif',
      "--ai-prompt-hover-bg": withAlpha(primary, isDark.value ? 0.12 : 0.06),
      "--ai-shadow": "var(--app-content-shadow)",
      "--ai-chat-width": "860px",
      "--ai-radius-lg": "16px",
      "--ai-radius-md": "12px",
      "--ai-radius-sm": "10px",
    };
  });

  return {
    isDark,
    primaryColor,
    antdThemeConfig,
    panelCssVars,
  };
};
