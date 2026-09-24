/**
 * THR-1556 (Duels E1) — opposed exchanges.
 *
 * Duels plan doc `Docs/plans/2026-09-23-mortal-duels.md` §1–4. Each `describe` is
 * one clause of the slice's Done-when. The matrix clauses hand both bands to
 * `executeStepResult` directly — the fighter's as `outcome`, the opponent's as the
 * `opponentRoll` the resolver would have carried — so every cell is exact. The
 * stream, item and template clauses run the real roll.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WorldGraph } from '../../graph';
import { executeStepResult, resolveUncontestedStep } from '../../unifiedActionResolution';
import { disableTracing } from '../../traceBuffer';
import { isEncounterAction } from '../../chapterArchive';
import { fightResultIndex } from '../fightState';
import { opponentSideAction, rollOpponentSide } from '../opposedRoll';
import { resolveFightStepInputs } from '../fightStepInputs';
import { CONDITION_TRAIT_DEFINITIONS } from '../../../data/condition-trait-content';
import { FIGHT_DUEL_GRUDGE, FIGHT_DUEL_GRUDGE_ID } from '../../../data/encounters/fight-duel-grudge';
import { FIGHT_ENCOUNTER_TEMPLATES } from '../../../data/fights/fight-templates';
import { fightBlock } from '../../../data/fights/fightBlock';
import { getAnyEncounterById } from '../../../data/encounter-content';
import {
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  UNIFIED_ACTION_TEMPLATES,
} from '../../../data/unified-action-templates';
import { FIGHT_MORTAL_CLOCK } from '../../../data/fight-constants';
import { resolveAftermathVariant } from '../../../types/unifiedAction';
import type { GameState } from '../../../types/gameState';
import type { AttachmentEffect } from '../../../types/effects';
import type { OpponentFightRoll } from '../../../types/fight';
import type { StepOutcome, UnifiedAction, UnifiedActionTemplate } from '../../../types/unifiedAction';

const TICK = 300;
const midRng = () => 0.5;
const BANDS: readonly StepOutcome[] = [
  'critical_success', 'success', 'near_miss', 'success_at_cost', 'failure', 'critical_failure',
];

beforeEach(() => disableTracing());
afterEach(() => disableTracing());

// ─── Fixture ────────────────────────────────────────────────────

/** Two mortals on one hex, both bold unless told otherwise. */
function world(opts: { heroCourage?: number; rivalCourage?: number; raw?: number } = {}): WorldGraph {
  const graph = new WorldGraph();
  for (const node of CONDITION_TRAIT_DEFINITIONS) graph.addNode(node);
  graph.addNode({ id: 'square', type: 'location', name: 'The Square', properties: { hexCol: 3, hexRow: 3 } });
  const raw = opts.raw ?? 20;
  for (const [id, name, courage] of [
    ['hero', 'Hero', opts.heroCourage ?? 0.35],
    ['rival', 'Rival', opts.rivalCourage ?? 0.35],
  ] as const) {
    graph.addNode({
      id, type: 'actor', name,
      properties: {
        actorType: 'individual',
        domainCapabilities: { iron: raw, heart: raw },
        axiologicalProfile: { courage_prudence: courage },
      },
    });
    graph.addEdge({ id: `e.${id}.at`, source: id, target: 'square', type: 'located_at', properties: {} });
  }
  return graph;
}

function stateOf(graph: WorldGraph): GameState {
  return {
    tick: TICK, seed: 42, cycle: 1, phase: 'playing', graph,
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
    pendingQuintessenceEvents: [],
    effectStates: new Map(),
  } as unknown as GameState;
}

function duel(templateId = FIGHT_DUEL_GRUDGE_ID): UnifiedAction {
  return {
    actionId: 'ua_duel', actorId: 'hero', templateId, targetId: 'rival',
    scale: 'local', source: 'agent',
    startTick: TICK - 5, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
  } as unknown as UnifiedAction;
}

function opp(band: StepOutcome): OpponentFightRoll {
  return { opponentId: 'rival', band, probability: 0.5, roll: 50, reach: 'iron', difficulty: 0.35, modifiers: [] };
}

/** One step with both bands fixed. */
function step(
  state: GameState, a: UnifiedAction, fighter: StepOutcome, opponent: StepOutcome,
  tpl: UnifiedActionTemplate = FIGHT_DUEL_GRUDGE,
): UnifiedAction {
  return executeStepResult(a, tpl, fighter, [], state, midRng, state.tick, {
    capability: 0.5, probability: 0.5, roll: 50, opponentRoll: opp(opponent), noComplications: true,
  }).updatedAction;
}

