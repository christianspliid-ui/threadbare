/**
 * Reach Signature Content — sphere-power scaling constants.
 *
 * The general "most divine actions scale effect + cost with sphere power" tunables.
 * Reusable, not signature-specific (Christian, 2026-06-30) — reach signatures and any
 * other sphere-gated effect compose against these.
 *
 * THR-548 seeded the file with the sphere-power scaling constants. THR-549 adds
 * the SignatureMatrix / individualization layer below — the (reach × sphere)
 * resolver every reach signature composes against.
 *
 * Plan: Docs/plans/2026-06-30-ascendant-reach-signatures.md §3.2, §3.3, §3.8, §2
 */

import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import type { CreationSphereName } from '../types/index';
import { CREATION_SPHERE_NAMES } from '../types/index';
import type { AttachmentEffect } from '../types/effects';
import { SPHERE_EFFECT_TABLE } from '../engine/ascendantPrimitives';

// ─── Sphere-Power Scaling (NFP #1: Tunability) ────────────────────

/**
 * Effect/cost multiplier at sphere score 0 — actions at no sphere mastery.
 * Below 1.0: a weak-sphere action produces a diminished effect (but cost is floored
 * at base by `scaledCost`, so low power is never a discount).
 */
export const SIGNATURE_SCALE_FLOOR = 0.6;

/**
 * Effect/cost multiplier at MAX_SPHERE_SCORE — actions at full sphere mastery.
 * Above 1.0: a maxed-sphere action produces a larger effect at a higher cost.
 */
export const SIGNATURE_SCALE_CEIL = 2.0;

// ═══════════════════════════════════════════════════════════════════════════
// Reach-Signature Individualization (THR-549)
//
// A reach signature is the ascendant's headline divine action for a Reach. The
// *individualization layer* makes a signature read differently per Creation
// Sphere: same Reach, different primary Sphere → a distinct name, prose, and a
// unique twist on the effect. The (reach × primarySphere) pair is fixed for a
// run under the two-domain lock (every ascendant has exactly one primary +
// one secondary reach, see project_ascendant_two_domains), so the cell a player
// lands on MUST always produce a real signature — never an empty card. That is
// the correctness property this layer guarantees via a composed default per
// reach: bespoke cells are authored later (THR-550..552 + content issues),
// every un-authored cell still resolves to a non-null individualization.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The individualization bar (Christian, 2026-06-30): a signature is genuinely
 * *individual* only when it carries BOTH a named effect with numbers AND a
 * unique trigger — not merely a bigger version of a generic card. SphereTwistSpec
 * is exactly that delta: the part that distinguishes a (reach × sphere) cell
 * from its reach's composed default.
 */
export interface SphereTwistSpec {
  /** Stable id, e.g. `signature.iron.force`. Used for traces + prose enrichment. */
  readonly id: string;
  /**
   * The unique trigger/condition half of the bar — the part that is *not* just
   * "bigger numbers". A prose-grade description of when the twist fires; the
   * runtime predicate (`when?: EffectPredicate`) is wired by the per-signature
   * effect issues (THR-550..552). This data layer only declares the intent.
   */
  readonly trigger: string;
  /**
   * The named-effect-with-numbers half of the bar — the payload delta layered on
   * top of the reach base. Generic effects so any signature card can apply them.
   */
  readonly payload: readonly AttachmentEffect[];
}

/**
 * One (reach × sphere) signature cell: the twist plus the cosmetic
 * individualization (name fragment woven into the card title, prose enrichment
 * key). Resolved via {@link resolveSignatureIndividualization}.
 */
export interface SignatureIndividualization {
  readonly twist: SphereTwistSpec;
  /** Woven into the signature card's display name (e.g. "Warhost of Force"). */
  readonly nameFragment: string;
  /** Enrichment lookup key for the prose pipeline. */
  readonly proseKey: string;
}

/**
 * The sparse authored matrix. Bespoke per-cell content lands in the authoring
 * issues; every empty cell falls back to {@link composeDefaultSignature}. Kept
 * a full `Record<ReachDomain, …>` (all eight reaches present, values empty) so
 * the resolver's reach lookup is always defined.
 */
export type SignatureMatrix = Record<ReachDomain, Partial<Record<CreationSphereName, SignatureIndividualization>>>;

/**
 * Base value for a composed-default signature's reach passive (NFP #1). Bespoke
 * cells override with their own authored numbers; this is the floor a default
 * card delivers so it is never mechanically empty.
 */
export const SIGNATURE_DEFAULT_BASE_VALUE = 3;

