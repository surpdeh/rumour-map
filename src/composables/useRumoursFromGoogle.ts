import { ref } from 'vue'
import { GOOGLE_CONFIG } from '../config/google'
import { useGoogleAuth } from './useGoogleAuth'
import type { 
  Rumour, 
  GoogleSheetsRow, 
  UseRumoursFromGoogleReturn,
  SheetsApiError 
} from '../types/rumour'

declare global {
  interface Window {
    gapi: any
  }
}

const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

interface CachedData {
  rumours: Rumour[]
  timestamp: Date
}

let cachedData: CachedData | null = null

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false
  const normalized = value.toLowerCase().trim()
  return normalized === 'true' || normalized === 'yes' || normalized === '1'
}

function parseNumber(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null
  const parsed = parseFloat(value)
  return isNaN(parsed) ? null : parsed
}

function transformRow(row: GoogleSheetsRow, index: number): Rumour {
  return {
    id: `rumour-${index}`,
    session_date: row.session_date || null,
    game_date: row.game_date || null,
    location_heard: row.location_heard || null,
    location_targetted: row.location_targetted || null,
    x: parseFloat(row.X) || 0,
    y: parseFloat(row.Y) || 0,
    title: row.title || 'Untitled',
    rating: parseNumber(row.rating),
    resolved: parseBoolean(row.resolved),
    details: row.details || null,
    isPinned: true,
    isHovered: false,
    isHidden: false,
    isDragging: false
  }
}

function getErrorMessage(error: any): string {
  if (error?.result?.error) {
    const apiError = error.result.error as SheetsApiError
    switch (apiError.code) {
      case 401:
        return 'Authentication required. Please sign in with Google.'
      case 403:
        return 'Access denied. Please check spreadsheet sharing permissions.'
      case 404:
        return 'Spreadsheet not found. Please verify the spreadsheet ID.'
      case 429:
        return 'Too many requests. Please try again later.'
      default:
        return apiError.message || 'Failed to load rumours'
    }
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unknown error occurred'
}

export function useRumoursFromGoogle(): UseRumoursFromGoogleReturn {
  const rumours = ref<Rumour[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchTime = ref<Date | null>(null)

  const { authState, signIn } = useGoogleAuth()

  async function fetchFromSheets(): Promise<Rumour[]> {
    if (!window.gapi?.client?.sheets) {
      throw new Error('Google Sheets API not initialized')
    }

    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
        range: GOOGLE_CONFIG.sheetName
      })

      const rows = response.result.values
      if (!rows || rows.length === 0) {
        return []
      }

      const headers = rows[0]
      const dataRows = rows.slice(1)

      // Map headers to create objects
      const mappedRumours = dataRows.map((row: string[], index: number) => {
        const obj: any = {}
        headers.forEach((header: string, i: number) => {
          obj[header] = row[i] ?? null
        })
        return transformRow(obj as GoogleSheetsRow, index)
      })

      return mappedRumours
    } catch (err) {
      throw err
    }
  }

  async function loadRumours(): Promise<void> {
    // Check cache first
    if (cachedData) {
      const age = Date.now() - cachedData.timestamp.getTime()
      if (age < CACHE_DURATION_MS) {
        rumours.value = cachedData.rumours
        lastFetchTime.value = cachedData.timestamp
        error.value = null
        return
      }
    }

    isLoading.value = true
    error.value = null

    try {
      // Ensure user is authenticated
      if (!authState.value.isAuthenticated) {
        await signIn()
      }

      const fetchedRumours = await fetchFromSheets()
      
      rumours.value = fetchedRumours
      const now = new Date()
      lastFetchTime.value = now
      
      // Update cache
      cachedData = {
        rumours: fetchedRumours,
        timestamp: now
      }
    } catch (err) {
      console.error('Failed to load rumours:', err)
      error.value = getErrorMessage(err)
      rumours.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function refreshRumours(): Promise<void> {
    // Clear cache
    cachedData = null
    await loadRumours()
  }

  return {
    rumours,
    isLoading,
    error,
    lastFetchTime,
    loadRumours,
    refreshRumours
  }
}
