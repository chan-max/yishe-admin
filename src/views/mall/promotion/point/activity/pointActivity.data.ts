import type { CrudSchema } from '@/hooks/web/useCrudSchemas'

// 表单校验
export const rules = reactive({
  spuId: [required],
  sort: [required]
})

// CrudSchema https://doc.iocoder.cn/vue3/crud-schema/
const crudSchemas = reactive<CrudSchema[]>([
  {
    label: '排序',
    field: 'sort',
    form: {
      component: 'InputNumber',
      value: 0
    },
    table: {
      width: 80
    }
  },
  {
    label: '关键词标签',
    field: 'keywords',
    isSearch: true,
    search: {
      componentProps: {
        placeholder: '请输入关键词搜索',
        style: {
          width: '240px'
        }
      }
    },
    form: {
      component: 'Input',
      componentProps: {
        placeholder: '请输入关键词，用逗号分隔，如：热门,推荐,新品',
        maxlength: 200,
        showWordLimit: true
      },
      labelMessage: '多个关键词请用逗号分隔'
    },
    table: {
      width: 200
    }
  },
  {
    label: '积分商城活动商品',
    field: 'spuId',
    isTable: true,
    isSearch: false,
    form: {
      colProps: {
        span: 24
      }
    },
    table: {
      width: 300
    }
  },
  {
    label: '备注',
    field: 'remark',
    isSearch: false,
    form: {
      component: 'Input',
      componentProps: {
        type: 'textarea',
        rows: 4
      },
      colProps: {
        span: 24
      }
    },
    table: {
      width: 300
    }
  }
])
export const { allSchemas } = useCrudSchemas(crudSchemas)
