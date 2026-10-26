/**
 * seedEchoes — the old gods' marks stand in the new world (THR-1843, slice 2 of
 * THR-1813's plan).
 *
 * Plan: `Docs/plans/2026-10-14-thr-1813-the-world-remembers.md` § Engine pillar E7,
 * Decided 1–3 and 5–7. Runs once at world creation, after `recordSeededScores` (so a
 * kin monument's lift sits above its seed and neglect fades it) and before
 * `computeFactionSphereAggregates` (so factions see it). Nothing here runs per tick.
 *
 * Per live echo, in Decided 5's order, up to `MAX_SEEDED_ECHOES`:
 *  - **Monument** — a named ruin sublocation on ordinary ground that reads Foreign for
 *    the new god; its host is lifted in the echo's spheres until the new god reads the
 *    decided band (Held / Touched when kin, by memory; Hostile when opposed).
 *  - **Legacy** — the wealthiest ambient resident of the best-matching settlement,
 *    promoted to notable "of the line of" the old mortal, with one kin tie.
 *  - **Relic** — an unborne artifact named after the old one, lying at a ruin or wild place.
 *
 * Every choice of where and who is a total ordering (NFP 3); the one seeded stream is
 * spent only inside `hydrateToTier`. Per-echo fail-soft: an echo that cannot be placed
 * is skipped with `echo.seed_skipped` and no node is minted to force it (NFP 4).
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { AccountRecord } from '../types/account';
import type { EchoDefinition, EchoRelation, EchoState, SeededEcho, SeededEchoKind, SeededEchoSkipReason, SeededEchoesSummary } from '../types/echo';
import { SPHERE_NAMES, type SphereName } from '../types/index';
import { MAX_SPHERE_SCORE, type SphereAffinity } from '../types/sphereAffinity';
import { DOMINION_BAND_RANK, type DominionBand } from '../data/dominion-content';
import {
  ECHO_EXCLUDED_SUBTYPES,
  ECHO_MONUMENT_SUBLOCATION_TYPE_ID,
  ECHO_ORIGIN,
  ECHO_SEEDING_PRIME,
  LEGACY_SPHERE_LIFT,
  MAX_SEEDED_ECHOES,
  MONUMENT_IMPRINT_MAX,
  MONUMENT_IMPRINT_STEP,
  MONUMENT_KIN_BANDS,
  MONUMENT_OPPOSED_BAND,
  memoryWord,
} from '../data/account-content';
import { LOCATION_CLASSES } from '../data/world-objects';
import {
  NOTABLE_ORIGIN_WORLDGEN,
  WORLDGEN_KIN_SENTIMENT,
  WORLDGEN_KIN_STRENGTH,
  WORLDGEN_TIE_TRUST_FROM_SENTIMENT,
} from '../data/worldgen-living-constants';
import { liveEchoes } from './accountRecord';
import { DOMINION_READS_PARENT_KEY, dominionOf, godSpherePoints, matchOfScores } from './dominion';
import { isValidSphereAffinity } from './sphereAffinity';
import { getLocationNodes } from './sublocationShape';
import { hydrateToTier } from './npcGraduation';
import { SETTLEMENT_SUBTYPES, isAmbientResident, residentsOf, wealthOfRole } from './seedLivingWorld';
import { mulberry32 } from '../lib/prng';
import { emitTrace } from './traceBuffer';

type SkipReason = SeededEchoSkipReason;

const MAP_KINDS: ReadonlySet<string> = new Set<SeededEchoKind>(['monument', 'legacy', 'relic']);
const RUIN_OR_WILD: ReadonlySet<string> = new Set([...(LOCATION_CLASSES.ruin ?? []), ...(LOCATION_CLASSES.wild ?? [])]);

const notMonsterHome = (n: GraphNode): boolean => !ECHO_EXCLUDED_SUBTYPES.has(String(n.properties.locationSubtype ?? ''));

const byId = (a: { id: string }, b: { id: string }): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** The echo's spheres as a points vector, so the one match formula reads it. */
function echoVector(def: EchoDefinition): Partial<Record<SphereName, number>> {
  const v: Partial<Record<SphereName, number>> = {};
  for (const s of def.sphereAffinities) v[s] = 10;
  return v;
}

function bagOf(node: GraphNode | undefined): SphereAffinity | undefined {
  const bag = node?.properties.sphereAffinity;
  return isValidSphereAffinity(bag) ? bag as SphereAffinity : undefined;
}

/** How well a node's scores already lean toward the echo's spheres. */
function echoMatch(def: EchoDefinition, node: GraphNode): number {
  const bag = bagOf(node);
  return bag ? matchOfScores(echoVector(def), bag.scores) : -Infinity;
}

