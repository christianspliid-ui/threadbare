import { describe, it, expect } from 'vitest';
import type { EntityNotice } from '../../../types/notification';
import {
  selectEntityNoticeBadges,
  NOTICE_BADGE_COUNT_DISPLAY_MAX,
  NOTICE_BADGE_GLYPH,
  NOTICE_DEFAULT_ACCENT,
} from '../entityNoticeBadgeModel';

function notice(overrides: Partial<EntityNotice> = {}): EntityNotice {
  return {
    id: 'n1',
    agentId: 'kael',
    message: 'Kael has become Guiding',
    tick: 10,
    category: 'lifecycle',
    ...overrides,
  };
}

describe('selectEntityNoticeBadges', () => {
  it('returns no badges for no notices', () => {
    expect(selectEntityNoticeBadges(undefined).size).toBe(0);
    expect(selectEntityNoticeBadges([]).size).toBe(0);
  });

  it('builds one badge per agent', () => {
    const badges = selectEntityNoticeBadges([
      notice({ id: 'n1', agentId: 'kael' }),
      notice({ id: 'n2', agentId: 'serafina' }),
    ]);
    expect([...badges.keys()].sort()).toEqual(['kael', 'serafina']);
    expect(badges.get('kael')?.count).toBe(1);
  });

  it('picks the most recent notice as primary', () => {
    const badges = selectEntityNoticeBadges([
      notice({ id: 'old', tick: 4, message: 'earlier' }),
      notice({ id: 'new', tick: 19, message: 'latest' }),
      notice({ id: 'mid', tick: 11, message: 'middle' }),
    ]);
    const badge = badges.get('kael')!;
    expect(badge.primary.id).toBe('new');
    expect(badge.count).toBe(3);
    expect(badge.meta).toContain('latest');
    expect(badge.meta).toContain('and 2 more');
  });

  it('omits the count label for a single notice', () => {
    const badge = selectEntityNoticeBadges([notice()]).get('kael')!;
    expect(badge.countLabel).toBeUndefined();
    expect(badge.glyph).toBe(NOTICE_BADGE_GLYPH);
  });

  it('collapses a large count to "N+"', () => {
    const many = Array.from({ length: NOTICE_BADGE_COUNT_DISPLAY_MAX + 3 }, (_, i) =>
      notice({ id: `n${i}`, tick: i }));
    const badge = selectEntityNoticeBadges(many).get('kael')!;
    expect(badge.countLabel).toBe(`${NOTICE_BADGE_COUNT_DISPLAY_MAX}+`);
  });

  it('tints by category and falls back for unmapped ones', () => {
    const lifecycle = selectEntityNoticeBadges([notice({ category: 'lifecycle' })]).get('kael')!;
    const movement = selectEntityNoticeBadges([notice({ category: 'movement' })]).get('kael')!;
    expect(lifecycle.accentColor).toBe('var(--accent-gold)');
    expect(movement.accentColor).toBe(NOTICE_DEFAULT_ACCENT);
  });

  it('names the agent\'s news in the aria-label, including the count', () => {
    const badge = selectEntityNoticeBadges([
      notice({ id: 'a', tick: 1, message: 'first' }),
      notice({ id: 'b', tick: 2, message: 'second' }),
    ]).get('kael')!;
    expect(badge.ariaLabel).toContain('second');
    expect(badge.ariaLabel).toContain('and 1 more');
  });

  it('is deterministic — same notices in, same badges out', () => {
    const input = [notice({ id: 'a', tick: 1 }), notice({ id: 'b', tick: 2 })];
    expect(selectEntityNoticeBadges(input)).toEqual(selectEntityNoticeBadges(input));
  });
});
