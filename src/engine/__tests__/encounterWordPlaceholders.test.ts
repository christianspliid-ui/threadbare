/**
 * THR-1036 — the encounter corpus's bare word-pool placeholders must never reach a player.
 *
 * Law 43: "Placeholders never leak. Every player-facing string passes enrichment; a raw
 * `{token}` reaching a screen is a released defect with a regression lock." This file is
 * that lock for the `{adj}` / `{verb}` / `{verb}s` / `{noun}` / `{action}` family.
 *
 * The defect: a resolver for these tokens existed (`resolveEncounterNarrative`) with zero
 * callers, while `enrichProse()` — the function `chapterArchive.ts` actually calls to
 * render encounter prose — had never learned them. 153 of 168 encounter templates use the
 * tokens, so they shipped raw.
 */

import { describe, it, expect } from 'vitest';
import { enrichProse } from '../proseEnrichment';
import type { NarrativeContext } from '../proseEnrichment';
import {
  resolveWordPoolTokens,
  encounterToneTierForThreat,
  ENCOUNTER_TONE_ADJECTIVES,
  ENCOUNTER_VERB_POOL,
  DEFAULT_ENCOUNTER_TONE_TIER,
  thirdPersonSingular,
} from '../../data/encounter-words';
import { ENCOUNTER_TEMPLATES } from '../../data/encounter-content';
import { isActionStepBranch, type ActionStep } from '../../types/unifiedAction';

/** Every bare word-pool token the encounter corpus uses. */
const WORD_POOL_TOKEN = /\{adj\}|\{verb\}|\{noun\}|\{action\}/;

function ctx(overrides?: Partial<NarrativeContext>): NarrativeContext {
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
    pronouns: { they: 'they', them: 'them', their: 'their', s: 's' },
    ...overrides,
  };
}

// ─── resolveWordPoolTokens ────────────────────────────────────────

describe('resolveWordPoolTokens', () => {
  it('conjugates {verb}s to a base-form verb plus s', () => {
    const out = resolveWordPoolTokens('The court {verb}s the accusation.', 'seed');
    expect(out).not.toMatch(WORD_POOL_TOKEN);
    // The authored "s" must be consumed by the token, never left stranded.
    expect(out).not.toContain('s the accusation.s');
    const verb = out.match(/The court (\w+) the accusation\./)?.[1];
    expect(verb).toBeDefined();
    expect(ENCOUNTER_VERB_POOL).toContain(verb!.replace(/s$/, ''));
  });

  it('leaves a bare {verb} in base form — its subject is plural', () => {
    // The corpus writes `{verb}s` for singular subjects and bare `{verb}` for plural
    // ones ("the merchants {verb} in anger"). Conjugating the bare form is what
    // produced "They trembles a sentence".
    const out = resolveWordPoolTokens('The merchants {verb} in anger.', 'seed');
    expect(out).not.toMatch(WORD_POOL_TOKEN);
    const verb = out.match(/The merchants (\w+) in anger\./)?.[1];
    expect(ENCOUNTER_VERB_POOL).toContain(verb);
  });

  it('spells the third-person singular correctly for sibilant verbs', () => {
    expect(thirdPersonSingular('flash')).toBe('flashes');
    expect(thirdPersonSingular('stir')).toBe('stirs');
    expect(thirdPersonSingular('surge')).toBe('surges');
    // No pool verb produces the naive "flashs" any more.
    for (const v of ENCOUNTER_VERB_POOL) {
      expect(thirdPersonSingular(v)).not.toMatch(/(s|x|z|ch|sh)s$/);
    }
  });

  it('gives repeated {adj} in one sentence different adjectives', () => {
    // This is the property a single-word substitution (the narrative.ts shape) lacks,
    // and why the sphere-vocabulary resolver is the wrong one to reuse here.
    const out = resolveWordPoolTokens(
      '{actor} faces their {adj} accuser in {adj} combat.',
      'trial_by_combat.combat',
    );
    const adjectives = ENCOUNTER_TONE_ADJECTIVES[DEFAULT_ENCOUNTER_TONE_TIER];
    const used = adjectives.filter(a => out.includes(a));
    expect(used.length).toBeGreaterThan(1);
  });

  it('is deterministic for the same seed and varies across seeds', () => {
    const line = '{actor} meets a {adj} end.';
    expect(resolveWordPoolTokens(line, 'a')).toBe(resolveWordPoolTokens(line, 'a'));
    // Not a guarantee for every pair, but these two seeds land on different pool slots.
    const seeds = ['a', 'b', 'c', 'd', 'e', 'f'].map(s => resolveWordPoolTokens(line, s));
    expect(new Set(seeds).size).toBeGreaterThan(1);
  });

  it('leaves prose without word-pool tokens untouched', () => {
    const line = 'The bridge groans under the weight of the crossing.';
    expect(resolveWordPoolTokens(line, 'seed')).toBe(line);
  });

  it('selects the tone tier from threat rating, falling back to the neutral tier', () => {
    expect(encounterToneTierForThreat('trivial')).toBe('early');
    expect(encounterToneTierForThreat('deadly')).toBe('late');
    expect(encounterToneTierForThreat('moderate')).toBe(DEFAULT_ENCOUNTER_TONE_TIER);
    expect(encounterToneTierForThreat(undefined)).toBe(DEFAULT_ENCOUNTER_TONE_TIER);
  });

  it('uses the requested tier for {adj}', () => {
    const out = resolveWordPoolTokens('a {adj} trial', 'seed', 'late');
    expect(ENCOUNTER_TONE_ADJECTIVES.late.some(a => out.includes(a))).toBe(true);
  });
});

