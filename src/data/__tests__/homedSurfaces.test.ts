/**
 * THR-1877 — the home list's named test (Law 58, plan
 * `Docs/plans/2026-10-14-thr-1877-encounter-stage.md` § D1).
 *
 * Every failure names the list to edit: HOMED_SURFACES (src/data/homed-surfaces.ts).
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import {
  HOMED_SURFACES,
  CEREMONY_HOMED_KINDS,
  heldLineFor,
  homedKindsFor,
  homedSurfaceFallbackTitle,
  type HomedSurfaceEntry,
} from '../homed-surfaces';
import {
  HOMED_INTERRUPT_SURFACES,
  HOMED_SURFACE_OPEN_WHEN,
  INTERRUPT_SURFACES,
  resolveInterrupts,
  type InterruptSnapshot,
} from '../../components/Game/interruptRegistry';
import { INTERRUPT_HOLDER_NAMES } from '../nudge-stage-content';
import { DIALOG_CONTEXT_SURFACES } from '../../components/shared/dialogContext';
import { CEREMONY_HOST_KINDS, DIALOG_HOST_KINDS, STAGE_HOST_KINDS } from '../../components/Game/hosts/hostKinds';

const LIST = 'HOMED_SURFACES (src/data/homed-surfaces.ts)';
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

/**
 * Every snapshot flag that opens a surface. The record is typed over the snapshot's
 * keys minus the holds, so a new snapshot field is a type error here until it is
 * listed — and then the check below fails until the list has an entry for it.
 */
type HoldKey = 'interruptsSuppressed' | 'hasAscendantIdentity' | 'playerSurfaceOpen' | 'recentInput'
  | 'alreadyShown' | 'foregroundIncumbent' | 'skippedKinds';
const OPENING_FLAGS: Record<Exclude<keyof InterruptSnapshot, HoldKey>, true> = {
  encounterOpen: true,
  meetingPending: true,
  threadingRitePending: true,
  premonitionPending: true,
  vignettePending: true,
  storyBeatPending: true,
  ascendantBeatEntered: true,
  choiceSetPending: true,
  emergenceDecisionPending: true,
  divineReceiptPending: true,
  momentPending: true,
  chapterLedgerOpen: true,
  courtOpen: true,
  popupQueued: true,
  warmStartRunning: true,
  cycleHarvestPending: true,
};

