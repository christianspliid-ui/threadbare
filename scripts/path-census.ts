// Path census — does The First's chosen path steer what she weighs and takes? (design-lane prototype, never merged)
//
// Builds the seeded route headless (as proto/thr-2205-agency-census), writes the chosen path
// (`meetingChoiceRecord.sparkVisionId`) onto The First's thread, then runs hands-off (every held step
// released, no card played) and records:
//   - every chapter The First opens: its Reach, motivations, whether the path pulls it, whether it is in
//     the path's Reaches at all, whether it carries the role lean;
//   - every Crossroads snapshot ("Next, X weighs"): the same flags on each of the three roads.
// The pull strength is the env lever FPP (FIRST_PATH_PULL, proto-only).
//
// Usage: npx esbuild scripts/path-census.ts --bundle --platform=node --format=esm --outfile=.cache/path-census.mjs
//        FPP=0.5 node .cache/path-census.mjs --seed 42 --vision vision.heart.unifier --ticks 300 --out f.json
import * as fs from 'fs';
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
import { isRoutineTemplate } from '../src/engine/attentionCadence';
import { readCrossroadsSnapshot } from '../src/engine/crossroads';
import { NPC_ROLE_REACH_MAP } from '../src/types/npc';
import { enableTracing, getTracesForAgent } from '../src/engine/traceBuffer';

/* eslint-disable @typescript-eslint/no-explicit-any */
const argv = process.argv.slice(2);
const arg = (k: string, d: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const SEED = Number(arg('--seed', '42'));
const VISION = arg('--vision', 'vision.heart.unifier');
const TICKS = Number(arg('--ticks', '300'));
const OUT = arg('--out', '');

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
const path = firstPathFromRecord(rec as any)!;
const firstId: string = getFirstId(state.graph, state.ascendantId)!;
const role = state.graph.getNode(firstId)?.properties?.npcRole;
const roleAff = role ? (NPC_ROLE_REACH_MAP as any)[role] : undefined;

function scene(templateId: string): { reach?: string; motivations?: string[] } {
  const t: any = getAnyEncounterById(templateId) ?? getUnifiedTemplateById(templateId);
  return { reach: t?.reach ?? t?.reachPrimary, motivations: t?.motivations ?? [] };
}
function flags(templateId: string, reach?: string) {
  const s = scene(templateId);
  const r = (reach ?? s.reach) as any;
  return {
    templateId, reach: r,
    pulled: firstPathPullFor(path, r, s.motivations as any) > 1,
    inPathReach: r === path.reach || r === path.requiredReach,
    roleLean: !!roleAff && (r === roleAff.primary ? 'primary' : r === roleAff.secondary ? 'secondary' : false),
  };
}

enableTracing();
const boards: any[] = [];
let lastBoardTick = -1;
const seen = new Set<string>();
const chapters: any[] = [];
const roads: any[] = [];
let lastSnapTick = -1;
for (let i = 0; i < TICKS; i++) {
  state = runTick(state, [], runtime);
  state = unattended(state);
  for (const a of state.unifiedActions ?? []) {
    if (a.actorId !== firstId || seen.has(a.actionId)) continue;
    seen.add(a.actionId);
    if (!isEncounterAction(a.templateId) || isRoutineTemplate(a.templateId)) continue;
    chapters.push({ tick: state.tick, ...flags(a.templateId) });
  }
  for (const t of getTracesForAgent(firstId) as any[]) {
    if (t.category !== 'decision_board_comparison' || t.tick <= lastBoardTick) continue;
    boards.push({ tick: t.tick, top: (t.boardTop ?? []).map((e: any) => ({ family: e.family, id: e.id, score: e.score, fpp: e.firstPathPull ?? 1, role: e.roleAffinityPull ?? 1 })) });
  }
  if (boards.length) lastBoardTick = boards[boards.length - 1].tick;
  const snap = readCrossroadsSnapshot(state.graph.getNode(firstId)?.properties?.crossroads);
  if (snap && snap.tick !== lastSnapTick) {
    lastSnapTick = snap.tick;
    roads.push({ tick: snap.tick, options: snap.options.map(o => ({ family: o.family, score: Number(o.score.toFixed(3)), ...flags(o.templateId, o.reach) })) });
  }
  if (state.phase && state.phase !== 'playing') break;
}
const pct = (n: number, d: number) => (d ? Math.round((100 * n) / d) : 0);
const roadOpts = roads.flatMap(r => r.options);
const summary = {
  seed: SEED, vision: VISION, path: path.title, reaches: [path.reach, path.requiredReach], themes: path.themeAxes,
  role, roleReach: roleAff, fpp: Number(process.env.FPP ?? 0.5), ranTo: state.tick,
  chapters: chapters.length,
  chaptersPulled: chapters.filter(c => c.pulled).length,
  chaptersInPathReach: chapters.filter(c => c.inPathReach).length,
  chaptersRolePrimary: chapters.filter(c => c.roleLean === 'primary').length,
  firstChapter: chapters[0]?.templateId ?? null,
  firstChapterPulled: chapters[0]?.pulled ?? null,
  snapshots: roads.length,
  roadsPulledPct: pct(roadOpts.filter(o => o.pulled).length, roadOpts.length),
  snapshotsWithAPulledRoadPct: pct(roads.filter(r => r.options.some((o: any) => o.pulled)).length, roads.length),
  boards: boards.length,
  boardsWinnerPulledPct: pct(boards.filter(b => b.top[0]?.fpp > 1).length, boards.length),
  boardsAnyPulledTop5Pct: pct(boards.filter(b => b.top.some((e: any) => e.fpp > 1)).length, boards.length),
  boardsWinnerRolePct: pct(boards.filter(b => b.top[0]?.role > 1).length, boards.length),
  pulledLosesWithin2xPct: pct(boards.filter(b => b.top[0] && !(b.top[0].fpp > 1) && b.top.some((e: any) => e.fpp > 1 && e.score * 2 >= b.top[0].score)).length, boards.length),
  roadsRolePrimaryPct: pct(roadOpts.filter(o => o.roleLean === 'primary').length, roadOpts.length),
};
console.log(JSON.stringify(summary));
console.log('  chapters: ' + chapters.map(c => `${c.templateId}[${c.reach}${c.pulled ? ' PULL' : ''}${c.roleLean === 'primary' ? ' ROLE' : ''}]`).join(' · '));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ summary, chapters, roads, boards }, null, 1));
