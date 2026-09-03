/**
 * The covet rivalry (THR-1388) — the three things the plan's Done-when pins:
 *   - a refusal streak below the threshold writes nothing;
 *   - a streak at the threshold writes exactly one `hostile_to` the motive gate reads
 *     as `rivalry` and NOT as `grudge`;
 *   - a second streak while the edge stands writes nothing.
 * Plus the guards: the ascendant, the actor's own faction and an unowned target are
 * never counted; a refusal that is not `no_motive:` is never counted; a non-destroy
 * ambition never counts.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import { recordCovetRefusals, readCovetRecord, covetEdgeCount } from '../covetRivalry';
import { holdsMotive } from '../../undertakingMotive';
import { COVET_RIVALRY_THRESHOLD, COVET_SWITCH_BELOW, MAX_COVET_RIVALRIES_PER_ACTOR } from '../../../data/grievance-constants';
import { clearTraces, enableTracing, getTraces } from '../../traceBuffer';

const ACTOR = 'actor_conqueror';
const OWNER = 'faction_def_rivals';
const OTHER_OWNER = 'faction_def_others';
const TARGET = 'loc_garrison';
const OTHER_TARGET = 'loc_warehouse';
const ASCENDANT = 'ascendant_1';
/** An ambition whose strategic profile prefers destroy — the conqueror's. */
const DESTROY_AMBITION = 'ambition_conquer_territory';
/** One that does not. */
const PEACEFUL_AMBITION = 'ambition_spread_faith';

function world(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: ACTOR, name: 'Oswen', type: 'actor', properties: { actorType: 'individual', spotlightTier: 'spotlight' } });
  g.addNode({ id: OWNER, name: 'The Iron Wolves', type: 'actor', properties: { actorType: 'faction' } });
  g.addNode({ id: OTHER_OWNER, name: 'The Grey Ledger', type: 'actor', properties: { actorType: 'faction' } });
  g.addNode({ id: ASCENDANT, name: 'The God', type: 'actor', properties: { actorType: 'individual' } });
  g.addNode({ id: TARGET, name: 'Ardenmor Keep', type: 'location', properties: { locationSubtype: 'garrison' } });
  g.addNode({ id: OTHER_TARGET, name: 'The Salt Warehouse', type: 'location', properties: { locationSubtype: 'warehouse' } });
  g.addEdge({ id: 'c1', source: OWNER, target: TARGET, type: 'controls', properties: {} });
  g.addEdge({ id: 'c2', source: OTHER_OWNER, target: OTHER_TARGET, type: 'controls', properties: {} });
  return g;
}

const refusal = (targetId: string) => [{ templateId: 'strategic_raid_supply_lines', reason: `no_motive:${targetId}` }];

function boards(g: WorldGraph, n: number, targetId = TARGET, startTick = 1, ambitions: readonly string[] = [DESTROY_AMBITION]) {
  let seeded;
  for (let i = 0; i < n; i++) {
    seeded = recordCovetRefusals(g, ACTOR, refusal(targetId), ambitions, startTick + i, ASCENDANT) ?? seeded;
  }
  return seeded;
}

