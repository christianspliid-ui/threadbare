// THR-1592 measurement harness: what does each liveness lever cost per tick?
//
// Injects one lever into a freshly initialised world (after `initializeGameState`,
// before tick 1), then runs the real `runTick` loop and records wall-clock ms/tick
// plus the THR-580 phase-profile ring (so a delta can be attributed to a phase).
// Mutates only the in-memory graph of its own run — never src/. One process per
// (arm, seed, rep) so module-level state and JIT warm-up never leak between arms.
//
//   npx tsx Docs/audits/2026-09-25-living-world-data/readers/liveness-cost.ts \
//     --arm baseline|notables1|notables2|ties3x|ties-dense|history|all \
//     --seed 42 --map medium --ticks 200 --rep 1 --out liveness.jsonl
//
// Arms:
//   baseline    — nothing injected
//   notables1/2 — +1/+2 notable-tier mortals per settlement (non-deciders), each
//                 with one ambition (the engine's "want") via assignAmbitionToActor
//                 with skipSpotlightPull, joined to the settlement's controlling
//                 faction when one exists
//   ties3x      — person↔person ties among co-residents raised to 3x the t0 count
//                 (kin / friendship / rivalry relates_to + graduated mentors edges)
//   ties-dense  — ~2 ties per co-resident mortal (the map's "everyone tied" shape)
//   history     — 200 past `event` nodes (founding/war/death/fall, negative ticks)
//                 with occurred_at + participated_in, plus 10 dead notables
//   all         — notables2 + ties3x + history
//   placebo     — one disconnected event node: the trajectory-noise control
import { appendFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import type { MapSizePreset } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime, touchStructure, touchWorld } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { getLocationNodes, resolveToParentLocation } from '../../../../src/engine/sublocationShape';
import { locationClassOf } from '../../../../src/data/world-objects';
import { enableProfiling, getTimingTraces, clearTimingTraces } from '../../../../src/engine/traceBuffer';
import type { TickPhaseProfileTrace, TickProfileTrace } from '../../../../src/types/trace';
import { isAutonomousDecisionActor } from '../../../../src/engine/decisionTier';
import { generateRoleCapabilities, ROLE_WEALTH, DEFAULT_WEALTH } from '../../../../src/engine/npcGraduation';
import { NPC_CONSTANTS, NPC_ROLE_REACH_MAP } from '../../../../src/types/npc';
import type { NpcRole } from '../../../../src/types/npc';
import { DEFAULT_REPUTATION } from '../../../../src/types/disposition';
import { NARRATIVE_ARCHETYPES } from '../../../../src/data/archetype-content';
import { AMBITION_TEMPLATES } from '../../../../src/data/ambition-templates';
import { generateAxiologicalProfile } from '../../../../src/engine/agentGeneration';
import { assignCooperationStrategy } from '../../../../src/engine/disposition';
import { assignInitialAmbitions, assignAmbitionToActor } from '../../../../src/engine/ambitionAssignment';
import { joinFaction } from '../../../../src/engine/factionMembership';
import type { GameState } from '../../../../src/types/gameState';
import type { GraphNode } from '../../../../src/types/graph';
import type { WorldGraph } from '../../../../src/engine/graph';
import type { ReachDomain } from '../../../../src/types/traits';