/** A duel run band pair by band pair: `[fighter, opponent][]`, nerve first. */
function run(state: GameState, pairs: readonly (readonly [StepOutcome, StepOutcome])[]): UnifiedAction {
  let a = duel();
  for (const [f, o] of pairs) {
    if (a.resolved) break;
    a = step(state, a, f, o);
  }
  return a;
}

// ─── Mode ───────────────────────────────────────────────────────

describe('agent mode is a property of the block', () => {
  it('fightBlock({ mode: "agent" }) stamps every step; the default stamps nothing', () => {
    expect(fightBlock({ mode: 'agent' }).every((s) => s.fightMode === 'agent')).toBe(true);
    expect(fightBlock().every((s) => !('fightMode' in s))).toBe(true);
  });

  it('a duel starts with both clocks per-fight, empty, and both sides\' state on fightState', () => {
    const state = stateOf(world());
    const a = step(state, duel(), 'success', 'success');
    expect(a.fightState).toMatchObject({
      fightMode: 'agent',
      clockSize: FIGHT_MORTAL_CLOCK, clockNow: 0, persistent: false,
      fighterClockSize: FIGHT_MORTAL_CLOCK, fighterClockNow: 0,
      opponentBands: ['success'],
      opponentWounds: 0, opponentBlowsLanded: 0,
    });
  });
});

// ─── The matrix ─────────────────────────────────────────────────

describe('the band-pair matrix on the nerve step', () => {
  it.each(BANDS.flatMap((f) => BANDS.map((o) => [f, o] as const)))('fighter %s × opponent %s', (f, o) => {
    const state = stateOf(world());
    const a = step(state, duel(), f, o);
    const fighterRouts = f === 'critical_failure';
    const opponentRouts = o === 'critical_failure';
    if (fighterRouts && opponentRouts) {
      expect(a.fightState).toMatchObject({ result: 'routed', opponentLoss: 'routed' });
    } else if (fighterRouts) {
      expect(a.fightState!.result).toBe('routed');
      expect(a.fightState!.opponentLoss).toBeUndefined();
    } else if (opponentRouts) {
      expect(a.fightState).toMatchObject({ result: 'overcome', opponentLoss: 'routed' });
    } else {
      expect(a.fightState!.result).toBeUndefined();
    }
  });
});

describe('the band-pair matrix on the first clash', () => {
  // Both at +0.35 courage decide by conviction: nobody yields, so each cell reads the clocks alone.
  it.each(BANDS.flatMap((f) => BANDS.map((o) => [f, o] as const)))('fighter %s × opponent %s', (f, o) => {
    const state = stateOf(world());
    const a = run(state, [['success', 'success'], [f, o]]);
    const fight = a.fightState!;
    const fighterDown = f === 'critical_failure';
    const opponentDown = o === 'critical_failure';
    // A critical success lands 2 segments: a full mortal clock in one blow.
    const opponentFull = !fighterDown && !opponentDown && f === 'critical_success';
    const fighterFull = !fighterDown && !opponentDown && o === 'critical_success';
    if (fighterDown && opponentDown) {
      expect(fight).toMatchObject({ result: 'struck_down', opponentLoss: 'struck_down' });
    } else if (fighterDown) {
      expect(fight.result).toBe('struck_down');
      expect(fight.opponentLoss).toBeUndefined();
    } else if (opponentDown) {
      expect(fight).toMatchObject({ result: 'overcome', opponentLoss: 'struck_down' });
    } else if (opponentFull && fighterFull) {
      expect(fight).toMatchObject({ result: 'struck_down', opponentLoss: 'struck_down' });
    } else if (opponentFull) {
      expect(fight).toMatchObject({ result: 'overcome', opponentLoss: 'clock' });
    } else if (fighterFull) {
      expect(fight.result).toBe('struck_down');
      expect(fight.opponentLoss).toBeUndefined();
    } else {
      expect(fight.result).toBeUndefined();
    }
    expect(a.resolved).toBe(fight.result !== undefined);
  });

  it('each band advances the other side\'s clock', () => {
    const state = stateOf(world());
    const a = run(state, [['success', 'success'], ['success', 'near_miss']]);
    expect(a.fightState!.clockNow).toBe(1);
    expect(a.fightState!.fighterClockNow).toBe(1);
    expect(a.fightState!.blowsLanded).toBe(1);
    expect(a.fightState!.opponentBlowsLanded).toBe(1);
  });

  it('both clocks filling in one exchange is a double knockout', () => {
    const state = stateOf(world());
    const a = run(state, [['success', 'success'], ['success', 'success'], ['success', 'success']]);
    expect(a.fightState).toMatchObject({ result: 'struck_down', opponentLoss: 'struck_down', clockNow: 2, fighterClockNow: 2 });
    expect(a.outcome).toBe('critical_failure');
  });

  it('the opponent\'s clock filling alone is overcome by clock', () => {
    const state = stateOf(world());
    const a = run(state, [['success', 'success'], ['success', 'failure'], ['success', 'failure']]);
    expect(a.fightState).toMatchObject({ result: 'overcome', opponentLoss: 'clock' });
    expect(a.outcome).toBe('success');
  });

  it('a duel nobody wins by the last clash breaks off', () => {
    const state = stateOf(world());
    const a = run(state, [['success', 'success'], ['failure', 'failure'], ['failure', 'failure'], ['failure', 'failure']]);
    expect(a.fightState!.result).toBe('broke_off');
    expect(a.fightState!.opponentLoss).toBeUndefined();
  });
});

