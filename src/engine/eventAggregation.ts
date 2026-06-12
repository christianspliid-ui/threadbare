/**
 * Same-hex same-tick agent_encounter event aggregation (THR-456).
 *
 * Runs after phaseColocationDetection, before chronicle/notification routing.
 * Groups agent_encounter events that share the same hex and tick into a single
 * synthesised event when the group size ≥ EVENT_AGGREGATE_MIN_GROUP_SIZE.
 *
 * The original raw events are NOT preserved in the visible stream; their ids are
 * attached to the synthesised event's `aggregatedFromIds` so the debug panel
 * can drill in.
 */

import type { TickEvent } from '../types/gameState';
import type { ChronicleAggregatedTrace, ChronicleAggregateFailedTrace } from '../types/trace';
import {
  getAggregatePhrasePool,
  crowdSizeCategory,
  type AggregatePhraseEntry,
} from '../data/event-aggregation-content';
import { emitTrace } from './traceBuffer';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Smallest same-hex same-tick group that triggers collapse */
export const EVENT_AGGREGATE_MIN_GROUP_SIZE = 3;

/** Significance increment for synthesised events (on top of max member significance) */
export const AGGREGATE_SIGNIFICANCE_BUMP = 0.05;

/** Tick window for grouping — 1 = same tick only */
export const EVENT_AGGREGATE_GROUP_WINDOW_TICKS = 1;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexKey(col: number, row: number): string {
  return `${col},${row}`;
}

function substituteTemplate(template: string, locationName: string, n: number): string {
  return template
    .replace(/\{location\}/g, locationName)
    .replace(/\{n\}/g, String(n));
}

function pickPhrase(pool: AggregatePhraseEntry[], rng: () => number): AggregatePhraseEntry {
  return pool[Math.floor(rng() * pool.length)];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Aggregate same-hex same-tick `agent_encounter` events.
 *
 * @param events   The full tickEvents array after phaseColocationDetection.
 * @param rng      Seeded PRNG from the tick (for deterministic phrase selection).
 * @param tick     Current tick (for trace emission).
 * @param getLocationName  Resolver from hex key → display name (can return null).
 * @returns        New tickEvents array with clusters collapsed.
 */
export function aggregateColocationEvents(
  events: TickEvent[],
  rng: () => number,
  tick: number,
  getLocationName: (col: number, row: number) => string | null,
): TickEvent[] {
  try {
    return _aggregateColocationEvents(events, rng, tick, getLocationName);
  } catch (err) {
    emitTrace({
      tick,
      category: 'chronicle.aggregate_failed',
      summary: `aggregateColocationEvents threw: ${String(err)}`,
      errorMessage: String(err),
    } as ChronicleAggregateFailedTrace);
    return events;
  }
}

function _aggregateColocationEvents(
  events: TickEvent[],
  rng: () => number,
  tick: number,
  getLocationName: (col: number, row: number) => string | null,
): TickEvent[] {
  // Partition into encounter events with hex coords vs everything else
  type EncounterEvent = TickEvent & { hexCoords: { col: number; row: number } };

  const encounters: EncounterEvent[] = [];
  const nonEncounters: TickEvent[] = [];

  for (const ev of events) {
    if (ev.type === 'agent_encounter' && ev.hexCoords != null) {
      encounters.push(ev as EncounterEvent);
    } else {
      nonEncounters.push(ev);
    }
  }

  if (encounters.length === 0) return events;

  // Group by hex key (same tick guaranteed — we're processing one tick at a time)
  const groups = new Map<string, EncounterEvent[]>();
  for (const ev of encounters) {
    const k = hexKey(ev.hexCoords.col, ev.hexCoords.row);
    const g = groups.get(k);
    if (g) {
      g.push(ev);
    } else {
      groups.set(k, [ev]);
    }
  }

  const result: TickEvent[] = [...nonEncounters];

  for (const [, group] of groups) {
    if (group.length < EVENT_AGGREGATE_MIN_GROUP_SIZE) {
      result.push(...group);
      continue;
    }

    const { col, row } = group[0].hexCoords;
    const locationName = getLocationName(col, row) ?? 'the crossroads';
    const n = group.length;
    const crowdSize = crowdSizeCategory(n);
    const pool = getAggregatePhrasePool(crowdSize);
    const phrase = pickPhrase(pool, rng);

    const maxSignificance = group.reduce((m, e) => Math.max(m, e.significance), 0);
    // Sort member ids lexicographically for a deterministic actorId choice
    const sortedIds = group.map(e => e.actorId ?? e.id).sort();
    const memberIds = group.map(e => e.id);

    const synthesised: TickEvent = {
      id: `evt_agg_${tick}_${col}_${row}`,
      tick,
      type: 'agent_encounter',
      message: substituteTemplate(phrase.template, locationName, n),
      significance: Math.min(1, maxSignificance + AGGREGATE_SIGNIFICANCE_BUMP),
      actorId: sortedIds[0],
      hexCoords: { col, row },
      aggregatedFromIds: memberIds,
    };

    result.push(synthesised);

    emitTrace({
      tick,
      category: 'chronicle.aggregated',
      summary: `Aggregated ${n} agent_encounter events at (${col},${row}) → phrase "${phrase.phraseId}"`,
      hexCoords: { col, row },
      memberCount: n,
      memberIds,
      phraseId: phrase.phraseId,
    } as ChronicleAggregatedTrace);
  }

  return result;
}
