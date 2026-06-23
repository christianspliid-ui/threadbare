// Prose-quality eval harness — pure, deterministic scorer (THR-472).
// No I/O, no PRNG, no clock. Same input → same score, always.
// Offline authoring tool only — not wired into the tick loop or GameState.

import {
  BATCH_TAIL_FRACTION,
  CHRONICLER_SENTENCE_CAP,
  DIVINE_SENTENCE_CAP,
  DYNAMIC_FIELD_NAMES,
  FLOWERY_PHRASE_PENALTY,
  HARD_EXCLUSION_IS_GATE,
  HARD_EXCLUSION_PATTERNS,
  LENGTH_BREACH_PENALTY,
  MISSING_ENRICHMENT_PENALTY,
  NUMBER_IN_PROSE_PENALTY,
  PROSE_PASS_FLOOR,
  PROSE_WARN_FLOOR,
  STATIC_STRING_PENALTY,
  TELL_DONT_SHOW_MARKERS,
  TELL_DONT_SHOW_PENALTY,
} from '../../data/content-eval/proseQualityRubric';
import {
  FLOWERY_PHRASES,
  FORECAST_DIGIT_PATTERN,
  PROBABILITY_PHRASES,
} from './detectors';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ProseVoiceMode = 'divine' | 'event' | 'chronicler' | 'unknown';
export type ProseBand = 'pass' | 'warn' | 'fail' | 'error';

export interface ProseQualityFlag {
  readonly category: 'voice-contract' | 'hard-exclusion' | 'static-string' | 'missing-enrichment';
  readonly severity: 'gate' | 'loud' | 'soft';
  readonly field: string;
  readonly detail: string;
  readonly evidence: string;
}

export interface ProseQualityResult {
  readonly entryId: string;
  readonly contentType: string;
  readonly voiceMode: ProseVoiceMode;
  readonly score: number;
  readonly band: ProseBand;
  readonly flags: readonly ProseQualityFlag[];
  readonly marquee: boolean;
}

export interface ProseQualityBatchResult {
  readonly entries: readonly ProseQualityResult[];
  readonly summary: {
    readonly total: number;
    readonly pass: number;
    readonly warn: number;
    readonly fail: number;
    readonly error: number;
  };
  readonly bottomTail: readonly ProseQualityResult[];
  readonly marqueeEntries: readonly ProseQualityResult[];
}

/** Input to the scorer: any authored content entry. */
export interface EvalInput {
  readonly entryId: string;
  /** Content type for voice-mode inference (e.g. "encounter", "condition", "omen", "attachment"). */
  readonly contentType: string;
  /** Whether this entry should always appear in batch reports (high-rarity/importance). */
  readonly marquee?: boolean;
  /** Prose fields to evaluate: fieldName → text content. */
  readonly fields: Readonly<Record<string, string>>;
}

/** Overrides for any rubric constant. Callers may supply a partial config; missing keys use defaults. */
export interface ProseQualityConfig {
  passFloor: number;
  warnFloor: number;
  floweryPhrasePenalty: number;
  tellDontShowPenalty: number;
  numberInProsePenalty: number;
  lengthBreachPenalty: number;
  staticStringPenalty: number;
  missingEnrichmentPenalty: number;
  batchTailFraction: number;
  hardExclusionIsGate: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildConfig(override?: Partial<ProseQualityConfig>): ProseQualityConfig {
  return {
    passFloor: PROSE_PASS_FLOOR,
    warnFloor: PROSE_WARN_FLOOR,
    floweryPhrasePenalty: FLOWERY_PHRASE_PENALTY,
    tellDontShowPenalty: TELL_DONT_SHOW_PENALTY,
    numberInProsePenalty: NUMBER_IN_PROSE_PENALTY,
    lengthBreachPenalty: LENGTH_BREACH_PENALTY,
    staticStringPenalty: STATIC_STRING_PENALTY,
    missingEnrichmentPenalty: MISSING_ENRICHMENT_PENALTY,
    batchTailFraction: BATCH_TAIL_FRACTION,
    hardExclusionIsGate: HARD_EXCLUSION_IS_GATE,
    ...override,
  };
}

/** Count sentences by looking for sentence-ending punctuation followed by whitespace or EOS.
 *  Strips enrichment placeholders first so `{?has_faction}` brackets don't confuse the count. */
function countSentences(text: string): number {
  const stripped = text.replace(/\{[^}]*\}/gu, '');
  const matches = stripped.match(/[.!?]+(?:\s|$)/gu);
  return matches ? matches.length : (stripped.trim().length > 0 ? 1 : 0);
}

