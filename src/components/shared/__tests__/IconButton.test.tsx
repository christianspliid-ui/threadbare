// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IconButton } from '../IconButton';

describe('IconButton', () => {
  it('renders icon content', () => {
    render(<IconButton icon={<span data-testid="ico">⚔</span>} aria-label="Battles" />);
    expect(screen.getByTestId('ico')).toBeInTheDocument();
  });

  it('renders as a button', () => {
    render(<IconButton icon="⚙" aria-label="Settings" />);
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('fires onClick', () => {
    const fn = vi.fn();
    render(<IconButton icon="⚙" aria-label="Settings" onClick={fn} />);
    fireEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('does not fire onClick when disabled', () => {
    const fn = vi.fn();
    render(<IconButton icon="⚙" aria-label="Settings" disabled onClick={fn} />);
    fireEvent.click(screen.getByRole('button'));
    expect(fn).not.toHaveBeenCalled();
  });

  it('applies md size by default (32px)', () => {
    render(<IconButton icon="⚙" aria-label="Settings" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveStyle({ width: '32px', height: '32px' });
  });

  it('applies sm size (28px)', () => {
    render(<IconButton icon="⚙" aria-label="Settings" size="sm" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveStyle({ width: '28px', height: '28px' });
  });

  it('renders badge with aria-hidden', () => {
    render(<IconButton icon="⚔" badge={3} aria-label="3 Rival Gods" />);
    const badge = screen.getByText('3');
    expect(badge).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies active gold styling', () => {
    render(<IconButton icon="⚔" active aria-label="Active" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveStyle({ color: 'var(--accent-gold)' });
  });

  it('applies close variant circular shape', () => {
    render(<IconButton icon="×" variant="close" aria-label="Close" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveStyle({ borderRadius: '50%' });
  });

  it('applies default variant square shape', () => {
    render(<IconButton icon="⚙" aria-label="Settings" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveStyle({ borderRadius: '4px' });
  });

  it('applies disabled opacity', () => {
    render(<IconButton icon="⚙" aria-label="Settings" disabled />);
    expect(screen.getByRole('button')).toHaveStyle({ opacity: '0.4' });
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<IconButton icon="⚙" aria-label="Settings" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
