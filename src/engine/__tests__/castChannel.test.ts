/**
 * THR-1683 — a landed spell holds: the cast channel, and the ally/enemy target filter.
 *
 * One block per Done-when of the ticket's design section (2026-10-02), each on a
 * hand-built graph so the property under test is the only thing that can move. Both
 * arms of every behaviour change are asserted: a landed cast leaves the condition and
 * a fizzle does not; the aura reaches an enemy while the condition holds and not after.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { AttachmentEffect } from '../../types/effects';
import { getSpellTemplate, spellDefinitionNode, spellDefinitionNodeId } from '../../data/spell-templates';
import { castChannelTicksForTier, CAST_CHANNEL_DEFAULT_TICKS_BY_TIER } from '../../data/spell-casting-constants';
import { executeEffect, isModifierOnlyEffect, MODIFIER_ONLY_EFFECT_TYPES } from '../effectExecutors';
import { resolveCast, resolveCastTarget, passesTargetFilter } from '../spellCasting';
import { castChannelConditionId, castChannelPlan, splitCastEffects } from '../castChannel';
import { findStepCastSpell } from '../stepCast';
import { decayConditions } from '../conditionDecay';
import { collectAuraEffectsNear, resolveAgentPosition, resolveAuraModifiers } from '../effectAura';
import { isAlly } from '../allegiance';
import { enableTracing, disableTracing, getTraces } from '../traceBuffer';

beforeEach(() => disableTracing());
afterEach(() => disableTracing());

const HOLLOW = 'spell_hollow_crown';
const CROWN = getSpellTemplate(HOLLOW)!;
const VEILWALK = getSpellTemplate('spell_veilwalk')!;
const TICK = 20;

// ─── Fixture ────────────────────────────────────────────────────────

/** Two hostile factions; one settlement the caster stands in, one a hex away, one far off. */
function world(): { graph: WorldGraph; state: GameState } {
  const graph = new WorldGraph();
  graph.addNode(spellDefinitionNode(CROWN));
  graph.addNode(spellDefinitionNode(VEILWALK));
  graph.addNode({ id: 'loc.here', type: 'location', name: 'Here', properties: { hexCol: 4, hexRow: 4 } });
  graph.addNode({ id: 'loc.next', type: 'location', name: 'Next', properties: { hexCol: 5, hexRow: 4 } });
  graph.addNode({ id: 'loc.far', type: 'location', name: 'Far', properties: { hexCol: 20, hexRow: 20 } });
  for (const f of ['faction.crown', 'faction.rival']) {
    graph.addNode({ id: f, type: 'actor', name: f, properties: { actorType: 'faction' } });
  }
  graph.addEdge({ id: 'e.rivalry', source: 'faction.crown', target: 'faction.rival', type: 'relates_to', properties: { isRival: true } });
  const state = { graph, tick: TICK, seed: 42, effectStates: new Map(), castCooldowns: new Map(), pendingQuintessenceEvents: [] } as unknown as GameState;
  return { graph, state };
}

function mortal(graph: WorldGraph, id: string, at: string, faction?: string, props: Record<string, unknown> = {}): void {
  graph.addNode({
    id, type: 'actor', name: id,
    properties: { actorType: 'individual', ...(faction ? { factionId: faction } : {}), ...props },
  });
  graph.addEdge({ id: `e.at.${id}`, source: id, target: at, type: 'located_at', properties: {} });
  if (faction) graph.addEdge({ id: `e.member.${id}`, source: id, target: faction, type: 'member_of', properties: {} });
}

/** A Hollow Crown caster whose Gold and Shadow clear the spell's floors. */
function crownCaster(graph: WorldGraph, id = 'caster', at = 'loc.here'): void {
  mortal(graph, id, at, 'faction.crown', { domainCapabilities: { gold: 90, shadow: 90 } });
  graph.addEdge({ id: `e.wield.${id}`, source: id, target: spellDefinitionNodeId(HOLLOW), type: 'has_trait', properties: { level: 1 } });
  graph.addEdge({ id: `e.knows.${id}`, source: id, target: spellDefinitionNodeId(HOLLOW), type: 'knows_spell', properties: { learnedTick: 0 } });
}

function castCrown(state: GameState, band: 'success' | 'failure', targetId?: string) {
  const target = resolveCastTarget(state.graph, 'caster', CROWN, targetId);
  return resolveCast(state, {
    casterId: 'caster', spell: CROWN, band, ...target,
    tick: state.tick, site: 'undertaking', siteRef: `test:${band}`,
  });
}

