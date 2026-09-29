/**
 * The power runtime, S1 — spells that work (THR-1571).
 *
 * One test per Done-when of the plan's S1 list
 * (Docs/plans/2026-09-29-thr-1571-power-runtime.md § Done when), each on a hand-built
 * graph so the property under test is the only thing that can move. Both arms of every
 * behaviour change are asserted: a landed cast writes, a fizzled one does not.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { AttachmentEffect, SpellTemplate } from '../../types/effects';
import { allSpellDefinitionNodes, getSpellTemplate, spellDefinitionNodeId, SPELL_TEMPLATES, carriedEffectsOf } from '../../data/spell-templates';
import { allStrainConditionNodes, strainConditionId } from '../../data/strain-conditions';
import { isCarriedEffectStateless, CARRIED_EFFECT_ALLOWED_TYPES } from '../../data/spell-casting-constants';
import { getUndertakingObjectType, type ObjectVerbContext } from '../../data/undertaking-objects';
import { CASTER_NPC_ROLES } from '../../data/strategic-action-constants';
import { ITEM_HONEST_TRIGGER_EVENTS } from '../../data/item-honest-vocabulary';
import { resolveCast, castCooldownKey } from '../spellCasting';
import { evaluateBacklashForBand } from '../spellActivation';
import { executeDispel } from '../effectExecutors';
import { applyExecutionResult } from '../effects/effectEventDispatch';
import { collectAttachmentEffects } from '../effects/effectWalker';
import { applySuppressions } from '../effects/effectSuppression';
import { getRevealRanges } from '../effects/effectQueries';
import { isCaster } from '../casterIdentity';
import { seedSpellKnowing } from '../seedAttachments';
import { hexDistance } from '../../lib/hexMath';

const POWER = getUndertakingObjectType('power')!;

// ─── Fixture ────────────────────────────────────────────────────────

/** A strip of five settlements one hex apart along row 0, plus one far away. */
function world(): { graph: WorldGraph; state: GameState } {
  const graph = new WorldGraph();
  for (const node of allSpellDefinitionNodes()) graph.addNode(node);
  for (const node of allStrainConditionNodes()) graph.addNode(node);
  for (let c = 0; c < 5; c++) {
    graph.addNode({ id: `loc_${c}`, name: `Town ${c}`, type: 'location', properties: { hexCol: c * 2, hexRow: 0, locationSubtype: 'town' } });
  }
  graph.addNode({ id: 'loc_far', name: 'Far Town', type: 'location', properties: { hexCol: 30, hexRow: 20, locationSubtype: 'town' } });
  const state = { graph, tick: 10, seed: 42, effectStates: new Map(), castCooldowns: new Map() } as unknown as GameState;
  return { graph, state };
}

function addMortal(graph: WorldGraph, id: string, at: string, props: Record<string, unknown> = {}): void {
  graph.addNode({ id, name: id, type: 'actor', properties: { actorType: 'individual', ...props } });
  graph.addEdge({ id: `located_at_${id}_${at}`, source: id, target: at, type: 'located_at', properties: {} });
}

function wield(graph: WorldGraph, actorId: string, spellId: string): void {
  const def = spellDefinitionNodeId(spellId);
  graph.addEdge({ id: `knows_spell_${actorId}_${def}`, source: actorId, target: def, type: 'knows_spell', properties: { learnedTick: 0 } });
  graph.addEdge({ id: `has_trait_${actorId}_${def}`, source: actorId, target: def, type: 'has_trait', properties: { level: 1, acquiredTick: 0 } });
}

function whereIs(graph: WorldGraph, actorId: string): string | undefined {
  return graph.getOutgoingEdges(actorId, 'located_at')[0]?.target;
}

/** A Veilwalk caster whose Veil share clears the spell's 0.20 floor. */
function veilwalker(graph: WorldGraph, id: string, at = 'loc_2'): void {
  addMortal(graph, id, at, { npcRole: 'priest', domainCapabilities: { veil: 90 } });
  wield(graph, id, 'spell_veilwalk');
}

const VEILWALK = getSpellTemplate('spell_veilwalk')!;

// ─── isCaster ───────────────────────────────────────────────────────

