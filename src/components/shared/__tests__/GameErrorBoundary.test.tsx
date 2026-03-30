// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameErrorBoundary } from '../GameErrorBoundary';

const ThrowingChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Test crash');
  return <div data-testid="child">Working</div>;
};

describe('GameErrorBoundary', () => {
  let originalError: typeof console.error;

  beforeEach(() => {
    originalError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when no error', () => {
    render(
      <GameErrorBoundary>
        <div data-testid="child">OK</div>
      </GameErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    render(
      <GameErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </GameErrorBoundary>
    );
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(screen.getByText(/threads of reality/i)).toBeInTheDocument();
  });

  it('shows a restore button in fallback', () => {
    render(
      <GameErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </GameErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /restore/i })).toBeInTheDocument();
  });

  it('recovers when restore is clicked', () => {
    render(
      <GameErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </GameErrorBoundary>
    );
    const restoreBtn = screen.getByRole('button', { name: /restore/i });
    fireEvent.click(restoreBtn);
    expect(screen.getByText(/threads of reality/i)).toBeInTheDocument();
  });

  it('shows a copy error button in fallback', () => {
    render(
      <GameErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </GameErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /copy error/i })).toBeInTheDocument();
  });

  it('copies error message to clipboard when copy button is clicked', async () => {
    const clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: clipboardWriteText } });

    render(
      <GameErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </GameErrorBoundary>
    );

    const copyBtn = screen.getByRole('button', { name: /copy error/i });
    fireEvent.click(copyBtn);

    expect(clipboardWriteText).toHaveBeenCalled();
    const copiedText = clipboardWriteText.mock.calls[0]?.[0] as string;
    expect(copiedText).toContain('Test crash');
  });
});
