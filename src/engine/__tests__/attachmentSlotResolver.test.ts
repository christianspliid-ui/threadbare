import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  resolveSlotTag,
  collectAgentAttachmentInventory,
  computeEffectiveSlotCaps,
  chooseOverflowVictim,
  enforcePossessionSlotCaps,
  findConditionOverflows,
} from '../attachmentSlotResolver';
import { SLOT_CAPS, CONDITION_CAPS } from '../../data/attachment-slot-constants';
import type { AttachmentEffect } from '../../types/effects';
import type { SlotInventoryEntry } from '../attachmentSlotResolver';

// ─── Test Helpers ────────────────────────────────────────────────

function makeGraph(): WorldGraph { return new WorldGraph(); }

function addAgent(graph: WorldGraph, id: string) {
  graph.addNode({ id, type: 'actor', name: `Agent ${id}`, properties: { actorType: 'individual' } });
}

let ec = 0;
function eid() { return `e.slot.${++ec}`; }

beforeEach(() => { ec = 0; });

function addPossession(graph: WorldGraph, agentId: string, nodeId: string, props: Record<string, unknown> = {}, edgeProps: Record<string, unknown> = {}) {
  graph.addNode({ id: nodeId, type: 'artifact', name: props.name as string ?? nodeId, properties: { tier: 1, subcategory: 'arms', ...props } });
  graph.addEdge({ id: eid(), source: agentId, target: nodeId, type: 'possesses', properties: edgeProps });
}

function addCondition(graph: WorldGraph, agentId: string, nodeId: string, tags: string[], props: Record<string, unknown> = {}) {
  graph.addNode({ id: nodeId, type: 'trait', name: nodeId, properties: { subcategory: 'condition', tags, tier: 1, ...props } });
  graph.addEdge({ id: eid(), source: agentId, target: nodeId, type: 'has_trait', properties: {} });
}

// ─── resolveSlotTag ──────────────────────────────────────────────

describe('resolveSlotTag', () => {
  it('prefers explicit slotTag over subcategory', () => {
    expect(resolveSlotTag('weapon', 'arms')).toBe('weapon');
  });

  it('falls back to legacy subcategory mapping', () => {
    expect(resolveSlotTag(undefined, 'arms')).toBe('weapon');
    expect(resolveSlotTag(undefined, 'vestments')).toBe('vestment');
    expect(resolveSlotTag(undefined, 'mounts_beasts')).toBe('mount');
    expect(resolveSlotTag(undefined, 'provisions')).toBe('consumable');
  });

  it('returns undefined for unrecognized subcategory', () => {
    expect(resolveSlotTag(undefined, 'unknown_thing')).toBeUndefined();
  });

  it('returns undefined when both are missing', () => {
    expect(resolveSlotTag(undefined, undefined)).toBeUndefined();
  });
});

// ─── computeEffectiveSlotCaps ────────────────────────────────────

describe('computeEffectiveSlotCaps', () => {
  it('returns base caps with no slot bonuses', () => {
    const g = makeGraph();
    addAgent(g, 'a1');

    const caps = computeEffectiveSlotCaps(g, 'a1');
    expect(caps.weapon).toBe(SLOT_CAPS.weapon);
    expect(caps.consumable).toBe(SLOT_CAPS.consumable);
    expect(caps.wound).toBe(CONDITION_CAPS.wound);
  });

  it('SlotBonusEffect raises the correct cap', () => {
    const g = makeGraph();
    addAgent(g, 'a1');

    // Add a "Bag of Holding" — utility item that grants +2 consumable
    g.addNode({ id: 'bag', type: 'artifact', name: 'Bag of Holding', properties: {
      slotTag: 'utility',
      effects: [{ type: 'slot_bonus', slotTag: 'consumable', bonus: 2 }] satisfies AttachmentEffect[],
    }});
    g.addEdge({ id: eid(), source: 'a1', target: 'bag', type: 'possesses', properties: {} });

    const caps = computeEffectiveSlotCaps(g, 'a1');
    expect(caps.consumable).toBe(SLOT_CAPS.consumable + 2);
  });

  it('inactive slot-expander does not grant bonus slots', () => {
    const g = makeGraph();
    addAgent(g, 'a1');

    g.addNode({ id: 'bag', type: 'artifact', name: 'Bag of Holding', properties: {
      effects: [{ type: 'slot_bonus', slotTag: 'consumable', bonus: 2 }] satisfies AttachmentEffect[],
    }});
    g.addEdge({ id: eid(), source: 'a1', target: 'bag', type: 'possesses', properties: { active: false } });

    const caps = computeEffectiveSlotCaps(g, 'a1');
    expect(caps.consumable).toBe(SLOT_CAPS.consumable); // No bonus
  });
});

