/**
 * THR-1764 prototype — NEVER MERGED (lives on proto/thr-1764-secondary-actors).
 *
 * Secondary-actor Dominion band census. Builds headless worlds per seed (as the
 * THR-1760 proto did), reads at tick 0 and tick N, and bands candidate reads of
 * every SECONDARY actor kind — factions, groups (army / company / network / battle),
 * artifacts, individual mortals — against three god vectors, so the THR-1764 plan
 * can pick which read each kind should answer to. Also sizes how much ground
 * mortal carriers could tend (mortals per place at tick 0).
 *
 *   npx esbuild scripts/proto-secondary-actors-1764.ts --bundle --platform=node --format=esm \
 *     --outfile=.cache/proto-secondary-actors-1764.mjs --external:fs --external:path && \
 *   node .cache/proto-secondary-actors-1764.mjs --seeds 42,99,7 --ticks 240
 *
 * Formula (THR-1760 cut B, w = pair weights):
 *   match(obj) = Σ_s p[s]·(obj[s] − W[s]·obj[opp(s)]) / Σ p
 *   power      = Σ worldGod.sphereAffinity.scores / 3
 *   dominion   = match > 0 ? match·power : match
 *   Hostile < −1.5 ≤ Foreign < 0.5 ≤ Touched < 1.5 ≤ Held < 3.0 ≤ Sovereign
 */
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology, SPHERE_OPPOSITIONS } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { getFactionSphereScores } from '../src/engine/sphereAffinity';
import { resolveToParentLocation, getLocationNodes, isLocationNode, isPlaceNode } from '../src/engine/sublocationShape';
import { getFactionLeaderId } from '../src/engine/factionNetwork';
import { getGroupKind } from '../src/engine/groupShape';
import type { GameState } from '../src/types/gameState';
import type { GraphNode } from '../src/types/graph';
import type { SphereName } from '../src/types/sphereAffinity';

type Scores = Partial<Record<SphereName, number>>;

const W: Record<SphereName, number> = {
  chaos: 1, order: 1, light: 1, darkness: 1,
  life: 0.8, entropy: 0.8, force: 0.6, mind: 0.6,
  energy: 0.4, spirit: 0.4, matter: 0.4, time: 0.4,
};
const CUT = { foreign: -1.5, touched: 0.5, held: 1.5, sovereign: 3 };
const BANDS = ['H', 'F', 'T', 'He', 'S'] as const;
const POWER_BASELINE = 3;
const TIER_RATES = [0.005, 0.01, 0.015, 0.02];
const CLAIM_CAP = 0.03;

