/**
 * Economic context — the world's story response to prosperity (THR-725).
 *
 * Pure, deterministic reads over settlement prosperity — and, since THR-2040, over the
 * settlement's larder (famine / glut, {@link readLarder}). Two consumers:
 *   - `encounterScoring.ts` — {@link computeEconomicContextBonus} bends which scenes fire.
 *   - `proseEnrichment.ts` — {@link resolveEconomicMood} colours how they read.
 *
 * All tuning lives in `src/data/economic-scene-affinity.ts`; this file is the math only
 * (NFP #1). No PRNG anywhere (NFP #3). Every failure path returns the neutral value rather
 * than throwing (NFP #4) — an unresolvable settlement is simply an economically silent one.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import { isHungryToday } from './unrestPressure/hunger';
import { HUNGER_DAYS_PROP } from './unrestPressure/inputs';
import { readResources } from './resourceEconomy';
import { getResourceClass } from '../data/resource-classes';
import {
  ECON_BOOM_THRESHOLD,
  ECON_BUST_THRESHOLD,
  ECON_SCORING_CAP,
  ECON_SCORING_WEIGHT,
  ECONOMIC_MOOD_VOCABULARY,
  FAMINE_FULL_DAYS,
  LARDER_SCORING_CAP,
  LARDER_SCORING_WEIGHT,
  PLENTY_BALANCE_FLOOR,
  PLENTY_MIN_SURPLUS_DAYS,
  STOCK_TIER_FAMINE_DEVIATION,
  STOCK_TIER_GLUT_DEVIATION,
  getEconomicSceneAffinity,
} from '../data/economic-scene-affinity';

/** Prosperity scale ceiling — `phaseProsperity` clamps the property to 0–100. */
const PROSPERITY_MAX = 100;

/** Which side of the neutral band a settlement sits on. `null` = inside the band. */
export type EconomicPolarity = 'boom' | 'bust';

/** A settlement's economic reading, normalized for use as a scoring/prose input. */
export interface EconomicReading {
  readonly prosperity: number;
  readonly polarity: EconomicPolarity | null;
  /**
   * Distance outside the neutral band, normalized to [0, 1]: 0 at the threshold itself,
   * 1 at the far end of the scale (prosperity 100 for boom, 0 for bust).
   */
  readonly deviation: number;
}

/** The neutral reading — what every fail-soft path returns. */
const NEUTRAL_READING: EconomicReading = { prosperity: 0, polarity: null, deviation: 0 };

/**
 * Read a numeric `prosperity` off a node's property bag.
 * Fail-soft: absent, non-numeric, or NaN → `null` (caller treats as neutral).
 */
function readProsperity(node: GraphNode | undefined | null): number | null {
  const raw = node?.properties?.prosperity;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  return raw;
}

/**
 * Resolve the prosperity that governs a location, walking one tier up when needed.
 *
 * The three-tier position model means an encounter can sit on a sublocation (a tavern
 * inside a town); prosperity lives on the settlement. A sublocation therefore resolves
 * through `parentLocationId` to its parent. Bounded to a single hop on purpose — the
 * position model nests exactly one level, and an unbounded walk here would run per
 * scored candidate.
 *
 * Fail-soft: no node, no prosperity anywhere up the chain → `null`.
 */
export function resolveGoverningProsperity(
  graph: WorldGraph,
  locationId: string | undefined,
): number | null {
  if (!locationId) return null;
  const node = graph.getNode(locationId);
  if (!node) return null;

  const own = readProsperity(node);
  if (own !== null) return own;

  const parentId = node.properties?.parentLocationId;
  if (typeof parentId !== 'string' || parentId === '') return null;
  return readProsperity(graph.getNode(parentId));
}

/**
 * Classify a prosperity value into polarity + normalized deviation outside the neutral band.
 * Inside `[ECON_BUST_THRESHOLD, ECON_BOOM_THRESHOLD]` the world is economically unremarkable
 * and says nothing.
 */
