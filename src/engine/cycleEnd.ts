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
import { buildCardEcho, selectEchoCard } from './nudgeCardRepertoire';
import { createDoomClockState } from './doomClock';
import { DEFAULT_DOOM_TICKS } from '../data/game-config';
import { getSpherePoints, rankSpherePoints } from './spherePoints';
import { dominionOf } from './dominion';
import { DOMINION_BAND_RANK } from '../data/dominion-content';
import { getLocationNodes } from './sublocationShape';
import { isAspect } from './aspects';
import { emitTrace } from './traceBuffer';

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

/** How many top nodes to consider for cosmic echoes */
export const COSMIC_ECHO_CANDIDATES = 10;

// ─── Twilight Phase ───────────────────────────────────────────────

// THR-1381: the Twilight is a ceremony the player watches with time stopped, not
// seven silent ticks. The per-tick Twilight step, its module-level counter (a singleton
// the per-session cache rule forbids) and its tick-count constant went with the ticks.

export function startTwilight(state: GameState): GameState {
  return {
    ...state,
    phase: 'twilight',
  };
}

/**
 * THR-1381 E2 — the one way out of the Twilight: the ceremony's button, the
 * fail-soft fallbacks and the debug `endAge` lever all call it. No tick passes.
 */
export function completeTwilight(state: GameState): GameState {
  return {
    ...state,
    phase: 'harvest',
  };
}

// ─── Harvest ──────────────────────────────────────────────────────

export interface HarvestResult {
  harvestType: HarvestType;
  cosmicEchoCandidates: HarvestEchoCandidate[];
  divineEchoSlots: number;
  chronicleSummary: string;
  /**
   * The run's defining nudge card, preserved into the next cycle (THR-887).
   * Absent when the god never played a library card — a real state, not an error.
   */
  cardEcho?: EchoDefinition;
  /**
   * THR-1813 — the god's own echoes, picked by rule into the `divineEchoSlots`
   * (Monument → Legacy → Relic, a kind with no candidate yielding its slot).
   * Optional so older fixtures keep their shape; absent reads as none.
   */
  divineEchoes?: EchoDefinition[];
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

  // THR-1813 Decided 5: echoes carry the god's bought primary and secondary, not
  // the cosmology's top two. A god with no readable points falls back to those.
  const cosmologyTopTwo = [...SPHERE_NAMES].sort((a, b) =>
    (state.cosmology[b] ?? 0) - (state.cosmology[a] ?? 0)
  ).slice(0, 2);
  const godPair = rankSpherePoints(getSpherePoints(state.graph.getNode(state.ascendantId)?.properties)).slice(0, 2);
  const echoSpheres: SphereName[] = godPair.length === 2
    ? godPair
    : godPair.length === 1 ? [godPair[0], cosmologyTopTwo.find(s => s !== godPair[0]) ?? godPair[0]] : cosmologyTopTwo;

  const significance = new Map<string, number>();
  const scored = allNodes.map(node => {
    const edgeCount = state.graph.getAllEdgesForNode(node.id).length;
    // Events = number of chronicle entries mentioning this node (simplified)
    const eventCount = state.chronicleEntries.filter(
      e => e.promptContext.actors.includes(node.id)
    ).length;
    const score = computeSignificanceScore(edgeCount, eventCount, node.type);
    significance.set(node.id, score);
    return { node, score };
  });

  // THR-1813 E4 — the god's own echoes, picked by rule before the cosmic ones so
  // the same node is never carried twice.
  const divineCounts: Record<HarvestType, number> = {
    triumphant: 3,
    bittersweet: 2,
    somber: 1,
  };
  const divineEchoes = pickDivineEchoes(state, divineCounts[harvestType], significance, echoSpheres);
  const divineNodeIds = new Set(divineEchoes.map(d => d.originNodeId));

  const candidates: HarvestEchoCandidate[] = scored
    .filter(({ node }) => !divineNodeIds.has(node.id))
    .map(({ node, score }) => ({
      node,
      score,
      echoDefinition: buildEchoDefinition(
        `echo_${state.cycle}_${node.id}`,
        node,
        'cosmic',
        state.cycle,
        score,
        echoSpheres,
      ),
    }))
    .sort((a, b) => b.score - a.score);

