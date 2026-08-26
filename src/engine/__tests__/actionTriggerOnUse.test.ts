/**
 * On-use trigger behavior — the THR-719 extensions to `action_trigger`.
 *
 * Covers the four things the port added on top of TB-104's primitive:
 * outcome-band event mapping, the probability guard, the item-behavior payload
 * kinds, and narrative substitution. Plus a port-completeness sweep proving the
 * retired `onUseTriggers` content really did land in `effects[]`.
 */

import { describe, it, expect } from 'vitest';
import {
  checkAndFireActionTriggers,
  ladderEventsFor,
  type ActionTriggerContext,
} from '../effects/actionTrigger';
import { applyActionTriggerPayloads } from '../effects/actionTriggerPayloads';
import { WorldGraph } from '../graph';
import type { ActionTriggerEffect, AttachmentEffect, EffectRuntimeState } from '../../types/effects';
import type { GameState } from '../../types/gameState';
import type { AttachedEffect } from '../effects/effectWalker';
import type { GraphNode } from '../../types/graph';
import { STARTER_POSSESSIONS } from '../../data/starter-attachments';
import {
  ANOMALY_SIGNATURE_ARTIFACTS,
  ANOMALY_BESTOWED_POWERS,
  ANOMALY_CONDITIONS,
} from '../../data/anomaly-reward-catalog';

function attached(trigger: ActionTriggerEffect, id = 'att-1', name = 'Test Item'): AttachedEffect {
  return {
    attachmentId: id,
    attachmentName: name,
    attachmentTier: 1,
    effect: trigger,
  } as AttachedEffect;
}

const baseCtx: ActionTriggerContext = {
  agentId: 'agent-1',
  tick: 10,
  agentResources: { essence: 50, quintessence: 80, quintessenceMax: 100, doom: 20, doomThreshold: 100 },
};

function triggersOf(node: GraphNode): ActionTriggerEffect[] {
  const effects = (node.properties as { effects?: AttachmentEffect[] }).effects;
  if (!Array.isArray(effects)) return [];
  return effects.filter((e): e is ActionTriggerEffect => e?.type === 'action_trigger');
}

describe('ladderEventsFor — outcome-band mapping', () => {
  it('maps each band to its own event', () => {
    expect(ladderEventsFor('critical_success')).toContain('encounter_critical_success');
    expect(ladderEventsFor('critical_failure')).toContain('encounter_critical_failure');
    expect(ladderEventsFor('success_at_cost')).toContain('encounter_at_cost');
    expect(ladderEventsFor('near_miss')).toContain('encounter_at_cost');
  });

  it('WIDENS rather than partitions, so pre-band content keeps firing', () => {
    // Everything isStepSuccess() accepted must still raise encounter_success,
    // and everything it rejected must still raise encounter_failure. Narrowing
    // these would silently break shipped items (e.g. Battle Spoils Talisman).
    for (const band of ['critical_success', 'success', 'success_at_cost', 'near_miss'] as const) {
      expect(ladderEventsFor(band)).toContain('encounter_success');
    }
    for (const band of ['failure', 'critical_failure'] as const) {
      expect(ladderEventsFor(band)).toContain('encounter_failure');
    }
  });
});

describe('probability guard', () => {
  const probabilistic: ActionTriggerEffect = {
    type: 'action_trigger',
    on: 'action_complete',
    payload: { kind: 'trace_only', message: 'x' },
    probability: 0.25,
    cooldownTicks: 0,
  };

  it('fires when the seeded roll lands under the probability', () => {
    const r = checkAndFireActionTriggers(
      [attached(probabilistic)],
      'action_complete',
      { ...baseCtx, nextRoll: () => 0.1 },
      new Map<string, EffectRuntimeState>(),
    );
    expect(r.firedCount).toBe(1);
  });

  it('does not fire when the roll lands over the probability', () => {
    const r = checkAndFireActionTriggers(
      [attached(probabilistic)],
      'action_complete',
      { ...baseCtx, nextRoll: () => 0.9 },
      new Map<string, EffectRuntimeState>(),
    );
    expect(r.firedCount).toBe(0);
  });

  it('always fires when probability is omitted', () => {
    const always: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'action_complete',
      payload: { kind: 'trace_only', message: 'x' },
    };
    const r = checkAndFireActionTriggers(
      [attached(always)],
      'action_complete',
      { ...baseCtx, nextRoll: () => 0.99 },
      new Map<string, EffectRuntimeState>(),
    );
    expect(r.firedCount).toBe(1);
  });

  it('does not consume a roll for an ineligible trigger (determinism)', () => {
    // A trigger whose fires are exhausted must not perturb the seeded stream —
    // otherwise cooldown state changes downstream draws for everything else.
    let draws = 0;
    const exhausted: ActionTriggerEffect = { ...probabilistic, maxFires: 1 };
    const states = new Map<string, EffectRuntimeState>([
      ['att-1', { actionTriggerFireCount: 1 }],
    ]);
    checkAndFireActionTriggers(
      [attached(exhausted)],
      'action_complete',
      { ...baseCtx, nextRoll: () => { draws++; return 0.1; } },
      states,
    );
    expect(draws).toBe(0);
  });
});

