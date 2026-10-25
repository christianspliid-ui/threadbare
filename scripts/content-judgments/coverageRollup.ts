/**
 * Encounter coverage rollup (THR-1723, plan Decisions 3–5).
 *
 * Pure functions over the persisted artifact: the row shape, cache reuse, the threshold
 * rule, the grids, the finding classes, the new/resolved diff and the markdown report.
 * No network, no clock, no PRNG — the runner supplies the answers and the timestamps.
 *
 * A judgment is a worklist, never a verdict (content-judgments rule 2): nothing here edits
 * a catalog, applies a tag or files a ticket.
 */
import { REACH_DOMAINS } from '../../src/types/traits';
import { SPHERE_NAMES } from '../../src/types/index';
import {
  ACTIVITY_TAGS,
  CALIBRATION_MIN_ADMITTED_SHARE,
  CALIBRATION_SAMPLE_PER_REACH,
  CALIBRATION_STEP,
  CALIBRATION_TARGET_AGREEMENT,
  COVERAGE_THIN_CELL,
  CALIBRATED_ACTIVITY_CONFIDENCE,
  CALIBRATED_AT,
  CALIBRATED_REACH_CONFIDENCE,
  CALIBRATED_SPHERE_YES,
  CALIBRATED_TAG_FIT_NO,
  CALIBRATED_WALK_OF_LIFE_CONFIDENCE,
  DEFAULT_CHOICE_CONFIDENCE,
  DEFAULT_SPHERE_YES,
  DEFAULT_TAG_FIT_NO,
  NO_MATCH_OPTION,
  NO_MATCH_SHARE_FLAG,
  PROBABILITY_DECIMALS,
  WALK_OF_LIFE_TAGS,
} from './constants';
import { fnv1a, type DeclaredLabels } from './encounterState';
import { tagFitQuestionId } from './encounterQuestions';
import type { JevAnswer } from './jevClient';

// ─── Shapes ─────────────────────────────────────────────────────────

export type ChoiceAxis = 'reach' | 'activity' | 'walk_of_life';

export interface PersistedAnswer {
  choice?: string;
  noul?: number;
  probabilities?: Record<string, number>;
  confidence?: number;
}

export interface EncounterJudgmentRow {
  id: string;
  contentHash: string;
  truncated: boolean;
  declared: DeclaredLabels;
  answers: Record<string, PersistedAnswer>;
  orderSensitive: { reach: boolean; activity: boolean };
  error?: string;
}

/** `null` on an axis means uncalibrated: every answer on it routes to review. */
export interface CoverageThresholds {
  reach: number | null;
  activity: number | null;
  walkOfLife: number | null;
  sphereYes: number | null;
  tagFitNo: number | null;
  calibratedAt: string | null;
}

export interface CoverageUsage {
  requests: number;
  inputTokens: number;
  usdEstimate: number;
  wallSeconds: number;
  reusedRows: number;
}

export interface ThresholdTableRow {
  c: number;
  admitted: number;
  admittedShare: number;
  agreement: number;
}

/** The blind reader's labels for one sample entry (slice B writes these). */
export interface CalibrationLabel {
  id: string;
  reach: string;
  activity: string;
  walk_of_life: string;
  spheres: Record<string, boolean>;
  /** Optional: per worn family tag, does the entry earn it? */
  tagFit?: Record<string, boolean>;
}

export interface CalibrationBlock {
  reader: string;
  readerPrompt: string;
  sampleIds: string[];
  labels: CalibrationLabel[];
  tables: Record<string, ThresholdTableRow[]>;
}

export interface EncounterCoverageArtifact {
  schema: 1;
  questionsVersion: number;
  model: string;
  doctrine: string;
  ranAt: string;
  sourceCommit: string;
  partial: boolean;
  coldStart: boolean;
  usage: CoverageUsage;
  thresholds: CoverageThresholds;
  questions: Record<string, unknown>;
  rows: EncounterJudgmentRow[];
  calibration: CalibrationBlock | null;
}

