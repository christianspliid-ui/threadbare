import { describe, it, expect } from 'vitest';
import {
  STARTER_ACTION_IDS,
  STARTER_ACTION_COUNT,
  isActionRevealed,
  isStarterAction,
} from '../actionUnlock';

describe('actionUnlock — STARTER_ACTION_IDS shape (THR-419)', () => {
  it('exposes a count constant matching the ID list length', () => {
    expect(STARTER_ACTION_IDS).toHaveLength(STARTER_ACTION_COUNT);
  });

  it('contains no duplicate IDs', () => {
    expect(new Set(STARTER_ACTION_IDS).size).toBe(STARTER_ACTION_IDS.length);
  });
});

describe('isActionRevealed — Gate 8 predicate (THR-419)', () => {
  it('returns true for templates carrying starter: true', () => {
    const tmpl = { id: 'arbitrary.id', starter: true } as const;
    expect(isActionRevealed(tmpl, [])).toBe(true);
    expect(isActionRevealed(tmpl, undefined)).toBe(true);
    expect(isActionRevealed(tmpl, ['unrelated'])).toBe(true);
  });

  it('returns true for templates whose id is in STARTER_ACTION_IDS even without the flag (data fail-soft)', () => {
    // hex.survey is in STARTER_ACTION_IDS — predicate should surface it
    // even when the template object is missing the `starter` flag.
    const tmpl = { id: 'hex.survey' } as const;
    expect(isActionRevealed(tmpl, [])).toBe(true);
    expect(isActionRevealed(tmpl, undefined)).toBe(true);
  });

  it('returns false for non-starter templates when unlockedActionIds is empty or undefined', () => {
    const tmpl = { id: 'locked.foo', starter: false } as const;
    expect(isActionRevealed(tmpl, [])).toBe(false);
    expect(isActionRevealed(tmpl, undefined)).toBe(false);
  });

  it('returns true once the template id is added to unlockedActionIds', () => {
    const tmpl = { id: 'locked.bar', starter: false } as const;
    expect(isActionRevealed(tmpl, ['other'])).toBe(false);
    expect(isActionRevealed(tmpl, ['locked.bar'])).toBe(true);
    expect(isActionRevealed(tmpl, ['other', 'locked.bar', 'another'])).toBe(true);
  });
});

describe('isStarterAction — categorisation predicate (THR-419)', () => {
  it('treats the flag as authoritative', () => {
    expect(isStarterAction({ id: 'whatever', starter: true })).toBe(true);
    expect(isStarterAction({ id: 'whatever', starter: false })).toBe(false);
  });

  it('falls back to STARTER_ACTION_IDS membership when the flag is absent', () => {
    expect(isStarterAction({ id: 'hex.survey' })).toBe(true);
    expect(isStarterAction({ id: 'definitely.not.a.starter' })).toBe(false);
  });
});
