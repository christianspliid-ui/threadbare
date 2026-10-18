/**
 * THR-1893 — the Ledger rail's view model (frame plan § E1, § F7, Done when slice 1).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { ChronicleEntry } from '../../../types/narrative';
import { TICKS_PER_SEASON } from '../../../types/temporal';
import { readView } from '../readView';
import { getViewSelector } from '../selectors';
import { buildLedgerRail, ledgerRailSelector, worldMoodLine, emptyLedgerRail } from '../ledgerRail';
import { resolvedStatusLabel, selectThreadedChapters } from '../../threadedChapters';
import { WORLD_MOOD_LINES } from '../../../data/frame-content';
import { assertSerialisable } from './viewContract';

const YEAR = TICKS_PER_SEASON * 4;

function entry(id: string, tick: number): ChronicleEntry {
  return {
    id, tier: 'chronicle', title: id, prose: '',
    promptContext: { actors: [], location: '', sphere: 'life', mood: '' }, tick,
  } as ChronicleEntry;
}

function archived(actionId: string, resolvedTick: number, threaded = true) {
  return {
    actionId, templateId: 'encounter.deep_descent', templateName: `Chapter ${actionId}`, actorId: 'elara', actorName: 'Elara',
    targetId: 'elara', targetName: 'Elara', scale: 'personal', startTick: 0, resolvedTick, resolved: true,
    threaded, participants: [], openingProse: '', steps: [], outcome: 'success',
  };
}

function makeState(o: { tick?: number; entries?: ChronicleEntry[]; chapters?: ReturnType<typeof archived>[]; doomStage?: number; aggregate?: boolean } = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'elara', type: 'actor', name: 'Elara', properties: { actorType: 'individual' } });
  const tick = o.tick ?? 10;
  const totalSeasons = Math.floor(tick / TICKS_PER_SEASON);
  return {
    graph,
    ascendantId: 'asc',
    tick,
    clock: { currentTick: tick, ticksPerSeason: TICKS_PER_SEASON, season: totalSeasons % 4, year: Math.floor(totalSeasons / 4) },
    doomClock: { currentStage: o.doomStage ?? 1 },
    chronicleEntries: o.entries ?? [],
    unifiedActions: [],
    chapterArchive: o.chapters ?? [],
    worldSoul: o.aggregate === false ? {} : {
      aggregate: { totalBySphere: { spirit: 10 }, dominantSphere: 'spirit', entityCount: 4 },
    },
  } as unknown as GameState;
}

const ARGS = { seenChronicle: 0, seenLedger: 0, threadsWaiting: 0 };

describe('ledgerRail view model', () => {
  it('is registered and its fallback is plain data', () => {
    expect(getViewSelector('ledgerRail')).toBe(ledgerRailSelector);
    assertSerialisable(ledgerRailSelector.fallback(ARGS, 'resolver_threw'));
    assertSerialisable(buildLedgerRail(makeState({ entries: [entry('a', 1)] }), ARGS));
  });

  it('the World-Soul line: the dominant sphere sentence, banded, and the stage mood', () => {
    const vm = buildLedgerRail(makeState({ doomStage: 1 }), ARGS);
    expect(vm.worldSoul?.label).toBe('World-Soul');
    expect(vm.worldSoul?.sphere).toBe('spirit');
    expect(vm.worldSoul?.sentence.length).toBeGreaterThan(0);
    expect(WORLD_MOOD_LINES[1]).toContain(vm.worldSoul?.mood);
    expect(buildLedgerRail(makeState({ aggregate: false }), ARGS).worldSoul).toBeNull();
  });

  it('the mood line is stable across the 90 ticks of one season and moves with the season', () => {
    const seen = new Set<string>();
    for (let t = YEAR; t < YEAR + TICKS_PER_SEASON; t++) {
      seen.add(buildLedgerRail(makeState({ tick: t, doomStage: 2 }), ARGS).worldSoul!.mood);
    }
    expect(seen.size).toBe(1);
    expect(worldMoodLine(2, 1, 0)).not.toBe(worldMoodLine(2, 1, 1));
  });

  it('Now holds the current season and the three before it, newest first', () => {
    const now = 2 * YEAR + 10; // year 3, spring
    const entries = [entry('old', 10), entry('lastYearSpring', YEAR + 1), entry('lastYearSummer', YEAR + TICKS_PER_SEASON + 1), entry('lastYearWinter', YEAR + 3 * TICKS_PER_SEASON), entry('fresh', now - 1)];
    const vm = buildLedgerRail(makeState({ tick: now, entries }), ARGS);
    expect(vm.now.entryIds).toEqual(['fresh', 'lastYearWinter', 'lastYearSummer']);
    expect(vm.now.emptyLine).toBeNull();
    expect(buildLedgerRail(makeState({ tick: now, entries: [entry('old', 10)] }), ARGS).now.emptyLine).toBe('The world awaits...');
  });

  it('Years groups by calendar year, newest first, with counted labels; one year means no Years tab', () => {
    const one = buildLedgerRail(makeState({ entries: [entry('a', 1), entry('b', 2)] }), ARGS);
    expect(one.years).toHaveLength(1);
    const two = buildLedgerRail(makeState({ tick: YEAR + 5, entries: [entry('a', 1), entry('b', YEAR + 1), entry('c', YEAR + 2)] }), ARGS);
    expect(two.years.map(y => y.label)).toEqual(['Year 2 · 2 entries', 'Year 1 · 1 entry']);
    expect(two.years[0].entryIds).toEqual(['c', 'b']);
  });

  it('the Ledger tab lists the reader\'s own rows, newest first, the unread ones marked new', () => {
    const state = makeState({ tick: 500, chapters: [archived('c1', 100), archived('c2', 200), archived('c3', 300, false)] });
    const vm = buildLedgerRail(state, { ...ARGS, seenLedger: 1 });
    expect(vm.ledger.rows.map(r => r.recordId)).toEqual(selectThreadedChapters(state).map(r => r.key));
    expect(vm.ledger.rows.map(r => r.recordId)).toEqual(['c2', 'c1']);
    expect(vm.ledger.unread).toBe(1);
    expect(vm.ledger.rows.map(r => r.isNew)).toEqual([true, false]);
    expect(vm.ledger.rows[0].state).toBe(resolvedStatusLabel('success'));
    expect(vm.strip.ledger).toBe(1);
  });

  it('the strip counts: threads from the rail, chronicle since last seen, never negative', () => {
    const state = makeState({ entries: [entry('a', 1), entry('b', 2), entry('c', 3)] });
    const vm = buildLedgerRail(state, { seenChronicle: 1, seenLedger: 9, threadsWaiting: 2 });
    expect(vm.strip).toEqual({ threads: 2, chronicle: 2, ledger: 0 });
  });

  it('reads through readView and falls back on a throwing build', () => {
    const vm = readView(null, makeState(), ledgerRailSelector, ARGS);
    expect(vm.ledger.rows).toEqual([]);
    const broken = { ...makeState(), clock: undefined } as unknown as GameState;
    expect(readView(null, broken, ledgerRailSelector, ARGS)).toEqual(emptyLedgerRail());
  });
});
