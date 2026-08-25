import { describe, it, expect } from 'vitest';
import {
  computeSphereAlignmentBonus,
  computeEquipmentModifier,
  computeTerrainModifier,
  computeTraitBonus,
  computeResolutionModifiers,
  SPHERE_ALIGNMENT_BONUS,
  SPHERE_OPPOSITION_PENALTY,
  EQUIPMENT_MODIFIER_CAP,
  EQUIPMENT_PER_ITEM_CAP,
  TERRAIN_RESOLUTION_MODIFIERS,
  FACTION_CONTROL_BONUS,
  HOSTILE_TERRITORY_PENALTY,
  TRAIT_BONUS_CAP,
  TRAIT_PER_BONUS_CAP,
} from '../resolutionModifiers';
import { WorldGraph } from '../graph';
import { AURA_MAX_RADIUS, AURA_STACKING_CAP, EFFECT_MODIFIER_CAP } from '../../data/effect-constants';
import { deriveContributionLines } from '../encounters/stepFactorLines';

// ─── Test Helpers ────────────────────────────────────────────────

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addAgent(graph: WorldGraph, id: string, props: Record<string, unknown> = {}) {
  graph.addNode({
    id,
    type: 'actor',
    name: `Agent ${id}`,
    properties: { actorType: 'individual', ...props },
  });
}

function addAscendant(graph: WorldGraph, id: string, spherePrimary: string) {
  graph.addNode({
    id,
    type: 'actor',
    name: `Ascendant ${id}`,
    properties: {
      actorType: 'ascendant',
      sphereAlignment: { primary: spherePrimary },
    },
  });
}

function addLocation(graph: WorldGraph, id: string, terrain?: string) {
  graph.addNode({
    id,
    type: 'location',
    name: `Location ${id}`,
    properties: { terrainType: terrain },
  });
}

function addArtifact(
  graph: WorldGraph,
  id: string,
  reachBonus?: Record<string, number>,
) {
  graph.addNode({
    id,
    type: 'artifact',
    name: `Artifact ${id}`,
    properties: { reachBonus },
  });
}

function addTrait(
  graph: WorldGraph,
  id: string,
  resolutionBonus?: Record<string, number>,
) {
  graph.addNode({
    id,
    type: 'trait',
    name: `Trait ${id}`,
    properties: {
      subcategory: 'innate',
      domainContributions: {},
      resolutionBonus,
    },
  });
}

function addFaction(graph: WorldGraph, id: string) {
  graph.addNode({
    id,
    type: 'actor',
    name: `Faction ${id}`,
    properties: { actorType: 'faction' },
  });
}

let edgeCounter = 0;
function edgeId(): string {
  return `e.test.${++edgeCounter}`;
}

// ─── Sphere Alignment ────────────────────────────────────────────

describe('computeSphereAlignmentBonus', () => {
  it('returns +0.10 when agent sphere matches encounter sphere', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1', { sphereAlignment: { primary: 'force' } });

    const result = computeSphereAlignmentBonus(graph, 'a1', 'force');
    expect(result).toBe(SPHERE_ALIGNMENT_BONUS);
  });

  it('returns -0.10 when agent sphere opposes encounter sphere', () => {
    const graph = makeGraph();
    // force opposes mind (per updated cosmology)
    addAgent(graph, 'a1', { sphereAlignment: { primary: 'force' } });

    const result = computeSphereAlignmentBonus(graph, 'a1', 'mind');
    expect(result).toBe(SPHERE_OPPOSITION_PENALTY);
  });

  it('returns 0 when agent sphere is neutral to encounter sphere', () => {
    const graph = makeGraph();
    // force does not oppose or match life
    addAgent(graph, 'a1', { sphereAlignment: { primary: 'force' } });

    const result = computeSphereAlignmentBonus(graph, 'a1', 'life');
    expect(result).toBe(0);
  });

  it('returns 0 when no encounter sphere is provided', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1', { sphereAlignment: { primary: 'force' } });

    const result = computeSphereAlignmentBonus(graph, 'a1', undefined);
    expect(result).toBe(0);
  });

  it('returns 0 when agent has no sphere data', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');

    const result = computeSphereAlignmentBonus(graph, 'a1', 'force');
    expect(result).toBe(0);
  });

  it('resolves sphere from thread edge to ascendant', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1'); // no direct sphere
    addAscendant(graph, 'asc1', 'mind');
    graph.addEdge({
      id: edgeId(),
      source: 'asc1',
      target: 'a1',
      type: 'thread',
      properties: {},
    });

    const result = computeSphereAlignmentBonus(graph, 'a1', 'mind');
    expect(result).toBe(SPHERE_ALIGNMENT_BONUS);
  });

  it('handles string sphereAlignment on agent node', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1', { sphereAlignment: 'matter' });

    const result = computeSphereAlignmentBonus(graph, 'a1', 'matter');
    expect(result).toBe(SPHERE_ALIGNMENT_BONUS);
  });

  it('returns 0 when agent node does not exist', () => {
    const graph = makeGraph();
    const result = computeSphereAlignmentBonus(graph, 'nonexistent', 'force');
    expect(result).toBe(0);
  });
});