/** Infer the prose voice mode from content type and field name. */
function inferVoiceMode(contentType: string, fieldName: string): ProseVoiceMode {
  const ct = contentType.toLowerCase();
  const fn = fieldName.toLowerCase();
  if (fn.includes('receipt') || fn.includes('aftermath') || fn.includes('chronicle')) {
    return 'chronicler';
  }
  if (ct.includes('divine') || ct.includes('intervention') || fn.includes('divine')) {
    return 'divine';
  }
  if (
    fn.includes('prose') ||
    fn.includes('narrative') ||
    fn.includes('description') ||
    fn.includes('text') ||
    fn.includes('flavor')
  ) {
    return 'event';
  }
  return 'unknown';
}

/** Whether a field name is in the "dynamic" category (should carry enrichment placeholders). */
function isDynamicField(fieldName: string): boolean {
  return DYNAMIC_FIELD_NAMES.includes(fieldName.toLowerCase());
}

/** True if the text contains any enrichment placeholder: {name}, {they}, {?...}, etc. */
function hasAnyPlaceholder(text: string): boolean {
  return /\{[a-zA-Z?!][^}]*\}/u.test(text);
}

/** True if the text has a pronoun placeholder or conditional block. */
function hasConditionalOrPronoun(text: string): boolean {
  return /\{(?:\?|they\}|them\}|their\}|s\})/iu.test(text);
}

function truncateEvidence(s: string, maxLen = 80): string {
  return s.length <= maxLen ? s : s.slice(0, maxLen - 1) + '…';
}

// ---------------------------------------------------------------------------
// Per-field detector functions — each returns zero or more flags
// ---------------------------------------------------------------------------

function detectHardExclusions(field: string, text: string): ProseQualityFlag[] {
  for (const pattern of HARD_EXCLUSION_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      return [
        {
          category: 'hard-exclusion',
          severity: 'gate',
          field,
          detail: `hard-exclusion pattern matched: "${pattern.source}"`,
          evidence: truncateEvidence(match[0]),
        },
      ];
    }
  }
  return [];
}

function detectVoiceContractViolations(
  field: string,
  text: string,
  voiceMode: ProseVoiceMode,
): ProseQualityFlag[] {
  const flags: ProseQualityFlag[] = [];
  const lower = text.toLowerCase();

  // Flowery phrases
  for (const phrase of FLOWERY_PHRASES) {
    if (lower.includes(phrase)) {
      flags.push({
        category: 'voice-contract',
        severity: 'loud',
        field,
        detail: `purple prose phrase: "${phrase}"`,
        evidence: truncateEvidence(phrase),
      });
    }
  }

  // Digits and probability words in prose
  if (FORECAST_DIGIT_PATTERN.test(text)) {
    const digitMatch = /\d+/u.exec(text);
    flags.push({
      category: 'voice-contract',
      severity: 'loud',
      field,
      detail: 'digit found in prose field',
      evidence: truncateEvidence(digitMatch ? digitMatch[0] : text.slice(0, 20)),
    });
  }
  for (const phrase of PROBABILITY_PHRASES) {
    if (lower.includes(phrase)) {
      flags.push({
        category: 'voice-contract',
        severity: 'loud',
        field,
        detail: `probability phrase in prose: "${phrase}"`,
        evidence: truncateEvidence(phrase),
      });
    }
  }

  // Tell-don't-show markers
  for (const marker of TELL_DONT_SHOW_MARKERS) {
    if (lower.includes(marker.toLowerCase())) {
      flags.push({
        category: 'voice-contract',
        severity: 'loud',
        field,
        detail: `tell-don't-show construction: "${marker}"`,
        evidence: truncateEvidence(marker),
      });
    }
  }

  // Length breach
  if (voiceMode === 'divine' || voiceMode === 'chronicler') {
    const cap = voiceMode === 'divine' ? DIVINE_SENTENCE_CAP : CHRONICLER_SENTENCE_CAP;
    const count = countSentences(text);
    if (count > cap) {
      flags.push({
        category: 'voice-contract',
        severity: 'soft',
        field,
        detail: `${voiceMode} voice: ${count} sentences exceeds cap of ${cap}`,
        evidence: truncateEvidence(text),
      });
    }
  }

  return flags;
}

function detectStaticString(field: string, text: string): ProseQualityFlag | null {
  if (!isDynamicField(field)) return null;
  if (text.trim().length === 0) return null;
  if (hasAnyPlaceholder(text)) return null;
  return {
    category: 'static-string',
    severity: 'loud',
    field,
    detail: 'dynamic field contains no enrichment placeholders',
    evidence: truncateEvidence(text),
  };
}

function detectMissingEnrichment(field: string, text: string): ProseQualityFlag | null {
  if (!isDynamicField(field)) return null;
  if (!hasAnyPlaceholder(text)) return null;  // static-string check handles this case
  if (!/\{name\}/u.test(text)) return null;  // must have {name} to be nudged toward conditional
  if (hasConditionalOrPronoun(text)) return null;
  return {
    category: 'missing-enrichment',
    severity: 'soft',
    field,
    detail: '{name} present but no conditional block or pronoun placeholder',
    evidence: truncateEvidence(text),
  };
}

