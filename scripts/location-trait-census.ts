/**
 * Location-trait pool census — THR-790, the parent plan's kill-criterion instrument.
 *
 * The traits-trigger architecture (`Docs/plans/2026-07-26-traits-trigger-architecture.md`
 * § Kill criteria) bet the whole trait layer on one measurable claim: *if wave-2
 * location traits ship and no behaviour shift appears in headless runs — encounter
 * pool composition at a marked location versus an unmarked one — the react-verb
 * integrations need rework, not the substrate.* This script is how that claim is
 * measured rather than asserted.
 *
 * Per seed it runs a seeded world for `--ticks` ticks and, **after every tick**,
 *
 *   1. snapshots which place-tier Locations carry which `trait.condition.location.*`
 *      traits (off the graph, never the trace ring — a mint that happened 300 ticks ago
 *      is still an edge), tracking per trait how many places carry it now, the most
 *      that ever did at once, and how many mints and releases the run saw; and
 *   2. reads every encounter chapter that resolved this tick off `chapterArchive`
 *      (append-only state, so each is seen exactly once), attributes it to the place
 *      it happened at — the action's target when that is a Location, else where the
 *      actor stood — and files it under the traits that place carried *at that tick*.
 *
 * It then reports, per minted trait and per tag in that trait's
 * `LOCATION_TRAIT_ENCOUNTER_BONUS` row, the **share** of resolved encounters carrying
 * the tag at places marked with the trait against the share at places carrying none of
 * the four. The verdict per trait is one of:
 *
 *   - `UNMINTED`     — no place carried it this run; the thresholds are the question
 *   - `UNDERSAMPLED` — marked places existed but fewer than `CENSUS_MIN_MARKED_ENCOUNTERS`
 *                      encounters resolved at them; run longer or more seeds
 *   - `MOVES`        — at least one row tag's share at marked places exceeds unmarked by
 *                      `CENSUS_MIN_SHARE_DELTA` on at least `CENSUS_MIN_TAG_HITS` hits
 *   - `FLAT`         — enough encounters, and no row tag's share rose by that much: the
 *                      rows are too small or the corpus does not carry the tags (the
 *                      plan's first kill-criterion branch)
 *
 * It reports. It does not tune: a `FLAT` on a healthy corpus is the plan's own signal
 * to look at the table, and a human decides whether to raise a row.
 *
 * Usage:
 *   npm run census:location-traits                         # seeds 42,99 × 150 ticks × medium
 *   npm run census:location-traits -- --seeds 7,13 --ticks 300
 *   npm run census:location-traits -- --json
 *
 * Exit code is always 0. This is the weekly hygiene routine's instrument, not a gate.
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { getLocationNodes, isPlaceNode, resolveToParentLocation } from '../src/engine/sublocationShape';
import { getAgentLocationId } from '../src/engine/graphQueries';
import { templateEffectiveTags } from '../src/engine/locationTraitBonus';
import { LOCATION_CONDITION_ID_PREFIX } from '../src/data/condition-trait-content';
import {
  LOCATION_TRAIT_ENCOUNTER_BONUS,
  LOCATION_TRAIT_IDS,
} from '../src/data/location-trait-constants';
import type { GameState } from '../src/types/gameState';
import type { WorldGraph } from '../src/engine/graph';

// ─── Tunable constants (NFP #1) ─────────────────────────────────────

const DEFAULT_SEEDS: readonly number[] = [42, 99];
/** The plan's Done-when names 150 ticks — long enough for a three-day sustain to mint and the pool to answer. */
const DEFAULT_TICKS = 150;
/** Below this many resolved encounters at marked places a share is noise, not a reading. */
export const CENSUS_MIN_MARKED_ENCOUNTERS = 20;
/**
 * A row tag's share at marked places must exceed its share at unmarked places by at
 * least this much (five points) before the trait reads `MOVES`. A fraction of a point
 * on a hundred encounters is what two seeds' ordinary variance looks like.
 */
export const CENSUS_MIN_SHARE_DELTA = 0.05;
/** ...and the tag must have fired at least this often at marked places, or the delta is one encounter. */
export const CENSUS_MIN_TAG_HITS = 3;

// ─── Args ─────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const seeds = arg('seeds')?.split(',').map(Number) ?? [...DEFAULT_SEEDS];
const ticks = Number(arg('ticks') ?? DEFAULT_TICKS);
const map = (arg('map') ?? 'medium') as MapSizePreset;
const asJson = process.argv.includes('--json');

// ─── Shapes ───────────────────────────────────────────────────────

const MINTED_TRAITS: readonly string[] = Object.values(LOCATION_TRAIT_IDS);

