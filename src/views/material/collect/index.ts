import { ref } from 'vue'
import { getMaterialConfigApi } from '@/api/material'

export interface GetPictureParams {
  type: number, // 使用哪个网站
  searchContent: string, // 搜索内容
  downloadCount: number, // 下载量：需要爬取多少图片
  likedCount: number, // 点赞数
  category:number, // 分类
  aspectRatio:number // 图片比例
}


export const categoryOptions = ref([
  {
    label: "鼠标垫",
    value: "鼠标垫",
  },
  {
    label: "挂毯",
    value: "挂毯",
  },
  {
    label: "手机壳",
    value: "手机壳",
  },
  {
    label: "壁纸",
    value: "壁纸",
  },
  {
    label: "桌布",
    value: "桌布",
  },
]) 


export const materialConfig = ref({
  crawlerWebsite: [
  ],
  hotSellers: []
})

export async function getMaterialConfig(){
  let res = await getMaterialConfigApi(null)
   materialConfig.value = res
}
