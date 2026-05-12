import { describe, it, expect } from 'vitest';
import { getTargetActionSlots, TARGET_ACTION_CONSTANTS, templateIdFromSlotId } from '../targetActions';
import type { TargetContext } from '../../types/targetContext';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { EssencePool } from '../../types/influence';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const BASE_POOL: EssencePool = {
  mind: 10, spirit: 10, force: 10, life: 10,
  order: 10, chaos: 10, time: 10, void: 10,
};

const EMPTY_POOL: EssencePool = {
  mind: 0, spirit: 0, force: 0, life: 0,
  order: 0, chaos: 0, time: 0, void: 0,
};

function actorTarget(overrides?: Partial<TargetContext>): TargetContext {
  return {
    nodeId: 'actor.alice',
    nodeType: 'actor',
    displayName: 'Alice',
    displayLabel: 'Tier 2 Disciple',
    subtype: 'individual',
    traitIds: [],
    sphereAffinity: null,
    position: null,
    influenceTier: 2,
    properties: {},
    ...overrides,
  };
}

function locationTarget(overrides?: Partial<TargetContext>): TargetContext {
  return {
    nodeId: 'loc.keep',
    nodeType: 'location',
    displayName: 'Iron Keep',
    displayLabel: 'keep',
    subtype: 'keep',
    traitIds: [],
    sphereAffinity: null,
    position: null,
    properties: {},
    ...overrides,
  };
}

function makeTemplate(overrides: Partial<UnifiedActionTemplate> & Pick<UnifiedActionTemplate, 'id' | 'name'>): UnifiedActionTemplate {
  return {
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    steps: [],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: [],
    narrativeTemplates: {
      initiation: 'does something',
      success: 'it works',
      failure: 'it fails',
    },
    ...overrides,
  };
}

// ─── Filter cascade tests ────────────────────────────────────────────────────

describe('getTargetActionSlots — node-type gate (filter 1)', () => {
  it('returns slots for templates matching the target node type', () => {
    const templates = [
      makeTemplate({ id: 'act.1', name: 'Act1', targetCategories: ['actor'] }),
      makeTemplate({ id: 'loc.1', name: 'Loc1', targetCategories: ['location'] }),
    ];
    const slots = getTargetActionSlots({
      target: actorTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
    });
    expect(slots).toHaveLength(1);
    expect(slots[0].label).toBe('Act1');
  });

  it('defaults to actor when targetCategories is omitted', () => {
    const templates = [
      makeTemplate({ id: 't1', name: 'NoCategory' }), // no targetCategories
    ];
    const actorSlots = getTargetActionSlots({
      target: actorTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
    });
    const locSlots = getTargetActionSlots({
      target: locationTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
    });
    expect(actorSlots).toHaveLength(1); // actor matches default
    expect(locSlots).toHaveLength(0);   // location does not
  });
});

describe('getTargetActionSlots — subtype gate (filter 2)', () => {
  it('passes when targetSubtypes includes the target subtype', () => {
    const templates = [
      makeTemplate({ id: 'ward', name: 'Ward', targetCategories: ['location'], targetSubtypes: ['keep', 'fortress'] }),
    ];
    const slots = getTargetActionSlots({
      target: locationTarget({ subtype: 'keep' }),
      templates,
      pool: BASE_POOL,
      primarySphere: 'order',
      accessibleSpheres: ['order'],
    });
    expect(slots).toHaveLength(1);
  });

  it('filters out when subtype does not match', () => {
    const templates = [
      makeTemplate({ id: 'ward', name: 'Ward', targetCategories: ['location'], targetSubtypes: ['fortress'] }),
    ];
    const slots = getTargetActionSlots({
      target: locationTarget({ subtype: 'market' }),
      templates,
      pool: BASE_POOL,
      primarySphere: 'order',
      accessibleSpheres: ['order'],
    });
    expect(slots).toHaveLength(0);
  });

  it('passes all subtypes when targetSubtypes is omitted', () => {
    const templates = [
      makeTemplate({ id: 'generic_loc', name: 'Generic', targetCategories: ['location'] }),
    ];
    const slots = getTargetActionSlots({
      target: locationTarget({ subtype: 'anything' }),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
    });
    expect(slots).toHaveLength(1);
  });
});

