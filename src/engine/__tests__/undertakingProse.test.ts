/**
 * The four slots are filled from the world (THR-1392 slice 2): the object's own
 * name, its holder, the actor, the place — and a slot the world cannot fill never
 * leaks a raw token (Law 43). Concepts come back with the text so a surface can chip
 * them (Law 1).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  resolveUndertakingProse,
  objectDisplayName,
  pickUndertakingLine,
  cellActivityProse,
  cellCompletionProse,
  UNDERTAKING_PROSE_TOKENS,
} from '../undertakingProse';
import { STRATEGIC_PROSE_TOKENS } from '../../data/content-eval/undertakingContract';
import { UNDERTAKING_VERB_PROSE } from '../../data/undertaking-verb-prose';

function world(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'kael', name: 'Kael Thornweaver', type: 'actor', properties: { actorType: 'individual' } });
  g.addNode({ id: 'maerin', name: 'Old Maerin', type: 'actor', properties: { actorType: 'individual' } });
  g.addNode({ id: 'town', name: 'Ardenmor', type: 'location', properties: { locationSubtype: 'town', hexCol: 1, hexRow: 1 } });
  g.addNode({ id: 'mill', name: 'the Low Mill', type: 'location', properties: { parentLocationId: 'town', sublocationTypeId: 'sublocation-type.granary' } });
  g.addEdge({ id: 'owns_mill', source: 'maerin', target: 'mill', type: 'owns', properties: { acquiredTick: 0, via: 'grant' } });
  g.addEdge({ id: 'agreement', source: 'maerin', target: 'kael', type: 'knows_secret_of', properties: { magnitude: 0.5, revealed: false, secretType: 'affair', discoveredTick: 0, source: 'observed' } });
  return g;
}

describe('resolveUndertakingProse', () => {
  it('fills object, owner, actor and place from the world and names each as a concept', () => {
    const g = world();
    const r = resolveUndertakingProse('{Actor} is unmaking {object} at {place}; {owner} will not thank them.', {
      graph: g, actorId: 'kael', objectTypeId: 'place', handle: { kind: 'node', nodeId: 'mill' },
    });
    expect(r.text).toBe('Kael Thornweaver is unmaking the Low Mill at Ardenmor; Old Maerin will not thank them.');
    expect(r.concepts.map(c => [c.role, c.id])).toEqual([['object', 'mill'], ['owner', 'maerin'], ['actor', 'kael'], ['place', 'town']]);
  });

  it('describes an edge object by its ends and places it at its subject', () => {
    const g = world();
    expect(objectDisplayName(g, 'agreement', { kind: 'edge', edgeId: 'agreement' })).toBe('the hold on Kael Thornweaver');
    const r = resolveUndertakingProse('{Owner} holds {object} at {place}.', {
      graph: g, actorId: 'kael', objectTypeId: 'agreement', handle: { kind: 'edge', edgeId: 'agreement' },
    });
    expect(r.text).toBe('Old Maerin holds the hold on Kael Thornweaver at Kael Thornweaver.');
  });

  it('never leaks a token: missing slots take neutral words, unknown tokens are stripped', () => {
    const g = world();
    const r = resolveUndertakingProse('{Actor} eyes {object} near {place}, {owner} watching {unknown_token}.', {
      graph: g, actorId: 'nobody',
    });
    expect(r.text).toBe('Someone eyes the work near the place, its holder watching.');
    expect(r.text).not.toMatch(/\{|\}/);
    expect(r.concepts).toEqual([]);
  });

  it('the contract knows the same tokens the resolver fills', () => {
    for (const t of UNDERTAKING_PROSE_TOKENS) expect(STRATEGIC_PROSE_TOKENS.has(t)).toBe(true);
  });

  it('picks lines deterministically per key, and the cell helpers resolve the set for a project', () => {
    const lines = UNDERTAKING_VERB_PROSE.destroy.activity;
    expect(pickUndertakingLine(lines, 'proj_a')).toBe(pickUndertakingLine(lines, 'proj_a'));
    expect(lines).toContain(pickUndertakingLine(lines, 'proj_a'));
    expect(pickUndertakingLine([], 'x')).toBeUndefined();

    const g = world();
    const project = { projectId: 'proj_a', actorId: 'kael', objectTypeId: 'place' as const, objectHandle: { kind: 'node' as const, nodeId: 'mill' }, targetNodeId: 'mill', victimAgentId: 'maerin' };
    const activity = cellActivityProse(g, project, 'destroy');
    expect(activity.text).toContain('Kael Thornweaver');
    expect(activity.text).toContain('the Low Mill');
    expect(activity.text).not.toMatch(/\{/);
    const completion = cellCompletionProse(g, project, 'destroy');
    expect(completion.text).toContain('Old Maerin');
    expect(completion.text).not.toMatch(/\{/);
  });
});
