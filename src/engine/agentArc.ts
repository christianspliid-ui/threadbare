/**
 * The arc so far — one mortal's story as a strip of lines (THR-1299 slice 4).
 *
 * The census's "curated per-agent chronicle surface", assembled from **persisted**
 * state only: the strategic history (undertakings finished and failed), completed
 * ambitions, and the moment records still in the queue. The 48-tick digest buffer
 * is deliberately not a source — an arc outlives it. Calling changes join the
 * strip in slice 5.
 *
 * Every line renders its time as a relative word — "today", "two days past" —
 * through the same `durationLabel` ladder the rest of the game bands ticks with,
 * so no numeral escapes (Law 13/14) and the game keeps its decision not to build
 * a named calendar (THR-1299 § census, build-or-drop: dropped).
 *
 * Pure and deterministic: same state in, same strip out. Newest last.
 */

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import { MOMENT_ARC_STRIP_MAX } from '../data/strategic-action-constants';
import { TICKS_PER_DAY } from '../data/attention-constants';
import { durationLabel } from './aftermathWords';
import { getCompletedAmbitions } from './agentDetail';
import { MOMENT_CARD_CONTENT } from '../data/moment-card-content';

export type AgentArcEntryKind = 'undertaking_completed' | 'undertaking_failed' | 'ambition_completed' | 'moment';

export interface AgentArcEntry {
  /** Stable id — the React key. */
  readonly id: string;
  readonly kind: AgentArcEntryKind;
  readonly tick: number;
  /** One line, narrator mode. */
  readonly line: string;
  /** The tick as the player reads it — "today", "three days past". */
  readonly when: string;
}

/** Relative time in words. Never a numeral. */
export function ticksAgoWord(ticksAgo: number): string {
  if (!Number.isFinite(ticksAgo) || ticksAgo < TICKS_PER_DAY) return 'today';
  return `${durationLabel(ticksAgo)} past`;
}

/**
 * Assemble the strip. Sources are read in a fixed order so equal ticks keep a
 * deterministic sequence; the result is the newest `MOMENT_ARC_STRIP_MAX` entries,
 * oldest first — the way a story is read.
 */
export function getAgentArc(
  state: Pick<GameState, 'strategicState' | 'pendingUndertakingMoments' | 'tick'>,
  graph: WorldGraph,
  agentId: string,
): readonly AgentArcEntry[] {
  const entries: AgentArcEntry[] = [];
  const now = state.tick;

  for (const h of state.strategicState?.history ?? []) {
    if (h.actorId !== agentId) continue;
    if (h.outcome === 'completed') {
      entries.push({
        id: `hist_${h.templateId}_${h.tick}`,
        kind: 'undertaking_completed',
        tick: h.tick,
        line: `Finished ${h.displayName}.`,
        when: ticksAgoWord(now - h.tick),
      });
    } else {
      entries.push({
        id: `hist_${h.templateId}_${h.tick}`,
        kind: 'undertaking_failed',
        tick: h.tick,
        line: `${h.displayName} came to nothing.`,
        when: ticksAgoWord(now - h.tick),
      });
    }
  }

  for (const a of getCompletedAmbitions(graph, agentId)) {
    const tick = a.resolvedTick ?? now;
    entries.push({
      id: `amb_${a.ambitionId}_${tick}`,
      kind: 'ambition_completed',
      tick,
      line: `Saw ${a.name} through.`,
      when: ticksAgoWord(now - tick),
    });
  }

  // Moments still in the queue — the turns of a work still under way. A finished
  // work's completion moment and its history entry describe one event; the
  // history line wins, so a completion record is skipped here.
  for (const m of state.pendingUndertakingMoments ?? []) {
    if (m.actorId !== agentId || m.momentClass === 'completion') continue;
    entries.push({
      id: `moment_${m.id}`,
      kind: 'moment',
      tick: m.tick,
      line: `${MOMENT_CARD_CONTENT[m.momentClass].title}: ${m.undertakingName}.`,
      when: ticksAgoWord(now - m.tick),
    });
  }

  entries.sort((a, b) => a.tick - b.tick);
  return entries.length > MOMENT_ARC_STRIP_MAX
    ? entries.slice(entries.length - MOMENT_ARC_STRIP_MAX)
    : entries;
}