interface TraitCarriage {
  readonly traitId: string;
  /** Places carrying it at the final tick. */
  current: number;
  /** The most places carrying it in any one tick. */
  peak: number;
  /** Edges that appeared / disappeared between consecutive ticks. */
  mints: number;
  releases: number;
  /** First tick any place carried it, or null. */
  firstTick: number | null;
}

interface TagShare {
  readonly tag: string;
  readonly bonus: number;
  readonly markedShare: number | null;
  readonly unmarkedShare: number | null;
  readonly markedCount: number;
}

export type TraitVerdict = 'UNMINTED' | 'UNDERSAMPLED' | 'MOVES' | 'FLAT';

interface TraitReport {
  readonly traitId: string;
  readonly carriage: TraitCarriage;
  /** Resolved encounters at places carrying the trait. */
  readonly markedEncounters: number;
  readonly shares: readonly TagShare[];
  readonly verdict: TraitVerdict;
}

interface SeedReport {
  readonly seed: number;
  readonly ticks: number;
  /** Every resolved encounter chapter the run produced. */
  readonly resolvedEncounters: number;
  /** ...of which at places carrying none of the four minted traits. */
  readonly unmarkedEncounters: number;
  /** ...and how many could not be placed at all (no target Location, actor unplaced). */
  readonly unplacedEncounters: number;
  readonly traits: readonly TraitReport[];
  /** Every location-condition id seen on any place this run, minted or planted. */
  readonly conditionsSeen: readonly string[];
}

// ─── Attribution ──────────────────────────────────────────────────

/** The place-tier Location an encounter chapter happened at, or null. */
function placeOfChapter(
  graph: WorldGraph,
  record: { readonly targetId: string; readonly actorId: string },
): string | null {
  const target = graph.getNode(record.targetId);
  if (target && target.type === 'location') {
    const place = isPlaceNode(target) ? resolveToParentLocation(graph, target) : target;
    if (place) return place.id;
  }
  const standingId = getAgentLocationId(graph, record.actorId);
  const standing = standingId ? graph.getNode(standingId) : undefined;
  if (!standing) return null;
  const place = isPlaceNode(standing) ? resolveToParentLocation(graph, standing) : standing;
  return place?.id ?? null;
}

/** locationId → the location-condition ids it carries right now. */
function snapshotMarks(graph: WorldGraph): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const loc of getLocationNodes(graph)) {
    for (const edge of graph.getOutgoingEdges(loc.id, 'has_trait')) {
      if (!edge.target.startsWith(LOCATION_CONDITION_ID_PREFIX)) continue;
      let set = out.get(loc.id);
      if (!set) out.set(loc.id, (set = new Set()));
      set.add(edge.target);
    }
  }
  return out;
}

// ─── Run ──────────────────────────────────────────────────────────

function runSeed(seed: number): SeedReport {
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let state: GameState = initializeGameState(
    archetype, 'LocationTraits', createBalancedCosmology(), seed, preset.cols, preset.rows,
  ).state;

  const carriage = new Map<string, TraitCarriage>(
    MINTED_TRAITS.map(id => [id, { traitId: id, current: 0, peak: 0, mints: 0, releases: 0, firstTick: null }]),
  );
  const conditionsSeen = new Set<string>();
  /** Per trait: the tag lists of every encounter resolved at a place carrying it. */
  const markedTags = new Map<string, string[][]>(MINTED_TRAITS.map(id => [id, []]));
  const unmarkedTags: string[][] = [];
  let resolvedEncounters = 0;
  let unplaced = 0;
  let lastArchive = (state.chapterArchive ?? []).length;
  let previous = snapshotMarks(state.graph);

  for (let t = 0; t < ticks; t++) {
    state = runTick(state, [], runtime);
    const marks = snapshotMarks(state.graph);

    // 1. Carriage: diff against the last tick's snapshot.
    for (const traitId of MINTED_TRAITS) {
      const c = carriage.get(traitId)!;
      let now = 0;
      for (const [locId, set] of marks) {
        if (!set.has(traitId)) continue;
        now += 1;
        if (!previous.get(locId)?.has(traitId)) c.mints += 1;
      }
      for (const [locId, set] of previous) {
        if (set.has(traitId) && !marks.get(locId)?.has(traitId)) c.releases += 1;
      }
      c.current = now;
      if (now > c.peak) c.peak = now;
      if (now > 0 && c.firstTick === null) c.firstTick = state.tick;
    }
    for (const set of marks.values()) for (const id of set) conditionsSeen.add(id);

    // 2. Attribution: every chapter that resolved this tick, at the place as marked now.
    const archive = state.chapterArchive ?? [];
    for (let i = lastArchive; i < archive.length; i++) {
      const record = archive[i];
      resolvedEncounters += 1;
      const placeId = placeOfChapter(state.graph, record);
      if (!placeId) {
        unplaced += 1;
        continue;
      }
      const tags = [...templateEffectiveTags(record.templateId)];
      const here = marks.get(placeId);
      let anyMinted = false;
      for (const traitId of MINTED_TRAITS) {
        if (here?.has(traitId)) {
          anyMinted = true;
          markedTags.get(traitId)!.push(tags);
        }
      }
      if (!anyMinted) unmarkedTags.push(tags);
    }
    lastArchive = archive.length;
    previous = marks;
  }

  const share = (lists: readonly string[][], tag: string): number | null =>
    lists.length === 0 ? null : lists.filter(tags => tags.includes(tag)).length / lists.length;

  const traits: TraitReport[] = MINTED_TRAITS.map(traitId => {
    const marked = markedTags.get(traitId)!;
    const row = LOCATION_TRAIT_ENCOUNTER_BONUS[traitId] ?? {};
    const shares: TagShare[] = Object.entries(row).map(([tag, bonus]) => ({
      tag,
      bonus,
      markedShare: share(marked, tag),
      unmarkedShare: share(unmarkedTags, tag),
      markedCount: marked.filter(tags => tags.includes(tag)).length,
    }));
    const c = carriage.get(traitId)!;
    let verdict: TraitVerdict;
    if (c.peak === 0) verdict = 'UNMINTED';
    else if (marked.length < CENSUS_MIN_MARKED_ENCOUNTERS) verdict = 'UNDERSAMPLED';
    else if (shares.some(s =>
      s.markedShare !== null && s.unmarkedShare !== null
      && s.markedCount >= CENSUS_MIN_TAG_HITS
      && s.markedShare - s.unmarkedShare >= CENSUS_MIN_SHARE_DELTA,
    )) verdict = 'MOVES';
    else verdict = 'FLAT';
    return { traitId, carriage: c, markedEncounters: marked.length, shares, verdict };
  });

  return {
    seed,
    ticks,
    resolvedEncounters,
    unmarkedEncounters: unmarkedTags.length,
    unplacedEncounters: unplaced,
    traits,
    conditionsSeen: [...conditionsSeen].sort(),
  };
}

