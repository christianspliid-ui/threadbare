/**
 * Work namer — THR-1297 §5 (slice 4).
 *
 * The assertions are grouped by the property they defend, and every fail-soft claim
 * is paired with the input that triggers it. The negative arms matter more than the
 * positives here: a namer is trivially "working" if you only ever hand it complete
 * input, and the whole point of the fallback ladder is what happens when you do not.
 */

import { describe, it, expect } from 'vitest';
import {
  generateWorkName,
  workingName,
  generateFailureScarName,
  possessive,
  hashSeed,
  pickFrom,
  WORK_NAME_PHONETIC_CHANCE,
  WORK_NAME_MAX_ATTEMPTS,
} from '../workNames';
import {
  WORK_NOUNS_BY_FAMILY,
  WORK_KIND_FAMILY,
  FAILURE_SCAR_LEXICON,
  familyForKind,
} from '../../../data/work-name-content';

describe('possessive — the primitive the whole slice turns on', () => {
  it("adds 's to an ordinary name", () => {
    expect(possessive('Kael')).toBe("Kael's");
  });

  it("adds only an apostrophe to a name ending in s — the trailing-s bug", () => {
    expect(possessive('Silas')).toBe("Silas'");
    expect(possessive('Thomas')).toBe("Thomas'");
    expect(possessive('The Lorekeepers')).toBe("The Lorekeepers'");
  });
});

describe('determinism (NFP #3)', () => {
  it('the same work id always yields the same name', () => {
    const ctx = { workId: 'work_1', kindId: 'network', reach: 'gold' as const, anchorName: 'Saltmarsh' };
    const first = generateWorkName(ctx);
    for (let i = 0; i < 25; i++) expect(generateWorkName(ctx)).toBe(first);
  });

  it('different work ids generally yield different names', () => {
    const names = new Set(
      Array.from({ length: 40 }, (_, i) =>
        generateWorkName({ workId: `work_${i}`, kindId: 'place_location', reach: 'stone', anchorName: 'Redfen' })),
    );
    // Not 40 — the pattern set is finite and collisions are expected. But a namer
    // producing one or two strings across 40 ids would be broken, and would pass
    // every other assertion in this file.
    expect(names.size).toBeGreaterThan(5);
  });

  it('is unaffected by whether a phonetic signature is available', () => {
    // The salted-stream guarantee: phonetics consumes a variable number of draws
    // internally, so sharing the main stream would make every name depend on
    // whether a culture happened to be resolvable at that site.
    const base = { workId: 'work_salt', kindId: 'trade_route' as const, reach: 'gold' as const, anchorName: 'Saltmarsh' };
    const withoutSignature = generateWorkName(base);
    // A signature that cannot generate anything must leave the name exactly as it was.
    const withDeadSignature = generateWorkName({
      ...base,
      phoneticSignature: {
        syllableTemplates: [], onsets: [], nuclei: [], codas: [],
        nameSuffixes: [], settlementSuffixes: [],
        personalSyllableRange: { min: 1, max: 2 },
        settlementSyllableRange: { min: 1, max: 2 },
        orthography: {},
      } as never,
    });
    expect(withDeadSignature).toBe(withoutSignature);
  });
});

describe('the anchor is where the name comes from (THR-1291)', () => {
  it('a work with an anchor is usually named for its ground', () => {
    // Across a spread of ids the anchored patterns should dominate, because the
    // anchored set is offered alongside every other renderable set.
    const anchored = Array.from({ length: 30 }, (_, i) =>
      generateWorkName({ workId: `w${i}`, kindId: 'trade_route', reach: 'gold', anchorName: 'Saltmarsh', actorName: 'Kael' }));
    expect(anchored.filter(n => n.includes('Saltmarsh')).length).toBeGreaterThan(5);
  });

  it('strips a leading article from the anchor so patterns can re-article it', () => {
    const names = Array.from({ length: 30 }, (_, i) =>
      generateWorkName({ workId: `art${i}`, kindId: 'place_location', anchorName: 'The Ashford Bridge' }));
    // "The The Ashford Bridge Hold" is the bug this guards.
    expect(names.some(n => /\bThe The\b/.test(n))).toBe(false);
  });
});

