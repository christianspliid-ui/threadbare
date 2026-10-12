/**
 * Dominion — how much a world object is the god's (THR-1748).
 *
 * Pure read module: no graph writes, no PRNG. One read, one band, every consumer
 * (card cost, cast odds, thread yield, source income, the debug bridge) reads the
 * band through `dominionOf`. Nothing outside this file reads the match number
 * (§ Decided 1); `DominionReadReason` carries it for traces and the debug bridge
 * only, and it never reaches a player surface (Law 13).
 *
 *   match(obj) = Σ_s points[s] × (score[s] − W[s] × score[opposite(s)]) / Σ_s points[s]
 *   power      = min(CAP, Σ_{s bought} godScore[s] / baseline)
 *   value      = match > 0 ? match × power : match      (power widens friendly ground only)
 *   band       = cut(value) at −1.5 / 0.5 / 1.5 / 3.0
 *
 * Fail-soft: every missing input reads Foreign (par). Every function is total.
 *
 * Plan: Docs/plans/2026-10-11-thr-1748-dominion-core.md § Engine pillar E1–E2.
 */

import { SPHERE_NAMES, type SphereName } from '../types/index';
import type { GraphNode } from '../types/graph';
import type { WorldGraph } from './graph';
import type { ControlEffect } from '../types/controlEffect';
import type { SphereAffinity } from '../types/sphereAffinity';
import { SPHERE_OPPOSITES } from './cosmology';
import { getSpherePoints, type SpherePoints } from './spherePoints';
import { getFactionSphereScores, isValidSphereAffinity, seedHexSphereAffinity } from './sphereAffinity';
import { isPlaceNode, resolveToParentLocation } from './sublocationShape';
import { isArmyGroupNode, isCompanyGroupNode } from './groupShape';
import { tierScaledEssenceCost } from './targetTierScaling';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import {
  type DominionBand,
  DOMINION_BAND_FOREIGN_MIN,
  DOMINION_BAND_TOUCHED_MIN,
  DOMINION_BAND_HELD_MIN,
  DOMINION_BAND_SOVEREIGN_MIN,
  DOMINION_BAND_RANK,
  DOMINION_OPPOSITION_WEIGHT,
  DOMINION_PAR_BAND,
  DOMINION_POWER_CAP,
  DOMINION_POWER_BASELINE_FALLBACK,
  DOMINION_COST_MULTIPLIER,
  DOMINION_COST_FLOOR_SHARE,
  DOMINION_SPHERE_FACTOR,
  DOMINION_SPHERE_FACTOR_MIN,
  DOMINION_SPHERE_FACTOR_MAX,
  DOMINION_PRICES_LIVE,
  DOMINION_CLAIM_TEMPLATE_ID,
  DOMINION_ANOINTED_TENDS_MIN_BAND,
  DOMINION_ATTUNEMENT_MARKS,
  ESSENCE_PER_THREAD_BY_TIER,
  DOMINION_THREAD_YIELD_MULTIPLIER,
  DOMINION_SOURCE_INCOME_MULTIPLIER,
} from '../data/dominion-content';

export type { DominionBand } from '../data/dominion-content';

// ─── Types ───────────────────────────────────────────────────────────

/** What kind of object the read answered for. */
export type DominionObjectKind =
  | 'place' | 'sublocation' | 'mortal' | 'culture' | 'faction'
  | 'army' | 'company' | 'artifact' | 'hex' | 'ascendant' | 'unknown';

/** Why the read came out as it did — traces and the debug bridge only. */
export interface DominionReadReason {
  match: number;
  power: number;
  kind: DominionObjectKind;
  /** Whose scores were read, e.g. `'own'`, `'faction-of-army'`, `'bearer'`, `'no-god'`. */
  readThrough: string;
}

export interface DominionRead {
  band: DominionBand;
  reason: DominionReadReason;
}

/** Who tends a place this tick. */
export type TendedBy = 'claim' | 'seat' | 'carry' | 'anointed';

// ─── Band arithmetic ─────────────────────────────────────────────────