type P = Record<string, unknown>;
const a = process.argv.slice(2);
const get = (k: string, d: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const arm = get('--arm', 'baseline');
const seed = Number(get('--seed', '42'));
const map = get('--map', 'medium') as MapSizePreset;
const ticks = Number(get('--ticks', '200'));
const rep = Number(get('--rep', '1'));
const out = get('--out', 'liveness.jsonl');

// ─── Lever constants ───────────────────────────────────────────────
const HISTORY_EVENT_COUNT = 200;
const HISTORY_DEAD_NOTABLES = 10;
const HISTORY_SPAN_TICKS = 2000;
const TIES_MULTIPLIER = 3;
const TIES_DENSE_PER_MORTAL = 2;
const NOTABLE_ROLES: NpcRole[] = ['merchant', 'innkeeper', 'elder', 'smith', 'healer', 'steward', 'noble', 'scribe', 'guard_captain', 'broker', 'chaplain', 'mason'] as NpcRole[];

function mulberry32(s0: number): () => number {
  let s = s0 | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(rng: () => number, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];

const isIndiv = (n: GraphNode | undefined) => (n?.properties as P | undefined)?.actorType === 'individual';
const isAlive = (n: GraphNode) => !(n.properties as P).deceased && (n.properties as P).status !== 'dead';

function settlements(g: WorldGraph): GraphNode[] {
  return getLocationNodes(g)
    .filter(n => locationClassOf((n.properties as P).locationSubtype as string) === 'settlement')
    .sort((x, y) => x.id.localeCompare(y.id));
}

/** outer location id -> living individuals resolved there */
function residents(g: WorldGraph): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const e of g.getEdgesByType('located_at')) {
    const src = g.getNode(e.source);
    if (!src || !isIndiv(src) || !isAlive(src)) continue;
    const outer = resolveToParentLocation(g, g.getNode(e.target));
    if (!outer) continue;
    const r = m.get(outer.id) ?? []; r.push(src.id); m.set(outer.id, r);
  }
  for (const r of m.values()) r.sort();
  return m;
}

const TIE_TYPES = new Set(['relates_to', 'hostile_to', 'mentors']);
function countPersonTies(g: WorldGraph): number {
  let n = 0;
  for (const t of TIE_TYPES) for (const e of g.getEdgesByType(t as any)) if (isIndiv(g.getNode(e.source)) && isIndiv(g.getNode(e.target))) n++;
  return n;
}

function cultureOf(g: WorldGraph, locId: string): string | undefined {
  const es = g.getOutgoingEdges(locId, 'belongs_to');
  const cur = es.find(e => (e.properties.cultureLayer as string | undefined) === 'current') ?? es[0];
  return cur?.target;
}
function controllingFaction(g: WorldGraph, locId: string): string | undefined {
  const c = g.getIncomingEdges(locId, 'controls').map(e => g.getNode(e.source)).find(n => (n?.properties as P | undefined)?.actorType === 'faction');
  return c?.id;
}

// ─── Lever 1: notables ─────────────────────────────────────────────
function seedNotables(state: GameState, perSettlement: number, rng: () => number) {
  const g = state.graph;
  let minted = 0, wants = 0, joined = 0;
  for (const loc of settlements(g)) {
    for (let k = 0; k < perSettlement; k++) {
      const id = `thr1592_notable_${loc.id}_${k}`;
      const role = pick(rng, NOTABLE_ROLES);
      const affinity = NPC_ROLE_REACH_MAP[role];
      const profile = generateAxiologicalProfile(rng, state.cosmology);
      const archetype = pick(rng, NARRATIVE_ARCHETYPES);
      const caps = generateRoleCapabilities(rng, affinity, 'notable');
      g.addNode({
        id, type: 'actor', name: `${role} of ${loc.name}`,
        properties: {
          actorType: 'individual', spotlightTier: 'notable', npcRole: role,
          axiologicalProfile: profile, domainCapabilities: caps, locationId: loc.id,
          narrativeArchetype: archetype?.id ?? 'wanderer',
          cooperationStrategy: assignCooperationStrategy(archetype?.id ?? 'wanderer', profile, rng),
          wealth: ROLE_WEALTH[role] ?? DEFAULT_WEALTH, reputationScore: DEFAULT_REPUTATION,
          importance: NPC_CONSTANTS.NOTABLE_THRESHOLD, bornTick: -Math.floor(rng() * 1500) - 200,
          sphereAffinity: null, generatedBy: 'thr1592_harness',
        },
      });
      g.addEdge({ id: `${id}_located_at_${loc.id}`, source: id, target: loc.id, type: 'located_at', properties: {} });
      const cult = cultureOf(g, loc.id);
      if (cult) g.addEdge({ id: `edge_culture_${id}_${cult}`, source: id, target: cult, type: 'belongs_to', properties: { culturalStrength: 1.0 } });
      const fac = controllingFaction(g, loc.id);
      if (fac && joinFaction(g, id, fac, 0).changed) joined++;
      // The local want: one ambition, the engine's representation of a want.
      const assigns = assignInitialAmbitions(AMBITION_TEMPLATES, {
        domainCapabilities: caps as Record<ReachDomain, number>, traits: [], culturalSpheres: [], bonds: [],
      } as any, seed + minted * 7919);
      if (assigns[0]) {
        const r = assignAmbitionToActor(g, id, assigns[0].templateId, 0, { priority: 'primary', mintedByLabel: 'thr1592_harness', skipSpotlightPull: true, extraProperties: { localTargetId: loc.id } });
        if (r.assigned) wants++;
      }
      minted++;
    }
  }
  return { notablesMinted: minted, notableWants: wants, notablesJoinedFaction: joined, settlements: settlements(g).length };
}

