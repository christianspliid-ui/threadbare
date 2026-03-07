// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RivalPanel } from '../RivalPanel';
import type { RivalDefinition, RivalState } from '../../../types/rival';

describe('RivalPanel', () => {
  const mockDefinitions: RivalDefinition[] = [
    {
      id: 'rival-1',
      name: 'The Iron Tyrant',
      behavior: 'aggressive',
      sphereAlignment: {
        foundations: { chaos: 0.7, order: 0.3, light: 0.2, darkness: 0.8 },
        creations: {
          force: 0.9,
          matter: 0.5,
          energy: 0.7,
          life: 0.2,
          mind: 0.4,
          spirit: 0.3,
          time: 0.5,
          entropy: 0.6,
        },
      },
      oppositionStrength: 0.85,
      description: 'A war god who despises the player',
    },
    {
      id: 'rival-2',
      name: 'The Silent Weaver',
      behavior: 'subtle',
      sphereAlignment: {
        foundations: { chaos: 0.5, order: 0.5, light: 0.4, darkness: 0.6 },
        creations: {
          force: 0.3,
          matter: 0.4,
          energy: 0.4,
          life: 0.5,
          mind: 0.8,
          spirit: 0.7,
          time: 0.6,
          entropy: 0.4,
        },
      },
      oppositionStrength: 0.6,
      description: 'A cunning god who works from the shadows',
    },
    {
      id: 'rival-3',
      name: 'The Storm King',
      behavior: 'expansionist',
      sphereAlignment: {
        foundations: { chaos: 0.8, order: 0.2, light: 0.6, darkness: 0.4 },
        creations: {
          force: 0.7,
          matter: 0.3,
          energy: 0.9,
          life: 0.4,
          mind: 0.5,
          spirit: 0.6,
          time: 0.5,
          entropy: 0.5,
        },
      },
      oppositionStrength: 0.7,
      description: 'An expansionist god seeking to spread influence',
    },
  ];

  const mockStates: RivalState[] = [
    {
      rivalId: 'rival-1',
      active: true,
      interventionCount: 5,
      agentsControlled: 3,
      regionsInfluenced: ['north', 'east'],
      hostilityToPlayer: 0.9,
      ticksSinceAction: 2,
    },
    {
      rivalId: 'rival-2',
      active: true,
      interventionCount: 2,
      agentsControlled: 1,
      regionsInfluenced: ['south'],
      hostilityToPlayer: 0.4,
      ticksSinceAction: 5,
    },
    {
      rivalId: 'rival-3',
      active: true,
      interventionCount: 3,
      agentsControlled: 2,
      regionsInfluenced: ['west', 'center'],
      hostilityToPlayer: 0.6,
    },
  ];

  it('renders all rival names', () => {
    render(<RivalPanel definitions={mockDefinitions} states={mockStates} />);
    expect(screen.getByText('The Iron Tyrant')).toBeInTheDocument();
    expect(screen.getByText('The Silent Weaver')).toBeInTheDocument();
    expect(screen.getByText('The Storm King')).toBeInTheDocument();
  });

  it('shows behavior type indicators', () => {
    render(<RivalPanel definitions={mockDefinitions} states={mockStates} />);
    expect(screen.getByText('aggressive')).toBeInTheDocument();
    expect(screen.getByText('subtle')).toBeInTheDocument();
    expect(screen.getByText('expansionist')).toBeInTheDocument();
  });

  it('renders behavior icons for each rival', () => {
    const { container } = render(<RivalPanel definitions={mockDefinitions} states={mockStates} />);
    const icons = container.querySelectorAll('span');
    const iconTexts = Array.from(icons).map(el => el.textContent);
    expect(iconTexts).toContain('⚔️'); // aggressive
    expect(iconTexts).toContain('👁️'); // subtle
    expect(iconTexts).toContain('🌊'); // expansionist
  });

  it('displays hostility meter for each rival', () => {
    const { container } = render(<RivalPanel definitions={mockDefinitions} states={mockStates} />);
    // Hostility label now appears once as header instead of per-rival
    const hostilityLabel = screen.getByText('Hostility');
    expect(hostilityLabel).toBeInTheDocument();
    // Verify all three rivals have hostility bars (check for the bars with different widths)
    const hostilityBars = container.querySelectorAll('[class*="rounded-full"][style*="background"]');
    expect(hostilityBars.length).toBeGreaterThanOrEqual(3); // At least 3 bars for hostility + essence spheres
  });

  it('renders empty state when no rivals defined', () => {
    render(<RivalPanel definitions={[]} states={[]} />);
    expect(screen.getByText('No rival gods stir... yet.')).toBeInTheDocument();
  });

  it('handles rivals without state gracefully', () => {
    const defsWithoutState: RivalDefinition[] = [
      {
        id: 'rival-4',
        name: 'The Unknown',
        behavior: 'territorial',
        sphereAlignment: {
          foundations: { chaos: 0.5, order: 0.5, light: 0.5, darkness: 0.5 },
          creations: {
            force: 0.5,
            matter: 0.5,
            energy: 0.5,
            life: 0.5,
            mind: 0.5,
            spirit: 0.5,
            time: 0.5,
            entropy: 0.5,
          },
        },
        oppositionStrength: 0.5,
        description: 'An unknown rival',
      },
    ];
    render(<RivalPanel definitions={defsWithoutState} states={[]} />);
    expect(screen.getByText('The Unknown')).toBeInTheDocument();
    expect(screen.getByText('territorial')).toBeInTheDocument();
  });

  it('shows header when rivals are present', () => {
    render(<RivalPanel definitions={mockDefinitions} states={mockStates} />);
    expect(screen.getByText('Rival Gods')).toBeInTheDocument();
  });
});
