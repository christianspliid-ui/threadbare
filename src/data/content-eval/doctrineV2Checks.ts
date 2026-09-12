/**
 * Prose Doctrine v2 structural checks — card-name shape, the opening skeleton,
 * and the chip sentence. THR-1224, extended by THR-1473.
 *
 * Contract: `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`
 * § *Prose doctrine v2 — narrator mode (hard rules)*. Where this file and that
 * section disagree, the spec is the contract and this file is the bug.
 *
 * ─── Why a module of its own ─────────────────────────────────────────
 * These belong to the same warn channel as `auditTemplate().warnings` and would
 * naturally live beside it in `nudgeAuditDetectors.ts`. They cannot: that module
 * is the vagueness lexicon's single authority, and `nudgeAuthoringConstants.ts`
 * imports *from* it to derive the scoped term lists. A detector that reads a
 * word budget would close that loop into an import cycle whose safety depended
 * on nobody ever reading a constant at module-init time. One more file is
 * cheaper than a cycle that works until it doesn't.
 *
 * So the dependency stays one-way — this module reads constants, the constants
 * read the lexicon — and `check:encounter` merges both lists into one warn
 * channel at the point of report.
 *
 * THR-1473 added one more edge, `compositionContract` → here being the direction
 * that would close a cycle and **this** being the one that does not:
 * `compositionContract.ts` imports the constants and the hand checklists and has
 * never imported this module. The chip-sentence check reuses its `aftermathFaces`
 * walk rather than re-deriving the (variant × band) resolution — a second walk
 * over the same config is a second answer waiting to drift from the first.
 *
 * ─── Warn-level, and what that means here ────────────────────────────
 * Nothing in this file fails a build. Both checks are *register* judgments —
 * "this name reads as a mood, not an instruction", "this opening is one
 * paragraph where the skeleton wants three" — and a register judgment that
 * fails CI would have to be right every time. These are right most of the time,
 * which is exactly the bar for a warning and nowhere near the bar for a gate.
 *
 * The corpus is expected to warn heavily until the doctrine-v2 rewrite lands
 * (THR-1223). That is the checks working: before the rewrite they measure the
 * gap, after it they hold the line.
 *
 * ─── Placement ───────────────────────────────────────────────────────
 * Authoring-time policy, read by scripts and tests, never by a gameplay path.
 * Nothing under `src/components/**`, `src/engine/**` (outside tests), or the
 * tick loop may import it.
 */

import type { StepNudge, UnifiedActionTemplate } from '../../types/unifiedAction';
import {
  CHIP_OVERVIEW_OVERLAP_RUN_WORDS,
  NUDGE_OPENING_PARAGRAPHS_MAX,
  NUDGE_OPENING_PARAGRAPHS_MIN,
  NUDGE_WORD_BUDGETS,
} from './nudgeAuthoringConstants';
import { aftermathFaces } from './compositionContract';

// ─── Card-name shape (doctrine: imperative verb + noun) ──────────────

/**
 * Imperative verbs a card name may open with.
 *
 * **Deliberately an allowlist, and deliberately extensible by anyone who trips
 * it.** The alternative — recognising an imperative by shape — does not work in
 * English: `Seen`, `Left` and `Made` are participles that no suffix rule
 * separates from `Listen`, `Lift` and `Mark`, and an adjective-first name like
 * "Full Weight" has no wrong-looking morphology at all. A rule that catches
 * *most* fragment names silently blesses the rest, which is the partial-coverage
 * failure this project keeps re-finding: a guard that reports clean on the cases
 * it cannot see reads exactly like a guard that found nothing wrong.
 *
 * So the check is **total** instead. An opener in this list is clean; every
 * other opener produces a warning, and the warning for an unrecognised word
 * names this constant and asks for it to be added. A genuine verb missing from
 * the list costs one line of output and a one-word commit — cheap, and it makes
 * the lexicon grow toward completeness through use rather than through someone
 * imagining the vocabulary up front.
 *
 * Sorted for diffability. Lowercase; matching is case-insensitive.
 */
