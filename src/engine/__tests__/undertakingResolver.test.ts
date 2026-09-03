/**
 * The one resolver (THR-1392 slice 1): a verb on an object dispatches to the semantic
 * its type declared, picks the control variant from ownership, names the object on
 * `strategic_world_change`, and refuses — never throws — when nothing can run.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import { resolveUndertakingCompletion, readObjectTier } from '../undertakingResolver';
import { getUndertakingObjectType } from '../../data/undertaking-objects';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import { RUINED_SETTLEMENT_PROSPERITY_FLOOR } from '../../data/strategic-action-constants';

const ME = 'actor_me';
const RIVAL = 'actor_rival';
const SUBJECT = 'actor_subject';

function world(): WorldGraph {
  const g = new WorldGraph();
  for (const id of [ME, RIVAL, SUBJECT]) g.addNode({ id, name: id, type: 'actor', properties: { actorType: 'individual' } });
  g.addNode({ id: 'town', name: 'Millbrook', type: 'location', properties: { locationSubtype: 'town', hexCol: 3, hexRow: 3, prosperity: 0.6 } });
  g.addNode({ id: 'shop', name: 'Shop', type: 'location', properties: { parentLocationId: 'town', sublocationTypeId: 'sublocation-type.workshop' } });
  g.addNode({ id: 'mill', name: 'Mill', type: 'location', properties: { parentLocationId: 'town', sublocationTypeId: 'sublocation-type.granary' } });
  g.addNode({ id: 'chart', name: 'Chart', type: 'artifact', properties: { tier: 1 } });
  g.addEdge({ id: 'p_chart', source: RIVAL, target: 'chart', type: 'possesses', properties: { active: true } });
  g.addEdge({ id: 'owns_mill', source: RIVAL, target: 'mill', type: 'owns', properties: { acquiredTick: 0, via: 'grant' } });
  g.addEdge({ id: 'mark', source: RIVAL, target: SUBJECT, type: 'knows_secret_of', properties: { magnitude: 0.5, revealed: false, secretType: 'affair', discoveredTick: 0, source: 'observed' } });
  g.addEdge({ id: 'located', source: ME, target: 'town', type: 'located_at', properties: {} });
  return g;
}

const stateOf = (graph: WorldGraph): GameState => ({ graph, tick: 10 } as unknown as GameState);

describe('resolveUndertakingCompletion', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });

  it('undo × mark exposes the mark and names the edge on the world-change trace', () => {
    const g = world();
    const r = resolveUndertakingCompletion({
      state: stateOf(g), graph: g, actorId: ME, verb: 'undo', objectTypeId: 'mark',
      handle: { kind: 'edge', edgeId: 'mark' }, tick: 10, projectId: 'proj_1',
    });
    expect(r.variant).toBe('undo');
    expect(r.ops).toEqual([{ success: true, op: 'expose_mark' }]);
    expect(g.getEdge('mark')?.properties.revealed).toBe(true);
    const trace = getTraces().find(t => t.category === 'strategic_world_change') as Record<string, unknown> | undefined;
    expect(trace).toMatchObject({ actorId: ME, verb: 'destroy', undertakingVerb: 'undo', objectTypeId: 'mark', objectId: 'mark', projectId: 'proj_1' });
  });

  it('control picks claim on the unheld room and seize on the rival\'s, and refuses on one\'s own', () => {
    const g = world();
    const claim = resolveUndertakingCompletion({
      state: stateOf(g), graph: g, actorId: ME, verb: 'control', objectTypeId: 'room',
      handle: { kind: 'node', nodeId: 'shop' }, tick: 10,
    });
    expect(claim.variant).toBe('control:claim');
    expect(claim.ops[0].success).toBe(true);
    expect(g.getIncomingEdges('shop', 'owns').map(e => e.source)).toEqual([ME]);

    const seize = resolveUndertakingCompletion({
      state: stateOf(g), graph: g, actorId: ME, verb: 'control', objectTypeId: 'room',
      handle: { kind: 'node', nodeId: 'mill' }, tick: 11,
    });
    expect(seize.variant).toBe('control:seize');
    expect(seize.ops[0].success).toBe(true);
    expect(g.getIncomingEdges('mill', 'owns').map(e => e.source)).toEqual([ME]);

    const own = resolveUndertakingCompletion({
      state: stateOf(g), graph: g, actorId: ME, verb: 'control', objectTypeId: 'room',
      handle: { kind: 'node', nodeId: 'shop' }, tick: 12,
    });
    expect(own.refused).toBe('not_applicable');
    expect(own.ops[0].success).toBe(false);
  });

  it('undo × attachment removes the attachment and its bearer edge', () => {
    const g = world();
    const r = resolveUndertakingCompletion({
      state: stateOf(g), graph: g, actorId: ME, verb: 'undo', objectTypeId: 'attachment',
      handle: { kind: 'node', nodeId: 'chart' }, tick: 10,
    });
    expect(r.ops).toEqual([{ success: true, op: 'destroy_attachment' }]);
    expect(g.getNode('chart')).toBeUndefined();
    expect(g.getOutgoingEdges(RIVAL, 'possesses')).toHaveLength(0);
  });

  it('control:seize × attachment moves the possesses edge to the actor', () => {
    const g = world();
    const r = resolveUndertakingCompletion({
      state: stateOf(g), graph: g, actorId: ME, verb: 'control', objectTypeId: 'attachment',
      handle: { kind: 'node', nodeId: 'chart' }, tick: 10,
    });
    expect(r.variant).toBe('control:seize');
    expect(g.getIncomingEdges('chart', 'possesses').map(e => e.source)).toEqual([ME]);
  });

  it('undo × settlement ruins the place: prosperity floored, subtype ruins, nothing deleted', () => {
    const g = world();
    const r = resolveUndertakingCompletion({
      state: stateOf(g), graph: g, actorId: ME, verb: 'undo', objectTypeId: 'settlement',
      handle: { kind: 'node', nodeId: 'town' }, tick: 10,
    });
    expect(r.ops[0]).toMatchObject({ success: true, op: 'ruin_settlement' });
    const town = g.getNode('town')!;
    expect(town.properties.locationSubtype).toBe('ruins');
    expect(town.properties.ruinedFromSubtype).toBe('town');
    expect(town.properties.prosperity).toBe(RUINED_SETTLEMENT_PROSPERITY_FLOOR);
  });

  it('an undeclared semantic refuses and traces the cell as unreachable', () => {
    const g = world();
    const r = resolveUndertakingCompletion({
      state: stateOf(g), graph: g, actorId: ME, verb: 'survey', objectTypeId: 'room',
      handle: { kind: 'node', nodeId: 'shop' }, tick: 10,
    });
    expect(r.refused).toBe('no_semantic_declared');
    expect(r.ops[0]).toMatchObject({ success: false, error: 'no_semantic_declared:room.survey' });
    expect(getTraces().find(t => t.category === 'undertaking_cell_unreachable')).toMatchObject({
      verb: 'survey', objectTypeId: 'room', reason: 'no_semantic_declared',
    });
    expect(getTraces().find(t => t.category === 'strategic_world_change')).toBeUndefined();
  });

  it('a sustained mode and a vanished object each refuse without running anything', () => {
    const g = world();
    const sustained = resolveUndertakingCompletion({
      state: stateOf(g), graph: g, actorId: ME, verb: 'control', objectTypeId: 'settlement',
      handle: { kind: 'node', nodeId: 'town' }, tick: 10,
    });
    expect(sustained.variant).toBe('control:claim');
    expect(sustained.refused).toBe('sustained_mode');

    const gone = resolveUndertakingCompletion({
      state: stateOf(g), graph: g, actorId: ME, verb: 'undo', objectTypeId: 'attachment',
      handle: { kind: 'node', nodeId: 'no_such_chart' }, tick: 10,
    });
    expect(gone.refused).toBe('object_gone');
    expect(g.getNode('town')?.properties.locationSubtype).toBe('town');
  });

  it('readObjectTier traces a defaulted tier and stays silent on a read one', () => {
    const g = world();
    g.addNode({ id: 'trinket', name: 'Trinket', type: 'artifact', properties: {} });
    const attachment = getUndertakingObjectType('attachment')!;
    expect(readObjectTier(g, attachment, { kind: 'node', nodeId: 'chart' }, 10)).toBe(1);
    expect(getTraces().filter(t => t.category === 'undertaking_tier_defaulted')).toHaveLength(0);
    expect(readObjectTier(g, attachment, { kind: 'node', nodeId: 'trinket' }, 10)).toBe(2);
    expect(getTraces().find(t => t.category === 'undertaking_tier_defaulted')).toMatchObject({ objectTypeId: 'attachment', objectId: 'trinket', tier: 2 });
  });
});