describe('nerve and concession on both sides', () => {
  it('a cautious opponent yields after a wounding clash: overcome, opponentLoss yielded; the fork names its side', () => {
    const state = stateOf(world({ rivalCourage: -0.8 }));
    const a = run(state, [['success', 'success'], ['near_miss', 'failure']]);
    expect(a.fightState).toMatchObject({ result: 'overcome', opponentLoss: 'yielded' });
    expect(a.fightState!.forks).toContainEqual(
      { stepIndex: 1, kind: 'concession', side: 'opponent', choice: 'yield', decidedBy: 'conviction' },
    );
  });

  it('a cautious fighter yields; the opponent is not humiliated into a loss', () => {
    const state = stateOf(world({ heroCourage: -0.8 }));
    const a = run(state, [['success', 'success'], ['failure', 'near_miss']]);
    expect(a.fightState!.result).toBe('yielded');
    expect(a.fightState!.opponentLoss).toBeUndefined();
  });

  it('both yielding at the same fork breaks off, opponentLoss yielded', () => {
    const state = stateOf(world({ heroCourage: -0.8, rivalCourage: -0.8 }));
    const a = run(state, [['success', 'success'], ['failure', 'failure']]);
    expect(a.fightState).toMatchObject({ result: 'broke_off', opponentLoss: 'yielded' });
    expect(a.fightState!.forks.map((f) => f.side)).toEqual(['fighter', 'opponent']);
  });

  it('the rolls come first: a fighter struck down while the opponent would yield is struck down', () => {
    const state = stateOf(world({ rivalCourage: -0.8 }));
    const a = run(state, [['success', 'success'], ['critical_failure', 'failure']]);
    expect(a.fightState!.result).toBe('struck_down');
    expect(a.fightState!.forks).toEqual([]);
  });

  it('bold duellists never yield — both decide by conviction and fight on', () => {
    const state = stateOf(world());
    const a = run(state, [['success', 'success'], ['failure', 'failure']]);
    expect(a.fightState!.result).toBeUndefined();
    expect(a.fightState!.forks.map((f) => [f.side, f.choice, f.decidedBy])).toEqual([
      ['fighter', 'fight_on', 'conviction'],
      ['opponent', 'fight_on', 'conviction'],
    ]);
  });

  it('with both sides\' forks recorded, an aftermath keyed on fight:overcome still resolves', () => {
    const state = stateOf(world());
    const a = run(state, [['success', 'success'], ['success_at_cost', 'failure'], ['success', 'success_at_cost']]);
    expect(a.fightState!.forks.map((f) => f.side)).toEqual(['fighter', 'opponent']);
    expect(a.fightState).toMatchObject({ result: 'overcome', opponentLoss: 'clock' });
    const memory = a.choiceHistory!.find((m) => m.stepIndex === fightResultIndex(FIGHT_DUEL_GRUDGE.steps));
    expect(memory?.choiceId).toBe('fight:overcome');
    const variant = resolveAftermathVariant(FIGHT_DUEL_GRUDGE.aftermathConfig!, a.choiceHistory, a.outcome);
    expect(variant.overview).toContain('beat {target}');
  });
});

