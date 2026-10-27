/**
 * THR-2031 — a mortal takes up a relic that lies unclaimed (`claim × Item`, plan
 * `Docs/plans/2026-10-26-thr-2031-take-up-a-lying-relic.md` § Done when).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { GraphOpResult } from '../strategicGraphOps';
import type { ObjectVerbContext, ObjectVerbSemantic } from '../../data/undertaking-objects';
import { eligibilityRefusal, getUndertakingObjectType } from '../../data/undertaking-objects';
import { DEV_ASCENDANT_IDENTITY, initializeGameStateFromIdentity } from '../gameInit';
import { sampleAccount } from '../accountStore';
import { resetDecisionCache, resetEventCounter } from '../orchestrator';
import { dominionObjectScores } from '../dominion';
import { cellActivityProse, cellCompletionProse } from '../undertakingProse';
import { resolveTargetHex } from '../strategicActionCandidates';
import { resolveLocationToHex } from '../encounterAwareness';
import { getAgentLocationId } from '../graphQueries';
import { isAutonomousDecisionActor } from '../strategicKindReachability';
import { buildConnections } from '../views/connections';
import { buildEchoGroup, pastLineText } from '../worldPastWords';
import { resolveUndertakingCompletion } from '../undertakingResolver';

const ITEM = getUndertakingObjectType('item')!;
const claim = ITEM.verbs['control:claim'] as ObjectVerbSemantic;

let relicId: string;
let hostId: string;

/** A fresh world the sample account shaped, so each test writes on its own graph. */
function world(): GameState {
  resetEventCounter();
  resetDecisionCache();
  return initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, undefined, 'medium', undefined, sampleAccount()).state;
}

beforeAll(() => {
  const relic = world().seededEchoes!.seeded.find(e => e.kind === 'relic')!;
  relicId = relic.nodeId;
  hostId = relic.hostId;
});

function mortal(state: GameState): string {
  return state.graph.getNodesByType('actor').filter(isAutonomousDecisionActor).map(n => n.id).sort()[0];
}

function run(state: GameState, actorId: string, itemId: string): GraphOpResult {
  const ctx = { state, graph: state.graph, actorId, tick: 30, projectId: 'proj_claim', handle: { kind: 'node', nodeId: itemId } } as unknown as ObjectVerbContext;
  return claim(ctx) as GraphOpResult;
}

const project = (actorId: string, itemId: string) => ({
  projectId: 'proj_claim', actorId, objectHandle: { kind: 'node' as const, nodeId: itemId }, objectTypeId: 'item' as const,
  targetNodeId: itemId, victimAgentId: undefined,
});

