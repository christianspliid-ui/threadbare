/**
 * THR-1837 — the god's screen fills one gift at a time: the pure selector, the
 * reveal table, the copy, and the CLI's unchanged tick-0 state.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import { selectOpeningReveal } from '../openingReveal';
import { getFirstId } from '../meetingEncounter';
import {
  OPENING_REVEAL_TABLE,
  OPENING_REVEAL_CEILING_TICKS,
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
  } as unknown as GameState;
}

describe('OPENING_REVEAL_TABLE (THR-1837 C1)', () => {
  it('has 18 rows, one per surface (World Pulse retired, THR-1893; Dominion added, THR-1986)', () => {
    expect(OPENING_REVEAL_TABLE).toHaveLength(18);
    expect(new Set(OPENING_REVEAL_TABLE.map(r => r.surface)).size).toBe(18);
  });

  it('every gift beatId is a real ASCENDANT_SPINE id', () => {
    const spine = new Set(ASCENDANT_SPINE.map(b => b.beatId));
    for (const row of OPENING_REVEAL_TABLE) {
      if (row.trigger.kind === 'gift') expect(spine.has(row.trigger.beatId), row.surface).toBe(true);
    }
  });

  it('every staged row carries a label for the reveal line', () => {
    for (const row of OPENING_REVEAL_TABLE) {
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
      .toBe('New beside the map: your Reaches, Dominion, the World-Soul and Omens.');
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
    expect(revealToastFor(new Set(['investiture', 'doom', 'mandate']), r)).toBe('New beside the map: Doom, Mandates and Investiture.');
    expect(revealToastFor(new Set(['chapter_ledger', 'doom', 'mandate', 'investiture']), r))
      .toBe('New beside the map: the Chapter Ledger, Doom, Mandates and Investiture.');
    expect(revealToastFor(new Set(['attention', 'chapter_ledger']), r))
      .toBe('New beside the map: Attention and the Chapter Ledger.');
    expect(formatOpeningRevealToast([], false)).toBeNull();
  });

  it('a ceiling reveal says nothing more is hidden', () => {
    const r = selectOpeningReveal(makeState({ tick: BOND_TICK + OPENING_REVEAL_CEILING_TICKS }));
    expect(revealToastFor(new Set(['notables', 'reaches', 'world_soul', 'omen']), r))
      .toBe('New beside the map: Notables, your Reaches, the World-Soul and Omens. Nothing more is hidden.');
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
