/**
 * Overlay / rule-override persistence — the results nobody kept (THR-1240).
 *
 * `executeAlterTerrain` and `executeModifyRules` have always returned
 * `success: true` with a populated `terrainOverlays` / `ruleOverrides` field.
 * Every consumer read `.mutations` — which both executors leave empty — applied
 * nothing, and dropped the other two fields. The primitives were not broken;
 * their output had nowhere to go, and the `success: true` made the loss silent.
 *
 * These tests drive the **real executors** rather than hand-built overlay
 * literals. A fixture that constructs its own `ActiveTerrainOverlay` and then
 * asserts the store kept it verifies only that the store keeps what it is given
 * — it would pass identically against the broken build, because the break was
 * never in the store. Going through `executeEffect` is what makes the assertion
 * about the wiring instead of about the fixture.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  applyExecutionOverlays,
  expireOverlays,
  getTerrainOverlaysAt,
  hasTerrainOverlay,
  getPersistedRuleOverride,
  foldRuleOverrideValues,
  neutralRuleOverrideValue,
} from '../effectOverlayStore';
import { getActiveRuleOverride } from '../effectQueries';
import { raiseEffectEvent } from '../effectEventDispatch';
import { executeEffect } from '../../effectExecutors';
import { WorldGraph } from '../../graph';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../../traceBuffer';
import { RULE_OVERRIDE_VALUE_CAP, OVERLAY_DEFAULT_DURATION_TICKS } from '../../../data/effect-constants';
import type { GameState } from '../../../types/gameState';
import type { AttachmentEffect, EffectRuntimeState } from '../../../types/effects';

/**
 * Narrows a real `GameState` to the members the store reads and writes:
 * `graph`, `tick`, `activeTerrainOverlays`, `activeRuleOverrides`, and the two
 * dirty flags. Every one is a genuine field — the cast narrows, it does not
 * invent (the `fixture_cast_hides_invented_values` trap).
 */
function makeState(graph: WorldGraph, tick = 10): GameState {
  return {
    graph,
    tick,
    seed: 42,
    effectStates: new Map<string, EffectRuntimeState>(),
  } as unknown as GameState;
}

function addAgentOnHex(graph: WorldGraph, agentId: string, col: number, row: number) {
  graph.addNode({ id: agentId, type: 'actor', name: 'Caster', properties: { actorType: 'individual' } });
  graph.addNode({
    id: `loc.${agentId}`, type: 'location', name: 'Standing Stone',
    properties: { hexCol: col, hexRow: row },
  });
  graph.addEdge({ id: `e.${agentId}.at`, type: 'located_at', source: agentId, target: `loc.${agentId}`, properties: {} });
}

beforeEach(() => { enableTracing(); clearTraces(); });
afterEach(() => { disableTracing(); clearTraces(); });

describe('alter_terrain — the executor result reaches GameState', () => {
  it('persists a real executor overlay onto the hex it names', () => {
    const graph = new WorldGraph();
    addAgentOnHex(graph, 'a1', 7, 3);
    const state = makeState(graph, 10);

    const exec = executeEffect(
      { type: 'alter_terrain', target: 'self_hex', terrainEffect: 'blighted', ticks: 6 } as AttachmentEffect,
      { casterId: 'a1', tick: 10, graph },
    );

    // The half that proves the break was real: the executor succeeds and
    // produces the overlay, while `mutations` — the only field the old
    // consumers read — is empty. A consumer looping mutations sees nothing.
    expect(exec.success).toBe(true);
    expect(exec.mutations).toHaveLength(0);
    expect(exec.terrainOverlays).toHaveLength(1);

    applyExecutionOverlays(state, exec.terrainOverlays, exec.ruleOverrides, 10);

    expect(hasTerrainOverlay(state, 7, 3, 'blighted')).toBe(true);
    expect(getTerrainOverlaysAt(state, 7, 3)[0].expiryTick).toBe(16);
    // Nothing bled onto a neighbouring hex.
    expect(getTerrainOverlaysAt(state, 7, 4)).toHaveLength(0);
  });

  it('marks the change structural — terrain feeds the distance matrix', () => {
    const graph = new WorldGraph();
    addAgentOnHex(graph, 'a1', 1, 1);
    const state = makeState(graph);
    const exec = executeEffect(
      { type: 'alter_terrain', target: 'self_hex', terrainEffect: 'frozen', ticks: 4 } as AttachmentEffect,
      { casterId: 'a1', tick: 10, graph },
    );

    const delta = applyExecutionOverlays(state, exec.terrainOverlays, exec.ruleOverrides, 10);

    expect(delta).toEqual({ changed: true, structural: true });
    expect(state.overlayStateDirty).toBe(true);
    expect(state.overlayStateStructural).toBe(true);
  });

  it('emits an effect.overlay_applied trace naming the hex and the overlay', () => {
    const graph = new WorldGraph();
    addAgentOnHex(graph, 'a1', 2, 5);
    const state = makeState(graph);
    const exec = executeEffect(
      { type: 'alter_terrain', target: 'self_hex', terrainEffect: 'hallowed', ticks: 3 } as AttachmentEffect,
      { casterId: 'a1', tick: 10, graph },
    );

    applyExecutionOverlays(state, exec.terrainOverlays, exec.ruleOverrides, 10);

    const applied = getTraces().filter(t => t.category === 'effect.overlay_applied');
    expect(applied).toHaveLength(1);
    expect(applied[0]).toMatchObject({ kind: 'terrain', key: '2,5', overlay: 'hallowed', ticksRemaining: 3 });
  });
});

