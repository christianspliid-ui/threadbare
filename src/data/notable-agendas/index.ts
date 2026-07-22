/**
 * Notable Agenda Family registry (THR-630).
 *
 * Four non-military families ship with seams A–B; the Campaign family (the
 * war hand-off) lands in seam C and registers here.
 */
import type { NotableAgendaFamily } from './types';
import { CLAIM_FAMILY } from './claim';
import { FEUD_FAMILY } from './feud';
import { RITE_FAMILY } from './rite';
import { SUCCESSION_FAMILY } from './succession';

export type { NotableAgendaFamily, NotableAgendaBeat, NotableAgendaMoveKind } from './types';

export const NOTABLE_AGENDA_FAMILIES: NotableAgendaFamily[] = [
  CLAIM_FAMILY,
  FEUD_FAMILY,
  RITE_FAMILY,
  SUCCESSION_FAMILY,
];

/** Look up a family by id (fail-soft: undefined for unknown ids). */
export function getNotableAgendaFamily(id: string): NotableAgendaFamily | undefined {
  return NOTABLE_AGENDA_FAMILIES.find((f) => f.id === id);
}