/** Decided 5 — divine before cosmic, then strength × significance, then id. */
export function seedingOrder(account: AccountRecord): Array<{ def: EchoDefinition; state: EchoState }> {
  return liveEchoes(account)
    .filter(e => MAP_KINDS.has(e.def.echoType))
    .sort((a, b) => {
      const src = (a.def.source === 'divine' ? 0 : 1) - (b.def.source === 'divine' ? 0 : 1);
      if (src !== 0) return src;
      const wa = (1 - a.state.degradation) * a.def.significance;
      const wb = (1 - b.state.degradation) * b.def.significance;
      if (wa !== wb) return wb - wa;
      return a.def.id < b.def.id ? -1 : a.def.id > b.def.id ? 1 : 0;
    });
}

/** Decided 1 — kin, opposed or unrelated: the sign of the new god's match to the echo. */
export function echoRelation(godPoints: Partial<Record<SphereName, number>>, def: EchoDefinition): EchoRelation {
  const m = matchOfScores(godPoints, echoVector(def) as Record<SphereName, number>);
  return m > 0 ? 'kin' : m < 0 ? 'opposed' : 'unrelated';
}

/** Decided 1 — the band a monument is lifted toward, or `null` (a named landmark only). */
export function monumentTargetBand(relation: EchoRelation, degradation: number): DominionBand | null {
  if (relation === 'opposed') return MONUMENT_OPPOSED_BAND;
  if (relation !== 'kin') return null;
  const word = memoryWord(degradation);
  if (word === 'still warm') return MONUMENT_KIN_BANDS.stillWarm;
  if (word === 'fading') return MONUMENT_KIN_BANDS.fading;
  return null;
}

/** True once `band` has reached `target` in the direction the target lies. */
function reached(band: DominionBand, target: DominionBand): boolean {
  return target === 'hostile'
    ? DOMINION_BAND_RANK[band] <= DOMINION_BAND_RANK[target]
    : DOMINION_BAND_RANK[band] >= DOMINION_BAND_RANK[target];
}

/**
 * Lift the host's echo spheres a step at a time until the god reads `target` or the
 * mean lift reaches `MONUMENT_IMPRINT_MAX`. Whole points, round-robin to the
 * least-lifted echo sphere (primary first), clamped at `MAX_SPHERE_SCORE`.
 */
function imprintHost(
  graph: WorldGraph, ascendantId: string, hostId: string, spheres: readonly SphereName[], target: DominionBand,
): { band: DominionBand; imprint: number; capped: boolean } {
  const lift: number[] = spheres.map(() => 0);
  let budget = 0;
  let band = dominionOf(graph, ascendantId, hostId).band;
  const meanLift = (): number => lift.reduce((a, b) => a + b, 0) / spheres.length;
  while (!reached(band, target)) {
    if (meanLift() >= MONUMENT_IMPRINT_MAX) return { band, imprint: meanLift(), capped: true };
    const bag = bagOf(graph.getNode(hostId));
    if (!bag) return { band, imprint: meanLift(), capped: true };
    const scores = { ...bag.scores };
    budget += MONUMENT_IMPRINT_STEP * spheres.length;
    let dealt = false;
    while (budget >= 1) {
      // The least-lifted sphere that still has room; ties go to the earlier (primary) one.
      let pick = -1;
      for (let i = 0; i < spheres.length; i++) {
        if ((scores[spheres[i]] ?? 0) >= MAX_SPHERE_SCORE) continue;
        if (pick < 0 || lift[i] < lift[pick]) pick = i;
      }
      if (pick < 0) break;
      scores[spheres[pick]] = (scores[spheres[pick]] ?? 0) + 1;
      lift[pick]++;
      budget -= 1;
      dealt = true;
    }
    if (!dealt && budget >= 1) return { band, imprint: meanLift(), capped: true }; // every echo sphere is full
    graph.updateNode(hostId, { properties: { sphereAffinity: { ...bag, scores } } });
    band = dominionOf(graph, ascendantId, hostId).band;
  }
  return { band, imprint: meanLift(), capped: false };
}

