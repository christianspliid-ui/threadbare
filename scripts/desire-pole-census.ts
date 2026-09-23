/**
 * Desire pole census — THR-1525 Done-when evidence (CLI / headless, THR-688 rule C).
 *
 * Measures whether value-tagged scenes and undertakings reach mortals on **both**
 * poles of the value they are about, in the build's current
 * `DESIRE_SCORE_POLE_MODE`. To compare readings, run once as shipped
 * (`'absolute'`) and once with the constant flipped locally to `'signed'`. The
 * mode is printed from the import, so the label cannot lie about the build.
 *
 * **Pole balance is magnitude-matched.** Desire scales with |v| under the absolute
 * reading, so a raw headcount comparison would fail whenever flaw- and
 * virtue-leaners differ in how *strongly* they lean. Each mortal-tick is binned
 * per value axis by |v| (`[0.1, 0.4)`, `[0.4, 1.0]`; below 0.1 is neutral and
 * excluded). A pick of a template whose **first** named motivation is axis A is
 * credited to the picker's side and bin on A. The ratio is **indirectly
 * standardized per axis**: observed flaw picks ÷ the flaw picks expected if every
 * flaw-leaner on axis A picked at the virtue-leaners' per-capita rate on A. Pooling
 * exposure across axes instead would bias the ratio whenever flaw-leaners
 * concentrate on axes the corpus rarely names first. Pass: ratio in
 * **[0.8, 1.25]** for every bin with ≥ `MIN_BIN_MORTALS` mortals on each side.
 *
 * **Calibration finding (THR-1525 landing, seeds 42/99 × 200 ticks): the pick-rate
 * ratio does not discriminate the two readings.** It lands in the same 0.55–1.23
 * spread under `'signed'` and `'absolute'`, because every autonomous mortal picks
 * something every tick and desire does not decide *which* template wins; capability,
 * travel and value-per-tick dominate the ranking. It is printed, never trusted as the
 * verdict. The discriminating line is **picked-candidate desire**: the desire
 * multiplier on the candidate each mortal actually picked, by picker pole. Under
 * `'signed'`, 40–82% of flaw-leaners' picks sit at the floor (< 0.02). Under
 * `'absolute'`, 0% do. The precise gate stays the mirrored-mortal liveness test.
 *
 * Also reports fork firings (the fork-audit list: a template naming its own
 * `decidedBy` axis in `motivations`), health (encounter picks per tick, board idle
 * share), and the same pole-balance line for undertaking starts.
 *
 * Usage:
 *   npm run census:desire-poles                          # seeds 42,99 × 200 ticks, medium
 *   npm run census:desire-poles -- --seeds 42 --ticks 60
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { isAutonomousDecisionActor } from '../src/engine/strategicKindReachability';
import { resolveAxiologicalProfile, DESIRE_SCORE_POLE_MODE } from '../src/engine/encounterScoring';
import { getStrategicTemplate } from '../src/engine/strategicActionCandidates';
import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import { forkAxes } from '../src/data/content-eval/motivationPoleChecks';
import { VALUE_PAIRS, type AxiologicalProfile, type ValuePair } from '../src/types/agent';

// ─── Constants ────────────────────────────────────────────────────

const DEFAULT_SEEDS: readonly number[] = [42, 99];
const DEFAULT_TICKS = 200;
/** |v| below this is neutral on the axis and excluded from the balance. */
const NEUTRAL_BAND = 0.1;
/** Upper edge of the weak bin; `[NEUTRAL_BAND, BIN_EDGE)` weak, `[BIN_EDGE, 1]` strong. */
const BIN_EDGE = 0.4;
/** The ratio band the plan names for the absolute reading. */
const BALANCE_BAND: readonly [number, number] = [0.8, 1.25];
/** A bin is judged only with at least this many distinct mortals on each side. */
const MIN_BIN_MORTALS = 5;

