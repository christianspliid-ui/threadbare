/**
 * THR-1698 — an apex monster's card line reaches the card, not only the prose.
 *
 * THR-1682 records `monsterState.apex` when a legendary golem or behemoth grows into
 * its apex. The fight header and the lair card both build their sentence through
 * `familyLineFor`, which now reads `monsterCardLine` — the same lookup the prose uses —
 * so the card and the scene name the same creature. `listMonsters` exposes `apex`.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../../engine/graph';
import type { GraphNode } from '../../../../types/graph';
import { seedEncounterTraitDefinitions } from '../../../../engine/traitDefinitionSeeding';
import { mintMonsterCard, hardenMonsterCard } from '../../../../engine/monsters/monsterCard';
import { listMonsters } from '../../../../engine/monsters/listMonsters';
import { MONSTER_APEX_CARDS, MONSTER_FAMILIES } from '../../../../data/monster-families';
import { familyLineFor } from '../adapters/buildOpponentHeaderModel';
import { buildLairMonsterCardModel } from '../../lair/buildLairMonsterCardModel';

function addLair(graph: WorldGraph, id: string, sphere: string): GraphNode {
  graph.addNode({
    id,
    type: 'location',
    name: `Lair ${id}`,
    properties: {
      locationSubtype: 'lair', lairTier: 'major', dominantSphere: sphere, spawnedAtTick: 0,
      lastEscalationTick: 0, dangerZone: 'heartland', hexCol: 1, hexRow: 1,
    },
  });
  return graph.getNode(id)!;
}

/** A graph with one minted golem elite on a matter lair. */
function golemWorld(): { graph: WorldGraph; eliteId: string; lairId: string } {
  const graph = new WorldGraph();
  seedEncounterTraitDefinitions(graph);
  const lairId = 'lair_stone';
  const lair = addLair(graph, lairId, 'matter');
  const eliteId = 'elite_stone';
  graph.addNode({
    id: eliteId, type: 'actor', name: 'Grath the Unworn',
    properties: { actorType: 'individual', isMonsterElite: true, lairId, spotlightTier: 'ambient' },
  });
  mintMonsterCard(graph, eliteId, lair, 30);
  graph.updateNode(lairId, { properties: { ...lair.properties, namedEliteId: eliteId } });
  return { graph, eliteId, lairId };
}

const bagOf = (graph: WorldGraph, id: string) =>
  graph.getNode(id)!.properties.monsterState as Record<string, unknown>;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

describe('THR-1698 — familyLineFor reads the apex line', () => {
  it('shows the family line before the lair goes legendary, the apex line after', () => {
    const { graph, eliteId, lairId } = golemWorld();
    expect(familyLineFor(bagOf(graph, eliteId), true)).toBe(cap(MONSTER_FAMILIES.golem.cardLine));

    hardenMonsterCard(graph, graph.getNode(lairId)!, 90);
    expect(familyLineFor(bagOf(graph, eliteId), true)).toBe(cap(MONSTER_APEX_CARDS.golem!.cardLine));
  });

  it('fails soft: an unknown apex reads the family line, an unknown family the beast line', () => {
    expect(familyLineFor({ family: 'golem', apex: 'golem.nope' }, true)).toBe(cap(MONSTER_FAMILIES.golem.cardLine));
    expect(familyLineFor({ family: 'nope' }, true)).toBe(cap(MONSTER_FAMILIES.beast.cardLine));
    expect(familyLineFor(undefined, true)).toBe(cap(MONSTER_FAMILIES.beast.cardLine));
  });

  it('the lair card says the apex line too', () => {
    const { graph, lairId } = golemWorld();
    hardenMonsterCard(graph, graph.getNode(lairId)!, 90);
    const model = buildLairMonsterCardModel(graph, lairId, 90);
    expect(model?.monster?.sentenceText.startsWith(`${cap(MONSTER_APEX_CARDS.golem!.cardLine)}.`)).toBe(true);
  });
});

describe('THR-1698 — listMonsters exposes apex', () => {
  it('omits apex before hardening and carries it after', () => {
    const { graph, lairId } = golemWorld();
    expect(listMonsters(graph)[0].apex).toBeUndefined();
    hardenMonsterCard(graph, graph.getNode(lairId)!, 90);
    expect(listMonsters(graph)[0]).toMatchObject({ family: 'golem', apex: 'golem.colossus' });
  });
});
