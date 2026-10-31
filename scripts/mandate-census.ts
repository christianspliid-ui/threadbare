// THR-2081 — Mandate census: does only the god's own hand fill the Mandate?
//
// Promoted from the design lane's proto census (`scripts/_scratch-2081b.ts` on
// `proto/thr-2081-mandate-drift`). The ledger is no longer re-derived from traces: the
// census reads the engine's own `mandateState.godLedger` and `mandateState.progress`.
//
// Arms:
//   idle    — the god takes no action. Done-when: progress < 0.5 at doom 0.75 on the
//             seeded route; on the CLI seeds (doom asleep) through tick 900.
//   godloc  — a scripted all-in god: every tick it can afford it casts the cheapest card
//             of each Mandate sphere that targets a place or sublocation, through the real
//             player-cast path. Done-when: completes between doom 0.5 and 0.75 (seeded).
//   sweep   — godloc once per Hunger in hunger-catalog.ts on the seeded route; prints each
//             Hunger's progress at doom 0.75 (report-only; the kill criterion reads it).
//   godfit  — godloc on the seeded route with the Mandate unable to end (targets set out of
//             reach after the settle), so the ledger can be read at doom 0.5 / 0.75 to fit
//             the point constants (Done-when 2).
//
// THR-2089: the god casts only where a player could — a card with `targetSubtypes` draws its
// targets from the place tier filtered to those subtypes — and stops casting on a sphere
// once that half's ledger meets its target (a player would move the essence).
//
// Usage: npm run census:mandate -- [idle|godloc|sweep] [seeded|cli42|cli99|cli7|all] [hungerId]
import {
  initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY, initializeGameState,
} from '../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../src/engine/orchestrator';
import { unattended } from '../src/engine/playerStepHold';
import { deriveCosmologyFromIdentity } from '../src/engine/remembrance';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import { HUNGER_CATALOG } from '../src/data/hunger-catalog';
import { preparePlayerCast, commitPlayerCast } from '../src/engine/playerCastDispatch';
import { getPlaceNodes, getLocationNodes } from '../src/engine/sublocationShape';
import { MANDATE_PRIMARY_TARGET_POINTS, MANDATE_SECONDARY_TARGET_POINTS } from '../src/data/game-config';

const arm = process.argv[2] ?? 'idle';
const world = process.argv[3] ?? 'all';
const hungerOnly = process.argv[4];
const SEEDED_DOOM_STOP = 0.75;
const CLI_TICKS = 900;
const SEEDED_TICK_CAP = 1200;

/* eslint-disable @typescript-eslint/no-explicit-any */
function cheapest(sphere: string, cats: string[]): any | undefined {
  return (UNIFIED_ACTION_TEMPLATES as any[])
    .filter(t => t.sphereAffinity === sphere && (t.essenceCost ?? 0) > 0 && (t.actorAffinities ?? []).includes('ascendant'))
    .filter(t => (t.targetCategories ?? ['actor']).some((c: string) => cats.includes(c)))
    .sort((a, b) => a.essenceCost - b.essenceCost)[0];
}

interface RunResult { label: string; tick: number; doom: number; progress: number; ledgerP: number; ledgerS: number; ended: string | null }

