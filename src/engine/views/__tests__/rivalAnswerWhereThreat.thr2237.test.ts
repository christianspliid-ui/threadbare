/**
 * THR-2237 — the answer to a rival is where the threat is.
 *
 * Done when (unit half):
 *  - the rival panel's answer line in both states;
 *  - the pressed place's Now line held / not held / window closed;
 *  - Rebuke first in the Act row only while rebukable;
 *  - the gift copy filled, and its fallback.
 * (The recap line is covered in `warmRecap.test.ts`.)
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { RivalDefinition, RivalState } from '../../../types/rival';
import type { WheelSlot } from '../../wheel';
import type { SectionResolverContext } from '../../detailPageResolvers';
import { createRivalState } from '../../rival';
import { TICKS_PER_DAY } from '../../../data/attention-constants';
import { RIVAL_REBUKE_WINDOW_DAYS } from '../../../data/rival-scheme-config';
import { RIVAL_REBUKE_TEMPLATE_ID } from '../../../data/rival-rebuke-content';
import { MILESTONE_BEAT_PRESENTATION, firstRebukeGiftCopy } from '../../../data/ascendant-milestone-beats';
import { MILESTONE_FIRST_REBUKE_BEAT_ID } from '../../../data/player-progression';
import {
  latestRebukableLanding,
  rivalAnswerInputs,
  rivalAnswerSegments,
  rivalPlaceNameLookup,
  rivalPressedOn,
  segmentsText,
} from '../rivalEntry';
import { PLACE_ROW_RESOLVERS } from '../subjects/placeRows';
import { rebukeFirst } from '../subjects/actOn';

const GOD = 'asc.test';
const DAY = TICKS_PER_DAY;
const NOW = DAY * 10;

const RIVAL = { id: 'rv1', name: 'The Hollow Warden', primarySphere: 'death', behavior: 'aggressive' } as unknown as RivalDefinition;
const RIVAL2 = { id: 'rv2', name: 'The Pale Tide', primarySphere: 'water', behavior: 'subtle' } as unknown as RivalDefinition;

function makeState(rivalStates: RivalState[], extra: Partial<GameState> = {}): GameState {
  const g = new WorldGraph();
  g.addNode({ id: GOD, type: 'actor', name: 'The Shepherd', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 't0', type: 'location', name: 'Ashford', properties: { locationSubtype: 'town' } });
  g.addNode({ id: 't1', type: 'location', name: 'Iron Glade', properties: { locationSubtype: 'town' } });
  return {
    graph: g, ascendantId: GOD, tick: NOW, seed: 42,
    rivalDefinitions: [RIVAL, RIVAL2], rivalStates, unifiedActions: [],
    ...extra,
  } as unknown as GameState;
}

function pressed(rivalId: string, placeId: string, tick: number): RivalState {
  return { ...createRivalState(rivalId), lastPressed: { placeId, tick } };
}

const HELD = { unlockedActionIds: [RIVAL_REBUKE_TEMPLATE_ID] };

describe('the rival panel answer line', () => {
  it('names the place when the god holds Rebuke and the landing is rebukable', () => {
    const state = makeState([pressed(RIVAL.id, 't0', NOW - DAY)], HELD);
    const segs = rivalAnswerSegments(state.rivalStates[0], rivalAnswerInputs(state), rivalPlaceNameLookup(state.graph));
    expect(segmentsText(segs)).toBe('Rebuke it at Ashford, or tend your places.');
    expect(segs).toContainEqual({ placeId: 't0', name: 'Ashford' });
  });

  it('keeps the tending line without Rebuke, with a closed window, or with no landing', () => {
    const tend = 'Places you tend shrug off its hand. Your seat, your threaded, a claim, or an anointed faction tends one.';
    const cases: GameState[] = [
      makeState([pressed(RIVAL.id, 't0', NOW - DAY)]),
      makeState([pressed(RIVAL.id, 't0', NOW - RIVAL_REBUKE_WINDOW_DAYS * DAY - 1)], HELD),
      makeState([createRivalState(RIVAL.id)], HELD),
    ];
    for (const state of cases) {
      const segs = rivalAnswerSegments(state.rivalStates[0], rivalAnswerInputs(state), rivalPlaceNameLookup(state.graph));
      expect(segmentsText(segs)).toBe(tend);
    }
  });
});

describe("the pressed place's Now line", () => {
  const ctx = (state: GameState, nodeId: string): SectionResolverContext =>
    ({ nodeId, pageKind: 'location', graph: state.graph, seed: 42, tick: state.tick, state } as unknown as SectionResolverContext);

  it('held: "{Rival} pressed it {when}." over the Rebuke answer, as the R5 highlight', () => {
    const state = makeState([pressed(RIVAL.id, 't0', NOW - DAY)], HELD);
    const row = PLACE_ROW_RESOLVERS.rival_pressed(ctx(state, 't0'));
    expect(row).not.toBeNull();
    expect(row && 'highlight' in row ? row.highlight : null).toEqual({ icon: 'rivals', headline: 'The Hollow Warden pressed it yesterday.' });
    expect(row && 'parts' in row ? row.parts?.join('') : '').toBe('Rebuke it here, or tend it, and its next blow is turned.');
  });

  it('not held: the tending answer', () => {
    const state = makeState([pressed(RIVAL.id, 't0', NOW)]);
    const row = PLACE_ROW_RESOLVERS.rival_pressed(ctx(state, 't0'));
    expect(row && 'highlight' in row ? row.highlight?.headline : null).toBe('The Hollow Warden pressed it today.');
    expect(row && 'parts' in row ? row.parts?.join('') : '').toBe('A place you tend turns its next blow.');
  });

  it('window closed, another place, or a Rebuke already in flight: no line', () => {
    const stale = makeState([pressed(RIVAL.id, 't0', NOW - RIVAL_REBUKE_WINDOW_DAYS * DAY - 1)], HELD);
    expect(PLACE_ROW_RESOLVERS.rival_pressed(ctx(stale, 't0'))).toBeNull();
    const fresh = makeState([pressed(RIVAL.id, 't0', NOW - DAY)], HELD);
    expect(PLACE_ROW_RESOLVERS.rival_pressed(ctx(fresh, 't1'))).toBeNull();
    const inFlight = makeState([pressed(RIVAL.id, 't0', NOW - DAY)], {
      ...HELD,
      unifiedActions: [{ templateId: RIVAL_REBUKE_TEMPLATE_ID, targetId: 't0', resolved: false }] as never,
    });
    expect(PLACE_ROW_RESOLVERS.rival_pressed(ctx(inFlight, 't0'))).toBeNull();
    expect(rivalPressedOn(inFlight, 't0')).toBeNull();
  });
});

describe('Rebuke leads the Act row only while rebukable', () => {
  const slots = [
    { id: 'loc.bless', templateId: 'loc.bless' },
    { id: 'loc.curse', templateId: 'loc.curse' },
    { id: RIVAL_REBUKE_TEMPLATE_ID, templateId: RIVAL_REBUKE_TEMPLATE_ID },
  ] as unknown as WheelSlot[];
  const cards = slots.map(s => ({ actionId: s.id }));

  it('moves Rebuke first on a rebukable place, keeping the rest in order', () => {
    const state = makeState([pressed(RIVAL.id, 't0', NOW - DAY)], HELD);
    expect(rebukeFirst(state, 't0', slots, cards).map(c => c.actionId))
      .toEqual([RIVAL_REBUKE_TEMPLATE_ID, 'loc.bless', 'loc.curse']);
  });

  it('leaves the order alone when the place is not rebukable', () => {
    const state = makeState([pressed(RIVAL.id, 't0', NOW - DAY)], HELD);
    expect(rebukeFirst(state, 't1', slots, cards)).toBe(cards);
    const closed = makeState([pressed(RIVAL.id, 't0', NOW - RIVAL_REBUKE_WINDOW_DAYS * DAY - 1)], HELD);
    expect(rebukeFirst(closed, 't0', slots, cards)).toBe(cards);
  });
});

describe('the Rebuke gift names the place and takes you there', () => {
  it('fills {rival} and {place} from the most recent rebukable landing', () => {
    const state = makeState([pressed(RIVAL.id, 't0', NOW - 2 * DAY), pressed(RIVAL2.id, 't1', NOW - DAY)], HELD);
    const landing = latestRebukableLanding(state);
    expect(landing).toMatchObject({ rivalName: 'The Pale Tide', placeId: 't1', placeName: 'Iron Glade' });
    const copy = firstRebukeGiftCopy(landing);
    expect(copy?.prose.startsWith('The Pale Tide has pressed its will on Iron Glade, and the place gave ground.')).toBe(true);
    expect(copy?.cta).toBe('Go to Iron Glade');
    expect(copy?.title).toBe(MILESTONE_BEAT_PRESENTATION[MILESTONE_FIRST_REBUKE_BEAT_ID].title);
    expect(copy?.prose).not.toMatch(/\{\w+\}/);
  });

  it('falls back to the authored copy with nothing left to rebuke', () => {
    const state = makeState([pressed(RIVAL.id, 't0', NOW - RIVAL_REBUKE_WINDOW_DAYS * DAY - 1)], HELD);
    expect(latestRebukableLanding(state)).toBeNull();
    expect(firstRebukeGiftCopy(null)).toBeNull();
    expect(firstRebukeGiftCopy({ rivalName: ' ', placeName: 'Ashford' })).toBeNull();
    expect(MILESTONE_BEAT_PRESENTATION[MILESTONE_FIRST_REBUKE_BEAT_ID].cta).toBe('Receive');
  });
});