// ─── Equipment Modifier ──────────────────────────────────────────

describe('computeEquipmentModifier', () => {
  it('sums reachBonus for matching reach', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifact(graph, 'art1', { iron: 0.05 });
    addArtifact(graph, 'art2', { iron: 0.03 });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 'art1', type: 'possesses', properties: {} });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 'art2', type: 'bonded_to', properties: {} });

    const result = computeEquipmentModifier(graph, 'a1', 'iron');
    expect(result).toBeCloseTo(0.08);
  });

  it('caps total at EQUIPMENT_MODIFIER_CAP', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    // 3 items at 0.08 each = 0.24, should cap at 0.15
    addArtifact(graph, 'art1', { iron: 0.08 });
    addArtifact(graph, 'art2', { iron: 0.08 });
    addArtifact(graph, 'art3', { iron: 0.08 });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 'art1', type: 'possesses', properties: {} });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 'art2', type: 'possesses', properties: {} });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 'art3', type: 'possesses', properties: {} });

    const result = computeEquipmentModifier(graph, 'a1', 'iron');
    expect(result).toBe(EQUIPMENT_MODIFIER_CAP);
  });

  it('caps each item at EQUIPMENT_PER_ITEM_CAP', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    // Single item with 0.20 bonus should be capped at 0.08
    addArtifact(graph, 'art1', { iron: 0.20 });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 'art1', type: 'possesses', properties: {} });

    const result = computeEquipmentModifier(graph, 'a1', 'iron');
    expect(result).toBe(EQUIPMENT_PER_ITEM_CAP);
  });

  it('skips attachments without reachBonus', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifact(graph, 'art1', undefined);
    addArtifact(graph, 'art2', { iron: 0.04 });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 'art1', type: 'possesses', properties: {} });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 'art2', type: 'possesses', properties: {} });

    const result = computeEquipmentModifier(graph, 'a1', 'iron');
    expect(result).toBeCloseTo(0.04);
  });

  it('returns 0 when no equipment has matching reach', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifact(graph, 'art1', { gold: 0.05 });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 'art1', type: 'possesses', properties: {} });

    const result = computeEquipmentModifier(graph, 'a1', 'iron');
    expect(result).toBe(0);
  });
});

// ─── Terrain Modifier ────────────────────────────────────────────

