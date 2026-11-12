/**
 * THR-2197 — popups no longer open under the player's hand (cold playtest round 7).
 *
 * 1. Every world-pushed homed kind is an arrival; every other kind is named with a reason.
 * 2. A wheel or a pointer move stamps the quiet window, so a due arrival waits.
 * 3. The receipt (a dialog arrival) waits for quiet unless the player clicked it open.
 */
import { describe, it, expect } from 'vitest';
import { ARRIVAL_EXEMPT_REASONS, HOMED_SURFACES, type HomedSurfaceEntry } from '../../../data/homed-surfaces';
import {
  INTERRUPT_QUIET_AFTER_INPUT_MS,
  resolveInterrupts,
  type InterruptSnapshot,
} from '../interruptRegistry';
import {
  installQuietWindowStamp,
  QUIET_WINDOW_MOVE_THROTTLE_MS,
} from '../inputQuietWindow';

const entries = HOMED_SURFACES as readonly HomedSurfaceEntry[];

const closed: InterruptSnapshot = {
  interruptsSuppressed: false,
  encounterOpen: false,
  meetingPending: false,
  hasAscendantIdentity: true,
  premonitionPending: false,
  vignettePending: false,
  storyBeatPending: false,
  ascendantBeatEntered: false,
  choiceSetPending: false,
  emergenceDecisionPending: false,
  divineReceiptPending: false,
  momentPending: false,
  chapterLedgerOpen: false,
  courtOpen: false,
  popupQueued: false,
};
const snap = (over: Partial<InterruptSnapshot>): InterruptSnapshot => ({ ...closed, ...over });

describe('THR-2197 — which homed kinds are arrivals', () => {
  it('the world-pushed kinds named by round 7 are arrivals', () => {
    for (const kind of ['threading-rite', 'emergence-dilemma', 'divine-receipt']) {
      expect(entries.find(e => e.kind === kind)?.arrival, `${kind} must carry arrival: true`).toBe(true);
    }
  });

  it('every kind without arrival is listed with a reason, and no arrival is listed', () => {
    const nonArrivals = entries.filter(e => !e.arrival).map(e => e.kind).sort();
    const listed = Object.keys(ARRIVAL_EXEMPT_REASONS).sort();
    expect(listed, 'ARRIVAL_EXEMPT_REASONS (src/data/homed-surfaces.ts) must name exactly the non-arrival kinds').toEqual(nonArrivals);
    for (const [kind, reason] of Object.entries(ARRIVAL_EXEMPT_REASONS)) {
      expect(reason?.trim().length ?? 0, `${kind} needs a reason`).toBeGreaterThan(10);
    }
  });
});

describe('THR-2197 — a wheel or a pointer move holds a due arrival', () => {
  const makeStamp = () => {
    const target = new EventTarget();
    let clock = 10_000;
    let lastInputAt = 0;
    const detach = installQuietWindowStamp(target, at => { lastInputAt = at; }, () => clock);
    return {
      target,
      detach,
      advance: (ms: number) => { clock += ms; },
      recentInput: () => lastInputAt > 0 && clock - lastInputAt < INTERRUPT_QUIET_AFTER_INPUT_MS,
      lastInputAt: () => lastInputAt,
    };
  };

  it('a wheel inside the quiet window defers an emergence dilemma; it opens once input goes quiet', () => {
    const s = makeStamp();
    s.target.dispatchEvent(new Event('wheel'));
    expect(s.recentInput()).toBe(true);
    const held = resolveInterrupts(snap({ emergenceDecisionPending: true, recentInput: s.recentInput() }));
    expect(held.open).toEqual([]);
    expect(held.heldArrivals).toEqual([{ id: 'EmergenceDilemmaModal', heldBy: ['recent_input'] }]);
    expect(held.anyOpen).toBe(true); // a held arrival still holds the clock

    s.advance(INTERRUPT_QUIET_AFTER_INPUT_MS);
    const shown = resolveInterrupts(snap({ emergenceDecisionPending: true, recentInput: s.recentInput() }));
    expect(shown.open).toEqual(['EmergenceDilemmaModal']);
    s.detach();
  });

  it('a pointer move inside the quiet window defers a premonition', () => {
    const s = makeStamp();
    s.target.dispatchEvent(new Event('pointermove'));
    const r = resolveInterrupts(snap({ premonitionPending: true, recentInput: s.recentInput() }));
    expect(r.open).toEqual([]);
    expect(r.heldArrivals[0]?.heldBy).toContain('recent_input');
    s.detach();
  });

  it('pointer moves stamp at most once per throttle interval; clicks, keys and wheels every time', () => {
    const s = makeStamp();
    s.target.dispatchEvent(new Event('pointermove'));
    const first = s.lastInputAt();
    s.advance(QUIET_WINDOW_MOVE_THROTTLE_MS - 1);
    s.target.dispatchEvent(new Event('pointermove'));
    expect(s.lastInputAt()).toBe(first);
    s.advance(1);
    s.target.dispatchEvent(new Event('pointermove'));
    expect(s.lastInputAt()).toBe(first + QUIET_WINDOW_MOVE_THROTTLE_MS);
    for (const type of ['pointerdown', 'keydown', 'wheel']) {
      s.advance(1);
      s.target.dispatchEvent(new Event(type));
      expect(s.lastInputAt(), type).toBe(first + QUIET_WINDOW_MOVE_THROTTLE_MS + ['pointerdown', 'keydown', 'wheel'].indexOf(type) + 1);
    }
    s.detach();
  });

  it('scroll does not stamp (panels scroll themselves), and detach removes every listener', () => {
    const s = makeStamp();
    s.target.dispatchEvent(new Event('scroll'));
    expect(s.lastInputAt()).toBe(0);
    s.detach();
    s.target.dispatchEvent(new Event('wheel'));
    s.target.dispatchEvent(new Event('pointerdown'));
    expect(s.lastInputAt()).toBe(0);
  });
});

