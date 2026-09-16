/**
 * Ruins Layer — Clue Rumour Sweep (THR-1506).
 *
 * The organic feed the clue economy never had. The ruins design (2026-04-19,
 * § "Encounter template extensions") reserved four clue-bearing encounters —
 * `ruins.glossed_tome` at a library, `ruins.drunk_cartographer` at a tavern,
 * a treasure map in a looted pack, a spy debrief — and the spawn-rate constants
 * (`CLUE_SPAWN_LIBRARY_BASE` et al.) to drive them. The encounters were never
 * authored and the constants had no reader, so in a normal run the only clues
 * were the rare reputation/delve encounters' `spawn_clue` effects: one edge in
 * 175 ticks on seed 42 / medium, and `phaseRuinQuestHooks` never fired.
 *
 * This phase reads those constants. Every `CLUE_RUMOR_INTERVAL_TICKS`, each
 * settlement that owns a gathering place of a rumour-bearing kind (a tavern or
 * inn, a library or archive, a spy network) rolls that kind's base probability,
 * scaled by `CLUE_RUMOR_SWEEP_SCALE`. A settlement that passes hands a `vague`
 * clue about its nearest ruin — within `CLUE_RUMOR_RUIN_RADIUS` hexes, so a
 * rumour is local and the hall that might post on it is in reach — to one of
 * its own people, chosen by Narrative Gravity (`produceClueConsequence`), so a
 * threaded or story-beat actor hears it before an ambient one does.
 *
 * Keyed on the *settlement*, not on presence at the place: measured on seed 42
 * at ticks 40 and 100, no actor stood at a tavern, inn, or library — they park
 * at market districts, gatehouses and temple quarters — so a presence gate
 * would have been as dead as the constants it replaced.
 *
 * Fail-soft: every per-settlement step is wrapped; a bad node never crashes
 * the tick. Deterministic: the roll RNG is seeded from `state.seed` and the
 * tick, and settlements are visited in id order (NFP #3).
 */

import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { ClueSource } from '../../types/knowledge';
import type { WorldGraph } from '../graph';
import { getAgentsAtLocation, getSublocationsAt } from '../graphQueries';
import { getLocationNodes } from '../sublocationShape';
import { emitTrace } from '../traceBuffer';
import { mulberry32 } from '../../lib/prng';
import { findNearestRuinId, produceClueConsequence } from './clueLifecycle';
import {
  CLUE_RUMOR_INTERVAL_TICKS,
  CLUE_RUMOR_SWEEP_SCALE,
  CLUE_RUMOR_RUIN_RADIUS,
  CLUE_RUMOR_MAX_PER_SWEEP,
  CLUE_RUMOR_PLACE_SOURCES,
} from './constants';

// ─── Rumour source lookup ────────────────────────────────────────────────────

export interface RumorSource {
  /** The `sublocationTypeId` that carries the rumour. */
  placeTypeId: string;
  source: ClueSource;
  /** Base per-encounter probability from `constants.ts`, before the sweep scale. */
  base: number;
}

/**
 * The strongest rumour-bearing place a settlement owns, or null when it has
 * none. A town with both a library and a tavern rolls the library's odds — one
 * roll per settlement per sweep, so a well-appointed city is not several
 * rumour mills stacked.
 */
export function findRumorSourceAt(graph: WorldGraph, settlementId: string): RumorSource | null {
  let best: RumorSource | null = null;
  for (const place of getSublocationsAt(graph, settlementId)) {
    const typeId = place.properties.sublocationTypeId;
    if (typeof typeId !== 'string') continue;
    const row = CLUE_RUMOR_PLACE_SOURCES.find(s => s.placeTypeId === typeId);
    if (!row) continue;
    if (!best || row.base > best.base) best = row;
  }
  return best;
}

/**
 * Everyone who could overhear a rumour in this settlement: individuals located
 * at the settlement itself or at any place inside it. The recipient is then
 * chosen among them by Narrative Gravity.
 */
export function rumorCandidatePool(graph: WorldGraph, settlementId: string): string[] {
  const ids = new Set<string>();
  for (const a of getAgentsAtLocation(graph, settlementId)) ids.add(a.id);
  for (const place of getSublocationsAt(graph, settlementId)) {
    for (const a of getAgentsAtLocation(graph, place.id)) ids.add(a.id);
  }
  return [...ids].sort();
}

// ─── Sweep ───────────────────────────────────────────────────────────────────

export interface ClueRumorSweepResult {
  /** Settlements that owned a rumour-bearing place and rolled. */
  rolled: number;
  /** Settlements whose roll passed. */
  passed: number;
  /** Clue edges actually written. */
  spawned: number;
  /** Passed, but no ruin within `CLUE_RUMOR_RUIN_RADIUS`. */
  suppressedNoRuin: number;
  /** Passed, but nobody in the settlement to hear it. */
  suppressedNoPool: number;
  /** Passed, but Narrative Gravity found no eligible recipient (saga tier floor). */
  suppressedNoRecipient: number;
  /** Passed, but over `CLUE_RUMOR_MAX_PER_SWEEP`. */
  capped: number;
  /** Spawned clues by source, for the trace. */
  bySource: Partial<Record<ClueSource, number>>;
}

