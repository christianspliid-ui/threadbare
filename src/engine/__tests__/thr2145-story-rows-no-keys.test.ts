// @vitest-lane heavy — builds a medium world and drives it until a destroy × power lands (THR-2145)
/**
 * No Story row on a generated world reads an engine key (THR-2145, UI Law 14).
 *
 * The bug report saw `cell.destroy.power (afflicted)` on the First's sheet about 200 ticks
 * into a seeded medium world. This runs the real `initializeGameState → runTick` pipeline,
 * starts a `cell.destroy.power` through the review lever with its band pinned to `success`
 * (the pattern in `undertakingPortent.live.test.ts`), drives it until its outcome node
 * exists, and then sweeps every individual's Story group for a dotted key.
 */

import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { RIVAL_GRACE_TICKS_AFTER_BOND } from '../../data/game-config';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { startUndertakingForReview } from '../undertakingReviewLevers';
import { enqueueUndertakingMoments } from '../undertakingMoments';
import { isUndertakingOutcomeEventId } from '../grievance/undertakingOutcomeNode';
import { buildConnections } from '../views/connections';

const SEED = 42;
const WARMUP_TICKS = 3;
const MAX_TICKS = 90;
const DOTTED_KEY = /[a-z]+\.[a-z_.]+/;

describe('THR-2145 — no Story row on a generated world reads an engine key', () => {
  it('a destroy × power outcome reaches the sheet as words', () => {
    const runtime = createSimulationRuntime();
    const archetype = generateArchetypes(4, SEED)[0];
    const preset = MAP_SIZE_PRESETS.medium;
    let { state } = initializeGameState(
      archetype, 'story-rows', createBalancedCosmology(), SEED, preset.cols, preset.rows,
    );
    state = { ...state, doomClock: { ...state.doomClock, wokeAtTick: -RIVAL_GRACE_TICKS_AFTER_BOND } };
    for (let i = 0; i < WARMUP_TICKS; i++) state = runTick(state, [], runtime);

    const start = startUndertakingForReview(state, state.graph, 'ind_0', 'cell.destroy.power', { band: 'success' });
    expect(start.ok, start.message).toBe(true);
    state = {
      ...state,
      strategicState: start.strategicState ?? state.strategicState,
      pendingUndertakingMoments: start.moments?.length
        ? enqueueUndertakingMoments(state.pendingUndertakingMoments, start.moments, state.tick)
        : state.pendingUndertakingMoments,
    };

    let outcomeNodeId: string | undefined;
    for (let t = 0; t < MAX_TICKS && !outcomeNodeId; t++) {
      state = runTick(state, [], runtime);
      outcomeNodeId = state.graph.getNodesByType('event').find(n =>
        isUndertakingOutcomeEventId(n.id) && n.properties?.templateId === 'cell.destroy.power',
      )?.id;
    }
    expect(outcomeNodeId, `the destroy × power never completed in ${MAX_TICKS} ticks`).toBeDefined();

    const sweptRows: string[] = [];
    let outcomeRowSeen = false;
    for (const agent of state.graph.getNodesByType('actor')) {
      if (agent.properties?.actorType !== 'individual') continue;
      const story = buildConnections(state.graph, state, { cls: 'person', id: agent.id }).groups.find(g => g.id === 'story');
      for (const row of story?.rows ?? []) {
        sweptRows.push(row.name);
        if (row.ref.id === outcomeNodeId) outcomeRowSeen = true;
      }
    }
    expect(outcomeRowSeen, 'the outcome node reached no Story group — the sweep would be vacuous').toBe(true);
    expect(sweptRows.filter(n => DOTTED_KEY.test(n))).toEqual([]);
    expect(state.graph.getNode(outcomeNodeId!)!.name).toBe('Destroy a power');
  }, 300_000);
});
