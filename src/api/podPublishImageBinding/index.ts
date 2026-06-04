import request from "@/config/axios";

export const podPublishImageBindingApi = {
  // 分页查询图片发布绑定记录（POST）
  page: (data: {
    currentPage?: number;
    pageSize?: number;
    psdSetId?: string;
    stickerId?: string;
    publishConfigId?: string;
    status?: string;
  }) =>
    request.post({
      url: "/pod-publish-image-binding/page",
      data,
    }),
  // 查询发布配置可选列表
  getPublishConfigOptions: () =>
    request.get({ url: "/pod-publish-image-binding/publish-config-options" }),
};
