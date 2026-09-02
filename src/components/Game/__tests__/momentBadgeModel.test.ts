/**
 * Moment badge model — THR-1299 slice 4.
 *
 * The badge is the recovery route: it counts what the player has not yet
 * acknowledged, within retention, and nothing else. The arms below pin the
 * three filters (acknowledged, expired, other actor) each by its own record, so
 * a model that dropped one filter would fail on exactly that arm.
 */

import { describe, it, expect } from 'vitest';
import type { UndertakingMomentRecord } from '../../../types/strategicAction';
import { MOMENT_BADGE_RETENTION_TICKS } from '../../../data/strategic-action-constants';
import {
  selectMomentBadges,
  isMomentBadgeable,
  MOMENT_BADGE_COUNT_DISPLAY_MAX,
  MOMENT_BADGE_GLYPH,
  MOMENT_CLASS_ACCENT,
} from '../momentBadgeModel';

function record(overrides: Partial<UndertakingMomentRecord> = {}): UndertakingMomentRecord {
  return {
    id: `m_${overrides.tick ?? 10}_${overrides.actorId ?? 'kael'}_${overrides.momentClass ?? 'at_cost'}`,
    projectId: 'proj_1',
    actorId: 'kael',
    templateId: 'strategic_build_warehouse',
    momentClass: 'at_cost',
    presentation: 'badge',
    tick: 10,
    label: 'Kael presses on with Build Warehouse, but it costs them',
    undertakingName: 'Build Warehouse',
    acknowledged: false,
    ...overrides,
  };
}

describe('selectMomentBadges', () => {
  it('returns no badges for an empty or absent queue', () => {
    expect(selectMomentBadges(undefined, 10).size).toBe(0);
    expect(selectMomentBadges([], 10).size).toBe(0);
  });

  it('builds one badge per actor with the newest record as primary', () => {
    const badges = selectMomentBadges([
      record({ tick: 4, momentClass: 'started' }),
      record({ tick: 19, momentClass: 'complication' }),
      record({ tick: 11 }),
      record({ tick: 12, actorId: 'bram' }),
    ], 20);
    expect([...badges.keys()].sort()).toEqual(['bram', 'kael']);
    const kael = badges.get('kael')!;
    expect(kael.primary.momentClass).toBe('complication');
    expect(kael.count).toBe(3);
    expect(kael.countLabel).toBe('3');
    expect(kael.label).toBe('Trouble');
    expect(kael.accentColor).toBe(MOMENT_CLASS_ACCENT.complication);
    expect(kael.glyph).toBe(MOMENT_BADGE_GLYPH);
    expect(kael.meta).toContain('and 2 more');
    expect(badges.get('bram')!.countLabel).toBeUndefined();
  });

  it('counts neither acknowledged nor expired records — each filter on its own record', () => {
    const now = 100;
    const fresh = record({ tick: now - 1, id: 'fresh' });
    const acked = record({ tick: now - 2, id: 'acked', acknowledged: true });
    const expired = record({ tick: now - MOMENT_BADGE_RETENTION_TICKS - 1, id: 'expired' });
    const edge = record({ tick: now - MOMENT_BADGE_RETENTION_TICKS, id: 'edge' });

    expect(isMomentBadgeable(fresh, now)).toBe(true);
    expect(isMomentBadgeable(acked, now)).toBe(false);
    expect(isMomentBadgeable(expired, now)).toBe(false);
    expect(isMomentBadgeable(edge, now)).toBe(true);

    const badge = selectMomentBadges([fresh, acked, expired, edge], now).get('kael')!;
    expect(badge.records.map(r => r.id).sort()).toEqual(['edge', 'fresh']);
  });

  it('presentation is not a filter — an interrupt the veil hid and a founding both count', () => {
    const badge = selectMomentBadges([
      record({ tick: 10, presentation: 'interrupt', momentClass: 'completion' }),
      record({ tick: 11, presentation: 'badge', momentClass: 'started' }),
    ], 12).get('kael')!;
    expect(badge.count).toBe(2);
  });

  it('collapses the count past the display cap', () => {
    const many = Array.from({ length: MOMENT_BADGE_COUNT_DISPLAY_MAX + 3 }, (_, i) =>
      record({ tick: i + 1, id: `m_${i}` }));
    expect(selectMomentBadges(many, 20).get('kael')!.countLabel).toBe(`${MOMENT_BADGE_COUNT_DISPLAY_MAX}+`);
  });
});
