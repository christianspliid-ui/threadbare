// THR-2081 census (design lane, never merged): where does an unattended world's Mandate growth come from?
// Splits the primary/secondary sphere totals' growth into new entities, removed entities, and score changes on
// existing entities attributed to the pressure writer that the sphere_pressure trace names.
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY, initializeGameState } from '../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../src/engine/orchestrator';
import { unattended } from '../src/engine/playerStepHold';
import { deriveCosmologyFromIdentity } from '../src/engine/remembrance';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { ENTITY_AGGREGATE_WEIGHT } from '../src/engine/phaseSphereAggregation';
import { getNodeSphereAffinity } from '../src/engine/sphereAffinity';
import { enableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';

const ticks = Number(process.argv[2] ?? '600');
const only = process.argv[3];

function weightOf(node: any): number | null {
  if (node.type === 'location') return ENTITY_AGGREGATE_WEIGHT.location;
  if (node.type === 'artifact') return ENTITY_AGGREGATE_WEIGHT.artifact;
  if (node.type === 'actor') {
    const t = node.properties?.actorType;
    if (t === 'individual' || t === 'ascendant' || t === 'god') return ENTITY_AGGREGATE_WEIGHT.agent;
    if (t === 'faction') return ENTITY_AGGREGATE_WEIGHT.faction;
    if (t === 'culture') return ENTITY_AGGREGATE_WEIGHT.culture;
  }
  return null;
}

function snapshot(graph: any, spheres: string[]): Map<string, { w: number; s: Record<string, number>; all: number; kind: string }> {
  const m = new Map();
  for (const type of ['location', 'actor', 'artifact']) {
    for (const node of graph.getNodesByType(type)) {
      const w = weightOf(node); if (w == null) continue;
      const a: any = getNodeSphereAffinity(node);
      if (!a || typeof a !== 'object' || !a.scores) continue;
      const s: Record<string, number> = {};
      for (const sp of spheres) s[sp] = (a.scores[sp] ?? 0) * w;
      let all = 0; for (const v of Object.values(a.scores)) all += (v as number) * w;
      const kind = node.type === 'actor' ? `actor:${node.properties?.actorType}` : node.type;
      m.set(node.id, { w, s, all, kind });
    }
  }
  return m;
}

function run(label: string, mk: () => any) {
  resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
  enableTracing();
  const rt = createSimulationRuntime(); let state = mk();
  for (let i = 0; i < 2; i++) state = unattended(runTick(state, [], rt));
  const d = state.mandateDefinition; const P = d.primarySphere; const S = d.secondarySphere;
  let prev = snapshot(state.graph, [P, S]);
  const base = { P: 0, S: 0, all: 0, n: prev.size };
  for (const v of prev.values()) { base.P += v.s[P]; base.S += v.s[S]; base.all += v.all; }
  const buckets: Record<string, Record<string, number>> = { [P]: {}, [S]: {} };
  const add = (sp: string, k: string, v: number) => { buckets[sp][k] = (buckets[sp][k] ?? 0) + v; };
  console.log(`\n## ${label} mandate="${d.name}" P=${P} S=${S} targets=${d.primaryTargetDelta}/${d.secondaryTargetDelta} base P=${base.P.toFixed(1)} S=${base.S.toFixed(1)} all=${base.all.toFixed(1)} entities=${base.n}`);
  const checkpoints = new Set([100, 200, 300, 450, 600]);
  for (let i = 2; i < ticks; i++) {
    clearTraces();
    state = unattended(runTick(state, [], rt));
    const cur = snapshot(state.graph, [P, S]);
    // traced writes this tick: entity|sphere → sources
    const traced = new Map<string, Record<string, number>>();
    for (const t of getTraces() as any[]) {
      if (t.category !== 'sphere_pressure' || (t.sphere !== P && t.sphere !== S)) continue;
      const key = `${t.entityId}|${t.sphere}`;
      const r = traced.get(key) ?? {}; r[t.source] = (r[t.source] ?? 0) + 1; traced.set(key, r);
    }
    for (const sp of [P, S]) {
      for (const [id, v] of cur) {
        const p = prev.get(id);
        if (!p) { add(sp, `new ${v.kind}`, v.s[sp]); continue; }
        const delta = v.s[sp] - p.s[sp]; if (delta === 0) continue;
        const srcs = traced.get(`${id}|${sp}`);
        if (!srcs) { add(sp, `untraced ${v.kind}`, delta); continue; }
        const tot = Object.values(srcs).reduce((a, b) => a + b, 0);
        for (const [src, c] of Object.entries(srcs)) add(sp, `pressure:${src}`, delta * c / tot);
      }
      for (const [id, p] of prev) if (!cur.has(id)) add(sp, `removed ${p.kind}`, -p.s[sp]);
    }
    prev = cur;
    if (checkpoints.has(state.tick) || state.phase !== 'playing') {
      let cP = 0, cS = 0, cAll = 0; for (const v of cur.values()) { cP += v.s[P]; cS += v.s[S]; cAll += v.all; }
      const shareP = (cP / cAll) / (base.P / base.all) - 1;
      const shareS = (cS / cAll) / (base.S / base.all) - 1;
      console.log(`${label} t${state.tick} progress=${(state.mandateState?.progress ?? 0).toFixed(3)} doom=${(state.doomClock.progress ?? 0).toFixed(3)} entities=${cur.size} ` +
        `dP=${((cP - base.P) / base.P).toFixed(3)} dS=${((cS - base.S) / base.S).toFixed(3)} dAll=${((cAll - base.all) / base.all).toFixed(3)} shareP=${shareP.toFixed(3)} shareS=${shareS.toFixed(3)}`);
    }
    if (state.phase !== 'playing') { console.log(`${label} LEFT PLAYING t${state.tick}`); break; }
  }
  for (const sp of [P, S]) {
    const b0 = sp === P ? base.P : base.S;
    const rows = Object.entries(buckets[sp]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    console.log(`${label} ${sp === P ? 'primary' : 'secondary'} ${sp} growth by cause (share of baseline):`);
    for (const [k, v] of rows) if (Math.abs(v / b0) >= 0.001) console.log(`   ${k.padEnd(34)} ${(v / b0 >= 0 ? '+' : '')}${(v / b0).toFixed(4)}`);
  }
}

const c = deriveCosmologyFromIdentity({ sphereAlignment: DEV_ASCENDANT_IDENTITY.sphereAlignment, mortalTags: DEV_ASCENDANT_IDENTITY.mortalTags, hungerId: DEV_ASCENDANT_IDENTITY.hungerId });
if (!only || only === 'seeded') run('seeded42', () => { const s = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, c, 'medium', 'breach').state; devSeedTheFirst(s); return s; });
for (const seed of [42, 99, 7]) if (!only || only === `cli${seed}`) run(`cli${seed}`, () => { const cc = createBalancedCosmology(); return initializeGameState(generateArchetypes(4, seed)[0], 'T', cc, seed, 32, 24).state; });
