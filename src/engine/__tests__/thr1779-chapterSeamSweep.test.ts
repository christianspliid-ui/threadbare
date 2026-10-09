// @vitest-lane heavy — drives a seeded small world 300 ticks (THR-1779 Done-when)
/**
 * THR-1779 — sweep the Chapter Ledger's archive after a 300-tick seeded run: no
 * rendered chapter text carries a `{` (an unresolved token) or a ", ," (a slot that
 * stripped to empty). The per-cause unit tests are in `thr1779-template-seams.test.ts`.
 */

import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetDecisionCache, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import type { ChapterRecord } from '../../types/chapterRecord';

/** Ticks the sweep runs — the ticket's Done-when names 300. */
const SWEEP_TICKS = 300;

function chapterText(rec: ChapterRecord): string[] {
  return [
    rec.openingProse,
    rec.stakesLine ?? '',
    rec.aftermathProse ?? '',
    ...(rec.aftermathSummary?.changes ?? []).flatMap(c => [c.title, c.detail]),
    ...rec.steps.flatMap(s => [s.label, s.narrativeProse, s.afterimageProse ?? '']),
  ];
}

describe('THR-1779 — chapter archive seam sweep', () => {
  it(`no archived chapter text carries "{" or ", ," after ${SWEEP_TICKS} ticks`, () => {
    resetDecisionCache();
    resetEventCounter();
    const archetype = generateArchetypes(4, 42)[0];
    const preset = MAP_SIZE_PRESETS.small;
    const runtime = createSimulationRuntime();
    let { state } = initializeGameState(
      archetype, 'Test-Runner', createBalancedCosmology(), 42, preset.cols, preset.rows,
    );
    for (let i = 0; i < SWEEP_TICKS; i++) state = runTick(state, [], runtime);

    const archive = state.chapterArchive ?? [];
    // Anti-vacuous guard: an empty archive passes the predicate trivially.
    expect(archive.length).toBeGreaterThan(0);

    const seams = archive.flatMap(rec => chapterText(rec)
      .filter(t => t.includes('{') || t.includes(', ,'))
      .map(t => `${rec.templateId}: ${t.slice(0, 160)}`));
    expect(seams).toEqual([]);
  }, 600_000);
});
