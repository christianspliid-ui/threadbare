/**
 * The candidate walk under the `cells` model (THR-1392 slice 2). Proves the wiring,
 * not the rule: an ambition's `cells` are walked ahead of its templates, an object
 * of the type is offered with its handle and tier, a rival's object passes the gate
 * and one's own is never offered to a counter-play cell, and a cell with nothing to
 * act on is refused as `no_object_in_range` and traced unreachable exactly once.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { generateStrategicCandidates, profileWorkIds, findAmbitionTemplate } from '../strategicActionCandidates';
import { mulberry32 } from '../../lib/prng';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';

const ME = 'actor_me';
const RIVAL = 'actor_rival';
const REVENGE = 'ambition_seek_revenge';

function world(): WorldGraph {
  const g = new WorldGraph();
  const full = { iron: 0.9, shadow: 0.9, eye: 0.9, heart: 0.9, gold: 0.9, stone: 0.9, star: 0.9, veil: 0.9 };
  g.addNode({ id: ME, name: 'Hask', type: 'actor', properties: { actorType: 'individual', spotlightTier: 'spotlight', domainCapabilities: full } });
  g.addNode({ id: RIVAL, name: 'Lirik', type: 'actor', properties: { actorType: 'individual', spotlightTier: 'spotlight', domainCapabilities: full } });
  g.addNode({ id: 'town', name: 'Millbrook', type: 'location', properties: { locationSubtype: 'town', hexCol: 5, hexRow: 5 } });
  g.addEdge({ id: 'l1', source: ME, target: 'town', type: 'located_at', properties: {} });
  g.addEdge({ id: 'l2', source: RIVAL, target: 'town', type: 'located_at', properties: {} });
  g.addNode({ id: 'chart_rival', name: 'The Tidewater Chart', type: 'artifact', properties: { tier: 1 } });
  g.addNode({ id: 'chart_mine', name: 'My Chart', type: 'artifact', properties: { tier: 1 } });
  g.addEdge({ id: 'p1', source: RIVAL, target: 'chart_rival', type: 'possesses', properties: { active: true } });
  g.addEdge({ id: 'p2', source: ME, target: 'chart_mine', type: 'possesses', properties: { active: true } });
  g.addEdge({ id: 'h', source: ME, target: RIVAL, type: 'hostile_to', properties: { cause: 'covets' } });
  return g;
}

describe('the cell walk', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });

  it('profileWorkIds leads with cells only under the cells model', () => {
    const profile = findAmbitionTemplate(REVENGE)!.strategicProfile!;
    expect(profile.cells?.length).toBeGreaterThan(0);
    expect(profileWorkIds(profile, 'templates')).toEqual(profile.templateIds);
    expect(profileWorkIds(profile, 'cells').slice(0, profile.cells!.length)).toEqual(profile.cells);
  });

  it('offers undo × attachment against the rival\'s chart with its handle and tier, never against one\'s own', () => {
    const g = world();
    const { candidates, rejections } = generateStrategicCandidates(g, ME, [REVENGE], undefined, 10, mulberry32(1), undefined, 'cells');
    const undo = candidates.filter(c => c.templateId === 'cell.undo.attachment');
    expect(undo.map(c => c.targetNodeId)).toEqual(['chart_rival']);
    expect(undo[0]).toMatchObject({
      objectHandle: { kind: 'node', nodeId: 'chart_rival' },
      objectTypeId: 'attachment',
      objectTier: 1,
      victimAgentId: RIVAL,
      verb: 'destroy',
    });
    expect(candidates.some(c => c.targetNodeId === 'chart_mine')).toBe(false);
    // Cells with nothing of their type in this world are refused by the cell's own reason.
    const reasons = rejections.map(r => r.reason);
    expect(reasons).toContain('no_object_in_range:room');
    expect(reasons).toContain('no_object_in_range:settlement');
  });

  it('traces an unreachable cell once per world, naming why', () => {
    const g = world();
    generateStrategicCandidates(g, ME, [REVENGE], undefined, 10, mulberry32(1), undefined, 'cells');
    generateStrategicCandidates(g, ME, [REVENGE], undefined, 11, mulberry32(2), undefined, 'cells');
    const traces = getTraces().filter(t => t.category === 'undertaking_cell_unreachable') as Array<{ objectTypeId: string; reason: string }>;
    const rooms = traces.filter(t => t.objectTypeId === 'room');
    expect(rooms).toHaveLength(1);
    expect(rooms[0].reason).toBe('no_object_exists');
    // A settlement exists (the town) but nobody holds it — the other reason.
    const settlements = traces.filter(t => t.objectTypeId === 'settlement');
    expect(settlements).toHaveLength(1);
    expect(settlements[0].reason).toBe('no_owned_object');
  });

  it('under the templates model no cell is walked at all', () => {
    const g = world();
    const { candidates, rejections } = generateStrategicCandidates(g, ME, [REVENGE], undefined, 10, mulberry32(1), undefined, 'templates');
    expect(candidates.some(c => c.templateId.startsWith('cell.'))).toBe(false);
    expect(rejections.some(r => r.templateId.startsWith('cell.'))).toBe(false);
  });
});
