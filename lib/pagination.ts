/**
 * PAGINACIÓN CENTRALIZADA
 * =======================
 *
 * Problema: cada endpoint inventaba su propio `page`/`limit` distinto.
 * Solución: un solo módulo con reglas consistentes para toda la API.
 *
 * Query params estándar en cualquier listado:
 *   GET /api/users?page=2&limit=20
 *
 * Respuesta estándar (junto con los datos):
 *   { users: [...], pagination: { currentPage, totalPages, totalItems, ... } }
 *
 * Reglas:
 * - page mínimo: 1
 * - limit por defecto: configurable por endpoint (50 usual)
 * - limit máximo: 100 (evita que un cliente pida 10.000 registros)
 */

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 50
export const MAX_LIMIT = 100

export type PaginationParams = {
  page: number
  limit: number
  skip: number
}

export type PaginationMeta = {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/**
 * Lee ?page= y ?limit= de la URL y devuelve valores seguros.
 * @param defaultLimit — algunos endpoints usan 10 (rutinas) u otro valor
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaultLimit: number = DEFAULT_LIMIT,
): PaginationParams {
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || String(DEFAULT_PAGE), 10) || DEFAULT_PAGE)
  const parsedLimit = Number.parseInt(searchParams.get('limit') || String(defaultLimit), 10) || defaultLimit
  const limit = Math.min(Math.max(1, parsedLimit), MAX_LIMIT)
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

/** Construye el objeto `pagination` que el frontend puede usar para navegar páginas. */
export function buildPagination(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}
