// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HexChronicle } from '../HexChronicle';
import type { WorldGraph } from '../../../engine/graph';

function makeTestProps(overrides: Partial<any> = {}) {
  // Create a minimal mock graph
  const mockGraph = {
    getNode: () => null,
    getOutgoingEdges: () => [],
    getIncomingEdges: () => [],
    getNodesByType: () => [],
  } as unknown as WorldGraph;

  return {
    terrain: 'plateau' as const,
    hexCol: 8,
    hexRow: 6,
    lineOfSight: 'full' as const,
    sphereInfluence: {
      force: 0.1,
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
    cultures: [],
    factions: [],
    locations: [
      {
        id: 'loc1',
        type: 'location' as const,
        name: 'The Forge of Sorrow',
        properties: { locationSubtype: 'settlement' },
      },
    ],
    agentsByLocation: {
      loc1: [
        {
          id: 'agent1',
          type: 'actor' as const,
          name: 'The Hollow King',
          properties: { narrativeArchetype: 'Reluctant King', primarySphere: 'force' },
        },
      ],
    },
    regionData: {
      regionId: 'r0',
      regionName: 'The Storm-Born Reach',
      featureType: 'plains',
      hexCount: 14,
      historicalCulture: {
        id: 'hc0',
        name: 'The Star-Readers',
        templateName: 'The Star-Readers',
        foundationBias: 'chaos',
        veneratedSpheres: ['time', 'energy'],
        ruinDescriptors: ['shattered observatories', 'cracked lenses'],
        legacyFlavor: 'They read the heavens until the heavens read them back.',
      },
    },
    onLocationClick: () => {},
    onLocationDoubleClick: () => {},
    onAgentClick: () => {},
    graph: mockGraph,
    seed: 42,
    ...overrides,
  };
}

describe('HexChronicle', () => {
  it('renders all four layer markers when historical culture exists', () => {
    render(<HexChronicle {...makeTestProps()} />);
    expect(screen.getByText('The Land')).toBeTruthy();
    expect(screen.getByText('The Soul')).toBeTruthy();
    expect(screen.getByText('The People')).toBeTruthy();
    expect(screen.getByText('The Ruins')).toBeTruthy();
  });

  it('renders region name in hero', () => {
    render(<HexChronicle {...makeTestProps()} />);
    expect(screen.getByText('The Storm-Born Reach')).toBeTruthy();
  });

  it('renders terrain label in subtitle', () => {
    render(<HexChronicle {...makeTestProps()} />);
    expect(screen.getByText(/Plateau/)).toBeTruthy();
  });

  it('renders inline location cards', () => {
    render(<HexChronicle {...makeTestProps()} />);
    // LocationCard title
    expect(screen.getAllByText('The Forge of Sorrow').length).toBeGreaterThan(0);
  });

  it('renders inline soul cards', () => {
    render(<HexChronicle {...makeTestProps()} />);
    expect(screen.getByText('The Hollow King')).toBeTruthy();
  });

  it('hides Ruins layer when no historical culture exists', () => {
    render(
      <HexChronicle
        {...makeTestProps({
          regionData: {
            regionId: 'r0',
            regionName: 'Wild',
            featureType: 'plains',
            hexCount: 5,
            historicalCulture: null,
          },
        })}
      />
    );
    expect(screen.queryByText('The Ruins')).toBeNull();
  });

  it('shows fog-of-war when lineOfSight is none', () => {
    render(<HexChronicle {...makeTestProps({ lineOfSight: 'none' })} />);
    expect(screen.getByText('Unknown Territory')).toBeTruthy();
    expect(screen.queryByText('The Land')).toBeNull();
  });

  it('renders exploration hooks from ruin descriptors', () => {
    render(<HexChronicle {...makeTestProps()} />);
    expect(screen.getByText(/shattered observatories/)).toBeTruthy();
  });

  it('renders epitaph from legacyFlavor', () => {
    render(<HexChronicle {...makeTestProps()} />);
    expect(screen.getByText(/read the heavens/)).toBeTruthy();
  });

  it('handles null regionData gracefully', () => {
    render(<HexChronicle {...makeTestProps({ regionData: null })} />);
    // Should still render the terrain label and land layer
    const allPlateauMatches = screen.getAllByText(/Plateau/);
    expect(allPlateauMatches.length).toBeGreaterThan(0);
    expect(screen.getByText('The Land')).toBeTruthy();
  });

  it('handles null sphereInfluence gracefully', () => {
    render(<HexChronicle {...makeTestProps({ sphereInfluence: null })} />);
    expect(screen.getByText('The Land')).toBeTruthy();
  });

  it('renders hex coordinates in subtitle', () => {
    render(<HexChronicle {...makeTestProps()} />);
    expect(screen.getByText(/8, 6/)).toBeTruthy();
  });

  it('handles empty locations array', () => {
    render(<HexChronicle {...makeTestProps({ locations: [] })} />);
    expect(screen.getByText('The People')).toBeTruthy();
    expect(screen.queryByText('The Forge of Sorrow')).toBeNull();
  });

  it('handles empty agentsByLocation', () => {
    render(<HexChronicle {...makeTestProps({ agentsByLocation: {} })} />);
    expect(screen.getByText('The People')).toBeTruthy();
    expect(screen.queryByText('The Hollow King')).toBeNull();
  });
});
