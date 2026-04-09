export interface PlatformHandler {
  platform: string
  validateConfig?: (configData: Record<string, any>) => { valid: boolean; errors: string[] }
  formatConfigForSubmit?: (configData: Record<string, any>) => Record<string, any>
  formatConfigForEdit?: (configData: Record<string, any>) => Record<string, any>
  getHints?: () => string[]
  beforeSubmit?: (formData: any) => any
}