describe('the successor grammar — names outlive the work (THR-1291 §3)', () => {
  it('a work raised on a destroyed one takes its name, worn', () => {
    const name = generateWorkName({ workId: 'rebuild_1', kindId: 'trade_route', predecessorName: 'The Saltway' });
    expect(name).toMatch(/Saltway/);
    expect(name).not.toBe('The Saltway');
  });

  it('falls through to the ordinary path when the predecessor name is blank', () => {
    const name = generateWorkName({ workId: 'rebuild_2', kindId: 'trade_route', predecessorName: '   ', actorName: 'Kael' });
    expect(name.trim().length).toBeGreaterThan(0);
    expect(name).not.toMatch(/\{/);
  });
});

describe('the fallback ladder (NFP #4) — never blank, never a raw id', () => {
  it('with no inputs at all, still returns a real name', () => {
    const name = generateWorkName({ workId: 'bare' });
    expect(name.trim().length).toBeGreaterThan(0);
    expect(name).not.toMatch(/\{[a-zA-Z]+\}/);
    expect(name).not.toContain('bare'); // never the id itself
  });

  it('an unknown kind falls to the place family rather than failing', () => {
    expect(familyForKind('not_a_real_kind')).toBe('place');
    const name = generateWorkName({ workId: 'unknown_kind', kindId: 'not_a_real_kind' });
    expect(name.trim().length).toBeGreaterThan(0);
    expect(name).not.toContain('not_a_real_kind');
  });

  it('an unknown reach and foundation degrade to the possessive, not to a hole', () => {
    const name = generateWorkName({
      workId: 'unknown_flavor',
      kindId: 'place_location',
      reach: 'not_a_reach' as never,
      foundation: 'not_a_foundation',
      actorName: 'Silas',
    });
    expect(name).toContain("Silas'");
    expect(name).not.toMatch(/\{/);
  });

  it('falls to the possessive when every rendered name is already taken', () => {
    // Built by *saturation*, not by hoping a sample covers the space: feed each
    // answer back as taken until the namer runs out of renderings. An earlier
    // version of this test filled `usedNames` from other work ids and passed
    // vacuously, because those names were never the ones this context renders.
    const ctx = { workId: 'collide', kindId: 'network', reach: 'shadow' as const, anchorName: 'Duskwell', actorName: 'Vesna' };
    const taken = new Set<string>();
    let name = '';
    for (let i = 0; i <= WORK_NAME_MAX_ATTEMPTS + 2; i++) {
      name = generateWorkName({ ...ctx, usedNames: taken });
      if (name.startsWith("Vesna's")) break;
      taken.add(name);
    }
    expect(name.startsWith("Vesna's")).toBe(true);
    // And it really did have to exhaust alternatives to get there.
    expect(taken.size).toBeGreaterThan(0);
  });

  it('degrades to a bare family noun when there is no actor either', () => {
    const ctx = { workId: 'x0', kindId: 'intelligence_cache', reach: 'eye' as const };
    const cacheNouns = WORK_NOUNS_BY_FAMILY.cache;
    const bare = new Set(cacheNouns.map(n => `The ${n}`));
    const taken = new Set<string>();
    let name = '';
    for (let i = 0; i <= WORK_NAME_MAX_ATTEMPTS + 2; i++) {
      name = generateWorkName({ ...ctx, usedNames: taken });
      if (bare.has(name)) break;
      taken.add(name);
    }
    // The terminal rung is `The <noun>` from *this kind's* family — the drawn noun,
    // not a fixed one, so the last resort still varies between works. What matters
    // is that it is a cache word and not a hole, an id, or another family's noun.
    expect(bare.has(name), `'${name}' is not a bare cache noun`).toBe(true);
  });

  it('never throws on a malformed culture signature', () => {
    // Signatures are built from graph properties, so a partial one is a live
    // possibility — and `generatePhoneticName` reads its fields directly. This
    // arm is why `resolvePhoneticRoot` carries a try/catch: without it the throw
    // propagates out of the namer and into the tick phase.
    expect(() => generateWorkName({
      workId: 'malformed_sig',
      kindId: 'place_location',
      phoneticSignature: { syllableTemplates: [{}] } as never,
    })).not.toThrow();
  });
});

describe('kinds and families are different vocabularies', () => {
  // `network` is both a kind id and a family name; `route`, `place` and `cache` are
  // families only. Passing a family where a kind belongs therefore *silently*
  // resolves to the `place` fallback instead of erroring — which is exactly how the
  // first draft of this file tested the wrong family in six places and passed.
  it('a family name is not a kind id, and falls back rather than resolving', () => {
    expect(familyForKind('route')).toBe('place');
    expect(familyForKind('cache')).toBe('place');
    expect(familyForKind('trade_route')).toBe('route');
    expect(familyForKind('intelligence_cache')).toBe('cache');
  });

  it('every kind in the registry vocabulary has a family mapping', () => {
    const KIND_IDS = [
      'intelligence_cache', 'leverage_mark', 'masterwork_item', 'chart_find',
      'network', 'sublocation', 'place_location', 'trade_route', 'warband', 'faction',
    ];
    for (const kind of KIND_IDS) {
      expect(WORK_KIND_FAMILY[kind], `kind '${kind}' has no family`).toBeDefined();
    }
  });
});

describe('working name — what a work wears before it is finished (THR-1291 §2)', () => {
  it('is the founder possessive plus the family noun', () => {
    expect(workingName('Kael', 'network')).toBe("Kael's Ring");
  });

  it('honours the possessive rule', () => {
    expect(workingName('Silas', 'network')).toBe("Silas' Ring");
  });

  it('degrades without an actor', () => {
    expect(workingName(undefined, 'trade_route')).toBe('The Way');
    expect(workingName('   ', 'trade_route')).toBe('The Way');
  });

  it('is different from the earned name — a work is not born named', () => {
    const working = workingName('Kael', 'network');
    const earned = generateWorkName({ workId: 'w', kindId: 'network', reach: 'gold', anchorName: 'Saltmarsh' });
    expect(working).not.toBe(earned);
  });
});

describe('the failure-name register (review ruling 2.2)', () => {
  it('names a visible failure for its actor and a folly word', () => {
    const name = generateFailureScarName('scar_1', 'Corran');
    expect(name.startsWith("Corran's")).toBe(true);
    expect(FAILURE_SCAR_LEXICON.some(w => name.endsWith(w))).toBe(true);
  });

  it('honours the possessive rule', () => {
    expect(generateFailureScarName('scar_2', 'Silas').startsWith("Silas'")).toBe(true);
  });

  it('is deterministic per scar id', () => {
    expect(generateFailureScarName('scar_3', 'Vesna')).toBe(generateFailureScarName('scar_3', 'Vesna'));
  });

  it('degrades without an actor rather than returning a bare folly word', () => {
    expect(generateFailureScarName('scar_4', undefined)).toBe('The Folly');
  });

  it('draws from the folly lexicon, not the success nouns — a scar is not a name earned', () => {
    const scars = Array.from({ length: 30 }, (_, i) => generateFailureScarName(`s${i}`, 'Corran'));
    const successNouns = new Set(Object.values(WORK_NOUNS_BY_FAMILY).flat());
    // Overlap would mean a failure reads like an achievement.
    expect(scars.every(s => !successNouns.has(s.split(' ').pop()!))).toBe(true);
  });
});

describe('the noun override — a specific thing keeps its own noun', () => {
  it('uses the override in place of the family noun', () => {
    const name = generateWorkName({
      workId: 'subloc_research_circle_loc_0_39',
      kindId: 'sublocation',
      anchorName: 'Ardenmor Keep',
      nounOverride: 'Research Circle',
    });
    expect(name).toContain('Research Circle');
  });

  it('does not shift the PRNG sequence — the grammar is identical either way', () => {
    // The override is substituted *after* the draw, so the pattern chosen for a work
    // cannot depend on whether its type happened to carry a specific noun.
    const base = { workId: 'stable_id', kindId: 'sublocation', reach: 'stone' as const, anchorName: 'Thornhaven', actorName: 'Miriel' };
    const generic = generateWorkName(base);
    const specific = generateWorkName({ ...base, nounOverride: 'Workshop' });
    // Same shape, one word swapped — so replacing the noun back recovers the original.
    const genericNoun = WORK_NOUNS_BY_FAMILY.place.find(n => generic.includes(n))!;
    expect(specific).toBe(generic.replace(genericNoun, 'Workshop'));
  });

  it('ignores a blank override rather than producing a hole', () => {
    const base = { workId: 'blank_override', kindId: 'sublocation', anchorName: 'Thornhaven' };
    expect(generateWorkName({ ...base, nounOverride: '   ' })).toBe(generateWorkName(base));
    expect(generateWorkName({ ...base, nounOverride: '' })).toBe(generateWorkName(base));
  });
});

describe('names read as names, not as identifiers', () => {
  // Found live: a 150-tick seed-42 run produced "The StandingHouse" at tick 141 from
  // a concatenating `{root}{noun}` pattern. Unit tests all passed — every one of them
  // only asserted that a name was non-blank and token-free, which "StandingHouse" is.
  // A name is a player-facing string, so it needs a legibility assertion too.
  const SAMPLE = Array.from({ length: 200 }, (_, i) =>
    generateWorkName({
      workId: `legible_${i}`,
      kindId: ['network', 'place_location', 'trade_route', 'warband', 'faction'][i % 5],
      reach: (['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'] as const)[i % 8],
      foundation: ['chaos', 'order', 'light', 'darkness'][i % 4],
      anchorName: i % 3 === 0 ? 'Thornhaven' : undefined,
      actorName: i % 2 === 0 ? 'Miriel' : undefined,
    }));

  it('never runs two capitalised words together', () => {
    const offenders = SAMPLE.filter(n => /[a-z][A-Z]/.test(n));
    expect(offenders, `CamelCase mush: ${offenders.slice(0, 5).join(', ')}`).toEqual([]);
  });

  it('never doubles an article or a space', () => {
    expect(SAMPLE.filter(n => /\bThe The\b|\bof of\b|  /.test(n))).toEqual([]);
  });

  it('never ends on a preposition or article — a truncated name', () => {
    expect(SAMPLE.filter(n => /\b(of|the|at|a|an)$/i.test(n))).toEqual([]);
  });

  it('never contains an underscore — the tell of an id reaching a surface', () => {
    expect(SAMPLE.filter(n => n.includes('_'))).toEqual([]);
  });
});

describe('content invariants the resolver depends on', () => {
  it('every family has a non-empty noun pool (the terminal fallback reads pool[0])', () => {
    for (const [family, nouns] of Object.entries(WORK_NOUNS_BY_FAMILY)) {
      expect(nouns.length, `family '${family}' has no nouns`).toBeGreaterThan(0);
    }
  });

  it('every mapped kind points at a family that exists', () => {
    for (const [kind, family] of Object.entries(WORK_KIND_FAMILY)) {
      expect(WORK_NOUNS_BY_FAMILY[family], `kind '${kind}' → unknown family '${family}'`).toBeDefined();
    }
  });

  it('the folly lexicon is non-empty', () => {
    expect(FAILURE_SCAR_LEXICON.length).toBeGreaterThan(0);
  });

  it('constants are within their documented ranges', () => {
    expect(WORK_NAME_PHONETIC_CHANCE).toBeGreaterThan(0);
    expect(WORK_NAME_PHONETIC_CHANCE).toBeLessThan(1);
    expect(WORK_NAME_MAX_ATTEMPTS).toBeGreaterThanOrEqual(1);
  });
});

describe('shared primitives', () => {
  it('hashSeed is stable and non-zero for ordinary ids', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'));
  });

  it('pickFrom returns undefined on an empty pool rather than throwing', () => {
    expect(pickFrom(() => 0.5, [])).toBeUndefined();
  });
});
