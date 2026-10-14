/**
 * THR-1869 hunger and unrest — OBSERVER SKETCH. Throwaway; never merged.
 *
 * The world runs unmodified (seed 42, medium, 600 ticks = 50 days). Every tick the sketch
 * reads each settlement's `unrest` (max per day and the positive jumps); once a day it reads
 * prosperity, populationHealth, the scarcity-arc phase, scarce staples, sieges on the town and
 * the agents who live there. The accounting then replays two unrest models over that record:
 *
 *   today    — the engine's own number (flat decay 1/tick = 12/day, one-shot arc bumps)
 *   pressure — unrest drifts toward a target set by what the town is living through
 *              (hunger, poverty, a siege, sickness, contentment), plus the same one-shot jumps
 *
 * CAVEAT: nothing feeds back. A town that would rise in the pressure model does not rise here.
 * Hunger is read two ways because the arc cap is jammed today (THR-1919): from the arc phase,
 * and from "days in a row with a scarce staple" (what the arc would see once unjammed).
 *
 * Run:   npx esbuild scripts/proto/hunger-unrest-sketch.ts --bundle --platform=node --format=esm \
 *          --outfile=.cache/hunger-unrest.mjs --external:fs --external:path && node .cache/hunger-unrest.mjs
 *        add `--cached` to re-account the saved record without re-running the world.
 */
import * as fs from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../src/engine/cosmology';
import { generateArchetypes } from '../../src/engine/ascendant';
import { createSimulationRuntime } from '../../src/engine/simulationRuntime';
import { TICKS_PER_DAY } from '../../src/data/attention-constants';
import { getResourceClass } from '../../src/data/resource-classes';
import type { WorldGraph } from '../../src/engine/graph';

const SEED = Number(process.argv.find(a => a.startsWith('--seed='))?.slice(7) ?? 42);
const TICKS = 600;
const NO_IMPULSE = process.argv.includes('--no-impulse');
const CACHE = `.cache/hunger-unrest-${SEED}.json`;
const OUT = `scripts/proto/hunger-unrest-sketch.seed${SEED}${NO_IMPULSE ? '.no-impulse' : ''}.output.txt`;
const TIERS = ['hamlet', 'town', 'city', 'capital'];

// ─── Pressure model constants (the proposal under test) ─────────────────────
const DRIFT_PER_DAY = 4;            // unrest moves at most this far toward its target each day
const HUNGER_BY_PHASE: Record<string, number> = { shortage: 15, hoarding: 25, unrest: 40, flashpoint: 55 };
const HUNGER_BASE = 10;             // scarce staple, day 1
const HUNGER_PER_DAY = 3;           // each further day in a row a staple stays scarce
const HUNGER_MAX = 55;
const POVERTY_PIVOT = 35;           // prosperity below this feeds unrest
const POVERTY_PER_POINT = 0.6;
const POVERTY_MAX = 20;
const SIEGE_PRESSURE = 30;          // the town is under siege today
const SIEGE_LINGER_DAYS = 5;        // ...and for a while after
const SICK_PRESSURE = 10;           // populationHealth below the dampener threshold
const SICK_THRESHOLD = 40;
const CONTENT_PIVOT = 60;           // prosperity above this pulls the target down
const CONTENT_RELIEF = 10;
const BANDS = [30, 50, 70, 90];     // Restless, Lawless, on the edge, rising

type G = WorldGraph;
interface DayRec {
  day: number; prosperity: number; health: number; unrestEnd: number; unrestMax: number; jumps: number;
  arc?: string; scarce: string[]; siegeTicks: number; holder?: string; residents: number;
}
interface Rec { names: Record<string, string>; subtype: Record<string, string>; days: Record<string, DayRec[]> }

function settlements(g: G) {
  return g.getNodesByType('location').filter(n => !n.properties.parentLocationId && TIERS.includes(n.properties.locationSubtype as string));
}
function holderOf(g: G, id: string): string | undefined {
  const es = g.getIncomingEdges(id, 'controls');
  let best: { s: string; inf: number } | undefined;
  for (const e of es) {
    const inf = typeof e.properties?.influence === 'number' ? e.properties.influence as number : 0;
    if (!best || inf > best.inf) best = { s: e.source, inf };
  }
  return best?.s;
}
function residentsOf(g: G, id: string): number {
  let n = 0;
  for (const a of g.getNodesByType('actor')) {
    if (a.properties.actorType !== 'individual' || a.properties.isDead) continue;
    const at = g.getOutgoingEdges(a.id, 'located_at')[0]?.target;
    if (!at) continue;
    const loc = g.getNode(at);
    const top = (loc?.properties.parentLocationId as string | undefined) ?? at;
    if (top === id) n++;
  }
  return n;
}

