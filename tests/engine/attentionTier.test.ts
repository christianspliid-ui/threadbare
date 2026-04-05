import { describe, it, expect } from 'vitest';
import { resolveEffectiveTier, checkMidEncounterPromotion, isNotableEntry } from '../../src/engine/attentionTier';

describe('resolveEffectiveTier', () => {
  // ─── Invisible cases ─────────────────────────────────────────────

  it('returns invisible when courtPosition is null', () => {
    expect(resolveEffectiveTier('background', null)).toBe('invisible');
    expect(resolveEffectiveTier('shaping', null)).toBe('invisible');
    expect(resolveEffectiveTier('story_beat', null)).toBe('invisible');
  });

  it('returns invisible when courtPosition is dormant', () => {
    expect(resolveEffectiveTier('background', 'dormant')).toBe('invisible');
    expect(resolveEffectiveTier('shaping', 'dormant')).toBe('invisible');
    expect(resolveEffectiveTier('story_beat', 'dormant')).toBe('invisible');
  });

  // ─── watched: demotes by one tier ────────────────────────────────

  it('watched: background stays background', () => {
    expect(resolveEffectiveTier('background', 'watched')).toBe('background');
  });

  it('watched: shaping is demoted to background', () => {
    expect(resolveEffectiveTier('shaping', 'watched')).toBe('background');
  });

  it('watched: story_beat is demoted to shaping', () => {
    expect(resolveEffectiveTier('story_beat', 'watched')).toBe('shaping');
  });

  // ─── retinue: preserves intrinsic tier exactly ───────────────────

  it('retinue: background stays background', () => {
    expect(resolveEffectiveTier('background', 'retinue')).toBe('background');
  });

  it('retinue: shaping stays shaping', () => {
    expect(resolveEffectiveTier('shaping', 'retinue')).toBe('shaping');
  });

  it('retinue: story_beat stays story_beat', () => {
    expect(resolveEffectiveTier('story_beat', 'retinue')).toBe('story_beat');
  });

  // ─── the_first: promotes background, preserves others ───────────

  it('the_first: background is promoted to shaping', () => {
    expect(resolveEffectiveTier('background', 'the_first')).toBe('shaping');
  });

  it('the_first: shaping stays shaping', () => {
    expect(resolveEffectiveTier('shaping', 'the_first')).toBe('shaping');
  });

  it('the_first: story_beat stays story_beat', () => {
    expect(resolveEffectiveTier('story_beat', 'the_first')).toBe('story_beat');
  });
});

describe('checkMidEncounterPromotion', () => {
  // ─── background → shaping (tier-1 triggers) ─────────────────────

  it('background + wound → shaping', () => {
    expect(checkMidEncounterPromotion('background', { wound: true })).toBe('shaping');
  });

  it('background + discovery → shaping', () => {
    expect(checkMidEncounterPromotion('background', { discovery: true })).toBe('shaping');
  });

  it('background + chainAdvance → shaping', () => {
    expect(checkMidEncounterPromotion('background', { chainAdvance: true })).toBe('shaping');
  });

  it('background + tierPromotion → shaping', () => {
    expect(checkMidEncounterPromotion('background', { tierPromotion: true })).toBe('shaping');
  });

  // ─── background → story_beat (skip shaping, tier-2 triggers) ────

  it('background + chainCulmination → story_beat (skip shaping)', () => {
    expect(checkMidEncounterPromotion('background', { chainCulmination: true })).toBe('story_beat');
  });

  it('background + multiAgentConvergence → story_beat', () => {
    expect(checkMidEncounterPromotion('background', { multiAgentConvergence: true })).toBe('story_beat');
  });

  it('background + doomThreshold → story_beat', () => {
    expect(checkMidEncounterPromotion('background', { doomThreshold: true })).toBe('story_beat');
  });

  it('background + battleEscalation → story_beat', () => {
    expect(checkMidEncounterPromotion('background', { battleEscalation: true })).toBe('story_beat');
  });

  // ─── shaping → story_beat (tier-2 triggers) ─────────────────────

  it('shaping + chainCulmination → story_beat', () => {
    expect(checkMidEncounterPromotion('shaping', { chainCulmination: true })).toBe('story_beat');
  });

  it('shaping + multiAgentConvergence → story_beat', () => {
    expect(checkMidEncounterPromotion('shaping', { multiAgentConvergence: true })).toBe('story_beat');
  });

  it('shaping + doomThreshold → story_beat', () => {
    expect(checkMidEncounterPromotion('shaping', { doomThreshold: true })).toBe('story_beat');
  });

  it('shaping + battleEscalation → story_beat', () => {
    expect(checkMidEncounterPromotion('shaping', { battleEscalation: true })).toBe('story_beat');
  });

  // ─── shaping: tier-1 triggers do not promote further ────────────

  it('shaping + wound → null (wound does not promote shaping)', () => {
    expect(checkMidEncounterPromotion('shaping', { wound: true })).toBeNull();
  });

  it('shaping + discovery → null', () => {
    expect(checkMidEncounterPromotion('shaping', { discovery: true })).toBeNull();
  });

  it('shaping + chainAdvance → null', () => {
    expect(checkMidEncounterPromotion('shaping', { chainAdvance: true })).toBeNull();
  });

  it('shaping + tierPromotion → null', () => {
    expect(checkMidEncounterPromotion('shaping', { tierPromotion: true })).toBeNull();
  });

  // ─── story_beat: ceiling, never promotes ─────────────────────────

  it('story_beat + anything → null (ceiling)', () => {
    expect(checkMidEncounterPromotion('story_beat', {
      wound: true,
      discovery: true,
      chainCulmination: true,
      multiAgentConvergence: true,
      doomThreshold: true,
      battleEscalation: true,
    })).toBeNull();
  });

  // ─── no triggers → null ──────────────────────────────────────────

  it('no triggers → null', () => {
    expect(checkMidEncounterPromotion('background', {})).toBeNull();
    expect(checkMidEncounterPromotion('shaping', {})).toBeNull();
    expect(checkMidEncounterPromotion('story_beat', {})).toBeNull();
  });
});

