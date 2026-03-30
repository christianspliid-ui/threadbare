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

describe('ActionCard', () => {
  it('renders action name and description', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} />);
    expect(screen.getByText('Dream')).toBeInTheDocument();
    expect(screen.getByText('Manipulate selection probabilities during sleep')).toBeInTheDocument();
  });

  it('shows essence cost and sphere', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} />);
    expect(screen.getByTestId('action-card-cost')).toHaveTextContent('1');
  });

  it('shows detection risk', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} />);
    expect(screen.getByTestId('action-card-risk')).toHaveTextContent('10%');
  });

  it('calls onClick when available card is clicked', () => {
    const onClick = vi.fn();
    render(<ActionCard slot={baseSlot} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('action-card-dream'));
    expect(onClick).toHaveBeenCalledWith('dream');
  });

  it('does NOT call onClick when unavailable', () => {
    const onClick = vi.fn();
    const locked = { ...baseSlot, available: false, lockedReason: 'Requires tier 2' };
    render(<ActionCard slot={locked} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('action-card-dream'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows locked reason when unavailable', () => {
    const locked = { ...baseSlot, available: false, lockedReason: 'Requires tier 2' };
    render(<ActionCard slot={locked} onClick={vi.fn()} />);
    expect(screen.getByText('Requires tier 2')).toBeInTheDocument();
  });

  it('shows range info for ranged interventions', () => {
    const ranged = { ...baseSlot, rangeStatus: 'in_range' as const, hexDistance: 3 };
    render(<ActionCard slot={ranged} onClick={vi.fn()} />);
    expect(screen.getByTestId('action-card-range')).toHaveTextContent('3');
  });

  it('shows free cost for scry (observation)', () => {
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
    render(<ActionCard slot={scry} onClick={vi.fn()} />);
    expect(screen.getByTestId('action-card-cost')).toHaveTextContent('Free');
  });

  it('applies dimmed styling when unavailable', () => {
    const locked = { ...baseSlot, available: false, lockedReason: 'Not enough essence' };
    render(<ActionCard slot={locked} onClick={vi.fn()} />);
    const card = screen.getByTestId('action-card-dream');
    expect(card.className).toContain('opacity-');
  });

  it('applies sphere color accent when available', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} />);
    const card = screen.getByTestId('action-card-dream');
    const borderLeftColor = (card as HTMLElement).style.borderLeftColor;
    expect(borderLeftColor).toBeTruthy();
  });
});