function runWorld(): Rec {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, SEED)[0];
  const preset = MAP_SIZE_PRESETS['medium'];
  let { state } = initializeGameState(archetype, 'HungerUnrestSketch', createBalancedCosmology(), SEED, preset.cols, preset.rows);
  const rec: Rec = { names: {}, subtype: {}, days: {} };
  const prevU = new Map<string, number>();
  const dayMax = new Map<string, number>();
  const dayJumps = new Map<string, number>();
  const daySiege = new Map<string, number>();
  for (const s of settlements(state.graph)) { prevU.set(s.id, Number(s.properties.unrest ?? 0)); }
  const t0 = Date.now();
  for (let i = 0; i < TICKS; i++) {
    state = runTick(state, [], runtime);
    const g = state.graph;
    for (const s of settlements(g)) {
      const u = Number(s.properties.unrest ?? 0);
      const p = prevU.get(s.id) ?? 0;
      // A rise bigger than the health bleed is an event (arc bump, incite, death site, doom).
      if (u > p + 0.01) dayJumps.set(s.id, (dayJumps.get(s.id) ?? 0) + (u - p + 1));
      prevU.set(s.id, u);
      dayMax.set(s.id, Math.max(dayMax.get(s.id) ?? 0, u));
    }
    for (const n of g.getNodesByType('actor')) {
      const bs = n.properties.battleState as { battleType?: string; settlementId?: string } | undefined;
      if (bs?.battleType === 'siege' && bs.settlementId) daySiege.set(bs.settlementId, (daySiege.get(bs.settlementId) ?? 0) + 1);
    }
    if (state.tick % TICKS_PER_DAY === 0) {
      const day = state.tick / TICKS_PER_DAY;
      for (const s of settlements(g)) {
        rec.names[s.id] = s.name;
        rec.subtype[s.id] = s.properties.locationSubtype as string;
        const res = (s.properties.resources ?? {}) as Record<string, { stockTier?: string }>;
        const scarce = Object.entries(res)
          .filter(([rid, r]) => r?.stockTier === 'scarce' && getResourceClass(rid).category === 'staple')
          .map(([rid]) => rid);
        const arc = (s.properties.scarcityArc as { phase?: string } | undefined)?.phase;
        (rec.days[s.id] ??= []).push({
          day,
          prosperity: Number(s.properties.prosperity ?? 0),
          health: Number(s.properties.populationHealth ?? 70),
          unrestEnd: Number(s.properties.unrest ?? 0),
          unrestMax: dayMax.get(s.id) ?? 0,
          jumps: dayJumps.get(s.id) ?? 0,
          arc, scarce,
          siegeTicks: daySiege.get(s.id) ?? 0,
          holder: holderOf(g, s.id),
          residents: residentsOf(g, s.id),
        });
      }
      dayMax.clear(); dayJumps.clear(); daySiege.clear();
      process.stderr.write(`day ${day} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
    }
  }
  fs.mkdirSync('.cache', { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(rec));
  return rec;
}

// ─── The pressure model ─────────────────────────────────────────────────────
interface Parts { hunger: number; poverty: number; war: number; sick: number; content: number }
function replay(days: DayRec[], hungerFrom: 'arc' | 'streak') {
  let u = days[0]?.unrestEnd ?? 0;
  let streak = 0;
  let lastSiege = -999;
  let prevArc: string | undefined;
  const out: { day: number; u: number; target: number; parts: Parts }[] = [];
  for (const d of days) {
    streak = d.scarce.length ? streak + 1 : 0;
    if (d.siegeTicks > 0) lastSiege = d.day;
    const hunger = hungerFrom === 'arc'
      ? (d.arc ? HUNGER_BY_PHASE[d.arc] ?? 0 : 0)
      : (streak ? Math.min(HUNGER_MAX, HUNGER_BASE + HUNGER_PER_DAY * (streak - 1)) : 0);
    const poverty = Math.min(POVERTY_MAX, Math.max(0, (POVERTY_PIVOT - d.prosperity) * POVERTY_PER_POINT));
    const war = d.day - lastSiege <= SIEGE_LINGER_DAYS ? SIEGE_PRESSURE : 0;
    const sick = d.health < SICK_THRESHOLD ? SICK_PRESSURE : 0;
    const content = d.prosperity > CONTENT_PIVOT ? CONTENT_RELIEF : 0;
    const target = Math.max(0, Math.min(100, hunger + poverty + war + sick - content));
    const step = Math.max(-DRIFT_PER_DAY, Math.min(DRIFT_PER_DAY, target - u));
    // Today's one-shot arc bumps (+12 entering 'unrest', +25 entering 'flashpoint') are hunger, so they are
    // removed from the jumps in both modes; other jumps (incite, death sites, doom, complications) stay impulses.
    const arcBump = d.arc !== prevArc ? (d.arc === 'unrest' ? 13 : d.arc === 'flashpoint' ? 26 : 0) : 0;
    prevArc = d.arc;
    // --no-impulse: drop jumps entirely (seed 7 death-site runaway adds +3/tick forever; see THR-1869 notes).
    const impulse = NO_IMPULSE ? 0 : Math.max(0, d.jumps - arcBump);
    u = Math.max(0, Math.min(100, u + step + impulse));
    out.push({ day: d.day, u, target, parts: { hunger, poverty, war, sick, content } });
  }
  return out;
}

function main() {
  const rec: Rec = process.argv.includes('--cached') && fs.existsSync(CACHE)
    ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : runWorld();
  const lines: string[] = [];
  const p = (x = '') => lines.push(x);
  const ids = Object.keys(rec.days);
  const nDays = Math.max(...ids.map(id => rec.days[id].length));
  p(`THR-1869 hunger and unrest — observer sketch, seed ${SEED}, medium, ${nDays} days, ${ids.length} settlements`);
  p(`Bands: ${BANDS.join(' / ')} = Restless (THR-1923) / Lawless (existing trait) / on the edge / rising`);
  p();

  // ── Inputs ──
  const daysWith = (f: (d: DayRec) => boolean) => ids.reduce((s, id) => s + rec.days[id].filter(f).length, 0);
  const townsWith = (f: (d: DayRec) => boolean) => ids.filter(id => rec.days[id].some(f)).length;
  p('## What towns lived through (settlement-days / towns ever)');
  p(`scarce staple:     ${daysWith(d => d.scarce.length > 0)} / ${townsWith(d => d.scarce.length > 0)}`);
  p(`scarcity arc open: ${daysWith(d => !!d.arc)} / ${townsWith(d => !!d.arc)}  (flashpoint ${daysWith(d => d.arc === 'flashpoint')} / ${townsWith(d => d.arc === 'flashpoint')})`);
  p(`prosperity < ${POVERTY_PIVOT}:  ${daysWith(d => d.prosperity < POVERTY_PIVOT)} / ${townsWith(d => d.prosperity < POVERTY_PIVOT)}`);
  p(`under siege:       ${daysWith(d => d.siegeTicks > 0)} / ${townsWith(d => d.siegeTicks > 0)}`);
  p(`health < ${SICK_THRESHOLD}:      ${daysWith(d => d.health < SICK_THRESHOLD)} / ${townsWith(d => d.health < SICK_THRESHOLD)}`);
  p(`unrest jumps:      ${daysWith(d => d.jumps > 0)} days with a jump, in ${townsWith(d => d.jumps > 0)} towns`);
  p();

  // ── Today ──
  p('## Today (the engine\'s own unrest)');
  const todayMax = ids.map(id => Math.max(...rec.days[id].map(d => d.unrestMax)));
  const q = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const at = (f: number) => s[Math.floor(f * (s.length - 1))]; return `${at(0).toFixed(0)}/${at(0.25).toFixed(0)}/${at(0.5).toFixed(0)}/${at(0.75).toFixed(0)}/${at(1).toFixed(0)}`; };
  p(`peak unrest per town, quartiles: ${q(todayMax)}`);
  p(`end-of-day unrest, all settlement-days, quartiles: ${q(ids.flatMap(id => rec.days[id].map(d => d.unrestEnd)))}`);
  for (const b of BANDS) p(`  towns ever ≥ ${b} (any tick): ${todayMax.filter(m => m >= b).length}; settlement-days ending ≥ ${b}: ${daysWith(d => d.unrestEnd >= b)}`);
  const flash = ids.filter(id => rec.days[id].some(d => d.arc === 'flashpoint'));
  for (const id of flash) {
    const ds = rec.days[id];
    const fDays = ds.filter(d => d.arc === 'flashpoint');
    p(`  ${rec.names[id]}: flashpoint ${fDays.length} days; unrest at end of those days median ${q(fDays.map(d => d.unrestEnd)).split('/')[2]}`);
  }
  p();

  // ── Pressure model ──
  for (const mode of ['arc', 'streak'] as const) {
    p(`## Pressure model, hunger read from ${mode === 'arc' ? 'the scarcity-arc phase (jammed cap, as today)' : 'days in a row with a scarce staple (arc cap unjammed)'}`);
    p(`drift ${DRIFT_PER_DAY}/day toward target = hunger + poverty + siege + sickness − contentment`);
    const runs = ids.map(id => ({ id, r: replay(rec.days[id], mode) }));
    const peak = runs.map(x => Math.max(...x.r.map(d => d.u)));
    p(`peak unrest per town, quartiles: ${q(peak)}`);
    for (const b of BANDS) {
      const towns = runs.filter(x => x.r.some(d => d.u >= b));
      const sdays = runs.reduce((s, x) => s + x.r.filter(d => d.u >= b).length, 0);
      p(`  ≥ ${b}: ${towns.length} towns, ${sdays} settlement-days${towns.length && towns.length <= 8 ? ` — ${towns.map(x => rec.names[x.id]).join(', ')}` : ''}`);
    }
    // Who drives it: share of target by part, over settlement-days with target ≥ 30
    const hot = runs.flatMap(x => x.r.filter(d => d.target >= 30));
    const sum = (k: keyof Parts) => hot.reduce((s, d) => s + d.parts[k], 0);
    const tot = sum('hunger') + sum('poverty') + sum('war') + sum('sick');
    if (tot > 0) p(`  what drives targets ≥ 30 (${hot.length} settlement-days): hunger ${Math.round(100 * sum('hunger') / tot)}%, poverty ${Math.round(100 * sum('poverty') / tot)}%, siege ${Math.round(100 * sum('war') / tot)}%, sickness ${Math.round(100 * sum('sick') / tot)}%`);
    // Edge stories: first day each town crosses 70, why, and residents there
    for (const x of runs) {
      const hit = x.r.find(d => d.u >= 70);
      if (!hit) continue;
      const d = rec.days[x.id].find(dd => dd.day === hit.day)!;
      const rise = x.r.find(dd => dd.u >= 90);
      p(`  ${rec.names[x.id]} (${rec.subtype[x.id]}, holder ${d.holder ?? 'none'}, ${d.residents} residents): ≥70 day ${hit.day} [hunger ${hit.parts.hunger.toFixed(0)}, poverty ${hit.parts.poverty.toFixed(0)}, siege ${hit.parts.war}, sick ${hit.parts.sick}]${rise ? `; ≥90 day ${rise.day}` : ''}`);
    }
    p();
  }

  // ── Who could leave ──
  p('## Who lives in a town on the edge (residents on days the streak model is ≥ 50)');
  const streakRuns = ids.map(id => ({ id, r: replay(rec.days[id], 'streak') }));
  let resDays = 0, edgeTowns = 0;
  for (const x of streakRuns) {
    const hotDays = x.r.filter(d => d.u >= 50).map(d => d.day);
    if (!hotDays.length) continue;
    edgeTowns++;
    const res = rec.days[x.id].filter(d => hotDays.includes(d.day)).map(d => d.residents);
    resDays += res.reduce((a, b) => a + b, 0);
  }
  p(`towns ≥ 50 at some point: ${edgeTowns}; resident-days in them: ${resDays}`);
  p(`total residents on day ${nDays}: ${ids.reduce((s, id) => s + (rec.days[id][rec.days[id].length - 1]?.residents ?? 0), 0)}`);

  fs.writeFileSync(OUT, lines.join('\n') + '\n');
  process.stdout.write(lines.join('\n') + '\n');
}

main();
