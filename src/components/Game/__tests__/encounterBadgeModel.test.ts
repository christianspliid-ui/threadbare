/**
 * encounterBadgeModel — THR-664
 *
 * Covers the notification → thread-row mapping that replaced the encounter
 * toast queue: which rows a notification anchors to, when a badge clears, and
 * how multiple pending notifications collapse onto one row.
 */

import { describe, it, expect } from 'vitest';
import type { EncounterNotification } from '../../../types/encounterVisibility';
import {
  selectEncounterBadges,
  buildEncounterNotificationMeta,
  isBadgeWorthy,
  notificationAnchorIds,
  BADGE_COUNT_DISPLAY_MAX,
  BADGE_GLYPH_ACTIVE,
  BADGE_GLYPH_AFTERMATH,
} from '../encounterBadgeModel';
import { shouldAutoOpenEncounterNotification } from '../encounterNotificationRuntime';

function makeNotification(overrides: Partial<EncounterNotification> = {}): EncounterNotification {
  return {
    id: 'notif-1',
    agentId: 'agent-kael',
    agentName: 'Kael Thornweaver',
    courtPosition: 'retinue',
    encounterId: 'enc.plague',
    encounterName: 'Plague Outbreak',
    prose: 'The sickness spreads. Kael stands between it and the village.',
    choices: [],
    createdTick: 10,
    autoResolveTick: null,
    viewed: false,
    resolved: false,
    ...overrides,
  };
}

describe('isBadgeWorthy', () => {
  it('badges a pending, unviewed notification', () => {
    expect(isBadgeWorthy(makeNotification())).toBe(true);
  });

  it('clears once resolved', () => {
    expect(isBadgeWorthy(makeNotification({ resolved: true }))).toBe(false);
  });

  it('clears once viewed — including aftermath, which badges until read', () => {
    expect(isBadgeWorthy(makeNotification({ viewed: true }))).toBe(false);
    expect(isBadgeWorthy(makeNotification({ kind: 'aftermath', viewed: true }))).toBe(false);
    expect(isBadgeWorthy(makeNotification({ kind: 'aftermath', viewed: false }))).toBe(true);
  });
});

/**
 * THR-943 — the badge's *role* is tier-dependent, and the tier is carried by
 * `autoResolveTick`. This crosses into `encounterNotificationRuntime` on purpose:
 * badge-worthiness and auto-open eligibility are two predicates over the same
 * record, and the reopen affordance only exists where they disagree. Held as one
 * assertion so a future edit cannot silently make the badge redundant at both
 * tiers — which would kill THR-664's route into a live beat with every unit test
 * still green.
 */
describe('badge role by attention tier (THR-943)', () => {
  it('auto_resolve: the stage never auto-opens, so the badge is the only route in', () => {
    const notif = makeNotification({ autoResolveTick: 45 });
    expect(shouldAutoOpenEncounterNotification(notif)).toBe(false);
    expect(isBadgeWorthy(notif)).toBe(true);
  });

  it('auto_resolve: an overdue tick neither opens the stage nor retires the badge', () => {
    // Nothing consumes `autoResolveTick` — measured live at tick 113, three
    // notifications sat 32-37 ticks past it, still pending (THR-1068).
    const overdue = makeNotification({ autoResolveTick: 45, createdTick: 30 });
    expect(shouldAutoOpenEncounterNotification(overdue)).toBe(false);
    expect(isBadgeWorthy(overdue)).toBe(true);
  });

  it('pause: the stage auto-opens, and disregard resolves the record that badges it', () => {
    const pending = makeNotification({ autoResolveTick: null });
    expect(shouldAutoOpenEncounterNotification(pending)).toBe(true);
    expect(isBadgeWorthy(pending)).toBe(true);

    // The veil's only close route marks the notification resolved, which is what
    // makes the reopen transition unreachable at this tier.
    const afterDisregard = { ...pending, resolved: true };
    expect(shouldAutoOpenEncounterNotification(afterDisregard)).toBe(false);
    expect(isBadgeWorthy(afterDisregard)).toBe(false);
  });
});

describe('notificationAnchorIds', () => {
  it('falls back to agentId when participantIds is absent (pre-THR-664 records)', () => {
    expect(notificationAnchorIds(makeNotification())).toEqual(['agent-kael']);
  });

  it('returns every participant when populated', () => {
    const notif = makeNotification({ participantIds: ['agent-kael', 'agent-serafina'] });
    expect(notificationAnchorIds(notif)).toEqual(['agent-kael', 'agent-serafina']);
  });

  it('de-duplicates repeated participants', () => {
    const notif = makeNotification({ participantIds: ['agent-kael', 'agent-kael'] });
    expect(notificationAnchorIds(notif)).toEqual(['agent-kael']);
  });
});