describe('the opponent side has a home: harm, conditions, momentum', () => {
  it('the opponent\'s own band harms and conditions the opponent', () => {
    const state = stateOf(world());
    const a = run(state, [['success', 'success'], ['success', 'failure']]);
    expect(a.fightState!.opponentHarmTaken).toBeGreaterThan(0);
    expect(a.fightState!.opponentWounds).toBe(1);
    expect(a.fightState!.opponentMomentum).toBeCloseTo(-0.05, 6);
    expect(state.graph.getOutgoingEdges('rival', 'has_trait').some((e) => e.target === 'trait.condition.wounded')).toBe(true);
    expect(state.pendingQuintessenceEvents!.some((e) => e.targetNodeId === 'rival')).toBe(true);
  });
});

// ─── The roll ───────────────────────────────────────────────────

/** A counting wrapper over a seeded stream: how many draws the step took from it. */
function counted(seed: number): { rng: () => number; draws: () => number } {
  let n = 0;
  let s = seed >>> 0;
  return {
    rng: () => {
      n++;
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    draws: () => n,
  };
}

describe('the synthesized opponent roll', () => {
  const npcDuel: UnifiedActionTemplate = { ...FIGHT_DUEL_GRUDGE, id: 'fight.duel.npc_copy', steps: fightBlock() };

  it('never enters state.unifiedActions', () => {
    const state = stateOf(world());
    let a = duel();
    state.unifiedActions = [a];
    for (let i = 0; i < FIGHT_DUEL_GRUDGE.steps.length && !a.resolved; i++) {
      const r = resolveUncontestedStep(a, FIGHT_DUEL_GRUDGE, state, midRng);
      expect(r.opponentRoll?.opponentId).toBe('rival');
      a = executeStepResult(a, FIGHT_DUEL_GRUDGE, r.outcome, r.opsToExecute, state, midRng, state.tick, {
        capability: r.capability, probability: r.probability, roll: r.roll,
        reach: r.reach, difficulty: r.difficulty, opponentRoll: r.opponentRoll,
      }).updatedAction;
      state.unifiedActions = [a];
    }
    expect(state.unifiedActions).toHaveLength(1);
    expect(state.unifiedActions.every((x) => x.actorId === 'hero')).toBe(true);
  });

  it('leaves the fighter\'s stream untouched (golden subset: same roll, same band, same draws as an unopposed step)', () => {
    for (const seed of [1, 7, 42, 1264, 99991]) {
      const stateA = stateOf(world());
      const stateB = stateOf(world());
      const a = counted(seed);
      const b = counted(seed);
      const opposed = resolveUncontestedStep(duel(), FIGHT_DUEL_GRUDGE, stateA, a.rng);
      const alone = resolveUncontestedStep(duel('fight.duel.npc_copy'), npcDuel, stateB, b.rng);
      expect(opposed.opponentRoll).toBeDefined();
      expect(alone.opponentRoll).toBeUndefined();
      expect([opposed.roll, opposed.outcome, opposed.probability]).toEqual([alone.roll, alone.outcome, alone.probability]);
      expect(a.draws()).toBe(b.draws());
    }
  });

  it('is seeded: the same step rolls the same opponent band', () => {
    const r1 = rollOpponentSide(stateOf(world()), duel(), FIGHT_DUEL_GRUDGE, FIGHT_DUEL_GRUDGE.steps[0] as never);
    const r2 = rollOpponentSide(stateOf(world()), duel(), FIGHT_DUEL_GRUDGE, FIGHT_DUEL_GRUDGE.steps[0] as never);
    expect(r1).toEqual(r2);
  });

  it('is priced from the fighter\'s derived card, with the opponent as actor', () => {
    const graph = world();
    graph.getNode('hero')!.properties.domainCapabilities = { iron: 30, heart: 20 }; // severe Might
    const state = stateOf(graph);
    const clash = FIGHT_DUEL_GRUDGE.steps[1] as never;
    const inputs = resolveFightStepInputs(state, opponentSideAction(duel(), 'rival'), { ...(clash as object), opponentRef: undefined } as never, FIGHT_DUEL_GRUDGE)!;
    expect(inputs.opponentId).toBe('hero');
    expect(inputs.card.might).toBe('severe');
    expect(inputs.opponentModifierDelta).toBe(0);
  });

  it('the opponent\'s in_combat item changes its roll', () => {
    const plain = stateOf(world());
    const armed = world();
    armed.addNode({
      id: 'item.charm', type: 'artifact', name: 'Charm',
      properties: { effects: [{ type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.08 } as AttachmentEffect] },
    });
    armed.addEdge({ id: 'e.rival.charm', source: 'rival', target: 'item.charm', type: 'possesses', properties: {} });
    const clash = FIGHT_DUEL_GRUDGE.steps[1] as never;
    const without = rollOpponentSide(plain, { ...duel(), currentStep: 1 }, FIGHT_DUEL_GRUDGE, clash)!;
    const withItem = rollOpponentSide(stateOf(armed), { ...duel(), currentStep: 1 }, FIGHT_DUEL_GRUDGE, clash)!;
    expect(withItem.probability).toBeGreaterThan(without.probability);
    expect(withItem.modifiers.some((m) => m.name === 'standing')).toBe(true);
    // It prices the opponent's own roll only — never the fighter's step as well.
    const fighterInputs = resolveFightStepInputs(stateOf(armed), { ...duel(), currentStep: 1 }, clash, FIGHT_DUEL_GRUDGE)!;
    expect(fighterInputs.opponentModifierDelta).toBe(0);
  });

  it('a fight_clock effect against the actor lands on fighterClockNow', () => {
    const graph = world();
    // The opponent carries a charm that writes the counterpart's fight clock on its next outcome.
    graph.addNode({
      id: 'item.thorn', type: 'artifact', name: 'Thorn',
      properties: { effects: [{ type: 'resource_manipulate', resource: 'fight_clock', target: 'other_agent', amount: 1, mode: 'one_shot' } as AttachmentEffect] },
    });
    const state = stateOf(graph);
    let a = step(state, duel(), 'success', 'success');
    graph.addEdge({ id: 'e.rival.thorn', source: 'rival', target: 'item.thorn', type: 'possesses', properties: {} });
    a = step(state, a, 'failure', 'failure'); // no band blow either way; the item is the cause
    expect(a.fightState!.fighterClockNow).toBe(1);
    expect(a.fightState!.clockNow).toBe(0);
    expect(a.fightState!.opponentBlowsLanded).toBe(1);
  });
});

// ─── The template ───────────────────────────────────────────────

describe('fight.duel.grudge', () => {
  it('is found by getAnyEncounterById, registered in FIGHT_ENCOUNTER_TEMPLATES and the unified catalog', () => {
    expect(getAnyEncounterById(FIGHT_DUEL_GRUDGE_ID)?.id).toBe(FIGHT_DUEL_GRUDGE_ID);
    expect(FIGHT_ENCOUNTER_TEMPLATES.some((t) => t.id === FIGHT_DUEL_GRUDGE_ID)).toBe(true);
    expect(UNIFIED_ACTION_TEMPLATES.some((t) => t.id === FIGHT_DUEL_GRUDGE_ID)).toBe(true);
  });

  it('is archived as a chapter', () => {
    expect(isEncounterAction(FIGHT_DUEL_GRUDGE_ID)).toBe(true);
  });

  it('is never drawn: no location subtypes, and not in the location cache', () => {
    expect(FIGHT_DUEL_GRUDGE.locationSubtypes ?? []).toEqual([]);
    expect(LOCATION_BRANCHING_ENCOUNTER_TEMPLATES.some((t) => t.id === FIGHT_DUEL_GRUDGE_ID)).toBe(false);
  });

  it('is an agent-mode terminal block whose opening line is the nerve step\'s prose', () => {
    expect(FIGHT_DUEL_GRUDGE.steps.every((s) => 'fightMode' in s && s.fightMode === 'agent')).toBe(true);
    expect(FIGHT_DUEL_GRUDGE.steps[0]).toMatchObject({ fightRole: 'nerve' });
    expect((FIGHT_DUEL_GRUDGE.steps[0] as { narrativeTemplate?: string }).narrativeTemplate).toContain('old wound');
    expect(FIGHT_DUEL_GRUDGE.intrinsicTier).toBe('story_beat');
    expect(FIGHT_DUEL_GRUDGE.aftermathConfig!.branchOnStep).toBe(fightResultIndex(FIGHT_DUEL_GRUDGE.steps));
  });
});
