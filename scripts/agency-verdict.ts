// Agency verdict — the pure half of the agency census (THR-2213; plan
// Docs/plans/2026-11-13-thr-2205-measure-whether-the-player-matters.md).
//
// THR-2243: the census also runs an `answer` arm (played, plus Stay the Unmaking and Rebuke);
// the report compares hands-off vs played and hands-off vs answer with the same verdict.
//
// Compares a hands-off arm with a played arm of the same seed on five headline
// outcomes, read at AGENCY_COMPARE_TICK (or the age's end, if sooner):
//   H1 which clock ended the age (Mandate / Doom / none) — or, both ended the same
//      way, an end tick at least AGENCY_END_TICK_DELTA apart
//   H2 the First's fate          H3 the Apotheosis
//   H4 Mandate progress ± AGENCY_MANDATE_DELTA            H5 Doom stage
//   H6 the Ordeal's outcome class   H7 the Apotheosis band (THR-2229, read at the end)
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
  /** THR-2243 — `answer` is the played arm that also holds Stay the Unmaking and Rebukes. */
  arm: 'none' | 'greedy' | 'answer';
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

interface OrdealRollRecord { luckDrawIndex?: number | null; leanDecisive?: boolean; outcome?: string }

const lastOrdeal = (r: AgencyArmResult): OrdealRollRecord | undefined => {
  const rolls = (r.ordealRolls as OrdealRollRecord[] | undefined) ?? [];
  return rolls[rolls.length - 1];
};

/**
 * THR-2229 — what moved an Ordeal difference between the arms. The arms reach the
 * Ordeal at different bag counts, so a different band is not by itself agency:
 *   'lean'     the played roll would have landed the other side at the bare chance,
 *              and both arms drew from the same bag position;
 *   'bag'      the bag position differs and the lean was not decisive;
 *   'lean+bag' both;
 *   'neither'  only one arm reached the Ordeal, or neither cause shows.
 */
export function ordealAttribution(none: AgencyArmResult, played: AgencyArmResult): 'lean' | 'bag' | 'lean+bag' | 'neither' {
  const a = lastOrdeal(none);
  const b = lastOrdeal(played);
  if (!a || !b) return 'neither';
  const bag = (a.luckDrawIndex ?? null) !== (b.luckDrawIndex ?? null);
  const lean = b.leanDecisive === true;
  return lean && bag ? 'lean+bag' : lean ? 'lean' : bag ? 'bag' : 'neither';
}

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
  // THR-2229 — H6 the Ordeal's outcome class, H7 the Apotheosis band, read at the end
  // (each is written once; the census reads the thread, else the god's death note on
  // its First, so a death does not read as "none"); and whether beat 2 reads differently.
  const ordealA = (none.end.ordealOutcome as string | null | undefined) ?? null;
  const ordealB = (played.end.ordealOutcome as string | null | undefined) ?? null;
  const apoA = (none.end.apotheosisBand as string | null | undefined) ?? null;
  const apoB = (played.end.apotheosisBand as string | null | undefined) ?? null;
  const h6 = ordealA !== ordealB;
  const h7 = apoA !== apoB;
  if (h6) diffs.push(`Ordeal ${ordealA ?? 'none'}→${ordealB ?? 'none'}`);
  if (h7) diffs.push(`Apotheosis band ${apoA ?? 'none'}→${apoB ?? 'none'}`);
  const beat2A = (none.end.beat2 as string | null | undefined) ?? null;
  const beat2B = (played.end.beat2 as string | null | undefined) ?? null;
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
    h6,
    h7,
    /** What moved an H6 difference: the lean, the bag position, both, or neither (null when H6 holds). */
    h6MovedBy: h6 ? ordealAttribution(none, played) : null,
    beat2Differs: beat2A !== beat2B,
    beat2: { none: beat2A, played: beat2B },
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

export const AGENCY_BEAT2_MIN_SEEDS = 2;   // seeds whose beat 2 must differ between arms
export const AGENCY_OUTCOME_MIN_SEEDS = 1; // seeds whose H6 or H7 must differ

/**
 * THR-2229 — the played-vs-unplayed predicate: beat 2 differs on at least
 * AGENCY_BEAT2_MIN_SEEDS seeds, and H6 or H7 on at least AGENCY_OUTCOME_MIN_SEEDS.
 */
export function agencyEndingPredicate(verdicts: AgencyVerdict[]) {
  const beat2Differs = verdicts.filter((v) => v.beat2Differs).length;
  const outcomeDiffers = verdicts.filter((v) => v.h6 || v.h7).length;
  return {
    beat2Differs,
    outcomeDiffers,
    holds: beat2Differs >= AGENCY_BEAT2_MIN_SEEDS && outcomeDiffers >= AGENCY_OUTCOME_MIN_SEEDS,
  };
}

/** Why a pair cannot be compared, or null when it can (missing file, or an arm stopped on wall time). */
export function agencyNotMeasured(none: AgencyArmResult | null, played: AgencyArmResult | null): string | null {
  if (!none) return 'hands-off arm missing';
  if (!played) return 'played arm missing';
  if (none.stopReason === 'budget') return 'hands-off arm stopped on --budget-s';
  if (played.stopReason === 'budget') return 'played arm stopped on --budget-s';
  return null;
}

