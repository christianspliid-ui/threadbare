/**
 * The division rule, wired (THR-1398 decided it; THR-1403 flips the model onto it).
 *
 * A mortal's spread of undertaking cells is **derived**, never hand-listed: the active
 * ambition's *category* picks the verbs they lean toward, their two leading *Reaches*
 * pick the kinds they can touch, and the intersection — kept to cells the registry has,
 * Eye adding `observe` on every kind — is what the candidate board walks. An ambition
 * profile's hand list (`strategicProfile.cells`) is added on top and never replaces the
 * derivation (THR-1398: overrides add). The tables are `src/data/division-rule-tables.ts`,
 * which the codex's *who tends to do it* reads as well, so the sheet and the board agree.
 *
 * Lives beside the candidate generator rather than in `calling.ts` (which also reads the
 * leading reaches) because `calling.ts` imports the generator — the reach read moved here
 * so neither module imports the other.
 */
import type { GraphNode } from '../types/graph';
import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import type { AmbitionCategory } from '../types/ambition';
import { deriveCells, VERBS_BY_CATEGORY } from '../data/division-rule-tables';

/** The two highest-capability reaches, highest first; fewer when the map is thin. */
export function leadingReachPair(node: GraphNode | undefined): ReachDomain[] {
  const caps = (node?.properties?.domainCapabilities ?? {}) as Partial<Record<ReachDomain, number>>;
  return REACH_DOMAINS
    .filter(r => typeof caps[r] === 'number' && (caps[r] as number) > 0)
    .sort((a, b) => (caps[b] as number) - (caps[a] as number) || REACH_DOMAINS.indexOf(a) - REACH_DOMAINS.indexOf(b))
    .slice(0, 2);
}

/**
 * The cell ids one mortal derives under one ambition category — registry-filtered,
 * sorted, deterministic. Empty for a mortal with no capabilities (an ambient one), which
 * is the division rule saying nothing rather than a failure.
 */
export function deriveDivisionCells(actor: GraphNode | undefined, category: AmbitionCategory): string[] {
  return deriveCells(VERBS_BY_CATEGORY[category] ?? [], leadingReachPair(actor));
}

/**
 * Rotate a list by a deterministic offset of the tick and the actor, so the per-actor
 * candidate cap does not starve the same cells every tick (the THR-1309 / THR-1388
 * list-position lesson). Same inputs, same order — no PRNG.
 */
export function rotateForTick<T>(items: readonly T[], tick: number, actorId: string): T[] {
  if (items.length === 0) return [];
  let h = 0;
  for (let i = 0; i < actorId.length; i++) h = (h * 31 + actorId.charCodeAt(i)) >>> 0;
  const offset = (tick + h) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}