function run(label: string, mk: () => any, opts: { god: boolean; doomStop?: number; ticks: number; fit?: boolean }): RunResult {
  resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
  const rt = createSimulationRuntime();
  let state = mk();
  const d0 = state.mandateDefinition;
  const P = d0.primarySphere; const S = d0.secondarySphere;
  const placeCats = ['location', 'sublocation'];
  // Hex cards are not picked: a push onto a hex_COL_ROW target is dropped as an unknown
  // entity today (THR-2087), so it would credit nothing. Fallback is a mortal-target card.
  const tpl: Record<string, any> = {
    [P]: cheapest(P, placeCats) ?? cheapest(P, ['actor']),
    [S]: cheapest(S, placeCats) ?? cheapest(S, ['actor']),
  };
  let casts = 0;
  console.log(`\n## ${label} arm=${opts.god ? 'godloc' : 'idle'} mandate="${d0.name}" P=${P} (${tpl[P]?.id ?? 'none'}) S=${S} (${tpl[S]?.id ?? 'none'})`);
  const report = new Set([50, 100, 150, 300, 450, 600, 750, 900, 1050, 1200]);
  const doomMarks = [0.5, 0.55, 0.6, 0.65, 0.7, 0.75];
  let last: RunResult = { label, tick: 0, doom: 0, progress: 0, ledgerP: 0, ledgerS: 0, ended: null };
  for (let i = 0; i < opts.ticks; i++) {
    if (opts.god && state.tick >= 2) {
      const ledger = state.mandateState?.godLedger ?? {};
      const met: Record<string, boolean> = {
        [P]: (ledger.primary ?? 0) >= MANDATE_PRIMARY_TARGET_POINTS,
        [S]: (ledger.secondary ?? 0) >= MANDATE_SECONDARY_TARGET_POINTS,
      };
      for (const sp of [P, S]) {
        const t = tpl[sp]; if (!t || met[sp]) continue;
        if ((state.essencePool[sp] ?? 0) < t.essenceCost) continue;
        const cats: string[] = t.targetCategories ?? ['actor'];
        const pool = cats.includes('location')
          ? getPlaceNodes(state.graph)
          : cats.includes('sublocation')
            ? state.graph.getNodesByType('location').filter((n: any) => typeof n.properties?.parentLocationId === 'string')
            : state.graph.getNodesByType('actor').filter((n: any) => n.properties?.actorType === 'individual' && n.properties?.alive !== false);
        const subs: string[] = t.targetSubtypes ?? [];
        const legal = subs.length > 0
          ? getLocationNodes(state.graph).filter((n: any) => subs.includes(n.properties?.locationSubtype ?? n.properties?.locationType))
          : pool;
        if (legal.length === 0) continue;
        const target = legal[(state.tick * 7919 + casts) % legal.length];
        try {
          const cast = preparePlayerCast({ graph: state.graph, ascendantId: state.ascendantId, template: t, templateId: t.id, targetId: target.id, tick: state.tick, seed: 2081 + casts * 13, sphere: sp, runtime: rt });
          state = commitPlayerCast(state, { cast });
          casts++;
        } catch { /* a refused cast costs this tick's attempt only */ }
      }
    }
    state = opts.god ? runTick(state, [], rt) : unattended(runTick(state, [], rt));
    if (opts.fit && state.mandateState?.baselineSettledTick != null && state.mandateDefinition.primaryTargetDelta < 99) {
      state = { ...state, mandateDefinition: { ...state.mandateDefinition, primaryTargetDelta: 99, secondaryTargetDelta: 99, checkpoints: [] } };
    }
    const ms = state.mandateState ?? {};
    const doom = state.doomClock?.progress ?? 0;
    last = {
      label, tick: state.tick, doom, progress: ms.progress ?? 0,
      ledgerP: ms.godLedger?.primary ?? 0, ledgerS: ms.godLedger?.secondary ?? 0,
      ended: state.phase !== 'playing' ? (ms.completed ? 'Mandate fulfilled' : 'doom') : null,
    };
    if (report.has(state.tick) || last.ended) {
      console.log(`${label} t${last.tick} doom=${doom.toFixed(3)} progress=${last.progress.toFixed(3)} ledger=${last.ledgerP.toFixed(1)}/${MANDATE_PRIMARY_TARGET_POINTS} ${last.ledgerS.toFixed(1)}/${MANDATE_SECONDARY_TARGET_POINTS} casts=${casts}`);
    }
    while (doomMarks.length > 0 && doom >= doomMarks[0]) {
      console.log(`${label} doom>=${doomMarks.shift()} t${last.tick} ledger=${last.ledgerP.toFixed(1)}/${last.ledgerS.toFixed(1)} progress=${last.progress.toFixed(3)}`);
    }
    if (last.ended) { console.log(`${label} age ended at t${last.tick}: ${last.ended}`); break; }
    if (opts.doomStop != null && doom >= opts.doomStop) break;
  }
  console.log(`${label} FINAL t${last.tick} doom=${last.doom.toFixed(3)} progress=${last.progress.toFixed(3)} ledger=${last.ledgerP.toFixed(1)}/${last.ledgerS.toFixed(1)}`);
  return last;
}

function seededFor(hungerId?: string): () => any {
  const h = hungerId ? HUNGER_CATALOG.find(x => x.id === hungerId) : undefined;
  const identity: any = h
    ? {
      ...DEV_ASCENDANT_IDENTITY,
      hungerId: `hunger.${h.id}`, hungerName: h.name,
      sphereAlignment: h.sphereAlignment,
      spherePoints: { [h.sphereAlignment.primary]: 3, [h.sphereAlignment.secondary]: 2 },
    }
    : DEV_ASCENDANT_IDENTITY;
  const c = deriveCosmologyFromIdentity({ sphereAlignment: identity.sphereAlignment, mortalTags: identity.mortalTags, hungerId: identity.hungerId });
  return () => { const s = initializeGameStateFromIdentity(identity, 42, c, 'medium', 'breach').state; devSeedTheFirst(s); return s; };
}

function cliFor(seed: number): () => any {
  return () => initializeGameState(generateArchetypes(4, seed)[0], 'T', createBalancedCosmology(), seed, 32, 24).state;
}

const results: RunResult[] = [];
if (arm === 'idle' || arm === 'godloc') {
  const god = arm === 'godloc';
  if (world === 'all' || world === 'seeded') {
    results.push(run('seeded42', seededFor(), { god, doomStop: SEEDED_DOOM_STOP, ticks: SEEDED_TICK_CAP }));
  }
  for (const seed of [42, 99, 7]) {
    if (world === 'all' || world === `cli${seed}`) results.push(run(`cli${seed}`, cliFor(seed), { god, ticks: CLI_TICKS }));
  }
} else if (arm === 'godfit') {
  results.push(run('seeded42-fit', seededFor(), { god: true, doomStop: SEEDED_DOOM_STOP, ticks: SEEDED_TICK_CAP, fit: true }));
} else if (arm === 'sweep') {
  for (const h of HUNGER_CATALOG) {
    if (hungerOnly && h.id !== hungerOnly) continue;
    results.push(run(`sweep:${h.id} (${h.sphereAlignment.primary}/${h.sphereAlignment.secondary})`, seededFor(h.id), { god: true, doomStop: SEEDED_DOOM_STOP, ticks: SEEDED_TICK_CAP }));
  }
}

console.log('\n| run | tick | doom | progress | ledger P / S | ended |\n|---|---|---|---|---|---|');
for (const r of results) {
  console.log(`| ${r.label} | ${r.tick} | ${r.doom.toFixed(2)} | ${r.progress.toFixed(3)} | ${r.ledgerP.toFixed(1)} / ${r.ledgerS.toFixed(1)} | ${r.ended ?? '—'} |`);
}
