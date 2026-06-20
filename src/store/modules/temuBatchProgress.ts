import { defineStore } from "pinia";
import { store } from "@/store";

export interface TemuBatchProgressItem {
  key: string;
  title: string;
  progressText: string;
  percent: number;
  rowText?: string;
  stage?: string;
  successCount: number;
  failedCount: number;
  remainingCount: number;
}

export interface TemuBatchProgressState {
  items: TemuBatchProgressItem[];
  batchAbortToken: number;
  priceReviewBatchSubmitting: boolean;
  priceReviewBatchSubmittingMode: "" | "confirm" | "abandon" | "reprice";
  priceReviewBatchCurrentStage: string;
  priceReviewBatchCurrentRowText: string;
  priceReviewBatchFinishedCount: number;
  priceReviewBatchTotalCount: number;
  priceReviewBatchSuccessCount: number;
  priceReviewBatchFailedCount: number;
  jitBatchSubmitting: boolean;
  jitBatchModeLabel: string;
  jitBatchCurrentStage: string;
  jitBatchCurrentRowText: string;
  jitBatchFinishedCount: number;
  jitBatchTotalCount: number;
  jitBatchSuccessCount: number;
  jitBatchFailedCount: number;
  realPictureBatchSubmitting: boolean;
  realPictureBatchFinishedCount: number;
  realPictureBatchTotalCount: number;
  realPictureBatchSuccessCount: number;
  realPictureBatchFailedCount: number;
  complianceBatchSubmitting: boolean;
  complianceBatchMode: boolean;
  complianceBatchFinishedCount: number;
  complianceBatchTotalCount: number;
  complianceBatchSuccessCount: number;
  complianceBatchFailedCount: number;
  confirmationBatchSubmitting: boolean;
  confirmationBatchFinishedCount: number;
  confirmationBatchTotalCount: number;
  confirmationBatchSuccessCount: number;
  confirmationBatchFailedCount: number;
  publishedSiteBatchSubmitting: boolean;
  publishedSiteBatchStage: string;
  publishedSiteBatchTotalCount: number;
  publishedSiteBatchSuccessCount: number;
  publishedSiteBatchFailedCount: number;
}

const defaultState = (): TemuBatchProgressState => ({
  items: [],
  batchAbortToken: 0,
  priceReviewBatchSubmitting: false,
  priceReviewBatchSubmittingMode: "",
  priceReviewBatchCurrentStage: "",
  priceReviewBatchCurrentRowText: "",
  priceReviewBatchFinishedCount: 0,
  priceReviewBatchTotalCount: 0,
  priceReviewBatchSuccessCount: 0,
  priceReviewBatchFailedCount: 0,
  jitBatchSubmitting: false,
  jitBatchModeLabel: "",
  jitBatchCurrentStage: "",
  jitBatchCurrentRowText: "",
  jitBatchFinishedCount: 0,
  jitBatchTotalCount: 0,
  jitBatchSuccessCount: 0,
  jitBatchFailedCount: 0,
  realPictureBatchSubmitting: false,
  realPictureBatchFinishedCount: 0,
  realPictureBatchTotalCount: 0,
  realPictureBatchSuccessCount: 0,
  realPictureBatchFailedCount: 0,
  complianceBatchSubmitting: false,
  complianceBatchMode: false,
  complianceBatchFinishedCount: 0,
  complianceBatchTotalCount: 0,
  complianceBatchSuccessCount: 0,
  complianceBatchFailedCount: 0,
  confirmationBatchSubmitting: false,
  confirmationBatchFinishedCount: 0,
  confirmationBatchTotalCount: 0,
  confirmationBatchSuccessCount: 0,
  confirmationBatchFailedCount: 0,
  publishedSiteBatchSubmitting: false,
  publishedSiteBatchStage: "",
  publishedSiteBatchTotalCount: 0,
  publishedSiteBatchSuccessCount: 0,
  publishedSiteBatchFailedCount: 0,
});

