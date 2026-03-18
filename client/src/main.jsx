import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './neobrutalism-theme.css';

// Dev-only: react-grab for AI coding agent context selection (Ctrl/⌘C on hover)
if (import.meta.env.DEV) {
  import('react-grab');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