describe('modify_rules — the executor result reaches GameState', () => {
  it('persists a real executor override onto its bearer', () => {
    const graph = new WorldGraph();
    addAgentOnHex(graph, 'a1', 0, 0);
    const state = makeState(graph);

    const exec = executeEffect(
      {
        type: 'modify_rules', rule: 'movement_cost_multiplier',
        value: 0.5, scope: { scope: 'self' }, ticks: 8,
      } as AttachmentEffect,
      { casterId: 'a1', tick: 10, graph },
    );

    expect(exec.mutations).toHaveLength(0);
    expect(exec.ruleOverrides).toHaveLength(1);

    applyExecutionOverlays(state, exec.terrainOverlays, exec.ruleOverrides, 10);

    expect(getPersistedRuleOverride(state, 'a1', 'movement_cost_multiplier')).toBe(0.5);
    // A different agent is unaffected — overrides are agent-keyed, not global.
    expect(getPersistedRuleOverride(state, 'a2', 'movement_cost_multiplier')).toBe(1.0);
  });

  it('defaults an unspecified duration rather than treating it as permanent', () => {
    const state = makeState(new WorldGraph(), 10);
    applyExecutionOverlays(state, undefined, [{
      sourceAttachmentId: 'att', sourceAgentId: 'a1', rule: 'healing_multiplier',
      value: 2, scope: { scope: 'self' },
      // The case under test: absent, not null. `null` means explicit permanence.
      expiryTick: undefined as unknown as null, establishedTick: 10,
    }], 10);

    expect(state.activeRuleOverrides!['a1'][0].expiryTick).toBe(10 + OVERLAY_DEFAULT_DURATION_TICKS);
  });

  it('keeps an explicitly permanent override permanent', () => {
    const state = makeState(new WorldGraph(), 10);
    applyExecutionOverlays(state, undefined, [{
      sourceAttachmentId: 'att', sourceAgentId: 'a1', rule: 'death_prevented',
      value: true, scope: { scope: 'self' }, expiryTick: null, establishedTick: 10,
    }], 10);

    expect(state.activeRuleOverrides!['a1'][0].expiryTick).toBeNull();
  });
});

describe('stacking fold — one semantic per key family', () => {
  it('multiplies multiplier keys and sums bonus keys', () => {
    // Inside the clamp band, so this is the fold itself and not the cap.
    expect(foldRuleOverrideValues('cooldown_multiplier', [0.5, 1.5])).toBe(0.75);
    expect(foldRuleOverrideValues('awareness_range_bonus', [1, 2, 3])).toBe(6);
  });

  it('boolean-ORs a flag key — one source granting is enough', () => {
    expect(foldRuleOverrideValues('death_prevented', [false, true])).toBe(true);
    expect(foldRuleOverrideValues('death_prevented', [false, false])).toBe(false);
  });

  it('returns the key family neutral when nothing is in force', () => {
    expect(neutralRuleOverrideValue('spawn_rate_multiplier')).toBe(1.0);
    expect(neutralRuleOverrideValue('reward_tier_bonus')).toBe(0);
    expect(neutralRuleOverrideValue('death_prevented')).toBe(false);
    expect(foldRuleOverrideValues('spawn_rate_multiplier', [])).toBe(1.0);
  });

  it('clamps runaway multiplicative stacking in both directions', () => {
    // Upward: five 2× overrides would reach 32× unclamped.
    expect(foldRuleOverrideValues('doom_rate_multiplier', [2, 2, 2, 2, 2]))
      .toBe(RULE_OVERRIDE_VALUE_CAP);
    // Downward is the dangerous one — an unclamped 0.0001× movement multiplier
    // does not slow the system it gates, it stops it.
    expect(foldRuleOverrideValues('movement_cost_multiplier', [0.1, 0.1, 0.1]))
      .toBeCloseTo(1 / RULE_OVERRIDE_VALUE_CAP, 10);
  });

  it('takes first-wins for a string key, which has no meaningful composition', () => {
    expect(foldRuleOverrideValues('encounter_reach_override', ['iron', 'shadow'])).toBe('iron');
  });
});

