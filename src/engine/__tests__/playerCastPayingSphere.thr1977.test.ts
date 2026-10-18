/**
 * THR-1977 — a priced card is charged from the pool it names.
 *
 * Observe (5) and Agent Thread (10) have no `sphereAffinity`. The hand and the
 * drawer priced them from the god's primary sphere, but the drawer slot carried
 * `sphere: null`, and `commitPlayerCast` charges nothing for a null sphere — so
 * both cast for free. These tests pin the one invariant over every castable
 * template: the sphere the price is shown in is the sphere the cast is charged
 * from, and the charge equals the shown price.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { getTargetActionSlots, payingSphere, templateIdFromSlotId } from '../targetActions';
import { preparePlayerCast, commitPlayerCast } from '../playerCastDispatch';
import { resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { clearTimelines } from '../encounterTimeline';
import { buildHandCard, isGodCard } from '../views/godRail';
import {
  AGENT_INTERVENTION_TEMPLATES,
  UNIFIED_ACTION_TEMPLATES,
  getUnifiedTemplateById,
} from '../../data/unified-action-templates';
import { SPHERE_NAMES } from '../../types';
import type { SphereName } from '../../types';
import type { GameState } from '../../types/gameState';
import type { TargetContext } from '../../types/targetContext';
import type { EssencePool } from '../../types/influence';

const ASCENDANT_ID = 'asc';
const TARGET_ID = 'actor.kael';
const PRIMARY: SphereName = 'mind';
const FULL = 1000;

function fullPool(): EssencePool {
  return Object.fromEntries(SPHERE_NAMES.map((s) => [s, FULL])) as unknown as EssencePool;
}

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: ASCENDANT_ID, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } } as never);
  graph.addNode({ id: TARGET_ID, type: 'actor', name: 'Kael Thorne', properties: { actorType: 'individual' } } as never);
  return graph;
}

function makeState(graph: WorldGraph): GameState {
  return {
    tick: 5,
    seed: 42,
    graph,
    ascendantId: ASCENDANT_ID,
    essencePool: fullPool(),
    unifiedActions: [],
    recentEvents: [],
  } as unknown as GameState;
}

function agentTarget(): TargetContext {
  return {
    nodeId: TARGET_ID,
    nodeType: 'actor',
    displayName: 'Kael Thorne',
    displayLabel: 'Mortal',
    subtype: 'individual',
    traitIds: [],
    sphereAffinity: null,
    position: null,
    influenceTier: 0,
    properties: { actorType: 'individual' },
  };
}

/** Cast a slot the way the drawer does and return the pool before and after. */
function castFromSlot(graph: WorldGraph, slotId: string, sphere: SphereName | null) {
  const templateId = templateIdFromSlotId(slotId)!;
  const template = getUnifiedTemplateById(templateId)!;
  const prev = makeState(graph);
  const cast = preparePlayerCast({
    graph, ascendantId: ASCENDANT_ID, template, templateId,
    targetId: TARGET_ID, tick: prev.tick, seed: prev.seed, sphere,
  });
  const next = commitPlayerCast(prev, { cast });
  return { cast, before: prev.essencePool, after: next.essencePool };
}

describe('THR-1977 — the drawer charges the pool it prices from', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    clearTimelines();
  });

  // One template per call: the drawer caps at MAX_SLOTS, and the cap must not
  // decide which cards this sweep covers.
  const slots = () => AGENT_INTERVENTION_TEMPLATES.flatMap((template) => getTargetActionSlots({
    graph: makeGraph(),
    target: agentTarget(),
    templates: [template],
    pool: fullPool(),
    primarySphere: PRIMARY,
    accessibleSpheres: [PRIMARY],
  } as Parameters<typeof getTargetActionSlots>[0]));

  it('Observe costs 5 and Agent Thread 10, both from the primary pool', () => {
    const all = slots();
    for (const [id, price] of [['observe_agent', 5], ['bind_thread_agent', 10]] as const) {
      const slot = all.find((s) => templateIdFromSlotId(s.id) === id);
      expect(slot, `${id} is offered on a mortal`).toBeDefined();
      expect(slot!.essenceCost).toBe(price);
      expect(slot!.sphere).toBe(PRIMARY);
      const { before, after } = castFromSlot(makeGraph(), slot!.id, slot!.sphere);
      expect((before as Record<string, number>)[PRIMARY] - (after as Record<string, number>)[PRIMARY]).toBe(price);
    }
  });

  it('every priced drawer card on a mortal is charged its shown price from its shown pool', () => {
    const priced = slots().filter((s) => s.type === 'target_action' && s.essenceCost > 0);
    expect(priced.length).toBeGreaterThan(0);
    for (const slot of priced) {
      const template = getUnifiedTemplateById(templateIdFromSlotId(slot.id)!)!;
      expect(slot.sphere, slot.id).toBe(payingSphere(template, PRIMARY));
      const { cast, before, after } = castFromSlot(makeGraph(), slot.id, slot.sphere);
      expect(cast.essenceCost, slot.id).toBe(slot.essenceCost);
      const drop = (before as Record<string, number>)[slot.sphere!] - (after as Record<string, number>)[slot.sphere!];
      expect(drop, slot.id).toBe(slot.essenceCost);
    }
  });
});

describe('THR-1977 — every priced castable template names a pool that pays', () => {
  const priced = UNIFIED_ACTION_TEMPLATES.filter((t) => (t.essenceCost ?? 0) > 0);

  it('covers the whole priced catalogue', () => {
    expect(priced.length).toBeGreaterThan(10);
  });

  it('the paying sphere is never null, and a god card is priced in the pool it is charged from', () => {
    for (const template of priced) {
      const sphere = payingSphere(template, PRIMARY);
      expect(SPHERE_NAMES, template.id).toContain(sphere);
      if (!isGodCard(template)) continue;
      const graph = makeGraph();
      const card = buildHandCard(makeState(graph), template, PRIMARY);
      expect(card.paySphere, template.id).toBe(sphere);
    }
  });

  it('casting any priced template through the paying sphere lowers that pool by the charge', () => {
    for (const template of priced) {
      const graph = makeGraph();
      const prev = makeState(graph);
      const sphere = payingSphere(template, PRIMARY);
      const cast = preparePlayerCast({
        graph, ascendantId: ASCENDANT_ID, template, templateId: template.id,
        targetId: TARGET_ID, tick: prev.tick, seed: prev.seed, sphere, applyBuffs: false,
      });
      const next = commitPlayerCast(prev, { cast });
      const drop = (prev.essencePool as Record<string, number>)[sphere] - (next.essencePool as Record<string, number>)[sphere];
      expect(cast.essenceCost, template.id).toBeGreaterThan(0);
      expect(drop, template.id).toBe(cast.essenceCost);
    }
  });
});
