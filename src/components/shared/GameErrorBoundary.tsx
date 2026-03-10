import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GameErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  private handleRestore = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleCopyError = () => {
    const msg = this.state.error
      ? `${this.state.error.name}: ${this.state.error.message}\n${this.state.error.stack ?? ''}`
      : 'Unknown error';
    navigator.clipboard?.writeText(msg);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-6 p-8"
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            minHeight: '300px',
          }}
        >
          <p
            className="italic text-center"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
            }}
          >
            The threads of reality fray here. The world endures.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRestore}
              aria-label="Restore game view"
              className="px-4 py-2 rounded transition-colors duration-150"
              style={{
                backgroundColor: 'var(--accent-gold)',
                color: 'var(--bg-abyss)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
              }}
            >
              Restore
            </button>
            <button
              onClick={this.handleCopyError}
              aria-label="Copy error details"
              className="px-4 py-2 rounded transition-colors duration-150"
              style={{
                backgroundColor: 'var(--bg-raised)',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
              }}
            >
              Copy Error
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
