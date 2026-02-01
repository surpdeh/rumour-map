<template>
  <div class="google-auth-button">
    <button
      v-if="!isAuthenticated"
      @click="handleSignIn"
      :disabled="isLoading"
      class="btn btn-primary"
      :class="{ 'btn-loading': isLoading }"
    >
      <span v-if="!isLoading">
        <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      </span>
      <span v-else>Signing in...</span>
    </button>

    <div v-else class="auth-status">
      <span class="status-text">✓ Signed in</span>
      <button
        @click="handleSignOut"
        class="btn btn-secondary btn-sm"
      >
        Sign out
      </button>
    </div>

    <div v-if="authState.error" class="error-message">
      {{ authState.error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGoogleAuth } from '../composables/useGoogleAuth'

const { authState, signIn, signOut, isAuthenticated } = useGoogleAuth()
const isLoading = ref(false)

async function handleSignIn() {
  isLoading.value = true
  try {
    await signIn()
  } catch (error) {
    console.error('Sign in failed:', error)
  } finally {
    isLoading.value = false
  }
}

function handleSignOut() {
  signOut()
}
</script>

<style scoped>
.google-auth-button {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #fff;
  color: #1f2328;
  border-color: #d0d7de;
}

.btn-primary:hover:not(:disabled) {
  background-color: #f6f8fa;
  border-color: #d0d7de;
}

.btn-secondary {
  background-color: transparent;
  color: #c9d1d9;
  border-color: #30363d;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #30363d;
  border-color: #8b949e;
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

.btn-loading {
  position: relative;
}

.btn-loading::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  top: 50%;
  left: 50%;
  margin-left: -6px;
  margin-top: -6px;
  border: 2px solid #1f2328;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.google-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.auth-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-text {
  color: #3fb950;
  font-size: 0.875rem;
  font-weight: 500;
}

.error-message {
  color: #f85149;
  font-size: 0.75rem;
  max-width: 200px;
  text-align: right;
}

@media (max-width: 767px) {
  .google-auth-button {
    align-items: stretch;
  }

  .btn {
    justify-content: center;
  }

  .error-message {
    text-align: center;
    max-width: 100%;
  }
}
</style>
