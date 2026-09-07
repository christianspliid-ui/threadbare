/**
 * PROTO THR-1402 — the division rule (THR-1398), as a throwaway derivation for the
 * two-seed census. Never merged: the shipped implementation is THR-1403's.
 *
 * A mortal's cells = verbs(ambition category) × kinds(the mortal's two leading Reaches),
 * kept to cells the registry has; Eye adds observe on every kind; hand lists are added
 * on top by the caller. Tables verbatim from THR-1398's resolution.
 */
import type { GraphNode } from '../types/graph';
import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import type { AmbitionCategory } from '../types/ambition';
import type { UndertakingObjectTypeId, UndertakingVerbVariant } from '../types/strategicAction';
import { cellTemplateId, getCellTemplate } from '../data/undertaking-cells';

const VERBS_BY_CATEGORY: Readonly<Record<AmbitionCategory, readonly UndertakingVerbVariant[]>> = {
  dominion: ['control:claim', 'control:seize', 'use', 'create'],
  vengeance: ['destroy', 'change:lower', 'control:seize'],
  discovery: ['observe', 'create', 'control:claim'],
  devotion: ['change:raise', 'create', 'destroy'],
  mastery: ['create', 'use'],
  legacy: ['create', 'change:raise', 'control:claim'],
  survival: ['observe', 'change:raise', 'destroy'],
};

const KINDS_BY_REACH: Readonly<Record<ReachDomain, readonly UndertakingObjectTypeId[]>> = {
  gold: ['item', 'route', 'place', 'location'],
  iron: ['army', 'company', 'location'],
  shadow: ['agreement', 'network', 'standing'],
  heart: ['standing', 'faction', 'company', 'companion'],
  eye: ['agreement', 'area'],
  veil: ['power', 'area', 'condition'],
  star: ['condition', 'faction', 'place', 'location'],
  stone: ['place', 'location', 'route', 'item'],
} as Record<ReachDomain, readonly UndertakingObjectTypeId[]>;

const ALL_KINDS: readonly UndertakingObjectTypeId[] = [
  'area', 'location', 'place', 'route', 'faction', 'company', 'army', 'network', 'companion',
  'item', 'power', 'condition', 'agreement', 'standing',
];

/** Same read `calling.ts` makes, duplicated here to avoid the import cycle through the candidates module. */
export function leadingReaches(node: GraphNode | undefined): ReachDomain[] {
  const caps = (node?.properties?.domainCapabilities ?? {}) as Partial<Record<ReachDomain, number>>;
  return REACH_DOMAINS
    .filter(r => typeof caps[r] === 'number' && (caps[r] as number) > 0)
    .sort((a, b) => (caps[b] as number) - (caps[a] as number) || REACH_DOMAINS.indexOf(a) - REACH_DOMAINS.indexOf(b))
    .slice(0, 2);
}

/** The derived cell ids for one mortal under one ambition category — registry-filtered, sorted, deterministic. */
export function deriveDivisionCells(actor: GraphNode | undefined, category: AmbitionCategory): string[] {
  const reaches = leadingReaches(actor);
  const verbs = VERBS_BY_CATEGORY[category] ?? [];
  const kinds = new Set<UndertakingObjectTypeId>(reaches.flatMap(r => KINDS_BY_REACH[r] ?? []));
  const out = new Set<string>();
  for (const verb of verbs) for (const kind of kinds) {
    const id = cellTemplateId(verb, kind);
    if (getCellTemplate(id)) out.add(id);
  }
  if (reaches.includes('eye')) {
    for (const kind of ALL_KINDS) {
      const id = cellTemplateId('observe', kind);
      if (getCellTemplate(id)) out.add(id);
    }
  }
  return [...out].sort();
}

/**
 * Rotate a list by a deterministic offset so the per-ambition candidate cap does not
 * starve the same cells every tick (the THR-1309 / THR-1388 list-position lesson —
 * a prototype lever; THR-1403 removes the cap for cells).
 */
export function rotateForTick<T>(items: readonly T[], tick: number, actorId: string): T[] {
  if (items.length === 0) return [];
  let h = 0;
  for (let i = 0; i < actorId.length; i++) h = (h * 31 + actorId.charCodeAt(i)) >>> 0;
  const offset = (tick + h) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}
