/**
 * Encounter Content Package compiler tests. THR-1246.
 *
 * The two load-bearing properties, each with falsification arms:
 *
 * 1. **Fidelity** — the emitted module reproduces the assembled template
 *    byte-for-byte, prose included. Proven by evaluating the emitted literal
 *    (with `expandSettings` supplied) and deep-equalling it against
 *    `assembleTemplate`, not by eyeballing substrings.
 * 2. **Loud failure** — unknown keys, authored derived fields, and hand-rule
 *    breaches are named errors, never silent drops (the legacy raw-entry
 *    converter's documented allowlist failure, inverted on purpose).
 */

import { readFileSync } from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import {
  assembleTemplate,
  deriveConstName,
  emitEncounterModule,
  emitEncounterTest,
  encounterPackageViolations,
  printTsString,
  registerTemplateInSource,
  unknownPackageKeys,
  REGISTRATION_FILE_RELPATH,
  type EncounterContentPackage,
} from '../encounterPackage';
import { expandSettings } from '../../settingClasses';
import { drawConsequenceHand } from '../consequenceDraw';
import type { ActionStep, StepNudge } from '../../../types/unifiedAction';

// ─── Fixture ─────────────────────────────────────────────────────────

const HAND: readonly StepNudge[] = [
  {
    id: 'crossing.hold_fast',
    name: 'Steady Grip',
    essenceCost: 1,
    forecastDelta: 0.06,
    effectLine: 'Strengthen their hands so the current cannot pry them loose.',
    fiction: 'Most things fail by a margin.',
    bandProse: { failure: 'The steadying held until the last step, then the river won.' },
  },
  {
    id: 'crossing.find_footing',
    name: 'Reveal Footing',
    sphere: 'matter',
    essenceCost: 2,
    forecastDelta: 0.08,
    effectLine: 'Show them the stones that hold — the crossing shortens.',
    fiction: 'Stone keeps its promises.',
    bandProse: { failure: 'The stones held. Their balance did not.' },
  },
  {
    id: 'crossing.bind_outcome',
    name: 'Bind Outcome',
    sphere: 'order',
    essenceCost: 3,
    forecastDelta: 0.04,
    rider: 'floor_at_cost',
    effectLine: 'Guarantee the far bank — they arrive, and pay for it.',
    fiction: 'Rules exist so the worst case has a name.',
    bandProse: { critical_failure: 'Even a bound outcome needs a river that cooperates.' },
  },
  {
    id: 'crossing.banish_fear',
    name: 'Banish Fear',
    sphere: 'life',
    essenceCost: 2,
    forecastDelta: 0.05,
    effectLine: 'Grant them calm — they step in unafraid and stay that way.',
    fiction: 'Most suffering ends.',
    bandProse: { failure: 'They stayed calm the whole way down.' },
  },
  {
    id: 'crossing.kindle_blood',
    name: 'Kindle Blood',
    sphere: 'energy',
    essenceCost: 2,
    forecastDelta: 0.1,
    effectLine: 'Send heat through them — the cold water cannot stall them.',
    fiction: 'Bodies hold more than they admit.',
    bandProse: { failure: 'The heat came and went, and the river was still there.' },
  },
];

const STEP: ActionStep = {
  reach: 'stone',
  duration: { min: 1, max: 2 },
  difficulty: 0.4,
  purposeLine: 'Cross the ford',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    "There {they} find the ford swollen with meltwater — the marker stones are under a hand's depth "
    + 'of fast water and the far bank is further than it looks.\n\n'
    + "A carter's boy watches from the bank. He says nobody has crossed since yesterday.",
  successAfterimage: 'They crossed, boots full of river.',
  failureAfterimage: 'The river put them back on the bank it chose.',
  nudges: HAND,
};

const FIXTURE: EncounterContentPackage = {
  slug: 'the-test-crossing',
  doc: ['The Test Crossing — compiler fixture. Not shipped content.'],
  template: {
    id: 'encounter.test.the_test_crossing',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'The Test Crossing',
    reach: 'stone',
    crudType: 'read',
    scale: 'local',
    steps: [STEP],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['preservation_transformation'],
    settings: ['wayside'],
    openings: {
      wayside: '{name} follows the cart track down to the ford at {location}.',
    },
    narrativeTemplates: {
      initiation: 'The ford is the only crossing before nightfall.',
      success: '{name} crossed the swollen ford.',
      failure: '{name} turned back from the swollen ford.',
    },
    description: 'A single-step crossing test for the package compiler.',
  },
};

/** A deep-cloned fixture the arm can mutate without JSON round-trip surprises. */
function mutable(): { slug: string; template: Record<string, unknown> } & Record<string, unknown> {
  return structuredClone(FIXTURE) as never;
}

function violationsOf(pkg: unknown): readonly string[] {
  return encounterPackageViolations(pkg as EncounterContentPackage);
}

// ─── Validation ──────────────────────────────────────────────────────