/** The Gold modifier an aura in the world puts on `who`. */
function goldAuraOn(graph: WorldGraph, who: string): number {
  const pos = resolveAgentPosition(graph, who)!;
  return resolveAuraModifiers(graph, collectAuraEffectsNear(graph, pos), who, pos).gold ?? 0;
}

const bears = (graph: WorldGraph, who: string, id: string) =>
  graph.getOutgoingEdges(who, 'has_trait').find(e => e.target === id);

// ─── The modifier-only set agrees with the executor ─────────────────

describe('MODIFIER_ONLY_EFFECT_TYPES', () => {
  it('every member is traced and writes nothing in executeEffect', () => {
    const { graph } = world();
    for (const type of MODIFIER_ONLY_EFFECT_TYPES) {
      const res = executeEffect({ type } as AttachmentEffect, { casterId: 'x', tick: 0, graph });
      expect(res.success, type).toBe(true);
      expect(res.mutations, type).toEqual([]);
      expect(res.traces[0]?.details?.note, type).toMatch(/Modifier\/state effect/);
    }
  });

  it('a non-clock resource_manipulate is modifier-only; the fight clock and a teleport are not', () => {
    expect(isModifierOnlyEffect({ type: 'resource_manipulate', resource: 'essence' } as AttachmentEffect)).toBe(true);
    expect(isModifierOnlyEffect({ type: 'resource_manipulate', resource: 'fight_clock' } as AttachmentEffect)).toBe(false);
    expect(isModifierOnlyEffect({ type: 'teleport', target: 'self', range: 3 } as AttachmentEffect)).toBe(false);
  });

  it("splits Veilwalk: the teleport executes, the duration rides the channel as a 3-tick passive", () => {
    const { executed, channel } = splitCastEffects(VEILWALK.effects);
    expect(executed.map(e => e.type)).toEqual(['teleport']);
    expect(channel.map(e => e.type)).toEqual(['duration']);
    const plan = castChannelPlan(VEILWALK, channel);
    expect(plan.carried).toEqual([{ type: 'passive', reach: 'shadow', value: 0.05 }]);
    expect(plan.durationTicks).toBe(3);
  });

  it('a stateful primitive is skipped, never shared onto the definition', () => {
    const soulfire = getSpellTemplate('spell_soulfire')!;
    const plan = castChannelPlan(soulfire, splitCastEffects(soulfire.effects).channel);
    expect(plan.carried).toEqual([]);
    expect(plan.skipped).toEqual(['stacking']);
  });

  it('the tier default fills in when no duration names its ticks, fail-soft outside the table', () => {
    expect(castChannelPlan(CROWN, splitCastEffects(CROWN.effects).channel).durationTicks).toBe(CAST_CHANNEL_DEFAULT_TICKS_BY_TIER[3]);
    expect(castChannelTicksForTier(0)).toBe(CAST_CHANNEL_DEFAULT_TICKS_BY_TIER[1]);
    expect(castChannelTicksForTier(9)).toBe(CAST_CHANNEL_DEFAULT_TICKS_BY_TIER[4]);
  });
});

// ─── Done-when 1: a landed Hollow Crown holds ───────────────────────

