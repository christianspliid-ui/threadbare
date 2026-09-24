/**
 * THR-1544 — Monsters M1: the monster card.
 *
 * Plan doc `Docs/plans/2026-09-23-monsters-as-opponents.md` § Engine 1–3, § Content.
 * Covers the Done-when list: the card at mint for every family (eight + the
 * foundation fallback), hardening at legendary (clock 5, Dread +1 capped, wounds
 * kept), the plot rejecting a monster, graduation skipping one, the other exclusion
 * sites, the temper edge the fight reads, and `listMonsters`.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { GraphNode } from '../../../types/graph';
import type { MonsterState } from '../../../types/monster';
import { CREATION_SPHERE_NAMES, FOUNDATION_SPHERE_NAMES } from '../../../types/index';
import {
  MONSTER_CLOCK_BY_TIER,
  MONSTER_FAMILIES,
  MONSTER_FAMILY_FALLBACK,
  MONSTER_FAMILY_IDS,
  monsterFamilyForSphere,
} from '../../../data/monster-families';
import { TEMPER_TRAIT_DEFINITIONS, TEMPER_TRAIT_IDS, temperTraitId } from '../../../data/temper-trait-content';
import { seedEncounterTraitDefinitions, ENCOUNTER_TRAIT_DEFINITIONS } from '../../traitDefinitionSeeding';
import { mintMonsterCard, hardenMonsterCard } from '../monsterCard';
import { isMonster } from '../isMonster';
import { listMonsters } from '../listMonsters';
import { readOpponentCard } from '../../fights/opponentCard';
import { phaseLairEscalation, LAIR_ESCALATION_INTERVAL, LAIR_UPGRADE_MIN_TICKS } from '../../lairEscalation';
import { phaseNpcGraduation } from '../../npcGraduation';
import { NPC_CONSTANTS } from '../../../types/npc';
import { UNDERTAKING_OBJECT_TYPES } from '../../../data/undertaking-objects';
import type { ObjectVerbContext } from '../../../data/undertaking-objects';
import { CONTENT_OBJECT_KINDS } from '../../../data/content-objects';
import { CONTENT_TAGS } from '../../../data/content-tags';
import { TRAIT_SUBCATEGORIES } from '../../../data/world-objects';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function addLair(graph: WorldGraph, id: string, sphere: unknown, tier = 'major'): GraphNode {
  graph.addNode({
    id,
    type: 'location',
    name: `Lair ${id}`,
    properties: {
      locationSubtype: 'lair',
      lairTier: tier,
      dominantSphere: sphere,
      spawnedAtTick: 0,
      lastEscalationTick: 0,
      dangerZone: 'heartland',
      hexCol: 1,
      hexRow: 1,
    },
  });
  return graph.getNode(id)!;
}

function addElite(graph: WorldGraph, id: string, lairId: string): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Elite ${id}`,
    properties: { actorType: 'individual', isMonsterElite: true, lairId, spotlightTier: 'ambient' },
  });
}

function seededGraph(): WorldGraph {
  const graph = new WorldGraph();
  seedEncounterTraitDefinitions(graph);
  return graph;
}

function cardOf(graph: WorldGraph, id: string): MonsterState {
  return graph.getNode(id)!.properties.monsterState as MonsterState;
}

function temperEdges(graph: WorldGraph, id: string): string[] {
  return graph.getOutgoingEdges(id, 'has_trait').map(e => e.target).filter(t => t.startsWith('trait.temper.'));
}

// ─── The family table ────────────────────────────────────────────────────────

describe('THR-1544 — the eight families', () => {
  it('has one family per creation sphere, and no sphere twice', () => {
    expect(MONSTER_FAMILY_IDS).toHaveLength(8);
    const spheres = MONSTER_FAMILY_IDS.map(id => MONSTER_FAMILIES[id].sphere).sort();
    expect(spheres).toEqual([...CREATION_SPHERE_NAMES].sort());
  });

  it('falls back to the Force family for every foundation sphere and a missing one', () => {
    for (const sphere of [...FOUNDATION_SPHERE_NAMES, undefined, 42, 'nonsense']) {
      const { family, fellBack } = monsterFamilyForSphere(sphere);
      expect(fellBack, String(sphere)).toBe(true);
      expect(family.id).toBe(MONSTER_FAMILY_FALLBACK);
    }
    expect(MONSTER_FAMILIES[MONSTER_FAMILY_FALLBACK].sphere).toBe('force');
  });
});

// ─── The card at mint ────────────────────────────────────────────────────────

describe('THR-1544 — mint writes the card', () => {
  for (const familyId of MONSTER_FAMILY_IDS) {
    const family = MONSTER_FAMILIES[familyId];
    it(`mints a ${familyId} card and its ${family.temper} temper edge for a ${family.sphere} lair`, () => {
      const graph = seededGraph();
      const lair = addLair(graph, 'lair_a', family.sphere);
      addElite(graph, 'elite_a', 'lair_a');

      mintMonsterCard(graph, 'elite_a', lair, 30);

      expect(cardOf(graph, 'elite_a')).toEqual({
        family: familyId,
        dread: family.dread,
        might: family.might,
        nerveReach: family.nerveReach,
        clashReach: family.clashReach,
        clockSize: MONSTER_CLOCK_BY_TIER.major,
        clockFilled: 0,
        clockUpdatedTick: 30,
        temperShown: false,
      });
      expect(temperEdges(graph, 'elite_a')).toEqual([temperTraitId(family.temper)]);
      // The fight reads exactly this card and this temper.
      const card = readOpponentCard(graph, 'elite_a', 30);
      expect(card.source).toBe('monsterState');
      expect(card.temper).toBe(family.temper);
      expect(card.clockSize).toBe(MONSTER_CLOCK_BY_TIER.major);
    });
  }

  it('mints the fallback card for a foundation-sphere lair', () => {
    const graph = seededGraph();
    const lair = addLair(graph, 'lair_f', 'chaos');
    addElite(graph, 'elite_f', 'lair_f');
    mintMonsterCard(graph, 'elite_f', lair, 30);
    expect(cardOf(graph, 'elite_f').family).toBe(MONSTER_FAMILY_FALLBACK);
    expect(temperEdges(graph, 'elite_f')).toEqual([temperTraitId(MONSTER_FAMILIES[MONSTER_FAMILY_FALLBACK].temper)]);
  });

  it('mints the card without the edge when the temper definition is missing (fail-soft)', () => {
    const graph = new WorldGraph(); // no trait definitions seeded
    const lair = addLair(graph, 'lair_b', 'force');
    addElite(graph, 'elite_b', 'lair_b');
    expect(() => mintMonsterCard(graph, 'elite_b', lair, 30)).not.toThrow();
    expect(cardOf(graph, 'elite_b').family).toBe('beast');
    expect(temperEdges(graph, 'elite_b')).toEqual([]);
  });

  it('every elite phaseLairEscalation mints carries a card and a temper edge', () => {
    const graph = seededGraph();
    addLair(graph, 'lair_m', 'mind', 'minor');
    const tick = Math.ceil(LAIR_UPGRADE_MIN_TICKS / LAIR_ESCALATION_INTERVAL) * LAIR_ESCALATION_INTERVAL;
    const state = { tick, seed: 42, graph, pendingSpherePressures: [], tiles: [] } as unknown as GameState;

    phaseLairEscalation(state);

    const eliteId = graph.getNode('lair_m')!.properties.namedEliteId as string;
    expect(eliteId).toBeTruthy();
    expect(cardOf(graph, eliteId).family).toBe('mindthing');
    expect(temperEdges(graph, eliteId)).toEqual(['trait.temper.bargainer']);
  });
});

// ─── Hardening at legendary ──────────────────────────────────────────────────

describe('THR-1544 — legendary hardens the card', () => {
  it('raises the clock to 5 and Dread one word, and keeps the wounds', () => {
    const graph = seededGraph();
    const lair = addLair(graph, 'lair_g', 'force'); // beast: dread fair
    addElite(graph, 'elite_g', 'lair_g');
    mintMonsterCard(graph, 'elite_g', lair, 30);
    graph.updateNode('lair_g', { properties: { ...lair.properties, namedEliteId: 'elite_g' } });
    const wounded = { ...cardOf(graph, 'elite_g'), clockFilled: 3, clockUpdatedTick: 40 };
    graph.updateNode('elite_g', { properties: { ...graph.getNode('elite_g')!.properties, monsterState: wounded } });

    hardenMonsterCard(graph, graph.getNode('lair_g')!, 90);

    const card = cardOf(graph, 'elite_g');
    expect(MONSTER_CLOCK_BY_TIER.legendary).toBe(5);
    expect(card.clockSize).toBe(5);
    expect(card.dread).toBe('steep');
    expect(card.clockFilled).toBe(3);
    expect(card.clockUpdatedTick).toBe(40);
    expect(card.might).toBe('steep');
  });

  it('phaseLairEscalation hardens the elite when its lair goes legendary', () => {
    const graph = seededGraph();
    addLair(graph, 'lair_e', 'force', 'minor');
    const mint = Math.ceil(LAIR_UPGRADE_MIN_TICKS / LAIR_ESCALATION_INTERVAL) * LAIR_ESCALATION_INTERVAL;
    phaseLairEscalation({ tick: mint, seed: 42, graph, pendingSpherePressures: [], tiles: [] } as unknown as GameState);
    const eliteId = graph.getNode('lair_e')!.properties.namedEliteId as string;
    expect(cardOf(graph, eliteId).clockSize).toBe(MONSTER_CLOCK_BY_TIER.major);

    let tick = mint;
    while (graph.getNode('lair_e')!.properties.lairTier !== 'legendary' && tick < 1000) {
      tick += LAIR_ESCALATION_INTERVAL;
      phaseLairEscalation({ tick, seed: 42, graph, pendingSpherePressures: [], tiles: [] } as unknown as GameState);
    }
    expect(graph.getNode('lair_e')!.properties.lairTier).toBe('legendary');
    expect(cardOf(graph, eliteId)).toMatchObject({ clockSize: MONSTER_CLOCK_BY_TIER.legendary, dread: 'steep' });
  });

  it('caps Dread at severe', () => {
    const graph = seededGraph();
    const lair = addLair(graph, 'lair_w', 'spirit'); // wraith: dread severe
    addElite(graph, 'elite_w', 'lair_w');
    mintMonsterCard(graph, 'elite_w', lair, 30);
    graph.updateNode('lair_w', { properties: { ...lair.properties, namedEliteId: 'elite_w' } });
    hardenMonsterCard(graph, graph.getNode('lair_w')!, 90);
    expect(cardOf(graph, 'elite_w').dread).toBe('severe');
  });

  it('skips a lair with no elite or an elite with no card', () => {
    const graph = seededGraph();
    const bare = addLair(graph, 'lair_n', 'force');
    expect(hardenMonsterCard(graph, bare, 90)).toBeNull();
    addElite(graph, 'elite_n', 'lair_n');
    graph.updateNode('lair_n', { properties: { ...bare.properties, namedEliteId: 'elite_n' } });
    expect(hardenMonsterCard(graph, graph.getNode('lair_n')!, 90)).toBeNull();
    expect(graph.getNode('elite_n')!.properties.monsterState).toBeUndefined();
  });
});

// ─── isMonster and the exclusions ────────────────────────────────────────────

describe('THR-1544 — isMonster and the exclusions', () => {
  it('reads the elite flag or the card, and nothing else', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'm1', type: 'actor', name: 'M1', properties: { actorType: 'individual', isMonsterElite: true } });
    graph.addNode({ id: 'm2', type: 'actor', name: 'M2', properties: { actorType: 'individual', monsterState: { family: 'beast' } } });
    graph.addNode({ id: 'p', type: 'actor', name: 'P', properties: { actorType: 'individual' } });
    expect(isMonster(graph.getNode('m1'))).toBe(true);
    expect(isMonster(graph.getNode('m2'))).toBe(true);
    expect(isMonster(graph.getNode('p'))).toBe(false);
    expect(isMonster(undefined)).toBe(false);
  });

  it('the plot rejects a monster target, and still accepts a mortal', () => {
    const mortalKind = UNDERTAKING_OBJECT_TYPES.find(o => o.id === 'mortal')!;
    const graph = seededGraph();
    const lair = addLair(graph, 'lair_p', 'force');
    addElite(graph, 'elite_p', 'lair_p');
    mintMonsterCard(graph, 'elite_p', lair, 30);
    graph.addNode({ id: 'baker', type: 'actor', name: 'Baker', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'plotter', type: 'actor', name: 'Plotter', properties: { actorType: 'individual' } });

    const discriminator = mortalKind.shape.discriminator!;
    expect(discriminator(graph.getNode('elite_p')!)).toBe(false);
    expect(discriminator(graph.getNode('baker')!)).toBe(true);

    const ctx: ObjectVerbContext = {
      state: { tick: 1, effectStates: new Map() } as unknown as GameState,
      graph,
      actorId: 'plotter',
      handle: { kind: 'node', nodeId: 'elite_p' },
      tick: 1,
    };
    const result = (mortalKind.verbs.destroy as unknown as (c: ObjectVerbContext) => { success: boolean; error?: string })(ctx);
    expect(result.success).toBe(false);
    expect(String(result.error)).toContain('not_a_mortal');
    expect(graph.getNode('elite_p')!.properties.deceased).not.toBe(true);
  });

  it('graduation skips a monster however important it becomes', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'elite_x', type: 'actor', name: 'Elite',
      properties: { actorType: 'individual', isMonsterElite: true, spotlightTier: 'ambient', importance: NPC_CONSTANTS.NOTABLE_THRESHOLD * 10 },
    });
    // The pre-fix arm: the same importance on a mortal does promote.
    graph.addNode({
      id: 'npc_x', type: 'actor', name: 'NPC',
      properties: { actorType: 'individual', spotlightTier: 'ambient', npcRole: 'guard', importance: NPC_CONSTANTS.NOTABLE_THRESHOLD * 10 },
    });
    const events = phaseNpcGraduation({ tick: 1, seed: 42, graph, tickEvents: [] } as unknown as GameState);
    expect(events.map(e => e.actorId)).toEqual(['npc_x']);
    expect(graph.getNode('elite_x')!.properties.spotlightTier).toBe('ambient');
  });
});

// ─── Content registration ────────────────────────────────────────────────────

describe('THR-1544 — temper content is registered', () => {
  it('seeds the four temper definitions with class temper and the #temper word', () => {
    expect(TEMPER_TRAIT_IDS).toEqual(['stubborn', 'berserk', 'skittish', 'bargainer'].map(t => `trait.temper.${t}`));
    for (const def of TEMPER_TRAIT_DEFINITIONS) {
      expect(ENCOUNTER_TRAIT_DEFINITIONS).toContain(def);
      expect(def.properties.subcategory).toBe('temper');
      expect(def.properties.tags).toContain('#temper');
      expect(def.properties.domainContributions).toEqual({});
      expect(def.properties.visibility).toBe('public');
    }
  });

  it('the Trait kind lists trait.temper. and its catalog; #temper is seated; temper is a registered subcategory', () => {
    const traitKind = CONTENT_OBJECT_KINDS.find(k => k.id === 'trait_template')!;
    expect(traitKind.idPrefixes).toContain('trait.temper.');
    expect(traitKind.catalogs).toContainEqual({ module: 'data/temper-trait-content', export: 'TEMPER_TRAIT_DEFINITIONS' });
    expect(CONTENT_TAGS.find(t => t.tag === '#temper')?.axis).toBe('family');
    expect(TRAIT_SUBCATEGORIES).toContain('temper');
  });
});

// ─── listMonsters ────────────────────────────────────────────────────────────

describe('THR-1544 — listMonsters', () => {
  it('lists every monster with its card, the slain flagged, the cardless marked', () => {
    const graph = seededGraph();
    const lairA = addLair(graph, 'lair_1', 'entropy');
    addElite(graph, 'elite_1', 'lair_1');
    mintMonsterCard(graph, 'elite_1', lairA, 30);
    graph.updateNode('lair_1', { properties: { ...lairA.properties, lairTier: 'legendary' } });

    const lairB = addLair(graph, 'lair_2', 'life');
    addElite(graph, 'elite_2', 'lair_2');
    mintMonsterCard(graph, 'elite_2', lairB, 30);
    graph.updateNode('elite_2', { properties: { ...graph.getNode('elite_2')!.properties, deceased: true } });

    addElite(graph, 'elite_3', 'lair_2'); // no card: the kill-criterion shape
    graph.addNode({ id: 'baker', type: 'actor', name: 'Baker', properties: { actorType: 'individual' } });

    const rows = listMonsters(graph);
    expect(rows.map(r => r.id)).toEqual(['elite_1', 'elite_2', 'elite_3']);
    expect(rows[0]).toMatchObject({
      lairId: 'lair_1', lairTier: 'legendary', family: 'blight', dread: 'steep', might: 'fair',
      clockSize: 4, clockFilled: 0, temper: 'berserk', temperShown: false, deceased: false, cardMissing: false,
    });
    expect(rows[1]).toMatchObject({ family: 'behemoth', temper: 'stubborn', deceased: true, lairTier: 'major' });
    expect(rows[2].cardMissing).toBe(true);
  });
});
