// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RarityBadge } from '../RarityBadge';
import { RARITY_TIER_NAMES, RARITY_TIER_COLORS } from '../../../types/rarity';
import type { RarityTier } from '../../../types/rarity';

describe('RarityBadge', () => {
  const tiers: RarityTier[] = [1, 2, 3, 4];

  it.each(tiers)('renders tier %i name', (tier) => {
    const { container } = render(<RarityBadge tier={tier} />);
    const span = container.firstChild as HTMLElement;
    expect(span.textContent).toBe(RARITY_TIER_NAMES[tier]);
  });

  it.each(tiers)('uses tier %i color in rgba format', (tier) => {
    const { container } = render(<RarityBadge tier={tier} opacity={1} />);
    const span = container.firstChild as HTMLElement;
    const style = span.getAttribute('style') ?? '';
    // Color should be derived from the tier's hex color
    const hex = RARITY_TIER_COLORS[tier];
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // jsdom normalises rgba to rgb when alpha is 1
    expect(style).toMatch(new RegExp(`rgba?\\(${r},\\s*${g},\\s*${b}`));
  });

  it('applies opacity of 0.8 by default', () => {
    const { container } = render(<RarityBadge tier={2} />);
    const span = container.firstChild as HTMLElement;
    const style = span.getAttribute('style') ?? '';
    expect(style).toContain('0.8');
  });

  it('applies custom opacity', () => {
    const { container } = render(<RarityBadge tier={3} opacity={0.4} />);
    const span = container.firstChild as HTMLElement;
    const style = span.getAttribute('style') ?? '';
    expect(style).toContain('0.4');
  });

  it('passes className through', () => {
    const { container } = render(<RarityBadge tier={1} className="custom-class" />);
    const span = container.firstChild as HTMLElement;
    expect(span).toHaveClass('custom-class');
  });

  it('renders as a span element', () => {
    const { container } = render(<RarityBadge tier={2} />);
    expect(container.firstChild?.nodeName).toBe('SPAN');
  });
});
