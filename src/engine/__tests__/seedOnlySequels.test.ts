/**
 * THR-1526 — the seed-only-sequel predicate and the two `check:encounter` warnings.
 * The fatal corpus gates live in `encounterSeedLiveness.test.ts`; this file pins the
 * units those gates and the runner are built from.
 */
import { describe, it, expect } from 'vitest';
import { isDrawable } from '../encounterCache';
import {
  buildSeedPlanterIndex,
  cacheFedTemplateIds,
  seedOnlyWarnings,
  type SeedPlanterIndex,
} from '../seedOnlySequels';
import { getAllStrategicTemplates } from '../strategicActionCandidates';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

const REAL_INDEX = buildSeedPlanterIndex(getAllStrategicTemplates());
const REAL_CACHE_FED = cacheFedTemplateIds();

function fixture(overrides: Partial<UnifiedActionTemplate>): UnifiedActionTemplate {
  return {
    id: 'encounter.fixture.sequel',
    name: 'Fixture Sequel',
    intrinsicTier: 'background',
    rarityTier: 2,
    reach: 'heart',
    crudType: 'read',
    scale: 'local',
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['mercy_ruthlessness'],
    locationSubtypes: ['town'],
    steps: [],
    narrativeTemplates: { initiation: 'i', success: 's', failure: 'f' },
    ...overrides,
  };
}

/** An index in which the fixture is a literal seed target, as a real planter would make it. */
function indexNaming(id: string): SeedPlanterIndex {
  return {
    plantersOf: new Map([[id, [{ planterId: 'encounter.fixture.parent', site: 'aftermath.x', branch: 'plain', by: 'templateId' }]]]),
    literalTargets: new Set([id]),
    querySites: [],
  };
}

describe('isDrawable (THR-1526)', () => {
  it('absent and true are drawable; only an explicit false is not', () => {
    expect(isDrawable({})).toBe(true);
    expect(isDrawable({ drawable: true })).toBe(true);
    expect(isDrawable({ drawable: false })).toBe(false);
  });
});

describe('check:encounter seed-only warnings (THR-1526)', () => {
  it('warns on a drawable: false template that nothing plants', () => {
    const orphan = fixture({ drawable: false });
    const empty: SeedPlanterIndex = { plantersOf: new Map(), literalTargets: new Set(), querySites: [] };
    const warnings = seedOnlyWarnings(orphan, empty, new Set());
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/nothing plants it/);
  });

  it('is silent on the four real sequels — each has a planter', () => {
    for (const id of [
      'encounter.slice.full_moon_collection',
      'encounter.slice.full_moon_reckoning',
      'encounter.slice.swindler_found',
      'encounter.slice.grateful_kin',
    ]) {
      const template = getUnifiedTemplateById(id);
      expect(template, id).toBeDefined();
      expect(seedOnlyWarnings(template!, REAL_INDEX, REAL_CACHE_FED), id).toEqual([]);
    }
  });

  it('warns on an undeclared encounter.* seed target on the board, and is silent once it declares either value', () => {
    const id = 'encounter.fixture.sequel';
    const index = indexNaming(id);
    const cacheFed = new Set([id]);

    const undeclared = seedOnlyWarnings(fixture({}), index, cacheFed);
    expect(undeclared).toHaveLength(1);
    expect(undeclared[0]).toMatch(/no `drawable` declared/);

    expect(seedOnlyWarnings(fixture({ drawable: true }), index, cacheFed)).toEqual([]);
    expect(seedOnlyWarnings(fixture({ drawable: false }), index, cacheFed)).toEqual([]);
  });

  it('does not ask a target the board cannot reach to declare anything', () => {
    const id = 'encounter.fixture.sequel';
    // Not cache-fed, or an empty envelope, or outside `encounter.*`: the board never offers it.
    expect(seedOnlyWarnings(fixture({}), indexNaming(id), new Set())).toEqual([]);
    expect(seedOnlyWarnings(fixture({ locationSubtypes: [] }), indexNaming(id), new Set([id]))).toEqual([]);
    const outside = 'social.fixture.sequel';
    expect(seedOnlyWarnings(fixture({ id: outside }), indexNaming(outside), new Set([outside]))).toEqual([]);
  });

  it('every real encounter.* seed target on the board declares drawable', () => {
    const undeclared = [...REAL_INDEX.literalTargets]
      .map(id => getUnifiedTemplateById(id))
      .filter((t): t is UnifiedActionTemplate => t !== undefined)
      .filter(t => seedOnlyWarnings(t, REAL_INDEX, REAL_CACHE_FED).length > 0)
      .map(t => t.id);
    expect(undeclared).toEqual([]);
  });
});
