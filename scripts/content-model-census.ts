/**
 * `check:content-model-census` — the weekly hygiene routine's content-model report
 * (THR-1489, slice 5 of THR-1481).
 *
 * **Not to be confused with `content-census.ts`** (THR-473), which measures the reach × scale
 * coverage of the corpus. That one asks *"is the content spread evenly?"*; this one asks
 * *"is the content **model** — the tag vocabulary and the content query — actually reached?"*
 * Different subject, different output, deliberately distinct names.
 *
 * Two questions, both about whether the model is *reached* rather than merely present, and
 * both answerable only by measurement:
 *
 *   1. **Which tags are DEAD?** A tag with {@link CONTENT_TAG_DEAD_BEARERS} effective
 *      bearers is a query nothing can answer: an author writes it, gets an empty pool,
 *      and no error fires. Counted through the catalog generator's own `buildViews`,
 *      never a second walk — a census that disagreed with the generated catalog would be
 *      the drift it exists to find.
 *   2. **Which query sites got no hits?** Over a seeded run, off the trace buffer. A site
 *      with zero hits is either unreachable (the THR-1497 shape) or unauthored, and the
 *      two want opposite responses — so the report says which sites, and the reader
 *      decides.
 *
 * **Why this is a script and not a line in the lane's prompt.** The plan asks the weekly
 * hygiene report to "gain DEAD tags and query sites with zero hits". A prompt instructing
 * an agent to go and count is a rule that rots the first week nobody runs it, and its
 * failure is silent. A script is re-runnable, diffable, and fails loudly when the thing it
 * counts stops existing. The prompt points here.
 *
 * ## Two sources, and which rows come from which (THR-1514)
 *
 * The trace buffer is a 2000-entry ring. A seeded medium world emits ~255 traces a tick
 * (51,069 over 200 ticks, measured 2026-09-18), so one read at the end sees the last
 * 2,000 of them and nothing else. The first draft of this census read the ring once at
 * tick 200 and reported `undertaking_catalyst` at 0 / 0 on a run where the state showed
 * catalyst seeds spawn an errand; that undercount is the shape that minted a false engine
 * bug (THR-1510, impediment row 1049). A burst inside one tick *can* exceed the ring —
 * the report prints how many entries were emitted and evicted before any read.
 *
 * The two seeding sites — `encounter_seed` and `undertaking_catalyst` — are therefore
 * counted **off state**: every seed that leaves `pendingEncounterSeeds` writes a
 * suffixed `TickEvent` naming how (`seed-consumption-ledger.ts`), and a ledger that
 * observes the state after every tick sees each one exactly once. Those rows count
 * *seeds* (one per seed, resolved or empty), never query executions — a seed whose
 * target is busy re-asks its query each tick and would inflate a trace count.
 *
 * The remaining sites have no durable state record and are counted off the ring,
 * harvested **after every tick** on the monotonic emit count (`ring-harvest.ts` — the
 * ring renumbers ids after eviction, so an id-keyed harvest stops at the first one).
 * That is a lower bound: a burst inside one tick can still evict its own early traces.
 * The report says which source each row came from, so a reader never mistakes a ring
 * floor for a state count.
 *
 * Usage:
 *   npm run check:content-model-census
 *   npm run check:content-model-census -- --ticks 200 --seed 42 --map medium
 *   npm run check:content-model-census -- --json
 *
 * Exit code is always 0: this reports, it does not gate. Two consecutive *batches*
 * authoring zero queries is the retro's "dead primitive" finding, and that judgement is a
 * human's to make with this report in hand — not a build failure.
 */
import path from 'node:path';
import process from 'node:process';

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick } from '../src/engine/orchestrator';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { clearTraces, enableTracing } from '../src/engine/traceBuffer';
import { CONTENT_QUERY_SITES, type ContentQuerySite } from '../src/types/contentQuery';
import type { GameState } from '../src/types/gameState';
import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import { systemConnections } from '../src/data/content-eval/compositionContract';
import { buildViews } from './generate-content-tag-catalog.js';
import { createRingHarvester } from './ring-harvest.js';
import {
  SeedConsumptionLedger,
  queryOutcomeOf,
  type SeedConsumptionRecord,
  type SeedLedgerSummary,
} from './seed-consumption-ledger.js';

// ─── Tunable constants (NFP #1) ─────────────────────────────────────

