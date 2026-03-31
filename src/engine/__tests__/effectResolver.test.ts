import { describe, it, expect } from 'vitest';
import {
  evaluatePredicate,
  getEffectModifierValue,
  resolveEffectModifiers,
  hasEffectsFormat,
  buildPredicateContext,
} from '../effectResolver';
import { WorldGraph } from '../graph';
import type { PredicateContext } from '../../types/effects';
import type { AttachmentEffect } from '../../types/effects';
import {
  EFFECT_MODIFIER_CAP,
  EFFECT_PER_ITEM_CAP,
} from '../../data/effect-constants';

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

function addArtifactWithEffects(
  graph: WorldGraph,
  id: string,
  effects: AttachmentEffect[],
  name?: string,
) {
  graph.addNode({
    id,
    type: 'artifact',
    name: name ?? `Artifact ${id}`,
    properties: { effects },
  });
}

function addTraitWithEffects(
  graph: WorldGraph,
  id: string,
  effects: AttachmentEffect[],
) {
  graph.addNode({
    id,
    type: 'trait',
    name: `Trait ${id}`,
    properties: {
      subcategory: 'innate',
      domainContributions: {},
      effects,
    },
  });
}

let edgeCounter = 0;
function eid() { return `e.test.${++edgeCounter}`; }

