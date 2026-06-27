/**
 * Tests for the four reusable ascendant action primitives (THR-509):
 *   1. relic_upkeep_substitute  — getUpkeepStatus (+ phaseControlEffects wiring)
 *   2. co_located_thread_aura   — applyCoLocatedThreadAura
 *   3. chosen_status_grant      — applyChosenStatusGrant + CHOSEN_POWER_TABLE
 *   4. sphere_flavored_effect   — pickSphereFlavoredEffect + SPHERE_EFFECT_TABLE
 *
 * Each primitive is exercised in isolation; an integration test shows
 * faith-spread advancing a thread's tier over ticks (the issue's "Done when").
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { ControlEffect } from '../../types/controlEffect';
import type { EssencePool } from '../../types/influence';
import { SPHERE_NAMES } from '../../types/index';
import { mulberry32 } from '../../lib/prng';
import {
  getUpkeepStatus,
  applyCoLocatedThreadAura,
  applyChosenStatusGrant,
  pickSphereFlavoredEffect,
  CHOSEN_POWER_TABLE,
  SPHERE_EFFECT_TABLE,
  CONSECRATE_DEVOTION_PER_TICK,
} from '../ascendantPrimitives';
import { phaseControlEffects } from '../phaseControlEffects';
import { checkTierPromotion } from '../influence';
import { TIER_PROMOTION_THRESHOLDS } from '../../data/influence-content';

// ─── Graph builders ───────────────────────────────────────────────────────────

function addActor(g: WorldGraph, id: string, props: Record<string, unknown> = {}): void {
  g.addNode({ id, type: 'actor', name: id, properties: props });
}
function addLocation(g: WorldGraph, id: string, props: Record<string, unknown> = {}): void {
  g.addNode({ id, type: 'location', name: id, properties: props });
}
function locateAt(g: WorldGraph, agentId: string, locationId: string): void {
  g.addEdge({ id: `loc:${agentId}->${locationId}`, source: agentId, target: locationId, type: 'located_at', properties: {} });
}
function thread(g: WorldGraph, ascId: string, mortalId: string, tier: number, ticks: number, maintenanceCurrent = true): void {
  g.addEdge({
    id: `thread:${ascId}->${mortalId}`,
    source: ascId,
    target: mortalId,
    type: 'thread',
    properties: { tier, ticksAtCurrentTier: ticks, establishedTick: 0, totalEssenceSpent: 0, maintenanceCurrent },
  });
}
function threadTier(g: WorldGraph, ascId: string, mortalId: string): number {
  return g.getEdge(`thread:${ascId}->${mortalId}`)!.properties.tier as number;
}
function threadTicks(g: WorldGraph, ascId: string, mortalId: string): number {
  return g.getEdge(`thread:${ascId}->${mortalId}`)!.properties.ticksAtCurrentTier as number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Primitive 1: relic_upkeep_substitute
// ═══════════════════════════════════════════════════════════════════════════

describe('getUpkeepStatus (relic_upkeep_substitute)', () => {
  function makeEffect(overrides: Partial<ControlEffect> = {}): ControlEffect {
    return {
      effectId: 'eff_1', templateId: 'tpl', ownerId: 'asc',
      targetHexCol: 0, targetHexRow: 0,
      establishedTick: 0, ritualEssenceInvested: 0,
      perTickCost: { force: 0.5 }, perTickMutations: [], perTickGraphOps: [],
      active: true, ticksActive: 0,
      narrativeTemplates: { established: 'e', active: 'a', lapsed: 'l' },
      ...overrides,
    };
  }

  it('returns no_relic when no upkeepArtifactId is set', () => {
    const g = new WorldGraph();
    expect(getUpkeepStatus(makeEffect(), g)).toBe('no_relic');
  });

  it('returns waived when the relic exists', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'relic.1', type: 'artifact', name: 'Relic', properties: {} });
    expect(getUpkeepStatus(makeEffect({ upkeepArtifactId: 'relic.1' }), g)).toBe('waived');
  });

  it('returns relic_lost when the designated relic is gone', () => {
    const g = new WorldGraph();
    expect(getUpkeepStatus(makeEffect({ upkeepArtifactId: 'relic.gone' }), g)).toBe('relic_lost');
  });
});

describe('relic_upkeep_substitute through phaseControlEffects', () => {
  function makeState(effect: ControlEffect, graph: WorldGraph, force = 10): GameState {
    const pool = {} as EssencePool;
    for (const s of SPHERE_NAMES) pool[s] = 0;
    pool.force = force;
    return {
      tick: 5, essencePool: pool, controlEffects: [effect],
      tiles: [{ coord: { col: 0, row: 0 }, terrain: 'grassland', divineInfluence: 0, corruption: 0, biome: 'temperate' }],
      tickEvents: [], pendingHexMutations: [],
      graph,
    } as unknown as GameState;
  }

  it('waives per-tick cost while the relic exists (no essence drained)', () => {
    const g = new WorldGraph();
    addActor(g, 'asc');
    g.addNode({ id: 'relic.1', type: 'artifact', name: 'Relic', properties: {} });
    const effect: ControlEffect = {
      effectId: 'e', templateId: 't', ownerId: 'asc', targetHexCol: 0, targetHexRow: 0,
      establishedTick: 0, ritualEssenceInvested: 0, perTickCost: { force: 3 },
      perTickMutations: [], perTickGraphOps: [], active: true, ticksActive: 0,
      upkeepArtifactId: 'relic.1',
      narrativeTemplates: { established: 'e', active: 'a', lapsed: 'l' },
    };
    const result = phaseControlEffects(makeState(effect, g, 10));
    expect(result.essencePool!.force).toBe(10); // nothing spent
    expect(result.controlEffects![0].active).toBe(true);
    expect(result.controlEffects![0].ticksActive).toBe(1);
  });

  it('lapses with upkeep_relic_destroyed when the relic is gone', () => {
    const g = new WorldGraph();
    addActor(g, 'asc');
    const effect: ControlEffect = {
      effectId: 'e', templateId: 't', ownerId: 'asc', targetHexCol: 0, targetHexRow: 0,
      establishedTick: 0, ritualEssenceInvested: 0, perTickCost: { force: 3 },
      perTickMutations: [], perTickGraphOps: [], active: true, ticksActive: 0,
      upkeepArtifactId: 'relic.gone',
      narrativeTemplates: { established: 'e', active: 'a', lapsed: 'l' },
    };
    const result = phaseControlEffects(makeState(effect, g, 10));
    expect(result.controlEffects![0].active).toBe(false);
    expect(result.controlEffects![0].lapseReason).toBe('upkeep_relic_destroyed');
    expect(result.essencePool!.force).toBe(10); // no charge on lapse
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Primitive 2: co_located_thread_aura
// ═══════════════════════════════════════════════════════════════════════════

describe('applyCoLocatedThreadAura (co_located_thread_aura)', () => {
  it('advances only threaded agents co-located with the target location', () => {
    const g = new WorldGraph();
    addActor(g, 'asc');
    addLocation(g, 'loc.temple');
    addActor(g, 'mortal.threaded');
    addActor(g, 'mortal.unthreaded');
    addActor(g, 'mortal.elsewhere');
    locateAt(g, 'mortal.threaded', 'loc.temple');
    locateAt(g, 'mortal.unthreaded', 'loc.temple');
    addLocation(g, 'loc.other');
    locateAt(g, 'mortal.elsewhere', 'loc.other');
    thread(g, 'asc', 'mortal.threaded', 1, 0);
    thread(g, 'asc', 'mortal.elsewhere', 1, 0);

    const result = applyCoLocatedThreadAura(g, 'loc.temple', 'asc', { magnitude: 2 }, 1);

    expect(result.touchedAgentIds).toEqual(['mortal.threaded']);
    expect(result.threadField).toBe('ticksAtCurrentTier');
    expect(threadTicks(g, 'asc', 'mortal.threaded')).toBe(2);
    expect(threadTicks(g, 'asc', 'mortal.elsewhere')).toBe(0); // not co-located
  });

  it('includes agents at contained sublocations by default', () => {
    const g = new WorldGraph();
    addActor(g, 'asc');
    addLocation(g, 'loc.temple');
    addLocation(g, 'loc.crypt');
    g.addEdge({ id: 'contains:temple->crypt', source: 'loc.temple', target: 'loc.crypt', type: 'contains', properties: {} });
    addActor(g, 'mortal.crypt');
    locateAt(g, 'mortal.crypt', 'loc.crypt');
    thread(g, 'asc', 'mortal.crypt', 1, 5);

    const result = applyCoLocatedThreadAura(g, 'loc.temple', 'asc', { magnitude: 3 }, 1);
    expect(result.touchedAgentIds).toEqual(['mortal.crypt']);
    expect(threadTicks(g, 'asc', 'mortal.crypt')).toBe(8);
  });

  it('skips sublocations when includeSublocations is false', () => {
    const g = new WorldGraph();
    addActor(g, 'asc');
    addLocation(g, 'loc.temple');
    addLocation(g, 'loc.crypt');
    g.addEdge({ id: 'contains:temple->crypt', source: 'loc.temple', target: 'loc.crypt', type: 'contains', properties: {} });
    addActor(g, 'mortal.crypt');
    locateAt(g, 'mortal.crypt', 'loc.crypt');
    thread(g, 'asc', 'mortal.crypt', 1, 5);

    const result = applyCoLocatedThreadAura(g, 'loc.temple', 'asc', { magnitude: 3, includeSublocations: false }, 1);
    expect(result.touchedAgentIds).toEqual([]);
    expect(threadTicks(g, 'asc', 'mortal.crypt')).toBe(5);
  });

  it('fail-soft: missing location is a no-op', () => {
    const g = new WorldGraph();
    addActor(g, 'asc');
    const result = applyCoLocatedThreadAura(g, 'loc.ghost', 'asc', { magnitude: 1 }, 1);
    expect(result.touchedAgentIds).toEqual([]);
  });

  it('respects a custom thread field', () => {
    const g = new WorldGraph();
    addActor(g, 'asc');
    addLocation(g, 'loc.temple');
    addActor(g, 'm');
    locateAt(g, 'm', 'loc.temple');
    thread(g, 'asc', 'm', 1, 0);
    applyCoLocatedThreadAura(g, 'loc.temple', 'asc', { threadField: 'totalEssenceSpent', magnitude: 5 }, 1);
    expect(g.getEdge('thread:asc->m')!.properties.totalEssenceSpent).toBe(5);
    expect(threadTicks(g, 'asc', 'm')).toBe(0); // untouched
  });
});

describe('faith-spread advances a thread tier over ticks (integration)', () => {
  it('promotes a tier-2 thread to tier-3 via accumulated devotion', () => {
    const g = new WorldGraph();
    addActor(g, 'asc');
    addLocation(g, 'loc.temple');
    addActor(g, 'devotee');
    locateAt(g, 'devotee', 'loc.temple');
    // Tier 2, just short of the tier-3 threshold (90), maintenance current.
    const start = TIER_PROMOTION_THRESHOLDS[3] - 3;
    thread(g, 'asc', 'devotee', 2, start, true);

    expect(threadTier(g, 'asc', 'devotee')).toBe(2);

    // Each "tick" the consecrated site spreads devotion, then promotion is checked.
    let promoted = false;
    for (let i = 0; i < 5 && !promoted; i++) {
      applyCoLocatedThreadAura(g, 'loc.temple', 'asc', { magnitude: CONSECRATE_DEVOTION_PER_TICK }, i);
      const ids = checkTierPromotion(g, 'asc');
      promoted = ids.includes('devotee');
    }

    expect(promoted).toBe(true);
    expect(threadTier(g, 'asc', 'devotee')).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Primitive 3: chosen_status_grant
// ═══════════════════════════════════════════════════════════════════════════

describe('applyChosenStatusGrant (chosen_status_grant)', () => {
  it('flags an actor (faction) chosen and records the (nodeType × domain) power', () => {
    const g = new WorldGraph();
    addActor(g, 'faction.legion', { actorType: 'faction' });
    const result = applyChosenStatusGrant(g, 'faction.legion', 'iron', 'asc', 7);

    expect(result.granted).toBe(true);
    expect(result.alreadyChosen).toBe(false);
    expect(result.power).toEqual(CHOSEN_POWER_TABLE.actor!.iron);

    const status = g.getNode('faction.legion')!.properties.chosen as { byAscendantId: string; domain: string; grantedTick: number; power: { id: string } };
    expect(status.byAscendantId).toBe('asc');
    expect(status.domain).toBe('iron');
    expect(status.grantedTick).toBe(7);
    expect(status.power.id).toBe('chosen.iron.leadership_aura');
  });

  it('still flags chosen with a null power for a node type with no table row', () => {
    // All eight reaches now map for `actor` (THR-513), so the null-power
    // fail-soft path is exercised via a node type CHOSEN_POWER_TABLE has no
    // row for (only `actor` carries entries) — e.g. a location.
    const g = new WorldGraph();
    g.addNode({ id: 'loc.x', type: 'location', name: 'loc.x', properties: {} });
    const result = applyChosenStatusGrant(g, 'loc.x', 'star', 'asc', 1);
    expect(result.granted).toBe(true);
    expect(result.power).toBeNull();
    expect((g.getNode('loc.x')!.properties.chosen as { power: unknown }).power).toBeNull();
  });

  it('reports alreadyChosen and overwrites on re-grant', () => {
    const g = new WorldGraph();
    addActor(g, 'faction.y', { actorType: 'faction' });
    applyChosenStatusGrant(g, 'faction.y', 'iron', 'asc1', 1);
    const result = applyChosenStatusGrant(g, 'faction.y', 'gold', 'asc2', 2);
    expect(result.alreadyChosen).toBe(true);
    const status = g.getNode('faction.y')!.properties.chosen as { byAscendantId: string; domain: string };
    expect(status.byAscendantId).toBe('asc2');
    expect(status.domain).toBe('gold');
  });

  it('fail-soft: missing node is a no-op', () => {
    const g = new WorldGraph();
    const result = applyChosenStatusGrant(g, 'ghost', 'iron', 'asc', 1);
    expect(result.granted).toBe(false);
    expect(result.power).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Primitive 4: sphere_flavored_effect
// ═══════════════════════════════════════════════════════════════════════════

describe('pickSphereFlavoredEffect (sphere_flavored_effect)', () => {
  it('returns a sphere-appropriate effect', () => {
    const picked = pickSphereFlavoredEffect('force', mulberry32(1));
    expect(picked).not.toBeNull();
    expect(picked).toEqual(SPHERE_EFFECT_TABLE.force![0]);
  });

  it('is deterministic for the same seed', () => {
    const a = pickSphereFlavoredEffect('life', mulberry32(42));
    const b = pickSphereFlavoredEffect('life', mulberry32(42));
    expect(a).toEqual(b);
  });

  it('fail-soft: returns null for a sphere with no entry', () => {
    // 'time' is intentionally absent from the scaffold table.
    const picked = pickSphereFlavoredEffect('time', mulberry32(1));
    expect(picked).toBeNull();
  });
});