describe('computeTerrainModifier', () => {
  it('mountain gives +0.05', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addLocation(graph, 'loc1', 'mountains');

    const result = computeTerrainModifier(graph, 'a1', 'loc1');
    expect(result).toBe(TERRAIN_RESOLUTION_MODIFIERS.mountains);
  });

  it('swamp gives -0.05', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addLocation(graph, 'loc1', 'swamp');

    const result = computeTerrainModifier(graph, 'a1', 'loc1');
    expect(result).toBe(TERRAIN_RESOLUTION_MODIFIERS.swamp);
  });

  it('unknown terrain gives 0', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addLocation(graph, 'loc1', 'crystal_caves');

    const result = computeTerrainModifier(graph, 'a1', 'loc1');
    expect(result).toBe(0);
  });

  it('no terrain data gives 0', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addLocation(graph, 'loc1', undefined);

    const result = computeTerrainModifier(graph, 'a1', 'loc1');
    expect(result).toBe(0);
  });

  it('faction control bonus applies when agent is member of controlling faction', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addFaction(graph, 'f1');
    addLocation(graph, 'loc1', 'plains');

    // Agent is member of faction
    graph.addEdge({ id: edgeId(), source: 'a1', target: 'f1', type: 'member_of', properties: {} });
    // Faction controls location
    graph.addEdge({ id: edgeId(), source: 'f1', target: 'loc1', type: 'controls', properties: {} });

    const result = computeTerrainModifier(graph, 'a1', 'loc1');
    expect(result).toBe(FACTION_CONTROL_BONUS);
  });

  it('hostile territory penalty applies when enemy faction controls location', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addFaction(graph, 'enemy');
    addLocation(graph, 'loc1', 'plains');

    // Enemy faction controls location
    graph.addEdge({ id: edgeId(), source: 'enemy', target: 'loc1', type: 'controls', properties: {} });
    // Agent has negative sentiment toward enemy faction
    graph.addEdge({
      id: edgeId(),
      source: 'a1',
      target: 'enemy',
      type: 'relates_to',
      properties: { sentiment: -0.5 },
    });

    const result = computeTerrainModifier(graph, 'a1', 'loc1');
    expect(result).toBe(HOSTILE_TERRITORY_PENALTY);
  });

  it('returns 0 when location node does not exist', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');

    const result = computeTerrainModifier(graph, 'a1', 'nonexistent');
    expect(result).toBe(0);
  });

  it('caps total terrain modifier at TERRAIN_MODIFIER_CAP', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addFaction(graph, 'f1');
    // mountains (0.05) + faction control (0.05) = 0.10, exactly at cap
    addLocation(graph, 'loc1', 'mountains');
    graph.addEdge({ id: edgeId(), source: 'a1', target: 'f1', type: 'member_of', properties: {} });
    graph.addEdge({ id: edgeId(), source: 'f1', target: 'loc1', type: 'controls', properties: {} });

    const result = computeTerrainModifier(graph, 'a1', 'loc1');
    expect(result).toBeLessThanOrEqual(0.10);
  });
});

// ─── Trait Bonus ─────────────────────────────────────────────────

describe('computeTraitBonus', () => {
  it('sums resolutionBonus for matching reach', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addTrait(graph, 't1', { iron: 0.03 });
    addTrait(graph, 't2', { iron: 0.04 });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 't1', type: 'has_trait', properties: { level: 1 } });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 't2', type: 'has_trait', properties: { level: 1 } });

    const result = computeTraitBonus(graph, 'a1', 'iron');
    expect(result).toBeCloseTo(0.07);
  });

  it('caps total at TRAIT_BONUS_CAP', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    // 3 traits at 0.05 each = 0.15, should cap at 0.10
    addTrait(graph, 't1', { iron: 0.05 });
    addTrait(graph, 't2', { iron: 0.05 });
    addTrait(graph, 't3', { iron: 0.05 });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 't1', type: 'has_trait', properties: { level: 1 } });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 't2', type: 'has_trait', properties: { level: 1 } });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 't3', type: 'has_trait', properties: { level: 1 } });

    const result = computeTraitBonus(graph, 'a1', 'iron');
    expect(result).toBe(TRAIT_BONUS_CAP);
  });

  it('caps each trait at TRAIT_PER_BONUS_CAP', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addTrait(graph, 't1', { iron: 0.20 });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 't1', type: 'has_trait', properties: { level: 1 } });

    const result = computeTraitBonus(graph, 'a1', 'iron');
    expect(result).toBe(TRAIT_PER_BONUS_CAP);
  });

  it('skips traits without resolutionBonus', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addTrait(graph, 't1', undefined);
    addTrait(graph, 't2', { iron: 0.03 });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 't1', type: 'has_trait', properties: { level: 1 } });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 't2', type: 'has_trait', properties: { level: 1 } });

    const result = computeTraitBonus(graph, 'a1', 'iron');
    expect(result).toBeCloseTo(0.03);
  });
});

// ─── Full Pipeline ───────────────────────────────────────────────

