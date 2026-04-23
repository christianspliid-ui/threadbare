import { describe, expect, it } from 'vitest';
import type { EncounterTemplate } from '../../types/encounter';
import type { ActionStep, ActionStepOrBranch, UnifiedActionTemplate } from '../../types/unifiedAction';
import {
  assertAllValidReaches,
  assertNoDuplicateIds,
  assertValidEncounterTemplate,
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

function makeEncounterTemplate(overrides: Partial<EncounterTemplate> = {}): EncounterTemplate {
  return {
    id: 'enc.test.valid',
    name: 'Valid Encounter Template',
    locationTypes: ['town'],
    steps: [
      {
        id: 'step.1',
        name: 'Opening',
        narrative: 'The opening beat begins in earnest.',
        reach: 'iron',
        difficulty: 40,
        onSuccess: { narrative: 'Success unfolds with palpable narrative consequence.' },
        onFailure: { narrative: 'Failure unfolds with palpable narrative consequence.' },
      },
      {
        id: 'step.2',
        name: 'Resolution',
        narrative: 'The scene tightens and then resolves.',
        reach: 'gold',
        difficulty: 55,
        onSuccess: { narrative: 'Success closes the arc with meaningful momentum.' },
        onFailure: { narrative: 'Failure closes the arc with meaningful momentum.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['courage_prudence'],
    ...overrides,
  };
}

describe('assertValidUnifiedTemplate', () => {
  it('passes a minimally valid unified template', () => {
    expect(() => assertValidUnifiedTemplate(makeUnifiedTemplate())).not.toThrow();
  });
});

describe('assertValidEncounterTemplate', () => {
  it('passes a minimally valid encounter template', () => {
    expect(() => assertValidEncounterTemplate(makeEncounterTemplate())).not.toThrow();
  });

  it('throws when encounter reach is invalid', () => {
    const template = makeEncounterTemplate({ reachPrimary: 'invalid_reach' as never });
    expect(() => assertValidEncounterTemplate(template)).toThrow();
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