/** Ticks the census runs, per the plan's "seeded 200-tick run". */
export const CENSUS_DEFAULT_TICKS = 200;
export const CENSUS_DEFAULT_SEED = 42;
export const CENSUS_DEFAULT_MAP: MapSizePreset = 'medium';

/**
 * The sites whose rows are decided off state (THR-1514): the two a seed's resolution
 * is traced at (`seedQuerySite`). Every other site has no durable record and is
 * counted off the per-tick ring harvest.
 */
export const STATE_SOURCED_SITES: readonly ContentQuerySite[] = ['encounter_seed', 'undertaking_catalyst'];

// ─── Shapes ─────────────────────────────────────────────────────────

export type SiteCensusSource = 'state' | 'ring';

export interface SiteCensusRow {
  readonly site: ContentQuerySite;
  readonly resolved: number;
  readonly empty: number;
  /** Nothing — on state or on the ring — reached this site. */
  readonly silent: boolean;
  /** Where `resolved` / `empty` were read: seed consumption on state, or the trace ring. */
  readonly source: SiteCensusSource;
  /**
   * What the ring alone saw, kept beside a state-sourced row so the eviction gap is
   * visible in the report rather than silently corrected away.
   */
  readonly ring?: { readonly resolved: number; readonly empty: number };
}

/**
 * The appointment counters (THR-1518) — the reachability row for THR-1479.
 *
 * All **off state**, the THR-1514 discipline: `planted` is every seed observed in
 * `pendingEncounterSeeds` carrying an `appointment` block over the run; `kept` and
 * `missed` are the `appointment_kept` / `appointment_missed` Event nodes on the
 * graph at the end (the seeding phase writes one per judgement, and Event nodes are
 * never pruned). `authored` is read off the corpus through `systemConnections`, the
 * same predicate the quota and the live proof use, so the three surfaces cannot
 * disagree about what "authors an appointment" means.
 *
 * `reachability` is the row the plan carried that the ticket did not: a **hit** is a
 * planted appointment on a seeded run — proof that the site the live board walks
 * actually reaches one, which no gate that reads the code can give (THR-1497). Zero
 * planted with authored > 0 is *unreached*, and zero authored is *dead* — the retro's
 * "dead primitive" finding once it holds across two batches.
 */
export interface AppointmentCensus {
  readonly authored: number;
  readonly authoredBy: readonly string[];
  /**
   * How many times a template that authors an appointment was *spawned* on the run
   * (state-sourced: new `unifiedActions` per tick). Separates the two causes an
   * UNREACHED verdict can have — the parent never fired on this seed, or it fired
   * and the planting path (a branch, a reaction) was not the one taken.
   */
  readonly parentsFired: number;
  readonly planted: number;
  readonly kept: number;
  readonly missed: number;
  readonly missedByReason: Readonly<Record<string, number>>;
  readonly reachability: 'hit' | 'unreached' | 'dead';
}

export interface ContentModelCensus {
  readonly ticks: number;
  readonly seed: number;
  readonly deadTags: readonly string[];
  readonly liveTags: number;
  readonly sites: readonly SiteCensusRow[];
  /** The seed ledger's tallies — the state-derived recount behind the two seeding rows. */
  readonly seeds?: SeedLedgerSummary;
  /** What the per-tick ring harvest saw, and how many entries it provably missed. */
  readonly ring?: { readonly harvested: number; readonly evictedUnseen: number };
  /** Appointments authored / planted / kept / missed — the THR-1479 reachability row. */
  readonly appointments?: AppointmentCensus;
}

/** The shape of an Event node as {@link foldAppointments} reads it. */
export interface AppointmentEventLike {
  readonly eventType?: unknown;
  readonly reason?: unknown;
}

/**
 * Fold the appointment counters from what the run observed.
 *
 * Pure and separately exported so a test can reach it: the run boots a world, and
 * the judgement worth pinning is the fold — that a planted appointment reads as a
 * **hit**, that zero planted with authored users reads as *unreached* rather than
 * vanishing, and that zero authored reads as *dead*.
 */
