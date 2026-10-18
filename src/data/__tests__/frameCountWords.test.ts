/**
 * THR-1893 — every frame count reads right at one and at two (PC-3), and the tooltips
 * that quote a tunable follow it.
 */
import { describe, it, expect } from 'vitest';
import { NEEDS_YOU_PILL_LABEL, NEEDS_YOU_FOLD_ROW, needsYouNewsTooltipDesc } from '../frame-content';
import { NEEDS_YOU_NEWS_KEEP_DAYS } from '../../engine/views/viewConstants';
import { TICKS_PER_DAY } from '../attention-constants';
import { durationLabel } from '../../engine/aftermathWords';
import {
  CHRONICLE_NOW_SEASONS,
  CHRONICLE_YEAR_GROUP,
  LEDGER_TAB_UNREAD,
  STRIP_COUNT_LABELS,
  chronicleTooltipDesc,
  countWords,
} from '../frame-content';
import { stripTooltipLabel } from '../../components/Game/frame/LedgerStrip';
import { LEDGER_RAIL_SECTIONS, LEDGER_TABS } from '../frame-registry';
import { getUITooltip } from '../ui-content';

describe('frame count words', () => {
  it('the strip counts read right at 1 and 2', () => {
    const threads = LEDGER_RAIL_SECTIONS.find(s => s.id === 'threads')!;
    const chronicle = LEDGER_RAIL_SECTIONS.find(s => s.id === 'chronicle')!;
    const ledger = LEDGER_TABS.find(t => t.id === 'ledger')!;
    const item = (label: string, strip: typeof threads.strip, count: number) => stripTooltipLabel({ label, strip, count });
    expect(item(threads.label, threads.strip, 1)).toBe('Threads · 1 chapter waits');
    expect(item(threads.label, threads.strip, 2)).toBe('Threads · 2 chapters wait');
    expect(item(chronicle.label, chronicle.strip, 1)).toBe('Chronicle · 1 new');
    expect(item(chronicle.label, chronicle.strip, 3)).toBe('Chronicle · 3 new');
    expect(item(ledger.stripLabel!, ledger.strip!, 1)).toBe('Chapter Ledger · 1 new chapter');
    expect(item(ledger.stripLabel!, ledger.strip!, 2)).toBe('Chapter Ledger · 2 new chapters');
    expect(item(threads.label, threads.strip, 0)).toBe('Threads');
  });

  it('the Years header and the Ledger tab count read right at 1 and 2', () => {
    expect(countWords(1, CHRONICLE_YEAR_GROUP, { year: 3 })).toBe('Year 3 · 1 entry');
    expect(countWords(14, CHRONICLE_YEAR_GROUP, { year: 2 })).toBe('Year 2 · 14 entries');
    expect(countWords(1, LEDGER_TAB_UNREAD)).toBe('1 new chapter');
    expect(countWords(2, LEDGER_TAB_UNREAD)).toBe('2 new chapters');
  });

  it('no frame pair produces "1 things" or "2 thing waits"', () => {
    const pairs = [CHRONICLE_YEAR_GROUP, LEDGER_TAB_UNREAD, ...Object.values(STRIP_COUNT_LABELS)];
    for (const pair of pairs) {
      expect(countWords(1, pair, { year: 1 })).not.toMatch(/\b1 \w+s\b(?! wait)/);
      expect(countWords(2, pair, { year: 1 })).not.toMatch(/\b2 \w+ waits\b/);
    }
  });

  it("ui.chronicle's description follows CHRONICLE_NOW_SEASONS", () => {
    expect(chronicleTooltipDesc()).toContain(`the last ${['no', 'one', 'two', 'three', 'four'][CHRONICLE_NOW_SEASONS]} seasons`);
    expect(chronicleTooltipDesc(2)).toContain('the last two seasons');
    expect(chronicleTooltipDesc(6)).toContain('the last six seasons');
    // The registry copy is the default the render produces.
    expect(getUITooltip('ui.chronicle')?.desc).toBe(chronicleTooltipDesc());
  });

  // THR-1875 — the Needs-you pill and the News tooltip.
  it('the Needs-you pill reads right at one and two', () => {
    expect(countWords(1, NEEDS_YOU_PILL_LABEL)).toBe('1 thing needs you');
    expect(countWords(2, NEEDS_YOU_PILL_LABEL)).toBe('2 things need you');
    expect(countWords(4, NEEDS_YOU_FOLD_ROW)).toBe('and 4 more');
  });

  it("ui.needs_you_news's description follows NEEDS_YOU_NEWS_KEEP_DAYS", () => {
    const keep = durationLabel(NEEDS_YOU_NEWS_KEEP_DAYS * TICKS_PER_DAY);
    expect(needsYouNewsTooltipDesc(keep)).toContain(`after ${keep}.`);
    expect(needsYouNewsTooltipDesc(durationLabel(5 * TICKS_PER_DAY))).toContain('after five days.');
    // The registry copy is the default the render produces.
    expect(getUITooltip('ui.needs_you_news')?.desc).toBe(needsYouNewsTooltipDesc(keep));
  });
});
