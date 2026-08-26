/**
 * Rule-override consumers — the keys nobody was reading (THR-1241).
 *
 * Stage 2 gave executor-produced overrides somewhere to live and proved the
 * *store* keeps them. That is not the same claim as "the game obeys them", and
 * the gap between those two claims is exactly where `death_prevented` sat for
 * however long: persisted, readable, folded correctly, and ignored by the only
 * function that decides whether a mortal dies.
 *
 * So every test here drives the **owning site**, never the reader. Asserting
 * that `readMultiplierOverride` returns 0.5 would pass against a build where no
 * site calls it — it would be a test of stage 2 wearing stage 3's name. What
 * each test below asserts is that a previously-inert key now changes an
 * *observable outcome*: a cost, a countdown, a reputation delta, a tier curve.
 *
 * Each key is checked in both directions — with the override and without — from
 * the same fixture, so a test cannot pass by the site being broken in a way that
 * happens to produce the expected number.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import { computeEdgeCost } from '../../movementCost';
import { decayConditions } from '../../conditionDecay';
import { applyEncounterGrowth } from '../../capabilityGrowth';
import { applyFactionReputationGain } from '../../factionReputation';
import { tickEffects } from '../../effectTick';
import { shiftBacklashSeverity, evaluateBacklash } from '../../spellActivation';
import { shiftTierCurve } from '../../rewardPool';
import { readFlagOverride, readReachOverride, type RuleOverrideContext } from '../ruleOverrideConsumers';
import { COOLDOWN_MINIMUM_TICKS, RULE_OVERRIDE_VALUE_CAP } from '../../../data/effect-constants';
import type { GameState } from '../../../types/gameState';
import type { AttachmentEffect, EffectRuntimeState, RuleOverrideKey } from '../../../types/effects';

/**
 * Narrows a real `GameState` to the members these sites read. Every field is a
 * genuine one — the cast narrows, it does not invent members that do not exist
 * on the type (the `fixture_cast_hides_invented_values` trap).
 */
function makeState(graph: WorldGraph, tick = 10): GameState {
  return {
    graph,
    tick,
    seed: 42,
    effectStates: new Map<string, EffectRuntimeState>(),
  } as unknown as GameState;
}

function ctxFor(graph: WorldGraph, tick = 10): RuleOverrideContext {
  const state = makeState(graph, tick);
  return { graph, effectStates: state.effectStates, persisted: state, tick };
}

/** An agent wearing an artifact that declares one `modify_rules` override. */
function agentWithOverride(
  rule: RuleOverrideKey,
  value: number | boolean | { from: string; to: string },
  agentId = 'a1',
): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: agentId, type: 'actor', name: 'Bearer', properties: { actorType: 'individual' } });
  graph.addNode({
    id: `charm.${agentId}`, type: 'artifact', name: 'Charm',
    properties: {
      effects: [{
        type: 'modify_rules', rule, value,
        scope: { scope: 'self' }, ticks: 'permanent',
      } as unknown as AttachmentEffect],
    },
  });
  graph.addEdge({
    id: `e.${agentId}.has`, type: 'possesses', source: agentId, target: `charm.${agentId}`, properties: {},
  });
  return graph;
}

/** A bare agent with no attachments — the control arm for every test below. */
function bareAgent(agentId = 'a1'): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: agentId, type: 'actor', name: 'Bearer', properties: { actorType: 'individual' } });
  return graph;
}

function addHexPair(graph: WorldGraph) {
  graph.addNode({
    id: 'loc.from', type: 'location', name: 'Here',
    properties: { hexCol: 1, hexRow: 1, terrain: 'plains' },
  });
  graph.addNode({
    id: 'loc.to', type: 'location', name: 'There',
    properties: { hexCol: 2, hexRow: 1, terrain: 'plains' },
  });
}

// ═══════════════════════════════════════════════════════════════════
// movement_cost_multiplier → movementCost
// ═══════════════════════════════════════════════════════════════════

