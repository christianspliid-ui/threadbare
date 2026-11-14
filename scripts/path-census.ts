// Path census — does The First's chosen path steer what she takes and weighs? (THR-2214)
// Promoted from proto/thr-2200-path-census (its FPP env lever was a prototype hack and is gone:
// the pull is FIRST_PATH_PULL). An offline product measure: no gate, no CI job.
//
// Builds the seeded route headless (`?view=game&seeded&size=medium`), writes the chosen path
// (`meetingChoiceRecord.sparkVisionId`) onto The First's thread, runs hands-off (every held step
// released, no card played) and records:
//   - every chapter The First opens, and whether the path pulls it (`firstPathPullFor > 1`);
//   - every Crossroads snapshot ("Next, X weighs"), and whether it holds a road that fits.
//
// Usage (repo root):
//   npm run census:path -- --all [--ticks 400] [--out-dir .cache/path-census]
//        PATH_SEEDS × PATH_VISIONS runs, at most PATH_MAX_PARALLEL at once, then the verdict.
//        Exits 1 when a THR-2214 predicate misses or a run is missing. A run takes about 3 minutes,
//        so add --seeds 42 to run one seed's four paths inside a 10-minute command, then --compare.
//   npm run census:path -- --compare [--out-dir .cache/path-census]
//        the verdict over the runs already written.
//   npm run census:path -- --seed 42 --vision vision.heart.unifier [--ticks 400] [--out f.json]
//        one run, prints its summary.
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import {
  initializeGameStateFromIdentity, devSeedTheFirst, devSeedAscendantTestPackage, DEV_ASCENDANT_IDENTITY,
} from '../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../src/engine/orchestrator';
import { deriveCosmologyFromIdentity } from '../src/engine/remembrance';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { DEV_SHOWCASE_DOOM_ARCHETYPE } from '../src/engine/doomArchetypeSelection';
import { offerArrivalSpineBeat } from '../src/engine/ascendantBeat';
import { unattended } from '../src/engine/playerStepHold';
import { getUnifiedTemplateById } from '../src/data/unified-action-templates';
import { getAnyEncounterById } from '../src/data/encounter-content';
import { getFirstId } from '../src/engine/meetingEncounter';
import { firstPathFromRecord, firstPathPullFor } from '../src/engine/firstPath';
import { isEncounterAction } from '../src/engine/chapterArchive';
import { isRoutineTemplate, storyBreathRemaining } from '../src/engine/attentionCadence';
import { readCrossroadsSnapshot } from '../src/engine/crossroads';
import { enableTracing, getTracesForAgent } from '../src/engine/traceBuffer';

/* eslint-disable @typescript-eslint/no-explicit-any */

const PATH_SEEDS = [42, 7, 13];
/** unifier, blade, warlord, prophet — the four paths THR-2214 names. */
const PATH_VISIONS = ['vision.heart.unifier', 'vision.shadow.assassin', 'vision.iron.warlord', 'vision.star.prophet'];
const PATH_MAX_PARALLEL = 12;
const PATH_DEFAULT_TICKS = 400;
// THR-2214 predicates.
const MIN_POOLED_FIT = 0.6;
const MIN_PATH_FIT = 0.4;
const MAX_PATH_FIT = 0.9;
const MIN_SNAPSHOTS_WITH_FIT = 0.7;

