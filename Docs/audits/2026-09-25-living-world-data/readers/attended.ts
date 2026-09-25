// Attended-view firing census (THR-1590).
//
// Runs `?view=game&seeded&size=medium`-equivalent worlds headlessly — the same three calls
// `App.tsx` → `useSimulation` make for that URL: `initializeGameStateFromIdentity(
// DEV_ASCENDANT_IDENTITY, seed, deriveCosmologyFromIdentity(identity), 'medium')`, then
// `devSeedTheFirst` (Kael Thornweaver, thread edge courtPosition `the_first`) and
// `devSeedAscendantTestPackage`. Ticks with plain `runTick(state, [], runtime)`, which is
// exactly what `window.__DEBUG.tick(n)` (runTickBatch) does with no scry targets — i.e. an
// attended world with no clicks. The unattended arm reproduces the audit's census setup
// (`generateArchetypes(4, seed)[0]`, balanced cosmology, no First) for a same-tick-count
// side-by-side.
//
// Harvests BOTH places a selected encounter can land: `state.unifiedActions` (what
// `census:firings` reads) and `state.encounterProgress` (the legacy path the social
// generator's non-unified templates would take). Every firing is tagged with the social
// generator's pools (social / scene / tavern / secret / faction-social, the imports of
// `socialEncounterGeneration.ts`) so the social path is counted in the same table.
//
// Usage (repo root):
//   npx esbuild Docs/audits/2026-09-25-living-world-data/readers/attended.ts --bundle --platform=node --format=esm --outfile=.cache/attended.mjs --external:fs --external:path
//   node .cache/attended.mjs 42,99 150 [--json out.json]
import * as fs from 'fs';
import { initializeGameState, initializeGameStateFromIdentity, devSeedTheFirst, devSeedAscendantTestPackage, DEV_ASCENDANT_IDENTITY, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { deriveCosmologyFromIdentity } from '../../../../src/engine/remembrance';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { UNIFIED_ACTION_TEMPLATES, LOCATION_BRANCHING_ENCOUNTER_TEMPLATES, getUnifiedTemplateById } from '../../../../src/data/unified-action-templates';
import { getAnyEncounterById } from '../../../../src/data/encounter-content';
import { CONTENT_OBJECT_KINDS } from '../../../../src/data/content-objects';
import { SOCIAL_ENCOUNTER_TEMPLATES } from '../../../../src/data/social-encounter-content';
import { SOCIAL_SCENE_TEMPLATES } from '../../../../src/data/social-scene-templates';
import { TAVERN_UNIFIED_ENCOUNTER_TEMPLATES } from '../../../../src/data/tavern-encounter-content';
import { SECRET_DISCOVERY_ENCOUNTER_TEMPLATES } from '../../../../src/data/secret-encounter-content';
import { FACTION_ENCOUNTER_TEMPLATES } from '../../../../src/data/faction-encounter-content';
import { BORDERLAND_ENCOUNTER_TEMPLATES } from '../../../../src/data/borderland-encounter-content';
import { NPC_ACTION_TEMPLATES } from '../../../../src/data/npc-action-templates';

const argv = process.argv.slice(2);
const seeds = (argv[0] ?? '42,99').split(',').map(Number);
const TICKS = Number(argv[1] ?? 150);
const jsonOut = argv.includes('--json') ? argv[argv.indexOf('--json') + 1] : undefined;
const modes = (argv.includes('--modes') ? argv[argv.indexOf('--modes') + 1] : 'attended,unattended').split(',');

const encKind = CONTENT_OBJECT_KINDS.find(k => k.id === 'encounter_template')!;
const isEnc = (id: string) => encKind.idPrefixes.some(p => id.startsWith(p));
const pool = (name: string, arr: readonly any[]) => arr.map(t => [t.id, name] as const);
const SOCIAL_POOL = new Map<string, string>([
  ...pool('tavern', TAVERN_UNIFIED_ENCOUNTER_TEMPLATES),
  ...pool('secret', SECRET_DISCOVERY_ENCOUNTER_TEMPLATES),
  ...pool('faction_social', FACTION_ENCOUNTER_TEMPLATES),
  ...pool('social_scene', SOCIAL_SCENE_TEMPLATES),
  ...pool('social', SOCIAL_ENCOUNTER_TEMPLATES),
]);
const OTHER_POOL = new Map<string, string>([...pool('borderland', BORDERLAND_ENCOUNTER_TEMPLATES), ...pool('npc', NPC_ACTION_TEMPLATES)]);
const tmplOf = (id: string): any => getUnifiedTemplateById(id) ?? getAnyEncounterById(id);
const stepsOf = (t: any): any[] => { const r: any[] = []; for (const s of t?.steps ?? []) { if (s.variants) { for (const v of Object.values(s.variants)) r.push(v); r.push(s.fallback); } else r.push(s); } return r; };
const hasNudge = (id: string) => stepsOf(tmplOf(id)).some(s => s?.nudges?.length);
const hasSacProse = (id: string) => stepsOf(tmplOf(id)).some(s => s?.successAtCostAfterimage);
// The audit's §2 denominator: drawable encounter templates in the registry.
const DRAWABLE = new Set([...UNIFIED_ACTION_TEMPLATES, ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES].filter(t => isEnc(t.id) && t.drawable !== false).map(t => t.id));
const AUDIT_DRAWABLE = (UNIFIED_ACTION_TEMPLATES as any[]).filter(t => isEnc(t.id) && t.drawable !== false).length;

const RANK: Record<string, number> = { the_first: 4, retinue: 3, watched: 2, dormant: 1 };
interface Firing {
  seed: number; path: 'unifiedActions' | 'encounterProgress'; templateId: string; actorId: string; targetId: string | null;
  source: string; startTick: number; effectiveTier: string; intrinsicTier: string; court: string; courtHolder: string | null;
  pool: string; isEnc: boolean; outcome: string | null;
}

function runSeed(seed: number, mode: string) {
  resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
  const runtime = createSimulationRuntime();
  let state: any; let firstId: string | null = null;
  if (mode === 'attended') {
    const cosmology = deriveCosmologyFromIdentity({ sphereAlignment: DEV_ASCENDANT_IDENTITY.sphereAlignment, mortalTags: DEV_ASCENDANT_IDENTITY.mortalTags, hungerId: DEV_ASCENDANT_IDENTITY.hungerId });
    ({ state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, cosmology, 'medium'));
    firstId = devSeedTheFirst(state);
    devSeedAscendantTestPackage(state);
  } else {
    const preset = MAP_SIZE_PRESETS['medium'];
    ({ state } = initializeGameState(generateArchetypes(4, seed)[0], 'Unattended', createBalancedCosmology(), seed, preset.cols, preset.rows));
  }
  const courtOf = (): Map<string, string> => {
    const m = new Map<string, string>();
    if (!state.ascendantId) return m;
    for (const e of state.graph.getOutgoingEdges(state.ascendantId, 'thread')) m.set(e.target, String(e.properties?.courtPosition ?? 'threaded'));
    return m;
  };
  const firings = new Map<string, Firing>();
  const courtHistory: Record<string, Record<string, number>> = {};
  const record = (key: string, f: Omit<Firing, 'court' | 'courtHolder'>, court: Map<string, string>) => {
    const a = court.get(f.actorId); const b = f.targetId ? court.get(f.targetId) : undefined;
    const ra = a ? (RANK[a] ?? 0) : -1; const rb = b ? (RANK[b] ?? 0) : -1;
    const best = ra >= rb ? (a ?? null) : (b ?? null);
    const holder = ra >= rb ? (a ? f.actorId : null) : (b ? f.targetId : null);
    firings.set(key, { ...f, court: best ?? 'unthreaded', courtHolder: holder });
  };
  const harvest = () => {
    const court = courtOf();
    for (const [id, pos] of court) { courtHistory[pos] ??= {}; courtHistory[pos][id] = (courtHistory[pos][id] ?? 0) + 1; }
    for (const a of state.unifiedActions ?? []) {
      const key = 'ua|' + a.actionId;
      if (!firings.has(key)) {
        const t = tmplOf(a.templateId);
        record(key, { seed, path: 'unifiedActions', templateId: a.templateId, actorId: a.actorId, targetId: a.targetId ?? null, source: String(a.source ?? '?'),
          startTick: a.startTick, effectiveTier: String(a.effectiveTier ?? '(unset)'), intrinsicTier: String(t?.intrinsicTier ?? '(none)'),
          pool: SOCIAL_POOL.get(a.templateId) ?? OTHER_POOL.get(a.templateId) ?? 'board', isEnc: isEnc(a.templateId), outcome: null }, court);
      }
      const f = firings.get(key)!;
      if (a.outcome && !f.outcome) f.outcome = a.outcome;
    }
    for (const p of state.encounterProgress ?? []) {
      const key = `ep|${p.actorId}|${p.encounterId}|${p.startedTick}`;
      if (!firings.has(key)) {
        const t = tmplOf(p.encounterId);
        record(key, { seed, path: 'encounterProgress', templateId: p.encounterId, actorId: p.actorId, targetId: p.targetAgentId ?? null, source: 'legacy',
          startTick: p.startedTick, effectiveTier: String(p.effectiveTier ?? '(unset)'), intrinsicTier: String(t?.intrinsicTier ?? '(none)'),
          pool: SOCIAL_POOL.get(p.encounterId) ?? OTHER_POOL.get(p.encounterId) ?? 'board', isEnc: isEnc(p.encounterId), outcome: null }, court);
      }
      const f = firings.get(key)!;
      if (!f.outcome && (p.status === 'completed' || p.status === 'abandoned')) {
        f.outcome = p.status === 'abandoned' ? 'abandoned' : (p.history ?? []).every((h: any) => h.success) ? 'success(legacy)' : 'failure(legacy)';
      }
    }
  };
  const t0 = Date.now();
  harvest();
  for (let i = 0; i < TICKS; i++) { state = runTick(state, [], runtime); harvest(); }
  const ms = Date.now() - t0;
  const finalCourt = Object.fromEntries([...courtOf()].map(([id, pos]) => [id, { pos, name: state.graph.getNode(id)?.name ?? id }]));
  const unresolvedAtEnd = (state.unifiedActions ?? []).filter((a: any) => !a.resolved).length;
  return { firings: [...firings.values()], firstId, finalCourt, courtHistory, ms, tick: state.tick, unresolvedAtEnd, encounterProgressAtEnd: (state.encounterProgress ?? []).length };
}

// ─── Reporting ──────────────────────────────────────────────────────
const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };
const sorted = (m: Record<string, number>) => Object.entries(m).sort((a, b) => b[1] - a[1]);
const pct = (a: number, b: number) => b ? `${(100 * a / b).toFixed(1)}%` : '—';
function topShare(fs: Firing[], n = 10) { const m: Record<string, number> = {}; for (const f of fs) inc(m, f.templateId); const s = sorted(m); return { distinct: s.length, top: s.slice(0, n), share: s.slice(0, n).reduce((x, [, c]) => x + c, 0) / (fs.length || 1) }; }
function longestRuns(fs: Firing[]) {
  // Per mortal (actor), firings ordered by start tick; longest consecutive run of one template.
  const by: Record<string, Firing[]> = {};
  for (const f of fs) (by[`${f.seed}|${f.actorId}`] ??= []).push(f);
  const runs: { seed: number; actorId: string; templateId: string; run: number; fromTick: number; toTick: number; ofActorTotal: number }[] = [];
  for (const [k, list] of Object.entries(by)) {
    list.sort((a, b) => a.startTick - b.startTick);
    let best = { templateId: '', run: 0, from: 0, to: 0 }; let cur = 0;
    for (let i = 0; i < list.length; i++) {
      cur = i > 0 && list[i].templateId === list[i - 1].templateId ? cur + 1 : 1;
      if (cur > best.run) best = { templateId: list[i].templateId, run: cur, from: list[i - cur + 1].startTick, to: list[i].startTick };
    }
    const [seed, actorId] = k.split('|');
    runs.push({ seed: Number(seed), actorId, templateId: best.templateId, run: best.run, fromTick: best.from, toTick: best.to, ofActorTotal: list.length });
  }
  return runs.sort((a, b) => b.run - a.run);
}
function bands(fs: Firing[]) { const m: Record<string, number> = {}; for (const f of fs) inc(m, f.outcome ?? '(unresolved)'); return m; }
function section2(fs: Firing[]) {
  const enc = fs.filter(f => f.isEnc);
  const ts = topShare(enc);
  const firedDrawable = new Set(enc.map(f => f.templateId).filter(id => DRAWABLE.has(id)));
  const resolved = enc.filter(f => f.outcome && !f.outcome.includes('legacy') && f.outcome !== 'abandoned');
  const atCost = resolved.filter(f => f.outcome === 'success_at_cost').length;
  const nudge = enc.filter(f => hasNudge(f.templateId)).length;
  const sacAuthored = enc.filter(f => hasSacProse(f.templateId)).length;
  return { firings: enc.length, top10Share: ts.share, distinctFired: ts.distinct, drawableFired: firedDrawable.size, drawableTotal: DRAWABLE.size, auditDrawableDenominator: AUDIT_DRAWABLE,
    resolutions: resolved.length, atCost, atCostShare: atCost / (resolved.length || 1), nudgeHandFirings: nudge, nudgeHandShare: nudge / (enc.length || 1), sacProseAuthoredShare: sacAuthored / (enc.length || 1) };
}
function crossTab(fs: Firing[], row: (f: Firing) => string, col: (f: Firing) => string) {
  const t: Record<string, Record<string, number>> = {}; const cols = new Set<string>();
  for (const f of fs) { const r = row(f), c = col(f); cols.add(c); t[r] ??= {}; inc(t[r], c); }
  return { cols: [...cols].sort(), rows: t };
}
function printTab(title: string, x: { cols: string[]; rows: Record<string, Record<string, number>> }) {
  const lines = [`\n${title}`];
  const w = Math.max(18, ...Object.keys(x.rows).map(k => k.length + 1));
  lines.push('  ' + ''.padEnd(w) + x.cols.map(c => c.padStart(16)).join('') + 'total'.padStart(9));
  let colTot: Record<string, number> = {};
  for (const [r, m] of Object.entries(x.rows).sort()) {
    const tot = Object.values(m).reduce((a, b) => a + b, 0);
    for (const c of x.cols) inc(colTot, c, m[c] ?? 0);
    lines.push('  ' + r.padEnd(w) + x.cols.map(c => String(m[c] ?? 0).padStart(16)).join('') + String(tot).padStart(9));
  }
  const grand = Object.values(colTot).reduce((a, b) => a + b, 0);
  lines.push('  ' + 'total'.padEnd(w) + x.cols.map(c => String(colTot[c] ?? 0).padStart(16)).join('') + String(grand).padStart(9));
  return lines.join('\n');
}