export function foldAppointments(
  authoredBy: readonly string[],
  plantedSeedIds: ReadonlySet<string>,
  events: readonly AppointmentEventLike[],
  parentsFired = 0,
): AppointmentCensus {
  const kept = events.filter(e => e.eventType === 'appointment_kept').length;
  const missedEvents = events.filter(e => e.eventType === 'appointment_missed');
  const missedByReason: Record<string, number> = {};
  for (const e of missedEvents) {
    const reason = typeof e.reason === 'string' ? e.reason : 'unknown';
    missedByReason[reason] = (missedByReason[reason] ?? 0) + 1;
  }
  const authored = [...authoredBy].sort();
  return {
    authored: authored.length,
    authoredBy: authored,
    parentsFired,
    planted: plantedSeedIds.size,
    kept,
    missed: missedEvents.length,
    missedByReason,
    reachability: authored.length === 0 ? 'dead' : plantedSeedIds.size > 0 ? 'hit' : 'unreached',
  };
}

/**
 * Fold a run into one row per site.
 *
 * `traces` are the `content.query_*` traces the run harvested; `seedRecords`, when
 * given, are the ledger's per-seed consumptions and decide the two seeding sites'
 * rows off state (THR-1514). Without them every row is ring-sourced, which is what a
 * caller with no world in hand gets.
 *
 * Pure and separately exported so a test can reach it: the run itself boots a world,
 * which no test wants, and the judgement worth pinning is the fold rather than the world.
 */
export function censusSites(
  traces: readonly { category?: string; site?: string }[],
  seedRecords?: readonly SeedConsumptionRecord[],
): readonly SiteCensusRow[] {
  return CONTENT_QUERY_SITES.map((site): SiteCensusRow => {
    const ringResolved = traces.filter(
      t => t.category === 'content.query_resolved' && t.site === site,
    ).length;
    const ringEmpty = traces.filter(
      t => t.category === 'content.query_empty' && t.site === site,
    ).length;
    if (seedRecords && STATE_SOURCED_SITES.includes(site)) {
      const outcomes = seedRecords.filter(r => r.site === site).map(queryOutcomeOf);
      const resolved = outcomes.filter(o => o === 'resolved').length;
      const empty = outcomes.filter(o => o === 'empty').length;
      return {
        site,
        resolved,
        empty,
        silent: resolved === 0 && empty === 0 && ringResolved === 0 && ringEmpty === 0,
        source: 'state',
        ring: { resolved: ringResolved, empty: ringEmpty },
      };
    }
    return {
      site,
      resolved: ringResolved,
      empty: ringEmpty,
      silent: ringResolved === 0 && ringEmpty === 0,
      source: 'ring',
    };
  });
}

// ─── Run ────────────────────────────────────────────────────────────

export function runCensus(
  ticks: number,
  seed: number,
  map: MapSizePreset,
): ContentModelCensus {
  const { views } = buildViews();
  const deadTags = views.filter(view => view.dead).map(view => view.def.tag).sort();

  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, seed)[0];
  const preset = MAP_SIZE_PRESETS[map];
  const { state: initial } = initializeGameState(
    archetype,
    'ContentModelCensus',
    createBalancedCosmology(),
    seed,
    preset.cols,
    preset.rows,
  );

  enableTracing();
  clearTraces();

  // The ring is harvested after every tick (keyed on the monotonic emit count, never
  // on the renumbered ids), and the seed ledger observes every state — see the header
  // for why one read at the end is not a census (THR-1514).
  const harvester = createRingHarvester();
  const ledger = new SeedConsumptionLedger();
  ledger.observe(initial);

  // THR-1518 — every appointment seed ever seen pending, off state, per tick. A seed
  // planted and judged inside one tick would be missed by an end read; per-tick
  // observation is the same discipline the ledger applies to consumptions.
  const authoredBy = UNIFIED_ACTION_TEMPLATES
    .filter(template => systemConnections(template).includes('appointments'))
    .map(template => template.id);
  const authoredSet = new Set(authoredBy);
  const plantedAppointments = new Set<string>();
  const parentActions = new Set<string>();
  const observeAppointments = (s: GameState): void => {
    for (const pending of s.pendingEncounterSeeds ?? []) {
      if (pending.appointment) plantedAppointments.add(pending.seedId);
    }
    for (const action of s.unifiedActions) {
      if (authoredSet.has(action.templateId)) parentActions.add(action.actionId);
    }
  };
  observeAppointments(initial);

  let state = initial;
  for (let tick = 0; tick < ticks; tick++) {
    // Fail-soft (NFP #4): a throw mid-run is a result, not a crash of the census —
    // the sites that fired before it are still the honest answer for those ticks.
    try {
      state = runTick(state, [], runtime);
    } catch (error) {
      console.error(
        `[content-model-census] runTick threw at tick ${tick}: `
          + `${error instanceof Error ? error.message : String(error)} — `
          + 'reporting the traces harvested so far',
      );
      break;
    }
    harvester.harvest();
    ledger.observe(state);
    observeAppointments(state);
  }

  const appointmentEvents = state.graph
    .getNodesByType('event')
    .map(node => node.properties as AppointmentEventLike);

  return {
    ticks,
    seed,
    deadTags,
    liveTags: views.length - deadTags.length,
    sites: censusSites(
      harvester.traces as unknown as readonly { category?: string; site?: string }[],
      ledger.records(),
    ),
    seeds: ledger.summary(),
    ring: { harvested: harvester.traces.length, evictedUnseen: harvester.evictedUnseen },
    appointments: foldAppointments(authoredBy, plantedAppointments, appointmentEvents, parentActions.size),
  };
}

