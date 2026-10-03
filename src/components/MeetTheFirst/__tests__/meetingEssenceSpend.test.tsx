// @vitest-environment jsdom
/**
 * THR-1706 (3) — Meet The First actually charges.
 *
 * Cold playtest round 2: every tester watched the budget go 600 → 598 → 600.
 * The 598 was a preview while picking; `FormativeTestBeat` committed without
 * spending, and the `essenceSpent` `resolveFormativeTest` computed was read by
 * nothing. These tests drive the real beat through a harness that owns the pool
 * the way `GameView` does — `onSpendEssence` → `spendNudgeEssence` → new pool
 * fed back as a prop — and assert the pool is lower after a hand with cards.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { FormativeTestBeat, type ConvertedTest } from '../FormativeTestBeat';
import { meetingSpendRequests, buildMeetingNudgePhaseModel } from '../buildMeetingNudgePhaseModel';
import { spendNudgeEssence, type EssencePool } from '../../Game/encounter-stage/nudgeCommit';
import { selectDilemmas } from '../../../engine/meetingEncounter';
import { ENRICHED_DILEMMA_LIBRARY } from '../../../data/meeting-dilemma-library';
import type { FormativeTest, NarrativeCandidate } from '../../../types/meetingEncounter';
import type { SphereName } from '../../../types/index';

const CONVERTED = ENRICHED_DILEMMA_LIBRARY.filter((t) => t.test != null);
const TEMPLATE = CONVERTED[0];
const TEST = TEMPLATE.test as FormativeTest;
const PRIMARY: SphereName = 'life';
const START_POOL = { life: 50, force: 50, darkness: 50 } as unknown as EssencePool;

/** The cheapest priced card — affordable in any pool the harness holds. */
const PRICED = [...TEST.nudges].filter((n) => n.essenceCost > 0).sort((a, b) => a.essenceCost - b.essenceCost)[0];

function convertedTests(): ConvertedTest[] {
  // The real selector, so the instance carries `test` the way a run's does.
  const instance = selectDilemmas([TEMPLATE], 'iron', 'gold', 'life', 'any-archetype', 'village', 42)
    .find((i) => i.templateId === TEMPLATE.id)!;
  return [{ instance, test: TEST }];
}

const CANDIDATE = { tempId: 'cand.0', name: 'Wren Ashdown', sphere: 'life' } as unknown as NarrativeCandidate;

let latestPool: EssencePool = START_POOL;

function Harness() {
  const [pool, setPool] = useState<EssencePool>({ ...START_POOL });
  latestPool = pool;
  return (
    <FormativeTestBeat
      candidate={CANDIDATE}
      tests={convertedTests()}
      locationName="Hollowmere"
      essencePool={pool}
      primarySphere={PRIMARY}
      seed={7}
      onSpendEssence={(_index, requests) => {
        setPool((prev) => {
          const spend = spendNudgeEssence(prev, requests, PRIMARY);
          return spend.ok ? spend.pool : prev;
        });
      }}
      onComplete={() => {}}
    />
  );
}

describe('THR-1706 (3) — a formative test with cards spends essence', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fixture holds a priced card (a vacuous suite would pass over a free hand)', () => {
    expect(PRICED, 'converted test has a priced card').toBeDefined();
  });

  it('the pool is lower after committing a priced card, and the primary paid', () => {
    render(<Harness />);
    act(() => { vi.advanceTimersByTime(2000); });

    fireEvent.click(screen.getByTestId(`nudge-card-${PRICED.id}`));
    fireEvent.click(screen.getByTestId('nudge-commit'));

    expect(latestPool.life).toBeCloseTo(START_POOL.life - PRICED.essenceCost, 9);
    // Nothing else moved: the meeting's cards bill the primary first.
    expect(latestPool.force).toBe(START_POOL.force);
    expect(latestPool.darkness).toBe(START_POOL.darkness);
  });

  it('an empty hand charges nothing', () => {
    render(<Harness />);
    act(() => { vi.advanceTimersByTime(2000); });
    fireEvent.click(screen.getByTestId('nudge-commit'));
    expect(latestPool).toEqual(START_POOL);
  });
});

describe('THR-1706 — the meeting names the paying sphere', () => {
  it('every card pays from the primary, and the budget is that pool', () => {
    const phase = buildMeetingNudgePhaseModel({
      test: TEST,
      testId: TEMPLATE.id,
      stepIndex: 0,
      essencePool: START_POOL,
      agentName: 'Wren',
      primarySphere: PRIMARY,
    });
    expect(phase.cards.every((c) => c.payingSphere === PRIMARY)).toBe(true);
    expect(phase.budgetSphere).toBe(PRIMARY);
    expect(phase.budgetSphereEssence).toBe(START_POOL.life);
  });

  it('spend requests are sphere-less and skip free cards', () => {
    const free = TEST.nudges.find((n) => n.essenceCost <= 0);
    const ids = [PRICED.id, ...(free ? [free.id] : []), 'not-a-card'];
    expect(meetingSpendRequests(TEST, ids)).toEqual([{ sphere: undefined, cost: PRICED.essenceCost }]);
  });
});
