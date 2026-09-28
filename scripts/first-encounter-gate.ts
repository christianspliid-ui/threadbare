// The First's encounter-rhythm gate (THR-1639 — plan
// Docs/plans/2026-09-27-thr-1633-written-encounters-land.md § S2).
//
// Runs the `?view=game&seeded&size=medium` world headlessly — the same three calls
// `useSimulation` makes for that URL (initializeGameStateFromIdentity with the dev
// identity, devSeedTheFirst, devSeedAscendantTestPackage) — and ticks it with no
// player input, exactly what `window.__DEBUG.tick(n)` does. The same setup as the
// audit reader `Docs/audits/2026-09-25-living-world-data/readers/attended.ts`.
//
// It records every encounter-kind action The First takes part in (as actor or as
// target, on either the unified-action path or the legacy encounterProgress path),
// then checks two numbers per seed:
//   - the tick of The First's first encounter   ≤ FIRST_FIRST_ENCOUNTER_MAX_TICK
//   - the longest gap between consecutive encounters ≤ FIRST_ENCOUNTER_MAX_GAP_TICKS
// The tail after the last encounter is reported but not gated: a run that ends
// mid-journey says nothing about the rhythm.
//
// Usage (repo root):
//   npx esbuild scripts/first-encounter-gate.ts --bundle --platform=node --format=esm --outfile=.cache/first-gate.mjs --external:fs --external:path
//   node .cache/first-gate.mjs [seeds=42,99,11] [ticks=150]
// Exits 1 when any seed fails the gate.
import { initializeGameStateFromIdentity, devSeedTheFirst, devSeedAscendantTestPackage, DEV_ASCENDANT_IDENTITY } from '../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../src/engine/orchestrator';
import { deriveCosmologyFromIdentity } from '../src/engine/remembrance';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { CONTENT_OBJECT_KINDS } from '../src/data/content-objects';

/** S2 acceptance: The First's first encounter must start by this tick (attended, per seed). */
export const FIRST_FIRST_ENCOUNTER_MAX_TICK = 30;
/** S2 acceptance: longest stretch between two of The First's encounters (attended, 150 ticks). */
export const FIRST_ENCOUNTER_MAX_GAP_TICKS = 30;

const encKind = CONTENT_OBJECT_KINDS.find(k => k.id === 'encounter_template');
const isEncounter = (id: string) => !!encKind && encKind.idPrefixes.some(p => id.startsWith(p));

export interface FirstRhythm {
  seed: number;
  firstId: string | null;
  starts: number[];
  firstTick: number | null;
  longestGap: number;
  gapFrom: number | null;
  tailGap: number;
  pass: boolean;
}

export function measureFirstRhythm(seed: number, ticks: number): FirstRhythm {
  resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
  const runtime = createSimulationRuntime();
  const cosmology = deriveCosmologyFromIdentity({
    sphereAlignment: DEV_ASCENDANT_IDENTITY.sphereAlignment,
    mortalTags: DEV_ASCENDANT_IDENTITY.mortalTags,
    hungerId: DEV_ASCENDANT_IDENTITY.hungerId,
  });
  let { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, cosmology, 'medium');
  const firstId = devSeedTheFirst(state);
  devSeedAscendantTestPackage(state);

  const seen = new Map<string, number>();
  const harvest = () => {
    if (!firstId) return;
    for (const a of state.unifiedActions ?? []) {
      if (a.actorId !== firstId && a.targetId !== firstId) continue;
      if (!isEncounter(a.templateId)) continue;
      const key = 'ua|' + a.actionId;
      if (!seen.has(key)) seen.set(key, a.startTick);
    }
    for (const p of state.encounterProgress ?? []) {
      if (p.actorId !== firstId && p.targetAgentId !== firstId) continue;
      if (!isEncounter(p.encounterId)) continue;
      const key = `ep|${p.actorId}|${p.encounterId}|${p.startedTick}`;
      if (!seen.has(key)) seen.set(key, p.startedTick);
    }
  };
  harvest();
  for (let i = 0; i < ticks; i++) { state = runTick(state, [], runtime); harvest(); }

  const starts = [...new Set(seen.values())].sort((a, b) => a - b);
  let longestGap = 0; let gapFrom: number | null = null;
  for (let i = 1; i < starts.length; i++) {
    const g = starts[i] - starts[i - 1];
    if (g > longestGap) { longestGap = g; gapFrom = starts[i - 1]; }
  }
  const firstTick = starts.length > 0 ? starts[0] : null;
  const tailGap = starts.length > 0 ? state.tick - starts[starts.length - 1] : state.tick;
  const pass = firstTick !== null
    && firstTick <= FIRST_FIRST_ENCOUNTER_MAX_TICK
    && longestGap <= FIRST_ENCOUNTER_MAX_GAP_TICKS;
  return { seed, firstId, starts, firstTick, longestGap, gapFrom, tailGap, pass };
}

const isMain = typeof process !== 'undefined' && process.argv[1] && /first-(encounter-)?gate/.test(process.argv[1]);
if (isMain) {
  const seeds = (process.argv[2] ?? '42,99,11').split(',').map(Number);
  const ticks = Number(process.argv[3] ?? 150);
  let failed = 0;
  console.log(`The First's encounter rhythm — attended, medium, ${ticks} ticks (gate: first ≤ ${FIRST_FIRST_ENCOUNTER_MAX_TICK}, longest gap ≤ ${FIRST_ENCOUNTER_MAX_GAP_TICKS})`);
  for (const seed of seeds) {
    const r = measureFirstRhythm(seed, ticks);
    if (!r.pass) failed++;
    console.log(`  seed ${seed}: ${r.pass ? 'PASS' : 'FAIL'} — ${r.starts.length} encounters, first at t${r.firstTick ?? '—'}, longest gap ${r.longestGap} (from t${r.gapFrom ?? '—'}), tail ${r.tailGap}`);
    console.log(`    starts: ${r.starts.join(' ')}`);
  }
  if (failed > 0) process.exitCode = 1;
}
