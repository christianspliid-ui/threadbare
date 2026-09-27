// THR-1633 — why deciders never join a guild.
//
// Samples every decider (spotlight individual) every SAMPLE_EVERY ticks and records, per
// sample: does its current Location contain a faction hall at all; how many halls; is the
// FIRST hall (the only one `generateFactionLifecycleCandidates` reads) a guild it is not
// yet a member of; does it pass that guild's `joinPrerequisites` (reach share); and would
// it pass for ANY hall at the Location. Plus every `.join` firing and every decider guild
// membership at the end.
//
// Run (repo root):
//   npx esbuild Docs/audits/2026-09-25-living-world-data/readers/guild-join.ts --bundle --platform=node --format=esm --outfile=.cache/guild-join.mjs --external:fs --external:path && node .cache/guild-join.mjs 42,99 200
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { getFactionDefinition } from '../../../../src/data/faction-definition-lookup';
import { getFactionMembershipEdges, getAgentLocation } from '../../../../src/engine/graphQueries';
import { isAutonomousDecisionActor } from '../../../../src/engine/strategicKindReachability';
import { resolveToParentLocation } from '../../../../src/engine/sublocationShape';
import { meetsJoinPrerequisites, runFilterPipeline } from '../../../../src/engine/encounterFilterPipeline';
import { generateFactionLifecycleCandidates } from '../../../../src/engine/factionQuestGeneration';
import { enableTracing, getTraces, clearTraces } from '../../../../src/engine/traceBuffer';

const seeds = (process.argv[2] ?? '42,99').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 200);
const SAMPLE_EVERY = 10;
const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };

const out: any = { seeds, ticks: TICKS, every: SAMPLE_EVERY, perSeed: {} };
for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit(); clearTraces(); enableTracing();
  const runtime: any = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Reach', createBalancedCosmology(), seed, preset.cols, preset.rows) as any;
  const tally: Record<string, number> = {};
  const hallsPerLoc: Record<string, number> = {};
  const joinFired: Record<string, number> = {};
  const seenUA = new Set<string>();
  const boardJoin: any[] = [];
  for (let t = 0; t <= TICKS; t++) {
    if (t > 0) state = runTick(state, [], runtime);
    const g = state.graph;
    for (const tr of getTraces() as any[]) {
      if (tr.category !== 'engagement_decision') continue;
      for (const c of (tr.candidates ?? []) as any[]) {
        if (typeof c.id === 'string' && c.id.endsWith('.join')) { inc(tally, `board_top:join:zone=${c.zone}`); if (tr.chosenId === c.id) inc(tally, 'board_top:join:chosen'); boardJoin.push({ f: +Number(c.forecast).toFixed(2), fit: +Number(c.fit).toFixed(2), zone: c.zone, chosen: tr.chosenId }); }
      }
      inc(tally, 'engagement_traces');
    }
    clearTraces();
    for (const ua of (state.unifiedActions ?? []) as any[]) {
      if (seenUA.has(ua.id)) continue; seenUA.add(ua.id);
      if (typeof ua.templateId === 'string' && ua.templateId.endsWith('.join')) {
        const actor = g.getNode(ua.actorId);
        inc(joinFired, `${ua.templateId}|${actor && isAutonomousDecisionActor(actor) ? 'decider' : 'other'}`);
      }
    }
    if (t % SAMPLE_EVERY !== 0) continue;
    const deciders = g.getNodesByType('actor').filter((n: any) => isAutonomousDecisionActor(n));
    for (const d of deciders) {
      inc(tally, 'samples');
      const locNode: any = getAgentLocation(g, d.id);
      const locRaw: string | undefined = typeof locNode === 'string' ? locNode : locNode?.id;
      if (!locRaw) { inc(tally, 'no_location'); continue; }
      const parent: any = resolveToParentLocation(g, locRaw);
      const loc: string = (typeof parent === 'string' ? parent : parent?.id) ?? locRaw;
      const halls = g.getOutgoingEdges(loc, 'contains').map((e: any) => g.getNode(e.target)).filter((n: any) => n && (
        n.properties?.sublocationTypeId === 'sublocation-type.faction-hall' || n.properties?.locationSubtype === 'guild-hall'));
      inc(hallsPerLoc, String(halls.length));
      if (halls.length === 0) { inc(tally, 'no_hall_here'); continue; }
      inc(tally, 'at_hall_location');
      const direct = g.getOutgoingEdges(locRaw, 'contains').some((e: any) => { const n: any = g.getNode(e.target); return n && (n.properties?.sublocationTypeId === 'sublocation-type.faction-hall' || n.properties?.locationSubtype === 'guild-hall'); });
      inc(tally, direct ? 'stands_on_settlement' : 'stands_inside_a_place');
      const life = generateFactionLifecycleCandidates(g, d.id, locRaw).filter((e: any) => String(e.templateId).endsWith('.join'));
      if (life.length) { inc(tally, 'join_generated'); const fr: any = runFilterPipeline(life, d.id, locRaw, g, t); inc(tally, fr.candidates.length ? 'join_survives_filters_alone' : 'join_filtered_alone'); }
      const memberDefs = new Set(getFactionMembershipEdges(g, d.id).map((e: any) => e.properties?.factionDefId));
      const evalHall = (h: any) => {
        const defId = h.properties?.factionDefId as string | undefined;
        const def = defId ? getFactionDefinition(defId) : undefined;
        if (!def) return 'no_def';
        if (memberDefs.has(defId)) return 'already_member';
        if (def.joinPrerequisites && !meetsJoinPrerequisites(g, d.id, def.joinPrerequisites)) return 'fails_prereq';
        return 'offerable';
      };
      const first = evalHall(halls[0]);
      inc(tally, `first_hall:${first}`);
      const any = halls.map(evalHall);
      if (any.includes('offerable')) inc(tally, 'any_hall_offerable');
      if (first !== 'offerable' && any.includes('offerable')) inc(tally, 'offerable_only_past_first_hall');
    }
  }
  const g = state.graph;
  const deciderGuild: Record<string, number> = {};
  for (const d of g.getNodesByType('actor').filter((n: any) => isAutonomousDecisionActor(n))) {
    for (const e of getFactionMembershipEdges(g, d.id) as any[]) {
      const defId = e.properties?.factionDefId ?? '?';
      if (!String(defId).startsWith('realm')) inc(deciderGuild, defId);
    }
  }
  out.perSeed[seed] = { boardJoinSample: boardJoin.slice(0, 12), tally, hallsPerLoc, joinFired, deciderGuildMembershipsAtEnd: deciderGuild };
  console.error(`[guild-join] seed ${seed} done`);
}
console.log(JSON.stringify(out, null, 2));