// ─── Lever 2: ties ─────────────────────────────────────────────────
function addTie(g: WorldGraph, x: string, y: string, kind: 'kin' | 'friendship' | 'rivalry' | 'mentor', rng: () => number, i: number) {
  if (kind === 'mentor') {
    g.addEdge({ id: `thr1592_mentors_${i}`, source: x, target: y, type: 'mentors', properties: {
      domain: pick(rng, ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star']), progress: 1, phase: 'graduated',
      startedTick: -Math.floor(rng() * 800) - 50, lessonsCompleted: 4, bondQuality: 0.2 + rng() * 0.6 } });
    return;
  }
  const sentiment = kind === 'rivalry' ? -(0.3 + rng() * 0.5) : 0.3 + rng() * 0.6;
  g.addEdge({ id: `thr1592_rel_${i}`, source: x, target: y, type: 'relates_to', properties: {
    sentiment, strength: 0.3 + rng() * 0.5, basis: kind, trust: sentiment * 0.5, createdAt: 0, seededBy: 'thr1592_harness' } });
}
function seedTies(state: GameState, mode: 'x3' | 'dense', rng: () => number) {
  const g = state.graph;
  const before = countPersonTies(g);
  const res = [...residents(g).entries()].filter(([, r]) => r.length >= 2).sort((p, q) => p[0].localeCompare(q[0]));
  const totalMortals = res.reduce((s, [, r]) => s + r.length, 0);
  const target = mode === 'x3' ? before * (TIES_MULTIPLIER - 1) : Math.round(totalMortals * TIES_DENSE_PER_MORTAL / 2);
  const kinds = ['kin', 'kin', 'kin', 'friendship', 'friendship', 'friendship', 'rivalry', 'rivalry', 'mentor', 'mentor'] as const;
  const have = new Set<string>();
  for (const t of TIE_TYPES) for (const e of g.getEdgesByType(t as any)) have.add(`${e.source}|${e.target}`);
  let added = 0, attempts = 0;
  const byKind: Record<string, number> = {};
  // spread across co-resident groups, weighted by group size
  const flat: [string, string[]][] = [];
  for (const [loc, r] of res) for (let i = 0; i < r.length; i++) flat.push([loc, r]);
  while (added < target && attempts < target * 20 && flat.length) {
    attempts++;
    const [, r] = pick(rng, flat);
    const x = pick(rng, r), y = pick(rng, r);
    if (x === y || have.has(`${x}|${y}`) || have.has(`${y}|${x}`)) continue;
    const kind = pick(rng, kinds);
    addTie(g, x, y, kind, rng, added);
    have.add(`${x}|${y}`); byKind[kind] = (byKind[kind] ?? 0) + 1; added++;
  }
  return { personTiesBefore: before, tiesAdded: added, personTiesAfter: countPersonTies(g), tieKinds: byKind, coResidentMortals: totalMortals };
}

// ─── Lever 3: a seeded past ────────────────────────────────────────
function seedHistory(state: GameState, rng: () => number) {
  const g = state.graph;
  const setts = settlements(g);
  const allLocs = getLocationNodes(g).sort((x, y) => x.id.localeCompare(y.id));
  const res = residents(g);
  const dead: string[] = [];
  for (let k = 0; k < HISTORY_DEAD_NOTABLES; k++) {
    const home = pick(rng, setts);
    const id = `thr1592_dead_${k}`;
    const role = pick(rng, NOTABLE_ROLES);
    const diedTick = -Math.floor(rng() * HISTORY_SPAN_TICKS) - 1;
    g.addNode({ id, type: 'actor', name: `the late ${role} of ${home.name}`, properties: {
      actorType: 'individual', spotlightTier: 'notable', npcRole: role, deceased: true, status: 'dead',
      diedTick, bornTick: diedTick - 1200, homeLocationId: home.id, importance: NPC_CONSTANTS.NOTABLE_THRESHOLD,
      axiologicalProfile: generateAxiologicalProfile(rng, state.cosmology), generatedBy: 'thr1592_harness' } });
    const cult = cultureOf(g, home.id);
    if (cult) g.addEdge({ id: `edge_culture_${id}_${cult}`, source: id, target: cult, type: 'belongs_to', properties: { culturalStrength: 1.0 } });
    // a living heir remembers them
    const heir = (res.get(home.id) ?? [])[0];
    if (heir) g.addEdge({ id: `thr1592_heir_${k}`, source: heir, target: id, type: 'relates_to', properties: { sentiment: 0.7, strength: 0.6, basis: 'kin', trust: 0, createdAt: 0 } });
    dead.push(id);
  }
  const kinds = ['founding', 'war', 'death', 'fall', 'founding', 'war'] as const;
  let edges = 0;
  for (let k = 0; k < HISTORY_EVENT_COUNT; k++) {
    const kind = pick(rng, kinds);
    const loc = kind === 'founding' ? pick(rng, setts) : pick(rng, allLocs);
    const tick = -Math.floor(rng() * HISTORY_SPAN_TICKS) - 1;
    const id = `event_history_thr1592_${k}`;
    g.addNode({ id, type: 'event', name: `${kind} at ${loc.name}`, properties: { eventType: 'history', historyKind: kind, tick, locationId: loc.id, seededBy: 'thr1592_harness' } });
    g.addEdge({ id: `occurred_at_${id}`, source: id, target: loc.id, type: 'occurred_at', properties: { tick } }); edges++;
    if (kind === 'death' || rng() < 0.3) {
      const who = pick(rng, dead);
      g.addEdge({ id: `participated_in_${id}_${who}`, source: who, target: id, type: 'participated_in', properties: { role: 'primary', outcome: kind, tick } }); edges++;
    }
    const liv = res.get(loc.id);
    if (liv?.length && rng() < 0.3) {
      const who = pick(rng, liv);
      g.addEdge({ id: `participated_in_${id}_${who}`, source: who, target: id, type: 'participated_in', properties: { role: 'witness', outcome: kind, tick } }); edges++;
    }
  }
  return { historyEvents: HISTORY_EVENT_COUNT, historyEdges: edges, deadNotables: dead.length };
}

// ─── Run ───────────────────────────────────────────────────────────
function censusDeciders(state: GameState) {
  const actors = state.graph.getNodesByType('actor');
  const indiv = actors.filter(n => isIndiv(n) && isAlive(n));
  return {
    actors: actors.length, aliveMortals: indiv.length,
    deciders: indiv.filter(isAutonomousDecisionActor).length,
    notables: indiv.filter(n => (n.properties as P).spotlightTier === 'notable').length,
    nodes: state.graph.getAllNodes().length, edges: state.graph.getAllEdges().length,
    events: state.graph.getNodesByType('event').length,
    personTies: countPersonTies(state.graph),
  };
}

resetEventCounter(); resetReputationTraitInit(); clearTimingTraces();
const runtime = createSimulationRuntime();
const preset = MAP_SIZE_PRESETS[map];
const archetype = generateArchetypes(4, seed)[0];
const logBack = console.log; console.log = () => {};
let { state } = initializeGameState(archetype, 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows);
console.log = logBack;

const rng = mulberry32(seed * 1000003 + 1592);
const lever: Record<string, unknown> = {};
const doN = arm === 'notables1' ? 1 : (arm === 'notables2' || arm === 'all') ? 2 : 0;
// ties first (counts the t0 baseline before notables add residents)
if (arm === 'ties3x' || arm === 'all') Object.assign(lever, seedTies(state, 'x3', rng));
if (arm === 'ties-dense') Object.assign(lever, seedTies(state, 'dense', rng));
if (doN) Object.assign(lever, seedNotables(state, doN, rng));
if (arm === 'history' || arm === 'all') Object.assign(lever, seedHistory(state, rng));
// placebo: one disconnected, unreadable node — measures whether *any* graph write
// perturbs the simulation trajectory (the trajectory-noise control).
if (arm === 'placebo') { state.graph.addNode({ id: 'thr1592_placebo', type: 'event', name: 'placebo', properties: { eventType: 'thr1592_placebo', tick: -1 } }); lever.placeboNodes = 1; }
touchStructure(runtime); touchWorld(runtime);
const atStart = censusDeciders(state);

enableProfiling();
clearTimingTraces();
const tickMs: number[] = [];
const phase = new Map<string, number>();
const phaseSteady = new Map<string, number>();
let evTotal = 0;
const evTypes: Record<string, number> = {};
console.log = () => {};
for (let i = 1; i <= ticks; i++) {
  const s0 = performance.now();
  state = runTick(state, [], runtime);
  tickMs.push(performance.now() - s0);
  evTotal += state.tickEvents?.length ?? 0;
  for (const e of state.tickEvents ?? []) evTypes[e.type] = (evTypes[e.type] ?? 0) + 1;
  for (const t of getTimingTraces()) {
    if (t.category === 'tick_phase_profile') {
      const p = t as TickPhaseProfileTrace; const d = p.durationMs ?? 0;
      phase.set(p.phase, (phase.get(p.phase) ?? 0) + d);
      if (i > 20) phaseSteady.set(p.phase, (phaseSteady.get(p.phase) ?? 0) + d);
    } else if (t.category === 'tick_profile') void (t as TickProfileTrace);
  }
  clearTimingTraces();
}
console.log = logBack;
const avg = (xs: number[]) => xs.length ? +(xs.reduce((x, y) => x + y, 0) / xs.length).toFixed(2) : 0;
const med = (xs: number[]) => { const s = [...xs].sort((p, q) => p - q); return s.length ? +s[Math.floor(s.length / 2)].toFixed(2) : 0; };
const steadyN = Math.max(1, ticks - 20);
const rec = {
  arm, seed, map, ticks, rep, lever, atStart, atEnd: censusDeciders(state), eventsEmitted: evTotal, eventTypes: evTypes,
  ms1_20: avg(tickMs.slice(0, 20)), ms21_150: avg(tickMs.slice(20, 150)), ms21_end: avg(tickMs.slice(20)), msAll: avg(tickMs),
  median21_end: med(tickMs.slice(20)),
  phaseSteadyMsPerTick: Object.fromEntries([...phaseSteady.entries()].sort((p, q) => q[1] - p[1]).map(([k, v]) => [k, +(v / steadyN).toFixed(3)])),
  tickMs: tickMs.map(x => +x.toFixed(1)),
  node: process.version, measuredAt: new Date().toISOString(),
};
appendFileSync(out, JSON.stringify(rec) + '\n');
logBack(JSON.stringify({ arm, seed, rep, lever, atStart: rec.atStart, atEnd: rec.atEnd, ms1_20: rec.ms1_20, ms21_150: rec.ms21_150, ms21_end: rec.ms21_end, median21_end: rec.median21_end }));