export const PLACEHOLDER_THRESHOLDS: CoverageThresholds = {
  reach: DEFAULT_CHOICE_CONFIDENCE,
  activity: DEFAULT_CHOICE_CONFIDENCE,
  walkOfLife: DEFAULT_CHOICE_CONFIDENCE,
  sphereYes: DEFAULT_SPHERE_YES,
  tagFitNo: DEFAULT_TAG_FIT_NO,
  calibratedAt: null,
};

/** The committed calibration (THR-1850): applies to a run answered on `JEV_MODEL` with nothing carried. */
export const CALIBRATED_THRESHOLDS: CoverageThresholds = {
  reach: CALIBRATED_REACH_CONFIDENCE,
  activity: CALIBRATED_ACTIVITY_CONFIDENCE,
  walkOfLife: CALIBRATED_WALK_OF_LIFE_CONFIDENCE,
  sphereYes: CALIBRATED_SPHERE_YES,
  tagFitNo: CALIBRATED_TAG_FIT_NO,
  calibratedAt: CALIBRATED_AT,
};

// ─── Rows ───────────────────────────────────────────────────────────

const round = (n: number) => Number(n.toFixed(PROBABILITY_DECIMALS));

function persistAnswer(answer: JevAnswer): PersistedAnswer {
  if (answer.type === 'noul') return { noul: round(answer.noul) };
  const probabilities: Record<string, number> = {};
  for (const [k, v] of Object.entries(answer.probabilities ?? {})) probabilities[k] = round(v);
  return { choice: answer.choice, probabilities, confidence: round(answer.confidence) };
}

/** Build a persisted row from one response's answers. */
export function rowFromAnswers(
  base: Pick<EncounterJudgmentRow, 'id' | 'contentHash' | 'truncated' | 'declared'>,
  answers: Readonly<Record<string, JevAnswer>>,
): EncounterJudgmentRow {
  const persisted: Record<string, PersistedAnswer> = {};
  for (const [qid, answer] of Object.entries(answers)) persisted[qid] = persistAnswer(answer);
  const differs = (a: string, b: string) =>
    persisted[a]?.choice !== undefined && persisted[b]?.choice !== undefined
    && persisted[a].choice !== persisted[b].choice;
  return {
    ...base,
    answers: persisted,
    orderSensitive: { reach: differs('reach', 'reach_rev'), activity: differs('activity', 'activity_rev') },
  };
}

/** A row kept for a failed request: answers empty, the error recorded. */
export function errorRow(
  base: Pick<EncounterJudgmentRow, 'id' | 'contentHash' | 'truncated' | 'declared'>,
  error: string,
): EncounterJudgmentRow {
  return { ...base, answers: {}, orderSensitive: { reach: false, activity: false }, error };
}

/**
 * The previous run's row for this entry, when `(contentHash, questionsVersion, model)` all
 * match and the row did not error. Anything else re-asks.
 */
export function reusableRow(
  previous: EncounterCoverageArtifact | null,
  id: string,
  contentHash: string,
  questionsVersion: number,
  model: string,
): EncounterJudgmentRow | null {
  if (!previous || previous.questionsVersion !== questionsVersion || previous.model !== model) return null;
  const row = previous.rows.find(r => r.id === id);
  if (!row || row.error || row.contentHash !== contentHash) return null;
  return row;
}

// ─── Reading an axis ────────────────────────────────────────────────

export interface AxisReading {
  choice: string | null;
  confidence: number;
  orderSensitive: boolean;
}

/** The axis answer: the mean of a `_rev` pair where one exists, else the single answer. */
export function readAxis(row: EncounterJudgmentRow, axis: ChoiceAxis): AxisReading {
  const fwd = row.answers[axis];
  if (!fwd || fwd.choice === undefined) return { choice: null, confidence: 0, orderSensitive: false };
  if (axis === 'walk_of_life') {
    return { choice: fwd.choice, confidence: fwd.confidence ?? 0, orderSensitive: false };
  }
  const rev = row.answers[`${axis}_rev`];
  const orderSensitive = row.orderSensitive[axis];
  if (!rev?.probabilities || !fwd.probabilities) {
    return { choice: fwd.choice, confidence: fwd.confidence ?? 0, orderSensitive };
  }
  const keys = new Set([...Object.keys(fwd.probabilities), ...Object.keys(rev.probabilities)]);
  let best: string | null = null;
  let bestP = -1;
  for (const k of [...keys].sort()) {
    const p = ((fwd.probabilities[k] ?? 0) + (rev.probabilities[k] ?? 0)) / 2;
    if (p > bestP) { best = k; bestP = p; }
  }
  const confidence = ((fwd.confidence ?? 0) + (rev.confidence ?? 0)) / 2;
  return { choice: best, confidence: round(confidence), orderSensitive };
}

