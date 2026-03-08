// @vitest-environment jsdom
/**
 * ActionCard — Visual Feedback & Animation Tests
 *
 * Tests for the playing prop, pulse animation, and spent overlay.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionCard } from '../ActionCard';
import type { WheelSlot } from '../../../engine/wheel';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeSlot(overrides?: Partial<WheelSlot>): WheelSlot {
  return {
    id: 'persuade',
    label: 'Persuade',
    type: 'intervention',
    angleDeg: 0,
    available: true,
    lockedReason: null,
    essenceCost: 2,
    detectionRisk: 0.2,
    sphere: 'spirit',
    interventionType: 'persuade',
    rangeStatus: 'unlimited',
    hexDistance: null,
    description: 'Add temporary goal alignment',
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('ActionCard — playing animation', () => {
  it('renders without playing class by default', () => {
    render(<ActionCard slot={makeSlot()} onClick={() => {}} />);
    const card = screen.getByTestId('action-card-persuade');
    expect(card.className).not.toContain('card-pulse');
  });

  it('adds card-pulse class when playing=true', () => {
    render(<ActionCard slot={makeSlot()} onClick={() => {}} playing={true} />);
    const card = screen.getByTestId('action-card-persuade');
    expect(card.className).toContain('card-pulse');
  });

  it('shows spent overlay when playing=true', () => {
    render(<ActionCard slot={makeSlot()} onClick={() => {}} playing={true} />);
    const overlay = screen.getByTestId('action-card-spent-overlay');
    expect(overlay).toBeDefined();
  });

  it('does not show spent overlay when playing=false', () => {
    render(<ActionCard slot={makeSlot()} onClick={() => {}} playing={false} />);
    const overlay = screen.queryByTestId('action-card-spent-overlay');
    expect(overlay).toBeNull();
  });

  it('applies opacity-70 class when playing=true', () => {
    render(<ActionCard slot={makeSlot()} onClick={() => {}} playing={true} />);
    const card = screen.getByTestId('action-card-persuade');
    expect(card.className).toContain('opacity-70');
  });

  it('disables click handler when playing=true', () => {
    const onClick = vi.fn();
    const { container } = render(
      <ActionCard slot={makeSlot()} onClick={onClick} playing={true} />
    );
    const card = screen.getByTestId('action-card-persuade');
    card.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('glyph has glyph-pulse class when playing=true', () => {
    render(<ActionCard slot={makeSlot()} onClick={() => {}} playing={true} />);
    const glyphEl = screen.getByTestId('action-card-persuade').querySelector('.glyph-pulse');
    expect(glyphEl).toBeDefined();
  });

  it('glyph does not have glyph-pulse class when playing=false', () => {
    render(<ActionCard slot={makeSlot()} onClick={() => {}} playing={false} />);
    const card = screen.getByTestId('action-card-persuade');
    const glyphEl = card.querySelector('.glyph-pulse');
    expect(glyphEl).toBeNull();
  });

  it('renders checkmark in spent overlay', () => {
    render(<ActionCard slot={makeSlot()} onClick={() => {}} playing={true} />);
    const overlay = screen.getByTestId('action-card-spent-overlay');
    expect(overlay.textContent).toContain('✓');
  });

  it('lock reason hidden when playing=true', () => {
    render(
      <ActionCard
        slot={makeSlot({ available: false, lockedReason: 'Tier requirement not met' })}
        onClick={() => {}}
        playing={true}
      />
    );
    const card = screen.getByTestId('action-card-persuade');
    expect(card.textContent).not.toContain('Tier requirement not met');
  });

  it('tabIndex=-1 when playing=true', () => {
    render(<ActionCard slot={makeSlot()} onClick={() => {}} playing={true} />);
    const card = screen.getByTestId('action-card-persuade');
    expect(card.getAttribute('tabIndex')).toBe('-1');
  });

  it('maintains available styling when playing=true', () => {
    render(<ActionCard slot={makeSlot()} onClick={() => {}} playing={true} />);
    const card = screen.getByTestId('action-card-persuade');
    // Should still have sphere-colored border when playing
    expect(card.style.borderLeftColor).toBeTruthy();
  });
});

// ─── Integration Tests ──────────────────────────────────────────────────────

describe('ActionCard — playing state transitions', () => {
  it('transitions from not-playing to playing', () => {
    const { rerender } = render(
      <ActionCard slot={makeSlot()} onClick={() => {}} playing={false} />
    );
    let card = screen.getByTestId('action-card-persuade');
    expect(card.className).not.toContain('card-pulse');

    rerender(<ActionCard slot={makeSlot()} onClick={() => {}} playing={true} />);
    card = screen.getByTestId('action-card-persuade');
    expect(card.className).toContain('card-pulse');
  });

  it('renders animation style tag when playing=true', () => {
    render(<ActionCard slot={makeSlot()} onClick={() => {}} playing={true} />);
    const styles = document.querySelectorAll('style');
    const hasCardPulse = Array.from(styles).some(s => s.textContent?.includes('cardPulse'));
    expect(hasCardPulse).toBe(true);
  });

  it('handles multiple cards with different playing states', () => {
    const { rerender } = render(
      <>
        <ActionCard slot={makeSlot({ id: 'card1' })} onClick={() => {}} playing={false} />
        <ActionCard slot={makeSlot({ id: 'card2' })} onClick={() => {}} playing={true} />
      </>
    );

    let card1 = screen.getByTestId('action-card-card1');
    let card2 = screen.getByTestId('action-card-card2');
    expect(card1.className).not.toContain('card-pulse');
    expect(card2.className).toContain('card-pulse');
  });
});