describe('isNotableEntry', () => {
  // ─── quintessenceDelta ───────────────────────────────────────────

  it('quintessenceDelta -0.4 → true (below -0.3 threshold)', () => {
    expect(isNotableEntry({ quintessenceDelta: -0.4 })).toBe(true);
  });

  it('quintessenceDelta -0.3 → true (at threshold boundary)', () => {
    expect(isNotableEntry({ quintessenceDelta: -0.3 })).toBe(true);
  });

  it('quintessenceDelta -0.1 → false (above threshold)', () => {
    expect(isNotableEntry({ quintessenceDelta: -0.1 })).toBe(false);
  });

  it('quintessenceDelta +0.5 → false (positive gain is not notable)', () => {
    expect(isNotableEntry({ quintessenceDelta: 0.5 })).toBe(false);
  });

  // ─── reputationDelta ─────────────────────────────────────────────

  it('reputationDelta -0.4 → true', () => {
    expect(isNotableEntry({ reputationDelta: -0.4 })).toBe(true);
  });

  it('reputationDelta +0.4 → true (magnitude matters)', () => {
    expect(isNotableEntry({ reputationDelta: 0.4 })).toBe(true);
  });

  it('reputationDelta -0.1 → false', () => {
    expect(isNotableEntry({ reputationDelta: -0.1 })).toBe(false);
  });

  // ─── attachmentsLost ─────────────────────────────────────────────

  it('attachmentsLost: ["sword"] → true', () => {
    expect(isNotableEntry({ attachmentsLost: ['sword'] })).toBe(true);
  });

  it('attachmentsLost: [] → false', () => {
    expect(isNotableEntry({ attachmentsLost: [] })).toBe(false);
  });

  // ─── tierPromoted ────────────────────────────────────────────────

  it('tierPromoted: true → true', () => {
    expect(isNotableEntry({ tierPromoted: true })).toBe(true);
  });

  it('tierPromoted: false → false', () => {
    expect(isNotableEntry({ tierPromoted: false })).toBe(false);
  });

  // ─── chainCompleted ──────────────────────────────────────────────

  it('chainCompleted: true → true', () => {
    expect(isNotableEntry({ chainCompleted: true })).toBe(true);
  });

  it('chainCompleted: false → false', () => {
    expect(isNotableEntry({ chainCompleted: false })).toBe(false);
  });

  // ─── hasWound ────────────────────────────────────────────────────

  it('hasWound: true → true', () => {
    expect(isNotableEntry({ hasWound: true })).toBe(true);
  });

  it('hasWound: false → false', () => {
    expect(isNotableEntry({ hasWound: false })).toBe(false);
  });

  // ─── empty input ─────────────────────────────────────────────────

  it('empty input → false', () => {
    expect(isNotableEntry({})).toBe(false);
  });
});
