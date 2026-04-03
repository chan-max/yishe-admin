import { useAppStoreWithOut } from "@/store/modules/app";

const appStore = useAppStoreWithOut();

export const usePageLoading = () => {
  const loadStart = () => {
    appStore.setPageLoading(false);
  };

  const loadDone = () => {
    appStore.setPageLoading(false);
  };

  return {
    loadStart,
    loadDone,
  };
};
