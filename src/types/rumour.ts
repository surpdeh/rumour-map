/**
 * TypeScript interfaces for rumour data and Google Sheets integration
 * Based on specs/001-google-sheets-integration/data-model.md
 */

/**
 * Rumour data structure loaded from Google Sheets
 * Includes both source data and UI state
 */
export interface Rumour {
  // Google Sheets source data
  id: string                  // Generated from row index (e.g., "rumour-0")
  session_date: string | null // When rumour was recorded (session date)
  game_date: string | null    // In-game date/time
  location_heard: string | null // Where players heard the rumour
  location_targetted: string | null // Location rumour refers to
  x: number                   // Map X coordinate (0-6500)
  y: number                   // Map Y coordinate (0-3600)
  title: string               // Rumour title/summary
  rating: number | null       // Quality/importance rating (0-10)
  resolved: boolean           // Whether rumour is resolved
  details: string | null      // Full rumour description
  
  // UI state (not persisted)
  isPinned: boolean           // Whether marker is pinned
  isHovered: boolean          // Whether marker is being hovered
  isHidden: boolean           // Whether marker is hidden from view
  isDragging: boolean         // Whether marker is being dragged
}

/**
 * Raw row data from Google Sheets API
 * All values are strings until parsed
 */
export interface GoogleSheetsRow {
  session_date?: string       // Column A
  game_date?: string          // Column B
  location_heard?: string     // Column C
  location_targetted?: string // Column D
  X: string                   // Column E - parsed to number
  Y: string                   // Column F - parsed to number
  title: string               // Column G
  rating?: string             // Column H - parsed to number
  resolved?: string           // Column I - parsed to boolean
  details?: string            // Column J
}

/**
 * Filter state for rumours
 */
export interface RumourFilterState {
  filterMode: 'all' | 'resolved' | 'unresolved'
  totalCount: number
  resolvedCount: number
  unresolvedCount: number
}

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean
  isInitializing: boolean
  error: string | null
  user: {
    email: string | null
    name: string | null
  } | null
}

/**
 * Google Sheets API error
 */
export interface SheetsApiError {
  code: number
  message: string
  status: string
}

/**
 * Composable return type for useRumoursFromGoogle
 */
export interface UseRumoursFromGoogleReturn {
  rumours: import('vue').Ref<Rumour[]>
  isLoading: import('vue').Ref<boolean>
  error: import('vue').Ref<string | null>
  lastFetchTime: import('vue').Ref<Date | null>
  loadRumours: () => Promise<void>
  refreshRumours: () => Promise<void>
}

/**
 * Composable return type for useGoogleAuth
 */
export interface UseGoogleAuthReturn {
  authState: import('vue').Ref<AuthState>
  signIn: () => Promise<void>
  signOut: () => void
  isAuthenticated: import('vue').ComputedRef<boolean>
}

/**
 * Composable return type for useRumourFilter
 */
export interface UseRumourFilterReturn {
  filterState: import('vue').Ref<RumourFilterState>
  filteredRumours: import('vue').ComputedRef<Rumour[]>
  setFilter: (mode: 'all' | 'resolved' | 'unresolved') => void
}
