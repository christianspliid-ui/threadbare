// Agency verdict — the pure half of the agency census (THR-2213; plan
// Docs/plans/2026-11-13-thr-2205-measure-whether-the-player-matters.md).
//
// Compares a hands-off arm with a played arm of the same seed on five headline
// outcomes, read at AGENCY_COMPARE_TICK (or the age's end, if sooner):
//   H1 which clock ended the age (Mandate / Doom / none) — or, both ended the same
//      way, an end tick at least AGENCY_END_TICK_DELTA apart
//   H2 the First's fate          H3 the Apotheosis
//   H4 Mandate progress ± AGENCY_MANDATE_DELTA            H5 Doom stage
// "The player mattered" on a seed when at least AGENCY_MIN_HEADLINE_DIFFS differ.
// It tests DIFFERENT, never better (Law 32).
//
// Kept free of engine imports so the unit test loads it without the world graph.

/* eslint-disable @typescript-eslint/no-explicit-any */

export const AGENCY_COMPARE_TICK = 800;     // the headline is read here (or at the age's end, if sooner)
export const AGENCY_MANDATE_DELTA = 0.10;   // Mandate progress gap that counts as different
export const AGENCY_END_TICK_DELTA = 90;    // one season: both ages ended, but this far apart
export const AGENCY_MIN_HEADLINE_DIFFS = 1; // headline differences for "the player mattered" on a seed

export interface AgencySnapshot {
  tick: number;
  phase: string;
  doomStage: number | string | null;
  mandateProgress: number;
  mandateCompleted: boolean;
  firstFate: string;
  apotheosis: boolean;
  firstChapterIds?: string[];
  bands?: Record<string, number>;
  essenceTotal?: number;
  [k: string]: unknown;
}

export interface AgencyArmResult {
  seed: number;
  arm: 'none' | 'greedy';
  ranTo: number;
  stopReason: string;
  heldSteps?: number;
  cardsPlayed?: number;
  end: AgencySnapshot;
  snaps?: AgencySnapshot[];
  [k: string]: unknown;
}

function readAt(r: AgencyArmResult, t: number): AgencySnapshot {
  const s = [...(r.snaps ?? []), r.end].filter(Boolean).filter((x) => x.tick <= t);
  return s.length ? s[s.length - 1] : r.end;
}

const endKind = (r: AgencyArmResult) =>
  (r.end.phase !== 'playing' ? (r.end.mandateCompleted ? 'mandate' : 'doom') : 'none');

export function agencyVerdict(none: AgencyArmResult, played: AgencyArmResult) {
  const a = readAt(none, AGENCY_COMPARE_TICK);
  const b = readAt(played, AGENCY_COMPARE_TICK);
  const diffs: string[] = [];
  const ek = [endKind(none), endKind(played)];
  if (ek[0] !== ek[1]) diffs.push(`ending ${ek[0]}→${ek[1]}`);
  else if (ek[0] !== 'none' && Math.abs(none.ranTo - played.ranTo) >= AGENCY_END_TICK_DELTA) diffs.push(`age end t${none.ranTo}→t${played.ranTo}`);
  if (a.firstFate !== b.firstFate) diffs.push(`First ${a.firstFate}→${b.firstFate}`);
  if (a.apotheosis !== b.apotheosis) diffs.push(`Apotheosis ${a.apotheosis}→${b.apotheosis}`);
  if (Math.abs(a.mandateProgress - b.mandateProgress) >= AGENCY_MANDATE_DELTA) diffs.push(`Mandate ${a.mandateProgress}→${b.mandateProgress}`);
  if (a.doomStage !== b.doomStage) diffs.push(`Doom stage ${a.doomStage}→${b.doomStage}`);
  const ids = (r: AgencyArmResult) => new Set<string>((r.end.firstChapterIds ?? []).map((x) => x.split(':')[0]));
  const ia = ids(none); const ib = ids(played);
  const inter = [...ia].filter((x) => ib.has(x)).length;
  const uni = new Set([...ia, ...ib]).size;
  return {
    seed: none.seed,
    at: Math.min(a.tick, b.tick),
    headlineDiffs: diffs.length,
    diffs,
    mattered: diffs.length >= AGENCY_MIN_HEADLINE_DIFFS,
    diagnostics: {
      chapterTemplateOverlap: uni ? Number((inter / uni).toFixed(2)) : 1,
      cardsPlayed: played.cardsPlayed,
      heldSteps: [none.heldSteps, played.heldSteps],
      essenceLeft: [a.essenceTotal, b.essenceTotal],
      bands: [a.bands, b.bands],
    },
  };
}

export type AgencyVerdict = ReturnType<typeof agencyVerdict>;

/** Why a pair cannot be compared, or null when it can (missing file, or an arm stopped on wall time). */
export function agencyNotMeasured(none: AgencyArmResult | null, played: AgencyArmResult | null): string | null {
  if (!none) return 'hands-off arm missing';
  if (!played) return 'played arm missing';
  if (none.stopReason === 'budget') return 'hands-off arm stopped on --budget-s';
  if (played.stopReason === 'budget') return 'played arm stopped on --budget-s';
  return null;
}

/** One printable report over seed pairs; `null` arms are "not measured". */
export function agencyReport(pairs: Array<{ seed: string | number; none: AgencyArmResult | null; played: AgencyArmResult | null }>): string[] {
  const lines: string[] = [];
  const measured: AgencyVerdict[] = [];
  for (const p of pairs) {
    const why = agencyNotMeasured(p.none, p.played);
    if (why) { lines.push(`seed ${p.seed}: not measured (${why})`); continue; }
    const v = agencyVerdict(p.none!, p.played!);
    measured.push(v);
    lines.push(JSON.stringify(v));
  }
  lines.push(`agency: the player mattered on ${measured.filter((r) => r.mattered).length}/${measured.length} measured seeds`
    + ` (${pairs.length - measured.length} not measured); headline differences ${measured.map((r) => r.headlineDiffs).join(',') || '-'}`);
  return lines;
}