function axisThreshold(t: CoverageThresholds, axis: ChoiceAxis): number | null {
  return axis === 'reach' ? t.reach : axis === 'activity' ? t.activity : t.walkOfLife;
}

/** A confident reading: calibrated axis, at or above threshold, not order-sensitive. */
export function confidentChoice(
  row: EncounterJudgmentRow,
  axis: ChoiceAxis,
  t: CoverageThresholds,
): string | null {
  const threshold = axisThreshold(t, axis);
  if (threshold === null || row.error) return null;
  const r = readAxis(row, axis);
  if (r.choice === null || r.orderSensitive || r.confidence < threshold) return null;
  return r.choice;
}

// ─── Calibration (Decision 5) ───────────────────────────────────────

/** Candidate thresholds on the grid, as exact decimals (no float drift). */
function candidates(from: number, to: number): number[] {
  const steps = Math.round(1 / CALIBRATION_STEP);
  const out: number[] = [];
  for (let i = Math.round(from * steps); i <= Math.round(to * steps); i++) out.push(i / steps);
  return out;
}

function qualifies(row: ThresholdTableRow): boolean {
  return row.admittedShare >= CALIBRATION_MIN_ADMITTED_SHARE && row.agreement >= CALIBRATION_TARGET_AGREEMENT;
}

/**
 * The lowest confidence `c` at which agreement among admitted sample answers (confidence
 * ≥ c, not order-sensitive) reaches the target, with at least the minimum share admitted.
 * `null` when no `c` qualifies — the axis is uncalibrated.
 */
export function chooseChoiceThreshold(
  samples: ReadonlyArray<{ confidence: number; orderSensitive: boolean; agrees: boolean }>,
): { threshold: number | null; table: ThresholdTableRow[] } {
  const table = candidates(0, 1).map(c => {
    const admitted = samples.filter(s => !s.orderSensitive && s.confidence >= c);
    const agree = admitted.filter(s => s.agrees).length;
    return {
      c,
      admitted: admitted.length,
      admittedShare: samples.length ? round(admitted.length / samples.length) : 0,
      agreement: admitted.length ? round(agree / admitted.length) : 0,
    };
  });
  return { threshold: table.find(qualifies)?.c ?? null, table };
}

/**
 * The same rule for a yes/no Noul: at cut `c` (from 0.5 up) an answer is admitted when it
 * is confident either way (`noul ≥ c` reads yes, `noul ≤ 1 − c` reads no), and agreement is
 * measured against the reader's yes/no among the admitted.
 */
export function chooseNoulThreshold(
  samples: ReadonlyArray<{ noul: number; label: boolean }>,
): { threshold: number | null; table: ThresholdTableRow[] } {
  const table = candidates(0.5, 1).map(c => {
    const admitted = samples.filter(s => s.noul >= c || s.noul <= round(1 - c));
    const agree = admitted.filter(s => (s.noul >= c) === s.label).length;
    return {
      c,
      admitted: admitted.length,
      admittedShare: samples.length ? round(admitted.length / samples.length) : 0,
      agreement: admitted.length ? round(agree / admitted.length) : 0,
    };
  });
  return { threshold: table.find(qualifies)?.c ?? null, table };
}

/**
 * The deterministic calibration sample: per declared Reach of the Eight, the first
 * `perReach` ids by FNV-1a hash (id as tie-break). No PRNG.
 */
export function selectCalibrationSample(
  rows: ReadonlyArray<{ id: string; declared: { reach: string } }>,
  perReach: number = CALIBRATION_SAMPLE_PER_REACH,
): string[] {
  const out: string[] = [];
  for (const reach of REACH_DOMAINS) {
    const ids = rows.filter(r => r.declared.reach === reach).map(r => r.id);
    ids.sort((a, b) => fnv1a(a).localeCompare(fnv1a(b)) || a.localeCompare(b));
    out.push(...ids.slice(0, perReach));
  }
  return out;
}

