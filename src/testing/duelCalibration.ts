/**
 * The duel calibration (THR-1556, duels plan doc E1 Done-when and kill criterion).
 *
 * Runs `duelCount` seeded duels of `fight.duel.grudge` through the real road —
 * `resolveUncontestedStep` for the fighter's roll and the opponent's synthesized
 * one, `executeStepResult` for everything after — between two **fixture mortals**
 * pinned to THR-1264's sim:
 *
 *  - both "bold" (`courage_prudence` +0.35) and both with Heart (the nerve reach)
 *    at capability ≈ 0.89 (THR-1531's bold-guard nerve);
 *  - the **strong** fixture, the actor: raw clash 30 (capability ≈ 1.0), whose
 *    derived Might reads *severe*;
 *  - the **weak** fixture: raw clash **exactly 15** (capability ≈ 0.83) — at 14 its
 *    Might reads *gentle* and the strong side's odds jump;
 *  - mid-fight complications **off** (THR-1264's sim had none), through
 *    `executeStepResult`'s `noComplications` calibration lever;
 *  - **everything reset between duels**: harm, conditions, value drift, grown
 *    capability, and any grudge or mark a duel wrote.
 *
 * Every duel falls into exactly one of six classes that sum to 100%. Targets are
 * THR-1264's row: 49 / 4 / 23 / 13, routed about 11 (the row's remainder), and
 * yielded **exactly 0** — bold duellists never yield (the concession fork decides
 * by conviction above `BRANCH_DECISION_NEUTRAL_EPSILON`). The four named classes
 * must sit within ±8 points; routed is diagnostic (see the plan doc).
 *
 * Deterministic: one seeded stream per duel for the fighter's steps; the
 * opponent's roll draws its own seeded stream (NFP #3).
 */

import { WorldGraph } from '../engine/graph';
import { createUnifiedAction } from '../engine/unifiedActionLifecycle';
import { executeStepResult, resolveUncontestedStep } from '../engine/unifiedActionResolution';
import { computeCapability } from '../engine/domainCapability';
import { mulberry32 } from '../lib/prng';
import { CONDITION_TRAIT_DEFINITIONS } from '../data/condition-trait-content';
import { FIGHT_DUEL_GRUDGE } from '../data/encounters/fight-duel-grudge';
import type { GameState } from '../types/gameState';
import type { UnifiedAction } from '../types/unifiedAction';
import type { ReachDomain } from '../types/traits';

/** THR-1264's six classes. */
export type DuelCalibrationClass =
  | 'stronger_by_clock' | 'weaker_by_clock' | 'struck_down' | 'broke_off' | 'routed' | 'yielded';

export const DUEL_CALIBRATION_CLASSES: readonly DuelCalibrationClass[] = [
  'stronger_by_clock', 'weaker_by_clock', 'struck_down', 'broke_off', 'routed', 'yielded',
];

/** THR-1264's row, % of duels. Routed is the row's remainder; yielded is a hard 0. */
export const DUEL_CALIBRATION_TARGET: Readonly<Record<DuelCalibrationClass, number>> = {
  stronger_by_clock: 49,
  weaker_by_clock: 4,
  struck_down: 23,
  broke_off: 13,
  routed: 11,
  yielded: 0,
};

/** The four named classes: the gate (±8 points each). */
export const DUEL_CALIBRATION_GATED: readonly DuelCalibrationClass[] = [
  'stronger_by_clock', 'weaker_by_clock', 'struck_down', 'broke_off',
];

/** ±8 points on the four named classes (E1 Done-when). */
export const DUEL_CALIBRATION_TOLERANCE = 8;
/** Duels per calibration run (E1 Done-when). */
export const DUEL_CALIBRATION_DUELS = 400;

const STRONG_RAW_CLASH = 30;
const WEAK_RAW_CLASH = 15;
const NERVE_CAPABILITY = 0.89;
const BOLD_COURAGE = 0.35;