function parseArgs() {
  const a = process.argv.slice(2);
  const get = (k: string, d: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
  return {
    seeds: get('--seeds', '42,99,7').split(',').map(Number),
    ticks: Number(get('--ticks', '240')),
    map: get('--map', 'medium') as MapSizePreset,
  };
}

function match(points: Scores, obj: Scores): number {
  let num = 0, den = 0;
  for (const [s, p] of Object.entries(points) as [SphereName, number][]) {
    if (!p) continue;
    num += p * ((obj[s] ?? 0) - W[s] * (obj[SPHERE_OPPOSITIONS[s]] ?? 0));
    den += p;
  }
  return den > 0 ? num / den : 0;
}
const dominion = (m: number, power: number) => (m > 0 ? m * power : m);
function band(d: number): typeof BANDS[number] {
  if (d >= CUT.sovereign) return 'S';
  if (d >= CUT.held) return 'He';
  if (d >= CUT.touched) return 'T';
  if (d >= CUT.foreign) return 'F';
  return 'H';
}

const scoresOf = (n: GraphNode | undefined): Scores =>
  ((n?.properties.sphereAffinity as { scores?: Scores } | undefined)?.scores) ?? {};
const isEmpty = (s: Scores) => !Object.values(s).some(v => (v ?? 0) !== 0);
function meanScores(list: Scores[]): Scores | null {
  if (!list.length) return null;
  const out: Scores = {};
  for (const sc of list) for (const [k, v] of Object.entries(sc) as [SphereName, number][]) out[k] = (out[k] ?? 0) + (v ?? 0) / list.length;
  return out;
}
const isGone = (n: GraphNode) => !!(n.properties.deceased || n.properties.isDead || n.properties.dead);

/** A candidate read: either a score vector to band, or a precomputed dominion value (a3). */
type Read = { scores: Scores; members?: Scores[] } | { dom: number; m: number };

interface Snapshot {
  tick: number;
  godScores: Scores;
  reads: Map<string, Read[]>;
  notes: string[];
  mortalsPerPlace?: number[];
  placeCount?: number;
}

function snapshot(state: GameState, presetsForA3: Record<string, Scores>, power: number): Snapshot {
  const g = state.graph;
  const reads = new Map<string, Read[]>();
  const push = (k: string, r: Read) => { if (!reads.has(k)) reads.set(k, []); reads.get(k)!.push(r); };
  const notes: string[] = [];
  const actors = g.getNodesByType('actor');
  const individuals = actors.filter(n => n.properties.actorType === 'individual' && !isGone(n));
  const factions = actors.filter(n => n.properties.actorType === 'faction');
  const indivById = new Set(individuals.map(n => n.id));
  const factionIds = new Set(factions.map(n => n.id));

  // ── A. Factions ────────────────────────────────────────────────────────
  let noMembers = 0, noLeader = 0, noPlaces = 0, factionPlacesTotal = 0, aggComputed = 0;
  const emptyByType: Record<string, number> = {};
  const factionScoreCache = new Map<string, Scores>();
  for (const f of factions) {
    const fs = getFactionSphereScores(f);
    factionScoreCache.set(f.id, fs);
    push('a1 faction aggregate', { scores: fs });
    const leaderId = getFactionLeaderId(g, f.id);
    if (!leaderId) noLeader++; else push('a2 faction leader', { scores: scoresOf(g.getNode(leaderId)) });
    const members = g.getIncomingEdges(f.id, 'member_of').map(e => g.getNode(e.source))
      .filter((n): n is GraphNode => !!n && indivById.has(n.id));
    if (!members.length) {
      noMembers++;
      const t = String(f.properties.factionType ?? (f.properties.guildType ? 'guild' : 'untyped'));
      emptyByType[t] = (emptyByType[t] ?? 0) + 1;
    }
    if (f.properties.sphereAggregate) aggComputed++;
    else {
      // a3 is per god preset: stash member score vectors; banded per preset below.
      push('a3 members mean-dominion', { scores: {}, members: members.map(scoresOf) } as Read);
    }
    const placeIds = new Set<string>();
    for (const t of ['controls', 'owns', 'holds_place_of_power'] as const) {
      for (const e of g.getOutgoingEdges(f.id, t)) {
        const n = g.getNode(e.target);
        if (n && (isLocationNode(n) || isPlaceNode(n))) placeIds.add(n.id);
      }
    }
    for (const loc of g.getNodesByType('location')) if (loc.properties.controllingFactionId === f.id) placeIds.add(loc.id);
    if (!placeIds.size) noPlaces++;
    else {
      factionPlacesTotal += placeIds.size;
      const m = meanScores([...placeIds].map(id => scoresOf(g.getNode(id))));
      if (m) push('a4 faction held places', { scores: m });
    }
  }
  notes.push(`factions=${factions.length} zeroMembers=${noMembers} noLeader=${noLeader} noHeldPlaces=${noPlaces} heldPlacesTotal=${factionPlacesTotal} sphereAggregateComputed=${aggComputed}`);
  notes.push(`zeroMemberFactionsByType=${JSON.stringify(emptyByType)}`);

  // ── B. Groups ──────────────────────────────────────────────────────────
  const groups = actors.filter(n => n.properties.actorType === 'group');
  const kindCount: Record<string, number> = {};
  for (const grp of groups) {
    const kind = getGroupKind(grp) ?? 'untagged';
    kindCount[kind] = (kindCount[kind] ?? 0) + 1;
    const members = g.getIncomingEdges(grp.id, 'member_of').map(e => g.getNode(e.source))
      .filter((n): n is GraphNode => !!n && indivById.has(n.id));
    const commanderId = g.getOutgoingEdges(grp.id, 'commanded_by')[0]?.target;
    const commander = commanderId ? g.getNode(commanderId) : undefined;
    const memberScores = [...members, ...(commander && !members.some(m => m.id === commander.id) ? [commander] : [])].map(scoresOf);
    const mm = meanScores(memberScores);
    if (mm) push(`b1 ${kind} members mean`, { scores: mm });
    let factionId = g.getOutgoingEdges(grp.id, 'member_of').map(e => e.target).find(id => factionIds.has(id));
    if (!factionId && commander) factionId = g.getOutgoingEdges(commander.id, 'member_of').map(e => e.target).find(id => factionIds.has(id));
    if (factionId) push(`b2 ${kind} owning faction`, { scores: factionScoreCache.get(factionId)! });
    const locId = g.getOutgoingEdges(grp.id, 'located_at')[0]?.target;
    const loc = locId ? g.getNode(locId) : undefined;
    if (loc) push(`b3 ${kind} standing place`, { scores: scoresOf(loc) });
  }
  notes.push(`groups=${groups.length} byKind=${JSON.stringify(kindCount)}`);

  // ── C. Artifacts ───────────────────────────────────────────────────────
  const artifacts = [...g.getNodesByType('artifact'), ...g.getNodesByType('artifact_legendary')];
  let imbued = 0, borne = 0;
  for (const a of artifacts) {
    const sc = scoresOf(a);
    if (!isEmpty(sc)) imbued++;
    push('c1 artifact own (unimbued=0)', { scores: sc });
    const bearerEdge = [...g.getIncomingEdges(a.id, 'possesses'), ...g.getIncomingEdges(a.id, 'bonded_to')][0];
    const bearer = bearerEdge ? g.getNode(bearerEdge.source) : undefined;
    if (bearer) { borne++; push('c2 artifact bearer', { scores: bearer.properties.actorType === 'faction' ? factionScoreCache.get(bearer.id) ?? {} : scoresOf(bearer) }); }
  }
  notes.push(`artifacts=${artifacts.length} (common=${g.getNodesByType('artifact').length} legendary=${g.getNodesByType('artifact_legendary').length}) nonEmptyScores=${imbued} withBearer=${borne}`);

  // ── D. Mortals ─────────────────────────────────────────────────────────
  const threadEdges = g.getEdgesByType('thread');
  notes.push(`threadEdges=${threadEdges.length}`);
  const leaderIds = new Set(factions.map(f => getFactionLeaderId(g, f.id)).filter((x): x is string => !!x));
  const threaded = new Set(threadEdges.map(e => e.target));
  let indivEmpty = 0;
  for (const n of individuals) {
    const sc = scoresOf(n);
    if (isEmpty(sc)) indivEmpty++;
    push('d all individual mortals', { scores: sc });
    if (leaderIds.has(n.id)) push('d mortals who lead a faction', { scores: sc });
    if (threaded.has(n.id)) push('d threaded mortals', { scores: sc });
  }
  const vals = individuals.flatMap(n => Object.values(scoresOf(n)).filter((v): v is number => (v ?? 0) > 0));
  const hist: Record<number, number> = {};
  for (const v of vals) hist[v] = (hist[v] ?? 0) + 1;
  notes.push(`livingIndividuals=${individuals.length} emptyScores=${indivEmpty} factionLeaders=${leaderIds.size} nonzeroSphereValueHist=${JSON.stringify(hist)}`);

  // ── Effect sizing: mortals per place-tier location ─────────────────────
  const perPlace = new Map<string, number>();
  let unresolved = 0;
  for (const n of individuals) {
    const locId = g.getOutgoingEdges(n.id, 'located_at')[0]?.target;
    const loc = resolveToParentLocation(g, locId ? g.getNode(locId) : undefined);
    if (!loc || loc.type !== 'location') { unresolved++; continue; }
    perPlace.set(loc.id, (perPlace.get(loc.id) ?? 0) + 1);
  }
  notes.push(`mortalsUnresolvedToPlace=${unresolved}`);

  void presetsForA3; void power;
  return { tick: state.tick, godScores: {}, reads, notes, mortalsPerPlace: [...perPlace.values()], placeCount: getLocationNodes(g).length };
}

function q(xs: number[], p: number) { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; }

const args = parseArgs();
for (const seed of args.seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[args.map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'SecondaryProto', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const god0 = state.graph.getNode(state.ascendantId);
  const align = god0?.properties.sphereAlignment as { primary?: SphereName; secondary?: SphereName } | undefined;
  const presets: Record<string, Scores> = {
    [`world ${align?.primary}3/${align?.secondary}2`]: align?.primary ? { [align.primary]: 3, [align.secondary!]: 2 } : {},
    'showcase mind3/spirit2': { mind: 3, spirit: 2 },
    'stone force3/matter2': { force: 3, matter: 2 },
  };

  const snaps: Snapshot[] = [];
  const take = () => {
    const god = state.graph.getNode(state.ascendantId);
    const gs = { ...scoresOf(god) };
    const s = snapshot(state, presets, 0);
    s.godScores = gs;
    snaps.push(s);
  };
  take();
  for (let i = 0; i < args.ticks; i++) state = runTick(state, [], runtime);
  take();

  console.log(`\n## seed ${seed} (${args.map}) — world god ${align?.primary}/${align?.secondary}`);
  for (const sn of snaps) {
    const power = Object.values(sn.godScores).reduce((a, b) => a + (b ?? 0), 0) / POWER_BASELINE || 1;
    console.log(`\n### t${sn.tick}  power=${power.toFixed(2)}`);
    for (const n of sn.notes) console.log(`  note: ${n}`);
    for (const [pname, points] of Object.entries(presets)) {
      console.log(`  -- god ${pname}            n   H   F   T  He   S  maxMatch`);
      for (const [kind, rs] of [...sn.reads.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const c: Record<string, number> = Object.fromEntries(BANDS.map(b => [b, 0]));
        let maxM = -Infinity;
        for (const r of rs) {
          let m: number, d: number;
          const members = (r as unknown as { members?: Scores[] }).members;
          if (members) {
            const doms = members.map(s => dominion(match(points, s), power));
            const ms = members.map(s => match(points, s));
            d = doms.reduce((a, b) => a + b, 0) / doms.length;
            m = ms.reduce((a, b) => a + b, 0) / ms.length;
          } else if ('scores' in r) {
            m = match(points, r.scores); d = dominion(m, power);
          } else { m = r.m; d = r.dom; }
          c[band(d)]++;
          if (m > maxM) maxM = m;
        }
        console.log(`     ${kind.padEnd(34)} ${String(rs.length).padStart(4)} ${BANDS.map(b => String(c[b]).padStart(3)).join(' ')}  ${maxM.toFixed(2)}`);
      }
    }
    if (sn.tick === 0 && sn.mortalsPerPlace) {
      const mp = sn.mortalsPerPlace;
      console.log(`\n  effect sizing t0: placeTierLocations=${sn.placeCount} placesWith>=1Mortal=${mp.length} mortalsPlaced=${mp.reduce((a, b) => a + b, 0)} perPlace p50=${q(mp, 0.5)} p90=${q(mp, 0.9)} max=${Math.max(0, ...mp)}`);
      for (const r of TIER_RATES) {
        const capped = mp.filter(k => k * r >= CLAIM_CAP).length;
        const flow = mp.reduce((a, k) => a + Math.min(k * r, CLAIM_CAP), 0);
        console.log(`    rate ${r}: if ALL placed mortals carried — places at cap=${capped}/${mp.length}, world flow/tick=${flow.toFixed(3)} (one carrier = ${r}, ticks to tend 0.03 = ${(CLAIM_CAP / r).toFixed(1)})`);
      }
    }
  }
}