describe('getTargetActionSlots — trait gate (filter 3)', () => {
  it('passes when all required traits are present', () => {
    const templates = [
      makeTemplate({ id: 'blessed', name: 'BlessedAction', targetCategories: ['location'], requiredTargetTraits: ['trait.blessed', 'trait.ancient'] }),
    ];
    const slots = getTargetActionSlots({
      target: locationTarget({ traitIds: ['trait.blessed', 'trait.ancient', 'trait.other'] }),
      templates,
      pool: BASE_POOL,
      primarySphere: 'spirit',
      accessibleSpheres: ['spirit'],
    });
    expect(slots).toHaveLength(1);
  });

  it('filters out when any required trait is missing', () => {
    const templates = [
      makeTemplate({ id: 'blessed', name: 'BlessedAction', targetCategories: ['location'], requiredTargetTraits: ['trait.blessed', 'trait.ancient'] }),
    ];
    const slots = getTargetActionSlots({
      target: locationTarget({ traitIds: ['trait.blessed'] }), // missing trait.ancient
      templates,
      pool: BASE_POOL,
      primarySphere: 'spirit',
      accessibleSpheres: ['spirit'],
    });
    expect(slots).toHaveLength(0);
  });
});

describe('getTargetActionSlots — essence gate (filter 5)', () => {
  it('marks slot unavailable when essence insufficient', () => {
    const templates = [
      makeTemplate({ id: 'divine.ward', name: 'Ward', targetCategories: ['location'], essenceCost: 5, sphereAffinity: 'order' }),
    ];
    const slots = getTargetActionSlots({
      target: locationTarget(),
      templates,
      pool: { ...BASE_POOL, order: 3 },
      primarySphere: 'order',
      accessibleSpheres: ['order'],
    });
    expect(slots).toHaveLength(1);
    expect(slots[0].available).toBe(false);
    expect(slots[0].lockedReason).toMatch(/essence/i);
  });

  it('marks slot available when player can afford it', () => {
    const templates = [
      makeTemplate({ id: 'divine.ward', name: 'Ward', targetCategories: ['location'], essenceCost: 3, sphereAffinity: 'order' }),
    ];
    const slots = getTargetActionSlots({
      target: locationTarget(),
      templates,
      pool: { ...BASE_POOL, order: 10 },
      primarySphere: 'order',
      accessibleSpheres: ['order'],
    });
    expect(slots[0].available).toBe(true);
  });

  it('free actions (essenceCost 0) always pass essence gate', () => {
    const templates = [
      makeTemplate({ id: 'observe', name: 'Observe', targetCategories: ['location'], essenceCost: 0 }),
    ];
    const slots = getTargetActionSlots({
      target: locationTarget(),
      templates,
      pool: EMPTY_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
    });
    expect(slots[0].available).toBe(true);
  });
});

describe('getTargetActionSlots — range gate (filter 6)', () => {
  it('marks slot out_of_range when target is too far', () => {
    const templates = [
      makeTemplate({ id: 'touch', name: 'Touch', targetCategories: ['location'] }),
    ];
    const slots = getTargetActionSlots({
      target: locationTarget({ position: { col: 10, row: 0 } }),
      templates,
      pool: BASE_POOL,
      primarySphere: 'force',
      accessibleSpheres: ['force'],
      avatarPos: { col: 0, row: 0 },
    });
    expect(slots[0].available).toBe(false);
    expect(slots[0].rangeStatus).toBe('out_of_range');
  });

  it('marks slot unlimited when no positions available', () => {
    const templates = [
      makeTemplate({ id: 'remote', name: 'Remote', targetCategories: ['location'] }),
    ];
    const slots = getTargetActionSlots({
      target: locationTarget({ position: null }),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
    });
    expect(slots[0].rangeStatus).toBe('unlimited');
    expect(slots[0].available).toBe(true);
  });
});

