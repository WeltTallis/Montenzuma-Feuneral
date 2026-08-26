import React from 'react'
import ReactDOM from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import App from './App'
import './index.css'

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

  // Remove the static boot loader now that React has mounted.
  requestAnimationFrame(() => {
    const bootLoader = document.getElementById('boot-loader');
    if (bootLoader) bootLoader.remove();
  });
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