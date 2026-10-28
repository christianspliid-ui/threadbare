/**
 * PROTO (THR-2040 re-plan) — never merged. Does SEEDING a famine/plenty scene move the
 * census where the larder pull did not? With SEED=1, after each tick: a settlement on its
 * FAMINE_SEED_DAY-th hungry day (cooldown COOLDOWN_DAYS) gets one famine-row seed for a
 * resident; a settlement whose glut run just reached 3 surplus days at balance ≥ 0.75
 * (same cooldown) gets one plenty-row seed. Row picked by weight, deterministically.
 * Census (the first plan's): firings whose actor stands in a hungry / glutted / fed
 * settlement, and the famine / plenty rows' share of them. Plus seed fire rate.
 */
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { isHungryToday } from '../src/engine/unrestPressure/hunger';
import { getAgentLocation } from '../src/engine/graphQueries';
import { pickTargetAgent } from '../src/engine/phases/routeEvents';
import type { PendingEncounterSeed } from '../src/types/unifiedAction';

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,99,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 360);
const SEED = process.env.SEED === '1';
const TPD = 12, FAMINE_SEED_DAY = 2, COOLDOWN_DAYS = 10;
const FAMINE: [string, number][] = [['encounter.aid_refugees', 1], ['gold.famine.merchant_granaries', 1], ['encounter.barter_survival', 0.9], ['encounter.mend_fishing_nets', 0.6], ['encounter.town.bell_at_the_exchange', 0.6], ['encounter.forage_provisions', 0.6], ['encounter.black_market_deal', 0.5], ['encounter.pickpocket', 0.4]];
const PLENTY: [string, number][] = [['encounter.harvest_bounty', 1], ['encounter.market_day_festival', 0.8], ['encounter.town.mill_lease_auction', 0.6], ['encounter.town.tithe_barn_raid', 0.6], ['encounter.festival_of_spheres', 0.5], ['tavern.drinking_contest', 0.5], ['encounter.realm.crowns_reckoning', 0.5], ['encounter.grand_tournament', 0.4], ['encounter.caravan_deal', 0.4], ['encounter.foreign_trader', 0.4]];
const FAM_IDS = new Set(FAMINE.map(r => r[0])); const PL_IDS = new Set(PLENTY.map(r => r[0]));
const SETTLE = ['hamlet', 'town', 'city', 'capital'];
const hash = (s: string) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
const pick = (rows: [string, number][], key: string) => { const tot = rows.reduce((a, r) => a + r[1], 0); let x = hash(key) * tot; for (const r of rows) { x -= r[1]; if (x <= 0) return r[0]; } return rows[0][0]; };