// ─── enrichProse learns the tokens ────────────────────────────────

describe('enrichProse resolves word-pool placeholders (THR-1036)', () => {
  it('resolves the exact line from the ticket evidence', () => {
    // Verbatim from THR-1036's getChapterArchive() capture.
    const out = enrichProse(
      "{actor}'s {adj} response to the accusation {verb}s the court's {adj} attention.",
      ctx(),
    );
    expect(out).not.toMatch(WORD_POOL_TOKEN);
    expect(out).toContain('Syntar');
  });

  it('resolves tokens spliced in beside already-working ones', () => {
    const out = enrichProse('{actor} faces {their} {adj} accuser.', ctx());
    expect(out).not.toMatch(WORD_POOL_TOKEN);
    expect(out).toBe(out.replace(/\{[^}]*\}/g, '')); // no raw token of any kind survives
  });

  it('is stable across re-renders of the same line for the same agent', () => {
    // An archived chapter re-read must say what it said the first time (NFP #3).
    const line = 'The court must {adj} rule on {actor}\'s fate.';
    const first = enrichProse(line, ctx());
    // Assert the token is gone as well as stable — two raw renders are also "identical",
    // so equality alone is a lever that cannot fail.
    expect(first).not.toMatch(WORD_POOL_TOKEN);
    expect(enrichProse(line, ctx())).toBe(first);
  });

  it('honours an explicit tone tier from the context', () => {
    const out = enrichProse('a {adj} trial', ctx({ encounterToneTier: 'late' }));
    expect(ENCOUNTER_TONE_ADJECTIVES.late.some(a => out.includes(a))).toBe(true);
  });
});

// ─── Corpus-wide regression lock ──────────────────────────────────

describe('Law 43 regression lock — no encounter template leaks a word-pool token', () => {
  /** Every player-facing prose field a template can carry. */
  function proseFields(template: (typeof ENCOUNTER_TEMPLATES)[number]): string[] {
    const out: string[] = [];
    const push = (v: unknown) => { if (typeof v === 'string' && v.length > 0) out.push(v); };

    push(template.narrativeTemplates?.initiation);
    push(template.narrativeTemplates?.success);
    push(template.narrativeTemplates?.failure);

    // On the unified template a step's authored success/failure prose has become its
    // *afterimages* (`onSuccess`/`onFailure` are GraphOps by then) — these are the
    // fields `chapterArchive.buildStepRecord` renders, and `afterimageProse` is exactly
    // where the ticket's evidence caught the raw tokens.
    const pushStep = (step: ActionStep) => {
      push(step.narrativeTemplate);
      push(step.purposeLine);
      push(step.successAfterimage);
      push(step.failureAfterimage);
      push(step.successAtCostAfterimage);
      push(step.criticalSuccessAfterimage);
      push(step.criticalFailureAfterimage);
    };

    for (const step of template.steps ?? []) {
      // A branching step holds its prose inside its variants and fallback, so sweeping
      // only the concrete steps would silently skip them.
      if (isActionStepBranch(step)) {
        for (const variant of Object.values(step.variants)) pushStep(variant);
        pushStep(step.fallback);
      } else {
        pushStep(step);
      }
    }
    return out;
  }

  it('the corpus does carry these tokens — the sweep is not vacuous', () => {
    // Guards against the empty-population pass: if the corpus ever stops using the
    // tokens, this assertion fails loudly rather than the sweep below passing on nothing.
    const withTokens = ENCOUNTER_TEMPLATES.filter(t =>
      proseFields(t).some(f => WORD_POOL_TOKEN.test(f)),
    );
    expect(withTokens.length).toBeGreaterThan(50);
  });

  it('no enriched prose field in any encounter template contains a raw word-pool token', () => {
    const leaks: string[] = [];

    for (const template of ENCOUNTER_TEMPLATES) {
      for (const field of proseFields(template)) {
        const enriched = enrichProse(field, ctx());
        if (WORD_POOL_TOKEN.test(enriched)) {
          leaks.push(`${template.id}: ${enriched}`);
        }
      }
    }

    expect(leaks).toEqual([]);
  });

  it('no enriched prose field contains a raw token of ANY shape', () => {
    // Law 43's actual wording is "a raw `{token}` reaching a screen", not "a raw token
    // from this particular family". Widening the lock to every `{...}` is what caught
    // the last stragglers: `{themselves}` (a real pronoun the enricher had never
    // learned) and three authoring typos that had put braces around ordinary English
    // words — `{the}`, `{can}`, `{defeated}`.
    const leaks: string[] = [];

    for (const template of ENCOUNTER_TEMPLATES) {
      for (const field of proseFields(template)) {
        const enriched = enrichProse(field, ctx());
        for (const match of enriched.matchAll(/\{[^}]*\}/g)) {
          leaks.push(`${template.id}: ${match[0]} in "${enriched}"`);
        }
      }
    }

    expect(leaks).toEqual([]);
  });
});
