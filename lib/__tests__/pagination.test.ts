/**
 * Tests de lib/pagination.ts
 */
import { buildPagination, parsePagination } from '@/lib/pagination'

describe('lib/pagination', () => {
  it('parsePagination usa defaults cuando no hay query params', () => {
    const params = parsePagination(new URLSearchParams())
    expect(params).toEqual({ page: 1, limit: 50, skip: 0 })
  })

  it('parsePagination calcula skip correctamente', () => {
    const params = parsePagination(new URLSearchParams('page=3&limit=10'))
    expect(params).toEqual({ page: 3, limit: 10, skip: 20 })
  })

  it('parsePagination limita el máximo a 100', () => {
    const params = parsePagination(new URLSearchParams('limit=999'))
    expect(params.limit).toBe(100)
  })

  it('buildPagination indica hasNextPage y hasPrevPage', () => {
    expect(buildPagination(1, 10, 25)).toMatchObject({
      currentPage: 1,
      totalPages: 3,
      totalItems: 25,
      hasNextPage: true,
      hasPrevPage: false,
    })

    expect(buildPagination(3, 10, 25)).toMatchObject({
      hasNextPage: false,
      hasPrevPage: true,
    })
  })
})
