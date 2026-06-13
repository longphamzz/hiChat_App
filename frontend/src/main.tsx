import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CallProvider } from './contexts/CallContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CallProvider>
      <App />
    </CallProvider>
  </StrictMode>,
)