export const useTemuBatchProgressStore = defineStore("temu-batch-progress", {
  state: (): TemuBatchProgressState => defaultState(),
  getters: {
    isAnyBatchRunning: (state) =>
      state.priceReviewBatchSubmitting ||
      state.jitBatchSubmitting ||
      state.realPictureBatchSubmitting ||
      state.complianceBatchSubmitting ||
      state.confirmationBatchSubmitting ||
      state.publishedSiteBatchSubmitting,
    priceReviewBatchProgressPercent: (state) => {
      if (state.priceReviewBatchTotalCount <= 0) return 0;
      return Math.round(
        (state.priceReviewBatchFinishedCount / state.priceReviewBatchTotalCount) * 100,
      );
    },
    priceReviewBatchRemainingCount: (state) =>
      Math.max(0, state.priceReviewBatchTotalCount - state.priceReviewBatchFinishedCount),
    priceReviewBatchProgressText: (state) =>
      `${state.priceReviewBatchFinishedCount}/${state.priceReviewBatchTotalCount}`,
    priceReviewBatchActionText: (state) => {
      if (state.priceReviewBatchSubmittingMode === "confirm") return "批量确认核价";
      if (state.priceReviewBatchSubmittingMode === "abandon") return "批量不核价";
      if (state.priceReviewBatchSubmittingMode === "reprice") return "批量重新报价";
      return "批量核价";
    },
    jitBatchProgressPercent: (state) => {
      if (state.jitBatchTotalCount <= 0) return 0;
      return Math.round((state.jitBatchFinishedCount / state.jitBatchTotalCount) * 100);
    },
    jitBatchRemainingCount: (state) =>
      Math.max(0, state.jitBatchTotalCount - state.jitBatchFinishedCount),
    jitBatchProgressText: (state) => `${state.jitBatchFinishedCount}/${state.jitBatchTotalCount}`,
    realPictureBatchProgressPercent: (state) => {
      if (state.realPictureBatchTotalCount <= 0) return 0;
      return Math.round(
        (state.realPictureBatchFinishedCount / state.realPictureBatchTotalCount) * 100,
      );
    },
    realPictureBatchRemainingCount: (state) =>
      Math.max(0, state.realPictureBatchTotalCount - state.realPictureBatchFinishedCount),
    realPictureBatchProgressText: (state) =>
      `${state.realPictureBatchFinishedCount}/${state.realPictureBatchTotalCount}`,
    complianceBatchProgressPercent: (state) => {
      if (state.complianceBatchTotalCount <= 0) return 0;
      return Math.round(
        (state.complianceBatchFinishedCount / state.complianceBatchTotalCount) * 100,
      );
    },
    complianceBatchRemainingCount: (state) =>
      Math.max(0, state.complianceBatchTotalCount - state.complianceBatchFinishedCount),
    complianceBatchProgressText: (state) =>
      `${state.complianceBatchFinishedCount}/${state.complianceBatchTotalCount}`,
    confirmationBatchProgressPercent: (state) => {
      if (state.confirmationBatchTotalCount <= 0) return 0;
      return Math.round(
        (state.confirmationBatchFinishedCount / state.confirmationBatchTotalCount) * 100,
      );
    },
    confirmationBatchRemainingCount: (state) =>
      Math.max(0, state.confirmationBatchTotalCount - state.confirmationBatchFinishedCount),
    confirmationBatchProgressText: (state) =>
      `${state.confirmationBatchFinishedCount}/${state.confirmationBatchTotalCount}`,
    publishedSiteBatchProgressPercent: (state) => {
      if (state.publishedSiteBatchTotalCount <= 0) return 0;
      if (!state.publishedSiteBatchSubmitting) return 100;
      if (state.publishedSiteBatchSuccessCount + state.publishedSiteBatchFailedCount > 0) {
        return Math.round(
          ((state.publishedSiteBatchSuccessCount + state.publishedSiteBatchFailedCount) / state.publishedSiteBatchTotalCount) * 100,
        );
      }
      return 0;
    },
    publishedSiteBatchRemainingCount: (state) =>
      Math.max(0, state.publishedSiteBatchTotalCount - state.publishedSiteBatchSuccessCount - state.publishedSiteBatchFailedCount),
    publishedSiteBatchProgressText: (state) => {
      const done = state.publishedSiteBatchSuccessCount + state.publishedSiteBatchFailedCount;
      if (!state.publishedSiteBatchSubmitting && done > 0) {
        return `完成 ${done}/${state.publishedSiteBatchTotalCount}`;
      }
      return `${done}/${state.publishedSiteBatchTotalCount}`;
    },
    liveItems(): TemuBatchProgressItem[] {
      const items: TemuBatchProgressItem[] = [];
      if (this.priceReviewBatchSubmitting) {
        items.push({
          key: "price-review",
          title: this.priceReviewBatchActionText,
          progressText: this.priceReviewBatchProgressText,
          percent: this.priceReviewBatchProgressPercent,
          rowText: this.priceReviewBatchCurrentRowText,
          stage: this.priceReviewBatchCurrentStage,
          successCount: this.priceReviewBatchSuccessCount,
          failedCount: this.priceReviewBatchFailedCount,
          remainingCount: this.priceReviewBatchRemainingCount,
        });
      }
      if (this.jitBatchSubmitting) {
        items.push({
          key: "jit",
          title: this.jitBatchModeLabel,
          progressText: this.jitBatchProgressText,
          percent: this.jitBatchProgressPercent,
          rowText: this.jitBatchCurrentRowText,
          stage: this.jitBatchCurrentStage,
          successCount: this.jitBatchSuccessCount,
          failedCount: this.jitBatchFailedCount,
          remainingCount: this.jitBatchRemainingCount,
        });
      }
      if (this.realPictureBatchSubmitting) {
        items.push({
          key: "real-picture",
          title: "批量上传实拍图",
          progressText: this.realPictureBatchProgressText,
          percent: this.realPictureBatchProgressPercent,
          successCount: this.realPictureBatchSuccessCount,
          failedCount: this.realPictureBatchFailedCount,
          remainingCount: this.realPictureBatchRemainingCount,
        });
      }
      if (this.complianceBatchSubmitting) {
        items.push({
          key: "compliance",
          title: "批量处理合规",
          progressText: this.complianceBatchProgressText,
          percent: this.complianceBatchProgressPercent,
          successCount: this.complianceBatchSuccessCount,
          failedCount: this.complianceBatchFailedCount,
          remainingCount: this.complianceBatchRemainingCount,
        });
      }
      if (this.confirmationBatchSubmitting) {
        items.push({
          key: "confirmation",
          title: "批量确认商品",
          progressText: this.confirmationBatchProgressText,
          percent: this.confirmationBatchProgressPercent,
          successCount: this.confirmationBatchSuccessCount,
          failedCount: this.confirmationBatchFailedCount,
          remainingCount: this.confirmationBatchRemainingCount,
        });
      }
      if (this.publishedSiteBatchSubmitting) {
        items.push({
          key: "published-site-off-sale",
          title: "批量下架商品",
          progressText: this.publishedSiteBatchProgressText,
          percent: this.publishedSiteBatchProgressPercent,
          stage: this.publishedSiteBatchStage,
          successCount: this.publishedSiteBatchSuccessCount,
          failedCount: this.publishedSiteBatchFailedCount,
          remainingCount: this.publishedSiteBatchRemainingCount,
        });
      }
      return items;
    },
  },
  actions: {
    reset() {
      Object.assign(this, defaultState());
    },
    stopAll() {
      this.batchAbortToken += 1;
      this.priceReviewBatchSubmitting = false;
      this.priceReviewBatchSubmittingMode = "";
      this.priceReviewBatchCurrentStage = "";
      this.priceReviewBatchCurrentRowText = "";
      this.jitBatchSubmitting = false;
      this.jitBatchCurrentStage = "";
      this.jitBatchCurrentRowText = "";
      this.realPictureBatchSubmitting = false;
      this.complianceBatchSubmitting = false;
      this.complianceBatchMode = false;
      this.confirmationBatchSubmitting = false;
      this.publishedSiteBatchSubmitting = false;
      this.publishedSiteBatchStage = "";
    },
    setItems(items: TemuBatchProgressItem[]) {
      this.items = items;
    },
    startPriceReviewBatch(mode: "confirm" | "abandon" | "reprice", totalCount: number) {
      this.priceReviewBatchSubmitting = true;
      this.priceReviewBatchSubmittingMode = mode;
      this.priceReviewBatchCurrentStage = "";
      this.priceReviewBatchCurrentRowText = "";
      this.priceReviewBatchFinishedCount = 0;
      this.priceReviewBatchTotalCount = totalCount;
      this.priceReviewBatchSuccessCount = 0;
      this.priceReviewBatchFailedCount = 0;
    },
    updatePriceReviewBatchProgress(options: {
      stage?: string;
      rowText?: string;
      success?: boolean;
    }) {
      if (options.stage !== undefined) this.priceReviewBatchCurrentStage = options.stage;
      if (options.rowText !== undefined) this.priceReviewBatchCurrentRowText = options.rowText;
      this.priceReviewBatchFinishedCount += 1;
      if (options.success) {
        this.priceReviewBatchSuccessCount += 1;
      } else {
        this.priceReviewBatchFailedCount += 1;
      }
    },
    stopPriceReviewBatch() {
      this.priceReviewBatchSubmitting = false;
      this.priceReviewBatchSubmittingMode = "";
      this.priceReviewBatchCurrentStage = "";
      this.priceReviewBatchCurrentRowText = "";
    },
    startJitBatch(modeLabel: string, totalCount: number) {
      this.jitBatchSubmitting = true;
      this.jitBatchModeLabel = modeLabel;
      this.jitBatchCurrentStage = "";
      this.jitBatchCurrentRowText = "";
      this.jitBatchFinishedCount = 0;
      this.jitBatchTotalCount = totalCount;
      this.jitBatchSuccessCount = 0;
      this.jitBatchFailedCount = 0;
    },
    updateJitBatchProgress(options: { stage?: string; rowText?: string; success?: boolean }) {
      if (options.stage !== undefined) this.jitBatchCurrentStage = options.stage;
      if (options.rowText !== undefined) this.jitBatchCurrentRowText = options.rowText;
      this.jitBatchFinishedCount += 1;
      if (options.success) {
        this.jitBatchSuccessCount += 1;
      } else {
        this.jitBatchFailedCount += 1;
      }
    },
    stopJitBatch() {
      this.jitBatchSubmitting = false;
      this.jitBatchCurrentStage = "";
      this.jitBatchCurrentRowText = "";
    },
    startRealPictureBatch(totalCount: number) {
      this.realPictureBatchSubmitting = true;
      this.realPictureBatchFinishedCount = 0;
      this.realPictureBatchTotalCount = totalCount;
      this.realPictureBatchSuccessCount = 0;
      this.realPictureBatchFailedCount = 0;
    },
    updateRealPictureBatchProgress(success: boolean) {
      this.realPictureBatchFinishedCount += 1;
      if (success) {
        this.realPictureBatchSuccessCount += 1;
      } else {
        this.realPictureBatchFailedCount += 1;
      }
    },
    stopRealPictureBatch() {
      this.realPictureBatchSubmitting = false;
    },
    startComplianceBatch(isAbandon: boolean, totalCount: number) {
      this.complianceBatchSubmitting = true;
      this.complianceBatchMode = isAbandon;
      this.complianceBatchFinishedCount = 0;
      this.complianceBatchTotalCount = totalCount;
      this.complianceBatchSuccessCount = 0;
      this.complianceBatchFailedCount = 0;
    },
    updateComplianceBatchProgress(success: boolean) {
      this.complianceBatchFinishedCount += 1;
      if (success) {
        this.complianceBatchSuccessCount += 1;
      } else {
        this.complianceBatchFailedCount += 1;
      }
    },
    stopComplianceBatch() {
      this.complianceBatchSubmitting = false;
      this.complianceBatchMode = false;
    },
    startConfirmationBatch(totalCount: number) {
      this.confirmationBatchSubmitting = true;
      this.confirmationBatchFinishedCount = 0;
      this.confirmationBatchTotalCount = totalCount;
      this.confirmationBatchSuccessCount = 0;
      this.confirmationBatchFailedCount = 0;
    },
    updateConfirmationBatchProgress(success: boolean) {
      this.confirmationBatchFinishedCount += 1;
      if (success) {
        this.confirmationBatchSuccessCount += 1;
      } else {
        this.confirmationBatchFailedCount += 1;
      }
    },
    stopConfirmationBatch() {
      this.confirmationBatchSubmitting = false;
    },
    startPublishedSiteBatch(totalCount: number) {
      this.publishedSiteBatchSubmitting = true;
      this.publishedSiteBatchStage = "正在请求下架接口...";
      this.publishedSiteBatchTotalCount = totalCount;
      this.publishedSiteBatchSuccessCount = 0;
      this.publishedSiteBatchFailedCount = 0;
    },
    finishPublishedSiteBatch(successCount: number, failedCount: number) {
      this.publishedSiteBatchStage = "";
      this.publishedSiteBatchSuccessCount = successCount;
      this.publishedSiteBatchFailedCount = failedCount;
      // 不立即设 submitting=false，等调用方延迟后再调 stopPublishedSiteBatch
    },
    stopPublishedSiteBatch() {
      this.publishedSiteBatchStage = "";
      this.publishedSiteBatchSubmitting = false;
    },
  },
});

export const useTemuBatchProgressStoreWithOut = () => useTemuBatchProgressStore(store);
