// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HexChronicle } from '../HexChronicle';
import type { WorldGraph } from '../../../engine/graph';
import type { SphereName } from '../../../types';

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
        // `as const` so the array does not widen to `string[]` — without it every
        // `render(<HexChronicle {...makeTestProps()} />)` in this file is a type error
        // (20 of them before THR-1155 added four more), all from this one line.
        veneratedSpheres: ['time', 'energy'] as SphereName[],
        ruinDescriptors: ['shattered observatories', 'cracked lenses'],
        legacyFlavor: 'They read the heavens until the heavens read them back.',
      },
    },
    onLocationClick: () => {},
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

  it('renders inline soul cards in The People only (deduplicated)', () => {
    render(<HexChronicle {...makeTestProps()} />);
    // Agent appears only as SoulCard in The People — no AgentEntry duplication
    expect(screen.getAllByText('The Hollow King')).toHaveLength(1);
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

  // THR-439: survey people-layer swap
  it('renders dynamic survey band when surveyPeopleProse is present', () => {
    render(
      <HexChronicle
        {...makeTestProps({ surveyPeopleProse: 'The marshlands hum with old grief and new hunger.' })}
      />
    );
    expect(screen.getByText('The marshlands hum with old grief and new hunger.')).toBeTruthy();
  });

  it('reads the attribution caption as an elapsed span, never a turn index (THR-1426)', () => {
    // `turn 42` was an absolute tick index — Laws 13/14. `tick` is 90 here and the survey was
    // taken at 42, so the caption exercises the real multi-day branch (48 ticks = four days)
    // rather than `elapsedLabel`'s `less than a day` floor, which would pass against almost
    // any wiring and prove nothing about the reading chosen.
    render(
      <HexChronicle
        {...makeTestProps({
          surveyPeopleProse: 'Wanderers pass through without settling.',
          surveyPeopleProseTick: 42,
          tick: 90,
        })}
      />
    );
    const caption = screen.getByText(/^— surveyed /);
    expect(caption.textContent).toBe('— surveyed four days ago');
    expect(caption.textContent).not.toMatch(/\d/);
    expect(caption.textContent).not.toMatch(/tick|turn/i);
  });

  it('renders static fallback when surveyPeopleProse is absent', () => {
    const props = makeTestProps({
      cultures: [{ cultureId: 'c1', cultureName: 'The Iron Folk', foundationBias: 'order', dominantSpheres: [] }],
    });
    render(<HexChronicle {...props} />);
    // Static fallback text should appear since no surveyPeopleProse
    expect(screen.queryByText(/^— surveyed /)).toBeNull();
  });

  it('renders static fallback when surveyPeopleProse is empty string', () => {
    render(<HexChronicle {...makeTestProps({ surveyPeopleProse: '' })} />);
    // Empty string is falsy — attribution caption must not appear
    expect(screen.queryByText(/^— surveyed /)).toBeNull();
  });

  it('renders structured lists in both surveyed and unsurveyed branches', () => {
    const { rerender } = render(
      <HexChronicle
        {...makeTestProps({ surveyPeopleProse: 'A band of wanderers camps here.' })}
      />
    );
    // The People marker must render in both branches
    expect(screen.getByText('The People')).toBeTruthy();

    rerender(<HexChronicle {...makeTestProps()} />);
    expect(screen.getByText('The People')).toBeTruthy();
  });
});

/**
 * The *held by* line (THR-1155 slice 2).
 *
 * The chronicle already listed *Factions Present* — everyone with people on the hex —
 * and that is not title. A hex could name four guilds and never name the nation whose
 * border it sat inside, because nothing in the UI read the `controls` edge the political
 * map is projected from. These arms hold that it does now, and that a settlement nobody
 * holds still answers.
 */
describe('HexChronicle — held by (THR-1155)', () => {
  /** A graph whose one settlement is held by the Realm, or by nobody. */
  function graphHolding(held: boolean): WorldGraph {
    const realm = {
      id: 'faction_0',
      type: 'actor' as const,
      name: 'march of Shadow-Kept light',
      properties: { actorType: 'faction', factionClass: 'realm' },
    };
    const edge = {
      id: 'e_controls_0',
      source: 'faction_0',
      target: 'loc1',
      type: 'controls' as const,
      properties: { role: 'seat' },
    };
    return {
      getNode: (id: string) => (id === 'faction_0' ? realm : null),
      getOutgoingEdges: () => [],
      getIncomingEdges: (id: string, type: string) =>
        held && id === 'loc1' && type === 'controls' ? [edge] : [],
      getNodesByType: () => [],
    } as unknown as WorldGraph;
  }

  it('names the Realm that holds the hex\'s settlement, with its seat', () => {
    render(<HexChronicle {...makeTestProps({ graph: graphHolding(true) })} />);

    const block = screen.getByTestId('chronicle-held-by');
    expect(block.textContent).toContain('Held by');
    expect(block.textContent).toContain('march of Shadow-Kept light');
    expect(block.textContent).toContain('seat of the court');
  });

  it('says Unclaimed for a settlement no faction holds', () => {
    render(<HexChronicle {...makeTestProps({ graph: graphHolding(false) })} />);

    // The falsifying pair for the arm above: the same hex, the same settlement, and the
    // only difference is the edge. A block that rendered the holder from the faction
    // list rather than the edge would name someone here.
    expect(screen.getByTestId('chronicle-held-by').textContent).toContain('Unclaimed');
    expect(screen.queryByText('march of Shadow-Kept light')).toBeNull();
  });

  it('renders no allegiance block on a hex with no settlement', () => {
    // Wilderness answers through the border, not through a row that says nothing.
    render(<HexChronicle {...makeTestProps({ locations: [], agentsByLocation: {}, graph: graphHolding(true) })} />);

    expect(screen.queryByTestId('chronicle-held-by')).toBeNull();
  });

  it('reads the outer tier — a hex whose only entry is a Place has no allegiance line', () => {
    // A `controls` edge points at a settlement, never at the tavern inside it. Without
    // the place-tier filter the line would read a sublocation's holder, which is
    // reliably nobody, and print *Unclaimed* over a town a Realm holds.
    render(
      <HexChronicle
        {...makeTestProps({
          locations: [{
            id: 'sub1',
            type: 'location' as const,
            name: 'The Gilded Cup',
            properties: { locationSubtype: 'tavern', parentLocationId: 'loc1' },
          }],
          agentsByLocation: {},
          graph: graphHolding(true),
        })}
      />,
    );

    expect(screen.queryByTestId('chronicle-held-by')).toBeNull();
  });
});
