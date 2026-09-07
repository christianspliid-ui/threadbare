// @vitest-lane heavy — builds a medium world and drives it until a razing lands (THR-1432)
/**
 * A mortal's work casts omens — in the live simulation.
 *
 * The unit tests next door prove the reader against nodes the real writer wrote into
 * a bare graph. What they cannot prove is that the two halves meet in the tick: that
 * the lifecycle's completion writes the node in a phase the omen agenda runs after,
 * that the phase's partial is merged into `state.emittedOmens`, and that the decay
 * phase does not eat the portent before anyone reads it. So this runs the real
 * `initializeGameState → runTick` pipeline: a destroy × Location started through the
 * review lever with its band pinned to `success`, driven until its outcome node
 * exists, and then the next tick's omen asserted.
 *
 * THR-1432's Done-when said "tick 12". Measured on this seed the cell needs 36
 * progress at 6 per checkpoint, so it completes around tick 40 — the calibration
 * THR-1403 is changing. The horizon here is the measurement, not the wish.
 */

import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { startUndertakingForReview } from '../undertakingReviewLevers';
import { enqueueUndertakingMoments } from '../undertakingMoments';
import { isUndertakingOutcomeEventId } from '../grievance/undertakingOutcomeNode';
import { OMEN_UNDERTAKING_LOOKBACK_TICKS } from '../../data/game-config';

const SEED = 42;
const WARMUP_TICKS = 3;
const MAX_TICKS = 70;

describe('a razing portends in the live simulation (THR-1432)', () => {
  it('the outcome node a destroy × Location leaves becomes an emitted omen on the next tick', () => {
    const runtime = createSimulationRuntime();
    const archetype = generateArchetypes(4, SEED)[0];
    const preset = MAP_SIZE_PRESETS.medium;
    let { state } = initializeGameState(
      archetype, 'portent', createBalancedCosmology(), SEED, preset.cols, preset.rows,
    );
    for (let i = 0; i < WARMUP_TICKS; i++) state = runTick(state, [], runtime);

    const start = startUndertakingForReview(state, state.graph, 'ind_0', 'cell.destroy.location', { band: 'success' });
    expect(start.ok, start.message).toBe(true);
    state = {
      ...state,
      strategicState: start.strategicState ?? state.strategicState,
      pendingUndertakingMoments: start.moments?.length
        ? enqueueUndertakingMoments(state.pendingUndertakingMoments, start.moments, state.tick)
        : state.pendingUndertakingMoments,
    };

    // No portent from a mortal's work before any work has landed.
    expect((state.emittedOmens ?? []).some(o => o.provenance?.kind === 'undertaking')).toBe(false);

    let outcomeNodeId: string | undefined;
    let outcomeTick = -1;
    let ticks = 0;
    while (ticks < MAX_TICKS && !outcomeNodeId) {
      state = runTick(state, [], runtime);
      ticks++;
      const node = state.graph.getNodesByType('event').find(n =>
        isUndertakingOutcomeEventId(n.id) && n.properties?.templateId === 'cell.destroy.location' && n.properties?.culpritAgentId === 'ind_0',
      );
      if (node) { outcomeNodeId = node.id; outcomeTick = node.properties.tick as number; }
    }
    expect(outcomeNodeId, `the destroy never completed in ${MAX_TICKS} ticks — the review lever or the band pin is broken`).toBeDefined();

    // The omen agenda phase runs before the lifecycle inside a tick, so the node
    // written at tick T is weighed at T+1 — well inside the lookback.
    state = runTick(state, [], runtime);
    const portent = (state.emittedOmens ?? []).find(o => o.provenance?.outcomeNodeId === outcomeNodeId);
    expect(portent, `no portent for ${outcomeNodeId} (written at tick ${outcomeTick}, now ${state.tick})`).toBeDefined();
    expect(state.tick - outcomeTick).toBeLessThanOrEqual(OMEN_UNDERTAKING_LOOKBACK_TICKS);
    expect(portent!.provenance).toMatchObject({ kind: 'undertaking', harmClass: 'property_destroyed', culpritAgentId: 'ind_0' });
    expect(portent!.provenance!.deed).toMatch(/^the razing of /);
    expect(portent!.narrativeHook).not.toMatch(/evt_und_|cell\./);
    expect(state.graph.getNode(outcomeNodeId!)!.properties.portendedTick).toBe(state.tick);
    // eslint-disable-next-line no-console
    console.log(`[THR-1432 live] ${outcomeNodeId} written at tick ${outcomeTick} (${ticks} ticks after the spawn); portent ${portent!.omenId} at tick ${state.tick}: ${portent!.narrativeHook}`);
  }, 240_000);
});