describe('expiry', () => {
  it('lifts an overlay on the tick it expires and leaves a live one alone', () => {
    const state = makeState(new WorldGraph(), 10);
    applyExecutionOverlays(state, [
      { sourceAttachmentId: 'a', sourceAgentId: 'a1', terrainEffect: 'blighted', hexCol: 1, hexRow: 1, expiryTick: 12, establishedTick: 10 },
      { sourceAttachmentId: 'b', sourceAgentId: 'a1', terrainEffect: 'frozen', hexCol: 2, hexRow: 2, expiryTick: 30, establishedTick: 10 },
    ], undefined, 10);

    const delta = expireOverlays(state, 12);

    expect(delta.changed).toBe(true);
    expect(getTerrainOverlaysAt(state, 1, 1)).toHaveLength(0);
    expect(getTerrainOverlaysAt(state, 2, 2)).toHaveLength(1);
    // The emptied key is dropped, not left as a `[]` bucket that accumulates
    // for the rest of the run.
    expect(Object.keys(state.activeTerrainOverlays!)).toEqual(['2,2']);
  });

  it('never expires a permanent entry', () => {
    const state = makeState(new WorldGraph(), 10);
    applyExecutionOverlays(state, [
      { sourceAttachmentId: 'a', sourceAgentId: 'a1', terrainEffect: 'sacred_ground', hexCol: 4, hexRow: 4, expiryTick: null, establishedTick: 10 },
    ], undefined, 10);

    expireOverlays(state, 9999);

    expect(hasTerrainOverlay(state, 4, 4, 'sacred_ground')).toBe(true);
  });

  it('emits an effect.overlay_expired trace when one lifts', () => {
    const state = makeState(new WorldGraph(), 10);
    applyExecutionOverlays(state, undefined, [{
      sourceAttachmentId: 'att', sourceAgentId: 'a1', rule: 'healing_multiplier',
      value: 2, scope: { scope: 'self' }, expiryTick: 11, establishedTick: 10,
    }], 10);
    clearTraces();

    expireOverlays(state, 11);

    const expired = getTraces().filter(t => t.category === 'effect.overlay_expired');
    expect(expired).toHaveLength(1);
    expect(expired[0]).toMatchObject({ kind: 'rule', key: 'a1', overlay: 'healing_multiplier', ticksRemaining: 0 });
    // And the value is back to its family's neutral — 1.0 for a multiplier, so
    // the quantity it scales passes through untouched rather than to zero.
    expect(getPersistedRuleOverride(state, 'a1', 'healing_multiplier')).toBe(1.0);
  });

  it('is a no-op with no allocation churn when nothing is stored', () => {
    const state = makeState(new WorldGraph(), 10);
    expect(expireOverlays(state, 50)).toEqual({ changed: false, structural: false });
    expect(state.activeTerrainOverlays).toBeUndefined();
  });
});

describe('fail-soft', () => {
  it('drops an overlay with unresolvable coords and traces the drop rather than swallowing it', () => {
    const state = makeState(new WorldGraph(), 10);

    const delta = applyExecutionOverlays(state, [{
      sourceAttachmentId: 'att', sourceAgentId: 'a1', terrainEffect: 'cursed_ground',
      hexCol: NaN, hexRow: 3, expiryTick: 20, establishedTick: 10,
    }], undefined, 10);

    expect(delta.changed).toBe(false);
    expect(state.activeTerrainOverlays).toBeUndefined();
    // Visible, not silent — a silently dropped overlay is the exact failure
    // this stage exists to end.
    const dropped = getTraces().filter(t => t.category === 'effect.overlay_expired');
    expect(dropped).toHaveLength(1);
    expect(dropped[0]).toMatchObject({ key: 'unresolved-hex', ticksRemaining: 0 });
  });

  it('skips an override with no bearer instead of keying the store on undefined', () => {
    const state = makeState(new WorldGraph(), 10);
    applyExecutionOverlays(state, undefined, [{
      sourceAttachmentId: 'att', sourceAgentId: '', rule: 'healing_multiplier',
      value: 2, scope: { scope: 'self' }, expiryTick: 20, establishedTick: 10,
    }], 10);

    expect(Object.keys(state.activeRuleOverrides ?? {})).toHaveLength(0);
  });
});

