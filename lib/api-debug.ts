type JsonLike = Record<string, unknown> | unknown[] | string | number | boolean | null | undefined

export function logApiRequest(route: string, details: JsonLike) {
  console.log(`[API] ${route}`, details)
}

export function logApiError(route: string, error: unknown, details?: JsonLike) {
  console.error(`[API] Error en ${route}`, { details, error })
}
