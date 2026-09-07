/**
 * The division rule's two tables (THR-1398, confirmed by Christian 2026-09-07):
 * an ambition **category picks the verbs** a mortal leans toward, a **Reach picks the
 * kinds** it can touch, and the intersection — kept to cells the registry has — is
 * the mortal's spread. Hand lists on an ambition's profile add on top, never replace.
 *
 * Tables verbatim from THR-1398's resolution, with the twelve amendments: dominion
 * gains use, discovery gains create and claim, legacy gains claim, vengeance gains
 * seize, survival takes raise and destroy for lower; seven Reach rows gained a kind so
 * every kind on the grid is reachable. Expected to drift as the library grows — an
 * override is the drift's first home, a table row its second.
 *
 * Two readers: the codex's *who tends to do it* (THR-1434, this file's first
 * consumer) and the candidate generator once the model flips (THR-1403). Both read
 * these rows; neither hand-lists a calling's cells.
 */

import type { ReachDomain } from '../types/traits';
import type { AmbitionCategory } from '../types/ambition';
import type { UndertakingObjectTypeId, UndertakingVerbVariant } from '../types/strategicAction';
import { cellTemplateId, getCellTemplate } from './undertaking-cells';
import { CALLING_ROWS, type CallingRow } from './calling-content';

/** The verbs an ambition category leans toward. */
export const VERBS_BY_CATEGORY: Readonly<Record<AmbitionCategory, readonly UndertakingVerbVariant[]>> = {
  dominion: ['control:claim', 'control:seize', 'use', 'create'],
  vengeance: ['destroy', 'change:lower', 'control:seize'],
  discovery: ['observe', 'create', 'control:claim'],
  devotion: ['change:raise', 'create', 'destroy'],
  mastery: ['create', 'use'],
  legacy: ['create', 'change:raise', 'control:claim'],
  survival: ['observe', 'change:raise', 'destroy'],
};

/** The kinds a Reach can touch. */
export const KINDS_BY_REACH: Readonly<Record<ReachDomain, readonly UndertakingObjectTypeId[]>> = {
  gold: ['item', 'route', 'place', 'location'],
  iron: ['army', 'company', 'location'],
  shadow: ['agreement', 'network', 'standing'],
  heart: ['standing', 'faction', 'company', 'companion'],
  eye: ['agreement', 'area'],
  veil: ['power', 'area', 'condition'],
  star: ['condition', 'faction', 'place', 'location'],
  stone: ['place', 'location', 'route', 'item'],
};

/** Every kind, for the Eye's observe-anything rider. */
export const ALL_UNDERTAKING_KINDS: readonly UndertakingObjectTypeId[] = [
  'area', 'location', 'place', 'route', 'faction', 'company', 'army', 'network', 'companion',
  'item', 'power', 'condition', 'agreement', 'standing',
];

/**
 * The cells a set of verbs and a pair of Reaches admit — the one join both readers
 * make. Registry-filtered (a cell the grid does not have is never derived), the
 * Eye's rider adds observe on every kind, sorted for determinism.
 */
export function deriveCells(
  verbs: readonly UndertakingVerbVariant[],
  reaches: readonly ReachDomain[],
): string[] {
  const kinds = new Set<UndertakingObjectTypeId>(reaches.flatMap(r => KINDS_BY_REACH[r] ?? []));
  const out = new Set<string>();
  for (const verb of verbs) for (const kind of kinds) {
    const id = cellTemplateId(verb, kind);
    if (getCellTemplate(id)) out.add(id);
  }
  if (reaches.includes('eye')) {
    for (const kind of ALL_UNDERTAKING_KINDS) {
      const id = cellTemplateId('observe', kind);
      if (getCellTemplate(id)) out.add(id);
    }
  }
  return [...out].sort();
}

/** A calling's derived spread: its ambition categories' verbs × its reach pair's kinds. */
export function cellsOfCalling(row: CallingRow): string[] {
  const verbs = [...new Set(row.ambitionCategories.flatMap(c => VERBS_BY_CATEGORY[c] ?? []))];
  const reaches = row.reachPair.filter((r): r is ReachDomain => r !== undefined);
  return deriveCells(verbs, reaches);
}

/** The callings whose derived spread includes a cell — *who tends to do it*, by title, sorted. */
export function callingsForCell(cellId: string): CallingRow[] {
  return CALLING_ROWS
    .filter(row => cellsOfCalling(row).includes(cellId))
    .sort((a, b) => a.title.localeCompare(b.title));
}
