// @vitest-lane heavy — builds a small world (THR-1384)
/**
 * THR-1525 — a scene draws both poles of the value it is about.
 *
 * Liveness on a *generated* world, not a fixture: every profiled mortal the
 * world actually seeds is mirrored on each shipped template's named axes
 * (`+v → −v`, every other axis untouched), and the mirror must want the scene
 * exactly as much as the original. Under the pre-THR-1525 signed reading the
 * mirror of a virtue-leaner floors at `MINIMUM_DESIRE` — the defect that starved
 * every flaw-pole mortal of the scenes about them. The falsification (same
 * assertion red under `DESIRE_SCORE_POLE_MODE = 'signed'`) lives in
 * `desirePoleMode.signed.test.ts`, which mocks the constant.
 *
 * Covers both consumers of the one function: encounter templates
 * (`computeDesireScore`) and undertakings (`computeBoardDesireMultiplier`).
 */

import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { generateArchetypes } from '../ascendant';
import { createBalancedCosmology } from '../cosmology';
import { computeDesireScore } from '../encounterScoring';
import { computeBoardDesireMultiplier } from '../decisionBoard';
import { getAllStrategicTemplates } from '../strategicActionCandidates';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { UNDERTAKING_CELL_TEMPLATES } from '../../data/undertaking-cells';
import type { AxiologicalProfile, ValuePair } from '../../types/agent';

const SEED = 42;
/** Below this on every named axis a mortal is indifferent — the mirror is trivially equal. */
const MIN_CONVICTION = 0.1;

function mirrored(profile: AxiologicalProfile, axes: readonly ValuePair[]): AxiologicalProfile {
  const out = { ...profile };
  for (const a of axes) out[a] = -(profile[a] ?? 0);
  return out;
}

describe(`desire reads both poles on a generated world (THR-1525, seed ${SEED}, small)`, () => {
  const archetype = generateArchetypes(4, SEED)[0];
  const preset = MAP_SIZE_PRESETS['small'];
  const { state } = initializeGameState(
    archetype, 'PoleBot', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  );
  const profiles = state.graph.getNodesByType('actor')
    .map(n => n.properties?.axiologicalProfile as AxiologicalProfile | undefined)
    .filter((p): p is AxiologicalProfile => p !== undefined);

  const encounterTemplates = UNIFIED_ACTION_TEMPLATES.filter(t => (t.motivations?.length ?? 0) > 0);
  // The authored templates and the live undertaking grid (THR-1392 cells, what the
  // board actually offers under the cells model) — both read the one function.
  const undertakings = [...getAllStrategicTemplates(), ...UNDERTAKING_CELL_TEMPLATES]
    .filter(t => (t.motivations?.length ?? 0) > 0);

  it('the populations are non-vacuous', () => {
    expect(profiles.length).toBeGreaterThan(20);
    expect(encounterTemplates.length).toBeGreaterThan(50);
    expect(undertakings.length).toBeGreaterThan(20);
  });

  it('a mortal and their mirror want every encounter scene equally', () => {
    let convicted = 0;
    const mismatches: string[] = [];
    for (const t of encounterTemplates) {
      for (const p of profiles) {
        if (!t.motivations.some(m => Math.abs(p[m] ?? 0) >= MIN_CONVICTION)) continue;
        convicted++;
        const a = computeDesireScore(t.motivations, p, t.motivationPoles);
        const b = computeDesireScore(t.motivations, mirrored(p, t.motivations), t.motivationPoles);
        if (Math.abs(a - b) > 1e-9 && !t.motivationPoles) mismatches.push(`${t.id}: ${a} vs ${b}`);
      }
    }
    expect(convicted).toBeGreaterThan(100);
    expect(mismatches.slice(0, 5)).toEqual([]);
  });

  it('a proposer and their mirror weigh every undertaking equally', () => {
    let convicted = 0;
    const mismatches: string[] = [];
    for (const t of undertakings) {
      const m = t.motivations ?? [];
      for (const p of profiles) {
        if (!m.some(x => Math.abs(p[x] ?? 0) >= MIN_CONVICTION)) continue;
        convicted++;
        const a = computeBoardDesireMultiplier(m, p, 0, t.motivationPoles);
        const b = computeBoardDesireMultiplier(m, mirrored(p, m), 0, t.motivationPoles);
        if (Math.abs(a - b) > 1e-9 && !t.motivationPoles) mismatches.push(`${t.id}: ${a} vs ${b}`);
      }
    }
    expect(convicted).toBeGreaterThan(100);
    expect(mismatches.slice(0, 5)).toEqual([]);
  });
});