// ─── chooseOverflowVictim ────────────────────────────────────────

describe('chooseOverflowVictim', () => {
  const makeItem = (overrides: Partial<SlotInventoryEntry> = {}): SlotInventoryEntry => ({
    edgeId: `edge-${Math.random()}`,
    attachmentId: `item-${Math.random()}`,
    name: 'Test Item',
    slotTag: 'weapon',
    tier: 1,
    acquiredTick: 0,
    active: true,
    isPinned: false,
    kind: 'possession',
    ...overrides,
  });

  it('selects lower tier first', () => {
    const items = [
      makeItem({ name: 'T2 Sword', tier: 2, acquiredTick: 0 }),
      makeItem({ name: 'T1 Dagger', tier: 1, acquiredTick: 0 }),
    ];

    const victim = chooseOverflowVictim(items, 42);
    expect(victim?.name).toBe('T1 Dagger');
  });

  it('selects older item when tiers are equal', () => {
    const items = [
      makeItem({ name: 'New Sword', tier: 1, acquiredTick: 10 }),
      makeItem({ name: 'Old Sword', tier: 1, acquiredTick: 5 }),
    ];

    const victim = chooseOverflowVictim(items, 42);
    expect(victim?.name).toBe('Old Sword');
  });

  it('skips pinned items', () => {
    const items = [
      makeItem({ name: 'Quest Blade', tier: 1, acquiredTick: 0, isPinned: true }),
      makeItem({ name: 'Regular Blade', tier: 2, acquiredTick: 0 }),
    ];

    const victim = chooseOverflowVictim(items, 42);
    expect(victim?.name).toBe('Regular Blade');
  });

  it('skips inactive items', () => {
    const items = [
      makeItem({ name: 'Already Inactive', tier: 1, active: false }),
      makeItem({ name: 'Active Sword', tier: 2 }),
    ];

    const victim = chooseOverflowVictim(items, 42);
    expect(victim?.name).toBe('Active Sword');
  });

  it('is deterministic with same seed', () => {
    const items = [
      makeItem({ edgeId: 'e1', name: 'Sword A', tier: 1, acquiredTick: 0 }),
      makeItem({ edgeId: 'e2', name: 'Sword B', tier: 1, acquiredTick: 0 }),
    ];

    const victim1 = chooseOverflowVictim(items, 42);
    const victim2 = chooseOverflowVictim(items, 42);
    expect(victim1?.name).toBe(victim2?.name);
  });
});

// ─── enforcePossessionSlotCaps ───────────────────────────────────

describe('enforcePossessionSlotCaps', () => {
  it('produces no patches when under cap', () => {
    const items: SlotInventoryEntry[] = [
      { edgeId: 'e1', attachmentId: 'w1', name: 'Sword', slotTag: 'weapon', tier: 1, acquiredTick: 0, active: true, isPinned: false, kind: 'possession' },
    ];
    const caps = { weapon: 2 };

    const patches = enforcePossessionSlotCaps(items, caps, 42);
    expect(patches).toHaveLength(0);
  });

  it('deactivates when over cap', () => {
    const items: SlotInventoryEntry[] = [
      { edgeId: 'e1', attachmentId: 'w1', name: 'Sword A', slotTag: 'weapon', tier: 2, acquiredTick: 0, active: true, isPinned: false, kind: 'possession' },
      { edgeId: 'e2', attachmentId: 'w2', name: 'Sword B', slotTag: 'weapon', tier: 1, acquiredTick: 5, active: true, isPinned: false, kind: 'possession' },
      { edgeId: 'e3', attachmentId: 'w3', name: 'Sword C', slotTag: 'weapon', tier: 1, acquiredTick: 2, active: true, isPinned: false, kind: 'possession' },
    ];
    const caps = { weapon: 2 };

    const patches = enforcePossessionSlotCaps(items, caps, 42);
    expect(patches).toHaveLength(1);
    // Should deactivate the lower tier, older item
    expect(patches[0].name).toBe('Sword C');
  });

  it('does not deactivate conditions', () => {
    const items: SlotInventoryEntry[] = [
      { edgeId: 'e1', attachmentId: 'c1', name: 'Wound', slotTag: 'wound', tier: 1, acquiredTick: 0, active: true, isPinned: false, kind: 'condition' },
      { edgeId: 'e2', attachmentId: 'c2', name: 'Wound 2', slotTag: 'wound', tier: 1, acquiredTick: 1, active: true, isPinned: false, kind: 'condition' },
      { edgeId: 'e3', attachmentId: 'c3', name: 'Wound 3', slotTag: 'wound', tier: 1, acquiredTick: 2, active: true, isPinned: false, kind: 'condition' },
      { edgeId: 'e4', attachmentId: 'c4', name: 'Wound 4', slotTag: 'wound', tier: 1, acquiredTick: 3, active: true, isPinned: false, kind: 'condition' },
    ];
    const caps = { wound: 3 };

    const patches = enforcePossessionSlotCaps(items, caps, 42);
    expect(patches).toHaveLength(0); // Conditions handled separately
  });
});

