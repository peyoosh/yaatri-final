import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("HUB_ERROR_BOUNDARY_CATCH:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', border: '1px solid var(--danger-red)', background: 'rgba(255, 77, 77, 0.05)' }}>
          <h2 style={{ color: 'var(--danger-red)', letterSpacing: '2px' }}>HUB_INTERFACE_FAULT</h2>
          <p style={{ color: 'var(--himalayan-mist)', opacity: 0.8 }}>A critical error occurred in this module. Please refresh or contact support.</p>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.7rem', opacity: 0.6, marginTop: '1rem' }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;