/**
 * `check:grudge-duels` — the grudge boil-over evidence (THR-1558, Duels E3, plan doc
 * `Docs/plans/2026-09-23-mortal-duels.md` § Slices E3 and § Kill criteria).
 *
 * Runs the real `initializeGameState` → `runTick` pipeline (the CLI's own world: a
 * balanced cosmology, seed 42, medium map by default) for 200 ticks and reports:
 *
 * - **spawned** grudge duels — `fight.trigger` with `source: 'grudge'` and no
 *   `skipped`. Skips never count;
 * - the injury-class pairs that were ever co-located (the denominator when nothing
 *   spawned);
 * - duels per pair against `GRUDGE_DUEL_REPEAT_CEILING`;
 * - the result distribution of grudge duels (`fight.end`), `separated` included, and
 *   the faces (`fight.ending`), deaths among them.
 *
 * Exit 1 when a kill criterion trips: a pair over the ceiling, more than 10% of
 * grudge duels ending `separated` (the busy rule is leaking), or co-located injury
 * pairs with no spawn at all. More than one death per 100 ticks is printed as a
 * tuning flag (halve `GRUDGE_ESCALATION_BASE`), not a failure.
 *
 * `--inject N` writes a `blood_drawn` grudge (through the real `writeGrudge`) between N
 * co-located pairs of individuals at tick 0, for when natural play has written no
 * injury-class grudge yet: it exercises the whole road (trigger → fight → ending) in a
 * real world. Its output is labelled as injected and is never natural-play evidence.
 *
 * Usage: npm run check:grudge-duels [-- --seed S] [-- --ticks N] [-- --map small|medium|large] [-- --inject N]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { clearTraces, enableTracing, getTraces } from '../src/engine/traceBuffer';
import { injuryGrudgeCause } from '../src/engine/fights/grudgeDuelTrigger';
import { fightPairKey } from '../src/engine/monsters/lairArrivalTrigger';
import { GRUDGE_DUEL_REPEAT_CEILING } from '../src/data/fight-constants';
import { writeGrudge } from '../src/engine/grievance/grudgeEdge';
import { getAvatarAscendant } from '../src/engine/graphQueries';
import type { GameState } from '../src/types/gameState';
import type { FightEndTrace, FightEndingTrace, FightTriggerGrudgeTrace } from '../src/types/traces/fight-traces';

const argv = process.argv.slice(2);
const opt = (name: string): string | undefined => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const seed = Number(opt('--seed') ?? 42);
const ticks = Number(opt('--ticks') ?? 200);
const mapSize = (opt('--map') ?? 'medium') as keyof typeof MAP_SIZE_PRESETS;
const inject = Number(opt('--inject') ?? 0);

resetEventCounter();
clearTraces();
enableTracing();
const runtime = createSimulationRuntime();
const preset = MAP_SIZE_PRESETS[mapSize];
let state: GameState = initializeGameState(
  generateArchetypes(4, seed)[0], 'GrudgeCheck', createBalancedCosmology(), seed, preset.cols, preset.rows,
).state;

const injected: string[] = [];
if (inject > 0) {
  const byLoc = new Map<string, string[]>();
  for (const n of state.graph.getNodesByType('actor')) {
    if (n.properties.actorType !== 'individual' || getAvatarAscendant(state.graph, n.id)) continue;
    const loc = state.graph.getOutgoingEdges(n.id, 'located_at')[0]?.target;
    if (!loc) continue;
    if (!byLoc.has(loc)) byLoc.set(loc, []);
    byLoc.get(loc)!.push(n.id);
  }
  for (const ids of byLoc.values()) {
    for (let i = 0; i + 1 < ids.length && injected.length < inject; i += 2) {
      writeGrudge(state.graph, ids[i], ids[i + 1], state.tick, 'blood_drawn');
      injected.push(fightPairKey(ids[i], ids[i + 1]));
    }
    if (injected.length >= inject) break;
  }
}

const spawns: FightTriggerGrudgeTrace[] = [];
const skips = new Map<string, number>();
const duelIds = new Set<string>();
const results = new Map<string, number>();
const reasons = new Map<string, number>();
const faces = new Map<string, number>();
const injuryPairsSeen = new Set<string>();
let deaths = 0;

/** Injury-class pairs co-located at the location tier right now. */
function scanInjuryPairs(s: GameState): void {
  const byLoc = new Map<string, string[]>();
  for (const n of s.graph.getNodesByType('actor')) {
    if (n.properties.actorType !== 'individual') continue;
    const loc = s.graph.getOutgoingEdges(n.id, 'located_at')[0]?.target;
    if (!loc) continue;
    if (!byLoc.has(loc)) byLoc.set(loc, []);
    byLoc.get(loc)!.push(n.id);
  }
  for (const ids of byLoc.values()) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        if (injuryGrudgeCause(s, ids[i], ids[j]) || injuryGrudgeCause(s, ids[j], ids[i])) {
          injuryPairsSeen.add(fightPairKey(ids[i], ids[j]));
        }
      }
    }
  }
}

