/**
 * Setting-envelope validation suite (THR-884).
 *
 * The THR-844 lesson made mechanical: a closed vocabulary rots the moment one side
 * of it stops matching the world it describes, and it rots *silently* — 66 of 138
 * hidden-mark entries referenced a dead `revealFamily` and every test still passed.
 * So the class↔subtype map is pinned in **both** directions with explicit totals:
 *   - no class expands to nothing (a class nobody can reach is dead vocabulary);
 *   - no authorable subtype is unclaimed (a subtype outside every class is a hole
 *     an author cannot address);
 *   - no subtype is claimed twice (two classes owning one subtype makes coverage
 *     counts lie).
 *
 * Plus the envelope-completeness rule: a template that authored per-class openings
 * must cover every class its envelope declares, or a real player at that kind of
 * place reads the wrong opening.
 */

import { describe, it, expect } from 'vitest';

import {
  SETTING_CLASSES,
  SETTING_CLASS_MAP,
  ENCOUNTER_AUTHORABLE_SUBTYPES,
  expandSettings,
  isSettingClass,
  settingClassForSubtype,
  unknownSettingClasses,
  validateSettingEnvelope,
  type SettingClass,
} from '../settingClasses';
import { ENCOUNTER_TEMPLATES } from '../encounter-content';
import { resolveFragment, resolveSettingVariant } from '../../engine/fragmentResolution';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

/** `steps[0]` is an `ActionStepOrBranch`; only the plain-step arm carries prose. */
function firstStepProse(t: UnifiedActionTemplate): string | undefined {
  const step = t.steps?.[0];
  return step && 'narrativeTemplate' in step ? step.narrativeTemplate : undefined;
}

/**
 * Pinned totals. These are assertions about the *shape* of the vocabulary, not
 * snapshots — changing one means deliberately changing the authoring surface, and
 * the failure message should read as "you widened the vocabulary", not "update me".
 */
const EXPECTED_CLASS_COUNT = 8;
const EXPECTED_AUTHORABLE_SUBTYPE_COUNT = 20;

describe('setting-class vocabulary', () => {
  it('declares exactly the pinned number of classes', () => {
    expect(SETTING_CLASSES).toHaveLength(EXPECTED_CLASS_COUNT);
    expect(new Set(SETTING_CLASSES).size).toBe(EXPECTED_CLASS_COUNT);
  });

  it('gives every class at least one live subtype (no dead class)', () => {
    for (const cls of SETTING_CLASSES) {
      expect(SETTING_CLASS_MAP[cls].length, `class "${cls}" expands to nothing`).toBeGreaterThan(0);
    }
  });

  it('claims each authorable subtype exactly once (no hole, no double-claim)', () => {
    const seen = new Map<string, SettingClass[]>();
    for (const cls of SETTING_CLASSES) {
      for (const subtype of SETTING_CLASS_MAP[cls]) {
        seen.set(subtype, [...(seen.get(subtype) ?? []), cls]);
      }
    }
    const doubleClaimed = [...seen.entries()].filter(([, classes]) => classes.length > 1);
    expect(doubleClaimed, `subtypes claimed by more than one class: ${JSON.stringify(doubleClaimed)}`).toEqual([]);
    expect(seen.size).toBe(EXPECTED_AUTHORABLE_SUBTYPE_COUNT);
  });

  it('pins the authorable subtype total', () => {
    expect(ENCOUNTER_AUTHORABLE_SUBTYPES).toHaveLength(EXPECTED_AUTHORABLE_SUBTYPE_COUNT);
    expect(new Set(ENCOUNTER_AUTHORABLE_SUBTYPES).size).toBe(EXPECTED_AUTHORABLE_SUBTYPE_COUNT);
  });

  it('round-trips subtype → class → subtype for every authorable subtype', () => {
    for (const subtype of ENCOUNTER_AUTHORABLE_SUBTYPES) {
      const cls = settingClassForSubtype(subtype);
      expect(cls, `subtype "${subtype}" resolves to no class`).toBeDefined();
      expect(SETTING_CLASS_MAP[cls!]).toContain(subtype);
    }
  });

  it('resolves no class for subtypes outside the authorable set', () => {
    // Worldgen overlay kinds are deliberately unclassed — see the scope note on
    // SETTING_CLASS_MAP. A class appearing here would be invented coverage.
    for (const outside of ['ley_nexus', 'lair', 'elder_ruin', 'grove', 'nest']) {
      expect(settingClassForSubtype(outside), `"${outside}" should be unclassed`).toBeUndefined();
    }
    expect(settingClassForSubtype(undefined)).toBeUndefined();
    expect(settingClassForSubtype('')).toBeUndefined();
  });
});