describe('the covet rivalry', () => {
  it('writes nothing below the threshold, and keeps the count on the actor', () => {
    const g = world();
    expect(boards(g, COVET_RIVALRY_THRESHOLD - 1)).toBeUndefined();
    expect(covetEdgeCount(g, ACTOR)).toBe(0);
    const record = readCovetRecord(g.getNode(ACTOR))!;
    expect(record.ownerId).toBe(OWNER);
    expect(record.count).toBe(COVET_RIVALRY_THRESHOLD - 1);
    expect(holdsMotive(g, ACTOR, OWNER, 'rivalry')).toBe(false);
  });

  it('at the threshold writes exactly one edge the gate reads as rivalry, never as grudge, and clears the record', () => {
    const g = world();
    enableTracing();
    clearTraces();
    const seeded = boards(g, COVET_RIVALRY_THRESHOLD);
    expect(seeded).toEqual({ ownerId: OWNER, targetId: TARGET, refusals: COVET_RIVALRY_THRESHOLD, ambitionId: DESTROY_AMBITION });
    expect(covetEdgeCount(g, ACTOR)).toBe(1);
    expect(holdsMotive(g, ACTOR, OWNER, 'rivalry')).toBe(true);
    expect(holdsMotive(g, ACTOR, OWNER, 'grudge')).toBe(false);
    // One way: the owner holds no quarrel until a harm arrives.
    expect(g.getOutgoingEdges(OWNER, 'hostile_to')).toHaveLength(0);
    expect(readCovetRecord(g.getNode(ACTOR))).toBeUndefined();
    const trace = getTraces().find(t => t.category === 'covet_rivalry_seeded') as { ownerId?: string; refusals?: number } | undefined;
    expect(trace?.ownerId).toBe(OWNER);
    expect(trace?.refusals).toBe(COVET_RIVALRY_THRESHOLD);
  });

  it('writes nothing more while a covet edge stands (the per-actor cap)', () => {
    const g = world();
    boards(g, COVET_RIVALRY_THRESHOLD);
    expect(MAX_COVET_RIVALRIES_PER_ACTOR).toBe(1);
    expect(boards(g, COVET_RIVALRY_THRESHOLD * 2, OTHER_TARGET, 100)).toBeUndefined();
    expect(covetEdgeCount(g, ACTOR)).toBe(1);
    expect(holdsMotive(g, ACTOR, OTHER_OWNER, 'rivalry')).toBe(false);
    expect(readCovetRecord(g.getNode(ACTOR))).toBeUndefined();
  });

  it('switches owner only while the count is still low', () => {
    const g = world();
    boards(g, COVET_SWITCH_BELOW - 1);
    boards(g, 1, OTHER_TARGET, 50);
    expect(readCovetRecord(g.getNode(ACTOR))!.ownerId).toBe(OTHER_OWNER);
    const g2 = world();
    boards(g2, COVET_SWITCH_BELOW);
    boards(g2, 1, OTHER_TARGET, 50);
    expect(readCovetRecord(g2.getNode(ACTOR))!.ownerId).toBe(OWNER);
  });

  it('never counts the ascendant, an unowned target, a non-motive refusal, or a peaceful ambition', () => {
    const g = world();
    g.addNode({ id: 'loc_gods', name: 'The Shrine of the God', type: 'location', properties: {} });
    g.addEdge({ id: 'c3', source: ASCENDANT, target: 'loc_gods', type: 'controls', properties: {} });
    g.addNode({ id: 'loc_nobody', name: 'The Empty Fort', type: 'location', properties: {} });
    for (let i = 0; i < COVET_RIVALRY_THRESHOLD; i++) {
      recordCovetRefusals(g, ACTOR, refusal('loc_gods'), [DESTROY_AMBITION], i, ASCENDANT);
      recordCovetRefusals(g, ACTOR, [{ templateId: 'strategic_raid_supply_lines', reason: 'no_motive_unowned:loc_nobody' }], [DESTROY_AMBITION], i, ASCENDANT);
      recordCovetRefusals(g, ACTOR, [{ templateId: 'strategic_raid_supply_lines', reason: `active_cap:${i}` }], [DESTROY_AMBITION], i, ASCENDANT);
      recordCovetRefusals(g, ACTOR, refusal(TARGET), [PEACEFUL_AMBITION], i, ASCENDANT);
    }
    expect(readCovetRecord(g.getNode(ACTOR))).toBeUndefined();
    expect(covetEdgeCount(g, ACTOR)).toBe(0);
  });

  it('never counts the actor’s own faction', () => {
    const g = world();
    g.addEdge({ id: 'm1', source: ACTOR, target: OWNER, type: 'member_of', properties: { rank: 0.5 } });
    boards(g, COVET_RIVALRY_THRESHOLD);
    expect(readCovetRecord(g.getNode(ACTOR))).toBeUndefined();
    expect(covetEdgeCount(g, ACTOR)).toBe(0);
  });
});
