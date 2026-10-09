/**
 * Premonition steer — how a paid God's Will choice reaches The First's decision (THR-1781).
 *
 * Two readers the premonition writers (`premonitionActions.ts`) never had:
 *
 * - **Whisper pull.** A whisper writes a `DivineInfluenceEntry` tagged `whisper_*`.
 *   `computeWhisperPull` turns the live ones into a per-candidate multiplier, and
 *   `applyWhisperPull` folds it into the decision — onto `finalScore` for the legacy
 *   pick and onto the candidate as `whisperPull`, which the live board multiplies in
 *   (the board never reads `finalScore`; see `appointmentDiscount` for the same shape).
 * - **Compulsion resolution.** A compulsion is held on the mortal until its next full
 *   decision (`resolveCompulsion`), not three ticks after the click — the mortal is
 *   usually mid-chapter when the player pays. It is then taken (from the board's
 *   top five, or pulled up from the full ranked list) or lapsed with a reason.
 *
 * Pure functions over plain data (NFP #2). Every outcome has a player-facing line
 * (`compulsionOutcomeMessage`) so a paid steer is never silent.
 */

import type { DivineInfluenceEntry } from '../types/dream';
import type { EncounterCacheEntry } from './encounterCache';
import type { ScoredCandidate } from './encounterScoring';
import { getCurrentStrength } from './decayCurve';
import { WHISPER_PULL_SCALE, COMPULSION_HOLD_MAX_TICKS } from '../data/premonition-constants';

// ─── Whisper pull ───────────────────────────────────────────────

/** Tag prefix every whisper influence carries (`premonitionActions.applyWhisperChoice`). */
export const WHISPER_TAG_PREFIX = 'whisper_';

const LOW_THREAT = new Set(['trivial', 'easy']);
const HIGH_THREAT = new Set(['hard', 'deadly']);

/** Does this whisper influence lean toward this encounter? */
export function whisperMatchesEntry(
  influence: DivineInfluenceEntry,
  entry: Pick<EncounterCacheEntry, 'reachPrimary' | 'sphereAffinity' | 'threatRating'>,
): boolean {
  const tag = influence.behaviorTag ?? '';
  if (!tag.startsWith(WHISPER_TAG_PREFIX)) return false;
  // The tag decides, never `reachBoost` alone: a gather-strength whisper also carries
  // a Gold `reachBoost`, and reading that first would pull a resting mortal toward a
  // deadly Gold encounter.
  if (tag.startsWith('whisper_reach_')) {
    return (influence.reachBoost?.reach ?? tag.slice('whisper_reach_'.length)) === entry.reachPrimary;
  }
  if (tag.startsWith('whisper_sphere_')) {
    return entry.sphereAffinity !== undefined && tag.slice('whisper_sphere_'.length) === entry.sphereAffinity;
  }
  if (tag === 'whisper_gather_strength') return LOW_THREAT.has(entry.threatRating);
  if (tag === 'whisper_gather_courage') return HIGH_THREAT.has(entry.threatRating);
  return false;
}

/**
 * The board multiplier the live whispers put on one encounter: `1 + scale × Σ strength`
 * over the matching, unexpired whisper influences. 1 when nothing matches.
 */
export function computeWhisperPull(
  influences: readonly DivineInfluenceEntry[],
  entry: Pick<EncounterCacheEntry, 'reachPrimary' | 'sphereAffinity' | 'threatRating'>,
  tick: number,
): number {
  let strength = 0;
  for (const influence of influences) {
    if (!whisperMatchesEntry(influence, entry)) continue;
    strength += getCurrentStrength(influence, tick);
  }
  return strength > 0 ? 1 + WHISPER_PULL_SCALE * strength : 1;
}

/** True when the mortal carries at least one unexpired whisper. Cheap pre-check. */
export function hasLiveWhisper(influences: readonly DivineInfluenceEntry[], tick: number): boolean {
  return influences.some(i => (i.behaviorTag ?? '').startsWith(WHISPER_TAG_PREFIX)
    && getCurrentStrength(i, tick) > 0);
}

interface DecisionLists {
  rankedCandidates: ScoredCandidate[];
  topCandidates: ScoredCandidate[];
  selected: ScoredCandidate | null;
}

