/**
 * The Crossroads — road names (THR-1926).
 *
 * An encounter road reads by the THR-1852 resolver (`resolveEncounterDisplayName`,
 * never a template id); an undertaking road reads by its template's `displayName`, the
 * same words `summarizeActiveUndertakings` prints on the Journey tab (PC-6). Kept apart
 * from the pure `crossroads.ts` so the board's import of that module stays light.
 */

import type { CrossroadsIdentity } from './crossroads';
import { resolveEncounterDisplayName } from './premonitionCompulsion';
import { getStrategicTemplate } from './strategicActionCandidates';
import { CROSSROADS_UNNAMED_WORK_NOUN } from '../data/crossroads-content';

export function crossroadsRoadName(road: Pick<CrossroadsIdentity, 'family' | 'templateId'>): string {
  if (road.family === 'encounter') return resolveEncounterDisplayName(road.templateId);
  const name = getStrategicTemplate(road.templateId)?.displayName?.trim();
  return name && name !== road.templateId ? name : CROSSROADS_UNNAMED_WORK_NOUN;
}
