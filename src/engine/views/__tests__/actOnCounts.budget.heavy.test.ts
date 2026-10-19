// @vitest-lane heavy
/**
 * THR-1913 (Inspector plan § D9 way 2, S5 Done-when) — `actOnCounts` over a docked page's
 * rendered rows stays inside one frame (`INSPECTOR_VIEW_BUDGET_MS`) on the seed-42 medium
 * world. Over it, plan kill criterion 6 applies (count rows lazily as they scroll in).
 *
 * The page measured is the heaviest settlement and the heaviest land page the world holds,
 * by rendered row count. Rendered rows are the docked page's: *In this land* whole, and
 * each Connections group up to its docked fold (`foldAfter`) — the most a docked column
 * draws when it must fold. The time is the median of several passes, after a warm-up.
 *
 * Heavy lane: builds the medium world.
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../gameInit';
import { createBalancedCosmology } from '../../cosmology';
import { generateArchetypes } from '../../ascendant';
import { createSimulationRuntime } from '../../simulationRuntime';
import { getLocationNodes } from '../../sublocationShape';
import { buildSubjectPage } from '../subjects/subjectPage';
import { actOnCounts, actOnSlots, actOnTargetForRef } from '../subjects/actOn';
import { INSPECTOR_VIEW_BUDGET_MS } from '../viewConstants';
import { AGENT_INTERVENTION_TEMPLATES, UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import type { SubjectPageVM } from '../subjects/subjectTypes';
import type { WorldRef } from '../../../types/worldRef';
import type { GameState } from '../../../types/gameState';

const SEED = 42;
const PASSES = 7;
const TEST_TIMEOUT_MS = 180_000;

function renderedRefs(page: SubjectPageVM): WorldRef[] {
  const refs: WorldRef[] = [];
  if (page.pageKind === 'land') for (const row of page.inThisLand.rows) refs.push(...row.rows.map(r => r.ref));
  for (const group of page.connections.groups) refs.push(...group.rows.slice(0, group.foldAfter).map(r => r.ref));
  return refs;
}

function medianMs(state: GameState, refs: WorldRef[]): number {
  actOnCounts(state, refs); // warm-up
  const times: number[] = [];
  for (let i = 0; i < PASSES; i++) {
    const t0 = performance.now();
    actOnCounts(state, refs);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)];
}

describe('actOnCounts frame budget on seed 42 medium (THR-1913)', () => {
  it('counts a docked page\'s rendered rows inside one frame', () => {
    const runtime = createSimulationRuntime();
    const archetype = generateArchetypes(4, SEED)[0];
    const preset = MAP_SIZE_PRESETS.medium;
    const init = initializeGameState(archetype, 'thr-1913', createBalancedCosmology(), SEED, preset.cols, preset.rows).state;
    // The plain init path leaves the god's identity to the remembrance flow; the cards need
    // its spheres, and a full pool makes every affordable card count (the worst case).
    const pool = Object.fromEntries(Object.keys(init.essencePool ?? {}).map(k => [k, 999]));
    const state = {
      ...init,
      ascendantIdentity: init.ascendantIdentity ?? { sphereAlignment: archetype.sphereAlignment },
      essencePool: { ...init.essencePool, ...pool },
      // Every card revealed: the late-game hand, where each row reads the most templates.
      unlockedActionIds: [...UNIFIED_ACTION_TEMPLATES, ...AGENT_INTERVENTION_TEMPLATES].map(t => t.id),
    } as GameState;

    // The heaviest settlement page and the heaviest land page, by rendered rows.
    const pages: SubjectPageVM[] = [];
    for (const node of getLocationNodes(state.graph)) {
      pages.push(buildSubjectPage(state, { kind: 'location', id: node.id }, runtime, {}));
      const col = node.properties.hexCol as number | undefined;
      const row = node.properties.hexRow as number | undefined;
      if (col != null && row != null) pages.push(buildSubjectPage(state, { kind: 'hex', id: `${col},${row}` }, runtime, {}));
    }
    const ranked = pages.map(p => ({ p, refs: renderedRefs(p) })).sort((a, b) => b.refs.length - a.refs.length);
    const heaviestPlace = ranked.find(r => r.p.pageKind !== 'land')!;
    const heaviestLand = ranked.find(r => r.p.pageKind === 'land')!;
    expect(heaviestPlace.refs.length).toBeGreaterThan(0);
    expect(heaviestLand.refs.length).toBeGreaterThan(0);

    for (const { p, refs } of [heaviestPlace, heaviestLand]) {
      const ms = medianMs(state, refs);
      const counts = actOnCounts(state, refs);
      console.log(`[THR-1913] ${p.subjectKey} (${p.pageKind}): ${refs.length} rows, ${Object.values(counts).filter(n => n > 0).length} with cards, median ${ms.toFixed(2)} ms (budget ${INSPECTOR_VIEW_BUDGET_MS})`);
      expect(ms).toBeLessThan(INSPECTOR_VIEW_BUDGET_MS);
    }
    // The measurement read real slots, not an early return: every castable row is read through the hand it deals
    // (a fresh world's cards are mostly still locked, so the counts themselves may be 0).
    const slotsRead = heaviestPlace.refs
      .map(ref => actOnTargetForRef(state, ref))
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .map(t => actOnSlots(state, t)?.slots.length ?? 0);
    expect(slotsRead.length).toBeGreaterThan(0);
    expect(slotsRead.reduce((s, n) => s + n, 0)).toBeGreaterThan(0);
  }, TEST_TIMEOUT_MS);
});