describe('narrative substitution', () => {
  it('substitutes actor and item tokens', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'action_complete',
      payload: { kind: 'trace_only', message: 'x' },
      narrativeTemplate: "The Eye drinks deep of {actor}'s resolve, says {item_name}.",
    };
    const r = checkAndFireActionTriggers(
      [attached(trigger, 'att-1', 'The Whispering Eye')],
      'action_complete',
      { ...baseCtx, actorName: 'Kael' },
      new Map<string, EffectRuntimeState>(),
    );
    expect(r.narratives).toEqual(["The Eye drinks deep of Kael's resolve, says The Whispering Eye."]);
  });

  it('renders unknown tokens empty rather than leaving raw braces', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'action_complete',
      payload: { kind: 'trace_only', message: 'x' },
      narrativeTemplate: 'At {location}, {actor} strikes {target}.',
    };
    const r = checkAndFireActionTriggers(
      [attached(trigger)],
      'action_complete',
      { ...baseCtx, actorName: 'Kael' },
      new Map<string, EffectRuntimeState>(),
    );
    expect(r.narratives[0]).toBe('At , Kael strikes .');
  });
});

describe('payload application', () => {
  /**
   * THR-1257 changed `applyActionTriggerPayloads` to take `GameState` rather than a
   * bare `WorldGraph`, because the condition payloads now raise `damaged` / `healed`
   * and `raiseEffectEvent` needs the state.
   *
   * These agents carry no `actorType`, so `isPersonCarrier` reads false and no proxy
   * raise fires — which is why every assertion below is unchanged. They exercise the
   * payload mechanics; the raise behaviour is asserted in
   * `conditionProxyEvents.actionTrigger.test.ts`, on person-shaped carriers.
   */
  function graphWithAgent(): { graph: WorldGraph; agentId: string; state: GameState } {
    const graph = new WorldGraph();
    const agentId = 'agent-1';
    graph.addNode({ id: agentId, type: 'actor', name: 'Kael', properties: {} });
    const state = { graph, tick: 3, seed: 42, effectStates: new Map() } as unknown as GameState;
    return { graph, agentId, state };
  }

  it('condition_grant attaches the trait with the decay clock the tick loop reads', () => {
    const { graph, agentId, state } = graphWithAgent();
    graph.addNode({ id: 'cond.x', type: 'trait', name: 'Curse', properties: { tags: ['#curse'] } });

    const res = applyActionTriggerPayloads(state, agentId, [{
      attachmentId: 'att-1',
      attachmentName: 'Item',
      payload: { kind: 'condition_grant', conditionTraitId: 'cond.x', durationTicks: 7 },
    }], 3);

    expect(res.conditionsGranted).toBe(1);
    const edge = graph.getOutgoingEdges(agentId, 'has_trait')[0];
    expect(edge.target).toBe('cond.x');
    expect(edge.properties.ticksRemaining).toBe(7);
  });

  it('condition_grant with null duration is indefinite (no decay clock)', () => {
    const { graph, agentId, state } = graphWithAgent();
    graph.addNode({ id: 'cond.perm', type: 'trait', name: 'Scholar', properties: {} });

    applyActionTriggerPayloads(state, agentId, [{
      attachmentId: 'att-1',
      attachmentName: 'Codex',
      payload: { kind: 'condition_grant', conditionTraitId: 'cond.perm', durationTicks: null },
    }], 3);

    const edge = graph.getOutgoingEdges(agentId, 'has_trait')[0];
    expect(edge.properties.ticksRemaining).toBeUndefined();
  });

  it('condition_grant fails soft when the condition node is missing', () => {
    const { graph, agentId, state } = graphWithAgent();
    const res = applyActionTriggerPayloads(state, agentId, [{
      attachmentId: 'att-1',
      attachmentName: 'Item',
      payload: { kind: 'condition_grant', conditionTraitId: 'cond.nope' },
    }], 3);

    expect(res.conditionsGranted).toBe(0);
    expect(graph.getOutgoingEdges(agentId, 'has_trait')).toHaveLength(0);
  });

  it('condition_remove strips conditions matching a tag', () => {
    const { graph, agentId, state } = graphWithAgent();
    graph.addNode({ id: 'cond.wound', type: 'trait', name: 'Gash', properties: { tags: ['#wound'] } });
    graph.addNode({ id: 'cond.bless', type: 'trait', name: 'Blessed', properties: { tags: ['#blessing'] } });
    graph.addEdge({ id: 'e1', source: agentId, target: 'cond.wound', type: 'has_trait', properties: {} });
    graph.addEdge({ id: 'e2', source: agentId, target: 'cond.bless', type: 'has_trait', properties: {} });

    const res = applyActionTriggerPayloads(state, agentId, [{
      attachmentId: 'att-1',
      attachmentName: 'Phial',
      payload: { kind: 'condition_remove', tags: ['#wound'] },
    }], 3);

    expect(res.conditionsRemoved).toBe(1);
    const remaining = graph.getOutgoingEdges(agentId, 'has_trait');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].target).toBe('cond.bless');
  });

  it('self_remove destroys the possession and its edges', () => {
    const { graph, agentId, state } = graphWithAgent();
    graph.addNode({ id: 'att-1', type: 'artifact', name: 'Iron Blade', properties: {} });
    graph.addEdge({ id: 'p1', source: agentId, target: 'att-1', type: 'possesses', properties: {} });

    const res = applyActionTriggerPayloads(state, agentId, [{
      attachmentId: 'att-1',
      attachmentName: 'Iron Blade',
      payload: { kind: 'self_remove' },
    }], 3);

    expect(res.possessionsRemoved).toEqual(['att-1']);
    expect(graph.getNode('att-1')).toBeUndefined();
    expect(graph.getOutgoingEdges(agentId, 'possesses')).toHaveLength(0);
  });

  it('one failing payload does not stop the others (fail-soft)', () => {
    const { graph, agentId, state } = graphWithAgent();
    graph.addNode({ id: 'cond.ok', type: 'trait', name: 'Fine', properties: {} });

    const res = applyActionTriggerPayloads(state, agentId, [
      { attachmentId: 'a', attachmentName: 'A', payload: { kind: 'condition_grant', conditionTraitId: 'cond.missing' } },
      { attachmentId: 'b', attachmentName: 'B', payload: { kind: 'condition_grant', conditionTraitId: 'cond.ok' } },
    ], 3);

    expect(res.conditionsGranted).toBe(1);
  });
});