const C: Record<string, number> = {};
const inc = (k: string) => { C[k] = (C[k] ?? 0) + 1; };
for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime(); const preset = MAP_SIZE_PRESETS.medium;
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'Seed', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const lastSeed = new Map<string, number>(); const planted = new Map<string, { agent: string; tpl: string; tick: number }>();
  const seen = new Set<string>(); const prevSurplus = new Map<string, number>();
  const spell = new Map<string, { kind: string; start: number; covered: boolean }>();
  const closeSpell = (id: string, t: number) => { const sp = spell.get(id); if (!sp) return; const days = (t - sp.start) / TPD; if (days >= (sp.kind === "hungry" ? FAMINE_SEED_DAY : 1)) { inc(`spell|${sp.kind}|n`); if (sp.covered) inc(`spell|${sp.kind}|covered`); } spell.delete(id); };
  for (let t = 1; t <= ticks; t++) {
    state = runTick(state, [], runtime);
    const towns = state.graph.getNodesByType('location').filter(n => SETTLE.includes(n.properties.locationSubtype as string));
    const ctx = new Map<string, string>();
    const newSeeds: PendingEncounterSeed[] = [];
    for (const n of towns) {
      const p = n.properties; const hungry = isHungryToday(n).hungry;
      const sd = Number(p.foodSurplusDays) || 0, fb = Number(p.foodBalance) || 0;
      const glut = !hungry && sd >= 3 && fb >= 0.75;
      const cnow = hungry ? 'hungry' : glut ? 'glut' : 'fed'; ctx.set(n.id, cnow);
      const sp = spell.get(n.id); if (sp && sp.kind !== cnow) closeSpell(n.id, t); if (cnow !== 'fed' && !spell.has(n.id)) spell.set(n.id, { kind: cnow, start: t, covered: false });
      if (!SEED || t % TPD !== 0) continue;
      const last = lastSeed.get(n.id);
      if (last !== undefined && t - last < COOLDOWN_DAYS * TPD) { prevSurplus.set(n.id, sd); continue; }
      const famineTrigger = hungry && (Number(p.hungerDays) || 0) === FAMINE_SEED_DAY;
      const glutTrigger = glut && (prevSurplus.get(n.id) ?? 0) < 3;
      prevSurplus.set(n.id, sd);
      if (!famineTrigger && !glutTrigger) continue;
      const agent = pickTargetAgent(state, [n.id]); if (!agent) { inc(famineTrigger ? 'seed|famine|noone' : 'seed|plenty|noone'); continue; }
      const tpl = pick(famineTrigger ? FAMINE : PLENTY, `${n.id}:${t}`);
      const seedId = `proto_larder_${n.id}_${t}`;
      newSeeds.push({ seedId, sourceEncounterId: 'proto_larder', sourceReactionId: famineTrigger ? 'famine' : 'glut', targetAgentId: agent, eligibleAfterTick: t + 3, priority: 1.2, plantedTick: t, templateId: tpl, seedLabel: 'proto' } as PendingEncounterSeed);
      planted.set(seedId, { agent, tpl, tick: t }); lastSeed.set(n.id, t);
      inc(famineTrigger ? 'seed|famine|planted' : 'seed|plenty|planted');
    }
    if (newSeeds.length) state = { ...state, pendingEncounterSeeds: [...(state.pendingEncounterSeeds ?? []), ...newSeeds] };
    for (const a of state.unifiedActions ?? []) {
      if (seen.has(a.actionId)) continue; seen.add(a.actionId);
      const loc = getAgentLocation(state.graph, a.actorId);
      const at = loc && SETTLE.includes(loc.properties.locationSubtype as string) ? loc.id : (loc?.properties?.parentLocationId as string | undefined);
      const c = at ? ctx.get(at) : undefined;
      if (c && at) { const sp = spell.get(at); if (sp && ((sp.kind === 'hungry' && FAM_IDS.has(a.templateId)) || (sp.kind === 'glut' && PL_IDS.has(a.templateId)))) sp.covered = true; }
      if (c) { inc(`${c}|all`); if (FAM_IDS.has(a.templateId)) inc(`${c}|famine`); if (PL_IDS.has(a.templateId)) inc(`${c}|plenty`); }
      for (const [, s] of planted) if (s.agent === a.actorId && s.tpl === a.templateId && a.startTick !== undefined ? true : (s.agent === a.actorId && s.tpl === a.templateId)) { inc('seed|fired'); break; }
    }
  }
  for (const id of [...spell.keys()]) closeSpell(id, ticks + 1);
  console.error(`seed ${seed} done`);
}
const pct = (n = 0, d = 0) => `${n}/${d} (${((100 * n) / Math.max(1, d)).toFixed(1)}%)`;
console.log(`SEED=${SEED ? 1 : 0} seeds ${seeds.join(',')} × ${ticks}`);
for (const c of ['hungry', 'glut', 'fed']) console.log(`${c}: famine ${pct(C[`${c}|famine`], C[`${c}|all`])} · plenty ${pct(C[`${c}|plenty`], C[`${c}|all`])}`);
console.log(`seeds: famine planted ${C['seed|famine|planted'] ?? 0} (no one there ${C['seed|famine|noone'] ?? 0}) · plenty planted ${C['seed|plenty|planted'] ?? 0} (no one ${C['seed|plenty|noone'] ?? 0}) · matching firings by the target ${C['seed|fired'] ?? 0}`);
console.log(`spells: hungry (>= ${FAMINE_SEED_DAY} days) with a famine scene by someone in town ${pct(C['spell|hungry|covered'], C['spell|hungry|n'])} · glut runs with a plenty scene ${pct(C['spell|glut|covered'], C['spell|glut|n'])}`);
