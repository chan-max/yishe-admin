import Mock from 'mockjs'

export function sleep(time = 1000){
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null)
    }, time * Math.random());
  })
}

export function toPromiseData(data){
  return new Promise((resolve) => {{
    resolve(data)
  }})
}

function randomImagePath(){
  const width = Mock.mock('@integer(500, 1920)'); // 随机宽度，范围 500-1920
  const height = Mock.mock('@integer(500, 1080)'); // 随机高度，范围 500-1080

  const path = `https://picsum.photos/seed/${Mock.mock('@id')}/${width}/${height}`;

  return path
}

// 生成模拟数据

export const paginationData =(params?) => {
  return  Mock.mock({
    [`list|${params?.size || 15}`]: [ // 生成 15 条记录
      {
        label:'@string(10)',
        value:'@integer(1000, 9999)',
        ossObjectName: () => `https://picsum.photos/seed/${Mock.mock('@id')}/680/920`, // 随机单个图片
        imageName:'@string("lower", 10)',
        resolution:'1200*920',
        'checkType|1': [0, 1],
        id: '@integer(1000, 9999)', // 随机 ID
        skcId: '@string(10)', // 随机 9 位数字字符串
        skuNo: 'LN@integer(1000, 9999)', // 随机 SKU 编号
        shopName: 'ThreadTerrace', // 固定店铺名称
        categoryName:'鼠标垫|挂毯',
        productCount:12,
        imageFolder: 'LN@integer(1000, 9999)', // 随机图片文件夹名称
        elementWords: '', // 空字符串
        category: '挂毯', // 固定分类
        creatorName:'吴某某',
        titleTemplate: '@sentence(20, 50)', // 随机生成标题模板
        gptTemplate: '你现在扮演一位亚马逊高级电商运营人员，拥有丰富的产品营销和市场推广经验。接下来，我会向你提供一张图片，你需要帮我写一个英文标题，要仔细分析图片内容，提取出与商品相关的主要关键词（例如风格、用途、色彩、尺寸、特色等），根据提取出的关键词和亚马逊电商平台的需求，生成一段吸引眼球的电商商品标题。标题需要详细描述商品信息，比如风格、用途、尺寸、卖点、适合人群等，确保标题具有足够的描述性和营销吸引力。',
        gptPrompt: '"XXX Pattern Tapestry - XXX Polyester Wall Hanging, Landscape Themed Decor for Living Room, Bedroom, Office -XXX Room decoration 37*29/59*51/78*59 inch Preferred Housewarming Gifts"请根据模板的基础内容，结合接下来我发你的图片图案和风格，帮我写一个挂毯商品英文标题，请按照我给你发的图片顺序撰写，37*29inch 59*51inch 78*59 inch三个尺寸都要包含，后缀可以灵活一点，比如侧重适合近期节日的礼物，或适合春天送朋友的礼物，但也要注意变通，不要总是固定一个格式，不要带XXX,整体英文标题严格保持字符数量230-245之间 不要符号',
        carouselImages: '[1,2,3,4,5,6,7,8]', // 固定轮播图
        detailImages: '[1,2,3,4,5,6,7,8]', // 固定详情图
        completion: 0, // 固定完成度
        hasComposite: 2, // 固定值
        shopTemplate: null, // 空值
        createTime: '@datetime("yyyy-MM-dd HH:mm:ss")', // 随机创建时间
        updateTime: '@datetime("yyyy-MM-dd HH:mm:ss")', // 随机更新时间
        'imageList|10': [ // 随机生成 10 张真实网络图片 URL
          // 使用 Picsum 的随机图片服务
          () => `https://picsum.photos/seed/${Mock.mock('@id')}/200/300`,
        ],
      },
    ],
    total: 1587, // 固定总记录数
    size: 20, // 固定每页大小
    current: 1, // 固定当前页码
    orders: [], // 空数组
    optimizeCountSql: true, // 固定值
    searchCount: true, // 固定值
    maxLimit: null, // 空值
    countId: null, // 空值
    pages: 106, // 固定总页数
  });
}


export function getPaginationMockData(params?){
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(paginationData(params))
    },100 * Math.random())
  })
}