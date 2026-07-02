import type { ReachDomain } from './traits';
import { REACH_DOMAINS } from './traits';
import type { ValuePair } from './agent';
import { REACH_VALUE_PAIR } from './agent';

/**
 * Canonical axis registry (THR-536 / THR-525 split 525a).
 *
 * A single source of truth mapping each of the 8 Reaches to its moral axis:
 * a stable axis id, the legacy `AxiologicalProfile` ValuePair storage key, and
 * the virtue/vice pole labels (role + plain behavioral word) from the THR-524
 * approved vocabulary.
 *
 * ## Canonical scale
 *
 * Downstream consumers (origin vignettes, drift, threshold/announce) read a
 * single normalized scalar per axis on the canonical scale:
 *
 *   **0–1, where 0.5 is neutral, the virtue pole = 1.0, and the vice pole = 0.0.**
 *
 * (This module only *documents* the scale and *labels* the poles; it stores no
 * agent positions and performs no migration. Collapsing the legacy ±1
 * `AxiologicalProfile` / `ArchetypeDrift` representations onto this 0–1 scale is
 * THR-537/538's job — see `Docs/plans/2026-06-29-agent-personality-moral-drift.md`.)
 *
 * ## Vocabulary is the NEW (THR-524) set
 *
 * The pole labels here are the THR-524-approved vocabulary, which deliberately
 * differs from the OLD `ARCHETYPE_NAMES` table still in `agent.ts` (Mender,
 * Confessor, Archivist, Seeker, Guardian, Martyr, …). This slice is additive:
 * it does NOT rename or retire the old names — 525b owns that reconciliation.
 *
 * Two terms relocate across reaches in the new vocabulary and are encoded here
 * at their NEW reaches: `Seer` (Veil → Eye) and `Manipulator` (Veil → Shadow).
 *
 * The `valuePair` field is a legacy bridge sourced directly from the real
 * `REACH_VALUE_PAIR` keys in `agent.ts` (never invented) so 525b can migrate
 * each reference safely without a blind find/replace.
 */

/** Which side of an axis a pole label refers to. */
export type AxisPoleSide = 'virtue' | 'vice';

/** A single pole of a moral axis: its archetype role and the plain behavioral word. */
export interface AxisPole {
  /** Archetype role name, e.g. 'Protector'. */
  readonly role: string;
  /** Plain behavioral word usable in prose, e.g. 'Brave'. */
  readonly word: string;
}

/** One canonical moral axis — exactly one per Reach. */
export interface CanonicalAxis {
  /** The Reach this axis belongs to. */
  readonly reachDomain: ReachDomain;
  /**
   * Stable canonical axis id. Convention: `${reachDomain}_axis` — one per reach,
   * derivable from the reach, and distinct from the bare reach value so an
   * "axis" is never confused with a "reach".
   */
  readonly axisId: string;
  /**
   * Legacy bridge: the existing `AxiologicalProfile` ValuePair storage key for
   * this reach. Sourced from `REACH_VALUE_PAIR` (`agent.ts`), not invented.
   */
  readonly valuePair: ValuePair;
  /** Virtue pole (canonical position 1.0). */
  readonly virtue: AxisPole;
  /** Vice pole (canonical position 0.0). */
  readonly vice: AxisPole;
}

/** Canonical neutral position on the 0–1 axis scale. */
export const AXIS_NEUTRAL = 0.5;
/** Canonical virtue-pole position on the 0–1 axis scale. */
export const AXIS_VIRTUE = 1.0;
/** Canonical vice-pole position on the 0–1 axis scale. */
export const AXIS_VICE = 0.0;

/** Build the stable axis id for a reach. */
const axisIdForReach = (reach: ReachDomain): string => `${reach}_axis`;

/**
 * The 8 canonical axes, one per Reach, in `REACH_DOMAINS` order.
 * Pole labels are the THR-524-approved vocabulary (see module doc).
 */
export const CANONICAL_AXES: readonly CanonicalAxis[] = [
  {
    reachDomain: 'iron',
    axisId: axisIdForReach('iron'),
    valuePair: REACH_VALUE_PAIR.iron,
    virtue: { role: 'Protector', word: 'Brave' },
    vice: { role: 'Conqueror', word: 'Power-Hungry' },
  },
  {
    reachDomain: 'gold',
    axisId: axisIdForReach('gold'),
    valuePair: REACH_VALUE_PAIR.gold,
    virtue: { role: 'Patron', word: 'Generous' },
    vice: { role: 'Extractor', word: 'Greedy' },
  },
  {
    reachDomain: 'shadow',
    axisId: axisIdForReach('shadow'),
    valuePair: REACH_VALUE_PAIR.shadow,
    virtue: { role: 'Broker', word: 'Fair' },
    vice: { role: 'Manipulator', word: 'Scheming' }, // Manipulator relocated Veil → Shadow (THR-524)
  },
  {
    reachDomain: 'veil',
    axisId: axisIdForReach('veil'),
    valuePair: REACH_VALUE_PAIR.veil,
    virtue: { role: 'Weaver', word: 'Patient' },
    vice: { role: 'Unraveller', word: 'Impatient' },
  },
  {
    reachDomain: 'heart',
    axisId: axisIdForReach('heart'),
    valuePair: REACH_VALUE_PAIR.heart,
    virtue: { role: 'Sworn', word: 'Loyal' },
    vice: { role: 'Renegade', word: 'Disloyal' },
  },
  {
    reachDomain: 'eye',
    axisId: axisIdForReach('eye'),
    valuePair: REACH_VALUE_PAIR.eye,
    virtue: { role: 'Seer', word: 'Perceptive' }, // Seer relocated Veil → Eye (THR-524)
    vice: { role: 'Inquisitor', word: 'Judgemental' },
  },
  {
    reachDomain: 'stone',
    axisId: axisIdForReach('stone'),
    valuePair: REACH_VALUE_PAIR.stone,
    virtue: { role: 'Keeper', word: 'Dependable' },
    vice: { role: 'Destroyer', word: 'Reckless' },
  },
  {
    reachDomain: 'star',
    axisId: axisIdForReach('star'),
    valuePair: REACH_VALUE_PAIR.star,
    // Star re-scoped (THR-545): wayfinding/fate, not inner outlook. The inner
    // outlook (Hopeful↔Bitter) moved to the Core layer; Star's reach axis now
    // points at its real domain — guiding others' journeys vs leading them astray.
    virtue: { role: 'Beacon', word: 'Guiding' },
    vice: { role: 'Wrecker', word: 'Misleading' },
  },
];

