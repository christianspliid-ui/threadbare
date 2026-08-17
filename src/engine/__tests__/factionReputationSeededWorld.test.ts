/**
 * THR-1150 — the load-bearing proof: `faction_reputation_gain` moves standing in a
 * world built by the **real** seeding pipeline, from the **authored** definition id.
 *
 * Every existing test of this effect hand-builds its faction node and authors that
 * node's id back at the effect, so it proves the dispatcher wires up and nothing
 * about the id the corpus actually carries. This one runs `initializeGameState`
 * (seed 42, medium — the CLI's own arms), takes a real seeded `faction_def_*` node
 * and a real member off the graph, and fires the effect with the definition id the
 * content files write. Before the fix it no-ops.
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { generateArchetypes } from '../ascendant';
import { createBalancedCosmology } from '../cosmology';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../types/unifiedAction';

const SEED = 42;

let seededState: GameState;
/** A real seeded membership: agent id, faction node id, faction definition id. */
let membership: { agentId: string; factionNodeId: string; factionDefId: string };

beforeAll(() => {
  const preset = MAP_SIZE_PRESETS.medium;
  const archetype = generateArchetypes(4, SEED)[0];
  const { state } = initializeGameState(
    archetype, 'THR-1150-Prover', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  );
  seededState = state;

  const edge = state.graph.getEdgesByType('member_of')
    .find(e => typeof e.properties?.factionDefId === 'string'
      && String(e.target).startsWith('faction_def_'));
  if (!edge) throw new Error('seeded world produced no faction membership — fixture premise broken');
  membership = {
    agentId: edge.source,
    factionNodeId: edge.target,
    factionDefId: edge.properties!.factionDefId as string,
  };
});

function makeAction(actorId: string): UnifiedAction {
  return {
    actionId: 'ua_thr1150', actorId, templateId: 'enc.test', targetId: actorId,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as UnifiedAction;
}

function fire(effect: EncounterAftermathReactionEffect, runtime: SimulationRuntime): GameState {
  const reaction = { id: 'rx-thr1150', label: 'Prover', effects: [effect] } as EncounterAftermathReaction;
  return applyEncounterAftermathReaction(
    seededState, makeAction(membership.agentId), reaction, seededState.tick, runtime,
  ).state;
}

function reputationOf(state: GameState): number | undefined {
  return state.graph.getOutgoingEdges(membership.agentId, 'member_of')
    .find(e => e.target === membership.factionNodeId)
    ?.properties?.reputation as number | undefined;
}

describe('THR-1150 — seeded world, authored definition id', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('the seeded node id is derived from the definition id, and only one of them is a node', () => {
    // The premise of the whole ticket, asserted against the real pipeline rather
    // than quoted from it.
    expect(membership.factionNodeId).toContain(`faction_def_${membership.factionDefId}`);
    expect(seededState.graph.getNode(membership.factionNodeId)).toBeDefined();
    expect(seededState.graph.getNode(membership.factionDefId)).toBeUndefined();
  });

  it('gains standing from the definition id the content files author', () => {
    const before = reputationOf(seededState) ?? 0;

    const after = fire({
      kind: 'faction_reputation_gain',
      factionId: membership.factionDefId,
      amount: 0.15,
    }, runtime);

    expect(reputationOf(after)).toBeCloseTo(Math.min(1, before + 0.15), 5);
    expect(getTraces().some(
      t => t.category === 'encounter_aftermath_effect'
        && (t as { effectKind?: string }).effectKind === 'faction_reputation_gain'
        && (t as { success?: boolean }).success === true,
    )).toBe(true);
  });

  it('an unresolvable factionId announces the no-op instead of passing in silence', () => {
    const before = reputationOf(seededState);

    fire({
      kind: 'faction_reputation_gain',
      factionId: 'guild_of_nobody',
      amount: 0.15,
    }, runtime);

    expect(reputationOf(seededState)).toBe(before);
    const skipped = getTraces().filter(
      t => t.category === 'encounter_aftermath_effect'
        && (t as { effectKind?: string }).effectKind === 'faction_reputation_gain'
        && (t as { success?: boolean }).success === false,
    ) as unknown as Array<{ failReason?: string }>;
    expect(skipped.length).toBeGreaterThanOrEqual(1);
    expect(skipped.every(t => t.failReason === 'faction_not_found')).toBe(true);
  });
});