// ---------------------------------------------------------------------------
// Scoring arithmetic
// ---------------------------------------------------------------------------

function computeScore(flags: readonly ProseQualityFlag[], cfg: ProseQualityConfig): number {
  if (flags.some((f) => f.severity === 'gate')) return 0;

  const penalty = flags.reduce((acc, flag) => {
    switch (flag.category) {
      case 'voice-contract': {
        if (flag.detail.startsWith('purple prose')) return acc + cfg.floweryPhrasePenalty;
        if (flag.detail.startsWith('tell-don\'t-show')) return acc + cfg.tellDontShowPenalty;
        if (flag.detail.startsWith('digit') || flag.detail.startsWith('probability')) return acc + cfg.numberInProsePenalty;
        if (flag.detail.includes('sentences exceeds cap')) return acc + cfg.lengthBreachPenalty;
        return acc + cfg.floweryPhrasePenalty;
      }
      case 'static-string':
        return acc + cfg.staticStringPenalty;
      case 'missing-enrichment':
        return acc + cfg.missingEnrichmentPenalty;
      default:
        return acc;
    }
  }, 0);

  return Math.max(0, 100 - penalty);
}

function scoreToBand(score: number, hasGate: boolean, cfg: ProseQualityConfig): ProseBand {
  if (hasGate) return 'fail';
  if (score >= cfg.passFloor) return 'pass';
  if (score >= cfg.warnFloor) return 'warn';
  return 'fail';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Score a single content entry against the prose quality bar. */
export function scoreProseEntry(entry: EvalInput, cfg?: Partial<ProseQualityConfig>): ProseQualityResult {
  const config = buildConfig(cfg);
  const voiceMode = inferVoiceMode(entry.contentType, Object.keys(entry.fields)[0] ?? '');
  const flags: ProseQualityFlag[] = [];

  for (const [fieldName, text] of Object.entries(entry.fields)) {
    if (typeof text !== 'string' || text.length === 0) continue;

    const fieldVoiceMode = inferVoiceMode(entry.contentType, fieldName);

    flags.push(...detectHardExclusions(fieldName, text));
    if (config.hardExclusionIsGate && flags.some((f) => f.severity === 'gate')) break;
    flags.push(...detectVoiceContractViolations(fieldName, text, fieldVoiceMode));
    const staticFlag = detectStaticString(fieldName, text);
    if (staticFlag) flags.push(staticFlag);
    const enrichFlag = detectMissingEnrichment(fieldName, text);
    if (enrichFlag) flags.push(enrichFlag);
  }

  const hasGate = flags.some((f) => f.severity === 'gate');
  const score = computeScore(flags, config);
  const band = scoreToBand(score, hasGate, config);

  return {
    entryId: entry.entryId,
    contentType: entry.contentType,
    voiceMode,
    score,
    band,
    flags,
    marquee: entry.marquee ?? false,
  };
}

/** Score a batch of content entries; returns ranked worst-first, with bottom tail and marquee entries. */
export function scoreProseBatch(
  entries: readonly EvalInput[],
  cfg?: Partial<ProseQualityConfig>,
): ProseQualityBatchResult {
  const config = buildConfig(cfg);
  const results: ProseQualityResult[] = [];

  for (const entry of entries) {
    try {
      results.push(scoreProseEntry(entry, cfg));
    } catch (err) {
      results.push({
        entryId: entry.entryId,
        contentType: entry.contentType,
        voiceMode: 'unknown',
        score: 0,
        band: 'error',
        flags: [
          {
            category: 'voice-contract',
            severity: 'gate',
            field: '(system)',
            detail: `scorer threw: ${err instanceof Error ? err.message : String(err)}`,
            evidence: '',
          },
        ],
        marquee: entry.marquee ?? false,
      });
    }
  }

  // Sort worst-first (lowest score first; error entries sort first at score 0)
  const sorted = [...results].sort((a, b) => a.score - b.score);

  const summary = {
    total: results.length,
    pass: results.filter((r) => r.band === 'pass').length,
    warn: results.filter((r) => r.band === 'warn').length,
    fail: results.filter((r) => r.band === 'fail').length,
    error: results.filter((r) => r.band === 'error').length,
  };

  const tailCount = Math.max(1, Math.ceil(results.length * config.batchTailFraction));
  const bottomTail = sorted.slice(0, tailCount);
  const marqueeEntries = results.filter((r) => r.marquee);

  return { entries: sorted, summary, bottomTail, marqueeEntries };
}