// ─── Lookup indexes (built once at module load) ─────────────────────────────

const AXIS_BY_REACH: Record<ReachDomain, CanonicalAxis> = CANONICAL_AXES.reduce(
  (acc, axis) => {
    acc[axis.reachDomain] = axis;
    return acc;
  },
  {} as Record<ReachDomain, CanonicalAxis>,
);

const AXIS_BY_ID: ReadonlyMap<string, CanonicalAxis> = new Map(
  CANONICAL_AXES.map((axis) => [axis.axisId, axis]),
);

const AXIS_BY_VALUE_PAIR: ReadonlyMap<ValuePair, CanonicalAxis> = new Map(
  CANONICAL_AXES.map((axis) => [axis.valuePair, axis]),
);

// ─── Helper getters ─────────────────────────────────────────────────────────

/**
 * Get the canonical axis for a reach. Total over `ReachDomain` — every reach has
 * exactly one axis, so this never returns undefined.
 */
export function getAxisByReach(reach: ReachDomain): CanonicalAxis {
  return AXIS_BY_REACH[reach];
}

/** Get the canonical axis by its stable axis id, or undefined if unknown. */
export function getAxisById(axisId: string): CanonicalAxis | undefined {
  return AXIS_BY_ID.get(axisId);
}

/**
 * Look up a pole label (role + word) for a given axis id and side.
 * Returns undefined if the axis id is unknown.
 */
export function getPoleLabel(axisId: string, side: AxisPoleSide): AxisPole | undefined {
  const axis = AXIS_BY_ID.get(axisId);
  if (!axis) return undefined;
  return side === 'virtue' ? axis.virtue : axis.vice;
}

/** Get the canonical axis for a legacy `AxiologicalProfile` ValuePair key, or undefined. */
export function getAxisByValuePair(valuePair: ValuePair): CanonicalAxis | undefined {
  return AXIS_BY_VALUE_PAIR.get(valuePair);
}

/**
 * The canonical drift/threshold storage key for a reach — the single naming site
 * for the moral-axis `axisId`. Returns the canonical axis id (`${reach}_axis`)
 * for the 8 moral reaches, and passes any non-moral reach through unchanged
 * (e.g. `'quintessence'`, which has no moral axis and whose drift entries no axis
 * reader consumes). Use this everywhere the drift accumulator / threshold layer
 * needs an `axisId`, instead of passing a bare reach or an ad-hoc string (THR-559).
 */
export function reachToAxisId(reach: string): string {
  const axis = AXIS_BY_REACH[reach as ReachDomain];
  return axis ? axis.axisId : reach;
}

/**
 * Reverse of {@link reachToAxisId}: the reach that owns a canonical axis id, or
 * undefined if the id is unknown (fail-soft — callers skip unknown axes).
 */
export function axisIdToReach(axisId: string): ReachDomain | undefined {
  return AXIS_BY_ID.get(axisId)?.reachDomain;
}

/** All canonical axis ids, in `REACH_DOMAINS` order. */
export const CANONICAL_AXIS_IDS: readonly string[] = REACH_DOMAINS.map(axisIdForReach);

// ─── Canonical scale conversion (THR-559) ───────────────────────────────────
//
// The moral-axis scalar has one canonical *author/UI* scale — **0–1, 0.5
// neutral, virtue 1.0, vice 0.0** (see the module doc). Internal engine storage
// (`AxiologicalProfile`, `ArchetypeDrift`) remains on the legacy **signed ±1**
// scale (virtue +1, vice −1) — the grey-zone in the personality plan explicitly
// permits signed internal storage as long as the canonical author/UI scale is
// 0–1. These two functions are the single, canonical bridge between the scales;
// every place that needs the 0–1 view converts here rather than open-coding
// `0.5 + 0.5 * v` (which previously lived duplicated in `personalityTraitEmerge`).

/** Convert a signed ±1 axis value (virtue +1, vice −1) to the canonical 0–1 scale (0.5 neutral). */
export function signedToCanonical01(signed: number): number {
  const v = 0.5 + 0.5 * signed;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Convert a canonical 0–1 axis value (0.5 neutral) back to the signed ±1 scale. */
export function canonical01ToSigned(canonical: number): number {
  const v = 2 * canonical - 1;
  return v < -1 ? -1 : v > 1 ? 1 : v;
}