const TICK = 1000;
const STRONG = 'calibration.duellist.strong';
const WEAK = 'calibration.duellist.weak';
const SQUARE = 'calibration.square';
/** Ticks between two calibration duels: more than a duel's steps, so no id collides. */
const TICKS_PER_DUEL = 10;

export interface DuelCalibrationReport {
  readonly duels: number;
  readonly counts: Readonly<Record<DuelCalibrationClass, number>>;
  readonly percent: Readonly<Record<DuelCalibrationClass, number>>;
  readonly deviation: Readonly<Record<DuelCalibrationClass, number>>;
  /** The four named classes within ±8 and yielded exactly 0. */
  readonly withinTolerance: boolean;
  /** Routed within ±8 of 11 (diagnostic, not the gate). */
  readonly routedWithinTolerance: boolean;
  readonly capability: Readonly<Record<'strong' | 'weak', Readonly<Record<'clash' | 'nerve', number>>>>;
}

/** The smallest raw score whose capability reaches `target` (the sigmoid is monotone). */
function rawForCapability(graph: WorldGraph, nodeId: string, reach: ReachDomain, target: number): number {
  const caps = graph.getNode(nodeId)!.properties.domainCapabilities as Record<string, number>;
  let lo = 0;
  let hi = 60;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    caps[reach] = mid;
    if (computeCapability(graph, nodeId, reach) >= target) hi = mid; else lo = mid;
  }
  caps[reach] = hi;
  return hi;
}

function duellist(graph: WorldGraph, id: string, name: string, clash: number): void {
  graph.addNode({
    id, type: 'actor', name,
    properties: {
      actorType: 'individual',
      domainCapabilities: { iron: clash, heart: 20 },
      axiologicalProfile: { courage_prudence: BOLD_COURAGE },
    },
  });
  graph.addEdge({ id: `e.${id}.at`, source: id, target: SQUARE, type: 'located_at', properties: {} });
}

function fixtureWorld(): WorldGraph {
  const graph = new WorldGraph();
  for (const node of CONDITION_TRAIT_DEFINITIONS) graph.addNode(node);
  graph.addNode({ id: SQUARE, type: 'location', name: 'The Square', properties: { hexCol: 4, hexRow: 4 } });
  duellist(graph, STRONG, 'The Strong Duellist', STRONG_RAW_CLASH);
  duellist(graph, WEAK, 'The Weak Duellist', WEAK_RAW_CLASH);
  return graph;
}

