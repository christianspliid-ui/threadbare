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
 * ## The eviction caveat, stated because it changes how the output is read
 *
 * The trace buffer is a 2000-entry ring. Over a long run the early ticks' traces are
 * evicted, so a site that fired only at tick 3 can read as zero-hit at tick 200. That
 * biases the report toward **over**-reporting dead sites, never under-reporting them:
 * a site listed here may be alive-but-early, and a site absent from the list is certainly
 * alive. `--ticks` is what you lower to check a suspected false positive.
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
import { clearTraces, enableTracing, getTraces } from '../src/engine/traceBuffer';
import { CONTENT_QUERY_SITES, type ContentQuerySite } from '../src/types/contentQuery';
import { buildViews } from './generate-content-tag-catalog.js';

// ─── Tunable constants (NFP #1) ─────────────────────────────────────

/** Ticks the census runs, per the plan's "seeded 200-tick run". */
export const CENSUS_DEFAULT_TICKS = 200;
export const CENSUS_DEFAULT_SEED = 42;
export const CENSUS_DEFAULT_MAP: MapSizePreset = 'medium';

// ─── Shapes ─────────────────────────────────────────────────────────

export interface SiteCensusRow {
  readonly site: ContentQuerySite;
  readonly resolved: number;
  readonly empty: number;
  /** No trace of either kind reached the buffer for this site. */
  readonly silent: boolean;
}

export interface ContentModelCensus {
  readonly ticks: number;
  readonly seed: number;
  readonly deadTags: readonly string[];
  readonly liveTags: number;
  readonly sites: readonly SiteCensusRow[];
}

/**
 * Fold a run's `content.query_*` traces into one row per site.
 *
 * Pure and separately exported so a test can reach it: the run itself boots a world,
 * which no test wants, and the judgement worth pinning is the fold rather than the world.
 */
export function censusSites(
  traces: readonly { category?: string; site?: string }[],
): readonly SiteCensusRow[] {
  return CONTENT_QUERY_SITES.map((site): SiteCensusRow => {
    const resolved = traces.filter(
      t => t.category === 'content.query_resolved' && t.site === site,
    ).length;
    const empty = traces.filter(
      t => t.category === 'content.query_empty' && t.site === site,
    ).length;
    return { site, resolved, empty, silent: resolved === 0 && empty === 0 };
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
  }

  const traces = getTraces() as unknown as readonly { category?: string; site?: string }[];

  return {
    ticks,
    seed,
    deadTags,
    liveTags: views.length - deadTags.length,
    sites: censusSites(traces),
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
  lines.push('| Site | Resolved | Empty | Verdict |');
  lines.push('|---|---|---|---|');
  for (const row of census.sites) {
    const verdict = row.silent
      ? '⚠️ no hits'
      : row.resolved === 0
        ? '⚠️ only empty resolutions'
        : 'live';
    lines.push(`| \`${row.site}\` | ${row.resolved} | ${row.empty} | ${verdict} |`);
  }
  lines.push('');

  const silent = census.sites.filter(row => row.silent && row.site !== 'debug');
  if (silent.length > 0) {
    lines.push(
      `> ⚠️ ${silent.length} site(s) produced no hits: `
        + `${silent.map(row => `\`${row.site}\``).join(', ')}. A site is silent because it is `
        + 'unreachable from the live board or because nothing authors a query there — those '
        + 'want opposite fixes, so check reachability before reading it as a content gap. '
        + 'Note the buffer is a 2000-entry ring: a site that fired only in the opening ticks '
        + 'can read as silent at 200. Re-run with a lower `--ticks` to tell them apart.',
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
