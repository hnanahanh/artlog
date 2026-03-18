import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import App from './App.jsx';
import './neobrutalism-theme.css';

dayjs.extend(isoWeek);

// Dev-only: react-grab for AI coding agent context selection (Ctrl/⌘C on hover)
if (import.meta.env.DEV) {
  import('react-grab');
}

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return <pre style={{ padding: 24, color: 'red', whiteSpace: 'pre-wrap' }}>
        {this.state.error?.message}\n{this.state.error?.stack}
      </pre>;
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
