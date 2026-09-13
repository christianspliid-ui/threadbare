// @vitest-environment jsdom
/**
 * The Merchant Consortium's sheet opens without a duplicate React key — THR-1460.
 *
 * The reported symptom, three times on every open of that faction's sheet:
 *
 *   Encountered two children with the same key, `loc_58`.
 *
 * `FactionNetworkGraph` drew `[...summary.halls, ...summary.controlledLocations]`
 * keyed by `location.id`. Those two lists were each deduped against themselves and
 * never against each other, so `loc_58` — a settlement that is both a Consortium
 * hall and a Consortium `controls` target — arrived twice.
 *
 * **This is the sanctioned unattended substitution for the browser capture**
 * (`Docs/canon/verification-gates.md` § Browser-verify): a scheduled run cannot
 * start a dev server, so the evidence is a jsdom render of the real component. It
 * is stronger than a fixture render in the way that matters here — the graph is
 * **generated**, so the overlapping edges are worldgen's, not the test's, and the
 * faction under test is the one named in the report rather than a stand-in.
 *
 * The console arm is the literal Done-when. React reports a duplicate key through
 * `console.error`, so spying on it and asserting the render is silent reproduces
 * exactly the read a browser console would have given.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FactionSheet } from '../FactionSheet';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../engine/gameInit';
import { createBalancedCosmology } from '../../../engine/cosmology';
import { generateArchetypes } from '../../../engine/ascendant';
import { getFactionNetworkSummary } from '../../../engine/factionNetwork';
import type { WorldGraph } from '../../../engine/graph';
import type { GraphNode } from '../../../types/graph';

const SEED = 42;
/** The faction the report names. */
const FACTION_NAME = 'The Merchant Consortium';
/** The network diagram's own viewBox, used to scope assertions to it. */
const NETWORK_SVG = 'svg[viewBox="0 0 520 260"]';

let graph: WorldGraph;
let faction: GraphNode;
/** The Location the Consortium holds BOTH ways — `loc_58` as reported. */
let sharedLocationId: string;
let sharedLocationName: string;

beforeAll(() => {
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, SEED)[0];
  graph = initializeGameState(
    archetype, 'Consortium', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  ).state.graph;

  faction = graph.getNodesByType('actor')
    .find(node => node.properties.actorType === 'faction' && node.name === FACTION_NAME) as GraphNode;

  const summary = getFactionNetworkSummary(graph, faction?.id ?? '');
  const hallIds = new Set((summary?.halls ?? []).map(hall => hall.id));
  const shared = (summary?.controlledLocations ?? []).find(location => hallIds.has(location.id));
  sharedLocationId = shared?.id ?? '';
  sharedLocationName = shared?.name ?? '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FactionSheet draws a twice-held Location once (THR-1460)', () => {
  it('the reported faction really does hold one Location two ways — the non-vacuity arm', () => {
    // Without this the silent-console arm below proves nothing: a Consortium with no
    // overlap never had a duplicate key to log in the first place.
    expect(faction, `${FACTION_NAME} is not on the generated world`).toBeDefined();
    expect(sharedLocationId).not.toBe('');
  });

  it('renders with no duplicate-key error on the console', () => {
    const errors: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
    });

    render(
      <FactionSheet
        factionId={faction.id}
        name={faction.name}
        graph={graph}
        onClose={() => {}}
      />,
    );

    const duplicateKeyErrors = errors.filter(message => message.includes('same key'));
    expect(duplicateKeyErrors, duplicateKeyErrors.join('\n')).toEqual([]);
  });

  it('draws the twice-held Location as exactly one node in the network diagram', () => {
    // `baseElement`, not `container`: the sheet renders through `Modal`, which
    // portals out of the render container.
    const { baseElement } = render(
      <FactionSheet
        factionId={faction.id}
        name={faction.name}
        graph={graph}
        onClose={() => {}}
      />,
    );

    // Scoped to the diagram: the same settlement legitimately appears again in the
    // "Halls & Seats" list, and asserting over the whole sheet would count those.
    const svg = baseElement.querySelector(NETWORK_SVG);
    expect(svg).not.toBeNull();

    const labels = [...svg!.querySelectorAll('text')]
      .map(node => node.textContent)
      .filter(text => text === sharedLocationName);
    expect(labels.length, `${sharedLocationName} is drawn ${labels.length} times`).toBe(1);
  });
});