function hexTarget(overrides?: Partial<TargetContext>): TargetContext {
  return {
    nodeId: 'hex_3_5',
    nodeType: 'location',
    displayName: 'Hex (3,5)',
    displayLabel: 'hex',
    subtype: 'hex',
    traitIds: [],
    sphereAffinity: null,
    position: { col: 3, row: 5 },
    properties: { terrain: 'hex' },
    ...overrides,
  };
}

describe('getTargetActionSlots — revelation gate (filter 7)', () => {
  const REVEALED_HEX = { '3,5': { land: true, soul: true, people: true, ruins: true } };
  const UNREVEALED_HEX = { '3,5': { land: false, soul: false, people: false, ruins: false } };
  const LAND_ONLY_HEX = { '3,5': { land: true, soul: false, people: false, ruins: false } };

  it('filters out non-Create templates when layer is not revealed', () => {
    const templates = [
      makeTemplate({ id: 'hex.corrupt', name: 'Corrupt', targetCategories: ['hex'], crudType: 'delete', narrativeLayer: 'land' }),
    ];
    const slots = getTargetActionSlots({
      target: hexTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
      hexRevelation: UNREVEALED_HEX,
    });
    expect(slots).toHaveLength(0);
  });

  it('passes non-Create templates when layer IS revealed', () => {
    const templates = [
      makeTemplate({ id: 'hex.corrupt', name: 'Corrupt', targetCategories: ['hex'], crudType: 'delete', narrativeLayer: 'land' }),
    ];
    const slots = getTargetActionSlots({
      target: hexTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
      hexRevelation: REVEALED_HEX,
    });
    expect(slots).toHaveLength(1);
    expect(slots[0].label).toBe('Corrupt');
  });

  it('Create actions bypass revelation gate even when layer is unrevealed', () => {
    const templates = [
      makeTemplate({ id: 'hex.bless', name: 'Bless', targetCategories: ['hex'], crudType: 'create', narrativeLayer: 'land' }),
    ];
    const slots = getTargetActionSlots({
      target: hexTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
      hexRevelation: UNREVEALED_HEX,
    });
    expect(slots).toHaveLength(1);
  });

  it('bypassRevelationGate: true skips gate for non-Create templates', () => {
    const templates = [
      makeTemplate({ id: 'hex.special', name: 'Special', targetCategories: ['hex'], crudType: 'update', narrativeLayer: 'soul', bypassRevelationGate: true }),
    ];
    const slots = getTargetActionSlots({
      target: hexTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
      hexRevelation: UNREVEALED_HEX,
    });
    expect(slots).toHaveLength(1);
  });

  it('templates without narrativeLayer are not revelation-gated (backward compatible)', () => {
    const templates = [
      makeTemplate({ id: 'hex.generic', name: 'Generic', targetCategories: ['hex'], crudType: 'update' }),
    ];
    const slots = getTargetActionSlots({
      target: hexTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
      hexRevelation: UNREVEALED_HEX,
    });
    expect(slots).toHaveLength(1);
  });

  it('missing hexRevelation map treats all layers as unrevealed (fail-soft)', () => {
    const templates = [
      makeTemplate({ id: 'hex.corrupt', name: 'Corrupt', targetCategories: ['hex'], crudType: 'delete', narrativeLayer: 'land' }),
    ];
    const slots = getTargetActionSlots({
      target: hexTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
      // hexRevelation omitted
    });
    expect(slots).toHaveLength(0);
  });

  it('only gates the specific layer — soul unrevealed does not block land actions', () => {
    const templates = [
      makeTemplate({ id: 'hex.corrupt', name: 'Corrupt Land', targetCategories: ['hex'], crudType: 'delete', narrativeLayer: 'land' }),
      makeTemplate({ id: 'hex.soul_change', name: 'Change Soul', targetCategories: ['hex'], crudType: 'update', narrativeLayer: 'soul' }),
    ];
    const slots = getTargetActionSlots({
      target: hexTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
      hexRevelation: LAND_ONLY_HEX,
    });
    expect(slots).toHaveLength(1);
    expect(slots[0].label).toBe('Corrupt Land');
  });

  it('non-hex targets skip revelation gating (no position check)', () => {
    const templates = [
      makeTemplate({ id: 'loc.ward', name: 'Ward', targetCategories: ['location'], crudType: 'update', narrativeLayer: 'people' }),
    ];
    const slots = getTargetActionSlots({
      target: locationTarget({ position: null }),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
      hexRevelation: UNREVEALED_HEX,
    });
    expect(slots).toHaveLength(1);
  });

  it('Read actions (Find) are NOT filtered by revelation gate — they reveal layers', () => {
    const templates = [
      makeTemplate({ id: 'hex.survey', name: 'Survey', targetCategories: ['hex'], crudType: 'read', narrativeLayer: 'land' }),
    ];
    // Read actions are not 'create' but they are Find actions — they should NOT be gated
    // because the design says only Change/Control/Destroy are gated.
    // In our implementation: crudType 'read' != 'create', so it WOULD be gated.
    // BUT: hex.survey's purpose is to reveal land — it should always be available.
    // The design says "Create actions bypass" — but Read/Find actions also need to bypass
    // since they're the mechanism for revealing. Let's verify our implementation handles this.
    // Read actions with narrativeLayer that are Find actions should either:
    // 1. Have bypassRevelationGate: true, OR
    // 2. The gate should exempt 'read' crudType too
    // Per design: "Change, Control, and Destroy only appear if layer is revealed"
    // Read is explicitly NOT in that list — it should pass through.
    const slots = getTargetActionSlots({
      target: hexTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
      hexRevelation: UNREVEALED_HEX,
    });
    // Current implementation gates all non-create. Read should NOT be gated per design.
    // This test will fail if read is gated — indicating we need to fix the gate.
    expect(slots).toHaveLength(1);
  });
});

