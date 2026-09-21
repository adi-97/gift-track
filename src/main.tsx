import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.tsx'

// Inside the native Android/iOS shell every asset is already bundled on
// device, so there's nothing for the PWA service worker to usefully cache —
// and SW support inside embedded WebViews is inconsistent across OS
// versions. Only register it for the real hosted web app.
if (!Capacitor.isNativePlatform()) {
  registerSW({ immediate: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
