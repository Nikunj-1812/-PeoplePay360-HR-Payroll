import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Filter out third-party Chrome Extension background messaging errors in the browser console
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason ? String(event.reason.message || event.reason) : '';
    if (
      reason.includes('message channel closed') || 
      reason.includes('asynchronous response') ||
      reason.includes('listener indicated')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