for (let t = 0; t < ticks; t++) {
  state = runTick(state, [], runtime);
  for (const tr of getTraces()) {
    if (tr.category === 'fight.trigger' && (tr as { source?: string }).source === 'grudge') {
      const g = tr as FightTriggerGrudgeTrace;
      if (g.skipped) skips.set(g.skipped, (skips.get(g.skipped) ?? 0) + 1);
      else {
        spawns.push(g);
        if (g.actionId) duelIds.add(g.actionId);
      }
    } else if (tr.category === 'fight.end') {
      const e = tr as FightEndTrace;
      if (!duelIds.has(e.actionId)) continue;
      const key = e.endReason === 'separated' ? 'separated' : e.result;
      reasons.set(`${e.result}/${e.endReason ?? '-'}`, (reasons.get(`${e.result}/${e.endReason ?? '-'}`) ?? 0) + 1);
      results.set(key, (results.get(key) ?? 0) + 1);
    } else if (tr.category === 'fight.ending') {
      const e = tr as FightEndingTrace;
      if (!duelIds.has(e.actionId)) continue;
      for (const face of [e.face, e.opponentFace]) {
        if (!face) continue;
        faces.set(face, (faces.get(face) ?? 0) + 1);
        if (face === 'slain') deaths++;
      }
    }
  }
  clearTraces();
  scanInjuryPairs(state);
}

const perPair = new Map<string, number>();
for (const s of spawns) {
  const k = fightPairKey(s.aggressorId, s.targetId);
  perPair.set(k, (perPair.get(k) ?? 0) + 1);
}
const maxPerPair = Math.max(0, ...perPair.values());
const ended = [...results.values()].reduce((a, b) => a + b, 0);
const separated = results.get('separated') ?? 0;

console.log('');
console.log(`grudge duels — seed ${seed}, ${mapSize}, ${ticks} ticks (tick ${state.tick})${injected.length ? ` — INJECTED ${injected.length} blood_drawn pairs at tick 0 (not natural play)` : ''}`);
console.log(`injury-class pairs ever co-located: ${injuryPairsSeen.size}`);
console.log(`spawned grudge duels: ${spawns.length} across ${perPair.size} pairs`);
for (const s of spawns) {
  console.log(`  t${s.tick}  ${s.aggressorId} → ${s.targetId}  (${s.grudgeCause}; chance ${s.chance.toFixed(3)}, roll ${s.roll.toFixed(3)})  ${s.actionId}`);
}
console.log(`skips traced (bounded, once per pair per window): ${[...skips].map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`);
console.log(`most duels by one pair: ${maxPerPair} (ceiling ${GRUDGE_DUEL_REPEAT_CEILING})`);
console.log(`results (${ended} ended): ${[...results].map(([k, v]) => `${k} ${v}`).join(', ') || 'none yet'}`);
console.log(`end reasons: ${[...reasons].map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`faces: ${[...faces].map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`);
console.log(`deaths: ${deaths} (${((deaths / ticks) * 100).toFixed(2)} per 100 ticks)`);

const failures: string[] = [];
if (maxPerPair > GRUDGE_DUEL_REPEAT_CEILING) failures.push(`a pair duelled ${maxPerPair} times (> ${GRUDGE_DUEL_REPEAT_CEILING}): the cooldown or eligibility is leaking`);
if (ended > 0 && separated / ended > 0.1) failures.push(`${separated}/${ended} grudge duels ended separated (> 10%): the busy rule is leaking`);
if (injuryPairsSeen.size > 0 && spawns.length === 0) failures.push(`${injuryPairsSeen.size} injury pairs co-located but no duel spawned`);
if ((deaths / ticks) * 100 > 1) console.log('TUNING FLAG: more than one grudge-duel death per 100 ticks — halve GRUDGE_ESCALATION_BASE');
console.log('');
if (failures.length > 0) {
  for (const f of failures) console.log(`FAIL: ${f}`);
  process.exit(1);
}
console.log(spawns.length > 0 ? 'OK' : `OK — no injury-class pair co-located (${injuryPairsSeen.size}); nothing to spawn`);