/** Cut a dominion value into its band (THR-1760). */
export function bandOfValue(value: number): DominionBand {
  if (!Number.isFinite(value)) return DOMINION_PAR_BAND;
  if (value < DOMINION_BAND_FOREIGN_MIN) return 'hostile';
  if (value < DOMINION_BAND_TOUCHED_MIN) return 'foreign';
  if (value < DOMINION_BAND_HELD_MIN) return 'touched';
  if (value < DOMINION_BAND_SOVEREIGN_MIN) return 'held';
  return 'sovereign';
}

/** True when `band` is `min` or better. */
export function bandAtLeast(band: DominionBand, min: DominionBand): boolean {
  return DOMINION_BAND_RANK[band] >= DOMINION_BAND_RANK[min];
}

function par(kind: DominionObjectKind, readThrough: string): DominionRead {
  return { band: DOMINION_PAR_BAND, reason: { match: 0, power: 1, kind, readThrough } };
}

// ─── The god ─────────────────────────────────────────────────────────

/** The god's bought vector (THR-1749 accessor; preset fallback from `sphereAlignment`). */
export function godSpherePoints(graph: WorldGraph, ascendantId: string): SpherePoints {
  return getSpherePoints(graph.getNode(ascendantId)?.properties);
}

function scoresOf(node: GraphNode | undefined): Record<SphereName, number> | undefined {
  const bag = node?.properties.sphereAffinity;
  return isValidSphereAffinity(bag) ? (bag as SphereAffinity).scores : undefined;
}

/** Σ over bought spheres of the god's score — the numerator of power. */
export function godBoughtScoreSum(graph: WorldGraph, ascendantId: string): number {
  const node = graph.getNode(ascendantId);
  const points = getSpherePoints(node?.properties);
  const scores = scoresOf(node);
  if (!scores) return 0;
  let sum = 0;
  for (const s of SPHERE_NAMES) if ((points[s] ?? 0) > 0) sum += Math.max(0, scores[s] ?? 0);
  return sum;
}

/** The recorded baseline (`dominionPowerBaseline`), or the fallback when missing or 0. */
export function dominionPowerBaseline(graph: WorldGraph, ascendantId: string): number {
  const raw = graph.getNode(ascendantId)?.properties.dominionPowerBaseline;
  return typeof raw === 'number' && raw > 0 ? raw : DOMINION_POWER_BASELINE_FALLBACK;
}

/** The god's power factor, uncapped — `dominionPower` caps it. */
export function dominionPowerRaw(graph: WorldGraph, ascendantId: string): number {
  const baseline = dominionPowerBaseline(graph, ascendantId);
  const sum = godBoughtScoreSum(graph, ascendantId);
  // A god with no bought scores yet reads at par strength, never zero (fail-soft).
  if (sum <= 0) return 1;
  return sum / baseline;
}

/** power = min(DOMINION_POWER_CAP, Σ bought godScore / baseline) (THR-1765). */
export function dominionPower(graph: WorldGraph, ascendantId: string): number {
  return Math.min(DOMINION_POWER_CAP, dominionPowerRaw(graph, ascendantId));
}

// ─── The object ──────────────────────────────────────────────────────

function averageScores(members: readonly GraphNode[]): Record<SphereName, number> | undefined {
  const valid = members.map(scoresOf).filter((s): s is Record<SphereName, number> => !!s);
  if (valid.length === 0) return undefined;
  const out = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) {
    let sum = 0;
    for (const v of valid) sum += v[s] ?? 0;
    out[s] = sum / valid.length; // unrounded (THR-1764 finding 1)
  }
  return out;
}

/** A faction's scores for this read: its own bag plus the **unrounded** member mean. */
function factionScoresExact(node: GraphNode): Record<SphereName, number> {
  const exact = node.properties.sphereAggregateExact as Record<SphereName, number> | undefined;
  if (!exact || typeof exact !== 'object') return getFactionSphereScores(node);
  const own = scoresOf(node);
  const out = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) out[s] = Math.max(0, (Number(own?.[s]) || 0) + (Number(exact[s]) || 0));
  return out;
}

function activeMembers(graph: WorldGraph, groupId: string): GraphNode[] {
  return graph.getIncomingEdges(groupId, 'member_of')
    .filter(e => e.properties?.leftAtTick == null)
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => !!n && n.properties.actorType === 'individual');
}

