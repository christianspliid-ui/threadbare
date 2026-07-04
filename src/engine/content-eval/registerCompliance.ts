// Register-compliance dimension for the prose-quality harness (THR-609).
// Pure, deterministic. No I/O, no PRNG, no clock. Same input → same verdict.
//
// Measures how far an authored entry's prose drifts from its declared register
// (baseline | character | peak; absent ⇒ baseline). Four metrics:
//   avgSentenceLength    — mean words/sentence across the entry's prose fields.
//   rareWordDensity      — fraction of long content tokens outside the common
//                          allowlist + game whitelist.
//   figurativeDensity    — max figurative markers in any single paragraph.
//   interactivePlainness — label-class fields (names, labels) must stay plain.
//
// Each metric bands pass|warn|fail against register-appropriate thresholds; the
// entry's registerCompliance band is the worst metric band. Fail-soft: a missing
// common-word list ⇒ `skipped` (never throws) — see NFP #4.

import {
  BASELINE_MAX_AVG_SENTENCE_LEN,
  BASELINE_RARE_WORD_DENSITY_MAX,
  BASELINE_FIGURATIVE_WARN_AT,
  BASELINE_FIGURATIVE_FAIL_AT,
  FIGURATIVE_CONSTRUCTION_MARKERS,
  FIGURATIVE_SIMILE_MARKERS,
  INTERACTIVE_LABEL_MAX_WORDS,
  LABEL_CLASS_FIELD_NAMES,
  PEAK_FIGURATIVE_IMAGES_PER_PARA,
  PEAK_MAX_AVG_SENTENCE_LEN,
  PEAK_RARE_WORD_DENSITY_MAX,
  RARE_DENSITY_MIN_TOKENS,
  RARE_WORD_MIN_LEN,
  REGISTER_WARN_TO_FAIL_RATIO,
} from '../../data/content-eval/registerRubric';
import {
  REGISTER_ORNATE_WORDS,
  REGISTER_GAME_TERM_WHITELIST,
} from '../../data/register-common-words';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type RegisterKind = 'baseline' | 'character' | 'peak';
export type RegisterBand = 'pass' | 'warn' | 'fail' | 'skipped';

export type RegisterMetricName =
  | 'avgSentenceLength'
  | 'rareWordDensity'
  | 'figurativeDensity'
  | 'interactivePlainness';

export interface RegisterMetric {
  readonly name: RegisterMetricName;
  /** Measured value (words/sentence, density fraction, marker count, or word count). */
  readonly value: number;
  readonly band: RegisterBand;
  /** Human-readable reason (NFP #2 — inspectability). */
  readonly detail: string;
}

export interface RegisterComplianceResult {
  /** Resolved register (declared value, or `baseline` default). */
  readonly register: RegisterKind;
  /** False when the register was defaulted (entry declared nothing). */
  readonly declared: boolean;
  /** Worst band across the metrics. `skipped` when nothing scoreable / list missing. */
  readonly band: RegisterBand;
  readonly metrics: readonly RegisterMetric[];
}

/** Minimal field-classification interface so callers can score without the full
 *  EvalInput shape (the batch scorer passes fields + register through). */
export interface RegisterInput {
  readonly register?: RegisterKind;
  readonly fields: Readonly<Record<string, string>>;
}

// ---------------------------------------------------------------------------
// Register-parameterised thresholds
// ---------------------------------------------------------------------------

interface RegisterThresholds {
  readonly maxAvgSentenceLen: number;
  readonly rareWordDensityMax: number;
  /** Figurative markers/paragraph at which the metric warns / fails. */
  readonly figurativeWarnAt: number;
  readonly figurativeFailAt: number;
}

/** Character register uses baseline discipline (comprehension-first: wit over
 *  ornament) but tolerates one extra figurative image before failing — dialogue
 *  may be a touch more colourful than surrounding narration. */
function thresholdsFor(register: RegisterKind): RegisterThresholds {
  switch (register) {
    case 'peak':
      return {
        maxAvgSentenceLen: PEAK_MAX_AVG_SENTENCE_LEN,
        rareWordDensityMax: PEAK_RARE_WORD_DENSITY_MAX,
        figurativeWarnAt: PEAK_FIGURATIVE_IMAGES_PER_PARA + 1,
        figurativeFailAt: PEAK_FIGURATIVE_IMAGES_PER_PARA + 2,
      };
    case 'character':
      return {
        maxAvgSentenceLen: BASELINE_MAX_AVG_SENTENCE_LEN,
        rareWordDensityMax: BASELINE_RARE_WORD_DENSITY_MAX,
        figurativeWarnAt: BASELINE_FIGURATIVE_WARN_AT + 1,
        figurativeFailAt: BASELINE_FIGURATIVE_FAIL_AT + 1,
      };
    case 'baseline':
    default:
      return {
        maxAvgSentenceLen: BASELINE_MAX_AVG_SENTENCE_LEN,
        rareWordDensityMax: BASELINE_RARE_WORD_DENSITY_MAX,
        figurativeWarnAt: BASELINE_FIGURATIVE_WARN_AT,
        figurativeFailAt: BASELINE_FIGURATIVE_FAIL_AT,
      };
  }
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/** Strip enrichment placeholders ({name}, {?has_x}...) so they neither count as
 *  tokens nor break sentence detection. */
function stripPlaceholders(text: string): string {
  return text.replace(/\{[^}]*\}/gu, ' ');
}