/**
 * THR-2243 — what the answer arm did with the two clock verbs: whether each card was ever
 * held (received through its milestone gift), how often each was cast, how many ticks
 * Stay was held, and Doom progress at the compare tick beside the hands-off arm's.
 * Missing counters (an arm written before THR-2243) read as 0 / false. THR-2244 adds the
 * clean/crooked Stay landing split when the arm recorded it.
 */
export function answerArmLine(seed: string | number, none: AgencyArmResult, answer: AgencyArmResult): string {
  const num = (k: string) => (typeof answer[k] === 'number' ? (answer[k] as number) : 0);
  const doom = (r: AgencyArmResult) => (readAt(r, AGENCY_COMPARE_TICK).doomProgress as number | undefined) ?? null;
  return `seed ${seed} answer arm: stayHeld:${answer.stayHeld === true} rebukeHeld:${answer.rebukeHeld === true}`
    + ` Stay casts ${num('stayCasts')}, Rebukes cast ${num('rebukeCasts')}, ticks Stay held ${num('stayHeldTicks')},`
    + ` Doom progress at t${AGENCY_COMPARE_TICK} ${doom(answer) ?? '?'} (hands-off ${doom(none) ?? '?'})`
    // THR-2244: clean vs crooked Stay landings, only for arms that recorded them.
    + (typeof answer.stayCleanLandings === 'number'
      ? `; Stay landed clean ${num('stayCleanLandings')} / crooked ${num('stayCrookedLandings')} (held ticks clean ${num('stayCleanTicks')} / crooked ${num('stayCrookedTicks')})`
      : '')
    + (answer.stayGiftLostAt ? `; Stay gift lost: ${String(answer.stayGiftLostAt)}` : '')
    + (answer.rebukeGiftLostAt ? `; Rebuke gift lost: ${String(answer.rebukeGiftLostAt)}` : '');
}

/** The KPI and ending lines for one comparison (hands-off vs `label`). */
function comparisonSummary(label: string, measured: AgencyVerdict[], notMeasured: number): string[] {
  const lines: string[] = [];
  lines.push(`agency (hands-off vs ${label}): the player mattered on ${measured.filter((r) => r.mattered).length}/${measured.length} measured seeds`
    + ` (${notMeasured} not measured); headline differences ${measured.map((r) => r.headlineDiffs).join(',') || '-'}`);
  // THR-2229 — the ending, per arm, and the played-vs-unplayed predicate (plan THR-2204 slice 4).
  for (const v of measured) {
    lines.push(`seed ${v.seed} beat 2, hands-off: ${v.beat2.none ?? '(no First)'}`);
    lines.push(`seed ${v.seed} beat 2, ${label}: ${v.beat2.played ?? '(no First)'}`);
  }
  const p = agencyEndingPredicate(measured);
  lines.push(`ending (hands-off vs ${label}): beat 2 differs on ${p.beat2Differs}/${measured.length} seeds; H6 or H7 differs on ${p.outcomeDiffers}`
    + ` (H6 moved by ${measured.filter((v) => v.h6).map((v) => `${v.seed}:${v.h6MovedBy}`).join(',') || '-'})`
    + ` → predicate ${p.holds ? 'HOLDS' : 'NOT MET'}`);
  return lines;
}

/**
 * One printable report over seed pairs; `null` arms are "not measured". A pair that
 * carries an `answer` key (THR-2243, even `null`) is also compared hands-off vs answer,
 * with its own KPI and ending lines and one answer-arm line per seed.
 */
export function agencyReport(pairs: Array<{
  seed: string | number; none: AgencyArmResult | null; played: AgencyArmResult | null; answer?: AgencyArmResult | null;
}>): string[] {
  const lines: string[] = [];
  const measured: AgencyVerdict[] = [];
  const answered: AgencyVerdict[] = [];
  const withAnswer = pairs.filter((p) => p.answer !== undefined);
  const answerLines: string[] = [];
  for (const p of pairs) {
    const why = agencyNotMeasured(p.none, p.played);
    if (why) lines.push(`seed ${p.seed}: not measured (${why})`);
    else {
      const v = agencyVerdict(p.none!, p.played!);
      measured.push(v);
      lines.push(JSON.stringify({ vs: 'played', ...v }));
    }
    if (p.answer === undefined) continue;
    const whyAnswer = agencyNotMeasured(p.none, p.answer);
    if (whyAnswer) { lines.push(`seed ${p.seed} vs answer: not measured (${whyAnswer.replace('played arm', 'answer arm')})`); continue; }
    const va = agencyVerdict(p.none!, p.answer!);
    answered.push(va);
    lines.push(JSON.stringify({ vs: 'answer', ...va }));
    answerLines.push(answerArmLine(p.seed, p.none!, p.answer!));
  }
  lines.push(...comparisonSummary('played', measured, pairs.length - measured.length));
  if (withAnswer.length) {
    lines.push(...comparisonSummary('answer', answered, withAnswer.length - answered.length));
    lines.push(...answerLines);
  }
  return lines;
}
