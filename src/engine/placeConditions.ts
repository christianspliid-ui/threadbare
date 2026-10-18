/**
 * The conditions sitting on a place (THR-1143), read off its `has_trait` edges.
 *
 * Moved from `LocationProfileModal` (THR-1910, Inspector S2b) so the place page's
 * `conditions_here` row and the retiring modal read one source until S4 deletes the
 * modal (Law 27). Reader-side of the primitive: the same edges the aftermath writes and
 * `decayConditions` counts down, so an expired condition disappears because its edge is
 * gone, never because a second bookkeeping path was kept in step.
 *
 * Sorted by remaining term, soonest first; indefinite conditions sort last. NFP #4: a
 * dangling edge whose definition node is missing is skipped rather than rendered as its
 * raw id (Law 14).
 */
import type { WorldGraph } from './graph';
import { durationLabel } from './aftermathWords';
import { resolveConditionEffectLine } from './attachmentTemplateIndex';
import { CONDITION_INDEFINITE_TERM } from '../data/subject-sheet-words';

export interface ActiveLocationCondition {
  edgeId: string;
  templateId: string;
  /** The condition's own display name from its definition node. */
  name: string;
  /** Remaining term in words — never ticks (Law 13/14). */
  term: string;
  /** The remaining term as a 0–1 share of its full term, when both are known. */
  share: number | null;
  /**
   * What the condition does here, derived from the same rows the engine reads
   * (THR-790). Null when the definition has no effect substrate.
   */
  effect: string | null;
}

export function readActiveConditions(graph: WorldGraph, locationId: string): ActiveLocationCondition[] {
  const rows: (ActiveLocationCondition & { sortKey: number })[] = [];
  for (const edge of graph.getOutgoingEdges(locationId, 'has_trait')) {
    const def = graph.getNode(edge.target);
    if (!def) continue;
    if ((def.properties?.subcategory as string) !== 'condition') continue;
    const remaining = edge.properties?.ticksRemaining;
    const total = edge.properties?.totalTicks;
    const hasTerm = typeof remaining === 'number' && remaining > 0;
    rows.push({
      edgeId: edge.id,
      templateId: edge.target,
      name: def.name ?? edge.target,
      term: hasTerm ? durationLabel(remaining) : CONDITION_INDEFINITE_TERM,
      share: hasTerm && typeof total === 'number' && total > 0 ? Math.max(0, Math.min(1, remaining / total)) : null,
      // The effect half only — the term already answers "for how long".
      effect: resolveConditionEffectLine(edge.target)?.effect ?? null,
      sortKey: hasTerm ? remaining : Number.POSITIVE_INFINITY,
    });
  }
  rows.sort((a, b) => a.sortKey - b.sortKey || a.name.localeCompare(b.name));
  return rows.map(({ sortKey: _sortKey, ...row }) => row);
}