  // Cosmic echo counts by harvest type
  const cosmicCounts: Record<HarvestType, number> = {
    triumphant: 5,
    bittersweet: 4,
    somber: 3,
  };

  // Generate summary
  const topName = candidates[0]?.node.name ?? 'the world';
  const chronicleSummary = harvestType === 'triumphant'
    ? `A triumphant age. ${topName} shone brightest among the echoes.`
    : harvestType === 'somber'
    ? `A somber age. ${topName} faded into memory.`
    : `A bittersweet age. ${topName} left a lasting mark.`;

  // THR-887 — the fourth preserved thing: the card that defined the run.
  // Selected, never rolled, so a saved run replays to the same echo card.
  const topSpheres = [...SPHERE_NAMES]
    .sort((a, b) => (state.cosmology[b] ?? 0) - (state.cosmology[a] ?? 0))
    .slice(0, 2);
  const defining = selectEchoCard(
    Object.entries(state.cardPlayTally ?? {}).map(([cardId, entry]) => ({
      cardId,
      timesPlayed: entry.timesPlayed,
      peakSignificance: entry.peakSignificance,
    })),
  );
  const cardEcho = defining
    ? buildCardEcho(
        defining.cardId,
        harvestType,
        state.cycle,
        // The card's own significance is how climactic its best moment was —
        // the same number the selection tie-broke on.
        defining.peakSignificance,
        topSpheres,
      )
    : undefined;

  return {
    harvestType,
    cosmicEchoCandidates: candidates.slice(0, cosmicCounts[harvestType]),
    divineEchoSlots: divineCounts[harvestType],
    chronicleSummary,
    cardEcho,
    divineEchoes,
  };
}

// ─── Divine echo picks (THR-1813 E4) ──────────────────────────────

type DivineKind = 'monument' | 'legacy' | 'relic';
const DIVINE_ROTATION: readonly DivineKind[] = ['monument', 'legacy', 'relic'];

interface DivineCandidate { node: GraphNode; reason: string }

