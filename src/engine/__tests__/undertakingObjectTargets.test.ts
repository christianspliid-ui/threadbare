/**
 * The motive gate over object handles (THR-1392 slice 1, the plan's named test).
 *
 * Before this slice `resolveTargetOwners` walked `controls`, `commanded_by` and `owns`,
 * so an attachment (held by `possesses`) and a mark (an edge) had no owner and every
 * `undo` against one was refused as unowned — by construction, whatever the quarrel.
 * Both must now pass the gate against a rival holder, and be refused against oneself:
 * the gate is the counter-play's licence, and a self-spend is a use, not a counter.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { evaluateMotiveGate, resolveTargetOwners } from '../undertakingMotive';
import { ownershipOf, ownershipSatisfies, resolveVerbVariant } from '../undertakingResolver';
import { getUndertakingObjectType } from '../../data/undertaking-objects';
import type { StrategicActionTemplate, UndertakingObjectTypeId } from '../../types/strategicAction';

const ME = 'actor_me';
const RIVAL = 'actor_rival';
const STRANGER = 'actor_stranger';

function world(): WorldGraph {
  const g = new WorldGraph();
  for (const id of [ME, RIVAL, STRANGER]) {
    g.addNode({ id, name: id, type: 'actor', properties: { actorType: 'individual' } });
  }
  g.addNode({ id: 'chart_rival', name: 'Rival chart', type: 'artifact', properties: { tier: 1 } });
  g.addNode({ id: 'chart_mine', name: 'My chart', type: 'artifact', properties: { tier: 1 } });
  g.addEdge({ id: 'p_rival', source: RIVAL, target: 'chart_rival', type: 'possesses', properties: { active: true } });
  g.addEdge({ id: 'p_mine', source: ME, target: 'chart_mine', type: 'possesses', properties: { active: true } });
  g.addEdge({ id: 'mark_rival', source: RIVAL, target: STRANGER, type: 'knows_secret_of', properties: { magnitude: 0.5, revealed: false, secretType: 'affair', discoveredTick: 0, source: 'observed' } });
  g.addEdge({ id: 'mark_mine', source: ME, target: STRANGER, type: 'knows_secret_of', properties: { magnitude: 0.5, revealed: false, secretType: 'affair', discoveredTick: 0, source: 'observed' } });
  // The quarrel: a standing rivalry from me toward the rival, and nothing else.
  g.addEdge({ id: 'h', source: ME, target: RIVAL, type: 'hostile_to', properties: { cause: 'covets' } });
  return g;
}

function undoTemplate(objectTypeId: UndertakingObjectTypeId): StrategicActionTemplate {
  return {
    id: `cell_undo_${objectTypeId}`,
    displayName: `Undo ${objectTypeId}`,
    verb: 'destroy',
    undertakingVerb: 'undo',
    objectTypeId,
    executionMode: 'multi_tick_project',
    behaviorFamily: 'warlord',
    targetRule: { type: 'object', objectTypeId, ownership: 'other' },
    motiveGate: ['rivalry', 'grudge'],
  } as unknown as StrategicActionTemplate;
}

describe('undo × attachment and undo × mark through the motive gate', () => {
  it('passes against a rival holder, naming the holder as the victim', () => {
    const g = world();
    const attachment = evaluateMotiveGate(g, ME, 'chart_rival', undoTemplate('attachment'), { kind: 'node', nodeId: 'chart_rival' });
    expect(attachment).toMatchObject({ allowed: true, motive: 'rivalry', ownerId: RIVAL, ownerCount: 1 });

    const mark = evaluateMotiveGate(g, ME, STRANGER, undoTemplate('mark'), { kind: 'edge', edgeId: 'mark_rival' });
    expect(mark).toMatchObject({ allowed: true, motive: 'rivalry', ownerId: RIVAL, ownerCount: 1 });
  });

  it('is refused against oneself — the holder is found, and no motive holds toward oneself', () => {
    const g = world();
    const attachment = evaluateMotiveGate(g, ME, 'chart_mine', undoTemplate('attachment'), { kind: 'node', nodeId: 'chart_mine' });
    expect(attachment).toEqual({ allowed: false, ownerCount: 1 });

    const mark = evaluateMotiveGate(g, ME, STRANGER, undoTemplate('mark'), { kind: 'edge', edgeId: 'mark_mine' });
    expect(mark).toEqual({ allowed: false, ownerCount: 1 });
  });

  it('is refused against a holder there is no quarrel with, and the handle is what finds the holder', () => {
    const g = world();
    g.removeEdge('h');
    const refused = evaluateMotiveGate(g, ME, 'chart_rival', undoTemplate('attachment'), { kind: 'node', nodeId: 'chart_rival' });
    expect(refused).toEqual({ allowed: false, ownerCount: 1 });
    // The mark's place is the subject, who holds nothing: without the handle the gate
    // would read the subject node and refuse as *unowned* — the pre-slice defect.
    const withoutHandle = evaluateMotiveGate(g, ME, STRANGER, undoTemplate('mark'));
    expect(withoutHandle.ownerCount).toBe(0);
  });

  it('the node walk itself now sees possesses', () => {
    const g = world();
    expect(resolveTargetOwners(g, 'chart_rival')).toEqual([RIVAL]);
  });
});

describe('ownership rules and the control variant', () => {
  it('classifies own / other / unowned from the type\'s edges and picks claim or seize', () => {
    const g = world();
    g.addNode({ id: 'room_free', name: 'Free room', type: 'location', properties: { parentLocationId: 'x', sublocationTypeId: 'sublocation-type.workshop' } });
    const attachment = getUndertakingObjectType('attachment')!;
    const room = getUndertakingObjectType('room')!;
    const mark = getUndertakingObjectType('mark')!;

    expect(ownershipOf(g, ME, attachment, { kind: 'node', nodeId: 'chart_mine' })).toBe('own');
    expect(ownershipOf(g, ME, attachment, { kind: 'node', nodeId: 'chart_rival' })).toBe('other');
    expect(ownershipOf(g, ME, room, { kind: 'node', nodeId: 'room_free' })).toBe('unowned');
    expect(ownershipOf(g, ME, mark, { kind: 'edge', edgeId: 'mark_rival' })).toBe('other');

    expect(ownershipSatisfies('any', 'other')).toBe(true);
    expect(ownershipSatisfies('other', 'own')).toBe(false);
    expect(ownershipSatisfies('unowned', 'unowned')).toBe(true);

    expect(resolveVerbVariant(g, ME, 'control', room, { kind: 'node', nodeId: 'room_free' })).toBe('control:claim');
    expect(resolveVerbVariant(g, ME, 'control', attachment, { kind: 'node', nodeId: 'chart_rival' })).toBe('control:seize');
    expect(resolveVerbVariant(g, ME, 'control', attachment, { kind: 'node', nodeId: 'chart_mine' })).toBeNull();
    expect(resolveVerbVariant(g, ME, 'undo', attachment, { kind: 'node', nodeId: 'chart_rival' })).toBe('undo');
  });
});
