
// 工艺枚举
export var TECHNOLOGY_TYPE = {
  "10001": {
    "name": "基础工艺（无需审版）",
    "map": {}
  },
  "10002": {
    "name": "木制品定制工艺",
    "map": {
      "20001": {
        "name": "激光雕刻-文字",
        "map": {}
      },
      "20002": {
        "name": "激光雕刻-图片",
        "map": {}
      },
      "20003": {
        "name": "机械雕刻-文字",
        "map": {}
      },
      "20004": {
        "name": "机械雕刻-图片",
        "map": {}
      }
    }
  },
  "10003": {
    "name": "金属制品定制工艺",
    "map": {
      "20005": {
        "name": "焊接",
        "map": {}
      },
      "20006": {
        "name": "蚀刻",
        "map": {}
      },
      "20007": {
        "name": "UV",
        "map": {}
      },
      "20008": {
        "name": "丝网印刷-文字",
        "map": {}
      },
      "20009": {
        "name": "丝网印刷-图片",
        "map": {}
      },
      "20010": {
        "name": "喷漆",
        "map": {}
      },
      "20011": {
        "name": "滴油",
        "map": {}
      },
      "20012": {
        "name": "滴胶-文字",
        "map": {}
      },
      "20013": {
        "name": "滴胶-图片",
        "map": {}
      },
      "20001": {
        "name": "激光雕刻-文字",
        "map": {}
      },
      "20002": {
        "name": "激光雕刻-图片",
        "map": {}
      },
      "20003": {
        "name": "机械雕刻-文字",
        "map": {}
      },
      "20004": {
        "name": "机械雕刻-图片",
        "map": {}
      },
      "20014": {
        "name": "激光切割-文字",
        "map": {}
      },
      "20015": {
        "name": "激光切割-图片",
        "map": {}
      },
      "20016": {
        "name": "镶钻",
        "map": {}
      },
      "20024": {
        "name": "电镀",
        "map": {}
      }
    }
  },
  "10004": {
    "name": "皮具/布艺定制工艺",
    "map": {
      "20017": {
        "name": "烫金-文字",
        "map": {}
      },
      "20018": {
        "name": "烫金-图片",
        "map": {}
      },
      "20019": {
        "name": "锡金",
        "map": {}
      },
      "20020": {
        "name": "热转印-文字",
        "map": {}
      },
      "20021": {
        "name": "热转印-图片",
        "map": {}
      },
      "20007": {
        "name": "UV",
        "map": {}
      },
      "20008": {
        "name": "丝网印刷-文字",
        "map": {}
      },
      "20009": {
        "name": "丝网印刷-图片",
        "map": {}
      },
      "20012": {
        "name": "滴胶-文字",
        "map": {}
      },
      "20013": {
        "name": "滴胶-图片",
        "map": {}
      },
      "20011": {
        "name": "滴油",
        "map": {}
      },
      "20001": {
        "name": "激光雕刻-文字",
        "map": {}
      },
      "20002": {
        "name": "激光雕刻-图片",
        "map": {}
      },
      "20022": {
        "name": "刺绣",
        "map": {}
      },
      "20023": {
        "name": "植绒",
        "map": {}
      },
      "20025": {
        "name": "烫画-文字",
        "map": {}
      },
      "20026": {
        "name": "烫画-图片",
        "map": {}
      },
      "20027": {
        "name": "数码直喷",
        "map": {}
      },
      "20033": {
        "name": "压印",
        "map": {}
      },
      "20035": {
        "name": "机织图案-胶贴",
        "map": {}
      }
    }
  },
  "10005": {
    "name": "有机材料（亚克力/树脂等）定制工艺",
    "map": {
      "20001": {
        "name": "激光雕刻-文字",
        "map": {}
      },
      "20002": {
        "name": "激光雕刻-图片",
        "map": {}
      },
      "20003": {
        "name": "机械雕刻-文字",
        "map": {}
      },
      "20004": {
        "name": "机械雕刻-图片",
        "map": {}
      },
      "20014": {
        "name": "激光切割-文字",
        "map": {}
      },
      "20015": {
        "name": "激光切割-图片",
        "map": {}
      },
      "20007": {
        "name": "UV",
        "map": {}
      },
      "20008": {
        "name": "丝网印刷-文字",
        "map": {}
      },
      "20009": {
        "name": "丝网印刷-图片",
        "map": {}
      },
      "20034": {
        "name": "美甲手绘",
        "map": {}
      }
    }
  },
  "10006": {
    "name": "画布/纸张定制工艺",
    "map": {
      "20028": {
        "name": "手绘-素描",
        "map": {}
      },
      "20029": {
        "name": "手绘-水彩",
        "map": {}
      },
      "20030": {
        "name": "手绘-油画",
        "map": {}
      },
      "20031": {
        "name": "手绘-版画",
        "map": {}
      },
      "20032": {
        "name": "手绘-漫画",
        "map": {}
      },
      "20033": {
        "name": "压印",
        "map": {}
      }
    }
  }
}

function mapToOptions(map) {
  return Object.entries(map).map(([key, value]) => {

    return {
      value: key,
      label: value.name,
    }
  })
}

export const TECHNOLOGY_TYPE_OPTIONS = Object.entries(TECHNOLOGY_TYPE).map(([key, value]) => {
  let children = mapToOptions(value.map)
  return {
    value: key,
    label: value.name,
    children: children
  }
})


export function findChildrenOptions(pval){
  let item = TECHNOLOGY_TYPE_OPTIONS.find((item) => item.value == pval)
  return item ? item.children : []
}