describe('isCaster — the mastery arm matches the real trait id', () => {
  it('a mortal holding trait.mastery.spell-weaver is a caster', () => {
    const { graph } = world();
    addMortal(graph, 'weaver', 'loc_0');
    graph.addNode({ id: 'trait.mastery.spell-weaver', name: 'Spell-Weaver', type: 'trait', properties: { subcategory: 'mastery' } });
    expect(isCaster(graph, 'weaver')).toBe(false);
    graph.addEdge({ id: 'e_w', source: 'weaver', target: 'trait.mastery.spell-weaver', type: 'has_trait', properties: {} });
    expect(isCaster(graph, 'weaver')).toBe(true);
  });
});

// ─── use × Power through the resolver ───────────────────────────────

function useCtx(state: GameState, actorId: string, outcome: string, spellId = 'spell_veilwalk'): ObjectVerbContext {
  return {
    state, graph: state.graph, actorId,
    handle: { kind: 'node', nodeId: spellDefinitionNodeId(spellId) },
    tick: state.tick, projectId: `proj_${actorId}_${outcome}`, outcome,
  };
}
const use = (c: ObjectVerbContext) => (POWER.verbs.use as (c: ObjectVerbContext) => { success: boolean; error?: string })(c);

describe('use × Power — the band decides, the effects apply, the price is strain', () => {
  it('success: the caster moves within range 3, is strained, writes no domainCapability, raises spell_cast', () => {
    const { graph, state } = world();
    veilwalker(graph, 'vw');
    // A carried trigger listening for spell_cast — the read-back that the moment is raised.
    graph.addNode({
      id: 'charm_listen', name: 'Listening Charm', type: 'trait',
      properties: { subcategory: 'bestowed', effects: [{ type: 'action_trigger', on: 'spell_cast', payload: { kind: 'resource_delta', resource: 'essence', amount: 1 } }] },
    });
    graph.addEdge({ id: 'e_charm', source: 'vw', target: 'charm_listen', type: 'has_trait', properties: {} });
    graph.getNode('vw')!.properties.essence = 0;

    const before = whereIs(graph, 'vw')!;
    const res = use(useCtx(state, 'vw', 'success'));
    expect(res.success).toBe(true);

    const after = whereIs(graph, 'vw')!;
    expect(after).not.toBe(before);
    const dist = hexDistance(
      { col: graph.getNode(before)!.properties.hexCol as number, row: 0 },
      { col: graph.getNode(after)!.properties.hexCol as number, row: graph.getNode(after)!.properties.hexRow as number },
    );
    expect(dist).toBeLessThanOrEqual(3);
    expect(graph.getOutgoingEdges('vw', 'located_at')).toHaveLength(1);

    expect(graph.getOutgoingEdges('vw', 'has_trait').some(e => e.target === strainConditionId('veil'))).toBe(true);
    expect(graph.getNode('vw')!.properties.domainCapability).toBeUndefined();
    expect(graph.getNode('vw')!.properties.essence).toBe(1);
  });

  it('failure: the caster stays put and the price is still paid', () => {
    const { graph, state } = world();
    veilwalker(graph, 'vw');
    const res = use(useCtx(state, 'vw', 'failure'));
    expect(res.success).toBe(true);
    expect(whereIs(graph, 'vw')).toBe('loc_2');
    expect(graph.getOutgoingEdges('vw', 'has_trait').some(e => e.target === strainConditionId('veil'))).toBe(true);
    expect(graph.getNode('vw')!.properties.domainCapability).toBeUndefined();
  });

  it('a fate-woven spell is never cast', () => {
    const { graph, state } = world();
    addMortal(graph, 'fw', 'loc_0', { npcRole: 'priest' });
    wield(graph, 'fw', 'spell_wayfinding');
    const res = use(useCtx(state, 'fw', 'success', 'spell_wayfinding'));
    expect(res.success).toBe(false);
    expect(res.error).toContain('not_castable');
  });

  it('is deterministic: same seed and inputs, same landing', () => {
    const a = world(); veilwalker(a.graph, 'vw'); use(useCtx(a.state, 'vw', 'success'));
    const b = world(); veilwalker(b.graph, 'vw'); use(useCtx(b.state, 'vw', 'success'));
    expect(whereIs(a.graph, 'vw')).toBe(whereIs(b.graph, 'vw'));
  });
});