/**
 * Why a parsed labels file cannot be used, or `null` when it can. Checked before any paid
 * call, so a malformed file costs nothing.
 */
export function calibrationLabelsProblem(labels: unknown): string | null {
  if (!Array.isArray(labels)) return 'expected a JSON array of labels';
  for (const [i, l] of labels.entries()) {
    const label = l as Partial<CalibrationLabel> | null;
    if (!label || typeof label !== 'object') return `label ${i} is not an object`;
    for (const key of ['id', 'reach', 'activity', 'walk_of_life'] as const) {
      if (typeof label[key] !== 'string') return `label ${i} has no string '${key}'`;
    }
    if (!label.spheres || typeof label.spheres !== 'object') return `label ${i} has no 'spheres' object`;
    if (label.tagFit !== undefined && (label.tagFit === null || typeof label.tagFit !== 'object')) {
      return `label ${i} has a 'tagFit' that is not an object`;
    }
  }
  return null;
}

/** Thresholds from the reader's labels. An axis with no qualifying `c` comes back `null`. */
export function calibrateThresholds(
  rows: readonly EncounterJudgmentRow[],
  labels: readonly CalibrationLabel[],
  calibratedAt: string,
): { thresholds: CoverageThresholds; tables: Record<string, ThresholdTableRow[]> } {
  const byId = new Map(rows.filter(r => !r.error).map(r => [r.id, r]));
  const paired = labels.flatMap(l => (byId.has(l.id) ? [{ label: l, row: byId.get(l.id)! }] : []));
  const tables: Record<string, ThresholdTableRow[]> = {};

  const choice = (axis: ChoiceAxis, pick: (l: CalibrationLabel) => string) => {
    const samples = paired.map(({ label, row }) => {
      const r = readAxis(row, axis);
      return { confidence: r.confidence, orderSensitive: r.orderSensitive, agrees: r.choice === pick(label) };
    });
    const { threshold, table } = chooseChoiceThreshold(samples);
    tables[axis] = table;
    return threshold;
  };

  const sphereSamples = paired.flatMap(({ label, row }) =>
    SPHERE_NAMES.flatMap(s => {
      const noul = row.answers[`sphere_${s}`]?.noul;
      const yes = label.spheres[s];
      return noul === undefined || yes === undefined ? [] : [{ noul, label: yes }];
    }));
  const sphere = chooseNoulThreshold(sphereSamples);
  tables.sphere = sphere.table;

  const tagSamples = paired.flatMap(({ label, row }) =>
    Object.entries(label.tagFit ?? {}).flatMap(([tag, earns]) => {
      const noul = row.answers[tagFitQuestionId(tag)]?.noul;
      return noul === undefined ? [] : [{ noul, label: earns }];
    }));
  const tag = tagSamples.length ? chooseNoulThreshold(tagSamples) : null;
  if (tag) tables.tag_fit = tag.table;

  return {
    thresholds: {
      reach: choice('reach', l => l.reach),
      activity: choice('activity', l => l.activity),
      walkOfLife: choice('walk_of_life', l => l.walk_of_life),
      sphereYes: sphere.threshold,
      // No reader labels for tag fit → keep the placeholder (reported as such in the header).
      tagFitNo: tag ? (tag.threshold === null ? null : round(1 - tag.threshold)) : DEFAULT_TAG_FIT_NO,
      calibratedAt,
    },
    tables,
  };
}

// ─── Grids ──────────────────────────────────────────────────────────

