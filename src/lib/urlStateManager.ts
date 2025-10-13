/**
 * URL State Manager
 *
 * Utilities for persisting table view state (sorting, filtering, visible columns)
 * in URL query parameters, enabling shareable links and persistent views.
 */

export interface ViewState {
  visibleColumns?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  columnFilters?: Record<string, string>
  globalSearch?: string
  page?: number
  limit?: number
}

/**
 * Parse view state from URL search params
 * @param searchParams URLSearchParams object from Next.js
 * @returns ViewState object with all view configuration
 */
export function parseViewStateFromURL(searchParams: URLSearchParams): ViewState {
  const viewState: ViewState = {}

  // Parse visible columns (comma-separated)
  const columns = searchParams.get('columns')
  if (columns) {
    viewState.visibleColumns = columns.split(',').filter(Boolean)
  }

  // Parse sorting
  const sort = searchParams.get('sort')
  if (sort) {
    const [sortBy, sortOrder] = sort.split(':')
    viewState.sortBy = sortBy
    viewState.sortOrder = (sortOrder as 'asc' | 'desc') || 'asc'
  }

  // Parse global search
  const search = searchParams.get('search')
  if (search) {
    viewState.globalSearch = search
  }

  // Parse pagination
  const page = searchParams.get('page')
  if (page) {
    viewState.page = parseInt(page, 10)
  }

  const limit = searchParams.get('limit')
  if (limit) {
    viewState.limit = parseInt(limit, 10)
  }

  // Parse column-specific filters (prefixed with 'filter_')
  const columnFilters: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key.startsWith('filter_') && value) {
      const columnKey = key.replace('filter_', '')
      columnFilters[columnKey] = value
    }
  })
  if (Object.keys(columnFilters).length > 0) {
    viewState.columnFilters = columnFilters
  }

  return viewState
}

/**
 * Serialize view state to URL search params string
 * @param viewState Current view state
 * @returns URL search params string (without leading '?')
 */
export function serializeViewStateToURL(viewState: ViewState): string {
  const params = new URLSearchParams()

  // Add visible columns
  if (viewState.visibleColumns && viewState.visibleColumns.length > 0) {
    params.set('columns', viewState.visibleColumns.join(','))
  }

  // Add sorting
  if (viewState.sortBy) {
    params.set('sort', `${viewState.sortBy}:${viewState.sortOrder || 'asc'}`)
  }

  // Add global search
  if (viewState.globalSearch) {
    params.set('search', viewState.globalSearch)
  }

  // Add pagination
  if (viewState.page !== undefined && viewState.page > 1) {
    params.set('page', viewState.page.toString())
  }

  if (viewState.limit !== undefined) {
    params.set('limit', viewState.limit.toString())
  }

  // Add column filters
  if (viewState.columnFilters) {
    Object.entries(viewState.columnFilters).forEach(([key, value]) => {
      if (value) {
        params.set(`filter_${key}`, value)
      }
    })
  }

  return params.toString()
}

/**
 * Update browser URL with new view state (using window.history.pushState)
 * @param viewState New view state to persist
 * @param pathname Current pathname (from usePathname())
 */
export function updateURLWithViewState(viewState: ViewState, pathname: string): void {
  const queryString = serializeViewStateToURL(viewState)
  const newURL = queryString ? `${pathname}?${queryString}` : pathname

  // Update URL without page reload
  window.history.pushState({}, '', newURL)
}

/**
 * Get shareable link with current view state
 * @param viewState Current view state
 * @param pathname Current pathname
 * @returns Full URL including origin
 */
export function getShareableLink(viewState: ViewState, pathname: string): string {
  const queryString = serializeViewStateToURL(viewState)
  const path = queryString ? `${pathname}?${queryString}` : pathname
  return `${window.location.origin}${path}`
}

/**
 * Merge view state with defaults, ensuring required fields are present
 * @param viewState Partial view state from URL
 * @param defaults Default view state values
 * @returns Complete view state
 */
export function mergeWithDefaults(viewState: Partial<ViewState>, defaults: ViewState): ViewState {
  return {
    ...defaults,
    ...viewState,
    // Ensure arrays/objects are properly merged
    visibleColumns: viewState.visibleColumns || defaults.visibleColumns,
    columnFilters: {
      ...(defaults.columnFilters || {}),
      ...(viewState.columnFilters || {}),
    },
  }
}

/**
 * Check if view state differs from defaults (useful for "Reset" button)
 * @param current Current view state
 * @param defaults Default view state
 * @returns true if views differ, false if identical
 */
export function hasCustomViewState(current: ViewState, defaults: ViewState): boolean {
  // Check columns
  if (
    JSON.stringify(current.visibleColumns?.sort()) !==
    JSON.stringify(defaults.visibleColumns?.sort())
  ) {
    return true
  }

  // Check sorting
  if (current.sortBy !== defaults.sortBy || current.sortOrder !== defaults.sortOrder) {
    return true
  }

  // Check filters
  if (current.globalSearch) {
    return true
  }

  if (
    current.columnFilters &&
    Object.values(current.columnFilters).some((v) => v !== undefined && v !== '')
  ) {
    return true
  }

  return false
}
