export function normalizeHttpUrlList(input: unknown): string[] {
  const values = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(/\r?\n/)
      : []

  return Array.from(
    new Set(
      values
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .filter((item) => /^https?:\/\//i.test(item))
    )
  )
}

export function normalizeTemuCategoryPath(input: unknown): string[] {
  if (Array.isArray(input)) {
    return Array.from(
      new Set(
        input
          .map((item) => String(item || '').trim())
          .filter(Boolean)
      )
    )
  }

  const raw = String(input || '').trim()
  if (!raw) {
    return []
  }

  const tryParseJsonArray = (value: string) => {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed)
        ? parsed.map((item) => String(item || '').trim()).filter(Boolean)
        : []
    } catch {
      return []
    }
  }

  const parsedJsonArray = tryParseJsonArray(raw)
  const jsonArray = parsedJsonArray.length > 0
    ? parsedJsonArray
    : tryParseJsonArray(raw.replace(/'/g, '"'))
  if (jsonArray.length > 0) {
    return Array.from(new Set(jsonArray))
  }

  return Array.from(
    new Set(
      raw
        .split(/\r?\n|,|，|>|\/|\\|\|/g)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}