// ─── Args ─────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const seeds = (arg('--seeds') ?? DEFAULT_SEEDS.join(',')).split(',').map(Number);
const ticks = Number(arg('--ticks') ?? DEFAULT_TICKS);
const map = (arg('--map') ?? 'medium') as MapSizePreset;

// ─── Template indexes ─────────────────────────────────────────────

const ENCOUNTER_MOTIVATIONS = new Map<string, readonly ValuePair[]>(
  UNIFIED_ACTION_TEMPLATES.map(t => [t.id, t.motivations ?? []]),
);
/** Fork audit: templates naming one of their own fork axes in `motivations`. */
const FORK_AUDIT: ReadonlyMap<string, ValuePair[]> = new Map(
  UNIFIED_ACTION_TEMPLATES.flatMap(t => {
    const shared = [...forkAxes(t)].filter(a => (t.motivations ?? []).includes(a));
    return shared.length > 0 ? [[t.id, shared] as const] : [];
  }),
);

// ─── Balance accumulator ──────────────────────────────────────────

type Side = 'virtue' | 'flaw';
type Bin = 'weak' | 'strong';
const BINS: readonly Bin[] = ['weak', 'strong'];

type Cell = Record<Side, Record<Bin, number>>;
interface Balance {
  /** mortal-ticks per axis × side × bin */
  exposure: Map<ValuePair, Cell>;
  picks: Map<ValuePair, Cell>;
  mortals: Record<Side, Record<Bin, Set<string>>>;
  unresolved: number;
  unresolvedIds: Map<string, number>;
  total: number;
  /** Desire multiplier of the *picked* candidate, per picker side × bin (encounters only). */
  pickedDesire: Record<Side, Record<Bin, number[]>>;
}

const zeroCell = (): Cell => ({ virtue: { weak: 0, strong: 0 }, flaw: { weak: 0, strong: 0 } });
function cell(m: Map<ValuePair, Cell>, axis: ValuePair): Cell {
  let c = m.get(axis);
  if (!c) { c = zeroCell(); m.set(axis, c); }
  return c;
}

function emptyBalance(): Balance {
  const s = () => ({ weak: new Set<string>(), strong: new Set<string>() });
  const d = () => ({ weak: [] as number[], strong: [] as number[] });
  return { exposure: new Map(), picks: new Map(), mortals: { virtue: s(), flaw: s() }, unresolved: 0, unresolvedIds: new Map(), total: 0, pickedDesire: { virtue: d(), flaw: d() } };
}

function classify(v: number): { side: Side; bin: Bin } | null {
  const m = Math.abs(v);
  if (m < NEUTRAL_BAND) return null;
  return { side: v > 0 ? 'virtue' : 'flaw', bin: m < BIN_EDGE ? 'weak' : 'strong' };
}

function creditPick(b: Balance, id: string, motivations: readonly ValuePair[] | undefined, profile: AxiologicalProfile | undefined, pickedDesire?: number): void {
  b.total++;
  if (!motivations || motivations.length === 0 || !profile) {
    b.unresolved++;
    const why = `${id} [${!motivations ? 'unknown template' : motivations.length === 0 ? 'no motivations' : 'picker not profiled'}]`;
    b.unresolvedIds.set(why, (b.unresolvedIds.get(why) ?? 0) + 1);
    return;
  }
  const axis = motivations[0];
  const c = classify(profile[axis] ?? 0);
  if (c) {
    cell(b.picks, axis)[c.side][c.bin]++;
    if (pickedDesire !== undefined) b.pickedDesire[c.side][c.bin].push(pickedDesire);
  }
}

// ─── One seed ─────────────────────────────────────────────────────

interface SeedResult {
  seed: number;
  encounters: Balance;
  undertakings: Balance;
  encounterPicks: number;
  scoringTicks: number;
  boardVerdicts: number;
  boardIdle: number;
  forkFirings: Map<string, number>;
}