// ─── Backlash by band ───────────────────────────────────────────────

describe('backlash by band — the price layer decides which bands may bite', () => {
  const effect: AttachmentEffect = { type: 'passive', reach: 'iron', value: -0.1 };
  const make = (trigger: 'failure' | 'critical_failure' | 'always' | 'overcost') =>
    ({ trigger, probability: 1, severity: 'minor', effect, narrativeTemplate: 'x' } as const);

  it("'always' (gamble) can fire on success, never on critical_success", () => {
    expect(evaluateBacklashForBand(make('always'), 'success', 0).fires).toBe(true);
    expect(evaluateBacklashForBand(make('always'), 'success_at_cost', 0).fires).toBe(true);
    expect(evaluateBacklashForBand(make('always'), 'critical_success', 0).fires).toBe(false);
  });
  it("'failure' (strain) never fires on success, and can on a slip", () => {
    expect(evaluateBacklashForBand(make('failure'), 'success', 0).fires).toBe(false);
    expect(evaluateBacklashForBand(make('failure'), 'near_miss', 0).fires).toBe(true);
    expect(evaluateBacklashForBand(make('failure'), 'failure', 0).fires).toBe(true);
    expect(evaluateBacklashForBand(make('failure'), 'critical_failure', 0).fires).toBe(true);
  });
  it("'critical_failure' (transgression) fires only on disaster", () => {
    expect(evaluateBacklashForBand(make('critical_failure'), 'failure', 0).fires).toBe(false);
    expect(evaluateBacklashForBand(make('critical_failure'), 'critical_failure', 0).fires).toBe(true);
  });
  it("'overcost' reads as 'failure'", () => {
    expect(evaluateBacklashForBand(make('overcost'), 'success', 0).fires).toBe(false);
    expect(evaluateBacklashForBand(make('overcost'), 'failure', 0).fires).toBe(true);
  });
  it('probability is drawn against its own roll', () => {
    const half = { ...make('failure'), probability: 0.5 };
    expect(evaluateBacklashForBand(half, 'failure', 0.49).fires).toBe(true);
    expect(evaluateBacklashForBand(half, 'failure', 0.51).fires).toBe(false);
  });
  it('a resolved cast reports the backlash and traces it on the caster', () => {
    const { graph, state } = world();
    veilwalker(graph, 'vw');
    const always: SpellTemplate = { ...VEILWALK, id: 'spell_veilwalk', backlash: { ...VEILWALK.backlash!, trigger: 'always', probability: 1 } };
    const res = resolveCast(state, { casterId: 'vw', spell: always, band: 'success', tick: 10, site: 'undertaking', siteRef: 'p1' });
    expect(res.landed).toBe(true);
    expect(res.backlash?.effect.type).toBe('forced_move');
  });
});

// ─── Per-caster cooldowns ───────────────────────────────────────────

describe('cooldowns — two casters of one spell hold independent cooldowns', () => {
  it('one caster casting does not put the other on cooldown', () => {
    const { graph, state } = world();
    veilwalker(graph, 'a', 'loc_1');
    veilwalker(graph, 'b', 'loc_3');
    const r1 = resolveCast(state, { casterId: 'a', spell: VEILWALK, band: 'failure', tick: 10, site: 'undertaking', siteRef: 'a1' });
    expect(r1.refused).toBeUndefined();
    const r2 = resolveCast(state, { casterId: 'b', spell: VEILWALK, band: 'failure', tick: 11, site: 'undertaking', siteRef: 'b1' });
    expect(r2.refused).toBeUndefined();
    const r3 = resolveCast(state, { casterId: 'a', spell: VEILWALK, band: 'failure', tick: 12, site: 'undertaking', siteRef: 'a2' });
    expect(r3.refused).toBe('cooldown');
    expect(state.castCooldowns!.get(castCooldownKey('a', 'spell_veilwalk'))).toBe(10);
    expect(state.castCooldowns!.get(castCooldownKey('b', 'spell_veilwalk'))).toBe(11);
    // The shared map every other reader keys by attachment id is untouched.
    expect(state.effectStates!.has('spell_veilwalk')).toBe(false);
  });
});

