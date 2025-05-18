

const json = {
  // 最子集类目id，对应temu cat1Id-cat10Id
  // "catId": 9711, 


  // 商品属性
  "productPropertyReqs": [
    {
      "templatePid": 1281909,
      "pid": 1224,
      "refPid": 1192,
      "propName": "织造方式",
      "vid": 29810,
      "propValue": "梭织",
      "valueUnit": "",
      "numberInputValue": "",
      "valueExtendInfo": ""
    }
  ],

  // // 商品规格，先传空
  // "productSpecPropertyReqs": [],

  // 货品销售域扩展属性请求
  // "productSaleExtAttrReq": {
  //   // 定制工艺
  //   "customizedTechnologyReq": {}
  // },

  // 货品仓配供应链侧扩展属性请求
  "productWhExtAttrReq": {
    // 站外商品链接
    "outerGoodsUrl": "",
    // 货品产地
    "productOrigin": {
      "region1ShortName": "CN",
      "region2Id": 43000000000018
    }
  },

  // 主商品SKU规格 传默认值
  // "mainProductSkuSpecReqs": [
  //   {
  //     "parentSpecId": 0,
  //     "parentSpecName": "",
  //     "specId": 0,
  //     "specName": ""
  //   }
  // ],

  // // SKC货号
  // "extCode": "ECYL",

  // 商品SKU
  "productSkuReqs": [
    {
      // 写死
      "currencyType": "CNY",

      // 货品规格
      "productSkuSpecReqs": [
        {
          "parentSpecId": 3001,
          "parentSpecName": "尺码",
          // "specId": 121009803, 不传
          "specName": "79*71inches(200*180cm)"
        }
      ],

      // 申报价格
      "supplierPrice": 7000,

      // 商品多包规请求，变种属性
      "productSkuMultiPackReq": {
        // 件数
        "numberOfPieces": 1,
        // 是否独立包装 非必填
        "individuallyPacked": 1,
        // 净含量 先传空
        "productSkuNetContentReq": {},
        // sku分类，1：单品，2：同款多件装，3：混合套装
        "skuClassification": 1,
        // 单件单位，1：件，2：双，3：包
        "pieceUnitCode": 1
      },

      // 货品sku建议价格请求
      "productSkuSuggestedPriceReq": {
        // 特殊的建议价格
        "suggestedPrice": "NA"
      },

      // 扩展属性
      "productSkuWhExtAttrReq": {
        // 重量
        "productSkuWeightReq": {
          "value": 400000
        },
        // 敏感属性限制
        "productSkuSensitiveLimitReq": {},
        // 体积
        "productSkuVolumeReq": {
          // 长
          "len": 250,
          // 宽
          "width": 200,
          // 高
          "height": 40
        },
        // 敏感属性
        "productSkuSensitiveAttrReq": {
          // 是否存在敏感属性
          "isSensitive": 0,
          // 敏感属性id列表
          "sensitiveList": []
        }
      }
    }
  ],

  // 尺码表 用我们的结构
  "sizeTemplate": {},

  // // 外包装属性
  // "productOuterPackageReq": {
  //   // 外包装形状
  //   "packageShape": 0,
  //   // 外包装类型
  //   "packageType": 2
  // },

  // 外包装图片
  "productOuterPackageImageReqs": [
    {
      "imageUrl": "https://kjpfs-cn.kuajingmaihuo.com/product-material-private-tag/2013f778ba8/a333cec1-fc7f-49b8-9d29-912177994a4c_646x657.png"
    }
  ],

  // 详情信息
  // "goodsLayerDecorationReqs": [
  //   {
  //     "lang": "zh",
  //     "key": "DecImage",
  //     "type": "text",
  //     "priority": 4,
  //     "contentList": [
  //       {
  //         "text": "【Multi-Purpose & Ideal Gift Choice】 Not just a shower curtain! Use it as a decorative backdrop, window curtain, or room divider. With various styles available, it complements modern, boho, minimalist, or vintage home décor. A thoughtful gift for housewarming, birthdays, or holiday celebrations.",
  //         "textModuleDetails": {
  //           "fontSize": 12,
  //           "fontColor": "#333333",
  //           "align": "left",
  //           "backgroundColor": "#ffffff"
  //         }
  //       }
  //     ]
  //   },
  //   {
  //     "lang": "zh",
  //     "key": "DecImage",
  //     "type": "image",
  //     "priority": 11,
  //     "contentList": [
  //       {
  //         "height": 800,
  //         "width": 800
  //       }
  //     ]
  //   }
  // ]
}