describe('getTargetActionSlots — unlock gate (filter 8)', () => {
  it('hides non-starter templates when no unlocks are present', () => {
    const templates = [
      makeTemplate({ id: 'action.nonstarter', name: 'Nonstarter', targetCategories: ['actor'] }),
    ];
    const slots = getTargetActionSlots({
      target: actorTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
      unlockedActionIds: [],
    });
    expect(slots).toHaveLength(0);
  });

  it('keeps explicit starter templates visible without unlocks', () => {
    const templates = [
      makeTemplate({ id: 'action.starter', name: 'Starter', targetCategories: ['actor'], starter: true }),
    ];
    const slots = getTargetActionSlots({
      target: actorTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
      unlockedActionIds: [],
    });
    expect(slots).toHaveLength(1);
  });

  it('keeps canonical starter IDs visible as fail-soft even if starter flag is missing', () => {
    const templates = [
      makeTemplate({ id: 'divine.dream', name: 'Dream', targetCategories: ['actor'] }),
    ];
    const slots = getTargetActionSlots({
      target: actorTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
      unlockedActionIds: [],
    });
    expect(slots).toHaveLength(1);
  });

  it('shows non-starter templates when explicitly unlocked', () => {
    const templates = [
      makeTemplate({ id: 'action.nonstarter', name: 'Nonstarter', targetCategories: ['actor'] }),
    ];
    const slots = getTargetActionSlots({
      target: actorTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
      unlockedActionIds: ['action.nonstarter'],
    });
    expect(slots).toHaveLength(1);
  });
});

describe('getTargetActionSlots — MAX_SLOTS cap', () => {
  it('returns at most MAX_SLOTS slots', () => {
    const templates = Array.from({ length: 30 }, (_, i) =>
      makeTemplate({ id: `t${i}`, name: `Template ${i}`, targetCategories: ['actor'] })
    );
    const slots = getTargetActionSlots({
      target: actorTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
    });
    expect(slots.length).toBeLessThanOrEqual(TARGET_ACTION_CONSTANTS.MAX_SLOTS);
  });
});