// ─── dispel ─────────────────────────────────────────────────────────

describe('dispel — lifts a bearing, silences an item, never deletes a node', () => {
  it('a condition two mortals bear is lifted from the target only; the definition survives', () => {
    const { graph, state } = world();
    addMortal(graph, 'healer', 'loc_0');
    addMortal(graph, 'patient', 'loc_0');
    addMortal(graph, 'other', 'loc_1');
    graph.addNode({ id: 'trait.condition.dead_ish', name: 'Deathly', type: 'trait', properties: { subcategory: 'condition', tags: ['#dead'] } });
    graph.addEdge({ id: 'e_p', source: 'patient', target: 'trait.condition.dead_ish', type: 'has_trait', properties: {} });
    graph.addEdge({ id: 'e_o', source: 'other', target: 'trait.condition.dead_ish', type: 'has_trait', properties: {} });

    const exec = executeDispel({ type: 'dispel', target: 'condition', tags: ['dead'] }, { casterId: 'healer', targetId: 'patient', tick: 10, graph });
    expect(exec.mutations.some(m => m.type === 'remove_node')).toBe(false);
    applyExecutionResult(state, exec, 10);

    expect(graph.getOutgoingEdges('patient', 'has_trait')).toHaveLength(0);
    expect(graph.getNode('trait.condition.dead_ish')).toBeDefined();
    expect(graph.getOutgoingEdges('other', 'has_trait').map(e => e.target)).toEqual(['trait.condition.dead_ish']);
  });

  it('a possession is silenced for DISPEL_ITEM_SUPPRESS_TICKS and the owner keeps it', () => {
    const { graph, state } = world();
    addMortal(graph, 'witch', 'loc_0');
    addMortal(graph, 'knight', 'loc_0');
    graph.addNode({ id: 'amulet', name: 'Amulet', type: 'artifact', properties: { tags: ['#ward'], effects: [{ type: 'passive', reach: 'iron', value: 0.1 }] } });
    graph.addEdge({ id: 'e_poss', source: 'knight', target: 'amulet', type: 'possesses', properties: {} });

    const exec = executeDispel({ type: 'dispel', target: 'attachment', tags: ['ward'] }, { casterId: 'witch', targetId: 'knight', tick: 10, graph });
    applyExecutionResult(state, exec, 10);

    expect(graph.getNode('amulet')).toBeDefined();
    expect(graph.getOutgoingEdges('knight', 'possesses').map(e => e.target)).toEqual(['amulet']);
    const st = state.effectStates!.get('amulet')!;
    expect(st.suppressed).toBe(true);
    expect(st.suppressedUntilTick).toBe(10 + 24);
  });
});

// ─── Carried spells ─────────────────────────────────────────────────

