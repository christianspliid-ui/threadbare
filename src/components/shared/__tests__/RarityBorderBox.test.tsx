// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RarityBorderBox } from '../RarityBorderBox';
import { RARITY_TIER_COLORS } from '../../../types/rarity';
import type { RarityTier } from '../../../types/rarity';
import { RARITY_LEGENDARY_PULSE_ANIMATION } from '../../../data/rarity-constants';

describe('RarityBorderBox', () => {
  it('renders children', () => {
    render(
      <RarityBorderBox tier={1}>
        <span>child content</span>
      </RarityBorderBox>,
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  const tiers: RarityTier[] = [1, 2, 3, 4];

  it.each(tiers)('applies correct border color for tier %i', (tier) => {
    const { container } = render(
      <RarityBorderBox tier={tier}>content</RarityBorderBox>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveStyle({ borderLeft: `3px solid ${RARITY_TIER_COLORS[tier]}` });
  });

  it('adds pulse-gold class for tier 4 (Legendary)', () => {
    const { container } = render(
      <RarityBorderBox tier={4}>legendary</RarityBorderBox>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass(RARITY_LEGENDARY_PULSE_ANIMATION);
  });

  it('does NOT add pulse-gold class for tier 1', () => {
    const { container } = render(
      <RarityBorderBox tier={1}>mundane</RarityBorderBox>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div).not.toHaveClass(RARITY_LEGENDARY_PULSE_ANIMATION);
  });

  it('does NOT add pulse-gold class for tier 2', () => {
    const { container } = render(
      <RarityBorderBox tier={2}>storied</RarityBorderBox>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div).not.toHaveClass(RARITY_LEGENDARY_PULSE_ANIMATION);
  });

  it('does NOT add pulse-gold class for tier 3', () => {
    const { container } = render(
      <RarityBorderBox tier={3}>mythic</RarityBorderBox>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div).not.toHaveClass(RARITY_LEGENDARY_PULSE_ANIMATION);
  });

  it('passes className through', () => {
    const { container } = render(
      <RarityBorderBox tier={1} className="custom-class">content</RarityBorderBox>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('custom-class');
  });

  it('merges style prop with border style', () => {
    const { container } = render(
      <RarityBorderBox tier={2} style={{ padding: '8px' }}>content</RarityBorderBox>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveStyle({ padding: '8px' });
    expect(div).toHaveStyle({ borderLeft: `3px solid ${RARITY_TIER_COLORS[2]}` });
  });
});
