import { describe, expect, it } from 'vitest';

import {
  classifyFindGate,
  runFindFirstLint,
  type FindGateTemplate,
} from '../lint-find-first';
import type { UnifiedActionTemplate } from '../../src/types/unifiedAction';

// ---------------------------------------------------------------------------
// classifyFindGate — the pure rule
// ---------------------------------------------------------------------------

describe('classifyFindGate', () => {
  it('ignores non-update templates (out of scope)', () => {
    const create: FindGateTemplate = { id: 'a.create', crudType: 'create' };
    const read: FindGateTemplate = { id: 'a.read', crudType: 'read' };
    expect(classifyFindGate(create)).toBe('out-of-scope');
    expect(classifyFindGate(read)).toBe('out-of-scope');
  });

  it('passes a Change/Control template with a narrativeLayer (revelation-gated = Found)', () => {
    const gated: FindGateTemplate = {
      id: 'change.gated',
      crudType: 'update',
      narrativeLayer: 'soul',
    };
    expect(classifyFindGate(gated)).toBe('gated');
  });

  it('passes a starter-floor Change/Control template', () => {
    const starter: FindGateTemplate = {
      id: 'change.starter',
      crudType: 'update',
      starter: true,
    };
    expect(classifyFindGate(starter)).toBe('starter');
  });

  it('flags a Change/Control template with no Find gate', () => {
    const violating: FindGateTemplate = { id: 'change.ungated', crudType: 'update' };
    expect(classifyFindGate(violating)).toBe('violation');
  });
});

// ---------------------------------------------------------------------------
// runFindFirstLint — corpus run + summary
// ---------------------------------------------------------------------------

// Cast through unknown: the lint only reads id/crudType/narrativeLayer/starter,
// so minimal fixtures are sufficient for the rule under test.
function asTemplate(t: FindGateTemplate): UnifiedActionTemplate {
  return t as unknown as UnifiedActionTemplate;
}

describe('runFindFirstLint', () => {
  it('counts gated/starter passes and flags only the ungated update template', () => {
    const corpus = [
      asTemplate({ id: 'land.create', crudType: 'create' }),
      asTemplate({ id: 'soul.gated', crudType: 'update', narrativeLayer: 'soul' }),
      asTemplate({ id: 'people.starter', crudType: 'update', starter: true }),
      asTemplate({ id: 'ruins.ungated', crudType: 'update' }),
    ];

    const { violations, summary } = runFindFirstLint(corpus);

    expect(summary.templateCount).toBe(4);
    expect(summary.updateCount).toBe(3);
    expect(summary.gatedCount).toBe(1);
    expect(summary.starterCount).toBe(1);
    expect(summary.violationCount).toBe(1);
    expect(violations.map((v) => v.id)).toEqual(['ruins.ungated']);
  });

  it('produces zero violations when every update template is gated', () => {
    const corpus = [
      asTemplate({ id: 'a.gated', crudType: 'update', narrativeLayer: 'land' }),
      asTemplate({ id: 'b.starter', crudType: 'update', starter: true }),
    ];
    expect(runFindFirstLint(corpus).summary.violationCount).toBe(0);
  });
});
