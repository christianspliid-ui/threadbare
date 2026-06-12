/**
 * THR-293 — Headless archetype-pinned 30-tick doom milestone smoke.
 *
 * Verifies that `evaluateIdentityMilestones` fires and sets `triggered = true`
 * when doom progress crosses the first threshold (0.10) for all 7 archetypes.
 *
 * Test invariants:
 *   - DEFAULT_DOOM_TICKS = 200, tickModifier = 1.0
 *   - At tick 20: progress = 20/200 = 0.10 — first milestone threshold
 *   - At tick 30: progress = 30/200 = 0.15 — first milestone triggered, second not
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import { DOOM_CLOCK_ARCHETYPES } from '../../types/doomClock';
import type { DoomClockArchetype } from '../../types/doomClock';

const SEED = 42;
const TICKS = 30;
const { cols, rows } = MAP_SIZE_PRESETS['small'];

const ascendantArchetype = generateArchetypes(4, SEED)[0];
const cosmology = createBalancedCosmology();

describe('evaluateIdentityMilestones', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it.each(DOOM_CLOCK_ARCHETYPES)('archetype %s: first milestone triggers by tick 30', (archetype: DoomClockArchetype) => {
    let { state } = initializeGameState(
      ascendantArchetype, 'Test-Runner', cosmology, SEED, cols, rows, archetype,
    );

    for (let t = 0; t < TICKS; t++) {
      state = runTick(state);
    }

    const matrix = state.doomIdentityMatrix;
    expect(matrix).toBeDefined();
    expect(matrix!.archetype).toBe(archetype);
    expect(matrix!.identityMilestones.length).toBeGreaterThan(0);

    // First milestone (0.10 threshold) should have triggered by tick 30 (progress = 0.15)
    const firstMilestone = matrix!.identityMilestones[0];
    expect(firstMilestone.progressThreshold).toBeLessThanOrEqual(0.15);
    expect(firstMilestone.triggered).toBe(true);

    // Second milestone (0.35+ threshold) should NOT have triggered at 30 ticks
    if (matrix!.identityMilestones.length > 1) {
      const secondMilestone = matrix!.identityMilestones[1];
      expect(secondMilestone.progressThreshold).toBeGreaterThan(0.15);
      expect(secondMilestone.triggered).toBeFalsy();
    }

    // Trace emitted for the crossing
    const milestoneTraces = getTraces().filter((t) => t.category === 'doom_milestone');
    expect(milestoneTraces.length).toBeGreaterThanOrEqual(1);
    expect(milestoneTraces[0].summary).toContain(firstMilestone.label);
  });

  it('milestone triggered flag persists — no re-emission after first crossing', () => {
    let { state } = initializeGameState(
      ascendantArchetype, 'Test-Runner', cosmology, SEED, cols, rows, 'breach',
    );

    for (let t = 0; t < TICKS; t++) {
      state = runTick(state);
    }

    // After 30 ticks (progress = 0.15), first milestone (0.10) must be triggered
    const matrix = state.doomIdentityMatrix!;
    expect(matrix.identityMilestones[0].triggered).toBe(true);

    // Snapshot triggered state, then clear traces and run 10 more ticks
    const triggeredSnapshot = matrix.identityMilestones.map((m) => m.triggered);
    clearTraces();

    for (let t = 0; t < 10; t++) {
      state = runTick(state);
    }

    // No NEW doom_milestone traces should appear (already-triggered milestones don't re-fire)
    const newTraces = getTraces().filter((entry) => entry.category === 'doom_milestone');
    expect(newTraces.length).toBe(0);

    // Triggered flags did not change (already-triggered stay true, non-triggered stay false)
    const finalTriggered = state.doomIdentityMatrix!.identityMilestones.map((m) => m.triggered);
    expect(finalTriggered).toEqual(triggeredSnapshot);
  });
});
