export function normalizeProductType(value: unknown): string {
  return String(value || '').trim();
}
