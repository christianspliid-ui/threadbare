// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HexBreadcrumb } from '../HexBreadcrumb';

describe('HexBreadcrumb', () => {
  const defaultProps = {
    hexCol: 5,
    hexRow: 3,
    terrain: 'temperate_forest' as const,
    locationCount: 3,
    agentCount: 7,
    lineOfSight: 'full' as const,
    sphereInfluence: { force: 0, matter: 0, energy: 0, life: 0.2, mind: 0.3, spirit: 0, time: 0, entropy: 0 },
    cultures: [] as any[],
    factions: [] as any[],
    onBack: vi.fn(),
  };

  it('renders hex name with coordinates', () => {
    render(<HexBreadcrumb {...defaultProps} />);
    expect(screen.getByText(/Temperate Forest/)).toBeTruthy();
    expect(screen.getByText(/5, 3/)).toBeTruthy();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<HexBreadcrumb {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows location and agent counts', () => {
    render(<HexBreadcrumb {...defaultProps} />);
    expect(screen.getByText(/3 loc/i)).toBeTruthy();
    expect(screen.getByText(/7 agents/i)).toBeTruthy();
  });

  it('shows line of sight indicator', () => {
    render(<HexBreadcrumb {...defaultProps} lineOfSight="partial" />);
    expect(screen.getByText(/Partial Sight/i)).toBeTruthy();
  });

  it('displays sphere influence dots for non-zero influences', () => {
    const { container } = render(<HexBreadcrumb {...defaultProps} />);
    const dots = container.querySelectorAll('div.rounded-full');
    // 1 terrain dot + 2 sphere dots (life and mind)
    expect(dots.length).toBe(3);
  });

  it('shows no sphere dots when all influences are zero', () => {
    const noInfluenceProps = {
      ...defaultProps,
      sphereInfluence: { force: 0, matter: 0, energy: 0, life: 0, mind: 0, spirit: 0, time: 0, entropy: 0 },
    };
    const { container } = render(<HexBreadcrumb {...noInfluenceProps} />);
    const dotsAfterTerrain = container.querySelectorAll('div.rounded-full');
    // Only terrain dot, no sphere dots
    expect(dotsAfterTerrain.length).toBe(1);
  });

  it('handles different terrain types', () => {
    render(<HexBreadcrumb {...defaultProps} terrain="mountains" />);
    expect(screen.getByText(/Mountains/)).toBeTruthy();
  });

  it('handles underscored terrain names correctly', () => {
    render(<HexBreadcrumb {...defaultProps} terrain="coastal_shallows" />);
    expect(screen.getByText(/Coastal Shallows/)).toBeTruthy();
  });

  it('shows different line of sight levels', () => {
    const { rerender } = render(<HexBreadcrumb {...defaultProps} lineOfSight="full" />);
    expect(screen.getByText(/Full Sight/i)).toBeTruthy();

    rerender(<HexBreadcrumb {...defaultProps} lineOfSight="partial" />);
    expect(screen.getByText(/Partial Sight/i)).toBeTruthy();

    rerender(<HexBreadcrumb {...defaultProps} lineOfSight="none" />);
    expect(screen.getByText(/No Sight/i)).toBeTruthy();
  });
});
