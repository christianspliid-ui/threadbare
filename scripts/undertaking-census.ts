/**
 * Undertaking census — the two-seed acceptance instrument for T1 (THR-1297 slice 6).
 *
 * Two measurements the unit suite deliberately does not own, because each is a
 * judgement over two long runs rather than a per-commit assertion:
 *
 *  1. **Checkpoint liveness** — the share of due checkpoints that actually *roll*
 *     dice rather than defer. `undertakingCheckpointLiveness.test.ts` runs the same
 *     shape as a 60-tick single-seed canary and says in its own header that the full
 *     two-seed 150-tick census belongs in closeout evidence. This is that census.
 *  2. **Decision mix vs the cutover envelope** — the shadow board's winner shares
 *     read against `BOARD_UNDERTAKING_SHARE_RANGE` / `BOARD_ENCOUNTER_SHARE_FLOOR` /
 *     `BOARD_IDLE_SHARE_CEILING`. THR-1292 slice 6 ran this and it failed on seed 99
 *     because the undertaking desire multiplier was a hard constant; slice 5 authored
 *     `motivations`, so this run is the re-measurement THR-1301 is gated on.
 *
 * It is a committed script rather than a scratch one-off precisely because THR-1301
 * has to re-run it to decide the cutover, and a gate nobody can re-run is a claim,
 * not a gate.
 *
 * **The wanderer split is load-bearing, not cosmetic.** Slice 5 shipped the chart
 * verbs `requiresLocation: false` on measured evidence, and that flag is exactly what
 * a rolled-share number responds to. Pooling the new pack in with the six existing
 * ones would let the remedy inflate the score for the corpus it was not applied to —
 * the mixed-population failure `decisionBoardLiveness.test.ts` already records one
 * floor down. So both halves are reported apart, and the verdict reads the corpus
 * total *and* names the two components.
 *
 * Usage:
 *   npm run census:undertakings                          # seeds 42,99 × 150 ticks
 *   npm run census:undertakings -- --seeds 42 --ticks 60 # faster arm
 *   npm run census:undertakings -- --json                # machine-readable
 *
 * Flags:
 *   --seeds N,N,...  Comma-separated seeds (default 42,99)
 *   --ticks N        Ticks per run (default 150)
 *   --map <preset>   Map size (default medium)
 *   --json           Emit one JSON object instead of the report
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { buildBalanceRunSummary } from '../src/engine/balanceSummary';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import {
  BOARD_UNDERTAKING_SHARE_RANGE,
  BOARD_ENCOUNTER_SHARE_FLOOR,
  BOARD_IDLE_SHARE_CEILING,
  CENSUS_DISTINCT_TEMPLATE_FLOOR,
} from '../src/data/strategic-action-constants';
import { MERCHANT_STRATEGIC_TEMPLATES } from '../src/data/strategic-packs/merchantStrategicPack';
import { BUILDER_STRATEGIC_TEMPLATES } from '../src/data/strategic-packs/builderStrategicPack';
import { SCHOLAR_STRATEGIC_TEMPLATES } from '../src/data/strategic-packs/scholarStrategicPack';
import { ZEALOT_STRATEGIC_TEMPLATES } from '../src/data/strategic-packs/zealotStrategicPack';
import { COURT_STRATEGIC_TEMPLATES } from '../src/data/strategic-packs/courtStrategicPack';
import { WARLORD_STRATEGIC_TEMPLATES } from '../src/data/strategic-packs/warlordStrategicPack';
import { WANDERER_STRATEGIC_TEMPLATES } from '../src/data/strategic-packs/wandererStrategicPack';

// ─── Constants ────────────────────────────────────────────────────

/** The acceptance threshold from the plan's Done-when and THR-1294's deferral. */
const CENSUS_ROLLED_SHARE_FLOOR = 0.5;

/** Seeds the cutover gate is judged over — two, so one lucky world cannot carry it. */
const CENSUS_DEFAULT_SEEDS: readonly number[] = [42, 99];

/** Long enough for multi-checkpoint undertakings to run their whole arc. */
const CENSUS_DEFAULT_TICKS = 150;

/** The family whose remedy must be reported apart from the corpus it was not applied to. */
const WANDERER_FAMILY = 'wanderer-explorer';

/** How many templates the composition line names. Reporting only — not a gate. */
const CENSUS_COMPOSITION_REPORT_TOP_N = 6;

// ─── Template → family index ──────────────────────────────────────

