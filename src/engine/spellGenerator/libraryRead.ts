/**
 * Reading a tradition's library back off the graph (THR-1572), kept apart from the
 * generator so a reader — the grant seam (THR-1672) — imports this and nothing of the
 * generator, exactly as the cast resolver imports `notice.ts`.
 */

import type { WorldGraph } from '../graph';
import type { SpellTemplate } from '../../types/effects';
import type { GeneratedSpellProvenance } from './types';

/** Sort a library the way seeding and learning read it: tier, then id (NFP #3). */
export function sortLibrary<T extends Pick<SpellTemplate, 'tier' | 'id'>>(spells: readonly T[]): T[] {
  return [...spells].sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id));
}

/** A tradition's generated spells, read back off the graph, by tier then id. */
export function getTraditionLibrary(graph: WorldGraph, traditionId: string): SpellTemplate[] {
  const out: SpellTemplate[] = [];
  for (const n of graph.getNodesByType('trait')) {
    if (n.properties.subcategory !== 'spell' || n.properties.origin !== 'generated') continue;
    const prov = n.properties.generated as Partial<GeneratedSpellProvenance> | undefined;
    const template = n.properties.template as SpellTemplate | undefined;
    if (prov?.traditionId === traditionId && template) out.push(template);
  }
  return sortLibrary(out);
}
