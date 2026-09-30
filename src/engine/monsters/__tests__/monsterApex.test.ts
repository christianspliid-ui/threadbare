/**
 * THR-1682 — content above novice: two expert monster elite cards.
 *
 * Plan doc `Docs/plans/2026-09-29-thr-1627-content-above-novice.md` § D3, § D5.
 * A legendary golem or behemoth grows into its apex card, rated severe Dread and
 * severe Might — window fit in the expert band. The fight calibration is asserted
 * unchanged, never re-tuned.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { GraphNode } from '../../../types/graph';
import type { MonsterState } from '../../../types/monster';
import {
  MONSTER_APEX_CARDS,
  MONSTER_APEX_CARD_LIST,
  MONSTER_CLOCK_BY_TIER,
  MONSTER_FAMILIES,
  MONSTER_FAMILY_IDS,
  monsterCardLine,
} from '../../../data/monster-families';
import {
  FIGHT_RATING_DIFFICULTY,
  FIGHT_RATING_WORDS,
  FIGHT_STEP_SCALE,
} from '../../../data/fight-constants';
import { SCALE_DIFFICULTY_OFFSETS } from '../../resolutionScaleAdjust';
import { windowFitBandFor } from '../../kpi/engagementKpi';
import { seedEncounterTraitDefinitions } from '../../traitDefinitionSeeding';
import { mintMonsterCard, hardenMonsterCard } from '../monsterCard';
import { readOpponentCard } from '../../fights/opponentCard';
import { phaseLairEscalation, LAIR_ESCALATION_INTERVAL, LAIR_UPGRADE_MIN_TICKS } from '../../lairEscalation';
import { resolveSceneTargetContext } from '../../proseEnrichment';

function addLair(graph: WorldGraph, id: string, sphere: string, tier = 'major'): GraphNode {
  graph.addNode({
    id,
    type: 'location',
    name: `Lair ${id}`,
    properties: {
      locationSubtype: 'lair', lairTier: tier, dominantSphere: sphere, spawnedAtTick: 0,
      lastEscalationTick: 0, dangerZone: 'heartland', hexCol: 1, hexRow: 1,
    },
  });
  return graph.getNode(id)!;
}

function mintedElite(graph: WorldGraph, lairId: string, sphere: string): string {
  const lair = addLair(graph, lairId, sphere);
  const eliteId = `elite_${lairId}`;
  graph.addNode({
    id: eliteId, type: 'actor', name: `Elite ${lairId}`,
    properties: { actorType: 'individual', isMonsterElite: true, lairId, spotlightTier: 'ambient' },
  });
  mintMonsterCard(graph, eliteId, lair, 30);
  graph.updateNode(lairId, { properties: { ...lair.properties, namedEliteId: eliteId } });
  return eliteId;
}

function seededGraph(): WorldGraph {
  const graph = new WorldGraph();
  seedEncounterTraitDefinitions(graph);
  return graph;
}

const cardOf = (graph: WorldGraph, id: string): MonsterState =>
  graph.getNode(id)!.properties.monsterState as MonsterState;

describe('THR-1682 — the apex cards', () => {
  it('are two, each an elite of an existing family, rated severe / severe', () => {
    expect(MONSTER_APEX_CARD_LIST).toHaveLength(2);
    for (const apex of MONSTER_APEX_CARD_LIST) {
      expect(MONSTER_FAMILY_IDS).toContain(apex.family);
      expect(MONSTER_APEX_CARDS[apex.family]).toBe(apex);
      expect(apex.id.startsWith(`${apex.family}.`)).toBe(true);
      expect(apex).toMatchObject({ dread: 'severe', might: 'severe' });
      expect(apex.cardLine).not.toBe(MONSTER_FAMILIES[apex.family].cardLine);
    }
  });

  it('fit the expert window at the fight scale (demanded 0.65, window fit expert)', () => {
    for (const apex of MONSTER_APEX_CARD_LIST) {
      const demanded = (FIGHT_RATING_DIFFICULTY[apex.dread] + FIGHT_RATING_DIFFICULTY[apex.might]) / 2
        + SCALE_DIFFICULTY_OFFSETS[FIGHT_STEP_SCALE];
      expect(demanded).toBeCloseTo(0.65, 5);
      expect(windowFitBandFor(demanded)).toBe('expert');
    }
  });
});

describe('THR-1682 — a legendary golem or behemoth grows into its apex', () => {
  it.each([
    ['matter', 'golem.colossus'],
    ['life', 'behemoth.ancient'],
  ])('%s lair → %s, read by readOpponentCard as severe / severe', (sphere, apexId) => {
    const graph = seededGraph();
    const eliteId = mintedElite(graph, `lair_${sphere}`, sphere);
    const minted = cardOf(graph, eliteId);
    expect(minted.apex).toBeUndefined();
    expect(minted.might).toBe('steep');

    const wounded = { ...minted, clockFilled: 2, clockUpdatedTick: 40 };
    graph.updateNode(eliteId, { properties: { ...graph.getNode(eliteId)!.properties, monsterState: wounded } });
    hardenMonsterCard(graph, graph.getNode(`lair_${sphere}`)!, 90);

    const card = cardOf(graph, eliteId);
    expect(card).toMatchObject({
      apex: apexId, dread: 'severe', might: 'severe',
      clockSize: MONSTER_CLOCK_BY_TIER.legendary, clockFilled: 2, clockUpdatedTick: 40,
    });
    const read = readOpponentCard(graph, eliteId, 40);
    expect(read).toMatchObject({ source: 'monsterState', dread: 'severe', might: 'severe' });
  });

  it('hardening twice keeps the apex', () => {
    const graph = seededGraph();
    const eliteId = mintedElite(graph, 'lair_twice', 'matter');
    hardenMonsterCard(graph, graph.getNode('lair_twice')!, 90);
    hardenMonsterCard(graph, graph.getNode('lair_twice')!, 120);
    expect(cardOf(graph, eliteId)).toMatchObject({ apex: 'golem.colossus', dread: 'severe', might: 'severe' });
  });

  it('families without an apex harden as before (one Dread word, Might kept)', () => {
    for (const id of MONSTER_FAMILY_IDS) {
      if (MONSTER_APEX_CARDS[id]) continue;
      const fam = MONSTER_FAMILIES[id];
      const graph = seededGraph();
      const eliteId = mintedElite(graph, `lair_${id}`, fam.sphere);
      hardenMonsterCard(graph, graph.getNode(`lair_${id}`)!, 90);
      const card = cardOf(graph, eliteId);
      const expected = FIGHT_RATING_WORDS[Math.min(FIGHT_RATING_WORDS.length - 1, FIGHT_RATING_WORDS.indexOf(fam.dread) + 1)];
      expect(card.apex).toBeUndefined();
      expect(card.dread).toBe(expected);
      expect(card.might).toBe(fam.might);
    }
  });

  it('is reachable through the escalation phase itself', () => {
    const graph = seededGraph();
    addLair(graph, 'lair_live', 'life', 'minor');
    const mint = Math.ceil(LAIR_UPGRADE_MIN_TICKS / LAIR_ESCALATION_INTERVAL) * LAIR_ESCALATION_INTERVAL;
    phaseLairEscalation({ tick: mint, seed: 42, graph, pendingSpherePressures: [], tiles: [] } as unknown as GameState);
    const eliteId = graph.getNode('lair_live')!.properties.namedEliteId as string;
    let tick = mint;
    while (graph.getNode('lair_live')!.properties.lairTier !== 'legendary' && tick < 1000) {
      tick += LAIR_ESCALATION_INTERVAL;
      phaseLairEscalation({ tick, seed: 42, graph, pendingSpherePressures: [], tiles: [] } as unknown as GameState);
    }
    expect(graph.getNode('lair_live')!.properties.lairTier).toBe('legendary');
    expect(readOpponentCard(graph, eliteId, tick)).toMatchObject({ dread: 'severe', might: 'severe' });
    expect(cardOf(graph, eliteId).apex).toBe('behemoth.ancient');
  });

  it('shows its apex line to prose, and the family line before it grows', () => {
    const graph = seededGraph();
    const eliteId = mintedElite(graph, 'lair_prose', 'matter');
    expect(monsterCardLine(cardOf(graph, eliteId))).toBe(MONSTER_FAMILIES.golem.cardLine);
    hardenMonsterCard(graph, graph.getNode('lair_prose')!, 90);
    expect(monsterCardLine(cardOf(graph, eliteId))).toBe(MONSTER_APEX_CARDS.golem!.cardLine);
    graph.addNode({ id: 'hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
    const ctx = resolveSceneTargetContext(graph, 'hero', eliteId);
    expect(ctx?.family).toBe(MONSTER_APEX_CARDS.golem!.cardLine);
    expect(monsterCardLine(undefined)).toBeUndefined();
    expect(monsterCardLine({ family: 'nope', apex: 'nope' })).toBeUndefined();
  });
});

describe('THR-1682 — the fight calibration is unchanged (asserted, not re-tuned)', () => {
  it('keeps the rating difficulties, the fight scale and every family row', () => {
    expect(FIGHT_RATING_DIFFICULTY).toEqual({ gentle: 0.20, fair: 0.35, steep: 0.50, severe: 0.65 });
    expect(FIGHT_STEP_SCALE).toBe('regional');
    expect(Object.fromEntries(MONSTER_FAMILY_IDS.map(id => [id, `${MONSTER_FAMILIES[id].dread}/${MONSTER_FAMILIES[id].might}`])))
      .toEqual({
        beast: 'fair/steep', golem: 'fair/steep', stormkin: 'steep/fair', behemoth: 'fair/steep',
        mindthing: 'steep/fair', wraith: 'severe/gentle', echo: 'steep/fair', blight: 'steep/fair',
      });
  });
});