/** The faction an army marches for (`member_of` → a faction actor). */
function factionOfArmy(graph: WorldGraph, armyId: string): GraphNode | undefined {
  for (const e of graph.getOutgoingEdges(armyId, 'member_of')) {
    const t = graph.getNode(e.target);
    if (t?.properties.actorType === 'faction') return t;
  }
  return undefined;
}

/** The actor bearing an artifact (`possesses` / `bonded_to` point at it). */
function bearerOf(graph: WorldGraph, artifactId: string): GraphNode | undefined {
  for (const type of ['bonded_to', 'possesses'] as const) {
    for (const e of graph.getIncomingEdges(artifactId, type)) {
      const n = graph.getNode(e.source);
      if (n) return n;
    }
  }
  return undefined;
}

/**
 * The scores the read uses for an object, by kind (THR-1764). `undefined` scores
 * mean "no reading" — the caller falls back to par.
 */
export function dominionObjectScores(
  graph: WorldGraph,
  objectId: string,
): { scores: Record<SphereName, number> | undefined; kind: DominionObjectKind; readThrough: string } {
  const node = graph.getNode(objectId);
  if (!node) return { scores: undefined, kind: 'unknown', readThrough: 'missing' };

  if (node.type === 'location' || isPlaceNode(node)) {
    return { scores: scoresOf(node), kind: isPlaceNode(node) ? 'sublocation' : 'place', readThrough: 'own' };
  }
  if (node.type === 'artifact') {
    const bearer = bearerOf(graph, objectId);
    if (!bearer) return { scores: undefined, kind: 'artifact', readThrough: 'unborne' };
    return { scores: dominionObjectScores(graph, bearer.id).scores, kind: 'artifact', readThrough: 'bearer' };
  }
  if (node.type !== 'actor') return { scores: scoresOf(node), kind: 'unknown', readThrough: 'own' };

  const actorType = node.properties.actorType;
  if (actorType === 'faction') return { scores: factionScoresExact(node), kind: 'faction', readThrough: 'own+members' };
  if (actorType === 'culture') return { scores: scoresOf(node), kind: 'culture', readThrough: 'own' };
  if (actorType === 'ascendant' || actorType === 'god') return { scores: scoresOf(node), kind: 'ascendant', readThrough: 'own' };
  if (isArmyGroupNode(node)) {
    const faction = factionOfArmy(graph, objectId);
    return faction
      ? { scores: factionScoresExact(faction), kind: 'army', readThrough: 'faction-of-army' }
      : { scores: undefined, kind: 'army', readThrough: 'no-faction' };
  }
  if (isCompanyGroupNode(node)) {
    const mean = averageScores(activeMembers(graph, objectId));
    if (mean) return { scores: mean, kind: 'company', readThrough: 'members' };
    const commander = graph.getOutgoingEdges(objectId, 'commanded_by').map(e => graph.getNode(e.target)).find(Boolean);
    return commander
      ? { scores: scoresOf(commander), kind: 'company', readThrough: 'commander' }
      : { scores: undefined, kind: 'company', readThrough: 'empty' };
  }
  return { scores: scoresOf(node), kind: 'mortal', readThrough: 'own' };
}

// ─── The read ────────────────────────────────────────────────────────

/**
 * The weighted mean of `points` over the object's lean toward each bought sphere,
 * net of its opposite pole weighted by the pair strength. 0–10 scale.
 */
export function matchOfScores(points: SpherePoints, scores: Readonly<Record<SphereName, number>>): number {
  let num = 0;
  let den = 0;
  for (const s of SPHERE_NAMES) {
    const p = points[s] ?? 0;
    if (p <= 0) continue;
    const opp = SPHERE_OPPOSITES[s];
    const against = opp ? (DOMINION_OPPOSITION_WEIGHT[s] ?? 0) * (Number(scores[opp]) || 0) : 0;
    num += p * ((Number(scores[s]) || 0) - against);
    den += p;
  }
  return den > 0 ? num / den : 0;
}

/** The raw match for an object (0 when unreadable). Exposed for tests and the debug bridge. */
export function dominionMatch(graph: WorldGraph, ascendantId: string, objectId: string): number {
  const points = godSpherePoints(graph, ascendantId);
  const { scores } = dominionObjectScores(graph, objectId);
  return scores ? matchOfScores(points, scores) : 0;
}

