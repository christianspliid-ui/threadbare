/**
 * THR-1107 — encounter prose must be grammatical in BOTH pronoun arms.
 *
 * `{they}` / `{them}` / `{their}` are actor-bound pronoun tokens and `{s}` is the
 * present-tense agreement suffix that must accompany a verb following them. A line
 * authored `{they} stop` renders correctly as *"they stop"* in the they/them arm and
 * ungrammatically as **"she stop"** in the he/she arm. The player reads the broken form.
 *
 * Why no existing instrument found this class:
 *
 *  - The `{adj}`/`{verb}`/`{noun}`/`{action}` token scan that drove the THR-1101 campaign
 *    is blind to it — most of these lines carry no word-pool token at all.
 *  - Reading the template source does not reveal it: `{they} stop` looks correct on the
 *    page. The defect exists only after substitution, and only in one pronoun arm.
 *  - The suite was green on every one of them. Nothing asserted pronoun-arm grammar.
 *
 * It is visible only by rendering each field through `enrichProse` in a he/she arm and
 * inspecting the output, which is what this file does.
 */

import { describe, it, expect } from 'vitest';
import { enrichProse } from '../proseEnrichment';
import type { NarrativeContext } from '../proseEnrichment';
import { ENCOUNTER_TEMPLATES } from '../../data/encounter-content';

/**
 * The he/she arm. The they/them arm is grammatical by construction for these lines —
 * the defect only exists where the pronoun takes singular agreement.
 */
function heSheCtx(): NarrativeContext {
  return {
    agentName: 'Syntar',
    agentId: 'agent_syntar',
    archetypeId: 'rebel',
    cultureName: 'The Aurelians',
    primaryReach: 'iron',
    titles: [],
    notableArtifacts: [],
    strongAllies: [],
    rivals: [],
    currentLocationName: 'The Shattered Sanctum',
    completedPhases: [],
    beatHistory: [],
    pronouns: { they: 'she', them: 'her', their: 'her', s: 's' },
  };
}

// ─── The classifier ───────────────────────────────────────────────
//
// Everything below decides one question: given a `she`/`he` subject, is the verb that
// follows it in third-person-singular agreement? The sets are the whole of the judgment,
// so each one carries what it is for. Widening one is a claim about English, not a way to
// quiet a failing line — the fix for a red run is almost always the prose.

/**
 * Adverbs may sit between the subject and its verb: "she *actually* want", "she *quietly*
 * hold". Scanning only the adjacent token is what let `garrison_gossip[1].scene` through
 * the sweep that produced this ticket's original enumeration — the adjacent word was
 * `actually`, an adverb, and the bare verb sat one token downstream. Anything ending in
 * `-ly` counts, plus these, which do not.
 */
const INTERVENING_ADVERBS = new Set([
  'then', 'now', 'still', 'also', 'just', 'never', 'always', 'often', 'sometimes',
  'already', 'again', 'once', 'soon', 'only', 'even', 'rather', 'perhaps', 'maybe',
  'first', 'later', 'back', 'no', 'not', 'well', 'far', 'long', 'ever', 'almost',
]);

/**
 * Words that occupy the slot after a subject without being its verb: "she *and* her
 * brother", "she *who* asked". Not a defect — there is no agreement to get wrong.
 */
const NON_VERB_FOLLOWERS = new Set([
  'and', 'or', 'but', 'who', 'whom', 'whose', 'that', 'which', 'if', 'when', 'while',
  'because', 'than', 'as', 'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'from',
  'alone', 'too', 'either', 'neither', 'both', 'yet', 'so',
]);

/**
 * Modals and auxiliaries take no `-s`: "she can go", "she would want", "she did not".
 * `is` / `was` / `has` / `does` are already singular and are caught by the `-s` rule, but
 * are listed for readability.
 */
const MODALS_AND_AUXILIARIES = new Set([
  'can', 'cannot', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  'ought', 'did', 'had', 'was', 'is', 'has', 'does',
]);

/**
 * Past-tense forms that carry neither `-ed` nor `-s`. Correct after a singular subject,
 * and the bulk of what a naive "subject + word not ending in -s" scan misreports — the
 * original sweep for this ticket flagged 52 lines of which 31 were exactly this shape
 * ("he demanded", "she spent") plus adverbs.
 *
 * `were` is deliberately ABSENT: it is the *plural* past, so "she were" is the defect this
 * file exists to catch. Same for `are`, `have` and `do` — the singular forms are `is`,
 * `has`, `does`.
 */