describe('THR-2031 — claim × Item takes up a relic that lies at a place', () => {
  it('removes lies_at, writes one possesses, and reads Dominion through the bearer', () => {
    const state = world();
    const actor = mortal(state);
    expect(dominionObjectScores(state.graph, relicId).readThrough).toBe('unborne');
    const result = run(state, actor, relicId);
    expect(result).toMatchObject({ success: true, op: 'claim_item', createdId: relicId });
    expect(state.graph.getOutgoingEdges(relicId, 'lies_at')).toHaveLength(0);
    const held = state.graph.getIncomingEdges(relicId, 'possesses');
    expect(held).toHaveLength(1);
    expect(held[0]).toMatchObject({ source: actor, properties: { via: 'claimed', takenFrom: hostId, active: true } });
    expect(dominionObjectScores(state.graph, relicId).readThrough).toBe('bearer');
    // The relic's page names its holder; it no longer lies anywhere.
    const rows = buildConnections(state.graph, state, { cls: 'artifact', id: relicId });
    expect(JSON.stringify(rows)).toContain(actor);
  });

  it('speaks the echo line for a past god\'s relic, and names no node id', () => {
    const state = world();
    const actor = mortal(state);
    const result = run(state, actor, relicId);
    expect(result.completionLine).toBe('echo');
    const text = cellCompletionProse(state.graph, project(actor, relicId), 'control:claim', {
      line: result.completionLine, objectId: result.proseObjectId,
    }).text;
    const place = state.graph.getNode(hostId)!.name!;
    expect(text).toContain('The Hollow Bell');
    expect(text).toContain('left by a god of the last age');
    expect(text).toContain(place);
    expect(text).not.toMatch(/echo_|agent_|loc_|\{/);
  });

  it('speaks no outcome line for an ordinary item', () => {
    const state = world();
    const actor = mortal(state);
    state.graph.addNode({ id: 'item_plain', type: 'artifact', name: 'a plain knife', properties: { attachmentCategory: 'possession' } });
    state.graph.addEdge({ id: 'lies_plain', source: 'item_plain', target: hostId, type: 'lies_at', properties: { sinceTick: 0 } });
    const result = run(state, actor, 'item_plain');
    expect(result.success).toBe(true);
    expect(result.completionLine).toBeUndefined();
  });

  it('fails already_held on a borne relic and writes nothing', () => {
    const state = world();
    const [first, second] = state.graph.getNodesByType('actor').filter(isAutonomousDecisionActor).map(n => n.id).sort();
    expect(run(state, first, relicId).success).toBe(true);
    const edgesBefore = state.graph.getAllEdges().length;
    const again = run(state, second, relicId);
    expect(again).toMatchObject({ success: false, op: 'claim_item', error: 'already_held' });
    expect(state.graph.getAllEdges().length).toBe(edgesBefore);
    expect(state.graph.getIncomingEdges(relicId, 'possesses').map(e => e.source)).toEqual([first]);
  });

  it('a raced claim refuses through the completion resolver — it never becomes a seize', () => {
    const state = world();
    const [first, second] = state.graph.getNodesByType('actor').filter(isAutonomousDecisionActor).map(n => n.id).sort();
    const handle = { kind: 'node' as const, nodeId: relicId };
    const complete = (actorId: string) => resolveUndertakingCompletion({
      state, graph: state.graph, actorId, verb: 'control', variant: 'control:claim',
      objectTypeId: 'item', handle, tick: 30, projectId: 'proj_claim', targetNodeId: relicId,
    });
    expect(complete(first).variant).toBe('control:claim');
    const raced = complete(second);
    expect(raced.variant).toBe('control:claim');
    expect(raced.ops[0]).toMatchObject({ success: false, op: 'claim_item', error: 'already_held' });
    expect(state.graph.getIncomingEdges(relicId, 'possesses').map(e => e.source)).toEqual([first]);
  });

  it('refuses an unborne item that lies nowhere at proposal', () => {
    const state = world();
    state.graph.addNode({ id: 'item_loose', type: 'artifact', name: 'a loose ring', properties: { attachmentCategory: 'possession' } });
    const handle = { kind: 'node' as const, nodeId: 'item_loose' };
    expect(eligibilityRefusal(state.graph, ITEM, 'control:claim', mortal(state), handle)).toBe('not_lying_at_a_place');
    expect(eligibilityRefusal(state.graph, ITEM, 'control:claim', mortal(state), { kind: 'node', nodeId: relicId })).toBeNull();
  });
});

describe('THR-2031 — {place} names where the relic lies, never the relic', () => {
  it('reads the lies_at place during the work and takenFrom after it', () => {
    const state = world();
    const actor = mortal(state);
    const place = state.graph.getNode(hostId)!.name!;
    const during = cellActivityProse(state.graph, project(actor, relicId), 'control:claim').text;
    expect(during).toContain(place);
    expect(during).not.toContain('set out for The Hollow Bell');
    run(state, actor, relicId);
    const after = cellCompletionProse(state.graph, project(actor, relicId), 'control:claim').text;
    expect(after).toContain(place);
    expect(after.split('The Hollow Bell').length - 1).toBe(1);
  });
});

describe('THR-2031 — the chronicle stops calling a taken relic unclaimed', () => {
  it('reads "lies … unclaimed" before the claim and "was taken up" after it', () => {
    const state = world();
    const relicLine = () => buildEchoGroup(state.graph, state.seededEchoes)!.lines
      .map(pastLineText).find(t => t.startsWith('The Hollow Bell'))!;
    expect(relicLine()).toContain('unclaimed');
    run(state, mortal(state), relicId);
    expect(relicLine()).not.toContain('unclaimed');
    expect(relicLine()).toContain('was taken up from near');
  });
});

describe('THR-2031 — a lying relic is as far away as its place', () => {
  it('resolves to the lies_at place\'s hex, then to the bearer\'s', () => {
    const state = world();
    const relic = state.graph.getNode(relicId)!;
    expect(resolveTargetHex(state.graph, relic)).toEqual(resolveLocationToHex(state.graph, hostId));
    const actor = mortal(state);
    run(state, actor, relicId);
    expect(resolveTargetHex(state.graph, relic)).toEqual(resolveLocationToHex(state.graph, getAgentLocationId(state.graph, actor)!));
  });
});
