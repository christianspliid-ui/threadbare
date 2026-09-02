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
import { isAutonomousDecisionActor } from '../src/engine/strategicKindReachability';
import {
  BOARD_UNDERTAKING_SHARE_RANGE,
  BOARD_ENCOUNTER_SHARE_FLOOR,
  BOARD_IDLE_SHARE_CEILING,
  CENSUS_STARTS_PER_MORTAL_PER_100_TICKS_FLOOR,
  CENSUS_VARIETY_SAMPLE_STARTS,
  CENSUS_DISTINCT_AT_SAMPLE_FLOOR,
  CENSUS_MAX_ACTIVE_PER_MORTAL_CEILING,
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

/**
 * How many mortals the concurrency line names, busiest first. The gate on the
 * busiest one is `CENSUS_MAX_ACTIVE_PER_MORTAL_CEILING` (THR-1387); the list is
 * so a reader sees the shape, not only the maximum.
 */
const CENSUS_CONCURRENCY_REPORT_TOP_N = 8;

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
  /**
   * Distinct templates among the first `CENSUS_VARIETY_SAMPLE_STARTS` starts — the
   * variety measure that does not track sample size (THR-1349, fourth pass).
   */
  distinctInSample: number;
  /** Start count per template, descending — the shape a collapse is visible in. */
  topTemplates: (readonly [string, number])[];
  tradeRouteEdges: number;
  /** Mean count of `isAutonomousDecisionActor` mortals sampled at each tick start. */
  meanAutonomousMortals: number;
  /** `starts / meanAutonomousMortals / (ticks / 100)` — the per-mortal throughput. */
  startsPerMortalPer100Ticks: number;
  /**
   * Active undertakings per mortal, reported never gated (THR-1387 owns the cap):
   * the busiest mortals at run end, and the mean active count over all ticks.
   */
  concurrency: { maxAtEnd: number; topAtEnd: number[]; meanActive: number };
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
  const sampleTemplates = new Set<string>();
  let starts = 0;
  let autonomousSum = 0;
  let activeSum = 0;

  try {
    const runtime = createSimulationRuntime();
    const preset = MAP_SIZE_PRESETS[map];
    const archetype = generateArchetypes(4, seed)[0];
    let { state } = initializeGameState(
      archetype, 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows,
    );

    for (let i = 0; i < ticks; i++) {
      // The population the decision loop runs over, sampled at tick start with the
      // same predicate the loop uses (THR-1329), so the per-mortal rate below is a
      // rate over the mortals who could have started anything.
      autonomousSum += state.graph.getNodesByType('actor').filter(isAutonomousDecisionActor).length;
      activeSum += (state.strategicState?.projects ?? []).filter(p => p.status === 'active').length;

      // Drained per tick. The trace buffer is a ring; an end-of-run read reports
      // only the tail, which under-counted a prior census by 15× (impediment #822).
      clearTraces();
      state = runTick(state, [], runtime);
      for (const t of getTraces()) {
        const a = t as unknown as Record<string, unknown>;

        if (a.category === 'strategic_action_started') {
          const id = a.templateId as string | undefined;
          if (id) {
            startsByTemplate.set(id, (startsByTemplate.get(id) ?? 0) + 1);
            starts += 1;
            if (starts <= CENSUS_VARIETY_SAMPLE_STARTS) sampleTemplates.add(id);
          }
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

    const meanAutonomousMortals = ticks > 0 ? autonomousSum / ticks : 0;
    const perMortal = new Map<string, number>();
    for (const p of (state.strategicState?.projects ?? []).filter(p => p.status === 'active')) {
      perMortal.set(p.actorId, (perMortal.get(p.actorId) ?? 0) + 1);
    }
    const topAtEnd = [...perMortal.values()].sort((a, b) => b - a).slice(0, CENSUS_CONCURRENCY_REPORT_TOP_N);

    const composition: Composition = {
      starts,
      distinctTemplates: startsByTemplate.size,
      distinctInSample: sampleTemplates.size,
      topTemplates: [...startsByTemplate.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, CENSUS_COMPOSITION_REPORT_TOP_N),
      tradeRouteEdges: state.graph.getEdgesByType('trades_with').length,
      meanAutonomousMortals,
      startsPerMortalPer100Ticks:
        meanAutonomousMortals > 0 && ticks > 0 ? starts / meanAutonomousMortals / (ticks / 100) : 0,
      concurrency: {
        maxAtEnd: topAtEnd[0] ?? 0,
        topAtEnd,
        meanActive: ticks > 0 ? activeSum / ticks : 0,
      },
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

  // Composition (THR-1349, fourth pass). The three gates above are ratios *between*
  // families and are all satisfiable by an undertaking family that has collapsed
  // onto one template. This one reads inside that family — at a FIXED start sample,
  // because the run-total distinct count the earlier gate used tracks sample size
  // (39 over 495 starts passed as readily as 48 over 891). See
  // `CENSUS_VARIETY_SAMPLE_STARTS` / `CENSUS_DISTINCT_AT_SAMPLE_FLOOR`.
  //
  // A run that never fills the sample fails rather than passes, for the same reason
  // the liveness gate treats an empty population as a failure: variety over a
  // half-filled sample is not a variety verdict, it is a throughput one wearing the
  // wrong name — and the throughput gate below is where that belongs.
  //
  // `tradeRouteEdges` is deliberately **reported and not gated**: the healthy
  // baseline is 1 and 0 on the two seeds, and THR-1348 owns the route economy.
  const comp = c.composition;
  gates[`distinct templates in first ${CENSUS_VARIETY_SAMPLE_STARTS} starts ≥ ${CENSUS_DISTINCT_AT_SAMPLE_FLOOR}`] = {
    pass: comp.starts >= CENSUS_VARIETY_SAMPLE_STARTS && comp.distinctInSample >= CENSUS_DISTINCT_AT_SAMPLE_FLOOR,
    detail: comp.starts >= CENSUS_VARIETY_SAMPLE_STARTS
      ? `${comp.distinctInSample} distinct in the first ${CENSUS_VARIETY_SAMPLE_STARTS} of ${comp.starts} starts`
      : `only ${comp.starts} starts — sample of ${CENSUS_VARIETY_SAMPLE_STARTS} never filled`,
  };

  // Throughput (THR-1349, fourth pass), stated per spotlight mortal rather than as
  // an absolute count. The absolute floor this replaces (`700`) was sized against
  // contest B's 892 starts, which the design session measured as a stacking
  // artefact — one mortal carrying up to eleven concurrent undertakings. A rate
  // over the mortals the decision loop actually runs is a statement about a life;
  // see `CENSUS_STARTS_PER_MORTAL_PER_100_TICKS_FLOOR` for the derivation. A zero
  // population fails loudly rather than dividing to a pass.
  gates[`starts per mortal per 100 ticks ≥ ${CENSUS_STARTS_PER_MORTAL_PER_100_TICKS_FLOOR}`] = {
    pass: comp.meanAutonomousMortals > 0
      && comp.startsPerMortalPer100Ticks >= CENSUS_STARTS_PER_MORTAL_PER_100_TICKS_FLOOR,
    detail: comp.meanAutonomousMortals > 0
      ? `${comp.startsPerMortalPer100Ticks.toFixed(1)} (${comp.starts} starts over ${comp.meanAutonomousMortals.toFixed(1)} mortals × ${c.ticks} ticks)`
      : 'no autonomous mortals sampled',
  };

  // Concurrency (THR-1387). The cap is enforced at candidate generation
  // (`UNDERTAKING_MAX_ACTIVE_PER_ACTOR`); this reads the number it enforces, so a
  // start path that bypasses generation reds the census instead of quietly printing
  // a larger top-8. A run with no starts passes vacuously here and fails the
  // throughput gate above, which is the gate that owns that failure.
  gates[`active undertakings per mortal ≤ ${CENSUS_MAX_ACTIVE_PER_MORTAL_CEILING}`] = {
    pass: comp.concurrency.maxAtEnd <= CENSUS_MAX_ACTIVE_PER_MORTAL_CEILING,
    detail: `max ${comp.concurrency.maxAtEnd} at run end, busiest [${comp.concurrency.topAtEnd.join(', ')}]`,
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
    console.log(`  ${comp.starts} starts across ${comp.distinctTemplates} distinct templates (${comp.distinctInSample} in the first ${CENSUS_VARIETY_SAMPLE_STARTS}) · ${comp.tradeRouteEdges} trades_with edges`);
    console.log(`  top: ${comp.topTemplates.length
      ? comp.topTemplates.map(([id, n]) => `${id} ${n}`).join(', ')
      : '—'}`);
    console.log(`  per mortal: ${comp.startsPerMortalPer100Ticks.toFixed(1)} starts per 100 ticks over ${comp.meanAutonomousMortals.toFixed(1)} autonomous mortals`);
    console.log(`  concurrency (cap ${CENSUS_MAX_ACTIVE_PER_MORTAL_CEILING}, THR-1387): max ${comp.concurrency.maxAtEnd} active at run end, busiest [${comp.concurrency.topAtEnd.join(', ')}], mean ${comp.concurrency.meanActive.toFixed(1)} active per tick`);

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
