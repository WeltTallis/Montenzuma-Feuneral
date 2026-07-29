import React from 'react'
import ReactDOM from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import App from './App'
import './index.css'

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('[PWA] Service Worker registered successfully:', registration.scope);
      
      // Check for updates every hour
      setInterval(() => {
        registration.update();
      }, 3600000);
    })
    .catch((error) => {
      console.error('[PWA] Service Worker registration failed:', error);
    });

  // Listen for service worker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[PWA] New service worker activated');
    // Don't auto-reload, let the user continue using the app
  });
}

// Get the root element
const rootElement = document.getElementById('root');

// Check if root element exists before creating root
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found! Make sure there is a div with id="root" in your HTML.');
  
  // Create a fallback root if needed (for debugging)
  const fallbackDiv = document.createElement('div');
  fallbackDiv.id = 'root-fallback';
  document.body.appendChild(fallbackDiv);
  document.body.innerHTML += '<div style="padding:20px;text-align:center;font-family:sans-serif;"><h2>Application Error</h2><p>Root element not found. Please check your HTML.</p></div>';
}

// Optional: Error boundary for the entire app
// This catches errors that happen during rendering
if (rootElement) {
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    // You could show a fallback UI here
  });
}