describe('encounterPackageViolations', () => {
  it('accepts the valid fixture', () => {
    expect(encounterPackageViolations(FIXTURE)).toEqual([]);
  });

  it('rejects unknown top-level keys loudly', () => {
    expect(unknownPackageKeys({ ...FIXTURE, extraKnob: true })).toEqual(['extraKnob']);
    expect(unknownPackageKeys(FIXTURE)).toEqual([]);
  });

  it('rejects an authored consequenceDraw — the compiler stamps it', () => {
    const pkg = mutable();
    pkg.template.consequenceDraw = ['possession'];
    expect(violationsOf(pkg).some(v => v.includes('stamps'))).toBe(true);
  });

  it('rejects authored locationSubtypes beside a declared envelope', () => {
    const pkg = mutable();
    pkg.template.locationSubtypes = ['camp'];
    expect(violationsOf(pkg).some(v => v.includes('expandSettings'))).toBe(true);
  });

  it('rejects an opening for an undeclared class (via the shipped envelope validator)', () => {
    const pkg = mutable();
    (pkg.template.openings as Record<string, string>).urban = 'A street.';
    expect(violationsOf(pkg).some(v => v.startsWith('envelope:'))).toBe(true);
  });

  it('rejects a hand outside 4–8 cards', () => {
    const pkg = mutable();
    (pkg.template.steps as { nudges: unknown[] }[])[0].nudges = structuredClone(
      HAND.slice(0, 3),
    ) as never;
    expect(violationsOf(pkg).some(v => v.includes('hand of 3'))).toBe(true);
  });

  it('rejects two riders in one hand', () => {
    const pkg = mutable();
    const hand = (pkg.template.steps as { nudges: Record<string, unknown>[] }[])[0].nudges;
    hand[1].rider = 'no_crit_fail';
    expect(violationsOf(pkg).some(v => v.includes('rider'))).toBe(true);
  });

  it('rejects a big-delta card that does not cover both failure bands', () => {
    const pkg = mutable();
    const hand = (pkg.template.steps as { nudges: Record<string, unknown>[] }[])[0].nudges;
    hand[4].forecastDelta = 0.16; // bandProse carries only `failure`
    expect(violationsOf(pkg).some(v => v.includes('both failure bands'))).toBe(true);
  });

  it('rejects a nudge with no failure-band fragment', () => {
    const pkg = mutable();
    const hand = (pkg.template.steps as { nudges: Record<string, unknown>[] }[])[0].nudges;
    hand[0].bandProse = { success: 'Only sunshine.' };
    expect(violationsOf(pkg).some(v => v.includes('failure-band fragment'))).toBe(true);
  });

  it('rejects mixed nudge-id prefixes', () => {
    const pkg = mutable();
    const hand = (pkg.template.steps as { nudges: Record<string, unknown>[] }[])[0].nudges;
    hand[0].id = 'ford.hold_fast';
    expect(violationsOf(pkg).some(v => v.includes('one prefix'))).toBe(true);
  });

  it('rejects a byOutcome key outside the seven-value UnifiedActionOutcome', () => {
    const pkg = mutable();
    pkg.template.aftermathConfig = {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The river runs on.',
        changes: [],
        byOutcome: { near_miss: { overview: 'Nearly.' } },
      },
    };
    expect(violationsOf(pkg).some(v => v.includes('near_miss'))).toBe(true);
  });

  it('rejects an id whose tail does not match the slug', () => {
    const pkg = mutable();
    pkg.template.id = 'encounter.test.some_other_name';
    expect(violationsOf(pkg).some(v => v.includes('does not match slug'))).toBe(true);
  });
});

// ─── Assembly ────────────────────────────────────────────────────────

describe('assembleTemplate', () => {
  it('stamps the binding consequence hand from id + reach + rarity', () => {
    const assembled = assembleTemplate(FIXTURE);
    expect(assembled.consequenceDraw).toEqual(
      drawConsequenceHand({
        templateId: 'encounter.test.the_test_crossing',
        reach: 'stone',
        rarityTier: 1,
      }),
    );
    expect(assembled.consequenceDraw?.length).toBeGreaterThan(0);
  });

  it('derives locationSubtypes from the declared envelope', () => {
    expect(assembleTemplate(FIXTURE).locationSubtypes).toEqual(expandSettings(['wayside']));
  });
});

// ─── Emission fidelity ───────────────────────────────────────────────

/** Evaluate an emitted TS string literal (or concatenation) back to a value. */
function evalLiteral(literal: string): string {
  return new Function(`return (${literal});`)() as string;
}

