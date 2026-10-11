import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import { initStorage } from './app/storage/kv'
import { initMotion } from './app/motion'

// Keeps the app in the browser's cache after the first visit, so it opens and
// works with no network (see the offline-cache plugin in vite.config.ts).
const registerOfflineCache = () => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return
  }

  const register = () => {
    navigator.serviceWorker
      .register(new URL('sw.js', document.baseURI))
      .catch(() => undefined)
  }

  // The app arrives after a dynamic import, so the page may be loaded already.
  if (document.readyState === 'complete') {
    register()
  } else {
    window.addEventListener('load', register, { once: true })
  }
}

// The data is loaded from the browser database before the app is even
// imported: everything that reads it (the deck store) can then do so
// synchronously, and nothing ever renders from an empty guess.
const boot = async () => {
  try {
    await initStorage()
  } catch {
    // Start anyway: the app keeps working from memory.
  }

  // The chosen amount of motion is in force before the first frame.
  initMotion()

  const { default: App } = await import('./App.tsx')

  registerOfflineCache()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