/** Band from a match and the god's power: power widens friendly ground only. */
export function bandFromMatch(match: number, power: number): DominionBand {
  return bandOfValue(match > 0 ? match * power : match);
}

/**
 * The one read. Band of `objectId` for the god `ascendantId`. Total: every missing
 * input reads Foreign.
 */
export function dominionOf(graph: WorldGraph, ascendantId: string, objectId: string): DominionRead {
  try {
    const god = graph.getNode(ascendantId);
    if (!god) return par('unknown', 'no-god');
    const points = getSpherePoints(god.properties);
    if (Object.values(points).every(v => !v)) return par('unknown', 'no-god');
    const { scores, kind, readThrough } = dominionObjectScores(graph, objectId);
    if (!scores) return par(kind, readThrough);
    const match = matchOfScores(points, scores);
    const power = dominionPower(graph, ascendantId);
    return { band: bandFromMatch(match, power), reason: { match, power, kind, readThrough } };
  } catch {
    return par('unknown', 'error');
  }
}

/** Band of a hex by its terrain table (read-only; hexes are never written, § Decided 7). */
export function dominionBandOfHex(graph: WorldGraph, ascendantId: string, terrainType: string): DominionBand {
  try {
    const points = godSpherePoints(graph, ascendantId);
    if (Object.values(points).every(v => !v)) return DOMINION_PAR_BAND;
    const match = matchOfScores(points, seedHexSphereAffinity(terrainType).scores);
    return bandFromMatch(match, dominionPower(graph, ascendantId));
  } catch {
    return DOMINION_PAR_BAND;
  }
}

/** The top-level place an object stands in or is: a sublocation resolves to its parent. */
export function placeOf(graph: WorldGraph, nodeId: string | undefined): GraphNode | undefined {
  if (!nodeId) return undefined;
  const node = graph.getNode(nodeId);
  if (!node) return undefined;
  if (node.type === 'location' || isPlaceNode(node)) return resolveToParentLocation(graph, node);
  const loc = graph.getOutgoingEdges(nodeId, 'located_at')[0];
  return loc ? placeOf(graph, loc.target) : undefined;
}

// ─── Tending (§ Decided 2) ───────────────────────────────────────────

/** Artifact `source` the Bestow Power card writes on its Divine Gift (`applyBestowPower`). */
const BESTOW_GIFT_ARTIFACT_SOURCE = 'bestow_power';

/**
 * True when a thread's mortal bears a bestowed gift: the Divine Gift artifact the
 * Bestow Power card leaves (`possesses`, `source: 'bestow_power'`), or a bestowed
 * trait (a `has_trait` to a `bestowed` trait — seeded and reward-granted gifts).
 */
export function bearsBestowedGift(graph: WorldGraph, mortalId: string): boolean {
  for (const e of graph.getOutgoingEdges(mortalId, 'possesses')) {
    const a = graph.getNode(e.target);
    if (a?.properties.source === BESTOW_GIFT_ARTIFACT_SOURCE) return true;
  }
  for (const e of graph.getOutgoingEdges(mortalId, 'has_trait')) {
    const t = graph.getNode(e.target);
    const cat = (t?.properties.subcategory ?? t?.properties.category) as string | undefined;
    if (cat === 'bestowed') return true;
  }
  return false;
}

/** The active Claims the god holds, by the top-level place each one holds. */
export function claimedPlaces(
  graph: WorldGraph,
  ascendantId: string,
  controlEffects: readonly ControlEffect[] | undefined,
): Map<string, ControlEffect> {
  const out = new Map<string, ControlEffect>();
  for (const effect of controlEffects ?? []) {
    if (!effect.active || effect.templateId !== DOMINION_CLAIM_TEMPLATE_ID || effect.ownerId !== ascendantId) continue;
    const place = placeOf(graph, effect.targetNodeId);
    if (place) out.set(place.id, effect);
  }
  return out;
}

/**
 * Every top-level place tended this tick, and by whom. Built once per tick by the
 * caller; `isTended` reads it. `bandOf` answers the anointed-faction rule (a place
 * Touched or better, `controls`-held by an anointed faction).
 */
