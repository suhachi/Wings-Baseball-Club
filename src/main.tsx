import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/index.css';

// Global error handler to suppress AbortError and preview errors
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError') {
    // Suppress AbortError from being logged
    event.preventDefault();
    return;
  }
});

// Suppress Vite preview warnings
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const warningMessage = args[0]?.toString() || '';
  if (warningMessage.includes('logPreviewError') || warningMessage.includes('reduxState')) {
    // Suppress Vite preview warnings
    return;
  }
  originalWarn.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);