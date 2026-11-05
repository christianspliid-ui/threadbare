import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import type { ActionStep, ActionStepOrBranch, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { FactionDefinition } from '../../types/faction';
import { REACH_DOMAINS } from '../../types/traits';
import { FACTION_DEFINITIONS } from '../../data/faction-definitions';
import { MONSTER_FACTION_DEFINITIONS } from '../../data/monster-faction-definitions';
import {
  assertAllValidReaches,
  assertNoDuplicateIds,
  assertNoRetiredPlayerPickField,
  RETIRED_PLAYER_PICK_FIELD,
  assertValidReachWeights,
  assertValidStep,
  assertValidUnifiedTemplate,
} from '../contentInvariants';

function makeStep(overrides: Partial<ActionStep> = {}): ActionStep {
  return {
    reach: 'iron',
    duration: { min: 1, max: 2 },
    difficulty: 0.5,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'continue_weakened',
    ...overrides,
  };
}

function makeUnifiedTemplate(overrides: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate {
  return {
    id: 'ua.test.valid',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    name: 'Valid Unified Template',
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    steps: [makeStep()],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: {
      initiation: 'A trial begins.',
      success: 'A trial succeeds.',
      failure: 'A trial fails.',
    },
    ...overrides,
  };
}

describe('assertValidUnifiedTemplate', () => {
  it('passes a minimally valid unified template', () => {
    expect(() => assertValidUnifiedTemplate(makeUnifiedTemplate())).not.toThrow();
  });
});

describe('assertValidStep', () => {
  it('throws on invalid reach', () => {
    const invalidReach = makeStep({ reach: 'invalid_reach' as never });
    expect(() => assertValidStep(invalidReach, 'ua.invalid.reach')).toThrow();
  });

  it('throws on difficulty outside [0, 1]', () => {
    const invalidDifficulty = makeStep({ difficulty: 1.5 });
    expect(() => assertValidStep(invalidDifficulty, 'ua.invalid.difficulty')).toThrow();
  });

  it('throws when duration min exceeds max', () => {
    const invalidDuration = makeStep({ duration: { min: 5, max: 3 } });
    expect(() => assertValidStep(invalidDuration, 'ua.invalid.duration.order')).toThrow();
  });

  it('throws when duration min is below 1', () => {
    const invalidDuration = makeStep({ duration: { min: 0, max: 5 } });
    expect(() => assertValidStep(invalidDuration, 'ua.invalid.duration.min')).toThrow();
  });

  it('throws when a branch variant is invalid', () => {
    const branchStep: ActionStepOrBranch = {
      branchOnStep: 0,
      variants: {
        choose_safe: makeStep(),
        choose_risky: makeStep({ reach: 'invalid_reach' as never }),
      },
      fallback: makeStep(),
    };
    expect(() => assertValidStep(branchStep, 'ua.invalid.branch')).toThrow();
  });
});

describe('assertNoDuplicateIds', () => {
  it('passes for unique ids', () => {
    expect(() => assertNoDuplicateIds([{ id: 'a' }, { id: 'b' }])).not.toThrow();
  });

  it('throws for duplicate ids', () => {
    expect(() => assertNoDuplicateIds([{ id: 'a' }, { id: 'a' }])).toThrow();
  });
});

describe('assertAllValidReaches', () => {
  it('passes when all template steps have valid reaches', () => {
    const templates = [
      makeUnifiedTemplate({ id: 'ua.one', steps: [makeStep({ reach: 'iron' }), makeStep({ reach: 'gold' })] }),
      makeUnifiedTemplate({ id: 'ua.two', steps: [makeStep({ reach: 'heart' })] }),
    ];
    expect(() => assertAllValidReaches(templates)).not.toThrow();
  });
});

describe('assertValidReachWeights — real faction content (THR-1345)', () => {
  const ALL_DEFINITIONS: readonly FactionDefinition[] = [
    ...FACTION_DEFINITIONS.values(),
    ...MONSTER_FACTION_DEFINITIONS,
  ];

  // The sweep below is only meaningful over a real, populated corpus. Assert the
  // population first so a registry that stops exporting definitions fails loudly
  // instead of turning every assertion under it into a vacuous pass.
  it('sweeps a non-empty corpus that actually declares reachWeights', () => {
    expect(ALL_DEFINITIONS.length).toBeGreaterThanOrEqual(20);
    const declaring = ALL_DEFINITIONS.filter(d => Object.keys(d.reachWeights).length > 0);
    expect(declaring.length).toBe(ALL_DEFINITIONS.length);
  });

  it.each(ALL_DEFINITIONS.map(d => [d.id, d] as const))(
    'faction %s declares only live ReachDomain keys',
    (_id, definition) => {
      expect(() => assertValidReachWeights(definition)).not.toThrow();
    },
  );

  // Negative control. Without this, the sweep above would pass just as happily if
  // `assertValidReachWeights` were a no-op — which is the shape this codebase keeps
  // producing. Both retired names that were actually present are exercised.
  it.each(['flesh', 'force'])('rejects the stale key %s', staleKey => {
    const poisoned = {
      ...MONSTER_FACTION_DEFINITIONS[0],
      reachWeights: { iron: 0.9, [staleKey]: 0.7 },
    } as unknown as FactionDefinition;
    expect(() => assertValidReachWeights(poisoned)).toThrow(new RegExp(staleKey));
  });

  it('accepts every live ReachDomain', () => {
    const clean = {
      ...MONSTER_FACTION_DEFINITIONS[0],
      reachWeights: Object.fromEntries(REACH_DOMAINS.map(r => [r, 0.5])),
    } as FactionDefinition;
    expect(() => assertValidReachWeights(clean)).not.toThrow();
  });
});

/**
 * THR-2161 — the retired player-pick field stays retired. Canon said "zero
 * templates carry it" for three months while 34 did; this makes the claim a
 * check. (THR-1800's pricing check on the same cards went with the field.)
 */
describe('retired player-pick field (catalog-wide, THR-2161)', () => {
  it('no shipped template carries it', () => {
    const carriers = UNIFIED_ACTION_TEMPLATES
      .filter(t => Object.prototype.hasOwnProperty.call(t, RETIRED_PLAYER_PICK_FIELD))
      .map(t => t.id);
    expect(carriers).toEqual([]);
    for (const template of UNIFIED_ACTION_TEMPLATES) assertNoRetiredPlayerPickField(template);
  });

  it('fails a template that carries it (negative control)', () => {
    const poisoned = {
      ...UNIFIED_ACTION_TEMPLATES[0],
      [RETIRED_PLAYER_PICK_FIELD]: { 0: [] },
    } as unknown as UnifiedActionTemplate;
    expect(() => assertNoRetiredPlayerPickField(poisoned)).toThrow(/THR-2161/);
    expect(() => assertValidUnifiedTemplate(poisoned)).toThrow(/THR-2161/);
  });
});

/**
 * THR-1800 — every authored illustration points at a file that ships.
 * Catalog-wide: the nine dead placeholder URLs sat in templates no narrower
 * content harness looked at.
 */
describe('authored illustrations (catalog-wide, THR-1800)', () => {
  it('every illustrationUrl resolves to a file under public/', () => {
    const missing = UNIFIED_ACTION_TEMPLATES
      .filter(t => t.illustrationUrl && !existsSync(join(process.cwd(), 'public', t.illustrationUrl)))
      .map(t => `${t.id} → ${t.illustrationUrl}`);
    expect(missing).toEqual([]);
  });
});