describe('THR-2197 — the threading rite and the receipt wait like arrivals', () => {
  it('a rite due under the hand waits; once on screen it keeps its place through input', () => {
    const held = resolveInterrupts(snap({ threadingRitePending: true, recentInput: true }));
    expect(held.open).toEqual([]);
    expect(held.heldArrivals).toEqual([{ id: 'ThreadingRite', heldBy: ['recent_input'] }]);
    const kept = resolveInterrupts(snap({ threadingRitePending: true, recentInput: true, alreadyShown: ['ThreadingRite'], foregroundIncumbent: 'threading-rite' }));
    expect(kept.open).toEqual(['ThreadingRite']);
  });

  it('a world-made receipt waits for quiet and for the player\'s own surfaces', () => {
    expect(resolveInterrupts(snap({ divineReceiptPending: true, recentInput: true })).open).toEqual([]);
    expect(resolveInterrupts(snap({ divineReceiptPending: true, playerSurfaceOpen: true })).heldArrivals)
      .toEqual([{ id: 'DivineReceiptModal', heldBy: ['player_surface'] }]);
    expect(resolveInterrupts(snap({ divineReceiptPending: true })).open).toEqual(['DivineReceiptModal']);
    // Once on screen it stays through input.
    expect(resolveInterrupts(snap({ divineReceiptPending: true, recentInput: true, alreadyShown: ['DivineReceiptModal'] })).open)
      .toEqual(['DivineReceiptModal']);
  });

  it('a receipt the player clicked open from its toast mounts at once, mid-input', () => {
    const r = resolveInterrupts(snap({ divineReceiptPending: true, recentInput: true, playerOpenedKinds: ['divine-receipt'] }));
    expect(r.open).toEqual(['DivineReceiptModal']);
    expect(r.heldArrivals).toEqual([]);
  });

  it('the receipt keeps its turn ahead of a later arrival, as before (review gate)', () => {
    const r = resolveInterrupts(snap({ divineReceiptPending: true, premonitionPending: true }));
    expect(r.open).toEqual(['DivineReceiptModal']);
    expect(r.heldArrivals.map(h => h.id)).toEqual(['PremonitionModal']);
  });

  it('a due rite still goes ahead of a pending receipt, as before (review gate round 2)', () => {
    const r = resolveInterrupts(snap({ threadingRitePending: true, divineReceiptPending: true }));
    expect(r.foreground).toBe('threading-rite');
    expect(r.open).toEqual(['ThreadingRite']);
  });

  it('the receipt still waits for a foreground already on screen', () => {
    const r = resolveInterrupts(snap({ divineReceiptPending: true, premonitionPending: true, alreadyShown: ['PremonitionModal'], foregroundIncumbent: 'premonition' }));
    expect(r.open).toEqual(['PremonitionModal']);
  });

  it('a rite on screen keeps its slot when the world opens a chapter (review gate: no unmount mid-rite)', () => {
    const r = resolveInterrupts(snap({
      threadingRitePending: true, encounterOpen: true,
      alreadyShown: ['ThreadingRite'], foregroundIncumbent: 'threading-rite',
    }));
    expect(r.foreground).toBe('threading-rite');
    expect(r.open).toContain('ThreadingRite');
  });

  it('a premonition on screen still steps back for a chapter, as THR-1853 settled', () => {
    const r = resolveInterrupts(snap({
      premonitionPending: true, encounterOpen: true,
      alreadyShown: ['PremonitionModal'], foregroundIncumbent: 'premonition',
    }));
    expect(r.foreground).toBe('encounter');
  });
});