describe(`the home list — ${LIST}`, () => {
  it('holds the sixteen surfaces of plan D1, in render-priority order', () => {
    expect(entries.map(e => e.kind), `the order of ${LIST} changed`).toEqual([
      'warm-start', 'meet-the-first', 'threading-rite', 'encounter', 'premonition',
      'journey-vignette', 'story-beat', 'ascendant-beat', 'choice-set', 'emergence-dilemma',
      'divine-receipt', 'chapter-ledger', 'divine-court', 'undertaking-moment', 'event-popup',
      'cycle-harvest',
    ]);
  });

  // 1
  it('kind and surfaceId are unique', () => {
    const kinds = entries.map(e => e.kind);
    const ids = entries.map(e => e.surfaceId);
    expect(new Set(kinds).size, `duplicate kind in ${LIST}`).toBe(kinds.length);
    expect(new Set(ids).size, `duplicate surfaceId in ${LIST}`).toBe(ids.length);
  });

  // 2
  it.each(Object.keys(OPENING_FLAGS))('the snapshot flag %s alone opens exactly one surface, and it is a list entry', (flag) => {
    const r = resolveInterrupts({ ...closed, [flag]: true });
    expect(r.rendering, `turning on ${flag} opened no surface — add an entry to ${LIST} and its predicate`).toHaveLength(1);
    expect(entries.some(e => e.kind === r.rendering[0]), `${r.rendering[0]} is not in ${LIST}`).toBe(true);
  });

  it('every kind has an open predicate, and the derived registry carries every kind once', () => {
    for (const e of entries) {
      expect(typeof HOMED_SURFACE_OPEN_WHEN[e.kind as keyof typeof HOMED_SURFACE_OPEN_WHEN], `${e.kind} in ${LIST} has no open predicate`).toBe('function');
    }
    expect(HOMED_INTERRUPT_SURFACES.map(s => s.kind)).toEqual(entries.map(e => e.kind));
  });

  // 3
  it('every kind that can be held has a held line; every stopping kind has a holder name', () => {
    for (const e of entries) {
      const holdable = e.home !== 'dialog' || e.waitsTurn !== undefined;
      if (holdable) expect(e.heldLine, `${e.kind} can be held but has no heldLine in ${LIST}`).toBeTruthy();
      if (e.stopsTime) expect(e.holderName, `${e.kind} stops time but has no holderName in ${LIST}`).toBeTruthy();
    }
  });

  // 4
  const dialogSizePath = resolve(dirname(fileURLToPath(import.meta.url)), '../../components/shared/dialogSize.ts');
  it.skipIf(!existsSync(dialogSizePath))('every dialog-home entry has a size row, and no Stage or ceremony entry does (THR-1820)', async () => {
    const mod = await import(/* @vite-ignore */ dialogSizePath) as { DIALOG_SIZE_SURFACES?: ReadonlyArray<{ surface?: string; id?: string }> | Record<string, unknown> };
    const rows = mod.DIALOG_SIZE_SURFACES;
    const sized = new Set(Array.isArray(rows) ? rows.map(r => r.surface ?? r.id ?? '') : Object.keys(rows ?? {}));
    for (const e of entries) {
      if (e.home === 'dialog') expect(sized.has(e.surfaceId), `${e.surfaceId} (dialog in ${LIST}) has no DIALOG_SIZE_SURFACES row`).toBe(true);
      else expect(sized.has(e.surfaceId), `${e.surfaceId} (${e.home} in ${LIST}) must not take a dialog size`).toBe(false);
    }
  });

  // 5
  it('the derived exports equal what the list produces', () => {
    expect(INTERRUPT_SURFACES.map(s => s.id), `INTERRUPT_SURFACES drifted from ${LIST}`)
      .toEqual(entries.filter(e => e.stopsTime).map(e => e.surfaceId));
    expect(INTERRUPT_SURFACES.filter(s => s.arrival).map(s => s.id))
      .toEqual(entries.filter(e => e.stopsTime && e.arrival).map(e => e.surfaceId));
    expect({ ...INTERRUPT_HOLDER_NAMES }, `INTERRUPT_HOLDER_NAMES drifted from ${LIST}`)
      .toEqual(Object.fromEntries(entries.filter(e => e.holderName).map(e => [e.surfaceId, e.holderName])));
    expect(DIALOG_CONTEXT_SURFACES.map(s => [s.surface, s.context, s.ownsPalette]), `DIALOG_CONTEXT_SURFACES drifted from ${LIST}`)
      .toEqual(entries.filter(e => e.palette).map(e => [e.surfaceId, e.palette, e.palette === 'encounter' || e.palette === 'divine']));
    expect(CEREMONY_HOMED_KINDS, `the ceremonies drifted from ${LIST}`).toEqual(['meet-the-first', 'threading-rite', 'cycle-harvest']);
  });

  // 6
  it("each host's kind set equals the list's filter for its home, and the three cover every kind once", () => {
    expect([...STAGE_HOST_KINDS].sort(), `StageHost's cases drifted from ${LIST}`).toEqual(homedKindsFor('stage').sort());
    expect([...DIALOG_HOST_KINDS].sort(), `DialogHost's cases drifted from ${LIST}`).toEqual(homedKindsFor('dialog').sort());
    expect([...CEREMONY_HOST_KINDS].sort(), `CeremonyHost's cases drifted from ${LIST}`).toEqual(homedKindsFor('ceremony').sort());
    const all = [...STAGE_HOST_KINDS, ...DIALOG_HOST_KINDS, ...CEREMONY_HOST_KINDS];
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual(entries.map(e => e.kind).sort());
  });

  it('no new name is BeatKind (the ascendant beat already owns it)', async () => {
    const mod = await import('../homed-surfaces');
    expect(Object.keys(mod).some(k => /^BeatKind$/.test(k))).toBe(false);
  });
});

describe('held lines (D1) — no {token} reaches the screen (Law 43)', () => {
  it('fills the slots', () => {
    expect(heldLineFor('premonition', { subject: 'Kael Thorne' })).toBe('A premonition about Kael Thorne');
    expect(heldLineFor('event-popup', { title: 'The Drowned Bell wakes' })).toBe('A message: The Drowned Bell wakes');
    expect(heldLineFor('encounter', { title: 'The Unsafe Bridge', subject: 'Maren Ashfold' })).toBe('The Unsafe Bridge, with Maren Ashfold');
    expect(heldLineFor('threading-rite', { subject: 'Hale the Younger' })).toBe('The threading rite with Hale the Younger');
    expect(heldLineFor('cycle-harvest')).toBe('The end of the age');
  });

  it('falls back to the holder words in sentence case when a slot has no value', () => {
    expect(heldLineFor('premonition')).toBe('A premonition');
    expect(heldLineFor('encounter', { title: 'The Unsafe Bridge' })).toBe('An encounter');
    expect(heldLineFor('event-popup', { title: '  ' })).toBe('A message');
  });

  it('every held line resolves to words with no braces, filled or not', () => {
    for (const e of entries) {
      for (const slots of [{}, { subject: 'Maren', title: 'A Title' }]) {
        expect(heldLineFor(e.kind, slots)).not.toMatch(/[{}]/);
      }
    }
  });

  it('the fallback screen is titled by the holder words', () => {
    expect(homedSurfaceFallbackTitle('story-beat')).toBe('A story beat');
  });
});
