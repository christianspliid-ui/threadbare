import { describe, it, expect, beforeEach } from 'vitest';
import {
  COLORATION_TOKEN,
  compileOpeningColoration,
  colorationSkipReason,
  enumerateTemplateSurfaces,
  resolveOpeningColoration,
  resetFragmentWarnings,
  type OpeningColorationInput,
} from '../fragmentResolution';
import {
  CULTURE_CUSTOMS,
  CULTURE_CUSTOM_VARIANTS,
  SPHERE_FACTS,
  SPHERE_FACT_MIN_SHARE,
  allColorationLines,
} from '../../data/culture-sphere-lines';
import { WorldGraph } from '../graph';
import { readCultureCustomVariant, stampCultureCustomVariants } from '../cultureGenerator';
import { gatherPlaceColoration, buildColorationCensus } from '../openingColoration';
import { enrichProse, gatherNarrativeContext } from '../proseEnrichment';
import { SPHERE_VOCABULARY } from '../../data/narrative-content';
import { SPHERE_NAMES } from '../../types/index';
import { colorationLineProblems, openingSkeletonProblems } from '../../data/content-eval/doctrineV2Checks';
import { NUDGE_WORD_BUDGETS } from '../../data/content-eval/nudgeAuthoringConstants';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

/**
 * THR-1635 — culture and spheres showing through: one stated fact per encounter opening.
 * Unit level: the resolver's every reason code and precedence, the compile pass, the
 * worldgen stamp and its pre-stamp fallback, the render path, and the doctrine rules.
 * The corpus guard and the generated-world leak guard live beside the catalogs
 * (`src/data/__tests__/openingColoration-corpus.test.ts`).
 */

const TOWN: OpeningColorationInput = {
  reach: 'stone',
  placeLocationId: 'loc.town',
  placeName: 'Tistas',
  foundation: 'order',
  cultureId: 'culture.a',
  cultureName: 'The Tistasean Folk',
  cultureVariant: 0,
  demonym: 'Tistasean',
  dominantSphere: 'matter',
  sphereShare: 0.7,
};

beforeEach(() => resetFragmentWarnings());

describe('resolveOpeningColoration — choosing the line (THR-1635)', () => {
  it('states the culture custom first when both apply, with demonym and place filled', () => {
    const c = resolveOpeningColoration(TOWN, 't');
    expect(c.kind).toBe('culture');
    expect(c.reason).toBe('culture');
    expect(c.cell).toBe('culture.order.stone');
    expect(c.variant).toBe(0);
    expect(c.text).toBe('The Tistasean guild rolls list who may learn which technique; {actor} is not on it, and the clerk will not bend.');
    // The chosen line rides the ordinary fragment machinery.
    expect(c.binding).toMatchObject({ slot: 'place_fact', axis: 'foundation', value: 'order' });
  });

  it('two same-foundation cultures read different customs through their stamps', () => {
    const lines = [0, 1, 2].map(v => resolveOpeningColoration({ ...TOWN, cultureVariant: v }).text);
    expect(new Set(lines).size).toBe(3);
    // The stamp wraps modulo the cell length (more cultures than variants).
    expect(resolveOpeningColoration({ ...TOWN, cultureVariant: 3 }).text).toBe(lines[0]);
  });

  it('falls to the sphere fact when there is no culture, variant by stable place hash', () => {
    const input = { ...TOWN, foundation: null, cultureId: null, demonym: null };
    const a = resolveOpeningColoration(input);
    expect(a.kind).toBe('sphere');
    expect(a.cell).toBe('sphere.matter.stone');
    expect(SPHERE_FACTS.matter?.stone?.map(l => l.replace('{place}', 'Tistas'))).toContain(a.text);
    expect(resolveOpeningColoration(input).text).toBe(a.text); // deterministic
    expect(a.binding).toMatchObject({ axis: 'sphere', value: 'matter' });
  });

  it('every reason code', () => {
    expect(resolveOpeningColoration({ ...TOWN, reach: null }).reason).toBe('no_reach');
    expect(resolveOpeningColoration({ reach: 'stone' }).reason).toBe('no_place');
    expect(resolveOpeningColoration({ ...TOWN, foundation: null, dominantSphere: null, sphereShare: null }).reason)
      .toBe('no_culture');
    expect(resolveOpeningColoration({ ...TOWN, foundation: 'balanced', sphereShare: 0.1 }).reason)
      .toBe('unknown_foundation');
    // A reach slice 1 did not author (slice 2, THR-1638) → falls through, cell named.
    const unauthored = resolveOpeningColoration({ ...TOWN, reach: 'gold', sphereShare: 0.1 });
    expect(unauthored.reason).toBe('culture_cell_unauthored');
    expect(unauthored.cell).toBe('culture.order.gold');
    expect(resolveOpeningColoration({ ...TOWN, foundation: null, sphereShare: SPHERE_FACT_MIN_SHARE - 0.01 }).reason)
      .toBe('sphere_below_share');
    expect(resolveOpeningColoration({ ...TOWN, foundation: null, dominantSphere: 'force' }).reason)
      .toBe('sphere_cell_unauthored');
    for (const r of ['culture', 'sphere'] as const) {
      expect(resolveOpeningColoration(r === 'culture' ? TOWN : { ...TOWN, foundation: null }).reason).toBe(r);
    }
  });

  it('an unusable culture falls through to a strong sphere', () => {
    expect(resolveOpeningColoration({ ...TOWN, foundation: 'balanced' }).kind).toBe('sphere');
    expect(resolveOpeningColoration({ ...TOWN, reach: 'eye', foundation: 'balanced' }).cell).toBe('sphere.matter.eye');
  });

  it('the share threshold is inclusive', () => {
    const at = resolveOpeningColoration({ ...TOWN, foundation: null, sphereShare: SPHERE_FACT_MIN_SHARE });
    expect(at.kind).toBe('sphere');
  });
});