function makeDefaultContext(overrides: Partial<PredicateContext> = {}): PredicateContext {
  return {
    inCombat: false,
    inSocial: false,
    inExploration: false,
    inMystical: false,
    atHomeTerritory: false,
    inEnemyTerritory: false,
    inWilderness: true,
    healthLow: false,
    healthHigh: true,
    alone: true,
    outnumbered: false,
    nearWater: false,
    biome: 'plains',
    agentTraits: new Set<string>(),
    reachValues: {},
    factionRank: 0,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════
// evaluatePredicate
// ═══════════════════════════════════════════════════════════════════

describe('evaluatePredicate', () => {
  it('returns true for in_combat when context is combat', () => {
    const ctx = makeDefaultContext({ inCombat: true });
    expect(evaluatePredicate('in_combat', ctx)).toBe(true);
  });

  it('returns false for in_combat when context is not combat', () => {
    const ctx = makeDefaultContext({ inCombat: false });
    expect(evaluatePredicate('in_combat', ctx)).toBe(false);
  });

  it('evaluates in_social correctly', () => {
    expect(evaluatePredicate('in_social', makeDefaultContext({ inSocial: true }))).toBe(true);
    expect(evaluatePredicate('in_social', makeDefaultContext({ inSocial: false }))).toBe(false);
  });

  it('evaluates territory predicates', () => {
    expect(evaluatePredicate('at_home_territory', makeDefaultContext({ atHomeTerritory: true }))).toBe(true);
    expect(evaluatePredicate('in_enemy_territory', makeDefaultContext({ inEnemyTerritory: true }))).toBe(true);
    expect(evaluatePredicate('in_wilderness', makeDefaultContext({ inWilderness: true }))).toBe(true);
  });

  it('evaluates health predicates', () => {
    expect(evaluatePredicate('health_low', makeDefaultContext({ healthLow: true }))).toBe(true);
    expect(evaluatePredicate('health_high', makeDefaultContext({ healthHigh: true }))).toBe(true);
  });

  it('evaluates agent-count predicates', () => {
    expect(evaluatePredicate('alone', makeDefaultContext({ alone: true }))).toBe(true);
    expect(evaluatePredicate('outnumbered', makeDefaultContext({ outnumbered: true }))).toBe(true);
  });

  it('evaluates biome: parameterized predicate', () => {
    expect(evaluatePredicate('biome:forest', makeDefaultContext({ biome: 'forest' }))).toBe(true);
    expect(evaluatePredicate('biome:forest', makeDefaultContext({ biome: 'plains' }))).toBe(false);
  });

  it('evaluates has_trait: parameterized predicate', () => {
    const ctx = makeDefaultContext({ agentTraits: new Set(['night_vision', 'cavalry_charge']) });
    expect(evaluatePredicate('has_trait:night_vision', ctx)).toBe(true);
    expect(evaluatePredicate('has_trait:water_breathing', ctx)).toBe(false);
  });

  it('evaluates lacks_trait: parameterized predicate', () => {
    const ctx = makeDefaultContext({ agentTraits: new Set(['night_vision']) });
    expect(evaluatePredicate('lacks_trait:night_vision', ctx)).toBe(false);
    expect(evaluatePredicate('lacks_trait:water_breathing', ctx)).toBe(true);
  });

  it('evaluates reach_above: parameterized predicate', () => {
    const ctx = makeDefaultContext({ reachValues: { iron: 0.35, gold: 0.10 } });
    expect(evaluatePredicate('reach_above:iron:0.30', ctx)).toBe(true);
    expect(evaluatePredicate('reach_above:iron:0.40', ctx)).toBe(false);
    expect(evaluatePredicate('reach_above:gold:0.05', ctx)).toBe(true);
  });

  it('evaluates faction_rank: parameterized predicate', () => {
    expect(evaluatePredicate('faction_rank:2', makeDefaultContext({ factionRank: 3 }))).toBe(true);
    expect(evaluatePredicate('faction_rank:5', makeDefaultContext({ factionRank: 3 }))).toBe(false);
  });

  it('returns false for unknown predicate (fail-soft)', () => {
    // @ts-expect-error testing unknown predicate
    expect(evaluatePredicate('unknown_predicate', makeDefaultContext())).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// getEffectModifierValue
// ═══════════════════════════════════════════════════════════════════

describe('getEffectModifierValue', () => {
  const ctx = makeDefaultContext();

  it('returns value for passive effect matching reach', () => {
    const effect: AttachmentEffect = { type: 'passive', reach: 'iron', value: 0.05 };
    expect(getEffectModifierValue(effect, 'iron', ctx)).toBe(0.05);
  });

  it('returns 0 for passive effect on different reach', () => {
    const effect: AttachmentEffect = { type: 'passive', reach: 'iron', value: 0.05 };
    expect(getEffectModifierValue(effect, 'gold', ctx)).toBe(0);
  });

  it('returns value for permanent effect matching reach', () => {
    const effect: AttachmentEffect = { type: 'permanent', reach: 'shadow', value: -0.04 };
    expect(getEffectModifierValue(effect, 'shadow', ctx)).toBe(-0.04);
  });

  it('returns value for conditional when predicate is true', () => {
    const combatCtx = makeDefaultContext({ inCombat: true });
    const effect: AttachmentEffect = { type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.10 };
    expect(getEffectModifierValue(effect, 'iron', combatCtx)).toBe(0.10);
  });

  it('returns 0 for conditional when predicate is false', () => {
    const effect: AttachmentEffect = { type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.10 };
    expect(getEffectModifierValue(effect, 'iron', ctx)).toBe(0);
  });

  it('returns both bonus and penalty for tradeoff on matching reaches', () => {
    const effect: AttachmentEffect = {
      type: 'tradeoff',
      bonus: { reach: 'iron', value: 0.10 },
      penalty: { reach: 'heart', value: -0.06 },
    };
    expect(getEffectModifierValue(effect, 'iron', ctx)).toBe(0.10);
    expect(getEffectModifierValue(effect, 'heart', ctx)).toBe(-0.06);
    expect(getEffectModifierValue(effect, 'gold', ctx)).toBe(0);
  });

  it('returns stacking value based on runtime stacks', () => {
    const effect: AttachmentEffect = {
      type: 'stacking', reach: 'iron', valuePerStack: 0.02, maxStacks: 5, stackOn: 'combat_success',
    };
    expect(getEffectModifierValue(effect, 'iron', ctx, { stacks: 3 })).toBe(0.06);
    expect(getEffectModifierValue(effect, 'iron', ctx, { stacks: 0 })).toBe(0);
    expect(getEffectModifierValue(effect, 'iron', ctx)).toBe(0); // no runtime state = 0 stacks
  });

  it('returns decay current value from runtime state', () => {
    const effect: AttachmentEffect = {
      type: 'decay', reach: 'star', startValue: 0.15, changePerTick: -0.01,
      limitValue: 0, destroyAtLimit: true,
    };
    expect(getEffectModifierValue(effect, 'star', ctx, { decayCurrentValue: 0.10 })).toBe(0.10);
    expect(getEffectModifierValue(effect, 'star', ctx)).toBe(0.15); // no state = startValue
  });

  it('returns 0 for duration effect with expired ticks', () => {
    const effect: AttachmentEffect = {
      type: 'duration', ticks: 10, reach: 'heart', value: 0.08, destroyOnExpiry: true,
    };
    expect(getEffectModifierValue(effect, 'heart', ctx, { ticksRemaining: 0 })).toBe(0);
    expect(getEffectModifierValue(effect, 'heart', ctx, { ticksRemaining: 5 })).toBe(0.08);
  });

  it('returns 0 for cooldown effect in dormant phase', () => {
    const effect: AttachmentEffect = {
      type: 'cooldown', activeTicks: 5, cooldownTicks: 15, reach: 'iron', value: 0.08,
    };
    expect(getEffectModifierValue(effect, 'iron', ctx, { cooldownActive: false })).toBe(0);
    expect(getEffectModifierValue(effect, 'iron', ctx, { cooldownActive: true })).toBe(0.08);
  });

  it('returns 0 for non-modifier effect types', () => {
    expect(getEffectModifierValue({ type: 'trait_grant', grantedTrait: 'x' }, 'iron', ctx)).toBe(0);
    expect(getEffectModifierValue({ type: 'teleport', target: 'self', range: 5 }, 'iron', ctx)).toBe(0);
    expect(getEffectModifierValue({ type: 'aura', radius: 1, target: 'allies', reach: 'iron', value: 0.03 }, 'iron', ctx)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// resolveEffectModifiers
// ═══════════════════════════════════════════════════════════════════

describe('resolveEffectModifiers', () => {
  it('sums passive effects from possessions', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'sword1', [
      { type: 'passive', reach: 'iron', value: 0.05 },
    ]);
    graph.addEdge({ id: eid(), type: 'possesses', source: 'a1', target: 'sword1', properties: {} });

    const ctx = makeDefaultContext();
    const result = resolveEffectModifiers(graph, 'a1', 'iron', ctx);
    expect(result.reachModifiers.iron).toBeCloseTo(0.05);
    expect(result.contributions).toHaveLength(1);
    expect(result.contributions[0].active).toBe(true);
  });

  it('sums effects from multiple attachments', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'sword1', [
      { type: 'passive', reach: 'iron', value: 0.05 },
    ]);
    addArtifactWithEffects(graph, 'helm1', [
      { type: 'passive', reach: 'iron', value: 0.03 },
    ]);
    graph.addEdge({ id: eid(), type: 'possesses', source: 'a1', target: 'sword1', properties: {} });
    graph.addEdge({ id: eid(), type: 'possesses', source: 'a1', target: 'helm1', properties: {} });

    const ctx = makeDefaultContext();
    const result = resolveEffectModifiers(graph, 'a1', 'iron', ctx);
    expect(result.reachModifiers.iron).toBeCloseTo(0.08);
  });

  it('caps per-item contribution at EFFECT_PER_ITEM_CAP', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'op_sword', [
      { type: 'passive', reach: 'iron', value: 0.50 }, // way over cap
    ]);
    graph.addEdge({ id: eid(), type: 'possesses', source: 'a1', target: 'op_sword', properties: {} });

    const ctx = makeDefaultContext();
    const result = resolveEffectModifiers(graph, 'a1', 'iron', ctx);
    expect(result.reachModifiers.iron).toBe(EFFECT_PER_ITEM_CAP);
  });

  it('caps total modifier at EFFECT_MODIFIER_CAP', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    // Add many small effects that sum beyond cap
    for (let i = 0; i < 10; i++) {
      const artId = `art${i}`;
      addArtifactWithEffects(graph, artId, [
        { type: 'passive', reach: 'iron', value: 0.05 },
      ]);
      graph.addEdge({ id: eid(), type: 'possesses', source: 'a1', target: artId, properties: {} });
    }

    const ctx = makeDefaultContext();
    const result = resolveEffectModifiers(graph, 'a1', 'iron', ctx);
    expect(result.reachModifiers.iron).toBe(EFFECT_MODIFIER_CAP);
  });

  it('handles conditional effects — active only when predicate true', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'warhammer', [
      { type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.10 },
    ]);
    graph.addEdge({ id: eid(), type: 'possesses', source: 'a1', target: 'warhammer', properties: {} });

    // Not in combat
    const ctx1 = makeDefaultContext({ inCombat: false });
    const r1 = resolveEffectModifiers(graph, 'a1', 'iron', ctx1);
    expect(r1.reachModifiers.iron ?? 0).toBe(0);

    // In combat
    const ctx2 = makeDefaultContext({ inCombat: true });
    const r2 = resolveEffectModifiers(graph, 'a1', 'iron', ctx2);
    expect(r2.reachModifiers.iron).toBeCloseTo(0.10);
  });

  it('collects granted traits', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'boots', [
      { type: 'trait_grant', grantedTrait: 'night_vision' },
      { type: 'passive', reach: 'shadow', value: 0.02 },
    ]);
    graph.addEdge({ id: eid(), type: 'possesses', source: 'a1', target: 'boots', properties: {} });

    const ctx = makeDefaultContext();
    const result = resolveEffectModifiers(graph, 'a1', 'shadow', ctx);
    expect(result.grantedTraits).toContain('night_vision');
  });

  it('handles tradeoff effects', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'berserker_helm', [
      { type: 'tradeoff', bonus: { reach: 'iron', value: 0.10 }, penalty: { reach: 'heart', value: -0.06 } },
    ]);
    graph.addEdge({ id: eid(), type: 'possesses', source: 'a1', target: 'berserker_helm', properties: {} });

    const ctx = makeDefaultContext();
    const ironResult = resolveEffectModifiers(graph, 'a1', 'iron', ctx);
    expect(ironResult.reachModifiers.iron).toBeCloseTo(0.10);

    const heartResult = resolveEffectModifiers(graph, 'a1', 'heart', ctx);
    expect(heartResult.reachModifiers.heart).toBeCloseTo(-0.06);
  });

  it('reads effects from has_trait edges too', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addTraitWithEffects(graph, 'battle_scar', [
      { type: 'passive', reach: 'iron', value: 0.03 },
    ]);
    graph.addEdge({ id: eid(), type: 'has_trait', source: 'a1', target: 'battle_scar', properties: {} });

    const ctx = makeDefaultContext();
    const result = resolveEffectModifiers(graph, 'a1', 'iron', ctx);
    expect(result.reachModifiers.iron).toBeCloseTo(0.03);
  });

  it('returns empty result for agent with no effects', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');

    const ctx = makeDefaultContext();
    const result = resolveEffectModifiers(graph, 'a1', 'iron', ctx);
    expect(result.reachModifiers.iron ?? 0).toBe(0);
    expect(result.contributions).toHaveLength(0);
    expect(result.grantedTraits).toHaveLength(0);
  });

  it('handles suppressed effects via runtime state', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'ring', [
      { type: 'passive', reach: 'gold', value: 0.08 },
    ]);
    graph.addEdge({ id: eid(), type: 'possesses', source: 'a1', target: 'ring', properties: {} });

    const states = new Map([['ring', { suppressed: true }]]);
    const ctx = makeDefaultContext();
    const result = resolveEffectModifiers(graph, 'a1', 'gold', ctx, states);
    expect(result.reachModifiers.gold ?? 0).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// hasEffectsFormat
// ═══════════════════════════════════════════════════════════════════

describe('hasEffectsFormat', () => {
  it('returns true when at least one attachment has effects[]', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'sword', [
      { type: 'passive', reach: 'iron', value: 0.05 },
    ]);
    graph.addEdge({ id: eid(), type: 'possesses', source: 'a1', target: 'sword', properties: {} });

    expect(hasEffectsFormat(graph, 'a1')).toBe(true);
  });

  it('returns false when no attachments have effects[]', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    graph.addNode({
      id: 'old_sword',
      type: 'artifact',
      name: 'Old Sword',
      properties: { reachBonus: { iron: 0.05 } },
    });
    graph.addEdge({ id: eid(), type: 'possesses', source: 'a1', target: 'old_sword', properties: {} });

    expect(hasEffectsFormat(graph, 'a1')).toBe(false);
  });

  it('returns false for agent with no attachments', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    expect(hasEffectsFormat(graph, 'a1')).toBe(false);
  });
});