const out: any = { ticks: TICKS, seeds, map: 'medium', modes: {} };
const text: string[] = [`attended-view firing census — medium, ${TICKS} ticks, seeds ${seeds.join(',')}`];
for (const mode of modes) {
  const all: Firing[] = []; const meta: any = {};
  for (const seed of seeds) {
    const r = runSeed(seed, mode);
    all.push(...r.firings);
    meta[seed] = { firstId: r.firstId, finalCourt: r.finalCourt, courtTicks: r.courtHistory, ms: r.ms, tick: r.tick, unresolvedAtEnd: r.unresolvedAtEnd, encounterProgressAtEnd: r.encounterProgressAtEnd, firings: r.firings.length };
    console.error(`[${mode}] seed ${seed}: ${r.firings.length} firings, ${r.ms} ms`);
  }
  const socialPath = (f: Firing) => SOCIAL_POOL.has(f.templateId) || f.path === 'encounterProgress';
  const pathCol = (f: Firing) => `${f.path === 'unifiedActions' ? 'UA' : 'EP'}:${socialPath(f) ? 'social' : 'board'}`;
  const threaded = all.filter(f => f.court !== 'unthreaded');
  const firstRet = all.filter(f => f.court === 'the_first' || f.court === 'retinue');
  const s2 = section2(all); const s2seed = Object.fromEntries(seeds.map(s => [s, section2(all.filter(f => f.seed === s))]));
  const s2first = section2(firstRet);
  const tabTierCourt = crossTab(all, f => `${f.court}/${f.effectiveTier}`, pathCol);
  const tabPool = crossTab(all, f => f.pool, f => String(f.seed));
  const tabBand = crossTab(all, f => f.outcome ?? '(unresolved)', f => (f.court === 'unthreaded' ? 'unthreaded' : 'threaded') + ':' + (f.effectiveTier === 'story_beat' || f.effectiveTier === 'shaping' ? 'attended-tier' : f.effectiveTier));
  const tsAll = topShare(all.filter(f => f.isEnc), 20); const tsFirst = topShare(firstRet, 15); const tsThreaded = topShare(threaded, 15);
  const runs = longestRuns(all); const runsFirst = runs.filter(r => meta[r.seed].firstId === r.actorId);
  const intrinsic = crossTab(all.filter(f => f.isEnc), f => f.intrinsicTier, f => String(f.seed));
  out.modes[mode] = { meta, section2: s2, section2BySeed: s2seed, section2FirstRetinue: s2first, tierCourtByPath: tabTierCourt, poolBySeed: tabPool, bands: tabBand, intrinsicTierBySeed: intrinsic,
    topAll: tsAll, topFirstRetinue: tsFirst, topThreaded: tsThreaded, longestRuns: runs.slice(0, 25), longestRunsFirst: runsFirst, bandsFirstRetinue: bands(firstRet), firings: all };
  text.push(`\n════════ ${mode.toUpperCase()} ════════`);
  for (const s of seeds) {
    const m = meta[s];
    text.push(`seed ${s}: ${m.firings} firings (unifiedActions + encounterProgress), ${m.ms} ms; unresolved UA at end ${m.unresolvedAtEnd}; encounterProgress at end ${m.encounterProgressAtEnd}`);
    text.push(`  threads at t${m.tick}: ${Object.values(m.finalCourt).map((c: any) => `${c.name} (${c.pos})`).join(', ') || '(none)'}`);
    text.push(`  court positions ever held (agent-ticks): ${Object.entries(m.courtTicks).map(([p, ids]: any) => `${p} ${Object.keys(ids).length} agent(s)`).join(', ') || '(none)'}`);
  }
  text.push(printTab('Firings by court position (highest of actor/target) / effective attention tier × path  [UA = state.unifiedActions, EP = state.encounterProgress; social = social-generator pools]', tabTierCourt));
  text.push(printTab('Firings by content pool × seed  [board = cache/registry path; tavern/secret/faction_social/social_scene/social = socialEncounterGeneration pools; borderland/npc named separately]', tabPool));
  text.push(printTab('Bands × (threaded? : tier)', tabBand));
  text.push(printTab('Encounter firings by template intrinsic tier × seed', intrinsic));
  const fmt2 = (x: any) => `firings ${x.firings}; top-10 ${pct(x.top10Share * x.firings, x.firings)}; distinct fired ${x.distinctFired}; drawable fired ${x.drawableFired} of ${x.drawableTotal} (audit denominator ${x.auditDrawableDenominator}); at-cost ${x.atCost} of ${x.resolutions} resolutions (${pct(x.atCost, x.resolutions)}); nudge-hand ${x.nudgeHandFirings} (${pct(x.nudgeHandFirings, x.firings)}); at-cost prose authored on ${pct(x.sacProseAuthoredShare * x.firings, x.firings)} of firings`;
  text.push(`\n§2 restated (encounter-kind firings, both seeds): ${fmt2(s2)}`);
  for (const s of seeds) text.push(`  seed ${s}: ${fmt2(s2seed[s])}`);
  text.push(`  First + retinue only: ${fmt2(s2first)}`);
  text.push(`\nTop 20 encounter templates (both seeds) — top-10 share ${pct(tsAll.share * all.filter(f => f.isEnc).length, all.filter(f => f.isEnc).length)}`);
  for (const [id, n] of tsAll.top) text.push(`  ${String(n).padStart(4)}  ${id}${SOCIAL_POOL.has(id) ? '  [social path]' : ''}${hasNudge(id) ? '  [nudge hand]' : ''}`);
  text.push(`\nThe First + retinue: ${firstRet.length} firings, ${tsFirst.distinct} distinct templates, top-10 share ${pct(tsFirst.share * firstRet.length, firstRet.length)}; bands ${JSON.stringify(bands(firstRet))}`);
  for (const [id, n] of tsFirst.top) text.push(`  ${String(n).padStart(4)}  ${id}${hasNudge(id) ? '  [nudge hand]' : ''}`);
  text.push(`\nAll threaded (any court position): ${threaded.length} firings, ${tsThreaded.distinct} distinct`);
  text.push(`\nLongest run of the same template to the same mortal (consecutive firings by that actor):`);
  for (const r of runs.slice(0, 10)) text.push(`  seed ${r.seed}  ${r.run}×  ${r.templateId}  actor ${r.actorId}  t${r.fromTick}–t${r.toTick}  (of ${r.ofActorTotal} firings by that actor)`);
  for (const r of runsFirst) text.push(`  The First (seed ${r.seed}): ${r.run}×  ${r.templateId}  t${r.fromTick}–t${r.toTick}  (of ${r.ofActorTotal})`);
}
console.log(text.join('\n'));
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(out, null, 1));