export function buildTendingIndex(
  graph: WorldGraph,
  ascendantId: string,
  controlEffects: readonly ControlEffect[] | undefined,
  bandOf: (placeId: string) => DominionBand,
): Map<string, TendedBy[]> {
  const index = new Map<string, TendedBy[]>();
  const add = (placeId: string | undefined, by: TendedBy) => {
    if (!placeId) return;
    const list = index.get(placeId) ?? [];
    if (!list.includes(by)) list.push(by);
    index.set(placeId, list);
  };
  try {
    for (const placeId of claimedPlaces(graph, ascendantId, controlEffects).keys()) add(placeId, 'claim');
    const god = graph.getNode(ascendantId);
    add(placeOf(graph, god?.properties.homeSeatLocationId as string | undefined)?.id, 'seat');
    for (const e of graph.getOutgoingEdges(ascendantId, 'thread')) {
      const tier = Number(e.properties?.tier ?? 0);
      if (tier < 1) continue; // an Unaware thread carries nothing (THR-1762)
      add(placeOf(graph, e.target)?.id, 'carry');
    }
    for (const faction of graph.getNodesByType('actor')) {
      if (faction.properties.actorType !== 'faction' || faction.properties.dissolved) continue;
      const chosen = faction.properties.chosen as { byAscendantId?: string } | undefined;
      if (!chosen || (chosen.byAscendantId && chosen.byAscendantId !== ascendantId)) continue;
      for (const e of graph.getOutgoingEdges(faction.id, 'controls')) {
        const place = placeOf(graph, e.target);
        if (place && bandAtLeast(bandOf(place.id), DOMINION_ANOINTED_TENDS_MIN_BAND)) add(place.id, 'anointed');
      }
    }
  } catch {
    // Fail-soft: a partial index tends fewer places; it never throws into the tick.
  }
  return index;
}

/** Who tends `placeId` this tick, or null (§ Decided 2). */
export function isTended(index: ReadonlyMap<string, TendedBy[]>, placeId: string): TendedBy[] | null {
  const by = index.get(placeId);
  return by && by.length > 0 ? by : null;
}

// ─── Consumers ───────────────────────────────────────────────────────

/** The band a god card is priced and rolled at: its target's band, or par with no world target. */
export function castTargetBand(graph: WorldGraph | undefined, ascendantId: string | undefined, targetId: string | undefined): DominionBand {
  if (!graph || !ascendantId || !targetId) return DOMINION_PAR_BAND;
  return dominionOf(graph, ascendantId, targetId).band;
}

/**
 * God-card price on `band` ground: the band multiplier on the tier-scaled cost,
 * floored at half, never below 1, a free card stays free (§ Decided 10). Par for
 * every band while `DOMINION_PRICES_LIVE` is false (§ Decided 13); `live` overrides
 * the flag for tests.
 */
export function dominionScaledCost(base: number, band: DominionBand, live: boolean = DOMINION_PRICES_LIVE): number {
  if (!live || base <= 0) return base;
  const scaled = Math.floor(base * (DOMINION_COST_MULTIPLIER[band] ?? 1) + 0.5); // round half up
  return Math.max(1, Math.ceil(base * DOMINION_COST_FLOOR_SHARE), scaled);
}

/**
 * The one god-card price, shared by the preview (`getTargetActionSlots`) and the
 * charge (`preparePlayerCast`) so the price shown is the price paid (PC-6): the
 * tier-scaled cost, then the target's band. Nudge cards never come through here
 * (§ Decided 10).
 */
export function dominionScaledEssenceCost(
  graph: WorldGraph | undefined,
  ascendantId: string | undefined,
  template: Pick<UnifiedActionTemplate, 'essenceCost' | 'essenceCostContext'>,
  targetId: string | undefined,
  live: boolean = DOMINION_PRICES_LIVE,
): { cost: number; base: number; band: DominionBand } {
  const base = tierScaledEssenceCost(template, targetId ? graph?.getNode(targetId)?.properties : undefined);
  const band = castTargetBand(graph, ascendantId, targetId);
  return { cost: dominionScaledCost(base, band, live), base, band };
}

/**
 * The resolution `sphereFactor` for a step: the target's band for a **player** cast
 * only — a mortal never rolls on the god's band (intent-judge GAP 3). 0 while
 * `DOMINION_PRICES_LIVE` is false; `live` overrides the flag for tests.
 */