describe('expandSettings', () => {
  it('expands a declared envelope to its subtypes', () => {
    expect(expandSettings(['sacred'])).toEqual(['shrine', 'temple']);
    expect(expandSettings(['arcane', 'battlefield'])).toEqual(['tower', 'battleground']);
  });

  it('is order-independent — the same envelope yields byte-identical output', () => {
    expect(expandSettings(['wayside', 'rural'])).toEqual(expandSettings(['rural', 'wayside']));
  });

  it('deduplicates and skips unknown classes rather than throwing', () => {
    expect(expandSettings(['sacred', 'sacred'])).toEqual(['shrine', 'temple']);
    expect(expandSettings(['not_a_class'])).toEqual([]);
    expect(expandSettings([])).toEqual([]);
    expect(expandSettings(undefined)).toEqual([]);
  });

  it('reports unknown classes so the build can fail loud on a typo', () => {
    expect(unknownSettingClasses(['sacred', 'sacrred'])).toEqual(['sacrred']);
    expect(unknownSettingClasses(['sacred'])).toEqual([]);
  });

  it('guards raw strings', () => {
    expect(isSettingClass('ruin')).toBe(true);
    expect(isSettingClass('ruins')).toBe(false); // the subtype, not the class
  });
});

describe('validateSettingEnvelope — falsification', () => {
  // These cases exist because the corpus sweep below is VACUOUS today: content is
  // paused behind THR-883, so no shipped template declares `settings` or `openings`
  // and a corpus-only test would print PASS while checking nothing. Each case here
  // proves the guard actually fires on the shape it claims to catch.

  it('accepts a complete envelope', () => {
    expect(validateSettingEnvelope({
      id: 'ok',
      settings: ['rural', 'wayside'],
      openings: { rural: 'The threshing floor is swept bare.', wayside: 'The fire has burned to coals.' },
      locationSubtypes: expandSettings(['rural', 'wayside']) as string[],
    })).toEqual([]);
  });

  it('catches a typo\'d class', () => {
    const problems = validateSettingEnvelope({
      id: 'typo', settings: ['sacrred'], locationSubtypes: ['shrine'],
    });
    expect(problems.join(' ')).toContain('unknown setting class');
  });

  it('catches a declared class with no authored opening', () => {
    const problems = validateSettingEnvelope({
      id: 'gap',
      settings: ['rural', 'urban'],
      openings: { rural: 'The threshing floor is swept bare.' },
      locationSubtypes: expandSettings(['rural', 'urban']) as string[],
    });
    expect(problems.join(' ')).toContain('no authored opening: urban');
  });

  it('catches an opening for a class the envelope never declares', () => {
    const problems = validateSettingEnvelope({
      id: 'stray',
      settings: ['rural'],
      openings: { rural: 'The threshing floor.', arcane: 'The tower stair turns.' },
      locationSubtypes: expandSettings(['rural']) as string[],
    });
    expect(problems.join(' ')).toContain('never declares: arcane');
  });

  it('catches a template that registers nowhere', () => {
    const problems = validateSettingEnvelope({ id: 'placeless', locationSubtypes: [] });
    expect(problems.join(' ')).toContain('registers at no location subtype');
  });

  it('stays silent for a template that opts out entirely (NFP #6)', () => {
    expect(validateSettingEnvelope({ id: 'legacy', locationSubtypes: ['town'] })).toEqual([]);
  });
});

