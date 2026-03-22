import type { Request } from 'express'

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export function parsePagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
  const rawLimit = parseInt(req.query.limit as string, 10)
  const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 20 : rawLimit))
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

export function paginatedResponse<T>(rows: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
  return {
    data: rows,
    total,
    page: params.page,
    limit: params.limit,
  }
}
