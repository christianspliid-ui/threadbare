/**
 * THR-1875 (frame plan § F5, § Done when slice 3) — the Needs-you view model and its
 * producers (UI Law 58: one list, a missing entry fails a named test).
 */
import { describe, it, expect } from 'vitest';
import type { AlertIcon, AlertItem } from '../../../types/notification';
import {
  NEEDS_YOU_PRODUCERS,
  NEEDS_YOU_GROUP_ORDER,
  NEEDS_YOU_NEWS_KEEP_TICKS,
  NEEDS_YOU_HELD_FALLBACK,
  buildNeedsYou,
  foldNeedsYou,
  needsYouCapacityRows,
  heldRowLine,
  newsIconFor,
  type NeedsYouSources,
} from '../needsYou';
import { ICON_FOR_ALERT } from '../../../data/icons/conceptIcons';
import { INTERRUPT_SURFACES } from '../interruptRegistry';
import { homedSurfaceForId } from '../../../data/homed-surfaces';
import { assertSerialisable } from './viewContract';

const ALL_ALERT_ICONS: AlertIcon[] = ['death', 'birth', 'doom', 'mandate', 'discovery', 'rival', 'dilemma', 'harvest', 'revelation', 'social', 'faction', 'trust'];

function alert(id: string, tick: number, icon: AlertIcon = 'faction', message = `News ${id}`): AlertItem {
  return { id, icon, message, sourceEventId: id, tick, navigationTarget: { kind: 'faction', factionId: 'f1' } };
}

function sources(over: Partial<NeedsYouSources> = {}): NeedsYouSources {
  return { currentTick: 100, beatOffer: null, receipts: [], namedPause: null, held: [], alerts: [], ...over };
}

describe('needsYou — the producer list (Law 58)', () => {
  it('every group has a producer', () => {
    for (const g of NEEDS_YOU_GROUP_ORDER) {
      expect(NEEDS_YOU_PRODUCERS.some(p => p.group === g), `Needs-you group '${g}' has no producer: add one to NEEDS_YOU_PRODUCERS`).toBe(true);
    }
  });

  it('every AlertIcon has a news icon', () => {
    for (const icon of ALL_ALERT_ICONS) {
      expect(ICON_FOR_ALERT[icon], `AlertIcon '${icon}' has no news icon in ICON_FOR_ALERT`).toBeDefined();
      expect(newsIconFor(icon)).not.toBe('fallback');
    }
    expect(newsIconFor('not-a-kind')).toBe('fallback');
  });

  it('every interrupt surface yields a named held line', () => {
    for (const s of INTERRUPT_SURFACES) {
      const kind = homedSurfaceForId(s.id)?.kind ?? s.id;
      const line = heldRowLine({ kind, surfaceId: s.id, subject: 'Kael Thorne', title: 'Reality Cracks' });
      expect(line, `${s.id} has no held line`).not.toBe(NEEDS_YOU_HELD_FALLBACK);
      expect(line).not.toMatch(/[{}]/);
    }
    expect(heldRowLine({ kind: 'premonition', surfaceId: 'PremonitionModal', subject: 'Kael Thorne' })).toBe('A premonition about Kael Thorne');
    expect(heldRowLine({ kind: 'event-popup', surfaceId: 'EventPopup', title: 'Reality Cracks' })).toBe('A message: Reality Cracks');
    expect(heldRowLine({ kind: 'nope', surfaceId: 'Nope' })).toBe(NEEDS_YOU_HELD_FALLBACK);
  });
});

