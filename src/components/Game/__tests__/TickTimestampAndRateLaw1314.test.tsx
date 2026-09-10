// @vitest-environment jsdom
/**
 * The two tick shapes that THR-1423 and THR-1425 deliberately left behind: **absolute tick
 * timestamps** and **per-tick rates** (THR-1426).
 *
 * The third sibling of `TickReadoutLaw1314.test.tsx` (THR-1423's *remaining* terms) and
 * `ElapsedReadoutLaw1314.test.tsx` (THR-1425's elapsed and duration spans). Same two laws
 * again, but neither earlier reading answered these, which is why they needed a ruling rather
 * than a swap:
 *
 * * A **timestamp** (`t42`, `Tick 42`, `on tick 42`) is a point in time, not a span. Both
 *   `durationLabel` and `elapsedLabel` answer *"how long?"*; none of these rows was asking that.
 * * A **rate** (`regen 1.5/tick`, `2/order …/tick`) is a quantity per unit time, and the
 *   numerator is a resource magnitude in its own right.
 *
 * ## The rulings this file pins
 *
 * **Shape 1 — timestamps: convert where the row needs ordering, drop where it does not.** The
 * game has no calendar to date a row against. (The top bar carries a season and a year, but
 * `year` is derived as `tick / 120` while a season is `DEFAULT_TICKS_PER_SEASON` = 90 ticks —
 * four seasons make 360, not 120 — so the two disagree by threefold and neither can date a
 * chronicle row against the row above it. That inconsistency is real and tracked separately;
 * it is *why* this ruling does not reach for a calendar, not a thing this file asserts.) So
 * rows that need ordering read as an elapsed span through `elapsedLabel`, and rows nobody acts
 * on — the mandate's assignment tick, the world-pulse counter, the two clock readouts in the
 * time controls — are removed rather than rephrased.
 *
 * **Shape 2 — rates: the ThreadsPanel treatment generalises; the top-bar regen is dropped.**
 * THR-1008 banded the sustain row's per-tick flow to words and kept `⤓`/`⤒` as the direction
 * cue. The hex chronicle's control-effect cost and income take exactly that shape, through the
 * same `SUSTAIN_FLOW_BANDS` ladder. The attention *pool* keeps its figures under Law 13's
 * ratified persistent-chrome exception (2026-08-06, THR-890), but that exception covers
 * **balances, not rates** — so `regen n/tick` is dropped from the bar and its tooltip.
 *
 * ## Falsification
 *
 * Every arm below was falsified by reverting its call site to the raw-tick string it replaced
 * and watching that arm go red, then restored. Where a fixture could take `elapsedLabel`'s
 * `less than a day` floor, the fixture drives a **multi-day** span instead: the floor is also
 * what an *unwired* component renders when `currentTick` is absent, so an arm resting on it
 * would pass against code that was never connected. That trap is the reason each fixture below
 * states its current tick explicitly.
 *
 * ## Browser-verify substitution
 *
 * These render assertions stand in for the contractual 1920×1080 pixel capture, which an
 * unattended run cannot produce (`preview_start` is refused outright — impediments #546, #574).
 * They establish that the change reached the surface; they do not cover paint, overflow or
 * z-index, which only pixels can. The pixel pass is owed and named in the PR.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { elapsedLabel } from '../../../engine/aftermathWords';
import { TICKS_PER_DAY } from '../../../data/attention-constants';
import { sustainFlowSpheres, sustainFlowWord } from '../../../data/sustained-control-status-prose';

import { MandateDetail } from '../MandateDetail';
import { RecentActivityLog } from '../RecentActivityLog';
import { AttentionPoolIndicator } from '../AttentionPoolIndicator';
import { SimulationControls } from '../SimulationControls';

import type { MandateDefinition, MandateState } from '../../../types/mandate';
import type { DigestEntry } from '../../../types/attention';

/** Four days at `TICKS_PER_DAY` (12) — above the floor, inside the spelled-count ladder. */
const FOUR_DAYS_IN_TICKS = 48;
const FOUR_DAYS = elapsedLabel(FOUR_DAYS_IN_TICKS);