export function readEconomy(prosperity: number | null): EconomicReading {
  if (prosperity === null || !Number.isFinite(prosperity)) return NEUTRAL_READING;

  if (prosperity > ECON_BOOM_THRESHOLD) {
    const span = PROSPERITY_MAX - ECON_BOOM_THRESHOLD;
    const deviation = span > 0 ? Math.min(1, (prosperity - ECON_BOOM_THRESHOLD) / span) : 1;
    return { prosperity, polarity: 'boom', deviation };
  }

  if (prosperity < ECON_BUST_THRESHOLD) {
    const span = ECON_BUST_THRESHOLD;
    const deviation = span > 0 ? Math.min(1, (ECON_BUST_THRESHOLD - prosperity) / span) : 1;
    return { prosperity, polarity: 'bust', deviation };
  }

  return { prosperity, polarity: null, deviation: 0 };
}

/**
 * The additive scoring term: how much this settlement's economy wants *this* kind of scene.
 *
 * Signed — a family may be repelled by the polarity it is listed against (a festival in a
 * famine scores lower, which is the point). Capped at ±`ECON_SCORING_CAP` so a destitute
 * province cannot drown every other signal in the pipeline.
 *
 * Fail-soft: unresolvable prosperity, neutral band, or a family with no authored row → 0.
 *
 * Performance (NFP #7): callers pass the location node they have *already* resolved for
 * scoring; this function performs no graph walk of its own.
 */
export function computeEconomicContextBonus(
  prosperity: number | null,
  templateId: string,
): number {
  const reading = readEconomy(prosperity);
  if (reading.polarity === null) return 0;

  const affinity = getEconomicSceneAffinity(templateId);
  if (!affinity) return 0;

  const weight = reading.polarity === 'boom' ? affinity.boomWeight : affinity.bustWeight;
  if (weight === 0) return 0;

  const raw = ECON_SCORING_WEIGHT * reading.deviation * weight;
  return Math.max(-ECON_SCORING_CAP, Math.min(ECON_SCORING_CAP, raw));
}

// ─── Larder: famine and glut (THR-2040) ──────────────────────────────────────

/** Which way a settlement's larder leans. `null` = neither hungry nor glutted. */
export type LarderState = 'famine' | 'glut';

/** A settlement's larder reading, normalized for use as a scoring input. */
export interface LarderReading {
  readonly state: LarderState | null;
  /** Depth of the famine or glut, in [0, 1]. 0 whenever `state` is null. */
  readonly deviation: number;
}

const NEUTRAL_LARDER: LarderReading = { state: null, deviation: 0 };

function finiteNumber(raw: unknown): number | null {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}

/** Fallback glut test with no food store: any staple at the `surplus` stock tier. */
function hasSurplusStaple(settlement: GraphNode): boolean {
  return Object.entries(readResources(settlement.properties ?? {})).some(
    ([rid, r]) => r.stockTier === 'surplus' && getResourceClass(rid).category === 'staple',
  );
}

/**
 * Read a settlement's larder (THR-2040).
 *
 * **Famine** is the town's existing hunger — `isHungryToday`, the same reading its Fortunes
 * sentence and unrest use, so there is no second hunger test to disagree with them. With
 * the settlement economy live, depth grows with `hungerDays`: 1/`FAMINE_FULL_DAYS` on the
 * first day, 1 from the fifth. On the stock-tier fallback it is a fixed depth.
 *
 * **Glut** is grain with nowhere to go: a run of `PLENTY_MIN_SURPLUS_DAYS` surplus days at a
 * food balance of at least `PLENTY_BALANCE_FLOOR`, grading in from 0 at the floor. Without a
 * food store, a surplus staple reads as a fixed-depth glut.
 *
 * A sublocation reads its settlement through one `parentLocationId` hop, as
 * {@link resolveGoverningProsperity} does. Pure, no PRNG; every missing-data path is neutral.
 */
export function readLarder(graph: WorldGraph, locationId: string | undefined): LarderReading {
  if (!locationId) return NEUTRAL_LARDER;
  let node = graph.getNode(locationId);
  if (!node) return NEUTRAL_LARDER;
  const parentId = node.properties?.parentLocationId;
  if (typeof parentId === 'string' && parentId !== '') {
    const parent = graph.getNode(parentId);
    if (!parent) return NEUTRAL_LARDER;
    node = parent;
  }
  return readSettlementLarder(node);
}