const argv = process.argv.slice(2);
const has = (k: string) => argv.includes(k);
const arg = (k: string, d: string) => { const i = argv.indexOf(k); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const SEED = Number(arg('--seed', '42'));
const VISION = arg('--vision', PATH_VISIONS[0]);
const TICKS = Number(arg('--ticks', String(PATH_DEFAULT_TICKS)));
const OUT = arg('--out', '');
const OUT_DIR = arg('--out-dir', '.cache/path-census');
const SEEDS = has('--seeds') ? arg('--seeds', '').split(',').map(Number).filter(Number.isFinite) : PATH_SEEDS;

interface RunSummary {
  seed: number;
  vision: string;
  path: string;
  ranTo: number;
  chapters: number;
  chaptersFit: number;
  snapshots: number;
  snapshotsWithFit: number;
  snapshotsFlagged: number;
  /** Snapshots taken outside her story breath (inside it only chores reach the board). */
  snapshotsOutsideBreath: number;
  snapshotsOutsideBreathWithFit: number;
  roadsTaken: number;
  roadsNoDestination: number;
}

function runOne(): RunSummary {
  resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
  const runtime = createSimulationRuntime();
  const identity = DEV_ASCENDANT_IDENTITY;
  const cosmology = deriveCosmologyFromIdentity({ sphereAlignment: identity.sphereAlignment, mortalTags: identity.mortalTags, hungerId: identity.hungerId });
  let state: any = initializeGameStateFromIdentity(identity, SEED, cosmology, 'medium', DEV_SHOWCASE_DOOM_ARCHETYPE).state;
  devSeedTheFirst(state);
  devSeedAscendantTestPackage(state);
  const arrival = offerArrivalSpineBeat(state);
  if (arrival.ascendantBeats) state = { ...state, ...arrival };

  const thread = state.graph.getEdgesByType('thread').find((e: any) => e.properties?.courtPosition === 'the_first');
  const rec = { ...(thread.properties.meetingChoiceRecord ?? {}), sparkVisionId: VISION };
  state.graph.updateEdge(thread.id, { properties: { meetingChoiceRecord: rec } });
  const firstPath = firstPathFromRecord(rec as any);
  if (!firstPath) throw new Error(`unknown vision ${VISION}`);
  const firstId: string = getFirstId(state.graph, state.ascendantId)!;

  const fits = (templateId: string, reach?: string): boolean => {
    const t: any = getAnyEncounterById(templateId) ?? getUnifiedTemplateById(templateId);
    return firstPathPullFor(firstPath, (reach ?? t?.reach ?? t?.reachPrimary) as any, (t?.motivations ?? []) as any) > 1;
  };

  enableTracing();
  const seen = new Set<string>();
  let chapters = 0, chaptersFit = 0, snapshots = 0, snapshotsWithFit = 0, snapshotsFlagged = 0, roadsTaken = 0, roadsNoDestination = 0;
  let snapshotsOutsideBreath = 0, snapshotsOutsideBreathWithFit = 0;
  const roadChecks = new Set<number>();
  let lastSnapTick = -1;
  for (let i = 0; i < TICKS; i++) {
    state = runTick(state, [], runtime);
    state = unattended(state);
    for (const a of state.unifiedActions ?? []) {
      if (a.actorId !== firstId || seen.has(a.actionId)) continue;
      seen.add(a.actionId);
      if (!isEncounterAction(a.templateId) || isRoutineTemplate(a.templateId)) continue;
      chapters++;
      if (fits(a.templateId)) chaptersFit++;
    }
    for (const t of getTracesForAgent(firstId) as any[]) {
      if (t.category !== 'first_path_road' || roadChecks.has(t.tick)) continue;
      roadChecks.add(t.tick);
      if (t.outcome === 'set_out') roadsTaken++;
      else roadsNoDestination++;
    }
    const snap = readCrossroadsSnapshot(state.graph.getNode(firstId)?.properties?.crossroads);
    if (snap && snap.tick !== lastSnapTick) {
      lastSnapTick = snap.tick;
      snapshots++;
      const hasFit = snap.options.some(o => o.family === 'encounter' && fits(o.templateId, o.reach));
      if (hasFit) snapshotsWithFit++;
      if (storyBreathRemaining(state.graph, firstId, snap.tick) <= 0) {
        snapshotsOutsideBreath++;
        if (hasFit) snapshotsOutsideBreathWithFit++;
      }
      if (snap.options.some(o => o.fitsPath)) snapshotsFlagged++;
    }
    if (state.phase && state.phase !== 'playing') break;
  }
  return {
    seed: SEED, vision: VISION, path: firstPath.title, ranTo: state.tick,
    chapters, chaptersFit, snapshots, snapshotsWithFit, snapshotsFlagged, snapshotsOutsideBreath, snapshotsOutsideBreathWithFit, roadsTaken, roadsNoDestination,
  };
}

const pct = (n: number, d: number) => (d ? n / d : 0);
const fmt = (x: number) => `${Math.round(100 * x)}%`;

/** The THR-2214 verdict over every run. Pure. */
export function pathVerdict(runs: readonly RunSummary[]): { lines: string[]; pass: boolean } {
  const lines: string[] = [];
  let pass = true;
  const pooledChapters = runs.reduce((s, r) => s + r.chapters, 0);
  const pooledFit = runs.reduce((s, r) => s + r.chaptersFit, 0);
  const pooled = pct(pooledFit, pooledChapters);
  const okPooled = pooled >= MIN_POOLED_FIT;
  pass &&= okPooled;
  lines.push(`${okPooled ? 'PASS' : 'FAIL'} pooled fit ${pooledFit}/${pooledChapters} = ${fmt(pooled)} (>= ${fmt(MIN_POOLED_FIT)})`);
  for (const vision of PATH_VISIONS) {
    const rs = runs.filter(r => r.vision === vision);
    if (rs.length === 0) continue;
    const c = rs.reduce((s, r) => s + r.chapters, 0);
    const f = rs.reduce((s, r) => s + r.chaptersFit, 0);
    const p = pct(f, c);
    const ok = p >= MIN_PATH_FIT && p <= MAX_PATH_FIT;
    pass &&= ok;
    lines.push(`${ok ? 'PASS' : 'FAIL'} ${rs[0].path}: ${f}/${c} = ${fmt(p)} (${fmt(MIN_PATH_FIT)}..${fmt(MAX_PATH_FIT)}); roads taken ${rs.reduce((s, r) => s + r.roadsTaken, 0)}`);
  }
  const snaps = runs.reduce((s, r) => s + r.snapshots, 0);
  const withFit = runs.reduce((s, r) => s + r.snapshotsWithFit, 0);
  const flagged = runs.reduce((s, r) => s + r.snapshotsFlagged, 0);
  const sp = pct(withFit, snaps);
  const okSnaps = sp >= MIN_SNAPSHOTS_WITH_FIT;
  pass &&= okSnaps;
  const ob = runs.reduce((s, r) => s + (r.snapshotsOutsideBreath ?? 0), 0);
  const obFit = runs.reduce((s, r) => s + (r.snapshotsOutsideBreathWithFit ?? 0), 0);
  lines.push(`INFO outside the story breath: ${obFit}/${ob} = ${fmt(pct(obFit, ob))} hold a fitting road (inside it only chores reach the board)`);
  lines.push(`${okSnaps ? 'PASS' : 'FAIL'} snapshots holding a fitting road ${withFit}/${snaps} = ${fmt(sp)} (>= ${fmt(MIN_SNAPSHOTS_WITH_FIT)}); flagged fitsPath ${flagged}`);
  return { lines, pass };
}

async function runAll(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const self = process.argv[1];
  const jobs = SEEDS.flatMap(seed => PATH_VISIONS.map(vision => ({ seed, vision })));
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const { seed, vision } = jobs[next++];
      const out = runFile(seed, vision);
      await new Promise<void>((resolve) => {
        const child = spawn(process.execPath, [self, '--seed', String(seed), '--vision', vision, '--ticks', String(TICKS), '--out', out], { stdio: ['ignore', 'ignore', 'inherit'] });
        child.on('exit', () => resolve());
      });
      console.log(`  done seed ${seed} ${vision}`);
    }
  };
  await Promise.all(Array.from({ length: PATH_MAX_PARALLEL }, worker));
  compare();
}