describe('buildEncounterNotificationMeta', () => {
  it('reads "step N of M" for a beat', () => {
    const meta = buildEncounterNotificationMeta(makeNotification({ stepIndex: 1, totalSteps: 4 }));
    expect(meta).toBe('step 2 of 4');
  });

  it('appends the outcome-band word when present', () => {
    const meta = buildEncounterNotificationMeta(
      makeNotification({ stepIndex: 1, totalSteps: 4, outcomeBand: 'setback' }),
    );
    expect(meta).toMatch(/^step 2 of 4 · .+/);
  });

  it('reads "concluded" for aftermath', () => {
    expect(buildEncounterNotificationMeta(makeNotification({ kind: 'aftermath' }))).toBe('concluded');
  });

  it('omits the total when the step count is unknown', () => {
    expect(buildEncounterNotificationMeta(makeNotification({ stepIndex: 2 }))).toBe('step 3');
  });
});

describe('selectEncounterBadges', () => {
  it('returns an empty map for no notifications', () => {
    expect(selectEncounterBadges(undefined).size).toBe(0);
    expect(selectEncounterBadges([]).size).toBe(0);
  });

  it('badges the agent a pending notification belongs to', () => {
    const badges = selectEncounterBadges([makeNotification()]);
    const badge = badges.get('agent-kael');
    expect(badge).toBeDefined();
    expect(badge!.count).toBe(1);
    expect(badge!.label).toBe('Plague Outbreak');
    expect(badge!.glyph).toBe(BADGE_GLYPH_ACTIVE);
    expect(badge!.countLabel).toBeUndefined();
  });

  it('omits resolved and viewed notifications', () => {
    const badges = selectEncounterBadges([
      makeNotification({ id: 'a', resolved: true }),
      makeNotification({ id: 'b', agentId: 'agent-other', viewed: true }),
    ]);
    expect(badges.size).toBe(0);
  });

  it('anchors one notification to both threaded participants without duplicating it', () => {
    const notif = makeNotification({ participantIds: ['agent-kael', 'agent-serafina'] });
    const badges = selectEncounterBadges([notif]);

    expect(badges.size).toBe(2);
    expect(badges.get('agent-kael')!.primary).toBe(notif);
    expect(badges.get('agent-serafina')!.primary).toBe(notif);
    // Same object on both rows — one notification, two anchors.
    expect(badges.get('agent-kael')!.primary).toBe(badges.get('agent-serafina')!.primary);
    expect(badges.get('agent-serafina')!.count).toBe(1);
  });

  it('collapses several pending notifications onto one row with a count', () => {
    const badges = selectEncounterBadges([
      makeNotification({ id: 'a', createdTick: 10 }),
      makeNotification({ id: 'b', createdTick: 12, encounterName: 'Ambush' }),
    ]);
    const badge = badges.get('agent-kael')!;
    expect(badge.count).toBe(2);
    expect(badge.countLabel).toBe('2');
    // Most recent becomes the click target.
    expect(badge.primary.id).toBe('b');
    expect(badge.label).toBe('Ambush');
    expect(badge.ariaLabel).toContain('1 more');
  });

  it('caps the displayed count', () => {
    const many = Array.from({ length: BADGE_COUNT_DISPLAY_MAX + 3 }, (_, i) =>
      makeNotification({ id: `n-${i}`, createdTick: i }),
    );
    expect(selectEncounterBadges(many).get('agent-kael')!.countLabel)
      .toBe(`${BADGE_COUNT_DISPLAY_MAX}+`);
  });

  it('marks a concluded encounter as aftermath', () => {
    const badges = selectEncounterBadges([makeNotification({ kind: 'aftermath', outcomeBand: 'surge' })]);
    const badge = badges.get('agent-kael')!;
    expect(badge.kind).toBe('aftermath');
    expect(badge.glyph).toBe(BADGE_GLYPH_AFTERMATH);
    expect(badge.meta).toMatch(/^concluded · /);
    expect(badge.ariaLabel).toContain('concluded');
  });

  it('tints by outcome band, falling back to gold when absent', () => {
    const banded = selectEncounterBadges([makeNotification({ outcomeBand: 'setback' })]).get('agent-kael')!;
    const plain = selectEncounterBadges([makeNotification()]).get('agent-kael')!;
    expect(banded.accentColor).toBe('var(--negative)');
    expect(plain.accentColor).toBe('var(--accent-gold)');
  });

  it('is deterministic — same input, same output', () => {
    const input = [
      makeNotification({ id: 'a', createdTick: 10 }),
      makeNotification({ id: 'b', createdTick: 10, participantIds: ['agent-kael', 'agent-serafina'] }),
    ];
    const first = selectEncounterBadges(input);
    const second = selectEncounterBadges(input);
    expect([...first.keys()]).toEqual([...second.keys()]);
    expect(first.get('agent-kael')!.primary.id).toBe(second.get('agent-kael')!.primary.id);
  });
});
