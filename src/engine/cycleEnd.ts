/**
 * Cycle End Flow — Twilight → Harvest → Transition.
 *
 * Chains the end-of-cycle sequence: weakened play, scoring,
 * echo selection, world-soul persistence, new cycle setup.
 */
import type { GameState, TickEvent } from '../types/gameState';
import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { HarvestType } from '../types/worldSoul';
import {
  computeSignificanceScore,
  buildEchoDefinition,
  createEchoState,
  degradeAllEchoes,
} from './echo';
import {
  createVolume,
  addChapter,
  closeVolume,
  addEchoThreadAppearance,
} from './chronicle';
import type { EchoDefinition } from '../types/echo';
import type { GraphNode } from '../types/graph';

// ─── Seeded PRNG ──────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Constants ────────────────────────────────────────────────────

/**
 * Twilight phase ticks — sourced from the central config file.
 * Content managers: edit src/data/game-config.ts to change twilight length.
 */
import { TWILIGHT_TICKS } from '../data/game-config';
export { TWILIGHT_TICKS };

/** How many top nodes to consider for cosmic echoes */
export const COSMIC_ECHO_CANDIDATES = 10;

// ─── Twilight Phase ───────────────────────────────────────────────

export interface TwilightTickResult {
  state: GameState;
  complete: boolean;
}

let twilightCounter = 0;

export function startTwilight(state: GameState): GameState {
  twilightCounter = 0;
  return {
    ...state,
    phase: 'twilight',
  };
}

export function runTwilightTick(state: GameState): TwilightTickResult {
  twilightCounter++;
  const complete = twilightCounter >= TWILIGHT_TICKS;

  const newState: GameState = {
    ...state,
    tick: state.tick + 1,
    phase: complete ? 'harvest' : 'twilight',
  };

  return { state: newState, complete };
}

// ─── Harvest ──────────────────────────────────────────────────────

export interface HarvestResult {
  harvestType: HarvestType;
  cosmicEchoCandidates: HarvestEchoCandidate[];
  divineEchoSlots: number;
  chronicleSummary: string;
}

export interface HarvestEchoCandidate {
  node: GraphNode;
  score: number;
  echoDefinition: EchoDefinition;
}

export function computeHarvest(state: GameState): HarvestResult {
  const rng = mulberry32(state.seed + state.cycle * 997);

  // Determine harvest type based on mandate and doom state
  const mandateCompleted = state.mandateState?.completed ?? false;
  const harvestType: HarvestType = mandateCompleted
    ? 'triumphant'
    : state.doomClock.progress > 0.9
    ? 'somber'
    : 'bittersweet';

  // Score all significant nodes
  const actors = state.graph.getNodesByType('actor').filter(
    n => n.properties.actorType === 'individual'
  );
  const locations = state.graph.getNodesByType('location');
  const artifacts = state.graph.getNodesByType('artifact');
  const allNodes = [...actors, ...locations, ...artifacts];

  const candidates: HarvestEchoCandidate[] = allNodes.map(node => {
    const edgeCount = state.graph.getAllEdgesForNode(node.id).length;
    // Events = number of chronicle entries mentioning this node (simplified)
    const eventCount = state.chronicleEntries.filter(
      e => e.promptContext.actors.includes(node.id)
    ).length;
    const score = computeSignificanceScore(edgeCount, eventCount, node.type);

    const echoDef = buildEchoDefinition(
      `echo_${state.cycle}_${node.id}`,
      node,
      'cosmic',
      state.cycle,
      score,
      // Pick sphere affinities from cosmology top spheres
      [...SPHERE_NAMES].sort((a, b) =>
        (state.cosmology[b] ?? 0) - (state.cosmology[a] ?? 0)
      ).slice(0, 2),
    );

    return { node, score, echoDefinition: echoDef };
  }).sort((a, b) => b.score - a.score);

  // Cosmic echo counts by harvest type
  const cosmicCounts: Record<HarvestType, number> = {
    triumphant: 5,
    bittersweet: 4,
    somber: 3,
  };
  const divineCounts: Record<HarvestType, number> = {
    triumphant: 3,
    bittersweet: 2,
    somber: 1,
  };

  // Generate summary
  const topName = candidates[0]?.node.name ?? 'the world';
  const chronicleSummary = harvestType === 'triumphant'
    ? `A triumphant age. ${topName} shone brightest among the echoes.`
    : harvestType === 'somber'
    ? `A somber age. ${topName} faded into memory.`
    : `A bittersweet age. ${topName} left a lasting mark.`;

  return {
    harvestType,
    cosmicEchoCandidates: candidates.slice(0, cosmicCounts[harvestType]),
    divineEchoSlots: divineCounts[harvestType],
    chronicleSummary,
  };
}

// ─── Transition to New Cycle ──────────────────────────────────────

export function transitionToNewCycle(
  state: GameState,
  selectedCosmicEchoes: EchoDefinition[],
  selectedDivineEchoes: EchoDefinition[],
  harvestSummary: string,
): GameState {
  const allNewEchoes = [...selectedCosmicEchoes, ...selectedDivineEchoes];
  const newEchoStates = allNewEchoes.map(e => createEchoState(e.id));

  // Degrade existing echoes from previous cycles
  const degradedOldEchoes = degradeAllEchoes(state.echoStates);
  const survivingOldEchoes = degradedOldEchoes.filter(e => !e.faded);

  // Combine old surviving + new
  const combinedDefinitions = [
    ...state.echoDefinitions.filter(d =>
      survivingOldEchoes.some(s => s.id === d.id)
    ),
    ...allNewEchoes,
  ];
  const combinedStates = [...survivingOldEchoes, ...newEchoStates];

  // Update chronicle — use doom identity chapter title if available (THR-21)
  let chronicle = state.chronicle;
  const doomArch = state.doomDefinition.archetype;
  const identityTitles = state.doomIdentityMatrix?.chronicleChapterTitles;
  const stageIndex = Math.max(0, (state.doomClock?.currentStage ?? 0) - 1);
  const identityTitle = identityTitles && identityTitles.length > stageIndex
    ? identityTitles[stageIndex]
    : undefined;
  chronicle = createVolume(chronicle, state.cycle, doomArch, identityTitle);

  // Add chapters from chronicle entries
  for (const entry of state.chronicleEntries) {
    chronicle = addChapter(chronicle, {
      id: entry.id,
      title: entry.title,
      prose: entry.prose,
      tick: entry.tick,
      significance: 0.8,
      spheres: [entry.promptContext.sphere],
      actorIds: entry.promptContext.actors,
    });
  }

  chronicle = closeVolume(chronicle, harvestSummary);

  // Record echo threads
  for (const echo of allNewEchoes) {
    const volumeId = `vol_${String(state.cycle).padStart(3, '0')}`;
    chronicle = addEchoThreadAppearance(
      chronicle, echo.id, state.cycle, volumeId,
      `${echo.name} emerged in the Age of the ${doomArch}.`
    );
  }

  return {
    ...state,
    cycle: state.cycle + 1,
    tick: 0,
    phase: 'transition',
    echoDefinitions: combinedDefinitions,
    echoStates: combinedStates,
    chronicle,
    chronicleEntries: [], // reset for new cycle
    tickEvents: [],
    recentEvents: [],
    stealthExposure: 0,
  };
}
