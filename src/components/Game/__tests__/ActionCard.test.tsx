// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionCard } from '../ActionCard';
import type { WheelSlot } from '../../../engine/wheel';

const baseSlot: WheelSlot = {
  id: 'dream',
  label: 'Dream',
  type: 'intervention',
  angleDeg: 45,
  available: true,
  lockedReason: null,
  essenceCost: 1,
  detectionRisk: 0.1,
  sphere: 'mind',
  interventionType: 'dream',
  rangeStatus: 'unlimited',
  hexDistance: null,
  description: 'Manipulate selection probabilities during sleep',
};

describe('ActionCard — hand layout', () => {
  it('renders action name in hand size', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} size="hand" />);
    expect(screen.getByText('Dream')).toBeInTheDocument();
  });

  it('shows essence cost in hand layout', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} size="hand" />);
    expect(screen.getByTestId('action-card-cost')).toHaveTextContent('1');
  });

  it('hand card renders name overlay only — description NOT in document', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} size="hand" />);
    // The description (flavor text) should NOT appear in hand mode
    expect(screen.queryByText('Manipulate selection probabilities during sleep')).toBeNull();
  });

  it('hand card renders spellName when provided', () => {
    const slot: WheelSlot = { ...baseSlot, spellName: 'Midnight Reverie' };
    render(<ActionCard slot={slot} onClick={vi.fn()} size="hand" />);
    expect(screen.getByText('Midnight Reverie')).toBeInTheDocument();
  });

  it('hand card falls back to label when spellName absent', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} size="hand" />);
    expect(screen.getByText('Dream')).toBeInTheDocument();
  });

  it('shows free cost for observation (scry)', () => {
    const scry: WheelSlot = {
      ...baseSlot,
      id: 'scry',
      label: 'Scry',
      type: 'observation',
      essenceCost: 0,
      detectionRisk: 0,
      sphere: null,
      interventionType: null,
      description: 'Observe agent psyche and situation',
    };
    render(<ActionCard slot={scry} onClick={vi.fn()} size="hand" />);
    expect(screen.getByTestId('action-card-cost')).toHaveTextContent('Free');
  });

  it('calls onClick when available hand card is clicked', () => {
    const onClick = vi.fn();
    render(<ActionCard slot={baseSlot} onClick={onClick} size="hand" />);
    fireEvent.click(screen.getByTestId('action-card-dream'));
    expect(onClick).toHaveBeenCalledWith('dream');
  });

  it('does NOT call onClick when unavailable hand card is clicked', () => {
    const onClick = vi.fn();
    const locked = { ...baseSlot, available: false, lockedReason: 'Requires tier 2' };
    render(<ActionCard slot={locked} onClick={onClick} size="hand" />);
    fireEvent.click(screen.getByTestId('action-card-dream'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies dimmed styling when unavailable', () => {
    const locked = { ...baseSlot, available: false, lockedReason: 'Not enough essence' };
    render(<ActionCard slot={locked} onClick={vi.fn()} size="hand" />);
    const card = screen.getByTestId('action-card-dream');
    expect(card.className).toContain('opacity-');
  });

  it('applies sphere color accent when available', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} size="hand" />);
    const card = screen.getByTestId('action-card-dream');
    // Art background should include sphere gradient
    expect(card.style.background).toBeTruthy();
  });
});

describe('ActionCard — focused layout (MTG frame)', () => {
  it('renders action name in focused mode', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} size="focused" />);
    expect(screen.getByText('Dream')).toBeInTheDocument();
  });

  it('focused card renders spell name from slot.spellName', () => {
    const slot: WheelSlot = { ...baseSlot, spellName: 'Call to Arms' };
    render(<ActionCard slot={slot} onClick={vi.fn()} size="focused" />);
    expect(screen.getByText('Call to Arms')).toBeInTheDocument();
  });

  it('focused card falls back to label when spellName absent', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} size="focused" />);
    expect(screen.getByText('Dream')).toBeInTheDocument();
  });

  it('focused card renders art image when art asset exists', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} size="focused" />);
    const img = screen.getByTestId('action-card-dream').querySelector('img');
    expect(img).toBeTruthy();
    expect(img!.getAttribute('src')).toContain('/assets/actions/');
  });

  it('focused card renders sphere icon fallback when no art asset', () => {
    const noArtSlot: WheelSlot = { ...baseSlot, id: 'scry', label: 'Scry', type: 'observation', interventionType: null };
    render(<ActionCard slot={noArtSlot} onClick={vi.fn()} size="focused" />);
    const card = screen.getByTestId('action-card-scry');
    // No <img> should render for cards without art
    expect(card.querySelector('img')).toBeNull();
  });

  it('focused card renders type line with reach and CRUD type', () => {
    const targetActionSlot: WheelSlot = {
      ...baseSlot,
      id: 'target_action_action.iron.create',
      type: 'target_action',
      interventionType: null,
    };
    render(<ActionCard slot={targetActionSlot} onClick={vi.fn()} size="focused" />);
    // Should show reach and crud type
    expect(screen.getByTestId('action-card-target_action_action.iron.create').textContent)
      .toMatch(/IRON/);
    expect(screen.getByTestId('action-card-target_action_action.iron.create').textContent)
      .toMatch(/CREATE/);
  });

  it('focused card renders technicalDescription when present', () => {
    const slot: WheelSlot = { ...baseSlot, technicalDescription: 'Test mechanical description' };
    render(<ActionCard slot={slot} onClick={vi.fn()} size="focused" />);
    expect(screen.getByText('Test mechanical description')).toBeInTheDocument();
  });

  it('focused card omits technicalDescription section when absent', () => {
    const slot: WheelSlot = { ...baseSlot };
    // No technicalDescription set
    render(<ActionCard slot={slot} onClick={vi.fn()} size="focused" />);
    // Card still renders without error
    expect(screen.getByTestId('action-card-dream')).toBeInTheDocument();
  });

  it('shows detection risk in focused layout', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} size="focused" />);
    expect(screen.getByTestId('action-card-risk')).toHaveTextContent('10%');
  });

  it('shows range info for ranged interventions in focused layout', () => {
    const ranged = { ...baseSlot, rangeStatus: 'in_range' as const, hexDistance: 3 };
    render(<ActionCard slot={ranged} onClick={vi.fn()} size="focused" />);
    expect(screen.getByTestId('action-card-range')).toHaveTextContent('3');
  });

  it('shows locked reason when unavailable in focused mode', () => {
    const locked = { ...baseSlot, available: false, lockedReason: 'Requires tier 2' };
    render(<ActionCard slot={locked} onClick={vi.fn()} size="focused" />);
    expect(screen.getByText('Requires tier 2')).toBeInTheDocument();
  });

  it('calls onClick when available focused card is clicked', () => {
    const onClick = vi.fn();
    render(<ActionCard slot={baseSlot} onClick={onClick} size="focused" />);
    fireEvent.click(screen.getByTestId('action-card-dream'));
    expect(onClick).toHaveBeenCalledWith('dream');
  });

  it('does NOT call onClick when unavailable focused card is clicked', () => {
    const onClick = vi.fn();
    const locked = { ...baseSlot, available: false, lockedReason: 'Requires tier 2' };
    render(<ActionCard slot={locked} onClick={onClick} size="focused" />);
    fireEvent.click(screen.getByTestId('action-card-dream'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies sphere color accent when available in focused mode', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} size="focused" />);
    const card = screen.getByTestId('action-card-dream');
    const borderLeftColor = (card as HTMLElement).style.borderLeftColor;
    expect(borderLeftColor).toBeTruthy();
  });
});

