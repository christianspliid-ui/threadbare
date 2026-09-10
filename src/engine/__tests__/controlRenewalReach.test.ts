// @vitest-lane heavy — builds a small world, claims a town on it, and drives 45 ticks (THR-1287)
/**
 * THR-1287's own Done-when, on the world the writers actually make.
 *
 * `controlRenewal.test.ts` proves the rule and its falsifiers on a fixture. This one
 * proves the thing the ticket is actually about: that **a hold can outlive the fixed
 * grace-plus-degradation window** in a world worldgen built, which was impossible by
 * construction before this change — every stance collapsed at grace + 1/rate ticks
 * whatever its holder did.
 *
 * What is worldgen's and what is deliberate, so the fixture trap is not re-entered: who
 * exists, where they stand and what the map holds are all worldgen's. The two holds are
 * made through the world's own writer (`claimControl`), on a Location a mortal actually
 * stands at, because the claim cell needs an `unowned` target and a young world has not
 * claimed anything yet (the same supply fact `yieldBandCells.test.ts` records). The
 * *only* difference between the two arms is whether the holder works the place — which
 * is exactly the variable under test.
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { executeStrategicAction, advanceStrategicProjects } from '../strategicActionLifecycle';
import { claimControl } from '../strategicGraphOps';
import { cellTemplateId } from '../../data/undertaking-cells';
import { getStrategicTemplate } from '../strategicActionCandidates';
import {
  STRATEGIC_CONTROL_NEGLECT_GRACE_TICKS,
  STRATEGIC_CONTROL_DEGRADATION_RATE,
} from '../../data/strategic-action-constants';
import { isPlaceNode, resolveToParentLocation } from '../sublocationShape';
import { isAgentGone } from '../groups/groupQueries';
import { mulberry32 } from '../../lib/prng';
import type { GameState } from '../../types/gameState';
import type { StrategicActionCandidate, StrategicControlState } from '../../types/strategicAction';

const SEED = 42;
const WARMUP_TICKS = 20;
/** Grace, then every degrading tick it takes to reach 1 — the window a hold used to die inside. */
const COLLAPSE_WINDOW =
  STRATEGIC_CONTROL_NEGLECT_GRACE_TICKS + Math.ceil(1 / STRATEGIC_CONTROL_DEGRADATION_RATE);
/** Comfortably past it — the ticket asks for a stance still alive 30+ ticks after it was made. */
const RUN_TICKS = COLLAPSE_WINDOW + 15;
/** How often the holder goes back to their town. Inside the grace, which is the point of upkeep. */
const WORK_EVERY = 5;

function world(): GameState {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS.small;
  const archetype = generateArchetypes(4, SEED)[0];
  let { state } = initializeGameState(archetype, 'Upkeep', createBalancedCosmology(), SEED, preset.cols, preset.rows);
  for (let i = 0; i < WARMUP_TICKS; i++) state = runTick(state, [], runtime);
  return state;
}

/** The place-tier Location a mortal stands in, resolved up through the Place tier (THR-1183). */
function standsAt(s: GameState, actorId: string): string | undefined {
  const at = s.graph.getOutgoingEdges(actorId, 'located_at')[0]?.target;
  const node = at ? s.graph.getNode(at) : undefined;
  if (!node) return undefined;
  return isPlaceNode(node) ? (resolveToParentLocation(s.graph, node)?.id ?? undefined) : node.id;
}

function holdersOf(s: GameState, nodeId: string): string[] {
  return [
    ...s.graph.getIncomingEdges(nodeId, 'controls'),
    ...s.graph.getIncomingEdges(nodeId, 'owns'),
  ].map(e => e.source);
}

/** Living mortals standing at a Location nobody already holds, one pair per Location. */
function unheldStanders(s: GameState): { actorId: string; locationId: string }[] {
  const seen = new Set<string>();
  const out: { actorId: string; locationId: string }[] = [];
  for (const m of s.graph.getNodesByType('actor')) {
    if (m.properties.actorType !== 'individual' || isAgentGone(m)) continue;
    const at = standsAt(s, m.id);
    if (!at || seen.has(at)) continue;
    if (holdersOf(s, at).length > 0) continue;
    seen.add(at);
    out.push({ actorId: m.id, locationId: at });
  }
  return out;
}

