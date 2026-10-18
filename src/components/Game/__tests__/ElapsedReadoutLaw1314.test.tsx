// @vitest-environment jsdom
/**
 * Every player-facing **elapsed and duration** readout reads in words, never in ticks (THR-1425).
 *
 * The sibling of `TickReadoutLaw1314.test.tsx`, which pins THR-1423's *remaining* terms. Same two
 * laws, different fields: `ticksAgo`, `ticksActive`, `ticksSince`, `durationTicks`, `tickLimit`,
 * and the divine receipt's elapsed span (pinned in `DivineReceiptModal.test.tsx`, beside the
 * assertion it replaced). Kept as its own file rather than folded into the THR-1423 guard so the
 * two sweeps do not collide on one file — the ticket's coordination block calls out that four of
 * these components are mutex surfaces.
 *
 * ## The contract under test
 *
 * A bare integer beside the word "ticks" fails **Law 13** (raw magnitude) and **Law 14** (an
 * engine unit with no player-facing display name) at once. Two readings resolve it, and which
 * one a site takes is the whole of this ticket's design decision:
 *
 * * **`durationLabel`** for a *term* — how long something lasts (`durationTicks`, `tickLimit`,
 *   the schism's remaining window). Floors to `one day`, which is right for a term.
 * * **`elapsedLabel`** for an *elapsed span* — how long ago, or how long so far (`ticksAgo`,
 *   `ticksActive`, `ticksSince`, the receipt). Reads under a day as `less than a day`, because
 *   `durationLabel`'s floor would state something false: a thing that happened three ticks ago
 *   did not happen `one day ago`.
 *
 * ## Why the floor is asserted separately everywhere
 *
 * `elapsedLabel` delegates to `durationLabel` above a day, so an arm that only ever exercises
 * the multi-day branch would pass identically against `durationLabel` — it would prove the
 * numeral is gone while proving nothing about the reading that was chosen. Every elapsed arm
 * below therefore renders **both** a sub-day and a multi-day value. That is the difference this
 * ticket exists to make, so it is the difference the guard has to be able to see.
 *
 * ## Falsification (THR-1421's lesson, restated because it was learned the hard way)
 *
 * Every arm below was falsified by mutating the branch its fixture actually exercises — reverting
 * each call site to its raw-tick string — and watching it go red, then restored. A guard that has
 * only been watched going green has not been tested.
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
import { durationLabel, elapsedLabel } from '../../../engine/aftermathWords';
import { TICKS_PER_DAY } from '../../../data/attention-constants';

import { MandateDetail } from '../MandateDetail';

import type { MandateDefinition, MandateState } from '../../../types/mandate';

/** Under `TICKS_PER_DAY` (12), so `elapsedLabel` takes its floor branch. */
const SUB_DAY_TICKS = 3;
/** Four days at `TICKS_PER_DAY` — inside the spelled-count ladder, so it reads `four days`. */
const FOUR_DAYS_IN_TICKS = 48;

const SUB_DAY = elapsedLabel(SUB_DAY_TICKS);
const FOUR_DAYS = durationLabel(FOUR_DAYS_IN_TICKS);

/** Guards a rendered string: real words, no numeral, and the engine unit never named. */
function expectWordsNotTicks(text: string): void {
  expect(text).toMatch(/[a-z]/i);
  expect(text).not.toMatch(/\d/);
  expect(text).not.toMatch(/tick/i);
}

const noop = () => {};

describe('THR-1425 — elapsed and duration readouts read in words, never in ticks', () => {
  // ── The readings themselves ──────────────────────────────────────────────

  it('the two readings disagree below a day, which is the reason both exist', () => {
    // If they agreed everywhere, every arm below would be asserting nothing about which
    // reading its call site took. Pin the divergence before trusting it as a fixture.
    expect(SUB_DAY_TICKS).toBeLessThan(TICKS_PER_DAY);
    expect(elapsedLabel(SUB_DAY_TICKS)).toBe('less than a day');
    expect(durationLabel(SUB_DAY_TICKS)).toBe('one day');
    expect(elapsedLabel(SUB_DAY_TICKS)).not.toBe(durationLabel(SUB_DAY_TICKS));

    // Above a day they converge — one ladder, so a `TICKS_PER_DAY` retune moves both.
    expect(elapsedLabel(FOUR_DAYS_IN_TICKS)).toBe(FOUR_DAYS);
    expect(FOUR_DAYS).toBe('four days');

    expectWordsNotTicks(SUB_DAY);
    expectWordsNotTicks(FOUR_DAYS);
  });

  it('elapsedLabel never emits a numeral across the whole range it can be handed', () => {
    // Swept over the measured range rather than two sample points: the floor branch, the
    // spelled-count day ladder, and the week ladder above it all have to stay numeral-free.
    for (let t = 0; t <= 400; t++) {
      const reading = elapsedLabel(t);
      expect(reading, `elapsedLabel(${t})`).not.toMatch(/\d/);
      expect(reading, `elapsedLabel(${t})`).not.toMatch(/tick/i);
    }
    // Fail-soft (NFP #4): a non-finite or negative span is a designed state, not a throw.
    expect(elapsedLabel(Number.NaN)).toBe('less than a day');
    expect(elapsedLabel(-5)).toBe('less than a day');
  });

  // ── MandateDetail — `tickLimit` ──────────────────────────────────────────

  it('MandateDetail: the Time Limit row reads a term in words, and the label carries the unit once', () => {
    const definition = {
      id: 'mandate.1',
      type: 'graph_state',
      name: 'Node Dominance',
      description: 'Establish control over the world-graph',
      tickLimit: FOUR_DAYS_IN_TICKS,
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
    } as unknown as MandateState;

    render(<MandateDetail open onClose={noop} definition={definition} state={state} />);

    const value = screen.getByText(FOUR_DAYS, { exact: true });
    expectWordsNotTicks(value.textContent!);
    // The row already says "Time Limit"; the value spelling `ticks` put the unit on the
    // surface a second time, which is the half of Law 14 that lives outside the numeral.
    expect(screen.queryByText(new RegExp(`${FOUR_DAYS_IN_TICKS}\\s*ticks`))).toBeNull();
  });

});