describe('getTargetActionSlots — empty result', () => {
  it('returns empty array when no templates pass filters', () => {
    const templates = [
      makeTemplate({ id: 'loc.only', name: 'LocOnly', targetCategories: ['location'] }),
    ];
    const slots = getTargetActionSlots({
      target: actorTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
    });
    expect(slots).toHaveLength(0);
  });
});

describe('getTargetActionSlots — slot shape', () => {
  it('produces slots with type = target_action and correct ID prefix', () => {
    const templates = [
      makeTemplate({ id: 'loc.ward', name: 'Ward', targetCategories: ['location'] }),
    ];
    const slots = getTargetActionSlots({
      target: locationTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'order',
      accessibleSpheres: ['order'],
    });
    expect(slots[0].type).toBe('target_action');
    expect(slots[0].id).toBe(`${TARGET_ACTION_CONSTANTS.SLOT_ID_PREFIX}loc.ward`);
    expect(slots[0].interventionType).toBeNull();
  });
});

describe('templateIdFromSlotId', () => {
  it('extracts template ID from a target_action slot ID', () => {
    expect(templateIdFromSlotId('target_action_loc.ward')).toBe('loc.ward');
  });

  it('returns undefined for non-target_action slot IDs', () => {
    expect(templateIdFromSlotId('dream')).toBeUndefined();
    expect(templateIdFromSlotId('scry')).toBeUndefined();
  });
});

describe('Phase 17: spellName and technicalDescription population', () => {
  it('populates spellName from template.spellName when present', () => {
    const templates = [
      makeTemplate({ id: 'act.spell', name: 'Invoke Spirit', spellName: 'Vocate Spiritus', targetCategories: ['actor'] }),
    ];
    const slots = getTargetActionSlots({
      target: actorTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
    });
    expect(slots).toHaveLength(1);
    expect(slots[0].spellName).toBe('Vocate Spiritus');
  });

  it('leaves spellName undefined when template lacks spellName', () => {
    const templates = [
      makeTemplate({ id: 'act.plain', name: 'Plain Action', targetCategories: ['actor'] }),
    ];
    const slots = getTargetActionSlots({
      target: actorTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
    });
    expect(slots).toHaveLength(1);
    expect(slots[0].spellName).toBeUndefined();
  });

  it('populates technicalDescription from template.description when present', () => {
    const templates = [
      makeTemplate({
        id: 'act.desc',
        rarityTier: 1,
        intrinsicTier: 'background',
        name: 'Describe Action',
        description: 'Grants the target a boon of clarity, sharpening their perception of hidden truths.',
        targetCategories: ['actor'],
      }),
    ];
    const slots = getTargetActionSlots({
      target: actorTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
    });
    expect(slots).toHaveLength(1);
    expect(slots[0].technicalDescription).toBe('Grants the target a boon of clarity, sharpening their perception of hidden truths.');
  });

  it('leaves technicalDescription undefined when template lacks description', () => {
    const templates = [
      makeTemplate({ id: 'act.nodesc', name: 'No Desc Action', targetCategories: ['actor'] }),
    ];
    const slots = getTargetActionSlots({
      target: actorTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
    });
    expect(slots).toHaveLength(1);
    expect(slots[0].technicalDescription).toBeUndefined();
  });

  it('slot.description (flavor) is always narrativeTemplates.initiation regardless of template.description', () => {
    const templates = [
      makeTemplate({
        id: 'act.both',
        rarityTier: 1,
        intrinsicTier: 'background',
        name: 'Both Fields',
        description: 'Technical mechanical description.',
        targetCategories: ['actor'],
        narrativeTemplates: {
          initiation: 'A whisper travels on the wind.',
          success: 'it works',
          failure: 'it fails',
        },
      }),
    ];
    const slots = getTargetActionSlots({
      target: actorTarget(),
      templates,
      pool: BASE_POOL,
      primarySphere: 'mind',
      accessibleSpheres: ['mind'],
    });
    expect(slots).toHaveLength(1);
    // flavor text unchanged
    expect(slots[0].description).toBe('A whisper travels on the wind.');
    // mechanical description in new field
    expect(slots[0].technicalDescription).toBe('Technical mechanical description.');
  });
});