function emptyResult(): ClueRumorSweepResult {
  return {
    rolled: 0, passed: 0, spawned: 0,
    suppressedNoRuin: 0, suppressedNoPool: 0, suppressedNoRecipient: 0, capped: 0,
    bySource: {},
  };
}

function hexOf(node: GraphNode): { col: number; row: number } | null {
  const col = node.properties.hexCol;
  const row = node.properties.hexRow;
  return typeof col === 'number' && typeof row === 'number' ? { col, row } : null;
}

/**
 * One rumour sweep over every settlement. Exported with an injectable RNG so a
 * test can force the roll either way; `phaseClueRumors` seeds it from the state.
 */
export function runClueRumorSweep(state: GameState, rng: () => number): ClueRumorSweepResult {
  const { graph, tick } = state;
  const result = emptyResult();

  // Sorted before any roll so the seeded sequence does not depend on graph
  // insertion order — same seed, same world, same rumours (NFP #3).
  const settlements = getLocationNodes(graph)
    .filter(n => hexOf(n) !== null)
    .sort((a, b) => a.id.localeCompare(b.id));

  // Roll first, then place: the roll order is what the seed fixes, and a
  // passing settlement that turns out to have no ruin in reach still consumed
  // its roll rather than shifting every later settlement's.
  const passing: Array<{ settlement: GraphNode; source: RumorSource }> = [];
  for (const settlement of settlements) {
    try {
      const source = findRumorSourceAt(graph, settlement.id);
      if (!source) continue;
      result.rolled++;
      if (rng() >= source.base * CLUE_RUMOR_SWEEP_SCALE) continue;
      result.passed++;
      passing.push({ settlement, source });
    } catch {
      // fail-soft: a bad settlement never stops the sweep
    }
  }

  // Cap by a seeded shuffle, so the cap does not always fall on the same
  // alphabetical tail of the map.
  for (let i = passing.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [passing[i], passing[j]] = [passing[j], passing[i]];
  }
  if (passing.length > CLUE_RUMOR_MAX_PER_SWEEP) {
    result.capped = passing.length - CLUE_RUMOR_MAX_PER_SWEEP;
    passing.length = CLUE_RUMOR_MAX_PER_SWEEP;
  }

  for (const { settlement, source } of passing) {
    try {
      const hex = hexOf(settlement);
      if (!hex) continue;
      const ruinId = findNearestRuinId(graph, hex, rng, CLUE_RUMOR_RUIN_RADIUS);
      if (!ruinId) { result.suppressedNoRuin++; continue; }

      const candidatePool = rumorCandidatePool(graph, settlement.id);
      if (candidatePool.length === 0) { result.suppressedNoPool++; continue; }

      const ruinProps = graph.getNode(ruinId)?.properties ?? {};
      const recipient = produceClueConsequence({
        candidatePool,
        targetRuinId: ruinId,
        ruinMagnitude: typeof ruinProps.ruinMagnitude === 'number' ? ruinProps.ruinMagnitude : 0.5,
        ruinSphereAlignment: typeof ruinProps.sphereAlignment === 'string' ? ruinProps.sphereAlignment : '',
        ruinOriginCultureId: typeof ruinProps.originCultureId === 'string' ? ruinProps.originCultureId : '',
        source: source.source,
        precision: 'vague',
        detail: `heard at ${settlement.name ?? settlement.id}`,
        ascendantId: state.ascendantId,
        tick,
        graph,
        encounterProgress: state.encounterProgress,
        rng,
      });
      if (!recipient) { result.suppressedNoRecipient++; continue; }

      result.spawned++;
      result.bySource[source.source] = (result.bySource[source.source] ?? 0) + 1;
    } catch {
      // fail-soft: a bad ruin or pool never crashes the phase
    }
  }

  return result;
}

/**
 * Phase `clue_rumors` — runs every `CLUE_RUMOR_INTERVAL_TICKS`, immediately
 * before `clue_decay` so a rumour born this sweep is aged by the same clock
 * that will retire it. Exactly one aggregate trace per sweep.
 */
export function phaseClueRumors(state: GameState): Partial<GameState> {
  const { tick } = state;
  if (tick % CLUE_RUMOR_INTERVAL_TICKS !== 0) return {};

  try {
    const rng = mulberry32((state.seed ^ (tick * 131)) >>> 0);
    const result = runClueRumorSweep(state, rng);
    emitTrace({
      category: 'ruins.clue_rumor_sweep',
      tick,
      ...result,
      summary:
        `Rumour sweep: ${result.spawned} clue(s) from ${result.passed}/${result.rolled} settlements` +
        (result.capped ? `, ${result.capped} capped` : '') +
        (result.suppressedNoRuin ? `, ${result.suppressedNoRuin} with no ruin in reach` : '') +
        (result.suppressedNoPool ? `, ${result.suppressedNoPool} with nobody to hear it` : '') +
        (result.suppressedNoRecipient ? `, ${result.suppressedNoRecipient} below the tier floor` : ''),
    });
  } catch {
    // fail-soft: the sweep is non-fatal to the tick loop
  }

  return {};
}
