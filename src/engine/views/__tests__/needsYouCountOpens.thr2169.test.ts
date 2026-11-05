/**
 * THR-2169 — the Needs-you count invariant: every row the pill counts opens something;
 * a row that cannot open is listed with its reason ("after this") and not counted.
 */
import { describe, it, expect } from 'vitest';
import {
  buildNeedsYou,
  needsYouRowCounts,
  NEEDS_YOU_WORDS,
  type NeedsYouSources,
} from '../needsYou';

function sources(over: Partial<NeedsYouSources> = {}): NeedsYouSources {
  return { currentTick: 100, beatOffer: null, receipts: [], namedPause: null, held: [], alerts: [], ...over };
}

/** Every combination of the sources that can produce an unopenable row, and the openable ones. */
const CASES: Array<[string, Partial<NeedsYouSources>]> = [
  ['held moment', { held: [{ kind: 'premonition', surfaceId: 'PremonitionModal', subject: 'Kael Thorne' }] }],
  ['pause with no place', { namedPause: { line: 'Time stops.', hex: null, tick: 99 } }],
  ['pause with a place', { namedPause: { line: 'Arrived.', hex: { col: 1, row: 2 }, tick: 99 } }],
  ['blocked gift', { beatOffer: { kind: 'gift', beatId: 'spine.seat', eyebrow: 'The Seat', title: null, tick: 90, blocked: true } }],
  ['open gift', { beatOffer: { kind: 'gift', beatId: 'spine.seat', eyebrow: 'The Seat', title: null, tick: 90 } }],
  ['receipt', { receipts: [{ id: 'r1', headline: 'The fever breaks.', tick: 95 }] }],
  ['news without a target', { alerts: [{ id: 'a1', icon: 'death', message: 'A death.', tick: 99 } as never] }],
];

describe('THR-2169 — Needs you counts only what can open', () => {
  it.each(CASES)('%s: every counted row opens, every uncounted waiting row shows its reason', (_name, over) => {
    const vm = buildNeedsYou(sources(over));
    const waits = [...vm.groups.waiting, ...vm.groups.held];
    expect(vm.count).toBe(waits.filter(needsYouRowCounts).length);
    for (const row of waits) {
      if (row.opens === 'none') {
        // Not counted — and the row carries a reason, never a silent dead button.
        expect(row.action === NEEDS_YOU_WORDS.after || row.producer === 'named_pause', `${row.id} has no reason`).toBe(true);
      }
    }
  });

  it('the whole mix: count equals the openable waiting rows only', () => {
    const vm = buildNeedsYou(sources(Object.assign({}, ...CASES.map(c => c[1]))));
    const counted = [...vm.groups.waiting, ...vm.groups.held].filter(r => r.opens !== 'none');
    expect(vm.count).toBe(counted.length);
    expect(counted.every(r => r.opens !== 'none')).toBe(true);
  });

  it('a gift blocked by another moment says "after this" and is not a button', () => {
    const vm = buildNeedsYou(sources({
      beatOffer: { kind: 'gift', beatId: 'spine.seat', eyebrow: 'The Seat', title: null, tick: 90, blocked: true },
    }));
    expect(vm.count).toBe(0);
    expect(vm.total).toBe(1);
    expect(vm.groups.waiting[0]).toMatchObject({ opens: 'none', action: NEEDS_YOU_WORDS.after, after: true });
  });

  it('held moments alone keep the pill listed but uncounted', () => {
    const vm = buildNeedsYou(sources({ held: [{ kind: 'event-popup', surfaceId: 'EventPopup', title: 'Reality Cracks' }] }));
    expect(vm.count).toBe(0);
    expect(vm.total).toBe(1);
  });
});
