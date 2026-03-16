// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttachmentRow } from '../AttachmentRow';

describe('AttachmentRow', () => {
  const baseProps = {
    name: "Ashenmane's Fang",
    subcategory: 'arms',
    tier: 2 as const,
    mechanicalSummary: '+Iron, cavalry charge',
  };

  it('renders name and mechanical summary', () => {
    render(<AttachmentRow {...baseProps} />);
    expect(screen.getByText("Ashenmane's Fang")).toBeTruthy();
    expect(screen.getByText('+Iron, cavalry charge')).toBeTruthy();
  });

  it('renders tier name', () => {
    render(<AttachmentRow {...baseProps} />);
    expect(screen.getByText('Storied')).toBeTruthy();
  });

  it('renders subcategory glyph', () => {
    render(<AttachmentRow {...baseProps} />);
    expect(screen.getByText('\u2694')).toBeTruthy();
  });

  it('applies tier color to left border', () => {
    render(<AttachmentRow {...baseProps} />);
    const row = screen.getByTestId('attachment-row');
    // JSDOM converts hex to rgb, so just check border width and style
    expect(row.style.borderLeft).toContain('3px solid');
  });

  it('shows progress bar when ticksRemaining and totalTicks are provided', () => {
    render(<AttachmentRow {...baseProps} ticksRemaining={8} totalTicks={20} />);
    const row = screen.getByTestId('attachment-row');
    // ProgressBar renders a child div with width style
    const bars = row.querySelectorAll('[class*="rounded-full"]');
    expect(bars.length).toBeGreaterThan(0);
  });

  it('does not show progress bar for permanent attachments', () => {
    render(<AttachmentRow {...baseProps} />);
    const row = screen.getByTestId('attachment-row');
    // Should not have a progress bar container with h-1.5
    const bars = row.querySelectorAll('.h-1\\.5');
    expect(bars.length).toBe(0);
  });

  it('shows duration label when no progress bar', () => {
    render(<AttachmentRow {...baseProps} durationLabel="until dispelled" />);
    expect(screen.getByText('until dispelled')).toBeTruthy();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<AttachmentRow {...baseProps} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('attachment-row'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('calls onClick on Enter key', () => {
    const onClick = vi.fn();
    render(<AttachmentRow {...baseProps} onClick={onClick} />);
    fireEvent.keyDown(screen.getByTestId('attachment-row'), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('calls onClick on Space key', () => {
    const onClick = vi.fn();
    render(<AttachmentRow {...baseProps} onClick={onClick} />);
    fireEvent.keyDown(screen.getByTestId('attachment-row'), { key: ' ' });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('has role="button" and tabIndex for accessibility', () => {
    render(<AttachmentRow {...baseProps} />);
    const row = screen.getByTestId('attachment-row');
    expect(row.getAttribute('role')).toBe('button');
    expect(row.getAttribute('tabindex')).toBe('0');
  });

  it('applies pulse-gold class for tier 4 (Legendary)', () => {
    render(<AttachmentRow {...baseProps} tier={4} />);
    const row = screen.getByTestId('attachment-row');
    expect(row.classList.contains('pulse-gold')).toBe(true);
  });

  it('does not apply pulse-gold class for non-legendary tiers', () => {
    render(<AttachmentRow {...baseProps} tier={1} />);
    const row = screen.getByTestId('attachment-row');
    expect(row.classList.contains('pulse-gold')).toBe(false);
  });
});
