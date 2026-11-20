/**
 * THR-2254 — the race names a place to tend (ticket 4 of
 * `Docs/plans/2026-11-19-thr-2246-the-player-can-read-the-race.md`, decision 4).
 * Order: chapter → place → Stay. The place is the god's place holding the largest
 * `godHeld` share in the Mandate sphere furthest from its target.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { raceLever, raceLeverPlaceId } from '../raceForecast';
import { selectRaceLever } from '../views/subjects/godSheet';
import {
  RACE_LEVER_PLACE_BARE,
  RACE_LEVER_STAY,
  racePlaceLeverLine,
  racePlaceLeverRuns,
} from '../../data/race-content';
import { DOOM_STAY_BUTTON, DOOM_STAY_TEMPLATE_ID } from '../../data/doom-stay-content';
import type { RaceState } from '../../types/mandate';
import type { GameState } from '../../types/gameState';

interface Opts {
  shown?: RaceState;
  threaded?: string[];
  unlocked?: boolean;
  places?: Array<{ id: string; name?: string }>;
  held?: Record<string, number>;
}

function world(opts: Opts = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
  for (const id of opts.threaded ?? []) {
    graph.addNode({ id, type: 'actor', name: 'Kael Thornweaver', properties: {} });
    graph.addEdge({ id: `t_${id}`, source: 'asc', target: id, type: 'thread', properties: {} } as never);
  }
  for (const p of opts.places ?? []) {
    graph.addNode({ id: p.id, type: 'location', name: p.name ?? '', properties: { locationType: 'shrine' } });
  }
  graph.addNode({ id: 'mortal_holder', type: 'actor', name: 'Ilsa', properties: { actorType: 'individual' } });
  return {
    graph,
    ascendantId: 'asc',
    tick: 400,
    recentEvents: [],
    unifiedActions: [],
    chapterArchive: [],
    controlEffects: [],
    unlockedActionIds: opts.unlocked ? [DOOM_STAY_TEMPLATE_ID] : [],
    mandateDefinition: {
      id: 'm', name: 'M', description: 'A hunger.', runtimeKind: 'sphere_growth', primarySphere: 'order', secondarySphere: 'mind',
      primaryTargetDelta: 1, secondaryTargetDelta: 1,
    },
    mandateState: {
      mandateId: 'm', currentStage: 'setup', progress: 0.3, completed: false, failed: false,
      // Order is the short sphere (0.2 of its target against Mind's 0.6).
      primaryDelta: 0.2, secondaryDelta: 0.6,
      godHeld: opts.held ?? {},
      raceWatch: { samples: [], shown: opts.shown ?? 'hidden', seen: (opts.shown ?? 'hidden') !== 'hidden' },
    },
  } as unknown as GameState;
}

describe('THR-2254 — raceLeverPlaceId', () => {
  it('picks the place with the largest held share in the short sphere only', () => {
    const s = world({
      places: [{ id: 'shrine_a', name: 'Ashford' }, { id: 'shrine_b', name: 'Bellmoor' }],
      held: { 'shrine_a|order': 2, 'shrine_b|order': 5, 'shrine_a|mind': 50 },
    });
    expect(raceLeverPlaceId(s, 'order')).toBe('shrine_b');
    expect(raceLeverPlaceId(s, 'mind')).toBe('shrine_a');
  });

  it('passes over mortals, gone nodes and non-positive shares', () => {
    const s = world({
      places: [{ id: 'shrine_a', name: 'Ashford' }],
      held: { 'mortal_holder|order': 40, 'gone_place|order': 30, 'shrine_a|order': 1, 'shrine_z|order': 0 },
    });
    expect(raceLeverPlaceId(s, 'order')).toBe('shrine_a');
  });

  it('breaks a tie on the id', () => {
    const s = world({
      places: [{ id: 'shrine_b', name: 'B' }, { id: 'shrine_a', name: 'A' }],
      held: { 'shrine_b|order': 3, 'shrine_a|order': 3 },
    });
    expect(raceLeverPlaceId(s, 'order')).toBe('shrine_a');
  });

  it('is null with nothing held', () => {
    expect(raceLeverPlaceId(world(), 'order')).toBeNull();
  });
});

describe('THR-2254 — raceLever order: chapter, then place, then Stay', () => {
  const places = [{ id: 'shrine_a', name: 'Ashford' }];
  const held = { 'shrine_a|order': 4 };

  it('a bound mortal still wins over a held place', () => {
    expect(raceLever('doom_first', world({ threaded: ['kael'], places, held, unlocked: true }))).toMatchObject({ kind: 'chapter' });
  });

  it('a held place wins over Stay when no mortal is bound', () => {
    expect(raceLever('doom_first', world({ places, held, unlocked: true }))).toEqual({ kind: 'place', sphere: 'order', placeId: 'shrine_a' });
    expect(raceLever('stalled', world({ places, held, unlocked: true }))).toMatchObject({ kind: 'place' });
    expect(raceLever('close', world({ places, held, unlocked: true }))).toMatchObject({ kind: 'place' });
  });

  it('a place held only in the full sphere is no lever; Stay follows', () => {
    const lever = raceLever('doom_first', world({ places, held: { 'shrine_a|mind': 9 }, unlocked: true }));
    expect(lever).toEqual({ kind: 'stay', held: false });
  });

  it('offers nothing while the Mandate lands first', () => {
    expect(raceLever('mandate_first', world({ places, held }))).toBeNull();
  });
});

describe('THR-2254 — the place lever words', () => {
  it('names the place and the sphere, as runs that join to the line', () => {
    const lever = selectRaceLever(world({ shown: 'doom_first', places: [{ id: 'shrine_a', name: 'Ashford' }], held: { 'shrine_a|order': 4 } }));
    expect(lever).toMatchObject({ kind: 'place', placeId: 'shrine_a', sphere: 'order' });
    if (lever?.kind !== 'place') throw new Error('expected a place lever');
    expect(lever.line).toBe('Tend Ashford in Order to raise your Mandate.');
    expect(lever.runs.filter(r => r.slot).map(r => r.slot)).toEqual(['place', 'sphere']);
  });

  it('falls back to "a place" with no link when the place has no name', () => {
    const lever = selectRaceLever(world({ shown: 'doom_first', places: [{ id: 'shrine_a' }], held: { 'shrine_a|order': 4 } }));
    if (lever?.kind !== 'place') throw new Error('expected a place lever');
    expect(lever.line).toBe('Tend a place in Order to raise your Mandate.');
    expect(lever.runs.some(r => r.slot === 'place')).toBe(false);
  });

  it('every fallback joins cleanly, with no braces left', () => {
    for (const [s, p] of [['Order', 'Ashford'], ['Order', undefined], [undefined, 'Ashford'], [undefined, undefined], [' ', ' ']] as const) {
      const line = racePlaceLeverLine(s, p);
      expect(racePlaceLeverRuns(s, p).map(r => r.text).join('')).toBe(line);
      expect(line).not.toMatch(/[{}]/);
      expect(line.split(/\s+/).length).toBeLessThanOrEqual(15);
    }
    expect(racePlaceLeverLine(undefined, undefined)).toBe(RACE_LEVER_PLACE_BARE);
    expect(racePlaceLeverLine(undefined, 'Ashford')).toBe('Tend Ashford to raise your Mandate.');
  });

  it('Stay still reads as before when no place is held', () => {
    expect(selectRaceLever(world({ shown: 'stalled', unlocked: true }))).toEqual({ kind: 'stay', line: RACE_LEVER_STAY, button: DOOM_STAY_BUTTON });
  });
});