// ─── Gate 3b: requiredNodeProperties ────────────────────────────────────────

describe('getTargetActionSlots — node-property gate (filter 3b)', () => {
  it('passes when target has all required properties matching', () => {
    const templates = [
      makeTemplate({
        id: 'prop.match', name: 'PropMatch',
        targetCategories: ['location'],
        requiredNodeProperties: { locationSubtype: 'settlement' },
      }),
    ];
    const slots = getTargetActionSlots({
      target: locationTarget({ properties: { locationSubtype: 'settlement' } }),
      templates, pool: BASE_POOL, primarySphere: 'mind', accessibleSpheres: ['mind'],
    });
    expect(slots).toHaveLength(1);
  });

  it('filters out templates when a required property does not match', () => {
    const templates = [
      makeTemplate({
        id: 'prop.mismatch', name: 'PropMismatch',
        targetCategories: ['location'],
        requiredNodeProperties: { locationSubtype: 'settlement' },
      }),
    ];
    const slots = getTargetActionSlots({
      target: locationTarget({ properties: { locationSubtype: 'keep' } }),
      templates, pool: BASE_POOL, primarySphere: 'mind', accessibleSpheres: ['mind'],
    });
    expect(slots).toHaveLength(0);
  });

  it('filters out templates when a required property is absent on the target', () => {
    const templates = [
      makeTemplate({
        id: 'prop.absent', name: 'PropAbsent',
        targetCategories: ['actor'],
        requiredNodeProperties: { allegiance: 'hostile' },
      }),
    ];
    const slots = getTargetActionSlots({
      target: actorTarget({ properties: {} }),
      templates, pool: BASE_POOL, primarySphere: 'mind', accessibleSpheres: ['mind'],
    });
    expect(slots).toHaveLength(0);
  });

  it('passes when requiredNodeProperties is empty', () => {
    const templates = [
      makeTemplate({
        id: 'prop.empty', name: 'PropEmpty',
        targetCategories: ['actor'],
        requiredNodeProperties: {},
      }),
    ];
    const slots = getTargetActionSlots({
      target: actorTarget(),
      templates, pool: BASE_POOL, primarySphere: 'mind', accessibleSpheres: ['mind'],
    });
    expect(slots).toHaveLength(1);
  });

  it('passes when requiredNodeProperties is omitted', () => {
    const templates = [
      makeTemplate({ id: 'prop.omit', name: 'PropOmit', targetCategories: ['actor'] }),
    ];
    const slots = getTargetActionSlots({
      target: actorTarget(),
      templates, pool: BASE_POOL, primarySphere: 'mind', accessibleSpheres: ['mind'],
    });
    expect(slots).toHaveLength(1);
  });

  it('requires all properties to match (AND logic)', () => {
    const templates = [
      makeTemplate({
        id: 'prop.multi', name: 'PropMulti',
        targetCategories: ['actor'],
        requiredNodeProperties: { allegiance: 'hostile', tier: 2 },
      }),
    ];
    const passSlots = getTargetActionSlots({
      target: actorTarget({ properties: { allegiance: 'hostile', tier: 2 } }),
      templates, pool: BASE_POOL, primarySphere: 'mind', accessibleSpheres: ['mind'],
    });
    const failSlots = getTargetActionSlots({
      target: actorTarget({ properties: { allegiance: 'hostile', tier: 1 } }),
      templates, pool: BASE_POOL, primarySphere: 'mind', accessibleSpheres: ['mind'],
    });
    expect(passSlots).toHaveLength(1);
    expect(failSlots).toHaveLength(0);
  });
});
