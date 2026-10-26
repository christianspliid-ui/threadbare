/**
 * THR-1837 — the god's screen fills one gift at a time: the pure selector, the
 * reveal table, the copy, and the CLI's unchanged tick-0 state.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import {
  selectOpeningReveal,
  releaseOpeningArrivals,
  readyQueuedSurfaces,
  applyArrivalLedger,
  seedArrivalLedger,
  firstChaptersClosedSince,
  EMPTY_ARRIVAL_LEDGER,
  type OpeningArrivalLedger,
} from '../openingReveal';
import { getFirstId } from '../meetingEncounter';
import {
  OPENING_REVEAL_TABLE,
  OPENING_REVEAL_CEILING_TICKS,
  OPENING_REVEAL_ARRIVAL_IDLE_TICKS,
  ATTENTION_GAUGE_SHOWN,
  publishOpeningArrivalLedger,
  readPublishedOpeningArrivalLedger,
  type OpeningRevealSurfaceId,
} from '../../data/opening-reveal-table';
import { ASCENDANT_SPINE, SPINE_BEAT_PRESENTATION } from '../../data/ascendant-beat-content';
import { isRoutineTemplate } from '../attentionCadence';
import {
  formatOpeningDirection,
  formatOpeningRevealToast,
} from '../../data/ui-content';
import { revealToastFor } from '../../components/Game/GameView/openingReveal';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';

const ENCOUNTER_ID = 'encounter.deep_descent';
const BOND_TICK = 10;

interface Opts {
  staged?: boolean;
  bonded?: boolean;
  tick?: number;
  resolvedBeats?: string[];
  spineCursor?: number;
  noBeats?: boolean;
  activeChapter?: boolean;
  resolvedChapter?: { tick: number; routine?: boolean };
  wokeAtTick?: number | null;
  rivalActed?: boolean;
}

function makeState(o: Opts = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'elara', type: 'actor', name: 'Elara', properties: { actorType: 'individual', gender: 'female' } });
  if (o.bonded !== false) {
    graph.addEdge({ id: 'e1', type: 'thread', source: 'asc', target: 'elara', properties: { courtPosition: 'the_first' } });
  }
  return {
    graph,
    ascendantId: 'asc',
    tick: o.tick ?? BOND_TICK + 5,
    openingRevealStaged: o.staged === false ? undefined : true,
    doomClock: { wokeAtTick: o.wokeAtTick === undefined ? BOND_TICK : o.wokeAtTick },
    ascendantBeats: o.noBeats ? undefined : {
      spineCursor: o.spineCursor ?? 1,
      pending: null,
      lastBeatTurn: 0,
      history: (o.resolvedBeats ?? ['beat.spine.opening']).map(beatId => ({
        beatId, kind: 'spine', resolvedTurn: 1, outcome: 'success', grantedActionIds: [], seededNodeIds: [],
      })),
    },
    unifiedActions: o.activeChapter
      ? [{ actionId: 'act-1', templateId: ENCOUNTER_ID, actorId: 'elara', resolved: false, currentStep: 0 }]
      : [],
    chapterArchive: o.resolvedChapter
      ? [{
          actionId: 'act-0', templateId: ENCOUNTER_ID, templateName: 'x', actorId: 'elara', actorName: 'Elara',
          targetId: 'elara', targetName: 'Elara', scale: 'personal', startTick: 0,
          resolvedTick: o.resolvedChapter.tick, resolved: true, threaded: true, participants: [],
          openingProse: '', steps: [], routine: o.resolvedChapter.routine,
        }]
      : [],
    rivalStates: o.rivalActed ? [{ interventionCount: 1 }] : [],
  } as unknown as GameState;
}

describe('OPENING_REVEAL_TABLE (THR-1837 C1)', () => {
  it('has 21 rows, one per surface (World Pulse retired, THR-1893; Dominion added, THR-1986; Rivals and two lenses, THR-2060)', () => {
    expect(OPENING_REVEAL_TABLE).toHaveLength(21);
    expect(new Set(OPENING_REVEAL_TABLE.map(r => r.surface)).size).toBe(21);
  });

  it('every gift beatId is a real ASCENDANT_SPINE id', () => {
    const spine = new Set(ASCENDANT_SPINE.map(b => b.beatId));
    for (const row of OPENING_REVEAL_TABLE) {
      if (row.trigger.kind === 'gift') expect(spine.has(row.trigger.beatId), row.surface).toBe(true);
    }
  });

  it('every staged row carries a label for the reveal line', () => {
    for (const row of OPENING_REVEAL_TABLE) {
      // THR-2060: the hidden Attention gauge has nothing to announce.
      if (row.surface === 'attention' && !ATTENTION_GAUGE_SHOWN) { expect(row.newLabel).toBeUndefined(); continue; }
      if (row.trigger.kind !== 'bond') expect(row.newLabel, row.surface).toBeTruthy();
    }
  });

  it('the test encounter is a non-routine chapter (fixture precondition)', () => {
    expect(isRoutineTemplate(ENCOUNTER_ID)).toBe(false);
  });
});

describe('selectOpeningReveal (THR-1837 E1)', () => {
  it('reads not_staged — the full screen — when the arrival did not stage it', () => {
    const r = selectOpeningReveal(makeState({ staged: false }));
    expect(r.staged).toBe(false);
    expect(Object.values(r.rows).every(x => x.revealed && x.reason === 'not_staged')).toBe(true);
    expect(r.direction.show).toBe(false);
  });

  it('before the bond keeps the bond rows and hides every later row (pre_bond)', () => {
    const r = selectOpeningReveal(makeState({ bonded: false, wokeAtTick: null }));
    expect(r.rows.hand).toEqual({ revealed: true, reason: 'pre_bond' });
    expect(r.rows.time_controls.revealed).toBe(true);
    expect(r.rows.doom).toEqual({ revealed: false, reason: 'pre_bond' });
    expect(r.rows.chapter_ledger.revealed).toBe(false);
    expect(r.direction.show).toBe(false);
  });

  it('right after the bond shows The First\'s screen and every gift row waits for its gift', () => {
    const r = selectOpeningReveal(makeState());
    for (const s of ['time_controls', 'identity', 'essence', 'hand', 'threads', 'chronicle', 'settings', 'read_threads'] as const) {
      expect(r.rows[s], s).toEqual({ revealed: true, reason: 'at_bond' });
    }
    // THR-1986: Attention waits for the first chapter, the first moment that draws on it.
    expect(r.rows.attention).toEqual({ revealed: false, reason: 'waiting:first_chapter' });
    expect(r.rows.doom).toEqual({ revealed: false, reason: 'waiting:beat.spine.the_seat' });
    expect(r.rows.mandate.reason).toBe('waiting:beat.spine.the_seat');
    expect(r.rows.investiture.reason).toBe('waiting:beat.spine.the_seat');
    expect(r.rows.notables.reason).toBe('waiting:beat.spine.the_first_word');
    for (const s of ['reaches', 'dominion', 'world_soul', 'omen'] as const) {
      expect(r.rows[s].reason, s).toBe('waiting:beat.spine.a_path_opens');
    }
    expect(r.rows.chapter_ledger).toEqual({ revealed: false, reason: 'waiting:first_chapter' });
  });

  it('The Seat brings Doom, Mandates and Investiture (gift:<beatId>)', () => {
    const r = selectOpeningReveal(makeState({ resolvedBeats: ['beat.spine.opening', 'beat.spine.the_seat'] }));
    expect(r.rows.doom).toEqual({ revealed: true, reason: 'gift:beat.spine.the_seat' });
    expect(r.rows.mandate.revealed && r.rows.investiture.revealed).toBe(true);
    expect(r.rows.notables.revealed).toBe(false);
  });

  it('The First\'s open chapter brings the Chapter Ledger and the chapter_waiting direction', () => {
    const r = selectOpeningReveal(makeState({ activeChapter: true }));
    expect(r.rows.chapter_ledger).toEqual({ revealed: true, reason: 'first_chapter' });
    // THR-1986: Attention arrives with the same chapter.
    expect(r.rows.attention).toEqual({ revealed: true, reason: 'first_chapter' });
    expect(r.direction).toEqual({ show: true, mode: 'chapter_waiting', firstId: 'elara', chapterActionId: 'act-1' });
  });

  it('the direction line reads let_time_run with no open chapter, and clears once a post-bond chapter resolves', () => {
    expect(selectOpeningReveal(makeState()).direction).toMatchObject({ show: true, mode: 'let_time_run' });
    const done = selectOpeningReveal(makeState({ resolvedChapter: { tick: BOND_TICK + 3 } }));
    expect(done.direction.show).toBe(false);
    expect(done.rows.chapter_ledger.revealed).toBe(true);
  });

  it('a pre-bond or routine chapter does not clear the direction line', () => {
    expect(selectOpeningReveal(makeState({ resolvedChapter: { tick: BOND_TICK - 1 } })).direction.show).toBe(true);
    expect(selectOpeningReveal(makeState({ resolvedChapter: { tick: BOND_TICK + 3, routine: true } })).direction.show).toBe(true);
  });

  it('the ceiling reveals every staged row OPENING_REVEAL_CEILING_TICKS after the bond', () => {
    const before = selectOpeningReveal(makeState({ tick: BOND_TICK + OPENING_REVEAL_CEILING_TICKS - 1 }));
    expect(before.rows.omen.revealed).toBe(false);
    const at = selectOpeningReveal(makeState({ tick: BOND_TICK + OPENING_REVEAL_CEILING_TICKS }));
    expect(at.rows.omen).toEqual({ revealed: true, reason: 'ceiling' });
    expect(at.rows.chapter_ledger.reason).toBe('ceiling');
    expect(at.direction.show).toBe(false);
  });

  it('counts from now on the one render between the bond and the doom wake', () => {
    const r = selectOpeningReveal(makeState({ wokeAtTick: null, tick: 500 }));
    expect(r.rows.doom.reason).toBe('waiting:beat.spine.the_seat');
  });

  it('A path opens brings Dominion with the Reaches (THR-1986), and not before', () => {
    const before = selectOpeningReveal(makeState({ resolvedBeats: ['beat.spine.opening', 'beat.spine.the_seat'] }));
    expect(before.rows.dominion.revealed).toBe(false);
    const r = selectOpeningReveal(makeState({ resolvedBeats: ['beat.spine.opening', 'beat.spine.a_path_opens'] }));
    expect(r.rows.dominion).toEqual({ revealed: true, reason: 'gift:beat.spine.a_path_opens' });
    expect(r.rows.reaches.revealed).toBe(true);
    expect(revealToastFor(new Set(['reaches', 'dominion', 'world_soul', 'omen']), r))
      .toBe('New beside the map: your Reaches, Dominion, the World-Soul and Omens. What you can do, and how well. Each Reach grows as you use it.');
  });

  it('spine_done reveals gift rows once the spine is finished by any route', () => {
    const r = selectOpeningReveal(makeState({ spineCursor: -1 }));
    expect(r.rows.reaches).toEqual({ revealed: true, reason: 'spine_done' });
  });

  it('no_beat_state reveals gift rows when the Director state is absent', () => {
    const r = selectOpeningReveal(makeState({ noBeats: true }));
    expect(r.rows.notables).toEqual({ revealed: true, reason: 'no_beat_state' });
  });

  it('"Show every panel" reveals every row at once', () => {
    const r = selectOpeningReveal(makeState(), { showAll: true });
    expect(r.showAll).toBe(true);
    expect(Object.values(r.rows).every(x => x.revealed)).toBe(true);
    expect(r.direction.show).toBe(true);
  });

  it('fails soft to the full screen on an unreadable state', () => {
    const broken = { ...makeState(), graph: null } as unknown as GameState;
    const r = selectOpeningReveal(broken);
    expect(Object.values(r.rows).every(x => x.revealed && x.reason === 'not_staged')).toBe(true);
    expect(r.direction.show).toBe(false);
  });

  it('a First lost after the bond keeps the waiting rows and the ceiling, not pre_bond', () => {
    const lost = selectOpeningReveal(makeState({ bonded: false, wokeAtTick: BOND_TICK }));
    expect(lost.rows.notables).toEqual({ revealed: false, reason: 'waiting:beat.spine.the_first_word' });
    expect(lost.direction.show).toBe(false);
    const late = selectOpeningReveal(makeState({ bonded: false, wokeAtTick: BOND_TICK, tick: BOND_TICK + OPENING_REVEAL_CEILING_TICKS }));
    expect(late.rows.notables).toEqual({ revealed: true, reason: 'ceiling' });
    expect(late.rows.chapter_ledger.reason).toBe('ceiling');
  });

  it('getFirstId reads the the_first thread edge', () => {
    expect(getFirstId(makeState().graph, 'asc')).toBe('elara');
    expect(getFirstId(makeState({ bonded: false }).graph, 'asc')).toBeNull();
  });
});

describe('opening reveal copy (THR-1837 C2–C4)', () => {
  it('The Seat names the Doom and the mandates, verbatim', () => {
    expect(SPINE_BEAT_PRESENTATION['beat.spine.the_seat'].prose.endsWith(
      'tide after patient tide. You will need it. This age has begun its slow slide toward its Doom, and every mandate you keep well blunts its blows.',
    )).toBe(true);
  });

  it('A Path Opens names omens, verbatim', () => {
    expect(SPINE_BEAT_PRESENTATION['beat.spine.a_path_opens'].prose).toContain(
      'the prophet writes warnings across the waking sky, the omens every god must learn to read; the patron',
    );
  });

  it('the direction line names The First with her pronoun and never leaks a token', () => {
    expect(formatOpeningDirection('chapter_waiting', 'Elara', 'her')).toBe('Watch over Elara. A chapter of her story is waiting →');
    expect(formatOpeningDirection('let_time_run', 'Elara', 'her')).toBe('Watch over Elara. Let time run, and her next chapter will come to you.');
    expect(formatOpeningDirection('let_time_run', undefined, 'their')).toBe('Watch over The First. Let time run, and their next chapter will come to you.');
  });

  it('one merged reveal line per render, labels in table order', () => {
    const r = selectOpeningReveal(makeState({ activeChapter: true, resolvedBeats: ['beat.spine.opening', 'beat.spine.the_seat'] }));
    expect(revealToastFor(new Set(['investiture', 'doom', 'mandate']), r))
      .toBe("New beside the map: Doom, Mandates and Investiture. A slow clock toward the world's end. It cannot end the world early.");
    expect(revealToastFor(new Set(['chapter_ledger', 'doom', 'mandate', 'investiture']), r))
      .toBe('New beside the map: the Chapter Ledger, Doom, Mandates and Investiture. Every chapter The First has closed, kept to read again.');
    // THR-2060: the hidden Attention gauge brings no label.
    expect(revealToastFor(new Set(['attention', 'chapter_ledger']), r))
      .toBe('New beside the map: the Chapter Ledger. Every chapter The First has closed, kept to read again.');
    expect(formatOpeningRevealToast(['Doom'], false)).toBe('New beside the map: Doom.');
    expect(formatOpeningRevealToast([], false)).toBeNull();
  });

  it('a ceiling reveal says nothing more is hidden', () => {
    // THR-2060: Rivals wait for a rival's act even past the ceiling, so one has acted here.
    const r = selectOpeningReveal(makeState({ tick: BOND_TICK + OPENING_REVEAL_CEILING_TICKS, rivalActed: true }));
    expect(revealToastFor(new Set(['notables', 'reaches', 'world_soul', 'omen']), r))
      .toBe('New beside the map: Notables, your Reaches, the World-Soul and Omens. The people this world talks about. Some may be worth a thread. Nothing more is hidden.');
  });

  it('THR-2060: a queued ceiling arrival says nothing more is hidden only once the queue is empty', () => {
    const r = selectOpeningReveal(makeState({ tick: BOND_TICK + OPENING_REVEAL_CEILING_TICKS, rivalActed: true }));
    const ready = readyQueuedSurfaces(r);
    const partial = applyArrivalLedger(r, seedArrivalLedger(ready.slice(0, 1), 300));
    expect(revealToastFor(new Set([ready[0]]), partial)).not.toContain('Nothing more is hidden');
    const all = applyArrivalLedger(r, seedArrivalLedger(ready, 300));
    expect(revealToastFor(new Set(['lens_trade']), all))
      .toBe('New beside the map: the Trade lens. Lights the trade roads and what moves along them. Nothing more is hidden.');
  });

  it("THR-2060: each arrival toast ends with that row's caption", () => {
    const r = selectOpeningReveal(makeState({ rivalActed: true }));
    expect(revealToastFor(new Set(['doom']), r)).toBe("New beside the map: Doom. A slow clock toward the world's end. It cannot end the world early.");
    expect(revealToastFor(new Set(['rivals']), r)).toBe('New beside the map: Rivals. Other gods at work in this world. They watch for your hand.');
    expect(revealToastFor(new Set(['mandate']), r)).toBe('New beside the map: Mandates. What you are working toward. Win it before the doom runs out.');
    expect(revealToastFor(new Set(['investiture']), r)).toBe('New beside the map: Investiture. Your divine court: the mortals you raise to act in your name.');
    expect(revealToastFor(new Set(['lens_threads']), r)).toBe('New beside the map: the Threads lens. Lights where your threads run.');
    expect(revealToastFor(new Set(['reaches', 'dominion']), r))
      .toBe('New beside the map: your Reaches and Dominion. What you can do, and how well. Each Reach grows as you use it.');
  });
});

describe('the arrival queue (THR-2060 E1–E2)', () => {
  const at = (tick: number, chapters: number[] = []) => ({
    tick,
    chaptersClosedSince: (t: number) => chapters.filter(c => c > t).length,
  });
  const arrivedOf = (l: OpeningArrivalLedger) => Object.keys(l.arrived).sort();

  it('three rows ready at once arrive on three successive chapter closes', () => {
    const ready: OpeningRevealSurfaceId[] = ['doom', 'mandate', 'investiture'];
    let l = releaseOpeningArrivals(EMPTY_ARRIVAL_LEDGER, ready, at(20));
    expect(arrivedOf(l)).toEqual(['doom']);
    expect(releaseOpeningArrivals(l, ready, at(21))).toBe(l);
    l = releaseOpeningArrivals(l, ready, at(26, [25]));
    expect(arrivedOf(l)).toEqual(['doom', 'mandate']);
    expect(releaseOpeningArrivals(l, ready, at(27, [25]))).toBe(l);
    l = releaseOpeningArrivals(l, ready, at(31, [25, 30]));
    expect(l.arrived).toEqual({ doom: 20, mandate: 26, investiture: 31 });
  });

  it('with no chapter, the next row arrives after OPENING_REVEAL_ARRIVAL_IDLE_TICKS', () => {
    const ready: OpeningRevealSurfaceId[] = ['doom', 'mandate'];
    const l = releaseOpeningArrivals(EMPTY_ARRIVAL_LEDGER, ready, at(20));
    expect(releaseOpeningArrivals(l, ready, at(20 + OPENING_REVEAL_ARRIVAL_IDLE_TICKS - 1))).toBe(l);
    expect(arrivedOf(releaseOpeningArrivals(l, ready, at(20 + OPENING_REVEAL_ARRIVAL_IDLE_TICKS)))).toEqual(['doom', 'mandate']);
  });

  it('dominion arrives in the same step as reaches', () => {
    const ready: OpeningRevealSurfaceId[] = ['reaches', 'dominion', 'world_soul'];
    const l = releaseOpeningArrivals(EMPTY_ARRIVAL_LEDGER, ready, at(40));
    expect(l.arrived).toEqual({ reaches: 40, dominion: 40 });
    // Dominion never leads while its partner waits, whatever the list order.
    expect(releaseOpeningArrivals(EMPTY_ARRIVAL_LEDGER, ['dominion', 'reaches'], at(40)).arrived).toEqual({ reaches: 40, dominion: 40 });
  });

  it('past the ceiling every row is ready, and they still arrive one per step', () => {
    const r = selectOpeningReveal(makeState({ tick: BOND_TICK + OPENING_REVEAL_CEILING_TICKS }));
    const ready = readyQueuedSurfaces(r);
    // Rivals are not ready without a rival's act, ceiling or not (review-gate round 1).
    expect(ready).toEqual(['chapter_ledger', 'notables', 'reaches', 'dominion', 'doom', 'mandate', 'investiture', 'lens_threads', 'world_soul', 'omen', 'lens_trade']);
    expect(r.rows.rivals).toEqual({ revealed: false, reason: 'waiting:rival_acted' });
    // With every other row arrived, Rivals still waiting means the ceiling line cannot claim nothing is hidden.
    const allButRivals = applyArrivalLedger(r, seedArrivalLedger(ready, 300));
    expect(revealToastFor(new Set(['lens_trade']), allButRivals)).not.toContain('Nothing more is hidden');
    let l = releaseOpeningArrivals(EMPTY_ARRIVAL_LEDGER, ready, at(210));
    expect(arrivedOf(l)).toEqual(['chapter_ledger']);
    expect(releaseOpeningArrivals(l, ready, at(211))).toBe(l);
    l = releaseOpeningArrivals(l, ready, at(212, [211]));
    expect(arrivedOf(l)).toEqual(['chapter_ledger', 'notables']);
    const read = applyArrivalLedger(r, l);
    expect(read.rows.notables).toEqual({ revealed: true, reason: 'queued', readyReason: 'ceiling' });
    expect(read.rows.omen).toEqual({ revealed: false, reason: 'waiting:queue', readyReason: 'ceiling' });
    expect(read.queued[0]).toBe('reaches');
  });

  it('after the_seat resolves, doom, mandate and investiture are queued and arrive on separate chapter closes', () => {
    const base = makeState({ activeChapter: true, resolvedBeats: ['beat.spine.opening', 'beat.spine.the_seat'] });
    let l: OpeningArrivalLedger = seedArrivalLedger(['chapter_ledger'], BOND_TICK + 5);
    const read = () => selectOpeningReveal(base, { ledger: l });
    expect(read().queued).toEqual(['doom', 'mandate', 'investiture', 'lens_threads']);
    expect(read().rows.doom).toEqual({ revealed: false, reason: 'waiting:queue', readyReason: 'gift:beat.spine.the_seat' });
    const chapters: number[] = [];
    for (let tick = BOND_TICK + 10; tick <= BOND_TICK + 20; tick += 5) {
      chapters.push(tick - 1);
      l = releaseOpeningArrivals(l, readyQueuedSurfaces(selectOpeningReveal(base)), at(tick, chapters));
    }
    expect(new Set([l.arrived.doom, l.arrived.mandate, l.arrived.investiture]).size).toBe(3);
    expect(read().rows.investiture.reason).toBe('queued');
    expect(read().queued).toEqual(['lens_threads']);
  });

  it('Rivals become ready only after a rival has acted', () => {
    expect(selectOpeningReveal(makeState()).rows.rivals).toEqual({ revealed: false, reason: 'waiting:rival_acted' });
    expect(selectOpeningReveal(makeState({ rivalActed: true })).rows.rivals).toEqual({ revealed: true, reason: 'rival_acted' });
  });

  it('the Trade lens waits for the ceiling alone', () => {
    expect(selectOpeningReveal(makeState({ spineCursor: -1 })).rows.lens_trade).toEqual({ revealed: false, reason: 'waiting:ceiling' });
  });

  it('the published ledger lets readers outside the screen (the Dominion row) see arrival, not readiness', () => {
    const s = makeState({ resolvedBeats: ['beat.spine.opening', 'beat.spine.a_path_opens'] });
    expect(readPublishedOpeningArrivalLedger()).toBeNull();
    publishOpeningArrivalLedger(seedArrivalLedger(['chapter_ledger'], BOND_TICK));
    try {
      const ledger = readPublishedOpeningArrivalLedger() ?? undefined;
      expect(selectOpeningReveal(s, { ledger }).rows.dominion).toEqual({ revealed: false, reason: 'waiting:queue', readyReason: 'gift:beat.spine.a_path_opens' });
    } finally {
      publishOpeningArrivalLedger(null);
    }
    expect(selectOpeningReveal(s, { ledger: readPublishedOpeningArrivalLedger() ?? undefined }).rows.dominion.revealed).toBe(true);
  });

  it('a reload is not an arrival: rows ready at the first read have all arrived', () => {
    expect(seedArrivalLedger(['doom', 'mandate'], 50)).toEqual({ arrived: { doom: 50, mandate: 50 }, lastArrivalTick: 50 });
    expect(seedArrivalLedger([], 50)).toBe(EMPTY_ARRIVAL_LEDGER);
  });

  it('without a ledger, or with Show every panel, every ready row shows (CLI and fixtures unchanged)', () => {
    const s = makeState({ resolvedBeats: ['beat.spine.opening', 'beat.spine.the_seat'] });
    expect(selectOpeningReveal(s).rows.doom.revealed).toBe(true);
    expect(selectOpeningReveal(s, { showAll: true, ledger: EMPTY_ARRIVAL_LEDGER }).rows.doom.revealed).toBe(true);
    expect(selectOpeningReveal(s, { ledger: EMPTY_ARRIVAL_LEDGER }).rows.doom.revealed).toBe(false);
  });

  it("counts only The First's non-routine chapters closed after the tick", () => {
    const s = makeState({ resolvedChapter: { tick: 30 } });
    expect(firstChaptersClosedSince(s, 'elara', 29)).toBe(1);
    expect(firstChaptersClosedSince(s, 'elara', 30)).toBe(0);
    expect(firstChaptersClosedSince(s, null, 0)).toBe(0);
    expect(firstChaptersClosedSince(makeState({ resolvedChapter: { tick: 30, routine: true } }), 'elara', 0)).toBe(0);
  });

});

describe('the CLI tick-0 state is unchanged (THR-1837 E2)', () => {
  it('initializeGameState never sets openingRevealStaged', () => {
    const preset = MAP_SIZE_PRESETS.small;
    const archetype = generateArchetypes(4, 42)[0];
    const { state } = initializeGameState(archetype, 'Reveal', createBalancedCosmology(), 42, preset.cols, preset.rows);
    expect('openingRevealStaged' in state).toBe(false);
    expect(selectOpeningReveal(state).staged).toBe(false);
  });
});
