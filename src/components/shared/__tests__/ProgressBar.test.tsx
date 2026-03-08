// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('renders with correct progress width', () => {
    const { container } = render(
      <ProgressBar progress={0.5} color="#d4a574" />
    );
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle('width: 50%');
  });

  it('uses provided color for background', () => {
    const { container } = render(
      <ProgressBar progress={0.75} color="#5c6bc0" />
    );
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle('backgroundColor: #5c6bc0');
  });

  it('applies glow effect when glow is true', () => {
    const { container } = render(
      <ProgressBar progress={0.5} color="#eab308" glow={true} />
    );
    const progressFill = container.querySelector('div > div');
    const boxShadow = progressFill?.getAttribute('style');
    expect(boxShadow).toContain('0 0 8px');
  });

  it('does not apply glow when glow is false', () => {
    const { container } = render(
      <ProgressBar progress={0.5} color="#eab308" glow={false} />
    );
    const progressFill = container.querySelector('div > div');
    const style = progressFill?.getAttribute('style');
    expect(style).not.toContain('boxShadow');
  });

  it('defaults to glow=true when not specified', () => {
    const { container } = render(
      <ProgressBar progress={0.5} color="#eab308" />
    );
    const progressFill = container.querySelector('div > div');
    const boxShadow = progressFill?.getAttribute('style');
    expect(boxShadow).toContain('0 0 8px');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ProgressBar progress={0.5} color="#d4a574" className="h-4" />
    );
    const progressBar = container.firstChild as HTMLElement;
    expect(progressBar).toHaveClass('h-4');
  });

  it('defaults to h-2 className when not specified', () => {
    const { container } = render(
      <ProgressBar progress={0.5} color="#d4a574" />
    );
    const progressBar = container.firstChild as HTMLElement;
    expect(progressBar).toHaveClass('h-2');
  });

  it('applies data-testid when provided', () => {
    const { container } = render(
      <ProgressBar progress={0.5} color="#d4a574" dataTestId="custom-test-id" />
    );
    const progressBar = container.querySelector('[data-testid="custom-test-id"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles zero progress', () => {
    const { container } = render(
      <ProgressBar progress={0} color="#d4a574" />
    );
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle('width: 0%');
  });

  it('handles full progress', () => {
    const { container } = render(
      <ProgressBar progress={1} color="#d4a574" />
    );
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle('width: 100%');
  });

  it('handles decimal progress values correctly', () => {
    const { container } = render(
      <ProgressBar progress={0.333} color="#d4a574" />
    );
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle('width: 33%');
  });

  it('applies rounded-full class for progress fill', () => {
    const { container } = render(
      <ProgressBar progress={0.5} color="#d4a574" />
    );
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveClass('rounded-full');
  });

  it('applies transition-all class for smooth animation', () => {
    const { container } = render(
      <ProgressBar progress={0.5} color="#d4a574" />
    );
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveClass('transition-all');
  });

  it('uses 80 opacity for glow color', () => {
    const { container } = render(
      <ProgressBar progress={0.5} color="#ff0000" glow={true} />
    );
    const progressFill = container.querySelector('div > div');
    const boxShadow = progressFill?.getAttribute('style');
    expect(boxShadow).toContain('#ff000080');
  });
});