/** {@link readLarder} on an already-resolved settlement node. */
export function readSettlementLarder(settlement: GraphNode): LarderReading {
  const props = settlement.properties ?? {};
  const hunger = isHungryToday(settlement);

  if (hunger.source === 'settlement_economy') {
    if (hunger.hungry) {
      const days = Math.max(1, finiteNumber(props[HUNGER_DAYS_PROP]) ?? 0);
      const deviation = FAMINE_FULL_DAYS > 0 ? Math.min(1, days / FAMINE_FULL_DAYS) : 1;
      return { state: 'famine', deviation };
    }
    const surplusDays = finiteNumber(props.foodSurplusDays);
    const balance = finiteNumber(props.foodBalance);
    if (surplusDays === null || balance === null) return NEUTRAL_LARDER;
    if (surplusDays < PLENTY_MIN_SURPLUS_DAYS || balance < PLENTY_BALANCE_FLOOR) return NEUTRAL_LARDER;
    const span = 1 - PLENTY_BALANCE_FLOOR;
    const deviation = span > 0 ? Math.min(1, (balance - PLENTY_BALANCE_FLOOR) / span) : 1;
    return { state: 'glut', deviation };
  }

  // Stock-tier fallback: no numeric food store (settlement economy off, or an old save).
  if (hunger.hungry) return { state: 'famine', deviation: STOCK_TIER_FAMINE_DEVIATION };
  if (hasSurplusStaple(settlement)) return { state: 'glut', deviation: STOCK_TIER_GLUT_DEVIATION };
  return NEUTRAL_LARDER;
}

/**
 * The additive larder scoring term: how much this settlement's hunger or plenty wants
 * *this* kind of scene. Mirrors {@link computeEconomicContextBonus}, but stays a separate
 * term so the trace can tell poverty from hunger.
 *
 * Fail-soft: a neutral larder, or a family with no famine/glut weight → 0.
 */
export function computeLarderContextBonus(reading: LarderReading, templateId: string): number {
  if (reading.state === null || reading.deviation <= 0) return 0;

  const affinity = getEconomicSceneAffinity(templateId);
  if (!affinity) return 0;

  const weight = (reading.state === 'famine' ? affinity.famineWeight : affinity.glutWeight) ?? 0;
  if (weight === 0) return 0;

  const raw = LARDER_SCORING_WEIGHT * reading.deviation * weight;
  return Math.max(-LARDER_SCORING_CAP, Math.min(LARDER_SCORING_CAP, raw));
}

// ─── Prose coloration ────────────────────────────────────────────────────────

/** Boom/bust vocabulary bound for one scene. Absent fields mean "the token strips". */
export interface EconomicMoodBinding {
  readonly polarity: EconomicPolarity;
  readonly adj: string;
  readonly noun: string;
  readonly atmosphere: string;
}

/**
 * Deterministic index into a vocabulary list.
 *
 * Same scene, same words, every run (NFP #3) — the index is a pure function of the
 * location id, so a settlement keeps a consistent economic voice rather than reshuffling
 * its own mood on every render.
 */
function pickIndex(seedKey: string, length: number, salt: number): number {
  if (length <= 0) return 0;
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seedKey.length; i++) {
    h ^= seedKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % length;
}

/**
 * Resolve the boom/bust vocabulary for a scene at the given location.
 *
 * Returns `null` inside the neutral band — the `{econ_*}` tokens then strip silently,
 * exactly as `{intel:*}` does without a view, so authored prose never reads worse than it
 * does today.
 */
export function resolveEconomicMood(
  graph: WorldGraph,
  locationId: string | undefined,
): EconomicMoodBinding | null {
  const reading = readEconomy(resolveGoverningProsperity(graph, locationId));
  if (reading.polarity === null) return null;

  const vocab = ECONOMIC_MOOD_VOCABULARY[reading.polarity];
  const key = locationId ?? '';
  return {
    polarity: reading.polarity,
    adj: vocab.adjectives[pickIndex(key, vocab.adjectives.length, 1)] ?? '',
    noun: vocab.nouns[pickIndex(key, vocab.nouns.length, 2)] ?? '',
    atmosphere: vocab.atmospheres[pickIndex(key, vocab.atmospheres.length, 3)] ?? '',
  };
}
