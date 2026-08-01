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
 * So this module is the audit's appendix, transcribed. The regexes are copied
 * from that spec verbatim; where this file and the appendix disagree on a
 * *pattern*, the appendix is the contract and this file is the bug.
 *
 * ─── The lexicon is no longer the appendix's (THR-899) ───────────────
 * The vagueness lexicon is the one place this module now deliberately departs
 * from the appendix, and it is also the single authority for the term lists —
 * `nudgeAuthoringConstants.ts` re-exports from here rather than keeping a second
 * copy (THR-877's "name a single authority").
 *
 * The appendix ran one flat ~35-term list against the whole of a template's
 * prose. That conflated two different faults under one word, "vagueness", and
 * the looser half of it forced authors to contort plain sentences: "the stranger
 * is asking the room for them by name" exists only to dodge a banned `someone`,
 * while Christian's canonical example of *correct* prose — "someone is asking
 * around after the agent, and not in a good way" — trips the same list. A
 * detector that fails the reference sentence is measuring the wrong thing.
 *
 * So the terms are split by *intent* and enforced by *field class*. See
 * {@link ProseFieldClass}. Authority: `nudge-authoring-spec.md` § prose rubric
 * rule zero ("game prose, not novel prose") and rule 3 (the detectors target
 * evasive vagueness **in outcome prose**).
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
 * What kind of job a prose field is doing. Vagueness enforcement is scoped on
 * this, because the same word is a defect in one slot and the plainest available
 * English in another (THR-899).
 *
 * - `outcome` — what happened, after the dice: band base text and band
 *   fragments, all five afterimages, aftermath overviews, and
 *   `narrativeTemplates.success`/`.failure`. This is where an indefinite hides a
 *   result the player is owed, so **both** term sets are enforced at zero.
 * - `scene` — what the player is looking at, before choosing: openings, the
 *   spine/`initiation` narrative, step narratives, scene vignettes, and a card's
 *   `fiction`. Only the **evasive** set is enforced; a natural indefinite here is
 *   ordinary English and banning it buys nothing but contortion.
 * - `interactive` — labels and rules text: names, `effectLine`, factor lines,
 *   purpose lines. Evasive-only, same as `scene`. Their real guardrail is the
 *   `interactivePlainness` metric in `registerCompliance.ts`, which THR-899 left
 *   untouched.
 */
export type ProseFieldClass = 'outcome' | 'scene' | 'interactive';

/**
 * Evasive vagueness — the writer declining to say what happened. Enforced in
 * **every** field class, at zero.
 *
 * These do not have a plain-English defence. A hedge withholds the event, a
 * nominalised placeholder puts an abstraction in the subject slot where the
 * scene should be, and `something` is the canonical outcome-hider: *"it cost
 * them something"* has a sentence's shape and no result in it.
 *
 * Multi-word entries match as phrases; single words on word boundaries.
 */
export const EVASIVE_VAGUENESS_TERMS: readonly string[] = [
  // hedges — the event, held at arm's length
  'somehow', 'somewhat', 'seems to', 'appears to', 'a kind of', 'a sort of',
  'something like', 'in some way',
  // outcome-hider — the shape of a result with the result removed
  'something',
  // nominalised placeholders — an abstraction arriving in the subject slot
  'the situation', 'the matter', 'the moment', 'the atmosphere', 'the tension',
  'the dynamic', 'the connection', 'the understanding', 'the balance',
  'the energy', 'the presence', 'the experience', 'the process',
];

/**
 * Natural indefinites — ordinary English in scene setup, an evasion in outcome
 * prose. Enforced at zero in `outcome` only.
 *
 * "Someone is asking around after the agent, and not in a good way" is the
 * reference sentence for correct scene prose and it is built on one of these; a
 * detector that bans it everywhere is what produced the "asking the room for
 * them by name" contortions. But *after* the roll, "it cost them something" or
 * "they lost a thing" is the writer refusing to name the consequence, and the
 * player has no other source for it.
 *
 * The last six are the terms the older `VAGUENESS_LEXICON` carried and the audit
 * path never matched (THR-877's second trap). They are enforced here for the
 * first time, in outcome prose only — measured before adoption, per the blast
 * radius THR-877 required.
 */
export const NATURAL_INDEFINITE_TERMS: readonly string[] = [
  'someone', 'somewhere', 'things', 'stuff',
  'thing', 'way', 'ways', 'nothing', 'anything', 'whatever',
];

/**
 * Vague intensifiers — weak words everywhere, contortion-forcing nowhere.
 *
 * Reported as a **warning** in every field class and counted into no failure
 * (THR-899). They were previously inside the flat fail-counting list, which is
 * how "she felt it deeply" scored the same as "it cost them something".
 */
export const VAGUE_INTENSIFIERS: readonly string[] = [
  'very', 'really', 'quite', 'rather', 'truly', 'deeply', 'profoundly', 'utterly',
];

/**
 * Every term the scoped model knows, in one array. Exists so a test can pin the
 * partition — the three sets must stay disjoint and must cover this union, which
 * is what stops a term being quietly added to one list and dropped from another
 * (THR-877 scope item 3).
 */
export const ALL_VAGUENESS_TERMS: readonly string[] = [
  ...EVASIVE_VAGUENESS_TERMS,
  ...NATURAL_INDEFINITE_TERMS,
  ...VAGUE_INTENSIFIERS,
];

/** The terms enforced at zero for a given field class. */
export function vaguenessTermsFor(fieldClass: ProseFieldClass): readonly string[] {
  return fieldClass === 'outcome'
    ? [...EVASIVE_VAGUENESS_TERMS, ...NATURAL_INDEFINITE_TERMS]
    : EVASIVE_VAGUENESS_TERMS;
}

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
export interface ClassedProse {
  readonly text: string;
  readonly fieldClass: ProseFieldClass;
}

/**
 * The one walk. Emits every authored string **in the original sweep order**,
 * each tagged with the field class that decides how strictly it is read.
 *
 * Order matters and is load-bearing: {@link collectTemplateText} joins these
 * back in sequence, so the word count, the abstract-noun count and the
 * sentence-split the not-X-but-Y detector runs on are all byte-identical to what
 * they were before THR-899. That is what keeps every "before" score already
 * quoted as WS5 batch evidence comparable to the "after" ones. Bucketing by
 * class in a second, separate walk would have risked exactly that drift, which
 * is why there is only one traversal here.
 */
export function collectClassedTemplateProse(
  template: UnifiedActionTemplate,
): readonly ClassedProse[] {
  const parts: ClassedProse[] = [];
  const push = (v: unknown, fieldClass: ProseFieldClass): void => {
    if (typeof v === 'string' && v.trim().length > 0) parts.push({ text: v, fieldClass });
  };

  push(template.name, 'interactive');
  push(template.description, 'scene');
  push(template.narrativeTemplates?.initiation, 'scene');
  push(template.narrativeTemplates?.success, 'outcome');
  push(template.narrativeTemplates?.failure, 'outcome');

  for (const rawStep of template.steps ?? []) {
    // Branching steps carry their variants under `variants`/`fallback`; a plain
    // ActionStep carries the prose directly. Sweep both shapes fail-soft.
    const steps = 'branchOnStep' in rawStep
      ? [...Object.values(rawStep.variants), rawStep.fallback]
      : [rawStep];
    for (const step of steps) {
      push(step.narrativeTemplate, 'scene');
      push(step.purposeLine, 'interactive');
      // The five afterimages are the band base text a fragment appends to.
      push(step.successAfterimage, 'outcome');
      push(step.failureAfterimage, 'outcome');
      push(step.successAtCostAfterimage, 'outcome');
      push(step.criticalSuccessAfterimage, 'outcome');
      push(step.criticalFailureAfterimage, 'outcome');
      for (const line of step.factorLines ?? []) push(line.text, 'interactive');
      for (const nudge of step.nudges ?? []) {
        push(nudge.name, 'interactive');
        // `fiction` is the card's flavour body — scene-setting, not a result.
        push(nudge.fiction, 'scene');
        push(nudge.effectLine, 'interactive');
        for (const fragment of Object.values(nudge.bandProse ?? {})) push(fragment, 'outcome');
      }
    }
  }

  for (const variant of template.traitVariants ?? []) push(variant.factorLine, 'interactive');

  return parts;
}

export function collectTemplateText(template: UnifiedActionTemplate): string {
  return collectClassedTemplateProse(template)
    .map(part => part.text)
    .join(' ');
}

/** The same sweep, bucketed by field class. Each bucket is space-joined. */
export function collectTemplateTextByClass(
  template: UnifiedActionTemplate,
): Readonly<Record<ProseFieldClass, string>> {
  const buckets: Record<ProseFieldClass, string[]> = { outcome: [], scene: [], interactive: [] };
  for (const part of collectClassedTemplateProse(template)) {
    buckets[part.fieldClass].push(part.text);
  }
  return {
    outcome: buckets.outcome.join(' '),
    scene: buckets.scene.join(' '),
    interactive: buckets.interactive.join(' '),
  };
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

function countTerms(text: string, terms: readonly string[]): number {
  let total = 0;
  for (const term of terms) {
    const matches = text.match(new RegExp(`\\b${escapeRegExp(term)}\\b`, 'giu'));
    total += matches ? matches.length : 0;
  }
  return total;
}

/**
 * Occurrences of the vagueness terms enforced for `fieldClass`, matched on word
 * boundaries.
 *
 * **The scope argument is not optional in spirit.** It defaults to `outcome` —
 * the strictest reading — so a caller that has not thought about which slot its
 * text came from gets the old, conservative answer rather than a silent
 * loosening. Pass the real class; `scene` is what most authored prose is.
 *
 * Intensifiers are deliberately absent from this count in every class. They are
 * a warning, not a failure — see {@link countIntensifiers}.
 */
export function countVagueness(text: string, fieldClass: ProseFieldClass = 'outcome'): number {
  return countTerms(text, vaguenessTermsFor(fieldClass));
}

/** Occurrences of the intensifier list. Warn-level everywhere; never a failure. */
export function countIntensifiers(text: string): number {
  return countTerms(text, VAGUE_INTENSIFIERS);
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
  /** Intensifier hits across every field class. Warn-level — never a failure. */
  readonly intensifiers: number;
  /**
   * Where the vagueness hits landed (THR-899). Reported because the headline
   * density cannot distinguish "an indefinite in an afterimage" — a real defect
   * — from "an indefinite in scene setup", which is no longer counted at all.
   */
  readonly vaguenessByClass: Readonly<Record<ProseFieldClass, number>>;
  /** True when the template is mortal-drawn, i.e. `actorAffinities` omits `ascendant`. */
  readonly mortalDrawn: boolean;
  /** Which thresholds this template trips. Empty ⇒ clean. */
  readonly failures: readonly string[];
  /** Advisory signals that do not fail the template. */
  readonly warnings: readonly string[];
}

function density(count: number, words: number): number {
  return words === 0 ? 0 : Number(((count / words) * 100).toFixed(2));
}

/** Score one template against all five thresholds. Pure. */
export function auditTemplate(template: UnifiedActionTemplate): NudgeAuditScores {
  const text = collectTemplateText(template);
  const byClass = collectTemplateTextByClass(template);
  const words = countWords(text);
  const abstractDensity = density(countAbstractNouns(text), words);

  // Scoped, not flat: each bucket is read against the terms its own field class
  // enforces, and the densities are summed back over the whole template so the
  // headline number stays on the same scale as every pre-THR-899 batch score.
  const vaguenessByClass: Record<ProseFieldClass, number> = {
    outcome: countVagueness(byClass.outcome, 'outcome'),
    scene: countVagueness(byClass.scene, 'scene'),
    interactive: countVagueness(byClass.interactive, 'interactive'),
  };
  const vaguenessHits =
    vaguenessByClass.outcome + vaguenessByClass.scene + vaguenessByClass.interactive;
  const vaguenessDensity = density(vaguenessHits, words);
  const intensifiers = countIntensifiers(text);
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

  const warnings: string[] = [];
  if (intensifiers > 0) {
    warnings.push(`intensifiers x${intensifiers} (warn — weak words, not a failure)`);
  }

  return {
    templateId: template.id,
    words,
    abstractDensity,
    vaguenessDensity,
    notXButY,
    secondPerson,
    intensifiers,
    vaguenessByClass,
    mortalDrawn,
    failures,
    warnings,
  };
}