describe('end-to-end — a raised event persists what its reactive produced', () => {
  /**
   * The whole point of the stage, in one test. Before it, this exact path ran to
   * completion — the event raised, the reactive matched, `executeAlterTerrain`
   * returned `success: true` — and the world was unchanged, because
   * `raiseEffectEvent` applied `.mutations` (empty) and dropped the overlay.
   */
  it('an entered_hex reactive that alters terrain leaves the overlay on the hex', () => {
    const graph = new WorldGraph();
    addAgentOnHex(graph, 'a1', 9, 9);
    graph.addNode({
      id: 'ward', type: 'artifact', name: 'Blight Ward',
      properties: {
        effects: [{
          type: 'reactive', trigger: 'entered_hex', cooldown: 0,
          effect: { type: 'alter_terrain', target: 'self_hex', terrainEffect: 'blighted', ticks: 5 },
        }],
      },
    });
    graph.addEdge({ id: 'e.ward', type: 'possesses', source: 'a1', target: 'ward', properties: {} });
    const state = makeState(graph, 10);

    const { reactivesFired } = raiseEffectEvent(
      state, 'a1',
      { type: 'entered_hex', hex: { col: 9, row: 9 } },
      { site: 'movement_arrival', rng: () => 0.5 },
    );

    expect(reactivesFired).toBe(1);
    // The assertion the old build failed: the reactive fired AND the world kept it.
    expect(hasTerrainOverlay(state, 9, 9, 'blighted')).toBe(true);
    expect(state.overlayStateDirty).toBe(true);
  });

  it('expires that same overlay on schedule through the tick pass', () => {
    const graph = new WorldGraph();
    addAgentOnHex(graph, 'a1', 9, 9);
    graph.addNode({
      id: 'ward', type: 'artifact', name: 'Blight Ward',
      properties: {
        effects: [{
          type: 'reactive', trigger: 'entered_hex', cooldown: 0,
          effect: { type: 'alter_terrain', target: 'self_hex', terrainEffect: 'blighted', ticks: 5 },
        }],
      },
    });
    graph.addEdge({ id: 'e.ward', type: 'possesses', source: 'a1', target: 'ward', properties: {} });
    const state = makeState(graph, 10);

    raiseEffectEvent(
      state, 'a1',
      { type: 'entered_hex', hex: { col: 9, row: 9 } },
      { site: 'movement_arrival', rng: () => 0.5 },
    );

    expireOverlays(state, 14);
    expect(hasTerrainOverlay(state, 9, 9, 'blighted')).toBe(true);

    expireOverlays(state, 15);
    expect(hasTerrainOverlay(state, 9, 9, 'blighted')).toBe(false);
  });
});

describe('getActiveRuleOverride — one read path for both sources', () => {
  it('folds an attachment-declared override and a persisted one together', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a1', type: 'actor', name: 'Bearer', properties: { actorType: 'individual' } });
    graph.addNode({
      id: 'charm', type: 'artifact', name: 'Charm',
      properties: { effects: [{ type: 'modify_rules', rule: 'reward_tier_bonus', value: 2, scope: { scope: 'self' }, ticks: 'permanent' }] },
    });
    graph.addEdge({ id: 'e1', type: 'possesses', source: 'a1', target: 'charm', properties: {} });
    const state = makeState(graph);

    applyExecutionOverlays(state, undefined, [{
      sourceAttachmentId: 'spell', sourceAgentId: 'a1', rule: 'reward_tier_bonus',
      value: 3, scope: { scope: 'self' }, expiryTick: 20, establishedTick: 10,
    }], 10);

    // Attachment only — the historical call shape, unchanged.
    expect(getActiveRuleOverride(graph, 'a1', 'reward_tier_bonus')).toBe(2);
    // Both sources, folded once.
    expect(getActiveRuleOverride(graph, 'a1', 'reward_tier_bonus', undefined, state)).toBe(5);
  });

  it('returns the multiplier neutral 1.0, not 0, when nothing is in force', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a1', type: 'actor', name: 'Bearer', properties: { actorType: 'individual' } });

    // The old implementation returned 0 here, which as a *multiplier* means
    // "annihilate the quantity" — the opposite of "no override active".
    expect(getActiveRuleOverride(graph, 'a1', 'cooldown_multiplier')).toBe(1.0);
    expect(getActiveRuleOverride(graph, 'a1', 'encounter_difficulty_modifier')).toBe(0);
  });
});
