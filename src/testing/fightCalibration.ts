/**
 * The fight calibration (THR-1543, fight block FB7 Done-when and kill criterion).
 *
 * Runs `fightCount` seeded fights of `fight.lair.confront` through the real road —
 * `resolveUncontestedStep` for the roll, `executeStepResult` for everything after
 * it, exactly as the phase loop drives a step — against a **fixture opponent**
 * carrying a hand-written `monsterState` equal to THR-1531's "Major elite" row
 * (steep / steep / clock 4 / stubborn), fought by a **fixture fighter** stamped to
 * that row's "bold guard" (clash and nerve capability ≈ 1.0 and 0.89,
 * `courage_prudence` +0.35). Harm, conditions and the monster's clock are reset
 * between fights. The result distribution must sit within
 * `FIGHT_CALIBRATION_TOLERANCE` of the row on every result class.
 *
 * Two readers: `scripts/calibrate-fights.ts` (`npm run calibrate:fights`) prints
 * the distribution as evidence, and `fightCalibration.test.ts` holds it as a
 * standing guard. If the guard fails, the plan doc's kill criterion applies: stop
 * and diagnose (a double-counted modifier, the generic consequence not skipped)
 * before touching a tunable.
 *
 * Deterministic: one seeded stream per fight (NFP #3), never `Math.random`.
 */

import { WorldGraph } from '../engine/graph';
import { createUnifiedAction } from '../engine/unifiedActionLifecycle';
import { executeStepResult, resolveUncontestedStep } from '../engine/unifiedActionResolution';
import { computeCapability } from '../engine/domainCapability';
import { mulberry32 } from '../lib/prng';
import { CONDITION_TRAIT_DEFINITIONS } from '../data/condition-trait-content';
import { FIGHT_LAIR_CONFRONT } from '../data/encounters/fight-lair-confront';
import type { GameState } from '../types/gameState';
import type { UnifiedAction } from '../types/unifiedAction';
import type { FightResult } from '../types/fight';
import type { ReachDomain } from '../types/traits';

/** THR-1531's result classes. "Won" folds overcome, driven off and bargained. */
export type FightCalibrationClass = 'won' | 'broke_off' | 'yielded' | 'routed' | 'struck_down';

export const FIGHT_CALIBRATION_CLASSES: readonly FightCalibrationClass[] = [
  'won', 'broke_off', 'yielded', 'routed', 'struck_down',
];

/** THR-1531, "Major elite (steep/steep, 4)" × "bold guard 1.0", single visit, % of fights. */
export const FIGHT_CALIBRATION_TARGET: Readonly<Record<FightCalibrationClass, number>> = {
  won: 2,
  broke_off: 79,
  yielded: 0,
  routed: 5,
  struck_down: 14,
};

/** ±10 points: at n = 400 about 4σ, outside sampling noise (FB7 Done-when). */
export const FIGHT_CALIBRATION_TOLERANCE = 10;
/** Fights per calibration run (FB7 Done-when). */
export const FIGHT_CALIBRATION_FIGHTS = 400;

/** The bold guard's capability targets, and courage. */
const BOLD_GUARD_CLASH_CAPABILITY = 1.0;
const BOLD_GUARD_NERVE_CAPABILITY = 0.89;
const BOLD_GUARD_COURAGE = 0.35;

/** The Major elite's card (THR-1531). */
const MAJOR_ELITE_CARD = { dread: 'steep', might: 'steep', clockSize: 4, temper: 'stubborn' } as const;

const TICK = 1000;
const FIGHTER = 'calibration.fighter';
const OPPONENT = 'calibration.elite';
const DEN = 'calibration.den';
/** Ticks between two calibration fights: more than a fight's steps, so no id collides. */
const TICKS_PER_FIGHT = 10;

const CLASS_OF: Readonly<Record<FightResult, FightCalibrationClass>> = {
  overcome: 'won',
  driven_off: 'won',
  bargained: 'won',
  broke_off: 'broke_off',
  yielded: 'yielded',
  routed: 'routed',
  struck_down: 'struck_down',
};

export interface FightCalibrationReport {
  readonly fights: number;
  readonly counts: Readonly<Record<FightCalibrationClass, number>>;
  /** Percent of fights per class. */
  readonly percent: Readonly<Record<FightCalibrationClass, number>>;
  /** Percentage points from the THR-1531 row, per class. */
  readonly deviation: Readonly<Record<FightCalibrationClass, number>>;
  readonly withinTolerance: boolean;
  /** Mean clock segments dealt per fight. */
  readonly meanSegments: number;
  /** Mean fight harm queued per fight (quintessence ratio). */
  readonly meanHarm: number;
  readonly fighterCapability: Readonly<Record<'clash' | 'nerve', number>>;
}

/** The smallest raw score whose capability reaches `target` (the sigmoid is monotone). */
function rawForCapability(graph: WorldGraph, reach: ReachDomain, target: number): number {
  const node = graph.getNode(FIGHTER)!;
  const caps = node.properties.domainCapabilities as Record<string, number>;
  let lo = 0;
  let hi = 60;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    caps[reach] = mid;
    if (computeCapability(graph, FIGHTER, reach) >= target) hi = mid; else lo = mid;
  }
  caps[reach] = hi;
  return hi;
}

