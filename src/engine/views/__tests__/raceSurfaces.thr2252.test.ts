/**
 * THR-2252 — the race on screen: the view model the five surfaces read (rail word,
 * Mandate block, Mandate / Doom dialogs, warm recap). Ticket 2 of
 * `Docs/plans/2026-11-19-thr-2246-the-player-can-read-the-race.md`.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import { selectRaceLever, selectRaceView, type MandateRowView } from '../subjects/godSheet';
import { mandateSummary } from '../godRail';
import { buildWarmRecap, snapshotWarmRecap, warmRecapLineText } from '../warmRecap';
import {
  RACE_FORECAST_LINES,
  RACE_LEVER_STAY,
  RACE_RAIL_WORDS,
  RACE_RECAP_CAME_INTO_VIEW_LEAD,
  RACE_RECAP_SHIFTED_LEAD,
  raceChapterLeverLine,
  raceChapterLeverRuns,
} from '../../../data/race-content';
import { DOOM_STAY_ACTIVE_LINE, DOOM_STAY_BUTTON, DOOM_STAY_TEMPLATE_ID } from '../../../data/doom-stay-content';
import { GOD_RAIL_SUMMARY_MAX_CH } from '../../../data/frame-content';
import type { RaceState } from '../../../types/mandate';
import type { GameState } from '../../../types/gameState';

function world(opts: { shown?: RaceState; forced?: RaceState; threaded?: string[]; unlocked?: boolean; stayHeld?: boolean } = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
  for (const id of opts.threaded ?? []) {
    graph.addNode({ id, type: 'actor', name: 'Kael Thornweaver', properties: {} });
    graph.addEdge({ id: `t_${id}`, source: 'asc', target: id, type: 'thread', properties: {} } as never);
  }
  return {
    graph,
    ascendantId: 'asc',
    tick: 400,
    recentEvents: [],
    unifiedActions: [],
    chapterArchive: [],
    controlEffects: opts.stayHeld
      ? [{ id: 'ce', templateId: DOOM_STAY_TEMPLATE_ID, ownerId: 'asc', targetNodeId: 'asc', active: true }]
      : [],
    unlockedActionIds: opts.unlocked ? [DOOM_STAY_TEMPLATE_ID] : [],
    mandateDefinition: {
      id: 'm', name: 'M', description: 'A hunger.', runtimeKind: 'sphere_growth', primarySphere: 'order', secondarySphere: 'mind',
      primaryTargetDelta: 1, secondaryTargetDelta: 1,
    },
    mandateState: {
      mandateId: 'm', currentStage: 'setup', progress: 0.3, completed: false, failed: false,
      primaryDelta: 0.2, secondaryDelta: 0.6,
      raceWatch: { samples: [], shown: opts.shown ?? 'hidden', seen: (opts.shown ?? 'hidden') !== 'hidden', ...(opts.forced ? { forced: opts.forced } : {}) },
    },
  } as unknown as GameState;
}

const row = (race: MandateRowView['race'], trend: MandateRowView['trend'] = 'steady') =>
  ({ race, trend } as unknown as MandateRowView);

describe('THR-2252 — selectRaceView', () => {
  it('is null while the race is hidden, so the surfaces keep their text', () => {
    expect(selectRaceView(world())).toBeNull();
    expect(selectRaceView({ mandateState: undefined } as GameState)).toBeNull();
  });

  it('reads the shown state as the plan\'s sentence and rail word', () => {
    for (const s of ['mandate_first', 'doom_first', 'close', 'stalled'] as const) {
      expect(selectRaceView(world({ shown: s }))).toEqual({ state: s, sentence: RACE_FORECAST_LINES[s], word: RACE_RAIL_WORDS[s] });
    }
  });

  it('reads the debug override over the settled state', () => {
    expect(selectRaceView(world({ shown: 'mandate_first', forced: 'close' }))?.state).toBe('close');
  });
});

describe('THR-2252 — the folded rail row', () => {
  it('trades the trend word for the race word while shown, and keeps it while hidden', () => {
    expect(mandateSummary(row(null, 'rising'))).toBe('Goal · Rising');
    expect(mandateSummary(row({ state: 'doom_first', sentence: '', word: 'Doom lands first' }))).toBe('Goal · Doom lands first');
    expect(mandateSummary(row({ state: 'mandate_first', sentence: '', word: 'Lands first' }))).toBe('Goal · Lands first');
    expect(mandateSummary(row({ state: 'close', sentence: '', word: 'Close finish' }))).toBe('Goal · Close finish');
  });

  it('the longest word fits the row cap, so it never falls back to the bare word', () => {
    for (const w of Object.values(RACE_RAIL_WORDS)) {
      expect(`Goal · ${w}`.length).toBeLessThanOrEqual(GOD_RAIL_SUMMARY_MAX_CH);
    }
  });
});

describe('THR-2252 — selectRaceLever', () => {
  it('names the chapter with the short sphere and the bound mortal, as runs that join to the line', () => {
    const lever = selectRaceLever(world({ shown: 'doom_first', threaded: ['kael'] }));
    expect(lever).toMatchObject({ kind: 'chapter', mortalId: 'kael', sphere: 'order' });
    if (lever?.kind !== 'chapter') throw new Error('expected a chapter lever');
    expect(lever.line).toBe(raceChapterLeverLine('Order', 'Kael Thornweaver'));
    expect(lever.line).toBe("Spend Order essence on Kael Thornweaver's chapters to raise your Mandate.");
    expect(lever.runs.filter(r => r.slot).map(r => r.slot)).toEqual(['sphere', 'mortal']);
  });

  it('offers Stay with THR-2240\'s button when no mortal is bound', () => {
    expect(selectRaceLever(world({ shown: 'stalled', unlocked: true }))).toEqual({ kind: 'stay', line: RACE_LEVER_STAY, button: DOOM_STAY_BUTTON });
  });

  it('shows the held line with no button once Stay is held', () => {
    expect(selectRaceLever(world({ shown: 'close', unlocked: true, stayHeld: true }))).toEqual({ kind: 'stay', line: DOOM_STAY_ACTIVE_LINE });
  });

  it('offers nothing while the Mandate lands first or the race is hidden', () => {
    expect(selectRaceLever(world({ shown: 'mandate_first', threaded: ['kael'], unlocked: true }))).toBeNull();
    expect(selectRaceLever(world({ threaded: ['kael'], unlocked: true }))).toBeNull();
  });
});

describe('THR-2252 — raceChapterLeverRuns', () => {
  it('joins to the same sentence as raceChapterLeverLine for every fallback', () => {
    const cases: Array<[string | undefined, string | undefined]> = [['Order', 'Kael'], ['Order', undefined], [undefined, 'Kael'], [undefined, undefined]];
    for (const [s, m] of cases) {
      expect(raceChapterLeverRuns(s, m).map(r => r.text).join('')).toBe(raceChapterLeverLine(s, m));
      expect(raceChapterLeverRuns(s, m).map(r => r.text).join('')).not.toMatch(/[{}]/);
    }
  });
});

describe('THR-2252 — the warm recap race line', () => {
  it('says "came into view" when the snapshot showed no race', () => {
    const gs = world();
    const before = snapshotWarmRecap(gs, null, { readBands: () => ({}) });
    gs.mandateState!.raceWatch = { samples: [], shown: 'doom_first', seen: true };
    const vm = buildWarmRecap(gs, before, { readBands: () => ({}) });
    const line = vm.lines.find(l => l.kind === 'race');
    expect(line && warmRecapLineText(line)).toBe(`${RACE_RECAP_CAME_INTO_VIEW_LEAD} ${RACE_FORECAST_LINES.doom_first}`);
  });

  it('says "shifted" when the shown state differs from the snapshot', () => {
    const gs = world({ shown: 'doom_first' });
    const before = snapshotWarmRecap(gs, null, { readBands: () => ({}) });
    gs.mandateState!.raceWatch = { samples: [], shown: 'close', seen: true };
    const line = buildWarmRecap(gs, before, { readBands: () => ({}) }).lines.find(l => l.kind === 'race');
    expect(line && warmRecapLineText(line)).toBe(`${RACE_RECAP_SHIFTED_LEAD} ${RACE_FORECAST_LINES.close}`);
  });

  it('draws no line when the race did not change, or is hidden now', () => {
    const same = world({ shown: 'close' });
    const before = snapshotWarmRecap(same, null, { readBands: () => ({}) });
    expect(buildWarmRecap(same, before, { readBands: () => ({}) }).lines.some(l => l.kind === 'race')).toBe(false);
    const gone = world({ shown: 'close' });
    const b2 = snapshotWarmRecap(gone, null, { readBands: () => ({}) });
    gone.mandateState!.raceWatch = { samples: [], shown: 'hidden', seen: true };
    expect(buildWarmRecap(gone, b2, { readBands: () => ({}) }).lines.some(l => l.kind === 'race')).toBe(false);
  });
});
