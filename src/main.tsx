import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import { initStorage } from './app/storage/kv'

// The data is loaded from the browser database before the app is even
// imported: everything that reads it (the deck store) can then do so
// synchronously, and nothing ever renders from an empty guess.
const boot = async () => {
  try {
    await initStorage()
  } catch {
    // Start anyway: the app keeps working from memory.
  }

  const { default: App } = await import('./App.tsx')

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
