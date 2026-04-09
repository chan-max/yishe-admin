import type { PlatformConfig } from './types'

export const temuPlatformConfig: PlatformConfig = {
  platform: 'temu',
  label: 'Temu',
  description: 'Temu 跨境电商平台配置',
  supportVideo: false,
  supportImage: true,
  titleMaxLength: 60,
  fields: [
    {
      key: 'account',
      label: '账号',
      type: 'input',
      placeholder: '请输入 Temu 登录账号',
      span: 12
    },
    {
      key: 'password',
      label: '密码',
      type: 'input',
      inputType: 'password',
      placeholder: '请输入 Temu 登录密码',
      span: 12
    },
    {
      key: 'needLogin',
      label: '是否需要登录',
      type: 'switch',
      defaultValue: false,
      span: 12,
      tooltip: '开启后，执行发布前会按模板提供的账号密码进行登录准备'
    },
    {
      key: 'categoryPath',
      label: '类目路径',
      type: 'textarea',
      placeholder: '请输入类目数组，例如：[\"厨房\",\"毛巾\"]',
      rows: 3,
      span: 24,
      tooltip: '按类目级联顺序填写。保存后会转成数组，用于运行时逐列匹配点击'
    }
  ]
}