describe('needsYou — build', () => {
  it('count equals the rows, and the VM is serialisable', () => {
    const vm = buildNeedsYou(sources({
      beatOffer: { kind: 'gift', beatId: 'spine.seat', eyebrow: 'A Place to Stand', title: null, tick: 90 },
      receipts: [{ id: 'r1', headline: 'The fever breaks before dawn.', tick: 95 }],
      namedPause: { line: 'Your ascendant has arrived at Oreblack Deep.', hex: { col: 3, row: 4 }, tick: 99 },
      held: [{ kind: 'premonition', surfaceId: 'PremonitionModal', subject: 'Kael Thorne' }],
      alerts: [alert('a1', 98), alert('a2', 97, 'death')],
    }));
    assertSerialisable(vm, 'needsYou');
    const rows = vm.groups.waiting.length + vm.groups.held.length + vm.groups.news.length;
    expect(vm.count).toBe(rows);
    expect(vm.count).toBe(6);
    expect(vm.groups.waiting.map(r => r.line)).toEqual([
      'A gift waits: A Place to Stand',
      'What your act bought: The fever breaks before dawn.',
      'Your ascendant has arrived at Oreblack Deep.',
    ]);
    expect(vm.groups.waiting[2]).toMatchObject({ opens: 'place', action: 'Show', hex: { col: 3, row: 4 } });
    expect(vm.groups.held[0]).toMatchObject({ line: 'A premonition about Kael Thorne', action: 'after this', after: true, opens: 'none' });
  });

  it('a beat with no title never shows its id', () => {
    const vm = buildNeedsYou(sources({ beatOffer: { kind: 'beat', beatId: 'beat.delivery.some_template_id', eyebrow: null, title: null, tick: 1 } }));
    expect(vm.groups.waiting[0].line).toBe('A beat of your story');
    expect(vm.groups.waiting[0].line).not.toContain('some_template');
    const offering = buildNeedsYou(sources({ beatOffer: { kind: 'offering', beatId: 'offering.x', eyebrow: 'x', title: 'y', tick: 1 } }));
    expect(offering.groups.waiting[0].line).toBe('Three powers stir');
  });

  it('News lapses at NEEDS_YOU_NEWS_KEEP_DAYS × TICKS_PER_DAY, newest first, with an elapsed word', () => {
    const vm = buildNeedsYou(sources({
      currentTick: 200,
      alerts: [alert('old', 200 - NEEDS_YOU_NEWS_KEEP_TICKS), alert('kept', 200 - NEEDS_YOU_NEWS_KEEP_TICKS + 1), alert('new', 199)],
    }));
    expect(vm.groups.news.map(r => r.id)).toEqual(['alert:new', 'alert:kept']);
    expect(vm.groups.news[0].action).toBe('less than a day ago');
    expect(vm.groups.news[1].action).toMatch(/days ago$/);
  });

  it('a same-kind burst in one tick is one row "· and {n} more like it" that opens to each', () => {
    const vm = buildNeedsYou(sources({
      alerts: [alert('b1', 99, 'faction', 'First.'), alert('b2', 99, 'faction', 'Second.'), alert('b3', 99, 'faction', 'Third.'), alert('other', 99, 'death', 'A death.')],
    }));
    expect(vm.count).toBe(2);
    const burst = vm.groups.news.find(r => r.burst);
    expect(burst?.line).toBe('Third. · and 2 more like it');
    expect(burst?.burst?.map(r => r.line)).toEqual(['Third.', 'Second.', 'First.']);
    expect(burst?.alertIds).toEqual(['b3', 'b2', 'b1']);
  });

  it('an alert with no target is a non-button row', () => {
    const vm = buildNeedsYou(sources({ alerts: [{ id: 'm', icon: 'mandate', message: 'Mandate "X" enters its next stage.', sourceEventId: 'm', tick: 99 }] }));
    expect(vm.groups.news[0].opens).toBe('none');
  });

  it('a named pause with no hex names the line and offers no Show', () => {
    const vm = buildNeedsYou(sources({ namedPause: { line: 'Paused.', hex: null, tick: 1 } }));
    expect(vm.groups.waiting[0]).toMatchObject({ opens: 'none', action: null });
  });
});

describe('needsYou — grow, then fold (Law 57)', () => {
  it('capacity is 13 at 1080 px and 16 at 1440 px with three groups', () => {
    expect(needsYouCapacityRows(1080, 16, 3)).toBe(13);
    expect(needsYouCapacityRows(1440, 18, 3)).toBe(16);
  });

  it('20 news rows fold to capacity − 1 rows and one "and N more" row; Waiting folds last', () => {
    const alerts = Array.from({ length: 20 }, (_, i) => alert(`n${i}`, 100 - i));
    const vm = buildNeedsYou(sources({ currentTick: 100, alerts }));
    expect(vm.count).toBe(20);
    const cap = needsYouCapacityRows(1080, 16, 1);
    const folded = foldNeedsYou(vm, cap);
    expect(folded.groups.news.rows).toHaveLength(cap - 1);
    expect(folded.groups.news.folded).toBe(20 - (cap - 1));
    expect(folded.linesShown).toBe(cap);
    // The oldest fold: the newest stays first.
    expect(folded.groups.news.rows[0].id).toBe('alert:n0');

    const mixed = buildNeedsYou(sources({
      currentTick: 100,
      alerts,
      receipts: Array.from({ length: 3 }, (_, i) => ({ id: `r${i}`, headline: `R${i}`, tick: i })),
    }));
    const f2 = foldNeedsYou(mixed, 13);
    expect(f2.groups.waiting.folded).toBe(0);
    expect(f2.linesShown).toBeLessThanOrEqual(13);
  });

  it('an expanded group does not fold', () => {
    const vm = buildNeedsYou(sources({ alerts: Array.from({ length: 20 }, (_, i) => alert(`n${i}`, 100 - i)) }));
    expect(foldNeedsYou(vm, 5, new Set(['news'])).groups.news.folded).toBe(0);
  });
});

describe('needsYou — the seam (THR-1822)', () => {
  it('the selector builds from the screen args the debug bridge passes, keyed on the sources', async () => {
    const { needsYouSelector } = await import('../needsYou');
    const src = sources({ alerts: [alert('a1', 99), alert('a2', 98, 'death')] });
    const viaScreen = needsYouSelector.build({} as never, { needsYouSources: src });
    expect(viaScreen.count).toBe(2);
    const k1 = needsYouSelector.key({ needsYouSources: src });
    const k2 = needsYouSelector.key({ needsYouSources: sources({ alerts: [alert('a1', 99)] }) });
    expect(k1).not.toBe(k2);
    expect(needsYouSelector.build({} as never, {}).count).toBe(0);
  });
});
