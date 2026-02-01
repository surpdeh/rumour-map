import { ref, computed } from 'vue'
import { GOOGLE_CONFIG } from '../config/google'
import type { AuthState, UseGoogleAuthReturn } from '../types/rumour'

declare global {
  interface Window {
    google: any
    gapi: any
  }
}

let tokenClient: any = null
let gapiInitialized = false

export function useGoogleAuth(): UseGoogleAuthReturn {
  const authState = ref<AuthState>({
    isAuthenticated: false,
    isInitializing: true,
    error: null,
    user: null
  })

  const isAuthenticated = computed(() => authState.value.isAuthenticated)

  async function initGapi(): Promise<void> {
    if (gapiInitialized) return

    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        authState.value.error = 'Google API library not loaded'
        authState.value.isInitializing = false
        reject(new Error('Google API library not loaded'))
        return
      }

      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: GOOGLE_CONFIG.apiKey,
            discoveryDocs: GOOGLE_CONFIG.discoveryDocs
          })
          gapiInitialized = true
          authState.value.isInitializing = false
          resolve()
        } catch (error) {
          authState.value.error = 'Failed to initialize Google API'
          authState.value.isInitializing = false
          reject(error)
        }
      })
    })
  }

  function initTokenClient(): void {
    if (tokenClient) return

    if (!window.google?.accounts?.oauth2) {
      authState.value.error = 'Google Identity Services not loaded'
      return
    }

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CONFIG.clientId,
      scope: GOOGLE_CONFIG.scope,
      callback: (response: any) => {
        if (response.error) {
          authState.value.error = response.error
          authState.value.isAuthenticated = false
          authState.value.user = null
        } else {
          authState.value.isAuthenticated = true
          authState.value.error = null
          // Note: OAuth2 token client doesn't provide user info by default
          // We'd need to make a separate API call to get user details if needed
        }
      }
    })
  }

  async function signIn(): Promise<void> {
    try {
      authState.value.error = null
      
      await initGapi()
      initTokenClient()

      if (!tokenClient) {
        throw new Error('Failed to initialize token client')
      }

      return new Promise((resolve, reject) => {
        tokenClient.callback = (response: any) => {
          if (response.error) {
            authState.value.error = response.error
            authState.value.isAuthenticated = false
            authState.value.user = null
            reject(new Error(response.error))
          } else {
            authState.value.isAuthenticated = true
            authState.value.error = null
            resolve()
          }
        }
        tokenClient.requestAccessToken({ prompt: 'consent' })
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      authState.value.error = message
      authState.value.isAuthenticated = false
      throw error
    }
  }

  function signOut(): void {
    const token = window.gapi?.client?.getToken()
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {
        window.gapi.client.setToken(null)
      })
    }
    
    authState.value.isAuthenticated = false
    authState.value.user = null
    authState.value.error = null
  }

  // Initialize on creation
  initGapi().catch(() => {
    // Error already set in authState
  })

  return {
    authState,
    signIn,
    signOut,
    isAuthenticated
  }
}
