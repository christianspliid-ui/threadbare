/**
 * Notable Agenda Family registry (THR-630).
 *
 * Seam A ships the Claim family; Feud / Rite-Work / Succession / Campaign
 * land in later seams of THR-630 and register here.
 */
import type { NotableAgendaFamily } from './types';
import { CLAIM_FAMILY } from './claim';

export type { NotableAgendaFamily, NotableAgendaBeat, NotableAgendaMoveKind } from './types';

export const NOTABLE_AGENDA_FAMILIES: NotableAgendaFamily[] = [CLAIM_FAMILY];

/** Look up a family by id (fail-soft: undefined for unknown ids). */
export function getNotableAgendaFamily(id: string): NotableAgendaFamily | undefined {
  return NOTABLE_AGENDA_FAMILIES.find((f) => f.id === id);
}