/** Count sentences by sentence-ending punctuation. Mirrors the prose scorer's
 *  approach so the two dimensions agree on sentence boundaries. */
function countSentences(text: string): number {
  const matches = text.match(/[.!?]+(?:\s|$)/gu);
  if (matches && matches.length > 0) return matches.length;
  return text.trim().length > 0 ? 1 : 0;
}

/** Alphabetic word tokens, apostrophes folded out (he'd → hed). Preserves case
 *  so the rare-word check can exclude Capitalised proper nouns. */
function tokenize(text: string): string[] {
  const cleaned = stripPlaceholders(text).replace(/['’]/gu, '');
  const matches = cleaned.match(/[A-Za-z]+/gu);
  return matches ?? [];
}

/** A token is "rare" (ornate) when it is at/above the length gate and its
 *  lowercase form is in the ornate-diction denylist and not a whitelisted game
 *  term. Case is folded so sentence-initial ornate words still count. */
function isRareToken(token: string): boolean {
  if (token.length < RARE_WORD_MIN_LEN) return false;
  const lower = token.toLowerCase();
  if (REGISTER_GAME_TERM_WHITELIST.has(lower)) return false;
  return REGISTER_ORNATE_WORDS.has(lower);
}

/** Count figurative markers in one paragraph of text (lowercased). Simile
 *  phrases and known personification/metaphor tells. */
function countFigurativeMarkers(paragraphLower: string): number {
  let count = 0;
  const padded = ` ${paragraphLower} `;
  for (const marker of FIGURATIVE_SIMILE_MARKERS) {
    let idx = padded.indexOf(marker);
    while (idx !== -1) {
      count += 1;
      idx = padded.indexOf(marker, idx + marker.length);
    }
  }
  for (const marker of FIGURATIVE_CONSTRUCTION_MARKERS) {
    if (padded.includes(marker)) count += 1;
  }
  return count;
}

/** Split a text into paragraphs. Blank-line separated; falls back to the whole
 *  text as one paragraph. */
function splitParagraphs(text: string): string[] {
  const parts = text.split(/\n\s*\n/u).map((p) => p.trim()).filter((p) => p.length > 0);
  return parts.length > 0 ? parts : [text.trim()].filter((p) => p.length > 0);
}

// ---------------------------------------------------------------------------
// Metric computation
// ---------------------------------------------------------------------------

function bandForValue(value: number, warnAt: number, failAt: number): RegisterBand {
  if (value >= failAt) return 'fail';
  if (value >= warnAt) return 'warn';
  return 'pass';
}

/** The narrative (non-label) fields joined for sentence/rare/figurative metrics. */
function narrativeText(fields: Readonly<Record<string, string>>): string {
  const parts: string[] = [];
  for (const [fieldName, text] of Object.entries(fields)) {
    if (typeof text !== 'string' || text.trim().length === 0) continue;
    if (isLabelField(fieldName)) continue; // labels scored by interactivePlainness
    parts.push(text);
  }
  return parts.join('\n\n');
}

function isLabelField(fieldName: string): boolean {
  const base = fieldName.toLowerCase().split('.')[0]; // strip `.choiceId` suffixes
  return LABEL_CLASS_FIELD_NAMES.includes(base);
}

function computeAvgSentenceLength(text: string, t: RegisterThresholds): RegisterMetric {
  const tokens = tokenize(text);
  const sentences = countSentences(stripPlaceholders(text));
  const value = sentences > 0 ? tokens.length / sentences : 0;
  const warnAt = t.maxAvgSentenceLen;
  const failAt = t.maxAvgSentenceLen * REGISTER_WARN_TO_FAIL_RATIO;
  const band = bandForValue(value, warnAt, failAt);
  return {
    name: 'avgSentenceLength',
    value: Math.round(value * 10) / 10,
    band,
    detail:
      band === 'pass'
        ? `${Math.round(value * 10) / 10} words/sentence (≤ ${warnAt})`
        : `${Math.round(value * 10) / 10} words/sentence exceeds ${band === 'fail' ? `fail ${Math.round(failAt)}` : `warn ${warnAt}`}`,
  };
}

function computeRareWordDensity(text: string, t: RegisterThresholds): RegisterMetric {
  const tokens = tokenize(text);
  const total = tokens.length;
  const rare = tokens.filter(isRareToken);
  const value = total > 0 ? rare.length / total : 0;
  const warnAt = t.rareWordDensityMax;
  const failAt = t.rareWordDensityMax * REGISTER_WARN_TO_FAIL_RATIO;
  let band = bandForValue(value, warnAt, failAt);
  // Short entries: never worse than warn (a single unusual word shouldn't fail).
  if (total < RARE_DENSITY_MIN_TOKENS && band === 'fail') band = 'warn';
  const sample = rare.slice(0, 3).join(', ');
  return {
    name: 'rareWordDensity',
    value: Math.round(value * 1000) / 1000,
    band,
    detail:
      band === 'pass'
        ? `${rare.length}/${total} rare (≤ ${warnAt})`
        : `${rare.length}/${total} rare${sample ? ` (${sample})` : ''} exceeds ${warnAt}`,
  };
}

function computeFigurativeDensity(text: string, t: RegisterThresholds): RegisterMetric {
  const paragraphs = splitParagraphs(text);
  let maxMarkers = 0;
  for (const para of paragraphs) {
    const markers = countFigurativeMarkers(para.toLowerCase());
    if (markers > maxMarkers) maxMarkers = markers;
  }
  const band = bandForValue(maxMarkers, t.figurativeWarnAt, t.figurativeFailAt);
  return {
    name: 'figurativeDensity',
    value: maxMarkers,
    band,
    detail:
      band === 'pass'
        ? `${maxMarkers} figurative image(s)/paragraph (warn at ${t.figurativeWarnAt})`
        : `${maxMarkers} figurative image(s) in a paragraph (warn ${t.figurativeWarnAt}, fail ${t.figurativeFailAt})`,
  };
}

/** Interactive plainness over label-class fields. Word-count breach warns; a
 *  rare word or figurative marker in a label fails (interactive text is a hard
 *  plainness rule regardless of the entry's declared register). */
function computeInteractivePlainness(
  fields: Readonly<Record<string, string>>,
): RegisterMetric | null {
  const labels: Array<[string, string]> = [];
  for (const [fieldName, text] of Object.entries(fields)) {
    if (typeof text !== 'string' || text.trim().length === 0) continue;
    if (isLabelField(fieldName)) labels.push([fieldName, text]);
  }
  if (labels.length === 0) return null;

  let worst: RegisterBand = 'pass';
  let worstValue = 0;
  let detail = 'labels plain';
  for (const [fieldName, text] of labels) {
    const tokens = tokenize(text);
    const rare = tokens.filter(isRareToken);
    const figurative = countFigurativeMarkers(text.toLowerCase());
    if (tokens.length > worstValue) worstValue = tokens.length;
    if (rare.length > 0 || figurative > 0) {
      worst = 'fail';
      detail = `label "${fieldName}" not plain: ${rare.length > 0 ? `rare (${rare.slice(0, 2).join(', ')})` : 'figurative marker'}`;
      break;
    }
    if (tokens.length > INTERACTIVE_LABEL_MAX_WORDS && worst === 'pass') {
      worst = 'warn';
      detail = `label "${fieldName}" is ${tokens.length} words (> ${INTERACTIVE_LABEL_MAX_WORDS})`;
    }
  }
  return { name: 'interactivePlainness', value: worstValue, band: worst, detail };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const BAND_RANK: Record<RegisterBand, number> = { pass: 0, warn: 1, fail: 2, skipped: -1 };

function worstBand(bands: readonly RegisterBand[]): RegisterBand {
  const real = bands.filter((b) => b !== 'skipped');
  if (real.length === 0) return 'skipped';
  return real.reduce((worst, b) => (BAND_RANK[b] > BAND_RANK[worst] ? b : worst), 'pass');
}

/**
 * Score an entry's register compliance. Pure + deterministic. Never throws:
 * on any internal failure (e.g. common-word list unavailable) the result is a
 * single `skipped` band with the reason in the metric detail (NFP #4).
 */
export function scoreRegisterCompliance(entry: RegisterInput): RegisterComplianceResult {
  const declared = entry.register !== undefined;
  const register: RegisterKind = entry.register ?? 'baseline';

  try {
    // Fail-soft guard: an empty ornate denylist means the density metric cannot
    // fire — skip rather than silently report every entry as clean.
    if (REGISTER_ORNATE_WORDS.size === 0) {
      return {
        register,
        declared,
        band: 'skipped',
        metrics: [
          {
            name: 'rareWordDensity',
            value: 0,
            band: 'skipped',
            detail: 'common-word list empty/unloadable — register scoring skipped',
          },
        ],
      };
    }

    const t = thresholdsFor(register);
    const prose = narrativeText(entry.fields);
    const metrics: RegisterMetric[] = [];

    if (prose.trim().length > 0) {
      metrics.push(computeAvgSentenceLength(prose, t));
      metrics.push(computeRareWordDensity(prose, t));
      metrics.push(computeFigurativeDensity(prose, t));
    }
    const labelMetric = computeInteractivePlainness(entry.fields);
    if (labelMetric) metrics.push(labelMetric);

    if (metrics.length === 0) {
      return { register, declared, band: 'skipped', metrics: [] };
    }

    return { register, declared, band: worstBand(metrics.map((m) => m.band)), metrics };
  } catch (err) {
    return {
      register,
      declared,
      band: 'skipped',
      metrics: [
        {
          name: 'rareWordDensity',
          value: 0,
          band: 'skipped',
          detail: `register scorer error: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }
}