export const IMPERATIVE_VERB_LEXICON: readonly string[] = [
  'admit', 'anchor', 'aim', 'answer', 'arm', 'ask', 'bank', 'banish', 'bend', 'bind', 'blind',
  'blunt', 'bolster', 'break', 'bribe', 'bury', 'buy', 'calm', 'call', 'carry', 'cast',
  'catch', 'claim', 'clean', 'clear', 'close', 'cloud', 'cool', 'count', 'cover', 'crack', 'cut',
  'dampen', 'deepen', 'delay', 'deny', 'dim', 'divert', 'draw', 'drive', 'drop',
  'dull', 'ease', 'empty', 'end', 'even', 'expect', 'fan', 'feed', 'feel', 'fill', 'find', 'fix',
  'flood',
  'follow', 'force', 'free', 'freeze', 'gather', 'give', 'grant', 'guard',
  'guide', 'halt', 'harden', 'hasten', 'hide', 'hold', 'hound', 'keep', 'kindle',
  'lay', 'lead', 'lend', 'lift', 'light', 'listen', 'loose', 'loosen', 'mark', 'mend',
  'mean', 'move', 'name', 'nudge', 'offer', 'open', 'outlast', 'part', 'pay', 'pin', 'plant',
  'press', 'pull', 'push', 'quicken', 'quiet', 'raise', 'reach', 'read',
  'ready', 'remember', 'reveal', 'risk', 'root', 'rouse', 'salt', 'salvage', 'save', 'seal', 'seed',
  'sell', 'send', 'set', 'settle', 'shade', 'sharpen', 'shelter', 'shield',
  'shift', 'show', 'silence', 'slow', 'smother', 'soften', 'sound', 'spare',
  'speed', 'spend', 'split', 'spread', 'stall', 'stand', 'starve', 'steady',
  'steal', 'steer', 'stiffen', 'still', 'stir', 'stoke', 'stop', 'stretch', 'strike',
  'sway', 'sweeten', 'swell', 'take', 'tally', 'tame', 'tempt', 'test',
  'thicken', 'thin', 'throw', 'tie', 'tilt', 'trade', 'true', 'trust', 'turn', 'twist',
  'uncover', 'unmake',
  'veil', 'wait', 'wake', 'walk', 'ward', 'warm', 'warn', 'weigh', 'widen', 'win',
  'withhold', 'witness',
];

const IMPERATIVE_VERBS: ReadonlySet<string> = new Set(IMPERATIVE_VERB_LEXICON);

/**
 * Openers that make a name a *fragment* — a mood, a thing, or a clause — rather
 * than an instruction.
 *
 * Reported with a sharper message than an unrecognised word, because these are
 * never a missing-lexicon-entry problem: no imperative sentence in English
 * begins with `the`, `a`, `nothing` or `in`. "The Easier Way" and "Nothing More
 * Lost" are the shapes this list exists to name.
 *
 * **Membership rule, since the two lists must stay disjoint** (pinned by test):
 * a word belongs here only if it *cannot* open an imperative. Anything that can
 * — even when it usually doesn't — belongs in {@link IMPERATIVE_VERB_LEXICON}
 * instead, because the cost of the two errors is not symmetric. A false
 * "fragment" verdict tells an author their correct name is wrong and names no
 * remedy; a false "unrecognised verb" verdict tells them exactly what to do.
 * `still` was drafted here as an adverb and moved for exactly that reason: "Still
 * The Panic" is a card, and calling it a mood name would have been the check
 * being confidently wrong.
 */
export const FRAGMENT_NAME_OPENERS: readonly string[] = [
  'a', 'all', 'an', 'and', 'another', 'any', 'anything', 'as', 'at', 'both',
  'but', 'by', 'each', 'either', 'every', 'everything', 'for', 'from', 'he',
  'her', 'hers', 'his', 'how', 'i', 'if', 'in', 'into', 'it', 'its', 'less',
  'more', 'most', 'much', 'neither', 'no', 'none', 'not', 'nothing', 'of',
  'on', 'one', 'only', 'or', 'our', 'ours', 'out', 'over', 'she', 'so',
  'some', 'someone', 'something', 'than', 'that', 'the', 'their',
  'theirs', 'them', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'we', 'what', 'when', 'where', 'which', 'while',
  'who', 'why', 'with', 'without', 'yet', 'you', 'your', 'yours',
];