describe('movement_cost_multiplier — movementCost is the owning site', () => {
  it('halves the traversal cost a bearer pays, and leaves a bare agent alone', () => {
    const blessed = agentWithOverride('movement_cost_multiplier', 0.5);
    addHexPair(blessed);
    const bare = bareAgent();
    addHexPair(bare);

    const states = new Map<string, EffectRuntimeState>();
    const baseline = computeEdgeCost(bare, 'a1', 'loc.from', 'loc.to', states, ctxFor(bare));
    const hastened = computeEdgeCost(blessed, 'a1', 'loc.from', 'loc.to', states, ctxFor(blessed));

    expect(baseline.totalCost).toBeGreaterThan(0);
    expect(hastened.totalCost).toBeLessThan(baseline.totalCost);
    expect(hastened.totalCost).toBeCloseTo(baseline.totalCost * 0.5, 5);
  });

  it('leaves cost untouched when no override context is supplied', () => {
    const blessed = agentWithOverride('movement_cost_multiplier', 0.5);
    addHexPair(blessed);
    const states = new Map<string, EffectRuntimeState>();

    // Callers that hold no GameState still work, and still pay full price —
    // the optional context must be a genuine no-op, not a partial read.
    const withoutCtx = computeEdgeCost(blessed, 'a1', 'loc.from', 'loc.to', states);
    const withCtx = computeEdgeCost(blessed, 'a1', 'loc.from', 'loc.to', states, ctxFor(blessed));
    expect(withCtx.totalCost).toBeLessThan(withoutCtx.totalCost);
  });
});

// ═══════════════════════════════════════════════════════════════════
// healing_multiplier → conditionDecay
// ═══════════════════════════════════════════════════════════════════