function runSeed(seed: number): SeedResult {
  resetEventCounter();
  resetReputationTraitInit();
  enableTracing();
  const encounters = emptyBalance();
  const undertakings = emptyBalance();
  const forkFirings = new Map<string, number>([...FORK_AUDIT.keys()].map(k => [k, 0]));
  let encounterPicks = 0;
  let scoringTicks = 0;
  let boardVerdicts = 0;
  let boardIdle = 0;
  try {
    const runtime = createSimulationRuntime();
    const preset = MAP_SIZE_PRESETS[map];
    const archetype = generateArchetypes(4, seed)[0];
    let { state } = initializeGameState(archetype, 'PoleCensus', createBalancedCosmology(), seed, preset.cols, preset.rows);

    for (let i = 0; i < ticks; i++) {
      const tick = state.tick ?? i;
      const profiles = new Map<string, AxiologicalProfile>();
      for (const n of state.graph.getNodesByType('actor')) {
        if (!n.properties?.axiologicalProfile) continue;
        const p = resolveAxiologicalProfile(state.graph, n.id, tick);
        // Every profiled picker resolves; only the autonomous population is exposure.
        profiles.set(n.id, p);
        if (!isAutonomousDecisionActor(n)) continue;
        for (const axis of VALUE_PAIRS) {
          const c = classify(p[axis] ?? 0);
          if (!c) continue;
          for (const b of [encounters, undertakings]) {
            cell(b.exposure, axis)[c.side][c.bin]++;
            b.mortals[c.side][c.bin].add(n.id);
          }
        }
      }

      clearTraces();
      state = runTick(state, [], runtime);
      for (const t of getTraces()) {
        const a = t as unknown as Record<string, unknown>;
        if (a.category === 'encounter_scoring') {
          scoringTicks++;
          const id = a.selectedTemplateId as string | null;
          if (!id) continue;
          encounterPicks++;
          if (forkFirings.has(id)) forkFirings.set(id, forkFirings.get(id)! + 1);
          const row = (a.topCandidates as Array<{ templateId: string; desireMultiplier: number }> | undefined)
            ?.find(r => r.templateId === id);
          creditPick(encounters, id, ENCOUNTER_MOTIVATIONS.get(id), profiles.get(a.agentId as string), row?.desireMultiplier);
        } else if (a.category === 'strategic_action_started') {
          if (a.startedBy === 'review_lever') continue;
          const id = a.templateId as string | undefined;
          creditPick(undertakings, id ?? '?', id ? (getStrategicTemplate(id)?.motivations ?? (getStrategicTemplate(id) ? [] : undefined)) : undefined, profiles.get(a.actorId as string));
        } else if (a.category === 'decision_board_comparison') {
          boardVerdicts++;
          if (a.boardFamily === 'idle') boardIdle++;
        }
      }
    }
  } finally {
    disableTracing();
  }
  return { seed, encounters, undertakings, encounterPicks, scoringTicks, boardVerdicts, boardIdle, forkFirings };
}

// ─── Report ───────────────────────────────────────────────────────

