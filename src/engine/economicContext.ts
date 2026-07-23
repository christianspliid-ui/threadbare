/**
 * Economic context — the world's story response to prosperity (THR-725).
 *
 * Pure, deterministic reads over settlement prosperity. Two consumers:
 *   - `encounterScoring.ts` — {@link computeEconomicContextBonus} bends which scenes fire.
 *   - `proseEnrichment.ts` — {@link resolveEconomicMood} colours how they read.
 *
 * All tuning lives in `src/data/economic-scene-affinity.ts`; this file is the math only
 * (NFP #1). No PRNG anywhere (NFP #3). Every failure path returns the neutral value rather
 * than throwing (NFP #4) — an unresolvable settlement is simply an economically silent one.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import {
  ECON_BOOM_THRESHOLD,
  ECON_BUST_THRESHOLD,
  ECON_SCORING_CAP,
  ECON_SCORING_WEIGHT,
  ECONOMIC_MOOD_VOCABULARY,
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
