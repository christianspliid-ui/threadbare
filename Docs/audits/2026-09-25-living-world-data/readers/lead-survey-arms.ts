// Census reader (THR-1686): the lead survey and the kept visit, one seed per process.
// Read-only. Medium map, unattended (no player, no First).
// Usage: npx esbuild <this> --bundle --platform=node --format=esm --outfile=.cache/lead-arms-<arm>.mjs
//          --external:fs --external:path && node .cache/lead-arms-<arm>.mjs <seed> [ticks=300] [out]
// The arm is whatever the three kill switches read when the bundle was built
// (CLUE_LEAD_SURVEY_SKIPS_WINDOW, APPOINTMENT_WAITING_HOLD_ENABLED,
// APPOINTMENT_DISCOUNT_ON_BOARD) — bundle once per arm, run one seed per process, so no
// module-level state crosses arms.
//
// Per seed: ruin surveys (the clue reader), visits arranged / kept / missed (by reason),
// the visit's regime path and how many went waiting → lost, located leads, delves
// admitted, encounter engagements, undertakings started, and `observe` undertakings
// started — raw and with ruin surveys netted out.
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { enableTracing, getTraces, clearTraces } from '../../../../src/engine/traceBuffer';
import { CLUE_LEAD_SURVEY_SKIPS_WINDOW } from '../../../../src/engine/ruins/constants';
import { APPOINTMENT_DISCOUNT_ON_BOARD, APPOINTMENT_WAITING_HOLD_ENABLED } from '../../../../src/data/movement-content';
import type { GameState } from '../../../../src/types/gameState';

const seed = Number(process.argv[2] ?? 42);
const TICKS = Number(process.argv[3] ?? 300);
const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };

resetEventCounter(); resetReputationTraitInit(); clearTraces(); enableTracing();
const rt = createSimulationRuntime(); const pr = MAP_SIZE_PRESETS['medium'];
let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows) as { state: GameState };
const g = () => state.graph;

const counts: Record<string, number> = {};
const visit: Record<string, number> = {};
const visitSeeds = new Set<string>();
const visitPath = new Map<string, string[]>();
const missedSeeds = new Set<string>();
// `debug` as the 5th argument prints every trace of a visit holder's agent from the
// first tick its visit reads `waiting` — how a waiting mortal came to leave.
const DEBUG = process.argv[5] === 'debug';
const visitHolder = new Map<string, string>();
const watching = new Set<string>();
let located = 0;
let certainOnBoard = 0;
let certainWon = 0;
let discountOnBoard = 0;
const started = Date.now();

for (let t = 1; t <= TICKS; t++) {
  state = runTick(state, [], rt);
  for (const tr of getTraces() as ReadonlyArray<Record<string, unknown>>) {
    const c = String(tr.category);
    if (DEBUG && watching.has(String(tr.agentId ?? tr.actorId ?? ''))) console.error(t, c, String(tr.summary ?? '').slice(0, 220));
    if (c === 'engagement_decision' && tr.chosenId) inc(counts, 'engagements');
    if (c === 'strategic_action_started' && tr.startedBy !== 'review_lever') {
      inc(counts, 'undertakings');
      // An `observe` undertaking is any survey cell (`cell.observe.*`); a ruin survey is
      // one aimed at a ruin, which is what the lead survey is.
      const observe = String(tr.templateId ?? '').startsWith('cell.observe');
      if (observe) inc(counts, 'observe');
      const target = g().getNode(String(tr.targetNodeId ?? ''));
      const sub = String(target?.properties.locationSubtype ?? target?.properties.locationType ?? '');
      if (observe && /ruin/.test(sub)) inc(counts, 'observe_ruin');
    }
    if (c === 'undertaking_reader' && tr.reader === 'clue') {
      inc(counts, 'ruin_surveys');
      if (tr.refused) inc(counts, `survey_refused:${tr.refused}`);
    }
    // A lead *reaching* `located` — never a re-survey that refreshes one already there.
    if (c === 'ruins.clue_sharpened' && tr.to === 'located' && tr.from !== 'located') located++;
    if (c === 'ruins.clue_discovered' && tr.precision === 'located') located++;
    if (c === 'ruins.delve_admitted') inc(counts, 'delve_admitted');
    if (c.startsWith('ruins.delve')) inc(counts, c);
    if (DEBUG && (c.startsWith('ruins.') || (c === 'undertaking_reader' && tr.reader === 'clue'))) console.error(t, c, String(tr.summary ?? '').slice(0, 220));
    // What the visit's dice decided: the outcome and the precision the lead moved to.
    if (c === 'encounter_aftermath_effect' && tr.effectKind === 'sharpen_clue') {
      const d = (tr.effectDetail ?? {}) as Record<string, unknown>;
      inc(visit, tr.success ? `sharpen:${d.actionOutcome ?? 'missed'}>${d.to}` : `sharpen_noop:${tr.failReason}`);
    }
    if (c === 'appointment_planted' && tr.templateId === 'cell.observe.location') {
      if (tr.refused) inc(visit, `refused:${tr.refused}`);
      else {
        inc(visit, 'arranged'); visitSeeds.add(String(tr.seedId)); visitPath.set(String(tr.seedId), []);
        visitHolder.set(String(tr.seedId), String(tr.agentId));
      }
    }
    if (visitSeeds.has(String(tr.seedId))) {
      if (c === 'appointment_kept') inc(visit, 'kept');
      if (c === 'appointment_missed') { inc(visit, `missed:${tr.reason}`); missedSeeds.add(String(tr.seedId)); }
      if (c === 'appointment_regime') {
        visitPath.get(String(tr.seedId))!.push(String(tr.regime));
        if (DEBUG && tr.regime === 'waiting') watching.add(visitHolder.get(String(tr.seedId)) ?? '');
      }
    }
    if (c === 'decision_board_comparison') {
      const top = (tr.boardTop ?? []) as Array<{ forecastZone?: string; appointmentDiscount?: number }>;
      if (top.some(e => e.forecastZone === 'certain')) certainOnBoard++;
      if (top[0]?.forecastZone === 'certain') certainWon++;
      if (top.some(e => e.appointmentDiscount !== undefined)) discountOnBoard++;
    }
  }
  clearTraces();
}

// A visit that stood at the place ('waiting') and was then lost or missed anyway.
let waitingThenLost = 0;
for (const [seedId, path] of visitPath) {
  const w = path.indexOf('waiting');
  if (w >= 0 && (path.slice(w + 1).includes('lost') || missedSeeds.has(seedId))) waitingThenLost++;
}
const result = {
  seed, ticks: TICKS,
  arm: {
    CLUE_LEAD_SURVEY_SKIPS_WINDOW,
    APPOINTMENT_WAITING_HOLD_ENABLED,
    APPOINTMENT_DISCOUNT_ON_BOARD,
  },
  counts,
  observeNetOfRuinSurveys: (counts.observe ?? 0) - (counts.observe_ruin ?? 0),
  visit,
  visitPaths: [...visitPath.values()].map(p => p.join('>')),
  waitingThenLost,
  located,
  board: { certainOnBoard, certainWon, discountOnBoard },
  wallMs: Date.now() - started,
};
console.log(JSON.stringify(result));
if (process.argv[4]) writeFileSync(process.argv[4], JSON.stringify(result, null, 1));
