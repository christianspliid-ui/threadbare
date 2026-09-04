// @vitest-environment jsdom
/**
 * THR-1413 — the ascendant's companions have a surface.
 *
 * The dead state these pin: `grant_companion` resolves `nodeId: '$actor'` to the
 * ascendant on every player cast of `action.gold.hire-mercenaries`, and
 * `computeRawScore` walks `accompanies` on *any* node — so the companion was
 * already raising the ascendant's reach capability while appearing on no surface
 * at all (`AscendantSheet` had zero companion hits before this change).
 *
 * Decision 2 of the ticket, recorded: render rather than refuse. Refusing the grant
 * would delete a capability term that already works and turn a castable action into
 * a silent no-op; rendering makes live state visible (Law 56). The falsification arm
 * below is the one that matters — it fails if the section renders unconditionally,
 * which would make the passing arm meaningless.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { AscendantSheet } from '../AscendantSheet';
import { WorldGraph } from '../../../engine/graph';
import { mintCompanion, getCompanions } from '../../../engine/companions';
import { computeRawScore } from '../../../engine/domainCapability';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';

const ASCENDANT_ID = 'asc_1';

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASCENDANT_ID,
    type: 'actor',
    name: 'The Witness',
    properties: { actorType: 'ascendant' },
  });
  return graph;
}

function makeState(graph: WorldGraph): GameState {
  return {
    tick: 12,
    cycle: 0,
    seed: 42,
    graph,
    phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: ASCENDANT_ID,
    essencePool: {},
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    clearanceGateStates: new Map(),
  } as unknown as GameState;
}

const ARCHETYPE = {
  name: 'The Witness',
  sphereAlignment: { primary: 'mind', secondary: 'spirit' },
  startingDomainAffinities: {},
} as unknown as AscendantArchetype;

function renderSheet(state: GameState) {
  return render(
    <AscendantSheet
      open
      onClose={() => {}}
      gameState={state}
      archetype={ARCHETYPE}
      avatarName="Aurel Vane"
      sphereColor="#8899ff"
      originFragmentId="frag_1"
    />,
  );
}

describe('AscendantSheet — companions (THR-1413)', () => {
  it('renders a companion granted to the ascendant, with the reach bonus it actually contributes', () => {
    const graph = makeGraph();
    const minted = mintCompanion(
      graph,
      'companion.sellsword-band',
      ASCENDANT_ID,
      12,
      () => 0.5,
      { source: 'action.gold.hire-mercenaries' },
    );
    expect(minted).not.toBeNull();

    renderSheet(makeState(graph));

    expect(screen.getByText('Companions')).toBeTruthy();
    const row = screen.getByTestId('ascendant-companion-companion.sellsword-band');

    // Scoped to the row: the generated personal name is the row's subject — a god's
    // retinue has names, not just professions. Scoped rather than global because the
    // name generator draws from the same cultural pools the avatar's name comes from,
    // so a global `getByText` can collide with the avatar (it did: both were "Kael").
    expect(within(row).getByText(minted!.name)).toBeTruthy();
    expect(within(row).getByText('Sellsword Band')).toBeTruthy();

    // The contribution is real — this is the term `computeRawScore` adds.
    const contribution = getCompanions(graph, ASCENDANT_ID)[0].domainContributions.iron ?? 0;
    expect(contribution).toBeGreaterThan(0);
    expect(computeRawScore(graph, ASCENDANT_ID, 'iron')).toBeCloseTo(contribution, 5);

    // ...and it reaches the player as a named Reach, never as the raw term (Law 13).
    expect(within(row).getByText(/Steadies your Iron\./)).toBeTruthy();
    expect(row.textContent ?? '').not.toMatch(/[+-]?\d/);
  });

  it('omits the section entirely when the ascendant walks alone', () => {
    renderSheet(makeState(makeGraph()));

    expect(screen.queryByText('Companions')).toBeNull();
  });
});
