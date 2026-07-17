/**
 * 商品分类配置
 * 用于二维印花商品的分类定义
 */

export interface ProductCategory {
  value: string; // 分类值
  label: string; // 分类名称
  icon: string; // 图标标识（用于生成图片路径）
  image: string; // 图片路径（相对于 public 目录）
  description?: string; // 分类描述
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    value: '鼠标垫',
    label: '鼠标垫',
    icon: 'mousepad',
    image: '/product-categories/mousepad.jpg',
    description: '个性化定制鼠标垫',
  },
  {
    value: '挂毯',
    label: '挂毯',
    icon: 'tapestry',
    image: '/product-categories/tapestry.jpg',
    description: '装饰性挂毯',
  },
  {
    value: '名片',
    label: '名片',
    icon: 'business-card',
    image: '/product-categories/business-card.jpg',
    description: '个性化名片',
  },
  {
    value: '贺卡',
    label: '贺卡',
    icon: 'greeting-card',
    image: '/product-categories/greeting-card.jpg',
    description: '节日贺卡',
  },
  {
    value: 'T恤',
    label: 'T恤',
    icon: 'tshirt',
    image: '/product-categories/tshirt.jpg',
    description: 'T恤衫',
  },
  {
    value: '卫衣',
    label: '卫衣',
    icon: 'hoodie',
    image: '/product-categories/hoodie.jpg',
    description: '连帽卫衣',
  },
  {
    value: '帆布袋',
    label: '帆布袋',
    icon: 'tote-bag',
    image: '/product-categories/tote-bag.jpg',
    description: '帆布手提袋',
  },
  {
    value: '海报',
    label: '海报',
    icon: 'poster',
    image: '/product-categories/poster.jpg',
    description: '宣传海报',
  },
  {
    value: '明信片',
    label: '明信片',
    icon: 'postcard',
    image: '/product-categories/postcard.jpg',
    description: '明信片',
  },
  {
    value: '贴纸',
    label: '贴纸',
    icon: 'sticker',
    image: '/product-categories/sticker.jpg',
    description: '不干胶贴纸',
  },
];

export function normalizeProductType(value: unknown): string {
  const productType = String(value || '').trim();
  if (!productType) return '';

  const compactType = productType.replace(/\s+/g, '');
  if (/测试|模版|模板/i.test(compactType)) return '';
  if (/^(PSD套图|PSD|套图|商品|产品|POD)$/i.test(compactType)) return '';
  return productType;
}

/**
 * 根据分类值获取分类信息
 */
export function getCategoryByValue(value: string): ProductCategory | undefined {
  return PRODUCT_CATEGORIES.find((cat) => cat.value === value);
}

/**
 * 获取分类图片路径
 */
export function getCategoryImage(category: ProductCategory): string {
  return category.image || '/product-categories/default.jpg';
}