function balanceLines(label: string, b: Balance): { lines: string[]; pass: boolean } {
  const lines = [`  ${label}: ${b.total} picks (${b.unresolved} without motivations or profile)`];
  let pass = true;
  let judged = 0;
  for (const bin of BINS) {
    let vPicks = 0, fPicks = 0, fExpected = 0;
    for (const [axis, p] of b.picks) {
      const e = b.exposure.get(axis) ?? zeroCell();
      vPicks += p.virtue[bin];
      fPicks += p.flaw[bin];
      if (e.virtue[bin] > 0) fExpected += e.flaw[bin] * (p.virtue[bin] / e.virtue[bin]);
    }
    const ratio = fExpected > 0 ? fPicks / fExpected : NaN;
    const enough = b.mortals.virtue[bin].size >= MIN_BIN_MORTALS && b.mortals.flaw[bin].size >= MIN_BIN_MORTALS
      && vPicks + fPicks > 0;
    const inBand = Number.isFinite(ratio) && ratio >= BALANCE_BAND[0] && ratio <= BALANCE_BAND[1];
    if (enough) { judged++; if (!inBand) pass = false; }
    const share = fPicks + vPicks > 0 ? (100 * fPicks / (fPicks + vPicks)).toFixed(1) : '—';
    lines.push(
      `    bin ${bin.padEnd(6)} virtue ${vPicks} picks (${b.mortals.virtue[bin].size} mortals) · flaw ${fPicks} picks `
      + `vs ${fExpected.toFixed(1)} expected at the virtue rate (${b.mortals.flaw[bin].size} mortals) · `
      + `standardized flaw/virtue ${Number.isFinite(ratio) ? ratio.toFixed(3) : '—'} · raw flaw share ${share}% · `
      + `${enough ? (inBand ? 'IN BAND' : 'OUT OF BAND') : 'not judged'}`,
    );
  }
  if (judged === 0) pass = false;
  for (const bin of BINS) {
    const mean = (xs: number[]) => (xs.length ? (xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(3) : '—');
    const floored = (xs: number[]) => (xs.length ? (100 * xs.filter(x => x < 0.02).length / xs.length).toFixed(1) : '—');
    if (b.pickedDesire.virtue[bin].length + b.pickedDesire.flaw[bin].length === 0) continue;
    lines.push(`    picked-candidate desire, bin ${bin}: virtue mean ${mean(b.pickedDesire.virtue[bin])} (${floored(b.pickedDesire.virtue[bin])}% floored) · `
      + `flaw mean ${mean(b.pickedDesire.flaw[bin])} (${floored(b.pickedDesire.flaw[bin])}% floored)`);
  }
  const top = [...b.unresolvedIds].sort((x, y) => y[1] - x[1]).slice(0, 4);
  if (top.length > 0) lines.push(`    unresolved: ${top.map(([k, n]) => `${k}×${n}`).join(', ')}`);
  return { lines, pass };
}

console.log(`desire pole census — DESIRE_SCORE_POLE_MODE = '${DESIRE_SCORE_POLE_MODE}', map ${map}, ${ticks} ticks, seeds ${seeds.join(',')}`);
console.log(`fork audit (template names its own fork axis in motivations): ${FORK_AUDIT.size} templates`);
for (const [id, axes] of FORK_AUDIT) console.log(`  ${id}: ${axes.join(', ')}`);

let allPass = true;
for (const seed of seeds) {
  const r = runSeed(seed);
  console.log(`\nseed ${seed}`);
  const enc = balanceLines('encounter picks', r.encounters);
  const und = balanceLines('undertaking starts', r.undertakings);
  for (const l of [...enc.lines, ...und.lines]) console.log(l);
  console.log(`  health: ${r.encounterPicks} encounter picks over ${ticks} ticks (${(r.encounterPicks / ticks).toFixed(2)}/tick), `
    + `scorer idle ${r.scoringTicks > 0 ? (100 * (1 - r.encounterPicks / r.scoringTicks)).toFixed(1) : '—'}% of ${r.scoringTicks} scorings, `
    + `board idle ${r.boardVerdicts > 0 ? (100 * r.boardIdle / r.boardVerdicts).toFixed(1) : '—'}% of ${r.boardVerdicts} verdicts`);
  const fired = [...r.forkFirings].filter(([, n]) => n > 0);
  console.log(`  forks: ${fired.length} of ${r.forkFirings.size} audited forks fired; `
    + fired.map(([id, n]) => `${id}×${n}`).join(', '));
  console.log(`  pick-rate balance (reported): encounters ${enc.pass ? 'IN BAND' : 'OUT OF BAND'} · undertakings ${und.pass ? 'IN BAND' : 'OUT OF BAND'}`);
  if (!enc.pass) allPass = false;
}
console.log(`\noverall pick-rate balance (reported; non-discriminating, see header): ${allPass ? 'IN BAND' : 'OUT OF BAND'} (band ${BALANCE_BAND.join('–')}, mode '${DESIRE_SCORE_POLE_MODE}')`);
