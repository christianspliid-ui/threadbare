/**
 * Incident bundle (THR-1134) — the pure assembler behind the one-button snapshot.
 *
 * `buildIncidentBundle` reads a live `GameState` and the session runtime and hands
 * back a plain object; `serializeIncidentBundle` turns that object into the string
 * the browser downloads. No React, no DOM, no side effects — the CLI and a vitest
 * can both build one, which is why the dev proof and the production path share a
 * single implementation.
 *
 * **Do not stringify the state.** `JSON.stringify(state)` does not throw — it lies.
 * Measured on seed 42 / medium at tick 100 it returns 1,661,839 bytes of plausible
 * JSON with the entire graph rendered as
 * `{"nodes":{},"edges":{},"outgoing":{},"incoming":{}}` — fifty-one characters
 * standing in for three and a quarter megabytes — and every `Map` on the state
 * (`visibilityMap`, `effectStates`, `agentKnowledge`, `culturalInsightMap`,
 * `clearanceGateStates`) flattened to `{}`. A naive bundle would look complete and
 * contain no world. Every section here is built by hand from public getters, and
 * the serializer's manifest self-check exists to catch the day that stops being
 * true.
 *
 * **Fail-soft (NFP #4).** Every section is built inside its own `try/catch`; a
 * section that throws is written as `{ error }` and named in `failedSections`,
 * and the rest of the bundle still ships. A snapshot that is missing one block is
 * worth far more than no snapshot at all.
 */

