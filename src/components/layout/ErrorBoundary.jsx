import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px 24px', 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--radius-md)', 
          textAlign: 'center',
          maxWidth: '500px',
          margin: '40px auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--accent)', marginBottom: '12px' }}>
            Section Render Error
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px', lineHeight: '1.45' }}>
            An unexpected error occurred while loading this tab's analytics components. You can retry loading or refresh the tracker.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              className="btn-secondary btn-sm" 
              onClick={() => window.location.reload()}
            >
              Reload App
            </button>
            <button 
              className="btn-primary btn-sm" 
              onClick={() => this.setState({ hasError: false })}
            >
              Retry Loading
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