// ─── findConditionOverflows ──────────────────────────────────────

describe('findConditionOverflows', () => {
  it('detects wound overflow', () => {
    const items: SlotInventoryEntry[] = [
      { edgeId: 'e1', attachmentId: 'w1', name: 'Wound 1', slotTag: 'wound', tier: 1, acquiredTick: 0, active: true, isPinned: false, kind: 'condition' },
      { edgeId: 'e2', attachmentId: 'w2', name: 'Wound 2', slotTag: 'wound', tier: 1, acquiredTick: 1, active: true, isPinned: false, kind: 'condition' },
      { edgeId: 'e3', attachmentId: 'w3', name: 'Wound 3', slotTag: 'wound', tier: 1, acquiredTick: 2, active: true, isPinned: false, kind: 'condition' },
      { edgeId: 'e4', attachmentId: 'w4', name: 'Wound 4', slotTag: 'wound', tier: 1, acquiredTick: 3, active: true, isPinned: false, kind: 'condition' },
    ];
    const caps = { wound: 3 };

    const overflows = findConditionOverflows(items, caps);
    expect(overflows).toHaveLength(1);
    expect(overflows[0].slotTag).toBe('wound');
    expect(overflows[0].count).toBe(4);
    expect(overflows[0].cap).toBe(3);
  });

  it('no overflow when at cap', () => {
    const items: SlotInventoryEntry[] = [
      { edgeId: 'e1', attachmentId: 'w1', name: 'Wound 1', slotTag: 'wound', tier: 1, acquiredTick: 0, active: true, isPinned: false, kind: 'condition' },
      { edgeId: 'e2', attachmentId: 'w2', name: 'Wound 2', slotTag: 'wound', tier: 1, acquiredTick: 1, active: true, isPinned: false, kind: 'condition' },
      { edgeId: 'e3', attachmentId: 'w3', name: 'Wound 3', slotTag: 'wound', tier: 1, acquiredTick: 2, active: true, isPinned: false, kind: 'condition' },
    ];
    const caps = { wound: 3 };

    const overflows = findConditionOverflows(items, caps);
    expect(overflows).toHaveLength(0);
  });
});

// ─── Integration: collectAgentAttachmentInventory ────────────────

describe('collectAgentAttachmentInventory', () => {
  it('collects possessions with resolved slot tags', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    addPossession(g, 'a1', 'sword1', { slotTag: 'weapon', name: 'Iron Sword' });

    const inv = collectAgentAttachmentInventory(g, 'a1');
    expect(inv).toHaveLength(1);
    expect(inv[0].slotTag).toBe('weapon');
    expect(inv[0].kind).toBe('possession');
  });

  it('falls back to subcategory for legacy items', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    addPossession(g, 'a1', 'oldSword', { subcategory: 'arms', name: 'Old Sword' });

    const inv = collectAgentAttachmentInventory(g, 'a1');
    expect(inv).toHaveLength(1);
    expect(inv[0].slotTag).toBe('weapon'); // arms → weapon
  });

  it('detects pinned quest items', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    addPossession(g, 'a1', 'quest_key', { slotTag: 'quest', name: 'Sealed Letter', lossCondition: 'permanent' });

    const inv = collectAgentAttachmentInventory(g, 'a1');
    expect(inv[0].isPinned).toBe(true);
  });

  it('collects conditions with correct slot tags', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    addCondition(g, 'a1', 'bruise', ['#wound']);
    addCondition(g, 'a1', 'plague', ['#disease']);

    const inv = collectAgentAttachmentInventory(g, 'a1');
    const wound = inv.find(i => i.name === 'bruise');
    const disease = inv.find(i => i.name === 'plague');

    expect(wound?.slotTag).toBe('wound');
    expect(disease?.slotTag).toBe('disease');
    expect(wound?.kind).toBe('condition');
  });

  it('collects agreements from relates_to edges', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    g.addNode({ id: 'a2', type: 'actor', name: 'Agent B', properties: { actorType: 'individual' } });

    const edgeId = eid();
    g.addEdge({
      id: edgeId, source: 'a1', target: 'a2', type: 'relates_to',
      properties: { agreement: true, agreementName: 'Test Pact', tier: 2 },
    });

    const inv = collectAgentAttachmentInventory(g, 'a1');
    const agreement = inv.find(i => i.kind === 'agreement');
    expect(agreement).toBeDefined();
    expect(agreement?.slotTag).toBe('agreement');
    expect(agreement?.attachmentId).toBe(edgeId);
  });
});