const bySignificanceThenId = (sig: Map<string, number>) => (a: GraphNode, b: GraphNode) =>
  (sig.get(b.id) ?? 0) - (sig.get(a.id) ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Decided 4 — the god's echoes, by rule, never rolled. A Monument is a place the
 * god reads Sovereign, else Held; a Legacy is a threaded mortal at the highest
 * thread tier (an Aspect first); a Relic is an artifact one of the god's threaded
 * mortals bears. Ties break on significance, then id. Slots fill in rotation
 * Monument → Legacy → Relic; a kind with no candidate yields to the next.
 */
export function pickDivineEchoes(
  state: GameState,
  slots: number,
  significance: Map<string, number>,
  spheres: SphereName[],
): EchoDefinition[] {
  const graph = state.graph;
  const sig = bySignificanceThenId(significance);
  const pools: Record<DivineKind, DivineCandidate[]> = { monument: [], legacy: [], relic: [] };

  try {
    // Monuments: the god's surest places.
    const places = getLocationNodes(graph)
      .map(node => ({ node, band: dominionOf(graph, state.ascendantId, node.id).band }))
      .filter(p => p.band === 'sovereign' || p.band === 'held');
    places.sort((a, b) => DOMINION_BAND_RANK[b.band] - DOMINION_BAND_RANK[a.band] || sig(a.node, b.node));
    pools.monument = places.map(p => ({ node: p.node, reason: `the god reads ${p.band}` }));

    // Legacies: the mortals the god raised highest.
    const threads = graph.getOutgoingEdges(state.ascendantId, 'thread');
    const mortals = threads
      .map(e => ({ node: graph.getNode(e.target), tier: Number((e.properties as { tier?: number } | undefined)?.tier) || 0 }))
      .filter((m): m is { node: GraphNode; tier: number } => !!m.node && m.node.type === 'actor');
    const aspect = new Map(mortals.map(m => [m.node.id, isAspect(graph, m.node.id)]));
    mortals.sort((a, b) =>
      Number(aspect.get(b.node.id)) - Number(aspect.get(a.node.id)) || b.tier - a.tier || sig(a.node, b.node));
    pools.legacy = mortals.map(m => ({
      node: m.node,
      reason: aspect.get(m.node.id) ? 'an Aspect of the god' : `threaded at tier ${m.tier}`,
    }));

    // Relics: what the god's chosen carried — held (`possesses`) or bonded (`bonded_to`,
    // how a legendary artifact is borne), the same two edges every bearer read uses.
    const relics = new Map<string, GraphNode>();
    for (const m of mortals) {
      for (const e of [
        ...graph.getOutgoingEdges(m.node.id, 'possesses'),
        ...graph.getOutgoingEdges(m.node.id, 'bonded_to'),
      ]) {
        const a = graph.getNode(e.target);
        if (a?.type === 'artifact' || a?.type === 'artifact_legendary') relics.set(a.id, a);
      }
    }
    pools.relic = [...relics.values()].sort(sig).map(node => ({ node, reason: 'borne by a threaded mortal' }));
  } catch {
    // Fail-soft: an unreadable world leaves the god nothing rather than crashing the harvest.
  }

  const used = new Set<string>();
  const picked: EchoDefinition[] = [];
  for (let slot = 0; slot < slots; slot++) {
    let chosen: { kind: DivineKind; c: DivineCandidate } | null = null;
    for (let k = 0; k < DIVINE_ROTATION.length && !chosen; k++) {
      const kind = DIVINE_ROTATION[(slot + k) % DIVINE_ROTATION.length];
      const c = pools[kind].find(x => !used.has(x.node.id));
      if (c) chosen = { kind, c };
    }
    if (!chosen) {
      emitTrace({ tick: state.tick, category: 'harvest.divine_echo_picked', slot, kind: 'none', reason: 'no candidate of any kind', summary: `divine echo slot ${slot}: none` });
      continue;
    }
    used.add(chosen.c.node.id);
    const score = significance.get(chosen.c.node.id) ?? 0;
    picked.push(buildEchoDefinition(`echo_${state.cycle}_divine_${chosen.c.node.id}`, chosen.c.node, 'divine', state.cycle, score, spheres));
    emitTrace({
      tick: state.tick,
      category: 'harvest.divine_echo_picked',
      slot,
      kind: chosen.kind,
      nodeId: chosen.c.node.id,
      reason: chosen.c.reason,
      summary: `divine echo slot ${slot}: ${chosen.kind} ${chosen.c.node.name} (${chosen.c.reason})`,
    });
  }
  return picked;
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

  // THR-1642 — the new cycle gets its own doom clock. Spreading `...state` alone
  // carried the expired clock across, so the first `playing` tick re-fired
  // `phaseDoomExpiry` and cycle 2 harvested at once. The next cycle
  // keeps the same doom archetype and stage definitions (a World-Soul redraw is
  // future design); only the clock and its fired-milestone bookkeeping reset.
  // THR-1646: the new cycle's clock wakes at cycle start (tick 0 below), not at a
  // bond. The bond-wake exists to protect the opening; a later cycle has no
  // opening, and a First who survived is already bonded — left asleep, the clock
  // would wait for a bond that already exists. A cycle whose First died must not
  // sleep forever either, so the wake is unconditional here. The Unmaking floor
  // and the rival grace window still count from this wake.
  const doomClock = { ...createDoomClockState(doomArch, DEFAULT_DOOM_TICKS), wokeAtTick: 0 };
  const doomDefinition = { ...state.doomDefinition, totalTicks: DEFAULT_DOOM_TICKS };
  // Identity milestones carry a runtime `triggered` flag; left set, the new
  // cycle's milestones would never fire. Copy rather than mutate — the matrix
  // is a shared module-level table.
  const doomIdentityMatrix = state.doomIdentityMatrix
    ? {
        ...state.doomIdentityMatrix,
        identityMilestones: state.doomIdentityMatrix.identityMilestones.map(m => ({
          ...m,
          triggered: false,
        })),
      }
    : state.doomIdentityMatrix;

  return {
    ...state,
    cycle: state.cycle + 1,
    tick: 0,
    phase: 'transition',
    doomClock,
    doomDefinition,
    doomIdentityMatrix,
    echoDefinitions: combinedDefinitions,
    echoStates: combinedStates,
    chronicle,
    chronicleEntries: [], // reset for new cycle
    tickEvents: [],
    recentEvents: [],
    stealthExposure: 0,
    // THR-887 — the tally is run-scoped. Carrying it across the transition would
    // let the first cycle's favorite card keep winning every later harvest.
    cardPlayTally: {},
  };
}
