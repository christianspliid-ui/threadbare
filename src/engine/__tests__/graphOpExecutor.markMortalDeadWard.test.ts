/**
 * `mark_mortal_dead` honours the "will not die" ward (THR-1534).
 *
 * The op's doc comment promised "a warded target is `success: true` with nothing
 * written" from THR-1430 on, but `GraphOpContext` carried no state, so the ward could
 * never be read and a commissioned killing always landed. The context now carries an
 * optional `overrideCtx`, which every production builder holding `GameState` fills.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import type { GraphOpContext, GraphOp } from '../../types/graphOp';
import type { GameState } from '../../types/gameState';
import type { EffectRuntimeState } from '../../types/effects';

const killerId = 'agent.killer';
const targetId = 'agent.target';

function makeGraph(warded: boolean): WorldGraph {
  resetOpCounter();
  const graph = new WorldGraph();
  graph.addNode({ id: killerId, type: 'actor', name: 'Killer', properties: { actorType: 'individual' } });
  graph.addNode({ id: targetId, type: 'actor', name: 'Target', properties: { actorType: 'individual' } });
  if (warded) {
    graph.addNode({
      id: 'charm.target', type: 'artifact', name: 'Charm',
      properties: {
        effects: [{
          type: 'modify_rules', rule: 'death_prevented', value: true,
          scope: { scope: 'self' }, ticks: 'permanent',
        }],
      },
    });
    graph.addEdge({ id: 'e.target.has', type: 'possesses', source: targetId, target: 'charm.target', properties: {} });
  }
  return graph;
}

function ctxFor(graph: WorldGraph, withOverride: boolean): GraphOpContext {
  const state = {
    graph, tick: 42, seed: 42, effectStates: new Map<string, EffectRuntimeState>(),
  } as unknown as GameState;
  return {
    actorId: killerId,
    targetId,
    locationId: targetId,
    tick: 42,
    ...(withOverride
      ? { overrideCtx: { graph, effectStates: state.effectStates, persisted: state, tick: 42 } }
      : {}),
  };
}

const KILL: GraphOp = { op: 'mark_mortal_dead', nodeId: '$target' } as GraphOp;

describe('mark_mortal_dead × the ward (THR-1534)', () => {
  it('a warded target: success, and no `deceased` written', () => {
    const graph = makeGraph(true);
    const result = executeGraphOps(graph, [KILL], ctxFor(graph, true));

    expect(result.results[0].success).toBe(true);
    expect(graph.getNode(targetId)!.properties.deceased).toBeUndefined();
  });

  it('an unwarded target still dies (regression)', () => {
    const graph = makeGraph(false);
    const result = executeGraphOps(graph, [KILL], ctxFor(graph, true));

    expect(result.results[0].success).toBe(true);
    const node = graph.getNode(targetId)!;
    expect(node.properties.deceased).toBe(true);
    expect(node.properties.slainBy).toBe(killerId);
  });

  it('with no override context the op behaves as before — fail-soft, the ward unread', () => {
    const graph = makeGraph(true);
    executeGraphOps(graph, [KILL], ctxFor(graph, false));

    expect(graph.getNode(targetId)!.properties.deceased).toBe(true);
  });
});
