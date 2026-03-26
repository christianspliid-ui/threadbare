/**
 * Tests for TB-042 Layer Revelation gating in getTargetActionSlots().
 *
 * Covers: Gate 7 (revelation), Create bypass, backward compatibility,
 * fail-soft when hexRevelation is missing.
 */
import { describe, it, expect } from 'vitest';
import { getTargetActionSlots } from '../targetActions';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { HexRevelation } from '../../types/unifiedAction';
import { createDefaultHexRevelation } from '../../types/unifiedAction';
import type { TargetContext } from '../../types/targetContext';
import { SPHERE_NAMES } from '../../types/index';
import type { EssencePool } from '../../types/influence';
import { hexKey } from '../../lib/hexKey';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createPool(force = 100): EssencePool {
  const pool = {} as EssencePool;
  for (const s of SPHERE_NAMES) pool[s] = 0;
  pool.force = force;
  return pool;
}

function makeTemplate(overrides: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate {
  return {
    id: 'test_template',
    name: 'Test Action',
    reach: 'martial',
    crudType: 'update',
    scale: 'local',
    steps: [{
      reach: 'martial',
      duration: { min: 1, max: 1 },
      difficulty: 0.5,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 1,
    actorAffinities: [],
    targetCategories: ['hex'],
    sphereAffinity: 'force',
    motivations: [],
    narrativeTemplates: {
      initiation: 'Test.',
      success: 'Done.',
      failure: 'Failed.',
    },
    ...overrides,
  };
}

function makeHexTarget(col = 3, row = 5): TargetContext {
  return {
    nodeId: 'hex_3_5',
    nodeType: 'location',
    subtype: 'hex',
    traitIds: [],
    position: { col, row },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Gate 7: Layer Revelation', () => {
  it('filters out templates for unrevealed layers', () => {
    const template = makeTemplate({
      id: 'change_soul',
      narrativeLayer: 'soul',
      crudType: 'update',
    });
    const revelation: Record<string, HexRevelation> = {
      [hexKey(3, 5)]: createDefaultHexRevelation(), // all false
    };

    const slots = getTargetActionSlots({
      target: makeHexTarget(),
      templates: [template],
      pool: createPool(),
      primarySphere: 'force',
      accessibleSpheres: ['force'],
      hexRevelation: revelation,
    });

    expect(slots).toHaveLength(0);
  });

  it('allows templates for revealed layers', () => {
    const template = makeTemplate({
      id: 'change_soul',
      narrativeLayer: 'soul',
      crudType: 'update',
    });
    const rev = createDefaultHexRevelation();
    rev.soul = true;
    const revelation: Record<string, HexRevelation> = {
      [hexKey(3, 5)]: rev,
    };

    const slots = getTargetActionSlots({
      target: makeHexTarget(),
      templates: [template],
      pool: createPool(),
      primarySphere: 'force',
      accessibleSpheres: ['force'],
      hexRevelation: revelation,
    });

    expect(slots).toHaveLength(1);
    expect(slots[0].label).toBe('Test Action');
  });

  it('bypasses revelation gate for Create actions (crudType: create)', () => {
    const template = makeTemplate({
      id: 'create_soul',
      narrativeLayer: 'soul',
      crudType: 'create',
    });
    const revelation: Record<string, HexRevelation> = {
      [hexKey(3, 5)]: createDefaultHexRevelation(), // all unrevealed
    };

    const slots = getTargetActionSlots({
      target: makeHexTarget(),
      templates: [template],
      pool: createPool(),
      primarySphere: 'force',
      accessibleSpheres: ['force'],
      hexRevelation: revelation,
    });

    expect(slots).toHaveLength(1);
  });

  it('bypasses revelation gate when bypassRevelationGate is true', () => {
    const template = makeTemplate({
      id: 'special_update',
      narrativeLayer: 'ruins',
      crudType: 'update',
      bypassRevelationGate: true,
    });
    const revelation: Record<string, HexRevelation> = {
      [hexKey(3, 5)]: createDefaultHexRevelation(),
    };

    const slots = getTargetActionSlots({
      target: makeHexTarget(),
      templates: [template],
      pool: createPool(),
      primarySphere: 'force',
      accessibleSpheres: ['force'],
      hexRevelation: revelation,
    });

    expect(slots).toHaveLength(1);
  });

  it('backward compat: templates without narrativeLayer are not gated', () => {
    const template = makeTemplate({
      id: 'legacy_action',
      // No narrativeLayer
    });
    const revelation: Record<string, HexRevelation> = {
      [hexKey(3, 5)]: createDefaultHexRevelation(),
    };

    const slots = getTargetActionSlots({
      target: makeHexTarget(),
      templates: [template],
      pool: createPool(),
      primarySphere: 'force',
      accessibleSpheres: ['force'],
      hexRevelation: revelation,
    });

    expect(slots).toHaveLength(1);
  });

  it('fail-soft: missing hexRevelation map filters layer-gated non-Create templates', () => {
    const template = makeTemplate({
      narrativeLayer: 'soul',
      crudType: 'update',
    });

    const slots = getTargetActionSlots({
      target: makeHexTarget(),
      templates: [template],
      pool: createPool(),
      primarySphere: 'force',
      accessibleSpheres: ['force'],
      // hexRevelation omitted
    });

    expect(slots).toHaveLength(0);
  });

  it('fail-soft: missing hex entry in revelation map treats layers as unrevealed', () => {
    const template = makeTemplate({
      narrativeLayer: 'people',
      crudType: 'update',
    });
    const revelation: Record<string, HexRevelation> = {
      // No entry for hex 3,5
    };

    const slots = getTargetActionSlots({
      target: makeHexTarget(),
      templates: [template],
      pool: createPool(),
      primarySphere: 'force',
      accessibleSpheres: ['force'],
      hexRevelation: revelation,
    });

    expect(slots).toHaveLength(0);
  });

  it('skips revelation gating for targets without position (non-hex)', () => {
    const template = makeTemplate({
      id: 'agent_action',
      narrativeLayer: 'people',
      crudType: 'update',
      targetCategories: ['actor'],
    });

    const target: TargetContext = {
      nodeId: 'agent_1',
      nodeType: 'actor',
      subtype: 'mortal',
      traitIds: [],
      // No position
    };

    const slots = getTargetActionSlots({
      target,
      templates: [template],
      pool: createPool(),
      primarySphere: 'force',
      accessibleSpheres: ['force'],
      hexRevelation: {},
    });

    expect(slots).toHaveLength(1);
  });

  it('land layer auto-reveals do not gate land templates when revealed', () => {
    const template = makeTemplate({
      narrativeLayer: 'land',
      crudType: 'update',
    });
    const rev = createDefaultHexRevelation();
    rev.land = true;
    const revelation: Record<string, HexRevelation> = {
      [hexKey(3, 5)]: rev,
    };

    const slots = getTargetActionSlots({
      target: makeHexTarget(),
      templates: [template],
      pool: createPool(),
      primarySphere: 'force',
      accessibleSpheres: ['force'],
      hexRevelation: revelation,
    });

    expect(slots).toHaveLength(1);
  });
});

describe('createDefaultHexRevelation', () => {
  it('creates all-false revelation state', () => {
    const rev = createDefaultHexRevelation();
    expect(rev.land).toBe(false);
    expect(rev.soul).toBe(false);
    expect(rev.people).toBe(false);
    expect(rev.ruins).toBe(false);
  });
});