function fixtureState(graph: WorldGraph, seed: number): GameState {
  return {
    tick: TICK, seed, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'calibration.asc', essencePool: {} as never,
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

/**
 * Between duels: restore both duellists' stamped capability and value profile,
 * strip every condition and every edge a duel wrote between them (a grudge, a
 * mark), empty the harm queue, and move the tick on.
 */
function resetBetweenDuels(
  state: GameState,
  duelIndex: number,
  raw: Readonly<Record<string, Readonly<Record<string, number>>>>,
): void {
  const graph = state.graph;
  state.tick = TICK + duelIndex * TICKS_PER_DUEL;
  for (const id of [STRONG, WEAK]) {
    const node = graph.getNode(id)!;
    node.properties.domainCapabilities = { ...raw[id] };
    node.properties.axiologicalProfile = { courage_prudence: BOLD_COURAGE };
    for (const edge of graph.getOutgoingEdges(id)) {
      if (edge.type === 'located_at') continue;
      graph.removeEdge(edge.id);
    }
  }
  state.pendingQuintessenceEvents = [];
  state.tickEvents = [];
  state.recentEvents = [];
  state.unifiedActions = [];
}

/** Drive one duel through the real road, step by step, as the phase loop does. */
function duelOnce(state: GameState, rng: () => number): UnifiedAction {
  const template = FIGHT_DUEL_GRUDGE;
  let action = createUnifiedAction({
    actorId: STRONG, templateId: template.id, targetId: WEAK,
    scale: template.scale, source: 'system', tick: state.tick, template, rng,
  });
  for (let guard = 0; guard < template.steps.length + 2 && !action.resolved; guard++) {
    const step = resolveUncontestedStep(action, template, state, rng);
    action = executeStepResult(
      action, template, step.outcome, step.opsToExecute, state, rng, state.tick,
      {
        capability: step.capability, probability: step.probability, roll: step.roll,
        reach: step.reach, difficulty: step.difficulty,
        ...(step.fightEnd ? { fightEnd: step.fightEnd } : {}),
        ...(step.opponentRoll ? { opponentRoll: step.opponentRoll } : {}),
        noComplications: true,
      },
    ).updatedAction;
  }
  return action;
}

/** THR-1264's class for one finished duel, read from the strong side (the actor). */
export function classifyDuel(action: UnifiedAction): DuelCalibrationClass {
  const fight = action.fightState;
  const result = fight?.result ?? 'broke_off';
  const loss = fight?.opponentLoss;
  if (result === 'yielded' || loss === 'yielded') return 'yielded';
  if (result === 'routed' || loss === 'routed') return 'routed';
  if (result === 'overcome') return loss === 'clock' ? 'stronger_by_clock' : 'struck_down';
  if (result === 'struck_down') {
    // The fighter's own last band tells a strike-down (critical failure) from a
    // filled clock; a double knockout names the opponent as struck down too.
    const lastFighterBand = action.stepOutcomes.at(-1);
    if (loss === 'struck_down' || lastFighterBand === 'critical_failure') return 'struck_down';
    return 'weaker_by_clock';
  }
  return 'broke_off';
}

/** Run the calibration. Pure with respect to the caller: it builds its own fixture world. */
export function runDuelCalibration(
  duels: number = DUEL_CALIBRATION_DUELS,
  seed = 1264,
): DuelCalibrationReport {
  const graph = fixtureWorld();
  const raw: Record<string, Record<string, number>> = {};
  for (const id of [STRONG, WEAK]) {
    const heart = rawForCapability(graph, id, 'heart', NERVE_CAPABILITY);
    raw[id] = { iron: id === STRONG ? STRONG_RAW_CLASH : WEAK_RAW_CLASH, heart };
    graph.getNode(id)!.properties.domainCapabilities = { ...raw[id] };
  }
  const capability = {
    strong: { clash: computeCapability(graph, STRONG, 'iron'), nerve: computeCapability(graph, STRONG, 'heart') },
    weak: { clash: computeCapability(graph, WEAK, 'iron'), nerve: computeCapability(graph, WEAK, 'heart') },
  };
  const state = fixtureState(graph, seed);

  const counts: Record<DuelCalibrationClass, number> = {
    stronger_by_clock: 0, weaker_by_clock: 0, struck_down: 0, broke_off: 0, routed: 0, yielded: 0,
  };
  for (let i = 0; i < duels; i++) {
    resetBetweenDuels(state, i, raw);
    counts[classifyDuel(duelOnce(state, mulberry32((seed * 7919 + i * 104729) >>> 0)))]++;
  }

  const percent = {} as Record<DuelCalibrationClass, number>;
  const deviation = {} as Record<DuelCalibrationClass, number>;
  for (const cls of DUEL_CALIBRATION_CLASSES) {
    percent[cls] = (100 * counts[cls]) / duels;
    deviation[cls] = percent[cls] - DUEL_CALIBRATION_TARGET[cls];
  }
  const withinTolerance = counts.yielded === 0
    && DUEL_CALIBRATION_GATED.every((cls) => Math.abs(deviation[cls]) <= DUEL_CALIBRATION_TOLERANCE);
  return {
    duels,
    counts,
    percent,
    deviation,
    withinTolerance,
    routedWithinTolerance: Math.abs(deviation.routed) <= DUEL_CALIBRATION_TOLERANCE,
    capability,
  };
}