const bare = (tag: string) => tag.replace(/^#/, '');
export const REACH_OPTIONS: readonly string[] = [...REACH_DOMAINS, NO_MATCH_OPTION];
export const ACTIVITY_OPTIONS: readonly string[] = [...ACTIVITY_TAGS.map(bare), NO_MATCH_OPTION];
export const WALK_OF_LIFE_OPTIONS: readonly string[] = [...WALK_OF_LIFE_TAGS.map(bare), NO_MATCH_OPTION];

export interface CoverageGrid {
  rows: readonly string[];
  cols: readonly string[];
  cells: Record<string, Record<string, number>>;
  /** Entries not confident on one of the two axes. */
  review: number;
}

export function buildGrid(
  rows: readonly EncounterJudgmentRow[],
  colAxis: 'activity' | 'walk_of_life',
  t: CoverageThresholds,
): CoverageGrid {
  const cols = colAxis === 'activity' ? ACTIVITY_OPTIONS : WALK_OF_LIFE_OPTIONS;
  const cells: Record<string, Record<string, number>> = {};
  for (const r of REACH_OPTIONS) cells[r] = Object.fromEntries(cols.map(c => [c, 0]));
  let review = 0;
  for (const row of rows) {
    if (row.error) continue;
    const reach = confidentChoice(row, 'reach', t);
    const col = confidentChoice(row, colAxis, t);
    if (reach === null || col === null || !(reach in cells) || !(col in cells[reach])) { review++; continue; }
    cells[reach][col]++;
  }
  return { rows: REACH_OPTIONS, cols, cells, review };
}

export interface SphereColumnRow { sphere: string; judged: number; declared: number }

export function buildSphereColumn(rows: readonly EncounterJudgmentRow[], t: CoverageThresholds): SphereColumnRow[] {
  return SPHERE_NAMES.map(sphere => ({
    sphere,
    judged: t.sphereYes === null ? 0 : rows.filter(r =>
      !r.error && (r.answers[`sphere_${sphere}`]?.noul ?? 0) >= (t.sphereYes as number)).length,
    declared: rows.filter(r => r.declared.sphereAffinity === sphere).length,
  }));
}

export interface ReachAgreement {
  declaredRows: readonly string[];
  cells: Record<string, Record<string, number>>;
  compared: number;
  agreed: number;
  rate: number;
}

/** Declared (rows; `other` = outside the Eight) × confident judged Reach (cols). */
export function buildReachAgreement(rows: readonly EncounterJudgmentRow[], t: CoverageThresholds): ReachAgreement {
  const declaredRows = [...REACH_DOMAINS, 'other'];
  const cells: Record<string, Record<string, number>> = {};
  for (const d of declaredRows) cells[d] = Object.fromEntries(REACH_OPTIONS.map(c => [c, 0]));
  let compared = 0;
  let agreed = 0;
  for (const row of rows) {
    const judged = confidentChoice(row, 'reach', t);
    if (judged === null) continue;
    const d = (REACH_DOMAINS as readonly string[]).includes(row.declared.reach) ? row.declared.reach : 'other';
    cells[d][judged]++;
    // `none` is shown in the table but is not a Reach to agree or disagree with.
    if (judged === NO_MATCH_OPTION) continue;
    compared++;
    if (judged === d) agreed++;
  }
  return { declaredRows, cells, compared, agreed, rate: compared ? round(agreed / compared) : 0 };
}

// ─── Findings (Decision 3) ──────────────────────────────────────────

export type FindingClass =
  | 'out_of_eight_reach'
  | 'template_reach_unrolled'
  | 'reach_mislabel'
  | 'activity_backfill'
  | 'activity_mismatch'
  | 'unearned_tag'
  | 'possible_missing_theme';

export interface Finding {
  class: FindingClass;
  id: string;
  /** Stable identity for the new/resolved diff. */
  key: string;
  detail: string;
}

const finding = (cls: FindingClass, id: string, sub: string, detail: string): Finding =>
  ({ class: cls, id, key: `${cls}|${id}|${sub}`, detail });

export function computeFindings(rows: readonly EncounterJudgmentRow[], t: CoverageThresholds): Finding[] {
  const out: Finding[] = [];
  const eight = REACH_DOMAINS as readonly string[];
  for (const row of rows) {
    if (!eight.includes(row.declared.reach)) {
      out.push(finding('out_of_eight_reach', row.id, row.declared.reach,
        `declares reach '${row.declared.reach}', which is not one of the Eight`));
    }
    // Deterministic, no model (THR-2012): every runnable step rolls its own Reach, so a
    // template Reach no step carries is never rolled. Rows from before v2 lack the field.
    const steps = row.declared.stepReaches;
    if (steps && steps.length > 0 && !steps.includes(row.declared.reach)) {
      out.push(finding('template_reach_unrolled', row.id, row.declared.reach,
        `declares reach '${row.declared.reach}', but its steps roll only ${steps.join(', ')}`));
    }
    if (row.error) continue;

    const reach = confidentChoice(row, 'reach', t);
    // A confident `none` means "no single Reach", not a different one: review, not mislabel.
    if (reach !== null && reach !== NO_MATCH_OPTION && reach !== row.declared.reach && eight.includes(row.declared.reach)) {
      out.push(finding('reach_mislabel', row.id, reach,
        `declared ${row.declared.reach}, judged ${reach} (confidence ${readAxis(row, 'reach').confidence})`));
    }

    const activity = confidentChoice(row, 'activity', t);
    if (row.declared.encounterType === null && activity !== null && activity !== NO_MATCH_OPTION) {
      out.push(finding('activity_backfill', row.id, activity,
        `no encounterType; judged #${activity} (confidence ${readAxis(row, 'activity').confidence})`));
    }
    // THR-2012 item 5: only a calibrated activity axis yields a confident answer, so this
    // stays silent until it calibrates. `trade` is seated as a walk of life, not an
    // activity option, so a declared `trade` has nothing on this axis to disagree with.
    const declaredType = row.declared.encounterType;
    if (declaredType !== null && ACTIVITY_OPTIONS.includes(declaredType)
      && activity !== null && activity !== NO_MATCH_OPTION && activity !== declaredType) {
      out.push(finding('activity_mismatch', row.id, activity,
        `encounterType ${declaredType}, judged #${activity} (confidence ${readAxis(row, 'activity').confidence})`));
    }

    if (t.tagFitNo !== null) {
      for (const tag of row.declared.familyTags) {
        const noul = row.answers[tagFitQuestionId(tag)]?.noul;
        if (noul !== undefined && noul < t.tagFitNo) {
          out.push(finding('unearned_tag', row.id, tag, `wears ${tag}; fit ${noul} < ${t.tagFitNo}`));
        }
      }
    }
  }

  const confidentWalks = rows
    .map(row => ({ row, walk: confidentChoice(row, 'walk_of_life', t) }))
    .filter(x => x.walk !== null);
  const none = confidentWalks.filter(x => x.walk === NO_MATCH_OPTION);
  if (confidentWalks.length > 0 && none.length / confidentWalks.length >= NO_MATCH_SHARE_FLAG) {
    for (const { row } of none) {
      out.push(finding('possible_missing_theme', row.id, 'walk_of_life',
        `walk of life judged none (confidence ${readAxis(row, 'walk_of_life').confidence})`));
    }
  }
  return out;
}

export function diffFindings(
  previous: readonly Finding[],
  current: readonly Finding[],
): { added: Finding[]; resolved: Finding[] } {
  const prevKeys = new Set(previous.map(f => f.key));
  const currKeys = new Set(current.map(f => f.key));
  return {
    added: current.filter(f => !prevKeys.has(f.key)),
    resolved: previous.filter(f => !currKeys.has(f.key)),
  };
}

// ─── Review worklist ────────────────────────────────────────────────

export interface ReviewItem { id: string; minConfidence: number; reasons: string[] }

export function reviewWorklist(rows: readonly EncounterJudgmentRow[], t: CoverageThresholds): ReviewItem[] {
  const out: ReviewItem[] = [];
  for (const row of rows) {
    if (row.error) { out.push({ id: row.id, minConfidence: 0, reasons: [`error: ${row.error}`] }); continue; }
    const reasons: string[] = [];
    let min = 1;
    for (const axis of ['reach', 'activity', 'walk_of_life'] as const) {
      const r = readAxis(row, axis);
      min = Math.min(min, r.confidence);
      if (r.orderSensitive) reasons.push(`${axis} order-sensitive`);
      else if (confidentChoice(row, axis, t) === null) reasons.push(`${axis} low confidence (${r.confidence})`);
    }
    if (reasons.length) out.push({ id: row.id, minConfidence: round(min), reasons });
  }
  return out.sort((a, b) => a.minConfidence - b.minConfidence || a.id.localeCompare(b.id));
}

// ─── Report ─────────────────────────────────────────────────────────

const fmt = (n: number | null) => (n === null ? 'uncalibrated' : String(n));

function gridMd(grid: CoverageGrid): string {
  const head = `| reach \\ ${grid.cols === ACTIVITY_OPTIONS ? 'activity' : 'walk of life'} | ${grid.cols.join(' | ')} |`;
  const sep = `|---|${grid.cols.map(() => '---').join('|')}|`;
  const body = grid.rows.map(r => {
    const cells = grid.cols.map(c => {
      const n = grid.cells[r][c];
      return n === 0 ? '**empty**' : n < COVERAGE_THIN_CELL ? `${n} *thin*` : String(n);
    });
    return `| ${r} | ${cells.join(' | ')} |`;
  });
  return [head, sep, ...body, '', `Review margin (not confident on an axis): **${grid.review}**`].join('\n');
}

function findingsMd(list: readonly Finding[]): string {
  if (list.length === 0) return '_None._';
  const classes = [...new Set(list.map(f => f.class))];
  return classes.map(cls => {
    const items = list.filter(f => f.class === cls);
    return [`### ${cls} (${items.length})`, '', ...items.map(f => `- \`${f.id}\` — ${f.detail}`)].join('\n');
  }).join('\n\n');
}

/** The Reach calibration row at the artifact's own Reach threshold, or null when either is missing. */
export function reachAtThreshold(
  artifact: EncounterCoverageArtifact,
  c: number | null = artifact.thresholds.reach,
): ThresholdTableRow | null {
  const table = artifact.calibration?.tables.reach;
  if (c === null || !table) return null;
  return table.find(r => Math.abs(r.c - c) < 1e-9) ?? null;
}

/**
 * The Reach row at the artifact's own threshold. An uncalibrated axis has none, so it is
 * read at `fallbackC` (the previous run's threshold) to keep the two runs comparable.
 */
function reachAtThresholdMd(artifact: EncounterCoverageArtifact, fallbackC: number | null = null): string {
  const r = reachAtThreshold(artifact);
  if (r) return `**${r.agreement}** at ${r.c} (${r.admitted} admitted)`;
  if (artifact.thresholds.reach !== null) return `threshold ${artifact.thresholds.reach}, no table`;
  const at = reachAtThreshold(artifact, fallbackC);
  return at
    ? `**uncalibrated** (${at.agreement} at ${at.c}, ${at.admitted} admitted, short of ${CALIBRATION_TARGET_AGREEMENT} over ${CALIBRATION_MIN_ADMITTED_SHARE} of the sample)`
    : '**uncalibrated**';
}

export function renderReport(
  artifact: EncounterCoverageArtifact,
  previous: EncounterCoverageArtifact | null,
): string {
  const t = artifact.thresholds;
  const rows = artifact.rows;
  const u = artifact.usage;
  const errored = rows.filter(r => r.error).length;
  const findings = computeFindings(rows, t);
  const lines: string[] = [];

  lines.push('# Encounter coverage map');
  lines.push('');
  lines.push('_The grids are input to the category pick, not a quota (encounter-pipeline Step 0a). Every finding is a worklist for a reader, never a verdict._');
  lines.push('');
  lines.push(`**${artifact.partial ? 'PARTIAL · ' : ''}${rows.length} entries · ${u.requests} requests · ${u.reusedRows} reused rows · ${u.inputTokens} input tokens · $${u.usdEstimate.toFixed(4)} · ${u.wallSeconds}s · ${artifact.model} · questions v${artifact.questionsVersion} · thresholds reach ${fmt(t.reach)} / activity ${fmt(t.activity)} / walk of life ${fmt(t.walkOfLife)} / sphere yes ${fmt(t.sphereYes)} / tag-fit no ${fmt(t.tagFitNo)}**`);
  lines.push('');
  lines.push(!t.calibratedAt
    ? 'Thresholds are pre-calibration placeholders; no answer here has been calibrated yet.'
    : artifact.calibration
      ? `Thresholds calibrated against a blind Claude reader subagent (a model, not a human) on ${artifact.calibration.sampleIds.length} entries, ${t.calibratedAt}.`
      // Committed or carried thresholds with no labels in this artifact (THR-1850): name where they came from.
      : `Thresholds are the committed calibration measured ${t.calibratedAt} (\`CALIBRATED_*\` in \`scripts/content-judgments/constants.ts\`); this artifact carries no reader labels — the run that measured them holds the tables in \`ops\` history.`);
  lines.push(`Source commit \`${artifact.sourceCommit}\` · ran ${artifact.ranAt}${artifact.coldStart ? ' · cold start (no previous artifact)' : ''}${errored ? ` · ${errored} errored rows` : ''}.`);
  lines.push('');

  lines.push('## Reach × Activity');
  lines.push('');
  lines.push(gridMd(buildGrid(rows, 'activity', t)));
  lines.push('');
  lines.push('## Reach × Walk of life');
  lines.push('');
  lines.push(gridMd(buildGrid(rows, 'walk_of_life', t)));
  lines.push('');

  lines.push('## Spheres');
  lines.push('');
  lines.push('| Sphere | judged (≥ sphere yes) | declared sphereAffinity |');
  lines.push('|---|---|---|');
  for (const s of buildSphereColumn(rows, t)) lines.push(`| ${s.sphere} | ${s.judged} | ${s.declared} |`);
  lines.push('');

  const agreement = buildReachAgreement(rows, t);
  lines.push('## Declared vs judged Reach');
  lines.push('');
  lines.push(`Agreement among confident answers (judged \`none\` excluded): **${agreement.agreed}/${agreement.compared}** (${(agreement.rate * 100).toFixed(1)}%).`);
  lines.push('');
  lines.push(`| declared \\ judged | ${REACH_OPTIONS.join(' | ')} |`);
  lines.push(`|---|${REACH_OPTIONS.map(() => '---').join('|')}|`);
  for (const d of agreement.declaredRows) {
    lines.push(`| ${d} | ${REACH_OPTIONS.map(c => agreement.cells[d][c]).join(' | ')} |`);
  }
  lines.push('');

  lines.push('## Findings');
  lines.push('');
  if (previous) {
    const { added, resolved } = diffFindings(computeFindings(previous.rows, previous.thresholds), findings);
    lines.push(`Against the previous run: ${added.length} new, ${resolved.length} resolved, ${findings.length} total.`);
    lines.push('');
    // A finding class read off a confident answer goes quiet when its axis loses calibration;
    // say so, or the diff reads as fixed work (THR-2012).
    const lost = ([['reach', 'reach_mislabel'], ['activity', 'activity_backfill'], ['tagFitNo', 'unearned_tag']] as const)
      .filter(([axis]) => previous.thresholds[axis] !== null && t[axis] === null)
      .map(([axis, cls]) => `\`${cls}\` (${axis} is uncalibrated on this run)`);
    if (lost.length) {
      lines.push(`_Resolved here is not fixed: ${lost.join(', ')} cannot be raised, so the previous run's findings in it read as resolved._`);
      lines.push('');
    }
    lines.push('### New');
    lines.push('');
    lines.push(findingsMd(added));
    lines.push('');
    lines.push('### Resolved');
    lines.push('');
    lines.push(findingsMd(resolved));
  } else {
    lines.push(findingsMd(findings));
  }
  lines.push('');

  if (artifact.calibration) {
    lines.push('## Calibration');
    lines.push('');
    lines.push(`Reach at its threshold: ${reachAtThresholdMd(artifact, previous?.thresholds.reach ?? null)} this run · ${previous ? `${reachAtThresholdMd(previous)} previous run (questions v${previous.questionsVersion})` : 'no previous run'}.`);
    lines.push('');
    for (const [axis, table] of Object.entries(artifact.calibration.tables)) {
      lines.push(`### ${axis}`);
      lines.push('');
      lines.push('| c | admitted | share | agreement |');
      lines.push('|---|---|---|---|');
      for (const r of table) lines.push(`| ${r.c} | ${r.admitted} | ${r.admittedShare} | ${r.agreement} |`);
      lines.push('');
    }
  }

  const worklist = reviewWorklist(rows, t);
  lines.push(`## Review worklist (${worklist.length})`);
  lines.push('');
  for (const item of worklist) lines.push(`- \`${item.id}\` (${item.minConfidence}) — ${item.reasons.join('; ')}`);
  lines.push('');
  return lines.join('\n');
}
