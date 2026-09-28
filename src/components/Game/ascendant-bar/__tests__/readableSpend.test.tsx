/**
 * @vitest-environment jsdom
 *
 * THR-1607 (plan B4, a readable spend) — the essence block, the tooltip registry
 * entries the first ten minutes need, and the fixed row order.
 *
 * Plan: `Docs/plans/2026-09-27-thr-1606-what-your-hand-did.md` § UI pillar, B4.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { resolveTooltip } from '../../../../engine/tooltipResolver';
import { ASCENDANT_REACH_REGISTER, reachTierTooltipId } from '../../../../data/ascendant-reach-register';
import { selectEssenceRows, type EssenceRowView } from '../selectors';
import { EssenceBlock } from '../EssenceBlock';
import {
  ESSENCE_BAR_CEILING,
  ESSENCE_SPEND_FLASH_MS,
  essenceFillPct,
  setEssencePreviewSphere,
  resetEssencePreview,
} from '../essenceDisplay';
import { INITIAL_ESSENCE_PER_SPHERE } from '../../../../engine/influence';
import type { GameState } from '../../../../types/gameState';
import type { AscendantArchetype } from '../../../../types/influence';
import type { SphereName } from '../../../../types';
import { SPHERE_NAMES } from '../../../../types';
import type { ForecastTier } from '../../../../types/resolution';
import { TOOLTIP_SHOW_DELAY } from '../../../../types/tooltip';
import { ActionCard } from '../../ActionCard';
import { getEssencePreviewSphere } from '../essenceDisplay';
import type { WheelSlot } from '../../../../engine/wheel';

const FORECAST_TIERS: readonly ForecastTier[] = ['doomed', 'perilous', 'uncertain', 'favorable', 'fated'];

afterEach(() => {
  cleanup();
  resetEssencePreview();
});

function archetype(primary: SphereName, secondary: SphereName): AscendantArchetype {
  return { sphereAlignment: { primary, secondary } } as unknown as AscendantArchetype;
}

function fullPool(level = INITIAL_ESSENCE_PER_SPHERE): Record<SphereName, number> {
  return Object.fromEntries(SPHERE_NAMES.map((s) => [s, level])) as Record<SphereName, number>;
}

function stateWith(pool: Partial<Record<SphereName, number>>): GameState {
  return { essencePool: pool } as unknown as GameState;
}

describe('registry — every new tooltip id resolves (Law 17)', () => {
  const ids = [
    'ui.card.cost',
    'ui.essence.row',
    'ui.essence.foundation_fold',
    'ui.ascendant_quintessence',
    'ui.counter_omens',
    'ui.doom_debt',
    'ui.investiture',
    'ui.covenant',
    ...FORECAST_TIERS.map((t) => `ui.forecast.cast.${t}`),
  ];

  it.each(ids)('%s resolves with a label and a description', (id) => {
    const content = resolveTooltip(id);
    expect(content?.label).toBeTruthy();
    expect(content?.desc ?? '').not.toBe('');
  });

  it('every tier word of every reach resolves, and names its reach', () => {
    for (const [reach, entry] of Object.entries(ASCENDANT_REACH_REGISTER)) {
      for (const word of entry.tierWords) {
        const content = resolveTooltip(reachTierTooltipId(reach, word));
        expect(content, `${reach}/${word}`).not.toBeNull();
        expect(content!.label).toContain(word);
      }
    }
  });

  it('the cast forecast says how cleanly, never whether', () => {
    for (const tier of FORECAST_TIERS) {
      const desc = resolveTooltip(`ui.forecast.cast.${tier}`)?.desc ?? '';
      expect(desc, tier).toMatch(/land/i);
    }
  });
});

describe('selectEssenceRows — fixed order, Elder fold membership', () => {
  it('orders identity spheres first, then canonical order — never by level', () => {
    const pool = fullPool();
    pool.time = 99;   // a high pool must not jump the queue
    pool.force = 1;
    const rows = selectEssenceRows(stateWith(pool), archetype('mind', 'spirit'));
    const order = rows.map((r) => r.sphere);
    expect(order.slice(0, 2)).toEqual(['mind', 'spirit']);
    const rest = SPHERE_NAMES.filter((s) => s !== 'mind' && s !== 'spirit');
    expect(order.slice(2)).toEqual(rest);
  });

  it('a spend does not reorder the list', () => {
    const before = selectEssenceRows(stateWith(fullPool()), archetype('mind', 'spirit')).map((r) => r.sphere);
    const spent = fullPool();
    spent.mind = 5;
    const after = selectEssenceRows(stateWith(spent), archetype('mind', 'spirit')).map((r) => r.sphere);
    expect(after).toEqual(before);
  });

  it('folds the four Foundation spheres unless the identity holds one', () => {
    const rows = selectEssenceRows(stateWith(fullPool()), archetype('light', 'mind'));
    const elder = rows.filter((r) => r.isElder).map((r) => r.sphere);
    expect(elder.sort()).toEqual(['chaos', 'darkness', 'order']);
    expect(rows.find((r) => r.sphere === 'light')?.isElder).toBe(false);
  });

  it('still hides a creation sphere at zero, but never the god\'s own', () => {
    const pool = fullPool();
    pool.matter = 0;
    pool.mind = 0;
    const rows = selectEssenceRows(stateWith(pool), archetype('mind', 'spirit'));
    expect(rows.some((r) => r.sphere === 'matter')).toBe(false);
    expect(rows.some((r) => r.sphere === 'mind')).toBe(true);
  });
});

describe('essenceFillPct — the bar scales to the starting pool (Law 47)', () => {
  it('a starting pool fills the bar and a spend moves it', () => {
    expect(essenceFillPct(ESSENCE_BAR_CEILING)).toBe(100);
    expect(essenceFillPct(ESSENCE_BAR_CEILING - 5)).toBeLessThan(100);
  });

  it('clamps above the ceiling and fails soft on bad input', () => {
    expect(essenceFillPct(ESSENCE_BAR_CEILING * 3)).toBe(100);
    expect(essenceFillPct(Number.NaN)).toBe(0);
    expect(essenceFillPct(-4)).toBe(0);
  });
});

describe('EssenceBlock', () => {
  function rowsFor(pool: Record<SphereName, number>): EssenceRowView[] {
    return selectEssenceRows(stateWith(pool), archetype('mind', 'spirit'));
  }

  it('shows each whole-number balance and keeps the Elder powers folded', () => {
    const pool = fullPool();
    pool.mind = 42.7;
    render(<EssenceBlock rows={rowsFor(pool)} />);
    expect(screen.getByTestId('essence-balance-mind').textContent).toBe('42');
    const fold = screen.getByTestId('essence-elder-fold');
    expect(fold.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByTestId('essence-row-chaos')).toBeNull();
    fireEvent.click(fold);
    expect(screen.getByTestId('essence-row-chaos')).toBeTruthy();
  });

  it('flashes the delta cluster after a spend, then clears it', () => {
    vi.useFakeTimers();
    const pool = fullPool();
    const { rerender } = render(<EssenceBlock rows={rowsFor(pool)} />);
    expect(screen.queryByTestId('essence-spend-mind')).toBeNull();
    const spent = { ...pool, mind: pool.mind - 5 };
    rerender(<EssenceBlock rows={rowsFor(spent)} />);
    expect(screen.getByTestId('essence-spend-mind')).toBeTruthy();
    expect(screen.getByTestId('essence-balance-mind').textContent).toBe(String(pool.mind - 5));
    act(() => { vi.advanceTimersByTime(ESSENCE_SPEND_FLASH_MS + 10); });
    expect(screen.queryByTestId('essence-spend-mind')).toBeNull();
    vi.useRealTimers();
  });

  it('does not flash for a sub-measure upkeep drain', () => {
    const pool = fullPool();
    const { rerender } = render(<EssenceBlock rows={rowsFor(pool)} />);
    rerender(<EssenceBlock rows={rowsFor({ ...pool, mind: pool.mind - 0.3 })} />);
    expect(screen.queryByTestId('essence-spend-mind')).toBeNull();
  });

  it('lights the row a hovered card would draw from, opening the fold if needed', () => {
    render(<EssenceBlock rows={rowsFor(fullPool())} />);
    act(() => { setEssencePreviewSphere('mind'); });
    expect(screen.getByTestId('essence-row-mind').getAttribute('data-previewed')).toBe('true');
    act(() => { setEssencePreviewSphere('chaos'); });
    expect(screen.getByTestId('essence-row-chaos').getAttribute('data-previewed')).toBe('true');
    act(() => { setEssencePreviewSphere(null); });
    expect(screen.queryByTestId('essence-row-chaos')).toBeNull();
  });
});

describe('the cast card — cost, forecast and the hover preview', () => {
  const castSlot: WheelSlot = {
    id: 'target_action_divine.dream',
    templateId: 'divine.dream',
    label: 'Dream',
    type: 'target_action',
    angleDeg: 0,
    available: true,
    lockedReason: null,
    essenceCost: 3,
    sphere: 'mind',
    interventionType: null,
    rangeStatus: 'in_range',
    hexDistance: 1,
    description: '',
    effectsLine: 'They dream of who they are.',
    crudType: 'update',
    reach: 'eye',
    scale: 'local',
    scaleWord: 'Local',
    forecastTier: 'doomed',
  } as WheelSlot;

  function hoverAndSettle(target: HTMLElement): void {
    fireEvent.pointerEnter(target);
    act(() => { vi.advanceTimersByTime(TOOLTIP_SHOW_DELAY); });
  }

  it('the price carries the card-cost tooltip', () => {
    vi.useFakeTimers();
    const { container } = render(<ActionCard slot={castSlot} onClick={vi.fn()} />);
    hoverAndSettle(container.querySelector('[data-testid^="action-card-cost-"]') as HTMLElement);
    expect(screen.getByRole('tooltip').textContent).toContain(resolveTooltip('ui.card.cost')!.label);
    vi.useRealTimers();
  });

  it('a doomed cast explains that it still lands', () => {
    vi.useFakeTimers();
    const { container } = render(<ActionCard slot={castSlot} onClick={vi.fn()} />);
    hoverAndSettle(container.querySelector('[data-forecast-tier="doomed"]') as HTMLElement);
    expect(screen.getByRole('tooltip').textContent).toContain('It will land, but crooked');
    vi.useRealTimers();
  });

  it('hovering a live card previews its sphere; leaving clears it', () => {
    const { container } = render(<ActionCard slot={castSlot} onClick={vi.fn()} />);
    const card = container.firstElementChild!.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(card);
    expect(getEssencePreviewSphere()).toBe('mind');
    fireEvent.mouseLeave(card);
    expect(getEssencePreviewSphere()).toBeNull();
  });

  it('a display-only card never previews', () => {
    const { container } = render(<ActionCard slot={castSlot} onClick={vi.fn()} interactive={false} />);
    fireEvent.mouseEnter(container.firstElementChild!.firstElementChild as HTMLElement);
    expect(getEssencePreviewSphere()).toBeNull();
  });
});
