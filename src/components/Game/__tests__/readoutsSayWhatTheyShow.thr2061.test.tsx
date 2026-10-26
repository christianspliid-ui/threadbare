// @vitest-environment jsdom
/**
 * THR-2061 — readouts say what they show (plan S2: E3–E5, U5–U8, legends).
 *
 * Plan: `Docs/plans/2026-10-26-thr-2058-one-thing-at-a-time.md` § Done when S2.
 * The essence ▼ flash timer test lives with the other flash tests in
 * `ascendant-bar/__tests__/readableSpend.test.tsx`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { essenceDirection } from '../../../engine/views/essenceRefill';
import { playerSpendSince, recordEssenceMovement } from '../../../engine/essenceMovement';
import { buildNeedsYou, NEEDS_YOU_COUNT_INCLUDES_NEWS, type NeedsYouSources } from '../../../engine/views/needsYou';
import { nudgeGlyphLegendForHand, NUDGE_ODDS_LEGEND_LABEL } from '../../../data/nudge-card-display';
import { CONSEQUENCE_LEGEND_MEANINGS } from '../../../data/aftermath-legend-words';
import { NEEDS_YOU_PILL_NEWS_ONLY_LABEL } from '../../../data/frame-content';
import { NeedsYou } from '../frame/NeedsYou';
import type { AlertItem } from '../../../types/notification';
import type { EssencePool } from '../../../types/influence';
import { SPHERE_NAMES } from '../../../types';

afterEach(cleanup);

function pool(over: Partial<EssencePool> = {}): EssencePool {
  return { ...(Object.fromEntries(SPHERE_NAMES.map((s) => [s, 20])) as EssencePool), ...over };
}

describe('E3 — the essence arrow follows the refill band', () => {
  it('drains → ebbing, any other band below the cap → rising, at the cap → steady', () => {
    expect(essenceDirection({ band: 'drains' }, 10, 50)).toBe('ebbing');
    for (const band of ['fast', 'steady', 'slow'] as const) {
      expect(essenceDirection({ band }, 10, 50), band).toBe('rising');
      expect(essenceDirection({ band }, 50, 50), `${band} at cap`).toBe('steady');
    }
    // A full pool that drains still reads its drain.
    expect(essenceDirection({ band: 'drains' }, 50, 50)).toBe('ebbing');
  });

  it('no band (the ledger read gave none) reads steady, never a guess', () => {
    expect(essenceDirection(undefined, 10, 50)).toBe('steady');
    expect(essenceDirection({ band: 'slow' }, Number.NaN, 50)).toBe('steady');
  });
});

describe('E4 — the ▼ reads only the player\'s own spends', () => {
  const before = pool();
  const spent = pool({ mind: 15 });

  it('lights on spend_nudge and spend_cast growth, by the amount spent', () => {
    const nudge = recordEssenceMovement(undefined, before, spent, 'spend_nudge', 10)!.mind;
    expect(playerSpendSince(undefined, nudge)).toBe(5);
    const cast = recordEssenceMovement(undefined, before, spent, 'spend_cast', 10)!.mind;
    expect(playerSpendSince(undefined, cast)).toBe(5);
  });

  it('never lights on income, upkeep or a sustained control', () => {
    for (const cause of ['income', 'upkeep', 'sustained', 'other'] as const) {
      const rec = recordEssenceMovement(undefined, before, spent, cause, 10)!.mind;
      expect(playerSpendSince(undefined, rec), cause).toBe(0);
    }
  });

  it('a refill after a spend adds nothing; a second spend adds only itself', () => {
    const afterSpend = recordEssenceMovement(undefined, before, spent, 'spend_nudge', 10);
    const refilled = recordEssenceMovement(afterSpend, spent, pool({ mind: 16 }), 'income', 11);
    expect(playerSpendSince(afterSpend!.mind, refilled!.mind)).toBe(0);
    const again = recordEssenceMovement(refilled, pool({ mind: 16 }), pool({ mind: 13 }), 'spend_cast', 12);
    expect(playerSpendSince(refilled!.mind, again!.mind)).toBe(3);
  });

  it('a window that rolled since the last read counts only its new spend', () => {
    const first = recordEssenceMovement(undefined, before, spent, 'spend_nudge', 10);
    // 100+ ticks later the next movement opens a fresh window.
    const rolled = recordEssenceMovement(first, spent, pool({ mind: 11 }), 'spend_cast', 140);
    expect(playerSpendSince(first!.mind, rolled!.mind)).toBe(4);
    const quiet = recordEssenceMovement(first, spent, pool({ mind: 16 }), 'income', 140);
    expect(playerSpendSince(first!.mind, quiet!.mind)).toBe(0);
  });

  it('a missing record reads 0 — no ▼, never a false one', () => {
    expect(playerSpendSince(undefined, undefined)).toBe(0);
  });
});

function alert(id: string): AlertItem {
  return { id, icon: 'faction', message: `News ${id}`, sourceEventId: id, tick: 99 } as AlertItem;
}

function sources(over: Partial<NeedsYouSources> = {}): NeedsYouSources {
  return { currentTick: 100, beatOffer: null, receipts: [], namedPause: null, held: [], alerts: [], ...over };
}

describe('E5 / U8 — Needs-you counts only what waits', () => {
  it('news is listed but not counted', () => {
    expect(NEEDS_YOU_COUNT_INCLUDES_NEWS).toBe(false);
    const vm = buildNeedsYou(sources({
      receipts: [{ id: 'r1', headline: 'The fever breaks.', tick: 95 }],
      held: [{ kind: 'premonition', surfaceId: 'PremonitionModal', subject: 'Kael' }],
      alerts: [alert('a1'), { ...alert('a2'), icon: 'death' } as AlertItem],
    }));
    expect(vm.groups.news).toHaveLength(2);
    expect(vm.count).toBe(2);
    expect(vm.total).toBe(4);
  });

  it('with only news, the pill shows its label and no number', () => {
    const vm = buildNeedsYou(sources({ alerts: [alert('a1')] }));
    render(<NeedsYou vm={vm} open={false} onOpenChange={() => {}} guarded={false} raised={false} onPressRow={() => {}} />);
    const pill = screen.getByTestId('needs-you-pill');
    expect(pill.style.display).not.toBe('none');
    expect(pill.getAttribute('data-needs-you-count')).toBe('0');
    expect(pill.getAttribute('data-needs-you-total')).toBe('1');
    expect(pill.textContent).toBe('Needs you');
    expect(pill.textContent).not.toMatch(/\d/);
    expect(pill.querySelector('button')?.getAttribute('aria-label')).toBe(NEEDS_YOU_PILL_NEWS_ONLY_LABEL);
  });

  it('with something waiting, the pill shows the waiting count only', () => {
    const vm = buildNeedsYou(sources({
      receipts: [{ id: 'r1', headline: 'The fever breaks.', tick: 95 }],
      alerts: [alert('a1'), alert('a2')],
    }));
    render(<NeedsYou vm={vm} open={false} onOpenChange={() => {}} guarded={false} raised={false} onPressRow={() => {}} />);
    expect(screen.getByTestId('needs-you-pill').textContent).toBe('Needs you1');
  });
});

describe('U6 — the card legend shows this hand\'s pips and names ○', () => {
  it('a hand of faint cards shows ●○ only', () => {
    const legend = nudgeGlyphLegendForHand([0.08, 0.1]);
    const odds = legend.find((e) => e.id === 'odds')!;
    expect(odds.glyph).toBe('●○');
    expect(odds.label).toBe(NUDGE_ODDS_LEGEND_LABEL);
    expect(legend.map((e) => e.id)).toEqual(['price', 'odds', 'setback']);
  });

  it('a mixed hand lists its tiers weakest first; ○ is the lowest tier\'s hollow', () => {
    const odds = nudgeGlyphLegendForHand([0.4, 0.08, 0.6]).find((e) => e.id === 'odds')!;
    expect(odds.glyph).toBe('●○ ■ ◆');
    expect(nudgeGlyphLegendForHand([0.4]).find((e) => e.id === 'odds')!.glyph).toBe('■□');
  });

  it('a hand with no odds pips shows price and setback only', () => {
    expect(nudgeGlyphLegendForHand([0, -0.1]).map((e) => e.id)).toEqual(['price', 'setback']);
    expect(nudgeGlyphLegendForHand([]).map((e) => e.id)).toEqual(['price', 'setback']);
  });
});

describe('U7 — the aftermath words carry meanings', () => {
  it('each category word has its meaning', () => {
    expect(CONSEQUENCE_LEGEND_MEANINGS).toEqual({
      scar: 'what it cost',
      bond: 'who stands with them',
      boon: 'what they gained',
      path: 'a way held open',
    });
  });
});