// ─── TB-100: RarityBadge integration ─────────────────────────────

describe('ActionCard — RarityBadge', () => {
  it('does NOT show rarity badge for tier 1 (Mundane) in hand layout', () => {
    const slot: WheelSlot = { ...baseSlot, rarityTier: 1 };
    render(<ActionCard slot={slot} onClick={vi.fn()} size="hand" />);
    expect(screen.queryByTestId('action-card-rarity-badge')).toBeNull();
  });

  it('does NOT show rarity badge when rarityTier is absent in hand layout', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} size="hand" />);
    expect(screen.queryByTestId('action-card-rarity-badge')).toBeNull();
  });

  it('shows rarity badge for tier 2 (Storied) in hand layout', () => {
    const slot: WheelSlot = { ...baseSlot, rarityTier: 2 };
    render(<ActionCard slot={slot} onClick={vi.fn()} size="hand" />);
    expect(screen.getByTestId('action-card-rarity-badge')).toBeInTheDocument();
  });

  it('shows rarity badge for tier 3 (Mythic) in hand layout', () => {
    const slot: WheelSlot = { ...baseSlot, rarityTier: 3 };
    render(<ActionCard slot={slot} onClick={vi.fn()} size="hand" />);
    expect(screen.getByTestId('action-card-rarity-badge')).toBeInTheDocument();
  });

  it('shows rarity badge for tier 4 (Legendary) in hand layout', () => {
    const slot: WheelSlot = { ...baseSlot, rarityTier: 4 };
    render(<ActionCard slot={slot} onClick={vi.fn()} size="hand" />);
    expect(screen.getByTestId('action-card-rarity-badge')).toBeInTheDocument();
  });

  it('does NOT show rarity badge for tier 1 (Mundane) in focused layout', () => {
    const slot: WheelSlot = { ...baseSlot, rarityTier: 1 };
    render(<ActionCard slot={slot} onClick={vi.fn()} size="focused" />);
    expect(screen.queryByTestId('action-card-rarity-badge')).toBeNull();
  });

  it('shows rarity badge for tier 2 (Storied) in focused layout', () => {
    const slot: WheelSlot = { ...baseSlot, rarityTier: 2 };
    render(<ActionCard slot={slot} onClick={vi.fn()} size="focused" />);
    expect(screen.getByTestId('action-card-rarity-badge')).toBeInTheDocument();
  });

  it('shows rarity badge for tier 3 (Mythic) in focused layout', () => {
    const slot: WheelSlot = { ...baseSlot, rarityTier: 3 };
    render(<ActionCard slot={slot} onClick={vi.fn()} size="focused" />);
    expect(screen.getByTestId('action-card-rarity-badge')).toBeInTheDocument();
  });

  it('shows rarity badge for tier 4 (Legendary) in focused layout', () => {
    const slot: WheelSlot = { ...baseSlot, rarityTier: 4 };
    render(<ActionCard slot={slot} onClick={vi.fn()} size="focused" />);
    expect(screen.getByTestId('action-card-rarity-badge')).toBeInTheDocument();
  });

  it('badge text content matches tier name for Storied', () => {
    const slot: WheelSlot = { ...baseSlot, rarityTier: 2 };
    render(<ActionCard slot={slot} onClick={vi.fn()} size="focused" />);
    const badge = screen.getByTestId('action-card-rarity-badge');
    expect(badge.textContent).toMatch(/storied/i);
  });

  it('badge text content matches tier name for Legendary', () => {
    const slot: WheelSlot = { ...baseSlot, rarityTier: 4 };
    render(<ActionCard slot={slot} onClick={vi.fn()} size="focused" />);
    const badge = screen.getByTestId('action-card-rarity-badge');
    expect(badge.textContent).toMatch(/legendary/i);
  });
});
