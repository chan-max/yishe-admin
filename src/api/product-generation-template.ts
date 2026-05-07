import request from "@/config/axios";

export const productGenerationTemplateApi = {
  getList(data: any) {
    return request.post({
      url: "/product-generation-template/page",
      data,
    });
  },

  getDetail(id: string) {
    return request.get({
      url: `/product-generation-template/${id}`,
    });
  },

  add(data: any) {
    return request.post({
      url: "/product-generation-template/create",
      data,
    });
  },

  update(data: any) {
    return request.post({
      url: "/product-generation-template/update",
      data,
    });
  },

  delete(id: string) {
    return request.post({
      url: "/product-generation-template/delete",
      data: { id },
    });
  },
};
