/**
 * Google API Configuration
 * Based on specs/001-google-sheets-integration/research.md
 */

export interface GoogleConfig {
  clientId: string
  apiKey: string
  spreadsheetId: string
  sheetName: string
  scope: string
  discoveryDocs: string[]
}

/**
 * Get Google API configuration from environment variables
 * Throws error if required variables are missing
 */
export function getGoogleConfig(): GoogleConfig {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID
  const apiKey = '' // API key not required for Google sheets
  
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID is not set in environment variables')
  }
  
  if (!spreadsheetId) {
    throw new Error('VITE_SPREADSHEET_ID is not set in environment variables')
  }

  return {
    clientId,
    apiKey,
    spreadsheetId,
    sheetName: import.meta.env.VITE_SHEET_NAME || 'Sheet1',
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    discoveryDocs: [
      'https://sheets.googleapis.com/$discovery/rest?version=v4'
    ]
  }
}

// Export default config instance
export const GOOGLE_CONFIG = getGoogleConfig()