import {
  INCIDENT_BUNDLE_VERSION,
  INCIDENT_NEIGHBOURHOOD_MAX_NODES,
  INCIDENT_TIMELINE_TAIL,
} from '../data/incident-snapshot-constants';
import type { GameState } from '../types/gameState';
import type { GraphNode, GraphEdge } from '../types/graph';
import type { SimulationRuntime } from './simulationRuntime';
import { getRecordedEvents, getRecordedMetrics, getIncidentRecorderStats } from './incidentRecorder';
import {
  getHealthLog,
  getCrashLog,
  getLatestReport,
  exportDiagnostics,
} from './tickHealthMonitor';
import { getTimeline, getTrackedAgentIds } from './encounterTimeline';
import { getTraces, isTracingEnabled, emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';

// ─── Types ────────────────────────────────────────────────────────

/** A section that threw while building. Mirrors `tickHealthMonitor`'s validator_error shape. */
export interface IncidentSectionError {
  error: string;
}

function isSectionError(v: unknown): v is IncidentSectionError {
  return typeof v === 'object' && v !== null && 'error' in v;
}

/** The active-UI record the bundle carries, as composed by `GameView`. */
export interface IncidentUIState {
  view: string;
  selectedAgentId: string | null;
  selectedLocationId: string | null;
  selectedFactionId: string | null;
  selectedHex: unknown;
  openModals: string[];
  actionDrawerOpen: boolean;
  scryActive: boolean;
  cameraFocusHex: unknown;
  simRunning: boolean;
}

export interface BuildIncidentBundleOptions {
  /** Include the whole graph and every state `Map`. Off by default — a large map is megabytes. */
  includeWorld?: boolean;
  /** Map preset name (`small` | `medium` | `large` | `epic`), resolved by the caller. */
  mapSize?: string;
  /** Map width in hexes, resolved by the caller. */
  mapCols?: number;
  /** Map height in hexes, resolved by the caller. */
  mapRows?: number;
  /** The active-UI record, when a UI is mounted. Absent in CLI and vitest builds. */
  ui?: IncidentUIState | null;
}

/** One serialized `Map`/`Set` the pre-walk met, by path. */
export interface IncidentSerializationEntry {
  path: string;
  kind: 'map' | 'set';
  entries: number;
}

export interface IncidentSerializationManifest {
  /** `Map`/`Set` instances the pre-walk found. */
  walked: number;
  /** `Map`/`Set` instances the replacer actually rewrote. */
  rewritten: number;
  /**
   * True when the two disagree — a collection reached the file as `{}`. The
   * bundle still ships; it says what is missing rather than lying about it.
   */
  incomplete: boolean;
  collections: IncidentSerializationEntry[];
  /** Serialized byte length of each top-level section. */
  sectionBytes: Record<string, number>;
}

export interface IncidentBundle {
  version: number;
  run: unknown;
  health: unknown;
  census: unknown;
  events: unknown;
  attention: unknown;
  clocks: unknown;
  ui: unknown;
  focus: unknown;
  traces: unknown;
  world?: unknown;
  /** Filled by `serializeIncidentBundle`; a bundle that was never serialized has none. */
  serialization?: IncidentSerializationManifest;
  /** Sections that threw and shipped as `{ error }`. */
  failedSections: string[];
}

/** The build SHA injected by `vite`'s `define`. `'local'` off a Vercel build. */
declare const __BUILD_SHA__: string;

// ─── Section helper ───────────────────────────────────────────────

/**
 * Build one section, isolating its failure. A thrown section becomes `{ error }`
 * and is named in `failed`; every sibling still builds.
 */
function section<T>(name: string, failed: string[], build: () => T): T | IncidentSectionError {
  try {
    return build();
  } catch (err) {
    failed.push(name);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Assembler ────────────────────────────────────────────────────

export function buildIncidentBundle(
  state: GameState,
  runtime: SimulationRuntime | null | undefined,
  opts: BuildIncidentBundleOptions = {},
): IncidentBundle {
  const failedSections: string[] = [];
  const includeWorld = opts.includeWorld === true;

  const run = section('run', failedSections, () => {
    // `window` is absent in the CLI and in vitest; the assembler never touches it
    // outside this guard, so a headless build simply omits the two fields.
    const hasWindow = typeof window !== 'undefined';
    return {
      build: typeof __BUILD_SHA__ === 'string' ? __BUILD_SHA__ : 'unknown',
      bundleVersion: INCIDENT_BUNDLE_VERSION,
      capturedAt: new Date().toISOString(),
      seed: state.seed,
      tick: state.tick,
      cycle: state.cycle,
      phase: state.phase,
      mapSize: opts.mapSize ?? null,
      mapCols: opts.mapCols ?? null,
      mapRows: opts.mapRows ?? null,
      url: hasWindow ? window.location.href : null,
      userAgent: hasWindow && typeof navigator !== 'undefined' ? navigator.userAgent : null,
      ascendantId: state.ascendantId,
      ascendantIdentity: state.ascendantIdentity,
      essencePool: state.essencePool,
      tracingWasOn: isTracingEnabled(),
      includeWorld,
      // The tiles are deliberately absent: `generateWorld` is deterministic from
      // seed + map preset, and `mulberry32` is constructed fresh per call from
      // seed/tick/site-hash rather than advancing, so these three fields are a
      // complete key for regenerating tick zero of the same world. A reader who
      // needs a tile regenerates it; carrying them would cost ~150 KB for nothing.
      tilesOmitted: true,
    };
  });

  const health = section('health', failedSections, () => ({
    healthLog: [...getHealthLog()],
    crashLog: [...getCrashLog()],
    latestReport: getLatestReport(),
  }));

  const census = section('census', failedSections, () => ({
    // The first production consumer of this call. The dev bridge has always
    // invoked it with no state, so `stateMetrics` has been `null` since it was
    // written; passing the state is the whole repair.
    diagnostics: exportDiagnostics(state),
    metrics: runtime?.incidentRecorder ? getRecordedMetrics(runtime.incidentRecorder) : [],
    recorder: runtime?.incidentRecorder
      ? getIncidentRecorderStats(runtime.incidentRecorder)
      : null,
  }));

  const events = section('events', failedSections, () => ({
    ring: runtime?.incidentRecorder ? getRecordedEvents(runtime.incidentRecorder) : [],
    recentEvents: state.recentEvents ?? [],
    tickEvents: state.tickEvents ?? [],
  }));

  const attention = section('attention', failedSections, () => ({
    followedAgentIds: state.followedAgentIds ?? [],
    mutedAgentIds: state.mutedAgentIds ?? [],
    pendingUndertakingMoments: state.pendingUndertakingMoments ?? [],
    playerActionReceipts: state.playerActionReceipts ?? [],
    storyBeatQueue: state.storyBeatQueue ?? [],
    premonitionQueue: state.premonitionQueue ?? [],
    encounterNotifications: state.encounterNotifications ?? [],
    activeThreadTugs: state.activeThreadTugs ?? [],
  }));

  const clocks = section('clocks', failedSections, () => ({
    doomClock: state.doomClock,
    mandateState: state.mandateState,
    omenState: state.omenState ?? null,
    strategicState: state.strategicState ?? null,
  }));

  const ui = section('ui', failedSections, () => opts.ui ?? null);

  const focus = section('focus', failedSections, () =>
    buildFocus(state, opts.ui ?? null),
  );

  const traces = section('traces', failedSections, () =>
    isTracingEnabled()
      ? { armed: true, entries: [...getTraces()] as TraceEntry[] }
      : {
          armed: false,
          // Never an empty array: an empty array reads as "nothing happened",
          // which is a different and much more misleading claim.
          note: 'recording was off, so no traces were kept',
        },
  );

  const bundle: IncidentBundle = {
    version: INCIDENT_BUNDLE_VERSION,
    run,
    health,
    census,
    events,
    attention,
    clocks,
    ui,
    focus,
    traces,
    failedSections,
  };

  if (includeWorld) {
    bundle.world = section('world', failedSections, () => ({
      nodes: state.graph.getAllNodes(),
      edges: state.graph.getAllEdges(),
      visibilityMap: state.visibilityMap,
      culturalInsightMap: state.culturalInsightMap,
      agentKnowledge: state.agentKnowledge,
      effectStates: state.effectStates ?? null,
      clearanceGateStates: state.clearanceGateStates ?? null,
      unifiedActions: state.unifiedActions ?? [],
      chapterArchive: state.chapterArchive ?? [],
      chronicleEntries: state.chronicleEntries ?? [],
      controlEffects: state.controlEffects ?? [],
    }));
  }

  return bundle;
}

// ─── Focus ────────────────────────────────────────────────────────

/**
 * The neighbourhood of what the player was looking at, plus every mortal they
 * follow — the entities a cold agent will ask about first.
 */
function buildFocus(state: GameState, ui: IncidentUIState | null) {
  const graph = state.graph;
  const ids: string[] = [];
  const pushId = (id: string | null | undefined) => {
    if (id && !ids.includes(id)) ids.push(id);
  };

  pushId(ui?.selectedAgentId);
  pushId(ui?.selectedLocationId);
  pushId(ui?.selectedFactionId);
  for (const id of state.followedAgentIds ?? []) pushId(id);

  const entities = ids.map(id => {
    const node = graph.getNode(id);
    if (!node) {
      // A selected id that resolves to no node is itself a finding — say so
      // rather than dropping the row and leaving the reader to wonder.
      return { id, node: null, missing: true, edges: [], neighbours: [], timeline: [] };
    }
    const edges: GraphEdge[] = graph.getAllEdgesForNode(id);
    const neighbours: GraphNode[] = [];
    const seen = new Set<string>([id]);
    for (const e of edges) {
      if (neighbours.length >= INCIDENT_NEIGHBOURHOOD_MAX_NODES) break;
      const otherId = e.source === id ? e.target : e.source;
      if (seen.has(otherId)) continue;
      seen.add(otherId);
      const other = graph.getNode(otherId);
      if (other) neighbours.push(other);
    }
    const timeline = getTimeline(id).slice(-INCIDENT_TIMELINE_TAIL);
    return { id, node, missing: false, edges, neighbours, timeline };
  });

  return {
    selected: ui?.selectedAgentId ?? ui?.selectedLocationId ?? ui?.selectedFactionId ?? null,
    entities,
    /** Every actor the encounter timeline is tracking, so a reader can ask for more. */
    trackedTimelineAgentIds: getTrackedAgentIds(),
  };
}

// ─── Serialization ────────────────────────────────────────────────

/**
 * Walk the bundle before stringifying, recording every `Map` and `Set` by path.
 *
 * This is half of the self-check: the replacer counts what it actually rewrote,
 * and a disagreement means a collection reached the file as `{}`. Cycles are
 * guarded with a seen-set so a graph node that somehow refers back cannot hang
 * the walk.
 */
function walkCollections(
  root: unknown,
): { collections: IncidentSerializationEntry[]; walked: number } {
  const collections: IncidentSerializationEntry[] = [];
  const seen = new WeakSet<object>();

  const visit = (value: unknown, path: string, depth: number): void => {
    if (value === null || typeof value !== 'object') return;
    // 12 is well past the deepest section shape here and stops a pathological
    // structure from turning the self-check into the expensive part.
    if (depth > 12) return;
    if (seen.has(value as object)) return;
    seen.add(value as object);

    if (value instanceof Map) {
      collections.push({ path, kind: 'map', entries: value.size });
      let i = 0;
      for (const [, v] of value) visit(v, `${path}[${i++}]`, depth + 1);
      return;
    }
    if (value instanceof Set) {
      collections.push({ path, kind: 'set', entries: value.size });
      return;
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) visit(value[i], `${path}[${i}]`, depth + 1);
      return;
    }
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      visit(v, path ? `${path}.${k}` : k, depth + 1);
    }
  };

  visit(root, '', 0);
  return { collections, walked: collections.length };
}

/** Rewrites `Map`/`Set` into a shape `JSON.stringify` keeps, counting as it goes. */
function makeReplacer(counter: { rewritten: number }) {
  return function replacer(this: unknown, _key: string, value: unknown): unknown {
    if (value instanceof Map) {
      counter.rewritten++;
      return { __map: [...value.entries()] };
    }
    if (value instanceof Set) {
      counter.rewritten++;
      return { __set: [...value.values()] };
    }
    return value;
  };
}

/**
 * Serialize a bundle, attaching the manifest that says whether it is complete.
 *
 * Two passes by design: the rewrite count is only known once the first pass has
 * run, and the manifest that reports it has to be inside the file the reader
 * opens. The second pass is over an already-built object, so it costs one more
 * stringify of a few hundred kilobytes and buys a bundle that cannot silently
 * omit a collection.
 */
export function serializeIncidentBundle(bundle: IncidentBundle): string {
  const { collections, walked } = walkCollections(bundle);

  const sectionBytes: Record<string, number> = {};
  for (const [key, value] of Object.entries(bundle)) {
    if (key === 'serialization') continue;
    try {
      sectionBytes[key] = JSON.stringify(value, makeReplacer({ rewritten: 0 }))?.length ?? 0;
    } catch {
      sectionBytes[key] = -1;
    }
  }

  bundle.serialization = {
    walked,
    rewritten: 0,
    incomplete: false,
    collections,
    sectionBytes,
  };

  const counter = { rewritten: 0 };
  JSON.stringify(bundle, makeReplacer(counter));

  bundle.serialization.rewritten = counter.rewritten;
  bundle.serialization.incomplete = counter.rewritten !== walked;

  return JSON.stringify(bundle, makeReplacer({ rewritten: 0 }), 2);
}

// ─── Trace ────────────────────────────────────────────────────────

/**
 * One trace per capture. Player-scale — a person presses a button — so there is
 * nothing to batch. Kept out of `buildIncidentBundle` so the assembler stays pure.
 */
export function emitIncidentBundleTrace(
  bundle: IncidentBundle,
  bytes: number,
  tick: number,
): void {
  // Named rather than derived from `Object.keys`, so a section renamed without
  // its trace being updated is a compile error rather than a silently shifting
  // field. `world` is conditional and appears only when the tier was asked for.
  const candidates: [string, unknown][] = [
    ['run', bundle.run],
    ['health', bundle.health],
    ['census', bundle.census],
    ['events', bundle.events],
    ['attention', bundle.attention],
    ['clocks', bundle.clocks],
    ['ui', bundle.ui],
    ['focus', bundle.focus],
    ['traces', bundle.traces],
    ...(bundle.world !== undefined ? ([['world', bundle.world]] as [string, unknown][]) : []),
  ];
  const sections = candidates.filter(([, v]) => !isSectionError(v)).map(([k]) => k);

  // No cast: `TraceEntryInput` distributes the `Omit` across the union, so the
  // `incident_bundle` member is matched on its discriminant and every payload
  // field is checked. Casting here would re-open the collapse trap the four-site
  // registration exists to close.
  emitTrace({
    category: 'incident_bundle',
    tick,
    includeWorld: bundle.world !== undefined,
    bytes,
    sections,
    failedSections: bundle.failedSections,
    tracingWasOn: isTracingEnabled(),
    summary: `incident snapshot captured: ${sections.length} sections, ${bundle.failedSections.length} failed`,
  });
}

// ─── Filename ─────────────────────────────────────────────────────

/**
 * `threadbearer-snapshot-<sha7>-seed<seed>-t<tick>-<YYYYMMDD-HHmm>.json`.
 * Everything a reader needs to tell two captures apart is in the name.
 */
export function incidentBundleFilename(
  prefix: string,
  build: string,
  seed: number,
  tick: number,
  at: Date = new Date(),
): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp =
    `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}` +
    `-${pad(at.getHours())}${pad(at.getMinutes())}`;
  const sha7 = (build || 'unknown').slice(0, 7);
  return `${prefix}-${sha7}-seed${seed}-t${tick}-${stamp}.json`;
}