describe('compileOpeningColoration — placing the token (THR-1635)', () => {
  const base = (prose: string, over: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate =>
    ({ id: 'encounter.test', reach: 'stone', steps: [{ narrativeTemplate: prose }], ...over }) as unknown as UnifiedActionTemplate;
  const prose0 = (t: UnifiedActionTemplate) => (t.steps[0] as { narrativeTemplate: string }).narrativeTemplate;

  it('ends the first paragraph (P2) when there is a paragraph break', () => {
    expect(prose0(compileOpeningColoration(base('Situation here.\n\nThe problem.'))))
      .toBe(`Situation here.${COLORATION_TOKEN}\n\nThe problem.`);
  });

  it('skips the opening envelope paragraph', () => {
    expect(prose0(compileOpeningColoration(base('{frag:opening}\n\nSituation.\n\nProblem.'))))
      .toBe(`{frag:opening}\n\nSituation.${COLORATION_TOKEN}\n\nProblem.`);
  });

  it('ends the prose when there is no paragraph break, keeping trailing whitespace', () => {
    expect(prose0(compileOpeningColoration(base('One paragraph.  ')))).toBe(`One paragraph.${COLORATION_TOKEN}  `);
  });

  it('is idempotent and leaves an author-placed token alone', () => {
    const once = compileOpeningColoration(base('A.\n\nB.'));
    expect(compileOpeningColoration(once)).toBe(once);
    const authored = base(`A ${COLORATION_TOKEN} b.\n\nC.`);
    expect(compileOpeningColoration(authored)).toBe(authored);
  });

  it('returns skipped templates as the same object', () => {
    const slice = base('A.', { id: 'encounter.slice.unsafe_bridge' });
    expect(colorationSkipReason(slice)).toBe('excluded_prefix');
    expect(compileOpeningColoration(slice)).toBe(slice);
    const noReach = base('A.', { reach: undefined as never });
    expect(colorationSkipReason(noReach)).toBe('no_reach');
    const branch = base('', { steps: [{ branchId: 'b', options: [] }] as never });
    expect(colorationSkipReason(branch)).toBe('branch_first');
    expect(colorationSkipReason(base('   '))).toBe('no_prose');
  });

  it('coloration axes never count as surfaces; an authored coloration slot is reported', () => {
    const e = enumerateTemplateSurfaces({
      id: 't',
      contextFragments: [{ slot: 'x', axis: 'foundation', variants: { '*': 'a', light: 'b' } }],
    });
    expect(e.surfaceCount).toBe(1);
    expect(e.problems.join()).toMatch(/coloration axis "foundation"/);
  });
});

describe('the worldgen stamp and its pre-stamp fallback (THR-1635)', () => {
  function world(): WorldGraph {
    const g = new WorldGraph();
    const culture = (id: string, foundationBias: string) =>
      g.addNode({ id, type: 'actor', name: id, properties: { actorType: 'culture', cultureIdentity: { foundationBias, demonym: `${id}-folk` } } });
    culture('culture.b', 'light');
    culture('culture.a', 'light');
    culture('culture.c', 'darkness');
    return g;
  }

  it('stamps same-foundation cultures by sorted id ordinal', () => {
    const g = world();
    stampCultureCustomVariants(g);
    const stamp = (id: string) => (g.getNode(id)!.properties.cultureIdentity as { customVariant?: number }).customVariant;
    expect(stamp('culture.a')).toBe(0);
    expect(stamp('culture.b')).toBe(1);
    expect(stamp('culture.c')).toBe(0);
    expect(CULTURE_CUSTOM_VARIANTS).toBe(3);
  });

  it('a save without the stamp derives the same ordinal at read time', () => {
    const unstamped = world();
    const stamped = world();
    stampCultureCustomVariants(stamped);
    for (const id of ['culture.a', 'culture.b', 'culture.c']) {
      expect(readCultureCustomVariant(unstamped, id)).toBe(readCultureCustomVariant(stamped, id));
    }
  });

  it('gathers the town culture for a Place, and renders the line through enrichProse', () => {
    const g = world();
    stampCultureCustomVariants(g);
    g.addNode({ id: 'loc.town', type: 'location', name: 'Brightwater', properties: { locationSubtype: 'town' } });
    g.addNode({ id: 'loc.forge', type: 'location', name: 'The Forge', properties: { parentLocationId: 'loc.town' } });
    g.addEdge({ id: 'e1', type: 'belongs_to', source: 'loc.town', target: 'culture.b', properties: { cultureLayer: 'current' } });
    g.addNode({ id: 'agent.1', type: 'actor', name: 'Mira', properties: { actorType: 'individual' } });
    g.addEdge({ id: 'e2', type: 'located_at', source: 'agent.1', target: 'loc.forge', properties: {} });

    const place = gatherPlaceColoration(g, 'loc.forge');
    expect(place).toMatchObject({ placeLocationId: 'loc.town', placeName: 'Brightwater', foundation: 'light', cultureVariant: 1 });

    const ctx = gatherNarrativeContext(g, 'agent.1', undefined, undefined, null, undefined, 0, {
      contextFragmentTemplateId: 'encounter.test',
      templateReach: 'stone',
    });
    const out = enrichProse(`Mira studies the work.${COLORATION_TOKEN}\n\nWhat now?`, ctx);
    const expected = CULTURE_CUSTOMS.light.stone![1]
      .replace('{demonym}', 'culture.b-folk')
      .replace('{actor}', 'Mira');
    expect(out).toBe(`Mira studies the work. ${expected}\n\nWhat now?`);
    expect(out).not.toMatch(/[{}]/);

    // No reach threaded → the token strips, the paragraph reads exactly as authored.
    const plain = gatherNarrativeContext(g, 'agent.1');
    expect(enrichProse(`Mira studies the work.${COLORATION_TOKEN}`, plain)).toBe('Mira studies the work.');

    const census = buildColorationCensus(g);
    expect(census.withCulture).toBe(1);
    expect(census.cultures[0]).toMatchObject({ cultureId: 'culture.b', foundation: 'light', customVariant: 1 });
  });
});

describe('content rules (THR-1635)', () => {
  it('every table line holds the doctrine: budget, tokens, one sentence, no sphere jargon', () => {
    expect(colorationLineProblems()).toEqual([]);
    // Non-vacuous floor: slice 1's 36 culture + 24 sphere lines (slice 2 only adds).
    expect(allColorationLines().length).toBeGreaterThanOrEqual(60);
  });

  it('slice 1 cells are complete: three culture variants and two sphere variants each', () => {
    for (const foundation of ['chaos', 'order', 'light', 'darkness'] as const) {
      for (const reach of ['iron', 'stone', 'eye'] as const) {
        expect(CULTURE_CUSTOMS[foundation][reach]).toHaveLength(3);
      }
    }
    for (const sphere of ['life', 'matter', 'darkness', 'order'] as const) {
      for (const reach of ['iron', 'stone', 'eye'] as const) {
        expect(SPHERE_FACTS[sphere]?.[reach]).toHaveLength(2);
      }
    }
  });

  it('the doctrine checker catches an over-budget line and a {culture} token', () => {
    const long = Array.from({ length: NUDGE_WORD_BUDGETS.colorationLine + 1 }, () => 'word').join(' ') + '.';
    const lines = CULTURE_CUSTOMS.chaos.iron as string[];
    lines.push(long, 'The {culture} way.');
    try {
      const problems = colorationLineProblems().join('\n');
      expect(problems).toMatch(/over the budget of 28/);
      expect(problems).toMatch(/uses \{culture\}/);
    } finally {
      lines.splice(-2, 2);
    }
  });

  it('the opening word budget ignores the compiled token', () => {
    const opening = `{location} gate.\n\nThe situation.${COLORATION_TOKEN}\n\nThe problem.`;
    expect(openingSkeletonProblems(opening)).toEqual([]);
    // And the token does not pass for a place name in P1.
    expect(openingSkeletonProblems(`Nowhere.${COLORATION_TOKEN}\n\nB.\n\nC.`).join()).toMatch(/P1 names no place/);
  });

  it('SPHERE_VOCABULARY covers all twelve spheres', () => {
    for (const sphere of SPHERE_NAMES) {
      const v = SPHERE_VOCABULARY[sphere];
      expect(v?.adjectives.length, sphere).toBe(10);
      expect(v?.verbs.length, sphere).toBe(10);
      expect(v?.nouns.length, sphere).toBe(10);
    }
  });
});