function seedMonument(
  graph: WorldGraph, ascendantId: string, def: EchoDefinition, state: EchoState, hosting: Set<string>,
): SeededEcho | SkipReason {
  const god = graph.getNode(ascendantId);
  const seatId = god?.properties.homeSeatLocationId;
  const hosts = getLocationNodes(graph)
    .filter(p => p.id !== 'loc.start' && p.id !== seatId && !hosting.has(p.id) && notMonsterHome(p))
    .filter(p => typeof p.properties.hexCol === 'number' && typeof p.properties.hexRow === 'number' && bagOf(p))
    .filter(p => dominionOf(graph, ascendantId, p.id).band === 'foreign')
    .map(p => ({ node: p, match: echoMatch(def, p) }))
    .sort((a, b) => (b.match - a.match) || byId(a.node, b.node));
  const host = hosts[0]?.node;
  if (!host) return 'no_host';

  const relation = echoRelation(godSpherePoints(graph, ascendantId), def);
  const targetBand = monumentTargetBand(relation, state.degradation);
  const result = targetBand
    ? imprintHost(graph, ascendantId, host.id, def.sphereAffinities, targetBand)
    : { band: dominionOf(graph, ascendantId, host.id).band, imprint: 0, capped: false };

  const nodeId = `echo_monument_${def.id}`;
  graph.addNode({
    id: nodeId,
    type: 'location',
    name: def.name,
    properties: {
      // A Place, shaped like every other sublocation writer's: the type id and
      // persistence, never an outer-tier `locationSubtype` (THR-1403), so the map's
      // place layer does not draw it as a second top-level ruin on its host's hex.
      sublocationTypeId: ECHO_MONUMENT_SUBLOCATION_TYPE_ID,
      parentLocationId: host.id,
      persistence: { type: 'permanent' },
      hexCol: host.properties.hexCol,
      hexRow: host.properties.hexRow,
      echoId: def.id,
      echoOrigin: true,
      echoKind: 'monument',
      // The band lives on the host (the place tier); the monument reads through it, so
      // it fades when its host does rather than keeping a frozen copy of the lift.
      [DOMINION_READS_PARENT_KEY]: true,
    },
  });
  graph.addEdge({ id: `edge_contains_${host.id}_${nodeId}`, source: host.id, target: nodeId, type: 'contains', properties: {} });
  hosting.add(host.id);
  return {
    echoId: def.id, kind: 'monument', name: def.name, nodeId, hostId: host.id,
    relation, targetBand, band: result.band, imprint: result.imprint, capped: result.capped,
  };
}

/** True when `a` and `b` already hold a `relates_to` tie in either direction. */
function hasTieWith(graph: WorldGraph, a: string, b: string): boolean {
  return graph.getOutgoingEdges(a, 'relates_to').some(e => e.target === b)
    || graph.getOutgoingEdges(b, 'relates_to').some(e => e.target === a);
}

/**
 * The `relates_to` kin pair, both directions, in the worldgen tie shape — origin
 * included (THR-2029): a tie seeded at world creation never counts toward
 * spotlight promotion (`isEarnedTie`, THR-1630).
 */
function writeKinTie(graph: WorldGraph, a: string, b: string): void {
  const properties = {
    sentiment: WORLDGEN_KIN_SENTIMENT,
    strength: WORLDGEN_KIN_STRENGTH,
    basis: 'kin',
    trust: WORLDGEN_KIN_SENTIMENT * WORLDGEN_TIE_TRUST_FROM_SENTIMENT,
    origin: NOTABLE_ORIGIN_WORLDGEN,
  };
  for (const [source, target] of [[a, b], [b, a]] as const) {
    const id = `edge_tie_${source}_${target}_kin`;
    if (graph.getEdge(id)) continue;
    graph.addEdge({ id, source, target, type: 'relates_to', properties: { ...properties } });
  }
}

function seedLegacy(
  graph: WorldGraph, def: EchoDefinition, state: EchoState, rng: () => number,
): SeededEcho | SkipReason {
  const settlements = getLocationNodes(graph)
    .filter(n => SETTLEMENT_SUBTYPES.has(String(n.properties.locationSubtype ?? '')))
    .map(n => ({ node: n, match: echoMatch(def, n) }))
    .sort((a, b) => (b.match - a.match) || byId(a.node, b.node));
  for (const { node: settlement } of settlements) {
    const residents = residentsOf(graph, settlement.id);
    const ambient = residents
      .filter(n => isAmbientResident(n) && n.properties.echoLineageOf === undefined)
      .sort((a, b) => wealthOfRole(b) - wealthOfRole(a) || byId(a, b));
    const heir = ambient[0];
    if (!heir) continue;
    hydrateToTier(graph, heir.id, 'notable', rng);
    const strength = Math.max(0, 1 - state.degradation);
    const lift = Math.round(LEGACY_SPHERE_LIFT * strength);
    const bag = bagOf(graph.getNode(heir.id));
    let imprint = 0;
    const props: Record<string, unknown> = { notableOrigin: ECHO_ORIGIN, echoLineageOf: def.name, echoId: def.id };
    if (bag && lift > 0) {
      const scores = { ...bag.scores };
      let total = 0;
      for (const s of def.sphereAffinities) {
        const before = scores[s] ?? 0;
        scores[s] = Math.min(MAX_SPHERE_SCORE, before + lift);
        total += scores[s] - before;
      }
      imprint = def.sphereAffinities.length > 0 ? total / def.sphereAffinities.length : 0;
      props.sphereAffinity = { ...bag, scores };
    }
    graph.updateNode(heir.id, { properties: props });
    // One kin tie, to a co-resident the heir holds no tie with yet (the worldgen
    // writer's `hasTieWith` guard): readers take the first edge of a pair.
    const kin = residents.filter(n => n.id !== heir.id && !hasTieWith(graph, heir.id, n.id)).sort(byId)[0];
    if (kin) writeKinTie(graph, heir.id, kin.id);
    return { echoId: def.id, kind: 'legacy', name: def.name, nodeId: heir.id, hostId: settlement.id, imprint };
  }
  return 'no_heir';
}

