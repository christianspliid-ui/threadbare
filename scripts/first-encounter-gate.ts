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
// and watches every journey The First makes. Per seed it gates:
//   - the tick of The First's first encounter   ≤ FIRST_FIRST_ENCOUNTER_MAX_TICK
//   - zero journey faults — the three THR-1639 defects, each read directly:
//       no-pull           a journey to an encounter carries no `motivationPull`, so
//                         the first re-check compares against zero and abandons it
//       target-lost       a decision-phase reroute to a better encounter drops
//                         `targetEncounterId`
//       goal-cut          on arrival the goal is `dropped` because the story breath
//                         or the cap cut it — the two stages that must keep it
//                         (an eligibility drop is fair: the mortal changed en route)
//
// The longest gap between encounters is reported, not gated (THR-1930). It was the
// S2 gate's proxy for these defects, and on seed 42 it moves between 19 and 40 when
// one unrelated template is added or removed: THR-1840's 37-tick gap was a 19-tick
// walk to a kept goal that a fatigue-driven rest then outvoted — the board deciding,
// not a defect — with zero faults on all three seeds.
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
import { getTimeline } from '../src/engine/encounterTimeline';
import { enableTracing, disableTracing, isTracingEnabled, clearTraces, getTracesForAgent } from '../src/engine/traceBuffer';
import type { MovementState } from '../src/types/movement';
import { CONTENT_OBJECT_KINDS } from '../src/data/content-objects';

/** S2 acceptance: The First's first encounter must start by this tick (attended, per seed). */
export const FIRST_FIRST_ENCOUNTER_MAX_TICK = 30;
/**
 * S2's original bound on The First's longest gap between encounters (attended, 150
 * ticks). Reported against, no longer gated — a single-seed gap is chaotic under any
 * change to the template pool (THR-1930); the journey faults are the gate.
 */
export const FIRST_ENCOUNTER_MAX_GAP_TICKS = 30;

const encKind = CONTENT_OBJECT_KINDS.find(k => k.id === 'encounter_template');
const isEncounter = (id: string) => !!encKind && encKind.idPrefixes.some(p => id.startsWith(p));

export type JourneyFaultKind = 'no-pull' | 'target-lost' | 'goal-cut';
export interface JourneyFault { tick: number; kind: JourneyFaultKind; detail: string }

export interface FirstRhythm {
  seed: number;
  firstId: string | null;
  starts: number[];
  firstTick: number | null;
  longestGap: number;
  gapFrom: number | null;
  tailGap: number;
  /** Distinct journeys The First made toward a named encounter (destination × goal). */
  journeys: number;
  /** Arrival decisions that found the goal on the board / found it gone. */
  arrivalsKept: number;
  arrivalsDropped: number;
  faults: JourneyFault[];
  pass: boolean;
}

interface JourneySnapshot { dest: string; queued: number; pull: number | undefined; goal: string | undefined }

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

  const journey = (): JourneySnapshot | null => {
    const m = firstId ? state.graph.getNode(firstId)?.properties?.movementState as MovementState | undefined : undefined;
    return m ? { dest: m.destinationId, queued: m.movementQueue?.length ?? 0, pull: m.motivationPull, goal: m.targetEncounterId } : null;
  };
  const faults: JourneyFault[] = [];
  const journeyKeys = new Set<string>();
  let arrivalsKept = 0; let arrivalsDropped = 0;

  // Tracing is a passive sink (emitTrace returns early when off); it is cleared
  // before each tick so the 500-entry ring never drops this tick's arrival.
  const tracingWasOn = isTracingEnabled();
  enableTracing();

  harvest();
  for (let i = 0; i < ticks; i++) {
    // The timeline is module-global and keyed by agent id, so a second seed in the
    // same process appends to the first's: read only what this tick wrote.
    const eventsBefore = firstId ? getTimeline(firstId).length : 0;
    clearTraces();
    state = runTick(state, [], runtime); harvest();
    const now = journey();
    if (now && now.queued > 0 && now.goal) {
      journeyKeys.add(`${now.dest}|${now.goal}`);
      if (!(typeof now.pull === 'number' && now.pull > 0)) {
        faults.push({ tick: state.tick, kind: 'no-pull', detail: `${now.goal} → ${now.dest}` });
      }
    }
    for (const e of firstId ? getTimeline(firstId).slice(eventsBefore) : []) {
      // Only the decision-phase reroute is always to an encounter. The movement-phase
      // reroute may follow the P0 drift heuristic, which names no encounter, and a
      // board pick of another family (an undertaking, a ruin) is not a reroute at all.
      if (e.phase === 'REROUTE' && e.reason === 'better_encounter' && now && now.queued > 0 && !now.goal) {
        faults.push({ tick: e.tick, kind: 'target-lost', detail: `${e.oldTarget} → ${e.newTarget}` });
      }
    }
    // The arrival verdict rides on a movement trace, written however the decision
    // ends; the DECIDE timeline event carries it only when an encounter is picked,
    // so an arrival that ends in an undertaking or idle would be invisible there.
    for (const t of firstId ? getTracesForAgent(firstId) : []) {
      if (t.category !== 'movement' || t.event !== 'arrival_goal') continue;
      if (t.arrivalGoal === 'kept') { arrivalsKept++; continue; }
      arrivalsDropped++;
      // A goal an eligibility stage drops (threat, reputation, prerequisites — the
      // mortal changed on the road) is a fair drop. One the story breath or the cap
      // cut, the two stages that must keep it, is the defect. The encounter cache is
      // static per location, so it cannot tell the two apart; the pipeline can.
      if (t.arrivalGoalCutBy) {
        faults.push({ tick: t.tick, kind: 'goal-cut', detail: `${t.encounterId} at ${t.destinationId} (cut by ${t.arrivalGoalCutBy})` });
      }
    }
  }
  clearTraces();
  if (!tracingWasOn) disableTracing();

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
    && faults.length === 0;
  return {
    seed, firstId, starts, firstTick, longestGap, gapFrom, tailGap,
    journeys: journeyKeys.size, arrivalsKept, arrivalsDropped, faults, pass,
  };
}

const isMain = typeof process !== 'undefined' && process.argv[1] && /first-(encounter-)?gate/.test(process.argv[1]);
if (isMain) {
  const seeds = (process.argv[2] ?? '42,99,11').split(',').map(Number);
  const ticks = Number(process.argv[3] ?? 150);
  let failed = 0;
  console.log(`The First's encounter rhythm — attended, medium, ${ticks} ticks (gate: first ≤ ${FIRST_FIRST_ENCOUNTER_MAX_TICK}, zero journey faults; longest gap reported against ${FIRST_ENCOUNTER_MAX_GAP_TICKS}, not gated)`);
  for (const seed of seeds) {
    const r = measureFirstRhythm(seed, ticks);
    if (!r.pass) failed++;
    console.log(`  seed ${seed}: ${r.pass ? 'PASS' : 'FAIL'} — ${r.starts.length} encounters, first at t${r.firstTick ?? '—'}, journeys ${r.journeys}, arrivals kept ${r.arrivalsKept} / dropped ${r.arrivalsDropped}, faults ${r.faults.length}; longest gap ${r.longestGap} (from t${r.gapFrom ?? '—'}), tail ${r.tailGap}`);
    for (const f of r.faults) console.log(`    fault t${f.tick} ${f.kind}: ${f.detail}`);
    console.log(`    starts: ${r.starts.join(' ')}`);
  }
  if (failed > 0) process.exitCode = 1;
}
