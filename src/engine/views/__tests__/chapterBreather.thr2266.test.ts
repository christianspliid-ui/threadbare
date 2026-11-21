/**
 * THR-2266 — a quiet day on the map between chapters. After an Aftermath closes, the
 * first beat of a new chapter the world would open waits `CHAPTER_BREATHER_TICKS`
 * running ticks, and Needs you lists it as waiting so the player can open it early.
 */
import { describe, expect, it } from 'vitest';
import {
  CHAPTER_BREATHER_TICKS,
  chapterBreatherTicksLeft,
  chapterKeyOf,
  worldOpenedEncounterHeldBy,
} from '../interruptRegistry';
import {
  buildNeedsYou,
  chapterWaitingLine,
  needsYouStamp,
  NEEDS_YOU_PRODUCERS,
  type NeedsYouHeldChapter,
  type NeedsYouSources,
} from '../needsYou';
import { TICKS_PER_DAY } from '../../../data/attention-constants';

const quiet = { playerSurfaceOpen: false, recentInput: false, cardArmed: false };

function sources(heldChapter: NeedsYouHeldChapter | null): NeedsYouSources {
  return { currentTick: 40, beatOffer: null, receipts: [], namedPause: null, heldChapter, held: [], alerts: [] };
}

const chapter = (heldBy: NeedsYouHeldChapter['heldBy']): NeedsYouHeldChapter => ({
  notificationId: 'n_b1', agentId: 'agent_1', agentName: 'Maren', title: 'The Salt Road', heldBy, tick: 38,
});

describe('THR-2266 — the quiet day is one game day of running ticks', () => {
  it('is one game day', () => {
    expect(CHAPTER_BREATHER_TICKS).toBe(TICKS_PER_DAY);
  });

  it('counts down from the Aftermath close and stops at 0', () => {
    expect(chapterBreatherTicksLeft(null, 50)).toBe(0);
    expect(chapterBreatherTicksLeft(30, 30)).toBe(CHAPTER_BREATHER_TICKS);
    expect(chapterBreatherTicksLeft(30, 35)).toBe(CHAPTER_BREATHER_TICKS - 5);
    expect(chapterBreatherTicksLeft(30, 30 + CHAPTER_BREATHER_TICKS)).toBe(0);
    expect(chapterBreatherTicksLeft(30, 100)).toBe(0);
  });

  it('fails soft on a non-finite tick', () => {
    expect(chapterBreatherTicksLeft(Number.NaN, 30)).toBe(0);
    expect(chapterBreatherTicksLeft(30, Number.NaN)).toBe(0);
  });
});

describe('THR-2266 — worldOpenedEncounterHeldBy holds for the breather', () => {
  it("returns ['breather'] while ticks are left and [] at 0", () => {
    expect(worldOpenedEncounterHeldBy({ ...quiet, breatherTicksLeft: 7 })).toEqual(['breather']);
    expect(worldOpenedEncounterHeldBy({ ...quiet, breatherTicksLeft: 0 })).toEqual([]);
    expect(worldOpenedEncounterHeldBy(quiet)).toEqual([]);
  });

  it('a later step of an already-opened chapter is not held (the caller passes 0 for it)', () => {
    const opened = new Set([chapterKeyOf({ actionId: 'ua_7', agentId: 'agent_1', encounterId: 'enc_a' })]);
    const laterStep = { actionId: 'ua_7', agentId: 'agent_1', encounterId: 'enc_a' };
    const newChapter = { actionId: 'ua_9', agentId: 'agent_2', encounterId: 'enc_b' };
    const ticksLeft = chapterBreatherTicksLeft(30, 34);
    const passFor = (n: typeof laterStep) => (opened.has(chapterKeyOf(n)) ? 0 : ticksLeft);
    expect(worldOpenedEncounterHeldBy({ ...quiet, breatherTicksLeft: passFor(laterStep) })).toEqual([]);
    expect(worldOpenedEncounterHeldBy({ ...quiet, breatherTicksLeft: passFor(newChapter) })).toEqual(['breather']);
  });

  it('keys a chapter by its action, else by agent and encounter', () => {
    expect(chapterKeyOf({ actionId: 'ua_7', agentId: 'a', encounterId: 'e' })).toBe('action:ua_7');
    expect(chapterKeyOf({ agentId: 'a', encounterId: 'e' })).toBe('chapter:a|e');
  });
});

describe('THR-2266 — Needs you lists the held chapter as waiting', () => {
  it('has one chapter_waiting producer in the waiting group (Law 58)', () => {
    const producers = NEEDS_YOU_PRODUCERS.filter(p => p.id === 'chapter_waiting');
    expect(producers).toHaveLength(1);
    expect(producers[0].group).toBe('waiting');
  });

  it('yields one waiting row for a breather hold that opens the chapter', () => {
    const vm = buildNeedsYou(sources(chapter(['breather'])));
    const rows = vm.groups.waiting.filter(r => r.producer === 'chapter_waiting');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      opens: 'chapter', notificationId: 'n_b1', line: 'Maren — The Salt Road waits for you', after: false,
      navigationTarget: { kind: 'agent', agentId: 'agent_1' },
    });
    expect(vm.count).toBe(1);
  });

  it('yields a row for a card-armed hold too', () => {
    expect(buildNeedsYou(sources(chapter(['card_armed']))).groups.waiting).toHaveLength(1);
  });

  it('yields no row for the recent_input hold, so the row never flickers on a click', () => {
    expect(buildNeedsYou(sources(chapter(['recent_input']))).groups.waiting).toHaveLength(0);
    expect(buildNeedsYou(sources(chapter(['player_surface']))).groups.waiting).toHaveLength(0);
    expect(buildNeedsYou(sources(null)).total).toBe(0);
  });

  it('names an untitled chapter in words, never an id', () => {
    expect(chapterWaitingLine({ agentName: 'Maren', title: null })).toBe('Maren — a chapter waits for you');
  });

  it("the stamp changes when the held chapter's hold changes", () => {
    expect(needsYouStamp(sources(chapter(['breather'])))).not.toBe(needsYouStamp(sources(chapter(['recent_input']))));
    expect(needsYouStamp(sources(chapter(['breather'])))).not.toBe(needsYouStamp(sources(null)));
  });
});