function seedRelic(graph: WorldGraph, ascendantId: string, def: EchoDefinition): SeededEcho | SkipReason {
  const sites = getLocationNodes(graph)
    .filter(n => RUIN_OR_WILD.has(String(n.properties.locationSubtype ?? '')) && notMonsterHome(n))
    .map(n => ({ node: n, match: echoMatch(def, n) }))
    .sort((a, b) => (b.match - a.match) || byId(a.node, b.node));
  const site = sites[0]?.node;
  if (!site) return 'no_site';
  const nodeId = `echo_relic_${def.id}`;
  const sphere: SphereName | undefined = def.sphereAffinities[0];
  graph.addNode({
    id: nodeId,
    type: 'artifact',
    name: def.name,
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      ...(sphere ? { sphere } : {}),
      echoOrigin: true,
      echoId: def.id,
      echoKind: 'relic',
    },
  });
  // The relic lies at its site through the graph, not a property-bag id (THR-2030):
  // `placeOf` and the Inspector's "where" read this edge.
  graph.addEdge({ id: `edge_lies_at_${nodeId}_${site.id}`, source: nodeId, target: site.id, type: 'lies_at', properties: { sinceTick: 0 } });
  return {
    echoId: def.id, kind: 'relic', name: def.name, nodeId, hostId: site.id,
    band: dominionOf(graph, ascendantId, nodeId).band,
  };
}

function skip(summary: SeededEchoesSummary, echoId: string, reason: SkipReason): void {
  summary.skipped.push({ echoId, reason });
  emitTrace({ tick: 0, category: 'echo.seed_skipped', echoId, reason, summary: `echo ${echoId} not seeded: ${reason}` });
}

/**
 * Place the account's live map echoes in a freshly built world (plan E7). Pure over
 * the graph apart from its traces; the caller catches a throw and starts the world
 * without echoes.
 */
export function seedEchoes(graph: WorldGraph, ascendantId: string, account: AccountRecord, seed: number): SeededEchoesSummary {
  const summary: SeededEchoesSummary = { seeded: [], skipped: [] };
  const rng = mulberry32(seed + ECHO_SEEDING_PRIME);
  const hosting = new Set<string>();
  const ordered = seedingOrder(account);
  for (const { def, state } of ordered) {
    // The cap counts echoes that stand, so one that found no place frees its slot.
    if (summary.seeded.length >= MAX_SEEDED_ECHOES) { skip(summary, def.id, 'over_cap'); continue; }
    // A stored record is only shape-checked as a whole: a malformed definition skips
    // itself, never the echoes already placed.
    const spheres: unknown = def.sphereAffinities;
    if (typeof def.name !== 'string' || !def.name.trim() || !Array.isArray(spheres) || spheres.length === 0
      || !spheres.every(s => (SPHERE_NAMES as readonly string[]).includes(s as string))) {
      skip(summary, def.id, 'no_origin');
      continue;
    }
    let out: SeededEcho | SkipReason;
    try {
      out = def.echoType === 'monument' ? seedMonument(graph, ascendantId, def, state, hosting)
        : def.echoType === 'legacy' ? seedLegacy(graph, def, state, rng)
          : seedRelic(graph, ascendantId, def);
    } catch {
      out = 'error';
    }
    if (typeof out === 'string') { skip(summary, def.id, out); continue; }
    summary.seeded.push(out);
    emitTrace({
      tick: 0,
      category: 'echo.seeded',
      echoId: out.echoId,
      kind: out.kind,
      hostId: out.hostId,
      ...(out.relation ? { relation: out.relation } : {}),
      ...(out.targetBand !== undefined ? { targetBand: out.targetBand } : {}),
      ...(out.band ? { band: out.band } : {}),
      ...(out.imprint !== undefined ? { imprint: out.imprint } : {}),
      ...(out.capped !== undefined ? { capped: out.capped } : {}),
      summary: `echo ${out.name} (${out.kind}) seeded at ${out.hostId}${out.band ? ` — reads ${out.band}` : ''}${out.capped ? ' (capped)' : ''}`,
    });
  }
  return summary;
}