describe('a landed Hollow Crown leaves the cast condition on the caster', () => {
  it('an enemy within one hex reads −0.08 Gold until the condition expires, and not after', () => {
    const { graph, state } = world();
    crownCaster(graph);
    mortal(graph, 'foe', 'loc.next', 'faction.rival');
    // Aim it from range: the foe is the named target one hex away.
    expect(goldAuraOn(graph, 'foe')).toBe(0);

    const res = castCrown(state, 'success', 'foe');
    expect(res.refused).toBeUndefined();
    expect(res.landed).toBe(true);

    const condId = castChannelConditionId(HOLLOW);
    const edge = bears(graph, 'caster', condId);
    expect(edge?.properties.ticksRemaining).toBe(CAST_CHANNEL_DEFAULT_TICKS_BY_TIER[3]);
    expect(graph.getNode(condId)?.properties.subcategory).toBe('condition');
    expect(res.writes).toContainEqual({ kind: 'condition', actorId: 'caster', ref: condId, channel: 'cast_condition' });

    expect(goldAuraOn(graph, 'foe')).toBeCloseTo(-0.08, 10);

    // Tick the bearing down through the one expiry path.
    for (let t = 1; t < CAST_CHANNEL_DEFAULT_TICKS_BY_TIER[3]; t++) decayConditions(graph, TICK + t);
    expect(bears(graph, 'caster', condId)).toBeDefined();
    expect(goldAuraOn(graph, 'foe')).toBeCloseTo(-0.08, 10);
    decayConditions(graph, TICK + CAST_CHANNEL_DEFAULT_TICKS_BY_TIER[3]);
    expect(bears(graph, 'caster', condId)).toBeUndefined();
    expect(goldAuraOn(graph, 'foe')).toBe(0);
  });

  it('a fizzle writes no cast condition', () => {
    const { graph, state } = world();
    crownCaster(graph);
    mortal(graph, 'foe', 'loc.here', 'faction.rival');
    const res = castCrown(state, 'failure', 'foe');
    expect(res.landed).toBe(false);
    expect(bears(graph, 'caster', castChannelConditionId(HOLLOW))).toBeUndefined();
    expect(res.writes.some(w => w.channel === 'cast_condition')).toBe(false);
  });

  it('re-casting refreshes the one bearing rather than stacking a second', () => {
    const { graph, state } = world();
    crownCaster(graph);
    mortal(graph, 'foe', 'loc.here', 'faction.rival');
    castCrown(state, 'success', 'foe');
    state.castCooldowns!.clear();
    (state as { tick: number }).tick = TICK + 3;
    castCrown(state, 'success', 'foe');
    const edges = graph.getOutgoingEdges('caster', 'has_trait').filter(e => e.target === castChannelConditionId(HOLLOW));
    expect(edges).toHaveLength(1);
    expect(edges[0].properties.appliedAt).toBe(TICK + 3);
  });

  it('traces the channel on spell.cast_resolved', () => {
    const { graph, state } = world();
    crownCaster(graph);
    mortal(graph, 'foe', 'loc.here', 'faction.rival');
    enableTracing();
    castCrown(state, 'success', 'foe');
    const trace = getTraces().find(t => t.category === 'spell.cast_resolved') as unknown as {
      writes: { channel?: string }[]; channel: { applied: boolean; carried: string[] };
    };
    expect(trace.writes.some(w => w.channel === 'cast_condition')).toBe(true);
    expect(trace.channel).toMatchObject({ applied: true, carried: ['aura', 'conditional'] });
  });
});

// ─── Done-when 2: the target filter ─────────────────────────────────

describe('the ally/enemy filter in resolveCastTarget', () => {
  /** The bonded First stands beside the caster in the same company; its id sorts first. */
  function withAlly(graph: WorldGraph): void {
    mortal(graph, 'a_first', 'loc.here', 'faction.crown');
  }

  it('with the bonded First and a stranger beside the caster, the target is the stranger', () => {
    const { graph } = world();
    crownCaster(graph);
    withAlly(graph);
    mortal(graph, 'z_stranger', 'loc.here');
    expect(isAlly(graph, 'caster', 'a_first')).toBe(true);
    const target = resolveCastTarget(graph, 'caster', CROWN, undefined);
    expect(target.targetId).toBe('z_stranger');
    expect(target.filterRejected).toBe(1);
  });

  it('a named ally is refused, and the fallback finds the enemy instead', () => {
    const { graph } = world();
    crownCaster(graph);
    withAlly(graph);
    mortal(graph, 'z_stranger', 'loc.here');
    expect(resolveCastTarget(graph, 'caster', CROWN, 'a_first')).toEqual({ targetId: 'z_stranger', filterRejected: 1 });
  });

  it('with only the ally beside, the result is no target, and the step cast declines', () => {
    const { graph, state } = world();
    crownCaster(graph);
    withAlly(graph);
    expect(resolveCastTarget(graph, 'caster', CROWN, undefined).targetId).toBeUndefined();
    expect(castCrown(state, 'success').refused).toBe('no_target');
    const decided = findStepCastSpell(state, 'caster', { reach: 'gold' });
    expect(decided).toEqual({ declined: 'no_target', spell: CROWN });
  });

  it("an 'ally' spell takes only an ally; 'any' and no filter take anyone", () => {
    const { graph } = world();
    crownCaster(graph);
    withAlly(graph);
    mortal(graph, 'z_stranger', 'loc.here');
    expect(passesTargetFilter(graph, 'caster', 'a_first', 'ally')).toBe(true);
    expect(passesTargetFilter(graph, 'caster', 'z_stranger', 'ally')).toBe(false);
    expect(passesTargetFilter(graph, 'caster', 'a_first', 'any')).toBe(true);
    expect(passesTargetFilter(graph, 'caster', 'a_first', undefined)).toBe(true);
    const lastBreath = getSpellTemplate('spell_last_breath')!;
    expect(resolveCastTarget(graph, 'caster', lastBreath, undefined).targetId).toBe('a_first');
  });
});