const TEMPLATE_FAMILY: ReadonlyMap<string, string> = new Map(
  [
    ...MERCHANT_STRATEGIC_TEMPLATES,
    ...BUILDER_STRATEGIC_TEMPLATES,
    ...SCHOLAR_STRATEGIC_TEMPLATES,
    ...ZEALOT_STRATEGIC_TEMPLATES,
    ...COURT_STRATEGIC_TEMPLATES,
    ...WARLORD_STRATEGIC_TEMPLATES,
    ...WANDERER_STRATEGIC_TEMPLATES,
  ].map(t => [t.id, t.behaviorFamily as string]),
);

// ─── Types ────────────────────────────────────────────────────────

interface RolledSplit {
  checkpoints: number;
  rolled: number;
  /** `undefined` rather than 0 when nothing fired — an empty population has no share. */
  rolledShare: number | undefined;
  bands: Record<string, number>;
  deferrals: Record<string, number>;
}

/**
 * What the run actually *started*, as opposed to how the families shared out.
 *
 * The three envelope gates are ratios between families; this is the composition
 * inside the undertaking family. It is measured from `strategic_action_started`
 * traces (every start emits exactly one) rather than from checkpoints, because a
 * checkpoint census counts the arc of whatever already began — a corpus that
 * collapsed to one template still rolls plenty of checkpoints, all of them for
 * that template.
 *
 * `tradeRouteEdges` is read off the finished graph rather than from a trace: it is
 * the specific downstream loss THR-1349 was filed on, and an edge count is the
 * thing a reader can check by hand. It is reported, never gated — measured on the
 * shipped `'shadow'` board it is already 2 on seed 42 and **0 on seed 99**, so
 * "non-zero trade routes" describes one seed's luck rather than a property the
 * healthy configuration has.
 */
interface Composition {
  starts: number;
  distinctTemplates: number;
  /** Start count per template, descending — the shape a collapse is visible in. */
  topTemplates: (readonly [string, number])[];
  tradeRouteEdges: number;
}

interface SeedCensus {
  seed: number;
  ticks: number;
  overall: RolledSplit;
  wanderer: RolledSplit;
  established: RolledSplit;
  composition: Composition;
  distinctBands: number;
  decisionMix: {
    decisions: number;
    agreementRate: number;
    undertakingShare: number;
    encounterShare: number;
    idleShare: number;
  } | undefined;
  gates: Record<string, { pass: boolean; detail: string }>;
}

// ─── Arg parsing ──────────────────────────────────────────────────

function parseArgs(): { seeds: number[]; ticks: number; map: MapSizePreset; json: boolean } {
  const argv = process.argv.slice(2);
  let seeds = [...CENSUS_DEFAULT_SEEDS];
  let ticks = CENSUS_DEFAULT_TICKS;
  let map: MapSizePreset = 'medium';
  let json = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--seeds' && i + 1 < argv.length) {
      seeds = argv[++i].split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    } else if (arg === '--ticks' && i + 1 < argv.length) {
      const t = parseInt(argv[++i], 10);
      if (!isNaN(t) && t > 0) ticks = t;
    } else if (arg === '--map' && i + 1 < argv.length) {
      map = argv[++i] as MapSizePreset;
    } else if (arg === '--json') {
      json = true;
    }
  }
  return { seeds, ticks, map, json };
}

// ─── Measurement ──────────────────────────────────────────────────

function emptySplit(): RolledSplit {
  return { checkpoints: 0, rolled: 0, rolledShare: undefined, bands: {}, deferrals: {} };
}

/**
 * `unrecorded` is kept as a live bucket rather than removed once the known
 * non-rolling reasons are enumerated. It is what surfaced the `actor_lost` gap:
 * that site emitted a row carrying neither `band` nor `deferred`, and a census
 * that silently folded such rows into a named reason would have reported a
 * tidier number and hidden the defect. An unnamed outcome should be visible as
 * unnamed.
 */
function record(
  split: RolledSplit,
  band: string | undefined,
  deferred: string | undefined,
  ended: string | undefined,
): void {
  split.checkpoints++;
  if (band) {
    split.rolled++;
    split.bands[band] = (split.bands[band] ?? 0) + 1;
  } else {
    const reason = deferred ?? (ended ? `ended:${ended}` : 'unrecorded');
    split.deferrals[reason] = (split.deferrals[reason] ?? 0) + 1;
  }
}

function finalize(split: RolledSplit): void {
  split.rolledShare = split.checkpoints > 0 ? split.rolled / split.checkpoints : undefined;
}