const results = seeds.map(runSeed);

// ─── Report ───────────────────────────────────────────────────────

const pct = (v: number | null): string => (v === null ? '   —  ' : `${(v * 100).toFixed(1).padStart(5)}%`);

if (asJson) {
  console.log(JSON.stringify({ ticks, map, minMarkedEncounters: CENSUS_MIN_MARKED_ENCOUNTERS, seeds: results }, null, 2));
} else {
  for (const r of results) {
    console.log(`\n─── seed ${r.seed} · ${r.ticks} ticks · ${map} ───────────────────`);
    console.log(
      `resolved encounters: ${r.resolvedEncounters}  (at unmarked places ${r.unmarkedEncounters}, unplaced ${r.unplacedEncounters})`,
    );
    console.log(`location conditions seen on any place: ${r.conditionsSeen.length === 0 ? 'none' : r.conditionsSeen.map(id => id.slice(LOCATION_CONDITION_ID_PREFIX.length)).join(', ')}`);
    for (const t of r.traits) {
      const word = t.traitId.slice(LOCATION_CONDITION_ID_PREFIX.length);
      const c = t.carriage;
      console.log(
        `\n  ${t.verdict.padEnd(12)} #${word}  places now ${c.current} · peak ${c.peak} · mints ${c.mints} · releases ${c.releases}`
        + (c.firstTick !== null ? ` · first at t${c.firstTick}` : '')
        + `  |  encounters at marked places: ${t.markedEncounters}`,
      );
      if (t.verdict === 'UNMINTED' || t.verdict === 'UNDERSAMPLED') continue;
      console.log(`               tag              bonus   marked   unmarked   (n at marked)`);
      for (const s of t.shares) {
        const arrow = s.markedShare !== null && s.unmarkedShare !== null
          ? (s.markedShare > s.unmarkedShare ? '▲' : s.markedShare < s.unmarkedShare ? '▼' : '=')
          : ' ';
        console.log(
          `               ${s.tag.padEnd(16)} ${s.bonus.toFixed(2).padStart(5)}  ${pct(s.markedShare)}  ${pct(s.unmarkedShare)}  ${arrow}  (${s.markedCount})`,
        );
      }
    }
  }
  console.log(
    `\nVerdicts: UNMINTED — no place carried the trait (thresholds vs the world's scalars); `
    + `UNDERSAMPLED — under ${CENSUS_MIN_MARKED_ENCOUNTERS} encounters resolved at marked places; `
    + `MOVES — a row tag's share at marked places exceeds unmarked by ≥ ${(CENSUS_MIN_SHARE_DELTA * 100).toFixed(0)} points on ≥ ${CENSUS_MIN_TAG_HITS} hits; `
    + `FLAT — it did not (rows too small, or the corpus lacks the tags).`,
  );
}
