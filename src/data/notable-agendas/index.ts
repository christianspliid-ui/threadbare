/**
 * Notable Agenda Family registry (THR-630).
 *
 * Four non-military families (Claim / Feud / Rite / Succession) plus the
 * Campaign war hand-off — five in all, per the plan's §A family list.
 */
import type { NotableAgendaFamily } from './types';
import { CLAIM_FAMILY } from './claim';
import { FEUD_FAMILY } from './feud';
import { RITE_FAMILY } from './rite';
import { SUCCESSION_FAMILY } from './succession';
import { CAMPAIGN_FAMILY } from './campaign';

export type { NotableAgendaFamily, NotableAgendaBeat, NotableAgendaMoveKind } from './types';

export const NOTABLE_AGENDA_FAMILIES: NotableAgendaFamily[] = [
  CLAIM_FAMILY,
  FEUD_FAMILY,
  RITE_FAMILY,
  SUCCESSION_FAMILY,
  CAMPAIGN_FAMILY,
];

/** Look up a family by id (fail-soft: undefined for unknown ids). */
export function getNotableAgendaFamily(id: string): NotableAgendaFamily | undefined {
  return NOTABLE_AGENDA_FAMILIES.find((f) => f.id === id);
}