function censusOneSeed(seed: number, ticks: number, map: MapSizePreset): SeedCensus {
  resetEventCounter();
  resetReputationTraitInit();
  enableTracing();

  const overall = emptySplit();
  const wanderer = emptySplit();
  const established = emptySplit();
  const allBands = new Set<string>();
  const startsByTemplate = new Map<string, number>();

  try {
    const runtime = createSimulationRuntime();
    const preset = MAP_SIZE_PRESETS[map];
    const archetype = generateArchetypes(4, seed)[0];
    let { state } = initializeGameState(
      archetype, 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows,
    );

    for (let i = 0; i < ticks; i++) {
      // Drained per tick. The trace buffer is a ring; an end-of-run read reports
      // only the tail, which under-counted a prior census by 15× (impediment #822).
      clearTraces();
      state = runTick(state, [], runtime);
      for (const t of getTraces()) {
        const a = t as unknown as Record<string, unknown>;

        if (a.category === 'strategic_action_started') {
          const id = a.templateId as string | undefined;
          if (id) startsByTemplate.set(id, (startsByTemplate.get(id) ?? 0) + 1);
          continue;
        }

        if (a.category !== 'undertaking_checkpoint') continue;
        const band = a.band as string | undefined;
        const deferred = a.deferred as string | undefined;
        const ended = a.ended as string | undefined;
        const family = TEMPLATE_FAMILY.get(a.templateId as string);

        record(overall, band, deferred, ended);
        record(family === WANDERER_FAMILY ? wanderer : established, band, deferred, ended);
        if (band) allBands.add(band);
      }
    }

    [overall, wanderer, established].forEach(finalize);

    const composition: Composition = {
      starts: [...startsByTemplate.values()].reduce((a, b) => a + b, 0),
      distinctTemplates: startsByTemplate.size,
      topTemplates: [...startsByTemplate.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, CENSUS_COMPOSITION_REPORT_TOP_N),
      tradeRouteEdges: state.graph.getEdgesByType('trades_with').length,
    };

    const summary = buildBalanceRunSummary(runtime, state.tick);
    const sb = summary?.shadowBoard;

    const census: SeedCensus = {
      seed,
      ticks,
      overall,
      wanderer,
      established,
      composition,
      distinctBands: allBands.size,
      decisionMix: sb
        ? {
          decisions: sb.decisions,
          agreementRate: sb.agreementRate,
          undertakingShare: sb.undertakingShare,
          encounterShare: sb.encounterShare,
          idleShare: sb.idleShare,
        }
        : undefined,
      gates: {},
    };
    census.gates = evaluateGates(census);
    return census;
  } finally {
    disableTracing();
  }
}

// ─── Gates ────────────────────────────────────────────────────────

function evaluateGates(c: SeedCensus): Record<string, { pass: boolean; detail: string }> {
  const gates: Record<string, { pass: boolean; detail: string }> = {};
  const pct = (n: number | undefined): string => (n === undefined ? 'n/a' : `${(n * 100).toFixed(1)}%`);

  // Liveness. An absent population fails rather than passes — a census over zero
  // checkpoints reporting "≥50% rolled" is the vacuous-probe shape, not a result.
  gates['checkpoints fired'] = {
    pass: c.overall.checkpoints > 0,
    detail: `${c.overall.checkpoints} checkpoints`,
  };
  gates['rolled share ≥ 50%'] = {
    pass: c.overall.rolledShare !== undefined && c.overall.rolledShare >= CENSUS_ROLLED_SHARE_FLOOR,
    detail: `${pct(c.overall.rolledShare)} (${c.overall.rolled}/${c.overall.checkpoints})`,
  };
  gates['ladder exercised'] = {
    pass: c.distinctBands > 1,
    detail: `${c.distinctBands} distinct bands`,
  };

  // Cutover envelope. `undefined` fails: absence is not a passing idle share.
  const m = c.decisionMix;
  const [lo, hi] = BOARD_UNDERTAKING_SHARE_RANGE;
  gates[`undertaking share in [${lo}, ${hi}]`] = {
    pass: m !== undefined && m.undertakingShare >= lo && m.undertakingShare <= hi,
    detail: m ? pct(m.undertakingShare) : 'no board verdicts',
  };
  gates[`encounter share ≥ ${BOARD_ENCOUNTER_SHARE_FLOOR}`] = {
    pass: m !== undefined && m.encounterShare >= BOARD_ENCOUNTER_SHARE_FLOOR,
    detail: m ? pct(m.encounterShare) : 'no board verdicts',
  };
  gates[`idle share ≤ ${BOARD_IDLE_SHARE_CEILING}`] = {
    pass: m !== undefined && m.idleShare <= BOARD_IDLE_SHARE_CEILING,
    detail: m ? pct(m.idleShare) : 'no board verdicts',
  };

  // Composition (THR-1349). The three gates above are ratios *between* families
  // and are all satisfiable by an undertaking family that has collapsed onto one
  // template. This one reads inside that family.
  //
  // Zero starts fails rather than passes, for the same reason the liveness gate
  // treats an empty population as a failure: "0 distinct templates" is not a
  // variety verdict, it is the absence of one.
  //
  // `tradeRouteEdges` is deliberately **reported and not gated** — see
  // `CENSUS_DISTINCT_TEMPLATE_FLOOR`. Gating it would red the census on the
  // currently shipped `'shadow'` configuration, where seed 99 already writes zero.
  const comp = c.composition;
  gates[`distinct templates started ≥ ${CENSUS_DISTINCT_TEMPLATE_FLOOR}`] = {
    pass: comp.starts > 0 && comp.distinctTemplates >= CENSUS_DISTINCT_TEMPLATE_FLOOR,
    detail: `${comp.distinctTemplates} distinct of ${comp.starts} starts`,
  };
  return gates;
}

