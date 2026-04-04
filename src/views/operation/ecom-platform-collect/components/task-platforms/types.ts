export type EcomCollectSceneKey = "search" | "product_detail" | "shop_hot_products";

export interface EcomCollectPlatformFormSpec {
  platform: string;
  title: string;
  description?: string;
  taskNamePlaceholder?: string;
  keywordPlaceholder?: string;
  keywordsPlaceholder?: string;
  targetUrlPlaceholder?: string;
  extraJsonPlaceholder?: string;
  notes?: string[];
  sceneNotes?: Partial<Record<EcomCollectSceneKey, string[]>>;
}
