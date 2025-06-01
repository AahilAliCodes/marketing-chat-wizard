
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the default browser error handling
  event.preventDefault();
});

// Global error handler for uncaught exceptions
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

try {
  root.render(<App />);
} catch (error) {
  console.error('Failed to render app:', error);
  
  // Fallback error UI
  rootElement.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f9fafb;
      padding: 1rem;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="
        max-width: 24rem;
        width: 100%;
        padding: 2rem;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        text-align: center;
      ">
        <h1 style="color: #dc2626; margin-bottom: 1rem;">Application Error</h1>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">
          The application failed to load. Please refresh the page or contact support.
        </p>
        <button 
          onclick="window.location.reload()" 
          style="
            background-color: #7c3aed;
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
          "
        >
          Reload Page
        </button>
      </div>
    </div>
  `;
}
