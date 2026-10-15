/**
 * THR-1877 — the hold rule: one foreground, the rest held and named (plan § D2).
 *
 * One test per row of D2's scenario table, plus R4's facts: what keeps a dialog from
 * arriving over an open moment from elsewhere. The registry's own file
 * (`interruptRegistry.test.ts`) keeps today's cases, unchanged.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { resolveInterrupts, type InterruptSnapshot } from '../interruptRegistry';
import { resolveGiftDelivery } from '../giftDelivery';

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

describe('the hold rule (THR-1877 § D2) — scenario table', () => {
  it('an encounter and a premonition arrive: the encounter takes the Stage, the premonition is held, then opens', () => {
    const r = resolveInterrupts(snap({ encounterOpen: true, premonitionPending: true }));
    expect(r.rendering).toEqual(['encounter']);
    expect(r.foreground).toBe('encounter');
    expect(r.stage).toBe('encounter');
    expect(r.held).toEqual([{ kind: 'premonition', surfaceId: 'PremonitionModal', behind: 'encounter' }]);
    expect(r.anyOpen).toBe(true);
    const after = resolveInterrupts(snap({ premonitionPending: true, foregroundIncumbent: 'encounter' }));
    expect(after.rendering).toEqual(['premonition']);
    expect(after.held).toEqual([]);
  });

  it("an encounter and the day's offering arrive: the gift waits while the encounter is open", () => {
    const r = resolveInterrupts(snap({ encounterOpen: true }));
    const gift = resolveGiftDelivery({
      pendingBeatId: 'beat.spine.the_seat', isSpine: true, isArrivalBeat: false,
      suppressed: false, journeyVignettePending: false,
      otherInterruptsOpen: r.open, playerSurfacesOpen: [],
      msSinceLastInput: 60_000, atResumeBoundary: true,
    });
    expect(gift.enter).toBe(false);
  });

  it('a story beat is open and a thread lands: the rite waits (R2)', () => {
    const r = resolveInterrupts(snap({ storyBeatPending: true, threadingRitePending: true, foregroundIncumbent: 'story-beat' }));
    expect(r.rendering).toEqual(['story-beat']);
    expect(r.held.map(h => [h.kind, h.behind])).toEqual([['threading-rite', 'story-beat']]);
  });

  it('an aftermath closes with a rite and a story beat waiting: the rite goes first (ceremony outranks the Stage)', () => {
    const r = resolveInterrupts(snap({ storyBeatPending: true, threadingRitePending: true }));
    expect(r.rendering).toEqual(['threading-rite']);
    expect(r.foreground).toBe('threading-rite');
    expect(r.stage).toBeNull();
    expect(r.held.map(h => h.kind)).toEqual(['story-beat']);
  });

  it('an encounter is open when Meet the First becomes pending: the encounter keeps the Stage, the meeting plays after', () => {
    const r = resolveInterrupts(snap({ encounterOpen: true, meetingPending: true, foregroundIncumbent: 'encounter' }));
    expect(r.rendering).toEqual(['encounter']);
    expect(r.held.map(h => [h.kind, h.behind])).toEqual([['meet-the-first', 'encounter']]);
    const after = resolveInterrupts(snap({ meetingPending: true, foregroundIncumbent: 'encounter' }));
    expect(after.rendering).toEqual(['meet-the-first']);
  });

  it('an encounter is open when the cycle ends: the harvest is held behind it and keeps the clock stopped', () => {
    const r = resolveInterrupts(snap({ encounterOpen: true, cycleHarvestPending: true, foregroundIncumbent: 'encounter' }));
    expect(r.rendering).toEqual(['encounter']);
    expect(r.held.map(h => h.kind)).toEqual(['cycle-harvest']);
    const after = resolveInterrupts(snap({ cycleHarvestPending: true, foregroundIncumbent: 'encounter' }));
    expect(after.rendering).toEqual(['cycle-harvest']);
    // The harvest does not stop the clock itself (unchanged).
    expect(after.open).toEqual([]);
  });

  it('an encounter and a modal receipt arrive: the receipt is held and opens when the encounter closes (R4, R5)', () => {
    const r = resolveInterrupts(snap({ encounterOpen: true, divineReceiptPending: true }));
    expect(r.rendering).toEqual(['encounter']);
    expect(r.open).toEqual(['EncounterVeil']);
    expect(r.held).toEqual([{ kind: 'divine-receipt', surfaceId: 'DivineReceiptModal', behind: 'encounter' }]);
    expect(r.anyOpen).toBe(true);
    const after = resolveInterrupts(snap({ divineReceiptPending: true, foregroundIncumbent: 'encounter' }));
    expect(after.rendering).toEqual(['divine-receipt']);
  });

  it('an undertaking moment is showing when a receipt arrives: the moment keeps the Stage, the receipt opens after', () => {
    const r = resolveInterrupts(snap({ momentPending: true, divineReceiptPending: true, alreadyShown: ['MomentCard'] }));
    expect(r.rendering).toEqual(['undertaking-moment']);
    expect(r.momentMayRender).toBe(true);
    expect(r.held.map(h => h.kind)).toEqual(['divine-receipt']);
  });

  it('a receipt with nothing on screen opens as a dialog', () => {
    const r = resolveInterrupts(snap({ divineReceiptPending: true }));
    expect(r.rendering).toEqual(['divine-receipt']);
    expect(r.foreground).toBeNull();
  });

  it('a minimised encounter frees the slot: held surfaces take it in list order', () => {
    const r = resolveInterrupts(snap({ premonitionPending: true, storyBeatPending: true, foregroundIncumbent: 'encounter' }));
    expect(r.rendering).toEqual(['premonition']);
    expect(r.held.map(h => h.kind)).toEqual(['story-beat']);
  });

  it('a popup queued while anything is open waits, named', () => {
    const r = resolveInterrupts(snap({ encounterOpen: true, popupQueued: true }));
    expect(r.rendering).toEqual(['encounter']);
    expect(r.popupMayRender).toBe(false);
    expect(r.held.map(h => h.kind)).toEqual(['event-popup']);
  });

  it('dialogs render over the foreground (R4): an open encounter and the ledger both render', () => {
    const r = resolveInterrupts(snap({ encounterOpen: true, chapterLedgerOpen: true }));
    expect(r.rendering).toEqual(['encounter', 'chapter-ledger']);
    expect(r.foreground).toBe('encounter');
  });

  it('two foreground surfaces never render together', () => {
    const flags: Array<Partial<InterruptSnapshot>> = [
      { encounterOpen: true }, { meetingPending: true }, { threadingRitePending: true },
      { emergenceDecisionPending: true }, { cycleHarvestPending: true }, { premonitionPending: true },
      { storyBeatPending: true }, { vignettePending: true }, { momentPending: true },
    ];
    for (const a of flags) {
      for (const b of flags) {
        const r = resolveInterrupts(snap({ ...a, ...b }));
        const fg = r.rendering.filter(k => !['warm-start', 'ascendant-beat', 'choice-set', 'divine-receipt', 'chapter-ledger', 'divine-court', 'event-popup'].includes(k));
        expect(fg.length).toBeLessThanOrEqual(1);
      }
    }
  });

  it('an incumbent whose flag is gone is ignored; the slot goes by list order', () => {
    const r = resolveInterrupts(snap({ storyBeatPending: true, foregroundIncumbent: 'premonition' }));
    expect(r.rendering).toEqual(['story-beat']);
  });
});

describe('a surface with no screen never holds the clock forever (HomedSurfaceFallback)', () => {
  it('a kind set down through Continue is treated as closed, so the clock resumes', () => {
    const r = resolveInterrupts(snap({ storyBeatPending: true, skippedKinds: ['story-beat'] }));
    expect(r.rendering).toEqual([]);
    expect(r.anyOpen).toBe(false);
    // The wish is still reported, so the skip is forgotten only once the flag clears.
    expect(r.wished).toEqual(['story-beat']);
  });

  it('setting down one kind lets the next held one take the foreground', () => {
    const r = resolveInterrupts(snap({ encounterOpen: true, premonitionPending: true, skippedKinds: ['encounter'] }));
    expect(r.rendering).toEqual(['premonition']);
  });
});

/**
 * R4 — only the open moment's own dialogs arrive over it. The facts below are what keep
 * every other dialog out; a change that lets one in from elsewhere fails here.
 */