const IRREGULAR_PAST = new Set([
  'was', 'had', 'did', 'said', 'made', 'went', 'came', 'took', 'gave', 'found', 'held',
  'left', 'brought', 'caught', 'thought', 'saw', 'knew', 'felt', 'kept', 'ran', 'won',
  'lost', 'sent', 'met', 'told', 'heard', 'drew', 'threw', 'stood', 'began', 'broke',
  'wrote', 'woke', 'rose', 'wore', 'bore', 'swore', 'tore', 'froze', 'paid', 'sat',
  'slept', 'spent', 'built', 'dealt', 'meant', 'spoke', 'chose', 'bought', 'sold',
  'taught', 'fought', 'sought', 'hung', 'dug', 'lay', 'knelt', 'crept', 'wept', 'swept',
  'leapt', 'dreamt', 'burnt', 'learnt', 'shook', 'drove', 'rode', 'ate', 'drank', 'sang',
  'sank', 'swam', 'flew', 'grew', 'blew', 'fell', 'bent', 'lent', 'bound', 'wound',
  'ground', 'strode', 'clung', 'stuck', 'struck', 'shone', 'shot', 'sprang', 'stung',
  // ─── Ambiguous: identical in present and past ───
  // "she put" is a defect if present tense and correct if past, and no regex can tell
  // which. They are treated as past, so this guard UNDER-reports on them by design. The
  // alternative — flagging them — reports a false positive on every correct past-tense
  // use, which is the failure mode that gets a guard softened until it means nothing.
  'hit', 'cut', 'put', 'let', 'set', 'shut', 'read', 'cost', 'hurt', 'burst', 'cast',
  'spread', 'split', 'quit', 'bet', 'fit',
]);

/**
 * Forms that are defects outright: the plural/base of a verb whose singular is irregular.
 * `{s}` is a suffix and cannot reach any of them — "are" needs "is", "have" needs "has",
 * "were" needs "was", "do" needs "does". The repair is always to rephrase.
 */
const NO_INPLACE_FIX = new Set(['are', 'have', 'were', 'do']);

/**
 * `{s}` appends a bare "s", so it is only a correct repair for verbs whose third-person
 * singular IS base+s. Four classes it silently breaks, all of them present in this corpus:
 *
 *   sibilant (-s -x -z -ch -sh)  reach → "reachs"   (wants "reaches")
 *   -y after a consonant         carry → "carrys"   (wants "carries")
 *   -o                           go    → "gos"      (wants "goes")
 *   irregular (NO_INPLACE_FIX)   are   → "ares"
 *
 * A guard that recommends `{s}` as the universal remedy trades this defect for a spelling
 * one, so the failure message names the classes rather than prescribing a fix. Lines in
 * these classes were repaired by dropping the pronoun subject and naming the actor.
 */
const S_SUFFIX_UNSAFE = /(?:[sxz]|ch|sh|[^aeiou]y|o)$/;

/**
 * Walk every string on a template.
 *
 * Deliberately NOT a hand-maintained list of field names. The sweep this ticket inherited
 * from THR-1036 named seven fields, which meant it never looked at `factorLines[].text`,
 * `traitVariants[].factorLine`, or any part of a nudge card (`fiction`, `effectLine`,
 * `bandProse.*`) — all player-facing prose, and all carrying instances of this defect. A
 * field list goes vacuous the moment content grows a new prose field; a recursive walk
 * cannot.
 */
function collectStrings(node: unknown, path: string, out: Array<[string, string]>): void {
  if (typeof node === 'string') {
    if (node.length > 0) out.push([path, node]);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) collectStrings(v, path ? `${path}.${k}` : k, out);
  }
}

/** The verb following a `she`/`he` subject, with intervening adverbs skipped. */
function verbAfterSubject(words: string[], subjectIndex: number): string | null {
  for (let i = subjectIndex + 1; i < words.length && i <= subjectIndex + 4; i++) {
    const w = words[i];
    if (!w) continue;
    if (w.endsWith('ly') || INTERVENING_ADVERBS.has(w)) continue;
    return w;
  }
  return null;
}

function isAgreementDefect(verb: string): boolean {
  if (NO_INPLACE_FIX.has(verb)) return true;
  if (NON_VERB_FOLLOWERS.has(verb)) return false;
  if (MODALS_AND_AUXILIARIES.has(verb)) return false;
  if (IRREGULAR_PAST.has(verb)) return false;
  if (verb.endsWith('s')) return false; // third-person singular, or is/was/has/does
  if (verb.endsWith('ed')) return false; // regular past
  return true;
}

