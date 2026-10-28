/**
 * threadTugBadgeModel tests — THR-665
 *
 * Covers the selector that replaced the map's tug vibration: which rows get a
 * badge, which tug a click attends, and whether the pool can cover the cost.
 */

import { describe, it, expect } from 'vitest';
import {
  selectThreadTugBadges,
  tugAttendCost,
  isTugBadgeWorthy,
  TUG_BADGE_ICON,
  TUG_THREAT_ACCENT,
  TUG_DEFAULT_ACCENT,
  TUG_BADGE_COUNT_DISPLAY_MAX,
  formatAttendCost,
} from '../threadTugBadgeModel';
import type { ThreadTug } from '../../../types/attention';

function makeTug(overrides: Partial<ThreadTug> = {}): ThreadTug {
  return {
    id: 'tug-1',
    agentId: 'agent-1',
    encounterId: 'enc-1',
    reachPrimary: 'might',
    threatLevel: 'moderate',
    courtPosition: 'retinue',
    createdTick: 10,
    expiresTick: 20,
    attended: false,
    curationScore: 1,
    ...overrides,
  } as ThreadTug;
}

/** Pool large enough that affordability is never the thing under test. */
const RICH_POOL = 9999;

describe('isTugBadgeWorthy', () => {
  it('badges an unattended tug', () => {
    expect(isTugBadgeWorthy(makeTug())).toBe(true);
  });

  it('drops a tug that has already been attended', () => {
    expect(isTugBadgeWorthy(makeTug({ attended: true }))).toBe(false);
  });
});

