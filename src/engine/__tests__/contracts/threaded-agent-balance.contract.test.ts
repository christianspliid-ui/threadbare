/**
 * Threaded Agent Balance Contract
 *
 * Verifies a real threaded hero journey can surface encounter starvation in telemetry
 * and then recover via forced travel. This is a seeded contract test against the
 * initialized game pipeline, not a mocked unit test.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { DEV_ASCENDANT_IDENTITY, devSeedTheFirst, initializeGameStateFromIdentity } from '../../gameInit';
import { createBalancedCosmology } from '../../cosmology';
import { runTick, resetDecisionCache, resetEventCounter } from '../../orchestrator';
import { createSimulationRuntime } from '../../simulationRuntime';
import { setTrackedAgents } from '../../balanceTelemetry';
import { buildBalanceAgentJourneySummary, buildBalanceRunSummary } from '../../balanceSummary';
import { IDLE_FORCED_TRAVEL_THRESHOLD } from '../../../data/agent-behavior-constants';
import { hexDistance } from '../../../lib/hexMath';
import { REACH_DOMAINS } from '../../../types/traits';

function moveAgentToLocation(state: ReturnType<typeof initializeGameStateFromIdentity>['state'], agentId: string, locationId: string): void {
  for (const edge of state.graph.getOutgoingEdges(agentId, 'located_at')) {
    state.graph.removeEdge(edge.id);
  }
  state.graph.addEdge({
    id: `contract.located_at.${agentId}.${locationId}`,
    source: agentId,
    target: locationId,
    type: 'located_at',
    properties: {},
  });

  const agent = state.graph.getNode(agentId);
  if (agent) {
    state.graph.updateNode(agentId, {
      properties: {
        ...agent.properties,
        locationId,
        movementState: undefined,
        consecutiveIdleTicks: 0,
      },
    });
  }
}

function stripAgentAwarenessInputs(
  state: ReturnType<typeof initializeGameStateFromIdentity>['state'],
  agentId: string,
): void {
  for (const edgeType of ['has_trait', 'possesses', 'bonded_to', 'controls', 'member_of'] as const) {
    for (const edge of state.graph.getOutgoingEdges(agentId, edgeType)) {
      state.graph.removeEdge(edge.id);
    }
  }

  const agent = state.graph.getNode(agentId);
  if (!agent) return;

  const domainCapabilities = Object.fromEntries(REACH_DOMAINS.map(domain => [domain, 0]));
  state.graph.updateNode(agentId, {
    properties: {
      ...agent.properties,
      domainCapabilities,
    },
  });
}

function pickUnusedHexPair(state: ReturnType<typeof initializeGameStateFromIdentity>['state']): [{ col: number; row: number }, { col: number; row: number }] {
  const occupied = new Set(
    state.graph.getNodesByType('location')
      .map((node) => {
        const col = node.properties.hexCol as number | undefined;
        const row = node.properties.hexRow as number | undefined;
        return col != null && row != null ? `${col},${row}` : null;
      })
      .filter((key): key is string => key !== null),
  );
  const maxCol = Math.max(...state.tiles.map(tile => tile.coord.col));
  const maxRow = Math.max(...state.tiles.map(tile => tile.coord.row));

  const openTiles = state.tiles
    .map(tile => tile.coord)
    .filter(coord => !occupied.has(`${coord.col},${coord.row}`));
  const interiorTiles = openTiles.filter(coord =>
    coord.col > 0
    && coord.row > 0
    && coord.col < maxCol
    && coord.row < maxRow,
  );
  const candidateTiles = interiorTiles.length >= 2 ? interiorTiles : openTiles;

  if (candidateTiles.length < 2) {
    throw new Error(`Expected at least 2 unused hexes for the starvation contract, found ${candidateTiles.length}`);
  }

  const desertHex = candidateTiles
    .slice()
    .sort((a, b) => (a.col + a.row) - (b.col + b.row))[0];
  const contentHex = candidateTiles
    .filter(coord => coord.col !== desertHex.col || coord.row !== desertHex.row)
    .slice()
    .sort((a, b) => hexDistance(desertHex, b) - hexDistance(desertHex, a))[0];

  return [desertHex, contentHex];
}

describe('threaded agent balance telemetry contract', () => {
  beforeEach(() => {
    resetDecisionCache();
    resetEventCounter();
  });

  it('records starvation idles and forced-travel recovery for a threaded hero', () => {
    const { state } = initializeGameStateFromIdentity(
      DEV_ASCENDANT_IDENTITY,
      42,
      createBalancedCosmology(),
      'small',
    );
    const threadedId = devSeedTheFirst(state);
    const [desertHex, contentHex] = pickUnusedHexPair(state);

    state.graph.addNode({
      id: 'loc.contract.silent_verge',
      type: 'location',
      name: 'Silent Verge',
      properties: {
        hexCol: desertHex.col,
        hexRow: desertHex.row,
        locationType: 'location',
        locationSubtype: 'void_contract',
      },
    });
    state.graph.addNode({
      id: 'loc.contract.beacon_market',
      type: 'location',
      name: 'Beacon Market',
      properties: {
        hexCol: contentHex.col,
        hexRow: contentHex.row,
        locationType: 'town',
        locationSubtype: 'town',
      },
    });

    moveAgentToLocation(state, threadedId, 'loc.contract.silent_verge');
    stripAgentAwarenessInputs(state, threadedId);

    const runtime = createSimulationRuntime();
    setTrackedAgents(runtime, [threadedId]);

    let current = state;
    for (let i = 0; i < IDLE_FORCED_TRAVEL_THRESHOLD + 2; i++) {
      current = runTick(current, [], runtime);
    }

    const summary = buildBalanceRunSummary(runtime, current.tick);
    const journey = buildBalanceAgentJourneySummary(runtime, threadedId, 'Kael Thornweaver');

    expect(summary?.encounterDecisions?.idleReasons['no_candidates_after_filter']).toBeGreaterThan(0);
    expect(summary?.encounterDecisions?.countsByType['forced_travel']).toBeGreaterThan(0);
    expect(summary?.encounterDecisions?.byLocationSubtype['void_contract']?.idleDecisions).toBeGreaterThan(0);
    expect(journey?.longestIdleStreak).toBeGreaterThanOrEqual(IDLE_FORCED_TRAVEL_THRESHOLD);
    expect(journey?.decisionCounts['forced_travel']).toBeGreaterThan(0);
  });
});