export function dominionSphereFactor(
  band: DominionBand,
  source: string | undefined,
  live: boolean = DOMINION_PRICES_LIVE,
): number {
  if (!live || source !== 'player') return 0;
  const f = DOMINION_SPHERE_FACTOR[band] ?? 0;
  return Math.min(DOMINION_SPHERE_FACTOR_MAX, Math.max(DOMINION_SPHERE_FACTOR_MIN, f));
}

/** One thread's yield line, for the essence ledger, the readout and the trace. */
export interface ThreadYieldLine {
  targetId: string;
  tier: number;
  band: DominionBand;
  yield: number;
}

/**
 * Thread yield by tier and band: Σ ESSENCE_PER_THREAD_BY_TIER[tier] × multiplier[band
 * of the mortal]. A location thread reads its place. Shared by `computeEssenceGeneration`
 * and the essence-bar readout so the ledger and the words agree (PC-6).
 */
export function computeThreadYield(graph: WorldGraph, ascendantId: string): { total: number; lines: ThreadYieldLine[] } {
  const lines: ThreadYieldLine[] = [];
  let total = 0;
  for (const e of graph.getOutgoingEdges(ascendantId, 'thread')) {
    const rawTier = Math.round(Number(e.properties?.tier ?? 0));
    const tier = Math.min(ESSENCE_PER_THREAD_BY_TIER.length - 1, Math.max(0, Number.isFinite(rawTier) ? rawTier : 0));
    const band = dominionOf(graph, ascendantId, e.target).band;
    const y = (ESSENCE_PER_THREAD_BY_TIER[tier] ?? 0) * (DOMINION_THREAD_YIELD_MULTIPLIER[band] ?? 1);
    total += y;
    lines.push({ targetId: e.target, tier, band, yield: y });
  }
  return { total, lines };
}

/** Typed-source income multiplier for a host place (par when unreadable). */
export function sourceIncomeMultiplier(graph: WorldGraph, ascendantId: string, hostId: string): number {
  const band = dominionOf(graph, ascendantId, hostId).band;
  return DOMINION_SOURCE_INCOME_MULTIPLIER[band] ?? 1;
}

/**
 * Shift Dominion's break sphere at a place: the bought sphere whose opposing pole
 * weighs most there (points × pair weight × opposite score). With no opposing pole
 * standing, the primary (largest buy) — the push then simply builds. Null with no
 * bought vector or an unreadable place.
 */
export function shiftBreakSphere(graph: WorldGraph, ascendantId: string, placeId: string): SphereName | null {
  const points = godSpherePoints(graph, ascendantId);
  const { scores } = dominionObjectScores(graph, placeId);
  let best: SphereName | null = null;
  let bestWeight = 0;
  let primary: SphereName | null = null;
  let primaryPoints = 0;
  for (const s of SPHERE_NAMES) {
    const p = points[s] ?? 0;
    if (p <= 0) continue;
    if (p > primaryPoints) { primary = s; primaryPoints = p; }
    const opp = SPHERE_OPPOSITES[s];
    const w = opp && scores ? p * (DOMINION_OPPOSITION_WEIGHT[s] ?? 0) * (Number(scores[opp]) || 0) : 0;
    if (w > bestWeight) { best = s; bestWeight = w; }
  }
  if (!scores) return null;
  return best ?? primary;
}

// ─── The god's attunement (THR-1765) ─────────────────────────────────

/** How many `DOMINION_ATTUNEMENT_MARKS` an earned total has reached. THR-1811 reads this. */
export function attunementMarksReached(earned: number): number {
  let n = 0;
  for (const m of DOMINION_ATTUNEMENT_MARKS) if (earned >= m) n++;
  return n;
}

/**
 * The one accessor for THR-1811's rungs: marks crossed in `sphere`, from the run-long
 * essence-earned counter. 0 for an unbought sphere (marks only attune bought spheres).
 */
export function getAttunementMarksCrossed(
  state: { graph: WorldGraph; ascendantId: string; essenceEarnedBySphere?: Partial<Record<SphereName, number>> },
  sphere: SphereName,
): number {
  const points = godSpherePoints(state.graph, state.ascendantId);
  if ((points[sphere] ?? 0) <= 0) return 0;
  return attunementMarksReached(Number(state.essenceEarnedBySphere?.[sphere]) || 0);
}
