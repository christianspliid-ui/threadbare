/**
 * Reveal-family liveness guard (THR-844).
 *
 * A hidden mark's `revealFamilies` decides which encounters can ever surface it. Matching runs
 * through `familyMatchesTemplate`, so a family that resolves to no live template makes the mark
 * unrevealable by construction — it is placed, it decays, and nothing ever brings it up.
 *
 * That was the shipped state: 67 of 115 distinct family literals matched zero templates, and 42
 * of 136 authored entries named *only* dead families. Nothing caught it because a dead family is
 * indistinguishable from an unlucky one at runtime — the mark just never reveals.
 *
 * This is the check that would have caught it at authoring time. It is deliberately structured
 * so the population is pinned before anything is asserted about it: a guard that walks an empty
 * corpus passes vacuously and reads exactly like a guard that works.
 */

import { describe, it, expect } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { REVEAL_FAMILY_ALIASES, resolveRevealFamily } from '../../data/reveal-family-aliases';
import { familyMatchesTemplate } from '../hiddenMarks';
import { FAILURE_ARTIFACT_REVEAL_FAMILIES } from '../failureStoryArtifact';
import { CURSE_MARK_REVEAL_FAMILIES } from '../../data/ascendant-expression-constants';

// ─── Population ───────────────────────────────────────────────────

const TEMPLATE_IDS: readonly string[] = UNIFIED_ACTION_TEMPLATES.map(t => t.id);

/** Walk the shipped pool collecting every `revealFamilies` array an aftermath effect carries. */
function collectAuthoredFamilyArrays(root: unknown): string[][] {
  const out: string[][] = [];
  const seen = new Set<unknown>();
  const walk = (v: unknown): void => {
    if (v === null || typeof v !== 'object' || seen.has(v)) return;
    seen.add(v);
    if (Array.isArray(v)) { v.forEach(walk); return; }
    for (const [key, val] of Object.entries(v as Record<string, unknown>)) {
      if (key === 'revealFamilies' && Array.isArray(val)) out.push(val as string[]);
      walk(val);
    }
  };
  walk(root);
  return out;
}

const AUTHORED_ARRAYS = collectAuthoredFamilyArrays(UNIFIED_ACTION_TEMPLATES);
const AUTHORED_FAMILIES = [...new Set(AUTHORED_ARRAYS.flat())].sort();

/** Every family the engine itself plants marks with, alongside the authored corpus. */
const ENGINE_FAMILIES = [
  ...new Set([...FAILURE_ARTIFACT_REVEAL_FAMILIES, ...CURSE_MARK_REVEAL_FAMILIES]),
].sort();

const liveMatches = (family: string): number =>
  TEMPLATE_IDS.filter(id => familyMatchesTemplate(family, id)).length;

// ─── Pin the population before asserting on it ────────────────────

describe('reveal-family liveness: the corpus is non-empty', () => {
  it('the shipped template pool is populated', () => {
    expect(TEMPLATE_IDS.length).toBeGreaterThan(500);
  });

  it('authored reveal-family entries are reachable in the shipped pool', () => {
    // If the converter ever stops carrying `revealFamilies` through to
    // UNIFIED_ACTION_TEMPLATES, this drops to 0 and every assertion below goes vacuous.
    expect(AUTHORED_ARRAYS.length).toBeGreaterThan(100);
    expect(AUTHORED_FAMILIES.length).toBeGreaterThan(50);
  });

  it('the engine plants marks with families of its own', () => {
    expect(ENGINE_FAMILIES.length).toBeGreaterThan(0);
  });
});

// ─── The guard ────────────────────────────────────────────────────

describe('reveal-family liveness: every authored family can fire', () => {
  it.each(AUTHORED_FAMILIES)('family "%s" matches at least one live template', family => {
    expect(liveMatches(family)).toBeGreaterThan(0);
  });

  it.each(ENGINE_FAMILIES)('engine family "%s" matches at least one live template', family => {
    expect(liveMatches(family)).toBeGreaterThan(0);
  });

  it('no authored mark entry is unrevealable (every entry has a live family)', () => {
    const unrevealable = AUTHORED_ARRAYS.filter(arr => !arr.some(f => liveMatches(f) > 0));
    expect(unrevealable).toEqual([]);
  });
});

// ─── The alias table itself ───────────────────────────────────────

describe('reveal-family aliases: the table is honest', () => {
  const aliasEntries = Object.entries(REVEAL_FAMILY_ALIASES);

  it('the table is populated', () => {
    expect(aliasEntries.length).toBeGreaterThan(50);
  });

  it.each(aliasEntries)('alias "%s" — every prefix it names matches a live template', (family, prefixes) => {
    // Asserting per-prefix rather than per-family: a family with one good prefix and three
    // typo'd ones would still "fire", and the dead prefixes would sit there looking intentional.
    for (const prefix of prefixes) {
      expect(
        TEMPLATE_IDS.filter(id => id.startsWith(prefix)).length,
        `alias "${family}" names prefix "${prefix}", which matches no template`,
      ).toBeGreaterThan(0);
    }
  });

  it('no alias resolves so broadly that it matches most of the pool', () => {
    // A family that reveals on everything is as useless as one that reveals on nothing.
    for (const [family, _prefixes] of aliasEntries) {
      const share = liveMatches(family) / TEMPLATE_IDS.length;
      expect(share, `alias "${family}" matches ${Math.round(share * 100)}% of the pool`).toBeLessThan(0.25);
    }
  });
});

// ─── Matcher semantics ────────────────────────────────────────────

describe('familyMatchesTemplate', () => {
  it('an unaliased family still behaves as a raw prefix (back-compat)', () => {
    expect(REVEAL_FAMILY_ALIASES['social']).toBeUndefined();
    expect(resolveRevealFamily('social')).toEqual(['social']);
    expect(familyMatchesTemplate('social', 'social.spy_on')).toBe(true);
    expect(familyMatchesTemplate('social', 'tavern.brawl')).toBe(false);
  });

  it('an aliased family matches via its resolved prefixes, not its own name', () => {
    // The regression this guards: `investigation` is the corpus's most-used family and no
    // template id begins with it. Both assertions were red before the alias layer.
    expect(TEMPLATE_IDS.some(id => id.startsWith('investigation'))).toBe(false);
    expect(familyMatchesTemplate('investigation', 'social.investigate_reputation')).toBe(true);
  });

  it('an aliased family does not match an unrelated template', () => {
    expect(familyMatchesTemplate('investigation', 'encounter.gather_firewood')).toBe(false);
    expect(familyMatchesTemplate('oracle', 'tg.social.dice_game')).toBe(false);
  });

  it('resolution is total — an unknown family resolves to itself rather than throwing', () => {
    expect(resolveRevealFamily('not_a_family_anyone_authored')).toEqual(['not_a_family_anyone_authored']);
    expect(familyMatchesTemplate('not_a_family_anyone_authored', 'social.spy_on')).toBe(false);
  });
});
