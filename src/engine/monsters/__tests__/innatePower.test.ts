/**
 * THR-1671 — innate powers (power runtime S3).
 *
 * Plan doc `Docs/plans/2026-09-29-thr-1571-power-runtime.md` § Content ("Eight innate
 * powers") and § Graph nodes / edges. Covers the Done-when's first clause: an elite of
 * each family, minted through the real lair phase, carries exactly one innate-power
 * `has_trait` edge to its family's definition. The fight-step clause lives in
 * `fights/__tests__/fightStepInputs.test.ts` beside the other opponent-modifier cases.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { MonsterState } from '../../../types/monster';
import { MONSTER_FAMILIES, MONSTER_FAMILY_IDS } from '../../../data/monster-families';
import {
  INNATE_POWER_DEFINITIONS,
  INNATE_POWER_ID_PREFIX,
  INNATE_POWER_SOURCE,
  innatePowerId,
} from '../../../data/innate-powers';
import { isCarriedEffectStateless } from '../../../data/spell-casting-constants';
import { ITEM_HONEST_VOCABULARY } from '../../../data/item-honest-vocabulary';
import { POWER_SUBCATEGORIES } from '../../../data/world-objects';
import { CONTENT_OBJECT_KINDS } from '../../../data/content-objects';
import { CONTENT_TAGS } from '../../../data/content-tags';
import type { AttachmentEffect } from '../../../types/effects';
import { seedEncounterTraitDefinitions } from '../../traitDefinitionSeeding';
import { phaseLairEscalation, LAIR_ESCALATION_INTERVAL, LAIR_UPGRADE_MIN_TICKS } from '../../lairEscalation';
import { stampInnatePower } from '../innatePower';
import { getAgentAttachments } from '../../agentAttachments';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';

const MINT_TICK = Math.ceil(LAIR_UPGRADE_MIN_TICKS / LAIR_ESCALATION_INTERVAL) * LAIR_ESCALATION_INTERVAL;

function lairWorld(sphere: string): WorldGraph {
  const graph = new WorldGraph();
  seedEncounterTraitDefinitions(graph);
  for (const node of INNATE_POWER_DEFINITIONS) graph.addNode({ ...node, properties: { ...node.properties } });
  graph.addNode({
    id: 'lair_x',
    type: 'location',
    name: 'Lair X',
    properties: {
      locationSubtype: 'lair', lairTier: 'minor', dominantSphere: sphere,
      spawnedAtTick: 0, lastEscalationTick: 0, dangerZone: 'heartland', hexCol: 1, hexRow: 1,
    },
  });
  return graph;
}

function mintElite(graph: WorldGraph): string {
  phaseLairEscalation({ tick: MINT_TICK, seed: 42, graph, pendingSpherePressures: [], tiles: [] } as unknown as GameState);
  const eliteId = graph.getNode('lair_x')!.properties.namedEliteId as string;
  expect(eliteId, 'the lair minted an elite').toBeTruthy();
  return eliteId;
}

function innateEdges(graph: WorldGraph, id: string) {
  return graph.getOutgoingEdges(id, 'has_trait').filter(e => e.target.startsWith(INNATE_POWER_ID_PREFIX));
}

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { clearTraces(); disableTracing(); });

describe('THR-1671 — the eight definitions', () => {
  it('one per monster family, in the innate_power class', () => {
    expect(INNATE_POWER_DEFINITIONS.map(n => n.id).sort())
      .toEqual(MONSTER_FAMILY_IDS.map(f => innatePowerId(f)).sort());
    for (const node of INNATE_POWER_DEFINITIONS) {
      expect(node.type).toBe('trait');
      expect(node.properties.subcategory).toBe('innate_power');
      expect(node.properties.agency).toBe('fate_woven');
      const family = node.properties.family as keyof typeof MONSTER_FAMILIES;
      expect(node.properties.sphereAffinity, `${node.id} is sphere-true`).toBe(MONSTER_FAMILIES[family].sphere);
      expect(String(node.properties.description).length).toBeGreaterThan(20);
    }
    expect(POWER_SUBCATEGORIES).toContain('innate_power');
  });

  it('every carried primitive is stateless and a live row in the honest vocabulary', () => {
    for (const node of INNATE_POWER_DEFINITIONS) {
      const effects = node.properties.effects as AttachmentEffect[];
      expect(effects.length, `${node.id} carries something`).toBeGreaterThan(0);
      for (const e of effects) {
        expect(isCarriedEffectStateless(e), `${node.id} carries ${e.type}`).toBe(true);
        expect(ITEM_HONEST_VOCABULARY[e.type]?.status, `${node.id}: ${e.type}`).toBe('live');
      }
    }
  });

  it('no aura targets "enemies" — a lair elite has no faction, so it could never apply', () => {
    for (const node of INNATE_POWER_DEFINITIONS) {
      for (const e of node.properties.effects as AttachmentEffect[]) {
        if (e.type === 'aura') expect(e.target, node.id).not.toBe('enemies');
      }
    }
  });

  it('is registered under the Power kind, with seated tags', () => {
    const power = CONTENT_OBJECT_KINDS.find(k => k.id === 'power_template')!;
    expect(power.catalogs.some(c => c.export === 'INNATE_POWER_DEFINITIONS')).toBe(true);
    expect(power.idPrefixes).toContain(INNATE_POWER_ID_PREFIX);
    const seated = new Set(CONTENT_TAGS.map(t => t.tag));
    for (const node of INNATE_POWER_DEFINITIONS) {
      for (const tag of node.properties.tags as string[]) expect(seated.has(tag as never), tag).toBe(true);
    }
  });
});

describe('THR-1671 — createNamedElite stamps the family power', () => {
  it.each(MONSTER_FAMILY_IDS.map(f => [f, MONSTER_FAMILIES[f].sphere] as const))(
    'a %s elite (%s lair) is born with exactly its family power',
    (family, sphere) => {
      const graph = lairWorld(sphere);
      const eliteId = mintElite(graph);
      expect((graph.getNode(eliteId)!.properties.monsterState as MonsterState).family).toBe(family);

      const edges = innateEdges(graph, eliteId);
      expect(edges.map(e => e.target)).toEqual([innatePowerId(family)]);
      expect(edges[0].properties.source).toBe(INNATE_POWER_SOURCE);

      const trace = getTraces().find(t => t.category === 'power.innate_stamped') as unknown as Record<string, unknown>;
      expect(trace).toMatchObject({ eliteId, family, powerId: innatePowerId(family), stamped: true });
    },
  );

  it('the sheet lists it as an Innate power', () => {
    const graph = lairWorld('force');
    const eliteId = mintElite(graph);
    const powers = getAgentAttachments(graph, eliteId).powers
      .filter(p => p.powerClass === 'innate');
    expect(powers.map(p => p.name)).toEqual(['Thick Hide']);
    expect(powers[0].slotTag).toBe('innate_power');
  });
});

describe('THR-1671 — the stamp is fail-soft and idempotent', () => {
  it('mints the definition on demand for a world seeded before the class existed', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'e1', type: 'actor', name: 'E1', properties: { actorType: 'individual' } });
    const result = stampInnatePower(graph, 'e1', 'golem', 40);
    expect(result).toEqual({ powerId: innatePowerId('golem'), stamped: true });
    expect(graph.getNode(innatePowerId('golem'))?.name).toBe('Stone Body');
  });

  it('stamps once however often it is asked', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'e1', type: 'actor', name: 'E1', properties: { actorType: 'individual' } });
    stampInnatePower(graph, 'e1', 'wraith', 40);
    stampInnatePower(graph, 'e1', 'wraith', 41);
    expect(innateEdges(graph, 'e1')).toHaveLength(1);
  });

  it('an unknown family writes nothing, throws nothing, and traces why', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'e1', type: 'actor', name: 'E1', properties: { actorType: 'individual' } });
    expect(() => stampInnatePower(graph, 'e1', 'kraken', 40)).not.toThrow();
    expect(innateEdges(graph, 'e1')).toHaveLength(0);
    const trace = getTraces().find(t => t.category === 'power.innate_stamped') as unknown as Record<string, unknown>;
    expect(trace).toMatchObject({ stamped: false, family: 'kraken' });
  });
});
