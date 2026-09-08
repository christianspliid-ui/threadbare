// @vitest-lane heavy — builds a small world and drives it 150 ticks (THR-1384)
/**
 * The capability rider in the live simulation (THR-1440).
 *
 * The unit tests next door prove the writer: the right Reach, the tier's constant,
 * the cap, the soft seams. None of them can catch what this slice's rider actually
 * risks — that the writer is correct and **the world never reaches it**, which is
 * exactly the shape the map recorded before this ticket ("the rider is recorded on
 * the map and paid nowhere").
 *
 * It also carries the *price* arm, which only a population can state honestly: a
 * work that ends without completing grows nothing. Asserting that against
 * `buildFailureHistory` would be a tautology — that builder cannot set the field —
 * so it is asserted here, over a run that contains real non-completed terminals,
 * with the size of that complement asserted first so the check cannot pass by
 * being empty.
 *
 * Measured on the closeout (small world, 150 ticks): seed 42 — 66 completions of
 * which 22 were checkpointed work carrying growth, 34 non-completed carrying none,
 * 12 carriers risen (7 on their leading Reach); seed 99 — 61 / 28 / 18 / 10 (4
 * leading). The gap between completions and growths is the instant cells, which
 * deliberately pay nothing (see the rider's own note at the instant terminal). The
 * floors below sit well under those so ordinary drift does not redden them; a rider
 * that stopped being paid would fall to zero.
 */

import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { REACH_DOMAINS } from '../../types/traits';
import type { StrategicHistoryEntry } from '../../types/strategicAction';

const SEED = 42;
const TICKS = 150;

describe('the capability rider is paid in the live simulation', () => {
  it('completions grow their actor, non-completions grow nothing', () => {
    const runtime = createSimulationRuntime();
    const archetype = generateArchetypes(4, SEED)[0];
    const preset = MAP_SIZE_PRESETS.small;
    let { state } = initializeGameState(
      archetype, 'rider', createBalancedCosmology(), SEED, preset.cols, preset.rows,
    );

    // Snapshot every actor that carries the capability model at all. Most mortals do
    // not (11 of 331 on this world at the time of THR-1429's measurement) — the
    // rider is a protagonist's reward, and the denominator has to say so.
    const before = new Map<string, Record<string, number>>();
    for (const node of state.graph.getNodesByType('actor')) {
      const caps = node.properties.domainCapabilities as Record<string, number> | undefined;
      if (caps) before.set(node.id, { ...caps });
    }
    expect(before.size, 'no actor carries domainCapabilities — the seeded shape moved').toBeGreaterThan(0);

    // `strategicState.history` is pruned to a window, so an end-of-run read is a tail.
    // Harvested per tick and de-duplicated, the way the checkpoint census next door
    // drains the trace ring for the same reason.
    const seen = new Set<string>();
    const entries: StrategicHistoryEntry[] = [];
    for (let i = 0; i < TICKS; i++) {
      state = runTick(state, [], runtime);
      for (const h of state.strategicState?.history ?? []) {
        const key = `${h.tick}|${h.actorId}|${h.templateId}|${h.outcome}`;
        if (seen.has(key)) continue;
        seen.add(key);
        entries.push(h);
      }
    }

    const completed = entries.filter(h => h.outcome === 'completed');
    const notCompleted = entries.filter(h => h.outcome !== 'completed');

    expect(completed.length, 'nothing completed in 150 ticks — the run says nothing about the rider')
      .toBeGreaterThan(10);
    // The complement has to be a population too, or the price arm below is vacuous.
    expect(notCompleted.length, 'no work ended without completing — the price arm proves nothing')
      .toBeGreaterThan(0);

    // A subset of completions by design: only checkpointed work pays, so the instant
    // cells in this population are expected to carry nothing.
    const grown = completed.filter(h => h.capabilityGrowth);
    expect(grown.length, 'completions happened and none paid the rider').toBeGreaterThan(10);
    expect(grown.length, 'every completion paid — the instant terminal is paying again')
      .toBeLessThan(completed.length);
    for (const h of grown) {
      expect(REACH_DOMAINS).toContain(h.capabilityGrowth!.reach);
      expect(h.capabilityGrowth!.delta).toBeGreaterThan(0);
    }

    // The story's price: not finishing grows nothing.
    const wrongfullyGrown = notCompleted.filter(h => h.capabilityGrowth);
    expect(
      wrongfullyGrown.map(h => `${h.templateId}@${h.tick}`),
      'a work that did not complete grew capability',
    ).toEqual([]);

    // And the world moved, not just the ledger: at least one carrier's Reach is
    // higher than it was seeded, and nothing fell.
    let risen = 0;
    for (const [id, seeded] of before) {
      const now = state.graph.getNode(id)?.properties.domainCapabilities as
        Record<string, number> | undefined;
      if (!now) continue;
      for (const reach of REACH_DOMAINS) {
        const from = seeded[reach] ?? 0;
        const to = now[reach] ?? 0;
        expect(to, `${id}.${reach} fell — nothing in this rider subtracts`).toBeGreaterThanOrEqual(from);
        if (to > from) { risen++; break; }
      }
    }
    expect(risen, 'no actor grew a Reach across 150 ticks of completed work').toBeGreaterThan(0);
  }, 300_000);
});