describe('computeResolutionModifiers', () => {
  it('all modifiers sum correctly', () => {
    const graph = makeGraph();
    // Agent with force sphere alignment
    addAgent(graph, 'a1', { sphereAlignment: { primary: 'force' } });
    // Location with mountains terrain
    addLocation(graph, 'loc1', 'mountains');
    // Equipment with iron bonus
    addArtifact(graph, 'art1', { iron: 0.05 });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 'art1', type: 'possesses', properties: {} });
    // Trait with iron resolution bonus
    addTrait(graph, 't1', { iron: 0.03 });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 't1', type: 'has_trait', properties: { level: 1 } });

    const result = computeResolutionModifiers(graph, 'a1', 'loc1', 'iron', 'force');

    expect(result.sphereAlignmentBonus).toBe(SPHERE_ALIGNMENT_BONUS); // 0.10
    expect(result.equipmentModifier).toBeCloseTo(0.05);
    expect(result.terrainModifier).toBe(0.05); // mountains
    expect(result.traitBonus).toBeCloseTo(0.03);
    expect(result.divineInterventionModifier).toBe(0); // stub
    expect(result.totalModifier).toBeCloseTo(0.23);
  });

  it('fail-soft with missing data returns all zeros', () => {
    const graph = makeGraph();
    // Agent exists but has no sphere, no equipment, no traits
    addAgent(graph, 'a1');
    // No location
    const result = computeResolutionModifiers(graph, 'a1', 'nonexistent', 'iron', undefined);

    expect(result.sphereAlignmentBonus).toBe(0);
    expect(result.equipmentModifier).toBe(0);
    expect(result.terrainModifier).toBe(0);
    expect(result.traitBonus).toBe(0);
    expect(result.divineInterventionModifier).toBe(0);
    expect(result.totalModifier).toBe(0);
  });

  it('opposition penalty reduces total modifier', () => {
    const graph = makeGraph();
    // Agent with force alignment, encounter sphere is mind (opposite of force)
    addAgent(graph, 'a1', { sphereAlignment: { primary: 'force' } });
    addLocation(graph, 'loc1', 'plains');

    const result = computeResolutionModifiers(graph, 'a1', 'loc1', 'iron', 'mind');

    expect(result.sphereAlignmentBonus).toBe(SPHERE_OPPOSITION_PENALTY);
    expect(result.totalModifier).toBe(SPHERE_OPPOSITION_PENALTY);
  });

  it('divine intervention modifier is 0 (stub)', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addLocation(graph, 'loc1', 'plains');

    const result = computeResolutionModifiers(graph, 'a1', 'loc1', 'iron', 'force');
    expect(result.divineInterventionModifier).toBe(0);
  });

  it('handles non-existent agent gracefully', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc1', 'mountains');

    const result = computeResolutionModifiers(graph, 'nonexistent', 'loc1', 'iron', 'force');

    expect(result.sphereAlignmentBonus).toBe(0);
    expect(result.equipmentModifier).toBe(0);
    // terrainModifier may be non-zero from terrain alone (no faction check needed)
    expect(result.traitBonus).toBe(0);
    expect(result.divineInterventionModifier).toBe(0);
  });
});

// ─── Named contributions (THR-892) ───────────────────────────────
//
// The load-bearing invariant of the contribution refactor: the named list and
// the numeric total are produced by ONE walk, so they can never disagree. If
// these drift, a test panel starts naming causes the roll did not apply.

