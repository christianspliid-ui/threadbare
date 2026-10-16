import type { BalanceEncounterPoolCandidate, BalanceEvent } from '../../types/balanceEval';
import type { ActivityIndicatorKey } from '../HexMapV2/agents/activityIndicatorRegistry';

export interface GroupedEncounterPoolCandidate {
  key: string;
  primary: BalanceEncounterPoolCandidate;
  count: number;
  destinations: string[];
}

function normalizeEncounterType(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

function candidateDestination(candidate: BalanceEncounterPoolCandidate): string | null {
  return candidate.sublocationName ?? candidate.locationName ?? null;
}

// Moved to the view-model seam (THR-1822); re-exported for existing importers.
export { getSelectedEncounterPoolCandidate } from '../../engine/views/map/activityIcons';

export function getEncounterActivityIconKey(
  encounterType?: string,
  decisionType?: BalanceEvent['decisionType'],
): ActivityIndicatorKey {
  const normalized = normalizeEncounterType(encounterType);

  if (
    decisionType === 'queue_movement'
    || decisionType === 'forced_travel'
    || normalized.includes('explore')
    || normalized.includes('travel')
    || normalized.includes('patrol')
    || normalized.includes('scout')
    || normalized.includes('journey')
  ) {
    return 'boot';
  }

  if (
    normalized.includes('trade')
    || normalized.includes('market')
    || normalized.includes('bargain')
    || normalized.includes('commerce')
  ) {
    return 'coin';
  }

  if (
    normalized.includes('create')
    || normalized.includes('craft')
    || normalized.includes('build')
    || normalized.includes('repair')
    || normalized.includes('forge')
  ) {
    return 'hammer';
  }

  if (
    normalized.includes('assist')
    || normalized.includes('heal')
    || normalized.includes('recover')
    || normalized.includes('rest')
    || normalized.includes('care')
  ) {
    return 'bandage';
  }

  if (
    normalized.includes('duel')
    || normalized.includes('fight')
    || normalized.includes('battle')
    || normalized.includes('ambush')
    || normalized.includes('hunt')
    || normalized.includes('raid')
    || normalized.includes('defend')
    || normalized.includes('steal')
    || normalized.includes('confront')
  ) {
    return 'swords';
  }

  return 'hourglass';
}

export function groupEncounterPoolCandidates(
  candidates: BalanceEncounterPoolCandidate[],
): GroupedEncounterPoolCandidate[] {
  const grouped = new Map<string, GroupedEncounterPoolCandidate>();

  for (const candidate of candidates) {
    const key = candidate.templateId;
    const destination = candidateDestination(candidate);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        key,
        primary: candidate,
        count: 1,
        destinations: destination ? [destination] : [],
      });
      continue;
    }

    existing.count += 1;

    if (destination && !existing.destinations.includes(destination)) {
      existing.destinations.push(destination);
    }

    if (candidate.rank < existing.primary.rank) {
      existing.primary = candidate;
    }
    existing.primary.selected = existing.primary.selected || candidate.selected;
  }

  return [...grouped.values()].sort((a, b) => a.primary.rank - b.primary.rank);
}