/**
 * Fold live whispers into a decision, in place. Matching candidates get
 * `whisperPull` and a scaled `finalScore`; the ranked list is re-sorted and the top
 * list re-cut from it at its original size, so a whispered encounter ranked just
 * outside the scorer's five can reach the board. A legacy selection follows the new
 * leader when it clears `idleThreshold`. Returns how many candidates were pulled.
 */
export function applyWhisperPull(
  decision: DecisionLists,
  influences: readonly DivineInfluenceEntry[],
  tick: number,
  idleThreshold: number,
): number {
  if (!hasLiveWhisper(influences, tick)) return 0;
  let pulled = 0;
  const reweigh = (c: ScoredCandidate): ScoredCandidate => {
    const pull = computeWhisperPull(influences, c.entry, tick);
    if (pull <= 1) return c;
    pulled++;
    return { ...c, finalScore: c.finalScore * pull, whisperPull: pull };
  };
  const ranked = decision.rankedCandidates.map(reweigh).sort((a, b) => b.finalScore - a.finalScore);
  if (pulled === 0) return 0;
  const topSize = decision.topCandidates.length;
  decision.rankedCandidates = ranked;
  decision.topCandidates = ranked.slice(0, topSize);
  if (decision.selected) {
    const top = ranked[0] ?? null;
    decision.selected = top && top.finalScore >= idleThreshold ? top : decision.selected;
  }
  return pulled;
}

// ─── Compulsion resolution ──────────────────────────────────────

export type CompulsionLapseReason = 'expired' | 'unavailable';

export type CompulsionResolution =
  | { kind: 'none' }
  | { kind: 'taken'; candidate: ScoredCandidate; pulledFromRanked: boolean }
  | { kind: 'lapsed'; reason: CompulsionLapseReason };

/**
 * Resolve a held compulsion at a full decision. `topCandidates` may be extended in
 * place when the target is found only in the ranked list (the board decides from the
 * top list alone, so the target has to be on it to be chosen).
 */
export function resolveCompulsion(
  decision: Pick<DecisionLists, 'rankedCandidates' | 'topCandidates'>,
  targetTemplateId: string | undefined,
  targetLocationId: string | undefined,
  compulsionTick: number,
  tick: number,
): CompulsionResolution {
  if (!targetTemplateId) return { kind: 'none' };
  if (tick - compulsionTick > COMPULSION_HOLD_MAX_TICKS) return { kind: 'lapsed', reason: 'expired' };
  const exact = (list: readonly ScoredCandidate[]): ScoredCandidate | undefined =>
    targetLocationId
      ? list.find(c => c.entry.templateId === targetTemplateId && c.entry.locationId === targetLocationId)
      : undefined;
  const anyPlace = (list: readonly ScoredCandidate[]): ScoredCandidate | undefined =>
    list.find(c => c.entry.templateId === targetTemplateId);
  // The paid instance first — on the board, then pulled up from the ranked list —
  // and only then the same template at another place.
  const take = (candidate: ScoredCandidate, fromRanked: boolean): CompulsionResolution => {
    if (fromRanked) decision.topCandidates = [...decision.topCandidates, candidate];
    return { kind: 'taken', candidate, pulledFromRanked: fromRanked };
  };
  const exactTop = exact(decision.topCandidates);
  if (exactTop) return take(exactTop, false);
  const exactRanked = exact(decision.rankedCandidates);
  if (exactRanked) return take(exactRanked, true);
  const looseTop = anyPlace(decision.topCandidates);
  if (looseTop) return take(looseTop, false);
  const looseRanked = anyPlace(decision.rankedCandidates);
  if (looseRanked) return take(looseRanked, true);
  return { kind: 'lapsed', reason: 'unavailable' };
}

/** The player-facing line for a resolved compulsion. */
export function compulsionOutcomeMessage(
  agentName: string,
  encounterName: string,
  resolution: CompulsionResolution,
): string | null {
  switch (resolution.kind) {
    case 'taken':
      return `Your will holds: ${agentName} turns to ${encounterName}.`;
    case 'lapsed':
      return resolution.reason === 'expired'
        ? `Your will fades: ${agentName} never came free to answer ${encounterName}.`
        : `Your will finds no purchase: ${encounterName} is beyond ${agentName}'s reach now.`;
    default:
      return null;
  }
}