describe('named modifier contributions', () => {
  it('sums each contribution kind to exactly the total it explains', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addLocation(graph, 'loc1', 'mountains');
    addArtifact(graph, 'art1', { iron: 0.05 });
    addArtifact(graph, 'art2', { iron: 0.04 });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 'art1', type: 'possesses', properties: {} });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 'art2', type: 'possesses', properties: {} });
    addTrait(graph, 't1', { iron: 0.03 });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 't1', type: 'has_trait', properties: {} });

    const result = computeResolutionModifiers(graph, 'a1', 'loc1', 'iron', 'force');
    const sumOf = (kind: string) =>
      result.contributions.filter((c) => c.kind === kind).reduce((t, c) => t + c.value, 0);

    // Pin the population — an empty contribution list would pass every sum
    // below by vacuous arithmetic (0 === 0).
    expect(result.contributions.length).toBeGreaterThan(0);
    expect(sumOf('equipment')).toBeCloseTo(result.equipmentModifier, 10);
    expect(sumOf('trait')).toBeCloseTo(result.traitBonus, 10);
    expect(sumOf('terrain') + sumOf('faction')).toBeCloseTo(result.terrainModifier, 10);
  });

  it('still sums to the capped total when contributions overflow their cap', () => {
    // Three items well past EQUIPMENT_MODIFIER_CAP — the emitted lines must sum
    // to the capped number, not to the raw one, or the panel would name a
    // contribution the roll never received.
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addLocation(graph, 'loc1');
    for (const id of ['art1', 'art2', 'art3']) {
      addArtifact(graph, id, { iron: EQUIPMENT_PER_ITEM_CAP });
      graph.addEdge({ id: edgeId(), source: 'a1', target: id, type: 'possesses', properties: {} });
    }

    const result = computeResolutionModifiers(graph, 'a1', 'loc1', 'iron', undefined);
    const equipment = result.contributions.filter((c) => c.kind === 'equipment');

    expect(result.equipmentModifier).toBe(EQUIPMENT_MODIFIER_CAP);
    expect(equipment.length).toBeGreaterThan(0);
    expect(equipment.reduce((t, c) => t + c.value, 0)).toBeCloseTo(EQUIPMENT_MODIFIER_CAP, 10);
  });

  it('names every contribution it emits', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addLocation(graph, 'loc1', 'mountains');
    addArtifact(graph, 'art1', { iron: 0.05 });
    graph.addEdge({ id: edgeId(), source: 'a1', target: 'art1', type: 'possesses', properties: {} });

    const result = computeResolutionModifiers(graph, 'a1', 'loc1', 'iron', 'force');
    expect(result.contributions.length).toBeGreaterThan(0);
    for (const contribution of result.contributions) {
      expect(contribution.sourceName).toBeTruthy();
      expect(contribution.sourceId).toBeTruthy();
      expect(contribution.value).not.toBe(0);
    }
  });

  it('emits no contributions when nothing tilts the step', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addLocation(graph, 'loc1');
    const result = computeResolutionModifiers(graph, 'a1', 'loc1', 'iron', undefined);
    expect(result.contributions).toEqual([]);
    expect(result.totalModifier).toBe(0);
  });
});

// ─── Aura (THR-1243) ─────────────────────────────────────────────
//
// The aura is the only modifier sourced from an agent other than the one being
// resolved, so these tests pin both halves: that a neighbour's aura reaches the
// roll, and that a neighbour standing too far away does not. Asserting only the
// first would pass just as well against a wiring that ignored distance.