describe('carried (fate-woven) spells ride the effect walker, per bearer', () => {
  it("The Wayfinding's reveal and passive reach the wielder", () => {
    const { graph, state } = world();
    addMortal(graph, 'guide', 'loc_0');
    wield(graph, 'guide', 'spell_wayfinding');
    const effects = collectAttachmentEffects(graph, 'guide', state.effectStates);
    expect(effects.some(e => e.effect.type === 'passive' && e.effect.reach === 'stone')).toBe(true);
    expect(getRevealRanges(graph, 'guide', state.effectStates).hexes).toBeGreaterThanOrEqual(2);
  });

  it('a deliberate spell carries nothing onto its node', () => {
    for (const node of allSpellDefinitionNodes()) {
      const spell = getSpellTemplate(String(node.properties.spellTemplateId))!;
      if (spell.agency === 'deliberate') expect(node.properties.effects).toBeUndefined();
    }
  });

  it('a seal on one bearer silences only their carried spell, not every bearer', () => {
    const { graph, state } = world();
    addMortal(graph, 'sealed', 'loc_0');
    addMortal(graph, 'free', 'loc_1');
    wield(graph, 'sealed', 'spell_wayfinding');
    wield(graph, 'free', 'spell_wayfinding');
    graph.addNode({ id: 'seal', name: 'Seal', type: 'trait', properties: { subcategory: 'condition', effects: [{ type: 'suppress', target: 'spell', scope: { scope: 'self' }, ticks: 10 }] } });
    graph.addEdge({ id: 'e_seal', source: 'sealed', target: 'seal', type: 'has_trait', properties: {} });

    const res = applySuppressions(graph, state.effectStates!, 10, ['sealed', 'free']);
    const sealedKey = `has_trait_sealed_${spellDefinitionNodeId('spell_wayfinding')}`;
    const freeKey = `has_trait_free_${spellDefinitionNodeId('spell_wayfinding')}`;
    expect(res.states.get(sealedKey)?.suppressed).toBe(true);
    expect(res.states.get(freeKey)?.suppressed).not.toBe(true);
    expect(res.states.get(spellDefinitionNodeId('spell_wayfinding'))?.suppressed).not.toBe(true);
  });

  it('every shipped carried spell holds only stateless primitives', () => {
    for (const spell of SPELL_TEMPLATES) {
      for (const e of spell.passiveEffects ?? []) {
        expect(isCarriedEffectStateless(e), `${spell.id} carries ${e.type}`).toBe(true);
      }
    }
  });

  it('a stateful carried primitive is refused', () => {
    expect(CARRIED_EFFECT_ALLOWED_TYPES).not.toContain('stacking');
    expect(isCarriedEffectStateless({ type: 'stacking', reach: 'star', valuePerStack: 0.03, maxStacks: 4, stackOn: 'combat_success' })).toBe(false);
    expect(isCarriedEffectStateless({ type: 'action_trigger', on: 'spell_cast', maxFires: 1, payload: { kind: 'trace_only', message: 'x' } })).toBe(false);
    const bad: SpellTemplate = { ...getSpellTemplate('spell_wayfinding')!, passiveEffects: [{ type: 'duration', ticks: 3, reach: 'star', value: 0.1, destroyOnExpiry: true }] };
    expect(carriedEffectsOf(bad)).toBeNull();
  });
});

// ─── Honest vocabulary ──────────────────────────────────────────────

describe("'spell_cast' is a live trigger moment", () => {
  it('the honest vocabulary lists it (read back above: "raises spell_cast")', () => {
    expect(ITEM_HONEST_TRIGGER_EVENTS.has('spell_cast')).toBe(true);
  });
});

// ─── Seeded knowing ─────────────────────────────────────────────────

describe('seeded knowing — every caster starts with one spell', () => {
  it('seeds each caster once, deterministically, from the shelf or the fallback', () => {
    const { graph } = world();
    addMortal(graph, 'priest_b', 'loc_0', { npcRole: CASTER_NPC_ROLES[0] });
    addMortal(graph, 'priest_a', 'loc_1', { npcRole: CASTER_NPC_ROLES[1], sphereAlignment: { primary: 'spirit' } });
    addMortal(graph, 'farmer', 'loc_2', { npcRole: 'farmer' });

    const report = seedSpellKnowing(graph);
    expect(report.casters).toBe(2);
    expect(report.seeded).toBe(2);
    expect(report.fallbackCantrip).toBe(1);

    const wielded = (id: string) => graph.getOutgoingEdges(id, 'has_trait')
      .filter(e => graph.getNode(e.target)?.properties.subcategory === 'spell');
    expect(wielded('priest_a')).toHaveLength(1);
    expect(wielded('priest_b')).toHaveLength(1);
    expect(wielded('farmer')).toHaveLength(0);
    // The spirit priest reads the spirit shelf: lowest tier, then id.
    expect(wielded('priest_a')[0].target).toBe(spellDefinitionNodeId('spell_veilwalk'));
    expect(wielded('priest_a')[0].properties.source).toBe('seeded');
    expect(graph.getOutgoingEdges('priest_a', 'knows_spell')).toHaveLength(1);

    // Idempotent: a second pass writes nothing new.
    seedSpellKnowing(graph);
    expect(wielded('priest_a')).toHaveLength(1);
  });
});