const FRAGMENT_OPENERS: ReadonlySet<string> = new Set(FRAGMENT_NAME_OPENERS);

/** Strip punctuation and case so `"Steady,"` and `Steady` compare equal. */
function normaliseWord(word: string): string {
  return word.replace(/[^\p{L}\p{N}'-]/gu, '').toLowerCase();
}

function wordsOf(text: string): string[] {
  return text.trim().split(/\s+/u).filter(Boolean);
}

/**
 * How one card name reads against the doctrine, or `undefined` when it reads as
 * an instruction.
 *
 * Two separate judgments, reported one per name so a batch report can group
 * them: the **shape** of the opener, and the **length** against
 * {@link NUDGE_WORD_BUDGETS.name}. A name can fail both; the opener is reported
 * first because it is the one that changes what the card *says*.
 */
export function cardNameShapeProblem(name: string): string | undefined {
  const words = wordsOf(name);
  if (words.length === 0) return 'name is empty';

  const opener = normaliseWord(words[0]);

  if (FRAGMENT_OPENERS.has(opener)) {
    return `name '${name}' opens with '${words[0]}' — a fragment/mood name, not an instruction `
      + '(doctrine v2: imperative verb + noun)';
  }

  if (!IMPERATIVE_VERBS.has(opener)) {
    return `name '${name}' opens with '${words[0]}', which is not a recognised imperative verb `
      + '— rewrite it as verb + noun, or add the verb to IMPERATIVE_VERB_LEXICON';
  }

  if (words.length > NUDGE_WORD_BUDGETS.name) {
    return `name '${name}' is ${words.length} words, over the doctrine budget of ${NUDGE_WORD_BUDGETS.name}`;
  }

  return undefined;
}

/** Every nudge card on a template, across every step. */
function templateNudges(template: UnifiedActionTemplate): readonly StepNudge[] {
  return (template.steps ?? []).flatMap(step => {
    const nudges = (step as { nudges?: readonly StepNudge[] }).nudges;
    return Array.isArray(nudges) ? nudges : [];
  });
}

/** Card-name warnings for one template. Empty ⇒ every name reads as an instruction. */
export function cardNameShapeProblems(template: UnifiedActionTemplate): readonly string[] {
  const problems: string[] = [];
  for (const nudge of templateNudges(template)) {
    const problem = cardNameShapeProblem(nudge.name);
    if (problem !== undefined) problems.push(`${nudge.id}: ${problem}`);
  }
  return problems;
}

// ─── The opening skeleton ────────────────────────────────────────────

/**
 * Surfaces that name a place by reading the graph.
 *
 * The doctrine asks P1 to state where the agent arrived using *real names from
 * the graph*, and the standing rule that prose may not invent game state
 * (2026-07-31) says where those names may come from: an enrichment token or a
 * bound cast key, never a literal the encounter made up. So a literal
 * capitalised place name is deliberately **not** accepted here — a scene that
 * names its own fortress has invented one, which is the defect, not the escape
 * hatch.
 *
 * `{frag:*}` counts: a fragment slot resolves to setting-specific text that is
 * itself authored against the same rule, and `check:encounter`'s token dry-run
 * already proves the slot exists.
 */
export const PLACE_NAMING_TOKEN_PATTERN = /\{(?:location|cast:[^}]+|frag:[^}]+)\}/u;

/**
 * Split an opening into paragraphs.
 *
 * Blank-line separated, which is how the authored strings carry the skeleton —
 * a template that concatenates its opening across source lines still produces
 * one runtime string, and only a real `\n\n` marks a paragraph break.
 */
export function openingParagraphs(text: string): readonly string[] {
  return text
    .split(/\n\s*\n/u)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);
}

/**
 * How one opening reads against the skeleton. Empty ⇒ it holds.
 *
 * Three judgments, in the order an author fixes them: the paragraph count (does
 * it have the skeleton at all), the budget (is it the right size), and whether
 * P1 names where the agent is.
 */