const runFile = (seed: number, vision: string) => path.join(OUT_DIR, `path-${seed}-${vision}.json`);

/** The verdict over the runs written to OUT_DIR for PATH_SEEDS × PATH_VISIONS; a missing run fails it. */
function compare(): void {
  const files = PATH_SEEDS.flatMap(seed => PATH_VISIONS.map(vision => runFile(seed, vision)));
  const runs: RunSummary[] = [];
  for (const f of files) {
    try { runs.push(JSON.parse(fs.readFileSync(f, 'utf8'))); } catch { console.log(`  missing ${f}`); }
  }
  for (const r of runs) {
    console.log(`  ${r.seed} ${r.path}: chapters ${r.chaptersFit}/${r.chapters}, snapshots ${r.snapshotsWithFit}/${r.snapshots} (outside breath ${r.snapshotsOutsideBreathWithFit}/${r.snapshotsOutsideBreath}), roads ${r.roadsTaken} (+${r.roadsNoDestination} no destination), ran to ${r.ranTo}`);
  }
  const verdict = pathVerdict(runs);
  for (const l of verdict.lines) console.log(l);
  process.exit(verdict.pass && runs.length === files.length ? 0 : 1);
}

if (has('--compare')) {
  compare();
} else if (has('--all')) {
  void runAll();
} else {
  const summary = runOne();
  console.log(JSON.stringify(summary));
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(summary));
}
