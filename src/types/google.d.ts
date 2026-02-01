/**
 * Global type declarations for Google APIs
 * Based on specs/001-google-sheets-integration/research.md
 */

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: any) => void
          }) => {
            requestAccessToken: () => void
            callback: (response: any) => void
          }
        }
      }
    }
    gapi: typeof import('gapi-script').gapi
  }
}

export {}