describe('R4 — what keeps a dialog from arriving over an open moment', () => {
  const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
  const sources: Array<{ path: string; text: string }> = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        if (name === '__tests__' || name === 'node_modules') continue;
        walk(full);
      } else if (/\.(ts|tsx)$/.test(name)) {
        sources.push({ path: relative(srcRoot, full).replace(/\\/g, '/'), text: readFileSync(full, 'utf8') });
      }
    }
  };
  walk(srcRoot);
  const writers = (re: RegExp) => sources.filter(s => re.test(s.text)).map(s => s.path).sort();

  it('a gift does not auto-enter while a Stage moment is open (giftDelivery.ts, THR-1809)', () => {
    for (const flag of ['encounterOpen', 'emergenceDecisionPending'] as const) {
      const r = resolveInterrupts(snap({ [flag]: true }));
      const gift = resolveGiftDelivery({
        pendingBeatId: 'beat.spine.the_seat', isSpine: true, isArrivalBeat: false,
        suppressed: false, journeyVignettePending: false,
        otherInterruptsOpen: r.open, playerSurfacesOpen: [],
        msSinceLastInput: 60_000, atResumeBoundary: true,
      });
      expect(gift.enter).toBe(false);
    }
  });

  it('the ledger opens only from the chrome (the Ledger rail and the opening direction line)', () => {
    expect(writers(/setChapterLedgerOpen\(true\)/)).toEqual([
      'components/Game/GameView.tsx',
      'components/Game/frame/LedgerRail.tsx',
    ]);
  });

  it('the court opens only from its chrome opener (useScry.handleOpenScry)', () => {
    expect(writers(/setScryVisible\(true\)/)).toEqual(['components/Game/hooks/useScry.ts']);
  });

  it('an effect choice set is raised only from inside an open choice set (a nested consequence)', () => {
    const raising = sources
      .filter(s => /setPendingChoice\((?!null\))/.test(s.text))
      .map(s => s.path);
    expect(raising).toEqual(['components/Game/hosts/DialogHost.tsx']);
    const host = sources.find(s => s.path === 'components/Game/hosts/DialogHost.tsx')!.text;
    expect(host.match(/setPendingChoice\((?!null\))[^)]*\)/g)).toEqual(['setPendingChoice(nestedPending)']);
  });

  it('a divine receipt that comes due with an encounter is held behind it and renders once it closes', () => {
    const during = resolveInterrupts(snap({ encounterOpen: true, divineReceiptPending: true, foregroundIncumbent: 'encounter' }));
    expect(during.rendering).not.toContain('divine-receipt');
    const after = resolveInterrupts(snap({ divineReceiptPending: true, foregroundIncumbent: 'encounter' }));
    expect(after.rendering).toContain('divine-receipt');
  });

  it('a popup waits for every other surface', () => {
    for (const flag of ['encounterOpen', 'chapterLedgerOpen', 'divineReceiptPending', 'momentPending'] as const) {
      expect(resolveInterrupts(snap({ [flag]: true, popupQueued: true })).popupMayRender).toBe(false);
    }
  });
});
