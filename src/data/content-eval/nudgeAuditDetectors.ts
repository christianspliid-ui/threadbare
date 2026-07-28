/**
 * The WS3 migration-audit detectors, promoted from scratch to committed code.
 * THR-838 (WS5 Batch 1).
 *
 * `Docs/audits/2026-07-26-nudge-migration-audit.md` § *Appendix — scratch
 * detector spec* defined these five measures and then ran them from a throwaway
 * script. That was fine for producing one verdict table; it is not fine for WS5,
 * where every batch owes **before/after scores on the same detectors** as its
 * completion evidence. A detector that lives only in a deleted scratch file
 * cannot produce a comparable "after" — the numbers in the audit table would be
 * the only ones anyone could ever cite.
 *
 * So this module is the audit's appendix, transcribed. The regexes and the
 * lexicon below are copied from that spec verbatim; where this file and the
 * appendix disagree, the appendix is the contract and this file is the bug.
 *
 * ─── What this is NOT ────────────────────────────────────────────────
 * Not a replacement for `scoreProseEntry` / `registerCompliance` (THR-609),
 * which score the *shipped* prose fields and produce the pass/warn/fail bands
 * the Prose QA tab shows. These detectors sweep the **full** authored text of a
 * template *including step narratives and afterimages*, which the shipped
 * collector does not reach — and step prose is the bulk of what a player reads.
 * The two are run together; neither subsumes the other.
 *
 * ─── Placement ───────────────────────────────────────────────────────
 * Beside `nudgeAuthoringConstants.ts`, and for the same reason: this is
 * authoring-time policy read by scripts and tests, never by a gameplay path.
 * Nothing under `src/components/**`, `src/engine/**` (outside tests), or the
 * tick loop may import it.
 *
 * Plan: `Docs/plans/2026-07-26-nudge-model-encounter-system.md` § WS5
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';

// ─── Thresholds (audit appendix table, verbatim) ─────────────────────

/** Abstract nouns per 100 words at or above which a template fails. */
export const ABSTRACT_DENSITY_FAIL = 4.5;
/** Hedges / stand-ins per 100 words at or above which a template fails. */
export const VAGUENESS_DENSITY_FAIL = 2.0;
/** not-X-but-Y occurrences per template at or above which it fails. */
export const NOT_X_BUT_Y_FAIL = 2;
/** Total authored words below which no nudge hand can hang off the premise. */
export const THIN_PREMISE_WORDS = 45;
/** Second-person pronouns tolerated on a mortal-drawn template. */
export const SECOND_PERSON_FAIL = 2;

// ─── Patterns (audit appendix, verbatim) ─────────────────────────────

/**
 * Abstract-noun proxy. A standard concreteness measure: nominalised
 * abstractions displace the concrete nouns a nudge needs something to act on.
 *
 * Suffix-based, so domain vocabulary (`devotion`, `judgement`, `settlement`)
 * counts against a template. That is a known limit, recorded in the audit: this
 * is a **ranking** signal, not a verdict on any single line.
 */
export const ABSTRACT_NOUN_PATTERN =
  /\b[a-z]{4,}(?:ness|ity|tion|sion|ment|ance|ence|ism|hood|ship)\b/gi;

/** Second-person voice. Applied only where `actorAffinities` omits `ascendant`. */
export const SECOND_PERSON_PATTERN = /\b(?:you|your|yours|yourself)\b/gi;

/**
 * The vagueness lexicon, in the audit's four groups. Multi-word entries are
 * matched as phrases; single words on word boundaries.
 */
export const AUDIT_VAGUENESS_TERMS: readonly string[] = [
  // hedges
  'somehow', 'somewhat', 'seems to', 'appears to', 'a kind of', 'a sort of',
  'something like', 'in some way',
  // abstract stand-ins
  'something', 'someone', 'somewhere', 'things', 'stuff',
  // nominalised placeholders
  'the situation', 'the matter', 'the moment', 'the atmosphere', 'the tension',
  'the dynamic', 'the connection', 'the understanding', 'the balance',
  'the energy', 'the presence', 'the experience', 'the process',
  // vague intensifiers
  'very', 'really', 'quite', 'rather', 'truly', 'deeply', 'profoundly', 'utterly',
];

/** not-X-but-Y constructions. Matched per sentence, one hit maximum per sentence. */
export const NOT_X_BUT_Y_PATTERNS: readonly RegExp[] = [
  /\bnot\s+(?:just|only|merely|simply)\b[^.!?]{0,90}?\bbut\b/i,
  /\b(?:is|was|are|were)n'?t\s+[^.!?]{0,70}?[.;—–-]\s*(?:it|they|he|she)\s+(?:is|was|are|were)\b/i,
  /\bnot\s+(?:a|an|the)\s+[a-z]+[^.!?]{0,50}?\bbut\s+(?:a|an|the)\b/i,
  /\bless\s+[a-z]+\s+than\s+[a-z]+/i,
  /\bnot\s+because\b[^.!?]{0,70}?\bbut\s+because\b/i,
];

// ─── Text collection ─────────────────────────────────────────────────

/**
 * Every authored string on a template, including step narratives, all five
 * afterimages, and any authored nudge prose.
 *
 * The shipped `collectAuthoredProse` deliberately sweeps a narrower field set
 * (it feeds the register scorer, which bands per-field). This one is
 * deliberately total: the detectors measure density over what a player reads,
 * and a player reads the step narratives.
 */