describe('port completeness (THR-719)', () => {
  const catalogs: Array<[string, GraphNode[]]> = [
    ['starter', STARTER_POSSESSIONS],
    ['anomaly', ANOMALY_SIGNATURE_ARTIFACTS],
    ['anomaly-powers', ANOMALY_BESTOWED_POWERS],
    ['anomaly-conditions', ANOMALY_CONDITIONS],
  ];

  it('every ported trigger names a payload kind the applier handles', () => {
    const handled = new Set([
      'resource_delta', 'content_grant', 'trace_only',
      'condition_grant', 'condition_remove', 'self_remove',
    ]);
    for (const [, nodes] of catalogs) {
      for (const node of nodes) {
        for (const t of triggersOf(node)) {
          expect(handled.has(t.payload.kind)).toBe(true);
        }
      }
    }
  });

  it('every condition_grant references a condition node that exists somewhere in the catalogs', async () => {
    // A grant pointing at a missing node fails soft at runtime — which means it
    // silently does nothing, the exact failure this ticket exists to end.
    const knownIds = new Set<string>();
    for (const mod of [
      await import('../../data/starter-attachments'),
      await import('../../data/anomaly-reward-catalog'),
    ]) {
      for (const value of Object.values(mod)) {
        if (Array.isArray(value)) {
          for (const n of value as GraphNode[]) if (n?.id) knownIds.add(n.id);
        }
      }
    }

    for (const [, nodes] of catalogs) {
      for (const node of nodes) {
        for (const t of triggersOf(node)) {
          if (t.payload.kind === 'condition_grant') {
            expect(knownIds.has(t.payload.conditionTraitId)).toBe(true);
          }
        }
      }
    }
  });

  it('ported the full set of nine authored on-use triggers', () => {
    const total = catalogs.reduce(
      (n, [, nodes]) => n + nodes.reduce((m, node) => m + triggersOf(node).length, 0),
      0,
    );
    expect(total).toBe(9);
  });
});