export function openingSkeletonProblems(text: string): readonly string[] {
  const problems: string[] = [];
  const paragraphs = openingParagraphs(text);

  if (paragraphs.length === 0) {
    return ['opening is empty'];
  }

  if (
    paragraphs.length < NUDGE_OPENING_PARAGRAPHS_MIN
    || paragraphs.length > NUDGE_OPENING_PARAGRAPHS_MAX
  ) {
    problems.push(
      `opening is ${paragraphs.length} paragraph${paragraphs.length === 1 ? '' : 's'}, outside the `
        + `skeleton's ${NUDGE_OPENING_PARAGRAPHS_MIN}–${NUDGE_OPENING_PARAGRAPHS_MAX} `
        + '(arrival · situation & complication · problem)',
    );
  }

  const words = wordsOf(text).length;
  if (words > NUDGE_WORD_BUDGETS.opening) {
    problems.push(
      `opening is ${words} words across all paragraphs, over the budget of ${NUDGE_WORD_BUDGETS.opening}`,
    );
  }

  if (!PLACE_NAMING_TOKEN_PATTERN.test(paragraphs[0])) {
    problems.push(
      'P1 names no place through a sanctioned surface — arrival needs a real graph name '
        + '({location}, {cast:<key>} or {frag:<slot>})',
    );
  }

  return problems;
}

/**
 * Opening warnings for every declared setting class on a template.
 *
 * Judged on the **composed** surface: the converter lands a declared class
 * opening above the first step's setting-neutral `narrativeTemplate`, so a
 * template that puts P1 in each opening and P2/P3 in the spine holds the
 * skeleton exactly as well as one that authors all three paragraphs per class.
 * Counting the opening field alone reported that architecture as "1 paragraph"
 * four times per template (THR-1223 batch 1 — the false-warning class this
 * composition removes).
 */
export function templateOpeningProblems(template: UnifiedActionTemplate): readonly string[] {
  const problems: string[] = [];
  const step0 = template.steps?.[0] as { narrativeTemplate?: string } | undefined;
  const spine = step0?.narrativeTemplate?.trim();
  for (const [settingClass, text] of Object.entries(template.openings ?? {})) {
    const composed = spine ? `${text}\n\n${spine}` : text;
    for (const problem of openingSkeletonProblems(composed)) {
      problems.push(`openings.${settingClass}: ${problem}`);
    }
  }
  return problems;
}

// ─── The chip sentence (THR-1473) ────────────────────────────────────

/**
 * The sentence a chip actually draws — `causeClause` then `detail`, exactly as
 * `EncounterVeil` composes them beside the tag.
 *
 * Joined with the em-dash the surface uses, so a word count here counts what the
 * player reads. Either half may be absent; a chip with neither has no sentence.
 */
export function chipSentenceOf(
  change: { readonly causeClause?: string; readonly detail?: string },
): string {
  return [change.causeClause?.trim(), change.detail?.trim()].filter(Boolean).join(' — ');
}

/**
 * Words in a chip's sentence, counted **per field and summed** rather than off
 * {@link chipSentenceOf}.
 *
 * The separator is punctuation the surface draws, not a word the player reads,
 * and `wordsOf` splits on whitespace — so counting the joined string prices every
 * two-field chip one word higher than the prose it contains and turns a budget of
 * 15 into an unannounced 14. Measured: the first re-authoring pass landed 15 chips
 * on exactly 16, every one of them 15 words of prose plus the em-dash.
 */
export function chipSentenceWordCount(
  change: { readonly causeClause?: string; readonly detail?: string },
): number {
  return [change.causeClause, change.detail]
    .map(field => (field?.trim() ? wordsOf(field).length : 0))
    .reduce((a, b) => a + b, 0);
}

/**
 * Normalised word runs of length `n`, for the overlap test.
 *
 * Punctuation and case are stripped through {@link normaliseWord} so *"twice.
 * They walk"* and *"twice — they walk"* are the same run, and enrichment tokens
 * are left intact as words: a `{cast:keeper}` shared between a chip and its
 * overview is a genuine repetition of the same named person, which is precisely
 * the retelling this looks for.
 */
function wordRuns(text: string, n: number): ReadonlySet<string> {
  const words = wordsOf(text).map(normaliseWord).filter(Boolean);
  const runs = new Set<string>();
  for (let i = 0; i + n <= words.length; i += 1) {
    runs.add(words.slice(i, i + n).join(' '));
  }
  return runs;
}

