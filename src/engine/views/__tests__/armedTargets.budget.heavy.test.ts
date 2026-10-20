// @vitest-lane heavy
/**
 * THR-1914 (Inspector plan § D9 way 3, S6 Done-when) — `buildArmedTargets` stays inside one
 * frame (`INSPECTOR_VIEW_BUDGET_MS`) on the seed-42 medium world, for every card in a
 * late-game hand. Over it, plan kill criterion 6 applies (light visible hexes only).
 *
 * Measured: the build from the hex-contents index, which the selector reads from the
 * session's view cache (the map and the land pages read the same entry each world state).
 * The index's own build is logged beside it. The time is the median of several passes,
 * after a warm-up; fog is off, so every hex is a candidate (the worst case).
 *
 * Heavy lane: builds the medium world.
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../gameInit';
import { createBalancedCosmology } from '../../cosmology';
import { generateArchetypes } from '../../ascendant';
import { readView } from '../readView';
import { hexContentsIndexSelector } from '../hexContents';
import { buildArmedTargetsFrom } from '../armedTargets';
import { isGodCard } from '../godRail';
import { INSPECTOR_VIEW_BUDGET_MS, INSPECTOR_VIEW_CI_CEILING_MS } from '../viewConstants';
import { AGENT_INTERVENTION_TEMPLATES, UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import type { GameState } from '../../../types/gameState';

const SEED = 42;
const PASSES = 5;
const TEST_TIMEOUT_MS = 300_000;

function median(times: number[]): number {
  const s = [...times].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

describe('buildArmedTargets frame budget on seed 42 medium (THR-1914)', () => {
  it('lights every hand card\'s targets inside one frame', () => {
    const archetype = generateArchetypes(4, SEED)[0];
    const preset = MAP_SIZE_PRESETS.medium;
    const init = initializeGameState(archetype, 'thr-1914', createBalancedCosmology(), SEED, preset.cols, preset.rows).state;
    const pool = Object.fromEntries(Object.keys(init.essencePool ?? {}).map(k => [k, 999]));
    const allIds = [...UNIFIED_ACTION_TEMPLATES, ...AGENT_INTERVENTION_TEMPLATES].map(t => t.id);
    const state = {
      ...init,
      ascendantIdentity: init.ascendantIdentity ?? { sphereAlignment: archetype.sphereAlignment },
      essencePool: { ...init.essencePool, ...pool },
      unlockedActionIds: allIds,
      // Fog off: every hex is a candidate.
      visibilityMap: new Map(),
    } as GameState;

    const t0 = performance.now();
    const index = readView(null, state, hexContentsIndexSelector, undefined, state.tiles);
    const indexMs = performance.now() - t0;

    const cards = UNIFIED_ACTION_TEMPLATES.filter(t => isGodCard(t));
    expect(cards.length).toBeGreaterThan(0);
    let worst = { id: '', ms: 0, lit: 0 };
    let litAny = 0;
    for (const card of cards) {
      buildArmedTargetsFrom(state, card.id, index, state.tiles); // warm-up
      const times: number[] = [];
      let lit = 0;
      for (let i = 0; i < PASSES; i++) {
        const s = performance.now();
        const vm = buildArmedTargetsFrom(state, card.id, index, state.tiles);
        times.push(performance.now() - s);
        lit = Object.keys(vm.lit).length;
      }
      const ms = median(times);
      if (lit > 0) litAny++;
      if (ms > worst.ms) worst = { id: card.id, ms, lit };
    }
    console.log(`[THR-1914] ${cards.length} hand cards, ${litAny} light something; worst ${worst.id}: ${worst.lit} lit, median ${worst.ms.toFixed(2)} ms (budget ${INSPECTOR_VIEW_BUDGET_MS}, asserted ceiling ${INSPECTOR_VIEW_CI_CEILING_MS} — THR-1995); hex-contents index ${indexMs.toFixed(2)} ms`);
    expect(litAny).toBeGreaterThan(0);
    expect(worst.ms).toBeLessThan(INSPECTOR_VIEW_CI_CEILING_MS);
  }, TEST_TIMEOUT_MS);
});
