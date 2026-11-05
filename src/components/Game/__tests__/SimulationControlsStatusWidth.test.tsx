// @vitest-environment jsdom
/**
 * THR-2166 — the top bar's clock status line has a fixed width. Sized to its text, it moved
 * Needs you / News (the next items in the bar) sideways with every status string, and the
 * warm playtest's clicks aimed at them missed. jsdom has no layout, so the pin is the cause:
 * every status string renders the line at the same width, so whatever follows it does not move.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SimulationControls, TOPBAR_TIME_STATUS_MAX_REM, TOPBAR_TIME_STATUS_MIN_REM } from '../SimulationControls';

type Variant = Partial<{ running: boolean; held: boolean; heldBy: string; answerStatus: string; namedPause: string; firstRunPrompt: boolean }>;

function statusLineWidth(v: Variant, statusNarrow = false): string {
  const { container, unmount } = render(
    <SimulationControls
      season="spring" year={1} running={v.running ?? false} speed={1}
      onToggle={vi.fn()} onStep={vi.fn()} onSpeedChange={vi.fn()}
      compact statusNarrow={statusNarrow}
      held={v.held} heldBy={v.heldBy} answerStatus={v.answerStatus}
      namedPause={v.namedPause} firstRunPrompt={v.firstRunPrompt}
    />,
  );
  const line = container.querySelector<HTMLElement>('[data-status-narrow], .topbar-tier span[style*="italic"]');
  const width = line?.style.width ?? '';
  unmount();
  return width;
}

const VARIANTS: Variant[] = [
  {},
  { running: true },
  { held: true, running: true },
  { held: true, heldBy: 'the Chapter Ledger' },
  { answerStatus: 'turning · until The Gallows Pardon answers', running: true },
  { namedPause: 'The Gallows Pardon' },
  { firstRunPrompt: true },
];

describe('SimulationControls — the status line does not change width with its text (THR-2166)', () => {
  it('every status string renders the line at the full cap', () => {
    const widths = VARIANTS.map(v => statusLineWidth(v));
    expect(new Set(widths)).toEqual(new Set([`${TOPBAR_TIME_STATUS_MAX_REM}rem`]));
  });

  it('narrowed by the bar fit, every status string renders at the narrow cap', () => {
    const widths = VARIANTS.map(v => statusLineWidth(v, true));
    expect(new Set(widths)).toEqual(new Set([`${TOPBAR_TIME_STATUS_MIN_REM}rem`]));
  });
});