describe('aura modifier', () => {
  /** An agent standing on a real hex — the aura path needs a resolvable position. */
  function addAgentOnHex(
    graph: WorldGraph,
    id: string,
    col: number,
    row: number,
    factionId?: string,
  ): void {
    addAgent(graph, id, factionId ? { factionId } : {});
    const locId = `loc-${id}`;
    graph.addNode({
      id: locId,
      type: 'location',
      name: `Location ${locId}`,
      properties: { hexCol: col, hexRow: row },
    });
    graph.addEdge({ id: edgeId(), source: id, target: locId, type: 'located_at', properties: {} });
  }

  function addAura(graph: WorldGraph, agentId: string, attachId: string, value: number): void {
    graph.addNode({
      id: attachId,
      type: 'artifact',
      name: `Aura ${attachId}`,
      properties: {
        effects: [{ type: 'aura', radius: AURA_MAX_RADIUS, target: 'all', reach: 'iron', value }],
      },
    });
    graph.addEdge({ id: edgeId(), source: agentId, target: attachId, type: 'possesses', properties: {} });
  }

  it("carries a nearby agent's aura into the total and names its emitter", () => {
    const graph = makeGraph();
    addAgentOnHex(graph, 'a1', 0, 0);
    addAgentOnHex(graph, 'ally', 1, 0);
    addAura(graph, 'ally', 'aura1', 0.06);

    const result = computeResolutionModifiers(graph, 'a1', 'loc-a1', 'iron', undefined);

    expect(result.auraModifier).toBeCloseTo(0.06, 10);
    expect(result.totalModifier).toBeCloseTo(0.06, 10);

    const auraLines = result.contributions.filter(c => c.kind === 'aura');
    expect(auraLines).toHaveLength(1);
    // Named by the emitting agent, not by the item it carries.
    expect(auraLines[0].sourceId).toBe('ally');
    expect(auraLines[0].sourceName).toBe('Agent ally');
  });

  it('ignores an emitter standing beyond the aura radius', () => {
    const graph = makeGraph();
    addAgentOnHex(graph, 'a1', 0, 0);
    addAgentOnHex(graph, 'ally', AURA_MAX_RADIUS + 3, 0);
    addAura(graph, 'ally', 'aura1', 0.06);

    const result = computeResolutionModifiers(graph, 'a1', 'loc-a1', 'iron', undefined);

    expect(result.auraModifier).toBe(0);
    expect(result.contributions.filter(c => c.kind === 'aura')).toEqual([]);
  });

  it('clamps the aggregate at EFFECT_MODIFIER_CAP, and the named lines sum to it', () => {
    const graph = makeGraph();
    addAgentOnHex(graph, 'a1', 0, 0);
    // Each emitter alone already exceeds the cap.
    for (let i = 0; i < AURA_STACKING_CAP; i++) {
      addAgentOnHex(graph, `ally${i}`, 0, 0);
      addAura(graph, `ally${i}`, `aura${i}`, EFFECT_MODIFIER_CAP);
    }

    const result = computeResolutionModifiers(graph, 'a1', 'loc-a1', 'iron', undefined);
    const auraLines = result.contributions.filter(c => c.kind === 'aura');

    expect(result.auraModifier).toBeCloseTo(EFFECT_MODIFIER_CAP, 10);
    expect(auraLines.length).toBeGreaterThan(0);
    expect(auraLines.reduce((t, c) => t + c.value, 0)).toBeCloseTo(EFFECT_MODIFIER_CAP, 10);
  });

  it('aggregates at most AURA_STACKING_CAP emitters however many stand nearby', () => {
    const graph = makeGraph();
    addAgentOnHex(graph, 'a1', 0, 0);
    // Small enough values that the cap, not the clamp, is what bounds the count.
    const crowd = AURA_STACKING_CAP + 3;
    for (let i = 0; i < crowd; i++) {
      addAgentOnHex(graph, `ally${i}`, 0, 0);
      addAura(graph, `ally${i}`, `aura${i}`, 0.01);
    }

    const result = computeResolutionModifiers(graph, 'a1', 'loc-a1', 'iron', undefined);
    const auraLines = result.contributions.filter(c => c.kind === 'aura');

    expect(auraLines).toHaveLength(AURA_STACKING_CAP);
    expect(result.auraModifier).toBeCloseTo(0.01 * AURA_STACKING_CAP, 10);
  });

  it('contributes nothing when the acting agent stands nowhere the map can name', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1'); // no located_at edge
    addLocation(graph, 'loc1');
    addAgentOnHex(graph, 'ally', 0, 0);
    addAura(graph, 'ally', 'aura1', 0.06);

    const result = computeResolutionModifiers(graph, 'a1', 'loc1', 'iron', undefined);

    expect(result.auraModifier).toBe(0);
    expect(result.totalModifier).toBe(0);
  });

  it('renders a factor line, so the modifier is never an unnamed number', () => {
    // deriveContributionLines drops any kind with no authored sentence. Without
    // the `aura` prose pair this passes silently while the roll still moves.
    const graph = makeGraph();
    addAgentOnHex(graph, 'a1', 0, 0);
    addAgentOnHex(graph, 'ally', 1, 0);
    addAura(graph, 'ally', 'aura1', 0.06);

    const result = computeResolutionModifiers(graph, 'a1', 'loc-a1', 'iron', undefined);
    const lines = deriveContributionLines(result.contributions, 'Kael');
    const auraLine = lines.find(l => l.kind === 'aura');

    expect(auraLine).toBeDefined();
    expect(auraLine!.text).toContain('Agent ally');
    expect(auraLine!.polarity).toBe('for');
    expect(auraLine!.delta).toBeCloseTo(0.06, 10);
  });
});