// ─── Render ─────────────────────────────────────────────────────────

export function renderCensus(census: ContentModelCensus): string {
  const lines: string[] = [];
  lines.push('## Content model census');
  lines.push('');
  lines.push(
    `Seed ${census.seed}, ${census.ticks} ticks. `
      + `${census.liveTags} live tag(s), ${census.deadTags.length} DEAD.`,
  );
  lines.push('');

  lines.push('### DEAD tags');
  lines.push('');
  if (census.deadTags.length === 0) {
    lines.push('None — every tag in the vocabulary has at least one bearer.');
  } else {
    lines.push(
      'A tag no entry carries. An author who writes it into a query gets an empty pool '
        + 'and no error, so the retro either finds it a bearer or deletes it.',
    );
    lines.push('');
    for (const tag of census.deadTags) lines.push(`- \`${tag}\``);
  }
  lines.push('');

  lines.push('### Query sites');
  lines.push('');
  lines.push('| Site | Resolved | Empty | Source | Verdict |');
  lines.push('|---|---|---|---|---|');
  for (const row of census.sites) {
    const verdict = row.silent
      ? '⚠️ no hits'
      : row.resolved === 0
        ? '⚠️ only empty resolutions'
        : 'live';
    const source = row.source === 'state'
      ? `state${row.ring ? ` (ring saw ${row.ring.resolved} / ${row.ring.empty})` : ''}`
      : 'ring';
    lines.push(`| \`${row.site}\` | ${row.resolved} | ${row.empty} | ${source} | ${verdict} |`);
  }
  lines.push('');
  lines.push(
    '`state` rows count **seeds** off `state.tickEvents` — one per seed that spawned '
      + '(resolved) or withered (empty) — and are exact. `ring` rows count traces harvested '
      + 'from the 2000-entry ring after every tick and are a **floor**: a burst inside one '
      + 'tick can evict its own early traces, so a `ring` zero is "not seen", never "did not '
      + 'fire". Where a `state` row shows what the ring saw beside it, the gap is the eviction.'
      + (census.ring
        ? ` This run harvested ${census.ring.harvested} trace(s) and ${census.ring.evictedUnseen} `
          + 'more were emitted and evicted before any tick-end read.'
        : ''),
  );
  lines.push('');

  if (census.seeds) {
    const s = census.seeds;
    lines.push('### Seed consumption (state)');
    lines.push('');
    lines.push(
      `${s.observed} seed(s) observed pending: ${s.spawned} spawned, ${s.familyReady} withered `
        + `(family/query resolved empty), ${s.expired} expired, ${s.orphaned} orphaned, `
        + `${s.pending} still pending at the end.`,
    );
    if (s.leftUnexplained > 0) {
      lines.push(
        `> ⚠️ ${s.leftUnexplained} seed(s) left \`pendingEncounterSeeds\` with no consumption `
          + 'event on `state.tickEvents`. That is **unknown**, not a drop: name the seed ids '
          + 'and read the seeding phase before inferring anything.',
      );
    }
    if (s.unregisteredConsumptions > 0) {
      lines.push(
        `> ${s.unregisteredConsumptions} consumption event(s) named a seed the ledger never `
          + 'saw pending (planted and consumed within one tick, or pending before tick 0) — '
          + 'not counted in the rows above.',
      );
    }
    lines.push('');
  }

  if (census.appointments) {
    const a = census.appointments;
    lines.push('### Appointments (state)');
    lines.push('');
    const reasons = Object.entries(a.missedByReason)
      .sort(([x], [y]) => x.localeCompare(y))
      .map(([reason, n]) => `${reason} ${n}`)
      .join(', ');
    lines.push(
      `${a.authored} template(s) author an appointment; their parents fired ${a.parentsFired} `
        + `time(s) on this run, ${a.planted} planted, ${a.kept} kept, ${a.missed} missed`
        + `${a.missed > 0 ? ` (${reasons})` : ''}.`,
    );
    lines.push(
      a.reachability === 'hit'
        ? `**Reachability: HIT** — the live board reached an appointment on a seeded run, which `
          + 'no gate that reads the code can prove (THR-1497). The two THR-1479 interface '
          + 'contracts stand on this row.'
        : a.reachability === 'unreached'
          ? `> ⚠️ **Reachability: UNREACHED** — ${a.authored} template(s) author an appointment and `
            + `none was planted. ${a.parentsFired === 0
              ? 'The parent never fired on this seed (an eligibility or selection question, not a planting one)'
              : `The parent fired ${a.parentsFired} time(s) and the planting path was not taken (a branch or reaction question)`}; `
            + 're-run at another seed before reading it as dead.'
          : '> ⚠️ **Reachability: DEAD** — no template authors an appointment. Two batches at '
            + 'zero is the retro\'s *dead primitive* finding (THR-1479 § Kill criteria); the die '
            + 'floor and the systems-prompt entry are the first suspects.',
    );
    if (a.authored > 0) lines.push(`Authored by: ${a.authoredBy.map(id => `\`${id}\``).join(', ')}.`);
    lines.push(
      'Counted off state: `planted` is every pending seed seen carrying an `appointment` block, '
        + '`kept` / `missed` are the Event nodes the seeding phase writes. Exact, never a ring floor.',
    );
    lines.push('');
  }

  const silent = census.sites.filter(row => row.silent && row.site !== 'debug');
  if (silent.length > 0) {
    lines.push(
      `> ⚠️ ${silent.length} site(s) produced no hits: `
        + `${silent.map(row => `\`${row.site}\``).join(', ')}. A site is silent because it is `
        + 'unreachable from the live board or because nothing authors a query there — those '
        + 'want opposite fixes, so check reachability before reading it as a content gap. '
        + 'A `state`-sourced silence is exact; a `ring`-sourced one is bounded by the '
        + '2000-entry ring and can hide a site that fired inside a busy tick — re-run with a '
        + 'lower `--ticks` to tell them apart.',
    );
    lines.push('');
  }

  return lines.join('\n');
}

// ─── CLI ────────────────────────────────────────────────────────────

function parseArgs(argv: readonly string[]) {
  let ticks = CENSUS_DEFAULT_TICKS;
  let seed = CENSUS_DEFAULT_SEED;
  let map: MapSizePreset = CENSUS_DEFAULT_MAP;
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--ticks') { ticks = Number(argv[++i]); continue; }
    if (arg === '--seed') { seed = Number(argv[++i]); continue; }
    if (arg === '--map') { map = argv[++i] as MapSizePreset; continue; }
    if (arg === '--json') { json = true; continue; }
    console.error(`unknown argument ${arg}`);
    process.exit(2);
  }
  if (!Number.isFinite(ticks) || ticks <= 0) { console.error('--ticks needs a positive number'); process.exit(2); }
  if (!Number.isFinite(seed)) { console.error('--seed needs a number'); process.exit(2); }
  if (!(map in MAP_SIZE_PRESETS)) { console.error(`--map must be one of ${Object.keys(MAP_SIZE_PRESETS).join(', ')}`); process.exit(2); }
  return { ticks, seed, map, json };
}

// Entry guard on the basename, not `import.meta.url`: esbuild rewrites the latter
// inside a bundle (THR-686). The prefix is the full name, so the THR-473
// `content-census` bundle cannot match it and neither can match the other.
const entryBasename = path.basename(process.argv[1] ?? '');
if (entryBasename.startsWith('content-model-census')) {
  const { ticks, seed, map, json } = parseArgs(process.argv.slice(2));
  const census = runCensus(ticks, seed, map);
  console.log(json ? JSON.stringify(census, null, 2) : renderCensus(census));
}
