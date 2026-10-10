/**
 * THR-1804 item 4 — a chapter does not come back minutes after it ends.
 *
 * Cold playtest round 3: the bonded First's early pool is small, so the pool-size
 * scaling cut a completed template's cooldown to COOLDOWN_MINIMUM and "Decipher Old
 * Markings" restarted almost at once. The First now carries a named repeat floor,
 * FIRST_CHAPTER_REPEAT_FLOOR_TICKS, which gives way only when nothing else is left.
 */
import { describe, it, expect } from 'vitest';
import { filterByCooldown, isBondedFirstActor } from '../phaseAgentDecision';
import { WorldGraph } from '../graph';
import {
  COOLDOWN_MINIMUM,
  FIRST_CHAPTER_REPEAT_FLOOR_TICKS,
} from '../../data/agent-behavior-constants';
import type { EncounterCacheEntry } from '../encounterCache';
import type { EncounterProgress } from '../../types/encounter';

const FIRST = 'agent.first';
const DONE = 'encounter.decipher_old_markings';
const OTHER = 'encounter.other';
const COMPLETED_AT = 100;
/** A one-template pool: the scaled completion cooldown falls to COOLDOWN_MINIMUM. */
const SMALL_POOL = 1;

const completed = {
  encounterId: DONE,
  actorId: FIRST,
  status: 'completed',
  startedTick: COMPLETED_AT - 6,
  history: [{ tick: COMPLETED_AT }],
} as unknown as EncounterProgress;

const ids = (entries: EncounterCacheEntry[]) => entries.map(e => e.templateId);
const both = [{ templateId: DONE }, { templateId: OTHER }] as EncounterCacheEntry[];
const onlyDone = [{ templateId: DONE }] as EncounterCacheEntry[];

const pass = (candidates: EncounterCacheEntry[], tick: number, floor: number) =>
  ids(filterByCooldown(candidates, FIRST, [completed], [], tick, SMALL_POOL, [], floor));

describe('the bonded First\'s chapter-repeat floor (THR-1804)', () => {
  it('without the floor, a small pool lets the chapter straight back (the playtest fault)', () => {
    expect(pass(both, COMPLETED_AT + COOLDOWN_MINIMUM + 1, 0)).toContain(DONE);
  });

  it('with the floor, the finished chapter stays out while another candidate exists', () => {
    expect(FIRST_CHAPTER_REPEAT_FLOOR_TICKS).toBeGreaterThan(COOLDOWN_MINIMUM);
    for (const dt of [COOLDOWN_MINIMUM + 1, 10, FIRST_CHAPTER_REPEAT_FLOOR_TICKS]) {
      expect(pass(both, COMPLETED_AT + dt, FIRST_CHAPTER_REPEAT_FLOOR_TICKS)).toEqual([OTHER]);
    }
  });

  it('the chapter returns once the floor has passed', () => {
    expect(pass(both, COMPLETED_AT + FIRST_CHAPTER_REPEAT_FLOOR_TICKS + 1, FIRST_CHAPTER_REPEAT_FLOOR_TICKS))
      .toEqual([DONE, OTHER]);
  });

  it('fail-soft: when the floor would leave nothing, the scaled cooldown applies', () => {
    expect(pass(onlyDone, COMPLETED_AT + COOLDOWN_MINIMUM + 1, FIRST_CHAPTER_REPEAT_FLOOR_TICKS)).toEqual([DONE]);
    // And the scaled cooldown itself still holds.
    expect(pass(onlyDone, COMPLETED_AT + 1, FIRST_CHAPTER_REPEAT_FLOOR_TICKS)).toEqual([]);
  });
});

describe('who carries the floor (THR-1804)', () => {
  it('only an actor threaded at the_first court position', () => {
    const g = new WorldGraph();
    for (const id of ['asc', FIRST, 'agent.retinue']) g.addNode({ id, type: 'actor', name: id, properties: {} } as never);
    g.addEdge({ id: 't.1', source: 'asc', target: FIRST, type: 'thread', properties: { courtPosition: 'the_first' } } as never);
    g.addEdge({ id: 't.2', source: 'asc', target: 'agent.retinue', type: 'thread', properties: { tier: 2 } } as never);
    expect(isBondedFirstActor(g, FIRST)).toBe(true);
    expect(isBondedFirstActor(g, 'agent.retinue')).toBe(false);
    expect(isBondedFirstActor(g, 'asc')).toBe(false);
  });
});
