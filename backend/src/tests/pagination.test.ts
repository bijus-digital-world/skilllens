import { describe, it, expect } from 'vitest'
import { parsePagination, paginatedResponse } from '../utils/pagination'

describe('parsePagination', () => {
  const mockReq = (query: Record<string, string>) => ({ query }) as never

  it('returns defaults when no params', () => {
    const result = parsePagination(mockReq({}))
    expect(result).toEqual({ page: 1, limit: 20, offset: 0 })
  })

  it('parses page and limit', () => {
    const result = parsePagination(mockReq({ page: '3', limit: '10' }))
    expect(result).toEqual({ page: 3, limit: 10, offset: 20 })
  })

  it('clamps page to minimum 1', () => {
    const result = parsePagination(mockReq({ page: '-5' }))
    expect(result.page).toBe(1)
  })

  it('clamps limit to maximum 100', () => {
    const result = parsePagination(mockReq({ limit: '500' }))
    expect(result.limit).toBe(100)
  })

  it('clamps limit to minimum 1', () => {
    const result = parsePagination(mockReq({ limit: '0' }))
    expect(result.limit).toBe(1)
  })

  it('handles non-numeric values', () => {
    const result = parsePagination(mockReq({ page: 'abc', limit: 'xyz' }))
    expect(result).toEqual({ page: 1, limit: 20, offset: 0 })
  })
})

describe('paginatedResponse', () => {
  it('wraps data with pagination metadata', () => {
    const result = paginatedResponse(['a', 'b'], 50, { page: 2, limit: 10, offset: 10 })
    expect(result).toEqual({
      data: ['a', 'b'],
      total: 50,
      page: 2,
      limit: 10,
    })
  })
})
