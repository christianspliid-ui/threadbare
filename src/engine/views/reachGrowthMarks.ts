/**
 * THR-2149 — what grew lately, read from the chapter archive for the person sheet.
 *
 * A clear gain (▲▲) is 0.05–0.20 on the raw reach, and the sheet's reach word is
 * one of five 0.2-wide tiers, so the Aftermath can say "Stone grew" while the tile
 * still reads "Subtle". This view finds the newest growth per reach within a time
 * window, so the tile can draw the Aftermath's own ▲ cluster beside its word and
 * the hover can say why the word did not move.
 *
 * Pure: reads `ChapterRecord.aftermathSummary` growth changes and writes nothing.
 * A time window, not a per-viewer "seen" flag — the same state draws the same
 * screen on reload (NFP #3). Plan: `Docs/plans/2026-11-02-thr-2143-the-sheet-says-what-grew.md` § E3.
 */

import type { ChapterRecord } from '../../types/chapterRecord';
import type { EncounterAftermathChange } from '../../types/unifiedAction';
import { REACH_DOMAINS, type ReachDomain } from '../../types/traits';
import { GROWTH_DELTA_CLUSTER_COLLAPSE } from '../aftermathWords';
import { TICKS_PER_DAY } from '../../data/attention-constants';

/** How long a reach tile shows a gain: three days (NFP #1). */
export const SHEET_GAIN_MARK_WINDOW_TICKS = 3 * TICKS_PER_DAY;

/** The band word a mark's step count reads as — the Aftermath legend's slight · clear · great. */
export const GAIN_MARK_BAND_WORDS: Readonly<Record<1 | 2 | 3, string>> = {
  1: 'slightly',
  2: 'clearly',
  3: 'greatly',
};

export interface ReachGrowthMark {
  readonly reach: ReachDomain;
  /** `slightly` / `clearly` / `greatly`; empty when the change carried no magnitude. */
  readonly band: string;
  readonly steps: 1 | 2 | 3;
  readonly chapterTitle: string;
  readonly resolvedTick: number;
}

/** One of the eight reaches (time and life have words but no reach). */
function isReach(raw: string): raw is ReachDomain {
  return (REACH_DOMAINS as readonly string[]).includes(raw);
}

/** The reach a growth change is about: its id suffix, then its tooltip id, then its noun. */
function growthReach(change: EncounterAftermathChange): ReachDomain | null {
  const fromId = /:growth:([a-z]+)$/.exec(change.id)?.[1];
  if (fromId && isReach(fromId)) return fromId;
  const tip = change.stateNoun?.tooltipId;
  if (tip?.startsWith('reach.')) {
    const raw = tip.slice('reach.'.length);
    if (isReach(raw)) return raw;
  }
  const text = change.stateNoun?.text?.toLowerCase();
  if (text && isReach(text)) return text;
  return null;
}

/** Ascending growth rung → drawn triangles, the same collapse the Aftermath chip uses. */
function stepsFor(change: EncounterAftermathChange): 1 | 2 | 3 {
  const m = change.magnitude;
  if (!m || m.ladder !== 'growth') return 1;
  const count = GROWTH_DELTA_CLUSTER_COLLAPSE[m.band] ?? 1;
  return (count >= 3 ? 3 : count <= 1 ? 1 : 2);
}

/**
 * Newest growth per reach for this actor within the window. Pure; archive order
 * breaks ties (a later record wins). An absent archive, a change with no readable
 * reach, or a record outside the window yields no mark — never a false one.
 */
export function recentReachGrowth(
  archive: readonly ChapterRecord[] | undefined,
  actorId: string,
  nowTick: number,
  windowTicks: number = SHEET_GAIN_MARK_WINDOW_TICKS,
): ReadonlyMap<ReachDomain, ReachGrowthMark> {
  const marks = new Map<ReachDomain, ReachGrowthMark>();
  if (!archive || !Number.isFinite(nowTick)) return marks;
  for (const record of archive) {
    const age = nowTick - record.resolvedTick;
    if (!(age >= 0 && age <= windowTicks)) continue;
    for (const change of record.aftermathSummary?.changes ?? []) {
      if (change.kind !== 'growth') continue;
      if ((change.subjectId ?? change.actorId ?? record.actorId) !== actorId) continue;
      const reach = growthReach(change);
      if (!reach) continue;
      const prior = marks.get(reach);
      if (prior && prior.resolvedTick > record.resolvedTick) continue;
      const steps = stepsFor(change);
      marks.set(reach, {
        reach,
        band: change.magnitude?.ladder === 'growth' ? GAIN_MARK_BAND_WORDS[steps] : '',
        steps,
        chapterTitle: record.templateName,
        resolvedTick: record.resolvedTick,
      });
    }
  }
  return marks;
}