/**
 * THR-1473 — a chip's sentence is a **caption on a sheet entry**, not a second
 * telling of the ending.
 *
 * Two judgments, both warn-level, reported per `(face, change)`:
 *
 *   1. **Length** — `causeClause` + `detail` together, against
 *      {@link NUDGE_WORD_BUDGETS.chipSentence}. This field was the one
 *      player-facing prose surface with no budget row, and it grew to a median
 *      of 31 words because nothing ever reported it.
 *   2. **Redundancy** — any run of {@link CHIP_OVERVIEW_OVERLAP_RUN_WORDS} words
 *      the chip shares with the overview it renders under. The overview has
 *      already told the reader what happened; the chip's job is the *state that
 *      changed*, and a shared clause means it spent its budget re-telling the
 *      cause instead.
 *
 * **Scoped to categorised chips**, matching {@link
 * import('./compositionContract').chipStateNounWordingViolations}: an
 * uncategorised change is not drawn as a `CATEGORY · NOUN` tag with a caption
 * beside it, so neither judgment describes what the player sees.
 *
 * **Deduplicated by change id.** A change authored on a variant and inherited by
 * three bands is one authored sentence and gets one finding — the same rule the
 * chip-noun check applies, for the same reason: a report that scales with band
 * count tells an author to fix one line four times. The *overlap* arm is the
 * exception and is keyed by `(change, face)`, because the same sentence can be
 * clean under one band's overview and redundant under another's, and only the
 * face names which.
 *
 * Warn-level on purpose, and the clamp-follows-the-corpus rule says it stays
 * that way until the corpus is drained (`nudgeAuthoringConstants.ts`; the
 * THR-1225 lesson). THR-1473 drains the vertical slice; the retrofit corpus is
 * ticketed separately, so gating now would turn it red for work nobody has been
 * asked to do yet.
 */
export function chipSentenceProblems(template: UnifiedActionTemplate): readonly string[] {
  const problems: string[] = [];
  const lengthReported = new Set<string>();

  for (const face of aftermathFaces(template)) {
    const where = face.band ? `${face.variantKey}/${face.band}` : face.variantKey;
    const overviewRuns = wordRuns(face.overview, CHIP_OVERVIEW_OVERLAP_RUN_WORDS);

    for (const change of face.changes) {
      // Uncategorised changes draw no tag, so there is no caption to budget.
      if (!change.category) continue;
      const sentence = chipSentenceOf(change);
      if (!sentence) continue;

      const words = chipSentenceWordCount(change);
      if (words > NUDGE_WORD_BUDGETS.chipSentence && !lengthReported.has(change.id)) {
        lengthReported.add(change.id);
        problems.push(
          `change '${change.id}' on ${where} runs ${words} words `
            + `(budget ${NUDGE_WORD_BUDGETS.chipSentence}). A chip is a caption beside its tag — `
            + 'one clause of cause at most, then the change (THR-1473)',
        );
      }

      const shared = [...wordRuns(sentence, CHIP_OVERVIEW_OVERLAP_RUN_WORDS)]
        .filter(run => overviewRuns.has(run));
      if (shared.length > 0) {
        problems.push(
          `change '${change.id}' on ${where} retells its overview — shares `
            + `${shared.map(run => `'${run}'`).join(', ')}. The overview already told the reader `
            + 'what happened; the chip names the state that changed (THR-1473)',
        );
      }
    }
  }

  return problems;
}

// ─── The warn channel ────────────────────────────────────────────────

/**
 * Every doctrine-v2 structural warning for one template, in report order.
 *
 * Openings first: the opening is what a player reads before anything else, and
 * a template whose skeleton is missing is a bigger register problem than a card
 * whose name is a noun phrase.
 */
export function doctrineV2Warnings(template: UnifiedActionTemplate): readonly string[] {
  return [
    ...templateOpeningProblems(template).map(line => `[opening] ${line}`),
    ...cardNameShapeProblems(template).map(line => `[card name] ${line}`),
    ...chipSentenceProblems(template).map(line => `[chip sentence] ${line}`),
  ];
}