function stanceOn(actorId: string, locationId: string, tick: number): StrategicControlState {
  return {
    controlId: `ctrl_${actorId}_${locationId}`,
    actorId,
    templateId: cellTemplateId('control:claim', 'location'),
    ambitionId: 'ambition_reach_test',
    targetNodeId: locationId,
    verb: 'control',
    behaviorFamily: 'merchant-expansion',
    establishedTick: tick,
    neglectTicks: 0,
    active: true,
    degradation: 0,
  };
}

function harvest(actorId: string, locationId: string): StrategicActionCandidate {
  return {
    candidateId: `cand_use_${actorId}`,
    templateId: cellTemplateId('use', 'location'),
    ambitionId: 'ambition_reach_test',
    actorId,
    // The template's own verb, read off the real cell rather than invented — a fixture
    // that picks its own would be asserting against a shape the grid does not make.
    verb: getStrategicTemplate(cellTemplateId('use', 'location'))!.verb,
    executionMode: 'instant',
    behaviorFamily: 'merchant-expansion',
    displayName: 'hold court',
    targetNodeId: locationId,
    objectTypeId: 'location',
    objectHandle: { kind: 'node', nodeId: locationId },
    scoreComponents: {
      ambitionAlignment: 0, blockerRelief: 0, worldImpact: 0,
      catalystValue: 0, roleFit: 0, travelPenalty: 0, varietyPenalty: 0,
    },
    finalScore: 1,
    generationReason: 'ambition_progression',
  };
}

describe('THR-1287 — a worked hold survives on a generated world', () => {
  it('outlives the fixed grace-plus-degradation window, while its unworked twin collapses inside it', () => {
    let state = world();
    const candidates = unheldStanders(state);

    // Guard: the world supplied two mortals standing at two different unheld Locations.
    // Without it a run that found none would pass every assertion below vacuously.
    expect(candidates.length).toBeGreaterThanOrEqual(2);

    const [worker, idler] = candidates;
    const established = state.tick;
    expect(claimControl(state.graph, worker.actorId, worker.locationId, established).success).toBe(true);
    expect(claimControl(state.graph, idler.actorId, idler.locationId, established).success).toBe(true);

    state = {
      ...state,
      strategicState: {
        projects: [],
        controls: [
          stanceOn(worker.actorId, worker.locationId, established),
          stanceOn(idler.actorId, idler.locationId, established),
        ],
        history: [],
      },
    } as GameState;

    let renewals = 0;
    for (let i = 1; i <= RUN_TICKS; i++) {
      const tick = established + i;
      state = { ...state, tick } as GameState;

      if (i % WORK_EVERY === 0) {
        const worked = executeStrategicAction(
          state, state.graph, harvest(worker.actorId, worker.locationId), tick, mulberry32(SEED + i),
        );
        const stance = worked.strategicState.controls.find(c => c.actorId === worker.actorId);
        if (stance?.neglectTicks === 0) renewals += 1;
        state = { ...state, strategicState: worked.strategicState } as GameState;
      }

      const advanced = advanceStrategicProjects(state, state.graph, tick, mulberry32(SEED + i));
      state = { ...state, strategicState: advanced.strategicState } as GameState;
    }

    const controls = state.strategicState!.controls;
    const workedHold = controls.find(c => c.actorId === worker.actorId);
    const idleHold = controls.find(c => c.actorId === idler.actorId);

    // The renewals actually happened — not merely "the stance survived for some reason".
    expect(renewals).toBeGreaterThanOrEqual(Math.floor(RUN_TICKS / WORK_EVERY));

    // The ticket's Done-when: alive, and established more than the collapse window ago.
    expect(workedHold?.active).toBe(true);
    expect(state.tick - workedHold!.establishedTick).toBeGreaterThan(COLLAPSE_WINDOW);

    // The controlled arm: the window is still real for a hold nobody works.
    expect(idleHold).toBeUndefined();
    expect(state.graph.getOutgoingEdges(idler.actorId, 'controls')).toHaveLength(0);
    // ...and the worked hold kept its edge, so THR-1286's invariant still holds.
    expect(
      state.graph.getOutgoingEdges(worker.actorId, 'controls')
        .filter(e => e.properties?.controlType === 'strategic'),
    ).toHaveLength(1);
  });
});