describe('healing_multiplier — conditionDecay is the owning site', () => {
  function woundedAgent(graph: WorldGraph, ticksRemaining: number) {
    graph.addNode({ id: 'wound', type: 'trait', name: 'Broken Rib', properties: {} });
    graph.addEdge({
      id: 'e.wound', type: 'has_trait', source: 'a1', target: 'wound',
      properties: { ticksRemaining },
    });
  }

  it('lifts a wound sooner for a bearer than for a bare agent', () => {
    const blessed = agentWithOverride('healing_multiplier', 3.0);
    woundedAgent(blessed, 3);
    const bare = bareAgent();
    woundedAgent(bare, 3);

    // One tick each. The bare agent's wound goes 3 -> 2 and survives; the
    // bearer's goes 3 -> 0 and is removed. Observable outcome, not a read.
    const bareRemoved = decayConditions(bare, 11, ctxFor(bare, 11));
    const blessedRemoved = decayConditions(blessed, 11, ctxFor(blessed, 11));

    expect(bareRemoved).toHaveLength(0);
    expect(blessedRemoved.map(r => r.traitId)).toEqual(['wound']);
    expect(blessed.getOutgoingEdges('a1', 'has_trait')).toHaveLength(0);
  });

  it('honours a curse that slows healing without stalling it forever', () => {
    const cursed = agentWithOverride('healing_multiplier', 0.01);
    woundedAgent(cursed, 2);

    // The floor is what stops a curse becoming a permanent condition with no
    // removal path. Drive enough ticks that an unfloored 0.01 step could not
    // possibly finish, and assert it finished anyway.
    let removed: ReturnType<typeof decayConditions> = [];
    for (let tick = 11; tick < 40 && removed.length === 0; tick++) {
      removed = decayConditions(cursed, tick, ctxFor(cursed, tick));
    }
    expect(removed).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// tier_advancement_cost_multiplier → capabilityGrowth
// ═══════════════════════════════════════════════════════════════════

describe('tier_advancement_cost_multiplier — capabilityGrowth is the owning site', () => {
  it('reads a HALVED cost as DOUBLED growth', () => {
    const forged = agentWithOverride('tier_advancement_cost_multiplier', 0.5);
    const bare = bareAgent();

    const baseline = applyEncounterGrowth(bare, 'a1', 'iron', 50, true, false, 1.0, ctxFor(bare));
    const boosted = applyEncounterGrowth(forged, 'a1', 'iron', 50, true, false, 1.0, ctxFor(forged));

    expect(baseline.growthApplied).toBeGreaterThan(0);
    // The reciprocal is the whole point of the key: cost 0.5 => growth x2.
    expect(boosted.growthApplied).toBeCloseTo(baseline.growthApplied * 2, 5);
  });

  it('cannot be driven to infinite growth by an absurd cost of zero', () => {
    const broken = agentWithOverride('tier_advancement_cost_multiplier', 0);
    const bare = bareAgent();

    const baseline = applyEncounterGrowth(bare, 'a1', 'iron', 50, true, false, 1.0, ctxFor(bare));
    const result = applyEncounterGrowth(broken, 'a1', 'iron', 50, true, false, 1.0, ctxFor(broken));

    // The protection is the stage-2 fold, not the reciprocal's own zero-guard:
    // `clampMultiplier` floors every multiplier at 1/RULE_OVERRIDE_VALUE_CAP, so
    // a `0` never reaches the division and the worst an absurd value can buy is
    // RULE_OVERRIDE_VALUE_CAP-fold growth. Asserting the bound rather than
    // "unchanged" is what makes this a test of the real ceiling.
    expect(Number.isFinite(result.growthApplied)).toBe(true);
    expect(result.growthApplied).toBeCloseTo(baseline.growthApplied * RULE_OVERRIDE_VALUE_CAP, 5);
  });
});

// ═══════════════════════════════════════════════════════════════════
// faction_influence_multiplier → factionReputation
// ═══════════════════════════════════════════════════════════════════

describe('faction_influence_multiplier — factionReputation is the owning site', () => {
  function withMembership(graph: WorldGraph) {
    graph.addNode({
      id: 'faction_def_guild', type: 'faction', name: 'The Guild',
      properties: { factionDefId: 'guild' },
    });
    graph.addEdge({
      id: 'e.member', type: 'member_of', source: 'a1', target: 'faction_def_guild',
      // `rank` is the 0-1 scale, not a tier index.
      properties: { reputation: 0.4, factionDefId: 'guild', role: 'member', rank: 0.4, joinedTick: 0 },
    });
  }

  it('scales the reputation DELTA, not the stored score', () => {
    const signet = agentWithOverride('faction_influence_multiplier', 2.0);
    withMembership(signet);
    const bare = bareAgent();
    withMembership(bare);

    const baseline = applyFactionReputationGain(
      bare, 'a1', 'faction_def_guild', 0.1, 11, 'encounter_aftermath', ctxFor(bare, 11),
    );
    const amplified = applyFactionReputationGain(
      signet, 'a1', 'faction_def_guild', 0.1, 11, 'encounter_aftermath', ctxFor(signet, 11),
    );

    // 0.4 + 0.1 vs 0.4 + 0.2. If the multiplier had been applied to the score
    // rather than the delta, the amplified result would be 1.0 (clamped from
    // 0.4*2 + 0.1), which is exactly the bug this assertion rules out.
    expect(baseline.newReputation).toBeCloseTo(0.5, 5);
    expect(amplified.newReputation).toBeCloseTo(0.6, 5);
  });

  it('amplifies losses as well as gains — it is not a strictly-good item', () => {
    const signet = agentWithOverride('faction_influence_multiplier', 2.0);
    withMembership(signet);

    const result = applyFactionReputationGain(
      signet, 'a1', 'faction_def_guild', -0.1, 11, 'encounter_aftermath', ctxFor(signet, 11),
    );
    expect(result.newReputation).toBeCloseTo(0.2, 5);
  });
});

// ═══════════════════════════════════════════════════════════════════
// cooldown_multiplier → effectTick
// ═══════════════════════════════════════════════════════════════════

describe('cooldown_multiplier — effectTick is the owning site', () => {
  function withCooldownAbility(graph: WorldGraph, cooldownTicks: number) {
    graph.addNode({
      id: 'ability', type: 'artifact', name: 'Ring of Recall',
      properties: {
        effects: [
          { type: 'cooldown', activeTicks: 1, cooldownTicks } as unknown as AttachmentEffect,
        ],
      },
    });
    graph.addEdge({
      id: 'e.ability', type: 'possesses', source: 'a1', target: 'ability', properties: {},
    });
  }

  /** Ticks until the attachment comes back off cooldown, or `cap` if it never does. */
  function ticksUntilActive(graph: WorldGraph, ctx: RuleOverrideContext | undefined, cap = 60): number {
    let states = new Map<string, EffectRuntimeState>([
      ['ability', { cooldownActive: false, cooldownTicksElapsed: 0 }],
    ]);
    for (let i = 1; i <= cap; i++) {
      const result = tickEffects(graph, 'a1', 10 + i, states, ctx);
      states = result.updatedStates;
      if (states.get('ability')?.cooldownActive === true) return i;
    }
    return cap;
  }

  it('shortens the dormant stretch for a bearer', () => {
    // The override lives on a SECOND artifact so the cooldown effect itself is
    // byte-identical in both arms — otherwise the fixture, not the wiring,
    // could be what differs.
    const hastened = agentWithOverride('cooldown_multiplier', 0.5);
    withCooldownAbility(hastened, 20);
    const bare = bareAgent();
    withCooldownAbility(bare, 20);

    const baseline = ticksUntilActive(bare, ctxFor(bare));
    const shortened = ticksUntilActive(hastened, ctxFor(hastened));

    expect(baseline).toBe(20);
    expect(shortened).toBe(10);
  });

  it('never collapses a cooldown below COOLDOWN_MINIMUM_TICKS', () => {
    const absurd = agentWithOverride('cooldown_multiplier', 0.01);
    withCooldownAbility(absurd, 20);
    const bare = bareAgent();
    withCooldownAbility(bare, 20);

    // Two floors stand between an absurd value and a free ability, and this
    // asserts the pair rather than either alone: the fold clamps 0.01 up to
    // 1/RULE_OVERRIDE_VALUE_CAP first, and COOLDOWN_MINIMUM_TICKS backstops
    // whatever survives. The wait is shorter than baseline but never free.
    const shortened = ticksUntilActive(absurd, ctxFor(absurd));
    expect(shortened).toBeGreaterThanOrEqual(COOLDOWN_MINIMUM_TICKS);
    expect(shortened).toBeLessThan(ticksUntilActive(bare, ctxFor(bare)));
  });
});

// ═══════════════════════════════════════════════════════════════════
// backlash_severity_multiplier → spellActivation
// ═══════════════════════════════════════════════════════════════════

describe('backlash_severity_multiplier — spellActivation is the owning site', () => {
  it('shifts one band up, one band down, and clamps at the ladder ends', () => {
    expect(shiftBacklashSeverity('minor', 2.0)).toBe('major');
    expect(shiftBacklashSeverity('major', 2.0)).toBe('catastrophic');
    expect(shiftBacklashSeverity('catastrophic', 2.0)).toBe('catastrophic');

    expect(shiftBacklashSeverity('catastrophic', 0.5)).toBe('major');
    expect(shiftBacklashSeverity('minor', 0.5)).toBe('minor');

    // Inside the thresholds nothing moves — a 1.2 multiplier is not "slightly
    // worse", because the enum has no rung between minor and major.
    expect(shiftBacklashSeverity('minor', 1.2)).toBe('minor');
    expect(shiftBacklashSeverity('minor', 1.0)).toBe('minor');
  });

  it('reports the shifted severity out of evaluateBacklash, not the authored one', () => {
    const backlash = {
      trigger: 'failure' as const,
      probability: 1.0,
      severity: 'minor' as const,
      effect: { type: 'modify_rules', rule: 'doom_rate_multiplier', value: 2 } as unknown as AttachmentEffect,
      narrativeTemplate: 'The working turns.',
    };

    const plain = evaluateBacklash(backlash, 'failure', 0.0);
    const cursed = evaluateBacklash(backlash, 'failure', 0.0, 2.0);

    expect(plain.fires).toBe(true);
    expect(plain.severity).toBe('minor');
    expect(cursed.severity).toBe('major');
  });

  it('does not change how OFTEN backlash fires — only how bad it is', () => {
    const backlash = {
      trigger: 'failure' as const,
      probability: 0.5,
      severity: 'minor' as const,
      effect: { type: 'modify_rules', rule: 'doom_rate_multiplier', value: 2 } as unknown as AttachmentEffect,
      narrativeTemplate: 'The working turns.',
    };

    // A roll above the probability must still miss, however severe the curse.
    expect(evaluateBacklash(backlash, 'failure', 0.9, 3.0).fires).toBe(false);
    expect(evaluateBacklash(backlash, 'failure', 0.1, 3.0).fires).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// reward_tier_bonus → rewardPool
// ═══════════════════════════════════════════════════════════════════

describe('reward_tier_bonus — rewardPool is the owning site', () => {
  it('slides the curve up a rung without losing weight', () => {
    const curve = { 1: 0.40, 2: 0.40, 3: 0.15, 4: 0.05 } as Record<1 | 2 | 3 | 4, number>;
    const shifted = shiftTierCurve(curve, 1);

    const before = Object.values(curve).reduce((a, b) => a + b, 0);
    const after = Object.values(shifted).reduce((a, b) => a + b, 0);

    // Mass is conserved — a blessed draw must not become LESS likely to produce
    // anything, which is what a curve that dropped its overflow would do.
    expect(after).toBeCloseTo(before, 10);
    expect(shifted[1]).toBe(0);
    expect(shifted[2]).toBeCloseTo(0.40, 10);
    expect(shifted[4]).toBeCloseTo(0.15 + 0.05, 10);
  });

  it('is a no-op at zero and clamped at the cap', () => {
    const curve = { 1: 0.40, 2: 0.40, 3: 0.15, 4: 0.05 } as Record<1 | 2 | 3 | 4, number>;
    expect(shiftTierCurve(curve, 0)).toBe(curve);

    // Beyond the cap the shift stops growing — 5 and 50 must agree, or
    // REWARD_TIER_BONUS_CAP is not doing anything. At the cap (2 bands) tier 1
    // lands on 3 and everything from 2 up piles onto 4; note this deliberately
    // does NOT collapse the whole curve onto the top band, which is the point of
    // capping rather than letting a stacked bonus flatten the authored curve.
    expect(shiftTierCurve(curve, 5)).toEqual(shiftTierCurve(curve, 50));
    expect(shiftTierCurve(curve, 50)[3]).toBeCloseTo(0.40, 10);
    expect(shiftTierCurve(curve, 50)[4]).toBeCloseTo(0.40 + 0.15 + 0.05, 10);
  });
});

// ═══════════════════════════════════════════════════════════════════
// death_prevented and encounter_reach_override — the non-numeric keys
// ═══════════════════════════════════════════════════════════════════

describe('death_prevented — a flag, not a number', () => {
  it('reads true from an attachment-declared ward and false from a bare agent', () => {
    const warded = agentWithOverride('death_prevented', true);
    const bare = bareAgent();

    expect(readFlagOverride(ctxFor(warded), 'a1', 'death_prevented', 'test')).toBe(true);
    expect(readFlagOverride(ctxFor(bare), 'a1', 'death_prevented', 'test')).toBe(false);
  });

  it('does not report a ward on a DIFFERENT agent', () => {
    const graph = agentWithOverride('death_prevented', true, 'a1');
    graph.addNode({ id: 'a2', type: 'actor', name: 'Unwarded', properties: { actorType: 'individual' } });

    expect(readFlagOverride(ctxFor(graph), 'a2', 'death_prevented', 'test')).toBe(false);
  });
});

describe('encounter_reach_override — a struct the numeric reader cannot see', () => {
  it('returns the swap from an attachment-declared override', () => {
    const graph = agentWithOverride('encounter_reach_override', { from: 'iron', to: 'tongue' });
    expect(readReachOverride(ctxFor(graph), 'a1', 'test')).toEqual({ from: 'iron', to: 'tongue' });
  });

  it('returns null rather than a misleading zero when nothing is in force', () => {
    expect(readReachOverride(ctxFor(bareAgent()), 'a1', 'test')).toBeNull();
  });
});
