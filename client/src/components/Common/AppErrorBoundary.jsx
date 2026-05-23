import React from 'react';

// Top-level React error boundary. Catches render-time errors in the whole tree
// and shows a recoverable fallback instead of a blank white screen.
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Surface to the console so devs see the real stack; do NOT crash the app.
    console.error('[AppErrorBoundary] Render error:', error, info?.componentStack);
  }

  handleReload = () => {
    // Soft reset — try to re-render the tree first; if that still throws, fall through to a hard reload.
    this.setState({ hasError: false, error: null });
  };

  handleHardReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--obsidian, #0D0A02)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ maxWidth: 560, textAlign: 'left' }}>
          <p
            style={{
              fontSize: '0.7rem',
              letterSpacing: 3,
              color: '#A2D729',
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            SYSTEM_FAULT
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 12, letterSpacing: '-0.02em' }}>
            Something went sideways.
          </h1>
          <p style={{ fontSize: '0.95rem', opacity: 0.75, lineHeight: 1.6, marginBottom: '1.5rem' }}>
            The page hit an unexpected error. Your data is safe — the rest of the app is unaffected. Try going back, or reload to recover.
          </p>

          {this.state.error?.message && (
            <pre
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '0.85rem 1rem',
                fontSize: '0.75rem',
                color: '#A6A180',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                marginBottom: '1.5rem',
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {String(this.state.error.message)}
            </pre>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={this.handleReload}
              style={{
                background: '#A2D729',
                color: '#0D0A02',
                border: 'none',
                padding: '0.7rem 1.4rem',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <button
              onClick={this.handleHardReload}
              style={{
                background: 'none',
                color: '#A2D729',
                border: '1px solid #A2D729',
                padding: '0.7rem 1.4rem',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Hard reload
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              style={{
                background: 'none',
                color: '#A6A180',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '0.7rem 1.4rem',
                borderRadius: 6,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
