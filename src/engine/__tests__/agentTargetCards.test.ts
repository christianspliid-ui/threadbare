/**
 * THR-1734 — nine divine cards declared `targetCategories: ['agent']`, a node type no
 * target context carries. `buildActorTargetContext` stamps every mortal `nodeType:
 * 'actor'`, so the drawer's node-type gate (gate 1 of `getTargetActionSlots`) dropped
 * all nine on every mortal: Bestow Power, Rekindle the Thread and seven others were
 * granted to the player and never shown.
 *
 * These tests build the target the way the drawer does — a real actor node through the
 * real builder — and ask the real gate, so they fail on the defect, not on a fixture.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { buildActorTargetContext } from '../targetContextBuilders';
import { getTargetActionSlots, templateIdFromSlotId } from '../targetActions';
import {
  AGENT_INTERVENTION_TEMPLATES,
  UNIFIED_ACTION_TEMPLATES,
  getUnifiedTemplateById,
} from '../../data/unified-action-templates';
import { SPHERE_NAMES } from '../../types/index';
import type { EssencePool } from '../../types/influence';
import type { TargetCategory } from '../../types/targetContext';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

/** The nine cards THR-1734 retargeted from `['agent']` to a mortal. */
const NINE = [
  'divine.rekindle_thread',
  'action.social.tip_scales',
  'action.social.embolden',
  'action.secrets.reveal_secret',
  'action.secrets.call_in_favor',
  'action.secrets.plant_secret',
  'action.anoint-champion',
  'action.faction.anoint_successor',
  'action.bestow',
] as const;

/** Every node type a target-context builder can produce, plus the gate's aliases. */
const REACHABLE_CATEGORIES: readonly string[] = [
  'actor', 'location', 'sublocation', 'hex', 'artifact', 'artifact_legendary',
  // Gate-1 aliases (`targetActions.ts`): a faction is an actor with subtype `faction`.
  'faction',
] satisfies readonly (TargetCategory | 'faction')[];

function mortalTarget() {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor.mira',
    type: 'actor',
    name: 'Mira',
    properties: { actorType: 'individual', sphereAffinity: 'mind' },
  });
  const ctx = buildActorTargetContext('actor.mira', graph, 1);
  if (!ctx) throw new Error('builder returned null for a real actor node');
  return ctx;
}

function fullPool(): EssencePool {
  return Object.fromEntries(SPHERE_NAMES.map((s) => [s, 999])) as EssencePool;
}

function drawerIds(templates: readonly UnifiedActionTemplate[]): string[] {
  return getTargetActionSlots({
    target: mortalTarget(),
    templates,
    pool: fullPool(),
    primarySphere: 'mind',
    accessibleSpheres: SPHERE_NAMES,
    unlockedActionIds: [...NINE],
  }).map((slot) => templateIdFromSlotId(slot.id) ?? slot.id);
}

describe('THR-1734 — the nine mortal-targeted divine cards reach a mortal drawer', () => {
  it('the builder stamps a mortal as actor / individual (the premise of the fix)', () => {
    const ctx = mortalTarget();
    expect(ctx.nodeType).toBe('actor');
    expect(ctx.subtype).toBe('individual');
  });

  it.each(NINE)('%s passes every gate on a real mortal target when unlocked', (id) => {
    const template = getUnifiedTemplateById(id);
    expect(template, `${id} is in the catalogue`).toBeDefined();
    const slots = getTargetActionSlots({
      target: mortalTarget(),
      templates: [template!],
      pool: fullPool(),
      primarySphere: 'mind',
      accessibleSpheres: SPHERE_NAMES,
      unlockedActionIds: [id],
    });
    expect(slots.map((s) => templateIdFromSlotId(s.id))).toEqual([id]);
    expect(slots[0].available).toBe(true);
  });

  it('every one of the nine that the agent hand carries shows on it when unlocked', () => {
    const handIds = new Set(AGENT_INTERVENTION_TEMPLATES.map((t) => t.id));
    const onHand = NINE.filter((id) => handIds.has(id));
    // Bestow Power is the card the ticket's browser leg names; it must be on the hand.
    expect(onHand).toContain('action.bestow');
    expect(onHand).toHaveLength(NINE.length);
    const shown = drawerIds(AGENT_INTERVENTION_TEMPLATES);
    for (const id of onHand) expect(shown, `${id} on the agent hand`).toContain(id);
  });

  it('Teach a Spell — the other mortal card in the artifact section — is on the hand too', () => {
    expect(AGENT_INTERVENTION_TEMPLATES.map((t) => t.id)).toContain('action.teach_spell');
  });

  it('a card stays off a faction actor — `individual` means a mortal, not any actor', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'actor.guild', type: 'actor', name: 'Guild', properties: { actorType: 'faction' } });
    const faction = buildActorTargetContext('actor.guild', graph, 1)!;
    const slots = getTargetActionSlots({
      target: faction,
      templates: [getUnifiedTemplateById('action.bestow')!],
      pool: fullPool(),
      primarySphere: 'mind',
      accessibleSpheres: SPHERE_NAMES,
      unlockedActionIds: ['action.bestow'],
    });
    expect(slots).toEqual([]);
  });

  it('no template declares a target category no target context can carry', () => {
    const catalogue = new Map<string, UnifiedActionTemplate>();
    for (const t of [...UNIFIED_ACTION_TEMPLATES, ...AGENT_INTERVENTION_TEMPLATES]) catalogue.set(t.id, t);
    const unreachable = [...catalogue.values()].flatMap((t) =>
      ((t.targetCategories ?? []) as readonly string[])
        .filter((c) => !REACHABLE_CATEGORIES.includes(c))
        .map((c) => `${t.id}: '${c}'`),
    );
    expect(unreachable).toEqual([]);
  });
});
