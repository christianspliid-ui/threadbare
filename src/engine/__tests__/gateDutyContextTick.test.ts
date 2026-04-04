import { describe, expect, it } from 'vitest';
import { initializeGameState } from '../gameInit';
import { prepareDebugEncounterContext } from '../debugEncounterTools';
import { runTick, resetDecisionCache, resetEventCounter } from '../orchestrator';
import { createSimulationRuntime } from '../simulationRuntime';

function makeInitializedState() {
  const init = initializeGameState({
    name: 'Oracle',
    sphereAlignment: { primary: 'thread', secondary: 'winter' },
    title: 'Oracle',
    decreeNouns: [],
    themes: [],
    startingMutations: [],
  } as never, 'Oracle', { reachDomains: [], spheres: [] } as never, 42, 32, 24);
  return init.state;
}

function topLevelLocations(state: ReturnType<typeof makeInitializedState>) {
  return state.graph.getNodesByType('location').filter(node => node.properties.parentLocationId === undefined);
}

function findEmptyHex(state: ReturnType<typeof makeInitializedState>) {
  const occupied = new Set(
    topLevelLocations(state).map(node => `${node.properties.hexCol},${node.properties.hexRow}`),
  );
  for (const tile of state.tiles) {
    const key = `${tile.coord.col},${tile.coord.row}`;
    if (!occupied.has(key)) {
      return tile.coord;
    }
  }
  throw new Error('No empty hex available for encounter-context test.');
}

function findOccupiedNonSettlementHex(state: ReturnType<typeof makeInitializedState>) {
  return topLevelLocations(state).find(node => {
    const subtype = (node.properties.locationSubtype ?? node.properties.locationType) as string | undefined;
    return subtype !== undefined && !['town', 'city', 'capital'].includes(subtype);
  });
}

describe('Gate Duty debug context', () => {
  it('creates context on an empty hex without poisoning later ticks', () => {
    resetDecisionCache();
    resetEventCounter();

    const state = makeInitializedState();
    const before = state.tick;
    const emptyHex = findEmptyHex(state);

    const context = prepareDebugEncounterContext(state, 'cg.quest.gate_duty', {
      agentQuery: '@hero',
      col: emptyHex.col,
      row: emptyHex.row,
    });

    expect(context.success).toBe(true);

    const afterTick = runTick(state, [], createSimulationRuntime());
    expect(afterTick.tick).toBe(before + 1);
  });

  it('refuses to spawn a debug settlement on top of an occupied non-settlement hex', () => {
    const state = makeInitializedState();
    const occupied = findOccupiedNonSettlementHex(state);
    expect(occupied).toBeDefined();

    const result = prepareDebugEncounterContext(state, 'cg.quest.gate_duty', {
      agentQuery: '@hero',
      col: occupied!.properties.hexCol as number,
      row: occupied!.properties.hexRow as number,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('already occupied');
  });
});