describe('selectThreadTugBadges', () => {
  it('returns an empty map for no tugs', () => {
    expect(selectThreadTugBadges(undefined, RICH_POOL).size).toBe(0);
    expect(selectThreadTugBadges([], RICH_POOL).size).toBe(0);
  });

  it('anchors a badge to the tugged agent row', () => {
    const badges = selectThreadTugBadges([makeTug()], RICH_POOL);
    const badge = badges.get('agent-1');

    expect(badge).toBeDefined();
    expect(badge!.count).toBe(1);
    expect(badge!.icon).toBe(TUG_BADGE_ICON);
    expect(badge!.countLabel).toBeUndefined();
  });

  it('omits attended tugs — the row clears once the player has paid', () => {
    const badges = selectThreadTugBadges([makeTug({ attended: true })], RICH_POOL);
    expect(badges.get('agent-1')).toBeUndefined();
  });

  it('groups several tugs on one row and counts them', () => {
    const badges = selectThreadTugBadges(
      [makeTug({ id: 'a' }), makeTug({ id: 'b' }), makeTug({ id: 'c' })],
      RICH_POOL,
    );
    const badge = badges.get('agent-1')!;

    expect(badge.count).toBe(3);
    expect(badge.countLabel).toBe('3');
  });

  it('collapses a large count to "N+"', () => {
    const tugs = Array.from({ length: TUG_BADGE_COUNT_DISPLAY_MAX + 3 }, (_, i) =>
      makeTug({ id: `tug-${i}` }),
    );
    const badge = selectThreadTugBadges(tugs, RICH_POOL).get('agent-1')!;

    expect(badge.countLabel).toBe(`${TUG_BADGE_COUNT_DISPLAY_MAX}+`);
  });

  it('keeps separate agents on separate rows', () => {
    const badges = selectThreadTugBadges(
      [makeTug(), makeTug({ id: 'tug-2', agentId: 'agent-2' })],
      RICH_POOL,
    );

    expect(badges.size).toBe(2);
    expect(badges.get('agent-1')!.count).toBe(1);
    expect(badges.get('agent-2')!.count).toBe(1);
  });

  it('picks the highest-curation tug as primary — the badge agrees with the curator', () => {
    const badge = selectThreadTugBadges(
      [
        makeTug({ id: 'low',  curationScore: 1 }),
        makeTug({ id: 'high', curationScore: 9 }),
      ],
      RICH_POOL,
    ).get('agent-1')!;

    expect(badge.primary.id).toBe('high');
  });

  it('breaks a curation tie with the newer tug, deterministically', () => {
    const badge = selectThreadTugBadges(
      [
        makeTug({ id: 'old', curationScore: 5, createdTick: 3 }),
        makeTug({ id: 'new', curationScore: 5, createdTick: 8 }),
      ],
      RICH_POOL,
    ).get('agent-1')!;

    expect(badge.primary.id).toBe('new');
  });

  it('tints by threat level from tokens', () => {
    for (const threat of ['moderate', 'hard', 'deadly'] as const) {
      const badge = selectThreadTugBadges([makeTug({ threatLevel: threat })], RICH_POOL)
        .get('agent-1')!;
      expect(badge.accentColor).toBe(TUG_THREAT_ACCENT[threat]);
    }
  });

  it('falls back to the default accent for an unrecognised threat level', () => {
    const badge = selectThreadTugBadges(
      [makeTug({ threatLevel: 'nonsense' as ThreadTug['threatLevel'] })],
      RICH_POOL,
    ).get('agent-1')!;

    expect(badge.accentColor).toBe(TUG_DEFAULT_ACCENT);
  });

  it('says what looking in leaves you, in words, never the cost figure (THR-2062 C2)', () => {
    const tug = makeTug({ threatLevel: 'hard' });
    const cost = tugAttendCost(tug);
    // Pool 3 of 6, pays 1.5 → 1.5 of 6 = 0.25, which the gauge calls Strained.
    const badge = selectThreadTugBadges([tug], 3, 6).get('agent-1')!;

    expect(badge.attendCost).toBe(cost);
    expect(badge.meta).toBe('hard · look in, leaves you Strained');
    expect(badge.ariaLabel).toBe('The thread pulls, hard — look in, leaves you Strained');
    expect(badge.meta).not.toContain(formatAttendCost(cost));
    expect(badge.meta).not.toMatch(/[0-9]/);
  });

  it('says only "look in" when the pool stays Focused after paying', () => {
    const badge = selectThreadTugBadges([makeTug()], 6, 6).get('agent-1')!;
    expect(badge.meta).toBe('moderate · look in');
  });

  it('a livelihood tug names the home and the good, and is free (THR-2062)', () => {
    const scarce = makeTug({ kind: 'livelihood', livelihoodResourceId: 'fresh_water', livelihoodTier: 'scarce' });
    const surplus = makeTug({ kind: 'livelihood', livelihoodResourceId: 'fish', livelihoodTier: 'surplus' });
    const short = selectThreadTugBadges([scarce], 0, 6).get('agent-1')!;
    const spare = selectThreadTugBadges([surplus], 0, 6).get('agent-1')!;

    expect(short.attendCost).toBe(0);
    expect(short.affordable).toBe(true);
    expect(short.meta).toMatch(/^their home is short of /);
    expect(short.ariaLabel).toMatch(/^The thread pulls — their home is short of /);
    expect(spare.meta).toMatch(/^their home has .+ to spare$/);
  });

  it('never shows float noise in the stated cost', () => {
    for (const tug of [
      makeTug({ threatLevel: 'moderate', courtPosition: 'the_first' }),
      makeTug({ threatLevel: 'hard',     courtPosition: 'watched' }),
      makeTug({ threatLevel: 'deadly',   courtPosition: 'retinue' }),
    ]) {
      const badge = selectThreadTugBadges([tug], RICH_POOL).get('agent-1')!;
      expect(badge.meta).not.toMatch(/\d\.\d{3,}/);
    }
  });

  it('marks a tug affordable when the pool covers the cost', () => {
    const cost = tugAttendCost(makeTug());
    const badge = selectThreadTugBadges([makeTug()], cost).get('agent-1')!;

    expect(badge.affordable).toBe(true);
    expect(badge.meta).not.toContain('cannot spare');
  });

  it('marks a tug unaffordable when the pool falls short, and says so', () => {
    const cost = tugAttendCost(makeTug());
    const badge = selectThreadTugBadges([makeTug()], cost - 1).get('agent-1')!;

    expect(badge.affordable).toBe(false);
    expect(badge.meta).toBe('moderate · you cannot spare the attention');
    expect(badge.ariaLabel).toBe('The thread pulls, moderate — you cannot spare the attention');
  });

  it('is deterministic — same input, same output', () => {
    const tugs = [makeTug({ id: 'a', curationScore: 2 }), makeTug({ id: 'b', curationScore: 7 })];
    const first = selectThreadTugBadges(tugs, RICH_POOL).get('agent-1')!;
    const second = selectThreadTugBadges(tugs, RICH_POOL).get('agent-1')!;

    expect(second).toEqual(first);
  });
});

describe('tugAttendCost', () => {
  it('scales with threat level', () => {
    const moderate = tugAttendCost(makeTug({ threatLevel: 'moderate' }));
    const deadly   = tugAttendCost(makeTug({ threatLevel: 'deadly' }));

    expect(deadly).toBeGreaterThan(moderate);
  });

  it('fails soft on a dormant court position rather than throwing', () => {
    expect(() =>
      tugAttendCost(makeTug({ courtPosition: 'dormant' as ThreadTug['courtPosition'] })),
    ).not.toThrow();
    expect(tugAttendCost(makeTug({ courtPosition: 'dormant' as ThreadTug['courtPosition'] })))
      .toBeGreaterThan(0);
  });
});