function fixtureWorld(): WorldGraph {
  const graph = new WorldGraph();
  for (const node of CONDITION_TRAIT_DEFINITIONS) graph.addNode(node);
  graph.addNode({ id: DEN, type: 'location', name: 'The Den', properties: { hexCol: 4, hexRow: 4 } });
  graph.addNode({
    id: FIGHTER, type: 'actor', name: 'The Bold Guard',
    properties: {
      actorType: 'individual',
      domainCapabilities: { iron: 20, heart: 20 },
      axiologicalProfile: { courage_prudence: BOLD_GUARD_COURAGE },
    },
  });
  graph.addEdge({ id: 'e.calibration.fighter.at', source: FIGHTER, target: DEN, type: 'located_at', properties: {} });
  graph.addNode({
    id: OPPONENT, type: 'actor', name: 'The Major Elite',
    properties: {
      actorType: 'individual',
      domainCapabilities: { iron: 20 },
      monsterState: { ...MAJOR_ELITE_CARD, clockFilled: 0, clockUpdatedTick: TICK },
    },
  });
  graph.addEdge({ id: 'e.calibration.elite.at', source: OPPONENT, target: DEN, type: 'located_at', properties: {} });
  return graph;
}

function fixtureState(graph: WorldGraph): GameState {
  return {
    tick: TICK, seed: 1531, cycle: 1, phase: 'playing', graph,
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
 * Between fights: heal the fighter's conditions, restore their stamped capability
 * (a fight grows its fighter), empty the harm queue, reset the clock, raise the
 * opponent if the last fight felled it (THR-1546's monster branch retains a felled
 * monster as deceased, and a dead opponent ends every later fight `opponent_gone`),
 * and move the tick on — event nodes are keyed by tick, and every fight is a fresh one.
 */
function resetBetweenFights(state: GameState, fightIndex: number, raw: Readonly<Record<string, number>>): void {
  const graph = state.graph;
  state.tick = TICK + fightIndex * TICKS_PER_FIGHT;
  graph.getNode(FIGHTER)!.properties.domainCapabilities = { ...raw };
  for (const edge of graph.getOutgoingEdges(FIGHTER, 'has_trait')) {
    // THR-1548: the fight ending's Scarred is permanent by design; the row measures a fresh guard.
    if (edge.target.startsWith('trait.condition.') || edge.target.startsWith('trait.scar.')) graph.removeEdge(edge.id);
  }
  // THR-1548 — the fight ending's other persistent writes: a slain guard, the
  // `blood_drawn` grudge (which would lend every later fight the Old-wound advantage)
  // and the value drift a yield or rout leaves. The row is a fresh bold guard each time.
  const fighter = graph.getNode(FIGHTER)!.properties as Record<string, unknown>;
  for (const key of ['deceased', 'deceasedTick', 'deathCause', 'slainBy']) delete fighter[key];
  for (const id of [FIGHTER, OPPONENT]) {
    for (const edge of graph.getOutgoingEdges(id, 'hostile_to')) graph.removeEdge(edge.id);
  }
  state.archetypeDrift = [];
  state.pendingQuintessenceEvents = [];
  state.tickEvents = [];
  state.recentEvents = [];
  const opponent = graph.getNode(OPPONENT)!.properties as Record<string, unknown>;
  for (const key of ['deceased', 'deceasedTick', 'deathCause', 'slainBy']) delete opponent[key];
  const bag = opponent.monsterState as Record<string, unknown>;
  bag.clockFilled = 0;
  bag.clockUpdatedTick = state.tick;
}

/** Drive one fight through the real road, step by step, as the phase loop does. */
function fightOnce(state: GameState, rng: () => number): UnifiedAction {
  const template = FIGHT_LAIR_CONFRONT;
  let action = createUnifiedAction({
    actorId: FIGHTER, templateId: template.id, targetId: OPPONENT,
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
      },
    ).updatedAction;
  }
  return action;
}

/** Run the calibration. Pure with respect to the caller: it builds its own fixture world. */
export function runFightCalibration(
  fights: number = FIGHT_CALIBRATION_FIGHTS,
  seed = 1531,
): FightCalibrationReport {
  const graph = fixtureWorld();
  // The sigmoid never quite reaches 1.0; a thousandth under it is the bold guard.
  const raw = {
    iron: rawForCapability(graph, 'iron', BOLD_GUARD_CLASH_CAPABILITY - 1e-3),
    heart: rawForCapability(graph, 'heart', BOLD_GUARD_NERVE_CAPABILITY),
  };
  // Read before any fight grows the fighter: this is who every fight starts as.
  const fighterCapability = {
    clash: computeCapability(graph, FIGHTER, 'iron'),
    nerve: computeCapability(graph, FIGHTER, 'heart'),
  };
  const state = fixtureState(graph);

  const counts: Record<FightCalibrationClass, number> = {
    won: 0, broke_off: 0, yielded: 0, routed: 0, struck_down: 0,
  };
  let segments = 0;
  let harm = 0;
  for (let i = 0; i < fights; i++) {
    resetBetweenFights(state, i, raw);
    const done = fightOnce(state, mulberry32((seed * 7919 + i * 104729) >>> 0));
    const fight = done.fightState;
    counts[CLASS_OF[fight?.result ?? 'broke_off']]++;
    segments += fight ? Math.max(0, fight.clockNow - fight.clockAtStart) : 0;
    harm += fight?.harmTaken ?? 0;
  }

  const percent = {} as Record<FightCalibrationClass, number>;
  const deviation = {} as Record<FightCalibrationClass, number>;
  let withinTolerance = true;
  for (const cls of FIGHT_CALIBRATION_CLASSES) {
    percent[cls] = (100 * counts[cls]) / fights;
    deviation[cls] = percent[cls] - FIGHT_CALIBRATION_TARGET[cls];
    if (Math.abs(deviation[cls]) > FIGHT_CALIBRATION_TOLERANCE) withinTolerance = false;
  }
  return {
    fights,
    counts,
    percent,
    deviation,
    withinTolerance,
    meanSegments: segments / fights,
    meanHarm: harm / fights,
    fighterCapability,
  };
}
