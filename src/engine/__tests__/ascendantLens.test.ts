/**
 * Tests for the Ascendant Lens Overlay Resolution Engine.
 *
 * Verifies that the god's Hunger-specific perception overlays and mortal
 * echo prose are correctly resolved and composed into meeting encounter prose.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveLensOverlay,
  shouldFireMortalEcho,
  composeLensedProse,
} from '../ascendantLens';
import { HUNGER_CATALOG } from '../../types/hunger';
import type { AscendantLens } from '../../types/hunger';
import type { LensOverlay } from '../../types/meetingEncounter';

// ─── Test Fixtures ──────────────────────────────────────────────

const GATHER_LENS: AscendantLens = {
  hunger: HUNGER_CATALOG.find((h) => h.id === 'gather')!,
  mortalOrigin: 'shepherd',
  drive: 'protecting the flock',
  driveTags: ['protection', 'belonging', 'sacrifice'],
  timeSinceAscension: 'ancient',
  mortalName: 'Kael',
};

const OVERLAYS: readonly LensOverlay[] = [
  {
    hungerId: 'gather',
    perceptionProse: 'You feel the threads of care.',
    echoThreshold: 2,
    echoProse: 'You did this once.',
  },
  {
    hungerId: 'witness',
    perceptionProse: 'You see the hidden pattern.',
  },
];

// ─── resolveLensOverlay ─────────────────────────────────────────

describe('resolveLensOverlay', () => {
  it('returns the overlay matching the active Hunger', () => {
    const result = resolveLensOverlay(OVERLAYS, 'gather');
    expect(result).toBeDefined();
    expect(result!.hungerId).toBe('gather');
    expect(result!.perceptionProse).toBe('You feel the threads of care.');
  });

  it('returns undefined when no matching overlay exists', () => {
    const result = resolveLensOverlay(OVERLAYS, 'consume');
    expect(result).toBeUndefined();
  });

  it('returns undefined for an empty overlay array', () => {
    const result = resolveLensOverlay([], 'gather');
    expect(result).toBeUndefined();
  });
});

// ─── shouldFireMortalEcho ───────────────────────────────────────

describe('shouldFireMortalEcho', () => {
  it('fires when drive tag overlap meets the threshold', () => {
    // GATHER_LENS.driveTags = ['protection', 'belonging', 'sacrifice']
    // dilemma tags overlap: 'belonging', 'sacrifice' → 2 matches, threshold 2
    const result = shouldFireMortalEcho(
      GATHER_LENS,
      ['belonging', 'sacrifice', 'ambition'],
      2,
    );
    expect(result).toBe(true);
  });

  it('fires when drive tag overlap exceeds the threshold', () => {
    const result = shouldFireMortalEcho(
      GATHER_LENS,
      ['protection', 'belonging', 'sacrifice'],
      2,
    );
    expect(result).toBe(true);
  });

  it('does not fire when resonance is below threshold', () => {
    const result = shouldFireMortalEcho(
      GATHER_LENS,
      ['belonging', 'ambition', 'power'],
      2,
    );
    expect(result).toBe(false);
  });

  it('does not fire when no threshold set (undefined)', () => {
    const result = shouldFireMortalEcho(
      GATHER_LENS,
      ['protection', 'belonging', 'sacrifice'],
      undefined,
    );
    expect(result).toBe(false);
  });

  it('does not fire when dilemma tags are empty', () => {
    const result = shouldFireMortalEcho(GATHER_LENS, [], 1);
    expect(result).toBe(false);
  });
});

// ─── composeLensedProse ─────────────────────────────────────────

describe('composeLensedProse', () => {
  const baseProse = 'The mortal stands at the crossroads.';

  it('returns base prose unchanged when no overlay matches', () => {
    const result = composeLensedProse(
      baseProse,
      OVERLAYS,
      { ...GATHER_LENS, hunger: HUNGER_CATALOG.find((h) => h.id === 'consume')! },
      ['ambition'],
    );
    expect(result).toBe(baseProse);
  });

  it('appends perception prose when overlay matches', () => {
    const result = composeLensedProse(
      baseProse,
      OVERLAYS,
      GATHER_LENS,
      ['ambition'], // no drive tag overlap → no echo
    );
    expect(result).toBe(
      'The mortal stands at the crossroads.\n\nYou feel the threads of care.',
    );
  });

  it('includes mortal echo when threshold is met', () => {
    const result = composeLensedProse(
      baseProse,
      OVERLAYS,
      GATHER_LENS,
      ['belonging', 'sacrifice', 'ambition'], // 2 matches, threshold 2 → echo fires
    );
    expect(result).toBe(
      'The mortal stands at the crossroads.\n\nYou feel the threads of care.\n\nYou did this once.',
    );
  });

  it('does not include echo when overlay has no echoThreshold', () => {
    // Use witness lens with witness overlay (no echoThreshold)
    const witnessLens: AscendantLens = {
      hunger: HUNGER_CATALOG.find((h) => h.id === 'witness')!,
      mortalOrigin: 'scholar',
      drive: 'uncovering hidden truths',
      driveTags: ['secrets', 'knowledge', 'observation'],
      timeSinceAscension: 'recent',
      mortalName: 'Elara',
    };
    const result = composeLensedProse(
      baseProse,
      OVERLAYS,
      witnessLens,
      ['secrets', 'knowledge', 'observation'], // full overlap but no threshold
    );
    expect(result).toBe(
      'The mortal stands at the crossroads.\n\nYou see the hidden pattern.',
    );
  });

  it('handles empty overlays gracefully', () => {
    const result = composeLensedProse(baseProse, [], GATHER_LENS, ['belonging']);
    expect(result).toBe(baseProse);
  });
});
