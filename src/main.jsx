import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Registra o Service Worker para PWA instalável (somente em produção / https)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // silencia erros em ambientes que não suportam
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)