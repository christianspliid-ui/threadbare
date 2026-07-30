import { describe, it, expect } from 'vitest';
import type { EntityNotice } from '../../../types/notification';
import {
  selectEntityNoticeBadges,
  resolveNoticeLabel,
  NOTICE_BADGE_COUNT_DISPLAY_MAX,
  NOTICE_BADGE_GLYPH,
  NOTICE_DEFAULT_ACCENT,
  NOTICE_DEFAULT_LABEL,
  NOTICE_CATEGORY_LABEL,
  NOTICE_FACTION_CATEGORY_LABEL,
  NOTICE_FACTION_DEFAULT_LABEL,
  NOTICE_ARIA_OPEN_SUFFIX,
} from '../entityNoticeBadgeModel';

function notice(overrides: Partial<EntityNotice> = {}): EntityNotice {
  return {
    id: 'n1',
    anchorId: 'kael',
    anchorKind: 'agent',
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

  it('builds one badge per anchor', () => {
    const badges = selectEntityNoticeBadges([
      notice({ id: 'n1', anchorId: 'kael' }),
      notice({ id: 'n2', anchorId: 'serafina' }),
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

/**
 * THR-667 — faction anchors.
 *
 * The grouping key widened from an agent id to any thread-row node id. These
 * tests pin the two things that could silently regress: a faction bucket must
 * carry its own `anchorKind` through to the model (otherwise GameView would open
 * the wrong panel section), and the tooltip wording must stop describing an
 * institution as a person.
 */
describe('selectEntityNoticeBadges — faction anchors', () => {
  const factionNotice = (overrides: Partial<EntityNotice> = {}): EntityNotice => notice({
    id: 'f1',
    anchorId: 'faction_iron_guard',
    anchorKind: 'faction',
    message: 'Kael has been promoted to Journeyman in the Iron Guard.',
    category: 'social',
    ...overrides,
  });

  it('keys a faction notice by its faction node id, not the member', () => {
    const badges = selectEntityNoticeBadges([factionNotice()]);
    expect([...badges.keys()]).toEqual(['faction_iron_guard']);
  });

  it('carries anchorKind through to the model so the click opens the faction section', () => {
    const badge = selectEntityNoticeBadges([factionNotice()]).get('faction_iron_guard')!;
    expect(badge.anchorKind).toBe('faction');
    expect(badge.anchorId).toBe('faction_iron_guard');
  });

  it('keeps agent and faction rows in separate buckets', () => {
    const badges = selectEntityNoticeBadges([
      notice({ id: 'a1', anchorId: 'kael' }),
      factionNotice({ id: 'f1' }),
    ]);
    expect(badges.get('kael')?.anchorKind).toBe('agent');
    expect(badges.get('faction_iron_guard')?.anchorKind).toBe('faction');
  });

  it('uses institution wording for a faction row, not the agent phrasing', () => {
    const faction = selectEntityNoticeBadges([factionNotice()]).get('faction_iron_guard')!;
    const agent = selectEntityNoticeBadges([
      notice({ category: 'social' }),
    ]).get('kael')!;
    expect(faction.label).toBe(NOTICE_FACTION_CATEGORY_LABEL.social);
    expect(agent.label).toBe(NOTICE_CATEGORY_LABEL.social);
    expect(faction.label).not.toBe(agent.label);
  });

  it('points the aria-label at the faction\'s thread', () => {
    const badge = selectEntityNoticeBadges([factionNotice()]).get('faction_iron_guard')!;
    expect(badge.ariaLabel).toContain(NOTICE_ARIA_OPEN_SUFFIX.faction);
    expect(badge.ariaLabel).not.toContain(NOTICE_ARIA_OPEN_SUFFIX.agent);
  });
});

describe('resolveNoticeLabel', () => {
  it('prefers the faction override for a faction anchor', () => {
    expect(resolveNoticeLabel('social', 'faction')).toBe(NOTICE_FACTION_CATEGORY_LABEL.social);
    expect(resolveNoticeLabel('social', 'agent')).toBe(NOTICE_CATEGORY_LABEL.social);
  });

  it('falls back to the agent label when a category has no faction override', () => {
    // `encounters` is mapped for agents only — the agent wording is fine here.
    expect(NOTICE_FACTION_CATEGORY_LABEL.encounters).toBeUndefined();
    expect(resolveNoticeLabel('encounters', 'faction')).toBe(NOTICE_CATEGORY_LABEL.encounters);
  });

  it('falls back to a kind-appropriate default when neither map has the category', () => {
    expect(NOTICE_CATEGORY_LABEL.movement).toBeUndefined();
    expect(resolveNoticeLabel('movement', 'agent')).toBe(NOTICE_DEFAULT_LABEL);
    expect(resolveNoticeLabel('movement', 'faction')).toBe(NOTICE_FACTION_DEFAULT_LABEL);
  });
});