describe('printTsString', () => {
  it('round-trips quotes, backslashes and newlines byte-identically', () => {
    const nasty = "It's a \\ 'quoted' line.\nAnd a second line.\n\nAnd a third paragraph.";
    expect(evalLiteral(printTsString(nasty, ''))).toBe(nasty);
  });

  it('round-trips long prose across the wrap-splitting path', () => {
    const prose =
      'There they find the ford swollen with meltwater, the marker stones under a full '
      + 'hand of fast water, and the far bank further than it looks from the shallows.\n\n'
      + 'A carter watches from the bank and says nobody has crossed since yesterday morning, '
      + 'not for want of trying, and the light is already going out of the afternoon.';
    const printed = printTsString(prose, '  ');
    expect(printed).toContain('+'); // the splitter actually engaged
    expect(evalLiteral(printed)).toBe(prose);
  });
});

describe('emitEncounterModule', () => {
  const source = emitEncounterModule(FIXTURE);

  it('annotates a fresh literal with the real type (the deep validator)', () => {
    expect(source).toContain('const TEMPLATE_BASE: UnifiedActionTemplate =');
    expect(source).toContain(
      `export const ${deriveConstName('the-test-crossing')}: UnifiedActionTemplate = `
        + 'compileOpeningEnvelope(TEMPLATE_BASE);',
    );
  });

  it('derives the envelope in code, not as a frozen list', () => {
    expect(source).toContain("locationSubtypes: expandSettings(['wayside'])");
  });

  it('reproduces the assembled template byte-for-byte, prose included', () => {
    const literal = source
      .slice(source.indexOf('const TEMPLATE_BASE: UnifiedActionTemplate = ')
        + 'const TEMPLATE_BASE: UnifiedActionTemplate = '.length)
      .split(/;\s*\nexport const /)[0];
    const evaluated = new Function(
      'expandSettings',
      `return (${literal});`,
    )(expandSettings) as unknown;
    expect(evaluated).toEqual(assembleTemplate(FIXTURE));
  });
});

describe('emitEncounterTest', () => {
  it('bakes this encounter\'s identity and hand into the assertions', () => {
    const source = emitEncounterTest(FIXTURE);
    expect(source).toContain("toBe('encounter.test.the_test_crossing')");
    expect(source).toContain("'crossing.hold_fast'");
    expect(source).toContain('drawConsequenceHand');
    expect(source).toContain("import { expandSettings } from '../../settingClasses';");
  });

  it('omits the settings import when there is no envelope', () => {
    const pkg = mutable();
    delete pkg.template.settings;
    delete pkg.template.openings;
    const source = emitEncounterTest(pkg as unknown as EncounterContentPackage);
    expect(source).not.toContain('expandSettings');
  });
});

// ─── Registration ────────────────────────────────────────────────────

const MINI_REGISTRY = `import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { A_TEMPLATE } from './encounters/a';

const RAW_UNIFIED_ACTION_TEMPLATES: UnifiedActionTemplate[] = [
  A_TEMPLATE,
];

export const LOCATION_BRANCHING_ENCOUNTER_TEMPLATES: readonly UnifiedActionTemplate[] = [
  A_TEMPLATE,
];
`;

describe('registerTemplateInSource', () => {
  it('adds the import and both array entries', () => {
    const { source, changed } = registerTemplateInSource(MINI_REGISTRY, FIXTURE);
    expect(changed).toEqual([
      'import',
      'RAW_UNIFIED_ACTION_TEMPLATES',
      'LOCATION_BRANCHING_ENCOUNTER_TEMPLATES',
    ]);
    expect(source).toContain(
      "import { THE_TEST_CROSSING_TEMPLATE } from './encounters/the-test-crossing';",
    );
    expect(source.match(/THE_TEST_CROSSING_TEMPLATE,/g)).toHaveLength(2);
  });

  it('is idempotent — a re-run changes nothing', () => {
    const first = registerTemplateInSource(MINI_REGISTRY, FIXTURE);
    const second = registerTemplateInSource(first.source, FIXTURE);
    expect(second.changed).toEqual([]);
    expect(second.source).toBe(first.source);
  });

  it('honours the location-cache opt-out (the THR-733 group-exclusive note)', () => {
    const pkg = { ...FIXTURE, registerInLocationCache: false };
    const { source, changed } = registerTemplateInSource(MINI_REGISTRY, pkg);
    expect(changed).toEqual(['import', 'RAW_UNIFIED_ACTION_TEMPLATES']);
    expect(source.match(/THE_TEST_CROSSING_TEMPLATE,/g)).toHaveLength(1);
  });

  it('throws loudly when the landmarks are gone, never papers over', () => {
    expect(() => registerTemplateInSource('// nothing here', FIXTURE)).toThrow(/landmarks/);
  });

  it('finds its landmarks in the REAL registration file', () => {
    // Guards against the real file's structure drifting away from the
    // compiler's expectations — the failure would otherwise surface only on
    // the next live compile.
    const real = readFileSync(path.join(process.cwd(), REGISTRATION_FILE_RELPATH), 'utf8');
    const { changed } = registerTemplateInSource(real, FIXTURE);
    expect(changed).toEqual([
      'import',
      'RAW_UNIFIED_ACTION_TEMPLATES',
      'LOCATION_BRANCHING_ENCOUNTER_TEMPLATES',
    ]);
  });
});
