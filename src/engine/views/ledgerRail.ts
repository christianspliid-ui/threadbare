/**
 * ledgerRail — the Ledger rail's view model (THR-1893, frame plan § E1, § F7–F8).
 *
 * What the right rail shows besides Threads: the World-Soul line that heads the
 * Chronicle, the Chronicle's Now window and its year groups, the Ledger tab's
 * chapter rows, and the strip's three counts. Entry bodies stay `ChronicleEntry`
 * objects rendered by `ChronicleEntryCard`; this carries ids and groups, never
 * prose copies.
 *
 * The World-Soul banding moved here from `WorldSoulIndicator`, and the mood line from
 * World Pulse, which picked a line by `tick % 3` and so flickered every tick. The mood
 * is now one line per season: `(year × SEASONS_PER_YEAR + season) mod lines.length`.
 *
 * Pure and deterministic; no PRNG. A build that throws returns the fallback (empty
 * groups, no World-Soul line) through `readView`.
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | INTENSITY_WHISPER_MAX | 2 | Average dominant-sphere score under which the World-Soul whispers |
 * | INTENSITY_MURMUR_MAX  | 4 | … murmurs |
 * | INTENSITY_PULSE_MAX   | 6 | … pulses; at or above, it storms |
 */
import type { ViewSelector } from './readView';
import type { GameState } from '../../types/gameState';
import type { SphereName } from '../../types';
import type { SphereAggregate } from '../../types/worldSoul';
import { WORLD_SOUL_PROSE, type WorldSoulIntensity } from '../../data/worldSoulProse';
import {
  CHRONICLE_EMPTY_LINE,
  CHRONICLE_NOW_SEASONS,
  CHRONICLE_YEAR_GROUP,
  WORLD_MOOD_LINES,
  WORLD_SOUL_LABEL,
  countWords,
} from '../../data/frame-content';
import { SEASONS_PER_YEAR, deriveSeasonAndYear } from '../../types/temporal';
import { selectThreadedChapters } from '../threadedChapters';

export const INTENSITY_WHISPER_MAX = 2;
export const INTENSITY_MURMUR_MAX = 4;
export const INTENSITY_PULSE_MAX = 6;

export interface LedgerRailArgs {
  /** Chronicle entries counted when the Chronicle was last on screen. */
  seenChronicle: number;
  /** Threaded chapters counted when the ledger (tab or reader) was last seen. */
  seenLedger: number;
  /**
   * Threaded mortals whose row shows the "A chapter waits" pip — counted by the rail
   * with the pip's own predicate (`threadHasWaitingChapter`), so the strip and the
   * rows say one thing.
   */
  threadsWaiting: number;
  /**
   * The Chronicle, archive and live-action sizes, in the cache key only. Some writers
   * (an offering taken while the clock is held) append without `touchWorld`, so the
   * `world` counter alone would hand back a stale model (review gate, THR-1893).
   */
  contentStamp?: string;
}

export interface LedgerRailWorldSoul {
  label: string;
  /** The `WORLD_SOUL_PROSE` sentence, with its keyword markup for `renderProseWithIPK`. */
  sentence: string;
  /** The world's mood for this doom stage, stable within a season. */
  mood: string;
  sphere: SphereName | null;
}

export interface LedgerRailYear {
  /** The calendar year as the top bar shows it (1-based). */
  year: number;
  label: string;
  entryIds: string[];
}

export interface LedgerRailChapterRow {
  recordId: string;
  name: string;
  mortalId: string;
  mortalName: string;
  state: string;
  isNew: boolean;
}

export interface LedgerRailVM {
  worldSoul: LedgerRailWorldSoul | null;
  now: { entryIds: string[]; emptyLine: string | null };
  /** Newest year first; the Years tab renders only when there are two or more. */
  years: LedgerRailYear[];
  ledger: { rows: LedgerRailChapterRow[]; unread: number };
  strip: { threads: number; chronicle: number; ledger: number };
}

export function worldSoulIntensity(avgScore: number): WorldSoulIntensity {
  if (avgScore < INTENSITY_WHISPER_MAX) return 'whisper';
  if (avgScore < INTENSITY_MURMUR_MAX) return 'murmur';
  if (avgScore < INTENSITY_PULSE_MAX) return 'pulse';
  return 'storm';
}

/** The mood line for a doom stage in a given season; one line per season, never per tick. */
export function worldMoodLine(doomStage: number, year: number, season: number): string {
  const lines = WORLD_MOOD_LINES[doomStage] ?? WORLD_MOOD_LINES[0];
  const index = ((year * SEASONS_PER_YEAR + season) % lines.length + lines.length) % lines.length;
  return lines[index] ?? '';
}

