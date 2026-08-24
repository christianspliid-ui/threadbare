/**
 * THR-1182 — the standing welcome pays off, end to end.
 *
 * The parent (The Grateful Kin) writes a `reputation_with` edge onto the town
 * and plants a seed; the seed ripens into The Table That Holds at that same
 * town; and the return visit's own gate opens there and refuses everywhere
 * else. This file drives the **real** engine path for each of those — the
 * shipped reaction object, `applyEncounterAftermathReaction`,
 * `evaluateEncounterSeeds`, and `meetsReputationWithRequirement` — rather than
 * re-deriving any of it, because the defect class this ticket closes is
 * precisely "the authored write and the consumer disagree, and both look fine
 * in isolation".
 *
 * Why an engine test and not a CLI transcript: `spawn encounter @hero <id>`
 * makes the *agent* the action target, and `$target` is kind-checked, so the
 * location-shaped write is refused by design on that path (correctly — a
 * standing with a person is not a standing with a place). The CLI in this build
 * has no location-targeting spawn, so the organic shape is unreachable there.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { evaluateEncounterSeeds } from '../encounterSeeding';
import { createSimulationRuntime } from '../simulationRuntime';
import {
  getReputationWith,
  meetsReputationWithRequirement,
} from '../reputation';
import {
  SLICE_TABLE_DELAY_TICKS,
  SLICE_TABLE_GATE_BAND,
  SLICE_TEMPLATE_IDS,
  VERTICAL_SLICE_TEMPLATES,
} from '../../data/encounters/vertical-slice';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  UnifiedAction,
} from '../../types/unifiedAction';

const HERO = 'actor-hero';
const WELCOMING = 'loc-welcoming';
const STRANGE = 'loc-strange';

function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: HERO, type: 'actor', name: 'Hero',
    properties: { actorType: 'individual', reputationScore: 0.5 },
  });
  for (const id of [WELCOMING, STRANGE]) {
    graph.addNode({
      id, type: 'location', name: id,
      properties: { hexCol: 1, hexRow: 1, locationSubtype: 'hamlet' },
    });
  }
  return {
    tick: 10, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc-1', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as unknown as GameState;
}

/** An action shaped the way the world shapes one: an agent, acting at a place. */
function actionAtTown(targetId: string): UnifiedAction {
  return {
    actionId: 'ua_kin', actorId: HERO,
    templateId: SLICE_TEMPLATE_IDS.gratefulKin,
    targetId,
    scale: 'local', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'critical_success', stepOutcomes: [],
  } as unknown as UnifiedAction;
}

/** The shipped warm-band reaction, read out of the template rather than retyped. */
function warmBandReaction(): EncounterAftermathReaction {
  const kin = VERTICAL_SLICE_TEMPLATES.find(t => t.id === SLICE_TEMPLATE_IDS.gratefulKin)!;
  const band = kin.aftermathConfig!.fallback.byOutcome!.critical_success!;
  const reaction = (band.reactions ?? [])[0];
  expect(reaction, 'the warm band lost its reaction').toBeDefined();
  return reaction!;
}

describe('THR-1182 — the Grateful Kin pays off its welcome', () => {
  it('writes the standing onto the town and plants the sequel in one reaction', () => {
    const state = buildState();
    const runtime = createSimulationRuntime();

    const { state: next } = applyEncounterAftermathReaction(
      state, actionAtTown(WELCOMING), warmBandReaction(), 10, runtime,
    );

    // The standing landed on the *place*, which is what THR-1206 made this
    // beat write and what the sequel's gate reads.
    const reading = getReputationWith(next.graph, HERO, WELCOMING);
    expect(reading.source, 'the welcome did not reach the town').toBe('edge');
    expect(reading.band).toBe('Respected');

    // …and the same pick planted the return visit. One reaction, both writes:
    // authored as two they would be rival picks and the band would pay half.
    const seeds = (next.pendingEncounterSeeds ?? []).filter(
      s => s.templateId === SLICE_TEMPLATE_IDS.tableThatHolds,
    );
    expect(seeds).toHaveLength(1);
    expect(seeds[0].eligibleAfterTick).toBe(10 + SLICE_TABLE_DELAY_TICKS);
    // `inheritContext` — the return visit is at *this* town, not a town-shaped one.
    expect(seeds[0].inheritedTargetId).toBe(WELCOMING);
  });

  it('ripens into the return visit, at the town that owes it', () => {
    const state = buildState();
    const runtime = createSimulationRuntime();
    const { state: planted } = applyEncounterAftermathReaction(
      state, actionAtTown(WELCOMING), warmBandReaction(), 10, runtime,
    );

    // One tick short of ripe: still pending, nothing spawned.
    const early = evaluateEncounterSeeds(
      planted, 10 + SLICE_TABLE_DELAY_TICKS - 1, () => 0.5, runtime,
    );
    expect(
      early.unifiedActions.some(a => a.templateId === SLICE_TEMPLATE_IDS.tableThatHolds),
      'the sequel fired before its delay elapsed',
    ).toBe(false);

    const ripe = evaluateEncounterSeeds(
      planted, 10 + SLICE_TABLE_DELAY_TICKS, () => 0.5, runtime,
    );
    const spawned = ripe.unifiedActions.filter(
      a => a.templateId === SLICE_TEMPLATE_IDS.tableThatHolds,
    );
    expect(spawned, 'the seed ripened into nothing').toHaveLength(1);
    expect(spawned[0].actorId).toBe(HERO);
  });

  it('gates the organic draw on the standing the parent wrote — both polarities', () => {
    const state = buildState();
    const runtime = createSimulationRuntime();
    const { state: next } = applyEncounterAftermathReaction(
      state, actionAtTown(WELCOMING), warmBandReaction(), 10, runtime,
    );

    expect(
      meetsReputationWithRequirement(next.graph, HERO, WELCOMING, SLICE_TABLE_GATE_BAND),
      'the town that keeps a door open refuses its own return visit',
    ).toBe(true);

    expect(
      meetsReputationWithRequirement(next.graph, HERO, STRANGE, SLICE_TABLE_GATE_BAND),
      'a town with no history opens the scene — the gate never rejects',
    ).toBe(false);
  });
});