// ─── Report ───────────────────────────────────────────────────────

function topEntries(rec: Record<string, number>, n = 4): string {
  const entries = Object.entries(rec).sort((a, b) => b[1] - a[1]).slice(0, n);
  return entries.length ? entries.map(([k, v]) => `${k} ${v}`).join(', ') : '—';
}

function reportSplit(label: string, s: RolledSplit): void {
  const share = s.rolledShare === undefined ? 'n/a' : `${(s.rolledShare * 100).toFixed(1)}%`;
  console.log(`  ${label.padEnd(14)} ${String(s.rolled).padStart(5)}/${String(s.checkpoints).padEnd(6)} rolled ${share.padStart(6)}`);
  console.log(`  ${''.padEnd(14)} bands: ${topEntries(s.bands)}`);
  console.log(`  ${''.padEnd(14)} deferrals: ${topEntries(s.deferrals)}`);
}

function report(all: SeedCensus[]): boolean {
  let allPass = true;
  for (const c of all) {
    console.log(`\n─── seed ${c.seed} · ${c.ticks} ticks ───────────────────────────`);
    console.log('\nCheckpoint liveness');
    reportSplit('corpus', c.overall);
    reportSplit('wanderer', c.wanderer);
    reportSplit('established', c.established);

    console.log('\nDecision mix (shadow board)');
    if (c.decisionMix) {
      const m = c.decisionMix;
      console.log(`  decisions ${m.decisions}  agreement ${(m.agreementRate * 100).toFixed(1)}%`);
      console.log(`  undertaking ${(m.undertakingShare * 100).toFixed(1)}%  encounter ${(m.encounterShare * 100).toFixed(1)}%  idle ${(m.idleShare * 100).toFixed(1)}%`);
    } else {
      console.log('  no board verdicts — the board did not run');
    }

    console.log('\nUndertaking composition');
    const comp = c.composition;
    console.log(`  ${comp.starts} starts across ${comp.distinctTemplates} distinct templates · ${comp.tradeRouteEdges} trades_with edges`);
    console.log(`  top: ${comp.topTemplates.length
      ? comp.topTemplates.map(([id, n]) => `${id} ${n}`).join(', ')
      : '—'}`);

    console.log('\nGates');
    for (const [name, g] of Object.entries(c.gates)) {
      if (!g.pass) allPass = false;
      console.log(`  ${g.pass ? 'PASS' : 'FAIL'}  ${name.padEnd(32)} ${g.detail}`);
    }
  }
  console.log(`\n═══ census verdict: ${allPass ? 'PASS' : 'FAIL'} (all seeds, all gates) ═══\n`);
  return allPass;
}

// ─── Main ─────────────────────────────────────────────────────────

const args = parseArgs();
const results = args.seeds.map(s => censusOneSeed(s, args.ticks, args.map));

if (args.json) {
  console.log(JSON.stringify({ seeds: args.seeds, ticks: args.ticks, map: args.map, results }, null, 2));
} else {
  console.log(`\nUndertaking census — seeds [${args.seeds.join(', ')}] × ${args.ticks} ticks · ${args.map}`);
  report(results);
}
