export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface PaginationMetadata {
  page: number
  limit: number
  total: number
  totalPages: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface PaginatedResponse<T> {
  data: T[]
  metadata: PaginationMetadata
}

export function getPaginationParams(query: Record<string, any>): { 
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
} {
  const page = query.page ? parseInt(query.page as string, 10) : 1
  const limit = query.limit ? parseInt(query.limit as string, 10) : 10
  const search = query.search as string | undefined
  const sortBy = query.sortBy as string | undefined
  const sortOrder = (query.sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'

  // Extract filters (all query params except pagination/sort/search params)
  const excludeParams = ['page', 'limit', 'search', 'sortBy', 'sortOrder']
  const filters: Record<string, any> = {}
  for (const [key, value] of Object.entries(query)) {
    if (!excludeParams.includes(key) && value !== undefined && value !== null && value !== '') {
      filters[key] = value
    }
  }

  return {
    page: Math.max(1, page),
    limit: Math.max(1, Math.min(100, limit)), // Cap at 100
    search,
    sortBy,
    sortOrder,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  }
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: { 
    page: number
    limit: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit)

  return {
    data,
    metadata: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      ...(params.search && { search: params.search }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
      ...(params.filters && { filters: params.filters }),
    },
  }
}

