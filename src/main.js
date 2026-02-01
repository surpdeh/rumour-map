import { createApp } from 'vue'
import { gapi } from 'gapi-script'
import './style.css'
import App from './App.vue'

// Make gapi available globally for composables
window.gapi = gapi

createApp(App).mount('#app')