/** Every `she`/`he` subject in the rendered line whose verb is not in singular agreement. */
function agreementDefects(rendered: string): string[] {
  const found: string[] = [];
  // Lowercased for lookup; the subject match is case-insensitive so a sentence-initial
  // `{They}` is in scope. Anchoring on lowercase `she`/`he` is what hid four of the
  // instances this ticket ships — "She are thrown clear", "She return with the outline",
  // "She were still on her knee", "She walk out whole".
  const words = rendered.toLowerCase().match(/[a-z']+/g) ?? [];
  for (let i = 0; i < words.length; i++) {
    if (words[i] !== 'she' && words[i] !== 'he') continue;
    const verb = verbAfterSubject(words, i);
    if (verb && isAgreementDefect(verb)) found.push(`${words[i]} ${verb}`);
  }
  return found;
}

// ─── Classifier unit tests ────────────────────────────────────────
//
// The corpus sweep below is only as good as the classifier, and a classifier asserted
// solely by a green corpus sweep is asserted by nothing. These pin both directions.

describe('pronoun-agreement classifier', () => {
  it('flags a bare present verb after a singular subject', () => {
    expect(agreementDefects('By the time she stop, the room decided.')).toEqual(['she stop']);
  });

  it('flags the forms that {s} cannot repair', () => {
    expect(agreementDefects('She are thrown clear.')).toEqual(['she are']);
    expect(agreementDefects('Every competitor she have put down.')).toEqual(['she have']);
    expect(agreementDefects('She were still on her knee.')).toEqual(['she were']);
    expect(agreementDefects('She do not look at it.')).toEqual(['she do']);
  });

  it('flags a bare verb separated from its subject by an adverb', () => {
    // The miss that motivated widening the predicate (THR-1101 batch 13 reconciliation).
    expect(agreementDefects('the talk toward what she actually want to know'))
      .toEqual(['she want']);
  });

  it('flags a sentence-initial subject', () => {
    expect(agreementDefects('She return with the outline of it.')).toEqual(['she return']);
  });

  it('accepts correct third-person singular', () => {
    expect(agreementDefects('She stops having to keep the count.')).toEqual([]);
    expect(agreementDefects('He gives ground across the circle.')).toEqual([]);
  });

  it('accepts past tense — regular and irregular', () => {
    expect(agreementDefects('He demanded it and she spent the month on it.')).toEqual([]);
    expect(agreementDefects('She lay down and he went back.')).toEqual([]);
    expect(agreementDefects('She knelt long enough that he stood up.')).toEqual([]);
  });

  it('accepts modals and auxiliaries', () => {
    expect(agreementDefects('She can name eleven, and he would want that.')).toEqual([]);
    expect(agreementDefects('She did not bring it. He has it.')).toEqual([]);
  });

  it('accepts an adverb followed by a correct verb', () => {
    expect(agreementDefects('She privately agrees with the ruling.')).toEqual([]);
    expect(agreementDefects('She never saw the latch.')).toEqual([]);
  });

  it('does not treat a non-verb follower as a verb', () => {
    expect(agreementDefects('She and her brother came in.')).toEqual([]);
    expect(agreementDefects('the one she took to be a friend')).toEqual([]);
  });

  it('knows which verbs {s} cannot repair', () => {
    // The two unsafe sets are disjoint and cover different ground, which is the whole
    // reason both exist. Morphological: the third-person singular is not base+s.
    for (const verb of ['reach', 'finish', 'carry', 'go', 'do']) {
      expect(S_SUFFIX_UNSAFE.test(verb)).toBe(true);
    }
    // Irregular: `are`/`have`/`were` end in a vowel and slip past the morphology, so the
    // suffix rule alone would call them repairable and produce "ares"/"haves"/"weres".
    for (const verb of ['are', 'have', 'were']) {
      expect(S_SUFFIX_UNSAFE.test(verb)).toBe(false);
      expect(NO_INPLACE_FIX.has(verb)).toBe(true);
    }
    // Safe: these took `{s}` in place, and every one of them is a repair this ticket made.
    for (const verb of ['stop', 'return', 'turn', 'sit', 'walk', 'name', 'kneel', 'know',
      'stand', 'keep', 'look', 'ask', 'kick', 'bring', 'get', 'rise', 'set']) {
      expect(S_SUFFIX_UNSAFE.test(verb)).toBe(false);
      expect(NO_INPLACE_FIX.has(verb)).toBe(false);
    }
  });
});

// ─── Corpus-wide regression lock ──────────────────────────────────

describe('THR-1107 regression lock — encounter prose agrees in the he/she arm', () => {
  it('no encounter template renders a subject-verb disagreement for a he/she agent', () => {
    const ctx = heSheCtx();
    const breaks: string[] = [];

    for (const template of ENCOUNTER_TEMPLATES) {
      const fields: Array<[string, string]> = [];
      collectStrings(template, '', fields);

      for (const [path, field] of fields) {
        // Only pronoun-bearing prose can break in one arm and not the other. Skipping the
        // rest keeps the sweep honest: a `she` occurring in authored prose about some
        // other woman is not an agreement defect of this class.
        if (!/\{They\}|\{they\}/.test(field)) continue;
        for (const defect of agreementDefects(enrichProse(field, ctx))) {
          breaks.push(`${template.id} ${path}: "${defect}"`);
        }
      }
    }

    // On a failure the repair is the prose, not this list. `{they} stand` becomes
    // `{they} stand{s}` — but ONLY when the verb's third-person singular is base+s.
    // Check the verb against S_SUFFIX_UNSAFE first: sibilant, `-y`, `-o` and the
    // irregulars all need the pronoun subject dropped and the actor named instead.
    expect(breaks).toEqual([]);
  });
});