function worldSoulLine(aggregate: SphereAggregate | undefined, state: GameState): LedgerRailWorldSoul | null {
  if (!aggregate || !aggregate.dominantSphere) return null;
  const dominant = aggregate.dominantSphere;
  const prose = WORLD_SOUL_PROSE[dominant];
  if (!prose) return null;
  const avg = aggregate.entityCount > 0 ? (aggregate.totalBySphere[dominant] ?? 0) / aggregate.entityCount : 0;
  return {
    label: WORLD_SOUL_LABEL,
    sentence: prose[worldSoulIntensity(avg)],
    mood: worldMoodLine(state.doomClock?.currentStage ?? 0, state.clock.year, state.clock.season),
    sphere: dominant,
  };
}

function seasonIndex(tick: number, ticksPerSeason: number): number {
  const { season, year } = deriveSeasonAndYear(tick, ticksPerSeason);
  return year * SEASONS_PER_YEAR + season;
}

export function buildLedgerRail(state: GameState, args: LedgerRailArgs): LedgerRailVM {
  const perSeason = state.clock.ticksPerSeason;
  const entries = [...(state.chronicleEntries ?? [])].reverse(); // newest first
  const currentSeason = seasonIndex(state.tick, perSeason);
  const firstNowSeason = currentSeason - (CHRONICLE_NOW_SEASONS - 1);

  const nowIds = entries.filter(e => seasonIndex(e.tick, perSeason) >= firstNowSeason).map(e => e.id);

  const byYear = new Map<number, string[]>();
  for (const e of entries) {
    const year = deriveSeasonAndYear(e.tick, perSeason).year + 1;
    const list = byYear.get(year);
    if (list) list.push(e.id);
    else byYear.set(year, [e.id]);
  }
  const years: LedgerRailYear[] = [...byYear.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, entryIds]) => ({ year, label: countWords(entryIds.length, CHRONICLE_YEAR_GROUP, { year }), entryIds }));

  const chapters = selectThreadedChapters(state, { withStakes: false });
  const unread = Math.max(0, chapters.length - Math.max(0, args.seenLedger));
  // A chapter joins the unread count when it begins, so the unread ones are the
  // `unread` latest to begin — never the top rows by position, because a live chapter
  // sorts above every resolved one (review gate, THR-1893). Ties keep the newest-first list order.
  const byArrival = chapters.map((r, i) => ({ key: r.key, startTick: r.startTick, i }))
    .sort((a, b) => b.startTick - a.startTick || a.i - b.i);
  const newKeys = new Set(byArrival.slice(0, unread).map(x => x.key));
  const rows: LedgerRailChapterRow[] = chapters.map((r) => ({
    recordId: r.key,
    name: r.templateName,
    mortalId: r.actorId,
    mortalName: r.actorName,
    state: r.statusLabel,
    isNew: newKeys.has(r.key),
  }));

  return {
    worldSoul: worldSoulLine(state.worldSoul?.aggregate, state),
    now: { entryIds: nowIds, emptyLine: nowIds.length === 0 ? CHRONICLE_EMPTY_LINE : null },
    years,
    ledger: { rows, unread },
    strip: {
      threads: Math.max(0, args.threadsWaiting),
      chronicle: Math.max(0, entries.length - Math.max(0, args.seenChronicle)),
      ledger: unread,
    },
  };
}

export function emptyLedgerRail(): LedgerRailVM {
  return {
    worldSoul: null,
    now: { entryIds: [], emptyLine: CHRONICLE_EMPTY_LINE },
    years: [],
    ledger: { rows: [], unread: 0 },
    strip: { threads: 0, chronicle: 0, ledger: 0 },
  };
}

export const ledgerRailSelector: ViewSelector<LedgerRailArgs, LedgerRailVM> = {
  id: 'ledgerRail',
  invalidation: 'world',
  key: (a) => `${a?.seenChronicle ?? 0}|${a?.seenLedger ?? 0}|${a?.threadsWaiting ?? 0}|${a?.contentStamp ?? ''}`,
  build: (ctx, a) => buildLedgerRail(ctx.state, {
    seenChronicle: a?.seenChronicle ?? 0,
    seenLedger: a?.seenLedger ?? 0,
    threadsWaiting: a?.threadsWaiting ?? 0,
  }),
  fallback: () => emptyLedgerRail(),
};
