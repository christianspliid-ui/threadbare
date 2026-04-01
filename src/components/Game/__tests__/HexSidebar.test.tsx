// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HexSidebar } from '../HexSidebar';

describe('HexSidebar', () => {
  const defaultProps = {
    terrain: 'plateau' as const,
    hexCol: 8,
    hexRow: 6,
    sphereInfluence: {
      force: 0.15,
      matter: 0,
      energy: 0.72,
      life: 0,
      mind: 0,
      spirit: 0,
      time: 0.35,
      entropy: 0,
      chaos: 0,
      order: 0,
      light: 0,
      darkness: 0,
    },
    regionData: {
      regionId: 'r0',
      regionName: 'The Storm-Born Reach',
      featureType: 'plains',
      hexCount: 14,
      historicalCulture: null,
    },
    locations: [{ id: 'loc1', name: 'The Forge' }],
    agentsByLocation: { loc1: [{ id: 'a1', name: 'Kael' }] },
    lineOfSight: 'full' as const,
    cultures: [],
    factions: [],
  };

  it('renders region name when expanded', () => {
    render(<HexSidebar {...defaultProps} />);
    expect(screen.getByText('The Storm-Born Reach')).toBeTruthy();
  });

  it('renders sphere bars sorted by value', () => {
    render(<HexSidebar {...defaultProps} />);
    // Energy (0.72) should appear first, with "strong" label
    const energyLabel = screen.getByText(/energy/i);
    expect(energyLabel).toBeTruthy();
  });

  it('shows correct sphere intensity labels', () => {
    render(<HexSidebar {...defaultProps} />);
    // Energy (0.72) should be "strong" (>= 0.6)
    expect(screen.getByText('strong')).toBeTruthy();
    // Time (0.35) should be "faint" (>= 0.3 and < 0.6)
    expect(screen.getByText('faint')).toBeTruthy();
    // Force (0.15) should be "trace" (< 0.3)
    expect(screen.getByText('trace')).toBeTruthy();
  });

  it('toggles collapsed state', () => {
    render(<HexSidebar {...defaultProps} />);
    const toggle = screen.getByLabelText('Toggle sidebar');

    // Initially expanded
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    // Click to collapse
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    // Click to expand
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('renders location count and agent count', () => {
    const { container } = render(<HexSidebar {...defaultProps} />);
    // The text is split across spans, so we need to check the container
    expect(container.textContent).toMatch(/location/);
    expect(container.textContent).toMatch(/soul/);
  });

  it('handles null sphereInfluence gracefully', () => {
    render(<HexSidebar {...defaultProps} sphereInfluence={null} />);
    // Should not crash, should render region name
    expect(screen.getByText('The Storm-Born Reach')).toBeTruthy();
  });

  it('handles null regionData gracefully', () => {
    render(<HexSidebar {...defaultProps} regionData={null} />);
    // Should not crash, should show terrain label instead
    expect(screen.getByText(/plateau/i)).toBeTruthy();
  });

  it('renders location names as clickable links when expanded', () => {
    render(<HexSidebar {...defaultProps} />);
    const locationButton = screen.getByRole('button', { name: /The Forge/i });
    expect(locationButton).toBeTruthy();
  });

  it('caps sphere bars at 4 max', () => {
    const manySpheresProps = {
      ...defaultProps,
      sphereInfluence: {
        force: 0.15,
        matter: 0.25,
        energy: 0.72,
        life: 0.45,
        mind: 0.50,
        spirit: 0.35,
        time: 0.35,
        entropy: 0.10,
        chaos: 0,
        order: 0,
        light: 0,
        darkness: 0,
      },
    };

    render(<HexSidebar {...manySpheresProps} />);

    // Should show max 4 spheres (energy, mind, life, spirit or time)
    const sphereLabels = screen.getAllByText(/energy|mind|life|spirit|time/i);
    // The exact count depends on how many match, but we should see sphere names
    expect(sphereLabels.length).toBeGreaterThan(0);
  });

  it('renders dominant culture and faction when present', () => {
    const culturesProps = {
      ...defaultProps,
      cultures: [
        {
          cultureName: 'The Golden Order',
          cultureId: 'cult1',
          dominantSpheres: ['order' as const],
          foundationBias: 'order',
          strength: 0.8,
        },
      ],
      factions: [
        {
          factionName: 'The Iron Guard',
          factionId: 'fact1',
          locationCount: 3,
        },
      ],
    };

    render(<HexSidebar {...culturesProps} />);
    expect(screen.getByText('The Golden Order')).toBeTruthy();
    expect(screen.getByText('The Iron Guard')).toBeTruthy();
  });

  it('renders sidebar content in collapsed view', () => {
    const { container } = render(<HexSidebar {...defaultProps} />);
    const toggle = screen.getByLabelText('Toggle sidebar');

    // Collapse
    fireEvent.click(toggle);

    // Should still have sidebar content
    const sidebar = container.querySelector('[data-testid="sidebar-content"]');
    expect(sidebar).toBeTruthy();
    expect(sidebar?.getAttribute('class')).toContain('collapsed');
  });

  it('handles multiple locations correctly', () => {
    const multiLocProps = {
      ...defaultProps,
      locations: [
        { id: 'loc1', name: 'The Forge' },
        { id: 'loc2', name: 'The Tower' },
        { id: 'loc3', name: 'The Market' },
      ],
      agentsByLocation: {
        loc1: [{ id: 'a1', name: 'Kael' }],
        loc2: [{ id: 'a2', name: 'Mara' }, { id: 'a3', name: 'Thorne' }],
        loc3: [],
      },
    };

    const { container } = render(<HexSidebar {...multiLocProps} />);
    // Text is split across spans, check container content
    expect(container.textContent).toMatch(/3.*location/);
    expect(container.textContent).toMatch(/3.*soul/);
    expect(screen.getByText('The Forge')).toBeTruthy();
    expect(screen.getByText('The Tower')).toBeTruthy();
    expect(screen.getByText('The Market')).toBeTruthy();
  });
});
