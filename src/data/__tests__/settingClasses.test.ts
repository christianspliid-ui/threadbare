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
  compileOpeningEnvelope,
  type SettingClass,
} from '../settingClasses';
import { ENCOUNTER_TEMPLATES } from '../encounter-content';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';
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

// ─── THR-932 — openings must reach the reader ──────────────────────

/**
 * The bug this block locks: `openings` was compiled only inside the raw-entry
 * converter, so a *direct-authored* template (every vertical-slice encounter) had the
 * field validated and then read by nothing. All eight slice encounters shipped their
 * approved scene-setting paragraph and rendered only the close-up step prose.
 *
 * The corpus sweep below is deliberately written to fail on an empty population — a
 * "no template declares openings" state would otherwise pass this file while proving
 * nothing, which is exactly how the original gap survived a green suite.
 */
describe('compileOpeningEnvelope (THR-932)', () => {
  const makeTemplate = (
    over: Partial<UnifiedActionTemplate> & Pick<UnifiedActionTemplate, 'openings'>,
  ): UnifiedActionTemplate =>
    ({
      id: 'test.opening',
      name: 'Test',
      reach: 'stone',
      crudType: 'read',
      scale: 'local',
      apCost: 1,
      steps: [{ reach: 'stone', narrativeTemplate: 'The step paragraph.' }],
      narrativeTemplates: { initiation: 'x', success: 'y', failure: 'z' },
      ...over,
    }) as unknown as UnifiedActionTemplate;

  it('prepends the opening token rather than replacing the authored step prose', () => {
    // The divergence THR-932 resolved: the converter used to *replace* step-0 prose,
    // which discards the authored paragraph. Authoring intent is opening ¶ + step ¶.
    const compiled = compileOpeningEnvelope(
      makeTemplate({ settings: ['wayside'], openings: { wayside: 'The bridge sags.' } }),
    );
    expect(firstStepProse(compiled)).toBe('{frag:opening}\n\nThe step paragraph.');
    // ...and the step paragraph is still there, which is the half that used to be lost.
    expect(firstStepProse(compiled)).toContain('The step paragraph.');
  });

  it('compiles the table onto the reserved opening slot, bound to the setting axis', () => {
    const compiled = compileOpeningEnvelope(
      makeTemplate({
        settings: ['rural', 'urban'],
        openings: { rural: 'The threshing floor.', urban: 'The street narrows.' },
      }),
    );
    const set = compiled.contextFragments?.find(f => f.slot === 'opening');
    expect(set, 'expected a compiled opening fragment set').toBeDefined();
    expect(set?.axis).toBe('setting');
    expect(resolveFragment(compiled.contextFragments, 'opening', { setting: 'urban' })?.text)
      .toBe('The street narrows.');
  });

  it('falls back to a declared opening when the setting axis is unbound', () => {
    // The `?spawn` review route places the encounter at the agent's current location,
    // which may be outside the declared classes. Dropping the paragraph there would
    // reproduce the very bug for the surface used to review the fix.
    const compiled = compileOpeningEnvelope(
      makeTemplate({
        settings: ['rural', 'urban'],
        openings: { rural: 'The threshing floor.', urban: 'The street narrows.' },
      }),
    );
    // `rural` precedes `urban` in canonical SETTING_CLASSES order, so the fallback is
    // deterministic rather than declaration-order dependent.
    expect(resolveFragment(compiled.contextFragments, 'opening', { setting: null })?.text)
      .toBe('The threshing floor.');
    expect(resolveFragment(compiled.contextFragments, 'opening', { setting: 'arcane' })?.text)
      .toBe('The threshing floor.');
  });

  it('is idempotent and leaves an openings-less template untouched (NFP #6)', () => {
    const withOpenings = compileOpeningEnvelope(
      makeTemplate({ settings: ['wayside'], openings: { wayside: 'An opening.' } }),
    );
    // Applying twice must not double-prepend — the catalog spreads this array more once.
    expect(firstStepProse(compileOpeningEnvelope(withOpenings))).toBe(firstStepProse(withOpenings));
    expect(compileOpeningEnvelope(withOpenings).contextFragments).toHaveLength(1);

    const none = makeTemplate({ openings: undefined });
    expect(compileOpeningEnvelope(none)).toBe(none);
  });

  it('every shipped template that authors openings actually renders them', () => {
    // The live corpus guard. A direct-authored template added later without going
    // through a compile point fails here instead of silently losing its first paragraph.
    const withOpenings = UNIFIED_ACTION_TEMPLATES.filter(
      t => t.openings && Object.keys(t.openings).length > 0,
    );
    expect(
      withOpenings.length,
      'expected shipped templates authoring openings — an empty population would make this vacuous',
    ).toBeGreaterThan(0);

    for (const t of withOpenings) {
      expect(
        t.contextFragments?.some(f => f.slot === 'opening') ?? false,
        `${t.id} authors openings but compiled no opening fragment set`,
      ).toBe(true);
      expect(
        firstStepProse(t) ?? '',
        `${t.id} compiled an opening but step 0 never references it`,
      ).toContain('{frag:opening}');
    }
  });

  it('renders opening + step prose for the slice encounter named in the THR-932 report', () => {
    const bridge = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'encounter.slice.unsafe_bridge');
    expect(bridge, 'expected the Unsafe Bridge slice template').toBeDefined();

    const prose = firstStepProse(bridge!) ?? '';
    const opening = resolveFragment(bridge!.contextFragments, 'opening', { setting: 'wayside' });
    expect(opening?.usedDefault).toBe(false);

    // Compose the way `enrichProse` does, and assert BOTH authored parts
    // survive: the P1 arrival (openings) ahead of the P2/P3 spine (step
    // prose). Literals track the Doctrine v2 rewrite (THR-1223 batch 5).
    const rendered = prose.replace('{frag:opening}', opening?.text ?? '');
    expect(rendered).toContain('reaches the river crossing');
    expect(rendered).toContain('The only bridge sags');
    expect(rendered.indexOf('reaches the river crossing')).toBeLessThan(rendered.indexOf('The only bridge sags'));
  });
});