/** Per-reach default name stem, prose stem, and characteristic trigger phrase. */
interface ReachSignatureDefault {
  /** Name stem; the sphere is appended ("{stem} of {Sphere}"). */
  readonly nameStem: string;
  /** Prose-key stem; the sphere is appended ("{stem}.{sphere}"). */
  readonly proseStem: string;
  /** The reach's characteristic activation condition (the default's trigger). */
  readonly trigger: string;
}

/**
 * The composed-default seed per reach. Eight entries — one per ReachDomain — so
 * every reach has a non-null default. Name stems echo the reach flavor used by
 * CHOSEN_POWER_TABLE (ascendantPrimitives) and the authored signatures
 * (THR-550 Iron/Warhost, THR-551 Veil/Rend-the-Gate, THR-552 Stone/Great-Work).
 */
export const REACH_SIGNATURE_DEFAULTS: Record<ReachDomain, ReachSignatureDefault> = {
  iron: {
    nameStem: 'Warhost',
    proseStem: 'signature.iron.default',
    trigger: 'when the chosen faction enters or escalates a conflict',
  },
  gold: {
    nameStem: 'Charter',
    proseStem: 'signature.gold.default',
    trigger: 'when the target accrues, trades, or invests wealth',
  },
  shadow: {
    nameStem: 'Veiled Hand',
    proseStem: 'signature.shadow.default',
    trigger: 'when the action passes unobserved',
  },
  veil: {
    nameStem: 'Rent Gate',
    proseStem: 'signature.veil.default',
    trigger: 'at a boundary between planes or hidden places',
  },
  heart: {
    nameStem: 'Hallowed Creed',
    proseStem: 'signature.heart.default',
    trigger: 'when devotion is professed or a bond deepens',
  },
  eye: {
    nameStem: 'Revelation',
    proseStem: 'signature.eye.default',
    trigger: 'when knowledge is revealed or a secret uncovered',
  },
  stone: {
    nameStem: 'Great Work',
    proseStem: 'signature.stone.default',
    trigger: 'when something enduring is built or fortified',
  },
  star: {
    nameStem: 'Fated Decree',
    proseStem: 'signature.star.default',
    trigger: 'when fate turns or an omen is read',
  },
};

/** Empty authored matrix — all reaches present, no bespoke cells yet (skeleton). */
export const SIGNATURE_MATRIX: SignatureMatrix = {
  iron: {}, gold: {}, shadow: {}, veil: {}, heart: {}, eye: {}, stone: {}, star: {},
};

/** Title-case a lowercase sphere name for display ("force" → "Force"). */
function titleCaseSphere(sphere: CreationSphereName): string {
  return sphere.charAt(0).toUpperCase() + sphere.slice(1);
}

/**
 * Build a composed-default individualization for a reach × sphere pair when no
 * bespoke cell is authored. Composes against the shipped `sphere_flavored_effect`
 * primitive (THR-509): the reach's base passive plus the sphere's flavored
 * passive when {@link SPHERE_EFFECT_TABLE} carries one. Creation spheres without
 * a table entry (`time`, `entropy`) still yield a real payload from the reach
 * base alone — so the result is never mechanically empty.
 *
 * Pure + deterministic (no PRNG, no graph): same inputs → same individualization.
 */
export function composeDefaultSignature(
  reach: ReachDomain,
  sphere: CreationSphereName,
): SignatureIndividualization {
  const base = REACH_SIGNATURE_DEFAULTS[reach];
  const basePayload: AttachmentEffect = { type: 'passive', reach, value: SIGNATURE_DEFAULT_BASE_VALUE };
  // CreationSphereName ⊂ SphereName, so the table lookup is well-typed; `time`
  // and `entropy` simply have no entry → spherePayload is empty.
  const spherePayload = SPHERE_EFFECT_TABLE[sphere] ?? [];
  return {
    twist: {
      id: `${base.proseStem}.${sphere}`,
      trigger: base.trigger,
      payload: [basePayload, ...spherePayload],
    },
    nameFragment: `${base.nameStem} of ${titleCaseSphere(sphere)}`,
    proseKey: `${base.proseStem}.${sphere}`,
  };
}

/**
 * Resolve the signature individualization for a reach × primary-sphere pair.
 * Returns the bespoke authored cell when present, otherwise a composed default.
 * Guaranteed non-null for every (ReachDomain × CreationSphereName) pair — the
 * never-an-empty-card correctness property under the two-domain lock.
 */
export function resolveSignatureIndividualization(
  reach: ReachDomain,
  primarySphere: CreationSphereName,
): SignatureIndividualization {
  return SIGNATURE_MATRIX[reach]?.[primarySphere] ?? composeDefaultSignature(reach, primarySphere);
}

/** All ReachDomains — re-exported for consumers iterating the signature space. */
export { REACH_DOMAINS };
/** All Creation Sphere names — re-exported for consumers iterating the matrix. */
export { CREATION_SPHERE_NAMES };