describe('authored encounter envelopes', () => {
  it('every shipped template passes envelope validation', () => {
    // Live regression guard. Vacuous on the envelope rules until the first migrated
    // template lands (see above) — but the placeless rule bites today, over all 115.
    const failures = ENCOUNTER_TEMPLATES
      .map(t => ({ id: t.id, problems: validateSettingEnvelope(t) }))
      .filter(r => r.problems.length > 0)
      .map(r => `${r.id}: ${r.problems.join('; ')}`);
    expect(failures, failures.join(' | ')).toEqual([]);
  });

  it('sweeps a non-empty corpus', () => {
    // Guards the sweep above against becoming a no-op if the export ever empties.
    expect(ENCOUNTER_TEMPLATES.length).toBeGreaterThan(50);
  });

  it('compiles authored openings into a resolvable opening fragment', () => {
    // Guards the converter contract: openings must reach the render path as a
    // fragment set carrying the required '*' default, or the first step renders blank.
    for (const t of ENCOUNTER_TEMPLATES) {
      if (!t.openings || Object.keys(t.openings).length === 0) continue;
      const set = t.contextFragments?.find(f => f.slot === 'opening');
      expect(set, `${t.id} authored openings but compiled no opening fragment`).toBeDefined();
      expect(set!.axis).toBe('setting');
      expect(set!.variants['*'], `${t.id} opening fragment has no '*' default`).toBeTruthy();
      expect(firstStepProse(t)).toBe('{frag:opening}');
    }
  });

  it('resolves an opening fragment to the bound class, and to the default off it', () => {
    // The runtime half of the contract, proven on a hand-built set rather than on the
    // (currently empty) migrated corpus.
    const set = {
      slot: 'opening',
      axis: 'setting' as const,
      variants: {
        rural: 'The threshing floor is swept bare.',
        urban: 'The street narrows between two shuttered stalls.',
        '*': 'The place is quiet.',
      },
    };
    expect(resolveFragment([set], 'opening', { setting: 'rural' })?.text)
      .toBe('The threshing floor is swept bare.');
    // A class the template did not author falls to the default, never to a blank.
    expect(resolveFragment([set], 'opening', { setting: 'arcane' })?.text).toBe('The place is quiet.');
    // An unclassed location (worldgen overlay) takes the same default path.
    expect(resolveFragment([set], 'opening', { setting: null })?.text).toBe('The place is quiet.');
  });

  it('resolves per-card fiction through the same chain, defaulting to the authored line', () => {
    const base = 'You steady their hand.';
    const bySetting = { sacred: 'You still the tremor before the altar.' };
    expect(resolveSettingVariant(bySetting, base, { setting: 'sacred' }))
      .toBe('You still the tremor before the altar.');
    // Unmatched class, absent binding, and no table at all all yield the authored line.
    expect(resolveSettingVariant(bySetting, base, { setting: 'urban' })).toBe(base);
    expect(resolveSettingVariant(bySetting, base, {})).toBe(base);
    expect(resolveSettingVariant(undefined, base, { setting: 'sacred' })).toBe(base);
  });

  it('leaves templates without openings byte-identical (NFP #6)', () => {
    // The additive guarantee: the whole layer is opt-in, so an un-migrated template
    // must carry no opening fragment and keep its literal authored first-step prose.
    const unmigrated = ENCOUNTER_TEMPLATES.filter(t => !t.openings);
    expect(unmigrated.length, 'expected un-migrated templates to exist').toBeGreaterThan(0);
    for (const t of unmigrated) {
      expect(t.contextFragments?.some(f => f.slot === 'opening') ?? false).toBe(false);
      expect(firstStepProse(t)).not.toBe('{frag:opening}');
    }
  });
});