const noop = () => {};

/** Real words, no numeral, and the engine unit never named. */
function expectWordsNotTicks(text: string | null): void {
  expect(text).toBeTruthy();
  expect(text!).toMatch(/[a-z]/i);
  expect(text!).not.toMatch(/\d/);
  expect(text!).not.toMatch(/tick/i);
}

describe('THR-1426 — tick timestamps and per-tick rates', () => {
  it('the fixture span is above the floor, so the arms below cannot pass on an unwired component', () => {
    // The load-bearing premise of every timestamp arm in this file. `elapsedLabel` renders
    // `less than a day` both for a genuinely recent row AND for a component that was never
    // handed a current tick — so if the fixtures sat below the floor, every arm would be
    // satisfied by code that does no wiring at all. Pin the separation before relying on it.
    expect(FOUR_DAYS_IN_TICKS).toBeGreaterThan(TICKS_PER_DAY);
    expect(FOUR_DAYS).toBe('four days');
    expect(elapsedLabel(0)).toBe('less than a day');
    expect(FOUR_DAYS).not.toBe(elapsedLabel(0));
    expectWordsNotTicks(FOUR_DAYS);
  });

  // ── Shape 2: the per-sphere flow reading ─────────────────────────────────

  describe('sustainFlowSpheres — the per-sphere rate reading (Shape 2)', () => {
    it('bands each sphere through the shared ladder rather than printing the figure', () => {
      const reading = sustainFlowSpheres({ order: 4, wild: 1 });
      expect(reading).toBe(`${sustainFlowWord(4)} order, ${sustainFlowWord(1)} wild`);
      expect(reading).toBe('steady order, slight wild');
      expectWordsNotTicks(reading);
    });

    it('composes off the same ladder as the ThreadsPanel row, so a retune moves both (UI Law 3)', () => {
      // Not a restatement of the arm above: that one pins today's words, this one pins that the
      // words come from `sustainFlowWord` rather than a copied band table. Sweeping the measured
      // range catches a divergence at any rung, not just the two the previous arm samples.
      for (let v = 1; v <= 40; v++) {
        expect(sustainFlowSpheres({ order: v })).toBe(`${sustainFlowWord(v)} order`);
        expectWordsNotTicks(sustainFlowSpheres({ order: v }));
      }
    });

    it('returns null for an absent or empty map so the caller owns the empty phrasing', () => {
      // A cost of nothing and an income of nothing want different sentences, so the reading
      // declines to invent one. Fail-soft (NFP #4): non-positive and non-finite entries are
      // designed states, not throws.
      expect(sustainFlowSpheres(undefined)).toBeNull();
      expect(sustainFlowSpheres({})).toBeNull();
      expect(sustainFlowSpheres({ order: 0 })).toBeNull();
      expect(sustainFlowSpheres({ order: Number.NaN })).toBeNull();
    });
  });

  // ── Shape 2: AttentionPoolIndicator — the rate is dropped, the balance kept ──

  describe('AttentionPoolIndicator (Shape 2)', () => {
    it('drops the regen rate from the bar and its tooltip, keeping the pool balance', () => {
      const { container } = render(
        <AttentionPoolIndicator attentionPool={12} attentionCapacity={20} attentionRegen={1.5} />,
      );

      // The rate is gone from both surfaces it appeared on.
      expect(container.textContent).not.toMatch(/tick/i);
      expect(container.textContent).not.toMatch(/regen/i);
      expect(container.innerHTML).not.toMatch(/tick/i);

      // The balance stays — Law 13's persistent-chrome exception covers it, and an arm that
      // only checked "no ticks" would also pass if the whole indicator had been deleted.
      const labelled = container.querySelector('[aria-label]');
      expect(labelled?.getAttribute('aria-label')).toContain('12.0 / 20.0');
    });
  });

  // ── Shape 1: the two clock readouts in the time controls are dropped ─────

  describe('SimulationControls (Shape 1)', () => {
    it('drops the tick counter from the compact tier, keeping season and year', () => {
      const { container } = render(
        <SimulationControls
          season="autumn"
          year={3}
          running={false}
          speed={1}
          onToggle={noop}
          onStep={noop}
          onSpeedChange={noop}
          compact
        />,
      );
      expect(container.textContent).not.toMatch(/tick/i);
      // Season and year are the orientation the tier exists for — if they had gone too, the
      // "no ticks" assertion above would still pass and the drop would have been a deletion.
      expect(container.textContent).toContain('autumn');
      expect(container.textContent).toContain('year 3');
    });

    it('drops the tick counter from the full panel header too', () => {
      const { container } = render(
        <SimulationControls
          season="winter"
          year={2}
          running
          speed={2}
          onToggle={noop}
          onStep={noop}
          onSpeedChange={noop}
        />,
      );
      expect(container.textContent).not.toMatch(/tick/i);
      expect(container.textContent).toContain('Time');
    });
  });

  // ── Shape 1: RecentActivityLog rows read as elapsed spans ────────────────

  describe('RecentActivityLog (Shape 1)', () => {
    const entries = [
      {
        encounterId: 'enc.1',
        tick: 10,
        reachPrimary: 'iron',
        success: true,
        capabilityChanges: {},
        wasCuratedOut: false,
      },
    ] as unknown as DigestEntry[];

    it('reads each row as an elapsed span, never a tick index', () => {
      render(<RecentActivityLog entries={entries} lastViewedTick={0} currentTick={10 + FOUR_DAYS_IN_TICKS} />);
      const row = screen.getByText(/ ago$/);
      expect(row.textContent).toBe(`${FOUR_DAYS} ago`);
      expectWordsNotTicks(row.textContent);
    });

    it('degrades to the floor rather than throwing when no current tick is supplied (NFP #4)', () => {
      // The prop is optional because both call sites predate it. A missing clock must still
      // render English — and must NOT render `t10`.
      const { container } = render(<RecentActivityLog entries={entries} lastViewedTick={0} />);
      expect(container.textContent).toContain('less than a day ago');
      expect(container.textContent).not.toMatch(/\bt10\b/);
    });
  });

  // ── Shape 1: MandateDetail — one row converted, one row dropped ──────────

  describe('MandateDetail (Shape 1)', () => {
    const definition = {
      id: 'mandate.1',
      type: 'graph_state',
      name: 'Node Dominance',
      description: 'Establish control over the world-graph',
      stages: [
        {
          stage: 'setup',
          description: 'Create foundational nodes',
          conditions: [
            { type: 'node_count', description: 'Achieve 50 nodes', params: { minNodes: 50 } },
          ],
        },
      ],
    } as unknown as MandateDefinition;

    const state = {
      mandateId: 'mandate.1',
      currentStage: 'setup',
      progress: 0.5,
      completed: false,
      failed: false,
      assignedTick: 42,
    } as unknown as MandateState;

    it('drops the "Assigned: Tick N" row entirely', () => {
      // The ruling is *drop*, not convert — when a mandate was handed down is not something a
      // player acts on. Asserting the label is gone, not merely that the numeral is, is what
      // separates this from a conversion.
      //
      // Read `document.body`, NOT `render`'s container: `Modal` renders through `createPortal`,
      // so the container is empty and every assertion against it passes on a modal that never
      // rendered at all. This arm was written that way first and did not go red when the row
      // was restored — the positive control below is what caught it and is why it stays.
      render(
        <MandateDetail open onClose={noop} definition={definition} state={state} currentTick={90} />,
      );
      const modalText = document.body.textContent ?? '';

      // Positive control: the modal really did render, so the two absence assertions below
      // are about a surface that exists rather than about an empty string.
      expect(modalText).toContain('Node Dominance');
      expect(modalText).toContain('Details');

      expect(modalText).not.toMatch(/Assigned/);
      expect(modalText).not.toMatch(/tick/i);
    });
  });
});