export function collectTemplateText(template: UnifiedActionTemplate): string {
  const parts: string[] = [];
  const push = (v: unknown): void => {
    if (typeof v === 'string' && v.trim().length > 0) parts.push(v);
  };

  push(template.name);
  push(template.description);
  push(template.narrativeTemplates?.initiation);
  push(template.narrativeTemplates?.success);
  push(template.narrativeTemplates?.failure);

  for (const rawStep of template.steps ?? []) {
    // Branching steps carry their variants under `variants`/`fallback`; a plain
    // ActionStep carries the prose directly. Sweep both shapes fail-soft.
    const steps = 'branchOnStep' in rawStep
      ? [...Object.values(rawStep.variants), rawStep.fallback]
      : [rawStep];
    for (const step of steps) {
      push(step.narrativeTemplate);
      push(step.purposeLine);
      push(step.successAfterimage);
      push(step.failureAfterimage);
      push(step.successAtCostAfterimage);
      push(step.criticalSuccessAfterimage);
      push(step.criticalFailureAfterimage);
      for (const line of step.factorLines ?? []) push(line.text);
      for (const nudge of step.nudges ?? []) {
        push(nudge.name);
        push(nudge.fiction);
        push(nudge.effectLine);
        for (const fragment of Object.values(nudge.bandProse ?? {})) push(fragment);
      }
    }
  }

  for (const variant of template.traitVariants ?? []) push(variant.factorLine);

  return parts.join(' ');
}

/** Word count on whitespace, the denominator for every density below. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/u).length;
}

// ─── Detectors ───────────────────────────────────────────────────────

function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

/** Occurrences of the vagueness lexicon, matched on word boundaries. */
export function countVagueness(text: string): number {
  let total = 0;
  for (const term of AUDIT_VAGUENESS_TERMS) {
    const matches = text.match(new RegExp(`\\b${escapeRegExp(term)}\\b`, 'giu'));
    total += matches ? matches.length : 0;
  }
  return total;
}

/** Occurrences of the abstract-noun suffix proxy. */
export function countAbstractNouns(text: string): number {
  return (text.match(ABSTRACT_NOUN_PATTERN) ?? []).length;
}

/** Second-person pronouns. Only meaningful on mortal-drawn templates. */
export function countSecondPerson(text: string): number {
  return (text.match(SECOND_PERSON_PATTERN) ?? []).length;
}

/**
 * not-X-but-Y constructions, one hit maximum per sentence — a sentence that
 * trips three of the five patterns is one annotation, not three.
 */
export function countNotXButY(text: string): number {
  const sentences = text.split(/(?<=[.!?])\s+/u);
  let total = 0;
  for (const sentence of sentences) {
    if (NOT_X_BUT_Y_PATTERNS.some(pattern => pattern.test(sentence))) total += 1;
  }
  return total;
}

// ─── Report ──────────────────────────────────────────────────────────

export interface NudgeAuditScores {
  readonly templateId: string;
  readonly words: number;
  /** Abstract nouns per 100 words. */
  readonly abstractDensity: number;
  /** Vagueness-lexicon hits per 100 words. */
  readonly vaguenessDensity: number;
  readonly notXButY: number;
  readonly secondPerson: number;
  /** True when the template is mortal-drawn, i.e. `actorAffinities` omits `ascendant`. */
  readonly mortalDrawn: boolean;
  /** Which thresholds this template trips. Empty ⇒ clean. */
  readonly failures: readonly string[];
}

function density(count: number, words: number): number {
  return words === 0 ? 0 : Number(((count / words) * 100).toFixed(2));
}

/** Score one template against all five thresholds. Pure. */
export function auditTemplate(template: UnifiedActionTemplate): NudgeAuditScores {
  const text = collectTemplateText(template);
  const words = countWords(text);
  const abstractDensity = density(countAbstractNouns(text), words);
  const vaguenessDensity = density(countVagueness(text), words);
  const notXButY = countNotXButY(text);
  const secondPerson = countSecondPerson(text);
  const mortalDrawn = !(template.actorAffinities ?? []).includes('ascendant');

  const failures: string[] = [];
  if (abstractDensity >= ABSTRACT_DENSITY_FAIL) {
    failures.push(`abstraction ${abstractDensity}/100w (>= ${ABSTRACT_DENSITY_FAIL})`);
  }
  if (vaguenessDensity >= VAGUENESS_DENSITY_FAIL) {
    failures.push(`vagueness ${vaguenessDensity}/100w (>= ${VAGUENESS_DENSITY_FAIL})`);
  }
  if (notXButY >= NOT_X_BUT_Y_FAIL) {
    failures.push(`not-X-but-Y x${notXButY} (>= ${NOT_X_BUT_Y_FAIL})`);
  }
  if (words < THIN_PREMISE_WORDS) {
    failures.push(`thin premise ${words}w (< ${THIN_PREMISE_WORDS})`);
  }
  if (mortalDrawn && secondPerson >= SECOND_PERSON_FAIL) {
    failures.push(`second person x${secondPerson} on mortal-drawn (>= ${SECOND_PERSON_FAIL})`);
  }

  return {
    templateId: template.id,
    words,
    abstractDensity,
    vaguenessDensity,
    notXButY,
    secondPerson,
    mortalDrawn,
    failures,
  };
}
